"""Découpe les îles du ciel en images séparées (une par île).

Usage :  python tools/cut_iles.py

Deux jeux, tirés de la même peinture d'origine :
- `lointaines` : assets/decors/fonds/couche_iles_lointaines.png (petites, loin) ;
- `proches` : assets/decors/fonds/couche_iles_proches.png, la même image refaite
  par pixel-fixer pour être affichée plus GRANDE avec le même grain de pixel
  (cf. CLAUDE.md : on n'étire jamais une île, ses pixels grossiraient).
Chaque île (amas de pixels opaques ; les petits morceaux tout proches restent
avec leur île) devient assets/decors/fonds/iles_<jeu>/ile_<n>.png ; les
positions vont dans src/data/iles_lointaines.js (ILES_SETS). Le jeu fait alors
flotter chaque île à son rythme (addFarLayers, option `floating`).
À relancer si l'une des deux images est refaite.
"""
import json
import os
import shutil

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONDS = os.path.join(ROOT, 'assets', 'decors', 'fonds')
LIST = os.path.join(ROOT, 'src', 'data', 'iles_lointaines.js')
SETS = {'lointaines': 'couche_iles_lointaines.png', 'proches': 'couche_iles_proches.png'}
MERGE = 10       # px : morceaux plus proches que ça = même île
MIN_AREA = 900   # px : en dessous, miette ignorée


def cut(name, filename):
    src = os.path.join(FONDS, filename)
    if not os.path.exists(src):
        return None
    out = os.path.join(FONDS, f'iles_{name}')
    im = np.asarray(Image.open(src).convert('RGBA'))
    solid = im[..., 3] > 128
    labels, _ = ndimage.label(ndimage.binary_dilation(solid, iterations=MERGE))
    shutil.rmtree(out, ignore_errors=True)
    os.makedirs(out)
    iles = []
    for i, box in enumerate(ndimage.find_objects(labels), start=1):
        part = (labels[box] == i) & solid[box]
        if part.sum() < MIN_AREA:
            continue
        ys, xs = np.where(part)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        crop = im[box][y0:y1, x0:x1].copy()
        crop[~part[y0:y1, x0:x1]] = 0
        fname = f'ile_{len(iles)}.png'
        Image.fromarray(crop, 'RGBA').save(os.path.join(out, fname))
        iles.append({'file': f'assets/decors/fonds/iles_{name}/{fname}', 'x': int(box[1].start + x0),
                     'y': int(box[0].start + y0), 'w': int(x1 - x0), 'h': int(y1 - y0)})
    print(f'{name} : {len(iles)} île(s)')
    return {'w': int(im.shape[1]), 'h': int(im.shape[0]), 'iles': iles}


def main():
    sets = {name: data for name, data in ((n, cut(n, f)) for n, f in SETS.items()) if data}
    shutil.rmtree(os.path.join(FONDS, 'iles'), ignore_errors=True)  # ancien dossier (un seul jeu)
    with open(LIST, 'w', encoding='utf-8', newline='\n') as f:
        f.write('// GÉNÉRÉ par tools/cut_iles.py -- ne pas modifier à la main.\n')
        f.write('// Îles du ciel découpées une à une, par jeu (position dans l\'image d\'origine).\n')
        f.write('const ILES_SETS = ' + json.dumps(sets, indent=1) + ';\n')


if __name__ == '__main__':
    main()
