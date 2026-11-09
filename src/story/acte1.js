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
// Gerbe de particules. Option `fx` (lot n°8, contrat PLAN_INTEGRATION_LOT_8
// §3.3, utilisée aussi par acte1_arbre.js) : liste d'images `fx_*` du
// manifeste, prises en alternance, à la taille du disque qu'elles remplacent
// (2r × 1,3 : l'image normalisée à 128 px a un peu de marge), tournées au
// hasard. Seule la braise est en ADD (lumière) ; éclats, mottes et pétales
// ont un contour sombre, illisible en ADD. Les ids absents sont ignorés ;
// sans aucune image (ou sans l'option) : les disques de couleur d'avant.
function acte1Particles(scene, x, y, { count = 12, colors = [0x3e7a2c, 0x9bff5a], spread = 50, rise = 40, size = [3, 7], fx = null } = {}) {
  const arts = (fx || []).filter((id) => scene.textures.exists(`item-${id}`));
  for (let i = 0; i < count; i++) {
    const r = Phaser.Math.Between(size[0], size[1]);
    let p;
    if (arts.length) {
      const id = arts[i % arts.length];
      p = scene.add.image(x, y, `item-${id}`).setDepth(1040).setAngle(Phaser.Math.Between(0, 359));
      p.setScale((2 * r * 1.3) / Math.max(p.width, p.height, 1));
      if (id === 'fx_braise') p.setBlendMode(Phaser.BlendModes.ADD);
    } else {
      p = scene.add.circle(x, y, r, colors[i % colors.length], 1).setDepth(1040);
    }
    scene.tweens.add({
      targets: p,
      x: x + Phaser.Math.Between(-spread, spread),
      y: y - Phaser.Math.Between(0, rise) + Phaser.Math.Between(-10, 20),
      // Les images tournoient un peu en retombant (un disque n'a pas de sens).
      ...(arts.length ? { angle: p.angle + Phaser.Math.Between(-120, 120) } : {}),
      alpha: 0,
      duration: Phaser.Math.Between(450, 800),
      ease: 'Quad.easeOut',
      onComplete: () => p.destroy(),
    });
  }
}

// Particules du lot n°8 par usage (A1-7) : mousse grattée ou qui éclate,
// lueur chaude du talisman, graine de chêne-cœur.
const ACTE1_FX_MOUSSE = ['fx_eclat_mousse', 'fx_motte_mousse'];
const ACTE1_FX_TALISMAN = ['fx_braise', 'fx_petale_rose'];
const ACTE1_FX_GRAINE = ['fx_petale_rose', 'fx_petale_blanc'];

