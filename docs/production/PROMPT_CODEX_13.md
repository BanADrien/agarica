# Prompt Codex n°13 — marchand Tamarin, PNJ de quête, coffre, Éclats de lune, fissures, objets (2026-11-08)

Vague 3 (points 6 à 9 de la liste du 2026-11-04 ; conception : `docs/production/VAGUE3_DESIGN.md`).
Besoins :
- **Tamarin**, le vieux singe colporteur qui tient la boutique (perché au bout des lianes : racines du
  grand arbre, puis cime cachée, grotte de la lisière, racines suspendues) : une **variante** de
  `singe_gueri`. Image facultative : tant qu'elle manque, le jeu montre `singe_gueri` avec un baluchon
  et une lanterne dessinés par code ;
- trois **PNJ de quête** : Tika (mère singe, cime cachée), Pépin (son petit, île des vents), Dame
  Écaille (vieille tortue, marais des brumes) ; Geralt reprend son art actuel ;
- le **coffre** secret : la feuille animée (fermé, qui s'ouvre, ouvert) et deux images fixes tirées de
  la même feuille (`coffre_ferme`, `coffre_ouvert`, celles que le système des coffres affiche déjà) ;
- l'**Éclat de lune** (la monnaie) : au sol (`eclat_lune`, l'image du système), en petit tas, et en
  icône du compteur ;
- les **fissures discrètes** des murs et sols cassables : écorce, pierre, terre (dont `fissure_secret`,
  l'indice que le système affiche déjà) ;
- les **objets de quête** (Pépin dans le sac, loupe de Tamarin, corde tressée, fleur de lune) et deux
  petits décors (nénuphar, socle vide) ;
- les **portraits** des quatre nouveaux personnages.

**9 images** à générer, plus **2 recadrages mécaniques** de `coffre.png` (`coffre_ferme.png`,
`coffre_ouvert.png`) ; **30 entrées** de manifeste : 5 dans `ASSET_MANIFEST`, 25 dans `ITEM_MANIFEST`
(dont les 3 fleurs-alias, qui partagent l'image de `fleur_lune`, et `fissure_secret`, second
recoupage de la cellule « pierre A »).
**Les entrées sont déjà dans `src/data/asset_manifest.js`** (pré-lot de la vague 3, 2026-11-08) ; ce
document ne le modifie pas. Tant qu'une image manque, le jeu affiche le dessin de repli (code) ou le
placeholder de l'entrée.

**Hors de cette commande.** `marchand` (PNJ du banc d'essai de `zonetest`, boutique `marchand_lune`)
garde son placeholder. **Cœur entier : pas d'image nouvelle.** La « graine de chêne-cœur »
`objet_graine_coeur` (cœur rose dans une cupule de gland) sert déjà au +1 cœur de la forêt sombre 2 ;
les trésors `{ coeur: true }` du système affichent, eux, l'entrée `coeur_entier` (dessinée par code
tant que son image manque, non commandée ici). Les deux se distinguent bien du cœur du HUD `hud_coeur`
(pomme-cœur rouge).

## Récapitulatif

| # | Image source | Taille | Découpe | Entrées du manifeste |
|---|---|---|---|---|
| 1 | `assets/sprites/tamarin.png` | 1536x1024 | 2 rangées x 4, silhouettes | `tamarin` (`ASSET_MANIFEST`, facultative) |
| 2 | `assets/sprites/tika.png` | 1536x1024 | 2 rangées x 4, silhouettes | `tika` (`ASSET_MANIFEST`) |
| 3 | `assets/sprites/pepin.png` | 1536x1024 | 3 rangées x 4, silhouettes | `pepin` (`ASSET_MANIFEST`) |
| 4 | `assets/sprites/ecaille.png` | 1536x1024 | 2 rangées x 4, silhouettes | `ecaille` (`ASSET_MANIFEST`) |
| 5 | `assets/sprites/coffre.png` | 1536x1024 | 3 rangées (2, 4, 2), silhouettes | `coffre` (`ASSET_MANIFEST`) |
| 5 bis | `assets/_codex_src/coffre_ferme.png` | recadrage | 1re frame de la rangée 1 de `coffre.png` | `coffre_ferme` (`ITEM_MANIFEST`) |
| 5 ter | `assets/_codex_src/coffre_ouvert.png` | recadrage | 1re frame de la rangée 3 de `coffre.png` | `coffre_ouvert` (`ITEM_MANIFEST`) |
| 6 | `assets/_codex_src/eclats.png` | 1536x1024 | grille 3 x 1 | `eclat_lune` (`cell: 0`), `eclat_lune_tas`, `hud_eclat` (`ITEM_MANIFEST`) |
| 7 | `assets/_codex_src/fissures.png` | 1536x1024 | grille 3 x 2 | `fissure_secret` (`cell: 1`, pierre A), `fissure_ecorce_a/b`, `fissure_pierre_a/b`, `fissure_terre_a/b` (`ITEM_MANIFEST`) |
| 8 | `assets/_codex_src/objets_D.png` | 1536x1024 | grille 3 x 2 | `pepin_sac`, `loupe_tamarin`, `corde_tressee`, `fleur_lune` (+ 3 alias), `decor_nenuphar`, `decor_socle_lune` (`ITEM_MANIFEST`) |
| 9 | `assets/_codex_src/portraits_D.png` | 1024x1024 | grille 2 x 2 | `portrait_tamarin`, `portrait_tika`, `portrait_pepin`, `portrait_ecaille` (`ITEM_MANIFEST`) |

Total : 5 + 2 + 3 + 7 + 9 + 4 = 30 entrées. Alias : `fleur_lune_marais`, `fleur_lune_cercle`,
`fleur_lune_gardien` ont le même `path` ET le même `src` que `fleur_lune` (l'importeur exige un `src` ;
il recoupe la même cellule au même endroit) : trois objets d'inventaire distincts, une seule image.
`fissure_secret` recoupe la cellule `cell: 1` (pierre A) vers son propre fichier.

Les frames finales vont dans `assets/sprites/<id>_frames/` ; les objets, l'éclat, le tas et les deux
coffres fixes dans `assets/items/objets/` ; l'icône du compteur dans `assets/ui/` ; les fissures (dont
`fissure_secret`), le nénuphar et le socle dans `assets/decors/elements/` ; les portraits dans
`assets/ui/portraits/`.

