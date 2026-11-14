// Traînée de glace de l'ours polaire (Legend of Agarica), d'après le croquis de l'utilisateur (2026-11-14) :
// une rangée CONTINUE de lames de glace serrées les unes contre les autres, de plus en plus hautes jusqu'au
// gros pic du bout. Le jeu pose côte à côte six segments (cinq de la rangée, puis le gros), chacun rendu par
// cet effet : `span` = largeur couverte (les segments se touchent), hauteur qui monte de `from` à `height`
// sur sa largeur, lames penchées vers l'avant (le sens de la traînée). Un segment perce le sol dans un éclair
// blanc avec éclats et givre, scintille, puis blanchit et vole en éclats.
// Rendu par tools/pixelfx/export_glace.mjs. La lame (facettes, arête claire, encoche) et les éclats viennent de
// pixelfx (ice/_lib.js), adaptés des effets de glace de Sprite Fusion (MIT, Copyright (c) 2026 Hugo Duprez).
import { Particles, Bits, Lights, P, B, Rng, fit, sparkle, clamp, ease, rand, WHITE } from "../../core/index.js";
import { blade } from "./_lib.js";

export const meta = {
  name: "Polar spike",
  desc: "A tight row of jagged ice blades punches up out of the floor, rising toward its far end, glints on a frosted strip, then flashes white and shatters.",
  tags: ["ice", "spike", "ground", "wave", "magic", "one-shot"],
  size: [96, 96],
  origin: [48, 80],
  duration: 1.0,
  loop: false,
  fps: 20,
  bg: "ground",
  options: {
    palette: ["#151a3d", "#212f6b", "#2c58aa", "#3a8bd8", "#62c8f4", "#a6ecff", "#dcfbff", "#ffffff"],
    // largeur couverte et hauteurs au début / à la fin du segment (px de l'effet ; x2 à l'écran)
    span: 34,
    from: 10,
    height: 16,
    // gros pic du bout : une grande lame dressée, entourée de lames plus courtes
    big: false,
    seed: 4,
  },
};

const RISE = 0.11;      // il sort du sol (POLAR_TUNING.riseMs)
const GLINT = 0.3;      // un reflet le parcourt
const FLASH = 0.7, SHATTER = 0.76; // il blanchit, puis casse

