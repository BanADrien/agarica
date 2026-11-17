// Mode édition : `index.html?editor` ouvre le NOUVEL éditeur de niveaux (src/editeur/, interface HTML
// autour du canvas, cf. docs/production/EDITEUR_V2_DESIGN.md) ; `?editor=ancien` garde l'ancien
// (EditorScene.js, panneau #editor-ui), accessible tant que le nouveau n'est pas validé. Dans les deux cas
// BootScene saute l'écran-titre et lance la scène 'EditorScene' une fois les images chargées.
const EDITOR_PARAM = new URLSearchParams(window.location.search).get('editor');
const EDITOR_MODE = EDITOR_PARAM !== null;
const EDITEUR_ANCIEN = EDITOR_PARAM === 'ancien';
// (Si un fichier du nouvel éditeur manque, l'ancien prend le relais plutôt qu'une page vide.)
const EDITEUR_NOUVEAU = EDITOR_MODE && !EDITEUR_ANCIEN && typeof EditeurEcriture !== 'undefined' && typeof editeurIcone === 'function'
  && typeof Editeur !== 'undefined' && typeof EDITEUR_SCENES !== 'undefined' && typeof EditeurInterface !== 'undefined';
if (EDITOR_MODE && !EDITEUR_NOUVEAU) {
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
    ZoneAquatiqueScene, Zone5Scene, ZonetestScene, ZoneOursScene,
    EndScreenScene,
    EditorScene, PlaytestScene,
    CampfireMenuScene,
    DialogueScene, InventoryScene, MapScene, TitleScene,
    OptionsScene, ControlsScene, CreditsScene, PauseScene, ShopScene,
    BosquetScene, ForetSombre1Scene, ForetSombre2Scene, GrandArbreRacinesScene, GrandArbreAreneScene, MondeSpirituelScene, EpreuveSingeScene, ForetFlottante1Scene,
    ForetFlottante2Scene, ClairierePlanteScene, HutteMorgatScene, ForetCorrompue1Scene, AreneGhiltScene, TrouSombreScene, BosquetRetourScene,
    // Vague 3 : zones facultatives.
    GrotteLisiereScene, GaleriesRacinesScene, CercleLuneScene, CimeCacheeScene, IleDesVentsScene,
    IleDuGardienScene, MaraisBrumesScene, RacinesSuspenduesScene, NidCoconsScene, CanopeeMaladeScene,
    // Zone de test de l'éclairage par sections (src/data/grotte_lumiere_data.js).
    GrotteLumiereScene,
  ],
};

if (EDITEUR_NOUVEAU) {
  // Le nouvel éditeur prend la place de l'ancien sous la clé 'EditorScene' (relais vers sa propre scène) ;
  // zones photographiées et interface posée AVANT la création du jeu (le canvas naît dans la page de l'éditeur).
  config.scene = config.scene.filter((s) => s !== EditorScene).concat(EDITEUR_SCENES);
  Editeur.demarrer();
  EditeurInterface.demarrer();
}

window.__game = new Phaser.Game(config);
// `?muet` dans l'adresse : aucun son (onglets de test ouverts par l'assistant : demande de l'utilisateur du
// 2026-11-15, « arrête de mettre du son sur ce que tu ouvres »).
if (new URLSearchParams(window.location.search).has('muet')) {
  window.__game.events.once('ready', () => { window.__game.sound.mute = true; });
  if (window.__game.sound) window.__game.sound.mute = true;
}
