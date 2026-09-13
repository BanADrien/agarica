class Zone1Scene extends Phaser.Scene {
  constructor() {
    super('Zone1Scene');
  }

  create(sceneData) {
    // `resolveZoneData` (cf. LevelKit.js) : reprend un brouillon enregistré
    // depuis l'éditeur pour "zone1" s'il en existe un, sinon ZONE1_DATA
    // telle quelle -- retour utilisateur : "les maps s'actualise dans le
    // mode edit mais pas dans le mode de base". Le feu de camp de cette
    // zone (auparavant planté ici à la main) est maintenant une donnée de
    // niveau comme les autres (cf. ZONE1_DATA.campfires, rendu par
    // buildLevelFromData) -- retour utilisateur : "rajoute le feu de camp
    // dans les element rajoutable dans le mode édit".
    resolveZoneData('zone1', ZONE1_DATA).then((data) => buildLevelFromData(this, data, sceneData));
  }

  update(time, delta) {
    updateLevelFromData(this, time, delta);
  }
}
