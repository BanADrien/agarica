const LOUP_TEXTURE_KEY = 'loup-sanguinaire-placeholder';
const LOUP_WIDTH = 36;
const LOUP_HEIGHT = 22;

// Silhouette basse et sombre, teinte rougeâtre (yeux + contour) pour bien
// se distinguer de la forme Loup d'Agarica (contour vert/rose).
function ensureLoupTexture(scene) {
  if (scene.textures.exists(LOUP_TEXTURE_KEY)) return;

  const g = scene.add.graphics();

  g.fillStyle(0x120a0c, 1);
  g.fillTriangle(2, LOUP_HEIGHT - 4, 10, LOUP_HEIGHT - 18, 10, LOUP_HEIGHT - 4);
  g.fillRoundedRect(4, 2, LOUP_WIDTH - 8, LOUP_HEIGHT - 6, 8);
  g.fillTriangle(LOUP_WIDTH - 16, 4, LOUP_WIDTH - 12, -4, LOUP_WIDTH - 8, 4);
  g.fillTriangle(LOUP_WIDTH - 26, 4, LOUP_WIDTH - 22, -4, LOUP_WIDTH - 18, 4);

  g.lineStyle(1.5, 0x7a2030, 1);
  g.strokeRoundedRect(5, 3, LOUP_WIDTH - 10, LOUP_HEIGHT - 8, 8);

  g.fillStyle(0xff3d4d, 1);
  g.fillCircle(LOUP_WIDTH - 11, LOUP_HEIGHT / 2 - 2, 1.8);

  g.generateTexture(LOUP_TEXTURE_KEY, LOUP_WIDTH, LOUP_HEIGHT);
  g.destroy();
}

class LoupSanguinaire extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, patrolMinX, patrolMaxX) {
    ensureLoupTexture(scene);
    super(scene, x, y, LOUP_TEXTURE_KEY);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setSize(LOUP_WIDTH - 8, LOUP_HEIGHT - 6);
    this.setOffset(4, 3);
    this.setCollideWorldBounds(false);

    this.patrolMinX = patrolMinX;
    this.patrolMaxX = patrolMaxX;
    this.patrolSpeed = 60;
    this.chargeSpeed = 260;
    this.detectionRangeX = 220;
    this.detectionRangeY = 40;
    this.direction = 1;
    this.isCharging = false;
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
    this.setFlipX(this.direction < 0);
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
      scale: 0.6,
      duration: 200,
      onComplete: () => this.destroy(),
    });
  }
}
