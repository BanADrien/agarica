// Zone de test des familles d'animaux (les quatre ours), cf.
// src/data/zone_ours_data.js. Scène gabarit, comme les autres zones.
//
// Sauvegarde préservée : cette zone débloque tout et change l'équipe ; or la
// moindre écriture d'état (storySet) réécrit la sauvegarde du navigateur avec
// le registre courant. La sauvegarde trouvée à l'entrée est donc remise telle
// quelle à la sortie de la zone (retour au titre, autre scène) et à la
// fermeture ou au rechargement de la page : rien de ce qu'on essaie ici ne
// reste dans la vraie partie.
function zoneOursProtectSave(scene) {
  let backup;
  try {
    backup = window.localStorage.getItem(SAVE_STORAGE_KEY);
  } catch (e) {
    return;
  }
  const restore = () => {
    try {
      if (backup === null) window.localStorage.removeItem(SAVE_STORAGE_KEY);
      else window.localStorage.setItem(SAVE_STORAGE_KEY, backup);
    } catch (e) { /* stockage indisponible */ }
  };
  window.addEventListener('pagehide', restore);
  scene.events.once('shutdown', () => {
    window.removeEventListener('pagehide', restore);
    restore();
  });
}

class ZoneOursScene extends Phaser.Scene {
  constructor() {
    super('ZoneOursScene');
  }

  create(sceneData) {
    // AVANT la création du joueur : son constructeur écrit déjà l'état.
    zoneOursProtectSave(this);
    resolveZoneData('zone_ours', ZONE_OURS_DATA).then((data) => buildLevelFromData(this, data, sceneData));
  }

  update(time, delta) {
    updateLevelFromData(this, time, delta);
  }
}
