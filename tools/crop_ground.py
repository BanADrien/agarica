#!/usr/bin/env python3
"""Crop the ground-block variants out of assets/decors/surface.png.

Like assets/items/totems.png, this sheet ships on a solid black canvas (no
real alpha channel) -- dechroma.py keys the background out in memory first
(see that module's docstring for why a flat brightness threshold alone
can't do it: the tile borders/cracks are near-black too and form one
connected network with the background).

The sheet is a strict 11-column grid (~123.5px pitch) with one row per
material: "SOL SURFACE" (grass top), "TERRE MILIEU" (plain dirt), skipped
"TRANSITION TERRE-ROCHE", then "SOUS-SOL PROFOND" (rock). Columns 7 and 8
are always a diagonal slope/cliff-cut transition pair (mostly-empty
triangular content, meant for sloped terrain, not flat repetition) --
skipped on every row. Column 6 looks plain at a glance but actually carries
a hard black vertical cut on its right edge on every row (an edge-cap
piece) -- skipped too.

Each variant is cropped tight to its own content bbox (+ a small uniform
pad), independently -- not pasted onto one shared canvas. Ground tiles are
independent static sprites, each anchored by its own origin at runtime (see
addGroundTileVisual/addFillTileVisual in src/utils/LevelKit.js), so nothing
needs matching canvas sizes; sharing one previously left dead transparent
margin on narrower variants and produced visible gaps between tiles once
scaled to GROUND_TILE_SIZE (see git history of this file / LevelKit.js).

Surface (grass) tiles are cropped with a generous top margin to keep any
mushroom/tall-grass decoration that pokes above the block -- at runtime
they're bottom-anchored and scaled by width only, so that overhang bleeds
upward same as before. Dirt/rock fill tiles have no such overhang (they're
meant to butt seamlessly on all 4 sides when stacked into a column below
the surface tile) so they're cropped to the full row band height and
displayed at an exact GROUND_TILE_SIZE square at runtime regardless of
their native aspect ratio.

Requires numpy, Pillow and scipy.
"""
import os

import numpy as np
from PIL import Image

from dechroma import remove_black_background

SRC = 'assets/decors/surface.png'
OUT_DIR = 'assets/decors/surface_frames'
PAD = 2

# Shared 11-column grid (x0, x1) -- same for every row on this sheet.
COLUMNS_X = [
    (142, 252), (265, 371), (384, 491), (504, 612), (626, 736),
    (749, 855), (869, 986), (1000, 1116), (1127, 1237), (1251, 1360), (1377, 1489),
]

# (row band y0/y1, usable column indices, output prefix)
ROWS = [
    ((10, 180), [0, 1, 2, 3, 4, 5, 10], 'ground'),   # SOL SURFACE (grass top)
    ((193, 310), [0, 1, 2, 3, 4, 5, 9, 10], 'dirt'),   # TERRE MILIEU
    ((456, 570), [0, 1, 2, 3, 4, 5, 9, 10], 'rock'),   # SOUS-SOL PROFOND
]


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    arr = remove_black_background(SRC)
    alpha = arr[:, :, 3]
    h, w = alpha.shape

    for (y0, y1), indices, prefix in ROWS:
        out_i = 0
        for col in indices:
            x0, x1 = COLUMNS_X[col]
            band = alpha[y0:y1 + 1, x0:x1 + 1] > 10
            ys, xs = np.nonzero(band)
            bx0, bx1 = x0 + xs.min(), x0 + xs.max()
            by0, by1 = y0 + ys.min(), y0 + ys.max()
            cx0, cx1 = max(0, bx0 - PAD), min(w, bx1 + 1 + PAD)
            cy0, cy1 = max(0, by0 - PAD), min(h, by1 + 1 + PAD)
            crop = arr[cy0:cy1, cx0:cx1]
            out_path = f'{OUT_DIR}/{prefix}_{out_i}.png'
            Image.fromarray(crop, 'RGBA').save(out_path)
            print(prefix, out_i, f'(col {col})', crop.shape[1::-1], '->', out_path)
            out_i += 1


if __name__ == '__main__':
    main()
