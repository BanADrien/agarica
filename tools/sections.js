#!/usr/bin/env node
'use strict';
/*
 * Sprites EN SECTIONS pour l'éclairage dynamique (pipeline de src/utils/LightKit.js).
 * Port fidèle de sections.py (skill pixel-art-forge, mis au point et validé sur sa page de test) :
 * même algorithme, mêmes seuils, même ordre de parcours ; sortie comparée au Python sur la marche
 * d'Agarica, le loup, le grizzly et le crapaud (cf. .claude/skills/eclairage-sections/SKILL.md).
 *
 * Usage (depuis la racine du jeu ; Node 18+ seul, rien à installer) :
 *   npm run sections -- <png|dossier>...      (= node tools/sections.js ...)
 *   node tools/sections.js <png>...                    chaque sprite seul
 *   node tools/sections.js --animation <dossier|png...> les frames d'UNE animation, ensemble
 *                    (dans l'ordre de anims.create : même palette, mêmes matières, lissage dans
 *                    le temps : l'éclairage ne clignote pas d'une frame à l'autre)
 *   node tools/sections.js --depuis-sections <png>...  recalcule les normales depuis
 *                    _lumiere/<nom>_sections.png retouché à la main (rien d'autre ne change)
 *   node tools/sections.js verifier                    cartes à refaire (sprite changé depuis)
 * Sorties, dans le dossier `_lumiere/` à côté du sprite (le `_` le cache à pixelfix.js) :
 *   <nom>_natif.png     le sprite à sa résolution native (1 pixel dessiné = 1 pixel)
 *   <nom>_neutre.png    couleurs de base en aplats (une couleur par matière), contour et œil gardés
 *   <nom>_sections.png  zones en couleurs franches (1 couleur = 1 direction), RETOUCHABLE
 *   <nom>_n.png         carte de normales (R = x droite, G = y HAUT, B = z vers le spectateur)
 *   <nom>_geo.png       géométrie de la silhouette (contre-jour, lampe cachée ; tools/lumiere/geo.js)
 * et le manifeste src/data/sections.js (GÉNÉRÉ : BootScene charge neutre + normales des sprites
 * qui y figurent, LightKit sait où tombe chaque pixel natif dans l'image du jeu).
 * Options :
 *   --facteur <f>    px de l'image par pixel dessiné ; défaut : `f` de src/data/pixel_fixed.js
 *                    (sprite refait par pixelfix.js), sinon 1 (sprite déjà natif)
 *   --echelle-jeu <s> image encore peinte (absente de pixel_fixed.js) : ramenée à sa taille vue en
 *                    jeu (setScale s), 32 couleurs, alpha net (approché : réduction Lanczos de sharp,
 *                    seul cas qui demande sharp : `npm install` dans tools/pixel-fixer)
 *   --couleurs <n>   avec --echelle-jeu : nombre de couleurs (32)
 *   --garder hex,hex couleurs gardées telles quelles (détails) ; --rampes "hex,hex;hex,hex" matières forcées
 *   --fps <n> --vitesse <px/s>   animation : notés dans le manifeste (page de test)
 *   --apercu         planche <nom>_apercu.png (origine | neutre | sections | éclairé g. | éclairé d.)
 *   --gauche         <nom>_neutre-gauche.png + <nom>_n-gauche.png (inutile avec LightKit, qui
 *                    inverse normal.x pour flipX ; pour un autre moteur)
 *   --sans-manifeste n'écrit pas src/data/sections.js (essais)
 * Code de sortie : 0 ok, 1 échec, 2 erreur d'usage.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const REGISTRY = path.join(ROOT, 'src', 'data', 'pixel_fixed.js');
const MANIFESTE = path.join(ROOT, 'src', 'data', 'sections.js');
const GEO = require('./lumiere/geo.js');
const PNGIO = require('./lumiere/png.js');
const DOSSIER = '_lumiere';

// sharp (réduction Lanczos) : seulement pour le mode image peinte (--echelle-jeu)
let sharp = null;
function chargerSharp() {
  if (sharp) return sharp;
  for (const p of ['sharp', path.join(__dirname, 'pixel-fixer', 'node_modules', 'sharp')]) {
    try { sharp = require(p); return sharp; } catch (e) { /* suivant */ }
  }
  console.error('--echelle-jeu demande sharp : "npm install" dans tools/pixel-fixer (git submodule update --init avant)');
  process.exit(2);
}

// ------------------------------------------------------------ outils (mêmes calculs que Python)
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const N8 = N4.concat([[1, 1], [1, -1], [-1, 1], [-1, -1]]);
const N8_ET_SOI = N8.concat([[0, 0]]);

// round() de Python 3 : moitié vers le pair
function pyRound(x) {
  const f = Math.floor(x), r = x - f;
  if (r > 0.5) return f + 1;
  if (r < 0.5) return f;
  return f % 2 === 0 ? f : f + 1;
}
const pyMod = (a, n) => ((a % n) + n) % n;

// Counter de Python : ordre d'insertion ; most_common(1) = premier maximum inséré
function compter(m, k, v) { m.set(k, (m.get(k) || 0) + (v === undefined ? 1 : v)); }
function plusFrequent(m) {
  let bk, bv = -Infinity;
  for (const [k, v] of m) if (v > bv) { bk = k; bv = v; }
  return [bk, bv];
}

const LAB = new Map();
function lin(c) { c /= 255.0; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
function lab(c) {   // c = entier 0xRRGGBB
  let v = LAB.get(c);
  if (v) return v;
  const r = lin((c >> 16) & 255), g = lin((c >> 8) & 255), b = lin(c & 255);
  const x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047;
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.pow(t, 1 / 3) : 7.787 * t + 16 / 116);
  const fx = f(x), fy = f(y), fz = f(z);
  v = [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
  LAB.set(c, v);
  return v;
}
const dist3 = (a, b) => Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
const hexc = (c) => c.toString(16).padStart(6, '0');
const parseHex = (s) => parseInt(s.trim().replace(/^#/, '').slice(0, 6), 16);
const rgbInt = (d, i) => (d[i] << 16) | (d[i + 1] << 8) | d[i + 2];

// Ordre de parcours de sections.py : ses ensembles de pixels sont des `set` de tuples (x, y), parcourus
// dans l'ordre de la table de hachage de CPython (3.12+, 64 bits). Les égalités (vote majoritaire,
// remplissage des parties) se départagent dans cet ordre : on le reproduit pour que la sortie soit
// celle du Python au pixel près (avec un simple ordre ligne par ligne : 5 à 15 % des sections
// changeaient, sans être meilleures ni pires).
const M64 = (1n << 64n) - 1n;
const XXP1 = 11400714785074694791n, XXP2 = 14029467366897019727n, XXP5 = 2870177450012600261n;
function hashTuple(x, y) {   // tuplehash() de CPython pour (x, y), hash(int) = int
  let acc = XXP5;
  for (const lane of [BigInt(x), BigInt(y)]) {
    acc = (acc + lane * XXP2) & M64;
    acc = ((acc << 31n) | (acc >> 33n)) & M64;
    acc = (acc * XXP1) & M64;
  }
  acc = (acc + (2n ^ (XXP5 ^ 3527539n))) & M64;
  return acc === M64 ? 1546275796n : acc;
}
function ordreSet(pixels, w) {   // pixels (indices y * w + x) dans l'ordre d'insertion -> ordre du set
  let mask = 7n, table = new Array(8).fill(null), fill = 0;
  const inserer = (tab, msk, e) => {   // set_insert_clean() : sondage linéaire de 9 puis perturbation
    let perturb = e.h, i = e.h & msk;
    for (;;) {
      if (tab[Number(i)] === null) { tab[Number(i)] = e; return; }
      if (i + 9n <= msk) for (let j = 1n; j <= 9n; j++) if (tab[Number(i + j)] === null) { tab[Number(i + j)] = e; return; }
      perturb >>= 5n;
      i = (i * 5n + 1n + perturb) & msk;
    }
  };
  for (const p of pixels) {
    inserer(table, mask, { p, h: hashTuple(p % w, (p - (p % w)) / w) });
    fill++;
    if (BigInt(fill) * 5n >= mask * 3n) {   // set_table_resize()
      const mini = fill > 50000 ? fill * 2 : fill * 4;
      let taille = 8;
      while (taille <= mini) taille *= 2;
      const old = table;
      mask = BigInt(taille - 1); table = new Array(taille).fill(null);
      for (const e of old) if (e) inserer(table, mask, e);
    }
  }
  return table.filter(Boolean).map((e) => e.p);
}

// ------------------------------------------------------------ table des sections
// code -> (nom, couleur franche, direction dans le plan (x droite, y haut) ou null, inclinaison)
// inclinaison : 0 = face au spectateur, 40 deg = incliné, 68 deg = rasant (bord tourné).
const DIRS = [['droite', 0], ['haut-droite', 45], ['haut', 90], ['haut-gauche', 135],
  ['gauche', 180], ['bas-gauche', 225], ['bas', 270], ['bas-droite', 315]];
const TILT_INC = 40.0, TILT_RAS = 68.0;
const GBLUR_MIN = 4.0, GBLUR_REL = 0.1, GPAD = 12;
const RAMP_SPAN = 48.0;
const PART_DL = 12.0, PART_MIN = 20, PART_PART = 0.15;
const W_GLOBAL = 0.7, W_PART = 0.55, W_SHADE = 0.3;

function hsv(hdeg, s, v) {   // colorsys.hsv_to_rgb puis round()
  const h = pyMod(hdeg, 360) / 360.0;
  let i = Math.trunc(h * 6.0);
  const f = h * 6.0 - i, p = v * (1.0 - s), q = v * (1.0 - s * f), t = v * (1.0 - s * (1.0 - f));
  i %= 6;
  const rgb = [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][i];
  return rgb.map((c) => pyRound(c * 255));
}
const SECTIONS = [['face', [200, 200, 200], null, 0.0]];
for (const [nom, ang] of DIRS) SECTIONS.push([nom + ' incline', hsv(ang, 0.55, 0.98), ang, TILT_INC]);
for (const [nom, ang] of DIRS) SECTIONS.push([nom + ' rasant', hsv(ang, 0.95, 0.62), ang, TILT_RAS]);

function sectionNormal(code) {
  const [, , ang, tilt] = SECTIONS[code];
  if (ang === null) return [0.0, 0.0, 1.0];
  const t = tilt * Math.PI / 180, a = ang * Math.PI / 180;
  return [Math.sin(t) * Math.cos(a), Math.sin(t) * Math.sin(a), Math.cos(t)];
}
const encodeNormal = (n) => n.map((c) => Math.max(0, Math.min(255, pyRound((c * 0.5 + 0.5) * 255))));

function quantize(nx, ny) {
  const m = Math.hypot(nx, ny);
  if (m < 0.30) return 0;
  const k = pyMod(pyRound(Math.atan2(ny, nx) * (180.0 / Math.PI) / 45.0), 8);
  return m < 0.72 ? 1 + k : 9 + k;
}
function nearestCode(rgb) {
  let best = 0, bv = Infinity;
  SECTIONS.forEach((s, i) => {
    const v = (rgb[0] - s[1][0]) ** 2 + (rgb[1] - s[1][1]) ** 2 + (rgb[2] - s[1][2]) ** 2;
    if (v < bv) { bv = v; best = i; }
  });
  return best;
}

// ------------------------------------------------------------ flou gaussien de Pillow (exact)
// ImageFilter.GaussianBlur = 3 passes de flou-boîte à rayon fractionnaire (BoxBlur.c), en flottants
// 32 bits et entiers 8 bits comme le C : la pente de la silhouette floutée sort identique au Python.
const f32 = Math.fround;
function rayonGauss(radius, passes) {
  const r = f32(radius);
  const sigma2 = f32(f32(r * r) / passes);
  const L = f32(Math.sqrt(12.0 * sigma2 + 1.0));
  const l = f32(Math.floor((L - 1.0) / 2.0));
  let a = f32(f32(f32(2 * l) + 1) * f32(f32(l * f32(l + 1)) - f32(3 * sigma2)));
  a = f32(a / f32(6 * f32(sigma2 - f32(f32(l + 1) * f32(l + 1)))));
  return f32(l + a);
}
function ligneBoite(lineIn, lineOut, lastx, radius, edgeA, edgeB, ww, fw) {
  let acc = lineIn[0] * (radius + 1);
  for (let x = 0; x < edgeA - 1; x++) acc += lineIn[x];
  acc += lineIn[lastx] * (radius - edgeA + 1);
  const save = (x, bulk) => { lineOut[x] = Math.floor((bulk + 8388608) / 16777216); };
  if (edgeA <= edgeB) {
    for (let x = 0; x < edgeA; x++) { acc += lineIn[x + radius] - lineIn[0]; save(x, acc * ww + (lineIn[0] + lineIn[x + radius + 1]) * fw); }
    for (let x = edgeA; x < edgeB; x++) {
      acc += lineIn[x + radius] - lineIn[x - radius - 1];
      save(x, acc * ww + (lineIn[x - radius - 1] + lineIn[x + radius + 1]) * fw);
    }
    for (let x = edgeB; x <= lastx; x++) {
      acc += lineIn[lastx] - lineIn[x - radius - 1];
      save(x, acc * ww + (lineIn[x - radius - 1] + lineIn[lastx]) * fw);
    }
  } else {
    for (let x = 0; x < edgeB; x++) { acc += lineIn[x + radius] - lineIn[0]; save(x, acc * ww + (lineIn[0] + lineIn[x + radius + 1]) * fw); }
    for (let x = edgeB; x < edgeA; x++) { acc += lineIn[lastx] - lineIn[0]; save(x, acc * ww + (lineIn[0] + lineIn[lastx]) * fw); }
    for (let x = edgeA; x <= lastx; x++) {
      acc += lineIn[lastx] - lineIn[x - radius - 1];
      save(x, acc * ww + (lineIn[x - radius - 1] + lineIn[lastx]) * fw);
    }
  }
}
function flouLignes(buf, W, H, floatRadius) {   // ImagingHorizontalBoxBlur, en place
  const radius = Math.trunc(floatRadius);
  const ww = Math.trunc(f32(16777216 / f32(f32(floatRadius * 2) + 1)));
  const fw = Math.floor((16777216 - (radius * 2 + 1) * ww) / 2);
  const edgeA = Math.min(radius + 1, W), edgeB = Math.max(W - radius - 1, 0);
  const lin = new Uint8Array(W), lout = new Uint8Array(W);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) lin[x] = buf[y * W + x];
    ligneBoite(lin, lout, W - 1, radius, edgeA, edgeB, ww, fw);
    for (let x = 0; x < W; x++) buf[y * W + x] = lout[x];
  }
}
function flouGaussien(src, W, H, radius) {   // image L (Uint8Array W*H) -> nouvelle image floutée
  const r = rayonGauss(radius, 3);
  const out = Uint8Array.from(src);
  if (r !== 0) for (let i = 0; i < 3; i++) flouLignes(out, W, H, r);
  if (r !== 0) {
    const t = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) t[x * H + y] = out[y * W + x];
    for (let i = 0; i < 3; i++) flouLignes(t, H, W, r);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) out[y * W + x] = t[x * H + y];
  }
  return out;
}

