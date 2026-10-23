// Petite créature de mousse corrompue — agent Ennemis.
//
// Ce fichier porte aussi les helpers communs aux ennemis CORROMPUS
// (MousseCreature, SingeCorrompu, CrapaudCorrompu) : il est le premier des
// trois chargé par index.html, et les autres ne les appellent qu'au runtime.

// ---------------------------------------------------------------------------
// Helpers « corruption » : particules lumineuses, gouttes toxiques, coups,
// purification (compétence papillon → enemy.heal()).
// ---------------------------------------------------------------------------
const CORRUPTION_TINT = 0x8dff5a;
const FX_GLOW_DOT_KEY = 'fx-glow-dot';
const PURIFY_COLORS = [0xfff6c2, 0x9ffcff, 0xffb6e8, 0xd8ffb0];

// Petit point lumineux flou (dégradé radial blanc), teinté à l'usage et
// affiché en mode additif : base de toutes les lueurs (purification,
// papillons, aura toxique).
function ensureGlowDotTexture(scene) {
  if (scene.textures.exists(FX_GLOW_DOT_KEY)) return FX_GLOW_DOT_KEY;
  const size = 32;
  const tex = scene.textures.createCanvas(FX_GLOW_DOT_KEY, size, size);
  const ctx = tex.getContext();
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.55)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  tex.refresh();
  return FX_GLOW_DOT_KEY;
}

// Gerbe de petites lumières qui montent et s'éteignent (purification,
// soin…). Purement décoratif, s'autodétruit.
function spawnLightParticles(scene, x, y, { count = 14, colors = PURIFY_COLORS, spread = 26, rise = 60, depth = 900 } = {}) {
  ensureGlowDotTexture(scene);
  for (let i = 0; i < count; i++) {
    const dot = scene.add.image(
      x + Phaser.Math.Between(-spread, spread),
      y + Phaser.Math.Between(-spread / 2, spread / 2),
      FX_GLOW_DOT_KEY,
    );
    dot.setBlendMode(Phaser.BlendModes.ADD);
    dot.setTint(colors[i % colors.length]);
    dot.setScale(Phaser.Math.FloatBetween(0.25, 0.5));
    dot.setDepth(depth);
    scene.tweens.add({
      targets: dot,
      x: dot.x + Phaser.Math.Between(-18, 18),
      y: dot.y - rise - Phaser.Math.Between(0, 30),
      alpha: 0,
      scale: 0.1,
      duration: Phaser.Math.Between(700, 1200),
      delay: Phaser.Math.Between(0, 250),
      ease: 'Sine.easeOut',
      onComplete: () => dot.destroy(),
    });
  }
}

// Goutte de mousse toxique qui tombe d'un corps corrompu et s'éteint.
function spawnToxicDrip(scene, x, y, depth = 5) {
  const drop = scene.add.ellipse(x, y, 3, 5, CORRUPTION_TINT, 0.9).setDepth(depth);
  scene.tweens.add({
    targets: drop,
    y: y + Phaser.Math.Between(10, 18),
    alpha: 0,
    duration: 600,
    ease: 'Quad.easeIn',
    onComplete: () => drop.destroy(),
  });
}

// Coup reçu par un ennemi corrompu (LevelKit appelle takeHit une fois par
// attaque, verrou par token) : -1 PV, flash blanc, petit recul ; 0 PV → defeat().
function corruptedTakeHit(enemy, source, { knockX = 160, knockY = -160 } = {}) {
  if (enemy.defeated) return;
  const now = enemy.scene.time.now;
  enemy.hp -= 1;
  if (enemy.hp <= 0) {
    enemy.defeat();
    return;
  }
  // `source` LevelKit = {kind, player, token} ; accepte aussi un objet positionné.
  const ref = source && (typeof source.x === 'number' ? source : source.player);
  const fromX = ref && typeof ref.x === 'number' ? ref.x : enemy.x - 1;
  const dir = enemy.x >= fromX ? 1 : -1;
  if (enemy.body && enemy.body.enable) enemy.setVelocity(dir * knockX, enemy.body.allowGravity ? knockY : 0);
  enemy.stunnedUntil = now + 300;
  enemy.setTintFill(0xffffff);
  enemy.scene.time.delayedCall(110, () => {
    if (!enemy.active || enemy.defeated) return;
    if (enemy.restoreTint) enemy.restoreTint();
    else enemy.clearTint();
  });
}

