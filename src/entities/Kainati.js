// Kainati, Roi des Simiens — boss du grand arbre (zone grand_arbre_arene) +
// ses projectiles (pierres lancées, pierres du plafond, ondes de choc) + sa
// forme d'esprit (PNJ du monde spirituel). La logique de zone (verrouillage
// de l'arène, lianes-tremplins, victoire, flags) vit dans
// src/story/boss_kainati.js (ZONE_SCRIPTS.kainati_arene).
//
// Le boss N'EST PAS un corps Arcade : il suit des trajectoires calculées
// (pendule sur liane, arcs de saut) et ne collisionne avec rien. Ses dégâts
// sont testés à la main (rectangles) dans update(), et c'est le script de
// zone qui lui transmet les coups du joueur (takeHit). Toutes les minuteries
// sont en `delta` cumulé (pas de scene.time) : le combat se fige
// naturellement quand le monde est gelé (dialogue, inventaire...).
//
// ─── API KainatiEsprit (PNJ éthéré, utilisé par l'Acte 1 dans monde_spirituel) ───
//   const esprit = new KainatiEsprit(scene, x, y, { vine?, facing? });
//     x,y = pieds au sol (ignorés si `vine` est donné : il s'y suspend).
//   esprit.hangOn(vine)                 se suspend à une liane {x, y, length}
//                                       (y = point d'attache haut) et s'y balance.
//   esprit.standAt(x, y)                se pose au sol (pieds en x,y), anim idle.
//   esprit.swingTo(target, ms=900) → Promise   saut balancé vers une liane
//                                       {x,y,length} ou un point au sol {x,y}.
//   esprit.waitForPlayer(radius=180) → Promise  résout quand scene.player est proche.
//   esprit.guide(path, {radius, pauseMs}) → Promise  parcourt `path` (lianes/points)
//                                       étape par étape en attendant le joueur
//                                       avant chaque saut (« suis mes mouvements »).
//   esprit.sprite                       le Sprite (pour runCutscene / positions).
//   esprit.destroy()
// Se met à jour tout seul (écoute 'update' de la scène, retiré au destroy /
// shutdown) : rien à appeler à chaque frame.

// Taille écran du corps (≈ 2x Agarica, ~86 px) si le manifest n'a pas (encore)
// d'entrée : sinon on prend la taille `placeholder` du manifest (= taille finale
// en jeu, cf. contrat StoryKit). Sert au placement sur les lianes et aux hitbox.
const KAINATI_DISPLAY = { w: 150, h: 170 };
const KAINATI_HITBOX_FRACTION = { w: 0.7, h: 0.85 };
const KAINATI_MAX_HP = 8;
// Distance depuis le haut de la liane où il s'agrippe (main = haut du corps).
const KAINATI_GRIP = 90;
const KAINATI_SWING_AMPLITUDE = 0.14; // rad, balancement au repos
const KAINATI_STONE_GRAVITY = 900;
const KAINATI_STONE_RADIUS = 12;
const KAINATI_DEPTH = 5;
// Ombres de télégraphe : au-dessus du sol ET du sous-bois (sinon invisibles).
const KAINATI_SHADOW_DEPTH = 990;

// Durées de base (phase 1) ; la phase 2 les multiplie par KAINATI_PHASE2_SPEED.
const KAINATI_TIMINGS = {
  hang: 1000,             // pause sur la liane entre deux actions
  throwTelegraph: 600,    // flash + « ! » avant un lancer
  throwStagger: 220,      // écart entre deux pierres d'une même salve
  swing: 850,             // saut balancé d'une liane à l'autre
  leapTelegraph: 800,     // ombre au sol avant de plonger
  leap: 750,              // trajectoire du plongeon
  stompStun: 1600,        // étourdi après land_stomp (fenêtre de frappe)
  fallStun: 2100,         // étourdi après une chute (déséquilibré par une liane)
  fall: 450,
  recover: 750,           // remonte sur une liane
  alert: 2500,            // après être remonté : insensible aux lianes un moment
  rainTelegraph: 850,     // ombres au sol avant la chute des pierres du plafond
  hitInvuln: 320,
};
const KAINATI_PHASE2_SPEED = 0.75;

// Séquences d'actions en boucle (lisibles et prévisibles : on apprend ses
// mouvements). 'rain' = cri qui fait tomber des pierres du plafond.
const KAINATI_PATTERN_P1 = ['throw', 'swing', 'throw', 'swing', 'leap'];
const KAINATI_PATTERN_P2 = ['throw', 'swing', 'rain', 'throw', 'leap', 'swing'];

// ---------------------------------------------------------------------------
// Helpers visuels (placeholders tant que l'art Codex n'existe pas)
// ---------------------------------------------------------------------------
function kainatiManifestDef(id) {
  return (typeof getAssetManifest === 'function' ? getAssetManifest() : {})[id];
}

