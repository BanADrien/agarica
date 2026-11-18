// Monde V2 : histoire du Bosquet d'Émeraude (village, source, hauts, caves).
// Conception : docs/production/PLAN_MONDE_V2.md § 2 et § 7. Contrat : PLAN_DEV.md,
// section « Monde V2 : le Bosquet ». Les cinématiques de l'ancien bosquet
// (src/story/acte1.js) sont réutilisées telles quelles, jamais modifiées.
//
// Drapeaux posés ici : v2SourceLibree, v2Nuit, v2PorteCavesOuverte ; ceux de
// l'ancienne version gardent leur sens : talismanOurs, idoleVolee,
// amaniteCouverte, banished.

// ---------------------------------------------------------------------------
// Lancement depuis l'écran-titre (« Zones de test »)
// ---------------------------------------------------------------------------
function mondeV2Lancer(titre, { recommencer = false } = {}) {
  saveSlotViderRegistre(titre.game);
  mondeV2Basculer(true);
  if (recommencer) resetGame(titre.game);
  if (loadGame(titre.game) && storyGet('lastZone')) {
    const entry = storyZoneEntry(storyGet('lastZone')) || MONDE_V2_ZONES[0];
    const enterId = storyGet('lastEnterId');
    goToScene(titre, entry.scene, enterId ? { enterId } : {});
    return;
  }
  goToScene(titre, 'PrologueScene', { suite: 'V2VillageScene' });
}

async function mondeV2Recommencer(titre) {
  const ok = await menuConfirm(titre, {
    title: 'Monde V2', text: 'Effacer la partie du monde V2 et recommencer ?\nL\'ancienne version ne bouge pas.',
    yes: 'Recommencer', no: 'Annuler',
  });
  if (ok) mondeV2Lancer(titre, { recommencer: true });
}

LEGACY_TEST_ZONES.push({
  scene: 'V2VillageScene',
  get name() { return mondeV2ASauvegarde() ? 'Monde V2 (chantier) : reprendre' : 'Monde V2 (chantier)'; },
  lancer: (titre) => mondeV2Lancer(titre),
});
LEGACY_TEST_ZONES.push({
  scene: 'V2VillageScene', name: 'Monde V2 : recommencer',
  visible: () => mondeV2ASauvegarde(),
  lancer: (titre) => mondeV2Recommencer(titre),
});

// ---------------------------------------------------------------------------
// Pièces communes aux zones du bosquet (provisoires, dessinées par code)
// ---------------------------------------------------------------------------
function v2Visite(scene) {
  if (!scene.__v2 || scene.__v2.visit !== scene.__storyVisit) {
    scene.__v2 = { visit: scene.__storyVisit, mousses: [], ronces: [] };
  }
  return scene.__v2;
}

// Mousse toxique suspendue : `v2Mousses: [{ x, y, w, h }]` (x, y = coin haut gauche).
// Solide nulle part : la toucher coûte un cœur.
LEVEL_DATA_HANDLERS.v2Mousses = (scene, list) => {
  const v = v2Visite(scene);
  for (const m of list || []) {
    const g = scene.add.graphics();
    g.lookRole = 'prop';
    g.fillStyle(0x1d3a1a, 1).fillRect(m.x, m.y, m.w, m.h - 22);
    const rnd = new Phaser.Math.RandomDataGenerator([`mousse${m.x},${m.y}`]);
    for (let x = m.x + 8; x < m.x + m.w; x += 22) {
      const len = rnd.realInRange(10, 22);
      g.fillStyle(0x3e7a2c, 1).fillTriangle(x - 11, m.y + m.h - 24, x + 11, m.y + m.h - 24, x, m.y + m.h - 24 + len);
      g.fillStyle(0x9bff5a, 0.9).fillCircle(x, m.y + m.h - 26 + len * 0.6, 2);
    }
    storyPutBehindPlayer(scene, g);
    v.mousses.push(new Phaser.Geom.Rectangle(m.x, m.y, m.w, m.h));
  }
};

