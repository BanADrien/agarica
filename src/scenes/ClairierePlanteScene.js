class ClairierePlanteScene extends Phaser.Scene {
  constructor() {
    super('ClairierePlanteScene');
  }

  create(sceneData) {
    resolveZoneData('clairiere_plante', CLAIRIERE_PLANTE_DATA).then((data) => buildLevelFromData(this, data, sceneData));
  }

  update(time, delta) {
    updateLevelFromData(this, time, delta);
  }
}
