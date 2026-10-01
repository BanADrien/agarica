class EpreuveSingeScene extends Phaser.Scene {
  constructor() {
    super('EpreuveSingeScene');
  }

  create(sceneData) {
    resolveZoneData('epreuve_singe', EPREUVE_SINGE_DATA).then((data) => buildLevelFromData(this, data, sceneData));
  }

  update(time, delta) {
    updateLevelFromData(this, time, delta);
  }
}
