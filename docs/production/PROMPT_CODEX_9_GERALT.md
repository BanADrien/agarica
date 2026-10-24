# Prompt Codex n°9 — poses de combat de Geralt (2026-10-24)

Le duel de la forêt flottante 1 est devenu un vrai combat (`src/entities/GeraltDuel.js`) : tir droit, tir en cloche, saut en cloche avec tir plongeant puis réception ratée, pose de collets, pris à son propre collet, sonné, touché. Aujourd'hui, ces poses empruntent des frames existantes (`attack_miss` 0-1 pour viser, `trip_fall` pour les chutes). Le code est **déjà branché** sur les ids ci-dessous : dès que `geralt_combat` est importé, il remplace les poses de repli, sans autre changement.

- **3 images** à générer : `geralt_combat.png`, `geralt_combat_p2.png`, `geralt_combat_p3.png`.
- **1 entrée de manifeste** : `geralt_combat`, déjà ajoutée au manifeste (2026-10-25).
- Même échelle que `assets/sprites/geralt.png` : Geralt **~230 px de haut debout** (hauteur visible mesurée sur `geralt_frames/geralt_row0_0.png`). Le jeu calibre chaque planche sur l'idle de Geralt (même taille visible debout), mais une planche dessinée à la bonne échelle reste plus nette.
- Le nombre de frames de chaque rangée est **imposé par le code** (frames figées : voir la colonne « usage en jeu »).

## Ce que le code attend (ne pas changer les noms ni les nombres de frames)

| Rangée (manifest) | Image | Anim | Frames | fps | Usage en jeu |
|---|---|---|---|---|---|
| 0 | geralt_combat.png (rangée 1) | `shoot` | 5 | 12 | frame 1 figée pendant la visée (télégraphe), puis 2→4 au tir |
| 1 | geralt_combat.png (rangée 2) | `shoot_up` | 5 | 12 | frame 1 figée (vise en l'air, flèche en cloche), puis 2→4 au tir |
| 2 | geralt_combat.png (rangée 3) | `jump_shoot` | 4 | 10 | 0 figée = accroupi avant le saut ; 1 figée = en l'air, arc bandé (aussi la roulade d'esquive) ; 2→3 = tir vers le bas puis il perd l'équilibre |
| 3 | geralt_combat_p2.png (rangée 1) | `crash` | 4 | 10 | réception ratée (0→2), frame 3 figée = il se relève (assis, sonné) |
| 4 | geralt_combat_p2.png (rangée 2) | `stunned` | 4 | 6 boucle | à plat ventre, sonné (fenêtre de frappe ; les étoiles sont ajoutées par le jeu) |
| 5 | geralt_combat_p2.png (rangée 3) | `set_trap` | 4 | 10 | pose un collet au sol (télégraphe du piège) |
| 6 | geralt_combat_p3.png (rangée 1) | `trapped` | 4 | 10 | pris à son propre collet : la corde à la cheville, il s'étale (finit à plat ventre, comme `stunned`) |
| 7 | geralt_combat_p3.png (rangée 2) | `hurt` | 3 | 12 | touché par Agarica, il recule |

Rien d'autre à dessiner : flèche (`objet_fleche`), collet (`objet_collet`), marqueur de danger (`fx_marqueur_danger`), étoiles (`ui_etoiles_etourdi`), alerte (`ui_alerte`) et la colonne d'invocation existent déjà. Pas de flèche détachée sur ces feuilles : la flèche en vol est un objet à part ; sur les frames de visée, la flèche encochée TOUCHE l'arc et la main.

## Prompt à coller dans Codex

