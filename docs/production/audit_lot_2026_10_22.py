"""Contrôles en lecture seule ; seules les images de vérification sont composées."""
import json
from pathlib import Path
import sys

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent / 'controles' / 'lot_2026-10-22'
OUT.mkdir(parents=True, exist_ok=True)
sys.path.insert(0, str(ROOT / 'tools'))
import import_codex_assets as importer

results = {'fonds': {}, 'decors': {}}
for source in sorted((ROOT / 'assets/_codex_src').glob('fond_*.png')):
    for stage, path in [('source', source), ('importe', ROOT / 'assets/decors/fonds' / source.name)]:
        if not path.exists():
            continue
        im = Image.open(path).convert('RGB')
        a = np.asarray(im, dtype=float)
        seam = float(np.abs(a[:, 0] - a[:, -1]).mean())
        adjacent = float(np.abs(a[:, 1:] - a[:, :-1]).mean())
        repeated = Image.new('RGB', (im.width * 2, im.height))
        repeated.paste(im, (0, 0))
        repeated.paste(im, (im.width, 0))
        repeated.thumbnail((2400, 900))
        name = source.stem + '_' + stage + '_raccord.jpg'
        repeated.save(OUT / name, quality=95)
        results['fonds'][source.stem + '_' + stage] = {
            'dimensions': im.size, 'ecart_moyen_bords_rgb_255': round(seam, 3),
            'ecart_moyen_colonnes_voisines': round(adjacent, 3),
            'apercu': name,
            'note': 'La mesure signale les ruptures ; validation visuelle requise.',
        }

for section in ['grand_arbre', 'grand_arbre_tronc', 'foret_sombre', 'foret_flottante', 'foret_corrompue', 'hutte_morgat']:
    path = ROOT / 'assets/decors/déco item' / section / (section + '_planche.png')
    if not path.exists():
        continue
    a = importer.load_rgba(path)
    cols, rows = (5, 2) if section == 'grand_arbre_tronc' else (4, 3)
    h, w = a.shape[:2]
    cells = []
    for row in range(rows):
        for col in range(cols):
            y0, y1 = h * row // rows, h * (row + 1) // rows
            x0, x1 = w * col // cols, w * (col + 1) // cols
            mask = a[y0:y1, x0:x1, 3] > importer.ALPHA_T
            ys, xs = np.where(mask)
            cells.append({'row': row, 'col': col, 'vide': not bool(len(ys)),
                          'base_y': int(y0 + ys.max()) if len(ys) else None,
                          'ecart_bas_case': int(y1 - 1 - ys.max() - y0) if len(ys) else None})
    results['decors'][section] = {'dimensions': [w, h], 'grid': [cols, rows], 'cases': cells,
                                'note': 'Planche conservée entière, aucune découpe.'}

groups = [
    ('fonds', sorted(OUT.glob('*_importe_raccord.jpg')), 1, (1600, 320)),
    ('decors', sorted((ROOT / 'assets/decors').glob('*/*/*_planche.png')), 2, (768, 540)),
    ('interface', sorted((ROOT / 'assets/_codex_src').glob('portrait_*.png')) + sorted((ROOT / 'assets/_codex_src').glob('*icone*.png')), 4, (380, 410)),
    ('vfx', sorted((ROOT / 'assets/vfx').glob('vfx_*.png')), 2, (768, 540)),
    ('tuiles', sorted((ROOT / 'assets/_codex_src').glob('tuiles_*.png')), 3, (512, 360)),
]
for group, paths, cols, cell in groups:
    if not paths:
        continue
    sheet = Image.new('RGB', (cols * cell[0], ((len(paths) + cols - 1) // cols) * cell[1]), (44, 47, 55))
    draw = ImageDraw.Draw(sheet)
    for i, path in enumerate(paths):
        im = Image.open(path).convert('RGBA')
        im.thumbnail((cell[0] - 10, cell[1] - 25))
        x, y = (i % cols) * cell[0], (i // cols) * cell[1]
        sheet.paste(im, (x + (cell[0] - im.width) // 2, y + 22), im)
        draw.text((x + 5, y + 4), path.stem, fill='white')
    sheet.save(OUT / (group + '_contact.jpg'), quality=95)

(OUT / 'audit.json').write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(results, ensure_ascii=True, indent=2))
