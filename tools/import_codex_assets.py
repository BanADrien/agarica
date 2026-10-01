#!/usr/bin/env python3
"""Importe les images générées par Codex (cf. CODEX_SPRITES_A_GENERER.md).

Source de vérité : src/data/asset_manifest.js (PARSÉ par ce script, rien à
garder en double ici). Trois tables y sont lues :

  * ASSET_MANIFEST   -- feuilles animées (persos, ennemis, VFX). Chaque entrée
    liste ses images source dans `sheets` (une image peut ne contenir qu'une
    partie des rangées : `rows` = indices GLOBAUX de rangée). Les frames sont
    écrites en `${dir}/${prefix}_row${row}_${i}.png`, même format que
    tools/split_spritesheet.py : canvas uniforme pour TOUTE l'entrée (toutes
    images confondues), aligné bas-centre (`align: "bottom"`), centré
    (`"center"`), à gauche/centre vertical (`"left"`) ou bas-gauche
    (`"left-bottom"`). `canvas: [w, h]` impose la taille finale (réduction
    uniforme). `frames: [...]` dans un sheet = nb de frames par rangée image ;
    un indice de rangée répété dans `rows` concatène plusieurs rangées image
    dans une même anim.
      - cut "blob" (persos) : rangées détectées par les bandes transparentes,
        frames par composantes connexes (comme split_spritesheet.py), avec
        en plus le rattachement des petits morceaux détachés (mèche, goutte)
        à la frame la plus proche.
      - cut "grid" (VFX) : grille régulière (largeur / nb de frames de la
        rangée, hauteur / nb de rangées de l'image) -- les particules
        détachées restent dans leur cellule.
  * ITEM_MANIFEST    -- images uniques : fichier source dans `src.file` ou
    cellule `src.cell` d'une planche `src.planche` découpée en grille
    `src.grid` = [colonnes, rangées] (ou par colonnes transparentes si
    `src.cut == "columns"`, pour le totem). Normalisation `norm` :
      fit N      -> rognage alpha puis réduction pour que le plus grand côté = N
      height N   -> rognage alpha puis hauteur = N (trim_x : rognage horizontal seul)
      square N   -> rognage alpha, padding carré, redimension NxN
      cover WxH  -> image opaque recadrée/redimensionnée pour couvrir WxH (fonds)
      trim       -> rognage alpha seul
  * TILESET_MANIFEST -- 3 images (sol 4x4, plateformes 1x3, spéciaux 1x3)
    découpées vers les 21 noms de assets/decors/autotile_frames/.

Fonds non transparents : si les 4 coins de l'image sont opaques et qu'elle
n'est pas censée l'être (fonds `cover` exclus), le fond est retiré : noir via
tools/dechroma.py, autre couleur unie (blanc, gris, damier clair) par un
remplissage depuis les bords à tolérance de couleur.

Un asset n'est (re)traité que si sa source existe ET qu'une de ses sorties
manque (ou avec --force). Rien n'est jamais supprimé hors des fichiers que
ce script écrit lui-même.

Usage :
    python tools/import_codex_assets.py [--force] [--only ID [ID ...]] [--dry-run]

Requiert numpy, Pillow, scipy (comme les autres outils du dossier).
"""
import argparse
import json
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

TOOLS = Path(__file__).resolve().parent
ROOT = TOOLS.parent
sys.path.insert(0, str(TOOLS))
from dechroma import remove_black_background  # noqa: E402
from split_spritesheet import find_segments  # noqa: E402

