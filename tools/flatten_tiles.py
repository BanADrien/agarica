"""Aplanit la terre d'un jeu de tuiles avant sa pixelisation (raccords propres).

Usage :  python tools/flatten_tiles.py <jeu> <dossier de sortie>
         puis : node tools/pixelfix.js tiles <jeu> --from <dossier de sortie> ...

Les tuiles IA ont chacune leur propre dégradé (plus claires en haut, plus
sombres en bas, vignette) : posées côte à côte, on voit une ligne à chaque
raccord. On ramène la terre de CHAQUE tuile à la même teinte moyenne, partout :
luminosité locale de la terre (flou large, calculé sur la terre seule) divisée
par celle de référence (moyenne de la terre de `dirt_c`). L'herbe, les pierres
de bordure et les cailloux clairs ne sont pas touchés. Lit toujours l'original
IA (assets/_pixelfix_originals/ s'il existe).
"""
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SIGMA = 28          # px : plus large que les cailloux, plus fin que la tuile
GAIN_LIMITS = (0.7, 1.45)


def source(path):
    rel = os.path.relpath(path, os.path.join(ROOT, 'assets'))
    orig = os.path.join(ROOT, 'assets', '_pixelfix_originals', rel)
    return orig if os.path.exists(orig) else path


def dirt_mask(rgb, alpha):
    r, g, b = [rgb[..., i].astype(np.float32) for i in range(3)]
    lum = 0.3 * r + 0.59 * g + 0.11 * b
    # terre : brun (rouge > vert > bleu), ni herbe (vert dominant) ni pierre claire
    return (alpha > 128) & (r > g * 1.08) & (g > b * 1.05) & (lum < 150) & (lum > 30)


def main():
    tileset, out = sys.argv[1], sys.argv[2]
    src_dir = os.path.join(ROOT, 'assets', 'decors', f'{tileset}_frames')
    os.makedirs(out, exist_ok=True)
    ref = np.asarray(Image.open(source(os.path.join(src_dir, 'dirt_c.png'))).convert('RGBA'))
    m = dirt_mask(ref[..., :3], ref[..., 3])
    target = (0.3 * ref[..., 0] + 0.59 * ref[..., 1] + 0.11 * ref[..., 2])[m].mean()
    for name in sorted(os.listdir(src_dir)):
        if not name.endswith('.png'):
            continue
        arr = np.asarray(Image.open(source(os.path.join(src_dir, name))).convert('RGBA')).astype(np.float32)
        rgb, alpha = arr[..., :3], arr[..., 3]
        mask = dirt_mask(rgb, alpha)
        if mask.mean() > 0.05:
            lum = 0.3 * rgb[..., 0] + 0.59 * rgb[..., 1] + 0.11 * rgb[..., 2]
            w = ndimage.gaussian_filter(mask.astype(np.float32), SIGMA, mode='nearest')
            local = ndimage.gaussian_filter(lum * mask, SIGMA, mode='nearest') / np.maximum(w, 1e-3)
            gain = np.clip(target / np.maximum(local, 1), *GAIN_LIMITS)
            gain = np.where(w > 0.08, gain, 1.0)
            # seulement la terre ; bord adouci pour ne pas découper les cailloux
            soft = ndimage.gaussian_filter(mask.astype(np.float32), 1.2)
            k = 1 + (gain - 1) * soft
            rgb = np.clip(rgb * k[..., None], 0, 255)
        Image.fromarray(np.dstack([rgb, alpha]).astype(np.uint8), 'RGBA').save(os.path.join(out, name))
    print(f'{tileset} : terre ramenée à la luminosité {target:.0f} -> {out}')


if __name__ == '__main__':
    main()
