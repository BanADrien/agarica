# Vague 3 — conception : zones facultatives, secrets, économie, marchand, quêtes

> **Décisions de l'utilisateur (2026-11-08).** Le marchand est **Tamarin**, vieux singe colporteur du peuple de Kainati (remplace Margotte la pie) :
> sprite `singe_gueri` + baluchon et lanterne dessinés par code (variante d'art `tamarin` facultative), boutique `SHOPS.tamarin`, talk `v3_tamarin` (§ 4).
> Rencontre aux racines, dans un nid sur la corniche de la cime (x 3630, au bout des deux lianes qui suivent le totem du singe) ; ensuite, perchoirs au bout de
> lianes (`requires: { marchandVu: true }`) : cime cachée (B), grotte de la lisière (A), racines suspendues (C). Plus de comptoir dans la forêt corrompue.
> L'objet volé par Pépin devient la loupe `loupe_tamarin`, rendue à Tamarin dans n'importe quel perchoir (+15 éclats, drapeau `loupeRendue`).
> Prix inchangés (baie 15, sève 20, corde 30) ; ennemi soigné : 0 éclat ; 5 cœurs ; éclats tels quels. Le reste est validé tel quel : choix tranchés au § 8.
> **Pré-lot fait (2026-11-08)** : quelques valeurs des § 1.3, 1.4 et 7.1 ont été corrigées après mesure en jeu (gouffre de la forêt sombre 1 : plus d'ouverture sur la route, un bouchon de bois pourri relie le rocher au tronc et ne se casse à l'ours qu'avec le singe ; lianes x 3392 / 3680 de 160 px, sortie basse x 3712-4032 ; plateforme cachée de l'arène gx 23, gy 4 ; courant d'I1-I2 x 688-792 ; positions de la carte…). **Les valeurs qui font foi sont dans `PLAN_DEV.md`, section « Vague 3 : zones facultatives »**, avec les pièges des arrivées par le bas.

Document de conception (2026-11-08), points 6 à 9 de la liste de l'utilisateur du 2026-11-04.
Il ne contient pas de code. Il sert de cahier des charges à l'agent du **pré-lot** (modifications des
zones existantes et enregistrements partagés), puis aux trois agents des **lots A, B et C**, qui
construisent les zones. L'art est commandé dans `docs/production/PROMPT_CODEX_13.md`.

Sources : `CLAUDE.md`, `Legend_of_Agarica_GDD.md`, `docs/production/PLAN_DEV.md` (contrat d'API),
`histoire/` (surtout `ZONES_ET_PROGRESSION.md` : « chemins secondaires accessibles plus tard »,
« ruines d'anciens totems animaux », Geralt « bloqué par une capacité qu'il ne possède pas »), les
15 fichiers de zone de la démo, `src/scenes/MapScene.js`, `src/data/asset_manifest.js`.

## 0. Règles de conception (valables pour toutes les zones)

**Systèmes de la vague 3.** Un autre agent les construit en ce moment ; leur format exact sera
écrit dans `PLAN_DEV.md`. Ce document emploie les noms de la commande, avec des formats
**indicatifs** : se caler sur le contrat final, seuls les ids et les valeurs comptent ici.
- `breakables: [{ id, x, y, w, h, by: 'sword' | 'bear', look: 'ecorce' | 'pierre' | 'terre' }]` :
  mur ou sol cassable à fissure discrète. `x`, `y` = centre, comme les `mossBlocks`.
- `chests: [{ id, x, y, shards, tier: 'petit' | 'moyen' | 'grand', requires? }]` : coffre secret.
- Cœur entier : pickup « graine de chêne-cœur » (`objet_graine_coeur`, déjà utilisé par le cœur
  de la forêt sombre 2), +1 cœur max. Un id par cœur (`coeur_grotte`…).
- Éclats de lune : 1 à 3 par ennemi vaincu (automatique), plus les coffres.
- `npcs[i].shop: 'tamarin'` + table `SHOPS` (`SHOPS.tamarin`, `src/data/shops_data.js`) ; table `QUESTS` + étapes de cinématique + onglet « Quêtes ».

**Mesures du jeu** (PLAN_DEV) : grille 64 ; surface d'une rangée `gy` = `gy × 64` ; sol courant
`gy` 7-8 (surface 448). Saut simple ≈ 172 px, soit 2 rangées au plus, portée ≈ 180 px. Second saut
du singe ≈ 264 px, de l'aigle ≈ 284 px : 3 rangées au plus. Saut du loup lancé ≈ 376 px.
Lianes : chaque liane pend sous une case solide (attache = haut de la case + 64 ; sous une branche
BrancheKit : surface + épaisseur − 2). Gabarit éprouvé entre deux lianes : bord → 96-128 px →
liane → 448 px → liane → 96-128 px → appui. Un appui plus bas que le lâcher allonge le vol.

**Règle de l'utilisateur (2026-11-09), à appliquer partout.** Deux cases de sol ne se touchent
jamais par un seul coin, sans case pleine entre elles : au minimum, on ajoute la case du coin
(sous la case du haut) pour faire un escalier. Les plateformes isolées qui flottent restent
permises. Pas de faux sol (`groundBackCells`) à la hauteur du vrai sol au fond d'un trou où
l'on ne peut pas descendre. Détail : `PLAN_DEV.md`, « Niveaux et histoire —
règles ».

**Règles propres à la vague 3.**
1. **Bords seulement.** Chaque nouvelle zone se branche par une sortie de bord (`exits` avec `edge`,
   `from`, `to`). Vers le bas : un trou lisible (lueur chaude, grains, panneau à flèche,
   automatiques). Aucune porte n'est nécessaire.
2. **Singe et aigle s'excluent** (même emplacement, choix au feu de camp). Le chemin d'entrée et le
   chemin de sortie d'une zone marchent avec la forme qui a servi à y entrer. Si un secret demande
   l'autre forme, la zone a un feu de camp.
3. **Aucune punition par accident.** Les trous mortels du chemin principal (ravins, ouverture du
   gouffre de la forêt sombre 1, vides des îles) restent mortels et ne mènent nulle part. Une entrée
   qu'on peut prendre sans le vouloir (bord de la clairière, trou qu'on a soi-même cassé dans la
   clairière ou la forêt corrompue : 2 cases, à sauter ensuite) mène à une zone d'où l'on ressort
   en moins d'une minute, sans dégât, par le même trou.
4. **Rien d'obligatoire dans un secret**, aucune quête bloquante. La démo se finit sans rien de ce
   document.
5. **Xara annonce chaque passage fermé** par une bulle non bloquante (`cutsceneBulles`) : le joueur
   comprend qu'il reviendra. Tamarin, le vieux singe colporteur, répète ces indices sous forme de
   rumeurs (§ 4).
6. **Décors** : `foregroundPlants: false` partout (décision du 2026-11-08), sauf dans la forêt
   sombre 1-2 existante. Clé `look` copiée de la zone voisine indiquée, puis réglée à la capture.
7. **Emplacements pour plus tard** (formes, morceaux de totem, armures, armes, compétences) :
   un objet de décor qui se lit comme « il manque quelque chose », une réplique courte, et un
   commentaire `// EMPLACEMENT FUTUR : …` dans la donnée. Rien n'est rempli maintenant (§ 6.3).

## 1. Carte du monde

### 1.1 Schéma

```
                                     [Île des vents] ↑ aigle (courant)
                     [Île du gardien] ↑ aigle (courant)          |
        [Cime cachée] ↑ loup + 2e saut                |          |
   ┄┄┄┄┄┄┄┄┄┄┄ Épreuve du singe (remontée sur la carte) ┄┄┄┄┄┄┄┄┄┄
            [Cercle de lune] ↑ 2e saut                               [Canopée malade] ↑ 2e saut
                    |                                                        |
[Bosquet]→[Forêt sombre 1]→[Forêt sombre 2]→[Racines]→[Arène K.]→[FF1]→[FF2]→[Clairière]→[Hutte] ⇢crash⇢ [Forêt corrompue]→[Arène G.]→[Retour]
               ↓ singe          (poche : répulsif)  ↓ trou          ↑      ↑ ↓       ↓ ours            ↓ ours        ↓
       [Grotte de la lisière] ══════════ [Galeries des racines]  [Racines suspendues]  [Marais]      [Nid des cocons]  [Trou sombre]
               └──────── singe (lianes) ────────┘               (boucle FF2 ⇄ clairière)
```

Le chemin principal reste une ligne. Les dix zones forment des branches vers le haut et vers le
bas, et trois boucles : forêt sombre 1 → grotte → galeries → racines ; clairière → racines
suspendues → îles (FF2) ; et, déjà en place, poche de la forêt sombre 2 ⇄ hutte de Morgat.

### 1.2 Les dix zones

| # | id (scène) | Nom affiché | Région | Se branche sur | Capacité pour entrer | Lot |
|---|---|---|---|---|---|---|
| 1 | `grotte_lisiere` (`GrotteLisiereScene`) | La grotte de la lisière | foret_sombre | forêt sombre 1, bord bas | singe (lianes) ; l'aigle peut aussi planer | A |
| 2 | `galeries_racines` (`GaleriesRacinesScene`) | Les galeries des racines | grand_arbre | racines, bord bas ; grotte, bord droit | aucune depuis les racines ; singe entre ses deux moitiés | A |
| 3 | `cercle_lune` (`CercleLuneScene`) | Le cercle de lune | foret_sombre | forêt sombre 2, bord haut | second saut (singe ou aigle) | A |
| 4 | `cime_cachee` (`CimeCacheeScene`) | La cime cachée | grand_arbre | arène de Kainati, bord haut (après la victoire) | loup (plateforme cachée) + second saut | B |
| 5 | `ile_des_vents` (`IleDesVentsScene`) | L'île des vents | foret_flottante | îles flottantes (FF2), bord haut | aigle (courant d'air) | B |
| 6 | `ile_du_gardien` (`IleDuGardienScene`) | L'île du gardien | foret_flottante | chemin des hauteurs (FF1), bord haut | aigle (courant d'air) | B |
| 7 | `marais_brumes` (`MaraisBrumesScene`) | Le marais des brumes | foret_flottante | clairière, bord bas | ours (bouchon de terre) ; répulsif dedans | C |
| 8 | `racines_suspendues` (`RacinesSuspenduesScene`) | Les racines suspendues | foret_flottante | clairière, bord bas (gauche) ; FF2, bord bas (retour) | aucune ; singe ou aigle pour le coffre | C |
| 9 | `nid_cocons` (`NidCoconsScene`) | Le nid des cocons | foret_corrompue | forêt corrompue, bord bas | ours (sol fissuré) ; répulsif, puis papillon dedans | C |
| 10 | `canopee_malade` (`CanopeeMaladeScene`) | La canopée malade | foret_corrompue | forêt corrompue, bord haut | second saut | C |

Données : `src/data/<id>_data.js`, constante `<ID>_DATA` (convention lue par `mapZoneData`).
Scènes : gabarit identique à `ClairierePlanteScene.js`.

### 1.3 Passages (sorties et entrées)

Tous les `enterId` sont fixés ici : chaque lot les reprend tels quels. Coordonnées en px de la
zone ; `from`/`to` = altitude des pieds pour un bord latéral, x pour un bord haut ou bas.