// Haie de ronces (`breakables` avec `ronces: true`) : un voile d'épines sur les cases.
function v2PoserRonces(scene) {
  const v = v2Visite(scene);
  for (const b of secretState(scene).breakables) {
    if (!b.data.ronces || b.broken) continue;
    const g = scene.add.graphics();
    g.lookRole = 'prop';
    const rnd = new Phaser.Math.RandomDataGenerator([`ronces${b.id}`]);
    for (const [gx, gy] of b.cells) {
      const x0 = gx * GROUND_TILE_SIZE;
      const y0 = gy * GROUND_TILE_SIZE;
      g.fillStyle(0x1c2b1a, 0.92).fillRect(x0 - 6, y0, GROUND_TILE_SIZE + 12, GROUND_TILE_SIZE);
      for (let i = 0; i < 9; i++) {
        const x = x0 + rnd.realInRange(-4, GROUND_TILE_SIZE + 4);
        const y = y0 + rnd.realInRange(4, GROUND_TILE_SIZE - 4);
        const s = rnd.pick([-1, 1]);
        g.lineStyle(3, 0x3e7a2c, 1).lineBetween(x - 12 * s, y - 8, x + 12 * s, y + 8);
        g.fillStyle(0x9bff5a, 0.85).fillTriangle(x, y - 6, x + 5 * s, y, x, y + 2);
      }
    }
    v.ronces.push({ b, g });
  }
}

// Porte barrée : `v2Portes: [{ id, x, y, w, h, cote: 'dedans'|'dehors', flag }]`.
// (x = milieu, y = sol sous la porte.) On ne la débarre que du côté `dedans` ; le
// drapeau `flag` l'ouvre des deux côtés (retenu dans la sauvegarde).
function v2DessinerPorte(g, d, ouverte) {
  const x0 = d.x - d.w / 2;
  const y0 = d.y - d.h;
  g.clear();
  if (ouverte) {
    g.fillStyle(0x3a2616, 1).fillRect(x0 - 8, y0, 8, d.h).fillRect(x0 + d.w, y0, 8, d.h);
    return;
  }
  g.fillStyle(0x5a3a26, 1).fillRect(x0, y0, d.w, d.h);
  g.lineStyle(2, 0x2a1a0e, 1);
  for (let i = 1; i < 3; i++) g.lineBetween(x0 + (d.w * i) / 3, y0, x0 + (d.w * i) / 3, d.y);
  // La barre : large et claire, on la voit de loin.
  g.fillStyle(0xc9a66a, 1).fillRect(x0 - 8, y0 + d.h * 0.45, d.w + 16, 12);
  g.lineStyle(2, 0x2a1a0e, 1).strokeRect(x0 - 8, y0 + d.h * 0.45, d.w + 16, 12);
}

LEVEL_DATA_HANDLERS.v2Portes = (scene, list) => {
  for (const d of list || []) {
    const g = scene.add.graphics();
    g.lookRole = 'prop';
    storyPutBehindPlayer(scene, g);
    const ouverte = () => !!storyGet(d.flag);
    v2DessinerPorte(g, d, ouverte());
    let body = ouverte() ? null : addMossBody(scene, d.x, d.y - d.h / 2, d.w, d.h);
    scene.__story.interactables.push({
      kind: 'v2Porte',
      probe: (sc, p) => {
        if (ouverte() || Math.abs(p.y - d.y) > 70) return null;
        return { x: d.x, topY: d.y - d.h - 6, label: d.cote === 'dedans' ? 'E : débarrer' : 'E : examiner' };
      },
      activate: (sc) => {
        if (d.cote !== 'dedans') {
          storyBulle(sc, 'agarica', 'Barrée de l\'autre côté.');
          return;
        }
        storySet(d.flag, true);
        if (body) { removeMossBody(sc, body); body = null; }
        v2DessinerPorte(g, d, true);
        if (typeof playSfx === 'function') playSfx('chest_open');
        sc.cameras.main.shake(180, 0.004);
        storyBulle(sc, 'agarica', 'Voilà. La source n\'est plus fermée.');
      },
    });
  }
};

function v2Hook(scene) {
  const v = scene.__v2;
  if (!v || v.visit !== scene.__storyVisit || !scene.player || !scene.player.body) return;
  if (v.mousses.length) {
    const p = scene.player;
    const body = playerBodyRect(p);
    if (!p.isInvulnerable && !p.fallingOut && v.mousses.some((m) => Phaser.Geom.Intersects.RectangleToRectangle(body, m))) p.hitByEnemy();
  }
  for (const r of v.ronces) {
    if (r.b.broken && r.g) { r.g.destroy(); r.g = null; }
  }
}
LEVEL_UPDATE_HOOKS.push(v2Hook);

