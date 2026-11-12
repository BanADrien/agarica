// PathBot : pilote Agarica au clavier simulé (KeyboardEvent) le long d'une
// liste d'étapes, dans la scène de niveau courante. Fait défiler les
// dialogues bloquants (E toutes les ~500 ms : le 1er choix est pris).
//   { walk: x, sprint }                marcher (ou courir en loup) jusqu'à x ;
//                                      saute seul quand un mur bloque
//   { jumpAt: x, to: x2, second, sprint, secondDelay }
//                                      aller jusqu'à x, sauter, tenir la direction
//                                      vers x2 jusqu'à l'atterrissage ; second :
//                                      2e saut (singe/aigle/papillon) à l'apex
//   { hop: [x1, x2, y], second }       se poser sur la plateforme (saut au bord)
//   { press: 'KeyE' }  { attack: n, aim: 'up'|'down'|null, every }  { skill: 'KeyA' }
//   { wait: ms }  { waitFor: 'expr JS (sc, p)' , timeout }
//   { face: 'left'|'right' }  { js: 'code (sc, p)' }
// window.PathBot.start(steps) ; window.PathBot.state -> { k, done, ok, log }
(function () {
  const KC = { ArrowRight: 39, ArrowLeft: 37, ArrowUp: 38, ArrowDown: 40, Space: 32, KeyZ: 90, KeyS: 83, KeyK: 75,
    ShiftLeft: 16, KeyE: 69, KeyA: 65, KeyF: 70, KeyR: 82, Enter: 13, KeyQ: 81, KeyD: 68, Escape: 27 };
  const KN = { Space: ' ', Enter: 'Enter', KeyE: 'e', KeyZ: 'z', KeyS: 's', KeyK: 'k', KeyA: 'a', KeyF: 'f', KeyR: 'r', ShiftLeft: 'Shift', KeyQ: 'q', KeyD: 'd' };
  function key(type, code) {
    const ev = new KeyboardEvent(type, { code, key: KN[code] || code, bubbles: true, cancelable: true, shiftKey: code === 'ShiftLeft' });
    Object.defineProperty(ev, 'keyCode', { get: () => KC[code] });
    Object.defineProperty(ev, 'which', { get: () => KC[code] });
    window.dispatchEvent(ev);
  }
  function levelScene() {
    return (typeof currentLevelScene !== 'undefined' && currentLevelScene && currentLevelScene.sys.isActive())
      ? currentLevelScene : window.__game.scene.getScenes(true).find((s) => s.player);
  }
  const B = window.PathBot = { state: null };
  const held = new Set();
  // Touche tenue : keydown répété (~250 ms), comme la répétition du clavier
  // (la fin d'une cinématique relâche les touches côté Phaser).
  const lastSent = {};
  const down = (c) => {
    const now = performance.now();
    if (!held.has(c) || now - (lastSent[c] || 0) > 250) { held.add(c); lastSent[c] = now; key('keydown', c); }
  };
  const up = (c) => { if (held.has(c)) { held.delete(c); key('keyup', c); } };
  const releaseAll = () => { for (const c of [...held]) up(c); };
  const taps = [];
  const tap = (c, now, ms = 80) => { key('keydown', c); taps.push([now + ms, c]); };
  // Saut à hauteur variable (Player.js, JUMP_CUT_VY) : Espace relâché pendant
  // la montée = saut court. Les parcours sont calés sur le saut TENU : Espace
  // reste enfoncé jusqu'au sommet (vitesse verticale >= 0), 900 ms au plus.
  // Un 2e saut pendant la montée : relâché puis réappuyé dans la même image.
  let jumpHold = null;
  const jumpTap = (now) => {
    for (let i = taps.length - 1; i >= 0; i--) if (taps[i][1] === 'Space') taps.splice(i, 1);
    if (jumpHold) key('keyup', 'Space');
    key('keydown', 'Space');
    jumpHold = { at: now, seenUp: false };
  };
  const jumpHoldTick = (p, now) => {
    if (!jumpHold) return;
    const vy = p && p.body ? p.body.velocity.y : 0;
    if (vy < -20) jumpHold.seenUp = true;
    if ((jumpHold.seenUp && vy >= 0) || now - jumpHold.at > 900 || (!jumpHold.seenUp && now - jumpHold.at > 160)) {
      key('keyup', 'Space');
      jumpHold = null;
    }
  };
  B.start = (steps) => {
    releaseAll();
    B.state = { steps, k: 0, done: false, ok: false, log: [], t0: performance.now(), sub: {} };
    if (B.timer) clearInterval(B.timer);
    B.timer = setInterval(B.tick, 16);
  };
  B.pressE = () => { tap('KeyE', performance.now(), 90); return true; };
  B.stop = () => { if (B.timer) clearInterval(B.timer); B.timer = null; releaseAll(); if (jumpHold) { key('keyup', 'Space'); jumpHold = null; } };
  B.tick = () => {
    const st = B.state;
    const now = performance.now();
    for (let i = taps.length - 1; i >= 0; i--) if (now >= taps[i][0]) { key('keyup', taps[i][1]); taps.splice(i, 1); }
    if (!st || st.done) return;
    const g = window.__game;
    const sc = levelScene();
    if (!sc || !sc.player || !sc.player.body) return;
    const p = sc.player;
    jumpHoldTick(p, now);
    if (g.scene.isActive('DialogueScene') || g.scene.isActive('CampfireMenuScene')) {
      releaseAll();
      if (now - (st.lastE || 0) > 500) { st.lastE = now; tap(g.scene.isActive('CampfireMenuScene') ? 'Escape' : 'KeyE', now); }
      return;
    }
    if (st.k >= st.steps.length) { st.done = true; st.ok = true; releaseAll(); st.log.push(['fin', Math.round(now - st.t0)]); return; }
    const s = st.steps[st.k];
    const sub = st.sub;
    const next = (why) => { st.log.push([st.k, why || 'ok', Math.round(p.x), Math.round(p.y), Math.round(now - st.t0)]); st.k += 1; st.sub = {}; releaseAll(); };
    if (!sub.t0) sub.t0 = now;
    if (now - sub.t0 > (s.timeout || 25000)) { st.log.push([st.k, 'TIMEOUT', Math.round(p.x), Math.round(p.y)]); st.done = true; st.ok = false; releaseAll(); return; }
    const onGround = p.body.blocked.down;
    const frozen = typeof isWorldFrozen === 'function' && isWorldFrozen(sc);
    if (frozen && !s.waitFor) { releaseAll(); return; }
    // Combat automatique (option du parcours) : un ennemi à portée -> face à
    // lui et coup (K), en haut s'il est au-dessus.
    if (B.autoFight && sc.enemies && !s.noFight) {
      const foe = sc.enemies.getChildren().find((e) => e.active && !e.defeated && !e.healed && !e.harmless
        && Math.abs(e.x - p.x) < (B.fightRange || 95)
        && Math.abs((e.body ? e.body.bottom : e.y) - p.body.bottom) < 48);
      if (foe) {
        const fd = foe.x >= p.x ? 1 : -1;
        if (now - (st.lastHit || 0) > 330) {
          st.lastHit = now;
          releaseAll();
          tap(fd > 0 ? 'ArrowRight' : 'ArrowLeft', now, 40);
          if (foe.y < p.y - 90) { down('KeyZ'); setTimeout(() => up('KeyZ'), 150); }
          setTimeout(() => tap('KeyK', performance.now(), 80), 45);
        }
        return;
      }
    }
    const hopIfBlocked = (dir) => {
      if (onGround && ((dir > 0 && p.body.blocked.right) || (dir < 0 && p.body.blocked.left)) && now - (sub.lastJump || 0) > 450) {
        sub.lastJump = now; jumpTap(now);
      }
    };
    if (s.walk != null) {
      const dx = s.walk - p.x;
      if (Math.abs(dx) < (s.tol || 12)) return next();
      const dir = Math.sign(dx);
      down(dir > 0 ? 'ArrowRight' : 'ArrowLeft'); up(dir > 0 ? 'ArrowLeft' : 'ArrowRight');
      if (s.sprint) down('ShiftLeft');
      hopIfBlocked(dir);
      return;
    }
    if (s.leave) {
      // Sortie de bord : tenir la direction jusqu'à arriver dans une autre zone.
      if (!sub.key) sub.key = sc.scene.key;
      if (sc.scene.key !== sub.key) return next('zone ' + sc.scene.key);
      const dir = s.leave;
      down(dir > 0 ? 'ArrowRight' : 'ArrowLeft'); up(dir > 0 ? 'ArrowLeft' : 'ArrowRight');
      if (s.sprint) down('ShiftLeft');
      hopIfBlocked(dir);
      return;
    }
    if (s.jumpAt != null) {
      const dir = Math.sign((s.to ?? s.jumpAt + 1) - s.jumpAt) || 1;
      if (!sub.jumped) {
        const dx = s.jumpAt - p.x;
        down(dir > 0 ? 'ArrowRight' : 'ArrowLeft');
        if (s.sprint) down('ShiftLeft');
        if (dir * dx <= 0 && onGround) { sub.jumped = now; jumpTap(now); }
        else hopIfBlocked(dir);
        return;
      }
      if (s.second && !sub.second && now - sub.jumped > (s.secondDelay || 380)) { sub.second = now; jumpTap(now); }
      if (s.to != null && Math.abs(p.x - s.to) < 24) up(dir > 0 ? 'ArrowRight' : 'ArrowLeft');
      if (onGround && now - sub.jumped > 250) return next('posée');
      return;
    }
    if (s.hop) {
      const [x1, x2, y] = s.hop;
      if (onGround && Math.abs(p.body.bottom - y) < 8 && p.x > x1 + 6 && p.x < x2 - 6) return next();
      const cx = (x1 + x2) / 2;
      const dir = cx > p.x ? 1 : -1;
      if (onGround) {
        sub.jumped = false; sub.second = false;
        down(dir > 0 ? 'ArrowRight' : 'ArrowLeft'); up(dir > 0 ? 'ArrowLeft' : 'ArrowRight');
        const near = dir > 0 ? x1 : x2;
        if (Math.abs(near - p.x) < (s.edge || 150) || p.body.blocked.left || p.body.blocked.right) {
          if (now - (sub.lastJump || 0) > 400) { sub.lastJump = now; sub.jumped = now; sub.rise = p.body.bottom - y; jumpTap(now); }
        }
        return;
      }
      const over = p.x > x1 + 20 && p.x < x2 - 20;
      if (over && p.body.bottom < y - 4) releaseAll(); else { down(dir > 0 ? 'ArrowRight' : 'ArrowLeft'); up(dir > 0 ? 'ArrowLeft' : 'ArrowRight'); }
      if (sub.jumped && !sub.second && (s.second || sub.rise > 150) && p.body.velocity.y > -60) { sub.second = true; jumpTap(now); }
      return;
    }
    if (s.press) { if (!sub.done) { sub.done = true; tap(s.press, now, 90); sub.at = now; } else if (now - sub.at > (s.after || 400)) next(); return; }
    if (s.skill) { if (!sub.done) { sub.done = true; tap(s.skill, now, 90); sub.at = now; } else if (now - sub.at > (s.after || 1600)) next(); return; }
    if (s.attack) {
      sub.n = sub.n || 0;
      if (sub.n >= s.attack) return next();
      if (now - (sub.at || 0) > (s.every || 380)) {
        sub.at = now; sub.n += 1;
        if (s.aim === 'up') { down('KeyZ'); setTimeout(() => up('KeyZ'), 160); }
        tap('KeyK', now, 80);
      }
      return;
    }
    if (s.face) { tap(s.face === 'left' ? 'ArrowLeft' : 'ArrowRight', now, 60); return next(); }
    if (s.wait != null) { if (now - sub.t0 >= s.wait) next(); return; }
    if (s.waitFor) {
      let okv = false;
      try { okv = !!(new Function('sc', 'p', 'return (' + s.waitFor + ');'))(sc, p); } catch (e) { okv = false; }
      if (okv) next();
      return;
    }
    if (s.js) { try { (new Function('sc', 'p', s.js))(sc, p); } catch (e) { st.log.push(['js-err', String(e)]); } next(); return; }
    next('étape inconnue');
  };
})();
