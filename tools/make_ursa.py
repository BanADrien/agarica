"""Images de la Grande Ourse (forme mythique des ursidés) fabriquées à partir de celles du grizzly.

    python tools/make_ursa.py

Lit   assets/sprites/grizzly_frames/grizzly_row<0..2>_<i>.png (course, charge, saut).
Écrit assets/sprites/ursa_frames/ursa_<anim>_<i>.png, mêmes cadres et même grain (4,75 px d'image par
      pixel dessiné), et change le numéro de src/data/asset_version.js.
Le dessin (modèle donné par l'utilisateur le 2026-11-15 : un ours au ciel étoilé, « en violet ») : le
grizzly lui-même, repeint en violets, avec le ciel comme texture (voir `convert`). La constellation (les
sept étoiles et leurs traits) est dessinée par le jeu, par-dessus (src/entities/Mythiques.js).
"""
import math
import os
import time

from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
F = 4.75                     # px d'image par pixel dessiné (src/data/pixel_fixed.js, lot du grizzly)
ANIMS = {'run': (0, 4), 'charge': (1, 4), 'jump': (2, 3)}
RIM2 = (110, 84, 200)                                              # trait de la silhouette
INK = (12, 6, 30)                                                  # traits intérieurs (pattes, museau, plis)
EYE = (216, 255, 230)                                              # l'œil
NIGHT = [(26, 14, 60), (40, 24, 92), (60, 38, 128), (86, 60, 168)] # ombre -> clair : les volumes de l'ours
STAR, STAR_DIM = (255, 255, 255), (190, 176, 255)


def h2(x, y, seed=0):
    v = math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453
    return v - math.floor(v)


def noise(x, y, c, seed):
    """Bruit lissé (cases de `c`), entre 0 et 1."""
    gx, gy = x / c, y / c
    ix, iy = math.floor(gx), math.floor(gy)
    fx, fy = gx - ix, gy - iy
    fx, fy = fx * fx * (3 - 2 * fx), fy * fy * (3 - 2 * fy)
    a, b = h2(ix, iy, seed), h2(ix + 1, iy, seed)
    c2, d = h2(ix, iy + 1, seed), h2(ix + 1, iy + 1, seed)
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c2 * (1 - fx) + d * fx) * fy


def convert(src, F=F):
    """Le dessin du grizzly est GARDÉ (retour du 2026-11-15 : « on doit quand même pouvoir distinguer sa forme,
    ses membres, son œil ; le côté espace est plutôt une texture ») : ses contours et ses ombres passent dans
    une gamme de violets selon leur clarté, son œil reste un point clair, et le ciel -- nappes légères et
    étoiles -- n'est qu'une texture posée dans les aplats, jamais sur un trait."""
    im = Image.open(src).convert('RGBA')
    W, H = im.size
    gw, gh = math.ceil(W / F), math.ceil(H / F)
    px = im.load()
    cell = [[px[min(W - 1, int((gx + 0.5) * F)), min(H - 1, int((gy + 0.5) * F))] for gx in range(gw)] for gy in range(gh)]
    solid = [[cell[gy][gx][3] > 100 for gx in range(gw)] for gy in range(gh)]
    lum = lambda c: (0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]) / 255
    lums = sorted(lum(cell[gy][gx]) for gy in range(gh) for gx in range(gw) if solid[gy][gx])
    q = lambda f: lums[min(len(lums) - 1, int(f * len(lums)))]
    cuts = [q(0.3), q(0.55), q(0.8)]          # seuils de clarté de CETTE image : ombre, moyen, clair

    def inside(gx, gy):
        return 0 <= gx < gw and 0 <= gy < gh and solid[gy][gx]

    grid = [[None] * gw for _ in range(gh)]
    for gy in range(gh):
        for gx in range(gw):
            if not solid[gy][gx]:
                continue
            c = cell[gy][gx]
            L = lum(c)
            sat = max(c[:3]) - min(c[:3])
            edge = not (inside(gx - 1, gy) and inside(gx + 1, gy) and inside(gx, gy - 1) and inside(gx, gy + 1))
            if sat > 70 and L > 0.3 and c[1] > c[0] + 20:   # vert / turquoise seulement (pas le pelage brun)
                col = EYE                      # l'œil (seul point coloré du grizzly)
            elif L < 0.16:
                col = RIM2 if edge else INK    # traits : silhouette en violet, traits intérieurs très sombres
            else:
                lvl = 0 if L < cuts[0] else 1 if L < cuts[1] else 2 if L < cuts[2] else 3
                # la texture du ciel : de légères nappes, qui ne déplacent la teinte que d'un cran
                n = noise(gx, gy, 12, 3)
                if n > 0.68 and lvl < 3:
                    lvl += 1
                elif n < 0.3 and lvl > 0:
                    lvl -= 1
                col = NIGHT[lvl]
                s = h2(gx, gy, 21)
                if s < 0.016:
                    col = STAR
                elif s < 0.05:
                    col = STAR_DIM
            grid[gy][gx] = col
    # quelques grosses étoiles en croix, dans les aplats seulement
    for cy in range(0, gh, 11):
        for cx in range(0, gw, 11):
            if h2(cx, cy, 5) > 0.5:
                continue
            gx, gy = cx + int(h2(cx, cy, 6) * 10), cy + int(h2(cx, cy, 7) * 10)
            pts = [(gx, gy), (gx - 1, gy), (gx + 1, gy), (gx, gy - 1), (gx, gy + 1)]
            if all(inside(x, y) and grid[y][x] in NIGHT for x, y in pts):
                for i, (x, y) in enumerate(pts):
                    grid[y][x] = STAR if i == 0 else STAR_DIM
    out = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    op = out.load()
    for y in range(H):
        gy = min(gh - 1, int(y / F))
        row = grid[gy]
        for x in range(W):
            c = row[min(gw - 1, int(x / F))]
            if c:
                op[x, y] = c + (255,)
    return out