// Retire une sortie de la liste vivante (elle redevient un mur).
function v2FermerSortie(scene, test) {
  scene.__exits = (scene.__exits || []).filter((e) => !(e && test(e)));
}

// ---------------------------------------------------------------------------
// 1. Le village
// ---------------------------------------------------------------------------
const V2_HAUTS_X = 2016;

DIALOGUES.v2_pere_attente = [
  { who: 'pere_chef', text: 'La source d\'abord. Elle est à l\'ouest.' },
];
DIALOGUES.v2_pere_nuit = [
  { who: 'pere_chef', text: 'Va dormir, ma fille.' },
];
DIALOGUES.v2_garde_barre = [
  { who: 'garde', text: 'Tu ne repasses pas. Ordre du chef.' },
];

CUTSCENES.v2_village_intro = cutsceneBulles([
  { who: 'agarica', text: 'Père m\'attend près du feu, à l\'ouest.' },
], '[←] [→] ou [Q] [D] : marcher', 1200);

CUTSCENES.v2_tuto_dague = (scene) => { showToast(scene, '[K] ou clic : couper les ronces'); return []; };

CUTSCENES.v2_barriere_pere = [
  { call: (scene) => storyBulles(scene, [{ who: 'agarica', text: 'Père d\'abord. Il est près du feu.' }]) },
  { playerMove: { toX: 460 } },
];

CUTSCENES.v2_barriere_bannie = [
  { call: (scene) => storyBulles(scene, [{ who: 'garde_barre', text: 'Tu ne repasses pas. La porte est à l\'est.' }]) },
  { playerMove: { toX: 3010 } },
];

CUTSCENES.v2_sanctuaire_ferme = cutsceneBulles([
  { who: 'agarica', text: 'Le sanctuaire est là-haut. Fermé jusqu\'à la nuit.' },
]);

// Le rite de la première forme : l'ours sert tout de suite, à la source.
CUTSCENES.v2_talisman = [
  { npcFace: { npc: 'pere_chef', dir: 'player' } },
  { say: [
    { who: 'pere_chef', text: 'La mousse a bouché la source. Nos grattoirs n\'y font rien.' },
    { who: 'pere_chef', text: 'Tu as l\'âge du rite. Prends le talisman de l\'ours.' },
  ] },
  { npcAnim: { npc: 'pere_chef', anim: 'give_talisman' } },
  { wait: 500 },
  { playerPose: 'receive_item' },
  { give: 'talisman_ours' },
  { set: { talismanOurs: true } },
  { wait: 1200 },
  { playerPose: null },
  { npcAnim: { npc: 'pere_chef', anim: 'idle' } },
  { call: (scene) => acte1TalismanGlow(scene) },
  { shake: { ms: 260, intensity: 0.004 } },
  { playerPose: 'cast' },
  { skill: 'ours' },
  { call: (scene) => acte1FillEnergy(scene) },
  { wait: 1000 },
  { playerPose: null },
  { say: [
    { who: 'agarica', text: 'Le talisman des chefs ? Il est brûlant !' },
    { who: 'pere_chef', text: 'Frappe le sol fissuré, à la source. L\'ours fera le reste.' },
  ] },
  { toast: '[A] : fracas de l\'ours. Il use l\'énergie (barre sous les cœurs).' },
];

// La nuit tombe au retour de la source : Amanite passe, on la suit.
function v2AppliquerNuit(scene) {
  if (scene.ambientOverlay) scene.ambientOverlay.setFillStyle(0x060a22, 0.45);
}

CUTSCENES.v2_nuit = [
  { npcFace: { npc: 'pere_chef', dir: 'player' } },
  { say: [
    { who: 'pere_chef', text: 'J\'entends l\'eau d\'ici. Tu as bien travaillé.' },
    { who: 'pere_chef', text: 'Va dormir. Demain, on s\'attaque au reste.' },
  ] },
  { fadeOut: 800 },
  { call: (scene) => {
    v2AppliquerNuit(scene);
    createStoryNpc(scene, { id: 'amanite', x: 1400, lookAtPlayer: false });
    setNpcFacing(scene.npcs.amanite, 1);
  } },
  { fadeIn: 800 },
  { title: { title: 'La nuit', hold: 1000 } },
  { camera: { x: 1500, y: 270, ms: 800 } },
  { say: [{ who: 'agarica', text: 'Amanite ? Elle file au sanctuaire, à cette heure ?' }] },
  { npcMove: { npc: 'amanite', toX: V2_HAUTS_X, speed: 280 } },
  { npcRemove: 'amanite' },
  { cameraFollow: true },
  { set: { v2Nuit: true } },
  { call: (scene) => {
    const sortie = V2_VILLAGE_DATA.exits.find((e) => e.edge === 'top');
    if (sortie && !scene.__exits.includes(sortie)) scene.__exits = [...scene.__exits, sortie];
  } },
  { toast: 'Suis-la : la souche, les branches, puis saute vers le haut ↑' },
];

