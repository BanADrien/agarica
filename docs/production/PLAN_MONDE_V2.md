# Monde V2 : refaire toutes les zones (plan simple)

Demande de l'utilisateur du 2026-11-16. Ce document est le plan d'ensemble, à valider avant
tout changement dans le jeu. Le détail zone par zone viendra à l'étape 1 (`MONDE_V2.md`).

## Ce que tu as demandé

- Refaire **toutes les zones**, et les **décors du bosquet**.
- Un jeu **plus gros**, qui n'est **plus une ligne droite** : on voit des endroits
  inaccessibles, on y revient quand la mécanique est débloquée (comme Hollow Knight).
- Le jeu pousse à **explorer**, pas seulement à suivre l'histoire. Deux exemples donnés : le
  bosquet (à peine une zone) et la grotte sous le combat de Ghil't (ne sert qu'au récit).
- **Utiliser intelligemment toutes les mécaniques.**
- **Sols et murs cassables** : l'ours brun ne casse que les sols, le grizzly que les murs.
- **Totems et médaillons** pour les formes qui n'en ont pas (pas le crapaud).
- **Zones cachées pour des formes pas encore faites**, fermées par un élément provisoire (un
  rectangle « SECRET »).
- D'abord un plan, puis des zones réfléchies, **ensuite seulement** les rendre belles.

## État actuel (lu dans les fichiers, 2026-11-16)

- 24 zones : 14 sur le chemin de l'histoire, presque toutes des couloirs horizontaux mis bout à
  bout ; 10 facultatives qui n'ont que leur terrain et leurs passages (vides).
- Le bosquet : une seule zone de 3840 px, quittée pour de bon après le bannissement.
- Le trou sombre : 1344 px, une seule pièce.
- Mécaniques déjà dans le jeu : dague, ours brun (fracas), loup (sprint, saut long, pistes,
  plateformes cachées), singe (lianes, 2e saut), aigle (plané, courants d'air), répulsif
  (mousse toxique), papillon (soigne les corrompus), pieuvre (eau), ours-hibou (2e saut +
  fracas en retombant), grizzly (charge), ours polaire (pics de glace), panda (soin).
- Totems existants : loup, singe, aigle, pieuvre. Sans totem : ours brun, ours-hibou, grizzly,
  ours polaire, panda, papillon.
- Aujourd'hui les ours et la pieuvre ne sont nulle part dans l'histoire.

## Principes du nouveau monde

1. **Six régions reliées en boucles**, pas une file. Chaque région a une pièce centrale d'où
   partent plusieurs chemins, et au moins un raccourci qui s'ouvre de l'intérieur.
2. **On voit le verrou avant d'avoir la clé.** Chaque mécanique est montrée fermée deux ou
   trois fois avant d'être obtenue, puis utilisée tout de suite dans une pièce sans danger,
   puis redemandée plus loin, combinée aux autres.
3. **Chaque retour en arrière paie** : cœur, Éclat de lune, papillon, totem d'ours, raccourci.
4. **Des pièces à étages**, plus des couloirs : on monte, on descend, on tombe dans la zone
   du dessous.
5. **L'histoire garde ses scènes** (Xara, Kainati, Geralt, Morgat, Ghil't, le retour), replacées
   dans les nouvelles zones. Le chemin principal reste faisable sans rien de facultatif.
6. **Chaque zone a une fiche** avant d'être construite : à quoi elle sert, ce qu'on y apprend,
   les verrous qu'on y voit, ce qu'on y gagne, où mène son raccourci.

## Les régions (proposition)