// ------------------------------------------------------------ analyse des couleurs
const hueDiff = (a, b) => { const d = pyMod(Math.abs(a - b), 360); return Math.min(d, 360 - d); };

function clusterRamps(colors, counts, adj, dark, prot, forced) {
  const feat = new Map();
  for (const c of colors) {
    const [L, a, b] = lab(c);
    feat.set(c, [Math.atan2(b, a) * (180.0 / Math.PI), Math.hypot(a, b) / Math.max(L, 8.0), Math.hypot(a, b)]);
  }
  const parent = new Map(colors.map((c) => [c, c]));
  const find = (c) => {
    while (parent.get(c) !== c) { parent.set(c, parent.get(parent.get(c))); c = parent.get(c); }
    return c;
  };
  for (const group of forced) {
    const g = group.filter((c) => parent.has(c));
    for (const c of g.slice(1)) parent.set(find(c), find(g[0]));
  }
  const pool = colors.filter((c) => !dark.has(c) && !prot.has(c));
  const inPool = new Set(pool);
  const total = pool.reduce((s, c) => s + counts.get(c), 0) || 1;
  const rare = Math.max(6, Math.trunc(0.006 * total));
  const span = new Map(colors.map((c) => [c, [lab(c)[0], lab(c)[0]]]));
  const pairs = [];
  for (const [k, v] of adj) {
    const a = Math.floor(k / 16777216), b = k % 16777216;
    if (inPool.has(a) && inPool.has(b)) pairs.push([v / Math.sqrt(counts.get(a) * counts.get(b)), a, b]);
  }
  pairs.sort((p, q) => (q[0] - p[0]) || (q[1] - p[1]) || (q[2] - p[2]));
  for (const [s, a, b] of pairs) {
    if (counts.get(a) < rare || counts.get(b) < rare) continue;
    const fa = feat.get(a), fb = feat.get(b);
    const grey = fa[2] < 8 && fb[2] < 8;
    if (s > 0.06 && (grey || (hueDiff(fa[0], fb[0]) < 15 && Math.abs(fa[1] - fb[1]) < 0.17))) {
      const ra = find(a), rb = find(b);
      if (ra === rb) continue;
      const lo = Math.min(span.get(ra)[0], span.get(rb)[0]), hi = Math.max(span.get(ra)[1], span.get(rb)[1]);
      if (hi - lo > RAMP_SPAN) continue;
      parent.set(ra, rb);
      span.set(rb, [lo, hi]);
    }
  }
  // couleurs rares : rejoignent la rampe avec laquelle elles se touchent le plus
  const parCompte = pool.map((c, i) => [c, i]).sort((p, q) => (counts.get(p[0]) - counts.get(q[0])) || (p[1] - q[1]));
  for (const [c] of parCompte) {
    if (counts.get(c) >= rare) continue;
    const best = new Map();
    for (const [k, v] of adj) {
      const a = Math.floor(k / 16777216), b = k % 16777216;
      const o = a === c ? b : b === c ? a : null;
      if (o !== null && inPool.has(o) && counts.get(o) >= rare) compter(best, find(o), v);
    }
    if (best.size) parent.set(find(c), plusFrequent(best)[0]);
  }
  const ramps = new Map();
  for (const c of pool) {
    const r = find(c);
    if (!ramps.has(r)) ramps.set(r, []);
    ramps.get(r).push(c);
  }
  return [...ramps.values()];
}

function rampBase(ramp, counts) {
  const n = ramp.reduce((s, c) => s + counts.get(c), 0);
  const m = [0, 1, 2].map((i) => ramp.reduce((s, c) => s + lab(c)[i] * counts.get(c), 0) / n);
  let best = ramp[0], bv = Infinity;
  for (const c of ramp) { const v = dist3(lab(c), m); if (v < bv) { bv = v; best = c; } }
  return best;
}

// ------------------------------------------------------------ géométrie
function offsetsTries(R) {
  const offs = [];
  for (let dx = -R; dx <= R; dx++) for (let dy = -R; dy <= R; dy++) if (dx || dy) offs.push([dx, dy]);
  return offs.map((o, i) => [o, i]).sort((p, q) => (p[0][0] ** 2 + p[0][1] ** 2) - (q[0][0] ** 2 + q[0][1] ** 2) || p[1] - q[1]).map((p) => p[0]);
}
// Pour chaque pixel de cand : distance et vecteur pixel -> bord le plus proche (moyenne à égalité)
function nearestVectors(w, isBorder, cand, R, D, VX, VY) {
  const offs = offsetsTries(R);
  for (const p of cand) {
    const x = p % w, y = (p - x) / w;
    let f0 = -1, sx = 0, sy = 0, n = 0;
    for (const [dx, dy] of offs) {
      if (isBorder(x + dx, y + dy, p)) {
        const d2 = dx * dx + dy * dy;
        if (f0 < 0) { f0 = d2; sx = dx; sy = dy; n = 1; } else if (d2 === f0) { sx += dx; sy += dy; n++; } else break;
      }
    }
    if (f0 < 0) { D[p] = R + 1; VX[p] = 0; VY[p] = 0; } else { D[p] = Math.sqrt(f0); VX[p] = sx / n; VY[p] = sy / n; }
  }
}