function kainatiBodySize(id) {
  const ph = (kainatiManifestDef(id) || {}).placeholder;
  return ph && ph.w && ph.h ? { w: ph.w, h: ph.h } : KAINATI_DISPLAY;
}

// Art « facing: right » (manifest) : flipX quand il regarde à gauche.
function kainatiFlipFor(id, lookRight) {
  const def = kainatiManifestDef(id);
  const artFacesRight = !def || def.facing !== 'left';
  return artFacesRight ? !lookRight : lookRight;
}

// Sprite manifest ; sans entrée au manifest, addManifestSprite donnerait un
// carré générique 40 px : on le remplace par un placeholder à la bonne taille.
function addKainatiSprite(scene, x, y, id, color, label) {
  if (id === 'kainati') patchKainatiThrowAnim(scene);
  const sprite = addManifestSprite(scene, x, y, id, 'idle');
  if (!kainatiManifestDef(id)) {
    const key = ensurePlaceholderTexture(scene, `ph-local-${id}`,
      { w: KAINATI_DISPLAY.w, h: KAINATI_DISPLAY.h, color, label }, 1);
    sprite.setTexture(key).setScale(1);
  }
  return sprite;
}

// Planche Codex actuelle (avertissement d'import) : la rangée throw_stone n'a
// que 3 frames au lieu de 4, et la frame du milieu contient DEUX silhouettes
// collées (prise d'élan + lancer). Tant que la planche n'est pas refaite, on
// ne garde que la 1re (pierre en main) et la dernière (bras tendu) : le geste
// reste lisible. Dès que les 4 frames existent, rien n'est modifié.
function patchKainatiThrowAnim(scene) {
  const def = kainatiManifestDef('kainati');
  const a = def && def.anims && def.anims.throw_stone;
  if (!a || typeof manifestFrameKey !== 'function') return;
  const present = [];
  for (let i = 0; i < a.frames; i++) {
    if (scene.textures.exists(manifestFrameKey('kainati', 'throw_stone', i))) present.push(i);
  }
  if (present.length !== a.frames - 1 || present.length < 3) return;
  const key = 'kainati-throw_stone';
  const wanted = [present[0], present[present.length - 1]];
  const cur = scene.anims.get(key);
  if (cur && cur.frames.length === wanted.length) return;
  if (cur) scene.anims.remove(key);
  scene.anims.create({
    key,
    frames: wanted.map((i) => ({ key: manifestFrameKey('kainati', 'throw_stone', i) })),
    frameRate: Math.max(4, Math.round((a.fps || 10) / 2)),
    repeat: a.repeat ?? 0,
  });
}

function ensureKainatiStoneTexture(scene) {
  const key = 'kainati-pierre-ph';
  if (scene.textures.exists(key)) return key;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  const r = KAINATI_STONE_RADIUS;
  g.fillStyle(0x6d6a70, 1).fillCircle(r + 1, r + 1, r);
  g.fillStyle(0x9c98a0, 1).fillCircle(r - 3, r - 3, r * 0.45);
  g.lineStyle(2, 0x1e1a24, 1).strokeCircle(r + 1, r + 1, r);
  g.generateTexture(key, (r + 1) * 2, (r + 1) * 2);
  g.destroy();
  return key;
}

function addKainatiStoneImage(scene, x, y) {
  const hasItem = typeof getItemManifest === 'function' && getItemManifest().pierre;
  const img = hasItem ? addItemImage(scene, x, y, 'pierre') : scene.add.image(x, y, ensureKainatiStoneTexture(scene));
  return img.setDepth(KAINATI_SHADOW_DEPTH + 1);
}

// Éclats d'impact : vrai vfx du manifest s'il existe, sinon quelques cailloux.
function spawnKainatiImpact(scene, x, y) {
  if (kainatiManifestDef('vfx_impact_pierre') && hasManifestArt(scene, 'vfx_impact_pierre')) {
    const fx = addManifestSprite(scene, x, y, 'vfx_impact_pierre', 'idle', { origin: [0.5, 0.75] });
    fx.setDepth(KAINATI_DEPTH + 2);
    fx.once('animationcomplete', () => fx.destroy());
    scene.time.delayedCall(1200, () => fx.active && fx.destroy());
    return;
  }
  for (let i = 0; i < 5; i++) {
    const bit = scene.add.circle(x, y - 4, Phaser.Math.Between(3, 5), 0x7d7880).setDepth(KAINATI_DEPTH + 2);
    scene.tweens.add({
      targets: bit,
      x: x + Phaser.Math.Between(-36, 36),
      y: y - Phaser.Math.Between(10, 40),
      alpha: 0,
      duration: 380,
      ease: 'Quad.easeOut',
      onComplete: () => bit.destroy(),
    });
  }
}

function kainatiPlayerRect(player) {
  const b = player.body;
  return new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height);
}

