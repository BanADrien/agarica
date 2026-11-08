// Scène gabarit de la zone « grotte_lisiere » (vague 3) : tout est dans
// src/data/grotte_lisiere_data.js (même gabarit que les autres zones, cf. EditorScene).
class GrotteLisiereScene extends Phaser.Scene {
  constructor() {
    super('GrotteLisiereScene');
  }

  create(sceneData) {
    resolveZoneData('grotte_lisiere', GROTTE_LISIERE_DATA).then((data) => buildLevelFromData(this, data, sceneData));
  }

  update(time, delta) {
    updateLevelFromData(this, time, delta);
  }
}
