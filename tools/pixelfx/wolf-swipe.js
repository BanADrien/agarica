// Coup de griffes du loup (Legend of Agarica), dans la famille de l'arc de la dague d'Agarica : TROIS croissants
// de lune parallèles (les trois griffes), cœur blanc, corps vert clair, bord vert, sans contour sombre, avec de
// petites feuilles arrachées. Demande du 2026-11-15 : « plus logique, plus intégré dans la DA, pas forcément
// une morsure ». Les croissants sont bombés vers la GAUCHE (le jeu retourne l'image quand le loup regarde à
// droite) ; `dir: "down"` les tourne vers le bas pour le coup de patte en l'air.
// Rendu par tools/pixelfx/export_loup.mjs aux 5 instants que le jeu affiche (élan, 2 actives, 2 d'effacement).
import { Rng, fit, clamp, WHITE } from "../../core/index.js";

export const meta = {
  name: "Wolf swipe",
  desc: "Three parallel moon crescents, the wolf's claws, sweep open white, swell into pale green with torn leaves, then thin to dotted traces.",
  tags: ["melee", "claw", "swipe", "wolf", "crescent", "leaves", "directional", "one-shot"],
  size: [42, 42],
  origin: [21, 21],
  duration: 0.26,
  loop: false,
  fps: 30,
  bg: "dark",
  options: {
    palette: ["#1f7a4c", "#3fc47c", "#7dedb0", "#c4ffe0", "#f2fff7"],
    leaf: ["#3fc47c", "#8fe6a8", "#d8ffe6"],
    dir: "side",   // "side" : bombé vers la gauche ; "down" : vers le bas
    seed: 7,
  },
};

const OPEN = 0.07;    // les trois griffes sont tracées
const FADE = 0.165;   // elles s'effilent
// trois griffes parallèles, en diagonale : [décalage en travers, longueur, épaisseur au milieu, retard]
const CLAWS = [[-9, 26, 3.6, 0], [0, 31, 4.4, 0.012], [9, 26, 3.6, 0.024]];
const AX = -0.42, AY = 0.91;      // le long de la griffe : vers le bas, un peu vers l'avant (la gauche)
const NX = -0.91, NY = -0.42;     // en travers : vers l'avant et le haut (côté bombé, cœur blanc)

export function draw(p, t, o) {
  const C = fit(o.palette, 5), LF = fit(o.leaf, 3), R = new Rng(o.seed);
  const down = o.dir === "down";
  const put = (x, y, c, a = 1) => (down ? p.dot(y, -x, c, a) : p.dot(x, y, c, a));
  const fade = clamp((t - FADE) / (meta.duration - FADE));
  for (const [off, len, thick, delay] of CLAWS) {
    const k = clamp((t - delay) / OPEN), shown = 1 - (1 - k) * (1 - k);   // tracée de haut en bas, vite puis doucement
    if (shown <= 0) continue;
    const hot = t - delay < OPEN + 0.03;                                  // encore blanche : elle vient de claquer
    const ox = 2 + NX * off, oy = NY * off;                               // milieu de la griffe
    const N = Math.ceil(len * 2);
    for (let i = 0; i <= N; i++) {
      const q = i / N;
      if (q > shown) break;
      const u = q * 2 - 1;                                                // -1 en haut, +1 en bas
      const taper = Math.pow(Math.max(0, 1 - Math.pow(Math.abs(u), 2.2)), 0.8);
      const w = thick * taper * (1 - fade * 0.7);
      const bow = 3.2 * (1 - u * u);                                      // légèrement bombée vers l'avant
      // pointillés en fin de vie
      if (fade > 0.3 && i % 3 === 0) continue;
      if (fade > 0.7 && i % 2 === 0) continue;
      if (fade > 0.96) continue;
      for (let d = 0; d <= Math.max(0.5, w); d += 0.5) {                  // de l'arête avant vers le loup
        const x = ox + AX * u * len / 2 + NX * (bow - d), y = oy + AY * u * len / 2 + NY * (bow - d);
        const v = d / Math.max(0.5, w);
        const col = hot ? (v < 0.75 ? WHITE : C[3])
          : fade > 0.5 ? C[1]
            : v < 0.34 ? C[4] : v < 0.62 ? C[3] : v < 0.85 ? C[2] : C[1];   // cœur blanc à l'avant, vert derrière
        put(x, y, col);
      }
    }
    const gx = ox + NX * 2, gy = oy + NY * 2;
    if (down) p.glow(gy, -gx, 8, C[1], 0.26 * (1 - fade) * shown); else p.glow(gx, gy, 8, C[1], 0.26 * (1 - fade) * shown);
  }
  // petites feuilles arrachées, comme sur l'arc de la dague : elles partent vers l'avant et tournent
  for (let i = 0; i < 7; i++) {
    const t0 = R.range(0.03, 0.09), life = R.range(0.12, 0.19), y0 = R.range(-17, 17), sp = R.range(40, 95), drift = R.range(-30, 30), flip = R.range(20, 40);
    const a = (t - t0) / life;
    if (a <= 0 || a >= 1 || t > meta.duration - 0.01) continue;
    const x = -8 - sp * (t - t0), y = y0 + drift * (t - t0);
    const wide = Math.sin(a * flip) > 0;
    const col = a > 0.7 ? LF[0] : wide ? LF[2] : LF[1];
    put(x, y, col);
    if (wide) { put(x - 1, y, col); put(x + 1, y, LF[1]); put(x, y - 1, LF[1]); } else { put(x, y + 1, col); }
  }
}
