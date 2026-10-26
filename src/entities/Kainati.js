// Kainati, Roi des Simiens — boss du grand arbre (zone grand_arbre_arene) +
// ses dangers (pierres lancées, onde de choc, vague de mousse, éboulement,
// pierres du plafond) + l'esprit simien ancestral (PNJ du monde spirituel).
// La logique de zone (rideaux, intro, victoire, mort d'Agarica, flags) vit
// dans src/story/boss_kainati.js (ZONE_SCRIPTS.kainati_arene).
//
// REFONTE (demande utilisateur 2026-10-24) : Kainati reste AU SOL, ne monte
// jamais sur les lianes. Agarica arrive avec la forme singe (obtenue dans le
// monde spirituel) : ses grandes attaques couvrent TOUT le sol de l'arène et
// ne s'esquivent qu'accrochée aux lianes (2 lianes depuis le 2026-10-25, cf.
// la donnée de zone et KAINATI_TIMINGS).
// - Charge au sol d'un bout à l'autre de l'arène → il heurte le rideau,
//   rebondit de 200 px vers le centre et reste SONNÉ ~3 s (coups doublés),
//   puis retourne au trot à son poste. Esquive : une liane (pas de saut
//   par-dessus : il est trop haut à quatre pattes, la fenêtre faisait ~130 ms).
// - Jets de pierres en cloche, visés sur Agarica (même sur sa liane).
// - Pleine largeur, télégraphiées 0,8-1 s (pose + bande au sol + « ! ») :
//   onde de choc (slam), vague de mousse (roar), éboulement (sweep : il roule
//   son rocher, des pierres tombent de la canopée devant lui et roulent
//   derrière). Toutes ne blessent qu'au ras du sol : suspendue, on est à l'abri.
// - Une seule blessure par grande attaque : touchée sur sa liane (pierre de
//   la canopée), Agarica décroche ; les dangers au sol l'épargnent alors le
//   temps de se raccrocher (KAINATI_FLOOR_GRACE).
// - Frappable À TOUT MOMENT (1 PV, courte invulnérabilité), sonné : 2 PV et
//   invulnérabilité plus courte. Son contact blesse (sauf sonné ou battu).
// - Battu : épargné, inerte (pose assise `defeated_lucid`, dernière frame).
//
// Pas de corps Arcade : sa position est calculée, ses dégâts testés à la
// main (rectangles tirés de ses PIXELS VISIBLES). Minuteries en `delta`
// cumulé : tout se fige quand le monde est gelé (dialogue, menus).
// Poses STABLES : une anim par état (jamais d'alternance de poses), il ne se
// retourne qu'entre deux actions ; télégraphes = teinte qui respire (pas de
// clignotement), « ! », bande au sol.
//
// Taille (calibrage visuel, mesuré le 2026-10-24 avec PIL) : `kainati` et
// `kainati_sol` sont dessinés à la MÊME échelle (peinture rouge de la joue :
// 19-21 px de haut sur kainati.png, kainati_p3/p4, kainati_sol p1/p2/p3 ;
// surface visible √px 245-283 selon la pose) → même échelle 0,6, aucune
// compensation. Les futures feuilles (`kainati_calme`, PROMPT_CODEX_9) sont
// recalées par surface visible sur la pose assise équivalente (cf.
// kainatiSourceScale) : il ne change pas de taille en changeant de pose.
//
// ─── API KainatiEsprit (PNJ éthéré du monde spirituel, acte1_arbre.js) ───
//   const esprit = new KainatiEsprit(scene, x, y, { vine?, facing? });
//     x,y = pieds au sol (ignorés si `vine` est donné : il s'y suspend).
//   esprit.hangOn(vine) / esprit.standAt(x, y)
//   esprit.swingTo(target, ms=900) → Promise   vers une liane {x,y,length} ou un point {x,y}
//   esprit.waitForPlayer(radius=180) → Promise
//   esprit.guide(path, {radius, pauseMs}) → Promise  « suis mes mouvements »
//   esprit.bless(ms=1400) → Promise    pose qui donne la forme (art futur
//                                      `kainati_esprit_extra` give, sinon lueur)
//   esprit.sprite, esprit.destroy()
// Se met à jour tout seul (écoute 'update' de la scène, retiré au shutdown).

const KAINATI_ID = 'kainati';
const KAINATI_SOL_ID = 'kainati_sol';
// Feuille future (PROMPT_CODEX_9_KAINATI.md) : Kainati apaisé assis.
const KAINATI_CALME_ID = 'kainati_calme';
// Taille écran si le manifest n'a pas d'entrée (≈ placeholder du manifest).
const KAINATI_DISPLAY = { w: 195, h: 210 };
const KAINATI_STONE_GRAVITY = 900;
const KAINATI_STONE_RADIUS = 12;
// Personnages à CHARACTER_DEPTH (LevelKit) ; effets juste au-dessus ; « ! »,
// étoiles et invites encore au-dessus.
const KAINATI_DEPTH = CHARACTER_DEPTH;
const KAINATI_FX_DEPTH = CHARACTER_DEPTH + 1;
const KAINATI_UI_DEPTH = CHARACTER_DEPTH + 3;
// Nappe de mousse et bande d'alerte au sol : juste SOUS les personnages
// (rien n'est dessiné sur Kainati -- demande utilisateur, pas de mousse
// plaquée sur lui), au-dessus du sol.
const KAINATI_GROUND_FX_DEPTH = CHARACTER_DEPTH - 1;
// Bande d'alerte peinte (fx_lueur_sol) : largeur visée d'une lueur et hauteur
// affichée (l'image, très étirée, ne montre que son cœur lumineux).
const KAINATI_WARN_GLOW_W = 190;
const KAINATI_WARN_GLOW_H = 70;
// « ! » des télégraphes (art `ui_alerte`) : hauteur à l'écran. Playtest : à
// l'échelle du manifeste (26 px), on le voyait à peine ; 36 px (≈ 0,14).
const KAINATI_ALERT_H = 36;

// PV : frappable à tout moment (1 PV), sonné 2 PV par coup. ~1 min 30 pour
// une joueuse correcte. Depuis que la fenêtre « sonné » est atteignable
// (rebond, 3,2 s) et qu'aucun coup n'est perdu, 30 PV tombaient en ~45 s au
// bot « humain » (réflexe 300 ms, sans sprint) : 48 (~1 min 20 pour ce bot ;
// jeu-cadeau : pas plus long, un réflexe plus lent doit pouvoir gagner).
const KAINATI_MAX_HP = 48;
const KAINATI_PHASE2_RATIO = 0.5;
const KAINATI_STUN_DAMAGE = 2;
// Sous la cadence d'attaque d'Agarica (~300 ms) : à 380 ms, un coup sur deux
// tombait dans l'invulnérabilité à cadence rapide (revue « ressenti »).
const KAINATI_HIT_INVULN = 260;
const KAINATI_STUN_HIT_INVULN = 220;
// Phase 2 (enragé) : légère teinte rouge, constante (pas de clignotement).
const KAINATI_PHASE2_TINT = 0xffd4d4;

