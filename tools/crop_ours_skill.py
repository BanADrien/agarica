#!/usr/bin/env python3
"""Split assets/sprites/compétence/ours.png (bear skill, 2 rows x 3 cols) into
6 individual frame PNGs.

Unlike split_spritesheet.py's connected-component approach, this sheet has
debris (flying rocks) disconnected in space from the bear's own silhouette on
several impact frames -- connected-component labeling explodes each rock into
its own "frame" (41 blobs instead of 6). Plain column-gap detection also
over-splits per row for the same reason (a rock separated from the bear by a
transparent gap reads as an extra column).

Fix: after finding column segments per row via gaps, cluster them into
EXPECTED_COLS groups by keeping only the (EXPECTED_COLS - 1) largest gaps as
real frame boundaries -- smaller gaps (a rock floating apart from the bear
within the same intended frame) get merged into their neighboring cluster
instead of starting a new one.

Output: assets/sprites/ours_frames/ours_row{r}_{c}.png, uniform canvas size,
bottom-center aligned (same convention as split_spritesheet.py).
"""
from pathlib import Path

import numpy as np
from PIL import Image

SRC = Path('assets/sprites/compétence/ours.png')
OUT_DIR = Path('assets/sprites/ours_frames')
EXPECTED_COLS = 3
PAD = 6
ALPHA_THRESHOLD = 10


def find_segments(mask):
    segments = []
    in_seg = False
    start = 0
    for i, v in enumerate(mask):
        if v and not in_seg:
            start = i
            in_seg = True
        elif not v and in_seg:
            segments.append((start, i - 1))
            in_seg = False
    if in_seg:
        segments.append((start, len(mask) - 1))
    return segments


def cluster_segments(segments, expected_cols):
    if len(segments) <= expected_cols:
        return [(s[0], s[1]) for s in segments]
    gaps = [(segments[i + 1][0] - segments[i][1], i) for i in range(len(segments) - 1)]
    gaps.sort(reverse=True)
    split_after = sorted(idx for _, idx in gaps[:expected_cols - 1])
    clusters = []
    start_i = 0
    for idx in split_after:
        clusters.append(segments[start_i:idx + 1])
        start_i = idx + 1
    clusters.append(segments[start_i:])
    return [(c[0][0], c[-1][1]) for c in clusters]


def main():
    im = Image.open(SRC).convert('RGBA')
    arr = np.array(im)
    alpha = arr[:, :, 3]
    content = alpha > ALPHA_THRESHOLD

    row_segments = find_segments(content.any(axis=1))
    print('row bands', row_segments)

    boxes_per_row = []
    for ry0, ry1 in row_segments:
        band = content[ry0:ry1 + 1, :]
        col_segments = find_segments(band.any(axis=0))
        col_clusters = cluster_segments(col_segments, EXPECTED_COLS)
        boxes_per_row.append((ry0, ry1, col_clusters))
        print(f'row y={ry0}-{ry1}: {len(col_segments)} raw segments -> {col_clusters}')

    all_boxes = [(cx0, cx1, ry0, ry1) for ry0, ry1, clusters in boxes_per_row for cx0, cx1 in clusters]
    max_w = max(cx1 - cx0 + 1 for cx0, cx1, _, _ in all_boxes) + PAD * 2
    max_h = max(ry1 - ry0 + 1 for _, _, ry0, ry1 in all_boxes) + PAD * 2

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    total = 0
    for row_idx, (ry0, ry1, clusters) in enumerate(boxes_per_row):
        for col_idx, (cx0, cx1) in enumerate(clusters):
            crop = im.crop((cx0, ry0, cx1 + 1, ry1 + 1))
            canvas = Image.new('RGBA', (max_w, max_h), (0, 0, 0, 0))
            paste_x = (max_w - crop.width) // 2
            paste_y = max_h - PAD - crop.height  # bottom-aligned
            canvas.paste(crop, (paste_x, paste_y), crop)
            out_path = OUT_DIR / f'ours_row{row_idx}_{col_idx}.png'
            canvas.save(out_path)
            total += 1
    print(f'{total} frame(s) written to {OUT_DIR}, uniform size {max_w}x{max_h}')


if __name__ == '__main__':
    main()