// Codes de section : Int32Array (-1 = absent) + ordre d'insertion (celui du dict Python)
function heriterBord(codes, opq, w, h) {
  // le bord de la silhouette prend la section majoritaire des pixels INTERIEURS voisins
  const dans = (x, y) => x >= 0 && y >= 0 && x < w && y < h && opq[y * w + x];
  const ring = new Uint8Array(w * h);
  for (let p = 0; p < w * h; p++) {
    if (!opq[p]) continue;
    const x = p % w, y = (p - x) / w;
    for (const [dx, dy] of N8) if (!dans(x + dx, y + dy)) { ring[p] = 1; break; }
  }
  const out = Int32Array.from(codes);
  for (let p = 0; p < w * h; p++) {
    if (!ring[p]) continue;
    const x = p % w, y = (p - x) / w;
    for (const r of [1, 2, 3]) {
      const cnt = new Map();
      for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
          const X = x + dx, Y = y + dy;
          if (dans(X, Y) && !ring[Y * w + X]) compter(cnt, codes[Y * w + X]);
        }
      }
      if (cnt.size) { out[p] = plusFrequent(cnt)[0]; break; }
    }
  }
  return out;
}

function modeFilter(codes, ordre, w, h, regall, keep, iters) {
  for (let it = 0; it < iters; it++) {
    const nw = Int32Array.from(codes);
    for (const p of ordre) {
      if (keep[p]) continue;
      const x = p % w, y = (p - x) / w, c = codes[p];
      const cnt = new Map();
      for (const [dx, dy] of N8_ET_SOI) {
        const X = x + dx, Y = y + dy;
        if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
        const q = Y * w + X;
        if (codes[q] >= 0 && regall[q] === regall[p] && !keep[q]) compter(cnt, codes[q], dx === 0 && dy === 0 ? 2 : 1);
      }
      if (cnt.size) {
        const [best, v] = plusFrequent(cnt);
        if (v >= 5 && best !== c) nw[p] = best;
      }
    }
    codes = nw;
  }
  return codes;
}

function mergeSmall(codes, ordre, w, h, minsize, keep) {
  // zones (pixels connexes de même code) plus petites que minsize -> code voisin majoritaire
  const seen = new Uint8Array(w * h);
  for (const p of ordre) {
    if (seen[p] || keep[p]) continue;
    const c = codes[p];
    const comp = [p];
    seen[p] = 1;
    for (let k = 0; k < comp.length; k++) {
      const x = comp[k] % w, y = (comp[k] - x) / w;
      for (const [dx, dy] of N4) {
        const X = x + dx, Y = y + dy;
        if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
        const r = Y * w + X;
        if (codes[r] >= 0 && !seen[r] && codes[r] === c && !keep[r]) { seen[r] = 1; comp.push(r); }
      }
    }
    if (comp.length < minsize) {
      const cs = new Set(comp), cnt = new Map();
      for (const q of comp) {
        const x = q % w, y = (q - x) / w;
        for (const [dx, dy] of N4) {
          const X = x + dx, Y = y + dy;
          if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
          const r = Y * w + X;
          if (codes[r] >= 0 && !cs.has(r) && !keep[r]) compter(cnt, codes[r]);
        }
      }
      if (cnt.size) { const nc = plusFrequent(cnt)[0]; for (const r of comp) codes[r] = nc; }
    }
  }
  return codes;
}

