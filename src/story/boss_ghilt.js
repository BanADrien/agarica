// ZONE_SCRIPTS.ghilt_arene + ZONE_SCRIPTS.trou_sombre — agent Ghil't.
// Déroulé (cf. PLAN_DEV.md étapes 13-15, ZONES_ET_PROGRESSION.md §9) :
//   arène phase 1 (ghiltPhase absent/1) : intro → combat → sous 60 % PV,
//     attaque imparable → ghiltPhase=2, ghiltHpPhase2=PV → TrouSombreScene ;
//   trou sombre : réveil, papillons, bocal d'antidote versé dans le totem de
//     poche → totem_poche_actif + compétence papillon → trouSombreFait → arène ;
//   arène phase 2 : combat (PV restants) → Ghil't affaibli (25 %) → compétence
//     papillon → heal() → purification (ghiltHealed) → Amanite l'achève
//     (amaniteKilledGhilt) → Geralt → BosquetRetourScene.
// Tous les textes sont dans DIALOGUES (ids ghilt_* / trou_*) : l'agent Acte 2
// peut les réécrire dans src/story/acte2.js (chargé après ce fichier).

// ---------------------------------------------------------------------------
// Dialogues
// ---------------------------------------------------------------------------
Object.assign(DIALOGUES, {
  ghilt_intro: [
    { who: 'xara', text: "Agarica… le sol vibre. Quelque chose d'énorme respire sous la mousse." },
    { who: 'ghilt', text: 'GRRRROOOOAAAAH !' },
    { who: 'agarica', text: "C'est… un tapir ? Il est gigantesque… et il dégouline de mousse." },
    { who: 'xara', text: "C'est Ghil't, le Fléau de la Forêt. Méfie-toi de ses charges, de son souffle… et ne marche pas dans ce qu'il crache !" },
    { who: 'agarica', text: 'Je ne fuirai pas. Pas cette fois.' },
  ],
  ghilt_chute: [
    { who: 'xara', text: "Il aspire toute la mousse de l'arène… Agarica, recule !" },
    { who: 'agarica', text: "Le sol… il tremble, je n'arrive plus à —" },
    { who: 'ghilt', text: 'HHHHHHHHHH…' },
  ],
  ghilt_retour: [
    { who: 'agarica', text: "Ghil't ! Je suis revenue." },
    { who: 'xara', text: "Affaiblis-le, mais ne l'achève pas. Quand il vacillera, laisse les papillons faire le reste." },
    { who: 'agarica', text: 'Cette fois, je ne viens pas pour te détruire. Je viens te soigner.' },
  ],
  trou_reveil: [
    { who: 'agarica', text: '… Où… où suis-je ? Il fait si noir…' },
    { who: 'xara', text: "Agarica ! Tu m'entends ? Ne bouge pas trop vite… tu as fait une sacrée chute." },
    { who: 'agarica', text: "Ghil't… il était trop fort. Je n'ai rien pu faire." },
    { who: 'xara', text: 'Chut. Regarde, là-haut… Tu vois ces petites lumières ?' },
  ],
  trou_papillons: [
    { who: 'agarica', text: 'Des papillons… ce sont ceux de Morgat !' },
    { who: 'xara', text: 'Ils t\'ont suivie depuis la hutte. Et ils portent quelque chose… tout doucement.' },
    { who: 'agarica', text: "Un bocal… l'antidote ! Morgat a réussi à le terminer." },
  ],
  trou_totem: [
    { who: 'agarica', text: "Il y en a si peu… Je devrais le boire ? Ou le lancer sur Ghil't ?" },
    { who: 'xara', text: 'Surtout pas. Bu, il ne soignera que toi. Lancé, il se perdra dans la mousse.' },
    { who: 'xara', text: 'Ton totem de poche, celui qui était cassé… il brille depuis que les papillons sont là. Verse l\'antidote dedans.' },
    { who: 'agarica', text: "D'accord… goutte à goutte." },
  ],
  trou_sortie: [
    { who: 'agarica', text: 'Le totem est tout chaud… Je sens les papillons, comme s\'ils faisaient partie de moi.' },
    { who: 'xara', text: "Alors ils te prêtent leur force : soigner au lieu de détruire. Affaiblis Ghil't, puis laisse-les faire." },
    { who: 'agarica', text: 'Ils montent vers la lumière… ils nous montrent le chemin.' },
  ],
  ghilt_soin: [
    { who: 'agarica', text: 'Regarde, Xara… la mousse se retire !' },
    { who: 'xara', text: "Il respire… doucement. Il n'a plus rien d'un fléau." },
    { who: 'ghilt', text: '… Mmmh…' },
    { who: 'agarica', text: "Tu n'étais pas un monstre. Tu étais malade, comme la forêt." },
  ],
  ghilt_amanite: [
    { who: 'agarica', text: 'Amanite ?! NON !' },
    { who: 'amanite', text: 'Recule, Agarica. C\'est fini. Le Fléau ne fera plus de mal à personne.' },
    { who: 'agarica', text: "Il était guéri ! Tu ne l'as pas vu ? La mousse était partie, il respirait !" },
    { who: 'amanite', text: "Une bête pareille ne guérit pas. Elle attend. Et la forêt n'a plus le temps d'attendre." },
    { who: 'agarica', text: 'Tu viens de détruire la seule preuve qu\'on pouvait les sauver…' },
    { who: 'amanite', text: "J'ai sauvé le bosquet. Toi, tu jouais avec des papillons. Je rentre leur annoncer la nouvelle." },
  ],
  ghilt_geralt: [
    { who: 'geralt', text: "Par toutes les racines… j'arrive trop tard, hein ?" },
    { who: 'agarica', text: "Geralt… je l'avais soigné. Amanite l'a achevé sous mes yeux." },
    { who: 'geralt', text: "J'ai vu les papillons de loin. Et j'ai vu la mousse reculer. Ça, petite, personne ne l'avait jamais fait." },
    { who: 'geralt', text: 'Viens. On rentre au bosquet. Ton père doit entendre la vérité… de ma bouche, s\'il le faut.' },
  ],
});

