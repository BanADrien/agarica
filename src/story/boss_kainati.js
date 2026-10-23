// ZONE_SCRIPTS.kainati_arene — combat contre Kainati, Roi des Simiens
// (zone grand_arbre_arene, donnée `script: 'kainati_arene'` + `kainatiArena`).
// Entités (boss, pierres, esprit) : src/entities/Kainati.js.
//
// RÈGLES DU COMBAT (lisible et généreux, gagnable en forme humaine avec un
// saut simple -- Agarica n'a PAS encore la forme singe) :
// - Les lianes de l'arène sont un pur décor pour Agarica (décision
//   utilisateur : en forme humaine, les lianes sont ignorées partout ; les
//   anciennes « lianes-tremplins » qui la faisaient rebondir sont retirées).
//   Seul Kainati s'y suspend.
// - Kainati se balance de liane en liane, lance des salves de pierres en cloche
//   (flash jaune + « ! » avant ; un coup de dague brise une pierre), puis
//   plonge sur Agarica (flash rouge + ombre au sol) : land_stomp = ondes de
//   choc au ras du sol (à sauter) puis il reste SONNÉ au sol ~2,2 s → seule
//   fenêtre de frappe (1 PV par coup, 2 coups au plus par plongeon : il se
//   relève alors d'un bond). Il plonge à chaque cycle (~9 s en phase 1).
//   Frappé ailleurs (suspendu, en plein bond), il esquive (éclat bleu).
// - 8 PV. À 4 PV : phase 2 (cri, tout ×0,75 plus rapide, salves de 3 pierres,
//   deux plongeons par cycle, pluie de pierres du plafond avec ombres au sol,
//   y compris après chaque stomp).
// - Victoire à 0 PV : il ne meurt pas (defeated_lucid), la mousse le quitte en
//   partie, cinématique « kainati_victoire », flag `kainatiDefeated`, rideau de
//   mousse droit dissous, sorties vers le totem du singe (MondeSpirituelScene)
//   et la route des hauteurs (ForetFlottante1Scene) créées.
// - Mort d'Agarica : réapparition au point d'entrée, combat remis à zéro
//   (Kainati plein PV sur sa liane, projectiles effacés, arène rouverte) ; il
//   redémarre en repassant `lockX` (sans redonner l'intro).
// - Revisite après victoire : Kainati apaisé au sol, « E : parler »
//   (dialogue `kainati_calme`), passages ouverts.
//
// Flags : `kainatiIntroSeen`, `kainatiDefeated`.
// Cinématiques / dialogues (surchargeables par src/story/acte1.js, chargé après) :
//   CUTSCENES|DIALOGUES `kainati_intro`, `kainati_victoire` ; DIALOGUES `kainati_calme`.
// Indices (toasts, une fois par combat) : au début, au 1er étourdissement, à
// la 1re esquive.

const KAINATI_TALK_RANGE = 150;

// --- Textes par défaut (ton digne ; l'agent Acte 1 peut les remplacer) ---
if (!DIALOGUES.kainati_intro) {
  DIALOGUES.kainati_intro = [
    { who: 'kainati', text: "Encore une créature d'en bas qui grimpe vers ma cime..." },
    { who: 'kainati', text: "La mousse t'a suivie jusqu'ici. Tu ne toucheras pas à mon arbre !" },
    { who: 'agarica', text: "Attends ! Je ne suis pas venue pour..." },
    { who: 'kainati', text: 'Assez ! Les branches jugeront pour moi.' },
  ];
}
if (!DIALOGUES.kainati_victoire) {
  DIALOGUES.kainati_victoire = [
    { who: 'kainati', text: '...' },
    { who: 'kainati', text: 'La brume se dissipe... Tu... combats la mousse ?' },
    { who: 'agarica', text: "Oui. Elle ronge la forêt. Je cherche un moyen de l'arrêter." },
    { who: 'kainati', text: "Elle m'avait rempli de colère. Je voyais une ennemie là où il n'y avait qu'une enfant des bois." },
    { who: 'kainati', text: "Tu as lu mes bonds sans les connaître. Tu as compris mon mouvement." },
    { who: 'kainati', text: "Derrière ma branche dort le totem de mon peuple. Va. Écoute-le comme tu m'as écouté." },
  ];
}
if (!DIALOGUES.kainati_calme) {
  DIALOGUES.kainati_calme = [
    { who: 'kainati', text: "Le totem t'attend derrière ma branche. Plus haut, la route mène vers les îles des hauteurs." },
    { who: 'kainati', text: 'Que les lianes te portent, petite druidesse.' },
  ];
}

