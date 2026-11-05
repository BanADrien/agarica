// Dialogues, cinématiques et scripts de zone de l'acte 2 — agent Acte 2.
//
// Zones (cf. docs/production/PLAN_DEV.md, progression 8 à 16) :
//   foret_flottante_1 (Geralt, duel comique, carte) → foret_flottante_2
//   (totem de poche, Amanite, totem de l'aigle, plané) → clairiere_plante
//   (fleur résistante) → hutte_morgat (répulsif, crash) → foret_corrompue_1
//   → arene_ghilt / trou_sombre (boss_ghilt.js : on ne fait ici que réécrire
//   ses dialogues) → bosquet_retour (fin, EndScreenScene).
// Les fichiers Scene restent le gabarit générique : tout passe par la donnée
// de zone (`script: 'acte2_…'`, `triggers`, `npcs`…) et les registres.
//
// Flags posés ici : geraltMet, amaniteMet, fleurPrelevee, morgatVue,
// crashDone, fc1Reveil, fc1MousseFermee, demoFinished (+ hasEagleForm par le
// totem, objets carte_geralt, totem_poche_casse, fleur_resistante, repulsif,
// note_geralt, et les flags automatiques trig_* / pickup_* / moss* de StoryKit).

// Mousse de la clairière préservée (retour utilisateur du 2026-10-25 : « la
// mousse horrible de la clairière préservée »). Le tapis dessiné d'avant, une
// rangée de grosses bosses vert sombre à points vert vif sur toute l'herbe,
// faisait lire la clairière comme ENVAHIE ; l'image du lot 8 prévue pour le
// remplacer (`decor_tapis_mousse`, bave vert citron à gouttes) aurait été
// aussi criarde. Le but : une clairière qui se lit PRÉSERVÉE, l'herbe des
// tuiles bien visible, la corruption seulement devinée vers les bords, sombre
// et sobre (silhouettes façon Hollow Knight), et rien autour du cercle sain.
// Trois variantes (cf. a2DrawMossCarpet), on garde la plus lisible :
//   'touffes' : quelques touffes et plaques de mousse du lot 8 teintées
//               presque noires, clairsemées, plus denses vers les deux bords
//               de la zone, absentes à moins de 150 px du cercle ;
//   'lisere'  : un liseré de mousse sombre très bas (10 px) au ras de
//               l'herbe, aux deux extrémités seulement, qui s'efface vers
//               le centre ;
//   'aucune'  : rien hors du cercle, seulement le contraste du cercle sain
//               et de sa colonne de lumière.
const CLAIRIERE_MOUSSE_VARIANTE = 'touffes';

// Le totem de poche est trouvé dans les ruines des îles flottantes (et non
// dans la hutte, comme le disait la description par défaut de StoryKit).
if (typeof ITEM_INFO !== 'undefined' && ITEM_INFO.totem_poche_casse) {
  ITEM_INFO.totem_poche_casse.desc = "Trouvé dans les ruines des îles flottantes. Fendu, éteint… Les papillons de Morgat tournent autour de lui.";
}

// ---------------------------------------------------------------------------
// Petits utilitaires communs à l'acte 2
// ---------------------------------------------------------------------------
function a2Wait(scene, ms) {
  return new Promise((resolve) => scene.time.delayedCall(Math.max(0, ms), resolve));
}

// Tween → promesse, résolue aussi si le tween est arrêté (jamais bloquée).
function a2Tween(scene, cfg) {
  return new Promise((resolve) => {
    const done = cfg.onComplete;
    scene.tweens.add({
      ...cfg,
      onComplete: (...a) => { if (done) done(...a); resolve(); },
      onStop: () => resolve(),
    });
  });
}

// Texte qui monte et s'efface au-dessus d'un personnage (annonces de Geralt…).
function a2Float(scene, x, y, text, color = '#ffe9f5', { size = 16, ms = 1400 } = {}) {
  const t = scene.add.text(x, y, text, {
    fontFamily: STORY_UI.serif, fontSize: `${size}px`, fontStyle: 'bold', color,
    stroke: '#15101f', strokeThickness: 4, align: 'center',
  }).setOrigin(0.5, 1).setDepth(1060);
  // Règle commune (LevelKit) : texte toujours dans l'écran (un PNJ au bord
  // de l'écran faisait sortir son annonce).
  if (typeof keepWorldUiInView === 'function') keepWorldUiInView(t);
  scene.tweens.add({ targets: t, y: y - 34, duration: ms, ease: 'Sine.easeOut' });
  scene.tweens.add({ targets: t, alpha: 0, delay: ms * 0.65, duration: ms * 0.35, onComplete: () => t.destroy() });
  return t;
}

// Murs invisibles (zones statiques pleine hauteur) : arène du duel, porte fermée.
// Chaque mur : un x (mur de 32 px centré sur x) ou { x, out } : épaissi à
// A2_WALL_THICK px vers l'extérieur (out = -1 : vers la gauche, +1 : vers la
// droite) sans bouger son bord intérieur (x ∓ 16). Pourquoi : au départ du
// sprint, la boîte du loup saute d'~40 px vers le mur ; elle chevauchait plus
// de la moitié d'un mur de 32 px et la physique la poussait DEHORS (sortie de
// l'arène en plein duel). Épais, le mur la renvoie toujours dedans.
const A2_WALL_THICK = 400;
function a2Walls(scene, xs) {
  const group = scene.physics.add.staticGroup();
  group.__a2Inner = [];
  for (const w of xs) {
    const spec = typeof w === 'number' ? { x: w } : w;
    const width = spec.out ? A2_WALL_THICK : 32;
    const cx = spec.out ? spec.x - spec.out * 16 + (spec.out * width) / 2 : spec.x;
    const z = scene.add.zone(cx, 0, width, 1400);
    scene.physics.add.existing(z, true);
    group.add(z);
    if (spec.out) group.__a2Inner.push({ edge: spec.x - spec.out * 16, out: spec.out });
  }
  // Le collider est gardé sur le groupe : le détruire AVANT le groupe (un
  // collider orphelin fait planter la physique au pas suivant).
  group.__a2Collider = scene.physics.add.collider(scene.player, group);
  return group;
}

// Garde-fou des murs épaissis (à appeler à chaque image) : la physique
// ignore un chevauchement plus grand que le déplacement de l'image ; si la
// boîte du loup s'enfonce d'un coup trop loin (départ du sprint collé au
// mur), elle traversait même un mur épais. Centre de la boîte passé de
// l'autre côté du bord intérieur : Agarica est remise de son côté.
function a2HoldWalls(scene, group) {
  const p = scene.player;
  if (!group || !group.__a2Inner || !p || !p.body) return;
  for (const { edge, out } of group.__a2Inner) {
    const cx = p.body.center.x;
    if ((cx - edge) * out <= 0) continue;
    const tx = edge - out * (p.body.width / 2 + 2);
    p.body.reset(p.x + (tx - cx), p.y);
  }
}

function a2DestroyWalls(group) {
  if (!group) return;
  if (group.__a2Collider) { group.__a2Collider.destroy(); group.__a2Collider = null; }
  group.destroy(true);
}

// Halo additif doux (dégradé radial) pour la lumière, les fleurs, le totem.
// Halo peint `fx_halo_doux` du lot 8 s'il existe (dégradé radial refait à
// l'import, M04) : même quantité de lumière que le dégradé dessiné à taille
// égale (mesuré : rapport 1,03), donc pas d'agrandissement. Repli : le
// dégradé dessiné ci-dessous. Tous les tweens de ces halos sont en alpha ou
// en displayWidth/Height : indépendants de la taille de l'image.
function a2GlowTexture(scene) {
  if (scene.textures.exists('item-fx_halo_doux')) return 'item-fx_halo_doux';
  const key = 'a2-glow';
  if (scene.textures.exists(key)) return key;
  const tex = scene.textures.createCanvas(key, 128, 128);
  const ctx = tex.getContext();
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.4, 'rgba(255,255,255,0.4)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  tex.refresh();
  return key;
}

function a2Glow(scene, x, y, size, color, alpha, depth = 5) {
  return scene.add.image(x, y, a2GlowTexture(scene)).setDisplaySize(size, size).setTint(color)
    .setAlpha(alpha).setBlendMode(Phaser.BlendModes.ADD).setDepth(depth);
}

// Voile de ciel posé juste au-dessus du fond (derrière tout le reste) : tant
// que `fond_foret_flottante` n'existe pas, le ciel nocturne par défaut devient
// un ciel de jour. Renvoie le rectangle (alpha réglable par le script), ou
// null quand le fond de la zone est déjà une image peinte du manifest
// (texture `item-…`, pas le ciel nocturne `decor-plan4`) : le voile ne
// faisait alors que délaver `fond_foret_flottante` (clairière, hutte).
function a2SkyWash(scene, color, alpha) {
  const far = scene.__farBackground;
  const farKey = far && far.active && far.texture ? far.texture.key : '';
  if (farKey.startsWith('item-')) return null;
  const { width, height } = scene.scale;
  const rect = scene.add.rectangle(0, 0, width, height, color, alpha).setOrigin(0).setScrollFactor(0);
  const bg = scene.children.list.find((o) => o.type === 'TileSprite');
  if (bg) a2PlaceAbove(scene, rect, bg);
  return rect;
}

// Place `obj` juste au-dessus de `ref` dans la liste d'affichage. (Phaser
// `children.moveAbove` ne fait RIEN si `obj` est déjà plus haut que `ref`,
// n'importe où dans la liste : un objet créé après coup restait donc devant
// tout le décor, joueur compris.)
function a2PlaceAbove(scene, obj, ref) {
  const list = scene.children;
  const i = list.getIndex(ref);
  if (i < 0 || !obj) return;
  list.moveTo(obj, list.getIndex(obj) > i ? i + 1 : i);
}

// Devant les décors de la donnée (`props`), toujours derrière les personnages
// (plus profonds). storyPutBehindPlayer glisse un objet juste sous le joueur
// dans la liste d'affichage ; or le joueur est créé AVANT les décors
// (buildLevelFromData) puis se retrouve après eux : l'objet du script
// finissait derrière tous les décors (bête d'Amanite cachée par l'arbre de
// son île, mesuré : bête 224, arbre 230, joueur 295).
// Même profondeur que les décors : placé juste après le dernier d'entre eux
// (pas en fin de liste, devant ce qui a été créé ensuite). Sans décor :
// storyPutBehindPlayer.
function a2PutAboveProps(scene, obj) {
  const list = scene.children;
  let last = -1;
  for (const p of scene.props || []) last = Math.max(last, list.getIndex(p));
  if (last < 0) {
    storyPutBehindPlayer(scene, obj);
    return obj;
  }
  // moveTo retire l'objet avant de l'insérer : venant d'avant le dernier
  // décor, l'index de celui-ci a reculé d'un cran.
  list.moveTo(obj, list.getIndex(obj) < last ? last : last + 1);
  return obj;
}

// Plafond au bord haut de l'écran : la caméra de ces zones ne défile pas
// verticalement (pas de `tallLevel`), alors que le bond du singe ou l'aigle
// emmènerait Agarica jusqu'à 250-340 px plus haut, hors de l'écran. Le monde
// physique garde sa largeur et son bas, seul son haut est ramené à y = 0.
function a2Ceiling(scene) {
  const b = scene.physics.world.bounds;
  scene.physics.world.setBounds(b.x, 0, b.width, b.bottom);
}

// Interactions propres à l'acte 2 (plante, panneau) : invite « E : … » à
// portée, comme les PNJ de StoryKit. `cond()` faux → ignorée.
function a2InteractReset(scene) {
  scene.__a2Inter = [];
  scene.__a2Prompt = null;
}

function a2AddInteract(scene, it) {
  scene.__a2Inter.push(it);
}

function a2UpdateInteract(scene) {
  const player = scene.player;
  if (!scene.__a2Inter || !player) return;
  if (!scene.__a2Prompt || !scene.__a2Prompt.active) {
    // Invite peinte de StoryKit (pastille `ui_invite` + touche en bois, lot
    // 8) comme celles des PNJ ; sinon le Text d'avant. Même origine (bas,
    // centre) et même profondeur dans les deux cas.
    scene.__a2Prompt = (typeof createStoryPromptLabel === 'function'
      ? createStoryPromptLabel(scene, { depth: 1050, originY: 1 })
      : scene.add.text(0, 0, '', {
        fontFamily: 'sans-serif', fontSize: '13px', color: '#ffe9f5',
        backgroundColor: '#2a1f45', padding: { x: 6, y: 3 },
      }).setOrigin(0.5, 1).setDepth(1050)).setVisible(false);
    // Règle commune (LevelKit) : invite toujours dans l'écran (« E :
    // examiner la plante » et « E : lire le panneau » en sortaient) ;
    // ancre trop haute ramenée à hauteur de la tête d'Agarica.
    if (typeof keepWorldUiInView === 'function') keepWorldUiInView(scene.__a2Prompt, { prompt: true });
  }
  const prompt = scene.__a2Prompt;
  const best = scene.__a2Inter.find((it) => (!it.cond || it.cond())
    && Math.abs(player.x - it.x) < (it.range || 70) && Math.abs(player.y - it.y) < 110);
  if (!best) { prompt.setVisible(false); return; }
  const label = typeof best.label === 'function' ? best.label() : best.label;
  prompt.setText(label).setPosition(best.x, best.y - (best.h || 100)).setVisible(true);
  if (scene.time.now < (scene.__storyTalkCooldownUntil || 0)) return;
  if (!Phaser.Input.Keyboard.JustDown(player.interactKey)) return;
  prompt.setVisible(false);
  best.onUse(scene);
}

// Données de la visite (sceneData passé par goToScene / scene.start).
function a2EnterId(scene) {
  const d = scene.sys && scene.sys.settings && scene.sys.settings.data;
  return (d && d.enterId) || null;
}

function a2Npc(scene, key) {
  return scene.npcs && scene.npcs[key];
}

// ===========================================================================
// 8. FORÊT FLOTTANTE 1 — le chemin des hauteurs, Geralt et Clak
// ===========================================================================
Object.assign(DIALOGUES, {
  geralt_rencontre: [
    { who: 'geralt', text: 'HALTE ! Pas un pas de plus, porteuse de mousse !' },
    { who: 'agarica', text: 'Porteuse de… quoi ? Je ne porte rien du tout !' },
    { who: 'geralt', text: 'C\'est exactement ce que dirait quelqu\'un qui porte de la mousse. Ou qui vient voler mes notes.' },
    // Clak n'est PAS là avant l'invocation (demande utilisateur) : Geralt
    // parle de son totem absent, qui viendra au milieu du duel.
    { who: 'geralt', text: 'Geralt, ranger des marches boisées. Et gardien du Crabe Ancestral, mon totem. Tremble.' },
    { who: 'agarica', text: 'Je ne vois aucun crabe.' },
    { who: 'geralt', text: 'Il n\'est pas là. Il viendra quand je l\'appellerai. Prie pour que je n\'aie pas à l\'appeler.' },
    { who: 'geralt', text: 'En garde ! Un duel, et la vérité éclatera !' },
  ],
  geralt_rendu_victoire: [
    { who: 'geralt', text: 'Ouille… D\'accord, d\'accord ! Je me rends. Stratégiquement.' },
    { who: 'clak', text: 'Clac clac.' },
    { who: 'geralt', text: 'Il dit que tu te bats bien. Il dit beaucoup de bêtises.' },
    { who: 'geralt', text: 'Rien de cassé. Juste ma réputation : Clak la recollera.' },
  ],
  geralt_paix: [
    { who: 'xara', text: 'Ranger, vous cherchez l\'origine de la mousse. Elle aussi. Vous auriez pu commencer par là.' },
    { who: 'agarica', text: 'Je veux sauver la forêt. Et… pouvoir rentrer chez moi, un jour.' },
    { who: 'geralt', text: 'Alors on est dans la même galère, petite. Tiens. Ma carte.' },
  ],
  geralt_carte: [
    { who: 'geralt', text: 'Les traces de pinces, c\'est Clak. Mais regarde : la mousse ne s\'étale pas au hasard. Elle monte, vers les hauteurs.' },
    { who: 'geralt', text: 'Et elle pousse plus vite là où les bêtes sont malades. Comme si elle suivait la fièvre… ou l\'inverse.' },
    { who: 'agarica', text: 'Alors il faut monter. On y va ensemble ?' },
  ],
  geralt_essai: [
    { who: 'geralt', text: 'Bon. Va, Agarica. Je garde le camp, et je mettrai la carte à jour avec ce que tu rapporteras.' },
    { who: 'agarica', text: 'Merci, Geralt ! Je reviendrai tout te raconter.' },
  ],
  geralt_camp: [
    { who: 'geralt', text: 'Toujours en un seul morceau ? Bien. Ça me fait une alliée de plus et un point d\'interrogation de moins.' },
    { who: 'geralt', text: 'La mousse monte, petite. Toujours. Moi, je reste en bas à prendre des notes.' },
  ],
  clak_camp: [
    { who: 'clak', text: 'Clac.' },
    { who: 'agarica', text: '… Moi aussi, je t\'aime bien, Clak.' },
  ],
  ff1_vue: [
    { who: 'agarica', text: 'Oh… Xara, regarde ! Au-dessus des arbres… le ciel, en plein jour !' },
    { who: 'xara', text: 'Plus loin, des îles flottent : les anciens gardiens y vivaient.' },
    { who: 'agarica', text: 'Et là-bas, tout au loin… cette forêt presque noire.' },
    { who: 'xara', text: 'Le cœur de la mousse. Retiens bien la direction.' },
  ],
});