// Point d'agrippe sur une liane pour un angle de balancement donné.
function kainatiGripPoint(vine, angle = 0) {
  const d = Math.min(KAINATI_GRIP, (vine.length || 200) - 10);
  return { x: vine.x + Math.sin(angle) * d, y: vine.y + Math.cos(angle) * d };
}

// ---------------------------------------------------------------------------
// Dangers (pierres lancées, pierres du plafond, ondes de choc)
// ---------------------------------------------------------------------------
class KainatiHazards {
  constructor(scene, arena) {
    this.scene = scene;
    this.arena = arena; // { minX, maxX, floorY, ceilingY }
    this.list = [];
  }

  // Pierre en cloche de (sx,sy) vers (tx, sol) en `flight` ms.
  throwStone(sx, sy, tx, flight = 1000) {
    const T = flight / 1000;
    const ty = this.arena.floorY - KAINATI_STONE_RADIUS;
    const vx = (tx - sx) / T;
    const vy = (ty - sy - 0.5 * KAINATI_STONE_GRAVITY * T * T) / T;
    const img = addKainatiStoneImage(this.scene, sx, sy);
    this.list.push({ kind: 'stone', img, vx, vy, g: KAINATI_STONE_GRAVITY, spin: Phaser.Math.Between(-8, 8) });
  }

  // Ombre au sol pendant `telegraph` ms, puis pierre qui tombe du plafond.
  ceilingRock(x, telegraph) {
    const shadow = this.scene.add.ellipse(x, this.arena.floorY - 4, 18, 8, 0x1a0010, 0.3).setDepth(KAINATI_SHADOW_DEPTH);
    this.list.push({ kind: 'shadow', img: shadow, x, t: 0, telegraph });
  }

  shockwaves(x) {
    for (const dir of [-1, 1]) {
      const r = this.scene.add.rectangle(x + dir * 40, this.arena.floorY - 13, 34, 26, 0xc9b27a, 0.85)
        .setStrokeStyle(2, 0x3a2a14).setDepth(KAINATI_SHADOW_DEPTH + 1);
      this.list.push({ kind: 'wave', img: r, vx: dir * 400 });
    }
  }

  update(dt, player) {
    const s = dt / 1000;
    const pRect = player && player.body ? kainatiPlayerRect(player) : null;
    const attack = player && player.getAttackHitbox ? player.getAttackHitbox() : null;
    for (const h of this.list) {
      if (h.dead || h.kind === 'marker') continue; // marqueur de plongeon : géré par le boss
      if (h.kind === 'shadow') {
        h.t += dt;
        const k = Math.min(1, h.t / h.telegraph);
        h.img.setSize(18 + 46 * k, 8 + 10 * k).setAlpha(0.2 + 0.35 * k);
        if (h.t >= h.telegraph) {
          h.dead = true;
          h.img.destroy();
          const img = addKainatiStoneImage(this.scene, h.x, this.arena.ceilingY - 20);
          this.list.push({ kind: 'stone', img, vx: 0, vy: 250, g: 1600, spin: 4 });
        }
        continue;
      }
      h.img.x += h.vx * s;
      if (h.kind === 'stone') {
        h.vy += h.g * s;
        h.img.y += h.vy * s;
        h.img.rotation += h.spin * s;
        const sr = new Phaser.Geom.Circle(h.img.x, h.img.y, KAINATI_STONE_RADIUS);
        if (attack && Phaser.Geom.Intersects.CircleToRectangle(sr, attack)) {
          // Une pierre peut être renvoyée d'un coup : elle éclate.
          this.kill(h);
        } else if (pRect && Phaser.Geom.Intersects.CircleToRectangle(sr, pRect)) {
          player.hitByEnemy();
          this.kill(h);
        } else if (h.img.y >= this.arena.floorY - KAINATI_STONE_RADIUS * 0.5) {
          this.kill(h);
        }
      } else if (h.kind === 'wave') {
        if (pRect && Phaser.Geom.Intersects.RectangleToRectangle(h.img.getBounds(), pRect)) player.hitByEnemy();
        if (h.img.x < this.arena.minX - 40 || h.img.x > this.arena.maxX + 40) { h.dead = true; h.img.destroy(); }
      }
    }
    this.list = this.list.filter((h) => !h.dead);
  }

  kill(h) {
    h.dead = true;
    spawnKainatiImpact(this.scene, h.img.x, Math.min(h.img.y, this.arena.floorY));
    h.img.destroy();
  }

  clear() {
    for (const h of this.list) if (h.img && h.img.active) h.img.destroy();
    this.list = [];
  }
}