// Halo peint `fx_halo_doux` (lot n°8, dégradé radial depuis l'import M04) de
// `size` px, teinté, en ADD ; null si l'image manque (l'appelant garde son
// cercle dessiné). `__base` = échelle de repos : les tweens visent
// `__base × facteur` (règle des tweens relatifs : `scale: 1.3` sur une image
// de 435 px la ferait exploser).
function acte1HaloImage(scene, x, y, size, tint, alpha) {
  if (!scene.textures.exists('item-fx_halo_doux')) return null;
  const img = scene.add.image(x, y, 'item-fx_halo_doux').setTint(tint).setAlpha(alpha)
    .setBlendMode(Phaser.BlendModes.ADD);
  img.__base = size / Math.max(img.width, img.height, 1);
  img.setScale(img.__base);
  return img;
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

// ---------------------------------------------------------------------------
// Bulles non bloquantes (actes 1 et 2)
// ---------------------------------------------------------------------------
// Retour utilisateur : Xara « coupait le jeu toutes les 4 secondes » -- après
// sa rencontre, un dialogue BLOQUANT tous les 300-600 px (feu, créature,
// talisman, amas, mousse, empreintes, ravin, loup, ravin, plante…). Seules
// les scènes importantes (rencontres, révélations, boss, objets) restent des
// dialogues ; les remarques d'exploration sont des bulles au-dessus de qui
// parle, sans geler le monde. `showSpeechBubble` (StoryKit, agent Calibrage)
// si elle existe, sinon un toast « Xara : … ».
function storyBulleDuree(text) {
  return Phaser.Math.Clamp(1500 + text.length * 42, 2300, 5200);
}

function storyBulle(scene, who, text, ms, { replace = false } = {}) {
  if (!scene || !scene.sys || !scene.sys.isActive() || !scene.player) return null;
  const dur = ms || storyBulleDuree(text);
  if (typeof showSpeechBubble === 'function') {
    try {
      return showSpeechBubble(scene, who === 'agarica' ? scene.player : who, text, { ms: dur, who, replace });
    } catch (e) {
      console.warn('[bulle]', e);
    }
  }
  const name = who && SPEAKERS[who] ? SPEAKERS[who].name : '';
  return showToast(scene, name ? `${name} : ${text}` : text, dur);
}

// Enchaîne des bulles ({who, text} ou texte seul = Xara) puis, éventuellement,
// un toast d'aide ; ne bloque rien. Une seule « conversation » à la fois par
// zone : un nouveau déclencheur annule les répliques pas encore dites du
// précédent (avant, deux déclencheurs proches entrelaçaient leurs répliques
// hors contexte) ; pendant un dialogue bloquant, la suite attend. Arrêt si on
// quitte la zone.
function storyBulles(scene, lines, toast, delay = 0) {
  const visit = scene.__storyVisit;
  const conv = (scene.__bulleConvSeq || 0) + 1;
  scene.__bulleConvSeq = conv;
  scene.__bulleConv = conv;
  const alive = () => scene.sys && scene.sys.isActive() && scene.__storyVisit === visit && scene.__bulleConv === conv;
  const queue = lines.map((l) => (typeof l === 'string' ? { who: 'xara', text: l } : l));
  const total = queue.reduce((acc, l) => acc + storyBulleDuree(l.text) + 200, delay);
  let first = true;
  const next = () => {
    if (!alive() || !queue.length) return;
    if (typeof isWorldFrozen === 'function' && isWorldFrozen(scene)) { scene.time.delayedCall(250, next); return; }
    const line = queue.shift();
    const dur = storyBulleDuree(line.text);
    // La 1re réplique remplace une bulle encore affichée du même personnage.
    storyBulle(scene, line.who, line.text, dur, { replace: first });
    first = false;
    scene.time.delayedCall(dur + 200, next);
  };
  scene.time.delayedCall(delay, next);
  if (toast) {
    const tt = typeof toast === 'string' ? { text: toast } : toast;
    // Sans bulles (repli en toasts), le toast d'aide passe après elles.
    const at = typeof showSpeechBubble === 'function' ? delay + 500 : total;
    scene.time.delayedCall(at, () => {
      if (scene.sys && scene.sys.isActive() && scene.__storyVisit === visit) showToast(scene, tt.text, tt.ms || 3200);
    });
  }
}

// Cinématique « bulles » pour un déclencheur : renvoie une liste d'étapes
// VIDE (runCutscene ne verrouille alors rien, pas même un arrêt du joueur).
function cutsceneBulles(lines, toast, delay = 0) {
  return (scene) => {
    storyBulles(scene, typeof lines === 'function' ? lines(scene) : lines, toast, delay);
    return [];
  };
}

// Plaques (à gratter, puis traces) DEVANT les décors de la zone, toujours
// derrière les personnages (profondeur 10) : storyPutBehindPlayer les
// glissait sous le joueur, or les décors (`props`) sont créés APRÈS lui --
// la plaque du milieu (x 2050) disparaissait entièrement derrière la hutte
// `bosquet_hutte_mousse`, alors qu'il faut la gratter.
function acte1PutAboveProps(scene, obj) {
  let last = null;
  let lastIdx = -1;
  for (const p of scene.props || []) {
    if (!p || !p.active || p.depth !== obj.depth) continue;
    const i = scene.children.getIndex(p);
    if (i > lastIdx) { lastIdx = i; last = p; }
  }
  if (last) scene.children.moveAbove(obj, last);
  else storyPutBehindPlayer(scene, obj);
}

// Plaque de mousse « grattable » (bosquet) : simple dessin + PV, sans corps.
// Lot n°8 (A1-2) : plaque peinte `decor_mousse_plaque_intacte`, posée par le
// pied (origine (0.5, 1)) et large de `w` (0,216 pour 70 px : la largeur de
// grattage). Ses coulures dépassent de 2 px sous la base : bas visible 3 px
// sous `y`, enfoncé dans l'herbe. `__base` (échelle de repos) sert aux
// tweens et aux changements d'état (grattée, repoussée). Le rectangle de
// grattage (x, y, w, h) ne change pas. Sans l'image : le dessin d'avant.
const ACTE1_PATCH_SINK = 3;
function acte1PatchImage(scene, x, y, w, state) {
  const key = `item-decor_mousse_plaque_${state}`;
  if (!scene.textures.exists(key)) return null;
  const img = scene.add.image(x, y, key).setOrigin(0.5, 1);
  img.__base = w / Math.max(img.width, 1);
  img.setScale(img.__base);
  setVisibleBottomY(img, y + ACTE1_PATCH_SINK);
  return img;
}

function acte1MossPatch(scene, x, y, w = 70) {
  const art = acte1PatchImage(scene, x, y, w, 'intacte');
  if (art) return { x, y, w, h: 30, g: art, art: true, hp: 2, lastToken: null, done: false };
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
// L'idole repose sur l'autel (le prop `bosquet_antler_totem`) : sa hauteur est
// celle du haut visible de ce décor (cf. storyPlaceOnProp), `y` n'est
// qu'un repli si le décor manque.
const BOSQUET_IDOLE = { x: 3424, y: 300, autel: 'bosquet_antler_totem' };

// Style des textes : docs/production/STYLE_DIALOGUES.md (couper d'abord,
// une réplique = une info ou une émotion, aides d'une ligne avec la touche).
DIALOGUES.bosquet_porteur = [
  { who: 'habitant', name: 'Bran, le porteur', text: "L'eau de la source noircit un peu plus chaque nuit." },
];
DIALOGUES.bosquet_garde_cochons = [
  { who: 'garde', name: 'Tilda, la gardienne', text: 'Un, deux, trois… Ouf. Les petits sont tous là.' },
];
DIALOGUES.bosquet_druide_feu = [
  { who: 'habitant', name: 'Sauge, la druidesse', text: "On brûle tout ce qu'on gratte, sinon ça repousse. Kof, kof." },
];
DIALOGUES.bosquet_orme_aide = [
  { who: 'habitant', name: 'Orme, le druide', text: 'Les plaques, Agarica ! Frappe-les : [K] ou clic.' },
];
DIALOGUES.bosquet_orme_apres = [
  { who: 'habitant', name: 'Orme, le druide', text: 'Ton père te cherche. Il est devant sa hutte.' },
];
DIALOGUES.bosquet_pere_avant = [
  { who: 'pere_chef', text: "Orme a besoin d'aide à la source. Va, puis reviens me voir." },
];
DIALOGUES.bosquet_pere_apres = [
  { who: 'pere_chef', text: 'Va dormir, ma fille. Et garde ce talisman sur toi.' },
];
DIALOGUES.bosquet_garde_porte = [
  { who: 'garde', text: 'Les portes restent fermées la nuit. Ordre du chef.' },
];

// Aides du tutoriel : un simple toast, sans cinématique (une étape `toast`
// dans une cinématique arrêtait Agarica et relâchait les touches tenues).
CUTSCENES.bosquet_tuto_saut = (scene) => { showToast(scene, '[Espace] : sauter'); return []; };
CUTSCENES.bosquet_tuto_parler = (scene) => { showToast(scene, '[E] : parler'); return []; };

// Le prologue a déjà posé la mousse : une seule bulle pour l'objectif.
CUTSCENES.bosquet_intro = cutsceneBulles([
  { who: 'agarica', text: "Orme gratte la mousse près de la source. Il aura besoin d'aide." },
], '[←] [→] ou [Q] [D] : marcher', 1900);

CUTSCENES.bosquet_aide_debut = [
  // En cas de chute de cœurs pendant l'aide : on revient près d'Orme, pas au début du bosquet.
  { call: (scene) => { scene.player.spawnX = 1760; scene.player.spawnY = 440; } },
  { npcFace: { npc: 'druide_orme', dir: 'player' } },
  { say: [
    { who: 'habitant', name: 'Orme, le druide', text: "Agarica ! Aide-moi à gratter ces plaques avant qu'elles prennent racine." },
  ] },
  { toast: { text: '[K] ou clic : frapper', ms: 3600 } },
];

CUTSCENES.bosquet_barriere_aide = [
  { call: (scene) => storyBulles(scene, [{ who: 'druide_orme', text: 'Hé ! Il reste de la mousse derrière toi !' }]) },
  { playerMove: { toX: 2320 } },
];

CUTSCENES.bosquet_mousse_revient = [
  { wait: 300 },
  { call: (scene) => acte1BosquetRegrow(scene) },
  { wait: 1400 },
  { say: [
    { who: 'agarica', text: "Elle repousse déjà ! J'essaie l'amas de la source." },
  ] },
  { playerMove: { toX: BOSQUET_SOURCE_X - 80 } },
  { playerFace: 'right' },
  { npcAnim: { npc: 'druide_orme', anim: 'idle' } },
  { call: (scene) => { acte1Particles(scene, BOSQUET_SOURCE_X - 30, 400, { count: 8, fx: ACTE1_FX_MOUSSE }); } },
  { shake: { ms: 200, intensity: 0.006 } },
  { wait: 250 },
  { call: (scene) => { acte1Particles(scene, BOSQUET_SOURCE_X - 30, 400, { count: 8, fx: ACTE1_FX_MOUSSE }); } },
  { shake: { ms: 200, intensity: 0.006 } },
  { say: [
    { who: 'habitant', name: 'Orme, le druide', text: "Laisse tomber. Ni le feu ni nos grattoirs n'en viennent à bout." },
  ] },
  { call: (scene) => acte1BosquetSpawnCreature(scene) },
  { shake: { ms: 300, intensity: 0.01 } },
  { playerMove: { toX: BOSQUET_SOURCE_X - 200, speed: 220 } },
  { playerFace: 'right' },
  // (Plus de réplique « quelque chose sort de l'amas » : on le voit.)
  { toast: { text: "[Z] : frapper en haut · [S] en l'air : frapper en bas (rebond)", ms: 4200 } },
];

CUTSCENES.bosquet_aide_fin = [
  { wait: 500 },
  { npcFace: { npc: 'druide_orme', dir: 'player' } },
  { say: [
    { who: 'habitant', name: 'Orme, le druide', text: 'Même les bêtes, maintenant… Va voir ton père, il te cherche.' },
  ] },
  { set: { aideFaite: true } },
  { toast: "La hutte du chef est à l'est →" },
];

CUTSCENES.bosquet_talisman = [
  { npcFace: { npc: 'pere_chef', dir: 'player' } },
  { say: [
    { who: 'pere_chef', text: "Orme m'a parlé de la bête. Tiens, garde ça toujours sur toi." },
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
    { who: 'agarica', text: "Le talisman de l'ours ? Mais c'est celui des chefs !" },
    { who: 'pere_chef', text: 'Ça ne peut plus attendre. Va dormir, ma fille.' },
  ] },
  { toast: '[I] : ton sac' },
];

CUTSCENES.bosquet_barriere_pere = [
  { say: [{ who: 'habitant', text: 'Ton père te cherche ! Il est juste là, devant sa hutte.' }] },
  { playerMove: { toX: 2990 } },
];

DIALOGUES.bosquet_vol_couvrir = [
  { who: 'amanite', text: 'Merci. Je la rapporterai, promis.' },
];
DIALOGUES.bosquet_vol_supplier = [
  { who: 'amanite', text: 'Pardon, Agarica. Je ne peux pas.' },
];

CUTSCENES.bosquet_vol = [
  // (Devant les décors sans rien forcer : les PNJ reçoivent CHARACTER_DEPTH.)
  { call: (scene) => { if (!scene.npcs.amanite) createStoryNpc(scene, { id: 'amanite', x: BOSQUET_IDOLE.x - 55, lookAtPlayer: false }); } },
  { camera: { x: 3360, y: 300, ms: 900 } },
  { say: [
    { who: 'agarica', text: "Amanite ? Qu'est-ce que tu fais là ?" },
  ] },
  // Surprise, elle se retourne vers Agarica (elle faisait face à l'autel).
  { npcFace: { npc: 'amanite', dir: 'player' } },
  { call: (scene) => acte1BosquetTakeIdol(scene) },
  { npcAnim: { npc: 'amanite', anim: 'run_idol' } },
  { wait: 500 },
  { say: [
    { who: 'amanite', text: "Cette idole dort sur sa pierre pendant que la forêt meurt. Moi, je vais m'en servir." },
    {
      who: 'amanite', text: "Les gardes ! Agarica, s'il te plaît… ne dis rien.",
      choices: [
        { text: "« Va-t'en. Je ne dirai rien. »", goto: 'bosquet_vol_couvrir', set: { amaniteCouverte: true } },
        { text: '« Repose-la, Amanite. »', goto: 'bosquet_vol_supplier', set: { amaniteCouverte: false } },
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
    { who: 'garde', text: "L'idole a disparu ! Agarica, tu as vu quelqu'un ?" },
    { who: 'agarica', text: 'Je… non. Personne.' },
  ] },
  { npcMove: { npc: 'garde_vol', toX: 2900, speed: 260 } },
  { npcRemove: 'garde_vol' },
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
    { who: 'pere_chef', text: "Orme t'a vue au sanctuaire. Tu as laissé Amanite partir avec l'idole, et tu as menti." },
    { who: 'agarica', text: "Elle veut sauver la forêt, Père. C'est mon amie." },
    { who: 'pere_chef', text: "Ce soir, je suis le chef, pas ton père. Tu es bannie. Pars avant l'aube." },
  ] },
  { shake: { ms: 250, intensity: 0.004 } },
  { playerPose: 'sad' },
  { say: [
    { who: 'agarica', text: "Père… je n'ai jamais dépassé la lisière." },
    { who: 'pere_chef', text: 'Garde le talisman. Il veillera sur toi à ma place.' },
  ] },
  { set: { banished: true } },
  { call: (scene) => acte1BosquetAfterJudgement(scene) },
  { toast: "Les portes de l'est sont ouvertes →" },
];

DIALOGUES.bosquet_pere_adieu = [
  { who: 'pere_chef', text: "Va. Avant que je change d'avis." },
];
DIALOGUES.bosquet_orme_adieu = [
  { who: 'habitant', name: 'Orme, le druide', text: 'Fais attention à toi, Agarica. Et reviens-nous.' },
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
    { title: { title: 'Bannie', sub: 'Les portes se ferment derrière elle', hold: 1800 } },
    { fadeOut: 1000 },
    { goto: { scene: 'foret_sombre_1', data: { enterId: 'from_bosquet' } } },
  ];
};

function acte1BosquetRegrow(scene) {
  const st = scene.__acte1;
  if (!st) return;
  // Une des plaques grattées repousse sous les yeux d'Agarica (échec partiel).
  // Lot n°8 : la trace grattée de cette plaque fond, et la plaque peinte
  // `…_repoussee` sort de terre à sa place (70 px de large, pied enfoncé de
  // 3 px). Tween d'échelle relatif : vers `__base`, pas vers 1.
  const regrow = acte1PatchImage(scene, BOSQUET_PATCH_XS[1], 448, 70, 'repoussee');
  if (regrow) {
    const old = st.patches[1] && st.patches[1].art ? st.patches[1].g : null;
    if (old && old.active) {
      scene.tweens.killTweensOf(old);
      scene.tweens.add({ targets: old, alpha: 0, duration: 600, onComplete: () => old.destroy() });
    }
    acte1PutAboveProps(scene, regrow);
    const base = regrow.__base;
    regrow.setAlpha(0).setScale(base, base * 0.2);
    scene.tweens.add({ targets: regrow, alpha: 1, scaleY: base, duration: 1200, ease: 'Sine.easeOut' });
    st.regrown = { g: regrow, art: true };
    return;
  }
  const p = acte1MossPatch(scene, BOSQUET_PATCH_XS[1], 448, 60);
  p.g.setAlpha(0).setScale(0.2, 0.2);
  scene.tweens.add({ targets: p.g, alpha: 1, scaleX: 1, scaleY: 1, duration: 1200, ease: 'Sine.easeOut' });
  st.regrown = p;
}

function acte1BosquetSpawnCreature(scene) {
  const st = scene.__acte1;
  acte1Particles(scene, BOSQUET_SOURCE_X, 400, { count: 16, spread: 70, fx: ACTE1_FX_MOUSSE });
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
      st.idol = storyPlaceOnProp(scene, addItemIcon(scene, 0, 0, 'idole', 40), BOSQUET_IDOLE.x, BOSQUET_IDOLE.autel, BOSQUET_IDOLE.y);
      // Lot n°8 (A1-9) : halo peint (le disque dessiné de 52 px n'a pas de
      // dégradé) ; même respiration, en échelle relative. 100 px à 0,32 et
      // non 90 px à 0,25 (plan) : le dégradé porte moins de lumière qu'un
      // disque plein (énergie moyenne 0,18 contre 0,79), à 90 px il ne se
      // voyait plus ; 100 x 100 x 0,18 x 0,32 ≈ 52 x 52 x 0,79 x 0,25.
      const halo = acte1HaloImage(scene, st.idol.x, st.idol.y, 100, 0x8fe3b8, 0.32);
      if (halo) {
        st.idolGlow = halo;
        scene.tweens.add({ targets: halo, alpha: 0.1, scaleX: halo.__base * 1.3, scaleY: halo.__base * 1.3, duration: 1400, yoyo: true, repeat: -1 });
      } else {
        st.idolGlow = scene.add.circle(st.idol.x, st.idol.y, 26, 0x8fe3b8, 0.25);
        scene.tweens.add({ targets: st.idolGlow, alpha: 0.08, scale: 1.3, duration: 1400, yoyo: true, repeat: -1 });
      }
      storyPutBehindPlayer(scene, st.idolGlow);
      storyPutBehindPlayer(scene, st.idol);
    }
    // L'amas sur la source : purement visuel (la vraie mousse dense, que
    // personne au bosquet ne sait détruire).
    st.sourceMoss = drawMossVisual(scene, BOSQUET_SOURCE_X, 400, 120, 96, 'mousse_amas_intact', false);
    storyPutBehindPlayer(scene, st.sourceMoss);
    if (!storyGet('aideFaite')) {
      st.patches = BOSQUET_PATCH_XS.map((x) => acte1MossPatch(scene, x, 448));
      st.patches.forEach((p) => acte1PutAboveProps(scene, p.g));
    } else {
      // Partie rechargée après l'aide : les traces restent (H10), comme à la
      // fin de la scène -- deux plaques grattées et celle qui a repoussé.
      // Simple décor (aucune plaque à gratter). Sans les images : rien, comme avant.
      BOSQUET_PATCH_XS.forEach((x, i) => {
        const trace = acte1PatchImage(scene, x, 448, 70, i === 1 ? 'repoussee' : 'grattee');
        if (trace) acte1PutAboveProps(scene, trace);
      });
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
        acte1Particles(scene, patch.x, patch.y - 10, { count: 6, spread: 30, fx: ACTE1_FX_MOUSSE });
        if (patch.hp <= 0) {
          patch.done = true;
          if (patch.art && scene.textures.exists('item-decor_mousse_plaque_grattee')) {
            // Lot n°8 : la plaque grattée RESTE comme trace (H10), avec un
            // petit tassement (échelle relative, pied fixe : origine en bas).
            const g = patch.g;
            g.clearTint().setTexture('item-decor_mousse_plaque_grattee');
            g.__base = patch.w / Math.max(g.width, 1);
            g.setScale(g.__base, g.__base * 0.8);
            setVisibleBottomY(g, patch.y + ACTE1_PATCH_SINK);
            scene.tweens.add({ targets: g, scaleY: g.__base, duration: 150, ease: 'Quad.easeOut' });
          } else {
            scene.tweens.add({ targets: patch.g, alpha: 0, scaleY: 0.2, duration: 300, onComplete: () => patch.g.destroy() });
          }
        } else if (patch.art) {
          // 1er coup : la plaque peinte pâlit (teinte) au lieu de devenir
          // translucide (on verrait l'herbe au travers).
          patch.g.setTint(0xbfcfb8);
        } else {
          patch.g.setAlpha(0.6);
        }
      }
      // Frapper l'amas de la source : rien n'y fait.
      if (st.lastAmasToken !== p.attackEndTime) {
        const amas = new Phaser.Geom.Rectangle(BOSQUET_SOURCE_X - 60, 352, 120, 96);
        if (Phaser.Geom.Intersects.RectangleToRectangle(hit, amas)) {
          st.lastAmasToken = p.attackEndTime;
          acte1Particles(scene, BOSQUET_SOURCE_X - 40, 400, { count: 4, spread: 20, fx: ACTE1_FX_MOUSSE });
          if (!st.amasToastShown) { st.amasToastShown = true; showToast(scene, 'Trop dur : ton coup rebondit.', 2000); }
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
    { who: 'agarica', text: "Bannie. Père ne m'a même pas regardée." },
    storyGet('amaniteCouverte') === false
      ? { who: 'agarica', text: "Et toi, Amanite… je t'avais suppliée de la reposer." }
      : { who: 'agarica', text: 'Et toi, Amanite… tu avais promis de la rapporter.' },
  ] },
  { playerPose: null },
  { toast: 'Avance dans la forêt →' },
];

