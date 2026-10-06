// Dialogues, cinématiques et scripts de zone de l'acte 1 — agent Acte 1.
//
// Zones (cf. docs/production/PLAN_DEV.md, progression 1 à 7) :
//   bosquet → foret_sombre_1 → foret_sombre_2 → grand_arbre_racines →
//   grand_arbre_arene (Kainati, boss_kainati.js) → monde_spirituel →
//   (optionnel) epreuve_singe, accessible par les lianes des racines.
// Les fichiers Scene restent le gabarit générique : tout passe par la donnée
// de zone (`script`, `triggers`, `npcs`…) et les registres ci-dessous.
//
// Flags posés ici : aideFaite, talismanOurs, idoleVolee, amaniteCouverte,
// banished, xaraMet, planteVue, coeurBonusForet, talismanSinge,
// + flags automatiques de StoryKit (trig_*, moss_*, mosswall_*, pickup_*).

// ---------------------------------------------------------------------------
// Petits utilitaires communs
// ---------------------------------------------------------------------------
function acte1Particles(scene, x, y, { count = 12, colors = [0x3e7a2c, 0x9bff5a], spread = 50, rise = 40, size = [3, 7] } = {}) {
  for (let i = 0; i < count; i++) {
    const p = scene.add.circle(x, y, Phaser.Math.Between(size[0], size[1]), colors[i % colors.length], 1).setDepth(1040);
    scene.tweens.add({
      targets: p,
      x: x + Phaser.Math.Between(-spread, spread),
      y: y - Phaser.Math.Between(0, rise) + Phaser.Math.Between(-10, 20),
      alpha: 0,
      duration: Phaser.Math.Between(450, 800),
      ease: 'Quad.easeOut',
      onComplete: () => p.destroy(),
    });
  }
}

// Fait apparaître un ennemi du registre en cours de visite (mêmes réglages
// que buildLevelFromData : groupe `scene.enemies`, gravité coupée si volant).
function acte1SpawnEnemy(scene, type, x, y, extra = {}) {
  const factory = ENEMY_REGISTRY[type];
  if (!factory || !scene.enemies) return null;
  const enemy = factory(scene, { type, x, y, patrolMinX: x - 150, patrolMaxX: x + 150, ...extra });
  if (!enemy) return null;
  scene.enemies.add(enemy);
  if (enemy.noGravity) enemy.body.setAllowGravity(false);
  return enemy;
}

// Remplit l'énergie (la compétence de l'ours en coûte 35).
function acte1FillEnergy(scene) {
  const p = scene.player;
  if (!p) return;
  p.energy = p.maxEnergy;
  scene.registry.set('energy', p.energy);
}

// Plaque de mousse « grattable » (bosquet) : simple dessin + PV, sans corps.
function acte1MossPatch(scene, x, y, w = 70) {
  const g = scene.add.graphics({ x, y });
  const rnd = new Phaser.Math.RandomDataGenerator([`patch${x}`]);
  g.fillStyle(0x1d3a1a, 1).fillEllipse(0, -6, w, 18);
  for (let i = 0; i < 7; i++) {
    g.fillStyle(i % 2 ? 0x3e7a2c : 0x2f5a2a, 1);
    g.fillCircle(rnd.realInRange(-w / 2 + 8, w / 2 - 8), rnd.realInRange(-16, -4), rnd.realInRange(6, 12));
  }
  for (let i = 0; i < 6; i++) {
    g.fillStyle(0x9bff5a, 0.75).fillCircle(rnd.realInRange(-w / 2 + 6, w / 2 - 6), rnd.realInRange(-18, -4), rnd.realInRange(1.5, 3));
  }
  return { x, y, w, h: 30, g, hp: 2, lastToken: null, done: false };
}

// ---------------------------------------------------------------------------
// 1. BOSQUET D'ÉMERAUDE
// ---------------------------------------------------------------------------
const BOSQUET_PATCH_XS = [1930, 2050, 2170];
const BOSQUET_SOURCE_X = 2290;
const BOSQUET_IDOLE = { x: 3424, y: 300 };

DIALOGUES.bosquet_porteur = [
  { who: 'habitant', name: 'Bran, le porteur', text: "Encore un seau, Agarica. L'eau de la source se trouble un peu plus chaque nuit." },
  { who: 'habitant', name: 'Bran, le porteur', text: 'On rince les troncs, on rince les chemins… Et le lendemain, tout est à refaire.' },
];
DIALOGUES.bosquet_garde_cochons = [
  { who: 'garde', name: 'Tilda, la gardienne', text: "Les trois petits se sont encore sauvés de l'enclos !" },
  { who: 'garde', name: 'Tilda, la gardienne', text: '… Ah non. Un, deux, trois. Ils sont là. Ouf.' },
  { who: 'garde', name: 'Tilda, la gardienne', text: "Depuis que la mousse rend les bêtes folles, je les compte toutes les heures. On ne sait jamais." },
];
DIALOGUES.bosquet_druide_feu = [
  { who: 'habitant', name: 'Sauge, la druidesse', text: "On brûle tout ce qu'on gratte. Sinon, la mousse repousse jusque dans les cendres." },
  { who: 'habitant', name: 'Sauge, la druidesse', text: 'Kof… kof… Ce n\'est rien, petite. Juste la fumée. Et la mousse dans l\'air.' },
];
DIALOGUES.bosquet_orme_aide = [
  { who: 'habitant', name: 'Orme, le vieux druide', text: 'Les plaques, Agarica ! Frappe-les pour les gratter (touche K).' },
];
DIALOGUES.bosquet_orme_apres = [
  { who: 'habitant', name: 'Orme, le vieux druide', text: 'Merci pour ton aide. Ton père te cherchait, il est devant sa hutte.' },
];
DIALOGUES.bosquet_pere_avant = [
  { who: 'pere_chef', text: 'Agarica ! Orme a besoin de bras sur le chemin de la source. Va l\'aider, puis reviens me voir.' },
];
DIALOGUES.bosquet_pere_apres = [
  { who: 'pere_chef', text: 'Va te reposer, ma fille. Et garde ce talisman tout près de toi.' },
];
DIALOGUES.bosquet_garde_porte = [
  { who: 'garde', text: "Les portes de l'est restent closes la nuit, Agarica. Ordre du chef." },
];

CUTSCENES.bosquet_intro = [
  { wait: 1900 },
  { say: [
    { who: 'agarica', text: 'Encore une nuit à se battre contre la mousse…' },
    { who: 'agarica', text: 'Orme et les druides sont sur le chemin de la source. Ils auront besoin d\'aide.' },
  ] },
  { toast: '← → (ou Q / D) : se déplacer' },
];

CUTSCENES.bosquet_aide_debut = [
  // En cas de chute de cœurs pendant l'aide : on revient près d'Orme, pas au début du bosquet.
  { call: (scene) => { scene.player.spawnX = 1760; scene.player.spawnY = 440; } },
  { npcFace: { npc: 'druide_orme', dir: 'player' } },
  { say: [
    { who: 'habitant', name: 'Orme, le vieux druide', text: 'Agarica ! Tu tombes bien.' },
    { who: 'habitant', name: 'Orme, le vieux druide', text: 'La mousse a encore gagné le chemin cette nuit. Aide-moi à gratter ces plaques avant qu\'elles ne prennent racine.' },
    { who: 'agarica', text: 'Compte sur moi !' },
  ] },
  { toast: 'K (ou clic) : attaquer. Frappe les plaques de mousse pour les gratter.' },
];

