// Formes MYTHIQUES (demande de l'utilisateur du 2026-11-15). Chargé après Ursides.js (index.html).
//
// Une forme mythique est une transformation GLOBALE sur la touche X : pendant 30 s, Agarica n'est plus
// elle-même. Tout change avec la forme : sa silhouette, sa marche, son sprint (Maj), son attaque (K), son
// double saut et les trois touches de compétence (A, F, R), qui lancent celles de la forme -- leurs icônes
// remplacent celles des compétences équipées dans le HUD (StoryKit, storyDrawHudArt).
//
// Première forme : URSA MAJOR, la Grande Ourse (famille des ursidés).
//   - image : le grizzly repeint en violets, le ciel étoilé en texture (tools/make_ursa.py), avec la
//     constellation -- les sept étoiles et leurs traits -- dessinée par-dessus ;
//   - marche, sprint, saut : ses propres poses (mythicUrsaPose) ; au sprint (Maj), COURSE STELLAIRE : tête
//     basse, rapide tout de suite, elle sème des étoiles qui restent un instant au sol (1 dégât) ;
//   - K : COUP DE PATTE, elle se dresse et abat ses pattes devant elle (1 dégât), trois arcs d'étoiles ;
//   - double saut : elle lance une étoile en diagonale, puis se TÉLÉPORTE sur l'étoile ;
//   - A : ÉTOILES FILANTES, une étoile par ursidé équipé part d'une étoile de sa constellation et fond sur
//     l'ennemi le plus proche (1 dégât) ;
//   - F : PLUIE D'ÉTOILES, six étoiles tombent du ciel devant elle, chacune annoncée au sol (1 dégât) ;
//   - R : LES SEPT OURS, l'ulti : la nuit tombe, les sept étoiles s'allument, sept ourses d'étoiles
//     chargent droit devant (1 dégât chacune) ; il MET FIN à la transformation.
// Disponible dès qu'au moins un ursidé est équipé ; après la transformation, une attente (cooldownMs).
//
// Règles de « jus » suivies partout ici (retour du 2026-11-15 : « plus propre, travaillé et juicy ») :
// chaque action a un ÉLAN (pose dressée, annonce), un IMPACT net (grande étoile blanche d'une ou deux
// images, éclats, secousse, court arrêt sur image) et une RETOMBÉE (éclats qui s'éteignent) ; rien n'est
// fondu, tout est en gros pixels.
//
// Ce fichier porte tout : l'état (`player.mythic`), les poses, les effets, les dégâts, l'affichage.
// Player.js lui passe la main à cinq endroits : la forme affichée (l'ours du grizzly, dont
// ursideGrizzlyPose appelle mythicUrsaPose), la vitesse (mythicMove), l'attaque (mythicAttack), le saut
// en l'air (mythicAirJump) et les touches de compétence (mythicSkill).

const MYTHIC_URSA = {
  label: 'Grande Ourse',
  durationMs: 30000,
  cooldownMs: 45000,
  walkSpeed: 230,
  sprintSpeed: 450,
  sprintAccel: 2400,
  // Double saut : l'étoile part à 45° ; portée et durée de son vol.
  blinkReach: 210,
  blinkMs: 170,
  // [nom, attente en ms] des trois compétences
  skills: [['Étoiles filantes', 2200], ['Pluie d\'étoiles', 6000], ['Les sept ours', 0]],
  attackMs: 430,
  attackHitMs: 200,
  attackCooldownMs: 520,
  starSpeed: 600,
  starRange: 720,
  rainCount: 6,
  rainRadius: 46,
  bears: 7,
  bearSpeed: 800,
  bearMs: 950,
};
const MYTHIC_COLORS = { white: 0xffffff, pale: 0xd9ccff, violet: 0x9b7dff, deep: 0x5a3fc0, line: 0xb9a8ff, night: 0x0c0624 };
// La constellation sur le corps de l'ourse tournée vers la droite : (u, v) dans sa boîte visible, u de la
// croupe (0) au museau (1), v du dos (0) aux pattes (1). D'après le modèle : la casserole sur le flanc, le
// manche qui file le long du cou jusqu'à la tête.
const MYTHIC_DIPPER = [[0.9, 0.36], [0.74, 0.26], [0.56, 0.36], [0.44, 0.4], [0.2, 0.3], [0.24, 0.62], [0.42, 0.64]];
const MYTHIC_DIPPER_LINKS = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]];
// La même, grande, dans le ciel de l'écran pendant l'ulti (fractions de l'écran).
const MYTHIC_SKY = [[0.16, 0.2], [0.3, 0.13], [0.44, 0.2], [0.55, 0.24], [0.8, 0.17], [0.77, 0.38], [0.58, 0.4]];
const MYTHIC_BODIES = new Map();

function mythicUrsidCount(p) {
  return typeof familyCounts === 'function' ? (familyCounts(p).ursides || 0) : 0;
}

function mythicState(scene) {
  let st = scene.__mythic;
  if (!st || !st.g || !st.g.active || st.g.scene !== scene) {
    const g = scene.add.graphics().setDepth(CHARACTER_DEPTH + 3);
    g.lookRole = 'fx';
    // sous le HUD (1000) : la nuit de l'ulti ; par-dessus : la touche X
    const sky = scene.add.graphics().setDepth(990).setScrollFactor(0);
    const hud = scene.add.graphics().setDepth(1001.5).setScrollFactor(0);
    st = scene.__mythic = { g, sky, hud, stars: [], trail: [], bears: [], flashes: [], marks: [], ghosts: [], blink: null, seq: 0, slot: null };
  }
  return st;
}

