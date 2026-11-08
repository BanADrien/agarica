// Crapauds corrompus (soignables) — agent Ennemis.
//
// Retour utilisateur (2026-11-08) : « les crapauds ne font rien d'autre que
// tirer la langue tout droit, sans pouvoir tourner la tête ». Deux types,
// deux apparences, une base commune :
//   - `crapaud_sauteur` (ce fichier) : se tourne vers Agarica, fait de grands
//     sauts (se rapproche, recule ou lui saute dessus) et lui tire la langue
//     dans sa direction, en diagonale vers le haut comprise ;
//   - `crapaud_piege` (CrapaudPiege.js) : caché sous la mousse, se révèle quand
//     Agarica passe à portée, frappe, puis se recache.
// L'ancien type `crapaud_corrompu` (fixe, langue droite) devient un ALIAS
// explicite du sauteur : ses trois placements de la démo gagnent les sauts et
// la visée sans toucher aux fichiers de zone.
//
// Les deux sont CORROMPUS (soignables par la compétence papillon) : dans la
// démo, toute la faune hostile de ces forêts l'est par la mousse de Ghil't, et
// le soin reste la voie « druide » pour passer sans tuer. La corruption
// explique aussi le piège : un crapaud sain ne guette pas sous la mousse.
//
// CORPS ET LANGUE SÉPARÉS. L'art d'origine (crapaud_frames,
// crapaud_corrompu_frames) est un canevas de 1434x237 px aligné à GAUCHE, la
// langue dessinée à l'horizontale DANS l'image : ni demi-tour propre (l'origine
// n'est pas au centre du crapaud), ni visée en diagonale. Sans nouveau
// fichier, on découpe deux cadres nommés dans les textures déjà chargées :
//   `corps`  : les 300 px de gauche (le crapaud seul, toutes poses sans langue) ;
//   `langue` : la langue de l'apogée seule (frame 4), de la bouche à la boule.
// Le corps est un sprite ordinaire, origine au centre des pattes (flipX = demi-
// tour sur place). La langue est une image à part, ancrée à la bouche, tournée
// vers la cible et « sortie » en faisant glisser son rognage : on montre la
// fin de la bande (boule comprise) depuis la bouche, comme une vraie langue qui
// se déroule, sans étirer la boule. Sa zone de dégâts est le SEGMENT bouche ->
// bout (+ la boule) testé contre le corps d'Agarica : un corps Arcade
// (rectangle aligné) ne peut pas suivre une diagonale.
//
// Art du prompt Codex n°12 (`crapaud_sauteur`, `crapaud_piege`,
// `crapaud_langue` dans asset_manifest.js) : utilisé dès qu'il existe (cf.
// crapaudBuildLook) ; d'ici là, repli sur ces découpes de l'art existant.

const CRAPAUD_CORPS_FRAME = 'corps';
const CRAPAUD_LANGUE_FRAME = 'langue';
// Découpe des planches d'origine (px du canevas 1434x237). 300 px couvrent
// toutes les poses sans langue (bord droit visible mesuré : 292 px au plus,
// gorge gonflée) ; centre des pattes ~138 (boîtes visibles 4-259 corrompu,
// 6-280 sain) ; bas visible des pattes 231-233.
const CRAPAUD_PLANCHE_H = 237;
const CRAPAUD_CORPS_W = 300;
const CRAPAUD_CORPS_CX = 138;
const CRAPAUD_PIEDS_Y = 232;
// Poses tirées de chaque planche d'origine. `langue` = rectangle de la langue
// seule dans la frame de l'apogée (colonnes où ne reste QUE la langue, rangées
// de la boule et des gouttes), `axis` = rangée de l'axe de la tige ; `mouth`
// = point de la bouche dans le cadre `corps` de la pose `open`, d'où part la
// langue (un peu DANS la bouche : la langue est dessinée derrière le corps).
const CRAPAUD_PLANCHES = {
  corrompu: {
    test: 'crapaud_corrompu-attack-4',
    // idle 0/3 neutres, 2 = clin d'œil ; 1 (gorge gonflée) réservée au
    // télégraphe de la langue pour qu'il se lise.
    idle: ['crapaud_corrompu-idle-0', 'crapaud_corrompu-idle-3', 'crapaud_corrompu-idle-0', 'crapaud_corrompu-idle-2'],
    puff: 'crapaud_corrompu-idle-1',
    open: 'crapaud_corrompu-attack-1',
    shut: 'crapaud_corrompu-idle-2',
    air: 'crapaud_corrompu-idle-3',
    tongueKey: 'crapaud_corrompu-attack-4',
    langue: { x0: 255, x1: 1434, y0: 66, y1: 174, axis: 119.5 },
    mouth: [238, 119],
  },
  sain: {
    test: 'crapaud-4',
    idle: ['crapaud-0'],
    puff: 'crapaud-0',
    open: 'crapaud-1',
    shut: 'crapaud-0',
    air: 'crapaud-0',
    tongueKey: 'crapaud-4',
    langue: { x0: 276, x1: 1434, y0: 58, y1: 138, axis: 99 },
    mouth: [256, 99],
  },
};

// Langue : sortie rapide, courte tenue, retour plus lent (lisible). Seules la
// sortie et la tenue blessent : une langue qui revient ne doit pas punir.
const CRAPAUD_TONGUE_OUT_MS = 140;
const CRAPAUD_TONGUE_HOLD_MS = 110;
const CRAPAUD_TONGUE_BACK_MS = 200;
// Épaisseur de la zone de dégâts autour de la tige et rayon de la boule
// (px monde, mesurés sur l'art à l'échelle ~0,25 : tige ~6 px, boule ~20 px).
const CRAPAUD_TONGUE_PAD = 5;
const CRAPAUD_TONGUE_TIP_R = 9;
// Visée (angles « locaux », 0 = droit devant, négatif = vers le haut) : la
// langue monte jusqu'à 75° (Agarica sur une plateforme, sur une liane), mais
// ne descend que de 25° (le crapaud ne se penche pas).
const CRAPAUD_AIM_UP = Phaser.Math.DegToRad(-75);
const CRAPAUD_AIM_DOWN = Phaser.Math.DegToRad(25);
// Couleur des repères du télégraphe (lueur de la bouche, points de visée).
const CRAPAUD_TELEGRAPH_TINT = 0xd8ff9a;
const CRAPAUD_AIM_DOTS = 3;

