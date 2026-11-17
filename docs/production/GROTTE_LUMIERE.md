# Zone de test : la grotte lumineuse

Demande de l'utilisateur du 2026-11-17 : « une zone de test de grotte avec des éléments lumineux
(champignons, lucioles, etc.), avec tous les sprites qui réagissent à la lumière, pour voir ce que
ça peut rendre en jeu ».

C'est un essai de rendu, pas une zone de l'histoire. Elle prépare les zones sombres du monde V2 :
galeries, grotte aux cristaux, profondeurs.

## Ce qu'on veut voir

- **Une vraie obscurité.** Toute la scène passe par LightKit : ambiance très sombre, et seuls les
  halos des sources lumineuses éclairent.
  - Les sprites préparés en sections sont éclairés en volume.
  - Le sol, les décors et les sprites sans carte sont éclairés à plat.
  - Rien ne doit rester en pleine lumière par oubli.
- **Des sources de lumière posées dans la zone :**
  - **Champignons lumineux** : images existantes, `foret_sombre_champignons_lumineux`,
    `grand_arbre_tronc_champignons_lumineux` et `grand_arbre_champignon_etagere`. Chaque touffe
    porte une lampe colorée (vert lunaire, bleu, rose), qui pulse doucement.
  - **Lucioles** : `fx_luciole` et `grand_arbre_lanterne_lucioles`. Quelques lucioles sont de
    vraies lampes qui dérivent. Les autres sont seulement des points lumineux qui n'éclairent pas
    (au plus 10 lampes visibles, limite de Phaser).
  - ~~Les yeux de Xara~~ : retiré le 2026-11-17, « Xara ne devrait pas faire de lumière ».
  - **Un feu de camp** : une lampe chaude, qui montre un contraste avec la lumière froide des
    champignons.
- **Tous les sprites visibles réagissent à la lumière :**
  - Agarica : TOUTES ses animations (repos, marche, course, saut, chute, attaques, coups reçus,
    transformations) ;
  - ses formes de base : loup, singe, aigle ;
  - Xara ;
  - les ennemis de grotte : araignée et crapaud. Le crapaud est déjà préparé ; le crapaud corrompu
    est à faire.

  Préparation avec `npm run sections` (skill `eclairage-sections`). Une animation se prépare en
  entier et dans l'ordre, sinon l'éclairage clignote.
- **Un parcours court**, de 3 à 4 écrans, conçu pour montrer la lumière :
  - un couloir sombre, lisible avec la seule ambiance ;
  - une salle de champignons ;
  - un passage de lucioles ;
  - le feu de camp ;
  - un endroit où une lampe est DERRIÈRE Agarica, pour voir le contre-jour ;
  - deux ou trois ennemis.

## Règles

- Aucune image nouvelle : les images existantes suffisent. S'il manque quelque chose (cristaux par
  exemple), c'est un provisoire dessiné par code. Une vraie image demanderait trois propositions à
  l'utilisateur.
- La zone se trouve dans « Zones de test » au titre, et s'ouvre avec `?zone=<NomDeLaScene>`.
- Réglages de lumière lisibles en tête du fichier de données (ambiance, couleurs, portées), pour
  les ajuster facilement en essayant.

## Retours de l'utilisateur (2026-11-17)

Après le premier essai, quatre retours :
- l'ambiance était trop basse partout ;
- les lumières faisaient des cercles pas propres ;
- Xara ne doit pas éclairer ;
- le rendu sur le sprite était à revoir.

Corrigé le même jour :
- **ambiance** : grotte 0,33, dehors 0,84 ;
- **lumière continue** sur le décor, qui s'éteint en douceur ;
- **sprites** : ombres en demi-Lambert, +15 % d'ambiance pour les personnages, couleur des lampes
  atténuée sur eux ;
- **plus de lampe sur Xara**.

Planche avant / après : capture de travail, hors du dépôt.

Ouvert : la paroi du fond reste presque noire même sous une lampe, parce que sa tuile est noire à
l'origine.
