// Monde V2 (chantier) : écran d'attente au bout de la région construite. Il
// disparaîtra quand la porte de l'Est mènera à la vraie lisière.
class V2SuiteScene extends Phaser.Scene {
  constructor() {
    super('V2SuiteScene');
  }

  create() {
    const { width, height } = this.scale;
    this.__transitioningAway = false;
    fadeInScene(this);
    this.add.rectangle(0, 0, width, height, 0x0d0b1a, 1).setOrigin(0);
    this.add.text(width / 2, height / 2 - 40, 'Suite en construction', {
      fontFamily: STORY_UI.serif, fontSize: '34px', fontStyle: 'bold', color: '#ffe9f5',
      stroke: '#15101f', strokeThickness: 6, padding: { x: 20, y: 14 },
    }).setOrigin(0.5);
    this.add.text(width / 2, height / 2 + 14, 'La lisière', {
      fontFamily: STORY_UI.serif, fontSize: '22px', color: '#e8d9ff',
    }).setOrigin(0.5);
    this.add.text(width / 2, height - 44, 'Appuie sur une touche pour revenir au titre', {
      fontFamily: 'sans-serif', fontSize: '14px', color: STORY_UI.textSoft,
    }).setOrigin(0.5);
    // Petit délai : la touche tenue en passant la porte ne doit pas sauter l'écran.
    this.time.delayedCall(900, () => this.input.keyboard.once('keydown', () => goToScene(this, 'TitleScene')));
  }
}
