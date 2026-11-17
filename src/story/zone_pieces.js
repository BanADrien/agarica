// Script de la zone de test des pièces du monde V2 (src/data/zone_pieces_data.js).
//
// À l'entrée : ce qu'il faut AVANT les pièces (loup et singe ; ours brun,
// pierre et papillon sur A, F, R), énergie pleine. PAS les ours que la zone
// donne elle-même (grizzly et ours-hibou par leurs totems, panda et ours
// polaire par leurs talismans) : les prendre en passant, c'est aussi les
// essayer. La première fois seulement (drapeau `zonePiecesPret`), l'équipe est
// posée d'office ; ensuite, celle choisie au feu est gardée.
const ZONE_PIECES_FORMS = ['hasWolfForm', 'hasMonkeyForm'];
const ZONE_PIECES_SKILLS = ['ours', 'pierre', 'papillon'];

ZONE_SCRIPTS.zone_pieces = {
  create(scene) {
    const p = scene.player;
    if (!p) return;
    const reg = scene.registry;
    for (const flag of ZONE_PIECES_FORMS) {
      reg.set(flag, true);
      p[flag] = true;
    }
    for (const id of ZONE_PIECES_SKILLS) if (SKILL_DEFS[id]) p.unlockedSkills.add(id);
    reg.set('unlockedSkills', [...p.unlockedSkills]);
    if (!reg.get('zonePiecesPret')) {
      reg.set('zonePiecesPret', true);
      // Le singe déjà « vu » : un ours-hibou pris au totem prendra sa place.
      p.airFormsSeen.monkey = true;
      p.equipForm('wolf');
      p.equipForm('monkey');
      p.skillSlots = ['ours', 'pierre', 'papillon'];
      reg.set('skillSlots', p.skillSlots);
    }
    if (typeof ursideSetupPlayer === 'function') ursideSetupPlayer(scene, p);
    p.recomputeTotemBonuses();
    p.hearts = p.maxHearts;
    p.energy = p.maxEnergy;
    reg.set('hearts', p.hearts);
    reg.set('energy', p.energy);
    scene.time.delayedCall(700, () => {
      if (scene.sys.isActive() && typeof showToast === 'function') {
        showToast(scene, 'Pièces du monde V2 : prends les totems et les talismans, puis essaie tout vers la droite.', 4200);
      }
    });
  },
  // Zone d'essai : l'énergie revient vite, pour enchaîner les compétences.
  update(scene, time, delta) {
    const p = scene.player;
    if (!p || !p.active || p.energy >= p.maxEnergy) return;
    p.energy = Math.min(p.maxEnergy, p.energy + (delta || 16) * 0.02);
  },
};
