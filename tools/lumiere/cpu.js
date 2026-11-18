'use strict';
/*
 * Fonction d'éclairage du shader de src/utils/LightKit.js, en JavaScript (CPU), pour la
 * batterie `npm run lumiere:tests` (sans navigateur). Écrite LIGNE À LIGNE comme le GLSL, avec
 * des aides qui portent les noms GLSL (smoothstep, mix, dot, length, normalize, clamp, max, min,
 * abs, vec2, vec3) et les mêmes nombres écrits en clair : le test « alignement GLSL <-> CPU »
 * compare la suite des appels et des nombres de eclairage() ici et dans LightKit.FRAG_ECLAIRAGE.
 * Les uniforms du shader sont lus dans U ({ uPaliers, uContre }).
 * Vecteurs : objets { x, y, z } (comme en GLSL, sans indices numériques qui fausseraient la
 * comparaison des nombres). Repère : x droite, y HAUT (normales), positions t / lp en px natifs
 * avec y vers le bas, comme dans la page de test.
 */

const vec2 = (x, y) => ({ x, y, z: 0 });
const vec3 = (x, y, z) => ({ x, y, z });
const xy = (v) => vec2(v.x, v.y);
const isV = (v) => typeof v === 'object';
const div = (v, k) => vec3(v.x / k, v.y / k, v.z / k);
const rg = (c) => vec2(c.r, c.g);
const mul = (v, k) => vec2(v.x * k, v.y * k);
const sub = (v, k) => vec2(v.x - k, v.y - k);
const max = Math.max, min = Math.min, abs = Math.abs, sqrt = Math.sqrt, floor = Math.floor, exp = Math.exp;
const clamp = (x, a, b) => min(max(x, a), b);
function smoothstep(a, b, x) { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
function mix(a, b, t) {
  return isV(a) ? vec3(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, (a.z || 0) + ((b.z || 0) - (a.z || 0)) * t) : a + (b - a) * t;
}
const dot = (a, b) => a.x * b.x + a.y * b.y + (a.z || 0) * (b.z || 0);
const length = (v) => sqrt(dot(v, v));
const normalize = (v) => div(v, length(v));

function palier(v, U) {
  if (U.uPaliers < 1.5) return v;
  return min(floor(v * U.uPaliers), U.uPaliers - 1.0) / (U.uPaliers - 1.0);
}

// eclairage() du shader (v16). t, lp : vec2 ; n, nLisse : vec3 normalisés ; cjm : carte
// contre-jour du pixel { r, g, b } (0-1 : direction du bord exposé, exposition).
function eclairage(n, nLisse, t, lp, z, portee, lumBase, cjm, U) {
  const wb = smoothstep(15.0, -15.0, z);
  let ne = n;
  if (wb > 0.0) ne = normalize(mix(n, nLisse, wb));
  const d = vec3(lp.x - t.x, t.y - lp.y, z);
  const dist = max(length(d), 0.001);
  const att = clamp(1.0 - (dist * dist) / (portee * portee), 0.0, 1.0);
  const w = 0.5 * wb;
  const ex = cjm.b;
  const diff = max((dot(ne, div(d, dist)) + w) / (1.0 + w), 0.0) * att * mix(1.0, ex, wb);
  if (lumBase < 0.16) return min(diff, U.uPaliers < 1.5 ? 0.34 : 1.0 / (U.uPaliers - 1.0));
  const dir = sub(mul(rg(cjm), 2.0), 1.0);
  if (U.uFlip > 0.5) dir.x = -dir.x;
  const cb = (0.37 * dot(dir, xy(d)) + 0.93 * abs(z)) / dist;
  const cj = 0.6 * U.uContre * wb * ex * max(cb, 0.0) * att;
  return min(diff + cj, 1.0);
}

// ambianceHemi() du shader : ciel pour les plans tournés vers le haut, sol pour ceux tournés vers le bas
function ambianceHemi(n, U) {
  return mix(U.uSol, U.uCiel, 0.5 + 0.5 * n.y);
}

// epaule() du shader : hautes lumières tassées vers le blanc sans l'atteindre
function epaule(v, U) {
  if (v <= U.uEpaule || U.uEpaule >= 1.0) return v;
  const e = 1.0 - U.uEpaule;
  return U.uEpaule + e * (1.0 - exp((U.uEpaule - v) / e));
}

// directionnel() du shader : soleil, même direction d pour tous les pixels (aucune position, aucune portée)
function directionnel(n, d, lumBase, U) {
  const diff = max(dot(n, d), 0.0);
  if (lumBase < 0.16) return min(diff, U.uPaliers < 1.5 ? 0.34 : 1.0 / (U.uPaliers - 1.0));
  return diff;
}

// Référence « lumière de face » : Light2D de Phaser avec la lampe à la profondeur z, N.L x att.
function reference(n, t, lp, z, portee) {
  const d = vec3(lp.x - t.x, t.y - lp.y, z);
  const dist = max(length(d), 0.001);
  const att = clamp(1.0 - (dist * dist) / (portee * portee), 0.0, 1.0);
  return max(dot(n, div(d, dist)), 0.0) * att;
}

// Sprite pour la batterie : normales (normalisées comme dans le shader), normale lissée 5x5
// (normaleLisse()), luminance de la couleur de base, carte contre-jour (CJ ; sans carte :
// exposition 0) et normale brute (sections). carte = { w, h, n, neutre, cj? } (RGBA).
// pas : écart entre les 5 x 5 échantillons de la normale lissée (round(s) d'un grand sprite, 1 sinon)
function sprite(carte, pas = 1) {
  const { w, h } = carte;
  const N = new Map(), lum = new Map(), NL = new Map(), brute = new Map(), CJ = new Map();
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (carte.n[i + 3] < 128) continue;
      const p = y * w + x;
      const r = vec3(carte.n[i] / 255 * 2 - 1, carte.n[i + 1] / 255 * 2 - 1, carte.n[i + 2] / 255 * 2 - 1);
      brute.set(p, r);
      N.set(p, normalize(r));
      const b = carte.neutre;
      lum.set(p, (0.3 * b[i] + 0.59 * b[i + 1] + 0.11 * b[i + 2]) / 255);
      const c = carte.cj;
      CJ.set(p, c ? { r: c[i] / 255, g: c[i + 1] / 255, b: c[i + 2] / 255 } : { r: 0.5, g: 0.5, b: 0 });
    }
  }
  for (const p of N.keys()) {
    const x = p % w, y = (p - x) / w;
    let acc = vec3(0, 0, 0);
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const X = x + dx * pas, Y = y + dy * pas;
        if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
        const q = brute.get(Y * w + X);
        if (q) acc = vec3(acc.x + q.x, acc.y + q.y, acc.z + q.z);
      }
    }
    NL.set(p, length(acc) > 0.001 ? normalize(acc) : vec3(0, 0, 1));
  }
  return { w, h, N, NL, lum, CJ, brute };
}

module.exports = { ambianceHemi, epaule, directionnel, eclairage, palier, reference, sprite, vec2, vec3, normalize, smoothstep };
