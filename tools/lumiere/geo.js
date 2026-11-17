'use strict';
/*
 * Géométrie de silhouette pour l'éclairage par sections (contre-jour, lampe cachée).
 * Port de `geometrie()` de sections.py (skill pixel-art-forge). Écrite par tools/sections.js
 * dans _lumiere/<nom>_geo.png, lue par le shader de src/utils/LightKit.js (lampe cachée par la
 * silhouette, profondeur depuis le bord) et par la page d'aperçu (npm run lumiere:apercu).
 *
 * Entrée : masque d'opacité d'un sprite NATIF (1 = alpha >= 128), largeur w, hauteur h.
 * Sortie : image RGBA (w + 2 pad) x (h + 2 pad), valeurs x 16 plafonnées à 15 :
 *   R = profondeur depuis le bord EXTÉRIEUR réel (1 = pixel le plus extérieur),
 *   G = épaisseur locale, B = distance au sprite pour les pixels du fond (halo).
 * Bord extérieur réel : silhouette fermée d'1 px (les fentes de 1-2 px entre visage et cheveux,
 * bras et corps ne sont pas du fond), puis remplissage depuis le bord de l'image ; trous
 * enfermés de moins de `trouMin` px = intérieur.
 */
const GEO_PAD = 10;       // marge autour du sprite (distance de la lampe à la silhouette)
const GEO_TROU_MIN = 12;  // trou transparent enfermé : extérieur seulement à partir de 12 px
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const N8 = N4.concat([[1, 1], [1, -1], [-1, 1], [-1, -1]]);

// filtre de rang 3x3 (Pillow MaxFilter / MinFilter : bords recopiés)
function rang3(src, W, H, max) {
  const out = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let v = max ? 0 : 255;
      for (let dy = -1; dy <= 1; dy++) {
        const Y = Math.min(H - 1, Math.max(0, y + dy));
        for (let dx = -1; dx <= 1; dx++) {
          const X = Math.min(W - 1, Math.max(0, x + dx));
          const s = src[Y * W + X];
          v = max ? Math.max(v, s) : Math.min(v, s);
        }
      }
      out[y * W + x] = v;
    }
  }
  return out;
}

function geometrie(masque, w, h, pad, trouMin) {
  if (pad === undefined) pad = GEO_PAD;
  if (trouMin === undefined) trouMin = GEO_TROU_MIN;
  const W = w + 2 * pad, H = h + 2 * pad, N = W * H;
  const om = new Uint8Array(N);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (masque[y * w + x]) om[(y + pad) * W + x + pad] = 255;
  const cm = rang3(rang3(om, W, H, true), W, H, false);
  const ext = new Uint8Array(N);
  let q = [];
  const graine = (x, y) => { const i = y * W + x; if (cm[i] === 0 && !ext[i]) { ext[i] = 1; q.push(i); } };
  for (let x = 0; x < W; x++) { graine(x, 0); graine(x, H - 1); }
  for (let y = 0; y < H; y++) { graine(0, y); graine(W - 1, y); }
  for (let k = 0; k < q.length; k++) {
    const x = q[k] % W, y = (q[k] / W) | 0;
    for (const [dx, dy] of N4) {
      const X = x + dx, Y = y + dy;
      if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
      const i = Y * W + X;
      if (!ext[i] && cm[i] === 0) { ext[i] = 1; q.push(i); }
    }
  }
  // grands trous enfermés (vrais espaces) : extérieur aussi
  const vu = new Uint8Array(N);
  for (let i0 = 0; i0 < N; i0++) {
    if (om[i0] !== 0 || ext[i0] || vu[i0] || cm[i0] !== 0) continue;
    const comp = [i0];
    vu[i0] = 1;
    for (let k = 0; k < comp.length; k++) {
      const x = comp[k] % W, y = (comp[k] / W) | 0;
      for (const [dx, dy] of N4) {
        const X = x + dx, Y = y + dy;
        if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
        const i = Y * W + X;
        if (!vu[i] && cm[i] === 0 && !ext[i]) { vu[i] = 1; comp.push(i); }
      }
    }
    if (comp.length >= trouMin) for (const i of comp) ext[i] = 1;
  }
  // distances 8-voisins : D = profondeur depuis l'extérieur, O = distance au sprite (fond)
  const INF = 99;
  function distance(depart) {
    const d = new Int32Array(N).fill(INF);
    const f = [];
    for (let i = 0; i < N; i++) if (depart(i)) { d[i] = 0; f.push(i); }
    for (let k = 0; k < f.length; k++) {
      const x = f[k] % W, y = (f[k] / W) | 0, v = d[f[k]] + 1;
      for (const [dx, dy] of N8) {
        const X = x + dx, Y = y + dy;
        if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
        const i = Y * W + X;
        if (d[i] > v) { d[i] = v; f.push(i); }
      }
    }
    return d;
  }
  const D = distance((i) => ext[i] === 1);
  const O = distance((i) => ext[i] === 0);
  const out = new Uint8Array(N * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const d = om[i] ? D[i] : 0;
      let th = 0;
      if (om[i]) {
        let mx = -1;
        for (let Y = Math.max(0, y - 1); Y < Math.min(H, y + 2); Y++) {
          for (let X = Math.max(0, x - 1); X < Math.min(W, x + 2); X++) if (om[Y * W + X]) mx = Math.max(mx, D[Y * W + X]);
        }
        th = 2 * mx - 1;
      }
      out[i * 4] = Math.min(d, 15) * 16;
      out[i * 4 + 1] = Math.min(th, 15) * 16;
      out[i * 4 + 2] = Math.min(O[i], 15) * 16;
      out[i * 4 + 3] = 255;
    }
  }
  return { width: W, height: H, pad, data: out };
}

module.exports = { GEO_PAD, GEO_TROU_MIN, geometrie };
