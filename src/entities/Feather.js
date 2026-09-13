// Plume tirée par Agarica en forme Aigle (touche d'attaque) : file en ligne
// droite en diagonale vers le bas dans le sens actuel, puis disparaît après
// FEATHER_LIFESPAN_MS (pas de collision avec le décor, pour rester simple —
// cf. CLAUDE.md, pas de vraie physique de projectile). Asset dédié animé
// (assets/sprites/piaf_frames/plume_animation.png, 4 frames, léger
// scintillement en vol — découpé via tools/split_spritesheet.py), chargé
// dans BootScene.js.
const FEATHER_FRAME_COUNT = 4;
const FEATHER_ANIM_PREFIX = 'feather-anim-';
const ANIM_FEATHER_FLUTTER_KEY = 'feather-flutter';
// Taille source (281x520) bien plus petite que l'ancien plume.png
// (~1246x1263) : échelle recalibrée pour un rendu en jeu de taille comparable.
// Réduite (retour utilisateur : "un peu trop grosse") depuis 0.13.
const FEATHER_SCALE = 0.1;
// La plume est dessinée penchée (pointe en haut à droite, tige en bas à
// gauche) plutôt que bien horizontale — décalage mesuré sur le fichier
// source (bord à bord tige/pointe) pour que setRotation ci-dessous parte
// d'un "0 = tige vers la droite" cohérent, comme la silhouette Graphics
// d'origine, avant d'ajouter l'angle de tir réel par-dessus.
const FEATHER_ART_ANGLE_OFFSET = Phaser.Math.DegToRad(70);
// Accélérées (retour utilisateur : "un peu trop lente") depuis 360/460.
const FEATHER_SPEED_X = 460;
const FEATHER_SPEED_Y = 580;
const FEATHER_LIFESPAN_MS = 1100;

function ensureFeatherAnimation(scene) {
  if (scene.anims.exists(ANIM_FEATHER_FLUTTER_KEY)) return;

  scene.anims.create({
    key: ANIM_FEATHER_FLUTTER_KEY,
    frames: Array.from({ length: FEATHER_FRAME_COUNT }, (_, i) => ({ key: `${FEATHER_ANIM_PREFIX}${i}` })),
    frameRate: 12,
    repeat: -1,
  });
}

class Feather extends Phaser.Physics.Arcade.Sprite {
  // `dir` : sens horizontal actuel d'Agarica (facingDir, -1 ou 1).
  constructor(scene, x, y, dir) {
    super(scene, x, y, `${FEATHER_ANIM_PREFIX}0`);
    ensureFeatherAnimation(scene);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(FEATHER_SCALE);
    this.body.setAllowGravity(false);
    this.play(ANIM_FEATHER_FLUTTER_KEY);
    const vx = dir * FEATHER_SPEED_X;
    this.setVelocity(vx, FEATHER_SPEED_Y);
    // Tige (bout non-pointu) en avant, comme un vrai projectile lancé —
    // pas la pointe, cf. FEATHER_ART_ANGLE_OFFSET plus haut.
    this.setRotation(Math.atan2(FEATHER_SPEED_Y, vx) + FEATHER_ART_ANGLE_OFFSET);

    // Auto-destruction par timer plutôt qu'un update() : rien dans les
    // Zone*Scene n'itère sur les projectiles, un delayedCall évite d'avoir à
    // câbler ça pour chaque scène.
    scene.time.delayedCall(FEATHER_LIFESPAN_MS, () => {
      if (this.active) this.destroy();
    });

    // Défait un ennemi au contact, comme n'importe quelle attaque (cf. les
    // overlaps joueur/ennemis dans chaque Zone*Scene) — auto-suffisant ici
    // plutôt que de faire câbler cet overlap par chaque scène. `takeHit()`
    // en priorité : le Loup Alpha (boss, 3 PV) s'en sert au lieu de
    // `defeat()` direct pour ne pas mourir en un seul coup (cf. LoupAlpha.js).
    if (scene.enemies) {
      scene.physics.add.overlap(this, scene.enemies, (feather, enemy) => {
        if (enemy.defeated) return;
        if (typeof enemy.takeHit === 'function') enemy.takeHit();
        else enemy.defeat();
        // Même petite portion d'énergie que l'attaque au sol (cf.
        // ENERGY_PER_HIT dans Player.js) — un tir de plume compte comme un
        // coup porté au même titre qu'un coup de dague.
        if (scene.player) scene.player.gainEnergy(ENERGY_PER_HIT);
        feather.destroy();
      });
    }
  }
}