// Son propre à la Grande Ourse s'il est rangé (AUDIO_SFX), sinon un son existant qui s'en approche.
function mythicSfx(id, fallback, opts) {
  if (typeof playSfx !== 'function') return;
  const has = typeof AUDIO_SFX !== 'undefined' && AUDIO_SFX[id];
  if (has) playSfx(id, opts);
  else if (fallback) playSfx(fallback, opts);
}

// Gerbe d'éclats d'étoile (mêmes gros pixels que les effets des ours).
function mythicSparks(scene, x, y, count = 8, power = 1) {
  if (typeof ursideFxAdd !== 'function') return;
  const C = MYTHIC_COLORS;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + Math.random() * 0.6, sp = (70 + Math.random() * 170) * power;
    ursideFxAdd(scene, {
      x, y, w: i % 3 ? 4 : 6, h: i % 3 ? 4 : 6, color: [C.white, C.pale, C.violet][i % 3],
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, gy: 260, ms: 220 + Math.random() * 260,
    });
  }
}

// Une étoile à quatre branches en gros pixels, centrée en (x, y) ; `r` : demi-longueur des branches.
function mythicDrawStar(g, x, y, r, color = MYTHIC_COLORS.white, core = MYTHIC_COLORS.white) {
  const s = (v) => Math.round(v / 2) * 2;
  x = s(x); y = s(y); r = Math.max(2, s(r));
  g.fillStyle(color, 1);
  g.fillRect(x - r, y - 1, r * 2, 2);
  g.fillRect(x - 1, y - r, 2, r * 2);
  if (r >= 8) {   // branches plus épaisses près du cœur
    g.fillRect(x - r / 2, y - 2, r, 4);
    g.fillRect(x - 2, y - r / 2, 4, r);
  }
  g.fillStyle(core, 1);
  const c = Math.max(2, s(r * 0.4));
  g.fillRect(x - c, y - c, c * 2, c * 2);
}

// Éclair d'impact : une grande étoile blanche qui rétrécit en deux ou trois images.
function mythicFlash(scene, x, y, r = 16, ms = 130) {
  mythicState(scene).flashes.push({ x, y, r, born: scene.time.now, ms });
}

function mythicEnemies(scene) {
  return scene.enemies ? scene.enemies.getChildren().filter((e) => e && e.active && !e.defeated) : [];
}

function mythicEnemyBox(e) {
  return typeof e.getMeleeBounds === 'function' ? e.getMeleeBounds() : e.getBounds();
}

// Frappe tout ce qui touche `rect` : ennemis du groupe (1 dégât, une fois par `token`) et, pour les boss
// tenus hors du groupe, l'événement « player-skill » qu'ils écoutent déjà.
function mythicStrike(scene, p, rect, token, { event = true } = {}) {
  let hit = false;
  for (const e of mythicEnemies(scene)) {
    if (!Phaser.Geom.Intersects.RectangleToRectangle(rect, mythicEnemyBox(e))) continue;
    const src = { kind: 'skill', skillId: 'ursa_major', player: p, x: rect.centerX, y: rect.centerY };
    const ok = typeof ursideDamage === 'function' ? ursideDamage(scene, e, src, token, 1, { bonus: false })
      : damageEnemy(scene, e, { ...src, damage: 1, token });
    hit = ok || hit;
  }
  if (event) scene.events.emit('player-skill', { skillId: 'ursa_major', rect, token });
  return hit;
}

// Les sept étoiles de la constellation, en coordonnées du monde, sur l'ourse telle qu'elle est affichée.
function mythicDipperPoints(p) {
  const box = typeof ursideVisibleBox === 'function' ? ursideVisibleBox(p) : p.getBounds();
  const right = p.facingDir >= 0;
  return MYTHIC_DIPPER.map(([u, v]) => [box.x + (right ? u : 1 - u) * box.width, box.y + v * box.height]);
}

// Action différée de la transformation en cours (élan avant l'effet) ; oubliée si elle prend fin avant.
function mythicLater(p, ms, fn) {
  if (p.mythic) p.mythic.queue.push({ at: p.scene.time.now + ms, fn });
}

// Pose d'attaque ou d'incantation : une suite d'images de `ursa-attack-*` (0 debout, 1 dressée patte
// levée, 2-3 pattes abattues, 4-5 elle se redresse), `frameMs` chacune.
function mythicPose(p, now, frames, frameMs) {
  p.mythic.pose = { start: now, until: now + frames.length * frameMs, frames, frameMs };
}

// --- Début et fin ------------------------------------------------------------------------------

function mythicCanStart(p, now) {
  return !p.mythic && now >= (p.mythicReadyAt || 0) && mythicUrsidCount(p) > 0 && !p.skillTransformActive;
}

function mythicStart(p, now) {
  const scene = p.scene, T = MYTHIC_URSA;
  p.mythic = { id: 'ursa', startedAt: now, until: now + T.durationMs, cds: [0, 0, 0], queue: [], pose: null, attackAt: 0, seq: 0 };
  const S = mythicState(scene);
  const b = p.getBounds();
  // Impact : arrêt sur image, éclair, anneau d'éclats ; la constellation se trace ensuite, étoile par étoile.
  mythicFlash(scene, b.centerX, b.centerY, 34, 200);
  mythicSparks(scene, b.centerX, b.centerY, 28, 1.6);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    S.stars.push({ x: b.centerX, y: b.centerY, vx: Math.cos(a) * 420, vy: Math.sin(a) * 420, born: now, ms: 260, id: ++S.seq, kind: 'spark' });
  }
  if (typeof juiceShake === 'function') juiceShake(scene, 'medium');
  if (typeof juiceHitStop === 'function') juiceHitStop(scene, 110);
  if (scene.cameras && scene.cameras.main) scene.cameras.main.flash(140, 150, 120, 255);
  mythicSfx('ursa_start', 'panda_heal');
  mythicPose(p, now, [1, 1, 1, 0], 110);   // elle se dresse en rugissant
}

