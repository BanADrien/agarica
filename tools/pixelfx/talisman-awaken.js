// Éveil du talisman de l'ours (Legend of Agarica) : la chaleur du talisman se réveille sur la poitrine
// d'Agarica. Un éclat ambre au centre, trois anneaux de lumière qui partent l'un après l'autre et s'effilent
// en pointillés, des feuilles dorées qui tournent en s'éloignant, des braises qui montent, une lueur chaude
// qui respire. Rendu par tools/pixelfx/export_loup.mjs (30 images à 20 i/s).
import { Rng, fit, clamp, WHITE } from "../../core/index.js";

export const meta = {
  name: "Talisman awaken",
  desc: "An amber spark at the chest, three rings of warm light leaving one after another and thinning to dots, golden leaves spiralling out, embers rising, a breathing glow.",
  tags: ["magic", "aura", "awaken", "talisman", "amber", "leaves", "one-shot"],
  size: [84, 84],
  origin: [42, 46],
  duration: 1.5,
  loop: false,
  fps: 20,
  bg: "dark",
  options: {
    palette: ["#3a1a08", "#7a3a10", "#c46a1c", "#f0a030", "#ffc36b", "#ffe6a8", "#fff6dc"],
    leaf: ["#8a5a18", "#f0b040", "#ffe6a8"],
    rose: "#ff9fc9",
    seed: 4,
  },
};

const TAU = Math.PI * 2;

export function draw(p, t, o) {
  const C = fit(o.palette, 7), LF = fit(o.leaf, 3), ROSE = fit([o.rose], 1)[0], R = new Rng(o.seed);
  const D = meta.duration, end = clamp((D - t) / 0.35);
  // lueur chaude qui respire
  const breath = 0.5 + 0.5 * Math.sin(t * TAU * 2.2);
  p.glow(0, 0, 26, C[3], (0.22 + 0.12 * breath) * end);
  // trois anneaux, toutes les 0,32 s : clairs au départ, en pointillés en fin de course
  for (let i = 0; i < 3; i++) {
    const a = (t - i * 0.32) / 0.75;
    if (a <= 0 || a >= 1) continue;
    const r = 5 + 32 * (1 - (1 - a) * (1 - a)), n = Math.ceil(r * 6.5);
    // anneau épais au départ (3 px : bord sombre, corps ambre, cœur clair), qui s'amincit puis se troue
    const thick = a < 0.35 ? 3 : a < 0.6 ? 2 : 1;
    for (let j = 0; j < n; j++) {
      const th = (j / n) * TAU;
      const wob = Math.sin(th * 9 + i * 2) * 1.1;   // bord dentelé, comme une feuille
      if (a > 0.6 && ((j + i) % 3 === 0 || R.next() < (a - 0.6) * 1.8)) continue;
      for (let k = 0; k < thick; k++) {
        const rr = r + wob - k;
        const col = a < 0.14 ? WHITE : thick === 3 ? [C[2], C[4], C[6]][k] : thick === 2 ? [C[3], C[5]][k] : C[4];
        p.dot(Math.cos(th) * rr, Math.sin(th) * rr * 0.92, col, 1);
      }
    }
    p.glowRing(0, 0, r, 4, C[3], 0.35 * (1 - a));
    if (a < 0.12) p.glow(0, 0, 10, WHITE, 0.7 * (1 - a / 0.12));   // éclat au départ de chaque anneau
  }
  // cœur du talisman : petit losange ambre qui pulse
  const pulse = Math.max(0, ...[0, 1, 2].map((i) => 1 - Math.abs(t - i * 0.32 - 0.03) / 0.09));
  // étoile à quatre branches à chaque pulsation
  if (pulse > 0) {
    const L = 3 + 9 * pulse;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) p.line(0, 0, dx * L, dy * L, pulse > 0.6 ? WHITE : C[5], 1);
    p.glow(0, 0, 12, C[5], 0.5 * pulse);
  }
  if (end > 0.3) {
    const s = 1.5 + 1.5 * pulse;
    p.poly([[0, -s - 1], [s, 0], [0, s + 1], [-s, 0]], pulse > 0.5 ? WHITE : C[5], 1);
    p.dot(0, 0, WHITE, 1);
  }
  // feuilles dorées : elles tournent autour d'elle en s'éloignant
  for (let i = 0; i < 9; i++) {
    const t0 = R.range(0, 0.7), life = R.range(0.55, 0.8), th0 = R.range(0, TAU), dir = R.chance(0.5) ? 1 : -1;
    const r1 = R.range(20, 34), flip = R.range(4, 9), a = (t - t0) / life;
    if (a <= 0 || a >= 1) continue;
    const r = 4 + r1 * (1 - (1 - a) * (1 - a)), th = th0 + dir * a * 2.4;
    const x = Math.cos(th) * r, y = Math.sin(th) * r * 0.9 - a * 6;
    const wide = Math.abs(Math.sin(a * flip)) > 0.45;          // elle se retourne en vol
    const col = a > 0.75 ? LF[0] : wide ? LF[1] : LF[2];
    // une vraie petite feuille : losange de 5 px vu de face, trait de 3 px vue de profil, nervure claire
    if (wide) {
      p.poly([[x - 2.5, y], [x, y - 1.6], [x + 2.5, y], [x, y + 1.6]], col, 1);
      p.dot(x, y, LF[2], 1);
      p.dot(x - 2, y, LF[0], 1);
    } else {
      p.dot(x, y - 1, col, 1); p.dot(x, y, col, 1); p.dot(x, y + 1, LF[0], 1);
    }
  }
  // braises qui montent (quelques-unes roses, comme les étincelles du jeu)
  for (let i = 0; i < 16; i++) {
    const t0 = R.range(0, 1.0), life = R.range(0.35, 0.6), x0 = R.range(-16, 16), sway = R.range(0, TAU), up = R.range(22, 36);
    const a = (t - t0) / life;
    if (a <= 0 || a >= 1) continue;
    const x = x0 + Math.sin(a * 5 + sway) * 2, y = 8 - a * up;
    p.dot(x, y, a < 0.3 ? WHITE : i % 5 === 0 ? ROSE : a < 0.7 ? C[4] : C[2], 1);
    p.glow(x, y, 3, C[3], 0.25 * (1 - a));
  }
}