// ---------------------------------------------------------------------------
// Boss
// ---------------------------------------------------------------------------
// cfg : { vines: [{x,y,length}], startVine, minX, maxX, floorY, ceilingY }
class KainatiBoss {
  constructor(scene, cfg) {
    this.scene = scene;
    this.cfg = cfg;
    this.vines = cfg.vines;
    this.maxHp = KAINATI_MAX_HP;
    this.hazards = new KainatiHazards(scene, { minX: cfg.minX, maxX: cfg.maxX, floorY: cfg.floorY, ceilingY: cfg.ceilingY });
    this.sprite = addKainatiSprite(scene, 0, 0, 'kainati', 0x8a5a2b, 'KAINATI').setDepth(KAINATI_DEPTH);
    this.size = kainatiBodySize('kainati');
    this.h = this.size.h;
    // Petit indicateur de télégraphe (« ! ») et étoiles d'étourdissement.
    this.alertIcon = scene.add.text(0, 0, '!', {
      fontFamily: 'sans-serif', fontSize: '34px', fontStyle: 'bold', color: '#ffe066', stroke: '#2a1f45', strokeThickness: 6,
    }).setOrigin(0.5, 1).setDepth(KAINATI_DEPTH + 3).setVisible(false);
    this.stunStars = scene.add.text(0, 0, '✦ ✦ ✦', {
      fontFamily: 'sans-serif', fontSize: '18px', color: '#fff2a8', stroke: '#2a1f45', strokeThickness: 4,
    }).setOrigin(0.5, 1).setDepth(KAINATI_DEPTH + 3).setVisible(false);
    // Plaques de mousse sur sa fourrure (corruption) : se retirent à la victoire.
    this.moss = scene.add.graphics().setDepth(KAINATI_DEPTH + 1);
    this.mossLevel = 1;
    this.reset();
  }

  setMossLevel(level, ms = 0) {
    this.scene.tweens.killTweensOf(this);
    if (!ms) { this.mossLevel = level; this.drawMoss(); return; }
    this.scene.tweens.add({ targets: this, mossLevel: level, duration: ms, onUpdate: () => this.drawMoss() });
  }

  drawMoss() {
    const g = this.moss;
    g.clear();
    if (this.mossLevel <= 0.01) return;
    const { x, y } = this.feet;
    const H = this.h;
    const a = Phaser.Math.Clamp(this.mossLevel, 0, 1);
    const blobs = [[-34, 0.72, 16], [26, 0.6, 20], [-8, 0.42, 14], [40, 0.3, 11], [-44, 0.25, 12], [8, 0.85, 12]];
    for (const [dx, fy, r] of blobs) {
      g.fillStyle(0x4f7a2a, 0.85 * a).fillCircle(x + dx, y - H * fy, r * (0.6 + 0.4 * a));
      g.fillStyle(0x8fb04a, 0.7 * a).fillCircle(x + dx + 3, y - H * fy - 3, r * 0.45 * (0.6 + 0.4 * a));
    }
  }

  // Remet le boss à l'état de début de combat (aussi après la mort du joueur).
  reset() {
    this.hazards.clear();
    this.hp = this.maxHp;
    this.phase = 1;
    this.defeated = false;
    this.calm = false;
    this.active = false;     // le combat a commencé (sinon il attend sur sa liane)
    this.vineIndex = this.cfg.startVine ?? Math.floor(this.vines.length / 2);
    this.patternIndex = 0;
    this.pendingThrows = [];
    this.pendingPhase2 = false;
    this.invuln = 0;
    this.alertT = 0;
    this.clock = 0;
    this.feet = this.feetOnVine(this.vineIndex, 0);
    this.setState('hang');
    this.sprite.setAlpha(1).setVisible(true).clearTint();
    this.sprite.setAngle(0);
    this.sprite.setScale(this.baseScaleX(), this.baseScaleY());
    this.alertIcon.setVisible(false);
    this.stunStars.setVisible(false);
    this.scene.tweens.killTweensOf(this);
    this.mossLevel = 1;
    this.applyPosition();
  }

  baseScaleX() { const d = kainatiManifestDef('kainati'); return d ? (d.scale || 1) : 1; }
  baseScaleY() { return this.baseScaleX(); }

  speed() { return this.phase === 2 ? KAINATI_PHASE2_SPEED : 1; }
  dur(name) { return KAINATI_TIMINGS[name] * this.speed(); }

  feetOnVine(i, angle) {
    const g = kainatiGripPoint(this.vines[i], angle);
    return { x: g.x, y: g.y + this.h * 0.95 };
  }

  setState(state, extra = {}) {
    this.state = state;
    this.t = 0;
    Object.assign(this, { from: { ...this.feet } }, extra);
    const anim = {
      hang: 'swing_vine', swing: 'swing_vine', throwTelegraph: 'throw_stone', throw: 'throw_stone',
      leapTelegraph: 'leap', leap: 'leap', fall: 'hit', stunned: 'land_stomp', recover: 'leap',
      rainTelegraph: 'throw_stone', roar: 'land_stomp', defeated: 'defeated_lucid', calm: 'idle', idle: 'idle',
    }[state];
    if (anim && this.sprite.playManifest) this.sprite.playManifest(anim);
    this.alertIcon.setVisible(['throwTelegraph', 'leapTelegraph', 'rainTelegraph', 'roar'].includes(state));
    this.stunStars.setVisible(state === 'stunned');
  }

