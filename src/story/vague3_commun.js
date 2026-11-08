// =============================================================================
// Vague 3 — enregistrements PARTAGÉS (pré-lot, 2026-11-08)
// =============================================================================
// Conception : docs/production/VAGUE3_DESIGN.md ; contrat : PLAN_DEV.md,
// « Vague 3 : zones facultatives ». Textes : docs/production/STYLE_DIALOGUES.md
// (court, parlé, une réplique = une info). Chargé après acte2.js / banc_essai.js
// et AVANT les trois fichiers des lots (vague3_sous_bois.js, vague3_hauteurs.js,
// vague3_marais.js), qui peuvent donc s'appuyer sur tout ce qui est ici.
// Contenu :
//   1. Locuteurs (SPEAKERS) et objets (ITEM_INFO) de la vague 3.
//   2. Le marchand : Tamarin, vieux singe colporteur (boutique SHOPS.tamarin,
//      src/data/shops_data.js) -- répliques, rumeurs, loupe rendue, accessoires
//      de colporteur dessinés par code.
//   3. Cassables conditionnels (`requires` / `forbids` sur un `breakables`).
//   4. Les bulles de Xara posées dans les zones EXISTANTES (§ 6.1).
// Les lots n'éditent pas ce fichier : un besoin partagé se signale dans le rapport.

// ---------------------------------------------------------------------------
// 1. Locuteurs et objets
// ---------------------------------------------------------------------------
// Portrait : `item-portrait_<id>` dès que l'art existe (prompt Codex n°13),
// sinon le médaillon de couleur.
Object.assign(SPEAKERS, {
  tamarin: { name: 'Tamarin', color: 0xd8b26e },
  tika: { name: 'Tika', color: 0xe0a060 },
  pepin: { name: 'Pépin', color: 0xf0c27a },
  ecaille: { name: 'Dame Écaille', color: 0x9fc48a },
});

// Objets de quête (inventaire, ramassables, bannière « Objet obtenu »). Les trois
// fleurs ont trois ids (un ramassable par lieu) et une seule image (`fleur_lune`).
const V3_FLEUR_LUNE_INFO = { name: 'Fleur de lune', desc: 'Elle brille même en plein jour.' };
Object.assign(ITEM_INFO, {
  pepin_sac: { name: 'Pépin (dans ton sac)', desc: 'Il gigote et il chantonne.' },
  loupe_tamarin: { name: 'Loupe de Tamarin', desc: 'Pour compter les éclats de lune. Pépin dit qu\'il l\'a trouvée.' },
  corde_tressee: { name: 'Corde tressée', desc: 'Assez longue pour sortir quelqu\'un d\'un trou.' },
  fleur_lune_marais: { ...V3_FLEUR_LUNE_INFO },
  fleur_lune_cercle: { ...V3_FLEUR_LUNE_INFO },
  fleur_lune_gardien: { ...V3_FLEUR_LUNE_INFO },
});

// ---------------------------------------------------------------------------
// 2. Le marchand : Tamarin, vieux singe colporteur
// ---------------------------------------------------------------------------
// Un ancien du peuple de Kainati, radoteur et un peu filou. Il ne grimpe plus,
// il se PERCHE : on ne le trouve qu'au bout des lianes. Ses rumeurs sont de
// vrais indices.
//
// Où (un drapeau : `marchandVu`, posé à la fin de la rencontre) :
//   - Racines du grand arbre : corniche de la cime, au bout des deux lianes qui
//     suivent le totem du singe, dans un nid (rencontre, sans condition).
//   - Perchoirs des lots, qui n'apparaissent qu'avec `requires: { marchandVu: true }` :
//     cime cachée (lot B), grotte de la lisière (lot A), racines suspendues (lot C).
//
// LIGNE DE DONNÉES À COPIER (clé `npcs` de la zone ; `x` et le perchoir au choix
// du lot, toujours au bout de lianes) :
//   { id: 'tamarin', sprite: 'singe_gueri', x: 1234, onProp: 'grand_arbre_nid_singe', facing: 'left',
//     shop: 'tamarin', talk: 'v3_tamarin', requires: { marchandVu: true } },
// avec son nid dans `props` (facultatif ; sans `onProp`, il se pose sur le sol) :
//   { type: 'grand_arbre_nid_singe', x: 1234, y: <surface>, scale: 0.26 },
// E : sa réplique (CUTSCENES.v3_tamarin, choisie selon l'état), puis la boutique.
const V3_MARCHAND_ID = 'tamarin';
const V3_MARCHAND_SHOP = 'tamarin';
const V3_MARCHAND_FLAG = 'marchandVu';
// Variante dessinée du singe (prompt Codex n°13, `tamarin` au manifeste) : prise
// à la place de `singe_gueri` dès qu'elle existe (sans les accessoires de code).
const V3_MARCHAND_ART = 'tamarin';

