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
- Inventaire (touche I) et carte de Geralt (touche M).
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
  - phase 2 : soin de Ghil't, Amanite l'achève, Geralt arrive.

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

## Vague 3 (2026-10-05) — commit `5a1c67c`

### Acte 1 — FAIT, joué de bout en bout par script
- **Forêt sombre 1** :
  - désespoir d'Agarica (pose triste) et rencontre avec Xara (indices sur Maexxna) ;
  - amas de mousse, le talisman révèle la compétence de l'ours ;
  - créature de mousse et feu de camp.
- **Forêt sombre 2** :
  - ravin franchissable seulement en loup, totem du loup ;
  - grand ravin avec plateformes cachées et pistes du loup ;
  - mare aux 3 poissons, plante perchée (`planteVue`) ;
  - mur au répulsif → secret +1 cœur et chemin vers la hutte de Morgat.
- **Racines du grand arbre** : zone verticale, pierres qui tombent, singes corrompus, feu de camp, lianes vers l'épreuve.
- **Arène** : textes de Kainati réécrits ; le dialogue « calme » change selon la progression.
- **Monde spirituel** : l'esprit de Kainati guide le joueur et donne la forme singe.
- **Épreuve du singe** (optionnelle) : course de lianes avec checkpoints → talisman du singe et compétence pierre.

### Acte 2 — FAIT, joué de bout en bout par script (8 bugs corrigés)
- Geralt et son duel, carte, îles, Amanite, totem de l'aigle, planés, clairière, Morgat, crash, forêt corrompue, Ghil't (chute, trou sombre, soin, Amanite), retour au bosquet, écran de fin.
- Corrections principales :
  - blocage à la fin du duel ;
  - Agarica sortait par le haut de l'écran ;
  - les chutes dans le vide ne se déclenchaient jamais (corrigé pour tout le jeu) ;
  - une mort pendant le combat contre Ghil't ne relançait plus la phase.
- La sauvegarde et le bouton « Continuer » ont été vérifiés.
- **Limite des tests** : ils ont été joués par un robot, pas par une personne. Les combats ont été traversés avec les dégâts sur Agarica désactivés.

### Images Codex (en cours de production par l'utilisateur)
- Importées et branchées :
  - `agarica_extra` p1-p2 (saut, blessure, mort, parole, tristesse, avec les poses automatiques en dialogue et cinématique) ;
  - Xara (`xara_extra`, à refaire : marges trop justes), le père, Amanite, Geralt, Morgat ;
  - Kainati en cours.
- Suivi de Codex : `docs/production/RAPPORT_CODEX.md`.

### Correctifs moteur — EN COURS
1. Agarica se coince contre une paroi de 2 cases.
2. L'attaque au corps à corps ne touche que si les corps se chevauchent.
3. L'invulnérabilité après un coup est trop courte (une salve de Kainati peut tuer d'un coup).
4. Une liane saisie en montant donne un balancier trop court.
5. Réglages de la forêt flottante 1.
6. Les messages à l'écran recouvrent les invites « E : … ».
7. Contraste de la clairière.
8. Mise à jour de CLAUDE.md.

### Correctifs moteur — INTERROMPUS (2026-10-05, à ta demande)
- Le travail partiel n'est pas testé, donc il a été mis de côté sur la branche `wip/correctifs-moteur` (commit `f830795`).
- La branche `feature/demo-histoire` reste sur le code testé, pour ton playtest.
- Pour reprendre : `git switch wip/correctifs-moteur`, vérifier et tester, puis fusionner.
- Les 8 points de la liste plus haut restent ouverts, sauf la mise à jour de CLAUDE.md, qui est faite.

## Vérification de l'histoire (2026-10-06) — agent Histoire & art