function mythicEnd(p, now, { ulti = false } = {}) {
  if (!p.mythic) return;
  const scene = p.scene;
  p.mythic = null;
  p.mythicReadyAt = now + MYTHIC_URSA.cooldownMs;
  const b = p.getBounds();
  mythicFlash(scene, b.centerX, b.centerY, ulti ? 30 : 22, 160);
  mythicSparks(scene, b.centerX, b.centerY, ulti ? 30 : 18, ulti ? 1.6 : 1.1);
  mythicSfx('ursa_blink', 'eclat_pickup');
}

// --- Poses (ursideGrizzlyPose, quand p.mythic) ---------------------------------------------------

// Marche (pas lents), sprint (tête basse, foulées rapides), saut, repos, et les poses d'attaque.
// Le corps physique est recalculé pour chaque image (les images d'attaque ont un autre cadre).
function mythicUrsaPose(p, now, s) {
  const sc = p.scene, m = p.mythic;
  const speed = Math.abs(p.body.velocity.x);
  let key, scale;
  if (m.pose && now < m.pose.until) {
    const f = m.pose.frames[Math.min(m.pose.frames.length - 1, Math.floor((now - m.pose.start) / m.pose.frameMs))];
    key = `ursa-attack-${f}`;
    scale = ((typeof getAssetManifest === 'function' && getAssetManifest().ours_brun) || {}).scale || 0.476;
  } else {
    m.pose = null;
    let base;
    if (!s.onGround) base = `grizzly-jump-${p.body.velocity.y < 0 ? 0 : 1}`;
    else if (speed < 40 && s.dir === 0) base = 'grizzly-run-0';
    else if (speed > 300) base = `grizzly-charge-${Math.floor(now / 62) % 4}`;     // course stellaire
    else base = `grizzly-run-${Math.floor(now / 135) % 4}`;                          // marche
    key = `ursa-${base}`;
    scale = (typeof ursideFrameScale === 'function' && ursideFrameScale(base)) || 0.4214;
  }
  if (!sc.textures.exists(key)) return false;
  p.anims.stop();
  if (p.texture.key !== key) p.setTexture(key);
  let body = MYTHIC_BODIES.get(key);
  if (!body) {
    body = ursideBody(p.frame.realWidth, p.frame.realHeight, scale, GRIZZLY_TUNING.bodyW, GRIZZLY_TUNING.bodyH);
    MYTHIC_BODIES.set(key, body);
  }
  p.applyBodyForScale(scale, body);
  return true;
}

// --- Déplacement (Player.update) -----------------------------------------------------------------

// Vitesse de la Grande Ourse. En sprint au sol, elle sème des étoiles derrière elle. Pendant une pose
// d'attaque ou d'incantation, elle ne court pas.
function mythicMove(p, now, s) {
  const T = MYTHIC_URSA, m = p.mythic;
  const posing = m.pose && now < m.pose.until;
  const sprint = s.sprinting && !posing;
  if (sprint && s.dir !== 0 && s.onGround && Math.abs(p.body.velocity.x) > 200) {
    if (!m.sprinting) {   // départ : une gerbe sous ses pattes
      m.sprinting = true;
      mythicSparks(p.scene, p.x - s.dir * 20, p.body.bottom - 6, 8, 0.8);
      mythicSfx('ursa_bear', 'grizzly_whoosh', { volume: 0.5 });
    }
    if (now >= (m.trailAt || 0)) {
      m.trailAt = now + 85;
      const st = mythicState(p.scene);
      st.trail.push({ x: p.x - s.dir * 28, y: p.body.bottom - 10 - Math.random() * 14, born: now, ms: 620, id: ++st.seq });
      if (st.trail.length > 24) st.trail.shift();
      if (typeof ursideFxAdd === 'function') {
        ursideFxAdd(p.scene, { x: p.x - s.dir * 50, y: p.body.center.y + (Math.random() - 0.5) * 40, w: 18 + Math.random() * 20, h: 2,
          color: Math.random() < 0.5 ? MYTHIC_COLORS.pale : MYTHIC_COLORS.violet, vx: -s.dir * 160, ms: 130, shrink: false });
      }
    }
  } else if (!sprint || s.dir === 0) {
    m.sprinting = false;
  }
  return { acceleration: sprint ? T.sprintAccel : p.moveAcceleration, maxSpeed: posing ? 60 : sprint ? T.sprintSpeed : T.walkSpeed };
}

// K : coup de patte. Elle se dresse (élan), abat ses pattes (impact), se redresse.
function mythicAttack(p, now) {
  const m = p.mythic, T = MYTHIC_URSA, scene = p.scene;
  if (!m || now < m.attackAt || (m.pose && now < m.pose.until)) return;
  m.attackAt = now + T.attackCooldownMs;
  const dir = p.facingDir >= 0 ? 1 : -1;
  mythicPose(p, now, [1, 1, 2, 3, 4, 5], T.attackMs / 6);
  mythicSfx('ursa_claw', 'ours_swing');
  const id = ++m.seq;
  mythicLater(p, T.attackHitMs, () => {
    const b = p.body;
    const rect = new Phaser.Geom.Rectangle(dir > 0 ? b.center.x : b.center.x - 124, b.bottom - 104, 124, 104);
    const hit = mythicStrike(scene, p, rect, `ursa-claw-${id}`);
    // trois arcs d'étoiles, de haut en bas devant elle
    const S = mythicState(scene);
    for (let k = 0; k < 3; k++) {
      for (let j = 0; j < 6; j++) {
        const a = -1.15 + j * 0.42;
        const r = 64 + k * 20;
        S.stars.push({ x: b.center.x + dir * Math.cos(a) * r, y: b.bottom - 54 + Math.sin(a) * r * 0.85, vx: dir * 60, vy: 120,
          born: scene.time.now + j * 12, ms: 150, id: ++S.seq, kind: 'spark', small: k !== 1 });
      }
    }
    mythicFlash(scene, b.center.x + dir * 86, b.bottom - 36, hit ? 22 : 14, 110);
    mythicSparks(scene, b.center.x + dir * 86, b.bottom - 10, hit ? 12 : 6, 1);
    if (typeof juiceShake === 'function') juiceShake(scene, hit ? 'medium' : 'light');
    if (hit && typeof juiceHitStop === 'function') juiceHitStop(scene, 60);
    if (hit) mythicSfx('ursa_star_hit', 'grizzly_hit');
    if (p.onGround) p.setVelocityX(dir * 150);
  });
}

