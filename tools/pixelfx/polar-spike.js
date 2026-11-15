// Traînée de glace de l'ours polaire (Legend of Agarica), d'après le croquis de l'utilisateur (2026-11-14) :
// une rangée CONTINUE de cristaux de glace serrés, de plus en plus hauts jusqu'au gros amas du bout. Des
// CRISTAUX (prismes à six pans : flancs parallèles, pointe taillée), pas des pics, et dans TOUS les sens :
// droits, penchés en avant, en arrière, en éventail. Le jeu pose côte à côte six segments (cinq de la rangée,
// puis le gros), chacun rendu par cet effet : `span` = largeur couverte (les segments se touchent), hauteur qui
// monte de `from` à `height` sur sa largeur. Un segment perce le sol dans un éclair blanc avec éclats et givre,
// scintille, puis blanchit et vole en éclats.
// Rendu par tools/pixelfx/export_glace.mjs. Particules et éclats : pixelfx (sim.js, adapté des effets de
// Sprite Fusion, MIT, Copyright (c) 2026 Hugo Duprez).
import { Particles, Bits, Lights, P, B, Rng, fit, sparkle, clamp, ease, rand, WHITE } from "../../core/index.js";

export const meta = {
  name: "Polar spike",
  desc: "A tight row of six-sided ice crystals bursts out of the floor at every angle, rising toward its far end, glints on a frosted strip, then shatters into a lingering white mist.",
  tags: ["ice", "crystal", "ground", "wave", "magic", "one-shot"],
  size: [96, 96],
  origin: [48, 80],
  duration: 1.5,
  loop: false,
  fps: 20,
  bg: "ground",
  options: {
    // teintes adoucies (2026-11-14 : « trop flashy par rapport au reste du jeu »)
    palette: ["#1b2236", "#2a3956", "#3c5a7e", "#5580a4", "#79a3c0", "#a3c3d6", "#cbdfe9", "#e8f2f6"],
    // largeur couverte et hauteurs au début / à la fin du segment (px de l'effet ; x2 à l'écran)
    span: 34,
    from: 10,
    height: 16,
    // gros amas du bout : un grand cristal dressé et une couronne de cristaux en éventail
    big: false,
    seed: 4,
  },
};

const RISE = 0.11;      // il sort du sol (POLAR_TUNING.riseMs)
const GLINT = 0.3;      // un reflet le parcourt
const FLASH = 0.7, SHATTER = 0.76; // il tremble, puis casse ; la brume reste jusqu'à 1,5 s

// Un cristal : prisme de demi-largeur `hw`, long de `len` depuis sa base (bx, 0), orienté `ang` (radians depuis
// la verticale, + = vers l'avant). Flancs parallèles, puis pointe taillée sur `cap`. Facettes : face gauche
// claire, arête blanche, face droite plus sombre, contour sombre d'un pixel, pointe blanche.
function prism(p, bx, len, hw, ang, C, opts = {}) {
  if (len < 2 || hw < 0.8) return;
  const ux = Math.sin(ang), uy = -Math.cos(ang); // axe (vers le haut)
  const nx = -uy, ny = ux;                         // normale (vers la droite de l'axe)
  const cap = Math.min(len * 0.45, hw * 1.7), body = len - cap, dim = opts.dim ?? 0;
  const K = (i) => C[clamp(i - dim, 0, C.length - 1)];
  const halfAt = (u) => (u < 0 ? hw : u <= body ? hw : hw * (1 - (u - body) / cap));
  const local = (x, y) => {
    const dx = x - bx, dy = y;
    return [dx * ux + dy * uy, dx * nx + dy * ny];
  };
  const inside = (x, y) => {
    const [u, v] = local(x + 0.5, y + 0.5);
    return u >= -3 && u <= len && Math.abs(v) <= halfAt(u) + 0.3 && y + 0.5 <= 0.6;
  };
  const r = len + hw + 3;
  for (let y = Math.floor(-r); y <= 1; y++) {
    for (let x = Math.floor(bx - r); x <= Math.ceil(bx + r); x++) {
      if (!inside(x, y)) continue;
      const rim = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || (!inside(x, y + 1) && y < 0);
      if (opts.white) { p.dot(x, y, rim ? K(5) : K(6), opts.a ?? 1); continue; }
      const [u, v] = local(x + 0.5, y + 0.5), hv = v / Math.max(0.5, halfAt(u));
      let col;
      if (rim) col = K(1);
      else if (u > len - cap * 0.55) col = hv < 0.08 ? K(7) : K(6);      // pointe taillée (reflet plus fin : retour du 2026-11-14, « trop de reflets »)
      else if (Math.abs(hv + 0.2) < 0.18) col = K(6);                      // arête
      else if (hv < -0.2) col = hv < -0.7 ? K(6) : K(5);                    // face éclairée
      else col = hv > 0.65 ? K(2) : K(3);                                   // face dans l'ombre
      if (opts.glint >= 0 && hv < 0.1) {
        const g = Math.abs(u / len - opts.glint);
        if (g < 0.035) col = K(6); // reflet qui passe : étroit, sans blanc
      }
      p.dot(x, y, col, opts.a ?? 1);
    }
  }
}