// Durées (ms) et vitesses par phase. `stun` : assez long pour qu'Agarica,
// sur la liane la plus éloignée, lâche, coure (ou sprinte) jusqu'à lui et
// place quelques coups doublés (à 2,3 s, il était déjà relevé à son arrivée).
// `chargeWind` : la charge ne s'esquive que sur une liane (pas de saut
// par-dessus).
// Télégraphes (`fullWind`, `chargeWind`) recalculés pour 2 lianes (demande
// utilisateur du 2026-10-25 : « ne met que 2 lianes ») : depuis N'IMPORTE OÙ
// dans l'arène, une joueuse qui réagit en 450 ms et MARCHE (sans sprint)
// jusqu'à la liane la plus proche doit y être accrochée avant que le danger
// ne l'atteigne. Lianes en 792 / 1192 : au plus ~200-245 px à parcourir
// (bot de revue « humain » : ~1,1 s après son réflexe pour 200 px, saut et
// prise compris) ; pire cas = le milieu de l'arène, pour toutes les attaques
// (dangers qui partent de ses mains : onde, vague, rocher, charge). Avec 4
// lianes, 0,8-1 s suffisaient. Phase 2 un peu plus vive (repos, pierres,
// pierre de la canopée), télégraphes à peine plus courts : avant, l'onde de
// choc était impossible à esquiver sans sprint depuis le rideau opposé.
const KAINATI_TIMINGS = {
  1: {
    idle: 950, throwWind: 650, throwRelease: 450, chargeWind: 1200, chargeSpeed: 620, stun: 3200, returnSpeed: 330,
    fullWind: 1250, recover: 550, quake: 1900, moss: 2300, rocks: 6, rockEvery: 230,
  },
  2: {
    idle: 650, throwWind: 550, throwRelease: 380, chargeWind: 1200, chargeSpeed: 700, stun: 2700, returnSpeed: 400,
    fullWind: 1200, recover: 420, quake: 2000, moss: 2400, rocks: 8, rockEvery: 200,
  },
};
// Rebond après le fracas contre le rideau (durée du recul, ms) ; la distance
// vient de la donnée de zone (`kainatiArena.recoil`, 200 px) : sonné plus près
// du centre, il est à portée d'une Agarica qui lâche sa liane. Relevé, il
// retourne au trot à son poste (état 'return', sans contact) : ses autres
// attaques partent toujours des postes, à l'écart des lianes (à sa place du
// rebond, entre deux lianes, une Agarica qui y courait se jetait contre lui).
const KAINATI_RECOIL_MS = 260;
// Touchée sur sa liane (elle en décroche, Player.hitByEnemy) : les dangers au
// sol de l'attaque en cours ne la blessent plus, et aucun pendant ce délai
// (ms), le temps de se raccrocher. Sinon elle perdait un 2e cœur ~1 s plus
// tard, à la fin de son invulnérabilité, en retombant sur un sol encore actif.
const KAINATI_FLOOR_GRACE = 2200;
// Séquences en boucle (lisibles : on apprend son rythme). Chaque charge finit
// contre un rideau (sonné) ; une attaque pleine largeur toutes les ~8 s.
const KAINATI_PATTERN = {
  1: ['throw', 'slam', 'charge', 'throw', 'roar', 'charge', 'throw', 'sweep', 'charge'],
  // Phase 2 : chaque grande attaque enchaîne sur une charge (on reste sur la
  // liane, une pierre tombe de la canopée) ; les salves viennent sol dégagé.
  2: ['slam', 'charge', 'throw', 'sweep', 'charge', 'throw', 'roar', 'charge', 'throw'],
};
// Hauteurs dangereuses au-dessus du sol (px) : toutes sous les pieds
// d'Agarica suspendue (liane de 170 px sous la canopée : pieds ≥ 156 px
// au-dessus du sol), toutes au-dessus d'un saut ordinaire en durée. Les
// pierres de l'éboulement ne blessent, elles aussi, qu'une fois dans cette
// bande (pas pendant leur chute depuis la canopée).
const KAINATI_QUAKE_H = 58;
const KAINATI_MOSS_H = 60;
// Front de l'onde (px/s). 1150 avant les 2 lianes : au milieu de l'arène,
// à ~200 px de chaque liane, elle arrivait 360 ms après le coup -- trop tôt
// pour une joueuse qui marche (réflexe 450 ms). 800 : même ordre que la vague.
const KAINATI_QUAKE_SPEED = 800;
const KAINATI_MOSS_SPEED = 640;   // front de la vague (px/s)
const KAINATI_ROLL_SPEED = [540, 620];
const KAINATI_BOULDER_D = 88;     // diamètre du rocher qu'il tient (mesuré sur sweep r3_2)
// Contact (ce qui blesse Agarica) et zone qui encaisse, en fractions de la
// boîte des pixels visibles de la pose courante.
const KAINATI_CONTACT = { w: 0.58, h: 0.7 };
const KAINATI_HITBOX = { w: 0.86, h: 0.92 };
// Hauteur max du contact au-dessus du sol (px) : sous les pieds d'Agarica
// suspendue en bas d'une liane (≥ 156 px). Ses poses dressées (cri, onde de
// choc : 265 px de haut) montaient sinon jusqu'à 189 px : sous une liane, il
// l'aurait blessée là-haut, où rien d'autre ne l'atteint.
const KAINATI_CONTACT_MAX_H = 140;
// Ne se retourne vers Agarica (au repos) que si elle est nettement de l'autre
// côté, et pas plus d'une fois par KAINATI_TURN_MS.
const KAINATI_TURN_DEADZONE = 60;
const KAINATI_TURN_MS = 700;
// Fin d'étourdissement : délai avant que son contact blesse à nouveau (ms).
const KAINATI_RISE_GRACE = 500;
// Après ce délai, si Agarica est encore DANS son contact (coincée entre lui et
// le rideau en le suivant jusqu'à son poste, ou collée à lui), le contact ne
// se réarme qu'une fois qu'elle en est sortie -- au plus tard KAINATI_UNPIN_MS
// plus tard (pas d'abri permanent dans son corps). Sinon elle reprenait un
// coup toutes les ~1 s, coincée contre le rideau.
const KAINATI_UNPIN_MS = 1200;
// Retour au poste avec Agarica dans son dos : il s'arrête à cette distance
// devant elle (demi-largeur de son contact ~60 px + marge), cf. 'return'.
const KAINATI_RETURN_GAP = 120;

// ---------------------------------------------------------------------------
// Poses : une anim par état. `src` = sources par ordre de préférence
// [id du manifest, anim, frames?] (la première dont l'art existe). Sans art
// du tout : placeholder du manifest. Anims jouées une fois : la dernière
// frame reste affichée (pose tenue).
// ---------------------------------------------------------------------------
const KAINATI_POSES = {
  // Boucle stable (playtest) : la frame 3 de l'idle (posture basse, tête de
  // profil) suivie de la 0 (tête de trois quarts) faisait se retourner sa tête
  // à chaque tour. Aller-retour 0-1-2-1 : jamais deux frames éloignées à la suite.
  idle: { src: [[KAINATI_ID, 'idle', [0, 1, 2, 1]]], fps: 5, loop: true },
  throwWind: { src: [[KAINATI_ID, 'throw_stone', [0, 1]]], fps: 6 },
  throwRelease: { src: [[KAINATI_ID, 'throw_stone', [2, 3]]], fps: 10 },
  chargeWind: { src: [[KAINATI_SOL_ID, 'charge', [0]], [KAINATI_ID, 'idle', [3]]] },
  charge: { src: [[KAINATI_SOL_ID, 'charge'], [KAINATI_ID, 'idle']], fps: 12, loop: true },
  stunned: { src: [[KAINATI_SOL_ID, 'stunned'], [KAINATI_ID, 'hit', [2]]], fps: 5, loop: true },
  // Retour au poste après l'étourdissement : la course à quatre pattes, au trot.
  trot: { src: [[KAINATI_SOL_ID, 'charge'], [KAINATI_ID, 'idle']], fps: 7, loop: true },
  roarWind: { src: [[KAINATI_SOL_ID, 'roar', [0, 1, 2]], [KAINATI_ID, 'land_stomp', [2]]], fps: 7 },
  roarEnd: { src: [[KAINATI_SOL_ID, 'roar', [3]], [KAINATI_ID, 'idle', [0]]] },
  slamWind: { src: [[KAINATI_SOL_ID, 'slam', [0]], [KAINATI_ID, 'land_stomp', [0]]] },
  slamHit: { src: [[KAINATI_SOL_ID, 'slam', [1, 2]], [KAINATI_ID, 'land_stomp', [1]]], fps: 14 },
  slamEnd: { src: [[KAINATI_SOL_ID, 'slam', [3]], [KAINATI_ID, 'land_stomp', [3]]] },
  sweepWind: { src: [[KAINATI_SOL_ID, 'sweep', [0, 1]], [KAINATI_ID, 'throw_stone', [0, 1]]], fps: 5 },
  sweepThrow: { src: [[KAINATI_SOL_ID, 'sweep', [2, 3]], [KAINATI_ID, 'throw_stone', [2, 3]]], fps: 9 },
  defeated: { src: [[KAINATI_ID, 'defeated_lucid']], fps: 4 },
  calm: { src: [[KAINATI_CALME_ID, 'sit_idle'], [KAINATI_ID, 'defeated_lucid', [3]]], fps: 5, loop: true },
  talk: { src: [[KAINATI_CALME_ID, 'sit_talk'], [KAINATI_ID, 'defeated_lucid', [3]]], fps: 7, loop: true },
};

// ---------------------------------------------------------------------------
// Helpers visuels
// ---------------------------------------------------------------------------
function kainatiManifestDef(id) {
  return (typeof getAssetManifest === 'function' ? getAssetManifest() : {})[id];
}

function kainatiBodySize(id) {
  const ph = (kainatiManifestDef(id) || {}).placeholder;
  return ph && ph.w && ph.h ? { w: ph.w, h: ph.h } : KAINATI_DISPLAY;
}

// Art « facing: right » (manifest) : flipX quand il regarde à gauche.
function kainatiFlipFor(id, lookRight) {
  const def = kainatiManifestDef(id);
  const artFacesRight = !def || def.facing !== 'left';
  return artFacesRight ? !lookRight : lookRight;
}

// Sprite manifest ; sans entrée au manifest, addManifestSprite donnerait un
// carré générique 40 px : on le remplace par un placeholder à la bonne taille.
function addKainatiSprite(scene, x, y, id, color, label) {
  const sprite = addManifestSprite(scene, x, y, id, 'idle');
  if (!kainatiManifestDef(id)) {
    const key = ensurePlaceholderTexture(scene, `ph-local-${id}`,
      { w: KAINATI_DISPLAY.w, h: KAINATI_DISPLAY.h, color, label }, 1);
    sprite.setTexture(key).setScale(1);
  }
  return sprite;
}

// Clés des frames présentes d'une anim (sous-ensemble `sub` d'indices).
function kainatiFrameKeys(scene, id, anim, sub) {
  const a = ((kainatiManifestDef(id) || {}).anims || {})[anim];
  if (!a) return [];
  const idx = sub || Array.from({ length: a.frames }, (_, i) => i);
  return idx.map((i) => manifestFrameKey(id, anim, i)).filter((k) => scene.textures.exists(k));
}

// Source retenue pour une pose : { id, anim, keys } (ou placeholder).
function kainatiPoseSource(scene, name) {
  const def = KAINATI_POSES[name];
  for (const [id, anim, sub] of def.src) {
    const keys = kainatiFrameKeys(scene, id, anim, sub);
    // Pose partielle (une frame manque) : on prend la suivante plutôt qu'une
    // anim à trous.
    if (keys.length && (!sub || keys.length === sub.length)) return { id, anim, keys };
  }
  const ph = typeof manifestPlaceholderKey === 'function' ? manifestPlaceholderKey(scene, KAINATI_ID)
    : ensurePlaceholderTexture(scene, 'ph-local-kainati', { ...KAINATI_DISPLAY, color: 0x8a5a2b, label: 'KAINATI' }, 1);
  return { id: KAINATI_ID, anim: 'idle', keys: [ph], placeholder: true };
}

// Anim Phaser de la pose (créée une fois : le gestionnaire d'anims est global).
function kainatiPoseAnim(scene, name) {
  const key = `kainati-pose-${name}`;
  const src = kainatiPoseSource(scene, name);
  if (!scene.anims.exists(key)) {
    const def = KAINATI_POSES[name];
    scene.anims.create({ key, frames: src.keys.map((k) => ({ key: k })), frameRate: def.fps || 6, repeat: def.loop ? -1 : 0 });
  }
  return { key, src };
}

