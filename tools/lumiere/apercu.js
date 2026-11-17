#!/usr/bin/env node
'use strict';
/*
 * Page de test AUTONOME de l'éclairage par sections : `npm run lumiere:apercu`.
 * Remplit tools/lumiere/apercu.html (copie du gabarit validé du skill pixel-art-forge) avec les
 * cartes du manifeste src/data/sections.js et l'écrit dans tools/lumiere/sortie/ (ignoré par
 * git). Double-clic sur le fichier, Chrome : lumière à glisser, profondeur (négatif = derrière),
 * contre-jour, portée, paliers, 2e lumière, sens, animation, affichage des sections / normales.
 * Ne lance rien : le chemin de la page est affiché.
 * VOS IMAGES : en haut de la page, « Charger une image » ou glisser-déposer un PNG / JPG
 * (plusieurs fichiers ensemble = une animation, dans l'ordre des noms). Le calcul complet
 * (fond retiré, taille d'un pixel détectée, neutre, sections, normales, carte contre-jour) se
 * fait DANS la page avec le même code que tools/sections.js (tools/lumiere/coeur.js, embarqué),
 * puis l'image s'affiche sous la même lumière, avec ses cartes à télécharger. Rien n'est envoyé.
 *
 * Usage :
 *   npm run lumiere:apercu                          tous les sprites préparés, une page (sélecteur)
 *   npm run lumiere:apercu -- <anim|png|dossier>... seulement ceux-là (anim = champ `anim` du
 *                    manifeste, ex. agarica_walk ; png = image du jeu ; dossier = ses frames)
 *   npm run lumiere:apercu -- --vide                aucun sprite du jeu : seulement vos images
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

// Page complète : bandeau « vos images » + le gabarit validé (apercu.html, tel quel) dans une
// iframe, refaite à chaque image chargée. Embarque geo.js, coeur.js et perso.js.
// test : liste de cas pour tools/lumiere/test-page.js (aucun dans la page normale).
const enScript = (txt) => txt.replace(/<\//g, '<\\/');
function construirePage(donnees, test) {
  const modele = fs.readFileSync(path.join(__dirname, 'apercu.html'), 'utf8');
  const lire = (n) => fs.readFileSync(path.join(__dirname, n), 'utf8');
  const titre = String(donnees.titre || 'Sprites en sections').replace(/[<&]/g, '');
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titre} - eclairage</title>
<style>
  :root { --fond: #0d0b1a; --panneau: #15121f; --trait: #2a2536; --texte: #d9d4e3; --pale: #8f88a0; --accent: #c9b27a; }
  html, body { margin: 0; height: 100%; background: var(--fond); color: var(--texte); font: 13px/1.4 system-ui, "Segoe UI", sans-serif; }
  body { display: flex; flex-direction: column; }
  #perso { padding: 8px 16px; border-bottom: 1px solid var(--trait); background: var(--panneau); display: flex; flex-wrap: wrap; gap: 6px 16px; align-items: center; }
  #perso b { font-weight: 600; }
  #perso button { background: transparent; color: var(--accent); border: 1px solid var(--accent); border-radius: 4px; padding: 3px 10px; font: inherit; cursor: pointer; }
  #perso input[type=number], #perso input[type=text] { width: 52px; background: var(--fond); color: var(--texte); border: 1px solid var(--trait); border-radius: 4px; padding: 2px 4px; font: inherit; }
  #perso label { display: inline-flex; gap: 5px; align-items: center; color: var(--pale); }
  #perso .pale, #p-detecte { color: var(--pale); }
  #p-etat { flex-basis: 100%; color: var(--pale); }
  #p-etat:empty { display: none; }
  #p-etat.erreur { color: #f08a8a; }
  #p-etat.prudence { color: var(--accent); }
  #p-telecharger { flex-basis: 100%; }
  #p-telecharger a { color: var(--accent); margin-right: 6px; }
  .ligne-tel { color: var(--pale); }
  body.survol #perso { outline: 2px dashed var(--accent); outline-offset: -4px; }
  #vue { flex: 1; width: 100%; border: 0; min-height: 0; }
</style>
</head>
<body>
<div id="perso">
  <b>Vos images</b>
  <button type="button" id="p-charger">Charger une image</button>
  <span class="pale">ou glissez-déposez un PNG / JPG ici (plusieurs = une animation, dans l'ordre des noms)</span>
  <label title="Fond uni (couleur des 4 coins) effacé depuis les bords ; un blanc enfermé, comme un œil, reste."><input type="checkbox" id="p-fond" checked> Retirer le fond</label>
  <label title="Écart de couleur accepté avec la couleur des coins (0-255)">tolérance <input type="number" id="p-tol" min="0" max="255" value="24"></label>
  <label title="Pixels de l'image par pixel dessiné. Vide = détection automatique de la grille.">Taille d'un pixel dessiné <input type="text" id="p-facteur" placeholder="auto"></label>
  <span id="p-detecte"></span>
  <input type="file" id="p-fichier" accept="image/png,image/jpeg" multiple hidden>
  <div id="p-etat"></div>
  <div id="p-telecharger" hidden></div>
</div>
<iframe id="vue" title="Test d'eclairage"></iframe>
<pre id="resultat" hidden></pre>
${test ? test.map((c, i) => c.images.map((u, k) => `<img id="test-${i}-${k}" src="${u}" hidden alt="">`).join(' ')).join(' ') : ''}
<script>${enScript(lire('geo.js'))}</script>
<script>${enScript(lire('coeur.js'))}</script>
<script>
const MODELE = ${enScript(JSON.stringify(modele))};
const DONNEES_DEPART = ${enScript(JSON.stringify(donnees))};
${test ? `window.TEST_PERSO = ${enScript(JSON.stringify(test))};` : ''}
</script>
<script>${enScript(lire('perso.js'))}</script>
</body>
</html>
`;
}

function parseArgs(argv) {
  const a = { cibles: [], regarde: 'droite', echelle: 6, titre: '', out: '', vide: false };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    const suite = () => { if (i + 1 >= argv.length) throw new Error(`valeur manquante pour ${t}`); return argv[++i]; };
    if (t === '--regarde') a.regarde = suite();
    else if (t === '--echelle') a.echelle = Math.max(1, Math.round(Number(suite())) || 6);
    else if (t === '--titre') a.titre = suite();
    else if (t === '--out') a.out = suite();
    else if (t === '--vide') a.vide = true;
    else if (t.startsWith('--')) throw new Error(`option inconnue : ${t}`);
    else a.cibles.push(t);
  }
  return a;
}

function main() {
  let a;
  try { a = parseArgs(process.argv.slice(2)); } catch (e) { console.error(`Erreur : ${e.message}`); return 2; }
  const man = manifeste();
  let cles = a.vide ? [] : Object.keys(man);
  if (!cles.length && !a.vide) { console.error('Aucun sprite préparé (src/data/sections.js vide) : lancer d\'abord npm run sections'); return 1; }
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
  const html = construirePage(donnees);
  const out = a.out ? path.resolve(a.out) : path.join(SORTIE, `${a.vide ? 'vos-images' : assets.length === 1 ? assets[0].nom : 'sprites'}-lumiere.html`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  console.log(`${assets.length} asset(s) : ${assets.map((x) => x.nom).join(', ')}`);
  console.log(`page : ${out}`);
  return 0;
}

if (require.main === module) process.exitCode = main();
module.exports = { construirePage };
