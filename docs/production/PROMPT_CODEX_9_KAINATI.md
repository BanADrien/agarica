# Prompt Codex n°9 — Kainati apaisé et esprit ancestral (2026-10-24)

Refonte du combat de Kainati et de son enchaînement (totem du singe dans les racines → monde spirituel → lianes de la cime → arène). Le combat est complet avec l'art actuel (`kainati`, `kainati_sol`, `kainati_esprit`). Deux feuilles l'améliorent quand elles arrivent : le code les utilise déjà, derrière `hasManifestArt`, avec un repli sur les poses existantes.

- **2 images** ; les 2 entrées du manifeste (`kainati_calme`, `kainati_esprit_extra`) sont déjà ajoutées (2026-10-25).
- Taille : le code recale chaque nouvelle feuille par **surface visible** sur la pose existante équivalente (`kainatiSourceScale` et `KainatiEsprit.bless`, `src/entities/Kainati.js`). Kainati ne change donc pas de taille d'une pose à l'autre, même si la feuille est un peu plus grande ou plus petite. Vise quand même la même échelle.

| # | Image source | Taille | Découpe | Entrée du manifeste | Utilisée pour | Repli actuel |
|---|---|---|---|---|---|---|
| 1 | `assets/sprites/kainati_calme.png` | 1536x1024 | 2 rangées x 4 | `kainati_calme` (`sit_idle`, `sit_talk`) | Kainati épargné, inerte, assis (revisites) ; `sit_talk` pendant « E : parler » | dernière frame de `kainati` `defeated_lucid`, figée |
| 2 | `assets/sprites/kainati_esprit_extra.png` | 1536x1024 | 1 rangée x 4 | `kainati_esprit_extra` (`give`) | l'esprit simien ancestral donne la forme singe (monde spirituel) | `kainati_esprit` `idle` + halo qui enfle |

## Entrées du manifeste (à coller dans `ASSET_MANIFEST`, après `kainati_esprit`)

```js
  // [P2] Kainati épargné (après le combat) : assis, calme, lucide -- revisites
  // de l'arène et « E : parler ». Même échelle que `kainati` (recalé par
  // surface visible sur `defeated_lucid` frame 4 si besoin).
  kainati_calme: {
    dir: "assets/sprites/kainati_calme_frames", prefix: "kainati_calme",
    anims: {
      sit_idle: { row: 0, frames: 4, fps: 5, repeat: -1 },
      sit_talk: { row: 1, frames: 4, fps: 7, repeat: -1 },
    },
    scale: 0.6,
    facing: "right",
    placeholder: { w: 195, h: 210, color: 0xe8e8e8, label: "Kainati" },
    sheets: [
      { file: "assets/sprites/kainati_calme.png", rows: [0, 1] },
    ],
    cut: "blob", align: "bottom",
  },
  // [P2] Esprit simien ancestral : donne la forme singe (monde spirituel).
  kainati_esprit_extra: {
    dir: "assets/sprites/kainati_esprit_extra_frames", prefix: "kainati_esprit_extra",
    anims: {
      give: { row: 0, frames: 4, fps: 6, repeat: 0 },
    },
    scale: 0.6,
    facing: "right",
    placeholder: { w: 195, h: 210, color: 0x9ff0e0, label: "Esprit" },
    sheets: [
      { file: "assets/sprites/kainati_esprit_extra.png", rows: [0] },
    ],
    cut: "blob", align: "bottom",
  },
```

Puis `python tools/import_codex_assets.py` : il régénère `src/data/asset_present.js`, sinon l'art n'est pas chargé.

## Prompt à coller dans Codex