// ---------------------------------------------------------------------------
// Compat : API Fondation (StoryKit) avec repli local tant qu'elle manque.
// Les replis gardent la séquence jouable/testable, sans prétendre au rendu final.
// ---------------------------------------------------------------------------
function ghGet(scene, key, def) {
  if (typeof storyGet === 'function') return storyGet(key, def);
  const v = scene.registry.get(key);
  return v === undefined || v === null ? def : v;
}

function ghSet(scene, key, value) {
  if (typeof storySet === 'function') storySet(key, value);
  else scene.registry.set(key, value);
}

function ghWait(scene, ms) {
  return new Promise((resolve) => scene.time.delayedCall(ms, resolve));
}

function ghTween(scene, cfg) {
  return new Promise((resolve) => {
    const done = cfg.onComplete;
    scene.tweens.add({ ...cfg, onComplete: (...a) => { if (done) done(...a); resolve(); } });
  });
}

function ghSay(scene, id) {
  if (typeof showDialogue === 'function') return Promise.resolve(showDialogue(scene, id));
  return ghFallbackDialogue(scene, DIALOGUES[id] || []);
}

// Repli sans DialogueScene : boîte en bas, lignes qui défilent toutes seules.
async function ghFallbackDialogue(scene, lines) {
  const cam = scene.cameras.main;
  const box = scene.add.text(cam.width / 2, cam.height - 70, '', {
    fontFamily: 'sans-serif', fontSize: '17px', color: '#ffe9f5', backgroundColor: '#2a1f45',
    padding: { x: 14, y: 10 }, wordWrap: { width: cam.width - 140 }, align: 'left',
  }).setOrigin(0.5).setScrollFactor(0).setDepth(3000);
  for (const line of lines) {
    const sp = (typeof SPEAKERS !== 'undefined' && SPEAKERS[line.who]) || { name: line.who };
    box.setText(`${sp.name} : ${line.text}`);
    await ghWait(scene, 1200 + line.text.length * 25);
  }
  box.destroy();
}

function ghToast(scene, text, ms = 2600) {
  if (typeof showToast === 'function') return showToast(scene, text, ms);
  const cam = scene.cameras.main;
  const t = scene.add.text(cam.width / 2, 92, text, {
    fontFamily: 'sans-serif', fontSize: '16px', color: '#ffe9f5', backgroundColor: '#2a1f45', padding: { x: 10, y: 6 },
  }).setOrigin(0.5).setScrollFactor(0).setDepth(2900);
  scene.tweens.add({ targets: t, alpha: 0, delay: ms, duration: 400, onComplete: () => t.destroy() });
  return t;
}

// Verrou de cinématique : `__cutsceneLock` est lu par isWorldFrozen (Fondation).
// Sans elle, on coupe au moins le clavier pour que le joueur reste immobile.
// C'est un compteur (runCutscene peut aussi le tenir) : on n'y ajoute
// qu'UNE unité à nous, mémorisée par visite (instance de joueur).
function ghLock(scene, on) {
  const p = scene.player;
  const mine = scene.__ghLockOwner === p;
  if (on && !mine) {
    scene.__cutsceneLock = (Number(scene.__cutsceneLock) || 0) + 1;
    scene.__ghLockOwner = p;
  } else if (!on && mine) {
    scene.__cutsceneLock = Math.max(0, (Number(scene.__cutsceneLock) || 0) - 1);
    scene.__ghLockOwner = null;
  }
  if (on && p && p.body) {
    p.setAccelerationX(0);
    p.setVelocityX(0);
  }
  if (typeof isWorldFrozen !== 'function' && scene.input && scene.input.keyboard) {
    scene.input.keyboard.enabled = !on;
    if (on) scene.input.keyboard.resetKeys();
  }
}

function ghInvHas(scene, id) {
  if (typeof inventoryHas === 'function') return inventoryHas(id);
  return (scene.registry.get('inventory') || []).includes(id);
}

function ghInvAdd(scene, id, opts = {}) {
  if (typeof inventoryAdd === 'function') return inventoryAdd(scene, id, opts);
  const inv = scene.registry.get('inventory') || [];
  if (!inv.includes(id)) scene.registry.set('inventory', [...inv, id]);
  if (!opts.silent) ghToast(scene, 'Objet obtenu : ' + id);
  return null;
}

function ghInvRemove(scene, id) {
  if (typeof inventoryRemove === 'function') return inventoryRemove(id);
  scene.registry.set('inventory', (scene.registry.get('inventory') || []).filter((x) => x !== id));
  return null;
}

function ghHasSkill(scene, id) {
  const reg = scene.registry.get('unlockedSkills');
  if (reg && (reg.has ? reg.has(id) : (reg.includes && reg.includes(id)))) return true;
  const own = scene.player && scene.player.unlockedSkills;
  return !!(own && (own.has ? own.has(id) : (own.includes && own.includes(id))));
}

function ghUnlockSkill(scene, id) {
  if (typeof unlockSkillFromStory === 'function') return unlockSkillFromStory(scene, id);
  console.warn(`boss_ghilt: unlockSkillFromStory absente, compétence "${id}" non débloquée`);
  return null;
}

// Barre de boss : API Fondation, sinon petite barre locale.
function ghBossBar(scene, name, getRatio) {
  if (typeof showBossBar === 'function') { showBossBar(scene, name, getRatio); return; }
  ghHideBossBar(scene);
  const cam = scene.cameras.main;
  const g = scene.add.graphics().setScrollFactor(0).setDepth(1500);
  const label = scene.add.text(cam.width / 2, 22, name, {
    fontFamily: 'sans-serif', fontSize: '15px', color: '#ffe9f5', fontStyle: 'bold',
  }).setOrigin(0.5).setScrollFactor(0).setDepth(1501);
  const draw = () => {
    if (!g.active) return;
    const w = 420;
    const x = (cam.width - w) / 2;
    g.clear();
    g.fillStyle(0x2a1f45, 0.9).fillRoundedRect(x - 3, 36, w + 6, 16, 5);
    g.fillStyle(0x7fcf4a, 1).fillRoundedRect(x, 39, w * Phaser.Math.Clamp(getRatio(), 0, 1), 10, 4);
  };
  scene.events.on('update', draw);
  scene.events.once('shutdown', () => ghHideBossBar(scene));
  scene.__ghBossBar = { g, label, draw };
}

