# Prompt Codex n°5 — attaques en arc d'Agarica + nouveau logo (2026-10-23)

Deux nouvelles images, déjà déclarées dans `src/data/asset_manifest.js` (`agarica_slash` et `vfx_slash`) : le jeu les utilisera automatiquement dès qu'elles seront importées.

```
Deux nouvelles images pour « Legend of Agarica ». Règles habituelles :
- fond transparent ;
- une rangée = une animation, nombre de frames exact ;
- frames séparées d'au moins 40 px, rangées d'au moins 60 px ;
- une silhouette connexe par frame ;
- personnage tourné vers la DROITE ;
- aucun texte ;
- ne modifie ni `src/` ni le manifeste.
Joins comme référence `assets/sprites/agarica_extra_frames/agarica_extra_row4_0.png` et `assets/ui/portraits/agarica.png` : même personnage, même échelle, mêmes couleurs (cheveux CHÂTAIN ROUX #A85C34, pas rouges).

1) `assets/sprites/agarica_slash.png` (1536 x 1024), puis `python tools/import_codex_assets.py --only agarica_slash`

Prompt :
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. Strict side view (profile).
CHARACTER: AGARICA (the heroine): a petite teenage female druid, chibi proportions (about 2.5 to 3 heads tall), pointed elf ears, big green eyes, short messy CHESTNUT-RED hair (warm chestnut / auburn-brown, base colour #A85C34, NOT bright red), dark-green hooded cape embroidered with leaf and vine patterns and closed by a round silver clasp at the collar, sleeveless beige tunic, brown belt with a gold buckle, dark grey trousers, brown leather boots, black fingerless mittens, a pink-red spiral tattoo on her bare upper arm. She holds a small silver dagger in her right hand. Same design as the reference images.
SPRITE SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background. Exactly 3 horizontal rows; each row is ONE animation, read left to right, 4 frames per row, each frame centered in a cell about 384 px wide, feet (or lowest point) on the same baseline within a row. At least 40 px of empty space between frames and 60 px between rows. Every frame is ONE connected silhouette: the dagger touches her hand; NO slash trail, NO motion lines, NO sparkles, NO effects at all (the slash arc is a separate image); no ground, no shadow, no text. Same scale in every frame: Agarica about 250 px tall when standing. She faces RIGHT in every frame.
ROWS:
Row 1 - "side" (horizontal dagger slash in front of her, standing), 4 frames. Frame 1: wind-up, dagger raised behind her shoulder, body turned slightly back, knees bent. Frame 2: fast horizontal swing, arm sweeping forward at chest height, front foot stepping forward. Frame 3: follow-through, arm fully extended forward-down across her body, cape flaring behind. Frame 4: recovery, dagger arm coming back near the chest, balanced stance.
Row 2 - "up" (upward dagger slash above her head), 4 frames. Frame 1: crouched slightly, dagger held low near the hip, looking up. Frame 2: arm sweeping upward in front of her face. Frame 3: arm fully extended straight up above her head, body stretched upward, on tiptoes, cape falling behind. Frame 4: arm coming back down to the side.
Row 3 - "down" (downward slash while in the air, below her feet), 4 frames. Frame 1: airborne, knees tucked up, dagger raised to the side, looking down. Frame 2: arm sweeping downward past her knees. Frame 3: arm fully extended straight down below her feet, legs tucked to the side, cape and hair blown upward. Frame 4: airborne recovery, knees still tucked, dagger arm coming back up.
Output: one PNG, 1536 x 1024 px, transparent background, exactly 3 rows, 4 / 4 / 4 frames.

2) `assets/vfx/vfx_slash.png` (1536 x 1024), puis `python tools/import_codex_assets.py --only vfx_slash`

Prompt :
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, clean readable shapes, magical accents in luminous green.
EFFECT: the glowing SLASH ARC of a small magic-infused dagger: a crisp crescent-shaped blade trail in luminous mint-green and white (core white, edge green #9FFFD0, faint leaf-shaped sparks attached to the arc), like Hollow Knight's nail slash but leafy and druidic. The arc must be a clean, solid, well-defined crescent (it represents exactly the area that hits enemies).
EFFECT SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background, NO dark backdrop. Exactly 3 horizontal rows of equal height (about 341 px each); each row is ONE animation of 3 frames, read left to right; divide each row into 3 equal cells 512 px wide. Each frame is drawn CENTERED in its cell and stays fully inside it with at least 30 px of margin. Same arc size in every row. No character, no dagger, no ground, no text, no grid lines.
ROWS:
Row 1 - "side": a horizontal crescent opening toward the LEFT (the swing goes in front of the character, to the RIGHT), about 300 px wide and 200 px tall. Frame 1: thin bright arc appearing. Frame 2: full thick crescent, brightest. Frame 3: crescent fading and thinning, small leaf sparks drifting off it (still attached to or very close to the arc).
Row 2 - "up": the same crescent rotated to sweep ABOVE (opening downward), about 220 px wide and 280 px tall. Same 3 phases.
Row 3 - "down": the same crescent rotated to sweep BELOW (opening upward), about 220 px wide and 280 px tall. Same 3 phases.
Output: one PNG, 1536 x 1024 px, transparent background, 3 rows of 3 frames.

3) NOUVEAU LOGO : `assets/_codex_src/titre_logo.png` (1536 x 1024, fond transparent), à REFAIRE ENTIÈREMENT
   - L'utilisateur trouve l'actuel « trop IA » : trop de lueurs, de dégoulinures, de champignons et de détails partout.
   - Le nouveau doit ressembler à un vrai logo dessiné à la main pour un jeu indé en pixel art : lisible, sobre, peu de couleurs.
   - Garde l'ancien fichier sous `assets/_codex_src/titre_logo_ancien.png` avant de l'écraser.
   - Puis `python tools/import_codex_assets.py --only titre_logo --force`.

Prompt :
A title LOGO for an indie 2D pixel-art game called "Legend of Agarica". It must look HAND-MADE by a pixel artist, NOT like generic AI fantasy art: crisp, deliberate pixel lettering on a visible pixel grid (as if drawn at about 320 px wide and scaled up x4 with nearest-neighbour, so every pixel is a sharp square), a LIMITED palette of about 10 colours (deep violet night #2a1f45 and #15101f for outlines/shadows, moonlit green #7fd8a6 and #3f8a5a, warm cream #ffe9d0 for the main letters, a single rose-pink accent #ff9fc9), flat colours with at most 2 shading tones per colour, NO soft gradients, NO glow, NO bloom, NO lens flare, NO dripping slime, NO glowing mushrooms, NO photorealistic texture, NO clutter.
Layout: the word "AGARICA" big and bold in clean custom pixel capitals (slightly organic serifs like carved wood, cream letters with a dark violet outline and a one-pixel green inner highlight), with "Legend of" small above it in a simpler pixel script. A small, elegant emblem integrated with the lettering: a thin crescent moon and a single rose with a few thorny stems curling around one letter (a nod to Agarica's rose-and-thorn tattoo). Optionally two or three small leaves. No character portrait, no background, no frame.
Text must be spelled exactly: "Legend of" and "AGARICA". Centered, transparent background, generous empty margin around the logo.
Output: one PNG, 1536 x 1024 px, transparent background.

À la fin, mets à jour `docs/production/RAPPORT_CODEX.md` et lance un `python tools/import_codex_assets.py` final.
```
