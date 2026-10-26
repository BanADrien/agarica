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

## Session du 2026-10-25 : moteur, combats et intégration du lot Codex n°8

Résumé de tout ce qui a été fait depuis le commit `6c81f11` (2026-10-23). Le détail technique (clés de zone, fonctions) est dans `PLAN_DEV.md` ; le plan d'intégration et son statut dans `PLAN_INTEGRATION_LOT_8.md`.

### Commits (branche `feature/demo-histoire`)
| Commit | Contenu |
|---|---|
| `6c81f11` | Moteur : calibrage visuel (pieds posés au pixel visible, une taille par feuille), bulles de dialogue, lianes (amplitude, monter/descendre, lâcher puissant), pierre lancée en forme singe et soin en forme papillon, fonds posés au sol et bandes de liquide, caméra verticale avec ciel, cochons de trois couleurs |
| `7536fd1` | Juice : particules (`spawnFx`), hit-stop, secousses réglables dans les Options, écrasement/étirement, tampon de saut, impacts, transformations, feux, totems, ramassage, mousse qui se fissure, lanternes, regard de la caméra, dialogues, bandeaux et menus animés |
| `da97ca9` | Épreuve du singe 5 fois plus longue (12 288 px, 24 lianes, 5 sections, pierres en rythme, marée de mousse, lanterne par section) |
| `61572ad` | Feu de camp : menu remis dans les planches du panneau ; totems de bonus verrouillés pour la démo (chaînes + cadenas) |
| `34c7c4b` | Niveaux 2 : niveaux validés au saut simple, bandes de mousse et de brume, Xara en bulles (12 dialogues bloquants en moins), forêt flottante 1 en vraie montée vers le ciel |
| `1023861` | Plateformes de biome d'un seul tenant ; plus de second soleil en forêt flottante |
| `0ea40df` | Chute dans le vide : Agarica traverse le bas de l'écran, fondu puis reprise (plus de sol invisible ni de pose allongée) |
| `c911e42` | Moteur 3 : **le papillon n'est plus qu'une compétence** (formes aériennes = singe ou aigle, dash retiré, vieilles sauvegardes migrées) ; invites et bulles toujours dans l'écran ; anneau de choc dessiné et teinté hors talisman/toxique ; teinte et angle des particules respectés |
| `b78ab78` | Duel de Geralt refait : vrai combat de 8 coups, collets, invocation de Clak au 4e coup, phase 2 avec Clak |
| `48bf563` | Kainati refait : boss au sol, attaques pleine largeur esquivées sur les lianes, épargné à la fin |
| `02f1c93` | Manifest : entrées du prompt Codex n°9 (`geralt_combat`, `kainati_calme`, `kainati_esprit_extra`), déjà branchées avec repli |
| `c3b9015` | Lot Codex n°8 livré et importé : 27 images, 120 entrées (fonds, ciel, liquides, structures, plantes, mousses, particules, halos, petites créatures, objets, interface) |
| `6c35c94`, `9dcd77c` | Intégration du lot n°8 (12 lots, voir plus bas) ; totem du singe direct ; Kainati avec 2 lianes |
| `2901309`, `9dcd77c` | Codex lot n°10 : la forme papillon refaite en **vrai papillon lunaire** (`forme_papillon`, `transfo_papillon`, `forme_papillon_extra` : mêmes ids, anims et frames) |

Les corrections finales (plus bas) ne sont pas encore commitées.

