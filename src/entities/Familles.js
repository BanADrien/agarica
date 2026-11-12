// Familles d'animaux et passifs (demande de l'utilisateur du 2026-11-12, cf.
// docs/production/FAMILLES_DESIGN.md). Chargé APRÈS Player.js et les fichiers
// qui complètent SKILL_DEFS (index.html).
//
// Chaque animal -- une FORME (sol, aérien, eau) ou une COMPÉTENCE -- appartient
// à une famille. Le passif d'une famille se compte sur les animaux ÉQUIPÉS
// (décision de l'utilisateur), pas sur ceux qu'on possède : on construit son
// équipe au feu de camp. Seuls les ursidés ont un passif pour l'instant ; la
// table est faite pour en recevoir d'autres (ajouter `passive` + `tiers`).
//
// Ce fichier ne fait que COMPTER et décrire. Les effets sont appliqués là où
// ils vivent : cœur max et recul dans Player (recomputeTotemBonuses,
// hitByEnemy), taille des fracas dans Player.beginSkill et Ursides.js.

// `tiers` : paliers dans l'ordre croissant. `stats` : ce que le palier ajoute
// (additionné par familyPassiveStats) ; `text` : affiché au feu de camp.
const ANIMAL_FAMILIES = {
  ursides: {
    label: 'Ursidés',
    color: 0xffcf8f,
    passive: 'Robustesse',
    tiers: [
      { count: 2, text: '+1 cœur', stats: { hearts: 1 } },
      { count: 3, text: 'fracas plus larges', stats: { bearSize: 0.25 } },
      { count: 4, text: 'aucun recul sous les coups', stats: { steadfast: true } },
    ],
  },
  canides: { label: 'Canidés', color: 0x7dfcd8 },
  simiens: { label: 'Simiens', color: 0xa8e07a },
  oiseaux: { label: 'Oiseaux', color: 0xfff1c0 },
  // La pieuvre est « à part » (design) : une famille à elle seule.
  cephalopodes: { label: 'Céphalopodes', color: 0x9fe3ff },
  insectes: { label: 'Insectes', color: 0xf3a8ff },
  amphibiens: { label: 'Amphibiens', color: 0x8fd06a },
};

// Famille de chaque animal. `null` : aucune (la pierre est un objet).
const ANIMAL_FAMILY_OF = {
  forms: {
    wolf: 'canides', grizzly: 'ursides',
    monkey: 'simiens', eagle: 'oiseaux', owlbear: 'ursides',
    octopus: 'cephalopodes',
  },
  skills: {
    ours: 'ursides', panda: 'ursides', ours_polaire: 'ursides',
    papillon: 'insectes', crapaud: 'amphibiens', pierre: null,
  },
};

function animalFamily(kind, id) {
  const table = kind === 'form' ? ANIMAL_FAMILY_OF.forms : ANIMAL_FAMILY_OF.skills;
  return (id && table[id]) || null;
}

// Animaux équipés : la forme de chaque emplacement (sol, aérien, eau), si elle
// est débloquée, et les compétences des trois touches. Lit l'état du joueur
// vivant (ou, sans joueur, le registre : écran « Continuer », tests).
function familyEquippedAnimals(player) {
  const out = [];
  const reg = typeof storyGet === 'function' ? storyGet : () => undefined;
  const forms = (player ? player.equippedForms : reg('equippedForms')) || [];
  const flagOf = typeof FORM_FLAG_BY_ID !== 'undefined' ? FORM_FLAG_BY_ID : {};
  for (const id of forms) {
    if (!id) continue;
    const flag = flagOf[id];
    const unlocked = flag ? (player ? !!player[flag] : !!reg(flag)) : true;
    if (unlocked) out.push({ kind: 'form', id, family: animalFamily('form', id) });
  }
  const slots = (player ? player.skillSlots : reg('skillSlots')) || [];
  const seen = new Set();
  for (const id of slots) {
    // Une compétence ne compte qu'une fois, même posée par erreur sur deux touches.
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push({ kind: 'skill', id, family: animalFamily('skill', id) });
  }
  return out;
}

// { famille: nombre d'animaux équipés }.
function familyCounts(player) {
  const counts = {};
  for (const a of familyEquippedAnimals(player)) {
    if (a.family) counts[a.family] = (counts[a.family] || 0) + 1;
  }
  return counts;
}

// Nombre de paliers atteints par une famille avec `count` animaux.
function familyTierCount(familyId, count) {
  const fam = ANIMAL_FAMILIES[familyId];
  if (!fam || !fam.tiers) return 0;
  return fam.tiers.filter((t) => count >= t.count).length;
}

// Somme des effets des paliers actifs, toutes familles confondues :
// { hearts, bearSize, steadfast }. Lu par Player.recomputeTotemBonuses.
function familyPassiveStats(player) {
  const stats = { hearts: 0, bearSize: 0, steadfast: false };
  const counts = familyCounts(player);
  for (const [id, n] of Object.entries(counts)) {
    const fam = ANIMAL_FAMILIES[id];
    for (const t of (fam && fam.tiers) || []) {
      if (n < t.count) continue;
      for (const [k, v] of Object.entries(t.stats || {})) {
        if (typeof v === 'number') stats[k] = (stats[k] || 0) + v;
        else if (v) stats[k] = true;
      }
    }
  }
  return stats;
}

// Pour le menu du feu de camp : une entrée par famille ÉQUIPÉE, les plus
// fournies d'abord. `tiers` : chaque palier avec `active` ; `next` : le
// prochain palier à atteindre (null si tous atteints ou famille sans passif).
function familySummary(player) {
  const counts = familyCounts(player);
  return Object.entries(counts)
    .map(([id, count]) => {
      const fam = ANIMAL_FAMILIES[id] || { label: id };
      const tiers = (fam.tiers || []).map((t) => ({ count: t.count, text: t.text, active: count >= t.count }));
      return {
        id, label: fam.label, color: fam.color || 0xd8ccf5, count,
        passive: fam.passive || null, tiers,
        tier: tiers.filter((t) => t.active).length,
        next: tiers.find((t) => !t.active) || null,
      };
    })
    .sort((a, b) => (b.tiers.length ? 1 : 0) - (a.tiers.length ? 1 : 0) || b.count - a.count);
}

// Signature courte de l'équipe : Player.update la compare d'une image à
// l'autre pour recalculer les passifs dès qu'un emplacement change, d'où que
// vienne le changement (feu de camp, histoire, triche).
function familyTeamSignature(player) {
  return familyEquippedAnimals(player).map((a) => `${a.kind[0]}:${a.id}`).join(',');
}
