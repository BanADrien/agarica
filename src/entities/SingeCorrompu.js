// Singe corrompu (sbire lanceur du grand arbre) — agent Ennemis.
//
// Comportement simple et lisible (GDD : pas de vraie IA) : patrouille ; dès
// qu'Agarica est en vue, garde ses distances (recule si elle s'approche,
// avance si elle s'éloigne), puis s'arrête, lève une pierre au-dessus de sa
// tête (télégraphe ~0,5 s) et la lance en cloche vers elle. 2 PV, corrompu.
const SINGE_TEXTURE_KEY = 'singe-corrompu-placeholder';
const SINGE_THROW_TEXTURE_KEY = 'singe-corrompu-lance';
const SINGE_HEALED_TEXTURE_KEY = 'singe-sain';
const SINGE_STONE_TEXTURE_KEY = 'singe-corrompu-pierre';
const SINGE_WIDTH = 44;
const SINGE_HEIGHT = 58; // marge au-dessus de la tête pour la pierre levée
const SINGE_BODY_W = 24;
const SINGE_BODY_H = 36;

// Dessine un singe de profil (face à droite). `moss` : plaques de mousse
// toxique ; `armUp` : bras levé tenant une pierre (pose de lancer).
function drawSingeSilhouette(g, { fur, belly, moss, armUp, eye }) {
  const h = SINGE_HEIGHT;
  // Queue enroulée derrière (à gauche).
  g.lineStyle(4, fur, 1);
  g.beginPath();
  g.arc(9, h - 18, 7, Math.PI * 0.1, Math.PI * 1.4, false);
  g.strokePath();
  // Jambes.
  g.fillStyle(fur, 1);
  g.fillRoundedRect(15, h - 12, 6, 12, 3);
  g.fillRoundedRect(25, h - 12, 6, 12, 3);
  // Corps + ventre.
  g.fillEllipse(23, h - 20, 20, 22);
  g.fillStyle(belly, 1);
  g.fillEllipse(26, h - 19, 10, 14);
  // Tête, oreille, museau.
  g.fillStyle(fur, 1);
  g.fillCircle(28, h - 36, 9);
  g.fillCircle(21, h - 38, 4);
  g.fillStyle(belly, 1);
  g.fillEllipse(33, h - 34, 9, 8);
  g.fillStyle(eye, 1);
  g.fillCircle(31, h - 38, 1.8);
  // Bras.
  g.fillStyle(fur, 1);
  if (armUp) {
    g.fillRoundedRect(17, h - 46, 5, 18, 2);
    g.fillStyle(0x7a7468, 1);
    g.fillCircle(19, h - 47, 4.5);
    g.fillStyle(CORRUPTION_TINT, 1);
    g.fillCircle(18, h - 49, 1.4);
  } else {
    g.fillRoundedRect(27, h - 27, 5, 14, 2);
  }
  if (moss) {
    g.fillStyle(0x2f6a1a, 1);
    g.fillCircle(17, h - 24, 5);
    g.fillCircle(24, h - 43, 4);
    g.fillStyle(CORRUPTION_TINT, 1);
    g.fillCircle(16, h - 26, 2);
    g.fillCircle(25, h - 44, 1.6);
    g.fillEllipse(16, h - 17, 2.5, 5);
    g.fillEllipse(22, h - 7, 2.5, 4);
  }
}

function ensureSingeTextures(scene) {
  const variants = [
    [SINGE_TEXTURE_KEY, { fur: 0x553049, belly: 0x8a6272, moss: true, armUp: false, eye: 0xb6ff4a }],
    [SINGE_THROW_TEXTURE_KEY, { fur: 0x553049, belly: 0x8a6272, moss: true, armUp: true, eye: 0xeaff6a }],
    [SINGE_HEALED_TEXTURE_KEY, { fur: 0x8a5a32, belly: 0xe2b98a, moss: false, armUp: false, eye: 0x1b1410 }],
  ];
  for (const [key, opts] of variants) {
    if (scene.textures.exists(key)) continue;
    const g = scene.add.graphics();
    drawSingeSilhouette(g, opts);
    g.generateTexture(key, SINGE_WIDTH, SINGE_HEIGHT);
    g.destroy();
  }
  if (!scene.textures.exists(SINGE_STONE_TEXTURE_KEY)) {
    const g = scene.add.graphics();
    g.fillStyle(0x6e6a60, 1);
    g.fillCircle(6, 6, 5.5);
    g.fillStyle(0x9a958a, 1);
    g.fillCircle(4.5, 4.5, 2);
    g.fillStyle(CORRUPTION_TINT, 1);
    g.fillCircle(8, 7.5, 1.5);
    g.generateTexture(SINGE_STONE_TEXTURE_KEY, 12, 12);
    g.destroy();
  }
}

