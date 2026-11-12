// Courant d'air ascendant (Legend of Agarica) : des filets de vent qui se tracent de bas en haut, ondulent,
// s'enroulent en volute à leur tête puis s'effacent par la queue, avec quelques grains de lumière.
// La case se répète sans raccord en largeur ET en hauteur : le jeu la pose en mosaïque sur toute la colonne
// et la fait défiler vers le haut (la montée vient du jeu, ici il n'y a que la vie des filets).
// Deux plans (option `layer`) : "fond" = filets fins et pâles, "avant" = filets à volute, plus clairs.
import { fit, clamp, rand, TAU } from "../../core/index.js";

export const meta = {
  name: "Updraft",
  desc: "A tileable column of rising wind: thin streams draw themselves upward, sway, curl at the tip and thin out from the tail, with a few motes of light. Tiles seamlessly both ways; scroll it upward in the engine.",
  tags: ["weather", "wind", "updraft", "air", "ambient", "loop", "tile"],
  size: [128, 128],
  origin: [0, 0],
  duration: 2.4,
  loop: true,
  fps: 10,
  bg: "sky",
  options: {
    palette: ["#3f7fb0", "#86c6de", "#b9ecf7", "#e2fbff", "#ffffff"],
    layer: "avant",
    seed: 7,
  },
};

const D = meta.duration, W = meta.size[0], H = meta.size[1];
const wrap = (v, n) => ((v % n) + n) % n;
const ease = (u) => u * u * (3 - 2 * u);

// Chemin d'un filet, de la queue (s = 0, en bas) à la tête (s = 1, en haut) : une tige qui ondule, puis,
// pour les filets à volute, une boucle qui se referme sur elle-même.
function pathOf(x0, y0, len, amp, waves, psi, curl, dir) {
  const pts = [];
  const stem = curl > 0 ? 0.72 : 1;
  const n = Math.ceil(len * 2);
  let hx = x0, hy = y0;
  for (let i = 0; i <= n; i++) {
    const s = i / n;
    hx = x0 + amp * Math.sin(s * Math.PI * waves + psi) * (0.35 + 0.65 * s);
    hy = y0 - s * len * stem;
    pts.push([hx, hy]);
  }
  if (curl > 0) {
    // volute : part vers le haut puis tourne du côté `dir`, rayon qui se resserre
    const turns = 1.15, m = Math.ceil(curl * 14);
    const cx = hx + dir * curl, cy = hy;
    for (let i = 1; i <= m; i++) {
      const s = i / m, r = curl * (1 - 0.62 * s);
      const a = (dir > 0 ? Math.PI : 0) - dir * s * turns * TAU;
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.9]);
    }
  }
  return pts;
}

export function draw(p, t, o) {
  const C = fit(o.palette, 5), S = o.seed, near = o.layer !== "fond";
  const ph = (t % D) / D;
  const seen = new Map();
  // un pixel de la case, replié sur ses bords (répétition sans raccord) ; on garde le plus clair
  const put = (x, y, k, a) => {
    const ix = wrap(Math.round(x), W), iy = wrap(Math.round(y), H), key = iy * W + ix;
    const old = seen.get(key);
    if (old && old[0] >= k) return;
    seen.set(key, [k, a]);
  };

  const count = near ? 14 : 20;
  for (let i = 0; i < count; i++) {
    const R = (n) => rand(S * 31 + (near ? 0 : 500), i, n);
    // répartis en colonnes régulières puis décalés : jamais de paquet ni de grand vide
    const x0 = ((i + 0.5) / count) * W + (R(1) - 0.5) * (W / count) * 0.9;
    const y0 = R(2) * H;
    const len = near ? 46 + R(3) * 36 : 30 + R(3) * 40;
    const amp = near ? 3 + R(4) * 3.5 : 1.5 + R(4) * 2.5;
    const curl = near && R(5) < 0.7 ? 4.5 + R(6) * 3 : 0;
    const dir = R(7) < 0.5 ? -1 : 1;
    const m = 1 + Math.floor(R(8) * (near ? 2 : 3)); // souffles par boucle
    const u = (ph * m + R(9)) % 1;
    // la tête avance, la queue la rattrape : le filet se trace puis s'efface
    const head = ease(clamp(u / 0.55, 0, 1)), tail = ease(clamp((u - 0.42) / 0.58, 0, 1));
    if (head <= tail) continue;
    const pts = pathOf(x0, y0, len, amp, 1.2 + R(10) * 1.3, R(11) * TAU + ph * TAU * m, curl, dir);
    const a = Math.floor(tail * (pts.length - 1)), b = Math.floor(head * (pts.length - 1));
    for (let j = a; j <= b; j++) {
      const v = (j - a) / Math.max(1, b - a); // 0 queue .. 1 tête
      // tête blanche, corps clair, queue qui se dissout en pointillés
      const k = near ? (v > 0.9 ? 4 : v > 0.55 ? 3 : v > 0.25 ? 2 : 1) : (v > 0.85 ? 3 : v > 0.4 ? 2 : 1);
      const al = clamp(0.25 + v * 1.1, 0, 1) * (near ? 1 : 0.8);
      put(pts[j][0], pts[j][1], k, al);
      // plan avant : corps épais de 2 pixels, qui s'affine vers la queue
      if (near && v > 0.3) put(pts[j][0] + 1, pts[j][1], Math.max(1, k - 1), al);
    }
  }

  // grains de lumière qui scintillent (plan avant seulement)
  if (near) {
    for (let i = 0; i < 10; i++) {
      const R = (n) => rand(S * 77, i, n);
      const tw = 0.5 + 0.5 * Math.sin(TAU * (ph * (1 + Math.floor(R(3) * 2)) + R(4)));
      if (tw < 0.35) continue;
      const x = R(1) * W, y = R(2) * H;
      put(x, y, tw > 0.85 ? 4 : 3, 1);
      if (tw > 0.85 && R(5) < 0.5) {
        put(x - 1, y, 2, 1); put(x + 1, y, 2, 1); put(x, y - 1, 2, 1); put(x, y + 1, 2, 1);
      }
    }
  }

  // liseré bleu translucide autour des pixels clairs : le filet se détache aussi sur un nuage blanc
  const halo = new Set();
  for (const [key, [k]] of seen) {
    if (k < (near ? 2 : 3)) continue;
    const x = key % W, y = Math.floor(key / W);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = wrap(y + dy, H) * W + wrap(x + dx, W);
      if (!seen.has(n)) halo.add(n);
    }
  }
  for (const key of halo) p.blend(key % W, Math.floor(key / W), C[0], near ? 0.6 : 0.35);
  for (const [key, [k, a]] of seen) p.dot(key % W, Math.floor(key / W), C[k], a);
}