CUTSCENES.bosquet_barriere_aide = [
  { say: [{ who: 'habitant', name: 'Orme, le vieux druide', text: 'Hé ! Il reste de la mousse à gratter derrière toi !' }] },
  { playerMove: { toX: 2320 } },
];

CUTSCENES.bosquet_mousse_revient = [
  { wait: 300 },
  { say: [
    { who: 'habitant', name: 'Orme, le vieux druide', text: 'Bien gratté ! Le chemin respire à nouveau…' },
  ] },
  { call: (scene) => acte1BosquetRegrow(scene) },
  { wait: 900 },
  { say: [
    { who: 'agarica', text: '… Non. Regarde, Orme. Elle repousse déjà.' },
    { who: 'agarica', text: 'Et l\'amas sur la source ? Je peux essayer de le gratter, lui aussi.' },
  ] },
  { playerMove: { toX: BOSQUET_SOURCE_X - 80 } },
  { playerFace: 'right' },
  { npcAnim: { npc: 'druide_orme', anim: 'idle' } },
  { call: (scene) => { acte1Particles(scene, BOSQUET_SOURCE_X - 30, 400, { count: 8 }); } },
  { shake: { ms: 200, intensity: 0.006 } },
  { wait: 250 },
  { call: (scene) => { acte1Particles(scene, BOSQUET_SOURCE_X - 30, 400, { count: 8 }); } },
  { shake: { ms: 200, intensity: 0.006 } },
  { say: [
    { who: 'agarica', text: 'Aïe ! Elle est dure comme de la pierre…' },
    { who: 'habitant', name: 'Orme, le vieux druide', text: 'En trois nuits, cet amas a étouffé la source. Ni nos grattoirs ni le feu n\'en viennent à bout.' },
    { who: 'habitant', name: 'Orme, le vieux druide', text: 'Il faudrait une force bien plus grande que nos pauvres bras.' },
  ] },
  { call: (scene) => acte1BosquetSpawnCreature(scene) },
  { shake: { ms: 300, intensity: 0.01 } },
  { playerMove: { toX: BOSQUET_SOURCE_X - 200, speed: 220 } },
  { playerFace: 'right' },
  { say: [
    { who: 'habitant', name: 'Orme, le vieux druide', text: 'Par les racines ! Quelque chose sort de l\'amas… Attention, Agarica !' },
  ] },
  { toast: 'K : attaquer. Repousse la créature de mousse !' },
];

CUTSCENES.bosquet_aide_fin = [
  { wait: 500 },
  { npcFace: { npc: 'druide_orme', dir: 'player' } },
  { say: [
    { who: 'habitant', name: 'Orme, le vieux druide', text: 'Même les bêtes… La mousse les rend folles, puis elle les dévore.' },
    { who: 'agarica', text: 'Il faut trouver d\'où elle vient, Orme. Gratter ne suffira jamais.' },
    { who: 'habitant', name: 'Orme, le vieux druide', text: 'Tu parles comme ton père. Il te cherchait, d\'ailleurs. Va le voir, devant sa hutte.' },
  ] },
  { set: { aideFaite: true } },
  { toast: 'La hutte du chef est plus à l\'est →' },
];

CUTSCENES.bosquet_talisman = [
  { npcFace: { npc: 'pere_chef', dir: 'player' } },
  { say: [
    { who: 'pere_chef', text: 'Agarica. Orme m\'a dit que tu l\'avais aidé. Et qu\'une bête est sortie de l\'amas.' },
    { who: 'agarica', text: 'Elle repousse partout, Père. On gratte, on brûle… et la nuit suivante, tout recommence.' },
    { who: 'pere_chef', text: 'Je sais. Chaque nuit, la forêt recule un peu plus.' },
    { who: 'pere_chef', text: 'Approche. Je veux te confier quelque chose.' },
  ] },
  { npcAnim: { npc: 'pere_chef', anim: 'give_talisman' } },
  { wait: 500 },
  // Pose `receive_item` (art Codex agarica_extra) le temps de recevoir l'objet.
  { playerPose: 'receive_item' },
  { give: 'talisman_ours' },
  { set: { talismanOurs: true } },
  { wait: 1400 },
  { playerPose: null },
  { npcAnim: { npc: 'pere_chef', anim: 'idle' } },
  { say: [
    { who: 'agarica', text: 'Le talisman de l\'ours ? Mais… il veille sur les chefs du bosquet depuis toujours !' },
    { who: 'pere_chef', text: 'Les temps ne permettent plus d\'attendre les cérémonies. Garde-le toujours sur toi.' },
    { who: 'agarica', text: 'Il est tiède… On dirait qu\'il dort. À quoi sert-il ?' },
    { who: 'pere_chef', text: 'Il te le dira lui-même, le jour venu. Va te reposer, ma fille. Demain sera long.' },
  ] },
  { toast: 'I : ouvrir l\'inventaire' },
];

CUTSCENES.bosquet_barriere_pere = [
  { say: [{ who: 'habitant', text: 'Agarica ! Ton père te cherche. Il est devant sa hutte, juste là.' }] },
  { playerMove: { toX: 2990 } },
];

DIALOGUES.bosquet_vol_couvrir = [
  { who: 'amanite', text: 'Merci… Je la rapporterai, je te le jure. Quand la forêt sera sauvée.' },
];
DIALOGUES.bosquet_vol_supplier = [
  { who: 'amanite', text: 'Pas cette fois. Pardon, Agarica… Ne dis rien. Pour moi.' },
];

CUTSCENES.bosquet_vol = [
  { call: (scene) => { if (!scene.npcs.amanite) createStoryNpc(scene, { id: 'amanite', x: BOSQUET_IDOLE.x - 55, y: 336, lookAtPlayer: false }); } },
  { camera: { x: 3360, y: 300, ms: 900 } },
  { say: [
    'Au sanctuaire, une silhouette rouge se penche sur l\'autel.',
    { who: 'agarica', text: 'Amanite ?! Qu\'est-ce que tu fais là ?' },
  ] },
  // Surprise, elle se retourne vers Agarica (elle faisait face à l'autel).
  { npcFace: { npc: 'amanite', dir: 'player' } },
  { say: [
    { who: 'amanite', text: 'Agarica… Chut ! Ne crie pas, je t\'en prie.' },
  ] },
  { call: (scene) => acte1BosquetTakeIdol(scene) },
  { npcAnim: { npc: 'amanite', anim: 'run_idol' } },
  { wait: 500 },
  { say: [
    { who: 'agarica', text: 'L\'idole ! Repose-la tout de suite !' },
    { who: 'amanite', text: 'Elle dort sur cette pierre depuis cent ans, pendant que la forêt meurt autour d\'elle.' },
    { who: 'amanite', text: 'Elle a un pouvoir, j\'en suis sûre. Je vais m\'en servir contre la mousse, puisque personne ici n\'ose le faire !' },
    { who: 'agarica', text: 'C\'est le cœur du bosquet, Amanite…' },
    { who: 'amanite', text: 'Alors le bosquet n\'a déjà plus de cœur. Il ne lui reste que des grattoirs.' },
    {
      who: 'amanite', text: 'Des pas… les gardes ! Agarica, s\'il te plaît. Ne dis rien.',
      choices: [
        { text: '« Va-t\'en. Je ne dirai rien. »', goto: 'bosquet_vol_couvrir', set: { amaniteCouverte: true } },
        { text: '« Amanite… repose-la. »', goto: 'bosquet_vol_supplier', set: { amaniteCouverte: false } },
      ],
    },
  ] },
  { npcMove: { npc: 'amanite', toX: 3950, speed: 300 } },
  { npcRemove: 'amanite' },
  { set: { idoleVolee: true } },
  { cameraFollow: true },
  { npcAdd: { id: 'habitant_garde', key: 'garde_vol', x: 3000 } },
  { npcMove: { npc: 'garde_vol', toX: 3180, speed: 220 } },
  { say: [
    { who: 'garde', text: 'Agarica ? J\'ai entendu du bruit au sanctuaire. Tu as vu quelqu\'un ?' },
    { who: 'garde', text: '… L\'autel ! L\'idole a disparu !' },
    { who: 'agarica', text: 'Je… Non. Personne. Je viens d\'arriver, moi aussi.' },
    { who: 'garde', text: 'Ne bouge pas d\'ici. Je préviens le chef !' },
  ] },
  { npcMove: { npc: 'garde_vol', toX: 2900, speed: 260 } },
  { npcRemove: 'garde_vol' },
  { say: [{ who: 'agarica', text: 'Qu\'est-ce que j\'ai fait…' }] },
  { call: (scene) => runCutscene(scene, 'bosquet_bannissement') },
];