  applyPosition() {
    this.sprite.setPosition(this.feet.x, this.feet.y);
    this.alertIcon.setPosition(this.feet.x, Math.max(48, this.feet.y - this.h - 6));
    this.stunStars.setPosition(this.feet.x, this.feet.y - this.h - 4);
    this.drawMoss();
  }

  getHitRect() {
    const w = this.size.w * KAINATI_HITBOX_FRACTION.w;
    const h = this.h * KAINATI_HITBOX_FRACTION.h;
    return new Phaser.Geom.Rectangle(this.feet.x - w / 2, this.feet.y - h, w, h);
  }

  isOnVine() {
    return ['hang', 'throwTelegraph', 'throw', 'rainTelegraph'].includes(this.state);
  }

  isVulnerable() {
    return this.state === 'stunned' && !this.defeated;
  }

  // Une liane-tremplin utilisée près de lui le déséquilibre (cf. boss_kainati.js).
  // Renvoie true s'il tombe.
  destabilize() {
    if (!this.active || this.defeated || !this.isOnVine() || this.alertT > 0) return false;
    this.hazards.list.filter((h) => h.kind === 'shadow').forEach((h) => { h.dead = true; h.img.destroy(); });
    this.damage(1);
    if (this.defeated) return true;
    this.setState('fall', { fallTo: Phaser.Math.Clamp(this.feet.x, this.cfg.minX + 90, this.cfg.maxX - 90) });
    return true;
  }

  // Appelée une fois par attaque du joueur (cf. contrat takeHit de LevelKit).
  takeHit() {
    if (!this.active || this.defeated || this.invuln > 0) return false;
    if (this.isVulnerable()) {
      this.damage(1);
      return true;
    }
    if (this.isOnVine()) return this.destabilize();
    // En plein saut : il esquive — petit éclat pour montrer que ça ne passe pas.
    this.sprite.setTintFill(0x9fd4ff);
    this.scene.time.delayedCall(80, () => this.sprite.active && !this.defeated && this.sprite.clearTint());
    return false;
  }

  damage(n) {
    this.hp = Math.max(0, this.hp - n);
    this.invuln = KAINATI_TIMINGS.hitInvuln;
    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(110, () => {
      if (this.sprite.active) this.sprite.clearTint();
      if (this.sprite.active && this.phase === 2 && !this.defeated) this.sprite.setTint(0xe0a0a0);
    });
    if (this.hp <= 0) {
      this.defeat();
    } else if (this.phase === 1 && this.hp <= this.maxHp / 2) {
      // Passage en phase 2 au prochain retour sur liane (cf. 'recover').
      this.pendingPhase2 = true;
    }
  }

  // Ne meurt pas : redevient lucide (le script de zone enchaîne la cinématique).
  defeat() {
    if (this.defeated) return;
    this.defeated = true;
    this.hazards.clear();
    this.pendingThrows = [];
    this.feet = { x: this.feet.x, y: this.cfg.floorY };
    this.setState('defeated');
    this.sprite.clearTint().setAngle(0);
    this.applyPosition();
  }

  // PNJ calme (combat déjà gagné / fin de cinématique).
  makeCalm(x) {
    this.defeated = true;
    this.calm = true;
    this.active = false;
    this.hazards.clear();
    this.pendingThrows = [];
    this.feet = { x: x ?? this.feet.x, y: this.cfg.floorY };
    this.setState('calm');
    this.sprite.clearTint().setAngle(0).setScale(this.baseScaleX(), this.baseScaleY());
    this.applyPosition();
  }

  start() {
    this.active = true;
    this.setState('hang');
    this.t = 0;
  }

  nextAction(player) {
    const pattern = this.phase === 2 ? KAINATI_PATTERN_P2 : KAINATI_PATTERN_P1;
    const action = pattern[this.patternIndex % pattern.length];
    this.patternIndex += 1;
    if (action === 'throw') this.setState('throwTelegraph');
    else if (action === 'rain') this.setState('rainTelegraph');
    else if (action === 'swing') this.setState('swing', { toVine: this.pickVine(player, false) });
    else if (action === 'leap') {
      const tx = Phaser.Math.Clamp(player.x, this.cfg.minX + 90, this.cfg.maxX - 90);
      this.setState('leapTelegraph', { leapX: tx });
      this.hazards.list.push({
        kind: 'marker',
        dead: false,
        img: this.scene.add.ellipse(tx, this.cfg.floorY - 4, 40, 10, 0x3a0010, 0.3).setStrokeStyle(2, 0xff5a5a, 0.8).setDepth(KAINATI_SHADOW_DEPTH),
      });
    }
  }

