/* =========================================================================
 * VineBot -- bot de liane réutilisable (Legend of Agarica, tests au clavier
 * simulé). Agent « Niveaux 2 », 2026-10-23. Aucune dépendance hors du jeu :
 * s'injecte dans la page (vinebot.py s'en charge) et pilote Agarica avec de
 * vrais KeyboardEvent (flèches, Espace...), exactement comme un joueur.
 *
 * PRINCIPE
 *  - Sur une liane : se place (Z/S) à la longueur de balancier qui donne la
 *    plus large fenêtre de lâcher vers la cible suivante, pompe (←/→) dans le
 *    sens du mouvement, et lâche (Espace) au MILIEU de la fenêtre où une
 *    simulation balistique (mêmes constantes que le jeu, lues en direct)
 *    prédit qu'on attrape la cible -- avec une gigue humaine tirée au hasard
 *    (0 à `jitterMs`, centrée sur le milieu de la fenêtre).
 *  - Au sol : court vers la cible, saute au milieu de la fenêtre de départ
 *    (gigue aussi), puis 2e saut (singe) seulement s'il le faut.
 *  - En vol : tient la direction ; freine (neutre / contre-direction)
 *    seulement si la prédiction dit qu'on dépasse la cible (geste humain).
 *  - Les constantes physiques sont relues dans le jeu (VINE_*, gravité,
 *    joueur) : un réglage de Liane.js / Player.js est pris en compte sans
 *    toucher au bot. Sont RECOPIÉES (à revérifier si elles changent) : la
 *    formule du lâcher (Player.releaseVine -> `releaseVel`), le pendule
 *    (Liane.stepSwing -> `swingStep`), la liane libre (Liane.update/detach)
 *    et le vol (gravité sans surplus de chute en vol de liane, frein
 *    VINE_FLIGHT_DRAG, contrôle en l'air). Le bot journalise l'écart
 *    prédit/réel de la vitesse au lâcher (`relErr`, ~[0, ±22] = 1 pas).
 *  - Horloge en PAS DE PHYSIQUE (événement 'worldstep', 60 Hz fixes) : une
 *    image lente (calcul d'un plan) ne décale pas le lâcher. Les lianes
 *    cibles sont prédites avec leur petite oscillation au repos, la liane
 *    qu'on lâche avec son balancement libre (et son délai de reprise
 *    VINE_REGRAB_COOLDOWN_MS : une reprise imprévue compte comme un échec).
 *
 * API (dans la page)
 *   VineBot.run(route, opts, timeoutMs) -> Promise<résultat>
 *   VineBot.create(route, opts) -> bot ; bot.step(sc, p) à chaque image ;
 *     bot.result
 *   VineBot.windows(vineIndex, target, opts) -> fenêtres de lâcher mesurées
 *     (ms et degrés) pour chaque longueur de balancier (sans jouer).
 *
 * ROUTE : liste d'étapes, dans l'ordre
 *   { vine: i }                 attraper scene.vines[i]
 *   { vine: i, r: 140 }         ... puis s'y placer à r px sous l'attache
 *                               (sinon r choisi automatiquement)
 *   { ledge: [x1, x2, y] }      se poser entre x1 et x2 sur la surface y
 *                               (ligne des pieds)
 *   { walk: x }                 marcher au sol jusqu'à x
 *   { wait: 'expr' }            rester immobile tant que l'expression JS
 *                               (sc, p, t) est fausse (pièges à timing)
 *   { press: 'KeyE' }           appui bref sur une touche
 *   { checkpoint: true }        repère : en cas de chute (retour à une
 *                               lanterne), reprend la route ici si
 *                               opts.retry
 *
 * OPTIONS
 *   seed (1), jitterMs (80), margin (6 px de marge sur la prise / l'appui),
 *   retry (false), maxFalls (20), stepTimeoutMs (30000),
 *   solids : 'expr JS (sc) -> [corps statiques en plus du sol]' (plateformes
 *            qui s'effritent...), fallY (sinon scene.__story.fall.y ou 600),
 *   minWindowMs (140) : fenêtre jugée « confortable » (sinon on pompe un
 *            balancement de plus, sauf si l'amplitude est déjà au maximum),
 *   latencySteps (1) : appui envoyé 1 pas plus tôt (la touche n'est lue
 *            par Phaser qu'à l'image suivante),
 *   trace (false) : result.trace = [pas, x, y, liane, étape, vx, vy,
 *            sauts utilisés, au sol, angle] par image,
 *   log (false) : console.log des événements.
 *   autoDialogue (false) : fait défiler les dialogues bloquants (Entrée).
 *   shots : [{ type: 'grab', vine: 8 }, ...] -> capture du canvas (JPEG)
 *           quand l'événement survient (result.shots : [{label, url}]).
 *   Repère { checkpoint: true, at: [x, y] } : après une chute, la route
 *   reprend au repère dont la lanterne `at` est la plus proche du point de
 *   réapparition (sinon au dernier repère passé).
 *
 * RÉSULTAT
 *   { done, ok, reason, t (ms), k (étape), falls, events: [...], trace: [...] }
 *   events : plan / plan-sol (fenêtres prévues, temps de calcul) / grab /
 *            release (fenêtre [a, b] ms et en degrés, angle prévu et réel,
 *            gigue) / jump / jump2 / land / hit (cœur perdu) / fall /
 *            reprise / prise-hors-route / press / wait-ok / done.
 *
 * Outils Python (même dossier) : vinebot.py (inject, run_route, trials,
 * windows, summary), routes.py (routes de l'épreuve du singe), t_windows.py
 * (table des fenêtres), t_passages.py (réussite par passage), t_trials.py
 * (réussite par section), t_full.py (traversée complète + talisman),
 * t_traps.py (les pièges comptent-ils ?).
 * ========================================================================= */
