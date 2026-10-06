// Mode édition (voir EditorScene.js) : index.html?editor affiche la barre
// d'outils HTML (#editor-ui, cachée par défaut) par-dessus le canvas et
// fait router BootScene vers EditorScene une fois les assets chargés, au
// lieu de l'écran-titre normal (cf. fin de BootScene.create()).
const EDITOR_MODE = new URLSearchParams(window.location.search).has('editor');
if (EDITOR_MODE) {
  document.body.classList.add('editor-mode');
  document.getElementById('editor-ui').style.display = 'block';
}

const config = {
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  parent: 'game-container',
  backgroundColor: '#0d0b1a',
  // Résolution de design fixe (960x540) mise à l'échelle pour remplir la
  // fenêtre (canvas restait minuscule sur un grand écran sans ça).
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1300 },
      // Ctrl+I bascule l'affichage en jeu (cf. setupDebugToggle dans LevelKit.js).
      debug: false,
      // Retour utilisateur (persistant, réapparu tel quel dans une passe
      // suivante malgré le premier réglage à 8) : "les hitbox bloquent mal,
      // j'arrive souvent à passer à travers, par dessous ou les côtés" --
      // repro isolée à un vrai comportement d'Arcade Physics (indépendant de
      // ce projet, reproduit avec une simple tuile de sol par défaut) : sa
      // séparation entre un corps dynamique et une tuile statique peut, pour
      // une bande étroite de profondeurs de chevauchement/vitesses, laisser
      // le corps traverser ENTIÈREMENT au lieu de le repousser. `overlapBias`
      // (défaut Phaser : 4) est le réglage officiel pour ce cas.
      // Balayage paramétrique (plateforme fine à hauteurs croissantes, cf.
      // scratchpad/test_tunnel_height_sweep*.js) : à 8, un passage-à-travers
      // COMPLET reproductible existe encore (ex: monter jusqu'à la hauteur
      // max du saut, comme s'il n'y avait aucune plateforme). Testé jusqu'à
      // 12/16 (cf. commentaire précédent, gardé pour mémoire) : referment ce
      // cas mais en ouvrent un AUTRE pire (saut qui ne décolle plus DU TOUT à
      // un point réel à faible dégagement de Zone1Scene). Re-testé sur toute
      // la plage 8-32 (cf. scratchpad/test_bias_tight_clearance2.js) : 20 est
      // le seul point qui ferme le passage-à-travers complet PARTOUT dans le
      // balayage (saut correctement stoppé à hauteur raisonnable, jamais 0
      // NI la hauteur max du saut) sans reproduire le blocage à 0 sur le
      // point réel à faible dégagement -- pas un compromis, une vraie
      // fermeture du cas dans tous les tests essayés, mais comme pour 8,
      // aucune valeur ne garantit 100% des cas extrêmes non testés.
      overlapBias: 20,
    },
  },
  scene: [
    BootScene, PrologueScene,
    Zone1Scene, Zone3Scene, Zone2Scene, SousGrotteScene, Zone4Scene,
    ZoneAquatiqueScene, Zone5Scene, ZonetestScene,
    EndScreenScene,
    EditorScene, PlaytestScene,
    CampfireMenuScene,
    DialogueScene, InventoryScene, MapScene, TitleScene,
    OptionsScene, ControlsScene, CreditsScene, PauseScene,
    BosquetScene, ForetSombre1Scene, ForetSombre2Scene, GrandArbreRacinesScene, GrandArbreAreneScene, MondeSpirituelScene, EpreuveSingeScene, ForetFlottante1Scene,
    ForetFlottante2Scene, ClairierePlanteScene, HutteMorgatScene, ForetCorrompue1Scene, AreneGhiltScene, TrouSombreScene, BosquetRetourScene,
  ],
};

window.__game = new Phaser.Game(config);
