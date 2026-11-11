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

- Démo complète en **15 zones** (2 actes) : bosquet → forêt sombre 1-2 → racines du grand
  arbre (totem du singe allumé = forme singe, comme les autres totems) → arène de Kainati
  par les lianes (boss épargné) → épreuve du singe (optionnelle, depuis les racines) → forêt
  flottante 1-2
  → clairière de la plante → hutte de Morgat → forêt corrompue →
  arène de Ghil't (défaite imposée) → trou sombre → Ghil't phase 2 (soin) → retour au
  bosquet → écran de fin. Le monde spirituel n'est plus sur le chemin (décision du
  2026-10-25 : pas de phase avec l'esprit simien) ; ses fichiers restent. Anciennes zones de
  test (Zone1-5, SousGrotte, ZoneAquatique, Zonetest) intactes, via le titre « Zones de test ».
- Contrôles :
  - flèches / QD pour se déplacer ;
  - saut **Espace seul**, à hauteur variable (relâcher tôt = petit saut ; un seul saut sans
    forme aérienne) ;
  - Z/↑ vise en haut ; en singe, près d'une liane, cette touche sert à **s'accrocher** (la prise
    n'est plus automatique) ;
  - S/↓ vise en bas en l'air : le coup vers le bas fait rebondir, et en loup c'est un coup de
    patte ;
  - **[Maj] tenue = loup**, même à l'arrêt ; en avançant, le loup sprinte ;
  - K ou clic : attaque en arc dans la direction visée ;
  - E interagir, A/F/R compétences, I inventaire, M carte, Échap/P pause.
- **Priorités** : chaque demande est classée P1-P4 dans `docs/production/PRIORITES.md` ; petits
  paquets, version testable donnée vite avec la liste des modifications.
- **Formes** débloquées par l'histoire, automatiques (jamais un bouton) : sol = **Loup**
  (sprint, pistes, plateformes cachées), aérien = **Singe** (lianes) OU **Aigle** (plané,
  courants d'air) au choix, eau = **Pieuvre**. **Compétences** (énergie) : ours, pierre,
  papillon (soigne les corrompus). Le papillon n'est QU'une compétence (décision
  utilisateur du 2026-10-24) : ce n'est pas une forme aérienne et il ne remplace
  pas le double saut. **Feux de camp** : soin, sauvegarde, menu formes /
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
- **Pixel art (pixel-fixer)** : `tools/pixel-fixer` est un sous-module git (dépôt
  BanADrien/pixel-fixer, `git submodule update --init` puis `npm install` dedans ; mise à
  jour : `git submodule update --remote tools/pixel-fixer`). `node tools/pixelfix.js anim
  <id>` / `item <id>` / `files <dossier> --height 32` refait des images IA en pixel art
  SANS changer leur fichier, leur canvas ni l'alignement des frames (blocs de pixels ;
  originaux dans `assets/_pixelfix_originals/`, `restore <id>` pour revenir).
  Toujours regarder d'abord avec `--preview x.png` (n'écrit rien d'autre). Registre :
  `src/data/pixel_fixed.js` (filtre net en jeu, protégé de `import_codex_assets.py`).
  **Format retenu (2026-11-10, Agarica refaite dans le jeu)** : idle d'Agarica = **92 pixels
  dessinés** de haut (64 validé d'abord ; 1 pixel ≈ 0,9 px du canevas 960x540), même taille de pixel à l'écran pour
  toutes les feuilles (facteur = densité / échelle réelle d'affichage de la feuille),
  20 couleurs par feuille, lignes pixel-perfect, contours d'après l'encre de l'original.
  **Tuiles des biomes** (écorce, flottantes, corrompues) refaites le 2026-11-11 : **48 pixels
  dessinés par case** (entre-deux choisi par l'utilisateur : 64 essayé avant ; 24 comme `tuiles.png`
  manquait de détails pour l'utilisateur), 20 couleurs, raccords gardés (mode tuile) :
  `node tools/pixelfix.js tiles tuiles_ecorce tuiles_flottantes tuiles_corrompues --colors 20 --tile-px 48`.
  Comparaison 24/32/48/64 : `docs/production/apercus/tuiles_24_32_48_64.png`.
  **Troncs et branches du grand arbre** : pixelisés EN JEU, après assemblage, par pixel-fixer
  lui-même (BrancheKit `branchePixelFixer` ; `src/vendor/pixelclean-core.js` = copie de
  `tools/pixel-fixer/pixelclean-core.js`, à recopier après chaque mise à jour de l'outil).
  `BRANCHE_PIXEL` = 4 px du monde, palette d'écorce de 14 couleurs, contour propre et lignes
  pixel-perfect. Les six pièces de `assets/decors/elements/` restent l'art d'origine : les
  pixeliser une à une donnait un grain différent selon l'épaisseur. Coût : ~1 à 3 s de plus à
  la première entrée dans une zone du grand arbre (textures gardées ensuite).
  Référence : `node tools/pixelfix.js agarica --height 92`. Les autres personnages se
  calent sur cette densité. Ne refaire d'autres images qu'avec l'accord de l'utilisateur.

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
