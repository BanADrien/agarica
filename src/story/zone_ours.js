// Script de la zone de test des familles (src/data/zone_ours_data.js) : il
// donne les quatre ours d'un coup. Rien dans l'histoire ne les débloque encore.
//
// À l'entrée : toutes les formes et toutes les compétences sont débloquées
// (pour composer des équipes à 1, 2, 3 ou 4 ursidés au feu de camp), énergie
// pleine. La PREMIÈRE fois seulement (drapeau `zoneOursPret`), l'équipe est
// posée d'office sur les ours : grizzly au sol, ours-hibou en l'air, ours,
// panda et ours polaire sur A, F, R -- on essaie tout sans passer par le feu.
// Ensuite, l'équipe choisie au feu est gardée d'une visite à l'autre.
const ZONE_OURS_FORMS = ['hasWolfForm', 'hasMonkeyForm', 'hasEagleForm', 'hasOctopusForm', 'hasGrizzlyForm', 'hasOwlbearForm'];
const ZONE_OURS_SKILLS = ['ours', 'pierre', 'papillon', 'panda', 'ours_polaire'];

ZONE_SCRIPTS.zone_ours = {
  create(scene) {
    const p = scene.player;
    if (!p) return;
    const reg = scene.registry;
    for (const flag of ZONE_OURS_FORMS) {
      reg.set(flag, true);
      p[flag] = true;
    }
    // Déjà « vues » : aucune ne prend d'office la place de la forme aérienne choisie.
    for (const id of Object.keys(p.airFormsSeen)) p.airFormsSeen[id] = true;
    for (const id of ZONE_OURS_SKILLS) if (SKILL_DEFS[id]) p.unlockedSkills.add(id);
    reg.set('unlockedSkills', [...p.unlockedSkills]);
    if (!reg.get('zoneOursPret')) {
      reg.set('zoneOursPret', true);
      p.equipForm('grizzly');
      p.equipForm('owlbear');
      p.skillSlots = ['ours', 'panda', 'ours_polaire'];
      reg.set('skillSlots', p.skillSlots);
    }
    // Images provisoires des ours : fabriquées maintenant, pas au premier usage.
    if (typeof ursideSetupPlayer === 'function') ursideSetupPlayer(scene, p);
    p.recomputeTotemBonuses();
    p.hearts = p.maxHearts;
    p.energy = p.maxEnergy;
    reg.set('hearts', p.hearts);
    reg.set('energy', p.energy);
    scene.time.delayedCall(700, () => {
      if (scene.sys.isActive() && typeof showToast === 'function') {
        showToast(scene, 'Les quatre ours sont à toi. Change ton équipe au feu de camp.', 4200);
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
