# Legend of Agarica — Game Design Document (v1)

## 1. Pitch

**Legend of Agarica** est un metroidvania-lite 2D en pixel-art/silhouettes, jouable dans le navigateur, dans lequel Agarica — druidesse du Cercle de la Lune — traverse une forêt mystérieuse en empruntant la forme des bêtes qu'elle a liées à son âme. Chaque action de déplacement de base (sauter, courir) se transforme naturellement en une capacité animale, dans l'esprit de Hollow Knight mais réduit à un seul niveau court, fini et soigné.

## 2. Contexte narratif (tiré de la fiche de personnage DnD)

- **Nom** : Agarica — Humaine, Druide, Cercle de la Lune, Noble
- **Alignement** : Loyal Bon (Neutral Good)
- **Apparence** : petite et menue, pas imposante, mais des yeux vert perçant qui trahissent sa puissance. Un tatouage fait de rose et d'épines visible sur son bras hors armure.
- **Personnalité** : naïve, un peu candide, mais loyale et fidèle, le cœur sur la main.
- **Origine** : vient des bois occidentaux.
- **Objet notable** : la Bague de Xara (False Life) — clin d'œil possible pour nommer la petite araignée-compagnon **Xara**.
- **Capacité de fond** : Wild Shape (forme sauvage), Wild Companion (familier fée) — justifie narrativement la présence de l'araignée à ses côtés en permanence.

Ces éléments peuvent nourrir : l'écran-titre, un court texte d'intro, la palette de couleurs (rose/vert/épines), et le nom du compagnon.

## 3. Boucle de gameplay

Un seul niveau (forêt), traversé de gauche à droite ou en semi-exploration courte, où certains passages sont bloqués tant qu'Agarica n'a pas "activé" la bonne forme via une action de mouvement :

| Action du joueur | Forme invoquée | Effet de gameplay |
|---|---|---|
| Saut en l'air (double saut) | **Aigle** | Second saut + léger plané, franchit les grands vides |
| Sprint / dash au sol | **Loup** | Vitesse accrue, traverse les pièges au sol, esquive courte |
| (Optionnel si temps) Immobile / contre un mur | **Araignée** (Xara en soutien) | Éclaire un passage sombre ou révèle un indice — pas jouable, réactif |

La transformation est **visuelle et automatique**, pas un menu : le sprite d'Agarica change brièvement de silhouette pendant l'action (ex : ailes qui se déploient en l'air, silhouette de loup furtive au sprint).

## 4. Personnage jouable — états et contrôles

- **Déplacement** : flèches / QSD
- **Saut** : Espace (1er saut = normal, 2e saut en l'air = forme Aigle, plané léger)
- **Sprint** : Shift ou double-tap direction (= forme Loup, vitesse x1.5-2, invulnérabilité courte optionnelle)
- **Attaque de base** : reprend la dague d'Agarica (1 coup simple au corps-à-corps), pas besoin de sorts pour le MVP

## 5. Compagnon — Xara (araignée)

- Suit Agarica à distance constante (comportement simple de "follow" avec léger délai).
- Réagit visuellement près des ennemis ou d'un point d'intérêt (petite animation, changement de couleur des yeux).
- Pas de dégâts ni de combat pour rester dans le budget technique — purement compagnon/mascotte.

## 6. Ennemis (simplifiés depuis le bestiaire DnD fourni)

Objectif : 2 à 3 types maximum, chacun avec 1 seul pattern d'attaque.

1. **Loup sanguinaire** — patrouille au sol, charge en ligne droite si Agarica est repérée.
2. **Araignée** — reste fixe, tisse une toile au sol qui ralentit si on marche dessus (pas de dégâts, juste un obstacle).
3. *(Bonus si le temps le permet)* **Corbeau** — vole en boucle, fonce si Agarica passe dessous.

Chaque ennemi : 1 point de vie (meurt en un coup de dague), pas de vraie IA complexe.

## 7. Structure du niveau

Un niveau linéaire divisé en 3 courtes zones (2-3 minutes de jeu chacune) :

1. **Introduction** — apprentissage du déplacement de base et de Xara, aucun danger.
2. **Passage Aigle** — un vide impossible à franchir sans double-saut, premier ennemi (Loup).
3. **Passage Loup** — un couloir avec pièges au sol/toiles d'araignée à traverser en sprint, arrivée sur une clairière finale avec message de fin personnalisé.

## 8. Direction artistique

- Silhouettes sombres sur fonds dégradés (façon Hollow Knight), palette réduite : violet nuit / vert lunaire / touches de rose (clin d'œil au tatouage d'Agarica).
- Pas d'animation dessinée à la main complexe : privilégier des formes géométriques stylisées ou un style "silhouette + contour lumineux".
- Effet de lune/lumière lunaire en fond (cohérent avec le Cercle de la Lune).

## 9. Stack technique

- **Langage** : JavaScript
- **Moteur** : Phaser 3 (2D, gère nativement physique de plateforme, sprites, collisions)
- **Format** : page web unique (HTML + JS), jouable directement dans le navigateur, sans installation — partageable par simple lien ou fichier à ouvrir.

## 10. Roadmap de tickets pour Claude Code

1. Mise en place du projet Phaser (page vide, chargement, boucle de jeu de base).
2. Personnage : déplacement gauche/droite + saut simple + collisions avec le décor.
3. Ajout du double-saut → transformation visuelle Aigle + léger plané.
4. Ajout du sprint → transformation visuelle Loup + vitesse augmentée.
5. Compagnon Xara : suivi du joueur avec délai, petite animation réactive.
6. Zone 1 (intro) : décor, pas d'ennemi.
7. Zone 2 : vide à franchir + ennemi Loup sanguinaire (pattern de charge).
8. Zone 3 : toiles d'araignée au sol + ennemi Araignée fixe.
9. Écran de fin personnalisé (message + nom d'Agarica mis en avant).
10. Polish : palette de couleurs, effets de lumière lunaire, sons/musique d'ambiance si le temps le permet.

## 11. Idées bonus (si le temps avance vite)

- Un mini boss final combinant Loup + Araignée.
- Une capacité de forme Requin ou Ours pour une zone aquatique/force bonus.
- Des collectibles cachés en forme de motif rose/épine (référence au tatouage).
- Un vrai combat au tour par tour ponctuel en cas de rencontre marquante, en reprenant les stats du bestiaire DnD d'origine.