```
Nouvelles images pour « Legend of Agarica » (prompt n°9, poses de combat de Geralt). Règles habituelles :
- fond transparent ;
- une rangée = une animation, nombre de frames EXACT (le code fige certaines frames par leur numéro) ;
- frames séparées d'au moins 40 px, rangées d'au moins 60 px ;
- une silhouette connexe par frame (arc, flèche encochée et carquois touchent le personnage) ;
- tourné vers la DROITE ;
- aucun texte ;
- ne modifie ni `src/` ni le manifeste (l'entrée `geralt_combat` y est déjà).
Joins comme référence `assets/sprites/geralt.png`, `assets/sprites/geralt_p2.png` et `assets/sprites/geralt_frames/geralt_row0_0.png`.
Même personnage, MÊME ÉCHELLE (Geralt ~230 px de haut debout, comme sur geralt.png), même rendu, mêmes couleurs (cheveux et barbe brun-roux).
Aucun effet détaché (poussière, étoiles, traits de vitesse) : le jeu les ajoute.

Fiche (à inclure dans chaque prompt) : GERALT (halfling ranger, original design: NO witcher medallion, NO sword on the back, NO eye scar, NO yellow cat eyes): a short stocky middle-aged halfling (about 0.85x Agarica's height), tired hunter look with heavy-lidded brown eyes and bags under them, round face, round nose, small round non-pointed ears, messy curly chestnut-brown hair in a short stubby ponytail, short scruffy auburn beard, dark blue-black geometric tribal zigzag tattoos on both cheeks and forearms, patched moss-green hooded tunic, brown leather vest covered with pouches, a satchel stuffed with rolled map scrolls, a short wooden bow and a quiver on his back, bare big hairy halfling feet. Slightly comic, clumsy-but-proud attitude.

Bloc style (en tête de chaque prompt) : Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces. World palette: night forest in deep violet, indigo and teal, glowing cyan mushrooms, magical accents in luminous green (eyes, runes). Corruption is glowing toxic-green moss that drips like slime with tiny sparkle highlights. Strict side view (profile).

Mise en page (dans chaque prompt) : SPRITE SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background. Exactly {R} horizontal row(s); each row is ONE animation, read left to right. Frames are laid out on an invisible regular grid: each row is a horizontal band about {band} px tall, each frame cell is the row width divided by that row's frame count, and each pose is centered horizontally in its cell with the feet (or lowest point) on the same baseline within a row. Leave at least 40 px of empty transparent space between neighboring frames and at least 60 px of empty transparent space between rows: no part of a frame (hair, bow, arrow, quiver, legs) may touch or overlap another frame or reach into another row. Every frame is ONE single connected silhouette: held objects must touch the hand; NO detached particles, sparkles, sweat drops, dust clouds, motion lines, speed lines, impact stars, sound effects or floating debris; NO flying arrow; NO cast shadow on the ground; NO ground line. Same character, same scale, same proportions and same colors in every frame and every row. Geralt is about 230 px tall when standing (same scale as the reference sheet geralt.png). The character faces RIGHT in every frame. No text, no numbers, no labels, no grid lines, no borders.

1) assets/sprites/geralt_combat.png (1536 x 1024, 3 rangées : 5 / 5 / 4 frames, bandes de ~341 px)
   Rangée 1 « shoot » (tir droit, à hauteur de poitrine, vers la droite) :
   - frame 1 : debout, jambes écartées, il tire une flèche du carquois (la flèche touche sa main et l'arc) ;
   - frame 2 : arc bandé à l'horizontale, flèche encochée pointée droit devant, un œil fermé, sourire satisfait (POSE TENUE pendant la visée : très lisible) ;
   - frame 3 : flèche partie (aucune flèche dessinée), corde qui vibre, recul des épaules ;
   - frame 4 : suivi du geste, bras de l'arc encore tendu ;
   - frame 5 : il abaisse l'arc, fier de lui.
   Rangée 2 « shoot_up » (tir en cloche, arc pointé à 45° vers le haut-droite) :
   - frame 1 : il se cambre en arrière, tire une flèche du carquois ;
   - frame 2 : arc bandé pointé à 45° vers le ciel, flèche encochée, corps cambré, langue tirée de concentration (POSE TENUE) ;
   - frame 3 : flèche partie (aucune flèche dessinée), arc qui vibre ;
   - frame 4 : il suit des yeux la flèche (invisible) en mettant une main en visière ;
   - frame 5 : il se redresse, arc abaissé.
   Rangée 3 « jump_shoot » (saut en cloche, tir vers le bas, perte d'équilibre) :
   - frame 1 : accroupi, genoux très fléchis, prêt à bondir, arc en main, regard décidé (POSE TENUE avant le saut) ;
   - frame 2 : en l'air, jambes repliées, arc bandé pointé vers le BAS-droite à 45° (POSE TENUE pendant l'ascension et la roulade d'esquive) ;
   - frame 3 : en l'air, flèche partie vers le bas (aucune flèche dessinée), corps qui bascule en arrière, surpris ;
   - frame 4 : en l'air, bras qui moulinent, arc qui lui échappe presque (il touche encore ses doigts), panique comique.
   Puis `python tools/import_codex_assets.py --only geralt_combat` une fois les 3 images faites.

2) assets/sprites/geralt_combat_p2.png (1536 x 1024, 3 rangées : 4 / 4 / 4 frames, bandes de ~341 px)
   Rangée 1 « crash » (réception ratée après le saut) :
   - frame 1 : il touche le sol d'un pied, l'autre jambe en l'air, déséquilibré vers l'avant ;
   - frame 2 : il plonge face la première, bras tendus ;
   - frame 3 : à plat ventre, arc posé à côté de sa main (il le touche), carquois renversé sur le dos ;
   - frame 4 : assis par terre, une main sur la tête, cheveux en bataille, l'air sonné (POSE TENUE quand il se relève).
   Rangée 2 « stunned » (à plat ventre, sonné, en boucle) :
   - frame 1 : à plat ventre, joue contre le sol, yeux en spirale, langue sortie ;
   - frame 2 : même pose, un pied qui gigote ;
   - frame 3 : même pose, la tête relevée d'un cheveu, hébété ;
   - frame 4 : comme la frame 1. (Même posture que la fin de « trapped » et que la frame 3 de « crash ».)
   Rangée 3 « set_trap » (il pose un collet au sol, devant lui) :
   - frame 1 : il s'accroupit en sortant une boucle de corde de sa sacoche (la corde touche sa main) ;
   - frame 2 : à genoux, il plante un petit piquet de bois au sol avec la boucle de corde (piquet et corde touchent ses mains) ;
   - frame 3 : il ajuste la boucle posée au sol devant lui, sourire rusé, un doigt sur la bouche ;
   - frame 4 : il se relève en se frottant les mains, très fier.

3) assets/sprites/geralt_combat_p3.png (1536 x 1024, 2 rangées : 4 / 3 frames, bandes de 512 px)
   Rangée 1 « trapped » (pris à son propre collet) :
   - frame 1 : il recule fièrement, le pied arrière pris dans une boucle de corde serrée à la cheville (la corde touche son pied) ;
   - frame 2 : la corde se tend, il bascule en avant, regard horrifié ;
   - frame 3 : il s'étale face la première, la corde toujours à la cheville ;
   - frame 4 : à plat ventre (même posture que « stunned »), la jambe tirée en arrière par la corde.
   Rangée 2 « hurt » (touché, il recule) :
   - frame 1 : choc, il recule d'un pas, yeux fermés, grimace ;
   - frame 2 : il titube en arrière, bras écartés, l'arc tenu à bout de bras ;
   - frame 3 : il se rattrape, l'air vexé.

À la fin :
- lance `python tools/import_codex_assets.py --only geralt_combat`, puis un `python tools/import_codex_assets.py` final (régénère asset_present.js) ;
- vérifie que chaque rangée a EXACTEMENT le nombre de frames du tableau (3 rangées 5/5/4, 4/4/4, 4/3) ;
- mets à jour `docs/production/RAPPORT_CODEX.md`.
```

