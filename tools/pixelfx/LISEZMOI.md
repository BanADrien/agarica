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
| `bear-slam.js` : fracas de l'ours (poussière, pierres, traînée de la patte) | `node tools/pixelfx/export_fracas.mjs` : 16 images 352x200 (`fracas_impact_<i>`) + 5 images 160x186 (`fracas_griffe_<i>`) | `assets/vfx/fracas_frames/`, jouées à l'impact du fracas de l'ours brun, à l'atterrissage de l'ours-hibou et à la percussion du grizzly (`ursidePlayFracas`, src/entities/Ursides.js) |

Pour l'arc et le feu, copier ensuite les images du dossier de rendu dans le dossier du jeu.
Les originaux IA sont dans `assets/_pixelfix_originals/` ; `node tools/pixelfix.js restore
assets/vfx/vfx_slash_frames` remet l'arc d'origine (pour le feu, remettre aussi
CAMPFIRE_FRAME_COUNT = 4 et frameRate 8 dans LevelKit.js).

Après un nouveau rendu, changer le numéro de `src/data/asset_version.js` : sans cela le navigateur
garde les anciennes images.

## Fracas de l'ours

L'image de l'ours brun ne contient plus aucun effet : ils sont ici, pour rester modifiables. Tout se
règle en tête de `bear-slam.js`, une ligne par réglage :

| Réglage | Effet |
|---|---|
| `duration` | durée de l'impact, en secondes (0,8) |
| `dust` | 4 couleurs de la poussière : ombre, corps, clair, crête |
| `stone` | couleur des pierres |
| `rocks` | nombre de pierres qui volent (8) |
| `grit` | nombre de miettes de terre (46) |
| `reach` | demi-largeur des vagues de poussière ; 1 px de l'effet = 2 px d'écran (54 = la zone de 220 px du fracas) |
| `lift` | hauteur des jets (1 = normal) |
| `claw`, `clawFrom`, `clawTo`, `clawTime` | traînée du coup de patte : couleurs, départ, arrivée (px de l'effet, depuis les pattes arrière), durée |

Puis `node tools/pixelfx/export_fracas.mjs` depuis la racine du jeu : il réécrit les images,
`src/data/fracas_fx.js` (nombre d'images, cadence, point d'ancrage : le jeu les lit là, aucun code à
changer) et le numéro de `src/data/asset_version.js`. Pour regarder sans toucher au jeu :
`node tools/pixelfx/export_fracas.mjs <un dossier>`.

En jeu (`src/entities/Ursides.js`) : `impact` est posé au centre de la zone de dégâts, agrandi avec
elle (palier 3 des ursidés) ; `griffe` suit le sens de l'ours brun. Sans les images, le jeu retombe
sur les anciens effets dessinés par code.

## Courant d'air ascendant

La case se répète sans raccord en largeur et en hauteur. Elle ne contient que la vie des filets de
vent (ils se tracent, ondulent, s'enroulent, s'effacent) ; la montée est le défilement fait par le
jeu, plus rapide au plan avant qu'au plan du fond. Le jeu ajoute un voile de lumière sous les filets.
Sans les images, `CourantAir.js` retombe sur l'ancien rendu (image étirée et traits).
