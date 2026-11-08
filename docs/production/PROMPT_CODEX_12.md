# Prompt Codex n°12 — crapaud sauteur, crapaud-piège et leur langue (2026-11-08)

Retour utilisateur : « il faudrait rendre les petits mobs plus fun à affronter ; les crapauds ne font rien d'autre que tirer la langue tout droit, sans pouvoir tourner la tête ». Le code a désormais deux crapauds corrompus d'apparences différentes (`src/entities/CrapaudCorrompu.js`, `src/entities/CrapaudPiege.js`) :

- le **crapaud sauteur** se tourne vers Agarica, fait de grands sauts et lui tire la langue dans sa direction, en diagonale comprise ;
- le **crapaud-piège** se cache sous un dos de mousse qui passe pour un rocher, jaillit quand Agarica passe à portée, frappe, puis se renfonce.

Le corps et la langue sont **séparés** : le corps est un sprite ordinaire (demi-tour par `flipX`), la langue une image à part que le code ancre à la bouche, tourne vers la cible et fait sortir. Il faut donc des poses de corps **sans langue** et une **bande de langue** seule.

**4 images** à générer, **3 entrées** de manifeste, déjà ajoutées à `src/data/asset_manifest.js`. Tant qu'une image manque, le jeu garde son repli : découpes de la planche `crapaud_corrompu` existante (cadres `corps` et `langue` taillés à l'exécution), avec une teinte « pierre » et une mousse dessinée par code pour le piège.

## Récapitulatif

| # | Image source | Taille | Découpe | Entrée du manifeste |
|---|---|---|---|---|
| 1 | `assets/sprites/crapaud_sauteur.png` | 1536x1024 | 3 rangées (4, 4, 2), silhouettes | `crapaud_sauteur` (`ASSET_MANIFEST`), rangées 0-2 |
| 2 | `assets/sprites/crapaud_piege.png` | 1536x1024 | 2 rangées (2, 4), silhouettes | `crapaud_piege` (`ASSET_MANIFEST`), rangées 0-1 |
| 3 | `assets/sprites/crapaud_piege_p2.png` | 1536x1024 | 2 rangées (4, 2), silhouettes | `crapaud_piege` (`ASSET_MANIFEST`), rangées 2-3 |
| 4 | `assets/_codex_src/crapaud_langue.png` | environ 1150x128 | image unique | `crapaud_langue` (`ITEM_MANIFEST`) |

Les frames finales vont dans `assets/sprites/crapaud_sauteur_frames/` et `assets/sprites/crapaud_piege_frames/` ; la langue dans `assets/sprites/crapaud_langue.png`.

## Feuilles animées : ce que le code attend (ne pas changer les noms ni les nombres de frames)

| Rangée (manifest) | Image | Anim | Frames | Usage en jeu |
|---|---|---|---|---|
| 0 | `crapaud_sauteur.png` (rangée 1) | `idle` | 4 | attente, en boucle (4 fps) : respiration, gorge à peine gonflée, clin d'œil |
| 1 | `crapaud_sauteur.png` (rangée 2) | `jump` | 4 | 0 accroupi (télégraphe du saut, tenu 0,32 s), 1 détente (montée), 2 en l'air (descente), 3 réception |
| 2 | `crapaud_sauteur.png` (rangée 3) | `tongue` | 2 | 0 gorge très gonflée, bouche fermée (télégraphe de la langue, tenu 0,42 s) ; 1 bouche grande ouverte, **sans langue** (pendant la langue et juste après) |
| 0 | `crapaud_piege.png` (rangée 1) | `hidden` | 2 | caché : 0 yeux clos ; 1 un œil qui s'entrouvre (l'indice qui le trahit, montré 0,3 s de temps en temps) |
| 1 | `crapaud_piege.png` (rangée 2) | `reveal` | 4 | il jaillit de sa mousse (0,22 s, une fois) ; la frame 3 rejoint `idle` 0 |
| 2 | `crapaud_piege_p2.png` (rangée 1) | `idle` | 4 | sorti, exposé, il respire (boucle) |
| 3 | `crapaud_piege_p2.png` (rangée 2) | `tongue` | 2 | comme le sauteur : 0 gorge gonflée, 1 bouche grande ouverte sans langue |

