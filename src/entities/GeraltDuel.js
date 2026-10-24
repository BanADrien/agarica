// Duel contre Geralt (forêt flottante 1) — refonte du 2026-10-24.
//
// Demande de l'utilisateur : un VRAI combat, lisible et juste, autour d'un
// personnage qui reste drôle. Geralt tire pour de bon : flèche en cloche
// annoncée par un marqueur au sol, tir droit, saut en cloche avec tir
// plongeant… puis réception ratée (il s'étale : fenêtre pour le frapper). Il
// pose des collets où Agarica ET lui peuvent tomber. Au 4e coup, il invoque
// Clak : la colonne de lumière s'abat là où se tient Agarica. Phase 2 : Clak
// charge en crabe et pince ; on l'étourdit sans pouvoir le vaincre. On gagne
// en touchant Geralt 8 fois. Dernier cœur perdu : le duel recommence.
//
// Corrections après playtest (2026-10-25) : collet court et jamais sur une
// Agarica déjà invulnérable ; collets plus visibles (halo) ; phase 2 où Clak
// attaque vraiment et où Geralt ne se laisse plus talonner ; victoire dès le
// 8e coup, même en l'air ; garde-fou contre la sortie de l'arène ; souffle de
// 1 cœur à la phase 2 et répit croissant après chaque défaite.
//
// Ici, la mécanique seule. L'histoire (rencontre, bulles de Xara, fin, carte)
// reste dans src/story/acte2.js, qui reçoit les événements du duel (onEvent).
// Tout avance dans update(delta), appelé seulement monde NON gelé (dialogue,
// sac, carte, pose de mort) : flèches, pièges et minuteries s'arrêtent avec lui.
// Poses de combat dessinées : manifest `geralt_combat` (docs/production/
// PROMPT_CODEX_9_GERALT.md) dès qu'il existe, sinon les poses actuelles.

const GERALT_DUEL_CFG = {
  hits: 8, // coups pour gagner
  invokeAt: 4, // invocation de Clak (mi-combat)
  // Invulnérabilité de Geralt après un coup et délai entre deux roulades,
  // par phase. Playtest : en phase 2, 74 % des coups tombaient sur un Geralt
  // debout qu'on talonnait (victoire en ~20 s, chaque attaque vue une fois).
  // Phase 2 : il roule plus souvent et encaisse moins vite, pour que les
  // coups viennent surtout des fenêtres (réception ratée, collet, Clak sonné).
  hitInvulMs: [800, 1300],
  gravity: 1500,
  walk: [110, 140], // px/s (phase 1, phase 2)
  keep: [230, 400], // distance que Geralt cherche à garder avec Agarica
  // Agarica plus près : roulade arrière, intouchable en l'air (« Raté ! »),
  // pas plus souvent que `evadeEveryMs`. Les vraies fenêtres de frappe :
  // pendant ses télégraphes, à terre après le saut raté, dans ses collets.
  evadeRange: 115,
  evadeEveryMs: [1200, 700],
  // Télégraphes (ms, phase 1 ; ×0,8 en phase 2) : pose + éclat/marqueur.
  teleMs: { lob: 650, shot: 560, jump: 520, trap: 520 },
  teleFactor: [1, 0.8],
  // Pause entre deux attaques. Phase 2 : Clak attaque désormais souvent
  // (entre deux attaques de Geralt) ; à 600-900 ms, la pression cumulée
  // tuait même un joueur parfait (bots) : Geralt y laisse plus de place à
  // Clak (les deux ne lancent jamais un assaut en même temps).
  rest: [[850, 1200], [1200, 1600]],
  // À terre après le saut raté : même fenêtre dans les deux phases (en
  // phase 2, les coups doivent surtout venir de là, cf. hitInvulMs).
  crashMs: [1450, 1450],
  trappedMs: 1700, // pris dans son propre collet
  maxDownHits: 2, // coups au plus par chute, puis il se relève
  arrowSpeed: [540, 620],
  arrowLen: 36, // px à l'écran (objet_fleche)
  lobMs: 1000,
  lobGravity: 950,
  jumpAirMs: 820,
  trapMax: 2,
  trapArmMs: 450,
  // Agarica immobilisée. Le collet ne la retient que s'il vient de lui
  // retirer un cœur (sinon il casse) : son invulnérabilité (950 ms, Player.js)
  // couvre donc toute la prise, et il lui reste ~450 ms protégée pour fuir
  // une charge de Clak ou une flèche déjà lancées (à 900 ms, il ne restait que
  // 50 ms : un 2e cœur perdu impossible à éviter).
  trapRootMs: 500,
  trapW: 42, // largeur à l'écran (34 px : brun sur l'herbe, invisible)
};

// Clak en phase 2 : il garde ses distances de côté, charge (dégâts au contact)
// ou pince de près ; un coup le repousse et l'étourdit ~2 s.
const CLAK_DUEL_CFG = {
  keep: [120, 220], speed: 85,
  chargeTeleMs: 620, chargeSpeed: 400, chargeOvershoot: 130,
  snapTeleMs: 400, snapRange: 72,
  stunMs: 2000,
  // Entre deux assauts (playtest : à 1,6-2,4 s, il n'attaquait qu'une ou deux
  // fois de toute la phase 2 ; à 1,1-1,6 s, encore une fois toutes les 5 s,
  // car il attend que Geralt ait fini les siennes), et premier assaut peu
  // après son atterrissage.
  every: [900, 1300],
  firstMs: 500,
  // Agarica prise dans un collet : une charge lancée s'arrête net à moins de
  // cette distance (pas de coup gratuit sur une joueuse ligotée).
  rootSkid: 160,
};

// Colonne `vfx_invocation_clak` : Clak y est dessiné ~1,15× plus grand que
// sur sa feuille (pixels rouges mesurés avec PIL, frame 3 : 226×155 px contre
// 263×175 sur clak_row0_0). Échelle de la colonne = échelle de Clak × 1,146 :
// le vrai Clak prend la place du dessin sans saut de taille. Bas de ses
// pixels rouges : 243 px au-dessus du bas de la frame (marge visible 4 px) ;
// sur sa feuille, 10 px (marge stable de l'anim idle 4 px).
const GERALT_COLUMN = {
  clakRatio: 1.146, clakBottom: 243, margin: 4, sheetBottom: 10, sheetMargin: 4,
  teleMs: 1100, halfW: 24, lift: 40,
};

// Calibrage de Geralt (mesuré dans le jeu, servi en http) : repli quand les
// pixels ne sont pas lisibles (page ouverte en file://, canvas « tainted ») —
// sans lui, il grandissait de 18 % en marchant et de 20 % en invocation.
// Planche d'invocation : dessinée ~9 % plus PETITE que geralt.png (hauteur
// debout 212,5 px contre 231,5 ; largeur de tête 123 contre 136) ->
// ×1,087 : debout, mêmes 69,4 px visibles que l'idle.
const GERALT_P2_ANIMS = ['trip_fall', 'map_reading', 'walk'];
const GERALT_P2_FACTOR = 0.846;
const GERALT_INV_FACTOR = 1.087;
const GERALT_INV_STANDING = ['geralt_invocation-rise-0', 'geralt_invocation-channel-3'];

// Poses de Geralt : `art` = anim du futur manifest `geralt_combat` ; `fb` =
// repli sur les poses existantes (`attack_miss` 0-1 : arc bandé ; 2-3 : l'arc
// lui échappe ; `trip_fall` 0 : pied dans la corde, 3 : à plat ventre, 4 :
// assis, sonné). `hold` = frame figée, `from` = départ de l'anim à cette
// frame ; `lean` = inclinaison au dessin (vise en l'air), `squash` = accroupi.
const GERALT_POSES = {
  idle: { fb: { anim: 'idle' } },
  walk: { fb: { anim: 'walk' } },
  hop: { art: { anim: 'jump_shoot', hold: 1 }, fb: { anim: 'walk', hold: 1 } },
  aim: { art: { anim: 'shoot', hold: 1 }, fb: { anim: 'attack_miss', hold: 1 } },
  loose: { art: { anim: 'shoot', from: 2 }, fb: { anim: 'attack_miss', hold: 0 } },
  aim_up: { art: { anim: 'shoot_up', hold: 1 }, fb: { anim: 'attack_miss', hold: 1, lean: -0.32 } },
  loose_up: { art: { anim: 'shoot_up', from: 2 }, fb: { anim: 'attack_miss', hold: 0, lean: -0.32 } },
  crouch: { art: { anim: 'jump_shoot', hold: 0 }, fb: { anim: 'idle', hold: 3, squash: true } },
  air: { art: { anim: 'jump_shoot', hold: 1 }, fb: { anim: 'attack_miss', hold: 1 } },
  air_shot: { art: { anim: 'jump_shoot', from: 2 }, fb: { anim: 'attack_miss', from: 2 } },
  crash: { art: { anim: 'crash' }, fb: { anim: 'trip_fall', from: 1 } },
  down: { art: { anim: 'stunned' }, fb: { anim: 'trip_fall', hold: 3 } },
  getup: { art: { anim: 'crash', hold: 3 }, fb: { anim: 'trip_fall', hold: 4 } },
  set_trap: { art: { anim: 'set_trap' }, fb: { anim: 'idle', hold: 2, squash: true } },
  trapped: { art: { anim: 'trapped' }, fb: { anim: 'trip_fall', from: 0 } },
  hurt: { art: { anim: 'hurt' }, fb: { anim: 'attack_miss', hold: 3 } },
};
// États où Geralt marche au sol (et peut donc poser le pied dans un collet).
const GERALT_TRAPPABLE = ['move', 'hurt', 'recover'];

function gdRect(x, y, w, h) { return new Phaser.Geom.Rectangle(x, y, w, h); }
function gdHit(a, b) { return !!a && !!b && Phaser.Geom.Intersects.RectangleToRectangle(a, b); }
function gdSign(v, def = 1) { return v > 0 ? 1 : (v < 0 ? -1 : def); }

// Texte qui monte et s'efface (noms d'attaques, « Ping ! »…) : indépendant
// d'acte2.js (chargé après les entités).
function gdFloat(scene, x, y, text, color = '#ffd27a', { size = 15, ms = 1100 } = {}) {
  const font = (typeof STORY_UI !== 'undefined' && STORY_UI.serif) || 'serif';
  const t = scene.add.text(x, y, text, {
    fontFamily: font, fontSize: `${size}px`, fontStyle: 'bold', color,
    stroke: '#15101f', strokeThickness: 4, align: 'center',
  }).setOrigin(0.5, 1).setDepth(1060);
  scene.tweens.add({ targets: t, y: y - 30, duration: ms, ease: 'Sine.easeOut' });
  scene.tweens.add({ targets: t, alpha: 0, delay: ms * 0.65, duration: ms * 0.35, onComplete: () => t.destroy() });
  return t;
}

