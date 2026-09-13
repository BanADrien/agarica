const WEB_TEXTURE_KEY = 'web-placeholder';
const WEB_WIDTH = 70;
const WEB_HEIGHT = 22;

// Toile au sol : simple motif de fils entrecroisés, semi-transparent, posé
// à même le sol (pas un obstacle solide — juste une zone qui ralentit).
function ensureWebTexture(scene) {
  if (scene.textures.exists(WEB_TEXTURE_KEY)) return;

  const g = scene.add.graphics();
  g.lineStyle(1, 0xcfe8d9, 0.55);

  for (let x = 4; x < WEB_WIDTH; x += 10) {
    g.beginPath();
    g.moveTo(x, WEB_HEIGHT);
    g.lineTo(x - 6, 0);
    g.strokePath();
  }
  for (let y = 5; y < WEB_HEIGHT; y += 7) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(WEB_WIDTH, y - 4);
    g.strokePath();
  }

  g.generateTexture(WEB_TEXTURE_KEY, WEB_WIDTH, WEB_HEIGHT);
  g.destroy();
}

// Zone non solide : seul un `overlap` la détecte (voir Zone3Scene), elle ne
// bloque jamais le passage, elle ralentit juste Agarica hors forme Loup.
class Web extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    ensureWebTexture(scene);
    super(scene, x, y, WEB_TEXTURE_KEY);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setAllowGravity(false);
    this.setImmovable(true);
  }
}
