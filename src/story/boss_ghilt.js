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
// Séquence asynchrone du boss : si la zone a été quittée entre deux étapes
// (menu pause → titre, rechargement…), elle s'arrête sans erreur au lieu de
// planter sur `scene.player` devenu nul.
function ghRun(scene, fn, label) {
  const visit = scene.__storyVisit;
  return Promise.resolve().then(fn).catch((e) => {
    if (!scene.sys || !scene.sys.isActive() || scene.__storyVisit !== visit || !scene.player) return;
    console.error(label, e);
  });
}

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
// Halos peints du lot n°8 (blancs, donc teintables) : `fx_halo_doux` pour
// tous les halos, `fx_halo_rayons` pour le totem qui s'active. Énergie
// mesurée (luminance × alpha moyenne) : dégradé dessiné 0,191, `fx_halo_doux`
// 0,176, `fx_halo_rayons` 0,193 -- d'où un agrandissement de √(0,191/0,176)
// ≈ 1,04 pour le halo doux, pour garder le même éclat qu'avant à taille égale.
const GH_GLOW_ART = {
  doux: { key: 'item-fx_halo_doux', comp: 1.04 },
  rayons: { key: 'item-fx_halo_rayons', comp: 1 },
};
function ghGlowTexture(scene, kind = 'doux') {
  const art = GH_GLOW_ART[kind] || GH_GLOW_ART.doux;
  if (scene.textures.exists(art.key)) return { key: art.key, comp: art.comp };
  // Repli : l'art des rayons manque mais le halo doux existe.
  if (kind !== 'doux' && scene.textures.exists(GH_GLOW_ART.doux.key)) return { ...GH_GLOW_ART.doux };
  const key = 'gh-glow';
  if (!scene.textures.exists(key)) {
    const tex = scene.textures.createCanvas(key, 128, 128);
    const ctx = tex.getContext();
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.35, 'rgba(255,255,255,0.45)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    tex.refresh();
  }
  return { key, comp: 1 };
}

// `size` = diamètre du halo dessiné d'avant ; l'image peinte est agrandie de
// `comp` (même éclat). `__ghComp` sert aux tweens de taille (cf. ghGlowSize).
function ghGlow(scene, x, y, size, color, alpha, kind = 'doux') {
  const t = ghGlowTexture(scene, kind);
  const img = scene.add.image(x, y, t.key).setDisplaySize(size * t.comp, size * t.comp).setTint(color)
    .setAlpha(alpha).setBlendMode(Phaser.BlendModes.ADD).setDepth(GH_GLOW_DEPTH);
  img.__ghComp = t.comp;
  return img;
}

