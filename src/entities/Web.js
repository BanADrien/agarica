const WEB_TEXTURE_KEY = 'web-placeholder';
const WEB_WIDTH = 70;
const WEB_HEIGHT = 22;

// Toile au sol, dessinée par code (pas d'art prévu) : nappe de soie tendue
// entre deux brins d'herbe — rayons depuis un moyeu + spirale de fils
// affaissés + gouttes de rosée. Semi-transparente : simple zone qui ralentit,
// jamais un obstacle solide.
function ensureWebTexture(scene) {
  if (scene.textures.exists(WEB_TEXTURE_KEY)) return;

  const g = scene.add.graphics();
  const hubX = WEB_WIDTH / 2;
  const hubY = WEB_HEIGHT - 3;

  // Rayons : de l'ancrage au sol vers le haut, en éventail.
  const spokes = [];
  for (let i = 0; i <= 8; i++) {
    const a = Math.PI + (i / 8) * Math.PI;
    spokes.push({ x: hubX + Math.cos(a) * (WEB_WIDTH / 2 - 1), y: hubY + Math.sin(a) * (WEB_HEIGHT - 4) });
  }
  g.lineStyle(1, 0xdff5ea, 0.55);
  for (const p of spokes) {
    g.beginPath();
    g.moveTo(hubX, hubY);
    g.lineTo(p.x, p.y);
    g.strokePath();
  }

  // Fils transversaux : segments entre rayons voisins, légèrement affaissés.
  for (let ring = 1; ring <= 4; ring++) {
    const t = ring / 4.4;
    g.lineStyle(1, 0xcfe8d9, 0.35 + 0.08 * ring);
    for (let i = 0; i < spokes.length - 1; i++) {
      const ax = hubX + (spokes[i].x - hubX) * t;
      const ay = hubY + (spokes[i].y - hubY) * t;
      const bx = hubX + (spokes[i + 1].x - hubX) * t;
      const by = hubY + (spokes[i + 1].y - hubY) * t;
      const sag = 1.2;
      g.beginPath();
      g.moveTo(ax, ay);
      g.lineTo((ax + bx) / 2, (ay + by) / 2 + sag);
      g.lineTo(bx, by);
      g.strokePath();
    }
  }

  // Gouttes de rosée (accents cyan, palette « champignons lumineux »).
  g.fillStyle(0xbffcff, 0.9);
  for (const [px, py] of [[16, 12], [29, 6], [47, 9], [55, 15], [38, 14]]) {
    g.fillCircle(px, py, 1.1);
  }

  g.generateTexture(WEB_TEXTURE_KEY, WEB_WIDTH, WEB_HEIGHT);
  g.destroy();
}

// Zone non solide : seul un `overlap` la détecte (voir LevelKit), elle ne
// bloque jamais le passage, elle ralentit juste Agarica hors forme Loup.
class Web extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    ensureWebTexture(scene);
    super(scene, x, y, WEB_TEXTURE_KEY);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setAllowGravity(false);
    this.setImmovable(true);

    // Léger miroitement de la soie (purement visuel).
    this.setAlpha(0.8);
    scene.tweens.add({
      targets: this,
      alpha: 1,
      duration: 1400 + Math.random() * 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}
