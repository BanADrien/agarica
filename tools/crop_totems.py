#!/usr/bin/env python3
"""Split assets/items/totems.png into the 6 individual totem frames.

Uses dechroma.py to key out the sheet's black background in memory (no
intermediate file committed), then splits the result using full-height
column gaps -- the 6 totems sit in clean, non-overlapping horizontal bands
with no floating decor between them (unlike popup.png), so a simple
column-projection split works.
"""
import os

import numpy as np
from PIL import Image

from dechroma import remove_black_background

SRC = 'assets/items/totems.png'
OUT_DIR = 'assets/items/totem_frames'
PAD = 6
# Left-to-right order in the sheet: wolf-dim, wolf-lit, octopus-dim,
# octopus-lit, eagle-dim, eagle-lit (moon symbol = wolf, spiral = octopus,
# sun = eagle; each pair is dim/unlit then lit/glowing).
NAMES = ['wolf_dim', 'wolf_lit', 'octopus_dim', 'octopus_lit', 'eagle_dim', 'eagle_lit']


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    arr = remove_black_background(SRC)
    alpha = arr[:, :, 3]
    content = alpha > 10
    col_has = content.any(axis=0)

    segs = []
    in_seg = False
    for i, v in enumerate(col_has):
        if v and not in_seg:
            start = i
            in_seg = True
        elif not v and in_seg:
            segs.append((start, i - 1))
            in_seg = False
    if in_seg:
        segs.append((start, len(col_has) - 1))

    assert len(segs) == len(NAMES), f'expected {len(NAMES)} columns, got {len(segs)}'

    h, w = alpha.shape
    for name, (x0, x1) in zip(NAMES, segs):
        rows_has = content[:, x0:x1 + 1].any(axis=1)
        ys = np.nonzero(rows_has)[0]
        y0, y1 = ys.min(), ys.max()
        cx0, cx1 = max(0, x0 - PAD), min(w, x1 + 1 + PAD)
        cy0, cy1 = max(0, y0 - PAD), min(h, y1 + 1 + PAD)
        crop = arr[cy0:cy1, cx0:cx1]
        out_path = f'{OUT_DIR}/totem_{name}.png'
        Image.fromarray(crop, 'RGBA').save(out_path)
        print(name, crop.shape[1::-1], '->', out_path)


if __name__ == '__main__':
    main()
