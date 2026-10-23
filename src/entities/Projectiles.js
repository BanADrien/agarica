// Projectiles du joueur + compétences instantanées — agent Formes.
// Chargé APRÈS Player.js (cf. index.html) : complète SKILL_DEFS comme
// Crapaud.js. Compétences « instantanées » : `onActivate(player, now)` fait
// tout (cf. Player.tryActivateSkill), pas de transformation ni de hitbox
// getSkillHitbox() -- les collisions sont gérées ici, auto-suffisantes.
//
// Contrat combat (cf. PLAN_DEV.md) : `SKILL_DEFS[id].onHitEnemy(player, enemy)`
// optionnel. Si une boucle générique (LevelKit) applique un jour une hitbox
// de compétence aux ennemis, elle DOIT appeler onHitEnemy quand il existe au
// lieu de takeHit/defeat (papillon : soigne, ne blesse jamais).

// ---------------------------------------------------------------------------
// Pierre (talisman du singe) : lancer en cloche, détruite au sol.
// ---------------------------------------------------------------------------
const PIERRE_SPEED_X = 400;
const PIERRE_SPEED_Y = -430;
const PIERRE_LIFESPAN_MS = 2500;
const PIERRE_DISPLAY_SIZE = 18;
const PIERRE_FALLBACK_KEY = 'fx-pierre';

function pierreTextureKey(scene) {
  if (scene.textures.exists('item-pierre')) return 'item-pierre';
  if (!scene.textures.exists(PIERRE_FALLBACK_KEY)) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x6d6a74, 1);
    g.fillEllipse(9, 8, 17, 14);
    g.fillStyle(0x9a97a3, 1);
    g.fillEllipse(6.5, 5.5, 7, 5);
    g.generateTexture(PIERRE_FALLBACK_KEY, 18, 16);
    g.destroy();
  }
  return PIERRE_FALLBACK_KEY;
}

class PierreProjectile extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, dir, inheritVx = 0) {
    super(scene, x, y, pierreTextureKey(scene));
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.kind = 'pierre'; // source passée à enemy.takeHit(source)
    this.owner = scene.player;
    this.setScale(PIERRE_DISPLAY_SIZE / Math.max(this.width, this.height));
    // Effets du joueur (pierre, éclats, nuée) : au niveau des personnages,
    // devant les décors (cf. CHARACTER_DEPTH dans LevelKit.js).
    this.setDepth(CHARACTER_DEPTH);
    this.body.setCircle(Math.min(this.width, this.height) / 2);
    this.setVelocity(dir * PIERRE_SPEED_X + inheritVx * 0.3, PIERRE_SPEED_Y);
    this.setAngularVelocity(dir * 540);
    this.done = false;

    scene.time.delayedCall(PIERRE_LIFESPAN_MS, () => this.shatter());
    if (scene.ground) scene.physics.add.collider(this, scene.ground, () => this.shatter());
    if (scene.enemies) {
      scene.physics.add.overlap(this, scene.enemies, (stone, enemy) => {
        if (this.done || enemy.defeated) return;
        if (typeof enemy.takeHit === 'function') enemy.takeHit(this);
        else if (typeof enemy.defeat === 'function') enemy.defeat();
        if (scene.player) scene.player.gainEnergy(ENERGY_PER_HIT);
        this.shatter();
      });
    }
  }

  shatter() {
    if (this.done || !this.active) return;
    this.done = true;
    const scene = this.scene;
    if (hasManifestArt(scene, 'vfx_impact_pierre')) {
      const fx = addManifestSprite(scene, this.x, this.y + 6, 'vfx_impact_pierre', 'idle').setDepth(CHARACTER_DEPTH + 1);
      fx.once('animationcomplete', () => fx.destroy());
    }
    for (let i = 0; i < 5; i++) {
      const chip = scene.add.circle(this.x, this.y, 2.5, 0x8a8794, 1).setDepth(CHARACTER_DEPTH + 1);
      scene.tweens.add({
        targets: chip,
        x: this.x + Phaser.Math.Between(-22, 22),
        y: this.y + Phaser.Math.Between(-20, 4),
        alpha: 0,
        duration: 280,
        onComplete: () => chip.destroy(),
      });
    }
    this.destroy();
  }
}

