class ForetSombre1Scene extends Phaser.Scene {
  constructor() {
    super('ForetSombre1Scene');
  }

  create(sceneData) {
    resolveZoneData('foret_sombre_1', FORET_SOMBRE_1_DATA).then((data) => buildLevelFromData(this, data, sceneData));
  }

  update(time, delta) {
    updateLevelFromData(this, time, delta);
  }
}