CUTSCENES.bosquet_bannissement = [
  { fadeOut: 900 },
  { call: (scene) => acte1BosquetSetupJudgement(scene) },
  { npcAdd: { id: 'pere_chef', key: 'pere', x: 3110 } },
  { npcAdd: { id: 'habitant_garde', key: 'garde_juge', x: 3030 } },
  { npcAdd: { id: 'habitant_druide', key: 'orme_juge', x: 2960 } },
  { fadeIn: 900 },
  { title: { title: 'Plus tard dans la nuit', hold: 1200 } },
  { npcFace: { npc: 'pere', dir: 'player' } },
  { say: [
    { who: 'garde', text: 'Le vieux Orme t\'a vue entrer au sanctuaire. Et Amanite a fui par les portes de l\'est… l\'idole dans les bras.' },
    { who: 'habitant', name: 'Orme, le vieux druide', text: 'Pardonne-moi, petite. Je l\'ai vue de mes yeux.' },
    { who: 'pere_chef', text: 'Regarde-moi, Agarica. Tu étais là. Tu l\'as laissée partir.' },
    { who: 'agarica', text: '… Oui. Elle voulait sauver la forêt, Père. Elle croit que l\'idole peut arrêter la mousse.' },
    { who: 'pere_chef', text: 'Et pour elle, tu as menti à ton peuple. Tu m\'as menti, à moi.' },
    { who: 'agarica', text: 'Je voulais seulement la protéger… C\'est mon amie.' },
    { who: 'pere_chef', text: 'La loi du bosquet est la même pour tous. Qui couvre le vol de l\'idole partage la faute du voleur.' },
    { who: 'pere_chef', text: 'Ce soir, je ne peux pas être ton père. Seulement le chef.' },
    { who: 'pere_chef', text: 'Agarica, fille du bosquet d\'Émeraude… tu es bannie. Tu partiras avant l\'aube.' },
  ] },
  { shake: { ms: 250, intensity: 0.004 } },
  { playerPose: 'sad' },
  { say: [
    { who: 'agarica', text: 'Père… Où veux-tu que j\'aille ? Je n\'ai jamais dépassé la lisière.' },
    { who: 'pere_chef', text: '…' },
    { who: 'pere_chef', text: 'Garde le talisman. Il veillera sur toi, là où je ne le peux plus.' },
    { who: 'garde', text: 'Les portes de l\'est sont ouvertes. Va.' },
  ] },
  { set: { banished: true } },
  { call: (scene) => acte1BosquetAfterJudgement(scene) },
  { toast: 'Les portes de l\'est sont ouvertes →' },
];

DIALOGUES.bosquet_pere_adieu = [
  { who: 'pere_chef', text: 'Va, maintenant. Avant que je ne change d\'avis… ou que je ne te retienne.' },
];
DIALOGUES.bosquet_orme_adieu = [
  { who: 'habitant', name: 'Orme, le vieux druide', text: 'Prends soin de toi, petite. La forêt est grande… mais elle n\'est pas toujours cruelle.' },
];

CUTSCENES.bosquet_porte = (scene) => {
  if (!storyGet('banished')) {
    return [
      { say: 'bosquet_garde_porte' },
      { playerMove: { toX: 3690 } },
    ];
  }
  return [
    { playerFace: 'right' },
    { playerPose: 'sad' },
    { say: ['Agarica franchit les portes du seul foyer qu\'elle ait jamais connu.'] },
    { title: { title: 'Bannie', sub: 'Le bosquet d\'Émeraude se referme derrière elle', hold: 1800 } },
    { fadeOut: 1000 },
    { goto: { scene: 'foret_sombre_1', data: { enterId: 'from_bosquet' } } },
  ];
};

function acte1BosquetRegrow(scene) {
  const st = scene.__acte1;
  if (!st) return;
  // Une des plaques grattées repousse sous les yeux d'Agarica (échec partiel).
  const p = acte1MossPatch(scene, BOSQUET_PATCH_XS[1], 448, 60);
  p.g.setAlpha(0).setScale(0.2, 0.2);
  scene.tweens.add({ targets: p.g, alpha: 1, scaleX: 1, scaleY: 1, duration: 1200, ease: 'Sine.easeOut' });
  st.regrown = p;
}

function acte1BosquetSpawnCreature(scene) {
  const st = scene.__acte1;
  acte1Particles(scene, BOSQUET_SOURCE_X, 400, { count: 16, spread: 70 });
  // Elle jaillit DERRIÈRE l'amas (côté droit) : Agarica a le temps de se retourner.
  st.creature = acte1SpawnEnemy(scene, 'mousse_creature', BOSQUET_SOURCE_X + 90, 400, {
    patrolMinX: 1950, patrolMaxX: BOSQUET_SOURCE_X + 100, hp: 2,
  });
}

function acte1BosquetTakeIdol(scene) {
  const st = scene.__acte1;
  if (!st || !st.idol) return;
  const { idol, idolGlow } = st;
  st.idol = null;
  st.idolGlow = null;
  scene.tweens.killTweensOf([idol, idolGlow]);
  scene.tweens.add({ targets: [idol, idolGlow], alpha: 0, y: '-=20', duration: 500, onComplete: () => { idol.destroy(); idolGlow.destroy(); } });
}

function acte1BosquetSetupJudgement(scene) {
  const p = scene.player;
  if (p && p.body) {
    p.setVelocity(0, 0);
    p.setPosition(3200, 380);
  }
  for (const key of ['garde_porte', 'pere_chef', 'amanite']) {
    if (scene.npcs[key]) { scene.npcs[key].destroy(); delete scene.npcs[key]; }
  }
  if (scene.__acte1 && scene.__acte1.idol) acte1BosquetTakeIdol(scene);
  storyFacePlayer(p, -1);
}

