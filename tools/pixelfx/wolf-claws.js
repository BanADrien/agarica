// Griffes du loup (Legend of Agarica) : le coup de patte vers le bas. Trois entailles ratissent de haut en bas,
// penchées vers l'avant (la droite), blanches à la pointe qui avance puis vert lunaire à liseré rose, des
// éclats en bas, et elles se referment en pointillés. Version validée par l'utilisateur le 2026-11-15.
// Rendu par tools/pixelfx/export_loup.mjs (5 instants du jeu).
import { Rng, fit, clamp, WHITE } from "../../core/index.js";

export const meta = {
  name: "Wolf claws",
  desc: "Three claw marks rake downward, leaning forward, white-hot at the moving tip then moon green with a pink rim, shards at the bottom, closing to a dotted trace.",
  tags: ["melee", "claw", "paw", "wolf", "beast", "directional", "one-shot"],
  size: [54, 44],
  origin: [27, 4],
  duration: 0.27,
  loop: false,
  fps: 30,
  bg: "dark",
  options: {
    palette: ["#0e3a26", "#1f7a4c", "#3fc47c", "#7dedb0", "#c4ffe0", "#f2fff7"],
    rim: "#ffb3e0",
    seed: 9,
  },
};

const RAKE = 0.11;   // les trois entailles sont tracées
const FADE = 0.165;

export function draw(p, t, o) {
  const C = fit(o.palette, 6), RIM = fit([o.rim], 1)[0], R = new Rng(o.seed);
  const fade = clamp((t - FADE) / (0.26 - FADE));
  [-1, 0, 1].forEach((kx, i) => {
    const t0 = i * 0.012, reach = clamp((t - t0) / (RAKE - 0.03));
    const done = 1 - (1 - reach) * (1 - reach);
    const x0 = kx * 11 - 4, top = 2 + Math.abs(kx) * 3, len = (34 - Math.abs(kx) * 5) * done, lean = 8;
    if (len < 1.5) return;
    const hot = t - t0 < RAKE + 0.02;                     // encore blanche : elle vient d'être tracée
    const N = Math.ceil(len);
    for (let j = 0; j <= N; j++) {
      const q = j / Math.max(1, N), u = q * done;         // u : place sur l'entaille entière
      const x = x0 + lean * Math.sin(u * Math.PI / 2), y = top + q * len;
      const w = 2.6 * Math.sin(Math.PI * Math.min(1, u * 1.05)) + 0.5;   // effilée aux deux bouts
      if (fade > 0) {
        // elle se referme par les deux bouts, puis il ne reste que des pointillés
        if (fade > 0.97 || Math.abs(u - 0.5) > 0.5 - fade * 0.5 || (j % 2 && fade > 0.35)) continue;
        p.dot(x, y, fade > 0.5 ? C[3] : C[4], 1 - fade * 0.5);
        continue;
      }
      for (let dx = -Math.ceil(w); dx <= Math.ceil(w); dx++) {
        const d = Math.abs(dx) / w;
        if (d > 1) continue;
        // blanche seulement près de la pointe qui avance ; derrière, déjà vert lunaire à liseré rose
        const tipHot = hot && q > 0.72;
        const col = tipHot ? (d < 0.6 ? WHITE : C[5]) : d < 0.3 ? C[5] : d < 0.7 ? C[3] : dx > 0 ? RIM : C[2];
        p.dot(x + dx, y, col, 1);
      }
    }
    // pointe vive en bout de course
    if (!fade && reach < 1) {
      const x = x0 + lean * Math.sin(done * Math.PI / 2), y = top + len;
      p.dot(x, y + 1, WHITE, 1);
      p.glow(x, y, 6, WHITE, 0.5);
    }
    p.glowLine(x0, top, x0 + lean, top + len, 5, C[2], 0.3 * (1 - fade));
  });
  // éclats arrachés au bout des griffes
  if (t > RAKE - 0.02) {
    const age = t - (RAKE - 0.02);
    for (let i = 0; i < 10; i++) {
      const ang = Math.PI / 2 + R.range(-1.0, 1.0), sp = R.range(40, 120), life = R.range(0.07, 0.15), x0 = R.range(-12, 16);
      if (age > life) continue;
      const x = x0 + 4 + Math.cos(ang) * sp * age, y = 30 + Math.sin(ang) * sp * age * 0.6;
      p.dot(x, y, age < life * 0.5 ? WHITE : C[4], 1);
    }
  }
}