// Pierre lancée en cloche : blesse Agarica au contact (player.hitByEnemy),
// se brise au sol, disparaît au bout de 4 s par sécurité. Calcul balistique
// simple : durée de vol T selon la distance, vitesse initiale qui retombe
// pile sur la cible avec la gravité du monde.
function throwSingeStone(scene, x, y, targetX, targetY) {
  ensureSingeTextures(scene);
  const stone = scene.physics.add.image(x, y, SINGE_STONE_TEXTURE_KEY);
  stone.setCircle(5, 1, 1);
  stone.setDepth(6);
  const g = scene.physics.world.gravity.y || 1300;
  const dx = targetX - x;
  const dy = targetY - y;
  const T = Phaser.Math.Clamp(Math.abs(dx) / 320, 0.6, 1.2);
  stone.setVelocity(dx / T, (dy - 0.5 * g * T * T) / T);
  stone.setAngularVelocity(dx >= 0 ? 540 : -540);

  const colliders = [];
  const shatter = () => {
    if (!stone.active) return;
    for (let i = 0; i < 5; i++) {
      const chip = scene.add.rectangle(stone.x, stone.y, 3, 3, 0x8a857a).setDepth(6);
      scene.tweens.add({
        targets: chip,
        x: chip.x + Phaser.Math.Between(-16, 16),
        y: chip.y - Phaser.Math.Between(4, 14),
        alpha: 0,
        duration: 320,
        onComplete: () => chip.destroy(),
      });
    }
    stone.destroy();
  };
  if (scene.player) {
    colliders.push(scene.physics.add.overlap(stone, scene.player, () => {
      if (!scene.player.isInvulnerable && scene.player.hitByEnemy) scene.player.hitByEnemy();
      shatter();
    }));
  }
  if (scene.ground) colliders.push(scene.physics.add.collider(stone, scene.ground, shatter));
  stone.once('destroy', () => colliders.forEach((c) => c.destroy()));
  scene.time.delayedCall(4000, shatter);
  return stone;
}

class SingeCorrompu extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, { patrolMinX, patrolMaxX, hp = 2 } = {}) {
    const useArt = enemyHasManifestArt(scene, 'singe_corrompu');
    ensureSingeTextures(scene);
    super(scene, x, y, useArt ? manifestInitialTexture(scene, 'singe_corrompu', 'idle') : SINGE_TEXTURE_KEY);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    if (useArt) {
      applyEnemyManifestArt(this, 'singe_corrompu', SINGE_BODY_W, SINGE_BODY_H);
      enemyPlayArt(this, 'idle');
    } else {
      this.setSize(SINGE_BODY_W, SINGE_BODY_H);
      this.setOffset((SINGE_WIDTH - SINGE_BODY_W) / 2, SINGE_HEIGHT - SINGE_BODY_H);
    }

