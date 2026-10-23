# Prompt Codex n°6 — forme papillon d'Agarica (2026-10-23)

Trois nouvelles images, déjà déclarées dans `src/data/asset_manifest.js` (`forme_papillon`, `transfo_papillon`, `form_icone_papillon`) : le jeu les utilisera automatiquement après import.

```
Trois nouvelles images pour « Legend of Agarica ». Règles habituelles :
- fond transparent ;
- une rangée = une animation, nombre de frames exact ;
- frames séparées d'au moins 40 px, rangées d'au moins 60 px ;
- une silhouette connexe par frame ;
- tourné vers la DROITE ;
- aucun texte ;
- ne modifie ni `src/` ni le manifeste.

Références à joindre :
- `assets/ui/portraits/agarica.png` (couleurs d'Agarica : cheveux AUBURN CLAIR #B5613A, yeux verts, cape verte, tatouage spirale rose) ;
- `assets/sprites/papillon_frames/papillon_row0_0.png` (style des papillons lumineux du jeu) ;
- `assets/sprites/singe_frames/singe_row0_0.png` et `assets/sprites/transfo_singe.png` (autre forme animale d'Agarica, même rendu).

1) `assets/sprites/forme_papillon.png` (1536 x 1024), puis `python tools/import_codex_assets.py --only forme_papillon`

Prompt :
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Strict side view (profile).
CHARACTER: AGARICA'S BUTTERFLY FORM: Agarica (a young druid) transformed into a large magical butterfly, clearly recognisable as her: wings in her colours (forest-green upper wings with leaf-vein patterns like her cape, soft pink-rose lower wings with a spiral motif like her arm tattoo, luminous mint-green edges), a small slender body with a tiny tuft of light auburn hair (#B5613A) on the head, big green eyes, two curled antennae. Same cel-shaded rendering and thick outline as her other animal forms (reference images). The wings are part of ONE connected silhouette with the body.
SPRITE SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background. Exactly 3 horizontal rows; each row is ONE animation of 4 frames, read left to right, each frame centered in a cell about 384 px wide and 341 px tall. At least 40 px of empty space between frames and 60 px between rows. Every frame is ONE connected silhouette; NO detached sparkles, dust, trails or motion lines (the game draws the trail); no ground, no shadow, no text. Same scale in every frame: wingspan about 220 px. Facing RIGHT (flying toward the right).
ROWS:
Row 1 - "flap" (one powerful wing beat from a hover), 4 frames. Frame 1: wings raised high above the body. Frame 2: wings sweeping down, half open. Frame 3: wings fully down below the body, body pushed slightly up. Frame 4: wings coming back up to mid height.
Row 2 - "dash" (fast straight flight diagonally up and forward, looping), 4 frames. Body tilted about 35 degrees nose-up toward the upper right. Frame 1: wings swept back tight along the body, streamlined. Frame 2: wings half open, short quick beat. Frame 3: wings swept back again. Frame 4: wings slightly open.
Row 3 - "glide" (gentle hover, looping), 4 frames. Body level. Frame 1: wings open wide and flat. Frame 2: wings slightly raised. Frame 3: wings open wide. Frame 4: wings slightly lowered.
Output: one PNG, 1536 x 1024 px, transparent background, exactly 3 rows, 4 / 4 / 4 frames.

2) `assets/sprites/transfo_papillon.png` (1536 x 1024), puis `python tools/import_codex_assets.py --only transfo_papillon`

Prompt :
Same art style and same character design as the butterfly form above. A 4-frame transformation of AGARICA (a petite chibi druid girl about 250 px tall: short messy LIGHT AUBURN hair #B5613A, big green eyes, dark-green hooded cape with leaf embroidery, beige sleeveless tunic, pink spiral tattoo on her arm, brown boots) into her butterfly form, in mid-air. ONE single row of 4 frames, each centered in a 384 px wide cell, at least 40 px of space between frames. Every frame is ONE connected silhouette: the swirl of green leaves and pink petals must stay ATTACHED to her silhouette (no floating particles). Facing RIGHT. Frame 1: Agarica in mid-air, arms spread, cape opening, eyes glowing green. Frame 2: her cape turning into green leaf-veined wings, body shrinking, petals wrapped around her. Frame 3: small butterfly shape with half-formed wings, a few leaves still attached. Frame 4: the finished butterfly form, wings open (same as the "glide" pose). Transparent background, no ground, no text.
Output: one PNG, 1536 x 1024 px, transparent background, 1 row of 4 frames.

3) `assets/_codex_src/form_icone_papillon.png` (1024 x 1024), puis `python tools/import_codex_assets.py --only form_icone_papillon`

Prompt :
A round form icon for the game, matching EXACTLY the existing form icons (attach `assets/items/form_icone/loup.png` and `assets/items/form_icone/singe.png` as references): a round wooden medallion with a twisted vine and ivy ring, and in its centre a carved, softly glowing symbol of a butterfly with leaf-veined wings and a small spiral on the lower wing. Same size, same framing, same lighting and same colours as the reference icons. Transparent background around the medallion, no text.

À la fin, mets à jour `docs/production/RAPPORT_CODEX.md` et lance un `python tools/import_codex_assets.py` final.
```
