# Liste des priorités

Chaque demande ou retour de joueur est classé ici dès qu'on me le donne. On traite les
priorités dans l'ordre : P1, puis P2, puis P3. La P4 attend qu'il n'y ait plus rien
d'autre. Un point terminé et commité sort de la liste ; l'historique Git le garde.

**Façon de travailler (décidée le 2026-11-09) :**
- On avance par petits paquets de 3 ou 4 points.
- Dès qu'une version est testable, l'utilisateur la reçoit avec la liste des modifications,
  sans attendre que tout soit fini.
- Les petites retouches (un fichier, quelques lignes) se font tout de suite dans la
  conversation, sans agent.
- À chaque paquet, on vérifie que toutes les scènes se lancent sans erreur.
- Le parcours complet du robot se rejoue une fois par paquet, et toujours avant une mise en
  ligne sur Netlify.
- Un seul agent avec navigateur à la fois : au-delà, le PC sature.

État au 2026-11-09, après le paquet « retours de Light et Marie » : 13 points faits.
2026-11-10 : cadrage racines ↔ arène, écrans 120/144 Hz (à vérifier), entrée « Objets »
du feu de camp retirée (doublon de l'inventaire).

## P1 : gêne tous les joueurs

Rien pour l'instant. Les diagonales vides du sol sont corrigées (forêts sombres 1 et 2) ;
la règle est dans PLAN_DEV.md.

## P2 : améliore nettement le jeu

| Point | Pourquoi |
|---|---|
| **À vérifier par toi** : saccades de la caméra sur les écrans à 120 ou 144 Hz | corrigé le 2026-11-10 : la physique prend un pas par image au-delà de 90 Hz (`applyDisplayPhysicsFps`, LevelKit) ; saut +3 px à 144 Hz. Impossible à voir en test sans fenêtre (60 Hz) : à confirmer sur ton écran |
| Arène → racines : ~0,5 s de noir pendant que les racines se construisent | mesuré le 2026-11-10 (racines → arène : ~0,2 s) ; le cadrage, lui, est corrigé (voir plus bas) |

Fait le 2026-11-10 : cadrage racines ↔ arène de Kainati. Agarica passait de y 270 à
l'écran (corniche, caméra centrée) à y 448 (arène) ; la caméra glisse maintenant avant le
bord (clé de sortie `frameFeetY`, `updateEdgeFraming`) : 447 → 447 à l'aller, 64 px d'écart
au retour (la caméra des racines ne monte pas plus haut).

## Outil en cours

Carte globale du jeu (`carte.html`, demandée le 2026-11-12) : les 24 zones avec leur vrai
terrain, passages, ennemis, PNJ, objets, secrets et parcours de l'histoire ; clic pour ouvrir
l'éditeur ou jouer, notes à copier pour Claude, portées de saut. En construction.

## P3 : contenu nouveau

| Point | Pourquoi |
|---|---|
| Lot A : grotte de la lisière, galeries des racines, cercle de lune, et la quête de la corde de Geralt | zones facultatives de la vague 3 |
| Lot B : cime cachée, île des vents, île du gardien, et la quête de Pépin | zones facultatives de la vague 3 |
| Lot C : marais des brumes, racines suspendues, nid de cocons, canopée malade, et la quête des fleurs de lune | zones facultatives de la vague 3 |
| Placer d'autres papillons à libérer, pendant les lots A, B et C (3 sont posés pour l'instant) | collectible : un niveau de la compétence tous les 3 |
| Son et musique | le jeu est muet ; gros effet sur le ressenti, mais gros chantier ; à décider avec toi |

## P4 : quand il n'y a plus rien

| Point | Remarque |
|---|---|
| Loup debout : une vraie image de repos | aujourd'hui, image de course figée ; art Codex à prévoir |
| Papillons : un soin moins cher (actuel), ou plutôt une nuée plus grande ? | à décider avec toi |
| Portrait de Kainati calmé : sa tête porte encore de la mousse verte | les yeux sont passés à l'ambre |
| Mise à jour de COMPTE_RENDU.md | |
| Totems à équiper (tête + corps) | mis de côté tant qu'il y a peu de formes |

## À toi (je ne peux pas le faire)

- **Redessiner les assets à la main** : la liste par priorité est dans
  `docs/production/ASSETS_A_REFAIRE.md` (6 lots, à commencer par Agarica au repos et en
  course pour valider l'échelle). Chaque feuille terminée, je l'intègre tout de suite.
- **Images Codex** : il reste à générer les prompts n°9 (Geralt au combat, Kainati calmé),
  n°12 (crapauds) et n°13 (vague 3), dans `docs/production/PROMPT_CODEX_*.md`. Un élément
  que tu dessines à la main n'en a plus besoin.
- **Partie test** : jouer la démo en entier et me faire tes retours.
- **Mise en ligne** : lancer `python tools/build_netlify.py`, puis déposer `dist/` sur
  Netlify Drop.
- **GitHub** : je ne pousse rien sans ton accord explicite.
