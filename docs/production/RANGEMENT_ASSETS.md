# Rangement du dossier assets/

Validé par l'utilisateur le 2026-11-17 : « ok valide, lance le rangement ».

## Pourquoi

- `assets/` pèse 435 Mo et mélange les images du jeu avec des sources qu'il ne charge pas.
- `sprites/` contient 118 éléments à plat, tous types confondus.
- Plusieurs noms posent problème : `déco item`, `compétence`, `feu de camp.png`, `image.png`,
  `_marche_avant_codex`, `petites`.

## Structure cible

```
assets/                 ← seulement ce que le jeu charge
  personnages/          Agarica, Xara, PNJ (père, habitants, Morgat, Geralt, Amanite, Clak, cochons…)
  formes/               formes et compétences d'Agarica : loup, singe, aigle (piaf), pieuvre, ours,
                        papillon, crapaud ; transformations
  ennemis/              araignées, crapauds, loups sanguinaires, singes corrompus, créatures de mousse…
  boss/                 Kainati, Ghil't
  decors/               tuiles, fonds, éléments, plantes, arbres, liquides, décors posés (par biome)
  objets/               objets, totems, talismans, feu de camp
  interface/            HUD, cadres, portraits, icônes de formes et de compétences, popup de déblocage
  effets/               effets animés (vfx) et particules
  audio/                inchangé (déjà rangé)
sources/                ← à la racine du dépôt, HORS du jeu
  codex/                ex-assets/_codex_src et assets/_codex_ref
  pixelfix_originaux/   ex-assets/_pixelfix_originals
  planches/             les planches d'origine que le jeu ne charge pas (découpées par les outils en
                        dossiers de frames)
```

## Règles

- **Un dossier par personnage, animal ou objet.** Exemple : `assets/personnages/agarica/`, avec dedans
  ses dossiers d'animations (`repos/`, `marche/`…) ou les frames telles quelles. Le découpage fin est
  libre, tant qu'il est cohérent partout.
- **Noms** : minuscules, sans espaces ni accents, mots séparés par `_`.
- **Une image que le jeu charge reste dans `assets/`.** Avant de mettre une planche dans
  `sources/planches/`, vérifier qu'aucun code du jeu ne la charge (le manifeste
  `src/data/asset_manifest.js` en charge certaines directement).
- **Les dossiers `_lumiere/`** (éclairage par sections) suivent leur sprite.
- **Le miroir de pixel-fixer** (`pixelfix_originaux/`) garde la même arborescence que les nouvelles
  images, sinon `node tools/pixelfix.js restore` ne retrouve plus les originaux.
- **Déplacer avec `git mv`**, pour garder l'historique de chaque fichier.
- **Une table de correspondance** ancien → nouveau chemin est écrite dans
  `docs/production/rangement_assets.tsv`, et le script qui fait le rangement est gardé dans
  `tools/ranger_assets.py`. Le déplacement doit pouvoir se refaire ou se défaire.

## Ce qu'il faut mettre à jour

- **Les chemins cités par le code** : environ 3 400, dans 63 fichiers. Ils sont dans `src/`, `tools/`,
  `index.html` et `carte.html`.
- **Les fichiers générés** :
  - `asset_present.js` : relancer `tools/import_codex_assets.py` ;
  - `pixel_fixed.js` ;
  - `sections.js` : clés et dossiers de cartes ;
  - `branches_pixel.js`.
- **Les outils** :
  - `tools/build_netlify.py` : `SKIP_ASSET_DIRS`, et `sources/` ne doit pas partir en ligne ;
  - `pixelfix.js`, `pixelfix_*.sh` et `pixelfix_decors.py` ;
  - `sections.js` ;
  - les scripts de découpe `crop_*.py` et `cut_*.py` ;
  - `codex_prompt.py` et les prompts Codex qui donnent des chemins de sortie.
- **La documentation** : `docs/production/*.md` et les skills du projet, pour les chemins qu'ils
  donnent. `CLAUDE.md` sera mis à jour par la conversation principale, avec la liste des chemins
  changés.

## Preuve que rien ne manque

- **Contrôle statique.** Chaque chemin `assets/…` cité par le code existe sur le disque. Aucune image
  de `assets/` ne doit être citée nulle part, sauf celles qui l'étaient déjà avant ; à lister.
- **Contrôle en jeu.** Aucune image ne doit échouer au chargement (404) dans aucune scène.
  Attention : `tools/verif.py` range les « Failed to load resource » dans le journal, pas dans les
  erreurs. Il faut donc les compter à part, avant et après le rangement, et le nombre ne doit pas
  augmenter.
- **Les vérifications habituelles :**
  - `python tools/verif.py` avec le robot complet (`--robot tout`) ;
  - `npm run lumiere:tests` ;
  - une capture de 3 ou 4 zones, à comparer avant et après.
