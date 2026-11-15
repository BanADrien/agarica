"""Marche d'Agarica en 8 poses dessinée par Codex (prompt n°15) -> images du jeu.

    python tools/import_marche_codex.py

Lit   assets/sprites/agarica_marche.png (1536 x 1024, 2 rangées de 4 poses, cases 384 x 512,
      personnage tourné vers la DROITE).
Écrit assets/sprites/agarica_walk_frames/agarica_walk_<0..7>.png (261 x 357, tournée vers la GAUCHE
      comme les autres images d'Agarica), les originaux lissés dans assets/_pixelfix_originals/,
      les lignes de src/data/pixel_fixed.js et le numéro de src/data/asset_version.js.
Même grain que le reste d'Agarica (3,76 px d'image par pixel dessiné) et MÊME palette que l'image
de repos (agarica_frames/agarica_row0_0.png) : chaque pixel prend la couleur la plus proche.
Recalage : pieds sur la ligne de base des anciennes images (y = 351), bord gauche de la tête au
même endroit (x = 21) ; une pose dont le pied dépasserait du cadre est décalée du strict nécessaire.
"""
import os
import re
import time

import numpy as np
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
W, H, F = 261, 357, 3.76          # cadre du jeu, px d'image par pixel dessiné
GW, GH = round(W / F), round(H / F)   # grille de pixels dessinés (69 x 95)
BASE_Y, HEAD_X = 351, 21
TALL = 345                        # hauteur d'Agarica dans le cadre (tête -> pieds), comme avant


def main():
    sheet = Image.open(os.path.join(ROOT, 'assets/sprites/agarica_marche.png')).convert('RGBA')
    idle = Image.open(os.path.join(ROOT, 'assets/sprites/agarica_frames/agarica_row0_0.png')).convert('RGBA')
    pal = np.array(sorted({p[:3] for p in idle.getdata() if p[3] > 200}), dtype=np.int32)
    # hauteur moyenne du personnage chez Codex -> même facteur pour les 8 poses (le rebond est gardé)
    cells = []
    for k in range(8):
        c = sheet.crop(((k % 4) * 384, (k // 4) * 512, (k % 4 + 1) * 384, (k // 4 + 1) * 512))
        cells.append(c.transpose(Image.FLIP_LEFT_RIGHT))
    tops = [np.where((np.array(c)[..., 3] > 40).any(1))[0] for c in cells]
    tall = float(np.median([t[-1] - t[0] + 1 for t in tops]))
    k_img = TALL / tall
    out_dir = os.path.join(ROOT, 'assets/sprites/agarica_walk_frames')
    org_dir = os.path.join(ROOT, 'assets/_pixelfix_originals/sprites/agarica_walk_frames')
    os.makedirs(org_dir, exist_ok=True)
    for i, c in enumerate(cells):
        a = np.array(c)[..., 3] > 40
        ys, xs = np.where(a.any(1))[0], np.where(a.any(0))[0]
        head = np.where(a[ys[0]:ys[0] + 120].any(0))[0]
        # image lissée au cadre du jeu (l'« original » que garde le pixel-fixer)
        sw, sh = round(c.width * k_img), round(c.height * k_img)
        s = c.convert('RGBa').resize((sw, sh), Image.LANCZOS).convert('RGBA')
        dx = HEAD_X - round(head[0] * k_img)
        dx = max(dx, 1 - round(xs[0] * k_img))            # rien ne sort à gauche
        dx = min(dx, W - 2 - round(xs[-1] * k_img))       # ni à droite
        dy = BASE_Y - round(ys[-1] * k_img)
        smooth = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        smooth.paste(s, (dx, dy))
        smooth.save(os.path.join(org_dir, f'agarica_walk_{i}.png'))
        # pixel art : une couleur par case de la grille (moyenne), alpha net, palette de l'image de repos
        g = smooth.convert('RGBa').resize((GW, GH), Image.BOX).convert('RGBA')
        arr = np.array(g).astype(np.int32)
        rgb = arr[..., :3].reshape(-1, 3)
        idx = ((rgb[:, None, :] - pal[None, :, :]) ** 2 * np.array([2, 4, 3])).sum(2).argmin(1)
        arr[..., :3] = pal[idx].reshape(GH, GW, 3)
        arr[..., 3] = np.where(arr[..., 3] >= 128, 255, 0)
        arr[arr[..., 3] == 0] = 0
        small = Image.fromarray(arr.astype(np.uint8), 'RGBA')
        small.resize((W, H), Image.NEAREST).save(os.path.join(out_dir, f'agarica_walk_{i}.png'))
    # pixel_fixed.js : les 8 images sont du pixel art (même lot que les 4 anciennes)
    p = os.path.join(ROOT, 'src/data/pixel_fixed.js')
    src = open(p, encoding='utf-8').read()
    nl = '\r\n' if '\r\n' in src else '\n'
    line = lambda i: f'  "assets/sprites/agarica_walk_frames/agarica_walk_{i}.png": {{"f":3.76,"set":"agarica:marche"}},'
    for i in range(4, 8):
        if line(i) not in src:
            src = src.replace(line(i - 1), line(i - 1) + nl + line(i))
    open(p, 'w', encoding='utf-8', newline='').write(src)
    open(os.path.join(ROOT, 'src/data/asset_version.js'), 'w', encoding='utf-8', newline='\n').write(
        "// GÉNÉRÉ (tools/pixelfix.js et autres outils d'images) -- ne pas modifier à la main.\n"
        f"const ASSET_VERSION = '{int(time.time() * 1000)}';\n")
    print('8 poses écrites, facteur', round(k_img, 3), 'palette', len(pal), 'couleurs')


if __name__ == '__main__':
    main()
