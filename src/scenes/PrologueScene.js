// Prologue de la démo (Nouvelle partie) : le bosquet d'Émeraude face à la
// mousse toxique, puis BosquetScene. Les lignes apparaissent une à une ;
// une touche affiche la suivante, puis lance la partie. Texte ajustable.
const PROLOGUE_LINES = [
  "Au cœur de la forêt d'Émeraude, un bosquet de druides veille sur les arbres depuis des générations.",
  'Agarica, jeune druidesse du Cercle de la Lune, y a grandi auprès de son père, le chef du bosquet.',
  'Mais depuis quelques lunes, une mousse toxique ronge la forêt. On la gratte, on la brûle… elle revient toujours.',
  'Et les bêtes, autrefois paisibles, deviennent agressives.',
  'Cette nuit encore, tout le bosquet lutte contre la mousse…',
];

class PrologueScene extends Phaser.Scene {
  constructor() {
    super('PrologueScene');
  }

  create() {
    const { width, height } = this.scale;
    this.__transitioningAway = false;
    fadeInScene(this);
    addMoonlitDecor(this, width, height, width, [], 'fond_bosquet');
    addCaveCeiling(this, width);
    this.add.rectangle(0, 0, width, height, 0x0d0b1a, 0.6).setOrigin(0);

    this.add.text(width / 2, 64, 'Le bosquet d\'Émeraude', {
      fontFamily: STORY_UI.serif, fontSize: '32px', fontStyle: 'bold', color: '#ffe9f5',
      stroke: '#15101f', strokeThickness: 6, padding: { x: 20, y: 16 },
    }).setOrigin(0.5).setShadow(0, 0, '#ff9fc9', 14, true, true);

    this.lineTexts = PROLOGUE_LINES.map((line, i) => this.add.text(width / 2, 130 + i * 62, line, {
      fontFamily: STORY_UI.serif, fontSize: '19px', color: '#e8d9ff', align: 'center',
      wordWrap: { width: width - 220 }, lineSpacing: 6,
    }).setOrigin(0.5, 0).setAlpha(0));
    this.shownCount = 0;

    this.prompt = this.add.text(width / 2, height - 30, 'Appuie sur une touche', {
      fontFamily: 'sans-serif', fontSize: '14px', color: STORY_UI.textSoft,
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: this.prompt, alpha: 0.9, duration: 900, yoyo: true, repeat: -1, delay: 800 });

    this.revealNext();
    // Défilement automatique doux ; une touche accélère.
    this.autoTimer = this.time.addEvent({ delay: 2600, loop: true, callback: () => this.revealNext() });
    // Petit délai avant d'écouter le clavier : la touche qui a validé
    // « Nouvelle partie » ne doit pas sauter le prologue.
    this.time.delayedCall(500, () => this.input.keyboard.on('keydown', (e) => { if (!e.repeat) this.advance(); }));
  }

  revealNext() {
    if (this.shownCount >= this.lineTexts.length) return false;
    this.tweens.add({ targets: this.lineTexts[this.shownCount], alpha: 1, duration: 700 });
    this.shownCount += 1;
    return true;
  }

  advance() {
    if (this.revealNext()) return;
    this.autoTimer.remove();
    goToScene(this, 'BosquetScene');
  }
}
