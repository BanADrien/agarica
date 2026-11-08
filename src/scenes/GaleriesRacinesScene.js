// Scène gabarit de la zone « galeries_racines » (vague 3) : tout est dans
// src/data/galeries_racines_data.js (même gabarit que les autres zones, cf. EditorScene).
class GaleriesRacinesScene extends Phaser.Scene {
  constructor() {
    super('GaleriesRacinesScene');
  }

  create(sceneData) {
    resolveZoneData('galeries_racines', GALERIES_RACINES_DATA).then((data) => buildLevelFromData(this, data, sceneData));
  }

  update(time, delta) {
    updateLevelFromData(this, time, delta);
  }
}