export function create(o) {
  const C = fit(o.palette, 8), R = new Rng(o.seed), SPAN = o.span, big = !!o.big, floor = () => 0;
  const ps = new Particles({ rng: R, ground: floor, sparks: [C[7], C[6], C[5], C[4]], haze: C[5] });
  const bits = new Bits({ ground: floor }), lights = new Lights();
  const heightAt = (x) => o.from + (o.height - o.from) * clamp((x + SPAN / 2) / SPAN);
  // Orientation : dans tous les sens (droit, avant, arrière), plus couchés pour les petits.
  const angle = (k) => (R.chance(0.5) ? 1 : -1) * R.range(0, 0.25 + 0.6 * k);
  const crystals = [];
  if (big) {
    // le bout : un BLOC serré (retour du 2026-11-14 : l'éventail était trop dispersé) -- un grand cristal
    // dressé, et des cristaux pressés contre lui, à peine ouverts, presque tous dans sa moitié basse
    const H = o.height;
    crystals.push({ dx: SPAN * 0.02, len: H, hw: SPAN * 0.15, ang: 0.06, back: false, delay: 0, main: true });
    for (const [dx, k, a, back] of [[-0.14, 0.72, -0.2, true], [0.16, 0.66, 0.24, true], [-0.22, 0.5, -0.36, false],
      [0.24, 0.46, 0.4, false], [-0.06, 0.4, -0.1, false], [0.1, 0.34, 0.18, false], [-0.3, 0.3, -0.55, false], [0.32, 0.28, 0.6, false]]) {
      crystals.push({ dx: SPAN * dx, len: H * k * R.range(0.92, 1.06), hw: SPAN * R.range(0.08, 0.11), ang: a + R.range(-0.06, 0.06), back, delay: R.range(0.02, 0.05) });
    }
  } else {
    // la rangée : cristaux serrés de tailles VARIÉES tout du long (retour du 2026-11-14 : pas de montée
    // progressive), dans tous les sens ; derrière, une rangée plus sombre décalée
    const size = () => o.height * (R.chance(0.3) ? R.range(1.0, 1.35) : R.range(0.45, 0.85));
    for (let x = -SPAN / 2 + 3; x <= SPAN / 2 - 1; x += R.range(6, 8)) {
      crystals.push({ dx: x, len: size(), hw: R.range(2.8, 4), ang: angle(R.next()), back: false, delay: R.range(0, 0.035) });
    }
    for (let x = -SPAN / 2 + 5; x <= SPAN / 2 + 1; x += R.range(6, 8)) {
      crystals.push({ dx: x, len: size() * 1.05, hw: R.range(2.5, 3.5), ang: angle(R.next()) * 0.8, back: true, delay: R.range(0.01, 0.045) });
    }
    // le plus haut du segment prend le reflet
    const top = crystals.filter((c) => !c.back).reduce((a, c) => (c.len > a.len ? c : a));
    top.main = true;
  }
  const mainC = crystals.find((c) => c.main) || crystals[0];
  let t = 0, burst = false, broke = false;
  const grow = (c) => ease.outBack(clamp((t - c.delay) / RISE), 2.2);
  const tipOf = (c) => { const g = grow(c); return [c.dx + Math.sin(c.ang) * c.len * g, -Math.cos(c.ang) * c.len * g]; };
  return {
    update(dt) {
      t += dt;
      if (!burst) {
        burst = true;
        for (let i = 0; i < (big ? 14 : 7); i++) {
          bits.add({ kind: B.SHARD, x: R.range(-SPAN / 2, SPAN / 2), y: -1, vx: R.range(-100, 100), vy: -R.range(70, big ? 260 : 170), g: 0.9, drag: 0.6, bounce: 0.3, life: R.range(0.35, 0.7), a: R.range(0, 6.28), va: R.range(-10, 10), s: R.range(1, big ? 2.4 : 1.7), ramp: C });
        }
        for (let i = 0; i < (big ? 5 : 3); i++) ps.spawn(P.VAPOUR, R.range(-SPAN / 2, SPAN / 2), -R.range(0, 3), R.range(-40, 40), -R.range(2, 12), R.range(0.35, 0.6), C[6], R.range(1.6, big ? 3 : 2.4));
        for (let i = 0; i < (big ? 6 : 2); i++) ps.spawn(P.FLAKE, R.range(-SPAN / 2, SPAN / 2), -R.range(2, o.height * 0.6), R.range(-30, 30), -R.range(20, 70), R.range(0.4, 0.8), R.chance(0.5) ? WHITE : C[6], R.range(0.5, 1.1));
        lights.add(0, -o.height * 0.4, o.height + 14, C[5], big ? 0.3 : 0.2, 0.22);
      }
      if (!broke && t >= SHATTER) {
        broke = true;
        for (const c of crystals) {
          const [tx, ty] = tipOf(c);
          for (let i = 0; i < 1 + c.len / 7; i++) {
            const u = R.next();
            bits.add({ kind: R.chance(0.25) ? B.CHUNK : B.SHARD, x: c.dx + (tx - c.dx) * u, y: ty * u, vx: R.range(-80, 80), vy: -R.range(30, 150), g: 0.9, drag: 0.6, bounce: 0.3, life: R.range(0.15, 0.24), a: R.range(0, 6.28), va: R.range(-12, 12), s: R.range(1, 2.2), ramp: C });
          }
        }
        // brume blanche qui s'attarde là où était la glace (retour du 2026-11-14)
        for (let i = 0; i < (big ? 16 : 8); i++) {
          ps.spawn(P.VAPOUR, R.range(-SPAN / 2, SPAN / 2), -R.range(1, o.height * 0.6), R.range(-14, 14), -R.range(3, 10),
            R.range(0.5, 0.72), R.chance(0.6) ? WHITE : C[7], R.range(2.2, big ? 4.5 : 3.4));
        }
      }
      ps.update(dt); bits.update(dt); lights.update(dt);
    },
    draw(p) {
      if (t >= meta.duration) return;
      // bande de givre sous toute la largeur (les segments voisins la prolongent)
      const fade = clamp((t - SHATTER) / 0.24);
      const half = Math.ceil(SPAN / 2) + 1;
      for (let x = -half; x <= half; x++) {
        const h = rand(x, 17, o.seed), a = (1 - fade) * clamp(t / 0.06);
        if (a <= 0.05) continue;
        p.dot(x, 0, h < 0.2 ? C[7] : C[6], a);
        if (h < 0.4) p.dot(x, -1, h < 0.08 ? C[7] : C[5], a);
        if (h > 0.5) p.dot(x, 1, C[4], a * 0.8);
      }
      if (t < SHATTER) {
        for (const pass of [0, 1]) {
          for (const c of crystals) {
            if ((pass === 0) !== !!c.back) continue;
            const g = grow(c);
            if (g <= 0) continue;
            const jx = t >= FLASH - 0.12 && t < FLASH ? (Math.floor(t * 40 + c.dx) % 2 ? 1 : 0) : 0;
            const white = t - c.delay < 0.045;
            const gl = (t - GLINT - (c.dx + SPAN / 2) / SPAN * 0.12) / 0.22;
            prism(p, c.dx + jx, c.len * g, c.hw, c.ang, C, { white, dim: c.back ? 1 : 0, glint: gl >= 0 && gl <= 1 ? gl : -1 });
          }
        }
        const pop = clamp(1 - t / 0.15);
        // halo réduit de moitié (retour du 2026-11-14 : « que la glace brille un peu moins »)
        p.glow(SPAN * 0.1, -o.height * 0.45, o.height * 0.9 + SPAN * 0.4, C[4], 0.03 + 0.1 * pop);
        if (pop > 0) p.glow(0, -2, SPAN * 0.5, C[6], 0.12 * pop);
        // étoile au sommet du plus haut cristal pendant le reflet
        const [mx, my] = tipOf(mainC);
        const k = (t - GLINT - 0.1) / 0.16;
        if (big && k >= 0 && k <= 1) sparkle(p, mx, my + 1, 1 + 1.5 * Math.sin(k * Math.PI), C[6], C[4]); // petite étoile, sur le bout seulement
      }
      bits.draw(p);
      ps.draw(p);
      lights.draw(p);
    },
  };
}
