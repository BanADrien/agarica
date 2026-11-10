class Zone1Scene extends Phaser.Scene {
  constructor() {
    super('Zone1Scene');
  }

  create(sceneData) {
    resolveZoneData('zone1', ZONE1_DATA).then((data) => buildLevelFromData(this, data, sceneData));
  }

  update(time, delta) {
    updateLevelFromData(this, time, delta);
  }
}
