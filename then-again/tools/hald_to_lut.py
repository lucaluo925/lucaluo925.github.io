"""Resample a level-12 HaldCLUT (1728x1728, 144^3) to the site's 33^3 table.
Both axes stay sRGB-encoded, as HaldCLUTs are. Layout matches bake_luts.py:
pixel x = r + 33*b, y = g. Usage: hald_to_lut.py in.png out.png"""
import sys
import numpy as np
from PIL import Image
N = 33
def main(src, dst):
    im = np.asarray(Image.open(src).convert('RGB'), dtype=np.float64)
    side = im.shape[0]; L = round(side ** (1 / 3)); C = L * L          # 12 -> 144
    assert C ** 3 == side * side, 'not a square HaldCLUT'
    cube = im.reshape(C, C, C, 3)                                      # [b, g, r]
    ax = np.linspace(0, C - 1, N); i0 = np.minimum(ax.astype(int), C - 2); f = ax - i0
    def lerp(a, axis):
        lo = np.take(a, i0, axis=axis); hi = np.take(a, i0 + 1, axis=axis)
        sh = [1] * a.ndim; sh[axis] = N
        return lo + (hi - lo) * f.reshape(sh)
    c = lerp(lerp(lerp(cube, 0), 1), 2)                                # [b, g, r, 3]
    out = np.zeros((N, N * N, 3))
    for b in range(N):
        out[:, b * N:(b + 1) * N, :] = c[b]                            # rows g, cols r
    Image.fromarray(np.clip(out + .5, 0, 255).astype(np.uint8)).save(dst, optimize=True)
if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