// Après le jugement : le père et Orme restent (quelques mots d'adieu), la garde s'écarte.
function acte1BosquetAfterJudgement(scene) {
  const add = (key, talk) => {
    const npc = scene.npcs[key];
    if (!npc) return;
    npc.talk = talk;
    scene.__story.interactables.push({ kind: 'npc', npc });
  };
  add('pere', 'bosquet_pere_adieu');
  add('orme_juge', 'bosquet_orme_adieu');
  if (scene.npcs.garde_juge) scene.npcs.garde_juge.setX(3560).setY(storyStandY(scene, 3560));
}

ZONE_SCRIPTS.bosquet = {
  create(scene) {
    const st = { patches: [], creature: null, finished: false, regrown: null, idol: null };
    scene.__acte1 = st;
    // Déjà bannie (sauvegarde rechargée) : on reprend directement dans la forêt.
    if (storyGet('banished')) {
      scene.time.delayedCall(60, () => goToScene(scene, 'ForetSombre1Scene', { enterId: 'from_bosquet' }));
      return;
    }
    // L'idole sur son autel (lueur douce), tant qu'elle n'a pas été volée.
    if (!storyGet('idoleVolee')) {
      st.idolGlow = scene.add.circle(BOSQUET_IDOLE.x, BOSQUET_IDOLE.y, 26, 0x8fe3b8, 0.25);
      st.idol = addItemIcon(scene, BOSQUET_IDOLE.x, BOSQUET_IDOLE.y, 'idole', 40);
      scene.tweens.add({ targets: st.idolGlow, alpha: 0.08, scale: 1.3, duration: 1400, yoyo: true, repeat: -1 });
      storyPutBehindPlayer(scene, st.idolGlow);
      storyPutBehindPlayer(scene, st.idol);
    }
    // L'amas sur la source : purement visuel (la vraie mousse dense, que
    // personne au bosquet ne sait détruire).
    st.sourceMoss = drawMossVisual(scene, BOSQUET_SOURCE_X, 400, 120, 96, 'mousse_amas_intact', false);
    storyPutBehindPlayer(scene, st.sourceMoss);
    if (!storyGet('aideFaite')) {
      st.patches = BOSQUET_PATCH_XS.map((x) => acte1MossPatch(scene, x, 448));
      st.patches.forEach((p) => storyPutBehindPlayer(scene, p.g));
    }
    // Rechargement en plein vol : on enchaîne sur le jugement.
    if (storyGet('idoleVolee')) scene.time.delayedCall(300, () => runCutscene(scene, 'bosquet_bannissement'));
  },

  update(scene) {
    const st = scene.__acte1;
    if (!st || storyGet('banished')) return;
    const p = scene.player;
    // Grattage des plaques : 2 coups par plaque (une attaque = un coup).
    const hit = p.getAttackHitbox && p.getAttackHitbox();
    if (hit && p.isAttacking) {
      for (const patch of st.patches) {
        if (patch.done || patch.lastToken === p.attackEndTime) continue;
        const r = new Phaser.Geom.Rectangle(patch.x - patch.w / 2, patch.y - patch.h, patch.w, patch.h + 10);
        if (!Phaser.Geom.Intersects.RectangleToRectangle(hit, r)) continue;
        patch.lastToken = p.attackEndTime;
        patch.hp -= 1;
        acte1Particles(scene, patch.x, patch.y - 10, { count: 6, spread: 30 });
        if (patch.hp <= 0) {
          patch.done = true;
          scene.tweens.add({ targets: patch.g, alpha: 0, scaleY: 0.2, duration: 300, onComplete: () => patch.g.destroy() });
        } else {
          patch.g.setAlpha(0.6);
        }
      }
      // Frapper l'amas de la source : rien n'y fait.
      if (st.lastAmasToken !== p.attackEndTime) {
        const amas = new Phaser.Geom.Rectangle(BOSQUET_SOURCE_X - 60, 352, 120, 96);
        if (Phaser.Geom.Intersects.RectangleToRectangle(hit, amas)) {
          st.lastAmasToken = p.attackEndTime;
          acte1Particles(scene, BOSQUET_SOURCE_X - 40, 400, { count: 4, spread: 20 });
          if (!st.amasToastShown) { st.amasToastShown = true; showToast(scene, 'L\'amas est bien trop dense : ta lame rebondit dessus.', 2000); }
        }
      }
    }
    if (st.patches.length && !st.revient && st.patches.every((x) => x.done)) {
      st.revient = true;
      runCutscene(scene, 'bosquet_mousse_revient');
    }
    if (st.creature && !st.finished && (st.creature.defeated || !st.creature.active)) {
      st.finished = true;
      runCutscene(scene, 'bosquet_aide_fin');
    }
  },
};

// ---------------------------------------------------------------------------
// 2. FORÊT SOMBRE 1 — la lisière : désespoir, Xara, réveil du talisman
// ---------------------------------------------------------------------------
// Cf. src/data/foret_sombre_1_data.js pour le plan. L'amas (mossBlocks
// `amas_racines`) est coincé sous un mur de racines qui monte jusqu'en haut de
// l'écran : seul le fracas de l'ours ouvre le passage.
const FS1_AMAS_X = 2752;
const FS1_XARA_X = 1344;

CUTSCENES.fs1_desespoir = (scene) => [
  { playerPose: 'sad' },
  { wait: 1900 },
  { say: [
    'Les portes de l\'est se sont refermées. Derrière elles, plus un bruit.',
    { who: 'agarica', text: 'Bannie…' },
    { who: 'agarica', text: 'Père ne m\'a même pas regardée partir.' },
    storyGet('amaniteCouverte') === false
      ? { who: 'agarica', text: 'Et toi, Amanite… Je t\'ai suppliée de la reposer. Où es-tu, maintenant ?' }
      : { who: 'agarica', text: 'Et toi, Amanite… Tu m\'avais promis de rapporter l\'idole. Où es-tu, maintenant ?' },
    { who: 'agarica', text: 'Je n\'ai jamais dépassé la lisière. Je ne sais même pas où aller.' },
  ] },
  { playerPose: null },
  { say: [
    { who: 'agarica', text: '… Allez, Agarica. Pleurer ne fera pas reculer la mousse. Un pas, puis un autre.' },
  ] },
  { toast: 'Avance dans la forêt →' },
];

