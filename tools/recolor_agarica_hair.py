"""Usage : python tools/recolor_agarica_hair.py <png>...  (modifie les fichiers EN PLACE)

Recolore les cheveux rouges d'Agarica en brun clair orangé (#C9773F), en place.
Sélection : pixels rouge vif saturés (vert/rouge < 0.38) groupés en composantes
connexes ; seules les grosses composantes (cheveux) sont recolorées, le petit
tatouage spirale reste rouge. Luminosité relative conservée (ombres/reflets)."""
import sys, numpy as np
from PIL import Image
from scipy import ndimage
BASE = np.array([201, 119, 63], float)
REF = 0.299*189 + 0.587*44 + 0.114*27
def mask_of(a):
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    ratio = g / np.maximum(r, 1)
    m = (al > 10) & (r > 60) & (r >= g) & (r >= b) & (ratio < 0.38) & ((b / np.maximum(r, 1)) < 0.38)
    lab, n = ndimage.label(m, structure=np.ones((3, 3)))
    if n == 0: return m & False
    sizes = ndimage.sum(m, lab, range(1, n + 1))
    keep = [i + 1 for i, s in enumerate(sizes) if s >= max(40, 0.15 * sizes.max())]
    return np.isin(lab, keep)
def recolor(path, out=None, dry=False):
    im = Image.open(path); mode = im.mode
    a = np.array(im.convert('RGBA')).astype(float)
    m = mask_of(a)
    L = 0.299*a[..., 0] + 0.587*a[..., 1] + 0.114*a[..., 2]
    k = np.clip(L / REF, 0.25, 2.2)
    o = a.copy()
    for c in range(3): o[..., c] = np.where(m, np.clip(BASE[c]*k, 0, 255), a[..., c])
    res = Image.fromarray(o.astype(np.uint8), 'RGBA')
    if not dry: res.save(out or path)
    return res, int(m.sum())
if __name__ == '__main__':
    for p in sys.argv[1:]:
        _, n = recolor(p); print(n, p)
