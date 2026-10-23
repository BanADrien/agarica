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
    python crop_deco_items.py --named [section ...]   (planches de PLANCHES)

Mode --named (planches Codex de CODEX_SPRITES_A_GENERER.md, « Planches de
décor ») : découpe ET nomme directement chaque item d'après la table
PLANCHES (noms dans l'ordre de lecture de la grille de la planche), rogné au
contenu avec la base AU RAS DU BAS de l'image (le jeu pose le bas de l'image
sur la ligne de marche). Déterministe : relançable sans risque, n'écrit que
les noms de la table (les props déjà triés à la main ne sont pas touchés).
Les avertissements ci-dessous ne concernent que le mode historique.

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


# ---------------------------------------------------------------------------
# Mode --named. Pour chaque planche : fichier source (dans 'déco item/'),
# grille (colonnes, rangées) demandée à Codex, noms dans l'ordre de lecture
# (sans le préfixe de section) -- à garder synchro avec DECOR_SECTIONS
# (src/utils/LevelKit.js). `rows_max_y` : ne garder que les items dont le bas
# est au-dessus de ce y (1re rangée de la planche du bosquet). `cuts` : x de
# découpe verticale d'un groupe d'items qui se touchent (bâtiments du bosquet,
# coupés aux creux de la silhouette).
PLANCHES = {
    'foret_sombre': {
        'file': 'foret_sombre/foret_sombre_planche.png', 'grid': (4, 3),
        'names': ['arbre_moussu', 'souche_champignons', 'rocher_mousse', 'champignons_lumineux',
                  'racine_arche', 'buisson_epineux', 'tronc_couche', 'fougere_sombre',
                  'toile_araignee', 'mare_bord', 'pierre_runique', 'fleur_corniche'],
    },
    'grand_arbre': {
        'file': 'grand_arbre/grand_arbre_planche.png', 'grid': (4, 3),
        'names': ['racine_tunnel', 'champignon_etagere', 'nid_singe', 'tas_pierres',
                  'morceaux_ecorce', 'lanterne_lucioles', 'statue_simien', 'rideau_lianes',
                  'trou_tronc', 'autel_singe'],
    },
    'grand_arbre_tronc': {
        'file': 'grand_arbre_tronc/grand_arbre_tronc_planche.png', 'grid': (5, 2),
        'names': ['paroi_ecorce', 'paroi_noeud', 'branche_courte', 'branche_longue', 'escalier_racines',
                  'fenetre_lune', 'lianes_hautes', 'champignons_lumineux', 'seve_corrompue', 'corniche_mousse'],
    },
    'foret_flottante': {
        'file': 'foret_flottante/foret_flottante_planche.png', 'grid': (4, 3),
        'names': ['ile_petite', 'ile_moyenne', 'rocher_flottant', 'nuage',
                  'arbre_jeune', 'pont_corde', 'tente_geralt', 'panneau_geralt',
                  'pissenlit_geant', 'fleurs_hautes'],
    },
    'foret_corrompue': {
        'file': 'foret_corrompue/foret_corrompue_planche.png', 'grid': (4, 3),
        'names': ['arbre_malade', 'souche_corrompue', 'pustule_mousse', 'racine_tordue',
                  'os_creature', 'cocon_mousse', 'champignon_toxique', 'rocher_fissure',
                  'pilier_arene', 'arche_arene', 'pierre_symbole'],
    },
    'hutte_morgat': {
        'file': 'hutte_morgat/hutte_morgat_planche.png', 'grid': (4, 3),
        'names': ['hutte_morgat', 'chaudron', 'etagere_bocaux', 'table_herbes',
                  'sechoir_plantes', 'lanterne_papillons', 'panier_plantes', 'tapis_rond',
                  'pot_fleurs', 'bocal_papillons'],
    },
    # Bâtiments de la 1re rangée de la planche du bosquet (les autres items
    # de cette planche sont déjà découpés et renommés à la main).
    'bosquet': {
        'file': 'bosquet/bosquet componant.png', 'grid': (1, 1), 'rows_max_y': 490,
        'cuts': [408, 558, 738, 847],
        'names': ['cabane_arbre', 'hutte_mousse', 'hutte_paille', 'cottage', 'tour', 'tente',
                  'muraille_tour', 'muraille_pan', 'muraille_pan_2', 'muraille_tour_2', 'muraille_porte'],
    },
}
ITEM_MIN_AREA = 5000   # en dessous : morceau détaché (graine, goutte) rattaché à l'item le plus proche
ATTACH_DIST = 80       # px : au-delà, morceau isolé = bruit, ignoré


def _bbox(mask):
    ys, xs = np.nonzero(mask)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def _seam(content, cx, half=24):
    """x de coupe par rangée (de haut en bas, pas de ±1 px par rangée, dans
    [cx-half, cx+half]) qui traverse le moins de pixels opaques."""
    h = content.shape[0]
    x0 = cx - half
    cost = content[:, x0:cx + half + 1].astype(np.int32)
    acc = cost.copy()
    for y in range(1, h):
        prev = acc[y - 1]
        best = np.minimum(prev, np.minimum(np.roll(prev, 1), np.roll(prev, -1)))
        best[0] = min(prev[0], prev[1])
        best[-1] = min(prev[-1], prev[-2])
        acc[y] += best
    seam = np.zeros(h, dtype=np.int64)
    x = int(np.argmin(acc[-1]))
    for y in range(h - 1, -1, -1):
        seam[y] = x0 + x
        if y:
            lo, hi = max(0, x - 1), min(acc.shape[1], x + 2)
            x = lo + int(np.argmin(acc[y - 1, lo:hi]))
    return seam


