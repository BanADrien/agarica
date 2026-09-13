#!/usr/bin/env python3
"""Split a sprite grid into individual same-size PNG frames.

Detects rows from transparent gaps, then within each row detects individual
frames via connected-component labeling on the alpha channel (not just
column gaps) — this handles AI-generated sheets where a frame's silhouette
(a paw, a tail) reaches past its "cell" into the next frame's horizontal
span, which defeats simple column-gap detection even though the frames
never actually touch. Each frame is masked to its own component so a
neighbor's overlapping content never bleeds into the crop.

Every frame in the sheet is padded/cropped to the same canvas size (the max
content size found anywhere in the sheet) and aligned by bottom-center, so
an animation built from the output files won't jitter — including when
switching between rows (e.g. idle <-> walk <-> jump pose) — even though the
source content boxes differ in size.

Requires numpy, Pillow and scipy (connected-component labeling).

Usage:
    python split_spritesheet.py <input.png> <output_dir> [--prefix NAME] [--pad N]

Output files are named "<prefix>_row<r>_<c>.png" (row 0 = top row, columns
left to right).
"""
import argparse
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage


def find_segments(mask):
    """Contiguous (start, end-inclusive) index ranges where a 1D bool array is True."""
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


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('input', help='Input spritesheet PNG (must have transparency)')
    parser.add_argument('output_dir', help='Directory to write individual frame PNGs into')
    parser.add_argument('--prefix', default=None, help='Filename prefix (default: input filename stem)')
    parser.add_argument('--pad', type=int, default=4, help='Transparent padding kept around each frame, in px (default: 4)')
    parser.add_argument('--alpha-threshold', type=int, default=10, help='Alpha value above which a pixel counts as content (default: 10)')
    parser.add_argument('--min-area', type=int, default=25, help='Connected components smaller than this (px) are treated as noise and dropped (default: 25)')
    args = parser.parse_args()

    src_path = Path(args.input)
    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    prefix = args.prefix or src_path.stem

    im = Image.open(src_path).convert('RGBA')
    arr = np.array(im)
    alpha = arr[:, :, 3]
    content = alpha > args.alpha_threshold

    row_segments = find_segments(content.any(axis=1))
    if not row_segments:
        print('No content found (fully transparent image?).')
        return

    rows = []
    for ry0, ry1 in row_segments:
        band = content[ry0:ry1 + 1, :]
        labeled, count = ndimage.label(band, structure=np.ones((3, 3), dtype=int))
        blobs = []
        for label_id, size in zip(*np.unique(labeled, return_counts=True)):
            if label_id == 0 or size < args.min_area:
                continue
            ys, xs = np.nonzero(labeled == label_id)
            blobs.append({
                'label': label_id,
                'x0': xs.min(), 'x1': xs.max(),
                'y0': ys.min() + ry0, 'y1': ys.max() + ry0,
            })
        blobs.sort(key=lambda b: b['x0'])
        rows.append((ry0, labeled, blobs))

    all_boxes = [b for _, _, blobs in rows for b in blobs]
    max_w = max(b['x1'] - b['x0'] + 1 for b in all_boxes) + args.pad * 2
    max_h = max(b['y1'] - b['y0'] + 1 for b in all_boxes) + args.pad * 2

    total_frames = 0
    for row_idx, (ry0, labeled, blobs) in enumerate(rows):
        for col_idx, b in enumerate(blobs):
            x0, x1, y0, y1 = b['x0'], b['x1'], b['y0'], b['y1']
            crop = arr[y0:y1 + 1, x0:x1 + 1].copy()
            # Zero out any pixel that belongs to a different (overlapping)
            # component, so a neighbor's paw/tail reaching into this
            # bounding box doesn't bleed into the frame.
            own_label_mask = labeled[y0 - ry0:y1 + 1 - ry0, x0:x1 + 1] == b['label']
            crop[~own_label_mask] = 0

            canvas = Image.new('RGBA', (max_w, max_h), (0, 0, 0, 0))
            crop_im = Image.fromarray(crop, 'RGBA')
            paste_x = (max_w - crop_im.width) // 2
            paste_y = max_h - args.pad - crop_im.height  # bottom-aligned: no jitter, even across rows
            canvas.paste(crop_im, (paste_x, paste_y), crop_im)
            canvas.save(out_dir / f'{prefix}_row{row_idx}_{col_idx}.png')
            total_frames += 1
        print(f'row {row_idx}: {len(blobs)} frame(s)')

    print(f'\nUniform frame size: {max_w}x{max_h}')
    print(f'{total_frames} frame(s) written to {out_dir}')


if __name__ == '__main__':
    main()
