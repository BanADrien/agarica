// CreditsScene — crédits courts et tendres (overlay depuis l'écran-titre).
// Textes : CREDITS_* (MenuKit.js), faciles à modifier.
class CreditsScene extends MenuOverlayScene {
  constructor() {
    super('CreditsScene');
  }

  create() {
    const f = this.buildFrame(640, 440, { seed: 9, veil: 0.65 });
    const cx = f.x + f.w / 2;
    this.root.add(menuPanelTitle(this, cx, f.y + 36, CREDITS_TITLE, { size: 28 }));

    // Les lignes apparaissent une à une, doucement.
    const lines = [];
    let y = f.y + 90;
    lines.push(this.add.text(cx, y, CREDITS_DEDICATION, {
      fontFamily: STORY_UI.serif, fontSize: '17px', fontStyle: 'italic', color: '#ffe9f5', padding: { x: 6, y: 4 },
    }).setOrigin(0.5));
    y += 44;
    for (const section of CREDITS_SECTIONS) {
      lines.push(this.add.text(cx, y, section.title, {
        fontFamily: STORY_UI.serif, fontSize: '15px', fontStyle: 'bold', color: STORY_UI.title, padding: { x: 4, y: 3 },
      }).setOrigin(0.5));
      y += 24;
      for (const line of section.lines) {
        const t = this.add.text(cx, y, line, {
          fontFamily: 'sans-serif', fontSize: '14px', color: '#e8dcff', align: 'center',
          wordWrap: { width: f.w - 80 }, lineSpacing: 3,
        }).setOrigin(0.5, 0);
        lines.push(t);
        y += t.height + 4;
      }
      y += 22;
    }
    const closing = this.add.text(cx, f.y + f.h - 62, CREDITS_CLOSING, {
      fontFamily: STORY_UI.serif, fontSize: '24px', fontStyle: 'bold', color: '#ffc4dd',
      stroke: '#15101f', strokeThickness: 4, padding: { x: 10, y: 8 },
    }).setOrigin(0.5);
    closing.setShadow(0, 0, '#ff9fc9', 12, true, true);
    lines.push(closing);
    lines.forEach((t, i) => {
      t.setAlpha(0);
      this.root.add(t);
      this.tweens.add({ targets: t, alpha: 1, duration: 600, delay: 200 + i * 220 });
    });
    this.tweens.add({ targets: closing, scale: 1.05, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 2000 });

    // Quelques pétales roses qui tombent derrière le texte.
    for (let i = 0; i < 10; i++) {
      const p = this.add.ellipse(f.x + 20 + Math.random() * (f.w - 40), f.y + 10, 6, 3.5, STORY_UI.pink, 0.55);
      this.root.addAt(p, 2);
      this.tweens.add({
        targets: p, y: f.y + f.h - 14, x: p.x + Phaser.Math.Between(-40, 40), angle: 360,
        alpha: { from: 0.6, to: 0 }, duration: Phaser.Math.Between(5000, 8000), repeat: -1, delay: i * 700,
      });
    }

    const back = this.add.text(cx, f.y + f.h - 20, 'Échap / Entrée : retour', {
      fontFamily: 'sans-serif', fontSize: '12px', color: STORY_UI.textSoft, padding: { x: 6, y: 2 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.close());
    this.root.add(back);
  }

  handleExtraKey(event, action) {
    if (action === 'ok') { this.close(); return true; }
    return false;
  }
}