// Rayon de lumière vertical (colonne qui tombe du ciel) : dégradé dessiné une
// fois, étiré à la hauteur voulue, en mode additif.
function gdBeamTexture(scene) {
  const key = 'gd-beam';
  if (scene.textures.exists(key)) return key;
  const tex = scene.textures.createCanvas(key, 32, 128);
  const ctx = tex.getContext();
  const grad = ctx.createLinearGradient(0, 0, 32, 0);
  grad.addColorStop(0, 'rgba(255,255,255,0)');
  grad.addColorStop(0.35, 'rgba(255,250,235,0.75)');
  grad.addColorStop(0.5, 'rgba(255,255,255,1)');
  grad.addColorStop(0.65, 'rgba(255,250,235,0.75)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 32, 128);
  tex.refresh();
  return key;
}

// Lueur allongée (ellipse floue) posée sous chaque flèche en vol.
function gdArrowGlowTexture(scene) {
  const key = 'gd-arrow-glow';
  if (scene.textures.exists(key)) return key;
  const tex = scene.textures.createCanvas(key, 64, 16);
  const ctx = tex.getContext();
  ctx.setTransform(1, 0, 0, 0.25, 0, 0);
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0.45)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  tex.refresh();
  return key;
}

class GeraltDuel {
  // geralt : PNJ `scene.npcs.geralt` (sprite du manifest, pieds = y) ;
  // minX/maxX : murs de l'arène (centre d'un mur de 32 px : bords intérieurs
  // à minX + 16 et maxX - 16) ; spawn : réapparition d'Agarica pendant le
  // duel ; resetX : place de Geralt quand le duel recommence ; noTrap : plages
  // [x0, x1] où aucun collet n'est posé (décor qui le cacherait).
  constructor(scene, { geralt, minX, maxX, groundY, spawn, resetX, onEvent, noTrap = [] }) {
    this.scene = scene;
    this.g = geralt;
    this.minX = minX;
    this.maxX = maxX;
    this.noTrap = noTrap;
    this.groundY = groundY;
    this.resetX = resetX;
    this.onEvent = onEvent || (() => {});
    // Tirages reproductibles (bots de test) : même duel à chaque essai.
    this.rng = new Phaser.Math.RandomDataGenerator(['geralt-duel']);
    this.now = 0;
    this.objs = new Set();
    this.arrows = [];
    this.traps = [];
    this.pendingSkills = [];
    this.root = null;
    this.column = null;
    this.clak = null;
    this.C = null;
    this.hits = 0;
    this.phase = 1;
    this.active = false;
    this.over = false;
    this.down = null;
    this.seen = new Set();
    this.bag = [];
    this.opening = [];
    this.manifest = typeof getAssetManifest === 'function' ? getAssetManifest() : {};
    this.baseScale = geralt.scaleX / (geralt.__sheetFactor || 1);
    const vb = typeof visibleBounds === 'function' ? visibleBounds(scene, 'geralt-idle-0') : null;
    this.exact = !!(vb && vb.exact);
    this.combatArt = typeof hasManifestArt === 'function' && hasManifestArt(scene, 'geralt_combat');
    if (this.combatArt) ensureManifestAnims(scene, 'geralt_combat');
    ensureManifestAnims(scene, 'geralt_invocation');
    this.G = {
      x: geralt.x, y: groundY, vx: 0, vy: 0, air: false, lift: 0, face: -1,
      state: 'pause', t: 0, d: { ms: 0.6 }, invulUntil: 0, lying: false, trance: false,
      nextAttackAt: 0, evadeReadyAt: 0, cornerReadyAt: 0, lastToken: null, sinceJump: 0, downHits: 0,
    };
    geralt.__scripted = true;
    geralt.lookAtPlayer = false;
    // Coup vers le bas sur Geralt ou Clak = rebond (cf. Player.pogoTargetHit).
    const duel = this;
    this.pogo = [
      { get active() { return duel.active && !duel.over && !duel.G.dodging; }, getBounds: () => duel.geraltRect() },
      { get active() { return !!(duel.clak && duel.C && duel.C.state !== 'hover'); }, getBounds: () => duel.clakRect() },
    ];
    scene.pogoTargets = scene.pogoTargets || [];
    scene.pogoTargets.push(...this.pogo);
    this.onDepleted = () => this.playerDown();
    this.onSkill = (ev) => { if (ev && ev.rect) this.pendingSkills.push(ev); };
    scene.events.on('player-depleted', this.onDepleted);
    scene.events.on('player-skill', this.onSkill);
    // Dernier cœur perdu pendant le duel : réapparition DANS l'arène (le
    // point de départ de la zone est derrière le mur gauche).
    const p = scene.player;
    this.savedSpawn = p ? [p.spawnX, p.spawnY] : null;
    if (p && spawn) { p.spawnX = spawn.x; p.spawnY = spawn.y; }
    this.face(gdSign((p ? p.x : 0) - geralt.x, -1));
    this.setPose('idle', true);
  }

  // --- API (acte2.js) -------------------------------------------------------
  start() {
    this.active = true;
    this.opening = ['lob', 'shot', 'trap', 'jump'];
    this.enter('pause', { ms: 0.7 });
    this.G.nextAttackAt = this.now + 900;
  }

  ratio() { return Phaser.Math.Clamp(1 - this.hits / GERALT_DUEL_CFG.hits, 0, 1); }

  // Indulgence après une défaite (jusqu'à 4) : +15 % de répit entre les
  // attaques de Geralt et de Clak, +8 % de télégraphe (pose, colonne) et un
  // tir plongeant d'autant plus lent, par défaite. Les bots lents de
  // playtest (600 ms de réaction) perdaient 10 fois de suite : un jeu-cadeau
  // ne doit pas bloquer ; une joueuse qui gagne du premier coup n'en voit rien.
  ease() { return 1 + 0.15 * Math.min(this.defeats || 0, 4); }

  teleEase() { return 1 + 0.08 * Math.min(this.defeats || 0, 4); }

  update(delta) {
    if (this.disposed) return;
    const scene = this.scene;
    const p = scene.player;
    if (!p || !p.active || !p.body || !this.g.active) return;
    const dt = Math.min(delta || 16, 50) / 1000;
    this.now += dt * 1000;
    this.keepInArena(p);
    if (this.over) {
      // 8e coup reçu en plein saut : il finit sa chute, à plat ventre.
      if (this.G.air) this.updateBeatenFall(dt);
      this.updateArrows(dt, p);
      if (this.C) this.updateClak(dt, p);
      this.sync();
      return;
    }
    if (this.down) {
      // Attente de la réapparition (cœurs rechargés) avant de tout relancer.
      if (p.hearts >= p.maxHearts && !p.fallingOut) this.restart(p);
      this.sync();
      return;
    }
    this.checkPlayerAttacks(p);
    // Victoire au coup qui vient de porter (win) : plus rien n'attaque.
    if (this.over) { this.sync(); return; }
    this.updateGeralt(dt, p);
    if (this.C) this.updateClak(dt, p);
    this.updateArrows(dt, p);
    this.updateTraps(dt, p);
    this.updateRoot(p);
    this.sync();
  }

  // Fin du duel : nettoyage. `keepActors` : Geralt et Clak restent (fin).
  destroy({ keepActors = true } = {}) {
    if (this.disposed) return;
    this.disposed = true;
    const scene = this.scene;
    scene.events.off('player-depleted', this.onDepleted);
    scene.events.off('player-skill', this.onSkill);
    this.clearHazards();
    this.showStars('G', false);
    this.showStars('C', false);
    this.showAlert(false);
    if (scene.pogoTargets) scene.pogoTargets = scene.pogoTargets.filter((o) => !this.pogo.includes(o));
    const p = scene.player;
    if (p && this.savedSpawn) [p.spawnX, p.spawnY] = this.savedSpawn;
    const g = this.g;
    if (g && g.active) {
      this.juiceHold(g, { lean: 0, squash: false });
      g.__scripted = false;
      g.lookAtPlayer = true;
      g.setY(this.groundY);
    }
    if (this.clak && this.clak.active) {
      this.juiceHold(this.clak, { lean: 0 });
      this.clak.__scripted = false;
      this.clak.lookAtPlayer = true;
      if (!keepActors) this.removeClak();
    }
    for (const o of this.objs) if (o && o.active) o.destroy();
    this.objs.clear();
  }

  // --- Géométrie ------------------------------------------------------------
  // Zones de coup fixes (pas de lecture de pixels : identiques en file://).
  geraltRect() {
    const G = this.G;
    if (G.lying) return gdRect(G.x - 38, G.y - 32, 76, 32);
    return gdRect(G.x - 20, G.y - G.lift - 66, 40, 66);
  }

  clakRect() {
    const C = this.C;
    if (!C) return gdRect(-9999, -9999, 1, 1);
    return gdRect(C.x - 22, C.y - 30, 44, 30);
  }

  playerRect(p, pad = 0) {
    const b = p.body;
    return gdRect(b.x - pad, b.y - pad, b.width + 2 * pad, b.height + 2 * pad);
  }

  clampX(x, m = 40) { return Phaser.Math.Clamp(x, this.minX + m, this.maxX - m); }

  // Garde-fou : Agarica ne quitte jamais l'arène en plein duel. Au départ du
  // sprint du loup, sa boîte de collision saute d'~40 px vers le mur ; le mur,
  // épaissi vers l'extérieur (a2Walls, acte2.js), la renvoie normalement
  // dedans. Si elle est quand même passée (centre au-delà du bord intérieur),
  // on la remet dans l'arène : sinon elle se soignait au feu de camp, quittait
  // la zone, ou restait hors de l'écran (caméra calée sur l'arène).
  keepInArena(p) {
    if (!p.body) return;
    const inL = this.minX + 16;
    const inR = this.maxX - 16;
    const cx = p.body.center.x;
    if (cx >= inL && cx <= inR) return;
    const half = p.body.width / 2 + 2;
    const tx = Phaser.Math.Clamp(cx, inL + half, inR - half);
    p.body.reset(p.x + (tx - cx), p.y);
    this.event('player-clamped', { from: Math.round(cx), to: Math.round(tx) });
  }

  // --- Poses et échelle -----------------------------------------------------
  face(dir) {
    if (!dir) return;
    this.G.face = dir;
    setNpcFacing(this.g, dir);
  }

  // Facteur d'échelle d'une anim par rapport à l'idle de Geralt (même taille
  // visible debout, cf. calibrage visuel), avec repli mesuré si les pixels
  // sont illisibles.
  sheetFactor(id, anim) {
    const sc = this.scene;
    if (!hasManifestArt(sc, id, anim)) {
      const def = this.manifest[id] || {};
      return id === 'geralt' ? 1 : (def.scale || this.baseScale) / this.baseScale;
    }
    if (id === 'geralt') {
      if (this.exact) return manifestSheetFactor(sc, 'geralt', anim);
      return GERALT_P2_ANIMS.includes(anim) ? GERALT_P2_FACTOR : 1;
    }
    const opts = { refKey: 'geralt-idle-0', refScale: this.baseScale };
    if (id === 'geralt_invocation') opts.standing = GERALT_INV_STANDING;
    const r = this.exact ? manifestSheetScale(sc, id, anim, opts) : null;
    if (r) return r.scale / this.baseScale;
    if (id === 'geralt_invocation') return GERALT_INV_FACTOR;
    return ((this.manifest[id] || {}).scale || this.baseScale) / this.baseScale;
  }

