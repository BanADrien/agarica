"""Gaine de feu du grizzly dessinée par Codex (prompt n°17) -> images du jeu.

    python tools/import_grizzly_feu_codex.py [hauteur]

Lit   assets/vfx/grizzly_feu_codex.png (1536 x 1024, 6 images : 2 colonnes x 3 rangées, effet tourné
      vers la DROITE, intérieur vide).
Écrit assets/vfx/ursides_feu/grizzly_feu_<0..5>.png (1 pixel dessiné = 1 px d'écran, alpha net, petite
      palette commune), src/data/grizzly_feu_fx.js et le numéro de src/data/asset_version.js.
`hauteur` (128 par défaut) : hauteur de l'effet à l'écran, en px, langues de flamme comprises ; le grizzly
visible en fait 94 : les deux traînées passent juste au-dessus de son dos et au ras de ses pattes.
Les 6 images sont recalées entre elles sur l'AVANT de la coiffe (bord droit) et sur son milieu vertical,
pour que la boucle ne tremble pas. Ancrage (ox, oy) = centre du corps du grizzly : `ox` est pris à
(épaisseur de la coiffe + demi-longueur du corps, 72 px) derrière le bord avant ; `bodyH` = 100 : Ursides.js pose l'image à pieds - bodyH / 2, donc le milieu de
l'effet tombe au milieu du corps.
"""
import json
import os
import sys
import time

import numpy as np
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
COLS, ROWS = 2, 3
BODY_W = 144            # longueur du grizzly visible à l'écran


def main():
    target_h = int(sys.argv[1]) if len(sys.argv) > 1 else 128
    sheet = Image.open(os.path.join(ROOT, 'assets/vfx/grizzly_feu_codex.png')).convert('RGBA')
    cw = sheet.width // COLS
    cells = []
    for r in range(ROWS):
        y0, y1 = round(r * sheet.height / ROWS), round((r + 1) * sheet.height / ROWS)
        for c in range(COLS):
            cells.append(sheet.crop((c * cw, y0, (c + 1) * cw, y1)))

    def mask(im):
        a = np.array(im).astype(np.int32)
        # halo de Codex (sombre, à demi transparent) : hors du dessin
        return (a[..., 3] >= 150) & (a[..., :3].max(axis=2) >= 80)

    boxes = []
    for c in cells:
        m = mask(c)
        ys, xs = np.where(m.any(1))[0], np.where(m.any(0))[0]
        boxes.append((xs[0], ys[0], xs[-1] + 1, ys[-1] + 1))
    h_src = float(np.median([b[3] - b[1] for b in boxes]))
    k = target_h / h_src
    # cadre commun : toutes les images calées sur leur bord avant (droit) et leur milieu vertical
    w_out = int(np.ceil(max(b[2] - b[0] for b in boxes) * k)) + 8
    h_out = int(np.ceil(max(b[3] - b[1] for b in boxes) * k)) + 8
    small = []
    for c, b in zip(cells, boxes):
        crop = c.crop(b)
        sw, sh = max(1, round(crop.width * k)), max(1, round(crop.height * k))
        s = crop.convert('RGBa').resize((sw, sh), Image.BOX).convert('RGBA')
        arr = np.array(s)
        keep = (arr[..., 3] >= 140) & (arr[..., :3].max(axis=2) >= 80)
        arr[..., 3] = np.where(keep, 255, 0)
        arr[~keep] = 0
        out = Image.new('RGBA', (w_out, h_out), (0, 0, 0, 0))
        out.paste(Image.fromarray(arr, 'RGBA'), (w_out - 4 - sw, (h_out - sh) // 2))
        small.append(out)
    # palette commune
    strip = Image.new('RGB', (w_out * len(small), h_out), (0, 0, 0))
    for i, s in enumerate(small):
        strip.paste(s.convert('RGB'), (i * w_out, 0))
    pal = strip.quantize(colors=9, method=Image.MEDIANCUT, dither=Image.NONE)
    d = os.path.join(ROOT, 'assets/vfx/ursides_feu')
    os.makedirs(d, exist_ok=True)
    for f in os.listdir(d):
        if f.startswith('grizzly_feu_') and f.endswith('.png'):
            os.remove(os.path.join(d, f))
    cap = 0
    for i, s in enumerate(small):
        q = pal.crop((i * w_out, 0, (i + 1) * w_out, h_out)).convert('RGBA')
        q.putalpha(s.getchannel('A'))
        q.save(os.path.join(d, f'grizzly_feu_{i}.png'))
        if i == 0:
            # épaisseur de la coiffe sur la ligne médiane : pixels opaques en partant du bord avant
            row = np.array(q)[h_out // 2, :, 3] > 0
            xs = np.where(row)[0]
            if len(xs):
                x = xs[-1]
                while x >= 0 and row[x]:
                    x -= 1
                cap = int(xs[-1] - x)
    front = w_out - 4
    data = {'dir': 'assets/vfx/ursides_feu', 'prefix': 'grizzly_feu', 'frames': len(small), 'fps': 12,
            'w': w_out, 'h': h_out, 'ox': int(front - cap - BODY_W // 2), 'oy': h_out // 2,
            'bodyW': BODY_W, 'bodyH': 100}
    open(os.path.join(ROOT, 'src/data/grizzly_feu_fx.js'), 'w', encoding='utf-8', newline='\n').write(
        "// GÉNÉRÉ par tools/import_grizzly_feu_codex.py -- ne pas modifier à la main.\n"
        "// Gaine de feu du grizzly en charge (passif des ursidés de palier 5), dessinée par Codex (prompt n°17) :\n"
        "// tailles en px d'écran, (ox, oy) = centre du corps visible du grizzly dans l'image (ours vers la droite).\n"
        f"const GRIZZLY_FEU_FX = {json.dumps(data, indent=1)};\n")
    open(os.path.join(ROOT, 'src/data/asset_version.js'), 'w', encoding='utf-8', newline='\n').write(
        "// GÉNÉRÉ (tools/pixelfix.js et autres outils d'images) -- ne pas modifier à la main.\n"
        f"const ASSET_VERSION = '{int(time.time() * 1000)}';\n")
    print('ok', data, '| coiffe', cap, 'px | facteur', round(k, 3))


if __name__ == '__main__':
    main()
