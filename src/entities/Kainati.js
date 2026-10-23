// Kainati, Roi des Simiens — boss du grand arbre (zone grand_arbre_arene) +
// ses projectiles (pierres lancées, pierres du plafond, ondes de choc) + sa
// forme d'esprit (PNJ du monde spirituel). La logique de zone (verrouillage
// de l'arène, victoire, flags) vit dans src/story/boss_kainati.js
// (ZONE_SCRIPTS.kainati_arene). Combat gagnable en forme humaine, saut simple :
// Kainati n'est vulnérable qu'au sol, sonné après chaque plongeon.
//
// Le boss N'EST PAS un corps Arcade : il suit des trajectoires calculées
// (pendule sur liane, arcs de saut) et ne collisionne avec rien. Ses dégâts
// sont testés à la main (rectangles) dans update(), et c'est le script de
// zone qui lui transmet les coups du joueur (takeHit). Toutes les minuteries
// sont en `delta` cumulé (pas de scene.time) : le combat se fige
// naturellement quand le monde est gelé (dialogue, inventaire...).
// Retours utilisateur (2026-10-23) : il se laisse frapper À TOUT MOMENT (plus
// d'esquive ; sonné = coups doublés), son contact blesse Agarica, il tient sa
// liane d'une main dans une pose FIXE (léger balancement lent, la liane suit),
// pas de mousse dessinée par code (l'art Codex suffit), et une fois battu il
// reste inerte au sol dans sa pose `defeated_lucid` (dernière frame tenue).
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
// Contact qui blesse Agarica : le cœur du corps seulement (plus petit que la
// zone qui encaisse) -- l'arc de la dague porte au-delà du corps d'Agarica,
// elle peut donc le frapper sans le toucher.
const KAINATI_CONTACT_FRACTION = { w: 0.5, h: 0.7 };
// Frappable à tout moment (14 PV) ; sonné après un plongeon, chaque coup
// compte double : ~1 min de combat pour une joueuse correcte.
const KAINATI_MAX_HP = 14;
const KAINATI_STUN_DAMAGE = 2;
// Distance depuis le haut de la liane où il s'agrippe (main = haut du corps).
const KAINATI_GRIP = 90;
// Balancement au repos sur sa liane : lent et régulier (retour utilisateur :
// « il s'excite sur sa branche ») -- ±3°, ~3,8 s par aller-retour.
const KAINATI_SWING_AMPLITUDE = 0.05; // rad
const KAINATI_SWING_PERIOD_DIV = 600; // ms (angle = sin(clock / div))
// Se retourne vers Agarica seulement si elle est nettement de l'autre côté,
// et pas plus d'une fois par KAINATI_TURN_MS (sinon flips en rafale quand
// elle passe sous lui).
const KAINATI_TURN_DEADZONE = 50;
const KAINATI_TURN_MS = 700;
const KAINATI_STONE_GRAVITY = 900;
const KAINATI_STONE_RADIUS = 12;
// Personnages devant les décors (cf. CHARACTER_DEPTH dans LevelKit.js) ; ses
// effets se placent relativement (mousse +1, impacts +2, « ! » et étoiles +3).
const KAINATI_DEPTH = CHARACTER_DEPTH;
// Ombres de télégraphe : au-dessus du sol ET du sous-bois (sinon invisibles).
const KAINATI_SHADOW_DEPTH = 990;

// Durées de base (phase 1) ; la phase 2 les multiplie par KAINATI_PHASE2_SPEED
// (sauf stompStun : la fenêtre de frappe reste aussi généreuse en phase 2).
const KAINATI_TIMINGS = {
  hang: 1000,             // pause sur la liane entre deux actions
  throwTelegraph: 600,    // flash + « ! » avant un lancer
  throwStagger: 220,      // écart entre deux pierres d'une même salve
  swing: 850,             // saut balancé d'une liane à l'autre
  leapTelegraph: 800,     // ombre au sol avant de plonger
  leap: 750,              // trajectoire du plongeon
  // Sonné au sol après land_stomp : fenêtre BONUS (coups doublés, cf.
  // KAINATI_STUN_DAMAGE). 2,2 s : le temps de sauter l'onde de choc, de le
  // rejoindre et de frapper deux fois.
  stompStun: 2200,
  // Coup encaissé alors qu'il est déjà à sa limite (KAINATI_HITS_PER_STUN) :
  // il se relève d'un bond peu après, au lieu de rester sonné.
  stunAfterLastHit: 350,
  recover: 750,           // remonte sur une liane
  rainTelegraph: 850,     // ombres au sol avant la chute des pierres du plafond
  hitInvuln: 350,         // entre deux coups encaissés (évite le spam)
};
const KAINATI_PHASE2_SPEED = 0.75;
// Coups encaissés au plus par plongeon (sonné) avant qu'il ne se relève : le
// combat ne se règle pas en une seule ouverture.
const KAINATI_HITS_PER_STUN = 2;

