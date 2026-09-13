#!/usr/bin/env python3
"""Crop assets/decors/floor_dirt_variant.png -- a 1x3 row of plain dirt
"interior" tile variants (root/pebble arrangements only, no exposed edge
decoration, meant for the autotile 'c'/center position) -- into 3
individual files. Picked randomly at runtime instead of the single static
dirt_c tile for visual variety (see DIRT_CENTER_VARIANT_COUNT in
LevelKit.js -- keep it in sync with GRID_COLS below if this sheet is ever
regenerated with a different variant count).

No alpha channel at all (fully opaque RGB, tiles fill the whole canvas edge
to edge) -- grid lines are found via border-stroke detection: a real
border line lights up (low brightness) across a large fraction of the
image width/height, while the root linework drawn within tiles only ever
does so locally. Straight rectangular crop per cell, alpha channel added
back at full opacity for consistency with the rest of the pipeline.

Requires numpy and Pillow.
"""
import os

import numpy as np
from PIL import Image

SRC = 'assets/decors/floor_dirt_variant.png'
OUT_DIR = 'assets/decors/autotile_frames'
GRID_ROWS = 1
GRID_COLS = 3


def border_centers(frac, threshold=0.4):
    runs = []
    in_run = False
    start = 0
    for i, v in enumerate(frac):
        if v > threshold and not in_run:
            start = i
            in_run = True
        elif v <= threshold and in_run:
            runs.append((start, i - 1))
            in_run = False
    if in_run:
        runs.append((start, len(frac) - 1))
    merged = []
    for a, b in runs:
        if merged and a - merged[-1][1] < 8:
            merged[-1] = (merged[-1][0], b)
        else:
            merged.append((a, b))
    return [(a + b) / 2 for a, b in merged]


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    im = Image.open(SRC).convert('RGB')
    arr = np.array(im)
    h, w, _ = arr.shape
    brightness = arr.sum(axis=2).astype(int)
    dark = brightness < 60

    # The sheet's own outer edge also registers as "dark across most of the
    # span" (background right at the image boundary) -- drop any detected
    # line too close to 0/size, it's that edge, not an internal grid line.
    def internal_only(centers, size):
        return [c for c in centers if 15 < c < size - 15]

    col_lines = [0] + internal_only(border_centers(dark.mean(axis=0)), w) + [w]
    row_lines = [0] + internal_only(border_centers(dark.mean(axis=1)), h) + [h]
    assert len(col_lines) == GRID_COLS + 1, f'expected {GRID_COLS + 1} col lines, got {len(col_lines)}: {col_lines}'
    assert len(row_lines) == GRID_ROWS + 1, f'expected {GRID_ROWS + 1} row lines, got {len(row_lines)}: {row_lines}'

    rgba = np.dstack([arr, np.full((h, w), 255, dtype=np.uint8)])

    idx = 0
    for r in range(GRID_ROWS):
        y0, y1 = round(row_lines[r]), round(row_lines[r + 1])
        for c in range(GRID_COLS):
            x0, x1 = round(col_lines[c]), round(col_lines[c + 1])
            crop = rgba[y0:y1, x0:x1]
            out_path = f'{OUT_DIR}/dirt_c_var{idx}.png'
            Image.fromarray(crop, 'RGBA').save(out_path)
            print(idx, crop.shape[1::-1], '->', out_path)
            idx += 1


if __name__ == '__main__':
    main()
