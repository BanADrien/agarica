#!/usr/bin/env python3
"""Crop a "déco item" section sheet into individual placeable decor PNGs.

Retour utilisateur : "pour les élément de décors du mode édit j'ai rajouter
le dossier déco item qui contient d'autre dossier avec le nom des zones pour
faire des sections dans le mode édit, dedans j'ai mis la première plaque de
frame a découper pour les integrer dans le mode a la place des actuel qui
n'ont pas d'images" -- chaque sous-dossier de assets/decors/déco item/ est
une SECTION (nom de zone) ; chaque PNG dedans est une planche à découper en
items individuels via détection de composantes connexes sur le canal alpha
(items déjà nettement séparés par de la transparence sur cette planche,
contrairement à floor.png -- pas besoin du pipeline dédié de
crop_autotile.py). Un item peut chevaucher LARGEMENT sa boîte englobante
naturelle si son contenu est irrégulier (branches, ombres) -- pas de canvas
partagé/alignement forcé comme split_spritesheet.py (pensé pour des frames
d'ANIMATION qui doivent rester alignées entre elles) : chaque item est
recadré à SA PROPRE taille, wrappé PROP_SCALE au rendu comme les décors
existants (cf. LevelKit.js).

Usage:
    python crop_deco_items.py <section_dir> [--min-area N] [--pad N]

Écrit dans assets/decors/deco_item_frames/<section>/<section>_NN.png, dans
un ordre de lecture (rangée du haut vers le bas, gauche vers droite au sein
d'une rangée) -- imprime aussi chaque boîte englobante pour permettre de
retirer à la main les crops indésirables (ex: bâtiments fusionnés entre eux
faute de vraie séparation alpha) avant de les intégrer au jeu.

ATTENTION -- étape manuelle OBLIGATOIRE après chaque run, avant d'utiliser
les fichiers dans le jeu : ce script numérote juste dans l'ordre de lecture
(bosquet_00.png, bosquet_01.png...), il ne connaît ni les items à exclure
(silhouettes fusionnées, tuiles de sol...) ni leur nom définitif. Après
inspection visuelle, RENOMMER à la main les fichiers gardés
(bosquet_00.png -> bosquet_grove.png, ex.) et SUPPRIMER les autres, puis
mettre à jour `DECOR_SECTIONS` dans src/utils/LevelKit.js pour qu'il
pointe vers ces noms définitifs. Leçon d'une autre planche de ce projet
(floor.png/dirt_angle.png, cf. mémoire projet) : relancer ce script sur une
section déjà triée écrase TOUT (renumérotation brute depuis zéro, plus aucun
fichier au nom définitif) sans distinguer un item déjà gardé/renommé d'un
nouveau -- ne jamais le relancer sur une section existante sans refaire la
même passe de tri/renommage/suppression ensuite.
"""
import argparse
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

REPO_ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = REPO_ROOT / 'assets' / 'decors' / 'déco item'
OUTPUT_ROOT = REPO_ROOT / 'assets' / 'decors' / 'deco_item_frames'

# Items sur une même bande horizontale (delta Y de leur centre sous ce seuil)
# sont considérés comme une même "rangée" pour le tri gauche->droite -- une
# rangée n'est pas forcément parfaitement alignée pixel-près (objets de
# hauteurs variées posés sur une même ligne de sol).
ROW_BAND_PX = 60


def crop_section(section_dir: Path, min_area: int, pad: int):
    section = section_dir.name
    out_dir = OUTPUT_ROOT / section
    out_dir.mkdir(parents=True, exist_ok=True)

    boxes = []
    for sheet_path in sorted(section_dir.glob('*.png')):
        im = Image.open(sheet_path).convert('RGBA')
        arr = np.array(im)
        alpha = arr[:, :, 3]
        content = alpha > 30
        labeled, count = ndimage.label(content, structure=np.ones((3, 3), dtype=int))
        objs = ndimage.find_objects(labeled)
        for label_id, sl in enumerate(objs, start=1):
            if sl is None:
                continue
            y0, y1 = sl[0].start, sl[0].stop
            x0, x1 = sl[1].start, sl[1].stop
            size = int(np.sum(labeled[sl] == label_id))
            if size < min_area:
                continue
            boxes.append({'arr': arr, 'label': label_id, 'labeled': labeled, 'x0': x0, 'y0': y0, 'x1': x1, 'y1': y1})

    # Tri en lecture naturelle : par bande de rangée (Y du haut, regroupé à
    # ROW_BAND_PX près) puis par X au sein de la rangée.
    boxes.sort(key=lambda b: b['y0'])
    rows = []
    for b in boxes:
        placed = False
        for row in rows:
            if abs(row[0]['y0'] - b['y0']) <= ROW_BAND_PX:
                row.append(b)
                placed = True
                break
        if not placed:
            rows.append([b])
    for row in rows:
        row.sort(key=lambda b: b['x0'])

    count = 0
    for row in rows:
        for b in row:
            x0, y0, x1, y1 = b['x0'], b['y0'], b['x1'], b['y1']
            crop = b['arr'][y0:y1, x0:x1].copy()
            own_mask = b['labeled'][y0:y1, x0:x1] == b['label']
            crop[~own_mask] = 0
            padded = Image.new('RGBA', (x1 - x0 + pad * 2, y1 - y0 + pad * 2), (0, 0, 0, 0))
            padded.paste(Image.fromarray(crop, 'RGBA'), (pad, pad))
            name = f'{section}_{count:02d}.png'
            padded.save(out_dir / name)
            print(f'{name}: box=({x0},{y0})-({x1},{y1}) size={x1 - x0}x{y1 - y0}')
            count += 1

    print(f'\n{count} item(s) written to {out_dir}')


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('section', help='Section folder name under "assets/decors/déco item/"')
    parser.add_argument('--min-area', type=int, default=200)
    parser.add_argument('--pad', type=int, default=4)
    args = parser.parse_args()

    section_dir = SOURCE_DIR / args.section
    if not section_dir.is_dir():
        raise SystemExit(f'No such section folder: {section_dir}')
    crop_section(section_dir, args.min_area, args.pad)


if __name__ == '__main__':
    main()