// ------------------------------------------------------------ analyse (sections.py analyse())
function analyse(im, garder, rampes, peint, tailleRef) {
  const w = im.width, h = im.height, d = im.data, NP = w * h;
  const opq = new Uint8Array(NP), ligneParLigne = [];
  const col = new Int32Array(NP).fill(-1);
  for (let p = 0; p < NP; p++) if (d[p * 4 + 3] >= 128) { opq[p] = 1; ligneParLigne.push(p); col[p] = rgbInt(d, p * 4); }
  const opqList = ordreSet(ligneParLigne, w);
  const dans = (x, y) => x >= 0 && y >= 0 && x < w && y < h && opq[y * w + x] === 1;
  const counts = new Map();
  for (const p of opqList) compter(counts, col[p]);
  const colors = [...counts.keys()];
  const adj = new Map();
  for (const p of opqList) {
    const x = p % w, y = (p - x) / w;
    for (const [dx, dy] of [[1, 0], [0, 1]]) {
      if (!dans(x + dx, y + dy)) continue;
      const q = (y + dy) * w + x + dx;
      if (col[q] !== col[p]) {
        const a = Math.min(col[p], col[q]), b = Math.max(col[p], col[q]);
        compter(adj, a * 16777216 + b);
      }
    }
  }
  const L = new Map(colors.map((c) => [c, lab(c)[0]]));
  const chroma = new Map(colors.map((c) => [c, Math.hypot(lab(c)[1], lab(c)[2])]));
  const n = opqList.length;

  // lignes sombres : la ou les couleurs les plus sombres (contour + traits intérieurs)
  let darkest = colors[0];
  for (const c of colors) if (L.get(c) < L.get(darkest)) darkest = c;
  let lineC = null;
  for (const c of colors) if (L.get(c) < 22 && (lineC === null || counts.get(c) > counts.get(lineC))) lineC = c;
  if (lineC === null) lineC = darkest;
  const dark = new Set(colors.filter((c) => L.get(c) <= L.get(lineC) + 3.5));

  // détails gardés : couleurs rares et très saturées (œil) + couleurs rares collées à elles
  const prot = new Uint8Array(NP);
  const rare = Math.max(4, Math.trunc(0.01 * n));
  const chromas = opqList.map((p) => chroma.get(col[p])).sort((a, b) => a - b);
  const medC = chromas[Math.floor(n / 2)];
  const seeds = new Set(colors.filter((c) => counts.get(c) < rare && chroma.get(c) > Math.max(45, 1.4 * medC)));
  for (const g of garder) seeds.add(parseHex(g));
  let front = opqList.filter((p) => seeds.has(col[p]));
  for (const p of front) prot[p] = 1;
  for (let it = 0; it < 2; it++) {
    const nxt = new Set();
    for (const p of front) {
      const x = p % w, y = (p - x) / w;
      for (const [dx, dy] of N8) {
        if (!dans(x + dx, y + dy)) continue;
        const q = (y + dy) * w + x + dx;
        if (!prot[q] && counts.get(col[q]) < rare) nxt.add(q);
      }
    }
    for (const q of nxt) prot[q] = 1;
    front = [...nxt];
  }
  const pc = new Map();
  for (const p of opqList) if (prot[p]) compter(pc, col[p]);
  const protC = new Set([...pc].filter(([c, v]) => v === counts.get(c)).map(([c]) => c));
  const forced = rampes.map((g) => g.split(',').filter((t) => t.trim()).map(parseHex));
  const ramps = clusterRamps(colors, counts, adj, dark, protC, forced);
  const rampOf = new Map();
  ramps.forEach((r, i) => r.forEach((c) => rampOf.set(c, i)));
  const base = ramps.map((r) => rampBase(r, counts));

  const line = new Uint8Array(NP);
  for (const p of opqList) if (dark.has(col[p]) && !prot[p]) line[p] = 1;

  // matière de surface vs motif (taches) : un motif touche surtout une autre matière, peu les lignes
  const contact = ramps.map(() => new Map());
  for (const p of opqList) {
    if (line[p] || prot[p]) continue;
    const x = p % w, y = (p - x) / w, r = rampOf.get(col[p]);
    for (const [dx, dy] of N4) {
      if (!dans(x + dx, y + dy)) { compter(contact[r], 'vide'); continue; }
      const q = (y + dy) * w + x + dx;
      if (line[q]) compter(contact[r], 'ligne');
      else if (!prot[q] && rampOf.get(col[q]) !== r) compter(contact[r], rampOf.get(col[q]));
    }
  }
  let seg = ramps.map((_, i) => i);
  contact.forEach((cnt, r) => {
    const tot = [...cnt.values()].reduce((s, v) => s + v, 0) || 1;
    let bk = null, bv = -1;
    for (const [k, v] of cnt) if (typeof k === 'number' && v > bv) { bk = k; bv = v; }
    if (bk !== null && ((cnt.get('ligne') || 0) + (cnt.get('vide') || 0)) / tot < 0.35 && bv / tot > 0.45) seg[r] = bk;
  });
  for (let i = 0; i < seg.length; i++) seg = seg.map((s) => seg[s]);

  // parties : remplissage sur les pixels non-ligne, coupé par les lignes et les matières de surface
  const body = opqList.filter((p) => !line[p]);
  const inBody = new Uint8Array(NP);
  const segm = new Int32Array(NP).fill(-9);
  for (const p of body) { inBody[p] = 1; segm[p] = prot[p] ? -1 : seg[rampOf.get(col[p])]; }
  const barrier = Uint8Array.from(line);
  for (const p of opqList) {
    if (!line[p]) continue;
    const x = p % w, y = (p - x) / w;
    for (const [dx, dy] of N8) {
      const X = x + dx, Y = y + dy;
      if (X >= 0 && Y >= 0 && X < w && Y < h && inBody[Y * w + X]) barrier[Y * w + X] = 1;
    }
  }
  const region = new Int32Array(NP).fill(-1);
  const regOrdre = [];
  let rid = 0;
  for (const p of body) {
    if (region[p] >= 0 || barrier[p]) continue;
    const stack = [p];
    region[p] = rid; regOrdre.push(p);
    while (stack.length) {
      const s = stack.pop(), x = s % w, y = (s - x) / w;
      for (const [dx, dy] of N4) {
        const X = x + dx, Y = y + dy;
        if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
        const q = Y * w + X;
        // comparaison avec la GRAINE p (comme sections.py)
        if (inBody[q] && region[q] < 0 && !barrier[q] && (segm[q] === segm[p] || segm[q] === -1 || segm[p] === -1)) {
          region[q] = rid; regOrdre.push(q); stack.push(q);
        }
      }
    }
    rid++;
  }
  function absorb(minsize) {
    for (;;) {
      const sizes = new Map();
      for (const p of regOrdre) compter(sizes, region[p]);
      const tri = [...sizes].map((e, i) => [e[0], e[1], i]).sort((a, b) => (a[1] - b[1]) || (a[2] - b[2]));
      let changed = false;
      for (const [r, sz] of tri) {
        if (sz >= minsize) break;
        const members = regOrdre.filter((p) => region[p] === r);
        const cnt = new Map();
        for (const p of members) {
          const x = p % w, y = (p - x) / w;
          for (const [dx, dy] of N8) {
            const X = x + dx, Y = y + dy;
            if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
            const q = Y * w + X;
            if (region[q] >= 0 && region[q] !== r) compter(cnt, region[q]);
          }
        }
        if (cnt.size) {
          const nr = plusFrequent(cnt)[0];
          for (const p of members) region[p] = nr;
          changed = true;
          break;
        }
      }
      if (!changed) return;
    }
  }
  absorb(12);
  // pixels de la bordure épaissie : rendus à la partie voisine de même matière (sinon la plus proche)
  let todo = body.filter((p) => region[p] < 0);
  for (let it = 0; it < 4; it++) {
    const rest = [];
    for (const p of todo) {
      const x = p % w, y = (p - x) / w;
      const same = new Map(), other = new Map();
      for (const [dx, dy] of N8) {
        const X = x + dx, Y = y + dy;
        if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
        const q = Y * w + X;
        if (region[q] >= 0) compter(segm[q] === segm[p] ? same : other, region[q]);
      }
      const pick = same.size ? same : other;
      if (pick.size) { region[p] = plusFrequent(pick)[0]; regOrdre.push(p); } else rest.push(p);
    }
    todo = rest;
  }
  for (const p of todo) { region[p] = rid++; regOrdre.push(p); }
  absorb(12);

  // vecteurs vers le bord de la partie (bombé) et vers le vide (contour extérieur)
  const nD = new Float64Array(NP), nVX = new Float64Array(NP), nVY = new Float64Array(NP);
  nearestVectors(w, (X, Y, p) => {
    if (!dans(X, Y)) return true;
    const q = Y * w + X;
    if (line[q]) return true;
    return region[q] >= 0 && region[q] !== region[p];
  }, body, 7, nD, nVX, nVY);
  const oD = new Float64Array(NP), oVX = new Float64Array(NP), oVY = new Float64Array(NP);
  nearestVectors(w, (X, Y) => !dans(X, Y), opqList, 6, oD, oVX, oVY);
  const nReg = rid;
  const dmax = new Float64Array(nReg);
  for (const p of body) dmax[region[p]] = Math.max(dmax[region[p]], nD[p]);

  // indice d'ombrage : écart de luminance à la moyenne de la rampe, lissé dans la partie
  const rmean = [], rstd = [];
  ramps.forEach((r) => {
    const tot = r.reduce((s, c) => s + counts.get(c), 0);
    const m = r.reduce((s, c) => s + L.get(c) * counts.get(c), 0) / tot;
    const sd = Math.sqrt(r.reduce((s, c) => s + (L.get(c) - m) ** 2 * counts.get(c), 0) / tot) || 1.0;
    rmean.push(m); rstd.push(Math.max(sd, 6.0));
  });
  const off = new Float64Array(NP), hasOff = new Uint8Array(NP);
  for (const p of body) {
    if (prot[p]) continue;
    const r = rampOf.get(col[p]);
    off[p] = (L.get(col[p]) - rmean[r]) / rstd[r]; hasOff[p] = 1;
  }
  const soff = new Float64Array(NP);
  for (const p of body) {
    const x = p % w, y = (p - x) / w;
    let s = 0, k = 0;
    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -2; dy <= 2; dy++) {
        const X = x + dx, Y = y + dy;
        if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
        const q = Y * w + X;
        if (hasOff[q] && region[q] === region[p]) { s += off[q]; k++; }
      }
    }
    soff[p] = k ? s / k : 0.0;
  }
  const regOff = new Float64Array(nReg), regN = new Float64Array(nReg);
  for (const p of body) { regOff[region[p]] += soff[p]; regN[region[p]] += 1; }
  const lx = -Math.sqrt(0.5), ly = Math.sqrt(0.5);   // lumière d'origine : haut-gauche (y haut)

  // volume d'ensemble : la silhouette floutée est une colline ; sa pente = bombé global
  const tr = tailleRef || [w, h];
  const gblur = Math.max(GBLUR_MIN, GBLUR_REL * Math.min(tr[0], tr[1]));
  const gp = Math.trunc(2.5 * gblur) + 2;
  const MW = w + 2 * gp, MH = h + 2 * gp;
  const mask = new Uint8Array(MW * MH);
  for (const p of opqList) { const x = p % w, y = (p - x) / w; mask[(y + gp) * MW + x + gp] = 255; }
  const hill = flouGaussien(mask, MW, MH, gblur);
  const gX = new Float64Array(NP), gY = new Float64Array(NP);
  const mags = [];
  for (const p of opqList) {
    const x = p % w, y = (p - x) / w, X = x + gp, Y = y + gp;
    gX[p] = -(hill[Y * MW + X + 1] - hill[Y * MW + X - 1]) / 2.0;
    gY[p] = (hill[(Y + 1) * MW + X] - hill[(Y - 1) * MW + X]) / 2.0;
    mags.push(Math.hypot(gX[p], gY[p]));
  }
  mags.sort((a, b) => a - b);
  const gmax = mags[Math.trunc(mags.length * 0.97)] || 1.0;

  // bombé de chaque partie : la partie (sans ses traits) floutée seule
  const pgX = new Float64Array(NP), pgY = new Float64Array(NP);
  const membres = Array.from({ length: nReg }, () => []);
  for (const p of regOrdre) membres[region[p]].push(p);
  const PW = w + 2 * GPAD, PH = h + 2 * GPAD;
  for (let r = 0; r < nReg; r++) {
    const ms = membres[r];
    if (!ms.length) continue;
    const pm = new Uint8Array(PW * PH);
    for (const p of ms) { const x = p % w, y = (p - x) / w; pm[(y + GPAD) * PW + x + GPAD] = 255; }
    const rad = Math.max(1.2, Math.min(3.0, dmax[r] * 0.6));
    const ph = flouGaussien(pm, PW, PH, rad);
    let pmx = 0;
    for (const p of ms) {
      const x = p % w, y = (p - x) / w, X = x + GPAD, Y = y + GPAD;
      pgX[p] = -(ph[Y * PW + X + 1] - ph[Y * PW + X - 1]) / 2.0;
      pgY[p] = (ph[(Y + 1) * PW + X] - ph[(Y - 1) * PW + X]) / 2.0;
      pmx = Math.max(pmx, Math.hypot(pgX[p], pgY[p]));
    }
    pmx = pmx || 1.0;
    for (const p of ms) { pgX[p] /= pmx; pgY[p] /= pmx; }
  }

  let codes = new Int32Array(NP).fill(-1);
  const ordre = [];
  for (const p of body) {
    const r = region[p];
    const gx = gX[p], gy = gY[p];
    const gm = Math.min(1.0, Math.hypot(gx, gy) / gmax);
    const gn = Math.hypot(gx, gy) || 1.0;
    const gk = W_GLOBAL * Math.pow(gm, 0.8);
    let s = 0.6 * soff[p] + 0.5 * regOff[r] / regN[r];
    s = Math.max(-1.2, Math.min(1.2, s));
    const wp = W_PART * Math.min(1.0, dmax[r] / 3.0);   // petite partie : bombé propre atténué
    const ws = W_SHADE * (peint ? 0.6 : 1.0);           // image peinte : ombrage riche, moins suivi
    const nx = gx / gn * gk + wp * pgX[p] + ws * s * lx;
    const ny = gy / gn * gk + wp * pgY[p] + ws * s * ly;
    codes[p] = quantize(nx, ny);
    ordre.push(p);
  }
  // contour extérieur : rasant, tourné vers l'extérieur ; traits intérieurs : comme leurs voisins
  const outline = new Uint8Array(NP);
  for (const p of ordreSet(opqList.filter((q) => line[q]), w)) {
    if (oD[p] <= 2.3) {
      outline[p] = 1;
      const m = Math.hypot(oVX[p], oVY[p]) || 1;
      codes[p] = quantize(oVX[p] / m, -oVY[p] / m);
      ordre.push(p);
    }
  }
  let pending = opqList.filter((p) => codes[p] < 0);
  for (let it = 0; it < 6 && pending.length; it++) {
    const rest = [];
    for (const p of pending) {
      const x = p % w, y = (p - x) / w;
      const cnt = new Map();
      for (const [dx, dy] of N8) {
        const X = x + dx, Y = y + dy;
        if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
        const q = Y * w + X;
        if (codes[q] >= 0 && !outline[q]) compter(cnt, codes[q]);
      }
      if (cnt.size) { codes[p] = plusFrequent(cnt)[0]; ordre.push(p); } else rest.push(p);
    }
    pending = rest.filter((p) => codes[p] < 0);
  }
  for (const p of pending) { codes[p] = 0; ordre.push(p); }
  const regall = new Int32Array(NP).fill(-9);
  for (const p of opqList) regall[p] = region[p] >= 0 ? region[p] : outline[p] ? -2 : -3;
  codes = modeFilter(codes, ordre, w, h, regall, outline, peint ? 5 : 3);
  codes = mergeSmall(codes, ordre, w, h, peint ? 10 : 6, outline);
  codes = heriterBord(codes, opq, w, h);

  // neutre : chaque pixel prend la couleur de base de sa rampe ; grains isolés (1-2 px) absorbés
  const ridOf = new Int32Array(NP).fill(-1);
  const ridOrdre = body.filter((p) => !prot[p]);
  for (const p of ridOrdre) ridOf[p] = rampOf.get(col[p]);
  const seen = new Uint8Array(NP);
  for (const p of ridOrdre) {
    if (seen[p]) continue;
    const comp = [p];
    seen[p] = 1;
    for (let k = 0; k < comp.length; k++) {
      const x = comp[k] % w, y = (comp[k] - x) / w;
      for (const [dx, dy] of N4) {
        const X = x + dx, Y = y + dy;
        if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
        const t = Y * w + X;
        if (ridOf[t] >= 0 && !seen[t] && ridOf[t] === ridOf[p]) { seen[t] = 1; comp.push(t); }
      }
    }
    if (comp.length <= 2) {
      const cnt = new Map();
      for (const q of comp) {
        const x = q % w, y = (q - x) / w;
        for (const [dx, dy] of N8) {
          const X = x + dx, Y = y + dy;
          if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
          const t = Y * w + X;
          if (ridOf[t] >= 0 && !comp.includes(t)) compter(cnt, ridOf[t]);
        }
      }
      if (cnt.size) {
        const nr = plusFrequent(cnt)[0];
        if (nr !== ridOf[p]) for (const t of comp) ridOf[t] = nr;
      }
    }
  }
  // même rampe, deux matières (peau claire et tunique beige d'Agarica) : 2-moyennes sur les parties
  const partBase = new Map();
  const acc = new Map();
  for (const p of ridOrdre) {
    const r = ridOf[p];
    if (rampOf.get(col[p]) !== r) continue;
    const k = region[p] * 4096 + r;
    if (!acc.has(k)) acc.set(k, [region[p], r, 0, 0, 0, 0]);
    const a = acc.get(k), l = lab(col[p]);
    a[2] += l[0]; a[3] += l[1]; a[4] += l[2]; a[5] += 1;
  }
  const parRampe = new Map();
  for (const a of acc.values()) {
    if (!parRampe.has(a[1])) parRampe.set(a[1], []);
    parRampe.get(a[1]).push(a);
  }
  for (const [r, parts] of parRampe) {
    const big = parts.filter((a) => a[5] >= PART_MIN);
    if (big.length < 2) continue;
    const ls = big.map((a) => a[2] / a[5]), ws = big.map((a) => a[5]);
    let c1 = Math.min(...ls), c2 = Math.max(...ls), g1 = [], g2 = [];
    for (let it = 0; it < 20; it++) {
      g1 = ls.map((l, i) => i).filter((i) => Math.abs(ls[i] - c1) <= Math.abs(ls[i] - c2));
      g2 = ls.map((l, i) => i).filter((i) => !g1.includes(i));
      if (!g1.length || !g2.length) break;
      c1 = g1.reduce((s, i) => s + ls[i] * ws[i], 0) / g1.reduce((s, i) => s + ws[i], 0);
      c2 = g2.reduce((s, i) => s + ls[i] * ws[i], 0) / g2.reduce((s, i) => s + ws[i], 0);
    }
    const totW = parts.reduce((s, a) => s + a[5], 0);
    if (!g1.length || !g2.length || Math.abs(c2 - c1) < PART_DL ||
      Math.min(g1.reduce((s, i) => s + ws[i], 0), g2.reduce((s, i) => s + ws[i], 0)) < PART_PART * totW) continue;
    for (const g of [g1, g2]) {
      const sw = g.reduce((s, i) => s + big[i][5], 0);
      const m = [2, 3, 4].map((k) => g.reduce((s, i) => s + big[i][k], 0) / sw);
      let cb = ramps[r][0], bv = Infinity;
      for (const c of ramps[r]) { const v = dist3(lab(c), m); if (v < bv) { bv = v; cb = c; } }
      for (const i of g) partBase.set(big[i][0] * 4096 + r, cb);
    }
  }
  const neutral = new Int32Array(NP).fill(-1);
  for (const p of opqList) {
    if (line[p] || prot[p]) neutral[p] = col[p];
    else {
      const k = region[p] * 4096 + ridOf[p];
      neutral[p] = partBase.has(k) ? partBase.get(k) : base[ridOf[p]];
    }
  }
  const info = {
    ramps: ramps.map((r, i) => [hexc(base[i]), r.slice().sort((a, b) => L.get(a) - L.get(b)).map(hexc)]),
    lines: [...dark].map(hexc).sort(), protected: [...new Set(opqList.filter((p) => prot[p]).map((p) => hexc(col[p])))].sort(),
    parts: new Set(body.map((p) => region[p])).size, outline, rampOf,
  };
  return { opq, opqList, neutral, codes, info };
}

