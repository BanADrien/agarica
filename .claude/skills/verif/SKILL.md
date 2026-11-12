---
name: verif
description: Vérifier le jeu Legend of Agarica en une commande à sortie courte (scènes, éditeur, règle des diagonales, robot du chemin principal). À utiliser après toute modification du code ou d'une zone, avant de commiter, et pour vérifier le travail d'un agent, au lieu d'écrire des commandes de test à la main.
---

# Vérifier le jeu

Une seule commande, lancée depuis la racine du projet. Elle n'affiche que les échecs et une
ligne de bilan : ne lis le journal que si un point échoue.

| Besoin | Commande |
|---|---|
| Tout (scènes + éditeur + diagonales), environ 8 min | `python tools/verif.py` |
| Quelques scènes, environ 20 s chacune | `python tools/verif.py --scenes ForetSombre1Scene,ZoneOursScene` |
| Règle des diagonales seule, environ 15 s | `python tools/verif.py --rapide` |
| En plus, le robot sur des segments du chemin | `python tools/verif.py --robot fs1 fs2` |
| En plus, tout le chemin principal (long) | `python tools/verif.py --robot tout` |

Segments du robot : `titre bosquet fs1 fs2 racines arene ff1 ff2 clairiere hutte fc1 ghilt1 trou ghilt2 retour`.

## Règles

- Un seul navigateur à la fois : ne lance jamais deux vérifications en parallèle, ni pendant
  qu'un agent teste. La passe complète peut partir en arrière-plan (`run_in_background`).
- Choisis la plus petite vérification qui couvre le changement :
  - une zone modifiée : `--scenes <SaScene>` (les diagonales sont toujours contrôlées) ;
  - joueur, commandes ou moteur (`Player.js`, `LevelKit.js`, `StoryKit.js`) : passe complète,
    plus `--robot fs1 fs2` ;
  - avant une mise en ligne sur Netlify : passe complète et `--robot tout`.
- Le robot peut échouer une fois par malchance (combat) : relance le segment seul avant de
  conclure à une régression.
- Le robot est dans `tools/robot/` (`chemin.py`, `pathbot.js`, `vinebot.js`, `duelbot.js`).
  Si une commande du jeu change (saut, lianes, sprint), c'est lui qu'il faut adapter.
