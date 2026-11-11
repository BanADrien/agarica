#!/usr/bin/env bash
# Pixelise le reste du jeu (2026-11-11) : formes d'Agarica et transformations, totems,
# objets, icônes, portraits, effets. À lancer depuis la racine du jeu :
#   bash tools/pixelfix_reste.sh
# Réglages : cf. CLAUDE.md (grain d'Agarica = 0,65 px d'écran par pixel pour les formes ;
# facteur = grain / échelle d'affichage). Une image déjà refaite repart de son original.
set -u
P="node tools/pixelfix.js"
S=assets/sprites
run() { "$@" | grep -E "ECHEC|Erreur" ; }

# Formes d'Agarica du manifest (singe, papillon) et leurs transformations.
run $P anim singe singe_extra transfo_singe forme_papillon forme_papillon_extra transfo_papillon --density 0.65 --colors 20 --pixel-perfect

# Formes et transformations hors manifest : facteur = 0,65 / échelle (Player.js).
# Loup : 1 pixel dessiné = exactement 1 px d'écran, pour CHAQUE échelle d'affichage (course 0,4 ; saut
# 0,46 ; morsure 0,304). À 1,3 px (essai du 2026-11-11), les pixels tombaient à cheval sur ceux de l'écran :
# contour d'épaisseur irrégulière, « bizarre ». Contour propre + œil gardé (--accents).
run $P files $S/loup_frames/loup_row0_*.png --factor 2.5 --colors 16 --outline darkest --pixel-perfect --accents
run $P files $S/loup_frames/loup_row1_*.png --factor 2.17 --colors 16 --outline darkest --pixel-perfect --accents
run $P files $S/loup_attaque_frames --factor 3.29 --colors 16 --outline darkest --pixel-perfect --accents
run $P files $S/ours_frames --factor 1.91 --colors 20 --pixel-perfect            # OURS_SCALE 0,34
run $P files $S/pieuvre_frames --factor 2.71 --colors 20 --pixel-perfect         # PIEUVRE_SCALE 0,24
run $P files $S/transformation/transfo_frames --factor 2.17 --colors 20 --pixel-perfect           # TRANSFO_SCALE 0,3
run $P files $S/transformation/transfo_loup_frames --factor 9.6 --colors 20 --pixel-perfect       # 0,0675
run $P files $S/transformation/transfo_loup_piaf_frames --factor 8.1 --colors 20 --pixel-perfect  # 0,08
run $P files $S/transformation/transfo_ours_frames --factor 3.6 --colors 20 --pixel-perfect       # ~0,18
run $P files $S/transformation/transfo_pieuvre_frames --factor 3.6 --colors 20 --pixel-perfect    # 0,18
for f in $S/petites/*.png; do run $P files "$f" --factor 2.5 --colors 20 --pixel-perfect; done

# Totems (décor, grain de 2 px d'écran à TOTEM_SCALE 0,35), une palette par image.
for f in assets/items/totem_frames/*.png; do run $P files "$f" --factor 5.7 --colors 24 --outline darkest --pixel-perfect; done

# Objets (inventaire et ramassage) : ~32 pixels dessinés, contour propre.
for f in assets/items/objets/*.png; do run $P files "$f" --height 30 --colors 20 --outline darkest --pixel-perfect; done
# ... sauf les GRANDS objets du décor (murs et amas de mousse, porte, liane, courant d'air, rocher, corde) :
# à 30 pixels de haut, ils devenaient de gros carrés une fois affichés en grand (mur de mousse de la zone de
# fin). Facteur = 2 / échelle du manifest ; mur de mousse plus fin (4) car il est étiré sur tout un mur.
for kv in rocher_roulant:6.67 mousse_amas_intact:8 mousse_amas_fissure:8 liane:8 mousse_mur:4 porte_mousse:9.5 courant_air:6 objet_corde:4; do
  run $P files assets/items/objets/${kv%%:*}.png --factor ${kv##*:} --colors 24 --pixel-perfect
done

# Icônes de forme et de compétence (724 px) : ~40 pixels dessinés.
for f in assets/items/form_icone/*.png assets/items/skill_icone/*.png; do run $P files "$f" --factor 18 --colors 16 --pixel-perfect; done

# Portraits des dialogues (512 px, affichés à ~128) : 64 pixels dessinés.
for f in assets/ui/portraits/*.png; do run $P files "$f" --factor 8 --colors 24 --pixel-perfect; done

# Effets animés du manifest (1,3 px d'écran par pixel).
run $P anim vfx_soin_papillon vfx_slash vfx_croc vfx_souffle_toxique vfx_flaque_mousse vfx_purification \
  vfx_piste_loup vfx_onde_choc vfx_vague_mousse vfx_invocation_clak vfx_impact_pierre vfx_mousse_toxique vfx_anneau_choc \
  --density 1.3 --colors 16
echo "fini"
