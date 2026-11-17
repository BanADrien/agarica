#!/usr/bin/env node
'use strict';
/*
 * Batterie de cohérence de l'éclairage par sections, SANS navigateur : `npm run lumiere:tests`.
 * Calcule la lumière avec la version CPU du shader (tools/lumiere/cpu.js) sur les vraies cartes
 * du jeu (src/data/sections.js) et une demi-sphère synthétique. Mêmes tests et mêmes seuils que
 * la batterie de référence du skill pixel-art-forge (v15). Intensité AVANT paliers sauf mention.
 * Plus deux contrôles de code : le shader du jeu (src/utils/LightKit.js) est bien celui de la
 * page validée (tools/lumiere/apercu.html), et la version CPU suit le même calcul que le GLSL.
 * Sortie : tableau Markdown ; code 0 si tout passe, 1 sinon.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const CPU = require('./cpu.js');
const { lirePng } = require('./png.js');
const LightKit = require('../../src/utils/LightKit.js');

const ROOT = path.resolve(__dirname, '..', '..');
const PAL = 4, CONTRE = 1.5;
const U = { uPaliers: PAL, uContre: CONTRE };
const { vec2 } = CPU;

// sprites de la batterie : image du jeu (clé du manifeste)
const SPRITES = [
  ['Agarica f0', 'assets/sprites/agarica_walk_frames/agarica_walk_0.png'],
  ['Agarica f3', 'assets/sprites/agarica_walk_frames/agarica_walk_3.png'],
  ['crapaud', 'assets/sprites/crapaud_frames/crapaud_row0_0.png'],
  ['loup', 'assets/sprites/loup_frames/loup_row0_0.png'],
  ['grizzly', 'assets/sprites/grizzly_frames/grizzly_row0_0.png'],
];

function manifeste() {
  const f = path.join(ROOT, 'src', 'data', 'sections.js');
  if (!fs.existsSync(f)) return {};
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(`${fs.readFileSync(f, 'utf8')}\n;this.__r = SECTIONS_LUMIERE;`, ctx);
  return ctx.__r;
}

const palier = (v) => CPU.palier(v, U);

class Sprite {
  constructor(carte) {
    const s = CPU.sprite(carte);
    Object.assign(this, s);
    this.pts = [...s.N.keys()].map((p) => [p % s.w, Math.floor(p / s.w)]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    this.S = new Set(s.N.keys());
    const xs = this.pts.map((p) => p[0]), ys = this.pts.map((p) => p[1]);
    this.x0 = Math.min(...xs); this.x1 = Math.max(...xs); this.y0 = Math.min(...ys); this.y1 = Math.max(...ys);
  }
  id(p) { return p[1] * this.w + p[0]; }
  has(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h && this.S.has(y * this.w + x); }
  // occ (lampe cachée) : plus utilisé par eclairage() depuis la v15 -> 0
  e(p, lp, z, portee) {
    const i = this.id(p);
    return CPU.eclairage(this.N.get(i), this.NL.get(i), vec2(p[0] + 0.5, p[1] + 0.5), vec2(lp[0], lp[1]), z, portee, 0, this.lum.get(i), U);
  }
  lumP(p) { return this.lum.get(this.id(p)); }
  centre() { return [(this.x0 + this.x1) / 2 + 0.25, (this.y0 + this.y1) / 2 + 0.25]; }
}

function chargerSprite(url, man) {
  const e = man[url];
  if (!e) return null;
  const f = (q) => path.join(ROOT, e.d, `${e.n}_${q}.png`);
  if (!fs.existsSync(f('n')) || !fs.existsSync(f('neutre'))) return null;
  const n = lirePng(f('n')), neu = lirePng(f('neutre'));
  return new Sprite({ w: n.width, h: n.height, n: n.data, neutre: neu.data });
}

// demi-sphère analytique (normales continues), couleur moyenne
function demiSphere(r) {
  const w = 2 * r + 3, c = r + 1;
  const sp = Object.assign(Object.create(Sprite.prototype), { w, h: w, N: new Map(), NL: new Map(), lum: new Map() });
  for (let y = 0; y < w; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (x + 0.5 - c - 0.5) / r, dy = (y + 0.5 - c - 0.5) / r;
      if (dx * dx + dy * dy > 1) continue;
      sp.N.set(y * w + x, CPU.vec3(dx, -dy, Math.sqrt(Math.max(0, 1 - dx * dx - dy * dy))));
      sp.lum.set(y * w + x, 0.5);
    }
  }
  for (const p of sp.N.keys()) {
    const x = p % w, y = (p - x) / w;
    let a = CPU.vec3(0, 0, 0);
    for (let j = -2; j <= 2; j++) {
      for (let i = -2; i <= 2; i++) {
        const q = x + i >= 0 && x + i < w ? sp.N.get((y + j) * w + x + i) : null;
        if (q) a = CPU.vec3(a.x + q.x, a.y + q.y, a.z + q.z);
      }
    }
    sp.NL.set(p, CPU.normalize(a));
  }
  sp.pts = [...sp.N.keys()].map((p) => [p % w, Math.floor(p / w)]).sort((m, n) => m[0] - n[0] || m[1] - n[1]);
  sp.S = new Set(sp.N.keys());
  const xs = sp.pts.map((p) => p[0]), ys = sp.pts.map((p) => p[1]);
  Object.assign(sp, { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) });
  return sp;
}

// ---------------------------------------------------------------- tests (batterie v15)
const COTES = { gauche: [-1, 0], droite: [1, 0], haut: [0, 1], bas: [0, -1] };   // (x, y haut)

function trajet(sp, cote) {
  const [sx, sy] = COTES[cote];
  const [cx, cy] = sp.centre();
  let poses, tiers;
  if (sx) {
    const bord = sx < 0 ? sp.x0 : sp.x1 + 1;
    poses = [0, 1, 2, 3, 4, 5, 6].map((k) => [cx + (bord - cx) * k / 6, cy]).concat([2, 4, 6, 8, 12, 16, 20].map((o) => [bord + sx * o, cy]));
    tiers = sx < 0 ? (p) => p[0] < sp.x0 + (sp.x1 - sp.x0) / 3 : (p) => p[0] > sp.x1 - (sp.x1 - sp.x0) / 3;
  } else {
    const bord = sy > 0 ? sp.y0 : sp.y1 + 1;
    poses = [0, 1, 2, 3, 4, 5, 6].map((k) => [cx, cy + (bord - cy) * k / 6]).concat([2, 4, 6, 8, 12, 16, 20].map((o) => [cx, bord - sy * o]));
    tiers = sy > 0 ? (p) => p[1] < sp.y0 + (sp.y1 - sp.y0) / 3 : (p) => p[1] > sp.y1 - (sp.y1 - sp.y0) / 3;
  }
  const sel = sp.pts.filter((p) => { const n = sp.N.get(sp.id(p)); return tiers(p) && sx * n.x + sy * n.y > 0.3 && n.z < 0.9; });
  return { poses, sel };
}

const moyenne = (a) => a.reduce((s, v) => s + v, 0) / Math.max(1, a.length);

function tMonotonie(sp, cote) {
  let pire = 0, detail = '';
  const { poses, sel } = trajet(sp, cote);
  for (const portee of [220, 800]) {
    for (const z of [-40, -20, -10, 10, 40]) {
      const v = poses.map((lp) => moyenne(sel.map((p) => sp.e(p, lp, z, portee))));
      let drop = 0;
      for (let k = 1; k < 8; k++) drop = Math.max(drop, v[k - 1] - v[k]);   // jusqu'au 1er pas dehors
      if (drop > pire) { pire = drop; detail = `z=${z > 0 ? '+' : ''}${z} portee ${portee}`; }
    }
  }
  return [pire, detail];
}

function variations(sp, poses) {
  let prev = null;
  const out = [];
  for (const [lp, z] of poses) {
    const cur = sp.pts.map((p) => sp.e(p, lp, z, 500));
    if (prev) out.push(cur.reduce((s, a, i) => s + Math.abs(a - prev[i]), 0) / cur.length);
    prev = cur;
  }
  let iso = 0;
  for (let i = 1; i < out.length - 1; i++) iso = Math.max(iso, Math.abs(out[i] - (out[i - 1] + out[i + 1]) / 2));
  return [Math.max(...out), iso];
}
const pas = (a, b, s) => { const r = []; for (let v = a; s > 0 ? v <= b : v >= b; v += s) r.push(v); return r; };

function tProfondeur(sp) {
  const [cx, cy] = sp.centre();
  const a = variations(sp, pas(60, -60, -2).map((z) => [[cx, cy], z]));
  const b = variations(sp, pas(60, -60, -2).map((z) => [[sp.x0 + (sp.x1 - sp.x0) * 0.15, cy], z]));
  return [Math.max(a[0], b[0]), Math.max(a[1], b[1])];
}

function tHorizontal(sp) {
  const cy = sp.centre()[1];
  return variations(sp, pas(sp.x0 - 15, sp.x1 + 15, 2).map((x) => [[x + 0.25, cy], -20]));
}

function tAnneau(sp) {
  const ring = new Set();
  for (const p of sp.pts) {
    let bord = false;
    for (let a = -3; a <= 3 && !bord; a++) for (let b = -3; b <= 3; b++) if (!sp.has(p[0] + a, p[1] + b)) { bord = true; break; }
    if (bord) ring.add(sp.id(p));
  }
  const lp = sp.centre();
  let ra = 0, rn = 0, ia = 0, inn = 0;
  for (const p of sp.pts) {
    const lit = palier(sp.e(p, lp, -20, 800)) > 0;
    if (ring.has(sp.id(p))) { rn++; ra += lit; } else { inn++; ia += lit; }
  }
  return [100 * ra / rn, 100 * ia / Math.max(1, inn)];
}

function tDevant(sp) {
  const diffs = [];
  for (const lp of [[sp.x0 - 10, sp.y0], [(sp.x0 + sp.x1) / 2, sp.y0 - 10], [sp.x1 + 10, (sp.y0 + sp.y1) / 2]]) {
    for (const z of [20, 40]) {
      for (const p of sp.pts) {
        const ref = CPU.reference(sp.N.get(sp.id(p)), vec2(p[0] + 0.5, p[1] + 0.5), vec2(lp[0], lp[1]), z, 220);
        const v = sp.lumP(p) < 0.16 ? Math.min(ref, 1 / (PAL - 1)) : ref;
        diffs.push(Math.abs(sp.e(p, lp, z, 220) - v));
      }
    }
  }
  return [moyenne(diffs), Math.max(...diffs)];
}

function tUtilisateur(sp) {
  const [cx, cy] = sp.centre();
  const { sel } = trajet(sp, 'gauche');
  return [[cx, cy], [sp.x0 - 8 + 0.25, cy]].map((lp) => moyenne(sel.map((p) => sp.e(p, lp, -20, 220))));
}

function tSombre(sp) {
  const dark = sp.pts.filter((p) => sp.lumP(p) < 0.16);
  let pire = 0;
  for (const lp of [[sp.x0 - 8, sp.y0 + 5], [(sp.x0 + sp.x1) / 2, (sp.y0 + sp.y1) / 2], [sp.x1 + 8, sp.y1]]) {
    for (const z of [-40, -20, 0, 20, 60]) for (const p of dark) pire = Math.max(pire, palier(sp.e(p, lp, z, 800)));
  }
  return [pire, dark.length];
}

// profondeur depuis le bord extérieur (8-voisins) pour le test d'adoucissement
function profondeurs(sp) {
  const D = new Map(), q = [];
  for (const p of sp.pts) {
    let bord = false;
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) if (!sp.has(p[0] + a, p[1] + b)) bord = true;
    if (bord) { D.set(sp.id(p), 1); q.push(p); }
  }
  for (let k = 0; k < q.length; k++) {
    const p = q[k], v = D.get(sp.id(p)) + 1;
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
      const x = p[0] + a, y = p[1] + b;
      if (!sp.has(x, y) || D.has(y * sp.w + x)) continue;
      D.set(y * sp.w + x, v); q.push([x, y]);
    }
  }
  return D;
}

function tAdoucissement(sp) {
  const D = profondeurs(sp);
  const [cx, cy] = sp.centre();
  const cas = [[[cx, cy], -20, 800], [[sp.x1 + 3, sp.y0 + (sp.y1 - sp.y0) * 0.2], -20, 800],
    [[sp.x0 - 3, cy], -20, 220], [[cx, sp.y1 - 2], -20, 800]];
  let tot = 0, bad = 0, nmax = 0;
  for (const [lp, z, portee] of cas) {
    const pal = new Map(sp.pts.map((p) => [sp.id(p), palier(sp.e(p, lp, z, portee))]));
    for (const p of sp.pts) {
      if (pal.get(sp.id(p)) < 0.999 || sp.lumP(p) < 0.16) continue;
      nmax++;
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
        const x = p[0] + a, y = p[1] + b, q = y * sp.w + x;
        if (!sp.has(x, y) || !(D.get(q) > D.get(sp.id(p))) || sp.lum.get(q) < 0.16) continue;
        tot++; bad += pal.get(q) === 0;
      }
    }
  }
  return [tot ? 100 * bad / tot : 0, nmax];
}

function tFidelite(sp) {
  const sec = new Map(sp.pts.map((p) => { const n = sp.N.get(sp.id(p)); return [sp.id(p), [n.x, n.y, n.z].map((c) => c.toFixed(2)).join()]; }));
  const [cx, cy] = sp.centre();
  const H = sp.y1 - sp.y0;
  const positions = [[sp.x0 - 6, cy], [sp.x1 + 6, sp.y0 + H * 0.25], [cx, sp.y0 - 6], [cx, cy]];
  const clair = (p) => sp.lumP(p) >= 0.16;
  const out = {};
  for (const z of [49, -49]) {
    const hist = new Array(PAL).fill(0);
    let saut = 0, npairs = 0, nbig = 0;
    const larg = [];
    for (const lp of positions) {
      const lv = new Map(sp.pts.map((p) => [sp.id(p), Math.round(palier(sp.e(p, lp, z, 220)) * (PAL - 1))]));
      for (const p of sp.pts) {
        if (!clair(p)) continue;
        hist[lv.get(sp.id(p))]++;
        for (const [x, y] of [[p[0] + 1, p[1]], [p[0], p[1] + 1]]) {
          const q = y * sp.w + x;
          if (!sp.has(x, y) || sp.lum.get(q) < 0.16 || sec.get(q) === sec.get(sp.id(p))) continue;
          const s = Math.abs(lv.get(q) - lv.get(sp.id(p)));
          saut = Math.max(saut, s); npairs++; nbig += s >= 2;
        }
      }
      const top = Math.max(...sp.pts.filter(clair).map((p) => lv.get(sp.id(p))));
      if (top > 0) {
        const zeros = sp.pts.filter((p) => lv.get(sp.id(p)) === 0 && clair(p));
        const tops = sp.pts.filter((p) => lv.get(sp.id(p)) === top && clair(p));
        for (let k = 0; k < tops.length; k += 7) {
          if (zeros.length) larg.push(Math.min(...zeros.map((q) => Math.hypot(tops[k][0] - q[0], tops[k][1] - q[1]))));
        }
      }
    }
    const tot = hist.reduce((s, v) => s + v, 0) || 1;
    larg.sort((a, b) => a - b);
    out[z] = { hist: hist.map((h) => Math.round(100 * h / tot)), saut, larg: larg.length ? larg[Math.floor(larg.length / 2)] : 0, big: Math.round(1000 * nbig / Math.max(1, npairs)) / 10 };
  }
  return out;
}

function tSymetrie() {
  const sp = demiSphere(20);
  const cy = (sp.y0 + sp.y1) / 2 + 0.5, W = sp.x0 + sp.x1;
  let pire = 0;
  for (const z of [-20, 20]) {
    const lg = [sp.x0 - 8, cy], ld = [sp.x1 + 1 + 8, cy];
    for (const p of sp.pts) {
      if (!sp.has(W - p[0], p[1])) continue;
      pire = Math.max(pire, Math.abs(sp.e(p, lg, z, 220) - sp.e([W - p[0], p[1]], ld, z, 220)));
    }
  }
  return pire;
}

// ---------------------------------------------------------------- alignement du code
function corps(src, nom) {
  const i = src.search(new RegExp(`(float|vec3|function)\\s+${nom}\\s*\\(`));
  if (i < 0) return null;
  let k = src.indexOf('{', i), n = 0, j = k;
  for (; j < src.length; j++) { if (src[j] === '{') n++; else if (src[j] === '}' && --n === 0) break; }
  return src.slice(k + 1, j);
}
const sansCommentaires = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
const compact = (s) => sansCommentaires(s).replace(/\s+/g, ' ').replace(/\s*([(){},;=+\-*/<>?:&|!.])\s*/g, '$1').trim();