// Purification (compétence papillon) : l'animal redevient sain et s'en va
// paisiblement. NE compte PAS comme un ennemi tué : `healed = true`
// (`defeated = true` aussi, pour que LevelKit cesse update/contacts/coups).
// `onClean(enemy)` : remplace l'apparence corrompue par l'apparence saine.
function purifyCorruptedEnemy(enemy, { onClean, fleeDistance = 200, fleeMs = 1800, hop = true } = {}) {
  if (enemy.defeated || enemy.healed) return false;
  const scene = enemy.scene;
  enemy.healed = true;
  enemy.defeated = true;
  enemy.harmless = true;
  if (enemy.body) {
    enemy.setVelocity(0, 0);
    enemy.body.enable = false;
  }
  if (enemy.onPurify) enemy.onPurify();

  // Flash doux puis apparence saine.
  enemy.setTintFill(0xffffff);
  const cx = enemy.getCenter().x;
  const cy = enemy.getCenter().y;
  spawnLightParticles(scene, cx, cy, { count: 16 });
  scene.time.delayedCall(180, () => {
    if (!enemy.active) return;
    enemy.clearTint();
    if (onClean) onClean(enemy);
  });

  // S'éloigne du joueur (ou va à droite), petit bond de joie, puis disparaît.
  const player = scene.player;
  const dir = player ? (enemy.x >= player.x ? 1 : -1) : 1;
  if (!enemy.noFlipOnPurify) enemy.setFlipX(dir < 0);
  const startY = enemy.y;
  if (hop) {
    scene.tweens.add({ targets: enemy, y: startY - 14, duration: 180, yoyo: true, repeat: 2, delay: 350, ease: 'Sine.easeOut' });
  }
  scene.tweens.add({
    targets: enemy,
    x: enemy.x + dir * fleeDistance,
    duration: fleeMs,
    delay: 400,
    ease: 'Sine.easeIn',
  });
  scene.tweens.add({
    targets: enemy,
    alpha: 0,
    duration: 700,
    delay: 400 + fleeMs - 700,
    onComplete: () => enemy.destroy(),
  });
  // Quelques étincelles qui suivent sa fuite.
  scene.time.addEvent({
    delay: 260,
    repeat: Math.floor(fleeMs / 260),
    callback: () => {
      if (enemy.active) spawnLightParticles(scene, enemy.x, enemy.getCenter().y, { count: 2, spread: 10, rise: 30 });
    },
  });
  scene.events.emit('enemy-healed', enemy);
  return true;
}

// ---------------------------------------------------------------------------
// MousseCreature ('mousse_creature') : masse de mousse rampante, vert
// toxique lumineux. Rampe vers Agarica quand elle est proche, se tasse
// (télégraphe) puis bondit. 1 PV par défaut.
// ---------------------------------------------------------------------------
const MOUSSE_TEXTURE_KEY = 'mousse-creature-placeholder';
const MOUSSE_HEALED_TEXTURE_KEY = 'mousse-creature-saine';
const MOUSSE_WIDTH = 38;
const MOUSSE_HEIGHT = 26;
const MOUSSE_BODY_W = 30;
const MOUSSE_BODY_H = 18;

