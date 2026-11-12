# Carte du monde (outil de travail)

Une page qui montre **toutes les zones du jeu dans un même plan**, lues dans les vrais fichiers
(`src/data/*_data.js`). Ce n'est pas la carte que le joueur voit (touche M) : c'est un outil pour
avoir l'idée d'ensemble, demander des modifications précises et repérer ce qui cloche.

## L'ouvrir

1. Servir le projet : `python -m http.server 8000` depuis la racine (pas `tools/dev_server.py`).
2. Ouvrir `http://localhost:8000/carte.html` (il faut Internet : Phaser vient du CDN, comme le jeu).

Rien n'est recopié : la page lit la liste des scripts dans `index.html`, les charge tous sauf
`src/main.js` (le jeu ne démarre pas), puis dessine. **Recharger la page (F5) suffit après une
modification de zone.** Une zone ajoutée à `index.html` et à `DEMO_ZONES` apparaît toute seule.

Fichiers : `carte.html` (racine), `tools/carte/charge.js` (chargement), `monde.js` (modèle et
contrôles), `carte.js` (dessin et interface). Rien de tout cela ne part en ligne
(`tools/build_netlify.py` ne copie que `index.html`, `src/` et `assets/`).

## Ce qu'on voit

- **24 zones** : les 14 du chemin principal (cadre vert, numéro = ordre de l'histoire ; `12·14` =
  l'antre de Ghil't, visité deux fois) et les 10 facultatives (cadre rose pointillé). Les anciennes
  zones de test et le monde spirituel sont derrière une case à cocher.
- **Terrain réel** de chaque zone (`zoneGroundCells` : sol + cases des branches), branches et troncs
  en plus pâle, sol de second plan en très pâle. Chaque zone garde ses proportions.
- **Passages** : segment or sur le bord pour chaque sortie, trait fléché jusqu'à l'entrée d'arrivée
  (or = chemin principal, violet = facultatif, pointillé = passage fait par un script, pâle = zones
  éloignées sur la carte).
- **Ennemis, boss, PNJ, feux, totems, coffres / cœurs / objets, papillons, cassables (O = ours,
  É = épée), lianes, courants d'air, mousse, pistes et plateformes du loup, points de reprise,
  déclencheurs, dangers** (ligne de chute, nappes, pièges). La liste « Afficher » sert de filtre
  et de légende. Les noms apparaissent en zoomant ; survoler un symbole donne le détail.
- **Pastilles d'accès** à côté du nom : L loup, S singe, A aigle, O ours, 2 second saut,
  H étape de l'histoire. Le détail est dans la fiche de la zone (panneau de droite).
- **Disposition** : « deux bandes » (acte I au-dessus, acte II dessous : tout est deux fois plus
  gros) ou « monde réel » (`MAP_ZONE_LAYOUT` de `src/scenes/MapScene.js`, la carte du jeu).

Molette : zoom. Glisser : déplacer. Clic sur le nom d'une zone (carte ou liste) : la cadrer.
`F` : tout voir. `G` : grille de 64 px (numéros de case au zoom fort). La barre du bas donne la
zone, x, y et la case sous la souris. La vue et les filtres sont retenus d'une fois sur l'autre.

## Clic sur un point d'une zone : le menu

1. **Ajouter une note ici** : un texte attaché à la zone et au point cliqué.
2. **Ouvrir dans l'éditeur** : ouvre `index.html?editor` dans un onglet, y charge la zone cliquée
   et place la caméra sur le point. (L'éditeur n'a pas de paramètre de zone : la carte lui demande
   de la charger avec sa propre fonction, celle de sa liste « Charger une zone ».)
3. **Jouer ici** : lance la zone (`index.html?zone=…&flags=…&enter=…`, raccourci de `BootScene`)
   avec Xara, le loup, le singe, l'aigle et l'ours. Il n'existe pas de paramètre de position : on
   arrive par **l'entrée la plus proche** du point cliqué. La ligne suivante lance la zone dans
   l'état de quelqu'un qui commence son chapitre (`menuChapterState`).
4. Portée de saut depuis ici, copier les coordonnées.

Limites de « Jouer ici » : `flags` se découpe sur les virgules, donc une liste ne passe qu'avec un
élément (le sac ne contient que le dernier objet du chapitre). Comme tout lancement par `?zone=`,
la partie jouée s'enregistre dans la sauvegarde du navigateur aux feux de camp.

## Notes

Les notes restent dans le navigateur (`localStorage` de la page, clé `agarica-carte-notes-v1`) :
elles survivent au rechargement, mais sont propres à ce navigateur et à cette adresse. Le panneau
de droite les liste (clic : y aller ; « Supprimer » ; « Tout vider »).

**« Copier pour Claude »** met dans le presse-papiers une ligne par note, à coller dans la
conversation :

```
foret_sombre_2 (3900, 300 / case 60, 4) : Élargir cette plateforme de 2 cases
```

`x, y` sont en px de la zone (comme dans les fichiers de données), la case sur la grille de 64 px.

## Aides au level design

- **Portée de saut** : `Maj + clic` (ou le menu). Les pieds se posent sur le sol sous le point.
  Mesures de `VAGUE3_DESIGN.md` § 0 : saut simple 172 px de haut et 180 px de portée, saut du loup
  lancé 376 px de portée, second saut du singe 264 px de haut, de l'aigle 284 px. Ce sont des
  repères, pas une simulation de la physique.
- **Contrôles** (panneau de droite, ronds rouges sur la carte) : sortie vers une scène ou une entrée
  qui n'existe pas, zone injoignable depuis le bosquet, point d'arrivée ou élément dans le sol ou
  hors de la zone, deux cases de sol qui se touchent par un seul coin (règle du 2026-11-09), boîtes
  qui se chevauchent sur la carte. En orange, à vérifier seulement : passage à sens unique, entrée
  que rien ne vise, liane sans case solide au-dessus.
- **« Copier le résumé du monde pour Claude »** : zones, accès, sorties, contenu et contrôles en texte.
- Étiquette « brouillon » : un brouillon de l'éditeur existe dans ce navigateur pour cette zone. Le
  jeu et l'éditeur jouent le brouillon ; la carte montre toujours le fichier.

## Ce qui est écrit à la main

Trois petites tables en tête de `tools/carte/monde.js`, chacune avec sa source :

- `PARCOURS` : l'ordre du chemin principal (CLAUDE.md, « Démo complète en 15 zones ») ;
- `ACCES` : ce qu'il faut pour entrer dans une zone (VAGUE3_DESIGN.md § 1.2 et CLAUDE.md) ; la fiche
  ajoute ce qui se lit dans les données (`requires` des sorties, cassable posé sur une sortie,
  `exitsAfterVictory`) ;
- `PASSAGES_SCRIPT` : les changements de zone faits par un script (bannissement, arches de
  l'épreuve, crash, sentier de la hutte, défaite contre Ghil't). Un contrôle prévient si une
  cinématique change de zone sans être dans la table.

Cœur de la forêt sombre 2 et Ghil't : posés par un script, lus dans ses constantes (`FS2_COEUR`,
`GHILT_ARENA`). Tout autre élément créé seulement par un script n'apparaît pas sur la carte.

Pour un assistant : dans la console (ou Playwright), `Carte.etat.monde` donne les zones, les
passages et `alertes` ; `Carte.resumeMonde()` le texte d'ensemble ; `Carte.cadrerPoint(zone, x, y)`.
