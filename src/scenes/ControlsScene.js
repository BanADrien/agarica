// ControlsScene — écran des touches (overlay, depuis le titre, la pause ou
// les options). Contenu : CONTROLS_GROUPS / CONTROLS_FORMS_NOTE (MenuKit.js).
class ControlsScene extends MenuOverlayScene {
  constructor() {
    super('ControlsScene');
  }

  create() {
    const f = this.buildFrame(820, 468, { seed: 2 });
    this.root.add(menuPanelTitle(this, f.x + f.w / 2, f.y + 32, 'Contrôles', { size: 24 }));

    // Deux colonnes : « Se déplacer » à gauche, « Agir » + « Menus » à droite.
    const colX = [f.x + 34, f.x + f.w / 2 + 14];
    const colY = [f.y + 80, f.y + 80];
    CONTROLS_GROUPS.forEach((group, gi) => {
      const col = gi === 0 ? 0 : 1;
      let y = colY[col];
      this.root.add(this.add.text(colX[col], y, group.title, {
        fontFamily: STORY_UI.serif, fontSize: '17px', fontStyle: 'bold', color: STORY_UI.title, padding: { x: 2, y: 3 },
      }).setOrigin(0, 0.5));
      y += 32;
      for (const row of group.rows) {
        let x = colX[col];
        row.keys.forEach((k, i) => {
          if (i > 0) x += 4;
          x += menuDrawKeycap(this, x, y, k, { container: this.root });
        });
        if (row.alt) {
          const sep = this.add.text(x + 6, y - 1, 'ou', { fontFamily: 'sans-serif', fontSize: '11px', color: STORY_UI.textSoft }).setOrigin(0, 0.5);
          this.root.add(sep);
          x += 6 + sep.width + 6;
          row.alt.forEach((k, i) => {
            if (i > 0) x += 4;
            x += menuDrawKeycap(this, x, y, k, { container: this.root, dim: true });
          });
        }
        const labelX = colX[col] + (col === 0 ? 168 : 136);
        this.root.add(this.add.text(Math.max(labelX, x + 10), y - 1, row.text, {
          fontFamily: 'sans-serif', fontSize: '13px', color: '#e8dcff',
          wordWrap: { width: colX[col] + 356 - Math.max(labelX, x + 10) },
        }).setOrigin(0, 0.5));
        y += 34;
      }
      colY[col] = y + 14;
    });

    // Note sur les formes, en bas, dans un cartouche.
    const ny = f.y + f.h - 86;
    const g = this.add.graphics();
    g.fillStyle(STORY_UI.nightSoft, 0.7);
    g.fillRoundedRect(f.x + 30, ny, f.w - 60, 50, 10);
    g.lineStyle(1, STORY_UI.vineLight, 0.3);
    g.strokeRoundedRect(f.x + 30, ny, f.w - 60, 50, 10);
    this.root.add(g);
    this.root.add(this.add.text(f.x + f.w / 2, ny + 25, CONTROLS_FORMS_NOTE, {
      fontFamily: 'sans-serif', fontSize: '13px', fontStyle: 'italic', color: '#c9b8f0', align: 'center',
      wordWrap: { width: f.w - 90 }, lineSpacing: 3,
    }).setOrigin(0.5));

    const back = this.add.text(f.x + f.w / 2, f.y + f.h - 18, 'Échap / Entrée : retour', {
      fontFamily: 'sans-serif', fontSize: '12px', color: STORY_UI.textSoft, padding: { x: 6, y: 2 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setColor('#ffc4dd'));
    back.on('pointerout', () => back.setColor(STORY_UI.textSoft));
    back.on('pointerdown', () => this.close());
    this.root.add(back);
  }

  handleExtraKey(event, action) {
    if (action === 'ok') { this.close(); return true; }
    return false;
  }
}
