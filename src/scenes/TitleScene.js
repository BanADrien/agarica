// TitleScene — écran-titre : logo (art Codex `item-titre_logo` si présent,
// sinon titre stylé), menu Continuer (si sauvegarde) / Nouvelle partie /
// Zones de test (anciennes zones de développement + accès direct aux zones
// de la démo). Flèches / ZQSD + Entrée / Espace / E, ou souris.
class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create() {
    const { width, height } = this.scale;
    // Instance réutilisée à chaque retour au titre : cf. buildLevelFromData.
    this.__transitioningAway = false;
    fadeInScene(this);
    addMoonlitDecor(this, width, height, width);
    addCaveCeiling(this, width);
    const veil = this.add.graphics();
    veil.fillGradientStyle(0x0d0b1a, 0x0d0b1a, 0x0d0b1a, 0x0d0b1a, 0.25, 0.25, 0.75, 0.75);
    veil.fillRect(0, 0, width, height);
    this.addFireflies(width, height);

    // Logo masqué dans le sous-menu « Zones de test » (2 longues colonnes).
    this.logoLayer = this.add.container(0, 0);
    if (this.textures.exists('item-titre_logo')) {
      const logo = this.add.image(width / 2, 130, 'item-titre_logo');
      this.logoLayer.add(logo);
      logo.setScale(Math.min(560 / logo.width, 220 / logo.height));
    } else {
      const title = this.add.text(width / 2, 118, 'Legend of Agarica', {
        fontFamily: STORY_UI.serif, fontSize: '58px', fontStyle: 'bold', color: '#ffe9f5',
        stroke: '#15101f', strokeThickness: 8, padding: { x: 28, y: 22 },
      }).setOrigin(0.5);
      title.setShadow(0, 0, '#ff9fc9', 22, true, true);
      const g = this.add.graphics();
      this.logoLayer.add([title, g]);
      g.lineStyle(2, STORY_UI.vineLight, 0.8);
      g.lineBetween(width / 2 - 230, 168, width / 2 - 14, 168);
      g.lineBetween(width / 2 + 14, 168, width / 2 + 230, 168);
      g.fillStyle(STORY_UI.pink, 1);
      g.fillCircle(width / 2, 168, 5);
      this.logoLayer.add(this.add.text(width / 2, 190, 'La mousse et la lune — démo', {
        fontFamily: STORY_UI.serif, fontSize: '17px', fontStyle: 'italic', color: '#c9b8f0',
      }).setOrigin(0.5));
    }

