// Boss Ghil't, le Fléau de la Forêt — tapir géant corrompu (agent Ghil't).
// Cette entité ne gère QUE le combat : patterns télégraphiés, PV, dangers au
// sol (souffle, crachats, flaques). Le déroulé narratif (intro, défaite
// imposée, soin, Amanite) vit dans src/story/boss_ghilt.js, qui écoute les
// événements scène émis ici :
//   'ghilt-threshold'    phase 1 : PV sous GHILT_PHASE1_THRESHOLD → attaque imparable
//   'ghilt-weakened'     phase 2 : PV sous GHILT_WEAKENED_THRESHOLD → plus d'attaque
//   'ghilt-healed'       heal() accepté (compétence papillon sur Ghil't affaibli)
//   'ghilt-heal-refused' heal() tenté trop tôt
//   'ghilt-player-down'  Agarica vient de perdre son dernier cœur

const GHILT_HP_MAX = 20;
const GHILT_PHASE1_THRESHOLD = 0.6;
const GHILT_WEAKENED_THRESHOLD = 0.25;
// Taille en jeu du placeholder quand le manifest n'a pas (encore) d'entrée
// 'ghilt' : ~3x la hauteur d'Agarica (~86 px), silhouette de tapir massive.
const GHILT_PLACEHOLDER_W = 330;
const GHILT_PLACEHOLDER_H = 250;
// Corps physique (px écran). Volontairement plus bas que le sprite (dos +
// pattes, pas la bosse de mousse) : un saut simple d'Agarica (~178 px)
// doit pouvoir passer par-dessus la charge, tête baissée encore plus basse.
const GHILT_BODY_W = 240;
const GHILT_BODY_H = 150;
const GHILT_CHARGE_BODY_H = 105;
// Sans entrée de manifest : placeholder museau à gauche. Sinon `facing` du manifest.
const GHILT_ART_FACES_LEFT = true;
// Délai mini entre deux blessures infligées au joueur par les dangers du boss
// (le souffle dure ~1 s : sans ça, il viderait les 3 cœurs d'un coup).
const GHILT_PLAYER_HURT_COOLDOWN = 750;
const GHILT_PUDDLE_HURT_COOLDOWN = 1200;
const GHILT_MAX_PUDDLES = 6;
const GHILT_MAX_MINIONS = 2;

