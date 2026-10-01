class ForetFlottante1Scene extends Phaser.Scene {
  constructor() {
    super('ForetFlottante1Scene');
  }

  create(sceneData) {
    resolveZoneData('foret_flottante_1', FORET_FLOTTANTE_1_DATA).then((data) => buildLevelFromData(this, data, sceneData));
  }

  update(time, delta) {
    updateLevelFromData(this, time, delta);
  }
}
