// Monde V2 : scène gabarit, comme les autres zones (données : src/data/v2_source_data.js).
class V2SourceScene extends Phaser.Scene {
  constructor() {
    super('V2SourceScene');
  }

  create(sceneData) {
    resolveZoneData('v2_source', V2_SOURCE_DATA).then((data) => buildLevelFromData(this, data, sceneData));
  }

  update(time, delta) {
    updateLevelFromData(this, time, delta);
  }
}
