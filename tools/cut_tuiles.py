#!/usr/bin/env python3
"""Redraw the terrain autotile set from assets/decors/tuiles.png.

This is a DROP-IN REPLACEMENT for assets/decors/autotile_frames/ (the
AI-generated set cropped out of floor.png by tools/crop_autotile.py). It
writes the exact same 21 filenames into assets/decors/tuiles_frames/, so
switching between the two sets is one constant in LevelKit.js
(AUTOTILE_TILESET) and nothing else -- no rendering logic changes, no
constant is retuned, no scene is touched.

---------------------------------------------------------------------
What tuiles.png actually is
---------------------------------------------------------------------
144x144 of hand-painted pixel art on a 24 px grid. It is NOT a laid-out
atlas -- it is a material sample. Read as 6x6 cells it holds:

  * CLEAN DIRT, 6 cells: the whole right-hand column (5, 0..4) plus cell
    (0, 3). Chunky pebbles of 4-7 px separated by 1 px dark cracks.
    Untouched by any of the artist's shading passes.
  * DARK DIRT, 4 cells: the hard-edged 2x2 block at (3..4, 2..3), painted
    at ~0.56 of the clean value.
  * GRASS, 3 cells: (1, 3), (1, 5), (3, 5). Tufts exactly 24 px wide,
    10-12 px tall, drawn against transparency, blades dripping downwards.
  * a soft radial vignette over the upper-left quadrant -- an experiment,
    not a tile, and not used here.

The whole sheet is a single hue: every colour is (84, 39, 21) times a
scalar. So compositing and masking these three materials together can
never leave the palette.

---------------------------------------------------------------------
The rules, read off the OLD set rather than invented
---------------------------------------------------------------------
The previous art says what each of the 21 slots is for, and this script
follows it slot for slot (see the contact sheet in
assets/decors/autotile_frames/):

  * an EXPOSED EDGE is marked by a band running along it, roughly a
    quarter of the tile deep, with an irregular inner boundary -- a bank
    of grey rocks in the old art. Measured on that art, the bank is NOT
    darker than the dirt it borders (ratio 0.92 to 1.03 of the centre's
    luminance): it reads as an edge through its hue and its texture, big
    round grey stones against small brown pebbles. tuiles.png is a single
    hue and a single texture, so value is the only lever left here -- but
    dropping straight to the artist's DARK DIRT (0.56) turns every edge
    into a black hole, nothing like the old bank. The band is therefore a
    BLEND of the clean and dark cells, cf. BAND_MIX.
  * the TOP tiles (t/tl/tr) carry the grass, and leave TRANSPARENT sky
    above it: the old dirt_t is empty for its first 1/12 and only fully
    opaque from 2/12 down. That header is not decoration, the rest of the
    engine depends on it (see the framing section below).
  * dirt_angle is a full opaque square with grass at its top-LEFT; coin
    is a full opaque square with a plain accent at its top-LEFT and no
    grass at all. LevelKit mirrors both to reach their other orientations
    (dirt_angle flipped X for in-tr; coin flipped Y, plus X for in-br),
    so the feature has to sit in that corner and nowhere else.
  * the PLATFORM variants are top tiles that also close their underside,
    plus one side (2), both sides (1) or neither (0).

---------------------------------------------------------------------
Framing: why the top tiles are taller than 24 px
---------------------------------------------------------------------
renderAutotileGrid stretches some tiles vertically, anchored at the
bottom, to compensate for the old art having drawn its canopy too low:
AUTOTILE_CORNER_HEIGHT_BOOST = {tl: 1.16, tr: 1.09, t: 1.07} and
AUTOTILE_PLATFORM_HEIGHT_BOOST = {platform2: 1.05}. Those numbers were
tuned by eye against ONE specific drawing; any new art dropped in
unchanged would come out stretched by up to 16%, and worse, tl and t
would be stretched by DIFFERENT amounts and no longer line up along the
top of a dirt mass.

Rather than retune them (which would be a logic change), the compensation
is baked into the images: a boosted tile is written on a canvas of
round(24 * boost) px tall with its real 24x24 content at the BOTTOM and
transparent padding on top. The engine then stretches the whole canvas by
the same factor, and the content lands back at exactly one cell. Residual
rounding is under 1 px at the 64 px display size.

The 24x24 content itself is framed like the old art: rows 0-3 empty
(sky), grass from row 4, dirt under it -- so the solid part starts around
the quarter mark, which is what AUTOTILE_GRASS_HITBOX_FRACTION = 0.75
already assumes.
"""