DIALOGUES.v3_tamarin_rencontre = [
  { who: 'tamarin', text: 'Une cliente ! Tamarin, colporteur. J\'ai connu Kainati tout petit.' },
  { who: 'tamarin', text: 'Tes éclats de lune contre mes baies. Ça te va ?' },
  { who: 'tamarin', text: 'Je ne grimpe plus, je me perche. Cherche-moi au bout des lianes.' },
];
// Rencontre avant le combat (la corniche des racines mène à l'arène).
const V3_TAMARIN_AVANT_KAINATI = { who: 'tamarin', text: 'Tu montes voir Kainati ? Prends des baies, il est grognon.' };
const V3_TAMARIN_XARA = { who: 'xara', text: 'Il a l\'air honnête. Pour un singe.', bubble: true };

// Quand il n'a plus de rumeur à donner (une phrase, à tour de rôle).
const V3_TAMARIN_ACCUEIL = [
  'Approche ! Tout est garanti. Enfin, presque.',
  'Encore toi ! Tu as grimpé jusqu\'ici pour mes baies ?',
  'Les amulettes arrivent bientôt. Les baies, elles, sont là.',
];
// Quête de Geralt (lot A, QUESTS.geralt_corde, étape `demande`) : la corde est en vente.
const V3_TAMARIN_CORDE = 'Une corde ? Pour un ranger coincé dans un trou ? Ha ! Trente éclats.';

// Rumeurs = vrais indices (§ 4 du document) : une par visite, à tour de rôle
// (`marchandRumeur`), en sautant celles dont la zone est déjà visitée.
const V3_RUMEURS = [
  { zone: 'grotte_lisiere', text: 'Sous le tronc couché de la forêt sombre, des lianes pendent. Et le bois est pourri.' },
  { zone: 'galeries_racines', text: 'Il y a un trou entre les racines, au pied de l\'arbre. Ça sent le loup mouillé.' },
  { zone: null, text: 'Un mur qui sonne creux, tape dedans. Un rocher fendu, c\'est un travail d\'ours.' },
  { zone: 'cime_cachee', text: 'Mon village est au-dessus de l\'arène. On y monte par des traces de loup.' },
  { zone: 'ile_des_vents', text: 'Un vent monte entre les premières îles. Un oiseau s\'en servirait. Moi, je regarde.' },
  { zone: 'marais_brumes', text: 'Sous la clairière de la plante, il y a un marais. Et une tortue très, très lente.' },
  { zone: 'cercle_lune', text: 'Un cercle de pierres, au-dessus de la forêt sombre. On y monte par la trouée du surplomb.' },
  { zone: 'racines_suspendues', text: 'Sous les îles, des racines pendent dans le vide. Les corbeaux y cachent un trésor.' },
  { zone: 'ile_du_gardien', text: 'Au belvédère, un courant d\'air monte vers de vieilles ruines.' },
];
const V3_RUMEUR_FIN = 'J\'ai tout dit. Repasse demain, je radoterai.';

// Prochaine rumeur (et avance le tour) ; null quand tout est déjà visité.
function v3NextRumeur() {
  const n = V3_RUMEURS.length;
  const start = Number.isFinite(storyGet('marchandRumeur')) ? storyGet('marchandRumeur') : 0;
  for (let k = 0; k < n; k++) {
    const i = (start + k) % n;
    const r = V3_RUMEURS[i];
    if (r.zone && storyGet(`visited_${r.zone}`)) continue;
    storySet('marchandRumeur', (i + 1) % n);
    return r.text;
  }
  return null;
}

// Loupe volée par Pépin (quête 1, lot B) : rendue au marchand, +15 éclats.
// Le lot B donne `loupe_tamarin` avec `pepin_sac` (réplique V3_PEPIN_LOUPE) ;
// le retour vit ici (drapeau `loupeRendue`), dans n'importe quel perchoir.
DIALOGUES.v3_tamarin_loupe = [
  { who: 'agarica', text: 'Pépin avait ta loupe. Il dit qu\'il l\'a trouvée.' },
  { who: 'tamarin', text: 'Ma loupe ! Sans elle, je confonds éclats et cailloux. Tiens, pour ta peine.' },
];
// Réplique de Pépin (lot B, sur l'île des vents) quand il donne la loupe.
const V3_PEPIN_LOUPE = { who: 'pepin', text: 'Et ça, c\'est un trésor ! Je l\'ai trouvé à côté d\'un vieux singe qui ronflait.' };

