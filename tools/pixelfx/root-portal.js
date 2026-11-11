// Portail de l'arche de racines (Legend of Agarica) : l'intérieur de l'arche, vivant. Une nuit profonde où
// tourne lentement un tourbillon vert lunaire à deux bras, quelques étoiles qui clignotent, un liseré qui
// respire le long de la voûte et des grains de lumière qui s'en échappent vers le haut. Boucle sans raccord.
import { fit, clamp, smooth, rand, TAU } from "../../core/index.js";

export const meta = {
  name: "Root portal",
  desc: "The inside of a root archway: a slow two-armed moon-green whirl in deep night, twinkling stars, a breathing rim along the vault and motes of light drifting up out of it.",
  tags: ["arcane", "portal", "door", "whirl", "ambient", "loop"],
  // même cadre que l'arche du jeu (440 x 300 à 5 px par pixel) : origine au milieu du bas
  size: [88, 60],
  origin: [44, 58],
  duration: 2.4,
  loop: true,
  fps: 10,
  bg: "dark",
  options: {
    palette: ["#070a1c", "#0d1430", "#12303a", "#1f6b5c", "#3fb893", "#8fe9c4", "#e6fff4"],
    // demi-largeur et hauteur de la voûte, centre du tourbillon (px)
    rx: 24, ry: 35, swirlY: -15,
    seed: 5,
  },
};

const D = meta.duration;

export function draw(p, t, o) {
  const C = fit(o.palette, 7), ph = (t % D) / D, RX = o.rx, RY = o.ry, S = o.seed;
  const breath = 0.5 + 0.5 * Math.sin(ph * TAU);
  p.shade(-RX - 1, -RY - 1, RX + 1, 1, (x, y, out) => {
    if (y > 0) return;
    const u = x / RX, v = y / RY, e = u * u + v * v;
    if (e > 1) return;
    // liseré : deux pixels le long de la voûte, qui respire
    const edge = (1 - Math.sqrt(e)) * Math.min(RX, RY);
    if (edge < 1.1) return C[breath > 0.6 ? 6 : 5];
    if (edge < 2.1) return C[breath > 0.35 ? 4 : 3];
    // tourbillon : deux bras en spirale, plus serrés et plus clairs vers le centre
    const dx = x, dy = (y - o.swirlY) * 1.15, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    const arm = Math.sin(2 * a + 2.6 * Math.log(r + 1.5) - ph * TAU);
    const fall = Math.exp(-r / 11);
    const k = smooth(0.55, 0.98, arm) * (0.3 + 0.9 * fall) + fall * 0.3;
    // nuit : un peu plus claire au centre, étoiles qui clignotent
    if (k < 0.2) {
      const h = rand(Math.round(x), Math.round(y), S);
      if (h > 0.985) {
        const tw = Math.sin(ph * TAU * (1 + Math.floor(h * 1000) % 3) + h * 40);
        if (tw > 0.2) return C[tw > 0.8 ? 6 : 4];
      }
      return C[r < 14 ? 1 : 0];
    }
    return C[clamp(Math.round(1 + k * 5.4), 2, 6)];
  });
  // cœur du tourbillon
  p.px(0, o.swirlY, C[6]);
  p.glow(0, o.swirlY, 9, C[4], 0.28 + 0.1 * breath);
  // grains de lumière qui montent hors de l'arche, chacun sur sa boucle
  for (let i = 0; i < 7; i++) {
    const h = rand(i, 3, S), life = ((ph + h) % 1), x0 = (rand(i, 7, S) - 0.5) * RX * 1.5;
    const x = x0 + Math.sin((ph + h) * TAU * 2) * 1.5, y = -RY * 0.55 - life * (RY * 0.75);
    if (life > 0.9) continue;
    p.dot(x, y, C[life < 0.5 ? 6 : 5], 1 - life);
    p.light(x, y, C[4], 0.35 * (1 - life));
  }
}
