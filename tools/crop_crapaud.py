#!/usr/bin/env python3
"""Split assets/sprites/image.png (crapaud/toad tongue-attack sheet) into
individual frame PNGs.

Same row + connected-component detection as split_spritesheet.py, but with
ONE key difference: frames are LEFT-aligned on the shared canvas instead of
horizontally CENTERED. This sheet's frames are not "the same subject
roughly centered in its own box" (what split_spritesheet.py assumes) --
the toad's body stays PUT while its tongue extends further and further to
the right, so each frame's bounding box grows rightward from a shared body
position instead of growing symmetrically. Centering each frame's own
(very different-width) bounding box independently would make the toad's
body visibly jump left/right between frames; left-aligning keeps it fixed,
since every frame's content starts at the same body-left edge (confirmed
by inspecting bounding boxes: row 0's first frame and row 1's single wide
frame both start at x=12 in the source sheet).

Row 0: 4 frames, tongue extending frame by frame (closed mouth -> open ->
short tongue -> longer tongue). Row 1: ONE single frame spanning almost the
whole row width -- the tongue's full extension (the "attack apex"), per
the user's own description ("l'apogé de l'attaque ... c'est l'image
entière de la 2eme ligne"). The reverse half of the attack (tongue
retracting) reuses these same frames played backwards, same convention as
every other reversible animation in this project (transfo in/out, etc.) --
no extra frames needed for that half.

Output: assets/sprites/crapaud_frames/crapaud_row{r}_{c}.png, uniform
canvas size, bottom+left aligned.
"""
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

SRC = Path('assets/sprites/image.png')
OUT_DIR = Path('assets/sprites/crapaud_frames')
PAD = 6
ALPHA_THRESHOLD = 10
MIN_AREA = 25


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


def main():
    im = Image.open(SRC).convert('RGBA')
    arr = np.array(im)
    alpha = arr[:, :, 3]
    content = alpha > ALPHA_THRESHOLD

    row_segments = find_segments(content.any(axis=1))
    print('row bands', row_segments)

    rows = []
    for ry0, ry1 in row_segments:
        band = content[ry0:ry1 + 1, :]
        labeled, count = ndimage.label(band, structure=np.ones((3, 3), dtype=int))
        blobs = []
        for label_id, size in zip(*np.unique(labeled, return_counts=True)):
            if label_id == 0 or size < MIN_AREA:
                continue
            ys, xs = np.nonzero(labeled == label_id)
            blobs.append({
                'label': label_id,
                'x0': int(xs.min()), 'x1': int(xs.max()),
                'y0': int(ys.min()) + ry0, 'y1': int(ys.max()) + ry0,
            })
        blobs.sort(key=lambda b: b['x0'])
        rows.append((ry0, labeled, blobs))
        print(f'row y={ry0}-{ry1}: {len(blobs)} frame(s)')

    all_boxes = [b for _, _, blobs in rows for b in blobs]
    max_w = max(b['x1'] - b['x0'] + 1 for b in all_boxes) + PAD * 2
    max_h = max(b['y1'] - b['y0'] + 1 for b in all_boxes) + PAD * 2

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    total = 0
    for row_idx, (ry0, labeled, blobs) in enumerate(rows):
        for col_idx, b in enumerate(blobs):
            x0, x1, y0, y1 = b['x0'], b['x1'], b['y0'], b['y1']
            crop = arr[y0:y1 + 1, x0:x1 + 1].copy()
            own_label_mask = labeled[y0 - ry0:y1 + 1 - ry0, x0:x1 + 1] == b['label']
            crop[~own_label_mask] = 0

            canvas = Image.new('RGBA', (max_w, max_h), (0, 0, 0, 0))
            crop_im = Image.fromarray(crop, 'RGBA')
            paste_x = PAD  # LEFT-aligned (not centered) -- see module docstring.
            paste_y = max_h - PAD - crop_im.height  # bottom-aligned.
            canvas.paste(crop_im, (paste_x, paste_y), crop_im)
            canvas.save(OUT_DIR / f'crapaud_row{row_idx}_{col_idx}.png')
            total += 1

    print(f'\nUniform frame size: {max_w}x{max_h}')
    print(f'{total} frame(s) written to {OUT_DIR}')


if __name__ == '__main__':
    main()
