#!/usr/bin/env python3
"""Découpe bosquet_grove.png (3 arbres sur une seule image) en props séparés.

Pourquoi : dans bosquet_grove.png, les deux petits arbres de droite ont la
base de leur touffe d'herbe dessinée ~40 px (source) plus haut que celle du
grand arbre. Le prop étant posé par le bas de l'image (origine 0.5, 1, cf.
buildLevelFromData), seul le grand arbre touchait le sol : les deux autres
flottaient. Chaque arbre devient donc son propre prop, rogné à son contenu,
la base de sa touffe d'herbe au ras du bas de l'image.

Les feuillages des arbres se touchent (une seule composante connexe sur
l'alpha) : entre deux arbres voisins, on trace une « couture » verticale
(seam carving : chemin de haut en bas, un pixel par rangée, décalage d'au
plus 1 px d'une rangée à l'autre) qui traverse le MOINS de pixels opaques
possible dans une bande de colonnes donnée. Elle passe donc par le vide
entre les arbres et ne coupe que le contact des feuillages.

Usage : python tools/split_grove.py   (relancer après retouche de bosquet_grove.png)
Écrit dans assets/decors/deco_item_frames/bosquet/ :
  bosquet_grand_arbre.png (le grand, avec lanternes), bosquet_arbre.png,
  bosquet_arbre_2.png (les deux petits). bosquet_grove.png reste en place
  (anciens brouillons d'éditeur).
"""
from pathlib import Path

import numpy as np
from PIL import Image

REPO_ROOT = Path(__file__).resolve().parent.parent
FRAMES_DIR = REPO_ROOT / 'assets' / 'decors' / 'deco_item_frames' / 'bosquet'
SOURCE = FRAMES_DIR / 'bosquet_grove.png'
ALPHA_MIN = 20

# Bandes de colonnes (pixels source) où chercher la couture entre deux arbres
# voisins, et nom de chaque arbre de gauche à droite.
SEAM_BANDS = [(190, 245), (325, 370)]
NAMES = ['bosquet_grand_arbre', 'bosquet_arbre', 'bosquet_arbre_2']


def seam(alpha, lo, hi):
    """Colonne de coupure par rangée (chemin vertical de coût d'opacité minimal)."""
    h = alpha.shape[0]
    cost = alpha[:, lo:hi].astype(np.float64) / 255.0
    acc = cost.copy()
    for y in range(1, h):
        prev = acc[y - 1]
        left = np.concatenate(([np.inf], prev[:-1]))
        right = np.concatenate((prev[1:], [np.inf]))
        acc[y] += np.minimum(prev, np.minimum(left, right))
    cols = np.zeros(h, dtype=np.int32)
    cols[-1] = int(acc[-1].argmin())
    for y in range(h - 2, -1, -1):
        c = cols[y + 1]
        a, b = max(0, c - 1), min(acc.shape[1], c + 2)
        cols[y] = a + int(acc[y, a:b].argmin())
    return cols + lo


def split():
    im = Image.open(SOURCE).convert('RGBA')
    arr = np.array(im)
    alpha = arr[:, :, 3]
    h, w = alpha.shape
    cuts = [seam(alpha, lo, hi) for lo, hi in SEAM_BANDS]
    xs_grid = np.arange(w)[None, :]
    bounds = [np.zeros(h, dtype=np.int32)] + cuts + [np.full(h, w, dtype=np.int32)]
    for i, name in enumerate(NAMES):
        sel = (xs_grid >= bounds[i][:, None]) & (xs_grid < bounds[i + 1][:, None])
        out = np.zeros_like(arr)
        out[sel] = arr[sel]
        ys, xs = np.nonzero(out[:, :, 3] > ALPHA_MIN)
        crop = out[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
        # Restes d'anticrénelage hors du rognage : sans importance (alpha <= ALPHA_MIN).
        path = FRAMES_DIR / f'{name}.png'
        Image.fromarray(crop).save(path)
        print(f'{path.relative_to(REPO_ROOT)} : {crop.shape[1]}x{crop.shape[0]} '
              f'(source x {xs.min()}-{xs.max()}, y {ys.min()}-{ys.max()})')


if __name__ == '__main__':
    split()
