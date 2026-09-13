#!/usr/bin/env python3
"""Crop assets/decors/floor_grass_3X3.png -- a dedicated 3x3 grass/moss
dirt-edge autotile sheet -- into the same 9 filenames the 'dirt' (non-bare)
autotile set already uses (assets/decors/autotile_frames/dirt_{pos}.png),
replacing the ones originally cropped from floor.png (tools/crop_autotile.py
-- still the source for the 'dirt-bare'/'rock'/'rock-bare' sets, untouched
here). See AUTOTILE_POSITIONS / renderAutotileGrid in LevelKit.js for how
these 9 tiles get picked per-cell.

Unlike the first revision of this sheet (no alpha channel, solid border
lines -- see git history), this one has a real transparent background and
gap between cells VERTICALLY (3 clean row bands), but the top row's
moss/mushroom silhouettes reach far enough sideways to touch between
columns, defeating a simple column-gap split within that row. Same fix as
split_spritesheet.py: connected-component labeling within each row band
finds the 3 cells directly, and each crop is masked to its own component so
a neighbour's overlapping silhouette never bleeds in.

Requires numpy, Pillow and scipy.
"""
import os

import numpy as np
from PIL import Image
from scipy import ndimage

SRC = 'assets/decors/floor_grass_3X3.png'
OUT_DIR = 'assets/decors/autotile_frames'
ALPHA_THRESHOLD = 40
PAD = 3
GRID = 3

# 9-slice position order: row-major, top-left to bottom-right (same order as
# AUTOTILE_POSITIONS in LevelKit.js / crop_autotile.py).
POSITIONS = ['tl', 't', 'tr', 'l', 'c', 'r', 'bl', 'b', 'br']


def axis_segments(mask_1d):
    segs = []
    in_seg = False
    start = 0
    for i, v in enumerate(mask_1d):
        if v and not in_seg:
            start = i
            in_seg = True
        elif not v and in_seg:
            segs.append((start, i - 1))
            in_seg = False
    if in_seg:
        segs.append((start, len(mask_1d) - 1))
    return segs


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    im = Image.open(SRC).convert('RGBA')
    arr = np.array(im)
    content = arr[:, :, 3] > ALPHA_THRESHOLD
    h, w = content.shape

    row_segs = axis_segments(content.any(axis=1))
    assert len(row_segs) == GRID, f'expected {GRID} row bands, got {len(row_segs)}: {row_segs}'

    idx = 0
    for ry0, ry1 in row_segs:
        band = content[ry0:ry1 + 1, :]
        labeled, count = ndimage.label(band, structure=np.ones((3, 3), dtype=int))
        blobs = []
        for label_id, size in zip(*np.unique(labeled, return_counts=True)):
            if label_id == 0 or size < 200:
                continue
            ys, xs = np.nonzero(labeled == label_id)
            blobs.append({'label': label_id, 'x0': xs.min(), 'x1': xs.max(), 'y0': ys.min(), 'y1': ys.max()})
        blobs.sort(key=lambda b: b['x0'])
        assert len(blobs) == GRID, f'row starting at {ry0}: expected {GRID} cells, got {len(blobs)}'

        for b in blobs:
            pos = POSITIONS[idx]
            x0, x1, y0, y1 = b['x0'], b['x1'], b['y0'], b['y1']
            crop = arr[ry0 + y0:ry0 + y1 + 1, x0:x1 + 1].copy()
            # Zero out any pixel belonging to a different (touching) blob in
            # this row band, so a neighbour's mushroom/moss reaching into
            # this bounding box never bleeds into the frame.
            own_mask = labeled[y0:y1 + 1, x0:x1 + 1] == b['label']
            crop[~own_mask] = 0

            canvas_w, canvas_h = crop.shape[1] + PAD * 2, crop.shape[0] + PAD * 2
            canvas = Image.new('RGBA', (canvas_w, canvas_h), (0, 0, 0, 0))
            canvas.paste(Image.fromarray(crop, 'RGBA'), (PAD, PAD), Image.fromarray(crop, 'RGBA'))
            out_path = f'{OUT_DIR}/dirt_{pos}.png'
            canvas.save(out_path)
            print(pos, canvas.size, '->', out_path)
            idx += 1


if __name__ == '__main__':
    main()
