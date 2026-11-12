// Courants d'air ascendants (aigle) — agent Formes.
// Donnée de zone : `windCurrents: [{x, y, w, h, force}]` — rectangle (x, y =
// coin HAUT-GAUCHE), `force` = vitesse verticale visée en px/s (défaut 320).
// En forme aigle qui plane (pas en piqué), la vitesse verticale est tirée
// vers -force : on remonte. Visuel : traits/particules qui montent en boucle.
const WIND_DEFAULT_FORCE = 320;
const WIND_PULL_RATE = 6; // vitesse de convergence vers -force (1/s)
const WIND_STREAK_DENSITY = 1 / 1400; // traits par px²
const WIND_COLOR = 0xcff6ff;

// Art en pixel art fait avec pixelfx (2026-11-12, demande de l'utilisateur :
// « refais les fx des courants ascendants avec pixelfx ») : deux plans de
// filets de vent, chacun une boucle de COURANT_FRAMES cases de 256 px qui se
// répètent sans raccord dans les deux sens (tools/pixelfx/updraft.js, rendu par
// `node tools/pixelfx/export_courant.mjs assets/vfx/courant_frames`). La case
// ne contient que la vie des filets (ils se tracent, ondulent, s'effacent) ;
// la montée, c'est le défilement fait ici, plus rapide au plan avant.
// Sans ces images : l'ancien rendu (image étirée + traits), plus bas.
const COURANT_PLANS = ['fond', 'avant'];
const COURANT_FRAMES = 24;
const COURANT_FPS = 10;
const COURANT_TILE = 256;
// Grain des images (1 pixel dessiné = 2 px d'écran, comme les décors) : le
// défilement avance par pas de ce grain, jamais d'un demi-pixel dessiné.
const COURANT_GRAIN = 2;
const COURANT_LAYERS = {
  // Vitesses de montée à l'écran (px/s). 150 et 270 au départ : « le vent monte
  // trop vite » (utilisateur, 2026-11-12), ramenées à moins de la moitié.
  fond: { speed: 60, alpha: 0.6, shiftX: 96 },
  avant: { speed: 110, alpha: 0.95, shiftX: 0 },
};
// Haut et bas de la colonne fondus sur cette hauteur (au plus un tiers).
const COURANT_FADE = 110;
// Voile de lumière sous les filets (additif).
const COURANT_VEIL_ALPHA = 0.16;

class CourantAir {
  constructor(scene, cfg) {
    this.scene = scene;
    this.rect = new Phaser.Geom.Rectangle(cfg.x, cfg.y, cfg.w || 120, cfg.h || 300);
    this.force = cfg.force || WIND_DEFAULT_FORCE;
    this.layers = COURANT_PLANS.every((plan) => scene.textures.exists(`courant-${plan}-0`))
      ? COURANT_PLANS.map((plan) => this.buildLayer(plan)) : null;
    if (this.layers) {
      this.veil = this.buildVeil();
      for (const L of this.layers) for (const t of L.parts) scene.children.moveAbove(t, this.veil);
      return;
    }
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
    // Traits peints `fx_trait_vent` (lot n°8, blancs donc teintables, tête à
    // droite) : une image par trait, tournée tête en HAUT (le courant monte) ;
    // repli : les traits dessinés de draw().
    this.streakImgs = scene.textures.exists('item-fx_trait_vent')
      ? this.streaks.map(() => scene.add.image(0, 0, 'item-fx_trait_vent')
        .setBlendMode(Phaser.BlendModes.ADD).setTint(WIND_COLOR).setAngle(-90))
      : null;
    this.draw(0);
  }

