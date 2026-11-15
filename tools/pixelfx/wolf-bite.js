// Croc du loup (Legend of Agarica) : l'attaque de base. Refait le 2026-11-15 d'après le modèle donné par
// l'utilisateur (deux rangées de grosses dents pleines, sans mâchoire dessinée) : ici vues DE CÔTÉ, avec une
// denture de loup. Devant : la longue canine recourbée, un vide, les prémolaires
// pointues, la grosse carnassière, une molaire. Les dents du bas tombent entre celles du haut, la canine du
// bas passe devant celle du haut. Dents blanches cernées de vert, fine gencive verte, sans contour sombre,
// au grain de l'arc de la dague (1 px de l'effet = 1 px d'écran). Charnière à DROITE, gueule ouverte vers la
// gauche (le jeu retourne l'image quand le loup regarde à droite).
// Jeu : la gueule s'écarte, claque (images fantômes des mâchoires, étoile blanche où les canines se croisent,
// feuilles arrachées), tient fermée, puis s'amincit et s'efface en pointillés.
// Rendu par tools/pixelfx/export_loup.mjs aux 5 instants que le jeu affiche (élan, 2 actives, 2 d'effacement).
import { Rng, fit, clamp, rand, WHITE } from "../../core/index.js";

export const meta = {
  name: "Wolf bite",
  desc: "Two white crescent jaws with a green rim and curved interlocking fangs gape wide, snap shut with ghost trails, a white star where the canines cross and torn leaves, then thin out to dotted traces.",
  tags: ["melee", "bite", "fangs", "wolf", "beast", "directional", "one-shot"],
  size: [92, 96],
  origin: [46, 48],
  duration: 0.26,
  loop: false,
  fps: 30,
  bg: "dark",
  options: {
    palette: ["#1f7a4c", "#3fc47c", "#7dedb0", "#c4ffe0", "#f2fff7"],
    leaf: ["#3fc47c", "#8fe6a8", "#d8ffe6"],
    seed: 5,
  },
};

const SNAP = 0.085;   // les mâchoires se rejoignent
const FADE = 0.165;   // début de l'effacement
const HX = 33, L = 67;            // charnière, longueur d'une mâchoire
const GAPE = 0.5;                 // ouverture maximale (rad) de chaque mâchoire
const OFF = 12, BOW = 2.5, THICK = 4;   // écart des gencives gueule fermée, légère cambrure, épaisseur de la gencive
// dents : [place le long de la mâchoire (0 charnière, 1 bout), longueur, largeur à la racine, courbure vers la charnière]
const TEETH = {
  "-1": [[0.765, 22, 8, 6.5], [0.615, 9.5, 8.5, 1.5], [0.47, 10.5, 9.5, 1], [0.30, 12.5, 13, 0.5], [0.125, 7, 9, 0]],
  "1": [[0.955, 18, 7.5, 5.5], [0.69, 9, 8, 1.5], [0.54, 10, 9, 1], [0.385, 11, 10, 0.5], [0.21, 11.5, 12, 0.5], [0.055, 5.5, 7, 0]],
};
const arch = (u) => Math.pow(Math.sin(Math.PI * clamp(u)), 0.85);
const taper = (u) => Math.pow(Math.sin(Math.PI * clamp(u * 0.94 + 0.03)), 0.6);

// Ce que vaut le pixel (x, y) pour la mâchoire `s` (-1 haut, +1 bas) ouverte de `ang` : null, ou
// { tooth, f } (f : 0 au bord intérieur, 1 au bord extérieur ; pour une dent, 0 au cœur, 1 sur l'arête arrière).
function jawAt(x, y, s, ang, thin, shrink) {
  const rx = x - HX, ry = y, c = Math.cos(ang), sn = Math.sin(ang);
  const U = (-rx * c + s * ry * sn) / L;          // le long de la mâchoire
  const V = rx * sn + s * ry * c;                 // vers l'extérieur (haut pour celle du haut)
  if (U < -0.02 || U > 1.03) return null;
  const vo = OFF + BOW * arch(U), th = Math.max(0, THICK * taper(U) * thin), vi = vo - th;
  // dents d'abord : elles passent devant la mâchoire d'en face
  for (const [tu, len0, w, lean] of TEETH[s]) {
    const len = len0 * shrink;
    const base = OFF + BOW * arch(tu) - THICK * taper(tu) * thin;   // bord intérieur à la racine
    const d = base - V, q = d / len;
    if (q < -0.12 || q > 1) continue;
    const du = (tu - U) * L + lean * q * q;        // > 0 : côté charnière
    const hw = (w / 2) * Math.pow(1 - clamp(q), 0.58) + 0.25;   // dents ventrues, pointe nette
    if (Math.abs(du) <= hw) return { tooth: true, U, f: (du > hw - 1.25 && q < 0.85) || (du < -hw + 1.05 && q > 0.05 && q < 0.9) ? 1 : 0 };
  }
  if (th > 0.6 && V >= vi && V <= vo && U >= 0 && U <= 1) return { tooth: false, U, f: (V - vi) / th };
  return null;
}