CUTSCENES.fs1_rencontre = [
  { playerFace: 'right' },
  { playerPose: 'sad' },
  { say: [{ who: 'xara', name: '???', text: 'Tu pleures bien fort, pour quelqu\'un qui se promène seule la nuit.' }] },
  { playerPose: null },
  { playerMove: { toX: FS1_XARA_X - 110 } },
  { npcFace: { npc: 'xara', dir: 'player' } },
  // Xara n'a pas d'idle : pose de repos (talk figée), la parole est jouée
  // réplique par réplique par StoryKit (storySpeakerTalkAnim).
  { call: (scene) => storyNpcRest(scene.npcs.xara) },
  { say: [
    { who: 'agarica', text: 'Qui… qui parle ?' },
    { who: 'xara', name: '???', text: 'Ici. Sur la souche. Non, un peu plus à droite… Voilà. Bonsoir.' },
    { who: 'agarica', text: 'Une araignée qui parle ?! … Euh, bonsoir. Je m\'appelle Agarica.' },
    { who: 'xara', text: 'Xara. Et toi, tu es la petite druidesse qu\'on vient de mettre à la porte.' },
    { who: 'agarica', text: 'Comment tu sais ça ?' },
    { who: 'xara', text: 'Les portes de l\'est grincent. Et toute la forêt t\'a entendue renifler.' },
  ] },
  { call: (scene) => acte1Fs1LittleSpider(scene) },
  { wait: 900 },
  { say: [
    'Une minuscule araignée, sortie des feuilles, recule vivement devant Xara… comme on s\'incline devant quelqu\'un.',
    { who: 'agarica', text: 'Oh ! Elle a eu peur de toi ?' },
    { who: 'xara', text: 'De moi ? … Elle est timide, c\'est tout. Parlons plutôt de toi.' },
    { who: 'agarica', text: 'Je n\'ai nulle part où aller. Tout ce que je connais est derrière ces portes.' },
    { who: 'xara', text: 'Moi, je connais chaque sentier d\'ici au grand arbre. Même ceux que la forêt a oubliés.' },
    { who: 'agarica', text: 'Je veux rentrer chez moi. Prouver au bosquet que je peux l\'aider, malgré tout.' },
    { who: 'xara', text: 'Alors trouve un moyen d\'agir contre la mousse. Elle ne s\'arrête pas à vos palissades : elle ronge toute la forêt.' },
    { who: 'agarica', text: 'Tu… tu viendrais avec moi ?' },
    { who: 'xara', text: 'Il faut bien que quelqu\'un t\'empêche de tomber dans le premier ravin venu.' },
  ] },
  { npcAnim: { npc: 'xara', anim: 'mysterious' } },
  { say: [{ who: 'xara', text: '… Et puis, cela fait bien longtemps que personne ne m\'a demandé de rester.' }] },
  { xaraJoin: true },
  { toast: 'Objectif : trouver un moyen d\'agir contre la mousse.' },
];

CUTSCENES.fs1_feu = [
  { say: [
    { who: 'xara', text: 'Un feu de voyageurs. Les braises tiennent encore… Quelqu\'un est passé il n\'y a pas longtemps.' },
    { who: 'agarica', text: 'De la chaleur ! Je commençais à grelotter.' },
    { who: 'xara', text: 'Repose-toi près d\'un feu dès que tu en croises un : tes blessures se referment et ton énergie revient.' },
    { who: 'xara', text: 'Et la forêt se souviendra de ton passage, si jamais tu t\'égares.' },
    { who: 'xara', text: 'C\'est aussi là que tu prépareras tes formes et tes talismans… quand tu en auras.' },
    { who: 'agarica', text: 'Mes formes ? Je ne sais pas me transformer, moi.' },
    { who: 'xara', text: 'Pas encore.' },
  ] },
  { toast: 'E près d\'un feu de camp : se reposer (soin, énergie, sauvegarde, préparation).' },
];

CUTSCENES.fs1_creature = [
  { say: [
    { who: 'xara', text: 'Chut. Quelque chose rampe, devant nous.' },
    { who: 'agarica', text: 'Une bête… couverte de mousse, comme celle de la source !' },
    { who: 'xara', text: 'C\'était un blaireau, avant. La mousse ne laisse pas grand-chose de ceux qu\'elle prend.' },
    { who: 'agarica', text: 'Pauvre petite chose… Pardon. Je dois passer.' },
  ] },
  { toast: 'K (ou clic) : attaquer.' },
];

CUTSCENES.fs1_talisman = [
  { playerFace: 'right' },
  { say: [
    { who: 'agarica', text: 'Encore un amas… aussi dur que celui qui étouffe la source du bosquet.' },
    { who: 'xara', text: 'Et les racines, au-dessus, montent jusqu\'au ciel. C\'est le seul passage vers l\'est.' },
    { who: 'agarica', text: 'Même Orme n\'arrivait pas à les gratter. Comment veux-tu que moi…' },
  ] },
  { call: (scene) => acte1TalismanGlow(scene) },
  { shake: { ms: 260, intensity: 0.004 } },
  { say: [
    'Contre sa poitrine, le talisman de l\'ours se met à battre comme un cœur.',
    { who: 'agarica', text: 'Aïe ! Il est brûlant !' },
    { who: 'xara', text: 'Un talisman des anciens chefs… Cela faisait bien longtemps que je n\'en avais pas vu un s\'éveiller.' },
    { who: 'agarica', text: 'Tu en as déjà vu d\'autres ?' },
    { who: 'xara', text: '… Écoute-le plutôt. Il a quelque chose à te dire.' },
  ] },
  { playerPose: 'cast' },
  { skill: 'ours' },
  { call: (scene) => acte1FillEnergy(scene) },
  { wait: 1200 },
  { playerPose: null },
  { say: [
    { who: 'agarica', text: 'Je sens une force immense… comme si un ours se dressait derrière moi.' },
    { who: 'agarica', text: '« Il te le dira lui-même, le jour venu. » Père… tu savais.' },
    { who: 'xara', text: 'Alors laisse-le frapper.' },
  ] },
  { toast: 'A : Fracas de l\'ours (consomme l\'énergie, la barre sous tes cœurs). Colle-toi à l\'amas et frappe !' },
];

CUTSCENES.fs1_amas_brise = [
  { wait: 500 },
  { say: [
    { who: 'agarica', text: 'Il a volé en éclats !' },
    { who: 'xara', text: 'La mousse a donc un ennemi. Voilà un début.' },
    { who: 'agarica', text: 'Si le talisman brise ça, il peut peut-être libérer la source… sauver le bosquet !' },
    { who: 'xara', text: 'Peut-être. Mais la mousse ne pousse pas toute seule. Il faut trouver d\'où elle vient.' },
    { who: 'agarica', text: 'Alors on trouvera. Ensemble !' },
    { who: 'xara', text: '… Ensemble. Oui.' },
  ] },
  { toast: 'Frapper un ennemi recharge un peu d\'énergie. Un feu de camp la remplit.' },
];

CUTSCENES.fs1_mousse_partout = [
  { say: [
    { who: 'agarica', text: 'Même ici, si loin du bosquet… la mousse est partout.' },
    { who: 'xara', text: 'Elle vient de l\'est. Des profondeurs, là où les arbres sont malades depuis longtemps.' },
    { who: 'agarica', text: 'Tu en sais, des choses.' },
    { who: 'xara', text: 'J\'ai eu beaucoup de temps pour regarder.' },
  ] },
];

// Lueur du talisman de l'ours autour d'Agarica (anneaux chauds qui pulsent).
function acte1TalismanGlow(scene) {
  const p = scene.player;
  if (!p) return;
  for (let i = 0; i < 3; i++) {
    const ring = scene.add.circle(p.x, p.y - 40, 18, 0xffc36b, 0.5).setDepth(1040).setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({
      targets: ring, scale: 4, alpha: 0, duration: 900, delay: i * 320, ease: 'Quad.easeOut',
      onUpdate: () => { if (scene.player) ring.setPosition(scene.player.x, scene.player.y - 40); },
      onComplete: () => ring.destroy(),
    });
  }
  acte1Particles(scene, p.x, p.y - 40, { count: 14, colors: [0xffc36b, 0xff9fc9], spread: 60, rise: 70 });
}

