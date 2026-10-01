# Sprites à générer avec Codex — démo « Legend of Agarica »

Document de production : **un prompt = une image**. Chaque prompt (en anglais, dans un bloc de code) est autonome : il contient déjà le bloc de style commun et la fiche du personnage. Il suffit de le copier-coller dans Codex, puis d'enregistrer l'image au **chemin exact** indiqué juste au-dessus du prompt.

Données synchronisées : les tables de rangées ci-dessous et `src/data/asset_manifest.js` sont générées à partir de la même source — les numéros de rangée, noms d'animation et nombres de frames sont identiques. Les développeurs utilisent déjà ces IDs.

## Mode d'emploi

1. Générer les images dans l'ordre de priorité : **P1** (indispensable pour que l'histoire se lise), puis **P2** (important), puis **P3** (finition).
2. Pour les personnages : joindre à Codex une image de référence existante quand elle est indiquée (`assets/sprites/agarica_frames/agarica_row0_0.png`, `assets/sprites/xara_frames/xara_walk_0.png`, `assets/bosses_sprites/9a183398-c678-4590-ab59-155c7205e9c6.png`, `assets/sprites/loup_frames/loup_row0_0.png`, `assets/sprites/crapaud_frames/crapaud_row0_0.png`, `assets/items/totems.png`, `assets/items/form_icone/loup.png`, `assets/decors/déco item/bosquet/bosquet componant.png`, `assets/decors/floor.png`). Garder la même conversation Codex pour toutes les feuilles d'un même personnage.
3. Enregistrer chaque image au chemin indiqué :
   - feuilles d'animation de personnages/ennemis → `assets/sprites/<id>.png` (+ `<id>_p2.png`, `_p3.png`… quand l'animation est répartie sur plusieurs images) ;
   - feuilles d'effets → `assets/vfx/<id>.png` ;
   - **tout le reste** (objets, UI, icônes, portraits, fonds, totem, tilesets) → `assets/_codex_src/<nom>.png` : le script produit lui-même les fichiers finaux (rognage, redimensionnement, découpe des planches) ;
   - planches de décor → `assets/decors/déco item/<section>/<section>_planche.png` (découpe semi-manuelle, voir la section Décors).
4. Lancer `python tools/import_codex_assets.py` (option `--force` pour tout redécouper, `--only <id>` pour un seul asset). Le script :
   - retire automatiquement un fond noir (via `tools/dechroma.py`) ou uni (blanc/gris/damier) si l'image n'est pas transparente ;
   - découpe les feuilles en `<dir>/<prefix>_row<r>_<c>.png` (canvas uniforme, aligné bas-centre, comme `split_spritesheet.py`), en fusionnant les rangées réparties sur plusieurs images ;
   - vérifie que le nombre de rangées et de frames par rangée correspond au manifeste et affiche un **AVERTISSEMENT** sinon ;
   - affiche le rapport : découpés / déjà présents / manquants.
5. Si une feuille déclenche un avertissement (frames qui se touchent, rangée manquante) : régénérer l'image (souvent plus rapide que retoucher) en insistant sur les espacements, puis relancer avec `--only <id> --force`.

### Règles d'or (déjà incluses dans chaque prompt)

- Fond **transparent** (PNG alpha). Un fond noir pur est toléré (retiré automatiquement) ; jamais de décor.
- **Une rangée = une animation**, frames de gauche à droite, régulièrement espacées.
- Les frames **ne se touchent jamais** (≥ 40 px de vide) et une **large bande vide** (≥ 60 px) sépare les rangées.
- **Une seule silhouette connexe par frame** : objet tenu collé à la main, pas d'étincelles, poussière, traits de vitesse ou ombre au sol détachés. Les effets vont dans les feuilles `vfx_*` (où les particules sont autorisées car découpées par grille).
- **Aucun texte** (seul le logo titre en contient).
- **Orientation : DROITE** pour toutes les nouvelles feuilles (le code retourne avec `flipX`). ⚠ `agarica_extra` regarde à DROITE alors que les anciennes feuilles d'Agarica (idle/course) regardent à GAUCHE.
- Même taille de personnage d'une image à l'autre (hauteur en px indiquée dans chaque prompt) : c'est ce qui garantit une échelle en jeu cohérente.

### Tailles et échelles

- Feuilles personnages : 1536x1024, **3 rangées max** par image, **5 frames max** par rangée. Boss : 2 rangées par image (bandes de 512 px). Ghil't : 3 frames par rangée (cellules de 512 px).
- Écran 960x540, tuile 64 px. Agarica ≈ 86 px de haut. Tous les humanoïdes sont dessinés à la même échelle source (Agarica ~250 px, adultes 270-300 px, Galter 215 px) et affichés à `0.34`.
- Boss ≈ 2,5-3x la hauteur d'Agarica : Kainati ~400 px source à `0.54` (~215 px), Ghil't ~330 px source à `0.72` (~238 px).
- Objets ~24-48 px à l'écran : normalisés à 256 px de côté max par le script, échelle `0.16`.
- Les échelles exactes de chaque asset sont dans `src/data/asset_manifest.js` (`scale`).