  // Joue `id-anim` sur le PNJ en gardant `__sheetFactor` cohérent avec
  // playManifest (StoryKit) : en fin de duel, playManifest('idle') le ramène
  // exactement à l'échelle de départ.
  playArt(id, anim, { hold = null, from = null } = {}) {
    const g = this.g;
    const key = `${id}-${anim}`;
    if (!this.scene.anims.exists(key)) ensureManifestAnims(this.scene, id);
    if (!this.scene.anims.exists(key)) return;
    const f = this.sheetFactor(id, anim);
    g.setScale(this.baseScale * f);
    g.__sheetFactor = f;
    g.currentManifestAnim = id === 'geralt' ? anim : `${id}:${anim}`;
    if (g.anims.isPaused) g.anims.resume();
    const a = this.scene.anims.get(key);
    const n = a ? a.frames.length : 1;
    if (from != null) g.play({ key, startFrame: Math.min(from, n - 1) });
    else g.play(key);
    if (hold != null && g.anims.currentAnim) g.anims.pause(g.anims.currentAnim.frames[Math.min(hold, n - 1)]);
  }

  setPose(name, force = false) {
    if (!force && this.poseName === name) return;
    this.poseName = name;
    const spec = GERALT_POSES[name] || GERALT_POSES.idle;
    const useArt = spec.art && this.combatArt && hasManifestArt(this.scene, 'geralt_combat', spec.art.anim);
    const s = useArt ? spec.art : spec.fb;
    this.playArt(useArt ? 'geralt_combat' : 'geralt', s.anim, s);
    this.juiceHold(this.g, { lean: useArt ? 0 : (s.lean || 0) * this.G.face, squash: !useArt && !!s.squash });
  }

  // Inclinaison / accroupi tenus (dessin seul, cf. juiceRender) ; relâcher
  // l'accroupi fait un petit ressort.
  juiceHold(obj, { lean = 0, squash } = {}) {
    if (typeof juiceRender !== 'function') return;
    const j = juiceRender(obj);
    if (!j) return;
    j.lean = lean;
    if (squash === undefined) return;
    if (squash) {
      obj.scene.tweens.killTweensOf(j.sq);
      j.sq.x = 1.08;
      j.sq.y = 0.86;
      obj.__gdSquash = true;
    } else if (obj.__gdSquash) {
      obj.__gdSquash = false;
      juiceSquash(obj, 0.94, 1.08, 200);
    }
  }

  enter(state, d = {}) {
    this.G.state = state;
    this.G.t = 0;
    this.G.d = d;
  }

  event(name, data, once = false) {
    if (once) {
      if (this.seen.has(name)) return;
      this.seen.add(name);
    }
    try { this.onEvent(name, data || {}); } catch (e) { console.error('duel Geralt, événement', name, e); }
  }

  float(x, y, text, color, opts) { return gdFloat(this.scene, x, y, text, color, opts); }

  kill(o) {
    if (!o) return;
    this.objs.delete(o);
    if (o.active) o.destroy();
  }

  track(o) { this.objs.add(o); return o; }