CUTSCENES.fs1_rencontre = [
  { playerFace: 'right' },
  { playerPose: 'sad' },
  { say: [{ who: 'xara', name: '???', text: "Tu pleures fort, pour quelqu'un qui se balade seule la nuit." }] },
  { playerPose: null },
  { playerMove: { toX: FS1_XARA_X - 110 } },
  { npcFace: { npc: 'xara', dir: 'player' } },
  // Xara n'a pas d'idle : pose de repos (talk figée), la parole est jouée
  // réplique par réplique par StoryKit (storySpeakerTalkAnim).
  { call: (scene) => storyNpcRest(scene.npcs.xara) },
  // Rencontre : dialogue bloquant gardé, mais resserré à l'essentiel.
  { say: [
    { who: 'agarica', text: 'Qui parle ? … Une araignée ?!' },
    { who: 'xara', text: "Xara. Et toi, la druidesse qu'on vient de mettre dehors." },
  ] },
  // La petite araignée qui s'incline devant Xara se voit : pas de texte.
  { call: (scene) => acte1Fs1LittleSpider(scene) },
  { wait: 900 },
  { say: [
    { who: 'agarica', text: "Je veux quand même sauver le bosquet. Trouver d'où vient la mousse." },
  ] },
  { npcAnim: { npc: 'xara', anim: 'mysterious' } },
  { say: [{ who: 'xara', text: "Je viens avec toi. Il faut bien quelqu'un pour t'empêcher de tomber dans un ravin." }] },
  { xaraJoin: true },
];

