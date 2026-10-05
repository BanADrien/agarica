// Dialogues, cinématiques et scripts de zone de l'acte 2 — agent Acte 2.
//
// Zones (cf. docs/production/PLAN_DEV.md, progression 8 à 16) :
//   foret_flottante_1 (Galter, duel comique, carte) → foret_flottante_2
//   (totem de poche, Amanite, totem de l'aigle, plané) → clairiere_plante
//   (fleur résistante) → hutte_morgat (répulsif, crash) → foret_corrompue_1
//   → arene_ghilt / trou_sombre (boss_ghilt.js : on ne fait ici que réécrire
//   ses dialogues) → bosquet_retour (fin, EndScreenScene).
// Les fichiers Scene restent le gabarit générique : tout passe par la donnée
// de zone (`script: 'acte2_…'`, `triggers`, `npcs`…) et les registres.
//
// Flags posés ici : galterMet, amaniteMet, fleurPrelevee, morgatVue,
// crashDone, fc1Reveil, fc1MousseFermee, demoFinished (+ hasEagleForm par le
// totem, objets carte_galter, totem_poche_casse, fleur_resistante, repulsif,
// note_galter, et les flags automatiques trig_* / pickup_* / moss* de StoryKit).

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

// Texte qui monte et s'efface au-dessus d'un personnage (annonces de Galter…).
function a2Float(scene, x, y, text, color = '#ffe9f5', { size = 16, ms = 1400 } = {}) {
  const t = scene.add.text(x, y, text, {
    fontFamily: STORY_UI.serif, fontSize: `${size}px`, fontStyle: 'bold', color,
    stroke: '#15101f', strokeThickness: 4, align: 'center',
  }).setOrigin(0.5, 1).setDepth(1060);
  scene.tweens.add({ targets: t, y: y - 34, duration: ms, ease: 'Sine.easeOut' });
  scene.tweens.add({ targets: t, alpha: 0, delay: ms * 0.65, duration: ms * 0.35, onComplete: () => t.destroy() });
  return t;
}

// Murs invisibles (zones statiques pleine hauteur) : arène du duel, porte fermée.
function a2Walls(scene, xs) {
  const group = scene.physics.add.staticGroup();
  for (const x of xs) {
    const z = scene.add.zone(x, 0, 32, 1400);
    scene.physics.add.existing(z, true);
    group.add(z);
  }
  // Le collider est gardé sur le groupe : le détruire AVANT le groupe (un
  // collider orphelin fait planter la physique au pas suivant).
  group.__a2Collider = scene.physics.add.collider(scene.player, group);
  return group;
}

function a2DestroyWalls(group) {
  if (!group) return;
  if (group.__a2Collider) { group.__a2Collider.destroy(); group.__a2Collider = null; }
  group.destroy(true);
}