// ------------------------------------------------------------ images
// PNG en RGBA 8 bits (palette, gris, 16 bits convertis), sans gestion de couleur, comme Pillow
async function lirePng(file) { return PNGIO.lirePng(file); }
async function ecrirePng(img, file) { PNGIO.ecrirePng(img, file); }
const nouvelle = (w, h) => ({ width: w, height: h, data: new Uint8Array(w * h * 4) });
function boite(im, seuil) {   // getbbox() de l'alpha (>= seuil) : [x0, y0, x1, y1) ou null
  let x0 = im.width, y0 = im.height, x1 = -1, y1 = -1;
  for (let y = 0; y < im.height; y++) {
    for (let x = 0; x < im.width; x++) {
      if (im.data[(y * im.width + x) * 4 + 3] < seuil) continue;
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    }
  }
  return x1 < 0 ? null : [x0, y0, x1 + 1, y1 + 1];
}
function rogner(im, b) {
  const out = nouvelle(b[2] - b[0], b[3] - b[1]);
  for (let y = b[1]; y < b[3]; y++) {
    for (let x = b[0]; x < b[2]; x++) {
      if (x < 0 || y < 0 || x >= im.width || y >= im.height) continue;
      const s = (y * im.width + x) * 4, t = ((y - b[1]) * out.width + x - b[0]) * 4;
      for (let k = 0; k < 4; k++) out.data[t + k] = im.data[s + k];
    }
  }
  return out;
}
function coller(dst, src, ox, oy) {
  for (let y = 0; y < src.height; y++) {
    for (let x = 0; x < src.width; x++) {
      const X = x + ox, Y = y + oy;
      if (X < 0 || Y < 0 || X >= dst.width || Y >= dst.height) continue;
      const s = (y * src.width + x) * 4, t = (Y * dst.width + X) * 4;
      for (let k = 0; k < 4; k++) dst.data[t + k] = src.data[s + k];
    }
  }
}

function saveMaps(w, h, opq, neutral, codes) {
  const neu = nouvelle(w, h), sec = nouvelle(w, h), nor = nouvelle(w, h);
  for (let p = 0; p < w * h; p++) {
    nor.data[p * 4] = 128; nor.data[p * 4 + 1] = 128; nor.data[p * 4 + 2] = 255;
    if (!opq[p]) continue;
    const c = neutral[p], s = SECTIONS[codes[p]][1], nn = encodeNormal(sectionNormal(codes[p]));
    neu.data.set([(c >> 16) & 255, (c >> 8) & 255, c & 255, 255], p * 4);
    sec.data.set([s[0], s[1], s[2], 255], p * 4);
    nor.data.set([nn[0], nn[1], nn[2], 255], p * 4);
  }
  return { neu, sec, nor };
}

// texture de géométrie (marge GEO.GEO_PAD autour du sprite), lue par le shader de LightKit
function geoDe(opq, w, h) {
  const g = GEO.geometrie(opq, w, h);
  return { width: g.width, height: g.height, data: g.data };
}

function normalesDepuisSections(sec) {
  const nor = nouvelle(sec.width, sec.height), cache = new Map(), lues = new Set();
  for (let p = 0; p < sec.width * sec.height; p++) {
    nor.data.set([128, 128, 255, 0], p * 4);
    if (sec.data[p * 4 + 3] < 128) continue;
    const c = rgbInt(sec.data, p * 4);
    if (!cache.has(c)) cache.set(c, nearestCode([(c >> 16) & 255, (c >> 8) & 255, c & 255]));
    lues.add(SECTIONS[cache.get(c)][0]);
    const nn = encodeNormal(sectionNormal(cache.get(c)));
    nor.data.set([nn[0], nn[1], nn[2], 255], p * 4);
  }
  return { nor, lues };
}

function eclairer(neu, nor, ldir, steps = 4, amb = 0.45, inten = 0.85) {
  const out = nouvelle(neu.width, neu.height);
  const m = Math.hypot(...ldir), Ld = ldir.map((c) => c / m);
  for (let p = 0; p < neu.width * neu.height; p++) {
    if (neu.data[p * 4 + 3] < 128) continue;
    const nn = [0, 1, 2].map((k) => nor.data[p * 4 + k] / 255 * 2 - 1);
    let d = Math.max(0.0, nn[0] * Ld[0] + nn[1] * Ld[1] + nn[2] * Ld[2]);
    if (steps) d = Math.floor(d * (steps - 1) + 0.5) / (steps - 1);
    const f = amb + inten * d;
    for (let k = 0; k < 3; k++) out.data[p * 4 + k] = Math.min(255, pyRound(neu.data[p * 4 + k] * f));
    out.data[p * 4 + 3] = 255;
  }
  return out;
}

// planche : une colonne par sprite ; lignes origine, neutre, sections, éclairé à gauche, à droite
function planche(colonnes, z = 4) {
  const w = colonnes[0].o.width, h = colonnes[0].o.height, pad = 4;
  const lignes = (c) => [c.o, c.neu, c.sec, eclairer(c.neu, c.nor, [-1, 0.5, 1.0]), eclairer(c.neu, c.nor, [1, 0.5, 1.0])];
  const b = nouvelle(colonnes.length * (w * z + pad) + pad, 5 * (h * z + pad) + pad);
  for (let i = 0; i < b.width * b.height; i++) b.data.set([13, 11, 26, 255], i * 4);
  colonnes.forEach((c, i) => {
    lignes(c).forEach((t, r) => {
      const ox = pad + i * (w * z + pad), oy = pad + r * (h * z + pad);
      for (let y = 0; y < t.height * z; y++) {
        for (let x = 0; x < t.width * z; x++) {
          const s = (((y / z) | 0) * t.width + ((x / z) | 0)) * 4;
          if (t.data[s + 3] < 128) continue;
          b.data.set([t.data[s], t.data[s + 1], t.data[s + 2], 255], ((oy + y) * b.width + ox + x) * 4);
        }
      }
    });
  });
  return b;
}

function miroir(im, inverserRouge) {
  const out = nouvelle(im.width, im.height);
  for (let y = 0; y < im.height; y++) {
    for (let x = 0; x < im.width; x++) {
      const s = (y * im.width + x) * 4, t = (y * im.width + im.width - 1 - x) * 4;
      for (let k = 0; k < 4; k++) out.data[t + k] = im.data[s + k];
      if (inverserRouge) out.data[t] = 255 - im.data[s];
    }
  }
  return out;
}

