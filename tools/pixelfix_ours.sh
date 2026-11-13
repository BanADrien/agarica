#!/usr/bin/env bash
# Les cinq ours (prompt n°14 : grizzly, ours-hibou, panda, ours polaire, et l'ours brun de la
# compétence « ours ») et leurs quatre icônes, à passer dans pixel-fixer APRÈS leur import et
# APRÈS le réglage de leur échelle (demande de l'utilisateur du 2026-11-12).
#
# Même réglage que les autres formes d'Agarica (tools/pixelfix_formes.sh) : 1 pixel dessiné =
# 1 px d'écran, donc facteur = 1 / échelle d'affichage. L'échelle de chaque ours est son `scale`
# de src/data/asset_manifest.js (tailles fixées le 2026-11-13 : ours-hibou 190 px de long,
# grizzly 170, ours polaire 165, ours brun 150, panda 150) ; elle est relue ici à chaque passage,
# rien à recopier. Les images affichées à une autre échelle que leur feuille ont leur facteur :
#   - K ci-dessous : mêmes valeurs que URSIDE_FRAME_K (src/entities/Ursides.js) -- foulées
#     allongées et saut du grizzly, patte levée de l'ours brun. En changer une = changer l'autre ;
#   - rangées `transform` : Agarica (0,332) puis 25 %, 70 %, 100 % du chemin vers l'animal
#     (URSIDE_AGARICA_SCALE et URSIDE_TRANSFO_STEPS, même fichier).
#
# Lots (constat du 2026-11-12 : traité avec sa rangée de transformation, l'ours-hibou perdait
# le vert de ses plumes -- la palette partait dans les couleurs d'Agarica) :
#   1. l'animal seul : toutes ses rangées + la dernière image de `transform`, une palette ;
#   2. ses images à une autre échelle : même palette que le lot 1 (sinon les gris changent d'une
#      foulée à l'autre) ;
#   3. les trois premières images de `transform`, une par une (elles ont les couleurs d'Agarica).
#
# Depuis la racine du jeu :
#   bash tools/pixelfix_ours.sh --apercu <dossier>   planches avant / après, n'écrit rien d'autre
#   bash tools/pixelfix_ours.sh                      refait les images (originaux gardés dans
#                                                    assets/_pixelfix_originals/, numéro de
#                                                    src/data/asset_version.js changé)
# Un ours sans images est sauté. Node : dans Git Bash, export PATH="/c/Program Files/nodejs:$PATH".
set -u
S=assets/sprites
O="--outline darkest --pixel-perfect --accents"
APERCU=""
if [ "${1:-}" = "--apercu" ]; then APERCU="${2:?dossier des aperçus}"; mkdir -p "$APERCU"; fi

# `scale` d'une entrée du manifeste.
echelle() { node -e "const vm=require('vm'),c={};vm.createContext(c);vm.runInContext(require('fs').readFileSync('src/data/asset_manifest.js','utf8')+';this.s=ASSET_MANIFEST[\"$1\"].scale',c);console.log(c.s)"; }
# Facteur = 1 / (échelle x k), à deux décimales.
facteur() { awk -v s="$1" -v k="${2:-1}" 'BEGIN { printf "%.2f", 1 / (s * k) }'; }
# Échelle d'une image de transformation : Agarica (83 px pour 250 dessinés) + part du chemin.
transfo() { awk -v s="$1" -v p="$2" 'BEGIN { a = 83 / 250; printf "%.4f", a + (s - a) * p }'; }

# lot <nom> <facteur> <couleurs> [--palette <png>] -- <images...>
lot() {
  local nom=$1 f=$2 couleurs=$3; shift 3
  local pal=""
  if [ "$1" = "--palette" ]; then pal="--palette $2"; shift 2; fi
  shift # --
  if [ -n "$APERCU" ]; then
    # Aperçu : la palette du lot 1 n'est pas encore écrite, chaque lot a la sienne.
    node tools/pixelfix.js files "$@" --factor "$f" --colors "$couleurs" $O --preview "$APERCU/$nom.png" | grep -E "ECHEC|Erreur|couleurs"
  else
    node tools/pixelfix.js files "$@" --factor "$f" --colors "$couleurs" $O $pal | grep -E "ECHEC|Erreur"
  fi
}

# ours <id> <rangée transform> <couleurs> <"rangée_image:k ...">
ours() {
  local id=$1 rt=$2 couleurs=$3 autres=$4
  local d=$S/${id}_frames p=$S/${id}_frames/${id}
  if ! ls "$d"/*.png >/dev/null 2>&1; then echo "$id : pas encore d'images, saute"; return; fi
  local s; s=$(echelle "$id")
  # 1. l'animal seul, à l'échelle de sa feuille
  local corps=()
  for f in "$d"/*.png; do
    local n; n=$(basename "$f" .png); n=${n#${id}_row}
    case " $autres " in *" $n:"*) continue ;; esac
    case "$n" in ${rt}_[012]) continue ;; esac
    corps+=("$f")
  done
  lot "${id}_corps" "$(facteur "$s")" "$couleurs" -- "${corps[@]}"
  # 2. ses images à une autre échelle, avec la palette du lot 1
  for a in $autres; do
    lot "${id}_${a%%:*}" "$(facteur "$s" "${a##*:}")" "$couleurs" --palette "${corps[0]}" -- "${p}_row${a%%:*}.png"
  done
  # 3. la transformation : Agarica, puis les deux étapes (20 couleurs : deux palettes mêlées)
  local i=0
  for part in 0 0.25 0.7; do
    local st; st=$(transfo "$s" "$part")
    lot "${id}_transfo_$i" "$(facteur "$st")" 20 -- "${p}_row${rt}_${i}.png"
    i=$((i + 1))
  done
  echo "$id : fait (échelle $s)"
}

#    id            rangée   couleurs  images à une autre échelle (rangée_image:k)
ours grizzly       3        32        "0_1:1.15 0_2:1.3 1_1:1.1 1_2:1.25 2_0:1.15 2_1:1.15 2_2:1.15"
ours ours_hibou    3        24        ""
ours panda         1        24        ""
ours ours_polaire  2        24        ""
ours ours_brun     1        24        "0_1:1.1"

# Icônes : même réglage que les autres (tools/pixelfix_reste.sh).
for f in assets/items/skill_icone/panda.png assets/items/skill_icone/ours_polaire.png assets/items/form_icone/grizzly.png assets/items/form_icone/ours_hibou.png; do
  [ -f "$f" ] || continue
  if [ -n "$APERCU" ]; then
    node tools/pixelfix.js files "$f" --factor 18 --colors 16 --pixel-perfect --preview "$APERCU/icone_$(basename "$f")" | grep -E "ECHEC|Erreur"
  else
    node tools/pixelfix.js files "$f" --factor 18 --colors 16 --pixel-perfect | grep -E "ECHEC|Erreur"
  fi
  echo "$f : fait"
done
[ -n "$APERCU" ] && echo "aperçus dans $APERCU (rien d'autre n'est écrit)" || echo "fini"
