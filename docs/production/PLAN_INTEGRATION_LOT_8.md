# Plan d'intégration du lot Codex n°8

*Version du 2026-10-24 (révision de 20 h 45), établie sur les six plans **contre-vérifiés** (groupes A à F). Elle remplace la version de 14 h 03 du même document et le brouillon du matin, qui reposait sur des plans A, C, D et E non vérifiés. Changements de cette révision : complétude recomptée par script, résumé ramené à 10 lignes, ordre réel du harnais de test (section 9), état des fichiers à 20 h 40, petites corrections de contrats.*

Ce document sert de brief aux agents d'intégration. Il fait la synthèse de six audits en lecture seule, un par groupe d'images :

| Groupe | Images | Contenu |
|---|---|---|
| A | 1-5, 9, 13 | fonds, ciel, liquides, lointains, vignette |
| B | 6-8 | structures et éléments lumineux |
| C | 10-12 | plantes, mares, mousses |
| D | 14-18 | particules et effets |
| E | 19-23 | animations, créatures, objets, invocation de Clak |
| F | 24-27 | segments, interface, art existant jamais affiché |

Sources :
- `docs/production/PROMPT_CODEX_8.md` (récapitulatif l.13-47) ;
- `INVENTAIRE_DESSINS_CODE.md` ;
- `RAPPORT_CODEX.md` (section « Lot n°8 ») ;
- `src/data/asset_manifest.js` et `src/data/asset_present.js` ;
- les montages `docs/production/controles/lot_8/` ;
- `PLAN_DEV.md` (contrat d'API).

Planches de contrôle des audits, dans `C:\Users\adrie\AppData\Local\Temp\claude\C--Users-adrie-Documents-projet-agarica\07b48b4e-9459-47fa-8786-538dfc5a05a4\scratchpad\lot8_audit\` :

| Sous-dossier | Groupe |
|---|---|
| `fonds_verif\` | A |
| `structures_verif\` | B |
| `plantes_verif\` | C |
| `effets_verif\` | D |
| `creatures_verif\` | E |
| `existant_ui_verif\` | F |

Les noms de planche cités plus bas (`a_lanternes.png`, `mq_clairiere.png`…) sont dans ces dossiers.

> **Le code bouge.** Juice, Niveaux 2 et Épreuve du singe modifiaient les fichiers pendant l'audit. Les numéros de ligne sont donc indicatifs (« ≈ l. »). Fiez-vous toujours au **nom de la fonction ou de la clé**.
>
> **État des fichiers le 2026-10-24 à 20 h 40** (dates de modification, sans git) : aucun fichier de `src/` n'a bougé depuis 13 h 59 (derniers touchés : `Player.js` et `StoryKit.js` à 13 h 59, `CampfireMenuScene.js` à 13 h 38, `acte1.js` et `bosquet_data.js` à 13 h 06, `acte2.js` à 12 h 47, `LevelKit.js` à 12 h 40, `boss_ghilt.js` à 12 h 04). Les numéros de ligne des audits (13 h 30-13 h 40) sont donc encore justes, à ±2 lignes près (contrôle : `ensureStoryPrompt` l.1998, `openMossWall` l.2418, `LEVEL_DATA_HANDLERS.ambient` l.2038, `juiceShockRing` l.4263, `FX_PARTICLES` l.4080). Seul `tools/playtest.py` a été modifié à 20 h 41 ; ses options restent celles de la section 9. **Cela ne prouve pas que Juice, Niveaux 2 et Épreuve du singe ont fini** : leur fin doit être confirmée dans la conversation principale avant la phase 1.

---

## 0. Contrôle de complétude

**Le bloc « Lot Codex n°8 » de `asset_manifest.js` compte 120 entrées.**
- `ASSET_MANIFEST`, ≈ l.718 : 5 feuilles animées, soit `singe_extra`, `forme_papillon_extra`, `singe_gueri`, `vfx_mousse_toxique` et `vfx_anneau_choc`.
- `ITEM_MANIFEST`, ≈ l.1137 à 1921 : 115 entrées, soit 114 images et `ui_feu_camp`.

C'est conforme au récapitulatif de PROMPT_CODEX_8.md (119 nouvelles entrées, plus `ui_feu_camp`).

Recompté par script le 2026-10-24 à 20 h 40 (`C:\Users\adrie\AppData\Local\Temp\claude\C--Users-adrie-Documents-projet-agarica\07b48b4e-9459-47fa-8786-538dfc5a05a4\scratchpad\lot8_audit\synthese\ids.py`, liste des 120 ids dans `ids.txt` du même dossier) :
- 5 clés dans le bloc `ASSET_MANIFEST` (l.718), 115 dans le bloc `ITEM_MANIFEST` (de `liquide_mare_fond` l.1147 à `ui_feu_camp` l.1916) ;
- les 115 chemins `path` d'ITEM figurent tous dans `asset_present.js` ;
- les frames des 5 feuilles animées (`assets/sprites/<id>_frames/`, `assets/vfx/<id>_frames/`) y figurent aussi.

**Couverture des plans.** Les 120 ids figurent dans au moins un plan :

| A | B | C | D | E | F |
|---|---|---|---|---|---|
| 20 | 15 | 21 | 32 | 15 | 17 |

- Aucun id ne manque, donc aucune analyse complémentaire n'a été nécessaire.
- Les anims internes sont couvertes elles aussi :
  - `vfx_mousse_toxique` : `bulle` (bulles du lac, Juice), `boule` (crachat de Ghil't), `goutte` (option) ;
  - `vfx_anneau_choc` : `toxique` et `talisman`.

**Hors du bloc, audités aussi :**
- `geralt_invocation` et `vfx_invocation_clak` (groupe E), branchés par Niveaux 2 ;
- l'art existant jamais affiché (groupe F) : `kainati_sol`, `vfx_onde_choc`, `vfx_vague_mousse`, `rocher_roulant`, `lance_amanite`, `porte_mousse`, `pierre`, `fleur_resistante`, `mousse_mur`, `mousse_amas_fissure`, ainsi que 6 anims jamais jouées.

**Images 24 à 27.** Contrairement à ce que disait l'énoncé de la mission, elles sont **livrées et importées** depuis le 2026-10-23 :
- journaux `controles/lot_8/24..27_import.log` ;
- 16 fichiers listés dans `asset_present.js` ;
- fichiers `assets/ui/ui_*.png`.

Ce plan les intègre donc. Attention : l'image 24 (`objet_corde`, `fx_fil_soie`) n'est pas de l'interface. Seules les images 25 à 27 le sont.

---

## 1. Résumé

1. Les 27 images (120 entrées, images 24 à 27 comprises) sont livrées et importées ; aucune n'exige une régénération complète.
2. Qualité : **97 ok**, **21 à retoucher** (par le code, le manifeste, l'importeur ou une retouche locale) et **2 à refaire** (`note_geralt`, `objet_grappin` : nouvelle extraction du brut, sans régénérer).
3. Juice a déjà branché ciel, nuages, brume, lac de mousse, particules, lanternes, plateformes fantômes et poses singe / papillon : à revérifier, pas à refaire (section 4).
4. Défauts déjà visibles en jeu : anneau ambre du talisman sur **tous** les effets, halo `fx_halo_doux` en disque plein, brume des sols calée ~50 px trop bas, teinte des particules ignorée.
5. Avant de brancher d'autres halos, quatre retouches passent à l'import : dégradé des halos, flaque au sol rognée et désaturée, anneau recentré, bulle calée en bas (M01, M04-M06).
6. L'interface (bulles, invites, bannière, carte-titre, HUD, barres) n'est pas branchée : aide commune `addUiSliced`, sans `scene.add.nineslice` (WebGL seulement en Phaser 3.80).
7. Nouvelles clés proposées : `farLayers`, `lights`, `ambient.vignette`, clés de props (`flipX`, `angle`, `hang`, `free`, `flatY`, `front`) et sections d'éditeur `decor`, `objet`, `rocher`.
8. 5 lots, 10 agents, jamais deux agents sur un même fichier ; `Kainati.js` et `boss_kainati.js` restent réservés jusqu'à la décision sur la refonte de Kainati.
9. Rien ne démarre avant que la fin de Juice, Niveaux 2 et Épreuve du singe soit confirmée : ils tiennent presque tous les fichiers concernés.
10. 8 questions bloquantes (8.1), puis 11 réglages (8.2) et 23 options d'histoire (8.3).

---

## 2. Qualité par image

Légende :
- **ok** : utilisable telle quelle, éventuellement avec un réglage de manifeste ou de code sans compromis visible ;
- **retouche** : utilisable aujourd'hui, mais avec un défaut ou un compromis à corriger par le code, le manifeste, l'importeur ou une retouche locale de l'image ;
- **à refaire** : l'image affichée est fautive et doit être refaite (section 7).

### Groupe A : fonds, ciel, liquides, lointains, vignette (images 1 à 5, 9 et 13)

| id | statut | constat |
|---|---|---|
| liquide_mare_fond | ok | 1536x140, opaque, raccord sans couture. Liseré clair sur les rangées 1 à 3. Dans la mare de FS2, prendre l'échelle 88/140 ≈ 0,63 (une seule rangée de tuile) ; dans le style `'eau'`, la ligne de surface doit recouvrir ce liseré. |
| liquide_mare_voile | ok | Caustiques propres, plus sombres que demandé (#47acb8), sans gravité à alpha 0,2-0,35. |
| liquide_mare_surface_0..3 (4) | ok | La boucle avance de 96 px par frame, sans saut. Ligne claire sur les rangées 26 à 31. Placeholder h 10 → 21. |
| liquide_mousse_toxique | retouche | Raccord fait par fondu enchaîné : une colonne fantôme d'environ 25 px tous les 461 px à l'échelle 0,3. Encoche d'alpha dans la crête. Utilisable ; retouche locale recommandée (7.1). |
| couche_ciel_jour | ok | Déjà branché. Les 60 px du bas ne sont jamais à l'écran : le raccord avec le fond vient du fondu de `addFarBackgroundCaps`. |
| couche_nappe_nuages | ok | Petit trou au raccord, environ 7 px à l'écran : tolérable à alpha ≤ 0,85. |
| couche_nappe_brume | ok | Voile dense au milieu, effiloché en haut et en bas. `addLiquidFloor` la cale trop bas (section 4, étape LK-1). |
| couche_brume_avant | retouche | Encoche à demi transparente au raccord (≈ 7x25 px à l'écran), juste sous la crête. Affichée nulle part aujourd'hui. |
| couche_nuage_0..2 (3) | ok | Alpha doux. `nuage_0` touche le haut et le bas de son cadre, ce qui donne un bas plat : tolérable. |
| couche_nuage_3 | retouche | Traîne basse de droite tranchée (≈ 7 px de bord vertical à l'écran). Tolérable. |
| couche_nuage_4 | retouche | Fragment détaché à gauche : `setCrop(66, …)` l'élimine. |
| couche_soleil | ok | Vrai alpha doux. Affiché nulle part, et c'est voulu : `fond_foret_flottante` a déjà son soleil peint. |
| couche_iles_lointaines | retouche | Verts saturés au lieu du bleu-gris demandé ; îles fantômes au raccord. Un `setTint` ne peut pas éclaircir : l'effet lointain passe par l'alpha (0,6) et une petite échelle (0,4). |
| couche_horizon_malade | retouche | Style pixel « poison », demandé par une consigne, mais trop clair. Une teinte sombre par le code (≈ 0x3c4e44) à l'échelle 0,45 donne la « forêt presque noire » du dialogue. L'ancienne version peinte n'est pas restaurable telle quelle (Q3). |
| couche_vignette | ok | R = G = B, profil propre. À utiliser en MULTIPLY sans teinte, alpha = force, profondeur 999,5. Le commentaire du manifeste est faux. |

### Groupe B : structures et éléments lumineux (images 6 à 8)

| id | statut | constat |
|---|---|---|
| decor_lanterne_eteinte | ok | 199x340, propre, même cadrage que l'allumée. À 0,09, elle ne fait que 18x31 px et le globe est illisible : 0,15 (30x51) est proposé (R1). |
| decor_lanterne_allumee | ok | Centre du globe à 63 % de la hauteur, alors que le code vise 55 % : environ 4 px trop bas. |
| decor_fente_fermee | ok | Même cadrage que l'ouverte : on bascule par `setTexture`, sans saut. Échelle = h / 440. |
| decor_fente_ouverte | ok | Lisible même teintée en cyan (`j_teinte.png`). |
| decor_spirale_gravee | ok | 42x45 px à 0,15. Elle se lit mieux que le tracé actuel, à la fourche de l'arbre malade. |
| decor_plateforme_fantome | ok | Contour des tirets en x 1-378, y 26-132 du PNG : à caler sur la case pleine par le code. |
| decor_plateforme_ecorce_intacte | ok | Dessus de mousse à y = 8. À l'échelle (w+6)/451, l'image colle à la hitbox w x 22. |
| decor_plateforme_ecorce_fissuree | ok | Même dessus et même largeur que l'intacte. |
| decor_plateforme_ecorce_brisee | ok | Quatre morceaux sur la même largeur. |
| decor_rampe_lancement | ok | Planche qui monte vers la droite. Base d'appui en x 5-189 : origine 189/439 au bord de la falaise. |
| decor_marches_racines | ok, sans usage | Niveaux 2 a remplacé les marches par l'arche `foret_sombre_racine_arche` (H6). |
| decor_autel_sommet | ok, sans usage | Doublerait `grand_arbre_autel_singe` au sommet de l'épreuve. Échange possible, à l'échelle 0,27 (H5). |
| decor_pont_tronc | ok | À 0,205, le fût ne fait que 8 px et ressemble à une branche. Affiché en 300x26, il se lit comme un tronc (R2). |
| decor_cratere | ok | Fond du creux en y 178-198 : origine 185/280 sur la ligne de marche. |
| decor_trou_effondre | ok | Haut de la fosse au centre en y 80-96 : origine 90/255. À 0,14, la fosse noire ne fait qu'environ 100x25 px (R3). |

### Groupe C : plantes, mares, mousses (images 10 à 12)

| id | statut | constat |
|---|---|---|
| decor_mare_berge | ok | 62x42 px à 0,14. Rive droite en flipX. Le pont-tronc cache la partie côté eau, ce qui est voulu. |
| decor_mare_roseaux | ok | 20x35 px à 0,08. À poser **devant** le pont, sinon ils sont cachés à 80 %. |
| decor_fleur_perchee | ok | 30x45 px à 0,1, rose et blanche à 6 pétales. Question d'espèce (H9). |
| decor_plante_resistante_fleurie | ok | Blanche, 5 pétales. Cadre `tete` (x 30, y 0, 198x195) pour la fleur qui s'envole. |
| decor_plante_resistante_bouton | ok | Même tige et même pied que la fleurie : échange de texture sans saut. |
| objet_graine_coeur | ok | 27x22 px. Sert aussi d'icône dans la bannière. |
| decor_tapis_mousse | ok | Tuilable sans couture, contraste suffisant (`mq_clairiere.png`). Hauteur de tileSprite : 27 px. |
| decor_cercle_sain | ok | 0,32 = 2 × rayon 230 du cercle de la clairière. |
| decor_mousse_sechee | ok | Croûte morte, sans lueur. |
| decor_mousse_plaque_intacte | ok | Coulures 2 px sous la base : enfoncer de 3 px. |
| decor_mousse_plaque_grattee | ok | Restent une perle et quelques touffes, mais l'état « gratté » se lit. |
| decor_mousse_plaque_repoussee | ok | « Elle repousse » se lit clairement. |
| decor_mousse_lumineuse_sol | ok | Base presque plate : bas visible au sol + 2. |
| decor_mousse_lumineuse_tronc | ok | La bordure brune du rapport a disparu. Bord gauche presque plat. |
| decor_mousse_lumineuse_plafond | ok | Bord haut presque plat : origine (0.5, 0). |
| decor_mousse_lumineuse_petite | ok | Base plate. |
| decor_touffe_mousse_petite / _moyenne / _grande (3) | ok | Même dessin et même base pour les trois. |
| decor_touffe_mousse_penchee | ok | Pied à 40 % de la largeur (0,60 en flipX). |
| decor_empreinte_boue | retouche | Livrée en vue de dessus : posée debout, elle ressemble à un caillou. Échelle 0,08, écrasée à 0,5 en Y (21x6 px), centrée 2 px sous la ligne de marche (R4). |

### Groupe D : particules et effets (images 14 à 18)

| id | statut | constat |
|---|---|---|
| fx_eclat_mousse | ok | Contour noir voulu ; mode normal, sans teinte. Lisible à 9-13 px. |
| fx_motte_mousse | ok | Lisible à 15-22 px. |
| fx_motte_terre | ok | 11x14 px. |
| fx_eclat_ecorce | ok | 14 px. |
| fx_eclat_pierre | ok | Net à partir de 8 px. |
| fx_feuille | ok | Déjà utilisée par Juice (`'leaf'`). |
| fx_petale_rose | ok | |
| fx_petale_blanc | ok | Peu teintable (contour noir). |
| fx_goutte_toxique | ok | Lisible à 6-7 px. |
| fx_goutte_antidote | ok | Lisible à 6-8 px. |
| fx_bulle | ok | Teintable. Le liseré scintille sous 10 px (R9). |
| fx_eclaboussure_toxique | ok | Inutile pour la boule de Ghil't : l'anim `spawn` de `vfx_flaque_mousse` éclabousse déjà. |
| fx_luciole | ok | Juice compense déjà la petite taille du noyau (x2,2). |
| fx_grain_lumiere | ok | Taille utile : 18-20 px (et non 12, ni 26). |
| fx_etincelle | ok | C'est une étoile, pas une traînée, et elle n'est pas teintable : à réserver aux étoiles. |
| fx_etincelle_papillon | ok | Taille utile : 16 px. |
| fx_trainee_papillon | ok | Tête à droite : orienter selon la vitesse. |
| fx_trait_vent | ok | Teintable ; un peu pointillé à 34 px, acceptable. |
| fx_ombre_sol | ok | Centre presque opaque, bord doux. |
| fx_marqueur_danger | ok | Intérieur opaque : mode ADD obligatoire. |
| fx_spore_toxique | ok | Peu de contraste sur les fonds corrompus : au moins 12-14 px. |
| fx_bouffee_poussiere | ok | Brun ; la teinte lavande de Juice donne un brun rosé (R10). |
| fx_bouffee_toxique | ok | Lisible de 16 à 64 px. |
| fx_braise | ok | Taille utile : 10-12 px. |
| fx_halo_doux | retouche | Profil en **plateau** (énergie 0,393 contre 0,14-0,19 pour les halos dessinés). Juice l'affiche déjà partout en disque plein. Correction `falloff` à l'import (M04), priorité haute. |
| fx_halo_rayons | retouche | Silhouette octogonale. Masque radial à l'import (M04). |
| fx_rai_lumiere | ok | Haut net et intérieur en plateau : le haut doit rester hors caméra ou sous un plafond ; alpha 0,2-0,35 en ADD. |
| fx_halo_objet | ok | Déjà branché (Juice). |
| fx_aura_esprit | ok | En ADD, alpha 0,15-0,2. |
| fx_lueur_sol | retouche | Ellipse fantôme au-dessus de la flaque, et couleur cyan qui ne prend pas de teinte chaude. Rognage et désaturation à l'import (M05). |
| vfx_mousse_toxique | retouche | `align 'center'` : les bulles flottent jusqu'à 5 px au-dessus du lac. Passer en `'bottom'` (M01). Boule : corps à l'origine 0,65. |
| vfx_anneau_choc | retouche | Le centre de l'anneau dérive jusqu'à 20 px dans **les deux** rangées. Recentrage sur le cercle ajusté (M06). Mode ADD obligatoire ; deux couleurs, non teintable. |

### Groupe E : animations, créatures, objets (images 19 à 23)

| id | statut | constat |
|---|---|---|
| singe_extra | ok | Même singe. Tailles cohérentes avec `liane_hang` et `idle`. La pierre dessinée et le projectile sont décalés d'environ 18 px au lâcher : laissé tel quel, pour ne pas toucher au gameplay. |
| forme_papillon_extra | retouche | Calibré sur sa seule feuille, le papillon du sort est 12 % plus petit en jeu. Reprendre l'échelle de `forme_papillon` (code). |
| singe_gueri | ok | Distinct de la forme singe d'Agarica. La frame 3 de l'idle se dresse : sans effet dans `heal()`. |
| araignee_petite_0..2 (3) | ok | 24 px : on ne la confond pas avec Xara. Même ligne de base pour les 3 poses. |
| bete_mousse_vivante | retouche | Buisson vivant tourné à droite : flipX. Échelle 0,21 → 0,25. Aujourd'hui inutilisée : Niveaux 2 a posé `mousse_creature` à sa place (Q7). |
| bete_mousse_touchee | retouche | Échelle 0,21 → 0,25. |
| bete_mousse_morte | retouche | Échelle 0,21 → 0,25. Peut remplacer la flaque de la revisite en forêt flottante 2. |
| mousse_creature_guerie_0 | retouche | 26 px à 0,15, trop petite : 0,2 (34x36). |
| mousse_creature_guerie_1 | retouche | 0,2. |
| note_geralt | **à refaire** | Bas coupé net : le dessin dépassait sa cellule dans le brut (y ≈ 535 pour une limite à 512). Visible à 80 px dans l'inventaire. Nouvelle extraction (7.2). |
| objet_grappin | **à refaire** | Pointe de la tige coupée à plat, même cause. Invisible à 20 px : priorité basse. |
| objet_fleche | ok | 31x7 px, pointe à droite. |
| objet_collet | ok | 33x13 px, piquet à droite. |
| *geralt_invocation* (hors bloc) | ok | Branché par Niveaux 2. Dessin 9 % plus petit que Geralt, compensé à l'exécution. Échelle 0,325 facultative. |
| *vfx_invocation_clak* (hors bloc) | retouche | Image bonne. Au relais, Clak apparaît au-dessus du crabe dessiné, 1,5 fois plus petit, et le pic dessiné arrive 600 ms trop tôt. Correction par le code. |

### Groupe F : segments et interface (images 24 à 27, plus `ui_feu_camp`)

| id | statut | constat |
|---|---|---|
| objet_corde | ok | Raccord invisible à 0,15. Toujours en tileSprite, jamais au-delà de 0,3. |
| fx_fil_soie | ok | Échelle 0,15 → 0,25 pour garder les perles visibles. |
| ui_bulle | ok | nineSlice {74, 74, 60, 60}, échelle 0,2, padding 12/7 (sinon le texte touche les coins arrondis). |
| ui_bulle_pointe | ok | Échelle 0,26 pour raccorder son liseré à celui de la bulle. |
| ui_invite | ok | Découpe en 3 morceaux horizontaux {105, 105, 0, 0}, échelle 0,15 (24 px de haut). |
| ui_banniere | retouche | La zone unie est trop basse pour 2 lignes de description : bannière de 128 px de haut, nineSlice {115, 115, 76, 78} (R6). |
| ui_touche | ok | Bois clair : lettre sombre #2a1f45 obligatoire. nineSlice {90, 90, 0, 0} pour les libellés longs. |
| ui_alerte | ok | Lisible même petite. |
| ui_etoiles_etourdi | ok | 61x22 px à 0,24. |
| ui_case_competence | ok | 34 px (`HUD_SKILL_SIZE`). |
| ui_anneau_objet | ok | Disque intérieur de 50x46 px : l'icône passe à 46 px. |
| ui_ornement_titre | ok | 372x110. Échelle 0,5, posée plus bas que prévu pour ne pas toucher le titre. |
| ui_energie_cadre | retouche | Rainure fine : il faut afficher le cadre en 150x22 (rainure 114x7, et non 128) (Q6). |
| ui_energie_remplissage | ok | Affiché à la taille de la rainure (114x7) avec `setCrop`. |
| ui_boss_cadre | retouche | Il faut afficher le cadre en 448x32 (rainure 378x8) (Q6). |
| ui_boss_remplissage | ok | Affiché à la taille de la rainure (378x8). |
| ui_feu_camp | ok | Déjà branché (`CampfireMenuScene.buildPanel`). Jamais d'import `--force` sur cette entrée. |

### Art existant jamais affiché (audité par le groupe F, hors lot 8)

| id | statut | constat |
|---|---|---|
| kainati_sol | ok | Jamais utilisé. La pose `stunned` est exploitable tout de suite ; le reste dépend de la refonte de Kainati (Q5). |
| vfx_onde_choc | ok | Jamais utilisé. À poser sur la hitbox des ondes de Kainati (réservé). |
| vfx_vague_mousse | ok | Ne sert qu'à la refonte de Kainati. |
| rocher_roulant | ok | Proposé en décor au pied du passage du totem (H21). |
| lance_amanite, porte_mousse | ok | Aucun usage cohérent trouvé (H20). |
| pierre | ok | Chez Kainati, elle s'affiche à 41 px pour une collision de 24 px. Le singe corrompu ne l'utilise pas encore. |
| fleur_resistante | ok | Plante entière (racines, motte) : ne **pas** la faire voler comme fleur cueillie. Prendre le cadre `tete` de la plante fleurie (groupe C). |
| mousse_mur | ok | Une seule image étirée se lit bien ; empilée, elle montre des coutures. |
| mousse_amas_fissure | ok | Déjà branchée (Juice). |
| Anims jamais jouées | ok | `xara_extra.excited`, `habitant_porteur.walk_carry`, `habitant_garde.push`, `kainati.hit`, `ghilt.hit`, `vfx_piste_loup.appear`. |

**Bilan du lot 8 (120 entrées)** :

| Groupe | ok | retouche | à refaire |
|---|---|---|---|
| A | 14 | 6 | 0 |
| B | 15 | 0 | 0 |
| C | 20 | 1 | 0 |
| D | 27 | 5 | 0 |
| E | 7 | 6 | 2 |
| F | 14 | 3 | 0 |
| **Total** | **97** | **21** | **2** |

---

## 3. Lots d'implémentation

### 3.1 Règles communes à tous les agents

- **Démarrer seulement après la fin de Juice, de Niveaux 2 et d'Épreuve du singe**, et après les réponses aux questions de la section 8.1.
- **Un fichier = un seul agent** (répartition en 3.2).
  - Un agent qui a besoin d'un changement dans un fichier qui n'est pas le sien le note dans son compte rendu. Il ne le fait pas lui-même.
  - La conversation principale ne touche pas non plus ces fichiers pendant que l'agent travaille.
- **Avant chaque étape marquée « Juice » ou « Niveaux 2 » :** relire la fonction. Si le travail est déjà fait, vérifier et corriger au lieu de refaire.
- **Repli obligatoire.** Chaque branchement teste `scene.textures.exists('item-<id>')` ou `hasManifestArt(scene, id, anim)`, et garde le dessin actuel sinon. Le jeu doit rester jouable sans aucune image.
  - Les appels vers un autre lot se protègent par `typeof f === 'function'`.
- **Gameplay intact.** Hitbox, timings, drapeaux et zones physiques ne changent pas, sauf mention contraire validée par l'utilisateur.
- **Échelles.** Les lire dans le manifeste plutôt qu'en dur, avec une garde contre l'entrée absente : `(getItemManifest()[id] || {}).scale || <repli>`.
- **Tweens d'échelle relatifs.** Avec une image de 128 à 440 px, un tween calibré pour une forme de 32 px (`scale: 0.1`, `scale: 4`…) doit devenir `base × facteur`.
  - Pour une image dont `scaleX` ≠ `scaleY` (halo en `setDisplaySize`), tweener `scaleX` et `scaleY` séparément, jamais `scale`.
- **Commentaires en français**, qui expliquent le « pourquoi ».
- **Tests.** `tools/playtest.py` avec le port de l'agent (3.2) : toutes les scènes touchées doivent sortir en code 0. Ne jamais utiliser `tools/dev_server.py`.
  - Captures dans le scratchpad, sous `lot8_integration/<agent>/`, jamais dans le dépôt.
- **Compte rendu.** Concis, en français :
  - fichiers et fonctions modifiés ;
  - chemins absolus des captures ;
  - écarts au plan ;
  - demandes pour d'autres lots.

### 3.2 Répartition des fichiers

| Agent | Lot | Fichiers (et seulement ceux-là) | Port |
|---|---|---|---|
| **M** | Manifeste | `src/data/asset_manifest.js`, `tools/import_codex_assets.py`, `src/data/asset_present.js` (généré), fichiers d'images réimportés. En fin de parcours : `docs/production/PLAN_DEV.md`, `INVENTAIRE_DESSINS_CODE.md`, `RAPPORT_CODEX.md` | 8811 |
| **LK** | Moteur | `src/utils/LevelKit.js` | 8812 |
| **SK** | Moteur | `src/utils/StoryKit.js` | 8813 |
| **EN** | Moteur | `src/entities/*.js` sauf `Kainati.js` : `Piste.js`, `Ghilt.js`, `MousseCreature.js`, `SingeCorrompu.js`, `Projectiles.js`, `CourantAir.js`, `Player.js`, `Xara.js`, `Animaux.js` | 8814 |
| **UI** | Interface | `src/scenes/BootScene.js`, `EditorScene.js`, `DialogueScene.js`, `MenuKit.js`, `CampfireMenuScene.js` | 8815 |
| **A1** | Histoire | `src/story/acte1.js` | 8816 |
| **AR** | Histoire | `src/story/acte1_arbre.js` | 8817 |
| **A2** | Histoire | `src/story/acte2.js` | 8818 |
| **GH** | Histoire | `src/story/boss_ghilt.js` | 8819 |
| **Z** | Zones | `src/data/*_data.js` (hors `asset_manifest.js` et `asset_present.js`) | 8820 |
| *KA (réservé)* | — | `src/entities/Kainati.js`, `src/story/boss_kainati.js` | 8821 |

Remarques :
- Les interfaces dessinées dans `StoryKit.js` (bulles, invites, bannière, carte-titre, HUD, barre de boss) et la barre d'énergie de `LevelKit.js` vont aux agents **SK** et **LK**, propriétaires de ces fichiers. Le lot Interface garde les scènes.
- `BootScene.js` et `EditorScene.js` ne sont pas des menus. Ils vont pourtant au lot Interface, seul lot qui tient `src/scenes/`.

### 3.3 Contrats partagés

Ces fonctions et ces clés sont écrites par un agent et appelées par d'autres. Leur signature est figée ici, pour que tous puissent coder en parallèle.

| Contrat | Écrit par | Utilisé par | Signature |
|---|---|---|---|
| `addUiSliced` | SK | SK, LK, UI | Voir ci-dessous. (KA n'en a pas besoin : `ui_alerte` et `ui_etoiles_etourdi` sont des images simples.) |
| `createStoryPromptLabel` | SK | SK, LK, A2, KA | Voir ci-dessous. |
| `arbreGlowPassage` | AR | AR, KA | Voir ci-dessous. |
| `acte1Particles` (option `fx`) | A1 | A1, AR | `acte1Particles(scene, x, y, { …, fx: [ids] })`. Images en alternance, `setScale(2r × 1.3 / 128)`, angle aléatoire ; ADD seulement pour `fx_braise`. Sans l'option, comportement actuel. |
| `MANIFEST_DECOR_SECTIONS`, `propDefaultScale`, `DECOR_PROP_PLACEMENT` | LK | UI, Z | Voir ci-dessous. |
| Clés de props | LK | Z, UI | Voir ci-dessous. |
| Clé `farLayers` | LK | Z | Voir ci-dessous. |
| Clé `lights` | SK | Z | Voir ci-dessous. |
| `ambient.vignette` | SK | Z | `false` désactive ; un nombre entre 0 et 1 force la force. Absente : `Clamp(0.35 + darkness × 0.6, 0.35, 0.85)`. |
| `ambientLife.spores` | LK | Z | `spores: n`. Spores `fx_spore_toxique` d'ambiance, 10-12 px, mode normal, dérive lente. |
| `liquidFloor.frontY` | LK | Z | Facultatif. Proposition de synthèse : le y de la brume de premier plan, pour la remonter sans déplacer la brume arrière. |
| Réplique `mood` | SK | A2, GH | `{ who: 'xara', mood: 'excited', … }` joue `xara_extra.excited` au lieu de `talk`. |

**`addUiSliced(scene, id, x, y, w, h, { scale, depth, container, scrollFactor }) → Container | null`**
- Origine en haut à gauche.
- Lit `nineSlice` {left, right, top, bottom} en px source dans le manifeste.
- Si `top = bottom = 0`, découpe en 3 morceaux horizontaux : la hauteur vaut `texH × scale` et `h` est ignoré.
- Bornes minimales : `w ≥ (left + right) × scale` et `h ≥ (top + bottom) × scale`.
- `scrollFactor` s'applique aussi aux enfants.
- Renvoie `null` si la texture manque.

**`createStoryPromptLabel(scene, { depth, originY }) → objet qui imite un Text`**
- Méthodes `setText`, `setPosition`, `setVisible` et `setDepth`, qui renvoient `this`. `setOrigin` ne fait rien.
- Propriétés `visible` et `active`.
- `setText` découpe `/^([A-Z]) : (.*)$/` en pastille + reste, et ne fait rien si le libellé n'a pas changé.

**`arbreGlowPassage(scene, x, y, h = 120, color = 0xbfe8a0, open = true) → { glow, core, setOpen(v) }`**
- `glow` et `core` portent `__sx` et `__sy`.
- Les appelants tweenent `scaleX` et `scaleY`, jamais `scale`.

**Décors du manifeste dans l'éditeur**
- `MANIFEST_DECOR_SECTIONS = ['decor', 'objet', 'rocher']`.
- `propDefaultScale(type) → (getItemManifest()[type] || {}).scale || PROP_SCALE`.
- `DECOR_PROP_PLACEMENT = { decor_mousse_lumineuse_plafond: { hang: true }, decor_mousse_lumineuse_tronc: { free: true }, decor_empreinte_boue: { flatY: 0.5 } }`.

**Clés de props** (facultatives et rétro-compatibles, sur une entrée de `props`) :

| Clé | Effet |
|---|---|
| `flipX: true` | Image retournée. |
| `angle: deg` | Rotation. Pas de recalage au sol ; `y` est le point d'enfoncement. |
| `hang: true` | Origine (0.5, 0) en `y`. |
| `free: true` | Origine (0.5, 0.5) en `y`. |
| `flatY: k` | Échelle Y multipliée par `k`. |
| `front: true` | Profondeur `DECOR_FOREGROUND_DEPTH - 3`. |

**Clé `farLayers`**

`farLayers: [{ id, y, scale?, scrollX = 0.25, scrollY = 0.3, alpha = 1, tint?, fill = false, fadeInX?: [x0, x1], withSky = false }]`

- `tint` ne fait qu'assombrir.
- `fill` pose un rectangle de la couleur du bas de la texture sous la bande.

**Clé `lights`**

`lights: [{ id, x, y, w, h, tint, alpha, pulse?: [min, max, ms], layer: 'back' | 'aboveAmbient', requires?, forbids? }]`

- `id` vaut `fx_rai_lumiere`, `fx_lueur_sol`, `fx_halo_doux` ou `fx_halo_rayons`.
- Pour un rai, `y` est le bas ; sinon, le centre.

**Profondeurs de référence** (contrat PLAN_DEV) :

| Élément | Profondeur |
|---|---|
| Personnages | `CHARACTER_DEPTH` = 10 |
| Voile `ambient` | 900 |
| Éclat du ciel et `lights` `aboveAmbient` | 950 |
| Feuilles | 999 |
| **Vignette** | **999,5** |
| `hudGraphics` et premier plan (`DECOR_FOREGROUND_DEPTH`) | 1000 |
| Barre d'énergie peinte | 1000,2 à 1000,6 |
| Cœurs du HUD | 1001 |
| Barre de boss | 1001,5 à 1003 |
| Bulles de parole | 1040 |
| Invites | 1050 |

### 3.4 Ordre et dépendances

```
Phase 0  Fin de Juice, Niveaux 2 et Épreuve du singe ; réponses aux questions 8.1
Phase 1  Lot Manifeste, étapes M1 à M3 (valeurs, importeur, réimport)   -- 1 agent, court
Phase 2  En parallèle, fichiers disjoints : LK, SK, EN, UI
Phase 3  En parallèle : A1, AR, A2, GH
         (peut chevaucher la phase 2 : tous les appels croisés sont protégés par typeof ;
          seuls les essais visuels attendent le contrat)
Phase 4  Lot Zones (Z)
Phase 5  Réservé Kainati (si Q5 tranchée) ; Manifeste M4 (documentation) ;
         vérification globale (section 9)
```

Dépendances à respecter :

- **M3 avant toute capture de contrôle.** Le réimport change des images que le code de Juice affiche déjà : halos des lanternes et des feux, bulles du lac, anneaux.
  - **M04 (halos) avant :**
    - `a2GlowTexture`, `ghGlowTexture` ;
    - le halo de `PapillonSwarm` et celui des papillons (`Animaux.js`) ;
    - les halos de l'idole, de la plante perchée et de la graine ;
    - `arbreGlowPassage`.
  - **M05 (flaque) avant** toute teinte de `fx_lueur_sol` : feux de camp, lanternes, plateformes du loup.
  - **M06 (anneau) avant** `acte1TalismanGlow` et l'onde de `ghiltChute`.
  - **M01 (bulle) avant** la boule de Ghil't.
- **SK → LK, UI, A2, KA.** `addUiSliced` et `createStoryPromptLabel` : le code s'écrit en parallèle, mais l'essai visuel attend SK.
- **LK → UI et Z.** `MANIFEST_DECOR_SECTIONS`, `propDefaultScale`, `DECOR_PROP_PLACEMENT`, les clés de props, `farLayers` et `ambientLife.spores`.
- **UI (BootScene) → Z.** Les décors du manifeste posés en `props` exigent leur préchargement en `prop-<clé>`.
- **SK → Z.** `lights` et `ambient.vignette`.
- **A1 → AR.** AR passe l'option `fx` à `acte1Particles`. Avant le changement d'A1, l'option est simplement ignorée.
- **AR → KA.** `kainatiRevealPassage` appelle la nouvelle signature de `arbreGlowPassage`.
- **Section 7 → M.** Les images retouchées (marée, note, grappin…) sont réimportées par M, avec `--force --only`, dès qu'elles arrivent.

### 3.5 Lot Manifeste (agent M)

**M1. Valeurs du manifeste.** Appliquer le tableau de la section 6 (échelles, placeholders, `nineSlice`, `align`, commentaires).
- Respecter le format lu par l'importeur : clés nues, chaînes entre guillemets doubles, pas de `:` dans les chaînes.
- Ne pas toucher `geralt_invocation` ni `vfx_invocation_clak` sans l'accord de Niveaux 2. La seule exception, facultative, est `geralt_invocation.scale` à 0,325.

**M2. Importeur `tools/import_codex_assets.py`.** Options `norm`, seulement si Q2 = oui :

| Réf. | Option | Où | Pour quoi | Priorité |
|---|---|---|---|---|
| M04 | `pad: 12` puis `falloff: p` (`alpha *= clamp(1 - r, 0, 1)^p`, r normalisé sur les demi-axes) | `normalize()`, ≈ l.477 | `fx_halo_doux` p = 1.0 (énergie 0,179, proche d'`a2-glow` et `gh-glow`) ; `fx_halo_rayons` p = 0.9 (l'octogone disparaît) | **Haute** |
| M05 | `cropTop: 20` (toute valeur de 20 à 43) et `desaturate: true` (RGB en blanc, alpha gardé) | `normalize()` | `fx_lueur_sol` | Haute |
| M06 | `align: 'ring'` : cercle ajusté par moindres carrés sur les pixels d'alpha > 150 et de luminance > 200, centré dans un canevas de 317x341 | `place()`, ≈ l.351 / `import_anim`, ≈ l.375 | `vfx_anneau_choc` | Haute |
| M03 | `trimAlpha: 0` (rogner à alpha > 0 au lieu de > 10 ; `ALPHA_T`, l.72, `trim()`, ≈ l.214) | `trim()` | `fx_halo_objet`, `fx_aura_esprit`, `fx_rai_lumiere`, `fx_lueur_sol` | Facultative |

Détail pour M06 :
- **Ne pas** utiliser `align 'mass'` : les mottes décalent le centre de masse de 25 px.
- Autre solution : des décalages fixes (dx, dy) appliqués au crop.
  - rangée 0 : (+2, 0) (+14, 0) (+19, -1) (+4, 0) ;
  - rangée 1 : (+1, +1) (+13, +1) (+20, +3) (+10, +7).

Si Q2 = non : pas d'options d'importeur, et les images passent à Codex (section 7.7).

**M3. Réimport ciblé.**

```
python tools/import_codex_assets.py --force --only vfx_mousse_toxique vfx_anneau_choc fx_halo_doux fx_halo_rayons fx_lueur_sol
python tools/import_codex_assets.py --force --only fx_halo_objet fx_aura_esprit fx_rai_lumiere   # seulement si M03
python tools/import_codex_assets.py --present-only
```

- **Jamais `--force` sur `ui_feu_camp`** : il rognerait l'image existante.
- Vérifier le journal d'import. L'importeur ne refait **pas** les montages `controles/lot_8/NN_final.jpg` : faire un montage avant / après des ids réimportés dans le scratchpad (`lot8_integration/M/`), fond nuit et damier.
- Prévenir les autres agents : les halos paraîtront environ 25 % plus petits. Les tailles des halos de Juice (feux, lanternes, totems) devront peut-être grandir de 20 à 30 % (étapes LK-6 et SK-10).
- Réimporter ensuite, au fil de l'eau, les images retouchées de la section 7 :
  - `--force --only liquide_mousse_toxique` ;
  - `--force --only note_geralt objet_grappin` ;
  - etc.

**M4. Documentation** (phase 5, d'après les comptes rendus des autres agents).

- **`PLAN_DEV.md`** :
  - `farLayers` et `liquidFloor.frontY` : section « Fonds, liquide et caméra verticale », ≈ l.413 ;
  - `ambient.vignette` : ≈ l.134 ;
  - `lights` et `ambientLife.spores` ;
  - section « Décors (props) », ≈ l.329 : sections `decor`, `objet` et `rocher` (clés = ids du manifeste, chargées depuis leur chemin, échelle par défaut = celle du manifeste) et clés de props `flipX`, `angle`, `hang`, `free`, `flatY` et `front` ;
  - champ de réplique `mood` ;
  - l.319 : `note_geralt` a maintenant son art, le dessin ne sert plus que de repli.
- **`INVENTAIRE_DESSINS_CODE.md`** :
  - marquer chaque élément remplacé ;
  - noter que W2, T11, T12 et T13 n'existent plus (retirés par Niveaux 2) et que T2 (marches) est retiré ;
  - mettre à jour les lignes de T1-T8, P11, P14, V14, V31 et C1-C6 (valeurs dans les plans B et E).
- **`RAPPORT_CODEX.md`**, section « Lot n°8 » :
  - le contrôle « Δ=0 aux bords » ne détecte pas les raccords faits en fondu ;
  - `note_geralt` et `objet_grappin` ont été coupés par la limite de cellule ;
  - la bordure brune de `decor_mousse_lumineuse_tronc` a disparu ;
  - les journaux `11_import.log` et `12_import.log` sont périmés ;
  - `09_final.jpg` montre la version « poison » actuelle de l'horizon.
- **Commentaires du manifeste** :
  - bloc ITEM, ≈ l.1137-1141 : remplacer « Rien n'est encore branché » par l'état réel ;
  - bloc mare et plantes, ≈ l.1380-1384 : la fleur qui vole est le cadre `tete` de `decor_plante_resistante_fleurie`.

### 3.6 Lot Moteur (agents LK, SK et EN, en parallèle)

#### Agent LK : `src/utils/LevelKit.js`

**LK-1. `addLiquidFloor`** (≈ l.520-575, `LIQUID_STYLES` ≈ l.498). Juice : vérifier d'abord.

- **Style `'eau'`** (`const line`, ≈ l.537) : `y = surfTop - 26 * fk`. La ligne claire (rangées 26 à 31) recouvre alors le liseré du fond : plus de double ligne.
  - Option : voile en `tilePositionY = 1`, pour masquer sa rangée noire.
- **Style `'mousse'`** (`const surfTop`, ≈ l.523) : `surfTop = y - 82 * k`, pour caler la crête médiane sur `y`.
  - À l'épreuve, la crête haute tombe alors à environ 487, sous la ligne de base des arbres (492), qui est couverte partout.
  - Purement visuel : la chute `fall` (y 480) ne change pas.
- **Style `'brume'`** :
  - si `cfg.color` est donné et qu'une image est utilisée : `surf.setTint(cfg.color)`. On retrouve la brume sarcelle du monde spirituel (`0x1d4a5a`) ;
  - sans `front` : caler la rangée dense sur `y` (`surfTop = y - 80 * k`) et ne pas poser le rectangle `deep`, dont le bas effiloché est transparent ;
  - variante si le rendu déçoit : prendre `couche_brume_avant` (crête plus corps opaque) comme image de brume arrière ;
  - valider par capture sur ff1, ff2, la hutte et le monde spirituel. Le pied des arbres posés sur la ligne 500 doit être caché.
- **Brume de premier plan**, seulement si H2 = oui : `couche_brume_avant` à `DECOR_FOREGROUND_DEPTH - 2`, à la hauteur `frontY ?? y`.
- Repli : inchangé.

**LK-2. `addSkyRevealBackLayers`** (boucle des nuages, `const cloudId`, ≈ l.665) : `if (cloudId === 'couche_nuage_4') c.setCrop(66, 0, c.width - 66, c.height)`. Juice : vérifier d'abord.
- Le soleil reste désactivé : rien à faire.

**LK-3. Nouvelle clé `farLayers`** (seulement si Q1 = oui).
- Elle est transmise par `zoneBackdropSpec` (≈ l.396).
- Les couches se créent dans `addMoonlitDecor`, après `if (sky) addSkyRevealBackLayers` (≈ l.361) et avant `addProceduralForest` (≈ l.372).
- Pour chaque couche dont la texture existe :
  ```js
  const k = L.scale ?? manifest.scale;
  const t = scene.add.tileSprite(-100, L.y, levelWidth * sx + width + 200, src.height * k, 'item-' + id)
    .setOrigin(0, 0).setTileScale(k, k).setScrollFactor(sx, sy).setAlpha(alpha);
  ```
  - avec `tint` : `setTint` ;
  - avec `fill` : rectangle `textureEdgeColor(key, 'bottom')` de `y + h - 1` à `y + h + 600`, avec les mêmes scrollFactor ;
  - si `scene.__sky.nappes` existe : `moveBelow(t, nappes[0])`.
- Alpha recalculé à chaque image, seulement si `withSky` ou `fadeInX` :
  ```
  base × (withSky ? clamp((e - 0.4) / 0.5) : 1) × (fadeInX ? clamp((cam.scrollX + width/2 - x0) / (x1 - x0)) : 1)
  ```
  Le calcul tourne dans un `LEVEL_UPDATE_HOOKS`, et pas seulement dans `updateSkyReveal`, qui ne tourne pas dans la hutte (pas de `__zoneCamera`).
- Couche décorative : pas de repli dessiné.

**LK-4. `juiceShockRing`** (≈ l.4263). Juice : corriger.
- `variant = null` par défaut. L'art ne sert que si `variant` vaut `'talisman'` ou `'toxique'`. Sinon, anneau dessiné teinté `color`.
- Passer `variant: 'toxique'` dans la recette `mossBreak` de ce fichier.
- Aucun appel actuel ne passe de variante : totem ≈ l.1950, lanterne (StoryKit ≈ l.2584), purification (MousseCreature ≈ l.121), loup (Piste ≈ l.141), papillon (Player ≈ l.3003), Clak (acte2 ≈ l.481). Tous retombent donc sur l'anneau teinté, ce qui est voulu.

**LK-5. `FX_PARTICLES`** (≈ l.4080). Juice : corriger.
- Tailles : `ember` 6 → 10-12 ; `star` et `mote` 12 → 18-20 (pas 26 : les points satellites font du bruit) ; `wing` 9 → 16.
- `spark` : `art: null`, pour garder la traînée teintable `juice-spark`. Sinon, les étincelles rouges de blessure (Player ≈ l.3759) sortent menthe. `fx_etincelle` reste pour `'glint'` et la purification.
- `dust` : selon R10. Enlever `artTint` (poussière brune) ou mettre `art: null` (lavande teintable).
- Option anti-scintillement (R9) : `juiceTexture` crée une copie réduite sur canvas.

**LK-6. Ambiance et feux.**
- `juiceAddAmbientLife` (≈ l.4516) : option `ambientLife.spores: n`.
- `addCampfire` (≈ l.2015), après M05 :
  - au pied du feu, `fx_lueur_sol` teintée `0xffa860`, `setDisplaySize(fire.displayWidth * 3, 30)`, alpha 0,25 à 0,4, calé sur le halo ;
  - halo du feu à réajuster après M04.

**LK-7. `DECOR_SECTIONS`** (≈ l.2314). Ajouter trois sections, avec un commentaire : exception, leurs images viennent du manifeste et non de `crop_deco_items.py`.
- `decor` : `['mare_berge', 'mare_roseaux', 'fleur_perchee', 'cercle_sain', 'tapis_mousse', 'mousse_sechee', 'mousse_plaque_intacte', 'mousse_plaque_grattee', 'mousse_plaque_repoussee', 'mousse_lumineuse_sol', 'mousse_lumineuse_petite', 'mousse_lumineuse_tronc', 'mousse_lumineuse_plafond', 'touffe_mousse_petite', 'touffe_mousse_moyenne', 'touffe_mousse_grande', 'touffe_mousse_penchee', 'empreinte_boue', 'marches_racines', 'autel_sommet']` ;
- `objet` : `['fleche', 'collet', 'grappin']` ;
- `rocher` : `['roulant']`, seulement si H21 = oui.

La clé `prop-<section>_<item>` est alors égale à l'id du manifeste, sans collision avec les 94 clés existantes. Ajouter aussi `MANIFEST_DECOR_SECTIONS`, `propDefaultScale` et `DECOR_PROP_PLACEMENT` (contrat 3.3).

**LK-8. `buildLevelFromData`**, boucle `data.props` (≈ l.3379) :
- échelle par défaut `propDefaultScale(p.type)` ;
- clés `flipX`, `angle`, `hang`, `free`, `flatY` et `front` (contrat 3.3), lues sur l'entrée, puis dans `DECOR_PROP_PLACEMENT` ;
- `hang`, `free` et `angle` : pas de recalage au sol ;
- le reste ne change pas.

**LK-9. Invites des totems et des feux.** `addAbilityShrine` (≈ l.1888) et `addCampfire` (≈ l.2046) :
- `createStoryPromptLabel(scene, { depth: 1050, originY: 0.5 })` si la fonction existe ;
- libellés « E : se recueillir » et « E : te reposer » si R7 = oui ;
- repli : le Text actuel.

**LK-10. `juiceDrawEnergyBar`** (≈ l.4702, appelée par `drawHud` ≈ l.3546), si Q6 = agrandir.
- Création une seule fois, dans `scene.__energyArt { owner: scene.hudGraphics }`, tout en scrollFactor 0 :
  - cadre : `addUiSliced(scene, 'ui_energie_cadre', x, y - 6, 150, null, { scale: 0.25, scrollFactor: 0 })`, soit 150x22, profondeur 1000.2 ;
  - Graphics dédié à 1000.4 pour la traînée et les contours ;
  - remplissage : image d'origine (0, 0) en (x + 18, y + 3), `displaySize(114, 7)`, profondeur 1000.6.
- À chaque image : `setCrop(0, 0, texW * shown, texH)`, traînée en (x + 18, y + 3, 114 × trail, 7), tout décalé de `deny`.
- Contours (rouge du refus, pulsation de l'énergie pleine) autour de (x - 1, y - 7, 152, 24).
- **La rainure fait 114 px, pas 128.**
- Repli : le dessin actuel.

**LK-11. Optionnel : `addWaterZone`** (≈ l.910). Habillage `liquide_mare_fond` (0,6, alpha 0,85), rectangle de la couleur du bas, surface animée en `y - 26 × 0,6`. La zone physique ne change pas.

#### Agent SK : `src/utils/StoryKit.js`

**SK-1. `addUiSliced`**, juste après `addStoryVineFrame` (≈ l.797), selon le contrat 3.3.
- Cadres `slice_<id>_*` créés par `tex.add` sur `item-<id>`, comme `addStoryVineFrame`.
- Coins et bouts à l'échelle ; bords et centre étirés ; jointures arrondies au pixel.
- **Pas** de `scene.add.nineslice` : en Phaser 3.80.1, il ne marche qu'en WebGL, et `main.js` est en `Phaser.AUTO`.

**SK-2. `createStoryPromptLabel`** (contrat 3.3).
- Contenu :
  - pilule `ui_invite` en 3 morceaux (échelle 0,15, 24 px de haut) ;
  - pastille `ui_touche` de 19 px (0,075) avec la lettre en gras de 12 px #2a1f45 ;
  - texte de 13 px #ffe9f5.
- Largeur : 10 + 19 + 4 + texte + 12.
- `ensureStoryPrompt` (≈ l.1996) l'utilise si `item-ui_invite` existe. Le reste du code (`updateStoryInteractables` ≈ l.2303, `hideStoryPrompt`) ne change pas.

**SK-3. `buildSpeechBubble` / `drawSpeechBubble`** (≈ l.1090), si `item-ui_bulle` existe.
- Padding 12/7, `w = max(30, …)` et `h = max(24, …)`. Ce sont les `b.w` et `b.h` que lisent `positionSpeechBubble` et l'empilement.
- `b.bg = addUiSliced(scene, 'ui_bulle', 0, 0, w, h, { scale: 0.2 })`.
- Pointe : `b.tail` = image `item-ui_bulle_pointe`, origine (0.5, 0), échelle 0,26. Container [bg, tail, label].
- Dans `drawSpeechBubble` :
  - `b.bg.setPosition(left, top)` ;
  - `yb = top + h - 7` ;
  - pointe en (tx, yb), `setRotation(Math.atan2(tx, -yb))`, `setDisplaySize(18, hypot(tx, yb))`.
- Profondeur 1040 inchangée. Repli : le Graphics.

**SK-4. `showStoryBanner`** (≈ l.927), si `item-ui_banniere` existe.
- Fond : h = 128 (R6), `addUiSliced(scene, 'ui_banniere', x, y, 460, 128, { scale: 0.65 })`, ajouté en premier au container.
- Anneau : `ui_anneau_objet` de 72 px en (x + 58, y + 64). Ordre conservé : anneau, rayons ADD, icône de 46 px.
- Textes :
  - kicker y + 31, titre y + 44, description y + 70 ;
  - `wordWrap` à x + w - textX - 34 ;
  - sans icône : `textX = x + 52`.
- Reflet limité à y + 30 … y + h - 26.
- Animations de Juice et `STORY_BANNER_MS` inchangées.
- Repli : `drawStoryPanel` et l'anneau dessiné.

**SK-5. `showTitleCard`** (≈ l.1245). L'image `ui_ornement_titre` remplace `lineL`, `lineR` et `gem`.
- Origine (0.5, 0) en (width / 2, y + 20), échelle `s = Clamp(2 × half / 372, 0.4, 0.5)`.
- `setScale(0, s)`, puis tween de `scaleX` vers s (délai 150 ms, durée 800 ms).
- Sous-titre de y + 90 à y + 84 ; étincelles à y + 32 ; bande inchangée.
- Repli : filets et losange.

**SK-6. `storyDrawHudArt`** (≈ l.838).
- Pastille de touche : `item-ui_touche` de 18 px (0,07), scrollFactor 0, profondeur 1002, lettre en gras de 11 px #2a1f45.
- Case vide, **avant** le `if (!has) return;` :
  - image `ui_case_competence` de 34 px (0,133) en (cx, skillY), profondeur 1001 ;
  - `hudSkillTexts[i]` : `setText(label)`, `setPosition(cx, skillY)`, `setAlpha(0.5)`, `setVisible(true)` ;
  - `result.skills[i] = true` ;
  - cacher l'image dès qu'une compétence est équipée.
  Sans cela, `drawHud` ne positionne plus la lettre, qui reste en (0, 0).

**SK-7. `showBossBar` / `hideBossBar`** (≈ l.1302), si Q6 = agrandir.
- Cadre : `addUiSliced(scene, 'ui_boss_cadre', x - 4, y - 10, 448, null, { scale: 0.5, scrollFactor: 0 })`, profondeur 1001.5.
- `g` ne dessine plus que la traînée, en (x + 31, y + 2, 378 × shown, 8).
- Remplissage : image en (x + 31, y + 2), `displaySize(378, 8)`, `setCrop(texW × ratio)`, profondeur 1002.5.
- Nom à y - 12.
- `hideBossBar` détruit tout.
- Repli : le dessin actuel.

**SK-8. Optionnel : `showToast`** (≈ l.1011). Text sans fond, posé sur `addUiSliced('ui_bulle', …, { scale: 0.2, scrollFactor: 0 })`, dans un Container qui reçoit les mêmes tweens.

**SK-9. `LEVEL_DATA_HANDLERS.ambient`** (≈ l.2036). Garder le rectangle tel quel.
- `const vig = amb.vignette ?? true`.
- Si `vig !== false` et que `item-couche_vignette` existe :
  ```js
  scene.ambientVignette = scene.add.image(width / 2, height / 2, 'item-couche_vignette')
    .setDisplaySize(width, height).setScrollFactor(0).setBlendMode(Phaser.BlendModes.MULTIPLY)
    .setAlpha(typeof vig === 'number' ? vig : Phaser.Math.Clamp(0.35 + (amb.darkness ?? 0.35) * 0.6, 0.35, 0.85))
    .setDepth(999.5);
  ```
- **Jamais de `setTint`.**
- Profondeur **999,5**, et non 1000,5 : `hudGraphics` (barre d'énergie, cases de repli) est à 1000, dans le coin le plus sombre.

**SK-10. `LEVEL_DATA_HANDLERS.checkpoints` et `updateStoryCheckpoints`** (≈ l.2195-2248). Juice : corriger.
- l.2211 : `lampY = y - img.displayHeight * 0.63`, le centre mesuré du globe.
- Si R1 = 0,15 : halo de 64 → 80 px aux deux endroits (≈ l.2219 et ≈ l.2239), puis réajuster sur capture après M04.
- Option (J03, après M05) : `fx_lueur_sol` sous la lanterne allumée, dans `draw(lit)`, teintée `STORY_UI.vineLight`, 90x18, alpha 0,3.

**SK-11. Nouveau `LEVEL_DATA_HANDLERS.lights`** (contrat 3.3, seulement si Q1 = oui).
- Images ADD, filtrées par `storyAllowed`.
- `'back'` : `storyPutBehindPlayer`. `'aboveAmbient'` : profondeur 950, au-dessus du voile `ambient` à 900.
- `pulse` : tween d'alpha en yoyo.
- Rien n'est affiché sans l'image.

**SK-12. `openMossWall`** (≈ l.2416). Juice : corriger.
- Ne plus dessiner les 14 cercles rose et or quand `spawnFx` existe : la recette `melt` émet déjà `fx_bulle`.
- Sinon : images `fx_bulle` teintées (`setScale(2r × 1.2 / 128)`).

**SK-13. `storySpeakerTalkAnim`** (≈ l.1478), si H22 = oui : champ de réplique `mood: 'excited'` → `xara_extra.excited`, si `hasManifestArt`.

*Rien à faire pour `note_geralt`* : `addItemImage` (≈ l.286) prend déjà l'image. `STORY_DRAWN_ITEMS` sert de repli.

#### Agent EN : `src/entities/*.js` sauf `Kainati.js`

**EN-1. `Piste.js`**

a. **Constructeur de `HiddenPlatform`** (≈ l.89-91). Juice : corriger. Caler le contour sur la case pleine :
```js
const f = scene.textures.getFrame('item-decor_plateforme_fantome');
const C = { x0: 1, x1: 378, y0: 26, y1: 132 }; // boîte extérieure des tirets dans le PNG
this.hint = scene.add.image(this.rect.x + 2, this.rect.y + 2, 'item-decor_plateforme_fantome')
  .setOrigin(C.x0 / f.width, C.y0 / f.height)
  .setScale((this.rect.width - 4) / (C.x1 - C.x0), (this.rect.height - 4) / (C.y1 - C.y0))
  .setTint(PISTE_COLOR).setBlendMode(Phaser.BlendModes.ADD);
```
Hitbox, distances, pulsation et `reveal()` ne changent pas.

b. **`HiddenPlatform.reveal`** (≈ l.134), après M05 : le flash rectangulaire devient `fx_lueur_sol`.
- Origine (0.5, 0.5) en (rect.centerX, rect.y + 6), `setDisplaySize(rect.width × 1.3, 40)`, teinte `PISTE_COLOR`, ADD.
- Même tween d'alpha (0,5 → 0 en 600 ms).
- L'anneau devient l'anneau dessiné teinté, grâce à LK-4.

c. **`PisteTrack.update`** (≈ l.65) : quand l'alpha passe de 0 à plus de 0, jouer `playManifest('appear', false)` sur chaque empreinte, avec 60 ms de décalage entre elles, puis `'glow'` sur `animationcomplete`. Vérifier que le bas visible de `appear` tombe au même endroit que celui de `glow`.

**EN-2. `Ghilt.js`**

a. **`addSpitBall` + `updateHazards`** (branche `'ball'`, ≈ l.429), après M01 :
- si `hasManifestArt(scene, 'vfx_mousse_toxique', 'boule')` : `addManifestSprite(…, 'boule', { origin: [0.65, 0.5] }).setScale(22 / 140)`, soit un corps de 22 px, comme la hitbox ;
- rotation `atan2(vy, vx)` à la création, puis à chaque mise à jour ;
- hitbox (cercle de rayon 11 sur `obj.x`/`obj.y`), trajectoire et profondeur inchangées ;
- pas d'éclaboussure à l'impact.

b. **`addBreath` / `drawBreath` / `destroyHazard`** (≈ l.408 et ≈ l.507), selon Q8 :
- `hz.sprite.setScale(330 / 354, (tri.y3 - tri.y2) / 269)` et rotation alignée sur `breathTriangle` ;
- ne plus remplir le triangle quand `hz.sprite` existe ;
- `hz.puffs` : réserve de 10 images `fx_bouffee_toxique`, mêmes formules, `setScale(2 × (8 + t × 24) / 128)` ;
- `destroyHazard` détruit les bouffées ;
- hitbox inchangée.

c. **`spawnDust`** (≈ l.541) : `fx_bouffee_poussiere`, `base = 2r / 128`, tween **relatif** vers `base × 1.8`.

d. **`spawnInhale`** (≈ l.552) : `fx_spore_toxique` en mode normal, 14 px (c'est un télégraphe), même tween, plus une rotation.

e. **`takeHit`** (≈ l.598) : `playAnim('hit')` en idle ou en recover seulement, puis `this.hitAnimUntil = now + 300`. Dans `update` (case `'idle'`), ne pas rappeler `playAnim` tant que `now < hitAnimUntil`.

f. *Optionnel* : `ui_etoiles_etourdi` (0,3) au-dessus de Ghil't en état `'weakened'`, détruit dans `heal` et dans `destroy`.

**EN-3. `MousseCreature.js`**

a. **`spawnToxicDrip`** (≈ l.62) : `item-fx_goutte_toxique` à `setScale(6 / 128)`, même tween. Juice : vérifier d'abord.

b. **`spawnLightParticles`** (≈ l.35) : `item-fx_grain_lumiere` avec `base = FloatBetween(0.25, 0.5) × 32 × 1.6 / 128` et un tween vers `base × 0.25`, **relatif**.
- **`purifyCorruptedEnemy`** : ajouter `addManifestSprite(scene, cx, cy, 'vfx_purification', 'burst', { origin: [0.5, 0.5] }).setDepth(901)`, détruit sur `animationcomplete`. Juice : vérifier d'abord.

c. **`MousseCreature.heal`** (onClean, ≈ l.375) :
- `setTexture('item-mousse_creature_guerie_0')`, `setScale(s)` et `baseScale = s` (échelle du manifeste) ;
- `_1` pendant 120 ms aux atterrissages des 3 bonds (≈ 530, 890 et 1250 ms, avec la garde `e.active`).

**EN-4. `SingeCorrompu.js`**

a. **`heal`** (onClean, ≈ l.266) :
- si `hasManifestArt(scene, 'singe_gueri')` : `ensureManifestAnims`, `anims.stop()`, `setScale(scale du manifeste)`, `e.play('singe_gueri-idle')`, puis `e.play('singe_gueri-run')` 220 ms plus tard ;
- utiliser `e.play` et non `playManifest`, qui est lié à `singe_corrompu` ;
- repli : la texture `singe-sain`.

b. **`throwSingeStone`** (≈ l.94) :
```js
const art = scene.textures.exists('item-pierre');
const stone = scene.physics.add.image(x, y, art ? 'item-pierre' : SINGE_STONE_TEXTURE_KEY);
if (art) {
  const s = 12 / Math.max(stone.width, stone.height);
  stone.setScale(s);
  const r = 5 / s;
  stone.body.setCircle(r, stone.width / 2 - r, stone.height / 2 - r);
  stone.setTint(0xc8f09a); // vert : pierre ennemie, distincte de celles d'Agarica
}
```
Rayon monde de 5 px, trajectoire et dégâts inchangés.

c. **Fermeture `shatter`** (≈ l.107) : éclats `fx_eclat_pierre` à `setScale(8 / 128)`.

**EN-5. `Projectiles.js`**
- **`PierreProjectile.shatter`** (≈ l.66) : `fx_eclat_pierre` (8/128), mêmes tweens.
- **Halo de `PapillonSwarm`** (`this.glow`, ≈ l.203), après M04 : texture `item-fx_halo_doux`. Mêmes `setDisplaySize`, teinte, alpha et profondeur. La zone de soin ne bouge pas.

**EN-6. `CourantAir.js`** (constructeur ≈ l.12, `draw` ≈ l.45) :
- réserve `this.streakImgs` d'images `fx_trait_vent` (ADD, teinte `WIND_COLOR`, `setAngle(-90)`) ;
- `img.setPosition(x, y + s.len / 2).setDisplaySize(s.len, 6).setAlpha(0.45 × min(1, edge))` ;
- plus de `fillRect` de voile quand `this.image` existe ;
- physique inchangée.

**EN-7. `Player.js`**

a. **`drawSkillFormPose`, branche `'pierre'`** (≈ l.3352), pour `singe_extra` seulement :
```js
const rel = SKILL_FORM_POSE_MS.pierre.releaseAt;
const i = k < rel ? Math.min(2, Math.floor((k / rel) * 3)) : 3;
```
Puis passer `(i + 0.5) / 4` à `frameAt`. Horaire, position du projectile et énergie inchangés. Juice : vérifier d'abord.

b. **Branche papillon** (≈ l.3377-3381). Juice : corriger.
```js
const c = agaricaSheetPoseConfig(sc, 'forme_papillon_extra', 'cast', { method: 'area' });
const s = this.butterflyArt ? FORMS.butterfly.scale : c.scale;
cfg = { ...c, scale: s, body: transfoBodyConfig(c.frameWidth, c.frameHeight, s) };
```
La garde `this.butterflyArt` est indispensable : sans l'art `forme_papillon`, `FORMS.butterfly.scale` vaut 1.

c. **`spawnButterflySparkles`** (≈ l.3090) : `spawnFx('wingDust')`, ou `fx_etincelle_papillon` à 16 px avec un tween relatif.
- **`spawnButterflyTrail`** (≈ l.3106) : `fx_trainee_papillon` (0,3), `setRotation(atan2(vy, vx))`, profondeur `this.depth - 1`, tween relatif.
- **`spawnSkillFormPuff`** (≈ l.3407) : `spawnFx('leaves', …)`.

d. **`applyVineClimbPose`** : rien à changer. Vérifier seulement à l'écran le passage `liane_hang` → `climb`.

**EN-8. `Xara.js`**, constructeur (thread ≈ l.313) et `drawThread` (≈ l.888).
- Avant `super()` :
  ```js
  const threadArt = scene.textures.exists('item-fx_fil_soie')
    ? scene.add.tileSprite(0, 0, 3, 8, 'item-fx_fil_soie').setOrigin(0.5, 0).setTileScale(0.25).setDepth(CHARACTER_DEPTH).setVisible(false)
    : null;
  ```
  Puis, après `super()` : `this.threadArt = threadArt`.
- Dans `drawThread` :
  - `setPosition(topX, topY)` ;
  - `setSize(3, L)`, L étant la distance entre la tête et le haut ;
  - `setRotation(Math.atan2(-(headX - topX), headY - topY))` ;
  - alpha 0,85 ;
  - visible si `progress > 0.01` et `this.visible`.
- `drawBubble` garde son Graphics.

**EN-9. `Animaux.js`, `spawnButterflies`** (halo, ≈ l.320), après M04 : texture `item-fx_halo_doux`, `setScale(35 / taille de la texture)`. Teinte, ADD et alpha inchangés. Cela couvre les papillons de Morgat, de fc1, du jour, du trou sombre et de l'arène.

### 3.7 Lot Interface (agent UI)

**UI-1. `BootScene.preload`** (boucle `DECOR_SECTIONS`, ≈ l.237) :
```js
if (typeof MANIFEST_DECOR_SECTIONS !== 'undefined' && MANIFEST_DECOR_SECTIONS.includes(section)) {
  const def = getItemManifest()[key];
  if (def && def.path && assetPresent(def.path)) this.load.image(`${PROP_PREFIX}${key}`, def.path);
  continue;
}
```
Cela charge les décors du manifeste depuis leur vrai chemin, sans erreur 404 si l'image manque. Le doublon avec `item-<id>` est servi par le cache du navigateur.

**UI-2. `EditorScene.js`**
- `EDITOR_MIN_SCALE` (≈ l.78) : 0.08 → 0.02, avec un pas multiplicatif de ×1,1.
- Échelle par défaut `propDefaultScale(type)` : pose (≈ l.993-995), rechargement (≈ l.1784-1785) et resize (≈ l.1301-1306).
- `flipX` et `angle` appliqués.
- Pour `hang`, `free` et `angle` : ni `anchorVisibleFeet` ni recalage au sol (y = worldY). Cela vaut aussi dans `moveSelectedMarker` (≈ l.1243-1255).
- `flatY` appliqué à l'affichage.
- L'éditeur doit relire **et réécrire** les nouvelles clés sans les perdre (aller-retour chargement et sauvegarde).
- `EDITOR_NON_PICKUP_ITEM` (≈ l.93) : ajouter `ui_|fx_|couche_|decor_|liquide_|araignee_petite|bete_mousse|objet_(corde|grappin|fleche|collet)|rocher_roulant|lance_amanite`. `objet_graine_coeur` et `note_geralt` restent ramassables.

**UI-3. `DialogueScene.js`** (`nextMarker` ≈ l.83, `completeLine` ≈ l.283) :
- image `ui_bulle_pointe` de 14x10 (0,2), même origine, mêmes rebonds ;
- le tween d'apparition de `completeLine` va **vers 0,2 et non vers 1**, sinon l'image grossit 5 fois ;
- repli : le Text « ▼ ».

**UI-4. `MenuKit.menuDrawKeycap`** (≈ l.305), selon R8.
- Un caractère : `ui_touche` de 24x24.
- Libellé long : `addUiSliced(scene, 'ui_touche', x, y - 13, largeur, null, { scale: 24 / 255, container })`.
- Texte #2a1f45 ; état atténué : alpha 0,7 ; même largeur renvoyée.
- **`menuPanelTitle` ne change pas** : il n'y a pas la place pour l'ornement sous les titres.

**UI-5. Optionnel : `CampfireMenuScene.buildStaticSlots`.** Touches A/F/R en `ui_touche` de 20 px, lettre #2a1f45. Pas de `ui_case_competence` : la case est carrée, alors que les emplacements font 108x30. Le panneau `ui_feu_camp` est déjà en place.

### 3.8 Lot Histoire (agents A1, AR, A2 et GH, en parallèle)

#### Agent A1 : `src/story/acte1.js`

**A1-1. `acte1Fs2DrawMare`** (≈ l.817, constante `FS2_MARE` ≈ l.740). Une seule passe pour l'eau (A), le pont (B), les berges et les roseaux (C).

- **Eau**, si `item-liquide_mare_fond` existe :
  - `k = (540 - y) / 140` (≈ 0,63, une seule rangée de tuile) ;
  - fond : `tileSprite(x, y, w, 540 - y, 'item-liquide_mare_fond').setOrigin(0, 0).setTileScale(k, k).setDepth(3)` ;
  - voile : même cadre, profondeur 5, alpha 0,3, tween d'alpha vers 0,2 (1600 ms, yoyo), dérive de `tilePositionX` de 0 à -1536 en 45 s ;
  - surface : `tileSprite(x, y + 8 - 26 × k, w, 35 × k, frames[0]).setOrigin(0, 0).setTileScale(k, k).setDepth(5)`. Frame suivante toutes les 125 ms (`time.addEvent`, avec `if (!line.active) return`). La ligne claire tombe en y + 8 … y + 12, juste sous le tronc.
- **Berges** (`decor_mare_berge`, 0,14), profondeur 4.5 (devant les poissons, à 4, derrière le voile, à 5), **hors du tween d'alpha** :
  - rive gauche : origine (1, 1) en (x + 14, y + 10) ;
  - rive droite : flipX, origine (0, 1) en (x + w - 14, y + 10).
- **Roseaux** (`decor_mare_roseaux`, 0,08), profondeur **6.5**, devant le pont et derrière les personnages :
  - origine (0.5, 1) en (x + 6, y + 5) ;
  - en flipX en (x + w - 6, y + 5).
- **Pont** :
  ```js
  scene.add.image(x + w / 2, storyStandY(scene, x + w / 2, 448) - 2, 'item-decor_pont_tronc')
    .setOrigin(0.5, 34 / 90).setDisplaySize(w + 44, 26).setDepth(6);
  ```
  Ou, selon R2, `setScale(0.205)`.
- Repli : chaque Graphics actuel, élément par élément. Aucun corps physique touché.

**A1-2. Plaques du bosquet.**
- **`acte1MossPatch`** (≈ l.126) :
  - image `decor_mousse_plaque_intacte`, origine (0.5, 1) ;
  - `baseScale = w / width` (0,216 pour w = 70) et `setVisibleBottomY(g, y + 3)` ;
  - l'objet renvoyé (champs, rectangle de grattage) ne change pas.
- **`ZONE_SCRIPTS.bosquet.update`** (grattage, ≈ l.482-495), seulement si `patch.g` est une Image :
  - 1er coup : `setTint(0xbfcfb8)` au lieu de l'alpha 0,6 ;
  - 2e coup : `clearTint().setTexture('item-decor_mousse_plaque_grattee')`, petit tassement en scaleY (base × 0,8 → base, 150 ms) ;
  - la plaque **reste** comme trace (H10) ;
  - `done`, `hp`, `lastToken`, particules et déclenchement de `bosquet_mousse_revient` ne changent pas.
- **`acte1BosquetRegrow`** (≈ l.391) :
  - faire fondre la plaque grattée de `st.patches[1]` ;
  - créer `…_repoussee` au même x, origine (0.5, 1), `baseScale = 70 / largeur`, bas visible en 448 + 3 ;
  - tween de { alpha 0, scaleY base × 0,2 } vers { alpha 1, scaleY base } en 1200 ms : viser `baseScale`, **pas 1**.
- *Option* : dans `create`, si `aideFaite` est vrai et le bannissement pas encore fait, poser des traces grattées en XS[0] et XS[2], et une plaque repoussée en XS[1].

**A1-3. `acte1DrawMossDecor`** (≈ l.667) :
- 4e champ facultatif `kind` (`'sol'`, `'petite'`, `'tronc'` ou `'plafond'` ; par défaut `r < 20 ? 'petite' : 'sol'`) et 5e champ `flipX` ;
- largeur visée 2,6·r :
  - sol : s = 2,6r / 287 ;
  - petite : 2,6r / 149 ;
  - plafond : 2,6r / 318 ;
  - tronc : 0,2 fixe ;
- origines et ancrage :
  - sol et petite : origine (0.5, 1), `setVisibleBottomY(img, storyStandY(scene, x, y) + 2)`, **avec le y de la tache comme `refY`** ;
  - tronc : origine (0.5, 0.5) ;
  - plafond : origine (0.5, 0) ;
- garder le tween d'alpha ;
- nouvelles listes : section 5 (FS1 : appel ≈ l.696 ; FS2 : appel ≈ l.921).

**A1-4. `acte1Fs2DrawMudPrints`** (≈ l.859) :
- pour chaque x : `sy = storyStandY(scene, x, y)` ; sauter l'empreinte si `storyStandY(x ± 8, y)` diffère de `sy` (bord de marche). Il en reste 14 ;
- image `decor_empreinte_boue`, origine (0.5, 0.5), `setScale(s, s × 0.5)` avec s du manifeste (0,08) ;
- centre en y = sy + 2 + (i % 2), alpha 0,85 ;
- option : sauter |x - 896| < 40 (pied du totem) ;
- ne pas toucher aux pistes `tracks`.

**A1-5. `acte1Fs2DrawPlante`** (≈ l.842) :
- `addItemImage(scene, x, y, 'decor_fleur_perchee', { origin: [0.5, 1] })`, ou `decor_plante_resistante_fleurie` à 0,1 selon H9 ;
- `setVisibleBottomY(g, y + 3)`, même balancement ;
- halo `item-fx_halo_doux` de 150 px, teinte `0xffe9f5`, alpha 0,2, ADD, recentré en y - 32, tween **relatif** (après M04) ;
- option H12 : `decor_cercle_sain` (0,1) sous la fleur, en (x, y + 2), créé avant elle.

**A1-6. `acte1Fs2DrawCoeur`** (≈ l.869) **/ `acte1Fs2TakeCoeur`** (≈ l.891) :
- `addItemImage(scene, x, y, 'objet_graine_coeur')`, mêmes tweens ;
- halo `fx_halo_doux` de 64 px teinté `0xff9fc9` (après M04) ;
- bannière (≈ l.909) avec `itemId: 'objet_graine_coeur'` ;
- le ramassage ne change pas.

**A1-7. `acte1Particles`** (≈ l.17) : option `fx` (contrat 3.3). Appels :
- bosquet (≈ l.218, 221, 403, 488, 501) → `['fx_eclat_mousse', 'fx_motte_mousse']` ;
- talisman (≈ l.629) → `['fx_braise', 'fx_petale_rose']` ;
- graine (≈ l.908) → `['fx_petale_rose', 'fx_petale_blanc']`.

**A1-8. `acte1TalismanGlow`** (≈ l.618), après M06 :
- si `scene.textures.exists('vfx_anneau_choc-talisman-2')` : 3 images de cette **frame fixe**, ADD, profondeur 1040 ;
- `base = 36 / 197`, tween de scale de base à base × 4 et d'alpha de 0,9 à 0 en 900 ms, décalés de 320 ms ;
- garder l'`onUpdate` qui suit Agarica ;
- repli : les cercles.

**A1-9. Halos et rai.**
- **Halo de l'idole** (`st.idolGlow`, ≈ l.458) : `fx_halo_doux` de 90 px teinté `0x8fe3b8`, ADD, tween relatif (après M04).
- **`acte1Fs2DrawSentier`** (≈ l.885) : `fx_rai_lumiere`, origine (0.5, 1) en (5090, 448), `setDisplaySize(90, 200)` (haut caché sous le surplomb), teinte `0xff9fc9`, alpha 0,35, ADD, `storyPutBehindPlayer`.

**A1-10. `acte1Fs1LittleSpider`** (≈ l.633) :
- image `araignee_petite_0`, origine (0.5, 1), `footOffset` 0 ;
- 2e tween de la chaîne :
  - au départ : `_1` ;
  - 120 ms plus tard : `_2` (la révérence) ;
  - au yoyo : `_1` ;
  - à la fin : `_0` ;
- recul sans flipX, mêmes durées ;
- option H23 : une araignée au pied de la toile de FS1 (x 3600), qui s'incline quand Xara passe à moins de 90 px.

**A1-11. Optionnel (H22).**
- Porteur en `walk_carry`, aller-retour entre x 1240 et 1330 (puits, `bosquet_well` x 1360), pause en idle au puits, `npc.__scripted = true` pendant le trajet. Ne pas aller à gauche de 1216.
- `CUTSCENES.bosquet_porte` : étape `{ npcAnim: { npc: 'garde_porte', anim: 'push' } }` juste avant le `playerMove` de recul.

#### Agent AR : `src/story/acte1_arbre.js`

**AR-1. `arbreGlowPassage`** (≈ l.18-26), selon le contrat 3.3 :
```js
const key = open ? 'item-decor_fente_ouverte' : 'item-decor_fente_fermee';
if (scene.textures.exists(key)) {
  const by = storyStandY(scene, x, y + h / 2) + 2;            // bas de l'amande sur la surface
  const ht = typeof juiceTexture === 'function' ? juiceTexture(scene, 'fx_halo_doux', 'juice-glow') : null;
  const glow = ht ? scene.add.image(x, by - h / 2, ht.key).setBlendMode(Phaser.BlendModes.ADD)
                    .setTint(color).setDisplaySize(h * 0.9, h * 1.1).setAlpha(0.3) : null;
  const core = scene.add.image(x, by, key).setOrigin(0.5, 1).setScale(h / 440);
  // __sx / __sy sur glow et core ; storyPutBehindPlayer (le cœur devant le halo) ;
  // tween d'alpha du halo, 0.3 -> 0.65 en 1000 ms
  return { glow, core, setOpen(v) { core.setTexture(v ? 'item-decor_fente_ouverte' : 'item-decor_fente_fermee'); } };
}
// sinon : les ellipses actuelles, et un setOpen() vide
```
- Pas de `setTint` sur le cœur, sauf si R11 le demande (cyan au monde spirituel).
- Appels inchangés : racines (40, -190, 120, ≈ l.176) et monde spirituel (2840, 390, 120, 0x9fe3ff, ≈ l.332).

**AR-2. `epreuveOuvrirSommet`** (≈ l.440-447).
- **Obligatoire dès AR-1.** l.446 : tweener `scaleX` et `scaleY` depuis `__sx × 0.1` et `__sy × 0.1` vers `__sx` et `__sy` (900 ms, `Back.Out`). Sans ce correctif, l'amande passe de 0,25 à 1, soit 440 px de haut.
- Option H7 : à la fin de `create` (≈ l.647), si `!storyGet('talismanSinge')`, `scene.__sommetFente = arbreGlowPassage(scene, 12256, -186, 110, undefined, false)`. À l'ouverture : `setOpen(true)` et un éclat. La sortie n'est toujours ajoutée qu'à l'ouverture.
- Option H8 : fente côté arrivée en (40, 448) dans l'épreuve et en (48, 448) au monde spirituel, sans dépasser x 48 (lanterne aux lucioles en x 85).

**AR-3. `epreuveCreateCrumbles` / `epreuveUpdateCrumbles`** (≈ l.455-500) :
- image `decor_plateforme_ecorce_intacte`, `setOrigin(0.5, 8 / g.height)`, `setScale((w + 6) / g.width)` ;
- avec la garde `k.g.setTexture` : `_fissuree` au passage en shake (≈ l.478), `_brisee` au passage en gone (≈ l.482), `_intacte` au retour (≈ l.496) ;
- particules (≈ l.486) : `{ fx: ['fx_eclat_ecorce', 'fx_eclat_mousse'] }` ;
- hitbox, délais 600/2600 ms et tween de chute inchangés.

**AR-4. `epreuveCreateTide` / `epreuveDrawTide`** (≈ l.575-605) :
- si la texture existe :
  - `k = (getItemManifest().liquide_mousse_toxique || {}).scale || 0.3`, `crest = 82 × k`, `band = src.height × k` (283) ;
  - `tide.img = tileSprite(t.x, 0, t.w, band, key).setOrigin(0, 0).setTileScale(k, k).setAlpha(0.92)` ;
  - `tide.fill = rectangle(t.x, 0, t.w, 120, textureEdgeColor(scene, key, 'bottom', 0x16280f)).setOrigin(0, 0).setAlpha(0.92)` ;
  - `storyPutBehindPlayer` sur les deux ;
- à chaque image : `img.setY(top - crest)`, `img.tilePositionX = time × 0.02`, `fill.setY(top - crest + band - 1)` ;
- sinon : le Graphics `tide.g` ;
- cycle, timings et test de mort (`p.body.bottom > top + 10`) inchangés.

**AR-5. `arbreMossDecor`** (≈ l.48, appels ≈ l.182-184) :
- sol → `decor_mousse_lumineuse_sol` (s = w / 287), bas en `storyStandY + 2` ;
- `flip` → `decor_mousse_lumineuse_plafond` (s = w / 318), origine (0.5, 0) en y = 302 (dessous visible du toit) ;
- branches (w 50) → `decor_mousse_lumineuse_petite` (0,3) ;
- positions corrigées en section 5.

**AR-6. Lumières et pierres.**
- **`arbreMotes`** (≈ l.29) : `fx_grain_lumiere` teinté, `setScale(2r × 2.6 / 128)`, ADD.
- **`arbreDropRock`** (≈ l.66) **/ `epreuveDropRock`** (≈ l.511) : ombre `fx_ombre_sol` en `setDisplaySize(22, 8)` (ou 24x8), tween relatif (`scaleX` × 3, `scaleY` × 2,2), alpha cible × 1,3, plafonné à 1. Télégraphe et hitbox inchangés.
- **Cime des racines** (≈ l.178) : `fx_rai_lumiere`, origine (0.5, 1) en (3170, -192), `setDisplaySize(120, 240)` (haut en -432, hors caméra), teinte `0xffe9a8`, ADD, alpha de 0,2 à 0,4.
- **Autel du sommet** (beam, ≈ l.634) : `fx_rai_lumiere`, origine (0.5, 1) en (sx, `EPREUVE_SINGE_SOMMET_Y`), 110x300, ADD, alpha de 0,25 à 0,5, `storyPutBehindPlayer`.

**AR-7. Conditionnel (H5).** `decor_autel_sommet` dans `ZONE_SCRIPTS.epreuve_singe.create`, avant le rai :
- origine (0.5, 1), échelle 0,27 ;
- `setVisibleBottomY(a, storyStandY(scene, sx, EPREUVE_SINGE_SOMMET_Y) + GROUND_CONTACT_SINK)` ;
- le lot Zones retire le prop `grand_arbre_autel_singe` de `epreuve_singe_data.js`.

#### Agent A2 : `src/story/acte2.js`

**A2-1. `a2SkyWash`** (≈ l.97) : en tête, si `scene.__farBackground` existe et que sa texture est une image du manifeste (clé `item-…`, pas `decor-plan4`), `return null`. Le voile délavait `fond_foret_flottante` dans la clairière et la hutte, et `st.sky` n'est jamais relu.

**A2-2. `a2DrawRampe`** (≈ l.1316) :
```js
if (scene.textures.exists('item-decor_rampe_lancement')) {
  const img = scene.add.image(x, y, 'item-decor_rampe_lancement').setOrigin(189 / 439, 1)
    .setScale((getItemManifest().decor_rampe_lancement || {}).scale || 0.21);
  setVisibleBottomY(img, y + GROUND_CONTACT_SINK);
  storyPutBehindPlayer(scene, img);
  return;
}
```
La cinématique du crash et le déclencheur ne changent pas.

**A2-3. `a2DrawCrater`** (≈ l.1462) : image `decor_cratere`, origine (0.5, 185 / 280), échelle du manifeste (0,2), `storyPutBehindPlayer`. Pas d'ellipse de bouchage : le creux est dessiné.

**A2-4. `a2DrawSpiralTree`** (≈ l.1477) : image `decor_spirale_gravee` en (x, sy - 150), échelle du manifeste (0,15), `storyPutBehindPlayer`, à la place du tracé (≈ l.1488-1501). Garder le tronc de repli et le halo `a2Glow`.

**A2-5. `a2DrawPlante`** (≈ l.909) **/ `a2PlantePick`** (≈ l.973).
- Dessin :
  - `st.planteGfx` = image `_fleurie` ou `_bouton` (selon `picked`), origine (0.5, 1), échelle 0,2, `setVisibleBottomY(img, y + 3)` ;
  - `st.planteArt = true` et `st.fleur = null` ;
  - cadre `tete` créé une fois : `t.add('tete', 0, 30, 0, 198, 195)` ;
  - halo en y - 72.
- Cueillette :
  - garde (≈ l.975) : `if (!st.fleur && !st.planteArt) return;` (aujourd'hui, la garde ferait sortir la fonction) ;
  - fleur qui vole : image du cadre `tete` en (cfg.x + 1, base - 71), échelle 0,2, tween vers le joueur jusqu'à **0,12** (et non 0,6, valeur absolue qui triplerait l'image) ;
  - dans la même image : `st.planteGfx.setTexture('item-decor_plante_resistante_bouton')` ;
  - durées inchangées.
- **Ne pas** faire voler `fleur_resistante`, qui montre racines et motte.

**A2-6. `a2DrawMossCarpet`** (≈ l.939).
- Tapis : segments de même hauteur de sol, pour chaque segment `tileSprite(x0, sol + 4, x1 - x0, 27, 'item-decor_tapis_mousse').setOrigin(0, 1).setTileScale(0.15).setTilePosition(rnd, 0)`.
  - Sol à 448 : 140-704, 832-978, 1422-1664 et 1856-2240.
  - Sol à 384 : 704-832 et 1664-1856.
  - Arrêt à |x - cx| = radius - 8.
  - **Sans** fondu à 0,65 près du cercle : « La mousse s'arrête net ».
- Cercle (bloc ≈ l.962-969) : `decor_cercle_sain`, origine (0.5, 1) en (cx, yC + 4), `setScale(2 × radius / 1440)`, créé **après** le tapis.
- Colonne de lumière (≈ l.970) : `fx_rai_lumiere`, origine (0.5, 1) en (cx, yC + 6), `setDisplaySize(radius × 1.6, 520)`, teinte `0xfff6d8`, alpha 0,3, ADD, profondeur 2.

**A2-7. `a2MakeMossTufts`** (≈ l.1508) **/ `a2UpdateMossTufts`** (≈ l.1525) :
- `decor_touffe_mousse_{petite, moyenne, grande}` selon i % 3, origine (0.5, 1), échelle 0,18, en (x, `storyStandY(scene, x, 448) + 2`) ;
- renvoyer `{ g, x, phase, size }` ;
- rotation inchangée (pivot au pied) ;
- option : sauter les touffes à moins de 48 px d'un feu de camp (1400, 3700) ;
- variante penchée seulement si H13 = oui.

**A2-8. Bête d'Amanite** (`a2DrawMossBeast` ≈ l.761, `a2AmaniteStrike` ≈ l.784), selon Q7. Niveaux 2 y a déjà mis `mousse_creature`.
- Si la bête dédiée est retenue :
  - première branche : `item-bete_mousse_vivante`, origine (0.5, 1), échelle du manifeste, flipX, `setVisibleBottomY(img, storyStandY(scene, x, y))`, `img.beteArt = true` ;
  - au flash : `_touchee`, puis `_morte` 200 ms plus tard (recaler le bas visible à chaque fois) ;
  - ensuite, tween d'alpha seul, vers 0,85.
- **Dans tous les cas**, corriger le défaut actuel : l'anim de mort de `mousse_creature` est en plus écrasée à 25 % (`scaleY`), ce qui laisse une ligne d'environ 4 px. Ne tweener que l'alpha quand une image ou une anim existe.
- Particules : `fx_motte_mousse` et `fx_eclat_mousse` (option `fx`, ou des images).

**A2-9. Revisite de la forêt flottante 2** (`ZONE_SCRIPTS.acte2_ff2.create`, branche `amaniteMet`, ≈ l.828-834). L'ellipse actuelle est 12 px sous la surface. On montre le dernier état de la bête, dans cet ordre de priorité :
1. `bete_mousse_morte` en flipX, alpha 0,85, bas en `storyStandY(scene, 2070, 384 + GROUND_STAND_SINK)` ;
2. si Q7 garde `mousse_creature` : sa dernière frame de mort (`manifestFrameKey('mousse_creature', 'death', 4)`) ;
3. sinon `decor_mousse_sechee` (0,08) ;
4. sinon l'ellipse, remontée sur la surface.

**A2-10. `a2GeraltComicJump`** (≈ l.287 ; corde et grappin ≈ l.304-321) :
- corde : `tileSprite(0, 0, 3, 8, 'item-objet_corde').setOrigin(0.5, 0).setTileScale(0.15)`. Dans `draw` : position à la main (g.x + 6, g.y - 50), `setSize(3, L)`, `setRotation(Math.atan2(-(tip.x - hx), tip.y - hy))` ;
- grappin : image `objet_grappin`, origine (0.4, 0.1) (l'anneau), échelle du manifeste, `setPosition(tip)`, `setRotation(Angle.Between(main, tip) - Math.PI / 2)`. Plus de `fillCircle` ;
- les deux sont détruits avec `rope` ;
- trajectoire et durées inchangées.

**A2-11. `a2GeraltTechnique`** :
- `'fleche'` (≈ l.557 et ≈ l.566) : image `objet_fleche`, flipX si dir < 0 ; chute avec `angle: 70 × dir` ;
- `'piege'` (≈ l.589-598) : `objet_collet`, origine (0.5, 1), flipX si dir > 0, `setVisibleBottomY(img, d.gy + GROUND_CONTACT_SINK)` ;
- corde du piège (≈ l.603-610) : tileSprite vertical `objet_corde` en (trapX, -10), hauteur `feetY + 10` ;
- repli : les formes actuelles.

**A2-12. `a2GeraltInvocation`** (≈ l.442-501). Niveaux 2 : à revérifier.
- `col.anims.stop()`, puis frames pilotées via `manifestFrameKey('vfx_invocation_clak', 'idle', i)` :
  - frame 0 à l'apparition ;
  - frame 1 à la reprise (≈ l.475) ;
  - frame 2 au flash (≈ l.479) ;
  - frame 3 au début du fondu.
- `col.setFlipX(dir > 0)`, pour que le crabe dessiné regarde comme Clak.
- Relais (H18) : `clak.setPosition(tx, groundY - 80)`, `const s0 = clak.scaleX; clak.setScale(s0 × 1.5)`, puis tween vers s0 pendant la chute de 300 ms.
- Dans `finally` : `clak.setScale(s0)` si défini.
- Échelle de la colonne (0,34), durées, zone de coup et test `pl.body.bottom > groundY - 90` inchangés.

**A2-13. `a2Float`** (≈ l.43) : si `text === '!'` et que `item-ui_alerte` existe, image d'origine (0.5, 1), hauteur `size + 6`, mêmes tweens, profondeur 1060.

**A2-14. `a2UpdateInteract`** (≈ l.136) : `createStoryPromptLabel(scene, { depth: 1050, originY: 1 })` si la fonction existe, sinon le Text.

**A2-15. Halos et bulles.**
- `a2GlowTexture` (≈ l.74) renvoie `item-fx_halo_doux` s'il existe (après M04). Tous ses tweens sont en `displaySize` ou en alpha : sans danger.
- `a2MorgatBrew` (≈ l.1153) : bulles `fx_bulle` teintées, `setScale(2r × 1.2 / 128)`, profondeur 1040.

**A2-16. Revisite de la forêt flottante 1** (`ZONE_SCRIPTS.acte2_ff1.create`, branche `geraltMet`, ≈ l.666-671) : `objet_grappin` couché en (1915, 448), rotation d'environ -80°, au pied de la corniche P1.

**A2-17. Optionnel (H22)** : réplique `mood: 'excited'` de Xara quand on retrouve les bébés cochons, au retour au bosquet.

**A2-18. Repli si Q1 = non** : horizon et îles en tileSprites directement dans `acte2_ff1.create`, `acte2_ff2.create` et `acte2_hutte.create`, avec les valeurs de la section 5.

#### Agent GH : `src/story/boss_ghilt.js`

**GH-1. `ghiltChute`** (≈ l.547).
- Trou (≈ l.583-584) :
  ```js
  const art = scene.textures.exists('item-decor_trou_effondre');
  const hs = (getItemManifest().decor_trou_effondre || {}).scale || 0.14; // ou 0,16 selon R3
  const hole = art
    ? scene.add.image(player.x, gy, 'item-decor_trou_effondre').setOrigin(0.5, 90 / 255).setScale(hs * 0.06).setDepth(player.depth + 1)
    : scene.add.ellipse(player.x, gy - 4, 10, 8, 0x000000).setDepth(player.depth + 1);
  scene.tweens.add({ targets: hole, ...(art ? { scaleX: hs, scaleY: hs } : { displayWidth: 170, displayHeight: 36 }), duration: 300 });
  ```
- Mottes (≈ l.585-591) : `fx_motte_terre` à 14/128.
- Onde (≈ l.575), après M06 : image fixe `vfx_anneau_choc-toxique-2`, ADD, profondeur `boss.depth + 2`. Tween de scale de 60/200 à 1800/200 et d'alpha de 0,75 à 0 en 900 ms. Pas l'anim : sa propre croissance (×7) se cumulerait au tween.
- Timings et `ghBlackout` inchangés.

**GH-2. `ghiltSoin`** (mousse ≈ l.652, `gueri` ≈ l.668, `ghSet` ≈ l.674).
- Mousse qui tombe : `fx_motte_mousse` et `fx_eclat_mousse` en alternance, `setScale(2r × 1.1 / 128)`.
- Option H11, seulement si la texture existe : `decor_cercle_sain` en (bx, by + 3), origine (0.5, 1), `setScale(0.005, 0.22)`, puis `moveBelow(c, gueri)` et tween de `scaleX` vers 0,22 en 1400 ms, sans attente ajoutée.
- Option H16 : deux `mousse_creature_guerie` en `bx ± (gueri.displayWidth / 2 + 40)`, bornées entre 60 et 1284, en `y = ghArenaGroundY(scene, x)`.
  - Apparition en fondu avec un petit bond, puis sautillement pendant la réplique (`_0` et `_1` toutes les 600 ms).
  - À l'arrivée d'Amanite, elles fuient du côté opposé et s'effacent.

**GH-3. `ghiltArenaCalm`** (≈ l.735) :
- 4 `decor_mousse_sechee` (0,09, flipX une sur deux, origine (0.5, 1), bas en gy + 2) en x 280, 440, 1020 et 1170 ;
- option H11 : `decor_cercle_sain` (0,22) sous le corps (`moveBelow(c, body)`) ;
- option H15 : rai `fx_rai_lumiere` en (700, `ghArenaGroundY(scene, 700)`), 260x460, teinte `0xfff6e0`, alpha 0,25, `storyPutBehindPlayer` ;
- option H16 : `mousse_creature_guerie_1` en x 520 et `_0` en x 880.

**GH-4. Halos.**
- `ghGlowTexture` (≈ l.269) renvoie `item-fx_halo_doux` s'il existe (après M04).
- Halo d'Agarica dans le trou : de 240 à environ 300 px.
- `activeGlow` (≈ l.865) → `fx_halo_rayons`.
- Les papillons passent par `Animaux.js` (EN-9), pas par `ghGlow`.

**GH-5. `trouSequence`** (gouttes ≈ l.847) : `fx_goutte_antidote` à 8/128, profondeur `GH_GLOW_DEPTH + 3`.

**GH-6. Optionnel.**
- Réplique `mood: 'excited'` de Xara après le soin (H22).
- Tapis de mousse aspiré pendant le combat (H14).

### 3.9 Lot Zones (agent Z) : `src/data/*_data.js`

Conditions de départ :
- **après** Niveaux 2 et Épreuve du singe (ce dernier tient `epreuve_singe_data.js`) ;
- **après** LK, SK et UI-1 (BootScene).

Tout s'écrit à la main, de façon compatible avec l'éditeur.

**Z-1. `farLayers`** (Q1). Valeurs indicatives, à régler par `--shot` :
- `foret_flottante_1_data.js` : `[{ id: 'couche_horizon_malade', y: 95, scale: 0.45, tint: 0x3c4e44, scrollX: 0.12, scrollY: 0.25, fill: true, fadeInX: [2300, 2900], withSky: true }]`.
  - **Pas** de `couche_iles_lointaines` en ff1 : le fond peint montre déjà les îles.
- `foret_flottante_2_data.js` :
  - `{ id: 'couche_horizon_malade', y: 400, scale: 0.45, tint: 0x3c4e44, scrollX: 0.3, scrollY: 0.3, fill: true, fadeInX: [1400, 2400] }` ;
  - si H4 = oui, en premier : `{ id: 'couche_iles_lointaines', y: 0, scale: 0.4, alpha: 0.6, scrollX: 0.15, scrollY: 0.2 }`.
- `hutte_morgat_data.js` : `[{ id: 'couche_horizon_malade', y: 395, scale: 0.45, tint: 0x3c4e44, scrollX: 0.3, scrollY: 1, fill: true, fadeInX: [1700, 2500] }]`.

**Z-2. `lights`** (Q1 et H15), voir la section 5 :
- bosquet ;
- forêt sombre 1 ;
- trou sombre ;
- retour au bosquet, seulement si le rai du bosquet est retenu.

**Z-3. `ambient.vignette`** : selon H1, `vignette: false` dans les zones qui ne doivent pas l'avoir (monde spirituel, peut-être le bosquet).

**Z-4. `ambientLife.spores: 14`** dans `foret_corrompue_1_data.js`. Pas dans l'arène de Ghil't : la spore y sert de télégraphe.

**Z-5. `liquidFloor`**, seulement si H2 = oui : en ff1, `front: true` et `frontY` d'environ 450 (ou `y` remonté, si LK n'ajoute pas `frontY`). Après la correction de l'encoche (7.3).

**Z-6. `props`** (sections `decor`, `objet` et `rocher` de LK-7) :
- `foret_flottante_1` : 2 `objet_fleche` en (510, 452, `angle: 65`) et (530, 452, `angle: 75`). La pointe est enfoncée, l'empennage part vers la gauche.
- `foret_corrompue_1` :
  - `objet_collet` en (1470, 448) ;
  - `objet_fleche` en (1525, 452, `angle: 70`) ;
  - option H12 : `decor_mousse_lumineuse_plafond` en (980, 239) et (1190, 239, `flipX`), `hang`.
- `bosquet` : option H12, `decor_mousse_lumineuse_tronc` en (≈ 2562, 370), `free`, à caler dans l'éditeur sur le tronc de `bosquet_grand_arbre`.
- `bosquet_retour` : option H12, `decor_mousse_plaque_grattee` en (375, 448) et `decor_mousse_plaque_repoussee` en (1668, 448).
- `grand_arbre_arene` : option H21, `rocher_roulant` en (1640, 448), échelle 0,3.
- `epreuve_singe` : seulement si H5 = échange, retirer le prop `grand_arbre_autel_singe` (≈ l.130), posé ensuite par AR-7.

**Z-7. Rien à changer** pour `checkpoints` (lanternes), `hiddenPlatforms` (contours fantômes), `tides` et `crumble` (pilotés par la donnée).

### 3.10 Réservé : Kainati (agent KA, `src/entities/Kainati.js` et `src/story/boss_kainati.js`)

Ces deux fichiers sont exclus des lots, en attendant Q5. Si Q5 = « usages visuels seulement », voici ce qui est prêt, sans changement de gameplay.

**`Kainati.js`**

- **`KainatiHazards.ceilingRock` / `update`** (≈ l.275) : ombre `fx_ombre_sol` en `setDisplaySize(18 + 46k, 8 + 10k)` au lieu de `setSize`. Alpha (0,2 + 0,35k) × 0,4, car le remplissage actuel n'est qu'à 0,3.
- **`KainatiBoss.growMarker`** (marqueur ≈ l.621) : `fx_marqueur_danger` en **ADD**, `setDisplaySize(40 + 100k, 10 + 14k)`.
- **`KainatiHazards.shockwaves`** (≈ l.280) :
  - **garder le rectangle comme hitbox**, à alpha 0 ;
  - y attacher `h.fx = addManifestSprite(scene, x, floorY, 'vfx_onde_choc', 'idle', { origin: [dir > 0 ? 0.75 : 0.25, 1] })` ;
  - échelle uniforme ≈ 0,3, `setFlipX(dir < 0)`, profondeur `KAINATI_SHADOW_DEPTH + 1`, `play({ key: 'vfx_onde_choc-idle', repeat: -1 })` ;
  - recopier `h.fx.x = h.img.x` dans `update` ;
  - détruire `h.fx` dans `kill`, dans `clear` et à la sortie de l'arène.
- **`KainatiEsprit`** (`this.glow`, ≈ l.848) : `fx_aura_esprit`, `setDisplaySize(w × 1.4, h × 1.2)`, ADD, alpha 0,15-0,2.
- **Constructeur de `KainatiBoss`** (≈ l.356-361) :
  - `alertIcon` → `ui_alerte` (0,133) ;
  - `stunStars` → `ui_etoiles_etourdi` (0,24) ;
  - `update`, case `'stunned'` (≈ l.747) : protéger le `setText` ; pour l'image, flipX toutes les 200 ms et un léger balancement.
- **`setState('stunned')`** (≈ l.414) : `kainati_sol-stunned`. D'abord `ensureManifestAnims(scene, 'kainati_sol')` dans le constructeur, et remettre l'échelle de base avant `play`.
- **`takeHit`** (≈ l.543) : en état stunned, jouer une fois `kainati-hit`, puis revenir à l'étourdissement.
- **`addKainatiStoneImage`** (≈ l.173) : `setScale((2 × KAINATI_STONE_RADIUS + 4) / max(w, h))`, soit 28 px.

**`boss_kainati.js`**

- **`kainatiRevealPassage`** (≈ l.243-263, ellipses ≈ l.255-261) :
  - `arbreGlowPassage(scene, exit.x, exit.y, h, 0xbfe8a0)`, avec `typeof` ;
  - `setDepth(2)` et tween `scaleX/scaleY` ;
  - option H7 : fente fermée dans `create` (≈ l.280) avant la victoire.
- **`kainatiMakeCurtain`** (≈ l.128) : une seule image `mousse_mur` étirée, origine (0.5, 1) en (0, floorY + 4), `setDisplaySize(72, floorY + 30)`, dans le même container. La zone physique ne change pas.
- **`st.talkPrompt`** (≈ l.315) : `createStoryPromptLabel(scene, { depth: 1200, originY: 1 })`.

Si Q5 = refonte « au sol » : c'est un chantier de gameplay séparé (`kainati_sol`, `vfx_vague_mousse`, `rocher_roulant`), hors de ce plan.

### 3.11 Taille des lots

| Agent | Étapes | Taille | Remarque |
|---|---|---|---|
| M | 4 | M | Environ 45 entrées de manifeste, 4 options d'importeur, réimport, documentation en fin de parcours. |
| LK | 11 | L | 3 nouvelles clés, éditeur côté moteur, barre d'énergie. |
| SK | 13 | L | Toute l'interface dessinée de StoryKit, plus vignette, lumières, lanternes. |
| EN | 9 fichiers, environ 25 changements | L | Beaucoup de petits remplacements à repli. |
| UI | 5 | S-M | Surtout l'éditeur. |
| A1 | 11 | L | La mare (3 groupes) et toutes les mousses de l'acte 1. |
| AR | 7 | M | Fentes, marée, écorce, mousses, lumières. |
| A2 | 18 | L | Le plus gros lot d'histoire (6 groupes). |
| GH | 6 | M | |
| Z | 7 | S-M | Données seulement. |
| KA (réservé) | environ 10 | M | Selon Q5. |

---

## 4. Déjà fait par Juice ou Niveaux 2 (à revérifier, pas à refaire)

| Élément | Fichier, fonction | Par | Ce qui reste |
|---|---|---|---|
| Ciel `couche_ciel_jour`, nappes `couche_nappe_nuages`, nuages `couche_nuage_0..4` | LevelKit `addSkyGradient`, `addSkyRevealBackLayers`, `updateSkyReveal`, `zoneBackdropSpec` | Juice | Rien, sauf le `setCrop` de `nuage_4` (LK-2). Le soleil n'est jamais créé, et c'est voulu. |
| Brume `couche_nappe_brume` (ff1, ff2, hutte, monde spirituel) | LevelKit `addLiquidFloor`, `LIQUID_STYLES.brume` | Juice | **Régression.** Partie dense environ 50 px sous `y` : le pied des arbres n'est plus caché, et la couleur sarcelle du monde spirituel est ignorée (LK-1). |
| Lac `liquide_mousse_toxique` (épreuve) | `addLiquidFloor`, style `'mousse'` | Juice | Crête médiane à caler sur `y` (LK-1). |
| Style `'eau'` (`liquide_mare_*`) | `addLiquidFloor` | Juice | Double ligne claire : `y = surfTop - 26·fk` (LK-1). Aucune zone ne s'en sert : la mare de FS2 passe par `acte1Fs2DrawMare` (A1-1). |
| Bulles `vfx_mousse_toxique 'bulle'` | `addLiquidFloor` ≈ l.575 | Juice | Rien côté code, une fois l'import passé en `align 'bottom'` (M1, M3). |
| `addWaterZone` | LevelKit | Juice ? | Habillage facultatif (LK-11). |
| Particules `fx_*` | `FX_PARTICLES`, `spawnFx` | Juice | Tailles, teinte ignorée, `spark` et `dust` (LK-5). |
| Anneau `vfx_anneau_choc` | `juiceShockRing` | Juice | **Bug** : la variante `'talisman'` s'applique à tout (LK-4). |
| Halos (`fx_halo_doux`) | `juiceBurstImage 'glow'`, `addCampfire`, `addAbilityShrine`, `checkpoints` | Juice | Disques pleins : corrigés par l'import (M04), puis tailles à réajuster (LK-6, SK-10). |
| Lucioles `fx_luciole` | `juiceAddAmbientLife` | Juice | Rien (×2,2 déjà appliqué). |
| `fx_halo_objet` des ramassables | StoryKit `pickups` | Juice | Rien (M03 facultatif). |
| Lanternes `decor_lanterne_*` | StoryKit `LEVEL_DATA_HANDLERS.checkpoints`, `updateStoryCheckpoints` | Juice | `lampY` à 0,63, échelle (R1), halo (SK-10). |
| Plateformes `decor_plateforme_fantome` | Piste.js `HiddenPlatform` | Juice | Calage sur la case (EN-1a). |
| `mousse_amas_fissure` | StoryKit `storyMossCrack` | Juice | Rien. |
| `singe_extra` climb | Player `applyVineClimbPose` | Juice | Rien, à l'écran seulement. |
| `singe_extra` throw | Player `drawSkillFormPose` (`'pierre'`) | Juice | Choix de frame (EN-7a). |
| `forme_papillon_extra` cast | Player `drawSkillFormPose` (papillon) | Juice | Échelle 12 % trop petite (EN-7b). |
| Recette `drop` (`fx_goutte_toxique`) | `FX_PARTICLES` | Juice | `spawnToxicDrip` dessine encore l'ellipse (EN-3a). |
| Recette `melt` (`fx_bulle`) | StoryKit `openMossWall` | Juice | Cercles en double à retirer (SK-12). |
| Feuilles (`spawnVineGrabPuff`), `wingDust` du dash | Player | Juice | Rien. |
| `purifyCorruptedEnemy` | MousseCreature | Juice | `vfx_purification` et tween relatif (EN-3b). |
| `ui_feu_camp` | `CampfireMenuScene.buildPanel` | Juice | Rien : `CAMPFIRE_SAFE` tombe sur les planches. |
| `geralt_invocation` | acte2 `a2GeraltInvocation` | Niveaux 2 | Rien (échelle 0,325 facultative). |
| `vfx_invocation_clak` | acte2 `a2GeraltInvocation` | Niveaux 2 | Frames pilotées, flipX, relais (A2-12, H18). |
| Bête d'Amanite en `mousse_creature` | acte2 `a2DrawMossBeast`, `a2AmaniteStrike` | Niveaux 2 | Choix d'art (Q7) ; écrasement de l'anim de mort à corriger dans tous les cas (A2-8). |
| Arche `foret_sombre_racine_arche` | `foret_sombre_2_data.js` | Niveaux 2 | `decor_marches_racines` n'a plus de cible (H6). |
| Retrait des îles, horizon et voile dessinés (T11, T12, W2, `a2Ff2Decor`) | acte2.js | Niveaux 2 | `farLayers` les remplace (Q1, Z-1). |
| Lueur de l'invocation (`a2Glow`) | acte2 ≈ l.469 | Niveaux 2 | Suit `a2GlowTexture` (A2-15). |

---

## 5. Placements par zone

Couches :
- **arrière** : `storyPutBehindPlayer`, ou une profondeur inférieure à `CHARACTER_DEPTH` (10) ;
- **script** : posé par la fonction indiquée (lot Histoire) ;
- **data** : posé dans `src/data/<zone>_data.js` (lot Zones).

Les x et y sont indicatifs, à régler sur capture. *Option* = à valider (questions de la section 8).

| Zone | id | x / y | Couche, source | Raison |
|---|---|---|---|---|
| bosquet | decor_mousse_plaque_intacte → _grattee → _repoussee | 1930, 2050 et 2170 / 448 | arrière, script `acte1MossPatch` (`BOSQUET_PATCH_XS`) | Les 3 plaques à gratter du chemin de la source ; celle de 2050 repousse. |
| bosquet | fx_halo_doux | idole | arrière, script `st.idolGlow` | Halo de l'idole (90 px, `0x8fe3b8`). |
| bosquet | fx_rai_lumiere | 3424 / **320** (130x380, `0xd8ecff`, 0,25) | arrière, data `lights`, `forbids: { idoleVolee: true }` (H15) | Clair de lune sur l'idole. On marche sur la marche de l'autel (y 320) : un rai posé à 448 traverserait deux rangées de tuiles. |
| bosquet | decor_mousse_lumineuse_tronc | ≈ 2562 / 370 | arrière, data `props` `free` (option H12) | « Elle s'étend sur les troncs. » |
| bosquet | habitant_porteur (walk_carry), habitant_garde (push) | 1240 ↔ 1330 ; porte de l'est | script A1-11 (option H22) | Anims jamais jouées. |
| bosquet_retour | decor_mousse_plaque_grattee | 375 / 448 | arrière, data `props` (option H12) | « Vous grattiez la mousse », entre le lampadaire et la palissade. |
| bosquet_retour | decor_mousse_plaque_repoussee | 1668 / 448 | arrière, data `props` (option H12) | « Elle reviendra », entre l'autel et le lampadaire. |
| bosquet_retour | fx_rai_lumiere | 1560 / 448 (130x380, `0xfff2d8`, 0,22) | arrière, data `lights` (H15) | L'aube sur l'autel, en écho à l'ouverture. Seulement si le rai du bosquet est retenu. |
| foret_sombre_1 | fx_rai_lumiere | 1344 / 384 (110x**420**, `0xbfe8ff`, 0,22) | arrière, data `lights` (H15) | La souche de la rencontre avec Xara. Avec 420 de haut, le haut net du rai sort de l'écran. |
| foret_sombre_1 | araignee_petite_0..2 | xara.x - 50 / sol | arrière, script `acte1Fs1LittleSpider` | La révérence de la rencontre. |
| foret_sombre_1 | araignee_petite_0..2 | 3600 / 448 | arrière, script (option H23) | La toile a une propriétaire. |
| foret_sombre_1 | decor_mousse_lumineuse_tronc | 2672 / 192 (flipX) ; 2832 / 192 | arrière, script `acte1DrawMossDecor` | Collées aux faces exposées du mur de racines (x 2688 et 2816). |
| foret_sombre_1 | decor_mousse_lumineuse_plafond | 2730 / 254 | arrière, script | Dessous du mur, au-dessus de l'amas. |
| foret_sombre_1 | decor_mousse_lumineuse_sol | 2925, 3150 et 3420 / 448 | arrière, script | « La mousse est partout. » 2925 évite la souche aux champignons. |
| foret_sombre_1 | decor_mousse_lumineuse_petite | 664, 1900 et 3775 / 448 | arrière, script | 664 évite le bord du tronc couché ; 3775 évite les champignons lumineux. |
| foret_sombre_2 | decor_empreinte_boue | de 300 à 1120 tous les 46 px (14 empreintes) / sol réel + 2 | arrière, script `acte1Fs2DrawMudPrints` | Sentier de chasse. Le déclencheur est en x 380. |
| foret_sombre_2 | decor_plateforme_fantome | gx 46 w 3 et gx 51 w 2, gy 6 | ADD, data `hiddenPlatforms` (inchangé) | Plateformes du loup. |
| foret_sombre_2 | liquide_mare_fond / _voile | 3520 / 452, w 256 | profondeurs 3 et 5, script `acte1Fs2DrawMare` | Mare aux trois poissons, qui nagent entre les deux couches (4). |
| foret_sombre_2 | liquide_mare_surface_0..3 | 3520 / 452 + 8 - 26k | profondeur 5, script | La ligne claire passe juste sous le tronc. |
| foret_sombre_2 | decor_mare_berge | 3534 et 3762 (flipX) / 462 | profondeur 4.5, script | Pierres de la rive ; le pont cache le côté eau. |
| foret_sombre_2 | decor_mare_roseaux | 3526 et 3770 (flipX) / 457 | profondeur **6.5**, script | Devant le pont : placés derrière, ils seraient cachés à 80 %. |
| foret_sombre_2 | decor_pont_tronc | 3648 / 446 | profondeur 6, script | Remplace le tronc dessiné. |
| foret_sombre_2 | decor_fleur_perchee (H9) et fx_halo_doux | 3616 / 64 | arrière, script `acte1Fs2DrawPlante` | La plante qui repousse la mousse, hors d'atteinte. |
| foret_sombre_2 | decor_cercle_sain | 3616 / 66 (0,1) | arrière, script (option H12) | Herbe saine sous la fleur. |
| foret_sombre_2 | objet_graine_coeur et fx_halo_doux | 4700 / 400 | arrière, script `acte1Fs2DrawCoeur` | Poche secrète. |
| foret_sombre_2 | decor_mousse_lumineuse_plafond | 4280 / 254 | arrière, script | Sous le surplomb, contre le mur de mousse. Remplace la tache (4300, 140), qui flottait. |
| foret_sombre_2 | decor_mousse_lumineuse_sol | 4900 / 192 (refY 192) ; 1700, 2440 et 5500 / 448 | arrière, script | Remplace (4900, 130), qui flottait. 2440 évite le buisson épineux. Jamais dans la poche secrète. |
| foret_sombre_2 | fx_rai_lumiere (rose) | 5090 / 448 (90x200) | arrière, script `acte1Fs2DrawSentier` | Le vieux sentier ; le haut est caché sous le surplomb. |
| grand_arbre_racines | decor_fente_ouverte | 40 / -128 | arrière, script `arbreGlowPassage` | Passage vers l'épreuve, au bout des lianes. |
| grand_arbre_racines | decor_mousse_lumineuse_sol | 330, 560, 900 et 1110 / 448 | arrière, script `arbreMossDecor` | La mousse remonte le tunnel ; 330 et 1110 évitent l'écorce et les pierres. |
| grand_arbre_racines | decor_mousse_lumineuse_plafond | 500, 760 et 1120 / 302 | arrière, script | Plafond du tunnel. |
| grand_arbre_racines | decor_mousse_lumineuse_petite | 1530 / 64 ; 1950 / **-64** ; 2420 et 2900 / -192 | arrière, script | Le tronc dessiné a été retiré : le point 1950 passe sur la branche intermédiaire. |
| grand_arbre_racines | fx_rai_lumiere | 3170 / -192 (bas), 120x240 | arrière, script (cime) | Lumière de la cime ; le haut net est hors caméra. |
| grand_arbre_arene (réservé KA) | decor_fente_ouverte (fermée en option H7) | 1728 / 256 | profondeur 2, `kainatiRevealPassage` | Passage du totem du singe, sur la branche haute. |
| grand_arbre_arene (réservé KA) | mousse_mur | 512 et 1472 / 448 | profondeur 4, `kainatiMakeCurtain` | Rideaux de l'arène. |
| grand_arbre_arene | rocher_roulant | 1640 / 448 (0,3) | arrière, data `props` (option H21) | Au pied du passage du totem : sa spirale reprend le motif simien. Visible après la victoire. |
| monde_spirituel | decor_fente_ouverte | 2840 / 448, halo `0x9fe3ff` | arrière, script | Retour derrière l'arbre spirituel. |
| monde_spirituel | decor_fente_ouverte | 48 / 448 | arrière, script (option H8) | Repère de la sortie gauche ; pas au-delà de x 48. |
| monde_spirituel | couche_nappe_brume | `liquidFloor` y 486, color `0x1d4a5a` | Juice, corrigé par LK-1 | Brume sarcelle retrouvée par la teinte. |
| epreuve_singe | liquide_mousse_toxique (lac) | `liquidFloor` y 476 | Juice, corrigé par LK-1 | Crête médiane calée sur y. |
| epreuve_singe | liquide_mousse_toxique (marée) | `tides[0]` x 8832, w 384, top de 500 à 270 | arrière, script `epreuveCreateTide` | Marée du passage bas. |
| epreuve_singe | decor_plateforme_ecorce_* | crumble (10944, 96), w 128 | arrière, script | Branche qui s'effrite (section 5 de l'épreuve). |
| epreuve_singe | decor_fente_ouverte (fermée en option H7) | 12256 / -128 | arrière, script `epreuveOuvrirSommet` | Raccourci vers les racines. |
| epreuve_singe | decor_fente_ouverte | 40 / 448 | arrière, script (option H8) | Côté épreuve de la fente des racines. |
| epreuve_singe | fx_rai_lumiere | 12088 / sommet (110x300) | arrière, script | Colonne de lumière de l'autel. |
| epreuve_singe | decor_autel_sommet | 12088 / -128 (0,27) | arrière, script AR-7 (option H5) | Échange avec `grand_arbre_autel_singe`, même emprise. |
| foret_flottante_1 | couche_horizon_malade | y 95 ; 0,45 ; teinte `0x3c4e44` ; parallaxe 0,12 / 0,25 ; fill ; fondu de x 2300 à 2900 ; withSky | data `farLayers` (Q1, Q3) | Cinématique `ff1_vue` : « cette forêt presque noire ». Le fond peint ne la montre pas. |
| foret_flottante_1 | couche_brume_avant | front, y ≈ 450 | data `liquidFloor` (option H2, après 7.3) | Brume de premier plan au bas de l'écran. |
| foret_flottante_1 | objet_fleche (×2) | 510 et 530 / 452, angles 65 et 75 | arrière, data `props` (section `objet`) | Tirs d'entraînement de Geralt, à gauche de son panneau. |
| foret_flottante_1 | objet_grappin | 1915 / 448, angle ≈ -80° | arrière, script `acte2_ff1.create` (`geraltMet`) | Le « Plan B » retombé au pied de la corniche. |
| foret_flottante_2 | couche_iles_lointaines | y 0 ; 0,4 ; alpha 0,6 ; parallaxe 0,15 / 0,2 | data `farLayers` (option H4) | Les îles des anciens gardiens, petites et translucides. |
| foret_flottante_2 | couche_horizon_malade | y 400 ; 0,45 ; teinte ; parallaxe 0,3 / 0,3 ; fill ; fondu de x 1400 à 2400 | data `farLayers` | Présage de la forêt malade, à l'est. |
| foret_flottante_2 | bete_mousse_vivante → _touchee → _morte | 2070 / 384 | arrière, script `a2DrawMossBeast`, `a2AmaniteStrike` (Q7) | Le coup d'Amanite. |
| foret_flottante_2 | bete_mousse_morte (ou décor de repli) | 2070 / 384 | arrière, script `acte2_ff2.create` (`amaniteMet`) | La trace reste à la revisite (A2-9). |
| clairiere_plante | decor_tapis_mousse | de 140 à 2240, par segments | arrière, script `a2DrawMossCarpet` | Tapis toxique ; arrêt net au cercle. |
| clairiere_plante | decor_cercle_sain | 1200 / 452 (0,32) | arrière, script | « La mousse s'arrête net, en cercle. » |
| clairiere_plante | decor_plante_resistante_fleurie / _bouton | 1200 / 448 (0,2) | arrière, script `a2DrawPlante` | La plante ; le bouton après la cueillette. |
| clairiere_plante | fx_rai_lumiere | cx / yC + 6 (radius × 1,6 x 520) | profondeur 2, script | Colonne de lumière sur la plante. |
| hutte_morgat | couche_horizon_malade | y 395 ; 0,45 ; teinte ; parallaxe 0,3 / 1 ; fill ; fondu de x 1700 à 2500 | data `farLayers` | Le vide au-dessus de la forêt malade, terrain du vol raté. |
| hutte_morgat | decor_rampe_lancement | 2688 / 256 | arrière, script `a2DrawRampe` | Rampe d'envol au bord de la falaise. |
| foret_corrompue_1 | decor_cratere | 170 / 448 | arrière, script `a2DrawCrater` | Cratère du crash où Agarica se réveille. |
| foret_corrompue_1 | decor_touffe_mousse_* | 18 touffes de 300 à 3867 | arrière, script `a2MakeMossTufts` | Touffes vivantes ; option : retirer celle de 3717, collée au feu. |
| foret_corrompue_1 | decor_mousse_lumineuse_plafond | 980 et 1190 (flipX) / 239 | arrière, data `props` `hang` (option H12) | Voûte de la galerie de mousse. |
| foret_corrompue_1 | objet_collet | 1470 / 448 | arrière, data `props` | Campement abandonné de Geralt, près de la note (1600). |
| foret_corrompue_1 | objet_fleche | 1525 / 452, angle 70 | arrière, data `props` | « Si tu lis ceci, c'est que je suis passé par là. » |
| foret_corrompue_1 | decor_spirale_gravee | 2470 / 368 | arrière, script `a2DrawSpiralTree` | La spirale que Xara reconnaît. |
| foret_corrompue_1 | fx_spore_toxique | `ambientLife.spores: 14` | ambiance, data | Cœur de la corruption. |
| foret_corrompue_1 | bete_mousse_morte | ≈ 3800 / 448 | arrière (option H17) | Trace du passage d'Amanite, avant l'arène. |
| arene_ghilt | decor_trou_effondre | x du joueur / `ghArenaGroundY` | `player.depth + 1`, script `ghiltChute` | Effondrement (défaite imposée). |
| arene_ghilt | vfx_anneau_choc (toxique) et fx_motte_terre | x du boss | script `ghiltChute` | Onde et mottes de l'effondrement. |
| arene_ghilt | decor_cercle_sain | x du corps (700 dans l'arène calme) / sol + 3 (0,22) | sous le corps, script `ghiltSoin` et `ghiltArenaCalm` (option H11) | La mousse s'est retirée de Ghil't. |
| arene_ghilt | mousse_creature_guerie_0 / _1 | bx ± (w/2 + 40) ; puis 520 et 880 / sol | arrière, script (option H16) | Seul endroit où l'art guéri se voit en partie normale. |
| arene_ghilt | decor_mousse_sechee | 280, 440, 1020 et 1170 / gy + 2 | arrière, script `ghiltArenaCalm` | L'arène apaisée. |
| arene_ghilt | fx_rai_lumiere | 700 / `ghArenaGroundY(scene, 700)` (260x460) | arrière, script `ghiltArenaCalm` (H15) | La paix est revenue. |
| trou_sombre | fx_rai_lumiere | 200 / 448 (150x470, `0xcfd8ff`, 0,16) | `aboveAmbient` (950), data `lights` (H15) | Filet de lumière qui tombe du sol effondré ; il doit passer au-dessus du voile (darkness 0,85). |
| 9 zones avec `ambient` | couche_vignette | plein écran | 999,5, MULTIPLY, StoryKit `ambient` (H1) | Zones : bosquet, FS1, FS2, racines, monde spirituel, épreuve, forêt corrompue 1, arène de Ghil't, trou sombre. Force de 0,42 (bosquet) à 0,85 (trou sombre). |
| 14 lanternes (épreuve ×5, ff1 ×3, ff2 ×3, monde spirituel ×3) | decor_lanterne_* | `checkpoints` | data (inchangé), Juice | Rien à poser à la main. |

---

## 6. Corrections du manifeste (`src/data/asset_manifest.js`, agent M)

| id | Actuel | Nouveau | Condition |
|---|---|---|---|
| liquide_mare_surface_0..3 | placeholder h 10 | h 21 | Cosmétique |
| couche_vignette | commentaire « teintée par setTint à la couleur d'ambiance » (≈ l.1518-1520) | « plein écran en MULTIPLY, NON teintée (alpha = force), profondeur 999,5 » | **Obligatoire** |
| couche_ciel_jour, couche_iles_lointaines, couche_horizon_malade | — | Inchangés : échelle et teinte sont portées par `farLayers` | |
| decor_lanterne_eteinte / _allumee | scale 0.09, placeholder 18x30 (≈ l.1269-1280) | 0.15 (ou 0.12), placeholder 30x51 | R1 |
| decor_plateforme_fantome | commentaire « 192x64 ; setDisplaySize » | « contour (tirets) x 1-378, y 26-132 du PNG ; calé par le code sur la case » | |
| decor_plateforme_ecorce_intacte / _fissuree / _brisee | scale 0.21 | 0.29, placeholder 128x22, commentaire « dessus de mousse à y = 8/104 » | |
| decor_autel_sommet | scale 0.14, commentaire « autel du sommet » (≈ l.1305-1308) | 0.27 si échangé, sinon commentaire « non utilisé » | H5 |
| decor_pont_tronc | commentaire | « affiché en setDisplaySize(w+44, 26) ; dessus du fût à y = 34/90 » (scale 0.205 gardée) | R2 |
| decor_empreinte_boue | scale 0.05, placeholder 13x10 | 0.08, placeholder 21x12, commentaire « vue de dessus, à écraser en Y (flatY 0,5) » | R4 |
| decor_mousse_plaque_* (×3) | scale 0.2 | 0.216 (70 px, la largeur de grattage) | Option |
| decor_plante_resistante_* et bloc mare et plantes (≈ l.1380-1384) | « la fleur cueillie qui vole = fleur_resistante » | « la fleur qui vole = cadre 'tete' (30, 0, 198x195) de decor_plante_resistante_fleurie » | Après intégration |
| vfx_mousse_toxique | align `"center"` | `"bottom"`, puis `--force --only` | **Obligatoire** (M01) |
| vfx_anneau_choc | align `"center"` | `"ring"` (nouvelle option), canevas 317x341 | Q2 (M06) |
| fx_halo_doux | norm actuelle | `pad: 12, falloff: 1.0` | Q2 (M04), priorité haute |
| fx_halo_rayons | norm actuelle | `pad: 12, falloff: 0.9` | Q2 (M04) |
| fx_lueur_sol | norm actuelle | `cropTop: 20, desaturate: true` | Q2 (M05) |
| fx_halo_objet, fx_aura_esprit, fx_rai_lumiere, fx_lueur_sol | rognage à alpha > 10 | `trimAlpha: 0` | Facultatif (M03) |
| fx_luciole / fx_grain_lumiere / fx_braise / fx_etincelle_papillon / fx_eclat_pierre | 0.06 / 0.05 / 0.06 / 0.07 / 0.05 | 0.11 / 0.15 / 0.09 / 0.13 / 0.07 | Documentaire : aucun `addItemImage` ne lit ces échelles (M02) |
| bete_mousse_vivante / _touchee / _morte | 0.21 | 0.25 | Q7 = bête dédiée |
| mousse_creature_guerie_0 / _1 | 0.15 | 0.2 | R5 |
| geralt_invocation (hors bloc) | 0.3 | 0.325 | Facultatif, avec l'accord de Niveaux 2 |
| fx_fil_soie | scale 0.15, placeholder w 2 | 0.25, w 3 | |
| ui_bulle | nineSlice 48/48/48/48, scale 0.25 | `{ left: 74, right: 74, top: 60, bottom: 60 }`, 0.2 | |
| ui_bulle_pointe | 0.25 | 0.26 | |
| ui_invite | nineSlice 70/70/60/60, scale 0.2, placeholder h 32 | `{ 105, 105, 0, 0 }`, 0.15, h 24 | |
| ui_banniere | nineSlice 70/70/50/50, scale 0.64, h 104 | `{ 115, 115, 76, 78 }`, 0.65, h 128 | R6 |
| ui_touche | pas de nineSlice | `{ 90, 90, 0, 0 }` | |
| ui_alerte | 0.1 | Inchangé (échelle passée à l'appel) | |
| ui_ornement_titre | 0.6, placeholder 288x66 | 0.5, placeholder 186x55 | |
| ui_energie_cadre | nineSlice 60/60, scale 0.111, placeholder 150x10 | `{ 290, 290, 0, 0 }`, 0.25, placeholder 150x22 | Q6 |
| ui_energie_remplissage | scale 0.11 | commentaire « affiché dans la rainure 114x7 », placeholder 114x7 | Q6 |
| ui_boss_cadre | nineSlice 60/60, scale 0.32, placeholder 448x20 | `{ 250, 250, 0, 0 }`, 0.5, placeholder 448x32 | Q6 |
| ui_boss_remplissage | scale 0.32 | commentaire « rainure 378x8 », placeholder 378x8 | Q6 |
| ui_feu_camp | scale 0.65, placeholder 950x534 | 0.5, placeholder 727x540 (documentaire) | **Jamais `--force`** |
| commentaire du bloc ITEM du lot 8 (≈ l.1137-1141) | « Rien n'est encore branché » | état réel | Phase 5 (M4) |

---

## 7. Images à retoucher ou à refaire (consignes prêtes à coller)

Aucune image n'exige une régénération complète. Ordre de priorité : 7.1, 7.2, puis le reste.

### 7.1 `liquide_mousse_toxique` : raccord en fondu (priorité haute)

```
Retouche locale de assets/_codex_src/liquide_mousse_toxique.png, SANS régénérer.
Problème : le raccord gauche/droite a été fait par fondu enchaîné. Sur environ 80 px de part
et d'autre du bord, les volutes du corps sont dédoublées en transparence : à l'écran (échelle 0,3),
une colonne « fantôme » d'environ 25 px tous les 461 px. Une petite encoche d'alpha marque aussi
la crête au raccord (rangées 96 à 100 de l'image finale). Le contrôle Δ=0 aux bords ne voit pas ce défaut.
1. Décaler l'image de 768 px en largeur (numpy.roll) pour amener le raccord au milieu.
2. Redessiner À LA MAIN la zone du milieu : volutes continues, aplats mats, même palette poison,
   AUCUN mélange alpha entre deux copies. Boucher l'encoche de la crête.
3. Remettre en place (décalage inverse de 768 px). Ne pas modifier le reste de la crête bosselée.
4. python tools/import_codex_assets.py --force --only liquide_mousse_toxique
5. Contrôle À L'ŒIL d'un montage de 3 copies côte à côte, à l'échelle 0,3 : aucune volute fantôme.
```

### 7.2 `note_geralt` et `objet_grappin` : nouvelle extraction (priorité moyenne)

```
NE PAS régénérer. Le dessin brut docs/production/controles/lot_8/23_generation_brute.png est complet.
Dans le brut, ces deux dessins DÉPASSENT la limite de la rangée 0 (y = 512) de 20 à 25 px.
L'extraction s'est arrêtée au bord de la cellule et a coupé le bas :
- note_geralt (boîte actuelle [199,81,568,431] dans suivi.json) : la pointe du coin replié du bas
  est tranchée à l'horizontale, sans contour ;
- objet_grappin (boîte [952,103,1352,408]) : la pointe de la tige est coupée à plat.
1. Réextraire ces deux dessins avec une boîte qui FRANCHIT y = 512, jusqu'à y ≈ 550
   (le contenu de la rangée 1 du brut ne commence que vers y ≈ 630).
2. Détourer sans halo sombre (le brut a un fond sombre avec une lueur chaude).
3. Poser chaque résultat dans sa cellule (768x512) de assets/_codex_src/objets_C.png :
   cellule 1 pour la note, cellule 2 pour le grappin. Réduire si nécessaire,
   avec au moins 30 px de marge transparente.
4. python tools/import_codex_assets.py --force --only note_geralt objet_grappin
5. Contrôle : la rangée la plus basse de chaque image a un contour noir continu ;
   aperçu de la note à 80 px (fiche d'inventaire).
```

### 7.3 `couche_brume_avant` : encoche au raccord (basse ; obligatoire si H2 = oui)

```
Planche assets/_codex_src/couche_nappes.png, bande 3 (couche_brume_avant).
Défaut : au raccord (colonnes ~1530-1535 et 0-5 de l'image finale), sur les rangées 48 à 83, juste
sous la crête, une encoche verticale à demi transparente (alpha ~128 au lieu de ~250).
1. Décaler la bande d'une demi-largeur, boucher l'encoche par retouche SANS fondu, remettre en place.
2. python tools/import_codex_assets.py --force --only couche_brume_avant
3. Contrôle : montage de 2 copies sur fond clair, sans zone translucide au raccord.
```

### 7.4 `couche_nuage_4` et `couche_nuage_3` (basse)

```
Planche assets/_codex_src/couche_nuages.png :
- cellule 4 (couche_nuage_4) : effacer le fragment de traîne détaché à gauche
  (colonnes 0 à 24 de l'image finale, bord tranché, alpha 248 ; colonnes 25 à 66 vides) ;
- cellule 3 (couche_nuage_3) : la traîne basse de droite est coupée net (8 px à alpha > 200 sur la
  dernière colonne) ; l'effiler vers la transparence SANS dépasser 452 px de large.
Puis : python tools/import_codex_assets.py --force --only couche_nuage_3 couche_nuage_4
En attendant, le code rogne nuage_4 (setCrop(66, …)) ; nuage_3 est toléré.
```

### 7.5 `couche_nappe_nuages` (très basse)

```
Planche assets/_codex_src/couche_nappes.png, bande 1 : au raccord, boucher le petit trou dans le corps
du nuage (rangées 128 à 137, environ 10 px de large) et effacer le trait vertical clair au-dessus.
Retouche sans fondu, puis --force --only couche_nappe_nuages.
```

### 7.6 `couche_iles_lointaines` (facultatif)

```
Facultatif : en jeu, l'alpha (0,6) et une petite échelle (0,4) suffisent.
Si l'image est reprise : refaire le raccord à la main, sans fondu (rangées 189 à 322 : une île à demi
transparente chevauche une petite île opaque), et désaturer vers le lointain bleuté (#6f8fb0 à #9ab4cc).
Tuilable, 1536 px de large. Puis --force --only couche_iles_lointaines.
```

### 7.7 Seulement selon la réponse de l'utilisateur

- **Q3 = version peinte par Codex** (`couche_horizon_malade`) :
  ```
  Régénérer la bande 1 de assets/_codex_src/couche_lointains.png en style [COUCHE] :
  silhouette de forêt vert très sombre (#1f3a1a), halo toxique doux, CIEL TRANSPARENT au-dessus
  des cimes, bas opaque, tuilable horizontalement, 1536 px de large, sans contour, peu saturé.
  Autre solution : reprendre la cellule 1 de
  docs/production/controles/retouches_poison_2026-10-23/avant/assets/_codex_src/couche_lointains.png
  et refaire son alpha : brume au-dessus des cimes convertie en dégradé d'alpha jusqu'à 0 en haut.
  (Telle quelle, cette version est opaque dès sa 10e rangée : une boîte sombre sur le ciel de jour.)
  Puis --force --only couche_horizon_malade.
  ```
- **Q2 = non** (pas de retouche mécanique à l'import) :
  ```
  Régénérer dans assets/_codex_src/halos_lumiere.png :
  - fx_halo_doux : dégradé radial blanc CONTINU du centre jusqu'à alpha 0 au bord, sans plateau,
    marge transparente de 12 px ;
  - fx_halo_rayons : même dégradé, rayons doux, sans silhouette octogonale ;
  - fx_lueur_sol : une seule flaque elliptique BLANCHE (teintable), sans seconde ellipse au-dessus.
  Et dans assets/vfx/vfx_anneau_choc.png : l'ANNEAU centré dans chaque cellule (le centre du
  cercle, pas la boîte anneau + débris), dans les deux rangées.
  ```
- **Q4 = (b)** :
  ```
  Ajouter à assets/vfx/vfx_anneau_choc.png une 3e rangée de 4 frames : anneau « neutre » BLANC,
  teintable, sans feuilles ni mottes, centré sur le canevas, même progression que les deux rangées existantes.
  ```
- **Q6 = régénérer** :
  ```
  Dans assets/_codex_src/ui_barres.png, régénérer seulement :
  - bande 0 (ui_energie_cadre) : mêmes bouts de lianes et feuilles ; rainure intérieure violette #2a1f45
    d'au moins 50 % de la hauteur du cadre, droite et de hauteur constante ; bouts de 75 px au plus
    avant la rainure ; fond transparent ;
  - bande 2 (ui_boss_cadre) : même bois à épines, liseré rose, roses et feuilles aux bouts ; rainure
    d'au moins 45 % de la hauteur, de hauteur constante ; PAS de feuilles le long de la partie centrale.
  Ne pas toucher aux bandes 1 et 3.
  ```

---

## 8. Questions pour l'utilisateur

### 8.1 À trancher avant de lancer les lots

1. **Q1. Nouvelles clés de zone et décors posables.** Faut-il ajouter au contrat les clés `farLayers` (îles et horizon), `lights` (rais, flaques, halos) et `ambient.vignette` ? Avec elles viendraient les clés de props `flipX`, `angle`, `hang`, `free`, `flatY` et `front`, et les sections d'éditeur `decor`, `objet` et `rocher`, chargées depuis le manifeste. *Recommandé : oui.* Sinon, tout passe en dur dans les scripts d'histoire, et rien n'est posable dans l'éditeur.
2. **Q2. Retouches mécaniques à l'import.** Il s'agit du dégradé radial des deux halos, de la flaque rognée et désaturée, de l'anneau recentré et, en option, de la traîne alpha des grandes lueurs. *Recommandé : oui.* Sinon, il faut faire régénérer 4 images par Codex (7.7).
3. **Q3. Horizon malade.** Garder la version « poison » actuelle assombrie par le code (teinte ≈ 0x3c4e44, échelle 0,45), qui donne la « forêt presque noire » du dialogue (*recommandé*) ? Ou commander une version peinte (7.7) ? L'ancienne version peinte n'est pas réutilisable telle quelle.
4. **Q4. Anneau de choc.** Aujourd'hui, l'anneau ambre du talisman sort pour tous les effets. (a) L'art seulement pour le talisman et le toxique, un anneau dessiné et teinté ailleurs (*recommandé*). (b) Commander une 3e rangée neutre et teintable.
5. **Q5. Kainati.** Faire la refonte « au sol » (`kainati_sol`, `vfx_vague_mousse`, `rocher_roulant` : cela change le gameplay) ? Ou seulement les usages visuels de la section 3.10 (ombre, marqueur, ondes sur la hitbox actuelle, aura, icônes, pose sonnée, anim de coup, rideaux, fente) ? Jusque-là, `Kainati.js` et `boss_kainati.js` restent réservés.
6. **Q6. Barres d'énergie et de boss.** Les afficher plus grandes pour que le remplissage reste lisible : énergie en 150x22 au lieu de 150x10, boss en 448x32 au lieu de 448x20 ? Ou faire régénérer des cadres à rainure plus épaisse ?
7. **Q7. Bête d'Amanite (forêt flottante 2).** Pendant l'audit, Niveaux 2 y a mis l'art de l'ennemi `mousse_creature`. Le lot 8 a livré une bête dédiée en 3 états, un animal moussu « innocent » qui rend le geste plus cruel. Laquelle garde-t-on ? *Recommandé : la bête dédiée, avec `mousse_creature` en repli.*
8. **Q8. Souffle de Ghil't.** Pour couvrir la vraie zone de dégâts (330 px), l'image doit être agrandie environ 2,2 fois et un peu déformée. Le triangle vert translucide, qui sert de repère, disparaîtrait. D'accord, ou faut-il garder un léger triangle sous l'image ?

### 8.2 Réglages (une réponse courte suffit)

9. **R1. Lanternes de reprise** : 0,09 (18x31, globe illisible), 0,12 (24x41) ou 0,15 (30x51, *recommandé*) ? Planche : `a_lanternes.png`.
10. **R2. Pont en tronc (FS2)** : étiré en 300x26 (*recommandé*, il se lit comme un tronc) ou aux proportions exactes 294x18 (il ressemble à une branche) ? Planche : `i_pont.png`.
11. **R3. Trou d'effondrement (Ghil't)** : 0,14, la même emprise que l'ancienne ellipse, ou 0,16, plus lisible pendant le flash ?
12. **R4. Empreintes de loup** : 21x6 px, écrasées pour une vue rasante (*recommandé*), au lieu de 13x8 debout ?
13. **R5. Créatures de mousse guéries** : 0,2 (34x36, aussi hautes que la créature corrompue), ou plus grosses ?
14. **R6. Bannière « objet obtenu »** : 128 px de haut au lieu de 104, avec une icône de 46 px dans l'anneau peint ?
15. **R7. Invites des feux et des totems** : reformuler en « E : te reposer » et « E : se recueillir », pour qu'elles prennent la touche peinte ?
16. **R8. Écran Contrôles** : remplacer les touches violettes dessinées par des touches en bois clair peintes, à lettre sombre ?
17. **R9. Scintillement des petites particules** : normaliser les particules à 48 px, faire des copies réduites au chargement, ou accepter tel quel ?
18. **R10. Poussière** : brune naturelle (art non teinté), ou lavande nocturne teintable (repli dessiné) ?
19. **R11. Fente du monde spirituel** : teintée en cyan (l'écorce vire au gris-bleu), ou verte avec seulement un halo cyan ?

### 8.3 Sens et options d'histoire

20. **H1. Vignette** : sur les 9 zones qui ont `ambient`, ou seulement sur les zones sombres (forêt sombre 1-2, forêt corrompue, arène de Ghil't, trou sombre) ?
21. **H2. Brume de premier plan** (`couche_brume_avant`) : la poser en ff1 seulement (front, remontée d'environ 50 px), ou la laisser inutilisée ? En ff2, elle couvrirait le filet de sécurité.
22. **H3. Mare au bosquet** : en créer une ? *Déconseillé* : le trio de poissons est un repère d'histoire de FS2.
23. **H4. Îles lointaines en ff2** (petites, alpha 0,6), alors que le fond peint en montre déjà ?
24. **H5. Autel du sommet de l'épreuve** : remplacer `grand_arbre_autel_singe` par `decor_autel_sommet` (même emprise), ou laisser cette image de côté ?
25. **H6. Marches de racines (FS2)** : garder l'arche de Niveaux 2, ou la remplacer par `decor_marches_racines` ?
26. **H7. Fentes fermées** : montrer la fente fermée avant son ouverture (branche haute de l'arène de Kainati avant la victoire, sommet de l'épreuve avant le talisman) ?
27. **H8. Fente côté arrivée** : en poser une au bord gauche du monde spirituel et de l'épreuve, pour qu'on voie le même passage des deux côtés ?
28. **H9. Fleur perchée de FS2** : garder `decor_fleur_perchee` (rose, 6 pétales), ou poser la plante résistante réduite (blanche, 5 pétales), pour que ce soit visiblement la même plante que dans la clairière ?
29. **H10. Plaques du bosquet** : la plaque grattée reste comme trace (*recommandé*), ou elle disparaît comme aujourd'hui ?
30. **H11. Cercle d'herbe saine sous Ghil't** : qui pousse pendant le soin, puis reste dans l'arène calme ?
31. **H12. Habillage optionnel**, un par un :
    - cercle sain sous la fleur de FS2 ;
    - plaques grattée et repoussée au retour au bosquet ;
    - mousse au plafond de la galerie (forêt corrompue) ;
    - mousse sur le tronc du grand arbre du bosquet.
32. **H13. Touffes de la forêt corrompue** : variante penchée quand Agarica approche (léger saut possible), ou rotation seule ?
33. **H14. Idée** : un tapis de mousse au sol de l'arène de Ghil't, qui s'efface pendant l'aspiration (« Il aspire toute la mousse de l'arène ») ? Effet visuel seul.
34. **H15. Rais de lumière** : garder la paire « lune au bosquet / aube au retour » (écho de la boucle de la démo), plus le rai de la souche (FS1), celui du trou sombre et celui de l'arène calme ? Ou n'en poser aucun ?
35. **H16. Créatures guéries** : elles ne se voient jamais en partie normale (le papillon arrive trop tard). Faut-il les faire sortir de la mousse tombée de Ghil't soigné, puis fuir à l'arrivée d'Amanite, et les laisser dans l'arène calme ? Le singe guéri reste-t-il réservé au soin, ou veux-tu un singe d'ambiance au sommet de l'épreuve ?
36. **H17. Restes de bête** en forêt corrompue 1 (x ≈ 3800), comme trace d'Amanite ?
37. **H18. Invocation de Clak** : faire apparaître Clak à la place exacte du crabe dessiné (pieds à groundY - 80, échelle ×1,5), puis lui rendre sa taille en retombant ? Aujourd'hui, il apparaît au-dessus du crabe, plus petit.
38. **H19. Note de Geralt et grappin** : lancer tout de suite la nouvelle extraction (7.2) ?
39. **H20. `lance_amanite` et `porte_mousse`** : les laisser inutilisées ? Aucun usage cohérent n'a été trouvé.
40. **H21. Rocher roulant** : le poser en décor au pied du passage du totem (arène de Kainati, x 1640), ou le garder pour la refonte ?
41. **H22. Anims jamais jouées** : le porteur fait des allers-retours au puits avec ses seaux, le garde barre la porte de l'est d'une estocade, Xara sautille de joie (Ghil't soigné, bébés cochons retrouvés). On les ajoute ?
42. **H23. Petite araignée** au pied de la toile de FS1, qui s'incline devant Xara ?

---

## 9. Vérifications après intégration

### 9.1 Non-régression : toutes les scènes doivent sortir en code 0

```bash
for s in BosquetScene ForetSombre1Scene ForetSombre2Scene GrandArbreRacinesScene GrandArbreAreneScene \
         MondeSpirituelScene EpreuveSingeScene ForetFlottante1Scene ForetFlottante2Scene ClairierePlanteScene \
         HutteMorgatScene ForetCorrompue1Scene AreneGhiltScene TrouSombreScene BosquetRetourScene \
         EndScreenScene TitleScene ControlsScene ZoneAquatiqueScene; do
  python tools/playtest.py --port 8822 --scene $s --flags xaraMet=true --wait 3 || echo "ECHEC $s"
done
python tools/playtest.py --port 8822 --query editor --wait 3   # l'éditeur se charge et propose les sections decor / objet
```

Port 8822 réservé à la vérification globale (8811-8821 sont ceux des agents, 3.2).

**Ordre réel du harnais** (`tools/playtest.py`, vérifié le 2026-10-24) : flags → démarrage de `--scene` (avec `--scene-data`) → attente `--wait` → **toutes les `--keys`** → **tous les `--js`** → `--shot`. Conséquences :
- une téléportation par `--js` arrive **après** les touches : on ne peut pas « se téléporter puis frapper » dans un même lancement ;
- pour agir à un endroit précis : partir d'une entrée de la zone (`--scene-data '{"enterId":"<id d'entrée>"}'`, ids dans `data.entries`) puis marcher avec `--keys`, ou faire le test à la main dans le navigateur (CLAUDE.md demande de toute façon un test navigateur) ;
- `--keys` accepte `wait:<ms>` entre deux touches ; les noms de touches sont ceux de Playwright (`k`, `ArrowRight`, `Space`, `Escape`…).

- Menus, à ouvrir depuis une zone : `--scene BosquetScene --keys "Escape:100"` (pause), `"i:100"` (inventaire), `"m:100"` (carte). Ouvrir aussi le feu de camp.
- Téléportation avant une capture : remplacer X et Y dans
  ```
  --js "(()=>{const s=__game.scene.getScenes(true).find(s=>s.player);s.player.body.reset(X,Y);return s.scene.key})()"
  --js "new Promise(r=>setTimeout(()=>r(1),900))" --shot <fichier>.png
  ```
- Forme loup : `--flags hasWolfForm=true --flags 'equippedForms=["wolf",null,null]'`.
- Captures dans le scratchpad, sous `lot8_integration/`.

### 9.2 Captures attendues

| Scène, drapeaux | Position (X, Y) | Ce que la capture doit montrer |
|---|---|---|
| BosquetScene | 2050, 400 | Les 3 plaques peintes ; vignette douce sur les bords ; HUD (case de compétence vide peinte, barre d'énergie peinte si Q6). |
| BosquetScene, 2 coups sur la plaque de 1930 (test **à la main** dans le navigateur, ou marche depuis une entrée proche puis `--keys "k:100,wait:300,k:100"` : voir l'ordre du harnais ci-dessus) | plaque de 1930 | La plaque grattée reste ; éclats `fx_eclat_mousse` ; anneau **dessiné teinté, pas ambre**. |
| BosquetScene | 3424, 280 | Rai de lune sur l'autel (si H15) ; halo de l'idole doux, sans disque plein. |
| ForetSombre1Scene `xaraMet=true` | 2750, 400 | Mousses collées aux faces du mur et dessous ; invite « E » en pilule ; aucune tache qui flotte. |
| ForetSombre1Scene `xaraMet=true` | 1344, 340 | Rai sur la souche, haut hors écran (si H15). |
| ForetSombre2Scene `xaraMet=true` | 3640, 420 | Mare : fond, voile, ligne de surface sous le tronc, berges, roseaux devant le pont, poissons entre les couches. |
| ForetSombre2Scene, forme loup | 3000, 350 | Contours fantômes calés sur les cases ; flaque de lumière à la révélation. |
| ForetSombre2Scene | 600, 400 | Empreintes écrasées sur le vrai sol, aucune sur la face des tuiles. |
| ForetSombre2Scene | 3616, 100 | Fleur perchée, halo doux ; cercle sain (si H12). |
| ForetSombre2Scene | 4700, 380 | Graine-cœur et son halo ; aucune mousse dans la poche. |
| GrandArbreRacinesScene | 40, -180 | Fente ouverte posée sur la corniche, halo doux. |
| GrandArbreRacinesScene | 700, 400 | Mousse au sol et au plafond du tunnel ; grains de lumière. |
| EpreuveSingeScene | 9000, 300 | Marée : bande peinte, crête qui monte, aucune couture (après 7.1) ; lac du fond qui couvre la ligne 492. |
| EpreuveSingeScene | 10944, 60 | Écorce intacte, puis fissurée, puis brisée quand Agarica s'y pose : 3 lancements, avec une attente de 0, 300 et 900 ms après la téléportation. |
| EpreuveSingeScene `talismanSinge=true` | 12200, -170 | Fente ouverte, rai de l'autel ; l'amande ne grossit pas au-delà de 110 px à l'ouverture. |
| MondeSpirituelScene | 2700, 400 | Fente du retour (halo cyan) ; brume sarcelle qui cache le pied des arbres ; vignette (selon H1). |
| ForetFlottante1Scene | 3290, -940 (belvédère) | Horizon malade presque noir à l'est, derrière les nappes, sans masquer les îles peintes. |
| ForetFlottante1Scene | 520, 400 | Flèches plantées près du panneau ; brume au bas de l'écran. |
| ForetFlottante2Scene `amaniteMet=true` | 2070, 340 | Bête morte de la revisite (Q7) ; horizon (et îles si H4) ; plus de ciel délavé. |
| ClairierePlanteScene | 1200, 400 | Tapis tuilé qui s'arrête net au cercle sain, plante fleurie, colonne de lumière ; pas de voile bleu. |
| ClairierePlanteScene `fleurPrelevee=true` | 1200, 400 | Plante en bouton, sans saut de position. |
| HutteMorgatScene | 2650, 220 | Rampe au bord de la falaise ; horizon malade au loin ; brume recalée. |
| ForetCorrompue1Scene | 170, 400 | Cratère : creux sur la ligne de marche. |
| ForetCorrompue1Scene | 1500, 400 | Campement de Geralt : collet, flèche, note (art complet après 7.2). |
| ForetCorrompue1Scene | 2470, 400 | Spirale gravée à la fourche de l'arbre malade ; spores d'ambiance. |
| AreneGhiltScene | 700, 400 | Barre de boss peinte ; boule de crachat orientée ; souffle qui couvre la zone de dégâts. |
| AreneGhiltScene `ghiltHealed=true` | 700, 400 | Arène calme : mousse séchée ; cercle sain, rai et créatures guéries selon H11, H15 et H16. |
| TrouSombreScene | 200, 400 | Filet de lumière au-dessus du voile sombre ; vignette forte ; halo d'Agarica doux. |
| BosquetRetourScene | 1560, 400 | Rai d'aube (si H15) ; plaques (si H12). |
| Une réplique de Xara (bulle) | n'importe où | Bulle peinte, texte qui ne touche pas les feuilles, pointe raccordée au liseré. |
| Bannière (ramasser un objet) | | Bannière de 128 px, anneau de 72 px, icône de 46 px, 2 lignes qui tiennent. |
| Carte-titre (entrée d'une zone) | | Ornement sous le titre, sans chevauchement. |
| ControlsScene (si R8) | | Touches en bois clair, lettres sombres lisibles. |
| `?editor` | | Les sections `decor` et `objet` proposent les décors à la bonne échelle ; aucun `ui_*`, `fx_*` ni `couche_*` parmi les ramassables. |

### 9.3 Contrôles fonctionnels

- **Gameplay intact.** Mesurer avec `--js`, avant et après l'intégration :
  - hitbox de la boule de Ghil't (rayon 11) ;
  - triangle du souffle ;
  - mort par la marée (`top + 10`) ;
  - hitbox de l'écorce (w x 22) ;
  - pierre du singe corrompu (rayon 5) ;
  - zone de soin du papillon ;
  - chute `fall` de l'épreuve (y 480) ;
  - ondes de Kainati (si 3.10 est fait).
- **Replis.** Forcer `scene.textures.exists` à `false` par `--js` avant `create`, ou renommer un fichier dans une copie du dépôt. Le dessin de repli doit apparaître, sans erreur JS.
- **Halos.** Montage avant et après pour `a2Glow`, `ghGlow`, l'idole, la lanterne, le feu de camp et le papillon : l'énergie doit rester proche de l'ancien halo dessiné, sans disque blanc.
- **Anneaux.** Coup fort, ramassage, transformation, purification et plateforme du loup donnent un anneau teinté, jamais l'anneau ambre à feuilles.
- **Mode Canvas.** Dans une copie locale seulement, passer `type: Phaser.CANVAS` dans `main.js` et vérifier bulles, invites, bannière et barres (`addUiSliced` ne dépend pas de `nineslice`).
- **Éditeur.** Charger puis sauvegarder une zone qui contient `farLayers`, `lights`, `ambient.vignette` et des props `flipX` / `angle` / `hang` / `free` / `flatY`, dans une copie : rien ne doit être perdu.
- **Documentation.** `PLAN_DEV.md` décrit toutes les nouvelles clés (M4).
