// Écran de fin de la démo (BosquetRetourScene, et l'ancienne Zone5 de test) :
// « Fin de la démo — à suivre », crédits courts et le mot d'anniversaire
// (c'est un jeu-cadeau, cf. CLAUDE.md). Agarica et Xara restent dans la
// clairière comme avant. Une touche ramène à l'écran-titre. Textes ajustables.
const END_TITLE = 'Fin de la démo';
const END_SUBTITLE = 'À suivre…';
const END_BODY_LINES = [
  "Ghil't n'était pas la source de la mousse : seulement une victime.",
  "Amanite s'en est allée, et quelque part, la corruption grandit encore.",
  'Xara, elle, se tait… mais ce symbole, elle le connaissait.',
];
const END_CREDITS = 'Legend of Agarica — un jeu créé avec amour pour Agarica, druidesse du Cercle de la Lune';
const END_SIGNOFF = 'Joyeux anniversaire, Agarica.';

class EndScreenScene extends Phaser.Scene {
  constructor() {
    super('EndScreenScene');
  }

  create() {
    const { width, height } = this.scale;
    const groundY = height - GROUND_TILE_SIZE / 2;
    this.__transitioningAway = false;

    this.cameras.main.fadeIn(600, 13, 11, 26);

    // Clairière finale : même décor lunaire que les zones, mais fixe.
    addMoonlitDecor(this, width, height, width);
    setupDebugToggle(this);
    ensureGroundHitboxTexture(this);
    this.ground = this.physics.add.staticGroup();
    fillGroundTiles(this.ground, 0, width, groundY);
    this.add.rectangle(0, 0, width, height - 70, 0x0d0b1a, 0.45).setOrigin(0);

    this.player = new Player(this, width / 2, height - 100);
    this.xara = new Xara(this, this.player);
    this.physics.add.collider(this.player, this.ground);

    const title = this.add.text(width / 2, 58, END_TITLE, {
      fontFamily: STORY_UI.serif, fontSize: '48px', fontStyle: 'bold', color: '#ffe9f5',
      stroke: '#15101f', strokeThickness: 7, padding: { x: 24, y: 20 },
    }).setOrigin(0.5);
    title.setShadow(0, 0, '#ff9fc9', 18, true, true);

    this.add.text(width / 2, 104, END_SUBTITLE, {
      fontFamily: STORY_UI.serif, fontSize: '22px', fontStyle: 'italic', color: '#c9b8f0',
    }).setOrigin(0.5);

    this.add.text(width / 2, 148, END_BODY_LINES.join('\n'), {
      fontFamily: STORY_UI.serif, fontSize: '18px', color: '#e8d9ff', align: 'center', lineSpacing: 10,
    }).setOrigin(0.5, 0);

    this.add.text(width / 2, 262, END_CREDITS, {
      fontFamily: 'sans-serif', fontSize: '13px', color: STORY_UI.textSoft, align: 'center',
      wordWrap: { width: width - 200 },
    }).setOrigin(0.5);

    const signoff = this.add.text(width / 2, 310, END_SIGNOFF, {
      fontFamily: STORY_UI.serif, fontSize: '28px', fontStyle: 'bold', color: '#ff9fc9',
      stroke: '#15101f', strokeThickness: 5,
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: signoff, alpha: 1, duration: 1200, delay: 1200 });

    const prompt = this.add.text(width / 2, height - 26, "Appuie sur une touche pour revenir à l'écran-titre", {
      fontFamily: 'sans-serif', fontSize: '14px', color: STORY_UI.textSoft,
      backgroundColor: '#15101fcc', padding: { x: 10, y: 4 },
    }).setOrigin(0.5).setDepth(1100);
    this.tweens.add({ targets: prompt, alpha: 0.4, duration: 900, yoyo: true, repeat: -1 });

    // Délai avant d'écouter le clavier : une touche encore enfoncée ne doit
    // pas quitter l'écran de fin instantanément.
    this.time.delayedCall(1500, () => {
      this.input.keyboard.once('keydown', () => goToScene(this, 'TitleScene'));
    });
  }

  update(time, delta) {
    this.xara.update(time, delta);
  }
}