// ------------------------------------------------------------ image peinte (mode --echelle-jeu)
function kmeans(items, k, iters = 12) {
  if (items.length <= k) return items.map((it) => it[0]);
  let best = items[0];
  for (const it of items) if (it[1] > best[1]) best = it;
  const cents = [best[0]];
  let dist = items.map((it) => dist3(it[0], cents[0]) ** 2 * it[1]);
  while (cents.length < k) {
    let i = 0;
    for (let j = 1; j < items.length; j++) if (dist[j] > dist[i]) i = j;
    cents.push(items[i][0]);
    dist = dist.map((dd, j) => Math.min(dd, dist3(items[j][0], cents[cents.length - 1]) ** 2 * items[j][1]));
  }
  let cs = cents;
  for (let it = 0; it < iters; it++) {
    const acc = cs.map(() => [0, 0, 0, 0]);
    for (const [l, wgt] of items) {
      let j = 0, bv = Infinity;
      cs.forEach((c, i) => { const v = dist3(l, c); if (v < bv) { bv = v; j = i; } });
      const a = acc[j];
      a[0] += l[0] * wgt; a[1] += l[1] * wgt; a[2] += l[2] * wgt; a[3] += wgt;
    }
    cs = acc.map((a, i) => (a[3] ? [a[0] / a[3], a[1] / a[3], a[2] / a[3]] : cs[i]));
  }
  return cs;
}
function paletteLab(rgbs, ncol) {
  const cnt = new Map();
  for (const c of rgbs) compter(cnt, c);
  const bins = new Map();
  for (const [c, v] of cnt) {
    const key = (((c >> 16) & 255) >> 2) * 4096 + (((c >> 8) & 255) >> 2) * 64 + ((c & 255) >> 2);
    if (!bins.has(key)) bins.set(key, [0, 0, 0, 0]);
    const b = bins.get(key);
    b[0] += ((c >> 16) & 255) * v; b[1] += ((c >> 8) & 255) * v; b[2] += (c & 255) * v; b[3] += v;
  }
  const items = [];
  for (const b of bins.values()) {
    const rgb = (pyRound(b[0] / b[3]) << 16) | (pyRound(b[1] / b[3]) << 8) | pyRound(b[2] / b[3]);
    items.push([lab(rgb), b[3], rgb]);
  }
  let cents = kmeans(items, ncol);
  const proche = (l) => { let bc = cents[0], bv = Infinity; for (const c of cents) { const v = dist3(l, c); if (v < bv) { bv = v; bc = c; } } return bc; };
  const out = items.filter((it) => dist3(it[0], proche(it[0])) > 16);
  if (out.length) cents = cents.concat(kmeans(out, Math.min(4, out.length)));
  const idx = (l) => { let j = 0, bv = Infinity; cents.forEach((c, i) => { const v = dist3(l, c); if (v < bv) { bv = v; j = i; } }); return j; };
  const groups = new Map();
  for (const [l, wgt, rgb] of items) {
    const j = idx(l);
    if (!groups.has(j)) groups.set(j, [0, 0, 0, 0]);
    const g = groups.get(j);
    g[0] += ((rgb >> 16) & 255) * wgt; g[1] += ((rgb >> 8) & 255) * wgt; g[2] += (rgb & 255) * wgt; g[3] += wgt;
  }
  const colj = new Map([...groups].map(([j, g]) => [j, (pyRound(g[0] / g[3]) << 16) | (pyRound(g[1] / g[3]) << 8) | pyRound(g[2] / g[3])]));
  const remap = new Map();
  for (const c of cnt.keys()) {
    const l = lab(c);
    let bj = null, bv = Infinity;
    for (const j of colj.keys()) { const v = dist3(l, cents[j]); if (v < bv) { bv = v; bj = j; } }
    remap.set(c, colj.get(bj));
  }
  return remap;
}
async function reduirePeint(im, echelle) {   // recadrage, réduction Lanczos (alpha prémultiplié)
  const b = boite(im, 24);
  if (b) im = rogner(im, b);
  const w = Math.max(1, pyRound(im.width * echelle)), h = Math.max(1, pyRound(im.height * echelle));
  const { data } = await chargerSharp()(Buffer.from(im.data.buffer, im.data.byteOffset, im.data.length), {
    raw: { width: im.width, height: im.height, channels: 4 },
  }).resize(w, h, { kernel: 'lanczos3', fit: 'fill' }).raw().toBuffer({ resolveWithObject: true });
  return { width: w, height: h, data: new Uint8Array(data.buffer, data.byteOffset, data.length), crop: b };
}
function appliquerPalette(small, remap) {
  const out = nouvelle(small.width, small.height);
  for (let p = 0; p < small.width * small.height; p++) {
    if (small.data[p * 4 + 3] < 128) continue;
    const c = remap.get(rgbInt(small.data, p * 4));
    out.data.set([(c >> 16) & 255, (c >> 8) & 255, c & 255, 255], p * 4);
  }
  return out;
}

// ------------------------------------------------------------ facteur pixel-fixer
// Calage de la grille de f px : décalage (pas de 0,5 px) qui rend chaque case la plus uniforme
function phaseGrille(im, f, pas = 0.5) {
  const w = im.width, h = im.height, d = im.data;
  const dd = Math.max(1, Math.trunc(0.3 * f));
  const px = (x, y) => (y * w + x) * 4;
  const eq = (a, b) => d[a] === d[b] && d[a + 1] === d[b + 1] && d[a + 2] === d[b + 2] && d[a + 3] === d[b + 3];
  let best = [0.0, 0.0], bv = -1;
  const steps = [];
  for (let i = 0; i <= Math.trunc(f / pas); i++) if (i * pas < f) steps.push(i * pas);
  for (const ox of steps) {
    for (const oy of steps) {
      let v = 0;
      for (let y = oy + f / 2; y < h - dd; y += f) {
        for (let x = ox + f / 2; x < w - dd; x += f) {
          const cx = Math.trunc(x), cy = Math.trunc(y), c = px(cx, cy);
          if (d[c + 3] >= 128) v += eq(px(cx - dd, cy), c) + eq(px(cx + dd, cy), c) + eq(px(cx, cy - dd), c) + eq(px(cx, cy + dd), c);
        }
      }
      if (v > bv) { best = [ox, oy]; bv = v; }
    }
  }
  return best;
}
// 1 case de f px = 1 pixel (couleur du centre de la case) : résolution NATIVE, couleurs gardées
function echantillonner(im, f, phase) {
  const [ox, oy] = phase;
  const w = im.width, h = im.height;
  const nw = Math.floor((w - ox) / f), nh = Math.floor((h - oy) / f);
  const out = nouvelle(nw, nh);
  for (let j = 0; j < nh; j++) {
    for (let i = 0; i < nw; i++) {
      const s = (Math.min(h - 1, Math.trunc(oy + (j + 0.5) * f)) * w + Math.min(w - 1, Math.trunc(ox + (i + 0.5) * f))) * 4;
      if (im.data[s + 3] >= 128) out.data.set([im.data[s], im.data[s + 1], im.data[s + 2], 255], (j * nw + i) * 4);
    }
  }
  return out;
}

// Où tombe chaque pixel natif dans l'image du jeu : colonne native = floor((x + 0,5 - gx) / f).
// Départ : la phase trouvée ; puis affinage au 1/50e de px (les blocs de pixelfix.js sont arrondis
// au px près) en comptant les pixels de l'image du jeu qui ont la couleur de leur pixel natif.
function accord(hd, nat, fx, fy, gx, gy) {
  let ok = 0, tot = 0;
  for (let y = 0; y < hd.height; y++) {
    const j = Math.floor((y + 0.5 - gy) / fy);
    for (let x = 0; x < hd.width; x++) {
      const s = (y * hd.width + x) * 4, a = hd.data[s + 3] >= 128;
      const i = Math.floor((x + 0.5 - gx) / fx);
      const dansN = i >= 0 && j >= 0 && i < nat.width && j < nat.height;
      const t = dansN ? (j * nat.width + i) * 4 : -1;
      const b = dansN && nat.data[t + 3] >= 128;
      if (!a && !b) continue;
      tot++;
      if (a && b && hd.data[s] === nat.data[t] && hd.data[s + 1] === nat.data[t + 1] && hd.data[s + 2] === nat.data[t + 2]) ok++;
    }
  }
  return tot ? ok / tot : 0;
}
// Les bords de blocs de pixelfix.js tombent en round(g + i p) ; le pas réel p peut s'écarter un peu
// du `f` du registre (3,782 pour 3,76 sur la marche d'Agarica : 1,5 px d'écart sur la largeur). On
// cherche p (au 1/1000e) et g (au 1/100e) qui expliquent le plus de changements de couleur, axe
// par axe, puis on numérote les blocs comme l'échantillonnage (centre de la case native 0 = bloc 0).
function calerAxe(hd, f, centre0, vertical) {
  const W = hd.width, H = hd.height, d = hd.data, n = vertical ? H : W;
  const chg = new Float64Array(n);
  const cle = (x, y) => { const i = (y * W + x) * 4; return d[i + 3] < 128 ? -1 : rgbInt(d, i); };
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (vertical ? y === 0 : x === 0) continue;
      if (cle(x, y) !== (vertical ? cle(x, y - 1) : cle(x - 1, y))) chg[vertical ? y : x]++;
    }
  }
  let best = [], bv = -1;
  for (let kp = -40; kp <= 40; kp++) {
    const p = Math.round((f + kp * 0.001) * 1000) / 1000;
    for (let k = 0; k * 0.01 < p; k++) {
      const g = k * 0.01;
      let v = 0;
      for (let i = -1; g + i * p < n + 1; i++) {
        const b = Math.round(g + i * p);
        if (b > 0 && b < n) v += chg[b];
      }
      if (v > bv) { bv = v; best = [[p, g]]; } else if (v === bv) best.push([p, g]);
    }
  }
  const [p, g] = best[Math.floor(best.length / 2)];   // milieu du plateau
  return { p, g: g + Math.floor((centre0 + 0.5 - g) / p) * p };
}
function calerGrille(hd, nat, f, gx, gy) {
  if (f === 1) return { fx: 1, fy: 1, gx, gy, accord: accord(hd, nat, 1, 1, gx, gy) };
  // centre de la case native (0, 0) dans l'image du jeu (cf. echantillonner)
  const ax = calerAxe(hd, f, Math.trunc(gx + 0.5 * f), false);
  const ay = calerAxe(hd, f, Math.trunc(gy + 0.5 * f), true);
  return { fx: ax.p, fy: ay.p, gx: ax.g, gy: ay.g, accord: accord(hd, nat, ax.p, ay.p, ax.g, ay.g) };
}

