// ZONE_SCRIPTS.kainati_arene — combat contre Kainati, Roi des Simiens
// (zone grand_arbre_arene, donnée `script: 'kainati_arene'` + `kainatiArena`).
// Entités (boss, dangers, esprit) : src/entities/Kainati.js.
//
// ENCHAÎNEMENT (décision utilisateur 2026-10-24) : totem du singe dans les
// racines → monde spirituel (forme singe) → retour aux racines → l'arène,
// accessible SEULEMENT par les lianes de la cime → Kainati → la route des
// hauteurs (forêt flottante 1) s'ouvre. Agarica a donc la forme singe ici.
//
// RÈGLES DU COMBAT :
// - Kainati reste au sol, entre ses deux postes (bords de l'arène). Les 2
//   lianes (demande utilisateur du 2026-10-25) sont pour Agarica : ses
//   attaques pleine largeur (onde de choc, vague de mousse, éboulement) et sa
//   charge ne s'esquivent qu'accrochée à une liane ; télégraphes calés pour
//   en rejoindre une à pied depuis n'importe où (cf. KAINATI_TIMINGS).
// - Sans la forme singe active (ancienne sauvegarde, « Zones de test », aigle
//   choisi au feu de camp), le combat ne commence pas : Xara explique et le
//   chemin du retour (racines, feu de camp du palier) reste ouvert.
// - Frappable à tout moment (1 PV, ~0,26 s entre deux coups) ; après chaque
//   charge (esquive : une liane) il heurte le rideau, rebondit vers le
//   centre et reste SONNÉ ~3 s (2 PV par coup, ~0,2 s), puis retourne au
//   trot à son poste. Son contact blesse (sauf sonné ou pendant ce retour).
//   48 PV ; à 24, phase 2 (cri, plus vite,
//   salves de 3 pierres, une pierre tombe de la canopée sur la liane
//   d'Agarica pendant chaque grande attaque).
// - Victoire : épargné, inerte assis (cinématique `kainati_victoire`), flag
//   `kainatiDefeated` (+ `kainatiCalmX`), rideau droit dissous, sortie vers
//   ForetFlottante1Scene. Revisite : il reste inerte, « E : parler ».
// - Mort d'Agarica (comme boss_ghilt.js, 'player-depleted') : il se fige,
//   fondu au noir, la zone redémarre à l'entrée (`from_racines`) ; le combat
//   reprend en repassant `lockX`, sans redonner l'intro.
//
// Flags : `kainatiIntroSeen`, `kainatiDefeated`, `kainatiCalmX`.
// Textes : CUTSCENES|DIALOGUES `kainati_intro`, `kainati_victoire`,
// `kainati_calme` (src/story/acte1_arbre.js, chargé après ce fichier).

const KAINATI_TALK_RANGE = 150;
const KAINATI_BOSS_NAME = 'Kainati, Roi des Simiens';

// --- Textes par défaut (remplacés par acte1_arbre.js) ---
if (!DIALOGUES.kainati_intro) {
  DIALOGUES.kainati_intro = [
    { who: 'kainati', text: "Encore une créature d'en bas qui grimpe vers ma cime..." },
    { who: 'kainati', text: 'Assez ! Les branches jugeront pour moi.' },
  ];
}
if (!DIALOGUES.kainati_victoire) {
  DIALOGUES.kainati_victoire = [
    { who: 'kainati', text: 'La brume se dissipe... Tu... combats la mousse ?' },
    { who: 'kainati', text: 'Va. La route des hauteurs est à toi.' },
  ];
}
if (!DIALOGUES.kainati_calme) {
  DIALOGUES.kainati_calme = [
    { who: 'kainati', text: 'Que les lianes te portent, petite druidesse.' },
  ];
}

// --- Petits wrappers tolérants ---
function kainatiFlag(scene, key, def) {
  if (typeof storyGet === 'function') return storyGet(key, def);
  const v = scene.registry.get(key);
  return v === undefined ? def : v;
}

function kainatiSetFlag(scene, key, value) {
  if (typeof storySet === 'function') storySet(key, value);
  else scene.registry.set(key, value);
}

function kainatiToast(scene, text, ms = 2600) {
  if (typeof showToast === 'function') showToast(scene, text, ms);
}

function kainatiBubble(scene, who, text, ms) {
  if (typeof storyBulle === 'function') storyBulle(scene, who, text, ms, { replace: true });
  else kainatiToast(scene, text, ms || 2600);
}