// Halo additif doux (dégradé radial) pour la lumière, les fleurs, le totem.
function a2GlowTexture(scene) {
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
// un ciel de jour. Renvoie le rectangle (alpha réglable par le script).
function a2SkyWash(scene, color, alpha) {
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

// Plafond au bord haut de l'écran : la caméra de ces zones ne défile pas
// verticalement (pas de `tallLevel`), alors qu'un double saut ou l'aigle
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
    scene.__a2Prompt = scene.add.text(0, 0, '', {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#ffe9f5',
      backgroundColor: '#2a1f45', padding: { x: 6, y: 3 },
    }).setOrigin(0.5, 1).setDepth(1050).setVisible(false);
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
// 8. FORÊT FLOTTANTE 1 — le chemin des hauteurs, Galter et Clak
// ===========================================================================
Object.assign(DIALOGUES, {
  ff1_intro: [
    { who: 'agarica', text: 'Les branches montent si haut… On ne voit même plus le sol.' },
    { who: 'xara', text: 'Le temps presse, Agarica. La mousse avance plus vite que tes pas.' },
    { who: 'xara', text: 'La forêt est trop grande pour la nettoyer coin par coin. Il faut remonter jusqu\'à sa source.' },
    { who: 'agarica', text: 'Et tu sais où elle est, toi ?' },
    { who: 'xara', text: 'Je connais… un chemin. Par les hauteurs. Grimpe, et garde les yeux ouverts.' },
  ],
  galter_rencontre: [
    { who: 'galter', text: 'HALTE ! Pas un pas de plus, porteuse de mousse !' },
    { who: 'clak', text: 'Clac !' },
    { who: 'agarica', text: 'Porteuse de… quoi ? Je ne porte rien du tout !' },
    { who: 'galter', text: 'C\'est exactement ce que dirait quelqu\'un qui porte de la mousse. Ou qui vient voler mes notes.' },
    { who: 'xara', text: 'Il a l\'air très sûr de lui. C\'est rarement bon signe.' },
    { who: 'galter', text: 'Galter, ranger des marches boisées. Et voici Clak, mon totem. Tremble.' },
    { who: 'clak', text: 'Clac clac.' },
    { who: 'galter', text: 'En garde ! Un duel, et la vérité éclatera !' },
    { who: 'agarica', text: 'Je ne veux pas te faire de mal…' },
    { who: 'galter', text: 'Ha ! Personne ne m\'a jamais fait de mal. Enfin… presque personne. Enfin, pas souvent.' },
  ],
  galter_rendu_victoire: [
    { who: 'galter', text: 'Ouille… D\'accord, d\'accord ! Je me rends. Stratégiquement.' },
    { who: 'agarica', text: 'Tu n\'as rien de cassé ?' },
    { who: 'galter', text: 'Juste ma réputation. Clak la recollera.' },
  ],
  galter_rendu_temps: [
    { who: 'xara', text: 'Ça suffit, vous deux. Vous allez finir par vous faire mal… lui, surtout.' },
    { who: 'galter', text: 'Pff. Je la tenais. Clak, dis-lui que je la tenais.' },
    { who: 'clak', text: '…' },
  ],
  galter_paix: [
    { who: 'xara', text: 'Ranger, vous cherchez l\'origine de la mousse. Elle aussi. Vous auriez pu commencer par là.' },
    { who: 'galter', text: '… Tu cherches la source, toi aussi ?' },
    { who: 'agarica', text: 'Je veux sauver la forêt. Et… pouvoir rentrer chez moi, un jour.' },
    { who: 'galter', text: 'Alors on est dans la même galère, petite. Tiens. Ma carte.' },
  ],
  galter_carte: [
    { who: 'galter', text: 'Elle est incomplète. Les flèches qui se contredisent, c\'est normal. Les traces de pinces, c\'est Clak.' },
    { who: 'galter', text: 'Mais regarde ce que j\'ai noté : la mousse ne s\'étale pas au hasard. Elle monte. Vers les hauteurs.' },
    { who: 'galter', text: 'Et elle pousse plus vite là où les bêtes sont malades. Comme si elle suivait la fièvre… ou l\'inverse.' },
    { who: 'agarica', text: 'Alors il faut monter. On y va ensemble ?' },
    { who: 'galter', text: '« Ensemble », oui. Regarde-moi bien faire.' },
  ],
  galter_essai: [
    { who: 'clak', text: 'Clac. Clac clac.' },
    { who: 'galter', text: 'Il dit que j\'aurais pu demander de l\'aide. Je ne lui ai pas demandé son avis.' },
    { who: 'galter', text: 'J\'avais une corde, trois pièges et un discours héroïque. Rien de tout ça ne saute plus haut que moi.' },
    { who: 'galter', text: 'Bon. Va, Agarica. Je garde le camp, et je mettrai la carte à jour avec ce que tu rapporteras.' },
    { who: 'agarica', text: 'Merci, Galter ! Je reviendrai tout te raconter.' },
    { who: 'xara', text: 'Il a raison sur un point : la mousse sait où elle va. Suivons-la vers le haut.' },
  ],
  galter_camp: [
    { who: 'galter', text: 'Toujours en un seul morceau ? Bien. Ça me fait une alliée de plus et un point d\'interrogation de moins.' },
    { who: 'galter', text: 'La mousse monte, petite. Toujours. Moi, je reste en bas à prendre des notes.' },
  ],
  clak_camp: [
    { who: 'clak', text: 'Clac.' },
    { who: 'agarica', text: '… Moi aussi, je t\'aime bien, Clak.' },
  ],
  ff1_vue: [
    { who: 'agarica', text: 'Oh… Xara, regarde ! La brume se déchire…' },
    { who: 'agarica', text: 'Le ciel ! En plein jour, sans branches devant. Je ne l\'avais jamais vu comme ça.' },
    { who: 'xara', text: 'Au-dessus de la canopée, la nuit n\'existe plus. Plus loin, des îles flottent : les anciens gardiens y vivaient.' },
    { who: 'agarica', text: 'Et là-bas, tout au loin… cette forêt presque noire.' },
    { who: 'xara', text: 'C\'est là que la mousse est la plus épaisse. Son cœur. Retiens bien la direction.' },
  ],
});

CUTSCENES.ff1_intro = [{ wait: 200 }, { say: 'ff1_intro' }];
CUTSCENES.ff1_vue = [
  { camera: { x: 3420, y: 230, ms: 1100 } },
  { say: 'ff1_vue' },
  { cameraFollow: true },
];

// Premier contact : Galter bondit hors de son camp.
CUTSCENES.galter_rencontre = (scene) => {
  const p = scene.player;
  const gx = Phaser.Math.Clamp(p.x + 240, 900, 1400);
  return [
    { npcMove: { npc: 'galter', toX: gx, speed: 260 } },
    { npcFace: { npc: 'galter', dir: 'player' } },
    { npcAnim: { npc: 'galter', anim: 'talk' } },
    { playerFace: 'right' },
    { shake: { ms: 200, intensity: 0.004 } },
    { say: 'galter_rencontre' },
    { npcAnim: { npc: 'galter', anim: 'idle' } },
    { toast: 'Duel ! Touche Galter trois fois (K ou clic)… sans trop lui faire mal.' },
  ];
};

CUTSCENES.galter_fin_duel = (scene) => {
  const st = scene.__a2 || {};
  return [
    { npcFace: { npc: 'galter', dir: 'player' } },
    { say: st.duelEnd === 'temps' ? 'galter_rendu_temps' : 'galter_rendu_victoire' },
    { say: 'galter_paix' },
    { npcAnim: { npc: 'galter', anim: 'map_reading' } },
    { give: 'carte_galter' },
    { toast: 'Touche M : consulter la carte de Galter' },
    { say: 'galter_carte' },
    { npcAnim: { npc: 'galter', anim: 'walk' } },
    { parallel: [
      { npcMove: { npc: 'galter', toX: 1850, speed: 150 } },
      { npcMove: { npc: 'clak', toX: 1790, speed: 150 } },
      { playerMove: { toX: 1680 } },
    ] },
    { npcAnim: { npc: 'galter', anim: 'idle' } },
    { camera: { x: 1820, y: 300, ms: 600 } },
    { call: (sc) => a2GalterComicJump(sc) },
    { say: 'galter_essai' },
    { set: { galterMet: true } },
    { call: (sc) => a2Ff1EndDuel(sc) },
    { cameraFollow: true },
    { toast: 'Double saut pour atteindre la corniche' },
  ];
};

// Galter tente la corniche : petit bond raté, puis la corde qui lui retombe dessus.
async function a2GalterComicJump(scene) {
  const g = a2Npc(scene, 'galter');
  const clak = a2Npc(scene, 'clak');
  if (!g) return;
  const gy = g.y;
  a2Float(scene, g.x, g.y - 80, 'Hop… HOP !', '#ffd27a');
  setNpcFacing(g, 1);
  await a2Tween(scene, { targets: g, y: gy - 46, duration: 260, ease: 'Quad.easeOut' });
  await a2Tween(scene, { targets: g, y: gy, duration: 240, ease: 'Quad.easeIn' });
  g.playManifest('trip_fall', false);
  await a2Tween(scene, { targets: g, angle: -80, duration: 220 });
  a2Float(scene, g.x, g.y - 50, 'Ouf…', '#ffd27a');
  await a2Wait(scene, 700);
  await a2Tween(scene, { targets: g, angle: 0, duration: 260 });
  g.playManifest('idle');
  // La corde : un trait lancé vers la corniche, qui retombe sur sa tête.
  a2Float(scene, g.x, g.y - 80, 'Plan B : la corde !', '#ffd27a');
  const rope = scene.add.graphics().setDepth(g.depth + 1);
  const tip = { x: g.x, y: g.y - 60 };
  const draw = () => {
    rope.clear();
    rope.lineStyle(3, 0xc9a26b, 1);
    rope.lineBetween(g.x + 6, g.y - 50, tip.x, tip.y);
    rope.fillStyle(0x8a6a3e, 1);
    rope.fillCircle(tip.x, tip.y, 5);
  };
  const upd = () => draw();
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

function a2Ff1EndDuel(scene) {
  const st = scene.__a2;
  if (st && st.walls) { a2DestroyWalls(st.walls); st.walls = null; }
  hideBossBar(scene);
}

// --- Duel comique : Galter enchaîne des « techniques » qui ratent toutes ---
const GALTER_DUEL = { minX: 660, maxX: 1560, hits: 3, timeoutMs: 40000, pauseMs: 1500 };
const GALTER_TECHNIQUES = ['fleche', 'bond', 'piege', 'charge'];

async function a2Ff1Encounter(scene) {
  const st = scene.__a2;
  st.walls = a2Walls(scene, [GALTER_DUEL.minX, GALTER_DUEL.maxX]);
  await runCutscene(scene, 'galter_rencontre');
  if (!scene.player || scene.__a2 !== st) return;
  const g = a2Npc(scene, 'galter');
  st.duel = {
    active: true, hits: 0, busy: false, tech: 0, startAt: scene.time.now,
    nextAt: scene.time.now + 900, invulUntil: 0, lastToken: null, gy: g.y,
  };
  showBossBar(scene, 'Galter, ranger des marches boisées', () => 1 - (st.duel ? st.duel.hits : 0) / GALTER_DUEL.hits);
}

function a2DuelUpdate(scene) {
  const st = scene.__a2;
  const d = st.duel;
  const g = a2Npc(scene, 'galter');
  const p = scene.player;
  if (!d || !d.active || !g) return;
  const now = scene.time.now;
  // Coups d'Agarica (mêlée ou piqué), un seul par attaque.
  const atk = p.getAttackHitbox && p.getAttackHitbox();
  if (atk && now >= d.invulUntil && Phaser.Geom.Intersects.RectangleToRectangle(atk, g.getBounds())) {
    const token = p.isAttacking ? `m-${p.attackEndTime}` : `d-${Math.floor(now / 400)}`;
    if (token !== d.lastToken) {
      d.lastToken = token;
      a2GalterHit(scene, d, g);
    }
  }
  if (d.hits >= GALTER_DUEL.hits) { a2DuelFinish(scene, 'victoire'); return; }
  if (now - d.startAt > GALTER_DUEL.timeoutMs) { a2DuelFinish(scene, 'temps'); return; }
  if (!d.busy && now >= d.nextAt) {
    d.busy = true;
    const tech = GALTER_TECHNIQUES[d.tech % GALTER_TECHNIQUES.length];
    d.tech += 1;
    a2GalterTechnique(scene, d, g, tech)
      .catch((e) => console.error('duel Galter', e))
      .finally(() => {
        d.busy = false;
        d.nextAt = scene.time.now + GALTER_DUEL.pauseMs;
        if (d.tech === 1) showToast(scene, 'Xara : « Il vise très bien… le crabe. »', 2400);
        if (d.tech === 3) showToast(scene, 'Xara : « Je crois que le crabe est de ton côté. »', 2400);
      });
  }
}

const GALTER_OUCH = ['Ouille !', 'Aïe, mon orgueil !', 'Pas le visage !'];

function a2GalterHit(scene, d, g) {
  d.hits += 1;
  d.invulUntil = scene.time.now + 700;
  if (scene.player.gainEnergy) scene.player.gainEnergy(ENERGY_PER_HIT);
  g.setTint(0xffffff);
  scene.time.delayedCall(140, () => g.active && g.setTint(0xffb0b0));
  scene.time.delayedCall(320, () => g.active && g.clearTint());
  scene.cameras.main.shake(90, 0.003);
  a2Float(scene, g.x, g.y - 90, GALTER_OUCH[(d.hits - 1) % GALTER_OUCH.length], '#ffb0b0');
}

function a2GalterDir(scene, g) {
  return scene.player.x >= g.x ? 1 : -1;
}

async function a2GalterTechnique(scene, d, g, tech) {
  const clak = a2Npc(scene, 'clak');
  const dir = a2GalterDir(scene, g);
  setNpcFacing(g, dir);
  const clampX = (x) => Phaser.Math.Clamp(x, GALTER_DUEL.minX + 50, GALTER_DUEL.maxX - 50);
  if (tech === 'fleche') {
    a2Float(scene, g.x, g.y - 85, 'Flèche du Héron Silencieux !', '#ffd27a');
    g.playManifest('attack_miss', false);
    await a2Wait(scene, 750);
    // La flèche part… Clak se jette devant et l'attrape au vol.
    const arrow = scene.add.rectangle(g.x + dir * 20, g.y - 45, 30, 4, 0x8a6a3e).setDepth(g.depth + 1);
    const midX = (g.x + scene.player.x) / 2;
    if (clak) {
      clak.playManifest('scuttle');
      setNpcFacing(clak, dir);
      scene.tweens.add({ targets: clak, x: midX, duration: 260 });
    }
    await a2Tween(scene, { targets: arrow, x: midX, duration: 300 });
    if (clak) { clak.playManifest('snap', false); a2Float(scene, clak.x, clak.y - 30, 'Clac !', '#ff9f70', { size: 14 }); }
    await a2Tween(scene, { targets: arrow, y: arrow.y + 30, angle: 70, alpha: 0, duration: 400 });
    arrow.destroy();
    a2Float(scene, g.x, g.y - 85, 'Clak ! Rends-moi ça !', '#ffd27a');
    await a2Wait(scene, 700);
    if (clak) { clak.playManifest('idle'); await a2Tween(scene, { targets: clak, x: clampX(g.x - dir * 55), duration: 400 }); }
  } else if (tech === 'bond') {
    a2Float(scene, g.x, g.y - 85, 'Bond du Blaireau Furieux !', '#ffd27a');
    await a2Tween(scene, { targets: g, scaleY: g.scaleY * 0.85, duration: 220, yoyo: true });
    const dist = Math.max(0, Math.abs(scene.player.x - g.x) - 130);
    const tx = clampX(g.x + dir * Math.min(dist, 230));
    scene.tweens.add({ targets: g, x: tx, duration: 520 });
    await a2Tween(scene, { targets: g, y: d.gy - 70, duration: 260, ease: 'Quad.easeOut' });
    await a2Tween(scene, { targets: g, y: d.gy, duration: 260, ease: 'Quad.easeIn' });
    g.playManifest('trip_fall', false);
    await a2Tween(scene, { targets: g, angle: dir * 85, duration: 200 });
    a2Float(scene, g.x, g.y - 50, 'Le sol… a bougé.', '#ffd27a');
    await a2Wait(scene, 1100);
    await a2Tween(scene, { targets: g, angle: 0, duration: 250 });
    g.playManifest('idle');
  } else if (tech === 'piege') {
    a2Float(scene, g.x, g.y - 85, 'Piège du Ranger !', '#ffd27a');
    // Il pose le piège… derrière lui, sans regarder.
    const trapX = clampX(g.x - dir * 45);
    const trap = scene.add.graphics({ x: trapX, y: d.gy }).setDepth(g.depth);
    trap.lineStyle(3, 0xc9a26b, 1);
    trap.strokeEllipse(0, -3, 34, 10);
    await a2Wait(scene, 500);
    a2Float(scene, g.x, g.y - 85, 'Approche, si tu l\'oses !', '#ffd27a');
    await a2Wait(scene, 700);
    setNpcFacing(g, dir);
    await a2Tween(scene, { targets: g, x: trapX, duration: 380 });
    // Le collet se referme : Galter pend la tête en bas.
    trap.destroy();
    // Origine du sprite aux pieds : retourné à 180°, il s'étend VERS LE BAS
    // depuis ses pieds. On remonte donc les pieds d'une hauteur de sprite
    // pour qu'il pende tête en bas au-dessus du sol (et non la tête dans la terre).
    const feetY = d.gy - g.displayHeight - 24;
    const rope = scene.add.graphics().setDepth(g.depth);
    rope.lineStyle(2, 0xc9a26b, 1);
    rope.lineBetween(trapX, -10, trapX, feetY);
    scene.cameras.main.shake(100, 0.004);
    await a2Tween(scene, { targets: g, y: feetY, angle: 180, duration: 260, ease: 'Back.easeOut' });
    a2Float(scene, g.x, g.y - 110, 'Ce n\'était PAS prévu.', '#ffd27a');
    await a2Wait(scene, 1400);
    rope.destroy();
    await a2Tween(scene, { targets: g, y: d.gy, angle: 0, duration: 280, ease: 'Quad.easeIn' });
    a2Float(scene, g.x, g.y - 60, 'Aïe.', '#ffd27a');
    await a2Wait(scene, 300);
  } else {
    a2Float(scene, g.x, g.y - 85, 'Charge du Sanglier Solitaire !', '#ffd27a');
    a2Float(scene, g.x, g.y - 115, '!', '#ff6b6b', { size: 24, ms: 700 });
    await a2Wait(scene, 600);
    // Clak se met en travers, Galter trébuche dessus.
    const cx = clampX(g.x + dir * 70);
    if (clak) {
      clak.playManifest('scuttle');
      await a2Tween(scene, { targets: clak, x: cx, duration: 220 });
      clak.playManifest('idle');
    }
    g.playManifest('walk');
    await a2Tween(scene, { targets: g, x: clampX(cx - dir * 20), duration: 260, ease: 'Quad.easeIn' });
    g.playManifest('trip_fall', false);
    if (clak) a2Float(scene, clak.x, clak.y - 30, 'Clac.', '#ff9f70', { size: 14 });
    await a2Tween(scene, { targets: g, x: clampX(g.x + dir * 90), angle: dir * 95, duration: 380, ease: 'Quad.easeOut' });
    a2Float(scene, g.x, g.y - 50, 'CLAK !', '#ffd27a');
    await a2Wait(scene, 1000);
    await a2Tween(scene, { targets: g, angle: 0, duration: 250 });
    g.playManifest('idle');
    if (clak) await a2Tween(scene, { targets: clak, x: clampX(g.x - dir * 55), duration: 350 });
  }
}

async function a2DuelFinish(scene, reason) {
  const st = scene.__a2;
  const d = st.duel;
  if (!d || !d.active) return;
  d.active = false;
  st.duelEnd = reason;
  // Laisse finir la technique en cours (bornée), puis remet Galter d'aplomb.
  for (let i = 0; i < 40 && d.busy; i++) await a2Wait(scene, 100);
  const g = a2Npc(scene, 'galter');
  if (g) {
    scene.tweens.killTweensOf(g);
    g.setAngle(0).setY(d.gy).clearTint();
    g.playManifest('idle');
  }
  hideBossBar(scene);
  // Les murs du duel tombent AVANT la cinématique : elle fait marcher Agarica
  // jusqu'à x 1680, au-delà du mur droit (x 1560) — elle s'y bloquait.
  a2Ff1EndDuel(scene);
  await runCutscene(scene, 'galter_fin_duel');
}

// Brume du bas qui se déchire et lumière du jour qui grandit en montant.
function a2Ff1Atmosphere(scene) {
  const { width, height } = scene.scale;
  const st = scene.__a2;
  st.sky = a2SkyWash(scene, 0x9fd3ff, 0);
  st.mist = scene.add.rectangle(0, 0, width, height, 0xd6dcef, 0.32).setOrigin(0).setScrollFactor(0).setDepth(880);
  st.sun = a2Glow(scene, width - 150, 70, 260, 0xfff1c0, 0, 881).setScrollFactor(0);
  st.puffs = [];
  for (let i = 0; i < 9; i++) {
    const puff = scene.add.ellipse(300 + i * 380, 380 - (i % 3) * 90, 420, 120, 0xe8ecff, 0.18)
      .setScrollFactor(0.6).setDepth(882);
    st.puffs.push(puff);
  }
}

function a2Ff1AtmosphereUpdate(scene) {
  const st = scene.__a2;
  if (!st.mist) return;
  const t = Phaser.Math.Clamp((scene.player.x - 1700) / 1500, 0, 1);
  st.mist.setAlpha(0.32 * (1 - t));
  st.sky.setAlpha(0.55 * t);
  st.sun.setAlpha(0.75 * t);
  st.puffs.forEach((pf, i) => pf.setAlpha(0.18 * (1 - t) + (i % 2 ? 0.02 : 0)));
}

// Ruines d'anciens totems animaux, au bord du chemin.
function a2DrawTotemRuin(scene, x, y, h, tint = 0x7c6a58) {
  const g = scene.add.graphics({ x, y });
  g.fillStyle(tint, 1);
  g.fillRect(-14, -h, 28, h);
  g.fillStyle(0x5c4c3e, 1);
  g.fillRect(-18, -h - 6, 36, 10);
  g.fillTriangle(-14, -h - 6, -2, -h - 20, 6, -h - 6); // cassure
  g.fillStyle(0x3f7a52, 0.9);
  g.fillCircle(-10, -h * 0.4, 6);
  g.fillCircle(8, -h * 0.2, 5);
  g.lineStyle(2, 0x3a2e25, 0.8);
  g.strokeCircle(0, -h * 0.65, 7);
  storyPutBehindPlayer(scene, g);
  return g;
}

ZONE_SCRIPTS.acte2_ff1 = {
  create(scene) {
    a2Ceiling(scene);
    scene.__a2 = { duel: null, walls: null };
    a2InteractReset(scene);
    a2Ff1Atmosphere(scene);
    a2DrawTotemRuin(scene, 3120, 128 + 16, 56);
    a2DrawTotemRuin(scene, 3260, 128 + 16, 34, 0x8a7a66);
    if (storyGet('galterMet')) {
      // Revisite : Galter au pied de la corniche, plongé dans sa carte.
      const g = a2Npc(scene, 'galter');
      const c = a2Npc(scene, 'clak');
      if (g) { g.x = 1840; g.playManifest('map_reading'); }
      if (c) c.x = 1790;
    }
  },
  update(scene) {
    const st = scene.__a2;
    if (!st) return;
    a2Ff1AtmosphereUpdate(scene);
    if (!storyGet('galterMet') && !st.encounterStarted && scene.player.x > 920 && scene.player.x < 1500) {
      st.encounterStarted = true;
      a2Ff1Encounter(scene).catch((e) => console.error('rencontre Galter', e));
    }
    a2DuelUpdate(scene);
  },
};

// ===========================================================================
// 9. FORÊT FLOTTANTE 2 — îles, totem de poche, Amanite, aigle
// ===========================================================================
Object.assign(DIALOGUES, {
  ff2_intro: [
    { who: 'agarica', text: 'Des îles… qui flottent ! Comment est-ce possible ?' },
    { who: 'xara', text: 'Les anciens gardiens savaient lier la pierre au vent. Leur magie dort encore ici, à moitié.' },
    { who: 'agarica', text: 'Et là, entre les îles… on voit le vent monter !' },
    { who: 'xara', text: 'Pour l\'instant, il ne te sert à rien. Pour l\'instant.' },
  ],
  ff2_totem_poche: [
    { who: 'agarica', text: 'Qu\'est-ce que c\'est ? Un petit totem… fendu en deux.' },
    { who: 'agarica', text: 'Il est tout froid. Il ne réagit à rien.' },
    { who: 'xara', text: 'Ancien. Très ancien. Les gardiens en portaient sur eux, autrefois.' },
    { who: 'xara', text: 'Garde-le. Les vieilles choses ont parfois la mémoire longue.' },
  ],
  amanite_apres: [
    { who: 'agarica', text: 'Amanite, attends !' },
    { who: 'agarica', text: '… Elle n\'était pas comme ça, avant. Elle voulait aider, elle aussi.', pose: 'sad' },
    { who: 'xara', text: 'Elle veut toujours sauver la forêt. C\'est bien ce qui m\'inquiète.' },
    { who: 'xara', text: 'Plus haut, sur l\'île au-dessus de nous : un totem t\'attend. Un double saut devrait suffire.' },
  ],
  aigle_revele: [
    { who: 'agarica', text: 'Ce vent sous mes bras… Je me sens légère, comme une plume !' },
    { who: 'xara', text: 'L\'aigle t\'a choisie. Fais un double saut : ses ailes s\'ouvriront, et tu planeras.' },
    { who: 'xara', text: 'Laisse-toi porter. S pour piquer, si tu es pressée de retrouver le sol.' },
    { who: 'xara', text: 'Essaie de rejoindre l\'île d\'en face. Si tu tombes, l\'îlot du dessous te rattrapera… et le courant d\'air te remontera.' },
  ],
  ff2_envol: [
    { who: 'agarica', text: 'Xara, là, en contrebas ! Ce cercle vert, au milieu de la mousse…' },
    { who: 'xara', text: 'La plante que tu avais aperçue depuis la forêt sombre. La mousse n\'ose pas l\'approcher.' },
    { who: 'agarica', text: 'D\'en bas, je ne pouvais pas l\'atteindre. Mais d\'ici…' },
    { who: 'xara', text: 'D\'ici, tu planes. Prends de l\'élan, double saut, et ne regarde pas le vide.' },
    { who: 'agarica', text: 'Ne pas regarder le vide. D\'accord. Facile.' },
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
    { who: 'agarica', text: 'Où est l\'idole ?' },
    { who: 'amanite', text: 'En sécurité. Avec moi, elle sert enfin à quelque chose.' },
    { who: 'agarica', text: 'Et cette bête… tu l\'as tuée. Elle était malade ! Kainati aussi l\'était : je l\'ai épargné, et la mousse l\'a quitté.' },
    { who: 'amanite', text: 'Un singe qui a eu de la chance. Celle-là, il n\'y avait plus rien à sauver dedans.' },
    { who: 'amanite', text: 'On arrache la mauvaise herbe, Agarica. On ne la console pas.' },
    { who: 'agarica', text: 'Ce ne sont pas des mauvaises herbes. Ce sont les animaux de notre forêt !' },
    { who: 'amanite', text: 'Tu as toujours eu le cœur trop grand. C\'est pour ça que je t\'aime bien… et pour ça que la forêt te dévorera.' },
    { who: 'amanite', text: 'Et ça ? Une araignée ? Tu voyages avec une araignée, maintenant ?' },
    { who: 'xara', text: 'Enchantée, moi aussi.' },
    { who: 'amanite', text: '… Je vais jusqu\'à la source de la mousse. Seule. Ne te mets pas en travers de mon chemin.' },
  ];
};

CUTSCENES.ff2_intro = [{ wait: 300 }, { say: 'ff2_intro' }];
CUTSCENES.ff2_totem_poche = [{ wait: 400 }, { say: 'ff2_totem_poche' }];
CUTSCENES.ff2_envol = [
  { camera: { x: 3800, y: 300, ms: 1000 } },
  { say: 'ff2_envol' },
  { cameraFollow: true },
  { toast: 'Double saut depuis le bord : plane jusqu\'à la clairière →' },
];
CUTSCENES.aigle_revele = [
  { say: 'aigle_revele' },
  { toast: 'Double saut : tu planes — S : piqué — les courants d\'air portent l\'aigle' },
];

CUTSCENES.amanite_rencontre = (scene) => {
  const st = scene.__a2 || {};
  return [
    { playerFace: 'right' },
    { camera: { x: (scene.player.x + 1990) / 2 + 40, y: 300, ms: 700 } },
    // Coup de lance sur la bête corrompue : la méthode d'Amanite, sous nos yeux.
    { call: (sc) => a2AmaniteStrike(sc, st) },
    { npcFace: { npc: 'amanite', dir: 'player' } },
    { npcAnim: { npc: 'amanite', anim: 'talk' } },
    { say: 'amanite_rencontre' },
    { call: (sc) => a2AmaniteLeaves(sc) },
    { say: 'amanite_apres' },
    { set: { amaniteMet: true } },
    { cameraFollow: true },
  ];
};

// Petite bête de mousse dessinée (Amanite l'abat à l'arrivée d'Agarica).
function a2DrawMossBeast(scene, x, y) {
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
  storyPutBehindPlayer(scene, g);
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
  for (let i = 0; i < 10; i++) {
    const m = scene.add.circle(beast.x + Phaser.Math.Between(-30, 30), beast.y - 30, Phaser.Math.Between(3, 7), 0x6fae3a);
    scene.tweens.add({ targets: m, y: beast.y - 2, x: m.x + Phaser.Math.Between(-30, 30), alpha: 0, duration: 600, onComplete: () => m.destroy() });
  }
  await a2Tween(scene, { targets: beast, scaleY: 0.25, alpha: 0.55, duration: 500, ease: 'Quad.easeIn' });
  await showDialogue(scene, ['Sur la grande île, une silhouette rouge vient d\'abattre sa lance sur une bête couverte de mousse.']);
  a.playManifest('idle');
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

// Décor : ruines de gardiens, îlots lointains, forêt malade à l'horizon.
function a2Ff2Decor(scene) {
  const st = scene.__a2;
  st.sky = a2SkyWash(scene, 0x9fd3ff, 0.55);
  a2Glow(scene, scene.scale.width - 140, 80, 300, 0xfff1c0, 0.7, 881).setScrollFactor(0);
  // Îlots lointains (parallaxe lente) et horizon malade, vers la droite.
  const far = scene.add.graphics().setScrollFactor(0.25);
  const bg = scene.children.list.find((o) => o.type === 'TileSprite');
  far.fillStyle(0x6f8fb0, 0.55);
  [[200, 150, 140], [520, 230, 90], [900, 120, 170], [1250, 210, 110]].forEach(([x, y, w]) => {
    far.fillEllipse(x, y, w, w * 0.28);
    far.fillTriangle(x - w * 0.35, y + 4, x + w * 0.35, y + 4, x, y + w * 0.45);
  });
  far.fillStyle(0x1f3a1a, 0.85);
  far.fillEllipse(1500, 470, 900, 160);
  far.fillStyle(0x6fdc3a, 0.25);
  far.fillEllipse(1500, 440, 500, 60);
  if (bg) a2PlaceAbove(scene, far, st.sky);
  a2DrawTotemRuin(scene, 1150, 320 + 16, 70);
  a2DrawTotemRuin(scene, 1370, 320 + 16, 40, 0x8a7a66);
}

ZONE_SCRIPTS.acte2_ff2 = {
  create(scene) {
    a2Ceiling(scene);
    scene.__a2 = { hadEagle: !!storyGet('hasEagleForm'), revealQueued: false, beast: null };
    a2InteractReset(scene);
    a2Ff2Decor(scene);
    if (!storyGet('amaniteMet')) scene.__a2.beast = a2DrawMossBeast(scene, 2070, 384 + 16);
    else {
      // Trace du passage d'Amanite : une flaque de mousse morte.
      const g = scene.add.graphics();
      g.fillStyle(0x34502a, 0.7);
      g.fillEllipse(2070, 396, 80, 14);
      storyPutBehindPlayer(scene, g);
    }
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
  clairiere_arrivee: [
    { who: 'agarica', text: 'J\'ai… j\'ai réussi ! Je me suis posée !' },
    { who: 'xara', text: 'Avec une certaine élégance, même. Presque.' },
    { who: 'agarica', text: 'Regarde, Xara : la plante est juste là. Et autour d\'elle, l\'herbe est verte. Vraiment verte.' },
  ],
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
    { who: 'agarica', text: 'Merci, petite plante. Je te promets d\'en prendre soin.' },
    { who: 'xara', text: 'Une guérisseuse saurait quoi en faire. Il y en a une, pas loin d\'ici… je sens ses papillons.' },
    { who: 'agarica', text: 'Ses papillons ?' },
    { who: 'xara', text: 'Les voilà. Suis-les.' },
  ],
  plante_revue: [
    { who: 'agarica', text: 'Un nouveau bouton pointe déjà, là où j\'ai pris la fleur.' },
  ],
});

CUTSCENES.clairiere_arrivee = [{ say: 'clairiere_arrivee' }];
CUTSCENES.plante_prelevement = [
  { playerFace: 'right' },
  { say: 'plante_examen' },
  { call: (scene) => a2PlantePick(scene) },
  { give: 'fleur_resistante' },
  { set: { fleurPrelevee: true } },
  { wait: 600 },
  { say: 'plante_apres' },
  { call: (scene) => a2ClairiereOpenPath(scene, true) },
  { toast: 'Suis les papillons vers l\'est →' },
];

// Plante dessinée : tige, feuilles, fleur blanche et rose, halo qui pulse.
function a2DrawPlante(scene, x, y, picked) {
  const st = scene.__a2;
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

// Tapis de mousse partout… sauf dans le cercle autour de la plante.
function a2DrawMossCarpet(scene, cx, radius, levelWidth) {
  const g = scene.add.graphics();
  const rnd = new Phaser.Math.RandomDataGenerator(['clairiere']);
  for (let x = 140; x < levelWidth; x += 26) {
    if (Math.abs(x - cx) < radius) continue;
    const near = Math.abs(x - cx) < radius + 70;
    const y = storyGroundY(scene, x, 448);
    // Correctif contraste (vert sombre sur herbe verte = invisible) : même
    // code couleur que les amas de mousse (drawMossVisual, StoryKit) -- socle
    // presque noir, bosses vertes, reflets vert toxique bien visibles.
    const a = near ? 0.65 : 1;
    const w = rnd.realInRange(34, 56);
    g.fillStyle(0x10200f, 0.92 * a);
    g.fillEllipse(x, y + 3, w, rnd.realInRange(16, 24));
    g.fillStyle(rnd.pick([0x2f5a2a, 0x3e7a2c, 0x274d22]), a);
    g.fillEllipse(x + rnd.realInRange(-6, 6), y, w * 0.6, rnd.realInRange(9, 14));
    g.fillStyle(0x9bff5a, 0.85 * a);
    g.fillCircle(x + rnd.realInRange(-14, 14), y - rnd.realInRange(0, 5), rnd.realInRange(2, 3.5));
    if (rnd.frac() < 0.5) g.fillCircle(x + rnd.realInRange(-16, 16), y + rnd.realInRange(-2, 6), 2);
  }
  // Cercle propre : herbe vive et petites fleurs.
  const yC = storyGroundY(scene, cx, 448);
  g.fillStyle(0x7bd35a, 0.85);
  g.fillEllipse(cx, yC + 4, radius * 2, 18);
  for (let i = 0; i < 16; i++) {
    const fx = cx + rnd.realInRange(-radius + 20, radius - 20);
    g.fillStyle(rnd.pick([0xffe9f5, 0xffc6e0, 0xfff2a8]), 1);
    g.fillCircle(fx, yC - 2, 3);
  }
  storyPutBehindPlayer(scene, g);
  // Colonne de lumière douce au-dessus du cercle.
  a2Glow(scene, cx, yC - 160, 520, 0xfff6d8, 0.22, 2).setDisplaySize(radius * 2.2, 520);
}

async function a2PlantePick(scene) {
  const st = scene.__a2;
  if (!st.fleur) return;
  const p = scene.player;
  await a2Tween(scene, { targets: st.fleur, x: p.x, y: p.y - 60, scale: 0.6, duration: 700, ease: 'Sine.easeInOut' });
  await a2Tween(scene, { targets: st.fleur, alpha: 0, duration: 250 });
  st.fleur.destroy();
  st.fleur = scene.add.graphics({ x: st.cfg.x + 2, y: storyGroundY(scene, st.cfg.x, 448) - 82 });
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
    a2DrawPlante(scene, cfg.x, storyGroundY(scene, cfg.x, 448) + 4, picked);
    // On arrive en planant : Agarica est déjà en aigle (2e saut consommé).
    const p = scene.player;
    if (a2EnterId(scene) === 'from_ff2' && p.hasEagleForm) {
      p.jumpsUsed = 2;
      p.airJumpForm = 'eagle';
      p.setVelocityX(120);
      st.arrivalPending = !storyGet('clairiereArrivee');
    }
    st.exitHutte = scene.__exits.find((e) => e.targetScene === 'HutteMorgatScene');
    if (!picked && !inventoryHas('fleur_resistante')) {
      scene.__exits = scene.__exits.filter((e) => e !== st.exitHutte);
      st.gate = a2Walls(scene, [2200]);
    } else {
      a2ClairiereOpenPath(scene, false);
    }
    a2AddInteract(scene, {
      x: cfg.x, y: storyGroundY(scene, cfg.x, 448) + 16, h: 120,
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
    if (st.gate && p.x > 2120 && scene.time.now > (st.gateToastAt || 0)) {
      st.gateToastAt = scene.time.now + 3000;
      showToast(scene, 'Xara : « La plante d\'abord, Agarica. »', 2200);
    }
    a2UpdateInteract(scene);
  },
};

// ===========================================================================
// 11. HUTTE DE MORGAT — répulsif, totem de poche, crash
// ===========================================================================
Object.assign(DIALOGUES, {
  hutte_arrivee: [
    { who: 'agarica', text: 'Tous ces papillons… on dirait des étincelles qui dansent.' },
    { who: 'xara', text: 'Les papillons de la guérisseuse. Ils l\'ont déjà prévenue de notre arrivée, j\'en suis sûre.' },
  ],
  morgat_accueil: [
    { who: 'morgat', text: 'Doucement, mes petites, doucement… Elles t\'ont trouvée bien avant que tu me trouves.' },
    { who: 'morgat', text: 'Je suis Morgat. Et toi, tu sens la clairière : tu portes quelque chose que la mousse ne touche pas.' },
  ],
  morgat_sans_fleur: [
    { who: 'morgat', text: 'Mais tu reviens les mains vides. La plante, ma petite : il me faut une de ses fleurs, une seule.' },
  ],
  morgat_fleur: [
    { who: 'agarica', text: 'Une fleur de la plante. Je n\'en ai pris qu\'une, promis. Elle est pour vous.' },
    'Agarica tend la fleur. Les papillons s\'y posent un instant, comme pour la saluer.',
    { who: 'morgat', text: 'Une seule, et cueillie avec respect. Tu as de bonnes mains. Laisse-moi faire.' },
  ],
  morgat_repulsif: [
    { who: 'morgat', text: 'Voilà. Quelques gouttes de ceci, et la mousse recule en sifflant.' },
    { who: 'morgat', text: 'En bas, dans la forêt sombre, un mur de mousse étouffe un vieux passage depuis des lunes. Le sentier, là-bas, y descend.' },
  ],
  morgat_antidote: [
    { who: 'morgat', text: 'Le reste de la fleur, je le garde. Il me faut du temps pour un vrai antidote.' },
    { who: 'agarica', text: 'Un antidote ? Pour… les animaux ?' },
    { who: 'morgat', text: 'Pour ceux qui peuvent encore être sauvés. Pas tous. Mes papillons sentent la différence.' },
    { who: 'agarica', text: 'On peut les sauver… Je le savais !' },
  ],
  morgat_totem: [
    { who: 'morgat', text: 'Qu\'est-ce qui dépasse de ta besace ? Montre… Un totem de poche. Fendu.' },
    { who: 'morgat', text: 'Regarde mes petites : elles tournent autour. Il les reconnaît… ou elles le reconnaissent.' },
    { who: 'morgat', text: 'Je ne sais pas le réparer. Ce n\'est pas de l\'herboristerie : c\'est plus vieux que moi.' },
  ],
  morgat_promesse: [
    { who: 'morgat', text: 'Quand l\'antidote sera prêt, mes papillons te le porteront. Où que tu sois.' },
    { who: 'agarica', text: 'Même au cœur de la mousse ?' },
    { who: 'morgat', text: 'Surtout là.' },
  ],
  morgat_xara_vol: [
    { who: 'xara', text: 'Le temps presse. À pied, il nous faudrait des jours pour rejoindre le cœur de la mousse.' },
    { who: 'xara', text: 'Mais par les airs… Depuis la falaise, à l\'est de la hutte, tu pourrais planer droit vers lui.' },
    { who: 'agarica', text: 'Planer aussi loin ? Je viens à peine d\'apprendre !' },
    { who: 'xara', text: 'Alors c\'est le moment d\'apprendre vite.' },
    { who: 'morgat', text: 'Les apprentis tombent toujours, la première fois. Tâche de tomber sur quelque chose de mou.' },
  ],
  morgat_apres: [
    { who: 'morgat', text: 'L\'antidote mijote. Lui, il ne se presse pas.' },
    { who: 'morgat', text: 'Mes papillons te trouveront, ma petite. Va, maintenant. La falaise est à l\'est.' },
  ],
  hutte_pas_encore: [
    { who: 'xara', text: 'Pas si vite. Morgat nous attend, et ta fleur ne servira à rien au fond de ta besace.' },
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
    { who: 'agarica', text: 'Bon. La falaise. Le vide. Et la forêt malade, tout au bout.' },
    { who: 'xara', text: 'Je me tiens à toi. Double saut, et vise le cœur sombre, droit devant.' },
    { who: 'agarica', text: 'Xara… et si je n\'y arrive pas ?' },
    { who: 'xara', text: 'Alors tu tomberas plus près qu\'en marchant. C\'est déjà ça.' },
  ],
});

CUTSCENES.hutte_arrivee = [{ say: 'hutte_arrivee' }];
CUTSCENES.hutte_pas_encore = [{ say: 'hutte_pas_encore' }, { playerMove: { toX: 2420 } }];

CUTSCENES.morgat_rencontre = (scene) => {
  const steps = [
    { npcFace: { npc: 'morgat', dir: 'player' } },
    { npcAnim: { npc: 'morgat', anim: 'talk' } },
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
    { npcAnim: { npc: 'morgat', anim: 'talk' } },
    { say: 'morgat_repulsif' },
    { give: 'repulsif' },
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
  for (let i = 0; i < 16; i++) {
    const b = scene.add.circle(m.x + Phaser.Math.Between(-24, 24), m.y - 40, Phaser.Math.Between(3, 6),
      i % 2 ? STORY_UI.pink : 0xd0b060, 0.9).setDepth(1040);
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
  const y = storyGroundY(scene, x, 448) + 6;
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

function a2DrawRampe(scene, x) {
  const y = 256 + 16;
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
    const sky = a2SkyWash(scene, 0x9fd3ff, 0.5);
    // Forêt malade à l'horizon, vers l'est : la destination du vol.
    const far = scene.add.graphics().setScrollFactor(0.3);
    far.fillStyle(0x1f3a1a, 0.9);
    far.fillEllipse(1500, 500, 1100, 200);
    far.fillStyle(0x6fdc3a, 0.22);
    far.fillEllipse(1500, 460, 640, 70);
    a2PlaceAbove(scene, far, sky);
    a2DrawHutte(scene, cfg.x);
    a2DrawRampe(scene, cfg.rampeX);
    a2AddInteract(scene, {
      x: cfg.sentierX, y: 464, h: 110,
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
    { who: 'agarica', text: 'Aïe. Tout tourne…' },
  ],
  fc1_reveil_2: [
    { who: 'agarica', text: 'Où sommes-nous ? Les arbres sont tout tordus… et la mousse respire.' },
    { who: 'xara', text: 'Le cœur de la corruption. Tu n\'as pas atterri où tu voulais… mais tu en es plus près que quiconque.' },
    { who: 'agarica', text: 'Plus près que Galter ?' },
    { who: 'xara', text: 'Galter n\'a jamais su voler.' },
    { who: 'agarica', text: 'Moi non plus, apparemment.' },
  ],
  fc1_ferme: [
    { who: 'agarica', text: 'La mousse… elle se referme derrière moi !' },
    { who: 'xara', text: 'Elle nous sent. Ne reste pas immobile. Avance.' },
  ],
  fc1_amas: [
    { who: 'xara', text: 'Un amas de mousse, dur comme de l\'écorce. Il bouche toute la galerie.' },
    { who: 'agarica', text: 'Le talisman de mon père… La force de l\'ours devrait suffire.' },
  ],
  fc1_note_galter: [
    'Un campement abandonné. Sous une pierre, une page arrachée, couverte d\'une écriture pressée.',
    '« Jour 23. La mousse est plus épaisse ici que partout ailleurs. Elle pousse en spirale, autour de quelque chose. »',
    '« Les bêtes malades tournent en rond près de l\'antre. Elles ne mangent plus. Elles gardent. »',
    '« Je n\'irai pas plus loin seul. Clak refuse aussi. Si tu lis ceci, c\'est que je suis passé par là. Ou que je l\'ai perdue. »',
    { who: 'agarica', text: 'Galter est venu jusqu\'ici… à pied !' },
    { who: 'xara', text: 'Et il a vu juste. Les bêtes « gardent ». Reste à savoir quoi.' },
  ],
  fc1_papillons: [
    { who: 'agarica', text: 'Des papillons ! Ce sont ceux de Morgat… Ils m\'ont suivie jusqu\'ici ?' },
  ],
  fc1_papillons_totem: [
    { who: 'agarica', text: 'Et le totem de poche… il est tiède, dans ma besace. Il ne l\'était jamais.' },
    { who: 'xara', text: 'Ils le reconnaissent. Ou lui les reconnaît. Garde-le près de toi.' },
  ],
  fc1_spirale: [
    { who: 'agarica', text: 'Xara, regarde ce tronc. Quelqu\'un y a gravé une spirale… On dirait une toile.' },
    { who: 'xara', text: '…' },
    { who: 'xara', text: 'Ne la touche pas.' },
    { who: 'agarica', text: 'Tu sais ce que c\'est ?' },
    { who: 'xara', text: 'Je sais que ce n\'est pas le moment. Avance, Agarica.' },
  ],
  fc1_mur: [
    { who: 'xara', text: 'Un mur vivant. Il ne cédera ni à tes coups, ni à l\'ours.' },
    { who: 'agarica', text: 'Le répulsif de Morgat ! Quelques gouttes, elle a dit…' },
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
CUTSCENES.fc1_ferme = [{ shake: { ms: 400, intensity: 0.006 } }, { say: 'fc1_ferme' }];
CUTSCENES.fc1_amas = [
  { say: 'fc1_amas' },
  { toast: 'Compétence de l\'ours (touche A, F ou R) : brise l\'amas. Le feu de camp recharge ton énergie.' },
];
CUTSCENES.fc1_note_galter = [{ wait: 300 }, { say: 'fc1_note_galter' }];
CUTSCENES.fc1_papillons = (scene) => [
  { call: (sc) => a2Fc1Butterflies(sc, true) },
  { wait: 1200 },
  { say: 'fc1_papillons' },
  ...(inventoryHas('totem_poche_casse') ? [{ call: (sc) => a2Fc1TotemPulse(sc) }, { say: 'fc1_papillons_totem' }] : []),
];
CUTSCENES.fc1_spirale = [
  { camera: { x: 2470, y: 300, ms: 700 } },
  { say: 'fc1_spirale' },
  { cameraFollow: true },
];
CUTSCENES.fc1_mur = [
  { say: 'fc1_mur' },
  { toast: 'E devant le mur : verser le répulsif' },
];
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

// Cratère du crash + branches cassées.
function a2DrawCrater(scene, x) {
  const y = storyGroundY(scene, x, 448) + 16;
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
  const y = storyGroundY(scene, x, 448) + 16;
  const g = scene.add.graphics({ x, y });
  g.fillStyle(0x3b3026, 1);
  g.fillRect(-26, -330, 52, 330);
  g.fillStyle(0x2f5a2a, 1);
  g.fillEllipse(-20, -180, 30, 90);
  g.fillEllipse(24, -90, 26, 70);
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
  storyPutBehindPlayer(scene, g);
  const glow = a2Glow(scene, x, y - 150, 90, 0xb48cff, 0.25, 3);
  scene.tweens.add({ targets: glow, alpha: 0.05, duration: 1600, yoyo: true, repeat: -1 });
}

// Touffes de mousse vivante qui se tendent vers Agarica.
function a2MakeMossTufts(scene, xs) {
  return xs.map((x, i) => {
    const y = storyGroundY(scene, x, 448) + 14;
    const g = scene.add.graphics({ x, y });
    const h = 26 + (i % 3) * 12;
    g.fillStyle(0x2f5a2a, 1);
    g.fillTriangle(-9, 0, 9, 0, 0, -h);
    g.fillStyle(0x3e7a2c, 1);
    g.fillTriangle(-5, 0, 5, 0, 2, -h * 0.7);
    g.fillStyle(0x9bff5a, 0.85);
    g.fillCircle(0, -h, 3);
    storyPutBehindPlayer(scene, g);
    return { g, x, phase: i * 0.7 };
  });
}

function a2UpdateMossTufts(scene, time) {
  const p = scene.player;
  for (const t of scene.__a2.tufts || []) {
    const dx = p.x - t.x;
    const lean = Math.abs(dx) < 200 ? Phaser.Math.Clamp(dx / 200, -1, 1) * 0.6 : 0;
    t.g.rotation = lean + Math.sin(time / 500 + t.phase) * 0.08;
  }
}

// La mousse se referme derrière Agarica (cosmétique + collision).
function a2Fc1CloseBehind(scene, animate) {
  const x = 420;
  const h = 260;
  const y = storyGroundY(scene, x, 448) - h / 2 + 16;
  const v = drawMossVisual(scene, x, y, 90, h, 'mousse_mur', true);
  addMossBody(scene, x, y, 90, h);
  if (animate) {
    v.setScale(1, 0.05);
    scene.tweens.add({ targets: v, scaleY: 1, duration: 900, ease: 'Back.easeOut' });
  }
}

ZONE_SCRIPTS.acte2_fc1 = {
  create(scene) {
    a2Ceiling(scene);
    scene.__a2 = { tufts: [], butterflies: null };
    a2InteractReset(scene);
    a2DrawCrater(scene, 170);
    a2DrawSpiralTree(scene, 2470);
    const xs = [];
    for (let x = 300; x < 4000; x += 150 + (x % 7) * 9) if (Math.abs(x - 1824) > 120 && Math.abs(x - 3200) > 90) xs.push(x);
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
    { who: 'xara', text: 'Agarica… le sol vibre. Quelque chose d\'énorme respire sous la mousse.' },
    { who: 'ghilt', text: 'GRRRROOOOAAAAH !' },
    { who: 'agarica', text: 'Un tapir… gigantesque. La mousse lui coule du museau comme de la bave.' },
    { who: 'xara', text: 'Ghil\'t, le Fléau de la Forêt. Voilà ce que les bêtes de Galter « gardaient ».' },
    { who: 'xara', text: 'Méfie-toi de ses charges, de son souffle… et ne marche pas dans ce qu\'il crache !' },
    { who: 'agarica', text: 'Il souffre, Xara. Je l\'entends dans sa voix.' },
    { who: 'agarica', text: 'Je ne fuirai pas. Mais je ne veux pas le tuer.' },
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
    { who: 'agarica', text: '… Où… où suis-je ? Il fait si noir…' },
    { who: 'xara', text: 'Je suis là, Agarica. Ne bouge pas trop vite, tu as fait une longue chute.' },
    { who: 'agarica', text: 'Ghil\'t… il était trop fort. Je n\'ai rien pu faire.' },
    { who: 'xara', text: 'Chut. Respire. Regarde, là-haut… tu vois ces petites lumières ?' },
  ],
  trou_papillons: [
    { who: 'agarica', text: 'Des papillons… ce sont ceux de Morgat !' },
    { who: 'xara', text: '« Où que tu sois », avait-elle dit. Ils ont tenu parole.' },
    { who: 'agarica', text: 'Ils portent quelque chose, tout doucement… Un bocal ! L\'antidote est prêt !' },
  ],
  trou_totem: [
    { who: 'agarica', text: 'Il y en a si peu… Je devrais le boire ? Ou le lancer sur Ghil\'t ?' },
    { who: 'xara', text: 'Ni l\'un ni l\'autre. Bu, il ne soignerait que toi. Lancé, la mousse l\'avalerait.' },
    { who: 'xara', text: 'Ton totem de poche… il brille depuis que les papillons sont là. Verse l\'antidote dedans.' },
    { who: 'agarica', text: 'Comment tu sais ça, toi ?' },
    { who: 'xara', text: 'Disons que j\'ai déjà vu de vieilles choses se réveiller. Doucement, maintenant.' },
    { who: 'agarica', text: 'D\'accord… goutte à goutte.' },
  ],
  trou_sortie: [
    { who: 'agarica', text: 'Le totem est tout chaud… Je sens les papillons, comme s\'ils faisaient partie de moi.' },
    { who: 'xara', text: 'Ils te prêtent leur force : soigner au lieu de détruire. Affaiblis Ghil\'t, puis laisse-les faire.' },
    { who: 'agarica', text: 'Ils montent vers la lumière… Ils nous montrent le chemin.' },
  ],
  ghilt_soin: [
    { who: 'agarica', text: 'Regarde, Xara… la mousse se retire !' },
    { who: 'xara', text: 'Il respire… doucement. Il n\'a plus rien d\'un fléau.' },
    { who: 'ghilt', text: '… Mmmh…' },
    { who: 'agarica', text: 'Tu n\'étais pas un monstre. Tu étais malade, comme la forêt.' },
    { who: 'xara', text: 'Cette marque, sur son flanc…' },
    { who: 'agarica', text: 'Quelle marque ?' },
    { who: 'xara', text: 'Rien. Plus tard.' },
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
  ghilt_galter: [
    { who: 'galter', text: 'Par toutes les racines… j\'arrive trop tard, hein ?' },
    { who: 'clak', text: 'Clac…' },
    { who: 'agarica', text: 'Galter… je l\'avais soigné. Amanite l\'a achevé sous mes yeux.' },
    { who: 'galter', text: 'J\'ai vu les papillons de loin. Et j\'ai vu la mousse reculer. Ça, petite, personne ne l\'avait jamais fait.' },
    { who: 'galter', text: 'Regarde-le : la mousse le rongeait de l\'intérieur. Il était malade, pas la maladie. La source est ailleurs.' },
    { who: 'galter', text: 'Viens. On rentre au bosquet. Ton père doit entendre la vérité… de ma bouche, s\'il le faut.' },
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
    { who: 'galter', text: 'Elle est avec moi. Range ta lance, mon garçon, avant de te piquer avec.' },
    { who: 'garde', text: 'Et vous êtes qui, vous ?' },
    { who: 'galter', text: 'Quelqu\'un que ton chef connaît depuis bien avant ta naissance.' },
  ],
  br_galter_chef: [
    { who: 'pere_chef', text: '… Galter ? Vieille racine ! Ça fait dix hivers !' },
    { who: 'galter', text: 'Onze. Et ta barbe a blanchi, ma vieille branche.' },
    { who: 'clak', text: 'Clac !' },
    { who: 'pere_chef', text: 'Et Clak, toujours aussi bavard. Que fais-tu ici… avec ma fille ?' },
  ],
  br_verite: [
    { who: 'galter', text: 'Je viens rétablir la vérité. J\'étais à l\'antre du Fléau. J\'ai tout vu.' },
    { who: 'galter', text: 'Agarica a affaibli Ghil\'t sans jamais l\'achever. Puis, avec les papillons de la guérisseuse, elle l\'a guéri.' },
    { who: 'galter', text: 'La mousse a quitté son corps. Il respirait en paix, comme une bête qui sort d\'une longue fièvre.' },
    { who: 'galter', text: 'Et c\'est là qu\'Amanite est arrivée. Elle a achevé une créature guérie.' },
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
  br_galter_source: [
    { who: 'galter', text: 'Pas de fête trop longue, mes amis. Ghil\'t n\'était pas la source de la mousse.' },
    { who: 'galter', text: 'C\'était une victime. Un relais, peut-être. La mousse vient de plus profond, et elle pousse encore.' },
    { who: 'galter', text: 'J\'ai la carte pour le prouver… enfin, une partie de la carte.' },
    { who: 'clak', text: 'Clac.' },
    { who: 'galter', text: 'Oui. La partie que tu n\'as pas mangée.' },
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
  bosquet_retour_galter: [{ who: 'galter', text: 'La carte est à jour. Enfin, presque : Clak a mangé le coin sud.' }],
  bosquet_retour_clak: [{ who: 'clak', text: 'Clac !' }],
});

CUTSCENES.bosquet_retour = [
  { wait: 400 },
  { npcAdd: { id: 'galter', x: 20 } },
  { npcAdd: { id: 'clak', x: -30 } },
  { parallel: [
    { playerMove: { toX: 560, speed: 150 } },
    { npcMove: { npc: 'galter', toX: 470, speed: 150 } },
    { npcMove: { npc: 'clak', toX: 420, speed: 150 } },
  ] },
  { playerFace: 'right' },
  { camera: { x: 1260, y: 270, ms: 1200 } },
  { npcAnim: { npc: 'amanite', anim: 'talk' } },
  { say: 'br_acclamations' },
  { npcAnim: { npc: 'amanite', anim: 'idle' } },
  { cameraFollow: true },
  { npcMove: { npc: 'habitant_garde', toX: 650, speed: 200 } },
  { npcFace: { npc: 'habitant_garde', dir: 'player' } },
  { say: 'br_garde' },
  { npcMove: { npc: 'pere_chef', toX: 760, speed: 140 } },
  { npcFace: { npc: 'pere_chef', dir: 'player' } },
  { say: 'br_galter_chef' },
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
  { say: 'br_galter_source' },
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

// L'idole sur son autel (pierre levée), et le fragment qu'Amanite emporte.
function a2DrawIdol(scene) {
  const st = scene.__a2;
  st.idol = addItemIcon(scene, 1560, 330, 'idole', 44);
  storyPutBehindPlayer(scene, st.idol);
  st.idolGlow = a2Glow(scene, 1560, 330, 110, 0x8fe3b8, 0.35, 3);
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
  const frag = addItemIcon(scene, 1560, 318, 'idole_fragment', 26).setDepth(1040);
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
      // Revisite après la fin : Galter et Clak sont restés au bosquet.
      for (const n of [
        { id: 'galter', x: 470, talk: 'bosquet_retour_galter' },
        { id: 'clak', x: 420, talk: 'bosquet_retour_clak' },
      ]) {
        const npc = createStoryNpc(scene, n);
        scene.__story.interactables.push({ kind: 'npc', npc });
      }
      if (scene.__a2.idol) scene.__a2.idol.setTint(0x9aa89a);
      return;
    }
    runCutscene(scene, 'bosquet_retour');
  },
  update() {},
};