(function () {
  const gv = (name, def) => {
    try { const v = (0, eval)(name); return v === undefined || v === null ? def : v; } catch (e) { return def; }
  };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const KC = {
    ArrowRight: 39, ArrowLeft: 37, ArrowUp: 38, ArrowDown: 40, Space: 32, KeyZ: 90, KeyQ: 81,
    KeyD: 68, KeyS: 83, KeyK: 75, ShiftLeft: 16, KeyE: 69, Enter: 13,
  };
  function key(type, code) {
    const ev = new KeyboardEvent(type, { code, key: code, bubbles: true, cancelable: true });
    Object.defineProperty(ev, 'keyCode', { get: () => KC[code] });
    Object.defineProperty(ev, 'which', { get: () => KC[code] });
    window.dispatchEvent(ev);
  }
  function levelScene() {
    const g = window.__game;
    if (typeof currentLevelScene !== 'undefined' && currentLevelScene && currentLevelScene.sys.isActive()) return currentLevelScene;
    return g.scene.getScenes(true).find((s) => s.player);
  }
  function rng(seed) {
    let a = (seed >>> 0) || 1;
    return () => {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // --- Constantes du jeu (relues à chaque création) ------------------------
  function readConsts(sc, p) {
    const w = sc.physics.world;
    return {
      DT: 1 / (w.fps || 60),
      G: w.gravity.y,
      FALL_BONUS: p.fallGravityBonus != null ? p.fallGravityBonus : 750,
      JUMP_V: p.jumpVelocity != null ? p.jumpVelocity : -680,
      MONKEY_V: p.monkeyJumpVelocity != null ? p.monkeyJumpVelocity : -500,
      MOVE_MAX: p.moveMaxSpeed || 190,
      MOVE_ACC: p.moveAcceleration || 1500,
      TURN: p.turnAccelerationMultiplier || 2.2,
      AIR_DRAG: p.airDrag != null ? p.airDrag : 500,
      HANG: gv('VINE_HANG_OFFSET', 58),
      GRAB_R: gv('VINE_GRAB_RADIUS', 30),
      MIN_GRAB_R: gv('VINE_MIN_GRAB_R', 24),
      PUMP: gv('VINE_PUMP_ACCEL', 700),
      DAMP: gv('VINE_DAMPING', 0.18),
      MAXA: gv('VINE_MAX_ANGLE', 0.96),
      GRABMAXA: gv('VINE_GRAB_MAX_ANGLE', 1.35),
      MAXOM: gv('VINE_MAX_OMEGA', 4.2),
      CLIMB: gv('VINE_CLIMB_MANUAL_SPEED', 140),
      TOP_R: gv('VINE_CLIMB_TOP_R', 28),
      AUTO_CLIMB: gv('VINE_CLIMB_SPEED', 380),
      RMULT: gv('VINE_RELEASE_SPEED_MULT', 1.1),
      RMINVX: gv('VINE_RELEASE_MIN_VX', 0),
      RBOOST: gv('VINE_RELEASE_BOOST_Y', -260),
      CARRY: gv('VINE_MAX_CARRY_SPEED', 560),
      FDRAG: gv('VINE_FLIGHT_DRAG', 150),
      MOM_DRAG: 150,
      FLIGHT_NO_BONUS: 'vineFlight' in p,
      MAXFALL: gv('PLAYER_MAX_FALL_SPEED', 900),
      REGRAB_MS: gv('VINE_REGRAB_COOLDOWN_MS', 350),
      COYOTE_MS: gv('JUMP_COYOTE_MS', 110),
    };
  }

  // Miroir de Player.releaseVine (lâcher avec Espace) : vitesse du corps.
  function releaseVel(c, th, om, r, dirHint) {
    let vx = r * om * Math.cos(th);
    let vy = -r * om * Math.sin(th);
    const sign = Math.abs(vx) > 40 ? Math.sign(vx) : dirHint;
    vx = sign * clamp(Math.abs(vx) * c.RMULT, c.RMINVX, c.CARRY);
    vy = Math.min(vy, 0) + c.RBOOST;
    return { vx, vy, carry: Math.min(Math.abs(vx), c.CARRY) };
  }

  // Miroir de Liane.stepSwing (un pas de physique).
  function swingStep(c, s, dir, climb) {
    const dt = c.DT;
    const g = c.G;
    if (climb) {
      s.r = clamp(s.r + climb * c.CLIMB * dt, c.TOP_R, s.L);
      s.tr = s.r;
    } else if (s.tr < s.r) s.r = Math.max(s.tr, s.r - c.AUTO_CLIMB * dt);
    else if (s.tr > s.r) s.r = Math.min(s.tr, s.r + c.AUTO_CLIMB * dt);
    const r = s.r;
    const cosMax = Math.cos(c.MAXA);
    const atMax = Math.cos(s.th) - (r * s.om * s.om) / (2 * g) <= cosMax;
    let a = -(g / r) * Math.sin(s.th);
    if (dir !== 0 && dir * s.om >= -0.25 && !(atMax && dir * s.om > 0)) a += (dir * c.PUMP) / r;
    s.om += a * dt;
    s.om *= Math.max(0, 1 - c.DAMP * dt);
    s.om = clamp(s.om, -c.MAXOM, c.MAXOM);
    if (Math.abs(s.th) <= c.MAXA) {
      const cap = Math.sqrt(Math.max(0, (2 * g * (Math.cos(s.th) - cosMax)) / r));
      s.om = clamp(s.om, -cap, cap);
    }
    s.prevTh = s.th;
    s.th += s.om * dt;
    if (Math.abs(s.th) > c.GRABMAXA) { s.th = Math.sign(s.th) * c.GRABMAXA; s.om = 0; }
  }

  // --- Monde : appuis solides (grille de hachage), lianes, chute ----------
  function buildWorld(sc, opts) {
    const cell = 64;
    const statics = [];
    if (sc.ground && sc.ground.getChildren) for (const o of sc.ground.getChildren()) if (o.body) statics.push(o.body);
    let extraFn = null;
    if (opts.solids) extraFn = new Function('sc', `return (${opts.solids});`);
    const hash = new Map();
    const put = (b) => {
      for (let gx = Math.floor(b.x / cell); gx <= Math.floor((b.x + b.width) / cell); gx++) {
        for (let gy = Math.floor(b.y / cell); gy <= Math.floor((b.y + b.height) / cell); gy++) {
          const k = gx + ',' + gy;
          if (!hash.has(k)) hash.set(k, []);
          hash.get(k).push(b);
        }
      }
    };
    statics.forEach(put);
    const angleCache = new Map();
    const W = {
      top: sc.physics.world.bounds.top,
      // Angle d'une liane libre dans `i` pas de physique (miroir de Liane.update
      // + displayAngle) ; cache vidé à chaque image (W.newFrame).
      angleAt(v, i) {
        if (v.grabbedBy) return v.displayAngle;
        let arr = angleCache.get(v);
        if (!arr) {
          arr = [];
          let th = v.theta; let om = v.omega;
          const g = sc.physics.world.gravity.y;
          const dt = 1 / (sc.physics.world.fps || 60);
          const t0 = sc.time.now;
          for (let k = 0; k <= 260; k++) {
            arr.push(th + Math.sin((t0 + k * dt * 1000) / 900 + v.phase) * 0.05);
            om += (-(g / v.length) * Math.sin(th)) * dt;
            om *= Math.max(0, 1 - 1.4 * dt);
            th += om * dt;
          }
          angleCache.set(v, arr);
        }
        return arr[Math.min(i, arr.length - 1)];
      },
      newFrame() { angleCache.clear(); },
      fallY: opts.fallY != null ? opts.fallY : (sc.__story && sc.__story.fall ? sc.__story.fall.y : 600),
      statics,
      extra: () => (extraFn ? (extraFn(sc) || []).filter((b) => b && b.enable !== false) : []),
      // Corps (x, y, w, h) en collision avec un appui ?
      hit(x, y, w, h, extra) {
        const x2 = x + w; const y2 = y + h;
        for (let gx = Math.floor(x / cell); gx <= Math.floor(x2 / cell); gx++) {
          for (let gy = Math.floor(y / cell); gy <= Math.floor(y2 / cell); gy++) {
            const l = hash.get(gx + ',' + gy);
            if (!l) continue;
            for (const b of l) if (b.enable !== false && x < b.x + b.width - 0.5 && x2 > b.x + 0.5 && y < b.y + b.height - 0.5 && y2 > b.y + 0.5) return b;
          }
        }
        for (const b of extra || []) if (x < b.x + b.width - 0.5 && x2 > b.x + 0.5 && y < b.y + b.height - 0.5 && y2 > b.y + 0.5) return b;
        return null;
      },
      // Plateforme continue sous les pieds (x de début/fin) ou null.
      spanAt(x, feetY, extra) {
        const tops = statics.concat(extra || []).filter((b) => b.enable !== false && Math.abs(b.y - feetY) < 7);
        tops.sort((a, b) => a.x - b.x);
        let cur = null;
        const spans = [];
        for (const b of tops) {
          if (cur && b.x <= cur[1] + 2) cur[1] = Math.max(cur[1], b.x + b.width);
          else { cur = [b.x, b.x + b.width]; spans.push(cur); }
        }
        return spans.find((s) => x >= s[0] - 24 && x <= s[1] + 24) || null;
      },
    };
    return W;
  }

  // Simulation d'un vol (après saut ou lâcher). st = {x, y (pieds), vx, vy,
  // carry (élan conservé), flight (vol de liane)} ; o = {hold (-1/0/1 ou
  // fonction(i)), jump2At (pas du 2e saut), target, margin, skipVine,
  // bw, bh, maxSteps, vines, extra}. -> {ok, why, i, x, y}
  function simAir(c, W, st, o) {
    let { x, y, vx, vy } = st;
    let carry = st.carry || 0;
    let flight = !!st.flight;
    // Règle du jeu (2026-11) : accroche seulement en forme singe (airJumpForm).
    let monkey = !!st.monkey;
    const m = o.margin != null ? o.margin : 6;
    const tgt = o.target;
    const bw = o.bw;
    const bh = o.bh;
    const maxSteps = o.maxSteps || 120;
    // Liane qu'on lâche (planification depuis la liane) : elle repart seule
    // depuis son état au lâcher (miroir de Liane.detach + Liane.update).
    const rel = o.relVine ? { v: o.relVine.v, th: o.relVine.th, om: o.relVine.om } : null;
    for (let i = 1; i <= maxSteps; i++) {
      if (rel) {
        rel.om += (-(c.G / rel.v.length) * Math.sin(rel.th)) * c.DT;
        rel.om *= Math.max(0, 1 - 1.4 * c.DT);
        rel.th += rel.om * c.DT;
      }
      const hold = typeof o.hold === 'function' ? o.hold(i, x, vx) : o.hold;
      if (i === o.jump2At) { vy = c.MONKEY_V; monkey = true; }
      const maxVx = Math.max(c.MOVE_MAX, carry);
      if (hold) {
        const acc = c.MOVE_ACC * (Math.sign(vx) === -hold ? c.TURN : 1);
        vx += hold * acc * c.DT;
      } else {
        const d = (carry > 0 ? (flight ? c.FDRAG : c.MOM_DRAG) : c.AIR_DRAG) * c.DT;
        vx = vx > d ? vx - d : vx < -d ? vx + d : 0;
      }
      vx = clamp(vx, -maxVx, maxVx);
      const bonus = vy > 0 && !(flight && c.FLIGHT_NO_BONUS) ? c.FALL_BONUS : 0;
      vy = Math.min(vy + (c.G + bonus) * c.DT, c.MAXFALL);
      const py = y;
      x += vx * c.DT;
      y += vy * c.DT;
      if (y - bh < W.top) { y = W.top + bh; vy = Math.max(vy, 0); }
      if (tgt.ledge) {
        const [x1, x2, ly] = tgt.ledge;
        if (py <= ly + 0.5 && y >= ly && x >= x1 + bw / 2 + m && x <= x2 - bw / 2 - m) return { ok: true, why: 'appui', i, x, y };
      }
      if (W.hit(x - bw / 2, y - bh, bw, bh, o.extra)) return { ok: false, why: 'mur', i, x, y };
      if (y > W.fallY) return { ok: false, why: 'chute', i, x, y };
      const hx = x;
      const hy = y - c.HANG;
      // Prise sur appui de ↑ (Player.js, 2026-11-09) : le bot ne tient ↑ que
      // si la cible est une liane -- vers un appui, les lianes sont traversées.
      if (monkey && tgt.vineObj) for (const v of o.vines) {
        // Liane qu'on vient de lâcher : ignorée le temps du délai de reprise
        // (VINE_REGRAB_COOLDOWN_MS), attrapable ensuite (comme dans le jeu).
        // (`grabbedBy` : la liane tenue pendant la planification est celle
        // qu'on lâchera -- ignorée seulement pendant le délai.)
        if ((v === o.skipVine && (o.skipSteps == null || i < o.skipSteps)) || !v.alive || (v.grabbedBy && v !== o.skipVine)) continue;
        if (Math.abs(v.x - hx) > v.length + 40) continue;
        const a = rel && v === rel.v ? rel.th : W.angleAt(v, (o.s0 || 0) + i);
        const ux = Math.sin(a); const uy = Math.cos(a);
        const dx = hx - v.x; const dy = hy - v.y;
        const r = dx * ux + dy * uy;
        const dist = Math.abs(dx * uy - dy * ux);
        if (v === tgt.vineObj) {
          if (dist <= c.GRAB_R - m && r >= c.MIN_GRAB_R - 6 + m && r <= v.length + 8 - m) return { ok: true, why: 'prise', i, x, y, r };
        } else if (dist <= c.GRAB_R + m && r >= c.MIN_GRAB_R - 6 - m && r <= v.length + 8 + m) {
          // Autre liane (ou celle qu'on vient de lâcher, après le délai) :
          // jugée avec la marge en plus -- prudence, une prise imprévue casse l'enchaînement.
          return { ok: false, why: 'autre liane', i, x, y, other: o.vines.indexOf(v) };
        }
      }
    }
    return { ok: false, why: 'temps', x, y };
  }

  // Fenêtres contiguës d'une liste de booléens (pas) -> [[a, b], ...] (pas).
  function windowsOf(flags) {
    const out = [];
    let s = -1;
    flags.forEach((f, i) => {
      if (f && s < 0) s = i;
      if (!f && s >= 0) { out.push([s, i - 1]); s = -1; }
    });
    if (s >= 0) out.push([s, flags.length - 1]);
    return out;
  }

  // Lâcher : prédiction pour le demi-balancement à venir, depuis l'état s
  // (copie), pompe tenue dans `dir`. -> {flags, states, endStep}
  function scanSwing(c, W, v, s0, dir, target, o) {
    const s = { ...s0 };
    const flags = [];
    const info = [];
    const maxSteps = o.maxSteps || 150;
    let started = false;
    for (let k = 0; k < maxSteps; k++) {
      // État si on lâche maintenant : corps à l'angle d'avant le pas, vitesse de l'état courant.
      const bodyTh = s.prevTh != null ? s.prevTh : s.th;
      const bx = v.x + Math.sin(bodyTh) * s.r;
      const by = v.y + Math.cos(bodyTh) * s.r + c.HANG;
      const rv = releaseVel(c, s.th, s.om, s.r, dir);
      const res = (dir * s.om > 0.05 || started) ? simAir(c, W, { x: bx, y: by, vx: rv.vx, vy: rv.vy, carry: rv.carry, flight: true, monkey: true },
        { hold: dir, target, margin: o.margin, skipVine: v, skipSteps: Math.floor(c.REGRAB_MS / 1000 / c.DT) - 1, bw: o.bw, bh: o.bh, vines: o.vines, extra: o.extra, s0: k,
          relVine: { v, th: s.th, om: s.om * s.r / v.length } }) : { ok: false };
      if (dir * s.om > 0.05) started = true;
      flags.push(!!res.ok);
      info.push({ th: s.th, om: s.om, ok: res.ok, why: res.why });
      // Fin du demi-balancement utile : la liane repart en arrière.
      if (started && dir * s.om < -0.02) break;
      swingStep(c, s, dir, 0);
    }
    return { flags, info };
  }

  function create(route, opts = {}) {
    const sc = levelScene();
    const p = sc.player;
    const c = readConsts(sc, p);
    const W = buildWorld(sc, opts);
    const rand = rng(opts.seed || 1);
    const J = opts.jitterMs != null ? opts.jitterMs : 80;
    const margin = opts.margin != null ? opts.margin : 6;
    const minWindowMs = opts.minWindowMs || 140;
    const condCache = new Map();
    const cond = (expr) => {
      if (!condCache.has(expr)) condCache.set(expr, new Function('sc', 'p', 't', `return (${expr});`));
      return condCache.get(expr);
    };
    const bot = {
      route, opts, c, W, k: 0, falls: 0, ckIdx: 0,
      held: {}, spaceUpAt: 0, keysUpAt: {},
      result: { done: false, ok: false, reason: '', t: 0, k: 0, falls: 0, events: [], trace: [] },
      plan: null, stepStart: null, last: null, t0: sc.time.now,
      // Horloge en PAS DE PHYSIQUE (60 Hz fixes) : tout ce qui est planifié
      // (lâcher, saut) se compte en pas, pas en temps de scène -- une image
      // lente (calcul du plan) ferait sinon avancer l'horloge plus vite que
      // la physique et lâcher trop tôt.
      steps: 0, hearts: p.hearts,
    };
    const LAT = opts.latencySteps != null ? opts.latencySteps : 1;
    const JS = J / 1000 / c.DT; // gigue en pas
    const onWorldStep = () => { bot.steps++; };
    sc.physics.world.on('worldstep', onWorldStep);
    bot.detach = () => sc.physics.world.off('worldstep', onWorldStep);
    bot.result.shots = [];
    const ev = (type, o) => {
      const e = { type, t: Math.round(sc.time.now - bot.t0), k: bot.k, x: Math.round(p.x), y: Math.round(p.y), ...o };
      bot.result.events.push(e);
      if (opts.log) console.log('[vinebot]', JSON.stringify(e));
      // Capture demandée pour cet événement (après le prochain rendu : le
      // canvas WebGL n'est lisible qu'à ce moment-là).
      for (const m of opts.shots || []) {
        if (m.done || m.type !== type) continue;
        if (m.vine != null && e.vine !== m.vine) continue;
        if (m.k != null && e.k !== m.k) continue;
        m.done = true;
        const label = m.label || `${type}${m.vine != null ? '_' + m.vine : ''}`;
        const g = window.__game;
        const cap = () => {
          g.events.off('postrender', cap);
          try { bot.result.shots.push({ label, t: e.t, url: g.canvas.toDataURL('image/jpeg', 0.8) }); } catch (err) { /* canvas illisible */ }
        };
        if (m.delayMs) sc.time.delayedCall(m.delayMs, () => g.events.on('postrender', cap));
        else g.events.on('postrender', cap);
      }
    };
    const setHeld = (want) => {
      for (const code of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']) {
        const w = !!want[code];
        if (w !== !!bot.held[code]) { key(w ? 'keydown' : 'keyup', code); bot.held[code] = w; }
      }
    };
    const pulse = (code, now) => {
      key('keydown', code);
      bot.keysUpAt[code] = now + 70;
    };
    // Saut à hauteur variable (Player.js, JUMP_CUT_VY) : la simulation suppose
    // le saut TENU -> Espace reste enfoncé jusqu'au sommet (ou la prise d'une
    // liane), 900 ms au plus. 2e saut pendant la montée : relâché puis
    // réappuyé dans la même image (le jeu voit un nouvel appui, sans coupure).
    const jumpPress = (now) => {
      if (bot.keysUpAt.Space) key('keyup', 'Space');
      key('keydown', 'Space');
      bot.keysUpAt.Space = now + 900;
      bot.spaceJump = { at: now, seenUp: false };
    };
    const spaceFree = () => !bot.keysUpAt.Space || !!bot.spaceJump;
    const finish = (ok, reason) => {
      if (bot.result.done) return;
      setHeld({});
      for (const code of Object.keys(bot.keysUpAt)) key('keyup', code);
      bot.keysUpAt = {};
      Object.assign(bot.result, { done: true, ok, reason, t: Math.round(sc.time.now - bot.t0), k: bot.k, falls: bot.falls, steps: bot.steps });
      ev('done', { ok, reason });
      bot.detach();
    };
    const bodyDims = () => ({ bw: p.body.width, bh: p.body.height });
    const resolveTarget = (step) => {
      if (!step) return null;
      if (step.vine != null) {
        const v = sc.vines[step.vine];
        return { vineObj: v, vine: step.vine, x: v.x, step };
      }
      if (step.ledge) return { ledge: step.ledge, x: (step.ledge[0] + step.ledge[1]) / 2, step };
      return null;
    };
    // Prochaine cible physique (liane / appui) à partir de l'étape k.
    const nextTarget = () => resolveTarget(route[bot.k]);
    const advance = (why) => {
      bot.k++;
      bot.plan = null;
      bot.stepStart = sc.time.now;
      while (route[bot.k] && route[bot.k].checkpoint) { bot.ckIdx = bot.k + 1; bot.k++; }
      if (bot.k >= route.length) finish(true, why || 'route terminée');
    };

    // Étape terminée ?
    const stepDone = (step) => {
      if (!step) return false;
      if (step.vine != null) return p.vine === sc.vines[step.vine];
      if (step.ledge) {
        const [x1, x2, y] = step.ledge;
        return p.onGround && !p.vine && p.x >= x1 - 2 && p.x <= x2 + 2 && Math.abs(p.body.bottom - y) < 10;
      }
      if (step.walk != null) return p.onGround && Math.abs(p.x - step.walk) < 12;
      if (step.wait) return !!cond(step.wait)(sc, p, sc.time.now);
      return false;
    };

    // --- Planification sur une liane --------------------------------------
    function vineState(v) {
      return { th: v.theta, om: v.omega, r: v.swingR, tr: v.climbTargetR != null ? v.climbTargetR : v.swingR, L: v.length, prevTh: v.drawTheta != null ? v.drawTheta : v.theta };
    }
    // Fenêtre (pas) d'un demi-balancement à amplitude maximale, à la longueur r.
    function steadyWindow(v, r, dir, target, dims) {
      const th0 = -dir * (c.MAXA - 0.02);
      const s = { th: th0, om: 0, r, tr: r, L: v.length, prevTh: th0 };
      // Lancer le balancement (la scan commence quand il va vers la cible).
      const sw = scanSwing(c, W, v, s, dir, target, { margin, bw: dims.bw, bh: dims.bh, vines: sc.vines, extra: W.extra(), maxSteps: 200 });
      const wins = windowsOf(sw.flags);
      let best = null;
      for (const w of wins) if (!best || w[1] - w[0] > best[1] - best[0]) best = w;
      return { win: best, len: best ? (best[1] - best[0] + 1) * c.DT * 1000 : 0, sw };
    }
    function chooseR(v, dir, target, dims, step) {
      const rmax = v.length - 6;
      if (step && step.r != null) return { r: clamp(step.r, c.TOP_R + 2, rmax), len: steadyWindow(v, clamp(step.r, c.TOP_R + 2, rmax), dir, target, dims).len, forced: true };
      const cands = [];
      const stepR = Math.max(10, Math.round((rmax - c.TOP_R) / 25));
      for (let r = rmax; r >= c.TOP_R + 4; r -= stepR) cands.push({ r, len: steadyWindow(v, r, dir, target, dims).len });
      const best = cands.reduce((a, b) => (b.len > a.len ? b : a), { r: v.swingR, len: 0 });
      if (best.len <= 0) return { r: clamp(v.swingR, c.TOP_R + 2, rmax), len: 0, none: true };
      // Parmi les quasi-meilleures (85 %), la plus proche de la prise actuelle (moins à grimper).
      const ok = cands.filter((cd) => cd.len >= best.len * 0.85);
      ok.sort((a, b) => Math.abs(a.r - v.swingR) - Math.abs(b.r - v.swingR));
      return { r: ok[0].r, len: ok[0].len, bestLen: best.len, bestR: best.r };
    }

    function onVine(now, target) {
      const v = p.vine;
      const want = {};
      const dims = bot.vineDims || bodyDims();
      if (!target) { setHeld({}); return; }
      const dir = Math.sign(target.x - v.x) || 1;
      if (!bot.plan || bot.plan.kind !== 'vine' || bot.plan.v !== v) {
        const t0 = performance.now();
        const ch = chooseR(v, dir, target, dims, route[bot.k]);
        bot.plan = { kind: 'vine', v, dir, r: ch.r, steadyLen: ch.len, choice: ch, releaseAt: null };
        ev('plan', { vine: sc.vines.indexOf(v), r: ch.r, steadyMs: Math.round(ch.len), bestR: ch.bestR, bestMs: ch.bestLen && Math.round(ch.bestLen), none: !!ch.none, cpu: Math.round(performance.now() - t0) });
      }
      const pl = bot.plan;
      const dr = v.swingR - pl.r;
      const climbing = Math.abs(dr) > 4;
      if (climbing) {
        if (dr > 0) want.ArrowUp = true;
        else if (!v.atBottom() && v.swingR < v.length - 3) want.ArrowDown = true;
      }
      // Pompe : dans le sens du mouvement (vers la cible au repos).
      const om = v.omega;
      const pump = Math.abs(om) > 0.12 ? Math.sign(om) : dir;
      if (pl.releaseAt == null) {
        if (pump > 0) want.ArrowRight = true; else want.ArrowLeft = true;
      } else if (dir > 0) want.ArrowRight = true; else want.ArrowLeft = true;
      if (p.vineClimbLatch) want.ArrowUp = false;
      setHeld(want);
      if (climbing) return;
      if (pl.releaseAt == null && Math.sign(om) === dir) {
        const sw = scanSwing(c, W, v, vineState(v), dir, target, { margin, bw: dims.bw, bh: dims.bh, vines: sc.vines, extra: W.extra() });
        const wins = windowsOf(sw.flags);
        if (wins.length) {
          const w = wins[0];
          const lenMs = (w[1] - w[0] + 1) * c.DT * 1000;
          // Amplitude actuelle (énergie) proche du plafond ?
          const amp = Math.acos(clamp(Math.cos(v.theta) - (v.swingR * om * om) / (2 * c.G), -1, 1));
          const saturated = amp >= c.MAXA * 0.97;
          const want2 = Math.min(minWindowMs, (pl.steadyLen || 0) * 0.8);
          if (lenMs >= want2 || saturated) {
            const center = (w[0] + w[1]) / 2;
            const jit = rand() * JS - JS / 2;
            pl.releaseAt = bot.steps + Math.max(0, center + jit - LAT);
            pl.win = [Math.round(w[0] * c.DT * 1000), Math.round((w[1] + 1) * c.DT * 1000)];
            pl.jit = Math.round(jit * c.DT * 1000);
            const ci = Math.round((w[0] + w[1]) / 2);
            pl.expectTh = sw.info[ci] ? +sw.info[ci].th.toFixed(3) : null;
            pl.winDeg = [sw.info[w[0]] && Math.round(sw.info[w[0]].th * 57.3), sw.info[w[1]] && Math.round(sw.info[w[1]].th * 57.3)];
          }
        }
      }
      if (pl.releaseAt != null && bot.steps >= pl.releaseAt && !bot.keysUpAt.Space) {
        const th = v.theta; const omg = v.omega; const r = v.swingR;
        pl.pred = releaseVel(c, th, omg, r, dir);
        pulse('Space', now);
        ev('release', { vine: sc.vines.indexOf(v), win: pl.win, winDeg: pl.winDeg, jit: pl.jit, th: +th.toFixed(3), r: Math.round(r), expectTh: pl.expectTh, st: bot.steps });
        bot.pendingRelease = { pred: pl.pred, at: now };
      }
    }

    // --- Au sol --------------------------------------------------------------
    function onGround(now, step, target) {
      const want = {};
      const dims = bodyDims();
      bot.vineDims = null;
      if (step.wait) { setHeld({}); return; }
      if (step.press) { setHeld({}); pulse(step.press, now); ev('press', { key: step.press }); advance(); return; }
      if (step.walk != null) {
        const d = step.walk - p.x;
        if (Math.abs(d) > 10) want[d > 0 ? 'ArrowRight' : 'ArrowLeft'] = true;
        setHeld(want);
        return;
      }
      if (!target) { setHeld({}); return; }
      const feet = p.body.bottom;
      const extra = W.extra();
      const span = W.spanAt(p.x, feet, extra) || [p.x - 1, p.x + 1];
      // Cible sur la même plateforme : on y marche.
      if (target.ledge && Math.abs(target.ledge[2] - feet) < 8 && target.ledge[0] <= span[1] + 2 && target.ledge[1] >= span[0] - 2) {
        const gx = clamp(p.x, target.ledge[0] + 30, target.ledge[1] - 30);
        if (Math.abs(gx - p.x) > 6) want[gx > p.x ? 'ArrowRight' : 'ArrowLeft'] = true;
        setHeld(want);
        return;
      }
      const dir = Math.sign(target.x - p.x) || 1;
      // Saut tout juste demandé (touche pas encore lue par le jeu) : on tient.
      if (bot.plan && bot.plan.kind === 'air' && bot.steps - bot.plan.at < 9) { setHeld({ [dir > 0 ? 'ArrowRight' : 'ArrowLeft']: true }); return; }
      if (!bot.plan || bot.plan.kind !== 'ground' || bot.plan.target !== target.step) {
        const t0 = performance.now();
        bot.plan = planTakeoff(now, dir, target, span, dims, extra);
        ev('plan-sol', { win: bot.plan.win, n: bot.plan.n, none: bot.plan.jumpAt == null, cpu: Math.round(performance.now() - t0) });
      }
      const pl = bot.plan;
      want[dir > 0 ? 'ArrowRight' : 'ArrowLeft'] = true;
      // Pas de fenêtre en avançant : recule un peu pour prendre de l'élan.
      if (pl.jumpAt == null) {
        if (!pl.backUntil) pl.backUntil = now + 450;
        if (now < pl.backUntil) { setHeld({ [dir > 0 ? 'ArrowLeft' : 'ArrowRight']: true }); return; }
        bot.plan = null;
        setHeld({});
        return;
      }
      setHeld(want);
      if (bot.steps >= pl.jumpAt && spaceFree()) {
        jumpPress(now);
        ev('jump', { win: pl.win, jit: pl.jit });
        bot.plan = { kind: 'air', target: target.step, dir, from: 'sol', planned2: false, jump2At: null, at: bot.steps };
      }
    }

    function planTakeoff(now, dir, target, span, dims, extra) {
      let x = p.body.center.x;
      let vx = p.body.velocity.x;
      const y = p.body.bottom;
      const flags = [];
      const j2 = [];
      for (let i = 0; i <= 150; i++) {
        if (i > 0) {
          const acc = c.MOVE_ACC * (Math.sign(vx) === -dir ? c.TURN : 1);
          vx = clamp(vx + dir * acc * c.DT, -c.MOVE_MAX, c.MOVE_MAX);
          x += vx * c.DT;
        }
        if (x < span[0] - dims.bw / 2 + 3 || x > span[1] + dims.bw / 2 - 3) break;
        const st = { x, y, vx, vy: c.JUMP_V, carry: 0, flight: false };
        const o = { hold: dir, target, margin, bw: dims.bw, bh: dims.bh, vines: sc.vines, extra };
        let ok = simAir(c, W, st, o).ok;
        let s2 = null;
        if (!ok) {
          const okJ = [];
          for (let j = 3; j <= 60; j += 2) okJ.push(simAir(c, W, st, { ...o, jump2At: j }).ok);
          const ws = windowsOf(okJ);
          if (ws.length) { ok = true; const w = ws.reduce((a, b) => (b[1] - b[0] > a[1] - a[0] ? b : a)); s2 = [3 + 2 * w[0], 3 + 2 * w[1]]; }
        }
        flags.push(ok);
        j2.push(s2);
      }
      const ws = windowsOf(flags);
      if (!ws.length) return { kind: 'ground', target: target.step, jumpAt: null, n: flags.length };
      const w = ws[0];
      const center = (w[0] + w[1]) / 2;
      const jit = rand() * JS - JS / 2;
      const winMs = [Math.round(w[0] * c.DT * 1000), Math.round((w[1] + 1) * c.DT * 1000)];
      return { kind: 'ground', target: target.step, jumpAt: bot.steps + Math.max(0, center + jit - LAT), win: winMs, jit: Math.round(jit * c.DT * 1000), n: flags.length };
    }

    // --- En l'air --------------------------------------------------------------
    function inAir(now, target) {
      const want = {};
      const dims = bodyDims();
      if (!target) { setHeld({}); return; }
      const dir = Math.sign(target.x - p.x) || (bot.plan && bot.plan.dir) || 1;
      const st = { x: p.body.center.x, y: p.body.bottom, vx: p.body.velocity.x, vy: p.body.velocity.y, carry: p.vineMomentumSpeed || 0, flight: !!p.vineFlight, monkey: p.airJumpForm === 'monkey' };
      const extra = W.extra();
      const base = { target, margin, bw: dims.bw, bh: dims.bh, vines: sc.vines, extra, skipVine: p.lastVine,
        skipSteps: Math.max(0, (c.REGRAB_MS - (now - (p.vineReleasedAt || -1e9))) / 1000 / c.DT) };
      // 2e saut (singe) : seulement s'il le faut, au milieu de sa fenêtre.
      const canJump2 = p.jumpsUsed < 2 && p.getActiveAirForm && p.getActiveAirForm() === 'monkey';
      if (!bot.plan || bot.plan.kind !== 'air') bot.plan = { kind: 'air', target: target.step, dir, from: 'air', planned2: false, jump2At: null };
      const pl = bot.plan;
      if (canJump2 && !pl.planned2) {
        pl.planned2 = true;
        const ok0 = simAir(c, W, st, { ...base, hold: dir }).ok;
        if (!ok0) {
          const okJ = [];
          for (let j = 1; j <= 60; j++) okJ.push(simAir(c, W, st, { ...base, hold: dir, jump2At: j }).ok);
          const ws = windowsOf(okJ);
          if (ws.length) {
            const w = ws.reduce((a, b) => (b[1] - b[0] > a[1] - a[0] ? b : a));
            const jit = rand() * JS - JS / 2;
            // okJ[j] = 2e saut au pas j+1.
            pl.jump2At = bot.steps + Math.max(0, (w[0] + w[1]) / 2 + 1 + jit - LAT);
            pl.win2 = [Math.round((w[0] + 1) * c.DT * 1000), Math.round((w[1] + 2) * c.DT * 1000)];
            pl.jit2 = Math.round(jit * c.DT * 1000);
          }
        }
      }
      if (pl.jump2At != null && bot.steps >= pl.jump2At && canJump2 && spaceFree()) {
        jumpPress(now);
        ev('jump2', { win: pl.win2, jit: pl.jit2 });
        pl.jump2At = null;
      }
      // Direction : tenir vers la cible ; freiner seulement si on la dépasse.
      let hold = dir;
      if (pl.jump2At == null) {
        if (!simAir(c, W, st, { ...base, hold: dir }).ok) {
          if (simAir(c, W, st, { ...base, hold: 0 }).ok) hold = 0;
          else if (simAir(c, W, st, { ...base, hold: -dir }).ok) hold = -dir;
        }
      }
      if (hold) want[hold > 0 ? 'ArrowRight' : 'ArrowLeft'] = true;
      // Prise de liane sur appui (Player.js, 2026-11-09) : ↑ tenu pendant le
      // vol quand la cible est une liane (geste humain : « je vise la liane »).
      if (target.vineObj) want.ArrowUp = true;
      setHeld(want);
    }

    bot.step = (scn, pl) => {
      if (bot.result.done) return;
      const now = sc.time.now;
      if (!bot.stepStart) bot.stepStart = now;
      // Relâche les appuis brefs (Espace d'un saut : au sommet, cf. jumpPress).
      for (const code of Object.keys(bot.keysUpAt)) {
        if (code === 'Space' && bot.spaceJump) {
          const vy = p.body.velocity.y;
          if (vy < -20) bot.spaceJump.seenUp = true;
          const over = (bot.spaceJump.seenUp && vy >= 0) || p.vine || now >= bot.keysUpAt.Space
            || (!bot.spaceJump.seenUp && now - bot.spaceJump.at > 160);
          if (!over) continue;
          bot.spaceJump = null;
          key('keyup', code); delete bot.keysUpAt[code];
          continue;
        }
        if (now >= bot.keysUpAt[code]) { key('keyup', code); delete bot.keysUpAt[code]; }
      }
      W.newFrame();
      if (p.hearts < bot.hearts) ev('hit', { hearts: p.hearts });
      bot.hearts = p.hearts;
      // Monde gelé (dialogue, cinématique) : on attend.
      if (typeof isWorldFrozen === 'function' && isWorldFrozen(sc)) {
        setHeld({});
        if (opts.autoDialogue && window.__game.scene.isActive('DialogueScene') && now - (bot.lastDlg || 0) > 350) {
          bot.lastDlg = now;
          key('keydown', 'Enter');
          bot.keysUpAt.Enter = now + 60;
        }
        bot.last = { x: p.x, y: p.y };
        return;
      }
      // Chute / retour à une lanterne : saut de position.
      if (bot.last && !p.vine && (Math.abs(p.x - bot.last.x) > 160 || Math.abs(p.y - bot.last.y) > 160)) {
        bot.falls++;
        ev('fall', { from: [Math.round(bot.last.x), Math.round(bot.last.y)] });
        if (!opts.retry || bot.falls > (opts.maxFalls || 20)) { finish(false, 'chute'); return; }
        let best = null;
        route.forEach((s2, j) => {
          if (!s2.checkpoint || !s2.at) return;
          const d = Math.hypot(s2.at[0] - p.x, s2.at[1] - p.y);
          if (!best || d < best.d) best = { j, d };
        });
        bot.k = best ? best.j + 1 : bot.ckIdx;
        ev('reprise', { k: bot.k });
        bot.plan = null;
        bot.stepStart = now;
        setHeld({});
      }
      bot.last = { x: p.x, y: p.y };
      if (now - bot.stepStart > (opts.stepTimeoutMs || 30000)) { finish(false, 'bloqué'); return; }
      // Vérifie l'écart prédit/réel du lâcher (vitesse juste après).
      if (bot.pendingRelease && !p.vine) {
        const pr = bot.pendingRelease.pred;
        const last = bot.result.events.filter((e) => e.type === 'release').pop();
        if (last) last.relErr = [Math.round(p.body.velocity.x - pr.vx), Math.round(p.body.velocity.y - (pr.vy + c.G * c.DT))];
        bot.pendingRelease = null;
      }
      // Étapes immédiates / terminées.
      let guard = 0;
      while (!bot.result.done && guard++ < 5) {
        const step = route[bot.k];
        if (!step) { finish(true, 'route terminée'); return; }
        if (step.checkpoint) { bot.ckIdx = bot.k + 1; bot.k++; continue; }
        if (stepDone(step)) {
          if (step.vine != null) { ev('grab', { vine: step.vine, r: Math.round(p.vine.swingR), th: +p.vine.theta.toFixed(3) }); bot.seenVine = p.vine; }
          else if (step.ledge) ev('land', { ledge: step.ledge });
          else if (step.wait) ev('wait-ok', {});
          advance();
          continue;
        }
        // Liane attrapée hors route (plus loin dans la route : on saute les étapes).
        if (p.vine) {
          const vi = sc.vines.indexOf(p.vine);
          const later = route.findIndex((s2, j) => j > bot.k && s2.vine === vi);
          if (later > 0 && (step.vine != null || step.ledge)) {
            ev('skip', { to: later, vine: vi });
            bot.k = later;
            continue;
          }
        }
        break;
      }
      if (bot.result.done) return;
      // Prise d'une liane hors route (rattrapée après un lâcher raté...).
      if (p.vine && p.vine !== bot.seenVine) ev('prise-hors-route', { vine: sc.vines.indexOf(p.vine) });
      bot.seenVine = p.vine || null;
      const step = route[bot.k];
      const target = nextTarget();
      if (p.vine) {
        if (!bot.vineDims) bot.vineDims = bot.lastAirDims || bodyDims();
        onVine(now, target);
      } else if (p.onGround) {
        onGround(now, step, target);
      } else {
        bot.lastAirDims = bodyDims();
        inAir(now, target);
      }
      if (opts.trace && (bot.result.trace.length < 4000)) {
        bot.result.trace.push([bot.steps, Math.round(p.x), Math.round(p.y), p.vine ? sc.vines.indexOf(p.vine) : -1, bot.k,
          Math.round(p.body.velocity.x), Math.round(p.body.velocity.y), p.jumpsUsed, p.onGround ? 1 : 0, p.vine ? +p.vine.theta.toFixed(3) : null]);
      }
    };
    return bot;
  }

  // Joue une route jusqu'au bout (ou timeoutMs de temps de scène).
  function run(route, opts = {}, timeoutMs = 60000) {
    return new Promise((resolve) => {
      const sc = levelScene();
      const bot = create(route, opts);
      window.__vb = bot;
      const t0 = sc.time.now;
      let ended = false;
      const end = (why) => {
        if (ended) return;
        ended = true;
        sc.events.off('update', onUpdate);
        if (bot.detach) bot.detach();
        if (!bot.result.done) {
          bot.result.reason = why;
          bot.result.t = Math.round(sc.time.now - t0);
          bot.result.k = bot.k;
          bot.result.falls = bot.falls;
          for (const code of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space']) key('keyup', code);
        }
        resolve(bot.result);
      };
      const onUpdate = () => {
        try { bot.step(); } catch (e) { bot.result.reason = 'erreur bot : ' + e.message + ' ' + (e.stack || '').split('\n')[1]; bot.result.done = true; }
        if (bot.result.done) end('fin');
        else if (sc.time.now - t0 > timeoutMs) end('temps écoulé');
      };
      sc.events.on('update', onUpdate);
      setTimeout(() => end('garde-fou temps réel'), timeoutMs * 2 + 5000);
    });
  }

  // Mesure (sans jouer) : fenêtres de lâcher depuis la liane i vers la cible,
  // pour chaque longueur de balancier r, à amplitude maximale.
  function windows(i, targetStep, opts = {}) {
    const sc = levelScene();
    const p = sc.player;
    const c = readConsts(sc, p);
    const W = buildWorld(sc, opts);
    const v = sc.vines[i];
    const tgt = targetStep.vine != null ? { vineObj: sc.vines[targetStep.vine], x: sc.vines[targetStep.vine].x }
      : { ledge: targetStep.ledge, x: (targetStep.ledge[0] + targetStep.ledge[1]) / 2 };
    const dir = Math.sign(tgt.x - v.x) || 1;
    const dims = { bw: opts.bw || 30, bh: opts.bh || 60 };
    const out = [];
    for (let r = v.length - 6; r >= c.TOP_R + 4; r -= opts.stepR || 20) {
      const th0 = -dir * (c.MAXA - 0.02);
      const s = { th: th0, om: 0, r, tr: r, L: v.length, prevTh: th0 };
      const sw = scanSwing(c, W, v, s, dir, tgt, { margin: opts.margin != null ? opts.margin : 6, bw: dims.bw, bh: dims.bh, vines: sc.vines, extra: W.extra(), maxSteps: 200 });
      const ws = windowsOf(sw.flags);
      const best = ws.reduce((a, b) => (!a || b[1] - b[0] > a[1] - a[0] ? b : a), null);
      out.push({
        r,
        ms: best ? Math.round((best[1] - best[0] + 1) * c.DT * 1000) : 0,
        deg: best ? [Math.round(sw.info[best[0]].th * 57.3), Math.round(sw.info[best[1]].th * 57.3)] : null,
        why: best ? null : [...new Set(sw.info.filter((x) => x.why).map((x) => x.why))].join('/'),
      });
    }
    return out;
  }

  window.VineBot = { create, run, windows, readConsts: () => { const sc = levelScene(); return readConsts(sc, sc.player); } };
})();