function ghHideBossBar(scene) {
  if (typeof hideBossBar === 'function') { hideBossBar(scene); return; }
  const b = scene.__ghBossBar;
  if (!b) return;
  scene.events.off('update', b.draw);
  b.g.destroy();
  b.label.destroy();
  scene.__ghBossBar = null;
}

// Listeners de scène : l'instance de scène est réutilisée d'une visite à
// l'autre, donc tout `on` doit être retiré au shutdown (sinon doublons).
function ghOn(scene, event, fn) {
  scene.events.on(event, fn);
  scene.events.once('shutdown', () => scene.events.off(event, fn));
}

// Rideau noir indépendant de la caméra (le fondu de goToScene passe dessous).
function ghBlackout(scene, ms, from = 0, to = 1) {
  const cam = scene.cameras.main;
  const r = scene.add.rectangle(0, 0, cam.width, cam.height, 0x000000).setOrigin(0)
    .setScrollFactor(0).setDepth(2500).setAlpha(from);
  return ghTween(scene, { targets: r, alpha: to, duration: ms }).then(() => r);
}

// Placeholders lisibles (taille ≈ finale) pour les PNJ/décors sans entrée de manifest.
const GH_PLACEHOLDERS = {
  amanite: { w: 52, h: 96, color: 0xb3263a, label: 'Amanite' },
  geralt: { w: 44, h: 66, color: 0x5b7a3a, label: 'Geralt' },
  papillon: { w: 18, h: 14, color: 0xffe680, label: '' },
  vfx_purification: { w: 160, h: 160, color: 0xe8ffd8, label: '' },
};

function ghSprite(scene, x, y, id, anim = 'idle', opts) {
  if (id === 'ghilt' || id === 'ghilt_gueri') ensureGhiltPlaceholder(scene, id);
  else if (!getAssetManifest()[id] && GH_PLACEHOLDERS[id]) ensurePlaceholderTexture(scene, `ph-${id}`, GH_PLACEHOLDERS[id], 1);
  return addManifestSprite(scene, x, y, id, anim, opts);
}

function ghAnim(sprite, anim) {
  if (sprite && sprite.playManifest) sprite.playManifest(anim);
}

// Halo doux (dégradé radial) en mode ADD : éclaire par-dessus le voile
// `ambient` de la Fondation sans avoir besoin de masque.
const GH_GLOW_DEPTH = 950;
function ghGlowTexture(scene) {
  const key = 'gh-glow';
  if (scene.textures.exists(key)) return key;
  const tex = scene.textures.createCanvas(key, 128, 128);
  const ctx = tex.getContext();
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.45)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  tex.refresh();
  return key;
}

function ghGlow(scene, x, y, size, color, alpha) {
  return scene.add.image(x, y, ghGlowTexture(scene)).setDisplaySize(size, size).setTint(color)
    .setAlpha(alpha).setBlendMode(Phaser.BlendModes.ADD).setDepth(GH_GLOW_DEPTH);
}

// ---------------------------------------------------------------------------
// Papillons lumineux (décor). Délègue à l'API d'Animaux.js (agent Ennemis :
// spawnButterflies / butterfliesFlyTo / butterfliesDisperse) quand elle
// existe ; sinon repli local : base (x, y) déplacée par tweens, flottement +
// battement d'ailes ajoutés chaque frame par ghTick.
// ---------------------------------------------------------------------------
function ghPapillon(scene, x, y) {
  if (typeof spawnButterflies === 'function') {
    const c = spawnButterflies(scene, x, y, 1, { radius: 14 })[0];
    if (c) return c;
  }
  const sprite = ghSprite(scene, x, y, 'papillon', 'idle', { origin: [0.5, 0.5] }).setDepth(GH_GLOW_DEPTH + 2);
  const p = {
    x, y, sprite, glow: ghGlow(scene, x, y, 90, 0xffe9a0, 0.55), phase: Math.random() * Math.PI * 2, lastX: x,
    baseScale: sprite.scaleX, mine: true,
  };
  (scene.__ghPapillons = scene.__ghPapillons || []).push(p);
  return p;
}

function ghPapillonMove(scene, p, x, y, ms, delay = 0) {
  if (!p.mine && typeof butterfliesFlyTo === 'function') {
    return ghWait(scene, delay).then(() => butterfliesFlyTo([p], x, y, ms));
  }
  return ghTween(scene, { targets: p, x, y, duration: ms, delay, ease: 'Sine.easeInOut' });
}

function ghPapillonRemove(scene, p, ms = 600) {
  if (!p.mine) {
    if (typeof butterfliesDisperse === 'function') butterfliesDisperse([p], ms);
    else if (p.active) p.destroy();
    return;
  }
  scene.tweens.add({
    targets: [p.sprite, p.glow], alpha: 0, duration: ms,
    onComplete: () => { p.sprite.destroy(); p.glow.destroy(); p.dead = true; },
  });
}

function ghTick(scene, time) {
  if (typeof currentLevelScene !== 'undefined' && scene !== currentLevelScene) return;
  for (const p of scene.__ghPapillons || []) {
    if (p.dead || !p.sprite.active) continue;
    const bob = Math.sin(time / 260 + p.phase) * 6;
    p.sprite.setPosition(p.x + Math.cos(time / 410 + p.phase) * 4, p.y + bob);
    p.glow.setPosition(p.sprite.x, p.sprite.y);
    p.glow.setAlpha(0.45 + Math.sin(time / 300 + p.phase) * 0.12);
    if (Math.abs(p.x - p.lastX) > 0.5) p.sprite.setFlipX(p.x < p.lastX);
    p.lastX = p.x;
    // Battement d'ailes lisible même en placeholder.
    p.sprite.scaleX = p.baseScale * (0.55 + Math.abs(Math.sin(time / 90 + p.phase)) * 0.45);
  }
  if (scene.__ghPapillons) scene.__ghPapillons = scene.__ghPapillons.filter((p) => !p.dead);
  const pg = scene.__ghPlayerGlow;
  if (pg && scene.player && scene.player.active) pg.setPosition(scene.player.x, scene.player.y - 45);
}

