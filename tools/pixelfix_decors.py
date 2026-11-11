"""Refait tous les décors en pixel art avec tools/pixelfix.js (pixel-fixer).

Usage :  python tools/pixelfix_decors.py [--dry]

Réglages retenus le 2026-11-11 (cf. CLAUDE.md) : UNE image par lot (palette
propre à chaque décor, 24 couleurs : une palette commune les rend boueux),
grain de GRAIN px d'écran, contour propre, lignes pixel-perfect. Le facteur de
chaque image = GRAIN / son échelle d'affichage :
- décors posés (assets/decors/deco_item_frames/<biome>/) : échelle la plus
  fréquente de leurs poses dans src/data/*.js, sinon celle du manifest, sinon 0,4 ;
- éléments du manifest rangés dans assets/decors/elements/ : `scale` du manifest
  (les six pièces de branche et de tronc sont exclues : cf. bake_branches.py) ;
- plantes, sous-bois, arbres : échelle de base de LevelKit.
Les originaux IA sont gardés par pixelfix.js (assets/_pixelfix_originals/) ;
une image déjà refaite repart de son original.
"""
import collections
import glob
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GRAIN = 2.0
BRANCH_PIECES = {'branche_milieu', 'branche_base', 'branche_bout', 'branche_fourche', 'tronc_segment', 'tronc_base'}
FIXED = [  # (motif, échelle d'affichage)
    ('assets/decors/plantes_frames/bplante_*.png', 0.3),
    ('assets/decors/plantes_frames/hplante_*.png', 0.6),
    ('assets/decors/sous_bois_frames/*.png', 0.45),
    # gros arbres du fond : pixels plus gros, 4 px d'écran (demande du 2026-11-11) -> échelle comptée à moitié
    ('assets/decors/arbres_frames/*.png', 1.35 / 2),
]


def placement_scales():
    scales = collections.defaultdict(list)
    for f in glob.glob(os.path.join(ROOT, 'src', 'data', '*.js')):
        text = open(f, encoding='utf-8').read()
        for m in re.finditer(r"type: '([a-z0-9_]+)'[^}\n]*?scale: ([0-9.]+)", text):
            scales[m.group(1)].append(float(m.group(2)))
    return {k: collections.Counter(v).most_common(1)[0][0] for k, v in scales.items()}


def manifest_scales():
    text = open(os.path.join(ROOT, 'src', 'data', 'asset_manifest.js'), encoding='utf-8').read()
    out = {}
    for m in re.finditer(r'^  ([a-z0-9_]+): \{\s*\n\s*path: "([^"]+)", scale: ([0-9.]+)', text, re.M):
        out[m.group(1)] = (m.group(2), float(m.group(3)))
    return out


def main():
    dry = '--dry' in sys.argv
    placed, manifest = placement_scales(), manifest_scales()
    jobs = []
    for f in sorted(glob.glob(os.path.join(ROOT, 'assets', 'decors', 'deco_item_frames', '*', '*.png'))):
        name = os.path.splitext(os.path.basename(f))[0]
        scale = placed.get(name) or (manifest.get(name) or (None, None))[1] or 0.4
        jobs.append((f, scale))
    for name, (path, scale) in sorted(manifest.items()):
        if path.startswith('assets/decors/elements/') and name not in BRANCH_PIECES:
            f = os.path.join(ROOT, path)
            if os.path.exists(f):
                jobs.append((f, placed.get(name) or scale))
    for pattern, scale in FIXED:
        jobs.extend((f, scale) for f in sorted(glob.glob(os.path.join(ROOT, pattern))))
    failed = 0
    for f, scale in jobs:
        factor = max(1.0, round(GRAIN / scale, 2))
        rel = os.path.relpath(f, ROOT).replace(os.sep, '/')
        if dry:
            print(f'{rel}  échelle {scale}  facteur {factor}')
            continue
        r = subprocess.run(['node', 'tools/pixelfix.js', 'files', rel, '--factor', str(factor), '--colors', '24',
                            '--outline', 'darkest', '--pixel-perfect'], cwd=ROOT, capture_output=True, text=True,
                           encoding='utf-8', errors='replace')
        if r.returncode:
            failed += 1
            print(f'ECHEC {rel} : {(r.stdout + r.stderr).strip()[-200:]}')
    print(f'{len(jobs)} décor(s), {failed} échec(s)')
    sys.exit(1 if failed else 0)


if __name__ == '__main__':
    main()