// Double saut : l'étoile part en diagonale ; l'ourse la rejoint quand elle s'arrête (mythicUpdateHook).
function mythicAirJump(p, now, dir) {
  const st = mythicState(p.scene);
  const c = p.body.center;
  st.blink = { x: c.x, y: c.y, x0: c.x, y0: c.y, dir, born: now, lastX: c.x, lastY: c.y };
  // elle reste un instant suspendue, le temps que l'étoile vole
  p.setVelocity(p.body.velocity.x * 0.25, Math.min(p.body.velocity.y, -40) * 0.3);
  mythicSfx('ursa_star', 'jump_air');
  mythicSparks(p.scene, c.x, c.y, 6, 0.7);
}

// La place est-elle libre pour le corps de l'ourse, centré en (x, y) ?
function mythicBodyFits(p, x, y) {
  const b = p.body, w = b.width - 6, h = b.height - 6;
  const hits = p.scene.physics.overlapRect(x - w / 2, y - h / 2, w, h, false, true);
  return !hits.some((o) => o.gameObject !== p);
}

// --- Compétences (Player.tryActivateSkill) -------------------------------------------------------

function mythicSkill(p, slot, now) {
  const m = p.mythic, T = MYTHIC_URSA;
  if (!m || slot < 0 || slot > 2) return;
  if (now < m.cds[slot] || m.ending || (m.pose && now < m.pose.until && slot !== 2)) {
    if (typeof juiceHudDeny === 'function') juiceHudDeny(p.scene);
    return;
  }
  m.cds[slot] = now + T.skills[slot][1];
  if (typeof juiceHudSkillPop === 'function') juiceHudSkillPop(p.scene, slot);
  if (slot === 0) mythicShootingStars(p, now);
  else if (slot === 1) mythicStarRain(p, now);
  else mythicSevenBears(p, now);
}

// A : elle se dresse ; une étoile par ursidé équipé se détache de sa constellation et fond sur un ennemi.
function mythicShootingStars(p, now) {
  const scene = p.scene, T = MYTHIC_URSA;
  const n = Math.max(1, Math.min(7, mythicUrsidCount(p)));
  const dir = p.facingDir >= 0 ? 1 : -1;
  mythicPose(p, now, [1, 1, 1, 0], 85);
  mythicSfx('ursa_star', 'eclat_pickup');
  mythicLater(p, 110, () => {
    const S = mythicState(scene);
    const t0 = scene.time.now;
    const c = p.body.center;
    const pts = mythicDipperPoints(p);
    const targets = mythicEnemies(scene)
      .map((e) => ({ e, d: Phaser.Math.Distance.Between(c.x, c.y, e.x, mythicEnemyBox(e).centerY) }))
      .filter((t) => t.d <= T.starRange).sort((a, b) => a.d - b.d).map((t) => t.e);
    for (let i = 0; i < n; i++) {
      const [sx, sy] = pts[i % pts.length];
      // elles jaillissent en éventail au-dessus d'elle, puis fondent sur leur cible
      const a = -Math.PI / 2 + dir * (0.45 + (n > 1 ? (i / (n - 1) - 0.5) * 1.5 : 0));
      S.stars.push({
        x: sx, y: sy, vx: Math.cos(a) * T.starSpeed * 0.7, vy: Math.sin(a) * T.starSpeed * 0.7,
        target: targets.length ? targets[i % targets.length] : null, dir, born: t0 + i * 60, ms: 1700, id: ++S.seq, kind: 'homing',
      });
      mythicFlash(scene, sx, sy, 10, 90 + i * 60);
    }
    if (typeof juiceShake === 'function') juiceShake(scene, 'light');
  });
}

// F : elle rugit vers le ciel ; six étoiles tombent devant elle l'une après l'autre. Chacune est annoncée
// par une marque au sol, puis éclate.
function mythicStarRain(p, now) {
  const scene = p.scene, T = MYTHIC_URSA;
  const dir = p.facingDir >= 0 ? 1 : -1;
  mythicPose(p, now, [1, 1, 1, 1, 1, 0], 90);
  mythicSfx('ursa_claw', 'flight_takeoff', { volume: 0.7 });
  const feet = p.body.bottom, px = p.x;
  mythicLater(p, 160, () => {
    const S = mythicState(scene);
    const t0 = scene.time.now;
    for (let i = 0; i < T.rainCount; i++) {
      const tx = px + dir * (70 + i * 52);
      const gy = typeof ursideGroundBelow === 'function' ? ursideGroundBelow(scene, tx, feet - 90) : null;
      const ty = gy == null ? feet : gy;
      const fall = 0.4;   // durée de la chute (s)
      const born = t0 + 180 + i * 105;
      S.marks.push({ x: tx, y: ty, born: t0 + i * 105, until: born + fall * 1000 });
      S.stars.push({
        x: tx - dir * 150, y: ty - 330, vx: (dir * 150) / fall, vy: 330 / fall, groundY: ty, born, ms: fall * 1000 + 40,
        id: ++S.seq, kind: 'rain',
      });
    }
  });
}

