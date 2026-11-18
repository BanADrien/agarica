// Monde V2 : scène gabarit, comme les autres zones (données : src/data/v2_caves_data.js).
class V2CavesScene extends Phaser.Scene {
  constructor() {
    super('V2CavesScene');
  }

  create(sceneData) {
    resolveZoneData('v2_caves', V2_CAVES_DATA).then((data) => buildLevelFromData(this, data, sceneData));
  }

  update(time, delta) {
    updateLevelFromData(this, time, delta);
  }
}