// shader du jeu = page validée (après les substitutions documentées dans LightKit.js)
function alignementModele() {
  const page = fs.readFileSync(path.join(__dirname, 'apercu.html'), 'utf8');
  const ecarts = [];
  for (const nom of ['palier', 'normaleLisse', 'eclairage']) {
    let a = corps(page, nom);
    const b = corps(LightKit.FRAG, nom);
    if (!a || !b) { ecarts.push(`${nom} introuvable`); continue; }
    if (nom === 'eclairage') a = a.replace(/normaleLisse\(ts\)/g, 'nLisse').replace(/\buHauteur\b/g, 'z').replace(/\buPortee\b/g, 'portee');
    if (compact(a) !== compact(b)) ecarts.push(nom);
  }
  return ecarts;
}

// GLSL <-> CPU : même suite d'appels de fonctions GLSL et de nombres dans eclairage()
const APPELS = ['smoothstep', 'normalize', 'mix', 'vec3', 'vec2', 'length', 'max', 'min', 'clamp', 'dot', 'abs', 'sqrt', 'floor'];
function suite(src) {
  const s = sansCommentaires(src);
  const re = new RegExp(`\\b(${APPELS.join('|')})\\s*\\(|(\\d+\\.\\d+|\\b\\d+\\b)`, 'g');
  const out = [];
  let m;
  while ((m = re.exec(s))) out.push(m[1] ? `${m[1]}()` : String(parseFloat(m[2])));
  return out;
}
function alignementCpu() {
  const a = suite(corps(LightKit.FRAG_ECLAIRAGE, 'eclairage'));
  const b = suite(corps(fs.readFileSync(path.join(__dirname, 'cpu.js'), 'utf8'), 'eclairage'));
  let i = 0;
  while (i < a.length && a[i] === b[i]) i++;
  return { n: a.length, ok: a.length === b.length && i === a.length, ecart: i < Math.max(a.length, b.length) ? `GLSL ${a[i]} / CPU ${b[i]} (élément ${i + 1})` : '' };
}

