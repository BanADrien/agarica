// Pic de glace de l'ours polaire (Legend of Agarica) : UN amas de lames qui perce le sol -- éclair blanc, gerbe
// d'éclats et bouffée de givre --, tient en scintillant sur un sol givré, puis blanchit et vole en éclats.
// Rendu une fois par taille (petit pic, gros pic du bout de rangée) par tools/pixelfx/export_glace.mjs.
// La lame (facettes, arête claire, encoche) et les éclats viennent de la bibliothèque pixelfx (ice/_lib.js),
// elle-même adaptée des effets de glace de Sprite Fusion (MIT, Copyright (c) 2026 Hugo Duprez).
import { Particles, Bits, Lights, P, B, Rng, fit, sparkle, clamp, ease, rand, WHITE } from "../../core/index.js";
import { blade } from "./_lib.js";

export const meta = {
  name: "Polar spike",
  desc: "A cluster of jagged ice blades punches up out of the floor in a white flash with shards and frost, glints on a frosted patch, then flashes white and shatters.",
  tags: ["ice", "spike", "ground", "magic", "one-shot"],
  size: [96, 96],
  origin: [48, 80],
  duration: 1.0,
  loop: false,
  fps: 20,
  bg: "ground",
  options: {
    palette: ["#151a3d", "#212f6b", "#2c58aa", "#3a8bd8", "#62c8f4", "#a6ecff", "#dcfbff", "#ffffff"],
    // hauteur de la lame principale et largeur de sa base (px de l'effet ; x2 à l'écran)
    height: 26,
    width: 9,
    // gros pic : une lame de plus derrière, plus d'éclats, lumière plus forte
    big: false,
    seed: 4,
  },
};

const RISE = 0.11;      // il sort du sol (POLAR_TUNING.riseMs)
const GLINT = 0.3;      // un reflet le parcourt
const FLASH = 0.7, SHATTER = 0.76; // il blanchit, puis casse

