# Familles d'animaux et passifs : test avec les ursidés

Demande de l'utilisateur du 2026-11-12. Chaque animal (forme ou compétence) appartient à
une **famille** : ursidés, canidés, simiens, oiseaux, félins, poissons… Plus on équipe
d'animaux d'une même famille, plus le **passif** de cette famille est fort. Premier test :
les ursidés, avec quatre nouveaux ours.

Ce système reprend l'idée des « têtes » de totem (voir la mémoire du projet : totems à
équiper, mis de côté). Le code des totems reste dormant, on n'y touche pas.

## Décisions de l'utilisateur

- **Le passif se compte sur les animaux ÉQUIPÉS**, pas sur ceux qu'on possède : forme au
  sol, forme aérienne, forme d'eau et les 3 compétences. On construit son équipe au feu de
  camp.
- **Passif des ursidés : Robustesse.**
  - 2 ursidés équipés : +1 cœur max.
  - 3 : les fracas et impacts d'ours sont plus larges.
  - 4 : Agarica ne recule plus quand elle prend un coup.
- **Images** : provisoires, à partir de l'ours actuel recoloré, effets dessinés par code ou
  avec pixelfx. Un prompt d'images est préparé en plus pour les vraies feuilles.

## Les ours

| Animal | Emplacement | Ce qu'il fait |
|---|---|---|
| Ours (existe déjà) | compétence | fracas au sol ; compte comme ursidé |
| **Ours-hibou** | forme aérienne (à la place du singe ou de l'aigle) | 2e saut = transformation ; il **fracasse le sol à l'atterrissage** |
| **Panda** | compétence | **soigne 1 cœur** |
| **Grizzly** | forme au sol (à la place du loup) | sprint qui **accélère** ; à partir d'une certaine vitesse, effet visuel, et il **tue les petits monstres** sur sa route ; il **s'arrête en percutant un mur ou un gros ennemi** : Agarica reprend sa forme et est **projetée en diagonale, vers le haut et l'arrière**, pour ne pas prendre de dégât de contact |
| **Ours polaire** | compétence | il se dresse sur ses pattes arrière, retombe, et fait jaillir devant lui un **sol de glace perforant** sur quelques mètres, avec **un plus gros pic à la fin** |

Avec l'ours d'origine, cela fait 5 ursidés pour 5 emplacements possibles (sol, aérien,
3 compétences) : le palier 4 demande presque une équipe entière d'ours.

## Réglages proposés (à ajuster en jouant)

Ce sont mes propositions, pas des décisions de l'utilisateur.

- **Ours-hibou** : même hauteur de 2e saut que le singe. Le fracas ne part que si le 2e
  saut a été utilisé et qu'on retombe d'au moins une case. Zone du fracas : celle de la
  compétence ours, 1 dégât. Il casse les blocs de l'ours (`breakables` `by: 'bear'`). Ni
  liane ni plané avec lui.
- **Panda** : 45 d'énergie, environ 1 s assise (elle mange une pousse), vulnérable pendant
  ce temps ; sans effet et sans coût si les cœurs sont pleins.
- **Grizzly** : [Maj] tenue, comme le loup. Il part moins vite que le loup et accélère
  pendant environ 1,5 s jusqu'à dépasser sa vitesse. Au-delà de 85 % de la vitesse max,
  c'est la **charge** : traînées de vitesse, poussière, léger tremblement. En charge, il
  tue au contact les petits ennemis (pas les boss, ni Geralt) sans prendre de dégât. Un mur,
  ou un gros ennemi (boss) percuté en charge : 1 dégât au gros ennemi, fin de la forme,
  projection d'Agarica en arrière et vers le haut, 0,6 s d'invulnérabilité. Sous le seuil de
  charge, un mur l'arrête simplement, et un ennemi le blesse comme d'habitude. Pas de
  morsure ; son saut est celui du loup, un peu plus court.
- **Ours polaire** : 40 d'énergie. 0,45 s dressé (signal lisible), puis la glace part de
  ses pattes : 5 pics qui sortent l'un après l'autre sur 320 px, et un 6e, deux fois plus
  haut, au bout. Les pics suivent le sol et s'arrêtent au premier vide ou mur. 1 dégât par
  pic, 2 pour le gros ; ils traversent les ennemis (« perforant ») et fondent en 1 s.
- **Palier 3** : zones du fracas de l'ours, de l'atterrissage de l'ours-hibou, des pics de
  glace et de l'impact du grizzly agrandies de 25 %.

## Système

- Une table des familles : chaque forme et chaque compétence a sa famille (loup = canidé,
  singe = simien, aigle = oiseau, pieuvre = à part, papillon = insecte, pierre = aucune…).
  Seuls les ursidés ont un passif pour l'instant ; la table est faite pour en recevoir
  d'autres.
- Le menu du feu de camp montre, pour chaque famille équipée, le nombre d'animaux et le
  palier actif, et ce que donnerait le palier suivant.
- **Accès pour le test** : rien dans l'histoire pour l'instant. Les quatre ours se
  débloquent par des drapeaux de test, et une zone de test les donne tous d'un coup, avec
  un feu de camp, des petits ennemis, un gros ennemi, un mur, un bloc de l'ours et du plat
  pour charger.

## Images

Provisoire : les images de l'ours actuel recolorées (grizzly plus sombre, polaire blanc,
panda noir et blanc, ours-hibou avec un masque de plumes). Les vraies feuilles : prompt
`PROMPT_CODEX_14.md`, à écrire avec le lot.
