# Legend of Agarica

Jeu-cadeau d'anniversaire : metroidvania-lite 2D, inspiré du personnage DnD "Agarica"
(druidesse, Cercle de la Lune). Voir `Legend_of_Agarica_GDD.md` pour le détail complet
(narratif, DA, bestiaire, roadmap) — ce fichier est un résumé rapide pour chaque session.

## Stack

- JavaScript pur + Phaser 3 (chargé via CDN, pas de build/npm).
- Une seule page HTML jouable directement dans le navigateur (fichier ou lien, sans install).
- Pas de framework, pas de TypeScript, pas de bundler : rester simple, projet solo avec deadline.

## Structure du projet

- `index.html` — page unique : charge Phaser (CDN) puis tous les scripts dans l'ordre
  (LevelKit, StoryKit, data, entités, histoire, scènes, `src/main.js`). Tout est global.
- `src/main.js` — config Phaser + liste des scènes. `?editor` → éditeur de niveaux,
  `?zone=foret_sombre_1&flags=xaraMet,…` → démarre directement une zone.
- `src/utils/LevelKit.js` (construction d'une zone depuis ses données, sol, combat, HUD) et
  `src/utils/StoryKit.js` (dialogues, cinématiques, sauvegarde, inventaire, PNJ, déclencheurs…).
- `src/data/<zone>_data.js` (données de zone écrites à la main), `src/scenes/` (une scène
  gabarit par zone + Boot/Title/Prologue/EndScreen/menus), `src/entities/`, `src/story/`
  (scripts d'actes et de boss : `acte1.js`, `acte1_arbre.js`, `acte2.js`, `boss_*.js`).
- `assets/` — art ; `docs/production/` — **PLAN_DEV.md (contrat d'API, fait foi)**,
  ARCHITECTURE.md, COMPTE_RENDU.md, INVENTAIRE_ASSETS.md ; `histoire/` — narration.

### Tuiles de terrain : deux jeux interchangeables

`AUTOTILE_TILESET` dans `src/utils/LevelKit.js` bascule entre les deux (seul mot à
changer) ; chaque jeu décrit sa disposition dans `AUTOTILE_TILESETS` :

- `'floor'` — le jeu d'origine (IA), `assets/decors/autotile_frames/`, découpé de
  `floor.png` par `tools/crop_autotile.py`. Disposition `'blob'` (21 fichiers `dirt_*`),
  herbe dessinée dans la tuile, hitbox d'herbe aux 3/4 (on marche 16 px sous le haut).
- `'tuiles'` (actif) — pixel art dessiné à la main : `assets/decors/tuiles.png` est un ATLAS
  6x6 de cases de 24 px (repères : `docs/production/tuiles_reperes.png`), découpé en cases
  nommées (A1..A9, B, C1..C7, D1..D6, herbes) dans `assets/decors/tuiles_frames/` par
  `tools/cut_tuiles.py`. Disposition `'atlas'` (`atlasTileFor` = règles de l'utilisateur) :
  cases pleines, on marche sur le haut de la case, herbe en image séparée sans hitbox qui
  dépasse du bord. **Relancer le script après toute retouche de `tuiles.png`.**
  Contrôle visuel : `docs/production/tuiles_rendu.png`.

Jeux des biomes (clé de zone `tileset`, `TILESET_MANIFEST`, importés par
`tools/import_codex_assets.py`) : toujours en `'blob'`, images remontées pour garder la
ligne de marche du jeu par défaut. Hauteur de marche : `448 + GROUND_STAND_SINK` (0 avec
`'tuiles'`, 16 avec `'floor'`), jamais `464` ni `+ 16` en dur.

## Gameplay et histoire (démo, voir docs/production/PLAN_DEV.md)

- Démo complète en **16 zones** (2 actes) : bosquet → forêt sombre 1-2 → racines du grand
  arbre → arène de Kainati (boss épargné) → monde spirituel → épreuve du singe (optionnelle)
  → forêt flottante 1-2 → clairière de la plante → hutte de Morgat → forêt corrompue →
  arène de Ghil't (défaite imposée) → trou sombre → Ghil't phase 2 (soin) → retour au
  bosquet → écran de fin. Anciennes zones de test (Zone1-5, SousGrotte, ZoneAquatique,
  Zonetest) intactes, via le titre « Zones de test ».
- Contrôles : flèches / QD, saut Z/↑/Espace (double saut de base), Shift sprint, S piqué /
  lâcher, K ou clic attaque, E interagir, A/F/R compétences, I inventaire, M carte.
- **Formes** débloquées par l'histoire, automatiques (jamais un bouton) : sol = **Loup**
  (sprint, pistes, plateformes cachées), aérien = **Singe** (lianes) OU **Aigle** (plané,
  courants d'air) au choix, eau = **Pieuvre**. **Compétences** (énergie) : ours, pierre,
  papillon (soigne les corrompus). **Feux de camp** : soin, sauvegarde, menu formes /
  compétences / totems (monde gelé).
- **Compagnon Xara** (araignée) : suit Agarica, parle, pas de combat.
- **StoryKit** : nouvelles clés de zone (npcs, triggers, pickups, mossBlocks, vines,
  checkpoints, fall, script…), `CUTSCENES`/`DIALOGUES`, sauvegarde localStorage auto.
- **Art Codex** : tout élément sans image s'affiche en placeholder. Après toute génération
  d'images (manifest `src/data/asset_manifest.js`), lancer
  `python tools/import_codex_assets.py` (régénère `src/data/asset_present.js`).
- **Tests** : `python tools/playtest.py --port 88xx --scene ForetSombre1Scene --flags
  xaraMet=true --keys "ArrowRight:1500" --js "…" --shot x.png` (Edge headless, code de
  sortie 1 si erreur JS). Ne pas utiliser `tools/dev_server.py` pour tester : son Save
  réécrit les fichiers de zone.

## Direction artistique

Silhouettes sombres façon Hollow Knight, palette réduite : violet nuit / vert lunaire /
touches de rose (clin d'œil au tatouage d'Agarica). Pas d'animation dessinée à la main
complexe — formes géométriques stylisées, silhouette + contour lumineux.

## État et suite

Histoire de la démo entièrement construite et jouable de bout en bout. Reste (voir
COMPTE_RENDU.md) : playtest humain complet + équilibrage, art Codex restant, son/musique.

## Conventions de travail

- Respecter le contrat d'API de PLAN_DEV.md (rétro-compatible) ; données de zone écrites à la
  main, compatibles éditeur ; commentaires en français expliquant le « pourquoi ».
- Rester dans le budget technique du GDD (pas de vraie IA d'ennemis, pas de grande carte)
  sauf demande explicite.
- Tester avec le harnais (toutes les scènes doivent sortir en code 0) et dans le navigateur
  avant de passer à la suite.
