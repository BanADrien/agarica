#!/usr/bin/env node
'use strict';
/*
 * Refait des images IA (Codex) en vrai pixel art avec pixel-fixer
 * (tools/pixel-fixer, même algorithme que sa page et son CLI), en gardant
 * tout ce dont le jeu dépend : même fichier, même taille d'image, même
 * alignement des frames d'une animation. Aucun code du jeu à changer.
 *
 * Usage (depuis la racine du jeu ; une fois : `npm install` dans tools/pixel-fixer) :
 *   node tools/pixelfix.js anim <id>...     entrée(s) d'ASSET_MANIFEST (toutes leurs frames)
 *   node tools/pixelfix.js item <id>...     entrée(s) d'ITEM_MANIFEST
 *   node tools/pixelfix.js tiles <id>...    jeu(x) de tuiles de TILESET_MANIFEST (raccords
 *                    gardés ; --tile-px 24 = pixels dessinés par case, comme tuiles.png)
 *   node tools/pixelfix.js files <png|dossier>... --height 32   images hors manifest
 *   node tools/pixelfix.js agarica [--height 64] --variant   toutes les feuilles d'Agarica,
 *                    même taille de pixel à l'écran (hauteur de l'idle en pixels dessinés)
 *   node tools/pixelfix.js restore <id|png|dossier>...   remet les originaux IA
 *   node tools/pixelfix.js list             images déjà refaites
 * Options :
 *   --height <px>    hauteur du sujet en pixels dessinés (médiane des frames du lot) ;
 *                    cf. le tableau d'échelle de docs/production/ASSETS_A_REFAIRE.md
 *   --factor <n>     ou : n px de l'image source = 1 pixel dessiné
 *                    (défaut pour le manifest : 2,67 / scale, la densité des tuiles)
 *   --colors <n>     nombre de couleurs du lot (défaut : auto)
 *   --palette <f>    palette imposée (.hex, .gpl, .png)
 *   --outline darkest|selective   contour propre ; --pixel-perfect
 *   --preview <png>  planche avant / après (sans --write, rien d'autre n'est écrit)
 *   --dry            calcule et affiche, n'écrit rien
 *   --variant        écrit dans assets/_pixel/ sans toucher l'image du jeu : version
 *                    de test, chargée seulement avec ?pixel dans l'adresse (BootScene)
 * Code de sortie : 0 ok, 1 image en échec, 2 erreur d'usage.
 *
 * Pourquoi un script à part plutôt que `cli.js --in-place` : le CLI rogne
 * l'image sur le sujet et la sort en petit (32 px de haut). Le jeu, lui, lit
 * des frames de canvas identiques, alignées bas-centre (cf. asset_manifest.js),
 * avec un `scale` réglé pour l'image d'origine. Ici chaque pixel dessiné est
 * reposé en bloc de `factor` x `factor` px dans le canvas d'origine, sur une
 * grille ancrée au bas-centre et commune à tout le lot : les frames ne
 * tressautent pas d'une image à l'autre, et l'échelle à l'écran ne change pas.
 * Palette commune au lot : une animation garde les mêmes couleurs partout.
 *
 * Originaux : copiés une seule fois dans assets/_pixelfix_originals/ (même
 * chemin) ; un nouveau passage repart TOUJOURS de l'original, jamais d'une
 * image déjà refaite. Registre : src/data/pixel_fixed.js (le jeu les affiche
 * sans lissage, cf. BootScene ; import_codex_assets.py ne les écrase pas).
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const TOOL = path.join(__dirname, 'pixel-fixer');
const ORIGINALS = path.join(ROOT, 'assets', '_pixelfix_originals');
const REGISTRY = path.join(ROOT, 'src', 'data', 'pixel_fixed.js');
const MANIFEST = path.join(ROOT, 'src', 'data', 'asset_manifest.js');
// Densité des tuiles (24 px dessinés affichés en 64) : 1 pixel dessiné = 2,67 px à l'écran.
const SCREEN_PX_PER_ART_PX = 64 / 24;
// Une case de tuile des biomes : 256 px dans l'image, 64 à l'écran.
const TILE_SOURCE_PX = 256;
let tilePx = 24;

let sharp;
let PC;
try {
  sharp = require(path.join(TOOL, 'node_modules', 'sharp'));
  PC = require(path.join(TOOL, 'pixelclean-core.js'));
} catch (e) {
  console.error('pixel-fixer pas installé : lancer "npm install" dans tools/pixel-fixer');
  process.exit(2);
}

// ------------------------------------------------------------ arguments

function parseArgs(argv) {
  const a = { cmd: argv[0], inputs: [], o: {} };
  const num = (v, name) => {
    const n = Number(String(v).replace(',', '.'));
    if (!Number.isFinite(n) || n <= 0) throw new Error(`nombre invalide pour ${name} : ${v}`);
    return n;
  };
  for (let i = 1; i < argv.length; i++) {
    const t = argv[i];
    const next = () => {
      if (i + 1 >= argv.length) throw new Error(`valeur manquante pour ${t}`);
      return argv[++i];
    };
    if (t === '--height') a.o.height = num(next(), t);
    else if (t === '--factor') a.o.factor = num(next(), t);
    else if (t === '--colors') a.o.colors = Math.round(num(next(), t));
    else if (t === '--palette') a.o.palette = path.resolve(next());
    else if (t === '--outline') {
      a.o.outline = next();
      if (!['darkest', 'selective'].includes(a.o.outline)) throw new Error('--outline : darkest ou selective');
    } else if (t === '--pixel-perfect') a.o.pixelPerfect = true;
    else if (t === '--preview') a.o.preview = path.resolve(next());
    else if (t === '--write') a.o.write = true;
    else if (t === '--dry') a.o.dry = true;
    else if (t === '--variant') a.o.variant = true;
    else if (t === '--tile-px') tilePx = Math.round(num(next(), t));
    else if (t.startsWith('--')) throw new Error(`option inconnue : ${t}`);
    else a.inputs.push(t);
  }
  // Avec --preview seul : on regarde avant d'écrire (--write pour écrire aussi).
  if (a.o.preview && !a.o.write) a.o.dry = true;
  return a;
}

// ------------------------------------------------------------ manifest et registre

function loadManifests() {
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(`${fs.readFileSync(MANIFEST, 'utf8')}
;this.__m = { ASSET_MANIFEST, ITEM_MANIFEST, TILESET_MANIFEST };`, ctx, { filename: MANIFEST });
  return ctx.__m;
}

function relOf(abs) {
  return path.relative(ROOT, abs).split(path.sep).join('/');
}

function loadRegistry() {
  if (!fs.existsSync(REGISTRY)) return {};
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(`${fs.readFileSync(REGISTRY, 'utf8')}
;this.__r = PIXEL_FIXED;`, ctx);
  return JSON.parse(JSON.stringify(ctx.__r));
}

function saveRegistry(reg) {
  const keys = Object.keys(reg).sort();
  const lines = keys.map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(reg[k])},`);
  fs.writeFileSync(REGISTRY, `// GÉNÉRÉ par tools/pixelfix.js -- ne pas modifier à la main.
// Images refaites en pixel art (original IA dans assets/_pixelfix_originals/).
// BootScene les affiche sans lissage (NEAREST) ; import_codex_assets.py ne
// les réécrit pas. \`f\` : px de l'image = 1 pixel dessiné ; \`set\` : le lot.
const PIXEL_FIXED = {
${lines.join('\n')}
};
`);
}

// ------------------------------------------------------------ lots

function walkPngs(abs, out) {
  if (fs.statSync(abs).isDirectory()) {
    for (const name of fs.readdirSync(abs).sort()) {
      if (name.startsWith('_') || name.startsWith('.')) continue;
      walkPngs(path.join(abs, name), out);
    }
  } else if (/\.png$/i.test(abs)) out.push(abs);
  return out;
}

// Agarica (forme humaine), toutes ses feuilles. Chacune est affichée à sa
// propre échelle : HUMAN_SCALE pour l'idle / la course / la marche,
// AGARICA_ATTACK_SCALE pour l'ancienne attaque, et pour les feuilles Codex
// celle de agaricaSheetScale (calée sur l'idle, mesurée en jeu le 2026-11-10,
// une par planche source). Pour que `--height` (hauteur de l'idle en pixels
// dessinés) donne la même taille de pixel à l'écran partout, chaque lot
// reçoit factor = densité / son échelle, la densité venant de l'idle.
const AGARICA_IDLE = 'assets/sprites/agarica_frames/agarica_row0_0.png';
const AGARICA_SETS = [
  { name: 'agarica:base', dir: 'assets/sprites/agarica_frames', scale: 0.24 },
  { name: 'agarica:marche', dir: 'assets/sprites/agarica_walk_frames', scale: 0.24 },
  { name: 'agarica:attaque', dir: 'assets/sprites/agarica_attack_frames', scale: 0.204 },
  { name: 'agarica:extra1', dir: 'assets/sprites/agarica_extra_frames', rows: [0, 1, 2], scale: 0.3144 },
  { name: 'agarica:extra2', dir: 'assets/sprites/agarica_extra_frames', rows: [3, 4, 5], scale: 0.2919 },
  { name: 'agarica:extra3', dir: 'assets/sprites/agarica_extra_frames', rows: [6, 7, 8], scale: 0.3534 },
  { name: 'agarica:extra4', dir: 'assets/sprites/agarica_extra_frames', rows: [9], scale: 0.2524 },
  { name: 'agarica:slash', dir: 'assets/sprites/agarica_slash_frames', scale: 0.2729 },
  { name: 'agarica:repos', dir: 'assets/sprites/agarica_repos_frames', scale: 0.3348 },
];

async function agaricaSets(o) {
  const idle = subjectBox(await readImage(sourceOf(path.join(ROOT, AGARICA_IDLE))));
  const density = (idle.h * 0.24) / (o.height || 64);
  return AGARICA_SETS.map((s) => {
    const dir = path.join(ROOT, s.dir);
    const files = fs.readdirSync(dir).filter((n) => {
      if (!n.endsWith('.png')) return false;
      const m = n.match(/_row(\d+)_/);
      return !s.rows || (m && s.rows.includes(Number(m[1])));
    }).sort().map((n) => path.join(dir, n));
    return { name: s.name, files, scale: s.scale, factor: Math.round((density / s.scale) * 100) / 100 };
  });
}

// Un lot = des fichiers traités ensemble (palette commune, même facteur).
function resolveSets(cmd, inputs, manifests) {
  if (!inputs.length) throw new Error('rien à traiter (voir l\'en-tête de tools/pixelfix.js)');
  if (cmd === 'anim') {
    return inputs.map((id) => {
      const e = manifests.ASSET_MANIFEST[id];
      if (!e) throw new Error(`anim inconnue dans ASSET_MANIFEST : ${id}`);
      const dir = path.join(ROOT, e.dir);
      const files = fs.existsSync(dir)
        ? fs.readdirSync(dir).filter((n) => n.startsWith(`${e.prefix}_row`) && n.endsWith('.png')).sort().map((n) => path.join(dir, n))
        : [];
      if (!files.length) throw new Error(`${id} : aucune frame dans ${e.dir}`);
      return { name: `anim:${id}`, files, scale: e.scale };
    });
  }
  if (cmd === 'tiles') {
    // Jeux de tuiles des biomes (TILESET_MANIFEST) : 21 cases de 256 px,
    // affichées en 64. Densité des tuiles dessinées main (tuiles.png : 24 px
    // par case) : `--tile-px` pixels dessinés par case, 24 par défaut.
    return inputs.map((id) => {
      const e = manifests.TILESET_MANIFEST[id];
      if (!e) throw new Error(`jeu de tuiles inconnu dans TILESET_MANIFEST : ${id}`);
      const dir = path.join(ROOT, e.dir);
      const files = fs.readdirSync(dir).filter((n) => n.endsWith('.png')).sort().map((n) => path.join(dir, n));
      return { name: `tiles:${id}`, files, tileable: true, factor: TILE_SOURCE_PX / (tilePx || 24) };
    });
  }
  if (cmd === 'item') {
    return inputs.map((id) => {
      const e = manifests.ITEM_MANIFEST[id];
      if (!e) throw new Error(`objet inconnu dans ITEM_MANIFEST : ${id}`);
      const abs = path.join(ROOT, e.path);
      if (!fs.existsSync(abs)) throw new Error(`${id} : image absente (${e.path})`);
      return { name: `item:${id}`, files: [abs], scale: e.scale };
    });
  }
  if (cmd === 'files') {
    const files = [];
    for (const inp of inputs) {
      const abs = path.resolve(inp);
      if (!fs.existsSync(abs)) throw new Error(`introuvable : ${inp}`);
      walkPngs(abs, files);
    }
    if (!files.length) throw new Error('aucune image PNG trouvée');
    return [{ name: `files:${relOf(path.resolve(inputs[0]))}`, files, scale: null }];
  }
  throw new Error(`commande inconnue : ${cmd}`);
}

// ------------------------------------------------------------ images

async function readImage(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { width: info.width, height: info.height, data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.length) };
}

async function writeImage(img, file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await sharp(Buffer.from(img.data.buffer, img.data.byteOffset, img.data.length), {
    raw: { width: img.width, height: img.height, channels: 4 },
  }).png({ compressionLevel: 9 }).toFile(file);
}

function originalOf(abs) {
  return path.join(ORIGINALS, path.relative(path.join(ROOT, 'assets'), abs));
}

function variantOf(abs) {
  return path.join(ROOT, 'assets', '_pixel', path.relative(path.join(ROOT, 'assets'), abs));
}

// Image de départ : toujours l'original IA s'il a déjà été mis de côté.
function sourceOf(abs) {
  const orig = originalOf(abs);
  return fs.existsSync(orig) ? orig : abs;
}

function subjectBox(img) {
  const { width: W, height: H, data: d } = img;
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (d[(y * W + x) * 4 + 3] < 128) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  return x1 < 0 ? null : { x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

// Facteur : un pixel dessiné = un bloc de `factor` px de l'image (pas forcément
// entier : 64 px de haut tombent rarement juste ; à l'écran l'image est de
// toute façon réduite d'un facteur non entier, cf. `scale` du manifest).
function factorFor(set, imgs, o) {
  const round2 = (v) => Math.max(1, Math.round(v * 100) / 100);
  if (set.factor) return round2(set.factor);
  if (o.factor) return round2(o.factor);
  if (o.height) {
    const hs = imgs.map(subjectBox).filter(Boolean).map((b) => b.h).sort((a, b) => a - b);
    if (!hs.length) throw new Error(`${set.name} : images vides`);
    return round2(hs[hs.length >> 1] / o.height);
  }
  if (set.scale) return round2((o.density || SCREEN_PX_PER_ART_PX) / set.scale);
  throw new Error(`${set.name} : indiquer --height (hauteur du sujet en pixels dessinés) ou --factor`);
}

// Repose le petit résultat (nx x ny) en blocs de `f` px dans le canvas
// d'origine (W x H). Grille ancrée au bas-centre du canvas, identique pour
// toutes les frames du lot ; le sujet garde sa place (centre, pieds) au bloc près.
function placeOnCanvas(small, bbox, W, H, f) {
  const out = new Uint8ClampedArray(W * H * 4);
  const ax = Math.round(W / 2);
  const [bx0, by0, bw, bh] = bbox;
  // Coins de la grille (en px fractionnaires), arrondis bloc par bloc.
  const gx = ax + Math.round((bx0 + bw / 2 - (small.width * f) / 2 - ax) / f) * f;
  const gy = H + Math.round((by0 + bh - H) / f) * f - small.height * f;
  const s = small.data;
  for (let j = 0; j < small.height; j++) {
    const ya = Math.max(0, Math.round(gy + j * f)), yb = Math.min(H, Math.round(gy + (j + 1) * f));
    for (let i = 0; i < small.width; i++) {
      const p = (j * small.width + i) * 4;
      if (s[p + 3] === 0) continue;
      const xa = Math.max(0, Math.round(gx + i * f)), xb = Math.min(W, Math.round(gx + (i + 1) * f));
      for (let y = ya; y < yb; y++) {
        for (let x = xa; x < xb; x++) {
          const q = (y * W + x) * 4;
          out[q] = s[p]; out[q + 1] = s[p + 1]; out[q + 2] = s[p + 2]; out[q + 3] = s[p + 3];
        }
      }
    }
  }
  return { width: W, height: H, data: out };
}

// Tuile : chaque pixel dessiné reprend exactement la case analysée (bords
// des cases = bords de la tuile), pour que deux tuiles voisines se raccordent.
function placeOnGrid(small, grid, W, H) {
  const out = new Uint8ClampedArray(W * H * 4);
  const xs = grid.displayXs, ys = grid.displayYs, s = small.data;
  for (let j = 0; j < small.height; j++) {
    const ya = Math.max(0, Math.round(ys[j])), yb = Math.min(H, Math.round(ys[j + 1]));
    for (let i = 0; i < small.width; i++) {
      const p = (j * small.width + i) * 4;
      if (s[p + 3] === 0) continue;
      const xa = Math.max(0, Math.round(xs[i])), xb = Math.min(W, Math.round(xs[i + 1]));
      for (let y = ya; y < yb; y++) {
        for (let x = xa; x < xb; x++) {
          const q = (y * W + x) * 4;
          out[q] = s[p]; out[q + 1] = s[p + 1]; out[q + 2] = s[p + 2]; out[q + 3] = s[p + 3];
        }
      }
    }
  }
  return { width: W, height: H, data: out };
}

async function loadPalette(file) {
  if (!file) return null;
  const pal = /\.png$/i.test(file) ? PC.paletteFromImage(await readImage(file)) : PC.parsePaletteText(fs.readFileSync(file, 'utf8'));
  if (!pal.length) throw new Error(`palette vide ou illisible : ${file}`);
  return pal;
}

async function processSet(set, o, reg) {
  const imgs = [];
  for (const f of set.files) imgs.push(await readImage(sourceOf(f)));
  const factor = factorFor(set, imgs, o);
  const palette = await loadPalette(o.palette);
  const core = {
    // Taille imposée par le facteur, jamais par une grille « détectée » :
    // l'image IA n'en a pas de vraie, et le canvas doit rester celui du jeu.
    force: 'target', sizeMode: 'fixed', targetBy: 'factor', targetFactor: factor,
    sharedPalette: true,
    // Fond déjà transparent : un fond uni « détecté » mangerait le sujet.
    background: 'keep',
    cleanOutline: !!o.outline, outlineMode: o.outline || 'darkest',
    pixelPerfect: !!o.pixelPerfect,
    tileable: !!set.tileable,
  };
  if (o.colors) core.colors = o.colors;
  if (palette) core.palette = palette;
  const results = PC.processBatch(imgs, core);
  const out = [];
  for (let i = 0; i < set.files.length; i++) {
    const r = results[i];
    const bbox = r.analysis.grid && r.analysis.grid.bbox;
    if (!bbox) throw new Error(`${relOf(set.files[i])} : pas de boîte du sujet (image vide ?)`);
    out.push({
      file: set.files[i], before: imgs[i], small: r.image,
      after: set.tileable ? placeOnGrid(r.image, r.analysis.grid, imgs[i].width, imgs[i].height)
        : placeOnCanvas(r.image, bbox, imgs[i].width, imgs[i].height, factor),
      colors: r.palette.size,
    });
  }
  return { factor, frames: out };
}

// Planche avant / après : une ligne par image (original | refait), réduite à
// 1600 px de large au plus, sans lissage.
async function writePreview(done, file, perSet = Infinity) {
  const rows = done.flatMap((d) => d.frames.slice(0, perSet));
  const cellW = Math.max(...rows.map((r) => r.before.width));
  const cellH = Math.max(...rows.map((r) => r.before.height));
  const gap = 8;
  const W = cellW * 2 + gap * 3, H = rows.length * (cellH + gap) + gap;
  const comps = [];
  rows.forEach((r, k) => {
    const y = gap + k * (cellH + gap);
    for (const [img, x] of [[r.before, gap], [r.after, cellW + gap * 2]]) {
      comps.push({ input: Buffer.from(img.data.buffer, img.data.byteOffset, img.data.length), raw: { width: img.width, height: img.height, channels: 4 }, left: x, top: y });
    }
  });
  let pipe = sharp({ create: { width: W, height: H, channels: 4, background: { r: 40, g: 34, b: 58, alpha: 1 } } }).composite(comps).png();
  const buf = await pipe.toBuffer();
  pipe = sharp(buf);
  if (W > 1600) pipe = pipe.resize({ width: 1600, kernel: 'nearest' });
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await pipe.png().toFile(file);
  await writePixelSheet(done, file.replace(/\.png$/i, '') + '_pixels.png');
}

// Planche des sprites à leur vraie taille en pixels dessinés (ex. 64 px de
// haut), agrandis x4 au plus proche voisin : ce que l'on retoucherait à la main.
// Un lot par ligne, cases de taille commune, pieds alignés.
async function writePixelSheet(done, file) {
  const zoom = 4, gap = 4;
  const all = done.flatMap((d) => d.frames.map((f) => f.small));
  const cw = Math.max(...all.map((s) => s.width)), ch = Math.max(...all.map((s) => s.height));
  const perRow = Math.max(...done.map((d) => d.frames.length));
  const W = (perRow * (cw + gap) + gap) * zoom, H = (done.length * (ch + gap) + gap) * zoom;
  const comps = [];
  done.forEach((d, j) => {
    d.frames.forEach((f, i) => {
      const s = PC.scaleNearest(f.small, zoom);
      comps.push({
        input: Buffer.from(s.data.buffer, s.data.byteOffset, s.data.length), raw: { width: s.width, height: s.height, channels: 4 },
        left: (gap + i * (cw + gap) + Math.floor((cw - f.small.width) / 2)) * zoom,
        top: (gap + j * (ch + gap) + ch - f.small.height) * zoom,
      });
    });
  });
  await sharp({ create: { width: W, height: H, channels: 4, background: { r: 40, g: 34, b: 58, alpha: 1 } } }).composite(comps).png().toFile(file);
  console.log(`pixels : ${file}`);
}

// ------------------------------------------------------------ commandes

async function run(args) {
  const manifests = loadManifests();
  if (args.cmd === 'agarica') {
    // Réglages retenus sur les aperçus du 2026-11-10 (20 couleurs, lignes pixel-perfect).
    args.o.colors = args.o.colors || 20;
    args.o.pixelPerfect = true;
  }
  const sets = args.cmd === 'agarica' ? await agaricaSets(args.o) : resolveSets(args.cmd, args.inputs, manifests);
  const reg = loadRegistry();
  const done = [];
  let failed = 0;
  for (const set of sets) {
    try {
      const res = await processSet(set, args.o, reg);
      done.push(res);
      const w = res.frames[0].small;
      console.log(`${set.name} : ${res.frames.length} image(s), 1 pixel = ${res.factor} px, ` +
        `sujet ~${w.width}x${w.height} pixels dessinés, ${res.frames[0].colors} couleurs${args.o.dry ? ' (rien écrit)' : ''}`);
      if (args.o.dry) continue;
      for (const fr of res.frames) {
        // Variante de test : à côté, dans assets/_pixel/ ; le jeu ne la charge
        // qu'avec ?pixel dans l'adresse (cf. BootScene), l'original reste en place.
        if (args.o.variant) {
          await writeImage(fr.after, variantOf(fr.file));
          reg[relOf(fr.file)] = { f: res.factor, set: set.name, v: 1 };
          continue;
        }
        const orig = originalOf(fr.file);
        if (!fs.existsSync(orig)) {
          fs.mkdirSync(path.dirname(orig), { recursive: true });
          fs.copyFileSync(fr.file, orig);
        }
        await writeImage(fr.after, fr.file);
        reg[relOf(fr.file)] = { f: res.factor, set: set.name };
      }
    } catch (e) {
      failed++;
      console.error(`${set.name} : ECHEC : ${e.message}`);
    }
  }
  if (!args.o.dry) saveRegistry(reg);
  if (args.o.preview && done.length) {
    await writePreview(done, args.o.preview, args.cmd === 'agarica' ? 2 : Infinity);
    console.log(`aperçu : ${args.o.preview}`);
  }
  return failed ? 1 : 0;
}

function restore(args) {
  const manifests = loadManifests();
  const reg = loadRegistry();
  if (!args.inputs.length) throw new Error('restore : indiquer un id, une image ou un dossier');
  const targets = [];
  for (const inp of args.inputs) {
    if (inp === 'agarica') targets.push(...AGARICA_SETS.flatMap((s) => walkPngs(path.join(ROOT, s.dir), [])));
    else if (manifests.TILESET_MANIFEST[inp]) walkPngs(path.join(ROOT, manifests.TILESET_MANIFEST[inp].dir), targets);
    else if (manifests.ASSET_MANIFEST[inp]) targets.push(...resolveSets('anim', [inp], manifests)[0].files);
    else if (manifests.ITEM_MANIFEST[inp]) targets.push(path.join(ROOT, manifests.ITEM_MANIFEST[inp].path));
    else if (fs.existsSync(inp)) walkPngs(path.resolve(inp), targets);
    else throw new Error(`introuvable : ${inp}`);
  }
  let n = 0;
  for (const abs of targets) {
    const entry = reg[relOf(abs)];
    if (entry && entry.v) {
      // variante de test : on retire juste l'image de assets/_pixel/
      if (fs.existsSync(variantOf(abs))) fs.unlinkSync(variantOf(abs));
      delete reg[relOf(abs)];
      n++;
      continue;
    }
    const orig = originalOf(abs);
    if (!fs.existsSync(orig)) continue;
    fs.copyFileSync(orig, abs);
    fs.unlinkSync(orig);
    delete reg[relOf(abs)];
    n++;
  }
  saveRegistry(reg);
  console.log(`${n} image(s) remise(s) à l'original IA`);
  return 0;
}

function list() {
  const reg = loadRegistry();
  const bySet = {};
  for (const [file, v] of Object.entries(reg)) (bySet[v.set] = bySet[v.set] || []).push(file);
  for (const [set, files] of Object.entries(bySet)) console.log(`${set} : ${files.length} image(s), 1 pixel = ${reg[files[0]].f} px`);
  if (!Object.keys(bySet).length) console.log('aucune image refaite');
  return 0;
}

async function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
    if (!args.cmd || args.cmd === '--help' || args.cmd === '-h') {
      console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0].replace(/^[\s\S]*?\/\*\n?/, '').replace(/^ \* ?/gm, ''));
      return args.cmd ? 0 : 2;
    }
    if (args.cmd === 'restore') return restore(args);
    if (args.cmd === 'list') return list();
    return await run(args);
  } catch (e) {
    console.error(`Erreur : ${e.message}`);
    return 2;
  }
}

main().then((code) => { process.exitCode = code; });