// Cadres `corps` / `langue` ajoutés une fois aux textures de la planche (le
// gestionnaire de textures est commun à toutes les scènes).
function ensureCrapaudPlancheFrames(scene, planche) {
  const keys = new Set([...planche.idle, planche.puff, planche.open, planche.shut, planche.air, 'crapaud-0']);
  for (const key of keys) {
    if (!scene.textures.exists(key)) continue;
    const tex = scene.textures.get(key);
    if (!tex.has(CRAPAUD_CORPS_FRAME)) tex.add(CRAPAUD_CORPS_FRAME, 0, 0, 0, CRAPAUD_CORPS_W, CRAPAUD_PLANCHE_H);
  }
  const lg = planche.langue;
  if (scene.textures.exists(planche.tongueKey)) {
    const tex = scene.textures.get(planche.tongueKey);
    if (!tex.has(CRAPAUD_LANGUE_FRAME)) tex.add(CRAPAUD_LANGUE_FRAME, 0, lg.x0, lg.y0, lg.x1 - lg.x0, lg.y1 - lg.y0);
  }
}

// Bande de langue de la planche corrompue (repli de l'art n°12 sans
// `crapaud_langue`, ou base du repli complet).
function crapaudPlancheTongue(planche) {
  const lg = planche.langue;
  return {
    key: planche.tongueKey,
    frame: CRAPAUD_LANGUE_FRAME,
    len: lg.x1 - lg.x0,
    originY: (lg.axis - lg.y0) / (lg.y1 - lg.y0),
    scale: 1,
  };
}

// Apparence d'un crapaud : poses du corps ({key, frame}), géométrie du cadre
// (origine, pattes, bouche, en px du cadre) et bande de langue. Trois cas :
//   1. art n°12 de `artId` (feuille centrée bas, cf. PROMPT_CODEX_12.md) ;
//   2. découpes de la planche `crapaud_corrompu` (cas actuel) ;
//   3. planche du crapaud sain, teintée vert toxique (`tinted`), si même
//      l'art corrompu manque.
function crapaudBuildLook(scene, artId) {
  const def = artId ? getAssetManifest()[artId] : null;
  if (def && enemyHasManifestArt(scene, artId)) {
    const f = (anim, i) => {
      const key = manifestFrameKey(artId, anim, i);
      return scene.textures.exists(key) ? { key } : null;
    };
    const idleFrames = manifestAnimFrames(scene, artId, 'idle');
    const first = idleFrames[0] || { key: manifestInitialTexture(scene, artId) };
    const pick = (...cands) => cands.find(Boolean) || first;
    const src = scene.textures.get(first.key).getSourceImage();
    const frameW = src.width;
    const frameH = src.height;
    const feet = frameH - (typeof manifestFootMargin === 'function' ? manifestFootMargin(scene, artId) : 0);
    // Bouche : déclarée dans le manifeste en px depuis le bas-centre du cadre
    // (mesurée à l'import, cf. PROMPT_CODEX_12.md), sinon estimée.
    const mouth = def.mouth || [frameW * 0.3, -frameH * 0.45];
    const anims = Object.keys(def.anims || {});
    const tongueArt = scene.textures.exists('item-crapaud_langue');
    const corrompu = CRAPAUD_PLANCHES.corrompu;
    if (!tongueArt) ensureCrapaudPlancheFrames(scene, corrompu);
    const langDef = getItemManifest().crapaud_langue || {};
    return {
      n12: true,
      id: artId,
      idle: idleFrames.length ? idleFrames : [first],
      puff: pick(f('tongue', 0)),
      open: pick(f('tongue', 1), f('tongue', 0)),
      shut: pick(f('hidden', 0)),
      rise: pick(f('jump', 1), f('jump', 2)),
      air: pick(f('jump', 2), f('jump', 1)),
      crouch: pick(f('jump', 0)),
      land: pick(f('jump', 3)),
      hiddenFrames: anims.includes('hidden') ? manifestAnimFrames(scene, artId, 'hidden') : [],
      revealFrames: anims.includes('reveal') ? manifestAnimFrames(scene, artId, 'reveal') : [],
      frameW,
      frameH,
      ox: frameW / 2,
      feet,
      mouth: [frameW / 2 + mouth[0], frameH + mouth[1]],
      scale: def.scale || 0.25,
      // Langue n°12 : axe sur la rangée du milieu (contrat du prompt n°12),
      // à SON échelle du manifeste (rapport à celle du corps : renderTongue
      // multiplie par l'échelle du crapaud).
      tongue: tongueArt
        ? {
          key: 'item-crapaud_langue', frame: undefined, originY: 0.5,
          len: scene.textures.get('item-crapaud_langue').getSourceImage().width,
          scale: (langDef.scale || def.scale || 0.25) / (def.scale || 0.25),
        }
        : crapaudPlancheTongue(corrompu),
      tinted: false,
    };
  }
  const corrompu = scene.textures.exists(CRAPAUD_PLANCHES.corrompu.test);
  const planche = corrompu ? CRAPAUD_PLANCHES.corrompu : CRAPAUD_PLANCHES.sain;
  ensureCrapaudPlancheFrames(scene, planche);
  ensureCrapaudPlancheFrames(scene, CRAPAUD_PLANCHES.sain);
  const pose = (key) => ({ key, frame: CRAPAUD_CORPS_FRAME });
  return {
    n12: false,
    id: corrompu ? 'crapaud_corrompu' : 'crapaud',
    idle: planche.idle.map(pose),
    puff: pose(planche.puff),
    open: pose(planche.open),
    shut: pose(planche.shut),
    rise: pose(planche.air),
    air: pose(planche.air),
    crouch: pose(planche.idle[0]),
    land: pose(planche.idle[0]),
    hiddenFrames: [],
    revealFrames: [],
    frameW: CRAPAUD_CORPS_W,
    frameH: CRAPAUD_PLANCHE_H,
    ox: CRAPAUD_CORPS_CX,
    feet: CRAPAUD_PIEDS_Y,
    mouth: planche.mouth,
    scale: null,
    tongue: crapaudPlancheTongue(planche),
    tinted: !corrompu,
  };
}

