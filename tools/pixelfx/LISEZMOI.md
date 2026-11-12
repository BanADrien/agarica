# Effets faits avec pixelfx

pixelfx (https://github.com/patch-gg/pixelfx, MIT) n'est PAS dans ce dépôt : il se clone à côté du jeu.

## Installation sur un nouveau PC

1. Installer Node.js (`winget install OpenJS.NodeJS.LTS`).
2. Cloner pixelfx à côté du dossier du jeu (`…/projet/agarica` et `…/projet/pixelfx`) :
   `git clone https://github.com/patch-gg/pixelfx.git`
3. Pour pixel-fixer (sous-module du jeu) : `git submodule update --init`, puis `npm install` dans
   `tools/pixel-fixer`.

Les scripts trouvent pixelfx tout seuls (`racine.mjs`) : variable `PIXELFX_ROOT`, sinon le dossier
`pixelfx` voisin du jeu, sinon `E:/projet/pixelfx` (premier PC). Ils copient eux-mêmes nos effets dans
pixelfx avant le rendu : plus rien à copier à la main.

## Nos effets

| Effet (fichier ici) | Rendu | Images du jeu |
|---|---|---|
| `moon-crescent.js` : arc de la dague | `node tools/pixelfx/export_slash.mjs <dossier>` : 9 images 308x288 | `assets/vfx/vfx_slash_frames/` |
| `campfire-agarica.js` : feu de camp | `node tools/pixelfx/export_feu.mjs <dossier>` : 36 images | `assets/items/feu_de_camp_frames/` |
| `root-portal.js` : portail de l'arche de racines | `node tools/pixelfx/export_portail.mjs assets/decors/elements/portail_frames` : 24 images 440x300 | jouées par-dessus l'arche ouverte (`arbreGlowPassage`, src/story/acte1_arbre.js) |
| `updraft.js` : courant d'air ascendant | `node tools/pixelfx/export_courant.mjs assets/vfx/courant_frames` : 2 plans x 24 cases 256x256 | mosaïque qui défile vers le haut (`src/entities/CourantAir.js`) |

Pour l'arc et le feu, copier ensuite les images du dossier de rendu dans le dossier du jeu.
Les originaux IA sont dans `assets/_pixelfix_originals/` ; `node tools/pixelfix.js restore
assets/vfx/vfx_slash_frames` remet l'arc d'origine (pour le feu, remettre aussi
CAMPFIRE_FRAME_COUNT = 4 et frameRate 8 dans LevelKit.js).

Après un nouveau rendu, changer le numéro de `src/data/asset_version.js` : sans cela le navigateur
garde les anciennes images.

## Courant d'air ascendant

La case se répète sans raccord en largeur et en hauteur. Elle ne contient que la vie des filets de
vent (ils se tracent, ondulent, s'enroulent, s'effacent) ; la montée est le défilement fait par le
jeu, plus rapide au plan avant qu'au plan du fond. Le jeu ajoute un voile de lumière sous les filets.
Sans les images, `CourantAir.js` retombe sur l'ancien rendu (image étirée et traits).
