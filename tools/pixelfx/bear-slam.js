// Fracas de l'ours (Legend of Agarica) : tout ce que l'image de l'ours ne montre plus. Deux parties,
// rendues à part pour que le jeu les pose séparément :
//   "impact" : la patte frappe le sol -> éclair plat, deux vagues de poussière qui filent au ras du sol,
//              un nuage bas, des pierres qui sautent, rebondissent et se posent, de la terre en éventail ;
//   "griffe" : la traînée du coup de patte, trois sillons qui descendent de la patte levée jusqu'au sol.
// The rocks, grit and rolling floor dust recipe is adapted from Sprite Fusion's open-source explosion
// (https://www.spritefusion.com/pixel-art-vfx/explosion), MIT License, Copyright (c) 2026 Hugo Duprez.
import { Particles, Bits, P, PF, B, Rng, fit, clamp, smooth, ease, TAU, WHITE, mix } from "../../core/index.js";
import { stone, rock, rockShape } from "./_lib.js";

export const meta = {
  name: "Bear slam",
  desc: "A heavy paw hits the floor: a flat flash, two dust waves racing out along the ground, a low dust bank, rocks that jump, bounce and settle. Second part: the three-claw trail of the swipe.",
  tags: ["impact", "ground", "slam", "dust", "rocks", "claw", "one-shot"],
  size: [176, 100],
  origin: [88, 88],
  // RÉGLAGES : une ligne chacun. Après un changement : node tools/pixelfx/export_fracas.mjs
  duration: 0.8, // durée de l'impact, en secondes (la traînée a la sienne : `clawTime`)
  loop: false,
  fps: 20,
  bg: "ground",
  options: {
    part: "impact", // "impact" ou "griffe" (choisi par le script de rendu)
    dust: ["#6e5c48", "#b09a76", "#dccaa4", "#f6ecd2"], // poussière : ombre, corps, clair, crête
    stone: "#74667c", // couleur des pierres
    rocks: 8, // nombre de pierres qui volent
    grit: 46, // nombre de miettes de terre
    reach: 54, // demi-largeur des vagues de poussière (1 px ici = 2 px à l'écran : 54 -> zone de 220 px)
    lift: 1, // hauteur des jets (1 = normal, 1.4 = plus haut)
    claw: ["#9a5a1e", "#ffc060", "#ffe9a8", "#ffffff"], // traînée du coup de patte : bord, corps, clair, fil
    clawFrom: [22, -70], // d'où part la patte (px de l'effet, depuis les pattes arrière de l'ours)
    clawTo: [44, -3], // où elle frappe
    clawTime: 0.26, // durée de la traînée, en secondes
    seed: 7,
  },
};

const WAVE = 0.3; // secondes pour que les vagues atteignent `reach`

