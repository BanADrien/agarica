// Pistes du loup + plateformes cachées — agent Formes.
// Perception du loup (histoire/ZONES_ET_PROGRESSION.md §4) :
// - `tracks: [{x, y, w}]` : empreintes lumineuses de x à x+w, posées sur le
//   sol à la hauteur y (pieds), visibles SEULEMENT en forme loup (fondu).
// - `hiddenPlatforms: [{gx, gy, w}]` : rangée de w cases (grille 64) à partir
//   de (gx, gy), invisible et traversable ; révélée (tuiles du sol + solide)
//   quand le loup passe à moins de PISTE_REVEAL_DIST px. Mémorisé pour la
//   visite seulement (re-cachée à la prochaine entrée dans la zone).
const PISTE_PRINT_SPACING = 38;
const PISTE_COLOR = 0x7dfcd8;
const PISTE_FADE_SPEED = 4; // alpha par seconde
const PISTE_REVEAL_DIST = 200;
const PISTE_HINT_DIST = 360;
const PAW_TEXTURE_KEY = 'fx-paw-print';

function ensurePawTexture(scene) {
  if (scene.textures.exists(PAW_TEXTURE_KEY)) return PAW_TEXTURE_KEY;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0xffffff, 1);
  g.fillEllipse(12, 15, 12, 9); // coussinet
  g.fillCircle(5, 8, 2.6);
  g.fillCircle(9.5, 4.5, 2.6);
  g.fillCircle(14.5, 4.5, 2.6);
  g.fillCircle(19, 8, 2.6);
  g.generateTexture(PAW_TEXTURE_KEY, 24, 20);
  g.destroy();
  return PAW_TEXTURE_KEY;
}

function playerIsWolf(scene) {
  return !!(scene.player && scene.player.form === 'wolf');
}

class PisteTrack {
  constructor(scene, cfg) {
    this.scene = scene;
    this.prints = [];
    this.alpha = 0;
    const useVfx = typeof hasManifestArt === 'function' && hasManifestArt(scene, 'vfx_piste_loup');
    const w = Math.max(PISTE_PRINT_SPACING, cfg.w || 200);
    const count = Math.max(1, Math.floor(w / PISTE_PRINT_SPACING));
    for (let i = 0; i < count; i++) {
      const px = cfg.x + i * PISTE_PRINT_SPACING + PISTE_PRINT_SPACING / 2;
      // Chaque empreinte sur la surface de marche sous elle (la piste suit le
      // relief : butte, marches) ; `cfg.y` (haut de l'image des tuiles, comme
      // les autres y de donnée) ne sert qu'à choisir la couche de sol, et de
      // repli au-dessus d'une plateforme cachée pas encore révélée.
      const groundY = groundStandYAt(scene, px, cfg.y) ?? cfg.y + PROP_GROUND_SINK;
      const py = groundY - 4 + (i % 2 === 0 ? -3 : 3);
      let print;
      if (useVfx) {
        // Art Codex ancré par le bas visible (cf. addManifestSprite /
        // anchorVisibleFeet : `y` = bas de la frame la plus basse de la
        // lueur) : empreinte posée sur la surface, à peine décalée d'une patte
        // à l'autre (jamais au-dessus de l'herbe).
        print = addManifestSprite(scene, px, groundY + (i % 2 === 0 ? 0 : 1), 'vfx_piste_loup', 'glow');
      } else {
        print = scene.add.image(px, py, ensurePawTexture(scene)).setTint(PISTE_COLOR).setOrigin(0.5, 1);
        print.setAngle(90 + (i % 2 === 0 ? -8 : 8)); // orteils vers la droite (sens de la piste)
        print.setBlendMode(Phaser.BlendModes.ADD);
      }
      print.setAlpha(0);
      this.prints.push(print);
    }
  }

  update(time, delta) {
    const target = playerIsWolf(this.scene) ? 1 : 0;
    const step = (PISTE_FADE_SPEED * Math.min(delta, 50)) / 1000;
    this.alpha = target > this.alpha ? Math.min(target, this.alpha + step) : Math.max(target, this.alpha - step);
    this.prints.forEach((p, i) => {
      const pulse = 0.75 + 0.25 * Math.sin(time / 260 - i * 0.6);
      p.setAlpha(this.alpha * pulse);
    });
  }
}

