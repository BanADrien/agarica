---
name: gamedev
description: Guides de mécaniques de jeu (saut et plateforme, ressenti des coups, level design et verrous, caméra, IA d'ennemis, sauvegarde, entrées et manette, dialogues, interface, son, performances, Phaser) tirés de awesome-gamedev-agent-skills. À lire AVANT de concevoir, régler ou déboguer une mécanique de Legend of Agarica, ou quand un joueur signale un défaut de ressenti (saut, caméra qui saccade, perso coincé, coup mou, sauvegarde cassée).
---

# Guides de mécaniques de jeu

Source : https://github.com/gamedev-skills/awesome-gamedev-agent-skills (Apache-2.0, version du
2026-11-12, licence et notice dans `ref/`). Sur les 80 skills du dépôt, seuls les 14 utiles à ce
jeu sont copiés ici, dans `ref/<nom>/GUIDE.md`. Ils ne sont pas listés un par un pour ne pas
charger le contexte : lis seulement le ou les guides de la ligne qui correspond au besoin.

| Besoin | Guide à lire (`.claude/skills/gamedev/ref/…`) |
|---|---|
| Saut, coyote, tampon de saut, saut variable, murs, plateformes mobiles, perso qui accroche un coin de tuile | `platformer/GUIDE.md` (+ `references/feel-tuning.md`, `scripts/jump_tuner.py`) |
| Coups qui manquent d'impact, secousse d'écran, arrêt sur image, écrasement et étirement | `game-feel/GUIDE.md` |
| Concevoir ou vérifier une zone : mesurer le vrai saut, rythme, verrous et chemin critique (blocages) | `level-design/GUIDE.md` |
| Caméra : zone morte, anticipation, bords de niveau, saccades | `camera-systems/GUIDE.md` |
| Saccades liées au pas de physique, hauteur de saut qui change avec la fréquence d'écran | `physics-tuning/GUIDE.md` |
| Ennemis et boss : machine à états, perception, poursuite, ennemi coincé | `game-ai/GUIDE.md` |
| Sauvegarde : quoi enregistrer, versions et migration, sauvegarde écrasée ou cassée | `save-systems/GUIDE.md` |
| Touches, clavier AZERTY, manette, réglage des touches, appui perdu | `input-systems/GUIDE.md` |
| Dialogues, choix, conditions | `dialogue-systems/GUIDE.md` |
| Menus, HUD, lisibilité | `game-ui-ux/GUIDE.md` |
| Son : bus, mixage, variations, musique adaptative (avec le skill `son`) | `audio-design/GUIDE.md` |
| Chutes d'images, trop d'objets, textures | `performance-optimization/GUIDE.md` |
| Phaser : scènes, chargeur, écran noir | `phaser-core/GUIDE.md` |
| Phaser Arcade : corps, collisions, traversées | `phaser-arcade-physics/GUIDE.md` |

## À savoir avant d'appliquer un guide

- **Version de Phaser** : les deux guides Phaser sont écrits pour Phaser 4 (et 3.90). Le jeu est en
  **Phaser 3.80**, chargé par CDN, en scripts globaux sans `import`. Vérifie chaque appel dans le
  code du jeu avant de le reprendre ; n'applique aucune migration vers Phaser 4.
- Les exemples des autres guides sont en GDScript, C# ou pseudocode : on reprend l'idée et les
  chiffres, pas le code.
- Les règles du projet l'emportent sur un guide : `CLAUDE.md`, `docs/production/PLAN_DEV.md`,
  les règles de niveaux de l'utilisateur (jamais deux cases de sol qui ne se touchent que par un
  coin), le budget technique (pas de vraie IA d'ennemis ni de génération procédurale sauf demande).
- Ce que le jeu a déjà : coyote 140 ms, tampon de saut 120 ms, saut à hauteur variable, pas de
  physique adapté au-delà de 90 Hz, secousses réglables, robot de test (`tools/robot/`), carte
  globale avec contrôles de cohérence (`carte.html`). Lis le code avant de proposer un ajout.

## Pistes relevées pour ce jeu (2026-11-13)

Voir `docs/production/GAMEDEV_PISTES.md` : ce que ces guides pourraient apporter, classé par intérêt.