function impact(o) {
  const D = fit(o.dust, 4), st = stone(o.stone), R = new Rng(o.seed), floor = () => 0, T = meta.duration;
  const ps = new Particles({ rng: R, ground: floor });
  const bits = new Bits({ ground: floor });
  const REACH = o.reach, LIFT = o.lift;
  const front = (t) => 5 + (REACH - 5) * ease.outCubic(clamp(t / WAVE));
  // pierres : deux grosses qui décollent à peine, les autres lancées haut, des deux côtés
  for (let i = 0; i < o.rocks; i++) {
    const s = i < 2 ? 3 : R.int(1, 2), side = i % 2 ? 1 : -1, a = -Math.PI / 2 + side * R.range(0.3, 0.95);
    const sp = (s > 2 ? R.range(150, 200) : R.range(200, 330)) * LIFT;
    bits.add({ kind: B.CHUNK, x: side * R.range(4, 26), y: -2, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 1, drag: 0.4, bounce: 0.34,
      life: R.range(T * 0.78, T * 0.98), a: R.range(0, TAU), va: R.range(-14, 14), s, pts: rockShape(R), pvy: 0 });
  }
  // terre : un éventail de miettes qui rebondissent une fois
  for (let i = 0; i < o.grit; i++) {
    const u = R.range(-1, 1), a = -Math.PI / 2 + u * 0.95, sp = R.range(90, 300) * LIFT * (1 - 0.35 * Math.abs(u));
    ps.spawn(P.GRIT, u * 8, -1, Math.cos(a) * sp, Math.sin(a) * sp, R.range(T * 0.5, T * 0.9), R.pick([D[0], D[1], D[1], D[2], st.shade, st.body]), R.chance(0.3) ? 2 : 1, R.range(0, 0.04));
  }
  // nuage bas au point d'impact : il gonfle, monte un peu et s'efface
  for (let i = 0; i < 16; i++) {
    const s = i % 2 ? 1 : -1;
    ps.spawn(P.SMOKE, s * R.range(2, 24), -R.range(2, 7), s * R.range(20, 70), -R.range(14, 52) * LIFT, R.range(T * 0.6, T * 0.92), R.chance(0.4) ? D[2] : D[1], R.range(4, 7.5), R.range(0, 0.05), PF.BIG);
  }
  let t = 0;
  const acc = [R.next(), R.next()];
  return {
    update(dt) {
      t += dt;
      // poussière soulevée derrière les deux vagues, plus rare à mesure qu'elles s'essoufflent
      const u = clamp(t / WAVE);
      if (u < 1) {
        const fr = front(t);
        for (let k = 0; k < 2; k++) {
          const s = k ? 1 : -1;
          for (acc[k] += dt * 190 * (1 - u * 0.5); acc[k] > 1; acc[k]--) {
            ps.spawn(P.SMOKE, s * (fr - R.range(0, 6)), -R.range(0.5, 3), s * R.range(20, 80) * (1 - u), -R.range(3, 16), R.range(T * 0.4, T * 0.72), R.chance(0.45) ? D[2] : D[1], R.range(3, 6.5) * (1 - 0.3 * u), 0, PF.BIG);
            if (R.chance(0.5)) ps.spawn(P.DUST, s * (fr - R.range(0, 3)), -R.range(2, 9) * (1 - u), s * R.range(-10, 30), -R.range(8, 34), R.range(0.2, 0.42), D[3], R.range(1.2, 2.4));
            if (R.chance(0.35)) ps.spawn(P.GRIT, s * fr, -1, s * R.range(10, 70), -R.range(40, 130) * (1 - u) * LIFT, R.range(0.3, 0.6), R.pick([D[1], D[2], st.body]), 1);
          }
        }
      }
      for (const b of bits.list) b.pvy = b.vy;
      bits.update(dt);
      // une pierre qui retombe fort soulève sa propre bouffée
      for (const b of bits.list)
        if (b.pvy > 70 && b.vy <= 0) {
          for (let i = 0; i < 2; i++) ps.spawn(P.DUST, b.x + R.range(-1.5, 1.5), -0.5, R.sign() * R.range(8, 30), -R.range(2, 14), R.range(0.2, 0.36), D[2], R.range(1.3, 2.2) * (0.7 + b.s * 0.25));
          b.pvy = 0;
        }
      ps.update(dt);
    },
    drawBack(p) {
      ps.draw(p, "back");
    },
    draw(p) {
      // crêtes des deux vagues : un croissant clair, bas, qui s'amincit en avançant
      const u = clamp(t / (WAVE + 0.08));
      if (u < 1) {
        const fr = front(t), h = (3 + 9 * Math.pow(1 - u, 0.8)) * LIFT;
        for (const s of [-1, 1])
          for (let y = 0; y < h; y++) {
            const q = y / h, x = s * (fr - q * q * h * 0.7);
            p.dot(x, -y, q < 0.5 ? D[3] : D[2], (1 - u) * (1 - q * 0.5));
            p.dot(x - s, -y, D[2], (1 - u) * 0.8 * (1 - q));
          }
      }
      for (const b of bits.list) rock(p, b, st);
      ps.draw(p, "front");
      // l'éclair du choc : une ellipse plate et claire, une image ou deux
      if (t < 0.05) p.ellipse(0, -1, 26, 3.5, (d) => (d > 0.75 ? D[2] : d > 0.45 ? D[3] : WHITE));
      else if (t < 0.1) p.ellipse(0, -1, 34 * (1 + t * 3), 2, D[3], 0.6 * (1 - (t - 0.05) / 0.05));
      if (t < 0.12) p.glowLine(-REACH * 0.7, -1, REACH * 0.7, -1, 7, D[3], 0.4 * (1 - t / 0.12));
    },
  };
}

