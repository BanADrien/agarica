class ForetFlottante1Scene extends Phaser.Scene {
  constructor() {
    super('ForetFlottante1Scene');
  }

  create(sceneData) {
    // Fond, ciel qui se révèle et caméra verticale viennent de la donnée de
    // zone (foret_flottante_1_data.js) : plus de `background` /
    // `treesAtScreenBottom` forcés ici (ils écrasaient la montée vers le ciel).
    resolveZoneData('foret_flottante_1', FORET_FLOTTANTE_1_DATA).then((data) =>
      buildLevelFromData(this, data, sceneData));
  }

  update(time, delta) {
    updateLevelFromData(this, time, delta);
  }
}
