# Compte rendu — développement de la démo (session du 2026-10-01)

Branche : `feature/demo-histoire` (la branche `main` n'est pas touchée).
Commits : `ff69a1b` (checkpoint de ton travail en cours avant de commencer), `747ccad` (vague 1), puis le commit de la vague 2 (interrompue à ta demande, voir plus bas).

Docs de travail : `docs/production/PLAN_DEV.md` (plan + contrat d'API, la référence), `ARCHITECTURE.md`, `INVENTAIRE_ASSETS.md`.

## Comment lancer / tester

- Jeu : `python tools/dev_server.py` puis `http://localhost:8791/index.html`. Titre → Nouvelle partie / Continuer / Zones de test (les anciennes zones Zone1…Zone5 sont intactes).
- Aller directement à une zone : `index.html?zone=foret_sombre_1&flags=xaraMet,hasWolfForm`.
- Test automatique sans navigateur : `python tools/playtest.py --scene BosquetScene --wait 3 --shot x.png` (Edge headless, sort en erreur s'il y a une erreur JS).
- Triche : Ctrl+Shift+D (débloque toutes les formes et compétences).

## FAIT (vague 1, commitée et testée)

**Images à générer par Codex**
- `CODEX_SPRITES_A_GENERER.md` : 77 éléments, classés par priorité (P1/P2/P3), chacun avec son prompt en anglais prêt à coller, le chemin de sortie, la taille et la disposition des frames.
- `src/data/asset_manifest.js` : le manifest des éléments à générer.
- `tools/import_codex_assets.py` : découpe et range automatiquement les images générées. **Le relancer après chaque génération**, sinon le jeu ne charge pas les nouvelles images (il régénère `src/data/asset_present.js`).
- En attendant les images, chaque élément s'affiche comme un rectangle coloré avec son nom. Le jeu se joue à l'identique avant et après les images.

**Fondation** (`src/utils/StoryKit.js` + scènes)
- Dialogues : portraits, effet machine à écrire, choix.
- Cinématiques : environ 30 types d'étapes (déplacer un PNJ, caméra, donner un objet, débloquer une compétence…).
- Sauvegarde automatique dans le navigateur (localStorage) et bouton Continuer.
- Inventaire (touche I) et carte de Galter (touche M).
- Écran-titre, prologue et écran de fin.
- Barre de vie de boss et petits messages à l'écran.
- Nouvelles clés de données de zone : PNJ, déclencheurs, objets à ramasser, amas et murs de mousse, chutes, scripts de zone, checkpoints, fonds et ambiance colorée.
- Bugs corrigés :
  - le Loup Alpha mourait en un coup ;
  - le monde n'était pas figé pendant les menus ;
  - le jeu continuait sur l'ancien joueur après le redémarrage d'une scène ;
  - le chargement prenait 30 s (il prend maintenant environ 2 s).

**Formes et compétences**
- Formes au sol (loup), dans les airs (singe OU aigle, au choix au feu de camp) et dans l'eau (pieuvre).
- Double saut de base, sans transformation.
- Singe : s'accroche aux lianes et se balance.
- Aigle : planage et courants d'air.
- Loup : perçoit les pistes et révèle des plateformes cachées.
- Compétences pierre (talisman du singe) et papillon (soigne les créatures corrompues).
- Menu du feu de camp refait.

**Boss**
- Kainati : arène dans les lianes, 2 phases, épargné à la fin, ce qui ouvre les passages.
- Ghil't :
  - phase 1 ;
  - défaite imposée ;
  - trou sombre : papillons, bocal d'antidote, totem de poche → compétence papillon ;
  - phase 2 : soin de Ghil't, Amanite l'achève, Galter arrive.

**Ennemis et animaux**
- Ennemis : loup sanguinaire, araignée, corbeau, crapaud, Loup Alpha, plus 3 corrompus qu'on peut soigner (créature de mousse, singe corrompu, crapaud corrompu).
- Animaux : 3 bébés cochons, 3 poissons, nuées de papillons.

## Vague 2 (interrompue à ta demande)

Toutes les scènes se chargent sans erreur JS : titre, anciennes zones, toutes les zones de l'histoire, éditeur.

### Éditeur — FAIT et testé
- **Sauvegarde sûre** (`tools/dev_server.py`) :
  - une scène existante n'est jamais réécrite ;
  - une copie de sécurité horodatée est faite dans `src/data/_backup/` (ignoré par git) ;
  - la sauvegarde est refusée si des clés de la zone disparaîtraient ;
  - seul `const X_DATA = {...}` est remplacé.
- L'éditeur conserve les clés qu'il ne sait pas éditer (`script`, `kainatiArena`, `ambient`…).
- Nouveaux outils, dans le menu « Plus d'outils (histoire) » : PNJ, déclencheur, objet, amas et mur de mousse, checkpoint, toile, liane, piste de loup, plateforme cachée, courant d'air, animaux. Tous les types d'ennemis sont disponibles.
- Panneau « Propriétés de la zone » (nom, fond, tileset, Xara, script, tallLevel) et menu « Charger une zone ».
- Bouton « Oublier le brouillon » dans l'écran Zones.
- Le portail avec équivalence de hauteur (todo_me) était déjà fait.

### Acte 1 (`src/story/acte1.js`) — PARTIEL
- **FAIT : `bosquet`, jouable de bout en bout.**
  - PNJ du village : Bran, Tilda, Sauge, Orme, le père, la garde.
  - Les 3 cochons et un tutoriel discret.
  - Séquence d'aide : gratter 3 plaques de mousse, échec sur l'amas, une créature de mousse surgit.
  - Le père donne le talisman de l'ours, puis le vol de l'idole (avec un choix) et le bannissement → forêt sombre 1.
- **À FAIRE : zones 2 à 7, encore des squelettes à sol plat.** Plans prévus par l'agent :
  - **`foret_sombre_1`** :
    - entrée `from_bosquet` et désespoir d'Agarica ;
    - PNJ Xara (`{id:'xara', sprite:'xara_extra'}`), indices sur Maexxna, puis `{xaraJoin:true}` ;
    - un amas `mossBlocks` coincé sous un mur de racines qui monte jusqu'en haut de l'écran ;
    - un déclencheur « le talisman réagit » : `{skill:'ours'}` et énergie remplie (l'ours coûte 35, l'énergie démarre à 0) ;
    - une `mousse_creature` et un feu de camp ;
    - sortie vers `from_foret_sombre_1`.
  - **`foret_sombre_2`** :
    - un ravin de 5 tuiles (franchissable seulement en loup) avant le totem du loup ;
    - un ravin de 9 tuiles avec `hiddenPlatforms` et `tracks` ;
    - la mare aux 3 poissons, dessinée par le script : la clé `water` blesse Agarica sans la pieuvre ;
    - la plante perchée hors d'atteinte (`planteVue`) ;
    - le mur `mur_repulsif_foret_sombre` avec un secret +1 cœur ;
    - entrées `from_foret_sombre_1`, `from_racines` et **`from_hutte_morgat`** (demandée par l'acte 2), plus une sortie vers `HutteMorgatScene` `{enterId:'from_foret_sombre'}`.
  - **`grand_arbre_racines`** :
    - `tallLevel`, tunnels, `singe_corrompu`, pierres qui tombent, feu de camp ;
    - lianes menant à l'épreuve du singe (accessible seulement en singe) ;
    - sortie vers l'arène `from_racines` ; entrées `from_arene`, `from_foret_sombre`, `from_epreuve`.
  - **`monde_spirituel`** :
    - `KainatiEsprit.guide(...)`, `{form:'hasMonkeyForm'}` et explications singe/aigle ;
    - lianes au-dessus d'un vide (`fall: respawn` + `checkpoints`) ;
    - retour vers l'arène `from_monde_spirituel`.
  - **`epreuve_singe`** :
    - course de lianes avec checkpoints ;
    - talisman du singe en haut → `talismanSinge` + `{skill:'pierre'}` ;
    - retour vers les racines.
  - Les dialogues de Kainati (`kainati_intro`, `kainati_victoire`, `kainati_calme`) sont encore les textes par défaut, qui sont corrects. Ne pas ajouter de `vines` à l'arène : le script du boss les lit déjà.
- **Mesures de saut** (pour faire les niveaux) :
  - saut simple : 172 px de haut, environ 175 px de portée ;
  - double saut de base : 245 px ;
  - saut en sprint loup : environ 363 px de portée ; double saut en sprint loup : environ 514 px.

### Acte 2 (`src/story/acte2.js`) — ÉCRIT, PEU TESTÉ
- Zones 8 à 16 construites avec un vrai level design, dialogues et cinématiques :
  - forêt flottante 1 : Galter, son duel comique et la carte ;
  - forêt flottante 2 : totem de poche, Amanite, totem de l'aigle, courants d'air ;
  - clairière de la plante, puis hutte de Morgat : fleur → répulsif, puis le crash ;
  - forêt corrompue : réveil, note de Galter, amas à l'ours, mur à ouvrir au répulsif ;
  - retour au bosquet et fin.
- Les dialogues de Ghil't et du trou sombre ont été réécrits.
- **Testé jusqu'au bout : seulement `bosquet_retour`** (cinématique finale → écran de fin). Les autres zones se chargent sans erreur, mais n'ont pas été jouées.
- **À vérifier en priorité** :
  - le duel de Galter ;
  - le saut vers le totem de l'aigle et les planés de la forêt flottante 2 ;
  - l'arrivée en plané dans la clairière ;
  - la cinématique du crash jusqu'à la forêt corrompue ;
  - l'amas et le mur de la forêt corrompue ;
  - l'enchaînement forêt corrompue → arène → trou → arène → retour au bosquet.
- **Risques connus** : avec l'aigle, Agarica peut sortir par le haut de l'écran (la caméra ne défile pas verticalement) ; le voile de ciel de jour reste à vérifier visuellement.

## RESTE À FAIRE

1. **Acte 1, zones 2 à 7** (plans ci-dessus). C'est le seul vrai trou du parcours : pour l'instant on passe du bosquet à des zones à sol plat sans contenu.
   Vérifier ensuite l'acte 2 (liste ci-dessus).
2. Faire un playtest complet de bout en bout (titre → fin) par une personne, puis équilibrer : difficulté des boss, hauteurs de saut.
3. Générer les images avec Codex (`CODEX_SPRITES_A_GENERER.md`), puis lancer `python tools/import_codex_assets.py`. Après l'import, ajuster le placement de Kainati suspendu à la liane et l'orientation de Ghil't.
4. Son et musique : rien n'est fait (voir `histoire/MUSIQUE_ET_AMBIANCES.md`).
5. Mettre à jour `CLAUDE.md` : la roadmap des 10 tickets est dépassée par l'histoire actuelle.
6. Éléments mineurs :
   - pas de pose dédiée pour grimper aux lianes ;
   - un brouillon IndexedDB de l'éditeur écrase le fichier de zone au lancement (vider les brouillons si une zone ne change pas) ;
   - les anciennes zones de test ne sont plus dans le parcours principal.
