# Prompt à donner à Codex (génération des images)

Copier-coller le bloc ci-dessous dans Codex, ouvert sur le dossier du projet `agarica`.

```
Tu travailles dans le dépôt du jeu « Legend of Agarica » (Phaser 3). Ta mission : générer les images manquantes du jeu.

1. Lis entièrement `CODEX_SPRITES_A_GENERER.md` à la racine : mode d'emploi, « Règles d'or », « Bloc style commun », « Fiches identité », puis une section par asset.
   Chaque section contient :
   - le chemin de sortie EXACT ;
   - la taille de l'image ;
   - le tableau des rangées et des frames ;
   - un prompt en anglais prêt à l'emploi, dans un bloc de code.

2. Avant de générer, regarde les images de référence citées dans le mode d'emploi pour reproduire exactement le style existant :
   - `assets/sprites/agarica_frames/agarica_row0_0.png`
   - `assets/sprites/xara_frames/xara_walk_0.png`
   - `assets/bosses_sprites/9a183398-c678-4590-ab59-155c7205e9c6.png`
   - `assets/sprites/loup_frames/loup_row0_0.png`
   - `assets/items/form_icone/loup.png`
   - `assets/items/totems.png`
   Utilise-les comme références visuelles quand la section le demande.

3. Génère les assets de la section « P1 — indispensable » dans l'ordre du document, un prompt = une image.
   - Utilise le prompt anglais de chaque section tel quel (tu peux ajouter des précisions, mais n'en retire rien).
   - Respecte strictement :
     - fond transparent (ou noir pur à défaut) ;
     - une rangée = une animation ;
     - le nombre de frames par rangée indiqué ;
     - des frames qui ne se touchent jamais (≥ 40 px de vide) et une large bande vide entre les rangées ;
     - une seule silhouette connexe par frame ;
     - aucun texte ;
     - personnages tournés vers la DROITE ;
     - la même hauteur de personnage d'une image à l'autre.
   - Enregistre chaque image au chemin exact indiqué :
     - `assets/sprites/<id>.png`, plus `_p2`, `_p3` quand l'animation est répartie sur plusieurs images ;
     - `assets/vfx/<id>.png` pour les effets ;
     - `assets/_codex_src/<nom>.png` pour tout le reste.

4. Après chaque personnage (ou toutes les 3-4 images), lance :
     python tools/import_codex_assets.py
   - Lis le rapport. En cas d'AVERTISSEMENT (nombre de rangées ou de frames différent du manifeste, frames collées, rangée manquante), régénère l'image en insistant sur l'espacement, puis relance :
       python tools/import_codex_assets.py --only <id> --force
   - Ne modifie JAMAIS `src/data/asset_manifest.js`, les noms d'animations ni le nombre de frames : le code du jeu en dépend. C'est l'image qui doit s'adapter au manifeste.
   - Ne modifie aucun fichier dans `src/`.

5. Vérifie visuellement le résultat découpé dans les dossiers `assets/sprites/<id>_frames/` :
   - cadrage ;
   - taille cohérente entre frames ;
   - aucune frame vide ou coupée.

6. Quand toute la section P1 est faite et importée sans avertissement, passe à P2, puis P3, puis aux « Planches de décor ».
   Pour les tilesets et les planches de décor, suis précisément les instructions de leur section.

7. À la fin (ou si tu t'arrêtes), écris `docs/production/RAPPORT_CODEX.md`, avec pour chaque asset :
   - fait / à refaire / non fait ;
   - la sortie du dernier `import_codex_assets.py` ;
   - les problèmes rencontrés.
   Termine toujours par un dernier `python tools/import_codex_assets.py`, pour que le fichier `src/data/asset_present.js` soit à jour. Sans lui, le jeu ne charge pas les nouvelles images.
```
