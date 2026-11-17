// Page d'aperçu : charger SES images pour les essayer sous la lumière (navigateur seulement).
// Embarqué par tools/lumiere/apercu.js avec geo.js et coeur.js (même calcul que tools/sections.js)
// et le gabarit validé (MODELE). La vue d'éclairage est le gabarit tel quel, dans une iframe
// remplie avec DONNEES : à chaque image chargée, l'iframe est refaite avec l'asset en tête de liste.
// Tout reste dans la page : aucune image n'est envoyée nulle part.
/* global SectionsCoeur, LumiereGeo, MODELE, DONNEES_DEPART */
(function () {
  'use strict';
  const C = SectionsCoeur;
  const $ = (id) => document.getElementById(id);
  const D = JSON.parse(JSON.stringify(DONNEES_DEPART));
  D.assets = D.assets || [];
  const perso = [];   // assets de l'utilisateur : { nom, frames: [{ cartes en data URL }] }

  function afficher() {
    const html = MODELE.replace('/*__DONNEES__*/null', () => JSON.stringify(D).replace(/<\//g, '<\\/'));
    const vue = $('vue');
    vue.onload = () => brancherGlisser(vue.contentDocument);
    vue.srcdoc = html;
  }

  // ---------------------------------------------------------------- images <-> RGBA
  // Décodage par le navigateur, sans gestion de couleur ni prémultiplication (les pixels
  // transparents perdent leur couleur : le cœur les remet à 0 des deux côtés).
  async function decoder(blob) {
    const bmp = await createImageBitmap(blob, { premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
    const cv = document.createElement('canvas');
    cv.width = bmp.width; cv.height = bmp.height;
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(bmp, 0, 0);
    const id = ctx.getImageData(0, 0, bmp.width, bmp.height);
    return { width: id.width, height: id.height, data: new Uint8Array(id.data.buffer.slice(0)) };
  }
  function versUrl(im) {
    const cv = document.createElement('canvas');
    cv.width = im.width; cv.height = im.height;
    cv.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(im.data), im.width, im.height), 0, 0);
    return cv.toDataURL('image/png');
  }

  // ---------------------------------------------------------------- calcul
  function reglages() {
    const f = parseFloat(String($('p-facteur').value).replace(',', '.'));
    return { fond: $('p-fond').checked, tol: Math.max(0, Math.min(255, +$('p-tol').value || 0)), facteur: f > 0 ? f : 0 };
  }
  const naturel = (a, b) => a.localeCompare(b, 'fr', { numeric: true });

  async function traiter(fichiers) {
    const liste = [...fichiers].filter((f) => /^image\/(png|jpeg)$/.test(f.type) || /\.(png|jpe?g)$/i.test(f.name)).sort((a, b) => naturel(a.name, b.name));
    if (!liste.length) { etat('Aucune image PNG ou JPG dans ce qui a été déposé.', true); return; }
    etat(`Calcul de ${liste.length > 1 ? `${liste.length} images (une animation)` : liste[0].name}...`);
    await new Promise((r) => setTimeout(r, 30));   // laisser le message s'afficher
    const t0 = performance.now();
    try {
      const ims = [];
      for (const f of liste) ims.push(await decoder(f));
      const r = C.traiterImages(ims, reglages());
      const nom = liste.length > 1 ? liste[0].name.replace(/[_-]?\d*\.(png|jpe?g)$/i, '') || 'animation' : liste[0].name.replace(/\.(png|jpe?g)$/i, '');
      const frames = r.frames.map((c) => ({
        natif: versUrl(c.nat), neutre: versUrl(c.neu), n: versUrl(c.nor), sections: versUrl(c.sec),
        cj: versUrl(c.cj), 'cj-apercu': versUrl(c.cjAp), geo: versUrl(c.geo),
      }));
      const images = (fr) => ({ origine: fr.natif, neutre: fr.neutre, normales: fr.n, sections: fr.sections, geo: fr.geo, cj: fr.cj });
      const asset = frames.length > 1
        ? { nom: `${nom} (vos images)`, frames: frames.map((fr) => ({ images: images(fr) })), fps: 12, vitesse: 0, regarde: 'droite' }
        : { nom: `${nom} (votre image)`, images: images(frames[0]), regarde: 'droite' };
      D.assets.unshift(asset);
      perso.unshift({ nom, frames });
      const w = r.frames[0].nat.width, h = r.frames[0].nat.height;
      etat([`${nom} : ${w} x ${h} pixels dessinés, 1 pixel = ${r.f} px de l'image${r.auto ? ' (détecté)' : ''}, ${frames.length} image(s), ${Math.round(performance.now() - t0)} ms.`]
        .concat(r.messages).join(' '), false, r.messages.some((m) => /mauvais|peinte|Pas de grille/.test(m)));
      $('p-detecte').textContent = `détecté : ${r.f}`;
      telechargements();
      afficher();
    } catch (e) {
      etat(`Impossible : ${e.message}`, true);
    }
  }

  // ---------------------------------------------------------------- interface
  function etat(texte, erreur, prudence) {
    const e = $('p-etat');
    e.textContent = texte;
    e.className = erreur ? 'erreur' : prudence ? 'prudence' : '';
  }
  function telechargements() {
    const box = $('p-telecharger');
    box.textContent = '';
    for (const a of perso) {
      a.frames.forEach((fr, i) => {
        const ligne = document.createElement('div');
        ligne.className = 'ligne-tel';
        const base = a.frames.length > 1 ? `${a.nom}_${i}` : a.nom;
        ligne.append(document.createTextNode(`${base} : `));
        for (const [q, lib] of [['neutre', 'neutre'], ['n', 'normales'], ['sections', 'sections'], ['cj', 'contre-jour'], ['cj-apercu', 'contre-jour (aperçu)']]) {
          const l = document.createElement('a');
          l.href = fr[q]; l.download = `${base}_${q}.png`; l.textContent = lib;
          ligne.append(l, document.createTextNode(' '));
        }
        box.append(ligne);
      });
    }
    box.hidden = !perso.length;
  }
  function brancherGlisser(doc) {
    if (!doc || doc.__perso) return;
    doc.__perso = true;
    doc.addEventListener('dragover', (e) => { e.preventDefault(); document.body.classList.add('survol'); });
    doc.addEventListener('dragleave', () => document.body.classList.remove('survol'));
    doc.addEventListener('drop', (e) => {
      e.preventDefault();
      document.body.classList.remove('survol');
      if (e.dataTransfer && e.dataTransfer.files.length) traiter(e.dataTransfer.files);
    });
  }

  $('p-fichier').addEventListener('change', (e) => { if (e.target.files.length) traiter(e.target.files); e.target.value = ''; });
  $('p-charger').addEventListener('click', () => $('p-fichier').click());
  brancherGlisser(document);
  afficher();

  // ---------------------------------------------------------------- essai sans fenêtre
  // (tools/lumiere/test-page.js, navigateur --headless --dump-dom) : les images d'essai sont des
  // <img> de la page (elles retardent l'événement load, que --dump-dom attend) ; au load, décodage
  // par canvas et calcul complet SANS attente, cartes rendues en base64 dans #resultat pour être
  // comparées au calcul de Node.
  function decoderImg(img) {
    const cv = document.createElement('canvas');
    cv.width = img.naturalWidth; cv.height = img.naturalHeight;
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const id = ctx.getImageData(0, 0, cv.width, cv.height);
    return { width: id.width, height: id.height, data: new Uint8Array(id.data.buffer.slice(0)) };
  }
  if (window.TEST_PERSO) {
    window.addEventListener('load', () => {
      const sortie = { cas: [] };
      const b64 = (im) => {
        let s = '';
        for (let i = 0; i < im.data.length; i += 0x8000) s += String.fromCharCode.apply(null, im.data.subarray(i, i + 0x8000));
        return `${im.width}x${im.height}:${btoa(s)}`;
      };
      window.TEST_PERSO.forEach((cas, i) => {
        try {
          const ims = cas.images.map((_, k) => decoderImg($(`test-${i}-${k}`)));
          const t0 = performance.now();
          const r = C.traiterImages(ims, cas.reglages);
          sortie.cas.push({ nom: cas.nom, f: r.f, messages: r.messages, ms: Math.round(performance.now() - t0),
            frames: r.frames.map((c) => ({ nat: b64(c.nat), neu: b64(c.neu), sec: b64(c.sec), nor: b64(c.nor), cj: b64(c.cj), cjAp: b64(c.cjAp) })) });
        } catch (e) {
          sortie.cas.push({ nom: cas.nom, erreur: String(e && e.message) });
        }
      });
      $('resultat').textContent = JSON.stringify(sortie);
    });
  }
})();