// R : l'ulti. La nuit tombe, les sept étoiles s'allument une à une, elle abat ses pattes : sept ourses
// d'étoiles chargent droit devant. Puis la transformation prend fin.
function mythicSevenBears(p, now) {
  const scene = p.scene, T = MYTHIC_URSA, m = p.mythic;
  const dir = p.facingDir >= 0 ? 1 : -1;
  const S = mythicState(scene);
  m.ending = true;
  m.until = Math.max(m.until, now + 2000);            // le temps de finir, même à la dernière seconde
  S.night = { born: now, until: now + 620 + T.bears * 95 + T.bearMs };
  mythicPose(p, now, [1, 1, 1, 1, 1, 2, 3, 3, 4, 5], 80);
  mythicSfx('ursa_start', 'panda_heal', { volume: 0.7 });
  if (typeof juiceShake === 'function') juiceShake(scene, 'light');
  mythicLater(p, 400, () => {
    const t0 = scene.time.now;
    const key = scene.textures.exists('ursa-grizzly-charge-0') ? 'ursa-grizzly-charge-' : null;
    const gScale = (typeof ursideFrameScale === 'function' && ursideFrameScale('grizzly-charge-0')) || 0.4214;
    for (let i = 0; i < T.bears; i++) {
      let spr = null;
      if (key) {
        spr = scene.add.image(p.x, p.y, `${key}0`).setOrigin(p.originX, p.originY).setScale(gScale).setFlipX(dir < 0)
          .setDepth(CHARACTER_DEPTH + 1).setVisible(false);
        spr.lookRole = 'fx';
      }
      S.bears.push({
        x: p.x - dir * (20 + i * 10), y: p.y, feet: p.body.bottom, dir, born: t0 + i * 95, ms: T.bearMs, spr, key, id: ++S.seq, index: i,
        w: GRIZZLY_TUNING.bodyW * 1.3, h: GRIZZLY_TUNING.bodyH * 1.2,
      });
    }
    // l'impact : ses pattes frappent le sol
    mythicFlash(scene, p.x + dir * 40, p.body.bottom - 20, 36, 200);
    mythicSparks(scene, p.x + dir * 40, p.body.bottom - 8, 24, 1.5);
    if (typeof juiceShake === 'function') juiceShake(scene, 'heavy');
    if (typeof juiceHitStop === 'function') juiceHitStop(scene, 120);
    if (scene.cameras && scene.cameras.main) scene.cameras.main.flash(120, 150, 120, 255);
    mythicSfx('ursa_ulti', 'ours_slam');
  });
  mythicLater(p, 400 + T.bears * 95 + 120, () => mythicEnd(p, scene.time.now, { ulti: true }));
}

// --- Chaque image ----------------------------------------------------------------------------------

