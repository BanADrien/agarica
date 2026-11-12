---
name: codex-images
description: Générer soi-même les images d'un lot de Legend of Agarica en lançant Codex sans fenêtre, puis les contrôler, les passer dans pixel-fixer et les montrer. À utiliser dès qu'un prompt d'images (docs/production/PROMPT_CODEX_n.md) est prêt ou qu'une image est à régénérer, au lieu de demander à l'utilisateur de coller le prompt dans VS Code.
---

# Générer les images avec Codex, sans passer par l'utilisateur

Méthode validée par l'utilisateur le 2026-11-12 (« garde la méthode »). Codex utilise SON
compte et son quota : on avance par petits essais, on ne régénère pas pour rien.

## Étapes

1. **Écrire le prompt du lot** dans `docs/production/PROMPT_CODEX_<n>.md`, au gabarit des
   lots 12 à 14 : un bloc de code sous « Prompt à coller dans Codex », des images numérotées
   `1) chemin…`, puis `À LA FIN`. Règles de dessin retenues : aucun vêtement ni accessoire sur
   un animal, silhouette distincte des formes existantes, aucun effet peint dans la feuille
   d'un personnage (les effets se font à part, avec pixelfx).
2. **Extraire** les images voulues : `python tools/codex_prompt.py <n> --images 1 3` (sans
   `--images` : tout le lot). Le chemin du prompt s'affiche.
3. **Lancer Codex en arrière-plan** (`run_in_background`), un seul à la fois :
   ```
   CX="/c/Users/adrie/.vscode/extensions/openai.chatgpt-<version>/bin/windows-x86_64/codex.exe"
   "$CX" exec -C "C:/Users/adrie/Documents/projet/agarica" --approve-for-me --color never -o <bilan.txt> - < <prompt.txt> > <journal.log> 2>&1
   ```
   - Le dossier de l'extension change de nom à chaque mise à jour : le retrouver avec
     `ls /c/Users/adrie/.vscode/extensions | grep openai.chatgpt`.
   - `--approve-for-me` suffit (écriture limitée au projet) ; ne pas ajouter `-s`, les deux
     options sont refusées ensemble.
   - Environ 5 minutes par feuille. Lire le bilan dans `<bilan.txt>` à la fin.
4. **Première image d'un nouveau dessin seule**, la montrer à l'utilisateur (SendUserFile), et
   ne lancer qu'ensuite les images qui en dépendent (autres feuilles du même animal, icônes).
   Les images indépendantes peuvent partir tout de suite.
5. **Contrôler** chaque feuille en la lisant (Read) : nombre de frames, rien d'interdit,
   silhouettes. Une image ratée se relance seule (`--images <numéro>`).
6. **Pixel-fixer, toujours**, juste après l'import : aperçu d'abord (`--preview`), puis le
   script de la catégorie (`tools/pixelfix_ours.sh` pour les ours ; voir CLAUDE.md, « Pixel art »).
7. **Vérifier en jeu** (skills `capture` et `verif`), changer `src/data/asset_version.js`,
   puis skill `livrer`.

## Interdits

- Jamais deux Codex en même temps sur le projet, ni pendant une session Codex de VS Code de
  l'utilisateur : lui demander si la sienne est arrêtée.
- Codex ne commite pas et ne pousse pas (c'est écrit dans le prompt extrait).
- Ne pas commiter une image refusée par l'utilisateur.