export function draw(p, t, o) {
  const C = fit(o.palette, 5), LF = fit(o.leaf, 3), R = new Rng(o.seed);
  const [W, H] = meta.size, [OX, OY] = meta.origin;
  // ouverture : elle s'écarte encore un peu (élan), puis se referme d'un coup ; petit rebond après le claquement
  const k = clamp(t / SNAP);
  const open = t < SNAP ? (k < 0.35 ? 0.82 + 0.18 * (k / 0.35) : 1 - Math.pow((k - 0.35) / 0.65, 3))
    : 0.05 * Math.max(0, 1 - (t - SNAP) / 0.04);
  const fade = clamp((t - FADE) / (meta.duration - FADE));
  const flash = t >= SNAP - 0.008 && t < SNAP + 0.03;
  const thin = 1 - 0.6 * fade, shrink = 1 - 0.8 * fade;
  const ang = open * GAPE;

  // images fantômes : où étaient les mâchoires un instant plus tôt (seulement autour du claquement)
  const ghost = clamp(1 - Math.abs(t - (SNAP + 0.01)) / 0.035);
  if (ghost > 0) {
    for (const [ga, al] of [[0.42, 0.55], [0.22, 0.8]]) {
      for (let y = -OY; y < H - OY; y++) for (let x = -OX; x < W - OX; x++) {
        if ((x + y) & 1) continue;
        for (const s of [-1, 1]) {
          const j = jawAt(x, y, s, ga * GAPE, 0.5, 0);
          if (j && !j.tooth && j.f > 0.5) p.dot(x, y, C[1], al * ghost);
        }
      }
    }
  }

  for (let y = -OY; y < H - OY; y++) for (let x = -OX; x < W - OX; x++) {
    let hit = null;
    for (const s of [-1, 1]) {
      const j = jawAt(x, y, s, ang, thin, shrink);
      if (j && (!hit || (j.tooth && (!hit.tooth || s === 1)))) hit = j;   // les dents du bas passent devant
    }
    if (!hit) continue;
    if (fade > 0) {
      // effacement : la mâchoire se découpe en tirets de plus en plus courts (pas de bruit pixel par pixel),
      // les dents ne font que raccourcir
      const ph = hit.U * 13 + 0.37;
      if (!hit.tooth && ph - Math.floor(ph) < fade * 1.15 - 0.12) continue;
      if (fade > 0.93) continue;
    }
    let col;
    if (hit.tooth) col = flash ? WHITE : hit.f ? (fade > 0.4 ? C[1] : C[2]) : fade > 0.55 ? C[3] : WHITE;
    else if (flash) col = hit.f > 0.6 ? C[2] : C[3];
    else if (fade > 0.5) col = hit.f > 0.6 ? C[0] : C[1];
    else if (fade > 0) col = hit.f > 0.72 ? C[1] : hit.f < 0.16 ? C[1] : C[2];
    // gencive : fine bande verte qui fonce vers le dehors
    else col = hit.f < 0.45 ? C[2] : hit.f < 0.75 ? C[1] : C[0];
    p.dot(x, y, col, 1);
  }

  // étoile blanche là où les canines se croisent, au claquement
  const pop = t < SNAP - 0.006 ? 0 : clamp(1 - (t - SNAP) / 0.05);
  const sx = HX - L * 0.83, sy = 0;
  if (pop > 0) {
    // quatre longs rayons fins qui dépassent de la gueule, cœur plein, petites diagonales
    const r = Math.round(7 + 15 * pop), d = Math.round(2 + 5 * pop);
    for (let i = -r; i <= r; i++) { p.dot(sx + i, sy, WHITE, 1); if (Math.abs(i) <= r * 0.8) p.dot(sx, sy + i, WHITE, 1); }
    for (let i = -d; i <= d; i++) { p.dot(sx + i, sy + i, WHITE, 1); p.dot(sx + i, sy - i, WHITE, 1); }
    for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) if (Math.abs(x) + Math.abs(y) <= 3) p.dot(sx + x, sy + y, WHITE, 1);
    p.glow(sx, sy, 16, WHITE, 0.5 * pop);
  }
  p.glow(HX - L * 0.5, 0, 40, C[1], (0.14 + 0.3 * pop) * (1 - fade));

  // feuilles arrachées au claquement, comme sur l'arc de la dague : elles giclent de toute la gueule, vers le haut et le bas, en tournant
  for (let i = 0; i < 12; i++) {
    const t0 = SNAP + R.range(-0.005, 0.02), life = R.range(0.11, 0.17), lx = R.range(-4, 46), a0 = (i % 2 ? 1 : -1) * R.range(0.9, 2.3), sp = R.range(90, 200), flip = R.range(18, 34), big = R.next() < 0.5;
    const a = (t - t0) / life;
    if (a <= 0 || a >= 1 || t > meta.duration - 0.008) continue;
    const e = 1 - (1 - a) * (1 - a);               // vite puis ralenti
    const x = Math.round(sx + lx + Math.cos(a0) * sp * life * e), y = Math.round(sy + Math.sin(a0) * (6 + sp * life * e) + 8 * a * a);
    const wide = Math.sin(a * flip) > 0;
    const dk = a > 0.72;
    // petite feuille en losange (cœur clair, bord vert) ou vue par la tranche
    if (wide) {
      p.dot(x, y, dk ? LF[1] : LF[2], 1); p.dot(x - 1, y, LF[1], 1); p.dot(x + 1, y, LF[0], 1); p.dot(x, y - 1, LF[1], 1); p.dot(x, y + 1, LF[0], 1);
      if (big) { p.dot(x - 2, y, LF[1], 1); p.dot(x + 2, y, LF[0], 1); p.dot(x - 1, y - 1, LF[1], 1); p.dot(x + 1, y + 1, LF[0], 1); p.dot(x + 1, y - 1, LF[1], 1); p.dot(x - 1, y + 1, LF[0], 1); }
    } else {
      p.dot(x, y, LF[1], 1); p.dot(x + 1, y + 1, LF[0], 1); p.dot(x - 1, y - 1, dk ? LF[0] : LF[2], 1); if (big) p.dot(x + 2, y + 2, LF[0], 1);
    }
  }
}