// Anim d'attente d'une apparence (une par jeu de poses, créée une fois).
function ensureCrapaudIdleAnim(scene, look) {
  const key = `crapaud-look-${look.id}-idle`;
  if (!scene.anims.exists(key)) {
    scene.anims.create({ key, frames: look.idle.map((p) => ({ key: p.key, frame: p.frame })), frameRate: 4, repeat: -1 });
  }
  return key;
}

// setDepth seulement s'il change : chaque appel redemande un tri de toute la
// liste d'affichage (cf. LookKit, lookSyncRim), à éviter à chaque image.
function crapaudSetDepth(obj, d) {
  if (obj && obj.depth !== d) obj.setDepth(d);
  return obj;
}

// Pose saine (après le soin) : le crapaud orange d'origine, cadre `corps`.
function crapaudHealthyPose(scene) {
  ensureCrapaudPlancheFrames(scene, CRAPAUD_PLANCHES.sain);
  return { key: 'crapaud-0', frame: CRAPAUD_CORPS_FRAME };
}

// ---------------------------------------------------------------------------
// Base commune : corps + langue visée, télégraphe, dégâts, soin, mort.
// Les sous-classes écrivent `think(player, now)` (petite machine à états) et
// lancent la langue par startAim ; le télégraphe (état 'aim') et la langue
// (état 'tongue') sont menés ici, puis onTongueDone rend la main au type.
// ---------------------------------------------------------------------------
class CrapaudCorrompu extends Phaser.Physics.Arcade.Sprite {
  // cfg : artId (art n°12 à préférer), scale, bodyW/bodyH (px monde), hp,
  // facing (1 | -1), reach (portée de la langue, px monde), aimMs (télégraphe).
  constructor(scene, x, y, cfg = {}) {
    const look = crapaudBuildLook(scene, cfg.artId);
    super(scene, x, y, look.idle[0].key, look.idle[0].frame);
    this.look = look;
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // L'art n°12 a sa propre échelle (manifeste) ; sinon celle du type.
    this.s = look.n12 ? look.scale : (cfg.scale || 0.26);
    this.setScale(this.s);
    this.bodyW = cfg.bodyW || 44;
    this.bodyH = cfg.bodyH || 32;
    this.sink = 0;
    this.applyLayout();

    this.corrupted = true;
    this.hp = cfg.hp ?? 2;
    this.maxHp = this.hp;
    this.reach = cfg.reach || 220;
    this.aimMs = cfg.aimMs || 420;
    this.facing = cfg.facing || -1;
    this.setFlipX(this.facing < 0);
    this.state = 'idle';
    this.stateAt = 0;
    this.stateEnd = 0;
    this.defeated = false;
    this.nextDrip = 0;
    this.idleAnimKey = ensureCrapaudIdleAnim(scene, look);
    // Teinte de base (camouflage du piège, ou vert toxique sur l'art sain).
    this.baseTint = look.tinted ? CORRUPTION_TINT : null;
    this.restoreTint();

    // Pièces dessinées à part : langue, lueur de bouche et points de visée
    // (télégraphe), aura du repli sans art corrompu.
    ensureGlowDotTexture(scene);
    const tg = look.tongue;
    this.tongue = scene.add.image(x, y, tg.key, tg.frame).setOrigin(0, tg.originY).setVisible(false);
    this.tongueLen = 0;
    this.charge = scene.add.image(x, y, FX_GLOW_DOT_KEY).setBlendMode(Phaser.BlendModes.ADD)
      .setTint(CRAPAUD_TELEGRAPH_TINT).setVisible(false);
    this.aimDots = [];
    for (let i = 0; i < CRAPAUD_AIM_DOTS; i++) {
      this.aimDots.push(scene.add.image(x, y, FX_GLOW_DOT_KEY).setBlendMode(Phaser.BlendModes.ADD)
        .setTint(CRAPAUD_TELEGRAPH_TINT).setScale(0.55).setVisible(false));
    }
    this.parts = [this.tongue, this.charge, ...this.aimDots];
    if (look.tinted) {
      // Repli sans art corrompu : aura toxique pulsée sous le corps (comme avant).
      this.aura = scene.add.image(x, y, FX_GLOW_DOT_KEY).setBlendMode(Phaser.BlendModes.ADD)
        .setTint(CORRUPTION_TINT).setAlpha(0.35).setScale(2.6 * this.s / 0.26, 1.6 * this.s / 0.26);
      scene.tweens.add({ targets: this.aura, alpha: 0.6, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.parts.push(this.aura);
    }
    // Pièces recalées APRÈS la physique de chaque image (postupdate) : en
    // preUpdate, elles traînaient d'une image derrière un crapaud en plein saut.
    scene.events.on('postupdate', this.syncParts, this);
    this.once('destroy', () => {
      scene.events.off('postupdate', this.syncParts, this);
      for (const p of this.parts) if (p && p.active) p.destroy();
    });
    this.playIdle();
  }

  // Origine, rognage (crapaud enfoncé dans le sol, cf. CrapaudPiege) et corps
  // physique. Le corps garde sa taille MONDE (bodyW x bodyH) et son bas sur les
  // pattes visibles quel que soit l'enfoncement : seule l'image descend.
  applyLayout() {
    const L = this.look;
    const sink = Math.max(0, Math.min(this.sink || 0, L.frameH - 1));
    const doy = L.frameH - sink;
    this.setOrigin(L.ox / L.frameW, doy / L.frameH);
    if (sink > 0) this.setCrop(0, 0, L.frameW, L.frameH - sink);
    else if (this.isCropped) this.setCrop();
    const bw = this.bodyW / this.s;
    const bh = this.bodyH / this.s;
    this.body.setSize(bw, bh, false);
    // Origine au centre des pattes : le corps reste centré sous le crapaud
    // dans les deux sens (Arcade ne retourne pas l'offset avec flipX).
    this.body.setOffset(L.ox - bw / 2, doy - (L.frameH - L.feet) - bh);
  }

  setFacing(dir) {
    if (!dir || dir === this.facing) return;
    this.facing = dir;
    this.setFlipX(dir < 0);
  }

  // Demi-tour lisible : petit écrasement au moment où il se retourne.
  turnTo(dir) {
    if (!dir || dir === this.facing) return;
    this.setFacing(dir);
    if (typeof juiceSquash === 'function') juiceSquash(this, 0.86, 1.1, 160);
  }

  setPose(pose) {
    if (!pose) return;
    if (this.anims.isPlaying) this.anims.stop();
    if (this.texture.key !== pose.key || (pose.frame && this.frame.name !== pose.frame)) this.setTexture(pose.key, pose.frame);
  }

  playIdle() {
    if (this.anims.isPlaying && this.anims.currentAnim && this.anims.currentAnim.key === this.idleAnimKey) return;
    this.anims.play(this.idleAnimKey, true);
  }

  restoreTint() {
    if (this.healed) { this.clearTint(); return; }
    if (this.baseTint != null) this.setTint(this.baseTint);
    else this.clearTint();
  }

  // Point de la bouche (monde), mesuré depuis les PATTES : le même que le
  // crapaud soit sorti ou enfoncé (le piège vise depuis sa position sortie).
  // La bouche ne bouge pas d'une pose à l'autre à cette échelle.
  mouthWorld(facing = this.facing) {
    const L = this.look;
    return {
      x: this.x + facing * (L.mouth[0] - L.ox) * this.s,
      y: this.y + (L.mouth[1] - L.frameH) * this.s,
    };
  }

  // Angle monde d'une visée locale (0 = droit devant, négatif = vers le haut).
  worldAngle(local, facing = this.facing) {
    return facing > 0 ? local : Math.PI - local;
  }

  // Longueur libre (px monde) depuis `from` dans la direction `angle`, jusqu'à
  // `max` : la langue s'arrête sur le premier solide (sol, plateforme, mur de
  // mousse) au lieu de traverser une plateforme pour toucher Agarica.
  freeLength(angle, max, from = this.mouthWorld()) {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const step = 10;
    // Les premiers px partent DANS le corps, parfois au ras de l'herbe.
    for (let d = 16; d <= max; d += step) {
      const px = from.x + dx * d;
      const py = from.y + dy * d;
      if (this.scene.physics.overlapRect(px - 2, py - 2, 4, 4, false, true).length) return Math.max(0, d - step);
    }
    return max;
  }

  // Visée sur Agarica (centre de son corps) pour un crapaud tourné vers
  // `facing` : angle local, distance, portée utile (bornée par les solides)
  // et `ok` si la langue l'atteint.
  aimInfo(player, facing = this.facing) {
    const m = this.mouthWorld(facing);
    const c = player.body ? player.body.center : player;
    const dx = c.x - m.x;
    const dy = c.y - m.y;
    const local = Math.atan2(dy, dx * facing);
    const dist = Math.hypot(dx, dy);
    const inCone = local >= CRAPAUD_AIM_UP - 0.05 && local <= CRAPAUD_AIM_DOWN + 0.05;
    if (!inCone || dist > this.reach + 8) return { ok: false, local, dist, free: 0 };
    const clamped = Phaser.Math.Clamp(local, CRAPAUD_AIM_UP, CRAPAUD_AIM_DOWN);
    const free = this.freeLength(this.worldAngle(clamped, facing), this.reach + 8, m);
    return { ok: free + CRAPAUD_TONGUE_TIP_R >= dist, local: clamped, dist, free };
  }

  // --- Télégraphe puis langue ------------------------------------------------
  // La visée est FIGÉE au début du télégraphe : Agarica qui bouge pendant que
  // la gorge gonfle esquive (juste), au lieu d'être suivie jusqu'au bout.
  startAim(player, now) {
    const aim = this.aimInfo(player);
    this.aimLocal = aim.ok ? aim.local : 0;
    this.aimReach = Phaser.Math.Clamp(aim.ok ? Math.min(aim.free, this.reach) : this.reach, 40, this.reach);
    this.state = 'aim';
    this.stateAt = now;
    this.stateEnd = now + this.aimMs;
    this.setVelocityX(0);
    this.setPose(this.look.puff);
    playSfx('crapaud_gorge');
  }

  // Télégraphe : gorge gonflée (pose), lueur qui grossit à la bouche, trois
  // points qui s'allument le long de la visée, léger tremblement.
  animateAim(now) {
    const t = Phaser.Math.Clamp((now - this.stateAt) / this.aimMs, 0, 1);
    const j = typeof juiceRender === 'function' ? juiceRender(this) : null;
    if (j) j.off.x = Math.sin(now / 18) * 0.9 * t;
    this.aimT = t;
  }

  startTongue(now) {
    const j = typeof juiceRender === 'function' ? juiceRender(this) : null;
    if (j) j.off.x = 0;
    this.aimT = 0;
    this.state = 'tongue';
    this.stateAt = now;
    this.tongueHit = false;
    this.tongueCut = false;
    // Portée revérifiée au départ (un crapaud repoussé a pu se rapprocher d'un mur).
    this.tongueMax = this.freeLength(this.worldAngle(this.aimLocal), this.aimReach);
    this.setPose(this.look.open);
    playSfx('crapaud_langue');
  }

  // Longueur (px monde) de la langue selon le temps écoulé depuis sa sortie.
  tongueLengthAt(t) {
    const out = CRAPAUD_TONGUE_OUT_MS;
    const hold = out + CRAPAUD_TONGUE_HOLD_MS;
    if (t < out) return this.tongueMax * Phaser.Math.Easing.Cubic.Out(t / out);
    if (t < hold) return this.tongueMax;
    return this.tongueMax * (1 - Phaser.Math.Easing.Quadratic.In(Math.min(1, (t - hold) / CRAPAUD_TONGUE_BACK_MS)));
  }

  updateTongue(player, now) {
    // Coupée (coup reçu, langue frappée) : retour rapide depuis la longueur
    // atteinte, sans dégâts.
    if (this.tongueCut) {
      this.tongueLen = Math.max(0, this.tongueLen - (this.tongueMax / CRAPAUD_TONGUE_BACK_MS) * 2 * this.scene.game.loop.delta);
      if (this.tongueLen <= 0) this.endTongue(now);
      return;
    }
    const t = now - this.stateAt;
    this.tongueLen = this.tongueLengthAt(t);
    const dangerous = t < CRAPAUD_TONGUE_OUT_MS + CRAPAUD_TONGUE_HOLD_MS;
    if (dangerous && player && player.body) this.checkTongueContact(player);
    if (t >= CRAPAUD_TONGUE_OUT_MS + CRAPAUD_TONGUE_HOLD_MS + CRAPAUD_TONGUE_BACK_MS) this.endTongue(now);
  }

  cutTongue() {
    if (this.state === 'tongue') this.tongueCut = true;
  }

  endTongue(now) {
    this.tongueLen = 0;
    this.tongue.setVisible(false);
    this.onTongueDone(now);
  }

  // À écrire par la sous-classe (pose, temps de récupération).
  onTongueDone(now) {
    this.state = 'recover';
    this.stateAt = now;
    this.stateEnd = now + 600;
  }

  tongueSegment() {
    const m = this.mouthWorld();
    const a = this.worldAngle(this.aimLocal || 0);
    return { m, tip: { x: m.x + Math.cos(a) * this.tongueLen, y: m.y + Math.sin(a) * this.tongueLen } };
  }

  // La langue touche-t-elle ce rectangle (tige épaissie + boule au bout) ?
  tongueHitsRect(rect, pad = CRAPAUD_TONGUE_PAD) {
    if (!rect || this.tongueLen < 6) return false;
    const { m, tip } = this.tongueSegment();
    const r = new Phaser.Geom.Rectangle(rect.x - pad, rect.y - pad, rect.width + pad * 2, rect.height + pad * 2);
    if (Phaser.Geom.Intersects.LineToRectangle(new Phaser.Geom.Line(m.x, m.y, tip.x, tip.y), r)) return true;
    return Phaser.Geom.Intersects.CircleToRectangle(new Phaser.Geom.Circle(tip.x, tip.y, CRAPAUD_TONGUE_TIP_R), rect);
  }

  // Contact langue / Agarica. La langue est frappable : un coup de dague ou de
  // croc qui la croise compte comme un coup sur le crapaud (même jeton que
  // tryPlayerMeleeHit, donc jamais deux fois) et la renvoie dans la bouche --
  // l'ancienne langue l'était aussi (le corps Arcade s'étirait avec elle).
  // Sinon : un cœur perdu, et la langue repart.
  checkTongueContact(player) {
    const scene = this.scene;
    const atk = typeof player.getAttackHitbox === 'function' ? player.getAttackHitbox() : null;
    if (atk && this.tongueHitsRect(atk, 0)) {
      const token = player.isAttacking ? `melee-${player.attackEndTime}` : `dive-${Math.floor(scene.time.now / 400)}`;
      if (typeof damageEnemy === 'function' && damageEnemy(scene, this, { kind: player.isAttacking ? 'melee' : 'dive', player, token })) {
        if (typeof player.gainEnergy === 'function' && typeof ENERGY_PER_HIT !== 'undefined') player.gainEnergy(ENERGY_PER_HIT);
      }
      this.cutTongue();
      return;
    }
    if (this.tongueHit || player.isInvulnerable) return;
    const b = player.body;
    if (this.tongueHitsRect(new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height))) {
      this.tongueHit = true;
      player.hitByEnemy();
      this.cutTongue();
    }
  }

  // --- Pièces dessinées à part ----------------------------------------------
  syncParts() {
    if (!this.active) return;
    const d = this.depth;
    // Langue juste DERRIÈRE le corps : elle sort de la bouche au lieu d'être
    // collée par-dessus les lèvres.
    if (this.tongueLen > 0.5 && !this.healed) this.renderTongue(d - 0.05);
    else if (this.tongue.visible) this.tongue.setVisible(false);
    const aiming = this.state === 'aim' && !this.defeated;
    const t = aiming ? (this.aimT || 0) : 0;
    const m = this.mouthWorld();
    crapaudSetDepth(this.charge.setVisible(aiming), d + 0.05);
    // Tailles vérifiées en jeu : le point lumineux (dégradé doux de 32 px)
    // disparaissait sous 0,5 sur les fonds de la forêt.
    if (aiming) this.charge.setPosition(m.x, m.y).setScale(0.5 + 0.7 * t).setAlpha(0.5 + 0.45 * t);
    const a = this.worldAngle(this.aimLocal || 0);
    for (let i = 0; i < this.aimDots.length; i++) {
      const dot = this.aimDots[i];
      // Allumés l'un après l'autre (le premier à 25 % du télégraphe).
      const on = aiming ? Phaser.Math.Clamp((t - 0.15 - i * 0.18) / 0.25, 0, 1) : 0;
      // Au-dessus des plantes de premier plan (repère de jeu, comme une
      // invite) : derrière une touffe de sous-bois, la visée ne se lisait plus.
      crapaudSetDepth(dot.setVisible(on > 0), DECOR_FOREGROUND_DEPTH + 1);
      if (on > 0) {
        const r = (this.aimReach || this.reach) * (i + 1) / (this.aimDots.length + 1);
        dot.setPosition(m.x + Math.cos(a) * r, m.y + Math.sin(a) * r).setAlpha(0.7 * on);
      }
    }
    if (this.aura) crapaudSetDepth(this.aura.setPosition(this.x, this.body ? this.body.bottom - 14 * this.s / 0.26 : this.y).setVisible(this.visible), d - 1);
    this.syncDecor(d);
  }

  // Accessoires propres à un type (mousse du piège) : cf. CrapaudPiege.
  syncDecor() {}

  // Langue sortie de `tongueLen` px : on montre la FIN de la bande (boule
  // comprise) depuis la bouche, en reculant l'image d'autant le long de l'axe.
  renderTongue(depth) {
    const tg = this.look.tongue;
    const k = this.s * tg.scale;
    const lenSrc = Math.min(tg.len, this.tongueLen / k);
    const hidden = tg.len - lenSrc;
    const a = this.worldAngle(this.aimLocal || 0);
    const m = this.mouthWorld();
    crapaudSetDepth(this.tongue, depth);
    this.tongue.setVisible(true).setScale(k).setRotation(a)
      // Langue tournée vers la gauche : retournée en Y pour que les gouttes
      // pendent toujours vers le bas.
      .setFlipY(Math.cos(a) < 0)
      .setCrop(hidden, 0, lenSrc, this.tongue.frame.cutHeight)
      .setPosition(m.x - Math.cos(a) * hidden * k, m.y - Math.sin(a) * hidden * k)
      .setAlpha(this.alpha);
  }

  hideTelegraph() {
    const j = typeof juiceRender === 'function' ? juiceRender(this) : null;
    if (j) j.off.x = 0;
    this.aimT = 0;
    this.charge.setVisible(false);
    for (const dot of this.aimDots) dot.setVisible(false);
  }

  // Gouttes toxiques (comme les autres corrompus), sauf sous la mousse.
  updateDrips(now) {
    if (now <= this.nextDrip || this.sink > 0) return;
    this.nextDrip = now + Phaser.Math.Between(400, 800);
    spawnToxicDrip(this.scene, this.x + Phaser.Math.Between(-14, 14) * this.s / 0.26, this.body.bottom - 22 * this.s / 0.26, this.depth + 1);
  }

  // Zone frappable par la mêlée et le rebond : le corps seul (le canevas de
  // la planche ne déborde plus, mais la langue a son propre test, cf.
  // checkTongueContact).
  getMeleeBounds() {
    const b = this.body;
    return new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height);
  }

