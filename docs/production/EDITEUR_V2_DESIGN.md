# Nouvel éditeur de niveaux : conception

Demande de l'utilisateur du 2026-11-15 : refaire tout le mode éditeur, « beaucoup plus simple
d'utilisation, plus visuel », avec des images pour choisir les éléments et des icônes pour le reste,
une barre de navigation pour ne pas tout avoir au même endroit, un moyen facile de relier les zones
et de poser des déclencheurs. « Ne pars pas forcément de la base actuelle. »

L'ancien éditeur (`src/scenes/EditorScene.js`, panneau `#editor-ui` d'`index.html`) reste en place
et accessible tant que le nouveau n'est pas validé par l'utilisateur.

## Décisions de l'utilisateur

1. **Disposition : onglets en haut.**
   ```
   +--------------------------------------------------------------+
   | Zone: Foret sombre 1 v | Terrain Decors Creatures Objets     |
   |                        | Histoire Passages Zone | > Jouer    |
   +--------------------------------------------------------------+
   | [img] [img] [img] [img] [img] [img] [img] [img]  recherche.. |
   +----------------------------------------------+---------------+
   |                                              | Crapaud       |
   |                                              | PV      [ 2 ] |
   |              le niveau                       | Regarde [<][>]|
   |                                              | Patrouille    |
   |                                              | [ Supprimer ] |
   +----------------------------------------------+---------------+
   | x 1280 y 448 | case 20,7 | Annuler  Refaire | Enregistre  OK |
   +--------------------------------------------------------------+
   ```
   Une barre du haut (zone en cours, onglets, bouton Jouer), une bande d'images sous la barre, le
   niveau au milieu, les réglages de l'élément choisi à droite, une barre d'état en bas.
2. **Relier les zones : sur la carte du monde.** Un onglet « Monde » montre toutes les zones ; on
   tire un trait du bord d'une zone vers une autre, la sortie et l'arrivée sont créées des deux
   côtés d'un coup ; un clic sur un trait le modifie ou le supprime.
3. **Déclencheurs : une phrase à trous.** « Quand Agarica entre ici → [action], [une seule fois / à
   chaque fois], [seulement si…] ». Actions à choisir dans l'éditeur, toutes les quatre retenues :
   bulle ou dialogue (texte tapé dans l'éditeur), cinématique existante (choisie dans une liste),
   aide à l'écran, drapeaux et objets (donner un objet, activer un drapeau, débloquer une forme ou
   une compétence).
4. **Enregistrer : directement dans le jeu.** Un bouton écrit le fichier de la zone dans le projet,
   avec une copie de secours de l'ancienne version à chaque fois. L'utilisateur a accepté que les
   commentaires écrits à la main dans les fichiers de zone soient remplacés par des commentaires
   automatiques.

## Principes

- **On choisit avec les yeux.** Chaque élément posable a sa vignette (la vraie image du jeu, ou
  son image provisoire). Les outils sans image ont une icône et un nom en clair. Aucun terme de
  code à l'écran : « Créature », pas `enemies` ; « Vie », pas `hp`.
- **Un geste = un résultat.** Cliquer une image puis cliquer dans le niveau pose l'élément. Cliquer
  un élément posé le sélectionne : on le déplace à la souris, on le règle à droite, [Suppr]
  l'enlève. Annuler et refaire partout (Ctrl+Z, Ctrl+Y).
- **Le niveau s'affiche comme en jeu** : mêmes fonctions de rendu que le jeu (LevelKit), pas une
  imitation.
- **Rien de perdu.** L'éditeur relit et réécrit TOUTES les clés d'une zone, y compris celles qu'il
  ne sait pas modifier (elles ressortent telles quelles). Copie de secours à chaque
  enregistrement. Un brouillon est gardé dans le navigateur entre deux enregistrements.
- **Les règles de niveaux sont vérifiées en direct** : deux cases de sol qui ne se touchent que
  par un coin sont signalées tout de suite (règle de l'utilisateur), comme une sortie sans arrivée.

## Onglets

| Onglet | Contenu |
|---|---|
| Terrain | peindre et effacer le sol, sol de second plan, eau, branches et troncs, plateformes cachées ; choix du jeu de tuiles |
| Décors | tous les décors posables, rangés par biome, avec leurs images |
| Créatures | ennemis, boss, animaux, PNJ, avec leurs images ; patrouille réglée à la souris |
| Objets | feux de camp, totems, coffres, cœurs, trésors, papillons, objets à ramasser, blocs cassables, mousse, lianes, courants d'air, pistes du loup, toiles |
| Histoire | déclencheurs (phrase à trous), points de reprise, départ du joueur |
| Passages | sorties et arrivées de la zone, portails ; renvoie à l'onglet Monde pour relier |
| Zone | nom, fond, ambiance, taille, compagnon, script d'histoire |
| Monde | toutes les zones, les relier, en créer une, en ouvrir une |

## Enregistrement

- Le jeu se lance avec le serveur du projet, qui sert les fichiers sans cache et reçoit les
  enregistrements. Sans ce serveur, l'éditeur le dit clairement et garde le brouillon.
- Le fichier `src/data/<zone>_data.js` est réécrit par l'éditeur : en-tête d'origine conservé
  (le plan de la zone écrit en commentaire au début du fichier), une clé par section avec un
  commentaire automatique, le sol écrit en rangées (`groundRow`) pour rester lisible.
- Copie de secours horodatée dans `src/data/_backup/` (hors git) avant chaque écriture.
- Une nouvelle zone crée son fichier de données, sa scène, et s'inscrit dans `index.html` et
  `src/main.js`.

## Lots

1. **Le cœur** : la nouvelle interface (barre, onglets Terrain, Décors, Créatures, Objets, Zone),
   poser, sélectionner, déplacer, régler, supprimer, annuler ; ouvrir une vraie zone du jeu ;
   Jouer ; Enregistrer dans le projet avec copie de secours ; contrôles en direct.
2. **Le monde** : onglet Monde, relier les zones d'un trait, créer une zone, onglet Passages.
3. **L'histoire** : déclencheurs en phrase à trous avec les quatre actions, points de reprise,
   textes tapés dans l'éditeur.

Chaque lot est livré testable. L'ancien éditeur reste accessible jusqu'à la fin du lot 3.