// Échelle d'affichage d'une source : `kainati` et `kainati_sol` = celle du
// manifest (même échelle de dessin, mesurée, cf. en-tête) ; une feuille
// future (kainati_calme…) est recalée par surface visible sur la pose
// assise `defeated_lucid` (même posture) -- jamais plus grand ni plus petit.
const KAINATI_SCALE_CACHE = new Map();
function kainatiSourceScale(scene, id, anim) {
  const base = (kainatiManifestDef(KAINATI_ID) || {}).scale || 1;
  if (id === KAINATI_ID || id === KAINATI_SOL_ID) return (kainatiManifestDef(id) || {}).scale || base;
  const ck = `${id}|${anim}`;
  if (KAINATI_SCALE_CACHE.has(ck)) return KAINATI_SCALE_CACHE.get(ck);
  let s = (kainatiManifestDef(id) || {}).scale || base;
  const refKey = manifestFrameKey(KAINATI_ID, 'defeated_lucid', 3);
  if (typeof manifestSheetScale === 'function' && scene.textures.exists(refKey)) {
    const r = manifestSheetScale(scene, id, anim, { refKey, refScale: base, method: 'area' });
    if (r && r.scale) s = r.scale;
  }
  KAINATI_SCALE_CACHE.set(ck, s);
  return s;
}

function ensureKainatiStoneTexture(scene) {
  const key = 'kainati-pierre-ph';
  if (scene.textures.exists(key)) return key;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  const r = KAINATI_STONE_RADIUS;
  g.fillStyle(0x6d6a70, 1).fillCircle(r + 1, r + 1, r);
  g.fillStyle(0x9c98a0, 1).fillCircle(r - 3, r - 3, r * 0.45);
  g.lineStyle(2, 0x1e1a24, 1).strokeCircle(r + 1, r + 1, r);
  g.generateTexture(key, (r + 1) * 2, (r + 1) * 2);
  g.destroy();
  return key;
}

// Pierre (art `pierre`, sinon dessinée). Aussi utilisée par acte1_arbre.js
// (pierres des racines et de l'épreuve) : profondeur et taille de ces
// scripts gardées (sans `size`). `size` (px, plus grand côté visible) : les
// pierres du combat, à la taille de leur zone de dégâts.
function addKainatiStoneImage(scene, x, y, size = null) {
  const hasItem = typeof getItemManifest === 'function' && getItemManifest().pierre;
  const img = hasItem ? addItemImage(scene, x, y, 'pierre') : scene.add.image(x, y, ensureKainatiStoneTexture(scene));
  if (size) img.setScale(size / Math.max(img.width, img.height, 1));
  return img.setDepth(991);
}

// Pierres du combat (jets et canopée) : 2 × rayon de dégâts + 4 px (plan
// lot 8, §3.10) -- l'art à l'échelle du manifeste (41 px) et la pierre de la
// canopée (×0,26 : 66 px avec l'art, 7 px dessinée) ne disaient pas où elles
// blessent.
const KAINATI_STONE_SIZE = 2 * KAINATI_STONE_RADIUS + 4;

// Rocher roulant (art `rocher_roulant`, sinon la pierre dessinée agrandie)
// au diamètre `d` px (pixels visibles).
function addKainatiBoulderImage(scene, x, y, d) {
  const key = scene.textures.exists('item-rocher_roulant') ? 'item-rocher_roulant' : ensureKainatiStoneTexture(scene);
  const img = scene.add.image(x, y, key).setDepth(KAINATI_FX_DEPTH);
  const b = typeof visibleBounds === 'function' ? visibleBounds(scene, key) : null;
  const w = b && !b.empty ? Math.max(b.w, b.h) : img.width;
  return img.setScale(d / w);
}

// Éclats d'impact : vfx du manifest s'il existe, sinon quelques cailloux.
function spawnKainatiImpact(scene, x, y, scale = 1) {
  if (kainatiManifestDef('vfx_impact_pierre') && hasManifestArt(scene, 'vfx_impact_pierre')) {
    const fx = addManifestSprite(scene, x, y, 'vfx_impact_pierre', 'idle', { origin: [0.5, 0.75] });
    fx.setDepth(KAINATI_FX_DEPTH + 1).setScale(fx.scaleX * scale);
    fx.once('animationcomplete', () => fx.destroy());
    scene.time.delayedCall(1200, () => fx.active && fx.destroy());
    return;
  }
  for (let i = 0; i < 5; i++) {
    const bit = scene.add.circle(x, y - 4, Phaser.Math.Between(3, 5), 0x7d7880).setDepth(KAINATI_FX_DEPTH + 1);
    scene.tweens.add({
      targets: bit, x: x + Phaser.Math.Between(-36, 36), y: y - Phaser.Math.Between(10, 40), alpha: 0,
      duration: 380, ease: 'Quad.easeOut', onComplete: () => bit.destroy(),
    });
  }
}

function kainatiPlayerRect(player) {
  const b = player.body;
  return new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height);
}

function kainatiLerpColor(a, b, k) {
  const ca = Phaser.Display.Color.IntegerToColor(a);
  const cb = Phaser.Display.Color.IntegerToColor(b);
  const c = Phaser.Display.Color.Interpolate.ColorWithColor(ca, cb, 100, Math.round(k * 100));
  return Phaser.Display.Color.GetColor(c.r, c.g, c.b);
}

// ---------------------------------------------------------------------------
// Dangers. Chaque entrée de `list` : { kind, dead, img?, ... }. `kind`
// 'stone' (img) reste frappable / « pogo » (cf. Player.pogoTargetHit) ; les
// dangers au sol ('quake', 'moss', 'boulder') ne le sont pas.
// ---------------------------------------------------------------------------
class KainatiHazards {
  constructor(scene, arena) {
    this.scene = scene;
    this.arena = arena; // { minX, maxX, floorY, ceilingY }
    this.list = [];
    // Horloge en `delta` cumulé (gelée avec le monde) pour le répit au sol.
    this.clock = 0;
    // Numéro de la grande attaque en cours (posé par le boss) : chaque danger
    // le garde, pour la règle « une seule blessure par grande attaque ».
    this.serial = 0;
    this.graceSerial = -1;
    this.floorGraceUntil = 0;
  }

  push(h) {
    h.dead = false;
    if (h.serial == null) h.serial = this.serial;
    this.list.push(h);
    return h;
  }

  // Danger au sol qui épargne Agarica : elle vient d'être décrochée de sa
  // liane par un coup (cf. update, `hurt`).
  floorSpared(h) {
    return this.clock < this.floorGraceUntil || h.serial === this.graceSerial;
  }

  // Pierre en cloche de (sx, sy) qui passe par (tx, ty) au bout de `flight`
  // ms, puis continue sa chute jusqu'au sol (où elle éclate).
  throwStone(sx, sy, tx, ty, flight = 950) {
    const T = flight / 1000;
    const vx = (tx - sx) / T;
    const vy = (ty - sy - 0.5 * KAINATI_STONE_GRAVITY * T * T) / T;
    const img = addKainatiStoneImage(this.scene, sx, sy, KAINATI_STONE_SIZE).setDepth(KAINATI_FX_DEPTH);
    return this.push({ kind: 'stone', img, vx, vy, g: KAINATI_STONE_GRAVITY, spin: Phaser.Math.Between(-8, 8) });
  }

  // Bande d'alerte au ras du sol (toute la largeur) pendant `ms`. Playtest :
  // dessinée seule, elle partait presque invisible (14 px, alpha 0,12) au
  // moment où il faut réagir. Elle est vive dès la 1re image ; avec l'art
  // `fx_lueur_sol` (lueur blanche, teinte exacte), une rangée de lueurs de la
  // couleur de l'attaque, en ADD, qui respire sur tout le sol.
  warnBand(color, ms) {
    const sc = this.scene;
    const a = this.arena;
    const g = sc.add.graphics().setDepth(KAINATI_GROUND_FX_DEPTH);
    const glows = [];
    if (sc.textures.exists('item-fx_lueur_sol')) {
      const n = Math.max(1, Math.round((a.maxX - a.minX) / KAINATI_WARN_GLOW_W));
      const step = (a.maxX - a.minX) / n;
      for (let i = 0; i < n; i++) {
        const img = sc.add.image(a.minX + step * (i + 0.5), a.floorY + 6, 'item-fx_lueur_sol').setOrigin(0.5, 1)
          .setDisplaySize(step * 1.35, KAINATI_WARN_GLOW_H).setTint(color).setBlendMode(Phaser.BlendModes.ADD)
          .setAlpha(0).setDepth(KAINATI_GROUND_FX_DEPTH);
        img.__sx = img.scaleX;
        img.__sy = img.scaleY;
        glows.push(img);
      }
    }
    return this.push({ kind: 'warn', g, glows, color, ms, t: 0 });
  }

  // Onde de choc : un front part de x0 vers les deux rideaux ; derrière lui
  // le sol éclate en continu jusqu'à `ms` (toute la largeur).
  // `skip` : [x1, x2] où rien n'éclate à l'image (sous Kainati : pas d'éclats
  // plaqués sur lui) -- le danger, lui, couvre bien toute la largeur.
  quake(x0, ms, skip = null) {
    const a = this.arena;
    const cells = [];
    for (let x = a.minX + 40; x <= a.maxX - 40; x += 92) {
      if (skip && x > skip[0] && x < skip[1]) continue;
      cells.push({ x, next: (Math.abs(x - x0) / KAINATI_QUAKE_SPEED) * 1000 });
    }
    return this.push({ kind: 'quake', x0, ms, t: 0, cells });
  }

  // Vague de mousse : part de x0 vers le rideau `dir` et recouvre le sol
  // derrière elle ; reste `ms`, puis reflue (sans danger) en 450 ms.
  mossFlood(x0, dir, ms) {
    const g = this.scene.add.graphics().setDepth(KAINATI_GROUND_FX_DEPTH);
    let front = null;
    if (hasManifestArt(this.scene, 'vfx_vague_mousse')) {
      front = addManifestSprite(this.scene, x0, this.arena.floorY + 4, 'vfx_vague_mousse', 'idle');
      front.setDepth(KAINATI_GROUND_FX_DEPTH).setScale(front.scaleX * 1.9).setFlipX(dir < 0);
    }
    return this.push({ kind: 'moss', x0, dir, ms, t: 0, g, front, a: x0, b: x0, h: 0 });
  }