function ensureMousseTextures(scene) {
  if (!scene.textures.exists(MOUSSE_TEXTURE_KEY)) {
    const g = scene.add.graphics();
    const w = MOUSSE_WIDTH;
    const h = MOUSSE_HEIGHT;
    // Masse sombre + lobes, puis reflets vert toxique.
    g.fillStyle(0x1d3a12, 1);
    g.fillEllipse(w / 2, h - 9, w - 4, 16);
    g.fillCircle(12, h - 15, 8);
    g.fillCircle(24, h - 17, 9);
    g.fillCircle(31, h - 12, 6);
    g.fillStyle(0x4fae2a, 1);
    g.fillCircle(11, h - 17, 4);
    g.fillCircle(23, h - 20, 5);
    g.fillCircle(30, h - 14, 3);
    g.fillStyle(CORRUPTION_TINT, 1);
    g.fillCircle(21, h - 22, 2);
    g.fillCircle(9, h - 19, 1.5);
    // Gouttes qui pendent.
    g.fillEllipse(8, h - 2, 3, 5);
    g.fillEllipse(19, h - 1, 3, 6);
    g.fillEllipse(29, h - 2, 3, 4);
    // Yeux luisants (côté droit = avant).
    g.fillStyle(0xeaff6a, 1);
    g.fillCircle(27, h - 12, 2.2);
    g.fillCircle(33, h - 11, 1.8);
    g.fillStyle(0x1d3a12, 1);
    g.fillCircle(27.6, h - 12, 0.9);
    g.fillCircle(33.4, h - 11, 0.8);
    g.generateTexture(MOUSSE_TEXTURE_KEY, w, h);
    g.destroy();
  }
  if (!scene.textures.exists(MOUSSE_HEALED_TEXTURE_KEY)) {
    // Version saine : petite boule de mousse douce avec une pousse, yeux calmes.
    const g = scene.add.graphics();
    const w = MOUSSE_WIDTH;
    const h = MOUSSE_HEIGHT;
    g.fillStyle(0x3f7a4a, 1);
    g.fillEllipse(w / 2, h - 8, w - 8, 15);
    g.fillStyle(0x6fbf73, 1);
    g.fillEllipse(w / 2 - 2, h - 11, w - 16, 8);
    g.lineStyle(2, 0x8fe08a, 1);
    g.beginPath();
    g.moveTo(w / 2, h - 15);
    g.lineTo(w / 2 + 1, h - 21);
    g.strokePath();
    g.fillStyle(0xb8f5a0, 1);
    g.fillEllipse(w / 2 + 4, h - 22, 6, 3);
    g.fillStyle(0x1b2a1e, 1);
    g.fillCircle(25, h - 10, 1.4);
    g.fillCircle(30, h - 10, 1.4);
    g.generateTexture(MOUSSE_HEALED_TEXTURE_KEY, w, h);
    g.destroy();
  }
}

class MousseCreature extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, { patrolMinX, patrolMaxX, hp = 1 } = {}) {
    const useArt = enemyHasManifestArt(scene, 'mousse_creature');
    ensureMousseTextures(scene);
    super(scene, x, y, useArt ? manifestInitialTexture(scene, 'mousse_creature', 'idle') : MOUSSE_TEXTURE_KEY);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Ancrée aux pieds : l'écrasement/étirement (télégraphe) se fait depuis
    // le sol, sans enfoncer le corps physique dans les tuiles.
    this.setOrigin(0.5, 1);
    if (useArt) {
      applyEnemyManifestArt(this, 'mousse_creature', MOUSSE_BODY_W, MOUSSE_BODY_H);
      enemyPlayArt(this, 'idle');
    } else {
      this.setSize(MOUSSE_BODY_W, MOUSSE_BODY_H);
      this.setOffset((MOUSSE_WIDTH - MOUSSE_BODY_W) / 2, MOUSSE_HEIGHT - MOUSSE_BODY_H);
    }
    this.baseScale = this.scaleX;

