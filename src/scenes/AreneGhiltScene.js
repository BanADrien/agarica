class AreneGhiltScene extends Phaser.Scene {
  constructor() {
    super('AreneGhiltScene');
  }

  create(sceneData) {
    resolveZoneData('arene_ghilt', ARENE_GHILT_DATA).then((data) => buildLevelFromData(this, data, sceneData));
  }

  update(time, delta) {
    updateLevelFromData(this, time, delta);
  }
}