SKILL_DEFS.pierre = {
  label: 'Pierre — Lancer',
  hudColor: 0x8a8794,
  cost: 20,
  cooldownMs: 350,
  onActivate(player, now) {
    player.throwPoseUntil = now + THROW_POSE_MS;
    const dir = player.facingDir >= 0 ? 1 : -1;
    new PierreProjectile(player.scene, player.x + dir * 18, player.y - 52, dir, player.body.velocity.x);
  },
};

// ---------------------------------------------------------------------------
// Papillon (soin) : nuée lumineuse devant Agarica. Sur un ennemi
// `corrupted` → enemy.heal() (une fois par lancer) ; sinon aucun effet.
// Retour utilisateur (« la compétence n'a pas de forme ») : art Codex
// branché et LISIBLE -- anneau `vfx_soin_papillon` (swirl) étiré pour que ses
// pixels visibles couvrent EXACTEMENT la zone de soin, papillons `papillon`
// (idle) qui tournent SUR cet anneau ; la zone de soin = ce cercle affiché.
// Sans art : papillons dessinés par code dans le même rectangle.
// ---------------------------------------------------------------------------
const PAPILLON_DURATION_MS = 1000;
const PAPILLON_SPEED = 170;
// Zone de soin (quasi ronde, comme l'anneau de l'art), centrée devant elle.
const PAPILLON_RECT_W = 136;
const PAPILLON_RECT_H = 128;
const PAPILLON_FRONT = 64;
const PAPILLON_CENTER_ABOVE_FEET = 56;
const PAPILLON_COUNT = 14;
// Avec l'art : quelques grands papillons en orbite sur l'anneau.
const PAPILLON_ART_COUNT = 6;
const PAPILLON_ART_SIZE = 30;
const PAPILLON_ORBIT_SPEED = 3.2; // rad/s
const PAPILLON_COLORS = [0x9ff3ff, 0xffb3f0, 0xfff6a0, 0xc8ffb0];
const PAPILLON_TEXTURE_KEY = 'fx-papillon';
const PAPILLON_GLOW_KEY = 'fx-papillon-glow';

// Pixels visibles de l'anneau `vfx_soin_papillon` (union des frames de swirl).
function papillonSwirlBox(scene) {
  if (typeof textureOpaqueBox !== 'function' || typeof manifestFrameKey !== 'function') return null;
  let res = null;
  for (let i = 0; i < 4; i++) {
    const b = textureOpaqueBox(scene, manifestFrameKey('vfx_soin_papillon', 'swirl', i));
    if (!b) continue;
    res = res ? { x0: Math.min(res.x0, b.x0), y0: Math.min(res.y0, b.y0), x1: Math.max(res.x1, b.x1), y1: Math.max(res.y1, b.y1), w: b.w, h: b.h } : { ...b };
  }
  return res;
}

function ensurePapillonTextures(scene) {
  if (!scene.textures.exists(PAPILLON_TEXTURE_KEY)) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff, 1);
    g.fillEllipse(5, 5, 9, 8);
    g.fillEllipse(13, 5, 9, 8);
    g.fillEllipse(6, 11, 6, 5);
    g.fillEllipse(12, 11, 6, 5);
    g.fillRect(8.5, 3, 1.2, 10);
    g.generateTexture(PAPILLON_TEXTURE_KEY, 18, 15);
    g.destroy();
  }
  if (!scene.textures.exists(PAPILLON_GLOW_KEY)) {
    const size = 64;
    const tex = scene.textures.createCanvas(PAPILLON_GLOW_KEY, size, size);
    const ctx = tex.getContext();
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, 'rgba(255,255,255,0.9)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    tex.refresh();
  }
}

