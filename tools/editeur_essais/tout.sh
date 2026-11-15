#!/bin/bash
# Tous les essais de l'éditeur, l'un après l'autre (un seul navigateur à la fois).
S="C:/Users/adrie/AppData/Local/Temp/claude/3d0351841f7e1f84/299c1385-a5d5-4191-a5d7-89c31c00f346/scratchpad/editeur_v2"
cd /c/Users/adrie/Documents/projet/agarica
filtre() { grep -v "^  File\|^    \|^---\|ConnectionAborted\|^Exception\|^Traceback\|evaluate: Page" "$1"; }
python -u "$S/aller_retour.py" > "$S/log_aller_retour.txt" 2>&1; echo "== aller_retour"; filtre "$S/log_aller_retour.txt" | grep -v "^lignes" | tail -8
python -u "$S/essai_zones.py" > "$S/log_zones.txt" 2>&1; echo "== zones (code $?)"; filtre "$S/log_zones.txt" | tail -6
python -u "$S/essai_gestes.py" 1366 768 > "$S/log_gestes_1366.txt" 2>&1; echo "== gestes 1366"; filtre "$S/log_gestes_1366.txt" | grep -v "^OK" | tail -8
python -u "$S/essai_gestes.py" 1920 1080 > "$S/log_gestes_1920.txt" 2>&1; echo "== gestes 1920"; filtre "$S/log_gestes_1920.txt" | grep -v "^OK" | tail -8
python -u "$S/essai_catalogue.py" > "$S/log_catalogue.txt" 2>&1; echo "== catalogue"; filtre "$S/log_catalogue.txt" | cut -c1-400 | tail -12
python -u "$S/essai_divers.py" > "$S/log_divers.txt" 2>&1; echo "== divers"; filtre "$S/log_divers.txt" | grep -v "^OK" | tail -6
python -u "$S/captures.py" 1366 768 > "$S/log_captures_1366.txt" 2>&1; echo "== captures 1366"; filtre "$S/log_captures_1366.txt" | tail -4
python -u "$S/captures.py" 1920 1080 > "$S/log_captures_1920.txt" 2>&1; echo "== captures 1920"; filtre "$S/log_captures_1920.txt" | tail -4
echo "== src/data :"; git status --porcelain src/data
echo FIN