class HiddenPlatform {
  constructor(scene, cfg) {
    this.scene = scene;
    this.revealed = false;
    const w = Math.max(1, cfg.w || 1);
    this.cells = [];
    for (let i = 0; i < w; i++) this.cells.push([cfg.gx + i, cfg.gy, 'dirt']);
    const size = typeof GROUND_TILE_SIZE !== 'undefined' ? GROUND_TILE_SIZE : 64;
    this.rect = new Phaser.Geom.Rectangle(cfg.gx * size, cfg.gy * size, w * size, size);
    // Contour fantôme : indice discret quand le loup approche (avant révélation).
    // Art `decor_plateforme_fantome` (lot Codex n°8) s'il existe.
    if (scene.textures.exists('item-decor_plateforme_fantome')) {
      this.hint = scene.add.image(this.rect.centerX, this.rect.y, 'item-decor_plateforme_fantome').setOrigin(0.5, 0)
        .setDisplaySize(this.rect.width, this.rect.height).setTint(PISTE_COLOR).setBlendMode(Phaser.BlendModes.ADD);
    } else {
      this.hint = scene.add.graphics();
      this.hint.lineStyle(2, PISTE_COLOR, 1);
      this.hint.strokeRect(this.rect.x + 2, this.rect.y + 2, this.rect.width - 4, this.rect.height * 0.75);
    }
    this.hint.setAlpha(0);
  }

  distanceTo(x, y) {
    const r = this.rect;
    const dx = Math.max(r.x - x, 0, x - r.right);
    const dy = Math.max(r.y - y, 0, y - r.bottom);
    return Math.hypot(dx, dy);
  }

  update() {
    if (this.revealed || !this.scene.player) return;
    const p = this.scene.player;
    const wolf = playerIsWolf(this.scene);
    const d = this.distanceTo(p.x, p.y - 30);
    this.hint.setAlpha(wolf && d < PISTE_HINT_DIST ? 0.25 + 0.15 * Math.sin(this.scene.time.now / 200) : 0);
    if (wolf && d < PISTE_REVEAL_DIST) this.reveal();
  }

  reveal() {
    if (this.revealed) return;
    this.revealed = true;
    this.hint.destroy();
    const scene = this.scene;
    // Mêmes tuiles/hitbox que le sol normal, ajoutées à scene.ground (déjà en
    // collision avec joueur, Xara, ennemis).
    const images = renderAutotileGrid(scene, scene.ground, this.cells);
    // Juice : les cases montent une à une depuis la gauche (images seules,
    // les corps physiques sont déjà en place), lueurs et onde du loup.
    for (const img of images) {
      img.setAlpha(0);
      if (scene.player && scene.children.moveBelow) scene.children.moveBelow(img, scene.player);
      const y0 = img.y;
      const k = (img.x - this.rect.x) / Math.max(1, this.rect.width);
      img.y = y0 + 18;
      scene.tweens.add({ targets: img, alpha: 1, y: y0, duration: 420, delay: 40 + k * 260, ease: 'Back.Out' });
    }
    const flash = scene.add.rectangle(this.rect.centerX, this.rect.centerY, this.rect.width, this.rect.height, PISTE_COLOR, 0.5)
      .setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({ targets: flash, alpha: 0, duration: 600, onComplete: () => flash.destroy() });
    if (typeof spawnFx === 'function') {
      for (let x = this.rect.x + 16; x < this.rect.right; x += 40) {
        spawnFx(scene, 'motes', x, this.rect.y + 6, { count: 2, spread: 10, color: [PISTE_COLOR, 0xe8fff2] });
      }
      juiceShockRing(scene, this.rect.centerX, this.rect.y + 4, { size: this.rect.width * 1.3, ms: 460, color: PISTE_COLOR, flat: 0.25 });
      juiceShake(scene, 'light');
      playSfx('platform_reveal');
    }
    scene.events.emit('hidden-platform-revealed', this);
  }
}

LEVEL_DATA_HANDLERS.tracks = (scene, list) => {
  scene.wolfTracks = (list || []).map((cfg) => new PisteTrack(scene, cfg));
  scene.events.once('shutdown', () => { scene.wolfTracks = []; });
};

LEVEL_DATA_HANDLERS.hiddenPlatforms = (scene, list) => {
  scene.hiddenPlatforms = (list || []).map((cfg) => new HiddenPlatform(scene, cfg));
  scene.events.once('shutdown', () => { scene.hiddenPlatforms = []; });
};

LEVEL_UPDATE_HOOKS.push((scene, time, delta) => {
  for (const t of scene.wolfTracks || []) t.update(time, delta);
  for (const h of scene.hiddenPlatforms || []) h.update(time, delta);
});