// ---------------------------------------------------------------- tableau
function main() {
  const lignes = [];
  const ajout = (test, sujet, ok, chiffre) => lignes.push([test, sujet, ok, chiffre]);
  const am = alignementModele();
  ajout('0 shader du jeu = page validée', 'LightKit.js / apercu.html', !am.length, am.length ? `écart : ${am.join(', ')}` : 'palier, normaleLisse, eclairage identiques');
  const ac = alignementCpu();
  ajout('0 alignement GLSL <-> CPU', 'eclairage()', ac.ok, ac.ok ? `${ac.n} appels et nombres identiques` : ac.ecart);
  const man = manifeste();
  let charges = 0;
  for (const [nom, url] of SPRITES) {
    const sp = chargerSprite(url, man);
    if (!sp) { ajout('-', nom, true, `cartes absentes (${url}) : lancer npm run sections`); continue; }
    charges++;
    for (const cote of ['gauche', 'droite', 'haut', 'bas']) {
      const [w, d] = tMonotonie(sp, cote);
      ajout(`1-2 monotonie ${cote}`, nom, w <= 0.02, `redescente max ${w.toFixed(3)}${d ? ` (${d})` : ''}`);
    }
    const [pk, iso] = tProfondeur(sp);
    ajout('4 continuité profondeur', nom, iso <= 0.02, `pic ${pk.toFixed(3)}, pic isolé ${iso.toFixed(3)}`);
    const [hk, hiso] = tHorizontal(sp);
    ajout('5 continuité horizontale z=-20', nom, hiso <= 0.03, `pic ${hk.toFixed(3)}, pic isolé ${hiso.toFixed(3)}`);
    const [an, ai] = tAnneau(sp);
    ajout('6 pas de bande (anneau 3 px allumé)', nom, an <= ai + 5 && an <= 30, `anneau ${an.toFixed(0)} % / intérieur ${ai.toFixed(0)} %`);
    const [mo, mx] = tDevant(sp);
    ajout('7 lumière devant = référence N.L', nom, mx < 1e-9, `écart moyen ${mo.toFixed(4)}, max ${mx.toFixed(4)}`);
    const u = tUtilisateur(sp);
    ajout('8 lampe qui sort à gauche', nom, u[1] > u[0], `cachée ${u[0].toFixed(3)} -> 8 px à gauche ${u[1].toFixed(3)}`);
    const [sm, nd] = tSombre(sp);
    ajout('9 contour sombre <= 1 palier', nom, sm <= 1 / 3 + 1e-9, `palier max ${sm.toFixed(2)} sur ${nd} px sombres`);
    const [ad, nm] = tAdoucissement(sp);
    ajout('10 adoucissement', nom, ad <= 5, `voisins intérieurs au palier 0 : ${ad.toFixed(1)} % (${nm} px au max)`);
    const f = tFidelite(sp);
    const moy = (h) => h.reduce((s, v, i) => s + i * v, 0) / 100;
    const p49 = f[49], m49 = f[-49];
    const ok11 = m49.big <= p49.big && m49.saut <= p49.saut && moy(m49.hist) <= moy(p49.hist)
      && Math.min(...m49.hist.slice(1)) >= 3 && m49.larg >= 0.6 * p49.larg;
    const fmt = (r) => `[${r.hist.join(', ')}] (${moy(r.hist).toFixed(2)}), ${r.saut}, ${r.big.toFixed(1)} %, ${r.larg.toFixed(1)} px`;
    ajout('11 fidélité à +49', nom, ok11, `paliers 0/1/2/3 en % (moyenne) ; saut max ; sauts >= 2 ; largeur -- +49 : ${fmt(p49)} | -49 : ${fmt(m49)}`);
  }
  const sy = tSymetrie();
  ajout('3 symétrie demi-sphère', 'demi-sphère', sy < 0.02, `écart max gauche/droite en miroir ${sy.toFixed(4)}`);
  const cle = (t) => t.replace(/^(\d+)/, (m) => m.padStart(2, '0'));
  lignes.sort((a, b) => cle(a[0]).localeCompare(cle(b[0]), 'fr') || 0);
  console.log('| Test | Sujet | Résultat | Chiffre |');
  console.log('|---|---|---|---|');
  for (const [t, s, ok, c] of lignes) console.log(`| ${t} | ${s} | ${ok ? 'OK' : 'ÉCHEC'} | ${c} |`);
  const echecs = lignes.filter((l) => !l[2]).length;
  console.log(`\n${lignes.length - echecs} / ${lignes.length} OK${charges < SPRITES.length ? ` (${SPRITES.length - charges} sprite(s) sans cartes)` : ''}`);
  return echecs ? 1 : 0;
}

process.exitCode = main();