## Entrée de manifeste (prête à coller dans `ASSET_MANIFEST`, après `geralt`)

```js
  // [P1] Geralt au combat (duel de la forêt flottante 1, prompt Codex n°9) :
  // tir droit / en cloche, saut avec tir plongeant, réception ratée, sonné,
  // pose d'un collet, pris à son propre collet, touché. Même échelle source
  // que `geralt` (~230 px debout) ; calibré par planche sur son idle
  // (GeraltDuel.sheetFactor). Frames figées par le code : voir PROMPT_CODEX_9.
  geralt_combat: {
    dir: "assets/sprites/geralt_combat_frames", prefix: "geralt_combat",
    anims: {
      shoot: { row: 0, frames: 5, fps: 12, repeat: 0 },
      shoot_up: { row: 1, frames: 5, fps: 12, repeat: 0 },
      jump_shoot: { row: 2, frames: 4, fps: 10, repeat: 0 },
      crash: { row: 3, frames: 4, fps: 10, repeat: 0 },
      stunned: { row: 4, frames: 4, fps: 6, repeat: -1 },
      set_trap: { row: 5, frames: 4, fps: 10, repeat: 0 },
      trapped: { row: 6, frames: 4, fps: 10, repeat: 0 },
      hurt: { row: 7, frames: 3, fps: 12, repeat: 0 },
    },
    scale: 0.30,
    facing: "right",
    placeholder: { w: 34, h: 70, color: 0x7a5c3a, label: "Geralt" },
    sheets: [
      { file: "assets/sprites/geralt_combat.png", rows: [0, 1, 2] },
      { file: "assets/sprites/geralt_combat_p2.png", rows: [3, 4, 5] },
      { file: "assets/sprites/geralt_combat_p3.png", rows: [6, 7] },
    ],
    cut: "blob", align: "bottom",
  },
```

## Branchement (déjà fait dans `src/entities/GeraltDuel.js`, `GERALT_POSES`)

| Pose du duel | Avec `geralt_combat` | Repli actuel |
|---|---|---|
| visée tir droit / tir | `shoot` 1 figée / 2→4 | `attack_miss` 1 / 0 |
| visée en cloche / tir | `shoot_up` 1 figée / 2→4 | `attack_miss` 1 / 0, penché en arrière (dessin) |
| accroupi avant le saut | `jump_shoot` 0 figée | `idle` 3 écrasé (dessin) |
| en l'air (saut, roulade) | `jump_shoot` 1 figée | `attack_miss` 1 (saut), `walk` 1 (roulade) |
| tir plongeant | `jump_shoot` 2→3 | `attack_miss` 2→4 (l'arc lui échappe) |
| réception ratée | `crash` 0→2 | `trip_fall` 1→3 |
| à terre (frappable) | `stunned` (boucle) | `trip_fall` 3 figée |
| se relève | `crash` 3 figée | `trip_fall` 4 figée |
| pose un collet | `set_trap` | `idle` 2 écrasé (dessin) + collet lancé |
| pris au collet | `trapped` | `trip_fall` 0→3 (le pied dans la corde) |
| touché | `hurt` | `attack_miss` 3 (bras qui moulinent) |

L'échelle de chaque planche est ramenée à la taille visible de l'idle de Geralt (`manifestSheetScale`, référence `geralt-idle-0`) ; une planche dessinée plus grande ou plus petite ne le fera donc pas changer de taille à l'écran.
