class TrouSombreScene extends Phaser.Scene {
  constructor() {
    super('TrouSombreScene');
  }

  create(sceneData) {
    resolveZoneData('trou_sombre', TROU_SOMBRE_DATA).then((data) => buildLevelFromData(this, data, sceneData));
  }

  update(time, delta) {
    updateLevelFromData(this, time, delta);
  }
}