  // Liane suivante : jamais la même ; en remontant, la plus éloignée du joueur.
  pickVine(player, farFromPlayer) {
    const others = this.vines.map((v, i) => i).filter((i) => i !== this.vineIndex);
    if (farFromPlayer) {
      others.sort((a, b) => Math.abs(this.vines[b].x - player.x) - Math.abs(this.vines[a].x - player.x));
      return others[0];
    }
    // Saute vers une liane voisine (1 ou 2 crans) : déplacement lisible.
    const near = others.filter((i) => Math.abs(i - this.vineIndex) <= 2);
    return Phaser.Utils.Array.GetRandom(near.length ? near : others);
  }

  throwVolley(player) {
    const n = this.phase === 2 ? 3 : 2;
    const hand = { x: this.feet.x, y: this.feet.y - this.h * 0.8 };
    for (let i = 0; i < n; i++) {
      // 1re pierre sur Agarica, les suivantes devant/derrière elle.
      const offset = i === 0 ? 0 : (i % 2 ? 1 : -1) * 110 * Math.ceil(i / 2) * (player.x >= hand.x ? 1 : -1);
      const tx = Phaser.Math.Clamp(player.x + offset, this.cfg.minX + 20, this.cfg.maxX - 20);
      const delay = i * KAINATI_TIMINGS.throwStagger;
      this.pendingThrows = this.pendingThrows || [];
      this.pendingThrows.push({ at: delay, sx: hand.x, sy: hand.y, tx, flight: 950 + i * 80 });
    }
  }

  rocksFromCeiling(player, count) {
    const xs = [Phaser.Math.Clamp(player.x, this.cfg.minX + 30, this.cfg.maxX - 30)];
    while (xs.length < count) {
      const x = Phaser.Math.Between(this.cfg.minX + 40, this.cfg.maxX - 40);
      if (xs.every((o) => Math.abs(o - x) > 110)) xs.push(x);
    }
    xs.forEach((x, i) => this.hazards.ceilingRock(x, KAINATI_TIMINGS.rainTelegraph + i * 120));
  }

