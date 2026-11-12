"""Bake film-and-print colour lookup tables from the spektrafilm profile data.

This is our own simplified spectral pipeline. It reads only the JSON profiles
(spectral sensitivities, dye densities, density curves), which Andrea Volpato
publishes under CC BY-SA 4.0. It does not import or run spektrafilm code.

    python3 -I bake_luts.py <profiles_dir> <out_dir>
"""
import json, sys, os
import numpy as np
from PIL import Image

PROF, OUT = sys.argv[1], sys.argv[2]
WL = np.arange(380, 781, 5.0)
N = 33

def g(l, mu, s1, s2):
    return np.exp(-0.5 * ((l - mu) / np.where(l < mu, s1, s2)) ** 2)
# CIE 1931 colour matching functions, multi-lobe Gaussian fit (Wyman, Sloan, Shirley 2013)
CMF = np.stack([
    1.056 * g(WL, 599.8, 37.9, 31.0) + 0.362 * g(WL, 442.0, 16.0, 26.7) - 0.065 * g(WL, 501.1, 20.4, 26.2),
    0.821 * g(WL, 568.8, 46.9, 40.5) + 0.286 * g(WL, 530.9, 16.3, 31.1),
    1.217 * g(WL, 437.0, 11.8, 36.0) + 0.681 * g(WL, 459.0, 26.0, 13.8)], 1)

def blackbody(T):
    l = WL * 1e-9
    s = 1.0 / (l ** 5 * (np.exp(1.4388e-2 / (l * T)) - 1.0))
    return s / s.max()
ILL = {'D55': blackbody(5500), 'D50': blackbody(5003), 'T': blackbody(3200), 'TH-KG3': blackbody(3200), 'K75P': blackbody(5400)}
XYZ2RGB_D50 = np.array([[3.1338561, -1.6168667, -0.4906146], [-0.9787684, 1.9161415, 0.0334540], [0.0719453, -0.2289914, 1.4052427]])

# linear sRGB -> smooth reflectance spectrum: three sigmoid bands that sum to one
bB = 1 / (1 + np.exp((WL - 490) / 12.0)); bR = 1 / (1 + np.exp(-(WL - 595) / 14.0)); bG = 1 - bB - bR
BASIS = np.stack([bR, bG, bB], 0)

def arr(x, fill=0.0):
    a = np.array([[fill if v is None else v for v in row] if isinstance(row, list) else (fill if row is None else row) for row in x], float)
    return a
def load(name):
    d = json.load(open(os.path.join(PROF, name + '.json')))
    dd = d['data']
    p = dict(info=d['info'], sens=10 ** arr(dd['log_sensitivity'], -9.0), cd=arr(dd['channel_density']), base=arr(dd['base_density']),
             le=np.array(dd['log_exposure'], float), dc=arr(dd['density_curves']))
    p['sens'][~np.isfinite(p['sens'])] = 0
    return p
def dens(p, logE):                      # logE: (...,3)
    return np.stack([np.interp(logE[..., k], p['le'], p['dc'][:, k]) for k in range(3)], -1)
def spectral_density(p, D):             # (...,3) -> (...,81)
    return D @ p['cd'].T + p['base']
def to_rgb(spec, ill):                  # spectrum of light reaching the eye, relative to the illuminant
    k = (ill * CMF[:, 1]).sum()
    XYZ = (spec * ill) @ CMF / k
    return XYZ @ XYZ2RGB_D50.T

