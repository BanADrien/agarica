#!/usr/bin/env python3
"""Crop the dirt-only 9-slice autotile set + interior variants out of
assets/decors/floor.png.

This sheet provides a single "terre" (dirt) material only -- no separate
un-mossed "bare" vertical-wall variant, and no rock (LevelKit.js/
EditorScene.js were simplified to match: the "Roche" material option was
removed from the editor rather than faked from the same tiles).

Layout: a 4x4 grid of cells with real transparent gaps between them (each
cell has independently rounded corners) -- column/row segments are found
directly by projecting alpha onto each axis, no border-stroke heuristics
needed. The top-left 3x3 block is the classic 9-slice
(tl/t/tr/l/c/r/bl/b/br); the 4th column plus the 4th row's first 3 cells
are plain interior variants with no edge decoration, picked randomly at
runtime for visual variety on large flat-fill areas (cf.
DIRT_CENTER_VARIANT_COUNT in LevelKit.js). The very last cell (3, 3) used
to be extracted here as the diagonal inner-corner ("angle") tile for
staircase notches (cf. AUTOTILE_INNER_CORNER_TEXTURE in LevelKit.js) --
NO LONGER: this script overwrote a manually-touched-up dirt_angle.png with
a fresh from-scratch extraction once too often, so dirt_angle.png is now a
hands-off, user-maintained file (like coin.png/plateforme.png) and this
script never writes to it. Don't re-add that extraction without being asked.

The source cells are not perfectly uniform in size (natural variation in
a hand-arranged sheet) -- each cell is CENTER-CROPPED to its OWN square
(min of its detected width/height, minus a small safety margin) rather
than a single shared size forced across the whole sheet. A crop that is
already square gets scaled uniformly (no stretch) when renderAutotileGrid
in LevelKit.js later forces it to GROUND_TILE_SIZE for display, whatever
its absolute source size -- so per-cell squares avoid distortion just as
well as a shared global size did, while cropping away much less real
artwork per cell (a previous shared-minimum-size version was cropping
some cells far more aggressively than their own content needed, visibly
cutting off texture near cell edges).

This user's floor.png has changed sheet format on every replacement so
far. Grid detection tries, in order:
1. Alpha segmentation (real transparent gaps spanning the full
   height/width of every cell edge).
2. A near-black opaque gridline, via per-axis mean brightness.
3. A faint opaque seam (cells drawn edge-to-edge with barely any visible
   border, just a few px of slightly-darker antialiasing) -- same
   brightness approach as (2) but with an adaptively-searched threshold
   instead of a fixed one, since how dark the seam is varies by sheet.
Each fallback is only reached if the previous one fails to find exactly
5 border bands (4 cells) on both axes.

Requires numpy and Pillow.
"""
import os

import numpy as np
from PIL import Image
from scipy.ndimage import distance_transform_edt

SRC = 'assets/decors/floor.png'
OUT_DIR = 'assets/decors/autotile_frames'
# Floating-platform variants (cf. AUTOTILE_PLATFORM_VARIANT_COUNT in
# LevelKit.js): a grass-top position with no south neighbor at all (a
# platform, not solid ground) needs rock closing off its underside too,
# not just the top -- floor.png's own t/tl/tr cells assume something solid
# continues below and don't draw one. 3 self-contained variants, laid out
# as a simple 1x3 strip with real alpha gaps (own file, not part of the
# main 4x4 sheet).
SRC_PLATFORM = 'assets/decors/plateforme.png'
ALPHA_THRESHOLD = 40
# Margin subtracted from each cell's own detected content span (the
# smaller of its width/height) before center-cropping to a square, so the
# crop lands fully inside the cell regardless of exactly how close the
# detected span is to the true cell boundary. Kept tiny on purpose: the
# alpha transition at a real cell edge on this sheet is only ~2-4px wide
# (checked directly on floor.png's pixel data), and the detected span
# already stops at the tightest shared gap across every row/column (see
# axis_segments's `any()` projection) -- a bigger margin here was cropping
# perfectly good edge content for no safety benefit (user: "un poil trop
# crop aussi alors que les version de base sont parfaitement decoupe").
SIZE_MARGIN = 1

