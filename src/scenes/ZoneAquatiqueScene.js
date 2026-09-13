// Zone aquatique : même moule que les zones à fosse (Zone2/Zone4), mais la
// coupure centrale est de l'eau (cf. addWaterZone dans LevelKit.js) au lieu
// d'un vide — sans la Pieuvre (sanctuaire posé en fin de Zone4), l'eau
// profonde est un piège (reset, cf. Player.js) ; avec, on nage à travers.
class ZoneAquatiqueScene extends Phaser.Scene {
  constructor() {
    super('ZoneAquatiqueScene');
  }

  create(sceneData) {
    // Cf. Zone1Scene.js pour le pourquoi de resolveZoneData.
    resolveZoneData('zone_aquatique', ZONE_AQUATIQUE_DATA).then((data) => buildLevelFromData(this, data, sceneData));
  }

  update(time, delta) {
    updateLevelFromData(this, time, delta);
  }
}