// Séquences d'actions en boucle (lisibles et prévisibles : on apprend ses
// mouvements). 'rain' = cri qui fait tomber des pierres du plafond. Il plonge
// (et redescend donc à portée) à chaque cycle : ~toutes les 9 s en phase 1,
// deux fois par cycle en phase 2.
const KAINATI_PATTERN_P1 = ['throw', 'swing', 'leap'];
const KAINATI_PATTERN_P2 = ['throw', 'leap', 'rain', 'swing', 'leap'];

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

// Pose suspendue TENUE (art `kainati` swing_vine) : la frame la plus étroite
// de la rangée (corps droit sous la main levée), et son « poing » (centre des
// pixels visibles des 20 rangées du haut) en px du canvas, pour accrocher la
// main au point de prise. Null sans art ou pixels illisibles (placeholder :
// ancrage aux pieds historique).
function kainatiHangPose(scene) {
  if (scene.__kainatiHangPose !== undefined) return scene.__kainatiHangPose;
  let best = null;
  const def = kainatiManifestDef('kainati');
  const a = def && def.anims && def.anims.swing_vine;
  for (let i = 0; a && i < a.frames; i++) {
    const key = manifestFrameKey('kainati', 'swing_vine', i);
    const b = visibleBounds(scene, key);
    if (!b || !b.exact || b.empty) continue;
    if (!best || b.w / b.h < best.b.w / best.b.h) best = { key, b };
  }
  let pose = null;
  if (best) {
    const map = frameAlphaMap(scene.textures.getFrame(best.key));
    let sx = 0;
    let n = 0;
    for (let y = best.b.y0; y < Math.min(map.h, best.b.y0 + 20); y++) {
      for (let x = 0; x < map.w; x++) if (map.alpha[y * map.w + x] > VISIBLE_ALPHA_MIN) { sx += x; n++; }
    }
    pose = { key: best.key, fistX: sx / n, fistY: best.b.y0 + 10, footY: best.b.y1, W: best.b.frameW, H: best.b.frameH };
  }
  scene.__kainatiHangPose = pose;
  return pose;
}