// ------------------------------------------------------------ animation
function meilleurDecalage(ca, cb, w, h, liste, r = 3) {
  let best = [0, 0], bv = -1;
  for (let dx = -r; dx <= r; dx++) {
    for (let dy = -r; dy <= r; dy++) {
      let v = 0;
      for (const p of liste) {
        const x = p % w + dx, y = ((p - p % w) / w) + dy;
        if (x >= 0 && y >= 0 && x < w && y < h && cb[y * w + x] === ca[p]) v++;
      }
      if (v > bv) { best = [dx, dy]; bv = v; }
    }
  }
  return best;
}
// Anti-clignotement : un pixel qui garde la même matière d'une frame à l'autre (après recalage du
// corps entier, qui monte et descend en marchant) prend la direction majoritaire sur sa frame et ses
// deux voisines (boucle).
function lisserTemps(codes, cols, keep, listes, w, h) {
  const n = codes.length, shifts = new Map();
  for (let i = 0; i < n; i++) {
    for (const j of [pyMod(i - 1, n), pyMod(i + 1, n)]) {
      if (!shifts.has(i * n + j)) shifts.set(i * n + j, meilleurDecalage(cols[i], cols[j], w, h, listes[i]));
    }
  }
  const aCote = (cds, j, x, y) => (x >= 0 && y >= 0 && x < w && y < h ? cds[y * w + x] : undefined);
  function taux(cds) {
    let diff = 0, tot = 0;
    for (let i = 0; i < n; i++) {
      const j = pyMod(i + 1, n), [dx, dy] = shifts.get(i * n + j);
      for (const p of listes[i]) {
        const x = p % w + dx, y = (p - p % w) / w + dy;
        if (keep[i][p] || aCote(cols[j], j, x, y) !== cols[i][p]) continue;
        tot++;
        diff += cds[i][p] !== cds[j][y * w + x];
      }
    }
    return diff / Math.max(1, tot);
  }
  const avant = taux(codes);
  const out = [];
  for (let i = 0; i < n; i++) {
    const nw = Int32Array.from(codes[i]);
    for (const p of listes[i]) {
      if (keep[i][p]) continue;
      const c = cols[i][p], votes = new Map([[codes[i][p], 1.0]]);
      for (const j of [pyMod(i - 1, n), pyMod(i + 1, n)]) {
        const [dx, dy] = shifts.get(i * n + j);
        for (const [ox, oy] of [[0, 0]].concat(N8)) {
          const x = p % w + dx + ox, y = (p - p % w) / w + dy + oy;
          if (aCote(cols[j], j, x, y) === c) compter(votes, codes[j][y * w + x], ox === 0 && oy === 0 ? 1.0 : 0.25);
        }
      }
      const [best, v] = plusFrequent(votes);
      if (v >= 2.0) nw[p] = best;
    }
    out.push(mergeSmall(nw, listes[i], w, h, 4, keep[i]));
  }
  return { codes: out, avant, apres: taux(out) };
}

// ------------------------------------------------------------ registre, manifeste
const relOf = (abs) => path.relative(ROOT, abs).split(path.sep).join('/');
function lireJs(file, nom) {
  if (!fs.existsSync(file)) return {};
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(`${fs.readFileSync(file, 'utf8')}\n;this.__r = ${nom};`, ctx, { filename: file });
  return JSON.parse(JSON.stringify(ctx.__r));
}
function ecrireManifeste(m) {
  // nouvelle version des images (BootScene la colle à chaque adresse, `?v=`) : le navigateur recharge
  // les cartes refaites au lieu de ressortir les anciennes de sa mémoire (comme tools/pixelfix.js)
  fs.writeFileSync(path.join(ROOT, 'src', 'data', 'asset_version.js'),
    `// GÉNÉRÉ (tools/pixelfix.js et autres outils d'images) -- ne pas modifier à la main.
const ASSET_VERSION = '${Date.now()}';
`);
  const keys = Object.keys(m).sort();
  const lines = keys.map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(m[k])},`);
  fs.writeFileSync(MANIFESTE, `// GÉNÉRÉ par tools/sections.js -- ne pas modifier à la main.
// Sprites préparés pour l'éclairage par sections (src/utils/LightKit.js) : clé = image du jeu ;
// \`d\` : dossier des cartes (<n>_neutre.png, <n>_n.png) ; \`w\`, \`h\` : taille native ;
// \`f\` : px de l'image du jeu par pixel natif ; \`gx\`, \`gy\` : coin de la grille native dans
// l'image du jeu ; \`W\`, \`H\` : taille de l'image du jeu ; \`v\` : empreinte de l'image du jeu.
const SECTIONS_LUMIERE = {
${lines.join('\n')}
};
`);
}
const empreinte = (file) => crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex').slice(0, 10);

// ------------------------------------------------------------ traitements
function sortiesDe(file) {
  const dir = path.join(path.dirname(file), DOSSIER), nom = path.basename(file, path.extname(file));
  const s = (suffixe) => path.join(dir, `${nom}_${suffixe}.png`);
  return { dir, nom, natif: s('natif'), neutre: s('neutre'), sections: s('sections'), n: s('n'), geo: s('geo'), apercu: s('apercu') };
}

function facteurDe(file, o, reg) {
  if (o.facteur !== undefined) return o.facteur;
  const e = reg[relOf(file)];
  return e ? e.f : 0;
}

async function ecrireCartes(nat, res, sorties, o) {
  const { neu, sec, nor } = saveMaps(nat.width, nat.height, res.opq, res.neutral, res.codes);
  await ecrirePng(nat, sorties.natif);
  await ecrirePng(neu, sorties.neutre);
  await ecrirePng(sec, sorties.sections);
  await ecrirePng(nor, sorties.n);
  await ecrirePng(geoDe(res.opq, nat.width, nat.height), sorties.geo);
  if (o.gauche) {
    await ecrirePng(miroir(neu, false), sorties.neutre.replace(/_neutre\.png$/, '_neutre-gauche.png'));
    await ecrirePng(miroir(nor, true), sorties.n.replace(/_n\.png$/, '_n-gauche.png'));
  }
  return { o: nat, neu, sec, nor };
}

function afficherInfo(info) {
  console.log('  rampes (couleur neutre <- couleurs) : ' + info.ramps.map(([b, r]) => `${b} <- ${r.join(' ')}`).join(' | '));
  console.log(`  lignes gardées : ${info.lines.join(' ')} ; détails gardés : ${info.protected.join(' ') || '-'} ; parties : ${info.parts}`);
}

// un sprite seul
async function unSprite(file, o, reg, man) {
  const hd = await lirePng(file);
  const f = facteurDe(file, o, reg);
  const s = sortiesDe(file);
  let nat, grille;
  if (o.echelleJeu > 0) {
    const small = await reduirePeint(hd, o.echelleJeu);
    const opq = [];
    for (let p = 0; p < small.width * small.height; p++) if (small.data[p * 4 + 3] >= 128) opq.push(rgbInt(small.data, p * 4));
    nat = appliquerPalette(small, paletteLab(opq, o.couleurs));
    const b = boite(nat, 1);
    nat = rogner(nat, b);
    const k = 1 / o.echelleJeu;
    grille = { f: k, fx: k, fy: k, gx: small.crop[0] + b[0] * k, gy: small.crop[1] + b[1] * k, accord: null };
  } else if (f > 0) {
    const ph = phaseGrille(hd, f);
    nat = echantillonner(hd, f, ph);
    const b = boite(nat, 1);
    nat = rogner(nat, b);
    grille = calerGrille(hd, nat, f, ph[0] + b[0] * f, ph[1] + b[1] * f);
    grille.f = f;
  } else {
    nat = hd;
    grille = { f: 1, fx: 1, fy: 1, gx: 0, gy: 0, accord: 1 };
  }
  const res = analyse(nat, o.garder, o.rampes, o.echelleJeu > 0, null);
  const c = await ecrireCartes(nat, res, s, o);
  if (o.apercu) await ecrirePng(planche([c]), s.apercu);
  console.log(`${relOf(file)} : natif ${nat.width}x${nat.height}, 1 pixel = ${grille.f} px (pas mesuré ${grille.fx.toFixed(3)} x ${grille.fy.toFixed(3)})` +
    (grille.accord !== null ? `, grille calée à ${(100 * grille.accord).toFixed(2)} %` : '') + ` -> ${relOf(s.dir)}/${s.nom}_*.png`);
  afficherInfo(res.info);
  man[relOf(file)] = entree(file, hd, nat, grille, s);
}

function entree(file, hd, nat, g, s, extra) {
  const r2 = (v) => Math.round(v * 100) / 100;
  return Object.assign({ d: relOf(s.dir), n: s.nom, w: nat.width, h: nat.height, f: g.f, fx: Math.round(g.fx * 1000) / 1000, fy: Math.round(g.fy * 1000) / 1000, gx: r2(g.gx), gy: r2(g.gy),
    W: hd.width, H: hd.height, v: empreinte(file) }, extra || {});
}

// une animation : toutes les frames ENSEMBLE (même toile calée en bas au centre, même grille, mêmes
// matières via une mosaïque, lissage dans le temps)
async function uneAnimation(files, o, reg, man) {
  const hds = [];
  for (const f of files) hds.push(await lirePng(f));
  const fs_ = [...new Set(files.map((f) => facteurDe(f, o, reg)))];
  if (fs_.length > 1) throw new Error(`frames à facteurs différents (${fs_.join(', ')}) : ce ne sont pas les frames d'un même lot pixelfix`);
  const f = fs_[0];
  const W = Math.max(...hds.map((i) => i.width)), H = Math.max(...hds.map((i) => i.height));
  const decal = hds.map((i) => [Math.floor((W - i.width) / 2), H - i.height]);
  let canv = hds.map((i, k) => { const c = nouvelle(W, H); coller(c, i, decal[k][0], decal[k][1]); return c; });
  let ph = [0, 0], k = 1, peint = false, cropPeint = null;
  if (o.echelleJeu > 0) {
    peint = true;
  } else if (f > 0) {
    ph = phaseGrille(canv[0], f);
    canv = canv.map((c) => echantillonner(c, f, ph));
    k = f;
  }
  const boxes = canv.map((c) => boite(c, 24)).filter(Boolean);
  const box = [Math.min(...boxes.map((b) => b[0])), Math.min(...boxes.map((b) => b[1])), Math.max(...boxes.map((b) => b[2])), Math.max(...boxes.map((b) => b[3]))];
  canv = canv.map((c) => rogner(c, box));
  if (peint) {
    const w = Math.max(1, pyRound(canv[0].width * o.echelleJeu)), h = Math.max(1, pyRound(canv[0].height * o.echelleJeu));
    const small = [];
    for (const c of canv) {
      const { data } = await chargerSharp()(Buffer.from(c.data.buffer, c.data.byteOffset, c.data.length), { raw: { width: c.width, height: c.height, channels: 4 } })
        .resize(w, h, { kernel: 'lanczos3', fit: 'fill' }).raw().toBuffer({ resolveWithObject: true });
      small.push({ width: w, height: h, data: new Uint8Array(data.buffer, data.byteOffset, data.length) });
    }
    const allc = [];
    for (const im of small) for (let p = 0; p < w * h; p++) if (im.data[p * 4 + 3] >= 128) allc.push(rgbInt(im.data, p * 4));
    const remap = paletteLab(allc, o.couleurs);
    canv = small.map((im) => appliquerPalette(im, remap));
    k = 1 / o.echelleJeu;
    cropPeint = box;
  }
  const w = canv[0].width, h = canv[0].height, gap = 24;
  const mosa = nouvelle(canv.length * (w + gap) - gap, h);
  canv.forEach((c, i) => coller(mosa, c, i * (w + gap), 0));
  const res = analyse(mosa, o.garder, o.rampes, peint, [w, h]);
  const MW = mosa.width;
  const fc = [], fn = [], fcol = [], fkeep = [], listes = [];
  const mat = new Map();
  res.info.ramps.forEach(([, cs], idx) => cs.forEach((c) => mat.set(parseInt(c, 16), idx)));
  canv.forEach((c, i) => {
    const x0 = i * (w + gap);
    const cd = new Int32Array(w * h).fill(-1), nd = new Int32Array(w * h).fill(-1), cl = new Int32Array(w * h).fill(-1), kp = new Uint8Array(w * h);
    const liste = [];   // ordre du dict Python de la frame = ordre du set de la mosaïque
    for (const P of res.opqList) {
      const X = P % MW, y = (P - X) / MW, x = X - x0;
      if (x < 0 || x >= w) continue;
      {
        const p = y * w + x;
        liste.push(p);
        cd[p] = res.codes[P]; nd[p] = res.neutral[P];
        const col = rgbInt(mosa.data, P * 4);
        cl[p] = mat.has(col) ? mat.get(col) : 1000 + col;   // matière (rampe) ; lignes et détails : leur couleur
        kp[p] = res.info.outline[P];
      }
    }
    fc.push(cd); fn.push(nd); fcol.push(cl); fkeep.push(kp); listes.push(liste);
  });
  let r = lisserTemps(fc, fcol, fkeep, listes, w, h);
  const avant = r.avant;
  for (let it = 0; it < 3; it++) r = lisserTemps(r.codes, fcol, fkeep, listes, w, h);
  const opqF = listes.map((l) => { const m = new Uint8Array(w * h); for (const p of l) m[p] = 1; return m; });
  const codesF = r.codes.map((c, i) => heriterBord(c, opqF[i], w, h));
  const cols = [];
  let grille = null;
  for (let i = 0; i < files.length; i++) {
    const s = sortiesDe(files[i]);
    const c = await ecrireCartes(canv[i], { opq: opqF[i], neutral: fn[i], codes: codesF[i] }, s, o);
    cols.push(c);
    if (!grille) {
      if (peint) grille = { fx: k, fy: k, gx: cropPeint[0] - decal[i][0], gy: cropPeint[1] - decal[i][1], accord: null };
      else grille = calerGrille(hds[i], canv[i], k, ph[0] + box[0] * k - decal[i][0], ph[1] + box[1] * k - decal[i][1]);
      grille.f = Math.round(k * 1000) / 1000;
    }
    // même grille pour tout le lot (pixelfix.js : grille ancrée au bas-centre, commune au lot)
    const g = { f: grille.f, fx: grille.fx, fy: grille.fy, gx: grille.gx + decal[0][0] - decal[i][0], gy: grille.gy + decal[0][1] - decal[i][1] };
    g.accord = peint ? null : accord(hds[i], canv[i], g.fx, g.fy, g.gx, g.gy);
    man[relOf(files[i])] = entree(files[i], hds[i], canv[i], g, s, { anim: o.nomAnim || sortiesDe(files[0]).nom.replace(/_?\d+$/, ''), i, fps: o.fps, vitesse: o.vitesse });
    console.log(`  ${relOf(files[i])} -> ${relOf(s.dir)}/${s.nom}_*.png` + (g.accord !== null ? ` (grille calée à ${(100 * g.accord).toFixed(2)} %)` : ''));
  }
  if (o.apercu) await ecrirePng(planche(cols), path.join(sortiesDe(files[0]).dir, `${o.nomAnim || sortiesDe(files[0]).nom.replace(/_?\d+$/, '')}_planche.png`));
  console.log(`${files.length} frames ${w}x${h} natives, 1 pixel = ${grille.f} px`);
  afficherInfo(res.info);
  console.log(`  orientation qui change sans que la matière change (frame suivante) : ${(100 * avant).toFixed(1)} % -> ${(100 * r.apres).toFixed(1)} % après lissage`);
}