// `talk` du marchand (cinématique-fonction : relue à chaque appui sur E). Elle
// n'a pas d'étape `{shop}` : la boutique s'ouvre d'elle-même après (PNJ `shop`).
// Une seule réplique par visite : la corde, sinon une rumeur, sinon un bonjour.
CUTSCENES.v3_tamarin = () => {
  if (!storyGet(V3_MARCHAND_FLAG)) {
    const lines = [...DIALOGUES.v3_tamarin_rencontre];
    if (!storyGet('kainatiDefeated')) lines.push(V3_TAMARIN_AVANT_KAINATI);
    lines.push(V3_TAMARIN_XARA);
    return [{ say: lines }, { set: { [V3_MARCHAND_FLAG]: true } }];
  }
  if (inventoryHas('loupe_tamarin')) {
    return [
      { say: 'v3_tamarin_loupe' },
      { take: 'loupe_tamarin' },
      { set: { loupeRendue: true } },
      { reward: { eclats: 15 } },
    ];
  }
  const corde = typeof questCurrentStep === 'function' && questCurrentStep('geralt_corde') === 'demande' && !inventoryHas('corde_tressee');
  let text = corde ? V3_TAMARIN_CORDE : v3NextRumeur();
  if (!text) {
    const visits = (storyGet('marchandVisites') || 0) + 1;
    storySet('marchandVisites', visits);
    text = visits > V3_TAMARIN_ACCUEIL.length ? V3_RUMEUR_FIN : V3_TAMARIN_ACCUEIL[visits - 1];
  }
  return [{ say: [{ who: 'tamarin', text }] }];
};

// Appel du marchand à la première arrivée sur son perchoir des racines (bulle,
// ne gèle rien) : on le voit, on va lui parler (E).
CUTSCENES.v3_tamarin_appel = cutsceneBulles([
  { who: 'tamarin', text: 'Psst ! Par ici, la grimpeuse !' },
]);

// Art : la variante `tamarin` si elle existe ; sinon `singe_gueri` (même
// échelle) et ses accessoires de colporteur dessinés par code (baluchon de toile
// sur le côté, lanterne à éclat de lune sur un bâton planté à côté de lui).
const V3_NPCS_HANDLER = LEVEL_DATA_HANDLERS.npcs;
LEVEL_DATA_HANDLERS.npcs = (scene, list, data) => {
  const art = typeof hasManifestArt === 'function' && hasManifestArt(scene, V3_MARCHAND_ART);
  const out = (list || []).map((n) => (n && n.id === V3_MARCHAND_ID && art ? { ...n, sprite: V3_MARCHAND_ART } : n));
  V3_NPCS_HANDLER(scene, out, data);
  const npc = scene.npcs && scene.npcs[V3_MARCHAND_ID];
  if (npc && !art) v3MarchandAccessoires(scene, npc);
};