    this.corrupted = true;
    this.hp = hp;
    this.maxHp = hp;
    this.patrolMinX = patrolMinX ?? x - 200;
    this.patrolMaxX = patrolMaxX ?? x + 200;
    this.aggroRangeX = 260;
    this.aggroRangeY = 80;
    this.creepSpeed = 55;
    this.leapRange = 120;
    this.leapCooldown = 1400;
    this.lastLeapEnd = -Infinity;
    this.state = 'idle'; // idle | creep | windup | leap | recover
    this.stateEnd = 0;
    this.direction = -1;
    this.defeated = false;
    this.nextDrip = 0;
  }

  restoreTint() {
    if (this.state === 'windup') this.setTint(0xd8ff9a);
    else this.clearTint();
  }

  // Écrase/étire le VISUEL seulement : le corps Arcade suit l'échelle, on
  // le recompense pour qu'il garde sa taille monde et reste posé au sol.
  setBodySquash(sx, sy) {
    this.setScale(this.baseScale * sx, this.baseScale * sy);
    if (!this.body || !this.body.enable) return;
    const w = MOUSSE_BODY_W / this.baseScale / sx;
    const h = MOUSSE_BODY_H / this.baseScale / sy;
    this.body.setSize(w, h, false);
    this.body.setOffset((this.width - w) / 2, this.height - h);
  }

  update(player) {
    if (this.defeated || !player) return;
    const now = this.scene.time.now;
    const onGround = this.body.blocked.down || this.body.touching.down;
    const dx = player.x - this.x;
    const dy = Math.abs(player.y - this.y);
    const inAggro = Math.abs(dx) < this.aggroRangeX && dy < this.aggroRangeY;

    if (now > this.nextDrip) {
      this.nextDrip = now + Phaser.Math.Between(500, 900);
      spawnToxicDrip(this.scene, this.x + Phaser.Math.Between(-12, 12), this.body.bottom - 2, this.depth);
    }
    if (now < (this.stunnedUntil || 0)) return;

    if (this.state === 'idle' || this.state === 'creep') {
      // Respiration molle.
      const wob = 1 + Math.sin(now / 180) * 0.06;
      this.setBodySquash(1 / wob, wob);
      if (!inAggro) {
        this.state = 'idle';
        this.setVelocityX(0);
        enemyPlayArt(this, 'idle');
        return;
      }
      this.state = 'creep';
      this.direction = dx > 0 ? 1 : -1;
      this.setFlipX(this.direction < 0);
      const atEdge = (this.direction < 0 && this.x <= this.patrolMinX) || (this.direction > 0 && this.x >= this.patrolMaxX);
      this.setVelocityX(atEdge ? 0 : this.direction * this.creepSpeed);
      enemyPlayArt(this, 'idle');
      if (Math.abs(dx) < this.leapRange && onGround && now - this.lastLeapEnd > this.leapCooldown) {
        // Télégraphe : se tasse et s'illumine avant de bondir.
        this.state = 'windup';
        this.stateEnd = now + 380;
        this.setVelocityX(0);
        this.setTint(0xd8ff9a);
      }
      return;
    }

    if (this.state === 'windup') {
      this.setVelocityX(0);
      // Se tasse progressivement (télégraphe lisible du bond).
      const t = Phaser.Math.Clamp(1 - (this.stateEnd - now) / 380, 0, 1);
      this.setBodySquash(1 + 0.25 * t, 1 - 0.3 * t);
      if (now >= this.stateEnd) {
        this.state = 'leap';
        this.stateEnd = now + 150; // ignore le sol pendant le décollage
        this.clearTint();
        this.setBodySquash(0.85, 1.2);
        enemyPlayArt(this, 'attack');
        const atEdge = (this.direction < 0 && this.x <= this.patrolMinX + 40) || (this.direction > 0 && this.x >= this.patrolMaxX - 40);
        this.setVelocity(atEdge ? 0 : this.direction * 210, -330);
      }
      return;
    }

    if (this.state === 'leap') {
      // Ne quitte jamais sa zone (bord de plateforme) même en plein bond.
      const vx = this.body.velocity.x;
      if ((vx < 0 && this.x <= this.patrolMinX) || (vx > 0 && this.x >= this.patrolMaxX)) this.setVelocityX(0);
      if (now >= this.stateEnd && onGround) {
        this.state = 'recover';
        this.stateEnd = now + 700;
        this.lastLeapEnd = now;
        this.setVelocityX(0);
        this.setBodySquash(1.2, 0.8);
      }
      return;
    }

    if (this.state === 'recover') {
      this.setVelocityX(0);
      if (now >= this.stateEnd) {
        this.state = 'idle';
        this.setBodySquash(1, 1);
      }
    }
  }

  takeHit(source) {
    corruptedTakeHit(this, source);
  }

  heal() {
    return purifyCorruptedEnemy(this, {
      onClean: (e) => {
        e.anims.stop();
        e.setTexture(MOUSSE_HEALED_TEXTURE_KEY);
        e.setScale(1);
        e.baseScale = 1;
      },
      fleeDistance: 140,
    });
  }

  defeat() {
    if (this.defeated) return;
    spawnLightParticles(this.scene, this.x, this.y, { count: 6, colors: [CORRUPTION_TINT], rise: 20 });
    if (this.useManifestArt && this.scene.anims.exists('mousse_creature-death')) {
      // Art : l'anim `death` (s'effondre) joue avant le fondu.
      this.defeated = true;
      this.setVelocity(0, 0);
      this.body.enable = false;
      this.setScale(this.baseScale);
      this.playManifest('death');
      this.scene.tweens.add({ targets: this, alpha: 0, duration: 300, delay: 450, onComplete: () => this.destroy() });
      return;
    }
    enemyFadeOutDefeat(this);
  }
}

if (typeof ENEMY_REGISTRY !== 'undefined') {
  ENEMY_REGISTRY.mousse_creature = (scene, e) => new MousseCreature(scene, e.x, e.y, {
    patrolMinX: e.patrolMinX, patrolMaxX: e.patrolMaxX, hp: e.hp ?? 1,
  });
}
