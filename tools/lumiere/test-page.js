#!/usr/bin/env node
'use strict';
/*
 * Parité Node <-> navigateur du calcul « vos images » de la page d'aperçu : `npm run lumiere:test-page`.
 * Construit la page (tools/lumiere/apercu.js) avec des cas d'essai, l'ouvre dans un Chrome / Edge
 * SANS FENÊTRE (--headless --dump-dom), y fait le calcul complet (décodage par canvas), et compare
 * au même calcul fait par Node (décodage par png.js) et aux cartes du jeu. Rien n'est écrit hors
 * de tools/lumiere/sortie/ (ignoré par git).
 * Cas : un asset du jeu tel quel (grizzly, réglages automatiques), un autre en natif recollé sur
 * fond blanc et agrandi x4, la marche d'Agarica (8 images = une animation), Kainati (grand sprite,
 * réglages à l'échelle) seul et en 4 images.
 * Navigateur : variable NAVIGATEUR, sinon Edge / Chrome / Chromium aux emplacements habituels.
 * Code 0 si tout est identique, 1 sinon, 2 sans navigateur.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { pathToFileURL } = require('url');
const C = require('./coeur.js');
const PNG = require('./png.js');
const { construirePage } = require('./apercu.js');

const ROOT = path.resolve(__dirname, '..', '..');
const SORTIE = path.join(__dirname, 'sortie');
const asset = (r) => path.join(ROOT, 'assets', 'sprites', r);
const url = (im) => `data:image/png;base64,${PNG.encoder(im).toString('base64')}`;

function navigateur() {
  const c = [process.env.NAVIGATEUR,
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/microsoft-edge'];
  return c.find((p) => p && fs.existsSync(p));
}

// natif recollé sur un fond blanc (marge 20 px) et agrandi k fois, pixels nets
function surFondBlanc(nat, k) {
  const W = nat.width * k + 40, H = nat.height * k + 40;
  const o = { width: W, height: H, data: new Uint8Array(W * H * 4).fill(255) };
  for (let y = 0; y < nat.height * k; y++) {
    for (let x = 0; x < nat.width * k; x++) {
      const s = (Math.floor(y / k) * nat.width + Math.floor(x / k)) * 4;
      if (nat.data[s + 3] >= 128) o.data.set(nat.data.subarray(s, s + 4), ((y + 20) * W + x + 20) * 4);
    }
  }
  return o;
}

function ecarts(a, b) {   // pixels différents (4 canaux), ou taille
  if (!a || !b) return 'absent';
  if (a.width !== b.width || a.height !== b.height) return `taille ${a.width}x${a.height} / ${b.width}x${b.height}`;
  let d = 0;
  for (let p = 0; p < a.width * a.height; p++) {
    for (let k = 0; k < 4; k++) if (a.data[p * 4 + k] !== b.data[p * 4 + k]) { d++; break; }
  }
  return d;
}
// cartes du jeu : comparées sur les pixels opaques (le jeu les écrit avec png.js)
function ecartsOpaques(a, b) {
  if (a.width !== b.width || a.height !== b.height) return `taille ${a.width}x${a.height} / ${b.width}x${b.height}`;
  let d = 0;
  for (let p = 0; p < a.width * a.height; p++) {
    const oa = a.data[p * 4 + 3] >= 128, ob = b.data[p * 4 + 3] >= 128;
    if (oa !== ob || (oa && [0, 1, 2].some((k) => a.data[p * 4 + k] !== b.data[p * 4 + k]))) d++;
  }
  return d;
}
const depuisB64 = (s) => {
  const [t, b] = s.split(':');
  const [w, h] = t.split('x').map(Number);
  return { width: w, height: h, data: new Uint8Array(Buffer.from(b, 'base64')) };
};

function main() {
  const nav = navigateur();
  if (!nav) { console.error('Aucun Chrome / Edge trouvé : indiquer son chemin dans la variable NAVIGATEUR'); return 2; }
  const griz = PNG.lirePng(asset('grizzly_frames/grizzly_row0_0.png'));
  // grizzly_row0_2 : pas de trou transparent enfermé (un trou enfermé redevient blanc sur fond blanc)
  const grizNat = PNG.lirePng(asset('grizzly_frames/_lumiere/grizzly_row0_2_natif.png'));
  const kai = [0, 1, 2, 3].map((i) => PNG.lirePng(asset(`kainati_frames/kainati_row0_${i}.png`)));
  const marche = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => PNG.lirePng(asset(`agarica_walk_frames/agarica_walk_${i}.png`)));
  const cas = [
    { nom: 'grizzly du jeu (auto)', ims: [griz], reglages: {}, jeu: ['grizzly_frames/_lumiere/grizzly_row0_0'] },
    { nom: 'grizzly (pose 2) natif x4 sur fond blanc (auto)', ims: [surFondBlanc(grizNat, 4)], reglages: {}, jeu: ['grizzly_frames/_lumiere/grizzly_row0_2'] },
    { nom: 'marche d\'Agarica, 8 images (auto)', ims: marche, reglages: {}, jeu: marche.map((_, i) => `agarica_walk_frames/_lumiere/agarica_walk_${i}`) },
    // grand sprite (s > 1) : réglages en pixels à l'échelle ; facteur 1,08 du registre imposé
    { nom: 'Kainati, grand sprite seul (facteur 1,08)', ims: [kai[0]], reglages: { facteur: 1.08 }, jeu: null },
    { nom: 'Kainati, 4 images (facteur 1,08)', ims: kai, reglages: { facteur: 1.08 }, jeu: kai.map((_, i) => `kainati_frames/_lumiere/kainati_row0_${i}`) },
  ];
  const page = construirePage({ titre: 'essai', echelle: 6, assets: [], geoPad: 10 },
    cas.map((c) => ({ nom: c.nom, reglages: c.reglages, images: c.ims.map(url) })));
  fs.mkdirSync(SORTIE, { recursive: true });
  const fichier = path.join(SORTIE, 'test-page.html');
  fs.writeFileSync(fichier, page);
  const profil = fs.mkdtempSync(path.join(os.tmpdir(), 'lumiere-test-'));
  let dom;
  try {
    dom = execFileSync(nav, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
      `--user-data-dir=${profil}`, '--virtual-time-budget=300000', '--dump-dom', pathToFileURL(fichier).href],
    { encoding: 'utf8', maxBuffer: 512 * 1024 * 1024, timeout: 600000, stdio: ['ignore', 'pipe', 'ignore'] });
  } finally {
    fs.rmSync(profil, { recursive: true, force: true });
  }
  const m = /<pre id="resultat"[^>]*>([\s\S]*?)<\/pre>/.exec(dom);
  const brut = m && m[1].replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  if (!brut) { console.error('Pas de résultat dans la page (calcul non terminé ?)'); return 1; }
  const nav_ = JSON.parse(brut);
  let echec = 0;
  console.log('| Cas | Pas détecté (navigateur / Node) | Navigateur = Node | Navigateur = cartes du jeu | Temps navigateur |');
  console.log('|---|---|---|---|---|');
  cas.forEach((c, i) => {
    const b = nav_.cas[i];
    if (!b || b.erreur) { echec++; console.log(`| ${c.nom} | erreur : ${b ? b.erreur : 'absent'} | | | |`); return; }
    const n = C.traiterImages(c.ims, c.reglages);
    let dn = 0, dj = 0;
    const detailJeu = [];
    n.frames.forEach((fr, k) => {
      const bf = b.frames[k];
      for (const q of ['nat', 'neu', 'sec', 'nor', 'cj', 'cjAp']) {
        const e = ecarts(depuisB64(bf[q]), fr[q]);
        dn += typeof e === 'number' ? e : 1e9;
      }
      if (!c.jeu) return;
      const L = (s) => PNG.lirePng(asset(`${c.jeu[k]}_${s}.png`));
      for (const [q, s] of [['nat', 'natif'], ['neu', 'neutre'], ['sec', 'sections'], ['nor', 'n'], ['cj', 'cj']]) {
        const e = ecartsOpaques(depuisB64(bf[q]), L(s));
        if (e !== 0) detailJeu.push(`${s}${n.frames.length > 1 ? ` ${k}` : ''} : ${e}`);
        dj += typeof e === 'number' ? e : 1e9;
      }
    });
    if (dn) echec++;
    console.log(`| ${c.nom} | ${b.f} / ${n.f} | ${dn === 0 ? 'oui, 0 pixel différent' : `NON, ${dn} pixels`} | ${!c.jeu ? '-' : dj === 0 ? 'oui' : `écarts : ${detailJeu.join(', ')}`} | ${b.ms} ms |`);
    if (b.messages.length) console.log(`|  | messages : ${b.messages.join(' ')} | | | |`);
  });
  return echec ? 1 : 0;
}

process.exitCode = main();
