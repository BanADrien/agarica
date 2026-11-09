"""Arche de racines (fermée / ouverte) à la place de la « fente » ovale.

Retour du 2026-11-09 : la fente verticale dans l'écorce (decor_fente_fermee /
decor_fente_ouverte) se lisait comme une vulve. On la remplace par une ARCHE
DE RACINES plus large que haute, faite à partir du même art (même écorce,
mêmes couleurs, mêmes feuilles et champignons) :
  - l'anneau de racines de la fente (son pourtour) est déroulé puis reposé en
    demi-ellipse couchée (déformation polaire) : deux faisceaux de racines qui
    montent de chaque pied et se rejoignent au sommet ;
  - ouverte : l'intérieur reprend le tourbillon du portail (son centre) dans
    un fond de nuit étoilée, bordé d'un liseré vert lunaire ;
  - fermée : l'intérieur est bouché d'écorce aux fibres HORIZONTALES (la
    texture du centre de la fente, tournée d'un quart de tour), sans fente
    lumineuse ; deux nœuds verts à peine lumineux disent qu'il y a un passage.
Sorties : assets/decors/elements/decor_arche_fermee.png et
decor_arche_ouverte.png (440 x 300, pieds en bas). Usage :
    python tools/arche_racines.py
puis python tools/import_codex_assets.py --present-only.
"""
import math
import os
import random

from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ELEM = os.path.join(ROOT, 'assets', 'decors', 'elements')
SRC_CLOSED = os.path.join(ELEM, 'decor_fente_fermee.png')
SRC_OPEN = os.path.join(ELEM, 'decor_fente_ouverte.png')

W, H = 440, 300
CX, CY = W / 2, H - 6            # centre de l'arche (pieds un peu au-dessus du bas)
OUT_R = (214, 286)               # demi-axes extérieurs (x, y)
IN_R = (134, 190)                # demi-axes de l'ouverture
# Anneau de racines de la fente (image source 258 x 440) : centre et demi-axes
# mesurés (pourtour extérieur, bord du portail).
S_C = (131, 222)
S_OUT = (117, 212)
S_IN = (56, 162)
# Arc de la source utilisé pour chaque moitié (degrés, repère y vers le haut) :
# le flanc de la fente, là où ses racines sont régulières (pas les pointes).
S_ARC = (118, 242)


def ellipse_dist(rx, ry, c, s):
    """Distance du centre au bord d'une ellipse (rx, ry) dans la direction (c, s)."""
    return 1.0 / math.sqrt((c / rx) ** 2 + (s / ry) ** 2)


def warp_ring(src):
    """Déroule l'anneau de la fente et le repose en arche couchée."""
    sp = src.load()
    sw, sh = src.size
    out = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    op = out.load()
    for y in range(H):
        for x in range(W):
            dx = x + 0.5 - CX
            dy = CY - (y + 0.5)
            if dy < -4:
                continue
            d = math.hypot(dx, dy)
            if d < 1:
                continue
            c, s = dx / d, max(dy, 0) / d
            phi = math.atan2(max(dy, 0), dx)          # 0 = pied droit, pi = pied gauche
            d_in = ellipse_dist(IN_R[0], IN_R[1], c, s)
            d_out = ellipse_dist(OUT_R[0], OUT_R[1], c, s)
            if d < d_in or d > d_out:
                continue
            u = (d - d_in) / (d_out - d_in)            # 0 bord intérieur -> 1 extérieur
            # t : 0 au sommet -> 1 au pied, pour chaque moitié.
            if phi >= math.pi / 2:
                t = (phi - math.pi / 2) / (math.pi / 2)
                psi = math.radians(S_ARC[0] + (S_ARC[1] - S_ARC[0]) * t)   # flanc gauche
            else:
                t = (math.pi / 2 - phi) / (math.pi / 2)
                psi = math.radians(180 - S_ARC[0] - (S_ARC[1] - S_ARC[0]) * t)  # flanc droit (miroir)
            rx = S_IN[0] + (S_OUT[0] - S_IN[0]) * u
            ry = S_IN[1] + (S_OUT[1] - S_IN[1]) * u
            sx = S_C[0] + rx * math.cos(psi)
            sy = S_C[1] - ry * math.sin(psi)
            ix, iy = int(sx), int(sy)
            if 0 <= ix < sw and 0 <= iy < sh:
                px = sp[ix, iy]
                if px[3] > 0:
                    op[x, y] = px
    return out


def inner_mask(scale=1.0):
    m = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(m)
    rx, ry = IN_R[0] * scale, IN_R[1] * scale
    d.ellipse([CX - rx, CY - ry, CX + rx, CY + ry], fill=255)
    return m