// Installé une fois par visite. Volontairement sur l'événement 'update' de la
// scène (et pas ZONE_SCRIPTS.update, coupé quand le monde est gelé) : les
// papillons et halos doivent continuer de vivre pendant les cinématiques.
function ghInstallTick(scene) {
  scene.__ghPapillons = [];
  scene.__ghPlayerGlow = null;
  ghOn(scene, 'update', (time) => ghTick(scene, time));
}

// ---------------------------------------------------------------------------
// Arène de Ghil't
// ---------------------------------------------------------------------------
const GHILT_ARENA = { minX: 300, maxX: 1050, bossX: 960, wallLeft: 30, wallRight: 1314 };

function ghArenaGroundY(scene, x) {
  // Surface physique = sommet visuel de la tuile + GROUND_STAND_SINK (cf.
  // LevelKit : 16 px d'herbe sans hitbox avec 'floor', 0 avec 'tuiles').
  return (groundSurfaceYAt(scene, x, 448) ?? 448) + GROUND_STAND_SINK;
}

// Deux murs de mousse ferment l'arène tant que Ghil't n'est pas guéri.
function ghiltArenaWalls(scene) {
  const walls = scene.physics.add.staticGroup();
  const gy = ghArenaGroundY(scene, 300);
  for (const x of [GHILT_ARENA.wallLeft, GHILT_ARENA.wallRight]) {
    const g = scene.add.graphics();
    g.fillStyle(0x2f5d1f, 1);
    g.fillRoundedRect(x - 26, gy - 300, 52, 300, 18);
    g.fillStyle(0x6fae3a, 1);
    for (let i = 0; i < 6; i++) g.fillCircle(x + ((i % 2) ? 10 : -10), gy - 30 - i * 48, 16);
    const z = scene.add.zone(x, gy - 300, 40, 600);
    scene.physics.add.existing(z, true);
    walls.add(z);
  }
  scene.physics.add.collider(scene.player, walls);
  return walls;
}

ZONE_SCRIPTS.ghilt_arene = {
  create(scene) {
    // Idempotent : la Fondation l'appelle depuis buildLevelFromData, et les
    // tests peuvent l'appeler à la main (--js) sur la même visite.
    if (!scene.player || scene.__ghiltScriptFor === scene.player) return;
    scene.__ghiltScriptFor = scene.player;
    ghInstallTick(scene);
    const st = { boss: null, busy: false, toastAt: 0 };
    scene.__ghilt = st;

    if (ghGet(scene, 'ghiltHealed', false)) {
      ghiltArenaCalm(scene);
      return;
    }

    scene.__exits = []; // arène fermée pendant le combat
    ghiltArenaWalls(scene);
    const phase = ghGet(scene, 'ghiltPhase', 1) >= 2 ? 2 : 1;
    st.phase = phase;
    const hp = phase === 2
      ? ghGet(scene, 'ghiltHpPhase2', Math.floor(GHILT_HP_MAX * GHILT_PHASE1_THRESHOLD))
      : GHILT_HP_MAX;
    const boss = new Ghilt(scene, GHILT_ARENA.bossX, ghArenaGroundY(scene, GHILT_ARENA.bossX), {
      phase, hp, minX: GHILT_ARENA.minX, maxX: GHILT_ARENA.maxX,
      chargeMinX: GHILT_ARENA.wallLeft + 150, chargeMaxX: GHILT_ARENA.wallRight - 150,
    });
    st.boss = boss;
    scene.enemies.add(boss);
    boss.setCollideWorldBounds(true); // group.add() remet les réglages par défaut du groupe
    // Juste derrière Agarica (devant le sol) : elle reste lisible quand elle saute par-dessus.
    scene.children.moveBelow(boss, scene.player);

    ghOn(scene, 'ghilt-threshold', () => ghiltChute(scene, st));
    ghOn(scene, 'ghilt-weakened', () => ghiltWeakenedHint(scene, st));
    ghOn(scene, 'ghilt-heal-refused', () => {
      const now = scene.time.now;
      if (now < st.toastAt) return;
      st.toastAt = now + 3000;
      ghToast(scene, 'La mousse résiste… Affaiblis-le d\'abord !');
    });
    ghOn(scene, 'ghilt-healed', () => ghiltSoin(scene, st));
    ghOn(scene, 'ghilt-player-down', () => ghiltPlayerDown(scene, st));
    // Le dernier cœur perdu gèle le monde le temps de la pose `death`
    // (Player.hitByEnemy, ~1,1 s) puis remet les cœurs au maximum : Ghilt.update
    // (coupé pendant le gel) ne voyait donc jamais `hearts <= 0`, et la phase
    // n'était plus relancée. On écoute directement le registre.
    const onHearts = (parent, value) => {
      const b = st.boss;
      if (value > 0 || !b || !b.active || b.playerDownFired) return;
      b.playerDownFired = true;
      scene.events.emit('ghilt-player-down', b);
    };
    scene.registry.events.on('changedata-hearts', onHearts);
    scene.events.once('shutdown', () => scene.registry.events.off('changedata-hearts', onHearts));

    const run = phase === 1 ? ghiltIntroPhase1 : ghiltIntroPhase2;
    run(scene, st).catch((e) => console.error('ghilt intro', e));
  },
  // Tout est piloté par Ghilt.update (appelé par LevelKit via scene.enemies)
  // et par ghTick : rien à faire ici.
  update() {},
};