  // Rocher qui roule de x (posé au sol) vers `dir` ; `fromY` : tombe d'abord
  // de la canopée.
  // `serial` : grande attaque d'origine (pierres de l'éboulement créées après
  // coup, alors que le boss a pu passer à l'action suivante).
  // `behindUntilX` : dessiné juste DERRIÈRE Kainati (pierres qui tombent sur
  // lui) jusqu'à ce que le rocher ait dépassé ce x en roulant -- elles
  // dégringolent derrière son corps puis sortent devant lui.
  boulder(x, dir, d, { fromY = null, speed = null, serial = null, behindUntilX = null } = {}) {
    const a = this.arena;
    const r = d / 2;
    const img = addKainatiBoulderImage(this.scene, x, fromY ?? a.floorY - r, d);
    if (behindUntilX != null) img.setDepth(KAINATI_DEPTH - 0.5);
    const vx = dir * (speed || Phaser.Math.Between(KAINATI_ROLL_SPEED[0], KAINATI_ROLL_SPEED[1]));
    return this.push({ kind: 'boulder', img, r, dir, vx: fromY == null ? vx : 0, rollVx: vx, vy: 0, falling: fromY != null, serial, behindUntilX });
  }

  // Pierre du plafond au-dessus de x : poussière qui tombe de la canopée et
  // ombre au sol pendant `telegraph` ms, puis la pierre tombe. Art (plan lot 8,
  // §3.10) : ombre `fx_ombre_sol` et marqueur `fx_marqueur_danger` (anneau
  // rouge, ADD) qui grandissent ; repli : l'ellipse dessinée.
  ceilingRock(x, telegraph) {
    const sc = this.scene;
    const a = this.arena;
    let shadow;
    let marker = null;
    if (sc.textures.exists('item-fx_ombre_sol')) {
      shadow = sc.add.image(x, a.floorY - 2, 'item-fx_ombre_sol').setDisplaySize(18, 8).setAlpha(0.35).setDepth(KAINATI_FX_DEPTH);
    } else {
      shadow = sc.add.ellipse(x, a.floorY - 3, 20, 8, 0x12000c, 1).setAlpha(0.25).setDepth(KAINATI_FX_DEPTH);
    }
    if (sc.textures.exists('item-fx_marqueur_danger')) {
      marker = sc.add.image(x, a.floorY - 2, 'item-fx_marqueur_danger').setDisplaySize(40, 10)
        .setBlendMode(Phaser.BlendModes.ADD).setAlpha(0).setDepth(KAINATI_FX_DEPTH);
    }
    return this.push({ kind: 'ceil', x, t: 0, telegraph, shadow, marker, dustAt: 0 });
  }

  update(dt, player) {
    const s = dt / 1000;
    const a = this.arena;
    this.clock += dt;
    const pRect = player && player.body ? kainatiPlayerRect(player) : null;
    const attack = player && player.getAttackHitbox ? player.getAttackHitbox() : null;
    // Un coup reçu SUR la liane la fait décrocher (Player.hitByEnemy) : elle
    // retombe sur un sol peut-être encore dangereux. Une seule blessure par
    // grande attaque : les dangers au sol de cette attaque l'épargnent, et
    // tous pendant KAINATI_FLOOR_GRACE (le temps de se raccrocher).
    const hurt = (h) => {
      if (!player || !player.hitByEnemy) return;
      const onVine = !!player.vine;
      const before = player.hearts;
      player.hitByEnemy();
      if (onVine && player.hearts < before) {
        this.floorGraceUntil = this.clock + KAINATI_FLOOR_GRACE;
        this.graceSerial = h.serial;
      }
    };
    const added = [];
    for (const h of this.list) {
      if (h.dead) continue;
      switch (h.kind) {
        case 'stone': {
          h.vy += h.g * s;
          h.img.x += h.vx * s;
          h.img.y += h.vy * s;
          h.img.rotation += h.spin * s;
          const c = new Phaser.Geom.Circle(h.img.x, h.img.y, KAINATI_STONE_RADIUS);
          if (attack && Phaser.Geom.Intersects.CircleToRectangle(c, attack)) this.kill(h); // un coup de dague la brise
          else if (pRect && Phaser.Geom.Intersects.CircleToRectangle(c, pRect)) { hurt(h); this.kill(h); }
          else if (h.img.y >= a.floorY - KAINATI_STONE_RADIUS * 0.5 || h.img.x < a.minX - 60 || h.img.x > a.maxX + 60) this.kill(h);
          break;
        }
        case 'warn': {
          h.t += dt;
          const k = Math.min(1, h.t / h.ms);
          const pulse = 0.5 + 0.5 * Math.sin(h.t / 70);
          // Apparition franche (100 ms) : le préavis compte dès la 1re image.
          const on = Math.min(1, h.t / 100);
          // Lueur qui monte du sol sur toute la largeur (dégradé en 4
          // bandes), liseré vif qui pulse : « tout le sol va y passer ».
          // (Hauteur finale = celle du danger : on voit ce qui va être balayé.)
          const hh = 30 + (KAINATI_MOSS_H - 30) * k;
          h.g.clear();
          for (let i = 0; i < 4; i++) {
            h.g.fillStyle(h.color, on * (0.3 + 0.2 * k) * (0.7 + 0.3 * pulse) * (1 - i * 0.22));
            h.g.fillRect(a.minX, a.floorY - hh * (i + 1) / 4, a.maxX - a.minX, hh / 4);
          }
          h.g.fillStyle(h.color, on * (0.75 + 0.25 * pulse));
          h.g.fillRect(a.minX, a.floorY - 5, a.maxX - a.minX, 5);
          for (const img of h.glows) {
            // Lueurs : déjà nettes au départ (0,55), plus hautes vers la fin.
            img.setAlpha(on * (0.55 + 0.3 * k) * (0.8 + 0.2 * pulse));
            img.scaleY = img.__sy * (0.75 + 0.45 * k);
          }
          if (Math.random() < 0.35) {
            spawnFx(this.scene, 'dust', Phaser.Math.Between(a.minX + 20, a.maxX - 20), a.floorY - 2,
              { count: 1, angle: [250, 290], power: 0.5, tint: h.color });
          }
          if (h.t >= h.ms) {
            h.dead = true;
            h.g.destroy();
            for (const img of h.glows) img.destroy();
          }
          break;
        }
        case 'quake': {
          h.t += dt;
          const active = h.t < h.ms;
          for (const c of h.cells) {
            if (h.t < c.next || h.t > h.ms - 200) continue;
            c.next = h.t + Phaser.Math.Between(380, 520);
            this.erupt(c.x, c.x < h.x0 ? -1 : 1);
          }
          if (active && pRect && !this.floorSpared(h)) {
            const reach = (h.t / 1000) * KAINATI_QUAKE_SPEED;
            const zone = new Phaser.Geom.Rectangle(
              Math.max(a.minX, h.x0 - reach), a.floorY - KAINATI_QUAKE_H,
              Math.min(a.maxX, h.x0 + reach) - Math.max(a.minX, h.x0 - reach), KAINATI_QUAKE_H,
            );
            if (Phaser.Geom.Intersects.RectangleToRectangle(zone, pRect)) hurt(h);
          }
          if (h.t >= h.ms + 400) h.dead = true;
          break;
        }
        case 'moss': {
          h.t += dt;
          const far = h.dir > 0 ? a.maxX : a.minX;
          const front = h.x0 + h.dir * Math.min(Math.abs(far - h.x0), (h.t / 1000) * KAINATI_MOSS_SPEED);
          // Derrière lui aussi (jusqu'à son rideau) : pas d'abri dans son dos.
          const back = h.dir > 0 ? a.minX : a.maxX;
          h.a = Math.min(back, front);
          h.b = Math.max(back, front);
          const recede = h.t > h.ms ? Math.min(1, (h.t - h.ms) / 450) : 0;
          h.h = KAINATI_MOSS_H * Math.min(1, h.t / 160) * (1 - recede);
          this.drawMoss(h, front);
          if (h.t < h.ms && pRect && !this.floorSpared(h)) {
            const zone = new Phaser.Geom.Rectangle(h.a, a.floorY - KAINATI_MOSS_H, h.b - h.a, KAINATI_MOSS_H);
            if (Phaser.Geom.Intersects.RectangleToRectangle(zone, pRect)) hurt(h);
          }
          if (Math.random() < 0.3 && h.t < h.ms) {
            spawnFx(this.scene, 'bubble', Phaser.Math.Between(Math.round(h.a), Math.round(h.b)), a.floorY - h.h * 0.6, { count: 1 });
          }
          if (recede >= 1) {
            h.dead = true;
            h.g.destroy();
            if (h.front) h.front.destroy();
          }
          break;
        }
        case 'boulder': {
          if (h.falling) {
            h.vy += 1900 * s;
            h.img.y += h.vy * s;
            if (h.img.y >= a.floorY - h.r) {
              h.img.y = a.floorY - h.r;
              h.falling = false;
              h.vx = h.rollVx;
              h.vy = 0;
              spawnFx(this.scene, 'land', h.img.x, a.floorY, { power: 0.8 });
              juiceShake(this.scene, 'tiny');
            }
          } else {
            h.img.x += h.vx * s;
            h.img.rotation += (h.vx / h.r) * s;
            if (h.behindUntilX != null && (h.dir > 0 ? h.img.x - h.r > h.behindUntilX : h.img.x + h.r < h.behindUntilX)) {
              h.behindUntilX = null;
              h.img.setDepth(KAINATI_FX_DEPTH);
            }
            if (Math.random() < 0.25) spawnFx(this.scene, 'step', h.img.x - h.dir * h.r * 0.6, a.floorY, { dir: h.dir, power: 0.6 });
          }
          // Ne blesse qu'au ras du sol (bande de l'onde de choc), comme les
          // autres grandes attaques : pendant sa chute depuis la canopée, une
          // pierre ne touche pas Agarica suspendue à une liane voisine.
          const low = !h.falling || h.img.y + h.r > a.floorY - KAINATI_QUAKE_H;
          if (pRect && low && !this.floorSpared(h)
            && Phaser.Geom.Intersects.CircleToRectangle(new Phaser.Geom.Circle(h.img.x, h.img.y, h.r * 0.86), pRect)) hurt(h);
          const atWall = h.dir > 0 ? h.img.x + h.r >= a.maxX - 4 : h.img.x - h.r <= a.minX + 4;
          if (!h.falling && atWall) {
            spawnKainatiImpact(this.scene, h.img.x + h.dir * h.r * 0.5, a.floorY, h.r / 40);
            spawnFx(this.scene, 'wallHit', h.img.x + h.dir * h.r, h.img.y, { dir: h.dir });
            this.kill(h, false);
          }
          break;
        }
        case 'ceil': {
          h.t += dt;
          const k = Math.min(1, h.t / h.telegraph);
          if (h.shadow.type === 'Image') {
            // Ombre peinte : déjà sombre en son centre (alpha plus bas que l'ellipse unie).
            h.shadow.setDisplaySize(18 + 46 * k, 8 + 10 * k).setAlpha(0.35 + 0.45 * k);
          } else {
            h.shadow.setScale(1 + 2.2 * k, 1 + 1.4 * k).setAlpha(0.25 + 0.5 * k);
          }
          if (h.marker) {
            const pulse = 0.5 + 0.5 * Math.sin(h.t / 80);
            h.marker.setDisplaySize(40 + 100 * k, 10 + 14 * k).setAlpha(Math.min(1, h.t / 120) * (0.55 + 0.35 * pulse));
          }
          if (h.t >= h.dustAt) {
            h.dustAt = h.t + 110;
            spawnFx(this.scene, 'chip', h.x + Phaser.Math.Between(-10, 10), a.ceilingY + 70, { count: 1, angle: [80, 100], speed: [40, 120] });
          }
          if (h.t >= h.telegraph) {
            h.dead = true;
            h.shadow.destroy();
            if (h.marker) h.marker.destroy();
            const img = addKainatiStoneImage(this.scene, h.x, a.ceilingY + 66, KAINATI_STONE_SIZE).setDepth(KAINATI_FX_DEPTH);
            added.push({ kind: 'stone', img, vx: 0, vy: 120, g: 1700, spin: 5, dead: false, serial: h.serial, fromCeiling: true });
          }
          break;
        }
        default:
          break;
      }
    }
    if (added.length) this.list.push(...added);
    this.list = this.list.filter((h) => !h.dead);
  }

