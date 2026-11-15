"""Effets d'attaque du loup dessinés par Codex (prompt n°16) -> images du jeu, au grain du jeu.

    python tools/import_loup_codex.py

Lit   assets/vfx/loup_croc_codex.png et assets/vfx/loup_griffes_codex.png (1536 x 1024, cases de
      512 x 512 : 3 en haut, 2 en bas à gauche).
Écrit assets/vfx/vfx_croc_frames/vfx_croc_row0_<0..4>.png  (croc ; 1 pixel dessiné = 3 px d'image,
      affiché à 1/3 : 1 px d'écran, le grain de l'arc de la dague)
      assets/vfx/loup_frames/griffes_<0..4>.png            (coup de patte ; affiché à l'échelle 1)
      l'entrée `griffes` de src/data/loup_fx.js et le numéro de src/data/asset_version.js.
Chaque case est réduite d'un coup (moyenne par bloc), puis rendue nette : alpha tout ou rien (le
halo sombre de Codex est retiré), couleurs ramenées à une petite palette commune aux 5 images.
"""
import json
import os
import re
import time

from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
CELL = 512
CELLS = [(0, 0), (1, 0), (2, 0), (0, 1), (1, 1)]


def cells(path):
    im = Image.open(os.path.join(ROOT, path)).convert('RGBA')
    return [im.crop((cx * CELL, cy * CELL, (cx + 1) * CELL, (cy + 1) * CELL)) for cx, cy in CELLS]


def crisp(frames, size, colors):
    """Réduit chaque case à `size` px de côté, alpha net, palette commune de `colors` couleurs."""
    small = []
    for f in frames:
        # alpha prémultiplié : les bords ne ramènent pas le noir des pixels transparents
        s = f.convert('RGBa').resize((size, size), Image.BOX).convert('RGBA')
        px = s.load()
        for y in range(size):
            for x in range(size):
                r, g, b, a = px[x, y]
                # halo de Codex : vert très sombre et à demi transparent autour des formes -> retiré
                keep = a >= 150 and max(r, g, b) >= 70
                px[x, y] = (r, g, b, 255) if keep else (0, 0, 0, 0)
        small.append(s)
    # palette commune : toutes les images côte à côte
    strip = Image.new('RGB', (size * len(small), size), (0, 0, 0))
    for i, s in enumerate(small):
        strip.paste(s.convert('RGB'), (i * size, 0))
    pal = strip.quantize(colors=colors + 1, method=Image.MEDIANCUT, dither=Image.NONE)
    out = []
    for i, s in enumerate(small):
        q = pal.crop((i * size, 0, (i + 1) * size, size)).convert('RGBA')
        q.putalpha(s.getchannel('A'))
        out.append(q)
    return out


def main():
    # --- croc : case de 512 -> 84 pixels dessinés, écrits x3 (252 px), affichés à 1/3
    # (104 au départ ; réduit de 20 % le 2026-11-15 : « bien mais un peu grand »)
    CS = 84
    croc = crisp(cells('assets/vfx/loup_croc_codex.png'), CS, 7)
    d = os.path.join(ROOT, 'assets/vfx/vfx_croc_frames')
    for i, f in enumerate(croc):
        f.resize((CS * 3, CS * 3), Image.NEAREST).save(os.path.join(d, f'vfx_croc_row0_{i}.png'))
    b = croc[1].getbbox()
    print('croc : image active, largeur opaque', (b[2] - b[0]) * 3, 'px ->  SLASH_ARCS.bite.w =', b[2] - b[0],
          '; centre des dents à', round((b[0] + b[2]) / 2 - CS / 2, 1), 'px du centre de la case')

    # --- griffes : case de 512 -> 80 px, affichées telles quelles (1 pixel dessiné = 1 px d'écran ;
    # 100 au départ, réduites de 20 % avec le croc)
    S = 80
    gr = crisp(cells('assets/vfx/loup_griffes_codex.png'), S, 6)
    d = os.path.join(ROOT, 'assets/vfx/loup_frames')
    for i, f in enumerate(gr):
        f.save(os.path.join(d, f'griffes_{i}.png'))
    # ancrage : haut des marques, au milieu de leur largeur (image pleine, sans les feuilles du bas)
    full = gr[2]
    top = full.getbbox()[1]
    band = full.crop((0, top, S, top + 24)).getbbox()
    bb = full.getbbox()
    ox = round((min(band[0], bb[0]) + bb[2]) / 2)
    entry = {'dir': 'assets/vfx/loup_frames', 'prefix': 'griffes', 'frames': 5, 'w': S, 'h': S, 'ox': ox, 'oy': top}
    p = os.path.join(ROOT, 'src/data/loup_fx.js')
    src = open(p, encoding='utf-8').read()
    m = re.search(r'const LOUP_FX = (\{.*\});', src, re.S)
    data = json.loads(m.group(1))
    data['griffes'] = entry
    data['croc'] = {'scale': 1 / 3}
    open(p, 'w', encoding='utf-8', newline='\n').write(src[:m.start(1)] + json.dumps(data, indent=1) + src[m.end(1):])
    open(os.path.join(ROOT, 'src/data/asset_version.js'), 'w', encoding='utf-8', newline='\n').write(
        "// GÉNÉRÉ (tools/pixelfix.js et autres outils d'images) -- ne pas modifier à la main.\n"
        f"const ASSET_VERSION = '{int(time.time() * 1000)}';\n")
    print('griffes :', entry)


if __name__ == '__main__':
    main()