def portal_inside(src_open):
    """Fond de l'arche ouverte : nuit étoilée + tourbillon du portail."""
    rnd = random.Random(7)
    bg = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(bg)
    # Dégradé de nuit (plus clair vers le centre, comme le portail).
    for i in range(40, 0, -1):
        k = i / 40
        col = (int(14 + 30 * (1 - k)), int(14 + 34 * (1 - k)), int(34 + 46 * (1 - k)), 255)
        rx, ry = IN_R[0] * k, IN_R[1] * k
        d.ellipse([CX - rx, CY - ry * 0.95, CX + rx, CY + ry * 0.95], fill=col)
    # Tourbillon : centre du portail source (disque), posé au milieu de l'ouverture.
    sw = src_open.crop((131 - 58, 236 - 58, 131 + 58, 236 + 58)).resize((150, 150), Image.LANCZOS)
    m = Image.new('L', sw.size, 0)
    ImageDraw.Draw(m).ellipse([22, 22, 128, 128], fill=255)
    m = m.filter(ImageFilter.GaussianBlur(14))
    bg.paste(sw, (int(CX - 75), int(CY - IN_R[1] * 0.55 - 75)), m)
    # Étoiles.
    for _ in range(26):
        a = rnd.uniform(0.15, math.pi - 0.15)
        r = rnd.uniform(0.15, 0.9)
        x = CX + math.cos(a) * IN_R[0] * r
        y = CY - math.sin(a) * IN_R[1] * r
        s = rnd.choice([1, 1, 2])
        d.rectangle([x, y, x + s - 1, y + s - 1], fill=(220, 255, 236, 255))
    return bg


def closed_inside(src_closed):
    """Fond de l'arche fermée : écorce aux fibres horizontales, sans fente."""
    # Centre de la fente fermée (fibres verticales) sans la fente lumineuse :
    # bande à gauche de la fente, tournée d'un quart de tour, répétée.
    band = src_closed.crop((70, 70, 124, 380)).rotate(90, expand=True)   # 310 x 54
    band = band.resize((band.width, band.height))
    bg = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    y = int(CY - IN_R[1]) - 4
    row = 0
    while y < H:
        x = -((row * 97) % band.width)
        while x < W:
            bg.paste(band, (x, y), band)
            x += band.width - 6
        y += band.height - 10
        row += 1
    # Ombre vers le bas (profondeur) et deux nœuds vert lunaire à peine lumineux.
    shade = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shade)
    for i in range(30):
        k = i / 30
        sd.rectangle([0, int(CY - IN_R[1] * (1 - k)), W, H], fill=(10, 6, 18, int(5 + 4 * k)))
    bg = Image.alpha_composite(bg, shade)
    glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    for (x, y, r) in [(CX - 34, CY - 92, 7), (CX + 41, CY - 58, 5)]:
        gd.ellipse([x - r * 2.2, y - r * 2.2, x + r * 2.2, y + r * 2.2], fill=(143, 227, 184, 60))
        gd.ellipse([x - r, y - r, x + r, y + r], fill=(30, 22, 34, 255))
        gd.ellipse([x - r + 2, y - r + 2, x + r - 2, y + r - 2], fill=(143, 227, 184, 150))
    glow = glow.filter(ImageFilter.GaussianBlur(1.2))
    return Image.alpha_composite(bg, glow)


def rim(open_):
    """Liseré du bord intérieur : vert lunaire vif (ouverte), sombre (fermée)."""
    lay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    rx, ry = IN_R
    box = [CX - rx, CY - ry, CX + rx, CY + ry]
    if open_:
        d.ellipse(box, outline=(143, 255, 200, 120), width=9)
        lay = lay.filter(ImageFilter.GaussianBlur(4))
        d = ImageDraw.Draw(lay)
        d.ellipse(box, outline=(200, 255, 225, 255), width=3)
    else:
        d.ellipse(box, outline=(20, 12, 24, 255), width=5)
    return lay


def decorations(src, base):
    """Feuilles et champignons de la fente, reposés sur l'arche."""
    # (x, y, l, h) dans la source -> (x, y) dans l'arche.
    picks = [
        ((30, 20, 70, 60), (64, 64)),       # feuilles haut-gauche
        ((180, 40, 230, 90), (330, 38)),     # feuilles haut-droite
        ((32, 120, 70, 160), (6, 170)),      # champignons gauche
        ((200, 300, 245, 345), (392, 206)),  # champignons droite
        ((30, 20, 70, 60), (200, 2)),        # feuilles au sommet (cachent la jointure)
    ]
    out = base.copy()
    for box, at in picks:
        piece = src.crop(box)
        out.alpha_composite(piece, at)
    return out


def build(open_):
    src_c = Image.open(SRC_CLOSED).convert('RGBA')
    src_o = Image.open(SRC_OPEN).convert('RGBA')
    src = src_o if open_ else src_c
    inside = portal_inside(src_o) if open_ else closed_inside(src_c)
    m = inner_mask(1.02)
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    img.paste(inside, (0, 0), m)
    img = Image.alpha_composite(img, rim(open_))
    ring = warp_ring(src_c)
    img = Image.alpha_composite(img, ring)
    img = decorations(src_c, img)
    # Rien sous la ligne des pieds.
    cut = Image.new('L', (W, H), 255)
    ImageDraw.Draw(cut).rectangle([0, int(CY) + 1, W, H], fill=0)
    alpha = Image.composite(img.getchannel('A'), Image.new('L', (W, H), 0), cut)
    img.putalpha(alpha)
    return img


def main():
    for open_, name in [(False, 'decor_arche_fermee.png'), (True, 'decor_arche_ouverte.png')]:
        p = os.path.join(ELEM, name)
        build(open_).save(p)
        print('écrit', p)


if __name__ == '__main__':
    main()