// Dernière frame de `defeated_lucid` (pose de défaite tenue, inerte).
function kainatiDefeatedKey(scene) {
  const def = kainatiManifestDef('kainati');
  const a = def && def.anims && def.anims.defeated_lucid;
  for (let i = a ? a.frames - 1 : -1; i >= 0; i--) {
    const key = manifestFrameKey('kainati', 'defeated_lucid', i);
    if (scene.textures.exists(key)) return key;
  }
  return null;
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
    // (Plus de plaques de mousse dessinées par code sur sa fourrure : retour
    // utilisateur, l'art Codex porte déjà la mousse.)
    this.hangPose = kainatiHangPose(scene);
    this.lastTurnAt = -Infinity;
    this.reset();
  }

  // Conservée pour les scripts qui l'appelaient (mousse dessinée retirée).
  setMossLevel() {}

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
    this.stunHits = 0;
    this.clock = 0;
    this.feet = this.feetOnVine(this.vineIndex, 0);
    this.setState('hang');
    this.sprite.setAlpha(1).setVisible(true).clearTint();
    this.sprite.setAngle(0);
    this.sprite.setScale(this.baseScaleX(), this.baseScaleY());
    this.alertIcon.setVisible(false);
    this.stunStars.setVisible(false);
    this.scene.tweens.killTweensOf(this);
    this.releaseLianes();
    this.applyPosition();
  }

  baseScaleX() { const d = kainatiManifestDef('kainati'); return d ? (d.scale || 1) : 1; }
  baseScaleY() { return this.baseScaleX(); }

  speed() { return this.phase === 2 ? KAINATI_PHASE2_SPEED : 1; }
  dur(name) { return KAINATI_TIMINGS[name] * this.speed(); }

  // Pieds quand il pend à la liane `i` : même distance main -> bas visible que
  // la pose tenue (cf. applyHangPose), sinon h * 0.95 (placeholder).
  feetOnVine(i, angle) {
    const g = kainatiGripPoint(this.vines[i], angle);
    const p = this.hangPose;
    const d = p ? (p.footY - p.fistY) * Math.abs(this.sprite.scaleY) : this.h * 0.95;
    return { x: g.x + Math.sin(angle) * d, y: g.y + Math.cos(angle) * d };
  }

  setState(state, extra = {}) {
    this.state = state;
    this.t = 0;
    Object.assign(this, { from: { ...this.feet } }, extra);
    // Sur la liane (attente, télégraphes, lancer, cri, saut balancé) : AUCUNE
    // anim -- la pose suspendue tenue (cf. applyHangPose) ; l'ancienne
    // alternance swing_vine/throw_stone (poses debout) faisait sauter sa main
    // d'une frame à l'autre. Les télégraphes restent lisibles (flash + « ! »).
    const anim = this.hangPose && this.isVineState(state) ? null : {
      hang: 'swing_vine', swing: 'swing_vine', throwTelegraph: 'throw_stone', throw: 'throw_stone',
      leapTelegraph: 'leap', leap: 'leap', stunned: 'land_stomp', recover: 'leap',
      rainTelegraph: 'throw_stone', roar: 'land_stomp', defeated: 'defeated_lucid', idle: 'idle',
    }[state];
    if (!this.isVineState(state)) this.clearHangPose();
    if (state === 'calm') this.holdDefeatedPose();
    else if (anim && this.sprite.playManifest) this.sprite.playManifest(anim);
    this.alertIcon.setVisible(['throwTelegraph', 'leapTelegraph', 'rainTelegraph', 'roar'].includes(state));
    this.stunStars.setVisible(state === 'stunned');
  }

  applyPosition() {
    if (!this.hangAnchored) this.sprite.setPosition(this.feet.x, this.feet.y);
    this.alertIcon.setPosition(this.feet.x, Math.max(48, this.feet.y - this.h - 6));
    this.stunStars.setPosition(this.feet.x, this.feet.y - this.h - 4);
  }

  isVineState(state = this.state) {
    return ['hang', 'throwTelegraph', 'throw', 'rainTelegraph', 'roar', 'leapTelegraph', 'swing'].includes(state);
  }

  // Pose suspendue tenue, la main sur le point de prise `grip`, le corps
  // incliné de `angle` (comme la liane) : origine du sprite = son poing,
  // rotation autour de lui. `this.feet` (zones de coup, icônes) suit le bas
  // visible du corps. Sans art : ancrage aux pieds historique.
  applyHangPose(grip, angle) {
    const pose = this.hangPose;
    if (!pose) {
      this.feet = { x: grip.x, y: grip.y + this.h * 0.95 };
      return;
    }
    const sp = this.sprite;
    if (sp.anims.isPlaying) sp.anims.stop();
    if (sp.texture.key !== pose.key) sp.setTexture(pose.key);
    const u = sp.flipX ? pose.W - pose.fistX : pose.fistX;
    sp.setOrigin(u / pose.W, pose.fistY / pose.H);
    sp.setRotation(-angle);
    sp.setPosition(grip.x, grip.y);
    this.hangAnchored = true;
    const d = (pose.footY - pose.fistY) * Math.abs(sp.scaleY);
    this.feet = { x: grip.x + Math.sin(angle) * d, y: grip.y + Math.cos(angle) * d };
  }

  clearHangPose() {
    if (!this.hangAnchored) return;
    this.hangAnchored = false;
    this.sprite.setOrigin(0.5, 1).setRotation(0);
  }

  // Battu : dernière frame de `defeated_lucid`, figée (aucune anim, aucun
  // mouvement), posée par son bas visible (origine aux pieds visibles).
  holdDefeatedPose() {
    this.clearHangPose();
    const key = kainatiDefeatedKey(this.scene);
    const sp = this.sprite;
    sp.anims.stop();
    if (key) sp.setTexture(key);
    sp.setAngle(0);
  }

  // Liane (Liane.js) sur laquelle il est suspendu : tenue et dessinée à son
  // angle (au lieu d'osciller de son côté pendant qu'il se balance autrement).
  lianeFor(i) {
    const v = this.vines[i];
    const list = Array.isArray(this.scene.vines) ? this.scene.vines : [];
    return v ? list.find((l) => l && l.alive && Math.abs(l.x - v.x) < 1 && Math.abs(l.y - v.y) < 1) || null : null;
  }

  holdLiane(i, angle) {
    const l = this.lianeFor(i);
    for (const o of Array.isArray(this.scene.vines) ? this.scene.vines : []) {
      if (o && o !== l && o.grabbedBy === this) this.releaseLiane(o);
    }
    if (!l || (l.grabbedBy && l.grabbedBy !== this)) return;
    l.grabbedBy = this;
    l.theta = angle;
    l.drawTheta = angle;
    l.omega = 0;
  }

  releaseLiane(l) {
    l.grabbedBy = null;
    l.omega = 0;
  }

  releaseLianes() {
    for (const o of Array.isArray(this.scene.vines) ? this.scene.vines : []) {
      if (o && o.grabbedBy === this) this.releaseLiane(o);
    }
  }

  // Suspendu à la liane `i` avec l'angle `angle` (pose tenue + liane tenue).
  hangOn(i, angle) {
    this.holdLiane(i, angle);
    this.applyHangPose(kainatiGripPoint(this.vines[i], angle), angle);
  }

  getHitRect(fraction = KAINATI_HITBOX_FRACTION) {
    const w = this.size.w * fraction.w;
    const h = this.h * fraction.h;
    return new Phaser.Geom.Rectangle(this.feet.x - w / 2, this.feet.y - h, w, h);
  }

  // Zone dont le contact blesse Agarica (cf. KAINATI_CONTACT_FRACTION).
  getContactRect() {
    return this.getHitRect(KAINATI_CONTACT_FRACTION);
  }

  isOnVine() {
    return ['hang', 'throwTelegraph', 'throw', 'rainTelegraph', 'roar'].includes(this.state);
  }

  isVulnerable() {
    return this.state === 'stunned' && !this.defeated;
  }

  // Appelée une fois par attaque du joueur (cf. contrat takeHit de LevelKit).
  // Renvoie true si le coup porte : À TOUT MOMENT du combat (retour
  // utilisateur : plus d'esquive), un coup par KAINATI_TIMINGS.hitInvuln
  // (flash blanc). Sonné au sol : coups doublés (fenêtre bonus).
  takeHit() {
    if (!this.active || this.defeated || this.invuln > 0) return false;
    const stunned = this.isVulnerable();
    this.damage(stunned ? KAINATI_STUN_DAMAGE : 1);
    if (stunned) {
      this.stunHits += 1;
      // Limite atteinte : il se relève vite (cf. KAINATI_HITS_PER_STUN).
      if (!this.defeated && this.stunHits >= KAINATI_HITS_PER_STUN) {
        this.stunFor = Math.min(this.stunFor, this.t + KAINATI_TIMINGS.stunAfterLastHit);
      }
    }
    return true;
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
  // Inerte dès cet instant : plus d'IA, d'attaque ni de contact (cf. update),
  // posé au sol (bas visible) dans `defeated_lucid` jouée une fois puis tenue.
  defeat() {
    if (this.defeated) return;
    this.defeated = true;
    this.hazards.clear();
    this.pendingThrows = [];
    this.releaseLianes();
    this.feet = { x: Phaser.Math.Clamp(this.feet.x, this.cfg.minX + 60, this.cfg.maxX - 60), y: this.cfg.floorY };
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
    this.releaseLianes();
    this.feet = { x: x ?? this.feet.x, y: this.cfg.floorY };
    this.sprite.clearTint().setAngle(0).setScale(this.baseScaleX(), this.baseScaleY());
    this.setState('calm');
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
    this.hazards.update(dt, player);
    if (this.pendingThrows && this.pendingThrows.length) {
      for (const p of this.pendingThrows) p.at -= dt;
      for (const p of this.pendingThrows.filter((q) => q.at <= 0)) this.hazards.throwStone(p.sx, p.sy, p.tx, p.flight);
      this.pendingThrows = this.pendingThrows.filter((q) => q.at > 0);
    }
    if (this.calm || this.defeated) {
      // Inerte : ni IA, ni attaque, ni contact, ni balancement. Le sprite fait
      // foi (une cinématique peut le déplacer via scene.npcs.kainati).
      this.feet = { x: this.sprite.x, y: this.sprite.y };
      this.alertIcon.setPosition(this.feet.x, this.feet.y - this.h - 6);
      return;
    }
    this.t += dt;
    // Tourné vers Agarica AVANT de poser la pose suspendue (son origine dépend du miroir).
    if (player && this.state !== 'stunned') this.face(player.x);
    const sway = Math.sin(this.clock / KAINATI_SWING_PERIOD_DIV) * KAINATI_SWING_AMPLITUDE;
    switch (this.state) {
      case 'hang':
        this.hangOn(this.vineIndex, sway);
        if (this.active && this.t >= this.dur('hang')) this.nextAction(player);
        break;
      case 'throwTelegraph':
        this.hangOn(this.vineIndex, sway);
        this.blink(0xffe066);
        if (this.t >= this.dur('throwTelegraph')) {
          this.sprite.clearTint();
          this.throwVolley(player);
          this.setState('throw');
        }
        break;
      case 'throw':
        this.hangOn(this.vineIndex, sway);
        if (this.t >= 400) this.setState('hang');
        break;
      case 'rainTelegraph':
        this.hangOn(this.vineIndex, sway);
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
        const e = Phaser.Math.Easing.Sine.InOut(k);
        const dir = this.vines[this.toVine].x > this.vines[this.vineIndex].x ? 1 : -1;
        if (this.hangPose) {
          // Main qui file d'une prise à l'autre sur un arc qui plonge, corps
          // incliné vers l'arrière (pose tenue, aucune anim) ; les lianes
          // reprennent leur oscillation libre.
          const a = kainatiGripPoint(this.vines[this.vineIndex], 0);
          const b = kainatiGripPoint(this.vines[this.toVine], 0);
          this.releaseLianes();
          this.applyHangPose({ x: Phaser.Math.Linear(a.x, b.x, e), y: Phaser.Math.Linear(a.y, b.y, e) + Math.sin(Math.PI * k) * 70 },
            -dir * Math.sin(Math.PI * k) * 0.3);
        } else {
          const to = this.feetOnVine(this.toVine, 0);
          this.feet = { x: Phaser.Math.Linear(this.from.x, to.x, e), y: Phaser.Math.Linear(this.from.y, to.y, e) + Math.sin(Math.PI * k) * 70 };
          this.sprite.setAngle(dir * Math.sin(Math.PI * k) * 18);
        }
        if (k >= 1) { this.vineIndex = this.toVine; this.sprite.setAngle(0); this.setState('hang'); }
        break;
      }
      case 'leapTelegraph':
        this.hangOn(this.vineIndex, 0);
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
        if (k >= 1) this.landStomp(player);
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
        this.hangOn(this.vineIndex, 0);
        if (this.t < 30) this.scene.cameras.main.shake(700, 0.008);
        if (this.t >= 900) { this.rocksFromCeiling(player, 3); this.setState('hang'); }
        break;
      default:
        break;
    }
    if (this.state !== 'swing' && this.state !== 'stunned' && !this.hangAnchored) this.sprite.setAngle(0);
    this.applyPosition();
    // Contact : blesse Agarica pendant tout le combat (suspendu, en bond, au
    // sol), jamais sonné (fenêtre de frappe) ni battu. Invulnérabilité après
    // un coup gérée par Player.hitByEnemy.
    if (this.active && this.state !== 'stunned' && player && player.body
      && Phaser.Geom.Intersects.RectangleToRectangle(this.getContactRect(), kainatiPlayerRect(player))) {
      player.hitByEnemy();
    }
  }

  landStomp(player) {
    this.feet = { x: this.leapX, y: this.cfg.floorY };
    this.hazards.list.filter((h) => h.kind === 'marker').forEach((h) => { h.dead = true; h.img.destroy(); });
    this.scene.cameras.main.shake(260, 0.012);
    spawnKainatiImpact(this.scene, this.feet.x, this.cfg.floorY);
    this.hazards.shockwaves(this.feet.x);
    if (this.phase === 2) this.rocksFromCeiling(player, 3);
    this.stunHits = 0;
    this.setState('stunned', { stunFor: KAINATI_TIMINGS.stompStun });
  }

  // Vers Agarica, avec zone morte et délai (cf. KAINATI_TURN_DEADZONE) : il ne
  // bascule plus d'un côté à l'autre quand elle passe sous lui.
  face(x) {
    const want = kainatiFlipFor('kainati', x > this.feet.x);
    if (want === this.sprite.flipX) return;
    if (Math.abs(x - this.feet.x) < KAINATI_TURN_DEADZONE || this.clock - this.lastTurnAt < KAINATI_TURN_MS) return;
    this.lastTurnAt = this.clock;
    this.sprite.setFlipX(want);
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
    this.releaseLianes();
    this.alertIcon.destroy();
    this.stunStars.destroy();
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
