// Texte d'intro : brouillon ajustable librement, même traitement que le
// message de fin (cf. EndScreenScene.js).
const PROLOGUE_LINES = [
  "La forêt occidentale se meurt sous une lune qui ne se lève plus qu'à moitié.",
  'Agarica, druidesse du Cercle de la Lune, sent l\'appel des bêtes liées à son âme.',
  'Xara, sa fidèle compagne, ne la quitte jamais.',
  "Ensemble, elles partent réveiller les esprits endormis de la forêt...",
];

class PrologueScene extends Phaser.Scene {
  constructor() {
    super('PrologueScene');
  }

  create() {
    const { width, height } = this.scale;

    fadeInScene(this);
    addMoonlitDecor(this, width, height, width);
    addCaveCeiling(this, width);

    this.add.text(width / 2, 90, 'Legend of Agarica', {
      fontFamily: 'sans-serif',
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#ff9fc9',
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - 20, PROLOGUE_LINES.join('\n\n'), {
      fontFamily: 'sans-serif',
      fontSize: '18px',
      color: '#e8d9ff',
      align: 'center',
      lineSpacing: 12,
      wordWrap: { width: width - 200 },
    }).setOrigin(0.5, 0.5);

    const prompt = this.add.text(width / 2, height - 40, 'Appuie sur une touche pour commencer', {
      fontFamily: 'sans-serif',
      fontSize: '16px',
      color: '#a99bd6',
    }).setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.4, duration: 900, yoyo: true, repeat: -1 });

    // Petit délai avant d'écouter le clavier, comme EndScreenScene : évite
    // qu'une touche encore enfoncée (celle qui a quitté le BootScene) ne
    // saute le prologue instantanément.
    this.time.delayedCall(500, () => {
      this.input.keyboard.once('keydown', () => goToScene(this, 'Zone1Scene'));
    });
  }
}
