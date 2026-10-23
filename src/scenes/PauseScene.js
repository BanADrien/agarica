// PauseScene — menu pause en jeu (Échap / P, cf. menuGameHook dans MenuKit.js).
// La zone est mise en pause par Phaser (physique, tweens, minuteries) ET
// compte comme « monde gelé » (WORLD_FREEZING_SCENES, StoryKit.js).
// Reprendre / Contrôles / Options / Retour au titre (avec sauvegarde dans
// les zones de l'histoire).
class PauseScene extends Phaser.Scene {
  constructor() {
    super('PauseScene');
  }

  init(data) {
    this.parentKey = data && data.parentKey;
    this.closing = false;
    this.menuModal = null;
    this.menuChildOpen = null;
  }

  create() {
    const { width, height } = this.scale;
    this.openedAt = this.time.now;
    this.root = this.add.container(0, 0).setAlpha(0);
    const veil = this.add.rectangle(0, 0, width, height, 0x07050d, 0.62).setOrigin(0).setInteractive();
    this.root.add(veil);

    const parent = this.scene.get(this.parentKey);
    const entry = parent ? storyZoneEntry(parent) : null;
    this.isStory = !!entry;
    const w = 380;
    const h = 330;
    const x = (width - w) / 2;
    const y = (height - h) / 2 - 6;
    const g = this.add.graphics();
    drawStoryPanel(g, x, y, w, h, { seed: 6 });
    this.root.add(g);
    this.root.add(menuPanelTitle(this, width / 2, y + 34, 'Pause', { size: 26 }));
    const where = entry ? entry.name : 'Zone de test';
    const chapter = entry ? MENU_CHAPTERS[menuChapterIndexOfZone(entry.zone)] : null;
    this.root.add(this.add.text(width / 2, y + 70, chapter ? `${chapter.act} · ${where}` : where, {
      fontFamily: STORY_UI.serif, fontSize: '14px', fontStyle: 'italic', color: '#c9b8f0', padding: { x: 4, y: 3 },
    }).setOrigin(0.5));

    this.list = new MenuList(this, {
      x: width / 2, y: y + 118, width: w - 60, spacing: 44, size: 21,
      items: [
        { label: 'Reprendre', action: () => this.resume() },
        { label: 'Contrôles', action: () => menuOpenChild(this, 'ControlsScene') },
        { label: 'Options', action: () => menuOpenChild(this, 'OptionsScene') },
        { label: this.isStory ? 'Sauver et revenir au titre' : 'Revenir au titre', action: () => this.backToTitle() },
      ],
    });
    this.root.add(this.list.container);
    this.root.add(this.add.text(width / 2, y + h - 20, 'Échap / P : reprendre', {
      fontFamily: 'sans-serif', fontSize: '12px', color: STORY_UI.textSoft,
    }).setOrigin(0.5));
    this.tweens.add({ targets: this.root, alpha: 1, duration: 160 });
    this.input.keyboard.on('keydown', this.onKey, this);
  }

  onKey(event) {
    if (event.repeat || this.closing || this.time.now - this.openedAt < 150) return;
    if (this.menuChildClosedAt && this.time.now - this.menuChildClosedAt < 120) return;
    const action = menuKeyAction(event);
    if (this.menuModal) { if (action) this.menuModal.handleAction(action); return; }
    const k = (event.key || '').toLowerCase();
    if (action === 'back' || k === 'p') { this.resume(); return; }
    if (action) this.list.handleAction(action);
  }

  onChildClosed() {
    this.openedAt = this.time.now;
  }

  resume() {
    if (this.closing) return;
    this.closing = true;
    this.tweens.add({
      targets: this.root, alpha: 0, duration: 120,
      onComplete: () => {
        const parent = this.scene.get(this.parentKey);
        this.scene.stop();
        if (parent) {
          parent.scene.resume();
          // Les appuis faits pendant la pause ne doivent pas sauter/attaquer.
          releaseStoryInput(parent);
        }
      },
    });
  }

  backToTitle() {
    if (this.closing) return;
    this.closing = true;
    const parent = this.scene.get(this.parentKey);
    if (parent && this.isStory) saveGame(parent, { silent: true });
    this.cameras.main.fadeOut(260, 13, 11, 26);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      if (parent) this.scene.stop(this.parentKey);
      this.scene.start('TitleScene');
    });
  }
}
