class ForetCorrompue1Scene extends Phaser.Scene {
  constructor() {
    super('ForetCorrompue1Scene');
  }

  create(sceneData) {
    resolveZoneData('foret_corrompue_1', FORET_CORROMPUE_1_DATA).then((data) => buildLevelFromData(this, data, sceneData));
  }

  update(time, delta) {
    updateLevelFromData(this, time, delta);
  }
}