def _gap(a, b):
    ax0, ay0, ax1, ay1 = a
    bx0, by0, bx1, by1 = b
    dx = max(0, max(ax0, bx0) - min(ax1, bx1))
    dy = max(0, max(ay0, by0) - min(ay1, by1))
    return max(dx, dy)


def crop_named(section, spec, pad=2):
    arr = np.array(Image.open(SOURCE_DIR / spec['file']).convert('RGBA'))
    h = arr.shape[0]
    labeled, n = ndimage.label(arr[:, :, 3] > 30, structure=np.ones((3, 3), dtype=int))
    masks = [labeled == i for i in range(1, n + 1)]
    if spec.get('rows_max_y'):
        masks = [m for m in masks if _bbox(m)[3] <= spec['rows_max_y']]
    # Groupe d'items qui se touchent : coupé autour des x donnés, le long d'un
    # tracé vertical qui traverse le moins de pixels opaques possible (une
    # coupe droite tranchait le bout de toit d'un voisin).
    for cx in spec.get('cuts', []):
        content = arr[:, :, 3] > 30
        if spec.get('rows_max_y'):
            content[spec['rows_max_y']:] = False
        seam = _seam(content, cx)
        cols = np.arange(arr.shape[1])[None, :]
        left_of = cols < seam[:, None]
        out = []
        for m in masks:
            x0, _, x1, _ = _bbox(m)
            if x0 < cx < x1:
                out += [m & left_of, m & ~left_of]
            else:
                out.append(m)
        masks = out
    if spec.get('cuts'):
        # Un bout de toit coupé du mauvais côté devient un petit morceau à part,
        # rattaché plus bas à l'item le plus proche (le sien, collé à la coupe).
        split = []
        for m in masks:
            lab, k = ndimage.label(m, structure=np.ones((3, 3), dtype=int))
            split += [lab == i for i in range(1, k + 1)]
        masks = split
    big = [m for m in masks if m.sum() >= ITEM_MIN_AREA]
    for m in masks:
        if m.sum() >= ITEM_MIN_AREA:
            continue
        bb = _bbox(m)
        best = min(big, key=lambda b: _gap(_bbox(b), bb), default=None)
        if best is not None and _gap(_bbox(best), bb) <= ATTACH_DIST:
            best |= m
    cols, rows = spec['grid']
    band = h / rows
    names = spec['names']

    def row_of(m):
        _, y0, _, y1 = _bbox(m)
        return int(((y0 + y1) / 2) // band)

    def spans(m):
        _, y0, _, y1 = _bbox(m)
        return int((y1 - 1) // band) - int(y0 // band)

    # Item à cheval sur deux rangées de la grille (deux props qui se touchent,
    # ex. souche + cocon suspendu) : coupé au bas des autres items de sa rangée.
    while len(big) < len(names) and rows > 1:
        cand = max(big, key=lambda m: (spans(m), _bbox(m)[3] - _bbox(m)[1]))
        if spans(cand) < 1:
            break
        row = int(_bbox(cand)[1] // band)
        bottoms = [_bbox(m)[3] for m in big if m is not cand and row_of(m) == row]
        cut = max(bottoms) if bottoms else int((row + 1) * band)
        top, bottom = cand.copy(), cand.copy()
        top[cut:] = False
        bottom[:cut] = False
        big = [m for m in big if m is not cand]
        big += [top, bottom]
    if len(big) != len(names):
        print(f'[{section}] {len(big)} items trouvés, {len(names)} attendus : rien écrit')
        return 0
    big.sort(key=lambda m: (row_of(m), _bbox(m)[0]))
    out_dir = OUTPUT_ROOT / section
    out_dir.mkdir(parents=True, exist_ok=True)
    for name, m in zip(names, big):
        x0, y0, x1, y1 = _bbox(m)
        crop = arr[y0:y1, x0:x1].copy()
        crop[~m[y0:y1, x0:x1]] = 0
        # Marge en haut et sur les côtés seulement : la base reste au ras du bas.
        im = Image.new('RGBA', (x1 - x0 + 2 * pad, y1 - y0 + pad), (0, 0, 0, 0))
        im.paste(Image.fromarray(crop, 'RGBA'), (pad, pad))
        im.save(out_dir / f'{section}_{name}.png')
        print(f'{section}_{name}.png  {im.width}x{im.height}  (planche {x0},{y0}-{x1},{y1})')
    return len(names)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('section', nargs='*', help='Section folder name under "assets/decors/déco item/"')
    parser.add_argument('--named', action='store_true', help='planches de PLANCHES : découpe + noms définitifs')
    parser.add_argument('--min-area', type=int, default=200)
    parser.add_argument('--pad', type=int, default=4)
    args = parser.parse_args()

    if args.named:
        for section in (args.section or list(PLANCHES)):
            crop_named(section, PLANCHES[section])
        return
    if len(args.section) != 1:
        raise SystemExit('Une section (mode historique) ou --named [sections]')
    section_dir = SOURCE_DIR / args.section[0]
    if not section_dir.is_dir():
        raise SystemExit(f'No such section folder: {section_dir}')
    crop_section(section_dir, args.min_area, args.pad)


if __name__ == '__main__':
    main()