function v3MarchandAccessoires(scene, npc) {
  if (npc.__v3Accessoires) return;
  const c = scene.add.container(npc.x, npc.y);
  const g = scene.add.graphics();
  // Baluchon de toile rapiécée, posé derrière lui (côté opposé au regard initial).
  g.fillStyle(0x8a6a3e, 1).lineStyle(2, 0x2a1a12, 1);
  g.fillRoundedRect(-36, -20, 20, 20, 6).strokeRoundedRect(-36, -20, 20, 20, 6);
  g.fillStyle(0xb08a52, 1).fillRect(-30, -14, 7, 6);          // pièce cousue
  g.lineStyle(2, 0x5a3a20, 1).lineBetween(-33, -19, -20, -22); // nœud du baluchon
  // Bâton planté et lanterne à éclat de lune.
  g.lineStyle(3, 0x4a2e18, 1).lineBetween(26, 0, 26, -46);
  g.lineStyle(2, 0x4a2e18, 1).lineBetween(26, -46, 36, -46);
  g.lineStyle(1.5, 0x2a1a12, 1).lineBetween(36, -46, 36, -40);
  g.fillStyle(0x2a1f45, 1).fillRoundedRect(31, -40, 10, 13, 2);
  g.fillStyle(0xbfe8ff, 1).fillRect(33, -37, 6, 7);
  // Deux éclats « en vitrine » au pied du baluchon.
  g.fillStyle(0xe8f6ff, 1).fillTriangle(-14, 0, -11, -9, -8, 0).fillTriangle(-8, 0, -5, -6, -2, 0);
  const halo = scene.add.circle(36, -34, 13, 0xbfe8ff, 0.28).setBlendMode(Phaser.BlendModes.ADD);
  c.add([g, halo]);
  c.setDepth(npc.depth);
  if (scene.children.moveBelow) scene.children.moveBelow(c, npc);
  scene.tweens.add({ targets: halo, alpha: 0.12, scale: 0.8, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  npc.__v3Accessoires = c;
  // Suit le PNJ (il se tourne vers Agarica) ; disparaît avec lui.
  const follow = () => {
    if (!npc.active || !c.active) { scene.events.off('update', follow); if (c.active) c.destroy(); return; }
    c.setPosition(npc.x, npc.y);
    c.setVisible(npc.visible);
  };
  scene.events.on('update', follow);
}

// ---------------------------------------------------------------------------
// 3. Cassables conditionnels
// ---------------------------------------------------------------------------
// `breakables: [{ …, requires?, forbids? }]` (vague 3) : hors condition, le
// cassable n'existe pas et ses cases (peintes en sol) restent un sol ordinaire,
// sans indice. Sert au bouchon du gouffre de la forêt sombre 1, cassable
// seulement avec le singe : avant, on ne peut pas y tomber par erreur.
// SecretKit prépare les cassables avant le rendu du sol (secretPrepareGroundCells,
// appelée par buildLevelFromData) : on lui passe la liste filtrée.
if (typeof secretPrepareGroundCells === 'function') {
  const v3PrepareGround = secretPrepareGroundCells;
  secretPrepareGroundCells = (scene, data, cells) => {
    const list = Array.isArray(data && data.breakables) ? data.breakables : [];
    if (!list.some((b) => b && (b.requires || b.forbids))) return v3PrepareGround(scene, data, cells);
    return v3PrepareGround(scene, { ...data, breakables: list.filter((b) => storyAllowed(b)) }, cells);
  };
}

// ---------------------------------------------------------------------------
// 4. Bulles de Xara dans les zones existantes (déclencheurs `triggers`, § 6.1)
// ---------------------------------------------------------------------------
// Une bulle = un indice : le joueur comprend qu'il reviendra, ou comment passer.
// Forêt sombre 1 : le gouffre aux lianes, sous le tronc couché.
CUTSCENES.v3_fs1_gouffre = cutsceneBulles([
  'Des lianes sous le tronc. Sans bras de singe, oublie.',
]);
CUTSCENES.v3_fs1_gouffre_singe = cutsceneBulles([
  'Ce bois est pourri. Casse-le à l\'ours et descends aux lianes.',
], { text: '[A] : ours. En tombant, [Espace] deux fois : tu deviens singe et tu t\'accroches.', ms: 4500 });
// Forêt sombre 2 : la trouée au-dessus du surplomb (-> cercle de lune).
CUTSCENES.v3_fs2_trouee = cutsceneBulles([
  'Trop haut pour toi. Pour l\'instant.',
]);
CUTSCENES.v3_fs2_trouee_saut = cutsceneBulles([
  'La trouée, là-haut ! Avec un second saut, ça passe.',
]);
// Racines : le trou entre les racines (-> galeries).
CUTSCENES.v3_racines_trou = cutsceneBulles([
  'Ce trou descend loin. Et ça sent le loup.',
]);
// Arène de Kainati, après la victoire : les traces qui montent (-> cime cachée).
CUTSCENES.v3_arene_traces = cutsceneBulles([
  'Des traces qui montent dans le vide. Ton nez de loup verrait mieux.',
]);
// Chemin des hauteurs : le courant du belvédère (-> île du gardien).
CUTSCENES.v3_ff1_vent = cutsceneBulles([
  'Ce courant monte vers des ruines. Il faudrait des ailes.',
]);
CUTSCENES.v3_ff1_vent_aigle = cutsceneBulles([
  'Ce courant monte vers des ruines. Plane dedans !',
]);
// Îles flottantes : le vent du début, avec l'aigle (-> île des vents), et le
// grand vide de la rampe d'envol (retour des joueurs : on n'y pense pas).
CUTSCENES.v3_ff2_vent = cutsceneBulles([
  'Le vent du début monte jusqu\'au ciel. Plane dedans !',
]);
CUTSCENES.v3_ff2_trou = cutsceneBulles([
  'Trop loin pour sauter. Saute, puis [Espace] en l\'air : tu planes.',
]);
// Clairière : le bouchon de terre (-> marais) et le bord effondré (-> racines suspendues).
CUTSCENES.v3_clairiere_bouchon = cutsceneBulles([
  'La terre est molle ici, et ça clapote dessous. Un coup d\'ours ?',
]);
CUTSCENES.v3_clairiere_bord = cutsceneBulles([
  'Si tu rates ton envol, il y a des racines en dessous. Pas de panique.',
]);
// Forêt corrompue : le sol creux (-> nid des cocons) et la branche haute (-> canopée).
CUTSCENES.v3_fc1_sol = cutsceneBulles([
  'Le sol sonne creux. Et quelque chose bouge dessous.',
]);
CUTSCENES.v3_fc1_haut = cutsceneBulles([
  'Une trouée, en haut. Un second saut et tu y es.',
]);