  update(player) {
    if (this.defeated || !player || !player.body || !this.body) return;
    const now = this.scene.time.now;
    this.updateDrips(now);
    if (this.state === 'tongue') this.updateTongue(player, now);
    if (this.defeated) return;
    if (now < (this.stunnedUntil || 0)) return;
    if (this.state === 'aim') {
      if (now >= this.stateEnd) this.startTongue(now);
      else this.animateAim(now);
      return;
    }
    this.think(player, now);
  }

  think() {}

  // Coup reçu (LevelKit/damageEnemy) : -1 PV, flash, petit sursaut ; le
  // télégraphe en cours est annulé et la langue rentre (le coup interrompt).
  takeHit(source) {
    corruptedTakeHit(this, source, { knockX: 0, knockY: this.knockY ?? -120 });
    if (this.defeated || !this.active) return;
    this.onHurt(this.scene.time.now);
  }

  onHurt(now) {
    if (this.state === 'aim') {
      this.hideTelegraph();
      this.state = 'recover';
      this.stateAt = now;
      this.stateEnd = now + 350;
      this.setPose(this.look.open);
    } else if (this.state === 'tongue') {
      this.cutTongue();
    }
  }

  // Calmé pour `ms` à la sortie d'un dialogue ou d'une cinématique (Agarica
  // est alors invulnérable 1 s, cf. storyUnfrozenTick dans StoryKit.js) :
  // télégraphe annulé, langue rentrée, aucune nouvelle action avant la fin --
  // sinon il frappait dès le dégel, comme le singe avant son calm().
  calm(ms) {
    if (this.defeated || this.healed) return;
    const now = this.scene.time.now;
    this.calmUntil = now + ms;
    if (this.state === 'aim') {
      this.hideTelegraph();
      this.state = 'recover';
      this.stateAt = now;
      this.stateEnd = now + ms;
      this.setPose(this.look.idle[0]);
    } else if (this.state === 'tongue') {
      this.cutTongue();
    }
    this.onCalm(now, ms);
  }

