// Scène gabarit de la zone « racines_suspendues » (vague 3) : tout est dans
// src/data/racines_suspendues_data.js (même gabarit que les autres zones, cf. EditorScene).
class RacinesSuspenduesScene extends Phaser.Scene {
  constructor() {
    super('RacinesSuspenduesScene');
  }

  create(sceneData) {
    resolveZoneData('racines_suspendues', RACINES_SUSPENDUES_DATA).then((data) => buildLevelFromData(this, data, sceneData));
  }

  update(time, delta) {
    updateLevelFromData(this, time, delta);
  }
}