# Row-major within the 3x3 top-left block.
NINE_SLICE_POSITIONS = ['tl', 't', 'tr', 'l', 'c', 'r', 'bl', 'b', 'br']


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


def content_segments_from_borders(border_mask_1d):
    """Invert border-line bands into the 4 cell-content spans between them."""
    border_bands = axis_segments(border_mask_1d)
    if len(border_bands) != 5:
        return []
    return [(border_bands[i][1] + 1, border_bands[i + 1][0] - 1) for i in range(4)]


def find_gridline_segments(profile):
    """Search increasing brightness thresholds for the one that isolates
    exactly 5 gridline bands (the 2 outer sheet edges + 3 internal
    seams -> 4 cell-content spans) on this axis. Starts strict (near-black
    only) and relaxes until a clean 4x4 grid falls out, so it works for
    both a heavily-inked border and a barely-visible seam without needing
    a per-sheet constant.
    """
    for threshold in range(3, 121):
        segs = content_segments_from_borders(profile < threshold)
        if len(segs) == 4 and all(x1 - x0 > 20 for x0, x1 in segs):
            return segs
    return []


# Below this alpha, a pixel is treated as part of the "rounded card" fade
# baked into every cell of this sheet (confirmed by direct inspection: a
# straight edge's alpha ramps from ~250 down to single digits over the
# outer ~20-25px, on EVERY side, not just corners -- these cells were
# authored as individually rounded/vignetted cards, not hard-edged
# seamless tiles) rather than genuine transparency.
OPAQUE_ALPHA_THRESHOLD = 250


# t/tl/tr have real transparency (sky/background showing between hanging
# mushroom stems and vines) but only in their top portion -- checked
# directly: excluding the standard ~25px vignette margin on every side,
# the lowest genuinely-transparent pixel on any of the 3 tiles is at 30%
# of the tile's height. FLATTEN_TOP_FRACTION stops well short of that
# (proven-safe margin) so the canopy silhouette is never touched.
FLATTEN_TOP_FRACTION = 0.4


def flatten_to_opaque(crop):
    """Erase the rounded-card vignette described above: extend each valid
    (alpha >= OPAQUE_ALPHA_THRESHOLD) pixel's color outward to cover every
    faded/transparent pixel (nearest-valid-neighbor fill, so corners get a
    plausible extension of the real edge color instead of black), then set
    alpha to fully opaque everywhere. Only call this where there is no
    legitimate transparency left to protect in the input (the whole crop
    for most positions; only the bottom slice for t/tl/tr, via
    flatten_bottom_region below).
    """
    alpha = crop[:, :, 3]
    valid = alpha >= OPAQUE_ALPHA_THRESHOLD
    if valid.all():
        out = crop.copy()
        out[:, :, 3] = 255
        return out
    _, indices = distance_transform_edt(~valid, return_indices=True)
    out = crop.copy()
    for channel in range(3):
        out[:, :, channel] = crop[:, :, channel][tuple(indices)]
    out[:, :, 3] = 255
    return out


def flatten_bottom_region(crop, top_fraction=FLATTEN_TOP_FRACTION):
    """For t/tl/tr only: flatten just the bottom (1 - top_fraction) of the
    tile (plain dirt, same vignette issue as every other position) and
    leave the top portion (canopy art + its legitimate transparency)
    completely untouched -- flatten_to_opaque forces alpha=255 over its
    whole input, which would erase the canopy's sky gaps if run on the
    full tile.
    """
    split = int(crop.shape[0] * top_fraction)
    flattened = flatten_to_opaque(crop)
    out = crop.copy()
    out[split:] = flattened[split:]
    return out


