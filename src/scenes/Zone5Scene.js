// Arène du boss : salle plate (pas de fosse), le Loup Alpha patrouille/
// charge (LoupAlpha.js) au milieu de quelques toiles + une Araignée fixe —
// le volet "Araignée" du mini boss (GDD section 11) vient de l'arène,
// pas d'une entité fusionnée.
class Zone5Scene extends Phaser.Scene {
  constructor() {
    super('Zone5Scene');
  }

  create(sceneData) {
    // Cf. Zone1Scene.js pour le pourquoi de resolveZoneData.
    resolveZoneData('zone5', ZONE5_DATA).then((data) => {
      buildLevelFromData(this, data, sceneData);
      // `scene.enemies` est un groupe générique (cf. buildLevelFromData) :
      // pas de référence nommée pour le boss, retrouvé par type au lieu de
      // garder un index fragile.
      this.boss = this.enemies.getChildren().find((e) => e instanceof LoupAlpha);
    });
  }

  update(time, delta) {
    // Cf. Zone2Scene.js : rien à faire tant que create() (promesse
    // resolveZoneData) n'a pas fini de poser this.player/this.boss.
    if (!this.player) return;
    updateLevelFromData(this, time, delta);

    if (this.boss.defeated) {
      goToScene(this, 'EndScreenScene');
    }
  }
}