MANIFEST = ROOT / 'src' / 'data' / 'asset_manifest.js'
ALPHA_T = 10       # comme split_spritesheet.py
MIN_AREA = 25      # composantes plus petites = bruit
PAD = 4
TILE = 256
# Doit rester synchro avec AUTOTILE_CORNER_HEIGHT_BOOST / AUTOTILE_PLATFORM_HEIGHT_BOOST
# (LevelKit.js) -- même compensation que tools/cut_tuiles.py.
HEIGHT_BOOST = {'dirt_tl': 1.16, 'dirt_tr': 1.09, 'dirt_t': 1.07, 'dirt_platform2': 1.05}
TILE_GRID = {
    (0, 0): 'dirt_tl', (0, 1): 'dirt_t', (0, 2): 'dirt_tr', (0, 3): 'dirt_c_var0',
    (1, 0): 'dirt_l', (1, 1): 'dirt_c', (1, 2): 'dirt_r', (1, 3): 'dirt_c_var1',
    (2, 0): 'dirt_bl', (2, 1): 'dirt_b', (2, 2): 'dirt_br', (2, 3): 'dirt_c_var2',
    (3, 0): 'dirt_c_var3', (3, 1): 'dirt_c_var4', (3, 2): 'dirt_c_var5',
}
TOP_TILES = {'dirt_tl', 'dirt_t', 'dirt_tr', 'dirt_platform0', 'dirt_platform1', 'dirt_platform2'}
PLATFORM_NAMES = ['dirt_platform0', 'dirt_platform1', 'dirt_platform2']
SPECIAL_NAMES = ['dirt_angle', 'coin', 'dirt_column']

WARNINGS = []


def warn(msg):
    WARNINGS.append(msg)
    print('  AVERTISSEMENT:', msg)


# --------------------------------------------------------------------------- manifest parsing
def _extract_object(src, name):
    m = re.search(r'const\s+' + name + r'\s*=\s*\{', src)
    if not m:
        raise SystemExit(f'{name} introuvable dans {MANIFEST}')
    i = m.end() - 1
    depth = 0
    in_str = False
    for j in range(i, len(src)):
        ch = src[j]
        if in_str:
            if ch == '"' and src[j - 1] != '\\':
                in_str = False
        elif ch == '"':
            in_str = True
        elif ch == '{':
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0:
                return src[i:j + 1]
    raise SystemExit(f'{name} : accolade fermante introuvable')


def _js_to_json(text):
    # Retire les commentaires // (hors chaînes : le format interdit "//" dans les chaînes).
    text = re.sub(r'//[^\n]*', '', text)
    text = re.sub(r'0x([0-9a-fA-F]+)', lambda m: str(int(m.group(1), 16)), text)
    text = re.sub(r'([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:', r'\1"\2":', text)
    text = re.sub(r',(\s*[}\]])', r'\1', text)
    return json.loads(text)


def load_manifest():
    src = MANIFEST.read_text(encoding='utf-8')
    return (_js_to_json(_extract_object(src, 'ASSET_MANIFEST')),
            _js_to_json(_extract_object(src, 'ITEM_MANIFEST')),
            _js_to_json(_extract_object(src, 'TILESET_MANIFEST')))


# --------------------------------------------------------------------------- image helpers
def remove_flat_background(rgb, tol=40, erode=2):
    """Fond uni non noir (blanc, gris, damier clair) : remplissage depuis les
    bords des pixels proches de la couleur des coins (même astuce d'érosion
    que dechroma.py pour ne pas fuir à travers les contours)."""
    arr = rgb.astype(int)
    h, w, _ = arr.shape
    corners = np.array([arr[0, 0], arr[0, -1], arr[-1, 0], arr[-1, -1]])
    bg = np.median(corners, axis=0)
    dist = np.abs(arr - bg).sum(axis=2)
    near = dist <= tol
    # damier gris/blanc : accepter aussi les gris très clairs peu saturés
    sat = arr.max(axis=2) - arr.min(axis=2)
    if bg.mean() > 150:
        near |= (arr.min(axis=2) >= 180) & (sat <= 12)
    struct = np.ones((3, 3), dtype=int)
    eroded = ndimage.binary_erosion(near, structure=struct, iterations=erode, border_value=1)
    labeled, _ = ndimage.label(eroded, structure=struct)
    border = set(labeled[0, :]) | set(labeled[-1, :]) | set(labeled[:, 0]) | set(labeled[:, -1])
    border.discard(0)
    core = np.isin(labeled, list(border))
    mask = ndimage.binary_dilation(core, structure=struct, iterations=erode) & near
    out = np.dstack([rgb.astype(np.uint8), np.full((h, w), 255, dtype=np.uint8)])
    out[mask, 3] = 0
    return out


