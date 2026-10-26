// Lianes accrochables (forme singe) — agent Formes.
// Donnée de zone : `vines: [{x, y, length}]` — (x, y) = point d'attache EN
// HAUT, `length` en px. Sans la forme singe active, simple décor qui oscille.
// Avec : Player.update() appelle findGrabbableVine() en l'air, puis
// stepSwing() chaque pas de physique (pendule : gravité + pompe gauche/droite,
// montée/descente le long de la liane avec Z/↑ et S/↓).
// Visuel : item `liane` du manifest étiré (si l'art existe), sinon tracé
// procédural vert (Graphics), qui part de l'intérieur du bloc d'accroche
// (cf. VINE_TOP_TUCK, vineBlockAbove). Événements scène : 'vine-grab' / 'vine-release'.

// Distance pieds -> mains d'Agarica suspendue (le point qui suit la liane).
const VINE_HANG_OFFSET = 58;
const VINE_GRAB_RADIUS = 30;
const VINE_MIN_GRAB_R = 24;
// Pompe : accélération tangentielle (px/s²) quand la direction tenue va dans
// le sens du mouvement — c'est ce qui « relance » le balancier.
const VINE_PUMP_ACCEL = 700;
const VINE_DAMPING = 0.18; // par seconde, pendant le balancement
const VINE_FREE_DAMPING = 1.4; // liane lâchée : revient vite au repos
// Amplitude maximale du balancement (retour utilisateur : « on peut pomper
// trop haut ») : ~55°. La pompe ne rajoute plus d'énergie au-delà, et la
// vitesse angulaire est plafonnée à celle qui ramènerait juste à cet angle
// (vitesse max au bas de l'arc ≈ √(2·g·r·(1 − cos 55°)), ~480 px/s pour
// r = 250). Une prise faite plus loin (jusqu'à VINE_GRAB_MAX_ANGLE) redescend
// d'elle-même sous la gravité.
const VINE_MAX_ANGLE = 0.96; // ~55°
const VINE_GRAB_MAX_ANGLE = 1.35; // ~77°
const VINE_MAX_OMEGA = 4.2;
const VINE_REGRAB_COOLDOWN_MS = 350; // même liane, juste après l'avoir lâchée
// Lâcher avec Espace = LE saut du singe (retour utilisateur : « le singe ne
// part pas assez loin ») : vitesse horizontale du balancement × 1,45, jamais
// moins de VINE_RELEASE_MIN_VX (lâcher presque à l'arrêt : petit bond quand
// même), + impulsion vers le haut ; puis vol « plané » jusqu'à la prochaine
// liane ou le sol (Player : sans le surplus de gravité de chute, frein
// aérien réduit, cf. vineFlight). Mesuré : ~430-520 px d'un balancement
// franc (avant ~250 px), assez pour enchaîner des lianes espacées de 320 px.
const VINE_RELEASE_SPEED_MULT = 1.45;
const VINE_RELEASE_MIN_VX = 300;
const VINE_RELEASE_BOOST_Y = -330;
const VINE_MAX_CARRY_SPEED = 760;
const VINE_FLIGHT_DRAG = 60;
// Prise en pleine montée : l'élan vertical restant fait « grimper » les mains
// le long de la liane (fraction de la hauteur balistique restante).
const VINE_CLIMB_FRACTION = 0.6;
const VINE_CLIMB_SPEED = 380; // px/s
// Montée / descente volontaire le long de la liane (Z/↑, S/↓) : vitesse, et
// distance minimale mains -> attache (la tête reste juste sous l'attache).
const VINE_CLIMB_MANUAL_SPEED = 140; // px/s
const VINE_CLIMB_TOP_R = 28;
// Longueur de balancier minimale (fraction de la liane) : correctif, une prise
// en pleine montée (après un double saut) faisait remonter les mains presque
// jusqu'à l'attache -> balancier trop court, lâcher sans élan. Une prise plus
// haute que ce seuil redescend doucement jusqu'à lui (même vitesse).
const VINE_MIN_SWING_FRACTION = 0.6;
const VINE_COLOR = 0x3f7a3a;
const VINE_LEAF_COLOR = 0x6fbf5a;
// Attache DESSINÉE (retour utilisateur 2026-10-25, capture : « les lianes ne
// sont pas rattachées au bloc ») : le point d'attache des données est le bas
// de la CASE (haut + 64), mais l'image du bloc est plus courte que la case
// (jeux de biome remontés de AUTOTILE_BLOB_VISUAL_LIFT, île dessinée dans sa
// case avec une marge transparente) -- mesuré : ~18-20 px de vide entre le
// bas visible de l'écorce et le haut de la liane. Le DESSIN de la liane part
// donc de l'intérieur du bloc (VINE_TOP_TUCK px au-dessus de son bas visible,
// mesuré sur les pixels du bloc), derrière lui pour que son bout ne se voie
// pas ; la physique (attache, longueur utile, balancement, grimpe) reste
// celle des données, au pixel près.
const VINE_TOP_TUCK = 12;
// Ne jamais dépasser par le HAUT du bloc (bloc très fin) : marge sous son haut visible.
const VINE_TOP_KEEP_INSIDE = 6;
// Demi-largeur de liane sondée (bloc mesuré au centre et aux deux bords).
const VINE_PROBE_HALF_W = 8;

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
    // Vibration visuelle à la prise / au lâcher (juice, cf. twang).
    this.twangAmp = 0;
    this.twangAt = 0;

    // Haut DESSINÉ de la liane : `drawLift` px au-dessus de l'attache, dans le
    // bloc qui la porte (cf. VINE_TOP_TUCK) ; 0 sans bloc mesurable au-dessus
    // (liane posée ailleurs : dessin d'avant).
    const block = vineBlockAbove(scene, this.x, this.y);
    this.drawLift = 0;
    if (block) {
      const top = Math.max(block.bottom - VINE_TOP_TUCK, block.top + VINE_TOP_KEEP_INSIDE);
      this.drawLift = Math.max(0, this.y - top);
    }

    if (scene.textures.exists('item-liane')) {
      this.image = scene.add.image(this.x, this.y - this.drawLift, 'item-liane').setOrigin(0.5, 0);
      const def = getItemManifest().liane || {};
      const sx = def.scale || 1;
      // Longueur dessinée = longueur utile + bout caché dans le bloc.
      this.image.setScale(sx, (this.length + this.drawLift) / this.image.height);
      this.imageScaleX = sx;
    } else {
      this.gfx = scene.add.graphics();
    }
    // Derrière le joueur (créé avant les handlers de données de zone) ; avec
    // un bloc au-dessus, derrière le SOL de premier plan (le bloc cache le bout
    // de la liane, et le joueur, créé après, reste devant).
    const obj = this.image || this.gfx;
    if (block && scene.__frontGroundFirstImage && typeof sendBehindFrontGround === 'function') {
      sendBehindFrontGround(scene, [obj]);
    } else if (scene.player && scene.children.moveBelow) {
      scene.children.moveBelow(obj, scene.player);
    }
    this.draw(0);
  }

  // Pivot DESSINÉ (haut visible, dans le bloc) et angle du dessin : la droite
  // tracée depuis ce pivot passe par les MAINS (liane tenue) ou par le bout
  // physique de la liane (libre) -- la main reste pile sur la liane dessinée
  // alors que le pendule physique tourne autour de l'attache des données,
  // drawLift px plus bas. Sans drawLift : angle physique, comme avant.
  drawPose(a = this.displayAngle) {
    const px = this.x;
    const py = this.y - this.drawLift;
    if (!this.drawLift) return { px, py, angle: a };
    const p = this.pointAt(this.grabbedBy ? this.swingR : this.length, a);
    return { px, py, angle: Math.atan2(p.x - px, p.y - py) };
  }

  // Tenue : angle qui correspond à la position ACTUELLE du corps du joueur
  // (`drawTheta`, posé par stepSwing avant d'avancer le pendule d'un pas) --
  // `theta` a déjà un pas d'avance sur le corps, qui ne l'atteindra qu'au
  // prochain pas de physique. Dessiner `theta` décalait la main de la liane.
  get displayAngle() {
    if (this.grabbedBy) return this.drawTheta ?? this.theta;
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
    // Tracé depuis le pivot dessiné (cf. drawPose) ; longueur = longueur
    // utile + bout caché dans le bloc.
    const { px, py, angle: a } = this.drawPose();
    if (this.image) {
      this.image.setRotation(-a);
      return;
    }
    const g = this.gfx;
    g.clear();
    const lift = this.drawLift;
    const total = this.length + lift;
    const steps = Math.max(4, Math.round(total / 16));
    const ux = Math.sin(a);
    const uy = Math.cos(a);
    const nx = Math.cos(a);
    const ny = -Math.sin(a);
    const t = (time || 0) / 1000;
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const d = (total * i) / steps;
      // Petite ondulation organique perpendiculaire, nulle à l'attache, plus
      // la vibration de prise/lâcher (twang, sur la distance à l'attache
      // PHYSIQUE : nulle dans le bloc).
      const w = Math.sin(i * 1.3 + t * 2 + this.phase) * 2.5 * (i / steps) + this.twangOffset(Math.max(0, d - lift));
      pts.push({ x: px + ux * d + nx * w, y: py + uy * d + ny * w });
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
    g.fillCircle(px, py, 5);
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
    // La liane vient aux mains (angle attache -> mains), plutôt que l'inverse :
    // avant, le corps était téléporté jusqu'à 30 px de côté sur la liane au
    // 1er pas de physique (saut visible à la prise).
    const hx = player.x - this.x;
    const hy = player.y - VINE_HANG_OFFSET - this.y;
    const r = Math.hypot(hx, hy);
    this.theta = Phaser.Math.Clamp(Math.atan2(hx, hy), -VINE_GRAB_MAX_ANGLE, VINE_GRAB_MAX_ANGLE);
    this.drawTheta = this.theta;
    this.swingR = Phaser.Math.Clamp(r, VINE_MIN_GRAB_R, this.length);
    // Vitesse angulaire déduite de la vitesse du joueur (composante
    // tangentielle), un peu amortie pour une prise franche.
    const vx = player.body.velocity.x;
    const vy = player.body.velocity.y;
    const tangential = vx * Math.cos(this.theta) - vy * Math.sin(this.theta);
    this.omega = Phaser.Math.Clamp((tangential / this.swingR) * 0.85, -VINE_MAX_OMEGA, VINE_MAX_OMEGA);
    const g = this.scene.physics.world.gravity.y;
    const climb = vy < 0 ? (vy * vy) / (2 * g) * VINE_CLIMB_FRACTION : 0;
    const minSwingR = Math.max(VINE_MIN_GRAB_R, this.length * VINE_MIN_SWING_FRACTION);
    this.climbTargetR = Phaser.Math.Clamp(this.swingR - climb, minSwingR, this.length);
    this.grabbedBy = player;
  }

  // Mains au bas de la liane (S y fait lâcher, cf. Player.update).
  atBottom() {
    return this.swingR >= this.length - 0.5;
  }

  // Avance le pendule d'un pas et renvoie la position cible des PIEDS.
  // Appelé à chaque pas de physique (Player.stepVinePhysics, dt fixe).
  // `climb` : -1 monte (Z/↑), +1 descend (S/↓), 0 rien.
  stepSwing(player, dir, dt, climb = 0) {
    this.drawTheta = this.theta;
    const g = this.scene.physics.world.gravity.y;
    if (climb) {
      // Montée/descente volontaire : remplace la remontée automatique de la prise.
      this.swingR = Phaser.Math.Clamp(this.swingR + climb * VINE_CLIMB_MANUAL_SPEED * dt, VINE_CLIMB_TOP_R, this.length);
      this.climbTargetR = this.swingR;
    } else if (this.climbTargetR < this.swingR) {
      this.swingR = Math.max(this.climbTargetR, this.swingR - VINE_CLIMB_SPEED * dt);
    } else if (this.climbTargetR > this.swingR) {
      this.swingR = Math.min(this.climbTargetR, this.swingR + VINE_CLIMB_SPEED * dt);
    }
    const r = this.swingR;
    // Amplitude équivalente à l'énergie actuelle (cos de l'angle où le
    // pendule s'arrêterait) : la pompe ne pousse plus au-delà de VINE_MAX_ANGLE.
    const cosMax = Math.cos(VINE_MAX_ANGLE);
    const atMax = Math.cos(this.theta) - (r * this.omega * this.omega) / (2 * g) <= cosMax;
    let alpha = -(g / r) * Math.sin(this.theta);
    if (dir !== 0 && (dir * this.omega >= -0.25) && !(atMax && dir * this.omega > 0)) alpha += (dir * VINE_PUMP_ACCEL) / r;
    this.omega += alpha * dt;
    this.omega *= Math.max(0, 1 - VINE_DAMPING * dt);
    this.omega = Phaser.Math.Clamp(this.omega, -VINE_MAX_OMEGA, VINE_MAX_OMEGA);
    // Vitesse plafonnée à celle qui ramène juste à VINE_MAX_ANGLE (plafond
    // d'énergie, sans arrêt sec en haut de l'arc). Au-delà de l'angle (prise
    // lointaine), la gravité le ramène d'elle-même.
    if (Math.abs(this.theta) <= VINE_MAX_ANGLE) {
      const cap = Math.sqrt(Math.max(0, (2 * g * (Math.cos(this.theta) - cosMax)) / r));
      this.omega = Phaser.Math.Clamp(this.omega, -cap, cap);
    }
    this.theta += this.omega * dt;
    if (Math.abs(this.theta) > VINE_GRAB_MAX_ANGLE) {
      this.theta = Math.sign(this.theta) * VINE_GRAB_MAX_ANGLE;
      this.omega = 0;
    }
    // (Redessinée par update(), une fois par image, à `displayAngle`.)
    const hand = this.pointAt(r, this.theta);
    return { x: hand.x, y: hand.y + VINE_HANG_OFFSET };
  }

  // Juice (visuel seul) : la liane vibre quand on la saisit ou la lâche --
  // onde amortie entre l'attache et les mains (nulle aux deux bouts : la
  // main reste sur la liane), bout libre qui fouette sous les mains. Art
  // `liane` (image non déformable) : brève pulsation de son épaisseur.
  twang(strength = 1) {
    this.twangAmp = 7 * strength;
    this.twangAt = this.scene.time.now;
    if (this.image && this.image.active) {
      const sx = this.imageScaleX || this.image.scaleX;
      this.scene.tweens.killTweensOf(this.image);
      this.image.scaleX = sx * (1 + 0.35 * strength);
      this.scene.tweens.add({ targets: this.image, scaleX: sx, duration: 280, ease: 'Back.easeOut' });
    }
  }

  twangOffset(r) {
    if (!this.twangAmp) return 0;
    const dt = this.scene.time.now - this.twangAt;
    if (dt > 800) { this.twangAmp = 0; return 0; }
    const env = this.twangAmp * Math.exp(-dt / 210) * Math.cos(dt * 0.045);
    const hold = this.grabbedBy ? this.swingR : this.length;
    if (r <= hold) return env * Math.sin((Math.PI * r) / Math.max(1, hold));
    return env * 0.6 * Math.sin((Math.PI * (r - hold)) / Math.max(1, (this.length - hold) * 2));
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
    this.drawTheta = null;
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

// Bloc de terrain qui porte une liane : { top, bottom } VISIBLES (px monde)
// des images du sol de premier plan juste au-dessus de l'attache (x, y),
// mesurés sur leurs pixels (frameAlphaMap, LevelKit) au centre et aux deux
// bords de la liane : `bottom` = le plus haut des bas (la liane doit monter
// au-dessus partout), `top` = le plus bas des hauts. Marche avec tous les
// jeux de tuiles (images `autotile-*` : défaut 'tuiles' en atlas, jeux des
// biomes remontés, plateformes recalées sur leur mousse) puisqu'on mesure le
// dessin tel qu'il est posé, pas la grille. Pixels illisibles : boîte de
// l'image. Null sans bloc (liane hors d'un bloc : dessin d'avant).
function vineBlockAbove(scene, x, y) {
  const anchor = scene.__frontGroundFirstImage;
  if (!anchor || !scene.children) return null;
  const list = scene.children.list;
  const start = list.indexOf(anchor);
  if (start < 0) return null;
  const alphaMin = typeof VISIBLE_ALPHA_MIN === 'number' ? VISIBLE_ALPHA_MIN : 40;
  // Bloc dont le bas visible tombe dans la case au-dessus de l'attache
  // (GROUND_TILE_SIZE = 64), à quelques px près sous elle (case pleine).
  const tile = typeof GROUND_TILE_SIZE === 'number' ? GROUND_TILE_SIZE : 64;
  const minBottom = y - tile - 8;
  const maxBottom = y + 8;
  const probes = [x - VINE_PROBE_HALF_W, x, x + VINE_PROBE_HALF_W];
  const cols = probes.map(() => ({ bottom: null, top: null }));
  for (let i = start; i < list.length; i++) {
    const o = list[i];
    if (o.type !== 'Image' || !o.visible || !o.frame || !o.texture || o.texture.key.indexOf('autotile-') < 0) continue;
    const f = o.frame;
    const sx = Math.abs(o.scaleX);
    const sy = Math.abs(o.scaleY);
    if (!sx || !sy) continue;
    const left = o.x - o.displayOriginX * sx;
    const top = o.y - o.displayOriginY * sy;
    if (x + VINE_PROBE_HALF_W < left || x - VINE_PROBE_HALF_W > left + f.cutWidth * sx) continue;
    const map = typeof frameAlphaMap === 'function' ? frameAlphaMap(f) : null;
    probes.forEach((cx, k) => {
      let col = Math.floor((cx - left) / sx);
      if (col < 0 || col >= f.cutWidth) return;
      if (o.flipX) col = f.cutWidth - 1 - col;
      let r0 = 0;
      let r1 = f.cutHeight - 1;
      if (map) {
        r0 = -1;
        for (let r = 0; r < map.h; r++) {
          if (map.alpha[r * map.w + col] > alphaMin) { if (r0 < 0) r0 = r; r1 = r; }
        }
        if (r0 < 0) return;
      }
      if (o.flipY) { const t = f.cutHeight - 1 - r1; r1 = f.cutHeight - 1 - r0; r0 = t; }
      const wt = top + r0 * sy;
      const wb = top + (r1 + 1) * sy;
      if (wb < minBottom || wb > maxBottom) return;
      const c = cols[k];
      c.bottom = c.bottom == null ? wb : Math.max(c.bottom, wb);
      c.top = c.top == null ? wt : Math.min(c.top, wt);
    });
  }
  const found = cols.filter((c) => c.bottom != null);
  if (!found.length) return null;
  return { bottom: Math.min(...found.map((c) => c.bottom)), top: Math.max(...found.map((c) => c.top)) };
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
