# Prompt Codex n°10 — refonte de la forme papillon (2026-10-26)

**Demande de l'utilisateur** : « la forme de papillon pour la compétence n'est pas belle ». La forme actuelle (prompt n°6 et lot n°8) est un hybride : une petite tête d'Agarica, avec ses cheveux et ses yeux, posée sur un corps de papillon. Les autres formes (loup, singe, aigle) sont de vrais animaux. La refonte en fait un **vrai papillon lunaire**, sans visage humain, élégant et dans la direction artistique du jeu : violet nuit, vert lunaire, touches de rose.

Depuis le 2026-10-24, le papillon n'est qu'une **compétence** : le soin des créatures corrompues (touche de compétence, ou cinématique du sauvetage de Ghil't). En jeu, Agarica se transforme brièvement (`transfo_papillon`), incante en papillon (`forme_papillon_extra` : `cast`), puis reprend sa forme. `forme_papillon` sert à la calibration (taille) et au repli.

**Les ids, les animations et les nombres de frames ne changent pas** : ils sont déjà dans `src/data/asset_manifest.js` et le code les utilise. Il suffit de remplacer les trois images, puis de les réimporter avec `--force`. Aucune modification de `src/` ni du manifeste.

| Image | Entrée du manifeste | Rangées | Frames | Rôle en jeu |
|---|---|---|---|---|
| `assets/sprites/forme_papillon.png` | `forme_papillon` | 3 : `flap`, `dash`, `glide` | 4 / 4 / 4 | calibration de taille (`dash`) et poses de repli |
| `assets/sprites/transfo_papillon.png` | `transfo_papillon` | 1 : `transform` | 4 | Agarica → papillon (et à l'envers pour le retour) |
| `assets/sprites/forme_papillon_extra.png` | `forme_papillon_extra` | 1 : `cast` | 4 | incantation du soin (pose principale de la compétence) |

**Échelle** : comme aujourd'hui, envergure d'environ 220 px dans la feuille (affichée à 0,34 en jeu, environ 75 px). Les poses sont centrées dans leur case (`align: center`) : le code centre le papillon sur le buste d'Agarica.

## Prompt à coller dans Codex

```
Refonte de la forme papillon d'Agarica pour « Legend of Agarica » (prompt n°10). 3 images à REMPLACER, mêmes chemins, mêmes rangées, mêmes nombres de frames que les images actuelles.

RÈGLES
- Avant d'écraser, archive les 3 images actuelles dans docs/production/controles/lot_10/avant/.
- Ne modifie ni `src/` ni le manifeste `src/data/asset_manifest.js` (les entrées existent déjà et ne changent pas).
- Fond transparent. Une rangée = une animation, nombre de frames EXACT. Frames séparées d'au moins 40 px, rangées d'au moins 60 px.
- Une silhouette connexe par frame : ailes, antennes, pattes et lumière tenue touchent le corps ; AUCUNE particule détachée (étincelles, poussière, traînées, pétales volants : le jeu les ajoute).
- Tourné vers la DROITE. Aucun texte, pas de sol, pas d'ombre portée.
- MÊME papillon, MÊME échelle et MÊMES couleurs dans toutes les frames des trois images.

RÉFÉRENCES À JOINDRE
- assets/ui/portraits/agarica.png (couleurs d'Agarica : cheveux AUBURN CLAIR #B5613A, yeux verts, cape verte, tatouage spirale rose sur le bras) ;
- assets/sprites/singe_frames/singe_row0_0.png et assets/sprites/loup_frames/loup_row0_0.png (ses autres formes animales : de VRAIS animaux, même rendu, yeux verts lumineux) ;
- assets/sprites/papillon_frames/papillon_row0_0.png (style des papillons lumineux du jeu) ;
- les 3 images actuelles (forme_papillon.png, transfo_papillon.png, forme_papillon_extra.png) : SEULEMENT pour la mise en page, les rangées, l'échelle et les poses. Le DESSIN change : plus de tête humaine.

[STYLE] (en tête de chaque prompt)
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. World palette: night forest in deep violet, indigo and teal, magical accents in luminous moonlit green (#8fe3b8) and touches of rose pink (#ff9fc9). Strict side view (profile).

[PAPILLON] (fiche identité, dans chaque prompt)
CHARACTER: AGARICA'S BUTTERFLY FORM, a REAL INSECT (NOT a hybrid: NO human head, NO face, NO hair, NO human eyes, NO arms): an elegant mystical moon butterfly, like a luna moth crossed with a swallowtail. Slender dark violet-black body with soft fine fuzz on the thorax, six thin dark legs, two long graceful antennae with small glowing mint-green tips, small glowing luminous-green insect eyes (the same magic green as her monkey and wolf forms). Large, refined wings: fore wings in deep night-violet fading to indigo, crossed by fine moonlit mint-green (#8fe3b8) vein lines that recall the leaf veins of Agarica's green cape; hind wings with long elegant swallowtail tails, each hind wing bearing a rose-pink (#ff9fc9) SPIRAL eye-spot that echoes the spiral tattoo on Agarica's arm; a thin luminous mint-green rim along every wing edge (drawn inside the outline, part of the silhouette). Graceful, magical, calm and noble; readable as a bright silhouette against a dark violet forest.

[MISE EN PAGE] (valeurs à remplir pour chaque image)
SPRITE SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background. Exactly {R} horizontal row(s); each row is ONE animation of {N} frames, read left to right; each frame is centered (horizontally AND vertically) in a cell about 384 px wide and {H} px tall. At least 40 px of empty space between frames and 60 px between rows. Every frame is ONE connected silhouette; NO detached sparkles, dust, trails, petals or motion lines; no ground, no shadow, no text. Same scale in every frame: wingspan about 220 px when the wings are open. Facing RIGHT (flying toward the right).

1) assets/sprites/forme_papillon.png (1536 x 1024, 3 rangées de 4 frames, cases 384 x 341)
[STYLE] [PAPILLON] [MISE EN PAGE] avec R = 3, N = 4, H = 341.
Row 1 - "flap" (one powerful wing beat from a hover), 4 frames. Frame 1: wings raised high above the body. Frame 2: wings sweeping down, half open. Frame 3: wings fully down below the body, body pushed slightly up. Frame 4: wings coming back up to mid height.
Row 2 - "dash" (fast flight diagonally up and forward, looping), 4 frames. Body tilted about 35 degrees nose-up toward the upper right. Frame 1: wings swept back tight along the body, streamlined, tails trailing. Frame 2: wings half open, short quick beat. Frame 3: wings swept back again. Frame 4: wings slightly open.
Row 3 - "glide" (gentle hover, looping), 4 frames. Body level. Frame 1: wings open wide and flat, the pink spiral eye-spots clearly visible. Frame 2: wings slightly raised. Frame 3: wings open wide. Frame 4: wings slightly lowered.
Output: one PNG, 1536 x 1024 px, transparent background, exactly 3 rows, 4 / 4 / 4 frames.
Puis : python tools/import_codex_assets.py --only forme_papillon --force

2) assets/sprites/transfo_papillon.png (1536 x 1024, 1 rangée de 4 frames, cases 384 x 1024, poses centrées)
[STYLE] Same butterfly design as image 1 ([PAPILLON]).
A 4-frame transformation of AGARICA into her butterfly form, in mid-air. AGARICA: a petite chibi druid girl about 250 px tall, short messy LIGHT AUBURN hair (#B5613A, NOT bright red), big green eyes, pointed elf ears, dark-green hooded cape with leaf embroidery, beige sleeveless tunic, a pink spiral tattoo on her bare arm, brown boots.
[MISE EN PAGE] avec R = 1, N = 4, H = 1024 (the row is vertically centered).
Frame 1: Agarica in mid-air, arms spread, cape opening wide like wings, eyes glowing green, the pink spiral tattoo glowing.
Frame 2: her cape turning into night-violet, mint-veined wings, her body shrinking and darkening, a swirl of green leaves and pink petals WRAPPED AROUND her (touching her silhouette).
Frame 3: a small dark butterfly body with half-formed violet wings, the pink spiral eye-spots appearing, a few leaves still attached; no more human face.
Frame 4: the finished butterfly form, wings open: EXACTLY the "glide" frame 1 pose of image 1.
Output: one PNG, 1536 x 1024 px, transparent background, 1 row of 4 frames.
Puis : python tools/import_codex_assets.py --only transfo_papillon --force

3) assets/sprites/forme_papillon_extra.png (1536 x 1024, 1 rangée de 4 frames, cases 384 x 1024, poses centrées)
[STYLE] [PAPILLON] [MISE EN PAGE] avec R = 1, N = 4, H = 1024 (the row is vertically centered).
Row 1 - "cast" (the butterfly casts a healing spell on a corrupted creature in front of it, to the RIGHT; played once, then held), 4 frames. The butterfly hovers upright, body slightly tilted back, facing right.
Frame 1: wings folded up together above the body, front legs drawn in, gathering power; a small soft orb of rose-pink and mint-green light (about 30 px) held between the front legs (touching them).
Frame 2: wings opening, the orb growing (about 50 px), still touching the legs.
Frame 3: wings FULLY open and spread wide, the pink spiral eye-spots and the mint-green rims glowing brighter, the orb (about 70 px) pushed forward to the right, still touching the front legs.
Frame 4: wings half open, settling, the orb smaller and fading (still touching the legs), calm and graceful.
Output: one PNG, 1536 x 1024 px, transparent background, 1 row of 4 frames.
Puis : python tools/import_codex_assets.py --only forme_papillon_extra --force

À LA FIN
- Vérifie dans assets/sprites/<id>_frames/ : EXACTEMENT 3 rangées de 4 frames (forme_papillon), 4 frames (transfo_papillon), 4 frames (forme_papillon_extra). Aucune frame coupée ni vide. Même envergure d'une frame à l'autre. Aucun visage humain sur le papillon.
- Lance un python tools/import_codex_assets.py final (il régénère src/data/asset_present.js).
- Ajoute une section « Lot n°10 » à docs/production/RAPPORT_CODEX.md : une ligne par image (statut, frames découpées, envergure mesurée en px source) et le rapport du dernier import.
```

## Côté code

Rien à faire : `src/entities/Player.js` calibre déjà la taille du papillon sur la surface visible de `forme_papillon` `dash` (`FORMS.butterfly`, `agaricaSheetPoseConfig`). Le soin utilise `forme_papillon_extra` `cast` à cette même échelle, et `transfo_papillon` `transform` pour l'aller et le retour. Après l'import, vérifier en jeu une capture du soin (compétence papillon sur une créature corrompue, et le sauvetage de Ghil't) : le papillon est à peu près à la hauteur du buste d'Agarica, sans saut de taille entre la transformation et l'incantation.