export function create(o) {
  const C = fit(o.palette, 8), R = new Rng(o.seed), SPAN = o.span, big = !!o.big, floor = () => 0;
  const ps = new Particles({ rng: R, ground: floor, sparks: [C[7], C[6], C[5], C[4]], haze: C[5] });
  const bits = new Bits({ ground: floor }), lights = new Lights();
  const heightAt = (x) => o.from + (o.height - o.from) * clamp((x + SPAN / 2) / SPAN);
  const blades = [];
  if (big) {
    // la grande lame, un peu après le milieu, droite et à peine penchée vers l'avant
    const H = o.height;
    blades.push({ dx: SPAN * 0.08, h: H, w: SPAN * 0.42, lean: H * 0.06, back: false, delay: 0, jag: 0.55, main: true });
    blades.push({ dx: SPAN * 0.36, h: H * 0.42, w: SPAN * 0.2, lean: H * 0.2, back: true, delay: 0.03, jag: 0.4 });
    blades.push({ dx: SPAN * 0.42, h: H * 0.3, w: SPAN * 0.18, lean: H * 0.16, back: false, delay: 0.045, jag: -1 });
    blades.push({ dx: -SPAN * 0.22, h: H * 0.36, w: SPAN * 0.22, lean: H * 0.12, back: true, delay: 0.025, jag: 0.45 });
    blades.push({ dx: -SPAN * 0.38, h: H * 0.24, w: SPAN * 0.18, lean: H * 0.05, back: false, delay: 0.035, jag: -1 });
  } else {
    // lames serrées sur toute la largeur : une rangée de devant, une rangée plus sombre derrière, décalée
    // (éclats massifs, larges comme des dalles de glace : le croquis, pas des brins d'herbe)
    for (let x = -SPAN / 2 + 4; x <= SPAN / 2 - 2; x += R.range(7, 9.5)) {
      const H = heightAt(x) * R.range(0.75, 1.02);
      blades.push({ dx: x, h: H, w: R.range(8, 11), lean: H * R.range(-0.04, 0.16), back: false, delay: R.range(0, 0.035), jag: R.chance(0.7) ? R.range(0.35, 0.6) : -1 });
    }
    for (let x = -SPAN / 2 + 8; x <= SPAN / 2 + 1; x += R.range(8, 11)) {
      const H = heightAt(x) * R.range(0.9, 1.18);
      blades.push({ dx: x, h: H, w: R.range(7, 10), lean: H * R.range(0.1, 0.24), back: true, delay: R.range(0.01, 0.045), jag: R.chance(0.6) ? R.range(0.35, 0.6) : -1 });
    }
    // la plus haute du segment, au bout : elle dépasse un peu et prend le reflet
    const top = blades.filter((b) => !b.back).reduce((a, b) => (b.dx > a.dx ? b : a));
    top.h = Math.max(top.h, o.height * 1.05);
    top.main = true;
  }
  const mainBlade = blades.find((b) => b.main) || blades[0];
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
        for (let i = 0; i < (big ? 14 : 7); i++) {
          bits.add({ kind: B.SHARD, x: R.range(-SPAN / 2, SPAN / 2), y: -1, vx: R.range(-60, 110), vy: -R.range(70, big ? 260 : 170), g: 0.9, drag: 0.6, bounce: 0.3, life: R.range(0.35, 0.7), a: R.range(0, 6.28), va: R.range(-10, 10), s: R.range(1, big ? 2.4 : 1.7), ramp: C });
        }
        for (let i = 0; i < (big ? 5 : 3); i++) ps.spawn(P.VAPOUR, R.range(-SPAN / 2, SPAN / 2), -R.range(0, 3), R.range(-20, 50), -R.range(2, 12), R.range(0.35, 0.6), C[6], R.range(1.6, big ? 3 : 2.4));
        for (let i = 0; i < (big ? 6 : 2); i++) ps.spawn(P.FLAKE, R.range(-SPAN / 2, SPAN / 2), -R.range(2, o.height * 0.6), R.range(-20, 40), -R.range(20, 70), R.range(0.4, 0.8), R.chance(0.5) ? WHITE : C[6], R.range(0.5, 1.1));
        lights.add(0, -o.height * 0.4, o.height + 14, C[5], big ? 0.9 : 0.6, 0.22);
      }
      if (!broke && t >= SHATTER) {
        broke = true;
        for (const b of blades) {
          const s = pose(b);
          for (let i = 0; i < 1 + b.h / 7; i++) {
            const u = R.next();
            bits.add({ kind: R.chance(0.2) ? B.CHUNK : B.SHARD, x: s.x + (s.tx - s.x) * u + R.range(-1.5, 1.5), y: s.ty * u, vx: R.range(-60, 80), vy: -R.range(30, 150), g: 0.9, drag: 0.6, bounce: 0.3, life: R.range(0.15, 0.24), a: R.range(0, 6.28), va: R.range(-12, 12), s: R.range(1, 2.2), ramp: C });
          }
        }
        for (let i = 0; i < 3; i++) ps.spawn(P.VAPOUR, R.range(-SPAN / 2, SPAN / 2), -R.range(2, o.height * 0.7), R.range(-20, 20), -R.range(4, 14), R.range(0.14, 0.22), C[6], R.range(1.4, 2.2));
        lights.add(0, -o.height * 0.5, o.height + 8, WHITE, 0.6, 0.14);
      }
      ps.update(dt); bits.update(dt); lights.update(dt);
    },
    draw(p) {
      if (t >= meta.duration) return;
      // bande de givre sous toute la largeur (les segments voisins la prolongent)
      const fade = clamp((t - SHATTER) / (meta.duration - SHATTER - 0.02));
      const half = Math.ceil(SPAN / 2) + 1;
      for (let x = -half; x <= half; x++) {
        const h = rand(x, 17, o.seed), a = (1 - fade) * clamp(t / 0.06);
        if (a <= 0.05) continue;
        p.dot(x, 0, h < 0.35 ? WHITE : C[6], a);
        if (h < 0.4) p.dot(x, -1, h < 0.15 ? WHITE : C[5], a);
        if (h > 0.5) p.dot(x, 1, C[4], a * 0.8);
      }
      if (t < SHATTER) {
        for (const pass of [0, 1]) {
          for (const b of blades) {
            if ((pass === 0) !== !!b.back) continue;
            const s = pose(b);
            if (s.g <= 0) continue;
            const jx = t >= FLASH - 0.12 && t < FLASH ? (Math.floor(t * 40 + b.dx) % 2 ? 1 : 0) : 0;
            const gl = (t - GLINT - (b.dx + SPAN / 2) / SPAN * 0.12) / 0.22;
            blade(p, s.x + jx, 0, s.tx + jx, s.ty, b.w, C, { white: s.white, jag: b.jag, dim: b.back ? 1 : 0, glint: gl >= 0 && gl <= 1 ? gl : -1 });
          }
        }
        const pop = clamp(1 - t / 0.15), wh = t >= FLASH;
        p.glow(SPAN * 0.1, -o.height * 0.45, o.height * 0.9 + SPAN * 0.4, C[4], 0.12 + 0.36 * pop + (wh ? 0.4 : 0));
        if (pop > 0) p.glow(0, -2, SPAN * 0.5, WHITE, 0.4 * pop);
        // étoile au sommet de la plus haute lame pendant le reflet
        const m = pose(mainBlade);
        const k = (t - GLINT - 0.1) / 0.16;
        if (k >= 0 && k <= 1) sparkle(p, m.tx, m.ty + 1, (big ? 3 : 2) + 3 * Math.sin(k * Math.PI), WHITE, C[5]);
      }
      bits.draw(p);
      ps.draw(p);
      lights.draw(p);
    },
  };
}
