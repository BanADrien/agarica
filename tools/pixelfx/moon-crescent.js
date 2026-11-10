// Croissant de lune : l'arc de la dague d'Agarica (Legend of Agarica). Un croissant « ) » qui claque blanc,
// s'épaissit en vert lunaire avec des feuilles arrachées sur son bord, puis s'effile en pointillés.
import { Rng, fit, sparkle, clamp, smooth, ease, WHITE } from "../../core/index.js";

export const meta = {
  name: "Moon crescent",
  desc: "A wide crescent snaps open white, swells into moon green with torn leaves riding its rim, then thins to a dotted trace as the leaves drift off.",
  tags: ["melee", "slash", "dagger", "crescent", "leaves", "directional", "one-shot"],
  size: [77, 72],
  origin: [38, 36],
  duration: 0.3,
  loop: false,
  fps: 30,
  bg: "dark",
  options: {
    palette: ["#0e3a26", "#1f7a4c", "#3fc47c", "#7dedb0", "#c4ffe0", "#f2fff7"],
    leaf: ["#2f8f58", "#8fe6a8", "#d8ffe6"],
    // "side" : bombé vers la droite ; "up" : vers le haut ; "down" : vers le bas
    dir: "side",
    seed: 3,
  },
};

// Gabarits par direction, en px autour du centre : `len` = du bout des pointes au sommet du bombé,
// `half` = demi-ouverture, `thick` = épaisseur au sommet. Calés sur la zone de coup du jeu.
const SHAPES = {
  side: { len: 70, half: 25, thick: 21 },
  up: { len: 66, half: 27, thick: 20 },
  down: { len: 66, half: 27, thick: 20 },
};

// (u, v) : u le long du bombé (0 = pointes, len = sommet), v en travers. Rend la place dans le croissant :
// q = 0 sur le bord extérieur, 1 sur le bord intérieur ; null dehors. `w` = épaisseur au sommet à cet instant.
function inCrescent(S, u, v, w, grow) {
  const k = v / S.half;
  if (Math.abs(k) >= 1) return null;
  // coque de demi-ellipse : les deux bords partent des pointes, l'épaisseur fond vers elles
  const r = Math.sqrt(1 - k * k), uo = S.len * grow * r, local = Math.max(0.7, w * Math.pow(r, 0.85));
  if (u > uo || u < uo - local) return null;
  return { q: clamp((uo - u) / local), local, tip: r };
}

function toLocal(dir, x, y, S) {
  // centre du gabarit au centre de l'image
  if (dir === "up") return [S.len / 2 - y, x];
  if (dir === "down") return [S.len / 2 + y, -x];
  return [x + S.len / 2, y];
}

function fromLocal(dir, u, v, S) {
  if (dir === "up") return [v, S.len / 2 - u];
  if (dir === "down") return [-v, u - S.len / 2];
  return [u - S.len / 2, v];
}

// petite feuille en losange, 2 tons, tournée selon `a`
function leaf(p, x, y, a, s, L, k) {
  const c = Math.cos(a), n = Math.sin(a);
  for (let i = -s; i <= s; i++) {
    const wd = Math.round((1 - Math.abs(i) / (s + 0.5)) * (s * 0.55));
    for (let j = -wd; j <= wd; j++) p.dot(x + i * c - j * n, y + i * n + j * c, j < 0 ? L[2] : i > 0 ? L[1] : L[0], k);
  }
}

export function draw(p, t, o) {
  const dir = SHAPES[o.dir] ? o.dir : "side", S = SHAPES[dir];
  const C = fit(o.palette, 6), L = fit(o.leaf, 3), n = C.length;
  if (t >= meta.duration) return;
  // trois temps de 0,1 s : claquement, plein, effacement
  const open = ease.outExpo(clamp(t / 0.07)), fade = smooth(0.2, 0.3, t), full = smooth(0.06, 0.13, t);
  const grow = 0.86 + 0.14 * open;
  const w = S.thick * (0.42 + 0.58 * full) * (1 - fade * 0.72);
  const young = t < 0.1;
  const B = Math.max(S.len, S.half * 2) / 2 + 3;
  // gabarit centré : la coque va de u = 0 (pointes) à u = len (sommet)
  p.shade(-B, -B, B, B, (x, y, out) => {
    const [u, v] = toLocal(dir, x, y, S);
    const h = inCrescent(S, u, v, w, grow);
    if (!h) return;
    // bord extérieur blanc (le fil de la lame), puis la rampe refroidit vers l'intérieur et avec l'âge
    let ci;
    if (young) ci = h.q < 0.55 ? n - 1 : n - 2;
    else if (h.q < 0.2 && fade < 0.5) ci = n - 1;
    else ci = Math.round((1 - h.q) * (n - 2) - fade * 2.2 + (h.q < 0.45 ? 0.6 : 0));
    out.c = C[clamp(ci, 0, n - 1)];
    // les pointes et la fin se dissolvent dans le tramage
    out.a = Math.min(1, h.tip * 2.4) * (1 - fade * (0.55 + 0.45 * h.q));
  });
  // lumière le long du fil, plus forte au sommet
  for (let k = -0.8; k <= 0.8; k += 0.2) {
    const [x, y] = fromLocal(dir, (S.len * grow - w * 0.4) * Math.sqrt(1 - k * k), k * S.half, S);
    p.glow(x, y, 5 + w * 0.4, C[n - 3], (young ? 0.28 : 0.18) * (1 - fade) * (1 - Math.abs(k) * 0.6));
  }
  // éclat au sommet pendant le claquement
  if (t < 0.1) {
    const [x, y] = fromLocal(dir, S.len * grow - 3, 0, S);
    sparkle(p, x, y, 3 * (1 - t / 0.1) + 1.5, WHITE, C[n - 2]);
  }
  // feuilles arrachées : nées sur le bord extérieur, elles partent vers le dehors et s'éteignent
  const R = new Rng(o.seed);
  for (let i = 0; i < 9; i++) {
    const k = R.range(-0.92, 0.92), born = R.range(0.03, 0.1), sp = R.range(14, 46), spin = R.range(-5, 5), sz = R.range(1.6, 2.9), a0 = R.range(0, 6.28);
    const drift = R.range(-10, 10);
    if (t < born) continue;
    const age = t - born, v0 = k * S.half, u0 = (S.len - 2) * Math.sqrt(1 - k * k);
    const u = u0 + sp * 0.5 * age * (1 - age * 1.2), v = v0 + (k * 16 + drift) * age;
    const [x, y] = fromLocal(dir, u, v, S);
    leaf(p, x, y, a0 + spin * age, Math.round(sz), L, 1 - smooth(0.12, 0.26, age));
  }
  // traînée en pointillés là où le croissant s'est retiré
  if (fade > 0.15) {
    for (let k = -0.9; k <= 0.9; k += 0.07) {
      const [x, y] = fromLocal(dir, (S.len - 1) * Math.sqrt(1 - k * k), k * S.half, S);
      if (Math.round((k + 1) * 14) % 2 === 0) p.dot(x, y, C[2], (1 - fade) * 0.9);
    }
  }
}