// Remarques d'arrivée : bulles (cf. storyBulles, acte1.js), plus de gel.
CUTSCENES.ff1_intro = cutsceneBulles([
  { who: 'agarica', text: 'Les branches montent si haut… On ne voit même plus le sol.' },
  'La forêt est trop grande pour la nettoyer coin par coin. Il faut remonter jusqu\'à sa source.',
  'Je connais un chemin, par les hauteurs. Grimpe, et garde les yeux ouverts.',
], null, 200);
// Au sommet de l'ascension (belvédère, y -896) : la caméra lève les yeux vers le ciel.
CUTSCENES.ff1_vue = [
  { camera: { x: 3360, y: -1000, ms: 1100 } },
  { say: 'ff1_vue' },
  { cameraFollow: true },
];

// Premier contact : Geralt bondit hors de son camp. La caméra se pose
// ensuite sur l'arène (un écran de large) pour tout le duel.
CUTSCENES.geralt_rencontre = (scene) => {
  const p = scene.player;
  const gx = Phaser.Math.Clamp(p.x + 240, GERALT_ARENA.minX + 200, GERALT_ARENA.maxX - 300);
  const midY = scene.cameras.main.midPoint.y;
  return [
    { npcMove: { npc: 'geralt', toX: gx, speed: 260 } },
    { npcFace: { npc: 'geralt', dir: 'player' } },
    { playerFace: 'right' },
    { shake: { ms: 200, intensity: 0.004 } },
    { say: 'geralt_rencontre' },
    { npcAnim: { npc: 'geralt', anim: 'idle' } },
    { camera: { x: (GERALT_ARENA.minX + GERALT_ARENA.maxX) / 2, y: midY, ms: 600 } },
    { call: (sc) => a2ArenaCamera(sc, true) },
    { toast: 'Duel ! Esquive ses flèches et ses collets, et frappe Geralt (K ou clic).' },
  ];
};

CUTSCENES.geralt_fin_duel = () => {
  return [
    { npcFace: { npc: 'geralt', dir: 'player' } },
    { npcFace: { npc: 'clak', dir: 'player' } },
    { say: 'geralt_rendu_victoire' },
    { say: 'geralt_paix' },
    { npcAnim: { npc: 'geralt', anim: 'map_reading' } },
    { playerPose: 'receive_item' },
    { give: 'carte_geralt' },
    { wait: 700 },
    { playerPose: null },
    { toast: 'Touche M : consulter la carte de Geralt' },
    { say: 'geralt_carte' },
    { npcAnim: { npc: 'geralt', anim: 'walk' } },
    { parallel: [
      { npcMove: { npc: 'geralt', toX: 1850, speed: 150 } },
      { npcMove: { npc: 'clak', toX: 1790, speed: 150 } },
      { playerMove: { toX: 1680 } },
    ] },
    { npcAnim: { npc: 'geralt', anim: 'idle' } },
    { camera: { x: 1820, y: 300, ms: 600 } },
    { call: (sc) => a2GeraltComicJump(sc) },
    { call: (sc) => storyBulles(sc, [
      { who: 'clak', text: 'Clac. Clac clac.' },
      { who: 'geralt', text: 'Il dit que j\'aurais pu demander de l\'aide. Je ne lui ai pas demandé son avis.' },
    ]) },
    { say: 'geralt_essai' },
    { set: { geraltMet: true } },
    { call: (sc) => a2Ff1EndDuel(sc) },
    { cameraFollow: true },
    { toast: 'Espace, puis encore Espace en l\'air : le bond du singe atteint la corniche' },
  ];
};

// Chute de Geralt : l'art Codex `trip_fall` dessine déjà la chute jusqu'au sol
// (puis assis). Tourner en plus le sprite autour de ses pieds l'enfonçait à
// moitié dans le sol : on ne tourne plus que le placeholder sans art.
function a2GeraltFallAngle(scene, angle) {
  return hasManifestArt(scene, 'geralt', 'trip_fall') ? 0 : angle;
}

// Grappin peint (`objet_grappin`, 256x206) : origine sur son anneau (où se
// noue la corde), et angle de sa tige (de l'anneau à la pointe centrale,
// mesuré sur l'image : 98°, presque vers le bas) pour l'aligner sur la corde.
const A2_GRAPPIN_RING = { x: 0.45, y: 0.1, axis: Math.atan2(170, -25) };

// Geralt tente la corniche : petit bond raté, puis la corde qui lui retombe dessus.
async function a2GeraltComicJump(scene) {
  const g = a2Npc(scene, 'geralt');
  const clak = a2Npc(scene, 'clak');
  if (!g) return;
  const gy = g.y;
  a2Float(scene, g.x, g.y - 80, 'Hop… HOP !', '#ffd27a');
  setNpcFacing(g, 1);
  await a2Tween(scene, { targets: g, y: gy - 46, duration: 260, ease: 'Quad.easeOut' });
  await a2Tween(scene, { targets: g, y: gy, duration: 240, ease: 'Quad.easeIn' });
  g.playManifest('trip_fall', false);
  await a2Tween(scene, { targets: g, angle: a2GeraltFallAngle(scene, -80), duration: 220 });
  a2Float(scene, g.x, g.y - 50, 'Ouf…', '#ffd27a');
  await a2Wait(scene, 700);
  await a2Tween(scene, { targets: g, angle: 0, duration: 260 });
  g.playManifest('idle');
  // La corde : un trait lancé vers la corniche, qui retombe sur sa tête.
  a2Float(scene, g.x, g.y - 80, 'Plan B : la corde !', '#ffd27a');
  const rope = scene.add.graphics().setDepth(g.depth + 1);
  // Art du lot 8 : corde peinte `objet_corde` (segment tuilable, 3 px de
  // large, étiré de la main au grappin) et grappin `objet_grappin` accroché
  // par son anneau. Repli : le trait et le rond dessinés. Trajectoire et
  // durées inchangées.
  const man = getItemManifest();
  const ropeArt = scene.textures.exists('item-objet_corde')
    ? scene.add.tileSprite(0, 0, 3, 8, 'item-objet_corde').setOrigin(0.5, 0)
      .setTileScale((man.objet_corde || {}).scale || 0.15).setDepth(g.depth + 1)
    : null;
  const hook = scene.textures.exists('item-objet_grappin')
    ? scene.add.image(0, 0, 'item-objet_grappin').setOrigin(A2_GRAPPIN_RING.x, A2_GRAPPIN_RING.y)
      .setScale((man.objet_grappin || {}).scale || 0.08).setDepth(g.depth + 1)
    : null;
  const tip = { x: g.x, y: g.y - 60 };
  const draw = () => {
    rope.clear();
    const hx = g.x + 6;
    const hy = g.y - 50;
    if (ropeArt) {
      // Origine (0,5 ; 0) à la main, axe +y local tourné vers le grappin.
      const L = Math.max(1, Math.hypot(tip.x - hx, tip.y - hy));
      if (Math.abs(ropeArt.height - L) > 0.5) ropeArt.setSize(3, L);
      ropeArt.setPosition(hx, hy).setRotation(Math.atan2(-(tip.x - hx), tip.y - hy));
    } else {
      rope.lineStyle(3, 0xc9a26b, 1);
      rope.lineBetween(hx, hy, tip.x, tip.y);
    }
    if (hook) {
      // Les crochets en avant, dans le prolongement de la corde.
      hook.setPosition(tip.x, tip.y)
        .setRotation(Phaser.Math.Angle.Between(hx, hy, tip.x, tip.y) - A2_GRAPPIN_RING.axis);
    } else {
      rope.fillStyle(0x8a6a3e, 1);
      rope.fillCircle(tip.x, tip.y, 5);
    }
  };
  // Posés tout de suite (sinon l'art restait une image en (0, 0)).
  draw();
  rope.once('destroy', () => {
    if (ropeArt) ropeArt.destroy();
    if (hook) hook.destroy();
  });
  // Zone quittée en pleine cinématique : la corde est détruite avec la
  // scène, l'écouteur se retire au lieu de redessiner des objets morts.
  const upd = () => {
    if (!rope.active) { scene.events.off('update', upd); return; }
    draw();
  };
  scene.events.on('update', upd);
  await a2Tween(scene, { targets: tip, x: 1915, y: 230, duration: 450, ease: 'Quad.easeOut' });
  await a2Wait(scene, 250);
  await a2Tween(scene, { targets: tip, x: g.x + 4, y: g.y - 70, duration: 420, ease: 'Quad.easeIn' });
  scene.cameras.main.shake(120, 0.004);
  a2Float(scene, g.x, g.y - 75, 'Bonk.', '#ffffff');
  scene.events.off('update', upd);
  rope.destroy();
  if (clak) {
    clak.playManifest('snap', false);
    a2Float(scene, clak.x, clak.y - 30, 'Clac.', '#ff9f70', { size: 14 });
  }
  await a2Wait(scene, 700);
}

// Fin du duel : murs, barre de vie et caméra de l'arène retirés (appelée
// aussi par la cinématique de fin : sans effet la 2e fois).
function a2Ff1EndDuel(scene) {
  const st = scene.__a2;
  if (st && st.walls) { a2DestroyWalls(st.walls); st.walls = null; }
  hideBossBar(scene);
  a2ArenaCamera(scene, false);
}

// --- Le duel (mécanique : src/entities/GeraltDuel.js) ---------------------
// Un vrai combat (refonte du 2026-10-24) : flèches en cloche et droites, saut
// avec tir plongeant puis réception ratée, collets, invocation de Clak au 4e
// coup, phase 2 avec Clak, 8 coups pour gagner ; dernier cœur perdu = le duel
// recommence dans l'arène. Arène : murs x 880 et 1840, soit un écran de
// large — la caméra s'y cale (flèches, collets et Clak toujours visibles). Le
// feu de camp (x 820) reste dehors : pas de soin en plein duel.
const GERALT_ARENA = { minX: 880, maxX: 1840 };

// Bornes horizontales de la caméra calées sur l'arène pendant le duel (la
// montée vers le ciel garde ses bornes verticales), rendues ensuite.
function a2ArenaCamera(scene, on) {
  const st = scene.__a2;
  if (!st) return;
  const cam = scene.cameras.main;
  if (on) {
    if (st.camBounds) return;
    const b = cam.getBounds();
    st.camBounds = [b.x, b.y, b.width, b.height];
    cam.setBounds(GERALT_ARENA.minX, b.y, GERALT_ARENA.maxX - GERALT_ARENA.minX, b.height);
  } else if (st.camBounds) {
    cam.setBounds(...st.camBounds);
    st.camBounds = null;
  }
}

// Remarques pendant le duel (bulles, rien ne se fige) : Xara conseille,
// Geralt fanfaronne. Une fois par visite chacune.
const GERALT_DUEL_BULLES = {
  lob: ['xara', 'Regarde le sol : sa flèche tombe là où ça rougeoie !'],
  shot: ['xara', 'Une flèche droite : saute, ou coupe-la en vol !'],
  trap: ['xara', 'Un collet. Saute par-dessus… et attire-le dessus !'],
  crash: ['xara', 'Il s\'est étalé ! Frappe, vite !'],
  'player-trapped': ['xara', 'Ses collets ne pardonnent pas : regarde où tu marches.'],
  'geralt-trapped': ['xara', 'Pris à son propre piège. Classique.'],
  parry: ['geralt', 'Hé ! Elle m\'a coûté cher, celle-là !'],
  'column-hit': ['geralt', 'Ha ! L\'ancêtre ne rate jamais. Enfin… rarement.'],
  'clak-stunned': ['geralt', 'Clak ! Debout, tu es un totem !'],
};
// Reprise après une défaite : une courte bulle, pas de dialogue d'intro.
const GERALT_DUEL_REPRISE = [
  'Debout, porteuse de mousse ! On reprend. Et je ne retiens plus mes flèches.',
  'Encore ? Bien. Cette fois, je suis échauffé.',
  'Tu es têtue. Moi aussi. En garde !',
];

async function a2Ff1Encounter(scene) {
  const st = scene.__a2;
  // Murs épaissis vers l'extérieur (bords intérieurs inchangés : 896 et 1824).
  st.walls = a2Walls(scene, [{ x: GERALT_ARENA.minX, out: -1 }, { x: GERALT_ARENA.maxX, out: 1 }]);
  await runCutscene(scene, 'geralt_rencontre');
  if (!scene.player || scene.__a2 !== st || !scene.sys.isActive()) return;
  a2DuelStart(scene);
}

// Plages de l'arène où Geralt ne pose pas de collet : devant les fleurs
// hautes (décor de la donnée, x 1700), le collet brun s'y perdait tout à fait
// (playtest). Lu sur les décors posés : suit le décor s'il est déplacé à
// l'éditeur. Largeur : celle de l'image affichée, resserrée de 10 % de chaque
// côté (marges transparentes de la planche).
function a2ArenaNoTrap(scene) {
  const out = [];
  for (const img of scene.props || []) {
    if (img.propType !== 'foret_flottante_fleurs_hautes') continue;
    if (img.x < GERALT_ARENA.minX || img.x > GERALT_ARENA.maxX) continue;
    const w = img.displayWidth * 0.8;
    out.push([Math.round(img.x - w / 2), Math.round(img.x + w / 2)]);
  }
  return out;
}

function a2DuelStart(scene) {
  const st = scene.__a2;
  const g = a2Npc(scene, 'geralt');
  if (!g || typeof GeraltDuel !== 'function') return;
  const groundY = g.y;
  st.duelSeen = new Set();
  st.reprises = 0;
  st.duel = new GeraltDuel(scene, {
    geralt: g,
    minX: GERALT_ARENA.minX,
    maxX: GERALT_ARENA.maxX,
    groundY,
    // Réapparition après le dernier cœur : dans l'arène, côté gauche.
    spawn: { x: GERALT_ARENA.minX + 110, y: groundY - 20 },
    resetX: GERALT_ARENA.maxX - 260,
    noTrap: a2ArenaNoTrap(scene),
    onEvent: (name, data) => a2DuelEvent(scene, name, data),
  });
  showBossBar(scene, 'Geralt, ranger des marches boisées', () => (st.duel ? st.duel.ratio() : 0));
  st.duel.start();
}

