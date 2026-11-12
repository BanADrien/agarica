// FightBot : joue le combat de Kainati au clavier simulé (KeyboardEvent),
// comme une joueuse : se met sur une liane quand une grande attaque ou une
// charge arrive, se balance si une pierre tombe de la canopée sur sa liane,
// redescend et frappe (de près quand il est sonné, à distance sinon).
// window.FightBot.start(opts) ; FightBot.state -> { log, deaths, hits... }
(function () {
  const KC = { ArrowRight: 39, ArrowLeft: 37, ArrowUp: 38, ArrowDown: 40, Space: 32, KeyZ: 90, KeyS: 83, KeyK: 75, KeyE: 69, Enter: 13 };
  const KN = { Space: ' ', Enter: 'Enter', KeyE: 'e', KeyZ: 'z', KeyS: 's', KeyK: 'k' };
  function key(type, code) {
    const ev = new KeyboardEvent(type, { code, key: KN[code] || code, bubbles: true, cancelable: true });
    Object.defineProperty(ev, 'keyCode', { get: () => KC[code] });
    Object.defineProperty(ev, 'which', { get: () => KC[code] });
    window.dispatchEvent(ev);
  }
  function levelScene() {
    return (typeof currentLevelScene !== 'undefined' && currentLevelScene && currentLevelScene.sys.isActive())
      ? currentLevelScene : window.__game.scene.getScenes(true).find((s) => s.player);
  }
  const held = new Set();
  const lastSent = {};
  const down = (c) => { const now = performance.now(); if (!held.has(c) || now - (lastSent[c] || 0) > 250) { held.add(c); lastSent[c] = now; key('keydown', c); } };
  const up = (c) => { if (held.has(c)) { held.delete(c); key('keyup', c); } };
  const only = (codes) => { for (const c of [...held]) if (!codes.includes(c)) up(c); for (const c of codes) down(c); };
  const taps = [];
  const tap = (c, ms = 70) => { key('keydown', c); taps.push([performance.now() + ms, c]); };
  // Saut à hauteur variable (Player.js, JUMP_CUT_VY) : Espace tenu jusqu'au
  // sommet (ou la prise d'une liane), 900 ms au plus ; 2e appui pendant la
  // montée = relâché puis réappuyé dans la même image.
  let jumpHold = null;
  const jumpTap = () => {
    if (jumpHold) key('keyup', 'Space');
    key('keydown', 'Space');
    jumpHold = { at: performance.now(), seenUp: false };
  };
  const jumpHoldTick = (p, now) => {
    if (!jumpHold) return;
    const vy = p.body.velocity.y;
    if (vy < -20) jumpHold.seenUp = true;
    if ((jumpHold.seenUp && vy >= 0) || p.vine || now - jumpHold.at > 900 || (!jumpHold.seenUp && now - jumpHold.at > 160)) {
      key('keyup', 'Space');
      jumpHold = null;
    }
  };
  const B = window.FightBot = { state: null };
  // Revue : réflexe humain -> l'état de Kainati est lu avec REACT ms de retard.
  const hist = [];
  B.start = (opts = {}) => {
    B.state = { opts, log: [], t0: performance.now(), grabs: 0, hits: 0, lastHp: null, deaths: 0, lastHearts: null, vineDodges: {}, mode: '' };
    if (B.timer) clearInterval(B.timer);
    B.timer = setInterval(B.tick, 16);
  };
  B.stop = () => { if (B.timer) clearInterval(B.timer); B.timer = null; for (const c of [...held]) up(c); };
  const log = (m) => { const st = B.state; st.log.push(`${Math.round(performance.now() - st.t0)} ${m}`); if (st.log.length > 400) st.log.shift(); };

  B.tick = () => {
    const st = B.state;
    const now = performance.now();
    for (let i = taps.length - 1; i >= 0; i--) if (now >= taps[i][0]) { key('keyup', taps[i][1]); taps.splice(i, 1); }
    if (!st) return;
    const g = window.__game;
    const sc = levelScene();
    if (!sc || !sc.player || !sc.player.body || !sc.kainati) return;
    const p = sc.player;
    const k = sc.kainati;
    jumpHoldTick(p, now);
    if (g.scene.isActive('DialogueScene')) {
      only([]);
      if (now - (st.lastE || 0) > 450) { st.lastE = now; tap('KeyE'); }
      return;
    }
    if (typeof isWorldFrozen === 'function' && isWorldFrozen(sc)) { only([]); return; }
    if (st.lastHearts !== null && p.hearts < st.lastHearts) { const pr = new Phaser.Geom.Rectangle(p.body.x, p.body.y, p.body.width, p.body.height); const contact = Phaser.Geom.Intersects.RectangleToRectangle(k.getContactRect(), pr); log(`coup reçu (${p.hearts}) etat=${k.state} vine=${!!p.vine} contact=${contact} dx=${Math.round(p.x - k.x)} hz=${k.hazards.list.map((h) => h.kind).join(',')}`); }
    st.lastHearts = p.hearts;
    if (st.lastHp !== null && k.hp < st.lastHp) st.hits += 1;
    st.lastHp = k.hp;
    if (k.defeated) { only([]); st.done = true; return; }
    hist.push([now, k.state]);
    while (hist.length > 2 && now - hist[1][0] >= (st.opts.react || 300)) hist.shift();
    const kst = now - hist[0][0] >= (st.opts.react || 300) ? hist[0][1] : 'idle';
    const hz = k.hazards.list;
    const fullSoon = ['slamWind', 'roarWind', 'sweepWind', 'slam', 'roar', 'sweep', 'phaseRoar'].includes(kst);
    const floorDanger = hz.some((h) => (h.kind === 'quake' && h.t < h.ms + 50) || (h.kind === 'moss' && h.t < h.ms + 50) || h.kind === 'boulder');
    const charge = kst === 'chargeWind' || kst === 'charge';
    const needVine = fullSoon || floorDanger || charge || st.opts.stayOnVine;
    const vines = sc.vines || [];
    st.mode = needVine ? 'vine' : 'fight';
    if (!k.active && !st.opts.noWalkIn) {
      // Avant le combat : entrer dans l'arène.
      if (p.x < (sc.__kainati ? sc.__kainati.cfg.lockX : 600) + 40) only(['ArrowRight']); else only([]);
      return;
    }
    if (needVine) {
      if (p.vine) {
        // Pierre du plafond au-dessus de sa liane : se balancer pour l'esquiver.
        const ceil = hz.find((h) => h.kind === 'ceil' && Math.abs(h.x - p.vine.x) < 60);
        const stoneAbove = hz.find((h) => h.kind === 'stone' && h.vy > 0 && Math.abs(h.img.x - p.x) < 70 && h.img.y < p.y);
        if (ceil || stoneAbove) {
          const om = p.vine.omega || 0;
          const dir = Math.abs(om) < 0.2 ? (p.vine.x < 992 ? 1 : -1) : (om > 0 ? 1 : -1);
          only([dir > 0 ? 'ArrowRight' : 'ArrowLeft']);
          st.pumping = true;
        } else if (!st.opts.noClimb && (charge ? p.vine.swingR > 112 : p.vine.swingR > p.vine.length - 6)) {
          only(['KeyZ']); // monter : bien au-dessus de sa tête quand il charge
        } else {
          only([]);
        }
        return;
      }
      // Liane la plus proche, pas sous Kainati.
      let best = null;
      for (const v of vines) {
        const d = Math.abs(v.x - p.x); // revue : liane la plus proche, sans savoir où tombent les rochers
        if (!best || d < best.d) best = { v, d };
      }
      if (!best) return;
      const dx = best.v.x - p.x;
      const onGround = p.body.blocked.down;
      // Prise sur appui (Player.js, 2026-11-09) : ↑ tenu en l'air sous la liane.
      const grab = onGround ? [] : ['ArrowUp'];
      if (Math.abs(dx) > 14) {
        only([dx > 0 ? 'ArrowRight' : 'ArrowLeft', ...grab]);
        if (onGround && Math.abs(dx) < 70 && Math.abs(p.body.velocity.x) > 120 && now - (st.jumpAt || 0) > 200) { jumpTap(); st.grabs += 1; st.jumpAt = now; }
      } else {
        only(grab);
        if (onGround && now - (st.jumpAt || 0) > 200) { jumpTap(); st.grabs += 1; st.jumpAt = now; }
      }
      // Double saut (singe) : seule la forme singe s'accroche ; 2e appui ~200 ms après le 1er.
      if (!onGround && p.jumpsUsed < 2 && now - (st.jumpAt || 0) > (st.opts.gap || 200)) { jumpTap(); st.jumpAt = now; }
      return;
    }
    // Plus de danger : redescendre de la liane.
    if (p.vine) {
      only(['KeyS']);
      return;
    }
    // Pierre qui arrive sur elle : s'écarter (prédiction balistique jusqu'à
    // sa hauteur), direction tenue au moins 450 ms (pas d'aller-retour).
    if (st.dodgeUntil && now < st.dodgeUntil) { only([st.dodgeDir > 0 ? 'ArrowRight' : 'ArrowLeft']); return; }
    for (const h of hz) {
      if (h.kind !== 'stone' || !h.img) continue;
      const yT = p.y - 40;
      const a = h.g / 2, b = h.vy, c = h.img.y - yT;
      const disc = b * b - 4 * a * c;
      if (disc < 0) continue;
      const t = (-b + Math.sqrt(disc)) / (2 * a);
      if (t < 0 || t > 1.2) continue;
      const lx = h.img.x + h.vx * t;
      if (Math.abs(lx - p.x) < 90) {
        // Reculer (s'éloigner de lui) : la 2e pierre tombe entre elle et lui.
        let dir = p.x >= k.x ? 1 : -1;
        const minX = sc.__kainati.cfg.minX + 40, maxX = sc.__kainati.cfg.maxX - 40;
        if ((dir > 0 && p.x > maxX - 90) || (dir < 0 && p.x < minX + 90)) dir = -dir;
        if (Math.abs((p.x + dir * 90) - k.x) < 120) dir = -dir; // pas dans ses bras
        st.dodgeDir = dir;
        st.dodgeUntil = now + 450;
        only([dir > 0 ? 'ArrowRight' : 'ArrowLeft']);
        return;
      }
    }
    // Combat au sol : se placer à portée et frapper.
    const stunned = kst === 'stunned';
    // Côté où se placer : le sien, sauf s'il n'y a pas la place (coincée
    // entre lui et le rideau) -- alors de l'autre côté, en le traversant.
    const cfgA = sc.__kainati.cfg;
    const reach = stunned ? 70 : 108;
    let side = p.x < k.x ? -1 : 1;
    if (k.x + side * reach < cfgA.minX + 30 || k.x + side * reach > cfgA.maxX - 30) side = -side;
    const want = k.x + side * reach;
    const dx = want - p.x;
    if (Math.abs(dx) > 10) {
      only([dx > 0 ? 'ArrowRight' : 'ArrowLeft']);
    } else {
      // Face à lui puis attaque.
      const faceKey = side < 0 ? 'ArrowRight' : 'ArrowLeft';
      if ((p.facingDir >= 0 ? 1 : -1) !== -side) { only([faceKey]); return; }
      only([]);
      if (now - (st.lastK || 0) > 260) { st.lastK = now; tap('KeyK', 60); }
    }
  };
})();
