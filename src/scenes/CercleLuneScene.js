// Scène gabarit de la zone « cercle_lune » (vague 3) : tout est dans
// src/data/cercle_lune_data.js (même gabarit que les autres zones, cf. EditorScene).
class CercleLuneScene extends Phaser.Scene {
  constructor() {
    super('CercleLuneScene');
  }

  create(sceneData) {
    resolveZoneData('cercle_lune', CERCLE_LUNE_DATA).then((data) => buildLevelFromData(this, data, sceneData));
  }

  update(time, delta) {
    updateLevelFromData(this, time, delta);
  }
}
