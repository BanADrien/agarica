// DuelBot : joue le duel de Geralt au clavier simulé (lit l'état du duel
// pour décider, n'agit QUE par touches). Modes : 'win' (esquive + frappe),
// 'idle' (ne fait rien : pour tester la défaite).
// Utilisation : ctrl de pilot.run = "window.DuelBot.step(sc, p, t, key, st)".
(function () {
  const sgn = (v) => (v > 0 ? 1 : v < 0 ? -1 : 0);
  window.DuelBot = {
    step(sc, p, t, key, st) {
      if (!st.init) {
        st.init = true; st.held = {}; st.taps = []; st.log = []; st.lastAtk = -9999; st.lastJump = -9999; st.lastE = -9999;
        st.hearts = p.hearts; st.hits = 0; st.lost = 0; st.parries = 0;
      }
      const mode = window.__duelBotMode || 'win';
      const press = (code, on) => { if (!!st.held[code] === on) return; st.held[code] = on; key(on ? 'keydown' : 'keyup', code); };
      const tap = (code, ms = 70) => { key('keydown', code); st.taps.push([t + ms, code]); };
      st.taps = st.taps.filter(([tt, c]) => { if (t >= tt) { key('keyup', c); return false; } return true; });
      const release = () => { press('ArrowLeft', false); press('ArrowRight', false); };
      // Journal : cœurs perdus, coups portés, états.
      const a2 = sc.__a2;
      const d = a2 && a2.duel;
      if (p.hearts < st.hearts) { st.lost += st.hearts - p.hearts; st.log.push(['ouch', Math.round(t), p.hearts, d ? d.G.state : null, d && d.C ? d.C.state : null, d ? d.arrows.length : 0]); }
      st.hearts = p.hearts;
      if (d && d.hits !== st.hits) { if (d.hits > st.hits) st.log.push(['hit', Math.round(t), d.hits, st.prevG]); st.hits = d.hits; }
      if (d) st.prevG = d.G.state + (d.G.state === 'tele' ? ':' + d.G.d.atk : '');
      if (window.__game.scene.isActive('DialogueScene')) {
        release();
        if (t - st.lastE > 380) { st.lastE = t; tap('KeyE'); }
        return;
      }
      if (!d || d.over || d.down || sc.__cutsceneLock || mode === 'idle') { release(); return; }
      const G = d.G;
      const C = d.C;
      // Mode « humain » (window.__duelBotHuman = { react, miss, atkDelay, seed }) :
      // une menace n'est vue qu'après `react` ms, et `miss` = part ignorée.
      const H = window.__duelBotHuman || null;
      if (!st.rng) { st.seed = (H && H.seed) || 7; st.rng = () => { st.seed = (st.seed * 16807) % 2147483647; return st.seed / 2147483647; }; st.seenMap = new Map(); st.nid = 0; }
      const idOf = (o) => { if (!o.__bid) o.__bid = ++st.nid; return o.__bid; };
      const perceive = (key) => {
        if (!H) return true;
        let r = st.seenMap.get(key);
        if (!r) { r = { t0: t, ignore: st.rng() < H.miss }; st.seenMap.set(key, r); if (st.seenMap.size > 400) st.seenMap.clear(); }
        return !r.ignore && t - r.t0 >= H.react;
      };
      const gy = d.groundY;
      const px = p.x;
      const onGround = p.body.blocked.down;
      let jump = false;
      const dangers = [];
      // Flèches en vol.
      for (const a of d.arrows) {
        if (a.state !== 'fly' || !perceive('a' + idOf(a))) continue;
        if (a.grav > 500) {
          // En cloche : point de chute.
          const disc = a.vy * a.vy + 2 * a.grav * (gy - a.y);
          const tl = (-a.vy + Math.sqrt(Math.max(0, disc))) / a.grav;
          if (tl < 1.1) dangers.push({ x: a.x + a.vx * tl, r: 34 });
        } else if (Math.abs(a.vy) < 30) {
          // Droite : sauter quand elle arrive.
          const dist = (px - a.x) * sgn(a.vx);
          if (dist > -5 && dist < 125 && a.y > p.body.top - 6 && a.y < p.body.bottom + 4) jump = true;
        } else {
          // Plongeante : s'écarter de sa ligne.
          const tt = (px - a.x) / (a.vx || 1);
          if (tt > -0.05 && tt < 0.5) {
            const yAt = a.y + a.vy * tt;
            if (yAt > p.body.top - 20 && yAt < p.body.bottom + 10) dangers.push({ x: px + sgn(a.vx || 1) * 4, r: 40 });
          }
        }
      }
      if (G.state === 'tele' && G.d.atk === 'lob' && perceive('l' + idOf(G.d))) for (const x of G.d.targets) dangers.push({ x, r: 36 });
      if (G.state === 'invoke' && G.d.tx != null && !(G.d.slam && G.t - G.d.slamT > 0.32) && perceive('i' + idOf(G.d))) dangers.push({ x: G.d.tx, r: 52 });
      if (G.state === 'jump' && !G.d.shot && perceive('j' + idOf(G.d))) dangers.push({ x: px, r: 30, soft: true }); // bouger pendant son saut
      if (C && C.state !== st.cState) { st.cState = C.state; st.cSeq = (st.cSeq || 0) + 1; }
      if (C && perceive('c' + st.cSeq)) {
        if (C.state === 'charge' && sgn(px - C.x) === C.dir && Math.abs(px - C.x) < 115) jump = true;
        if ((C.state === 'snapTele' || C.state === 'snap') && Math.abs(px - C.x) < 95) dangers.push({ x: C.x + C.dir * 20, r: 60 });
      }
      // Dans un danger : en sortir (de préférence vers Geralt).
      let move = 0;
      const inDanger = dangers.find((z) => Math.abs(px - z.x) < z.r + 14);
      if (inDanger) {
        let dir = sgn(px - inDanger.x) || sgn(G.x - px) || 1;
        if (inDanger.soft) dir = st.dodgeDir || (sgn(G.x - px) || 1);
        const nx = px + dir * 60;
        if (nx < d.minX + 30 || nx > d.maxX - 30 || dangers.some((z) => z !== inDanger && Math.abs(nx - z.x) < z.r)) dir = -dir;
        st.dodgeDir = dir;
        move = dir;
      } else {
        st.dodgeDir = 0;
        // Attaque : Clak d'abord s'il est collé à elle (phase 2), sinon Geralt.
        let tgt = G.x;
        let tgtState = 'g';
        if (C && C.state === 'idle' && Math.abs(C.x - px) < 85 && Math.abs(C.x - px) < Math.abs(G.x - px)) { tgt = C.x; tgtState = 'c'; }
        const dx = tgt - px;
        const side = sgn(dx) || 1;
        const adx = Math.abs(dx);
        const canHit = tgtState === 'c' || !G.trance;
        if (G.trance && tgtState === 'g') {
          // Transe : inutile de frapper (« Ping ! »), on attend loin de la colonne.
          move = 0;
        } else if (adx > 70) {
          st.inRange = null;
          move = side;
        } else if (adx < 18) {
          move = -side;
        } else {
          // À portée : regarder la cible puis frapper.
          if (st.inRange == null) st.inRange = t;
          const delay = H ? H.atkDelay || 0 : 0;
          if (p.facingDir !== side) move = side;
          else if (canHit && t - st.lastAtk > (H ? 420 : 330) && t - st.inRange >= delay) { st.lastAtk = t; tap('KeyK'); }
        }
        // Ne pas avancer dans une zone de chute de flèche.
        if (move && dangers.some((z) => Math.abs(px + move * 30 - z.x) < z.r + 6)) move = 0;
      }
      // Collets armés : les sauter.
      if (move && onGround) {
        for (const tr of d.traps) {
          if ((tr.state !== 'armed' && tr.state !== 'setting') || !perceive('t' + idOf(tr))) continue;
          const ahead = (tr.x - px) * move;
          if (ahead > 18 && ahead < 52) jump = true;
          if (Math.abs(tr.x - px) <= 18 && tr.state === 'setting') jump = true;
        }
      }
      press('ArrowLeft', move < 0);
      press('ArrowRight', move > 0);
      if (jump && onGround && t - st.lastJump > 280) { st.lastJump = t; tap('Space', 110); }
    },
  };
})();

// Pilote persistant : appelle step() à chaque image de la scène de zone.
(function () {
  window.DuelBot.attach = function () {
    const sc = window.__drv.levelScene();
    const st = window.DuelBot.state = {};
    const t0 = sc.time.now;
    if (window.DuelBot._h) window.DuelBot._sc.events.off('update', window.DuelBot._h);
    window.DuelBot._sc = sc;
    window.DuelBot._h = () => {
      try {
        if (sc.player) window.DuelBot.step(sc, sc.player, sc.time.now - t0, window.__drv.key, st);
      } catch (e) { st.err = String(e && e.stack || e); }
    };
    sc.events.on('update', window.DuelBot._h);
    return true;
  };
  window.DuelBot.detach = function () {
    if (window.DuelBot._h) window.DuelBot._sc.events.off('update', window.DuelBot._h);
    window.DuelBot._h = null;
    for (const c of ['ArrowLeft', 'ArrowRight', 'Space', 'KeyK']) window.__drv.key('keyup', c);
    return true;
  };
})();
