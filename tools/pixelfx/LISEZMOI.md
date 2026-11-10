# Effets faits avec pixelfx

pixelfx (https://github.com/patch-gg/pixelfx, MIT) est cloné à côté du jeu, dans `E:\projet\pixelfx`.

- `moon-crescent.js` : l'effet de l'arc de la dague (à copier dans `E:\projet\pixelfx\src\fx\melee\`).
- `node tools/pixelfx/export_slash.mjs <dossier>` : rend les 9 images de `vfx_slash` (308x288).
- `node tools/pixelfx/export_feu.mjs <dossier>` : rend les 36 images du feu de camp (fire/campfire).

Copier ensuite les images dans `assets/vfx/vfx_slash_frames/` et `assets/items/feu_de_camp_frames/`.
Les originaux IA sont dans `assets/_pixelfix_originals/` ; `node tools/pixelfix.js restore
assets/vfx/vfx_slash_frames` remet l'arc d'origine (pour le feu, remettre aussi
CAMPFIRE_FRAME_COUNT = 4 et frameRate 8 dans LevelKit.js).
