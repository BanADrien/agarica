class BosquetScene extends Phaser.Scene {
  constructor() {
    super('BosquetScene');
  }

  create(sceneData) {
    resolveZoneData('bosquet', BOSQUET_DATA).then((data) => buildLevelFromData(this, data, sceneData));
  }

  update(time, delta) {
    updateLevelFromData(this, time, delta);
  }
}