Ce tableau numérote les frames à partir de 0, comme le code ; le prompt les compte à partir de 1.

**Échelle** : les deux feuilles sont jouées à 0,25 (`scale` du manifeste), la langue aussi. En px source : le **sauteur** fait environ 240 px de large et 200 px de haut assis (60 x 50 px à l'écran) ; le **piège** est plus massif, environ 310 px de large et 240 px de haut sorti (78 x 60 px), et caché environ 300 x 110 px. Même finesse de pixel que `assets/sprites/crapaud_corrompu.png` (la planche existante est jouée à 0,26).

**Alignement** : l'import rogne chaque frame à sa boîte visible, puis la centre en bas (`align: bottom`). Pour que le crapaud ne glisse pas d'une frame à l'autre, garder dans chaque rangée **le même appui** : pattes arrière au même endroit, pas de patte qui dépasse plus d'un côté que de l'autre d'une frame à l'autre (sauf `jump` 1 et 2, en l'air).

**Bouche** (clé `mouth` du manifeste) : le code attache la langue au coin de la bouche de la pose `tongue` 1. Dans `tongue` 0 et 1, la bouche est au **même endroit** (la tête ne bouge pas, seules la gorge et la mâchoire changent). Valeurs provisoires du manifeste : `[96, -104]` (sauteur) et `[122, -118]` (piège), en px depuis le **bas-centre du cadre importé**, x vers l'avant (droite), y négatif vers le haut. Elles sont à mesurer après l'import (voir « À la fin ») ; l'intégrateur reporte la mesure dans le manifeste.

## Langue : contrat de la bande

| Mesure | Valeur (px source) | À l'écran (0,25) |
|---|---|---|
| Hauteur de l'image finale | **128**, axe de la tige sur la rangée **64** | 32 |
| Longueur | 1100 à 1200 | 275 à 300 (la portée de jeu est 220 : le reste reste caché dans la bouche) |
| Tige | 22 à 26 de haut, centrée sur la rangée 64 | ~6 |
| Boule (bout droit) | 70 à 90 de diamètre, centrée sur la rangée 64 | ~20 |
| Gouttes de bave | sous la tige, jusqu'à la rangée 124 au plus | |

- **Bord gauche** : coupe verticale nette, sans contour sombre (il est caché dans la bouche).
- **Bord droit** : la boule, entière, avec son contour.
- Le code montre la **fin** de la bande depuis la bouche (rognage qui glisse) : la boule est toujours au bout, la tige n'est jamais étirée. Langue tournée vers la gauche : retournée en Y (les gouttes pendent toujours vers le bas).
- Déclaration : `norm: { mode: "height", value: 128, trim_x: true }` : ni rognage vertical ni redimension, l'axe reste à la rangée 64.

## Prompt à coller dans Codex