## Feuilles animées : ce que le code attend (ne pas changer les noms ni les nombres de frames)

| Rangée (manifest) | Image | Anim | Frames | fps | Usage en jeu |
|---|---|---|---|---|---|
| 0 | `tamarin.png` (rangée 1) | `idle` | 4 | 5, boucle | perché dans son nid, au bout des lianes |
| 1 | `tamarin.png` (rangée 2) | `talk` | 4 | 8, boucle | pendant ses répliques et à l'ouverture de la boutique |
| 0 | `tika.png` (rangée 1) | `idle` | 4 | 5, boucle | inquiète, au village de la cime |
| 1 | `tika.png` (rangée 2) | `talk` | 4 | 8, boucle | répliques |
| 0 | `pepin.png` (rangée 1) | `idle` | 4 | 6, boucle | sur l'île des vents, puis au village |
| 1 | `pepin.png` (rangée 2) | `talk` | 4 | 10, boucle | répliques |
| 2 | `pepin.png` (rangée 3) | `joie` | 4 | 10, boucle | retrouvailles avec Tika (étape `npcAnim`) |
| 0 | `ecaille.png` (rangée 1) | `idle` | 4 | 3, boucle | sur son tronc, au bord du marais |
| 1 | `ecaille.png` (rangée 2) | `talk` | 4 | 5, boucle | répliques (lentes) |
| 0 | `coffre.png` (rangée 1) | `ferme` | 2 | 2, boucle | coffre fermé ; frame 1 = reflet sur le fermoir |
| 1 | `coffre.png` (rangée 2) | `ouvre` | 4 | 10, une fois | ouverture (E), puis jaillissement des éclats par le code |
| 2 | `coffre.png` (rangée 3) | `ouvert` | 2 | 3, boucle | coffre vide, à chaque visite suivante |

Ce tableau numérote les frames à partir de 0, comme le code ; le prompt les compte à partir de 1.

## Échelles et alignements

| Id | Échelle de jeu | Taille de la pose (px source) | À l'écran | Repère |
|---|---|---|---|---|
| `tamarin` | 0,28 | environ 220 de haut, bâton et lanterne compris (`singe_gueri` : 207) | ≈ 62 | même espèce et même échelle que `singe_gueri` (≈ 58) ; Agarica debout = 83 px à l'écran |
| `tika` | 0,28 | environ 240 de haut | ≈ 67 | un peu plus grande que `singe_gueri` (même échelle 0,28) |
| `pepin` | 0,28 | environ 145 de haut | ≈ 41 | 60 % de Tika |
| `ecaille` | 0,28 | environ 180 de haut, 280 de long | ≈ 50 x 78 | |
| `coffre` | 0,22 | environ 240 x 190 fermé, 290 de haut ouvert | ≈ 53 x 42 fermé | posé au sol comme un décor |
| `coffre_ferme`, `coffre_ouvert` | fixée par le code (image ramenée à 256) | recadrage de la feuille | 40 de haut fermé, 47 ouvert | lus par le système des coffres |
| `eclat_lune` | fixée par le code (cellule rognée, ramenée à 128 ; 0,1 au manifeste) | éclat d'environ 200 de haut | ≈ 15 au sol ; 18 dans le compteur | doit rester lisible sur tous les sols |
| `eclat_lune_tas` | 0,1 (ramenée à 256) | tas d'environ 300 de large | ≈ 26 | gros butin, sortie de coffre |
| `hud_eclat` | 0,17 (ramenée à 128) | | ≈ 22 | à côté des cœurs du HUD |
| `fissure_secret` | fixée par le code (rognée à la fissure, ramenée à 256) | la fissure de pierre A | 26 au plus, alpha 0,55 | indice actuel de tous les cassables, sur leur face exposée (tournée de 90° sur une face haute ou basse) |
| `fissure_*` | 0,2 (rognée à la fissure, ramenée à 256 au plus) | fissure dans une cellule de 512 | ≤ 51, centrée sur une case de 64 | une par case de cassable |
| objets (`pepin_sac`…) | 0,16 (ramenée à 256) | | ≈ 41 | même gabarit que `objets_A/B/C` |
| `decor_nenuphar` | 0,25 (ramenée à 512) | environ 480 x 110 | ≈ 120 x 28 | plateforme du marais, dessus = surface de marche |
| `decor_socle_lune` | 0,2 (ramenée à 512) | environ 300 de haut | ≈ 60 | à côté de `decor_autel_sommet` |
| portraits | 0,25 (carré 512) | buste | 128 | médaillon de la boîte de dialogue |