function ghiltStartFight(scene, st) {
  const boss = st.boss;
  if (!boss || !boss.active) return;
  ghBossBar(scene, "Ghil't, le Fléau de la Forêt", () => (boss.active ? boss.hp / boss.hpMax : 0));
  boss.state = 'idle';
  boss.setCinematic(false);
  boss.nextAttackAt = scene.time.now + 1200;
  ghLock(scene, false);
}

async function ghiltIntroPhase1(scene, st) {
  const boss = st.boss;
  const cam = scene.cameras.main;
  ghLock(scene, true);
  boss.setCinematic(true);
  if (ghGet(scene, 'ghiltIntroVu', false)) {
    // Nouvelle tentative après une mort : rugissement et c'est reparti.
    await ghWait(scene, 500);
    ghAnim(boss, 'roar');
    cam.shake(500, 0.01);
    await ghWait(scene, 700);
    ghiltStartFight(scene, st);
    return;
  }
  // Ghil't émerge d'un amas de mousse : écrasé + transparent → pleine taille.
  const baseScaleY = boss.scaleY;
  boss.setAlpha(0).setScale(boss.scaleX, baseScaleY * 0.15);
  cam.stopFollow();
  cam.pan(boss.x - 120, cam.midPoint.y, 900, 'Sine.easeInOut');
  await ghWait(scene, 1000);
  cam.shake(900, 0.006);
  boss.spawnDust(boss.x, boss.groundY, 10);
  await ghWait(scene, 500);
  await ghTween(scene, { targets: boss, alpha: 1, scaleY: baseScaleY, duration: 900, ease: 'Back.easeOut' });
  ghAnim(boss, 'roar');
  cam.shake(700, 0.015);
  await ghWait(scene, 500);
  await ghSay(scene, 'ghilt_intro');
  cam.pan(scene.player.x, cam.midPoint.y, 600, 'Sine.easeInOut');
  await ghWait(scene, 650);
  cam.startFollow(scene.player, true, 1, 1);
  ghSet(scene, 'ghiltIntroVu', true);
  ghAnim(boss, 'idle');
  ghiltStartFight(scene, st);
}

async function ghiltIntroPhase2(scene, st) {
  const boss = st.boss;
  ghLock(scene, true);
  boss.setCinematic(true);
  // Test direct de la phase 2 : on donne la compétence pour pouvoir conclure.
  if (!ghHasSkill(scene, 'papillon') && typeof SKILL_DEFS !== 'undefined' && SKILL_DEFS.papillon) {
    ghUnlockSkill(scene, 'papillon');
  }
  await ghWait(scene, 600);
  ghAnim(boss, 'roar');
  scene.cameras.main.shake(500, 0.012);
  await ghWait(scene, 600);
  if (!ghGet(scene, 'ghiltRetourVu', false)) {
    await ghSay(scene, 'ghilt_retour');
    ghSet(scene, 'ghiltRetourVu', true);
  }
  ghAnim(boss, 'idle');
  ghiltStartFight(scene, st);
}

// Mort d'Agarica pendant le combat : on relance proprement la phase en cours
// (PV de Ghil't remis à leur valeur de début de phase, cœurs pleins).
async function ghiltPlayerDown(scene, st) {
  if (st.busy) return;
  st.busy = true;
  ghLock(scene, true);
  if (st.boss && st.boss.active) {
    st.boss.setCinematic(true);
    st.boss.clearHazards();
    st.boss.killMinions();
  }
  ghToast(scene, "Agarica s'effondre…", 1200);
  await ghWait(scene, 700);
  const p = scene.player;
  scene.registry.set('hearts', p && p.maxHearts ? p.maxHearts : 3);
  await ghBlackout(scene, 500);
  ghHideBossBar(scene);
  ghLock(scene, false);
  // Même instance de scène : entre restart et la fin de resolveZoneData,
  // updateLevelFromData tournerait sur l'ancien joueur détruit (il sort si
  // scene.player est vide).
  scene.scene.restart({ enterId: st.phase === 2 ? 'from_trou' : 'from_foret_corrompue' });
  scene.player = null;
}

// Phase 1 : sous 60 % PV, attaque imparable (défaite imposée) → trou sombre.
async function ghiltChute(scene, st) {
  if (st.busy) return;
  st.busy = true;
  const boss = st.boss;
  const cam = scene.cameras.main;
  const player = scene.player;
  ghLock(scene, true);
  boss.killMinions();
  boss.clearTint();
  ghHideBossBar(scene);
  // Recule au centre de l'arène, face à Agarica.
  const centerX = Phaser.Math.Clamp(player.x + (player.x < 672 ? 380 : -380), GHILT_ARENA.minX, GHILT_ARENA.maxX);
  boss.facePlayer(player);
  ghAnim(boss, 'walk');
  cam.stopFollow();
  cam.pan((player.x + centerX) / 2, cam.midPoint.y, 700, 'Sine.easeInOut');
  await ghTween(scene, { targets: boss, x: centerX, duration: 700, ease: 'Sine.easeInOut' });
  boss.facePlayer(player);
  // Il aspire : toute la mousse de l'arène converge vers le museau.
  ghAnim(boss, 'toxic_breath');
  boss.setTint(0x9cff6b);
  cam.shake(2200, 0.005);
  for (let k = 0; k < 4; k++) scene.time.delayedCall(k * 450, () => boss.active && boss.spawnInhale(900));
  await ghSay(scene, 'ghilt_chute');
  // Explosion de mousse : flash vert, onde, le sol cède sous Agarica.
  const s = boss.snout();
  cam.flash(450, 140, 255, 120);
  cam.shake(800, 0.025);
  const wave = scene.add.circle(s.x, s.y, 30, 0x7fdc5a, 0.75).setDepth(boss.depth + 2);
  scene.tweens.add({ targets: wave, scale: 30, alpha: 0, duration: 900, onComplete: () => wave.destroy() });
  if (hasManifestArt(scene, 'vfx_flaque_mousse')) {
    const v = addManifestSprite(scene, player.x, ghArenaGroundY(scene, player.x), 'vfx_flaque_mousse', 'spawn');
    v.setScale(v.scaleX * 2);
  }
  await ghWait(scene, 250);
  const gy = ghArenaGroundY(scene, player.x);
  const hole = scene.add.ellipse(player.x, gy - 4, 10, 8, 0x000000).setDepth(player.depth + 1);
  scene.tweens.add({ targets: hole, displayWidth: 170, displayHeight: 36, duration: 300 });
  for (let i = 0; i < 8; i++) {
    const chunk = scene.add.rectangle(player.x + Phaser.Math.Between(-70, 70), gy - 6, 14, 10, 0x5a4630).setDepth(player.depth + 2);
    scene.tweens.add({
      targets: chunk, y: gy + 220, angle: Phaser.Math.Between(-180, 180), duration: 700, delay: i * 40,
      ease: 'Quad.easeIn', onComplete: () => chunk.destroy(),
    });
  }
  await ghWait(scene, 300);
  // Agarica tombe (tween et non gravité : le gel du monde peut couper la physique).
  if (player.body) player.body.moves = false;
  scene.tweens.add({ targets: player, y: player.y + 320, angle: 160, duration: 900, ease: 'Quad.easeIn' });
  await ghBlackout(scene, 1100);
  ghSet(scene, 'ghiltPhase', 2);
  ghSet(scene, 'ghiltHpPhase2', boss.hp);
  ghLock(scene, false);
  goToScene(scene, 'TrouSombreScene', { enterId: 'from_arene' });
}