```
Nouvelle commande d'images pour « Legend of Agarica » (prompt n°12) : 4 images, toutes déjà déclarées dans src/data/asset_manifest.js (crapaud_sauteur, crapaud_piege, crapaud_langue).

RÈGLES
- Ne modifie ni `src/` ni le manifeste `src/data/asset_manifest.js` : les entrées y sont déjà. N'édite pas non plus tools/import_codex_assets.py.
- Ne régénère et ne retouche aucune image existante (en particulier assets/sprites/crapaud_corrompu.png et ses frames : le jeu s'en sert comme repli).
- Fond transparent partout (alpha réel). Aucun texte, aucune lettre, aucun chiffre, aucune grille, aucun cadre.
- Feuilles animées : une rangée = une animation, nombre de frames EXACT, frames séparées d'au moins 40 px, rangées d'au moins 60 px. Tourné vers la DROITE (le code retourne l'image pour la gauche).
- Une silhouette connexe par frame, aucune particule détachée (pas de goutte, de poussière, de feuille ou de mousse qui vole à part : tout ce qui tombe ou se soulève reste attaché au corps).
- AUCUNE LANGUE dans les feuilles des crapauds : la langue est l'image n°4, à part. Bouche ouverte = intérieur sombre, vide.
- Bande de langue : respecte la hauteur, l'axe et les bords indiqués. Finition mécanique autorisée (recadrage, translation, mise à l'échelle uniforme), jamais de dessin produit par code.
- Commence par crapaud_sauteur.png : il sert ensuite de référence de matière, d'échelle et de palette pour le piège et pour la langue.

RÉFÉRENCES À JOINDRE
- assets/sprites/crapaud_corrompu.png : le crapaud corrompu actuel (matière, palette, finition, gouttes de bave toxique) ; ses frames assets/sprites/crapaud_corrompu_frames/crapaud_corrompu_row0_4.png (la langue d'aujourd'hui, à redessiner seule) et crapaud_corrompu_row1_1.png (gorge gonflée).
- assets/sprites/crapaud_frames/crapaud_row0_0.png : le crapaud sain (orange), même famille.
- docs/production/controles/crapauds_2026-11-08/apparences_repli.png : l'aspect actuel en jeu (sauteur à gauche ; piège caché au milieu ; piège sorti à droite, avec sa mousse dessinée par code) -- c'est l'intention, en mieux.
- assets/sprites/mousse_creature.png : la mousse corrompue des ennemis voisins.

BLOCS COMMUNS (remplace [STYLE], [CORROMPU] et [PLANCHE] par le bloc complet ci-dessous, dans chaque prompt)

[STYLE] =
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Dark silhouettes in the spirit of Hollow Knight. World palette: night forest in deep violet, indigo and teal, magical accents in luminous moonlit green (#8fe3b8) and touches of rose pink (#ff9fc9). Strict side view (profile).

[CORROMPU] =
A TOAD CORRUPTED BY TOXIC LIVING MOSS, same family and same finish as the reference crapaud_corrompu.png: warty olive-brown skin (#6b5a2a, #8a7434, shadows #3a2f18), pale cream belly and throat (#e8dcb4), glowing toxic green pustules and slime (#8dff5a, #b8ff3a, core #eaff9a) with a few short drips that stay ATTACHED to the body, big yellow-green eyes with a dark pupil. Menacing but readable, never gory.

[PLANCHE] =
SPRITE SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background. Horizontal rows, one animation per row, read left to right; frame cells are 384 px wide; each pose is centered in its cell with the lowest point on the same baseline within a row. Leave at least 40 px of empty space between neighboring frames and at least 60 px between rows. Every frame is ONE single connected silhouette; NO detached particles, sparkles, dust, motion lines, NO cast shadow, NO ground line. Same creature, same scale, same colors in every frame. The creature faces RIGHT. NO TONGUE anywhere: when the mouth is open, its inside is dark and empty. No text, no grid lines, no borders.


1) assets/sprites/crapaud_sauteur.png (1536 x 1024, 3 rangées : 4 / 4 / 2 frames, bandes d'environ 340 px)
Taille : environ 240 px de large et 200 px de haut assis ; accroupi environ 260 x 150 ; en l'air jusqu'à 330 px de long.
L'import rogne chaque frame à sa boîte visible et la centre en bas : les pattes arrière restent au même endroit d'une frame à l'autre dans idle et dans tongue, la tête ne bouge pas entre tongue 1 et tongue 2.
Prompt :
[STYLE]
[CORROMPU]
[PLANCHE]
THE JUMPER: a lean, agile toad with LONG POWERFUL HIND LEGS (visibly folded under the body when sitting), a slim body, a smaller head than a common toad, many bright toxic pustules along the back. Clearly built to leap.
Row 1 - "idle" (sitting, looping), 4 frames: 1 sitting alert, head up; 2 throat slightly inflated; 3 back to rest; 4 eyes closed in a blink. Only the throat and eyelids move.
Row 2 - "jump", 4 frames: 1 CROUCH, the telegraph of the leap: body pressed low, hind legs coiled, front legs braced, eyes fixed forward; 2 TAKEOFF: body angled up about 30 degrees, hind legs fully extended backward, front legs reaching forward; 3 AIRBORNE, falling: body level and stretched, front legs reaching down-forward to land, hind legs trailing; 4 LANDING: squashed flat on the baseline, legs splayed, belly almost touching.
Row 3 - "tongue", 2 frames, head and eye in EXACTLY the same place in both: 1 the telegraph: THROAT HUGELY INFLATED into a round pale sac, mouth shut, eyes glowing brighter toxic green; 2 MOUTH WIDE OPEN facing right (jaws apart, dark empty inside), throat deflated, NO TONGUE.
Output: one PNG, 1536 x 1024 px, transparent background, exactly 3 rows, 4 / 4 / 2 frames.

2) assets/sprites/crapaud_piege.png (1536 x 1024, 2 rangées : 2 / 4 frames, bandes de 512 px)
Taille : caché environ 300 x 110 px ; jaillissant jusqu'à 320 x 250 px.
Prompt :
[STYLE]
[CORROMPU]
[PLANCHE]
THE TRAP: a big, stocky, broad toad that looks like a MOSSY BOULDER: stone-grey olive skin (#5f6b4a, #7d8a66, shadows #2f3626) with fewer, duller pustules, and a THICK CUSHION OF LIVING MOSS covering its whole back (#2c4a22, #4e7a2e, highlights #7fa84a, a few tiny moonlit-green dots #8fe3b8 and rose-pink lichen dots #ff9fc9), with TWO SMOOTH GREY PEBBLES (#6c675f, highlight #9a958c) and three small fern sprigs embedded in the moss. The moss, pebbles and sprigs are part of the creature and appear in every frame of both sheets.
Row 1 - "hidden", 2 frames: the toad pressed flat into the ground, legs and belly tucked under, only the mossy back and the top of the head above the baseline: it must read as a mossy rock at first glance. 1 eyes fully closed (a thin dark slit); 2 the same, one eye HALF-OPEN with a tiny toxic green glint (the tell). The outline of both frames is identical except the eye.
Row 2 - "reveal" (bursting out, played once and fast), 4 frames: 1 the moss cushion bulges and cracks, eye opening; 2 the head bursts upward, moss tufts lifting but still attached; 3 the body rises on its legs, mouth half open; 4 fully up, sitting tall, exactly the pose of idle frame 1 of the next sheet.
Output: one PNG, 1536 x 1024 px, transparent background, exactly 2 rows, 2 / 4 frames.

3) assets/sprites/crapaud_piege_p2.png (1536 x 1024, 2 rangées : 4 / 2 frames, bandes de 512 px)
Même crapaud, même échelle et mêmes couleurs que la feuille n°2 (environ 310 px de large et 240 px de haut assis). Les pattes arrière restent au même endroit d'une frame à l'autre ; la tête ne bouge pas entre les 2 frames de tongue.
Prompt :
[STYLE]
[CORROMPU]
[PLANCHE]
THE TRAP, same creature as before (stocky mossy-boulder toad, thick moss cushion with two pebbles and fern sprigs on its back), now out of hiding.
Row 1 - "idle" (exposed, breathing, looping), 4 frames: 1 sitting tall, alert; 2 throat slightly inflated; 3 back to rest, a little moss drip swinging (attached); 4 eyes narrowed. Only the throat, eyelids and the attached drip move.
Row 2 - "tongue", 2 frames, head and eye in EXACTLY the same place in both: 1 THROAT HUGELY INFLATED (telegraph), mouth shut, eyes glowing; 2 MOUTH WIDE OPEN facing right, dark empty inside, NO TONGUE.
Output: one PNG, 1536 x 1024 px, transparent background, exactly 2 rows, 4 / 2 frames.

4) assets/_codex_src/crapaud_langue.png (environ 1150 x 128)
Génère la langue en grand sur une toile transparente (par exemple 1536 x 1024), horizontale, puis recadre mécaniquement une bande de 128 px de haut centrée sur l'axe de la tige (l'axe tombe sur la rangée 64), et rogne à gauche et à droite.
Prompt :
[STYLE]
A single long, sticky TOAD TONGUE seen from the side, perfectly HORIZONTAL and STRAIGHT, belonging to the corrupted toads above: a dark mauve-purple flesh shaft (#5a2a4a, #7a3a5a, highlight #9a5a7a) coated with glowing toxic green slime (#8dff5a, #b8ff3a) and a few short slime drips hanging DOWN from the shaft (attached, at most 60 px long), ending on the RIGHT in a round, bulbous, sticky tip about 80 px across, glowing toxic green at its core. The LEFT end is cut perfectly straight and vertical, with NO dark outline on that side (it disappears inside the mouth). Thick near-black outline everywhere else. Shaft about 24 px thick, the same thickness all along. Nothing else on the canvas: no toad, no mouth, no ground, no shadow, no text.
Output: one PNG, transparent background, the tongue band about 1150 x 128 px, shaft axis on row 64.

À LA FIN
Puis : python tools/import_codex_assets.py --only crapaud_sauteur crapaud_piege crapaud_langue
Contrôles, sur les fichiers finaux après import (montages dans docs/production/controles/lot_12/) :
- Frames : EXACTEMENT 4 / 4 / 2 (crapaud_sauteur) et 2 / 4 / 4 / 2 (crapaud_piege), connexes, aucun avertissement à l'import.
- Langue : image finale de 128 px de haut ; axe mesuré (rangée médiane de la tige sur la moitié gauche) = 64 à 2 px près ; bord gauche opaque sur toute l'épaisseur de la tige, boule entière à droite ; rien sous la rangée 124.
- BOUCHE : pour crapaud_sauteur et crapaud_piege, mesure dans la frame tongue 1 (rangée « tongue ») le point d'attache de la langue -- le fond de la bouche ouverte, à mi-hauteur entre les deux mâchoires, quelques px à l'intérieur des lèvres -- en px depuis le BAS-CENTRE du cadre importé (x positif vers la droite, y négatif vers le haut). Vérifie qu'il est le même dans tongue 0 et tongue 1 à 4 px près. Montage bouche_<id>.png : la frame tongue 1, avec crapaud_langue.png posée à ce point (origine bord gauche, mi-hauteur), une fois horizontale et une fois tournée de 45° vers le haut, sur fond violet nuit #15101f : la langue sort de la bouche sans trou ni décalage.
- Alignement : apercu_<id>.png, toutes les frames d'une rangée superposées en transparence : les pattes arrière ne glissent pas (idle, tongue, hidden), à 3 px près.
- Échelle : sauteur assis environ 200 px de haut ; piège sorti environ 240 px ; piège caché 100 à 120 px.
Puis :
- lance un python tools/import_codex_assets.py final (il régénère src/data/asset_present.js) ;
- ajoute une section « Lot n°12 » à docs/production/RAPPORT_CODEX.md : une ligne par image (statut, frames ou dimensions finales, axe de la langue mesuré) et, surtout, les deux points de BOUCHE mesurés [x, y] à reporter dans la clé `mouth` du manifeste, puis le rapport du dernier import.
```