import os
import random

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(ROOT, "assets", "decors", "tuiles.png")
OUT = os.path.join(ROOT, "assets", "decors", "tuiles_frames")

TILE = 24

CLEAN_CELLS = [(5, 0), (5, 1), (5, 2), (5, 3), (5, 4), (0, 3)]
DARK_CELLS = [(3, 2), (4, 2), (3, 3), (4, 3)]
GRASS_CELLS = [(1, 3), (1, 5), (3, 5)]

# Top of the grass inside a 24x24 top tile: the rows above it stay empty,
# like the old dirt_t's transparent header (cf. the framing section).
GRASS_TOP = 4

# Depth of an exposed-edge band, in px, picked per column (or per row) to
# keep the inner boundary ragged instead of ruler-straight -- the old
# rock banks are about a quarter of a tile deep and never flat.
BAND_DEPTHS = (4, 6, 8)

# How much of the DARK cell goes into an edge band. The dark dirt sits at
# 0.56 of the clean dirt, so a mix of k lands the band at (1 - 0.44 k) of
# its surroundings. Compared side by side against the old set on the same
# test shape: 0.5 (~0.78) and 0.7 (~0.69) both disappear into the pebble
# noise, and the mass loses the crisp outline the old rock bank gives it.
# 0.9 (~0.60) is the one that reads as a border at a glance without going
# black. This is the one number worth playing with in this file -- lower
# it for a softer edge, raise it to 1.0 for the artist's dark dirt raw.
BAND_MIX = 0.9

# Vertical stretch renderAutotileGrid applies to these tiles, compensated
# by padding the canvas (cf. the framing section). Must stay in sync with
# AUTOTILE_CORNER_HEIGHT_BOOST / AUTOTILE_PLATFORM_HEIGHT_BOOST.
HEIGHT_BOOST = {
    "dirt_tl": 1.16,
    "dirt_tr": 1.09,
    "dirt_t": 1.07,
    "dirt_platform2": 1.05,
}

# Fixed seed: re-running the script must not reshuffle every band, or a
# level would silently change look on each regeneration.
RNG = random.Random(20260923)


def load_sheet():
    im = Image.open(SRC).convert("RGBA")
    if im.size != (144, 144):
        raise SystemExit(f"tuiles.png attendu en 144x144, trouve {im.size}")
    return im


def cell(sheet, cx, cy):
    return sheet.crop((cx * TILE, cy * TILE, (cx + 1) * TILE, (cy + 1) * TILE)).copy()


def mean_luminance(img):
    px = img.load()
    vals = [
        0.299 * px[x, y][0] + 0.587 * px[x, y][1] + 0.114 * px[x, y][2]
        for y in range(img.height)
        for x in range(img.width)
        if px[x, y][3]
    ]
    return sum(vals) / len(vals)


def scale_rgb(img, factor):
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            if a:
                px[x, y] = (
                    min(255, int(r * factor + 0.5)),
                    min(255, int(g * factor + 0.5)),
                    min(255, int(b * factor + 0.5)),
                    a,
                )
    return img