CUTSCENES.v2_porte_est = (scene) => {
  if (!storyGet('banished')) {
    return [
      { say: 'bosquet_garde_porte' },
      { playerMove: { toX: 3620 } },
    ];
  }
  return [
    { playerFace: 'right' },
    { playerPose: 'sad' },
    { title: { title: 'Bannie', sub: 'Les portes se ferment derrière elle', hold: 1800 } },
    { fadeOut: 1000 },
    { goto: { scene: 'V2SuiteScene' } },
  ];
};

// Le jugement de l'ancien bosquet, tel quel : la place du village est à ses mesures.
// Une fois bannie, le village se ferme derrière elle : plus de sortie, un garde en travers.
CUTSCENES.v2_bannissement = () => [
  ...CUTSCENES.bosquet_bannissement,
  { call: (scene) => {
    v2FermerSortie(scene, (e) => e.edge === 'top' || e.edge === 'left');
    if (!scene.npcs.garde_barre) {
      registerStoryNpc(scene, createStoryNpc(scene, { id: 'habitant_garde', key: 'garde_barre', x: 2900, talk: 'v2_garde_barre' }));
    }
  } },
];

ZONE_SCRIPTS.v2_village = {
  create(scene) {
    scene.__acte1 = {};
    v2PoserRonces(scene);
    const banie = storyGet('banished');
    if (storyGet('v2Nuit')) v2AppliquerNuit(scene);
    if (!storyGet('v2Nuit') || banie) v2FermerSortie(scene, (e) => e.edge === 'top');
    if (banie) v2FermerSortie(scene, (e) => e.edge === 'left');
    // Arrivée des hauts, ou partie rechargée en plein vol : le jugement.
    if (storyGet('idoleVolee') && !banie) scene.time.delayedCall(300, () => runCutscene(scene, 'v2_bannissement'));
  },
};

// ---------------------------------------------------------------------------
// 2. La source
// ---------------------------------------------------------------------------
const V2_BOUCHON = { x: 896, y: -64 };

CUTSCENES.v2_vu_porte = cutsceneBulles([{ who: 'agarica', text: 'La porte des caves. Barrée de l\'autre côté.' }]);
CUTSCENES.v2_vu_coffre = cutsceneBulles([{ who: 'agarica', text: 'Un coffre, au fond. Trop profond pour moi.' }]);
CUTSCENES.v2_vu_coeur = cutsceneBulles([{ who: 'agarica', text: 'Là-haut, ça brille. Trop haut pour un seul saut.' }]);
CUTSCENES.v2_tuto_ours = (scene) => { showToast(scene, '[A] sur le sol fissuré : fracas de l\'ours', 3600); return []; };
CUTSCENES.v2_village_barre = cutsceneBulles([{ who: 'agarica', text: 'Le village m\'est fermé. Pas par là.' }]);
CUTSCENES.v2_siphon = (scene) => {
  if (!storyGet('hasOctopusForm')) return [];
  showToast(scene, 'Suite en construction : la rivière souterraine', 2600);
  return [];
};

// L'eau de la source : jet, ruisseau vers l'ouest, cascade dans le bassin.
function v2EauVive(scene, { instant = false } = {}) {
  const v = v2Visite(scene);
  if (v.eauVive) return;
  v.eauVive = true;
  const COUL = 0x7fd8e8;
  const morceaux = [
    { x: 448, y: -70, w: 400, h: 6 },      // ruisseau sur le sol de l'ouest
    { x: 406, y: -64, w: 40, h: 192 },     // cascade jusqu'au pilier
    { x: 298, y: 128, w: 22, h: 160 },     // puis jusqu'au bassin
  ];
  morceaux.forEach((m, i) => {
    const r = scene.add.rectangle(m.x, m.y, m.w, m.h, COUL, 0.75).setOrigin(0, 0);
    r.lookRole = 'prop';
    storyPutBehindPlayer(scene, r);
    if (instant) return;
    r.setScale(i === 0 ? 0 : 1, i === 0 ? 1 : 0);
    r.setOrigin(i === 0 ? 1 : 0, 0).setX(i === 0 ? m.x + m.w : m.x);
    scene.tweens.add({ targets: r, scaleX: 1, scaleY: 1, delay: i * 450, duration: 500 });
  });
  if (v.voileMoussu) {
    if (instant) { v.voileMoussu.destroy(); v.voileMoussu = null; }
    else scene.tweens.add({ targets: v.voileMoussu, alpha: 0, delay: 900, duration: 900 });
  }
}

