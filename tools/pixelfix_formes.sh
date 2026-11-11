#!/usr/bin/env bash
# Formes d'Agarica (hors forme humaine) et transformations, réglage du 2026-11-11 :
# 1 pixel dessiné = exactement 1 px d'écran, donc facteur = 1 / échelle RÉELLE d'affichage
# (mesurée en jeu : agaricaSheetScale avec method 'area' pour le singe et le papillon, constantes
# de Player.js pour le reste), contour propre, lignes fines, petits détails vifs gardés (yeux).
# Un grain non entier donnait un contour d'épaisseur irrégulière (retour utilisateur sur le loup).
# À lancer depuis la racine du jeu, APRÈS tools/pixelfix_reste.sh (qui traite ces images plus fin) :
#   bash tools/pixelfix_formes.sh
set -u
S=assets/sprites
T=$S/transformation
O="--colors 16 --outline darkest --pixel-perfect --accents"
r() { node tools/pixelfix.js files "$@" $O | grep -E "ECHEC|Erreur"; }

r $S/loup_frames/loup_row0_*.png --factor 2.5          # course, 0,4
r $S/loup_frames/loup_row1_*.png --factor 2.17         # saut, 0,46
r $S/loup_attaque_frames --factor 3.29                 # morsure, 0,304
r $S/singe_frames/singe_row0_*.png $S/singe_frames/singe_row1_*.png $S/singe_frames/singe_row2_*.png --factor 3.1   # 0,3227
r $S/singe_frames/singe_row3_*.png $S/singe_frames/singe_row4_*.png $S/singe_frames/singe_row5_*.png --factor 2.84  # 0,3524
r $S/singe_extra_frames --factor 2.53                  # 0,3945
r $S/transfo_singe_frames --factor 4.47                # 0,2239
r $S/forme_papillon_frames --factor 2.29               # 0,4376
r $S/forme_papillon_extra_frames --factor 2.48         # 0,4026
r $S/transfo_papillon_frames --factor 3.35             # 0,2988
r $S/ours_frames --factor 2.94                         # OURS_SCALE 0,34
r $S/pieuvre_frames --factor 4.17                      # PIEUVRE_SCALE 0,24
r $S/piaf_frames --factor 3.57                         # EAGLE_SCALE 0,28
r $T/transfo_frames --factor 3.33                      # TRANSFO_SCALE 0,3
r $T/transfo_loup_frames --factor 14.8                 # 0,0675
r $T/transfo_loup_piaf_frames --factor 12.5            # 0,08
r $T/transfo_ours_frames/transfo_ours_row0_0.png --factor 6.25   # 0,16
r $T/transfo_ours_frames/transfo_ours_row0_1.png --factor 5.88   # 0,17
r $T/transfo_ours_frames/transfo_ours_row0_2.png --factor 5      # 0,2
r $T/transfo_pieuvre_frames --factor 5.56              # 0,18
echo "fini"