// Placeholder dessiné à la main (tapir reconnaissable, museau du côté où
// regarde l'art) tant que les vraies frames Codex n'existent pas. Même clé
// `ph-<id>` et même résolution source (taille écran / scale) que StoryKit :
// échelle et hitbox restent identiques le jour où l'art arrive.
function ensureGhiltPlaceholder(scene, id) {
  if (hasManifestArt(scene, id)) return;
  const key = `ph-${id}`;
  if (scene.textures.exists(key)) return;
  const def = getAssetManifest()[id];
  const healed = id === 'ghilt_gueri';
  const ph = (def && def.placeholder) || {};
  const w = ph.w || GHILT_PLACEHOLDER_W;
  const h = ph.h || GHILT_PLACEHOLDER_H;
  const sc = (def && def.scale) || 1;
  const facesLeft = def ? def.facing === 'left' : GHILT_ART_FACES_LEFT;
  const tex = scene.textures.createCanvas(key, Math.round(w / sc), Math.round(h / sc));
  const ctx = tex.getContext();
  // Dessin en coordonnées écran, museau à gauche, miroir si l'art regarde à droite.
  ctx.setTransform(facesLeft ? 1 / sc : -1 / sc, 0, 0, 1 / sc, facesLeft ? 0 : w / sc, 0);
  const body = healed ? '#7a8fa8' : '#3d4a2c';
  const moss = healed ? '#a9d68c' : '#6fae3a';
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#120c1e';
  // Pattes
  ctx.fillStyle = body;
  for (const lx of [0.21, 0.36, 0.65, 0.8]) { ctx.fillRect(w * lx, h - 70, 34, 68); ctx.strokeRect(w * lx, h - 70, 34, 68); }
  // Corps
  ctx.beginPath();
  ctx.ellipse(w * 0.56, h * 0.55, w * 0.4, h * 0.3, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  // Tête + museau (trompe)
  ctx.beginPath();
  ctx.ellipse(w * 0.2, h * 0.5, 62, 52, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w * 0.12, h * 0.42);
  ctx.quadraticCurveTo(-4, h * 0.5, 14, h * 0.78);
  ctx.lineTo(34, h * 0.76);
  ctx.quadraticCurveTo(28, h * 0.56, w * 0.16, h * 0.6);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  // Oeil
  ctx.fillStyle = healed ? '#fff3c4' : '#d8ff5a';
  ctx.beginPath(); ctx.arc(w * 0.2, h * 0.43, 8, 0, Math.PI * 2); ctx.fill();
  // Mousse sur le dos + coulures du museau
  ctx.fillStyle = moss;
  const blobs = healed ? 3 : 9;
  for (let i = 0; i < blobs; i++) {
    ctx.beginPath();
    ctx.arc(w * (0.3 + i * 0.06), h * (0.28 + (i % 3) * 0.03), 22 - (i % 3) * 4, 0, Math.PI * 2);
    ctx.fill();
  }
  if (!healed) {
    for (const [dx, len] of [[18, 40], [30, 26], [8, 22]]) ctx.fillRect(dx, h * 0.76, 7, len);
  }
  ctx.setTransform(1 / sc, 0, 0, 1 / sc, 0, 0);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  tex.refresh();
}

class Ghilt extends Phaser.Physics.Arcade.Sprite {
  // opts : { phase: 1|2, hp, minX, maxX } — minX/maxX = bornes de l'arène
  // (fin de charge, cible des crachats, apparition des créatures).
  constructor(scene, x, y, opts = {}) {
    ensureGhiltPlaceholder(scene, 'ghilt');
    super(scene, x, y, manifestInitialTexture(scene, 'ghilt', 'idle'));
    scene.add.existing(this);
    scene.physics.add.existing(this);
    ensureManifestAnims(scene, 'ghilt');
    attachPlayManifest(this, 'ghilt');

    const def = getAssetManifest().ghilt;
    this.setOrigin(0.5, 1);
    this.setScale(def ? (def.scale || 1) : 1);
    this.setCollideWorldBounds(true);
    this.setBodyWorld(GHILT_BODY_W, GHILT_BODY_H);

    this.phase = opts.phase || 1;
    this.hpMax = GHILT_HP_MAX;
    this.hp = Math.min(this.hpMax, opts.hp ?? this.hpMax);
    this.minX = opts.minX ?? 160;
    this.maxX = opts.maxX ?? 1200;
    // La charge va plus loin que la zone de déplacement normale : jusqu'aux
    // murs de l'arène, pour qu'on ne puisse pas l'esquiver en restant au bord.
    this.chargeMinX = opts.chargeMinX ?? this.minX;
    this.chargeMaxX = opts.chargeMaxX ?? this.maxX;
    this.groundY = y;
    // Phase 2 « un peu plus rapide » : télégraphes et pauses raccourcis.
    this.tempo = this.phase === 2 ? 0.8 : 1;

    this.corrupted = true; // contrat : la compétence papillon appelle heal()
    this.isBoss = true;
    this.defeated = false;
    this.healed = false;
    this.locked = true; // le script débloque après l'intro
    this.harmless = true;
    this.state = 'idle';
    this.stateEnd = 0;
    this.pendingAttack = null;
    this.lastAttack = null;
    this.lastRoarAt = -99999;
    this.nextAttackAt = 0;
    this.facing = -1;
    this.invulnUntil = 0;
    this.nextPlayerHurtAt = 0;
    this.nextPuddleHurtAt = 0;
    this.thresholdFired = false;
    this.playerDownFired = false;
    this.hazards = [];
    this.minions = [];
    this.applyFacing();
    this.playAnim('idle');
  }

  // ---------------------------------------------------------------------------
  // Utilitaires
  // ---------------------------------------------------------------------------
  setBodyWorld(w, h) {
    const sx = Math.abs(this.scaleX) || 1;
    const sy = Math.abs(this.scaleY) || 1;
    const bw = Math.min(this.width, w / sx);
    const bh = Math.min(this.height, h / sy);
    this.body.setSize(bw, bh, false);
    this.body.setOffset((this.width - bw) / 2, this.height - bh);
  }

  playAnim(anim) {
    if (this.playManifest) this.playManifest(anim);
  }

  applyFacing() {
    const def = getAssetManifest().ghilt;
    const facesLeft = def ? def.facing === 'left' : GHILT_ART_FACES_LEFT;
    this.setFlipX(facesLeft ? this.facing > 0 : this.facing < 0);
  }

  facePlayer(player) {
    this.facing = player.x >= this.x ? 1 : -1;
    this.applyFacing();
  }

  // Position (monde) du bout du museau : origine du souffle et des crachats.
  snout() {
    return {
      x: this.x + this.facing * this.displayWidth * 0.44,
      y: this.y - this.displayHeight * 0.4,
    };
  }

  // Cinématiques (src/story/boss_ghilt.js) : la physique ne déplace plus le
  // sprite, les tweens le font (le gel du monde peut couper update()).
  setCinematic(on) {
    this.locked = on;
    this.harmless = on || this.state === 'weakened' || this.healed;
    this.setVelocity(0, 0);
    this.body.moves = !on;
  }

  // ---------------------------------------------------------------------------
  // Boucle
  // ---------------------------------------------------------------------------
  update(player) {
    if (this.defeated || !this.active || !player || !player.active) return;
    const now = this.scene.time.now;
    const dt = Math.min(50, this.scene.game.loop.delta) / 1000;
    if (this.body.blocked.down) this.groundY = this.y;

    if (player.hearts <= 0 && !this.playerDownFired) {
      this.playerDownFired = true;
      this.scene.events.emit('ghilt-player-down', this);
    }

    this.updateHazards(player, now, dt);
    this.minions = this.minions.filter((m) => m && m.active && !m.defeated);
    this.updateWeakenedHealCheck(player);

    if (this.locked || this.healed) {
      this.setVelocityX(0);
      return;
    }

    // Contact : seule la charge blesse (sinon, coincée contre un mur sous ce
    // corps énorme, Agarica perdrait tous ses cœurs en une seconde), avec un
    // délai après chaque coup. Hors charge, le corps la repousse doucement.
    const overlapping = Phaser.Geom.Intersects.RectangleToRectangle(
      new Phaser.Geom.Rectangle(player.body.x, player.body.y, player.body.width, player.body.height),
      new Phaser.Geom.Rectangle(this.body.x, this.body.y, this.body.width, this.body.height),
    );
    if (this.state === 'charge' && overlapping && player.isInvulnerable) this.contactCooldownUntil = now + 900;
    this.harmless = this.state !== 'charge' || now < (this.contactCooldownUntil || 0);
    if (overlapping && this.state !== 'charge') this.pushPlayerOut(player);
    this.checkPlayerAttack(player, now);

    switch (this.state) {
      case 'idle': {
        const dx = player.x - this.x;
        // Avance lourdement vers Agarica sans la coller (le contact blesse).
        if (Math.abs(dx) > 260) {
          this.facing = dx > 0 ? 1 : -1;
          this.applyFacing();
          this.setVelocityX(this.facing * 55 / this.tempo);
          this.playAnim('walk');
        } else {
          this.setVelocityX(0);
          this.playAnim('idle');
        }
        if (now >= this.nextAttackAt) this.beginTelegraph(player, this.chooseAttack(player, now), now);
        break;
      }
      case 'telegraph':
        this.setVelocityX(0);
        if (now >= this.stateEnd) this.executeAttack(player, now);
        break;
      case 'charge': {
        this.setVelocityX(this.facing * 520 / this.tempo);
        const hitWall = (this.facing > 0 && this.x >= this.chargeMaxX) || (this.facing < 0 && this.x <= this.chargeMinX)
          || this.body.blocked.left || this.body.blocked.right;
        if (hitWall || now >= this.stateEnd) {
          this.setVelocityX(0);
          this.setBodyWorld(GHILT_BODY_W, GHILT_BODY_H);
          if (hitWall) this.scene.cameras.main.shake(220, 0.008);
          this.enterRecover(now, 750);
        }
        break;
      }
      case 'breath':
      case 'spit':
      case 'roar':
        this.setVelocityX(0);
        if (now >= this.stateEnd) this.enterRecover(now, 450);
        break;
      case 'recover':
        this.setVelocityX(0);
        if (now >= this.stateEnd) {
          this.state = 'idle';
          this.clearTint();
          this.nextAttackAt = now + Phaser.Math.Between(700, 1200) * this.tempo;
        }
        break;
      case 'weakened':
      default:
        this.setVelocityX(0);
        break;
    }
  }

  // LevelKit ne teste la mêlée que si les CORPS se touchent ; or le corps de
  // Ghil't repousse Agarica. On teste donc aussi la portée réelle de l'attaque
  // contre la silhouette entière, avec le même jeton anti-double-coup
  // (damageEnemy, Fondation) : un coup reste un seul dégât.
  checkPlayerAttack(player, now) {
    if (player.isInvulnerable || typeof player.getAttackHitbox !== 'function') return;
    const hb = player.getAttackHitbox();
    if (!hb || !Phaser.Geom.Intersects.RectangleToRectangle(hb, this.getBounds())) return;
    const kind = player.isAttacking ? 'melee' : 'dive';
    const token = player.isAttacking ? `melee-${player.attackEndTime}` : `dive-${Math.floor(now / 400)}`;
    if (typeof damageEnemy === 'function') {
      if (damageEnemy(this.scene, this, { kind, player, token }) && typeof player.gainEnergy === 'function'
        && typeof ENERGY_PER_HIT !== 'undefined') player.gainEnergy(ENERGY_PER_HIT);
    } else {
      this.takeHit({ kind, player, token });
    }
  }

  pushPlayerOut(player) {
    const left = this.body.x - player.body.width / 2 - 4;
    const right = this.body.right + player.body.width / 2 + 4;
    let side = player.x < this.x ? -1 : 1;
    // Côté mur (arène fermée) : on la fait ressortir de l'autre côté.
    if (side < 0 && left < this.chargeMinX - 110) side = 1;
    if (side > 0 && right > this.chargeMaxX + 110) side = -1;
    const target = side < 0 ? left : right;
    player.x += Phaser.Math.Clamp(target - player.x, -10, 10);
  }

  enterRecover(now, ms) {
    this.state = 'recover';
    this.stateEnd = now + ms * this.tempo;
    this.clearTint();
    this.playAnim('idle');
  }

  // ---------------------------------------------------------------------------
  // Choix + télégraphe des attaques
  // ---------------------------------------------------------------------------
  canRoarSpawn() {
    return typeof ENEMY_REGISTRY !== 'undefined' && typeof ENEMY_REGISTRY.mousse_creature === 'function'
      && this.minions.length < GHILT_MAX_MINIONS;
  }

  chooseAttack(player, now) {
    const dist = Math.abs(player.x - this.x);
    const w = dist > 380
      ? { charge: 3, spit: 3, breath: 0.5, roar: 1 }
      : { charge: 1, spit: 1.2, breath: 4, roar: 0.6 };
    // Rugissement = invocation : sans créature de mousse enregistrée, on saute.
    if (!this.canRoarSpawn() || now - this.lastRoarAt < 9000) w.roar = 0;
    if (this.lastAttack && w[this.lastAttack]) w[this.lastAttack] *= 0.3;
    const total = Object.values(w).reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (const [k, v] of Object.entries(w)) {
      r -= v;
      if (r <= 0) return k;
    }
    return 'charge';
  }

  // Couleur de télégraphe propre à chaque attaque : le joueur apprend à lire
  // ce qui arrive (rouge = charge, vert = souffle, jaune-vert = crachats).
  beginTelegraph(player, attack, now) {
    const TELE = {
      charge: { ms: 750, tint: 0xff7a5c, anim: 'charge' },
      breath: { ms: 650, tint: 0x9cff6b, anim: 'toxic_breath' },
      spit: { ms: 500, tint: 0xd8ff8a, anim: 'spit' },
      roar: { ms: 550, tint: 0xffd36b, anim: 'roar' },
    }[attack];
    this.facePlayer(player);
    this.state = 'telegraph';
    this.pendingAttack = attack;
    this.stateEnd = now + TELE.ms * this.tempo;
    this.setTint(TELE.tint);
    this.playAnim(TELE.anim);
    // Petit « gonflement » lisible même sans art.
    this.scene.tweens.add({
      targets: this, scaleY: this.scaleY * 1.05, duration: (TELE.ms * this.tempo) / 2, yoyo: true,
    });
    if (attack === 'charge') this.spawnDust(this.x - this.facing * this.displayWidth * 0.3, this.groundY, 5);
    if (attack === 'breath') this.spawnInhale(TELE.ms * this.tempo);
  }

  executeAttack(player, now) {
    const attack = this.pendingAttack;
    this.lastAttack = attack;
    this.pendingAttack = null;
    if (attack === 'charge') {
      this.state = 'charge';
      this.stateEnd = now + 2600;
      this.setBodyWorld(GHILT_BODY_W, GHILT_CHARGE_BODY_H);
      this.playAnim('charge');
    } else if (attack === 'breath') {
      this.state = 'breath';
      this.stateEnd = now + 1150 * this.tempo;
      this.addBreath(now, 1100 * this.tempo);
      this.playAnim('toxic_breath');
    } else if (attack === 'spit') {
      this.state = 'spit';
      const count = this.phase === 2 ? 4 : 3;
      this.stateEnd = now + (count * 220 + 300) * this.tempo;
      this.playAnim('spit');
      for (let i = 0; i < count; i++) {
        this.scene.time.delayedCall(i * 220 * this.tempo, () => {
          if (!this.active || this.locked) return;
          const spread = (i - (count - 1) / 2) * 120 + Phaser.Math.Between(-30, 30);
          this.addSpitBall(Phaser.Math.Clamp(player.x + spread, this.chargeMinX - 100, this.chargeMaxX + 100));
        });
      }
    } else if (attack === 'roar') {
      this.state = 'roar';
      this.stateEnd = now + 900;
      this.lastRoarAt = now;
      this.playAnim('roar');
      this.scene.cameras.main.shake(500, 0.01);
      this.spawnMinions(player);
    }
    this.clearTint();
  }

  // ---------------------------------------------------------------------------
  // Dangers : souffle (cône), boules de mousse (cloche), flaques
  // ---------------------------------------------------------------------------
  addBreath(now, ms) {
    const gfx = this.scene.add.graphics().setDepth(this.depth + 1);
    const hz = { kind: 'breath', until: now + ms, start: now, gfx, facing: this.facing, sprite: null };
    // Vrai art du souffle (start → idle) en plus du cône dessiné ; sans art,
    // le cône procédural suffit (plus lisible qu'un rectangle placeholder).
    if (hasManifestArt(this.scene, 'vfx_souffle_toxique')) {
      const s = this.snout();
      hz.sprite = addManifestSprite(this.scene, s.x, s.y, 'vfx_souffle_toxique', 'start', { origin: [0, 0.5] });
      hz.sprite.setFlipX(this.facing < 0).setDepth(this.depth + 1); // flipX miroite autour de l'origine
      hz.sprite.once('animationcomplete', () => hz.sprite.active && hz.sprite.playManifest('idle'));
    }
    this.hazards.push(hz);
  }

  breathTriangle(hz) {
    const s = this.snout();
    const len = 330;
    const far = s.x + hz.facing * len;
    return new Phaser.Geom.Triangle(s.x, s.y, far, s.y - 120, far, Math.max(s.y + 40, this.groundY + 10));
  }

  addSpitBall(targetX) {
    const s = this.snout();
    const g = this.scene.physics.world.gravity.y || 1300;
    const t = 0.95 * this.tempo;
    const vx = (targetX - s.x) / t;
    const vy = (this.groundY - s.y - 0.5 * g * t * t) / t;
    const obj = this.scene.add.circle(s.x, s.y, 11, 0x6bbf3a).setStrokeStyle(3, 0x1d3312).setDepth(this.depth + 1);
    this.hazards.push({ kind: 'ball', obj, vx, vy, g });
  }

  addPuddle(x) {
    const puddles = this.hazards.filter((h) => h.kind === 'puddle');
    if (puddles.length >= GHILT_MAX_PUDDLES) puddles[0].until = 0;
    const y = this.groundY;
    const w = 120;
    const now = this.scene.time.now;
    let obj;
    if (hasManifestArt(this.scene, 'vfx_flaque_mousse')) {
      obj = addManifestSprite(this.scene, x, y + 4, 'vfx_flaque_mousse', 'spawn');
      obj.once('animationcomplete', () => obj.active && obj.playManifest('idle'));
    } else {
      obj = this.scene.add.graphics();
      obj.fillStyle(0x2f5d1f, 0.9);
      obj.fillEllipse(x, y - 4, w, 22);
      obj.fillStyle(0x7fcf4a, 0.9);
      obj.fillCircle(x - 30, y - 8, 5);
      obj.fillCircle(x + 18, y - 6, 4);
      obj.fillCircle(x + 40, y - 9, 3);
    }
    obj.setDepth(this.depth + 1);
    this.hazards.push({ kind: 'puddle', obj, x, y, w, until: now + 4500 });
  }

  updateHazards(player, now, dt) {
    const pb = player.body;
    const playerRect = new Phaser.Geom.Rectangle(pb.x, pb.y, pb.width, pb.height);
    for (const hz of this.hazards) {
      if (hz.kind === 'breath') {
        if (now >= hz.until || this.locked) { hz.done = true; continue; }
        const tri = this.breathTriangle(hz);
        this.drawBreath(hz, tri, now);
        if (hz.sprite) { const s = this.snout(); hz.sprite.setPosition(s.x, s.y); }
        // + un bloc au pied du museau : collée à lui, Agarica ne passe pas sous le cône.
        const near = new Phaser.Geom.Rectangle(
          hz.facing > 0 ? tri.x1 - 40 : tri.x1 - 100, tri.y1 - 30, 140, Math.max(40, this.groundY - tri.y1 + 30),
        );
        if (Phaser.Geom.Intersects.RectangleToTriangle(playerRect, tri)
          || Phaser.Geom.Intersects.RectangleToRectangle(playerRect, near)) this.hurtPlayer(player, now);
      } else if (hz.kind === 'ball') {
        hz.vy += hz.g * dt;
        hz.obj.x += hz.vx * dt;
        hz.obj.y += hz.vy * dt;
        if (Phaser.Geom.Intersects.CircleToRectangle(new Phaser.Geom.Circle(hz.obj.x, hz.obj.y, 11), playerRect)) {
          this.hurtPlayer(player, now);
          hz.done = true;
        } else if (hz.vy > 0 && hz.obj.y >= this.groundY - 6) {
          this.addPuddle(hz.obj.x);
          hz.done = true;
        }
      } else if (hz.kind === 'puddle') {
        if (now >= hz.until) { hz.done = true; continue; }
        if (hz.until - now < 600) hz.obj.setAlpha((hz.until - now) / 600);
        const zone = new Phaser.Geom.Rectangle(hz.x - hz.w / 2, hz.y - 18, hz.w, 22);
        if (Phaser.Geom.Intersects.RectangleToRectangle(playerRect, zone)) {
          // Ralentit comme une toile (cf. Player.inWeb, remis à false à
          // chaque frame par Player.update) + blesse, avec un délai propre.
          player.inWeb = true;
          if (now >= this.nextPuddleHurtAt) {
            this.nextPuddleHurtAt = now + GHILT_PUDDLE_HURT_COOLDOWN;
            this.hurtPlayer(player, now);
          }
        }
      }
    }
    for (const hz of this.hazards) if (hz.done) this.destroyHazard(hz);
    this.hazards = this.hazards.filter((h) => !h.done);
  }

  drawBreath(hz, tri, now) {
    const g = hz.gfx;
    g.clear();
    const life = Phaser.Math.Clamp((now - hz.start) / 200, 0, 1);
    g.fillStyle(0x7fdc5a, 0.22 * life);
    g.fillTriangle(tri.x1, tri.y1, tri.x2, tri.y2, tri.x3, tri.y3);
    // Bouffées qui s'éloignent du museau (déterministes, pas de particules).
    for (let i = 0; i < 10; i++) {
      const t = ((now / 650) + i / 10) % 1;
      const px = tri.x1 + (tri.x2 - tri.x1) * t;
      const spread = ((i * 37) % 10) / 10 - 0.45;
      const py = tri.y1 + spread * 150 * t;
      g.fillStyle(i % 2 ? 0x9cff6b : 0x4f9a2c, 0.5 * (1 - t) * life);
      g.fillCircle(px, py, 8 + t * 24);
    }
  }

  destroyHazard(hz) {
    if (hz.gfx) hz.gfx.destroy();
    if (hz.obj) hz.obj.destroy();
    if (hz.sprite) hz.sprite.destroy();
  }

  clearHazards() {
    for (const hz of this.hazards) this.destroyHazard(hz);
    this.hazards = [];
  }

  hurtPlayer(player, now) {
    if (this.locked || player.isInvulnerable || now < this.nextPlayerHurtAt) return;
    this.nextPlayerHurtAt = now + GHILT_PLAYER_HURT_COOLDOWN;
    player.hitByEnemy();
  }

  spawnDust(x, y, n) {
    for (let i = 0; i < n; i++) {
      const d = this.scene.add.circle(x + Phaser.Math.Between(-30, 30), y - 6, Phaser.Math.Between(5, 10), 0x8a7a5a, 0.8);
      this.scene.tweens.add({
        targets: d, y: y - Phaser.Math.Between(20, 50), alpha: 0, scale: 1.8, duration: 600,
        onComplete: () => d.destroy(),
      });
    }
  }

  // Aspiration : brins de mousse attirés vers le museau (télégraphe du souffle).
  spawnInhale(ms) {
    const s = this.snout();
    for (let i = 0; i < 8; i++) {
      const sx = s.x + this.facing * Phaser.Math.Between(80, 240);
      const sy = s.y + Phaser.Math.Between(-90, 70);
      const p = this.scene.add.circle(sx, sy, 5, 0x9cff6b, 0.85).setDepth(this.depth + 1);
      this.scene.tweens.add({
        targets: p, x: s.x, y: s.y, alpha: 0.2, duration: ms * 0.9, delay: i * 30, ease: 'Quad.easeIn',
        onComplete: () => p.destroy(),
      });
    }
  }

  spawnMinions(player) {
    if (!this.canRoarSpawn()) return;
    const count = Math.min(GHILT_MAX_MINIONS - this.minions.length, this.phase === 2 ? 2 : 1);
    for (let i = 0; i < count; i++) {
      // Apparition côté opposé à Agarica : laisse le temps de réagir.
      const left = player.x > (this.minX + this.maxX) / 2;
      const x = left ? this.minX - 60 + i * 50 : this.maxX + 60 - i * 50;
      try {
        const m = ENEMY_REGISTRY.mousse_creature(this.scene, {
          type: 'mousse_creature', x, y: this.groundY - 10, patrolMinX: this.minX - 100, patrolMaxX: this.maxX + 100,
        });
        if (!m) continue;
        if (this.scene.enemies && !this.scene.enemies.contains(m)) this.scene.enemies.add(m);
        this.minions.push(m);
        this.spawnDust(x, this.groundY, 4);
      } catch (err) {
        console.warn('Ghilt: invocation mousse_creature impossible', err);
      }
    }
  }

  killMinions() {
    for (const m of this.minions) {
      if (m && m.active && !m.defeated && typeof m.defeat === 'function') m.defeat();
    }
    this.minions = [];
  }

  // ---------------------------------------------------------------------------
  // Dégâts, affaiblissement, soin
  // ---------------------------------------------------------------------------
  // Appelée par LevelKit (une fois par attaque/compétence). `source` libre :
  // { damage } prioritaire, sinon une compétence (kind/skillId) vaut 2.
  takeHit(source) {
    if (!this.scene || this.defeated || this.healed || this.locked) return;
    const now = this.scene.time.now;
    if (now < this.invulnUntil) return;
    this.invulnUntil = now + 220;
    let dmg = 1;
    if (source && typeof source === 'object') {
      if (typeof source.damage === 'number') dmg = source.damage;
      else if (source.kind === 'skill' || source.type === 'skill' || source.skillId) dmg = 2;
    }
    this.flashHit();
    if (this.state === 'weakened') {
      // PV plancher : les coups normaux ne l'achèvent pas, seul le soin conclut.
      return;
    }
    this.hp = Math.max(1, this.hp - dmg);
    if (this.phase === 1 && !this.thresholdFired && this.hp <= this.hpMax * GHILT_PHASE1_THRESHOLD) {
      this.thresholdFired = true;
      this.state = 'idle';
      this.setCinematic(true);
      this.clearHazards();
      this.scene.events.emit('ghilt-threshold', this);
    } else if (this.phase === 2 && this.hp <= this.hpMax * GHILT_WEAKENED_THRESHOLD) {
      this.becomeWeakened();
    }
  }

  flashHit() {
    const tint = this.tintTopLeft;
    const hadTint = this.isTinted;
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(90, () => {
      if (!this.active) return;
      if (this.state === 'weakened') this.setTint(0xb8b8a0);
      else if (hadTint) this.setTint(tint);
      else this.clearTint();
    });
  }

  becomeWeakened() {
    if (this.state === 'weakened') return;
    this.state = 'weakened';
    this.harmless = true;
    this.setBodyWorld(GHILT_BODY_W, GHILT_BODY_H);
    this.clearHazards();
    this.killMinions();
    this.setVelocityX(0);
    this.setTint(0xb8b8a0);
    this.playAnim('weakened');
    // Halètement : respiration lente bien visible, même en placeholder.
    this.pantTween = this.scene.tweens.add({
      targets: this, scaleY: this.scaleY * 0.95, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
    this.scene.events.emit('ghilt-weakened', this);
  }

  // Filet de sécurité : une nuée de papillons lancée AVANT l'affaiblissement
  // a déjà « consommé » Ghil't (refus) ; si elle est encore là quand il
  // vacille, elle le soigne quand même (getHealHitbox, agent Formes).
  updateWeakenedHealCheck(player) {
    if (this.state !== 'weakened' || this.healed) return;
    const hb = typeof player.getHealHitbox === 'function' ? player.getHealHitbox() : null;
    if (hb && Phaser.Geom.Intersects.RectangleToRectangle(hb, this.getBounds())) this.heal(player);
  }

  // Contrat PLAN_DEV : appelée par SKILL_DEFS.papillon.onHitEnemy sur un
  // ennemi `corrupted`. N'est acceptée QUE quand Ghil't est affaibli.
  heal() {
    if (!this.scene || this.healed || this.defeated) return false;
    if (this.state !== 'weakened') {
      this.scene.events.emit('ghilt-heal-refused', this);
      return false;
    }
    this.healed = true;
    this.corrupted = false;
    this.harmless = true;
    if (this.pantTween) this.pantTween.stop();
    this.clearHazards();
    this.scene.events.emit('ghilt-healed', this);
    return true;
  }

  // LevelKit d'avant la Fondation appelle defeat() à chaque coup : un boss ne
  // meurt jamais ainsi, on redirige vers takeHit(). Sortie réelle : removeFromFight().
  defeat() {
    this.takeHit({});
  }

  removeFromFight() {
    if (this.defeated) return;
    this.defeated = true;
    this.clearHazards();
    this.killMinions();
    if (this.pantTween) this.pantTween.stop();
    if (this.body) this.body.enable = false;
    this.destroy();
  }
}

if (typeof ENEMY_REGISTRY !== 'undefined') {
  // Rarement posé via `enemies` (le script de l'arène le crée lui-même),
  // mais disponible pour l'éditeur / des tests.
  ENEMY_REGISTRY.ghilt = (scene, e) => {
    const boss = new Ghilt(scene, e.x, e.y, { phase: e.phase, hp: e.hp, minX: e.patrolMinX, maxX: e.patrolMaxX });
    boss.setCinematic(false); // sans script : combat immédiat
    return boss;
  };
}