// PNJ créé en cours de visite (Clak à l'invocation, Geralt et Clak à la
// revisite du bosquet) : invite « E : parler » comme les PNJ de la donnée
// (le `talk` de Clak ne répond qu'après geraltMet). Inscrit par StoryKit
// (registerStoryNpc : pas de doublon, clé dans scene.npcs) et désinscrit
// quand le PNJ est détruit : Clak est retiré à chaque reprise du duel
// (GeraltDuel.removeClak) et laissait sinon une entrée morte à chaque fois.
// Repli sans StoryKit à jour : l'ancien ajout direct dans la liste.
function a2RegisterNpc(scene, npc) {
  if (!npc || !npc.active) return npc;
  if (typeof registerStoryNpc === 'function') {
    registerStoryNpc(scene, npc);
  } else {
    const list = scene.__story && scene.__story.interactables;
    if (list && !list.some((it) => it.npc === npc)) list.push({ kind: 'npc', npc });
  }
  if (!npc.__a2Unregister) {
    npc.__a2Unregister = true;
    npc.once('destroy', () => {
      if (typeof unregisterStoryInteractable === 'function') {
        unregisterStoryInteractable(scene, npc);
      } else if (scene.__story && scene.__story.interactables) {
        scene.__story.interactables = scene.__story.interactables.filter((it) => it.npc !== npc);
      }
    });
  }
  return npc;
}

function a2DuelEvent(scene, name, data) {
  const st = scene.__a2;
  if (!st || !scene.sys.isActive()) return;
  if (name === 'clak-spawned') { a2RegisterNpc(scene, data.clak); return; }
  if (name === 'victory') {
    a2DuelFinish(scene).catch((e) => { if (scene.sys.isActive() && scene.player) console.error('fin du duel', e); });
    return;
  }
  // Clak posé au sol, après la colonne (une bulle de Xara plus tôt la
  // masquait : elle se tient près d'Agarica, juste sous la lumière).
  if (name === 'clak-landed') {
    if (st.duelSeen.has(name)) return;
    st.duelSeen.add(name);
    storyBulles(scene, [
      'Un crabe… ancestral. Évidemment.',
      'Étourdis le crabe si tu veux, mais c\'est Geralt qu\'il faut vaincre !',
    ], null, 400);
    return;
  }
  if (name === 'restart') {
    storyBulle(scene, 'geralt', GERALT_DUEL_REPRISE[st.reprises++ % GERALT_DUEL_REPRISE.length], undefined, { replace: true });
    return;
  }
  const b = GERALT_DUEL_BULLES[name];
  if (!b || st.duelSeen.has(name)) return;
  st.duelSeen.add(name);
  storyBulle(scene, b[0], b[1], undefined, { replace: true });
}

async function a2DuelFinish(scene) {
  const st = scene.__a2;
  const duel = st && st.duel;
  if (!duel || st.finishing) return;
  st.finishing = true;
  // Geralt à terre, sonné, « Je me rends ! » : le temps de le voir.
  await a2Wait(scene, 1300);
  if (!scene.sys.isActive() || !scene.player || scene.__a2 !== st) return;
  duel.destroy({ keepActors: true });
  st.duel = null;
  const g = a2Npc(scene, 'geralt');
  if (g) {
    scene.tweens.killTweensOf(g);
    g.setAngle(0).clearTint();
    g.playManifest('idle');
  }
  // Clak est là depuis l'invocation ; filet de sécurité pour la cinématique.
  if (g && !a2Npc(scene, 'clak')) {
    a2RegisterNpc(scene, createStoryNpc(scene, { id: 'clak', x: g.x - 55, talk: [{ requires: { geraltMet: true }, talk: 'clak_camp' }] }));
  }
  // Murs, caméra et barre retirés AVANT la cinématique : elle fait marcher
  // Agarica jusqu'à x 1680, et la caméra va jusqu'à la corniche.
  a2Ff1EndDuel(scene);
  await runCutscene(scene, 'geralt_fin_duel');
}

// Revisite : le « Plan B » de Geralt est resté couché au pied de la corniche
// (P1, x 1920). Image seule (sans art : rien, c'est un simple clin d'œil).
// Tourné de -80° (anneau à gauche, crochets à droite), le bas de l'image
// tourné est son bord gauche, où pointe un crochet : posé 2 px dans l'herbe.
function a2DrawFallenGrapple(scene, x) {
  if (!scene.textures.exists('item-objet_grappin')) return null;
  const img = scene.add.image(x, 0, 'item-objet_grappin').setOrigin(0.5)
    .setScale((getItemManifest().objet_grappin || {}).scale || 0.08).setAngle(-80);
  const ground = storyStandY(scene, x, 448);
  img.y += ground + 2 - img.getBounds().bottom;
  a2PutAboveProps(scene, img);
  return img;
}

ZONE_SCRIPTS.acte2_ff1 = {
  create(scene, data) {
    // La montée vers le ciel (caméra verticale, `skyReveal` : LevelKit)
    // remplace l'ancienne brume dessinée ici et le plafond à y = 0.
    if (!(data && data.camera && data.camera.vertical)) a2Ceiling(scene);
    const st = { duel: null, walls: null };
    scene.__a2 = st;
    // Zone quittée en plein duel (titre, chargement) : écouteurs retirés.
    scene.events.once('shutdown', () => { if (st.duel) st.duel.destroy(); st.duel = null; });
    a2InteractReset(scene);
    if (storyGet('geraltMet')) {
      // Revisite : Geralt au pied de la corniche, plongé dans sa carte.
      const g = a2Npc(scene, 'geralt');
      const c = a2Npc(scene, 'clak');
      if (g) { g.x = 1840; g.playManifest('map_reading'); }
      if (c) c.x = 1790;
      a2DrawFallenGrapple(scene, 1915);
    }
  },
  update(scene, time, delta) {
    const st = scene.__a2;
    if (!st) return;
    if (!storyGet('geraltMet') && !st.encounterStarted && scene.player.x > 920 && scene.player.x < 1500) {
      st.encounterStarted = true;
      a2Ff1Encounter(scene).catch((e) => { if (scene.sys.isActive() && scene.player) console.error('rencontre Geralt', e); });
    }
    a2HoldWalls(scene, st.walls);
    if (st.duel) st.duel.update(delta);
  },
};

// ===========================================================================
// 9. FORÊT FLOTTANTE 2 — îles, totem de poche, Amanite, aigle
// ===========================================================================
Object.assign(DIALOGUES, {
  ff2_totem_poche: [
    { who: 'agarica', text: 'Qu\'est-ce que c\'est ? Un petit totem… fendu en deux, et tout froid.' },
    { who: 'xara', text: 'Ancien. Les gardiens en portaient sur eux. Garde-le : les vieilles choses ont la mémoire longue.' },
  ],
  ff2_envol: [
    { who: 'agarica', text: 'Xara, là, en contrebas ! Ce cercle vert, au milieu de la mousse… La plante !' },
    { who: 'xara', text: 'D\'ici, tu planes. Prends de l\'élan, saute, ouvre les ailes, et ne regarde pas le vide.' },
  ],
});

// Les retrouvailles changent selon le choix fait au bosquet (amaniteCouverte).
DIALOGUES.amanite_rencontre = () => {
  const couverte = storyGet('amaniteCouverte') !== false;
  return [
    { who: 'agarica', text: 'Amanite ?!' },
    { who: 'amanite', text: 'Agarica… Tu as survécu, dehors. Je ne pensais pas te revoir si haut.' },
    ...(couverte ? [
      { who: 'agarica', text: 'J\'ai menti pour toi. Ils m\'ont bannie, Amanite. Bannie !' },
      { who: 'amanite', text: 'Je sais. Je ne te l\'avais pas demandé… mais je ne l\'oublierai pas.' },
    ] : [
      { who: 'agarica', text: 'Je t\'avais suppliée de la reposer. Ils m\'ont bannie quand même.' },
      { who: 'amanite', text: 'Tu ne m\'as pas dénoncée aux gardes. Pour eux, c\'était pareil. Je suis désolée.' },
    ]),
    { who: 'agarica', text: 'Et cette bête… tu l\'as tuée. Elle était malade ! Kainati aussi l\'était : je l\'ai épargné, et la mousse l\'a quitté.' },
    { who: 'amanite', text: 'On arrache la mauvaise herbe, Agarica. On ne la console pas.' },
    { who: 'agarica', text: 'Ce ne sont pas des mauvaises herbes. Ce sont les animaux de notre forêt !' },
    { who: 'amanite', text: 'Tu as toujours eu le cœur trop grand. C\'est pour ça que je t\'aime bien… et pour ça que la forêt te dévorera.' },
    { who: 'amanite', text: 'Je vais jusqu\'à la source de la mousse. Seule. Ne te mets pas en travers de mon chemin.' },
  ];
};

CUTSCENES.ff2_intro = cutsceneBulles([
  { who: 'agarica', text: 'Des îles… qui flottent ! Et entre elles, on voit le vent monter !' },
  'Les anciens gardiens savaient lier la pierre au vent. Ce vent-là ne te sert à rien… pour l\'instant.',
], null, 300);
CUTSCENES.ff2_totem_poche = [{ wait: 400 }, { say: 'ff2_totem_poche' }];
CUTSCENES.ff2_envol = [
  { camera: { x: 3800, y: 300, ms: 1000 } },
  { say: 'ff2_envol' },
  { cameraFollow: true },
  { toast: 'Saute du bord, puis Espace en l\'air : plane jusqu\'à la clairière →' },
];
CUTSCENES.aigle_revele = cutsceneBulles([
  { who: 'agarica', text: 'Ce vent sous mes bras… Je me sens légère, comme une plume !' },
  'L\'aigle t\'a choisie. Saute, puis saute encore en l\'air : tu planeras. S pour piquer.',
  'Rejoins l\'île d\'en face. Si tu tombes, l\'îlot du dessous te rattrapera… et le courant d\'air te remontera.',
], { text: 'Espace en l\'air : tu planes — S : piqué — les courants d\'air portent l\'aigle', ms: 4500 });

CUTSCENES.amanite_rencontre = (scene) => {
  const st = scene.__a2 || {};
  return [
    { playerFace: 'right' },
    { camera: { x: (scene.player.x + 1990) / 2 + 40, y: 300, ms: 700 } },
    // Coup de lance sur la bête corrompue : la méthode d'Amanite, sous nos yeux.
    { call: (sc) => a2AmaniteStrike(sc, st) },
    { npcFace: { npc: 'amanite', dir: 'player' } },
    { say: 'amanite_rencontre' },
    { call: (sc) => a2AmaniteLeaves(sc) },
    { set: { amaniteMet: true } },
    // Après son départ : remarques et indice du totem en bulles.
    { call: (sc) => storyBulles(sc, [
      { who: 'agarica', text: '… Elle n\'était pas comme ça, avant. Elle voulait aider, elle aussi.' },
      'Elle veut toujours sauver la forêt. C\'est bien ce qui m\'inquiète.',
      'Plus haut, sur l\'île au-dessus de nous : un totem t\'attend. Le bond du singe devrait suffire.',
    ]) },
    { cameraFollow: true },
  ];
};

// Petite bête de mousse qu'Amanite abat à l'arrivée d'Agarica : la bête
// dédiée du lot 8 (`bete_mousse_vivante`, puis `_touchee` et `_morte` au coup
// de lance), un animal moussu « innocent » qui rend le geste plus cruel
// (décision utilisateur, Q7). Tournée vers Amanite (l'art regarde à droite),
// bas visible sur la surface de marche. Replis, dans l'ordre : l'ennemi
// `mousse_creature` (Niveaux 2), puis le dessin par code.
const A2_BETE = { vivante: 'bete_mousse_vivante', touchee: 'bete_mousse_touchee', morte: 'bete_mousse_morte' };

function a2BeteImage(scene, x, footY, id) {
  const img = scene.add.image(x, footY, `item-${id}`).setOrigin(0.5, 1)
    .setScale((getItemManifest()[id] || {}).scale || 0.25).setFlipX(true);
  setVisibleBottomY(img, footY);
  a2PutAboveProps(scene, img);
  return img;
}

// Change la pose de la bête dédiée en gardant ses pieds au même endroit (les
// trois poses n'ont pas la même hauteur ; même échelle : pas de saut de taille).
function a2BeteSetPose(beast, id) {
  if (!beast || !beast.active || !beast.scene.textures.exists(`item-${id}`)) return;
  beast.setTexture(`item-${id}`);
  setVisibleBottomY(beast, beast.beteFootY);
}

function a2DrawMossBeast(scene, x, y) {
  if (scene.textures.exists(`item-${A2_BETE.vivante}`)) {
    const footY = storyStandY(scene, x, y);
    const img = a2BeteImage(scene, x, footY, A2_BETE.vivante);
    img.beteArt = true;
    img.beteFootY = footY;
    return img;
  }
  if (hasManifestArt(scene, 'mousse_creature')) {
    const spr = addManifestSprite(scene, x, storyStandY(scene, x, y), 'mousse_creature', 'idle');
    spr.setFlipX(true);
    a2PutAboveProps(scene, spr);
    return spr;
  }
  const g = scene.add.graphics({ x, y });
  g.fillStyle(0x2f5a2a, 1);
  g.fillEllipse(0, -22, 64, 44);
  g.fillStyle(0x3e7a2c, 1);
  g.fillCircle(-18, -34, 13);
  g.fillCircle(14, -38, 15);
  g.fillStyle(0x9bff5a, 0.9);
  g.fillCircle(-22, -26, 3);
  g.fillCircle(-12, -24, 3);
  g.fillStyle(0x6fdc3a, 0.8);
  g.fillRoundedRect(-20, -6, 4, 12, 2);
  g.fillRoundedRect(10, -4, 4, 10, 2);
  a2PutAboveProps(scene, g);
  return g;
}

async function a2AmaniteStrike(scene, st) {
  const a = a2Npc(scene, 'amanite');
  const beast = st.beast;
  if (!a || !beast || !beast.active) return;
  setNpcFacing(a, 1);
  a.playManifest('spear_thrust', false);
  await a2Wait(scene, 250);
  scene.cameras.main.flash(180, 255, 80, 80);
  scene.cameras.main.shake(200, 0.008);
  // Éclats : mottes et éclats de mousse peints du lot 8, en alternance
  // (taille du rond d'avant x 1,5, angle au hasard) ; repli : les ronds verts.
  for (let i = 0; i < 10; i++) {
    const r = Phaser.Math.Between(3, 7);
    const fx = i % 2 ? 'fx_motte_mousse' : 'fx_eclat_mousse';
    const x0 = beast.x + Phaser.Math.Between(-30, 30);
    const m = scene.textures.exists(`item-${fx}`)
      ? scene.add.image(x0, beast.y - 30, `item-${fx}`).setScale((2 * r * 1.5) / 128).setAngle(Phaser.Math.Between(0, 359))
      : scene.add.circle(x0, beast.y - 30, r, 0x6fae3a);
    scene.tweens.add({ targets: m, y: beast.y - 2, x: m.x + Phaser.Math.Between(-30, 30), alpha: 0, duration: 600, onComplete: () => m.destroy() });
  }
  if (beast.beteArt) {
    // Bête dédiée : touchée au flash, morte 200 ms plus tard ; elle reste
    // au sol, à peine estompée (pas d'écrasement : l'image dessine déjà la
    // bête effondrée).
    a2BeteSetPose(beast, A2_BETE.touchee);
    scene.time.delayedCall(200, () => a2BeteSetPose(beast, A2_BETE.morte));
    await a2Tween(scene, { targets: beast, alpha: 0.85, duration: 500, ease: 'Quad.easeIn' });
  } else if (beast.anims && hasManifestArt(scene, 'mousse_creature', 'death')) {
    // L'anim de mort dessine déjà l'effondrement : l'écraser en plus à 25 %
    // n'en laissait qu'une ligne de ~4 px. Alpha seul.
    beast.playManifest('death', false);
    await a2Tween(scene, { targets: beast, alpha: 0.55, duration: 500, ease: 'Quad.easeIn' });
  } else {
    // Dessin de repli : la bête s'affaisse.
    await a2Tween(scene, { targets: beast, scaleY: beast.scaleY * 0.25, alpha: 0.55, duration: 500, ease: 'Quad.easeIn' });
  }
  await showDialogue(scene, ['Sur la grande île, une silhouette rouge vient d\'abattre sa lance sur une bête couverte de mousse.']);
  a.playManifest('idle');
}