  // Réglages propres au type (délais de la prochaine action).
  onCalm() {}

  cleanupCombat() {
    this.hideTelegraph();
    this.tongueLen = 0;
    if (this.tongue && this.tongue.active) this.tongue.setVisible(false);
  }

  onPurify() {
    this.anims.stop();
    this.cleanupCombat();
    this.sink = 0;
    this.applyLayout();
    // Soigné en plein saut : reposé sur le sol en dessous (purifyCorruptedEnemy
    // coupe son corps, il serait resté suspendu en l'air pendant sa fuite).
    const b = this.body;
    if (b && !b.blocked.down && typeof groundStandYAt === 'function') {
      const stand = groundStandYAt(this.scene, this.x, b.bottom);
      if (stand != null && stand > b.bottom && stand - b.bottom < 160) this.y += stand - b.bottom;
    }
    if (this.aura) {
      this.scene.tweens.killTweensOf(this.aura);
      this.scene.tweens.add({ targets: this.aura, alpha: 0, duration: 300 });
    }
  }

  // Soin (compétence papillon) : apparence saine (crapaud orange d'origine,
  // cadre `corps`), petit bond puis fuite paisible. Le corps étant centré, il
  // peut se retourner vers sa fuite (plus besoin de noFlipOnPurify).
  heal() {
    return purifyCorruptedEnemy(this, {
      onClean: (e) => {
        const p = crapaudHealthyPose(e.scene);
        e.look = { ...e.look, ox: CRAPAUD_CORPS_CX, feet: CRAPAUD_PIEDS_Y, frameW: CRAPAUD_CORPS_W, frameH: CRAPAUD_PLANCHE_H };
        e.baseTint = null;
        e.setTexture(p.key, p.frame);
        e.setScale(e.s);
        e.setOrigin(CRAPAUD_CORPS_CX / CRAPAUD_CORPS_W, 1);
        if (e.isCropped) e.setCrop();
      },
      fleeDistance: 220,
    });
  }

