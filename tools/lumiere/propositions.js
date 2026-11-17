#!/usr/bin/env node
'use strict';
/*
 * Comparer les méthodes de découpage (actuelle, A, B, C) sur des animations du jeu, SANS toucher
 * aux cartes du jeu : tout est calculé en mémoire depuis les images du jeu (même chaîne que
 * `npm run sections -- --animation`), et écrit seulement dans le dossier donné.
 *
 *   node tools/lumiere/propositions.js --out <dossier> [anim...] [--methodes origine,A,B,C] [--zoom 3]
 *     planches <dossier>/planche_<methode>.png : une ligne par animation (une image), colonnes
 *     origine | neutre | sections | torche de face | torche à gauche | torche à droite | contre-jour ;
 *     <dossier>/animations_<methode>.png : toutes les images de chaque animation (sections, torche
 *     à gauche) pour juger le clignotement ; mesures dans la console.
 * Animations par défaut (clé `anim` du manifeste src/data/sections.js) : ANIMS ci-dessous.
 * Utilisé aussi par tools/lumiere/apercu.js (--propositions) et tools/lumiere/tests.js.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const C = require('./coeur.js');
const CPU = require('./cpu.js');
const PNG = require('./png.js');

const ROOT = path.resolve(__dirname, '..', '..');
const ANIMS = ['agarica_repos_sit', 'agarica_walk', 'agarica_slash_side', 'xara_walk', 'loup_run'];
// image montrée sur la planche, par animation (la plus lisible)
const IMAGE_PLANCHE = { agarica_slash_side: 1 };

function manifeste() {
  const f = path.join(ROOT, 'src', 'data', 'sections.js');
  if (!fs.existsSync(f)) return {};
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(`${fs.readFileSync(f, 'utf8')}\n;this.__r = SECTIONS_LUMIERE;`, ctx);
  return ctx.__r;
}

// Images natives d'une animation du manifeste (ou d'un sprite seul : clé de l'image du jeu), comme
// tools/sections.js : même toile calée en bas au centre, même grille (facteur f du manifeste).
function natifs(nom, man) {
  man = man || manifeste();
  const cles = Object.keys(man).filter((k) => man[k].anim === nom || k === nom).sort((a, b) => (man[a].i || 0) - (man[b].i || 0));
  if (!cles.length) throw new Error(`${nom} absent du manifeste src/data/sections.js`);
  const hds = cles.map((k) => PNG.lirePng(path.join(ROOT, k)));
  const f = man[cles[0]].f;
  const canv = cles.length > 1 ? C.natifsAnimation(hds, f > 1 ? f : 0).canv : [f > 1 ? C.natifSprite(hds[0], f).nat : hds[0]];
  return { nom, cles, canv, fps: man[cles[0]].fps || 12, vitesse: man[cles[0]].vitesse || 0 };
}

// Cartes de toutes les images d'une animation par une méthode (en mémoire)
function calculer(anim, methode) {
  const ech = C.echelleSprite(anim.canv);
  const t0 = Date.now();
  const res = anim.canv.length > 1
    ? C.sectionsAnimation(anim.canv, [], [], false, ech, methode)
    : (() => { const a = C.analyser(anim.canv[0], [], [], false, null, ech, methode); return { frames: [a], avant: 0, apres: 0, fin: !!a.fin, info: a.info }; })();
  const frames = anim.canv.map((nat, i) => C.cartes(nat, res.frames[i], ech));
  return { frames, res, ms: Date.now() - t0, s: ech };
}

// ---------------------------------------------------------------- rendu (shader v16 en CPU)
const TORCHE = [1, 0xb3 / 255, 0x5c / 255];
const RENDU = { ambiance: 0.36, intensite: 1, portee: 220, paliers: 4, contre: 1.5 };
// Palier (0 à paliers - 1) reçu par chaque pixel sous une lampe, dans le canal R d'une image
// (pour mesurer le clignotement de la LUMIÈRE seule, sans les couleurs du neutre)
function paliers(c, lampe) {
  const { neu, nor, cj } = c, w = neu.width, h = neu.height;
  const sp = CPU.sprite({ w, h, n: nor.data, neutre: neu.data, cj: cj.data });
  const U = { uPaliers: RENDU.paliers, uContre: RENDU.contre, uFlip: 0 };
  const out = C.nouvelle(w, h);
  for (const [p, n] of sp.N) {
    const x = p % w, y = (p - x) / w;
    const v = CPU.eclairage(n, sp.NL.get(p), CPU.vec2(x + 0.5, y + 0.5), CPU.vec2(lampe.x, lampe.y), lampe.z, RENDU.portee, sp.lum.get(p), sp.CJ.get(p), U);
    out.data.set([Math.round(CPU.palier(v, U) * (RENDU.paliers - 1)), 0, 0, 255], p * 4);
  }
  return out;
}
// Éclairé : neutre x (ambiance + couleur x intensité x palier(eclairage())), comme la page de test
function eclaire(c, lampe) {
  const { neu, nor, cj } = c, w = neu.width, h = neu.height;
  const sp = CPU.sprite({ w, h, n: nor.data, neutre: neu.data, cj: cj.data });
  const U = { uPaliers: RENDU.paliers, uContre: RENDU.contre, uFlip: 0 };
  const out = C.nouvelle(w, h);
  for (const [p, n] of sp.N) {
    const x = p % w, y = (p - x) / w;
    const v = CPU.eclairage(n, sp.NL.get(p), CPU.vec2(x + 0.5, y + 0.5), CPU.vec2(lampe.x, lampe.y), lampe.z, RENDU.portee, sp.lum.get(p), sp.CJ.get(p), U);
    const q = CPU.palier(v, U);
    for (let i = 0; i < 3; i++) out.data[p * 4 + i] = Math.min(255, Math.round(neu.data[p * 4 + i] * (RENDU.ambiance + RENDU.intensite * TORCHE[i] * q)));
    out.data[p * 4 + 3] = 255;
  }
  return out;
}
// lampes de la planche, en px natifs (y vers le bas)
function lampes(w, h) {
  return {
    face: { x: w / 2, y: h * 0.3, z: 20 },
    gauche: { x: -6, y: h * 0.4, z: 8 },
    droite: { x: w + 6, y: h * 0.4, z: 8 },
    contre: { x: w / 2, y: h * 0.45, z: -20 },
  };
}
const VUES = ['origine', 'neutre', 'sections', 'torche de face', 'torche à gauche', 'torche à droite', 'contre-jour'];
function vues(c) {
  const L = lampes(c.nat.width, c.nat.height);
  return [c.nat, c.neu, c.sec, eclaire(c, L.face), eclaire(c, L.gauche), eclaire(c, L.droite), eclaire(c, L.contre)];
}

// Planche : lignes d'images (chacune une liste d'images natives), agrandies z fois
function assembler(lignes, z, fond = [24, 21, 34]) {
  const pad = 6;
  const W = Math.max(...lignes.map((l) => l.reduce((s, im) => s + im.width * z + pad, pad)));
  const H = lignes.reduce((s, l) => s + Math.max(...l.map((im) => im.height)) * z + pad, pad);
  const b = C.nouvelle(W, H);
  for (let i = 0; i < W * H; i++) b.data.set([...fond, 255], i * 4);
  let oy = pad;
  for (const l of lignes) {
    let ox = pad;
    const lh = Math.max(...l.map((im) => im.height));
    for (const t of l) {
      const dy = (lh - t.height) * z;
      for (let y = 0; y < t.height * z; y++) {
        for (let x = 0; x < t.width * z; x++) {
          const s = (((y / z) | 0) * t.width + ((x / z) | 0)) * 4;
          if (t.data[s + 3] < 128) continue;
          b.data.set([t.data[s], t.data[s + 1], t.data[s + 2], 255], ((oy + dy + y) * W + ox + x) * 4);
        }
      }
      ox += t.width * z + pad;
    }
    oy += lh * z + pad;
  }
  return b;
}

// ---------------------------------------------------------------- mesures
// zones (pixels connexes de même section, 4 voisins) : nombre, part des pixels clairs dans des zones
// de moins de `mini` px ; traits sombres (luminance du neutre < 0,16) exclus
function miettes(c, mini = 8) {
  const { sec, neu } = c, w = sec.width, h = sec.height, NP = w * h;
  const clair = (p) => sec.data[p * 4 + 3] >= 128 && (0.3 * neu.data[p * 4] + 0.59 * neu.data[p * 4 + 1] + 0.11 * neu.data[p * 4 + 2]) / 255 >= 0.16;
  const code = (p) => C.rgbInt(sec.data, p * 4);
  const vu = new Uint8Array(NP);
  let zones = 0, petits = 0, tot = 0, plusPetite = Infinity;
  for (let p0 = 0; p0 < NP; p0++) {
    if (vu[p0] || sec.data[p0 * 4 + 3] < 128) continue;
    const comp = [p0];
    vu[p0] = 1;
    for (let k = 0; k < comp.length; k++) {
      const x = comp[k] % w, y = (comp[k] - x) / w;
      for (const [dx, dy] of C.N4) {
        const X = x + dx, Y = y + dy, q = Y * w + X;
        if (X < 0 || Y < 0 || X >= w || Y >= h || vu[q] || sec.data[q * 4 + 3] < 128 || code(q) !== code(p0)) continue;
        vu[q] = 1; comp.push(q);
      }
    }
    zones++;
    const nc = comp.filter(clair).length;
    tot += nc;
    if (comp.length < mini) petits += nc;
    if (nc) plusPetite = Math.min(plusPetite, comp.length);
  }
  return { zones, miettes: tot ? petits / tot : 0, plusPetite };
}
// détail gardé : moyenne de |L - moyenne 3x3| (pixels clairs du corps), neutre / origine
function detail(c) {
  const lum = (im, p) => (0.3 * im.data[p * 4] + 0.59 * im.data[p * 4 + 1] + 0.11 * im.data[p * 4 + 2]) / 255;
  const { nat, neu } = c, w = nat.width, h = nat.height;
  const contraste = (im) => {
    let s = 0, n = 0;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const p = y * w + x;
        if (nat.data[p * 4 + 3] < 128 || lum(nat, p) < 0.16) continue;
        let m = 0, k = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const q = p + dy * w + dx; if (nat.data[q * 4 + 3] >= 128) { m += lum(im, q); k++; } }
        s += Math.abs(lum(im, p) - m / k); n++;
      }
    }
    return n ? s / n : 0;
  };
  const couleurs = (im) => { const s = new Set(); for (let p = 0; p < w * h; p++) if (im.data[p * 4 + 3] >= 128) s.add(C.rgbInt(im.data, p * 4)); return s.size; };
  return { contraste: contraste(neu) / (contraste(nat) || 1), couleurs: couleurs(neu), couleursOrigine: couleurs(nat) };
}
// stabilité : part des pixels dont la section change d'une image à la suivante alors que la couleur
// d'origine (recalée sur le corps entier) ne change pas. eclaires (option) : au lieu de la section,
// on compare le PALIER reçu sous les mêmes lampes (ce que l'œil voit clignoter) ; eclaires[i] =
// liste d'images éclairées de la frame i (torche à gauche, à droite).
function stabilite(frames, eclaires) {
  const n = frames.length;
  if (n < 2) return 0;
  let diff = 0, tot = 0;
  for (let i = 0; i < n; i++) {
    const a = frames[i], b = frames[(i + 1) % n], w = a.nat.width, h = a.nat.height;
    const ca = new Int32Array(w * h).fill(-1), cb = new Int32Array(w * h).fill(-1), liste = [];
    for (let p = 0; p < w * h; p++) {
      if (a.nat.data[p * 4 + 3] >= 128) { ca[p] = C.rgbInt(a.nat.data, p * 4); liste.push(p); }
      if (b.nat.data[p * 4 + 3] >= 128) cb[p] = C.rgbInt(b.nat.data, p * 4);
    }
    const [dx, dy] = C.meilleurDecalage(ca, cb, w, h, liste, 3, 1);
    for (const p of liste) {
      const x = p % w + dx, y = (p - p % w) / w + dy;
      if (x < 0 || y < 0 || x >= w || y >= h || cb[y * w + x] !== ca[p]) continue;
      if (!eclaires) {
        tot++;
        diff += C.rgbInt(a.sec.data, p * 4) !== C.rgbInt(b.sec.data, (y * w + x) * 4);
        continue;
      }
      // lampes fixes par rapport au corps : l'image suivante est décalée de (dx, dy)
      eclaires[i].forEach((ea, k) => {
        tot++;
        diff += C.rgbInt(ea.data, p * 4) !== C.rgbInt(eclaires[(i + 1) % n][k].data, (y * w + x) * 4);
      });
    }
  }
  return tot ? diff / tot : 0;
}
// paliers pour stabilite() : torche à gauche et à droite (z = +8), et contre-jour
function eclairesPourStabilite(frames) {
  return frames.map((c) => { const L = lampes(c.nat.width, c.nat.height); return [paliers(c, L.gauche), paliers(c, L.droite), paliers(c, L.contre)]; });
}
// neutre qui change d'une image à l'autre là où l'origine ne change pas (clignotement des couleurs)
function stabiliteNeutre(frames) {
  return stabilite(frames, frames.map((c) => [c.neu]));
}

// ---------------------------------------------------------------- ligne de commande
function main() {
  const argv = process.argv.slice(2);
  let out = '', methodes = ['origine', 'A', 'B', 'C'], z = 3;
  const anims = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--out') out = argv[++i];
    else if (argv[i] === '--methodes') methodes = argv[++i].split(',');
    else if (argv[i] === '--zoom') z = Math.max(1, +argv[++i] || 3);
    else anims.push(argv[i]);
  }
  if (!out) { console.error('Usage : node tools/lumiere/propositions.js --out <dossier> [anim...] [--methodes origine,A,B,C] [--zoom 3]'); return 2; }
  fs.mkdirSync(out, { recursive: true });
  const man = manifeste();
  const liste = (anims.length ? anims : ANIMS).map((a) => natifs(a, man));
  console.log('| Méthode | Animation | Zones | Miettes < 8 px | Plus petite zone | Détail gardé | Couleurs neutre / origine | Sections qui changent | Paliers qui changent | Neutre qui change | Temps |');
  console.log('|---|---|---|---|---|---|---|---|---|---|---|');
  for (const m of methodes) {
    const lignes = [], anim = [];
    for (const a of liste) {
      const r = calculer(a, m);
      const k = Math.min(IMAGE_PLANCHE[a.nom] || 0, r.frames.length - 1);
      lignes.push(vues(r.frames[k]));
      anim.push(r.frames.map((c) => c.sec), r.frames.map((c) => eclaire(c, lampes(c.nat.width, c.nat.height).gauche)));
      const mi = r.frames.map((c) => miettes(c)), de = detail(r.frames[k]);
      const moy = (t) => t.reduce((s, v) => s + v, 0) / t.length;
      console.log(`| ${m} | ${a.nom} | ${Math.round(moy(mi.map((x) => x.zones)))} | ${(100 * moy(mi.map((x) => x.miettes))).toFixed(1)} % | ${Math.min(...mi.map((x) => x.plusPetite))} px | ${(100 * de.contraste).toFixed(0)} % | ${de.couleurs} / ${de.couleursOrigine} | ${(100 * stabilite(r.frames)).toFixed(1)} % | ${(100 * stabilite(r.frames, eclairesPourStabilite(r.frames))).toFixed(1)} % | ${(100 * stabiliteNeutre(r.frames)).toFixed(1)} % | ${r.ms} ms |`);
    }
    PNG.ecrirePng(assembler(lignes, z), path.join(out, `planche_${m}.png`));
    PNG.ecrirePng(assembler(anim, z), path.join(out, `animations_${m}.png`));
  }
  console.log(`colonnes : ${VUES.join(' | ')}`);
  console.log(`planches : ${path.resolve(out)}`);
  return 0;
}

if (require.main === module) process.exitCode = main();
module.exports = { ANIMS, manifeste, natifs, calculer, eclaire, paliers, lampes, vues, VUES, assembler, miettes, detail, stabilite, stabiliteNeutre, eclairesPourStabilite, RENDU };
