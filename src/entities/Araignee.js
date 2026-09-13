const ARAIGNEE_TEXTURE_KEY = 'araignee-placeholder';
const ARAIGNEE_WIDTH = 46;
const ARAIGNEE_HEIGHT = 34;

// Silhouette d'araignée fixe, plus imposante que Xara, avec plusieurs
// petits yeux rouges (contraste avec les yeux roses/verts de Xara).
function ensureAraigneeTexture(scene) {
  if (scene.textures.exists(ARAIGNEE_TEXTURE_KEY)) return;

  const g = scene.add.graphics();
  const cx = ARAIGNEE_WIDTH / 2;
  const cy = ARAIGNEE_HEIGHT / 2 + 4;

  g.lineStyle(2, 0x120a1c, 1);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const originY = cy - 6 + i * 4;
      g.beginPath();
      g.moveTo(cx + side * 4, originY);
      g.lineTo(cx + side * (16 + i * 2), originY - 6 + i * 5);
      g.strokePath();
    }
  }

  g.fillStyle(0x120a1c, 1);
  g.fillEllipse(cx, cy, 22, 16);
  g.fillEllipse(cx, cy - 11, 13, 12);
  g.lineStyle(1.5, 0x9fe6a0, 0.6);
  g.strokeEllipse(cx, cy, 22, 16);
  g.strokeEllipse(cx, cy - 11, 13, 12);

  g.fillStyle(0xff3d4d, 1);
  g.fillCircle(cx - 4, cy - 13, 1.6);
  g.fillCircle(cx, cy - 15, 1.6);
  g.fillCircle(cx + 4, cy - 13, 1.6);

  g.generateTexture(ARAIGNEE_TEXTURE_KEY, ARAIGNEE_WIDTH, ARAIGNEE_HEIGHT);
  g.destroy();
}

// Reste fixe (pas de patrouille/charge) et n'inflige aucun dégât au contact
// — seule sa toile (cf. Web.js) est un obstacle. 1 PV, meurt en un coup de
// dague (GDD section 6).
class Araignee extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    ensureAraigneeTexture(scene);
    super(scene, x, y, ARAIGNEE_TEXTURE_KEY);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setAllowGravity(false);
    this.setImmovable(true);
    this.setSize(ARAIGNEE_WIDTH - 10, ARAIGNEE_HEIGHT - 8);
    this.setOffset(5, 6);

    this.defeated = false;
  }

  update() {
    // Fixe : rien à faire tant qu'elle n'est pas vaincue.
  }

  defeat() {
    if (this.defeated) return;
    this.defeated = true;
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