  defeat() {
    if (this.defeated) return;
    this.cleanupCombat();
    spawnLightParticles(this.scene, this.x, this.y - 10, { count: 6, colors: [CORRUPTION_TINT], rise: 20 });
    if (this.aura) this.aura.destroy();
    this.aura = null;
    enemyFadeOutDefeat(this);
  }
}

// ---------------------------------------------------------------------------
// Crapaud sauteur ('crapaud_sauteur', et l'alias 'crapaud_corrompu').
// Machine à états : idle -> (aim -> tongue -> recover) | (crouch -> air -> land)
// -> idle. Règles de choix (pas d'IA ni de recherche de chemin), une fois
// tourné vers Agarica :
//   - si la langue l'atteint et qu'il n'en sort pas (ou qu'aucun saut n'est
//     possible) : télégraphe puis langue ;
//   - sinon un bond : recul si elle est à moins de 70 px (même niveau), saut
//     SUR elle entre 90 et 210 px (même niveau), rapprochement au-delà de 85 %
//     de la portée.
// Il alterne donc langue et saut : rythme lisible, fenêtres de frappe pendant
// le télégraphe (0,42 s), l'accroupi (0,32 s) et la bouche ouverte (0,65 s).
// Bornes : patrolMinX/patrolMaxX (LevelKit : x ± 150 par défaut) ET sol sondé
// sous tout le trajet (même niveau à ± 24 px) : jamais dans un trou, jamais
// sur une marche, jamais hors de sa plateforme.
// ---------------------------------------------------------------------------
const CRAPAUD_SAUTEUR_SCALE = 0.24;
const CRAPAUD_SAUTEUR_JUMP_VY = 480;     // apogée ~89 px (gravité 1300)
const CRAPAUD_SAUTEUR_CROUCH_MS = 320;   // télégraphe du saut
const CRAPAUD_SAUTEUR_LAND_MS = 240;
const CRAPAUD_SAUTEUR_RECOVER_MS = 650;  // fenêtre de frappe après la langue
const CRAPAUD_SAUTEUR_TONGUE_CD = 1100;
const CRAPAUD_SAUTEUR_JUMP_MAX = 200;
const CRAPAUD_SAUTEUR_POUNCE = [90, 210];
const CRAPAUD_SAUTEUR_TOO_CLOSE = 70;
const CRAPAUD_SAUTEUR_AGGRO = { x: 380, up: 240, down: 120 };
const CRAPAUD_SAUTEUR_LEVEL_TOL = 24;