// Indice Maexxna : une petite araignée s'écarte devant Xara.
function acte1Fs1LittleSpider(scene) {
  const xara = scene.npcs && scene.npcs.xara;
  const x0 = (xara ? xara.x : FS1_XARA_X) - 50;
  const y0 = storyGroundY(scene, x0);
  const g = scene.add.graphics({ x: x0, y: y0 - 5 });
  g.lineStyle(1.5, 0x1a1024, 1);
  for (const s of [-1, 1]) for (let k = 0; k < 4; k++) g.lineBetween(0, 0, s * (6 + k), 4 - k * 2);
  g.fillStyle(0x1a1024, 1).fillCircle(0, 0, 5).fillCircle(5, 1, 3);
  g.fillStyle(0xc77dff, 1).fillCircle(6, 0, 1);
  storyPutBehindPlayer(scene, g);
  // Elle approche de Xara, marque un arrêt… puis file à reculons et disparaît.
  scene.tweens.chain({
    targets: g,
    tweens: [
      { x: x0 + 25, duration: 500, ease: 'Sine.easeOut' },
      { x: x0 + 20, duration: 250, yoyo: true },
      { x: x0 - 140, alpha: 0, duration: 900, ease: 'Quad.easeIn' },
    ],
    onComplete: () => g.destroy(),
  });
}

// Taches de mousse lumineuse sur les troncs/le sol : la mousse est partout.
function acte1DrawMossDecor(scene, spots) {
  for (const [x, y, r] of spots) {
    const g = scene.add.graphics({ x, y });
    const rnd = new Phaser.Math.RandomDataGenerator([`decor${x},${y}`]);
    for (let i = 0; i < 6; i++) {
      g.fillStyle(i % 2 ? 0x2f5a2a : 0x3e7a2c, 0.9);
      g.fillCircle(rnd.realInRange(-r, r), rnd.realInRange(-r / 2, r / 4), rnd.realInRange(r * 0.3, r * 0.6));
    }
    for (let i = 0; i < 5; i++) g.fillStyle(0x9bff5a, 0.7).fillCircle(rnd.realInRange(-r, r), rnd.realInRange(-r / 2, r / 4), rnd.realInRange(1.5, 3));
    storyPutBehindPlayer(scene, g);
    scene.tweens.add({ targets: g, alpha: 0.7, duration: rnd.between(1400, 2200), yoyo: true, repeat: -1 });
  }
}

// Après un feu de camp, une chute de cœurs ramène au feu plutôt qu'à
// l'entrée de la zone (Player.hitByEnemy réapparaît en spawnX/spawnY).
function acte1RespawnAfter(scene, points) {
  const p = scene.player;
  for (const pt of points) {
    if (p.x > pt.x && (p.spawnX ?? 0) < pt.x) {
      p.spawnX = pt.x;
      p.spawnY = pt.y - 4;
    }
  }
}

ZONE_SCRIPTS.foret_sombre_1 = {
  create(scene) {
    const st = { amasDone: !!storyGet('moss_foret_sombre_1_amas_racines'), nextRefill: 0 };
    scene.__acte1 = st;
    // Xara assise SUR la souche décorative : les props sont ajoutés après les
    // PNJ, la souche la masquait.
    if (scene.npcs && scene.npcs.xara) scene.npcs.xara.setDepth(1);
    acte1DrawMossDecor(scene, [
      [2690, 70, 22], [2810, 170, 20], [2730, 240, 16],
      [2980, 448, 30], [3150, 448, 24], [3420, 448, 34], [3700, 448, 22],
      [640, 448, 14], [1900, 448, 18],
    ]);
  },

  update(scene) {
    const st = scene.__acte1;
    if (!st) return;
    const p = scene.player;
    acte1RespawnAfter(scene, [{ x: 1640, y: 448 }]);
    const amas = scene.__story.mossBlocks[0];
    if (!st.amasDone && amas && amas.destroyed) {
      st.amasDone = true;
      runCutscene(scene, 'fs1_amas_brise');
      return;
    }
    // Filet de sécurité (rechargement de partie après le réveil du talisman,
    // énergie dépensée à côté…) : le talisman refournit de quoi frapper l'amas.
    if (!st.amasDone && amas && storyGet('trig_foret_sombre_1_talisman') && p.unlockedSkills.has('ours')
      && p.energy < SKILL_DEFS.ours.cost && Math.abs(p.x - FS1_AMAS_X) < 360 && scene.time.now > st.nextRefill
      && !p.skillTransformActive) {
      st.nextRefill = scene.time.now + 4000;
      acte1FillEnergy(scene);
      acte1TalismanGlow(scene);
      showToast(scene, 'Le talisman de l\'ours pulse : sa force revient. (A)', 2200);
    }
  },
};

// ---------------------------------------------------------------------------
// 3. FORÊT SOMBRE 2 — les ravins : totem du loup, pistes, mare, plante
// ---------------------------------------------------------------------------
// Cf. src/data/foret_sombre_2_data.js pour le plan. Le totem (clé `totems`)
// pose `hasWolfForm` ; le script enchaîne l'explication de Xara.
const FS2_TOTEM = { x: 896, y: 320 };
const FS2_MARE = { x: 3520, w: 256, y: 452 };
const FS2_PLANTE = { x: 3616, y: 64 };
const FS2_COEUR = { x: 4700, y: 400 };
const FS2_POCHE = { x0: 4416, x1: 5120 };
const FS2_MUR_FLAG = 'mosswall_foret_sombre_2_mur_repulsif_foret_sombre';

CUTSCENES.fs2_empreintes = [
  { say: [
    { who: 'agarica', text: 'Des empreintes… énormes. Une bête est passée par là, vers l\'est.' },
    { who: 'xara', text: 'Un loup. Un très vieux loup.' },
    { who: 'agarica', text: 'Tu peux deviner ça rien qu\'avec des traces ?' },
    { who: 'xara', text: 'Je te l\'ai dit : je connais ces sentiers.' },
  ] },
];

CUTSCENES.fs2_ravin = [
  { playerFace: 'right' },
  { say: [
    { who: 'agarica', text: 'Oh non… Le sentier s\'arrête net.' },
    { who: 'agarica', text: 'C\'est bien trop large pour sauter, même deux fois de suite.' },
    { who: 'xara', text: 'Pour tes deux jambes, oui. Pas pour quatre pattes lancées au galop.' },
  ] },
  { camera: { x: FS2_TOTEM.x + 120, y: 270, ms: 900 } },
  { say: [
    { who: 'xara', text: 'Là-haut, sur la butte. Un totem du loup. Les anciens druides venaient y demander sa course.' },
    { who: 'agarica', text: 'Un totem ? Comme dans les contes que me racontait Père ?' },
    { who: 'xara', text: 'Les contes ont toujours un peu de retard sur la forêt. Va. Pose la main dessus.' },
  ] },
  { cameraFollow: true },
  { toast: 'Grimpe sur la butte et appuie sur E devant le totem.' },
];

CUTSCENES.fs2_loup = [
  { wait: 2600 },
  { say: [
    { who: 'agarica', text: 'Mes jambes fourmillent… comme si elles voulaient galoper toutes seules !' },
    { who: 'xara', text: 'La course du loup coule en toi, maintenant. Je savais que ce vieux totem ne dormait que d\'un œil.' },
    { who: 'xara', text: 'Cours : garde Shift enfoncé, ou appuie deux fois vers l\'avant. Tu verras bien ce que tu deviens.' },
    { who: 'xara', text: 'Prends de l\'élan avant le ravin, et saute au tout dernier moment.' },
    { who: 'xara', text: 'Et ouvre l\'œil : un loup voit des pistes que les autres ne voient pas.' },
  ] },
  { toast: 'Shift (ou double appui ← / →) : courir en loup. Saute en pleine course pour franchir le ravin.' },
];