export function create(o) {
  const C = fit(o.palette, 8), R = new Rng(o.seed), H = o.height, W = o.width, big = !!o.big, floor = () => 0;
  const ps = new Particles({ rng: R, ground: floor, sparks: [C[7], C[6], C[5], C[4]], haze: C[5] });
  const bits = new Bits({ ground: floor }), lights = new Lights();
  // lames : la principale, une plus courte derrière (penchée de l'autre côté), un éclat devant son pied
  const blades = [
    { dx: W * 0.55, h: H * 0.62, w: W * 0.7, lean: H * 0.22, back: true, delay: 0.025, jag: 0.45 },
    { dx: 0, h: H, w: W, lean: -H * 0.08, back: false, delay: 0, jag: 0.5, main: true },
    { dx: -W * 0.6, h: H * 0.36, w: W * 0.55, lean: -H * 0.14, back: false, delay: 0.04, jag: -1 },
  ];
  if (big) blades.unshift({ dx: -W * 0.75, h: H * 0.5, w: W * 0.6, lean: -H * 0.24, back: true, delay: 0.035, jag: 0.4 });
  let t = 0, burst = false, broke = false;
  const pose = (b) => {
    const g = ease.outBack(clamp((t - b.delay) / RISE), 2.2);
    return { g, x: b.dx, tx: b.dx + b.lean * g, ty: -b.h * g, white: t - b.delay < 0.045 || (t >= FLASH && t < SHATTER) };
  };
  return {
    update(dt) {
      t += dt;
      if (!burst) {
        burst = true;
        // il perce : éclats projetés, givre qui fuse au ras du sol, lumière
        for (let i = 0; i < (big ? 14 : 8); i++) {
          bits.add({ kind: B.SHARD, x: R.range(-W, W), y: -1, vx: R.range(-90, 90), vy: -R.range(70, big ? 260 : 190), g: 0.9, drag: 0.6, bounce: 0.3, life: R.range(0.35, 0.7), a: R.range(0, 6.28), va: R.range(-10, 10), s: R.range(1, big ? 2.4 : 1.8), ramp: C });
        }
        for (let i = 0; i < (big ? 5 : 3); i++) ps.spawn(P.VAPOUR, R.range(-W, W), -R.range(0, 3), R.range(-40, 40), -R.range(2, 12), R.range(0.35, 0.6), C[6], R.range(1.6, big ? 3 : 2.4));
        for (let i = 0; i < (big ? 6 : 3); i++) ps.spawn(P.FLAKE, R.range(-W, W), -R.range(2, H * 0.6), R.range(-30, 30), -R.range(20, 70), R.range(0.4, 0.8), R.chance(0.5) ? WHITE : C[6], R.range(0.5, 1.1));
        lights.add(0, -H * 0.4, H + 12, C[5], big ? 0.9 : 0.7, 0.22);
      }
      if (!broke && t >= SHATTER) {
        broke = true;
        for (const b of blades) {
          const s = pose(b);
          for (let i = 0; i < 3 + b.h / 5; i++) {
            const u = R.next();
            bits.add({ kind: R.chance(0.2) ? B.CHUNK : B.SHARD, x: s.x + (s.tx - s.x) * u + R.range(-1.5, 1.5), y: s.ty * u, vx: R.range(-70, 70), vy: -R.range(30, 150), g: 0.9, drag: 0.6, bounce: 0.3, life: R.range(0.15, 0.24), a: R.range(0, 6.28), va: R.range(-12, 12), s: R.range(1, 2.2), ramp: C });
          }
        }
        for (let i = 0; i < 3; i++) ps.spawn(P.VAPOUR, R.range(-W, W), -R.range(2, H * 0.7), R.range(-20, 20), -R.range(4, 14), R.range(0.14, 0.22), C[6], R.range(1.4, 2.2));
        lights.add(0, -H * 0.5, H + 8, WHITE, 0.6, 0.14);
      }
      ps.update(dt); bits.update(dt); lights.update(dt);
    },
    draw(p) {
      if (t >= meta.duration) return;
      // sol givré : croûte claire et touffes de givre, qui s'efface avec le pic
      const fade = clamp((t - SHATTER) / (meta.duration - SHATTER - 0.02));
      const span = Math.round(W * (big ? 2.4 : 1.9) * clamp(t / 0.08));
      for (let x = -span; x <= span; x++) {
        const h = rand(x, 17, o.seed), a = (1 - Math.abs(x) / (span + 1) * 0.5) * (1 - fade);
        if (a <= 0.05) continue;
        p.dot(x, 0, h < 0.35 ? WHITE : C[6], a);
        if (h < 0.4) p.dot(x, -1, h < 0.15 ? WHITE : C[5], a);
        if (h > 0.55) p.dot(x, 1, C[4], a * 0.8);
      }
      if (t < SHATTER) {
        for (const pass of [0, 1, 2]) {
          for (const b of blades) {
            if ((pass === 0) !== b.back || (pass === 1) !== !!b.main) continue;
            const s = pose(b);
            if (s.g <= 0) continue;
            const jx = t >= FLASH - 0.12 && t < FLASH ? (Math.floor(t * 40) % 2 ? 1 : 0) : 0;
            const gl = (t - GLINT) / 0.22;
            blade(p, s.x + jx, 0, s.tx + jx, s.ty, b.w, C, { white: s.white, jag: b.jag, dim: b.back ? 1 : 0, glint: gl >= 0 && gl <= 1 ? gl : -1 });
          }
        }
        const pop = clamp(1 - t / 0.15), wh = t >= FLASH;
        p.glow(0, -H * 0.45, H * 0.9 + 8, C[4], 0.14 + 0.4 * pop + (wh ? 0.4 : 0));
        if (pop > 0) p.glow(0, -2, 12, WHITE, 0.5 * pop);
        // étoile au sommet pendant le reflet
        const main = pose(blades.find((b) => b.main));
        const k = (t - GLINT - 0.1) / 0.16;
        if (k >= 0 && k <= 1) sparkle(p, main.tx, main.ty + 1, 2 + 3 * Math.sin(k * Math.PI), WHITE, C[5]);
      }
      bits.draw(p);
      ps.draw(p);
      lights.draw(p);
    },
  };
}