// Nuée : objet logique + sprites, mis à jour via scene.events 'update'
// (pas de groupe à câbler dans les scènes). `rect` = zone de soin courante.
class PapillonSwarm {
  constructor(scene, player) {
    ensurePapillonTextures(scene);
    this.scene = scene;
    this.player = player;
    this.dir = player.facingDir >= 0 ? 1 : -1;
    this.cx = player.x + this.dir * PAPILLON_FRONT;
    this.cy = player.y - PAPILLON_CENTER_ABOVE_FEET;
    this.rect = new Phaser.Geom.Rectangle(0, 0, PAPILLON_RECT_W, PAPILLON_RECT_H);
    this.elapsed = 0;
    this.active = true;
    this.healed = new Set();
    this.glow = scene.add.image(this.cx, this.cy, PAPILLON_GLOW_KEY)
      .setBlendMode(Phaser.BlendModes.ADD).setTint(0xbff8ff).setAlpha(0).setDepth(CHARACTER_DEPTH + 1);
    this.glow.setDisplaySize(PAPILLON_RECT_W * 1.25, PAPILLON_RECT_H * 1.25);
    // Anneau : affiché à la taille où ses pixels VISIBLES (union des frames
    // de `swirl`) remplissent le rectangle de soin.
    this.swirl = null;
    if (hasManifestArt(scene, 'vfx_soin_papillon', 'swirl')) {
      ensureManifestAnims(scene, 'vfx_soin_papillon');
      this.swirl = addManifestSprite(scene, this.cx, this.cy, 'vfx_soin_papillon', 'swirl', { origin: [0.5, 0.5] })
        .setAlpha(0).setDepth(CHARACTER_DEPTH + 1);
      const box = papillonSwirlBox(scene);
      const kx = box ? box.w / (box.x1 - box.x0) : 1.12;
      const ky = box ? box.h / (box.y1 - box.y0) : 1.12;
      this.swirl.setDisplaySize(PAPILLON_RECT_W * kx, PAPILLON_RECT_H * ky);
    }
    const flyArt = hasManifestArt(scene, 'papillon');
    this.flyArt = flyArt;
    const count = flyArt ? PAPILLON_ART_COUNT : PAPILLON_COUNT;
    this.flies = Array.from({ length: count }, (_, i) => {
      let sprite;
      if (flyArt) {
        sprite = addManifestSprite(scene, this.cx, this.cy, 'papillon', 'idle', { origin: [0.5, 0.5] }).setAlpha(0);
        sprite.setScale(PAPILLON_ART_SIZE / Math.max(sprite.width, sprite.height));
      } else {
        sprite = scene.add.image(this.cx, this.cy, PAPILLON_TEXTURE_KEY)
          .setTint(PAPILLON_COLORS[i % PAPILLON_COLORS.length])
          .setBlendMode(Phaser.BlendModes.ADD)
          .setAlpha(0);
      }
      sprite.setDepth(CHARACTER_DEPTH + 2);
      return {
        sprite, a0: (i / count) * Math.PI * 2,
        ax: 20 + Math.random() * 40, ay: 12 + Math.random() * 40,
        fx: 1.5 + Math.random() * 2, fy: 2 + Math.random() * 2.5, ph: Math.random() * Math.PI * 2,
      };
    });
    this.updateRect();
    scene.events.on('update', this.update, this);
    scene.events.once('shutdown', () => this.destroy());
  }

  updateRect() {
    this.rect.setPosition(this.cx - PAPILLON_RECT_W / 2, this.cy - PAPILLON_RECT_H / 2);
  }

