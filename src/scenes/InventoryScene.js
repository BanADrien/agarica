// InventoryScene — sac d'Agarica (touche I en jeu, cf. updateStoryKeys dans
// StoryKit.js, ou entrée « Inventaire » du menu du feu de camp). Overlay
// au-dessus de la zone, qui reste gelée. À gauche : objets de quête
// (ITEM_INFO) puis consommables (CONSUMABLE_INFO, avec leur nombre) ; à
// droite : nom + description de la case choisie. Flèches / ZQSD pour
// naviguer, E / Entrée pour utiliser un consommable, I / Échap pour fermer,
// M pour la carte si elle est disponible (cf. storyMapAvailable).
// `returnTo` (menu du feu) : à la fermeture, cette scène-là reprend la main
// au lieu de rendre les touches à la zone.
const INVENTORY_COLS = 4;
const INVENTORY_CELL = 84;
const INVENTORY_GAP = 10;
// Au-delà de 2 rangées d'objets de quête : cases plus petites (tout tient).
const INVENTORY_CELL_SMALL = 68;

class InventoryScene extends Phaser.Scene {
  constructor() {
    super('InventoryScene');
  }

  init(data) {
    this.parentKey = data.parentKey;
    this.returnTo = data.returnTo || null;
    this.selected = 0;
  }

  create() {
    const { width, height } = this.scale;
    this.openedAt = this.time.now;
    this.add.rectangle(0, 0, width, height, 0x0d0b1a, 0.7).setOrigin(0);
    const px = 90;
    const py = 52;
    const pw = width - 180;
    const ph = height - 104;
    drawStoryPanel(this.add.graphics(), px, py, pw, ph, { seed: 4 });

    this.add.text(px + 28, py + 18, "Sac d'Agarica", {
      fontFamily: STORY_UI.serif, fontSize: '24px', fontStyle: 'bold', color: STORY_UI.title,
    });
    const hasMap = storyMapAvailable();
    const closeHint = this.returnTo ? 'I / Échap : retour au feu' : 'I / Échap : fermer';
    this.add.text(px + pw - 24, py + 26, `${hasMap ? 'M : carte   ·   ' : ''}${closeHint}`, {
      fontFamily: 'sans-serif', fontSize: '13px', color: STORY_UI.textSoft,
    }).setOrigin(1, 0);

    // Cases : objets de quête (rangées 0..), puis une rangée de consommables
    // (toujours tous affichés, même à 0 : on voit ce qui existe).
    const items = inventoryList();
    const questRows = Math.max(2, Math.ceil(items.length / INVENTORY_COLS));
    const cell = questRows > 2 ? INVENTORY_CELL_SMALL : INVENTORY_CELL;
    this.cellSize = cell;
    const step = cell + INVENTORY_GAP;
    const gx = px + 30;
    const sectionLabel = (y, text) => this.add.text(gx, y, text, {
      fontFamily: 'sans-serif', fontSize: '12px', fontStyle: 'bold', color: '#c9b8f0',
    });
    let y = py + 58;
    sectionLabel(y, 'Objets de quête');
    y += 20;
    this.cells = [];
    for (let i = 0; i < questRows * INVENTORY_COLS; i++) {
      const col = i % INVENTORY_COLS;
      const row = Math.floor(i / INVENTORY_COLS);
      const id = items[i] || null;
      this.cells.push({ kind: 'quest', id, row, col, cx: gx + col * step + cell / 2, cy: y + row * step + cell / 2 });
    }
    y += questRows * step + 4;
    sectionLabel(y, 'Consommables');
    y += 20;
    CONSUMABLE_IDS.forEach((id, col) => {
      this.cells.push({ kind: 'consumable', id, row: questRows, col, cx: gx + col * step + cell / 2, cy: y + cell / 2 });
    });
    for (let col = CONSUMABLE_IDS.length; col < INVENTORY_COLS; col++) {
      this.cells.push({ kind: 'consumable', id: null, row: questRows, col, cx: gx + col * step + cell / 2, cy: y + cell / 2 });
    }
    this.cells.forEach((c, i) => {
      c.g = this.add.graphics();
      if (!c.id) return;
      c.icon = addItemIcon(this, c.cx, c.cy - 8, c.id, cell * 0.58);
      c.label = this.add.text(c.cx, c.cy + cell / 2 - 12, itemInfo(c.id).name, {
        fontFamily: 'sans-serif', fontSize: '10px', color: STORY_UI.textSoft, align: 'center',
        wordWrap: { width: cell - 8 },
      }).setOrigin(0.5, 0.5);
      if (c.kind === 'consumable') {
        c.count = this.add.text(c.cx + cell / 2 - 6, c.cy - cell / 2 + 4, '', {
          fontFamily: 'sans-serif', fontSize: '13px', fontStyle: 'bold', color: '#ffe066',
          stroke: '#15101f', strokeThickness: 3,
        }).setOrigin(1, 0);
      }
      const zone = this.add.zone(c.cx, c.cy, cell, cell).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => {
        if (this.selected === i && c.kind === 'consumable') this.useSelected();
        else this.select(i);
      });
    });
    this.selectable = this.cells.map((c, i) => (c.id ? i : -1)).filter((i) => i >= 0);