function kainatiFrozen(scene) {
  return typeof isWorldFrozen === 'function' ? isWorldFrozen(scene) : scene.scene.isActive('CampfireMenuScene');
}

// Agarica = obstacle de la règle « interface dans l'écran » (LevelKit,
// worldUiAddScreenObstacle) pendant le combat, comme dans le duel de Geralt
// (playerGuard, GeraltDuel.js) : les alertes de Xara se posaient sur sa tête
// au moment précis où il faut lire l'attaque. Rectangle invisible fixé à
// l'écran, recalé sur sa silhouette à chaque image ; masqué hors combat.
function kainatiMakePlayerGuard(scene) {
  if (typeof worldUiAddScreenObstacle !== 'function') return null;
  const z = scene.add.zone(0, -999, 1, 1).setOrigin(0, 0).setScrollFactor(0).setVisible(false);
  worldUiAddScreenObstacle(z);
  return z;
}

function kainatiSyncPlayerGuard(scene, st) {
  const z = st.playerGuard;
  if (!z || !z.active) return;
  const p = scene.player;
  const on = (st.fightActive || st.starting) && !st.downFired && !st.won && p && p.active && p.visible && p.body;
  z.setVisible(!!on);
  if (!on) return;
  const box = typeof worldUiBodyBox === 'function' ? worldUiBodyBox(p) : null;
  const b = box || { left: p.body.left, right: p.body.right, top: p.body.top, bottom: p.body.bottom };
  const cam = scene.cameras.main;
  const pad = 3;
  z.setPosition(b.left - cam.scrollX - pad, b.top - cam.scrollY - pad);
  z.setSize(Math.max(1, b.right - b.left + 2 * pad), Math.max(1, b.bottom - b.top + 2 * pad));
}

// Forme singe : 'ready' (active, les lianes portent Agarica), 'other' (débloquée
// mais l'aigle est choisi au feu de camp), 'none' (pas encore obtenue). Sans
// elle, aucune grande attaque ne s'esquive : le combat ne doit pas commencer.
function kainatiMonkeyState(scene, p) {
  const unlocked = p && typeof p.isFormUnlocked === 'function' ? p.isFormUnlocked('monkey') : !!kainatiFlag(scene, 'hasMonkeyForm', false);
  if (!unlocked) return 'none';
  const air = p && typeof p.getActiveAirForm === 'function' ? p.getActiveAirForm() : kainatiFlag(scene, 'airForm', null);
  return air === 'monkey' ? 'ready' : 'other';
}

// Xara retient Agarica au seuil de l'arène (une fois par approche) : le
// combat ne démarre pas, et le retour reste libre (rideau gauche ouvert).
function kainatiNeedMonkey(scene, st, state) {
  if (st.toldMonkey) return;
  st.toldMonkey = true;
  st.boss.face(scene.player.x > st.boss.x ? 1 : -1);
  const text = state === 'other'
    ? 'Ses lianes ne portent que la forme du singe ! Choisis-la au feu de camp, juste derrière nous.'
    : 'Sans la forme du singe, ses coups balaieront tout le sol… Redescendons aux racines : le totem du singe nous attend.';
  kainatiBubble(scene, 'xara', text, 4200);
}

// Joue une cinématique si elle existe, sinon le dialogue du même id.
async function kainatiPlay(scene, id) {
  try {
    if (typeof runCutscene === 'function' && CUTSCENES[id]) await runCutscene(scene, id);
    else if (typeof showDialogue === 'function' && DIALOGUES[id]) await showDialogue(scene, id);
  } catch (e) {
    console.warn(`[kainati] cinématique ${id} :`, e);
  }
}

function kainatiDelay(scene, ms) {
  return new Promise((resolve) => scene.time.delayedCall(ms, resolve));
}

function kainatiLock(scene, on) {
  if (on) scene.__cutsceneLock = (Number(scene.__cutsceneLock) || 0) + 1;
  else scene.__cutsceneLock = Math.max(0, (Number(scene.__cutsceneLock) || 0) - 1);
  const p = scene.player;
  if (on && p && p.body) { p.setAccelerationX(0); p.setVelocityX(0); }
}

