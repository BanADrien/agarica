// Sprites Corbeau : voir PIAF_ANIM_ROWS / ensurePiafAnimations dans
// Player.js — partagés avec la forme Aigle du joueur, générés depuis
// assets/sprites/piaf.png (la ligne de piqué avait des traînées de vitesse
// détachées du corps par endroits, filtrées via un script ponctuel qui ne
// garde que les 5 plus gros blobs par bande, cf. tools/split_spritesheet.py).
const CORBEAU_SCALE = 0.15;

// Vole en boucle à altitude fixe entre patrolMinX/patrolMaxX (équivalent
// aérien de la patrouille au sol du Loup sanguinaire) et plonge quand
// Agarica passe dessous, avant de remonter reprendre sa patrouille — mêmes
// booléens d'état que isCharging chez le Loup, pas de vraie IA (GDD
// section 6). 1 PV, meurt en un coup de dague.
class Corbeau extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, patrolMinX, patrolMaxX, diveDepth = 220) {
    ensurePiafAnimations(scene);
    super(scene, x, y, 'piaf-fly-0');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(CORBEAU_SCALE);
    this.body.setAllowGravity(false);
    // Hitbox plus petite que le sprite affiché (les plumes déployées
    // dépassent largement du corps réel), centrée dans le canvas de frame.
    const bodyWidth = 220;
    const bodyHeight = 160;
    this.setSize(bodyWidth, bodyHeight);
    this.setOffset((PIAF_FRAME_WIDTH - bodyWidth) / 2, PIAF_FRAME_HEIGHT - bodyHeight);

    this.patrolMinX = patrolMinX;
    this.patrolMaxX = patrolMaxX;
    this.patrolY = y;
    this.patrolSpeed = 80;
    this.diveSpeed = 320;
    this.returnSpeed = 160;
    // "Passe dessous" : simple proximité horizontale, pas de vraie ligne de vue.
    this.diveTriggerRangeX = 50;
    // Distance de plongeon depuis l'altitude de patrouille : passée par la
    // scène (dépend du sol local) pour que le piqué s'arrête juste au-dessus
    // du sol au lieu de s'enfoncer dedans.
    this.diveDepth = diveDepth;
    this.diveCooldown = 1500;
    this.lastDiveEndTime = -Infinity;
    // L'art fait face à droite par défaut (comme le Loup) : flip quand on
    // va vers la gauche.
    this.direction = 1;
    this.isDiving = false;
    this.isReturning = false;
    this.defeated = false;
  }

  update(player) {
    if (this.defeated) return;

    const now = this.scene.time.now;

    if (this.isDiving) {
      this.anims.play(ANIM_PIAF_DIVE_KEY, true);
      this.setVelocityY(this.diveSpeed);
      if (this.y >= this.patrolY + this.diveDepth) {
        this.isDiving = false;
        this.isReturning = true;
        this.lastDiveEndTime = now;
      }
    } else if (this.isReturning) {
      this.anims.play(ANIM_PIAF_GLIDE_KEY, true);
      this.setVelocityY(-this.returnSpeed);
      if (this.y <= this.patrolY) {
        this.y = this.patrolY;
        this.setVelocityY(0);
        this.isReturning = false;
      }
    } else {
      this.anims.play(ANIM_PIAF_FLY_KEY, true);
      if (this.x <= this.patrolMinX) this.direction = 1;
      else if (this.x >= this.patrolMaxX) this.direction = -1;
      this.setVelocityX(this.direction * this.patrolSpeed);
      this.setFlipX(this.direction < 0);

      const underPlayer = Math.abs(player.x - this.x) < this.diveTriggerRangeX;
      if (underPlayer && now - this.lastDiveEndTime > this.diveCooldown) {
        this.isDiving = true;
        this.setVelocityX(0);
      }
    }
  }

  // 1 PV : meurt en un coup de dague (cf. GDD section 6).
  defeat() {
    if (this.defeated) return;
    this.defeated = true;
    this.setVelocity(0, 0);
    this.body.enable = false;
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: CORBEAU_SCALE * 0.6,
      duration: 200,
      onComplete: () => this.destroy(),
    });
  }
}