  update(dt, player) {
    this.clock += dt;
    if (this.invuln > 0) this.invuln -= dt;
    if (this.alertT > 0) this.alertT -= dt;
    this.hazards.update(dt, player);
    if (this.pendingThrows && this.pendingThrows.length) {
      for (const p of this.pendingThrows) p.at -= dt;
      for (const p of this.pendingThrows.filter((q) => q.at <= 0)) this.hazards.throwStone(p.sx, p.sy, p.tx, p.flight);
      this.pendingThrows = this.pendingThrows.filter((q) => q.at > 0);
    }
    if (this.calm || this.defeated) {
      // Hors combat, le sprite fait foi (les cinématiques peuvent le déplacer
      // via scene.npcs.kainati) : on ne fait que suivre sa position.
      this.feet = { x: this.sprite.x, y: this.sprite.y };
      this.alertIcon.setPosition(this.feet.x, this.feet.y - this.h - 6);
      this.drawMoss();
      return;
    }
    this.t += dt;
    const sway = Math.sin(this.clock / 420) * KAINATI_SWING_AMPLITUDE;
    switch (this.state) {
      case 'hang':
        this.feet = this.feetOnVine(this.vineIndex, sway);
        if (this.active && this.t >= this.dur('hang')) this.nextAction(player);
        break;
      case 'throwTelegraph':
        this.feet = this.feetOnVine(this.vineIndex, sway * 0.3);
        this.blink(0xffe066);
        if (this.t >= this.dur('throwTelegraph')) {
          this.sprite.clearTint();
          this.throwVolley(player);
          this.setState('throw');
        }
        break;
      case 'throw':
        this.feet = this.feetOnVine(this.vineIndex, sway);
        if (this.t >= 400) this.setState('hang');
        break;
      case 'rainTelegraph':
        this.feet = this.feetOnVine(this.vineIndex, sway * 0.3);
        this.blink(0xff9a5a);
        if (this.t >= this.dur('throwTelegraph')) {
          this.sprite.clearTint();
          this.scene.cameras.main.shake(250, 0.006);
          this.rocksFromCeiling(player, 4);
          this.setState('hang');
        }
        break;
      case 'swing': {
        const k = Math.min(1, this.t / this.dur('swing'));
        const to = this.feetOnVine(this.toVine, 0);
        const e = Phaser.Math.Easing.Sine.InOut(k);
        // Arc qui plonge vers le bas (balancement) avant de remonter.
        this.feet = { x: Phaser.Math.Linear(this.from.x, to.x, e), y: Phaser.Math.Linear(this.from.y, to.y, e) + Math.sin(Math.PI * k) * 70 };
        this.sprite.setAngle((to.x > this.from.x ? 1 : -1) * Math.sin(Math.PI * k) * 18);
        if (k >= 1) { this.vineIndex = this.toVine; this.sprite.setAngle(0); this.setState('hang'); }
        break;
      }
      case 'leapTelegraph':
        this.feet = this.feetOnVine(this.vineIndex, 0);
        this.blink(0xff5a5a);
        this.growMarker(this.t / this.dur('leapTelegraph'));
        if (this.t >= this.dur('leapTelegraph')) { this.sprite.clearTint(); this.setState('leap', { leapX: this.leapX }); }
        break;
      case 'leap': {
        const k = Math.min(1, this.t / this.dur('leap'));
        this.feet = {
          x: Phaser.Math.Linear(this.from.x, this.leapX, k),
          y: Phaser.Math.Linear(this.from.y, this.cfg.floorY, k * k) - Math.sin(Math.PI * k) * 120,
        };
        this.growMarker(1);
        // Contact dangereux pendant la descente.
        if (k > 0.55 && player.body && Phaser.Geom.Intersects.RectangleToRectangle(this.getHitRect(), kainatiPlayerRect(player))) player.hitByEnemy();
        if (k >= 1) this.landStomp(player);
        break;
      }
      case 'fall': {
        const k = Math.min(1, this.t / KAINATI_TIMINGS.fall);
        this.feet = { x: Phaser.Math.Linear(this.from.x, this.fallTo, k), y: Phaser.Math.Linear(this.from.y, this.cfg.floorY, k * k) };
        this.sprite.setAngle(k * 25);
        if (k >= 1) {
          this.sprite.setAngle(0);
          this.scene.cameras.main.shake(180, 0.006);
          spawnKainatiImpact(this.scene, this.feet.x, this.cfg.floorY);
          this.setState('stunned', { stunFor: KAINATI_TIMINGS.fallStun });
        }
        break;
      }
      case 'stunned': {
        this.feet = { x: this.feet.x, y: this.cfg.floorY };
        this.stunStars.setText(Math.floor(this.clock / 200) % 2 ? '✦ ✧ ✦' : '✧ ✦ ✧');
        // Légère oscillation : il titube.
        this.sprite.setAngle(Math.sin(this.clock / 120) * 4);
        if (this.t >= this.stunFor) {
          this.sprite.setAngle(0);
          this.setState('recover', { toVine: this.pickVine(player, true) });
        }
        break;
      }
      case 'recover': {
        const k = Math.min(1, this.t / this.dur('recover'));
        const to = this.feetOnVine(this.toVine, 0);
        this.feet = { x: Phaser.Math.Linear(this.from.x, to.x, k), y: Phaser.Math.Linear(this.from.y, to.y, Math.sqrt(k)) - Math.sin(Math.PI * k) * 60 };
        if (k >= 1) {
          this.vineIndex = this.toVine;
          this.alertT = KAINATI_TIMINGS.alert;
          if (this.pendingPhase2) {
            this.pendingPhase2 = false;
            this.phase = 2;
            this.patternIndex = 0;
            this.sprite.setTint(0xe0a0a0);
            this.setState('roar');
          } else {
            this.setState('hang');
          }
        }
        break;
      }
      case 'roar':
        // Entrée en phase 2 : cri + secousse, puis pluie de pierres.
        this.feet = this.feetOnVine(this.vineIndex, 0);
        if (this.t < 30) this.scene.cameras.main.shake(700, 0.008);
        if (this.t >= 900) { this.rocksFromCeiling(player, 3); this.setState('hang'); }
        break;
      default:
        break;
    }
    if (this.state !== 'swing' && this.state !== 'fall' && this.state !== 'stunned') this.sprite.setAngle(0);
    if (player && this.state !== 'stunned') this.face(player.x);
    this.applyPosition();
  }

  landStomp(player) {
    this.feet = { x: this.leapX, y: this.cfg.floorY };
    this.hazards.list.filter((h) => h.kind === 'marker').forEach((h) => { h.dead = true; h.img.destroy(); });
    this.scene.cameras.main.shake(260, 0.012);
    spawnKainatiImpact(this.scene, this.feet.x, this.cfg.floorY);
    this.hazards.shockwaves(this.feet.x);
    if (this.phase === 2) this.rocksFromCeiling(player, 3);
    this.setState('stunned', { stunFor: KAINATI_TIMINGS.stompStun });
  }

  face(x) {
    this.sprite.setFlipX(kainatiFlipFor('kainati', x > this.feet.x));
  }

  growMarker(k) {
    for (const h of this.hazards.list) {
      if (h.kind !== 'marker' || h.dead) continue;
      const kk = Math.min(1, k);
      h.img.setSize(40 + 100 * kk, 10 + 14 * kk).setAlpha(0.45 + 0.5 * kk);
    }
  }

  blink(color) {
    if (Math.floor(this.t / 90) % 2) this.sprite.setTintFill(color);
    else this.sprite.clearTint();
  }