| De → vers | Sortie (dans la zone de départ) | Entrée (dans la zone d'arrivée) |
|---|---|---|
| Forêt sombre 1 → grotte | `{ edge: 'bottom', from: 3840, to: 4032, targetScene: 'GrotteLisiereScene', data: { enterId: 'from_foret_sombre_1' }, hint: 'lueur' }` | grotte `from_foret_sombre_1` : `edge: 'top', from: 200, to: 400`, x 300, y 400 |
| Grotte → galeries | `{ edge: 'right', to: 448, … 'GaleriesRacinesScene', enterId: 'from_grotte' }` | galeries `from_grotte` : `edge: 'left', to: 448`, x 110, y 400 |
| Galeries → grotte | `{ edge: 'left', to: 448, … 'GrotteLisiereScene', enterId: 'from_galeries' }` | grotte `from_galeries` : `edge: 'right', to: 448`, x 4380, y 400 |
| Racines → galeries | `{ edge: 'bottom', from: 1664, to: 1792, … 'GaleriesRacinesScene', enterId: 'from_racines' }` | galeries `from_racines` : `edge: 'top', from: 3788, to: 3916`, x 3850, y 100 |
| Galeries → racines | `{ edge: 'top', from: 3788, to: 3916, … 'GrandArbreRacinesScene', enterId: 'from_galeries' }` | racines `from_galeries` : `edge: 'bottom', from: 1664, to: 1792`, x 1600, y 400 |
| Forêt sombre 2 → cercle | `{ edge: 'top', from: 4736, to: 4864, … 'CercleLuneScene', enterId: 'from_foret_sombre_2' }` | cercle `from_foret_sombre_2` : `edge: 'bottom', from: 2112, to: 2240`, x 2176, y 400 |
| Cercle → forêt sombre 2 | `{ edge: 'bottom', from: 2112, to: 2240, … 'ForetSombre2Scene', enterId: 'from_cercle_lune' }` | forêt sombre 2 `from_cercle_lune` : `edge: 'top', from: 4736, to: 4864`, x 4800, y 150 (sur le surplomb) |
| Arène de Kainati → cime | dans `kainatiArena.exitsAfterVictory` : `{ edge: 'top', from: 1600, to: 1728, … 'CimeCacheeScene', enterId: 'from_arene' }` | cime `from_arene` : `edge: 'bottom', from: 2304, to: 2432`, x 2368, y 400 |
| Cime → arène | `{ edge: 'bottom', from: 2304, to: 2432, … 'GrandArbreAreneScene', enterId: 'from_cime' }` | arène `from_cime` : `edge: 'top', from: 1600, to: 1728`, x 1664, y 64 |
| FF1 → île du gardien | `{ edge: 'top', from: 3390, to: 3510, … 'IleDuGardienScene', enterId: 'from_ff1' }` | île `from_ff1` : `edge: 'bottom', from: 1740, to: 1860`, x 1800, y 150 |
| Île du gardien → FF1 | `{ edge: 'bottom', … 'ForetFlottante1Scene', enterId: 'from_ile_du_gardien' }` (tout le bord) | FF1 `from_ile_du_gardien` : `edge: 'top', from: 3250, to: 3550`, x 3400, y -950 |
| FF2 → île des vents | `{ edge: 'top', from: 690, to: 790, … 'IleDesVentsScene', enterId: 'from_ff2' }` | île `from_ff2` : `edge: 'bottom', from: 340, to: 460`, x 600, y 80 (point écrit sur l'îlot I0) |
| Île des vents → FF2 | `{ edge: 'bottom', … 'ForetFlottante2Scene', enterId: 'from_ile_des_vents' }` (tout le bord) | FF2 `from_ile_des_vents` : `edge: 'top', from: 520, to: 700`, x 600, y 330 (au-dessus de l'îlot I1) |
| Clairière → racines suspendues | `{ edge: 'bottom', from: 0, to: 128, … 'RacinesSuspenduesScene', enterId: 'from_clairiere' }` | racines suspendues `from_clairiere` : `edge: 'top', from: 2240, to: 2368`, x 2300, y -180 |
| Racines suspendues → clairière | `{ edge: 'top', from: 2240, to: 2368, … 'ClairierePlanteScene', enterId: 'from_racines_suspendues' }` | clairière `from_racines_suspendues` : `edge: 'bottom', from: 0, to: 128`, x 200, y 400 |
| Racines suspendues → FF2 | `{ edge: 'top', from: 384, to: 512, … 'ForetFlottante2Scene', enterId: 'from_racines_suspendues' }` | FF2 `from_racines_suspendues` : `edge: 'bottom', from: 2240, to: 2368`, x 2420, y 470 (on surgit à gauche du filet N et on se pose dessus) |
| Clairière → marais | `{ edge: 'bottom', from: 1472, to: 1600, … 'MaraisBrumesScene', enterId: 'from_clairiere' }` | marais `from_clairiere` : `edge: 'top', from: 576, to: 704`, x 640, y 400 |
| Marais → clairière | `{ edge: 'top', from: 576, to: 704, … 'ClairierePlanteScene', enterId: 'from_marais' }` | clairière `from_marais` : `edge: 'bottom', from: 1472, to: 1600`, x 1420, y 400 |
| Forêt corrompue → nid | `{ edge: 'bottom', from: 2688, to: 2816, … 'NidCoconsScene', enterId: 'from_foret_corrompue' }` | nid `from_foret_corrompue` : `edge: 'top', from: 2176, to: 2304`, x 2240, y 250 |
| Nid → forêt corrompue | `{ edge: 'top', from: 2176, to: 2304, … 'ForetCorrompue1Scene', enterId: 'from_nid' }` | forêt corrompue `from_nid` : `edge: 'bottom', from: 2688, to: 2816`, x 2640, y 400 |
| Forêt corrompue → canopée | `{ edge: 'top', from: 2496, to: 2624, … 'CanopeeMaladeScene', enterId: 'from_foret_corrompue' }` | canopée `from_foret_corrompue` : `edge: 'bottom', from: 896, to: 1024`, x 1100, y 400 (sur la première branche) |
| Canopée → forêt corrompue | `{ edge: 'bottom', … 'ForetCorrompue1Scene', enterId: 'from_canopee' }` (tout le bord) | forêt corrompue `from_canopee` : `edge: 'top', from: 2432, to: 2624`, x 2530, y 150 (sur la branche haute) |

La forêt sombre 1 n'a pas d'entrée depuis la grotte : on y descend, on n'en remonte pas. La grotte
a un feu (vol de l'aigle quand on l'a) et la sortie par les galeries mène aux racines.

### 1.4 Positions pour `MAP_ZONE_LAYOUT`

Coin (0, 0) de chaque zone, en px de jeu. La forêt sombre 1 s'élargit de 512 px (§ 7.1) : toutes
les zones à sa droite se décalent de **+512 en x**. L'épreuve du singe monte sur la carte (de
y −720 à −1100) pour laisser la place au cercle de lune ; elle n'est reliée qu'au bord gauche des
racines, son placement était déjà « au plus lisible ».

| Zone | Avant | Après |
|---|---|---|
| bosquet | (0, 0) | (0, 0) |
| foret_sombre_1 | (3840, 0) | (3840, 0), largeur 4352, hauteur 720 |
| foret_sombre_2 | (7680, 0) | (8192, 0) |
| grand_arbre_racines | (13568, 0) | (14080, 0) |
| grand_arbre_arene | (17408, −640) | (17920, −640) |
| epreuve_singe | (1280, −720) | (1792, −1100) |
| monde_spirituel (hors chemin) | (14000, −2300) | (14512, −3400) |
| foret_flottante_1 | (19328, −640) | (19840, −640) |
| foret_flottante_2 | (22912, −1856) | (23424, −1856) |
| clairiere_plante | (27008, −1834) | (27520, −1834) |
| hutte_morgat | (29248, −1834) | (29760, −1834) |
| foret_corrompue_1 | (32600, −500) | (33112, −500) |
| arene_ghilt | (36760, −500) | (37272, −500) |
| trou_sombre | (36760, 160) | (37272, 160) |
| bosquet_retour | (38104, −500) | (38616, −500) |
| **grotte_lisiere** | — | (7476, 720) |
| **galeries_racines** | — | (11956, 720) |
| **cercle_lune** | — | (10816, −540) |
| **cime_cachee** | — | (17216, −1180) |
| **ile_du_gardien** | — | (21490, −2380) |
| **ile_des_vents** | — | (23764, −2796) |
| **racines_suspendues** | — | (25280, −880) |
| **marais_brumes** | — | (28416, −1294) |
| **nid_cocons** | — | (33624, 40) |
| **canopee_malade** | — | (34712, −1040) |

Calcul : chaque passage tombe au droit du passage de la voisine (ex. trou de la forêt sombre 1 au
milieu x 3936 → monde 7776 ; entrée de la grotte au milieu x 300 → grotte en 7476). Boîtes vérifiées
sans chevauchement avec les tailles du § 2. Deux écarts voulus, non euclidiens : 180 px entre le
haut des galeries et le bas des racines ; 400 px entre les îles flottantes et l'île des vents (sauf
si le pré-lot écrit `levelTop: -400` dans FF2, ce qui aligne les deux). **Le pré-lot revérifie les
boîtes avec les tailles finales des lots** (règle : aucune boîte ne se chevauche, chaque passage
tombe sur le bord de sa voisine).

## 2. Fiches des zones

Pour chaque zone : la réutilisation d'art (aucune n'exige de fond ni de jeu de tuiles neuf), la
taille, le plan, les ennemis, les secrets et le temps de jeu visé. Les positions des secrets sont
approximatives ; celles des passages, des lianes et des gouffres sont à respecter.

### 2.1 `grotte_lisiere` — La grotte de la lisière (lot A)

