---
name: capture
description: Prendre une capture d'écran d'un endroit précis d'une zone de Legend of Agarica (avec gros plan), en une commande. À utiliser pour regarder un rendu, comparer avant et après, ou vérifier une retouche visuelle, au lieu d'écrire une commande playtest avec du JavaScript à la main.
---

# Capture d'un endroit du jeu

```
python tools/capture.py <zone> --x <x> --y <y> [--flags a=b c=d] [--keys "ArrowRight:800"] [--js "<expr>"] [--zoom x,y,l,h] [--out fichier.png]
```

- `<zone>` : id de zone (`foret_sombre_1`) ou nom de scène (`ForetSombre1Scene`).
- `--x --y` : où poser Agarica, en coordonnées du monde (y = ses pieds ; une case = 64 px,
  sol courant à y 448). Sans eux : le point de départ de la zone.
- `--zoom x,y,l,h` : gros plan (x3, pixels nets) d'un rectangle de l'écran 960x540. Agarica
  est en général vers le centre de l'écran.
- `--js` : une expression dont le résultat est affiché (mesure rapide).
- La commande affiche le chemin de l'image : lis-la ensuite avec Read. Par défaut elle va
  dans le dossier temporaire du système ; donne `--out` pour garder un « avant » et un « après ».

## À savoir

- Un seul navigateur à la fois : pas deux captures en parallèle.
- Une cinématique de début de zone bloque les touches et affiche le titre : passe les
  drapeaux qui l'évitent (`--flags xaraMet=true talismanOurs=true`), ou pose Agarica plus
  loin. `xaraMet=true` est mis d'office.
- Un élément conditionnel (bloc cassable avec `requires`, PNJ) n'existe que si ses drapeaux
  sont passés.
- Pour une suite de gestes ou plusieurs mesures : `tools/playtest.py` directement
  (`--pre-js`, `--keys`, `--js`, `--shot`).