  // --- Indicateurs (étoiles, alerte, marqueurs) ------------------------------
  showStars(who, on) {
    const k = `stars${who}`;
    if (on && !this[k]) {
      const img = addItemImage(this.scene, 0, -999, 'ui_etoiles_etourdi');
      img.setScale(42 / Math.max(img.width, 1)).setDepth(CHARACTER_DEPTH + 2);
      this.scene.tweens.add({ targets: img, angle: { from: -8, to: 8 }, duration: 380, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this[k] = this.track(img);
    } else if (!on && this[k]) {
      this.kill(this[k]);
      this[k] = null;
    }
  }

  // Icône « ! » au-dessus de Geralt (`alert`) ou de Clak (`alertC`).
  showAlert(on, k = 'alert') {
    if (on && !this[k]) {
      const img = addItemImage(this.scene, 0, -999, 'ui_alerte', { origin: [0.5, 1] });
      const s = 24 / Math.max(img.height, 1);
      // Au-dessus des bulles de parole (SPEECH_BUBBLE_DEPTH 1040) : un
      // télégraphe ne doit jamais disparaître sous une réplique de Xara.
      img.setScale(s * 0.3).setDepth(1070);
      this.scene.tweens.add({ targets: img, scale: s, duration: 160, ease: 'Back.easeOut' });
      this[k] = this.track(img);
    } else if (!on && this[k]) {
      this.kill(this[k]);
      this[k] = null;
    }
  }

  addMarker(x, tint) {
    const img = addItemImage(this.scene, x, this.groundY + 1, 'fx_marqueur_danger');
    const s = 46 / Math.max(img.width, 1);
    img.setScale(s).setDepth(CHARACTER_DEPTH - 1).setAlpha(0);
    if (tint) img.setTint(tint);
    this.scene.tweens.add({ targets: img, alpha: 0.95, duration: 140 });
    this.scene.tweens.add({ targets: img, scaleX: s * 1.2, scaleY: s * 1.2, duration: 260, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return this.track(img);
  }

  dropMarker(img) {
    if (!img || !img.active) return;
    this.scene.tweens.killTweensOf(img);
    this.scene.tweens.add({ targets: img, alpha: 0, duration: 160, onComplete: () => this.kill(img) });
  }

  // Tout ce qui blesse ou gêne : flèches, marqueurs, collets, colonne, corde.
  clearHazards() {
    for (const a of this.arrows) { this.dropMarker(a.marker); this.kill(a.img); this.kill(a.glow); }
    this.arrows = [];
    for (const tr of this.traps) { this.kill(tr.img); this.kill(tr.halo); }
    this.traps = [];
    if (this.root) { this.kill(this.root.rope); this.root = null; }
    if (this.G.d && this.G.d.markers) this.G.d.markers.forEach((m) => this.dropMarker(m));
    if (this.G.d && this.G.d.marker) this.dropMarker(this.G.d.marker);
    if (this.G.rope) { this.kill(this.G.rope); this.G.rope = null; }
    if (this.column) { this.kill(this.column); this.column = null; }
    if (this.G.d && this.G.d.glow) this.kill(this.G.d.glow);
    if (this.G.d && this.G.d.ray) this.kill(this.G.d.ray);
    this.showAlert(false);
    this.showAlert(false, 'alertC');
  }

  // --- Coups d'Agarica ------------------------------------------------------
  checkPlayerAttacks(p) {
    const atk = p.getAttackHitbox ? p.getAttackHitbox() : null;
    if (atk) {
      const token = p.eagleDiving ? `dive-${Math.floor(this.now / 500)}` : `atk-${p.attackEndTime}`;
      if (gdHit(atk, this.geraltRect()) && token !== this.G.lastToken) {
        this.G.lastToken = token;
        this.hitGeralt({ kind: p.eagleDiving ? 'dive' : 'melee', player: p, rect: atk, token });
      }
      if (this.C && gdHit(atk, this.clakRect()) && token !== this.C.lastToken) {
        this.C.lastToken = token;
        this.hitClak({ kind: 'melee', player: p, rect: atk });
      }
    }
    // Compétences (ours…) : rectangle émis une fois par activation. Le
    // papillon soigne, il ne blesse pas (ni Geralt, ni Clak).
    const skills = this.pendingSkills;
    this.pendingSkills = [];
    for (const ev of skills) {
      const def = typeof SKILL_DEFS !== 'undefined' ? SKILL_DEFS[ev.skillId] : null;
      if (ev.skillId === 'papillon' || (def && def.heals)) {
        if (gdHit(ev.rect, this.geraltRect())) this.float(this.G.x, this.G.y - 80, 'Ça chatouille !', '#ffe9f5', { size: 13 });
        continue;
      }
      if (gdHit(ev.rect, this.geraltRect())) this.hitGeralt({ kind: 'skill', skillId: ev.skillId, player: p, rect: ev.rect });
      if (this.C && gdHit(ev.rect, this.clakRect())) this.hitClak({ kind: 'skill', skillId: ev.skillId, player: p, rect: ev.rect });
    }
    // Pierres lancées (compétence pierre) : hors du groupe `enemies`.
    if (typeof PierreProjectile === 'function') {
      for (const o of this.scene.children.list) {
        if (!(o instanceof PierreProjectile) || o.done || !o.active) continue;
        const r = o.getBounds();
        if (gdHit(r, this.geraltRect())) { this.hitGeralt({ kind: 'pierre', player: p, x: o.x, y: o.y }); o.shatter(); } else if (this.C && gdHit(r, this.clakRect())) { this.hitClak({ kind: 'pierre', player: p, x: o.x, y: o.y }); o.shatter(); }
      }
    }
  }

  hitGeralt(src) {
    const G = this.G;
    const p = this.scene.player;
    if (!this.active || this.over) return;
    if (G.trance) {
      // Transe : « protégé par ses ancêtres », les coups rebondissent.
      this.float(G.x, G.y - G.lift - 92, 'Ping !', '#fff6e0', { size: 14, ms: 700 });
      if (typeof spawnFx === 'function') spawnFx(this.scene, 'impact', G.x, G.y - G.lift - 40, { power: 0.3, color: 0xfff6e0 });
      return;
    }
    if (G.dodging) {
      if (src.token !== G.dodgeToken) {
        G.dodgeToken = src.token || this.now;
        this.float(G.x, G.y - 84, 'Raté !', '#ffe9f5', { size: 13, ms: 650 });
      }
      return;
    }
    if (this.now < G.invulUntil) return;
    G.invulUntil = this.now + GERALT_DUEL_CFG.hitInvulMs[this.phase - 1];
    this.hits += 1;
    if (p && p.gainEnergy && typeof ENERGY_PER_HIT !== 'undefined') p.gainEnergy(ENERGY_PER_HIT);
    if (typeof juiceOnEnemyHit === 'function') juiceOnEnemyHit(this.scene, this.g, src);
    const ouch = ['Ouille !', 'Aïe, mon orgueil !', 'Pas le visage !', 'Hé ! Doucement !', 'Mes notes !', 'Aïe aïe aïe !', 'Je… je glisse !', 'D\'accord, d\'accord !'];
    this.float(G.x, G.y - G.lift - 88, ouch[(this.hits - 1) % ouch.length], '#ffb0b0');
    this.event('geralt-hit', { hits: this.hits });
    // Victoire TOUT DE SUITE, même en plein saut (il retombe à plat ventre,
    // cf. updateBeatenFall) : attendre sa réception laissait partir son tir
    // plongeant ou une charge de Clak, qui pouvaient prendre le dernier cœur
    // d'Agarica et faire recommencer le duel à zéro.
    if (this.hits >= GERALT_DUEL_CFG.hits) { this.win(); return; }
    if (this.phase === 1 && this.hits >= GERALT_DUEL_CFG.invokeAt) this.pendingInvoke = true;
    if (G.lying) {
      // À terre : il encaisse, mais se relève vite au 2e coup.
      G.downHits += 1;
      if (G.downHits >= GERALT_DUEL_CFG.maxDownHits && G.d.dur) G.d.dur = Math.min(G.d.dur, G.t + 0.3);
      return;
    }
    if (G.air) return; // il retombera mal de toute façon
    this.cancelTele();
    const from = gdSign(G.x - p.x, -G.face);
    G.vx = from * 220;
    this.setPose('hurt');
    this.enter('hurt', { dur: 0.3 });
  }

  hitClak(src) {
    const C = this.C;
    const c = this.clak;
    const p = this.scene.player;
    if (!C || !c || !c.active || C.state === 'hover' || C.state === 'drop' || this.over) return;
    C.state = 'stunned';
    this.showAlert(false, 'alertC');
    C.t = 0;
    C.vx = gdSign(C.x - p.x) * 280;
    c.playManifest('idle');
    if (c.anims.currentAnim) c.anims.pause(c.anims.currentAnim.frames[c.anims.currentAnim.frames.length - 1]);
    this.juiceHold(c, { lean: 0.45 * gdSign(C.vx) });
    this.showStars('C', true);
    if (p && p.gainEnergy && typeof ENERGY_PER_HIT !== 'undefined') p.gainEnergy(ENERGY_PER_HIT);
    if (typeof juiceOnEnemyHit === 'function') juiceOnEnemyHit(this.scene, c, src);
    this.float(C.x, C.y - 38, 'Clac ?!', '#ff9f70', { size: 13, ms: 800 });
    this.event('clak-stunned', null, true);
  }

  // Agarica touchée : 1 cœur (invulnérabilité de Player.hitByEnemy), petit
  // recul si elle survit. Renvoie vrai si le coup a porté.
  hurtPlayer(p, dir = 0, { kx = 200, ky = -220 } = {}) {
    // Duel gagné ou Agarica déjà à terre : plus rien ne blesse.
    if (!p || p.isInvulnerable || this.over || this.down) return false;
    const before = p.hearts;
    p.hitByEnemy();
    const hit = p.hearts < before;
    if (hit && p.hearts > 0 && dir) p.setVelocity(dir * kx, ky);
    return hit;
  }

  // --- Geralt -----------------------------------------------------------------
  geraltBusy() { return ['tele', 'jump', 'invoke'].includes(this.G.state); }
  clakBusy() { return !!this.C && ['chargeTele', 'charge', 'snapTele', 'snap'].includes(this.C.state); }

  updateGeralt(dt, p) {
    const G = this.G;
    const cfg = GERALT_DUEL_CFG;
    G.t += dt;
    const ph = this.phase - 1;
    // Invocation en attente : dès qu'il touche le sol.
    if (this.pendingInvoke && !G.air && !['invoke', 'getup', 'hurt'].includes(G.state)) {
      if (G.lying) { this.endDown(); this.enter('getup', { ms: 0.25 }); this.setPose('getup'); } else this.startInvoke(p);
    }
    const dx = p.x - G.x;
    const toward = gdSign(dx, G.face);
    switch (G.state) {
      case 'pause':
        this.setPose('idle');
        this.face(toward);
        if (G.t >= (G.d.ms || 0.5)) this.enter('move', {});
        break;
      case 'move': {
        const adx = Math.abs(dx);
        const [kMin, kMax] = cfg.keep;
        // Hystérésis : il recule jusqu'à kMin + 40, avance jusqu'à kMax - 40.
        let want = G.d.want || 0;
        if (want === -toward && adx > kMin + 40) want = 0;
        if (want === toward && adx < kMax - 40) want = 0;
        if (!want && adx < kMin) want = -toward;
        if (!want && adx > kMax) want = toward;
        if (want && (G.x + want * 40 < this.minX + 30 || G.x + want * 40 > this.maxX - 30)) want = 0;
        G.d.want = want;
        // Agarica ligotée par un collet : ni roulade ni attaque tant que la
        // corde tient (elle ne peut ni fuir ni sauter : ce serait un coup
        // gratuit). Il se contente de garder ses distances.
        const free = !this.root;
        if (free && this.canEvade(p, adx)) { this.startEvade(p); break; }
        // Dos au mur et elle approche : il lui saute par-dessus (délai court).
        const behind = G.x - toward * 110;
        if (free && adx < 170 && (behind < this.minX + 20 || behind > this.maxX - 20) && this.now >= G.cornerReadyAt) { this.startEvade(p); break; }
        if (want) {
          G.x = this.clampX(G.x + want * cfg.walk[ph] * dt, 30);
          this.face(want);
          this.setPose('walk');
        } else {
          this.face(toward);
          this.setPose('idle');
        }
        if (free && !this.down && this.now >= G.nextAttackAt && !this.clakBusy()) {
          const atk = this.pickAttack(p);
          // Collée à lui, une fois sur deux : roulade arrière, puis tir ou
          // collet à la réception (cf. pickAttack).
          if (atk === 'evade') this.startEvade(p, this.followUp());
          else this.startTele(atk, p);
        }
        break;
      }
      case 'tele':
        if (G.d.atk === 'shot' && !G.d.glint && G.t >= G.d.dur - 0.22) {
          G.d.glint = true;
          spawnFx(this.scene, 'glint', G.x + G.face * 24, G.y - 42, { tint: 0xfff6c2 });
        }
        if (G.t >= G.d.dur) this.fireTele(p);
        break;
      case 'recover':
        // Phase 2 : il ne se laisse plus cueillir juste après un tir.
        if (this.phase === 2 && this.canEvade(p, Math.abs(dx))) { this.startEvade(p); break; }
        if (G.t >= (G.d.ms || 0.4)) {
          this.enter('move', {});
          G.nextAttackAt = this.now + this.rng.between(...cfg.rest[ph]) * this.ease();
        }
        break;
      case 'jump': this.updateJump(dt, p); break;
      case 'evade': {
        const next = G.d.then;
        this.updateAir(dt, () => {
          G.dodging = false;
          this.face(gdSign(p.x - G.x, G.face));
          this.enter('move', {});
          // Roulade « attaque » : il enchaîne aussitôt son tir ou son collet
          // (sauf si Clak attaque ou si elle est ligotée : un peu plus tard).
          if (next && !this.root && !this.clakBusy()) { this.startTele(next, p); return; }
          // Elle le talonne : il riposte vite ; sinon, petite pause.
          if (Math.abs(p.x - G.x) < 230) G.nextAttackAt = Math.min(G.nextAttackAt, this.now + 300);
          else G.nextAttackAt = Math.max(G.nextAttackAt, this.now + 300);
        });
        break;
      }
      case 'hurt':
        G.x = this.clampX(G.x + G.vx * dt, 30);
        G.vx *= Math.max(0, 1 - 7 * dt);
        // Touché debout : il file aussitôt (roulade, ou par-dessus elle dos
        // au mur) -- sinon on l'enchaînait contre le mur, 4 coups en 2 s.
        if (G.t >= G.d.dur) this.startEvade(p);
        break;
      case 'crash':
      case 'trapped':
        if (G.state === 'crash') {
          G.x = this.clampX(G.x + G.vx * dt, 30);
          G.vx *= Math.max(0, 1 - 6 * dt);
        }
        if (G.t >= (G.state === 'crash' ? 0.2 : 0.32)) this.setPose('down');
        if (G.t >= 0.25) this.showStars('G', true);
        if (G.rope) this.drawRope(G.rope, G.d.trap.x + 10, this.groundY - 5, G.x - G.face * 28, this.groundY - 8);
        if (G.t >= G.d.dur) {
          this.endDown();
          this.setPose('getup');
          this.enter('getup', { ms: 0.32 });
        }
        break;
      case 'getup':
        if (G.t >= G.d.ms) {
          G.lying = false;
          this.face(toward);
          this.enter('move', {});
          G.nextAttackAt = this.now + this.rng.between(...cfg.rest[ph]) * 0.6 * this.ease();
        }
        break;
      case 'invoke': this.updateInvoke(dt, p); break;
      default: break;
    }
  }

  // Roulade d'esquive possible ? (Agarica trop près, délai écoulé, pas
  // ligotée.) Phase 1 : seulement si elle arrive à pied -- en sautant, on le
  // surprend. Phase 2 : toujours, même juste après un tir (cf. 'recover') :
  // au playtest, l'essentiel des coups tombait sur un Geralt debout qu'on
  // talonnait ; ils doivent venir des fenêtres (réception ratée, collet,
  // télégraphe, Clak sonné qui laisse le champ libre).
  canEvade(p, adx) {
    const G = this.G;
    if (this.root || adx >= GERALT_DUEL_CFG.evadeRange || this.now < G.evadeReadyAt) return false;
    return this.phase === 2 || p.body.blocked.down;
  }

  // Fin d'une chute (crash ou collet) : étoiles, corde et collet retirés.
  endDown() {
    const G = this.G;
    this.showStars('G', false);
    G.downHits = 0;
    if (G.rope) { this.kill(G.rope); G.rope = null; }
    if (G.d && G.d.trap) this.removeTrap(G.d.trap);
  }

  pickAttack(p) {
    const G = this.G;
    const adx = Math.abs(p.x - G.x);
    const back = G.x - G.face * 90;
    const cornered = back < this.minX + 40 || back > this.maxX - 40;
    const armed = this.traps.filter((t) => t.state !== 'sprung').length;
    let a;
    // Collée à lui (ou lui dos au mur) : une fois sur deux, il saute par-dessus
    // elle en tirant vers le bas… et se rate à la réception derrière elle ;
    // sinon roulade arrière puis tir ou collet (startEvade + followUp). Forcer
    // le saut à chaque fois écrasait la variété (50 % de sauts au playtest).
    if (adx < 150 || (adx < 200 && cornered)) {
      G.closeFlip = !G.closeFlip;
      if (!G.closeFlip) return 'evade';
      a = 'jump';
    } else if (this.opening.length) a = this.opening.shift();
    else {
      if (!this.bag.length) {
        const set = this.phase === 1 ? ['lob', 'shot', 'trap', 'jump'] : ['lob', 'shot', 'trap', 'jump', 'lob', 'shot'];
        this.bag = this.rng.shuffle(set.slice());
      }
      a = this.bag.shift();
      // Pas plus de 3 attaques sans le saut raté (la fenêtre de frappe).
      if (G.sinceJump >= 3) a = 'jump';
    }
    if (a === 'trap' && armed >= GERALT_DUEL_CFG.trapMax) a = 'lob';
    G.sinceJump = a === 'jump' ? 0 : G.sinceJump + 1;
    return a;
  }

  // Attaque qui suit une roulade « offensive » : tir droit ou collet (le
  // collet seulement s'il en reste à poser).
  followUp() {
    const G = this.G;
    const armed = this.traps.filter((t) => t.state !== 'sprung').length;
    const a = armed < GERALT_DUEL_CFG.trapMax && this.rng.frac() < 0.5 ? 'trap' : 'shot';
    G.sinceJump += 1;
    return a;
  }

  startTele(atk, p) {
    const G = this.G;
    const cfg = GERALT_DUEL_CFG;
    this.face(gdSign(p.x - G.x, G.face));
    const d = { atk, dur: (cfg.teleMs[atk] * cfg.teleFactor[this.phase - 1] * this.teleEase()) / 1000 };
    // Collée à lui : saut d'esquive plus vif (plus dur à couper en plein élan).
    if (atk === 'jump' && Math.abs(p.x - G.x) < 150) d.dur *= 0.7;
    if (atk === 'lob') {
      this.setPose('aim_up');
      const lead = Phaser.Math.Clamp(p.body.velocity.x * 0.3, -90, 90);
      const tx = this.clampX(p.x + lead, 30);
      d.targets = [tx];
      if (this.phase === 2) {
        const side = this.rng.pick([-1, 1]);
        let tx2 = this.clampX(tx + side * 125, 30);
        if (Math.abs(tx2 - tx) < 60) tx2 = this.clampX(tx - side * 125, 30);
        d.targets.push(tx2);
      }
      d.markers = d.targets.map((x) => this.addMarker(x));
      this.float(G.x, G.y - 84, this.phase === 1 ? 'Flèche du Héron !' : 'Pluie du Héron !');
    } else if (atk === 'shot') {
      this.setPose('aim');
      this.showAlert(true);
      this.float(G.x, G.y - 104, 'Tir du Faucon !');
      this.event('shot', null, true);
    } else if (atk === 'jump') {
      this.setPose('crouch');
      this.float(G.x, G.y - 84, 'Bond du Blaireau !');
    } else {
      this.setPose('set_trap');
      this.float(G.x, G.y - 84, 'Piège du Ranger !');
    }
    this.enter('tele', d);
  }

  cancelTele() {
    const G = this.G;
    if (G.state !== 'tele') return;
    (G.d.markers || []).forEach((m) => this.dropMarker(m));
    this.showAlert(false);
    this.juiceHold(this.g, { lean: 0, squash: false });
  }

  fireTele(p) {
    const G = this.G;
    const cfg = GERALT_DUEL_CFG;
    const d = G.d;
    this.showAlert(false);
    const speed = cfg.arrowSpeed[this.phase - 1];
    if (d.atk === 'lob') {
      d.targets.forEach((tx, i) => this.fireLob(tx, d.markers[i], cfg.lobMs / 1000 + i * 0.16));
      this.setPose('loose_up');
      this.enter('recover', { ms: 0.4 });
    } else if (d.atk === 'shot') {
      const a = this.spawnArrow(G.x + G.face * 24, G.y - 40, G.face * speed, 0, 0);
      if (a) spawnFx(this.scene, 'streaks', a.x, a.y, { dir: G.face, count: 2 });
      this.setPose('loose');
      if (typeof juiceRecoil === 'function') juiceRecoil(this.g, -G.face * 5, 0, 140);
      this.enter('recover', { ms: 0.4 });
    } else if (d.atk === 'jump') {
      this.startJump(p);
    } else {
      this.placeTrap(p);
      this.juiceHold(this.g, { squash: false });
      this.setPose('idle');
      this.enter('recover', { ms: 0.45 });
    }
  }

  // --- Saut en cloche, tir plongeant, réception ratée -----------------------
  startJump(p) {
    const G = this.G;
    const cfg = GERALT_DUEL_CFG;
    const face = G.face;
    const adx = Math.abs(p.x - G.x);
    // Loin : il retombe juste devant elle ; près : par-dessus elle.
    let land = adx > 220 ? p.x - face * 95 : p.x + face * 120;
    land = this.clampX(land, 40);
    if (Math.abs(land - p.x) < 50) land = this.clampX(p.x - face * 95, 40);
    const T = cfg.jumpAirMs / 1000;
    G.vx = (land - G.x) / T;
    G.vy = (-cfg.gravity * T) / 2;
    G.air = true;
    this.juiceHold(this.g, { squash: false });
    this.setPose('air');
    spawnFx(this.scene, 'land', G.x, this.groundY, { power: 0.4 });
    // Marqueur sous Agarica pendant l'ascension : « il tirera là où tu es
    // quand il sera en haut » -- il la suit, puis se fige au tir.
    this.enter('jump', { marker: this.addMarker(p.x) });
  }

  // Intégration d'un saut ; `onLand` à la réception (sauf collet).
  updateAir(dt, onLand) {
    const G = this.G;
    G.vy += GERALT_DUEL_CFG.gravity * dt;
    const nx = G.x + G.vx * dt;
    G.x = this.clampX(nx, 30);
    if (G.x !== nx) G.vx = 0;
    G.y += G.vy * dt;
    if (G.y >= this.groundY && G.vy > 0) {
      G.y = this.groundY;
      G.air = false;
      G.dodging = false;
      const trap = this.trapAt(G.x);
      if (trap) { this.springOnGeralt(trap); return; }
      onLand();
    }
  }

  updateJump(dt, p) {
    const G = this.G;
    const d = G.d;
    // Éclat sur l'arc juste avant le tir (≈ 0,15 s avant le sommet).
    if (!d.glint && G.vy > -230) {
      d.glint = true;
      spawnFx(this.scene, 'glint', G.x + G.face * 10, G.y - 46, { tint: 0xfff6c2 });
    }
    if (!d.shot && d.marker && d.marker.active) d.marker.x = this.clampX(p.x, 20);
    if (!d.shot && G.vy >= 0) {
      // Au sommet : tir plongeant vers Agarica (là où elle est À CET INSTANT ;
      // en bougeant, on l'évite).
      d.shot = true;
      const x0 = G.x + G.face * 10;
      const y0 = G.y - 40;
      const tx = p.x;
      const ty = p.body.center.y;
      const L = Math.max(1, Math.hypot(tx - x0, ty - y0));
      // Plus lente que le tir droit (400 / 480 px/s) : c'était de loin la
      // 1re source de cœurs perdus des bots débutants (immobiles en pleine
      // frappe, ils n'avaient que ~0,3 s) ; rester en mouvement l'évite.
      const v = (GERALT_DUEL_CFG.arrowSpeed[this.phase - 1] - 140) / this.teleEase();
      const a = this.spawnArrow(x0, y0, ((tx - x0) / L) * v, ((ty - y0) / L) * v, 300);
      a.marker = d.marker;
      d.marker = null;
      this.setPose('air_shot');
      this.float(G.x, G.y - 90, 'Ha !', '#ffd27a', { size: 14, ms: 600 });
      this.event('jump-shot', null, true);
    }
    this.updateAir(dt, () => this.startCrash());
  }

  startCrash() {
    const G = this.G;
    G.lying = true;
    G.vx *= 0.35;
    this.setPose('crash');
    this.enter('crash', { dur: GERALT_DUEL_CFG.crashMs[this.phase - 1] / 1000 });
    spawnFx(this.scene, 'land', G.x, this.groundY, { power: 1 });
    juiceShake(this.scene, 'light');
    const lines = ['Aïe… mon dos !', 'Le sol a bougé !', 'C\'était voulu.', 'Ouf…'];
    this.float(G.x, G.y - 56, lines[this.rng.between(0, lines.length - 1)], '#ffd27a');
    this.event('crash', null, true);
  }

  // Roulade arrière (ou par-dessus elle, dos au mur). `then` : attaque
  // lancée dès la réception (roulade choisie comme attaque, cf. pickAttack).
  startEvade(p, then = null) {
    const G = this.G;
    const away = -gdSign(p.x - G.x, G.face);
    // Roulade d'environ 200 px ; dos au mur, saut par-dessus elle (~280 px).
    let vx = away * 330;
    let vy = -460;
    if (G.x + away * 180 < this.minX + 30 || G.x + away * 180 > this.maxX - 30) { vx = -away * 360; vy = -680; }
    G.vx = vx;
    G.vy = vy;
    G.air = true;
    G.dodging = true;
    G.evadeReadyAt = this.now + GERALT_DUEL_CFG.evadeEveryMs[this.phase - 1];
    G.cornerReadyAt = this.now + 1500;
    this.face(gdSign(p.x - G.x, G.face));
    this.setPose('hop');
    spawnFx(this.scene, 'land', G.x, this.groundY, { power: 0.3 });
    if (this.rng.frac() < 0.4) this.float(G.x, G.y - 84, 'Hop !', '#ffd27a', { size: 13, ms: 700 });
    this.enter('evade', { then });
  }

  // --- Flèches ----------------------------------------------------------------
  spawnArrow(x, y, vx, vy, grav) {
    const img = addItemImage(this.scene, x, y, 'objet_fleche', { origin: [0.95, 0.5] });
    // Au-dessus des bulles de parole (1040) : une flèche cachée par une
    // réplique serait un coup injuste.
    img.setScale(GERALT_DUEL_CFG.arrowLen / Math.max(img.width, 1)).setDepth(1046);
    img.setRotation(Math.atan2(vy, vx));
    // Halo additif sous la flèche : brune sur la forêt sombre, on la perdait de vue.
    const glow = this.scene.add.image(x, y, gdArrowGlowTexture(this.scene)).setOrigin(0.8, 0.5)
      .setDisplaySize(GERALT_DUEL_CFG.arrowLen * 1.6, 14).setBlendMode(Phaser.BlendModes.ADD)
      .setTint(0xfff2c0).setAlpha(0.7).setDepth(1045).setRotation(img.rotation);
    const a = { img, glow, x, y, vx, vy, grav, state: 'fly', t: 0 };
    this.arrows.push(a);
    this.track(img);
    this.track(glow);
    return a;
  }

  // Flèche en cloche qui retombe pile sur `tx` après T secondes.
  fireLob(tx, marker, T) {
    const G = this.G;
    const g = GERALT_DUEL_CFG.lobGravity;
    const x0 = G.x + G.face * 16;
    const y0 = G.y - 50;
    const ty = this.groundY - 1;
    const a = this.spawnArrow(x0, y0, (tx - x0) / T, (ty - y0 - 0.5 * g * T * T) / T, g);
    a.marker = marker;
    a.lob = true;
  }

  updateArrows(dt, p) {
    const atk = p.getAttackHitbox ? p.getAttackHitbox() : null;
    const body = this.playerRect(p, 2);
    for (const a of this.arrows) {
      a.t += dt;
      if (a.state === 'fly' || a.state === 'broken') {
        a.vy += a.grav * dt;
        a.x += a.vx * dt;
        a.y += a.vy * dt;
        a.img.setPosition(a.x, a.y);
        if (a.state === 'broken') {
          a.img.rotation += a.spin * dt;
          if (a.t > 0.6) a.state = 'gone';
          continue;
        }
        a.img.setRotation(Math.atan2(a.vy, a.vx));
        a.glow.setPosition(a.x, a.y).setRotation(a.img.rotation);
        const mx = a.x - Math.cos(a.img.rotation) * 16;
        const my = a.y - Math.sin(a.img.rotation) * 16;
        // Parade : l'arc d'Agarica coupe la flèche en vol.
        if (atk && !this.over && (atk.contains(a.x, a.y) || atk.contains(mx, my))) { this.breakArrow(a); continue; }
        if (!this.over && !this.down && (body.contains(a.x, a.y) || body.contains(mx, my)) && !p.isInvulnerable) {
          if (this.hurtPlayer(p, gdSign(a.vx, 0))) {
            // Dernier cœur : playerDown() a déjà tout nettoyé.
            if (this.down || this.disposed) return;
            if (a.lob) this.event('lob', null, true);
            this.dropMarker(a.marker);
            spawnFx(this.scene, 'impact', a.x, a.y, { power: 0.4, color: 0xffb0b0 });
            a.state = 'gone';
            continue;
          }
        }
        if (a.y >= this.groundY - 1 && a.vy > 0) {
          // Plantée dans le sol (pointe enfoncée), puis s'efface.
          a.state = 'stuck';
          this.kill(a.glow);
          a.t = 0;
          a.y = this.groundY + 3;
          a.img.setPosition(a.x, a.y);
          this.dropMarker(a.marker);
          spawnFx(this.scene, 'step', a.x, this.groundY, { dir: gdSign(a.vx), power: 0.6, count: 2 });
          // Conseil de Xara APRÈS la 1re flèche en cloche : sa bulle, au-dessus
          // d'Agarica, masquait la flèche qui retombait.
          if (a.lob) this.event('lob', null, true);
        } else if (a.x < this.minX - 40 || a.x > this.maxX + 40 || a.t > 4) a.state = 'gone';
      } else if (a.state === 'stuck' && a.t > 1.4) {
        a.state = 'fading';
        this.scene.tweens.add({ targets: a.img, alpha: 0, duration: 300, onComplete: () => this.kill(a.img) });
      }
    }
    for (const a of this.arrows) if (a.state === 'gone') { this.dropMarker(a.marker); this.kill(a.img); this.kill(a.glow); }
    this.arrows = this.arrows.filter((a) => a.state !== 'gone' && !(a.state === 'fading' && !a.img.active));
  }

  breakArrow(a) {
    this.kill(a.glow);
    this.dropMarker(a.marker);
    a.marker = null;
    a.state = 'broken';
    a.t = 0;
    a.vx = -a.vx * 0.15;
    a.vy = -220;
    a.grav = 1300;
    a.spin = gdSign(a.vx) * 14;
    this.scene.tweens.add({ targets: a.img, alpha: 0, delay: 250, duration: 300 });
    spawnFx(this.scene, 'impact', a.x, a.y, { power: 0.5 });
    if (typeof juiceHitStop === 'function') juiceHitStop(this.scene, 30);
    this.event('parry', null, true);
  }

  // --- Collets ---------------------------------------------------------------
  // Phase 1 : posé devant lui ; phase 2 : lancé entre eux deux. Jamais sous
  // les pieds d'Agarica, ni collé à un autre collet, ni devant un décor qui
  // le cacherait (`noTrap` : les fleurs hautes, où on ne le voyait pas du
  // tout) : premier emplacement libre parmi des candidats, par ordre de
  // préférence ; aucun -> pas de collet cette fois.
  trapSpot(p) {
    const G = this.G;
    const f = G.face;
    const adx = Math.abs(p.x - G.x);
    const base = this.phase === 1 ? G.x + f * 46 : G.x + f * Math.min(adx * 0.6, 220);
    const cands = [base, G.x + f * 30, base - f * 50];
    // Dans une plage interdite : décalé juste au bord, côté Agarica d'abord.
    const half = GERALT_DUEL_CFG.trapW / 2;
    for (const [a, b] of this.noTrap) {
      if (base <= a - half || base >= b + half) continue;
      const left = a - half - 4;
      const right = b + half + 4;
      cands.splice(1, 0, ...(p.x < base ? [left, right] : [right, left]));
    }
    // En dernier recours : derrière lui.
    cands.push(G.x - f * 40, G.x - f * 90);
    for (const c of cands) {
      const x = this.clampX(c, 40);
      if (this.trapSpotOk(x, p)) return x;
    }
    return null;
  }

  trapSpotOk(x, p) {
    const half = GERALT_DUEL_CFG.trapW / 2;
    if (Math.abs(x - p.x) < 50) return false;
    if (this.traps.some((t) => Math.abs(t.x - x) < 44)) return false;
    return !this.noTrap.some(([a, b]) => x > a - half && x < b + half);
  }

  placeTrap(p) {
    const G = this.G;
    const x = this.trapSpot(p);
    if (x == null) { this.float(G.x, G.y - 84, 'Euh… pas ici.', '#ffd27a', { size: 13, ms: 800 }); return; }
    const img = addItemImage(this.scene, x, this.groundY + 2, 'objet_collet', { origin: [0.5, 1] });
    const s = GERALT_DUEL_CFG.trapW / Math.max(img.width, 1);
    img.setScale(s).setDepth(CHARACTER_DEPTH - 1);
    const trap = { img, x, s, state: 'setting', t: 0, ownerClear: false, glintAt: this.now + 700 };
    // Lancé depuis sa main (cloche basse et courte en phase 1, longue en
    // phase 2) : on voit où il tombe.
    trap.state = 'flying';
    trap.x0 = G.x + G.face * 12;
    trap.y0 = G.y - 40;
    trap.T = this.phase === 2 ? 0.55 : 0.32;
    trap.arc = this.phase === 2 ? 70 : 26;
    img.setPosition(trap.x0, trap.y0);
    this.traps.push(trap);
    this.track(img);
    this.event('trap', null, true);
  }

  trapAt(x) {
    return this.traps.find((t) => t.state === 'armed' && Math.abs(t.x - x) < 16) || null;
  }

  removeTrap(trap) {
    if (!trap) return;
    trap.state = 'sprung';
    this.traps = this.traps.filter((t) => t !== trap);
    for (const o of [trap.img, trap.halo]) {
      if (!o || !o.active) continue;
      this.scene.tweens.killTweensOf(o);
      this.scene.tweens.add({ targets: o, alpha: 0, duration: 260, onComplete: () => this.kill(o) });
    }
  }

  // Halo additif pâle sous un collet posé, qui pulse doucement : sans lui, le
  // collet (brun, 34 px) disparaissait dans l'herbe. Visible mais discret.
  addTrapHalo(trap) {
    const sc = this.scene;
    const halo = sc.add.image(trap.x, this.groundY - 5, gdArrowGlowTexture(sc))
      .setDisplaySize(48, 12).setBlendMode(Phaser.BlendModes.ADD).setTint(0xfff0c8)
      .setAlpha(0).setDepth(CHARACTER_DEPTH - 2);
    trap.halo = this.track(halo);
    sc.tweens.add({ targets: halo, alpha: 0.6, duration: 220, onComplete: () => {
      if (halo.active) sc.tweens.add({ targets: halo, alpha: { from: 0.6, to: 0.35 }, duration: 750, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    } });
  }

  updateTraps(dt, p) {
    const G = this.G;
    for (const tr of this.traps.slice()) {
      tr.t += dt;
      if (tr.state === 'flying') {
        const k = Math.min(1, tr.t / tr.T);
        const x = tr.x0 + (tr.x - tr.x0) * k;
        const y = tr.y0 + (this.groundY + 2 - tr.y0) * k - Math.sin(k * Math.PI) * tr.arc;
        tr.img.setPosition(x, y).setAngle(k * 360 * gdSign(tr.x - tr.x0));
        if (k >= 1) {
          tr.state = 'setting';
          tr.t = 0;
          tr.img.setAngle(0).setPosition(tr.x, this.groundY + 2);
          spawnFx(this.scene, 'land', tr.x, this.groundY, { power: 0.25 });
          this.addTrapHalo(tr);
        }
        continue;
      }
      if (tr.state === 'setting' && tr.t >= GERALT_DUEL_CFG.trapArmMs / 1000) tr.state = 'armed';
      if (tr.state !== 'armed') continue;
      // Visible mais discret : halo qui pulse, et un éclat régulier.
      if (this.now >= tr.glintAt) {
        tr.glintAt = this.now + this.rng.between(700, 1000);
        spawnFx(this.scene, 'glint', tr.x + this.rng.between(-10, 10), this.groundY - 6, { tint: 0xffe2b0 });
      }
      // Geralt ne se prend dans un collet qu'après s'en être éloigné (pas en
      // le posant) : il l'oublie ensuite, et c'est là qu'on peut l'y attirer.
      if (!tr.ownerClear && Math.abs(G.x - tr.x) > 80) tr.ownerClear = true;
      const feetOn = p.body.blocked.down && p.body.bottom >= this.groundY - 6 && Math.abs(p.x - tr.x) < 17;
      if (!this.root && feetOn) {
        this.springOnPlayer(tr, p);
        if (this.down || this.disposed) return; // collets déjà retirés
        continue;
      }
      if (tr.ownerClear && !G.air && GERALT_TRAPPABLE.includes(G.state) && Math.abs(G.x - tr.x) < 14) this.springOnGeralt(tr);
    }
  }

  springOnPlayer(trap, p) {
    trap.state = 'sprung';
    // Le collet ne retient Agarica que s'il lui retire un cœur : encore
    // invulnérable (coup reçu juste avant), il se referme à vide et casse.
    // Sinon elle restait ligotée après la fin de son invulnérabilité, offerte
    // aux flèches et aux charges de Clak (jusqu'à 560 ms au playtest).
    const hurt = this.hurtPlayer(p, 0);
    if (this.down || this.disposed) return; // dernier cœur : playerDown() a tout nettoyé
    if (!hurt) {
      this.removeTrap(trap);
      this.float(p.x, p.y - 84, 'Le collet casse !', '#ffe9f5', { size: 13, ms: 800 });
      spawnFx(this.scene, 'chip', trap.x, this.groundY - 4, { count: 3 });
      return;
    }
    const rope = this.track(this.scene.add.graphics().setDepth(CHARACTER_DEPTH + 1));
    this.root = { until: this.now + GERALT_DUEL_CFG.trapRootMs, x: p.x, trap, rope };
    this.scene.tweens.add({ targets: trap.img, scaleX: trap.s * 0.6, duration: 120 });
    p.setVelocity(0, 0);
    this.float(p.x, p.y - 84, 'Coincée !', '#ffb0b0', { size: 14 });
    juiceShake(this.scene, 'tiny');
    spawnFx(this.scene, 'chip', trap.x, this.groundY - 4, { count: 4 });
    this.event('player-trapped', null, true);
  }

  // Immobilisée : ni course ni saut tant que la corde tient.
  updateRoot(p) {
    const r = this.root;
    if (!r) return;
    if (this.now >= r.until || this.down) {
      this.kill(r.rope);
      this.removeTrap(r.trap);
      spawnFx(this.scene, 'chip', p.x, this.groundY - 6, { count: 3 });
      this.root = null;
      return;
    }
    p.setVelocityX(0);
    p.x = r.x;
    if (p.body.velocity.y < 0) p.setVelocityY(0);
    this.drawRope(r.rope, r.trap.x + 10, this.groundY - 5, p.x, this.groundY - 6);
  }

  springOnGeralt(trap) {
    const G = this.G;
    trap.state = 'sprung';
    G.vx = 0;
    G.lying = true;
    this.cancelTele();
    this.setPose('trapped');
    G.rope = this.track(this.scene.add.graphics().setDepth(CHARACTER_DEPTH + 1));
    this.enter('trapped', { dur: GERALT_DUEL_CFG.trappedMs / 1000, trap });
    juiceShake(this.scene, 'tiny');
    spawnFx(this.scene, 'land', G.x, this.groundY, { power: 0.7 });
    this.float(G.x, G.y - 70, 'Ce n\'était PAS prévu !', '#ffd27a');
    this.event('geralt-trapped', null, true);
  }

  drawRope(gfx, x0, y0, x1, y1) {
    gfx.clear();
    gfx.lineStyle(2, 0xc9a26b, 1);
    const sag = Math.min(10, Math.abs(x1 - x0) * 0.15);
    const curve = new Phaser.Curves.QuadraticBezier(
      new Phaser.Math.Vector2(x0, y0), new Phaser.Math.Vector2((x0 + x1) / 2, Math.max(y0, y1) + sag), new Phaser.Math.Vector2(x1, y1));
    curve.draw(gfx, 12);
  }

  // --- Invocation de Clak -------------------------------------------------------
  startInvoke(p) {
    const G = this.G;
    this.pendingInvoke = false;
    this.cancelTele();
    this.showStars('G', false);
    G.trance = true;
    G.lying = false;
    G.vx = 0;
    this.face(gdSign(p.x - G.x, G.face));
    // Pose de prière (debout, même hauteur visible que l'idle).
    this.poseName = 'invoke';
    this.juiceHold(this.g, { lean: 0, squash: false });
    this.playArt('geralt_invocation', 'rise', { hold: 0 });
    this.float(G.x, G.y - 96, 'ASSEZ ! CLAK… À MOI !', '#ffd27a', { size: 16, ms: 1500 });
    this.enter('invoke', {});
    this.event('invoke');
  }

  columnScale() {
    const clakScale = (this.manifest.clak && this.manifest.clak.scale) || 0.19;
    return clakScale * GERALT_COLUMN.clakRatio;
  }

  updateInvoke(dt, p) {
    const G = this.G;
    const d = G.d;
    const t = G.t;
    const col = GERALT_COLUMN;
    // 1. Prière, puis élévation (rise, 4 frames à 6 i/s).
    if (!d.risen && t >= 0.3) { d.risen = true; this.playArt('geralt_invocation', 'rise'); }
    if (t >= 0.3 && t < 1) G.lift = col.lift * Math.sin(((t - 0.3) / 0.7) * Math.PI / 2);
    // 2. Canalisation (yeux blancs, bras levés) ; la cible = Agarica maintenant.
    if (!d.channel && t >= 1) {
      d.channel = true;
      this.playArt('geralt_invocation', 'channel', { hold: 1 });
      d.tx = this.clampX(p.x, 50);
      // Repère : le marqueur de danger (comme pour les flèches), une lueur au
      // sol et un rai de lumière qui s'intensifie jusqu'à la chute.
      d.marker = this.addMarker(d.tx);
      const sc = this.scene;
      const glowKey = sc.textures.exists('item-fx_lueur_sol') ? 'item-fx_lueur_sol' : gdBeamTexture(sc);
      d.glow = this.track(sc.add.image(d.tx, this.groundY + 4, glowKey).setOrigin(0.5, 1)
        .setDisplaySize(96, 26).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0).setDepth(CHARACTER_DEPTH - 1));
      sc.tweens.add({ targets: d.glow, alpha: 0.9, duration: 500 });
      const rayKey = sc.textures.exists('item-fx_rai_lumiere') ? 'item-fx_rai_lumiere' : gdBeamTexture(sc);
      d.ray = this.track(sc.add.image(d.tx, this.groundY, rayKey).setOrigin(0.5, 1)
        .setDisplaySize(58, 190).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0).setDepth(CHARACTER_DEPTH + 1));
      sc.tweens.add({ targets: d.ray, alpha: 0.6, duration: GERALT_COLUMN.teleMs * this.teleEase() * 0.9, ease: 'Quad.easeIn' });
      this.float(d.tx, this.groundY - 96, '!', '#fff6e0', { size: 26, ms: 900 });
      d.moteAt = 0;
      this.event('invoke-target', { x: d.tx });
    }
    if (d.channel && !d.slam) {
      G.lift = col.lift + Math.sin((t - 1) * 7) * 4;
      if (t >= d.moteAt) {
        d.moteAt = t + 0.12;
        spawnFx(this.scene, 'motes', d.tx + this.rng.between(-14, 14), this.groundY - 8, { count: 2, color: 0xfff6e0, spread: 8 });
      }
    }
    // 3. La colonne s'abat.
    if (d.channel && !d.slam && t >= 1 + (col.teleMs * this.teleEase()) / 1000) {
      d.slam = true;
      d.slamT = t;
      this.columnSlam(d);
    }
    if (!d.slam) return;
    const s = t - d.slamT;
    const c = this.column;
    if (c && c.active && c.anims && c.anims.currentAnim) {
      const fr = s < 0.07 ? 0 : (s < 0.15 ? 1 : (s < 0.5 ? 2 : 3));
      if (fr !== d.colFrame) { d.colFrame = fr; c.anims.pause(c.anims.currentAnim.frames[Math.min(fr, c.anims.currentAnim.frames.length - 1)]); }
    }
    // Agarica dans la colonne : 1 cœur, projetée hors de la lumière.
    if (!d.hitDone && s >= 0.06 && s <= 0.3) {
      const r = gdRect(d.tx - col.halfW, this.groundY - this.columnHeight(), col.halfW * 2, this.columnHeight());
      if (gdHit(r, this.playerRect(p)) && this.hurtPlayer(p, gdSign(p.x - d.tx), { kx: 280, ky: -330 })) {
        d.hitDone = true;
        this.event('column-hit', null, true);
      }
    }
    // 4. Le vrai Clak remplace celui de la colonne (même taille, même place).
    if (!d.clak && s >= 0.75) {
      d.clak = true;
      const cs = this.columnScale();
      const clakScale = (this.manifest.clak && this.manifest.clak.scale) || 0.19;
      const y = this.groundY - (col.clakBottom - col.margin) * cs + (col.sheetBottom - col.sheetMargin) * clakScale;
      this.spawnClak(d.tx, y);
      if (c && c.active) this.scene.tweens.add({ targets: c, alpha: 0, duration: 260, onComplete: () => { this.kill(c); if (this.column === c) this.column = null; } });
      for (const o of [d.glow, d.ray]) if (o && o.active) this.scene.tweens.add({ targets: o, alpha: 0, duration: 260, onComplete: () => this.kill(o) });
    }
    if (!d.drop && s >= 0.95) {
      d.drop = true;
      if (this.C) { this.C.state = 'drop'; this.C.vy = 0; }
      // Fin de transe : les yeux reviennent, Geralt redescend.
      this.playArt('geralt_invocation', 'channel', { from: 2 });
    }
    if (d.drop) G.lift = Math.max(0, col.lift * (1 - (s - 0.95) / 0.4));
    if (s >= 1.5) {
      G.lift = 0;
      G.trance = false;
      this.phase = 2;
      this.setPose('idle', true);
      spawnFx(this.scene, 'land', G.x, this.groundY, { power: 0.4 });
      this.float(G.x, G.y - 90, 'Il est lourd, cet ancêtre…', '#ffd27a');
      this.healBreath(p);
      this.enter('recover', { ms: 0.8 });
      G.nextAttackAt = this.now + 1700;
      this.bag = [];
      this.event('phase2');
    }
  }

  // Souffle entre les deux phases : la lumière ancestrale qui retombe rend
  // 1 cœur à Agarica s'il lui en manque. Bots de playtest : on entrait souvent
  // en phase 2 (Geralt + Clak) à 1-2 cœurs, et elle tombait en quelques
  // secondes ; une joueuse encore intacte n'y gagne rien.
  healBreath(p) {
    if (!p || p.hearts <= 0 || p.hearts >= p.maxHearts) return;
    p.hearts += 1;
    this.scene.registry.set('hearts', p.hearts);
    spawnFx(this.scene, 'heal', p.x, p.body.center.y);
    this.float(p.x, p.body.top - 8, '+1 cœur', '#ffb3d9', { size: 14 });
    this.event('heal');
  }

  columnHeight() { return 770 * this.columnScale(); }

  columnSlam(d) {
    const scene = this.scene;
    this.dropMarker(d.marker);
    d.marker = null;
    if (d.ray) { this.kill(d.ray); d.ray = null; }
    const c = addManifestSprite(scene, d.tx, this.groundY, 'vfx_invocation_clak', 'idle');
    c.setScale(this.columnScale()).setDepth(CHARACTER_DEPTH + 1);
    if (c.anims && c.anims.currentAnim) c.anims.pause(c.anims.currentAnim.frames[0]);
    this.column = this.track(c);
    d.colFrame = 0;
    // Rayon venu du ciel jusqu'au haut de la colonne.
    const cam = scene.cameras.main;
    const top = cam.worldView.y - 20;
    const colTop = this.groundY - this.columnHeight() * 0.9;
    const beam = this.track(scene.add.image(d.tx, colTop + 30, gdBeamTexture(scene)).setOrigin(0.5, 1)
      .setDisplaySize(44, Math.max(40, colTop + 30 - top)).setBlendMode(Phaser.BlendModes.ADD).setTint(0xfff6e0).setDepth(CHARACTER_DEPTH + 1));
    scene.tweens.add({ targets: beam, alpha: 0, scaleX: beam.scaleX * 0.3, duration: 520, ease: 'Quad.easeIn', onComplete: () => this.kill(beam) });
    cam.flash(160, 255, 250, 235);
    juiceShake(scene, 'heavy');
    if (typeof juiceHitStop === 'function') juiceHitStop(scene, 50);
    if (typeof juiceShockRing === 'function') juiceShockRing(scene, d.tx, this.groundY - 4, { size: 170, color: 0xfff6e0, flat: 0.3 });
    spawnFx(scene, 'slam', d.tx, this.groundY, { size: 0.7 });
    this.float(this.G.x, this.G.y - this.G.lift - 100, 'CRABE… ANCESTRAL !', '#fff6e0', { size: 17 });
  }

  // --- Clak ---------------------------------------------------------------------
  spawnClak(x, y) {
    const scene = this.scene;
    const c = createStoryNpc(scene, { id: 'clak', x, y, facing: 'right', talk: [{ requires: { geraltMet: true }, talk: 'clak_camp' }] });
    c.lookAtPlayer = false;
    c.__scripted = true;
    c.setAlpha(0);
    scene.tweens.add({ targets: c, alpha: 1, duration: 140 });
    this.clak = c;
    this.C = { x, y, vx: 0, vy: 0, state: 'hover', t: 0, face: 1, nextAt: 0, lastToken: null };
    this.event('clak-spawned', { clak: c });
  }

  removeClak() {
    const c = this.clak;
    this.showStars('C', false);
    this.clak = null;
    this.C = null;
    if (!c) return;
    if (c.active) {
      spawnFx(this.scene, 'poof', c.x, c.y - 14, { size: 0.8 });
      if (this.scene.npcs && this.scene.npcs.clak === c) delete this.scene.npcs.clak;
      c.destroy();
    }
  }

  clakFace(dir) {
    if (!this.C || !dir) return;
    this.C.face = dir;
    setNpcFacing(this.clak, dir);
  }

  updateClak(dt, p) {
    const C = this.C;
    const c = this.clak;
    const cfg = CLAK_DUEL_CFG;
    if (!C || !c || !c.active) return;
    C.t += dt;
    const dx = p.x - C.x;
    const toward = gdSign(dx, C.face);
    const adx = Math.abs(dx);
    const free = this.active && !this.over && !this.down && this.phase === 2;
    switch (C.state) {
      case 'hover': break;
      case 'drop':
        C.vy += GERALT_DUEL_CFG.gravity * dt;
        C.y += C.vy * dt;
        if (C.y >= this.groundY) {
          C.y = this.groundY;
          spawnFx(this.scene, 'land', C.x, this.groundY, { power: 0.8 });
          juiceShake(this.scene, 'light');
          this.clakFace(toward);
          c.playManifest('snap', false);
          this.float(C.x, C.y - 40, 'Clac !', '#ff9f70', { size: 15 });
          this.event('clak-landed');
          C.state = 'land';
          C.t = 0;
        }
        break;
      case 'land':
        if (C.t >= 0.6) { C.state = 'idle'; C.nextAt = this.now + cfg.firstMs; c.playManifest('idle'); }
        break;
      case 'calm': {
        // Duel fini ou suspendu : au repos (tremblement de charge annulé).
        c.playManifest('idle');
        c.anims.timeScale = 1;
        const j = typeof juiceRender === 'function' ? juiceRender(c) : null;
        if (j) j.off.x = 0;
        break;
      }
      case 'idle': {
        // Garde ses distances, de côté, toujours face à Agarica.
        let want = 0;
        if (adx > cfg.keep[1]) want = toward;
        else if (adx < cfg.keep[0] && adx > cfg.snapRange) want = -toward;
        if (want && (C.x + want * 30 < this.minX + 30 || C.x + want * 30 > this.maxX - 30)) want = 0;
        if (want) C.x += want * cfg.speed * dt;
        this.clakFace(toward);
        c.playManifest(want ? 'scuttle' : 'idle');
        // Pas d'assaut sur une Agarica ligotée par un collet.
        if (free && !this.root && this.now >= C.nextAt && !this.geraltBusy()) {
          C.dir = toward;
          if (adx < cfg.snapRange) { C.state = 'snapTele'; c.playManifest('snap', false); if (c.anims.currentAnim) c.anims.pause(c.anims.currentAnim.frames[0]); } else {
            C.state = 'chargeTele';
            c.playManifest('snap', false);
            if (c.anims.currentAnim) c.anims.pause(c.anims.currentAnim.frames[0]);
            this.showAlert(true, 'alertC');
            this.event('clak-charge', null, true);
          }
          C.t = 0;
        }
        break;
      }
      case 'chargeTele': {
        // Pince ouverte, il tremble et gratte le sol.
        const j = typeof juiceRender === 'function' ? juiceRender(c) : null;
        if (j) j.off.x = Math.sin(C.t * 60) * 1.6;
        if (C.t >= 0.2 && C.t - dt < 0.2) spawnFx(this.scene, 'turn', C.x, this.groundY, { dir: -C.dir });
        if (C.t >= cfg.chargeTeleMs / 1000) {
          if (j) j.off.x = 0;
          this.showAlert(false, 'alertC');
          C.state = 'charge';
          C.t = 0;
          C.stopX = this.clampX(p.x + C.dir * cfg.chargeOvershoot, 30);
          c.playManifest('scuttle');
          c.anims.timeScale = 1.7;
          C.dustAt = 0;
        }
        break;
      }
      case 'charge': {
        C.x += C.dir * cfg.chargeSpeed * dt;
        if (C.t >= C.dustAt) { C.dustAt = C.t + 0.08; spawnFx(this.scene, 'step', C.x, this.groundY, { dir: C.dir, power: 0.7 }); }
        if (gdHit(this.clakRect(), this.playerRect(p)) && !p.isInvulnerable) {
          if (this.hurtPlayer(p, C.dir, { kx: 240, ky: -260 })) this.event('clak-hit', null, true);
        }
        const wall = C.x <= this.minX + 30 || C.x >= this.maxX - 30;
        // Agarica ligotée devant lui : il pile net (dérapage) au lieu de
        // la percuter au moment où la corde lâche.
        const spare = this.root && Math.abs(C.x - p.x) < cfg.rootSkid;
        if ((C.dir > 0 ? C.x >= C.stopX : C.x <= C.stopX) || wall || spare) {
          C.x = this.clampX(C.x, 30);
          C.state = 'skid';
          C.t = 0;
          spawnFx(this.scene, 'turn', C.x, this.groundY, { dir: C.dir });
        }
        break;
      }
      case 'skid':
        C.x = this.clampX(C.x + C.dir * cfg.chargeSpeed * Math.max(0, 1 - C.t / 0.25) * dt * 0.5, 30);
        if (C.t >= 0.3) {
          c.anims.timeScale = 1;
          C.state = 'idle';
          C.nextAt = this.now + this.rng.between(...cfg.every) * this.ease();
        }
        break;
      case 'snapTele':
        this.clakFace(C.dir);
        if (C.t >= cfg.snapTeleMs / 1000) {
          C.state = 'snap';
          C.t = 0;
          C.snapHit = false;
          c.playManifest('snap', false);
          // (Sans art, l'anim n'a qu'une frame de placeholder.)
          const snap = this.scene.anims.get('clak-snap');
          c.play({ key: 'clak-snap', startFrame: Math.min(1, snap ? snap.frames.length - 1 : 0) });
        }
        break;
      case 'snap':
        if (!C.snapHit && C.t <= 0.15) {
          const r = gdRect(C.dir > 0 ? C.x + 6 : C.x - 58, C.y - 40, 52, 40);
          if (gdHit(r, this.playerRect(p)) && this.hurtPlayer(p, C.dir)) C.snapHit = true;
        }
        if (C.t >= 0.4) {
          C.state = 'idle';
          C.nextAt = this.now + this.rng.between(...cfg.every) * this.ease();
        }
        break;
      case 'stunned':
        C.x = this.clampX(C.x + C.vx * dt, 30);
        C.vx *= Math.max(0, 1 - 6 * dt);
        if (C.t >= cfg.stunMs / 1000) {
          this.showStars('C', false);
          this.juiceHold(c, { lean: 0 });
          c.anims.timeScale = 1;
          C.state = this.over ? 'calm' : 'idle';
          // Rancunier : il repart vite à l'attaque.
          C.nextAt = this.now + 600;
          c.playManifest('idle');
        }
        break;
      default: break;
    }
  }

  // --- Positions des sprites et indicateurs ------------------------------------
  sync() {
    const G = this.G;
    const g = this.g;
    if (g.active) { g.x = G.x; g.y = G.y - G.lift; }
    if (this.starsG) this.starsG.setPosition(G.lying ? G.x + G.face * 18 : G.x, G.lying ? G.y - 34 : G.y - G.lift - 78);
    if (this.alert) this.alert.setPosition(G.x, G.y - 76);
    const C = this.C;
    if (C && this.clak && this.clak.active) {
      this.clak.x = C.x;
      this.clak.y = C.y;
      if (this.starsC) this.starsC.setPosition(C.x, C.y - 40);
      if (this.alertC) this.alertC.setPosition(C.x, C.y - 42);
    }
  }

  // --- Défaite d'Agarica, reprise, victoire -------------------------------------
  playerDown() {
    if (!this.active || this.over || this.down || this.disposed) return;
    const G = this.G;
    this.down = { at: this.now };
    this.defeats = (this.defeats || 0) + 1;
    this.cancelTele();
    this.clearHazards();
    this.pendingInvoke = false;
    G.air = false;
    G.y = this.groundY;
    G.lift = 0;
    G.trance = false;
    G.lying = false;
    G.dodging = false;
    G.vx = 0;
    G.vy = 0;
    this.showStars('G', false);
    this.setPose('idle', true);
    this.enter('pause', { ms: 99 });
    if (this.C) { this.C.state = 'calm'; this.showStars('C', false); this.showAlert(false, 'alertC'); this.juiceHold(this.clak, { lean: 0 }); }
    this.event('player-down');
  }

  // Le duel recommence directement dans l'arène (cœurs pleins), sans le
  // dialogue d'intro : Clak repart, Geralt reprend sa place.
  restart(p) {
    const G = this.G;
    this.down = null;
    this.removeClak();
    this.hits = 0;
    this.phase = 1;
    G.invulUntil = 0;
    G.closeFlip = false;
    G.downHits = 0;
    G.sinceJump = 0;
    G.x = this.resetX;
    G.y = this.groundY;
    G.evadeReadyAt = 0;
    this.bag = [];
    this.opening = ['lob', 'trap', 'jump'];
    this.face(gdSign(p.x - G.x, -1));
    this.setPose('idle', true);
    spawnFx(this.scene, 'poof', G.x, G.y - 30, { size: 0.7 });
    this.enter('pause', { ms: 1.3 });
    G.nextAttackAt = this.now + 1800;
    this.event('restart');
  }

  // Appelée au 8e coup, au sol comme en l'air : plus rien ne blesse Agarica
  // dès cet instant (hurtPlayer teste `over`).
  win() {
    const G = this.G;
    this.over = true;
    this.cancelTele();
    // Flèches en vol : elles finissent leur course (update continue), mais
    // ne blessent plus ; collets et marqueurs disparaissent.
    for (const tr of this.traps.slice()) this.removeTrap(tr);
    if (this.root) { this.kill(this.root.rope); this.root = null; }
    if (G.rope) { this.kill(G.rope); G.rope = null; }
    if (G.d && G.d.marker) { this.dropMarker(G.d.marker); G.d.marker = null; }
    G.dodging = false;
    if (G.air) {
      // Touché en plein saut : il retombe d'abord (updateBeatenFall), puis
      // s'étale à plat ventre.
      G.vx *= 0.4;
      this.setPose('hurt');
    } else this.fallFlat();
    this.float(G.x, Math.min(G.y, this.groundY) - 70, 'Je me rends ! Je me rends !', '#ffd27a', { size: 16, ms: 1600 });
    this.showAlert(false, 'alertC');
    if (this.C && this.C.state !== 'hover' && this.C.state !== 'drop') {
      if (this.C.state !== 'stunned') this.C.state = 'calm';
      if (this.clak.anims) this.clak.anims.timeScale = 1;
    }
    this.enter('beaten', {});
    this.event('victory');
  }

  // À plat ventre, sonné : la pose de la reddition.
  fallFlat() {
    const G = this.G;
    if (!G.lying) { this.setPose('crash'); this.scene.time.delayedCall(220, () => { if (!this.disposed) this.setPose('down'); }); } else this.setPose('down');
    G.lying = true;
    G.vx = 0;
    this.showStars('G', true);
    spawnFx(this.scene, 'land', G.x, this.groundY, { power: 0.9 });
    juiceShake(this.scene, 'medium');
  }

  // Vaincu en l'air : fin de la chute, puis à plat ventre.
  updateBeatenFall(dt) {
    const G = this.G;
    G.vy += GERALT_DUEL_CFG.gravity * dt;
    G.x = this.clampX(G.x + G.vx * dt, 30);
    G.y += G.vy * dt;
    if (G.y >= this.groundY && G.vy > 0) {
      G.y = this.groundY;
      G.air = false;
      G.vy = 0;
      this.fallFlat();
    }
  }
}
