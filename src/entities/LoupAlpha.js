// Boss "Loup Alpha" : même machine patrouille/charge que LoupSanguinaire.js,
// mais réutilise les vrais sprites/animations Loup du joueur (Player.js) à
// plus grande échelle + teinte sombre, et encaisse 3 coups au lieu d'1 seul
// (takeHit() plutôt que defeat() direct) — seule vraie dérogation à la
// règle "1 PV" du GDD, pour un vrai climax de boss (section 11 : "mini boss
// combinant Loup + Araignée" — le volet Araignée vient de l'arène elle-même,
// cf. Zone5Scene, pas d'une entité fusionnée).
const LOUP_ALPHA_SCALE = 0.6;
const LOUP_ALPHA_TINT = 0x8b1a2b;

class LoupAlpha extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, patrolMinX, patrolMaxX) {
    super(scene, x, y, 'loup-run-0');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Origine ancrée aux pieds, comme Player.js pour ce même canvas Loup
    // partagé (WOLF_FRAME_WIDTH/HEIGHT) — sans ça, l'ancrage centré par
    // défaut désaligne trop le corps physique du sprite visible.
    this.setOrigin(0.5, 1);
    this.setScale(LOUP_ALPHA_SCALE);
    this.body.updateBounds();
    this.setTint(LOUP_ALPHA_TINT);
    this.setCollideWorldBounds(false);
    // Hitbox généreuse mais raisonnable — même logique que FORMS.wolf dans
    // Player.js (canvas source bien plus grand que le personnage réel).
    const bodyWidth = 80;
    const bodyHeight = 150;
    this.body.setSize(bodyWidth, bodyHeight);
    this.body.setOffset((WOLF_FRAME_WIDTH - bodyWidth) / 2, WOLF_FRAME_HEIGHT - bodyHeight);

    this.patrolMinX = patrolMinX;
    this.patrolMaxX = patrolMaxX;
    this.patrolSpeed = 80;
    this.chargeSpeed = 340;
    this.detectionRangeX = 320;
    this.detectionRangeY = 60;
    this.direction = 1;
    this.isCharging = false;
    this.hp = 3;
    this.defeated = false;
  }

  update(player) {
    if (this.defeated) return;

    const dx = player.x - this.x;
    const dy = Math.abs(player.y - this.y);

    if (!this.isCharging && Math.abs(dx) < this.detectionRangeX && dy < this.detectionRangeY) {
      this.isCharging = true;
      this.direction = dx > 0 ? 1 : -1;
    }

    if (this.x <= this.patrolMinX) {
      this.direction = 1;
      this.isCharging = false;
    } else if (this.x >= this.patrolMaxX) {
      this.direction = -1;
      this.isCharging = false;
    }

    const speed = this.isCharging ? this.chargeSpeed : this.patrolSpeed;
    this.setVelocityX(this.direction * speed);
    // Art loup : face à droite par défaut (même convention que la forme
    // Loup du joueur, cf. Player.js).
    this.setFlipX(this.direction < 0);
    this.anims.play(ANIM_WOLF_RUN_KEY, true);
  }

  // 3 PV (dérogation assumée à la règle "1 PV" du GDD, cf. section 11).
  takeHit() {
    if (this.defeated) return;
    this.hp -= 1;
    if (this.hp <= 0) {
      this.defeat();
      return;
    }
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(120, () => {
      if (!this.defeated) this.setTint(LOUP_ALPHA_TINT);
    });
  }

  defeat() {
    if (this.defeated) return;
    this.defeated = true;
    this.setVelocity(0, 0);
    this.body.enable = false;
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: LOUP_ALPHA_SCALE * 0.6,
      duration: 300,
      onComplete: () => this.destroy(),
    });
  }
}