// Revisite : la trace du passage d'Amanite, le dernier état de la bête, à la
// même place et dans la même pose qu'à la fin du coup de lance. Ordre :
// bête dédiée morte (même alpha 0,85), dernière image de l'anim de mort de
// `mousse_creature`, mousse séchée, puis la flaque dessinée (posée SUR la
// surface : l'ancienne ellipse était 12 px sous l'herbe, invisible).
function a2DrawMossBeastRemains(scene, x, y) {
  const footY = storyStandY(scene, x, y);
  if (scene.textures.exists(`item-${A2_BETE.morte}`)) {
    return a2BeteImage(scene, x, footY, A2_BETE.morte).setAlpha(0.85);
  }
  const deathKey = manifestFrameKey('mousse_creature', 'death', 4);
  if (scene.textures.exists(deathKey)) {
    const img = scene.add.image(x, footY, deathKey).setOrigin(0.5, 1)
      .setScale((getAssetManifest().mousse_creature || {}).scale || 0.26).setFlipX(true).setAlpha(0.55);
    setVisibleBottomY(img, footY);
    a2PutAboveProps(scene, img);
    return img;
  }
  if (scene.textures.exists('item-decor_mousse_sechee')) {
    const img = scene.add.image(x, footY, 'item-decor_mousse_sechee').setOrigin(0.5, 1)
      .setScale((getItemManifest().decor_mousse_sechee || {}).scale || 0.08);
    setVisibleBottomY(img, footY + GROUND_CONTACT_SINK);
    a2PutAboveProps(scene, img);
    return img;
  }
  const g = scene.add.graphics();
  g.fillStyle(0x34502a, 0.7);
  g.fillEllipse(x, footY - 2, 80, 14);
  a2PutAboveProps(scene, g);
  return g;
}

async function a2AmaniteLeaves(scene) {
  const a = a2Npc(scene, 'amanite');
  if (!a) return;
  a.playManifest('walk_angry');
  setNpcFacing(a, 1);
  await a2Tween(scene, { targets: a, x: 2150, duration: 600 });
  // Elle saute d'île en île vers l'est et disparaît.
  scene.tweens.add({ targets: a, x: 2420, duration: 700 });
  await a2Tween(scene, { targets: a, y: a.y - 230, duration: 380, ease: 'Quad.easeOut' });
  await a2Tween(scene, { targets: a, y: 208, duration: 320, ease: 'Quad.easeIn' });
  scene.tweens.add({ targets: a, x: 2900, alpha: 0, duration: 900 });
  await a2Tween(scene, { targets: a, y: 60, duration: 450, ease: 'Quad.easeOut' });
  await a2Wait(scene, 450);
  delete scene.npcs.amanite;
  a.destroy();
}

ZONE_SCRIPTS.acte2_ff2 = {
  create(scene, data) {
    // Caméra verticale + ciel révélé (donnée de zone) : plus de plafond à
    // y = 0, ni de voile de ciel, d'îles lointaines ou d'horizon sombre
    // dessinés ici (formes provisoires retirées).
    if (!(data && data.camera && data.camera.vertical)) a2Ceiling(scene);
    scene.__a2 = { hadEagle: !!storyGet('hasEagleForm'), revealQueued: false, beast: null };
    a2InteractReset(scene);
    if (!storyGet('amaniteMet')) scene.__a2.beast = a2DrawMossBeast(scene, 2070, 384 + GROUND_STAND_SINK);
    else a2DrawMossBeastRemains(scene, 2070, 384 + GROUND_STAND_SINK);
  },
  update(scene) {
    const st = scene.__a2;
    if (!st) return;
    // Totem de l'aigle activé (handler LevelKit) : Xara explique le plané.
    if (!st.hadEagle && !st.revealQueued && storyGet('hasEagleForm')) {
      st.revealQueued = true;
      scene.time.delayedCall(2600, () => {
        if (scene.__a2 === st && scene.player) runCutscene(scene, 'aigle_revele');
      });
    }
  },
};

// ===========================================================================
// 10. CLAIRIÈRE DE LA PLANTE — la fleur résistante
// ===========================================================================
Object.assign(DIALOGUES, {
  plante_examen: [
    { who: 'agarica', text: 'La voilà… Elle est encore plus belle de près.' },
    { who: 'xara', text: 'Regarde le sol. La mousse s\'arrête net, en cercle, comme devant un mur invisible.' },
    { who: 'agarica', text: 'Si je la rapporte, on pourra peut-être en faire un remède !' },
    {
      who: 'agarica', text: 'Comment est-ce que je la prends ?',
      choices: [
        { text: 'L\'arracher avec ses racines', goto: 'plante_arracher' },
        { text: 'Ne prélever qu\'une fleur', goto: 'plante_prelever' },
      ],
    },
  ],
  plante_arracher: [
    { who: 'xara', text: 'Attends ! Si tu l\'arraches, il n\'en restera rien. C\'est peut-être la dernière.' },
    { who: 'agarica', text: 'Oh… Tu as raison. Je ne prendrai qu\'une fleur. Le reste doit vivre.' },
    { who: 'xara', text: 'Les racines restent. La fleur repoussera.' },
  ],
  plante_prelever: [
    { who: 'agarica', text: 'Je ne prendrai qu\'une fleur. Le reste doit vivre.' },
    { who: 'xara', text: 'Sage. Les racines restent, la fleur repoussera.' },
  ],
  plante_apres: [
    { who: 'xara', text: 'Une guérisseuse saurait quoi en faire. Il y en a une, pas loin d\'ici… je sens ses papillons.' },
    { who: 'xara', text: 'Les voilà. Suis-les.' },
  ],
  plante_revue: [
    { who: 'agarica', text: 'Un nouveau bouton pointe déjà, là où j\'ai pris la fleur.' },
  ],
});

CUTSCENES.clairiere_arrivee = cutsceneBulles([
  { who: 'agarica', text: 'J\'ai… j\'ai réussi ! Je me suis posée !' },
  'Avec une certaine élégance, même. Presque.',
  { who: 'agarica', text: 'La plante est juste là. Et autour d\'elle, l\'herbe est verte. Vraiment verte.' },
]);
CUTSCENES.plante_prelevement = [
  { playerFace: 'right' },
  { say: 'plante_examen' },
  { call: (scene) => a2PlantePick(scene) },
  { playerPose: 'receive_item' },
  { give: 'fleur_resistante' },
  { set: { fleurPrelevee: true } },
  { wait: 900 },
  { playerPose: null },
  { say: 'plante_apres' },
  { call: (scene) => a2ClairiereOpenPath(scene, true) },
  { toast: 'Suis les papillons vers l\'est →' },
];

// Pied de la plante : sur la surface de marche, là où se tient Agarica.
function a2PlanteBaseY(scene, x) {
  return storyStandY(scene, x, 448);
}

// La plante résistante peinte (lot 8) : fleurie, puis en bouton après la
// cueillette (même cadrage, même échelle). La fleur qui s'envole est la tête
// de l'image fleurie (rectangle 'tete' x 30, y 0, 198x195, affiché par
// setCrop), et non l'objet `fleur_resistante`, qui montre la plante entière
// avec racines et motte. Pas de cadre ajouté à la texture : Phaser en fait
// alors son cadre par défaut, et toute image créée ensuite sans cadre
// (plante d'une revisite, décor posé à l'éditeur) n'affichait plus que la tête.
const A2_PLANTE = {
  fleurie: 'item-decor_plante_resistante_fleurie',
  bouton: 'item-decor_plante_resistante_bouton',
  tete: { x: 30, y: 0, w: 198, h: 195 },
  // Bas de la motte 3 px sous la ligne de marche (les racines dans l'herbe).
  sink: 3,
};