```
Nouvelles images pour « Legend of Agarica » (lot n°9, Kainati). 2 feuilles animées.

RÈGLES
- Ne modifie ni `src/` ni le manifeste `src/data/asset_manifest.js` (les entrées y sont déjà).
- Fond transparent.
- Une rangée = une animation, nombre de frames exact. Frames séparées d'au moins 40 px, rangées d'au moins 60 px.
- Une silhouette connexe par frame : un objet tenu ou une lumière tenue touche la main ; aucune particule détachée.
- Tourné vers la DROITE.
- Aucun texte.
- MÊME personnage et MÊME ÉCHELLE que les références : la taille en jeu en dépend.

BLOCS COMMUNS (remplace [STYLE] et [PERSO] par le bloc complet, valeurs entre accolades remplies)

[STYLE] =
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. World palette: night forest in deep violet, indigo and teal, magical accents in luminous moonlit green (#8fe3b8) and touches of rose pink (#ff9fc9). Strict side view (profile).

[PERSO] =
SPRITE SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background. Exactly {R} horizontal row(s); each row is ONE animation, read left to right. Each row is a band about {H} px tall; frame cells are 384 px wide (4 frames per row); each pose is centered in its cell with the feet (or lowest point) on the same baseline within a row. Leave at least 40 px of empty space between neighboring frames and at least 60 px between rows. Every frame is ONE single connected silhouette: held objects and held light touch the hand; NO detached particles, sparkles, dust, motion lines, NO cast shadow, NO ground line. Same character, same scale, same colors in every frame. The character faces RIGHT. No text, no grid lines, no borders.

1) assets/sprites/kainati_calme.png (1536 x 1024, 2 rangées de 4 frames, cellules 384 x 512)
Joins comme références :
- assets/sprites/kainati_frames/kainati_row6_3.png (pose de référence EXACTE : Kainati assis, apaisé, main levée) ;
- assets/sprites/kainati_frames/kainati_row6_0.png ;
- assets/sprites/kainati.png.
MÊME ÉCHELLE : assis, environ 330 px de haut du bas des pieds au sommet de la couronne (comme kainati_row6_3.png), environ 340 px de large.
Prompt :
[STYLE]
CHARACTER: KAINATI, KING OF THE SIMIANS, FREED FROM THE MOSS (match the reference frame kainati_row6_3.png exactly): a huge gorilla-like ape king, thick shaggy pure-white fur with black outlines, dark grey skin on face, chest, hands and feet, calm warm amber-gold eyes (NOT glowing green), a gentle tired expression, red tribal paint stripes on his cheek, a tall carved Maya-like stone crown/headdress made of grey-beige stone blocks with spiral glyphs, thick brown vine bracelets wrapped around wrists and ankles. Only two or three tiny dull green moss crumbs left on the crown, no glowing moss, no slime. Sitting heavily on the ground, legs crossed in front of him, exactly like the reference.
[PERSO] avec R = 2, H = 512.
Row 1 - "sit_idle" (resting, looping), exactly 4 frames, sitting like the reference: both hands resting on his knees. Frame 1: chest relaxed, eyes open. Frame 2: chest raised (slow breath in), shoulders a little higher. Frame 3: like frame 2, eyes closed (slow blink). Frame 4: like frame 1, head tilted very slightly. Tiny differences only: it must loop calmly, no jump between frames.
Row 2 - "sit_talk" (speaking calmly, looping), exactly 4 frames, same sitting pose. Frame 1: right hand raised at shoulder height, palm open (like the reference), mouth closed. Frame 2: same hand slightly forward, mouth open speaking. Frame 3: hand turning palm up, mouth half open, eyebrows raised. Frame 4: hand back at shoulder height, mouth closed. The body, legs and crown do not move between frames.
Output: one PNG, 1536 x 1024 px, transparent background, exactly 2 rows, 4 / 4 frames.
Puis : python tools/import_codex_assets.py --only kainati_calme

2) assets/sprites/kainati_esprit_extra.png (1536 x 1024, 1 rangée de 4 frames, cellules 384 x 1024, posées en bas)
Joins comme références :
- assets/sprites/kainati_esprit.png ;
- assets/sprites/kainati_esprit_frames/kainati_esprit_row0_0.png (même esprit, même échelle).
MÊME ÉCHELLE : environ 330 px de haut accroupi sur les phalanges, environ 430 px debout bras levés.
Prompt :
[STYLE]
CHARACTER: KAINATI'S ANCESTRAL SPIRIT (the first king of the monkey people), exactly as in kainati_esprit.png: the same giant ape king silhouette and stone crown as Kainati but ethereal and pure: fur made of luminous pale cyan and mint-green light with soft white highlights, darker teal outline (still a solid thick outline), calm glowing white-gold eyes, the stone crown faintly glowing with cyan runes, NO moss, NO corruption, a few leaf shapes drifting INSIDE the silhouette. Body opaque enough to read clearly (not see-through).
[PERSO] avec R = 1, H = 1024 (the single row sits at the BOTTOM of the canvas: feet on a common baseline about 40 px above the bottom edge).
Row 1 - "give" (he grants the monkey form to the heroine standing in front of him, played once), exactly 4 frames. Frame 1: rising from his knuckles onto his legs, both hands cupped together at chest height, a small orb of mint-green light (#8fe3b8) held between the palms (touching both hands). Frame 2: standing tall, both arms raised above his head, the orb now larger (about 90 px) and bright, still held between the palms. Frame 3: leaning forward, both arms stretched toward the RIGHT at shoulder height, palms open and turned forward, the orb on his fingertips (touching them), as if offering it. Frame 4: back on his knuckles, calm, head slightly bowed, hands empty.
Output: one PNG, 1536 x 1024 px, transparent background, 1 row of 4 frames.
Puis : python tools/import_codex_assets.py --only kainati_esprit_extra

À LA FIN
- Mets à jour `docs/production/RAPPORT_CODEX.md` avec une section « Lot n°9 » : une ligne par image (statut, nombre de frames découpées, hauteur visible mesurée de chaque frame en px source).
- Lance un `python tools/import_codex_assets.py` final et joins son rapport.
```

## Côté code (déjà branché, rien à faire à l'arrivée de l'art)

- `src/entities/Kainati.js`, `KAINATI_POSES.calm` / `talk` : sources `['kainati_calme', 'sit_idle' | 'sit_talk']`, puis `['kainati', 'defeated_lucid', [3]]`. Échelle : `kainatiSourceScale`, surface visible alignée sur `kainati-defeated_lucid-3` affichée à 0,6.
- `KainatiEsprit.bless()` : joue `kainati_esprit_extra-give` si l'art existe. Échelle : surface visible alignée sur `kainati_esprit-idle-0`. Sinon, halo et lueurs. Appelé par la cinématique `esprit_arrivee` (`src/story/acte1_arbre.js`).
- Contrôle après import : `python tools/playtest.py --port 8966 --scene GrandArbreAreneScene --flags kainatiDefeated=true --wait 3 --js "(() => { const k = window.__game.scene.getScene('GrandArbreAreneScene').kainati; const b = objectVisibleBox(k.sprite); return { pose: k.pose, h: b.bottom - b.top, w: b.right - b.left }; })()"`. La hauteur visible doit rester proche de 200 px (la pose assise actuelle mesure 200-206 px).