// --- Petits wrappers tolérants : l'API StoryKit arrive en parallèle (Fondation) ---
function kainatiFlag(scene, key, def) {
  if (typeof storyGet === 'function') return storyGet(key, def);
  const v = scene.registry.get(key);
  return v === undefined ? def : v;
}

function kainatiSetFlag(scene, key, value) {
  if (typeof storySet === 'function') storySet(key, value);
  else scene.registry.set(key, value);
}

function kainatiToast(scene, text, ms = 2200) {
  if (typeof showToast === 'function') showToast(scene, text, ms);
}

function kainatiFrozen(scene) {
  return typeof isWorldFrozen === 'function' ? isWorldFrozen(scene) : scene.scene.isActive('CampfireMenuScene');
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

// Barre de boss : celle de StoryKit, sinon une barre minimale locale.
function kainatiShowBar(scene, st) {
  const ratio = () => (st.boss ? st.boss.hp / st.boss.maxHp : 0);
  if (typeof showBossBar === 'function') { showBossBar(scene, 'Kainati, Roi des Simiens', ratio); return; }
  if (st.bar) return;
  const g = scene.add.graphics().setScrollFactor(0).setDepth(1500);
  const label = scene.add.text(480, 18, 'Kainati, Roi des Simiens', {
    fontFamily: 'sans-serif', fontSize: '16px', color: '#ffe9f5', stroke: '#2a1f45', strokeThickness: 4,
  }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(1501);
  st.bar = { g, label, ratio };
}

function kainatiDrawBar(st) {
  if (!st.bar) return;
  const { g, ratio } = st.bar;
  g.clear();
  g.fillStyle(0x120c1e, 0.85).fillRect(300, 40, 360, 12);
  g.fillStyle(0xc0503a, 1).fillRect(302, 42, 356 * Phaser.Math.Clamp(ratio(), 0, 1), 8);
}

function kainatiHideBar(scene, st) {
  if (typeof hideBossBar === 'function') hideBossBar(scene);
  if (st.bar) { st.bar.g.destroy(); st.bar.label.destroy(); st.bar = null; }
}

// --- Rideaux de mousse (bords de l'arène) ---
function kainatiMakeCurtain(scene, x, floorY) {
  const c = scene.add.container(x, 0).setDepth(4);
  c.add(scene.add.rectangle(0, floorY / 2, 44, floorY + 40, 0x2f4a22, 0.92).setStrokeStyle(3, 0x1a2a12));
  for (let y = 20; y < floorY; y += 46) {
    c.add(scene.add.circle(Phaser.Math.Between(-16, 16), y, Phaser.Math.Between(10, 16), 0x587a32, 0.95));
    c.add(scene.add.circle(Phaser.Math.Between(-12, 12), y + 22, Phaser.Math.Between(5, 9), 0x8fb04a, 0.9));
  }
  const zone = scene.add.zone(x, floorY / 2 - 200, 40, floorY + 400);
  scene.physics.add.existing(zone, true);
  scene.physics.add.collider(scene.player, zone);
  return { visual: c, zone };
}

function kainatiSetCurtain(scene, curtain, closed, instant = false) {
  if (!curtain) return;
  curtain.zone.body.enable = closed;
  scene.tweens.killTweensOf(curtain.visual);
  if (instant) { curtain.visual.setAlpha(closed ? 1 : 0).setVisible(closed); return; }
  curtain.visual.setVisible(true);
  scene.tweens.add({
    targets: curtain.visual,
    alpha: closed ? 1 : 0,
    duration: closed ? 350 : 900,
    onComplete: () => curtain.visual.setVisible(closed),
  });
}

// --- Lianes (décor : Kainati s'y suspend) : celles de Liane.js si elles
// existent, sinon un dessin local ---
function kainatiSetupVines(scene, st) {
  st.vineDefs = st.cfgVines.map((v) => ({ ...v, cooldown: 0, visual: null }));
  const formesVines = Array.isArray(scene.vines) && scene.vines.length > 0;
  if (formesVines) return;
  for (const v of st.vineDefs) {
    const c = scene.add.container(v.x, v.y).setDepth(3);
    c.add(scene.add.rectangle(0, 0, 7, v.length, 0x4c6b2a).setOrigin(0.5, 0).setStrokeStyle(2, 0x23331a));
    for (let y = 30; y < v.length; y += 42) {
      c.add(scene.add.ellipse((y / 42) % 2 ? 7 : -7, y, 14, 7, 0x6f9a3a));
    }
    c.add(scene.add.circle(0, v.length, 7, 0x8fb04a).setStrokeStyle(2, 0x23331a));
    v.visual = c;
  }
}

// Indices du combat (une fois chacun par combat, remis à zéro avec lui).
function kainatiUpdateHints(scene, st) {
  const boss = st.boss;
  if (!st.fightActive || !boss || boss.defeated) return;
  if (boss.state === 'stunned' && !st.toldStun) {
    st.toldStun = true;
    kainatiToast(scene, 'Kainati est sonné au sol : frappe-le !');
  } else if (boss.lastDodge != null && boss.lastDodge !== st.seenDodge) {
    st.seenDodge = boss.lastDodge;
    if (!st.toldDodge && boss.state !== 'stunned') {
      st.toldDodge = true;
      kainatiToast(scene, "Il esquive là-haut… Attends qu'il plonge et retombe au sol.");
    }
  }
}

// Coups du joueur : Kainati n'est pas dans scene.enemies (pas de corps
// Arcade), on teste donc nous-mêmes mêlée / piqué / compétence, une fois par attaque.
function kainatiCheckPlayerHits(scene, st, time) {
  const p = scene.player;
  const boss = st.boss;
  if (!boss || !st.fightActive || boss.defeated) return;
  const rect = boss.getHitRect();
  const atk = p.getAttackHitbox ? p.getAttackHitbox() : null;
  if (atk && Phaser.Geom.Intersects.RectangleToRectangle(atk, rect)) {
    const id = p.eagleDiving ? `dive-${Math.floor(time / 500)}` : `atk-${p.attackEndTime}`;
    if (id !== st.lastAttackId) {
      st.lastAttackId = id;
      if (boss.takeHit({ type: 'attack' }) && typeof ENERGY_PER_HIT !== 'undefined' && p.gainEnergy) p.gainEnergy(ENERGY_PER_HIT);
    }
  }
  const sk = p.getSkillHitbox ? p.getSkillHitbox() : null;
  if (sk && sk !== st.lastSkillRect && Phaser.Geom.Intersects.RectangleToRectangle(sk, rect)) {
    st.lastSkillRect = sk;
    boss.takeHit({ type: 'skill' });
  }
}

// --- Déroulé ---
async function kainatiStartFight(scene, st) {
  st.starting = true;
  kainatiSetCurtain(scene, st.leftCurtain, true);
  const cam = scene.cameras.main;
  cam.setBounds(st.cfg.minX, 0, st.cfg.maxX - st.cfg.minX, scene.scale.height);
  if (!kainatiFlag(scene, 'kainatiIntroSeen', false)) {
    await kainatiPlay(scene, 'kainati_intro');
    kainatiSetFlag(scene, 'kainatiIntroSeen', true);
  }
  if (st.disposed || scene !== st.scene) return;
  kainatiShowBar(scene, st);
  st.boss.start();
  st.fightActive = true;
  st.starting = false;
  st.toldStun = false;
  st.toldDodge = false;
  kainatiToast(scene, "Esquive ses pierres. Quand il plonge, saute l'onde de choc… puis frappe !", 3200);
}

// Mort d'Agarica (ou sortie forcée) : tout revient à l'état d'avant combat.
function kainatiResetFight(scene, st) {
  st.fightActive = false;
  st.starting = false;
  st.boss.reset();
  kainatiHideBar(scene, st);
  kainatiSetCurtain(scene, st.leftCurtain, false, true);
  scene.cameras.main.setBounds(st.camBounds.x, st.camBounds.y, st.camBounds.width, st.camBounds.height);
}

function kainatiRevealPassage(scene, st, instant) {
  kainatiSetCurtain(scene, st.leftCurtain, false, instant);
  kainatiSetCurtain(scene, st.rightCurtain, false, instant);
  scene.cameras.main.setBounds(st.camBounds.x, st.camBounds.y, st.camBounds.width, st.camBounds.height);
  if (st.passageRevealed) return;
  st.passageRevealed = true;
  scene.__exits = scene.__exits || [];
  for (const exit of st.cfg.exitsAfterVictory || []) {
    scene.__exits.push(exit);
    if (exit.targetScene === 'MondeSpirituelScene') {
      // Ouverture lumineuse dans l'écorce : le passage vers le totem du singe.
      const h = exit.height || 110;
      const glow = scene.add.ellipse(exit.x, exit.y, 70, h, 0xbfe8a0, 0.35).setDepth(2);
      const core = scene.add.ellipse(exit.x, exit.y, 44, h - 20, 0x1a1428, 0.9).setDepth(2);
      scene.tweens.add({ targets: glow, alpha: 0.7, duration: 900, yoyo: true, repeat: -1 });
      if (!instant) {
        [glow, core].forEach((o) => o.setScale(0.1));
        scene.tweens.add({ targets: [glow, core], scale: 1, duration: 900, ease: 'Back.Out' });
      }
    }
  }
}

async function kainatiVictory(scene, st) {
  st.fightActive = false;
  kainatiHideBar(scene, st);
  kainatiSetFlag(scene, 'kainatiDefeated', true);
  st.boss.setMossLevel(0.3, 1500); // la mousse se retire (en partie)
  await kainatiDelay(scene, 1300);
  if (st.disposed) return;
  await kainatiPlay(scene, 'kainati_victoire');
  if (st.disposed) return;
  kainatiRevealPassage(scene, st, false);
  st.boss.makeCalm(st.boss.feet.x);
  kainatiToast(scene, 'Un passage vers le totem du singe s\'est ouvert dans l\'écorce.', 3000);
}

ZONE_SCRIPTS.kainati_arene = {
  create(scene, levelData) {
    const data = levelData || scene.levelData || scene.__levelData || GRAND_ARBRE_ARENE_DATA;
    const cfg = {
      minX: 512, maxX: 1472, floorY: 448, lockX: 600, startVine: 1, calmX: 1390, exitsAfterVictory: [],
      ...(data.kainatiArena || {}),
    };
    const cfgVines = (data.vines && data.vines.length) ? data.vines : [{ x: cfg.minX + 240, y: -30, length: 280 }, { x: cfg.maxX - 240, y: -30, length: 280 }];
    const cam = scene.cameras.main;
    const b = cam.getBounds();
    const st = {
      scene, cfg, cfgVines, vineDefs: null, fightActive: false, starting: false, disposed: false,
      dying: false, passageRevealed: false,
      camBounds: { x: b.x, y: b.y, width: b.width, height: b.height },
    };
    if (scene.__kainati) scene.__kainati.disposed = true;
    scene.__kainati = st;

    st.boss = new KainatiBoss(scene, {
      vines: cfgVines, startVine: Phaser.Math.Clamp(cfg.startVine, 0, cfgVines.length - 1),
      minX: cfg.minX, maxX: cfg.maxX, floorY: cfg.floorY, ceilingY: 0,
    });
    scene.kainati = st.boss; // accès debug
    // PNJ « kainati » pour les étapes npcAnim/npcFace/npcMove de runCutscene.
    scene.npcs = scene.npcs || {};
    scene.npcs.kainati = st.boss.sprite;
    st.leftCurtain = kainatiMakeCurtain(scene, cfg.minX, cfg.floorY);
    st.rightCurtain = kainatiMakeCurtain(scene, cfg.maxX, cfg.floorY);
    kainatiSetCurtain(scene, st.leftCurtain, false, true);

    if (kainatiFlag(scene, 'kainatiDefeated', false)) {
      st.boss.makeCalm(cfg.calmX);
      st.boss.setMossLevel(0.3, 0);
      kainatiRevealPassage(scene, st, true);
    }

    // Parler à Kainati apaisé (événement clavier : ne consomme pas le JustDown de Player).
    st.talkPrompt = scene.add.text(0, 0, 'E : parler', {
      fontFamily: 'sans-serif', fontSize: '14px', color: '#ffe9f5', backgroundColor: '#2a1f45', padding: { x: 6, y: 3 },
    }).setOrigin(0.5, 1).setDepth(1200).setVisible(false);
    st.onKeyE = () => {
      if (st.disposed || !st.boss.calm || !st.talkPrompt.visible || st.talking || kainatiFrozen(scene)) return;
      st.talking = true;
      kainatiPlay(scene, 'kainati_calme').then(() => { st.talking = false; });
    };
    scene.input.keyboard.on('keydown-E', st.onKeyE);
    // Le dernier cœur perdu gèle le monde le temps de la pose `death`
    // (Player.hitByEnemy, ~1,1 s) puis recharge les cœurs : update() (coupé
    // pendant le gel) ne voyait jamais `hearts <= 0`. On écoute le registre.
    st.onHearts = (parent, value) => { if (!st.disposed && value <= 0) st.dying = true; };
    scene.registry.events.on('changedata-hearts', st.onHearts);
    // Signal direct de Player.hitByEnemy (couvre aussi le 1er `set` du
    // registre, qui n'émet pas 'changedata-hearts').
    st.onDepleted = () => { if (!st.disposed) st.dying = true; };
    scene.events.on('player-depleted', st.onDepleted);
    scene.events.once('shutdown', () => {
      st.disposed = true;
      scene.registry.events.off('changedata-hearts', st.onHearts);
      scene.events.off('player-depleted', st.onDepleted);
      scene.input.keyboard.off('keydown-E', st.onKeyE);
      kainatiHideBar(scene, st);
    });
  },

  update(scene, time, delta) {
    const st = scene.__kainati;
    if (!st || st.disposed || !scene.player) return;
    if (typeof currentLevelScene !== 'undefined' && scene !== currentLevelScene) return;
    if (kainatiFrozen(scene)) return;
    const p = scene.player;
    const dt = Math.min(delta, 50);
    // Lianes résolues à la 1re frame : les handlers de données (Liane.js) ont tous tourné.
    if (!st.vineDefs) kainatiSetupVines(scene, st);

    const defeated = kainatiFlag(scene, 'kainatiDefeated', false);

    // Mort du joueur (cœurs à 0, puis rechargés au point d'entrée) : reset propre.
    if (p.hearts <= 0) st.dying = true;
    else if (st.dying) {
      st.dying = false;
      if (st.fightActive || st.starting) kainatiResetFight(scene, st);
    }

    if (!defeated && !st.fightActive && !st.starting && !st.dying && p.x > st.cfg.lockX && p.x < st.cfg.maxX) {
      kainatiStartFight(scene, st);
    }

    st.boss.update(dt, p);
    kainatiCheckPlayerHits(scene, st, time);
    kainatiUpdateHints(scene, st);
    kainatiDrawBar(st);
    if (st.fightActive && st.boss.defeated) kainatiVictory(scene, st);

    // Invite « E : parler » près de Kainati apaisé.
    const near = st.boss.calm && Math.abs(p.x - st.boss.feet.x) < KAINATI_TALK_RANGE && Math.abs(p.y - st.boss.feet.y) < 120;
    st.talkPrompt.setVisible(near && !st.talking);
    if (near) st.talkPrompt.setPosition(st.boss.feet.x, st.boss.feet.y - st.boss.h - 10);
  },
};