// Trois sillons le long d'un arc bombé vers l'avant, de la patte levée au sol. Ils se tracent d'un coup,
// puis s'effacent en commençant par le haut ; quelques éclats se détachent là où la patte touche.
function claw(o) {
  const C = fit(o.claw, 4), R = new Rng(o.seed), L = o.clawTime;
  const [x0, y0] = o.clawFrom, [x1, y1] = o.clawTo;
  // point de contrôle : pousse l'arc vers l'avant et le haut (un geste de haut en bas, arrondi)
  const cx = x1 + (x1 - x0) * 0.55 + 10, cy = y0 + (y1 - y0) * 0.22;
  const at = (u, off) => {
    const a = 1 - u, x = a * a * x0 + 2 * a * u * cx + u * u * x1, y = a * a * y0 + 2 * a * u * cy + u * u * y1;
    const tx = 2 * a * (cx - x0) + 2 * u * (x1 - cx), ty = 2 * a * (cy - y0) + 2 * u * (y1 - cy), n = Math.hypot(tx, ty) || 1;
    return [x + (-ty / n) * off, y + (tx / n) * off];
  };
  const chips = Array.from({ length: 7 }, () => ({ a: R.range(-2.6, -0.5), sp: R.range(50, 130), born: R.range(0.02, 0.07), s: R.chance(0.4) ? 2 : 1 }));
  let t = 0;
  return {
    update(dt) {
      t += dt;
    },
    draw(p) {
      if (t >= L) return;
      const drawn = ease.outCubic(clamp(t / 0.05)), gone = smooth(0.08, L, t);
      for (let k = -1; k <= 1; k++) {
        // les trois griffes : écartées en haut, resserrées en bas ; celle du milieu la plus longue
        const start = gone + (k === 0 ? 0 : 0.08);
        for (let u = start; u <= drawn; u += 0.012) {
          const spread = 5.5 - 2 * u, w = (k === 0 ? 3.6 : 2.8) * Math.sin(Math.PI * clamp((u - start) / Math.max(0.05, drawn - start))) * (1 - gone * 0.6);
          for (let d = -w / 2; d <= w / 2; d += 0.5) {
            const [x, y] = at(u, k * spread + d), q = Math.abs(d) / (w / 2 + 0.01);
            p.dot(x, y, t < 0.06 ? (q < 0.5 ? C[3] : C[2]) : q < 0.35 ? C[2] : q < 0.75 ? C[1] : C[0], 1 - gone * 0.75);
          }
        }
        const [gx, gy] = at(Math.min(1, drawn), k * 3.5);
        p.glow(gx, gy, 6, C[1], 0.35 * (1 - gone));
      }
      // éclats au point de frappe
      for (const c of chips) {
        const age = t - c.born;
        if (age < 0 || age > 0.16) continue;
        const x = x1 + Math.cos(c.a) * c.sp * age, y = y1 + Math.sin(c.a) * c.sp * age + 400 * age * age;
        p.px(x, y, age < 0.06 ? C[3] : C[2]);
        if (c.s > 1) p.px(x + 1, y, C[1]);
      }
    },
  };
}

export function create(o) {
  return o.part === "griffe" ? claw(o) : impact(o);
}