// --- Rideaux de mousse (bords de l'arène) : art `mousse_mur` (drawMossVisual,
// StoryKit), dessin par code en repli ; corps statique qui bloque Agarica.
function kainatiMakeCurtain(scene, x, floorY, ceilY) {
  const h = floorY - ceilY + 20;
  const y = floorY - h / 2;
  const visual = typeof drawMossVisual === 'function'
    ? drawMossVisual(scene, x, y, 64, h, 'mousse_mur', true)
    : scene.add.rectangle(x, y, 44, h, 0x2f4a22, 0.92).setStrokeStyle(3, 0x1a2a12);
  visual.setDepth(4);
  const zone = scene.add.zone(x, floorY / 2 - 200, 40, floorY + 400);
  scene.physics.add.existing(zone, true);
  scene.physics.add.collider(scene.player, zone);
  return { visual, zone, x };
}

function kainatiSetCurtain(scene, curtain, closed, instant = false) {
  if (!curtain) return;
  curtain.zone.body.enable = closed;
  scene.tweens.killTweensOf(curtain.visual);
  if (instant) { curtain.visual.setAlpha(closed ? 1 : 0).setVisible(closed); return; }
  curtain.visual.setVisible(true);
  if (closed) {
    spawnFx(scene, 'mossBreak', curtain.x, scene.__kainati.cfg.floorY - 120, { w: 60, h: 160 });
  } else {
    spawnFx(scene, 'melt', curtain.x, scene.__kainati.cfg.floorY - 160, { w: 60, h: 300, count: 8 });
  }
  scene.tweens.add({
    targets: curtain.visual,
    alpha: closed ? 1 : 0,
    duration: closed ? 350 : 1100,
    onComplete: () => curtain.visual.setVisible(closed),
  });
}

// --- Coups d'Agarica : Kainati n'est pas dans scene.enemies (pas de corps
// Arcade) ; on teste mêlée / piqué / pierre nous-mêmes, une fois par
// attaque, et on branche le « juice » générique (juiceOnEnemyHit : hit-stop,
// secousse, étincelles, flash, recul au dessin).
function kainatiLandHit(scene, st, source) {
  const boss = st.boss;
  const res = boss.takeHit(source);
  if (!res) return false;
  const p = scene.player;
  if (typeof juiceOnEnemyHit === 'function') juiceOnEnemyHit(scene, boss.sprite, { ...source, player: p });
  if (res.stunned) {
    // Coup double : plus lourd (secousse, éclat plus gros).
    const r = boss.getHitRect();
    juiceShake(scene, 'medium');
    spawnFx(scene, 'impact', Phaser.Math.Clamp(p.x, r.x, r.right), r.centerY, { power: 1.5, color: 0xffe066 });
  }
  if (typeof ENERGY_PER_HIT !== 'undefined' && p.gainEnergy && source.kind !== 'skill') p.gainEnergy(ENERGY_PER_HIT);
  return true;
}

function kainatiCheckPlayerHits(scene, st, time) {
  const p = scene.player;
  const boss = st.boss;
  if (!boss || !st.fightActive || boss.defeated) return;
  const rect = boss.getHitRect();
  const atk = p.getAttackHitbox ? p.getAttackHitbox() : null;
  if (atk && Phaser.Geom.Intersects.RectangleToRectangle(atk, rect)) {
    const id = p.isAttacking ? `atk-${p.attackEndTime}` : `dive-${Math.floor(time / 400)}`;
    // Coup consommé seulement s'il porte : pendant sa courte invulnérabilité,
    // le même coup (arc encore actif) porte dès qu'elle finit -- avant, il
    // était perdu sans dégât ni effet alors que l'arc le touchait.
    if (id !== st.lastAttackId && kainatiLandHit(scene, st, { kind: p.isAttacking ? 'melee' : 'dive', type: 'attack' })) {
      st.lastAttackId = id;
    }
  }
  // Pierres lancées par Agarica (compétence pierre) : hors de scene.enemies.
  if (typeof PierreProjectile === 'function') {
    for (const o of scene.children.list) {
      if (!(o instanceof PierreProjectile) || o.done || !o.active) continue;
      if (!Phaser.Geom.Intersects.RectangleToRectangle(o.getBounds(), rect)) continue;
      kainatiLandHit(scene, st, { kind: 'pierre', type: 'pierre', x: o.x, y: o.y });
      o.shatter();
    }
  }
}

// --- Indices (une fois chacun par combat) ---
function kainatiOnAttack(scene, st, ev) {
  if (!st.fightActive || st.disposed) return;
  const told = st.told;
  if (['slam', 'roar', 'sweep'].includes(ev.kind) && !told.full) {
    told.full = true;
    kainatiBubble(scene, 'xara', 'Tout le sol va y passer ! Accroche-toi à une liane, vite !', 2600);
  } else if (ev.kind === 'charge' && !told.charge) {
    told.charge = true;
    kainatiBubble(scene, 'xara', 'Il va charger ! Accroche-toi à une liane !', 2400);
  }
}

