// Scène gabarit de la zone « ile_du_gardien » (vague 3) : tout est dans
// src/data/ile_du_gardien_data.js (même gabarit que les autres zones, cf. EditorScene).
class IleDuGardienScene extends Phaser.Scene {
  constructor() {
    super('IleDuGardienScene');
  }

  create(sceneData) {
    resolveZoneData('ile_du_gardien', ILE_DU_GARDIEN_DATA).then((data) => buildLevelFromData(this, data, sceneData));
  }

  update(time, delta) {
    updateLevelFromData(this, time, delta);
  }
}