// Plante : tige, feuilles, fleur blanche et rose, halo qui pulse.
function a2DrawPlante(scene, x, y, picked) {
  const st = scene.__a2;
  if (scene.textures.exists(A2_PLANTE.fleurie) && scene.textures.exists(A2_PLANTE.bouton)) {
    const img = scene.add.image(x, y, picked ? A2_PLANTE.bouton : A2_PLANTE.fleurie).setOrigin(0.5, 1)
      .setScale((getItemManifest().decor_plante_resistante_fleurie || {}).scale || 0.2);
    setVisibleBottomY(img, y + A2_PLANTE.sink);
    storyPutBehindPlayer(scene, img);
    st.planteGfx = img;
    st.planteArt = true;
    st.fleur = null;
    // Halo centré sur la fleur (plus bas que celui du dessin : la plante
    // peinte fait 90 px de haut).
    st.planteGlow = a2Glow(scene, x, y - 72, 150, 0xfff2f8, 0.55, 3);
    scene.tweens.add({ targets: st.planteGlow, alpha: 0.25, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return;
  }
  const g = scene.add.graphics({ x, y });
  g.lineStyle(5, 0x3f7a52, 1);
  g.beginPath(); g.moveTo(0, 0); g.lineTo(-4, -40); g.lineTo(2, -78); g.strokePath();
  g.fillStyle(0x5fa86f, 1);
  g.fillEllipse(-18, -26, 30, 12);
  g.fillEllipse(18, -44, 30, 12);
  g.fillEllipse(-16, -60, 24, 10);
  storyPutBehindPlayer(scene, g);
  st.planteGfx = g;
  st.planteGlow = a2Glow(scene, x, y - 80, 150, 0xfff2f8, 0.55, 3);
  scene.tweens.add({ targets: st.planteGlow, alpha: 0.25, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  st.fleur = scene.add.graphics({ x: x + 2, y: y - 82 });
  if (picked) {
    st.fleur.fillStyle(0xff9fc9, 1);
    st.fleur.fillEllipse(0, 0, 10, 14); // bouton qui repousse
  } else {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      st.fleur.fillStyle(i % 2 ? 0xffe9f5 : 0xffc6e0, 1);
      st.fleur.fillEllipse(Math.cos(a) * 11, Math.sin(a) * 11, 16, 12);
    }
    st.fleur.fillStyle(0xffd27a, 1);
    st.fleur.fillCircle(0, 0, 6);
  }
  storyPutBehindPlayer(scene, st.fleur);
}

// Mousse de la clairière (cf. CLAIRIERE_MOUSSE_VARIANTE en tête du fichier),
// puis le cercle sain et sa colonne de lumière, dans toutes les variantes.
function a2DrawMossCarpet(scene, cx, radius, levelWidth, variante = CLAIRIERE_MOUSSE_VARIANTE) {
  if (variante === 'touffes') a2ClairiereTouffes(scene, cx, radius, levelWidth);
  else if (variante === 'lisere') a2ClairiereLisere(scene, cx, radius, levelWidth);
  a2DrawHealthyCircle(scene, cx, radius);
}

// Réglages communs des mousses de la clairière. Teinte multipliée sur l'art
// vert vif du lot 8 (bleu-violet nuit sombre) : il en sort des silhouettes
// vert-de-gris presque noires, jamais un aplat vert citron.
const A2_CLAIRIERE_MOUSSE = {
  tint: 0x3a3f56,
  alpha: 0.95,
  drawn: 0x1b2027, // repli dessiné, même valeur sombre
  start: 140,      // après le courant d'air de gauche (x 0-112)
  end: 16,         // marge avant le bord droit de la zone
  clear: 150,      // aucune mousse à moins de 150 px du bord du cercle
};

// Surface de marche à plat autour de x (pas au ras d'une marche : une touffe
// à cheval sur le bord de la butte flotterait à moitié dans le vide).
function a2FlatStandY(scene, x, half = 18) {
  const y = storyStandY(scene, x, 448);
  const ok = Math.abs(storyStandY(scene, x - half, 448) - y) < 2 && Math.abs(storyStandY(scene, x + half, 448) - y) < 2;
  return ok ? y : null;
}

// Variante 'touffes' : touffes et plaques de mousse du lot 8, petites (11 à
// 16 % de l'image), teintées sombre, tirées au sort (graine fixe : même
// clairière à chaque visite) avec une probabilité qui croît du cercle vers
// les bords de la zone (t^1,6 : presque rien à mi-chemin, des grappes aux
// extrémités). Pied derrière la frange d'herbe des tuiles : elles y sont
// plantées. Repli sans l'art : les mêmes silhouettes, dessinées.
function a2ClairiereTouffes(scene, cx, radius, levelWidth) {
  const M = A2_CLAIRIERE_MOUSSE;
  const rnd = new Phaser.Math.RandomDataGenerator(['clairiere-mousse']);
  const art = (id) => scene.textures.exists(`item-${id}`);
  // Pieds des grands décors (arbres, rochers) : une touffe posée là restait
  // cachée derrière eux (ils passent devant les objets du script).
  const hidden = typeof objectVisibleBox !== 'function' ? [] : (scene.props || [])
    .map((p) => objectVisibleBox(p)).filter(Boolean)
    .map((b) => [(b.baseLeft ?? b.left) + 6, (b.baseRight ?? b.right) - 6]);
  let drawn = null;
  const xEnd = levelWidth - M.end;
  for (let x = M.start; x < xEnd; x += rnd.realInRange(20, 36)) {
    const d = Math.abs(x - cx) - radius;
    if (d < M.clear) continue;
    const span = (x < cx ? cx - radius - M.start : xEnd - cx - radius) - M.clear;
    const t = Phaser.Math.Clamp((d - M.clear) / Math.max(1, span), 0, 1);
    if (rnd.frac() >= Math.min(1, Math.pow(t, 1.6) * 1.1)) continue;
    const footY = a2FlatStandY(scene, x);
    if (footY == null || hidden.some(([l, r]) => x > l && x < r)) continue;
    // Plaques aux extrémités seulement ; touffes partout ailleurs.
    const plaque = t > 0.55 && rnd.frac() < 0.4;
    const id = plaque
      ? (rnd.frac() < 0.7 ? 'decor_mousse_plaque_intacte' : 'decor_mousse_plaque_repoussee')
      : (t > 0.8 && rnd.frac() < 0.25 ? 'decor_touffe_mousse_grande'
        : rnd.frac() < 0.65 ? 'decor_touffe_mousse_petite' : 'decor_touffe_mousse_moyenne');
    // Un peu plus grandes tout au bord de la zone (jusqu'à 0,16).
    const scale = rnd.realInRange(0.11, 0.13) + 0.03 * t;
    const flip = rnd.frac() < 0.5;
    if (art(id)) {
      const img = scene.add.image(x, footY, `item-${id}`).setOrigin(0.5, 1).setScale(scale)
        .setFlipX(flip).setTint(M.tint).setAlpha(M.alpha);
      // Plaques : coulures 2 px sous la base, enfoncées de 3 px (manifest).
      setVisibleBottomY(img, footY + (plaque ? 3 : 2));
      storyPutBehindPlayer(scene, img);
      continue;
    }
    if (!drawn) drawn = scene.add.graphics();
    drawn.fillStyle(M.drawn, 0.9);
    if (plaque) {
      drawn.fillEllipse(x, footY, 34 * scale / 0.12, 10);
    } else {
      const h = (id.endsWith('grande') ? 34 : id.endsWith('moyenne') ? 26 : 18) * scale / 0.12;
      drawn.fillTriangle(x - 5, footY + 2, x + 5, footY + 2, x + (flip ? -2 : 2), footY + 2 - h);
      drawn.fillEllipse(x, footY + 1, 14, 6);
    }
  }
  if (drawn) storyPutBehindPlayer(scene, drawn);
}

// Morceaux à plat de [x0, x1] : [[a, b, surface]], coupés à chaque marche.
function a2FlatRuns(scene, x0, x1, step = 8) {
  const runs = [];
  for (let x = x0; x < x1; x += step) {
    const y = storyStandY(scene, x + step / 2, 448);
    const last = runs[runs.length - 1];
    if (last && Math.abs(last[2] - y) < 2) last[1] = Math.min(x1, x + step);
    else runs.push([x, Math.min(x1, x + step), y]);
  }
  return runs;
}

// Variante 'lisere' : un liseré de mousse très bas (10 px, `decor_tapis_mousse`
// réduit et teinté sombre) au ras de l'herbe, aux deux extrémités de la zone
// seulement (40 % du chemin du bord au cercle), plein au bord et effacé vers
// le centre (alpha par coin : fondu en WebGL seulement, uniforme en Canvas).
// Repli sans l'art : une frange de petites ellipses sombres, même fondu.
function a2ClairiereLisere(scene, cx, radius, levelWidth) {
  const M = A2_CLAIRIERE_MOUSSE;
  const H = 10;
  const reach = 0.4;
  const xEnd = levelWidth - M.end;
  const zones = [
    { x0: M.start, x1: M.start + (cx - radius - M.start) * reach, full: M.start },
    { x0: xEnd - (xEnd - cx - radius) * reach, x1: xEnd, full: xEnd },
  ];
  const rnd = new Phaser.Math.RandomDataGenerator(['clairiere-lisere']);
  const useArt = scene.textures.exists('item-decor_tapis_mousse');
  const drawn = useArt ? null : scene.add.graphics();
  for (const z of zones) {
    const len = z.x1 - z.x0;
    // Plein sur la première moitié côté bord de la zone, effacé ensuite
    // jusqu'à 0 côté cercle.
    const fade = (x) => Phaser.Math.Clamp((1 - Math.abs(x - z.full) / len) * 2, 0, 1) * M.alpha;
    for (const [a, b, y] of a2FlatRuns(scene, z.x0, z.x1)) {
      if (useArt) {
        const tex = scene.textures.get('item-decor_tapis_mousse').getSourceImage();
        const band = scene.add.tileSprite(a, y + 2, b - a, H, 'item-decor_tapis_mousse').setOrigin(0, 1)
          .setTileScale(H / tex.height).setTilePosition(rnd.between(0, tex.width), 0).setTint(M.tint);
        band.setAlpha(fade(a), fade(b), fade(a), fade(b));
        // Devant la frange d'herbe des tuiles (sinon elle le cachait presque
        // entièrement) : après les décors dans la liste d'affichage.
        a2PutAboveProps(scene, band);
      } else {
        for (let x = a; x < b; x += 9) {
          drawn.fillStyle(M.drawn, 0.9 * fade(x));
          drawn.fillEllipse(x + 4, y - 2, rnd.realInRange(12, 18), rnd.realInRange(6, 9));
        }
      }
    }
  }
  if (drawn) a2PutAboveProps(scene, drawn);
}

// Cercle sain autour de la plante : herbe fleurie peinte (`decor_cercle_sain`,
// largeur = diamètre du cercle), et colonne de lumière douce
// (`fx_rai_lumiere`, additive, derrière les personnages). Replis : l'ellipse
// d'herbe vive à petites fleurs, et le halo étiré en colonne.
function a2DrawHealthyCircle(scene, cx, radius) {
  const yC = storyGroundY(scene, cx, 448);
  if (scene.textures.exists('item-decor_cercle_sain')) {
    const c = scene.add.image(cx, yC + 4, 'item-decor_cercle_sain').setOrigin(0.5, 1);
    c.setScale((2 * radius) / c.width);
    storyPutBehindPlayer(scene, c);
  } else {
    const rnd = new Phaser.Math.RandomDataGenerator(['clairiere']);
    const g = scene.add.graphics();
    g.fillStyle(0x7bd35a, 0.85);
    g.fillEllipse(cx, yC + 4, radius * 2, 18);
    for (let i = 0; i < 16; i++) {
      const fx = cx + rnd.realInRange(-radius + 20, radius - 20);
      g.fillStyle(rnd.pick([0xffe9f5, 0xffc6e0, 0xfff2a8]), 1);
      g.fillCircle(fx, yC - 2, 3);
    }
    storyPutBehindPlayer(scene, g);
  }
  if (scene.textures.exists('item-fx_rai_lumiere')) {
    scene.add.image(cx, yC + 6, 'item-fx_rai_lumiere').setOrigin(0.5, 1).setDisplaySize(radius * 1.6, 520)
      .setTint(0xfff6d8).setAlpha(0.3).setBlendMode(Phaser.BlendModes.ADD).setDepth(2);
  } else {
    a2Glow(scene, cx, yC - 160, 520, 0xfff6d8, 0.22, 2).setDisplaySize(radius * 2.2, 520);
  }
}

async function a2PlantePick(scene) {
  const st = scene.__a2;
  // Plante peinte : il n'y a pas de `st.fleur` dessinée (la garde d'avant,
  // `if (!st.fleur) return`, empêchait alors toute cueillette).
  if (!st.fleur && !st.planteArt) return;
  const p = scene.player;
  if (st.planteArt) {
    // La tête de la fleur se détache (au pixel près sur la plante), la
    // plante passe en bouton dans la même image, puis la fleur vole vers
    // Agarica en rapetissant (échelle relative : 0,6 x celle de la plante).
    const img = st.planteGfx;
    const T = A2_PLANTE.tete;
    const s = img.scaleX;
    // Copie de l'image fleurie rognée à la tête, ancrée au centre de la tête
    // (le tween d'échelle la rétrécit sur place, comme l'ancienne fleur).
    const cx = (T.x + T.w / 2) / img.width;
    const cy = (T.y + T.h / 2) / img.height;
    const fx = img.x + (cx - img.originX) * img.width * s;
    const fy = img.y + (cy - img.originY) * img.height * s;
    const fleur = scene.add.image(fx, fy, A2_PLANTE.fleurie).setCrop(T.x, T.y, T.w, T.h)
      .setOrigin(cx, cy).setScale(s);
    storyPutBehindPlayer(scene, fleur);
    img.setTexture(A2_PLANTE.bouton);
    setVisibleBottomY(img, a2PlanteBaseY(scene, st.cfg.x) + A2_PLANTE.sink);
    await a2Tween(scene, { targets: fleur, x: p.x, y: p.y - 60, scale: s * 0.6, duration: 700, ease: 'Sine.easeInOut' });
    await a2Tween(scene, { targets: fleur, alpha: 0, duration: 250 });
    fleur.destroy();
    return;
  }
  await a2Tween(scene, { targets: st.fleur, x: p.x, y: p.y - 60, scale: 0.6, duration: 700, ease: 'Sine.easeInOut' });
  await a2Tween(scene, { targets: st.fleur, alpha: 0, duration: 250 });
  st.fleur.destroy();
  st.fleur = scene.add.graphics({ x: st.cfg.x + 2, y: a2PlanteBaseY(scene, st.cfg.x) - 82 });
  st.fleur.fillStyle(0xff9fc9, 1);
  st.fleur.fillEllipse(0, 0, 10, 14);
  storyPutBehindPlayer(scene, st.fleur);
}

// Ouvre le chemin vers la hutte (sortie + papillons qui montrent la direction).
function a2ClairiereOpenPath(scene, animate) {
  const st = scene.__a2;
  if (st.exitHutte && !scene.__exits.includes(st.exitHutte)) scene.__exits.push(st.exitHutte);
  if (st.gate) { a2DestroyWalls(st.gate); st.gate = null; }
  if (typeof spawnButterflies !== 'function') return;
  const fromX = animate ? st.cfg.x : 2050;
  const list = spawnButterflies(scene, fromX, 300, 5, { radius: 30 });
  butterfliesFlyTo(list, 2120, 330, animate ? 3500 : 10);
}

ZONE_SCRIPTS.acte2_clairiere = {
  create(scene, data) {
    a2Ceiling(scene);
    const cfg = data.plante || { x: 1200, radius: 230 };
    const st = { cfg, arrivalPending: false, gate: null };
    scene.__a2 = st;
    a2InteractReset(scene);
    st.sky = a2SkyWash(scene, 0x9fd3ff, 0.5);
    a2DrawMossCarpet(scene, cfg.x, cfg.radius, scene.levelWidth);
    const picked = !!storyGet('fleurPrelevee');
    a2DrawPlante(scene, cfg.x, a2PlanteBaseY(scene, cfg.x), picked);
    // On arrive en planant : Agarica est déjà en aigle (2e saut consommé).
    const p = scene.player;
    if (a2EnterId(scene) === 'from_ff2' && p.hasEagleForm) {
      p.jumpsUsed = 2;
      p.airJumpForm = 'eagle';
      // Arrivée par le bord : son élan est déjà repris (cf. applyEdgeArrivalState).
      if (!p.body.velocity.x) p.setVelocityX(120);
      st.arrivalPending = !storyGet('clairiereArrivee');
    }
    st.exitHutte = scene.__exits.find((e) => e.targetScene === 'HutteMorgatScene');
    if (!picked && !inventoryHas('fleur_resistante')) {
      scene.__exits = scene.__exits.filter((e) => e !== st.exitHutte);
      // Épaissie vers la hutte (cf. a2Walls : le loup traversait les murs fins).
      st.gate = a2Walls(scene, [{ x: 2200, out: 1 }]);
    } else {
      a2ClairiereOpenPath(scene, false);
    }
    a2AddInteract(scene, {
      x: cfg.x, y: a2PlanteBaseY(scene, cfg.x), h: 120,
      label: () => (storyGet('fleurPrelevee') ? 'E : regarder la plante' : 'E : examiner la plante'),
      onUse: (sc) => {
        if (storyGet('fleurPrelevee')) showDialogue(sc, 'plante_revue');
        else runCutscene(sc, 'plante_prelevement');
      },
    });
  },
  update(scene) {
    const st = scene.__a2;
    if (!st) return;
    const p = scene.player;
    if (st.arrivalPending && p.body.blocked.down) {
      st.arrivalPending = false;
      storySet('clairiereArrivee', true);
      runCutscene(scene, 'clairiere_arrivee');
      return;
    }
    a2HoldWalls(scene, st.gate);
    if (st.gate && p.x > 2120 && scene.time.now > (st.gateToastAt || 0)) {
      st.gateToastAt = scene.time.now + 3000;
      storyBulle(scene, 'xara', 'La plante d\'abord, Agarica.', 2200);
    }
    a2UpdateInteract(scene);
  },
};

// ===========================================================================
// 11. HUTTE DE MORGAT — répulsif, totem de poche, crash
// ===========================================================================
Object.assign(DIALOGUES, {
  morgat_accueil: [
    { who: 'morgat', text: 'Doucement, mes petites, doucement… Elles t\'ont trouvée bien avant que tu me trouves.' },
    { who: 'morgat', text: 'Je suis Morgat. Et toi, tu sens la clairière : tu portes quelque chose que la mousse ne touche pas.' },
  ],
  morgat_sans_fleur: [
    { who: 'morgat', text: 'Mais tu reviens les mains vides. La plante, ma petite : il me faut une de ses fleurs, une seule.' },
  ],
  morgat_fleur: [
    { who: 'agarica', text: 'Une fleur de la plante. Je n\'en ai pris qu\'une, promis. Elle est pour vous.' },
    { who: 'morgat', text: 'Une seule, et cueillie avec respect. Tu as de bonnes mains. Laisse-moi faire.' },
  ],
  morgat_repulsif: [
    { who: 'morgat', text: 'Voilà. Quelques gouttes de ceci, et la mousse recule en sifflant.' },
    { who: 'morgat', text: 'En bas, dans la forêt sombre, un mur de mousse étouffe un vieux passage depuis des lunes. Le sentier, là-bas, y descend.' },
  ],
  morgat_antidote: [
    { who: 'morgat', text: 'Le reste de la fleur, je le garde : il me faut du temps pour un vrai antidote. Pour les bêtes qu\'on peut encore sauver.' },
    { who: 'agarica', text: 'On peut les sauver… Je le savais !' },
  ],
  morgat_totem: [
    { who: 'morgat', text: 'Qu\'est-ce qui dépasse de ta besace ? Un totem de poche, fendu… Regarde mes petites : elles tournent autour.' },
    { who: 'morgat', text: 'Je ne sais pas le réparer. C\'est plus vieux que moi.' },
  ],
  morgat_promesse: [
    { who: 'morgat', text: 'Quand l\'antidote sera prêt, mes papillons te le porteront. Où que tu sois. Même au cœur de la mousse.' },
  ],
  morgat_xara_vol: [
    { who: 'xara', text: 'À pied, il nous faudrait des jours. Mais depuis la falaise, à l\'est, tu pourrais planer droit vers le cœur de la mousse.' },
    { who: 'agarica', text: 'Planer aussi loin ? Je viens à peine d\'apprendre !' },
    { who: 'morgat', text: 'Les apprentis tombent toujours, la première fois. Tâche de tomber sur quelque chose de mou.' },
  ],
  morgat_apres: [
    { who: 'morgat', text: 'L\'antidote mijote. Lui, il ne se presse pas.' },
    { who: 'morgat', text: 'Mes papillons te trouveront, ma petite. Va, maintenant. La falaise est à l\'est.' },
  ],
  hutte_panneau: [
    '« Forêt sombre — en contrebas. » Le sentier dévale la pente entre les racines.',
    { who: 'xara', text: 'Rien à faire là-bas pour l\'instant.' },
  ],
  hutte_sentier: [
    {
      who: 'xara', text: 'Le vieux passage étouffé par la mousse… Avec le répulsif, tu pourrais l\'ouvrir. On descend ?',
      choices: [
        { text: 'Descendre vers la forêt sombre', goto: 'end' },
        { text: 'Pas maintenant', goto: 'end' },
      ],
    },
  ],
  crash_depart: [
    { who: 'agarica', text: 'Bon. La falaise. Le vide. Et la forêt malade, tout au bout. Xara… et si je n\'y arrive pas ?' },
    { who: 'xara', text: 'Alors tu tomberas plus près qu\'en marchant. C\'est déjà ça. Saute, et vise le cœur sombre.' },
  ],
});

CUTSCENES.hutte_arrivee = cutsceneBulles([
  { who: 'agarica', text: 'Tous ces papillons… on dirait des étincelles qui dansent.' },
  'Les papillons de la guérisseuse. Ils l\'ont déjà prévenue de notre arrivée.',
]);
CUTSCENES.hutte_pas_encore = [
  { call: (sc) => storyBulles(sc, ['Pas si vite. Morgat nous attend, et ta fleur ne servira à rien au fond de ta besace.']) },
  { playerMove: { toX: 2420 } },
];

CUTSCENES.morgat_rencontre = (scene) => {
  const steps = [
    { npcFace: { npc: 'morgat', dir: 'player' } },
    { say: 'morgat_accueil' },
  ];
  if (!inventoryHas('fleur_resistante')) {
    return [...steps, { say: 'morgat_sans_fleur' }, { npcAnim: { npc: 'morgat', anim: 'idle' } }];
  }
  steps.push(
    { say: 'morgat_fleur' },
    { take: 'fleur_resistante' },
    { npcAnim: { npc: 'morgat', anim: 'brew' } },
    { call: (sc) => a2MorgatBrew(sc) },
    // Retour à l'idle : la parole (talk) est jouée réplique par réplique par StoryKit.
    { npcAnim: { npc: 'morgat', anim: 'idle' } },
    { say: 'morgat_repulsif' },
    { playerPose: 'receive_item' },
    { give: 'repulsif' },
    { wait: 700 },
    { playerPose: null },
    { say: 'morgat_antidote' },
  );
  if (inventoryHas('totem_poche_casse')) {
    steps.push({ call: (sc) => a2MorgatTotem(sc) }, { say: 'morgat_totem' });
  }
  steps.push(
    { say: 'morgat_promesse' },
    { npcAnim: { npc: 'morgat', anim: 'idle' } },
    { say: 'morgat_xara_vol' },
    { set: { morgatVue: true } },
    { toast: 'La rampe d\'envol est en haut de la falaise, à l\'est →' },
  );
  return steps;
};

// Morgat prépare le répulsif : bulles roses et papillons qui s'affairent.
async function a2MorgatBrew(scene) {
  const m = a2Npc(scene, 'morgat');
  if (!m) return;
  // Bulles peintes `fx_bulle` (anneau irisé, teinté rose ou miel) à la place
  // des ronds pleins ; même taille (2r x 1,2 sur 128 px), mêmes tweens.
  const bubbleArt = scene.textures.exists('item-fx_bulle');
  for (let i = 0; i < 16; i++) {
    const r = Phaser.Math.Between(3, 6);
    const color = i % 2 ? STORY_UI.pink : 0xd0b060;
    const bx = m.x + Phaser.Math.Between(-24, 24);
    const b = (bubbleArt
      ? scene.add.image(bx, m.y - 40, 'item-fx_bulle').setScale((2 * r * 1.2) / 128).setTint(color).setAlpha(0.9)
      : scene.add.circle(bx, m.y - 40, r, color, 0.9)).setDepth(1040);
    scene.tweens.add({ targets: b, y: b.y - 70, alpha: 0, duration: 900, delay: i * 90, onComplete: () => b.destroy() });
  }
  if (typeof spawnButterflies === 'function') {
    const list = spawnButterflies(scene, m.x, m.y - 120, 4, { radius: 30 });
    await a2Wait(scene, 1600);
    butterfliesDisperse(list, 900);
  } else {
    await a2Wait(scene, 1600);
  }
}

// Le totem de poche cassé sort de la besace ; les papillons tournent autour.
async function a2MorgatTotem(scene) {
  const p = scene.player;
  const x = p.x + 24;
  const y = p.y - 120;
  const img = addItemIcon(scene, x, y, 'totem_poche_casse', 44).setDepth(1040).setAlpha(0);
  const glow = a2Glow(scene, x, y, 90, 0xfff2a8, 0, 1039);
  await a2Tween(scene, { targets: img, alpha: 1, duration: 400 });
  scene.tweens.add({ targets: glow, alpha: 0.35, duration: 500, yoyo: true, repeat: 2 });
  let list = [];
  if (typeof spawnButterflies === 'function') list = spawnButterflies(scene, x, y, 4, { radius: 36 });
  await a2Wait(scene, 1800);
  if (list.length) butterfliesDisperse(list, 800);
  await a2Tween(scene, { targets: [img, glow], alpha: 0, duration: 400 });
  img.destroy();
  glow.destroy();
}

// Le premier grand vol : contrôle limité (↑/↓), rafales, puis la chute.
const CRASH_FLIGHT = { controlMs: 3400, vx: 240 };

function a2CrashFlight(scene) {
  return new Promise((resolve) => {
    const p = scene.player;
    if (!p || !p.body) { resolve(); return; }
    const cam = scene.cameras.main;
    if (scene.xara) scene.xara.setVisible(false);
    scene.__playerScripted = true;
    // La chute finale traverse le bas de l'écran : sans ça, la règle `fall`
    // de la zone (cf. updateStoryFall) ramènerait Agarica sur la rampe en lui
    // ôtant un cœur au beau milieu de la cinématique. On quitte la zone juste
    // après, la règle est reposée à la prochaine visite.
    if (scene.__story) scene.__story.fall = null;
    p.body.setCollideWorldBounds(false); // la chute sort franchement de l'écran
    p.setAcceleration(0, 0);
    p.setDrag(0, 0);
    p.body.setAllowGravity(false);
    p.body.maxVelocity.set(1200, 1200);
    if (p.hasEagleForm && FORMS.eagle) {
      p.setForm('eagle');
      if (scene.anims.exists(ANIM_PIAF_GLIDE_KEY)) p.anims.play(ANIM_PIAF_GLIDE_KEY, true);
      p.setFlipX(false);
    }
    const hint = scene.add.text(scene.scale.width / 2, 120, '↑ / ↓ : garde l\'équilibre !', {
      fontFamily: 'sans-serif', fontSize: '18px', color: '#ffe9f5', backgroundColor: '#2a1f45', padding: { x: 10, y: 5 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(2050);
    const t0 = scene.time.now;
    let vy = -420;
    let gustAt = t0 + 900;
    let phase = 'vol';
    let spinAt = 0;
    const up = () => (p.cursors && p.cursors.up.isDown) || (p.keys && p.keys.up && p.keys.up.isDown);
    const down = () => (p.cursors && p.cursors.down.isDown) || (p.keys && p.keys.down && p.keys.down.isDown);
    a2Float(scene, p.x, p.y - 70, 'Je vole ! Xara, je vole !', '#ffe9f5');
    const tick = (time, delta) => {
      if (!p.active || !p.body) { scene.events.off('update', tick); resolve(); return; }
      const dt = Math.min(delta, 50) / 1000;
      const t = time - t0;
      if (phase === 'vol') {
        vy += 320 * dt;
        if (up()) vy -= 760 * dt;
        if (down()) vy += 520 * dt;
        if (time > gustAt) {
          gustAt = time + 700 + Math.random() * 400;
          vy += Phaser.Math.Between(-170, 190);
          cam.shake(160, 0.004);
        }
        vy = Phaser.Math.Clamp(vy, -260, 280);
        p.setVelocity(CRASH_FLIGHT.vx, vy);
        p.setAngle(Math.sin(t / 120) * 10 + vy / 30);
        if (p.y < 60) { p.y = 60; vy = Math.max(vy, 0); }
        if (t > CRASH_FLIGHT.controlMs || p.y > 500) {
          phase = 'chute';
          spinAt = time;
          hint.destroy();
          cam.flash(250, 255, 255, 255);
          cam.shake(500, 0.012);
          a2Float(scene, p.x, p.y - 70, 'Le vent tourne… je ne contrôle plus rien !', '#ffb0b0');
        }
      } else {
        const k = (time - spinAt) / 1000;
        p.setVelocity(CRASH_FLIGHT.vx * 0.8, 120 + k * 520);
        p.setAngle(p.angle + 720 * dt);
        if (k > 1.1) {
          scene.events.off('update', tick);
          cam.flash(300, 230, 255, 200);
          cam.shake(700, 0.03);
          resolve();
        }
      }
    };
    scene.events.on('update', tick);
  });
}

CUTSCENES.crash = [
  { say: 'crash_depart' },
  { playerMove: { toX: 2650 } },
  { playerFace: 'right' },
  { wait: 300 },
  { call: (scene) => a2CrashFlight(scene) },
  { set: { crashDone: true } },
  { fadeOut: 500 },
  { goto: { scene: 'ForetCorrompue1Scene', data: { enterId: 'from_crash' } } },
];

// Hutte, rampe et horizon malade (placeholders dessinés en attendant l'art).
function a2DrawHutte(scene, x) {
  // Bas des murs sur la surface de marche (comme les props), pas 10 px au-dessus.
  const y = storyStandY(scene, x, 448);
  // Le décor Codex `hutte_morgat_hutte_morgat` (donnée de zone) remplace le
  // dessin : on n'ajoute que la lueur chaude de ses fenêtres.
  if ((scene.props || []).some((p) => p.propType === 'hutte_morgat_hutte_morgat')) {
    a2Glow(scene, x, y - 70, 180, 0xffe9a0, 0.3, 3);
    return;
  }
  const g = scene.add.graphics({ x, y });
  // Murs de rondins
  g.fillStyle(0x6b4a36, 1);
  g.fillRoundedRect(-110, -120, 220, 120, 10);
  g.lineStyle(2, 0x4a2f22, 1);
  for (let i = 1; i < 5; i++) g.lineBetween(-110, -120 + i * 24, 110, -120 + i * 24);
  // Toit de chaume arrondi, herbes séchées qui pendent
  g.fillStyle(0x9a7b46, 1);
  g.fillEllipse(0, -130, 280, 110);
  g.fillStyle(0x7f6236, 1);
  g.fillEllipse(0, -150, 200, 70);
  g.lineStyle(3, 0x5fa86f, 1);
  for (let i = -3; i <= 3; i++) g.lineBetween(i * 30, -90, i * 30 + 4, -70);
  // Porte et fenêtres éclairées
  g.fillStyle(0x2a1f15, 1);
  g.fillRoundedRect(-22, -78, 44, 78, { tl: 20, tr: 20, bl: 0, br: 0 });
  g.fillStyle(0xffd27a, 1);
  g.fillCircle(-70, -70, 13);
  g.fillCircle(70, -70, 13);
  // Bocaux sur le rebord
  [[-150, 0x9ad1ff], [-132, 0xff9fc9], [130, 0x8fe3b8], [148, 0xffd27a]].forEach(([dx, c]) => {
    g.fillStyle(c, 0.85);
    g.fillRoundedRect(dx - 7, -22, 14, 22, 4);
  });
  storyPutBehindPlayer(scene, g);
  a2Glow(scene, x - 70, y - 70, 70, 0xffd27a, 0.6, 3);
  a2Glow(scene, x + 70, y - 70, 70, 0xffd27a, 0.6, 3);
  a2Glow(scene, x, y - 40, 160, 0xffe9a0, 0.35, 3);
}

// Rampe d'envol (le « plongeoir ») au bord de la falaise : image du lot 8
// `decor_rampe_lancement`, le bout de sa base d'appui (x 189 du PNG de 439)
// sur `x` (bord de la falaise), la planche en surplomb au-dessus du vide,
// pieds des poteaux sur la ligne de marche. Repli : le dessin. La
// cinématique du crash et son déclencheur ne changent pas.
function a2DrawRampe(scene, x) {
  const y = 256 + GROUND_STAND_SINK;
  if (scene.textures.exists('item-decor_rampe_lancement')) {
    const img = scene.add.image(x, y, 'item-decor_rampe_lancement').setOrigin(189 / 439, 1)
      .setScale((getItemManifest().decor_rampe_lancement || {}).scale || 0.21);
    setVisibleBottomY(img, y + GROUND_CONTACT_SINK);
    storyPutBehindPlayer(scene, img);
    return img;
  }
  const g = scene.add.graphics({ x, y });
  g.fillStyle(0x8a6a3e, 1);
  g.fillRect(-60, -10, 90, 10);
  g.fillRect(-60, -10, 8, 26);
  g.lineStyle(2, 0xc9a26b, 1);
  g.lineBetween(-56, -40, -56, -10);
  g.fillStyle(0xff9fc9, 1);
  g.fillTriangle(-56, -40, -30, -33, -56, -26); // fanion
  storyPutBehindPlayer(scene, g);
}

ZONE_SCRIPTS.acte2_hutte = {
  create(scene, data) {
    a2Ceiling(scene);
    const cfg = data.hutte || { x: 1000, sentierX: 420, rampeX: 2688 };
    scene.__a2 = { cfg };
    a2InteractReset(scene);
    // (L'ancien horizon de forêt malade, une ellipse sombre dessinée par
    // code, est retiré : forme provisoire. La brume du vide est la clé
    // `liquidFloor` de la donnée.)
    a2SkyWash(scene, 0x9fd3ff, 0.5);
    a2DrawHutte(scene, cfg.x);
    a2DrawRampe(scene, cfg.rampeX);
    a2AddInteract(scene, {
      x: cfg.sentierX, y: 448 + GROUND_STAND_SINK, h: 110,
      label: () => (inventoryHas('repulsif') ? 'E : descendre le sentier' : 'E : lire le panneau'),
      onUse: (sc) => a2HutteSentier(sc),
    });
  },
  update(scene) {
    if (!scene.__a2) return;
    a2UpdateInteract(scene);
  },
};

// Sentier optionnel vers la forêt sombre (mur de mousse à ouvrir au répulsif).
async function a2HutteSentier(scene) {
  if (!inventoryHas('repulsif')) {
    await showDialogue(scene, 'hutte_panneau');
    return;
  }
  const r = await showDialogue(scene, 'hutte_sentier');
  if (!r || r.lastChoice !== 0 || !scene.player) return;
  runCutscene(scene, [
    { fadeOut: 500 },
    { goto: { scene: 'ForetSombre2Scene', data: { enterId: 'from_hutte_morgat' } } },
  ]);
}

// ===========================================================================
// 12. FORÊT CORROMPUE 1 — réveil après le crash
// ===========================================================================
Object.assign(DIALOGUES, {
  fc1_reveil_1: [
    { who: 'xara', text: 'Agarica ? … Agarica !' },
    { who: 'agarica', text: 'Mmh… Xara ? J\'ai… atterri ?' },
    { who: 'xara', text: 'On peut appeler ça comme ça. Tu as surtout labouré la mousse avec ton nez.' },
  ],
  fc1_reveil_2: [
    { who: 'agarica', text: 'Où sommes-nous ? Les arbres sont tout tordus… et la mousse respire.' },
    { who: 'xara', text: 'Le cœur de la corruption. Tu n\'as pas atterri où tu voulais… mais tu en es plus près que quiconque.' },
  ],
  fc1_note_geralt: [
    'Un campement abandonné. Sous une pierre, une page arrachée, couverte d\'une écriture pressée.',
    '« Jour 23. La mousse est plus épaisse ici que partout ailleurs. Elle pousse en spirale, autour de quelque chose. »',
    '« Les bêtes malades tournent en rond près de l\'antre. Elles ne mangent plus. Elles gardent. »',
    '« Je n\'irai pas plus loin seul. Clak refuse aussi. »',
    { who: 'xara', text: 'Geralt est venu jusqu\'ici, à pied… et il a vu juste. Les bêtes « gardent ». Reste à savoir quoi.' },
  ],
  fc1_avant_arene: [
    { who: 'agarica', text: 'Ce grondement… On dirait une respiration.' },
    { who: 'xara', text: 'Énorme. Malade. Tout ce que nous avons traversé mène ici.' },
    { who: 'agarica', text: 'Alors j\'y vais. Mais si c\'est une bête malade, je ne veux pas la tuer.' },
  ],
});

CUTSCENES.fc1_reveil = [
  { call: (scene) => a2Fc1WakeUp(scene) },
  { say: 'fc1_reveil_1' },
  { call: (scene) => a2Tween(scene, { targets: scene.player, angle: 0, duration: 450, ease: 'Back.easeOut' }) },
  { wait: 300 },
  { say: 'fc1_reveil_2' },
  { set: { fc1Reveil: true } },
];
CUTSCENES.fc1_ferme = cutsceneBulles((scene) => {
  scene.cameras.main.shake(400, 0.006);
  return [
    { who: 'agarica', text: 'La mousse… elle se referme derrière moi !' },
    'Elle nous sent. Ne reste pas immobile. Avance.',
  ];
});
CUTSCENES.fc1_amas = cutsceneBulles([
  'Un amas de mousse, dur comme de l\'écorce. Il bouche toute la galerie.',
  { who: 'agarica', text: 'La force de l\'ours devrait suffire.' },
], { text: 'Compétence de l\'ours (touche A, F ou R) : brise l\'amas. Le feu de camp recharge ton énergie.', ms: 4200 });
CUTSCENES.fc1_note_geralt = [{ wait: 300 }, { say: 'fc1_note_geralt' }];
CUTSCENES.fc1_papillons = cutsceneBulles((scene) => {
  a2Fc1Butterflies(scene, true);
  const lignes = [{ who: 'agarica', text: 'Des papillons ! Ceux de Morgat… Ils m\'ont suivie jusqu\'ici ?' }];
  if (inventoryHas('totem_poche_casse')) {
    scene.time.delayedCall(3200, () => { if (scene.sys.isActive()) a2Fc1TotemPulse(scene); });
    lignes.push({ who: 'agarica', text: 'Et le totem de poche… il est tiède, dans ma besace.' });
    lignes.push('Ils le reconnaissent. Ou lui les reconnaît. Garde-le près de toi.');
  }
  return lignes;
}, null, 1200);
CUTSCENES.fc1_spirale = cutsceneBulles([
  { who: 'agarica', text: 'Xara, regarde ce tronc. Une spirale gravée… On dirait une toile.' },
  '… Ne la touche pas.',
  'Ce n\'est pas le moment. Avance, Agarica.',
]);
CUTSCENES.fc1_mur = cutsceneBulles([
  'Un mur vivant. Il ne cédera ni à tes coups, ni à l\'ours.',
  { who: 'agarica', text: 'Le répulsif de Morgat ! Quelques gouttes, elle a dit…' },
], 'E devant le mur : verser le répulsif');
CUTSCENES.fc1_avant_arene = [{ shake: { ms: 900, intensity: 0.004 } }, { say: 'fc1_avant_arene' }];

// Réveil : allongée dans le cratère, le noir se lève lentement.
async function a2Fc1WakeUp(scene) {
  const p = scene.player;
  p.setAngle(-85);
  const { width, height } = scene.scale;
  const black = scene.add.rectangle(0, 0, width, height, 0x000000, 1).setOrigin(0).setScrollFactor(0).setDepth(2400);
  await a2Wait(scene, 700);
  await a2Tween(scene, { targets: black, alpha: 0, duration: 1800 });
  black.destroy();
}

function a2Fc1Butterflies(scene, fromAfar) {
  if (typeof spawnButterflies !== 'function') return;
  const p = scene.player;
  const list = spawnButterflies(scene, fromAfar ? p.x - 420 : p.x, p.y - 120, 3, { radius: 24 });
  butterfliesFollow(list, p, { offsetY: -80, radius: 34 });
  scene.__a2.butterflies = list;
}

async function a2Fc1TotemPulse(scene) {
  const p = scene.player;
  const glow = a2Glow(scene, p.x, p.y - 40, 40, 0xfff2a8, 0, 1039);
  await a2Tween(scene, { targets: glow, alpha: 0.7, displayWidth: 120, displayHeight: 120, duration: 500, yoyo: true });
  glow.destroy();
}

// Cratère du crash + branches cassées : image `decor_cratere` du lot 8 (le
// creux et les branches sont peints), fond du creux (y 185 du PNG de 280)
// sur la ligne de marche, là où Agarica se réveille. Repli : le dessin.
function a2DrawCrater(scene, x) {
  const y = storyGroundY(scene, x, 448) + GROUND_STAND_SINK;
  if (scene.textures.exists('item-decor_cratere')) {
    const img = scene.add.image(x, y, 'item-decor_cratere').setOrigin(0.5, 185 / 280)
      .setScale((getItemManifest().decor_cratere || {}).scale || 0.2);
    storyPutBehindPlayer(scene, img);
    return img;
  }
  const g = scene.add.graphics();
  g.fillStyle(0x1a2614, 1);
  g.fillEllipse(x, y + 2, 200, 26);
  g.fillStyle(0x3e7a2c, 1);
  g.fillEllipse(x - 100, y - 4, 50, 18);
  g.fillEllipse(x + 104, y - 6, 60, 22);
  g.lineStyle(4, 0x5a4630, 1);
  g.lineBetween(x - 60, y - 6, x - 110, y - 40);
  g.lineBetween(x + 50, y - 4, x + 90, y - 50);
  storyPutBehindPlayer(scene, g);
}

// Arbre marqué d'une spirale (Xara la reconnaît sans rien dire).
function a2DrawSpiralTree(scene, x) {
  const y = storyGroundY(scene, x, 448) + GROUND_STAND_SINK;
  // Le tronc est le décor `foret_corrompue_arbre_malade` (donnée de zone) :
  // on ne dessine plus que la spirale gravée, à mi-hauteur de son tronc.
  const tree = (scene.props || []).find((pr) => pr.propType === 'foret_corrompue_arbre_malade' && Math.abs(pr.x - x) < 80);
  const sy = tree ? y + 70 : y;
  const g = scene.add.graphics({ x, y: sy });
  if (!tree) {
    g.fillStyle(0x3b3026, 1);
    g.fillRect(-26, -330, 52, 330);
  }
  // Spirale peinte du lot 8 (`decor_spirale_gravee`, violette, rayons en
  // pointes) à la place du tracé ; repli : le tracé.
  let spiral = g;
  if (scene.textures.exists('item-decor_spirale_gravee')) {
    spiral = scene.add.image(x, sy - 150, 'item-decor_spirale_gravee')
      .setScale((getItemManifest().decor_spirale_gravee || {}).scale || 0.15);
  } else {
    g.lineStyle(3, 0xb48cff, 0.9);
    g.beginPath();
    for (let i = 0; i <= 60; i++) {
      const a = i * 0.32;
      const r = 2 + i * 0.32;
      const px = Math.cos(a) * r;
      const py = -150 + Math.sin(a) * r;
      if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
    }
    g.strokePath();
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      g.lineBetween(0, -150, Math.cos(a) * 22, -150 + Math.sin(a) * 22);
    }
  }
  storyPutBehindPlayer(scene, g);
  // Gravée SUR le tronc : placée juste devant le décor de l'arbre dans la
  // liste d'affichage (toujours derrière les personnages, plus profonds).
  // Glissée seulement sous le joueur, la spirale a fini derrière le tronc
  // (capture d'avant le lot 8 : on n'en voyait qu'un bout d'arc).
  if (tree) a2PlaceAbove(scene, spiral, tree);
  else if (spiral !== g) storyPutBehindPlayer(scene, spiral);
  const glow = a2Glow(scene, x, sy - 150, 90, 0xb48cff, 0.25, 3);
  scene.tweens.add({ targets: glow, alpha: 0.05, duration: 1600, yoyo: true, repeat: -1 });
}

// Touffes de mousse vivante qui se tendent vers Agarica : touffes peintes du
// lot 8 (petite, moyenne, grande en alternance, mêmes hauteurs que le dessin
// d'avant : 26, 38 et 50 px), pied planté 2 px dans l'herbe ; origine au
// pied, la rotation d'a2UpdateMossTufts pivote donc autour de lui. Repli :
// les triangles dessinés.
const A2_TOUFFES = ['decor_touffe_mousse_petite', 'decor_touffe_mousse_moyenne', 'decor_touffe_mousse_grande'];
// Variante penchée (option H13, image du lot 8 jusque-là jamais affichée) :
// quand Agarica est tout près (< 40 px), la touffe se courbe vers elle --
// `decor_touffe_mousse_penchee` (courbée vers la droite, pied à 40 % de sa
// largeur ; 60 % retournée). Fondu enchaîné avec la touffe droite (~150 ms)
// plutôt qu'une bascule : pas de saut. Hauteur : 80 % de la touffe droite
// (une tige courbée est plus basse), jamais plus haute qu'elle.
const A2_TOUFFE_PENCHEE = 'decor_touffe_mousse_penchee';
const A2_TOUFFE_BEND_PX = 40;
const A2_TOUFFE_BEND_MS = 150;

function a2MakeMossTufts(scene, xs) {
  const bendArt = scene.textures.exists(`item-${A2_TOUFFE_PENCHEE}`);
  return xs.map((x, i) => {
    const id = A2_TOUFFES[i % 3];
    if (scene.textures.exists(`item-${id}`)) {
      const foot = storyStandY(scene, x, 448) + 2;
      const img = scene.add.image(x, foot, `item-${id}`).setOrigin(0.5, 1)
        .setScale((getItemManifest()[id] || {}).scale || 0.18);
      setVisibleBottomY(img, foot);
      storyPutBehindPlayer(scene, img);
      let bent = null;
      if (bendArt) {
        bent = scene.add.image(x, foot, `item-${A2_TOUFFE_PENCHEE}`).setOrigin(0.4, 1).setAlpha(0);
        bent.setScale((img.displayHeight * 0.8) / bent.height);
        setVisibleBottomY(bent, foot);
        storyPutBehindPlayer(scene, bent);
      }
      return { g: img, bent, bendK: 0, x, phase: i * 0.7, size: i % 3 };
    }
    // Pied 2 px sous la ligne de marche (cf. GROUND_STAND_SINK), planté dans l'herbe.
    const y = storyGroundY(scene, x, 448) + GROUND_STAND_SINK + 2;
    const g = scene.add.graphics({ x, y });
    const h = 26 + (i % 3) * 12;
    g.fillStyle(0x2f5a2a, 1);
    g.fillTriangle(-9, 0, 9, 0, 0, -h);
    g.fillStyle(0x3e7a2c, 1);
    g.fillTriangle(-5, 0, 5, 0, 2, -h * 0.7);
    g.fillStyle(0x9bff5a, 0.85);
    g.fillCircle(0, -h, 3);
    storyPutBehindPlayer(scene, g);
    return { g, x, phase: i * 0.7, size: i % 3 };
  });
}

function a2UpdateMossTufts(scene, time) {
  const p = scene.player;
  const step = Math.min(1, (scene.game.loop.delta || 16) / A2_TOUFFE_BEND_MS);
  for (const t of scene.__a2.tufts || []) {
    const dx = p.x - t.x;
    const sway = Math.sin(time / 500 + t.phase) * 0.08;
    const lean = Math.abs(dx) < 200 ? Phaser.Math.Clamp(dx / 200, -1, 1) * 0.6 : 0;
    t.g.rotation = lean + sway;
    if (!t.bent) continue;
    // Tout près : la touffe penchée (déjà courbée, elle ne garde que le
    // balancement), tournée vers Agarica, prend la place de la droite.
    const near = Math.abs(dx) < A2_TOUFFE_BEND_PX;
    t.bendK = Phaser.Math.Clamp(t.bendK + (near ? step : -step), 0, 1);
    if (near) t.bent.setFlipX(dx < 0).setOrigin(dx < 0 ? 0.6 : 0.4, 1);
    t.bent.rotation = sway;
    t.bent.setAlpha(t.bendK);
    t.g.setAlpha(1 - t.bendK);
  }
}

// La mousse se referme derrière Agarica (cosmétique + collision).
function a2Fc1CloseBehind(scene, animate) {
  const x = 420;
  const h = 260;
  const y = storyGroundY(scene, x, 448) - h / 2 + GROUND_STAND_SINK;
  const v = drawMossVisual(scene, x, y, 90, h, 'mousse_mur', true);
  addMossBody(scene, x, y, 90, h);
  if (animate) {
    v.setScale(1, 0.05);
    scene.tweens.add({ targets: v, scaleY: 1, duration: 900, ease: 'Back.easeOut' });
  }
}

ZONE_SCRIPTS.acte2_fc1 = {
  create(scene, data) {
    a2Ceiling(scene);
    scene.__a2 = { tufts: [], butterflies: null };
    a2InteractReset(scene);
    a2DrawCrater(scene, 170);
    a2DrawSpiralTree(scene, 2470);
    // Pas de touffe collée à un feu de camp (celle de x 3717 se tendait
    // dans les flammes) : 48 px de marge autour des feux de la donnée.
    const fires = ((data && data.campfires) || []).map((c) => c.x);
    const xs = [];
    for (let x = 300; x < 4000; x += 150 + (x % 7) * 9) {
      if (Math.abs(x - 1824) > 120 && Math.abs(x - 3200) > 90 && fires.every((fx) => Math.abs(x - fx) >= 48)) xs.push(x);
    }
    scene.__a2.tufts = a2MakeMossTufts(scene, xs);
    if (storyGet('fc1MousseFermee')) a2Fc1CloseBehind(scene, false);
    if (storyGet('trig_foret_corrompue_1_papillons')) a2Fc1Butterflies(scene, false);
    if (a2EnterId(scene) === 'from_crash' && !storyGet('fc1Reveil')) {
      runCutscene(scene, 'fc1_reveil');
    }
  },
  update(scene, time) {
    const st = scene.__a2;
    if (!st) return;
    a2UpdateMossTufts(scene, time);
    // Points de réapparition (mort = cœurs à 0) : passé le mur de mousse qui
    // se referme (x 420), puis aux deux feux de camp. Sans ça, une mort
    // ramenait au cratère, DERRIÈRE le mur refermé : coincée pour de bon
    // (trouvé au clavier simulé, chemin critique).
    acte1RespawnAfter(scene, [{ x: 700, y: 448 }, { x: 1400, y: 448 }, { x: 3700, y: 448 }]);
    if (!storyGet('fc1MousseFermee') && scene.player.x > 640 && scene.player.x < 1000) {
      storySet('fc1MousseFermee', true);
      a2Fc1CloseBehind(scene, true);
      runCutscene(scene, 'fc1_ferme');
    }
  },
};

// ===========================================================================
// 13-15. ARÈNE DE GHIL'T ET TROU SOMBRE — dialogues réécrits pour l'acte 2
// (la logique reste dans src/story/boss_ghilt.js, chargé avant ce fichier)
// ===========================================================================
Object.assign(DIALOGUES, {
  ghilt_intro: [
    { who: 'ghilt', text: 'GRRRROOOOAAAAH !' },
    { who: 'agarica', text: 'Un tapir… gigantesque. La mousse lui coule du museau comme de la bave.' },
    { who: 'xara', text: 'Ghil\'t, le Fléau de la Forêt. Méfie-toi de ses charges, de son souffle… et de ce qu\'il crache !' },
    { who: 'agarica', text: 'Il souffre, Xara. Je ne fuirai pas… mais je ne veux pas le tuer.' },
  ],
  ghilt_chute: [
    { who: 'xara', text: 'Il aspire toute la mousse de l\'arène… Agarica, recule !' },
    { who: 'agarica', text: 'Le sol… il tremble, je n\'arrive plus à —' },
    { who: 'ghilt', text: 'HHHHHHHHHH…' },
  ],
  ghilt_retour: [
    { who: 'agarica', text: 'Ghil\'t ! Je suis revenue.' },
    { who: 'xara', text: 'Affaiblis-le, sans l\'achever. Quand il vacillera, laisse les papillons faire le reste.' },
    { who: 'agarica', text: 'Cette fois, je ne viens pas te combattre. Je viens te soigner.' },
  ],
  trou_reveil: [
    { who: 'agarica', text: '… Où suis-je ? Il fait si noir… Ghil\'t était trop fort.' },
    { who: 'xara', text: 'Chut. Respire. Regarde, là-haut… tu vois ces petites lumières ?' },
  ],
  trou_papillons: [
    { who: 'agarica', text: 'Des papillons… ce sont ceux de Morgat !' },
    { who: 'xara', text: '« Où que tu sois », avait-elle dit. Ils ont tenu parole.' },
    { who: 'agarica', text: 'Ils portent quelque chose, tout doucement… Un bocal ! L\'antidote est prêt !' },
  ],
  trou_totem: [
    { who: 'agarica', text: 'Il y en a si peu… Je devrais le boire ? Ou le lancer sur Ghil\'t ?' },
    { who: 'xara', text: 'Ni l\'un ni l\'autre. Ton totem de poche brille depuis que les papillons sont là : verse l\'antidote dedans.' },
    { who: 'agarica', text: 'Comment tu sais ça, toi ?' },
    { who: 'xara', text: 'Disons que j\'ai déjà vu de vieilles choses se réveiller. Doucement, maintenant.' },
  ],
  trou_sortie: [
    { who: 'agarica', text: 'Le totem est tout chaud… Je sens les papillons, comme s\'ils faisaient partie de moi.' },
    { who: 'xara', text: 'Ils te prêtent leur force : soigner au lieu de détruire. Affaiblis Ghil\'t, puis laisse-les faire.' },
    { who: 'agarica', text: 'Ils montent vers la lumière… Ils nous montrent le chemin.' },
  ],
  ghilt_soin: [
    { who: 'agarica', text: 'Regarde, Xara… la mousse se retire ! Il respire, doucement.' },
    { who: 'agarica', text: 'Tu n\'étais pas un monstre. Tu étais malade, comme la forêt.' },
    { who: 'xara', text: 'Cette marque, sur son flanc… Rien. Plus tard.' },
  ],
  ghilt_amanite: [
    { who: 'agarica', text: 'Amanite ?! NON !' },
    { who: 'amanite', text: 'Recule, Agarica. C\'est fini. Le Fléau ne fera plus de mal à personne.' },
    { who: 'agarica', text: 'Il était guéri ! La mousse était partie… il respirait, tu l\'as vu !' },
    { who: 'amanite', text: 'J\'ai vu une bête qui reprenait des forces. La mauvaise herbe, ça repousse.' },
    { who: 'agarica', text: 'Tu viens de détruire la seule preuve qu\'on pouvait les sauver…', pose: 'sad' },
    { who: 'amanite', text: 'J\'ai sauvé le bosquet. Toi, tu jouais avec des papillons.' },
    { who: 'amanite', text: 'Je rentre leur annoncer la nouvelle. Eux, au moins, sauront qui remercier.' },
  ],
  ghilt_geralt: [
    { who: 'geralt', text: 'Par toutes les racines… j\'arrive trop tard, hein ?' },
    { who: 'agarica', text: 'Geralt… je l\'avais soigné. Amanite l\'a achevé sous mes yeux.' },
    { who: 'geralt', text: 'J\'ai vu la mousse reculer. Ça, petite, personne ne l\'avait jamais fait. Il était malade, pas la maladie : la source est ailleurs.' },
    { who: 'geralt', text: 'Viens. On rentre au bosquet. Ton père doit entendre la vérité… de ma bouche, s\'il le faut.' },
  ],
});

// ===========================================================================
// 16. RETOUR AU BOSQUET — fin de la démo
// ===========================================================================
const ORME = 'Orme, le vieux druide';

Object.assign(DIALOGUES, {
  br_acclamations: [
    { who: 'habitant', name: ORME, text: 'Amanite a terrassé le Fléau de la Forêt ! Et elle nous a rapporté l\'idole !' },
    { who: 'habitant', text: 'Vive Amanite !' },
    { who: 'amanite', text: 'Je vous l\'avais promis. Il fallait frapper, et j\'ai frappé. La forêt respire.' },
    { who: 'pere_chef', text: 'Tu as rapporté l\'idole… Le bosquet t\'en doit beaucoup, Amanite.' },
  ],
  br_garde: [
    { who: 'garde', text: 'Halte ! Agarica ? Tu es bannie, tu n\'as rien à faire ici !' },
    { who: 'geralt', text: 'Elle est avec moi. Range ta lance, mon garçon, avant de te piquer avec.' },
    { who: 'garde', text: 'Et vous êtes qui, vous ?' },
    { who: 'geralt', text: 'Quelqu\'un que ton chef connaît depuis bien avant ta naissance.' },
  ],
  br_geralt_chef: [
    { who: 'pere_chef', text: '… Geralt ? Vieille racine ! Ça fait dix hivers !' },
    { who: 'geralt', text: 'Onze. Et ta barbe a blanchi, ma vieille branche.' },
    { who: 'clak', text: 'Clac !' },
    { who: 'pere_chef', text: 'Et Clak, toujours aussi bavard. Que fais-tu ici… avec ma fille ?' },
  ],
  br_verite: [
    { who: 'geralt', text: 'Je viens rétablir la vérité. J\'étais à l\'antre du Fléau. J\'ai tout vu.' },
    { who: 'geralt', text: 'Agarica a affaibli Ghil\'t sans jamais l\'achever. Puis, avec les papillons de la guérisseuse, elle l\'a guéri.' },
    { who: 'geralt', text: 'La mousse a quitté son corps. Il respirait en paix, comme une bête qui sort d\'une longue fièvre.' },
    { who: 'geralt', text: 'Et c\'est là qu\'Amanite est arrivée. Elle a achevé une créature guérie.' },
    'Un murmure parcourt le bosquet.',
  ],
  br_amanite_confrontation: [
    { who: 'pere_chef', text: 'Amanite… Est-ce vrai ?' },
    { who: 'amanite', text: 'Guéri ? Pour combien de temps ? Une bête pareille aurait recommencé !' },
    { who: 'amanite', text: 'J\'ai fait ce que personne ici n\'osait faire. Vous grattiez la mousse ; moi, je l\'ai frappée au cœur.' },
    { who: 'agarica', text: 'Il n\'avait plus de mousse, Amanite. Il respirait. J\'avais trouvé un moyen de les sauver…' },
    { who: 'amanite', text: 'Un moyen ! Des papillons ! Et la prochaine bête, tu la berceras aussi ?' },
  ],
  br_chef_jugement: [
    { who: 'pere_chef', text: 'Tu as volé l\'idole. Tu as laissé ma fille porter ton mensonge, et partir seule dans la nuit.' },
    { who: 'pere_chef', text: 'Et aujourd\'hui, tu voudrais qu\'on t\'acclame pour avoir tué une créature qu\'elle venait de sauver.' },
    { who: 'pere_chef', text: 'Le bosquet te remercie d\'avoir rapporté l\'idole. Mais il ne te doit rien d\'autre, Amanite.' },
  ],
  br_amanite_colere: [
    { who: 'amanite', text: 'Très bien. Gardez vos papillons et vos prières.' },
    { who: 'amanite', text: 'Cette pierre ne vous a jamais protégés. Je l\'ai rapportée… je reprends ma part.' },
  ],
  br_amanite_depart: [
    { who: 'habitant', name: ORME, text: 'Elle a brisé l\'idole !' },
    { who: 'amanite', text: 'Quand la mousse reviendra — et elle reviendra — vous saurez où me trouver.' },
    { who: 'agarica', text: 'Amanite, attends ! On peut encore…' },
    { who: 'amanite', text: 'Non, Agarica. Toi, tu soignes. Moi, je finis le travail.' },
  ],
  br_apres: [
    { who: 'agarica', text: '…', pose: 'sad' },
    { who: 'pere_chef', text: 'Agarica. Je t\'ai bannie pour un mensonge. Je n\'avais pas su voir le reste.' },
    { who: 'pere_chef', text: 'Tu es partie sans rien connaître du monde. Tu reviens avec un remède… et avec la vérité.' },
    { who: 'agarica', text: 'Père… je voulais seulement la protéger. Elle, et la forêt.' },
    { who: 'pere_chef', text: 'Je sais. Ce soir, ma fille, tu dormiras chez toi.', pose: null },
  ],
  br_geralt_source: [
    { who: 'geralt', text: 'Pas de fête trop longue, mes amis. Ghil\'t n\'était pas la source de la mousse.' },
    { who: 'geralt', text: 'C\'était une victime. Un relais, peut-être. La mousse vient de plus profond, et elle pousse encore.' },
    { who: 'geralt', text: 'J\'ai la carte pour le prouver… enfin, une partie de la carte.' },
    { who: 'clak', text: 'Clac.' },
    { who: 'geralt', text: 'Oui. La partie que tu n\'as pas mangée.' },
  ],
  br_xara_symbole: [
    { who: 'agarica', text: 'Xara ? Tu es bien silencieuse.' },
    { who: 'xara', text: 'Sur le flanc de Ghil\'t, sous la mousse… il y avait une marque. Une spirale, comme dans la forêt.' },
    { who: 'agarica', text: 'Tu la connais, n\'est-ce pas ?' },
    { who: 'xara', text: '…' },
    { who: 'xara', text: 'Il est tard, Agarica. Profite de ta maison, ce soir.' },
  ],
  br_cochons: [
    { who: 'agarica', text: 'Oh ! Vous trois ! Vous m\'avez attendue ?' },
    'Les trois bébés cochons trottinent autour d\'elle, comme si elle n\'était jamais partie.',
  ],
  br_final: [
    { who: 'agarica', text: 'La forêt est encore malade. Amanite est quelque part, là-dehors, avec un morceau de l\'idole…' },
    { who: 'agarica', text: 'Je la retrouverai. Et je trouverai d\'où vient la mousse. Promis.' },
  ],
  bosquet_retour_garde: [{ who: 'garde', text: 'Pardon pour tout à l\'heure, Agarica. Bon retour chez toi.' }],
  bosquet_retour_porteur: [{ who: 'habitant', text: 'Des papillons qui soignent… Si on m\'avait dit ça hier, j\'aurais ri.' }],
  bosquet_retour_druide: [{ who: 'habitant', name: ORME, text: 'Je te l\'avais dit : la forêt n\'est pas toujours cruelle. Elle t\'a ramenée, petite.' }],
  bosquet_retour_chef: [{ who: 'pere_chef', text: 'Repose-toi, ma fille. Demain, nous parlerons de la suite.' }],
  bosquet_retour_geralt: [{ who: 'geralt', text: 'La carte est à jour. Enfin, presque : Clak a mangé le coin sud.' }],
  bosquet_retour_clak: [{ who: 'clak', text: 'Clac !' }],
});

CUTSCENES.bosquet_retour = [
  { wait: 400 },
  // y explicite : hors du sol (x < 64), storyStandY n'y trouve aucune tuile.
  // Pieds à hauteur de marche (haut de la hitbox des tuiles, cf.
  // GROUND_STAND_SINK : 464 avec le jeu 'floor', 448 avec 'tuiles').
  { npcAdd: { id: 'geralt', x: 20, y: 448 + GROUND_STAND_SINK } },
  { npcAdd: { id: 'clak', x: -30, y: 448 + GROUND_STAND_SINK } },
  { parallel: [
    { playerMove: { toX: 560, speed: 150 } },
    { npcMove: { npc: 'geralt', toX: 470, speed: 150 } },
    { npcMove: { npc: 'clak', toX: 420, speed: 150 } },
  ] },
  { playerFace: 'right' },
  { camera: { x: 1260, y: 270, ms: 1200 } },
  { say: 'br_acclamations' },
  { npcAnim: { npc: 'amanite', anim: 'idle' } },
  { cameraFollow: true },
  { npcMove: { npc: 'habitant_garde', toX: 650, speed: 200 } },
  { npcFace: { npc: 'habitant_garde', dir: 'player' } },
  { say: 'br_garde' },
  { npcMove: { npc: 'pere_chef', toX: 760, speed: 140 } },
  { npcFace: { npc: 'pere_chef', dir: 'player' } },
  { say: 'br_geralt_chef' },
  { say: 'br_verite' },
  { npcMove: { npc: 'amanite', toX: 900, speed: 160 } },
  { npcFace: { npc: 'amanite', dir: 'player' } },
  { say: 'br_amanite_confrontation' },
  { npcFace: { npc: 'pere_chef', dir: 'right' } },
  { say: 'br_chef_jugement' },
  { say: 'br_amanite_colere' },
  { npcAnim: { npc: 'amanite', anim: 'walk_angry' } },
  { npcMove: { npc: 'amanite', toX: 1520, speed: 220 } },
  { call: (scene) => a2BreakIdol(scene) },
  { say: 'br_amanite_depart' },
  { npcAnim: { npc: 'amanite', anim: 'walk_angry' } },
  { npcMove: { npc: 'amanite', toX: 2000, speed: 230 } },
  { npcRemove: 'amanite' },
  { cameraFollow: true },
  { npcFace: { npc: 'pere_chef', dir: 'player' } },
  { say: 'br_apres' },
  { say: 'br_geralt_source' },
  { say: 'br_xara_symbole' },
  { call: (scene) => a2PigletsGather(scene) },
  { say: 'br_cochons' },
  { playerFace: 'right' },
  { say: 'br_final' },
  { fadeOut: 1500 },
  { set: { demoFinished: true } },
  { goto: 'EndScreenScene' },
];

CUTSCENES.bosquet_retour_revoir_fin = [{ fadeOut: 800 }, { goto: 'EndScreenScene' }];

// L'idole sur son autel (prop `bosquet_antler_totem`, posée sur son haut
// visible), et le fragment qu'Amanite emporte.
const A2_IDOLE = { x: 1560, y: 330, autel: 'bosquet_antler_totem' };
function a2DrawIdol(scene) {
  const st = scene.__a2;
  st.idol = storyPlaceOnProp(scene, addItemIcon(scene, 0, 0, 'idole', 44), A2_IDOLE.x, A2_IDOLE.autel, A2_IDOLE.y);
  storyPutBehindPlayer(scene, st.idol);
  st.idolGlow = a2Glow(scene, st.idol.x, st.idol.y, 110, 0x8fe3b8, 0.35, 3);
}

async function a2BreakIdol(scene) {
  const st = scene.__a2;
  const a = a2Npc(scene, 'amanite');
  if (!st.idol || !a) return;
  setNpcFacing(a, 1);
  a.playManifest('spear_thrust', false);
  await a2Wait(scene, 250);
  scene.cameras.main.flash(200, 180, 255, 200);
  scene.cameras.main.shake(250, 0.008);
  st.idol.setTint(0x9aa89a);
  if (st.idolGlow) st.idolGlow.setAlpha(0.1);
  const frag = addItemIcon(scene, st.idol.x, st.idol.y - 12, 'idole_fragment', 26).setDepth(1040);
  await a2Tween(scene, { targets: frag, x: a.x, y: a.y - 50, duration: 500, ease: 'Quad.easeOut' });
  await a2Tween(scene, { targets: frag, alpha: 0, duration: 250 });
  frag.destroy();
  a.playManifest('idle');
  await showDialogue(scene, 'br_amanite_colere_fin');
}
DIALOGUES.br_amanite_colere_fin = ['Amanite arrache un éclat de la couronne de l\'idole et le serre dans son poing.'];

// Les trois bébés cochons rejoignent Agarica (clin d'œil au début de l'histoire).
async function a2PigletsGather(scene) {
  const p = scene.player;
  if (typeof spawnPiglets !== 'function') return;
  const already = scene.animals && scene.animals.cochons && scene.animals.cochons.some((c) => c.active && Math.abs(c.x - p.x) < 260);
  if (!already) spawnPiglets(scene, p.x + 90, storyGroundY(scene, p.x + 90, 448), { w: 140 });
  await a2Wait(scene, 600);
}

ZONE_SCRIPTS.acte2_bosquet_retour = {
  create(scene) {
    scene.__a2 = {};
    a2InteractReset(scene);
    a2DrawIdol(scene);
    if (storyGet('demoFinished')) {
      // Revisite après la fin : Geralt et Clak sont restés au bosquet.
      for (const n of [
        { id: 'geralt', x: 470, talk: 'bosquet_retour_geralt' },
        { id: 'clak', x: 420, talk: 'bosquet_retour_clak' },
      ]) {
        a2RegisterNpc(scene, createStoryNpc(scene, n));
      }
      if (scene.__a2.idol) scene.__a2.idol.setTint(0x9aa89a);
      return;
    }
    runCutscene(scene, 'bosquet_retour');
  },
  update() {},
};