  // Éruption de l'onde de choc en x (art `vfx_onde_choc`, sinon dessinée).
  erupt(x, dir) {
    const sc = this.scene;
    const y = this.arena.floorY + 2;
    if (hasManifestArt(sc, 'vfx_onde_choc')) {
      const fx = addManifestSprite(sc, x, y, 'vfx_onde_choc', 'idle');
      fx.setDepth(KAINATI_FX_DEPTH).setScale(fx.scaleX * 1.35).setFlipX(dir < 0);
      fx.once('animationcomplete', () => fx.destroy());
      sc.time.delayedCall(900, () => fx.active && fx.destroy());
    } else {
      const e = sc.add.ellipse(x, y - 4, 96, 40, 0xc9b27a, 0.9).setStrokeStyle(2, 0x3a2a14).setDepth(KAINATI_FX_DEPTH).setScale(1, 0.1);
      sc.tweens.add({ targets: e, scaleY: 1, yoyo: true, duration: 150, onComplete: () => e.destroy() });
    }
    if (Math.random() < 0.6) spawnFx(sc, 'earth', x + Phaser.Math.Between(-20, 20), y - 8, { count: 2, power: 0.9 });
  }

  // Nappe de mousse (dessinée : rien n'est posé SUR Kainati) + front animé.
  drawMoss(h, front) {
    const g = h.g;
    const a = this.arena;
    g.clear();
    if (h.h <= 0.5) {
      if (h.front) h.front.setAlpha(0);
      return;
    }
    const top = a.floorY - h.h;
    const ph = h.t / 240;
    g.fillStyle(0x16280f, 0.92).fillRect(h.a, top + 10, h.b - h.a, h.h - 6);
    g.fillStyle(0x24401a, 0.95).fillRect(h.a, top + 8, h.b - h.a, Math.min(20, h.h));
    for (let x = h.a, i = 0; x < h.b; x += 26, i++) {
      g.fillStyle(i % 2 ? 0x3e7a2c : 0x2f5a2a, 1).fillEllipse(x + 13, top + 8 + Math.sin(ph + i * 0.9) * 3, 38, 18);
    }
    g.fillStyle(0x9bff5a, 0.8);
    for (let x = h.a + 9, i = 0; x < h.b; x += 34, i++) g.fillCircle(x + Math.sin(ph * 0.7 + i) * 4, top + 4 + Math.cos(ph + i * 1.7) * 2, 2.5);
    if (h.front) {
      h.front.setPosition(front, a.floorY + 4).setAlpha(h.t > h.ms ? Math.max(0, 1 - (h.t - h.ms) / 300) : 1);
    } else {
      g.fillStyle(0x3e7a2c, 1).fillEllipse(front, top + 4, 54, 36);
      g.fillStyle(0x9bff5a, 0.9).fillCircle(front + h.dir * 12, top - 4, 4);
    }
  }

  kill(h, impact = true) {
    h.dead = true;
    if (h.img && h.img.active) {
      if (impact) spawnKainatiImpact(this.scene, h.img.x, Math.min(h.img.y, this.arena.floorY));
      h.img.destroy();
    }
  }

  // Tout efface ; `fade` : en douceur (fin du combat).
  clear(fade = false) {
    for (const h of this.list) {
      const objs = [h.img, h.g, h.front, h.shadow, h.marker, ...(h.glows || [])].filter((o) => o && o.active);
      for (const o of objs) {
        if (fade) this.scene.tweens.add({ targets: o, alpha: 0, duration: 350, onComplete: () => o.destroy() });
        else o.destroy();
      }
      h.dead = true;
    }
    this.list = [];
  }

  // Un danger au sol est-il actif (bots, indices) ?
  floorDanger() {
    return this.list.some((h) => (h.kind === 'quake' && h.t < h.ms) || (h.kind === 'moss' && h.t < h.ms) || h.kind === 'boulder');
  }

  // Pierres lancées encore en l'air (pas celles de la canopée) ?
  thrownStonesAirborne() {
    return this.list.some((h) => h.kind === 'stone' && !h.dead && !h.fromCeiling);
  }
}

// ---------------------------------------------------------------------------
// Boss
// ---------------------------------------------------------------------------
// cfg : { minX, maxX, floorY, ceilingY, spots: [xGauche, xDroite], startSpot,
//         recoil (rebond après le fracas, px) }
class KainatiBoss {
  constructor(scene, cfg) {
    this.scene = scene;
    this.cfg = cfg;
    this.maxHp = KAINATI_MAX_HP;
    this.hazards = new KainatiHazards(scene, { minX: cfg.minX, maxX: cfg.maxX, floorY: cfg.floorY, ceilingY: cfg.ceilingY });
    this.sprite = addKainatiSprite(scene, 0, cfg.floorY, KAINATI_ID, 0x8a5a2b, 'KAINATI').setDepth(KAINATI_DEPTH);
    // Même profondeur qu'Agarica, mais dessiné AVANT elle (tri stable par
    // ordre d'ajout à profondeur égale) : collée à lui pour le frapper quand
    // il est sonné, elle passait derrière son corps et disparaissait.
    scene.children.sendToBack(this.sprite);
    this.size = kainatiBodySize(KAINATI_ID);
    // « ! » (art `ui_alerte`) et étoiles d'étourdissement (art `ui_etoiles_etourdi`).
    this.alertIcon = scene.textures.exists('item-ui_alerte')
      ? addItemImage(scene, 0, 0, 'ui_alerte', { origin: [0.5, 1] })
      : scene.add.text(0, 0, '!', {
        fontFamily: 'sans-serif', fontSize: '40px', fontStyle: 'bold', color: '#ffe066', stroke: '#2a1f45', strokeThickness: 6,
      }).setOrigin(0.5, 1);
    if (this.alertIcon.type === 'Image') this.alertIcon.setScale(KAINATI_ALERT_H / Math.max(1, this.alertIcon.height));
    this.alertIcon.setDepth(KAINATI_UI_DEPTH).setVisible(false);
    this.alertBase = this.alertIcon.scaleX;
    this.stunStars = scene.textures.exists('item-ui_etoiles_etourdi')
      ? addItemImage(scene, 0, 0, 'ui_etoiles_etourdi', { origin: [0.5, 1] })
      : scene.add.text(0, 0, '✦ ✦ ✦', {
        fontFamily: 'sans-serif', fontSize: '18px', color: '#fff2a8', stroke: '#2a1f45', strokeThickness: 4,
      }).setOrigin(0.5, 1);
    this.stunStars.setDepth(KAINATI_UI_DEPTH).setVisible(false);
    // Règle commune : « ! » et étoiles toujours dans l'écran (LevelKit) --
    // Kainati dressé près du haut de la vue, le « ! » en sortait.
    if (typeof keepWorldUiInView === 'function') {
      keepWorldUiInView(this.alertIcon);
      keepWorldUiInView(this.stunStars);
    }
    this.lastTurnAt = -Infinity;
    this.reset();
  }

  // Remet le boss à l'état d'avant combat (sur son poste, au repos).
  reset() {
    this.hazards.clear();
    this.hp = this.maxHp;
    this.phase = 1;
    this.defeated = false;
    this.calm = false;
    this.active = false;
    this.spot = this.cfg.startSpot ?? 1;
    this.x = this.cfg.spots[this.spot];
    this.dir = this.spot === 0 ? 1 : -1;
    this.patternIndex = 0;
    this.pendingPhase2 = false;
    this.invuln = 0;
    this.clock = 0;
    this.stunCount = 0;
    this.hitsTaken = 0;
    this.contactGraceUntil = 0;
    this.contactArmed = true;
    this.contactArmDeadline = 0;
    this.recoil = null;
    this.sprite.setAlpha(1).setVisible(true).clearTint().setAngle(0);
    this.alertIcon.setVisible(false);
    this.stunStars.setVisible(false);
    this.setState('wait');
    this.applyFacing();
    this.syncSprite();
  }