- **Thème** : une grotte douce et humide sous la lisière ; racines qui percent la voûte,
  champignons lumineux, un vieux sanctuaire du Cercle de la Lune (le cercle d'Agarica).
  Ambiance : mystère calme, plus chaud que la forêt sombre.
- **Art** : `background: 'fond_trou_sombre'` (caverne de racines sous un trou de lune, inutilisée
  ailleurs qu'au trou sombre) ; jeu de tuiles par défaut (`tuiles`, celui de la forêt sombre) ;
  décors `foret_sombre_*` (champignons lumineux, pierre runique, toile, souche), `bosquet_statue_hooded`
  et `bosquet_standing_stone` pour le sanctuaire, `decor_mousse_lumineuse_plafond` (`hang`) sous la
  voûte. `look: { profile: 'foret_sombre', overlay: 0.85, back: { bright: 0.75 } }` (proche de la
  forêt sombre 2) ; `ambient: { tint: 0x05081a, darkness: 0.4 }` ; vignette par défaut ;
  `lights` : rai `fx_rai_lumiere` sous l'ouverture d'arrivée (x 300, alpha 0,3).
- **Taille** : 4480 × 720, caméra fixe, `fall: { y: 620, mode: 'hurt' }` (comme la forêt sombre 2).
  Voûte : une rangée pleine `gy` 0 sur toute la largeur, sauf le puits d'arrivée (x 128-448).
- **Plan** (de gauche à droite ; on arrive en tombant par le haut, à gauche) :
  - **Le puits** (x 0-768) : sol `gy` 7-8. On tombe du haut vers x 300. **Feu de camp x 576** : soin,
    sauvegarde, changement singe ↔ aigle, vol. Bord gauche : mur.
  - **Le ruisseau noir** (x 768-1600) : fosse de 2 cases (x 832-960, chute = 1 cœur) avec une eau
    noire (`liquidFloor: { y: 476, style: 'eau', x1: 832, x2: 960 }`), puis sol ; petit rocher en
    escalier (marches d'une case) vers x 1200.
  - **La galerie des lianes** (x 1600-2752) : gouffre de 18 cases (chute = 1 cœur), sol de second
    plan sombre au fond (`groundBackCells` `gy` 7-8). **3 lianes** sous la voûte : x 1728, 2176,
    2624 ; attache y 64 ; longueur 170 (bas à y 234, comme l'arène de Kainati). Rive d'arrivée à
    x 2752. Infranchissable sans le singe (l'aigle tomberait avant l'autre rive). C'est la vraie
    porte de la zone.
  - **Le sanctuaire oublié** (x 2752-3584) : sol ; pierres levées et statues encapuchonnées gravées de
    croissants. Rocher en escalier (x 2944-3072, marches d'une case) qui monte vers une corniche
    haute (x 3136-3328, surface y 192). Au bout de la corniche, **mur cassable à l'épée** (pierre,
    x ≈ 3360, du plafond à la corniche, 64 × 128) → **niche du cœur** (x 3392-3520), fermée par la
    voûte et un pilier de roche.
  - **Sous la racine** (x 3584-4480) : le chemin monte sur une longue racine (surface y 256,
    x 3712-4352) par des marches d'une case, puis redescend au sol. Sous la racine, une poche fermée à
    droite par un **mur de mousse au répulsif** (`mossWalls`, id `mur_grotte`, 128 de large, x ≈ 4288).
    Sortie : bord droit, au sol → galeries.
- **Ennemis** (4 + 1 décor) : `mousse_creature` (ruisseau, bornes 1000-1500) ; `mousse_creature`
  (sanctuaire, 2800-3100) ; `crapaud_sauteur` (sanctuaire, 3100-3550) ; `crapaud_piege` (x 4440,
  `facing: 'left'`, `reach: 160`) ; `araignee` (fixe, sans danger, x 2850 sur la rive : « une cousine »).
- **Secrets** : ❤ `coeur_grotte` dans la niche (mur à l'épée) ; coffre grand `coffre_grotte_sanctuaire`
  (25), bien en vue sur l'autel du sanctuaire : la récompense des lianes ; coffre petit
  `coffre_grotte_racine` (8) dans la poche au répulsif. **Emplacement futur** (arme) : dans la même poche,
  un vieux râtelier de druide vide (pierre runique + réplique « Ici reposait un bâton… plus maintenant »).
- **Perchoir de Tamarin** (§ 4, `requires: { marchandVu: true }`) : au bout de la galerie des lianes,
  côté sanctuaire ; `x` et appui (nid ou sol) au choix du lot.
- **Xara** : arrivée « Ouf. Une grotte, sous la lisière… Il fait presque doux, ici. » ; bord des
  lianes « Des lianes, encore. Avec tes bras de singe, c'est une promenade. Sans… c'est une chute. » ;
  araignée « Une cousine. Ne la dérange pas, elle compte ses fils. » ; sanctuaire « Des croissants
  de lune gravés. Ton cercle est passé par ici, Agarica. Il y a longtemps. » ; mur de mousse « Cette
  mousse-là, il faudrait la dissoudre. »
- **Durée** : 7 min.

### 2.2 `galeries_racines` — Les galeries des racines (lot A)

- **Thème** : les racines du grand arbre, sous la forêt sombre ; une tanière de loups corrompus au
  milieu ; Geralt coincé au fond (quête 2).
- **Art** : `background: 'fond_trou_sombre'` ; `tileset: 'tuiles_ecorce'` ; `branches` et `trunks`
  (BrancheKit) pour les racines qui portent les lianes et les marches ; décors `grand_arbre_*`
  (racine tunnel, morceaux d'écorce, tas de pierres), `foret_corrompue_os_creature` dans la tanière.
  `look` : celui des racines (copier), plus sombre : `ambient: { tint: 0x0b1424, darkness: 0.38 }`,
  vignette 0,5.
- **Taille** : 4000 × 720, caméra fixe, `fall: { y: 620, mode: 'hurt' }`.
- **Plan** (de gauche à droite) :
  - **Le seuil** (x 0-576) : arrivée depuis la grotte, au sol.
  - **Le pont qui manque** (x 576-1280) : gouffre de 11 cases. **2 lianes** à x 704 et 1152, attache
    y 64 sous des racines (branches courbes en décor, seule la case d'accroche est solide), longueur
    170. Sol de second plan au fond. C'est la porte « singe » entre les deux moitiés : depuis les
    racines, on visite la tanière dès l'acte 1, mais la grotte attend le singe.
  - **La tanière** (x 1280-2880) : grande salle au sol, ossements. **Loup alpha** (`loupAlpha`,
    3 PV, bornes 1600-2600) et un `loup` (1500-2200). Pistes du loup (`tracks`) au sol de x 1400 à 2600,
    qui mènent à 2 **plateformes cachées** révélées par le loup : `{ gx: 38, gy: 5, w: 2 }` puis
    `{ gx: 35, gy: 3, w: 2 }`, puis une corniche fixe (x 1984-2176, surface y 128).
  - **Sous le pied de l'arbre** (x 2880-4000) : marches de racines de 2 rangées (saut simple) :
    surface 320 (x 3328-3456), 192 (x 3520-3648), puis la corniche sous le trou (x 3712-3968,
    surface 128) ; de là, un saut simple passe le bord haut (x 3788-3916) → racines. En tombant des
    racines, on se pose sur cette corniche. Geralt est assis au sol, x ≈ 3560 (quête 2).
- **Ennemis** (5) : `loupAlpha`, `loup`, `mousse_creature` (2950-3300), `singe_corrompu` sur la marche
  192 (bornes 3520-3640 : il bombarde la montée), `crapaud_piege` (x 450, `facing: 'right'`) au bord
  du gouffre.
- **Secrets** : coffre grand `coffre_galeries_meute` (25) sur la corniche des plateformes cachées
  (« le magot de la meute ») ; **paroi de racine pourrie, cassable par l'ours** (terre, x ≈ 1700, au
  pied du rocher de la tanière) → poche avec le coffre petit `coffre_galeries_terrier` (8).
- **Feu** : non (le feu des racines est juste au-dessus ; la grotte a le sien).
- **Xara** : depuis les racines « Ça sent le chien mouillé… Non. Le loup. Plusieurs loups. » ; bord du
  gouffre sans singe « Des lianes au-dessus du vide. On reviendra avec des bras de singe. » ; pistes
  « Tes yeux de loup voient des traces qui montent… dans le vide ? »
- **Durée** : 7 min (combat de l'alpha compris).

### 2.3 `cercle_lune` — Le cercle de lune (lot A)

- **Thème** : une butte nue qui perce la canopée de la forêt sombre ; un cercle de pierres levées
  sous la lune : le lieu de prière du Cercle de la Lune, l'ordre d'Agarica. Silence, lumière froide.
- **Art** : `background: 'fond_monde_spirituel'` (l'arbre-esprit lumineux au loin ; ce fond ne sert
  plus depuis que le monde spirituel a quitté le chemin) ; jeu de tuiles par défaut ;
  `bosquet_standing_stone` ×5, `bosquet_statue_hooded` ×2, `decor_autel_sommet` (l'autel),
  `foret_sombre_pierre_runique`, `foret_sombre_champignons_lumineux`. `look: { profile: 'foret_sombre',
  back: { sat: 0.7, bright: 0.75, fog: 0x1a2440, fogAmt: 0.12 } }` (calme la lueur du fond) ;
  `ambient: { tint: 0x0a1030, darkness: 0.18, vignette: 0.4 }` ; `lights` : rai de lune sur l'autel
  (x 864, y 256, teinte 0xd8ecff, alpha 0,4).
- **Taille** : 2560 × 540, caméra fixe, pas de chute (sol partout sauf le trou de retour).
- **Plan** (on arrive par le bas, à droite) :
  - **La lisière des cimes** (x 1856-2560) : sol ; trou de passage x 2112-2240 (on en surgit, on y
    redescend vers la forêt sombre 2 : panneau « ↓ Forêt sombre »). Bord droit : mur.
  - **Les terrasses** (x 1216-1856) : marches d'une case qui montent vers la gauche : surface 384
    (x 1408-1600), 320 (x 1216-1408).
  - **Le cercle** (x 512-1216) : plateau, surface y 256. Pierres levées en anneau, l'autel au centre
    (x 864) avec un **socle vide en croissant** (emplacement futur ; E : « Un socle creusé en forme de
    croissant de lune. Il attend quelque chose. »). À son pied pousse la **fleur de lune**
    (`pickups: [{ item: 'fleur_lune_cercle', x: 930 }]`, quête 3).
  - **Le bord du monde** (x 0-512) : le plateau descend d'une marche (surface 320) vers une vue sur la
    forêt. **Rocher fendu, cassable par l'ours** (pierre, 128 × 128, x ≈ 320) → derrière, le coffre
    moyen `coffre_cercle` (15). Bord gauche : mur.
- **Ennemis** (3) : deux `corbeau` adoucis (`diveGroundedOnly: true`, patrouilles au-dessus des
  terrasses x 1300-1500 et du plateau x 640-820) ; une `mousse_creature` sur le plateau (300-480).
- **Xara** : arrivée « Des pierres levées… plus vieilles que celles du bosquet. » ; à l'autel « Le
  Cercle de la Lune. Ton cercle, Agarica. Ils venaient prier ici, avant la mousse. » / Agarica :
  « Comment tu sais ça ? » / Xara : « … Je le sais, c'est tout. » (indice sur Maexxna, à garder court).
- **Durée** : 4 min.

### 2.4 `cime_cachee` — La cime cachée (lot B)

- **Thème** : le village du peuple de Kainati, au-dessus de l'arène, dans la couronne du grand
  arbre ; singes guéris, nids, lanternes de lucioles ; tout en haut, le jour qui perce les feuilles.
- **Art** : `background: 'fond_grand_arbre'` ; `tileset: 'tuiles_ecorce'` ; `trunks` (tronc central
  x 1280, de −1100 à 448, teinte 0xa097aa) et `branches` pour tous les sols ; décors `grand_arbre_*`
  (nid de singe ×3, lanterne lucioles, rideau de lianes, statue simien, champignon étagère, autel
  singe). PNJ décor : 2-3 `singe_gueri` (répliques en bulles). `look` : celui de l'arène de Kainati
  (copier) ; `camera: { vertical: true, deadzoneTop: 0.35, deadzoneBottom: 0.7, lerp: 0.08,
  lookAhead: 60 }` ; `skyReveal: { start: 0.3, end: 0.95, leaves: true }` (le jour apparaît en
  haut, comme au chemin des hauteurs) ; `largeTrees: false` ; `ambient: { tint: 0x0b1424,
  darkness: 0.12, vignette: false }`.
- **Taille** : 2560 de large, `levelTop: -1100`, `levelHeight: 540` ; `fall: { y: 600, mode: 'hurt' }`.
- **Plan** (de bas en haut) :
  - **Le palier** (y 448) : grande branche-plancher sur toute la largeur, coupée par le trou de passage
    x 2304-2432 (arrivée depuis l'arène, retour vers elle).
  - **L'échelle de branches** (y 448 → −320) : branches de part et d'autre du tronc, marches de
    2 rangées (saut simple), dessous de chaque branche à 128 px au moins au-dessus de la précédente.
  - **Le village** (branche large x 512-2048, surface y −320) : nids, lanternes. **Tika** x 900 (quête 1),
    villageois. **Feu de camp x 1600** (changer de forme avant la couronne). À droite du village, un
    **bloc d'écorce creuse cassable à l'épée** (écorce, 64 × 128, x ≈ 2080) ferme un rameau
    (x 2112-2368, y −320) qui porte le coffre moyen `coffre_cime_tronc` (15).
  - **La couronne** (y −320 → −960), défi au singe : liane L1 x 256 (attache −896, longueur 500, à
    gravir), lâcher vers une branche x 512-704 surface −704 ; liane L2 x 960 (attache −1024, longueur
    220) ; lâcher vers la branche du nid (x 1408-1664, surface −960) : ❤ `coeur_cime` dans « le nid de
    la couronne », sous le ciel de jour. Une chute retombe sur le village : pas de punition.
- **Ennemis** (3) : un `singe_corrompu` « qui refuse de guérir » sur la branche −704 (il lance des
  pierres pendant l'escalade ; le papillon le soigne plus tard) ; deux `corbeau` adoucis au-dessus du
  village.
- **Xara** : arrivée « Un village… perché au-dessus du monde. Kainati ne gardait pas sa cime pour
  rien. » ; couronne « Là-haut, un nid. Et ce qui brille dedans ne ressemble pas à un œuf. »
- **Villageois** (bulles) : « Kainati dit que tu te balances bien. Pour une humaine. » ; « Tu as vu
  Pépin ? Il est toujours là où il ne faut pas. »
- **Perchoir de Tamarin** (§ 4, `requires: { marchandVu: true }`) : il revient à son village, mais
  perché au bout d'une liane ; `x` et perchoir au choix du lot (pas dans le nid du cœur).
- **Durée** : 7 min (village 2, couronne 3 à 5).

### 2.5 `ile_des_vents` — L'île des vents (lot B)

- **Thème** : un archipel minuscule porté par des vents ascendants, au-dessus des îles flottantes.
  Pépin y est perché sur le plus haut rocher : il voulait attraper un nuage.
- **Art** : comme les îles flottantes (FF2) : `background: 'fond_foret_flottante'`, `tileset:
  'tuiles_flottantes'`, `look` copié de FF2, `skyReveal: { start: -1, end: 0, leaves: false }`,
  `largeTrees: false`, `farLayers` de FF2 (`couche_iles_lointaines`), `liquidFloor: { y: 500, style:
  'brume' }` ; décors `foret_flottante_*` (rocher flottant, nuage, pissenlit, fleurs hautes),
  `bosquet_standing_stone` pour un vieux moulin à vent en ruine (pierres).
- **Taille** : 2560 de large, `levelTop: -1200`, `levelHeight: 540` ; caméra verticale (réglages de
  FF2). **Tout le bord bas est une sortie** vers FF2 : une chute ramène sans dégât sur l'îlot I1.
- **Plan** (de bas en haut) :
  - Courant C0 (x 360-440, de 540 à 0, force 330) prolonge celui de FF2 : l'aigle monte et se pose sur
    **I0** (x 512-832, surface 128).
  - Courant C1 (x 900-960, de 128 à −500) → **I1** (x 1024-1344, surface −448). Sur I1, une **dalle
    fendue cassable à l'épée** (pierre, 64 × 64) cache 5 éclats (ou un petit coffre derrière, selon
    ce que permet le système).
  - Courant C2 (x 1500-1560, de −448 à −900) → **I2** (x 1600-2048, surface −832) : **Pépin** x 1850,
    à côté d'un nuage de décor.
  - Îlot du coffre (x 2240-2432, surface −640) : on l'atteint en planant depuis I2 ; coffre moyen
    `coffre_vents` (15). Courant C3 (x 2320-2370) pour remonter vers I2.
- **Ennemis** (4) : trois `corbeau` adoucis (au-dessus du milieu de I0, I1, I2, hors de l'arc des
  sauts) ; un `crapaud_piege` sur I1 (`reach: 160`).
- **Xara** : arrivée « Ce vent… il porte des rires. Des rires de singe ? »
- **Durée** : 5 min.

### 2.6 `ile_du_gardien` — L'île du gardien (lot B)

- **Thème** : les ruines d'un sanctuaire des anciens gardiens, posé sur une île au-dessus du
  belvédère (les « ruines d'anciens totems animaux » de `ZONES_ET_PROGRESSION.md`). Six socles :
  trois portent le symbole d'une forme qu'Agarica possède, trois sont vides.
- **Art** : comme FF2 (fond, tuiles, `look`, `skyReveal` plein jour, `farLayers`) ; socles =
  `decor_autel_sommet` ×6 ; symboles sur les socles : icônes de forme si elles existent, sinon dessin
  de code ; `bosquet_standing_stone`, `bosquet_statue_hooded`, `foret_flottante_fleurs_hautes`.
- **Taille** : 2240 de large, `levelTop: -400`, `levelHeight: 540` ; caméra verticale. **Tout le bord
  bas est une sortie** vers le belvédère de FF1.
- **Plan** (on arrive par le bas, à droite) :
  - Courant C0 (x 1770-1830, de 540 à 0) → **île d'arrivée** (x 1600-2240, surface 192).
  - **Le sanctuaire** (x 576-1472, surface 128 ; saut de 2 cases depuis l'île d'arrivée, +64) : six
    socles à x 640, 768, 896, 1088, 1216, 1344. Ceux du loup, du singe et de l'aigle s'allument si la
    forme est débloquée (script) ; les trois de droite restent vides (**emplacements futurs** : ours,
    papillon, pieuvre, ou morceaux de totem). La **fleur de lune** pousse entre eux
    (`fleur_lune_gardien`, x 992).
  - **Le reliquaire** (x 0-576) : niche creusée dans un gros rocher (cases pleines au-dessus et à
    gauche). **Porte de pierre fissurée, cassable par l'ours** (pierre, 128 × 192, x ≈ 512) → ❤
    `coeur_gardien` sur un petit autel (x 256).
  - **L'îlot du coffre** (x 896-1088, surface −256) : petit courant C1 (x 1440-1490, de 128 à −300),
    puis un plané vers la gauche ; coffre moyen `coffre_gardien` (15).
- **Ennemis** (4) : deux `corbeau` adoucis au-dessus du sanctuaire ; `mousse_creature` (1100-1450) :
  la corruption est montée jusqu'ici ; `crapaud_sauteur` sur l'île d'arrivée (1700-2150).
- **Xara** : arrivée « Des ruines posées sur le ciel… Les anciens gardiens venaient ici. » ; socles
  « Loup, singe, aigle… et trois socles vides. D'autres bêtes t'attendent quelque part. » ; porte
  « Cette porte est fendue. Un bon coup d'épaule… d'ours. »
- **Durée** : 4 à 5 min.

### 2.7 `marais_brumes` — Le marais des brumes (lot C)

- **Thème** : un marais perché dans un creux du plateau, sous la clairière ; brume, nénuphars,
  roseaux, un saule malade. La mousse y a éteint le reflet de la lune. Dame Écaille, une vieille
  tortue, voudrait le rallumer (quête 3).
- **Art** : `background: 'fond_foret_flottante'` ; `tileset: 'tuiles_flottantes'` ; `liquidFloor:
  { y: 476, style: 'eau' }` (art `liquide_mare_*` existant) ; décors `decor_mare_berge`,
  `decor_mare_roseaux`, `foret_corrompue_arbre_malade` (le saule, échelle 0,7), `bosquet_log_pile`
  (le tronc de Dame Écaille), `decor_lanterne_eteinte` / `_allumee` (sa lanterne), `decor_nenuphar`
  si l'art du prompt n°13 existe (sinon cases de terre et roseaux). `look` : celui de FF2 +
  `grade: { exposure: 0.92, sat: 0.92 }`, `back: { fog: 0x9fc4c0, fogAmt: 0.14, mist: 0.24 }` ;
  `ambient: { tint: 0x16302a, darkness: 0.14, vignette: 0.3 }` ; `ambientLife: { fireflies: 14 }`.
- **Taille** : 3840 × 720, caméra fixe, `fall: { y: 600, mode: 'hurt' }` (« tu ne sais pas nager »).
- **Plan** (on tombe du haut, à gauche) :
  - **La berge** (x 0-1088) : sol. Sous le trou d'arrivée, une **échelle de racines** pour remonter
    (surfaces 320, 192, 64, saut simple ; du 64, un saut passe le bord haut x 576-704). **Dame Écaille**
    x 300 sur son tronc. **Feu de camp x 900** (point de départ et de retour de la quête). Au bout
    gauche, une **racine morte cassable à l'épée** (écorce, 64 × 128) : cache de 5 éclats.
  - **Les nénuphars** (x 1088-2432) : eau ; plateformes d'une ou deux cases à la surface (surface 448),
    espacées de 2 cases (saut simple) : x 1216-1344, 1472, 1664-1792, 1920, 2112-2240 ; une souche
    plus haute (surface 384) au milieu.
  - **Le saule creux** (x 2432-3200) : rive. Le saule est muré par un **mur de mousse au répulsif**
    (`mossWalls`, id `mur_saule`, 128 de large, x ≈ 2880) ; dedans : la **fleur de lune**
    (`fleur_lune_marais`) et le coffre moyen `coffre_marais_saule` (15).
  - **L'eau profonde** (x 3200-3840) : bassin sans plateforme ; tout au fond, une lueur
    (`fx_halo_doux` + `fx_lueur_sol` sous la surface) : **emplacement futur de la pieuvre**. Bord
    droit : mur.
- **Ennemis** (5) : deux `crapaud_piege` (nénuphar x 1700, `reach: 160` ; rive du saule) ;
  `crapaud_sauteur` (rive du saule, 2500-2800) ; `mousse_creature` (2600-2850) ; un `corbeau` adouci
  au-dessus de l'eau.
- **Xara** : arrivée « Que de brume… On n'y voit pas à trois pattes. » ; saule « Ce saule est muré de
  mousse. Morgat aurait de quoi la dissoudre. » ; eau profonde « Quelque chose brille, tout au fond.
  Il faudrait savoir nager… et respirer sous l'eau. Un jour, peut-être. »
- Quête terminée : la lanterne s'allume (lumière à condition, `requires: { queteEcaille: 'finie' }`),
  plus de lucioles.
- **Durée** : 7 min.

### 2.8 `racines_suspendues` — Les racines suspendues (lot C)

- **Thème** : sous le plateau flottant, ses racines pendent dans le vide, au-dessus de la brume ;
  on circule à l'envers du monde. Un nid de corbeaux garde un coffre.
- **Art** : comme FF2 (fond, `tileset: 'tuiles_flottantes'`, `look`) mais à l'ombre :
  `ambient: { tint: 0x1a2a3a, darkness: 0.2, vignette: false }` ; `liquidFloor: { y: 480, style:
  'brume' }` ; `farLayers` : `couche_horizon_malade` (la forêt malade, au loin dessous : un avant-goût
  de la suite) ; plafond de cases pleines (le dessous du plateau) d'où pendent les racines ; décors
  `foret_flottante_rocher_flottant`, `grand_arbre_nid_singe` (nid de corbeaux).
- **Taille** : 2560 de large, `levelTop: -400`, `levelHeight: 540` ; caméra verticale ;
  `fall: { y: 600, mode: 'hurt' }`. Plafond : rangée pleine `gy` −6 sur toute la largeur, sauf les
  deux trous de sortie (x 384-512 et x 2240-2368).
- **Plan** :
  - **R1** (x 2048-2560, surface −128) : on y tombe depuis la clairière. **Feu de camp x 2450** (on peut
    arriver en aigle ou en singe). Sous le trou, deux marches d'une rangée posées sur R1 (surfaces
    −192 puis −256, la plus haute sous x 2240-2368) : de la plus haute, un saut simple repasse le bord
    haut → clairière.
  - **Le grand vide** (x 704-2048) : deux routes vers la gauche. Singe : 3 racines-lianes sous le
    plafond (x 1856, 1408, 960 ; attache −320, longueur 200). Aigle : un courant qui monte de la brume
    (x 1200-1280, de 500 à −200), puis un plané. Au milieu, une plateforme de repos R5 (x 1344-1472,
    surface 128).
  - **Le nid des corbeaux** (R2, x 256-704, surface 0) : coffre grand `coffre_racines_nid` (25).
    Corniches R3 (x 448-576, surface −128) et R4 (x 320-448, surface −256) : de R4, un saut simple
    repasse le bord haut (x 384-512) → FF2, à côté du filet N.
  - Une **racine pourrie cassable à l'épée** (écorce, 64 × 128, x ≈ 1600, y ≈ −64) ferme une poche :
    cache de 5 éclats.
- **Ennemis** (4) : deux `corbeau` adoucis (nid) ; `crapaud_piege` sur R1 (`reach: 160`, loin du feu) ;
  `singe_corrompu` sur R5.
- **Perchoir de Tamarin** (§ 4, `requires: { marchandVu: true }`) : au bout des racines-lianes du
  grand vide (route du singe ; l'aigle y arrive aussi en planant) ; `x` et perchoir au choix du lot.
- **Xara** : arrivée « On est… sous les îles ? Le monde a un dessous, alors. » ; nid « Un nid de
  corbeaux. Les corbeaux aiment ce qui brille. Comme un certain vieux singe. »
- **Durée** : 5 min.
- Pourquoi ce passage : l'entrée est le bord gauche de la clairière, au pied du courant d'air qui
  ramène aux îles. Qui rate son plané en repartant tombe ici au lieu de perdre un cœur, et en remonte
  en une minute. Le trou T2 → T3 des îles et le vide de la rampe d'envol restent mortels :
  aucune entrée par erreur sur le chemin principal.

### 2.9 `nid_cocons` — Le nid des cocons (lot C)

- **Thème** : une cavité sous la forêt corrompue où la mousse « couve » : cocons pendus, pustules.
  Au fond, un grand cocon gardé par une créature qu'on ne peut pas abattre, seulement soigner.
- **Art** : `background: 'fond_trou_sombre'` ; `tileset: 'tuiles_corrompues'` ; décors
  `foret_corrompue_*` (cocon de mousse, `hang` pour les cocons pendus et en grand pour le grand cocon,
  pustule, champignon toxique, racine tordue, os), `decor_mousse_lumineuse_plafond`. `look` : réglages
  de la forêt corrompue sur la base du trou sombre : `{ profile: 'nuit', overlay: 0.85, grade:
  { sat: 1.02, map: [0x141026, 0x4a526a, 0xd9ffc8], mapAmt: 0.12, contrast: 1.08, pivot: 0.12 },
  back: { bright: 0.66, sat: 0.8, fog: 0x16221a, fogAmt: 0.1 } }` ; `ambient: { tint: 0x0c1a08,
  darkness: 0.5 }` ; `ambientLife: { spores: 10 }`.
- **Taille** : 2560 × 720, caméra fixe, `fall: { y: 620, mode: 'hurt' }`.
- **Plan** (on tombe du haut, à droite) :
  - **La chute** (x 1920-2560) : corniche d'arrivée (x 2048-2432, surface 320), descente au sol.
    Marches pour remonter sous le trou (surfaces 320, 192, 64 ; saut simple).
  - **Les cocons** (x 896-1920) : sol, plafonds bas, cocons pendus. Un **mur de mousse au répulsif**
    (id `mur_nid`, x ≈ 1216) ferme une alcôve : coffre moyen `coffre_nid_alcove` (15).
  - **Le grand cocon** (x 0-896) : le **gardien du cocon** (`mousse_creature`, `hp: 99`, bornes
    560-760) se tient devant une paroi de cocon solide. **Le papillon le soigne** ; à l'événement
    `'enemy-healed'` de ce gardien, le script retire la paroi (drapeau `nidGardienSoigne`). Derrière :
    coffre grand `coffre_nid_grand_cocon` (25) et un **socle vide** (emplacement futur : armure ou
    morceau de totem). On ne peut le faire qu'après la démo (le papillon s'obtient au trou sombre,
    puis l'arène se referme jusqu'au soin de Ghil't) : c'est le cadeau du retour en arrière final.
- **Ennemis** (4 + gardien) : deux `mousse_creature`, un `crapaud_sauteur`, un `singe_corrompu` sur
  une corniche au-dessus des cocons.
- **Xara** : arrivée « La mousse fait des nids, maintenant… Je n'aime pas ça. » ; gardien sans
  papillon « Celui-là ne se laissera pas abattre. Il faudrait… le soigner ? » ; avec le papillon :
  « Tes papillons, Agarica. Essaie. »
- **Durée** : 5 min (+ 1 min après la démo).

### 2.10 `canopee_malade` — La canopée malade (lot C, la première à couper si le temps manque)

- **Thème** : au-dessus de la forêt corrompue, les cimes tordues ; singes corrompus et corbeaux ; au
  sommet, la vue sur le ciel violet de l'antre de Ghil't et sa spirale.
- **Art** : `background: 'fond_arene_ghilt'` (le ciel de l'antre, vu de plus haut) ; `tileset:
  'tuiles_corrompues'` ; décors `foret_corrompue_*` (arbre malade, racine tordue, souche) ; `look`
  de la forêt corrompue (copier) ; `ambient` de la forêt corrompue ; `ambientLife: { spores: 8 }`.
- **Taille** : 1920 de large, `levelTop: -600`, `levelHeight: 540`, caméra verticale. **Tout le bord
  bas est une sortie** vers la branche haute du carrefour.
- **Plan** : on surgit par le bas (x 896-1024) à côté d'une première branche (x 1024-1408,
  surface 448) ; courte montée (marches de 2 rangées, une de 3 rangées au second saut) en zigzag
  jusqu'au **perchoir** (surface −480) : coffre moyen `coffre_canopee` (15). Un **bloc d'écorce malade
  cassable par l'ours** (écorce, 128 × 128) ferme une branche latérale : cache de 5 éclats.
- **Ennemis** (4) : deux `singe_corrompu` sur des branches hautes, deux `corbeau` adoucis.
- **Xara** (au perchoir) : « Cette spirale, dans le ciel… elle tourne autour de l'antre. Comme la
  mousse sur l'arbre gravé. »
- **Durée** : 3 min.

## 3. Économie

### 3.1 Cœurs entiers (+1 cœur max chacun)

**5 cœurs cachés au total** (choix de l'utilisateur, § 8), soit 8 cœurs au maximum (3 de base).

| Id | Où | Comment | Capacités |
|---|---|---|---|
| `coeurBonusForet` (existant) | poche de la forêt sombre 2 | mur de mousse au répulsif | répulsif |
| `coeur_grotte` | grotte de la lisière, niche du sanctuaire | lianes, puis mur cassable à l'épée | singe |
| `coeur_cime` | cime cachée, nid de la couronne | défi de lianes | loup + singe |
| `coeur_gardien` | île du gardien, reliquaire | porte de pierre cassable par l'ours | aigle + ours |
| `coeur_ecaille` | marais, récompense de Dame Écaille | quête des 3 fleurs de lune | singe ou aigle, aigle, répulsif |

Variante à 4 cœurs (7 au maximum, écartée) : le nid de la couronne donne un coffre grand au lieu d'un cœur.
Le cœur existant doit être rattaché au nouveau système (l'agent des systèmes s'en charge,
rétro-compatible).

### 3.2 Éclats de lune disponibles

Hypothèse : 1 à 3 éclats par ennemi, environ 2 en moyenne ; ennemis non mémorisés (ils
reviennent à chaque entrée de zone, donc on peut farmer, mais ce n'est pas nécessaire).
**Ennemi soigné au papillon : 0 éclat.** Ce document proposait « autant qu'un ennemi vaincu » ;
l'utilisateur a gardé le réglage du système (`ECLATS_HEALED_DROP = 0`, PLAN_DEV) : le soin est
récompensé par l'histoire, pas par la bourse.

| Source | Détail | Éclats (un passage) |
|---|---|---|
| Ennemis des zones existantes | 25 (FS1 2, FS2 3, racines 4, épreuve 1, FF1 3, FF2 4, clairière 2, forêt corrompue 5) | ≈ 50 |
| Ennemis des zones facultatives | 40 (grotte 4, galeries 5, cercle 3, cime 3, îles 4 + 4, marais 5, racines suspendues 4, nid 4, canopée 4) | ≈ 80 |
| Coffres | 13 : 2 petits, 7 moyens, 4 grands (détail ci-dessous) | 221 |
| Caches dans des cassables | 4 × 5 (île des vents, marais, racines suspendues, canopée) | 20 |
| Quêtes | Pépin 25 + loupe 15 ; Geralt 30 ; Écaille (cœur, pas d'éclats) | 70 |
| **Total** | | **≈ 440** |

| Coffre | Éclats | Lesquels |
|---|---|---|
| petit (×2) | 8 | `coffre_grotte_racine`, `coffre_galeries_terrier` |
| moyen (×7) | 15 | `coffre_cercle`, `coffre_cime_tronc`, `coffre_vents`, `coffre_gardien`, `coffre_marais_saule`, `coffre_nid_alcove`, `coffre_canopee` |
| grand (×4) | 25 | `coffre_grotte_sanctuaire`, `coffre_galeries_meute`, `coffre_racines_nid`, `coffre_nid_grand_cocon` (après la démo) |

Répartition par moment : chemin principal seul ≈ 50 ; zones facultatives de l'acte 1 (grotte,
galeries, cercle, cime) ≈ 125 de plus ; acte 2 (îles, marais, racines suspendues, trois quêtes)
≈ 190 ; forêt corrompue (nid, canopée) ≈ 50, plus 25 après la démo.

### 3.3 Prix de la boutique

| Article | Prix | Effet | Condition / limite |
|---|---|---|---|
| Baie de soin (`baie_soin`) | 15 | +1 cœur (`CONSUMABLE_INFO`) | 5 dans les poches au plus |
| Sève d'énergie (`seve_energie`) | 20 | énergie pleine | 3 au plus |
| Corde tressée (`corde_tressee`) | 30 | objet de la quête de Geralt | seulement quête en cours, une fois |
| *Grande baie* | *40* | *+3 cœurs* | **bientôt** (grisé) |
| *Besace élargie* | *60* | *+2 places de baies et de sève* | **bientôt** |
| *Amulettes (armures légères)* | *100 à 150* | *à définir* | **bientôt** |
| *Carte des rumeurs* | *50* | *repères des secrets sur la carte* | **bientôt** |

Visée : le chemin principal seul rapporte ≈ 50 éclats, soit 3 baies, ou 1 baie et 1 sève, sans
farmer. Avec l'exploration, la boutique ne retient plus personne : les articles grisés servent de
puits pour la suite. L'utilisateur garde les éclats tels quels (§ 8) ; si la démo s'avère trop
généreuse au playtest, diviser les coffres par 1,5.
Pas de bonus de boss (Kainati et Ghil't ne lâchent rien) : plus simple, et Kainati est épargné.

## 4. Le marchand : Tamarin, le vieux singe colporteur

Tout ce qui suit est déjà codé par le pré-lot dans `src/story/vague3_commun.js` (dialogues, rumeurs,
loupe, accessoires) et `src/data/shops_data.js` (boutique) : les lots ne font que poser ses perchoirs.

**Qui.** Le vieux Tamarin, un ancien du peuple de Kainati (« J'ai connu Kainati haut comme une noix
de coco »), descendu de la cime il y a longtemps pour voir du pays, devenu colporteur. Il ne grimpe
plus : il se **perche**, et attend que les clients montent jusqu'à lui ; on ne le trouve donc qu'au
bout des lianes. Il aime ce qui brille, comme tout son peuple, d'où les éclats de lune. Il appelle
Agarica « jeune pousse ». Ton doux et un peu drôle. C'est l'arrière-grand-oncle de Pépin (pour lui,
Pépin est son « arrière-petit-neveu »). Un marchand par acte : pour la démo, c'est lui.

**Art.** Sprite `singe_gueri` réutilisé (même échelle 0,28), avec des accessoires de colporteur
dessinés par code (`v3MarchandAccessoires` : baluchon de toile rapiécée posé derrière lui, lanterne à
éclat de lune au bout d'un bâton planté à côté, deux éclats « en vitrine »). Variante d'art
facultative `tamarin` au manifeste (prompt Codex n°13) : prise automatiquement, sans les accessoires
de code, dès qu'elle existe. Portrait `portrait_tamarin` ; locuteur `tamarin` (`SPEAKERS`).

**Où.** Une seule boutique, `SHOPS.tamarin` (« Le bric-à-brac de Tamarin »), et un drapeau
`marchandVu`, posé à la fin de la rencontre :
1. **Racines du grand arbre** (rencontre, sans condition) : perché dans un nid
   (`grand_arbre_nid_singe`) sur la **corniche de la cime**, x 3630, au bout des deux lianes qui
   suivent le totem du singe, juste avant l'arène de Kainati. En se posant sur la corniche, une bulle
   l'annonce (déclencheur `v3_tamarin`, `forbids: { marchandVu: true }`, cinématique
   `v3_tamarin_appel`) : « Psst ! Par ici, la grimpeuse ! Approche, je ne mords pas. Plus beaucoup. »
   Le nid de la fourche (x 1440) reste un simple décor.
2. **Perchoirs des lots**, toujours au bout de lianes, visibles seulement avec
   `requires: { marchandVu: true }` : **cime cachée** (lot B), **grotte de la lisière** (lot A),
   **racines suspendues** (lot C). Chaque lot choisit `x` et le perchoir (§ 2).

Pas de comptoir dans la forêt corrompue (retiré le 2026-11-08).

**Comportement du PNJ.** Ligne de données à copier (clé `npcs`, en tête de `vague3_commun.js`) :
```
{ id: 'tamarin', sprite: 'singe_gueri', x: 1234, onProp: 'grand_arbre_nid_singe', facing: 'left',
  shop: 'tamarin', talk: 'v3_tamarin', requires: { marchandVu: true } },
```
avec son nid dans `props` (facultatif ; sans `onProp`, il se pose sur le sol) :
`{ type: 'grand_arbre_nid_singe', x: 1234, y: <surface>, scale: 0.26 }`. Aux racines, la même ligne
sans `requires`.

E : la cinématique-fonction `CUTSCENES.v3_tamarin` (relue à chaque appui) choisit la réplique, puis
la boutique s'ouvre d'elle-même (PNJ `shop`, pas d'étape `{shop}`) :
1. `marchandVu` absent → **rencontre** (`v3_tamarin_rencontre`, plus la réplique « avant Kainati » si
   `kainatiDefeated` manque, plus la bulle de Xara), puis `marchandVu` ;
2. `loupe_tamarin` dans le sac → **loupe rendue** (`v3_tamarin_loupe`) : la loupe est retirée,
   drapeau `loupeRendue`, +15 éclats ;
3. sinon → **accueil** (une des quatre phrases, à tour de rôle, compteur `marchandVisites`), puis
   une **rumeur** (`marchandRumeur`), ou la réplique de la corde si la quête de Geralt est à l'étape
   `demande` et que la corde n'est pas dans le sac.

**Répliques** (telles qu'écrites dans `vague3_commun.js`, selon `docs/production/STYLE_DIALOGUES.md` :
court, parlé, une réplique = une info ; le marchand est radoteur, un peu filou, et ses rumeurs sont
de vrais indices).
- Rencontre (boîte de dialogue, puis `marchandVu` et la boutique) :
  - Tamarin : « Une cliente ! Tamarin, colporteur. J'ai connu Kainati tout petit. »
  - Tamarin : « Tes éclats de lune contre mes baies. Ça te va ? »
  - Tamarin : « Je ne grimpe plus, je me perche. Cherche-moi au bout des lianes. »
  - (avant la victoire sur Kainati) Tamarin : « Tu montes voir Kainati ? Prends des baies, il est grognon. »
  - Xara (bulle) : « Il a l'air honnête. Pour un singe. »
- Visites suivantes : UNE réplique, puis la boutique. La corde si la quête de Geralt est à l'étape
  `demande` (« Une corde ? Pour un ranger coincé dans un trou ? Ha ! Trente éclats. »), sinon la
  prochaine rumeur, sinon un bonjour à tour de rôle (« Approche ! Tout est garanti. Enfin,
  presque. » · « Encore toi ! Tu as grimpé jusqu'ici pour mes baies ? » · « Les amulettes arrivent
  bientôt. Les baies, elles, sont là. »), puis « J'ai tout dit. Repasse demain, je radoterai. »
- Boutique (phrase du haut de `SHOPS.tamarin`) : « Tout est garanti. Enfin, presque. » Refus : texte
  commun de la boutique ; poches pleines (5 baies, 3 sèves) : l'article quitte l'étal.
- Loupe rendue : Agarica : « Pépin avait ta loupe. Il dit qu'il l'a trouvée. » / Tamarin : « Ma
  loupe ! Sans elle, je confonds éclats et cailloux. Tiens, pour ta peine. » (+15 éclats)
- **Rumeurs** (`V3_RUMEURS`), à tour de rôle (`marchandRumeur`), en sautant celles dont la zone est
  déjà visitée (`visited_<zone>`) :
  1. (grotte) « Sous le tronc couché de la forêt sombre, des lianes pendent. Et le bois est pourri. »
  2. (galeries) « Il y a un trou entre les racines, au pied de l'arbre. Ça sent le loup mouillé. »
  3. (toujours) « Un mur qui sonne creux, tape dedans. Un rocher fendu, c'est un travail d'ours. »
  4. (cime) « Mon village est au-dessus de l'arène. On y monte par des traces de loup. »
  5. (île des vents) « Un vent monte entre les premières îles. Un oiseau s'en servirait. Moi, je regarde. »
  6. (marais) « Sous la clairière de la plante, il y a un marais. Et une tortue très, très lente. »
  7. (cercle) « Un cercle de pierres, au-dessus de la forêt sombre. On y monte par la trouée du surplomb. »
  8. (racines suspendues) « Sous les îles, des racines pendent dans le vide. Les corbeaux y cachent un trésor. »
  9. (île du gardien) « Au belvédère, un courant d'air monte vers de vieilles ruines. »

## 5. Quêtes secondaires

> **Textes** : les répliques ci-dessous sont des INTENTIONS. Chaque lot les écrit selon
> `docs/production/STYLE_DIALOGUES.md` (au moins moitié moins de texte, 2 à 4 répliques par échange,
> une info par réplique, pas d'images poétiques). Objets : descriptions d'une phrase, cf. `ITEM_INFO`
> dans `vague3_commun.js`.

Trois quêtes. Aucune ne bloque l'histoire. Chacune vit dans le fichier d'histoire de son lot
(`QUESTS[id]` + dialogues + cinématiques). Les drapeaux ci-dessous sont le miroir de l'état de
`QUESTS`, si le système garde son propre état.

### 5.1 Quête 1 — « Pépin et le nuage » (lot B)

- **PNJ** : Tika, mère singe du peuple de Kainati (cime cachée) ; Pépin, son petit (île des vents).
- **Accroche** : Pépin a voulu attraper un nuage ; il a sauté dans le grand vent au-dessus des îles.
- **Conditions** : cime cachée (loup + second saut, après Kainati) ; île des vents (aigle). Faisable
  après le totem de l'aigle. On peut commencer par Pépin ou par Tika.
- **Étapes** (`quetePepin`) et textes de l'onglet « Quêtes » :
  1. `cherche` : « Tika, dans la cime cachée, cherche son petit Pépin, emporté par le vent au-dessus des îles flottantes. »
  2. `sac` : « Pépin est dans ton sac. Ramène-le à Tika, dans la cime cachée. »
  3. `finie` : « Pépin est rentré. Il est puni. Il a l'air ravi quand même. »
  - Étape annexe : « Rendre la loupe à Tamarin, le vieux singe colporteur perché au bout des lianes. »
- **Objets** : `pepin_sac` (« Pépin (dans ton sac) » — « Il gigote et il chantonne. ») ; `loupe_tamarin` (« Loupe de Tamarin » — « Pour compter les éclats de lune. Pépin dit qu'il
  l'a trouvée. »).
- **Dialogues** :
  - Tika (première fois) :
    - Tika : « Une humaine… qui grimpe comme nous ? Kainati avait raison, alors. »
    - Tika : « Pardonne-moi, je n'ai pas la tête aux visites. Mon petit, Pépin, a disparu. »
    - Agarica : « Disparu ? Où ça ? »
    - Tika : « Il voulait attraper un nuage. Il a sauté dans le grand vent, au-dessus des îles… et le vent l'a gardé. »
    - Xara (bulle) : « Un singe qui chasse les nuages. J'aime déjà ce petit. »
    - Tika : « Si tu le trouves, ramène-le-moi. Même s'il proteste. Surtout s'il proteste. »
  - Pépin (sur l'île des vents) :
    - Pépin : « T'es qui, toi ? T'es une araignée ? Non, c'est elle, l'araignée. Bonjour, l'araignée ! »
    - Xara : « … Bonjour. »
    - Agarica : « Ta maman te cherche, Pépin. »
    - Pépin : « J'ai presque eu un nuage ! Il était tout mou. Après il est parti. Les nuages, c'est pas sérieux. »
    - Pépin : « Je peux monter dans ton sac ? Je promets de pas manger tes affaires. Pas beaucoup. »
    - Pépin : « Et ça, c'est un trésor ! Je l'ai trouvé à côté d'un vieux singe qui ronflait. » (`V3_PEPIN_LOUPE`, déjà dans `vague3_commun.js`)
    - → `pepin_sac` et `loupe_tamarin` dans le sac ; Pépin disparaît de l'île.
    - Si Tika n'a pas encore parlé : Pépin ajoute « Ma maman, c'est Tika. Elle habite tout en haut de l'arbre géant. Y a pas de nuages, là-bas. »
  - Tika (retour) : Pépin sort du sac (`npcAdd` près de Tika, anim `joie`) :
    - Tika : « Pépin ! Espèce de petite noix sans coquille ! »
    - Pépin : « Maman, j'ai volé ! Enfin, c'est le vent qui a volé. Moi, j'étais dedans. »
    - Tika : « Merci, druidesse. Prends ceci : les éclats que Pépin cachait sous son oreiller. Il ne s'en servira plus. Il est puni. »
    - Pépin : « Hé ! »
- **Récompense** : 25 éclats (Tika) + 15 éclats (loupe rendue à Tamarin, son arrière-grand-oncle,
  dans n'importe quel perchoir : cinématique `v3_tamarin`, drapeau `loupeRendue`, § 4). Ensuite, Pépin
  reste au village (`requires: { quetePepin: 'finie' }`).

### 5.2 Quête 2 — « Le ranger au fond du trou » (lot A)

- **PNJ** : Geralt, assis au fond des galeries des racines (`requires: { geraltMet: true }`, donc
  après le duel du chemin des hauteurs). Il cartographiait les racines ; le sol a cédé.
- **Conditions** : galeries (accessibles dès l'acte 1 par le trou des racines) ; Geralt n'y est
  qu'après sa rencontre ; il faut 30 éclats.
- **Étapes** (`queteGeralt`) :
  1. `demande` : « Geralt est coincé dans les galeries, sous les racines du grand arbre. Il lui faut une corde tressée. »
  2. (corde dans le sac) : « Tamarin, le vieux singe colporteur, vend des cordes. Apporte-en une à Geralt. »
  3. `finie` : « Geralt est sorti. Il dit qu'il étudiait le trou. »
- **Objet** : `corde_tressee` (« Corde tressée » — « Assez longue pour sortir quelqu'un d'un trou. »), achetée chez Tamarin, 30 éclats (article de `SHOPS.tamarin` visible
  seulement à l'étape `demande`, une fois).
- **Dialogues** :
  - Geralt (première fois ; anim `map_reading`) :
    - Geralt : « Ah ! Agarica ! Quelle… coïncidence. Je ne suis pas coincé. J'étudie ce trou. De l'intérieur. »
    - Agarica : « Tu es tombé ? »
    - Geralt : « J'ai exploré verticalement. Très vite. Le sol des racines a cédé sous le poids de mon génie. »
    - Geralt : « Ces racines sont trop hautes pour mes jambes. Elles ont été mal conçues. Il me faudrait une corde. Une bonne corde tressée. »
    - Xara (bulle) : « Le vieux Tamarin, perché là-haut, vend de tout. Même des cordes, sûrement. »
    - Geralt : « Clak ? Clak garde l'entrée. C'est un rôle stratégique. Il ne sait pas où je suis. »
  - Geralt (sans corde) : « Toujours pas de corde ? Ce n'est pas grave. Je n'ai pas faim. Ni soif. Ni froid. »
  - Geralt (avec la corde) :
    - Agarica : « Tiens, une corde. »
    - Geralt : « Une corde ! Je savais que mon plan finirait par marcher. »
    - Geralt : « Il faudrait juste… l'attacher en haut. Tu pourrais… ? »
    - Narrateur (après un fondu) : « Agarica remonte, noue la corde à une racine et la laisse pendre. Un long moment plus tard, Geralt émerge, essoufflé. »
    - Geralt : « Voilà ! Grâce à moi. Et un peu à toi. Pour ta peine, j'ai noté ces galeries sur ta carte. Et voici quelques éclats. Ne dis rien à Clak. »
  - Après : la corde reste en décor sous le trou (`objet_corde`), Geralt est parti.
- **Récompense** : 30 éclats + carte : les zones `galeries_racines` et `grotte_lisiere` sont portées
  entières sur la carte (`mapExplored[zone] = '*'`, visible au prochain feu).

### 5.3 Quête 3 — « La lanterne de Dame Écaille » (lot C)

- **PNJ** : Dame Écaille, très vieille tortue (marais des brumes).
- **Accroche** : la brume et la mousse ont éteint le marais ; les petits crapauds ne retrouvent plus
  leur chemin la nuit. Elle veut fabriquer une lanterne de lune.
- **Conditions** : trois fleurs de lune dans trois zones facultatives : le saule du marais
  (répulsif), le cercle de lune (second saut), l'île du gardien (aigle). Faisable entre la hutte de
  Morgat et le crash, ou après la démo. Le vol de l'aigle entre les feux aide.
- **Étapes** (`queteEcaille`) :
  1. `demande` : « Dame Écaille veut rallumer le marais. Rapporte-lui trois fleurs de lune (n/3) : une dans son vieux saule, deux "très haut, ou très loin". »
  2. `finie` : « La lanterne de lune brille sur le marais. »
- **Objets** : `fleur_lune_marais`, `fleur_lune_cercle`, `fleur_lune_gardien` (trois ids pour que
  chaque `pickups` fonctionne seul ; même art `fleur_lune`) : « Fleur de lune » — « Elle brille même en plein jour. »
- **Dialogues** :
  - Dame Écaille (première fois) :
    - Écaille : « Doucement, doucement… Tu cours trop vite, petite. Moi, je traverse ce marais depuis le printemps dernier. J'en suis à la moitié. »
    - Agarica : « Vous allez où ? »
    - Écaille : « Nulle part. J'y suis déjà. C'est le marais qui s'est éteint autour de moi. »
    - Écaille : « Avant, la lune se reflétait partout, ici. Maintenant, il n'y a plus que la brume et cette mousse. Les petits crapauds se perdent, la nuit. »
    - Écaille : « Je voudrais faire une lanterne de lune. Pour ça, il me faut trois fleurs de lune. Elles ne poussent que là où la lune touche encore le sol. »
    - Écaille : « Il y en avait une dans mon vieux saule. La mousse l'a muré. Les deux autres… quelque part très haut, ou très loin. Toi, tu as des jambes. Et des ailes, à ce qu'on dit. »
    - Xara (bulle) : « Des pierres levées sous la lune… Je connais des endroits comme ça. »
  - En cours : « Une ! … Deux ! … Je compte lentement, mais je compte bien. »
  - Fin :
    - Écaille : « Trois fleurs de lune. Regarde comme elles brillent… Merci, petite. »
    - (La lanterne s'allume, les lucioles reviennent, la brume s'éclaire.)
    - Écaille : « Tiens. Une graine de chêne-cœur. Je la gardais pour mes vieux jours… mais à mon âge, tous les jours sont vieux. »
- **Récompense** : cœur entier `coeur_ecaille`.

## 6. Retours en arrière

### 6.1 Passages vus avant d'être franchissables

> Les bulles réellement posées (déclencheurs `v3_*`) sont dans `src/story/vague3_commun.js`, réécrites selon
> `docs/production/STYLE_DIALOGUES.md` ; les citations du tableau ne sont que l'intention. Gouffre de la forêt
> sombre 1 : on y entre en cassant à l'ours un bouchon de bois pourri, qui n'existe qu'avec le singe.

| Passage | Où et quand on le voit | Ce qui manque | Ce que voit le joueur et comment il comprend |
|---|---|---|---|
| Gouffre aux lianes (FS1 → grotte) | forêt sombre 1, en traversant le tronc couché, au début de l'acte 1 | singe (racines) | Deux lianes pendues sous le tronc, une lueur au fond. Xara : « Des lianes, sous le tronc… et une lueur, tout au fond. Sans bras de singe, n'y pense même pas. » Rumeur 1 de Tamarin. Une fois le singe obtenu, une 2e bulle au même endroit : « Les lianes ! Laisse-toi tomber par l'ouverture et accroche-toi. » |
| Le pont qui manque (galeries) | galeries, dès la 1re visite des racines (trou entre les racines) | singe | Même image que les lianes de l'arène. Xara : « On reviendra avec des bras de singe. » |
| Trouée lumineuse (FS2 → cercle de lune) | forêt sombre 2, sur le surplomb, acte 1 | second saut (singe ou aigle) | Lueur de sortie haute entre les branches. Xara : « Cette lumière, là-haut… pas pour tes petites jambes. Pas encore. » ; avec une forme aérienne : « Un second saut, et tu y es. » |
| Piste qui grimpe (arène → cime cachée) | arène de Kainati, derrière le rideau droit, après la victoire | loup (révèle) + second saut | Empreintes du loup qui montent vers le vide. Xara : « Des traces qui montent… dans le vide ? Ton flair de loup voit peut-être mieux que moi. » |
| Vent du belvédère (FF1 → île du gardien) | chemin des hauteurs, au belvédère, acte 2 avant l'aigle | aigle | Un courant d'air (traits `fx_trait_vent`) monte vers le ciel. Xara : « Encore un courant. Celui-là monte vers… des ruines ? Un oiseau saurait s'en servir. » |
| Vent du début (FF2 → île des vents) | îles flottantes, entre I1 et I2, avant le totem de l'aigle | aigle (obtenu plus loin dans la même zone) | Le courant déjà « décor » de FF2, prolongé jusqu'en haut. Après le totem : « Le vent du début ! Il monte jusqu'au ciel. Tu planes, maintenant… essaie ? » |
| Bouchon de terre (clairière → marais) | clairière, entre le cercle sain et les racines | ours (déjà là) | Sol fissuré, clapotis. Xara : « La terre est molle, ici. Ça clapote dessous… Un coup de patte d'ours ? » |
| Saule muré (marais) | marais, première visite | répulsif (hutte, juste après) | Dame Écaille et Xara le disent. Petit retour en arrière : hutte → clairière → marais. |
| Mur de mousse de la grotte, alcôve du nid | grotte (acte 1), nid (acte 2) | répulsif | « Cette mousse-là, il faudrait la dissoudre. » |
| Sol fissuré (forêt corrompue → nid) | carrefour de la forêt corrompue | ours (déjà là) | « Le sol est creux, ici. Et quelque chose remue dessous. » |
| Branche haute du carrefour (→ canopée) | carrefour de la forêt corrompue | second saut (déjà là) | Lueur haute. « Au-dessus de la mousse, les cimes… Un second saut et tu y es. » |
| Gardien du grand cocon (nid) | nid des cocons, acte 2 | papillon (après la démo) | Il encaisse sans broncher. « Celui-là ne se laissera pas abattre. Il faudrait… le soigner ? » |
| Bord de la clairière (→ racines suspendues) | clairière, au pied du courant d'air | rien | Des racines pendent du bord. « Le bord s'effondre dans le vide… des racines pendent dessous. » |

La carte rappelle tout cela : les sorties de bord vues y sont marquées (passages), et les zones
facultatives s'y dessinent au fil de l'exploration.

### 6.2 Ce que chaque forme ouvre

- **Ours** (forêt sombre 1) : bouchon du marais, sol du nid, rocher du cercle, terrier des galeries,
  porte du reliquaire, écorce de la canopée.
- **Loup** (forêt sombre 2) : plateformes cachées de la tanière et de l'arène (accès à la cime), pistes.
- **Singe** (racines) : gouffre de la forêt sombre 1, pont des galeries, couronne de la cime,
  galerie des lianes de la grotte, racines-lianes du grand vide.
- **Aigle** (îles) : île des vents, île du gardien, courant du grand vide.
- **Répulsif** (hutte) : saule du marais, alcôve du nid, poche de la grotte.
- **Papillon** (trou sombre) : gardien du grand cocon, singe « qui refuse de guérir » de la couronne.
- **Pierre** (talisman du singe) : rien d'obligatoire ; utile contre les corbeaux et le singe de la couronne.

### 6.3 Emplacements pour plus tard (rien n'est rempli)

| Où | Objet de décor | Pour quoi, plus tard |
|---|---|---|
| Cercle de lune, autel | socle vide en croissant (`decor_socle_lune` ou `decor_autel_sommet`) | une forme ou un morceau de totem |
| Île du gardien, sanctuaire | 3 socles vides sur 6 | formes ou morceaux de totem (ours ? papillon ? pieuvre ?) |
| Marais, eau profonde | lueur au fond | la pieuvre (nage) |
| Nid des cocons, derrière le gardien | socle vide | armure ou morceau de totem |
| Grotte, poche au répulsif | râtelier de druide vide | une arme (bâton de druide) |
| Boutique de Tamarin | articles grisés « bientôt » (la boutique n'en affiche pas encore : Tamarin en parle, « la caravane des amulettes est en retard ») | consommables, besace, amulettes, carte des rumeurs |

## 7. Découpage en lots

Ordre : **pré-lot** (un seul agent), puis **lots A, B et C en parallèle**. Aucun lot ne touche les
fichiers d'un autre ni les fichiers existants ; s'il lui faut un changement partagé, il le signale
dans son rapport au lieu de le faire. Ports du harnais : pré-lot 8820, A 8821, B 8822, C 8823.

### 7.1 Pré-lot : zones existantes et enregistrements partagés

**Zones existantes (données et scripts d'histoire) :**
- **Forêt sombre 1** (`foret_sombre_1_data.js`, `acte1.js`) — le gouffre aux lianes :
  - `levelWidth` 3840 → **4352** ; `levelHeight: 720` ; `fall: { y: 620, mode: 'hurt' }`.
  - Après le mur de racines, sol `gy` 7-8 jusqu'à x 3200, avec un rocher en escalier posé dessus :
    `(48, 6)`, `(49, 5-6)` (surface 320) ; **ouverture** x 3200-3328 (aucune case) ; **tronc couché** de x 3328 à 4032,
    surface 256 (BrancheKit, une branche du grand arbre arrachée par une tempête, ou tuiles) ; sous
    le tronc, le **gouffre** x 3200-4032 ; à droite, roche pleine `(63, 4-8)`, marches `(64, 5-8)`,
    `(65, 6-8)`, sol jusqu'au bord x 4352.
  - **2 lianes** sous le tronc : x 3392 et 3776, attache = surface + épaisseur − 2 (≈ 310), longueur 120.
  - Fond du gouffre : `groundBackCells` `gy` 7-8, x 3200-3840 (partie mortelle) ; x 3840-4032 =
    **sortie basse** vers la grotte (`hint: 'lueur'`). Une chute par l'ouverture sans singe = 1 cœur.
    Avec le singe : chute, saut humain, second saut (transformation), liane 1, liane 2, lâcher, trou.
    L'aigle peut aussi planer jusqu'au trou (accepté).
  - Déplacer : déclencheur `mousse_partout` (x 3240 → 2950), crapaud-piège (x 3600 → ≈ 3000, à
    régler), entrée `from_foret_sombre_2` (x 3700 → 4212), décors x 3264-3690. Vérifier les touffes
    de premier plan au-dessus du gouffre.
  - Bulles de Xara `v3_fs1_gouffre` (sans singe) et `v3_fs1_gouffre_singe` (avec), sur le tronc.
- **Forêt sombre 2** : sortie haute x 4736-4864 au-dessus du surplomb + entrée `from_cercle_lune` ;
  bulles `v3_fs2_trouee`.
- **Racines** (`grand_arbre_racines_data.js`) : couper la racine du sol en deux branches (0 → 1664 et
  1792 → 3840, pointes au trou) ; sortie basse x 1664-1792 + entrée `from_galeries` ; **Tamarin**
  perché dans un nid sur la corniche de la cime (x 3630, `onProp: 'grand_arbre_nid_singe'`, au bout
  des deux lianes qui suivent le totem du singe, juste avant l'arène ; § 4), avec sa bulle d'appel
  (déclencheur `v3_tamarin`, cinématique `v3_tamarin_appel`) ; le nid de la fourche reste un décor ;
  bulle `v3_racines_trou`. Si le pied du tronc gêne la lecture du trou :
  x 2432-2560, et revoir la largeur des galeries et la carte.
- **Arène de Kainati** : plateforme cachée `{ gx: 24, gy: 5, w: 2 }`, branche plate x 1600-1792
  surface 128, pistes x 1490-1680 ; sortie haute dans `kainatiArena.exitsAfterVictory` + entrée
  `from_cime` ; bulle `v3_arene_traces` (`requires: { kainatiDefeated: true }`).
- **Chemin des hauteurs (FF1)** : courant `{ x: 3420, y: -1400, w: 60, h: 504, force: 320 }` (il dépasse
  le haut pour que le corps franchisse le bord) ; sortie haute x 3390-3510 + entrée
  `from_ile_du_gardien` ; bulle `v3_ff1_vent` (`forbids: { hasEagleForm: true }`).
- **Îles flottantes (FF2)** : écrire `levelTop: -400` ; courant d'I1-I2 prolongé
  `{ x: 712, y: -560, w: 56, h: 1040, force: 330 }` ; sortie haute x 690-790 + entrée
  `from_ile_des_vents` (au-dessus d'I1 : le crapaud-piège d'I2 reste hors de portée ; écarter le
  corbeau x 608 de la colonne de chute) ; entrée `from_racines_suspendues` (bord bas x 2240-2368) ;
  bulle `v3_ff2_vent` (`requires: { hasEagleForm: true }`).
- **Clairière** : sol `groundRow(2, 35, [7, 8])` (trou x 0-128 sous le courant, prolongé jusqu'au bas)
  + sortie basse et entrée `from_racines_suspendues` ; trou x 1472-1600 fermé par un **cassable à
  l'ours** (terre, 128 × 128, id `bouchon_marais`) + sortie basse et entrée `from_marais` ; bulles
  `v3_clairiere_bouchon`, `v3_clairiere_bord`.
- **Forêt corrompue** : sol coupé x 2688-2816 et **cassable à l'ours** (terre, id `sol_nid`) + sortie
  basse et entrée `from_nid` ; sortie haute x 2496-2624 + entrée `from_canopee` ; pas de marchand
  (comptoir retiré le 2026-11-08) ; créature x 2800 bornée à 2860-3050 ; racine tordue x 2680 → 2600 ; bulles `v3_fc1_sol`, `v3_fc1_haut`.

**Enregistrements partagés :**
- 10 données de zone **minimales** mais valides (sol plat, `zoneName`, `background`, `tileset`, entrées
  et sorties définitives du § 1.3) : chaque lot peut tester ses passages dès le départ ; 10 scènes
  gabarit ; balises `<script>` dans `index.html` ; scènes dans `src/main.js`.
- `DEMO_ZONES` (StoryKit) : chaque zone juste après sa voisine, avec sa région (§ 1.2) ; `MENU_CHAPTERS`
  (MenuKit) : grotte et cercle → `foret_sombre`, galeries et cime → `grand_arbre`, îles, marais et
  racines suspendues → `foret_flottante`, nid et canopée → `foret_corrompue`.
- `MAP_ZONE_LAYOUT` du § 1.4.
- `src/story/vague3_commun.js` (nouveau) : `SPEAKERS` (`tamarin`, `tika`, `pepin`, `ecaille`) ;
  `ITEM_INFO` de tous les nouveaux objets ; Tamarin (§ 4 : talk `v3_tamarin`, dialogues, rumeurs,
  loupe rendue, accessoires de code) ; `SHOPS.tamarin` (§ 3.3) dans `src/data/shops_data.js` ;
  toutes les bulles `v3_*` des zones existantes (§ 6.1). Et trois fichiers d'histoire vides, un par
  lot : `vague3_sous_bois.js` (A), `vague3_hauteurs.js` (B), `vague3_marais.js` (C).
- Entrées de manifeste du prompt n°13 (placeholders à la bonne taille) : à ajouter avant les lots
  par l'agent du manifeste (ou par le pré-lot si on le lui confie).
- `PLAN_DEV.md` : une section « Vague 3 : zones facultatives » (zones, passages, drapeaux).

**Vérifications** : toutes les scènes existantes et les 10 nouvelles sortent en code 0 ; chaque
passage aller-retour testé (`--scene-data '{"enterId":"…"}'`) ; gouffre de la forêt sombre 1 franchi
au clavier simulé avec le singe (au moins 3 essais réussis sur 5) et refusé sans lui ; chemin principal
inchangé (forêt sombre 1 de bout en bout au saut simple) ; captures du gouffre, de la trouée de la
forêt sombre 2, du trou des racines, de la carte (M) avec les nouvelles zones portées en entier.

### 7.2 Lot A — « Sous la forêt »

- **Zones** : `grotte_lisiere`, `galeries_racines`, `cercle_lune` (+ la fleur `fleur_lune_cercle`,
  + le perchoir de Tamarin dans la grotte, ligne de données du § 4).
- **Quête** : 2 (Geralt). `QUESTS.geralt_corde` dans `src/story/vague3_sous_bois.js`.
- **Fichiers** : les 3 données de zone, `src/story/vague3_sous_bois.js`. Rien d'autre.
- **Tests** (port 8821) :
  `python tools/playtest.py --port 8821 --scene GrotteLisiereScene --flags xaraMet=true --flags hasWolfForm=true --flags hasMonkeyForm=true --flags 'airForm="monkey"' --wait 3 --shot %TEMP%/v3_grotte.png`
  (même chose pour `GaleriesRacinesScene` avec et sans singe, `CercleLuneScene` avec l'aigle) ; galerie
  des lianes et pont qui manque franchis au clavier simulé ; loup alpha vaincu ; Geralt présent
  seulement avec `geraltMet` ; quête 2 jouée de bout en bout (corde achetée).

### 7.3 Lot B — « Les hauteurs »

- **Zones** : `cime_cachee`, `ile_des_vents`, `ile_du_gardien` (+ `fleur_lune_gardien`, + le perchoir
  de Tamarin dans la cime, ligne de données du § 4).
- **Quête** : 1 (Pépin). `QUESTS.pepin` dans `src/story/vague3_hauteurs.js` ; Pépin donne
  `loupe_tamarin` avec `pepin_sac` (réplique `V3_PEPIN_LOUPE`) ; la loupe est rendue par les dialogues
  de Tamarin du pré-lot (cinématique `v3_tamarin`, lien par l'objet `loupe_tamarin`).
- **Fichiers** : les 3 données, `src/story/vague3_hauteurs.js`.
- **Tests** (port 8822) : chaque zone avec singe puis avec aigle ; montée de la cime au saut simple
  jusqu'au village ; couronne au singe ; courants des îles avec l'aigle ; chute = retour sans dégât ;
  socles allumés selon les formes ; quête 1 dans les deux ordres.

### 7.4 Lot C — « Marais et corruption »

- **Zones** : `marais_brumes`, `racines_suspendues`, `nid_cocons`, `canopee_malade` (la dernière
  peut être reportée) ; + le perchoir de Tamarin dans les racines suspendues (ligne de données du § 4).
- **Quête** : 3 (Dame Écaille). `QUESTS.fleurs_lune` dans `src/story/vague3_marais.js` (les fleurs du
  cercle et de l'île sont posées par les lots A et B avec les ids du pré-lot).
- **Fichiers** : les 4 données, `src/story/vague3_marais.js`.
- **Tests** (port 8823) : marais au saut simple ; eau = 1 cœur ; saule avec et sans répulsif ; racines
  suspendues en singe et en aigle, sorties vers la clairière et vers FF2 ; gardien du cocon
  indestructible, puis soigné avec `unlockedSkills` papillon → paroi retirée ; quête 3 avec les trois
  fleurs posées par `--flags`.

**Rapport de chaque lot** (en français, concis) : fichiers créés, ce qui marche, captures, écarts
au présent document et pourquoi, besoins pour les fichiers partagés.

## 8. Choix laissés à l'utilisateur (tranchés le 2026-11-08)

1. **Cœurs** : 5 au total, 8 au maximum (proposé), ou 4 (sans celui de la couronne).
   → **Tranché : 5 cœurs** (8 au maximum).
2. **Marchand** : un nouveau personnage avec son propre art (proposé) ou un vieux singe du peuple de
   Kainati (réutilise `singe_gueri`, moins d'art). → **Tranché : le vieux singe**, Tamarin (§ 4) ;
   variante d'art `tamarin` facultative.
3. **Second comptoir** du marchand dans la forêt corrompue : oui (proposé) ou non.
   → **Tranché : non.** À la place, des perchoirs au bout de lianes dans trois zones facultatives
   (cime cachée, grotte de la lisière, racines suspendues).
4. **Forêt sombre 1 élargie de 512 px** pour le gouffre aux lianes (proposé). Autre solution sans
   l'élargir : une corniche haute avec une entrée de grotte « E : entrer » (une porte) atteinte par
   les lianes. → **Gardé : élargie de 512 px.**
5. **L'aigle ouvre aussi le gouffre** de la forêt sombre 1 en planant (proposé : accepté). Pour
   exiger les lianes, il faut un gouffre plus large ou un plafond bas. → **Gardé : l'aigle passe aussi.**
6. **Contenu d'après la démo** (gardien du grand cocon, singe de la couronne au papillon) : garder ?
   → **Gardé.**
7. **Appât de la pieuvre** (lueur au fond du marais) : garder ou retirer. → **Gardé.**
8. **Canopée malade** (10e zone) : garder ou couper. → **Gardée.**
9. **Générosité** : ≈ 440 éclats disponibles pour une boutique à 15-30 ; diviser les coffres par 1,5 ?
   → **Tranché : éclats tels quels** (prix inchangés : baie 15, sève 20, corde 30).
10. **Ennemis soignés** : rapportent autant d'éclats que les ennemis vaincus (proposé) ?
    → **Tranché : 0 éclat** pour un ennemi soigné (réglage du système gardé, § 3.2).

## Annexe — ids

- **Scènes** : `GrotteLisiereScene`, `GaleriesRacinesScene`, `CercleLuneScene`, `CimeCacheeScene`,
  `IleDesVentsScene`, `IleDuGardienScene`, `MaraisBrumesScene`, `RacinesSuspenduesScene`,
  `NidCoconsScene`, `CanopeeMaladeScene`.
- **Objets** : `pepin_sac`, `loupe_tamarin`, `corde_tressee`, `fleur_lune_marais`,
  `fleur_lune_cercle`, `fleur_lune_gardien`.
- **Cœurs** : `coeur_grotte`, `coeur_cime`, `coeur_gardien`, `coeur_ecaille` (+ `coeurBonusForet`).
- **Coffres** : `coffre_grotte_sanctuaire`, `coffre_grotte_racine`, `coffre_galeries_meute`,
  `coffre_galeries_terrier`, `coffre_cercle`, `coffre_cime_tronc`, `coffre_vents`, `coffre_gardien`,
  `coffre_marais_saule`, `coffre_racines_nid`, `coffre_nid_alcove`, `coffre_nid_grand_cocon`,
  `coffre_canopee`.
- **Cassables** : `bouchon_marais` (clairière, ours), `sol_nid` (forêt corrompue, ours), `mur_niche`
  (grotte, épée), `terrier` (galeries, ours), `rocher_cercle` (ours), `ecorce_cime` (épée), `dalle_vents`
  (épée), `porte_reliquaire` (ours), `racine_morte` (marais, épée), `racine_pourrie` (racines
  suspendues, épée), `ecorce_canopee` (ours).
- **Murs de mousse** : `mur_grotte`, `mur_saule`, `mur_nid`.
- **Drapeaux** : `marchandVu`, `marchandRumeur`, `marchandVisites`, `loupeRendue`, `quetePepin`,
  `queteGeralt`, `queteEcaille`, `nidGardienSoigne`.
- **PNJ / locuteurs** : `tamarin` (sprite `singe_gueri`, variante d'art `tamarin`), `tika`, `pepin`,
  `ecaille` (nouveaux) ; `geralt`, `singe_gueri` (existants).
- **Marchand** : talk `v3_tamarin` (cinématique-fonction), bulle d'appel `v3_tamarin_appel`,
  dialogues `v3_tamarin_rencontre` et `v3_tamarin_loupe`, rumeurs `V3_RUMEURS`.
- **Boutique** : `SHOPS.tamarin`. **Quêtes** : `QUESTS.pepin`, `QUESTS.geralt_corde`, `QUESTS.fleurs_lune`.
