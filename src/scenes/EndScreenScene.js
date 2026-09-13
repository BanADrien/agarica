// Textes du message de fin (ticket 9) : brouillon à ajuster librement, le
// nom d'Agarica reste l'élément mis en avant comme demandé par le GDD.
const END_TITLE = 'Agarica';
const END_SUBTITLE = 'Druidesse du Cercle de la Lune';
const END_BODY_LINES = [
  "Aigle pour franchir l'impossible,",
  'Loup pour foncer sans peur,',
  'et toujours toi, sous la lune.',
];
const END_SIGNOFF = 'Joyeux anniversaire, Agarica.';

class EndScreenScene extends Phaser.Scene {
  constructor() {
    super('EndScreenScene');
  }

  create() {
    const { width, height } = this.scale;
    const groundY = height - GROUND_TILE_SIZE / 2;

    this.cameras.main.fadeIn(600, 13, 11, 26);

    // Clairière finale : même décor lunaire que les zones, mais fixe (pas
    // de scroll, un seul écran) — cf. GDD section 7, "arrivée sur une
    // clairière finale avec message de fin personnalisé".
    addMoonlitDecor(this, width, height, width);
    setupDebugToggle(this);
    ensureGroundHitboxTexture(this);
    this.ground = this.physics.add.staticGroup();
    fillGroundTiles(this.ground, 0, width, groundY);

    this.player = new Player(this, width / 2, height - 100);
    this.xara = new Xara(this, this.player);
    this.physics.add.collider(this.player, this.ground);

    this.add.text(width / 2, 60, END_TITLE, {
      fontFamily: 'sans-serif',
      fontSize: '56px',
      fontStyle: 'bold',
      color: '#ff9fc9',
    }).setOrigin(0.5);

    this.add.text(width / 2, 104, END_SUBTITLE, {
      fontFamily: 'sans-serif',
      fontSize: '16px',
      color: '#a99bd6',
    }).setOrigin(0.5);

    this.add.text(width / 2, 170, END_BODY_LINES.join('\n'), {
      fontFamily: 'sans-serif',
      fontSize: '20px',
      color: '#e8d9ff',
      align: 'center',
      lineSpacing: 10,
    }).setOrigin(0.5, 0);

    this.add.text(width / 2, 290, END_SIGNOFF, {
      fontFamily: 'sans-serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#ff9fc9',
    }).setOrigin(0.5);

    const prompt = this.add.text(width / 2, height - 24, 'Appuie sur une touche pour recommencer', {
      fontFamily: 'sans-serif',
      fontSize: '14px',
      color: '#a99bd6',
    }).setOrigin(0.5);

    this.tweens.add({ targets: prompt, alpha: 0.4, duration: 900, yoyo: true, repeat: -1 });

    // Délai avant d'écouter le clavier : évite qu'une touche encore
    // enfoncée en franchissant la ligne d'arrivée de la Zone 3 (sprint,
    // saut...) ne redémarre la partie instantanément.
    this.time.delayedCall(800, () => {
      this.input.keyboard.once('keydown', () => goToScene(this, 'Zone1Scene'));
    });
  }

  update(time, delta) {
    this.xara.update(time, delta);
  }
}