function v2JetDEau(scene) {
  const jet = scene.add.rectangle(V2_BOUCHON.x, 64, 56, 10, 0x9fe6f0, 0.85).setOrigin(0.5, 1);
  jet.lookRole = 'prop';
  scene.tweens.add({ targets: jet, displayHeight: 260, duration: 420, ease: 'Quad.easeOut', yoyo: true, hold: 500, onComplete: () => jet.destroy() });
}

CUTSCENES.v2_source_libre = [
  { shake: { ms: 400, intensity: 0.008 } },
  { call: (scene) => v2JetDEau(scene) },
  { wait: 600 },
  { camera: { x: 520, y: 40, ms: 900 } },
  { call: (scene) => v2EauVive(scene) },
  { wait: 1700 },
  { cameraFollow: true },
  { set: { v2SourceLibree: true } },
  { say: [{ who: 'agarica', text: 'Elle coule ! Père doit voir ça.' }] },
  { toast: 'Retourne voir ton père, au village →' },
];

ZONE_SCRIPTS.v2_source = {
  create(scene) {
    const v = v2Visite(scene);
    v.libre = !!storyGet('break_v2_source_bouchon');
    // Le bassin est moussu tant que l'eau ne coule pas.
    v.voileMoussu = scene.add.rectangle(128, 288, 1024, 160, 0x2f5a2a, 0.6).setOrigin(0, 0);
    v.voileMoussu.lookRole = 'prop';
    if (v.libre) v2EauVive(scene, { instant: true });
    // La pieuvre nage : l'eau n'est plus un piège.
    if (storyGet('hasOctopusForm')) scene.__story.fall = null;
    if (storyGet('banished')) v2FermerSortie(scene, (e) => e.targetScene === 'V2VillageScene');
  },
  update(scene) {
    const v = v2Visite(scene);
    const p = scene.player;
    if (v.libre) return;
    if (storyGet('break_v2_source_bouchon')) {
      v.libre = true;
      runCutscene(scene, 'v2_source_libre');
      return;
    }
    // Filet : plus assez d'énergie devant le bouchon, le talisman en redonne.
    if (p.unlockedSkills.has('ours') && p.energy < SKILL_DEFS.ours.cost && Math.abs(p.x - V2_BOUCHON.x) < 340
      && Math.abs(p.y - V2_BOUCHON.y) < 120 && scene.time.now > (v.rechargeA || 0) && !p.skillTransformActive) {
      v.rechargeA = scene.time.now + 3000;
      acte1FillEnergy(scene);
      acte1TalismanGlow(scene);
    }
  },
};

// ---------------------------------------------------------------------------
// 3. Les hauts du bosquet : le vol de l'idole
// ---------------------------------------------------------------------------
const V2_AUTEL = { x: 480, y: -320, prop: 'bosquet_antler_totem' };

// Mêmes répliques que l'ancien bosquet (bosquet_vol, acte1.js).
const V2_VOL_REPLIQUES = CUTSCENES.bosquet_vol.filter((s) => s.say).map((s) => s.say);

CUTSCENES.v2_tuto_petit_saut = (scene) => { showToast(scene, '[Espace] bref : petit saut. Ne touche pas la mousse.', 3800); return []; };

function v2PrendreIdole(scene) {
  const v = v2Visite(scene);
  if (!v.idole) return;
  const objets = [v.idole, v.halo].filter(Boolean);
  v.idole = null;
  v.halo = null;
  scene.tweens.killTweensOf(objets);
  scene.tweens.add({ targets: objets, alpha: 0, y: '-=20', duration: 500, onComplete: () => objets.forEach((o) => o.destroy()) });
}