// --- Déroulé ---
async function kainatiStartFight(scene, st) {
  st.starting = true;
  st.told = {};
  kainatiSetCurtain(scene, st.leftCurtain, true);
  kainatiSetCurtain(scene, st.rightCurtain, true, true);
  const cam = scene.cameras.main;
  cam.setBounds(st.cfg.minX, 0, st.cfg.maxX - st.cfg.minX, scene.scale.height);
  const firstTime = !kainatiFlag(scene, 'kainatiIntroSeen', false);
  st.boss.face(scene.player.x > st.boss.x ? 1 : -1);
  st.boss.setPose('roarWind');
  juiceShake(scene, firstTime ? 'medium' : 'light', 500);
  if (firstTime) {
    await kainatiPlay(scene, 'kainati_intro');
    kainatiSetFlag(scene, 'kainatiIntroSeen', true);
  } else {
    await kainatiDelay(scene, 700);
  }
  if (st.disposed || scene !== st.scene) return;
  if (typeof showBossBar === 'function') showBossBar(scene, KAINATI_BOSS_NAME, () => (st.boss ? st.boss.hp / st.boss.maxHp : 0));
  st.boss.start();
  st.fightActive = true;
  st.starting = false;
  if (firstTime) {
    // Règle des lianes (Player.js) : seule Agarica devenue singe, donc après le
    // double saut, s'accroche ; un saut simple passe à travers.
    kainatiToast(scene, 'Ses grandes attaques couvrent tout le sol : double saut sous une liane, devenue singe tu t\'y accroches (Z/S : monter, descendre).\nFrappe-le quand tu peux ; après une charge, il est sonné : coups doublés !', 5200);
  }
}

// Mort d'Agarica (dernier cœur) : même logique que boss_ghilt.js — il se
// fige, puis fondu au noir et la zone redémarre proprement à l'entrée.
async function kainatiPlayerDown(scene, st) {
  if (st.downFired || st.disposed) return;
  st.downFired = true;
  st.fightActive = false;
  st.starting = false;
  st.boss.freeze();
  if (typeof hideBossBar === 'function') hideBossBar(scene);
  kainatiToast(scene, 'Agarica s\'effondre…', 1200);
  // Laisse la pose `death` (Player.finishHit, ~1,1 s) se jouer.
  await kainatiDelay(scene, 1150);
  if (st.disposed) return;
  kainatiLock(scene, true);
  const cam = scene.cameras.main;
  const black = scene.add.rectangle(0, 0, cam.width, cam.height, 0x000000).setOrigin(0).setScrollFactor(0).setDepth(2500).setAlpha(0);
  await new Promise((r) => scene.tweens.add({ targets: black, alpha: 1, duration: 450, onComplete: r }));
  if (st.disposed) return;
  const p = scene.player;
  scene.registry.set('hearts', p && p.maxHearts ? p.maxHearts : 3);
  kainatiLock(scene, false);
  scene.scene.restart({ enterId: 'from_racines' });
  scene.player = null;
}

function kainatiRevealPassage(scene, st, instant) {
  kainatiSetCurtain(scene, st.leftCurtain, false, instant);
  kainatiSetCurtain(scene, st.rightCurtain, false, instant);
  scene.cameras.main.setBounds(st.camBounds.x, st.camBounds.y, st.camBounds.width, st.camBounds.height);
  if (st.passageRevealed) return;
  st.passageRevealed = true;
  // Nouveau tableau : scene.__exits EST le tableau `exits` de la donnée de
  // zone (LevelKit) -- y pousser l'ajoutait à la donnée elle-même, une fois de
  // plus à chaque visite de l'arène.
  scene.__exits = [...(scene.__exits || []), ...(st.cfg.exitsAfterVictory || [])];
}