**Alignement des feuilles** : l'import rogne chaque frame à sa boîte visible puis la centre en bas
(`align: bottom`). Dans chaque rangée : mêmes pattes, même appui, rien qui dépasse d'un côté plus que
de l'autre d'une frame à l'autre, sinon le personnage glisse. Tamarin : le bâton, la lanterne et le
baluchon restent à la même place dans toutes les frames. Pépin « joie » danse **sur place**, pieds au
sol dans les 4 frames (une frame en l'air serait reposée au sol par l'import). Le coffre ne bouge pas :
seul le couvercle s'ouvre, et la lueur reste collée à l'ouverture.

**Fissures : traits épais.** L'import rogne chaque fissure à ses pixels visibles et la ramène à
256 px au plus ; le jeu l'affiche à 0,2 (51 px au plus, centrée sur une case de 64), et
`fissure_secret` à 26 px au plus. Un trait de 2 px disparaîtrait : traits de 16 à 28 px dans l'image
générée (2 à 4 px à l'écran).

## Prompt à coller dans Codex

```
Nouvelle commande d'images pour « Legend of Agarica » (prompt n°13) : 9 images et 2 recadrages mécaniques du coffre, toutes déjà déclarées dans src/data/asset_manifest.js (tamarin, tika, pepin, ecaille, coffre, coffre_ferme, coffre_ouvert, eclat_lune, eclat_lune_tas, hud_eclat, fissure_secret, fissure_ecorce_a, fissure_ecorce_b, fissure_pierre_a, fissure_pierre_b, fissure_terre_a, fissure_terre_b, pepin_sac, loupe_tamarin, corde_tressee, fleur_lune, fleur_lune_marais, fleur_lune_cercle, fleur_lune_gardien, decor_nenuphar, decor_socle_lune, portrait_tamarin, portrait_tika, portrait_pepin, portrait_ecaille).

RÈGLES
- Ne modifie ni `src/` ni le manifeste `src/data/asset_manifest.js` : les entrées y sont déjà. N'édite pas non plus tools/import_codex_assets.py.
- Ne régénère et ne retouche aucune image existante (en particulier singe_gueri.png, morgat.png, objet_graine_coeur.png, les portraits existants). tamarin.png est une image NOUVELLE, dessinée d'après singe_gueri.png, qui reste intacte.
- Fond transparent partout (alpha réel). Aucun texte, aucune lettre, aucun chiffre, aucune grille, aucun cadre.
- Feuilles animées : une rangée = une animation, nombre de frames EXACT, frames séparées d'au moins 40 px, rangées d'au moins 60 px. Personnages tournés vers la DROITE (le code retourne l'image pour la gauche).
- Une silhouette connexe par frame, aucune particule détachée. La lueur du coffre qui s'ouvre et celle de la lanterne de Tamarin font partie de la silhouette (dégradé d'alpha collé à la source).
- Planches d'images uniques : un seul sujet par cellule, centré, à au moins 32 px des bords de la cellule ; rien ne déborde sur la cellule voisine.
- Finition mécanique autorisée (recadrage, translation, mise à l'échelle uniforme), jamais de dessin produit par code.
- Commence par tamarin.png : avec singe_gueri.png, il fixe la finition des quatre PNJ (et celle des singes Tika et Pépin).

RÉFÉRENCES À JOINDRE
- PNJ (finition, échelle, planche) : assets/sprites/morgat.png (feuille de PNJ : 2,5 à 3 têtes, cel-shading, contour) ; assets/ui/portraits/morgat.png et assets/ui/portraits/geralt.png (portraits).
- Tamarin, Tika et Pépin : assets/sprites/singe_gueri.png et assets/sprites/singe_gueri_frames/singe_gueri_row0_0.png (MÊME espèce, mêmes couleurs, même échelle de dessin : c'est le peuple du roi singe Kainati, guéri).
- Dame Écaille : assets/sprites/crapaud_frames/crapaud_row0_0.png (un animal sain de la forêt, finition).
- Coffre : assets/decors/deco_item_frames/bosquet/bosquet_crates.png (bois) ; assets/decors/elements/decor_autel_sommet.png (pierre et mousse, cadrage d'un décor posé) ; assets/decors/elements/decor_lanterne_allumee.png (lueur peinte, aussi pour la lanterne de Tamarin).
- Éclats, objets : assets/items/objets/totem_poche_casse.png et assets/items/objets/repulsif.png (finition des objets d'inventaire) ; assets/items/objets/objet_graine_coeur.png (objet ramassable qui brille).
- Fissures : assets/decors/elements/decor_plateforme_ecorce_fissuree.png (fissure d'écorce déjà en jeu) ; les cases sur lesquelles elles seront posées : assets/decors/tuiles_ecorce_frames/dirt_c.png, assets/decors/tuiles_corrompues_frames/dirt_c.png, assets/decors/tuiles_flottantes_frames/dirt_c.png, docs/production/tuiles_rendu.png (jeu par défaut).
- Socle : assets/decors/elements/decor_autel_sommet.png. Nénuphar : assets/decors/elements/decor_mare_berge.png, decor_mare_roseaux.png.

BLOCS COMMUNS (remplace [STYLE], [PERSO2], [PERSO3] et [PLANCHE] par le bloc complet ci-dessous, dans chaque prompt)

[STYLE] =
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Dark silhouettes in the spirit of Hollow Knight. World palette: night forest in deep violet, indigo and teal, magical accents in luminous moonlit green (#8fe3b8) and touches of rose pink (#ff9fc9). Characters are chibi-proportioned (about 2.5 to 3 heads tall) with expressive anime-influenced faces, gentle and a little funny, never scary. Strict side view (profile) for characters.

[PERSO2] =
SPRITE SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background. Exactly 2 horizontal rows; each row is ONE animation of 4 frames, read left to right. Each row is a band about 512 px tall; frame cells are 384 px wide; each pose is centered in its cell with the lowest point on the same baseline within a row. Leave at least 40 px of empty space between neighboring frames and at least 60 px between rows. Every frame is ONE single connected silhouette; NO detached particles, sparkles, dust, motion lines, NO cast shadow, NO ground line. Same character, same scale, same colors in every frame. The character faces RIGHT. The feet (or legs) stay at the same place in every frame of a row. No text, no grid lines, no borders.

[PERSO3] =
The same rules as [PERSO2], but with exactly 3 horizontal rows, each a band about 340 px tall.

[PLANCHE] =
SHEET OF SINGLE IMAGES: fully transparent background (alpha). The canvas is divided into invisible equal cells (given below); ONE subject per cell, centered, fully inside its cell with at least 32 px of margin; nothing crosses into a neighboring cell. Same lighting and finish for all subjects. No text, no grid lines, no borders, no ground, no cast shadow.


1) assets/sprites/tamarin.png (1536 x 1024, 2 rangées de 4 frames, cases 384 x 512)
Taille : environ 220 px de haut, bâton et lanterne compris (le corps à peu près comme singe_gueri, 207 px) ; même échelle de dessin que singe_gueri.png (0,28 en jeu, ≈ 62 px à l'écran).
Prompt :
[STYLE]
[PERSO2]
TAMARIN, an OLD MONKEY PEDDLER of the forest monkey people. He is a VARIANT of the reference singe_gueri.png: the SAME species, the SAME design family, the SAME colors and the SAME drawing scale (warm brown fur, cream face and belly, small round ears, long curled tail, the same green vine bracelet). But he is OLD: a grey-white muzzle, bushy grizzled grey eyebrows (#d8d4cc), a few grey hairs on the top of the head and at the tip of the tail, a slightly hunched back, drooping eyelids and a kind, sly, half-amused smile. He sits upright on his hind legs like the reference, PERCHED and patient (he does not climb anymore, he waits for customers to come up to him). Peddler's gear, all touching his body so the silhouette stays connected: a small bundle of patched canvas (#8a6a3e, a lighter patch #b08a52) tied at his side; a wooden walking stick (#4a2e18) held upright in one hand, with a small lantern hanging from its top that holds a glowing pale moon shard (#bfe8ff, soft real-alpha glow attached to the lantern); a necklace of shiny trinkets (a brass button, a tiny bell, a moonstone bead). Gentle, a little funny, never scary.
Row 1 - "idle", 4 frames: 1 perched, looking right with a sleepy smile; 2 scratching one grey eyebrow with a finger of his free hand; 3 a slow nod, as if dozing off; 4 eyes closed in a blink. The legs, the bundle, the stick and the lantern do not move.
Row 2 - "talk", 4 frames: mouth open, then closed, then open wide, then half open; the free hand makes a merchant's gesture (palm up, then a raised finger, then pointing at the lantern, then palm up again); eyebrows raised. The legs, the bundle, the stick and the lantern do not move.
Output: one PNG, 1536 x 1024 px, transparent background, exactly 2 rows, 4 / 4 frames.
Puis : python tools/import_codex_assets.py --only tamarin

2) assets/sprites/tika.png (1536 x 1024, 2 rangées de 4 frames, cases 384 x 512)
Taille : environ 240 px de haut.
Prompt :
[STYLE]
[PERSO2]
TIKA, a mother MONKEY of the forest monkey people, the SAME species and the SAME design family as the reference singe_gueri.png: warm brown fur, cream face and belly, small round ears, long curled tail, the same green vine bracelet. She is an adult female, a bit taller and slimmer than the reference, with a crown of woven leaves and two tiny rose-pink flowers (#ff9fc9) on her head and a shawl of big green leaves over her shoulders. She sits upright on her hind legs, one hand resting on the ground, like the reference. Kind, worried eyes.
Row 1 - "idle" (worried), 4 frames: 1 looking to the right, worried; 2 wringing the tip of her own tail in both hands; 3 a sigh, shoulders dropping; 4 eyes closed in a blink. The legs and the tail base do not move.
Row 2 - "talk", 4 frames: speaking, mouth open then closed; one hand pointing up toward the sky, then a hand on her heart; eyebrows raised. The legs do not move.
Output: one PNG, 1536 x 1024 px, transparent background, exactly 2 rows, 4 / 4 frames.
Puis : python tools/import_codex_assets.py --only tika

3) assets/sprites/pepin.png (1536 x 1024, 3 rangées de 4 frames, bandes d'environ 340 px)
Taille : environ 145 px de haut, soit 60 % de Tika ; même échelle de dessin que tika.png.
Prompt :
[STYLE]
[PERSO3]
PEPIN, a BABY MONKEY of the same family as the reference singe_gueri.png and the same colors: oversized round head and big ears, huge shiny eyes, a little tuft of hair on top of his head, a short curly tail, a mischievous grin. Tiny and full of energy.
Row 1 - "idle", 4 frames: 1 scratching his head; 2 looking up at the sky, mouth open in wonder; 3 swinging his tail; 4 a blink. The feet stay on the baseline.
Row 2 - "talk", 4 frames: chattering excitedly, mouth wide open, both arms up, then down, then one arm pointing up. The feet stay on the baseline.
Row 3 - "joie", 4 frames: a happy dance ON THE SPOT: arms raised high, knees bent then straight, tail curling and uncurling, a huge smile, eyes closed with joy in frame 3. The feet ALWAYS touch the baseline (no frame in the air).
Output: one PNG, 1536 x 1024 px, transparent background, exactly 3 rows, 4 / 4 / 4 frames.
Puis : python tools/import_codex_assets.py --only pepin

4) assets/sprites/ecaille.png (1536 x 1024, 2 rangées de 4 frames, cases 384 x 512)
Taille : environ 180 px de haut, 280 px de long.
Prompt :
[STYLE]
[PERSO2]
DAME ECAILLE, a very old and wise LAND TORTOISE, standing on four stubby legs, in profile, facing RIGHT. A tall domed shell, slightly mossy (#588828, #789818) with a tiny rose-pink flower (#ff9fc9) growing on top and a few pale lichen dots; a wrinkled, kind face with droopy eyelids and small round spectacles; a knitted shawl in faded violet (#6a5878) draped over the front of her shell. Slow, gentle, a little funny.
Row 1 - "idle", 4 frames: 1 resting; 2 a very slow blink; 3 chewing slowly, head a little forward; 4 head back a little. The legs and the shell do not move.
Row 2 - "talk", 4 frames: mouth moving slowly, a slow nod, eyebrows raised kindly, then a soft smile. The legs and the shell do not move.
Output: one PNG, 1536 x 1024 px, transparent background, exactly 2 rows, 4 / 4 frames.
Puis : python tools/import_codex_assets.py --only ecaille

5) assets/sprites/coffre.png (1536 x 1024, 3 rangées : 2 / 4 / 2 frames, bandes d'environ 340 px)
Taille : environ 240 x 190 px fermé ; couvercle ouvert : environ 290 px de haut. Le coffre ne bouge pas d'une frame à l'autre : seul le couvercle s'ouvre.
Prompt :
[STYLE]
[PERSO3]
(For this sheet, "character" means the chest. It is seen from the FRONT and slightly from above, like the game's other props; it does not need to face right.)
A DRUIDIC TREASURE CHEST: dark wood planks (#5a3a28, #7a4a30, grooves #2a1818) bound by living roots and a green vine with moss (#588828), a round brass clasp shaped like a crescent moon (#d9a441) holding a small moonstone (#bfe8ff), a cushion of moss and two tiny luminous mushrooms (#8fe3b8) on the lid. Sturdy, a little rounded, inviting. The bottom of the chest rests on the baseline in every frame, at the same place.
Row 1 - "ferme", 2 frames: 1 closed; 2 the same closed chest with a small moonlit glint on the clasp (a short bright star touching the clasp).
Row 2 - "ouvre", 4 frames: 1 the clasp glows and clicks open, the roots loosen; 2 the lid lifts a little, pale light leaks from the gap; 3 the lid half open, a burst of pale moonlight (#bfe8ff, white core) rising from the opening, attached to it (soft real-alpha glow, no separate particles); 4 the lid fully open and thrown back, a soft glow inside.
Row 3 - "ouvert", 2 frames: the open, empty chest with a faint glow inside; frame 2 the glow a little dimmer.
Output: one PNG, 1536 x 1024 px, transparent background, exactly 3 rows, 2 / 4 / 2 frames.
Puis, deux recadrages mécaniques de coffre.png (aucune retouche, alpha conservé, chaque frame rognée à sa silhouette avec 16 px de marge) : la frame 1 de la rangée 1 (coffre fermé) -> assets/_codex_src/coffre_ferme.png ; la frame 1 de la rangée 3 (coffre ouvert, vide) -> assets/_codex_src/coffre_ouvert.png. Ce sont les deux images fixes que le système des coffres affiche aujourd'hui.
Puis : python tools/import_codex_assets.py --only coffre coffre_ferme coffre_ouvert

6) assets/_codex_src/eclats.png (1536 x 1024, grille 3 x 1, cellules 512 x 1024)
La cellule 1 donne eclat_lune, l'éclat que le jeu affiche déjà (au sol, dans les coffres et, pour l'instant, dans le compteur) : elle remplace son dessin de repli.
Prompt :
[STYLE]
[PLANCHE]
Cells: 3 columns x 1 row, each cell 512 px wide and 1024 px tall; each subject centered in its cell.
The MOON SHARD (the game's currency, "Éclat de lune"): a small faceted crystal of moonstone, slender and slightly curved like a sliver of crescent moon, pale blue-white (#e8f6ff, #bfe8ff) with a cool inner glow (#8fe3e8) and a hint of rose-pink reflection (#ff9fc9) on one facet, thick near-black outline, a tiny soft halo (real alpha).
Cell 1 - one single shard, slightly tilted, about 200 px tall.
Cell 2 - a small pile of THREE of the same shards leaning on each other, about 300 px wide.
Cell 3 - the counter ICON: the same single shard, upright, with a bolder outline and simpler facets so it reads at 22 px on screen, and a soft halo.
Output: one PNG, 1536 x 1024 px, transparent background.
Puis : python tools/import_codex_assets.py --only eclat_lune eclat_lune_tas hud_eclat

7) assets/_codex_src/fissures.png (1536 x 1024, grille 3 x 2, cellules 512 x 512)
Chaque fissure sera réduite à environ 50 px et posée PAR-DESSUS une case de sol ou de mur de 64 px : c'est un calque, pas une tuile. Traits épais (16 à 28 px dans l'image générée). La cellule 2 (pierre A) donne aussi fissure_secret, l'indice que tous les cassables affichent aujourd'hui (26 px au plus) : elle remplace la fissure tracée par code.
Prompt :
[STYLE]
[PLANCHE]
Cells: 3 columns x 2 rows, each cell 512 x 512 px. Column 1 = BARK, column 2 = STONE, column 3 = EARTH. Row 1 = variant A, row 2 = variant B (a different crack pattern of the same material).
Each cell is a sparse CRACK DECAL on a fully transparent background, to be laid on top of an existing ground tile: ONLY the cracks are drawn, no texture fill, the tile beneath must show through everywhere else. The cracks are DISCREET but readable when you look for them: dark crack lines (#1c1430, #2a1f45), 16 to 28 px thick, branching, with a 6 to 8 px lighter rim (#6a5878) on their upper-left side (light from the upper left), and a few small chips knocked out at the edges. ONE tiny moonlit glint, about 20 px, deep inside the main crack (#8fe3b8 for bark and earth, #bfe8ff for stone): this glint is the secret's tell. The cracks cover 25 to 40 percent of the cell and stay at least 32 px away from the cell edges.
BARK: cracks follow the wood grain, mostly vertical and wavy, split bark lips curling outward.
STONE: angular straight cracks radiating from a small star-shaped impact point, small flakes.
EARTH: crumbly cracks in dry packed earth, two or three small pebbles and clods at the crack lips.
Output: one PNG, 1536 x 1024 px, transparent background.
Puis : python tools/import_codex_assets.py --only fissure_secret fissure_ecorce_a fissure_ecorce_b fissure_pierre_a fissure_pierre_b fissure_terre_a fissure_terre_b

8) assets/_codex_src/objets_D.png (1536 x 1024, grille 3 x 2, cellules 512 x 512)
Objets d'inventaire (cellules 1 à 4) au même gabarit que objets_A/B ; deux décors (cellules 5 et 6).
Prompt :
[STYLE]
[PLANCHE]
Cells: 3 columns x 2 rows, each cell 512 x 512 px, read left to right, top to bottom. Items 1 to 4 are inventory items in the same finish as the reference totem_poche_casse.png and repulsif.png, seen at a pleasing three-quarter angle, about 380 px in their largest dimension. Items 5 and 6 are small props seen from the side.
Cell 1 - PEPIN IN THE BAG: a small brown leather satchel with a flap and a strap; BABY PEPIN (the baby monkey of the tika/pepin sheets: brown fur, cream face, huge eyes, tuft of hair) peeks out of it up to his chest, both hands on the rim, grinning.
Cell 2 - TAMARIN'S MAGNIFYING GLASS: a small round magnifying glass with a brass rim (#d9a441, shading #8a6a2a) and a short turned wooden handle (#7a4a30); in the glass, the reflection of a tiny glowing moon shard (#bfe8ff); a bright glint on the rim. It must read at 40 px.
Cell 3 - BRAIDED ROPE: a neat coil of braided hemp rope (#c9a26b, shading #8a6a3e), tied with a green leaf-twine knot.
Cell 4 - MOONFLOWER: a single flower with five crescent-shaped petals, white fading to pale blue (#e8f6ff to #9fd3ff), a glowing silver-white heart, a short green stem with two leaves, a soft glow (real alpha). It must read at 40 px.
Cell 5 - LILY PAD (platform): a big round lily pad seen from the SIDE, almost edge-on, slightly tilted so its flat top surface is visible; dark green (#2d6b3a, #4e8a3e) with a notch and a slightly curled rim, a pale pink water lily (#ffd6e8) on one side. About 480 px wide and 110 px tall. The TOP of the pad is a flat surface to stand on; the bottom is cut flat at the waterline (no stem, no water drawn).
Cell 6 - EMPTY MOON SOCKET: a small ancient stone pedestal, the same stone, moss and finish as decor_autel_sommet.png, with an EMPTY crescent-moon-shaped socket carved on its top face and one faint rune; it clearly waits for something to be placed in it. About 300 px tall, standing on its flat base.
Output: one PNG, 1536 x 1024 px, transparent background.
Puis : python tools/import_codex_assets.py --only pepin_sac loupe_tamarin corde_tressee fleur_lune fleur_lune_marais fleur_lune_cercle fleur_lune_gardien decor_nenuphar decor_socle_lune

9) assets/_codex_src/portraits_D.png (1024 x 1024, grille 2 x 2, cellules 512 x 512)
Même finition et même cadrage que assets/ui/portraits/morgat.png (buste, tourné de trois quarts vers la droite, fond transparent).
Prompt :
[STYLE]
[PLANCHE]
Cells: 2 columns x 2 rows, each cell 512 x 512 px. Four BUST PORTRAITS for the dialogue box, same finish, framing and size as the reference portraits morgat.png and geralt.png: head and shoulders filling the cell, three-quarter view facing right, transparent background, no frame.
Cell 1 - TAMARIN the old monkey peddler (as in tamarin.png): grey-white muzzle, bushy grizzled eyebrows, drooping kind eyelids, the trinket necklace, the strap of his patched canvas bundle over one shoulder, a sly, amused smile, one eye half closed as if sharing a secret.
Cell 2 - TIKA the mother monkey (as in tika.png): leaf crown with two tiny pink flowers, leaf shawl, warm worried eyes, a small hopeful smile.
Cell 3 - PEPIN the baby monkey (as in pepin.png): tuft of hair, huge eyes, a cheeky gap-toothed grin.
Cell 4 - DAME ECAILLE the old tortoise (as in ecaille.png): round spectacles on her beak, violet knitted shawl, the little pink flower on her mossy shell visible behind her head, a kind, sleepy smile.
Output: one PNG, 1024 x 1024 px, transparent background.
Puis : python tools/import_codex_assets.py --only portrait_tamarin portrait_tika portrait_pepin portrait_ecaille

À LA FIN
Contrôles, sur les fichiers finaux après import (montages dans docs/production/controles/lot_13/) :
- Frames : EXACTEMENT 4 / 4 (tamarin, tika, ecaille), 4 / 4 / 4 (pepin), 2 / 4 / 2 (coffre) ; frames connexes ; aucun avertissement à l'import. coffre_ferme.png et coffre_ouvert.png identiques à la 1re frame des rangées 1 et 3 de coffre.png.
- Alignement : apercu_<id>.png, toutes les frames d'une rangée superposées en transparence : pattes (ou base du coffre) immobiles à 3 px près ; pour Tamarin, bâton et lanterne aussi.
- Échelle : montage echelle_pnj.png sur fond violet nuit #15101f, chaque PNJ à son échelle de jeu (0,28 ; coffre 0,22) à côté de assets/sprites/agarica_extra_frames/agarica_extra_row4_0.png réduite à 83 px de haut et de assets/sprites/singe_gueri_frames/singe_gueri_row0_0.png à 0,28 : Tamarin ≈ 62 px (même famille que singe_gueri, ≈ 58 px, et visiblement plus vieux), Tika ≈ 67 px, Pépin ≈ 41 px, Dame Écaille ≈ 50 px de haut, coffre ≈ 53 px de large.
- Lisibilité : montage lisibilite.png à la taille de jeu (1x) sur trois fonds (#15101f, la case assets/decors/tuiles_flottantes_frames/dirt_c.png, le fond clair #9fc4e8) : éclat (15 px au sol, 18 px dans le compteur), tas (26 px), icône (22 px), coffre fermé (40 px de haut) et ouvert (47 px), les quatre objets (41 px), la fleur de lune et la loupe reconnaissables.
- Fissures : montage fissures_sur_cases.png : chaque fissure à l'échelle 0,2, centrée sur sa case de 64 px (écorce sur tuiles_ecorce_frames/dirt_c.png, pierre sur tuiles_corrompues_frames/dirt_c.png, terre sur tuiles_flottantes_frames/dirt_c.png et sur une case du jeu par défaut), à côté de la case nue, plus fissure_secret à 26 px, alpha 0,55, sur une case de chaque jeu : on doit la voir en cherchant, pas au premier coup d'œil ; le reflet de lune est visible ; marge de 32 px respectée (aucun pixel opaque au bord de la cellule source).
- Nénuphar : la rangée du dessus du plateau mesurée (première rangée d'alpha > 128 au milieu de la feuille), en px depuis le haut de l'image finale, à reporter pour caler la surface de marche.
- Portraits : pour chacun, le centre du visage en fraction de l'image 512 (x, y), à reporter dans DIALOGUE_PORTRAIT_FOCUS (src/scenes/DialogueScene.js).
Puis :
- lance un python tools/import_codex_assets.py final (il régénère src/data/asset_present.js) ;
- ajoute une section « Lot n°13 » à docs/production/RAPPORT_CODEX.md : une ligne par image (statut, frames ou dimensions finales, échelles mesurées), les deux recadrages du coffre, la rangée de surface du nénuphar, les centres de visage des quatre portraits, et le rapport du dernier import.
```

## Côté code (après l'import)

- **PNJ** : `npcs: [{ id: 'tamarin' | 'tika' | 'pepin' | 'ecaille', … }]` (StoryKit, `addManifestSprite`) :
  l'art remplace le placeholder sans autre réglage. **Tamarin** : sa ligne de données garde
  `sprite: 'singe_gueri'` ; `src/story/vague3_commun.js` prend la variante `tamarin` dès que
  `hasManifestArt(scene, 'tamarin')` est vrai (sans les accessoires de code), sinon `singe_gueri` avec
  le baluchon et la lanterne dessinés par code. Pépin joue `joie` aux retrouvailles
  (`{ npcAnim: { npc: 'pepin', anim: 'joie' } }`). Geralt (quête 2) garde son art actuel (`map_reading`
  au fond du trou, `trip_fall` possible).
- **Portraits** : texture `item-portrait_<who>`, prise par `DialogueScene` dès qu'elle existe ;
  reporter les centres de visage mesurés dans `DIALOGUE_PORTRAIT_FOCUS`. `SPEAKERS` (`tamarin`, `tika`,
  `pepin`, `ecaille`) est posé par le pré-lot de la vague 3 (`vague3_commun.js`).
- **Coffre** : le système des coffres (`chests`, SecretKit) affiche déjà `coffre_ferme` et
  `coffre_ouvert` (images fixes, 40 px de haut fermé ; dessin de repli tant qu'elles manquent) : les
  deux recadrages s'y branchent seuls. Reste à brancher la feuille animée `coffre` : `ferme` (boucle),
  `ouvre` (une fois, puis jaillissement des éclats par le code), `ouvert` (boucle, visites suivantes),
  dès que `hasManifestArt(scene, 'coffre')`.
- **Éclats** : `eclat_lune` est déjà affiché par le système (éclats lâchés par les ennemis et sortis
  des coffres : rebond, aspiration vers Agarica ; icône du compteur pour l'instant ; dessin de repli
  tant que l'image manque). Restent à brancher : `eclat_lune_tas` pour un butin de 10 et plus,
  `hud_eclat` à côté des cœurs, devant le compteur (à la place de l'éclat).
- **Fissures** : `fissure_secret` est déjà affichée par le système (`hint: 'fissure'` des
  `breakables` : 26 px au plus, alpha 0,55, sur la face exposée ; fissure tracée par code tant que
  l'image manque). Restent à brancher les fissures par matière : un calque par case d'un cassable,
  choisi par sa clé `look` (`ecorce`, `pierre`, `terre`), variantes A et B en alternance, `flipX` au
  hasard, alpha 0,85 ; au-dessus de la case, sous les personnages. L'éclat de lune dans la fissure est
  le seul indice : ne pas l'animer davantage.
- **Objets** : `pepin_sac`, `loupe_tamarin`, `corde_tressee` et les trois fleurs (alias de
  `fleur_lune`) par `addItemImage` / `addItemIcon` (inventaire, objets ramassables, bannière).
- **Décors** : `decor_nenuphar` et `decor_socle_lune` sont posables comme les autres décors du
  manifeste une fois `'nenuphar'` et `'socle_lune'` ajoutés à `DECOR_SECTIONS.decor` (LevelKit). Le
  nénuphar se pose avec sa surface (mesure du rapport) sur la surface de marche des cases du marais.
- **Cœur entier** : rien de neuf (graine `objet_graine_coeur` ; trésors `coeur_entier`, dessiné par code).

## Entrées du manifeste

Les entrées sont **déjà dans `src/data/asset_manifest.js`** (pré-lot de la vague 3, 2026-11-08) :
rien à ajouter avant de lancer Codex.
- `ASSET_MANIFEST` (5) : `tamarin`, `tika`, `pepin`, `ecaille`, `coffre`.
- `ITEM_MANIFEST` (25) : `eclat_lune`, `eclat_lune_tas`, `hud_eclat`, `coffre_ferme`, `coffre_ouvert`,
  `fissure_secret`, `fissure_ecorce_a`, `fissure_ecorce_b`, `fissure_pierre_a`, `fissure_pierre_b`,
  `fissure_terre_a`, `fissure_terre_b`, `pepin_sac`, `loupe_tamarin`, `corde_tressee`, `fleur_lune`,
  `fleur_lune_marais`, `fleur_lune_cercle`, `fleur_lune_gardien`, `decor_nenuphar`,
  `decor_socle_lune`, `portrait_tamarin`, `portrait_tika`, `portrait_pepin`, `portrait_ecaille`.

Pour poser le nénuphar et le socle en `props`, ajouter `'nenuphar'` et `'socle_lune'` à
`DECOR_SECTIONS.decor` (LevelKit) quand l'art existe.