    const dx = gx + INVENTORY_COLS * step + 14;
    this.descX = dx;
    this.descW = px + pw - 28 - dx;
    const descTop = py + 66;
    const dg = this.add.graphics();
    dg.fillStyle(STORY_UI.nightSoft, 0.6);
    dg.fillRoundedRect(dx, descTop, this.descW, ph - 96, 10);
    this.descIcon = null;
    this.descName = this.add.text(dx + 16, descTop + 110, '', {
      fontFamily: STORY_UI.serif, fontSize: '20px', fontStyle: 'bold', color: STORY_UI.text,
      wordWrap: { width: this.descW - 32 },
    });
    this.descText = this.add.text(dx + 16, descTop + 146, '', {
      fontFamily: 'sans-serif', fontSize: '14px', color: '#d8ccf5', lineSpacing: 4,
      wordWrap: { width: this.descW - 32 },
    });
    // Consommable : quantité + touche pour l'utiliser, et le retour de l'usage.
    this.descUse = this.add.text(dx + 16, descTop + ph - 96 - 54, '', {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#ffe066', lineSpacing: 4,
      wordWrap: { width: this.descW - 32 },
    });
    this.descTop = descTop;
    this.useNote = '';

    this.refreshCounts();
    // Premier objet de quête s'il y en a, sinon le premier consommable.
    this.select(this.selectable.length ? this.selectable[0] : 0);
    if (!items.length) {
      this.add.text(gx + 2 * step, py + 78 + step, 'Aucun objet de quête pour l\'instant.', {
        fontFamily: 'sans-serif', fontSize: '12px', fontStyle: 'italic', color: '#8f86a8',
      }).setOrigin(0.5);
    }

