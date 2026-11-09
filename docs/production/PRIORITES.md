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

## P1 : gêne tous les joueurs

Rien pour l'instant.

## P2 : améliore nettement le jeu

| Point | Pourquoi |
|---|---|
| Transition racines → arène de Kainati : 0,6 s d'écran noir, et un cadrage décalé de 178 px | le passage donne l'impression d'une téléportation |
| Saccades de la caméra sur les écrans à 120 ou 144 Hz | gênant selon l'écran ; à confirmer sur le tien |

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
| Entrée « Objets » du menu du feu de camp | affiche encore « bientôt » |
| Mise à jour de COMPTE_RENDU.md | |
| Totems à équiper (tête + corps) | mis de côté tant qu'il y a peu de formes |

## À toi (je ne peux pas le faire)

- **Images Codex** : générer les prompts n°9 (Geralt au combat, Kainati calmé), n°12
  (crapauds) et n°13 (vague 3), qui sont dans `docs/production/PROMPT_CODEX_*.md`.
  En attendant, chaque élément sans image s'affiche en version provisoire.
- **Partie test** : jouer la démo en entier et me faire tes retours.
- **Mise en ligne** : lancer `python tools/build_netlify.py`, puis déposer `dist/` sur
  Netlify Drop.
- **GitHub** : je ne pousse rien sans ton accord explicite.