# Fraction of a crop's own side length cut off at the corner (not a fixed
# pixel count: floor.png cells (~280-300px) and plateforme.png cells
# (~665-670px) differ by more than 2x, and a fixed depth calibrated to look
# right on the smaller ones was nearly invisible on the larger ones --
# checked directly by compositing over a magenta background, cf. session
# history). Purely cosmetic (breaks up an otherwise hard square silhouette
# at one corner), applied only where the user confirmed that exact corner
# never touches another cell (a solid mass's own free/convex corner, not
# an inner seam) -- no tiling risk.
CHAMFER_FRACTION = 0.1


def chamfer_corner(crop, corner):
    """Cut a 45-degree triangular notch (alpha -> 0) out of one corner of a
    square crop, at the corner where this tile's own rock art sits AND
    which geometrically never touches another tile -- cf. CHAMFER_FRACTION.
    `corner`: 'bl' (bottom-left) or 'br' (bottom-right).
    """
    out = crop.copy()
    h, w = out.shape[:2]
    depth = int(min(h, w) * CHAMFER_FRACTION)
    yy, xx = np.mgrid[0:h, 0:w]
    if corner == 'bl':
        mask = xx + (h - 1 - yy) < depth
    elif corner == 'br':
        mask = (w - 1 - xx) + (h - 1 - yy) < depth
    else:
        raise ValueError(corner)
    out[mask, 3] = 0
    return out


