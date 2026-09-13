#!/usr/bin/env python3
"""Split assets/items/popup.png into the 3 per-form unlock banners.

Plain connected-component splitting (as in split_spritesheet.py) doesn't
work here: each banner has loose decorative bits (stray leaves, feathers)
that don't touch the main sign blob, so naive splitting yields ~19
fragments instead of 3. Fix: find the 3 large "main" blobs (the sign +
creature silhouette), then assign every smaller decorative blob to its
nearest main blob by centroid distance, and crop each group's union
bounding box (plus a small pad).
"""
import numpy as np
from PIL import Image
from scipy import ndimage

SRC = 'assets/items/popup.png'
OUT_DIR = 'assets/items/unlock_frames'
PAD = 6
MAIN_MIN_AREA = 100000  # the 3 sign blobs are ~200k-265k px; decor bits are all < 3.4k

import os
os.makedirs(OUT_DIR, exist_ok=True)

im = Image.open(SRC).convert('RGBA')
arr = np.array(im)
alpha = arr[:, :, 3]
content = alpha > 10
labeled, count = ndimage.label(content, structure=np.ones((3, 3), dtype=int))

blobs = []
for lbl, size in zip(*np.unique(labeled, return_counts=True)):
    if lbl == 0 or size < 25:
        continue
    ys, xs = np.nonzero(labeled == lbl)
    blobs.append({'label': lbl, 'size': size, 'x0': xs.min(), 'x1': xs.max(), 'y0': ys.min(), 'y1': ys.max(),
                   'cx': (xs.min() + xs.max()) / 2, 'cy': (ys.min() + ys.max()) / 2})

mains = [b for b in blobs if b['size'] >= MAIN_MIN_AREA]
mains.sort(key=lambda b: b['x0'])
assert len(mains) == 3, f'expected 3 main blobs, got {len(mains)}'

groups = [[m] for m in mains]
for b in blobs:
    if b in mains:
        continue
    d = [((b['cx'] - m['cx']) ** 2 + (b['cy'] - m['cy']) ** 2) for m in mains]
    groups[d.index(min(d))].append(b)

names = ['wolf', 'eagle', 'octopus']  # left-to-right: loup, aigle, pieuvre
h, w = alpha.shape
label_to_group = {}
for gi, group in enumerate(groups):
    for b in group:
        label_to_group[b['label']] = gi

for gi, (name, group) in enumerate(zip(names, groups)):
    x0 = max(0, min(b['x0'] for b in group) - PAD)
    x1 = min(w, max(b['x1'] for b in group) + PAD)
    y0 = max(0, min(b['y0'] for b in group) - PAD)
    y1 = min(h, max(b['y1'] for b in group) + PAD)
    crop = arr[y0:y1 + 1, x0:x1 + 1].copy()
    # A bounding box drawn around this group's blobs can still overlap
    # unrelated content from a neighboring banner (stray leaves/feathers) --
    # blank out any pixel whose component isn't actually in this group.
    label_crop = labeled[y0:y1 + 1, x0:x1 + 1]
    foreign = (label_crop != 0) & np.vectorize(lambda l: label_to_group.get(l, -1) != gi)(label_crop)
    crop[foreign] = 0
    out_path = f'{OUT_DIR}/unlock_{name}.png'
    Image.fromarray(crop, 'RGBA').save(out_path)
    print(name, crop.shape[1::-1], '->', out_path)
