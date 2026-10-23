# Prompt Codex n°8 — remplacer les dessins faits par code par des images (2026-10-23)

Demande de l'utilisateur : « Remplace tous les éléments que tu as faits toi-même (eau, particules, île volante…) par des images générées. »
Source : `docs/production/INVENTAIRE_DESSINS_CODE.md` (tous les éléments marqués TOUJOURS), plus deux nouvelles animations (singe : grimper / lancer ; papillon : sort de soin).

- **27 images** à générer, regroupées en planches.
- Elles donnent **119 nouvelles entrées** du manifeste `src/data/asset_manifest.js` (bloc « Lot Codex n°8 ») :
  - 5 feuilles animées (`ASSET_MANIFEST`) ;
  - 114 images (`ITEM_MANIFEST`).
- Plus `ui_feu_camp`, qui pointe vers une image existante.
- Rien n'est encore branché. Une fois les images importées, l'intégrateur remplace chaque dessin par l'image `item-<id>` (ou l'animation) correspondante. Tant qu'une image manque, le jeu affiche le placeholder.

## Récapitulatif (ordre de priorité)

| # | Image source | Taille | Découpe | Entrées du manifeste |
|---|---|---|---|---|
| **1** | **Le plus visible** | | | |
| 1 | `assets/_codex_src/liquides_mare.png` | 1536x1024 | 6 bandes | `liquide_mare_fond`, `liquide_mare_voile`, `liquide_mare_surface_0..3` |
| 2 | `assets/_codex_src/liquide_mousse_toxique.png` | 1536x1024 | image unique | `liquide_mousse_toxique` (lac + marée) |
| 3 | `assets/_codex_src/couche_ciel_jour.png` | 1536x1024 opaque | image unique | `couche_ciel_jour` |
| 4 | `assets/_codex_src/couche_nappes.png` | 1536x1024 | 3 bandes | `couche_nappe_nuages`, `couche_nappe_brume`, `couche_brume_avant` |
| 5 | `assets/_codex_src/couche_nuages.png` | 1536x1024 | grille 3x2 | `couche_nuage_0..4`, `couche_soleil` |
| 6 | `assets/_codex_src/decor_lumineux.png` | 1536x1024 | grille 3x2 | `decor_lanterne_eteinte`, `decor_lanterne_allumee`, `decor_fente_fermee`, `decor_fente_ouverte`, `decor_spirale_gravee`, `decor_plateforme_fantome` |
| 7 | `assets/_codex_src/structures_ecorce.png` | 1536x1024 | grille 3x2 | `decor_plateforme_ecorce_intacte`, `_fissuree`, `_brisee`, `decor_rampe_lancement`, `decor_marches_racines`, `decor_autel_sommet` |
| 8 | `assets/_codex_src/structures_larges.png` | 1536x1024 | 3 bandes | `decor_pont_tronc`, `decor_cratere`, `decor_trou_effondre` |
| 9 | `assets/_codex_src/couche_lointains.png` | 1536x1024 | 2 bandes | `couche_iles_lointaines`, `couche_horizon_malade` |
| 10 | `assets/_codex_src/mare_plantes.png` | 1536x1024 | grille 3x2 | `decor_mare_berge`, `decor_mare_roseaux`, `decor_fleur_perchee`, `decor_plante_resistante_fleurie`, `decor_plante_resistante_bouton`, `objet_graine_coeur` |
| 11 | `assets/_codex_src/bandes_sol.png` | 1536x1024 | 3 bandes | `decor_tapis_mousse`, `decor_cercle_sain`, `decor_mousse_sechee` |
| 12 | `assets/_codex_src/mousses_plaques.png` | 1536x1024 | grille 4x3 | `decor_mousse_plaque_intacte/_grattee/_repoussee`, `decor_mousse_lumineuse_sol/_tronc/_plafond/_petite`, `decor_touffe_mousse_petite/_moyenne/_grande/_penchee`, `decor_empreinte_boue` |
| 13 | `assets/_codex_src/couche_vignette.png` | 1536x1024 opaque | image unique | `couche_vignette` |
| **2** | **Particules et effets** | | | |
| 14 | `assets/_codex_src/particules_matieres.png` | 1536x1024 | grille 4x3 | 12 `fx_*` (éclats, mottes, feuille, pétales, gouttes, bulle, éclaboussure) |
| 15 | `assets/_codex_src/particules_lumieres.png` | 1536x1024 | grille 4x3 | 12 `fx_*` (luciole, grain, étincelles, traînée, vent, ombre, marqueur, spore, bouffées, braise) |
| 16 | `assets/_codex_src/halos_lumiere.png` | 1536x1024 | grille 3x2 | `fx_halo_doux`, `fx_halo_rayons`, `fx_rai_lumiere`, `fx_halo_objet`, `fx_aura_esprit`, `fx_lueur_sol` |
| 17 | `assets/vfx/vfx_mousse_toxique.png` | 1536x1024 | 3 rangées x 4 | `vfx_mousse_toxique` (`bulle`, `boule`, `goutte`) |
| 18 | `assets/vfx/vfx_anneau_choc.png` | 1536x1024 | 2 rangées x 4 | `vfx_anneau_choc` (`toxique`, `talisman`) |
| **3** | **Animations et créatures** | | | |
| 19 | `assets/sprites/singe_extra.png` | 1536x1024 | 2 rangées x 4 | `singe_extra` (`climb`, `throw`) |
| 20 | `assets/sprites/forme_papillon_extra.png` | 1536x1024 | 1 rangée x 4 | `forme_papillon_extra` (`cast`) |
| 21 | `assets/sprites/singe_gueri.png` | 1536x1024 | 2 rangées (4 + 5) | `singe_gueri` (`idle`, `run`) |
| 22 | `assets/_codex_src/petites_creatures.png` | 1536x1024 | grille 4x2 | `araignee_petite_0..2`, `bete_mousse_vivante/_touchee/_morte`, `mousse_creature_guerie_0..1` |
| 23 | `assets/_codex_src/objets_C.png` | 1536x1024 | grille 2x2 | `note_geralt`, `objet_grappin`, `objet_fleche`, `objet_collet` |
| 24 | `assets/_codex_src/segments_tuilables.png` | 1024x1536 | 2 colonnes | `objet_corde`, `fx_fil_soie` |
| **4** | **Interface** | | | |
| 25 | `assets/_codex_src/ui_panneaux.png` | 1536x1024 | grille 2x2 | `ui_bulle`, `ui_bulle_pointe`, `ui_invite`, `ui_banniere` |
| 26 | `assets/_codex_src/ui_hud.png` | 1536x1024 | grille 3x2 | `ui_touche`, `ui_alerte`, `ui_etoiles_etourdi`, `ui_case_competence`, `ui_anneau_objet`, `ui_ornement_titre` |
| 27 | `assets/_codex_src/ui_barres.png` | 1536x1024 | 4 bandes | `ui_energie_cadre`, `ui_energie_remplissage`, `ui_boss_cadre`, `ui_boss_remplissage` |

Les fichiers finaux (après import) vont dans :
- `assets/decors/liquides/` (liquides) ;
- `assets/decors/fonds/` (couches) ;
- `assets/decors/elements/` (décor) ;
- `assets/vfx/particules/` (particules) ;
- `assets/sprites/petites/` (petites créatures) ;
- `assets/items/objets/` (objets) ;
- `assets/ui/` (interface).

Les couches de fond portent le préfixe `couche_` et non `fond_`, parce que l'éditeur propose toutes les entrées `fond_*` comme fond de zone.

## À réutiliser (art déjà présent : ne pas régénérer)