// Taille d'affichage d'un halo de ghGlow pour un diamètre « dessiné » donné.
function ghGlowSize(glow, size) {
  return size * ((glow && glow.__ghComp) || 1);
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
    // Art `mousse_mur` (comme le mur qui se referme en forêt corrompue) via
    // drawMossVisual (StoryKit), qui garde un dessin par code en repli.
    if (typeof drawMossVisual === 'function') {
      drawMossVisual(scene, x, gy - 150, 60, 300, 'mousse_mur', true);
    } else {
      const g = scene.add.graphics();
      g.fillStyle(0x2f5d1f, 1);
      g.fillRoundedRect(x - 26, gy - 300, 52, 300, 18);
    }
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

    ghOn(scene, 'ghilt-threshold', () => ghRun(scene, () => ghiltChute(scene, st), 'ghilt chute'));
    ghOn(scene, 'ghilt-weakened', () => ghiltWeakenedHint(scene, st));
    ghOn(scene, 'ghilt-heal-refused', () => {
      const now = scene.time.now;
      if (now < st.toastAt) return;
      st.toastAt = now + 3000;
      ghToast(scene, 'La mousse résiste… Affaiblis-le d\'abord !');
    });
    ghOn(scene, 'ghilt-healed', () => ghRun(scene, () => ghiltSoin(scene, st), 'ghilt soin'));
    ghOn(scene, 'ghilt-player-down', () => ghRun(scene, () => ghiltPlayerDown(scene, st), 'ghilt reprise'));
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
    // Signal direct de Player.hitByEnemy au dernier cœur : le tout premier
    // `set('hearts')` du registre émet 'setdata', pas 'changedata-hearts'
    // (cf. boss_kainati.js). Même verrou `playerDownFired` : un seul relancement.
    ghOn(scene, 'player-depleted', () => onHearts(null, 0));

    const run = phase === 1 ? ghiltIntroPhase1 : ghiltIntroPhase2;
    ghRun(scene, () => run(scene, st), 'ghilt intro');
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

// Onde de l'explosion de mousse : image FIXE `vfx_anneau_choc` toxique,
// frame 2 (anneau vert à débris, après le recentrage M06), et non l'anim :
// sa propre croissance (×7 sur 4 frames) se cumulerait au tween. Le trait de
// l'anneau mesure ~198 px source sur cette frame : même diamètre affiché que
// l'ancien cercle (60 → 1800 px), même alpha (0,75 → 0) et même durée.
// Repli : le disque vert dessiné.
const GH_WAVE_RING_PX = 198;
function ghShockWave(scene, x, y, depth) {
  const key = typeof manifestFrameKey === 'function' ? manifestFrameKey('vfx_anneau_choc', 'toxique', 2) : 'vfx_anneau_choc-toxique-2';
  if (scene.textures.exists(key)) {
    const ring = scene.add.image(x, y, key).setOrigin(0.5, 0.5).setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(depth).setAlpha(0.75).setScale(60 / GH_WAVE_RING_PX);
    scene.tweens.add({
      targets: ring, scale: 1800 / GH_WAVE_RING_PX, alpha: 0, duration: 900, onComplete: () => ring.destroy(),
    });
    return ring;
  }
  const wave = scene.add.circle(x, y, 30, 0x7fdc5a, 0.75).setDepth(depth);
  scene.tweens.add({ targets: wave, scale: 30, alpha: 0, duration: 900, onComplete: () => wave.destroy() });
  return wave;
}

// Trou d'effondrement sous Agarica : `decor_trou_effondre` (lot n°8) à 0,16
// (~191 x 41 px ; réglage R3). À 0,14 (échelle du manifeste, l'emprise de
// l'ancienne ellipse de 170 px), son intérieur brun-noir se perdait sous la
// flaque verte et le flash : on prend la taille lisible. La rangée 90/255 de
// l'image (bord des lèvres herbeuses) est posée sur la ligne de marche ; il
// s'ouvre en 300 ms comme avant (échelle 6 % → 100 %). Repli : l'ellipse noire.
const GH_HOLE_SCALE = 0.16;
function ghCollapseHole(scene, x, gy, depth) {
  if (scene.textures.exists('item-decor_trou_effondre')) {
    const hs = GH_HOLE_SCALE;
    const hole = scene.add.image(x, gy, 'item-decor_trou_effondre').setOrigin(0.5, 90 / 255)
      .setScale(hs * 0.06).setDepth(depth);
    scene.tweens.add({ targets: hole, scaleX: hs, scaleY: hs, duration: 300 });
    return hole;
  }
  const hole = scene.add.ellipse(x, gy - 4, 10, 8, 0x000000).setDepth(depth);
  scene.tweens.add({ targets: hole, displayWidth: 170, displayHeight: 36, duration: 300 });
  return hole;
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
  ghShockWave(scene, s.x, s.y, boss.depth + 2);
  if (hasManifestArt(scene, 'vfx_flaque_mousse')) {
    const v = addManifestSprite(scene, player.x, ghArenaGroundY(scene, player.x), 'vfx_flaque_mousse', 'spawn');
    v.setScale(v.scaleX * 2);
  }
  await ghWait(scene, 250);
  const gy = ghArenaGroundY(scene, player.x);
  ghCollapseHole(scene, player.x, gy, player.depth + 1);
  // Mottes de terre : `fx_motte_terre` (lot n°8) à 14 px de haut, la taille
  // du rectangle d'avant ; repli : le rectangle brun.
  const motteArt = scene.textures.exists('item-fx_motte_terre');
  for (let i = 0; i < 8; i++) {
    const cx = player.x + Phaser.Math.Between(-70, 70);
    const chunk = motteArt
      ? scene.add.image(cx, gy - 6, 'item-fx_motte_terre').setScale(14 / 128).setFlipX(i % 2 === 1)
      : scene.add.rectangle(cx, gy - 6, 14, 10, 0x5a4630);
    chunk.setDepth(player.depth + 2);
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

// ---------------------------------------------------------------------------
// Soin : fin de la transformation d'Agarica, herbe saine, créatures guéries
// ---------------------------------------------------------------------------
// Demande utilisateur (2026-10-25) : « finir l'animation de transformation
// dans l'animation de sauvetage de Ghil't ». heal() est déclenché par la nuée
// de la compétence papillon, en plein battement (pose « avec la forme » de
// Player.startSkillFormPose) ; ghLock gèle aussitôt le monde, donc
// player.update() ne tourne plus : Agarica restait PAPILLON, la nuée figée
// autour d'elle, jusqu'à la 1re réplique, qui la remettait d'un coup en pose
// `talk`. On fait avancer la pose (fin de la transfo, incantation, transfo
// inverse, au rythme de GH_SOIN_POSE_MS ci-dessous), puis Agarica reprend l'idle ; la nuée gelée file vers Ghil't en s'effaçant
// et les papillons de la cinématique prennent le relais. Aucune durée de la
// cinématique ne change. Sans pose en cours (compétence lancée sous une autre
// forme, déclenchement direct en test) : rien à faire.
// Revue du 2026-10-26 (« l'animation de transformation est coupée ») : en
// jeu, la pose dure 740 ms (transfo 180, geste 400, retour 160) et le soin
// tombe en pleine transfo ; ses images défilaient trop vite pour être vues,
// et le ralenti du soin (juiceSlowMo) arrêtait l'incantation avant l'orbe.
// Ici, monde gelé, la suite de la pose est rejouée à son rythme peint
// (GH_SOIN_POSE_MS, Player.retimeSkillFormPose : même image, pas de saut) :
// fin de la transfo (4 images à 14 i/s), incantation entière pendant que les
// papillons de la cinématique s'envolent vers Ghil't, retour à la forme
// humaine ; ~1,2 s au plus, avant l'éclat de purification (1,5 s), sans
// toucher aux durées de la cinématique.
const GH_SOIN_POSE_MS = { in: 290, act: 640, out: 290 };

function ghFinishSkillPose(scene, tx, ty) {
  const p = scene.player;
  if (!p || !p.active) return;
  const swarm = p.papillonSwarm;
  if (swarm && swarm.active) ghReleaseSwarm(scene, swarm, tx, ty);
  if (!p.skillFormPose || typeof p.tickSkillFormPose !== 'function' || typeof p.drawSkillFormPose !== 'function') return;
  if (p.skillFormPose.kind === 'papillon' && typeof p.retimeSkillFormPose === 'function') {
    p.retimeSkillFormPose(scene.time.now, GH_SOIN_POSE_MS);
  }
  const stop = () => scene.events.off('update', step);
  // Écouteur 'update' de la scène (pas ZONE_SCRIPTS.update, coupé par le gel).
  function step() {
    if (!p.active || !p.body) { stop(); return; }
    const now = scene.time.now;
    // Horloge de la pose (transfo inverse, gerbe de poussière sans l'art) ;
    // elle s'efface d'elle-même si une pose narrative a pris la main.
    p.tickSkillFormPose(now);
    if (p.skillFormPose && p.drawSkillFormPose(now)) return;
    if (p.skillFormPose) p.endSkillFormPose(true);
    stop();
    if (!p.storyPose) ghPlayerIdle(scene, p);
  }
  scene.events.on('update', step);
  scene.events.once('shutdown', stop);
  step();
}

// Agarica debout au repos, comme la branche « forme humaine au sol » de
// Player.update (qui ne tourne pas pendant le gel) : pivot aux pieds, idle,
// hitbox humaine, feuille d'idle face à GAUCHE (flip quand elle regarde à droite).
function ghPlayerIdle(scene, p) {
  if (typeof p.resetVineArtAnchor === 'function') p.resetVineArtAnchor();
  p.setOrigin(0.5, 1).setRotation(0);
  if (typeof ANIM_IDLE_KEY !== 'undefined' && scene.anims.exists(ANIM_IDLE_KEY)) p.anims.play(ANIM_IDLE_KEY, true);
  if (typeof FORMS !== 'undefined' && FORMS.agarica && typeof p.applyBodyForScale === 'function') {
    p.applyBodyForScale(FORMS.agarica.scale, FORMS.agarica.body);
  }
  p.setFlipX(p.facingDir > 0);
}

// Nuée de la compétence (PapillonSwarm, gelée avec le monde) : ses papillons
// filent vers Ghil't en s'effaçant, halo et anneau s'éteignent, puis elle est
// détruite (sa zone de soin ne sert plus : Ghil't est déjà soigné).
function ghReleaseSwarm(scene, swarm, tx, ty) {
  const flies = (swarm.flies || []).map((f) => f.sprite).filter((s) => s && s.active);
  flies.forEach((s, i) => scene.tweens.add({
    targets: s, x: tx + Phaser.Math.Between(-110, 110), y: ty + Phaser.Math.Between(-70, 50), alpha: 0,
    duration: 650, delay: i * 40, ease: 'Sine.easeIn',
  }));
  // Leurs traînées (fx_trainee_papillon) ne suivent plus, monde gelé : elles
  // s'éteignent avec le halo et l'anneau.
  const trails = (swarm.flies || []).map((f) => f.trail);
  const rest = [swarm.glow, swarm.swirl, ...trails].filter((o) => o && o.active);
  if (rest.length) scene.tweens.add({ targets: rest, alpha: 0, duration: 350 });
  scene.time.delayedCall(700 + flies.length * 40, () => {
    if (swarm.active && typeof swarm.destroy === 'function') swarm.destroy();
  });
}

// Cercle d'herbe saine (option H11) : `decor_cercle_sain` à 0,22 (~317 px,
// la largeur de Ghil't ; 0,32 au manifeste pour la clairière), posé à plat
// sur le sol (bas à gy + 3), juste derrière `behind` (le corps). Pendant le
// soin il s'étire depuis le centre en 1400 ms (le temps de la chute de la
// mousse, sans attente ajoutée) ; dans l'arène calme il est déjà là. Sans
// l'image : rien, comme avant.
const GH_HEALTHY_CIRCLE_SCALE = 0.22;
function ghHealthyCircle(scene, x, gy, behind, grow) {
  if (!scene.textures.exists('item-decor_cercle_sain')) return null;
  const s = GH_HEALTHY_CIRCLE_SCALE;
  const c = scene.add.image(x, gy + 3, 'item-decor_cercle_sain').setOrigin(0.5, 1).setScale(grow ? 0.005 : s, s);
  if (behind && behind.active) {
    c.setDepth(behind.depth);
    scene.children.moveBelow(c, behind);
  }
  if (grow) scene.tweens.add({ targets: c, scaleX: s, duration: 1400, ease: 'Sine.easeOut' });
  return c;
}

// Créatures de mousse guéries (option H16) : images `mousse_creature_guerie_0`
// (debout) et `_1` (tassée : pose d'atterrissage, comme MousseCreature.js),
// échelle du manifeste (0,2 : ~35 px, la taille de la créature corrompue),
// pieds sur le sol (origine en bas). Art regardant à droite. Rien sans l'art.
const GH_CRITTER_IDS = ['mousse_creature_guerie_0', 'mousse_creature_guerie_1'];
function ghCritterAvailable(scene) {
  return GH_CRITTER_IDS.every((id) => scene.textures.exists(`item-${id}`));
}

function ghCritterImage(scene, x, frame) {
  const id = GH_CRITTER_IDS[frame];
  const img = scene.add.image(x, ghArenaGroundY(scene, x), `item-${id}`).setOrigin(0.5, 1);
  img.setScale((getItemManifest()[id] || {}).scale || 0.2);
  return img;
}

// Un petit bond sur place : _0 en l'air, _1 tassée 120 ms à l'atterrissage.
function ghCritterHop(scene, c, height = 8) {
  if (!c.img.active) return;
  scene.tweens.add({
    targets: c.img, y: c.gy - height, duration: 140, yoyo: true, ease: 'Sine.easeOut',
    onComplete: () => {
      if (!c.img.active || c.fleeing) return;
      c.img.setTexture(`item-${GH_CRITTER_IDS[1]}`);
      scene.time.delayedCall(120, () => c.img.active && !c.fleeing && c.img.setTexture(`item-${GH_CRITTER_IDS[0]}`));
    },
  });
}

// Elles sortent de la mousse tombée de part et d'autre de Ghil't guéri, en
// fondu avec un petit bond, puis sautillent pendant la réplique (un bond
// toutes les 600 ms, décalés). Derrière le gardien et Agarica.
function ghHealedCritters(scene, bx, gueri) {
  if (!ghCritterAvailable(scene)) return [];
  const half = gueri.displayWidth / 2 + 40;
  return [-1, 1].map((side, i) => {
    const x = Phaser.Math.Clamp(bx + side * half, 60, 1284);
    const img = ghCritterImage(scene, x, 0).setFlipX(side > 0).setAlpha(0);
    img.setDepth(gueri.depth);
    scene.children.moveBelow(img, gueri);
    const c = { img, gy: img.y, fleeing: false, timer: null };
    scene.tweens.add({ targets: img, alpha: 1, duration: 300, delay: i * 250 });
    scene.time.delayedCall(i * 250, () => ghCritterHop(scene, c, 14));
    c.timer = scene.time.addEvent({ delay: 600, startAt: i * 300, loop: true, callback: () => ghCritterHop(scene, c) });
    return c;
  });
}

// À l'arrivée d'Amanite : elles détalent vers `dir` en petits bonds et
// s'effacent (sans retarder la cinématique).
function ghCrittersFlee(scene, critters, dir) {
  for (const c of critters || []) {
    if (!c.img.active) continue;
    c.fleeing = true;
    if (c.timer) c.timer.remove();
    scene.tweens.killTweensOf(c.img);
    c.img.setTexture(`item-${GH_CRITTER_IDS[0]}`).setFlipX(dir < 0).setY(c.gy).setAlpha(1);
    scene.tweens.add({ targets: c.img, x: c.img.x + dir * 300, duration: 1100, ease: 'Quad.easeIn' });
    scene.tweens.add({ targets: c.img, y: c.gy - 7, duration: 110, yoyo: true, repeat: 4 });
    scene.tweens.add({ targets: c.img, alpha: 0, duration: 500, delay: 600, onComplete: () => c.img.destroy() });
  }
}

// Arène calme : une créature guérie posée près du corps, tournée vers lui.
function ghCalmCritter(scene, x, frame) {
  if (!ghCritterAvailable(scene)) return null;
  return ghCritterImage(scene, x, frame).setFlipX(x > 700).setDepth(GH_CALM_DEPTH);
}

// Rai de l'arène calme (option H15).
const GH_CALM_RAY_ALPHA = 0.3;

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
  // La compétence papillon qui vient de le soigner finit sa transformation
  // (Agarica redevient elle-même) au lieu de rester figée par le gel.
  ghFinishSkillPose(scene, bx, midY);
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
    const big = ghGlowSize(pur, 520);
    scene.tweens.add({ targets: pur, displayWidth: big, displayHeight: big, alpha: 0.6, duration: 1600, yoyo: true });
  }
  // La mousse se détache et tombe : mottes et éclats peints du lot n°8 en
  // alternance (diamètre ×1,1 du cercle d'avant, images de 128 px), qui
  // tournent un peu en tombant ; repli : les cercles verts.
  const mossArt = ['item-fx_motte_mousse', 'item-fx_eclat_mousse'].filter((k) => scene.textures.exists(k));
  for (let i = 0; i < 18; i++) {
    const mx = bx + Phaser.Math.Between(-140, 140);
    const my = midY + Phaser.Math.Between(-80, 40);
    const r = Phaser.Math.Between(5, 12);
    const m = mossArt.length
      ? scene.add.image(mx, my, mossArt[i % mossArt.length]).setScale((2 * r * 1.1) / 128)
        .setAngle(Phaser.Math.Between(-30, 30)).setFlipX(i % 3 === 0)
      : scene.add.circle(mx, my, r, 0x6fae3a);
    m.setDepth(boss.depth + 1);
    scene.tweens.add({
      targets: m, y: by - 4, alpha: 0, duration: 900, delay: i * 70, ease: 'Quad.easeIn', onComplete: () => m.destroy(),
      ...(mossArt.length ? { angle: m.angle + Phaser.Math.Between(-90, 90) } : {}),
    });
  }
  // Là où la mousse tombe, l'herbe saine repousse sous lui (option H11).
  const circle = ghHealthyCircle(scene, bx, by, boss, true);
  let swirl = null;
  if (hasManifestArt(scene, 'vfx_soin_papillon')) {
    swirl = addManifestSprite(scene, bx, midY, 'vfx_soin_papillon', 'swirl', { origin: [0.5, 0.5] }).setDepth(GH_GLOW_DEPTH + 1);
    swirl.setScale(swirl.scaleX * 2.5);
    scene.time.delayedCall(2000, () => swirl.active && swirl.destroy());
  }
  boss.setTint(0xe8ffd8);
  cam.flash(600, 230, 255, 220);
  await ghWait(scene, 1400);
  // Ghil't retrouve sa forme d'ancien gardien : vrai fondu enchaîné (le corps
  // malade s'efface PENDANT que le gardien apparaît, mêmes pieds, même sens),
  // sous une bouffée de lumière douce qui gonfle puis retombe. Avant, le
  // malade restait opaque dessous puis disparaissait d'un coup à la fin.
  // Même durée (700 ms).
  const gueri = ghSprite(scene, bx, by, 'ghilt_gueri', 'idle');
  gueri.setFlipX(boss.flipX).setAlpha(0);
  scene.children.moveBelow(gueri, player);
  // L'herbe saine passe sous le gardien (il n'a pas la profondeur du boss) :
  // ses pattes restent devant la touffe.
  if (circle) {
    circle.setDepth(gueri.depth);
    scene.children.moveBelow(circle, gueri);
  }
  const bloom = ghGlow(scene, bx, midY, gueri.displayWidth * 0.7, 0xf2ffe4, 0);
  const bloomBig = ghGlowSize(bloom, gueri.displayWidth * 1.25);
  scene.tweens.add({
    targets: bloom, alpha: 0.45, displayWidth: bloomBig, displayHeight: bloomBig, duration: 350,
    yoyo: true, ease: 'Sine.easeOut', onComplete: () => bloom.destroy(),
  });
  scene.tweens.add({ targets: boss, alpha: 0, duration: 700, ease: 'Sine.easeIn' });
  await ghTween(scene, { targets: gueri, alpha: 1, duration: 700 });
  boss.removeFromFight();
  st.boss = null;
  ghSet(scene, 'ghiltHealed', true);
  if (pur && pur.active) scene.tweens.add({ targets: pur, alpha: 0, duration: 600, onComplete: () => pur.destroy() });
  // Deux petites créatures de mousse guéries sortent de la mousse tombée
  // (option H16) : seul endroit où leur art se voit en partie normale.
  const critters = ghHealedCritters(scene, bx, gueri);
  await ghSay(scene, 'ghilt_soin');
  paps.forEach((p, i) => {
    ghPapillonMove(scene, p, bx + Phaser.Math.Between(-300, 300), -40, 1400, i * 90);
    scene.time.delayedCall(1200 + i * 90, () => ghPapillonRemove(scene, p));
  });

  // Amanite surgit et l'achève d'un coup de lance.
  await ghWait(scene, 600);
  const fromLeft = player.x > bx ? false : true;
  // Les créatures guéries détalent à l'arrivée d'Amanite, du côté opposé.
  ghCrittersFlee(scene, critters, fromLeft ? 1 : -1);
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
// Tout le tableau (herbe saine, corps, mousse séchée, créatures, rai) est posé
// à GH_CALM_DEPTH, juste sous les personnages (10) : les décors de la zone
// (arche à x 672, piliers) sont construits APRÈS ce script, à la profondeur 0,
// et cachaient le corps (déjà le cas avant le lot n°8). Au combat aussi, Ghil't
// passe devant l'arche. Dans la même profondeur, l'ordre de création fait foi.
const GH_CALM_DEPTH = CHARACTER_DEPTH - 1;
function ghiltArenaCalm(scene) {
  const x = 700;
  const gy = ghArenaGroundY(scene, x);
  // L'herbe saine repoussée pendant le soin est restée sous lui (option H11).
  ghHealthyCircle(scene, x, gy, null, false)?.setDepth(GH_CALM_DEPTH);
  const body = ghSprite(scene, x, gy, 'ghilt_gueri', 'collapse');
  body.setTint(0x9a9aa8);
  body.setScale(body.scaleX, body.scaleY * 0.82);
  body.setDepth(GH_CALM_DEPTH);
  // Traces de mousse séchée : `decor_mousse_sechee` (lot n°8, 0,09 : ~90 px,
  // la largeur des anciennes ellipses), posées sur le sol (bas à gy + 2),
  // retournées une sur deux pour casser la répétition. Repli : les ellipses.
  const dryArt = scene.textures.exists('item-decor_mousse_sechee');
  const g = dryArt ? null : scene.add.graphics().fillStyle(0x34502a, 0.6).setDepth(GH_CALM_DEPTH);
  [-420, -260, 320, 470].forEach((dx, i) => {
    const mx = x + dx;
    const my = ghArenaGroundY(scene, mx);
    if (dryArt) {
      scene.add.image(mx, my + 2, 'item-decor_mousse_sechee').setOrigin(0.5, 1).setScale(0.09)
        .setFlipX(i % 2 === 1).setDepth(GH_CALM_DEPTH);
    } else {
      g.fillEllipse(mx, my - 4, 90, 14);
    }
  });
  // Les deux créatures guéries sont restées près de lui (option H16).
  ghCalmCritter(scene, 520, 1);
  ghCalmCritter(scene, 880, 0);
  // Rai de lumière chaude sur le corps (option H15) : la paix est revenue.
  // Comme les `lights` de la Fondation : ADD, bas posé sur le sol ; créé en
  // dernier, il passe DEVANT le corps, qu'il éclaire. Rien sans l'image.
  if (scene.textures.exists('item-fx_rai_lumiere')) {
    scene.add.image(x, gy, 'item-fx_rai_lumiere').setOrigin(0.5, 1).setDisplaySize(260, 460)
      .setTint(0xfff6e0).setAlpha(GH_CALM_RAY_ALPHA).setBlendMode(Phaser.BlendModes.ADD).setDepth(GH_CALM_DEPTH);
  }
  // Deux papillons veillent.
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
    // Halo d'Agarica dans le noir : 300 px avec le halo peint (plan GH-4 : son
    // profil, plus doux au centre, éclaire moins loin à taille égale), 240 sans.
    // Revue du lot 8 : posé (ADD, profondeur 950) PAR-DESSUS Agarica, restée
    // sous le voile (900), il la couvrait d'un voile laiteux gris-blanc (la
    // silhouette perdait son contraste, lu comme du brouillard). Agarica et
    // Xara passent donc au-dessus du halo, nettes comme les papillons qui
    // l'éclairent ; le halo reste dessous en flaque de lumière, un peu plus
    // chaude et moins forte (0,28 au lieu de 0,35) pour ne pas voiler le décor.
    const ownGlow = scene.textures.exists(GH_GLOW_ART.doux.key) ? 300 : 240;
    scene.__ghPlayerGlow = ghGlow(scene, scene.player.x, scene.player.y - 45, ownGlow, 0xffe2b4, 0.28);
    ghLiftCharacters(scene, GH_GLOW_DEPTH + 1);
    const exits = scene.__exits || [];
    if (ghGet(scene, 'trouSombreFait', false)) {
      TROU_PATH.forEach((pt) => ghPapillon(scene, pt.x, pt.y));
      return;
    }
    scene.__exits = []; // la sortie n'apparaît qu'une fois le totem activé
    ghRun(scene, () => trouSequence(scene, exits), 'trou_sombre');
  },
  update() {},
};

// Agarica (et ce qui se dessine avec elle : arc de coup, Xara et son fil) à
// `depth`, au-dessus du voile sombre et des halos : lisible dans le noir.
// Les effets créés ensuite autour d'elle suivent sa profondeur (nuée du
// papillon, arc peint : `player.depth + 1`).
function ghLiftCharacters(scene, depth) {
  const p = scene.player;
  if (p) {
    p.setDepth(depth);
    if (p.slashGfx) p.slashGfx.setDepth(depth + 1);
    if (p.slashSprite && p.slashSprite.active) p.slashSprite.setDepth(depth + 1);
  }
  const x = scene.xara;
  if (x && x.active) {
    if (x.thread) x.thread.setDepth(depth);
    if (x.threadArt) x.threadArt.setDepth(depth);
    x.setDepth(depth);
  }
}

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
  // Gouttes `fx_goutte_antidote` (lot n°8) de 8 px ; repli : points dessinés.
  const dropArt = scene.textures.exists('item-fx_goutte_antidote');
  for (let i = 0; i < 9; i++) {
    const d = dropArt
      ? scene.add.image(ix + 10, iy - 30, 'item-fx_goutte_antidote').setScale(8 / 128)
      : scene.add.circle(ix + 10, iy - 30, 3, 0x9fffd6);
    d.setDepth(GH_GLOW_DEPTH + 3);
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
    const big = ghGlowSize(burst, 600);
    scene.tweens.add({ targets: burst, displayWidth: big, displayHeight: big, alpha: 0.25, duration: 900 });
  }
  cam.flash(500, 255, 240, 190);
  totem.destroy();
  const active = ghBigItem(scene, ix, iy, 'totem_poche_actif');
  // Totem activé : halo à rayons `fx_halo_rayons` (même éclat que le dégradé).
  const activeGlow = ghGlow(scene, ix, iy, 150, 0xfff2a8, 0.8, 'rayons');
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