  get floorY() { return this.cfg.floorY; }
  get T() { return KAINATI_TIMINGS[this.phase]; }
  get centerDir() { return this.spot === 0 ? 1 : -1; }
  isOnVine() { return false; } // compat : il ne monte plus jamais sur une liane

  // --- Poses ---------------------------------------------------------------
  setPose(name) {
    if (this.pose === name) return;
    this.pose = name;
    const { key, src } = kainatiPoseAnim(this.scene, name);
    const scale = src.placeholder ? ((kainatiManifestDef(KAINATI_ID) || {}).scale || 1) : kainatiSourceScale(this.scene, src.id, src.anim);
    this.sprite.setScale(scale);
    this.sprite.play(key);
    this.poseSource = src;
  }

  applyFacing() {
    this.sprite.setFlipX(kainatiFlipFor(KAINATI_ID, this.dir > 0));
  }

  face(dir) {
    if (!dir || dir === this.dir) return;
    this.dir = dir > 0 ? 1 : -1;
    this.lastTurnAt = this.clock;
    this.applyFacing();
  }

  // Au repos seulement : vers Agarica, zone morte + délai (pas de volte-face en rafale).
  faceToward(x) {
    const want = x > this.x ? 1 : -1;
    if (want === this.dir || Math.abs(x - this.x) < KAINATI_TURN_DEADZONE) return;
    if (this.clock - this.lastTurnAt < KAINATI_TURN_MS) return;
    this.face(want);
  }

  setState(state, extra = {}) {
    this.state = state;
    this.t = 0;
    this.fired = false;
    Object.assign(this, extra);
    const pose = {
      wait: 'idle', idle: 'idle', throwWind: 'throwWind', throwRelease: 'throwRelease', chargeWind: 'chargeWind',
      charge: 'charge', stunned: 'stunned', slamWind: 'slamWind', slam: 'slamHit', roarWind: 'roarWind', roar: 'roarWind',
      sweepWind: 'sweepWind', sweep: 'sweepThrow', phaseRoar: 'roarWind', defeated: 'defeated', calm: 'calm', talk: 'talk',
      return: 'trot',
    }[state];
    if (pose) this.setPose(pose);
    const telegraph = ['throwWind', 'chargeWind', 'slamWind', 'roarWind', 'sweepWind'].includes(state);
    this.alertIcon.setVisible(telegraph);
    if (telegraph) {
      this.scene.tweens.killTweensOf(this.alertIcon);
      this.alertIcon.setScale(this.alertBase * 0.3);
      this.scene.tweens.add({ targets: this.alertIcon, scale: this.alertBase, duration: 220, ease: 'Back.Out' });
    }
    this.stunStars.setVisible(state === 'stunned');
    if (!telegraph) this.restoreTint();
  }

  restoreTint() {
    if (this.phase === 2 && !this.defeated) this.sprite.setTint(KAINATI_PHASE2_TINT);
    else this.sprite.clearTint();
  }

  // Télégraphe : la teinte « respire » vers `color` (jamais de clignotement).
  glow(color) {
    const k = 0.5 + 0.5 * Math.sin(this.t / 85);
    this.sprite.setTint(kainatiLerpColor(this.phase === 2 ? KAINATI_PHASE2_TINT : 0xffffff, color, 0.18 + 0.3 * k));
  }

  // --- Géométrie -----------------------------------------------------------
  syncSprite() {
    this.sprite.setPosition(this.x, this.cfg.floorY);
    const box = this.visibleBox();
    const top = box ? box.top : this.cfg.floorY - this.size.h;
    this.alertIcon.setPosition(this.x, Math.max(70, top - 6));
    this.stunStars.setPosition(this.x, top + 18);
    // Étoiles peintes : elles « tournent » (retournées toutes les 200 ms) et
    // se balancent un peu, comme un vertige (plan lot 8, §3.10).
    if (this.stunStars.visible && this.stunStars.type === 'Image') {
      this.stunStars.setFlipX(Math.floor(this.clock / 200) % 2 === 1).setAngle(Math.sin(this.clock / 170) * 6);
    }
    this.h = this.cfg.floorY - top;
  }

  visibleBox() {
    const b = typeof objectVisibleBox === 'function' ? objectVisibleBox(this.sprite) : null;
    if (b) return b;
    const w = this.sprite.displayWidth;
    const h = this.sprite.displayHeight;
    return { left: this.x - w / 2, right: this.x + w / 2, top: this.cfg.floorY - h, bottom: this.cfg.floorY };
  }

  // Rectangle tiré des pixels visibles de la pose (fractions centrées en x, depuis les pieds).
  rectFrom(frac) {
    const b = this.visibleBox();
    const w = (b.right - b.left) * frac.w;
    const h = (b.bottom - b.top) * frac.h;
    const cx = (b.left + b.right) / 2;
    return new Phaser.Geom.Rectangle(cx - w / 2, b.bottom - h, w, h);
  }

  // Zone qui encaisse les coups d'Agarica (Player.pogoTargetHit l'utilise aussi).
  getHitRect() { return this.rectFrom(KAINATI_HITBOX); }

  // Zone dont le contact blesse Agarica (plus petite : l'arc de la dague porte
  // au-delà de son corps, on peut le frapper sans le toucher).
  getContactRect() {
    const r = this.rectFrom(KAINATI_CONTACT);
    const top = Math.max(r.y, this.cfg.floorY - KAINATI_CONTACT_MAX_H);
    return new Phaser.Geom.Rectangle(r.x, top, r.width, r.bottom - top);
  }

  get feet() { return { x: this.x, y: this.cfg.floorY }; }

  // --- Combat --------------------------------------------------------------
  start() {
    this.active = true;
    this.setState('idle');
  }

  // Appelée une fois par attaque d'Agarica (cf. boss_kainati.js) : à TOUT
  // MOMENT du combat, puis courte invulnérabilité. Sonné : 2 PV, invulnérabilité
  // plus courte (plus de coups). Renvoie { dmg, stunned } ou null.
  takeHit() {
    if (!this.active || this.defeated || this.invuln > 0) return null;
    const stunned = this.state === 'stunned';
    const dmg = stunned ? KAINATI_STUN_DAMAGE : 1;
    this.hp = Math.max(0, this.hp - dmg);
    this.invuln = stunned ? KAINATI_STUN_HIT_INVULN : KAINATI_HIT_INVULN;
    this.hitsTaken += 1;
    if (this.hp <= 0) this.defeat();
    else if (this.phase === 1 && this.hp <= this.maxHp * KAINATI_PHASE2_RATIO) this.pendingPhase2 = true;
    return { dmg, stunned };
  }

  // Épargné : redevient lucide, inerte (plus d'IA, d'attaque ni de contact).
  defeat() {
    if (this.defeated) return;
    this.defeated = true;
    this.hazards.clear(true);
    this.alertIcon.setVisible(false);
    this.stunStars.setVisible(false);
    this.setState('defeated');
    this.sprite.clearTint();
    this.syncSprite();
  }

  // PNJ apaisé (fin de cinématique / revisite) : assis, inerte, au sol en x.
  makeCalm(x) {
    this.defeated = true;
    this.calm = true;
    this.active = false;
    this.hazards.clear();
    this.x = x ?? this.x;
    this.sprite.clearTint().setAngle(0);
    this.setState('calm');
    this.syncSprite();
  }

  // Pose « parle » le temps d'une conversation (art futur, sinon pose calme).
  setTalking(on) {
    if (!this.calm) return;
    this.setState(on ? 'talk' : 'calm');
  }

  // Combat interrompu (mort d'Agarica) : il se fige, dangers effacés.
  freeze() {
    this.active = false;
    this.hazards.clear(true);
    this.setState('wait');
  }

  nextAction(player) {
    if (this.pendingPhase2) {
      this.pendingPhase2 = false;
      this.phase = 2;
      this.patternIndex = 0;
      this.face(this.centerDir);
      this.setState('phaseRoar');
      return;
    }
    const pattern = KAINATI_PATTERN[this.phase];
    let action = pattern[this.patternIndex % pattern.length];
    // Agarica DERRIÈRE lui (entre lui et son rideau, en le suivant jusqu'à
    // son poste) : de là, aucune liane n'est à portée avant qu'une grande
    // attaque ne la touche (elles partent de ses mains et couvrent aussi son
    // dos), et une salve de pierres l'acculerait au rideau. Il charge alors
    // vers l'autre bout -- loin d'elle --, et l'action prévue garde son tour.
    const behind = player && (player.x - this.x) * this.centerDir < -10;
    if (behind && action !== 'charge') action = 'charge';
    else this.patternIndex += 1;
    const evt = (kind) => this.scene.events.emit('kainati-attack', { kind, phase: this.phase, boss: this });
    if (action === 'throw') {
      if (player) this.face(player.x > this.x ? 1 : -1);
      this.setState('throwWind');
    } else if (action === 'charge') {
      this.face(this.centerDir);
      this.setState('chargeWind');
    } else {
      this.face(this.centerDir);
      const color = { slam: 0xe0a35a, roar: 0x9bff5a, sweep: 0xd8c8a8 }[action];
      this.hazards.serial += 1; // nouvelle grande attaque (cf. KainatiHazards.floorSpared)
      this.hazards.warnBand(color, this.T.fullWind);
      this.setState(`${action}Wind`, { warnColor: color });
    }
    evt(action);
  }

  // Salve de pierres visées sur Agarica (où qu'elle soit, liane comprise).
  throwVolley(player) {
    const n = this.phase === 2 ? 3 : 2;
    const box = this.visibleBox();
    const hand = { x: this.x + this.dir * 40, y: box.top + 30 };
    const px = player ? player.x + Phaser.Math.Clamp(player.body.velocity.x * 0.25, -80, 80) : this.x + this.dir * 300;
    const py = player ? player.y - 40 : this.cfg.floorY - 40;
    // 1re pierre sur elle, 2e entre elle et lui (on recule pour esquiver),
    // 3e (phase 2) derrière elle.
    const toward = player && player.x > this.x ? -1 : 1;
    for (let i = 0; i < n; i++) {
      const off = i === 0 ? 0 : (i % 2 ? toward : -toward) * 110 * Math.ceil(i / 2);
      const tx = Phaser.Math.Clamp(px + off, this.cfg.minX + 20, this.cfg.maxX - 20);
      this.scene.time.delayedCall(i * 200, () => {
        if (this.active && !this.defeated) this.hazards.throwStone(hand.x, hand.y, tx, py, 900 + i * 90);
      });
    }
  }