CUTSCENES.fs2_ravin_large = [
  { playerFace: 'right' },
  { say: [
    { who: 'agarica', text: 'Encore un ravin… Celui-là est immense.' },
    { who: 'xara', text: 'Les pistes, Agarica. Où vont-elles ?' },
    { who: 'agarica', text: 'Elles… continuent dans le vide ?' },
    { who: 'xara', text: 'Un loup ne court jamais dans le vide. Approche-toi en courant, et regarde mieux.' },
  ] },
  { toast: 'En forme de loup, les pistes et les passages cachés se révèlent.' },
];

CUTSCENES.fs2_plante = [
  { say: [
    { who: 'agarica', text: 'Oh ! De l\'eau claire… et des poissons ! Un, deux, trois.' },
    { who: 'xara', text: 'Il reste donc des coins que la mousse n\'a pas encore touchés.' },
  ] },
  { camera: { x: FS2_PLANTE.x + 60, y: 230, ms: 900 } },
  { say: [
    { who: 'agarica', text: 'Xara, regarde ! Là-haut, sur la branche de l\'arbre mort !' },
    { who: 'agarica', text: 'Une fleur… et pas un brin de mousse autour d\'elle. La mousse s\'écarte de cette plante !' },
    { who: 'xara', text: 'Intéressant. Très intéressant.' },
  ] },
  { set: { planteVue: true } },
  { say: [
    { who: 'agarica', text: 'Si j\'arrivais à en cueillir une, on pourrait peut-être s\'en servir contre la mousse !' },
    { who: 'xara', text: 'Elle est bien trop haut. Ni toi ni ton loup n\'y grimperez.' },
    { who: 'xara', text: 'Retiens-la. Il en pousse peut-être d\'autres, plus haut dans la forêt… là où il faudrait des ailes.' },
    { who: 'agarica', text: 'Des ailes… Je m\'en souviendrai.' },
  ] },
  { cameraFollow: true },
];

CUTSCENES.fs2_mur = (scene) => {
  if (storyGet(FS2_MUR_FLAG)) return [];
  if (inventoryHas('repulsif')) {
    return [
      { say: [
        { who: 'xara', text: 'Le vieux passage. Avec le répulsif de Morgat, cette mousse ne tiendra pas longtemps.' },
      ] },
      { toast: 'E devant le mur : verser le répulsif.' },
    ];
  }
  return [
    { say: [
      { who: 'agarica', text: 'Un mur de mousse, sous le surplomb… Il bouge ! On dirait qu\'il respire.' },
      { who: 'agarica', text: 'Et si j\'essayais le talisman ?' },
      { who: 'xara', text: 'Celle-ci est vivante. La frapper ne ferait que l\'épaissir.' },
      { who: 'xara', text: 'Il y a un vieux passage, derrière. Il montait autrefois vers les hauteurs.' },
      { who: 'agarica', text: 'Autrefois ? Tu es déjà passée par là ?' },
      { who: 'xara', text: 'Il y a longtemps. Bien avant la mousse… Viens, ne traînons pas.' },
    ] },
  ];
};

// Arrivée par le vieux sentier de la hutte (acte 2) : on est DANS la poche.
CUTSCENES.fs2_arrivee_poche = [
  { wait: 1700 },
  { say: [
    { who: 'xara', text: 'Le vieux sentier débouche ici… et la mousse a scellé la sortie de ce côté-ci.' },
    { who: 'xara', text: 'Verse le répulsif sur le mur, Agarica.' },
  ] },
];

CUTSCENES.fs2_coeur = [
  { say: [
    { who: 'agarica', text: 'Une graine de chêne-cœur ! Orme disait qu\'il n\'en restait plus une seule dans toute la forêt…' },
    { who: 'xara', text: 'La mousse ne l\'a pas trouvée, derrière son propre mur. Garde-la : elle battra avec toi.' },
  ] },
];

CUTSCENES.fs2_grand_arbre = [
  { playerFace: 'right' },
  { say: [
    { who: 'agarica', text: 'Xara… cet arbre, là-bas. Il touche les nuages !' },
    { who: 'xara', text: 'Le grand arbre. Le plus vieux de la forêt. Les pistes du loup mènent à ses racines.' },
    { who: 'xara', text: 'Sois prudente, là-haut : quelque chose veille sur son sommet. Quelque chose qui n\'aime pas les visiteurs.' },
    { who: 'agarica', text: 'Alors on lui dira bonjour poliment !' },
    { who: 'xara', text: '… Évidemment.' },
  ] },
  { toast: 'Les racines du grand arbre →' },
];

