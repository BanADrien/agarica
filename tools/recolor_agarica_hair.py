"""Usage : python tools/recolor_agarica_hair.py <png>...  (modifie les fichiers EN PLACE)

Recolore les cheveux d'Agarica (rouge vif des images d'origine) en AUBURN CLAIR
(#B5613A, proposition 7), choix définitif de l'utilisateur du 2026-10-23 (cf. docs/production/
cheveux_agarica_propositions.png). À lancer sur les images d'ORIGINE (cheveux
rouges) : relancer sur une image déjà recolorée ne fait rien (plus de rouge vif).

Sélection : pixels rouge vif saturés (vert/rouge et bleu/rouge < 0.38) groupés en
composantes connexes ; seules les grosses composantes (les cheveux) sont
recolorées -- le petit tatouage spirale, rouge lui aussi, reste intact.
Recoloration en TSV : la teinte devient celle de la cible, saturation et valeur
sont mises à l'échelle depuis celles du rouge d'origine (#BD2C1B), ce qui garde
les ombres et les reflets dessinés."""
import colorsys
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

TARGET = '#B5613A'
ORIGIN_H, ORIGIN_S, ORIGIN_V = colorsys.rgb_to_hsv(189 / 255, 44 / 255, 27 / 255)


def mask_of(a):
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    m = (al > 10) & (r > 60) & (r >= g) & (r >= b) \
        & ((g / np.maximum(r, 1)) < 0.38) & ((b / np.maximum(r, 1)) < 0.38)
    lab, n = ndimage.label(m, structure=np.ones((3, 3)))
    if n == 0:
        return m & False
    sizes = ndimage.sum(m, lab, range(1, n + 1))
    keep = [i + 1 for i, s in enumerate(sizes) if s >= max(40, 0.15 * sizes.max())]
    return np.isin(lab, keep)


def hsv_to_rgb_arrays(h, s, v):
    i = np.floor(h * 6) % 6
    f = h * 6 - np.floor(h * 6)
    p, q, t = v * (1 - s), v * (1 - f * s), v * (1 - (1 - f) * s)
    choices = [(v, t, p), (q, v, p), (p, v, t), (p, q, v), (t, p, v), (v, p, q)]
    out = np.zeros(h.shape + (3,))
    for k, (r, g, b) in enumerate(choices):
        mk = i == k
        out[..., 0] = np.where(mk, r, out[..., 0])
        out[..., 1] = np.where(mk, g, out[..., 1])
        out[..., 2] = np.where(mk, b, out[..., 2])
    return out


def recolor_array(a, target=TARGET):
    m = mask_of(a)
    th, ts, tv = colorsys.rgb_to_hsv(*[int(target[i:i + 2], 16) / 255 for i in (1, 3, 5)])
    rgb = a[..., :3] / 255.0
    mx, mn = rgb.max(-1), rgb.min(-1)
    s = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    new = hsv_to_rgb_arrays(np.full(mx.shape, th),
                            np.clip(s * (ts / ORIGIN_S), 0, 1),
                            np.clip(mx * (tv / ORIGIN_V), 0, 1))
    o = a.copy()
    for c in range(3):
        o[..., c] = np.where(m, new[..., c] * 255, a[..., c])
    return o, int(m.sum())


def recolor(path, out=None, dry=False, target=TARGET):
    a = np.array(Image.open(path).convert('RGBA')).astype(float)
    o, n = recolor_array(a, target)
    res = Image.fromarray(np.clip(o, 0, 255).astype(np.uint8), 'RGBA')
    if not dry:
        res.save(out or path)
    return res, n


if __name__ == '__main__':
    for p in sys.argv[1:]:
        _, n = recolor(p)
        print(n, p)
