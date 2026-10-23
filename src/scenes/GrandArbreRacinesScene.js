class GrandArbreRacinesScene extends Phaser.Scene {
  constructor() {
    super('GrandArbreRacinesScene');
  }

  create(sceneData) {
    resolveZoneData('grand_arbre_racines', GRAND_ARBRE_RACINES_DATA).then((data) => buildLevelFromData(this, data, sceneData));
  }

  update(time, delta) {
    updateLevelFromData(this, time, delta);
  }
}
