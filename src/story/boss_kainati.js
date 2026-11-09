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
    { who: 'kainati', text: "Hors de mon arbre, créature d'en bas !" },
  ];
}
if (!DIALOGUES.kainati_victoire) {
  DIALOGUES.kainati_victoire = [
    { who: 'kainati', text: 'La brume se dissipe… Va. La route des hauteurs est à toi.' },
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
    ? 'Ici, il te faut le singe. Change de forme au feu, juste derrière.'
    : 'Sans le singe, ses coups vont balayer tout le sol. Le totem est en bas, dans les racines.';
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

// Bornes de la caméra déplacées EN DOUCEUR (retour joueurs 2026-11-08 : « on
// dirait que ça me téléporte ») : au début du combat, les bornes passaient
// d'un coup à l'arène (512..1472) alors qu'Agarica, au seuil (x 600), était au
// centre de l'écran -- la vue sautait de ~390 px et elle se retrouvait au bord
// gauche ; même saut en sens inverse à la victoire. Les bornes partent de ce
// que la caméra montre et rejoignent la cible en KAINATI_CAM_BOUNDS_MS.
const KAINATI_CAM_BOUNDS_MS = 700;

function kainatiCamBounds(scene, st, target, instant = false) {
  const cam = scene.cameras.main;
  if (st.camTween) { st.camTween.stop(); st.camTween = null; }
  if (instant) { cam.setBounds(target.x, target.y, target.width, target.height); return; }
  const cur = cam.getBounds();
  const view = { l: cam.scrollX, r: cam.scrollX + cam.width / cam.zoom };
  // Départ : des bornes qui ne contraignent pas la vue actuelle.
  const from = { l: Math.min(view.l, target.x), r: Math.max(view.r, target.x + target.width) };
  if (cur.x > from.l && cur.x <= view.l) from.l = cur.x;
  if (cur.right < from.r && cur.right >= view.r) from.r = cur.right;
  const o = { l: from.l, r: from.r };
  const apply = () => cam.setBounds(o.l, target.y, Math.max(cam.width, o.r - o.l), target.height);
  apply();
  st.camTween = scene.tweens.add({
    targets: o, l: target.x, r: target.x + target.width, duration: KAINATI_CAM_BOUNDS_MS, ease: 'Sine.easeInOut',
    onUpdate: apply,
    onComplete: () => { st.camTween = null; cam.setBounds(target.x, target.y, target.width, target.height); },
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

// --- Baies de soin (retour joueurs 2026-11-08 : « y a moyen de se soigner ou
// pas ? ») --------------------------------------------------------------------
// Blessée (au moins un cœur perdu), une baie de soin tombe de la canopée :
//  - au changement de phase (cri de rage) ;
//  - après une ouverture réussie : au moins KAINATI_BERRY_OPENING_HITS coups
//    placés pendant qu'il était sonné (pas plus d'une toutes les
//    KAINATI_BERRY_GAP_MS, KAINATI_BERRY_MAX par tentative, une seule au sol).
// Elle tombe du côté d'Agarica, loin de lui, et se ramasse en passant dessus :
// elle va dans le sac (consommable `baie_soin`) ; la première fois, LevelKit
// donne la touche pour la manger (« [I] : ton sac… », cf. bagHintSetup) et le
// sac s'ouvre sur la baie (InventoryScene) : I puis E.
const KAINATI_BERRY_MAX = 3;
const KAINATI_BERRY_GAP_MS = 20000;
const KAINATI_BERRY_OPENING_HITS = 2;
const KAINATI_BERRY_SAFE_DIST = 180;
const KAINATI_BERRY_PICK_R = 48;
const KAINATI_BERRY_SIZE = 34;
const KAINATI_BERRY_DEPTH = 958;

function kainatiBerryX(st, p) {
  const cfg = st.cfg;
  const bx = st.boss.x;
  const lo = cfg.minX + 70;
  const hi = cfg.maxX - 70;
  let side = p.x >= bx ? 1 : -1;
  let x = Math.abs(p.x - bx) < KAINATI_BERRY_SAFE_DIST ? bx + side * KAINATI_BERRY_SAFE_DIST : p.x;
  // Pas la place de son côté (coincée contre le rideau) : de l'autre côté de lui.
  if (x < lo || x > hi) {
    side = -side;
    x = bx + side * KAINATI_BERRY_SAFE_DIST;
  }
  return Phaser.Math.Clamp(x, lo, hi);
}

function kainatiDropBerry(scene, st, reason) {
  const p = scene.player;
  if (!p || !p.active || st.disposed || st.won || st.downFired || !st.boss) return false;
  if (p.hearts >= p.maxHearts || p.hearts <= 0) return false;
  if (st.berries.some((b) => !b.taken)) return false;
  if (st.berryCount >= KAINATI_BERRY_MAX) return false;
  const now = scene.time.now;
  if (reason === 'opening' && now - st.lastBerryAt < KAINATI_BERRY_GAP_MS) return false;
  if (typeof consumableAdd !== 'function') return false;
  st.berryCount += 1;
  st.lastBerryAt = now;
  const cfg = st.cfg;
  const x = kainatiBerryX(st, p);
  const restY = cfg.floorY - KAINATI_BERRY_SIZE / 2 - 2;
  const img = typeof addItemImage === 'function'
    ? addItemImage(scene, x, cfg.ceilingY + 90, 'baie_soin')
    : scene.add.circle(x, cfg.ceilingY + 90, KAINATI_BERRY_SIZE / 2, 0xd8345f);
  if (img.type === 'Image') img.setScale(KAINATI_BERRY_SIZE / Math.max(img.width, img.height, 1));
  img.setDepth(KAINATI_BERRY_DEPTH);
  img.lookRole = 'ui';
  if (typeof juiceEnsureTextures === 'function') juiceEnsureTextures(scene);
  const glow = scene.textures.exists('juice-glow')
    ? scene.add.image(x, img.y, 'juice-glow').setDisplaySize(90, 90).setTint(0xff7fb0)
    : scene.add.circle(x, img.y, 30, 0xff7fb0, 0.3);
  glow.setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.75).setDepth(KAINATI_BERRY_DEPTH - 0.01);
  glow.lookRole = 'ui';
  const berry = { img, glow, x, landed: false, taken: false, t: 0 };
  st.berries.push(berry);
  spawnFx(scene, 'chip', x, cfg.ceilingY + 70, { count: 3, angle: [80, 100], speed: [60, 140] });
  scene.tweens.add({
    targets: img, y: restY, duration: 750, ease: 'Bounce.Out',
    onComplete: () => {
      berry.landed = true;
      if (!berry.taken) spawnFx(scene, 'motes', x, restY, { count: 6, spread: 16, color: [0xff9fc9, 0xffe9f5] });
    },
  });
  if (typeof playSfx === 'function') playSfx('pickup_drop', { key: 'baie' });
  return true;
}

function kainatiUpdateBerries(scene, st, dt) {
  const p = scene.player;
  if (!st.berries.length || !p || !p.body) return;
  for (const b of st.berries) {
    if (b.taken || !b.img.active) continue;
    b.t += dt;
    // Lueur qui respire, légère flottaison une fois posée : on la voit de loin.
    b.glow.setPosition(b.img.x, b.img.y).setAlpha(0.55 + 0.25 * Math.sin(b.t / 150));
    const dx = p.body.center.x - b.img.x;
    const dy = p.body.center.y - b.img.y;
    if (dx * dx + dy * dy > KAINATI_BERRY_PICK_R * KAINATI_BERRY_PICK_R && !(Math.abs(dx) < KAINATI_BERRY_PICK_R && p.body.bottom >= b.img.y - 10 && p.body.top <= b.img.y + 10)) continue;
    b.taken = true;
    consumableAdd(scene, 'baie_soin', 1, { silent: true });
    spawnFx(scene, 'motes', b.img.x, b.img.y, { count: 10, spread: 22, color: [0xff9fc9, 0xffe9f5, 0xd8345f] });
    if (typeof juiceBurstImage === 'function') juiceBurstImage(scene, 'glow', b.img.x, b.img.y, { size: 110, from: 0.4, to: 1.2, ms: 380, color: 0xff9fc9, alpha: 0.7 });
    if (typeof playSfx === 'function') playSfx('pickup', { key: 'baie' });
    // Déjà vu l'astuce du sac : rappel court sous forme de texte flottant.
    if (typeof storyGet !== 'function' || storyGet('astuceSacVue')) {
      const t = scene.add.text(b.img.x, b.img.y - 30, '+1 baie  (I)', {
        fontFamily: 'sans-serif', fontSize: '15px', fontStyle: 'bold', color: '#ffd1e3', stroke: '#2a1f45', strokeThickness: 4,
      }).setOrigin(0.5).setDepth(KAINATI_BERRY_DEPTH + 1);
      t.lookRole = 'ui';
      scene.tweens.add({ targets: t, y: t.y - 36, alpha: 0, duration: 1100, ease: 'Sine.easeOut', onComplete: () => t.destroy() });
    }
    for (const o of [b.img, b.glow]) {
      scene.tweens.killTweensOf(o);
      scene.tweens.add({ targets: o, alpha: 0, scale: o.scale * 1.4, duration: 220, onComplete: () => o.destroy() });
    }
  }
  st.berries = st.berries.filter((b) => !b.taken);
}

// Ouverture réussie : fin d'un étourdissement où elle a placé assez de coups.
function kainatiWatchOpening(scene, st) {
  const boss = st.boss;
  if (boss.state === 'stunned' && st.prevBossState !== 'stunned') st.stunHits0 = boss.hitsTaken;
  if (st.prevBossState === 'stunned' && boss.state !== 'stunned' && st.fightActive) {
    if (boss.hitsTaken - (st.stunHits0 || 0) >= KAINATI_BERRY_OPENING_HITS) kainatiDropBerry(scene, st, 'opening');
  }
  st.prevBossState = boss.state;
}

// --- Indices (une fois chacun par combat) ---
function kainatiOnAttack(scene, st, ev) {
  if (!st.fightActive || st.disposed) return;
  const told = st.told;
  if (['slam', 'roar', 'sweep'].includes(ev.kind) && !told.full) {
    told.full = true;
    kainatiBubble(scene, 'xara', 'Tout le sol va y passer ! Une liane, vite : [↑] !', 2600);
  } else if (ev.kind === 'charge' && !told.charge) {
    told.charge = true;
    kainatiBubble(scene, 'xara', 'Il charge ! [↑] sur une liane !', 2400);
  }
}

// --- Déroulé ---
async function kainatiStartFight(scene, st) {
  st.starting = true;
  st.told = {};
  kainatiSetCurtain(scene, st.leftCurtain, true);
  kainatiSetCurtain(scene, st.rightCurtain, true, true);
  kainatiCamBounds(scene, st, { x: st.cfg.minX, y: 0, width: st.cfg.maxX - st.cfg.minX, height: scene.scale.height });
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
    // Règle des lianes (Player.js, 2026-11-09) : singe (double saut), puis
    // Z/↑ pour s'accrocher ; sans ↑, on passe au travers.
    kainatiToast(scene, "Ses grosses attaques balaient le sol : [Espace] deux fois sous une liane, puis [↑]", 5200);
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
  kainatiCamBounds(scene, st, st.camBounds, instant);
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
  kainatiToast(scene, 'La route des hauteurs est ouverte →', 3200);
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
      berries: [], berryCount: 0, lastBerryAt: -Infinity, prevBossState: null, stunHits0: 0,
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
    // Son anim et son sens sont pilotés par le combat : pas de mise au repos
    // automatique pendant les dialogues (cf. storyStageDialogueLine, StoryKit).
    st.boss.sprite.noDialogueStage = true;
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
      kainatiToast(scene, 'Kainati est sonné : fonce [Maj] et frappe [K], coups doublés !', 2600);
    };
    scene.events.on('kainati-stunned', st.onStunned);
    st.onPhase2 = () => {
      kainatiBubble(scene, 'xara', 'Il enrage ! Des pierres tombent : bouge sur ta liane !', 3000);
      // Changement de phase : une baie si elle est blessée (cf. kainatiDropBerry).
      scene.time.delayedCall(900, () => kainatiDropBerry(scene, st, 'phase'));
    };
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
    kainatiWatchOpening(scene, st);
    kainatiUpdateBerries(scene, st, dt);
    if (st.fightActive && st.boss.defeated) kainatiVictory(scene, st);

    // Invite « E : parler » près de Kainati apaisé.
    const near = st.boss.calm && Math.abs(p.x - st.boss.x) < KAINATI_TALK_RANGE && Math.abs(p.y - st.boss.cfg.floorY) < 120;
    st.talkPrompt.setVisible(near && !st.talking);
    if (near) st.talkPrompt.setPosition(st.boss.x, st.boss.cfg.floorY - st.boss.h - 10);
  },
};