def bake(film, paper=None, cam_ev=0.0):
    F = load(film); ill_f = ILL[F['info']['reference_illuminant']]
    t = np.linspace(0, 1, N); lin = 4 * t ** 2
    R, G, B = np.meshgrid(lin, lin, lin, indexing='ij')           # index [r,g,b]
    rgb = np.stack([R, G, B], -1).reshape(-1, 3)
    grey = np.full((1, 3), 0.18)
    def expose(c):
        refl = c @ BASIS
        E = (refl * ill_f) @ F['sens']
        Eg = (0.18 * ill_f) @ F['sens']
        return np.log10(np.maximum(E / Eg, 1e-9)) + cam_ev * 0.30103
    view = ILL[F['info'].get('viewing_illuminant') or 'D50']
    if F['info']['type'] == 'positive':                           # slide film: look at it directly
        def run(c, off):
            T = 10 ** -spectral_density(F, dens(F, expose(c) + off))
            return to_rgb(T, view)
        lo, hi = -1.5, 1.5
        for _ in range(40):                                       # place mid grey
            m = (lo + hi) / 2
            if run(grey, m)[0, 1] > 0.18 * white_of(F, view): hi = m
            else: lo = m
        out = run(rgb, (lo + hi) / 2) / white_of(F, view)
    else:
        P = load(paper); ill_p = ILL[P['info']['reference_illuminant']]
        pview = ILL[P['info'].get('viewing_illuminant') or 'D50']
        def neg_T(c): return 10 ** -spectral_density(F, dens(F, expose(c)))
        Eg = (neg_T(grey) * ill_p) @ P['sens']                    # paper exposure from the grey patch
        def run(c, Dmid):
            # filter pack: pick the exposure per layer that prints the grey patch to equal densities
            tgt = np.array([np.interp(Dmid, P['dc'][:, k], P['le']) for k in range(3)])
            E = (neg_T(c) * ill_p) @ P['sens']
            D = dens(P, np.log10(np.maximum(E / Eg, 1e-12)) + tgt)
            return to_rgb(10 ** -spectral_density(P, D), pview)
        w = white_of(P, pview)
        lo, hi = 0.05, 2.5
        for _ in range(40):
            m = (lo + hi) / 2
            if run(grey, m)[0, 1] / w > 0.18: lo = m
            else: hi = m
        out = run(rgb, (lo + hi) / 2) / w
    # Our spectra and illuminants are approximations, so the neutral axis drifts. Pull it most of the way back,
    # one curve per channel, and keep a quarter of the stock's own tint.
    gi = np.arange(N); idx = gi * N * N + gi * N + gi
    neu = np.clip(out[idx], 0, None); tgt = neu @ np.array([0.2126, 0.7152, 0.0722])
    for c in range(3):
        x = np.maximum.accumulate(neu[:, c] + np.arange(N) * 1e-9)
        out[:, c] = np.interp(out[:, c], x, 0.75 * tgt + 0.25 * neu[:, c])
    out = np.clip(out, 0, 1)
    enc = np.where(out <= 0.0031308, out * 12.92, 1.055 * out ** (1 / 2.4) - 0.055)
    return (enc.reshape(N, N, N, 3) * 255 + 0.5).astype(np.uint8)

def white_of(p, ill):
    """Luminance of the clearest the material gets, so prints and slides are judged against their own white."""
    D = np.array([[p['dc'][:, k].min() for k in range(3)]])
    return to_rgb(10 ** -spectral_density(p, D), ill)[0, 1]

def save(lut, name):                    # x = r + 33*b, y = g
    img = np.zeros((N, N * N, 3), np.uint8)
    for b in range(N): img[:, b * N:(b + 1) * N, :] = lut[:, :, b, :].transpose(1, 0, 2)
    Image.fromarray(img).save(os.path.join(OUT, name + '.png'), optimize=True)

JOBS = [('gold200_edge', 'kodak_gold_200', 'kodak_ektacolor_edge', 0.3), ('ultramax400_edge', 'kodak_ultramax_400', 'kodak_ektacolor_edge', 0.3),
        ('portra400_endura', 'kodak_portra_400', 'kodak_portra_endura', 0.5), ('ektar100_endura', 'kodak_ektar_100', 'kodak_portra_endura', 0.3),
        ('c200_crystal', 'fujifilm_c200', 'fujifilm_crystal_archive_typeii', 0.3), ('pro400h_crystal', 'fujifilm_pro_400h', 'fujifilm_crystal_archive_typeii', 0.5),
        ('xtra400_crystal', 'fujifilm_xtra_400', 'fujifilm_crystal_archive_typeii', 0.3),
        ('kodachrome64', 'kodak_kodachrome_64', None, 0.0), ('ektachrome100', 'kodak_ektachrome_100', None, 0.0), ('velvia100', 'fujifilm_velvia_100', None, 0.0),
        ('vision500t_2383', 'kodak_vision3_500t', 'kodak_2383', 0.3), ('vision250d_2383', 'kodak_vision3_250d', 'kodak_2383', 0.3)]
if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for name, film, paper, ev in JOBS:
        lut = bake(film, paper, ev); save(lut, name)
        gi = int(round(np.sqrt(0.18 / 4) * (N - 1)))
        print(f'{name:20s} grey->{lut[gi, gi, gi]}  white->{lut[16, 16, 16]}  black->{lut[0, 0, 0]}  red->{lut[16, 4, 4]}  {os.path.getsize(os.path.join(OUT, name + ".png")) // 1024} KB')
