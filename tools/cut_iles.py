"""Découpe les îles lointaines en images séparées (une par île).

Usage :  python tools/cut_iles.py

Lit assets/decors/fonds/couche_iles_lointaines.png (déjà en pixel art), isole
chaque île (amas de pixels opaques ; les petits morceaux tout proches restent
avec leur île), et écrit assets/decors/fonds/iles/ile_<n>.png +
src/data/iles_lointaines.js (position de chaque île dans l'image d'origine).
Le jeu peut alors faire flotter chaque île à son rythme (cf. addFarLayers,
option `floating`). À relancer si l'image des îles est refaite.
"""
import json
import os
import shutil

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets', 'decors', 'fonds', 'couche_iles_lointaines.png')
OUT = os.path.join(ROOT, 'assets', 'decors', 'fonds', 'iles')
LIST = os.path.join(ROOT, 'src', 'data', 'iles_lointaines.js')
MERGE = 10       # px : morceaux plus proches que ça = même île
MIN_AREA = 900   # px : en dessous, miette ignorée


def main():
    im = np.asarray(Image.open(SRC).convert('RGBA'))
    solid = im[..., 3] > 128
    labels, n = ndimage.label(ndimage.binary_dilation(solid, iterations=MERGE))
    shutil.rmtree(OUT, ignore_errors=True)
    os.makedirs(OUT)
    iles = []
    for i, box in enumerate(ndimage.find_objects(labels), start=1):
        part = (labels[box] == i) & solid[box]
        if part.sum() < MIN_AREA:
            continue
        ys, xs = np.where(part)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        crop = im[box][y0:y1, x0:x1].copy()
        crop[~part[y0:y1, x0:x1]] = 0
        name = f'ile_{len(iles)}.png'
        Image.fromarray(crop, 'RGBA').save(os.path.join(OUT, name))
        iles.append({'file': f'assets/decors/fonds/iles/{name}', 'x': int(box[1].start + x0), 'y': int(box[0].start + y0),
                     'w': int(x1 - x0), 'h': int(y1 - y0)})
    with open(LIST, 'w', encoding='utf-8', newline='\n') as f:
        f.write('// GÉNÉRÉ par tools/cut_iles.py -- ne pas modifier à la main.\n')
        f.write('// Îles lointaines découpées une à une (position dans couche_iles_lointaines.png).\n')
        f.write('const ILES_LOINTAINES = ' + json.dumps({'w': im.shape[1], 'h': im.shape[0], 'iles': iles}, indent=1) + ';\n')
    print(f'{len(iles)} île(s) -> {os.path.relpath(OUT, ROOT)}')


if __name__ == '__main__':
    main()