def center_crop_square(rgba, x0, x1, y0, y1, margin=SIZE_MARGIN):
    """Center-crop a square sized to THIS span's own min(width, height)
    minus margin -- not a size shared across other cells/spans -- so a
    smaller neighbor never forces extra cropping onto a larger cell.
    """
    size = min(x1 - x0, y1 - y0) - margin
    cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
    half = size // 2
    return rgba[cy - half:cy - half + size, cx - half:cx - half + size]


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    im = Image.open(SRC).convert('RGBA')
    arr = np.array(im)
    content = arr[:, :, 3] > ALPHA_THRESHOLD

    col_segs = axis_segments(content.any(axis=0))
    row_segs = axis_segments(content.any(axis=1))

    if len(col_segs) != 4 or len(row_segs) != 4:
        brightness = arr[:, :, :3].mean(axis=2)
        col_segs = find_gridline_segments(brightness.mean(axis=0))
        row_segs = find_gridline_segments(brightness.mean(axis=1))
        print('alpha segmentation inconclusive, used opaque-gridline fallback')

    assert len(col_segs) == 4 and len(row_segs) == 4, (
        f'expected a 4x4 grid, got {len(row_segs)} rows x {len(col_segs)} cols '
        f'(cols={col_segs}, rows={row_segs})'
    )

    print('detected cols', col_segs)
    print('detected rows', row_segs)

    def cell(r, c):
        y0, y1 = row_segs[r]
        x0, x1 = col_segs[c]
        return center_crop_square(arr, x0, x1, y0, y1)

    # t/tl/tr are, like dirt_angle.png below, now HANDS-OFF user-maintained
    # files -- this script no longer regenerates/overwrites them (user:
    # "pareil pour les 3 t tl et tr arrete de remettre les ancien
    # graphisme", after it silently reverted manually-touched-up versions
    # of these back to a fresh from-scratch extraction, same problem as
    # dirt_angle.png). Only l/c/r/bl/b/br (plain rock/dirt, no legitimate
    # transparency, confirmed: interior alpha >= 249 everywhere more than
    # 25px from the crop edge on all of them) still come from this sheet
    # extraction, full-flattened. Don't re-add tl/t/tr here without being
    # asked.
    SKIP_POSITIONS = {'tl', 't', 'tr'}
    # bl/br's own bottom-left/bottom-right corner is the tile's free convex
    # corner (nothing tiles diagonally against it) -- chamfered per user
    # request, purely cosmetic (see CHAMFER_DEPTH).
    CHAMFER_BY_POSITION = {'bl': 'bl', 'br': 'br'}
    for i, pos in enumerate(NINE_SLICE_POSITIONS):
        if pos in SKIP_POSITIONS:
            continue
        r, c = divmod(i, 3)
        crop = flatten_to_opaque(cell(r, c))
        if pos in CHAMFER_BY_POSITION:
            crop = chamfer_corner(crop, CHAMFER_BY_POSITION[pos])
        out_path = f'{OUT_DIR}/dirt_{pos}.png'
        Image.fromarray(crop, 'RGBA').save(out_path)
        print(pos, crop.shape[1::-1], '->', out_path)

    # (3, 3) is the angle tile (see module docstring), not a variant --
    # excluded here, cropped separately below.
    variant_cells = [(0, 3), (1, 3), (2, 3), (3, 0), (3, 1), (3, 2)]
    for i, (r, c) in enumerate(variant_cells):
        crop = flatten_to_opaque(cell(r, c))
        out_path = f'{OUT_DIR}/dirt_c_var{i}.png'
        Image.fromarray(crop, 'RGBA').save(out_path)
        print(f'c_var{i}', crop.shape[1::-1], '->', out_path)

    # dirt_angle.png (diagonal inner-corner tile, cf.
    # AUTOTILE_INNER_CORNER_TEXTURE in LevelKit.js) used to be re-derived
    # here every run from the sheet's cell (3, 3) -- STOPPED (user: "je
    # l'ai remise mais la touche plus", after this script silently
    # overwrote a manually-touched-up version with a fresh from-scratch
    # extraction). dirt_angle.png is now a hands-off, user-maintained file
    # like coin.png -- do NOT regenerate it here again without being asked.

    # dirt_t2/tl2/tr2 (cf. AUTOTILE_TOP_VARIANT_CHANCE in LevelKit.js): a 2nd
    # top-edge option, hand-supplied separately (not one of floor.png's own
    # 16 cells) but cropped from the same kind of source, with the same
    # rounded-card vignette -- flatten their bottom the same way as t/tl/tr
    # above, in place, so regenerating the rest of the set doesn't leave
    # these as the only un-flattened top tiles.
    for pos in ('t', 'tl', 'tr'):
        path = f'{OUT_DIR}/dirt_{pos}2.png'
        if os.path.exists(path):
            crop = flatten_bottom_region(np.array(Image.open(path).convert('RGBA')))
            Image.fromarray(crop, 'RGBA').save(path)
            print(f'{pos}2', crop.shape[1::-1], '-> flattened', path)

    if os.path.exists(SRC_PLATFORM):
        plat_im = np.array(Image.open(SRC_PLATFORM).convert('RGBA'))
        plat_content = plat_im[:, :, 3] > ALPHA_THRESHOLD
        plat_cols = axis_segments(plat_content.any(axis=0))
        plat_rows = axis_segments(plat_content.any(axis=1))
        assert len(plat_rows) == 1 and len(plat_cols) == 3, (
            f'expected a 1x3 strip in {SRC_PLATFORM}, got {len(plat_rows)}x{len(plat_cols)} '
            f'(cols={plat_cols}, rows={plat_rows})'
        )
        y0, y1 = plat_rows[0]
        for i, (x0, x1) in enumerate(plat_cols):
            crop = flatten_bottom_region(center_crop_square(plat_im, x0, x1, y0, y1))
            # platform2 (i == 2, cf. AUTOTILE_PLATFORM_VARIANT_COUNT in
            # LevelKit.js): its rock border wraps left+bottom, meeting at
            # the bottom-left corner -- the tile's free convex corner in
            # its default (unmirrored) orientation used at a platform's
            # LEFT end (no west/south neighbor). Chamfering the SOURCE file
            # here means the horizontal mirror already applied at render
            # time (cf. renderAutotileGrid) automatically turns this into a
            # bottom-RIGHT chamfer for the mirrored right-end usage too --
            # no separate edit needed for that case.
            if i == 2:
                crop = chamfer_corner(crop, 'bl')
            out_path = f'{OUT_DIR}/dirt_platform{i}.png'
            Image.fromarray(crop, 'RGBA').save(out_path)
            print(f'platform{i}', crop.shape[1::-1], '->', out_path)


if __name__ == '__main__':
    main()
