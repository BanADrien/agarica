class ForetSombre2Scene extends Phaser.Scene {
  constructor() {
    super('ForetSombre2Scene');
  }

  create(sceneData) {
    resolveZoneData('foret_sombre_2', FORET_SOMBRE_2_DATA).then((data) => buildLevelFromData(this, data, sceneData));
  }

  update(time, delta) {
    updateLevelFromData(this, time, delta);
  }
}
