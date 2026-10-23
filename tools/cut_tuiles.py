#!/usr/bin/env python3
"""Decoupe l'atlas de tuiles dessine a la main (assets/decors/tuiles.png).

Usage : python tools/cut_tuiles.py
Relancer apres TOUTE retouche de tuiles.png (le jeu ne lit que les cases
decoupees dans assets/decors/tuiles_frames/).

---------------------------------------------------------------------
Ce qu'est tuiles.png
---------------------------------------------------------------------
Un ATLAS de 144x144 px : grille de 6x6 cases de 24 px, toutes de meme
taille (repere visuel : docs/production/tuiles_reperes.png). Chaque case a
un role fixe, defini par l'utilisateur ; les cases sont copiees TELLES
QUELLES (aucun melange, aucune retouche de valeur), seule l'herbe est
recadree a sa taille naturelle.

Coordonnees (colonne, rangee) en cases de 24 px :

  A1 (0,0) A2 (1,0) A3 (2,0)   bloc de terre en 9 parties (9-slice) :
  A4 (0,1) A5 (1,1) A6 (2,1)   coins / bords / centre de la masse de terre
  A7 (0,2) A8 (1,2) A9 (2,2)   SOUS la couche de surface.
  B  (0,3)                     terre pleine de la SURFACE (rangee du haut
                               d'une masse, herbe posee dessus).
  C1 (3,0) C2 (4,0) C3 (5,0)   bande d'1 case de haut : bout gauche, milieu,
                               bout droit (clair en haut ET en bas).
  C4 (5,1)                     case isolee (aucun voisin).
  C5 (5,2) C6 (5,3) C7 (5,4)   colonne d'1 case de large : haut, milieu(x),
                               bas (clair a gauche ET a droite).
  D1 (3,1)                     bas expose + coin interieur NO
  D2 (4,1)                     bas expose + coin interieur NE
  D3 (3,2) D4 (4,2)            coin interieur SE / SO (case interieure dont
  D5 (3,3) D6 (4,3)            seul le voisin en diagonale manque) / NE / NO
  H2 (2,3) x 66-72 y 72-81     petit bout d'herbe : role non precise, PAS
                               decoupe.
  (C = variantes "minces" du 9-slice, D = coins interieurs ; repere par la
  luminance : la partie claire d'une case = le cote expose.)

Herbes (posees PAR-DESSUS les cases de surface, sans hitbox, a leur
taille naturelle -- elles DEPASSENT du bord de la case, demande explicite :
"pour pas que ca fasse trop plat") :

  H1 grass_mid    px x 24-48, y 72-82  (24x10) herbe du milieu
  H3 grass_left   px x 22-48, y 120-132 (26x12) bout GAUCHE, deborde de 2 px
                  a gauche
  H4 grass_right  px x 72-98, y 120-130 (26x10) bout DROIT, deborde de 2 px
                  a droite
  grass_single    compose ici : moitie gauche de H3 (debord compris) +
                  moitie droite de H4 (debord compris), 28x12 -- pour une
                  case de surface sans voisin ni a gauche ni a droite (C4,
                  haut de colonne C5). Les brins de H1/H3/H4 sont au meme
                  endroit, la jointure au milieu ne se voit pas.

Le HAUT de chaque image d'herbe correspond au haut de la case (= la ligne
ou l'on marche) ; les debords lateraux de H3/H4 sont decrits par
GRASS_SPECS[...]['dx'] (decalage en px source du bord gauche de l'image par
rapport au bord gauche de la case), recopie cote jeu dans
AUTOTILE_ATLAS_GRASS (LevelKit.js).

Regles de placement (implementees dans atlasTileFor, src/utils/LevelKit.js ;
S = ensemble des cases pleines) :
  1. Case de surface (pas de voisin N dans S) AVEC un voisin S dans S ET au
     moins un voisin E ou O dans S -> B (les "cases B").
  2. Region R = S prive des cases B. Une case de R n'a pour voisins QUE des
     cases de R (hors de R, case B comprise = EXPOSE). n/s/e/o/no/ne/so/se =
     voisin dans R :
       !n && !s : !o && !e -> C4 ; !o -> C1 ; !e -> C3 ; sinon C2
       sinon !o && !e : !n -> C5 ; !s -> C7 ; sinon C6
       !n && !o -> A1 ; !n && !e -> A3 ; !s && !o -> A7 ; !s && !e -> A9
       !n -> A2
       !s -> !no -> D1 ; !ne -> D2 ; sinon A8
       !o -> A4 ; !e -> A6
       interieur : !no -> D6 ; !ne -> D5 ; !so -> D4 ; !se -> D3 ; sinon A5
  3. Herbe sur TOUTE case sans voisin N dans S : H3 sans voisin O dans S, H4
     sans voisin E dans S, grass_single si aucun des deux, sinon H1.
"""

