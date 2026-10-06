// OptionsScene — réglages (overlay au-dessus de l'écran-titre ou de la pause).
// Plein écran, rappel des touches en jeu, volumes (grisés tant qu'il n'y a
// pas de son), écran des contrôles, effacement de la sauvegarde (depuis le
// titre seulement) et, discrètement, l'accès aux zones de test.
// Réglages mémorisés dans localStorage (cf. menuOptions, MenuKit.js).
class OptionsScene extends MenuOverlayScene {
  constructor() {
    super('OptionsScene');
  }

  create() {
    const fromTitle = this.callerKey === 'TitleScene';
    const items = [
      {
        label: 'Plein écran',
        value: () => (this.scale.isFullscreen ? '◂ Activé ▸' : '◂ Désactivé ▸'),
        action: () => this.toggleFullscreen(),
        onLeft: () => this.toggleFullscreen(), onRight: () => this.toggleFullscreen(),
      },
      {
        label: 'Rappel des touches en jeu',
        value: () => (menuOptions().controlsHint ? '◂ Oui ▸' : '◂ Non ▸'),
        action: () => this.toggleHint(),
        onLeft: () => this.toggleHint(), onRight: () => this.toggleHint(),
      },
      { label: 'Musique', disabled: true, value: () => 'bientôt' },
      { label: 'Effets sonores', disabled: true, value: () => 'bientôt' },
      { label: 'Voir les contrôles', value: () => '›', action: () => menuOpenChild(this, 'ControlsScene') },
    ];
    if (fromTitle) {
      items.push({
        label: 'Effacer la sauvegarde', value: () => (hasSaveGame() ? '›' : 'aucune'),
        disabled: !hasSaveGame(), action: () => this.eraseSave(),
      });
      items.push({ label: 'Zones de test (développement)', dim: true, value: () => '›', action: () => this.close('testZones') });
    }
    items.push({ label: 'Retour', value: () => '', action: () => this.close() });

    const spacing = 40;
    const h = 96 + items.length * spacing + 30;
    const f = this.buildFrame(520, h, { seed: 5 });
    this.root.add(menuPanelTitle(this, f.x + f.w / 2, f.y + 34, 'Options', { size: 24 }));
    this.list = new MenuList(this, {
      x: f.x + f.w / 2, y: f.y + 96, width: f.w - 40, spacing, size: 19, items,
    });
    this.root.add(this.list.container);
    this.status = this.add.text(f.x + f.w / 2, f.y + f.h - 20, 'Échap : retour', {
      fontFamily: 'sans-serif', fontSize: '12px', color: STORY_UI.textSoft,
    }).setOrigin(0.5);
    this.root.add(this.status);
    // Le plein écran peut changer hors du menu (F11, Échap du navigateur).
    this.scale.on('enterfullscreen', this.refreshList, this);
    this.scale.on('leavefullscreen', this.refreshList, this);
    this.scale.on('fullscreenfailed', this.onFullscreenFailed, this);
    this.scale.on('fullscreenunsupported', this.onFullscreenFailed, this);
    this.events.once('shutdown', () => {
      this.scale.off('enterfullscreen', this.refreshList, this);
      this.scale.off('leavefullscreen', this.refreshList, this);
      this.scale.off('fullscreenfailed', this.onFullscreenFailed, this);
      this.scale.off('fullscreenunsupported', this.onFullscreenFailed, this);
    });
  }

  refreshList() {
    if (this.list) this.list.refresh();
  }

  onFullscreenFailed() {
    if (this.status && this.status.active) this.status.setText('Plein écran indisponible ici — essaie F11.');
  }

  toggleFullscreen() {
    try {
      this.scale.toggleFullscreen();
    } catch (e) {
      this.onFullscreenFailed();
    }
    this.time.delayedCall(200, () => this.refreshList());
  }

  toggleHint() {
    menuSetOption('controlsHint', !menuOptions().controlsHint);
  }

  async eraseSave() {
    const ok = await menuConfirm(this, {
      title: 'Effacer la sauvegarde ?',
      text: 'Ta partie en cours sera perdue.\nLes chapitres déjà atteints restent accessibles.',
      yes: 'Effacer', no: 'Garder',
    });
    if (!ok || !this.sys.isActive()) return;
    menuNoteSaveProgress();
    resetGame(this.game);
    this.status.setText('Sauvegarde effacée.');
    const it = this.list.items.find((o) => o.label === 'Effacer la sauvegarde');
    if (it) {
      it.disabled = true;
      it.text.setColor('#6f6391');
      if (it.valueText) it.valueText.setColor('#6f6391');
      this.list.move(1);
    }
    this.list.refresh();
  }

  onChildClosed() {
    this.openedAt = this.time.now;
  }
}