// Mare préservée (décor pur, pas de clé `water`) : eau sous un vieux pont de
// bois ; les trois poissons (clé `animals`, profondeur 4) nagent entre les deux couches.
function acte1Fs2DrawMare(scene) {
  const { x, w, y } = FS2_MARE;
  const back = scene.add.graphics().setDepth(3);
  back.fillStyle(0x0d2a3a, 1).fillRect(x, y, w, 540 - y);
  back.fillStyle(0x1c5f6e, 0.8).fillRect(x + 6, y + 4, w - 12, 540 - y - 4);
  const front = scene.add.graphics().setDepth(5);
  front.fillStyle(0x9fe6e0, 0.18).fillRect(x, y, w, 540 - y);
  front.fillStyle(0xbff6ef, 0.7).fillRect(x, y, w, 3);
  // Roseaux et pierres des berges.
  for (const [bx, s] of [[x - 6, -1], [x + w + 6, 1]]) {
    front.fillStyle(0x3a3550, 1).fillEllipse(bx, y + 4, 26, 14);
    front.fillStyle(0x2d6b3a, 1);
    for (let i = 0; i < 4; i++) front.fillRect(bx + s * (6 + i * 5), y - 26 + i * 4, 3, 30 - i * 4);
  }
  scene.tweens.add({ targets: front, alpha: 0.75, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  // Le pont : un tronc couché (on marche dessus, le sol solide est dessous).
  const log = scene.add.graphics().setDepth(6);
  log.fillStyle(0x3b2a20, 1).fillRoundedRect(x - 20, y - 8, w + 40, 16, 7);
  log.fillStyle(0x5a4030, 1).fillRoundedRect(x - 16, y - 7, w + 32, 5, 3);
  log.fillStyle(0x2a1d16, 1).fillCircle(x - 14, y, 7).fillCircle(x + w + 14, y, 7);
}

// L'arbre mort et sa branche (case gy 1) ; la plante qui repousse la mousse,
// avec un halo doux et une lueur qui bat lentement.
function acte1Fs2DrawPlante(scene) {
  const trunk = scene.add.graphics();
  trunk.fillStyle(0x1c1626, 1).fillRect(3486, 110, 40, FS2_MARE.y - 110);
  trunk.fillStyle(0x2a2238, 1).fillRect(3492, 110, 10, FS2_MARE.y - 110);
  trunk.fillStyle(0x1c1626, 1).fillTriangle(3466, FS2_MARE.y, 3546, FS2_MARE.y, 3506, FS2_MARE.y - 60);
  storyPutBehindPlayer(scene, trunk);
  const { x, y } = FS2_PLANTE;
  const halo = scene.add.circle(x, y - 26, 46, 0xffe9f5, 0.12).setBlendMode(Phaser.BlendModes.ADD);
  scene.tweens.add({ targets: halo, scale: 1.25, alpha: 0.05, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  const g = scene.add.graphics({ x, y });
  g.fillStyle(0x3f8f4a, 1).fillRect(-2, -34, 4, 34);
  g.fillStyle(0x4fae5a, 1).fillEllipse(-9, -14, 14, 6).fillEllipse(9, -20, 14, 6);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    g.fillStyle(i % 2 ? 0xff9fc9 : 0xffe9f5, 1).fillEllipse(Math.cos(a) * 9, -40 + Math.sin(a) * 9, 11, 11);
  }
  g.fillStyle(0xfff3b0, 1).fillCircle(0, -40, 5);
  scene.tweens.add({ targets: g, angle: 3, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
}

// Le grand arbre, au loin (parallaxe lente) : il se lève à l'horizon au fil
// de la zone et domine l'écran près de la sortie vers ses racines.
function acte1Fs2DrawGrandArbre(scene) {
  const g = scene.add.graphics().setScrollFactor(0.15, 1).setAlpha(0.92);
  const cx = 1390; // ≈ x 650 à l'écran quand la caméra est en bout de zone
  g.fillStyle(0x120d26, 1);
  g.fillRect(cx - 55, 120, 110, 420);
  g.fillTriangle(cx - 55, 540, cx - 160, 540, cx - 55, 400);
  g.fillTriangle(cx + 55, 540, cx + 170, 540, cx + 55, 380);
  for (const [dx, dy, r] of [[0, 90, 150], [-150, 140, 110], [150, 130, 120], [-80, 30, 100], [90, 20, 110], [0, -20, 90]]) {
    g.fillCircle(cx + dx, dy, r);
  }
  // Liseré de lune sur la cime.
  g.lineStyle(4, 0x9d8cf0, 0.7);
  g.beginPath();
  g.arc(cx - 20, -20, 90, Math.PI * 1.05, Math.PI * 1.75);
  g.strokePath();
  // Juste devant le ciel, derrière la forêt procédurale (moveAbove ne
  // déplace pas un objet déjà au-dessus : on vise l'index directement).
  const bgIndex = scene.children.list.findIndex((o) => o.type === 'TileSprite');
  if (bgIndex !== -1) scene.children.moveTo(g, bgIndex + 1);
  return g;
}

// Empreintes boueuses du sentier de chasse (toujours visibles ; les pistes
// lumineuses `tracks` ne se voient, elles, qu'en forme de loup).
function acte1Fs2DrawMudPrints(scene, x0, x1, y) {
  const g = scene.add.graphics();
  for (let x = x0, i = 0; x < x1; x += 46, i++) {
    const py = y - 3 + (i % 2 ? 3 : 0);
    g.fillStyle(0x140e20, 0.55).fillEllipse(x, py, 13, 6);
    for (let k = 0; k < 3; k++) g.fillCircle(x + 7, py - 4 + k * 4, 2);
  }
  storyPutBehindPlayer(scene, g);
}

function acte1Fs2DrawCoeur(scene) {
  const { x, y } = FS2_COEUR;
  const glow = scene.add.circle(x, y, 26, 0xff9fc9, 0.2).setBlendMode(Phaser.BlendModes.ADD);
  const g = scene.add.graphics({ x, y });
  g.fillStyle(0xff6fa8, 1).fillCircle(-6, -3, 8).fillCircle(6, -3, 8).fillTriangle(-13, 0, 13, 0, 0, 15);
  g.fillStyle(0xffd0e4, 1).fillCircle(-7, -6, 3);
  scene.tweens.add({ targets: [g, glow], y: y - 8, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  scene.tweens.add({ targets: glow, scale: 1.4, alpha: 0.08, duration: 900, yoyo: true, repeat: -1 });
  storyPutBehindPlayer(scene, glow);
  storyPutBehindPlayer(scene, g);
  return { g, glow };
}

// Le vieux sentier vers la hutte, au fond de la poche : racines-marches et
// une lueur rose qui descend des hauteurs.
function acte1Fs2DrawSentier(scene) {
  const g = scene.add.graphics();
  g.fillStyle(0x2a2238, 1);
  for (let i = 0; i < 4; i++) g.fillRoundedRect(5000 + i * 26, 430 - i * 34, 40, 10, 4);
  g.fillStyle(0xff9fc9, 0.12).fillTriangle(5050, 448, 5120, 448, 5120, 256);
  storyPutBehindPlayer(scene, g);
}

function acte1Fs2TakeCoeur(scene) {
  const st = scene.__acte1;
  st.coeurTaken = true;
  storySet('coeurBonusForet', true);
  const p = scene.player;
  if (p && p.recomputeTotemBonuses) {
    p.recomputeTotemBonuses();
    p.hearts = p.maxHearts;
    scene.registry.set('hearts', p.hearts);
  }
  if (st.coeur) {
    scene.tweens.killTweensOf([st.coeur.g, st.coeur.glow]);
    scene.tweens.add({
      targets: [st.coeur.g, st.coeur.glow], y: '-=40', alpha: 0, duration: 500,
      onComplete: () => { st.coeur.g.destroy(); st.coeur.glow.destroy(); },
    });
  }
  acte1Particles(scene, FS2_COEUR.x, FS2_COEUR.y, { count: 14, colors: [0xff9fc9, 0xffe9f5], spread: 50, rise: 60 });
  showStoryBanner(scene, { kicker: 'Secret', title: 'Graine de chêne-cœur', desc: '+1 cœur maximum.', color: STORY_UI.pink });
  runCutscene(scene, [{ wait: 1400 }, { say: CUTSCENES.fs2_coeur[0].say }]);
}

ZONE_SCRIPTS.foret_sombre_2 = {
  create(scene) {
    const st = { hadWolf: !!storyGet('hasWolfForm'), coeurTaken: !!storyGet('coeurBonusForet'), coeur: null };
    scene.__acte1 = st;
    acte1Fs2DrawGrandArbre(scene);
    acte1Fs2DrawMudPrints(scene, 300, 1120, 448);
    acte1Fs2DrawMare(scene);
    acte1Fs2DrawPlante(scene);
    acte1Fs2DrawSentier(scene);
    acte1DrawMossDecor(scene, [[1700, 448, 22], [2500, 448, 26], [4300, 140, 22], [4900, 130, 26], [5500, 448, 30]]);
    if (!st.coeurTaken) st.coeur = acte1Fs2DrawCoeur(scene);
    // Arrivée par le sentier de la hutte avec le mur encore fermé.
    const p = scene.player;
    if (p.x > FS2_POCHE.x0 && p.x < FS2_POCHE.x1 && !storyGet(FS2_MUR_FLAG)) runCutscene(scene, 'fs2_arrivee_poche');
  },

  update(scene) {
    const st = scene.__acte1;
    if (!st) return;
    const p = scene.player;
    acte1RespawnAfter(scene, [{ x: 3430, y: 448 }]);
    // Totem du loup touché (LevelKit pose le flag) : Xara explique la course.
    if (!st.hadWolf && storyGet('hasWolfForm')) {
      st.hadWolf = true;
      runCutscene(scene, 'fs2_loup');
      return;
    }
    if (!st.coeurTaken && st.coeur && Math.abs(p.x - FS2_COEUR.x) < 36 && Math.abs(p.y - 40 - FS2_COEUR.y) < 70) {
      acte1Fs2TakeCoeur(scene);
    }
  },
};