def load_rgba(path, keep_opaque=False):
    im = Image.open(path).convert('RGBA')
    arr = np.array(im)
    if keep_opaque:
        return arr
    a = arr[:, :, 3]
    corners = [a[0, 0], a[0, -1], a[-1, 0], a[-1, -1]]
    if min(corners) < 250:
        return arr
    rgb = arr[:, :, :3]
    corner_rgb = np.array([rgb[0, 0], rgb[0, -1], rgb[-1, 0], rgb[-1, -1]]).astype(int)
    if corner_rgb.sum(axis=1).max() <= 60:
        print(f'  fond noir détecté -> dechroma ({path.name})')
        return remove_black_background(path)
    print(f'  fond opaque uni détecté -> retrait par couleur ({path.name})')
    out = remove_flat_background(rgb)
    if (out[:, :, 3] == 0).mean() < 0.2:
        warn(f'{path.name} : fond non transparent mal retiré (<20% transparent), régénérer avec fond transparent')
    return out


def alpha_bbox(arr, thr=ALPHA_T):
    ys, xs = np.nonzero(arr[:, :, 3] > thr)
    if len(xs) == 0:
        return None
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def trim(arr, axis_x=True, axis_y=True):
    bb = alpha_bbox(arr)
    if bb is None:
        return arr
    x0, y0, x1, y1 = bb
    if not axis_x:
        x0, x1 = 0, arr.shape[1]
    if not axis_y:
        y0, y1 = 0, arr.shape[0]
    return arr[y0:y1, x0:x1]


