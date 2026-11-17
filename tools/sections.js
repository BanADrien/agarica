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
 *                    _lumiere/<nom>_sections.png retouché à la main (puis refait la carte contre-jour)
 *   node tools/sections.js --depuis-cj <png>...        réécrit _lumiere/<nom>_cj.png depuis
 *                    _lumiere/<nom>_cj-apercu.png retouché à la main
 *   node tools/sections.js verifier                    cartes à refaire (sprite changé depuis)
 * Sorties, dans le dossier `_lumiere/` à côté du sprite (le `_` le cache à pixelfix.js) :
 *   <nom>_natif.png     le sprite à sa résolution native (1 pixel dessiné = 1 pixel)
 *   <nom>_neutre.png    couleurs de base en aplats (une couleur par matière), contour et œil gardés
 *   <nom>_sections.png  zones en couleurs franches (1 couleur = 1 direction), RETOUCHABLE
 *   <nom>_n.png         carte de normales (R = x droite, G = y HAUT, B = z vers le spectateur)
 *   <nom>_cj.png        carte CONTRE-JOUR (lampe derrière) : R, G = direction du bord exposé
 *                       (x droite, y HAUT), B = exposition arrière ; seuls ces plans s'allument
 *   <nom>_cj-apercu.png la même en couleurs (teinte = direction, clarté = exposition), RETOUCHABLE
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

// ------------------------------------------------------------ calcul (tools/lumiere/coeur.js)
const COEUR = require('./lumiere/coeur.js');
const { N4, N8, N8_ET_SOI, pyRound, pyMod, compter, plusFrequent, LAB, lin, lab, dist3, hexc, parseHex, rgbInt, M64, XXP1, hashTuple, ordreSet, DIRS, TILT_INC, GBLUR_MIN, RAMP_SPAN, PART_DL, W_GLOBAL, hsv, SECTIONS, sectionNormal, encodeNormal, quantize, nearestCode, f32, rayonGauss, ligneBoite, flouLignes, flouGaussien, hueDiff, clusterRamps, rampBase, offsetsTries, nearestVectors, heriterBord, modeFilter, mergeSmall, analyse, nouvelle, boite, rogner, coller, saveMaps, CJ_PORTEE, CJ_SOMBRE, CJ_CONTOUR, CJ_FRANGE, CJ_LISSE, tasPlusPetit, tasAjouter, tasRetirer, decomposer, voisinDouble, hypotPy, carteCj, pyModF, hsvVersRgb, rgbVersHsv, cjApercu, cjDepuisApercu, normalesDepuisSections, eclairer, planche, miroir, kmeans, paletteLab, appliquerPalette, phaseGrille, echantillonner, accord, calerAxe, calerGrille, meilleurDecalage, lisserTemps, natifSprite, natifsAnimation, sectionsAnimation, cartes, nettoyerAlpha, retirerFond, detecterFacteur, compterCouleurs, reduireCouleurs } = COEUR;

// ------------------------------------------------------------ images (E/S) et mode image peinte (sharp)
async function lirePng(file) { return PNGIO.lirePng(file); }
async function ecrirePng(img, file) { PNGIO.ecrirePng(img, file); }
async function reduirePeint(im, echelle) {   // recadrage, réduction Lanczos (alpha prémultiplié)
  const b = boite(im, 24);
  if (b) im = rogner(im, b);
  const w = Math.max(1, pyRound(im.width * echelle)), h = Math.max(1, pyRound(im.height * echelle));
  const { data } = await chargerSharp()(Buffer.from(im.data.buffer, im.data.byteOffset, im.data.length), {
    raw: { width: im.width, height: im.height, channels: 4 },
  }).resize(w, h, { kernel: 'lanczos3', fit: 'fill' }).raw().toBuffer({ resolveWithObject: true });
  return { width: w, height: h, data: new Uint8Array(data.buffer, data.byteOffset, data.length), crop: b };
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
  return { dir, nom, natif: s('natif'), neutre: s('neutre'), sections: s('sections'), n: s('n'), cj: s('cj'), cjApercu: s('cj-apercu'), apercu: s('apercu') };
}

function facteurDe(file, o, reg) {
  if (o.facteur !== undefined) return o.facteur;
  const e = reg[relOf(file)];
  return e ? e.f : 0;
}