CUTSCENES.fs1_feu = cutsceneBulles([], { text: '[E] près d\'un feu : soin et sauvegarde', ms: 3600 });

CUTSCENES.fs1_creature = cutsceneBulles([
  'Chut. Ça, c\'était un blaireau, avant la mousse.',
], { text: '[K] ou clic : frapper', ms: 3200 });

CUTSCENES.fs1_talisman = [
  { playerFace: 'right' },
  // (L'amas et le mur de racines se voient : plus de réplique pour les décrire.)
  { call: (scene) => acte1TalismanGlow(scene) },
  { shake: { ms: 260, intensity: 0.004 } },
  { say: [
    { who: 'xara', text: 'Ton talisman ! Il se réveille.' },
  ] },
  { playerPose: 'cast' },
  { skill: 'ours' },
  { call: (scene) => acte1FillEnergy(scene) },
  { wait: 1200 },
  { playerPose: null },
  { call: (scene) => storyBulles(scene, [
    { who: 'agarica', text: 'La force d\'un ours… Père, tu savais.' },
  ]) },
  { toast: '[A] collée à l\'amas : fracas de l\'ours. Il use l\'énergie (barre sous les cœurs).' },
];

CUTSCENES.fs1_amas_brise = cutsceneBulles([], { text: 'Frapper un ennemi recharge l\'énergie. Un feu la remplit.', ms: 3600 });