### Intégration du lot Codex n°8 (12 lots en parallèle, 2026-10-25)
- **Manifeste et importeur** : nouvelles options d'import (dégradé des halos, flaque au sol rognée et désaturée, anneau recentré, bulle calée en bas), bug d'alpha corrigé à l'import, échelles et découpes de l'interface ; note de Geralt et grappin réextraits du dessin brut (ils étaient coupés).
- **Moteur** : lointains peints (`farLayers` : îles, horizon malade), lumières posées dans les zones (`lights` : rais de lune et d'aube, flaques, halos), vignette sur les zones sombres, spores en forêt corrompue, décors du manifeste posables dans l'éditeur (retournés, penchés, suspendus, écrasés), brume et lac calés sur leur image.
- **Interface** : bulles, invites « E : … », bannière « objet obtenu » de 128 px, carte-titre, cases et touches du HUD, barres d'énergie (150x22) et de boss (448x32) peintes ; touches peintes du feu de camp ; indicateur de suite du dialogue. Les touches de l'écran Contrôles restent dessinées (bois clair en jeu seulement).
- **Entités** : pistes et plateformes du loup, souffle et crachat de Ghil't (le souffle couvre sa zone de dégâts, qui ne change pas), gouttes et grains des corrompus, créatures et singe guéris, pierre du singe, éclats, nuée du papillon, courants d'air, fil de Xara, halos des papillons. **Bug corrigé** : la transformation en loup cherchait des images absentes (avertissements, et Agarica invisible si le chargement ratait).
- **Acte 1** : mare de la forêt sombre 2 (fond, voile, surface, berges, roseaux, pont-tronc), plaques à gratter du bosquet (la plaque grattée reste comme trace), mousses lumineuses, empreintes du loup, plante perchée (la même plante blanche que dans la clairière), graine, lueur du talisman, halo de l'idole, rai du sentier, petite araignée.
- **Grand arbre** : fentes lumineuses, branche qui s'effrite en 3 images, marée, mousses, grains, ombres des pierres, rais. **Le totem du singe donne directement la forme singe** : le monde spirituel n'est plus sur le chemin (fichiers gardés ; une vieille sauvegarde y reprend devant le totem).
- **Acte 2** : rampe d'envol, cratère, spirale gravée (elle était cachée derrière l'arbre), plante de la clairière et cueillette, cercle sain et colonne de lumière, mousse de la clairière en touffes sombres (variante « touffes »), touffes de la forêt corrompue, **bête dédiée tuée par Amanite** (`bete_mousse_*`, jusqu'à `bete_mousse_morte`), corde et grappin du « Plan B ».
- **Ghil't** : onde, trou et mottes de la chute ; mousse qui tombe, cercle d'herbe saine et créatures guéries pendant le soin ; arène calme ; gouttes d'antidote ; la pose du papillon se termine proprement pendant la cinématique ; Ghil't malade s'efface pendant que le gardien apparaît.
- **Combats** : Kainati avec 2 lianes, télégraphes allongés, onde plus lente, règles d'équité (il attend ses pierres, ne coince pas Agarica) ; pas de combat sans forme singe. Duel de Geralt : il peut tomber dans ses propres collets, textes et bulles de Xara qui ne cachent plus Agarica, Clak posé au sol à la fin.
- **Singe et lianes** : plus de double image en montée/descente ; toutes les lianes partent de l'intérieur de leur bloc.
- **Zones** : horizon malade (forêt flottante 1 à y 125, forêt flottante 2, hutte), lumières, vignette seulement sur les zones sombres, spores, flèches et collet plantés, mousse sous la voûte de la galerie.

### Corrections finales (après relecture, non commitées)
1. **Totem du singe** : le singe de la grande branche se calme 8 s à la prise de la forme et ses pierres en vol se brisent (avant : 3 cœurs perdus et mort à 8,8 s).
2. **Nuages** répartis sur le ciel réellement visible : les 5 images se voient en forêt flottante 1 et 2.
3. **Trou sombre** : Agarica et Xara passent au-dessus du halo laiteux et restent nettes.
4. **Collet du campement** (forêt corrompue 1) à la taille de ceux du duel (42x17 px).
5. **Étincelles de purification** (`fx_etincelle`), 6. **étincelles d'ailes** et 7. **traînées des papillons** de la nuée branchées.
8. **Îles lointaines** affichées en forêt flottante 2, discrètes (translucides, bleutées).
9. **Touffe penchée** : à moins de 40 px d'Agarica, la touffe se courbe vers elle par un fondu de 150 ms.
- **Volontairement non posés** : brume de premier plan (jamais à l'écran pendant la montée de la forêt flottante 1, elle masquerait le sol en tombant), fleur perchée rose (remplacée par la plante blanche), tapis de mousse vert citron (trop criard). Les deux derniers restent posables dans l'éditeur.
- **Papillon** : la transformation du sauvetage de Ghil't joue les 4 images de chaque étape à leur rythme peint (durée de la cinématique inchangée) ; la pose de la compétence passe d'Agarica au papillon sans saut de taille, avec étincelles et petite lueur, même durée totale (740 ms). Le vrai papillon lunaire du lot n°10 est vérifié en jeu (crapaud corrompu, sauvetage de Ghil't).

### Tests
- `tools/playtest.py` : 37 scènes sur 38 sortent en code 0, éditeur compris. `CampfireMenuScene` sort en code 1 lancée seule : elle a besoin de la zone qui l'ouvre (déjà le cas avant).
- Chemin critique joué par un robot : 14 segments sur 15 passent sans erreur JS. La forêt flottante 2 échoue dans la partie complète (le robot rate le plané) mais passe lancée seule.
- Sans images : 40 textures retirées en cours de partie, aucune erreur, les replis s'affichent.
- Comme avant : ce sont des robots, pas une personne.

### En parallèle
- **Prototype de cohésion visuelle** (en cours, isolé dans `prototype/`, `src/proto/` et `docs/production/controles/prototype_coherence/`) : il ne touche pas le jeu.

## RESTE À FAIRE

1. **Playtest humain complet**, du titre à la fin, puis équilibrage : Kainati (2 lianes), duel de Geralt, Ghil't, corbeaux, épreuve du singe, planés de la forêt flottante 2.
2. **Art Codex n°9** à générer : `geralt_combat` (poses du duel), `kainati_calme` (Kainati épargné, assis). `kainati_esprit_extra` n'a plus d'usage sur le chemin (monde spirituel retiré). Le code les attend déjà, avec repli.
3. **Son et musique** : rien n'est fait (`histoire/MUSIQUE_ET_AMBIANCES.md`) ; les points d'accroche `playSfx` sont posés.
4. Retouches d'images facultatives du lot n°8 (`PLAN_INTEGRATION_LOT_8.md` §7) : raccord du lac de mousse toxique, encoche de la brume avant, nuages 3 et 4, nappe de nuages, îles lointaines.
5. Petits points relevés par les lots : boîte de dialogue qui cache l'horizon pendant la cinématique `ff1_vue` ; carte « Continuer » d'une vieille sauvegarde arrêtée au monde spirituel qui affiche le chapitre du bosquet jusqu'à la reprise ; commentaire de tête d'`acte1.js` qui cite encore le monde spirituel ; bulle de Xara « Tout le sol va y passer » qui couvre la tête d'Agarica dans l'arène de Kainati ; aperçu des lianes dans l'éditeur non vérifié.
6. Mineur : le brouillon IndexedDB de l'éditeur masque le fichier de zone (bouton « Oublier le brouillon » dans l'écran Zones).