function mythicUpdateHook(scene, time) {
  const p = scene.player;
  if (!p || !p.active || !p.body) return;
  const now = scene.time.now;
  const T = MYTHIC_URSA, C = MYTHIC_COLORS;
  // Touche X : la transformation (ou rien, avec la raison, si elle n'est pas prête).
  if (!p.__mythicKey || p.__mythicKey.plugin !== scene.input.keyboard) {
    p.__mythicKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
  }
  if (Phaser.Input.Keyboard.JustDown(p.__mythicKey) && !p.mythic && !p.locked && !p.defeated) {
    if (mythicCanStart(p, now)) mythicStart(p, now);
    else {
      const wait = Math.ceil(((p.mythicReadyAt || 0) - now) / 1000);
      if (typeof showToast === 'function') {
        showToast(scene, mythicUrsidCount(p) === 0 ? 'Grande Ourse : équipe au moins un ursidé.'
          : wait > 0 ? `Grande Ourse : encore ${wait} s.` : 'Grande Ourse : pas maintenant.', 1400);
      }
      if (typeof juiceHudDeny === 'function') juiceHudDeny(scene);
      mythicState(scene).denyAt = now;
    }
  }
  if (p.mythic) {
    const q = p.mythic.queue;
    for (let i = 0; i < q.length; i++) {
      if (now >= q[i].at) { const it = q.splice(i--, 1)[0]; it.fn(); if (!p.mythic) break; }
    }
  }
  if (p.mythic && now >= p.mythic.until) mythicEnd(p, now);

  const S = mythicState(scene);
  const g = S.g;
  g.clear();
  S.sky.clear();
  const dt = Math.min(50, scene.game.loop.delta || 16) / 1000;
  const W = scene.scale.width, H = scene.scale.height;

  // La nuit de l'ulti : un voile sombre derrière le HUD, et la grande constellation qui s'allume.
  if (S.night) {
    const n = S.night;
    if (now >= n.until) S.night = null;
    else {
      const k = (now - n.born) / (n.until - n.born);
      S.sky.fillStyle(C.night, k < 0.08 ? 0.3 : k > 0.9 ? 0.25 : 0.55).fillRect(0, 0, W, H);
      const lit = Math.min(MYTHIC_SKY.length, Math.floor((now - n.born) / 55));
      const pts = MYTHIC_SKY.map(([u, v]) => [u * W, v * H]);
      S.sky.lineStyle(2, C.line, 0.7);
      for (const [a, b] of MYTHIC_DIPPER_LINKS) if (a < lit && b < lit) S.sky.lineBetween(pts[a][0], pts[a][1], pts[b][0], pts[b][1]);
      for (let i = 0; i < lit; i++) mythicDrawStar(S.sky, pts[i][0], pts[i][1], Math.sin(now / 90 + i) > 0 ? 14 : 10, C.pale, C.white);
    }
  }

  // Images fantômes de la téléportation.
  S.ghosts = S.ghosts.filter((gh) => {
    if (now < gh.until) { gh.img.setAlpha(now > gh.until - 70 ? 0.25 : 0.5); return true; }
    gh.img.destroy();
    return false;
  });

  // L'étoile du double saut : elle vole, puis l'ourse la rejoint.
  if (S.blink) {
    const k = S.blink;
    const u = Math.min(1, (now - k.born) / T.blinkMs);
    const d = T.blinkReach * (1 - (1 - u) * (1 - u));
    const nx = k.x0 + k.dir * d * 0.7071, ny = k.y0 - d * 0.7071;
    if (p.mythic && mythicBodyFits(p, nx, ny)) { k.lastX = nx; k.lastY = ny; k.x = nx; k.y = ny; }
    else k.stop = true;
    for (let i = 1; i <= 6; i++) {
      g.fillStyle(i < 3 ? C.white : i < 5 ? C.pale : C.violet, 1);
      const sz = i < 3 ? 6 : i < 5 ? 4 : 2;
      g.fillRect(Math.round((k.x - k.dir * 8 * i) / 2) * 2, Math.round((k.y + 8 * i) / 2) * 2, sz, sz);
    }
    mythicDrawStar(g, k.x, k.y, 12, C.pale, C.white);
    if (u >= 1 || k.stop || !p.mythic) {
      if (p.mythic && (k.lastX !== k.x0 || k.lastY !== k.y0)) {
        const from = p.body.center;
        // elle laisse son image derrière elle
        const ghost = scene.add.image(p.x, p.y, p.texture.key).setOrigin(p.originX, p.originY).setScale(p.scaleX, p.scaleY)
          .setFlipX(p.flipX).setDepth(CHARACTER_DEPTH).setTintFill(C.violet).setAlpha(0.5);
        ghost.lookRole = 'fx';
        S.ghosts.push({ img: ghost, until: now + 170 });
        mythicSparks(scene, from.x, from.y, 8, 0.8);
        const tx = p.x + (k.lastX - from.x), ty = p.y + (k.lastY - from.y);
        p.body.reset(tx, ty);
        p.setVelocity(k.dir * 220, -230);
        mythicFlash(scene, k.lastX, k.lastY, 24, 130);
        mythicSparks(scene, k.lastX, k.lastY, 14, 1.2);
        if (typeof juiceShake === 'function') juiceShake(scene, 'tiny');
        mythicSfx('ursa_blink', 'eclat_pickup');
      }
      S.blink = null;
    }
  }

  // Étoiles semées par la course stellaire : elles scintillent, blessent, puis s'éteignent.
  S.trail = S.trail.filter((s) => now < s.born + s.ms);
  for (const s of S.trail) {
    const k = (now - s.born) / s.ms;
    const r = k < 0.12 ? 10 : k > 0.75 ? 4 : (Math.floor(now / 90 + s.id) % 2 ? 8 : 6);
    mythicDrawStar(g, s.x, s.y, r, k > 0.6 ? C.violet : C.pale, k > 0.6 ? C.pale : C.white);
    if (k > 0.1 && mythicStrike(scene, p, new Phaser.Geom.Rectangle(s.x - 14, s.y - 14, 28, 28), `ursa-trail-${s.id}`, { event: false })) {
      mythicFlash(scene, s.x, s.y, 14, 90);
      mythicSfx('ursa_star_hit', 'eclat_pickup', { volume: 0.5 });
    }
  }

  // Marques au sol de la pluie d'étoiles : une petite étoile qui clignote là où ça va tomber.
  S.marks = S.marks.filter((mk) => now < mk.until);
  for (const mk of S.marks) {
    if (now < mk.born) continue;
    const on = Math.floor((now - mk.born) / 70) % 2 === 0;
    g.fillStyle(on ? C.pale : C.violet, 1);
    g.fillRect(Math.round(mk.x / 2) * 2 - 18, Math.round(mk.y / 2) * 2 - 2, 36, 2);
    mythicDrawStar(g, mk.x, mk.y - 6, on ? 6 : 4, C.violet, C.pale);
  }

  // Étoiles lancées (filantes, pluie) et étincelles en étoile.
  S.stars = S.stars.filter((s) => !s.dead && now < s.born + s.ms);
  for (const s of S.stars) {
    if (now < s.born) continue;
    if (s.kind === 'homing') {
      if (s.target && (!s.target.active || s.target.defeated)) s.target = null;
      const age = now - s.born;
      if (s.target && age > 150) {
        const tb = mythicEnemyBox(s.target);
        const a = Math.atan2(tb.centerY - s.y, tb.centerX - s.x);
        // elle tourne vite vers sa cible : la vitesse visée remplace peu à peu la sienne
        const k = Math.min(1, dt * 10);
        s.vx += (Math.cos(a) * T.starSpeed - s.vx) * k;
        s.vy += (Math.sin(a) * T.starSpeed - s.vy) * k;
      } else if (!s.target && age > 150) {
        const k = Math.min(1, dt * 6);
        s.vx += (s.dir * T.starSpeed - s.vx) * k;
        s.vy += (0 - s.vy) * k;
      }
    }
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    if (s.kind === 'spark') {
      const k = (now - s.born) / s.ms;
      mythicDrawStar(g, s.x, s.y, k > 0.6 ? 2 : s.small ? 4 : 6, k > 0.5 ? C.violet : C.pale, C.white);
      continue;
    }
    // traîne qui s'amincit
    const sp = Math.hypot(s.vx, s.vy) || 1;
    for (let i = 1; i <= 6; i++) {
      g.fillStyle(i < 3 ? C.white : i < 5 ? C.pale : C.violet, 1);
      const sz = i < 3 ? 6 : i < 5 ? 4 : 2;
      g.fillRect(Math.round((s.x - (s.vx / sp) * 7 * i) / 2) * 2 - sz / 2, Math.round((s.y - (s.vy / sp) * 7 * i) / 2) * 2 - sz / 2, sz, sz);
    }
    mythicDrawStar(g, s.x, s.y, s.kind === 'rain' ? 12 : 10, C.pale, C.white);
    if (s.kind === 'rain') {
      if (s.y >= s.groundY - 6) {
        s.dead = true;
        const R = T.rainRadius;
        const hit = mythicStrike(scene, p, new Phaser.Geom.Rectangle(s.x - R, s.groundY - R * 1.3, R * 2, R * 1.4), `ursa-rain-${s.id}`);
        mythicFlash(scene, s.x, s.groundY - 10, 26, 140);
        mythicSparks(scene, s.x, s.groundY - 6, 14, 1.3);
        // éclats qui rasent le sol des deux côtés
        if (typeof ursideFxAdd === 'function') {
          for (const side of [-1, 1]) for (let j = 0; j < 4; j++) {
            ursideFxAdd(scene, { x: s.x, y: s.groundY - 4, w: 6, h: 4, color: j % 2 ? C.pale : C.violet, vx: side * (120 + j * 70), vy: -30 - j * 20, gy: 500, ms: 260 });
          }
        }
        if (typeof juiceShake === 'function') juiceShake(scene, hit ? 'light' : 'tiny');
        mythicSfx('ursa_rain_hit', 'eclat_pickup', { volume: 0.8 });
      }
    } else if (mythicStrike(scene, p, new Phaser.Geom.Rectangle(s.x - 12, s.y - 12, 24, 24), `ursa-star-${s.id}`, { event: false })) {
      s.dead = true;
      mythicFlash(scene, s.x, s.y, 20, 120);
      mythicSparks(scene, s.x, s.y, 10, 1);
      if (typeof juiceShake === 'function') juiceShake(scene, 'tiny');
      if (typeof juiceHitStop === 'function') juiceHitStop(scene, 30);
      mythicSfx('ursa_star_hit', 'eclat_pickup', { volume: 0.8 });
    }
  }

  // Les sept ourses de l'ulti.
  S.bears = S.bears.filter((b) => {
    if (now < b.born + b.ms) return true;
    if (b.spr && b.spr.active) b.spr.destroy();
    return false;
  });
  for (const b of S.bears) {
    if (now < b.born) continue;
    if (!b.started) {   // son départ : éclair, gerbe, souffle
      b.started = true;
      mythicFlash(scene, b.x, b.feet - b.h * 0.5, 22, 120);
      mythicSparks(scene, b.x, b.feet - 10, 8, 1);
      mythicSfx('ursa_bear', 'grizzly_whoosh', { volume: 0.7 });
      if (typeof juiceShake === 'function') juiceShake(scene, 'light');
    }
    const k = (now - b.born) / b.ms;
    b.x += b.dir * T.bearSpeed * dt;
    const rect = new Phaser.Geom.Rectangle(b.x - b.w / 2, b.feet - b.h, b.w, b.h);
    if (mythicStrike(scene, p, rect, `ursa-bear-${b.id}`)) {
      mythicFlash(scene, b.x + b.dir * b.w * 0.4, b.feet - b.h * 0.5, 22, 110);
      mythicSfx('ursa_star_hit', 'grizzly_hit', { volume: 0.7 });
      if (typeof juiceHitStop === 'function') juiceHitStop(scene, 30);
    }
    if (b.spr) {
      const f = Math.floor((now - b.born) / 55) % 4;
      b.spr.setVisible(true).setTexture(`${b.key}${f}`).setPosition(b.x, b.y)
        // elle s'efface par à-coups sur la fin (jamais de fondu)
        .setAlpha(k > 0.85 ? 0.35 : k > 0.7 ? 0.6 : 0.92);
    } else {
      g.fillStyle(C.deep, 1);
      g.fillRect(rect.x, rect.y, rect.width, rect.height);
    }
    // son étoile, devant elle, et sa traînée
    mythicDrawStar(g, b.x + b.dir * b.w * 0.5, b.feet - b.h * 0.62, Math.floor(now / 60) % 2 ? 10 : 8, C.pale, C.white);
    if (typeof ursideFxAdd === 'function') {
      ursideFxAdd(scene, { x: b.x - b.dir * b.w * 0.5, y: b.feet - Math.random() * b.h, w: 14 + Math.random() * 18, h: 2,
        color: Math.random() < 0.5 ? C.pale : C.violet, vx: -b.dir * 120, ms: 150, shrink: false });
    }
  }

  // Éclairs d'impact.
  S.flashes = S.flashes.filter((f) => now < f.born + f.ms);
  for (const f of S.flashes) {
    const k = (now - f.born) / f.ms;
    mythicDrawStar(g, f.x, f.y, k < 0.35 ? f.r : k < 0.7 ? f.r * 0.65 : f.r * 0.35, k < 0.7 ? C.white : C.pale, C.white);
  }

  // La constellation, par-dessus l'ourse : elle se trace étoile par étoile à la transformation.
  if (p.mythic) {
    const pts = mythicDipperPoints(p);
    const lit = Math.min(pts.length, Math.floor((now - p.mythic.startedAt) / 70));
    g.lineStyle(2, C.line, 0.85);
    for (const [a, b] of MYTHIC_DIPPER_LINKS) if (a < lit && b < lit) g.lineBetween(pts[a][0], pts[a][1], pts[b][0], pts[b][1]);
    for (let i = 0; i < lit; i++) {
      const tw = Math.sin(now / 170 + i * 1.9) > 0.3;
      mythicDrawStar(g, pts[i][0], pts[i][1], i > 3 ? (tw ? 8 : 6) : (tw ? 6 : 4), C.white, C.white);
    }
    // dernières secondes : elle clignote
    const left = p.mythic.until - now;
    p.setAlpha(left < 3000 && !p.mythic.ending && Math.floor(now / 110) % 2 ? 0.6 : 1);
    p.__mythicBlinked = true;
  } else if (p.__mythicBlinked) {
    p.setAlpha(1);
    p.__mythicBlinked = false;
  }

  mythicDrawHud(scene, p, now, S);
}