Pour l'intégrateur :
- `pierre` → pierre lancée par le singe corrompu (C5) et par la forme singe (`singe_extra`, anim `throw`, après le lâcher).
- `fleur_resistante` → fleur cueillie qui vole vers Agarica, et icône d'inventaire (P5). La plante dans le monde = `decor_plante_resistante_*`.
- `mousse_mur` → rideaux de mousse de l'arène de Kainati (T9) et piliers de l'arène de Ghil't (T10).
- `mousse_amas_intact` / `mousse_amas_fissure` → amas brisé par l'ours (V27), avec des `fx_eclat_mousse`.
- `vfx_onde_choc`, `vfx_vague_mousse`, `rocher_roulant`, `kainati_sol` → refonte de Kainati (V5-V7). Ombres et marqueur d'atterrissage = `fx_ombre_sol`, `fx_marqueur_danger`.
- `vfx_souffle_toxique` → cône de Ghil't (V10). Retirer le cône dessiné par-dessus ; les bouffées deviennent des `fx_bouffee_toxique`.
- `courant_air` → courant d'air (V30). Les traits dessinés par-dessus deviennent des `fx_trait_vent`.
- Effets :
  - `vfx_purification` → purification (V19) ;
  - `vfx_soin_papillon` → nuée de soin (V20, halo = `fx_halo_doux`) ;
  - `vfx_flaque_mousse` → impact de la boule crachée par Ghil't ;
  - `vfx_impact_pierre` → chutes de pierres ;
  - `vfx_piste_loup` → pistes.
- Sprites et objets :
  - `papillon` → papillons lumineux ;
  - `poisson` → poissons de la mare (entre `liquide_mare_fond` et `liquide_mare_voile`) ;
  - `liane`, `porte_mousse`, `lance_amanite` ;
  - `idole` → idole sur l'autel (halo P13 = `fx_halo_doux`) ;
  - `talisman_ours` → réveil du talisman, avec `vfx_anneau_choc` (`talisman`) et `fx_braise` ;
  - `bocal_antidote` → gouttes `fx_goutte_antidote` ;
  - `repulsif` → bulles `fx_bulle`.
- `fond_foret_flottante` → le voile bleu `a2SkyWash` (T14) n'a plus lieu d'être avec ce fond et `couche_ciel_jour` au-dessus.
- `dialogue_box`, `hud_coeur`, `hud_coeur_vide`, `skill_icone_*`, `form_icone_*` → déjà branchés.
- `ui_feu_camp` → `assets/items/firecamp_menu/interface.png` (existant), déclaré dans le manifeste.

## Prompt à coller dans Codex

