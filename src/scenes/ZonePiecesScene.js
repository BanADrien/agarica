// Zone de test des pièces du monde V2, cf. src/data/zone_pieces_data.js.
// Scène gabarit, comme les autres zones. La sauvegarde trouvée à l'entrée est
// remise telle quelle en sortant (zoneOursProtectSave, ZoneOursScene.js) :
// rien de ce qu'on essaie ici (ours donnés, blocs cassés…) ne reste dans la
// vraie partie.
class ZonePiecesScene extends Phaser.Scene {
  constructor() {
    super('ZonePiecesScene');
  }

  create(sceneData) {
    // AVANT la création du joueur : son constructeur écrit déjà l'état.
    if (typeof zoneOursProtectSave === 'function') zoneOursProtectSave(this);
    resolveZoneData('zone_pieces', ZONE_PIECES_DATA).then((data) => buildLevelFromData(this, data, sceneData));
  }

  update(time, delta) {
    updateLevelFromData(this, time, delta);
  }
}
