class ZonetestScene extends Phaser.Scene {
  constructor() {
    super('ZonetestScene');
  }

  create(sceneData) {
    resolveZoneData('zonetest', ZONETEST_DATA).then((data) => buildLevelFromData(this, data, sceneData));
  }

  update(time, delta) {
    updateLevelFromData(this, time, delta);
  }
}