// Phase 2 : Ghil't affaibli, invite à utiliser la compétence du papillon.
function ghiltWeakenedHint(scene, st) {
  const boss = st.boss;
  ghToast(scene, 'Utilise la compétence du papillon !', 3000);
  const loop = scene.time.addEvent({
    delay: 6000, loop: true,
    callback: () => {
      if (!boss.active || boss.healed || st.busy) { loop.remove(); return; }
      ghToast(scene, 'Utilise la compétence du papillon !', 2500);
    },
  });
}

// Purification → Amanite → Geralt → bosquet.
async function ghiltSoin(scene, st) {
  if (st.busy) return;
  st.busy = true;
  const boss = st.boss;
  const cam = scene.cameras.main;
  const player = scene.player;
  ghLock(scene, true);
  boss.setCinematic(true);
  ghHideBossBar(scene);
  const bx = boss.x;
  const by = boss.y;
  const midY = by - boss.displayHeight * 0.5;
  // Cadre fixe sur Agarica + Ghil't pour toute la fin (Amanite, Geralt).
  cam.stopFollow();
  cam.pan((player.x + bx) / 2, cam.midPoint.y, 700, 'Sine.easeInOut');

  // Les papillons quittent le totem et vont envelopper Ghil't.
  const paps = [];
  for (let i = 0; i < 7; i++) {
    const p = ghPapillon(scene, player.x, player.y - 60);
    paps.push(p);
    ghPapillonMove(scene, p, bx + Phaser.Math.Between(-130, 130), midY + Phaser.Math.Between(-90, 70), 1100, i * 120);
  }
  await ghWait(scene, 1500);
  let pur;
  if (hasManifestArt(scene, 'vfx_purification')) {
    pur = addManifestSprite(scene, bx, midY, 'vfx_purification', 'burst', { origin: [0.5, 0.5] }).setDepth(GH_GLOW_DEPTH + 1);
    pur.setScale(pur.scaleX * 2.5);
    pur.once('animationcomplete', () => pur.active && pur.playManifest('fade'));
  } else {
    pur = ghGlow(scene, bx, midY, 120, 0xe8ffd8, 0.9);
    scene.tweens.add({ targets: pur, displayWidth: 520, displayHeight: 520, alpha: 0.6, duration: 1600, yoyo: true });
  }
  // La mousse se détache et tombe.
  for (let i = 0; i < 18; i++) {
    const m = scene.add.circle(bx + Phaser.Math.Between(-140, 140), midY + Phaser.Math.Between(-80, 40),
      Phaser.Math.Between(5, 12), 0x6fae3a).setDepth(boss.depth + 1);
    scene.tweens.add({
      targets: m, y: by - 4, alpha: 0, duration: 900, delay: i * 70, ease: 'Quad.easeIn', onComplete: () => m.destroy(),
    });
  }
  let swirl = null;
  if (hasManifestArt(scene, 'vfx_soin_papillon')) {
    swirl = addManifestSprite(scene, bx, midY, 'vfx_soin_papillon', 'swirl', { origin: [0.5, 0.5] }).setDepth(GH_GLOW_DEPTH + 1);
    swirl.setScale(swirl.scaleX * 2.5);
    scene.time.delayedCall(2000, () => swirl.active && swirl.destroy());
  }
  boss.setTint(0xe8ffd8);
  cam.flash(600, 230, 255, 220);
  await ghWait(scene, 1400);
  // Ghil't retrouve sa forme d'ancien gardien.
  const gueri = ghSprite(scene, bx, by, 'ghilt_gueri', 'idle');
  gueri.setFlipX(boss.flipX).setAlpha(0);
  scene.children.moveBelow(gueri, player);
  await ghTween(scene, { targets: gueri, alpha: 1, duration: 700 });
  boss.removeFromFight();
  st.boss = null;
  ghSet(scene, 'ghiltHealed', true);
  if (pur && pur.active) scene.tweens.add({ targets: pur, alpha: 0, duration: 600, onComplete: () => pur.destroy() });
  await ghSay(scene, 'ghilt_soin');
  paps.forEach((p, i) => {
    ghPapillonMove(scene, p, bx + Phaser.Math.Between(-300, 300), -40, 1400, i * 90);
    scene.time.delayedCall(1200 + i * 90, () => ghPapillonRemove(scene, p));
  });

  // Amanite surgit et l'achève d'un coup de lance.
  await ghWait(scene, 600);
  const fromLeft = player.x > bx ? false : true;
  const ax = cam.scrollX + (fromLeft ? -60 : cam.width + 60);
  const amanite = ghSprite(scene, ax, by, 'amanite', 'walk_angry');
  amanite.setFlipX(!fromLeft);
  const strikeX = bx + (fromLeft ? -1 : 1) * (gueri.displayWidth * 0.35);
  await ghTween(scene, { targets: amanite, x: strikeX, duration: 650, ease: 'Quad.easeIn' });
  ghAnim(amanite, 'spear_thrust');
  await ghWait(scene, 250);
  cam.flash(260, 255, 40, 40);
  cam.shake(350, 0.02);
  ghAnim(gueri, 'collapse');
  // Effondrement lisible même sans art : il s'affaisse et se ternit.
  scene.tweens.add({ targets: gueri, scaleY: gueri.scaleY * 0.82, duration: 700, ease: 'Quad.easeIn' });
  gueri.setTint(0x9a9aa8);
  ghSet(scene, 'amaniteKilledGhilt', true);
  await ghWait(scene, 900);
  ghAnim(amanite, 'idle');
  // Elle se tourne vers Agarica pour lui parler ; enregistrée dans scene.npcs
  // pour que StoryKit joue son anim `talk` pendant ses répliques.
  // Agarica se tenait souvent pile sur le point de frappe : Amanite recule d'un
  // pas côté Ghil't pour ne pas se superposer à elle pendant la discussion.
  if (Math.abs(amanite.x - player.x) < 80) {
    const side = bx >= player.x ? 1 : -1;
    await ghTween(scene, { targets: amanite, x: player.x + side * 90, duration: 300 });
  }
  amanite.setFlipX(player.x < amanite.x);
  scene.npcs = scene.npcs || {};
  scene.npcs.amanite = amanite;
  await ghSay(scene, 'ghilt_amanite');
  delete scene.npcs.amanite;
  amanite.setFlipX(!fromLeft);
  ghAnim(amanite, 'walk_angry');
  await ghTween(scene, {
    targets: amanite, x: cam.scrollX + (fromLeft ? cam.width + 80 : -80), duration: 1600, ease: 'Sine.easeIn',
  });
  amanite.destroy();

  // Geralt arrive (par la gauche, depuis la forêt corrompue).
  const geralt = ghSprite(scene, cam.scrollX - 50, ghArenaGroundY(scene, 100), 'geralt', 'walk');
  await ghTween(scene, { targets: geralt, x: player.x - 90, duration: 1500, ease: 'Sine.easeOut' });
  ghAnim(geralt, 'idle');
  scene.npcs = scene.npcs || {};
  scene.npcs.geralt = geralt;
  await ghSay(scene, 'ghilt_geralt');
  delete scene.npcs.geralt;
  await ghBlackout(scene, 900);
  ghLock(scene, false);
  goToScene(scene, 'BosquetRetourScene', { enterId: 'from_arene' });
}