  destroy() {
    this.hazards.clear();
    this.alertIcon.destroy();
    this.stunStars.destroy();
    this.moss.destroy();
    this.sprite.destroy();
  }
}

// ---------------------------------------------------------------------------
// Esprit de Kainati (monde spirituel) — cf. API en tête de fichier
// ---------------------------------------------------------------------------
class KainatiEsprit {
  constructor(scene, x, y, { vine = null, facing = 'left' } = {}) {
    this.scene = scene;
    this.sprite = addKainatiSprite(scene, x, y, 'kainati_esprit', 0x9fe3ff, 'ESPRIT');
    this.size = kainatiBodySize('kainati_esprit');
    this.h = this.size.h;
    this.sprite.setDepth(KAINATI_DEPTH).setAlpha(0.75).setFlipX(kainatiFlipFor('kainati_esprit', facing === 'right'));
    this.sprite.setBlendMode(Phaser.BlendModes.SCREEN);
    this.glow = scene.add.ellipse(x, y - this.h / 2, this.size.w * 1.4, this.h * 1.2, 0x9fe3ff, 0.12)
      .setDepth(KAINATI_DEPTH - 1);
    this.vine = null;
    this.clock = Math.random() * 1000;
    this.busy = false;
    this.feet = { x, y };
    if (vine) this.hangOn(vine);
    else this.standAt(x, y);
    this.onUpdate = (time, delta) => this.update(delta);
    scene.events.on('update', this.onUpdate);
    scene.events.once('shutdown', () => this.destroy());
  }

  hangOn(vine) {
    this.vine = vine;
    this.sprite.playManifest && this.sprite.playManifest('swing');
    return this;
  }

  standAt(x, y) {
    this.vine = null;
    this.feet = { x, y };
    this.sprite.playManifest && this.sprite.playManifest('idle');
    return this;
  }

  feetFor(target, angle = 0) {
    if (target.length != null) {
      const g = kainatiGripPoint(target, angle);
      return { x: g.x, y: g.y + this.h * 0.95 };
    }
    return { x: target.x, y: target.y };
  }

  swingTo(target, ms = 900) {
    return new Promise((resolve) => {
      if (!this.sprite.active) { resolve(); return; }
      this.busy = true;
      const from = { ...this.feet };
      const to = this.feetFor(target);
      this.sprite.setFlipX(kainatiFlipFor('kainati_esprit', to.x > from.x));
      this.sprite.playManifest && this.sprite.playManifest('swing');
      const prog = { k: 0 };
      this.scene.tweens.add({
        targets: prog,
        k: 1,
        duration: ms,
        ease: 'Sine.InOut',
        onUpdate: () => {
          this.feet = {
            x: Phaser.Math.Linear(from.x, to.x, prog.k),
            y: Phaser.Math.Linear(from.y, to.y, prog.k) + Math.sin(Math.PI * prog.k) * 60,
          };
        },
        onComplete: () => {
          this.busy = false;
          if (target.length != null) this.hangOn(target); else this.standAt(to.x, to.y);
          resolve();
        },
      });
    });
  }

  waitForPlayer(radius = 180) {
    return new Promise((resolve) => {
      const check = () => {
        const p = this.scene.player;
        if (!this.sprite.active) { this.scene.events.off('update', check); resolve(); return; }
        if (p && Phaser.Math.Distance.Between(p.x, p.y, this.feet.x, this.feet.y) <= radius) {
          this.scene.events.off('update', check);
          resolve();
        }
      };
      this.scene.events.on('update', check);
    });
  }

  async guide(path, { radius = 200, pauseMs = 250 } = {}) {
    for (const step of path) {
      await this.waitForPlayer(radius);
      if (!this.sprite.active) return;
      if (pauseMs) await new Promise((r) => this.scene.time.delayedCall(pauseMs, r));
      await this.swingTo(step);
    }
  }

  update(delta) {
    if (!this.sprite.active) return;
    this.clock += delta;
    if (!this.busy && this.vine) this.feet = this.feetFor(this.vine, Math.sin(this.clock / 480) * KAINATI_SWING_AMPLITUDE * 1.4);
    // Flottement éthéré au sol.
    const bob = !this.busy && !this.vine ? Math.sin(this.clock / 600) * 4 : 0;
    this.sprite.setPosition(this.feet.x, this.feet.y + bob);
    this.sprite.setAlpha(0.65 + Math.sin(this.clock / 350) * 0.1);
    this.glow.setPosition(this.feet.x, this.feet.y + bob - this.h / 2);
  }

  destroy() {
    if (this.onUpdate) this.scene.events.off('update', this.onUpdate);
    this.onUpdate = null;
    if (this.glow && this.glow.active) this.glow.destroy();
    if (this.sprite && this.sprite.active) this.sprite.destroy();
  }
}