## Bloc style commun (à mettre en tête de tout prompt — déjà inclus ci-dessous)

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).
```

Règles de mise en page (feuilles de personnages ; les valeurs entre accolades sont remplies dans chaque prompt) :

```text
SPRITE SHEET LAYOUT RULES: canvas {W} x {H} px, fully transparent background. Exactly {R} horizontal row(s); each row is ONE animation, read left to right. Frames are laid out on an invisible regular grid: each row is a horizontal band about {band} px tall, each frame cell is about {cell} px wide, and each pose is centered horizontally in its cell with the feet (or lowest point) on the same baseline within a row. Leave at least 40 px of empty transparent space between neighboring frames and at least 60 px of empty transparent space between rows: no part of a frame (hair, tail, cape, weapon, trunk, legs) may touch or overlap another frame or reach into another row. Every frame is ONE single connected silhouette: held objects must touch the hand; NO detached particles, sparkles, sweat drops, dust clouds, motion lines, speed lines, impact stars, sound effects or floating debris; NO cast shadow on the ground; NO ground line. Same character, same scale, same proportions and same colors in every frame and every row. {size_rule} The character faces RIGHT in every frame. No text, no numbers, no labels, no grid lines, no borders.
```

## Fiches identité (cohérence entre les feuilles)

**Agarica**

```text
AGARICA (the heroine): a petite teenage female druid, chibi proportions (about 2.5 to 3 heads tall), pointed elf ears, big green eyes, short messy bright red hair, dark-green hooded cape embroidered with leaf and vine patterns and closed by a round silver clasp at the collar, sleeveless beige tunic, brown belt with a gold buckle, dark grey trousers, brown leather boots, black fingerless mittens, a pink-red spiral tattoo on her bare upper arm, a small silver dagger sheathed on her belt. Soft anime cel-shaded chibi look, same design as the existing game sprite.
```

**Agarica — forme singe**

```text
AGARICA'S MONKEY FORM: a small agile capuchin-like monkey that is clearly Agarica transformed: reddish-orange fur matching her bright red messy hair (a messy tuft on top of the head), cream-beige face, muzzle and chest, big green eyes, slightly pointed ears, a long curling prehensile tail, a short dark-green leafy mane of fur over the shoulders like a little hood, fastened by the same round silver clasp, a pink-red spiral marking on one upper arm. About the size of a cat. Clean anime cel-shaded chibi look, consistent with Agarica's other animal forms.
```

**Xara**

```text
XARA (spider companion): a fluffy cute-but-slightly-uncanny spider, dark plum fur with pink-magenta stripes and magenta diamond (lozenge) markings on the round abdomen, two big glossy green main eyes plus small secondary eyes, small pink fangs, eight furry dark plum legs with magenta joints. Same design as the existing game sprite.
```

**Amanite**

```text
AMANITE (Agarica's best friend, a tiefling): young woman the same age as Agarica, chibi proportions, slightly taller (about 1.1x Agarica), bright crimson-red skin, two long glossy black horns sweeping back from her forehead, very long straight sleek black hair down to her waist with a blunt fringe, golden-amber eyes, a thin red tail with a spade tip, dark purple sleeveless wrap top, black leather bracers, burgundy sash, short dark-brown skirt over black leggings, wrapped leather boots. A wooden spear with a leaf-shaped black obsidian blade is strapped diagonally on her back when not in her hands. Proud, impulsive, intense expression.
```

**Le père (chef du bosquet)**

```text
THE CHIEF OF THE EMERALD GROVE (Agarica's father): an elderly male druid, chibi but taller than Agarica (about 1.2x her height), long white beard braided with small wooden beads, greying red hair (family resemblance), pointed elf ears, kind but stern green eyes, long deep-green robe with gold leaf embroidery, brown fur mantle on the shoulders, a circlet of small antlers and leaves on his head, a gnarled wooden staff topped with a green crystal wrapped in leaves (the crystal glows softly but no detached light rays).
```

**Galter**

```text
GALTER (halfling ranger) - ORIGINAL design, must NOT resemble Geralt of Rivia (NO white hair, NO witcher medallion, NO sword on the back, NO eye scar, NO yellow cat eyes): a short stocky middle-aged halfling (about 0.85x Agarica's height), tired hunter look with heavy-lidded brown eyes and bags under them, round face, round nose, small round non-pointed ears, messy curly chestnut-brown hair in a short stubby ponytail, short scruffy auburn beard, dark blue-black geometric tribal zigzag tattoos on both cheeks and forearms, patched moss-green hooded tunic, brown leather vest covered with pouches, a satchel stuffed with rolled map scrolls, a short wooden bow and a quiver on his back, bare big hairy halfling feet. Slightly comic, clumsy-but-proud attitude.
```

**Clak**

```text
CLAK (Galter's totem crab): a small crab with an orange-red shell carved with a pale tribal spiral rune that glows faint teal, one oversized right claw and one small left claw, stalk eyes with green pupils, comically expressive, sturdy little legs.
```

**Morgat**

```text
MORGAT (the butterfly healer): an elderly gentle healer woman, chibi proportions (about 1.1x Agarica's height), slightly hunched, warm tan skin, wild silver hair gathered in a big bun pierced with wooden pins, a headband with two feathery moth antennae, a shawl shaped like folded butterfly wings with teal, orange and violet patterns, layered earthy-brown skirts, a belt of little herb pouches and glass vials, two or three small glowing cyan butterflies perched directly ON her shawl and hair (touching her, never floating free).
```

**Kainati**

```text
KAINATI, KING OF THE SIMIANS (corrupted boss) - must match the existing reference art exactly: a huge gorilla-like ape king, thick shaggy pure-white fur with black outlines, dark grey skin on face, chest, hands and feet, glowing green eyes, angry heavy brow, red tribal paint stripes on his cheek, a tall carved Maya-like stone crown/headdress made of grey-beige stone blocks with spiral glyphs, thick brown vine bracelets wrapped around wrists and ankles, patches of glowing toxic-green moss stuck in his fur and on his crown, dripping like slime with tiny sparkle highlights. Knuckle-walking stance. Clearly pixel-art style like the game's bear and toad.
```

**Kainati — esprit**

```text
KAINATI'S ANCESTRAL SPIRIT: the same giant ape king silhouette and stone crown as Kainati but ethereal and pure: fur made of luminous pale cyan and mint-green light with soft white highlights, darker teal outline (still a solid thick outline), calm glowing white-gold eyes, the stone crown faintly glowing with cyan runes, NO moss, NO corruption, a few leaf shapes drifting INSIDE the silhouette. Body opaque enough to read clearly (not see-through).
```

**Ghil't**

```text
GHIL'T, THE SCOURGE OF THE FOREST (corrupted boss): a giant corrupted tapir guardian, massive barrel-shaped body, short thick legs with three-toed hooves, a huge long prehensile trunk-snout drooping down and dripping thick glowing toxic-green moss slime (drips stay attached to the snout), small mean glowing green eyes, dark slate-blue and charcoal hide with faint pale ancient rune patterns (a big spiral rune on the flank), the whole back covered by a thick carpet of glowing toxic moss with twisted roots and small sickly fungi growing out of the spine, cracked bark-like plates on the shoulders. Pixel-art style like Kainati and the bear.
```

**Ghil't guéri**

```text
GHIL'T HEALED (the forest guardian restored): the same giant tapir silhouette as Ghil't but clean and noble: dusky blue-grey hide with a white saddle marking like a Malayan tapir, the ancient spiral runes glowing soft cyan, young green leaves, moss-free grass tufts and small white flowers growing on its back, gentle golden eyes, trunk relaxed and clean. Peaceful and majestic.
```

**Habitants**

```text
EMERALD GROVE VILLAGER: a wood-elf druid commoner, chibi proportions (about 1.1x Agarica's height), pointed ears, simple green and brown linen tunic with leaf trims, rolled sleeves, brown apron or sash, leather boots, friendly but tired face. The grove's emblem is a white tree on a green banner.
```

**Garde**

```text
EMERALD GROVE GUARD: a wood-elf guard, chibi proportions (about 1.15x Agarica's height), bark-and-leather armor, green tabard with a white tree emblem, a leaf-shaped helmet, a wooden spear with a leaf-shaped steel blade, a round wooden shield strapped on the back.
```

**Papillon**

```text
GLOWING BUTTERFLY: a small magical butterfly, wings luminous cyan fading to pale green with violet edges and tiny white dots, dark violet body, thin antennae, soft glow drawn as a solid light rim on the wings (no detached halo).
```

**Loup sanguinaire**

```text
BLOOD-CRAZED WOLF (enemy): same build and pixel-art style as the game's grey-violet wolf, but fur dark maroon fading to black, matted and spiky, raised hackles, glowing toxic-green moss patches stuck on its back and shoulders dripping like slime, glowing red eyes with a green rim, bared white fangs, lean and feral.
```

**Araignée**

```text
HOSTILE FOREST SPIDER (enemy): same chibi spider design family as Xara but clearly hostile: dark charcoal-violet chitin with short bristly fur, sharp angular legs, toxic-green glowing stripe markings, six small glowing red eyes, green-moss slime dripping from its abdomen, sharp fangs.
```

**Créature de mousse**

```text
MOSS CREATURE (enemy): a small blob of living toxic moss the size of a cat, lumpy body of glowing toxic-green moss with a darker green core, two glowing yellow-green eyes, a wide jagged mouth, slime drips attached to its body, little stubby root tendrils as legs.
```

**Crapaud corrompu**

```text
CORRUPTED TOAD (enemy): the same big warty toad as the game's existing orange toad (same pose, same proportions, golden eye) but corrupted: skin turned sickly olive-brown and violet, warts replaced by glowing toxic-green moss pustules, moss slime dripping from its back, eye glowing toxic green, tongue toxic green-violet.
```

**Singe corrompu**

```text
CORRUPTED MONKEY MINION (enemy): a small skinny monkey of Kainati's tribe, dark violet-grey fur, patches of glowing toxic-green moss dripping from its shoulders and tail, glowing green eyes, angry grin with small fangs, long tail.
```

**Bébé cochon**

```text
BABY PIGLET: a cute round baby forest piglet (wild boar piglet), soft pink-brown fur with cream horizontal stripes on its back like a wild boar baby, tiny curly tail, big dark shiny eyes, little snout.
```

**Poisson**

```text
FOREST FISH: a small healthy freshwater fish, silvery-teal body with soft violet fins, a few glowing cyan spots along its side, big round eye; drawn in profile, swimming to the RIGHT.
```

## P1 — indispensable pour que l'histoire se lise

### [P1] `agarica_extra` — Agarica - animations narratives et de plateforme manquantes

- **Image(s) à produire** : `assets/sprites/agarica_extra.png` (1536x1024), `assets/sprites/agarica_extra_p2.png` (1536x1024), `assets/sprites/agarica_extra_p3.png` (1536x1024), `assets/sprites/agarica_extra_p4.png` (1536x1024)
- **Découpe** : `assets/sprites/agarica_extra_frames/agarica_extra_row<r>_<c>.png` (auto, `tools/import_codex_assets.py`, mode `blob`)
- **Orientation** : regarde à DROITE — **hauteur source** : ~250 px — **échelle en jeu** : `0.34` (≈ 85 px à l'écran)
- **Notes** : Agarica regarde à DROITE dans cette nouvelle feuille (les anciennes feuilles idle/course la montrent à gauche) : le code doit faire `setFlipX` en conséquence. 4 images (3 rangées max par image pour garder une bonne résolution). La liane n'est PAS dessinée (asset `liane` séparé) : les mains se referment sur le vide.
- **Anims (manifest)** : `jump_rise` (row 0, 3 fr.), `jump_fall` (row 1, 3 fr.), `hurt` (row 2, 3 fr.), `death` (row 3, 4 fr.), `talk` (row 4, 4 fr.), `sad` (row 5, 4 fr.), `liane_hang` (row 6, 3 fr.), `liane_swing` (row 7, 4 fr.), `cast` (row 8, 5 fr.), `receive_item` (row 9, 4 fr.)

| Rangée (manifest) | Image | Animation | Frames | fps | Poses (gauche → droite) |
|---|---|---|---|---|---|
| 0 | agarica_extra.png (rangée image 1) | `jump_rise` (montée du saut) | 3 | 10 | 1. take-off: knees bent, arms swinging up, cape lifting / 2. rising: body stretched upward, one knee raised, arms up, cape trailing down / 3. apex: compact tuck, knees up, cape billowing |
| 1 | agarica_extra.png (rangée image 2) | `jump_fall` (chute (boucle)) | 3 | 10 boucle | 1. falling: legs extended down, arms out for balance, cape and hair blown upward / 2. same with cape flapping differently / 3. same, legs slightly apart, bracing for landing |
| 2 | agarica_extra.png (rangée image 3) | `hurt` (touchée) | 3 | 12 | 1. hit recoil: torso bent back, eyes squeezed shut, arms flinching / 2. stumbling backward, one foot off the ground, pained face / 3. recovering crouch, hand on the arm, determined face |
| 3 | agarica_extra_p2.png (rangée image 1) | `death` (chute / KO (finit couchée)) | 4 | 8 | 1. staggering, knees buckling, head drooping / 2. falling to her knees, arms limp / 3. collapsing forward onto her side / 4. lying on her side on the ground, eyes closed, cape spread over her (final pose) |
| 4 | agarica_extra_p2.png (rangée image 2) | `talk` (parle (boucle)) | 4 | 8 boucle | 1. standing, mouth open, one hand gesturing at chest height / 2. mouth closed, hand slightly lower / 3. mouth open, both hands open palms up / 4. mouth half open, hand on her hip |
| 5 | agarica_extra_p2.png (rangée image 3) | `sad` (assise, désespoir (boucle lente)) | 4 | 5 boucle | 1. sitting on the ground hugging her knees, head down on her arms, hood up, shoulders slumped / 2. same pose, shoulders slightly raised (sob/breath in) / 3. same pose, head lifted a little, sad teary eyes looking down / 4. same pose, head back down |
| 6 | agarica_extra_p3.png (rangée image 1) | `liane_hang` (suspendue à une liane (boucle)) | 3 | 6 boucle | 1. hanging from both raised hands gripping an INVISIBLE vertical rope above her head (do not draw the rope), legs dangling / 2. same, legs swaying slightly forward / 3. same, legs swaying slightly backward |
| 7 | agarica_extra_p3.png (rangée image 2) | `liane_swing` (balancement sur liane (boucle)) | 4 | 8 boucle | 1. swing back: body angled 30 degrees with feet toward the left, both hands up together, cape trailing right / 2. bottom of the arc: body vertical, legs tucked, hands up together / 3. swing forward: body angled 30 degrees with feet toward the right, legs extended forward / 4. returning: body vertical, legs trailing back, hands up together |
| 8 | agarica_extra_p3.png (rangée image 3) | `cast` (lance un soin (mains levées)) | 5 | 10 | 1. standing, both hands brought together in front of her chest, eyes closing / 2. hands rising, palms open, faint green glow drawn ON her palms / 3. both arms raised high, palms up, cape lifting, eyes closed, serene / 4. same, glow on palms brighter (glow stays on the hands, attached) / 5. arms lowering, eyes opening, gentle smile |
| 9 | agarica_extra_p4.png (rangée image 1) | `receive_item` (reçoit un objet) | 4 | 8 | 1. standing, reaching both hands forward, curious face / 2. hands cupped together at chest height, looking down at them (hands empty: the object is drawn by the game) / 3. raising the cupped hands up above her head, amazed face / 4. holding the cupped hands at chest height, happy determined smile |

**Prompt → `assets/sprites/agarica_extra.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

CHARACTER: AGARICA (the heroine): a petite teenage female druid, chibi proportions (about 2.5 to 3 heads tall), pointed elf ears, big green eyes, short messy bright red hair, dark-green hooded cape embroidered with leaf and vine patterns and closed by a round silver clasp at the collar, sleeveless beige tunic, brown belt with a gold buckle, dark grey trousers, brown leather boots, black fingerless mittens, a pink-red spiral tattoo on her bare upper arm, a small silver dagger sheathed on her belt. Soft anime cel-shaded chibi look, same design as the existing game sprite.

SPRITE SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background. Exactly 3 horizontal row(s); each row is ONE animation, read left to right. Frames are laid out on an invisible regular grid: each row is a horizontal band about 341 px tall, each frame cell is about 512 px wide, and each pose is centered horizontally in its cell with the feet (or lowest point) on the same baseline within a row. Leave at least 40 px of empty transparent space between neighboring frames and at least 60 px of empty transparent space between rows: no part of a frame (hair, tail, cape, weapon, trunk, legs) may touch or overlap another frame or reach into another row. Every frame is ONE single connected silhouette: held objects must touch the hand; NO detached particles, sparkles, sweat drops, dust clouds, motion lines, speed lines, impact stars, sound effects or floating debris; NO cast shadow on the ground; NO ground line. Same character, same scale, same proportions and same colors in every frame and every row. Agarica's standing height (boots to top of hair) is about 250 px in every frame where she stands. The character faces RIGHT in every frame. No text, no numbers, no labels, no grid lines, no borders.

ROWS:
Row 1 (from top) - animation "jump_rise", exactly 3 frame(s). Frame 1: take-off: knees bent, arms swinging up, cape lifting. Frame 2: rising: body stretched upward, one knee raised, arms up, cape trailing down. Frame 3: apex: compact tuck, knees up, cape billowing.
Row 2 (from top) - animation "jump_fall", exactly 3 frame(s). Frame 1: falling: legs extended down, arms out for balance, cape and hair blown upward. Frame 2: same with cape flapping differently. Frame 3: same, legs slightly apart, bracing for landing.
Row 3 (from top) - animation "hurt", exactly 3 frame(s). Frame 1: hit recoil: torso bent back, eyes squeezed shut, arms flinching. Frame 2: stumbling backward, one foot off the ground, pained face. Frame 3: recovering crouch, hand on the arm, determined face.

Output: one PNG image, 1536 x 1024 px, transparent background, exactly 3 row(s), 3 / 3 / 3 frames per row.
```

**Prompt → `assets/sprites/agarica_extra_p2.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

CHARACTER: AGARICA (the heroine): a petite teenage female druid, chibi proportions (about 2.5 to 3 heads tall), pointed elf ears, big green eyes, short messy bright red hair, dark-green hooded cape embroidered with leaf and vine patterns and closed by a round silver clasp at the collar, sleeveless beige tunic, brown belt with a gold buckle, dark grey trousers, brown leather boots, black fingerless mittens, a pink-red spiral tattoo on her bare upper arm, a small silver dagger sheathed on her belt. Soft anime cel-shaded chibi look, same design as the existing game sprite.

SPRITE SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background. Exactly 3 horizontal row(s); each row is ONE animation, read left to right. Frames are laid out on an invisible regular grid: each row is a horizontal band about 341 px tall, each frame cell is about 384 px wide, and each pose is centered horizontally in its cell with the feet (or lowest point) on the same baseline within a row. Leave at least 40 px of empty transparent space between neighboring frames and at least 60 px of empty transparent space between rows: no part of a frame (hair, tail, cape, weapon, trunk, legs) may touch or overlap another frame or reach into another row. Every frame is ONE single connected silhouette: held objects must touch the hand; NO detached particles, sparkles, sweat drops, dust clouds, motion lines, speed lines, impact stars, sound effects or floating debris; NO cast shadow on the ground; NO ground line. Same character, same scale, same proportions and same colors in every frame and every row. Agarica's standing height (boots to top of hair) is about 250 px in every frame where she stands. The character faces RIGHT in every frame. No text, no numbers, no labels, no grid lines, no borders.

ROWS:
Row 1 (from top) - animation "death", exactly 4 frame(s). Frame 1: staggering, knees buckling, head drooping. Frame 2: falling to her knees, arms limp. Frame 3: collapsing forward onto her side. Frame 4: lying on her side on the ground, eyes closed, cape spread over her (final pose).
Row 2 (from top) - animation "talk", exactly 4 frame(s). Frame 1: standing, mouth open, one hand gesturing at chest height. Frame 2: mouth closed, hand slightly lower. Frame 3: mouth open, both hands open palms up. Frame 4: mouth half open, hand on her hip.
Row 3 (from top) - animation "sad", exactly 4 frame(s). Frame 1: sitting on the ground hugging her knees, head down on her arms, hood up, shoulders slumped. Frame 2: same pose, shoulders slightly raised (sob/breath in). Frame 3: same pose, head lifted a little, sad teary eyes looking down. Frame 4: same pose, head back down.

Output: one PNG image, 1536 x 1024 px, transparent background, exactly 3 row(s), 4 / 4 / 4 frames per row.
```

**Prompt → `assets/sprites/agarica_extra_p3.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

CHARACTER: AGARICA (the heroine): a petite teenage female druid, chibi proportions (about 2.5 to 3 heads tall), pointed elf ears, big green eyes, short messy bright red hair, dark-green hooded cape embroidered with leaf and vine patterns and closed by a round silver clasp at the collar, sleeveless beige tunic, brown belt with a gold buckle, dark grey trousers, brown leather boots, black fingerless mittens, a pink-red spiral tattoo on her bare upper arm, a small silver dagger sheathed on her belt. Soft anime cel-shaded chibi look, same design as the existing game sprite.

SPRITE SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background. Exactly 3 horizontal row(s); each row is ONE animation, read left to right. Frames are laid out on an invisible regular grid: each row is a horizontal band about 341 px tall, each frame cell is about 307 px wide, and each pose is centered horizontally in its cell with the feet (or lowest point) on the same baseline within a row. Leave at least 40 px of empty transparent space between neighboring frames and at least 60 px of empty transparent space between rows: no part of a frame (hair, tail, cape, weapon, trunk, legs) may touch or overlap another frame or reach into another row. Every frame is ONE single connected silhouette: held objects must touch the hand; NO detached particles, sparkles, sweat drops, dust clouds, motion lines, speed lines, impact stars, sound effects or floating debris; NO cast shadow on the ground; NO ground line. Same character, same scale, same proportions and same colors in every frame and every row. Agarica's standing height (boots to top of hair) is about 250 px in every frame where she stands. The character faces RIGHT in every frame. No text, no numbers, no labels, no grid lines, no borders. Rows with fewer frames use wider cells (row width divided by that row's frame count).

ROWS:
Row 1 (from top) - animation "liane_hang", exactly 3 frame(s). Frame 1: hanging from both raised hands gripping an INVISIBLE vertical rope above her head (do not draw the rope), legs dangling. Frame 2: same, legs swaying slightly forward. Frame 3: same, legs swaying slightly backward.
Row 2 (from top) - animation "liane_swing", exactly 4 frame(s). Frame 1: swing back: body angled 30 degrees with feet toward the left, both hands up together, cape trailing right. Frame 2: bottom of the arc: body vertical, legs tucked, hands up together. Frame 3: swing forward: body angled 30 degrees with feet toward the right, legs extended forward. Frame 4: returning: body vertical, legs trailing back, hands up together.
Row 3 (from top) - animation "cast", exactly 5 frame(s). Frame 1: standing, both hands brought together in front of her chest, eyes closing. Frame 2: hands rising, palms open, faint green glow drawn ON her palms. Frame 3: both arms raised high, palms up, cape lifting, eyes closed, serene. Frame 4: same, glow on palms brighter (glow stays on the hands, attached). Frame 5: arms lowering, eyes opening, gentle smile.

Output: one PNG image, 1536 x 1024 px, transparent background, exactly 3 row(s), 3 / 4 / 5 frames per row.
```

**Prompt → `assets/sprites/agarica_extra_p4.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

CHARACTER: AGARICA (the heroine): a petite teenage female druid, chibi proportions (about 2.5 to 3 heads tall), pointed elf ears, big green eyes, short messy bright red hair, dark-green hooded cape embroidered with leaf and vine patterns and closed by a round silver clasp at the collar, sleeveless beige tunic, brown belt with a gold buckle, dark grey trousers, brown leather boots, black fingerless mittens, a pink-red spiral tattoo on her bare upper arm, a small silver dagger sheathed on her belt. Soft anime cel-shaded chibi look, same design as the existing game sprite.

SPRITE SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background. Exactly 1 horizontal row(s); each row is ONE animation, read left to right. Frames are laid out on an invisible regular grid: each row is a horizontal band about 1024 px tall, each frame cell is about 384 px wide, and each pose is centered horizontally in its cell with the feet (or lowest point) on the same baseline within a row. Leave at least 40 px of empty transparent space between neighboring frames and at least 60 px of empty transparent space between rows: no part of a frame (hair, tail, cape, weapon, trunk, legs) may touch or overlap another frame or reach into another row. Every frame is ONE single connected silhouette: held objects must touch the hand; NO detached particles, sparkles, sweat drops, dust clouds, motion lines, speed lines, impact stars, sound effects or floating debris; NO cast shadow on the ground; NO ground line. Same character, same scale, same proportions and same colors in every frame and every row. Agarica's standing height (boots to top of hair) is about 250 px in every frame where she stands. The character faces RIGHT in every frame. No text, no numbers, no labels, no grid lines, no borders. The single row is vertically centered on the canvas.

ROWS:
Row 1 (from top) - animation "receive_item", exactly 4 frame(s). Frame 1: standing, reaching both hands forward, curious face. Frame 2: hands cupped together at chest height, looking down at them (hands empty: the object is drawn by the game). Frame 3: raising the cupped hands up above her head, amazed face. Frame 4: holding the cupped hands at chest height, happy determined smile.

Output: one PNG image, 1536 x 1024 px, transparent background, exactly 1 row(s), 4 frames per row.
```

### [P1] `singe` — Forme du singe (Agarica transformée)

- **Image(s) à produire** : `assets/sprites/singe.png` (1536x1024), `assets/sprites/singe_p2.png` (1536x1024)
- **Découpe** : `assets/sprites/singe_frames/singe_row<r>_<c>.png` (auto, `tools/import_codex_assets.py`, mode `blob`)
- **Orientation** : regarde à DROITE — **hauteur source** : ~180 px — **échelle en jeu** : `0.34` (≈ 61 px à l'écran)
- **Notes** : Forme aérienne (remplace le double saut). Même échelle que Agarica (0.34) pour que la transformation ne saute pas.
- **Anims (manifest)** : `jump` (row 0, 4 fr.), `liane_hang` (row 1, 3 fr.), `liane_swing` (row 2, 4 fr.), `release_flip` (row 3, 5 fr.), `idle` (row 4, 4 fr.), `run` (row 5, 5 fr.)

| Rangée (manifest) | Image | Animation | Frames | fps | Poses (gauche → droite) |
|---|---|---|---|---|---|
| 0 | singe.png (rangée image 1) | `jump` (saut) | 4 | 12 | 1. crouched on all fours, ready to leap, tail curled / 2. pushing off, body stretched diagonally upward, arms reaching forward / 3. mid-air, body arched, arms and legs spread, tail curling behind / 4. starting to fall, limbs tucked under, tail up |
| 1 | singe.png (rangée image 2) | `liane_hang` (suspendu à une liane (boucle)) | 3 | 6 boucle | 1. hanging from ONE raised hand gripping an INVISIBLE rope above (do not draw it), other arm loose, tail curled up / 2. same, body rotating slightly, legs swaying forward / 3. same, legs swaying backward, tail swinging |
| 2 | singe.png (rangée image 3) | `liane_swing` (balancement (boucle)) | 4 | 10 boucle | 1. swing back: body angled with feet to the left, both hands up together / 2. bottom of arc: body vertical, legs tucked, tail streaming / 3. swing forward: body angled with feet to the right, legs extended forward / 4. returning: body vertical, legs trailing back |
| 3 | singe_p2.png (rangée image 1) | `release_flip` (lâcher + salto) | 5 | 14 | 1. letting go: arms flung up, body launched forward / 2. beginning a forward somersault, body curled into a ball, head down / 3. upside down at the top of the flip, tucked / 4. coming out of the flip, legs extending forward / 5. landing-ready pose, arms out, tail up for balance |
| 4 | singe_p2.png (rangée image 2) | `idle` (repos au sol (boucle)) | 4 | 6 boucle | 1. sitting on haunches on all fours, alert, tail curled / 2. same, head tilted, ear twitch / 3. same, scratching cheek with one hand / 4. same, tail swishing |
| 5 | singe_p2.png (rangée image 3) | `run` (course au sol (boucle)) | 5 | 12 boucle | 1. galloping on all fours, front hands reaching forward / 2. front hands planted, back legs swinging forward / 3. gathered, all four limbs under the body / 4. back legs pushing off, body stretched / 5. airborne stretch, tail streaming back |

**Prompt → `assets/sprites/singe.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

CHARACTER: AGARICA'S MONKEY FORM: a small agile capuchin-like monkey that is clearly Agarica transformed: reddish-orange fur matching her bright red messy hair (a messy tuft on top of the head), cream-beige face, muzzle and chest, big green eyes, slightly pointed ears, a long curling prehensile tail, a short dark-green leafy mane of fur over the shoulders like a little hood, fastened by the same round silver clasp, a pink-red spiral marking on one upper arm. About the size of a cat. Clean anime cel-shaded chibi look, consistent with Agarica's other animal forms.

SPRITE SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background. Exactly 3 horizontal row(s); each row is ONE animation, read left to right. Frames are laid out on an invisible regular grid: each row is a horizontal band about 341 px tall, each frame cell is about 384 px wide, and each pose is centered horizontally in its cell with the feet (or lowest point) on the same baseline within a row. Leave at least 40 px of empty transparent space between neighboring frames and at least 60 px of empty transparent space between rows: no part of a frame (hair, tail, cape, weapon, trunk, legs) may touch or overlap another frame or reach into another row. Every frame is ONE single connected silhouette: held objects must touch the hand; NO detached particles, sparkles, sweat drops, dust clouds, motion lines, speed lines, impact stars, sound effects or floating debris; NO cast shadow on the ground; NO ground line. Same character, same scale, same proportions and same colors in every frame and every row. The monkey is about 180 px tall when crouched on all fours (about 260 px when hanging with arms up). The character faces RIGHT in every frame. No text, no numbers, no labels, no grid lines, no borders. Rows with fewer frames use wider cells (row width divided by that row's frame count).

ROWS:
Row 1 (from top) - animation "jump", exactly 4 frame(s). Frame 1: crouched on all fours, ready to leap, tail curled. Frame 2: pushing off, body stretched diagonally upward, arms reaching forward. Frame 3: mid-air, body arched, arms and legs spread, tail curling behind. Frame 4: starting to fall, limbs tucked under, tail up.
Row 2 (from top) - animation "liane_hang", exactly 3 frame(s). Frame 1: hanging from ONE raised hand gripping an INVISIBLE rope above (do not draw it), other arm loose, tail curled up. Frame 2: same, body rotating slightly, legs swaying forward. Frame 3: same, legs swaying backward, tail swinging.
Row 3 (from top) - animation "liane_swing", exactly 4 frame(s). Frame 1: swing back: body angled with feet to the left, both hands up together. Frame 2: bottom of arc: body vertical, legs tucked, tail streaming. Frame 3: swing forward: body angled with feet to the right, legs extended forward. Frame 4: returning: body vertical, legs trailing back.

Output: one PNG image, 1536 x 1024 px, transparent background, exactly 3 row(s), 4 / 3 / 4 frames per row.
```

**Prompt → `assets/sprites/singe_p2.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

CHARACTER: AGARICA'S MONKEY FORM: a small agile capuchin-like monkey that is clearly Agarica transformed: reddish-orange fur matching her bright red messy hair (a messy tuft on top of the head), cream-beige face, muzzle and chest, big green eyes, slightly pointed ears, a long curling prehensile tail, a short dark-green leafy mane of fur over the shoulders like a little hood, fastened by the same round silver clasp, a pink-red spiral marking on one upper arm. About the size of a cat. Clean anime cel-shaded chibi look, consistent with Agarica's other animal forms.

SPRITE SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background. Exactly 3 horizontal row(s); each row is ONE animation, read left to right. Frames are laid out on an invisible regular grid: each row is a horizontal band about 341 px tall, each frame cell is about 307 px wide, and each pose is centered horizontally in its cell with the feet (or lowest point) on the same baseline within a row. Leave at least 40 px of empty transparent space between neighboring frames and at least 60 px of empty transparent space between rows: no part of a frame (hair, tail, cape, weapon, trunk, legs) may touch or overlap another frame or reach into another row. Every frame is ONE single connected silhouette: held objects must touch the hand; NO detached particles, sparkles, sweat drops, dust clouds, motion lines, speed lines, impact stars, sound effects or floating debris; NO cast shadow on the ground; NO ground line. Same character, same scale, same proportions and same colors in every frame and every row. The monkey is about 180 px tall when crouched on all fours (about 260 px when hanging with arms up). The character faces RIGHT in every frame. No text, no numbers, no labels, no grid lines, no borders. Rows with fewer frames use wider cells (row width divided by that row's frame count).

ROWS:
Row 1 (from top) - animation "release_flip", exactly 5 frame(s). Frame 1: letting go: arms flung up, body launched forward. Frame 2: beginning a forward somersault, body curled into a ball, head down. Frame 3: upside down at the top of the flip, tucked. Frame 4: coming out of the flip, legs extending forward. Frame 5: landing-ready pose, arms out, tail up for balance.
Row 2 (from top) - animation "idle", exactly 4 frame(s). Frame 1: sitting on haunches on all fours, alert, tail curled. Frame 2: same, head tilted, ear twitch. Frame 3: same, scratching cheek with one hand. Frame 4: same, tail swishing.
Row 3 (from top) - animation "run", exactly 5 frame(s). Frame 1: galloping on all fours, front hands reaching forward. Frame 2: front hands planted, back legs swinging forward. Frame 3: gathered, all four limbs under the body. Frame 4: back legs pushing off, body stretched. Frame 5: airborne stretch, tail streaming back.

Output: one PNG image, 1536 x 1024 px, transparent background, exactly 3 row(s), 5 / 4 / 5 frames per row.
```

### [P1] `xara_extra` — Xara - parole, excitation, indice Maexxna

- **Image(s) à produire** : `assets/sprites/xara_extra.png` (1536x1024)
- **Découpe** : `assets/sprites/xara_extra_frames/xara_extra_row<r>_<c>.png` (auto, `tools/import_codex_assets.py`, mode `blob`)
- **Orientation** : regarde à DROITE — **hauteur source** : ~280 px — **échelle en jeu** : `0.17` (≈ 48 px à l'écran)
- **Notes** : Rangée `mysterious` : SEUL indice visuel de Maexxna, très discret (yeux qui virent à l'or-violet + ombre de couronne collée à la tête).
- **Anims (manifest)** : `talk` (row 0, 4 fr.), `excited` (row 1, 4 fr.), `mysterious` (row 2, 4 fr.)

| Rangée (manifest) | Image | Animation | Frames | fps | Poses (gauche → droite) |
|---|---|---|---|---|---|
| 0 | xara_extra.png (rangée image 1) | `talk` (parle (boucle)) | 4 | 8 boucle | 1. standing, front legs slightly raised, fangs/mouth open / 2. mouth closed, one front leg gesturing / 3. mouth open, head tilted, eyes smiling / 4. mouth closed, front legs down |
| 1 | xara_extra.png (rangée image 2) | `excited` (excitée, sautille (boucle)) | 4 | 10 boucle | 1. crouched low, eyes sparkling / 2. bouncing up, legs extended, two front legs waving / 3. highest point of the bounce, happy closed-eye smile / 4. landing, legs bent |
| 2 | xara_extra.png (rangée image 3) | `mysterious` (mystérieuse (indice Maexxna)) | 4 | 6 boucle | 1. standing still, eyes narrowed, the two main eyes turned glowing gold-violet / 2. same, a thin shadowy crown of spiky dark-violet silhouettes rising from the top of her head (attached to the head) / 3. same, crown shadow a bit taller, eyes brighter gold-violet / 4. crown shadow fading back down, eyes returning to green |

**Prompt → `assets/sprites/xara_extra.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

CHARACTER: XARA (spider companion): a fluffy cute-but-slightly-uncanny spider, dark plum fur with pink-magenta stripes and magenta diamond (lozenge) markings on the round abdomen, two big glossy green main eyes plus small secondary eyes, small pink fangs, eight furry dark plum legs with magenta joints. Same design as the existing game sprite.

SPRITE SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background. Exactly 3 horizontal row(s); each row is ONE animation, read left to right. Frames are laid out on an invisible regular grid: each row is a horizontal band about 341 px tall, each frame cell is about 384 px wide, and each pose is centered horizontally in its cell with the feet (or lowest point) on the same baseline within a row. Leave at least 40 px of empty transparent space between neighboring frames and at least 60 px of empty transparent space between rows: no part of a frame (hair, tail, cape, weapon, trunk, legs) may touch or overlap another frame or reach into another row. Every frame is ONE single connected silhouette: held objects must touch the hand; NO detached particles, sparkles, sweat drops, dust clouds, motion lines, speed lines, impact stars, sound effects or floating debris; NO cast shadow on the ground; NO ground line. Same character, same scale, same proportions and same colors in every frame and every row. Xara is about 280 px tall (top of abdomen to feet) and about 300 px long in every frame. The character faces RIGHT in every frame. No text, no numbers, no labels, no grid lines, no borders.

ROWS:
Row 1 (from top) - animation "talk", exactly 4 frame(s). Frame 1: standing, front legs slightly raised, fangs/mouth open. Frame 2: mouth closed, one front leg gesturing. Frame 3: mouth open, head tilted, eyes smiling. Frame 4: mouth closed, front legs down.
Row 2 (from top) - animation "excited", exactly 4 frame(s). Frame 1: crouched low, eyes sparkling. Frame 2: bouncing up, legs extended, two front legs waving. Frame 3: highest point of the bounce, happy closed-eye smile. Frame 4: landing, legs bent.
Row 3 (from top) - animation "mysterious", exactly 4 frame(s). Frame 1: standing still, eyes narrowed, the two main eyes turned glowing gold-violet. Frame 2: same, a thin shadowy crown of spiky dark-violet silhouettes rising from the top of her head (attached to the head). Frame 3: same, crown shadow a bit taller, eyes brighter gold-violet. Frame 4: crown shadow fading back down, eyes returning to green.

Output: one PNG image, 1536 x 1024 px, transparent background, exactly 3 row(s), 4 / 4 / 4 frames per row.
```

### [P1] `pere_chef` — Le père d'Agarica, chef du bosquet

- **Image(s) à produire** : `assets/sprites/pere_chef.png` (1536x1024)
- **Découpe** : `assets/sprites/pere_chef_frames/pere_chef_row<r>_<c>.png` (auto, `tools/import_codex_assets.py`, mode `blob`)
- **Orientation** : regarde à DROITE — **hauteur source** : ~300 px — **échelle en jeu** : `0.34` (≈ 102 px à l'écran)
- **Anims (manifest)** : `idle` (row 0, 4 fr.), `talk` (row 1, 4 fr.), `give_talisman` (row 2, 5 fr.)

| Rangée (manifest) | Image | Animation | Frames | fps | Poses (gauche → droite) |
|---|---|---|---|---|---|
| 0 | pere_chef.png (rangée image 1) | `idle` (repos (boucle)) | 4 | 5 boucle | 1. standing tall, both hands resting on the staff planted in front of him / 2. same, slight breath in, beard moving / 3. same, eyes closing slowly / 4. same, eyes open again |
| 1 | pere_chef.png (rangée image 2) | `talk` (parle (boucle)) | 4 | 8 boucle | 1. standing, left hand on staff, right hand open gesturing, mouth open / 2. mouth closed, hand lower / 3. mouth open, frowning, finger raised (stern) / 4. mouth half open, hand on heart (gentle) |
| 2 | pere_chef.png (rangée image 3) | `give_talisman` (donne le talisman de l'ours) | 5 | 8 | 1. reaching into his robe with the right hand, staff in the left / 2. pulling out a small round wooden talisman with a bear paw carving, hanging on a leather cord (touching his hand) / 3. holding the talisman out forward at arm's length toward the right / 4. arm fully extended, talisman dangling from the cord, solemn face / 5. hand empty and open, proud gentle smile (the talisman has been given) |

**Prompt → `assets/sprites/pere_chef.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

CHARACTER: THE CHIEF OF THE EMERALD GROVE (Agarica's father): an elderly male druid, chibi but taller than Agarica (about 1.2x her height), long white beard braided with small wooden beads, greying red hair (family resemblance), pointed elf ears, kind but stern green eyes, long deep-green robe with gold leaf embroidery, brown fur mantle on the shoulders, a circlet of small antlers and leaves on his head, a gnarled wooden staff topped with a green crystal wrapped in leaves (the crystal glows softly but no detached light rays).

SPRITE SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background. Exactly 3 horizontal row(s); each row is ONE animation, read left to right. Frames are laid out on an invisible regular grid: each row is a horizontal band about 341 px tall, each frame cell is about 307 px wide, and each pose is centered horizontally in its cell with the feet (or lowest point) on the same baseline within a row. Leave at least 40 px of empty transparent space between neighboring frames and at least 60 px of empty transparent space between rows: no part of a frame (hair, tail, cape, weapon, trunk, legs) may touch or overlap another frame or reach into another row. Every frame is ONE single connected silhouette: held objects must touch the hand; NO detached particles, sparkles, sweat drops, dust clouds, motion lines, speed lines, impact stars, sound effects or floating debris; NO cast shadow on the ground; NO ground line. Same character, same scale, same proportions and same colors in every frame and every row. He is about 300 px tall (feet to top of the antler circlet), staff included in the same silhouette. The character faces RIGHT in every frame. No text, no numbers, no labels, no grid lines, no borders. Rows with fewer frames use wider cells (row width divided by that row's frame count).

ROWS:
Row 1 (from top) - animation "idle", exactly 4 frame(s). Frame 1: standing tall, both hands resting on the staff planted in front of him. Frame 2: same, slight breath in, beard moving. Frame 3: same, eyes closing slowly. Frame 4: same, eyes open again.
Row 2 (from top) - animation "talk", exactly 4 frame(s). Frame 1: standing, left hand on staff, right hand open gesturing, mouth open. Frame 2: mouth closed, hand lower. Frame 3: mouth open, frowning, finger raised (stern). Frame 4: mouth half open, hand on heart (gentle).
Row 3 (from top) - animation "give_talisman", exactly 5 frame(s). Frame 1: reaching into his robe with the right hand, staff in the left. Frame 2: pulling out a small round wooden talisman with a bear paw carving, hanging on a leather cord (touching his hand). Frame 3: holding the talisman out forward at arm's length toward the right. Frame 4: arm fully extended, talisman dangling from the cord, solemn face. Frame 5: hand empty and open, proud gentle smile (the talisman has been given).

Output: one PNG image, 1536 x 1024 px, transparent background, exactly 3 row(s), 4 / 4 / 5 frames per row.
```

### [P1] `amanite` — Amanite, la tiefling

- **Image(s) à produire** : `assets/sprites/amanite.png` (1536x1024), `assets/sprites/amanite_p2.png` (1536x1024)
- **Découpe** : `assets/sprites/amanite_frames/amanite_row<r>_<c>.png` (auto, `tools/import_codex_assets.py`, mode `blob`)
- **Orientation** : regarde à DROITE — **hauteur source** : ~275 px — **échelle en jeu** : `0.34` (≈ 94 px à l'écran)
- **Notes** : 2 images. L'idole volée (rangée run_idol) est dessinée dans ses bras, collée au corps.
- **Anims (manifest)** : `idle` (row 0, 4 fr.), `talk` (row 1, 4 fr.), `run_idol` (row 2, 5 fr.), `spear_thrust` (row 3, 4 fr.), `walk_angry` (row 4, 5 fr.)

| Rangée (manifest) | Image | Animation | Frames | fps | Poses (gauche → droite) |
|---|---|---|---|---|---|
| 0 | amanite.png (rangée image 1) | `idle` (repos (boucle)) | 4 | 6 boucle | 1. standing, arms crossed, weight on one leg, tail curled, spear on her back / 2. same, hair swaying / 3. same, tail flicking / 4. same, glancing sideways |
| 1 | amanite.png (rangée image 2) | `talk` (parle (boucle)) | 4 | 8 boucle | 1. standing, one hand gesturing sharply, mouth open, intense eyes / 2. mouth closed, fist clenched / 3. mouth open, both arms spread (passionate) / 4. mouth half open, hand on hip |
| 2 | amanite.png (rangée image 3) | `run_idol` (fuite avec l'idole (boucle)) | 5 | 12 boucle | 1. running, clutching a small carved green-stone idol (a seated forest spirit with leaf crown) against her chest with both arms / 2. mid-stride, back foot up, hair streaming behind / 3. passing pose, both feet near the ground / 4. opposite stride, tail streaming / 5. airborne stride, glancing back over her shoulder |
| 3 | amanite_p2.png (rangée image 1) | `spear_thrust` (coup de lance) | 4 | 12 | 1. spear in both hands, pulled back at hip height, wind-up, determined face / 2. lunging forward, spear thrusting horizontally to the right / 3. full extension: front leg bent, spear fully forward (the spear is long, keep it inside the cell) / 4. recovering, spear pulled back upright, cold expression |
| 4 | amanite_p2.png (rangée image 2) | `walk_angry` (s'éloigne, en colère (boucle)) | 5 | 9 boucle | 1. stomping walk, fists clenched, head down, frowning / 2. mid-stride, hair swinging / 3. passing pose / 4. opposite stride, tail lashing / 5. stride, jaw clenched |

**Prompt → `assets/sprites/amanite.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

CHARACTER: AMANITE (Agarica's best friend, a tiefling): young woman the same age as Agarica, chibi proportions, slightly taller (about 1.1x Agarica), bright crimson-red skin, two long glossy black horns sweeping back from her forehead, very long straight sleek black hair down to her waist with a blunt fringe, golden-amber eyes, a thin red tail with a spade tip, dark purple sleeveless wrap top, black leather bracers, burgundy sash, short dark-brown skirt over black leggings, wrapped leather boots. A wooden spear with a leaf-shaped black obsidian blade is strapped diagonally on her back when not in her hands. Proud, impulsive, intense expression.

SPRITE SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background. Exactly 3 horizontal row(s); each row is ONE animation, read left to right. Frames are laid out on an invisible regular grid: each row is a horizontal band about 341 px tall, each frame cell is about 307 px wide, and each pose is centered horizontally in its cell with the feet (or lowest point) on the same baseline within a row. Leave at least 40 px of empty transparent space between neighboring frames and at least 60 px of empty transparent space between rows: no part of a frame (hair, tail, cape, weapon, trunk, legs) may touch or overlap another frame or reach into another row. Every frame is ONE single connected silhouette: held objects must touch the hand; NO detached particles, sparkles, sweat drops, dust clouds, motion lines, speed lines, impact stars, sound effects or floating debris; NO cast shadow on the ground; NO ground line. Same character, same scale, same proportions and same colors in every frame and every row. Amanite is about 275 px tall from feet to the top of her head, horns reaching about 300 px. The character faces RIGHT in every frame. No text, no numbers, no labels, no grid lines, no borders. Rows with fewer frames use wider cells (row width divided by that row's frame count).

ROWS:
Row 1 (from top) - animation "idle", exactly 4 frame(s). Frame 1: standing, arms crossed, weight on one leg, tail curled, spear on her back. Frame 2: same, hair swaying. Frame 3: same, tail flicking. Frame 4: same, glancing sideways.
Row 2 (from top) - animation "talk", exactly 4 frame(s). Frame 1: standing, one hand gesturing sharply, mouth open, intense eyes. Frame 2: mouth closed, fist clenched. Frame 3: mouth open, both arms spread (passionate). Frame 4: mouth half open, hand on hip.
Row 3 (from top) - animation "run_idol", exactly 5 frame(s). Frame 1: running, clutching a small carved green-stone idol (a seated forest spirit with leaf crown) against her chest with both arms. Frame 2: mid-stride, back foot up, hair streaming behind. Frame 3: passing pose, both feet near the ground. Frame 4: opposite stride, tail streaming. Frame 5: airborne stride, glancing back over her shoulder.

Output: one PNG image, 1536 x 1024 px, transparent background, exactly 3 row(s), 4 / 4 / 5 frames per row.
```

**Prompt → `assets/sprites/amanite_p2.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

CHARACTER: AMANITE (Agarica's best friend, a tiefling): young woman the same age as Agarica, chibi proportions, slightly taller (about 1.1x Agarica), bright crimson-red skin, two long glossy black horns sweeping back from her forehead, very long straight sleek black hair down to her waist with a blunt fringe, golden-amber eyes, a thin red tail with a spade tip, dark purple sleeveless wrap top, black leather bracers, burgundy sash, short dark-brown skirt over black leggings, wrapped leather boots. A wooden spear with a leaf-shaped black obsidian blade is strapped diagonally on her back when not in her hands. Proud, impulsive, intense expression.

SPRITE SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background. Exactly 2 horizontal row(s); each row is ONE animation, read left to right. Frames are laid out on an invisible regular grid: each row is a horizontal band about 512 px tall, each frame cell is about 307 px wide, and each pose is centered horizontally in its cell with the feet (or lowest point) on the same baseline within a row. Leave at least 40 px of empty transparent space between neighboring frames and at least 60 px of empty transparent space between rows: no part of a frame (hair, tail, cape, weapon, trunk, legs) may touch or overlap another frame or reach into another row. Every frame is ONE single connected silhouette: held objects must touch the hand; NO detached particles, sparkles, sweat drops, dust clouds, motion lines, speed lines, impact stars, sound effects or floating debris; NO cast shadow on the ground; NO ground line. Same character, same scale, same proportions and same colors in every frame and every row. Amanite is about 275 px tall from feet to the top of her head, horns reaching about 300 px. The character faces RIGHT in every frame. No text, no numbers, no labels, no grid lines, no borders. Rows with fewer frames use wider cells (row width divided by that row's frame count).

ROWS:
Row 1 (from top) - animation "spear_thrust", exactly 4 frame(s). Frame 1: spear in both hands, pulled back at hip height, wind-up, determined face. Frame 2: lunging forward, spear thrusting horizontally to the right. Frame 3: full extension: front leg bent, spear fully forward (the spear is long, keep it inside the cell). Frame 4: recovering, spear pulled back upright, cold expression.
Row 2 (from top) - animation "walk_angry", exactly 5 frame(s). Frame 1: stomping walk, fists clenched, head down, frowning. Frame 2: mid-stride, hair swinging. Frame 3: passing pose. Frame 4: opposite stride, tail lashing. Frame 5: stride, jaw clenched.

Output: one PNG image, 1536 x 1024 px, transparent background, exactly 2 row(s), 4 / 5 frames per row.
```

### [P1] `galter` — Galter, ranger halfelin

- **Image(s) à produire** : `assets/sprites/galter.png` (1536x1024), `assets/sprites/galter_p2.png` (1536x1024)
- **Découpe** : `assets/sprites/galter_frames/galter_row<r>_<c>.png` (auto, `tools/import_codex_assets.py`, mode `blob`)
- **Orientation** : regarde à DROITE — **hauteur source** : ~215 px — **échelle en jeu** : `0.34` (≈ 73 px à l'écran)
- **Notes** : Design ORIGINAL : ne doit pas ressembler à Geralt de Riv (voir fiche).
- **Anims (manifest)** : `idle` (row 0, 4 fr.), `talk` (row 1, 4 fr.), `attack_miss` (row 2, 5 fr.), `trip_fall` (row 3, 5 fr.), `map_reading` (row 4, 4 fr.), `walk` (row 5, 5 fr.)

| Rangée (manifest) | Image | Animation | Frames | fps | Poses (gauche → droite) |
|---|---|---|---|---|---|
| 0 | galter.png (rangée image 1) | `idle` (repos (boucle)) | 4 | 6 boucle | 1. standing, slouched, yawning, hand on the satchel strap / 2. same, rubbing his eye / 3. same, scratching beard / 4. same, alert again |
| 1 | galter.png (rangée image 2) | `talk` (parle (boucle)) | 4 | 8 boucle | 1. standing, finger raised like a know-it-all, mouth open / 2. mouth closed, hands on hips / 3. mouth open, pointing forward to the right / 4. mouth half open, shrugging |
| 2 | galter.png (rangée image 3) | `attack_miss` (attaque ratée (comique)) | 5 | 10 | 1. dramatic pose drawing the short bow, overconfident grin / 2. bow drawn, aiming, one eye closed / 3. arrow loosed (no arrow drawn), the bowstring snapping, bow twisting in his hands / 4. losing balance, arms windmilling, bow flying up but still touching his fingertips / 5. embarrassed, catching the bow clumsily, sheepish face |
| 3 | galter_p2.png (rangée image 1) | `trip_fall` (trébuche dans son propre piège) | 5 | 10 | 1. walking proudly, one foot catching a rope loop at his ankle (rope touches his foot) / 2. tripping forward, surprised face / 3. falling face first, arms out / 4. flat on his belly on the ground / 5. sitting up dazed, hair messed up |
| 4 | galter_p2.png (rangée image 2) | `map_reading` (lit sa carte (boucle)) | 4 | 5 boucle | 1. holding a large unrolled parchment map in both hands (the map touches his hands, no readable text), frowning / 2. turning the map sideways, confused / 3. turning it upside down / 4. scratching his head with one hand, map in the other |
| 5 | galter_p2.png (rangée image 3) | `walk` (marche (boucle)) | 5 | 9 boucle | 1. walking right, short bouncy halfling stride / 2. mid-stride / 3. passing pose / 4. opposite stride / 5. stride |

**Prompt → `assets/sprites/galter.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

CHARACTER: GALTER (halfling ranger) - ORIGINAL design, must NOT resemble Geralt of Rivia (NO white hair, NO witcher medallion, NO sword on the back, NO eye scar, NO yellow cat eyes): a short stocky middle-aged halfling (about 0.85x Agarica's height), tired hunter look with heavy-lidded brown eyes and bags under them, round face, round nose, small round non-pointed ears, messy curly chestnut-brown hair in a short stubby ponytail, short scruffy auburn beard, dark blue-black geometric tribal zigzag tattoos on both cheeks and forearms, patched moss-green hooded tunic, brown leather vest covered with pouches, a satchel stuffed with rolled map scrolls, a short wooden bow and a quiver on his back, bare big hairy halfling feet. Slightly comic, clumsy-but-proud attitude.

SPRITE SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background. Exactly 3 horizontal row(s); each row is ONE animation, read left to right. Frames are laid out on an invisible regular grid: each row is a horizontal band about 341 px tall, each frame cell is about 307 px wide, and each pose is centered horizontally in its cell with the feet (or lowest point) on the same baseline within a row. Leave at least 40 px of empty transparent space between neighboring frames and at least 60 px of empty transparent space between rows: no part of a frame (hair, tail, cape, weapon, trunk, legs) may touch or overlap another frame or reach into another row. Every frame is ONE single connected silhouette: held objects must touch the hand; NO detached particles, sparkles, sweat drops, dust clouds, motion lines, speed lines, impact stars, sound effects or floating debris; NO cast shadow on the ground; NO ground line. Same character, same scale, same proportions and same colors in every frame and every row. Galter is about 215 px tall (he is shorter than Agarica). The character faces RIGHT in every frame. No text, no numbers, no labels, no grid lines, no borders. Rows with fewer frames use wider cells (row width divided by that row's frame count).

ROWS:
Row 1 (from top) - animation "idle", exactly 4 frame(s). Frame 1: standing, slouched, yawning, hand on the satchel strap. Frame 2: same, rubbing his eye. Frame 3: same, scratching beard. Frame 4: same, alert again.
Row 2 (from top) - animation "talk", exactly 4 frame(s). Frame 1: standing, finger raised like a know-it-all, mouth open. Frame 2: mouth closed, hands on hips. Frame 3: mouth open, pointing forward to the right. Frame 4: mouth half open, shrugging.
Row 3 (from top) - animation "attack_miss", exactly 5 frame(s). Frame 1: dramatic pose drawing the short bow, overconfident grin. Frame 2: bow drawn, aiming, one eye closed. Frame 3: arrow loosed (no arrow drawn), the bowstring snapping, bow twisting in his hands. Frame 4: losing balance, arms windmilling, bow flying up but still touching his fingertips. Frame 5: embarrassed, catching the bow clumsily, sheepish face.

Output: one PNG image, 1536 x 1024 px, transparent background, exactly 3 row(s), 4 / 4 / 5 frames per row.
```

**Prompt → `assets/sprites/galter_p2.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

CHARACTER: GALTER (halfling ranger) - ORIGINAL design, must NOT resemble Geralt of Rivia (NO white hair, NO witcher medallion, NO sword on the back, NO eye scar, NO yellow cat eyes): a short stocky middle-aged halfling (about 0.85x Agarica's height), tired hunter look with heavy-lidded brown eyes and bags under them, round face, round nose, small round non-pointed ears, messy curly chestnut-brown hair in a short stubby ponytail, short scruffy auburn beard, dark blue-black geometric tribal zigzag tattoos on both cheeks and forearms, patched moss-green hooded tunic, brown leather vest covered with pouches, a satchel stuffed with rolled map scrolls, a short wooden bow and a quiver on his back, bare big hairy halfling feet. Slightly comic, clumsy-but-proud attitude.

SPRITE SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background. Exactly 3 horizontal row(s); each row is ONE animation, read left to right. Frames are laid out on an invisible regular grid: each row is a horizontal band about 341 px tall, each frame cell is about 307 px wide, and each pose is centered horizontally in its cell with the feet (or lowest point) on the same baseline within a row. Leave at least 40 px of empty transparent space between neighboring frames and at least 60 px of empty transparent space between rows: no part of a frame (hair, tail, cape, weapon, trunk, legs) may touch or overlap another frame or reach into another row. Every frame is ONE single connected silhouette: held objects must touch the hand; NO detached particles, sparkles, sweat drops, dust clouds, motion lines, speed lines, impact stars, sound effects or floating debris; NO cast shadow on the ground; NO ground line. Same character, same scale, same proportions and same colors in every frame and every row. Galter is about 215 px tall (he is shorter than Agarica). The character faces RIGHT in every frame. No text, no numbers, no labels, no grid lines, no borders. Rows with fewer frames use wider cells (row width divided by that row's frame count).

ROWS:
Row 1 (from top) - animation "trip_fall", exactly 5 frame(s). Frame 1: walking proudly, one foot catching a rope loop at his ankle (rope touches his foot). Frame 2: tripping forward, surprised face. Frame 3: falling face first, arms out. Frame 4: flat on his belly on the ground. Frame 5: sitting up dazed, hair messed up.
Row 2 (from top) - animation "map_reading", exactly 4 frame(s). Frame 1: holding a large unrolled parchment map in both hands (the map touches his hands, no readable text), frowning. Frame 2: turning the map sideways, confused. Frame 3: turning it upside down. Frame 4: scratching his head with one hand, map in the other.
Row 3 (from top) - animation "walk", exactly 5 frame(s). Frame 1: walking right, short bouncy halfling stride. Frame 2: mid-stride. Frame 3: passing pose. Frame 4: opposite stride. Frame 5: stride.

Output: one PNG image, 1536 x 1024 px, transparent background, exactly 3 row(s), 5 / 4 / 5 frames per row.
```

### [P1] `morgat` — Morgat, la guérisseuse aux papillons

- **Image(s) à produire** : `assets/sprites/morgat.png` (1536x1024)
- **Découpe** : `assets/sprites/morgat_frames/morgat_row<r>_<c>.png` (auto, `tools/import_codex_assets.py`, mode `blob`)
- **Orientation** : regarde à DROITE — **hauteur source** : ~270 px — **échelle en jeu** : `0.34` (≈ 92 px à l'écran)
- **Anims (manifest)** : `idle` (row 0, 4 fr.), `talk` (row 1, 4 fr.), `brew` (row 2, 5 fr.)

| Rangée (manifest) | Image | Animation | Frames | fps | Poses (gauche → droite) |
|---|---|---|---|---|---|
| 0 | morgat.png (rangée image 1) | `idle` (repos (boucle)) | 4 | 5 boucle | 1. standing hunched, hands folded, kind smile / 2. same, antennae twitching / 3. same, a butterfly on her shawl opening its wings / 4. same, eyes closed peacefully |
| 1 | morgat.png (rangée image 2) | `talk` (parle (boucle)) | 4 | 8 boucle | 1. mouth open, one hand raised with the index up, wise look / 2. mouth closed, nodding / 3. mouth open, hand open forward / 4. mouth half open, laughing softly |
| 2 | morgat.png (rangée image 3) | `brew` (prépare une potion (boucle)) | 5 | 8 boucle | 1. holding a stone mortar in one arm and grinding with a pestle (both touching her hands) / 2. grinding, body leaning in / 3. lifting the pestle, sniffing / 4. pouring a pinch of glowing powder from her fingers into the mortar (powder stays as a solid stream touching both) / 5. satisfied smile, mortar held up |

**Prompt → `assets/sprites/morgat.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

CHARACTER: MORGAT (the butterfly healer): an elderly gentle healer woman, chibi proportions (about 1.1x Agarica's height), slightly hunched, warm tan skin, wild silver hair gathered in a big bun pierced with wooden pins, a headband with two feathery moth antennae, a shawl shaped like folded butterfly wings with teal, orange and violet patterns, layered earthy-brown skirts, a belt of little herb pouches and glass vials, two or three small glowing cyan butterflies perched directly ON her shawl and hair (touching her, never floating free).

SPRITE SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background. Exactly 3 horizontal row(s); each row is ONE animation, read left to right. Frames are laid out on an invisible regular grid: each row is a horizontal band about 341 px tall, each frame cell is about 307 px wide, and each pose is centered horizontally in its cell with the feet (or lowest point) on the same baseline within a row. Leave at least 40 px of empty transparent space between neighboring frames and at least 60 px of empty transparent space between rows: no part of a frame (hair, tail, cape, weapon, trunk, legs) may touch or overlap another frame or reach into another row. Every frame is ONE single connected silhouette: held objects must touch the hand; NO detached particles, sparkles, sweat drops, dust clouds, motion lines, speed lines, impact stars, sound effects or floating debris; NO cast shadow on the ground; NO ground line. Same character, same scale, same proportions and same colors in every frame and every row. Morgat is about 270 px tall (antennae included). The character faces RIGHT in every frame. No text, no numbers, no labels, no grid lines, no borders. Rows with fewer frames use wider cells (row width divided by that row's frame count).

ROWS:
Row 1 (from top) - animation "idle", exactly 4 frame(s). Frame 1: standing hunched, hands folded, kind smile. Frame 2: same, antennae twitching. Frame 3: same, a butterfly on her shawl opening its wings. Frame 4: same, eyes closed peacefully.
Row 2 (from top) - animation "talk", exactly 4 frame(s). Frame 1: mouth open, one hand raised with the index up, wise look. Frame 2: mouth closed, nodding. Frame 3: mouth open, hand open forward. Frame 4: mouth half open, laughing softly.
Row 3 (from top) - animation "brew", exactly 5 frame(s). Frame 1: holding a stone mortar in one arm and grinding with a pestle (both touching her hands). Frame 2: grinding, body leaning in. Frame 3: lifting the pestle, sniffing. Frame 4: pouring a pinch of glowing powder from her fingers into the mortar (powder stays as a solid stream touching both). Frame 5: satisfied smile, mortar held up.

Output: one PNG image, 1536 x 1024 px, transparent background, exactly 3 row(s), 4 / 4 / 5 frames per row.
```

### [P1] `papillon` — Papillon lumineux

- **Image(s) à produire** : `assets/sprites/papillon.png` (1536x1024)
- **Découpe** : `assets/sprites/papillon_frames/papillon_row<r>_<c>.png` (auto, `tools/import_codex_assets.py`, mode `blob`)
- **Orientation** : regarde à DROITE — **hauteur source** : ~150 px — **échelle en jeu** : `0.1` (≈ 15 px à l'écran)
- **Notes** : Une seule rangée centrée verticalement dans l'image.
- **Anims (manifest)** : `idle` (row 0, 4 fr.)

| Rangée (manifest) | Image | Animation | Frames | fps | Poses (gauche → droite) |
|---|---|---|---|---|---|
| 0 | papillon.png (rangée image 1) | `idle` (battement d'ailes (boucle)) | 4 | 14 boucle | 1. side view, wings fully up / 2. wings half open / 3. wings fully down / 4. wings half open coming back up |

**Prompt → `assets/sprites/papillon.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

CHARACTER: GLOWING BUTTERFLY: a small magical butterfly, wings luminous cyan fading to pale green with violet edges and tiny white dots, dark violet body, thin antennae, soft glow drawn as a solid light rim on the wings (no detached halo).

SPRITE SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background. Exactly 1 horizontal row(s); each row is ONE animation, read left to right. Frames are laid out on an invisible regular grid: each row is a horizontal band about 1024 px tall, each frame cell is about 384 px wide, and each pose is centered horizontally in its cell with the feet (or lowest point) on the same baseline within a row. Leave at least 40 px of empty transparent space between neighboring frames and at least 60 px of empty transparent space between rows: no part of a frame (hair, tail, cape, weapon, trunk, legs) may touch or overlap another frame or reach into another row. Every frame is ONE single connected silhouette: held objects must touch the hand; NO detached particles, sparkles, sweat drops, dust clouds, motion lines, speed lines, impact stars, sound effects or floating debris; NO cast shadow on the ground; NO ground line. Same character, same scale, same proportions and same colors in every frame and every row. The butterfly is about 150 px wide with wings open. The character faces RIGHT in every frame. No text, no numbers, no labels, no grid lines, no borders. The single row is vertically centered on the canvas.

ROWS:
Row 1 (from top) - animation "idle", exactly 4 frame(s). Frame 1: side view, wings fully up. Frame 2: wings half open. Frame 3: wings fully down. Frame 4: wings half open coming back up.

Output: one PNG image, 1536 x 1024 px, transparent background, exactly 1 row(s), 4 frames per row.
```

### [P1] `kainati` — Kainati, Roi des Simiens (boss corrompu)

- **Image(s) à produire** : `assets/sprites/kainati.png` (1536x1024), `assets/sprites/kainati_p2.png` (1536x1024), `assets/sprites/kainati_p3.png` (1536x1024), `assets/sprites/kainati_p4.png` (1536x1024)
- **Découpe** : `assets/sprites/kainati_frames/kainati_row<r>_<c>.png` (auto, `tools/import_codex_assets.py`, mode `blob`)
- **Orientation** : regarde à DROITE — **hauteur source** : ~400 px — **échelle en jeu** : `0.54` (≈ 216 px à l'écran)
- **Notes** : Doit correspondre EXACTEMENT à `assets/bosses_sprites/9a183398-c678-4590-ab59-155c7205e9c6.png` (joindre cette image à Codex comme référence). 2 rangées par image (bandes de 512 px), 4 images. La pierre lancée n'est dessinée QUE tant qu'elle touche la main (après lâcher : asset `pierre`). La liane n'est pas dessinée.
- **Anims (manifest)** : `idle` (row 0, 4 fr.), `throw_stone` (row 1, 4 fr.), `swing_vine` (row 2, 4 fr.), `leap` (row 3, 4 fr.), `land_stomp` (row 4, 4 fr.), `hit` (row 5, 3 fr.), `defeated_lucid` (row 6, 4 fr.)

| Rangée (manifest) | Image | Animation | Frames | fps | Poses (gauche → droite) |
|---|---|---|---|---|---|
| 0 | kainati.png (rangée image 1) | `idle` (repos menaçant (boucle)) | 4 | 6 boucle | 1. knuckle-walking stance like the reference, chest heaving / 2. same, shoulders raised, snarl / 3. same, head turning slightly, moss dripping / 4. same, knuckles pressing the ground |
| 1 | kainati.png (rangée image 2) | `throw_stone` (lance une pierre) | 4 | 10 | 1. rearing up on hind legs, right hand grabbing a big grey rock (the rock touches the hand) / 2. rock lifted high behind his head, roaring / 3. throwing arm swinging forward, rock still in the hand at the front / 4. follow-through, hand empty and extended forward to the right |
| 2 | kainati_p2.png (rangée image 1) | `swing_vine` (se balance à une liane (boucle)) | 4 | 8 boucle | 1. hanging by one huge raised hand from an INVISIBLE vine above (not drawn), body angled back, feet to the left / 2. bottom of the arc, body vertical, legs tucked / 3. swung forward, feet to the right, free arm reaching forward / 4. returning, body vertical, legs trailing |
| 3 | kainati_p2.png (rangée image 2) | `leap` (bond) | 4 | 10 | 1. deep crouch, arms on the ground, ready to spring / 2. launching diagonally up and right, arms raised / 3. mid-air, arms and legs spread wide, roaring / 4. descending, both fists raised together above the head |
| 4 | kainati_p3.png (rangée image 1) | `land_stomp` (atterrissage / frappe au sol) | 4 | 10 | 1. slamming down, both fists smashing the ground in front / 2. impact pose, body compressed, fists on the ground (no dust drawn) / 3. rising up, beating his chest with both fists / 4. back to the knuckle stance, roaring |
| 5 | kainati_p3.png (rangée image 2) | `hit` (touché) | 3 | 12 | 1. recoiling, head thrown back, eyes shut / 2. staggering backward on hind legs, arms flailing / 3. recovering, shaking his head |
| 6 | kainati_p4.png (rangée image 1) | `defeated_lucid` (vaincu, redevient lucide) | 4 | 5 | 1. sitting heavily on the ground, exhausted, head down, moss still on him / 2. same, holding his head with one hand, moss patches shrinking / 3. same, looking up, eyes changing from glowing green to calm warm amber, much less moss / 4. same, calm and wise expression, almost no moss, one hand raised in peace |

**Prompt → `assets/sprites/kainati.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

CHARACTER: KAINATI, KING OF THE SIMIANS (corrupted boss) - must match the existing reference art exactly: a huge gorilla-like ape king, thick shaggy pure-white fur with black outlines, dark grey skin on face, chest, hands and feet, glowing green eyes, angry heavy brow, red tribal paint stripes on his cheek, a tall carved Maya-like stone crown/headdress made of grey-beige stone blocks with spiral glyphs, thick brown vine bracelets wrapped around wrists and ankles, patches of glowing toxic-green moss stuck in his fur and on his crown, dripping like slime with tiny sparkle highlights. Knuckle-walking stance. Clearly pixel-art style like the game's bear and toad.

SPRITE SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background. Exactly 2 horizontal row(s); each row is ONE animation, read left to right. Frames are laid out on an invisible regular grid: each row is a horizontal band about 512 px tall, each frame cell is about 384 px wide, and each pose is centered horizontally in its cell with the feet (or lowest point) on the same baseline within a row. Leave at least 40 px of empty transparent space between neighboring frames and at least 60 px of empty transparent space between rows: no part of a frame (hair, tail, cape, weapon, trunk, legs) may touch or overlap another frame or reach into another row. Every frame is ONE single connected silhouette: held objects must touch the hand; NO detached particles, sparkles, sweat drops, dust clouds, motion lines, speed lines, impact stars, sound effects or floating debris; NO cast shadow on the ground; NO ground line. Same character, same scale, same proportions and same colors in every frame and every row. Kainati is about 400 px tall in his knuckle-walking idle stance; keep exactly the same size in every frame. The character faces RIGHT in every frame. No text, no numbers, no labels, no grid lines, no borders.

ROWS:
Row 1 (from top) - animation "idle", exactly 4 frame(s). Frame 1: knuckle-walking stance like the reference, chest heaving. Frame 2: same, shoulders raised, snarl. Frame 3: same, head turning slightly, moss dripping. Frame 4: same, knuckles pressing the ground.
Row 2 (from top) - animation "throw_stone", exactly 4 frame(s). Frame 1: rearing up on hind legs, right hand grabbing a big grey rock (the rock touches the hand). Frame 2: rock lifted high behind his head, roaring. Frame 3: throwing arm swinging forward, rock still in the hand at the front. Frame 4: follow-through, hand empty and extended forward to the right.

Output: one PNG image, 1536 x 1024 px, transparent background, exactly 2 row(s), 4 / 4 frames per row.
```

**Prompt → `assets/sprites/kainati_p2.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

CHARACTER: KAINATI, KING OF THE SIMIANS (corrupted boss) - must match the existing reference art exactly: a huge gorilla-like ape king, thick shaggy pure-white fur with black outlines, dark grey skin on face, chest, hands and feet, glowing green eyes, angry heavy brow, red tribal paint stripes on his cheek, a tall carved Maya-like stone crown/headdress made of grey-beige stone blocks with spiral glyphs, thick brown vine bracelets wrapped around wrists and ankles, patches of glowing toxic-green moss stuck in his fur and on his crown, dripping like slime with tiny sparkle highlights. Knuckle-walking stance. Clearly pixel-art style like the game's bear and toad.

SPRITE SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background. Exactly 2 horizontal row(s); each row is ONE animation, read left to right. Frames are laid out on an invisible regular grid: each row is a horizontal band about 512 px tall, each frame cell is about 384 px wide, and each pose is centered horizontally in its cell with the feet (or lowest point) on the same baseline within a row. Leave at least 40 px of empty transparent space between neighboring frames and at least 60 px of empty transparent space between rows: no part of a frame (hair, tail, cape, weapon, trunk, legs) may touch or overlap another frame or reach into another row. Every frame is ONE single connected silhouette: held objects must touch the hand; NO detached particles, sparkles, sweat drops, dust clouds, motion lines, speed lines, impact stars, sound effects or floating debris; NO cast shadow on the ground; NO ground line. Same character, same scale, same proportions and same colors in every frame and every row. Kainati is about 400 px tall in his knuckle-walking idle stance; keep exactly the same size in every frame. The character faces RIGHT in every frame. No text, no numbers, no labels, no grid lines, no borders.

ROWS:
Row 1 (from top) - animation "swing_vine", exactly 4 frame(s). Frame 1: hanging by one huge raised hand from an INVISIBLE vine above (not drawn), body angled back, feet to the left. Frame 2: bottom of the arc, body vertical, legs tucked. Frame 3: swung forward, feet to the right, free arm reaching forward. Frame 4: returning, body vertical, legs trailing.
Row 2 (from top) - animation "leap", exactly 4 frame(s). Frame 1: deep crouch, arms on the ground, ready to spring. Frame 2: launching diagonally up and right, arms raised. Frame 3: mid-air, arms and legs spread wide, roaring. Frame 4: descending, both fists raised together above the head.

Output: one PNG image, 1536 x 1024 px, transparent background, exactly 2 row(s), 4 / 4 frames per row.
```

**Prompt → `assets/sprites/kainati_p3.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

CHARACTER: KAINATI, KING OF THE SIMIANS (corrupted boss) - must match the existing reference art exactly: a huge gorilla-like ape king, thick shaggy pure-white fur with black outlines, dark grey skin on face, chest, hands and feet, glowing green eyes, angry heavy brow, red tribal paint stripes on his cheek, a tall carved Maya-like stone crown/headdress made of grey-beige stone blocks with spiral glyphs, thick brown vine bracelets wrapped around wrists and ankles, patches of glowing toxic-green moss stuck in his fur and on his crown, dripping like slime with tiny sparkle highlights. Knuckle-walking stance. Clearly pixel-art style like the game's bear and toad.

SPRITE SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background. Exactly 2 horizontal row(s); each row is ONE animation, read left to right. Frames are laid out on an invisible regular grid: each row is a horizontal band about 512 px tall, each frame cell is about 384 px wide, and each pose is centered horizontally in its cell with the feet (or lowest point) on the same baseline within a row. Leave at least 40 px of empty transparent space between neighboring frames and at least 60 px of empty transparent space between rows: no part of a frame (hair, tail, cape, weapon, trunk, legs) may touch or overlap another frame or reach into another row. Every frame is ONE single connected silhouette: held objects must touch the hand; NO detached particles, sparkles, sweat drops, dust clouds, motion lines, speed lines, impact stars, sound effects or floating debris; NO cast shadow on the ground; NO ground line. Same character, same scale, same proportions and same colors in every frame and every row. Kainati is about 400 px tall in his knuckle-walking idle stance; keep exactly the same size in every frame. The character faces RIGHT in every frame. No text, no numbers, no labels, no grid lines, no borders. Rows with fewer frames use wider cells (row width divided by that row's frame count).

ROWS:
Row 1 (from top) - animation "land_stomp", exactly 4 frame(s). Frame 1: slamming down, both fists smashing the ground in front. Frame 2: impact pose, body compressed, fists on the ground (no dust drawn). Frame 3: rising up, beating his chest with both fists. Frame 4: back to the knuckle stance, roaring.
Row 2 (from top) - animation "hit", exactly 3 frame(s). Frame 1: recoiling, head thrown back, eyes shut. Frame 2: staggering backward on hind legs, arms flailing. Frame 3: recovering, shaking his head.

Output: one PNG image, 1536 x 1024 px, transparent background, exactly 2 row(s), 4 / 3 frames per row.
```

**Prompt → `assets/sprites/kainati_p4.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

CHARACTER: KAINATI, KING OF THE SIMIANS (corrupted boss) - must match the existing reference art exactly: a huge gorilla-like ape king, thick shaggy pure-white fur with black outlines, dark grey skin on face, chest, hands and feet, glowing green eyes, angry heavy brow, red tribal paint stripes on his cheek, a tall carved Maya-like stone crown/headdress made of grey-beige stone blocks with spiral glyphs, thick brown vine bracelets wrapped around wrists and ankles, patches of glowing toxic-green moss stuck in his fur and on his crown, dripping like slime with tiny sparkle highlights. Knuckle-walking stance. Clearly pixel-art style like the game's bear and toad.

SPRITE SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background. Exactly 1 horizontal row(s); each row is ONE animation, read left to right. Frames are laid out on an invisible regular grid: each row is a horizontal band about 1024 px tall, each frame cell is about 384 px wide, and each pose is centered horizontally in its cell with the feet (or lowest point) on the same baseline within a row. Leave at least 40 px of empty transparent space between neighboring frames and at least 60 px of empty transparent space between rows: no part of a frame (hair, tail, cape, weapon, trunk, legs) may touch or overlap another frame or reach into another row. Every frame is ONE single connected silhouette: held objects must touch the hand; NO detached particles, sparkles, sweat drops, dust clouds, motion lines, speed lines, impact stars, sound effects or floating debris; NO cast shadow on the ground; NO ground line. Same character, same scale, same proportions and same colors in every frame and every row. Kainati is about 400 px tall in his knuckle-walking idle stance; keep exactly the same size in every frame. The character faces RIGHT in every frame. No text, no numbers, no labels, no grid lines, no borders. The single row is vertically centered on the canvas.

ROWS:
Row 1 (from top) - animation "defeated_lucid", exactly 4 frame(s). Frame 1: sitting heavily on the ground, exhausted, head down, moss still on him. Frame 2: same, holding his head with one hand, moss patches shrinking. Frame 3: same, looking up, eyes changing from glowing green to calm warm amber, much less moss. Frame 4: same, calm and wise expression, almost no moss, one hand raised in peace.

Output: one PNG image, 1536 x 1024 px, transparent background, exactly 1 row(s), 4 frames per row.
```

### [P1] `ghilt` — Ghil't, le Fléau de la Forêt (boss corrompu)

- **Image(s) à produire** : `assets/sprites/ghilt.png` (1536x1024), `assets/sprites/ghilt_p2.png` (1536x1024), `assets/sprites/ghilt_p3.png` (1536x1024), `assets/sprites/ghilt_p4.png` (1536x1024)
- **Découpe** : `assets/sprites/ghilt_frames/ghilt_row<r>_<c>.png` (auto, `tools/import_codex_assets.py`, mode `blob`)
- **Orientation** : regarde à DROITE — **hauteur source** : ~330 px — **échelle en jeu** : `0.72` (≈ 238 px à l'écran)
- **Notes** : Très grand : 2 rangées x 3 frames par image, 4 images. Le souffle et les crachats ne sont PAS dessinés ici (voir `vfx_souffle_toxique`, `vfx_flaque_mousse`) : seule la pose de la bête.
- **Anims (manifest)** : `idle` (row 0, 3 fr.), `walk` (row 1, 3 fr.), `charge` (row 2, 3 fr.), `toxic_breath` (row 3, 3 fr.), `spit` (row 4, 3 fr.), `roar` (row 5, 3 fr.), `hit` (row 6, 3 fr.), `weakened` (row 7, 3 fr.)

| Rangée (manifest) | Image | Animation | Frames | fps | Poses (gauche → droite) |
|---|---|---|---|---|---|
| 0 | ghilt.png (rangée image 1) | `idle` (repos lourd (boucle)) | 3 | 4 boucle | 1. standing, head low, trunk dripping moss, heavy breathing / 2. same, flanks expanded, trunk curling / 3. same, trunk swaying, eyes glinting |
| 1 | ghilt.png (rangée image 2) | `walk` (marche (boucle)) | 3 | 5 boucle | 1. heavy step, front-left leg forward / 2. legs gathered, body swaying / 3. heavy step, front-right leg forward |
| 2 | ghilt_p2.png (rangée image 1) | `charge` (charge (boucle)) | 3 | 10 boucle | 1. head lowered, trunk tucked, legs stretched in a gallop / 2. legs gathered under the body / 3. legs stretched again, moss flying but attached |
| 3 | ghilt_p2.png (rangée image 2) | `toxic_breath` (souffle toxique (pose)) | 3 | 6 | 1. rearing the head back, trunk raised, inhaling / 2. head thrust forward, trunk pointing straight right, mouth and nostrils wide open / 3. same, body pushing forward, sustained exhale pose |
| 4 | ghilt_p3.png (rangée image 1) | `spit` (crache de la mousse) | 3 | 8 | 1. trunk curled up and back, cheeks bulging / 2. trunk whipping forward and down / 3. trunk extended forward, a thick blob of moss slime still attached at its tip |
| 5 | ghilt_p3.png (rangée image 2) | `roar` (rugit (appelle les créatures)) | 3 | 6 | 1. rearing up on hind legs, front legs raised / 2. trunk raised high, mouth wide open roaring / 3. front legs slamming down |
| 6 | ghilt_p4.png (rangée image 1) | `hit` (touché) | 3 | 10 | 1. flinching, head jerked back, eyes squeezed / 2. stumbling sideways, legs splayed / 3. shaking it off, snorting |
| 7 | ghilt_p4.png (rangée image 2) | `weakened` (affaibli, prêt à être soigné (boucle)) | 3 | 4 boucle | 1. lying on its belly, head on the ground, trunk limp, moss dimmed / 2. same, flanks rising with breath / 3. same, one eye half open, pleading |

**Prompt → `assets/sprites/ghilt.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

CHARACTER: GHIL'T, THE SCOURGE OF THE FOREST (corrupted boss): a giant corrupted tapir guardian, massive barrel-shaped body, short thick legs with three-toed hooves, a huge long prehensile trunk-snout drooping down and dripping thick glowing toxic-green moss slime (drips stay attached to the snout), small mean glowing green eyes, dark slate-blue and charcoal hide with faint pale ancient rune patterns (a big spiral rune on the flank), the whole back covered by a thick carpet of glowing toxic moss with twisted roots and small sickly fungi growing out of the spine, cracked bark-like plates on the shoulders. Pixel-art style like Kainati and the bear.

SPRITE SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background. Exactly 2 horizontal row(s); each row is ONE animation, read left to right. Frames are laid out on an invisible regular grid: each row is a horizontal band about 512 px tall, each frame cell is about 512 px wide, and each pose is centered horizontally in its cell with the feet (or lowest point) on the same baseline within a row. Leave at least 40 px of empty transparent space between neighboring frames and at least 60 px of empty transparent space between rows: no part of a frame (hair, tail, cape, weapon, trunk, legs) may touch or overlap another frame or reach into another row. Every frame is ONE single connected silhouette: held objects must touch the hand; NO detached particles, sparkles, sweat drops, dust clouds, motion lines, speed lines, impact stars, sound effects or floating debris; NO cast shadow on the ground; NO ground line. Same character, same scale, same proportions and same colors in every frame and every row. Ghil't's body is about 330 px tall (top of back to hooves) and about 450 px long: 3 frames per row, each cell 512 px wide. The character faces RIGHT in every frame. No text, no numbers, no labels, no grid lines, no borders.

ROWS:
Row 1 (from top) - animation "idle", exactly 3 frame(s). Frame 1: standing, head low, trunk dripping moss, heavy breathing. Frame 2: same, flanks expanded, trunk curling. Frame 3: same, trunk swaying, eyes glinting.
Row 2 (from top) - animation "walk", exactly 3 frame(s). Frame 1: heavy step, front-left leg forward. Frame 2: legs gathered, body swaying. Frame 3: heavy step, front-right leg forward.

Output: one PNG image, 1536 x 1024 px, transparent background, exactly 2 row(s), 3 / 3 frames per row.
```

**Prompt → `assets/sprites/ghilt_p2.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

CHARACTER: GHIL'T, THE SCOURGE OF THE FOREST (corrupted boss): a giant corrupted tapir guardian, massive barrel-shaped body, short thick legs with three-toed hooves, a huge long prehensile trunk-snout drooping down and dripping thick glowing toxic-green moss slime (drips stay attached to the snout), small mean glowing green eyes, dark slate-blue and charcoal hide with faint pale ancient rune patterns (a big spiral rune on the flank), the whole back covered by a thick carpet of glowing toxic moss with twisted roots and small sickly fungi growing out of the spine, cracked bark-like plates on the shoulders. Pixel-art style like Kainati and the bear.

SPRITE SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background. Exactly 2 horizontal row(s); each row is ONE animation, read left to right. Frames are laid out on an invisible regular grid: each row is a horizontal band about 512 px tall, each frame cell is about 512 px wide, and each pose is centered horizontally in its cell with the feet (or lowest point) on the same baseline within a row. Leave at least 40 px of empty transparent space between neighboring frames and at least 60 px of empty transparent space between rows: no part of a frame (hair, tail, cape, weapon, trunk, legs) may touch or overlap another frame or reach into another row. Every frame is ONE single connected silhouette: held objects must touch the hand; NO detached particles, sparkles, sweat drops, dust clouds, motion lines, speed lines, impact stars, sound effects or floating debris; NO cast shadow on the ground; NO ground line. Same character, same scale, same proportions and same colors in every frame and every row. Ghil't's body is about 330 px tall (top of back to hooves) and about 450 px long: 3 frames per row, each cell 512 px wide. The character faces RIGHT in every frame. No text, no numbers, no labels, no grid lines, no borders.

ROWS:
Row 1 (from top) - animation "charge", exactly 3 frame(s). Frame 1: head lowered, trunk tucked, legs stretched in a gallop. Frame 2: legs gathered under the body. Frame 3: legs stretched again, moss flying but attached.
Row 2 (from top) - animation "toxic_breath", exactly 3 frame(s). Frame 1: rearing the head back, trunk raised, inhaling. Frame 2: head thrust forward, trunk pointing straight right, mouth and nostrils wide open. Frame 3: same, body pushing forward, sustained exhale pose.

Output: one PNG image, 1536 x 1024 px, transparent background, exactly 2 row(s), 3 / 3 frames per row.
```

**Prompt → `assets/sprites/ghilt_p3.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

CHARACTER: GHIL'T, THE SCOURGE OF THE FOREST (corrupted boss): a giant corrupted tapir guardian, massive barrel-shaped body, short thick legs with three-toed hooves, a huge long prehensile trunk-snout drooping down and dripping thick glowing toxic-green moss slime (drips stay attached to the snout), small mean glowing green eyes, dark slate-blue and charcoal hide with faint pale ancient rune patterns (a big spiral rune on the flank), the whole back covered by a thick carpet of glowing toxic moss with twisted roots and small sickly fungi growing out of the spine, cracked bark-like plates on the shoulders. Pixel-art style like Kainati and the bear.

SPRITE SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background. Exactly 2 horizontal row(s); each row is ONE animation, read left to right. Frames are laid out on an invisible regular grid: each row is a horizontal band about 512 px tall, each frame cell is about 512 px wide, and each pose is centered horizontally in its cell with the feet (or lowest point) on the same baseline within a row. Leave at least 40 px of empty transparent space between neighboring frames and at least 60 px of empty transparent space between rows: no part of a frame (hair, tail, cape, weapon, trunk, legs) may touch or overlap another frame or reach into another row. Every frame is ONE single connected silhouette: held objects must touch the hand; NO detached particles, sparkles, sweat drops, dust clouds, motion lines, speed lines, impact stars, sound effects or floating debris; NO cast shadow on the ground; NO ground line. Same character, same scale, same proportions and same colors in every frame and every row. Ghil't's body is about 330 px tall (top of back to hooves) and about 450 px long: 3 frames per row, each cell 512 px wide. The character faces RIGHT in every frame. No text, no numbers, no labels, no grid lines, no borders.

ROWS:
Row 1 (from top) - animation "spit", exactly 3 frame(s). Frame 1: trunk curled up and back, cheeks bulging. Frame 2: trunk whipping forward and down. Frame 3: trunk extended forward, a thick blob of moss slime still attached at its tip.
Row 2 (from top) - animation "roar", exactly 3 frame(s). Frame 1: rearing up on hind legs, front legs raised. Frame 2: trunk raised high, mouth wide open roaring. Frame 3: front legs slamming down.

Output: one PNG image, 1536 x 1024 px, transparent background, exactly 2 row(s), 3 / 3 frames per row.
```

**Prompt → `assets/sprites/ghilt_p4.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

CHARACTER: GHIL'T, THE SCOURGE OF THE FOREST (corrupted boss): a giant corrupted tapir guardian, massive barrel-shaped body, short thick legs with three-toed hooves, a huge long prehensile trunk-snout drooping down and dripping thick glowing toxic-green moss slime (drips stay attached to the snout), small mean glowing green eyes, dark slate-blue and charcoal hide with faint pale ancient rune patterns (a big spiral rune on the flank), the whole back covered by a thick carpet of glowing toxic moss with twisted roots and small sickly fungi growing out of the spine, cracked bark-like plates on the shoulders. Pixel-art style like Kainati and the bear.

SPRITE SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background. Exactly 2 horizontal row(s); each row is ONE animation, read left to right. Frames are laid out on an invisible regular grid: each row is a horizontal band about 512 px tall, each frame cell is about 512 px wide, and each pose is centered horizontally in its cell with the feet (or lowest point) on the same baseline within a row. Leave at least 40 px of empty transparent space between neighboring frames and at least 60 px of empty transparent space between rows: no part of a frame (hair, tail, cape, weapon, trunk, legs) may touch or overlap another frame or reach into another row. Every frame is ONE single connected silhouette: held objects must touch the hand; NO detached particles, sparkles, sweat drops, dust clouds, motion lines, speed lines, impact stars, sound effects or floating debris; NO cast shadow on the ground; NO ground line. Same character, same scale, same proportions and same colors in every frame and every row. Ghil't's body is about 330 px tall (top of back to hooves) and about 450 px long: 3 frames per row, each cell 512 px wide. The character faces RIGHT in every frame. No text, no numbers, no labels, no grid lines, no borders.

ROWS:
Row 1 (from top) - animation "hit", exactly 3 frame(s). Frame 1: flinching, head jerked back, eyes squeezed. Frame 2: stumbling sideways, legs splayed. Frame 3: shaking it off, snorting.
Row 2 (from top) - animation "weakened", exactly 3 frame(s). Frame 1: lying on its belly, head on the ground, trunk limp, moss dimmed. Frame 2: same, flanks rising with breath. Frame 3: same, one eye half open, pleading.

Output: one PNG image, 1536 x 1024 px, transparent background, exactly 2 row(s), 3 / 3 frames per row.
```

### [P1] `ghilt_gueri` — Ghil't guéri (le gardien retrouvé)

- **Image(s) à produire** : `assets/sprites/ghilt_gueri.png` (1536x1024)
- **Découpe** : `assets/sprites/ghilt_gueri_frames/ghilt_gueri_row<r>_<c>.png` (auto, `tools/import_codex_assets.py`, mode `blob`)
- **Orientation** : regarde à DROITE — **hauteur source** : ~330 px — **échelle en jeu** : `0.72` (≈ 238 px à l'écran)
- **Anims (manifest)** : `idle` (row 0, 3 fr.), `collapse` (row 1, 3 fr.)

| Rangée (manifest) | Image | Animation | Frames | fps | Poses (gauche → droite) |
|---|---|---|---|---|---|
| 0 | ghilt_gueri.png (rangée image 1) | `idle` (debout, apaisé (boucle)) | 3 | 4 boucle | 1. standing calmly, head raised, trunk relaxed, runes glowing softly / 2. same, flowers on the back swaying / 3. same, eyes half closed, gentle |
| 1 | ghilt_gueri.png (rangée image 2) | `collapse` (s'effondre (coup de lance d'Amanite)) | 3 | 5 | 1. flinching, head jerked up, eyes wide in shock / 2. legs buckling, sinking down / 3. lying on its side, eyes closed, runes dimmed (final pose) |

**Prompt → `assets/sprites/ghilt_gueri.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

CHARACTER: GHIL'T HEALED (the forest guardian restored): the same giant tapir silhouette as Ghil't but clean and noble: dusky blue-grey hide with a white saddle marking like a Malayan tapir, the ancient spiral runes glowing soft cyan, young green leaves, moss-free grass tufts and small white flowers growing on its back, gentle golden eyes, trunk relaxed and clean. Peaceful and majestic.

SPRITE SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background. Exactly 2 horizontal row(s); each row is ONE animation, read left to right. Frames are laid out on an invisible regular grid: each row is a horizontal band about 512 px tall, each frame cell is about 512 px wide, and each pose is centered horizontally in its cell with the feet (or lowest point) on the same baseline within a row. Leave at least 40 px of empty transparent space between neighboring frames and at least 60 px of empty transparent space between rows: no part of a frame (hair, tail, cape, weapon, trunk, legs) may touch or overlap another frame or reach into another row. Every frame is ONE single connected silhouette: held objects must touch the hand; NO detached particles, sparkles, sweat drops, dust clouds, motion lines, speed lines, impact stars, sound effects or floating debris; NO cast shadow on the ground; NO ground line. Same character, same scale, same proportions and same colors in every frame and every row. Exactly the same size as Ghil't: body about 330 px tall and 450 px long, 3 frames per row in 512 px cells. The character faces RIGHT in every frame. No text, no numbers, no labels, no grid lines, no borders.

ROWS:
Row 1 (from top) - animation "idle", exactly 3 frame(s). Frame 1: standing calmly, head raised, trunk relaxed, runes glowing softly. Frame 2: same, flowers on the back swaying. Frame 3: same, eyes half closed, gentle.
Row 2 (from top) - animation "collapse", exactly 3 frame(s). Frame 1: flinching, head jerked up, eyes wide in shock. Frame 2: legs buckling, sinking down. Frame 3: lying on its side, eyes closed, runes dimmed (final pose).

Output: one PNG image, 1536 x 1024 px, transparent background, exactly 2 row(s), 3 / 3 frames per row.
```

### [P1] `vfx_soin_papillon` — VFX - soin des papillons (compétence papillon)

- **Image(s) à produire** : `assets/vfx/vfx_soin_papillon.png` (1536x1024)
- **Découpe** : `assets/vfx/vfx_soin_papillon_frames/vfx_soin_papillon_row<r>_<c>.png` (auto, `tools/import_codex_assets.py`, mode `grid`)
- **Alignement** : `center` — **échelle en jeu** : `0.34`
- **Anims (manifest)** : `swirl` (row 0, 4 fr.), `burst` (row 1, 4 fr.)

| Rangée (manifest) | Image | Animation | Frames | fps | Poses (gauche → droite) |
|---|---|---|---|---|---|
| 0 | vfx_soin_papillon.png (rangée image 1) | `swirl` (tourbillon (boucle)) | 4 | 12 boucle | 1. 6 butterflies spiralling in a ring, wings up / 2. ring rotated 45 degrees, wings down / 3. ring rotated 90 degrees, wings up, glow brighter / 4. ring rotated 135 degrees, wings down |
| 1 | vfx_soin_papillon.png (rangée image 2) | `burst` (éclat final) | 4 | 12 | 1. butterflies converging to the center, bright core / 2. flash of mint-green light, butterflies bursting outward / 3. butterflies scattered wide, fading / 4. a few faint motes and one butterfly fading out |

**Prompt → `assets/vfx/vfx_soin_papillon.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

EFFECT: A healing magic effect: a swirl of small glowing cyan and pale-green butterflies and soft light motes spiralling around an empty center, with a translucent mint-green glow.

EFFECT SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background (alpha), NO black or dark backdrop. Exactly 2 horizontal row(s) of equal height (512 px each); row r is ONE animation read left to right. Divide each row into equal cells exactly 384 px wide (cell boundaries at regular intervals from the left edge). Each frame of the effect is drawn centered in the middle of its cell and stays fully INSIDE its cell with at least 30 px of empty margin on every side: nothing crosses a cell boundary. Particles may be separate pieces, but every piece of a frame stays inside that frame's cell. Same effect scale and same palette in every frame. No character, no ground, no scenery, no text, no grid lines, no borders.

ROWS:
Row 1 (from top) - "swirl", exactly 4 frames. Frame 1: 6 butterflies spiralling in a ring, wings up. Frame 2: ring rotated 45 degrees, wings down. Frame 3: ring rotated 90 degrees, wings up, glow brighter. Frame 4: ring rotated 135 degrees, wings down.
Row 2 (from top) - "burst", exactly 4 frames. Frame 1: butterflies converging to the center, bright core. Frame 2: flash of mint-green light, butterflies bursting outward. Frame 3: butterflies scattered wide, fading. Frame 4: a few faint motes and one butterfly fading out.

Output: one PNG image, 1536 x 1024 px, transparent background, 4 / 4 frames per row.
```

### [P1] Planche `objets_A` — Objets du scénario (planche A)

- **Image à produire** : `assets/_codex_src/objets_A.png` (1536x1024), grille 3 col. x 2 rang.
- **Découpe auto** : une cellule = un fichier (rognage alpha + normalisation de taille).

| Cellule | ID | Fichier final | Taille normalisée | Échelle |
|---|---|---|---|---|
| 0 | `pierre` | `assets/items/objets/pierre.png` | fit 256 | 0.16 |
| 1 | `idole` | `assets/items/objets/idole.png` | fit 256 | 0.16 |
| 2 | `idole_fragment` | `assets/items/objets/idole_fragment.png` | fit 256 | 0.16 |
| 3 | `talisman_ours` | `assets/items/objets/talisman_ours.png` | fit 256 | 0.16 |
| 4 | `talisman_singe` | `assets/items/objets/talisman_singe.png` | fit 256 | 0.16 |
| 5 | `totem_poche_casse` | `assets/items/objets/totem_poche_casse.png` | fit 256 | 0.16 |

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

OBJECT SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background (alpha), no backdrop. Divide the canvas into an invisible regular grid of 3 column(s) x 2 row(s) of equal cells (512 x 512 px each). Draw exactly ONE object per cell, centered in its cell, filling about 70% of the cell, with at least 40 px of empty transparent margin on every side: no object touches another or crosses its cell boundary. Each object is one connected piece (no detached sparkles or particles), no cast shadow, no ground, no text, no labels, no grid lines. Objects are drawn in a slight side / three-quarter view, consistent lighting from the upper left.

CELLS (reading order):
Cell row 1, column 1: a rough grey throwing rock the size of a fist, with a few lighter chips and a tiny moss spot.
Cell row 1, column 2: the Emerald Grove idol: a small carved statuette of green jade-like stone showing a seated forest spirit with a leaf crown, gold inlays, sitting on a round wooden base, softly glowing green eyes.
Cell row 1, column 3: a broken shard of the same green jade idol (a piece of the leaf crown and head), cracked edges, faint glow.
Cell row 2, column 1: the BEAR talisman: a round wooden medallion carved with a bear paw, polished amber inlay, hanging from a short braided leather cord with two wooden beads.
Cell row 2, column 2: the MONKEY talisman: a round wooden medallion carved with a curled monkey tail spiral, a small turquoise inlay, short braided vine cord with beads.
Cell row 2, column 3: a broken POCKET TOTEM: a small carved wooden mini-totem (hand-sized) topped with a butterfly carving, cracked down the middle, dull grey-brown, its runes dark and lifeless.

Output: one PNG image, 1536 x 1024 px, transparent background, 6 objects.
```

### [P1] Planche `objets_B` — Objets du scénario (planche B)

- **Image à produire** : `assets/_codex_src/objets_B.png` (1536x1024), grille 3 col. x 2 rang.
- **Découpe auto** : une cellule = un fichier (rognage alpha + normalisation de taille).

| Cellule | ID | Fichier final | Taille normalisée | Échelle |
|---|---|---|---|---|
| 0 | `totem_poche_actif` | `assets/items/objets/totem_poche_actif.png` | fit 256 | 0.16 |
| 1 | `bocal_antidote` | `assets/items/objets/bocal_antidote.png` | fit 256 | 0.16 |
| 2 | `repulsif` | `assets/items/objets/repulsif.png` | fit 256 | 0.16 |
| 3 | `fleur_resistante` | `assets/items/objets/fleur_resistante.png` | fit 256 | 0.16 |
| 4 | `carte_galter` | `assets/items/objets/carte_galter.png` | fit 256 | 0.16 |
| 5 | `lance_amanite` | `assets/items/objets/lance_amanite.png` | fit 256 | 0.16 |

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

OBJECT SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background (alpha), no backdrop. Divide the canvas into an invisible regular grid of 3 column(s) x 2 row(s) of equal cells (512 x 512 px each). Draw exactly ONE object per cell, centered in its cell, filling about 70% of the cell, with at least 40 px of empty transparent margin on every side: no object touches another or crosses its cell boundary. Each object is one connected piece (no detached sparkles or particles), no cast shadow, no ground, no text, no labels, no grid lines. Objects are drawn in a slight side / three-quarter view, consistent lighting from the upper left.

CELLS (reading order):
Cell row 1, column 1: the same POCKET TOTEM repaired and active: crack sealed with glowing cyan light, butterfly carving glowing cyan and pale green, runes lit.
Cell row 1, column 2: a small round glass jar with a cork and twine, filled with a glowing mint-green and cyan liquid with tiny light motes inside.
Cell row 1, column 3: a small leather-wrapped gourd flask with a wooden stopper, a pale white-yellow flower tied on it, a few drops of golden liquid on the neck.
Cell row 2, column 1: the RESISTANT FLOWER: a pure white flower with five large petals and a glowing golden-white heart, healthy bright-green stem and two leaves, roots in a small clump of clean earth; it radiates purity.
Cell row 2, column 2: Galter's map as an inventory item: a rolled-up parchment scroll tied with a cord, a corner partly unrolled showing scribbles and arrows (no readable text).
Cell row 2, column 3: Amanite's spear: a long wooden shaft wrapped with red cloth, a leaf-shaped black obsidian blade, a small tuft of black feathers; drawn horizontally, pointing to the right, filling the cell width.

Output: one PNG image, 1536 x 1024 px, transparent background, 6 objects.
```

### [P1] Planche `mousse_amas` — Amas de mousse (intact / fissuré)

- **Image à produire** : `assets/_codex_src/mousse_amas.png` (1536x1024), grille 2 col. x 1 rang.
- **Découpe auto** : une cellule = un fichier (rognage alpha + normalisation de taille).

| Cellule | ID | Fichier final | Taille normalisée | Échelle |
|---|---|---|---|---|
| 0 | `mousse_amas_intact` | `assets/items/objets/mousse_amas_intact.png` | fit 512 | 0.25 |
| 1 | `mousse_amas_fissure` | `assets/items/objets/mousse_amas_fissure.png` | fit 512 | 0.25 |

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

OBJECT SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background (alpha), no backdrop. Divide the canvas into an invisible regular grid of 2 column(s) x 1 row(s) of equal cells (768 x 1024 px each). Draw exactly ONE object per cell, centered in its cell, filling about 70% of the cell, with at least 40 px of empty transparent margin on every side: no object touches another or crosses its cell boundary. Each object is one connected piece (no detached sparkles or particles), no cast shadow, no ground, no text, no labels, no grid lines. Objects are drawn in a slight side / three-quarter view, consistent lighting from the upper left.

CELLS (reading order):
Cell row 1, column 1: a dense waist-high MOUND of toxic moss blocking a path: lumpy glowing toxic-green moss over dark roots, slime drips, small sickly mushrooms, resting flat on the ground.
Cell row 1, column 2: EXACTLY the same moss mound, same shape and size, but cracked: deep glowing fissures of white-gold light across it, chunks starting to break off (still attached), moss dimmed.

Output: one PNG image, 1536 x 1024 px, transparent background, 2 objects.
```

### [P1] Planche `totems_singe` — Totem du singe (éteint / allumé)

- **Image à produire** : `assets/_codex_src/totems_singe.png` (1536x1024), grille 2 col. x 1 rang.
- **Découpe auto** : une cellule = un fichier (rognage alpha + normalisation de taille).

| Cellule | ID | Fichier final | Taille normalisée | Échelle |
|---|---|---|---|---|
| 0 | `totem_monkey_dim` | `assets/items/totem_frames/totem_monkey_dim.png` | height 754 | 0.35 |
| 1 | `totem_monkey_lit` | `assets/items/totem_frames/totem_monkey_lit.png` | height 754 | 0.35 |

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

MATCH EXACTLY the existing totem series of the game (wolf / octopus / eagle totems): same proportions, same carved brown wood, same vine spiral wrapping the pole, same round medallion in the middle, same leaves and grey stones at the base, same cel-shaded style with thick dark outlines. The monkey head replaces the animal head at the top. Each totem pair = unlit (dim) and lit.

OBJECT SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background (alpha), no backdrop. Divide the canvas into an invisible regular grid of 2 column(s) x 1 row(s) of equal cells (768 x 1024 px each). Draw exactly ONE object per cell, centered in its cell, filling about 70% of the cell, with at least 40 px of empty transparent margin on every side: no object touches another or crosses its cell boundary. Each object is one connected piece (no detached sparkles or particles), no cast shadow, no ground, no text, no labels, no grid lines. Objects are drawn in a slight side / three-quarter view, consistent lighting from the upper left. Each totem is a tall vertical pole filling about 80% of the canvas height (about 820 px tall and 250 px wide), standing upright, both totems exactly the same height and shape, with a wide empty transparent gap between them.

CELLS (reading order):
Cell row 1, column 1: the MONKEY totem, UNLIT: a tall carved wooden totem pole topped by a monkey head (round ears, wise brow, small leaves), a round medallion in the middle with a carved SPIRAL-TAIL symbol in pale beige, vines spiralling around the pole, leaves and grey stones at the base.
Cell row 1, column 2: the SAME monkey totem, LIT: identical shape, the eyes and the spiral-tail medallion glowing luminous green, a glowing green zigzag crack running down the pole.

Output: one PNG image, 1536 x 1024 px, transparent background, 2 objects.
```

### [P1] `liane` — Liane (segment vertical tileable)

- **Image à produire** : `assets/_codex_src/liane.png` (1024x1536) → **fichier final** `assets/items/objets/liane.png` (normalisation `height` 512) — échelle `0.25`

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

A single vertical hanging jungle VINE segment, perfectly vertical, centered horizontally, running from the very top edge to the very bottom edge of the canvas, seamlessly tileable vertically (the top and bottom ends match exactly so copies stack without a seam). A thick twisted green-brown liana about 120 px wide with a few leaves and small knots attached to it, no flowers. Nothing else on the canvas.

Output: one PNG image, 1024 x 1536 px, transparent background.
```

### [P1] `mousse_mur` — Mur de mousse (bloque un passage, ouvert par le répulsif)

- **Image à produire** : `assets/_codex_src/mousse_mur.png` (1024x1536) → **fichier final** `assets/items/objets/mousse_mur.png` (normalisation `fit` 768) — échelle `0.25`

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

A tall WALL of living toxic moss blocking a forest passage, about two thirds as wide as it is tall, standing on a flat bottom edge: thick glowing toxic-green moss curtains hanging over a mass of dark twisted roots, slime drips, sickly pale mushrooms, a few dead leaves caught in it. Menacing, organic, clearly impassable. Flat bottom so it sits on the ground.

Output: one PNG image, 1024 x 1536 px, transparent background.
```

### [P1] `dialogue_box` — Boîte de dialogue (9-slice)

- **Image à produire** : `assets/_codex_src/dialogue_box.png` (1536x1024) → **fichier final** `assets/ui/dialogue_box.png` (normalisation `trim` ) — échelle `1`
- **9-slice** : bordures ~120 px (à ajuster après génération dans `ITEM_MANIFEST.dialogue_box.nineSlice`).

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

A wide horizontal DIALOGUE BOX panel for a game UI, 9-slice friendly: a dark wooden plank panel (deep brown-violet, semi-dark so white text is readable on it) framed by a border of twisted brown vines and carved wood, about 90 px thick, with small green leaves and one tiny glowing cyan mushroom decorating ONLY the four corners. The border must be identical and uniform along each straight edge (no unique ornaments in the middle of the edges) so the panel can be stretched by 9-slicing. The panel fills the canvas with about 30 px of transparent margin around it. Inner area completely plain, no text, no portrait.

Output: one PNG image, 1536 x 1024 px, transparent background.
```

### [P1] Portraits de dialogue (8 images)

- **Images à produire** : `assets/_codex_src/portrait_<id>.png` (1024x1024) → **finaux** `assets/ui/portraits/<id>.png` (512x512, auto). Échelle en jeu `0.25` (128 px).
- Même cadrage pour tous : buste, tête 3/4 vers la DROITE, fond transparent. Générer dans la même session Codex pour garder la cohérence.

**Prompt → `assets/_codex_src/portrait_agarica.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

A square character PORTRAIT for a dialogue box (bust from the chest up), a slightly worried but determined look, hood down, head turned three-quarter toward the RIGHT, centered, the head filling about half of the canvas, shoulders cut at the bottom edge. Clean cel-shaded anime chibi style matching the in-game sprites, thick outlines. Fully transparent background (no frame, no backdrop), no text.

CHARACTER: AGARICA (the heroine): a petite teenage female druid, chibi proportions (about 2.5 to 3 heads tall), pointed elf ears, big green eyes, short messy bright red hair, dark-green hooded cape embroidered with leaf and vine patterns and closed by a round silver clasp at the collar, sleeveless beige tunic, brown belt with a gold buckle, dark grey trousers, brown leather boots, black fingerless mittens, a pink-red spiral tattoo on her bare upper arm, a small silver dagger sheathed on her belt. Soft anime cel-shaded chibi look, same design as the existing game sprite.

Output: one PNG image, 1024 x 1024 px, transparent background.
```

**Prompt → `assets/_codex_src/portrait_xara.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

A square character PORTRAIT for a dialogue box (bust from the chest up), a friendly curious look with a hint of mystery in the eyes, head turned three-quarter toward the RIGHT, centered, the head filling about half of the canvas, shoulders cut at the bottom edge. Clean cel-shaded anime chibi style matching the in-game sprites, thick outlines. Fully transparent background (no frame, no backdrop), no text.

CHARACTER: XARA (spider companion): a fluffy cute-but-slightly-uncanny spider, dark plum fur with pink-magenta stripes and magenta diamond (lozenge) markings on the round abdomen, two big glossy green main eyes plus small secondary eyes, small pink fangs, eight furry dark plum legs with magenta joints. Same design as the existing game sprite.

Output: one PNG image, 1024 x 1024 px, transparent background.
```

**Prompt → `assets/_codex_src/portrait_amanite.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

A square character PORTRAIT for a dialogue box (bust from the chest up), a proud intense look, a faint smirk, head turned three-quarter toward the RIGHT, centered, the head filling about half of the canvas, shoulders cut at the bottom edge. Clean cel-shaded anime chibi style matching the in-game sprites, thick outlines. Fully transparent background (no frame, no backdrop), no text.

CHARACTER: AMANITE (Agarica's best friend, a tiefling): young woman the same age as Agarica, chibi proportions, slightly taller (about 1.1x Agarica), bright crimson-red skin, two long glossy black horns sweeping back from her forehead, very long straight sleek black hair down to her waist with a blunt fringe, golden-amber eyes, a thin red tail with a spade tip, dark purple sleeveless wrap top, black leather bracers, burgundy sash, short dark-brown skirt over black leggings, wrapped leather boots. A wooden spear with a leaf-shaped black obsidian blade is strapped diagonally on her back when not in her hands. Proud, impulsive, intense expression.

Output: one PNG image, 1024 x 1024 px, transparent background.
```

**Prompt → `assets/_codex_src/portrait_pere_chef.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

A square character PORTRAIT for a dialogue box (bust from the chest up), a stern but loving look, head turned three-quarter toward the RIGHT, centered, the head filling about half of the canvas, shoulders cut at the bottom edge. Clean cel-shaded anime chibi style matching the in-game sprites, thick outlines. Fully transparent background (no frame, no backdrop), no text.

CHARACTER: THE CHIEF OF THE EMERALD GROVE (Agarica's father): an elderly male druid, chibi but taller than Agarica (about 1.2x her height), long white beard braided with small wooden beads, greying red hair (family resemblance), pointed elf ears, kind but stern green eyes, long deep-green robe with gold leaf embroidery, brown fur mantle on the shoulders, a circlet of small antlers and leaves on his head, a gnarled wooden staff topped with a green crystal wrapped in leaves (the crystal glows softly but no detached light rays).

Output: one PNG image, 1024 x 1024 px, transparent background.
```

**Prompt → `assets/_codex_src/portrait_galter.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

A square character PORTRAIT for a dialogue box (bust from the chest up), a tired half-smile, one eyebrow raised, head turned three-quarter toward the RIGHT, centered, the head filling about half of the canvas, shoulders cut at the bottom edge. Clean cel-shaded anime chibi style matching the in-game sprites, thick outlines. Fully transparent background (no frame, no backdrop), no text.

CHARACTER: GALTER (halfling ranger) - ORIGINAL design, must NOT resemble Geralt of Rivia (NO white hair, NO witcher medallion, NO sword on the back, NO eye scar, NO yellow cat eyes): a short stocky middle-aged halfling (about 0.85x Agarica's height), tired hunter look with heavy-lidded brown eyes and bags under them, round face, round nose, small round non-pointed ears, messy curly chestnut-brown hair in a short stubby ponytail, short scruffy auburn beard, dark blue-black geometric tribal zigzag tattoos on both cheeks and forearms, patched moss-green hooded tunic, brown leather vest covered with pouches, a satchel stuffed with rolled map scrolls, a short wooden bow and a quiver on his back, bare big hairy halfling feet. Slightly comic, clumsy-but-proud attitude.

Output: one PNG image, 1024 x 1024 px, transparent background.
```

**Prompt → `assets/_codex_src/portrait_morgat.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

A square character PORTRAIT for a dialogue box (bust from the chest up), a warm wise smile, a butterfly on her hair, head turned three-quarter toward the RIGHT, centered, the head filling about half of the canvas, shoulders cut at the bottom edge. Clean cel-shaded anime chibi style matching the in-game sprites, thick outlines. Fully transparent background (no frame, no backdrop), no text.

CHARACTER: MORGAT (the butterfly healer): an elderly gentle healer woman, chibi proportions (about 1.1x Agarica's height), slightly hunched, warm tan skin, wild silver hair gathered in a big bun pierced with wooden pins, a headband with two feathery moth antennae, a shawl shaped like folded butterfly wings with teal, orange and violet patterns, layered earthy-brown skirts, a belt of little herb pouches and glass vials, two or three small glowing cyan butterflies perched directly ON her shawl and hair (touching her, never floating free).

Output: one PNG image, 1024 x 1024 px, transparent background.
```

**Prompt → `assets/_codex_src/portrait_kainati.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

A square character PORTRAIT for a dialogue box (bust from the chest up), a furious roaring face, glowing green eyes, head turned three-quarter toward the RIGHT, centered, the head filling about half of the canvas, shoulders cut at the bottom edge. Clean cel-shaded anime chibi style matching the in-game sprites, thick outlines. Fully transparent background (no frame, no backdrop), no text.

CHARACTER: KAINATI, KING OF THE SIMIANS (corrupted boss) - must match the existing reference art exactly: a huge gorilla-like ape king, thick shaggy pure-white fur with black outlines, dark grey skin on face, chest, hands and feet, glowing green eyes, angry heavy brow, red tribal paint stripes on his cheek, a tall carved Maya-like stone crown/headdress made of grey-beige stone blocks with spiral glyphs, thick brown vine bracelets wrapped around wrists and ankles, patches of glowing toxic-green moss stuck in his fur and on his crown, dripping like slime with tiny sparkle highlights. Knuckle-walking stance. Clearly pixel-art style like the game's bear and toad.

Output: one PNG image, 1024 x 1024 px, transparent background.
```

**Prompt → `assets/_codex_src/portrait_ghilt.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

A square character PORTRAIT for a dialogue box (bust from the chest up), a menacing head shot, trunk dripping toxic moss, glowing green eye, head turned three-quarter toward the RIGHT, centered, the head filling about half of the canvas, shoulders cut at the bottom edge. Clean cel-shaded anime chibi style matching the in-game sprites, thick outlines. Fully transparent background (no frame, no backdrop), no text.

CHARACTER: GHIL'T, THE SCOURGE OF THE FOREST (corrupted boss): a giant corrupted tapir guardian, massive barrel-shaped body, short thick legs with three-toed hooves, a huge long prehensile trunk-snout drooping down and dripping thick glowing toxic-green moss slime (drips stay attached to the snout), small mean glowing green eyes, dark slate-blue and charcoal hide with faint pale ancient rune patterns (a big spiral rune on the flank), the whole back covered by a thick carpet of glowing toxic moss with twisted roots and small sickly fungi growing out of the spine, cracked bark-like plates on the shoulders. Pixel-art style like Kainati and the bear.

Output: one PNG image, 1024 x 1024 px, transparent background.
```

### [P1] `fond_trou_sombre` — fond parallax

- **Image à produire** : `assets/_codex_src/fond_trou_sombre.png` (2172x724) → **final** `assets/decors/fonds/fond_trou_sombre.png` (2079x756, recadrage « cover » auto, comme `plan4_ciel.png`). Opaque. Répété horizontalement par `tileSprite` => bords gauche/droit raccord.

```text
A wide PARALLAX BACKGROUND painting for a 2D side-scrolling platformer, a DARK PIT underground: almost black cave walls of roots and earth, very dark indigo, a faint opening of light far above, a few small glowing cyan mushrooms and faint fireflies; very dark but readable. Painterly cel-shaded style matching the game (thick shapes, soft gradients, slightly darker and less saturated than the gameplay foreground so characters stay readable). NO characters, NO creatures, NO text. The image must TILE SEAMLESSLY HORIZONTALLY: the left edge and the right edge must match perfectly (same horizon height, same colors) because the game repeats it side by side. Keep the bottom quarter darker and simpler (ground will be drawn over it). Fully opaque, no transparency. Output: one PNG, 2172 x 724 px (wide 3:1).
```

## P2 — important

### [P2] `transfo_singe` — Transformation humaine -> singe

- **Image(s) à produire** : `assets/sprites/transfo_singe.png` (1536x1024)
- **Découpe** : `assets/sprites/transfo_singe_frames/transfo_singe_row<r>_<c>.png` (auto, `tools/import_codex_assets.py`, mode `blob`)
- **Orientation** : regarde à DROITE — **hauteur source** : ~250 px — **échelle en jeu** : `0.34` (≈ 85 px à l'écran)
- **Notes** : Mêmes conventions que les transformations existantes (assets/sprites/transformation/). Le tourbillon de feuilles doit rester COLLÉ à la silhouette.
- **Anims (manifest)** : `transform` (row 0, 4 fr.)

| Rangée (manifest) | Image | Animation | Frames | fps | Poses (gauche → droite) |
|---|---|---|---|---|---|
| 0 | transfo_singe.png (rangée image 1) | `transform` (humaine -> singe) | 4 | 10 | 1. Agarica crouching, wrapped in a tight swirl of green leaves that touches her body, eyes glowing green / 2. half-transformed silhouette shrinking: red fur spreading, tail appearing, leaves wrapped around it / 3. small monkey shape still wrapped in a few leaves touching the body, eyes glowing / 4. the monkey form crouched on all fours, clean, ready (final pose) |

**Prompt → `assets/sprites/transfo_singe.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

CHARACTER: AGARICA (the heroine): a petite teenage female druid, chibi proportions (about 2.5 to 3 heads tall), pointed elf ears, big green eyes, short messy bright red hair, dark-green hooded cape embroidered with leaf and vine patterns and closed by a round silver clasp at the collar, sleeveless beige tunic, brown belt with a gold buckle, dark grey trousers, brown leather boots, black fingerless mittens, a pink-red spiral tattoo on her bare upper arm, a small silver dagger sheathed on her belt. Soft anime cel-shaded chibi look, same design as the existing game sprite.

TARGET FORM (last frame): AGARICA'S MONKEY FORM: a small agile capuchin-like monkey that is clearly Agarica transformed: reddish-orange fur matching her bright red messy hair (a messy tuft on top of the head), cream-beige face, muzzle and chest, big green eyes, slightly pointed ears, a long curling prehensile tail, a short dark-green leafy mane of fur over the shoulders like a little hood, fastened by the same round silver clasp, a pink-red spiral marking on one upper arm. About the size of a cat. Clean anime cel-shaded chibi look, consistent with Agarica's other animal forms.

SPRITE SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background. Exactly 1 horizontal row(s); each row is ONE animation, read left to right. Frames are laid out on an invisible regular grid: each row is a horizontal band about 1024 px tall, each frame cell is about 384 px wide, and each pose is centered horizontally in its cell with the feet (or lowest point) on the same baseline within a row. Leave at least 40 px of empty transparent space between neighboring frames and at least 60 px of empty transparent space between rows: no part of a frame (hair, tail, cape, weapon, trunk, legs) may touch or overlap another frame or reach into another row. Every frame is ONE single connected silhouette: held objects must touch the hand; NO detached particles, sparkles, sweat drops, dust clouds, motion lines, speed lines, impact stars, sound effects or floating debris; NO cast shadow on the ground; NO ground line. Same character, same scale, same proportions and same colors in every frame and every row. Agarica's standing height is about 250 px in frame 1; the monkey in the last frame is about 180 px tall crouched. The character faces RIGHT in every frame. No text, no numbers, no labels, no grid lines, no borders. The single row is vertically centered on the canvas.

ROWS:
Row 1 (from top) - animation "transform", exactly 4 frame(s). Frame 1: Agarica crouching, wrapped in a tight swirl of green leaves that touches her body, eyes glowing green. Frame 2: half-transformed silhouette shrinking: red fur spreading, tail appearing, leaves wrapped around it. Frame 3: small monkey shape still wrapped in a few leaves touching the body, eyes glowing. Frame 4: the monkey form crouched on all fours, clean, ready (final pose).

Output: one PNG image, 1536 x 1024 px, transparent background, exactly 1 row(s), 4 frames per row.
```

### [P2] `habitant_druide` — Habitant druide (gratte / brûle la mousse)

- **Image(s) à produire** : `assets/sprites/habitant_druide.png` (1536x1024)
- **Découpe** : `assets/sprites/habitant_druide_frames/habitant_druide_row<r>_<c>.png` (auto, `tools/import_codex_assets.py`, mode `blob`)
- **Orientation** : regarde à DROITE — **hauteur source** : ~275 px — **échelle en jeu** : `0.34` (≈ 94 px à l'écran)
- **Anims (manifest)** : `idle` (row 0, 4 fr.), `scrape` (row 1, 4 fr.), `burn` (row 2, 4 fr.)

| Rangée (manifest) | Image | Animation | Frames | fps | Poses (gauche → droite) |
|---|---|---|---|---|---|
| 0 | habitant_druide.png (rangée image 1) | `idle` (repos (boucle)) | 4 | 5 boucle | 1. standing, holding a wooden scraper, wiping forehead / 2. same, sigh, shoulders down / 3. same, looking at the scraper / 4. same, coughing into a fist |
| 1 | habitant_druide.png (rangée image 2) | `scrape` (gratte un tronc (boucle)) | 4 | 8 boucle | 1. facing right, arms raised holding a wooden scraper against an imagined tree trunk (no trunk drawn) / 2. scraping downward, body leaning in / 3. scraper at the bottom of the stroke, effort face / 4. pulling back up |
| 2 | habitant_druide.png (rangée image 3) | `burn` (brûle la mousse à la torche (boucle)) | 4 | 8 boucle | 1. holding a burning torch forward and down toward the ground (flame attached to the torch) / 2. torch lowered, flame flickering / 3. torch swept to the side / 4. torch raised a little, coughing |

**Prompt → `assets/sprites/habitant_druide.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

CHARACTER: EMERALD GROVE VILLAGER: a wood-elf druid commoner, chibi proportions (about 1.1x Agarica's height), pointed ears, simple green and brown linen tunic with leaf trims, rolled sleeves, brown apron or sash, leather boots, friendly but tired face. The grove's emblem is a white tree on a green banner.

SPRITE SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background. Exactly 3 horizontal row(s); each row is ONE animation, read left to right. Frames are laid out on an invisible regular grid: each row is a horizontal band about 341 px tall, each frame cell is about 384 px wide, and each pose is centered horizontally in its cell with the feet (or lowest point) on the same baseline within a row. Leave at least 40 px of empty transparent space between neighboring frames and at least 60 px of empty transparent space between rows: no part of a frame (hair, tail, cape, weapon, trunk, legs) may touch or overlap another frame or reach into another row. Every frame is ONE single connected silhouette: held objects must touch the hand; NO detached particles, sparkles, sweat drops, dust clouds, motion lines, speed lines, impact stars, sound effects or floating debris; NO cast shadow on the ground; NO ground line. Same character, same scale, same proportions and same colors in every frame and every row. The villager is about 275 px tall. Tools and torch flame stay attached to the hands. The character faces RIGHT in every frame. No text, no numbers, no labels, no grid lines, no borders.

ROWS:
Row 1 (from top) - animation "idle", exactly 4 frame(s). Frame 1: standing, holding a wooden scraper, wiping forehead. Frame 2: same, sigh, shoulders down. Frame 3: same, looking at the scraper. Frame 4: same, coughing into a fist.
Row 2 (from top) - animation "scrape", exactly 4 frame(s). Frame 1: facing right, arms raised holding a wooden scraper against an imagined tree trunk (no trunk drawn). Frame 2: scraping downward, body leaning in. Frame 3: scraper at the bottom of the stroke, effort face. Frame 4: pulling back up.
Row 3 (from top) - animation "burn", exactly 4 frame(s). Frame 1: holding a burning torch forward and down toward the ground (flame attached to the torch). Frame 2: torch lowered, flame flickering. Frame 3: torch swept to the side. Frame 4: torch raised a little, coughing.

Output: one PNG image, 1536 x 1024 px, transparent background, exactly 3 row(s), 4 / 4 / 4 frames per row.
```

### [P2] `habitant_porteur` — Habitant porteur de seaux

- **Image(s) à produire** : `assets/sprites/habitant_porteur.png` (1536x1024)
- **Découpe** : `assets/sprites/habitant_porteur_frames/habitant_porteur_row<r>_<c>.png` (auto, `tools/import_codex_assets.py`, mode `blob`)
- **Orientation** : regarde à DROITE — **hauteur source** : ~275 px — **échelle en jeu** : `0.34` (≈ 94 px à l'écran)
- **Anims (manifest)** : `walk_carry` (row 0, 5 fr.), `idle` (row 1, 4 fr.)

| Rangée (manifest) | Image | Animation | Frames | fps | Poses (gauche → droite) |
|---|---|---|---|---|---|
| 0 | habitant_porteur.png (rangée image 1) | `walk_carry` (marche avec deux seaux d'eau (boucle)) | 5 | 8 boucle | 1. walking right with a wooden yoke on the shoulders, a water bucket hanging from each end / 2. mid-stride, buckets swaying / 3. passing pose / 4. opposite stride, buckets swaying the other way / 5. stride, effort face |
| 1 | habitant_porteur.png (rangée image 2) | `idle` (pause (boucle)) | 4 | 5 boucle | 1. standing with the yoke, buckets resting, catching breath / 2. same, rolling shoulders / 3. same, looking at the water / 4. same, smiling tiredly |

**Prompt → `assets/sprites/habitant_porteur.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

CHARACTER: EMERALD GROVE VILLAGER: a wood-elf druid commoner, chibi proportions (about 1.1x Agarica's height), pointed ears, simple green and brown linen tunic with leaf trims, rolled sleeves, brown apron or sash, leather boots, friendly but tired face. The grove's emblem is a white tree on a green banner.

SPRITE SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background. Exactly 2 horizontal row(s); each row is ONE animation, read left to right. Frames are laid out on an invisible regular grid: each row is a horizontal band about 512 px tall, each frame cell is about 307 px wide, and each pose is centered horizontally in its cell with the feet (or lowest point) on the same baseline within a row. Leave at least 40 px of empty transparent space between neighboring frames and at least 60 px of empty transparent space between rows: no part of a frame (hair, tail, cape, weapon, trunk, legs) may touch or overlap another frame or reach into another row. Every frame is ONE single connected silhouette: held objects must touch the hand; NO detached particles, sparkles, sweat drops, dust clouds, motion lines, speed lines, impact stars, sound effects or floating debris; NO cast shadow on the ground; NO ground line. Same character, same scale, same proportions and same colors in every frame and every row. The villager is about 275 px tall; the two buckets hang from a yoke on the shoulders, touching it. The character faces RIGHT in every frame. No text, no numbers, no labels, no grid lines, no borders. Rows with fewer frames use wider cells (row width divided by that row's frame count).

ROWS:
Row 1 (from top) - animation "walk_carry", exactly 5 frame(s). Frame 1: walking right with a wooden yoke on the shoulders, a water bucket hanging from each end. Frame 2: mid-stride, buckets swaying. Frame 3: passing pose. Frame 4: opposite stride, buckets swaying the other way. Frame 5: stride, effort face.
Row 2 (from top) - animation "idle", exactly 4 frame(s). Frame 1: standing with the yoke, buckets resting, catching breath. Frame 2: same, rolling shoulders. Frame 3: same, looking at the water. Frame 4: same, smiling tiredly.

Output: one PNG image, 1536 x 1024 px, transparent background, exactly 2 row(s), 5 / 4 frames per row.
```

### [P2] `habitant_garde` — Garde du bosquet

- **Image(s) à produire** : `assets/sprites/habitant_garde.png` (1536x1024)
- **Découpe** : `assets/sprites/habitant_garde_frames/habitant_garde_row<r>_<c>.png` (auto, `tools/import_codex_assets.py`, mode `blob`)
- **Orientation** : regarde à DROITE — **hauteur source** : ~285 px — **échelle en jeu** : `0.34` (≈ 97 px à l'écran)
- **Anims (manifest)** : `idle` (row 0, 4 fr.), `push` (row 1, 4 fr.), `walk` (row 2, 5 fr.)

| Rangée (manifest) | Image | Animation | Frames | fps | Poses (gauche → droite) |
|---|---|---|---|---|---|
| 0 | habitant_garde.png (rangée image 1) | `idle` (garde, lance verticale (boucle)) | 4 | 5 boucle | 1. standing at attention, spear upright in the right hand, butt on the ground / 2. same, slight breath / 3. same, eyes glancing / 4. same, gripping tighter |
| 1 | habitant_garde.png (rangée image 2) | `push` (repousse (avec le manche)) | 4 | 10 | 1. spear held horizontally with both hands across the chest / 2. pushing forward with the shaft, front leg bent / 3. full push, arms extended / 4. returning to a guard stance |
| 2 | habitant_garde.png (rangée image 3) | `walk` (marche (boucle)) | 5 | 9 boucle | 1. marching right, spear on the shoulder / 2. mid-stride / 3. passing pose / 4. opposite stride / 5. stride |

**Prompt → `assets/sprites/habitant_garde.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

CHARACTER: EMERALD GROVE GUARD: a wood-elf guard, chibi proportions (about 1.15x Agarica's height), bark-and-leather armor, green tabard with a white tree emblem, a leaf-shaped helmet, a wooden spear with a leaf-shaped steel blade, a round wooden shield strapped on the back.

SPRITE SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background. Exactly 3 horizontal row(s); each row is ONE animation, read left to right. Frames are laid out on an invisible regular grid: each row is a horizontal band about 341 px tall, each frame cell is about 307 px wide, and each pose is centered horizontally in its cell with the feet (or lowest point) on the same baseline within a row. Leave at least 40 px of empty transparent space between neighboring frames and at least 60 px of empty transparent space between rows: no part of a frame (hair, tail, cape, weapon, trunk, legs) may touch or overlap another frame or reach into another row. Every frame is ONE single connected silhouette: held objects must touch the hand; NO detached particles, sparkles, sweat drops, dust clouds, motion lines, speed lines, impact stars, sound effects or floating debris; NO cast shadow on the ground; NO ground line. Same character, same scale, same proportions and same colors in every frame and every row. The guard is about 285 px tall; the spear is held vertically and stays inside the cell. The character faces RIGHT in every frame. No text, no numbers, no labels, no grid lines, no borders. Rows with fewer frames use wider cells (row width divided by that row's frame count).

ROWS:
Row 1 (from top) - animation "idle", exactly 4 frame(s). Frame 1: standing at attention, spear upright in the right hand, butt on the ground. Frame 2: same, slight breath. Frame 3: same, eyes glancing. Frame 4: same, gripping tighter.
Row 2 (from top) - animation "push", exactly 4 frame(s). Frame 1: spear held horizontally with both hands across the chest. Frame 2: pushing forward with the shaft, front leg bent. Frame 3: full push, arms extended. Frame 4: returning to a guard stance.
Row 3 (from top) - animation "walk", exactly 5 frame(s). Frame 1: marching right, spear on the shoulder. Frame 2: mid-stride. Frame 3: passing pose. Frame 4: opposite stride. Frame 5: stride.

Output: one PNG image, 1536 x 1024 px, transparent background, exactly 3 row(s), 4 / 4 / 5 frames per row.
```

### [P2] `clak` — Clak, le crabe totem de Galter

- **Image(s) à produire** : `assets/sprites/clak.png` (1536x1024)
- **Découpe** : `assets/sprites/clak_frames/clak_row<r>_<c>.png` (auto, `tools/import_codex_assets.py`, mode `blob`)
- **Orientation** : regarde à DROITE — **hauteur source** : ~160 px — **échelle en jeu** : `0.19` (≈ 30 px à l'écran)
- **Anims (manifest)** : `idle` (row 0, 4 fr.), `scuttle` (row 1, 4 fr.), `snap` (row 2, 4 fr.)

| Rangée (manifest) | Image | Animation | Frames | fps | Poses (gauche → droite) |
|---|---|---|---|---|---|
| 0 | clak.png (rangée image 1) | `idle` (repos (boucle)) | 4 | 6 boucle | 1. standing, big claw raised proudly / 2. same, eye stalks swiveling / 3. same, small claw clicking / 4. same, big claw lowered |
| 1 | clak.png (rangée image 2) | `scuttle` (court de côté (boucle)) | 4 | 12 boucle | 1. scuttling sideways, legs spread / 2. legs gathered / 3. legs spread the other way / 4. legs gathered, claws up |
| 2 | clak.png (rangée image 3) | `snap` (claque / attrape une flèche) | 4 | 12 | 1. big claw open wide, eyes focused / 2. claw snapping shut / 3. claw closed holding a wooden arrow in its pincer (the arrow touches the claw) / 4. proudly raising the claw with the arrow, smug eyes |

**Prompt → `assets/sprites/clak.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

CHARACTER: CLAK (Galter's totem crab): a small crab with an orange-red shell carved with a pale tribal spiral rune that glows faint teal, one oversized right claw and one small left claw, stalk eyes with green pupils, comically expressive, sturdy little legs.

SPRITE SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background. Exactly 3 horizontal row(s); each row is ONE animation, read left to right. Frames are laid out on an invisible regular grid: each row is a horizontal band about 341 px tall, each frame cell is about 384 px wide, and each pose is centered horizontally in its cell with the feet (or lowest point) on the same baseline within a row. Leave at least 40 px of empty transparent space between neighboring frames and at least 60 px of empty transparent space between rows: no part of a frame (hair, tail, cape, weapon, trunk, legs) may touch or overlap another frame or reach into another row. Every frame is ONE single connected silhouette: held objects must touch the hand; NO detached particles, sparkles, sweat drops, dust clouds, motion lines, speed lines, impact stars, sound effects or floating debris; NO cast shadow on the ground; NO ground line. Same character, same scale, same proportions and same colors in every frame and every row. Clak is about 160 px tall (eyes included) and about 220 px wide. The character faces RIGHT in every frame. No text, no numbers, no labels, no grid lines, no borders.

ROWS:
Row 1 (from top) - animation "idle", exactly 4 frame(s). Frame 1: standing, big claw raised proudly. Frame 2: same, eye stalks swiveling. Frame 3: same, small claw clicking. Frame 4: same, big claw lowered.
Row 2 (from top) - animation "scuttle", exactly 4 frame(s). Frame 1: scuttling sideways, legs spread. Frame 2: legs gathered. Frame 3: legs spread the other way. Frame 4: legs gathered, claws up.
Row 3 (from top) - animation "snap", exactly 4 frame(s). Frame 1: big claw open wide, eyes focused. Frame 2: claw snapping shut. Frame 3: claw closed holding a wooden arrow in its pincer (the arrow touches the claw). Frame 4: proudly raising the claw with the arrow, smug eyes.

Output: one PNG image, 1536 x 1024 px, transparent background, exactly 3 row(s), 4 / 4 / 4 frames per row.
```

### [P2] `kainati_esprit` — Kainati - forme d'esprit ancestral (monde spirituel)

- **Image(s) à produire** : `assets/sprites/kainati_esprit.png` (1536x1024)
- **Découpe** : `assets/sprites/kainati_esprit_frames/kainati_esprit_row<r>_<c>.png` (auto, `tools/import_codex_assets.py`, mode `blob`)
- **Orientation** : regarde à DROITE — **hauteur source** : ~400 px — **échelle en jeu** : `0.54` (≈ 216 px à l'écran)
- **Anims (manifest)** : `idle` (row 0, 4 fr.), `swing` (row 1, 4 fr.)

| Rangée (manifest) | Image | Animation | Frames | fps | Poses (gauche → droite) |
|---|---|---|---|---|---|
| 0 | kainati_esprit.png (rangée image 1) | `idle` (repos serein (boucle)) | 4 | 6 boucle | 1. sitting upright like a wise king, hands on knees, eyes closed / 2. same, light pulsing brighter in the fur / 3. same, eyes opening, gentle look / 4. same, head nodding |
| 1 | kainati_esprit.png (rangée image 2) | `swing` (balancement de liane (démo au joueur)) | 4 | 8 boucle | 1. hanging by one raised hand from an INVISIBLE vine (not drawn), feet to the left / 2. bottom of the arc, body vertical / 3. swung forward, feet to the right, free arm extended / 4. returning, body vertical |

**Prompt → `assets/sprites/kainati_esprit.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

CHARACTER: KAINATI'S ANCESTRAL SPIRIT: the same giant ape king silhouette and stone crown as Kainati but ethereal and pure: fur made of luminous pale cyan and mint-green light with soft white highlights, darker teal outline (still a solid thick outline), calm glowing white-gold eyes, the stone crown faintly glowing with cyan runes, NO moss, NO corruption, a few leaf shapes drifting INSIDE the silhouette. Body opaque enough to read clearly (not see-through).

SPRITE SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background. Exactly 2 horizontal row(s); each row is ONE animation, read left to right. Frames are laid out on an invisible regular grid: each row is a horizontal band about 512 px tall, each frame cell is about 384 px wide, and each pose is centered horizontally in its cell with the feet (or lowest point) on the same baseline within a row. Leave at least 40 px of empty transparent space between neighboring frames and at least 60 px of empty transparent space between rows: no part of a frame (hair, tail, cape, weapon, trunk, legs) may touch or overlap another frame or reach into another row. Every frame is ONE single connected silhouette: held objects must touch the hand; NO detached particles, sparkles, sweat drops, dust clouds, motion lines, speed lines, impact stars, sound effects or floating debris; NO cast shadow on the ground; NO ground line. Same character, same scale, same proportions and same colors in every frame and every row. Same size as Kainati: about 400 px tall in the idle stance. The character faces RIGHT in every frame. No text, no numbers, no labels, no grid lines, no borders.

ROWS:
Row 1 (from top) - animation "idle", exactly 4 frame(s). Frame 1: sitting upright like a wise king, hands on knees, eyes closed. Frame 2: same, light pulsing brighter in the fur. Frame 3: same, eyes opening, gentle look. Frame 4: same, head nodding.
Row 2 (from top) - animation "swing", exactly 4 frame(s). Frame 1: hanging by one raised hand from an INVISIBLE vine (not drawn), feet to the left. Frame 2: bottom of the arc, body vertical. Frame 3: swung forward, feet to the right, free arm extended. Frame 4: returning, body vertical.

Output: one PNG image, 1536 x 1024 px, transparent background, exactly 2 row(s), 4 / 4 frames per row.
```

### [P2] `loup_sanguinaire` — Loup sanguinaire (ennemi)

- **Image(s) à produire** : `assets/sprites/loup_sanguinaire.png` (1536x1024)
- **Découpe** : `assets/sprites/loup_sanguinaire_frames/loup_sanguinaire_row<r>_<c>.png` (auto, `tools/import_codex_assets.py`, mode `blob`)
- **Orientation** : regarde à DROITE — **hauteur source** : ~220 px — **échelle en jeu** : `0.33` (≈ 73 px à l'écran)
- **Anims (manifest)** : `patrol` (row 0, 4 fr.), `charge` (row 1, 4 fr.), `bite` (row 2, 4 fr.)

| Rangée (manifest) | Image | Animation | Frames | fps | Poses (gauche → droite) |
|---|---|---|---|---|---|
| 0 | loup_sanguinaire.png (rangée image 1) | `patrol` (marche de patrouille (boucle)) | 4 | 8 boucle | 1. prowling walk, head low, front-left leg forward / 2. legs passing / 3. front-right leg forward / 4. legs passing, hackles up |
| 1 | loup_sanguinaire.png (rangée image 2) | `charge` (charge (boucle)) | 4 | 14 boucle | 1. full gallop, legs stretched / 2. legs gathered under the body / 3. front legs reaching, back legs pushing / 4. airborne, body stretched |
| 2 | loup_sanguinaire.png (rangée image 3) | `bite` (morsure) | 4 | 12 | 1. crouched, snarling, ears back / 2. lunging forward, jaws wide open / 3. jaws snapping shut, head forward / 4. pulling back, growling |

**Prompt → `assets/sprites/loup_sanguinaire.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

CHARACTER: BLOOD-CRAZED WOLF (enemy): same build and pixel-art style as the game's grey-violet wolf, but fur dark maroon fading to black, matted and spiky, raised hackles, glowing toxic-green moss patches stuck on its back and shoulders dripping like slime, glowing red eyes with a green rim, bared white fangs, lean and feral.

SPRITE SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background. Exactly 3 horizontal row(s); each row is ONE animation, read left to right. Frames are laid out on an invisible regular grid: each row is a horizontal band about 341 px tall, each frame cell is about 384 px wide, and each pose is centered horizontally in its cell with the feet (or lowest point) on the same baseline within a row. Leave at least 40 px of empty transparent space between neighboring frames and at least 60 px of empty transparent space between rows: no part of a frame (hair, tail, cape, weapon, trunk, legs) may touch or overlap another frame or reach into another row. Every frame is ONE single connected silhouette: held objects must touch the hand; NO detached particles, sparkles, sweat drops, dust clouds, motion lines, speed lines, impact stars, sound effects or floating debris; NO cast shadow on the ground; NO ground line. Same character, same scale, same proportions and same colors in every frame and every row. The wolf is about 220 px tall and about 330 px long: 4 frames per row, cells 384 px wide. The character faces RIGHT in every frame. No text, no numbers, no labels, no grid lines, no borders.

ROWS:
Row 1 (from top) - animation "patrol", exactly 4 frame(s). Frame 1: prowling walk, head low, front-left leg forward. Frame 2: legs passing. Frame 3: front-right leg forward. Frame 4: legs passing, hackles up.
Row 2 (from top) - animation "charge", exactly 4 frame(s). Frame 1: full gallop, legs stretched. Frame 2: legs gathered under the body. Frame 3: front legs reaching, back legs pushing. Frame 4: airborne, body stretched.
Row 3 (from top) - animation "bite", exactly 4 frame(s). Frame 1: crouched, snarling, ears back. Frame 2: lunging forward, jaws wide open. Frame 3: jaws snapping shut, head forward. Frame 4: pulling back, growling.

Output: one PNG image, 1536 x 1024 px, transparent background, exactly 3 row(s), 4 / 4 / 4 frames per row.
```

### [P2] `araignee` — Araignée hostile (ennemi)

- **Image(s) à produire** : `assets/sprites/araignee.png` (1536x1024)
- **Découpe** : `assets/sprites/araignee_frames/araignee_row<r>_<c>.png` (auto, `tools/import_codex_assets.py`, mode `blob`)
- **Orientation** : regarde à DROITE — **hauteur source** : ~170 px — **échelle en jeu** : `0.25` (≈ 42 px à l'écran)
- **Anims (manifest)** : `idle` (row 0, 4 fr.), `walk` (row 1, 4 fr.), `attack` (row 2, 4 fr.)

| Rangée (manifest) | Image | Animation | Frames | fps | Poses (gauche → droite) |
|---|---|---|---|---|---|
| 0 | araignee.png (rangée image 1) | `idle` (repos (boucle)) | 4 | 6 boucle | 1. crouched, legs splayed, fangs clicking / 2. body raised slightly / 3. front legs tapping / 4. body lowered |
| 1 | araignee.png (rangée image 2) | `walk` (marche (boucle)) | 4 | 12 boucle | 1. walking right, alternate legs A forward / 2. legs passing / 3. alternate legs B forward / 4. legs passing |
| 2 | araignee.png (rangée image 3) | `attack` (attaque) | 4 | 12 | 1. rearing up, front legs raised, fangs bared / 2. lunging forward, fangs striking / 3. front legs slamming down / 4. recoiling back to crouch |

**Prompt → `assets/sprites/araignee.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

CHARACTER: HOSTILE FOREST SPIDER (enemy): same chibi spider design family as Xara but clearly hostile: dark charcoal-violet chitin with short bristly fur, sharp angular legs, toxic-green glowing stripe markings, six small glowing red eyes, green-moss slime dripping from its abdomen, sharp fangs.

SPRITE SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background. Exactly 3 horizontal row(s); each row is ONE animation, read left to right. Frames are laid out on an invisible regular grid: each row is a horizontal band about 341 px tall, each frame cell is about 384 px wide, and each pose is centered horizontally in its cell with the feet (or lowest point) on the same baseline within a row. Leave at least 40 px of empty transparent space between neighboring frames and at least 60 px of empty transparent space between rows: no part of a frame (hair, tail, cape, weapon, trunk, legs) may touch or overlap another frame or reach into another row. Every frame is ONE single connected silhouette: held objects must touch the hand; NO detached particles, sparkles, sweat drops, dust clouds, motion lines, speed lines, impact stars, sound effects or floating debris; NO cast shadow on the ground; NO ground line. Same character, same scale, same proportions and same colors in every frame and every row. The spider is about 170 px tall and about 280 px long: 4 frames per row, cells 384 px wide. The character faces RIGHT in every frame. No text, no numbers, no labels, no grid lines, no borders.

ROWS:
Row 1 (from top) - animation "idle", exactly 4 frame(s). Frame 1: crouched, legs splayed, fangs clicking. Frame 2: body raised slightly. Frame 3: front legs tapping. Frame 4: body lowered.
Row 2 (from top) - animation "walk", exactly 4 frame(s). Frame 1: walking right, alternate legs A forward. Frame 2: legs passing. Frame 3: alternate legs B forward. Frame 4: legs passing.
Row 3 (from top) - animation "attack", exactly 4 frame(s). Frame 1: rearing up, front legs raised, fangs bared. Frame 2: lunging forward, fangs striking. Frame 3: front legs slamming down. Frame 4: recoiling back to crouch.

Output: one PNG image, 1536 x 1024 px, transparent background, exactly 3 row(s), 4 / 4 / 4 frames per row.
```

### [P2] `mousse_creature` — Créature de mousse (ennemi)

- **Image(s) à produire** : `assets/sprites/mousse_creature.png` (1536x1024)
- **Découpe** : `assets/sprites/mousse_creature_frames/mousse_creature_row<r>_<c>.png` (auto, `tools/import_codex_assets.py`, mode `blob`)
- **Orientation** : regarde à DROITE — **hauteur source** : ~170 px — **échelle en jeu** : `0.26` (≈ 44 px à l'écran)
- **Anims (manifest)** : `idle` (row 0, 4 fr.), `attack` (row 1, 4 fr.), `death` (row 2, 5 fr.)

| Rangée (manifest) | Image | Animation | Frames | fps | Poses (gauche → droite) |
|---|---|---|---|---|---|
| 0 | mousse_creature.png (rangée image 1) | `idle` (rampe / repos (boucle)) | 4 | 8 boucle | 1. blob stretched forward / 2. blob gathered, taller / 3. blob stretched forward with tendrils reaching / 4. blob squashed low |
| 1 | mousse_creature.png (rangée image 2) | `attack` (attaque) | 4 | 10 | 1. puffing up, eyes narrowing / 2. lunging forward, mouth wide open / 3. mouth snapping, body stretched / 4. settling back |
| 2 | mousse_creature.png (rangée image 3) | `death` (mort) | 5 | 10 | 1. flinching, eyes wide / 2. melting, body sagging / 3. half melted puddle with eyes / 4. flat puddle, eyes closed / 5. tiny dry flat patch of grey dead moss |

**Prompt → `assets/sprites/mousse_creature.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

CHARACTER: MOSS CREATURE (enemy): a small blob of living toxic moss the size of a cat, lumpy body of glowing toxic-green moss with a darker green core, two glowing yellow-green eyes, a wide jagged mouth, slime drips attached to its body, little stubby root tendrils as legs.

SPRITE SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background. Exactly 3 horizontal row(s); each row is ONE animation, read left to right. Frames are laid out on an invisible regular grid: each row is a horizontal band about 341 px tall, each frame cell is about 307 px wide, and each pose is centered horizontally in its cell with the feet (or lowest point) on the same baseline within a row. Leave at least 40 px of empty transparent space between neighboring frames and at least 60 px of empty transparent space between rows: no part of a frame (hair, tail, cape, weapon, trunk, legs) may touch or overlap another frame or reach into another row. Every frame is ONE single connected silhouette: held objects must touch the hand; NO detached particles, sparkles, sweat drops, dust clouds, motion lines, speed lines, impact stars, sound effects or floating debris; NO cast shadow on the ground; NO ground line. Same character, same scale, same proportions and same colors in every frame and every row. The moss creature is about 170 px tall and 220 px wide. The character faces RIGHT in every frame. No text, no numbers, no labels, no grid lines, no borders. Rows with fewer frames use wider cells (row width divided by that row's frame count).

ROWS:
Row 1 (from top) - animation "idle", exactly 4 frame(s). Frame 1: blob stretched forward. Frame 2: blob gathered, taller. Frame 3: blob stretched forward with tendrils reaching. Frame 4: blob squashed low.
Row 2 (from top) - animation "attack", exactly 4 frame(s). Frame 1: puffing up, eyes narrowing. Frame 2: lunging forward, mouth wide open. Frame 3: mouth snapping, body stretched. Frame 4: settling back.
Row 3 (from top) - animation "death", exactly 5 frame(s). Frame 1: flinching, eyes wide. Frame 2: melting, body sagging. Frame 3: half melted puddle with eyes. Frame 4: flat puddle, eyes closed. Frame 5: tiny dry flat patch of grey dead moss.

Output: one PNG image, 1536 x 1024 px, transparent background, exactly 3 row(s), 4 / 4 / 5 frames per row.
```

### [P2] `crapaud_corrompu` — Crapaud corrompu (ennemi, même layout que le crapaud existant)

- **Image(s) à produire** : `assets/sprites/crapaud_corrompu.png` (1536x1024)
- **Découpe** : `assets/sprites/crapaud_corrompu_frames/crapaud_corrompu_row<r>_<c>.png` (auto, `tools/import_codex_assets.py`, mode `blob`)
- **Orientation** : regarde à DROITE — **hauteur source** : ~200 px — **échelle en jeu** : `0.26` (≈ 52 px à l'écran)
- **Notes** : MÊME layout que l'image source de `crapaud_frames` : rangée image 1 = 4 frames de langue qui s'allonge, rangée image 2 = 1 frame langue au max ; le script les concatène dans l'anim `attack` (5 frames, row 0) et les pose alignées bas-GAUCHE sur un canvas fixe 1434x237 comme `crapaud_frames`, pour réutiliser telle quelle la géométrie de Crapaud.js (CRAPAUD_FRAME_REACH). La langue est attachée à la bouche.
- **Anims (manifest)** : `attack` (row 0, 5 fr.), `idle` (row 1, 4 fr.)

| Rangée (manifest) | Image | Animation | Frames | fps | Poses (gauche → droite) |
|---|---|---|---|---|---|
| 0 | crapaud_corrompu.png (rangée image 1) | `attack` (langue qui sort (frames 0-3)) | 4 | 26 | 1. mouth closed, crouched (frame about 245 px wide) / 2. mouth opening, tongue tip visible (about 250 px wide) / 3. tongue out horizontally to the right, short (frame about 295 px wide) / 4. tongue extended further to the right (frame about 415 px wide) |
| 0 | crapaud_corrompu.png (rangée image 2) | `attack` (langue au maximum (frame 4) — suite de la rangée précédente) | 1 | 26 | 1. tongue fully extended horizontally to the right, a long straight sticky tongue so that the whole frame (body + tongue) is about 1260 px wide, ending in a round sticky tip; the toad body sits at the left of the row |
| 1 | crapaud_corrompu.png (rangée image 3) | `idle` (repos (boucle)) | 4 | 6 boucle | 1. sitting, throat pouch inflating / 2. throat pouch fully inflated / 3. throat pouch deflating, blinking / 4. sitting, moss dripping |

**Prompt → `assets/sprites/crapaud_corrompu.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

CHARACTER: CORRUPTED TOAD (enemy): the same big warty toad as the game's existing orange toad (same pose, same proportions, golden eye) but corrupted: skin turned sickly olive-brown and violet, warts replaced by glowing toxic-green moss pustules, moss slime dripping from its back, eye glowing toxic green, tongue toxic green-violet.

SPRITE SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background. Exactly 3 horizontal row(s); each row is ONE animation, read left to right. Frames are laid out on an invisible regular grid: each row is a horizontal band about 341 px tall, each frame cell is about 384 px wide, and each pose is centered horizontally in its cell with the feet (or lowest point) on the same baseline within a row. Leave at least 40 px of empty transparent space between neighboring frames and at least 60 px of empty transparent space between rows: no part of a frame (hair, tail, cape, weapon, trunk, legs) may touch or overlap another frame or reach into another row. Every frame is ONE single connected silhouette: held objects must touch the hand; NO detached particles, sparkles, sweat drops, dust clouds, motion lines, speed lines, impact stars, sound effects or floating debris; NO cast shadow on the ground; NO ground line. Same character, same scale, same proportions and same colors in every frame and every row. The toad body is about 200 px tall and 220 px long in every frame (the tongue makes some frames much wider). The character faces RIGHT in every frame. No text, no numbers, no labels, no grid lines, no borders. EXCEPTION for this sheet: frames are NOT in equal cells. In rows 1 and 3, place the frames left to right with at least 40 px of empty space between them (frames get wider as the tongue extends). Row 2 contains ONE single very wide frame (the toad at the left, its tongue running to the right). Rows with fewer frames use wider cells (row width divided by that row's frame count).

ROWS:
Row 1 (from top) - animation "attack", exactly 4 frame(s). Frame 1: mouth closed, crouched (frame about 245 px wide). Frame 2: mouth opening, tongue tip visible (about 250 px wide). Frame 3: tongue out horizontally to the right, short (frame about 295 px wide). Frame 4: tongue extended further to the right (frame about 415 px wide).
Row 2 (from top) - animation "attack", exactly 1 frame(s). Frame 1: tongue fully extended horizontally to the right, a long straight sticky tongue so that the whole frame (body + tongue) is about 1260 px wide, ending in a round sticky tip; the toad body sits at the left of the row.
Row 3 (from top) - animation "idle", exactly 4 frame(s). Frame 1: sitting, throat pouch inflating. Frame 2: throat pouch fully inflated. Frame 3: throat pouch deflating, blinking. Frame 4: sitting, moss dripping.

Output: one PNG image, 1536 x 1024 px, transparent background, exactly 3 row(s), 4 / 1 / 4 frames per row.
```

### [P2] `singe_corrompu` — Petit singe corrompu (sbire de Kainati)

- **Image(s) à produire** : `assets/sprites/singe_corrompu.png` (1536x1024)
- **Découpe** : `assets/sprites/singe_corrompu_frames/singe_corrompu_row<r>_<c>.png` (auto, `tools/import_codex_assets.py`, mode `blob`)
- **Orientation** : regarde à DROITE — **hauteur source** : ~180 px — **échelle en jeu** : `0.28` (≈ 50 px à l'écran)
- **Anims (manifest)** : `idle` (row 0, 4 fr.), `run` (row 1, 5 fr.), `throw` (row 2, 4 fr.)

| Rangée (manifest) | Image | Animation | Frames | fps | Poses (gauche → droite) |
|---|---|---|---|---|---|
| 0 | singe_corrompu.png (rangée image 1) | `idle` (repos agité (boucle)) | 4 | 6 boucle | 1. crouched on all fours, tail up, glaring / 2. same, bouncing slightly, teeth bared / 3. same, scratching the moss on its shoulder / 4. same, screeching with mouth open |
| 1 | singe_corrompu.png (rangée image 2) | `run` (course (boucle)) | 5 | 12 boucle | 1. running on all fours, front hands forward / 2. hands planted, legs swinging / 3. gathered / 4. back legs pushing / 5. airborne, tail streaming |
| 2 | singe_corrompu.png (rangée image 3) | `throw` (lance un caillou) | 4 | 10 | 1. standing on hind legs holding a small rock in the right hand (touching) / 2. arm cocked behind the head / 3. arm swinging forward, rock still in hand / 4. follow-through, hand empty, cackling |

**Prompt → `assets/sprites/singe_corrompu.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

CHARACTER: CORRUPTED MONKEY MINION (enemy): a small skinny monkey of Kainati's tribe, dark violet-grey fur, patches of glowing toxic-green moss dripping from its shoulders and tail, glowing green eyes, angry grin with small fangs, long tail.

SPRITE SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background. Exactly 3 horizontal row(s); each row is ONE animation, read left to right. Frames are laid out on an invisible regular grid: each row is a horizontal band about 341 px tall, each frame cell is about 307 px wide, and each pose is centered horizontally in its cell with the feet (or lowest point) on the same baseline within a row. Leave at least 40 px of empty transparent space between neighboring frames and at least 60 px of empty transparent space between rows: no part of a frame (hair, tail, cape, weapon, trunk, legs) may touch or overlap another frame or reach into another row. Every frame is ONE single connected silhouette: held objects must touch the hand; NO detached particles, sparkles, sweat drops, dust clouds, motion lines, speed lines, impact stars, sound effects or floating debris; NO cast shadow on the ground; NO ground line. Same character, same scale, same proportions and same colors in every frame and every row. The monkey is about 180 px tall. The character faces RIGHT in every frame. No text, no numbers, no labels, no grid lines, no borders. Rows with fewer frames use wider cells (row width divided by that row's frame count).

ROWS:
Row 1 (from top) - animation "idle", exactly 4 frame(s). Frame 1: crouched on all fours, tail up, glaring. Frame 2: same, bouncing slightly, teeth bared. Frame 3: same, scratching the moss on its shoulder. Frame 4: same, screeching with mouth open.
Row 2 (from top) - animation "run", exactly 5 frame(s). Frame 1: running on all fours, front hands forward. Frame 2: hands planted, legs swinging. Frame 3: gathered. Frame 4: back legs pushing. Frame 5: airborne, tail streaming.
Row 3 (from top) - animation "throw", exactly 4 frame(s). Frame 1: standing on hind legs holding a small rock in the right hand (touching). Frame 2: arm cocked behind the head. Frame 3: arm swinging forward, rock still in hand. Frame 4: follow-through, hand empty, cackling.

Output: one PNG image, 1536 x 1024 px, transparent background, exactly 3 row(s), 4 / 5 / 4 frames per row.
```

### [P2] `vfx_souffle_toxique` — VFX - souffle toxique de Ghil't

- **Image(s) à produire** : `assets/vfx/vfx_souffle_toxique.png` (1536x1024)
- **Découpe** : `assets/vfx/vfx_souffle_toxique_frames/vfx_souffle_toxique_row<r>_<c>.png` (auto, `tools/import_codex_assets.py`, mode `grid`)
- **Alignement** : `left` — **échelle en jeu** : `0.42`
- **Notes** : 3 cellules de 512 px par rangée. Origine conseillée en jeu : setOrigin(0, 0.5) (le souffle part de la gauche).
- **Anims (manifest)** : `start` (row 0, 3 fr.), `idle` (row 1, 3 fr.)

| Rangée (manifest) | Image | Animation | Frames | fps | Poses (gauche → droite) |
|---|---|---|---|---|---|
| 0 | vfx_souffle_toxique.png (rangée image 1) | `start` (début du souffle) | 3 | 12 | 1. a small puff of gas at the left / 2. the cone growing to half the cell width / 3. the full cone reaching the right side of the cell |
| 1 | vfx_souffle_toxique.png (rangée image 2) | `idle` (souffle continu (boucle)) | 3 | 10 boucle | 1. full cone, rolling clouds pattern A / 2. full cone, clouds pattern B / 3. full cone, clouds pattern C |

**Prompt → `assets/vfx/vfx_souffle_toxique.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

EFFECT: A cone of toxic breath blown to the RIGHT: thick rolling clouds of glowing toxic-green and sickly violet gas with moss spores, opaque in the core, softer at the edges.

EFFECT SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background (alpha), NO black or dark backdrop. Exactly 2 horizontal row(s) of equal height (512 px each); row r is ONE animation read left to right. Divide each row into equal cells exactly 512 px wide (cell boundaries at regular intervals from the left edge). Each frame of the effect is drawn anchored on the LEFT side (the breath starts at the left edge of the cell and spreads to the right), vertically centered of its cell and stays fully INSIDE its cell with at least 30 px of empty margin on every side: nothing crosses a cell boundary. Particles may be separate pieces, but every piece of a frame stays inside that frame's cell. Same effect scale and same palette in every frame. No character, no ground, no scenery, no text, no grid lines, no borders.

ROWS:
Row 1 (from top) - "start", exactly 3 frames. Frame 1: a small puff of gas at the left. Frame 2: the cone growing to half the cell width. Frame 3: the full cone reaching the right side of the cell.
Row 2 (from top) - "idle", exactly 3 frames. Frame 1: full cone, rolling clouds pattern A. Frame 2: full cone, clouds pattern B. Frame 3: full cone, clouds pattern C.

Output: one PNG image, 1536 x 1024 px, transparent background, 3 / 3 frames per row.
```

### [P2] `vfx_flaque_mousse` — VFX - flaque de mousse toxique au sol

- **Image(s) à produire** : `assets/vfx/vfx_flaque_mousse.png` (1536x1024)
- **Découpe** : `assets/vfx/vfx_flaque_mousse_frames/vfx_flaque_mousse_row<r>_<c>.png` (auto, `tools/import_codex_assets.py`, mode `grid`)
- **Alignement** : `bottom` — **échelle en jeu** : `0.36`
- **Anims (manifest)** : `spawn` (row 0, 4 fr.), `idle` (row 1, 4 fr.)

| Rangée (manifest) | Image | Animation | Frames | fps | Poses (gauche → droite) |
|---|---|---|---|---|---|
| 0 | vfx_flaque_mousse.png (rangée image 1) | `spawn` (apparition) | 4 | 10 | 1. a small splash blob landing / 2. spreading flat / 3. wide puddle forming / 4. full puddle |
| 1 | vfx_flaque_mousse.png (rangée image 2) | `idle` (bouillonne (boucle)) | 4 | 6 boucle | 1. full puddle, bubble A rising / 2. bubble A popping, bubble B forming / 3. bubble B rising / 4. bubbles popping, tufts swaying |

**Prompt → `assets/vfx/vfx_flaque_mousse.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

EFFECT: A flat puddle of glowing toxic-green moss slime on the ground, with bubbles and small sprouting moss tufts.

EFFECT SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background (alpha), NO black or dark backdrop. Exactly 2 horizontal row(s) of equal height (512 px each); row r is ONE animation read left to right. Divide each row into equal cells exactly 384 px wide (cell boundaries at regular intervals from the left edge). Each frame of the effect is drawn sitting at the BOTTOM-center (a flat ground puddle seen from the side, about 360 px wide and 120 px tall) of its cell and stays fully INSIDE its cell with at least 30 px of empty margin on every side: nothing crosses a cell boundary. Particles may be separate pieces, but every piece of a frame stays inside that frame's cell. Same effect scale and same palette in every frame. No character, no ground, no scenery, no text, no grid lines, no borders.

ROWS:
Row 1 (from top) - "spawn", exactly 4 frames. Frame 1: a small splash blob landing. Frame 2: spreading flat. Frame 3: wide puddle forming. Frame 4: full puddle.
Row 2 (from top) - "idle", exactly 4 frames. Frame 1: full puddle, bubble A rising. Frame 2: bubble A popping, bubble B forming. Frame 3: bubble B rising. Frame 4: bubbles popping, tufts swaying.

Output: one PNG image, 1536 x 1024 px, transparent background, 4 / 4 frames per row.
```

### [P2] `vfx_purification` — VFX - purification (la mousse se retire)

- **Image(s) à produire** : `assets/vfx/vfx_purification.png` (1536x1024)
- **Découpe** : `assets/vfx/vfx_purification_frames/vfx_purification_row<r>_<c>.png` (auto, `tools/import_codex_assets.py`, mode `grid`)
- **Alignement** : `center` — **échelle en jeu** : `0.46`
- **Anims (manifest)** : `burst` (row 0, 4 fr.), `fade` (row 1, 4 fr.)

| Rangée (manifest) | Image | Animation | Frames | fps | Poses (gauche → droite) |
|---|---|---|---|---|---|
| 0 | vfx_purification.png (rangée image 1) | `burst` (éclat) | 4 | 12 | 1. a bright small white-green core / 2. a ring of light expanding, moss fragments around / 3. larger ring, fragments turning golden / 4. largest ring, golden motes and petals |
| 1 | vfx_purification.png (rangée image 2) | `fade` (dissipation) | 4 | 10 | 1. petals and motes drifting upward / 2. fewer motes, fading / 3. a few faint motes / 4. two tiny faint sparkles |

**Prompt → `assets/vfx/vfx_purification.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

EFFECT: A purification burst: rings of warm white and mint-green light, toxic-green moss fragments turning into golden light motes and small white petals.

EFFECT SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background (alpha), NO black or dark backdrop. Exactly 2 horizontal row(s) of equal height (512 px each); row r is ONE animation read left to right. Divide each row into equal cells exactly 384 px wide (cell boundaries at regular intervals from the left edge). Each frame of the effect is drawn centered in the middle of its cell and stays fully INSIDE its cell with at least 30 px of empty margin on every side: nothing crosses a cell boundary. Particles may be separate pieces, but every piece of a frame stays inside that frame's cell. Same effect scale and same palette in every frame. No character, no ground, no scenery, no text, no grid lines, no borders.

ROWS:
Row 1 (from top) - "burst", exactly 4 frames. Frame 1: a bright small white-green core. Frame 2: a ring of light expanding, moss fragments around. Frame 3: larger ring, fragments turning golden. Frame 4: largest ring, golden motes and petals.
Row 2 (from top) - "fade", exactly 4 frames. Frame 1: petals and motes drifting upward. Frame 2: fewer motes, fading. Frame 3: a few faint motes. Frame 4: two tiny faint sparkles.

Output: one PNG image, 1536 x 1024 px, transparent background, 4 / 4 frames per row.
```

### [P2] `vfx_piste_loup` — VFX - piste lumineuse (empreintes de loup)

- **Image(s) à produire** : `assets/vfx/vfx_piste_loup.png` (1536x1024)
- **Découpe** : `assets/vfx/vfx_piste_loup_frames/vfx_piste_loup_row<r>_<c>.png` (auto, `tools/import_codex_assets.py`, mode `grid`)
- **Alignement** : `bottom` — **échelle en jeu** : `0.1`
- **Anims (manifest)** : `appear` (row 0, 4 fr.), `glow` (row 1, 4 fr.)

| Rangée (manifest) | Image | Animation | Frames | fps | Poses (gauche → droite) |
|---|---|---|---|---|---|
| 0 | vfx_piste_loup.png (rangée image 1) | `appear` (apparition) | 4 | 10 | 1. a faint dot of light / 2. paw print shape half visible / 3. paw print fully visible, bright / 4. paw print settling, normal glow |
| 1 | vfx_piste_loup.png (rangée image 2) | `glow` (lueur (boucle)) | 4 | 6 boucle | 1. paw print normal glow / 2. slightly brighter / 3. brightest / 4. slightly dimmer |

**Prompt → `assets/vfx/vfx_piste_loup.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

EFFECT: A single glowing wolf paw print on the ground, luminous green-cyan, soft inner glow.

EFFECT SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background (alpha), NO black or dark backdrop. Exactly 2 horizontal row(s) of equal height (512 px each); row r is ONE animation read left to right. Divide each row into equal cells exactly 384 px wide (cell boundaries at regular intervals from the left edge). Each frame of the effect is drawn sitting at the BOTTOM-center (one paw print lying flat on the ground, seen at a low side angle, about 200 px wide) of its cell and stays fully INSIDE its cell with at least 30 px of empty margin on every side: nothing crosses a cell boundary. Particles may be separate pieces, but every piece of a frame stays inside that frame's cell. Same effect scale and same palette in every frame. No character, no ground, no scenery, no text, no grid lines, no borders.

ROWS:
Row 1 (from top) - "appear", exactly 4 frames. Frame 1: a faint dot of light. Frame 2: paw print shape half visible. Frame 3: paw print fully visible, bright. Frame 4: paw print settling, normal glow.
Row 2 (from top) - "glow", exactly 4 frames. Frame 1: paw print normal glow. Frame 2: slightly brighter. Frame 3: brightest. Frame 4: slightly dimmer.

Output: one PNG image, 1536 x 1024 px, transparent background, 4 / 4 frames per row.
```

### [P2] `vfx_impact_pierre` — VFX - impact de pierre (lancers de Kainati)

- **Image(s) à produire** : `assets/vfx/vfx_impact_pierre.png` (1536x1024)
- **Découpe** : `assets/vfx/vfx_impact_pierre_frames/vfx_impact_pierre_row<r>_<c>.png` (auto, `tools/import_codex_assets.py`, mode `grid`)
- **Alignement** : `bottom` — **échelle en jeu** : `0.24`
- **Notes** : Une seule rangée de 5 cellules (307 px), centrée verticalement.
- **Anims (manifest)** : `idle` (row 0, 5 fr.)

| Rangée (manifest) | Image | Animation | Frames | fps | Poses (gauche → droite) |
|---|---|---|---|---|---|
| 0 | vfx_impact_pierre.png (rangée image 1) | `idle` (impact (one-shot)) | 5 | 16 | 1. small bright impact flash and first chips / 2. dust puff expanding, chips flying / 3. biggest dust cloud / 4. dust thinning, chips falling / 5. faint dust wisps |

**Prompt → `assets/vfx/vfx_impact_pierre.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

EFFECT: A ground impact of a thrown rock: puff of brown-grey dust, small rock chips and bark splinters.

EFFECT SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background (alpha), NO black or dark backdrop. Exactly 1 horizontal row(s) of equal height (1024 px each); row r is ONE animation read left to right. Divide each row into equal cells exactly 307 px wide (cell boundaries at regular intervals from the left edge). Each frame of the effect is drawn sitting at the BOTTOM-center (ground impact) of its cell and stays fully INSIDE its cell with at least 30 px of empty margin on every side: nothing crosses a cell boundary. Particles may be separate pieces, but every piece of a frame stays inside that frame's cell. Same effect scale and same palette in every frame. No character, no ground, no scenery, no text, no grid lines, no borders.

ROWS:
Row 1 (from top) - "idle", exactly 5 frames. Frame 1: small bright impact flash and first chips. Frame 2: dust puff expanding, chips flying. Frame 3: biggest dust cloud. Frame 4: dust thinning, chips falling. Frame 5: faint dust wisps.

Output: one PNG image, 1536 x 1024 px, transparent background, 5 frames per row.
```

### [P2] Planche `hud_coeurs` — Coeurs du HUD (plein / vide)

- **Image à produire** : `assets/_codex_src/hud_coeurs.png` (1536x1024), grille 2 col. x 1 rang.
- **Découpe auto** : une cellule = un fichier (rognage alpha + normalisation de taille).

| Cellule | ID | Fichier final | Taille normalisée | Échelle |
|---|---|---|---|---|
| 0 | `hud_coeur` | `assets/ui/hud_coeur.png` | fit 128 | 0.19 |
| 1 | `hud_coeur_vide` | `assets/ui/hud_coeur_vide.png` | fit 128 | 0.19 |

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

OBJECT SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background (alpha), no backdrop. Divide the canvas into an invisible regular grid of 2 column(s) x 1 row(s) of equal cells (768 x 1024 px each). Draw exactly ONE object per cell, centered in its cell, filling about 70% of the cell, with at least 40 px of empty transparent margin on every side: no object touches another or crosses its cell boundary. Each object is one connected piece (no detached sparkles or particles), no cast shadow, no ground, no text, no labels, no grid lines. Objects are drawn in a slight side / three-quarter view, consistent lighting from the upper left.

CELLS (reading order):
Cell row 1, column 1: a FULL health heart icon: a heart made of a glossy red-pink berry/leaf shape with a tiny green leaf on top, thick dark outline, bright highlight.
Cell row 1, column 2: the SAME heart icon, same shape and size, but EMPTY: dark hollow interior (deep violet-grey), only the outline and the little leaf visible, desaturated.

Output: one PNG image, 1536 x 1024 px, transparent background, 2 objects.
```

### [P2] `porte_mousse` — Porte de bois déformée par la mousse

- **Image à produire** : `assets/_codex_src/porte_mousse.png` (1024x1536) → **fichier final** `assets/items/objets/porte_mousse.png` (normalisation `fit` 768) — échelle `0.21`

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

An old round-topped wooden DOOR in a stone-and-root frame, warped and overgrown by glowing toxic-green moss, planks bent, iron hinges rusted, moss slime oozing from the cracks. Front view, flat bottom edge so it sits on the ground.

Output: one PNG image, 1024 x 1536 px, transparent background.
```

### [P2] `courant_air` — Courant d'air ascendant

- **Image à produire** : `assets/_codex_src/courant_air.png` (1024x1536) → **fichier final** `assets/items/objets/courant_air.png` (normalisation `fit` 768) — échelle `0.33`

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

A vertical column of rising WIND (updraft) seen from the side: pale white and light-cyan swirling wind streaks and curls rising from the bottom to the top, a few small green leaves caught inside the column (touching the streaks), semi-opaque streaks with clean outlines. The column is about one third as wide as it is tall and fills the canvas height.

Output: one PNG image, 1024 x 1536 px, transparent background.
```

### [P2] `form_icone_singe` — Icône de forme : singe

- **Image à produire** : `assets/_codex_src/form_icone_singe.png` (1024x1024) → **fichier final** `assets/items/form_icone/singe.png` (normalisation `square` 724) — échelle `0.1`

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

A round wooden MEDALLION icon for the game UI, exactly in the style of the game's existing form icons: a circular frame of twisted brown vines with four small round brass studs (top, bottom, left, right), bright green ivy leaves growing around the frame, a dark wooden plank disc in the center, and carved in relief on the disc: a carved MONKEY HEAD in profile facing right with a curling tail around it, in pale beige carved wood with subtle green-eyed detail. Painted glossy look, thick outlines, centered, filling about 90% of the canvas. Fully transparent background outside the medallion, no text.

Output: one PNG image, 1024 x 1024 px, transparent background.
```

### [P2] `skill_icone_ours` — Icône de compétence : ours

- **Image à produire** : `assets/_codex_src/skill_icone_ours.png` (1024x1024) → **fichier final** `assets/items/skill_icone/ours.png` (normalisation `square` 724) — échelle `0.1`

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

A round wooden MEDALLION icon for the game UI, exactly in the style of the game's existing form icons: a circular frame of twisted brown vines with four small round brass studs (top, bottom, left, right), bright green ivy leaves growing around the frame, a dark wooden plank disc in the center, and carved in relief on the disc: a BEAR CLAW SLASH: three curved bear claw marks with a glowing amber-orange edge, over a carved bear paw. Painted glossy look, thick outlines, centered, filling about 90% of the canvas. Fully transparent background outside the medallion, no text.

Output: one PNG image, 1024 x 1024 px, transparent background.
```

### [P2] `skill_icone_singe` — Icône de compétence : singe

- **Image à produire** : `assets/_codex_src/skill_icone_singe.png` (1024x1024) → **fichier final** `assets/items/skill_icone/singe.png` (normalisation `square` 724) — échelle `0.1`

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

A round wooden MEDALLION icon for the game UI, exactly in the style of the game's existing form icons: a circular frame of twisted brown vines with four small round brass studs (top, bottom, left, right), bright green ivy leaves growing around the frame, a dark wooden plank disc in the center, and carved in relief on the disc: a ROCK being thrown with a curved motion arc carved into the wood, a small monkey hand releasing it, turquoise accents. Painted glossy look, thick outlines, centered, filling about 90% of the canvas. Fully transparent background outside the medallion, no text.

Output: one PNG image, 1024 x 1024 px, transparent background.
```

### [P2] `skill_icone_papillon` — Icône de compétence : papillon

- **Image à produire** : `assets/_codex_src/skill_icone_papillon.png` (1024x1024) → **fichier final** `assets/items/skill_icone/papillon.png` (normalisation `square` 724) — échelle `0.1`

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

A round wooden MEDALLION icon for the game UI, exactly in the style of the game's existing form icons: a circular frame of twisted brown vines with four small round brass studs (top, bottom, left, right), bright green ivy leaves growing around the frame, a dark wooden plank disc in the center, and carved in relief on the disc: a glowing cyan BUTTERFLY with open wings above a small healing leaf, luminous cyan and mint-green. Painted glossy look, thick outlines, centered, filling about 90% of the canvas. Fully transparent background outside the medallion, no text.

Output: one PNG image, 1024 x 1024 px, transparent background.
```

### [P2] `carte_parchemin` — Carte de Galter (écran de carte)

- **Image à produire** : `assets/_codex_src/carte_parchemin.png` (1536x1024) → **fichier final** `assets/ui/carte_parchemin.png` (normalisation `fit` 1536) — échelle `0.52`

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

Galter's INCOMPLETE hand-drawn FOREST MAP on an old torn parchment, seen from above, flat and unrolled, with ragged burnt edges and a coffee-ring stain: sketched in brown ink with a few watercolor washes: a small village with a big tree at the left (the Emerald Grove), a dark forest band in the middle, one gigantic tree, floating islands sketched at the top right, a corrupted area hatched in toxic green at the bottom right, dotted paths, contradictory arrows, crossed-out routes, question marks, little doodles of a crab and footprints, large blank unexplored areas. Scribbles that look like handwriting but are NOT readable words. Transparent background outside the parchment.

Output: one PNG image, 1536 x 1024 px, transparent outside the parchment.
```

### [P2] `fond_bosquet` — fond parallax

- **Image à produire** : `assets/_codex_src/fond_bosquet.png` (2172x724) → **final** `assets/decors/fonds/fond_bosquet.png` (2079x756, recadrage « cover » auto, comme `plan4_ciel.png`). Opaque. Répété horizontalement par `tileSprite` => bords gauche/droit raccord.

```text
A wide PARALLAX BACKGROUND painting for a 2D side-scrolling platformer, the Emerald Grove at night: a peaceful forest village with round moss-roofed huts, a tree house with warm lanterns, a stone tower overgrown with ivy, green banners with a white tree emblem, giant trees in the background, but patches of glowing toxic-green moss creeping on the trunks; deep violet-indigo night sky with a big moon. Painterly cel-shaded style matching the game (thick shapes, soft gradients, slightly darker and less saturated than the gameplay foreground so characters stay readable). NO characters, NO creatures, NO text. The image must TILE SEAMLESSLY HORIZONTALLY: the left edge and the right edge must match perfectly (same horizon height, same colors) because the game repeats it side by side. Keep the bottom quarter darker and simpler (ground will be drawn over it). Fully opaque, no transparency. Output: one PNG, 2172 x 724 px (wide 3:1).
```

### [P2] `fond_grand_arbre` — fond parallax

- **Image à produire** : `assets/_codex_src/fond_grand_arbre.png` (2172x724) → **final** `assets/decors/fonds/fond_grand_arbre.png` (2079x756, recadrage « cover » auto, comme `plan4_ciel.png`). Opaque. Répété horizontalement par `tileSprite` => bords gauche/droit raccord.

```text
A wide PARALLAX BACKGROUND painting for a 2D side-scrolling platformer, inside and around a GIGANTIC TREE: an immense vertical trunk with huge bark ridges, enormous roots forming arches and tunnels, hanging vines and lianas, shelf mushrooms glowing cyan, distant branches like bridges, night palette violet-teal with shafts of moonlight. Painterly cel-shaded style matching the game (thick shapes, soft gradients, slightly darker and less saturated than the gameplay foreground so characters stay readable). NO characters, NO creatures, NO text. The image must TILE SEAMLESSLY HORIZONTALLY: the left edge and the right edge must match perfectly (same horizon height, same colors) because the game repeats it side by side. Keep the bottom quarter darker and simpler (ground will be drawn over it). Fully opaque, no transparency. Output: one PNG, 2172 x 724 px (wide 3:1).
```

### [P2] `fond_foret_flottante` — fond parallax

- **Image à produire** : `assets/_codex_src/fond_foret_flottante.png` (2172x724) → **final** `assets/decors/fonds/fond_foret_flottante.png` (2079x756, recadrage « cover » auto, comme `plan4_ciel.png`). Opaque. Répété horizontalement par `tileSprite` => bords gauche/droit raccord.

```text
A wide PARALLAX BACKGROUND painting for a 2D side-scrolling platformer, DAYLIGHT above the forest canopy: bright blue sky with soft white clouds, warm golden sunlight, FLOATING ISLANDS of earth and roots with small trees drifting in the sky, the green canopy sea far below, hanging roots, a few birds; luminous and hopeful (this is the only daytime background). Painterly cel-shaded style matching the game (thick shapes, soft gradients, slightly darker and less saturated than the gameplay foreground so characters stay readable). NO characters, NO creatures, NO text. The image must TILE SEAMLESSLY HORIZONTALLY: the left edge and the right edge must match perfectly (same horizon height, same colors) because the game repeats it side by side. Keep the bottom quarter darker and simpler (ground will be drawn over it). Fully opaque, no transparency. Output: one PNG, 2172 x 724 px (wide 3:1).
```

### [P2] `fond_foret_corrompue` — fond parallax

- **Image à produire** : `assets/_codex_src/fond_foret_corrompue.png` (2172x724) → **final** `assets/decors/fonds/fond_foret_corrompue.png` (2079x756, recadrage « cover » auto, comme `plan4_ciel.png`). Opaque. Répété horizontalement par `tileSprite` => bords gauche/droit raccord.

```text
A wide PARALLAX BACKGROUND painting for a 2D side-scrolling platformer, the CORRUPTED FOREST: twisted sick trees with grey bark, everything draped in glowing toxic-green moss that drips like slime, sickly violet fog, pale fungus, dead branches, a murky green-violet sky; oppressive and unhealthy. Painterly cel-shaded style matching the game (thick shapes, soft gradients, slightly darker and less saturated than the gameplay foreground so characters stay readable). NO characters, NO creatures, NO text. The image must TILE SEAMLESSLY HORIZONTALLY: the left edge and the right edge must match perfectly (same horizon height, same colors) because the game repeats it side by side. Keep the bottom quarter darker and simpler (ground will be drawn over it). Fully opaque, no transparency. Output: one PNG, 2172 x 724 px (wide 3:1).
```

### [P2] `fond_monde_spirituel` — fond parallax

- **Image à produire** : `assets/_codex_src/fond_monde_spirituel.png` (2172x724) → **final** `assets/decors/fonds/fond_monde_spirituel.png` (2079x756, recadrage « cover » auto, comme `plan4_ciel.png`). Opaque. Répété horizontalement par `tileSprite` => bords gauche/droit raccord.

```text
A wide PARALLAX BACKGROUND painting for a 2D side-scrolling platformer, the SPIRIT WORLD of the monkey: an ethereal giant ancestral tree made of glowing cyan and mint light, translucent branches and lianas, floating leaves and light motes, a starry teal-violet void, calm and sacred. Painterly cel-shaded style matching the game (thick shapes, soft gradients, slightly darker and less saturated than the gameplay foreground so characters stay readable). NO characters, NO creatures, NO text. The image must TILE SEAMLESSLY HORIZONTALLY: the left edge and the right edge must match perfectly (same horizon height, same colors) because the game repeats it side by side. Keep the bottom quarter darker and simpler (ground will be drawn over it). Fully opaque, no transparency. Output: one PNG, 2172 x 724 px (wide 3:1).
```

### [P2] `fond_arene_ghilt` — fond parallax

- **Image à produire** : `assets/_codex_src/fond_arene_ghilt.png` (2172x724) → **final** `assets/decors/fonds/fond_arene_ghilt.png` (2079x756, recadrage « cover » auto, comme `plan4_ciel.png`). Opaque. Répété horizontalement par `tileSprite` => bords gauche/droit raccord.

```text
A wide PARALLAX BACKGROUND painting for a 2D side-scrolling platformer, GHIL'T'S ARENA: a wide circular clearing in the corrupted forest surrounded by huge dead trees covered in toxic glowing moss, ancient broken stone pillars with spiral runes, moss pools glowing green, a sickly violet sky; ominous boss arena. Painterly cel-shaded style matching the game (thick shapes, soft gradients, slightly darker and less saturated than the gameplay foreground so characters stay readable). NO characters, NO creatures, NO text. The image must TILE SEAMLESSLY HORIZONTALLY: the left edge and the right edge must match perfectly (same horizon height, same colors) because the game repeats it side by side. Keep the bottom quarter darker and simpler (ground will be drawn over it). Fully opaque, no transparency. Output: one PNG, 2172 x 724 px (wide 3:1).
```

### [P2] Tilesets alternatifs (`tuiles_ecorce`, `tuiles_flottantes`, `tuiles_corrompues`)

Le moteur (`renderAutotileGrid` dans `src/utils/LevelKit.js`, chargé par `BootScene.js` depuis `AUTOTILE_TILESET_DIR`) attend **21 fichiers** dans un dossier, mêmes noms que `assets/decors/autotile_frames/` :

- 9-slice : `dirt_tl, dirt_t, dirt_tr, dirt_l, dirt_c, dirt_r, dirt_bl, dirt_b, dirt_br`
- 6 variantes d'intérieur : `dirt_c_var0..5` (tirées au hasard sur les grandes surfaces)
- 3 plateformes : `dirt_platform0` (milieu), `dirt_platform1` (isolée, fermée des 2 côtés), `dirt_platform2` (extrémité gauche, miroir X pour la droite)
- 3 spéciaux : `dirt_angle` (coin intérieur haut, surface en haut-gauche ; miroir X pour haut-droit), `coin` (coin intérieur bas, roche en haut-gauche ; miroir Y/X), `dirt_column` (pilier 1 case de large)

Chaque tileset = **3 images** (même logique que `floor.png` 4x4 + `plateforme.png` 1x3) :

| Image | Taille | Contenu |
|---|---|---|
| `assets/_codex_src/<id>_sol.png` | 1024x1024 | grille 4x4 : 3x3 en haut-gauche = 9-slice (rangée par rangée tl,t,tr / l,c,r / bl,b,br) ; colonne 4 rangées 1-3 = var0..2 ; rangée 4 col. 1-3 = var3..5 ; cellule (4,4) ignorée |
| `assets/_codex_src/<id>_plateformes.png` | 1536x1024 | 1 rangée : platform0, platform1, platform2 |
| `assets/_codex_src/<id>_speciaux.png` | 1536x1024 | 1 rangée : dirt_angle, coin, dirt_column |

Sortie : `assets/decors/<id>_frames/` (21 PNG). Le script redimensionne chaque tuile en 256x256 et ajoute, comme `tools/cut_tuiles.py`, la marge transparente en haut qui compense `AUTOTILE_CORNER_HEIGHT_BOOST` / `AUTOTILE_PLATFORM_HEIGHT_BOOST` (tl 1.16, tr 1.09, t 1.07, platform2 1.05). Pour activer un tileset : changer `AUTOTILE_TILESET_DIR` (ou le rendre paramétrable par zone).

#### `tuiles_ecorce`

**Prompt → `assets/_codex_src/tuiles_ecorce_sol.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

TERRAIN TILESET material: giant tree BARK and living WOOD: the solid mass is reddish-brown wood with vertical bark ridges and grain, knots and small shelf mushrooms; the walkable top surface is a strip of green moss with a few small cyan glowing mushrooms; exposed side and bottom edges are thick rounded bark plates (darker brown) instead of rocks. Each tile is a SQUARE seamless terrain tile seen from the side (platformer cross-section), designed so neighbouring tiles connect seamlessly: interior material continues across tile borders, the "edge band" (exposed border of the terrain mass) is about one quarter of a tile deep with an irregular inner boundary, the "top surface" (walkable surface) sits along the top with the top 1/6 of the tile left transparent (sky) above it.

LAYOUT: canvas 1024 x 1024 px, transparent background, an exact 4 x 4 grid of square tiles (each about 240 x 240 px) separated by 16 px transparent gaps; each tile has slightly rounded corners. All tiles share the same scale, palette and lighting.

TILES:
Cell row 1, column 1: TOP-LEFT corner: grass/top surface along the top AND exposed edge band along the left side; transparent sky above the top surface (top 1/6 of the tile empty).
Cell row 1, column 2: TOP edge: top surface along the top only; transparent sky above it (top 1/6 empty).
Cell row 1, column 3: TOP-RIGHT corner: top surface along the top AND edge band along the right side; transparent sky above.
Cell row 1, column 4: plain interior variant, fully opaque, no edges.
Cell row 2, column 1: LEFT edge: edge band along the left side only, fully opaque.
Cell row 2, column 2: CENTER: plain interior, fully opaque, no edges, seamlessly tileable on all sides.
Cell row 2, column 3: RIGHT edge: edge band along the right side only, fully opaque.
Cell row 2, column 4: plain interior variant, fully opaque.
Cell row 3, column 1: BOTTOM-LEFT corner: edge bands along the left and bottom sides.
Cell row 3, column 2: BOTTOM edge: edge band along the bottom only.
Cell row 3, column 3: BOTTOM-RIGHT corner: edge bands along the right and bottom sides.
Cell row 3, column 4: plain interior variant, fully opaque.
Cell row 4, column 1: plain interior variant, fully opaque.
Cell row 4, column 2: plain interior variant, fully opaque.
Cell row 4, column 3: plain interior variant, fully opaque.
Cell row 4, column 4: one more plain interior variant (ignored by the import script).

Output: one PNG, 1024 x 1024 px, 16 tiles, no text.
```

**Prompt → `assets/_codex_src/tuiles_ecorce_plateformes.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

TERRAIN TILESET material: giant tree BARK and living WOOD: the solid mass is reddish-brown wood with vertical bark ridges and grain, knots and small shelf mushrooms; the walkable top surface is a strip of green moss with a few small cyan glowing mushrooms; exposed side and bottom edges are thick rounded bark plates (darker brown) instead of rocks. Each tile is a SQUARE seamless terrain tile seen from the side (platformer cross-section), designed so neighbouring tiles connect seamlessly: interior material continues across tile borders, the "edge band" (exposed border of the terrain mass) is about one quarter of a tile deep with an irregular inner boundary, the "top surface" (walkable surface) sits along the top with the top 1/6 of the tile left transparent (sky) above it.

LAYOUT: canvas 1536 x 1024 px, transparent background, ONE row of 3 square tiles (each about 460 x 460 px), vertically centered, separated by at least 40 px of transparent space.

TILES: Tile 1: a floating one-tile-thick PLATFORM tile used in the MIDDLE of a platform: top surface on top (transparent sky above it), edge band along the BOTTOM, open (no edge) on left and right. Tile 2: a single isolated PLATFORM tile: top surface on top, edge band along the bottom AND on both the left and right sides. Tile 3: a PLATFORM END tile (left end): top surface on top, edge band along the bottom and the LEFT side, open on the right.

Output: one PNG, 1536 x 1024 px, 3 tiles, no text.
```

**Prompt → `assets/_codex_src/tuiles_ecorce_speciaux.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

TERRAIN TILESET material: giant tree BARK and living WOOD: the solid mass is reddish-brown wood with vertical bark ridges and grain, knots and small shelf mushrooms; the walkable top surface is a strip of green moss with a few small cyan glowing mushrooms; exposed side and bottom edges are thick rounded bark plates (darker brown) instead of rocks. Each tile is a SQUARE seamless terrain tile seen from the side (platformer cross-section), designed so neighbouring tiles connect seamlessly: interior material continues across tile borders, the "edge band" (exposed border of the terrain mass) is about one quarter of a tile deep with an irregular inner boundary, the "top surface" (walkable surface) sits along the top with the top 1/6 of the tile left transparent (sky) above it.

LAYOUT: canvas 1536 x 1024 px, transparent background, ONE row of 3 square tiles (each about 460 x 460 px), vertically centered, separated by at least 40 px of transparent space.

TILES: Tile 1: INNER CORNER (top-left): fully opaque square of interior material with a small piece of the top surface (grass/moss) only in its TOP-LEFT corner, as if the surface turned a concave corner. Tile 2: INNER CORNER (rock): fully opaque square of interior material with a small cluster of edge-band material only in its TOP-LEFT corner, no top surface. Tile 3: COLUMN: a one-tile-wide vertical pillar: edge bands along BOTH the left and right sides, interior strip in the middle, fully opaque, tileable vertically.

Output: one PNG, 1536 x 1024 px, 3 tiles, no text.
```

#### `tuiles_flottantes`

**Prompt → `assets/_codex_src/tuiles_flottantes_sol.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

TERRAIN TILESET material: DAYLIGHT FLOATING ISLAND earth: the solid mass is warm light-brown earth with small pebbles, sunlit; the walkable top surface is bright fresh green grass with tiny white and yellow flowers; exposed side and bottom edges are pale sandstone rocks with dangling little roots (bright, daytime palette). Each tile is a SQUARE seamless terrain tile seen from the side (platformer cross-section), designed so neighbouring tiles connect seamlessly: interior material continues across tile borders, the "edge band" (exposed border of the terrain mass) is about one quarter of a tile deep with an irregular inner boundary, the "top surface" (walkable surface) sits along the top with the top 1/6 of the tile left transparent (sky) above it.

LAYOUT: canvas 1024 x 1024 px, transparent background, an exact 4 x 4 grid of square tiles (each about 240 x 240 px) separated by 16 px transparent gaps; each tile has slightly rounded corners. All tiles share the same scale, palette and lighting.

TILES:
Cell row 1, column 1: TOP-LEFT corner: grass/top surface along the top AND exposed edge band along the left side; transparent sky above the top surface (top 1/6 of the tile empty).
Cell row 1, column 2: TOP edge: top surface along the top only; transparent sky above it (top 1/6 empty).
Cell row 1, column 3: TOP-RIGHT corner: top surface along the top AND edge band along the right side; transparent sky above.
Cell row 1, column 4: plain interior variant, fully opaque, no edges.
Cell row 2, column 1: LEFT edge: edge band along the left side only, fully opaque.
Cell row 2, column 2: CENTER: plain interior, fully opaque, no edges, seamlessly tileable on all sides.
Cell row 2, column 3: RIGHT edge: edge band along the right side only, fully opaque.
Cell row 2, column 4: plain interior variant, fully opaque.
Cell row 3, column 1: BOTTOM-LEFT corner: edge bands along the left and bottom sides.
Cell row 3, column 2: BOTTOM edge: edge band along the bottom only.
Cell row 3, column 3: BOTTOM-RIGHT corner: edge bands along the right and bottom sides.
Cell row 3, column 4: plain interior variant, fully opaque.
Cell row 4, column 1: plain interior variant, fully opaque.
Cell row 4, column 2: plain interior variant, fully opaque.
Cell row 4, column 3: plain interior variant, fully opaque.
Cell row 4, column 4: one more plain interior variant (ignored by the import script).

Output: one PNG, 1024 x 1024 px, 16 tiles, no text.
```

**Prompt → `assets/_codex_src/tuiles_flottantes_plateformes.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

TERRAIN TILESET material: DAYLIGHT FLOATING ISLAND earth: the solid mass is warm light-brown earth with small pebbles, sunlit; the walkable top surface is bright fresh green grass with tiny white and yellow flowers; exposed side and bottom edges are pale sandstone rocks with dangling little roots (bright, daytime palette). Each tile is a SQUARE seamless terrain tile seen from the side (platformer cross-section), designed so neighbouring tiles connect seamlessly: interior material continues across tile borders, the "edge band" (exposed border of the terrain mass) is about one quarter of a tile deep with an irregular inner boundary, the "top surface" (walkable surface) sits along the top with the top 1/6 of the tile left transparent (sky) above it.

LAYOUT: canvas 1536 x 1024 px, transparent background, ONE row of 3 square tiles (each about 460 x 460 px), vertically centered, separated by at least 40 px of transparent space.

TILES: Tile 1: a floating one-tile-thick PLATFORM tile used in the MIDDLE of a platform: top surface on top (transparent sky above it), edge band along the BOTTOM, open (no edge) on left and right. Tile 2: a single isolated PLATFORM tile: top surface on top, edge band along the bottom AND on both the left and right sides. Tile 3: a PLATFORM END tile (left end): top surface on top, edge band along the bottom and the LEFT side, open on the right.

Output: one PNG, 1536 x 1024 px, 3 tiles, no text.
```

**Prompt → `assets/_codex_src/tuiles_flottantes_speciaux.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

TERRAIN TILESET material: DAYLIGHT FLOATING ISLAND earth: the solid mass is warm light-brown earth with small pebbles, sunlit; the walkable top surface is bright fresh green grass with tiny white and yellow flowers; exposed side and bottom edges are pale sandstone rocks with dangling little roots (bright, daytime palette). Each tile is a SQUARE seamless terrain tile seen from the side (platformer cross-section), designed so neighbouring tiles connect seamlessly: interior material continues across tile borders, the "edge band" (exposed border of the terrain mass) is about one quarter of a tile deep with an irregular inner boundary, the "top surface" (walkable surface) sits along the top with the top 1/6 of the tile left transparent (sky) above it.

LAYOUT: canvas 1536 x 1024 px, transparent background, ONE row of 3 square tiles (each about 460 x 460 px), vertically centered, separated by at least 40 px of transparent space.

TILES: Tile 1: INNER CORNER (top-left): fully opaque square of interior material with a small piece of the top surface (grass/moss) only in its TOP-LEFT corner, as if the surface turned a concave corner. Tile 2: INNER CORNER (rock): fully opaque square of interior material with a small cluster of edge-band material only in its TOP-LEFT corner, no top surface. Tile 3: COLUMN: a one-tile-wide vertical pillar: edge bands along BOTH the left and right sides, interior strip in the middle, fully opaque, tileable vertically.

Output: one PNG, 1536 x 1024 px, 3 tiles, no text.
```

#### `tuiles_corrompues`

**Prompt → `assets/_codex_src/tuiles_corrompues_sol.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

TERRAIN TILESET material: CORRUPTED GROUND: the solid mass is dark grey-violet sick earth with veins of glowing toxic-green; the walkable top surface is a crust of glowing toxic-green moss dripping over the edge with pale sickly mushrooms; exposed side and bottom edges are blackened rocks covered with moss slime. Each tile is a SQUARE seamless terrain tile seen from the side (platformer cross-section), designed so neighbouring tiles connect seamlessly: interior material continues across tile borders, the "edge band" (exposed border of the terrain mass) is about one quarter of a tile deep with an irregular inner boundary, the "top surface" (walkable surface) sits along the top with the top 1/6 of the tile left transparent (sky) above it.

LAYOUT: canvas 1024 x 1024 px, transparent background, an exact 4 x 4 grid of square tiles (each about 240 x 240 px) separated by 16 px transparent gaps; each tile has slightly rounded corners. All tiles share the same scale, palette and lighting.

TILES:
Cell row 1, column 1: TOP-LEFT corner: grass/top surface along the top AND exposed edge band along the left side; transparent sky above the top surface (top 1/6 of the tile empty).
Cell row 1, column 2: TOP edge: top surface along the top only; transparent sky above it (top 1/6 empty).
Cell row 1, column 3: TOP-RIGHT corner: top surface along the top AND edge band along the right side; transparent sky above.
Cell row 1, column 4: plain interior variant, fully opaque, no edges.
Cell row 2, column 1: LEFT edge: edge band along the left side only, fully opaque.
Cell row 2, column 2: CENTER: plain interior, fully opaque, no edges, seamlessly tileable on all sides.
Cell row 2, column 3: RIGHT edge: edge band along the right side only, fully opaque.
Cell row 2, column 4: plain interior variant, fully opaque.
Cell row 3, column 1: BOTTOM-LEFT corner: edge bands along the left and bottom sides.
Cell row 3, column 2: BOTTOM edge: edge band along the bottom only.
Cell row 3, column 3: BOTTOM-RIGHT corner: edge bands along the right and bottom sides.
Cell row 3, column 4: plain interior variant, fully opaque.
Cell row 4, column 1: plain interior variant, fully opaque.
Cell row 4, column 2: plain interior variant, fully opaque.
Cell row 4, column 3: plain interior variant, fully opaque.
Cell row 4, column 4: one more plain interior variant (ignored by the import script).

Output: one PNG, 1024 x 1024 px, 16 tiles, no text.
```

**Prompt → `assets/_codex_src/tuiles_corrompues_plateformes.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

TERRAIN TILESET material: CORRUPTED GROUND: the solid mass is dark grey-violet sick earth with veins of glowing toxic-green; the walkable top surface is a crust of glowing toxic-green moss dripping over the edge with pale sickly mushrooms; exposed side and bottom edges are blackened rocks covered with moss slime. Each tile is a SQUARE seamless terrain tile seen from the side (platformer cross-section), designed so neighbouring tiles connect seamlessly: interior material continues across tile borders, the "edge band" (exposed border of the terrain mass) is about one quarter of a tile deep with an irregular inner boundary, the "top surface" (walkable surface) sits along the top with the top 1/6 of the tile left transparent (sky) above it.

LAYOUT: canvas 1536 x 1024 px, transparent background, ONE row of 3 square tiles (each about 460 x 460 px), vertically centered, separated by at least 40 px of transparent space.

TILES: Tile 1: a floating one-tile-thick PLATFORM tile used in the MIDDLE of a platform: top surface on top (transparent sky above it), edge band along the BOTTOM, open (no edge) on left and right. Tile 2: a single isolated PLATFORM tile: top surface on top, edge band along the bottom AND on both the left and right sides. Tile 3: a PLATFORM END tile (left end): top surface on top, edge band along the bottom and the LEFT side, open on the right.

Output: one PNG, 1536 x 1024 px, 3 tiles, no text.
```

**Prompt → `assets/_codex_src/tuiles_corrompues_speciaux.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

TERRAIN TILESET material: CORRUPTED GROUND: the solid mass is dark grey-violet sick earth with veins of glowing toxic-green; the walkable top surface is a crust of glowing toxic-green moss dripping over the edge with pale sickly mushrooms; exposed side and bottom edges are blackened rocks covered with moss slime. Each tile is a SQUARE seamless terrain tile seen from the side (platformer cross-section), designed so neighbouring tiles connect seamlessly: interior material continues across tile borders, the "edge band" (exposed border of the terrain mass) is about one quarter of a tile deep with an irregular inner boundary, the "top surface" (walkable surface) sits along the top with the top 1/6 of the tile left transparent (sky) above it.

LAYOUT: canvas 1536 x 1024 px, transparent background, ONE row of 3 square tiles (each about 460 x 460 px), vertically centered, separated by at least 40 px of transparent space.

TILES: Tile 1: INNER CORNER (top-left): fully opaque square of interior material with a small piece of the top surface (grass/moss) only in its TOP-LEFT corner, as if the surface turned a concave corner. Tile 2: INNER CORNER (rock): fully opaque square of interior material with a small cluster of edge-band material only in its TOP-LEFT corner, no top surface. Tile 3: COLUMN: a one-tile-wide vertical pillar: edge bands along BOTH the left and right sides, interior strip in the middle, fully opaque, tileable vertically.

Output: one PNG, 1536 x 1024 px, 3 tiles, no text.
```

## P3 — finition

### [P3] `cochon_bebe` — Bébé cochon

- **Image(s) à produire** : `assets/sprites/cochon_bebe.png` (1536x1024)
- **Découpe** : `assets/sprites/cochon_bebe_frames/cochon_bebe_row<r>_<c>.png` (auto, `tools/import_codex_assets.py`, mode `blob`)
- **Orientation** : regarde à DROITE — **hauteur source** : ~160 px — **échelle en jeu** : `0.2` (≈ 32 px à l'écran)
- **Anims (manifest)** : `idle` (row 0, 4 fr.), `walk` (row 1, 4 fr.)

| Rangée (manifest) | Image | Animation | Frames | fps | Poses (gauche → droite) |
|---|---|---|---|---|---|
| 0 | cochon_bebe.png (rangée image 1) | `idle` (repos (boucle)) | 4 | 5 boucle | 1. standing, sniffing the ground / 2. head up, ears flopping / 3. tail wiggling / 4. sitting on its haunches |
| 1 | cochon_bebe.png (rangée image 2) | `walk` (trotte (boucle)) | 4 | 10 boucle | 1. trotting right, legs diagonal pair forward / 2. legs gathered / 3. other diagonal pair forward / 4. bouncy airborne moment |

**Prompt → `assets/sprites/cochon_bebe.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

CHARACTER: BABY PIGLET: a cute round baby forest piglet (wild boar piglet), soft pink-brown fur with cream horizontal stripes on its back like a wild boar baby, tiny curly tail, big dark shiny eyes, little snout.

SPRITE SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background. Exactly 2 horizontal row(s); each row is ONE animation, read left to right. Frames are laid out on an invisible regular grid: each row is a horizontal band about 512 px tall, each frame cell is about 384 px wide, and each pose is centered horizontally in its cell with the feet (or lowest point) on the same baseline within a row. Leave at least 40 px of empty transparent space between neighboring frames and at least 60 px of empty transparent space between rows: no part of a frame (hair, tail, cape, weapon, trunk, legs) may touch or overlap another frame or reach into another row. Every frame is ONE single connected silhouette: held objects must touch the hand; NO detached particles, sparkles, sweat drops, dust clouds, motion lines, speed lines, impact stars, sound effects or floating debris; NO cast shadow on the ground; NO ground line. Same character, same scale, same proportions and same colors in every frame and every row. The piglet is about 160 px tall and 220 px long. The character faces RIGHT in every frame. No text, no numbers, no labels, no grid lines, no borders.

ROWS:
Row 1 (from top) - animation "idle", exactly 4 frame(s). Frame 1: standing, sniffing the ground. Frame 2: head up, ears flopping. Frame 3: tail wiggling. Frame 4: sitting on its haunches.
Row 2 (from top) - animation "walk", exactly 4 frame(s). Frame 1: trotting right, legs diagonal pair forward. Frame 2: legs gathered. Frame 3: other diagonal pair forward. Frame 4: bouncy airborne moment.

Output: one PNG image, 1536 x 1024 px, transparent background, exactly 2 row(s), 4 / 4 frames per row.
```

### [P3] `poisson` — Poisson de la source

- **Image(s) à produire** : `assets/sprites/poisson.png` (1536x1024)
- **Découpe** : `assets/sprites/poisson_frames/poisson_row<r>_<c>.png` (auto, `tools/import_codex_assets.py`, mode `blob`)
- **Orientation** : regarde à DROITE — **hauteur source** : ~120 px — **échelle en jeu** : `0.14` (≈ 17 px à l'écran)
- **Notes** : Une seule rangée centrée verticalement.
- **Anims (manifest)** : `idle` (row 0, 4 fr.)

| Rangée (manifest) | Image | Animation | Frames | fps | Poses (gauche → droite) |
|---|---|---|---|---|---|
| 0 | poisson.png (rangée image 1) | `idle` (nage (boucle)) | 4 | 8 boucle | 1. swimming right, tail bent up / 2. body straight / 3. tail bent down / 4. body straight, fins spread |

**Prompt → `assets/sprites/poisson.png`**

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

CHARACTER: FOREST FISH: a small healthy freshwater fish, silvery-teal body with soft violet fins, a few glowing cyan spots along its side, big round eye; drawn in profile, swimming to the RIGHT.

SPRITE SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background. Exactly 1 horizontal row(s); each row is ONE animation, read left to right. Frames are laid out on an invisible regular grid: each row is a horizontal band about 1024 px tall, each frame cell is about 384 px wide, and each pose is centered horizontally in its cell with the feet (or lowest point) on the same baseline within a row. Leave at least 40 px of empty transparent space between neighboring frames and at least 60 px of empty transparent space between rows: no part of a frame (hair, tail, cape, weapon, trunk, legs) may touch or overlap another frame or reach into another row. Every frame is ONE single connected silhouette: held objects must touch the hand; NO detached particles, sparkles, sweat drops, dust clouds, motion lines, speed lines, impact stars, sound effects or floating debris; NO cast shadow on the ground; NO ground line. Same character, same scale, same proportions and same colors in every frame and every row. The fish is about 260 px long and 120 px tall. The character faces RIGHT in every frame. No text, no numbers, no labels, no grid lines, no borders. The single row is vertically centered on the canvas.

ROWS:
Row 1 (from top) - animation "idle", exactly 4 frame(s). Frame 1: swimming right, tail bent up. Frame 2: body straight. Frame 3: tail bent down. Frame 4: body straight, fins spread.

Output: one PNG image, 1536 x 1024 px, transparent background, exactly 1 row(s), 4 frames per row.
```

### [P3] `titre_logo` — Logo titre « Legend of Agarica »

- **Image à produire** : `assets/_codex_src/titre_logo.png` (1536x1024) → **fichier final** `assets/ui/titre_logo.png` (normalisation `fit` 1024) — échelle `0.59`

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

A fantasy game TITLE LOGO reading exactly "Legend of Agarica" (spelled exactly like that, the ONLY text): "Legend of" small above, "AGARICA" large below, letters carved from glossy green-wood with gold edges, vines wrapping the letters, a glowing cyan mushroom dotting the letter i, a subtle red-haired druid hood silhouette and leaves behind the word. Readable, centered, no other text.

Output: one PNG image, 1536 x 1024 px, transparent background.
```

## Planches de décor (mode édition)

Pipeline existant, découpe **semi-manuelle** (non gérée par `import_codex_assets.py`) :

1. Déposer la planche dans `assets/decors/déco item/<section>/<section>_planche.png`.
2. `python tools/crop_deco_items.py <section>` → `assets/decors/deco_item_frames/<section>/<section>_NN.png` (ordre de lecture).
3. Renommer chaque fichier gardé en `<section>_<nom>.png` avec les noms ci-dessous (dans l'ordre de la planche), supprimer les déchets, déclarer la section dans `DECOR_SECTIONS` (`src/utils/LevelKit.js`). Échelle `PROP_SCALE` (0.4) comme le bosquet.
4. Ne JAMAIS relancer `crop_deco_items.py` sur une section déjà triée (il renumérote tout).

### [P2] Bosquet : bâtiments non découpés de `bosquet componant.png`

La planche existante contient en rangée 1 : cabane-arbre, hutte mousse, hutte paille, cottage, tour, tente, murailles (tour + 2 pans + tour + porte). Pour les découper SANS toucher aux 18 props déjà renommés :

1. Copier `assets/decors/déco item/bosquet/bosquet componant.png` dans un nouveau dossier `assets/decors/déco item/bosquet_batiments/`.
2. `python tools/crop_deco_items.py bosquet_batiments` → `assets/decors/deco_item_frames/bosquet_batiments/bosquet_batiments_NN.png`.
3. Garder uniquement les bâtiments de la 1re rangée (les autres sont des doublons des props déjà découpés, et les 7 tuiles du bas sont à jeter), les renommer `bosquet_cabane_arbre`, `bosquet_hutte_mousse`, `bosquet_hutte_paille`, `bosquet_cottage`, `bosquet_tour`, `bosquet_tente`, `bosquet_muraille` (les pans de muraille se touchent : ils sortent en UN seul morceau, à garder tel quel ou à recouper à la main), puis les déplacer dans `deco_item_frames/bosquet/` et supprimer le dossier temporaire `bosquet_batiments` (source + frames).

### [P2] Section `foret_sombre`

- **Image à produire** : `assets/decors/déco item/foret_sombre/foret_sombre_planche.png` (1536x1024)
- **Noms finaux (ordre de lecture)** : `foret_sombre_arbre_moussu`, `foret_sombre_souche_champignons`, `foret_sombre_rocher_mousse`, `foret_sombre_champignons_lumineux`, `foret_sombre_racine_arche`, `foret_sombre_buisson_epineux`, `foret_sombre_tronc_couche`, `foret_sombre_fougere_sombre`, `foret_sombre_toile_araignee`, `foret_sombre_mare_bord`, `foret_sombre_pierre_runique`, `foret_sombre_fleur_corniche`

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

DECOR PROPS SHEET: dark night forest props (violet-indigo-teal palette, glowing cyan mushrooms, patches of toxic moss). Clearly pixel-art style like the existing village props sheet (huts, trees, well, barrels). Canvas 1536 x 1024 px, fully transparent background. Draw these 12 props on an invisible grid of 4 columns x 3 rows, in this exact reading order (left to right, top to bottom), each prop standing on a flat bottom edge (so it can sit on the ground), side / slight-front view, with at least 50 px of EMPTY transparent space between props: no prop may touch another. Each prop is one connected piece, no detached particles, no ground strip, no cast shadow, no text.

PROPS:
1. a dark twisted tree covered with hanging moss
2. a tree stump covered in glowing cyan mushrooms
3. a big mossy boulder
4. a cluster of tall glowing cyan mushrooms
5. a huge arching root
6. a dark thorny bush
7. a fallen hollow log
8. a clump of dark ferns
9. a large spider web stretched between two broken branches (web attached to the branches)
10. a small clear forest pond seen from the side, with stones around it (healthy water, faint cyan glow)
11. an ancient standing stone with a carved spiral rune glowing faint green
12. a ledge of rock with the white resistant flower on top, moss forming a ring around it but never touching it

Output: one PNG, 1536 x 1024 px.
```

### [P2] Section `grand_arbre`

- **Image à produire** : `assets/decors/déco item/grand_arbre/grand_arbre_planche.png` (1536x1024)
- **Noms finaux (ordre de lecture)** : `grand_arbre_racine_tunnel`, `grand_arbre_champignon_etagere`, `grand_arbre_nid_singe`, `grand_arbre_tas_pierres`, `grand_arbre_morceaux_ecorce`, `grand_arbre_lanterne_lucioles`, `grand_arbre_statue_simien`, `grand_arbre_rideau_lianes`, `grand_arbre_trou_tronc`, `grand_arbre_autel_singe`

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

DECOR PROPS SHEET: giant tree interior props (bark, wood, lianas, shelf fungus). Clearly pixel-art style like the existing village props sheet (huts, trees, well, barrels). Canvas 1536 x 1024 px, fully transparent background. Draw these 10 props on an invisible grid of 4 columns x 3 rows, in this exact reading order (left to right, top to bottom), each prop standing on a flat bottom edge (so it can sit on the ground), side / slight-front view, with at least 50 px of EMPTY transparent space between props: no prop may touch another. Each prop is one connected piece, no detached particles, no ground strip, no cast shadow, no text.

PROPS:
1. a root arch forming a tunnel entrance
2. large shelf fungi growing out of a piece of bark
3. a big monkey nest of branches and leaves
4. a pile of throwing rocks
5. fallen bark chunks
6. a hanging lantern made of a seed pod full of fireflies
7. a carved stone statue of a seated ape king with a stone crown
8. a curtain of hanging lianas (decorative, attached to a branch at the top)
9. a hollow knot hole in a piece of bark with glowing eyes inside
10. a small stone altar with a carved spiral-tail symbol

Output: one PNG, 1536 x 1024 px.
```

### [P2] Section `foret_flottante`

- **Image à produire** : `assets/decors/déco item/foret_flottante/foret_flottante_planche.png` (1536x1024)
- **Noms finaux (ordre de lecture)** : `foret_flottante_ile_petite`, `foret_flottante_ile_moyenne`, `foret_flottante_rocher_flottant`, `foret_flottante_nuage`, `foret_flottante_arbre_jeune`, `foret_flottante_pont_corde`, `foret_flottante_tente_galter`, `foret_flottante_panneau_galter`, `foret_flottante_pissenlit_geant`, `foret_flottante_fleurs_hautes`

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

DECOR PROPS SHEET: DAYLIGHT props above the canopy (bright, warm sunlight, fresh greens, sky blues). Clearly pixel-art style like the existing village props sheet (huts, trees, well, barrels). Canvas 1536 x 1024 px, fully transparent background. Draw these 10 props on an invisible grid of 4 columns x 3 rows, in this exact reading order (left to right, top to bottom), each prop standing on a flat bottom edge (so it can sit on the ground), side / slight-front view, with at least 50 px of EMPTY transparent space between props: no prop may touch another. Each prop is one connected piece, no detached particles, no ground strip, no cast shadow, no text.

PROPS:
1. a small floating island of earth and roots with grass on top
2. a medium floating island with a small tree
3. a floating rock with dangling roots
4. a fluffy white cloud
5. a young sunlit tree with bright leaves
6. a short rope-and-plank bridge section
7. Galter's small patched ranger tent with a map pinned on it
8. a wooden signpost covered with scribbled notes and arrows (no readable text)
9. a giant dandelion with seeds
10. a clump of tall wildflowers

Output: one PNG, 1536 x 1024 px.
```

### [P2] Section `foret_corrompue`

- **Image à produire** : `assets/decors/déco item/foret_corrompue/foret_corrompue_planche.png` (1536x1024)
- **Noms finaux (ordre de lecture)** : `foret_corrompue_arbre_malade`, `foret_corrompue_souche_corrompue`, `foret_corrompue_pustule_mousse`, `foret_corrompue_racine_tordue`, `foret_corrompue_os_creature`, `foret_corrompue_cocon_mousse`, `foret_corrompue_champignon_toxique`, `foret_corrompue_rocher_fissure`, `foret_corrompue_pilier_arene`, `foret_corrompue_arche_arene`, `foret_corrompue_pierre_symbole`

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

DECOR PROPS SHEET: CORRUPTED forest props (toxic glowing green moss, sickly violet, dead grey wood). Clearly pixel-art style like the existing village props sheet (huts, trees, well, barrels). Canvas 1536 x 1024 px, fully transparent background. Draw these 11 props on an invisible grid of 4 columns x 3 rows, in this exact reading order (left to right, top to bottom), each prop standing on a flat bottom edge (so it can sit on the ground), side / slight-front view, with at least 50 px of EMPTY transparent space between props: no prop may touch another. Each prop is one connected piece, no detached particles, no ground strip, no cast shadow, no text.

PROPS:
1. a sick twisted dead tree draped in dripping toxic moss
2. a corrupted stump oozing moss
3. a bulging pustule of toxic moss
4. a twisted blackened root
5. a large creature skull half covered with moss
6. a hanging cocoon of moss
7. tall pale sickly mushrooms with green spots
8. a cracked rock leaking green glow
9. a broken ancient stone pillar with spiral runes, moss-covered
10. a ruined stone arch entrance with moss
11. a flat stone with an ancient spider-like symbol carved in it (the symbol Xara recognizes)

Output: one PNG, 1536 x 1024 px.
```

### [P2] Section `hutte_morgat`

- **Image à produire** : `assets/decors/déco item/hutte_morgat/hutte_morgat_planche.png` (1536x1024)
- **Noms finaux (ordre de lecture)** : `hutte_morgat_hutte_morgat`, `hutte_morgat_chaudron`, `hutte_morgat_etagere_bocaux`, `hutte_morgat_table_herbes`, `hutte_morgat_sechoir_plantes`, `hutte_morgat_lanterne_papillons`, `hutte_morgat_panier_plantes`, `hutte_morgat_tapis_rond`, `hutte_morgat_pot_fleurs`, `hutte_morgat_bocal_papillons`

```text
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

DECOR PROPS SHEET: Morgat's healer hut props (warm, cozy, herbal, filled with glowing butterflies, teal-orange-violet accents). Clearly pixel-art style like the existing village props sheet (huts, trees, well, barrels). Canvas 1536 x 1024 px, fully transparent background. Draw these 10 props on an invisible grid of 4 columns x 3 rows, in this exact reading order (left to right, top to bottom), each prop standing on a flat bottom edge (so it can sit on the ground), side / slight-front view, with at least 50 px of EMPTY transparent space between props: no prop may touch another. Each prop is one connected piece, no detached particles, no ground strip, no cast shadow, no text.

PROPS:
1. Morgat's hut exterior: a round hut of woven branches and moss roof shaped like folded butterfly wings, a round door, a few glowing butterflies resting on the roof
2. a small bubbling cauldron on a tripod over embers
3. a wooden shelf full of jars and vials
4. a work table with herbs, mortar and books
5. a rack with hanging drying plants
6. a glass lantern full of glowing butterflies
7. a wicker basket of gathered plants
8. a round woven rug (side view, flat)
9. a clay pot of flowers
10. a big jar with butterflies inside

Output: one PNG, 1536 x 1024 px.
```

## Checklist

| ID | Fichier(s) Codex | Sortie | Priorité | Statut |
|---|---|---|---|---|
| `agarica_extra` | `assets/sprites/agarica_extra.png`<br>`assets/sprites/agarica_extra_p2.png`<br>`assets/sprites/agarica_extra_p3.png`<br>`assets/sprites/agarica_extra_p4.png` | `assets/sprites/agarica_extra_frames/` | P1 | à générer |
| `singe` | `assets/sprites/singe.png`<br>`assets/sprites/singe_p2.png` | `assets/sprites/singe_frames/` | P1 | à générer |
| `xara_extra` | `assets/sprites/xara_extra.png` | `assets/sprites/xara_extra_frames/` | P1 | à générer |
| `pere_chef` | `assets/sprites/pere_chef.png` | `assets/sprites/pere_chef_frames/` | P1 | à générer |
| `amanite` | `assets/sprites/amanite.png`<br>`assets/sprites/amanite_p2.png` | `assets/sprites/amanite_frames/` | P1 | à générer |
| `galter` | `assets/sprites/galter.png`<br>`assets/sprites/galter_p2.png` | `assets/sprites/galter_frames/` | P1 | à générer |
| `morgat` | `assets/sprites/morgat.png` | `assets/sprites/morgat_frames/` | P1 | à générer |
| `papillon` | `assets/sprites/papillon.png` | `assets/sprites/papillon_frames/` | P1 | à générer |
| `kainati` | `assets/sprites/kainati.png`<br>`assets/sprites/kainati_p2.png`<br>`assets/sprites/kainati_p3.png`<br>`assets/sprites/kainati_p4.png` | `assets/sprites/kainati_frames/` | P1 | à générer |
| `ghilt` | `assets/sprites/ghilt.png`<br>`assets/sprites/ghilt_p2.png`<br>`assets/sprites/ghilt_p3.png`<br>`assets/sprites/ghilt_p4.png` | `assets/sprites/ghilt_frames/` | P1 | à générer |
| `ghilt_gueri` | `assets/sprites/ghilt_gueri.png` | `assets/sprites/ghilt_gueri_frames/` | P1 | à générer |
| `vfx_soin_papillon` | `assets/vfx/vfx_soin_papillon.png` | `assets/vfx/vfx_soin_papillon_frames/` | P1 | à générer |
| `pierre` | `assets/_codex_src/objets_A.png` | `assets/items/objets/pierre.png` | P1 | à générer |
| `idole` | `assets/_codex_src/objets_A.png` | `assets/items/objets/idole.png` | P1 | à générer |
| `idole_fragment` | `assets/_codex_src/objets_A.png` | `assets/items/objets/idole_fragment.png` | P1 | à générer |
| `talisman_ours` | `assets/_codex_src/objets_A.png` | `assets/items/objets/talisman_ours.png` | P1 | à générer |
| `talisman_singe` | `assets/_codex_src/objets_A.png` | `assets/items/objets/talisman_singe.png` | P1 | à générer |
| `totem_poche_casse` | `assets/_codex_src/objets_A.png` | `assets/items/objets/totem_poche_casse.png` | P1 | à générer |
| `totem_poche_actif` | `assets/_codex_src/objets_B.png` | `assets/items/objets/totem_poche_actif.png` | P1 | à générer |
| `bocal_antidote` | `assets/_codex_src/objets_B.png` | `assets/items/objets/bocal_antidote.png` | P1 | à générer |
| `repulsif` | `assets/_codex_src/objets_B.png` | `assets/items/objets/repulsif.png` | P1 | à générer |
| `fleur_resistante` | `assets/_codex_src/objets_B.png` | `assets/items/objets/fleur_resistante.png` | P1 | à générer |
| `carte_galter` | `assets/_codex_src/objets_B.png` | `assets/items/objets/carte_galter.png` | P1 | à générer |
| `lance_amanite` | `assets/_codex_src/objets_B.png` | `assets/items/objets/lance_amanite.png` | P1 | à générer |
| `mousse_amas_intact` | `assets/_codex_src/mousse_amas.png` | `assets/items/objets/mousse_amas_intact.png` | P1 | à générer |
| `mousse_amas_fissure` | `assets/_codex_src/mousse_amas.png` | `assets/items/objets/mousse_amas_fissure.png` | P1 | à générer |
| `totem_monkey_dim` | `assets/_codex_src/totems_singe.png` | `assets/items/totem_frames/totem_monkey_dim.png` | P1 | à générer |
| `totem_monkey_lit` | `assets/_codex_src/totems_singe.png` | `assets/items/totem_frames/totem_monkey_lit.png` | P1 | à générer |
| `liane` | `assets/_codex_src/liane.png` | `assets/items/objets/liane.png` | P1 | à générer |
| `mousse_mur` | `assets/_codex_src/mousse_mur.png` | `assets/items/objets/mousse_mur.png` | P1 | à générer |
| `dialogue_box` | `assets/_codex_src/dialogue_box.png` | `assets/ui/dialogue_box.png` | P1 | à générer |
| `portrait_agarica` | `assets/_codex_src/portrait_agarica.png` | `assets/ui/portraits/agarica.png` | P1 | à générer |
| `portrait_xara` | `assets/_codex_src/portrait_xara.png` | `assets/ui/portraits/xara.png` | P1 | à générer |
| `portrait_amanite` | `assets/_codex_src/portrait_amanite.png` | `assets/ui/portraits/amanite.png` | P1 | à générer |
| `portrait_pere_chef` | `assets/_codex_src/portrait_pere_chef.png` | `assets/ui/portraits/pere_chef.png` | P1 | à générer |
| `portrait_galter` | `assets/_codex_src/portrait_galter.png` | `assets/ui/portraits/galter.png` | P1 | à générer |
| `portrait_morgat` | `assets/_codex_src/portrait_morgat.png` | `assets/ui/portraits/morgat.png` | P1 | à générer |
| `portrait_kainati` | `assets/_codex_src/portrait_kainati.png` | `assets/ui/portraits/kainati.png` | P1 | à générer |
| `portrait_ghilt` | `assets/_codex_src/portrait_ghilt.png` | `assets/ui/portraits/ghilt.png` | P1 | à générer |
| `fond_trou_sombre` | `assets/_codex_src/fond_trou_sombre.png` | `assets/decors/fonds/fond_trou_sombre.png` | P1 | à générer |
| `transfo_singe` | `assets/sprites/transfo_singe.png` | `assets/sprites/transfo_singe_frames/` | P2 | à générer |
| `habitant_druide` | `assets/sprites/habitant_druide.png` | `assets/sprites/habitant_druide_frames/` | P2 | à générer |
| `habitant_porteur` | `assets/sprites/habitant_porteur.png` | `assets/sprites/habitant_porteur_frames/` | P2 | à générer |
| `habitant_garde` | `assets/sprites/habitant_garde.png` | `assets/sprites/habitant_garde_frames/` | P2 | à générer |
| `clak` | `assets/sprites/clak.png` | `assets/sprites/clak_frames/` | P2 | à générer |
| `kainati_esprit` | `assets/sprites/kainati_esprit.png` | `assets/sprites/kainati_esprit_frames/` | P2 | à générer |
| `loup_sanguinaire` | `assets/sprites/loup_sanguinaire.png` | `assets/sprites/loup_sanguinaire_frames/` | P2 | à générer |
| `araignee` | `assets/sprites/araignee.png` | `assets/sprites/araignee_frames/` | P2 | à générer |
| `mousse_creature` | `assets/sprites/mousse_creature.png` | `assets/sprites/mousse_creature_frames/` | P2 | à générer |
| `crapaud_corrompu` | `assets/sprites/crapaud_corrompu.png` | `assets/sprites/crapaud_corrompu_frames/` | P2 | à générer |
| `singe_corrompu` | `assets/sprites/singe_corrompu.png` | `assets/sprites/singe_corrompu_frames/` | P2 | à générer |
| `vfx_souffle_toxique` | `assets/vfx/vfx_souffle_toxique.png` | `assets/vfx/vfx_souffle_toxique_frames/` | P2 | à générer |
| `vfx_flaque_mousse` | `assets/vfx/vfx_flaque_mousse.png` | `assets/vfx/vfx_flaque_mousse_frames/` | P2 | à générer |
| `vfx_purification` | `assets/vfx/vfx_purification.png` | `assets/vfx/vfx_purification_frames/` | P2 | à générer |
| `vfx_piste_loup` | `assets/vfx/vfx_piste_loup.png` | `assets/vfx/vfx_piste_loup_frames/` | P2 | à générer |
| `vfx_impact_pierre` | `assets/vfx/vfx_impact_pierre.png` | `assets/vfx/vfx_impact_pierre_frames/` | P2 | à générer |
| `hud_coeur` | `assets/_codex_src/hud_coeurs.png` | `assets/ui/hud_coeur.png` | P2 | à générer |
| `hud_coeur_vide` | `assets/_codex_src/hud_coeurs.png` | `assets/ui/hud_coeur_vide.png` | P2 | à générer |
| `porte_mousse` | `assets/_codex_src/porte_mousse.png` | `assets/items/objets/porte_mousse.png` | P2 | à générer |
| `courant_air` | `assets/_codex_src/courant_air.png` | `assets/items/objets/courant_air.png` | P2 | à générer |
| `form_icone_singe` | `assets/_codex_src/form_icone_singe.png` | `assets/items/form_icone/singe.png` | P2 | à générer |
| `skill_icone_ours` | `assets/_codex_src/skill_icone_ours.png` | `assets/items/skill_icone/ours.png` | P2 | à générer |
| `skill_icone_singe` | `assets/_codex_src/skill_icone_singe.png` | `assets/items/skill_icone/singe.png` | P2 | à générer |
| `skill_icone_papillon` | `assets/_codex_src/skill_icone_papillon.png` | `assets/items/skill_icone/papillon.png` | P2 | à générer |
| `carte_parchemin` | `assets/_codex_src/carte_parchemin.png` | `assets/ui/carte_parchemin.png` | P2 | à générer |
| `fond_bosquet` | `assets/_codex_src/fond_bosquet.png` | `assets/decors/fonds/fond_bosquet.png` | P2 | à générer |
| `fond_grand_arbre` | `assets/_codex_src/fond_grand_arbre.png` | `assets/decors/fonds/fond_grand_arbre.png` | P2 | à générer |
| `fond_foret_flottante` | `assets/_codex_src/fond_foret_flottante.png` | `assets/decors/fonds/fond_foret_flottante.png` | P2 | à générer |
| `fond_foret_corrompue` | `assets/_codex_src/fond_foret_corrompue.png` | `assets/decors/fonds/fond_foret_corrompue.png` | P2 | à générer |
| `fond_monde_spirituel` | `assets/_codex_src/fond_monde_spirituel.png` | `assets/decors/fonds/fond_monde_spirituel.png` | P2 | à générer |
| `fond_arene_ghilt` | `assets/_codex_src/fond_arene_ghilt.png` | `assets/decors/fonds/fond_arene_ghilt.png` | P2 | à générer |
| `tuiles_ecorce` | `assets/_codex_src/tuiles_ecorce_sol.png`<br>`…_plateformes.png`<br>`…_speciaux.png` | `assets/decors/tuiles_ecorce_frames/` | P2 | à générer |
| `tuiles_flottantes` | `assets/_codex_src/tuiles_flottantes_sol.png`<br>`…_plateformes.png`<br>`…_speciaux.png` | `assets/decors/tuiles_flottantes_frames/` | P2 | à générer |
| `tuiles_corrompues` | `assets/_codex_src/tuiles_corrompues_sol.png`<br>`…_plateformes.png`<br>`…_speciaux.png` | `assets/decors/tuiles_corrompues_frames/` | P2 | à générer |
| `bosquet (bâtiments)` | (planche existante) | `assets/decors/deco_item_frames/bosquet/` | P2 | à générer |
| `décor foret_sombre` | `assets/decors/déco item/foret_sombre/foret_sombre_planche.png` | `assets/decors/deco_item_frames/foret_sombre/` | P2 | à générer |
| `décor grand_arbre` | `assets/decors/déco item/grand_arbre/grand_arbre_planche.png` | `assets/decors/deco_item_frames/grand_arbre/` | P2 | à générer |
| `décor foret_flottante` | `assets/decors/déco item/foret_flottante/foret_flottante_planche.png` | `assets/decors/deco_item_frames/foret_flottante/` | P2 | à générer |
| `décor foret_corrompue` | `assets/decors/déco item/foret_corrompue/foret_corrompue_planche.png` | `assets/decors/deco_item_frames/foret_corrompue/` | P2 | à générer |
| `décor hutte_morgat` | `assets/decors/déco item/hutte_morgat/hutte_morgat_planche.png` | `assets/decors/deco_item_frames/hutte_morgat/` | P2 | à générer |
| `cochon_bebe` | `assets/sprites/cochon_bebe.png` | `assets/sprites/cochon_bebe_frames/` | P3 | à générer |
| `poisson` | `assets/sprites/poisson.png` | `assets/sprites/poisson_frames/` | P3 | à générer |
| `titre_logo` | `assets/_codex_src/titre_logo.png` | `assets/ui/titre_logo.png` | P3 | à générer |