    this.menuLayer = this.add.container(0, 0);
    this.hint = this.add.text(width / 2, height - 26, '↑ ↓ : choisir   ·   Entrée : valider', {
      fontFamily: 'sans-serif', fontSize: '13px', color: STORY_UI.textSoft,
      backgroundColor: '#15101fcc', padding: { x: 10, y: 4 },
    }).setOrigin(0.5).setDepth(1100);
    this.openedAt = this.time.now;
    this.confirmNew = false;
    this.showMainMenu();
    this.input.keyboard.on('keydown', this.onKey, this);
  }

  addFireflies(width, height) {
    for (let i = 0; i < 18; i++) {
      const c = this.add.circle(Phaser.Math.Between(0, width), Phaser.Math.Between(60, height - 40),
        Phaser.Math.FloatBetween(1.5, 3), i % 3 === 0 ? STORY_UI.pink : STORY_UI.vineLight, 0.8);
      this.tweens.add({
        targets: c, x: c.x + Phaser.Math.Between(-60, 60), y: c.y + Phaser.Math.Between(-40, 40),
        alpha: 0.15, duration: Phaser.Math.Between(2200, 4200), yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    }
  }

  // items : [{ label, action, col?, row? }] — col/row pour le menu à 2 colonnes.
  setMenu(items, { top = 290, columns = null } = {}) {
    this.menuLayer.removeAll(true);
    this.items = items;
    this.columns = columns;
    const { width } = this.scale;
    items.forEach((it, i) => {
      let x = width / 2;
      let y = top + i * 46;
      let size = '24px';
      if (columns) {
        x = it.col === 0 ? width / 2 - 200 : width / 2 + 200;
        y = top + it.row * 26;
        size = '16px';
      }
      it.text = this.add.text(x, y, it.label, {
        fontFamily: columns ? 'sans-serif' : STORY_UI.serif, fontSize: size, color: STORY_UI.text,
        stroke: '#15101f', strokeThickness: 4,
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      it.text.on('pointerover', () => this.select(i));
      it.text.on('pointerdown', () => { this.select(i); this.activate(); });
      this.menuLayer.add(it.text);
    });
    this.select(0);
  }

  addColumnTitles(left, right, top) {
    const { width } = this.scale;
    for (const [x, label] of [[width / 2 - 200, left], [width / 2 + 200, right]]) {
      this.menuLayer.add(this.add.text(x, top - 30, label, {
        fontFamily: STORY_UI.serif, fontSize: '18px', fontStyle: 'bold', color: STORY_UI.title,
        stroke: '#15101f', strokeThickness: 4,
      }).setOrigin(0.5));
    }
  }

  select(i) {
    this.index = Phaser.Math.Clamp(i, 0, this.items.length - 1);
    this.items.forEach((it, k) => {
      const on = k === this.index;
      it.text.setText(on ? `❧  ${it.label}  ` : it.label);
      it.text.setColor(on ? '#ff9fc9' : STORY_UI.text);
      it.text.setScale(on ? 1.06 : 1);
    });
  }

  showMainMenu() {
    this.confirmNew = false;
    const items = [];
    if (hasSaveGame()) items.push({ label: 'Continuer', action: () => this.continueGame() });
    items.push({ label: 'Nouvelle partie', action: () => this.newGame() });
    items.push({ label: 'Zones de test', action: () => this.showTestMenu() });
    this.inTestMenu = false;
    this.logoLayer.setVisible(true);
    this.hint.setText('↑ ↓ : choisir   ·   Entrée : valider');
    this.setMenu(items, { top: 300 });
  }

  showTestMenu() {
    this.inTestMenu = true;
    const items = [];
    LEGACY_TEST_ZONES.forEach((z, row) => items.push({ label: z.name, col: 0, row, action: () => this.startZone(z.scene) }));
    DEMO_ZONES.forEach((z, row) => items.push({ label: `${row + 1}. ${z.name}`, col: 1, row, action: () => this.startZone(z.scene) }));
    items.push({ label: '← Retour', col: 0, row: LEGACY_TEST_ZONES.length + 1, action: () => this.showMainMenu() });
    this.logoLayer.setVisible(false);
    this.setMenu(items, { top: 84, columns: 2 });
    this.addColumnTitles('Anciennes zones', 'Démo (accès direct)', 84);
    this.hint.setText('Flèches : choisir   ·   Entrée : lancer   ·   Échap : retour');
  }

  continueGame() {
    loadGame(this.game);
    const entry = storyZoneEntry(storyGet('lastZone')) || DEMO_ZONES[0];
    const enterId = storyGet('lastEnterId');
    goToScene(this, entry.scene, enterId ? { enterId } : {});
  }

  newGame() {
    if (hasSaveGame() && !this.confirmNew) {
      // Deuxième appui pour confirmer : on ne jette pas une partie par erreur.
      this.confirmNew = true;
      const it = this.items[this.index];
      it.label = 'Effacer la sauvegarde ? (valider)';
      this.select(this.index);
      return;
    }
    resetGame(this.game);
    goToScene(this, 'PrologueScene');
  }

  startZone(key) {
    goToScene(this, key);
  }

  activate() {
    const it = this.items[this.index];
    if (it) it.action();
  }

  onKey(event) {
    if (event.repeat || this.time.now - this.openedAt < 300 || this.__transitioningAway) return;
    const k = event.key.toLowerCase();
    if (k === 'enter' || k === ' ' || k === 'e') { this.activate(); return; }
    if (k === 'escape' && this.inTestMenu) { this.showMainMenu(); return; }
    if (k !== 'arrowup' && k !== 'z' && k !== 'arrowdown' && k !== 's' && k !== 'arrowleft' && k !== 'q' && k !== 'arrowright' && k !== 'd') return;
    if (this.confirmNew) this.showMainMenu();
    const up = k === 'arrowup' || k === 'z';
    const down = k === 'arrowdown' || k === 's';
    if (!this.columns) {
      if (up || down) this.select((this.index + (up ? -1 : 1) + this.items.length) % this.items.length);
      return;
    }
    const cur = this.items[this.index];
    const sameCol = this.items.map((it, i) => ({ it, i })).filter(({ it }) => it.col === cur.col);
    if (up || down) {
      const pos = sameCol.findIndex(({ i }) => i === this.index);
      const next = sameCol[(pos + (up ? -1 : 1) + sameCol.length) % sameCol.length];
      this.select(next.i);
    } else {
      const other = this.items.map((it, i) => ({ it, i })).filter(({ it }) => it.col !== cur.col);
      if (!other.length) return;
      const best = other.reduce((a, b) => (Math.abs(b.it.row - cur.row) < Math.abs(a.it.row - cur.row) ? b : a));
      this.select(best.i);
    }
  }
}
