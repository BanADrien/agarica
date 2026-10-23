#!/usr/bin/env python3
"""Découpe les 2 DERNIÈRES rangées de assets/decors/arbres.png (buissons,
fougères, champignons -- le "sous-bois") en éléments individuels.

Les 2 premières rangées (les grands arbres) sont déjà découpées dans
assets/decors/arbres_frames/ (plan3, cf. addProceduralForest dans
LevelKit.js) ; celles-ci servent au plan intermédiaire posé entre le sol de
fond et le sol principal (cf. addUndergrowth dans LevelKit.js).

Même recette que tools/crop_deco_items.py : composantes connexes sur
l'alpha, chaque élément recadré à SA PROPRE taille (pas de canvas partagé,
ce ne sont pas des frames d'animation), masqué à sa propre composante pour
qu'un voisin qui déborderait dans sa boîte ne s'y retrouve pas, marge de 4px.

Usage:
    python tools/crop_sous_bois.py [--min-area N] [--pad N]

Écrit assets/decors/sous_bois_frames/sous_bois_<N>.png, dans l'ordre de
lecture (rangée 3 de gauche à droite, puis rangée 4). Si le nombre
d'éléments change, mettre à jour SOUS_BOIS_COUNT dans src/utils/LevelKit.js.
"""
import argparse
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

REPO_ROOT = Path(__file__).resolve().parent.parent
SOURCE = REPO_ROOT / 'assets' / 'decors' / 'arbres.png'
OUTPUT_DIR = REPO_ROOT / 'assets' / 'decors' / 'sous_bois_frames'
ROWS_TO_KEEP = 2  # les 2 dernières rangées de la planche
ROW_BASELINE_TOLERANCE_PX = 40


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--min-area', type=int, default=200)
    parser.add_argument('--pad', type=int, default=4)
    parser.add_argument('--alpha-threshold', type=int, default=30)
    args = parser.parse_args()

    arr = np.array(Image.open(SOURCE).convert('RGBA'))
    content = arr[:, :, 3] > args.alpha_threshold
    labeled, _ = ndimage.label(content, structure=np.ones((3, 3), dtype=int))

    blobs = []
    for label_id, sl in enumerate(ndimage.find_objects(labeled), start=1):
        if sl is None or np.sum(labeled[sl] == label_id) < args.min_area:
            continue
        blobs.append({'label': label_id, 'y0': sl[0].start, 'y1': sl[0].stop, 'x0': sl[1].start, 'x1': sl[1].stop})

    # Rangées regroupées par LIGNE DE BASE (bord bas de chaque élément), pas
    # par bandes transparentes : les grands arbres des rangées 1-2 descendent
    # plus bas que le haut des buissons de la rangée 3, aucune ligne 100%
    # transparente ne les sépare. Tous les éléments d'une rangée sont posés
    # sur le même "sol" dessiné, donc leurs bords bas restent proches.
    blobs.sort(key=lambda b: b['y1'])
    rows = []
    for b in blobs:
        if rows and b['y1'] - rows[-1][-1]['y1'] <= ROW_BASELINE_TOLERANCE_PX:
            rows[-1].append(b)
        else:
            rows.append([b])
    if len(rows) < ROWS_TO_KEEP:
        raise SystemExit(f'Only {len(rows)} row(s) found in {SOURCE}')

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    count = 0
    for row in rows[-ROWS_TO_KEEP:]:
        for b in sorted(row, key=lambda b: b['x0']):
            x0, y0, x1, y1 = b['x0'], b['y0'], b['x1'], b['y1']
            crop = arr[y0:y1, x0:x1].copy()
            crop[labeled[y0:y1, x0:x1] != b['label']] = 0
            padded = Image.new('RGBA', (x1 - x0 + args.pad * 2, y1 - y0 + args.pad * 2), (0, 0, 0, 0))
            padded.paste(Image.fromarray(crop, 'RGBA'), (args.pad, args.pad))
            name = f'sous_bois_{count}.png'
            padded.save(OUTPUT_DIR / name)
            print(f'{name}: box=({x0},{y0})-({x1},{y1}) size={x1 - x0}x{y1 - y0}')
            count += 1

    print(f'\n{count} element(s) written to {OUTPUT_DIR}')


if __name__ == '__main__':
    main()
