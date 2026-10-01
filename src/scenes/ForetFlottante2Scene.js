class ForetFlottante2Scene extends Phaser.Scene {
  constructor() {
    super('ForetFlottante2Scene');
  }

  create(sceneData) {
    resolveZoneData('foret_flottante_2', FORET_FLOTTANTE_2_DATA).then((data) => buildLevelFromData(this, data, sceneData));
  }

  update(time, delta) {
    updateLevelFromData(this, time, delta);
  }
}