// Revisite après la guérison : arène calme, corps de Ghil't, sorties ouvertes.
function ghiltArenaCalm(scene) {
  const x = 700;
  const gy = ghArenaGroundY(scene, x);
  const body = ghSprite(scene, x, gy, 'ghilt_gueri', 'collapse');
  body.setTint(0x9a9aa8);
  body.setScale(body.scaleX, body.scaleY * 0.82);
  scene.children.moveBelow(body, scene.player);
  // Traces de mousse séchée et deux papillons qui veillent.
  const g = scene.add.graphics();
  g.fillStyle(0x34502a, 0.6);
  for (const dx of [-420, -260, 320, 470]) g.fillEllipse(x + dx, gy - 4, 90, 14);
  ghPapillon(scene, x - 40, gy - 230);
  ghPapillon(scene, x + 60, gy - 200);
}

// ---------------------------------------------------------------------------
// Trou sombre
// ---------------------------------------------------------------------------
// Chemin de lumière vers la sortie (corniches de trou_sombre_data.js).
const TROU_PATH = [
  { x: 470, y: 380 }, { x: 600, y: 250 }, { x: 760, y: 130 }, { x: 900, y: 120 },
  { x: 1060, y: 10 }, { x: 1200, y: 0 }, { x: 1300, y: 20 },
];

ZONE_SCRIPTS.trou_sombre = {
  create(scene) {
    if (!scene.player || scene.__ghiltScriptFor === scene.player) return;
    scene.__ghiltScriptFor = scene.player;
    ghInstallTick(scene);
    scene.__ghPlayerGlow = ghGlow(scene, scene.player.x, scene.player.y - 45, 240, 0xfff2c8, 0.35);
    const exits = scene.__exits || [];
    if (ghGet(scene, 'trouSombreFait', false)) {
      TROU_PATH.forEach((pt) => ghPapillon(scene, pt.x, pt.y));
      return;
    }
    scene.__exits = []; // la sortie n'apparaît qu'une fois le totem activé
    trouSequence(scene, exits).catch((e) => console.error('trou_sombre', e));
  },
  update() {},
};

// Objet de cinématique : 1,6x sa taille d'inventaire, au-dessus du voile sombre.
function ghBigItem(scene, x, y, id) {
  const img = addItemImage(scene, x, y, id).setDepth(GH_GLOW_DEPTH + 3);
  return img.setScale(img.scaleX * 1.6);
}