async function kainatiVictory(scene, st) {
  if (st.won) return;
  st.won = true;
  st.fightActive = false;
  const boss = st.boss;
  if (typeof hideBossBar === 'function') hideBossBar(scene);
  kainatiSetFlag(scene, 'kainatiDefeated', true);
  kainatiSetFlag(scene, 'kainatiCalmX', Math.round(boss.x));
  // Gros coup de grâce : ralenti, zoom, anneau ; la mousse le quitte en lueurs.
  const cy = boss.cfg.floorY - 110;
  juiceSlowMo(scene, { ms: 700, physics: 3, anims: 0.35 });
  juiceZoomPulse(scene, { zoom: 1.06, ms: 1000 });
  juiceShake(scene, 'heavy');
  juiceShockRing(scene, boss.x, cy, { size: 300, ms: 600, color: 0xbfe8a0 });
  spawnFx(scene, 'mossBreak', boss.x, cy, { w: 160, h: 180 });
  playSfx('boss_end', { boss: 'kainati' });
  for (let i = 0; i < 6; i++) {
    scene.time.delayedCall(200 + i * 180, () => {
      if (!st.disposed) spawnFx(scene, 'motes', boss.x + Phaser.Math.Between(-60, 60), cy + 40, { count: 4, spread: 30, color: [0x9bff5a, 0x3e7a2c, 0xbfe8a0] });
    });
  }
  // defeated_lucid (4 frames à 4 i/s) : il s'assoit, la brume quitte ses yeux.
  await kainatiDelay(scene, 1700);
  if (st.disposed) return;
  await kainatiPlay(scene, 'kainati_victoire');
  if (st.disposed) return;
  boss.makeCalm(boss.x);
  kainatiRevealPassage(scene, st, false);
  kainatiToast(scene, 'La route des hauteurs s\'est ouverte, à l\'est →', 3200);
}