async function depuisSections(file, man) {
  const s = sortiesDe(file);
  if (!fs.existsSync(s.sections)) throw new Error(`${relOf(s.sections)} absent : lancer d'abord node tools/sections.js ${relOf(file)}`);
  const { nor, lues } = normalesDepuisSections(await lirePng(s.sections));
  await ecrirePng(nor, s.n);
  console.log(`${relOf(s.n)} recalculée ; sections lues : ${[...lues].sort().join(', ')}`);
  if (man[relOf(file)]) man[relOf(file)].v = empreinte(file);
}

function verifier(man) {
  let n = 0;
  for (const [k, e] of Object.entries(man)) {
    const abs = path.join(ROOT, k);
    const manque = ['neutre', 'n'].filter((x) => !fs.existsSync(path.join(ROOT, e.d, `${e.n}_${x}.png`)));
    if (!fs.existsSync(abs)) { console.log(`${k} : image du jeu absente`); n++; } else if (empreinte(abs) !== e.v) { console.log(`${k} : image changée depuis les cartes -> relancer tools/sections.js`); n++; } else if (manque.length) { console.log(`${k} : cartes manquantes (${manque.join(', ')})`); n++; }
  }
  console.log(n ? `${n} sprite(s) à refaire` : `${Object.keys(man).length} sprite(s) à jour`);
  return n ? 1 : 0;
}

// ------------------------------------------------------------ arguments
function parseArgs(argv) {
  const a = { inputs: [], o: { garder: [], rampes: [], fps: 12, vitesse: 0, couleurs: 32, echelleJeu: 0 } };
  const num = (v, name) => {
    const n = Number(String(v).replace(',', '.'));
    if (!Number.isFinite(n) || n < 0) throw new Error(`nombre invalide pour ${name} : ${v}`);
    return n;
  };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    const next = () => { if (i + 1 >= argv.length) throw new Error(`valeur manquante pour ${t}`); return argv[++i]; };
    if (t === '--animation') a.o.animation = true;
    else if (t === '--depuis-sections') a.o.depuisSections = true;
    else if (t === '--facteur') a.o.facteur = num(next(), t);
    else if (t === '--echelle-jeu') a.o.echelleJeu = num(next(), t);
    else if (t === '--couleurs') a.o.couleurs = Math.round(num(next(), t));
    else if (t === '--garder') a.o.garder = next().split(',').filter((g) => g.trim());
    else if (t === '--rampes') a.o.rampes = next().split(';').filter((g) => g.trim());
    else if (t === '--fps') a.o.fps = num(next(), t);
    else if (t === '--vitesse') a.o.vitesse = num(next(), t);
    else if (t === '--nom') a.o.nomAnim = next();
    else if (t === '--apercu') a.o.apercu = true;
    else if (t === '--gauche') a.o.gauche = true;
    else if (t === '--sans-manifeste') a.o.sansManifeste = true;
    else if (t.startsWith('--')) throw new Error(`option inconnue : ${t}`);
    else a.inputs.push(t);
  }
  return a;
}
// ordre naturel (frame_2 avant frame_10), comme les clés numérotées du jeu
const naturel = (a, b) => a.localeCompare(b, 'en', { numeric: true });
function pngsDe(inp) {
  const abs = path.resolve(inp);
  if (!fs.existsSync(abs)) throw new Error(`introuvable : ${inp}`);
  if (!fs.statSync(abs).isDirectory()) return [abs];
  return fs.readdirSync(abs).filter((n) => /\.png$/i.test(n) && !n.startsWith('_') && !n.startsWith('.')).sort(naturel).map((n) => path.join(abs, n));
}

async function main() {
  const argv = process.argv.slice(2);
  if (!argv.length || argv[0] === '-h' || argv[0] === '--help') {
    console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0].replace(/^[\s\S]*?\/\*\n?/, '').replace(/^ \* ?/gm, ''));
    return argv.length ? 0 : 2;
  }
  if (argv[0] === 'verifier') return verifier(lireJs(MANIFESTE, 'SECTIONS_LUMIERE'));
  let a;
  try { a = parseArgs(argv); } catch (e) { console.error(`Erreur : ${e.message}`); return 2; }
  const reg = lireJs(REGISTRY, 'PIXEL_FIXED');
  const man = lireJs(MANIFESTE, 'SECTIONS_LUMIERE');
  let echecs = 0;
  try {
    const files = a.inputs.flatMap(pngsDe);
    if (!files.length) throw new Error('aucune image PNG');
    if (a.o.depuisSections) for (const f of files) await depuisSections(f, man);
    else if (a.o.animation) await uneAnimation(files, a.o, reg, man);
    else {
      for (const f of files) {
        try { await unSprite(f, a.o, reg, man); } catch (e) { echecs++; console.error(`${relOf(f)} : ECHEC : ${e.message}`); }
      }
    }
  } catch (e) {
    console.error(`Erreur : ${e.message}`);
    return 1;
  }
  if (!a.o.sansManifeste) { ecrireManifeste(man); console.log(`manifeste : ${relOf(MANIFESTE)}`); }
  return echecs ? 1 : 0;
}

if (require.main === module) main().then((code) => { process.exitCode = code; });
module.exports = { analyse, flouGaussien, phaseGrille, echantillonner, SECTIONS, lirePng, ecrirePng };
