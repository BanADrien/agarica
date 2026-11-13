---
name: son
description: Trouver ou fabriquer un son pour Legend of Agarica (bruitage, son d'interface, ambiance, musique) avec les trois outils du projet, Openverse (sons CC0 à télécharger), earshot (écouter, comparer, fabriquer par code) et real-sfx (78 sons d'interface CC0, recherche dans assets/audio). À utiliser dès qu'il est question de son, de bruitage, de musique ou de `playSfx`, avant de télécharger ou de fabriquer quoi que ce soit.
---

# Trouver ou fabriquer un son du jeu

Le jeu est muet. Ces outils servent à remplir `assets/audio/` ; mode d'emploi complet et
installation sur un autre PC : `docs/production/SON_OUTILS.md`. Tout se lance depuis la racine.

## Règles de l'utilisateur

- **Trois versions vraiment différentes d'abord.** Pour chaque son demandé : trois candidats de
  natures différentes (par exemple un enregistrement CC0, un son fabriqué par code, un son d'une
  autre famille), pas trois prises du même. Les poser dans un dossier temporaire hors du projet,
  donner leurs chemins complets avec, pour chacun, sa source et la lecture d'earshot en une
  ligne. **Attendre son choix** avant de ranger quoi que ce soit dans `assets/audio/`.
- **CC0 uniquement** pour tout son téléchargé. `openverse.py` refuse le reste ; ne pas contourner.
- **Chaque son rangé a sa ligne** dans `assets/audio/CREDITS.md` (fichier, source, auteur,
  licence, page ou commande).
- Tu n'entends pas : ne dis jamais comment sonne un fichier sans une lecture d'earshot, et cite-la.

## Les commandes

| Besoin | Commande |
|---|---|
| Chercher un enregistrement CC0 | `python tools/son/openverse.py chercher "sword swing" --max 8 [--duree-max 3]` |
| Télécharger un essai (hors projet, non inscrit) | `python tools/son/openverse.py telecharger <identifiant> --vers C:/…/Temp/agarica_son/essais/dague_a` |
| Ranger le son retenu (inscrit au registre) | `python tools/son/openverse.py telecharger <identifiant> --vers assets/audio/sfx/slash [--debut 0.2 --fin 0.6]` |
| Fabriquer un son par code (banque de 252) | `earshot sfx list --kind whoosh` puis `earshot sfx render swish/blade -o C:/…/x.wav [--dur 0.3] [--pitch E5] [--seed 2]` |
| Ce que le son est vraiment | `earshot describe x.wav` ; `earshot match x.wav "a fast blade swish" --alts "a snare hit"` |
| Classer des candidats | `earshot rank "a wolf bite snap" C:/…/essais/ --top 3` ; `earshot ab a.ogg b.ogg --query "…"` |
| Couper le bon moment d'un long fichier | `earshot find long.ogg "a single wolf growl" --top 3` (donne début et fin) |
| Niveaux exacts (sans modèle, 3 s) | `earshot measure x.wav` |
| Sons d'interface (78 sons, 12 styles) | `python .claude/skills/real-sfx/scripts/search.py --uisfx [success]` |
| Chercher dans les sons déjà rangés | `python .claude/skills/real-sfx/scripts/build_index.py` puis `… search.py --query "loup"` |
| Inscrire un son fabriqué ou d'interface | `python tools/son/openverse.py noter assets/audio/sfx/jump.ogg --source "earshot sfx render ui_pop/soft --seed 2"` |
| Enlever un son et sa ligne | `python tools/son/openverse.py retirer assets/audio/sfx/jump.ogg` |

Les mêmes fonctions d'earshot existent en outils MCP (`describe`, `match`, `rank`, `find`, `ab`,
`measure`, `sfx_list`, `sfx_render`…, chemins absolus) : à préférer dès qu'il y a plus de deux
ou trois écoutes, les modèles restent chargés (quelques secondes l'appel, contre 15 s et plus en
ligne de commande).

## Démarche pour un son

1. Décrire le son lui-même en anglais (source, matière, geste : « a short dagger swish through
   the air »), pas son rôle (« son d'attaque »). Openverse cherche dans les titres : mots simples.
2. Réunir les candidats : Openverse, banque d'earshot (`sfx render`, plusieurs `--seed`), sons
   d'interface (`vendor/node_modules/uisfx/sounds/<style>/<son>.mp3` du skill real-sfx).
3. Les écouter avec earshot et écarter ce qui ne colle pas (un `swish/blade` raccourci à 0,3 s
   est lu « a snare hit » : la banque vise les films, pas les jeux, donc toujours vérifier).
4. Proposer les trois, attendre le choix.
5. Ranger le son retenu en `.ogg` sous le nom de son identifiant `playSfx`
   (`assets/audio/sfx/slash.ogg`), dans `sfx/`, `ui/`, `ambiances/` ou `musique/`. Un `.wav` ou
   un `.mp3` se convertit par `ffmpeg -i x.wav -c:a libvorbis -q:a 5 assets/audio/sfx/slash.ogg`,
   puis `openverse.py noter` (pour un son uisfx : `--origine "uisfx" --licence "CC0 1.0"
   --source https://uisfx.com`).

## Branchement dans le jeu (reste à faire)

Le jeu appelle déjà `playSfx(id, opts)` partout, mais `SFX_HOOKS` (`src/utils/LevelKit.js`) est
vide : il n'y a ni chargement des fichiers ni moteur de son. Ranger un fichier ne le fait donc
pas encore entendre. Identifiants appelés (à rafraîchir par `grep -rn "playSfx(" src/`) :

- **Joueur** : `jump` `jump_air` `land` `pogo` `slash` `slash_obstacle` `hit_blocked`
  `player_hurt` `heart_lost` `heart_up` `energy_full` `flight_takeoff` `feather_shot`
  `vine_grab` `vine_release` `wolf_bite` `wolf_paw` `transform_<forme>` `skill_<compétence>`
  `skill_denied` `ours_slam` `grizzly_crash` `panda_heal` `ice_spike` `purify` `papillon_libere`
- **Ennemis et boss** : `enemy_hit` `enemy_defeat` `boss_end` `crapaud_accroupi` `crapaud_saut`
  `crapaud_gorge` `crapaud_langue` `crapaud_surgit`
- **Monde** : `pickup` `pickup_drop` `eclat_pickup` `eclats_burst` `chest_open` `breakable_hit`
  `breakable_break` `breakable_denied` `moss_crack` `moss_break` `moss_melt` `platform_reveal`
  `lantern_light` `totem_activate` `form_unlock` `campfire_rest` `zone_exit`
- **Interface** : `menu_move` `menu_ok` `overlay_open` `shop_buy` `dialogue_line`
  `dialogue_blip` `dialogue_next` `dialogue_choice` `banner` `title_card`

## Pièges

- Un terminal ou une session ouverts avant l'installation ne voient ni `earshot` ni `ffmpeg` :
  rouvrir. Les outils MCP n'apparaissent qu'après accord de l'utilisateur au démarrage.
- earshot charge le processeur : jamais pendant un test du jeu (navigateur sans fenêtre) ni
  pendant un autre agent. `earshot forge` (recherche d'un son neuf, plusieurs minutes) : seulement
  si la banque ne donne rien, et en prévenant l'utilisateur.
- API d'Openverse : 20 requêtes par minute, 200 par jour. Une recherche bien formulée plutôt que dix.
- Les skills `real-sfx` et `real-sound` sont écrits pour sonoriser des **vidéos** : n'en prendre
  que la recherche, les sons d'interface et les règles de licence, pas leur chaîne de mixage.