// HUD : la touche X, à droite des trois compétences et un peu plus haut qu'elles (une case à part : ce
// n'est pas une compétence), avec son icône, sa pastille « X » et son état ; pendant la transformation,
// une barre violette au-dessus des compétences montre le temps qui reste. (Les icônes des trois
// compétences, elles, sont changées par storyDrawHudArt, StoryKit.)
function mythicDrawHud(scene, p, now, S) {
  const hud = S.hud, T = MYTHIC_URSA, C = MYTHIC_COLORS;
  hud.clear();
  if (typeof HUD_MARGIN === 'undefined' || typeof HUD_SKILL_SIZE === 'undefined') return;
  const GAP = typeof HUD_SKILL_GAP !== 'undefined' ? HUD_SKILL_GAP : 8;
  const skillY = scene.scale.height - HUD_MARGIN - HUD_SKILL_SIZE / 2;
  const cx = HUD_MARGIN + HUD_SKILL_SIZE / 2 + 3 * (HUD_SKILL_SIZE + GAP) + 14, cy = skillY - 12;
  const SIZE = 40;
  if (!S.slot || !S.slot.icon.active) {
    const hasIcon = scene.textures.exists('ursa-icone-x');
    const icon = scene.add.image(0, 0, hasIcon ? 'ursa-icone-x' : '__DEFAULT').setScrollFactor(0).setDepth(1001).setVisible(hasIcon);
    const keyArt = scene.textures.exists('item-ui_touche');
    const badge = keyArt ? scene.add.image(0, 0, 'item-ui_touche').setScrollFactor(0).setDepth(1002) : null;
    if (badge) badge.setScale(18 / Math.max(badge.width, badge.height));
    const letter = scene.add.text(0, 0, 'X', {
      fontFamily: 'sans-serif', fontSize: '11px', fontStyle: 'bold',
      color: keyArt && typeof STORY_UI_KEY_INK !== 'undefined' ? STORY_UI_KEY_INK : '#ffe9f5',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1003);
    S.slot = { icon, badge, letter };
  }
  const { icon, badge, letter } = S.slot;
  const ursids = mythicUrsidCount(p);
  const visible = ursids > 0 || !!p.mythic;
  for (const o of [icon, badge, letter]) if (o) o.setVisible(visible && (o !== icon || scene.textures.exists('ursa-icone-x')));
  if (!visible) return;
  const cooling = !p.mythic && (p.mythicReadyAt || 0) > now;
  const ready = !p.mythic && !cooling;
  // prête : elle bat doucement ; refusée : elle tremble un instant
  const pulse = ready && Math.floor(now / 420) % 2 ? 1.08 : 1;
  const shake = S.denyAt && now - S.denyAt < 220 ? (Math.floor(now / 40) % 2 ? 2 : -2) : 0;
  icon.setPosition(cx + shake, cy).setScale((SIZE / Math.max(icon.width, icon.height)) * pulse).setAlpha(cooling ? 0.45 : 1);
  if (p.mythic) icon.setTint(0xffffff); else icon.clearTint();
  if (badge) badge.setPosition(cx + 13, cy + 13);
  letter.setPosition(cx + 13, cy + 13);
  if (cooling) {
    // attente : un volet sombre qui descend, et le temps qui reste en petite barre
    const k = (p.mythicReadyAt - now) / T.cooldownMs;
    hud.fillStyle(C.night, 0.7).fillRect(cx - SIZE / 2, cy - SIZE / 2, SIZE, Math.round(SIZE * k / 2) * 2);
  }
  if (ready) {
    hud.lineStyle(2, Math.floor(now / 420) % 2 ? C.white : C.violet, 1).strokeRect(cx - SIZE / 2 - 2, cy - SIZE / 2 - 2, SIZE + 4, SIZE + 4);
  }
  if (p.mythic) {
    // le temps qui reste : une barre au-dessus des trois compétences, et le cadre de la touche X allumé
    const k = Math.max(0, (p.mythic.until - now) / T.durationMs);
    const x0 = HUD_MARGIN, w = 3 * HUD_SKILL_SIZE + 2 * GAP, y0 = skillY - HUD_SKILL_SIZE / 2 - 12;
    hud.fillStyle(C.night, 0.9).fillRect(x0 - 2, y0 - 2, w + 4, 8);
    hud.fillStyle(k < 0.1 && Math.floor(now / 110) % 2 ? C.white : C.violet, 1).fillRect(x0, y0, Math.round(w * k / 2) * 2, 4);
    hud.lineStyle(2, C.pale, 1).strokeRect(cx - SIZE / 2 - 2, cy - SIZE / 2 - 2, SIZE + 4, SIZE + 4);
  }
}

if (typeof LEVEL_UPDATE_HOOKS !== 'undefined') LEVEL_UPDATE_HOOKS.push(mythicUpdateHook);
