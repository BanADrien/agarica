// Petite salle de passage, atteinte en tombant dans la fosse de Zone2 (au
// lieu d'un échec/reset comme avant) et permettant d'en ressortir par une
// ouverture au plafond, en Aigle, vers Zone3 — referme une boucle dans la
// map au lieu d'une simple ligne droite (cf. GDD "grotte").
class SousGrotteScene extends Phaser.Scene {
  constructor() {
    super('SousGrotteScene');
  }

  create(sceneData) {
    // Cf. Zone1Scene.js pour le pourquoi de resolveZoneData -- résolu AVANT
    // le décor ci-dessous, qui a besoin de `levelWidth` (un brouillon
    // enregistré depuis l'éditeur pourrait l'avoir changé).
    resolveZoneData('sous_grotte', SOUS_GROTTE_DATA).then((data) => {
      const { width, height } = this.scale;
      const levelWidth = data.levelWidth;

      // Décor propre (souterrain, pas de lune/ligne d'arbres visible d'ici) :
      // fond dégradé sombre + silhouette rocheuse au sol, réutilisant les
      // mêmes textures procédurales que les zones en extérieur. Ajouté AVANT
      // buildLevelFromData (data.decor:false y désactive le décor générique)
      // pour rester derrière tout le reste à l'écran (ordre de création =
      // ordre de rendu, aucun depth dédié).
      const bg = this.add.graphics();
      bg.fillGradientStyle(0x0b0814, 0x0b0814, 0x160f22, 0x160f22, 1);
      bg.fillRect(0, 0, width, height);
      bg.setScrollFactor(0);

      ensureTreeTexture(this, Math.ceil(levelWidth * 1.4), 160);
      this.add.image(-100, SOUS_GROTTE_GROUND_BOTTOM_Y, TREE_TEXTURE_KEY)
        .setOrigin(0, 1)
        .setScrollFactor(0.4)
        .setAlpha(0.7);

      buildLevelFromData(this, data, sceneData);
    });
  }

  update(time, delta) {
    // Cf. Zone2Scene.js : rien à faire tant que create() (promesse
    // resolveZoneData) n'a pas fini de poser this.player.
    if (!this.player) return;
    updateLevelFromData(this, time, delta);

    // Ressort en Zone4 (pas Zone2) : ferme la boucle plus loin dans la map,
    // en évitant au passage le Loup sanguinaire de Zone2. Condition sur la
    // hauteur (pas un seuil en x) : hors du schéma générique de
    // buildLevelFromData.
    if (this.player.y < SOUS_GROTTE_CEILING_CENTER_Y - 10) {
      goToScene(this, 'Zone4Scene', { enterFrom: 'bottom', atX: 100 });
    }
  }
}
