# Boss Gorille — planches d'animation

Boss "gorille de pierre" : grand singe au pelage blanc, mousse/cristaux verts
luminescents sur les épaules, bras et poignets, casque de pierre gravé (motifs
type stèle) sur la tête, trois griffures rouges sur la joue gauche, yeux verts
lumineux. Référence : `reference/gorille_reference.png`.

## Où poser quoi

- `sheets/` — les **planches brutes** générées (une par animation, PNG à fond
  transparent). C'est le seul dossier à remplir à la main.
- `gorille_<anim>_frames/` — les **frames découpées**, générées par script (voir
  plus bas). Vides pour l'instant, ne rien y déposer manuellement.
- `reference/` — l'image de référence du boss, à ne pas modifier.

## Animations attendues

| Dossier de frames              | Planche à fournir                 | Frames | Boucle | Description |
|--------------------------------|-----------------------------------|--------|--------|-------------|
| `gorille_idle_frames/`         | `sheets/gorille_idle.png`         | 4      | oui    | Respiration sur les quatre appuis, léger balancement des épaules. |
| `gorille_marche_frames/`       | `sheets/gorille_marche.png`       | 6      | oui    | Marche lourde en appui sur les phalanges (knuckle walk), vers la droite. |
| `gorille_charge_frames/`       | `sheets/gorille_charge.png`       | 6      | oui    | Course de charge, corps penché en avant, poussière aux appuis. |
| `gorille_attaque_frappe_frames/` | `sheets/gorille_attaque_frappe.png` | 5   | non    | Lève un bras et frappe le sol devant lui (anticipation → impact → retour). |
| `gorille_attaque_saut_frames/` | `sheets/gorille_attaque_saut.png` | 6      | non    | Saut sur place puis fracas au sol, onde de choc et débris à l'impact. |
| `gorille_cri_frames/`          | `sheets/gorille_cri.png`          | 4      | non    | Rugissement torse bombé, cristaux verts qui s'intensifient (changement de phase). |
| `gorille_degat_frames/`        | `sheets/gorille_degat.png`        | 2      | non    | Encaisse un coup, recul de la tête, grimace. |
| `gorille_mort_frames/`         | `sheets/gorille_mort.png`         | 5      | non    | S'effondre en avant, casque de pierre qui se fissure, lueur verte qui s'éteint. |

Les compteurs de frames sont indicatifs : mieux vaut une planche cohérente
qu'un compte exact. Par contre **toutes les planches doivent partager la même
échelle de personnage** (même taille de gorille d'une anim à l'autre), sinon le
boss change de taille en jeu.

## Contraintes de planche

- Fond **transparent** (pas de fond noir, pas de damier).
- Frames sur **une seule ligne**, lues de gauche à droite, dans l'ordre de
  l'animation.
- Un **vrai espace vide** entre deux frames : le découpage se fait par
  composantes connexes sur l'alpha, deux frames qui se touchent sont fusionnées.
- Personnage tourné vers la **droite** (le jeu utilise `flipX` pour la gauche).
- Style : pixel art, contour noir marqué, même palette que la référence.
- Cadrage cohérent : le gorille posé au sol, aligné en **bas** de sa frame
  (le découpage réaligne en bas-centre, mais partir déjà propre évite les
  sautillements).

## Découpage vers `*_frames/`

Depuis la racine du projet, une fois une planche déposée dans `sheets/` :

```
python tools/split_spritesheet.py assets/sprites/boss_gorille/sheets/gorille_idle.png assets/sprites/boss_gorille/gorille_idle_frames --prefix gorille_idle
```

Le script sort des fichiers `gorille_idle_row0_0.png`, `gorille_idle_row0_1.png`, …
(nomenclature identique au reste du projet : `loup_frames/`, `ours_frames/`, etc.),
tous au même format de canvas et alignés bas-centre.

Si une planche a des éléments **disjoints** du corps (débris de l'impact, onde
de choc, poussière), `split_spritesheet.py` les découpe comme des frames
séparées — c'est exactement le cas qui a demandé un script dédié pour l'Ours
(`tools/crop_ours_skill.py`). Concerne surtout `attaque_saut` : prévoir un
script dédié ou coller les débris au corps du gorille dans la planche.

## Chargement en jeu (pas encore fait)

À brancher plus tard dans `src/scenes/BootScene.js` (chargement des textures)
et dans une entité `src/entities/BossGorille.js` (animations + IA), sur le
modèle de `src/entities/Crapaud.js`.
