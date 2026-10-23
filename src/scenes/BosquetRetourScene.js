class BosquetRetourScene extends Phaser.Scene {
  constructor() {
    super('BosquetRetourScene');
  }

  create(sceneData) {
    resolveZoneData('bosquet_retour', BOSQUET_RETOUR_DATA).then((data) => buildLevelFromData(this, data, sceneData));
  }

  update(time, delta) {
    updateLevelFromData(this, time, delta);
  }
}