ZONE_SCRIPTS.kainati_arene = {
  create(scene, levelData) {
    const data = levelData || scene.levelData || scene.__levelData || GRAND_ARBRE_ARENE_DATA;
    const cfg = {
      minX: 512, maxX: 1472, floorY: 448, ceilingY: 0, lockX: 600, calmX: 1300, spotInset: 105, recoil: 200, exitsAfterVictory: [],
      ...(data.kainatiArena || {}),
    };
    const cam = scene.cameras.main;
    const b = cam.getBounds();
    const st = {
      scene, cfg, fightActive: false, starting: false, disposed: false, won: false, downFired: false,
      passageRevealed: false, told: {}, camBounds: { x: b.x, y: b.y, width: b.width, height: b.height },
    };
    if (scene.__kainati) scene.__kainati.disposed = true;
    scene.__kainati = st;
    st.playerGuard = kainatiMakePlayerGuard(scene);

    st.boss = new KainatiBoss(scene, {
      minX: cfg.minX, maxX: cfg.maxX, floorY: cfg.floorY, ceilingY: cfg.ceilingY,
      spots: [cfg.minX + cfg.spotInset, cfg.maxX - cfg.spotInset], startSpot: 1, recoil: cfg.recoil,
    });
    scene.kainati = st.boss; // Player.pogoTargetHit + debug
    // PNJ « kainati » pour les étapes npcAnim/npcFace/npcMove de runCutscene.
    scene.npcs = scene.npcs || {};
    scene.npcs.kainati = st.boss.sprite;
    st.leftCurtain = kainatiMakeCurtain(scene, cfg.minX, cfg.floorY, cfg.ceilingY + 64);
    st.rightCurtain = kainatiMakeCurtain(scene, cfg.maxX, cfg.floorY, cfg.ceilingY + 64);
    kainatiSetCurtain(scene, st.leftCurtain, false, true);

    if (kainatiFlag(scene, 'kainatiDefeated', false)) {
      // Inerte, là où il a été épargné (ou calmX) ; passages ouverts.
      const x = Phaser.Math.Clamp(kainatiFlag(scene, 'kainatiCalmX', cfg.calmX) || cfg.calmX, cfg.minX + 110, cfg.maxX - 110);
      st.boss.makeCalm(x);
      st.boss.face(-1);
      kainatiRevealPassage(scene, st, true);
    }

    // Parler à Kainati apaisé (événement clavier : ne consomme pas le JustDown de Player).
    // Invite peinte (`ui_invite` + touche, StoryKit) comme celles des PNJ ; repli :
    // le Text d'avant. Toujours dans l'écran (règle commune de LevelKit).
    st.talkPrompt = typeof createStoryPromptLabel === 'function'
      ? createStoryPromptLabel(scene, { originY: 1 })
      : scene.add.text(0, 0, '', {
        fontFamily: 'sans-serif', fontSize: '13px', color: '#ffe9f5', backgroundColor: '#2a1f45', padding: { x: 6, y: 3 },
      }).setOrigin(0.5, 1).setDepth(1050);
    st.talkPrompt.setText('E : parler').setVisible(false);
    if (typeof keepWorldUiInView === 'function') keepWorldUiInView(st.talkPrompt, { prompt: true });
    st.onKeyE = () => {
      if (st.disposed || !st.boss.calm || !st.talkPrompt.visible || st.talking || kainatiFrozen(scene)) return;
      st.talking = true;
      st.talkPrompt.setVisible(false);
      st.boss.face(scene.player.x > st.boss.x ? 1 : -1);
      st.boss.setTalking(true);
      kainatiPlay(scene, 'kainati_calme').then(() => {
        st.talking = false;
        if (!st.disposed) st.boss.setTalking(false);
      });
    };
    scene.input.keyboard.on('keydown-E', st.onKeyE);
    // Dernier cœur : signal direct de Player.hitByEnemy (+ registre, au cas où).
    st.onDepleted = () => { if (!st.disposed && (st.fightActive || st.starting)) kainatiPlayerDown(scene, st); };
    st.onHearts = (parent, value) => { if (value <= 0) st.onDepleted(); };
    scene.events.on('player-depleted', st.onDepleted);
    scene.registry.events.on('changedata-hearts', st.onHearts);
    // Compétences de dégâts (ours…) : émises une fois par activation (LevelKit).
    st.onSkill = (ev) => {
      if (st.disposed || !st.fightActive || !ev || !ev.rect || ev.token === st.lastSkillToken) return;
      if (!Phaser.Geom.Intersects.RectangleToRectangle(ev.rect, st.boss.getHitRect())) return;
      st.lastSkillToken = ev.token;
      kainatiLandHit(scene, st, { kind: 'skill', skillId: ev.skillId, rect: ev.rect });
    };
    scene.events.on('player-skill', st.onSkill);
    st.onAttack = (ev) => kainatiOnAttack(scene, st, ev);
    scene.events.on('kainati-attack', st.onAttack);
    st.onStunned = () => {
      if (st.told.stun || !st.fightActive) return;
      st.told.stun = true;
      kainatiToast(scene, 'Kainati est sonné : fonce (Maj) et frappe, chaque coup compte double !', 2600);
    };
    scene.events.on('kainati-stunned', st.onStunned);
    st.onPhase2 = () => kainatiBubble(scene, 'xara', 'Il enrage ! Des pierres tombent de là-haut : bouge sur ta liane !', 3000);
    scene.events.on('kainati-phase2', st.onPhase2);
    scene.events.once('shutdown', () => {
      st.disposed = true;
      scene.events.off('player-depleted', st.onDepleted);
      scene.registry.events.off('changedata-hearts', st.onHearts);
      scene.events.off('player-skill', st.onSkill);
      scene.events.off('kainati-attack', st.onAttack);
      scene.events.off('kainati-stunned', st.onStunned);
      scene.events.off('kainati-phase2', st.onPhase2);
      scene.input.keyboard.off('keydown-E', st.onKeyE);
      if (typeof hideBossBar === 'function') hideBossBar(scene);
    });
  },

  update(scene, time, delta) {
    const st = scene.__kainati;
    if (!st || st.disposed || !scene.player || !scene.player.body) return;
    if (typeof currentLevelScene !== 'undefined' && scene !== currentLevelScene) return;
    kainatiSyncPlayerGuard(scene, st);
    if (kainatiFrozen(scene)) return;
    const p = scene.player;
    const dt = Math.min(delta, 50);
    const defeated = kainatiFlag(scene, 'kainatiDefeated', false);

    if (!defeated && !st.fightActive && !st.starting && !st.downFired && p.hearts > 0 && p.x > st.cfg.lockX && p.x < st.cfg.maxX) {
      const monkey = kainatiMonkeyState(scene, p);
      if (monkey === 'ready') kainatiStartFight(scene, st);
      else kainatiNeedMonkey(scene, st, monkey);
    }
    // Repartie vers le palier : Xara pourra le redire à la prochaine approche.
    if (st.toldMonkey && p.x < st.cfg.lockX - 150) st.toldMonkey = false;

    st.boss.update(dt, p);
    kainatiCheckPlayerHits(scene, st, time);
    if (st.fightActive && st.boss.defeated) kainatiVictory(scene, st);

    // Invite « E : parler » près de Kainati apaisé.
    const near = st.boss.calm && Math.abs(p.x - st.boss.x) < KAINATI_TALK_RANGE && Math.abs(p.y - st.boss.cfg.floorY) < 120;
    st.talkPrompt.setVisible(near && !st.talking);
    if (near) st.talkPrompt.setPosition(st.boss.x, st.boss.cfg.floorY - st.boss.h - 10);
  },
};
