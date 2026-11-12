#!/usr/bin/env bash
# Les quatre ours du prompt n°14 (grizzly, ours-hibou, panda, ours polaire) et leurs icônes,
# à passer dans pixel-fixer APRÈS leur import (demande de l'utilisateur du 2026-11-12 :
# « pense à bien passer les assets dans le pixel fixer après »).
# Même réglage que les autres formes d'Agarica (tools/pixelfix_formes.sh) : 1 pixel dessiné =
# 1 px d'écran, donc facteur = 1 / échelle d'affichage. Les quatre feuilles sont jouées à 0,4
# (`scale` du manifeste) : facteur 2,5. Si `scale` change dans src/data/asset_manifest.js,
# changer F ici (F = 1 / scale). Icônes : même réglage que les autres (tools/pixelfix_reste.sh).
# Un dossier absent est sauté : le script peut tourner dès qu'une seule feuille est arrivée.
# Depuis la racine du jeu :   bash tools/pixelfix_ours.sh
# Regarder d'abord :          node tools/pixelfix.js files assets/sprites/grizzly_frames --factor 2.5 --colors 16 --outline darkest --pixel-perfect --accents --preview apercu.png
set -u
S=assets/sprites
F=2.5
O="--colors 16 --outline darkest --pixel-perfect --accents"
for id in grizzly ours_hibou panda ours_polaire; do
  d=$S/${id}_frames
  if [ -d "$d" ] && ls "$d"/*.png >/dev/null 2>&1; then
    node tools/pixelfix.js files "$d" --factor $F $O | grep -E "ECHEC|Erreur"
    echo "$id : fait"
  else
    echo "$id : pas encore d'images, saute"
  fi
done
for f in assets/items/skill_icone/panda.png assets/items/skill_icone/ours_polaire.png assets/items/form_icone/grizzly.png assets/items/form_icone/ours_hibou.png; do
  if [ -f "$f" ]; then
    node tools/pixelfix.js files "$f" --factor 18 --colors 16 --pixel-perfect | grep -E "ECHEC|Erreur"
    echo "$f : fait"
  fi
done
echo "fini (penser au numero de src/data/asset_version.js si pixelfix.js ne l'a pas change)"
