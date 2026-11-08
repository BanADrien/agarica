// Scène gabarit de la zone « ile_des_vents » (vague 3) : tout est dans
// src/data/ile_des_vents_data.js (même gabarit que les autres zones, cf. EditorScene).
class IleDesVentsScene extends Phaser.Scene {
  constructor() {
    super('IleDesVentsScene');
  }

  create(sceneData) {
    resolveZoneData('ile_des_vents', ILE_DES_VENTS_DATA).then((data) => buildLevelFromData(this, data, sceneData));
  }

  update(time, delta) {
    updateLevelFromData(this, time, delta);
  }
}
