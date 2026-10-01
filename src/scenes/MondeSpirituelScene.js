class MondeSpirituelScene extends Phaser.Scene {
  constructor() {
    super('MondeSpirituelScene');
  }

  create(sceneData) {
    resolveZoneData('monde_spirituel', MONDE_SPIRITUEL_DATA).then((data) => buildLevelFromData(this, data, sceneData));
  }

  update(time, delta) {
    updateLevelFromData(this, time, delta);
  }
}