  update(time, delta) {
    if (!this.active) return;
    if (typeof isWorldFrozen === 'function' && isWorldFrozen(this.scene)) return;
    const dt = Math.min(delta, 50) / 1000;
    this.elapsed += delta;
    const t = this.elapsed / 1000;
    this.cx += this.dir * PAPILLON_SPEED * dt;
    this.updateRect();
    const k = this.elapsed / PAPILLON_DURATION_MS;
    const fade = k < 0.15 ? k / 0.15 : k > 0.75 ? Math.max(0, (1 - k) / 0.25) : 1;
    this.glow.setPosition(this.cx, this.cy).setAlpha(0.35 * fade);
    // Rayons de l'orbite = bord visible de l'anneau (un peu en dedans).
    const rx = PAPILLON_RECT_W / 2 - PAPILLON_ART_SIZE * 0.35;
    const ry = PAPILLON_RECT_H / 2 - PAPILLON_ART_SIZE * 0.35;
    for (const f of this.flies) {
      if (this.flyArt) {
        const a = f.a0 + t * PAPILLON_ORBIT_SPEED * this.dir;
        f.sprite.setPosition(this.cx + Math.cos(a) * rx, this.cy + Math.sin(a) * ry).setAlpha(fade);
        // Regarde dans le sens de sa course sur l'orbite (art face à droite).
        f.sprite.setFlipX(-Math.sin(a) * this.dir < 0);
      } else {
        const x = this.cx + Math.sin(t * f.fx + f.ph) * Math.min(f.ax, rx);
        const y = this.cy + Math.cos(t * f.fy + f.ph) * Math.min(f.ay, ry);
        f.sprite.setPosition(x, y).setAlpha(fade);
        f.sprite.setScale(1, 0.4 + 0.6 * Math.abs(Math.sin(t * 14 + f.ph))); // battement d'ailes
      }
    }
    if (this.swirl) this.swirl.setPosition(this.cx, this.cy).setAlpha(fade);
    this.checkTargets();
    // Pour les cibles hors de scene.enemies (boss scriptés) : écouter cet événement.
    this.scene.events.emit('papillon-swarm', this.rect, this);
    if (this.elapsed >= PAPILLON_DURATION_MS) this.destroy();
  }

  checkTargets() {
    const targets = [];
    if (this.scene.enemies) this.scene.enemies.children.iterate((e) => { if (e) targets.push(e); });
    for (const e of this.scene.healTargets || []) targets.push(e);
    for (const enemy of targets) {
      if (this.healed.has(enemy) || !enemy.active || typeof enemy.getBounds !== 'function') continue;
      if (!Phaser.Geom.Intersects.RectangleToRectangle(this.rect, enemy.getBounds())) continue;
      if (SKILL_DEFS.papillon.onHitEnemy(this.player, enemy)) {
        this.healed.add(enemy);
        this.scene.events.emit('papillon-heal', enemy);
        if (hasManifestArt(this.scene, 'vfx_soin_papillon', 'burst')) {
          const b = enemy.getBounds();
          const fx = addManifestSprite(this.scene, b.centerX, b.centerY, 'vfx_soin_papillon', 'burst', { origin: [0.5, 0.5] }).setDepth(CHARACTER_DEPTH + 2);
          fx.once('animationcomplete', () => fx.destroy());
        }
      }
    }
  }

  destroy() {
    if (!this.active) return;
    this.active = false;
    this.scene.events.off('update', this.update, this);
    this.glow.destroy();
    if (this.swirl) this.swirl.destroy();
    for (const f of this.flies) f.sprite.destroy();
    if (this.player && this.player.papillonSwarm === this) this.player.papillonSwarm = null;
  }
}

SKILL_DEFS.papillon = {
  label: 'Papillons — Soin',
  hudColor: 0x7fe0f0,
  cost: 40,
  cooldownMs: PAPILLON_DURATION_MS,
  onActivate(player) {
    if (player.papillonSwarm) player.papillonSwarm.destroy();
    player.papillonSwarm = new PapillonSwarm(player.scene, player);
  },
  // Soigne un ennemi corrompu (renvoie true), ignore les autres (false).
  onHitEnemy(player, enemy) {
    if (!enemy || !enemy.corrupted || typeof enemy.heal !== 'function') return false;
    enemy.heal(player);
    return true;
  },
};