async function ecrireCartes(nat, res, sorties, o) {
  const { neu, sec, nor, cj, cjAp } = cartes(nat, res);
  await ecrirePng(nat, sorties.natif);
  await ecrirePng(neu, sorties.neutre);
  await ecrirePng(sec, sorties.sections);
  await ecrirePng(nor, sorties.n);
  await ecrirePng(cj, sorties.cj);
  await ecrirePng(cjAp, sorties.cjApercu);
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
    const r = natifSprite(hd, f), ph = r.ph, b = r.b;
    nat = r.nat;
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
    W: hd.width, H: hd.height, v: empreinte(file), cj: 1 }, extra || {});
}

// une animation : toutes les frames ENSEMBLE (même toile calée en bas au centre, même grille, mêmes
// matières via une mosaïque, lissage dans le temps)
async function uneAnimation(files, o, reg, man) {
  const hds = [];
  for (const f of files) hds.push(await lirePng(f));
  const fs_ = [...new Set(files.map((f) => facteurDe(f, o, reg)))];
  if (fs_.length > 1) throw new Error(`frames à facteurs différents (${fs_.join(', ')}) : ce ne sont pas les frames d'un même lot pixelfix`);
  const f = fs_[0];
  const peint = o.echelleJeu > 0;
  const nf = natifsAnimation(hds, peint ? 0 : f);
  const { ph, box, decal } = nf;
  let canv = nf.canv, k = !peint && f > 0 ? f : 1, cropPeint = null;
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
  const w = canv[0].width, h = canv[0].height;
  const r = sectionsAnimation(canv, o.garder, o.rampes, peint);
  const res = { info: r.info }, avant = r.avant;
  const cols = [];
  let grille = null;
  for (let i = 0; i < files.length; i++) {
    const s = sortiesDe(files[i]);
    const c = await ecrireCartes(canv[i], r.frames[i], s, o);
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

// carte contre-jour + son aperçu (sections.py : ecrire_cj)
async function ecrireCj(nat, nor, neu, sorties) {
  const cj = carteCj(nat, nor, neu);
  await ecrirePng(cj, sorties.cj);
  await ecrirePng(cjApercu(cj), sorties.cjApercu);
}

// aperçu contre-jour retouché à la main -> _cj.png (rien d'autre ne change)
async function depuisCj(file, man) {
  const s = sortiesDe(file);
  if (!fs.existsSync(s.cjApercu)) throw new Error(`${relOf(s.cjApercu)} absent : lancer d'abord node tools/sections.js ${relOf(file)}`);
  await ecrirePng(cjDepuisApercu(await lirePng(s.cjApercu)), s.cj);
  console.log(`${relOf(s.cj)} réécrite depuis ${path.basename(s.cjApercu)}`);
  if (man[relOf(file)]) man[relOf(file)].v = empreinte(file);
}

async function depuisSections(file, man) {
  const s = sortiesDe(file);
  if (!fs.existsSync(s.sections)) throw new Error(`${relOf(s.sections)} absent : lancer d'abord node tools/sections.js ${relOf(file)}`);
  const { nor, lues } = normalesDepuisSections(await lirePng(s.sections));
  await ecrirePng(nor, s.n);
  console.log(`${relOf(s.n)} recalculée ; sections lues : ${[...lues].sort().join(', ')}`);
  // comme sections.py : la carte contre-jour suit les nouvelles sections (retoucher
  // _cj-apercu.png APRÈS les sections, sinon la retouche est écrasée)
  await ecrireCj(await lirePng(s.natif), nor, await lirePng(s.neutre), s);
  console.log(`${relOf(s.cj)} recalculée`);
  if (man[relOf(file)]) man[relOf(file)].v = empreinte(file);
}

function verifier(man) {
  let n = 0;
  for (const [k, e] of Object.entries(man)) {
    const abs = path.join(ROOT, k);
    const manque = ['neutre', 'n', 'cj'].filter((x) => !fs.existsSync(path.join(ROOT, e.d, `${e.n}_${x}.png`)));
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
    else if (t === '--depuis-cj') a.o.depuisCj = true;
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
    if (a.o.depuisCj) for (const f of files) await depuisCj(f, man);
    else if (a.o.depuisSections) for (const f of files) await depuisSections(f, man);
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
