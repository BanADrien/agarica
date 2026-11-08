// Scène gabarit de la zone « nid_cocons » (vague 3) : tout est dans
// src/data/nid_cocons_data.js (même gabarit que les autres zones, cf. EditorScene).
class NidCoconsScene extends Phaser.Scene {
  constructor() {
    super('NidCoconsScene');
  }

  create(sceneData) {
    resolveZoneData('nid_cocons', NID_COCONS_DATA).then((data) => buildLevelFromData(this, data, sceneData));
  }

  update(time, delta) {
    updateLevelFromData(this, time, delta);
  }
}