def save(arr_or_im, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    im = arr_or_im if isinstance(arr_or_im, Image.Image) else Image.fromarray(arr_or_im, 'RGBA')
    im.save(path)


def rel(p):
    try:
        return str(Path(p).resolve().relative_to(ROOT)).replace('\\', '/')
    except ValueError:
        return str(p)


# --------------------------------------------------------------------------- animated sheets
def merge_row_segments(segs, expected):
    segs = list(segs)
    while len(segs) > expected:
        # fusionne le segment le moins haut avec son voisin le plus proche
        k = min(range(len(segs)), key=lambda i: segs[i][1] - segs[i][0])
        if k == 0:
            j = 1
        elif k == len(segs) - 1:
            j = k - 1
        else:
            gap_prev = segs[k][0] - segs[k - 1][1]
            gap_next = segs[k + 1][0] - segs[k][1]
            j = k - 1 if gap_prev <= gap_next else k + 1
        a, b = sorted((k, j))
        segs[a] = (segs[a][0], segs[b][1])
        del segs[b]
    return segs


def blob_rows(arr, n_rows, label):
    content = arr[:, :, 3] > ALPHA_T
    segs = find_segments(content.any(axis=1))
    # ignore les bandes minuscules (bruit) avant de compter
    segs = [s for s in segs if s[1] - s[0] >= 8]
    if len(segs) > n_rows:
        warn(f'{label} : {len(segs)} bandes détectées pour {n_rows} rangée(s) attendue(s) -> fusion des plus fines')
        segs = merge_row_segments(segs, n_rows)
    elif len(segs) < n_rows:
        warn(f'{label} : seulement {len(segs)} rangée(s) séparée(s) détectée(s) sur {n_rows} '
             '(rangées qui se touchent ?) -> découpe en bandes égales')
        bb = alpha_bbox(arr)
        if bb is None:
            return []
        y0, y1 = bb[1], bb[3]
        step = (y1 - y0) / n_rows
        segs = [(int(y0 + i * step), int(y0 + (i + 1) * step) - 1) for i in range(n_rows)]
    return segs


def blob_frames(arr, ry0, ry1, n_frames, label):
    """Retourne une liste de (crop RGBA, bottom_y) pour une rangée."""
    band = arr[ry0:ry1 + 1]
    content = band[:, :, 3] > ALPHA_T
    labeled, _ = ndimage.label(content, structure=np.ones((3, 3), dtype=int))
    objs = ndimage.find_objects(labeled)
    comps = []
    for lid, sl in enumerate(objs, start=1):
        if sl is None:
            continue
        area = int((labeled[sl] == lid).sum())
        if area < MIN_AREA:
            continue
        comps.append(dict(lid=lid, area=area, y0=sl[0].start, y1=sl[0].stop, x0=sl[1].start, x1=sl[1].stop))
    if not comps:
        return []
    comps.sort(key=lambda c: -c['area'])
    biggest = comps[0]['area']
    anchors = [c for c in comps if c['area'] >= 0.15 * biggest]
    if len(anchors) > n_frames:
        warn(f'{label} : {len(anchors)} silhouettes pour {n_frames} frame(s) attendue(s) -> les {n_frames} plus grandes gardées, le reste rattaché')
        anchors = anchors[:n_frames]
    elif len(anchors) < n_frames:
        warn(f'{label} : {len(anchors)} silhouette(s) détectée(s) pour {n_frames} frame(s) attendue(s) (frames qui se touchent ?)')
    anchor_ids = {c['lid'] for c in anchors}
    groups = {c['lid']: [c] for c in anchors}
    for c in comps:
        if c['lid'] in anchor_ids:
            continue
        cx = (c['x0'] + c['x1']) / 2

        def dist(a):
            if a['x0'] <= cx <= a['x1']:
                return 0
            return min(abs(cx - a['x0']), abs(cx - a['x1']))
        best = min(anchors, key=dist)
        groups[best['lid']].append(c)
    frames = []
    for a in sorted(anchors, key=lambda c: c['x0']):
        g = groups[a['lid']]
        x0 = min(c['x0'] for c in g)
        x1 = max(c['x1'] for c in g)
        y0 = min(c['y0'] for c in g)
        y1 = max(c['y1'] for c in g)
        mask = np.isin(labeled[y0:y1, x0:x1], [c['lid'] for c in g])
        crop = band[y0:y1, x0:x1].copy()
        crop[~mask] = 0
        frames.append(crop)
    return frames


def grid_frames(arr, n_rows_img, row_local, n_frames, label):
    h, w = arr.shape[:2]
    band_h = h / n_rows_img
    y0, y1 = int(row_local * band_h), int((row_local + 1) * band_h)
    cw = w / n_frames
    frames = []
    for i in range(n_frames):
        x0, x1 = int(i * cw), int((i + 1) * cw)
        cell = arr[y0:y1, x0:x1]
        bb = alpha_bbox(cell)
        if bb is None:
            warn(f'{label} : cellule {i} vide')
            frames.append(np.zeros((8, 8, 4), dtype=np.uint8))
            continue
        cx0, cy0, cx1, cy1 = bb
        if cx0 == 0 or cy0 == 0 or cx1 == cell.shape[1] or cy1 == cell.shape[0]:
            warn(f'{label} : frame {i} touche le bord de sa cellule (effet coupé ?)')
        frames.append(cell[cy0:cy1, cx0:cx1].copy())
    return frames


def place(crop, cw, ch, align):
    canvas = Image.new('RGBA', (cw, ch), (0, 0, 0, 0))
    im = Image.fromarray(crop, 'RGBA')
    if align == 'center':
        x, y = (cw - im.width) // 2, (ch - im.height) // 2
    elif align == 'left':
        x, y = PAD, (ch - im.height) // 2
    elif align == 'left-bottom':
        x, y = PAD, ch - PAD - im.height
    else:  # bottom
        x, y = (cw - im.width) // 2, ch - PAD - im.height
    canvas.paste(im, (x, y), im)
    return canvas


def anim_expected_files(aid, e):
    out = Path(ROOT, e['dir'])
    files = {}
    for name, a in e['anims'].items():
        for i in range(a['frames']):
            files.setdefault(a['row'], []).append(out / f"{e['prefix']}_row{a['row']}_{i}.png")
    return files


def import_anim(aid, e, force, dry):
    by_row = {a['row']: (name, a['frames']) for name, a in e['anims'].items()}
    expected = anim_expected_files(aid, e)
    present_sheets = [s for s in e['sheets'] if (ROOT / s['file']).exists()]
    missing_sheets = [s['file'] for s in e['sheets'] if not (ROOT / s['file']).exists()]
    if not present_sheets:
        return 'missing', missing_sheets
    needs = force or any(not f.exists() for s in present_sheets for r in s['rows'] for f in expected[r])
    if not needs:
        return 'ok', missing_sheets
    if dry:
        return 'would_cut', missing_sheets
    print(f'[{aid}] découpe de {len(present_sheets)} image(s)')
    rows_out = {}  # global row -> list of crops
    for s in present_sheets:
        path = ROOT / s['file']
        arr = load_rgba(path)
        n = len(s['rows'])
        # `frames` (optionnel) = nb de frames de CHAQUE rangée de l'image ; une même
        # rangée globale répétée dans `rows` = rangées image concaténées (crapaud).
        per_row = s.get('frames') or [by_row[g][1] for g in s['rows']]
        if e.get('cut') == 'grid':
            for local, grow in enumerate(s['rows']):
                name = by_row[grow][0]
                rows_out.setdefault(grow, []).extend(
                    grid_frames(arr, n, local, per_row[local], f'{aid} rangée {grow} ({name})'))
        else:
            segs = blob_rows(arr, n, f'{aid} {path.name}')
            for local, grow in enumerate(s['rows']):
                name = by_row[grow][0]
                if local >= len(segs):
                    warn(f'{aid} rangée {grow} ({name}) absente de {path.name}')
                    continue
                ry0, ry1 = segs[local]
                rows_out.setdefault(grow, []).extend(
                    blob_frames(arr, ry0, ry1, per_row[local], f'{aid} rangée {grow} ({name})'))
    all_crops = [c for fr in rows_out.values() for c in fr]
    if not all_crops:
        warn(f'{aid} : aucune frame trouvée')
        return 'error', missing_sheets
    cw = max(c.shape[1] for c in all_crops) + PAD * 2
    ch = max(c.shape[0] for c in all_crops) + PAD * 2
    if e.get('canvas'):
        # Canvas imposé (crapaud_corrompu = géométrie de crapaud_frames) : tout
        # est réduit d'un même facteur pour que le plus haut contenu tienne.
        fw, fh = e['canvas']
        k = (fh - PAD * 2) / max(c.shape[0] for c in all_crops)
        widest = max(c.shape[1] for c in all_crops) * k
        if widest > fw - PAD * 2:
            k *= (fw - PAD * 2) / widest
        if abs(widest - (fw - PAD * 2)) / fw > 0.12:
            warn(f'{aid} : frame la plus large = {widest:.0f}px une fois mise à l échelle, attendu ~{fw - PAD * 2}px (portée de langue)')
        for g in rows_out:
            rows_out[g] = [np.array(Image.fromarray(c, 'RGBA').resize(
                (max(1, round(c.shape[1] * k)), max(1, round(c.shape[0] * k))), Image.LANCZOS)) for c in rows_out[g]]
        cw, ch = fw, fh
    out_dir = ROOT / e['dir']
    out_dir.mkdir(parents=True, exist_ok=True)
    if force:
        for f in out_dir.glob(f"{e['prefix']}_row*_*.png"):
            grow = int(re.match(rf"{re.escape(e['prefix'])}_row(\d+)_", f.name).group(1))
            if grow in rows_out:
                f.unlink()
    align = e.get('align', 'bottom')
    for grow in sorted(rows_out):
        name, nf = by_row[grow]
        for i, crop in enumerate(rows_out[grow]):
            place(crop, cw, ch, align).save(out_dir / f"{e['prefix']}_row{grow}_{i}.png")
        status = 'OK' if len(rows_out[grow]) == nf else f'ATTENDU {nf}'
        print(f'  rangée {grow} {name}: {len(rows_out[grow])} frame(s) [{status}]')
    print(f'  canvas uniforme {cw}x{ch} -> {rel(out_dir)}')
    return 'cut', missing_sheets


# --------------------------------------------------------------------------- items
_planche_cache = {}


def planche_cells(path, grid, cut):
    key = (str(path), tuple(grid), cut)
    if key in _planche_cache:
        return _planche_cache[key]
    arr = load_rgba(path)
    cols, rows = grid
    cells = []
    if cut == 'columns':
        content = arr[:, :, 3] > ALPHA_T
        segs = [s for s in find_segments(content.any(axis=0)) if s[1] - s[0] > 20]
        if len(segs) != cols * rows:
            warn(f'{path.name} : {len(segs)} colonnes détectées, {cols * rows} attendues -> grille régulière')
        else:
            for x0, x1 in segs:
                cells.append(arr[:, x0:x1 + 1])
    if not cells:
        h, w = arr.shape[:2]
        for r in range(rows):
            for c in range(cols):
                cells.append(arr[int(r * h / rows):int((r + 1) * h / rows), int(c * w / cols):int((c + 1) * w / cols)])
    _planche_cache[key] = cells
    return cells


def normalize(arr, norm):
    mode = norm['mode']
    if mode == 'cover':
        im = Image.fromarray(arr, 'RGBA').convert('RGB')
        W, H = norm['w'], norm['h']
        s = max(W / im.width, H / im.height)
        im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
        x0, y0 = (im.width - W) // 2, (im.height - H) // 2
        return im.crop((x0, y0, x0 + W, y0 + H))
    if mode == 'height':
        # trim_x : liane tileable -> on ne rogne qu'horizontalement (raccord haut/bas intact)
        arr = trim(arr, axis_x=True, axis_y=not norm.get('trim_x', False))
        im = Image.fromarray(arr, 'RGBA')
        v = norm['value']
        return im.resize((max(1, round(im.width * v / im.height)), v), Image.LANCZOS)
    arr = trim(arr)
    im = Image.fromarray(arr, 'RGBA')
    if mode == 'fit':
        v = norm['value']
        s = v / max(im.width, im.height)
        if s < 1:
            im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
        return im
    if mode == 'square':
        side = max(im.width, im.height)
        sq = Image.new('RGBA', (side, side), (0, 0, 0, 0))
        sq.paste(im, ((side - im.width) // 2, (side - im.height) // 2), im)
        return sq.resize((norm['value'], norm['value']), Image.LANCZOS)
    return im  # trim


def import_item(iid, e, force, dry):
    out = ROOT / e['path']
    src = e['src']
    srcpath = ROOT / (src.get('planche') or src['file'])
    if not srcpath.exists():
        return 'missing', [rel(srcpath)]
    if out.exists() and not force:
        return 'ok', []
    if dry:
        return 'would_cut', []
    cover = e['norm']['mode'] == 'cover'
    if 'planche' in src:
        cells = planche_cells(srcpath, src['grid'], src.get('cut', 'grid'))
        if src['cell'] >= len(cells):
            warn(f'{iid} : cellule {src["cell"]} absente de {srcpath.name}')
            return 'error', []
        arr = cells[src['cell']]
        if alpha_bbox(arr) is None:
            warn(f'{iid} : cellule {src["cell"]} vide dans {srcpath.name}')
            return 'error', []
    else:
        arr = load_rgba(srcpath, keep_opaque=cover)
    im = normalize(arr, e['norm'])
    save(im, out)
    print(f'[{iid}] -> {rel(out)} ({im.width}x{im.height})')
    return 'cut', []


# --------------------------------------------------------------------------- tilesets
def grid_cells_by_alpha(arr, cols, rows, label):
    content = arr[:, :, 3] > 40
    xs = [s for s in find_segments(content.any(axis=0)) if s[1] - s[0] > 20]
    ys = [s for s in find_segments(content.any(axis=1)) if s[1] - s[0] > 20]
    if len(xs) != cols or len(ys) != rows:
        warn(f'{label} : grille {len(xs)}x{len(ys)} détectée, {cols}x{rows} attendue -> division régulière')
        bb = alpha_bbox(arr, 40)
        x0, y0, x1, y1 = bb
        xs = [(int(x0 + i * (x1 - x0) / cols), int(x0 + (i + 1) * (x1 - x0) / cols) - 1) for i in range(cols)]
        ys = [(int(y0 + i * (y1 - y0) / rows), int(y0 + (i + 1) * (y1 - y0) / rows) - 1) for i in range(rows)]
    return {(r, c): arr[ys[r][0]:ys[r][1] + 1, xs[c][0]:xs[c][1] + 1] for r in range(rows) for c in range(cols)}


def make_tile(cell, name):
    cell = trim(cell)
    h, w = cell.shape[:2]
    if name in TOP_TILES:
        # garde l'en-tête transparent (ciel) : carré de côté max(w,h), contenu en bas
        side = max(w, h)
        sq = Image.new('RGBA', (side, side), (0, 0, 0, 0))
        im = Image.fromarray(cell, 'RGBA')
        sq.paste(im, ((side - w) // 2, side - h), im)
    else:
        side = min(w, h)
        x0, y0 = (w - side) // 2, (h - side) // 2
        sq = Image.fromarray(cell[y0:y0 + side, x0:x0 + side], 'RGBA')
    tile = sq.resize((TILE, TILE), Image.LANCZOS)
    boost = HEIGHT_BOOST.get(name)
    if boost:
        canvas = Image.new('RGBA', (TILE, round(TILE * boost)), (0, 0, 0, 0))
        canvas.paste(tile, (0, canvas.height - TILE), tile)
        tile = canvas
    return tile


def import_tileset(tid, e, force, dry):
    out_dir = ROOT / e['dir']
    srcs = {k: ROOT / v for k, v in e['src'].items()}
    missing = [rel(p) for p in srcs.values() if not p.exists()]
    if len(missing) == len(srcs):
        return 'missing', missing
    names = list(TILE_GRID.values()) + PLATFORM_NAMES + SPECIAL_NAMES
    if not force and all((out_dir / f'{n}.png').exists() for n in names):
        return 'ok', missing
    if dry:
        return 'would_cut', missing
    print(f'[{tid}]')
    jobs = []
    if srcs['sol'].exists():
        cells = grid_cells_by_alpha(load_rgba(srcs['sol']), 4, 4, f'{tid} sol')
        jobs += [(name, cells[rc]) for rc, name in TILE_GRID.items()]
    if srcs['plateformes'].exists():
        cells = grid_cells_by_alpha(load_rgba(srcs['plateformes']), 3, 1, f'{tid} plateformes')
        jobs += [(n, cells[(0, i)]) for i, n in enumerate(PLATFORM_NAMES)]
    if srcs['speciaux'].exists():
        cells = grid_cells_by_alpha(load_rgba(srcs['speciaux']), 3, 1, f'{tid} speciaux')
        jobs += [(n, cells[(0, i)]) for i, n in enumerate(SPECIAL_NAMES)]
    for name, cell in jobs:
        if alpha_bbox(cell) is None:
            warn(f'{tid} : tuile {name} vide')
            continue
        save(make_tile(cell, name), out_dir / f'{name}.png')
    print(f'  {len(jobs)} tuile(s) -> {rel(out_dir)}')
    return 'cut', missing


# --------------------------------------------------------------------------- asset_present.js
PRESENT_JS = ROOT / 'src' / 'data' / 'asset_present.js'
# Les 21 cases d'un jeu de tuiles telles que BootScene.autotileFiles() les charge.
AUTOTILE_FILES = ([f'dirt_{p}' for p in ('tl', 't', 'tr', 'l', 'c', 'r', 'bl', 'b', 'br')]
                  + [f'dirt_platform{i}' for i in range(3)] + [f'dirt_c_var{i}' for i in range(6)]
                  + ['dirt_angle', 'coin'])


def write_asset_present(anims, items, tilesets):
    """Écrit src/data/asset_present.js : la liste des fichiers du manifest qui
    existent VRAIMENT. Le jeu (loadManifestAssets / BootScene) ne demande que
    ceux-là -- sinon des centaines de 404 ralentissent fortement le chargement."""
    paths = []
    for aid, e in anims.items():
        for files in anim_expected_files(aid, e).values():
            paths += [f for f in files if f.exists()]
    for iid, e in items.items():
        if e.get('path') and (ROOT / e['path']).exists():
            paths.append(ROOT / e['path'])
    for tid, e in tilesets.items():
        paths += [ROOT / e['dir'] / f'{n}.png' for n in AUTOTILE_FILES if (ROOT / e['dir'] / f'{n}.png').exists()]
    rels = sorted({rel(p) for p in paths})
    body = ''.join(f'  "{r}",\n' for r in rels)
    PRESENT_JS.write_text(
        '// GÉNÉRÉ par tools/import_codex_assets.py (fin de chaque exécution) -- ne pas éditer.\n'
        '// Fichiers du manifest réellement présents sur disque : seuls ceux-ci sont\n'
        '// chargés par loadManifestAssets (StoryKit.js), le reste reste en placeholder.\n'
        f'const ASSET_PRESENT = new Set([\n{body}]);\n', encoding='utf-8')
    print(f'\nasset_present.js : {len(rels)} fichier(s) présent(s).')


# --------------------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--force', action='store_true', help='redécoupe même si les sorties existent')
    ap.add_argument('--only', nargs='+', metavar='ID', help='ne traiter que ces IDs')
    ap.add_argument('--dry-run', action='store_true', help='rapport seulement, aucune écriture')
    ap.add_argument('--present-only', action='store_true', help='régénère seulement src/data/asset_present.js')
    args = ap.parse_args()

    anims, items, tilesets = load_manifest()
    if args.present_only:
        write_asset_present(anims, items, tilesets)
        return
    only = set(args.only) if args.only else None
    if only:
        unknown = only - set(anims) - set(items) - set(tilesets)
        if unknown:
            print('IDs inconnus :', ', '.join(sorted(unknown)))
    report = {'cut': [], 'ok': [], 'missing': [], 'error': [], 'would_cut': []}
    partial = []
    for kind, table, fn in (('anim', anims, import_anim), ('item', items, import_item),
                            ('tileset', tilesets, import_tileset)):
        for iid, e in table.items():
            if only and iid not in only:
                continue
            try:
                status, missing = fn(iid, e, args.force, args.dry_run)
            except Exception as ex:  # ne jamais tout faire planter pour un asset
                warn(f'{iid} : erreur {type(ex).__name__}: {ex}')
                status, missing = 'error', []
            report[status].append(iid)
            if status in ('cut', 'ok', 'would_cut') and missing:
                partial.append((iid, missing))

    print('\n================ RAPPORT ================')
    labels = [('cut', 'Découpés maintenant'), ('would_cut', 'À découper (dry-run)'), ('ok', 'Déjà présents'),
              ('error', 'Erreurs'), ('missing', 'Source manquante (à générer)')]
    for key, label in labels:
        ids = report[key]
        if ids or key in ('cut', 'missing'):
            print(f'{label} ({len(ids)}) : ' + (', '.join(ids) if ids else '-'))
    if partial:
        print('\nImages partielles manquantes :')
        for iid, miss in partial:
            print(f'  {iid}: ' + ', '.join(miss))
    if WARNINGS:
        print(f'\n{len(WARNINGS)} avertissement(s) :')
        for w in WARNINGS:
            print('  -', w)
    else:
        print('\nAucun avertissement.')
    if not args.dry_run:
        write_asset_present(anims, items, tilesets)


if __name__ == '__main__':
    main()
