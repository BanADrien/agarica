// Monde V2 : scène gabarit, comme les autres zones (données : src/data/v2_hauts_bosquet_data.js).
class V2HautsBosquetScene extends Phaser.Scene {
  constructor() {
    super('V2HautsBosquetScene');
  }

  create(sceneData) {
    resolveZoneData('v2_hauts_bosquet', V2_HAUTS_BOSQUET_DATA).then((data) => buildLevelFromData(this, data, sceneData));
  }

  update(time, delta) {
    updateLevelFromData(this, time, delta);
  }
}