  // Un plan = trois mosaïques empilées sur le rectangle : haut (fondu vers le
  // haut), milieu, bas (fondu vers le bas). Même motif, calé sur le haut du
  // rectangle (`offY`), pour qu'aucun raccord ne se voie entre les trois.
  buildLayer(plan) {
    const r = this.rect;
    const cfg = COURANT_LAYERS[plan];
    const fade = Math.min(COURANT_FADE, Math.floor(r.height / 3));
    const key = `courant-${plan}-0`;
    const part = (y, h, alphas) => {
      const t = this.scene.add.tileSprite(r.x, y, r.width, h, key).setOrigin(0, 0);
      t.setAlpha(...alphas);
      t.tilePositionX = cfg.shiftX;
      t.offY = y - r.y;
      return t;
    };
    const a = cfg.alpha;
    return {
      plan, cfg, scroll: 0, frame: 0,
      parts: [
        part(r.y, fade, [0, 0, a, a]),
        part(r.y + fade, r.height - fade * 2, [a]),
        part(r.bottom - fade, fade, [a, a, 0, 0]),
      ],
    };
  }

  // Voile de lumière de la colonne, sous les filets : on voit de loin où le
  // vent monte, même devant un nuage. Lueur lisse exprès (comme les halos du
  // jeu) : pleine au centre, fondue sur les quatre bords.
  buildVeil() {
    const r = this.rect;
    const g = this.scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    const ex = Math.min(40, r.width / 3);
    const ey = Math.min(COURANT_FADE, Math.floor(r.height / 3));
    const xs = [r.x, r.x + ex, r.right - ex, r.right];
    const ys = [r.y, r.y + ey, r.bottom - ey, r.bottom];
    const A = COURANT_VEIL_ALPHA;
    // alpha aux 16 coins de la grille 3 x 3 : 0 sur le pourtour, A à l'intérieur
    const at = (i, j) => (i === 0 || i === 3 || j === 0 || j === 3 ? 0 : A);
    for (let j = 0; j < 3; j++) {
      for (let i = 0; i < 3; i++) {
        g.fillGradientStyle(WIND_COLOR, WIND_COLOR, WIND_COLOR, WIND_COLOR, at(i, j), at(i + 1, j), at(i, j + 1), at(i + 1, j + 1));
        g.fillRect(xs[i], ys[j], xs[i + 1] - xs[i], ys[j + 1] - ys[j]);
      }
    }
    return g;
  }

  updateLayers(time, dt) {
    const frame = Math.floor((time / 1000) * COURANT_FPS) % COURANT_FRAMES;
    for (const L of this.layers) {
      L.scroll = (L.scroll + L.cfg.speed * dt) % COURANT_TILE;
      const step = Math.round(L.scroll / COURANT_GRAIN) * COURANT_GRAIN;
      for (const t of L.parts) {
        if (L.frame !== frame) t.setTexture(`courant-${L.plan}-${frame}`);
        t.tilePositionY = t.offY + step;
      }
      L.frame = frame;
    }
  }

  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    if (this.layers) {
      this.updateLayers(time, dt);
      this.pushPlayer(dt);
      return;
    }
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
    // Voile de la zone : inutile quand l'art `courant_air` la couvre déjà.
    if (!this.image) {
      g.fillStyle(WIND_COLOR, 0.05);
      g.fillRect(r.x, r.y, r.width, r.height);
    }
    this.streaks.forEach((s, i) => {
      const x = r.x + s.x * r.width + Math.sin(time / 300 + s.wobble) * 4;
      const y = r.y + s.y * r.height;
      // Plus transparent aux extrémités haut/bas du courant.
      const edge = Math.min(s.y, 1 - s.y) * 4;
      const img = this.streakImgs && this.streakImgs[i];
      if (img) {
        // Même segment que le trait dessiné (de y à y + len), 6 px d'épaisseur.
        img.setPosition(x, y + s.len / 2).setDisplaySize(s.len, 6).setAlpha(0.45 * Math.min(1, edge));
      } else {
        g.lineStyle(2, WIND_COLOR, 0.45 * Math.min(1, edge));
        g.lineBetween(x, y, x, Math.min(r.bottom, y + s.len));
      }
    });
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
