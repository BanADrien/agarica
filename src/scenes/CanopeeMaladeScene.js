// Scène gabarit de la zone « canopee_malade » (vague 3) : tout est dans
// src/data/canopee_malade_data.js (même gabarit que les autres zones, cf. EditorScene).
class CanopeeMaladeScene extends Phaser.Scene {
  constructor() {
    super('CanopeeMaladeScene');
  }

  create(sceneData) {
    resolveZoneData('canopee_malade', CANOPEE_MALADE_DATA).then((data) => buildLevelFromData(this, data, sceneData));
  }

  update(time, delta) {
    updateLevelFromData(this, time, delta);
  }
}