// Ancien bavardage d'ambiance (« la mousse est partout ») retiré : le
// déclencheur reste, sans texte (liste d'étapes vide, comme cutsceneBulles,
// mais sans couper les bulles encore en cours).
CUTSCENES.fs1_mousse_partout = () => [];

// Lueur du talisman de l'ours autour d'Agarica (anneaux chauds qui pulsent).
// Lot n°8 (A1-8) : la frame FIXE n° 2 de la rangée `talisman` de
// `vfx_anneau_choc` (anneau ambre à feuilles, recentré par l'import M06),
// agrandie par tween comme les cercles d'avant -- pas l'anim : jouée en
// 290 ms, elle ne suivrait ni la durée (900 ms) ni Agarica. `base` cale son
// cercle (~197 px de diamètre dans la frame) sur le cercle dessiné de 36 px.
// ADD obligatoire (anneau déjà coloré, intérieur noir). Repli : les cercles.
const ACTE1_TALISMAN_RING_FRAME = 'vfx_anneau_choc-talisman-2';
const ACTE1_TALISMAN_RING_DIAM = 197;
function acte1TalismanGlow(scene) {
  const p = scene.player;
  if (!p) return;
  const art = scene.textures.exists(ACTE1_TALISMAN_RING_FRAME);
  const base = 36 / ACTE1_TALISMAN_RING_DIAM;
  for (let i = 0; i < 3; i++) {
    const ring = art
      ? scene.add.image(p.x, p.y - 40, ACTE1_TALISMAN_RING_FRAME).setScale(base).setAlpha(0.9)
      : scene.add.circle(p.x, p.y - 40, 18, 0xffc36b, 0.5);
    ring.setDepth(1040).setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({
      targets: ring, ...(art ? { scaleX: base * 4, scaleY: base * 4 } : { scale: 4 }), alpha: 0, duration: 900, delay: i * 320, ease: 'Quad.easeOut',
      onUpdate: () => { if (scene.player) ring.setPosition(scene.player.x, scene.player.y - 40); },
      onComplete: () => ring.destroy(),
    });
  }
  acte1Particles(scene, p.x, p.y - 40, { count: 14, colors: [0xffc36b, 0xff9fc9], spread: 60, rise: 70, fx: ACTE1_FX_TALISMAN });
}