```
Nouvelle commande d'images pour « Legend of Agarica » (lot n°8) : 27 images, toutes déjà déclarées dans src/data/asset_manifest.js (bloc « Lot Codex n°8 »).

RÈGLES
- Ne modifie ni `src/` ni le manifeste `src/data/asset_manifest.js`.
- Fond transparent partout, sauf les deux images marquées OPAQUE (couche_ciel_jour, couche_vignette).
- Aucun texte, aucune lettre, aucun chiffre. Seule exception : le symbole « ! » de ui_alerte.
- Feuilles animées : une rangée = une animation, nombre de frames exact, frames séparées d'au moins 40 px, rangées d'au moins 60 px. Une silhouette connexe par frame pour les personnages. Tourné vers la DROITE.
- Planches en grille : un élément par case, centré, au moins 30 px de marge. Rien ne déborde sur la case voisine.
- Respecte les tailles en px données : elles fixent l'échelle en jeu (écran 960x540, tuile 64 px, Agarica ≈ 86 px de haut).
- Les éléments qui sont des ÉTATS d'un même objet (éteint/allumé, fermé/ouvert, intact/fissuré/brisé, fleurie/bouton, poses de l'araignée…) ont EXACTEMENT la même échelle et la même position dans leur case.
- Lueurs (halos, rais, soleil, étincelles, anneaux) : vrai dégradé d'alpha sur fond transparent. Si tu ne sais pas produire un alpha doux, dessine la lueur en blanc ou en couleur claire sur fond NOIR PUR #000000 (jamais gris, blanc ou damier) : le jeu l'affichera en mode additif. Signale-le dans le rapport.
- Bandes TUILABLES en largeur (liquides, tapis, couches de fond) : la bande touche les bords gauche ET droit, et les deux bords se raccordent exactement (même hauteur, même forme, même couleur).
  Contrôle obligatoire pour chaque bande tuilable :
  - colle deux copies côte à côte et enregistre le montage dans `docs/production/controles/lot_8/raccord_<id>.png` ;
  - vérifie qu'aucune couture n'est visible ;
  - en cas de couture : décale la bande d'une demi-largeur (roulement circulaire, numpy.roll), retouche la couture qui se trouve alors au milieu, remets en place. Ou régénère.
  Refais le contrôle sur le fichier final après import.
- Ordre : priorité 1 (images 1 à 13), puis 2 (14 à 18), puis 3 (19 à 24), puis 4 (25 à 27).
- Ne régénère PAS ce qui existe déjà : pierre, fleur_resistante, mousse_mur, mousse_amas_*, vfx_onde_choc, vfx_vague_mousse, vfx_souffle_toxique, vfx_purification, vfx_soin_papillon, vfx_flaque_mousse, courant_air, liane, papillon, poisson.

BLOCS COMMUNS (dans chaque prompt, remplace [STYLE], [COUCHE], [UI], [BANDES], [GRILLE], [EFFETS] ou [PERSO] par le bloc complet ci-dessous, en remplissant les valeurs entre accolades)

[STYLE] =
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous moonlit green (#8fe3b8) and touches of rose pink (#ff9fc9). Corruption is glowing toxic-green moss (near-black base #16280f, moss #2f5a2a and #3e7a2c, glowing specks #9bff5a) that drips like slime. Strict side view (profile).

[COUCHE] =
Painterly cel-shaded BACKGROUND LAYER for a 2D side-scrolling platformer, matching the existing daylight background of the game (reference: assets/decors/fonds/fond_foret_flottante.png): soft rounded shapes, gentle gradients, NO thick black outlines, slightly less saturated than the gameplay foreground so characters stay readable, light from the upper right. No characters, no creatures, no birds, no text.

[UI] =
Game UI element for 'Legend of Agarica', matching the existing dialogue box (reference: assets/ui/dialogue_box.png): painted, slightly glossy fantasy UI, dark violet-night fills (#15101f, #2a1f45), carved dark wood (#241510, #4a2f22) and twisted vines, moonlit green accents (#8fe3b8), small rose-pink details (#ff9fc9). Clean readable shapes. 9-slice friendly: borders are uniform along each straight edge, ornaments ONLY in the corners or at the two ends. Inner areas completely plain. No text.

[BANDES] =
STRIP SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background (alpha). The canvas is divided into {N} invisible horizontal bands of equal height ({H} px each), stacked from top to bottom. Each band holds ONE element, with at least 15 px of fully transparent space above and below it, so bands never touch. TILEABLE bands: the strip spans the FULL canvas width, touching the left edge and the right edge, and is SEAMLESSLY TILEABLE HORIZONTALLY (left and right edges match perfectly in shape, height and colour, so copies placed side by side show no seam; no element is cut by an edge unless it continues on the other side). SINGLE OBJECT bands: one object centered in its band, with at least 30 px of transparent margin on every side. No text, no labels, no grid lines, no borders.

[GRILLE] =
OBJECT SHEET LAYOUT RULES: canvas {W} x {H} px, fully transparent background (alpha), no backdrop. Divide the canvas into an invisible regular grid of {C} columns x {R} rows of equal cells ({cw} x {ch} px each). Draw exactly ONE element per cell, in reading order (left to right, top to bottom), centered in its cell, with at least 30 px of empty transparent margin on every side: no element touches another or crosses its cell boundary. Each element is ONE connected piece unless stated otherwise, no cast shadow (unless the element IS a shadow), no ground line, no text, no labels, no grid lines. Respect the drawing size given for each cell. Elements described as the SAME object in another state are drawn at EXACTLY the same scale and position in their cells.

[EFFETS] =
EFFECT SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background (alpha), NO dark backdrop. Exactly {R} horizontal rows of equal height ({H} px each); each row is ONE animation read left to right, divided into 4 equal cells exactly 384 px wide. Each frame is drawn CENTERED in its cell and stays fully INSIDE it with at least 30 px of margin: nothing crosses a cell boundary. Particles may be separate pieces, but every piece of a frame stays inside that frame's cell. Same scale and same palette in every frame. No character, no ground, no scenery, no text, no grid lines.

[PERSO] =
SPRITE SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background. Exactly {R} horizontal row(s); each row is ONE animation, read left to right. Each row is a band about {H} px tall; frame cells are the row width divided by that row's frame count; each pose is centered in its cell with the feet (or lowest point) on the same baseline within a row. Leave at least 40 px of empty space between neighboring frames and at least 60 px between rows. Every frame is ONE single connected silhouette: held objects touch the hand; NO detached particles, sparkles, dust, motion lines, NO cast shadow, NO ground line. Same character, same scale, same colors in every frame. The character faces RIGHT. No text, no grid lines, no borders.


==================== PRIORITÉ 1 — LE PLUS VISIBLE ====================

1) assets/_codex_src/liquides_mare.png (1536 x 1024)
Mare de la forêt sombre 2 : 256 x 88 px à l'écran (échelle 0,6). Les poissons nagent entre l'eau arrière et le voile avant. Astuce pour les bandes 3 à 6 : dessine la frame 1, puis obtiens 2, 3 et 4 par un décalage horizontal circulaire d'un quart de vague ; varie légèrement les reflets.
Prompt :
[STYLE]
[BANDES] avec N = 6, H = 170.
SUBJECT: water layers for a small preserved forest POND (clear healthy water in a dark night forest). All 6 bands are TILEABLE and use the same horizontal scale.
Band 1 (top) - BACK WATER: the body of the pond seen from the side, about 140 px tall, fully opaque: deep blue-teal water, darker at the bottom (#0d2a3a) and lighter near the top (#1c5f6e), a few faint diagonal light rays, small dark pebbles and two or three waving water weeds along the bottom, soft cyan glints. Flat top edge (the surface line is a separate strip).
Band 2 - FRONT WATER VEIL: same size (about 140 px tall), a light pale-cyan layer (#9fe6e0 to #bff6ef) with soft caustic ripple patterns and a brighter rim along its top edge. Draw it FULLY OPAQUE: the game displays it at 20-35% opacity in front of the fish.
Bands 3 to 6 - WATER SURFACE, 4 animation frames that loop: the shining surface line of the pond seen from the side: a bright line (#bff6ef) about 10 px thick, with small rounded wavelets rising up to 25 px above it and a few tiny white glints. Exactly a whole number of waves across the 1536 px width. In each next frame the wavelets have moved a quarter of a wave to the RIGHT, so frame 4 flows back into frame 1. Same line height in all 4 frames.
Output: one PNG, 1536 x 1024 px, transparent background, 6 strips.
Puis : python tools/import_codex_assets.py --only liquide_mare_fond liquide_mare_voile liquide_mare_surface_0 liquide_mare_surface_1 liquide_mare_surface_2 liquide_mare_surface_3

2) assets/_codex_src/liquide_mousse_toxique.png (1536 x 1024)
Une seule image pour le lac de mousse toxique au fond de l'épreuve du singe (80 px de haut à l'écran) ET pour la marée qui monte jusqu'à 220 px (échelle 0,3).
Prompt :
[STYLE]
SUBJECT: a pool of living TOXIC MOSS SLUDGE seen from the side. One single strip, 1536 px wide, SEAMLESSLY TILEABLE HORIZONTALLY (the left and right edges match exactly). The top 80 px of the canvas are fully transparent. Below them: a lumpy bubbling CREST of glowing toxic-green moss about 120 px tall (rounded lumps #3e7a2c and #2f5a2a, bright specks #9bff5a, a few half-sunk bubbles, short slime drips), then the BODY of dark toxic sludge (#16280f) with faint darker swirls and a few dim green glints, going down to the very bottom edge of the canvas, fully opaque below the crest. The crest must read clearly against a dark night background. No floating bubbles (separate effect).
Output: one PNG, 1536 x 1024 px.
Puis : python tools/import_codex_assets.py --only liquide_mousse_toxique

3) assets/_codex_src/couche_ciel_jour.png (1536 x 1024, OPAQUE)
Couche de ciel de jour qui apparaît au-dessus des cimes quand la caméra monte (forêt flottante 1 et 2, clairière, hutte). Elle est posée juste au-dessus de fond_foret_flottante.png, dont le haut est un bleu uni #2a9ef7. Le soleil est une image à part (image 5).
Prompt :
[COUCHE]
SUBJECT: the DAYTIME SKY high above the forest canopy. Smooth vertical gradient: deep clear azure at the top (#1c63c8) to bright sky blue at the bottom; the bottom 60 px are exactly #2a9ef7 so the layer joins the background below without a visible line. A few soft white cumulus clouds and thin wispy cirrus streaks in the upper two thirds, warm golden sunlit edges on the clouds, soft lavender shading underneath. NO sun, NO islands, NO trees, NO birds. SEAMLESSLY TILEABLE HORIZONTALLY: the left and right edges match perfectly (no cloud cut by an edge unless it continues on the other side). Fully opaque, no transparency.
Output: one PNG, 1536 x 1024 px.
Puis : python tools/import_codex_assets.py --only couche_ciel_jour

4) assets/_codex_src/couche_nappes.png (1536 x 1024)
Nappes de nuages et de brume pour la montée de la forêt flottante 1. Bande 3 = bande opaque au premier plan, en bas d'écran, qui cache le bas des arbres du fond. Échelle 0,7.
Prompt :
[COUCHE]
[BANDES] avec N = 3, H = 341.
Band 1 - CLOUD BANK (TILEABLE): a continuous bank of fluffy white clouds seen from the side, about 280 px tall, billowing rounded tops lit warm gold, soft lavender-grey shadows (#c8c4e8) underneath, the lower edge breaking into thin wisps. Opaque cloud bodies, only the wispy edges are soft.
Band 2 - MIST VEIL (TILEABLE): a long thin band of pale morning mist (#d6dcef), about 160 px tall, densest in the middle, fraying softly at the top and bottom. Draw it at full colour (the game lowers its opacity).
Band 3 - FOREGROUND MIST (TILEABLE): a thick bank of mist that sits IN FRONT of the scenery at the bottom of the screen, about 300 px tall: billowing rounded puffs along the top edge, the lower 60% completely OPAQUE and uniform pale blue-grey (#b8c8dc) with a touch of teal near the flat bottom edge, cool soft shading.
Output: one PNG, 1536 x 1024 px, transparent background, 3 strips.
Puis : python tools/import_codex_assets.py --only couche_nappe_nuages couche_nappe_brume couche_brume_avant

5) assets/_codex_src/couche_nuages.png (1536 x 1024)
Nuages isolés à placer en parallaxe (échelle 0,8, environ 350 px à l'écran) et soleil fixe à l'écran (échelle 0,6).
Prompt :
[COUCHE]
[GRILLE] avec W = 1536, H = 1024, C = 3, R = 2, cw = 512, ch = 512.
Cells 1 to 3: three separate fluffy white daytime CLOUDS of different shapes, each about 440 x 200 px: opaque white bodies, lavender-grey shaded undersides (#c8c4e8), warm golden sunlit tops, soft but clean edges, flat-ish bottoms.
Cell 4: a long flat CLOUD, about 460 x 120 px, same style.
Cell 5: a small round cloud PUFF, about 280 x 160 px, same style.
Cell 6: the SUN: a bright pale-yellow disc (#fff6d0) about 180 px wide, with a soft warm halo (#fff1c0) and a few gentle short rays, total about 440 px wide (glow rule applies).
Output: one PNG, 1536 x 1024 px, transparent background, 6 elements.
Puis : python tools/import_codex_assets.py --only couche_nuage_0 couche_nuage_1 couche_nuage_2 couche_nuage_3 couche_nuage_4 couche_soleil

6) assets/_codex_src/decor_lumineux.png (1536 x 1024)
Tailles à l'écran :
- lanternes de reprise : 18 x 30 px ;
- fente dans l'écorce : 70 x 120 px ;
- spirale : 45 px ;
- contour fantôme : 192 x 64 px.
Prompt :
[STYLE]
[GRILLE] avec W = 1536, H = 1024, C = 3, R = 2, cw = 512, ch = 512.
Cell 1: a small CHECKPOINT LANTERN, UNLIT: a little standing lantern about 200 px wide and 340 px tall: a carved dark-violet stone post (#2b2440) with a rounded cap, and in its upper part a round glass orb holding a sleeping seed of light, dull grey-violet (#5a5070), no glow. Flat bottom (it stands on the ground).
Cell 2: the SAME lantern, LIT: identical shape, size and position; the orb now glows bright moonlit green (#8fe3b8) with a white core, and a soft light rim is drawn ON the orb and on the carved edges (attached; the game adds the halo).
Cell 3: a CLOSED magic passage in tree BARK: an almond-shaped frame of thick gnarled bark lips, about 260 px wide and 440 px tall, tightly closed, with only a thin glowing pale-green line (#bfe8a0) along the vertical seam. Transparent outside the bark frame.
Cell 4: the SAME passage, OPEN: identical bark frame, same size and position; the lips are parted into a tall oval opening: deep dark-violet interior (#1a1428), a slow swirl of pale-green light inside, a bright glowing rim (#bfe8a0) along the inner edge.
Cell 5: a CARVED SPIRAL glyph, about 300 x 300 px: a spiral of 4 turns with six short radial strokes around it, like a small sun-spiral, deeply engraved and glowing soft violet (#b48cff), with a thin rim of grey-brown bark around the grooves so it reads as carved. Transparent everywhere else (it is placed on a tree trunk).
Cell 6: a GHOST PLATFORM outline, about 480 x 160 px: the faint glowing contour of a hidden rock ledge (rounded rectangle, top edge bumpy like grass), drawn as a broken dashed line of luminous mint-cyan light (#7fffd0) about 8 px thick, with tiny sparkles along it. The inside is EMPTY and transparent (outline only). The dashes may be separate pieces.
Output: one PNG, 1536 x 1024 px, transparent background, 6 elements.
Puis : python tools/import_codex_assets.py --only decor_lanterne_eteinte decor_lanterne_allumee decor_fente_fermee decor_fente_ouverte decor_spirale_gravee decor_plateforme_fantome

7) assets/_codex_src/structures_ecorce.png (1536 x 1024)
Tailles à l'écran :
- plateforme qui s'effrite : 96 x 22 px ;
- rampe : 92 x 58 px ;
- marches : 118 x 112 px ;
- autel : 56 x 36 px.
Prompt :
[STYLE]
[GRILLE] avec W = 1536, H = 1024, C = 3, R = 2, cw = 512, ch = 512.
Cell 1: a CRUMBLING BARK PLATFORM, INTACT: a thick slab of old tree bark and wood, about 460 px wide and 105 px tall, flat walkable top edge with a thin strip of fresh green moss (#3e7a2c), brown bark sides (#4a3021, lighter grain #6b4a33), a few short root fibres hanging underneath.
Cell 2: the SAME platform, CRACKED: identical shape, size and position, three deep dark cracks running down through it, small chips missing, the moss torn, a few crumbs still attached underneath.
Cell 3: the SAME platform, BROKEN: the same slab split into 4 chunks drifting slightly apart and tilting as they fall (the chunks may be separate pieces but stay close together, total width about 480 px).
Cell 4: a LAUNCH RAMP: a sturdy wooden plank (#8a6a3e) about 400 px long jutting out to the RIGHT and slightly upward like a diving board, resting on a small post frame lashed with rope; at its left end a thin wooden pole about 180 px tall carrying a small triangular rose-pink pennant (#ff9fc9) fluttering to the right. Total about 440 x 280 px, flat bottom.
Cell 5: ROOT STEPS: four thick twisted roots forming a little staircase that climbs diagonally from bottom-left to top-right, each step a flat-topped root ledge about 140 px wide, steps about 90 px apart horizontally and 110 px vertically, dark violet-brown bark (#2a2238), a few moss tufts and tiny pink-glowing flowers. Total about 420 x 400 px.
Cell 6: a small SUMMIT ALTAR: a low slab of carved grey-violet stone (#4a4058, top #6d6480) on a short pedestal, a carved spiral-tail (monkey) symbol on its front, moss in the cracks, flat top, total about 400 x 260 px. No light beam (separate image).
Output: one PNG, 1536 x 1024 px, transparent background, 6 elements.
Puis : python tools/import_codex_assets.py --only decor_plateforme_ecorce_intacte decor_plateforme_ecorce_fissuree decor_plateforme_ecorce_brisee decor_rampe_lancement decor_marches_racines decor_autel_sommet

8) assets/_codex_src/structures_larges.png (1536 x 1024)
Tailles à l'écran :
- pont en tronc : 296 x 18 px ;
- cratère : 230 x 60 px ;
- trou d'effondrement : 170 x 36 px.
Prompt :
[STYLE]
[BANDES] avec N = 3, H = 341 (three SINGLE OBJECT bands, none of them tileable).
Band 1: a FALLEN LOG BRIDGE: a long straight tree trunk lying horizontally, about 1440 px long and 90 px thick, flat-ish walkable top with moss and tiny ferns, bark grooves, two broken branch stubs, both ends broken off and showing pale wood rings. Dark brown bark (#3b2a20) with lighter grain (#5a4030).
Band 2: a CRASH CRATER seen from the side, about 1150 x 300 px in total: a shallow dark hollow dug into the ground (#1a2614), about 120 px deep, its rim made of torn earth and toxic moss clumps (#3e7a2c), two broken branches (#5a4630) sticking up out of it at angles, about 200 px tall, a few scattered twigs. Flat bottom.
Band 3: a COLLAPSED GROUND HOLE seen from the side: a jagged black pit (#0a0710) breaking through a layer of earth and toxic moss, about 1200 px wide and 255 px deep, cracked earth edges, dangling roots, a few loose clods on the rims.
Output: one PNG, 1536 x 1024 px, transparent background, 3 objects.
Puis : python tools/import_codex_assets.py --only decor_pont_tronc decor_cratere decor_trou_effondre

9) assets/_codex_src/couche_lointains.png (1536 x 1024)
Couches lointaines (parallaxe lente) :
- îlots flottants : forêt flottante 2 ;
- forêt malade à l'horizon : forêt flottante 2 et hutte de Morgat.
Prompt :
[COUCHE]
[BANDES] avec N = 2, H = 512.
Band 1 - DISTANT FLOATING ISLANDS (TILEABLE): 5 or 6 small floating islands far away in hazy daylight, of different sizes (60 to 300 px wide) and at different heights, each a chunk of earth and rock with a tuft of trees on top and dangling roots or a thin waterfall below, painted in soft desaturated blue-grey (#6f8fb0 to #9ab4cc) because of the distance, no outlines. About 420 px tall in total, transparent around the islands.
Band 2 - SICK FOREST ON THE HORIZON (TILEABLE): a distant band of corrupted forest: a continuous silhouette of rounded and twisted tree crowns in very dark green (#1f3a1a), a few dead pointed trees, a faint sickly toxic-green haze glowing above the crowns (#6fdc3a, soft), flat and fully opaque bottom edge. About 300 px tall.
Output: one PNG, 1536 x 1024 px, transparent background, 2 strips.
Puis : python tools/import_codex_assets.py --only couche_iles_lointaines couche_horizon_malade

10) assets/_codex_src/mare_plantes.png (1536 x 1024)
Joins comme référence : assets/items/objets/fleur_resistante.png.
Tailles à l'écran :
- berge : 62 x 42 px ;
- roseaux : 20 x 35 px ;
- fleur perchée : 30 x 45 px ;
- plante résistante : 50 x 94 px ;
- graine : 27 x 22 px.
Prompt :
[STYLE]
[GRILLE] avec W = 1536, H = 1024, C = 3, R = 2, cw = 512, ch = 512.
Cell 1: a POND BANK: a cluster of rounded mossy stones (#3a3550, moss #2d6b3a) at the edge of a pond, about 440 x 300 px, two short reeds, its right side lower (it slopes into the water). Flat bottom. (The game mirrors it for the other bank.)
Cell 2: a clump of five REEDS and two cattails, thin dark-green stems (#2d6b3a) of different heights, about 250 x 440 px, flat bottom.
Cell 3: the PERCHED FLOWER: a small rare flower on a short stem growing from a tuft of clean earth and grass: six rounded petals alternating white (#ffe9f5) and rose pink (#ff9fc9) around a glowing pale-yellow heart (#fff3b0), two bright green leaves; about 300 x 450 px.
Cell 4: the RESISTANT PLANT, BLOOMING: a slender curved stem (#3f7a52) about 400 px tall with three long leaves (#5fa86f), crowned by a pure white flower with five large petals and a glowing golden-white heart (same flower as the reference image fleur_resistante.png), roots in a small clump of clean earth. Total about 250 x 470 px.
Cell 5: the SAME plant, with EXACTLY the same stem, leaves and earth, same size and position, but the flower has been picked: only a small closed rose-pink bud (#ff9fc9) at the top of the stem.
Cell 6: a HEART-OAK SEED: a magical acorn shaped like a heart, glossy rose pink (#ff6fa8) with a light highlight (#ffd0e4), a little carved wooden cap with one tiny green leaf, a soft pink light drawn on its surface; about 300 x 240 px.
Output: one PNG, 1536 x 1024 px, transparent background, 6 elements.
Puis : python tools/import_codex_assets.py --only decor_mare_berge decor_mare_roseaux decor_fleur_perchee decor_plante_resistante_fleurie decor_plante_resistante_bouton objet_graine_coeur

11) assets/_codex_src/bandes_sol.png (1536 x 1024)
Tailles à l'écran :
- tapis de mousse : environ 27 px de haut (bande tuilable de la clairière) ;
- cercle sain : 460 x 38 px ;
- mousse séchée : 80 x 16 px.
Prompt :
[STYLE]
[BANDES] avec N = 3, H = 341.
Band 1 - TOXIC MOSS CARPET (TILEABLE): a low carpet of toxic moss covering the ground, seen from the side, about 180 px tall: a nearly black base (#10200f), lumpy rounded moss mounds of varied widths (#2f5a2a, #3e7a2c, #274d22), many small glowing specks (#9bff5a), a few tiny slime drips. Flat bottom edge (it lies on the ground), bumpy top edge.
Band 2 - HEALTHY CIRCLE (SINGLE OBJECT): a wide flat oval patch of bright healthy grass (#7bd35a) seen from the side, about 1440 px wide and 120 px tall, sprinkled with tiny flowers in white (#ffe9f5), pink (#ffc6e0) and pale yellow (#fff2a8), both ends tapering softly. Flat bottom.
Band 3 - DRIED MOSS (SINGLE OBJECT): a flat crusty patch of dead dried moss lying on the ground, grey-olive and brown (#34502a, #5a5a40), cracked and curled, no glow, about 1000 px wide and 200 px tall, flat bottom, irregular ends.
Output: one PNG, 1536 x 1024 px, transparent background, 3 elements.
Puis : python tools/import_codex_assets.py --only decor_tapis_mousse decor_cercle_sain decor_mousse_sechee

12) assets/_codex_src/mousses_plaques.png (1536 x 1024)
Tailles à l'écran :
- plaques à gratter : 70 x 30 px ;
- taches lumineuses : 30 à 64 px ;
- touffes : 18 px de large, 26, 38 et 50 px de haut ;
- empreinte : 13 x 10 px.
Prompt :
[STYLE]
[GRILLE] avec W = 1536, H = 1024, C = 4, R = 3, cw = 384, ch = 341.
Cell 1: a SCRAPABLE MOSS PATCH, INTACT: a thick cushion of glowing toxic moss lying on the ground, about 340 x 150 px: near-black base (#1d3a1a), rounded moss lumps (#2f5a2a, #3e7a2c), glowing specks (#9bff5a). Flat bottom.
Cell 2: the SAME patch, SCRAPED: same footprint and position, the moss torn away: bare dark earth with scrape marks, a few torn moss fibres and crumbs left, no glow.
Cell 3: the SAME patch, REGROWING: same footprint and position, a thinner young layer of moss (about half the thickness of cell 1) with small fresh sprouts and a few glowing specks.
Cell 4: a GLOWING MOSS SPOT on the GROUND: an irregular cluster of toxic moss lumps with glowing specks, about 320 x 130 px, flat bottom.
Cell 5: a GLOWING MOSS SPOT growing on a vertical TREE TRUNK: the same moss clinging to an invisible vertical surface, flat LEFT edge, small drips hanging down, about 200 x 320 px.
Cell 6: a GLOWING MOSS SPOT hanging from a CEILING: the same moss growing downward from an invisible ceiling, flat TOP edge, drips and short strands hanging down, about 320 x 130 px.
Cell 7: a small GLOWING MOSS SPOT, about 150 x 80 px, flat bottom.
Cell 8: a SMALL LIVING MOSS TUFT: a pointed cone-shaped tuft of toxic moss like a little flame (#2f5a2a outside, #3e7a2c inside), a glowing bead at its tip (#9bff5a), about 100 px wide and 145 px tall, flat bottom.
Cell 9: the same kind of tuft, MEDIUM: same width (100 px), 210 px tall.
Cell 10: the same kind of tuft, TALL: same width (100 px), 280 px tall.
Cell 11: the MEDIUM tuft LEANING to the RIGHT, bent about 30 degrees as if reaching for someone, base at the same place, about 145 x 200 px.
Cell 12: a single MUDDY PAW PRINT pressed into the ground, seen at a low angle so it looks like a flattened oval pad (wet dark mud #140e20 with a lighter rim) with three small toe marks in front, about 260 x 200 px.
Output: one PNG, 1536 x 1024 px, transparent background, 12 elements.
Puis : python tools/import_codex_assets.py --only decor_mousse_plaque_intacte decor_mousse_plaque_grattee decor_mousse_plaque_repoussee decor_mousse_lumineuse_sol decor_mousse_lumineuse_tronc decor_mousse_lumineuse_plafond decor_mousse_lumineuse_petite decor_touffe_mousse_petite decor_touffe_mousse_moyenne decor_touffe_mousse_grande decor_touffe_mousse_penchee decor_empreinte_boue

13) assets/_codex_src/couche_vignette.png (1536 x 1024, OPAQUE)
Voile d'obscurité plein écran, multiplié sur l'image et teinté par le jeu. L'import garde la bande centrale 1536 x 864 : rien d'important dans les 80 px du haut et du bas.
Prompt :
A full-screen darkness VIGNETTE overlay for a 2D game, GREYSCALE ONLY and fully opaque: pure white (#ffffff) over the large central area (about 70% of the width and 60% of the height), fading smoothly to dark grey and to near-black (#141018) in the four corners and along the left and right edges. Very subtle organic shapes in the dark corners (silhouettes of leaves and hanging roots, barely visible). No colour, no text, no frame.
Output: one PNG, 1536 x 1024 px, fully opaque.
Puis : python tools/import_codex_assets.py --only couche_vignette


==================== PRIORITÉ 2 — PARTICULES ET EFFETS ====================

14) assets/_codex_src/particules_matieres.png (1536 x 1024)
Chaque particule est dessinée en GRAND (160 à 220 px). L'import la ramène à 128 px, le jeu l'affiche entre 4 et 22 px.
Prompt :
[STYLE]
[GRILLE] avec W = 1536, H = 1024, C = 4, R = 3, cw = 384, ch = 341.
PARTICLE SHEET: each cell holds ONE small particle drawn BIG (160 to 220 px on its longest side) so it stays crisp when the game shrinks it to a few pixels: simple bold shape, thick dark outline, 2-3 tones.
Cell 1: a small CHUNK of toxic moss (#3e7a2c, one glowing speck #9bff5a).
Cell 2: a bigger rounder LUMP of toxic moss with a short slime drip attached.
Cell 3: a CLOD of dark earth (#5a4630) with a few grass blades and one root fibre.
Cell 4: a SPLINTER of bark (#6b4a33 outside, pale wood inside).
Cell 5: a small sharp grey ROCK CHIP (#8a8a8a).
Cell 6: a single fresh green LEAF (#4fae5a) with a visible vein.
Cell 7: a single rose-pink flower PETAL (#ff9fc9).
Cell 8: a single white flower PETAL (#ffe9f5) with a faint pink base.
Cell 9: one falling DROP of toxic slime: an elongated teardrop, glowing green (#9bff5a) with a dark green outline.
Cell 10: one DROP of healing antidote: a round teardrop, glowing mint-cyan (#9fffd6) with a white highlight.
Cell 11: a clear magic BUBBLE: thin bright rim, very pale white-lavender inside, a curved white highlight (the game tints it).
Cell 12: a small SPLAT of toxic slime seen from the side: a flat crown splash with 3 or 4 droplets attached (#9bff5a, #3e7a2c).
Output: one PNG, 1536 x 1024 px, transparent background, 12 particles.
Puis : python tools/import_codex_assets.py --only fx_eclat_mousse fx_motte_mousse fx_motte_terre fx_eclat_ecorce fx_eclat_pierre fx_feuille fx_petale_rose fx_petale_blanc fx_goutte_toxique fx_goutte_antidote fx_bulle fx_eclaboussure_toxique

15) assets/_codex_src/particules_lumieres.png (1536 x 1024)
Mêmes règles que l'image 14. Les lumières suivent la règle des lueurs.
Prompt :
[STYLE]
[GRILLE] avec W = 1536, H = 1024, C = 4, R = 3, cw = 384, ch = 341.
PARTICLE SHEET: each cell holds ONE small particle drawn BIG (160 to 220 px on its longest side). Light particles have a soft glow with real alpha falloff (or white on pure black if soft alpha is impossible).
Cell 1: a FIREFLY mote: a small glowing pale yellow-green dot (#fff6a0 core, #bfe8a0 glow) with a soft round glow.
Cell 2: a tiny soft round GRAIN OF LIGHT: pure white core fading out (the game tints it).
Cell 3: a four-pointed SPARKLE star: white core with mint-green tips (#e8ffd8, #8fe3b8).
Cell 4: a BUTTERFLY SPARKLE: a tiny glittering dust star in rose pink and cyan (#ffb3f0, #9ff3ff).
Cell 5: a BUTTERFLY TRAIL streak: a horizontal tapered comet streak of soft light, bright round head on the RIGHT, tail fading to the LEFT, cyan to rose pink, about 220 x 50 px.
Cell 6: a WIND STREAK: a long thin curved white-blue wisp (#d0f0ff), tapered at both ends, about 220 x 40 px.
Cell 7: a GROUND SHADOW: a flat soft dark ellipse (#12000c), about 220 x 80 px, darker in the centre, softer at the rim (the game sets its opacity).
Cell 8: a DANGER MARKER on the ground: a flat glowing ellipse ring seen from the side, red (#ff5a5a) around a dark red inside (#3a0010), about 220 x 60 px.
Cell 9: a toxic SPORE: a small fuzzy glowing toxic-green ball (#9bff5a) with tiny spikes.
Cell 10: a DUST PUFF: a small rounded cloud of brown dust (#8a6a4a, lighter #b09070), about 200 x 160 px.
Cell 11: a TOXIC GAS PUFF: a small rounded cloud of toxic gas, green (#7fe02a) and sickly violet (#6a3a7a), about 200 x 170 px.
Cell 12: a warm amber EMBER spark (#ffc36b core, orange glow).
Output: one PNG, 1536 x 1024 px, transparent background, 12 particles.
Puis : python tools/import_codex_assets.py --only fx_luciole fx_grain_lumiere fx_etincelle fx_etincelle_papillon fx_trainee_papillon fx_trait_vent fx_ombre_sol fx_marqueur_danger fx_spore_toxique fx_bouffee_poussiere fx_bouffee_toxique fx_braise

16) assets/_codex_src/halos_lumiere.png (1536 x 1024)
Lumières blanches ou très claires, teintées par le jeu et affichées en mode additif. Elles remplacent tous les halos dessinés : lanterne, soleil, plante, fenêtre de la hutte, totem, objets ramassables, idole, esprit de Kainati, lumière de canopée, colonne de l'autel, rai rose du vieux sentier.
Prompt :
[STYLE]
[GRILLE] avec W = 1536, H = 1024, C = 3, R = 2, cw = 512, ch = 512.
LIGHT SHEET: soft light shapes in white and very pale colours, NO outlines, smooth falloff with real alpha (or white on pure black #000000 if soft alpha is impossible).
Cell 1: a SOFT ROUND HALO: a perfectly round radial glow, white core fading smoothly to fully transparent at the rim, about 460 px wide, no rays.
Cell 2: a ROUND HALO WITH RAYS: a soft warm-white glow (#fff6e0) about 460 px wide with 8 to 12 gentle soft light rays of different lengths.
Cell 3: a LIGHT SHAFT: a tall vertical beam of soft light, as if falling through the canopy, about 180 px wide at the top widening to 240 px at the bottom, 470 px tall, soft edges, a few faint dust motes inside, fading out at both ends.
Cell 4: an ITEM GLOW: a small soft round glow (#8fe3b8) with a thin ring and 6 tiny leaf-shaped motes around it, about 300 px wide.
Cell 5: a SPIRIT AURA: a ghostly aura shaped like a big rounded slow flame (wider at the bottom, wavy edges), pale cyan (#9fe3ff), brighter at the rim and fainter in the middle, about 440 x 420 px.
Cell 6: a GROUND LIGHT POOL: a flat soft oval of light on the ground seen from the side, about 460 x 120 px, bright centre fading out.
Output: one PNG, 1536 x 1024 px, transparent background, 6 lights.
Puis : python tools/import_codex_assets.py --only fx_halo_doux fx_halo_rayons fx_rai_lumiere fx_halo_objet fx_aura_esprit fx_lueur_sol

17) assets/vfx/vfx_mousse_toxique.png (1536 x 1024, 3 rangées de 4 frames, cellules 384 x 341)
Échelle 0,12 :
- bulle : environ 17 px à l'écran ;
- boule crachée par Ghil't : environ 22 px ;
- goutte : environ 5 px.
Prompt :
[STYLE]
[EFFETS] avec R = 3, H = 341.
Row 1 - "bulle" (a bubble of toxic slime rising from the sludge and popping), 4 frames. Frame 1: a small dome of glowing green slime swelling up, about 90 px wide. Frame 2: a round bubble about 130 px wide, thin shiny skin, dark green inside, bright rim. Frame 3: the bubble stretched upward, a crack of light on top. Frame 4: the pop: a ring of tiny droplets and a small splash, no bubble left.
Row 2 - "boule" (a ball of toxic moss spat by a boss, in flight, looping), 4 frames: a lumpy round glob of glowing toxic moss about 180 px wide, dark core (#2f5a2a), bright specks (#9bff5a), two short slime tails trailing to the LEFT (it flies to the RIGHT). From frame to frame the glob turns a quarter turn and its tails wobble, so the 4 frames loop.
Row 3 - "goutte" (a toxic drop falling, then splashing), 4 frames. Frame 1: an elongated falling drop about 40 x 70 px, glowing green with a dark green outline. Frame 2: a rounder drop about 50 x 55 px. Frame 3: impact: a small crown splash about 150 x 70 px. Frame 4: a tiny flat puddle about 120 x 25 px with two droplets, fading.
Output: one PNG, 1536 x 1024 px, transparent background, 4 / 4 / 4 frames.
Puis : python tools/import_codex_assets.py --only vfx_mousse_toxique

18) assets/vfx/vfx_anneau_choc.png (1536 x 1024, 2 rangées de 4 frames, cellules 384 x 512)
Prompt :
[STYLE]
[EFFETS] avec R = 2, H = 512. Glowing effect: real alpha falloff, or white-cored light on pure black #000000 if soft alpha is impossible.
Row 1 - "toxique": a SHOCKWAVE RING of toxic energy expanding, seen face-on. Frame 1: a small bright thick ring about 90 px wide, toxic green (#9bff5a) with a white inner edge. Frame 2: ring about 180 px wide, thinner. Frame 3: ring about 270 px wide, thin, with small spore specks around it. Frame 4: ring about 330 px wide, very thin and broken, fading.
Row 2 - "talisman": exactly the same 4 frames and sizes, but in warm amber and orange (#ffc36b, #ff9a3a) with a white inner edge and a few tiny golden leaves around the ring.
Output: one PNG, 1536 x 1024 px, transparent background, 4 / 4 frames.
Puis : python tools/import_codex_assets.py --only vfx_anneau_choc


==================== PRIORITÉ 3 — ANIMATIONS ET CRÉATURES ====================

19) assets/sprites/singe_extra.png (1536 x 1024, 2 rangées de 4 frames)
Joins comme références :
- assets/_codex_ref/singe_reference.png ;
- assets/sprites/singe.png et assets/sprites/singe_p2.png.
Même singe, MÊME ÉCHELLE : environ 180 px accroupi, environ 260 px suspendu bras levés.
Prompt :
[STYLE]
CHARACTER: AGARICA'S MONKEY FORM (match the reference image assets/_codex_ref/singe_reference.png exactly): a small agile monkey with shaggy warm-brown fur drawn in layered spiky tufts, a cream-beige face, muzzle, ears, hands, feet and chest, round cream ears, big glowing luminous-green eyes (Agarica's magic), a serious determined brow, a very long prehensile tail ending in a tight spiral curl. No clothes, no accessories. Clean cel-shaded look with thick dark outline, same rendering as the reference image.
[PERSO] avec R = 2, H = 450. The monkey is about 180 px tall when crouched and about 260 px from raised hand to feet when hanging.
Row 1 - "climb" (climbing UP a vertical vine, looping; the game plays it backwards to climb down), exactly 4 frames. The vine is INVISIBLE: do not draw it. It runs vertically just in front of the monkey's chest, and both hands always grip the same vertical line, one above the other. Body vertical, seen from the side, facing right. Frame 1: right hand reaching high above the head, left hand gripping at chest height, right foot pulled up high, left leg stretched down. Frame 2: body pulled up, both hands close together at head height, knees bent. Frame 3: left hand reaching high above the head, right hand gripping at chest height, left foot pulled up high, right leg stretched down. Frame 4: body pulled up, both hands together, knees bent. Tail hanging down with its spiral curl.
Row 2 - "throw" (throwing a stone forward, standing on its hind legs), exactly 4 frames. Frame 1: crouched, holding a fist-sized grey stone in its right hand near the chest (the stone touches the hand). Frame 2: arm drawn far back behind the head, stone still in the hand, body twisted. Frame 3: arm whipping forward at head height, the stone still touching the fingertips at the moment of release. Frame 4: follow-through, arm stretched forward, hand EMPTY, tail swinging for balance.
Output: one PNG, 1536 x 1024 px, transparent background, exactly 2 rows, 4 / 4 frames.
Puis : python tools/import_codex_assets.py --only singe_extra

20) assets/sprites/forme_papillon_extra.png (1536 x 1024, 1 rangée de 4 frames)
Joins comme références : assets/sprites/forme_papillon.png et assets/ui/portraits/agarica.png. Même papillon, MÊME ÉCHELLE (envergure environ 220 px).
Prompt :
[STYLE]
CHARACTER: AGARICA'S BUTTERFLY FORM, exactly as in the reference sheet forme_papillon.png: Agarica transformed into a large magical butterfly: forest-green upper wings with leaf-vein patterns, soft pink-rose lower wings with a spiral motif, luminous mint-green edges, a small slender body with a tiny tuft of light auburn hair (#B5613A), big green eyes, two curled antennae. Wings and body form ONE connected silhouette.
[PERSO] avec R = 1, H = 1024. The single row is vertically centered on the canvas; cells 384 px wide; wingspan about 220 px.
Row 1 - "cast" (casting the healing spell while hovering in place), exactly 4 frames. Frame 1: wings raised high, body slightly curled, a small mint-green glow (#9fffd0) appearing ON the chest. Frame 2: wings opening wide, the glow growing into a soft round light on the body and between the wings, still attached to the silhouette. Frame 3: wings fully spread wide and flat, head lifted, eyes closed, the glow at its brightest, a rim of light along the wing edges (attached). Frame 4: wings lowering halfway, the glow shrinking back to a small spot on the chest. No detached particles (the game adds the butterflies).
Output: one PNG, 1536 x 1024 px, transparent background, 1 row of 4 frames.
Puis : python tools/import_codex_assets.py --only forme_papillon_extra

21) assets/sprites/singe_gueri.png (1536 x 1024, 2 rangées : 4 et 5 frames)
Joins comme référence assets/sprites/singe_corrompu.png : même singe, même taille, même rendu, mais guéri. Il doit rester bien distinct de la forme singe d'Agarica (pas d'yeux verts lumineux).
Prompt :
[STYLE]
CHARACTER: HEALED WILD MONKEY: a small skinny monkey of Kainati's tribe, EXACTLY the same design, proportions, size and rendering as the corrupted monkey of the reference sheet singe_corrompu.png, but HEALED: no moss at all, clean warm-brown fur (#8a5a32) with a cream-beige face, chest and belly (#e2b98a), calm friendly dark-brown eyes with a small white highlight (NOT glowing green), relaxed curious expression, long tail ending in a spiral curl, a thin vine bracelet on one wrist.
[PERSO] avec R = 2, H = 450. Same size as the reference frames: about 200 px tall when crouched on all fours.
Row 1 - "idle", exactly 4 frames. Frame 1: sitting on its haunches, looking around, tail curled. Frame 2: scratching its head with one hand. Frame 3: head tilted, curious. Frame 4: a small happy hop in place, feet just leaving the ground.
Row 2 - "run", exactly 5 frames: the same gallop cycle on all fours as the reference "run" row. Frame 1: front hands reaching forward. Frame 2: front hands planted, back legs swinging forward. Frame 3: gathered, all four limbs under the body. Frame 4: back legs pushing off, body stretched. Frame 5: airborne stretch, tail streaming back.
Output: one PNG, 1536 x 1024 px, transparent background, exactly 2 rows, 4 / 5 frames.
Puis : python tools/import_codex_assets.py --only singe_gueri

22) assets/_codex_src/petites_creatures.png (1536 x 1024)
Joins comme référence : assets/sprites/mousse_creature_frames/mousse_creature_row0_0.png.
Tailles à l'écran :
- petite araignée : 24 px ;
- bête de mousse : 64 x 44 px ;
- créature guérie : 38 x 26 px.
Prompt :
[STYLE]
[GRILLE] avec W = 1536, H = 1024, C = 4, R = 2, cw = 384, ch = 512. All creatures face RIGHT.
Cells 1 to 3: a tiny ordinary FOREST SPIDER (NOT a companion: much smaller and simpler than a hero spider): round dark violet-black body (#1a1024) with a smaller head, eight thin black legs, one glinting violet eye spot (#c77dff), about 240 px wide. The SAME spider at the SAME scale in three poses. Cell 1: standing normally. Cell 2: bowing: front legs bent, head and body tilted forward and down. Cell 3: deep bow: the front of the body touching the ground, front legs folded forward flat like a curtsy, abdomen raised.
Cells 4 to 6: a small MOSS BEAST (a creature made of toxic moss, about the size of a fox), the SAME beast at the SAME scale. Cell 4: ALIVE: a lumpy oval body of dark toxic moss (#2f5a2a) about 300 x 200 px, two rounded bumps on the back (#3e7a2c), two small glowing green eyes (#9bff5a), two stubby root legs. Cell 5: HIT: squashed and recoiling, eyes squeezed shut, a few moss lumps tearing off but still attached. Cell 6: DEAD: collapsed into a flat deflated heap of dull grey-green moss (#34502a), no glow, no eyes, about 340 x 90 px.
Cells 7 and 8: a HEALED MOSS CREATURE (the same species as the reference moss creature, but healed): a small soft round ball of healthy light-green moss (#6fbf73, darker #3f7a4a underneath), a tiny sprout with one leaf on top (#b8f5a0), two small calm dark eyes and a tiny smile, no slime, no glow, about 260 x 180 px. Cell 7: resting. Cell 8: the same creature squashed a little wider and lower (for a happy bounce), same scale.
Output: one PNG, 1536 x 1024 px, transparent background, 8 elements.
Puis : python tools/import_codex_assets.py --only araignee_petite_0 araignee_petite_1 araignee_petite_2 bete_mousse_vivante bete_mousse_touchee bete_mousse_morte mousse_creature_guerie_0 mousse_creature_guerie_1

23) assets/_codex_src/objets_C.png (1536 x 1024)
Même style que les planches objets_A et objets_B (joins assets/_codex_src/objets_B.png comme référence).
- note_geralt est un objet d'inventaire (environ 40 px).
- Accessoires du duel de Geralt : grappin environ 20 px, flèche 30 px, collet 34 px.
Prompt :
[STYLE]
[GRILLE] avec W = 1536, H = 1024, C = 2, R = 2, cw = 768, ch = 512. Objects fill about 70% of their cell, slight side / three-quarter view.
Cell 1: GERALT'S NOTE: a crumpled scrap of beige parchment (#e9d3a0) with a folded corner, a few lines of illegible scribbles (no readable letters), a small reddish crab-claw pinch mark in one corner.
Cell 2: a GRAPPLING HOOK: a small iron three-pronged hook with a ring, a short piece of hemp rope knotted to it.
Cell 3: an ARROW: a simple wooden arrow with an iron tip and brown-and-white fletching, drawn horizontally, pointing to the RIGHT, filling the cell width.
Cell 4: a SNARE TRAP lying on the ground: an open loop of hemp rope (#c9a26b) seen from a low side angle (a flat oval), a slip knot and a small wooden stake.
Output: one PNG, 1536 x 1024 px, transparent background, 4 objects.
Puis : python tools/import_codex_assets.py --only note_geralt objet_grappin objet_fleche objet_collet

24) assets/_codex_src/segments_tuilables.png (1024 x 1536)
Deux segments verticaux TUILABLES en hauteur, découpés par colonnes transparentes :
- corde de Geralt ;
- fil de soie de Xara.
Contrôle de raccord en HAUTEUR : colle deux copies l'une au-dessus de l'autre.
Prompt :
[STYLE]
Two vertical TILEABLE segments side by side, each perfectly vertical and running from the VERY TOP edge to the VERY BOTTOM edge of the canvas, seamlessly tileable vertically (the top and bottom ends match exactly so copies stack without a seam), with at least 300 px of empty transparent space between them and on both sides. Left segment, centered at about x = 330: a ROPE about 60 px thick, twisted hemp (#c9a26b, shadows #8a6a3e), visible braid pattern, no knots. Right segment, centered at about x = 700: a SPIDER SILK THREAD about 30 px thick: a glossy strand of pale lavender-white silk (#e8e0ff) with a faint pink shimmer and a couple of tiny dew beads ON the thread. Nothing else on the canvas.
Output: one PNG, 1024 x 1536 px, transparent background.
Puis : python tools/import_codex_assets.py --only objet_corde fx_fil_soie


==================== PRIORITÉ 4 — INTERFACE ====================

25) assets/_codex_src/ui_panneaux.png (1536 x 1024)
Panneaux en 9-slice :
- bulle de dialogue des personnages : jusqu'à 220 px de large à l'écran, échelle 0,25 ;
- pointe de la bulle : même échelle que la bulle ;
- invite « E : … » ;
- bannière « objet obtenu » : 460 x 104 px.
Mesure l'épaisseur réelle des bordures (en px source) et note-la dans le rapport : l'intégrateur réglera nineSlice.
Prompt :
[UI]
[GRILLE] avec W = 1536, H = 1024, C = 2, R = 2, cw = 768, ch = 512.
Cell 1: a SPEECH BUBBLE panel: a rounded rectangle about 640 x 300 px, dark night fill (#15101f), a glowing moonlit-green border (#8fe3b8) about 14 px thick, rounded corners of about 40 px radius, one tiny leaf in each corner only. NO tail (separate element). Plain inside, no text.
Cell 2: the SPEECH BUBBLE TAIL: a small downward-pointing triangular tail about 70 px wide and 50 px tall, same dark fill, same green border (same thickness) on its two slanted sides, its top edge flat and open (it attaches under the bubble).
Cell 3: an INTERACTION PROMPT plaque: a small pill-shaped plaque about 640 x 160 px, dark violet (#2a1f45), thin vine border, a tiny glowing leaf at each end, plain inside, no text.
Cell 4: an 'ITEM OBTAINED' BANNER panel: a wide horizontal plaque about 720 x 165 px in dark night wood with a carved border, a twisted vine running along the top and bottom edges, small leaves and a rose-pink bud at both ends, plain inside, no text.
Output: one PNG, 1536 x 1024 px, transparent background, 4 elements.
Puis : python tools/import_codex_assets.py --only ui_bulle ui_bulle_pointe ui_invite ui_banniere

26) assets/_codex_src/ui_hud.png (1536 x 1024)
Tailles à l'écran :
- pastille de touche : 23 px (le jeu écrit la lettre E, A, F ou R dessus) ;
- « ! » : 26 px ;
- étoiles d'étourdissement : 61 x 24 px ;
- case de compétence vide : 34 px ;
- anneau de l'objet dans la bannière : 72 px ;
- ornement de carte-titre : environ 290 px.
Prompt :
[UI]
[GRILLE] avec W = 1536, H = 1024, C = 3, R = 2, cw = 512, ch = 512.
Cell 1: a blank KEY CAP badge: a small square key with rounded corners, about 300 px wide, carved light-wood face (#d8c08a) with a darker rim, NO letter on it.
Cell 2: an ALERT icon: a bold exclamation mark "!" in cream (#ffe9f5) with a thick dark outline and a rose-pink glowing rim, about 160 x 360 px. This is the ONLY text-like symbol allowed in the whole order.
Cell 3: STUN STARS: three small five-pointed golden-yellow stars (#ffe066) and two tiny sparkles arranged along a flat ellipse, as if circling around a head, joined by a faint swirl line so it is one piece, about 460 x 180 px.
Cell 4: an EMPTY SKILL SLOT: a rounded square socket about 320 px wide, dark violet inside (#2a1f45), carved wood rim with a thin moonlit-green inner line (#8fe3b8), empty.
Cell 5: an ITEM RING: a round medallion frame about 340 px wide: a dark violet disc (#2a1f45) inside a thin ring of twisted vine with a rose-pink glow (#ff9fc9), empty centre (the game puts an object icon in it).
Cell 6: a TITLE ORNAMENT: a symmetric horizontal flourish of curling vines and leaves with a small crescent moon in the middle, cream and moonlit green, about 480 x 110 px.
Output: one PNG, 1536 x 1024 px, transparent background, 6 elements.
Puis : python tools/import_codex_assets.py --only ui_touche ui_alerte ui_etoiles_etourdi ui_case_competence ui_anneau_objet ui_ornement_titre

27) assets/_codex_src/ui_barres.png (1536 x 1024, 4 bandes de 256 px)
Barres de vie et d'énergie :
- énergie : 150 x 10 px à l'écran ;
- boss : 448 x 20 px.
Les cadres sont étirés en largeur (3-slice) ; les remplissages sont rognés selon le ratio.
Prompt :
[UI]
[BANDES] avec N = 4, H = 256 (four SINGLE OBJECT bands: each bar is centered in its band, NOT tileable, rounded caps at both ends, uniform along its length so it can be stretched).
Band 1: ENERGY BAR FRAME: an empty long rounded frame about 1350 x 90 px: carved dark wood border (#241510) wrapped with a thin twisted vine, a tiny leaf at each end, dark violet inner groove (#2a1f45), empty.
Band 2: ENERGY BAR FILL: the glowing filling of that bar, about 1290 x 50 px, moonlit green (#8fe3b8) with a lighter highlight along the top and a few small bubbles, rounded ends.
Band 3: BOSS BAR FRAME: a longer, heavier frame about 1400 x 64 px, dark carved wood with thorny vines and a thin rose-pink inner line (#ff9fc9), small leaf ornaments at both ends, empty inside.
Band 4: BOSS BAR FILL: about 1360 x 38 px, bright healthy green (#7bd35a) with a lighter highlight along the top, rounded ends.
Output: one PNG, 1536 x 1024 px, transparent background, 4 bars.
Puis : python tools/import_codex_assets.py --only ui_energie_cadre ui_energie_remplissage ui_boss_cadre ui_boss_remplissage


À LA FIN
- Mets à jour `docs/production/RAPPORT_CODEX.md` avec une section « Lot n°8 » : une ligne par image (statut, contrôles de raccord, lueurs livrées sur fond noir, épaisseurs de bordure mesurées pour ui_bulle, ui_invite, ui_banniere, ui_energie_cadre, ui_boss_cadre).
- Lance un `python tools/import_codex_assets.py` final et joins son rapport.
```
