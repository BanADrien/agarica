class Zone3Scene extends Phaser.Scene {
  constructor() {
    super('Zone3Scene');
  }

  create(sceneData) {
    // Cf. Zone1Scene.js pour le pourquoi de resolveZoneData.
    resolveZoneData('zone3', ZONE3_DATA).then((data) => buildLevelFromData(this, data, sceneData));
  }

  update(time, delta) {
    updateLevelFromData(this, time, delta);
  }
}
