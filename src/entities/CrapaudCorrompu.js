// Crapaud corrompu (soignable) — agent Ennemis.
//
// Hérite de toute la logique du Crapaud (fixe, langue qui s'étire avec sa
// hitbox, cf. Crapaud.js). Différences : corrompu (heal()), 2 PV, et
// apparence : art `crapaud_corrompu` du manifest s'il existe (anim `attack`
// de 5 frames, MÊME découpe/canvas que crapaud_frames), sinon le crapaud
// normal teinté vert toxique + aura + gouttes. Une fois soigné, il reprend
// l'apparence du crapaud sain et s'éloigne en sautillant.
const CRAPAUD_CORROMPU_EXTEND_KEY = 'crapaud_corrompu-extend';
const CRAPAUD_CORROMPU_RETRACT_KEY = 'crapaud_corrompu-retract';

function ensureCrapaudCorrompuArtAnims(scene) {
  if (scene.anims.exists(CRAPAUD_CORROMPU_EXTEND_KEY)) return;
  const frames = [];
  for (let i = 0; i < CRAPAUD_FRAME_COUNT; i++) {
    const key = manifestFrameKey('crapaud_corrompu', 'attack', i);
    frames.push({ key: scene.textures.exists(key) ? key : `crapaud-${i}` });
  }
  scene.anims.create({ key: CRAPAUD_CORROMPU_EXTEND_KEY, frames, frameRate: CRAPAUD_FRAME_RATE, repeat: 0 });
  scene.anims.create({ key: CRAPAUD_CORROMPU_RETRACT_KEY, frames: frames.slice().reverse(), frameRate: CRAPAUD_FRAME_RATE, repeat: 0 });
}

class CrapaudCorrompu extends Crapaud {
  constructor(scene, x, y, { hp = 2 } = {}) {
    super(scene, x, y);
    this.corrupted = true;
    this.hp = hp;
    this.maxHp = hp;
    this.nextDrip = 0;
    // Art sans pose miroir et origine décalée (cf. Crapaud.js) : pas de flip.
    this.noFlipOnPurify = true;

    this.hasCorruptArt = enemyHasManifestArt(scene, 'crapaud_corrompu');
    if (this.hasCorruptArt) {
      ensureCrapaudCorrompuArtAnims(scene);
      this.idleTextureKey = manifestFrameKey('crapaud_corrompu', 'attack', 0);
      this.extendAnimKey = CRAPAUD_CORROMPU_EXTEND_KEY;
      this.retractAnimKey = CRAPAUD_CORROMPU_RETRACT_KEY;
      this.setTexture(this.idleTextureKey);
    } else {
      this.setTint(CORRUPTION_TINT);
      // Aura toxique pulsée sous le crapaud (additive, suit le corps).
      ensureGlowDotTexture(scene);
      this.aura = scene.add.image(x, y, FX_GLOW_DOT_KEY)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setTint(CORRUPTION_TINT)
        .setAlpha(0.35)
        .setScale(2.6, 1.6);
      scene.tweens.add({ targets: this.aura, alpha: 0.6, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.once('destroy', () => this.aura && this.aura.destroy());
    }
  }

  restoreTint() {
    if (this.hasCorruptArt) this.clearTint();
    else this.setTint(CORRUPTION_TINT);
  }

  // Centre du corps (pas du canvas, qui inclut la langue à l'apogée).
  bodyCenterX() {
    return this.body ? this.body.x + (CRAPAUD_FRAME_REACH[0] * CRAPAUD_SCALE) / 2 : this.x;
  }

  update(player) {
    if (this.defeated) return;
    if (this.scene.time.now < (this.stunnedUntil || 0)) {
      this.setVelocityX(0);
    } else {
      super.update(player);
    }
    const cx = this.bodyCenterX();
    if (this.aura) this.aura.setPosition(cx, this.body.bottom - 14).setDepth(this.depth - 1);
    const now = this.scene.time.now;
    if (now > this.nextDrip) {
      this.nextDrip = now + Phaser.Math.Between(400, 800);
      spawnToxicDrip(this.scene, cx + Phaser.Math.Between(-14, 14), this.body.bottom - 22, this.depth + 1);
    }
  }

  takeHit(source) {
    corruptedTakeHit(this, source, { knockX: 0, knockY: -120 });
  }

  // Retour à l'apparence du crapaud sain (frames d'origine, sans teinte).
  onPurify() {
    this.anims.stop();
    if (this.aura) {
      this.scene.tweens.killTweensOf(this.aura);
      this.scene.tweens.add({ targets: this.aura, alpha: 0, duration: 300, onComplete: () => this.aura && this.aura.destroy() });
    }
  }

  heal() {
    return purifyCorruptedEnemy(this, {
      onClean: (e) => e.setTexture('crapaud-0'),
      fleeDistance: 220,
    });
  }

  defeat() {
    if (this.defeated) return;
    if (this.aura) this.aura.destroy();
    this.aura = null;
    super.defeat();
  }
}

if (typeof ENEMY_REGISTRY !== 'undefined') {
  ENEMY_REGISTRY.crapaud_corrompu = (scene, e) => new CrapaudCorrompu(scene, e.x, e.y, { hp: e.hp ?? 2 });
}