class CrapaudSauteur extends CrapaudCorrompu {
  constructor(scene, x, y, { patrolMinX, patrolMaxX, hp = 2, facing, reach } = {}) {
    super(scene, x, y, {
      artId: 'crapaud_sauteur', scale: CRAPAUD_SAUTEUR_SCALE, bodyW: 44, bodyH: 32, hp,
      facing: facing === 'right' ? 1 : -1, reach: reach || 220, aimMs: 420,
    });
    this.patrolMinX = patrolMinX ?? x - 150;
    this.patrolMaxX = patrolMaxX ?? x + 150;
    this.knockY = -120;
    this.lastAction = null;
    this.nextActionAt = 0;
    this.tongueReadyAt = 0;
    this.turnAt = 0;
  }

  // Sol à la même hauteur (± tolérance) sous `x` ?
  groundOkAt(x) {
    if (typeof groundStandYAt !== 'function') return true;
    const stand = groundStandYAt(this.scene, x, this.body.bottom);
    return stand != null && Math.abs(stand - this.body.bottom) <= CRAPAUD_SAUTEUR_LEVEL_TOL;
  }

  // Point d'atterrissage sûr vers `tx` (borné, sol continu sous tout le
  // trajet, pattes comprises), raccourci si besoin ; null si aucun.
  safeLanding(tx) {
    const half = this.bodyW / 2;
    const lo = this.patrolMinX + half;
    const hi = this.patrolMaxX - half;
    if (lo >= hi) return null;
    const want = Phaser.Math.Clamp(tx, lo, hi) - this.x;
    for (const f of [1, 0.7, 0.45]) {
      const d = want * f;
      if (Math.abs(d) < 28) return null;
      const end = this.x + d;
      let ok = true;
      const dir = Math.sign(d);
      for (let px = this.x; dir > 0 ? px <= end + half : px >= end - half; px += dir * 16) {
        if (!this.groundOkAt(px)) { ok = false; break; }
      }
      if (ok && this.groundOkAt(end + dir * half) && this.groundOkAt(end - dir * half)) return end;
    }
    return null;
  }

  think(player, now) {
    // `blocked` seul : `touching` est aussi posé par le simple chevauchement
    // d'Agarica (overlap Arcade) -- retombant SUR elle, il se croyait posé.
    const onGround = this.body.blocked.down;
    switch (this.state) {
      case 'idle': this.thinkIdle(player, now, onGround); return;
      case 'recover':
        // Bouche ouverte un instant (il « avale »), puis l'attente.
        if (now - this.stateAt > 260) this.playIdle();
        if (now >= this.stateEnd) this.toIdle(now);
        return;
      case 'crouch': {
        const t = Phaser.Math.Clamp((now - this.stateAt) / CRAPAUD_SAUTEUR_CROUCH_MS, 0, 1);
        const j = juiceRender(this);
        if (j) { j.sq.x = 1 + 0.16 * t; j.sq.y = 1 - 0.24 * t; }
        if (now >= this.stateEnd) this.leap(now);
        return;
      }
      case 'air': {
        const vx = this.body.velocity.x;
        // Jamais hors de ses bornes, même en plein bond (repoussé, cible bougée).
        if ((vx < 0 && this.x <= this.patrolMinX + this.bodyW / 2) || (vx > 0 && this.x >= this.patrolMaxX - this.bodyW / 2)) this.setVelocityX(0);
        const j = juiceRender(this);
        const up = this.body.velocity.y < 0;
        // Étiré en montant, détendu en descendant (art n°12 : détente puis vol).
        if (j) {
          j.sq.x = up ? 0.9 : 1;
          j.sq.y = up ? 1.12 : 1.04;
        }
        this.setPose(up ? this.look.rise : this.look.air);
        if (now - this.stateAt > 120 && onGround) this.land(now);
        return;
      }
      case 'land':
        this.setVelocityX(0);
        if (now >= this.stateEnd) this.toIdle(now);
        return;
      default:
    }
  }