| Région | Zones (aujourd'hui → prévu) | Idée |
|---|---|---|
| **Bosquet d'Émeraude** | 1 → 4 | Le village, les hauts du bosquet (sanctuaire des totems), le jardin de la source, et les **caves sous le village**, où l'on revient en cachette plus tard par la grotte. Décors refaits. |
| **Forêt sombre** | 4 → 5 | Lisière, ravins, grotte dessous (elle relie tout par en bas), cercle de lune dessus. Premiers verrous vus : corniche trop haute, gouffre, mur fissuré. |
| **Grand arbre** | 5 → 6 | Région en hauteur : racines, galeries, **intérieur du tronc** (nouveau, la montée), cime de Kainati, cime cachée, épreuve du singe. |
| **Forêt flottante** | 5 → 5 | Îles, courants d'air, dessous des îles ; une chute ramène à la forêt sombre (raccourci). |
| **Clairière et marais** | 3 → 4 | Clairière, hutte de Morgat, marais agrandi avec de l'eau : c'est là qu'irait le **totem de la pieuvre**. |
| **Forêt corrompue et profondeurs** | 5 → 6 | Forêt corrompue, canopée malade, nid des cocons, antre de Ghil't, et le trou sombre devenu les **Profondeurs** : une vraie zone où le papillon s'apprend et sert, avec sa propre sortie. |

Environ **30 zones** au lieu de 24, plus grandes, et un chemin principal à peu près deux fois
plus long.

## Verrous et clés

| Clé | Où on l'obtient (proposition) | Ce qu'elle ouvre |
|---|---|---|
| Dague | départ | blocs fragiles |
| Ours brun | bosquet, donné par le chef | **sols fissurés** seulement |
| Loup | forêt sombre | pistes, plateformes cachées, longs sauts |
| Singe | grand arbre | lianes, corniches hautes |
| Aigle | forêt flottante | courants d'air, grands vides |
| Répulsif | hutte de Morgat | mousse toxique |
| Papillon | Profondeurs | créatures et barrières corrompues |
| **Grizzly** (facultatif) | grotte de la lisière | **murs fissurés** seulement |
| **Ours-hibou** (facultatif) | cime cachée | sols épais, cassés en retombant de haut |
| **Ours polaire** (facultatif) | île des vents | à définir (glace sur l'eau ?) |
| **Panda** (facultatif) | marais ou clairière | rien : soin |
| **Pieuvre** (facultatif) | marais | passages sous l'eau |
| Formes à venir | — | 4 types de zone cachée, fermées par le bloc « SECRET » : passage minuscule (insecte), terrier à creuser (canidé), courant d'eau trop fort (poisson), paroi à griffes (félin) |

## Étapes

Chaque étape donne quelque chose à regarder ou à jouer. Tout se fait sur une nouvelle branche
Git : la démo actuelle reste jouable.

1. **Le monde sur le papier.** `MONDE_V2.md` : la carte des régions, une fiche par zone, la
   table complète des verrous. Un contrôle automatique dans la carte globale prouve qu'on peut
   tout finir et tout atteindre, sans cul-de-sac. Skills : level-design, gamedev,
   game-design-document. Rien ne change dans le jeu. **Tu valides.**
2. **Les nouvelles pièces de jeu** (petit paquet de code) : sols pour l'ours brun et murs pour
   le grizzly, bloc « SECRET », totems des formes qui n'en ont pas (images provisoires
   d'abord). À essayer dans la zone de test.
3. **Les zones en blocs**, région par région, dans l'ordre de l'histoire : terrain, verrous,
   objets, ennemis, scènes de l'histoire replacées, sans décor. Chaque région est livrée
   jouable, avec le robot du chemin principal remis à jour.
4. **Les zones belles**, région par région, bosquet en premier : décors, fonds, ambiance,
   level design fin. Les totems et médaillons définitifs (trois propositions à chaque fois).
5. **Finitions** : carte du joueur, sauvegarde, équilibrage, partie complète rejouée.

## Risques

- Les scènes de l'histoire sont calées sur des positions : chaque zone refaite demande de
  recaler ses déclencheurs. C'est le gros du travail caché de l'étape 3.
- Les sauvegardes actuelles ne seront plus valables.
- Les 10 commits locaux sont à pousser avant de commencer, pour que l'autre PC parte du même
  point.

## Décisions à prendre (mes recommandations en premier)

1. **Bosquet après le bannissement** : le village reste fermé jusqu'à la fin, mais on revient
   en cachette dans ses caves et ses abords. (Autre choix : tout reste fermé, ou tout se rouvre.)
2. **Les ours (grizzly, ours-hibou, polaire, panda) et la pieuvre** : facultatifs, ce sont les
   récompenses de l'exploration. (Autre choix : le grizzly devient obligatoire dans l'histoire.)
3. **Taille** : environ 30 zones, chemin principal deux fois plus long.
4. **Histoire** : mêmes scènes, même ordre, seulement replacées.
5. **Zones cachées des formes à venir** : les 4 types du tableau.
