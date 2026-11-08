// Banc d'essai de la vague 3 (zone de test `zonetest`, cf.
// src/data/zonetest_data.js) : une quête d'EXEMPLE, pas du contenu du jeu.
// Elle montre le système de quêtes de StoryKit de bout en bout :
//  - QUESTS.banc_galet (titre, étapes, récompense) ;
//  - un PNJ dont la réplique change avec l'état de la quête (`talk`
//    conditionnel : questNone / quest + item / quest / questDone) ;
//  - un objet de quête (`pickups` avec `requires: { quest }`, qui apparaît
//    dès que la quête commence) dont le ramassage fait avancer l'étape ;
//  - la fin : l'objet est rendu, la récompense versée ({questComplete}).
// Les vraies quêtes (autre agent) suivent ce modèle dans leurs fichiers d'histoire.

ITEM_INFO.galet_lune = {
  name: 'Galet de lune',
  desc: 'Un galet lisse qui garde la lumière de la lune. Le druide du banc d\'essai le cherche.',
};

STORY_DRAWN_ITEMS.galet_lune = {
  w: 80, h: 64, scale: 0.42,
  draw(ctx, w, h) {
    ctx.fillStyle = '#c9d6f0';
    ctx.strokeStyle = '#1a1030';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(w / 2, h / 2 + 4, w / 2 - 6, h / 2 - 10, -0.15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath(); ctx.ellipse(w * 0.38, h * 0.42, 10, 5, -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8fe3b8';
    ctx.beginPath(); ctx.arc(w * 0.62, h * 0.6, 4, 0, Math.PI * 2); ctx.fill();
  },
};

QUESTS.banc_galet = {
  title: 'Le galet de lune (essai)',
  giver: 'Druide du banc d\'essai',
  desc: 'Une quête d\'exemple : trouver un objet, le rapporter, être récompensée.',
  steps: [
    { id: 'chercher', text: 'Trouver le galet de lune, plus loin vers la droite.' },
    { id: 'rapporter', text: 'Rapporter le galet au druide.' },
  ],
  reward: { eclats: 15, consommable: 'baie_soin', n: 1 },
};

DIALOGUES.banc_druide_debut = [
  { who: 'habitant', name: 'Druide', text: 'J\'ai perdu mon galet de lune, quelque part vers la droite…' },
  { who: 'habitant', name: 'Druide', text: 'Tu me le rapportes ? Je saurai te remercier.' },
];
DIALOGUES.banc_druide_attente = [
  { who: 'habitant', name: 'Druide', text: 'Mon galet est plus loin à droite. Il brille un peu.' },
];
DIALOGUES.banc_druide_rendu = [
  { who: 'agarica', text: 'Le voilà.' },
  { who: 'habitant', name: 'Druide', text: 'Merci ! Tiens, pour ta peine.' },
];
DIALOGUES.banc_druide_merci = [
  { who: 'habitant', name: 'Druide', text: 'Merci encore pour le galet.' },
];

CUTSCENES.banc_quete_debut = [
  { say: 'banc_druide_debut' },
  { questStart: 'banc_galet' },
];
// Ramassage du galet : étape suivante (toast « Quête mise à jour »).
CUTSCENES.banc_galet_trouve = [
  { questStep: { id: 'banc_galet', step: 'rapporter' } },
];
CUTSCENES.banc_quete_fin = [
  { say: 'banc_druide_rendu' },
  { take: 'galet_lune' },
  { questComplete: 'banc_galet' },
];
