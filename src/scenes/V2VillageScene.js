// Monde V2 : scène gabarit, comme les autres zones (données : src/data/v2_village_data.js).
class V2VillageScene extends Phaser.Scene {
  constructor() {
    super('V2VillageScene');
  }

  create(sceneData) {
    resolveZoneData('v2_village', V2_VILLAGE_DATA).then((data) => buildLevelFromData(this, data, sceneData));
  }

  update(time, delta) {
    updateLevelFromData(this, time, delta);
  }
}
