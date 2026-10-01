// Courants d'air ascendants (aigle) — agent Formes.
// Donnée de zone : `windCurrents: [{x, y, w, h, force}]` — rectangle (x, y =
// coin HAUT-GAUCHE), `force` = vitesse verticale visée en px/s (défaut 320).
// En forme aigle qui plane (pas en piqué), la vitesse verticale est tirée
// vers -force : on remonte. Visuel : traits/particules qui montent en boucle.
const WIND_DEFAULT_FORCE = 320;
const WIND_PULL_RATE = 6; // vitesse de convergence vers -force (1/s)
const WIND_STREAK_DENSITY = 1 / 1400; // traits par px²
const WIND_COLOR = 0xcff6ff;

class CourantAir {
  constructor(scene, cfg) {
    this.scene = scene;
    this.rect = new Phaser.Geom.Rectangle(cfg.x, cfg.y, cfg.w || 120, cfg.h || 300);
    this.force = cfg.force || WIND_DEFAULT_FORCE;
    // Art ITEM_MANIFEST `courant_air` étiré sur le rectangle s'il existe ;
    // les traits procéduraux restent par-dessus (mouvement).
    if (scene.textures.exists('item-courant_air')) {
      this.image = scene.add.image(this.rect.centerX, this.rect.centerY, 'item-courant_air')
        .setDisplaySize(this.rect.width, this.rect.height).setAlpha(0.55)
        .setBlendMode(Phaser.BlendModes.ADD);
    }
    this.gfx = scene.add.graphics();
    this.gfx.setBlendMode(Phaser.BlendModes.ADD);
    const n = Phaser.Math.Clamp(Math.round(this.rect.width * this.rect.height * WIND_STREAK_DENSITY), 8, 60);
    this.streaks = Array.from({ length: n }, () => ({
      x: Math.random(), y: Math.random(),
      speed: 0.25 + Math.random() * 0.35, // fraction de hauteur par seconde
      len: 14 + Math.random() * 26,
      wobble: Math.random() * Math.PI * 2,
    }));
    this.draw(0);
  }

  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    for (const s of this.streaks) {
      s.y -= s.speed * dt;
      if (s.y < 0) { s.y += 1; s.x = Math.random(); }
    }
    this.draw(time);
    this.pushPlayer(dt);
  }

  draw(time) {
    const g = this.gfx;
    const r = this.rect;
    g.clear();
    g.fillStyle(WIND_COLOR, 0.05);
    g.fillRect(r.x, r.y, r.width, r.height);
    for (const s of this.streaks) {
      const x = r.x + s.x * r.width + Math.sin(time / 300 + s.wobble) * 4;
      const y = r.y + s.y * r.height;
      // Plus transparent aux extrémités haut/bas du courant.
      const edge = Math.min(s.y, 1 - s.y) * 4;
      g.lineStyle(2, WIND_COLOR, 0.45 * Math.min(1, edge));
      g.lineBetween(x, y, x, Math.min(r.bottom, y + s.len));
    }
  }

  pushPlayer(dt) {
    const p = this.scene.player;
    if (!p || !p.body || p.form !== 'eagle' || p.eagleDiving) return;
    if (!Phaser.Geom.Rectangle.Contains(this.rect, p.x, p.y - 20)) return;
    // Compense d'abord la gravité du pas (sinon l'équilibre reste ~200 px/s
    // sous -force), puis converge vers -force.
    const vy = p.body.velocity.y - this.scene.physics.world.gravity.y * dt;
    p.setVelocityY(vy + (-this.force - vy) * Math.min(1, WIND_PULL_RATE * dt));
    p.inWindCurrent = this;
  }
}

LEVEL_DATA_HANDLERS.windCurrents = (scene, list) => {
  scene.windCurrents = (list || []).map((cfg) => new CourantAir(scene, cfg));
  scene.events.once('shutdown', () => { scene.windCurrents = []; });
};

LEVEL_UPDATE_HOOKS.push((scene, time, delta) => {
  if (!scene.windCurrents || !scene.windCurrents.length) return;
  if (scene.player) scene.player.inWindCurrent = null;
  for (const w of scene.windCurrents) w.update(time, delta);
});