    this.input.keyboard.on('keydown', this.onKey, this);
    // Juice : ouverture avec un léger rebond.
    juiceOverlayIn(this);
  }

  refreshCounts() {
    for (const c of this.cells) {
      if (c.kind !== 'consumable' || !c.id) continue;
      const n = consumableCount(c.id);
      c.count.setText(`×${n}`).setColor(n > 0 ? '#ffe066' : '#8f86a8');
      c.icon.setAlpha(n > 0 ? 1 : 0.4);
    }
  }

  select(i) {
    const c = this.cells[i];
    if (!c || !c.id) {
      this.drawCells(-1);
      return;
    }
    if (i !== this.selected) this.useNote = '';
    this.selected = i;
    this.drawCells(this.selected);
    const info = itemInfo(c.id);
    if (this.descIcon) this.descIcon.destroy();
    this.descIcon = addItemIcon(this, this.descX + this.descW / 2, this.descTop + 54, c.id, 80);
    if (c.kind === 'consumable' && consumableCount(c.id) <= 0) this.descIcon.setAlpha(0.45);
    // Juice : l'objet choisi « saute » dans le cadre de description.
    const s0 = this.descIcon.scale;
    this.descIcon.setScale(s0 * 0.7);
    this.tweens.add({ targets: this.descIcon, scale: s0, duration: 220, ease: 'Back.Out' });
    this.descName.setText(info.name);
    this.descText.setText(info.desc);
    if (c.kind === 'consumable') {
      const n = consumableCount(c.id);
      const how = n > 0 ? `Tu en as ${n}.  E / Entrée : utiliser` : 'Tu n\'en as pas pour l\'instant.';
      this.descUse.setText(this.useNote ? `${how}\n${this.useNote}` : how);
    } else {
      this.descUse.setText('');
    }
  }

  drawCells(selected) {
    const cell = this.cellSize;
    this.cells.forEach((c, i) => {
      const filled = !!c.id;
      c.g.clear();
      c.g.fillStyle(filled ? STORY_UI.nightSoft : 0x1b1530, filled ? 1 : 0.7);
      c.g.fillRoundedRect(c.cx - cell / 2, c.cy - cell / 2, cell, cell, 10);
      c.g.lineStyle(i === selected ? 3 : 1.5, i === selected ? STORY_UI.pink : STORY_UI.vineLight, i === selected ? 1 : 0.35);
      c.g.strokeRoundedRect(c.cx - cell / 2, c.cy - cell / 2, cell, cell, 10);
    });
  }

  // Flèches : gauche/droite dans l'ordre des cases ; haut/bas vers la case
  // la plus proche (même colonne d'abord) d'une autre rangée.
  move(dx, dy) {
    const cur = this.cells[this.selected];
    if (!cur) return;
    if (dx) {
      const pos = this.selectable.indexOf(this.selected);
      const n = this.selectable.length;
      if (n) this.select(this.selectable[(pos + dx + n) % n]);
      return;
    }
    const rows = [...new Set(this.selectable.map((i) => this.cells[i].row))].sort((a, b) => a - b);
    const target = dy > 0 ? rows.find((r) => r > cur.row) : [...rows].reverse().find((r) => r < cur.row);
    if (target === undefined) return;
    const inRow = this.selectable.filter((i) => this.cells[i].row === target);
    inRow.sort((a, b) => Math.abs(this.cells[a].col - cur.col) - Math.abs(this.cells[b].col - cur.col));
    this.select(inRow[0]);
  }

  useSelected() {
    const c = this.cells[this.selected];
    if (!c || c.kind !== 'consumable' || !c.id) return;
    const parent = this.scene.get(this.parentKey);
    const res = consumableUse(parent, c.id);
    this.useNote = res.text;
    if (res.ok) {
      juiceFlash(c.icon, 0xffffff, 120);
      this.refreshCounts();
    } else if (typeof playSfx === 'function') {
      playSfx('skill_denied', { key: this.scene.key });
    }
    this.select(this.selected);
  }

  onKey(event) {
    if (event.repeat || this.time.now - this.openedAt < 120) return;
    const k = event.key.toLowerCase();
    if (k === 'i' || k === 'escape') this.close();
    else if (k === 'm' && storyMapAvailable()) this.close('MapScene');
    else if (k === 'e' || k === 'enter') this.useSelected();
    else if (k === 'arrowleft' || k === 'q') this.move(-1, 0);
    else if (k === 'arrowright' || k === 'd') this.move(1, 0);
    else if (k === 'arrowup' || k === 'z') this.move(0, -1);
    else if (k === 'arrowdown' || k === 's') this.move(0, 1);
  }

  close(next) {
    this.input.keyboard.off('keydown', this.onKey, this);
    const parent = this.scene.get(this.parentKey);
    this.scene.stop();
    if (!parent) return;
    if (next) {
      parent.scene.launch(next, { parentKey: this.parentKey, returnTo: this.returnTo });
      parent.scene.bringToTop(next);
    } else if (this.returnTo) {
      // Menu du feu (mis en pause pendant le sac) : il reprend la main.
      this.scene.resume(this.returnTo);
    } else {
      releaseStoryInput(parent);
    }
  }
}
