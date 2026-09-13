# Legend of Agarica

Jeu-cadeau d'anniversaire : metroidvania-lite 2D, inspiré du personnage DnD "Agarica"
(druidesse, Cercle de la Lune). Voir `Legend_of_Agarica_GDD.md` pour le détail complet
(narratif, DA, bestiaire, roadmap) — ce fichier est un résumé rapide pour chaque session.

## Stack

- JavaScript pur + Phaser 3 (chargé via CDN, pas de build/npm).
- Une seule page HTML jouable directement dans le navigateur (fichier ou lien, sans install).
- Pas de framework, pas de TypeScript, pas de bundler : rester simple, projet solo avec deadline.

## Structure du projet

- `index.html` — page unique, charge Phaser (CDN) puis `src/main.js`.
- `src/main.js` — config Phaser + scènes.
- `src/scenes/` — une scène par zone/écran (Boot, Zone1, Zone2, Zone3, EndScreen...).
- `assets/` — sprites, sons, musiques (ajoutés au fil des tickets).

## Gameplay clé (voir GDD section 3-4)

- Déplacement : flèches / QSD.
- Saut simple, 2e saut en l'air = transformation visuelle **Aigle** (plané léger).
- Sprint (Shift ou double-tap direction) = transformation visuelle **Loup** (vitesse x1.5-2).
- Transformation = automatique et visuelle (changement de sprite pendant l'action), jamais un
  menu ou un bouton dédié.
- Compagnon **Xara** (araignée) : suit Agarica à distance avec délai, pas de combat.
- 1 seul niveau, 3 zones courtes (intro / passage Aigle / passage Loup), 2-3 ennemis max,
  1 PV chacun.

## Direction artistique

Silhouettes sombres façon Hollow Knight, palette réduite : violet nuit / vert lunaire /
touches de rose (clin d'œil au tatouage d'Agarica). Pas d'animation dessinée à la main
complexe — formes géométriques stylisées, silhouette + contour lumineux.

## Roadmap (tickets, voir GDD section 10 pour le détail)

1. Setup projet Phaser (page vide, boucle de jeu de base) — **en cours**
2. Déplacement + saut simple + collisions décor
3. Double-saut → forme Aigle + plané
4. Sprint → forme Loup + vitesse
5. Compagnon Xara (suivi + réaction)
6. Zone 1 (intro, sans ennemi)
7. Zone 2 (vide à franchir + Loup sanguinaire)
8. Zone 3 (toiles d'araignée + Araignée fixe)
9. Écran de fin personnalisé
10. Polish (couleurs, lumière lunaire, son)

## Conventions de travail

- Avancer ticket par ticket dans l'ordre ci-dessus, ne pas anticiper les zones/ennemis avant
  que le mouvement de base ne soit solide.
- Rester dans le budget technique du GDD (pas de vraie IA d'ennemis, pas de vrai metroidvania
  avec grande carte) sauf demande explicite d'ajouter une idée bonus (section 11 du GDD).
- Tester dans le navigateur après chaque ticket avant de passer au suivant.
