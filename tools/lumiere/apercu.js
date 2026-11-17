#!/usr/bin/env node
'use strict';
/*
 * Page de test AUTONOME de l'éclairage par sections : `npm run lumiere:apercu`.
 * Remplit tools/lumiere/apercu.html (copie du gabarit validé du skill pixel-art-forge) avec les
 * cartes du manifeste src/data/sections.js et l'écrit dans tools/lumiere/sortie/ (ignoré par
 * git). Double-clic sur le fichier, Chrome : lumière à glisser, profondeur (négatif = derrière),
 * contre-jour, portée, paliers, 2e lumière, sens, animation, affichage des sections / normales.
 * Ne lance rien : le chemin de la page est affiché.
 *
 * Usage :
 *   npm run lumiere:apercu                          tous les sprites préparés, une page (sélecteur)
 *   npm run lumiere:apercu -- <anim|png|dossier>... seulement ceux-là (anim = champ `anim` du
 *                    manifeste, ex. agarica_walk ; png = image du jeu ; dossier = ses frames)
 * Options : --regarde gauche (sprites dessinés tournés vers la gauche), --echelle <n> (x6),
 *           --titre <texte>, --out <fichier.html>
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const GEO = require('./geo.js');
const PNG = require('./png.js');

const ROOT = path.resolve(__dirname, '..', '..');
const SORTIE = path.join(__dirname, 'sortie');

function manifeste() {
  const f = path.join(ROOT, 'src', 'data', 'sections.js');
  if (!fs.existsSync(f)) return {};
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(`${fs.readFileSync(f, 'utf8')}\n;this.__r = SECTIONS_LUMIERE;`, ctx);
  return ctx.__r;
}

const uri = (file) => `data:image/png;base64,${fs.readFileSync(file).toString('base64')}`;
const rel = (abs) => path.relative(ROOT, abs).split(path.sep).join('/');

function images(e) {
  const f = (q) => path.join(ROOT, e.d, `${e.n}_${q}.png`);
  for (const q of ['natif', 'neutre', 'n', 'sections', 'cj']) {
    if (!fs.existsSync(f(q))) throw new Error(`${rel(f(q))} absent : relancer npm run sections`);
  }
  // géométrie (lampe cachée, ancienne version v10 de la page) : calculée ici, le jeu n'en a plus besoin
  const nat = PNG.lirePng(f('natif'));
  const masque = new Uint8Array(nat.width * nat.height);
  for (let p = 0; p < masque.length; p++) masque[p] = nat.data[p * 4 + 3] >= 128 ? 1 : 0;
  const g = GEO.geometrie(masque, nat.width, nat.height);
  const geo = `data:image/png;base64,${PNG.encoder({ width: g.width, height: g.height, data: g.data }).toString('base64')}`;
  return { origine: uri(f('natif')), neutre: uri(f('neutre')), normales: uri(f('n')), sections: uri(f('sections')), geo, cj: uri(f('cj')) };
}

function parseArgs(argv) {
  const a = { cibles: [], regarde: 'droite', echelle: 6, titre: '', out: '' };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    const suite = () => { if (i + 1 >= argv.length) throw new Error(`valeur manquante pour ${t}`); return argv[++i]; };
    if (t === '--regarde') a.regarde = suite();
    else if (t === '--echelle') a.echelle = Math.max(1, Math.round(Number(suite())) || 6);
    else if (t === '--titre') a.titre = suite();
    else if (t === '--out') a.out = suite();
    else if (t.startsWith('--')) throw new Error(`option inconnue : ${t}`);
    else a.cibles.push(t);
  }
  return a;
}

function main() {
  let a;
  try { a = parseArgs(process.argv.slice(2)); } catch (e) { console.error(`Erreur : ${e.message}`); return 2; }
  const man = manifeste();
  let cles = Object.keys(man);
  if (!cles.length) { console.error('Aucun sprite préparé (src/data/sections.js vide) : lancer d\'abord npm run sections'); return 1; }
  if (a.cibles.length) {
    const voulu = new Set();
    for (const c of a.cibles) {
      const r = rel(path.resolve(c));
      const trouves = cles.filter((k) => man[k].anim === c || k === r || k.startsWith(`${r}/`));
      if (!trouves.length) { console.error(`Erreur : ${c} absent du manifeste (lancer npm run sections dessus)`); return 1; }
      trouves.forEach((k) => voulu.add(k));
    }
    cles = cles.filter((k) => voulu.has(k));
  }
  // un asset par animation (frames dans l'ordre), un par sprite seul
  const groupes = new Map();
  for (const k of cles) {
    const e = man[k], g = e.anim || e.n;
    if (!groupes.has(g)) groupes.set(g, []);
    groupes.get(g).push(e);
  }
  const assets = [];
  for (const [nom, es] of groupes) {
    es.sort((x, y) => (x.i || 0) - (y.i || 0));
    const frames = es.map((e) => ({ images: images(e) }));
    assets.push(frames.length > 1
      ? { nom, frames, fps: es[0].fps || 12, vitesse: es[0].vitesse || 0, regarde: a.regarde }
      : { nom, images: frames[0].images, regarde: a.regarde });
  }
  const titre = a.titre || (assets.length === 1 ? assets[0].nom : 'Sprites en sections');
  const donnees = { titre, echelle: a.echelle, assets, geoPad: GEO.GEO_PAD };
  const html = fs.readFileSync(path.join(__dirname, 'apercu.html'), 'utf8').replace('/*__DONNEES__*/null', JSON.stringify(donnees));
  const out = a.out ? path.resolve(a.out) : path.join(SORTIE, `${assets.length === 1 ? assets[0].nom : 'sprites'}-lumiere.html`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  console.log(`${assets.length} asset(s) : ${assets.map((x) => x.nom).join(', ')}`);
  console.log(`page : ${out}`);
  return 0;
}

process.exitCode = main();