# --- Icônes du HUD (64 x 64, grille de 16 x 16 gros pixels) -----------------------------------------
# '.' vide, '#' bord, 'o' fond, '+' étoile blanche, '*' étoile pâle, '-' trait de constellation, 'v' violet clair
ICONS = {
    # A : étoiles filantes -- trois étoiles et leurs traînes
    'icone_0': [
        "................", ".##############.", "#oooooooooooooo#", "#ooooooooo+oooo#", "#oooooooo+++ooo#", "#ooooooov+*oooo#",
        "#oooo+ovvoooooo#", "#ooo+++ooooo+oo#", "#oov+*ooooo+++o#", "#ovvooooooov+*o#", "#voooooooovvooo#", "#ooooooovvooooo#",
        "#ooooooooooooooo".ljust(16, '#')[:15] + "#", "#oooooooooooooo#", ".##############.", "................"],
    # F : pluie d'étoiles -- des étoiles qui tombent sur le sol
    'icone_1': [
        "................", ".##############.", "#ooo+oooooo+ooo#", "#oo+++oooo+++oo#", "#ooo+oo+ooo+ooo#", "#ooovo+++oovooo#",
        "#ooovoo+ooovooo#", "#ooooooovoooooo#", "#o+ooooovoooo+o#", "#+++ooooooov+++#", "#o+oooo*oooo+oo#", "#ooooo***oooooo#",
        "#oo*ooo*ooo*ooo#", "#vvvvvvvvvvvvvv#", ".##############.", "................"],
    # R : les sept ours -- la constellation entière
    'icone_2': [
        "................", ".##############.", "#oooooooooooooo#", "#o+oooooooooooo#", "#oo-ooooooooooo#", "#ooo-+ooooooooo#",
        "#ooooo--ooooooo#", "#ooooooo+----+o#", "#ooooooo-oooo-o#", "#ooooooo-oooo-o#", "#ooooooo+----+o#", "#oooooooooooooo#",
        "#oo*oooo*ooo*oo#", "#oooooooooooooo#", ".##############.", "................"],
    # X : la transformation -- une tête d'ours étoilée
    'icone_x': [
        "................", ".##############.", "#oooooooooooooo#", "#oovvoooooovvoo#", "#ovvvvvvvvvvvvo#", "#ovvvvvvvvvvvvo#",
        "#ovv+vvvvvv+vvo#", "#ovvvvvvvvvvvvo#", "#ovvvvv**vvvvvo#", "#oovvv****vvvoo#", "#oovvvv**vvvvoo#", "#ooovvvvvvvvooo#",
        "#oooovvvvvvoooo#", "#oooooooooooooo#", ".##############.", "................"],
}
ICON_COLORS = {'#': (122, 92, 216), 'o': (24, 14, 56), '+': (255, 255, 255), '*': (201, 190, 255), '-': (150, 132, 235), 'v': (96, 70, 190)}


def make_icon(rows):
    im = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
    px = im.load()
    for gy, row in enumerate(rows[:16]):
        for gx, ch in enumerate(row[:16].ljust(16, '.')):
            c = ICON_COLORS.get(ch)
            if not c:
                continue
            for y in range(4):
                for x in range(4):
                    px[gx * 4 + x, gy * 4 + y] = c + (255,)
    return im


def main():
    d = os.path.join(ROOT, 'assets/sprites/ursa_frames')
    os.makedirs(d, exist_ok=True)
    n = 0
    # Attaque et incantations : les six poses du fracas de l'ours brun (il se dresse, puis abat ses pattes),
    # repeintes de la même façon ; leur grain est de 4,2 px d'image par pixel dessiné.
    for i in range(6):
        convert(os.path.join(ROOT, f'assets/sprites/ours_brun_frames/ours_brun_row0_{i}.png'), 4.2).save(os.path.join(d, f'ursa_attack_{i}.png'))
        n += 1
    for name, rows in ICONS.items():
        make_icon(rows).save(os.path.join(d, f'ursa_{name}.png'))
        n += 1
    for anim, (row, count) in ANIMS.items():
        for i in range(count):
            convert(os.path.join(ROOT, f'assets/sprites/grizzly_frames/grizzly_row{row}_{i}.png')).save(os.path.join(d, f'ursa_{anim}_{i}.png'))
            n += 1
    open(os.path.join(ROOT, 'src/data/asset_version.js'), 'w', encoding='utf-8', newline='\n').write(
        "// GÉNÉRÉ (tools/pixelfix.js et autres outils d'images) -- ne pas modifier à la main.\n"
        f"const ASSET_VERSION = '{int(time.time() * 1000)}';\n")
    print(n, 'images écrites dans', d)


if __name__ == '__main__':
    main()