  toIdle(now) {
    this.state = 'idle';
    this.stateAt = now;
    this.playIdle();
  }

  thinkIdle(player, now, onGround) {
    this.setVelocityX(0);
    const dx = player.x - this.x;
    const pdy = player.body.bottom - this.body.bottom;
    const aggro = Math.abs(dx) < CRAPAUD_SAUTEUR_AGGRO.x && pdy > -CRAPAUD_SAUTEUR_AGGRO.up && pdy < CRAPAUD_SAUTEUR_AGGRO.down;
    if (!aggro) { this.playIdle(); return; }
    // Se tourne vers Agarica (hystérésis : pas de va-et-vient quand elle
    // saute par-dessus lui).
    if (Math.abs(dx) > 10 && Math.sign(dx) !== this.facing && now >= this.turnAt) {
      this.turnTo(Math.sign(dx));
      this.turnAt = now + 220;
      this.nextActionAt = Math.max(this.nextActionAt, now + 180);
    }
    if (now < this.nextActionAt || !onGround) return;
    const adx = Math.abs(dx);
    const sameLevel = Math.abs(pdy) < 50;
    let jumpTo = null;
    if (sameLevel && adx < CRAPAUD_SAUTEUR_TOO_CLOSE) jumpTo = this.x - Math.sign(dx || this.facing) * 120;
    else if (sameLevel && adx >= CRAPAUD_SAUTEUR_POUNCE[0] && adx <= CRAPAUD_SAUTEUR_POUNCE[1]) jumpTo = player.x;
    else if (adx > this.reach * 0.85) jumpTo = this.x + Math.sign(dx) * Math.min(CRAPAUD_SAUTEUR_JUMP_MAX, adx - this.reach * 0.6);
    const target = jumpTo == null ? null : this.safeLanding(jumpTo);
    const aim = now >= this.tongueReadyAt ? this.aimInfo(player) : { ok: false };
    if (aim.ok && (this.lastAction !== 'tongue' || target == null)) { this.startAim(player, now); return; }
    if (target != null) { this.startCrouch(target, now); return; }
    this.playIdle();
    this.nextActionAt = now + 200;
  }

  startCrouch(target, now) {
    this.jumpTarget = target;
    this.state = 'crouch';
    this.stateAt = now;
    this.stateEnd = now + CRAPAUD_SAUTEUR_CROUCH_MS;
    // Face au saut (il recule en sautant à reculons sinon) ; se retourne
    // vers Agarica à l'atterrissage.
    this.setFacing(Math.sign(target - this.x) || this.facing);
    this.setPose(this.look.crouch);
    playSfx('crapaud_accroupi');
  }

  leap(now) {
    const j = juiceRender(this);
    if (j) { j.sq.x = 1; j.sq.y = 1; }
    const g = this.scene.physics.world.gravity.y || 1300;
    const airtime = (2 * CRAPAUD_SAUTEUR_JUMP_VY) / g;
    this.setVelocity((this.jumpTarget - this.x) / airtime, -CRAPAUD_SAUTEUR_JUMP_VY);
    this.state = 'air';
    this.stateAt = now;
    this.setPose(this.look.rise);
    spawnFx(this.scene, 'land', this.x, this.body.bottom, { power: 0.4 });
    playSfx('crapaud_saut');
  }

  land(now) {
    this.setVelocityX(0);
    const j = juiceRender(this);
    if (j) { j.sq.x = 1; j.sq.y = 1; }
    juiceSquash(this, 1.22, 0.8, 220);
    spawnFx(this.scene, 'land', this.x, this.body.bottom, { power: 0.6 });
    this.setPose(this.look.land);
    this.state = 'land';
    this.stateAt = now;
    this.stateEnd = now + CRAPAUD_SAUTEUR_LAND_MS;
    this.lastAction = 'jump';
    this.nextActionAt = now + CRAPAUD_SAUTEUR_LAND_MS + Phaser.Math.Between(120, 320);
  }

  onTongueDone(now) {
    this.state = 'recover';
    this.stateAt = now;
    this.stateEnd = now + CRAPAUD_SAUTEUR_RECOVER_MS;
    this.lastAction = 'tongue';
    this.tongueReadyAt = now + CRAPAUD_SAUTEUR_TONGUE_CD;
    this.nextActionAt = now + CRAPAUD_SAUTEUR_RECOVER_MS + Phaser.Math.Between(100, 300);
  }

  onCalm(now, ms) {
    if (this.state === 'crouch') {
      const j = juiceRender(this);
      if (j) { j.sq.x = 1; j.sq.y = 1; }
      this.toIdle(now);
    }
    this.nextActionAt = Math.max(this.nextActionAt, now + ms);
    this.tongueReadyAt = Math.max(this.tongueReadyAt, now + ms);
  }

  onHurt(now) {
    super.onHurt(now);
    // Coup en plein accroupissement : le saut est annulé.
    if (this.state === 'crouch') {
      const j = juiceRender(this);
      if (j) { j.sq.x = 1; j.sq.y = 1; }
      this.toIdle(now);
    }
    this.nextActionAt = Math.max(this.nextActionAt, now + 420);
  }
}

if (typeof ENEMY_REGISTRY !== 'undefined') {
  const makeSauteur = (scene, e) => new CrapaudSauteur(scene, e.x, e.y, {
    patrolMinX: e.patrolMinX, patrolMaxX: e.patrolMaxX, hp: e.hp ?? 2, facing: e.facing, reach: e.reach,
  });
  ENEMY_REGISTRY.crapaud_sauteur = makeSauteur;
  // Alias explicite (2026-11-08) : l'ancien crapaud corrompu fixe EST
  // désormais le sauteur. Mêmes PV (2) ; bornes x ± 150 via LevelKit, et le
  // sondage du sol l'empêche de quitter son terrain plat.
  ENEMY_REGISTRY.crapaud_corrompu = makeSauteur;
}
