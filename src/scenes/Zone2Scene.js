class Zone2Scene extends Phaser.Scene {
  constructor() {
    super('Zone2Scene');
  }

  create(sceneData) {
    // Cf. Zone1Scene.js pour le pourquoi de resolveZoneData.
    resolveZoneData('zone2', ZONE2_DATA).then((data) => {
      buildLevelFromData(this, data, sceneData);
      this.fallResetY = this.scale.height + 60;
    });
  }

  update(time, delta) {
    // `create()` attend resolveZoneData (promesse) avant de poser
    // this.player/this.fallResetY -- rien à faire tant que ce n'est pas
    // prêt (quelques frames tout au plus). Cf. son commentaire.
    if (!this.player) return;
    updateLevelFromData(this, time, delta);

    // La fosse n'est pas un échec : tomber dedans mène à une petite salle
    // souterraine (boucle vers Zone3 via une remontée en plané Aigle) — cf.
    // GDD "grotte". Pas un simple seuil en x comme `data.exit` : hors du
    // schéma générique de buildLevelFromData.
    if (this.player.y > this.fallResetY) {
      goToScene(this, 'SousGrotteScene');
    }
  }
}
