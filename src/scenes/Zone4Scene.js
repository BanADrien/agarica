class Zone4Scene extends Phaser.Scene {
  constructor() {
    super('Zone4Scene');
  }

  create(sceneData) {
    // Cf. Zone1Scene.js pour le pourquoi de resolveZoneData -- appliqué
    // sur ZONE4_DATA AVANT le clone superficiel ci-dessous, pour qu'un
    // brouillon enregistré depuis l'éditeur garde aussi son spawn correct
    // à une entrée par le bas (sinon ce clone serait fait sur l'ancienne
    // donnée figée, pas le brouillon).
    resolveZoneData('zone4', ZONE4_DATA).then((base) => {
      // Entrée normale (depuis Zone2) au spawn par défaut ; entrée par la
      // boucle de la SousGrotte (remontée en plané Aigle par le plafond) sur
      // le premier segment de sol, en amont de la fosse à corbeaux — un clone
      // superficiel de la donnée pour ne pas modifier `base` elle-même
      // (rejouée telle quelle à chaque entrée "normale").
      const data = sceneData && sceneData.enterFrom === 'bottom'
        ? { ...base, playerSpawn: { x: sceneData.atX, y: base.playerSpawn.y } }
        : base;
      buildLevelFromData(this, data, sceneData);
      this.fallResetY = this.scale.height + 60;
    });
  }

  update(time, delta) {
    // Cf. Zone2Scene.js : rien à faire tant que create() (promesse
    // resolveZoneData) n'a pas fini de poser this.player/this.fallResetY.
    if (!this.player) return;
    updateLevelFromData(this, time, delta);

    // Contrairement à Zone2, tomber dans le vide ne change pas de scène ici
    // : ça blesse juste le joueur (déjà en pleine zone de patrouille des
    // corbeaux). Hors du schéma générique de buildLevelFromData.
    if (this.player.y > this.fallResetY) {
      this.player.hitByEnemy();
    }
  }
}
