class HutteMorgatScene extends Phaser.Scene {
  constructor() {
    super('HutteMorgatScene');
  }

  create(sceneData) {
    resolveZoneData('hutte_morgat', HUTTE_MORGAT_DATA).then((data) => buildLevelFromData(this, data, sceneData));
  }

  update(time, delta) {
    updateLevelFromData(this, time, delta);
  }
}
