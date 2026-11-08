// Scène gabarit de la zone « cime_cachee » (vague 3) : tout est dans
// src/data/cime_cachee_data.js (même gabarit que les autres zones, cf. EditorScene).
class CimeCacheeScene extends Phaser.Scene {
  constructor() {
    super('CimeCacheeScene');
  }

  create(sceneData) {
    resolveZoneData('cime_cachee', CIME_CACHEE_DATA).then((data) => buildLevelFromData(this, data, sceneData));
  }

  update(time, delta) {
    updateLevelFromData(this, time, delta);
  }
}
