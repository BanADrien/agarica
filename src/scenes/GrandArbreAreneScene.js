class GrandArbreAreneScene extends Phaser.Scene {
  constructor() {
    super('GrandArbreAreneScene');
  }

  create(sceneData) {
    resolveZoneData('grand_arbre_arene', GRAND_ARBRE_ARENE_DATA).then((data) => buildLevelFromData(this, data, sceneData));
  }

  update(time, delta) {
    updateLevelFromData(this, time, delta);
  }
}
