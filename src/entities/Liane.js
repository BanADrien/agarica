// Lianes accrochables (forme singe) — agent Formes.
// Donnée de zone : `vines: [{x, y, length}]` — (x, y) = point d'attache EN
// HAUT, `length` en px. Sans la forme singe active, simple décor qui oscille.
// Avec : Player.update() appelle findGrabbableVine() en l'air, puis
// stepSwing() chaque frame (pendule : gravité + pompe gauche/droite).
// Visuel : item `liane` du manifest étiré (si l'art existe), sinon tracé
// procédural vert (Graphics). Événements scène : 'vine-grab' / 'vine-release'.

// Distance pieds -> mains d'Agarica suspendue (le point qui suit la liane).
const VINE_HANG_OFFSET = 58;
const VINE_GRAB_RADIUS = 30;
const VINE_MIN_GRAB_R = 24;
// Pompe : accélération tangentielle (px/s²) quand la direction tenue va dans
// le sens du mouvement — c'est ce qui « relance » le balancier.
const VINE_PUMP_ACCEL = 700;
const VINE_DAMPING = 0.18; // par seconde, pendant le balancement
const VINE_FREE_DAMPING = 1.4; // liane lâchée : revient vite au repos
const VINE_MAX_ANGLE = 1.35; // ~77°
const VINE_MAX_OMEGA = 4.2;
const VINE_REGRAB_COOLDOWN_MS = 350; // même liane, juste après l'avoir lâchée
const VINE_RELEASE_SPEED_MULT = 1.1;
const VINE_RELEASE_BOOST_Y = -260;
const VINE_MAX_CARRY_SPEED = 560;
// Prise en pleine montée : l'élan vertical restant fait « grimper » les mains
// le long de la liane (fraction de la hauteur balistique restante).
const VINE_CLIMB_FRACTION = 0.6;
const VINE_CLIMB_SPEED = 380; // px/s
const VINE_COLOR = 0x3f7a3a;
const VINE_LEAF_COLOR = 0x6fbf5a;

class Liane {
  constructor(scene, cfg) {
    this.scene = scene;
    this.x = cfg.x;
    this.y = cfg.y;
    this.length = Math.max(40, cfg.length || 160);
    this.theta = 0; // angle physique (0 = verticale, + = vers la droite)
    this.omega = 0;
    this.phase = Math.random() * Math.PI * 2;
    this.grabbedBy = null;
    this.swingR = this.length;
    this.alive = true;

    if (scene.textures.exists('item-liane')) {
      this.image = scene.add.image(this.x, this.y, 'item-liane').setOrigin(0.5, 0);
      const def = getItemManifest().liane || {};
      const sx = def.scale || 1;
      this.image.setScale(sx, this.length / this.image.height);
    } else {
      this.gfx = scene.add.graphics();
    }
    // Derrière le joueur (créé avant les handlers de données de zone).
    const obj = this.image || this.gfx;
    if (scene.player && scene.children.moveBelow) scene.children.moveBelow(obj, scene.player);
    this.draw(0);
  }

  get displayAngle() {
    if (this.grabbedBy) return this.theta;
    return this.theta + Math.sin(this.scene.time.now / 900 + this.phase) * 0.05;
  }

  // Liane libre : pendule amorti vers le repos (+ légère oscillation idle).
  update(time, delta) {
    if (!this.alive) return;
    if (!this.grabbedBy) {
      const dt = Math.min(delta, 50) / 1000;
      const g = this.scene.physics.world.gravity.y;
      this.omega += (-(g / this.length) * Math.sin(this.theta)) * dt;
      this.omega *= Math.max(0, 1 - VINE_FREE_DAMPING * dt);
      this.theta += this.omega * dt;
    }
    this.draw(time);
  }

  // Point de la liane à la distance r de l'attache, pour l'angle donné.
  pointAt(r, angle = this.displayAngle) {
    return { x: this.x + Math.sin(angle) * r, y: this.y + Math.cos(angle) * r };
  }