### Méthode
- La démo a été jouée **du titre à l'écran de fin** par un robot (Edge sans fenêtre), en 10 tronçons enchaînés. Chaque tronçon repart de la sauvegarde du précédent via **« Continuer »** sur l'écran-titre : la reprise a donc été vérifiée à 10 endroits (bosquet → forêt sombre 1 → forêt sombre 2 → racines → arène → forêt flottante 1 → forêt flottante 2 → clairière → hutte → arène de Ghil't). Pilotes : `%TEMP%\histoire\` (`drive.py`, `lib.js`, `c1.js` … `c10.js`, `runall.sh`).
- **Dégâts actifs** du début à la fin, combats de Ghil't (phases 1 et 2) compris : le dernier passage complet n'a utilisé aucune invincibilité. Seule exception : contre Kainati, le robot esquive mal, meurt (la remise à zéro du combat a fonctionné à chaque fois), puis l'invincibilité prend le relais.
- Le robot ne sait pas tout faire. Les passages de plateforme déjà validés lors des vagues précédentes sont parfois franchis par téléportation : lianes du monde spirituel et de l'épreuve du singe, grimpe des racines. Certains ennemis sont aussi retirés quand le robot se battait mal (forêt sombre 2, forêts flottantes).
- Les 18 scènes de l'histoire sortent en code 0 avec `tools/playtest.py`.

### Événements de l'histoire

| # | Événement | État |
|---|---|---|
| 1 | Bosquet : gratter la mousse, elle repousse, la créature sort de l'amas | OK |
| 2 | Le père donne le talisman de l'ours | OK (+ pose `receive_item`) |
| 3 | Vol de l'idole par Amanite (choix couvrir / supplier) | Corrigé : Amanite était à 30 px au-dessus de l'autel, à moitié cachée, et tournait le dos à Agarica |
| 4 | Bannissement, départ par les portes de l'est | OK |
| 5 | Désespoir, rencontre de Xara (petite araignée, Maexxna) | Corrigé : Xara était **invisible**, cachée dans la souche, et le compagnon créé à cet endroit traversait le sol |
| 6 | Le talisman s'éveille : compétence de l'ours, l'amas est brisé | OK (+ pose `cast`) |
| 7 | Totem du loup, ravin de 5 cases, pistes et plateformes cachées | OK (sprint et grand ravin franchis au clavier) |
| 8 | Plante vue (`planteVue`), trois poissons, grand arbre au loin | OK |
| 9 | Racines, pierres qui tombent, Kainati : combat, épargné, sorties ouvertes | OK (art réel, échelle refaite) |
| 10 | Monde spirituel : forme singe, puis retour à l'arène par la porte du totem | OK |
| 11 | Épreuve du singe : talisman du singe et compétence pierre | OK (+ pose `cast`) |
| 12 | Geralt : rencontre, duel (3 coups), carte (M) | OK (+ pose `receive_item`) |
| 13 | Totem de poche cassé (forêt flottante 2) | OK |
| 14 | Amanite retrouvée (dialogue selon le choix du bosquet) | OK |
| 15 | Totem de l'aigle, plané jusqu'à la clairière | OK |
| 16 | Fleur prélevée (une seule) | OK (+ pose) |
| 17 | Morgat prend la fleur et donne le répulsif ; antidote annoncé | OK (+ pose) |
| 18 | Mur de la forêt sombre ouvert au répulsif (aller-retour hutte ↔ poche, +1 cœur) | Corrigé : en passant de la forme humaine au loup contre le mur, **on le traversait sans répulsif** |
| 19 | Crash, forêt corrompue (la mousse se referme, note de Geralt, amas, papillons, spirale, mur vivant) | OK |
| 20 | Ghil't phase 1, défaite imposée, chute dans le trou sombre | OK |
| 21 | Trou sombre : papillons, bocal, totem de poche, compétence papillon | OK (+ poses ; le papillon est sur R quand A et F sont pris) |
| 22 | Phase 2 : Ghil't soigné, Amanite l'achève, Geralt arrive | Corrigé : Amanite et Geralt n'avaient pas d'anim de parole ; Amanite tournait le dos à Agarica et se superposait à elle |
| 23 | Retour au bosquet, vérité, départ d'Amanite, cochons, fin | Corrigé : Clak flottait à 16 px du sol ; puis `demoFinished` et EndScreen OK |

**Rien ne manque** : tous les événements de HISTOIRE_DEMO.md et de PLAN_CARTE_DEMO.md existent et se déclenchent.

### Transitions
Tous les passages ont été testés dans les deux sens. L'arrivée se fait au sol, au bon point d'entrée.
- Aller : bosquet → FS1 → FS2 → racines → arène → monde spirituel → arène → racines → épreuve → racines → arène → FF1 → FF2 → clairière → hutte → (sentier) FS2 → hutte → FC1 → arène de Ghil't → trou → arène → bosquet → fin.
- Retour : FS2 → FS1, racines → FS2, FF1 → arène, FF2 → FF1, clairière → FF2, hutte → clairière, arène de Ghil't → FC1.
- FS1 → bosquet est volontairement fermé (bannie).

### Art Codex intégré (manifest, échelle et sens uniquement)
- **Kainati** : nouvelle planche complète (7 rangées) → `scale` 0.6, placeholder 195×210 (~210 px à l'idle, ~2,5× Agarica). Même réglage pour `kainati_esprit`. Son poing est sur la liane quand il est suspendu.
  - `floorY` de l'arène passe à 464 (haut de la hitbox du sol) : Kainati, ses pierres et ses ondes ne flottent plus.
  - `Kainati.js` tolère encore l'ancienne rangée `throw_stone` à 3 frames (deux silhouettes collées dans une frame).
- **Amanite** `scale` 0.31 (~104 px) ; **Geralt** `scale` 0.30 (~70 px, halfelin) ; **Xara** (`xara_extra`) `scale` 0.12, à la taille du compagnon.
- Le père, Morgat et Agarica sont inchangés (~107, ~104 et ~86 px).
- Les PNJ regardent Agarica ; les pieds sont posés sur l'herbe partout où ils ont été vérifiés.
- Les noms d'anims du code ont tous été vérifiés contre le manifest (script) : aucun nom inexistant.

### Ce que j'ai touché hors de mes fichiers (minimal, à relire par l'agent Moteur)
- `StoryKit.js` :
  - **PNJ qui parle** : pendant sa réplique, un PNJ (ou Xara compagnon, via un sprite posé par-dessus elle) passe de `idle` à `talk`. `storyNpcRest` donne une pose de repos à Xara, qui n'a pas d'idle.
  - Une rangée d'art manquante retombe sur l'idle, plutôt que sur le rectangle placeholder.
  - `storyStandY` : les PNJ posés sur l'herbe (haut de la hitbox), plus sur une tuile cachée.
  - Anti-traversée des murs et amas de mousse (`guardStoryMossOverlap`).
- `DialogueScene.js` : la boîte se place **en haut de l'écran** quand Agarica est au sol. En bas, elle cachait les personnages qui parlent.

### Reste à faire / pour l'agent Moteur
- **Changement de forme près d'un mur** : le corps du loup, plus long, apparaît dans le décor, et Arcade ne le ressort pas. C'est corrigé pour la mousse, pas pour les tuiles. Le correctif général est à faire dans Player.
- **Xara compagnon** : si elle tombe hors du monde, rien ne la ramène. Il faudrait la téléporter près d'Agarica si elle est trop loin ou trop bas.
- Avertissements « Texture transfo-wolf-0/3 not found » à chaque transformation en loup (art de transformation absent).
- Équilibrage, à voir lors du playtest humain : Kainati est punitif quand on reste immobile (une pierre toutes les ~4 s). La charge de Ghil't au début de la phase 1 touche Agarica au point d'entrée juste après l'intro.
- Art encore placeholder : habitants, Clak, portraits, boîte de dialogue.

## RESTE À FAIRE

1. Finir les correctifs moteur (en cours).
2. **Playtest humain complet**, du titre à la fin, puis équilibrage : difficulté des boss, des corbeaux, de l'épreuve du singe.
3. Finir les images Codex : P1 restants (singe, Ghil't, objets, portraits, boîte de dialogue, fonds), puis P2 et P3. Ensuite, ajuster Kainati suspendu à la liane et l'orientation de Ghil't avec les vraies images.
4. Il n'existe pas de fond `fond_foret_sombre` dans le manifest : la forêt sombre utilise le ciel par défaut. À ajouter si souhaité.
5. Son et musique : rien n'est fait (`histoire/MUSIQUE_ET_AMBIANCES.md`).
6. Mineur : le brouillon IndexedDB de l'éditeur masque le fichier de zone (bouton « Oublier le brouillon » dans l'écran Zones).