  // Phase 2 : une pierre tombe de la canopée sur la liane d'Agarica pendant
  // les grandes attaques : il faut se balancer (2 lianes, trop loin l'une de
  // l'autre pour en changer). Pas encore accrochée : sur la liane la plus
  // proche, celle qu'elle rejoint -- jamais sur son chemin au sol. Appelée
  // en différé (delayedCall) : rien si le combat s'est arrêté entre-temps
  // (victoire, mort d'Agarica) -- une pierre tombait après la victoire.
  dropCeilingRock(player) {
    if (this.phase !== 2 || !player || !player.active || !this.active || this.defeated || this.calm) return;
    let x = player.x;
    if (player.vine) x = player.vine.x;
    else {
      const vines = (this.scene.vines || []).filter((v) => v.alive);
      if (vines.length) x = vines.reduce((b, v) => (Math.abs(v.x - player.x) < Math.abs(b.x - player.x) ? v : b)).x;
    }
    this.hazards.ceilingRock(Phaser.Math.Clamp(x + Phaser.Math.Between(-8, 8), this.cfg.minX + 30, this.cfg.maxX - 30), 950);
  }

  // Point d'impact des mains (devant lui, au sol).
  handsX(dist = 70) { return this.x + this.dir * dist; }

  update(dt, player) {
    this.clock += dt;
    if (this.invuln > 0) this.invuln -= dt;
    this.hazards.update(dt, player);
    if (this.calm || this.defeated) { this.syncSprite(); return; }
    this.t += dt;
    const T = this.T;
    switch (this.state) {
      case 'wait':
        if (player) this.faceToward(player.x);
        break;
      case 'idle':
        if (player) this.faceToward(player.x);
        // Sol dégagé avant d'enchaîner : avec 2 lianes, la course jusqu'à une
        // liane est plus longue, et elle croisait la dernière pierre d'une
        // salve encore en vol (phase 2 : jet, puis grande attaque 1 s après)
        // -- un cœur perdu que le télégraphe ne laissait pas éviter (bot).
        if (this.active && this.t >= T.idle && !this.hazards.thrownStonesAirborne()) this.nextAction(player);
        break;
      case 'throwWind':
        this.glow(0xffe066);
        if (this.t >= T.throwWind) this.setState('throwRelease');
        break;
      case 'throwRelease':
        if (!this.fired && this.t >= 90) { this.fired = true; this.throwVolley(player); }
        if (this.t >= T.throwRelease) this.setState('idle');
        break;
      case 'chargeWind':
        this.glow(0xff7a5a);
        if (Math.floor(this.t / 140) !== Math.floor((this.t - dt) / 140)) {
          spawnFx(this.scene, 'step', this.x - this.dir * 50, this.cfg.floorY, { dir: -this.dir, power: 1.2, count: 2 });
        }
        if (this.t >= T.chargeWind) this.setState('charge', { target: this.cfg.spots[1 - this.spot] });
        break;
      case 'charge': {
        const step = T.chargeSpeed * (dt / 1000);
        const left = this.target - this.x;
        if (Math.floor(this.t / 70) !== Math.floor((this.t - dt) / 70)) {
          spawnFx(this.scene, 'step', this.x - this.dir * 60, this.cfg.floorY, { dir: this.dir, power: 1.4, count: 2 });
        }
        if (Math.abs(left) <= step) {
          this.x = this.target;
          this.crash();
        } else {
          this.x += Math.sign(left) * step;
        }
        break;
      }
      case 'stunned':
        // Rebond sur le rideau vers le centre (cf. crash), en début d'étourdissement.
        if (this.recoil) {
          const k = Math.min(1, this.t / KAINATI_RECOIL_MS);
          this.x = Phaser.Math.Linear(this.recoil.from, this.recoil.to, Phaser.Math.Easing.Quadratic.Out(k));
          if (k >= 1) this.recoil = null;
        }
        if (this.t >= this.stunFor) {
          this.recoil = null;
          const post = this.cfg.spots[this.spot];
          if (Math.abs(post - this.x) > 4) {
            // Il se relève et retourne au trot à son poste, dos à l'arène : pas
            // de contact pendant ce retour (il passe à côté d'Agarica, venue le
            // frapper, sans la blesser).
            this.face(post > this.x ? 1 : -1);
            this.setState('return', { returnTo: post });
            this.contactGraceUntil = Infinity;
          } else {
            this.setState('idle');
            if (player) this.face(player.x > this.x ? 1 : -1);
            // Son contact ne reprend qu'après un court instant (sinon Agarica,
            // collée à lui pour frapper, était touchée sans préavis).
            this.disarmContact();
          }
        }
        break;
      case 'return': {
        const step = T.returnSpeed * (dt / 1000);
        // Agarica dans son dos, entre son poste et son rideau (elle l'a suivi
        // pour frapper) : il s'arrête devant elle au lieu de la coincer contre
        // le rideau, d'où ses coups (contact réarmé) ne s'évitaient qu'en lui
        // sautant par-dessus. Sa prochaine grande attaque devient une charge
        // vers l'autre bout (cf. nextAction), loin d'elle.
        if (player && (player.x - this.returnTo) * this.centerDir < 0) {
          const stop = player.x + this.centerDir * KAINATI_RETURN_GAP;
          if ((stop - this.returnTo) * this.centerDir > 0) this.returnTo = stop;
        }
        const left = this.returnTo - this.x;
        if (Math.floor(this.t / 140) !== Math.floor((this.t - dt) / 140)) {
          spawnFx(this.scene, 'step', this.x - this.dir * 50, this.cfg.floorY, { dir: this.dir, power: 0.7 });
        }
        if (Math.abs(left) <= step) {
          this.x = this.returnTo;
          // Au poste : il refait face à l'arène, contact rétabli après un instant.
          this.face(this.centerDir);
          this.setState('idle');
          this.disarmContact();
        } else {
          this.x += Math.sign(left) * step;
        }
        break;
      }
      case 'slamWind':
        this.glow(this.warnColor);
        if (this.t >= T.fullWind) this.setState('slam');
        break;
      case 'slam':
        if (!this.fired && this.t >= 110) {
          this.fired = true;
          const x0 = this.handsX(75);
          const body = this.visibleBox();
          this.hazards.quake(x0, T.quake, [body.left - 20, body.right + 20]);
          juiceShake(this.scene, 'heavy');
          spawnFx(this.scene, 'slam', x0, this.cfg.floorY, { size: 1.3 });
          spawnKainatiImpact(this.scene, x0, this.cfg.floorY, 1.3);
          playSfx('ours_slam', { boss: 'kainati' });
          this.scene.time.delayedCall(250, () => this.dropCeilingRock(player));
        }
        if (this.t >= 260 && this.pose !== 'slamEnd') this.setPose('slamEnd');
        if (this.t >= 260 + T.recover) this.setState('idle');
        break;
      case 'roarWind':
        this.glow(this.warnColor);
        if (Math.floor(this.t / 120) !== Math.floor((this.t - dt) / 120)) {
          spawnFx(this.scene, 'bubble', this.handsX(Phaser.Math.Between(20, 140)), this.cfg.floorY - 6, { count: 1 });
        }
        if (this.t >= T.fullWind) this.setState('roar');
        break;
      case 'roar':
        if (!this.fired) {
          this.fired = true;
          this.hazards.mossFlood(this.handsX(30), this.dir, T.moss);
          juiceShake(this.scene, 'medium', 500);
          this.scene.time.delayedCall(250, () => this.dropCeilingRock(player));
        }
        if (this.t >= 350 && this.pose !== 'roarEnd') this.setPose('roarEnd');
        if (this.t >= 350 + T.recover) this.setState('idle');
        break;
      case 'sweepWind':
        this.glow(this.warnColor);
        // Cailloux qui tombent de la canopée de son côté : l'éboulement arrive.
        if (Math.floor(this.t / 160) !== Math.floor((this.t - dt) / 160)) {
          spawnFx(this.scene, 'chip', this.handsX(Phaser.Math.Between(0, 30)), this.cfg.ceilingY + 70, { count: 1, angle: [80, 100], speed: [60, 140] });
        }
        if (this.t >= T.fullWind) this.setState('sweep');
        break;
      case 'sweep':
        // Frame 3 (mains vides) : le rocher repart de là où la frame 2 le montrait.
        if (!this.fired && this.t >= 110) {
          this.fired = true;
          this.hazards.boulder(this.handsX(84), this.dir, KAINATI_BOULDER_D);
          juiceShake(this.scene, 'medium');
          // Pierres de la canopée : elles dégringolent SUR lui (derrière son
          // corps à l'image) puis roulent devant -- plus en handsX(40..110),
          // qui les faisait traverser la liane où Xara envoie Agarica.
          const serial = this.hazards.serial;
          const box = this.visibleBox();
          const front = this.dir > 0 ? box.right : box.left;
          for (let i = 0; i < T.rocks; i++) {
            this.scene.time.delayedCall(260 + i * T.rockEvery, () => {
              if (!this.active || this.defeated) return;
              const d = Phaser.Math.Between(46, 66);
              this.hazards.boulder(this.handsX(Phaser.Math.Between(0, 30)), this.dir, d,
                { fromY: this.cfg.ceilingY + 70, serial, behindUntilX: front });
            });
          }
          this.scene.time.delayedCall(300, () => this.dropCeilingRock(player));
        }
        if (this.t >= 260 + T.recover) this.setState('idle');
        break;
      case 'phaseRoar':
        this.glow(0xff5a5a);
        if (!this.fired && this.t >= 430) {
          this.fired = true;
          juiceShake(this.scene, 'heavy', 700);
          spawnFx(this.scene, 'transform', this.x, this.cfg.floorY - 150, { color: 0xff7a7a, size: 1.6 });
          this.scene.events.emit('kainati-phase2', this);
        }
        if (this.t >= 1300) { this.setPose('roarEnd'); this.setState('idle'); }
        break;
      default:
        break;
    }
    this.syncSprite();
    // Contact : blesse Agarica pendant tout le combat, sauf sonné ou battu.
    // (Invulnérabilité après un coup : Player.hitByEnemy.)
    if (this.active && this.state !== 'stunned' && player && player.body && this.clock >= (this.contactGraceUntil || 0)) {
      const touching = Phaser.Geom.Intersects.RectangleToRectangle(this.getContactRect(), kainatiPlayerRect(player));
      if (!this.contactArmed && (!touching || this.clock >= this.contactArmDeadline)) this.contactArmed = true;
      if (this.contactArmed && touching) player.hitByEnemy();
    }
  }

