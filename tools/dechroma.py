#!/usr/bin/env python3
"""Shared background-removal helper for AI-generated sheets that ship on a
solid black canvas instead of a transparent one (assets/items/totems.png,
assets/decors/surface.png -- unlike every other sheet in this project).

A flat brightness threshold can't key the background out on its own: these
sheets' linework (tile borders, creature outlines, cracks) is drawn in
near-black too, and it's one connected network from edge to edge -- a plain
flood fill from the canvas border leaks straight through it and eats every
outline/gap in the image.

Fix: erode the "dark" mask by a few px before flood-filling from the
border. That erosion breaks the thin (1-3px) connecting strokes so
linework no longer bridges into the open background region, while the
background itself (much wider than a few px almost everywhere) survives
and still reaches the border. Re-dilate the surviving border-connected
blob by the same radius, re-intersected with the original dark mask, to
recover its true edge.

Requires numpy and Pillow and scipy.
"""
import numpy as np
from PIL import Image
from scipy import ndimage


def remove_black_background(path, threshold=60, erode=3):
    """Returns an RGBA array of `path` with its black background keyed
    to transparent. See module docstring for the technique."""
    im = Image.open(path).convert('RGB')
    arr = np.array(im).astype(int)
    h, w, _ = arr.shape
    dark = arr.sum(axis=2) <= threshold

    struct = np.ones((3, 3), dtype=int)
    # border_value=1: without it, binary_erosion treats the outside of the
    # array as background and erodes the canvas edge itself first, so no
    # label ever touches the border and nothing gets detected as background.
    eroded = ndimage.binary_erosion(dark, structure=struct, iterations=erode, border_value=1)
    labeled, _ = ndimage.label(eroded, structure=struct)
    border_labels = set(labeled[0, :]) | set(labeled[-1, :]) | set(labeled[:, 0]) | set(labeled[:, -1])
    border_labels.discard(0)
    core_bg = np.isin(labeled, list(border_labels))

    bg_mask = ndimage.binary_dilation(core_bg, structure=struct, iterations=erode)
    bg_mask &= dark

    rgba = np.dstack([arr.astype(np.uint8), np.full((h, w), 255, dtype=np.uint8)])
    rgba[bg_mask, 3] = 0
    return rgba


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('input')
    parser.add_argument('output')
    parser.add_argument('--threshold', type=int, default=60)
    parser.add_argument('--erode', type=int, default=3)
    args = parser.parse_args()

    rgba = remove_black_background(args.input, args.threshold, args.erode)
    print(f'background px: {(rgba[:, :, 3] == 0).sum()} / {rgba.shape[0] * rgba.shape[1]}')
    Image.fromarray(rgba, 'RGBA').save(args.output)
    print('wrote', args.output)