import os

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(ROOT, "assets", "decors", "tuiles.png")
OUT = os.path.join(ROOT, "assets", "decors", "tuiles_frames")

TILE = 24

# Nom -> (colonne, rangee) de la case dans l'atlas.
CELLS = {
    "A1": (0, 0), "A2": (1, 0), "A3": (2, 0),
    "A4": (0, 1), "A5": (1, 1), "A6": (2, 1),
    "A7": (0, 2), "A8": (1, 2), "A9": (2, 2),
    "B": (0, 3),
    "C1": (3, 0), "C2": (4, 0), "C3": (5, 0),
    "C4": (5, 1),
    "C5": (5, 2), "C6": (5, 3), "C7": (5, 4),
    "D1": (3, 1), "D2": (4, 1), "D3": (3, 2),
    "D4": (4, 2), "D5": (3, 3), "D6": (4, 3),
}

# Herbes : boite source (x0, y0, x1, y1) en px de l'atlas, et dx = position
# du bord gauche de l'image par rapport au bord gauche de la case (px source).
GRASS_SPECS = {
    "grass_mid": {"box": (24, 72, 48, 82), "dx": 0},
    "grass_left": {"box": (22, 120, 48, 132), "dx": -2},
    "grass_right": {"box": (72, 120, 98, 130), "dx": 0},
}

# Fichiers d'un ancien decoupage (jeu de 21 tuiles imitant autotile_frames)
# qui ne servent plus a rien : supprimes a chaque passage.
OBSOLETE = [
    "dirt_tl", "dirt_t", "dirt_tr", "dirt_l", "dirt_c", "dirt_r",
    "dirt_bl", "dirt_b", "dirt_br", "dirt_column", "dirt_angle", "coin",
    "dirt_platform0", "dirt_platform1", "dirt_platform2",
] + [f"dirt_c_var{i}" for i in range(6)]


def main():
    sheet = Image.open(SRC).convert("RGBA")
    if sheet.size != (144, 144):
        raise SystemExit(f"tuiles.png attendu en 144x144, trouve {sheet.size}")
    os.makedirs(OUT, exist_ok=True)

    written = []
    for name, (cx, cy) in CELLS.items():
        img = sheet.crop((cx * TILE, cy * TILE, (cx + 1) * TILE, (cy + 1) * TILE))
        # Une case de terre trouee laisserait voir le fond a travers le sol.
        if img.getchannel("A").getextrema()[0] != 255:
            raise SystemExit(f"case {name} {(cx, cy)} pas entierement opaque")
        img.save(os.path.join(OUT, name + ".png"))
        written.append((name, img.size))

    grass = {}
    for name, spec in GRASS_SPECS.items():
        img = sheet.crop(spec["box"])
        grass[name] = img
        img.save(os.path.join(OUT, name + ".png"))
        written.append((name, img.size))

    # grass_single : moitie gauche de H3 (2 px de debord + 12 px) + moitie
    # droite de H4 (12 px + 2 px de debord).
    left, right = grass["grass_left"], grass["grass_right"]
    half = TILE // 2
    single = Image.new("RGBA", (half + 2 + half + 2, max(left.height, right.height)), (0, 0, 0, 0))
    single.alpha_composite(left.crop((0, 0, 2 + half, left.height)), (0, 0))
    single.alpha_composite(right.crop((half, 0, right.width, right.height)), (2 + half, 0))
    single.save(os.path.join(OUT, "grass_single.png"))
    written.append(("grass_single", single.size))

    removed = []
    for name in OBSOLETE:
        path = os.path.join(OUT, name + ".png")
        if os.path.exists(path):
            os.remove(path)
            removed.append(name)

    print(f"{len(written)} images ecrites dans {OUT}")
    for name, size in written:
        print("   %-14s %dx%d" % (name, size[0], size[1]))
    if removed:
        print("anciens fichiers supprimes :", ", ".join(removed))


if __name__ == "__main__":
    main()