// Indice Maexxna : une petite araignée s'écarte devant Xara.
// Lot n°8 (A1-10) : araignée peinte `araignee_petite_0..2` (24 px, tournée
// vers la droite, vers Xara ; même ligne de base pour les 3 poses), posée
// par les pieds (origine (0.5, 1), footOffset 0). Pendant l'arrêt devant
// Xara : `_1` (elle se ramasse), `_2` 120 ms plus tard (la révérence), `_1`
// en se relevant, `_0` pour repartir ; elle recule sans se retourner. Mêmes
// trajets et mêmes durées. Repli : le dessin d'avant.
const ACTE1_SPIDER_POSES = ['araignee_petite_0', 'araignee_petite_1', 'araignee_petite_2'];
function acte1Fs1LittleSpider(scene) {
  const xara = scene.npcs && scene.npcs.xara;
  const x0 = (xara ? xara.x : FS1_XARA_X) - 50;
  if (ACTE1_SPIDER_POSES.every((id) => scene.textures.exists(`item-${id}`))) {
    acte1Fs1LittleSpiderArt(scene, x0);
    return;
  }
  // Pattes (≈ 5 px sous le centre) sur la surface de marche, puis le relief
  // suivi pendant la fuite (elle descend du bloc de la souche).
  const FOOT = 5;
  const y0 = storyStandY(scene, x0);
  const g = scene.add.graphics({ x: x0, y: y0 - FOOT });
  let lastX = x0;
  const follow = () => {
    if (!g.active) { scene.events.off('update', follow); return; }
    const dir = Math.sign(g.x - lastX);
    lastX = g.x;
    storyFollowGround(scene, g, storyFrameDt(scene), { dir, speed: 160, footOffset: FOOT });
  };
  scene.events.on('update', follow);
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

function acte1Fs1LittleSpiderArt(scene, x0) {
  const pose = (i) => `item-${ACTE1_SPIDER_POSES[i]}`;
  const g = scene.add.image(x0, storyStandY(scene, x0), pose(0)).setOrigin(0.5, 1);
  g.setScale((getItemManifest().araignee_petite_0 || {}).scale || 0.1);
  let lastX = x0;
  const follow = () => {
    if (!g.active) { scene.events.off('update', follow); return; }
    const dir = Math.sign(g.x - lastX);
    lastX = g.x;
    storyFollowGround(scene, g, storyFrameDt(scene), { dir, speed: 160, footOffset: 0 });
  };
  scene.events.on('update', follow);
  storyPutBehindPlayer(scene, g);
  const setPose = (i) => { if (g.active) g.setTexture(pose(i)); };
  scene.tweens.chain({
    targets: g,
    tweens: [
      { x: x0 + 25, duration: 500, ease: 'Sine.easeOut' },
      {
        x: x0 + 20, duration: 250, yoyo: true,
        onStart: () => { setPose(1); scene.time.delayedCall(120, () => setPose(2)); },
        onYoyo: () => setPose(1),
        onComplete: () => setPose(0),
      },
      { x: x0 - 140, alpha: 0, duration: 900, ease: 'Quad.easeIn' },
    ],
    onComplete: () => g.destroy(),
  });
}

// Taches de mousse lumineuse sur les troncs/le sol : la mousse est partout.
// Lot n°8 (A1-3) : chaque tache est [x, y, r, kind?, flipX?] ; `kind` =
// 'sol' | 'petite' | 'tronc' | 'plafond' (par défaut : 'petite' si r < 20,
// sinon 'sol') choisit `decor_mousse_lumineuse_<kind>`, large d'environ
// 2,6·r (le tronc garde 0,2 : il épouse la face d'un mur, pas une tache).
// Sol et petite : posées par le bas visible sur la surface de marche la plus
// proche de `y` (+ 2 px, enfoncées dans l'herbe) ; tronc : centrée sur
// (x, y) ; plafond : pendue par son bord haut en y. Sans l'image : le dessin
// d'avant, au même endroit.
const ACTE1_MOSS_DECOR_WIDTH = { sol: 287, petite: 149, plafond: 318 };
function acte1DrawMossDecor(scene, spots) {
  for (const [x, y, r, kindIn, flipX] of spots) {
    const kind = kindIn || (r < 20 ? 'petite' : 'sol');
    const key = `item-decor_mousse_lumineuse_${kind}`;
    const rnd = new Phaser.Math.RandomDataGenerator([`decor${x},${y}`]);
    if (scene.textures.exists(key)) {
      const img = scene.add.image(x, y, key).setFlipX(!!flipX);
      const srcW = ACTE1_MOSS_DECOR_WIDTH[kind];
      img.setScale(srcW ? (2.6 * r) / srcW : 0.2);
      if (kind === 'tronc') {
        img.setOrigin(0.5, 0.5);
      } else if (kind === 'plafond') {
        img.setOrigin(0.5, 0);
      } else {
        img.setOrigin(0.5, 1);
        setVisibleBottomY(img, storyStandY(scene, x, y) + 2);
      }
      storyPutBehindPlayer(scene, img);
      scene.tweens.add({ targets: img, alpha: 0.7, duration: rnd.between(1400, 2200), yoyo: true, repeat: -1 });
      continue;
    }
    const g = scene.add.graphics({ x, y });
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
    // Lot n°8 (A1-3, PLAN_INTEGRATION_LOT_8 §5) : mousse collée aux deux
    // faces exposées du mur de racines (x 2688 et 2816, bord plat contre la
    // racine) et pendue sous lui, au-dessus de l'amas ; au sol, des taches
    // qui évitent la souche aux champignons (2925), le bord du tronc couché
    // (664) et les champignons lumineux (3775). Plus aucune tache en l'air.
    acte1DrawMossDecor(scene, [
      [2672, 192, 20, 'tronc', true], [2832, 192, 20, 'tronc'], [2730, 254, 22, 'plafond'],
      [2925, 448, 30], [3150, 448, 24], [3420, 448, 34],
      [664, 448, 14], [1900, 448, 18], [3775, 448, 18],
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
      // Toutes les 4 s, cela faisait un toast de plus à chaque essai raté
      // (« coupe le jeu ») : le texte n'est dit qu'une fois, ensuite la
      // lueur du talisman suffit.
      st.nextRefill = scene.time.now + 4000;
      acte1FillEnergy(scene);
      acte1TalismanGlow(scene);
      if (!st.refillToldOnce) {
        st.refillToldOnce = true;
        showToast(scene, 'Le talisman pulse : ta force revient. [A]', 2200);
      }
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

// (Les empreintes de boue se voient : le déclencheur reste, sans texte.)
CUTSCENES.fs2_empreintes = () => [];

CUTSCENES.fs2_ravin = cutsceneBulles([
  'Trop large pour deux jambes. Le totem du loup, sur la butte : touche-le.',
], { text: '[E] devant le totem', ms: 3200 });

// Juste après le totem (sa bannière occupe l'écran ~2,6 s) : bulles ensuite.
CUTSCENES.fs2_loup = cutsceneBulles([
  'Cours, et saute au tout dernier moment.',
// Maj tenue = loup, même à l'arrêt (2026-11-09) : de quoi chercher les pistes.
], { text: "[Maj] tenue : loup, même à l'arrêt · avance pour courir", ms: 4200 }, 2600);

CUTSCENES.fs2_ravin_large = cutsceneBulles([
  'Trop grand ? Tiens [Maj] : en loup, tu verras des pistes que personne ne voit.',
]);

CUTSCENES.fs2_plante = [
  // Révélation (la plante qui repousse la mousse) : dialogue bloquant court.
  { camera: { x: FS2_PLANTE.x + 60, y: 230, ms: 900 } },
  { say: [
    { who: 'agarica', text: 'Une fleur, là-haut… et pas un brin de mousse autour !' },
  ] },
  { set: { planteVue: true } },
  { say: [
    { who: 'xara', text: "La mousse l'évite. Il en pousse sûrement plus haut, là où il faut des ailes." },
  ] },
  { cameraFollow: true },
];

CUTSCENES.fs2_mur = cutsceneBulles((scene) => {
  if (storyGet(FS2_MUR_FLAG)) return [];
  if (inventoryHas('repulsif')) {
    showToast(scene, '[E] devant le mur : verser le répulsif', 3200);
    return [];
  }
  return [
    "Ce mur de mousse est vivant. Les coups n'y feront rien, il faudra autre chose.",
  ];
});

// Arrivée par le vieux sentier de la hutte (acte 2) : on est DANS la poche.
CUTSCENES.fs2_arrivee_poche = cutsceneBulles([
  'La mousse a muré la sortie. Verse le répulsif dessus.',
], null, 1700);

CUTSCENES.fs2_coeur = [
  { say: [
    { who: 'agarica', text: "Une graine de chêne-cœur ! Orme disait qu'il n'en restait plus." },
  ] },
];

// L'arbre géant se voit au loin : seule l'aide de direction reste.
CUTSCENES.fs2_grand_arbre = cutsceneBulles([], 'Les racines du grand arbre →');

// Mare préservée (décor pur, pas de clé `water`) : eau sous un vieux pont de
// bois ; les trois poissons (clé `animals`, profondeur 4) nagent entre les deux couches.
// Lot n°8 (A1-1) : chaque élément prend son image s'il l'a, sinon garde son
// dessin d'avant (élément par élément). Aucun corps physique : on marche
// sur le sol solide, sous le pont.
//   eau    : fond `liquide_mare_fond` (profondeur 3) à l'échelle k = 88/140
//            (une seule rangée de tuile jusqu'au bas de l'écran), voile
//            `liquide_mare_voile` (5) translucide qui respire et dérive,
//            ligne de surface `liquide_mare_surface_0..3` (5) animée à 8 i/s,
//            sa ligne claire (rangées 26-31) juste sous le tronc ;
//   berges : `decor_mare_berge` (4,5 : devant les poissons, derrière le
//            voile), hors du tween d'alpha ; rive droite en miroir ;
//   roseaux: `decor_mare_roseaux` (6,5 : DEVANT le pont, sinon cachés à 80 %,
//            mais derrière les personnages, profondeur 10) ;
//   pont   : `decor_pont_tronc` étiré en (w + 44) x 26 (R2 : à ses
//            proportions, le fût ne fait que 8 px et se lit comme une
//            branche), le dessus du fût (rangée 34/90) sur la marche.
const FS2_MARE_SURFACE_FRAMES = ['liquide_mare_surface_0', 'liquide_mare_surface_1', 'liquide_mare_surface_2', 'liquide_mare_surface_3'];
function acte1Fs2DrawMare(scene) {
  const { x, w, y } = FS2_MARE;
  const H = 540 - y;
  const has = (id) => scene.textures.exists(`item-${id}`);
  const breathing = [];
  // Eau.
  if (has('liquide_mare_fond')) {
    const k = H / 140;
    scene.add.tileSprite(x, y, w, H, 'item-liquide_mare_fond').setOrigin(0, 0).setTileScale(k, k).setDepth(3);
    if (has('liquide_mare_voile')) {
      const veil = scene.add.tileSprite(x, y, w, H, 'item-liquide_mare_voile').setOrigin(0, 0).setTileScale(k, k)
        .setDepth(5).setAlpha(0.3);
      scene.tweens.add({ targets: veil, alpha: 0.2, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      scene.tweens.add({ targets: veil, tilePositionX: { from: 0, to: -1536 }, duration: 45000, repeat: -1 });
    }
    const frames = FS2_MARE_SURFACE_FRAMES.filter(has);
    if (frames.length) {
      const line = scene.add.tileSprite(x, y + 8 - 26 * k, w, 35 * k, `item-${frames[0]}`).setOrigin(0, 0)
        .setTileScale(k, k).setDepth(5);
      let fi = 0;
      scene.time.addEvent({
        delay: 125, loop: true,
        callback: () => { if (!line.active) return; fi = (fi + 1) % frames.length; line.setTexture(`item-${frames[fi]}`); },
      });
    }
  } else {
    const back = scene.add.graphics().setDepth(3);
    back.fillStyle(0x0d2a3a, 1).fillRect(x, y, w, H);
    back.fillStyle(0x1c5f6e, 0.8).fillRect(x + 6, y + 4, w - 12, H - 4);
    const front = scene.add.graphics().setDepth(5);
    front.fillStyle(0x9fe6e0, 0.18).fillRect(x, y, w, H);
    front.fillStyle(0xbff6ef, 0.7).fillRect(x, y, w, 3);
    breathing.push(front);
  }
  // Berges et roseaux.
  const bergeArt = has('decor_mare_berge');
  const roseauArt = has('decor_mare_roseaux');
  if (bergeArt) {
    addItemImage(scene, x + 14, y + 10, 'decor_mare_berge', { origin: [1, 1] }).setDepth(4.5);
    addItemImage(scene, x + w - 14, y + 10, 'decor_mare_berge', { origin: [0, 1] }).setFlipX(true).setDepth(4.5);
  }
  if (roseauArt) {
    addItemImage(scene, x + 6, y + 5, 'decor_mare_roseaux', { origin: [0.5, 1] }).setDepth(6.5);
    addItemImage(scene, x + w - 6, y + 5, 'decor_mare_roseaux', { origin: [0.5, 1] }).setFlipX(true).setDepth(6.5);
  }
  if (!bergeArt || !roseauArt) {
    // Roseaux et pierres des berges dessinés (ceux dont l'image manque).
    const banks = scene.add.graphics().setDepth(5);
    for (const [bx, s] of [[x - 6, -1], [x + w + 6, 1]]) {
      if (!bergeArt) banks.fillStyle(0x3a3550, 1).fillEllipse(bx, y + 4, 26, 14);
      if (!roseauArt) {
        banks.fillStyle(0x2d6b3a, 1);
        for (let i = 0; i < 4; i++) banks.fillRect(bx + s * (6 + i * 5), y - 26 + i * 4, 3, 30 - i * 4);
      }
    }
    breathing.push(banks);
  }
  if (breathing.length) scene.tweens.add({ targets: breathing, alpha: 0.75, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  // Le pont : un tronc couché (on marche dessus, le sol solide est dessous).
  if (has('decor_pont_tronc')) {
    const cx = x + w / 2;
    scene.add.image(cx, storyStandY(scene, cx, 448) - 2, 'item-decor_pont_tronc')
      .setOrigin(0.5, 34 / 90).setDisplaySize(w + 44, 26).setDepth(6);
    return;
  }
  const log = scene.add.graphics().setDepth(6);
  log.fillStyle(0x3b2a20, 1).fillRoundedRect(x - 20, y - 8, w + 40, 16, 7);
  log.fillStyle(0x5a4030, 1).fillRoundedRect(x - 16, y - 7, w + 32, 5, 3);
  log.fillStyle(0x2a1d16, 1).fillCircle(x - 14, y, 7).fillCircle(x + w + 14, y, 7);
}

// La plante qui repousse la mousse, sur sa haute branche (case gy 1), avec
// un halo doux et une lueur qui bat lentement. (L'ancien tronc d'arbre mort
// dessiné par code, un pilier sombre, a été retiré : il faisait placeholder.)
// Lot n°8 (A1-5, H9) : la plante résistante peinte, réduite à 0,1 (blanche,
// 5 pétales) -- la MÊME plante que celle de la clairière (acte 2), pour que
// le joueur la reconnaisse quand il la retrouve ; `decor_fleur_perchee` en
// second choix. Posée par le bas visible (+3 px dans l'herbe de la branche),
// même balancement autour du pied. Halo peint de 150 px recentré sur la
// fleur, tween relatif. Repli : halo et fleur dessinés.
const FS2_PLANTE_ART = [['decor_plante_resistante_fleurie', 0.1], ['decor_fleur_perchee', null]];
function acte1Fs2DrawPlante(scene) {
  const { x, y } = FS2_PLANTE;
  // Alpha 0,26 (0,2 au plan) : à 0,2, au creux de la respiration, le halo
  // ne se voyait plus sur la frondaison claire derrière la branche.
  const halo = acte1HaloImage(scene, x, y - 32, 150, 0xffe9f5, 0.26);
  if (halo) {
    scene.tweens.add({ targets: halo, scaleX: halo.__base * 1.25, scaleY: halo.__base * 1.25, alpha: 0.1, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  } else {
    const disc = scene.add.circle(x, y - 26, 46, 0xffe9f5, 0.12).setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({ targets: disc, scale: 1.25, alpha: 0.05, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
  const art = FS2_PLANTE_ART.find(([id]) => scene.textures.exists(`item-${id}`));
  if (art) {
    const img = addItemImage(scene, x, y, art[0], { origin: [0.5, 1] });
    if (art[1]) img.setScale(art[1]);
    setVisibleBottomY(img, y + 3);
    scene.tweens.add({ targets: img, angle: 3, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return;
  }
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

// Empreintes boueuses du sentier de chasse (toujours visibles ; les pistes
// lumineuses `tracks` ne se voient, elles, qu'en forme de loup).
// Lot n°8 (A1-4, R4) : `decor_empreinte_boue`, livrée en vue de dessus,
// écrasée à 0,5 en Y (21x6 px, vue rasante) et centrée 2-3 px sous la
// surface de marche RÉELLE sous chaque x (avant : toutes à y fixe, donc
// dans le vide ou sur la face des marches). Une empreinte au bord d'une
// marche (sol différent à ± 8 px) ou au pied du totem est sautée. Les pistes
// `tracks` ne changent pas. Repli : le dessin d'avant.
const FS2_MUD_PRINT_SKIP = [{ x: FS2_TOTEM.x, r: 40 }];
function acte1Fs2DrawMudPrints(scene, x0, x1, y) {
  if (scene.textures.exists('item-decor_empreinte_boue')) {
    const s = (getItemManifest().decor_empreinte_boue || {}).scale || 0.08;
    for (let x = x0, i = 0; x < x1; x += 46, i++) {
      const sy = storyStandY(scene, x, y);
      if (storyStandY(scene, x - 8, y) !== sy || storyStandY(scene, x + 8, y) !== sy) continue;
      if (FS2_MUD_PRINT_SKIP.some((k) => Math.abs(x - k.x) < k.r)) continue;
      const img = addItemImage(scene, x, sy + 2 + (i % 2), 'decor_empreinte_boue');
      img.setScale(s, s * 0.5).setAlpha(0.85);
      storyPutBehindPlayer(scene, img);
    }
    return;
  }
  const g = scene.add.graphics();
  for (let x = x0, i = 0; x < x1; x += 46, i++) {
    const py = y - 3 + (i % 2 ? 3 : 0);
    g.fillStyle(0x140e20, 0.55).fillEllipse(x, py, 13, 6);
    for (let k = 0; k < 3; k++) g.fillCircle(x + 7, py - 4 + k * 4, 2);
  }
  storyPutBehindPlayer(scene, g);
}

// Lot n°8 (A1-6) : graine peinte `objet_graine_coeur` (27x22 px) et halo
// peint ; mêmes tweens (le halo en échelle relative). Halo de 80 px à 0,35
// (plan : 64 px à 0,2, qui portait trois fois moins de lumière que le disque
// dessiné : la graine perdait son éclat de secret). Repli : le cœur et le
// disque dessinés. Le ramassage ne change pas.
function acte1Fs2DrawCoeur(scene) {
  const { x, y } = FS2_COEUR;
  const halo = acte1HaloImage(scene, x, y, 80, 0xff9fc9, 0.35);
  const glow = halo || scene.add.circle(x, y, 26, 0xff9fc9, 0.2).setBlendMode(Phaser.BlendModes.ADD);
  let g;
  if (scene.textures.exists('item-objet_graine_coeur')) {
    g = addItemImage(scene, x, y, 'objet_graine_coeur');
  } else {
    g = scene.add.graphics({ x, y });
    g.fillStyle(0xff6fa8, 1).fillCircle(-6, -3, 8).fillCircle(6, -3, 8).fillTriangle(-13, 0, 13, 0, 0, 15);
    g.fillStyle(0xffd0e4, 1).fillCircle(-7, -6, 3);
  }
  scene.tweens.add({ targets: [g, glow], y: y - 8, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  if (halo) scene.tweens.add({ targets: halo, scaleX: halo.__base * 1.4, scaleY: halo.__base * 1.4, alpha: 0.14, duration: 900, yoyo: true, repeat: -1 });
  else scene.tweens.add({ targets: glow, scale: 1.4, alpha: 0.08, duration: 900, yoyo: true, repeat: -1 });
  storyPutBehindPlayer(scene, glow);
  storyPutBehindPlayer(scene, g);
  return { g, glow };
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
  acte1Particles(scene, FS2_COEUR.x, FS2_COEUR.y, { count: 14, colors: [0xff9fc9, 0xffe9f5], spread: 50, rise: 60, fx: ACTE1_FX_GRAINE });
  // Icône de la bannière : la graine peinte (sans elle, pas d'icône, comme avant).
  const itemId = scene.textures.exists('item-objet_graine_coeur') ? 'objet_graine_coeur' : null;
  showStoryBanner(scene, { kicker: 'Secret', title: 'Graine de chêne-cœur', desc: '+1 cœur maximum.', itemId, color: STORY_UI.pink });
  runCutscene(scene, [{ wait: 1400 }, { say: CUTSCENES.fs2_coeur[0].say }]);
}

ZONE_SCRIPTS.foret_sombre_2 = {
  create(scene) {
    const st = { hadWolf: !!storyGet('hasWolfForm'), coeurTaken: !!storyGet('coeurBonusForet'), coeur: null };
    scene.__acte1 = st;
    acte1Fs2DrawMudPrints(scene, 300, 1120, 448);
    acte1Fs2DrawMare(scene);
    acte1Fs2DrawPlante(scene);
    // (Le vieux sentier, au fond de la poche, est une sortie basse : sa lueur et
    // son panneau viennent des données de sortie, cf. addEdgeHints dans LevelKit.)
    // Lot n°8 (A1-3, §5) : sous le surplomb contre le mur de mousse (4280,
    // pendue ; remplace la tache qui flottait en 4300, 140), SUR le surplomb
    // (4900, refY 192 ; remplaçait 4900, 130), et au sol en évitant le
    // buisson épineux (2440). Jamais dans la poche secrète.
    acte1DrawMossDecor(scene, [[1700, 448, 22], [2440, 448, 26], [4280, 254, 22, 'plafond'], [4900, 192, 26], [5500, 448, 30]]);
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