    this.corrupted = true;
    this.hp = hp;
    this.maxHp = hp;
    this.patrolMinX = patrolMinX ?? x - 200;
    this.patrolMaxX = patrolMaxX ?? x + 200;
    this.patrolSpeed = 50;
    this.runSpeed = 130;
    this.aggroRangeX = 520;
    this.aggroRangeY = 240;
    this.keepMin = 170; // recule en dessous
    this.keepMax = 360; // avance au-dessus
    this.throwRange = 480;
    this.throwCooldown = 2200;
    this.windupMs = 520;
    this.lastThrow = -Infinity;
    this.state = 'roam'; // roam | windup | throw
    this.stateEnd = 0;
    this.direction = 1;
    this.defeated = false;
    this.nextDrip = 0;
  }

  restoreTint() {
    this.clearTint();
  }

  face(dir) {
    this.direction = dir;
    this.setFlipX(dir < 0);
  }

  setPose(pose) {
    if (this.useManifestArt) enemyPlayArt(this, pose);
    else this.setTexture(pose === 'throw' ? SINGE_THROW_TEXTURE_KEY : SINGE_TEXTURE_KEY);
  }

  update(player) {
    if (this.defeated || !player) return;
    const now = this.scene.time.now;
    if (now > this.nextDrip) {
      this.nextDrip = now + Phaser.Math.Between(700, 1200);
      spawnToxicDrip(this.scene, this.x + Phaser.Math.Between(-8, 8), this.body.bottom - 14, this.depth);
    }
    if (now < (this.stunnedUntil || 0)) return;

    const dx = player.x - this.x;
    const adx = Math.abs(dx);
    const inAggro = adx < this.aggroRangeX && Math.abs(player.y - this.y) < this.aggroRangeY;

    if (this.state === 'windup') {
      this.setVelocityX(0);
      this.face(dx >= 0 ? 1 : -1);
      if (now >= this.stateEnd) {
        const hand = this.getTopCenter();
        const tb = player.body;
        throwSingeStone(this.scene, hand.x, hand.y + 4, player.x, tb ? tb.center.y : player.y - 30);
        this.lastThrow = now;
        this.state = 'throw';
        this.stateEnd = now + 260;
        this.setPose('idle');
        this.angle = 0;
      } else {
        // Télégraphe : petit tremblement, pierre levée.
        this.angle = Math.sin(now / 30) * 4;
      }
      return;
    }
    if (this.state === 'throw') {
      this.setVelocityX(0);
      if (now >= this.stateEnd) this.state = 'roam';
      return;
    }

    // Patrouille / maintien de distance.
    let vx;
    if (!inAggro) {
      if (this.x <= this.patrolMinX) this.direction = 1;
      else if (this.x >= this.patrolMaxX) this.direction = -1;
      vx = this.direction * this.patrolSpeed;
      this.face(this.direction);
    } else {
      const toward = dx >= 0 ? 1 : -1;
      if (adx < this.keepMin) vx = -toward * this.runSpeed;
      else if (adx > this.keepMax) vx = toward * this.runSpeed * 0.8;
      else vx = 0;
      // Toujours tourné vers Agarica (même en reculant) : lisible.
      this.face(toward);
      if (adx < this.throwRange && now - this.lastThrow > this.throwCooldown) {
        this.state = 'windup';
        this.stateEnd = now + this.windupMs;
        this.setVelocityX(0);
        this.setPose('throw');
        return;
      }
    }
    if ((vx < 0 && this.x <= this.patrolMinX) || (vx > 0 && this.x >= this.patrolMaxX)) vx = 0;
    this.setVelocityX(vx);
    this.angle = vx !== 0 ? Math.sin(now / 70) * 5 : 0;
    if (this.useManifestArt) enemyPlayArt(this, vx !== 0 ? 'run' : 'idle');
  }

  takeHit(source) {
    if (this.state === 'windup') {
      // Un coup interrompt le lancer.
      this.state = 'roam';
      this.setPose('idle');
      this.lastThrow = this.scene.time.now;
    }
    this.angle = 0;
    corruptedTakeHit(this, source);
  }

  heal() {
    this.angle = 0;
    return purifyCorruptedEnemy(this, {
      onClean: (e) => {
        e.anims.stop();
        e.setTexture(SINGE_HEALED_TEXTURE_KEY);
        e.setScale(1);
      },
      fleeDistance: 260,
    });
  }

  defeat() {
    if (this.defeated) return;
    this.angle = 0;
    enemyFadeOutDefeat(this);
  }
}

if (typeof ENEMY_REGISTRY !== 'undefined') {
  ENEMY_REGISTRY.singe_corrompu = (scene, e) => new SingeCorrompu(scene, e.x, e.y, {
    patrolMinX: e.patrolMinX, patrolMaxX: e.patrolMaxX, hp: e.hp ?? 2,
  });
}
