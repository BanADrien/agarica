// Écran de fin de la démo (BosquetRetourScene, et l'ancienne Zone5 de test).
// Demande de l'utilisateur du 2026-11-14 : plus de clairière, de crédits ni de
// mot d'anniversaire -- seulement le fond de l'écran-titre et « Démo terminée ».
// Une touche ramène à l'écran-titre.
const END_TITLE = 'Démo terminée';

class EndScreenScene extends Phaser.Scene {
  constructor() {
    super('EndScreenScene');
  }

  create() {
    const { width, height } = this.scale;
    this.__transitioningAway = false;
    this.cameras.main.fadeIn(600, 13, 11, 26);

    // Même fond que l'écran-titre (TitleScene) : image peinte, couvrant l'écran.
    if (this.textures.exists('titre-fond')) {
      const bg = this.add.image(width / 2, height / 2, 'titre-fond');
      bg.setScale(Math.max(width / bg.width, height / bg.height));
    } else {
      addMoonlitDecor(this, width, height, width);
    }
    this.add.rectangle(0, 0, width, height, 0x0d0b1a, 0.35).setOrigin(0);

    const title = this.add.text(width / 2, height / 2 - 10, END_TITLE, {
      fontFamily: STORY_UI.serif, fontSize: '56px', fontStyle: 'bold', color: '#ffe9f5',
      stroke: '#15101f', strokeThickness: 8, padding: { x: 24, y: 20 },
    }).setOrigin(0.5);
    title.setShadow(0, 0, '#15101f', 12, true, true);

    const prompt = this.add.text(width / 2, height - 26, 'Une touche : retour au titre', {
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
}
