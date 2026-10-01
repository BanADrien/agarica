const LOUP_TEXTURE_KEY = 'loup-sanguinaire-placeholder';
const LOUP_WIDTH = 36;
const LOUP_HEIGHT = 22;

// ---------------------------------------------------------------------------
// Helpers partagés par tous les ennemis (ce fichier est le premier ennemi
// chargé par index.html) : bascule placeholder dessiné par code → art du
// manifest Codex dès qu'il existe, sans changer la hitbox ni le gameplay.
// ---------------------------------------------------------------------------
function enemyHasManifestArt(scene, id) {
  return typeof hasManifestArt === 'function' && hasManifestArt(scene, id);
}

// Applique l'art du manifest à un ennemi Arcade déjà construit : anims,
// échelle du manifest, et corps physique gardé à la taille MONDE (bodyW x
// bodyH px) du placeholder — l'art peut être plus grand visuellement, le
// combat ne change pas. `anchor` : 'bottom' (ennemi au sol) ou 'center'.
function applyEnemyManifestArt(sprite, id, bodyW, bodyH, anchor = 'bottom') {
  const def = getAssetManifest()[id] || {};
  const s = def.scale || 1;
  ensureManifestAnims(sprite.scene, id);
  attachPlayManifest(sprite, id);
  sprite.setScale(s);
  const bw = bodyW / s;
  const bh = bodyH / s;
  sprite.body.setSize(bw, bh);
  const fw = sprite.width;
  const fh = sprite.height;
  sprite.body.setOffset((fw - bw) / 2, anchor === 'bottom' ? fh - bh : (fh - bh) / 2);
  sprite.useManifestArt = true;
  return sprite;
}

// Joue une anim du manifest si l'ennemi utilise l'art (no-op sinon).
function enemyPlayArt(sprite, anim) {
  if (sprite.useManifestArt && sprite.playManifest) sprite.playManifest(anim);
}

// Disparition commune « vaincu » (fondu + rétrécissement), idempotente.
function enemyFadeOutDefeat(sprite, duration = 200) {
  if (sprite.defeated) return;
  sprite.defeated = true;
  if (sprite.body) {
    sprite.setVelocity(0, 0);
    sprite.body.enable = false;
  }
  sprite.scene.tweens.add({
    targets: sprite,
    alpha: 0,
    scaleX: sprite.scaleX * 0.6,
    scaleY: sprite.scaleY * 0.6,
    duration,
    onComplete: () => sprite.destroy(),
  });
}

// Silhouette basse et sombre, teinte rougeâtre (yeux + contour) pour bien
// se distinguer de la forme Loup d'Agarica (contour vert/rose).
function ensureLoupTexture(scene) {
  if (scene.textures.exists(LOUP_TEXTURE_KEY)) return;

  const g = scene.add.graphics();

  g.fillStyle(0x120a0c, 1);
  g.fillTriangle(2, LOUP_HEIGHT - 4, 10, LOUP_HEIGHT - 18, 10, LOUP_HEIGHT - 4);
  g.fillRoundedRect(4, 2, LOUP_WIDTH - 8, LOUP_HEIGHT - 6, 8);
  g.fillTriangle(LOUP_WIDTH - 16, 4, LOUP_WIDTH - 12, -4, LOUP_WIDTH - 8, 4);
  g.fillTriangle(LOUP_WIDTH - 26, 4, LOUP_WIDTH - 22, -4, LOUP_WIDTH - 18, 4);

  g.lineStyle(1.5, 0x7a2030, 1);
  g.strokeRoundedRect(5, 3, LOUP_WIDTH - 10, LOUP_HEIGHT - 8, 8);

  g.fillStyle(0xff3d4d, 1);
  g.fillCircle(LOUP_WIDTH - 11, LOUP_HEIGHT / 2 - 2, 1.8);

  g.generateTexture(LOUP_TEXTURE_KEY, LOUP_WIDTH, LOUP_HEIGHT);
  g.destroy();
}

// Distance à laquelle le loup « mord » (anim bite si art) pendant la charge.
const LOUP_BITE_RANGE = 46;

class LoupSanguinaire extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, patrolMinX, patrolMaxX) {
    const useArt = enemyHasManifestArt(scene, 'loup_sanguinaire');
    if (!useArt) ensureLoupTexture(scene);
    super(scene, x, y, useArt ? manifestInitialTexture(scene, 'loup_sanguinaire', 'patrol') : LOUP_TEXTURE_KEY);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    if (useArt) {
      applyEnemyManifestArt(this, 'loup_sanguinaire', LOUP_WIDTH - 8, LOUP_HEIGHT - 6);
      enemyPlayArt(this, 'patrol');
    } else {
      this.setSize(LOUP_WIDTH - 8, LOUP_HEIGHT - 6);
      this.setOffset(4, 3);
    }
    this.setCollideWorldBounds(false);

    this.patrolMinX = patrolMinX;
    this.patrolMaxX = patrolMaxX;
    this.patrolSpeed = 60;
    this.chargeSpeed = 260;
    this.detectionRangeX = 220;
    this.detectionRangeY = 40;
    this.direction = 1;
    this.isCharging = false;
    this.defeated = false;
  }

  update(player) {
    if (this.defeated) return;

    const dx = player.x - this.x;
    const dy = Math.abs(player.y - this.y);

    if (!this.isCharging && Math.abs(dx) < this.detectionRangeX && dy < this.detectionRangeY) {
      this.isCharging = true;
      this.direction = dx > 0 ? 1 : -1;
    }

    if (this.x <= this.patrolMinX) {
      this.direction = 1;
      this.isCharging = false;
    } else if (this.x >= this.patrolMaxX) {
      this.direction = -1;
      this.isCharging = false;
    }

    const speed = this.isCharging ? this.chargeSpeed : this.patrolSpeed;
    this.setVelocityX(this.direction * speed);
    this.setFlipX(this.direction < 0);

    if (this.useManifestArt) {
      const biting = this.isCharging && Math.abs(dx) < LOUP_BITE_RANGE && dy < this.detectionRangeY;
      enemyPlayArt(this, biting ? 'bite' : (this.isCharging ? 'charge' : 'patrol'));
    } else {
      // Télégraphe de la charge sur le placeholder : silhouette rougie.
      if (this.isCharging) this.setTint(0xff9a9a);
      else this.clearTint();
    }
  }

  // 1 PV : meurt en un coup de dague (cf. GDD section 6).
  defeat() {
    enemyFadeOutDefeat(this);
  }
}

if (typeof ENEMY_REGISTRY !== 'undefined') {
  ENEMY_REGISTRY.loup = (scene, e) => new LoupSanguinaire(
    scene, e.x, e.y, e.patrolMinX ?? e.x - 150, e.patrolMaxX ?? e.x + 150,
  );
}
