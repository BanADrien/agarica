# Éditeur de niveaux : mode d'emploi

Lot 1 du nouvel éditeur (conception : `EDITEUR_V2_DESIGN.md`). L'ancien reste là : `…/index.html?editor=ancien`.

## L'ouvrir

1. Dans le dossier du jeu : `python tools/dev_server.py 8000`
   (une seule commande : elle sert le jeu sans cache ET reçoit les enregistrements).
2. Dans le navigateur : `http://localhost:8000/index.html?editor`

Sans ce serveur (fichier ouvert directement, ou `python -m http.server`), l'éditeur marche quand même,
mais il prévient en rouge : rien n'est écrit dans le jeu, le travail reste en **brouillon** dans le navigateur.

## L'écran

```
 Éditeur  [Zone ▾]  Terrain  Décors  Créatures  Objets  Histoire  Passages  Zone  Monde   (?) [▶ Jouer ▾]
 [image][image][image][image] …                                        [Chercher une image…]
 ┌──────────────────────────────────────────────┬──────────────────┐
 │                  le niveau,                  │  réglages de     │
 │               comme en jeu                   │  l'élément       │
 │                                  [− 100 % +] │  choisi          │
 └──────────────────────────────────────────────┴──────────────────┘
 x · y | case | Annuler  Refaire | ✓ Aucun problème                       ● Enregistré  [Enregistrer]
```

- **Zone** : la liste ouvre n'importe quelle zone du jeu. Elle s'affiche comme en jeu (Agarica est à son départ).
- **Onglets** : Terrain, Décors, Créatures, Objets, Zone. Histoire, Passages et Monde arrivent aux lots suivants.
- **Bande d'images** : tout ce qui se pose. Les pastilles au-dessus sautent à un groupe, la recherche filtre par nom.

## Les gestes

| Pour… | on fait… |
|---|---|
| poser un élément | clic sur son image, puis clic dans le niveau (il se cale tout seul sur le sol) |
| en poser plusieurs | l'image reste en main : clics suivants. `Échap` ou clic droit pour la ranger |
| choisir un élément | clic dessus (cadre vert, son nom au-dessus) |
| le déplacer | le faire glisser ; ou les flèches (`Maj` + flèche : 8 px) |
| le régler | panneau de droite : taille, vie, sens, contenu d'un coffre… |
| régler à la souris | tirer les ronds verts : bornes de patrouille, bas d'une liane, coin d'un rectangle, bouts d'une branche |
| le copier / l'enlever | `Ctrl + D` / `Suppr` (ou les boutons en bas du panneau) |
| peindre le sol | onglet Terrain, « Peindre le sol », clic glissé ; **clic droit glissé : effacer** |
| annuler / refaire | `Ctrl + Z` / `Ctrl + Y` |
| zoomer | molette (100 % = la vue exacte du jeu ; bouton ⛶ : toute la zone) |
| déplacer la vue | glisser dans le vide, `Espace` + glisser, clic du milieu, ou les flèches |
| changer le fond, la taille, le nom | onglet Zone (les fonds et les jeux de tuiles sont des images dans la bande) |

## Jouer

**▶ Jouer** (`Ctrl + Entrée`) lance la zone telle qu'elle est dans l'éditeur, enregistrée ou non.
`Échap` (ou le bouton en haut) ramène à l'éditeur, au même endroit. La flèche à côté du bouton propose :
partir du milieu de l'écran, jouer avec ta partie (formes, objets, histoire déjà vue), avec toutes les formes,
ou « sans les scènes d'histoire » (le niveau seul : ni cinématique ni boss, pratique pour essayer un saut).
Ta vraie partie n'est jamais modifiée par ces essais.

## Enregistrer

**Enregistrer** (`Ctrl + S`) écrit `src/data/<zone>_data.js` dans le projet. Avant chaque écriture, l'ancienne
version est copiée dans `src/data/_backup/` avec la date et l'heure (les 20 dernières par zone sont gardées).
Pour revenir en arrière : recopier une de ces copies à la place du fichier.

- Rien n'est perdu : tout ce que l'éditeur ne sait pas encore modifier (sorties, déclencheurs, caméra…) ressort tel quel.
  L'en-tête du fichier (le plan de la zone en commentaire) est gardé ; les commentaires à l'intérieur sont remplacés
  par des commentaires automatiques, et le sol reste écrit en rangées `groundRow(...)`.
- Avant d'écrire, l'éditeur relit le fichier tel qu'il serait et le compare à la zone : à la moindre différence, il n'écrit rien et le dit.
- Entre deux enregistrements, un **brouillon** est gardé dans le navigateur (pastille jaune « Modifications non enregistrées »).
  Onglet Zone, « Revenir au fichier » l'abandonne.
- Après un enregistrement, recharger la page du jeu pour voir la zone en jeu normal (dans l'éditeur, « Jouer » la montre tout de suite).
- Une zone que l'éditeur ne saurait pas réécrire à l'identique s'ouvre en **lecture seule**, avec la raison (aucune zone du jeu n'est dans ce cas aujourd'hui).
- Si un brouillon de l'ANCIEN éditeur existe pour la zone, l'onglet Zone le signale : en jeu, c'est lui qui s'affiche à la place du fichier, tant qu'on ne l'a pas « oublié ».

## Les contrôles

En bas, « ✓ Aucun problème » ou « ⚠ n problèmes à voir » (un clic va au suivant). En rouge sur le niveau :

- deux cases de sol qui ne se touchent que par un coin (il faut ajouter la case du coin) ;
- un élément posé dans le sol, ou en dehors de la zone.

## Ajouter un élément à l'éditeur (pour plus tard)

Tout est dans la table `src/editeur/catalogue.js` : une ligne par image de la bande (nom affiché, onglet, image,
valeurs de départ) et, par genre d'élément, la liste de ses réglages avec leur libellé en français.