def normalise(tiles):
    """Even out the average value of a group of source cells.

    The six clean cells were painted at slightly different levels (the one
    from cell (0, 3) sits ~10% brighter than the five from the right-hand
    column). Picked at random across a wide dirt mass that reads as a
    checkerboard of lighter and darker squares, not as texture variety --
    exactly what the variants exist to prevent. Nudged onto the median,
    which leaves the pebbles themselves untouched.
    """
    means = [mean_luminance(t) for t in tiles]
    target = sorted(means)[len(means) // 2]
    return [scale_rgb(t, target / m) for t, m in zip(tiles, means)]


def ragged_depths(n):
    """A depth per column/row, wandering between the BAND_DEPTHS steps."""
    depths = []
    d = RNG.choice(BAND_DEPTHS)
    for _ in range(n):
        if RNG.random() < 0.45:
            d = RNG.choice(BAND_DEPTHS)
        depths.append(d)
    return depths


def blend(base_px, dark_px, k):
    return tuple(
        int(base_px[i] * (1 - k) + dark_px[i] * k + 0.5) for i in range(3)
    ) + (base_px[3],)


def edge_band(base, dark, side):
    """Paint a band along one exposed side of `base` (cf. BAND_MIX).

    The dark pixels are the artist's own, sampled at the SAME coordinates
    as the pixel they cover, so the pebble pattern continues straight
    through the band instead of showing a seam where it starts.

    A fully transparent pixel is left alone. That matters: on a top tile
    the rows above the grass are the sky the engine relies on (cf. the
    framing section), and a band that filled them in would both erase
    that header and, because AUTOTILE_GRASS_TOP_POSITIONS excludes those
    tiles from the back-layer backing rectangle, show up as a solid block
    of dirt floating above the grass.
    """
    bp = base.load()
    dp = dark.load()
    depths = ragged_depths(TILE)
    for i in range(TILE):
        d = depths[i]
        for j in range(d):
            if side == "left":
                x, y = j, i
            elif side == "right":
                x, y = TILE - 1 - j, i
            elif side == "top":
                x, y = i, j
            else:
                x, y = i, TILE - 1 - j
            if bp[x, y][3] == 0:
                continue
            bp[x, y] = blend(bp[x, y], dp[x, y], BAND_MIX)
    return base


def corner_band(base, dark, radius=13):
    """Accent in the TOP-LEFT corner (coin.png's role).

    Same mix as an edge band, over a ragged diagonal instead of a strip:
    coin.png marks a corner, not a side.
    """
    bp = base.load()
    dp = dark.load()
    for y in range(TILE):
        for x in range(TILE):
            if bp[x, y][3] and x + y < radius + RNG.randint(-2, 2):
                bp[x, y] = blend(bp[x, y], dp[x, y], BAND_MIX)
    return base


def top_tile(clean, grass, sky=True):
    """A 24x24 tile carrying grass, framed like the old dirt_t.

    `sky=False` for the tiles the old set drew fully opaque (dirt_angle):
    same grass, but no transparent header.
    """
    out = Image.new("RGBA", (TILE, TILE), (0, 0, 0, 0))
    top = GRASS_TOP if sky else 0
    out.alpha_composite(clean.crop((0, top, TILE, TILE)), (0, top))
    out.alpha_composite(grass, (0, top))
    return out


# Largeur (px) de la touffe d'herbe du coin interieur, cf. dirt_angle.
ANGLE_TUFT_WIDTH = 7


def angle_tile(clean, grass, dark):
    """Inner corner (in-tl): solid dirt, a short grass tuft in the top-left."""
    out = corner_band(clean.copy(), dark, radius=9)
    tuft = grass.crop((0, 0, ANGLE_TUFT_WIDTH, TILE))
    out.alpha_composite(tuft, (0, GRASS_TOP))
    return out


def pad_for_boost(img, name):
    """Add transparent rows on top so the engine's stretch cancels out."""
    boost = HEIGHT_BOOST.get(name)
    if not boost:
        return img
    height = int(round(TILE * boost))
    out = Image.new("RGBA", (TILE, height), (0, 0, 0, 0))
    out.alpha_composite(img, (0, height - TILE))
    return out


def main():
    os.makedirs(OUT, exist_ok=True)
    sheet = load_sheet()

    cleans = normalise([cell(sheet, cx, cy) for cx, cy in CLEAN_CELLS])
    darks = normalise([cell(sheet, cx, cy) for cx, cy in DARK_CELLS])
    grasses = [cell(sheet, cx, cy) for cx, cy in GRASS_CELLS]
    for i, (c, coord) in enumerate(zip(cleans, CLEAN_CELLS)):
        if c.getchannel("A").getextrema()[0] != 255:
            raise SystemExit(f"cellule de terre {coord} pas entierement opaque")

    def clean(i):
        return cleans[i % len(cleans)].copy()

    def dark(i):
        return darks[i % len(darks)]

    written = []

    def save(img, name):
        img = pad_for_boost(img, name)
        img.save(os.path.join(OUT, name + ".png"))
        written.append((name, img.size))

    # --- remplissage : la terre propre de l'utilisateur, telle quelle ----
    # dirt_c n'est jamais tire par renderAutotileGrid (il passe toujours par
    # les variantes) mais BootScene le charge : il doit exister.
    save(clean(0), "dirt_c")
    for i in range(6):
        save(clean(i), f"dirt_c_var{i}")

    # --- bords et coins : bande sombre sur chaque cote expose ------------
    save(edge_band(clean(1), dark(0), "left"), "dirt_l")
    save(edge_band(clean(2), dark(1), "right"), "dirt_r")
    save(edge_band(clean(3), dark(2), "bottom"), "dirt_b")
    save(edge_band(edge_band(clean(4), dark(3), "bottom"), dark(0), "left"), "dirt_bl")
    save(edge_band(edge_band(clean(5), dark(1), "bottom"), dark(2), "right"), "dirt_br")
    # dirt_column n'est charge par personne (l'ancien set l'avait deja en
    # trop) -- ecrit quand meme pour que les deux dossiers restent
    # interchangeables fichier pour fichier.
    save(edge_band(edge_band(clean(0), dark(3), "left"), dark(1), "right"), "dirt_column")

    # --- tuiles du haut : herbe + ciel transparent au-dessus -------------
    save(top_tile(clean(0), grasses[0]), "dirt_t")
    # Bande sombre posee sur la TERRE avant l'herbe : sinon elle assombrissait
    # aussi la touffe d'herbe du bord, qui semblait manquer sur les coins.
    save(top_tile(edge_band(clean(1), dark(2), "left"), grasses[1]), "dirt_tl")
    save(top_tile(edge_band(clean(2), dark(3), "right"), grasses[2]), "dirt_tr")

    # --- plateformes : tuiles du haut qui ferment aussi leur dessous -----
    p0 = edge_band(top_tile(clean(3), grasses[0]), dark(0), "bottom")
    save(p0, "dirt_platform0")
    p1 = edge_band(edge_band(clean(4), dark(2), "left"), dark(3), "right")
    p1 = edge_band(top_tile(p1, grasses[1]), dark(1), "bottom")
    save(p1, "dirt_platform1")
    p2 = edge_band(clean(5), dark(1), "left")
    save(edge_band(top_tile(p2, grasses[2]), dark(0), "bottom"), "dirt_platform2")

    # --- coins interieurs -------------------------------------------------
    # dirt_angle : carre PLEIN (pas de ciel), herbe en haut, bande sombre a
    # gauche -- LevelKit le retourne horizontalement pour in-tr.
    #
    # in-tl = case dont le dessus est COUVERT (marche/mur au-dessus) mais dont
    # le voisin de gauche est un sol a l'air libre : seul le coin haut-gauche
    # est expose. Une herbe sur toute la largeur dessinait une bande d'herbe
    # au milieu de la terre sous chaque marche (retour utilisateur : "les
    # tuiles sont mal decoupees"). Donc : terre pleine, petite touffe qui
    # prolonge l'herbe du voisin jusqu'au pied du mur, a la meme hauteur
    # (GRASS_TOP), et ombre de coin.
    save(angle_tile(clean(1), grasses[0], dark(2)), "dirt_angle")
    # coin : carre plein, accent sombre dans le coin HAUT-GAUCHE, jamais
    # d'herbe -- LevelKit le retourne verticalement (et horizontalement pour
    # in-br), donc l'accent doit etre dans ce coin-la et nulle part ailleurs.
    save(corner_band(clean(4), dark(3)), "coin")

    expected = set(os.listdir(os.path.join(ROOT, "assets", "decors", "autotile_frames")))
    got = {n + ".png" for n, _ in written}
    missing = expected - got
    extra = got - expected
    print(f"{len(written)} tuiles ecrites dans {OUT}")
    for name, size in written:
        print("   %-18s %dx%d" % (name, size[0], size[1]))
    print("manquant par rapport a l'ancien set :", sorted(missing) or "rien")
    print("en trop :", sorted(extra) or "rien")


if __name__ == "__main__":
    main()
