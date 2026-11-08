// Scène gabarit de la zone « marais_brumes » (vague 3) : tout est dans
// src/data/marais_brumes_data.js (même gabarit que les autres zones, cf. EditorScene).
class MaraisBrumesScene extends Phaser.Scene {
  constructor() {
    super('MaraisBrumesScene');
  }

  create(sceneData) {
    resolveZoneData('marais_brumes', MARAIS_BRUMES_DATA).then((data) => buildLevelFromData(this, data, sceneData));
  }

  update(time, delta) {
    updateLevelFromData(this, time, delta);
  }
}