CUTSCENES.v2_vol = [
  { camera: { x: V2_AUTEL.x + 200, y: V2_AUTEL.y - 70, ms: 900 } },
  { say: V2_VOL_REPLIQUES[0] },
  { npcFace: { npc: 'amanite', dir: 'player' } },
  { call: (scene) => v2PrendreIdole(scene) },
  { npcAnim: { npc: 'amanite', anim: 'run_idol' } },
  { wait: 500 },
  { say: V2_VOL_REPLIQUES[1] },
  { npcMove: { npc: 'amanite', toX: 150, speed: 300 } },
  { npcRemove: 'amanite' },
  { set: { idoleVolee: true } },
  { cameraFollow: true },
  { npcAdd: { id: 'habitant_garde', key: 'garde_vol', x: 1400, y: V2_AUTEL.y } },
  { npcMove: { npc: 'garde_vol', toX: 1040, speed: 260 } },
  { say: V2_VOL_REPLIQUES[2] },
  { npcMove: { npc: 'garde_vol', toX: 1400, speed: 260 } },
  { npcRemove: 'garde_vol' },
  { fadeOut: 700 },
  { goto: { scene: 'V2VillageScene', data: { enterId: 'jugement' } } },
];

ZONE_SCRIPTS.v2_hauts_bosquet = {
  create(scene) {
    const v = v2Visite(scene);
    // Partie rechargée après le vol : le jugement l'attend au village.
    if (storyGet('idoleVolee')) {
      scene.time.delayedCall(60, () => goToScene(scene, 'V2VillageScene', { enterId: 'jugement' }));
      return;
    }
    v.idole = storyPlaceOnProp(scene, addItemIcon(scene, 0, 0, 'idole', 40), V2_AUTEL.x, V2_AUTEL.prop, V2_AUTEL.y - 60);
    v.halo = acte1HaloImage(scene, v.idole.x, v.idole.y, 100, 0x8fe3b8, 0.32);
    if (v.halo) storyPutBehindPlayer(scene, v.halo);
    storyPutBehindPlayer(scene, v.idole);
    createStoryNpc(scene, { id: 'amanite', x: V2_AUTEL.x - 55, y: V2_AUTEL.y, lookAtPlayer: false });
    setNpcFacing(scene.npcs.amanite, 1);
  },
};

// ---------------------------------------------------------------------------
// 4. Les caves : le retour en cachette
// ---------------------------------------------------------------------------
CUTSCENES.v2_caves_pere = [
  { playerFace: 'left' },
  { say: [
    { who: 'habitant', name: 'Voix d\'Orme', text: 'Bannir ta fille pour une idole. Tu y crois encore ?' },
    { who: 'pere_chef', name: 'Voix du chef', text: 'Elle a menti pour son amie. À son âge, j\'aurais fait pareil.' },
    { who: 'pere_chef', name: 'Voix du chef', text: 'Mais un chef ne peut pas le dire.' },
    { who: 'agarica', text: 'Père…' },
  ] },
];

CUTSCENES.v2_caves_fin_est = (scene) => { showToast(scene, 'Suite en construction : les champignonnières', 2600); return []; };

// Essai des caves tant que les régions voisines n'existent pas :
// `index.html?zone=v2_caves&flags=v2Essai` prête ce que le joueur aura en y arrivant.
function v2PreparerEssai(scene) {
  if (!storyGet('v2Essai') || storyGet('banished')) return;
  const p = scene.player;
  const formes = ['hasGrizzlyForm', 'hasMonkeyForm', 'hasOctopusForm'];
  storySet({ talismanOurs: true, banished: true, idoleVolee: true, v2Nuit: true, v2SourceLibree: true, break_v2_source_bouchon: true });
  for (const flag of formes) { scene.registry.set(flag, true); p[flag] = true; }
  p.airFormsSeen.monkey = true;
  p.equipForm('grizzly');
  p.equipForm('monkey');
  p.equipForm('octopus');
  if (typeof ursideSetupPlayer === 'function') ursideSetupPlayer(scene, p);
  unlockSkillFromStory(scene, 'ours', { silent: true });
  acte1FillEnergy(scene);
}

ZONE_SCRIPTS.v2_caves = {
  create(scene) {
    v2PreparerEssai(scene);
    // La pieuvre descend le puits : l'eau n'est plus un piège.
    if (storyGet('hasOctopusForm')) scene.__story.fall = null;
  },
};
