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
  { npcAnim: { npc: 'pere_chef', anim: 'talk' } },
  { say: [
    { who: 'pere_chef', text: 'Agarica. Orme m\'a dit que tu l\'avais aidé. Et qu\'une bête est sortie de l\'amas.' },
    { who: 'agarica', text: 'Elle repousse partout, Père. On gratte, on brûle… et la nuit suivante, tout recommence.' },
    { who: 'pere_chef', text: 'Je sais. Chaque nuit, la forêt recule un peu plus.' },
    { who: 'pere_chef', text: 'Approche. Je veux te confier quelque chose.' },
  ] },
  { npcAnim: { npc: 'pere_chef', anim: 'give_talisman' } },
  { wait: 500 },
  { give: 'talisman_ours' },
  { set: { talismanOurs: true } },
  { wait: 1400 },
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
  { call: (scene) => { if (!scene.npcs.amanite) createStoryNpc(scene, { id: 'amanite', x: BOSQUET_IDOLE.x - 40, y: 320, lookAtPlayer: false }); } },
  { camera: { x: 3360, y: 300, ms: 900 } },
  { say: [
    'Au sanctuaire, une silhouette rouge se penche sur l\'autel.',
    { who: 'agarica', text: 'Amanite ?! Qu\'est-ce que tu fais là ?' },
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
  if (scene.npcs.garde_juge) scene.npcs.garde_juge.setX(3560).setY(storyGroundY(scene, 3560));
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