async function trouSequence(scene, exits) {
  const player = scene.player;
  const cam = scene.cameras.main;
  ghLock(scene, true);
  // Réveil dans le noir : allongée, puis le rideau noir se lève lentement.
  player.setAngle(-80);
  const curtain = await ghBlackout(scene, 1, 1, 1);
  await ghTween(scene, { targets: curtain, alpha: 0, duration: 2200 });
  curtain.destroy();
  await ghSay(scene, 'trou_reveil');
  await ghTween(scene, { targets: player, angle: 0, duration: 450, ease: 'Back.easeOut' });

  // Les papillons descendent du haut, un à un, et l'entourent.
  const paps = [];
  for (let i = 0; i < 7; i++) {
    const p = ghPapillon(scene, player.x + 420 + i * 30, -30 - i * 20);
    paps.push(p);
    const a = (i / 7) * Math.PI * 2;
    ghPapillonMove(scene, p, player.x + Math.cos(a) * 95, player.y - 90 + Math.sin(a) * 45, 1800, i * 260);
  }
  await ghWait(scene, 1800 + 7 * 260);
  // Leur lumière la soigne : elle repart du trou avec tous ses cœurs.
  if (typeof player.refillAtCampfire === 'function') player.refillAtCampfire();
  if (hasManifestArt(scene, 'vfx_soin_papillon')) {
    const v = addManifestSprite(scene, player.x, player.y - 40, 'vfx_soin_papillon', 'burst', { origin: [0.5, 0.5] });
    v.setDepth(GH_GLOW_DEPTH + 1).once('animationcomplete', () => v.destroy());
  }
  await ghSay(scene, 'trou_papillons');

  // Test direct de la zone : le totem cassé devrait déjà être dans l'inventaire.
  if (!ghInvHas(scene, 'totem_poche_casse') && !ghInvHas(scene, 'totem_poche_actif')) {
    ghInvAdd(scene, 'totem_poche_casse', { silent: true });
  }

  // Deux papillons apportent le bocal d'antidote.
  const jar = ghBigItem(scene, player.x + 300, -20, 'bocal_antidote');
  const jarGlow = ghGlow(scene, jar.x, jar.y, 110, 0xb8ffe0, 0.6);
  const porters = [ghPapillon(scene, jar.x - 16, jar.y - 22), ghPapillon(scene, jar.x + 16, jar.y - 22)];
  const tx = player.x + 40;
  const ty = player.y - 70;
  porters.forEach((p, i) => ghPapillonMove(scene, p, tx + (i ? 16 : -16), ty - 22, 2200));
  await ghTween(scene, {
    targets: [jar, jarGlow], x: tx, y: ty, duration: 2200, ease: 'Sine.easeInOut',
  });
  await ghWait(scene, 300);
  await ghTween(scene, { targets: [jar, jarGlow], x: player.x, y: player.y - 40, alpha: 0, duration: 400 });
  jar.destroy();
  jarGlow.destroy();
  porters.forEach((p) => ghPapillonRemove(scene, p));
  // Poses narratives d'Agarica (art Codex agarica_extra, sans effet sans art).
  if (typeof setPlayerStoryPose === 'function') setPlayerStoryPose(scene, 'receive_item');
  await Promise.resolve(ghInvAdd(scene, 'bocal_antidote'));
  await ghWait(scene, 1600);
  if (typeof setPlayerStoryPose === 'function') setPlayerStoryPose(scene, null);

  await ghSay(scene, 'trou_totem');

  // Verser l'antidote dans le totem de poche : il s'active.
  const ix = player.x;
  const iy = player.y - 130;
  const totem = ghBigItem(scene, ix, iy, 'totem_poche_casse').setAlpha(0);
  const bottle = ghBigItem(scene, ix + 26, iy - 40, 'bocal_antidote').setAlpha(0).setAngle(-60);
  if (typeof setPlayerStoryPose === 'function') setPlayerStoryPose(scene, 'cast');
  await ghTween(scene, { targets: [totem, bottle], alpha: 1, duration: 500 });
  for (let i = 0; i < 9; i++) {
    const d = scene.add.circle(ix + 10, iy - 30, 3, 0x9fffd6).setDepth(GH_GLOW_DEPTH + 3);
    scene.tweens.add({
      targets: d, x: ix, y: iy, duration: 380, delay: i * 140, ease: 'Quad.easeIn', onComplete: () => d.destroy(),
    });
  }
  await ghWait(scene, 9 * 140 + 400);
  bottle.destroy();
  let burst;
  if (hasManifestArt(scene, 'vfx_purification')) {
    burst = addManifestSprite(scene, ix, iy, 'vfx_purification', 'burst', { origin: [0.5, 0.5] }).setDepth(GH_GLOW_DEPTH + 1);
    burst.once('animationcomplete', () => burst.active && burst.playManifest('fade'));
  } else {
    burst = ghGlow(scene, ix, iy, 60, 0xfff2a8, 1);
    scene.tweens.add({ targets: burst, displayWidth: 600, displayHeight: 600, alpha: 0.25, duration: 900 });
  }
  cam.flash(500, 255, 240, 190);
  totem.destroy();
  const active = ghBigItem(scene, ix, iy, 'totem_poche_actif');
  const activeGlow = ghGlow(scene, ix, iy, 150, 0xfff2a8, 0.8);
  paps.forEach((p, i) => ghPapillonMove(scene, p, ix + Math.cos(i) * 60, iy + Math.sin(i) * 40, 900));
  ghInvRemove(scene, 'bocal_antidote');
  ghInvRemove(scene, 'totem_poche_casse');
  await Promise.resolve(ghInvAdd(scene, 'totem_poche_actif'));
  await ghWait(scene, 1500);
  await Promise.resolve(ghUnlockSkill(scene, 'papillon'));
  await ghWait(scene, 1800);
  if (typeof setPlayerStoryPose === 'function') setPlayerStoryPose(scene, null);
  ghSet(scene, 'trouSombreFait', true);
  await ghTween(scene, {
    targets: [active, activeGlow], x: player.x, y: player.y - 40, alpha: 0, duration: 600,
  });
  active.destroy();
  activeGlow.destroy();
  if (burst && burst.active) burst.destroy();

  await ghSay(scene, 'trou_sortie');
  // Les papillons s'égrènent le long des corniches jusqu'à la sortie.
  paps.forEach((p, i) => ghPapillonMove(scene, p, TROU_PATH[i].x, TROU_PATH[i].y, 1600, i * 220));
  scene.__exits = exits;
  ghLock(scene, false);
  ghToast(scene, 'Suis les papillons vers la lumière.', 3200);
}