  draw(time) {
    const a = this.displayAngle;
    if (this.image) {
      this.image.setRotation(-a);
      return;
    }
    const g = this.gfx;
    g.clear();
    const steps = Math.max(4, Math.round(this.length / 16));
    const nx = Math.cos(a);
    const ny = -Math.sin(a);
    const t = (time || 0) / 1000;
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const r = (this.length * i) / steps;
      const p = this.pointAt(r, a);
      // Petite ondulation organique perpendiculaire, nulle à l'attache.
      const w = Math.sin(i * 1.3 + t * 2 + this.phase) * 2.5 * (i / steps);
      pts.push({ x: p.x + nx * w, y: p.y + ny * w });
    }
    g.lineStyle(6, 0x1d3a1f, 1);
    g.strokePoints(pts, false);
    g.lineStyle(3.5, VINE_COLOR, 1);
    g.strokePoints(pts, false);
    g.fillStyle(VINE_LEAF_COLOR, 1);
    for (let i = 2; i < pts.length; i += 2) {
      const side = i % 4 === 0 ? 1 : -1;
      g.fillEllipse(pts[i].x + nx * 5 * side, pts[i].y + ny * 5 * side, 9, 5);
    }
    g.fillStyle(0x2a1d14, 1);
    g.fillCircle(this.x, this.y, 5);
  }

  // Distance du point des mains à la liane : { r, dist } (r le long de la liane).
  measure(hx, hy) {
    const a = this.displayAngle;
    const ux = Math.sin(a);
    const uy = Math.cos(a);
    const dx = hx - this.x;
    const dy = hy - this.y;
    const r = dx * ux + dy * uy;
    const dist = Math.abs(dx * uy - dy * ux);
    return { r, dist };
  }

  attach(player) {
    const { r } = this.measure(player.x, player.y - VINE_HANG_OFFSET);
    this.theta = this.displayAngle;
    this.swingR = Phaser.Math.Clamp(r, VINE_MIN_GRAB_R, this.length);
    // Vitesse angulaire déduite de la vitesse du joueur (composante
    // tangentielle), un peu amortie pour une prise franche.
    const vx = player.body.velocity.x;
    const vy = player.body.velocity.y;
    const tangential = vx * Math.cos(this.theta) - vy * Math.sin(this.theta);
    this.omega = Phaser.Math.Clamp((tangential / this.swingR) * 0.85, -VINE_MAX_OMEGA, VINE_MAX_OMEGA);
    const g = this.scene.physics.world.gravity.y;
    const climb = vy < 0 ? (vy * vy) / (2 * g) * VINE_CLIMB_FRACTION : 0;
    this.climbTargetR = Phaser.Math.Clamp(this.swingR - climb, VINE_MIN_GRAB_R, this.length);
    this.grabbedBy = player;
  }

  // Avance le pendule d'un pas et renvoie la position cible des PIEDS.
  stepSwing(player, dir, dt) {
    const g = this.scene.physics.world.gravity.y;
    if (this.climbTargetR < this.swingR) {
      this.swingR = Math.max(this.climbTargetR, this.swingR - VINE_CLIMB_SPEED * dt);
    }
    const r = this.swingR;
    let alpha = -(g / r) * Math.sin(this.theta);
    if (dir !== 0 && (dir * this.omega >= -0.25)) alpha += (dir * VINE_PUMP_ACCEL) / r;
    this.omega += alpha * dt;
    this.omega *= Math.max(0, 1 - VINE_DAMPING * dt);
    this.omega = Phaser.Math.Clamp(this.omega, -VINE_MAX_OMEGA, VINE_MAX_OMEGA);
    this.theta += this.omega * dt;
    if (Math.abs(this.theta) > VINE_MAX_ANGLE) {
      this.theta = Math.sign(this.theta) * VINE_MAX_ANGLE;
      this.omega = 0;
    }
    this.draw(this.scene.time.now);
    const hand = this.pointAt(r, this.theta);
    return { x: hand.x, y: hand.y + VINE_HANG_OFFSET };
  }

  bounceOffWall() {
    this.omega *= -0.3;
  }

  // Lâcher : renvoie la vitesse tangentielle (élan conservé). La liane
  // continue de se balancer seule puis s'amortit.
  detach(player) {
    const r = this.swingR;
    const vx = r * this.omega * Math.cos(this.theta);
    const vy = -r * this.omega * Math.sin(this.theta);
    this.grabbedBy = null;
    // L'oscillation libre est calculée sur toute la longueur.
    this.omega *= r / this.length;
    return { vx, vy };
  }

  destroy() {
    this.alive = false;
    if (this.image) this.image.destroy();
    if (this.gfx) this.gfx.destroy();
  }
}

// Liane la plus proche des mains du joueur, dans le rayon d'accroche.
function findGrabbableVine(scene, player, now) {
  const vines = scene.vines;
  if (!vines || !vines.length) return null;
  const hx = player.x;
  const hy = player.y - VINE_HANG_OFFSET;
  let best = null;
  let bestDist = VINE_GRAB_RADIUS;
  for (const v of vines) {
    if (!v.alive || v.grabbedBy) continue;
    if (v === player.lastVine && now - player.vineReleasedAt < VINE_REGRAB_COOLDOWN_MS) continue;
    const { r, dist } = v.measure(hx, hy);
    if (r < VINE_MIN_GRAB_R - 6 || r > v.length + 8) continue;
    if (dist <= bestDist) {
      best = v;
      bestDist = dist;
    }
  }
  return best;
}

LEVEL_DATA_HANDLERS.vines = (scene, list) => {
  for (const v of scene.vines || []) v.destroy();
  scene.vines = (list || []).map((cfg) => new Liane(scene, cfg));
  scene.events.once('shutdown', () => { scene.vines = []; });
};

LEVEL_UPDATE_HOOKS.push((scene, time, delta) => {
  if (!scene.vines) return;
  for (const v of scene.vines) v.update(time, delta);
});
