# Ce que les guides « gamedev » peuvent apporter au jeu

Note du 2026-11-13, après l'installation du skill `gamedev` (14 guides tirés de
https://github.com/gamedev-skills/awesome-gamedev-agent-skills, dans `.claude/skills/gamedev/ref/`).
Ce sont des pistes relevées à la lecture des guides, pas des défauts constatés en jeu : chacune est à
vérifier dans le code avant d'y toucher. Rien n'est changé dans le jeu.

Le dépôt compte 80 skills. 66 ne servent pas ici : Godot, Unity, Unreal, Roblox, autres moteurs,
jeux de cartes, tir, tower defense, publication sur Steam.

## Ce qui peut servir tout de suite

| Piste | Guide | Pourquoi ici |
|---|---|---|
| **Vérifier les verrous et le chemin critique** : décrire le monde comme des salles reliées par des passages qui demandent une forme (loup, singe, aigle, ours), et laisser un script prouver qu'on peut toujours finir, sans cul-de-sac | level-design | 24 zones, 10 facultatives, des sens uniques et des blocs à casser : c'est le risque principal d'un metroidvania. La carte globale lit déjà ces données : le contrôle s'y ajoute |
| **Mesurer le vrai saut** au lieu de l'estimer, et en déduire les portées | level-design, platformer | les arcs de saut de la carte globale sont des repères ; les lots A, B et C vont poser des dizaines de plateformes |
| **Le rythme d'une zone écrit en données** (calme, tension, récompense) avec un contrôle | level-design | pour remplir les 10 zones facultatives, encore vides, sans faire dix fois le même couloir |
| **Sauvegarde** : numéro de version, migration, copie de secours | save-systems | on a déjà eu une sauvegarde écrasée par une zone de test ; les ours ajoutent des champs à la sauvegarde |
| **Le son** : familles de sons, variations pour ne pas répéter, priorités, mixage | audio-design | arrive avec les outils de son (skill `son`) |

## À comparer avec les réglages actuels

Le guide `platformer` donne des valeurs de départ. Celles du jeu, d'après `CLAUDE.md` et `PLAN_DEV.md` :

| Réglage | Repère du guide | Dans le jeu |
|---|---|---|
| Coyote | 0,1 s (0,06 à 0,15) | 0,14 s : dans la plage, côté généreux |
| Tampon de saut | 0,1 à 0,15 s | 0,12 s : dans la plage |
| Petit saut | 30 % du grand (15 à 60 %) | 81 px sur 172 pour 0,1 s d'appui, soit 47 % : dans la plage |
| Hauteur du grand saut | 3,5 cases (2 à 5) | 172 px, soit 2,7 cases de 64 px : dans la plage, plutôt bas |
| Chute plus rapide que la montée | 1,8 fois | à mesurer |
| Flottement au sommet | demi-gravité près du sommet | absent, à ma connaissance |
| Correction de coin au plafond | jusqu'à une demi-case | absente, à ma connaissance |

Deux idées du guide que le jeu n'a pas, à essayer si le saut te paraît raide : le flottement au sommet
(on vise mieux) et la correction de coin (on ne se cogne plus à un angle de plafond pour 4 pixels).

## Défauts déjà rencontrés que les guides expliquent

- **Saccades de caméra sur écran 120 ou 144 Hz** (corrigées le 2026-11-10, encore à confirmer par
  l'utilisateur) : `camera-systems` et `physics-tuning` décrivent la cause, un corps qui bouge au
  rythme de la physique suivi par une caméra au rythme de l'écran, et la façon propre de lisser.
- **Agarica coincée contre une marche** (rencontré dans les forêts sombres) : `platformer` l'explique
  par les collisions case par case et propose de fusionner les cases en formes plus grandes.
- **Hauteur de saut qui change avec la fréquence d'écran** (+3 px à 144 Hz, mesuré) : même guide,
  intégration à pas variable.
- **Coups sans poids** : `game-feel` classe les événements en trois paliers (petit, moyen, gros) avec
  secousse, arrêt sur image et particules pour chacun. Utile pour le grizzly, le fracas et les boss.

## Moins prioritaire

- `input-systems` : manette, touches réglables, clavier AZERTY (le jeu a déjà ZQSD et les flèches).
- `game-ai` : machines à états et perception pour les ennemis. Le budget du jeu exclut une vraie IA.
- `dialogue-systems`, `game-ui-ux`, `performance-optimization` : au besoin.
- `phaser-core`, `phaser-arcade-physics` : écrits pour Phaser 4 et 3.90 ; le jeu est en 3.80. À
  consulter pour un diagnostic, pas pour copier du code.

## Proposition de premier usage

Ajouter à la carte globale le contrôle des verrous (peut-on tout atteindre et tout finir avec les
formes qu'on obtient, dans l'ordre ?), avant de remplir les lots A, B et C. C'est court, sans risque
pour le jeu, et ça protège tout le contenu à venir.
