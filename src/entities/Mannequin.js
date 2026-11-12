// Mannequin d'entraînement (zones de test) : un « gros » ennemi qui ne bouge
// pas et ne blesse pas, pour mesurer les coups. Type d'ennemi `mannequin` :
//   enemies: [{ type: 'mannequin', x, y, hp?: 6, heavy?: true, eclats: 0 }]
// `heavy` (vrai par défaut) : il arrête la charge du grizzly au lieu d'être
// renversé (cf. Ursides.js). Ses PV s'affichent en petits carrés au-dessus de
// lui ; à 0, il tombe en morceaux puis se remonte tout seul 2,5 s plus tard.
// Dessiné par code, en gros pixels (1 case du dessin = 2 px d'écran).
const MANNEQUIN_KEY = 'mannequin-ph';
const MANNEQUIN_PX = 2;
const MANNEQUIN_REBUILD_MS = 2500;

function mannequinTexture(scene) {
  if (scene.textures.exists(MANNEQUIN_KEY)) return MANNEQUIN_KEY;
  // 24 x 46 cases : poteau, corps de paille, bras en croix, cible, casque.
  const W = 24;
  const H = 46;
  const tex = scene.textures.createCanvas(MANNEQUIN_KEY, W, H);
  const ctx = tex.getContext();
  const rect = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  const OUT = '#1a1030';
  // Poteau et pied.
  rect(10, 30, 4, 16, OUT); rect(11, 30, 2, 15, '#7a5232');
  rect(5, 43, 14, 3, OUT); rect(6, 44, 12, 1, '#7a5232');
  // Bras (barre en croix).
  rect(0, 16, 24, 5, OUT); rect(1, 17, 22, 3, '#8f6238'); rect(1, 17, 22, 1, '#b98a52');
  // Corps de paille.
  rect(5, 11, 14, 21, OUT); rect(6, 12, 12, 19, '#d6b25e');
  rect(6, 12, 3, 19, '#f0d48a'); rect(15, 12, 3, 19, '#a8823c');
  for (let y = 14; y < 30; y += 4) rect(7, y, 10, 1, '#a8823c');
  // Cible sur le ventre.
  rect(9, 18, 6, 6, '#f4f0e0'); rect(10, 19, 4, 4, '#d8455a'); rect(11, 20, 2, 2, '#f4f0e0');
  // Tête (sac de toile) et casque.
  rect(7, 2, 10, 10, OUT); rect(8, 3, 8, 8, '#c9b48a'); rect(8, 3, 2, 8, '#e6d6b0');
  rect(10, 6, 1, 2, OUT); rect(13, 6, 1, 2, OUT);
  rect(6, 0, 12, 4, OUT); rect(7, 1, 10, 2, '#8f96a8'); rect(7, 1, 10, 1, '#c4cad8');
  tex.refresh();
  tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
  return MANNEQUIN_KEY;
}

class Mannequin extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, { hp = 6, heavy = true } = {}) {
    super(scene, x, y, mannequinTexture(scene));
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1);
    this.setScale(MANNEQUIN_PX);
    this.body.updateBounds();
    // Corps : le tronc et le poteau (les bras ne comptent pas).
    this.body.setSize(14, 44);
    this.body.setOffset(5, 2);
    this.maxHp = hp;
    this.hp = hp;
    this.heavy = heavy;
    this.harmless = true;
    this.defeated = false;
    this.rebuildAt = 0;
    this.pips = scene.add.graphics().setDepth(CHARACTER_DEPTH + 1);
    this.pips.lookRole = 'ui';
    this.once('destroy', () => { if (this.pips) this.pips.destroy(); });
  }

  update() {
    const now = this.scene.time.now;
    if (this.defeated && this.rebuildAt && now >= this.rebuildAt) this.rebuild();
    this.drawPips();
  }

  // PV en carrés de 6 px : pleins (rose) ou vides (contour).
  drawPips() {
    const g = this.pips;
    g.clear();
    if (this.defeated) return;
    const size = 6;
    const gap = 2;
    const total = this.maxHp * size + (this.maxHp - 1) * gap;
    const x0 = Math.round(this.x - total / 2);
    const y0 = Math.round(this.y - this.displayHeight - 14);
    for (let i = 0; i < this.maxHp; i++) {
      const x = x0 + i * (size + gap);
      g.fillStyle(0x1a1030, 1);
      g.fillRect(x - 2, y0 - 2, size + 4, size + 4);
      g.fillStyle(i < this.hp ? 0xff6b8a : 0x4a3d63, 1);
      g.fillRect(x, y0, size, size);
    }
  }

  takeHit() {
    if (this.defeated) return;
    this.hp -= 1;
    if (this.hp <= 0) { this.defeat(); return; }
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(90, () => { if (this.active && !this.defeated) this.clearTint(); });
    // Il encaisse : petit balancement autour du pied.
    this.scene.tweens.add({ targets: this, angle: { from: -6, to: 0 }, duration: 220, ease: 'Back.easeOut' });
  }

  // « Vaincu » : il tombe en morceaux, puis se remonte (mannequin d'essai).
  defeat() {
    if (this.defeated) return;
    this.defeated = true;
    this.hp = 0;
    this.clearTint();
    this.body.enable = false;
    this.setVisible(false);
    this.rebuildAt = this.scene.time.now + MANNEQUIN_REBUILD_MS;
    if (typeof ursideBurst === 'function') {
      ursideBurst(this.scene, this.x, this.y - 44, { count: 14, power: 1, colors: [0xd6b25e, 0xf0d48a, 0x7a5232, 0xffffff] });
    }
  }

  rebuild() {
    this.rebuildAt = 0;
    this.defeated = false;
    this.hp = this.maxHp;
    this.body.enable = true;
    this.setVisible(true);
    this.setAngle(0);
    // Jeton de coup oublié : le même fracas ne compte pas deux fois, mais un
    // nouveau coup porte dès qu'il est remonté.
    this.__lastHitToken = null;
  }
}

if (typeof ENEMY_REGISTRY !== 'undefined') {
  ENEMY_REGISTRY.mannequin = (scene, e) => new Mannequin(scene, e.x, e.y, { hp: e.hp ?? 6, heavy: e.heavy ?? true });
}