## Côté code (après l'import)

Rien d'autre à brancher : `crapaudBuildLook` (`src/entities/CrapaudCorrompu.js`) prend l'art n°12 dès que `crapaud_sauteur-idle-0` (ou `crapaud_piege-…`) existe, et `item-crapaud_langue` dès que la langue existe (sinon la langue de la planche corrompue).

- **Reporter la bouche** : remplacer les `mouth` provisoires de `crapaud_sauteur` et `crapaud_piege` dans `src/data/asset_manifest.js` par les mesures du rapport. C'est la seule valeur qui ne se devine pas.
- **Piège** : avec l'art n°12, il n'est plus enfoncé dans le sol ni décoré par code (`sinkMax = 0`, pas de mousse dessinée) : ses poses `hidden` et `reveal` font le travail. Sa zone frappable caché reste la hauteur de son corps.
- **Échelle** : `scale` du manifeste (0,25) remplace 0,24 (sauteur) et 0,30 (piège) du repli ; les corps physiques (44x32 et 56x38 px monde) ne changent pas.
- **Vérifier** en jeu (la branche « art n°12 » a déjà tourné le 2026-11-08 avec de fausses textures, sans erreur) : langue attachée à la bouche, droite et en diagonale, demi-tour, télégraphes lisibles, soin.