  // Relevé (fin d'étourdissement, retour au poste) : contact coupé un court
  // instant, puis réarmé seulement une fois Agarica sortie de son corps
  // (cf. KAINATI_UNPIN_MS).
  disarmContact() {
    this.contactGraceUntil = this.clock + KAINATI_RISE_GRACE;
    this.contactArmed = false;
    this.contactArmDeadline = this.contactGraceUntil + KAINATI_UNPIN_MS;
  }

  // Fin de charge contre le rideau : fracas, puis sonné (fenêtre de frappe).
  crash() {
    const wallX = this.dir > 0 ? this.cfg.maxX : this.cfg.minX;
    this.spot = 1 - this.spot;
    juiceShake(this.scene, 'heavy');
    juiceHitStop(this.scene, 45);
    spawnFx(this.scene, 'wallHit', wallX - this.dir * 20, this.cfg.floorY - 120, { dir: this.dir });
    spawnFx(this.scene, 'slam', this.x + this.dir * 60, this.cfg.floorY, { size: 0.9 });
    for (let i = 0; i < 4; i++) {
      spawnFx(this.scene, 'chip', wallX - this.dir * Phaser.Math.Between(20, 120), this.cfg.ceilingY + 70, { count: 2, angle: [80, 100], speed: [80, 200] });
    }
    this.stunCount += 1;
    // Il rebondit vers le centre (recoil px, cf. update 'stunned') et se
    // retrouve assis, face à l'arène : plus près des lianes d'où Agarica a
    // esquivé (contre le rideau, il restait hors de portée de la fenêtre).
    // Relevé, il retourne à son poste (état 'return').
    this.face(this.centerDir);
    const recoil = this.cfg.recoil ?? 200;
    this.setState('stunned', {
      stunFor: this.T.stun,
      recoil: recoil > 0 ? { from: this.x, to: this.x + this.centerDir * recoil } : null,
    });
    this.scene.events.emit('kainati-stunned', this);
  }

  destroy() {
    this.hazards.clear();
    this.alertIcon.destroy();
    this.stunStars.destroy();
    this.sprite.destroy();
  }
}

// ---------------------------------------------------------------------------
// Esprit simien ancestral (monde spirituel) — cf. API en tête de fichier.
// Art `kainati_esprit` (idle, swing) ; pose « donne la forme » : feuille
// future `kainati_esprit_extra` (anim `give`, PROMPT_CODEX_9), recalée par
// surface visible sur son idle.
// ---------------------------------------------------------------------------
const KAINATI_ESPRIT_EXTRA_ID = 'kainati_esprit_extra';

class KainatiEsprit {
  constructor(scene, x, y, { vine = null, facing = 'left' } = {}) {
    this.scene = scene;
    this.sprite = addKainatiSprite(scene, x, y, 'kainati_esprit', 0x9fe3ff, 'ESPRIT');
    this.size = kainatiBodySize('kainati_esprit');
    this.h = this.size.h;
    this.baseScale = this.sprite.scaleX;
    this.sprite.setDepth(KAINATI_DEPTH).setAlpha(0.75).setFlipX(kainatiFlipFor('kainati_esprit', facing === 'right'));
    this.sprite.setBlendMode(Phaser.BlendModes.SCREEN);
    // Aura : art `fx_aura_esprit` en ADD (plan lot 8, §3.10), sinon l'ellipse
    // pâle d'avant. Même emprise ; l'image (taille posée par setDisplaySize)
    // garde scaleX ≠ scaleY : bless() tweene donc scaleX et scaleY à part.
    if (scene.textures.exists('item-fx_aura_esprit')) {
      this.glow = scene.add.image(x, y - this.h / 2, 'item-fx_aura_esprit')
        .setDisplaySize(this.size.w * 1.4, this.h * 1.2).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.18);
    } else {
      this.glow = scene.add.ellipse(x, y - this.h / 2, this.size.w * 1.4, this.h * 1.2, 0x9fe3ff, 0.12);
    }
    this.glow.setDepth(KAINATI_DEPTH - 1);
    this.glowBase = { sx: this.glow.scaleX, sy: this.glow.scaleY, alpha: this.glow.alpha };
    this.vine = null;
    this.clock = Math.random() * 1000;
    this.busy = false;
    this.feet = { x, y };
    if (vine) this.hangOn(vine);
    else this.standAt(x, y);
    this.onUpdate = (time, delta) => this.update(delta);
    scene.events.on('update', this.onUpdate);
    scene.events.once('shutdown', () => this.destroy());
  }

  play(anim) {
    this.sprite.setScale(this.baseScale);
    if (this.sprite.playManifest) this.sprite.playManifest(anim);
  }

  hangOn(vine) {
    this.vine = vine;
    this.play('swing');
    return this;
  }

  standAt(x, y) {
    this.vine = null;
    this.feet = { x, y };
    this.play('idle');
    return this;
  }

  // Donne la forme : pose `give` (art futur) tenue `ms`, sinon lueur qui enfle.
  bless(ms = 1400) {
    return new Promise((resolve) => {
      if (!this.sprite.active) { resolve(); return; }
      const sc = this.scene;
      const id = KAINATI_ESPRIT_EXTRA_ID;
      if (kainatiManifestDef(id) && hasManifestArt(sc, id, 'give')) {
        ensureManifestAnims(sc, id);
        const refKey = manifestFrameKey('kainati_esprit', 'idle', 0);
        const r = typeof manifestSheetScale === 'function' && sc.textures.exists(refKey)
          ? manifestSheetScale(sc, id, 'give', { refKey, refScale: this.baseScale, method: 'area' }) : null;
        this.sprite.setScale(r && r.scale ? r.scale : this.baseScale);
        this.sprite.play(`${id}-give`);
      }
      const gb = this.glowBase;
      sc.tweens.add({
        targets: this.glow, scaleX: gb.sx * 1.6, scaleY: gb.sy * 1.6, alpha: Math.max(0.35, gb.alpha * 2),
        duration: ms / 2, yoyo: true, ease: 'Sine.easeInOut',
      });
      spawnFx(sc, 'motes', this.feet.x, this.feet.y - this.h * 0.6, { count: 18, spread: 40, power: 1.6, color: [0x9fe3ff, 0xbfe8a0, 0xffffff] });
      sc.time.delayedCall(ms, () => {
        if (this.sprite.active && !this.busy) this.play(this.vine ? 'swing' : 'idle');
        resolve();
      });
    });
  }

  feetFor(target, angle = 0) {
    if (target.length != null) {
      const d = Math.min(90, (target.length || 200) - 10);
      return { x: target.x + Math.sin(angle) * d, y: target.y + Math.cos(angle) * d + this.h * 0.95 };
    }
    return { x: target.x, y: target.y };
  }

  swingTo(target, ms = 900) {
    return new Promise((resolve) => {
      if (!this.sprite.active) { resolve(); return; }
      this.busy = true;
      const from = { ...this.feet };
      const to = this.feetFor(target);
      this.sprite.setFlipX(kainatiFlipFor('kainati_esprit', to.x > from.x));
      this.play('swing');
      const prog = { k: 0 };
      this.scene.tweens.add({
        targets: prog,
        k: 1,
        duration: ms,
        ease: 'Sine.InOut',
        onUpdate: () => {
          this.feet = {
            x: Phaser.Math.Linear(from.x, to.x, prog.k),
            y: Phaser.Math.Linear(from.y, to.y, prog.k) + Math.sin(Math.PI * prog.k) * 60,
          };
        },
        onComplete: () => {
          this.busy = false;
          if (target.length != null) this.hangOn(target); else this.standAt(to.x, to.y);
          resolve();
        },
      });
    });
  }

  waitForPlayer(radius = 180) {
    return new Promise((resolve) => {
      const check = () => {
        const p = this.scene.player;
        if (!this.sprite.active) { this.scene.events.off('update', check); resolve(); return; }
        if (p && Phaser.Math.Distance.Between(p.x, p.y, this.feet.x, this.feet.y) <= radius) {
          this.scene.events.off('update', check);
          resolve();
        }
      };
      this.scene.events.on('update', check);
    });
  }

  async guide(path, { radius = 200, pauseMs = 250 } = {}) {
    for (const step of path) {
      await this.waitForPlayer(radius);
      if (!this.sprite.active) return;
      if (pauseMs) await new Promise((r) => this.scene.time.delayedCall(pauseMs, r));
      await this.swingTo(step);
    }
  }

  update(delta) {
    if (!this.sprite.active) return;
    this.clock += delta;
    if (!this.busy && this.vine) this.feet = this.feetFor(this.vine, Math.sin(this.clock / 480) * 0.07);
    // Flottement éthéré au sol.
    const bob = !this.busy && !this.vine ? Math.sin(this.clock / 600) * 4 : 0;
    this.sprite.setPosition(this.feet.x, this.feet.y + bob);
    this.sprite.setAlpha(0.65 + Math.sin(this.clock / 350) * 0.1);
    this.glow.setPosition(this.feet.x, this.feet.y + bob - this.h / 2);
  }

  destroy() {
    if (this.onUpdate) this.scene.events.off('update', this.onUpdate);
    this.onUpdate = null;
    if (this.glow && this.glow.active) this.glow.destroy();
    if (this.sprite && this.sprite.active) this.sprite.destroy();
  }
}
