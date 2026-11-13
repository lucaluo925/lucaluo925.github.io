"""Pack the film and paper profiles into one compact JSON for the browser engine.
Reads spektrafilm's profiles (CC BY-SA 4.0) and SpektraLab's black and white profiles. Data only, no code is run.
    python3 -I pack_profiles.py <spektrafilm profiles dir> <spektralab resources_product dir> <out.json>"""
import json, sys, os, glob
A, B, OUT = sys.argv[1:4]
def r(x, n=4):
    if isinstance(x, list): return [r(v, n) for v in x]
    return None if x is None or x != x else round(float(x), n)
def flat(m): return [v for row in m for v in (row if isinstance(row, list) else [row])]
out = {}
for f in sorted(glob.glob(A + '/*.json')) + sorted(glob.glob(B + '/profiles/*.json')):
    j = json.load(open(f)); k = os.path.basename(f)[:-5]
    if 'derived_from' in j: out[k] = {'alias': j['derived_from'], 'info': j.get('info', {})}; continue
    i, d = j['info'], j['data']
    assert len(d['wavelengths']) == 81 and len(d['log_exposure']) == len(d['density_curves'])
    out[k] = {'info': {x: i.get(x) for x in ('name', 'type', 'support', 'use', 'antihalation', 'reference_illuminant', 'viewing_illuminant', 'channel_model', 'target_print')},
              'ls': flat(r(d['log_sensitivity'], 3)), 'cd': flat(r(d['channel_density'])), 'base': flat(r(d['base_density'])),
              'le': r(d['log_exposure'], 3), 'dc': flat(r(d['density_curves']))}
g = json.load(open(B + '/paper_grades.json'))['grades']
out['_grades'] = {k: [v['y_filter_neutral'], v['m_filter_neutral']] for k, v in g.items()}
json.dump(out, open(OUT, 'w'), separators=(',', ':'))
print(len(out) - 1, 'profiles', os.path.getsize(OUT) // 1024, 'KB')
for k, v in out.items():
    if k[0] != '_': i = v['info']; print(f"{k:34s} {str(i.get('type')):9s} {str(i.get('support')):6s} {str(i.get('use')):6s} {str(i.get('antihalation')):7s} {str(i.get('channel_model'))} -> {i.get('target_print')}")
