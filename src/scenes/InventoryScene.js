// InventoryScene — sac d'Agarica (touche I en jeu, cf. updateStoryKeys dans
// StoryKit.js). Overlay au-dessus de la zone, qui reste gelée. Grille des
// objets-clés (ITEM_INFO) à gauche, nom + description de l'objet choisi à
// droite. Flèches / ZQSD pour naviguer, I / Échap / E pour fermer, M pour la
// carte de Geralt si Agarica l'a.
const INVENTORY_COLS = 4;
const INVENTORY_ROWS = 3;
const INVENTORY_CELL = 96;
const INVENTORY_GAP = 12;

class InventoryScene extends Phaser.Scene {
  constructor() {
    super('InventoryScene');
  }

  init(data) {
    this.parentKey = data.parentKey;
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
    const hasMap = inventoryHas('carte_geralt');
    this.add.text(px + pw - 24, py + 26, `${hasMap ? 'M : carte   ·   ' : ''}I / Échap : fermer`, {
      fontFamily: 'sans-serif', fontSize: '13px', color: STORY_UI.textSoft,
    }).setOrigin(1, 0);

    this.items = inventoryList();
    this.cells = [];
    const gx = px + 30;
    const gy = py + 66;
    for (let i = 0; i < INVENTORY_COLS * INVENTORY_ROWS; i++) {
      const cx = gx + (i % INVENTORY_COLS) * (INVENTORY_CELL + INVENTORY_GAP) + INVENTORY_CELL / 2;
      const cy = gy + Math.floor(i / INVENTORY_COLS) * (INVENTORY_CELL + INVENTORY_GAP) + INVENTORY_CELL / 2;
      const g = this.add.graphics();
      const id = this.items[i];
      if (id) {
        addItemIcon(this, cx, cy - 6, id, 58);
        this.add.text(cx, cy + 34, itemInfo(id).name, {
          fontFamily: 'sans-serif', fontSize: '10px', color: STORY_UI.textSoft, align: 'center',
          wordWrap: { width: INVENTORY_CELL - 8 },
        }).setOrigin(0.5, 0.5);
        const zone = this.add.zone(cx, cy, INVENTORY_CELL, INVENTORY_CELL).setInteractive({ useHandCursor: true });
        zone.on('pointerdown', () => this.select(i));
      }
      this.cells.push({ g, cx, cy });
    }

    const dx = gx + INVENTORY_COLS * (INVENTORY_CELL + INVENTORY_GAP) + 14;
    this.descX = dx;
    this.descW = px + pw - 28 - dx;
    const dg = this.add.graphics();
    dg.fillStyle(STORY_UI.nightSoft, 0.6);
    dg.fillRoundedRect(dx, gy, this.descW, ph - 96, 10);
    this.descIcon = null;
    this.descName = this.add.text(dx + 16, gy + 110, '', {
      fontFamily: STORY_UI.serif, fontSize: '20px', fontStyle: 'bold', color: STORY_UI.text,
      wordWrap: { width: this.descW - 32 },
    });
    this.descText = this.add.text(dx + 16, gy + 146, '', {
      fontFamily: 'sans-serif', fontSize: '14px', color: '#d8ccf5', lineSpacing: 4,
      wordWrap: { width: this.descW - 32 },
    });
    this.descTop = gy;

    if (this.items.length === 0) {
      this.descName.setText('Ton sac est vide.');
      this.descText.setText("Les objets importants de ton voyage apparaîtront ici.");
    }
    this.select(0);

    this.input.keyboard.on('keydown', this.onKey, this);
  }

  select(i) {
    if (this.items.length === 0) {
      this.drawCells(-1);
      return;
    }
    this.selected = Phaser.Math.Clamp(i, 0, this.items.length - 1);
    this.drawCells(this.selected);
    const id = this.items[this.selected];
    const info = itemInfo(id);
    if (this.descIcon) this.descIcon.destroy();
    this.descIcon = addItemIcon(this, this.descX + this.descW / 2, this.descTop + 54, id, 80);
    this.descName.setText(info.name);
    this.descText.setText(info.desc);
  }

  drawCells(selected) {
    this.cells.forEach((c, i) => {
      const filled = !!this.items[i];
      c.g.clear();
      c.g.fillStyle(filled ? STORY_UI.nightSoft : 0x1b1530, filled ? 1 : 0.7);
      c.g.fillRoundedRect(c.cx - INVENTORY_CELL / 2, c.cy - INVENTORY_CELL / 2, INVENTORY_CELL, INVENTORY_CELL, 10);
      c.g.lineStyle(i === selected ? 3 : 1.5, i === selected ? STORY_UI.pink : STORY_UI.vineLight, i === selected ? 1 : 0.35);
      c.g.strokeRoundedRect(c.cx - INVENTORY_CELL / 2, c.cy - INVENTORY_CELL / 2, INVENTORY_CELL, INVENTORY_CELL, 10);
    });
  }

  onKey(event) {
    if (event.repeat || this.time.now - this.openedAt < 120) return;
    const k = event.key.toLowerCase();
    if (k === 'i' || k === 'escape' || k === 'e') this.close();
    else if (k === 'm' && inventoryHas('carte_geralt')) this.close('MapScene');
    else if (k === 'arrowleft' || k === 'q') this.select(this.selected - 1);
    else if (k === 'arrowright' || k === 'd') this.select(this.selected + 1);
    else if (k === 'arrowup' || k === 'z') this.select(this.selected - INVENTORY_COLS);
    else if (k === 'arrowdown' || k === 's') this.select(this.selected + INVENTORY_COLS);
  }

  close(next) {
    this.input.keyboard.off('keydown', this.onKey, this);
    const parent = this.scene.get(this.parentKey);
    this.scene.stop();
    if (!parent) return;
    if (next) {
      parent.scene.launch(next, { parentKey: this.parentKey });
      parent.scene.bringToTop(next);
    } else {
      releaseStoryInput(parent);
    }
  }
}
