// Arène du boss Gorille (cf. BossGorille.js et boss_gorille_data.js).
//
// Contrairement à Zone5Scene (Loup Alpha -> écran de fin), la victoire ne
// change PAS de scène : la zone reste jouable et affiche juste une bannière.
// C'est l'arène de test du boss -- on veut pouvoir regarder l'effondrement
// puis continuer à se promener, pas être renvoyé sur un écran de fin à chaque
// essai. Le jour où le Gorille prend sa place dans le parcours, remplacer
// `showVictoryBanner` par le `goToScene(...)` voulu (ou brancher un portail
// depuis l'éditeur, cf. le commentaire en tête de boss_gorille_data.js).
class BossGorilleScene extends Phaser.Scene {
  constructor() {
    super('BossGorilleScene');
  }

  create(sceneData) {
    // Cf. Zone1Scene.js pour le pourquoi de resolveZoneData.
    resolveZoneData('boss_gorille', BOSS_GORILLE_DATA).then((data) => {
      buildLevelFromData(this, data, sceneData);
      // `scene.enemies` est un groupe générique (cf. buildLevelFromData) :
      // le boss est retrouvé par type, comme dans Zone5Scene.
      this.boss = this.enemies.getChildren().find((e) => e instanceof BossGorille);
      this.victoryShown = false;
    });
  }

  update(time, delta) {
    // Cf. Zone2Scene.js : rien à faire tant que create() (promesse
    // resolveZoneData) n'a pas fini de poser this.player/this.boss.
    if (!this.player) return;
    updateLevelFromData(this, time, delta);

    // `defeated` n'est posé qu'à la FIN de l'animation d'effondrement (cf.
    // BossGorille.update) : la bannière arrive donc quand le boss a
    // réellement fini de tomber, pas au dernier coup porté.
    if (this.boss && this.boss.defeated && !this.victoryShown) {
      this.victoryShown = true;
      this.showVictoryBanner();
    }
  }

  showVictoryBanner() {
    const cam = this.cameras.main;
    const text = this.add.text(cam.width / 2, cam.height / 2 - 40, 'Le Gorille de pierre s\'effondre.', {
      fontFamily: 'sans-serif', fontSize: '22px', color: '#e8d9ff',
      backgroundColor: '#2a1f45', padding: { x: 14, y: 10 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(2000).setAlpha(0);
    this.tweens.add({ targets: text, alpha: 1, duration: 500 });
  }
}
