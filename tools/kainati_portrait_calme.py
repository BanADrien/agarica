"""Portrait de Kainati épargné : yeux calmes (ambrés), sans la lueur verte.

Retour des joueuses du 2026-11-09 : « il a encore les yeux verts sur l'icône
de dialogue » une fois vaincu. Fabrique assets/ui/portraits/kainati_calme.png
à partir de assets/ui/portraits/kainati.png (art Codex, 512x512) en ne
retouchant QUE les deux yeux :
  - cœur blanc et anneau jaune-vert -> iris ambré (dégradé clair au centre,
    plus sombre au bord), pupille brun foncé ;
  - halo vert autour de l'œil -> gris de la peau (même luminosité), pour que
    la lueur de la corruption disparaisse sans trou dans le dessin.
La mousse sur la fourrure n'est pas touchée (il reste couvert de mousse, il
s'est seulement calmé). Usage : python tools/kainati_portrait_calme.py
(puis python tools/import_codex_assets.py --present-only).
"""
import os

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets', 'ui', 'portraits', 'kainati.png')
DST = os.path.join(ROOT, 'assets', 'ui', 'portraits', 'kainati_calme.png')

# Yeux mesurés sur l'image source : centre (x, y), demi-axes de la zone à
# retoucher (halo compris) et centre de la pupille.
EYES = [
    {'c': (335, 196), 'r': (24, 17), 'pupil': (336, 197)},
    {'c': (388, 209), 'r': (19, 14), 'pupil': (387, 210)},
]
AMBER_LIGHT = (255, 214, 130)
AMBER = (232, 146, 38)
AMBER_DARK = (150, 82, 22)
PUPIL = (48, 24, 12)


def lerp(a, b, t):
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(3))


def main():
    im = Image.open(SRC).convert('RGBA')
    px = im.load()
    for eye in EYES:
        cx, cy = eye['c']
        rx, ry = eye['r']
        for y in range(cy - ry, cy + ry + 1):
            for x in range(cx - rx, cx + rx + 1):
                d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2
                if d > 1:
                    continue
                r, g, b, a = px[x, y]
                if a == 0:
                    continue
                green = g - max(r, b)
                lum = 0.3 * r + 0.59 * g + 0.11 * b
                if min(r, g, b) > 200:
                    # Cœur blanc de la lueur -> centre clair de l'iris.
                    out = AMBER_LIGHT
                elif d > 0.5 and green > 8:
                    # Hors de l'œil (bord de l'arcade éclairé en vert) : peau.
                    k = 0.82
                    out = (int(lum * k), int(lum * k * 0.95), int(lum * k * 0.97))
                elif g > 170 and b < 120:
                    # Anneau jaune-vert -> ambre, plus sombre vers le bord.
                    out = lerp(AMBER, AMBER_LIGHT, max(0.0, (g - 170) / 85))
                elif green > 18 and g > 110:
                    # Vert vif du bord de l'iris -> ambre foncé.
                    out = lerp(AMBER_DARK, AMBER, min(1.0, (g - 110) / 100))
                elif green > 8:
                    # Halo vert sur la peau -> gris neutre de même luminosité
                    # (légèrement rabattue : la lueur éclaircissait la peau).
                    k = 0.82
                    out = (int(lum * k), int(lum * k * 0.95), int(lum * k * 0.97))
                else:
                    continue
                px[x, y] = (*out, a)
        # Pupille : petit ovale brun foncé, bord adouci.
        pxc, pyc = eye['pupil']
        for y in range(pyc - 4, pyc + 5):
            for x in range(pxc - 3, pxc + 4):
                d = ((x - pxc) / 2.6) ** 2 + ((y - pyc) / 3.4) ** 2
                if d > 1.2:
                    continue
                r, g, b, a = px[x, y]
                if (r, g, b) == (0, 0, 0) or a == 0:
                    continue
                # Seulement dans l'iris recoloré (pas sur le trait noir).
                if r < 120:
                    continue
                t = 1.0 if d <= 0.8 else (1.2 - d) / 0.4
                px[x, y] = (*lerp((r, g, b), PUPIL, t), a)
    im.save(DST)
    print('écrit', DST)


if __name__ == '__main__':
    main()
