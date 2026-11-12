// Carte du monde (outil de travail) -- la vue : dessin, déplacement, menu du
// clic, notes, portée de saut, panneaux. Le modèle est dans monde.js, le
// chargement des scripts du jeu dans charge.js. Doc : docs/production/CARTE_MONDE.md.
(function () {
  'use strict';

  const M = window.CarteMonde;
  const CASE = M.CASE;
  const $ = (id) => document.getElementById(id);

  const STOCK_NOTES = 'agarica-carte-notes-v1';
  const STOCK_REGLAGES = 'agarica-carte-reglages-v1';

  // Mesures du jeu (docs/production/VAGUE3_DESIGN.md § 0, reprises de PLAN_DEV.md).
  const SAUT = { hauteur: 172, portee: 180, singe: 264, aigle: 284, loup: 376 };

  const COUL = {
    fond: '#0d0b1a', texte: '#e8d9ff', doux: '#a99bd6', bord: '#4a3f6b', lune: '#8fe6c4', rose: '#ff9fc9', violet: '#9c7fe0',
    or: '#ffd95e', ennemi: '#ff5d6c', pnj: '#6fd3ff', feu: '#ffa23f', liane: '#7fdc3a', vent: '#8fd0ff', ours: '#d08a4a',
    epee: '#b8c4d6', loup: '#b9a7ff', mousse: '#9bff5a', piege: '#ff9440', note: '#ffe36e', alerte: '#ff4d5e',
  };

  // Filtres = légende. `formes` : symboles dessinés dans la pastille d'exemple.
  const FILTRES = [
    { id: 'terrain', nom: 'Terrain (sol, branches, troncs)', formes: ['sol'] },
    { id: 'arriere', nom: 'Sol de second plan (décor)', formes: ['solPale'] },
    { id: 'passages', nom: 'Passages : sorties, entrées, traits', formes: ['sortie', 'entree'] },
    { id: 'parcours', nom: 'Parcours : numéros et accès', formes: ['numero'] },
    { id: 'ennemis', nom: 'Ennemis (et patrouilles)', formes: ['ennemi'] },
    { id: 'boss', nom: 'Boss', formes: ['boss'] },
    { id: 'pnj', nom: 'PNJ et repères d\'histoire', formes: ['pnj', 'repere'] },
    { id: 'feux', nom: 'Feux de camp', formes: ['feu'] },
    { id: 'totems', nom: 'Totems (formes)', formes: ['totem'] },
    { id: 'tresors', nom: 'Coffres, cœurs, objets', formes: ['coffre', 'coeur', 'objet'] },
    { id: 'papillons', nom: 'Papillons prisonniers', formes: ['papillon'] },
    { id: 'cassables', nom: 'Cassables : O = ours, É = épée', formes: ['cassableOurs', 'cassableEpee'] },
    { id: 'lianes', nom: 'Lianes', formes: ['liane'] },
    { id: 'courants', nom: 'Courants d\'air', formes: ['courant'] },
    { id: 'mousse', nom: 'Mousse : amas (ours), mur (répulsif)', formes: ['amas', 'murMousse'] },
    { id: 'loup', nom: 'Loup : pistes, plateformes cachées', formes: ['cachee'] },
    { id: 'reprises', nom: 'Points de reprise', formes: ['reprise'] },
    { id: 'declencheurs', nom: 'Déclencheurs (cinématiques)', formes: ['declencheur'] },
    { id: 'dangers', nom: 'Dangers : chute, nappes, pièges', formes: ['chute', 'piege'] },
    { id: 'notes', nom: 'Notes', formes: ['note'] },
    { id: 'controles', nom: 'Contrôles (anomalies)', formes: ['controle'] },
    { id: 'grille', nom: 'Grille de 64 px', formes: ['grille'], defaut: false },
  ];

  const etat = {
    monde: null,
    vue: { x: 0, y: 0, k: 0.05 },
    filtres: {},
    tests: false,
    disposition: 'actes',
    notes: [],
    saut: null,          // { zone, x, y }
    zone: null,          // zone choisie (fiche)
    brouillons: [],
    souris: null,        // { sx, sy }
    pastilles: [],       // symboles dessinés (survol)
    titres: [],          // étiquettes de zone cliquables
    vueRetenue: false,
  };
  for (const f of FILTRES) etat.filtres[f.id] = f.defaut !== false;

  let canvas;
  let ctx;
  let dpr = 1;
  let sale = true;

  // ---------------------------------------------------------------------
  // Réglages et notes (localStorage de la page)
  // ---------------------------------------------------------------------
  function lireJson(cleStock, repli) {
    try {
      const brut = localStorage.getItem(cleStock);
      return brut ? JSON.parse(brut) : repli;
    } catch (e) {
      return repli;
    }
  }
  function ecrireJson(cleStock, valeur) {
    try { localStorage.setItem(cleStock, JSON.stringify(valeur)); } catch (e) { /* stockage indisponible */ }
  }
  let minuterieReglages = null;
  function retenirReglages() {
    clearTimeout(minuterieReglages);
    minuterieReglages = setTimeout(() => ecrireJson(STOCK_REGLAGES, { filtres: etat.filtres, tests: etat.tests, disposition: etat.disposition, vue: etat.vue }), 300);
  }
  function chargerReglages() {
    const r = lireJson(STOCK_REGLAGES, null);
    if (!r) return;
    for (const f of FILTRES) if (r.filtres && typeof r.filtres[f.id] === 'boolean') etat.filtres[f.id] = r.filtres[f.id];
    etat.tests = !!r.tests;
    if (r.disposition === 'monde' || r.disposition === 'actes') etat.disposition = r.disposition;
    if (r.vue && isFinite(r.vue.x) && isFinite(r.vue.y) && r.vue.k > 0) { etat.vue = { x: r.vue.x, y: r.vue.y, k: r.vue.k }; etat.vueRetenue = true; }
  }
  function chargerNotes() {
    const n = lireJson(STOCK_NOTES, []);
    etat.notes = Array.isArray(n) ? n.filter((x) => x && x.zone && isFinite(x.x) && isFinite(x.y)) : [];
  }
  const retenirNotes = () => ecrireJson(STOCK_NOTES, etat.notes);

  // ---------------------------------------------------------------------
  // Géométrie
  // ---------------------------------------------------------------------
  const X = (wx) => (wx - etat.vue.x) * etat.vue.k;
  const Y = (wy) => (wy - etat.vue.y) * etat.vue.k;
  const zonesVisibles = () => etat.monde.zones.filter((z) => etat.tests || z.categorie !== 'test');
  const zoneVisible = (id) => { const z = etat.monde.parId[id]; return !!z && (etat.tests || z.categorie !== 'test'); };
  const caseDe = (v) => Math.floor(v / CASE);
  const coordTexte = (x, y) => `${Math.round(x)}, ${Math.round(y)} / case ${caseDe(x)}, ${caseDe(y)}`;

  function zoneSous(wx, wy) {
    for (const z of zonesVisibles()) {
      if (wx >= z.x && wx <= z.x + z.box.w && wy >= z.y + z.box.top && wy <= z.y + z.box.bottom) return z;
    }
    return null;
  }

  function cadrer(x0, y0, x1, y1, kMax = 1.2) {
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    const marge = 0.08;
    const k = Math.min(kMax, W * (1 - 2 * marge) / Math.max(1, x1 - x0), H * (1 - 2 * marge) / Math.max(1, y1 - y0));
    etat.vue.k = k;
    etat.vue.x = (x0 + x1) / 2 - W / (2 * k);
    etat.vue.y = (y0 + y1) / 2 - H / (2 * k);
    redessiner();
    retenirReglages();
  }
  function toutVoir() {
    let b = null;
    for (const z of zonesVisibles()) {
      const r = [z.x, z.y + z.box.top, z.x + z.box.w, z.y + z.box.bottom];
      b = b ? [Math.min(b[0], r[0]), Math.min(b[1], r[1]), Math.max(b[2], r[2]), Math.max(b[3], r[3])] : r;
    }
    if (b) cadrer(b[0], b[1], b[2], b[3], 1);
  }
  function cadrerZone(z) {
    cadrer(z.x - 200, z.y + z.box.top - 200, z.x + z.box.w + 200, z.y + z.box.bottom + 200, 1);
    choisirZone(z);
  }
  function cadrerPoint(z, x, y, k = 0.6) {
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    etat.vue.k = Math.max(etat.vue.k, k);
    etat.vue.x = z.x + x - W / (2 * etat.vue.k);
    etat.vue.y = z.y + y - H / (2 * etat.vue.k);
    redessiner();
    retenirReglages();
  }

  // ---------------------------------------------------------------------
  // Terrain : un tracé par zone, fait une fois
  // ---------------------------------------------------------------------
  // Les cases d'une même rangée qui se suivent font un seul rectangle (pas de
  // fil clair entre deux cases quand on dézoome).
  function traceCases(cells) {
    const rangees = new Map();
    for (const c of cells) {
      if (!rangees.has(c[1])) rangees.set(c[1], []);
      rangees.get(c[1]).push(c[0]);
    }
    const p = new Path2D();
    for (const [gy, gxs] of rangees) {
      gxs.sort((a, b) => a - b);
      let debut = gxs[0];
      let prec = gxs[0];
      for (let i = 1; i <= gxs.length; i++) {
        if (i < gxs.length && gxs[i] <= prec + 1) { prec = gxs[i]; continue; }
        p.rect(debut * CASE, gy * CASE, (prec - debut + 1) * CASE, CASE + 0.6);
        debut = gxs[i];
        prec = gxs[i];
      }
    }
    return p;
  }
  function preparerTraces() {
    for (const z of etat.monde.zones) {
      z.traces = { sol: traceCases(z.cells), arriere: z.backCells.length ? traceCases(z.backCells) : null };
    }
  }

  const rgba = (hex, a) => {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`;
  };

  // ---------------------------------------------------------------------
  // Symboles (les mêmes sur la carte et dans la légende)
  // ---------------------------------------------------------------------
  function forme(c, type, x, y, r, opt = {}) {
    c.save();
    c.lineWidth = 1.2;
    c.strokeStyle = '#0d0b1a';
    const poly = (pts) => { c.beginPath(); pts.forEach(([px, py], i) => (i ? c.lineTo(x + px * r, y + py * r) : c.moveTo(x + px * r, y + py * r))); c.closePath(); };
    const lettre = (t, coul = '#0d0b1a', taille = r * 1.25) => {
      if (r < 6 && !opt.force) return;
      c.fillStyle = coul;
      c.font = `bold ${Math.round(taille)}px system-ui, sans-serif`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(t, x, y + 0.5);
    };
    switch (type) {
      case 'ennemi':
        c.fillStyle = COUL.ennemi; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.stroke();
        if (opt.code) lettre(opt.code, '#2a0710', r * (opt.code.length > 1 ? 1.0 : 1.25));
        break;
      case 'boss':
        c.fillStyle = COUL.ennemi; poly([[0, -1.7], [1.7, 0], [0, 1.7], [-1.7, 0]]); c.fill();
        c.strokeStyle = '#fff'; c.lineWidth = 1.6; c.stroke(); lettre('B', '#fff', r * 1.5);
        break;
      case 'pnj':
        c.fillStyle = COUL.pnj; c.beginPath(); c.rect(x - r * 0.85, y - r * 0.85, r * 1.7, r * 1.7); c.fill(); c.stroke();
        break;
      case 'repere':
        c.strokeStyle = COUL.pnj; c.lineWidth = 1.6; c.strokeRect(x - r * 0.8, y - r * 0.8, r * 1.6, r * 1.6);
        break;
      case 'feu':
        c.fillStyle = COUL.feu; poly([[0, -1.3], [1.05, 0.9], [-1.05, 0.9]]); c.fill(); c.stroke();
        break;
      case 'totem': {
        const pts = [];
        for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5; const d = i % 2 ? 0.62 : 1.45; pts.push([Math.cos(a) * d, Math.sin(a) * d]); }
        c.fillStyle = COUL.lune; poly(pts); c.fill(); c.stroke();
        break;
      }
      case 'coffre':
        c.fillStyle = COUL.or; c.beginPath(); c.rect(x - r, y - r * 0.75, r * 2, r * 1.5); c.fill(); c.stroke();
        c.fillStyle = '#6b4a12'; c.fillRect(x - r, y - r * 0.2, r * 2, r * 0.32);
        break;
      case 'objet':
        c.fillStyle = COUL.or; poly([[0, -1], [0.85, 0], [0, 1], [-0.85, 0]]); c.fill(); c.stroke();
        break;
      case 'coeur':
        c.fillStyle = COUL.rose; c.beginPath();
        c.moveTo(x, y + r * 1.1);
        c.bezierCurveTo(x - r * 1.9, y - r * 0.2, x - r * 0.9, y - r * 1.5, x, y - r * 0.5);
        c.bezierCurveTo(x + r * 0.9, y - r * 1.5, x + r * 1.9, y - r * 0.2, x, y + r * 1.1);
        c.fill(); c.stroke();
        break;
      case 'papillon':
        c.fillStyle = COUL.rose; poly([[0, 0], [-1.3, -1], [-1.3, 1]]); c.fill(); c.stroke(); poly([[0, 0], [1.3, -1], [1.3, 1]]); c.fill(); c.stroke();
        break;
      case 'reprise':
        c.strokeStyle = '#fff'; c.lineWidth = 1.6; c.beginPath(); c.arc(x, y, r * 0.75, 0, 7); c.stroke();
        break;
      case 'entree':
        c.strokeStyle = '#fff'; c.lineWidth = 1.5; poly([[0, -1], [1, 0], [0, 1], [-1, 0]]); c.stroke();
        break;
      case 'depart':
        c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x - r, y); c.lineTo(x + r, y); c.moveTo(x, y - r); c.lineTo(x, y + r); c.stroke();
        break;
      case 'cassable': case 'cassableOurs': case 'cassableEpee': {
        const ours = type === 'cassableOurs' || opt.par === 'bear';
        c.fillStyle = ours ? COUL.ours : COUL.epee; c.beginPath(); c.rect(x - r, y - r, r * 2, r * 2); c.fill(); c.stroke();
        lettre(ours ? 'O' : 'É');
        break;
      }
      case 'declencheur':
        c.fillStyle = rgba(COUL.violet, 0.9); c.beginPath(); c.arc(x, y, Math.max(2, r * 0.45), 0, 7); c.fill();
        break;
      case 'piege':
        c.strokeStyle = COUL.piege; c.lineWidth = 1.8; poly([[0, -1.1], [1, 0.8], [-1, 0.8]]); c.stroke();
        break;
      case 'note':
        c.fillStyle = COUL.note; c.beginPath(); c.arc(x, y - r * 1.4, r * 1.15, 0, 7); c.fill(); c.stroke();
        poly([[-0.6, -0.6], [0.6, -0.6], [0, 0.5]]); c.fill();
        if (opt.code) { c.fillStyle = '#3a2c00'; c.font = `bold ${Math.round(r * 1.35)}px system-ui, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(opt.code, x, y - r * 1.35); }
        break;
      case 'controle':
        c.strokeStyle = COUL.alerte; c.lineWidth = 2; c.beginPath(); c.arc(x, y, r * 1.2, 0, 7); c.stroke();
        c.fillStyle = COUL.alerte; c.font = `bold ${Math.round(r * 1.6)}px system-ui, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('!', x, y + 0.5);
        break;
      case 'controleInfo':
        c.strokeStyle = rgba(COUL.piege, 0.9); c.lineWidth = 1.5; c.beginPath(); c.arc(x, y, r * 0.9, 0, 7); c.stroke();
        break;
      // Symboles de légende seulement (sur la carte, ce sont des tracés).
      case 'sol': c.fillStyle = '#5f7fc4'; c.fillRect(x - r * 1.4, y - r * 0.5, r * 2.8, r * 1.3); break;
      case 'solPale': c.fillStyle = rgba('#5f7fc4', 0.35); c.fillRect(x - r * 1.4, y - r * 0.5, r * 2.8, r * 1.3); break;
      case 'sortie': c.strokeStyle = COUL.or; c.lineWidth = 2; c.beginPath(); c.moveTo(x - r * 1.3, y); c.lineTo(x + r * 1.1, y); c.moveTo(x + r * 0.3, y - r * 0.8); c.lineTo(x + r * 1.3, y); c.lineTo(x + r * 0.3, y + r * 0.8); c.stroke(); break;
      case 'numero':
        c.fillStyle = COUL.lune; c.beginPath(); c.arc(x, y, r * 1.25, 0, 7); c.fill();
        c.fillStyle = '#0d0b1a'; c.font = `bold ${Math.round(r * 1.5)}px system-ui, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('3', x, y + 0.5);
        break;
      case 'liane': c.strokeStyle = COUL.liane; c.lineWidth = 2.2; c.beginPath(); c.moveTo(x, y - r * 1.3); c.lineTo(x, y + r * 1.3); c.stroke(); c.fillStyle = COUL.liane; c.beginPath(); c.arc(x, y - r * 1.3, 2.2, 0, 7); c.fill(); break;
      case 'courant': c.fillStyle = rgba(COUL.vent, 0.25); c.fillRect(x - r, y - r * 1.3, r * 2, r * 2.6); c.strokeStyle = COUL.vent; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x - r * 0.6, y + r * 0.2); c.lineTo(x, y - r * 0.6); c.lineTo(x + r * 0.6, y + r * 0.2); c.stroke(); break;
      case 'amas': c.fillStyle = rgba(COUL.mousse, 0.55); c.fillRect(x - r, y - r, r * 2, r * 2); break;
      case 'murMousse': c.strokeStyle = COUL.mousse; c.lineWidth = 1.6; c.setLineDash([3, 2]); c.strokeRect(x - r * 0.8, y - r * 1.2, r * 1.6, r * 2.4); break;
      case 'cachee': c.strokeStyle = COUL.loup; c.lineWidth = 1.6; c.setLineDash([3, 2]); c.strokeRect(x - r * 1.3, y - r * 0.6, r * 2.6, r * 1.2); break;
      case 'chute': c.strokeStyle = COUL.ennemi; c.lineWidth = 1.6; c.setLineDash([4, 3]); c.beginPath(); c.moveTo(x - r * 1.4, y); c.lineTo(x + r * 1.4, y); c.stroke(); break;
      case 'grille': c.strokeStyle = rgba(COUL.doux, 0.8); c.lineWidth = 1; c.beginPath(); for (const d of [-1, 0, 1]) { c.moveTo(x + d * r, y - r * 1.2); c.lineTo(x + d * r, y + r * 1.2); c.moveTo(x - r * 1.2, y + d * r); c.lineTo(x + r * 1.2, y + d * r); } c.stroke(); break;
      default: break;
    }
    c.restore();
  }

  // ---------------------------------------------------------------------
  // Dessin
  // ---------------------------------------------------------------------
  function redessiner() { sale = true; }
  function boucle() {
    if (sale && etat.monde) { sale = false; dessiner(); }
    requestAnimationFrame(boucle);
  }

  function texte(c, t, x, y, o = {}) {
    c.font = `${o.gras ? 'bold ' : ''}${o.taille || 11}px system-ui, "Segoe UI", sans-serif`;
    c.textAlign = o.align || 'left';
    c.textBaseline = o.base || 'middle';
    if (o.fond) {
      const w = c.measureText(t).width;
      const h = (o.taille || 11) + 5;
      const x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
      c.fillStyle = o.fond;
      c.fillRect(x0 - 3, y - h / 2, w + 6, h);
    }
    c.fillStyle = o.couleur || COUL.texte;
    c.fillText(t, x, y);
  }

  // Tracés d'une zone dans SON repère (px de jeu) : fond, terrain, zones d'effet.
  function coucheZone(c, z, k) {
    const f = etat.filtres;
    const d = z.data;
    const reg = M.REGIONS[z.region] || M.REGIONS.test;
    const px = (n) => n / k;           // n px d'écran dans le repère de la zone
    const b = z.box;
    c.fillStyle = rgba(reg.sol, 0.07);
    c.fillRect(0, b.top, b.w, b.bottom - b.top);

    if (f.grille && k * CASE >= 7) {
      c.strokeStyle = rgba(COUL.doux, k * CASE >= 20 ? 0.22 : 0.12);
      c.lineWidth = px(1);
      c.beginPath();
      for (let gx = 0; gx * CASE <= b.w; gx++) { c.moveTo(gx * CASE, b.top); c.lineTo(gx * CASE, b.bottom); }
      for (let gy = Math.ceil(b.top / CASE); gy * CASE <= b.bottom; gy++) { c.moveTo(0, gy * CASE); c.lineTo(b.w, gy * CASE); }
      c.stroke();
    }
    if (f.arriere && z.traces.arriere) { c.fillStyle = rgba(reg.sol, 0.28); c.fill(z.traces.arriere); }
    if (f.terrain) {
      c.fillStyle = 'rgba(160,125,90,0.2)';
      for (const t of d.trunks || []) c.fillRect(t.x - 70, t.top, 140, (t.bottom ?? b.bottom) - t.top);
      c.lineCap = 'round';
      c.lineJoin = 'round';
      for (const br of d.branches || []) {
        if (!br.from || !br.to) continue;
        const ep = br.thickness || 60;
        // Pâle : c'est l'image de la branche ; seules ses cases de collision (sol plein) portent.
        c.strokeStyle = br.solid === false ? 'rgba(170,130,90,0.16)' : 'rgba(185,140,95,0.34)';
        c.lineWidth = ep;
        c.beginPath();
        // La surface de marche est le DESSUS de la branche : son corps est dessous.
        c.moveTo(br.from[0], br.from[1] + ep / 2);
        for (const v of br.via || []) c.lineTo(v[0], v[1] + ep / 2);
        c.lineTo(br.to[0], br.to[1] + ep / 2);
        c.stroke();
      }
      c.lineCap = 'butt';
      c.fillStyle = reg.sol;
      c.fill(z.traces.sol);
    }

    for (const m of z.marqueurs) {
      if (!f[m.cat]) continue;
      switch (m.forme) {
        case 'courant': {
          const [x, y, w, h] = m.rect;
          c.fillStyle = rgba(COUL.vent, 0.14); c.fillRect(x, y, w, h);
          c.strokeStyle = rgba(COUL.vent, 0.7); c.lineWidth = px(1.2); c.strokeRect(x, y, w, h);
          c.beginPath();
          const pas = Math.max(120, px(26));
          for (let yy = y + h - pas / 2; yy > y + 20; yy -= pas) { c.moveTo(x + w * 0.25, yy + w * 0.18); c.lineTo(x + w / 2, yy - w * 0.18); c.lineTo(x + w * 0.75, yy + w * 0.18); }
          c.stroke();
          break;
        }
        case 'declencheur': {
          const [x, y, w, h] = m.rect;
          c.fillStyle = rgba(COUL.violet, 0.05); c.fillRect(x, y, w, h);
          c.strokeStyle = rgba(COUL.violet, 0.45); c.lineWidth = px(1); c.setLineDash([px(3), px(3)]); c.strokeRect(x, y, w, h); c.setLineDash([]);
          break;
        }
        case 'amas': case 'murMousse': {
          const [x, y, w, h] = m.rect;
          c.fillStyle = rgba(COUL.mousse, m.forme === 'amas' ? 0.5 : 0.18); c.fillRect(x, y, w, h);
          c.strokeStyle = COUL.mousse; c.lineWidth = px(1.5);
          if (m.forme === 'murMousse') c.setLineDash([px(4), px(3)]);
          c.strokeRect(x, y, w, h); c.setLineDash([]);
          break;
        }
        case 'cassable': {
          const coul = m.par === 'bear' ? COUL.ours : COUL.epee;
          c.fillStyle = rgba(coul, 0.6); c.strokeStyle = coul; c.lineWidth = px(1.4);
          c.beginPath();
          for (const [gx, gy] of m.cases) c.rect(gx * CASE, gy * CASE, CASE, CASE);
          c.fill(); c.stroke();
          c.beginPath();
          for (const [gx, gy] of m.cases) { c.moveTo(gx * CASE, (gy + 1) * CASE); c.lineTo((gx + 1) * CASE, gy * CASE); }
          c.strokeStyle = 'rgba(13,11,26,0.7)'; c.stroke();
          break;
        }
        case 'cachee': {
          const [x, y, w, h] = m.rect;
          c.fillStyle = rgba(COUL.loup, 0.12); c.fillRect(x, y, w, h);
          c.strokeStyle = COUL.loup; c.lineWidth = px(1.5); c.setLineDash([px(4), px(3)]); c.strokeRect(x, y, w, h); c.setLineDash([]);
          break;
        }
        case 'piste':
          c.strokeStyle = COUL.loup; c.lineWidth = px(2); c.setLineDash([px(2), px(4)]);
          c.beginPath(); c.moveTo(m.ligne[0], m.ligne[2]); c.lineTo(m.ligne[1], m.ligne[2]); c.stroke(); c.setLineDash([]);
          break;
        case 'liane':
          c.strokeStyle = COUL.liane; c.lineWidth = Math.max(px(2), 5);
          c.beginPath(); c.moveTo(m.x, m.y); c.lineTo(m.x, m.y + m.longueur); c.stroke();
          c.fillStyle = COUL.liane; c.beginPath(); c.arc(m.x, m.y, Math.max(px(2.5), 7), 0, 7); c.fill();
          break;
        case 'chute':
          c.strokeStyle = rgba(COUL.ennemi, 0.6); c.lineWidth = px(1.3); c.setLineDash([px(6), px(4)]);
          c.beginPath(); c.moveTo(0, m.niveau); c.lineTo(b.w, m.niveau); c.stroke(); c.setLineDash([]);
          break;
        case 'liquide':
          c.fillStyle = 'rgba(90,200,190,0.10)'; c.fillRect(m.x1, m.niveau, m.x2 - m.x1, Math.max(0, b.bottom - m.niveau));
          c.strokeStyle = 'rgba(90,200,190,0.7)'; c.lineWidth = px(1.3);
          c.beginPath(); c.moveTo(m.x1, m.niveau); c.lineTo(m.x2, m.niveau); c.stroke();
          break;
        case 'piege':
          if (m.ligne) {
            c.strokeStyle = COUL.piege; c.lineWidth = px(2);
            c.beginPath(); c.moveTo(m.ligne[0], m.ligne[2] - px(4)); c.lineTo(m.ligne[0], m.ligne[2]); c.lineTo(m.ligne[1], m.ligne[2]); c.lineTo(m.ligne[1], m.ligne[2] - px(4)); c.stroke();
          }
          break;
        case 'ennemi': case 'boss':
          if (m.patrouille) {
            c.strokeStyle = rgba(COUL.ennemi, 0.55); c.lineWidth = px(1.2);
            c.beginPath(); c.moveTo(m.patrouille[0], m.y); c.lineTo(m.patrouille[1], m.y);
            c.moveTo(m.patrouille[0], m.y - px(3)); c.lineTo(m.patrouille[0], m.y + px(3)); c.moveTo(m.patrouille[1], m.y - px(3)); c.lineTo(m.patrouille[1], m.y + px(3)); c.stroke();
          }
          if (m.plage) {
            c.strokeStyle = rgba(COUL.ennemi, 0.5); c.lineWidth = px(2); c.setLineDash([px(8), px(4)]);
            c.beginPath(); c.moveTo(m.plage[0], m.plage[2] - 8); c.lineTo(m.plage[1], m.plage[2] - 8); c.stroke(); c.setLineDash([]);
          }
          break;
        default: break;
      }
    }

    if (f.passages) {
      c.strokeStyle = COUL.or;
      c.lineWidth = px(4);
      c.beginPath();
      for (const p of z.sorties) {
        if (p.type !== 'bord' || !p.vers || !zoneVisible(p.vers)) continue;
        c.moveTo(p.seg[0], p.seg[1]); c.lineTo(p.seg[2], p.seg[3]);
      }
      c.stroke();
    }
  }

  function couleurPassage(p) {
    return p.principal ? COUL.or : '#c79bff';
  }

  function dessinerPassages(c) {
    for (const p of etat.monde.passages) {
      if (!p.vers || !zoneVisible(p.de) || !zoneVisible(p.vers)) continue;
      const a = etat.monde.parId[p.de];
      const b = etat.monde.parId[p.vers];
      const x1 = X(a.x + p.ax);
      const y1 = Y(a.y + p.ay);
      const x2 = X(b.x + p.bx);
      const y2 = Y(b.y + p.by - 30);
      const dx = x2 - x1;
      const dy = y2 - y1;
      const dist = Math.hypot(dx, dy) || 1;
      // Courbe déportée à droite du sens de marche : l'aller et le retour ne se superposent pas.
      const dep = Math.min(60, 10 + dist * 0.16);
      const cx = (x1 + x2) / 2 - dy / dist * dep;
      const cy = (y1 + y2) / 2 + dx / dist * dep;
      const coul = couleurPassage(p);
      c.strokeStyle = coul;
      c.fillStyle = coul;
      // Passage entre deux zones éloignées sur la carte (d'une bande à l'autre,
      // ou monde « pas tout à fait euclidien ») : trait pâle, pour ne pas barrer
      // les zones qu'il survole ; le départ et l'arrivée gardent leur marque.
      const loin = Math.hypot(b.x + p.bx - a.x - p.ax, b.y + p.by - a.y - p.ay) > 5000;
      c.lineWidth = loin ? 1.2 : 1.8;
      c.globalAlpha = loin ? 0.28 : 0.9;
      if (p.type === 'script') c.setLineDash([6, 4]);
      c.beginPath(); c.moveTo(x1, y1); c.quadraticCurveTo(cx, cy, x2, y2); c.stroke();
      c.setLineDash([]);
      c.globalAlpha = 0.9;
      // Départ : point ; arrivée : flèche dans le sens de la fin de courbe.
      c.beginPath(); c.arc(x1, y1, 2.6, 0, 7); c.fill();
      const ang = Math.atan2(y2 - cy, x2 - cx);
      const t = 8;
      c.beginPath();
      c.moveTo(x2, y2);
      c.lineTo(x2 - t * Math.cos(ang - 0.42), y2 - t * Math.sin(ang - 0.42));
      c.lineTo(x2 - t * Math.cos(ang + 0.42), y2 - t * Math.sin(ang + 0.42));
      c.closePath(); c.fill();
      c.globalAlpha = 1;
      p.ecran = { x1, y1, x2, y2, cx, cy };
    }
  }

  function pastillesZone(c, z, k) {
    const f = etat.filtres;
    const r = Math.max(3.5, Math.min(8, 2.6 + k * 14));
    const noms = k >= 0.32;
    for (const m of z.marqueurs) {
      if (!f[m.cat] || m.sansPastille) continue;
      if (['courant', 'amas', 'murMousse', 'cachee', 'piste', 'liane', 'liquide', 'chute'].includes(m.forme)) continue;
      if (m.forme === 'piege' && m.ligne && k < 0.12) continue;
      const sx = X(z.x + m.x);
      const sy = Y(z.y + m.y);
      if (sx < -40 || sy < -40 || sx > canvas.clientWidth + 40 || sy > canvas.clientHeight + 40) continue;
      forme(c, m.forme, sx, sy, r, { code: m.code, par: m.par });
      etat.pastilles.push({ m, sx, sy, r: m.forme === 'boss' ? r * 1.7 : r });
      const nomVisible = m.forme === 'boss' ? k >= 0.1 : noms && m.forme !== 'declencheur' && m.forme !== 'depart';
      if (nomVisible) {
        const lib = m.forme === 'entree' ? m.nom.replace('entrée ', '') : m.nom;
        texte(c, lib, sx + r + 5, sy, { taille: 10.5, couleur: m.forme === 'entree' ? 'rgba(255,255,255,.75)' : COUL.texte, fond: 'rgba(13,11,26,.62)' });
      }
    }
    // Zones d'effet : nom au zoom fort seulement.
    if (k >= 0.45) {
      for (const m of z.marqueurs) {
        if (!f[m.cat]) continue;
        if (!['courant', 'amas', 'murMousse', 'cachee', 'liquide', 'chute'].includes(m.forme)) continue;
        const sx = X(z.x + (m.rect ? m.rect[0] + m.rect[2] / 2 : m.forme === 'chute' ? 140 : m.x));
        const sy = Y(z.y + (m.rect ? m.rect[1] : m.y)) - 9;
        texte(c, m.nom, sx, sy, { taille: 10, align: 'center', couleur: COUL.doux, fond: 'rgba(13,11,26,.55)' });
      }
    }
    // Sorties : « → zone » près du passage.
    if (f.passages && k >= 0.14) {
      for (const p of z.sorties) {
        if (!p.vers || !zoneVisible(p.vers)) continue;
        const cible = etat.monde.parId[p.vers];
        const sx = X(z.x + p.ax);
        const sy = Y(z.y + p.ay);
        const align = p.edge === 'right' ? 'right' : p.edge === 'left' ? 'left' : 'center';
        const dxl = p.edge === 'right' ? -8 : p.edge === 'left' ? 8 : 0;
        const dyl = p.edge === 'top' ? 12 : p.edge === 'bottom' ? -12 : -16;
        texte(c, `→ ${cible.nom}${p.condition && k >= 0.3 ? ` (${p.condition})` : ''}`, sx + dxl, sy + dyl, { taille: 10.5, align, couleur: couleurPassage(p), fond: 'rgba(13,11,26,.7)' });
      }
    }
  }

  function numeroZone(z) {
    return z.etapes.length ? z.etapes.join('·') : '';
  }

  function titreZone(c, z, k) {
    const x0 = X(z.x);
    const y0 = Y(z.y + z.box.top);
    const w = z.box.w * k;
    const h = (z.box.bottom - z.box.top) * k;
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    if (x0 > W || y0 > H || x0 + w < 0 || y0 + h < 0) return;
    const parcours = etat.filtres.parcours;
    const num = parcours ? numeroZone(z) : '';
    const taille = 12;
    c.font = `bold ${taille}px system-ui, "Segoe UI", sans-serif`;
    let nom = z.nom;
    const besoins = parcours && z.acces ? z.acces.besoin : [];
    const largeurFixe = (num ? c.measureText(num).width + 16 : 4) + besoins.length * 15 + 8;
    const place = Math.max(0, Math.min(w, W) - largeurFixe - 4);
    if (c.measureText(nom).width > place) {
      while (nom.length > 1 && c.measureText(`${nom}…`).width > place) nom = nom.slice(0, -1);
      nom = nom.length > 2 ? `${nom}…` : '';
    }
    const wNom = nom ? c.measureText(nom).width : 0;
    const large = largeurFixe + wNom;
    const haut = taille + 8;
    // Étiquette collée en haut à gauche de la boîte, retenue dans l'écran quand on zoome.
    const tx = Math.max(x0 + 2, Math.min(4, x0 + w - large - 2));
    const ty = Math.max(y0 + 2, Math.min(4, y0 + h - haut - 2));
    const coulBord = z.categorie === 'principal' ? (z.optionnelle ? COUL.rose : COUL.lune) : z.categorie === 'facultatif' ? COUL.rose : '#8a8698';
    c.fillStyle = 'rgba(23,17,42,0.88)';
    c.fillRect(tx, ty, large, haut);
    c.strokeStyle = rgba(coulBord, 0.9);
    c.lineWidth = 1;
    c.strokeRect(tx + 0.5, ty + 0.5, large - 1, haut - 1);
    let cx = tx + 4;
    if (num) {
      const wn = c.measureText(num).width + 10;
      c.fillStyle = coulBord;
      c.fillRect(tx + 1, ty + 1, wn, haut - 2);
      c.fillStyle = '#0d0b1a';
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(num, tx + 1 + wn / 2, ty + haut / 2 + 0.5);
      cx = tx + wn + 6;
    }
    if (nom) {
      c.fillStyle = COUL.texte;
      c.textAlign = 'left'; c.textBaseline = 'middle';
      c.fillText(nom, cx, ty + haut / 2 + 0.5);
      cx += wNom + 5;
    }
    for (const bId of besoins) {
      const bs = M.BESOINS[bId];
      if (!bs) continue;
      c.fillStyle = bs.couleur;
      c.beginPath(); c.arc(cx + 6, ty + haut / 2, 6.5, 0, 7); c.fill();
      c.fillStyle = '#0d0b1a';
      c.font = 'bold 9.5px system-ui, sans-serif';
      c.textAlign = 'center';
      c.fillText(bs.code, cx + 6, ty + haut / 2 + 0.5);
      c.font = `bold ${taille}px system-ui, "Segoe UI", sans-serif`;
      cx += 15;
    }
    etat.titres.push({ z, x: tx, y: ty, w: large, h: haut });
  }

  function dessinerSaut(c, k) {
    const s = etat.saut;
    if (!s || !zoneVisible(s.zone)) return;
    const z = etat.monde.parId[s.zone];
    const ox = X(z.x + s.x);
    const oy = Y(z.y + s.y);
    // Arc d'un saut : part des pieds, culmine à `haut` au milieu de `portee`, puis retombe (prolongé sous le niveau de départ).
    const arc = (portee, haut, sens, coul, pointille) => {
      c.strokeStyle = coul; c.lineWidth = 1.8;
      c.setLineDash(pointille ? [5, 4] : []);
      c.beginPath();
      for (let i = 0; i <= 50; i++) {
        const t = i / 40;             // t = 1 : retour au niveau de départ ; au-delà : la chute continue un peu
        const dx = portee * t;
        const u = (dx - portee / 2) / (portee / 2);
        const dy = -haut * (1 - u * u);
        const px = ox + sens * dx * k;
        const py = oy + dy * k;
        if (i) c.lineTo(px, py); else c.moveTo(px, py);
      }
      c.stroke();
      c.setLineDash([]);
    };
    // Surface atteignable au saut simple (voile).
    c.fillStyle = 'rgba(255,255,255,0.07)';
    c.beginPath();
    for (let i = -40; i <= 40; i++) {
      const dx = SAUT.portee * i / 40;
      const u = (Math.abs(dx) - SAUT.portee / 2) / (SAUT.portee / 2);
      const px = ox + dx * k;
      const py = oy - SAUT.hauteur * (1 - u * u) * k;
      if (i === -40) c.moveTo(px, py); else c.lineTo(px, py);
    }
    c.closePath(); c.fill();
    for (const sens of [-1, 1]) {
      arc(SAUT.loup, SAUT.hauteur, sens, COUL.loup, true);
      arc(SAUT.portee, SAUT.hauteur, sens, '#ffffff', false);
    }
    // Hauteurs : saut simple, 2e saut du singe, de l'aigle.
    const ligne = (haut, coul, lib, demi) => {
      const y = oy - haut * k;
      c.strokeStyle = coul; c.lineWidth = 1.4; c.setLineDash([6, 4]);
      c.beginPath(); c.moveTo(ox - demi * k, y); c.lineTo(ox + demi * k, y); c.stroke(); c.setLineDash([]);
      texte(c, lib, ox + demi * k + 6, y, { taille: 10.5, couleur: coul, fond: 'rgba(13,11,26,.7)' });
    };
    ligne(SAUT.hauteur, '#ffffff', `saut simple ${SAUT.hauteur} px`, 110);
    ligne(SAUT.singe, COUL.liane, `2e saut singe ${SAUT.singe} px`, 150);
    ligne(SAUT.aigle, COUL.vent, `2e saut aigle ${SAUT.aigle} px`, 190);
    // Portées au sol.
    c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(ox - SAUT.loup * k, oy); c.lineTo(ox + SAUT.loup * k, oy); c.stroke();
    for (const [d, coul, lib] of [[SAUT.portee, '#ffffff', `${SAUT.portee} px`], [SAUT.loup, COUL.loup, `loup lancé ${SAUT.loup} px`]]) {
      for (const sens of [-1, 1]) {
        const px = ox + sens * d * k;
        c.strokeStyle = coul; c.lineWidth = 1.6;
        c.beginPath(); c.moveTo(px, oy - 6); c.lineTo(px, oy + 6); c.stroke();
        if (sens > 0) texte(c, lib, px, oy + 15, { taille: 10.5, align: 'center', couleur: coul, fond: 'rgba(13,11,26,.7)' });
      }
    }
    // Les pieds.
    c.fillStyle = '#fff'; c.beginPath(); c.arc(ox, oy, 3.5, 0, 7); c.fill();
    texte(c, `pieds : ${coordTexte(s.x, s.y)}`, ox, oy + 30, { taille: 10.5, align: 'center', couleur: '#fff', fond: 'rgba(13,11,26,.7)' });
  }

  function alertesVisibles() {
    return etat.monde.alertes.filter((a) => zoneVisible(a.zone));
  }

  function dessiner() {
    const c = ctx;
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    const k = etat.vue.k;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.fillStyle = COUL.fond;
    c.fillRect(0, 0, W, H);
    etat.pastilles = [];
    etat.titres = [];
    const zs = zonesVisibles().filter((z) => X(z.x) < W && X(z.x + z.box.w) > 0 && Y(z.y + z.box.top) < H && Y(z.y + z.box.bottom) > 0);

    // 1. Fonds, terrain et zones d'effet, dans le repère de chaque zone.
    for (const z of zs) {
      c.setTransform(dpr * k, 0, 0, dpr * k, dpr * X(z.x), dpr * Y(z.y));
      c.save();
      c.beginPath(); c.rect(0, z.box.top, z.box.w, z.box.bottom - z.box.top); c.clip();
      coucheZone(c, z, k);
      c.restore();
    }
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Cadres : chemin principal en vert lunaire, facultatif en rose pointillé, hors chemin en gris.
    for (const z of zs) {
      const fac = z.categorie === 'facultatif' || z.optionnelle;
      c.strokeStyle = z.categorie === 'test' ? '#6d6880' : fac ? rgba(COUL.rose, 0.8) : rgba(COUL.lune, 0.75);
      c.lineWidth = etat.zone === z ? 2.4 : 1.2;
      c.setLineDash(fac ? [6, 4] : []);
      c.strokeRect(X(z.x), Y(z.y + z.box.top), z.box.w * k, (z.box.bottom - z.box.top) * k);
      c.setLineDash([]);
    }
    // Numéros de case sur la grille, au zoom fort.
    if (etat.filtres.grille && k * CASE >= 34) {
      for (const z of zs) {
        const pas = 1;
        for (let gx = 0; gx * CASE < z.box.w; gx += pas) {
          const sx = X(z.x + gx * CASE) + 3;
          if (sx < 0 || sx > W) continue;
          texte(c, String(gx), sx, Math.max(Y(z.y + z.box.top) + 30, 30), { taille: 9.5, couleur: rgba(COUL.doux, 0.9) });
        }
        for (let gy = Math.ceil(z.box.top / CASE); gy * CASE < z.box.bottom; gy++) {
          const sy = Y(z.y + gy * CASE) + 8;
          if (sy < 0 || sy > H) continue;
          texte(c, String(gy), Math.max(X(z.x) + 3, 3), sy, { taille: 9.5, couleur: rgba(COUL.doux, 0.9) });
        }
      }
    }
    // 2. Traits des passages.
    if (etat.filtres.passages) dessinerPassages(c);
    // 3. Symboles.
    for (const z of zs) pastillesZone(c, z, k);
    // 4. Contrôles.
    if (etat.filtres.controles) {
      for (const a of alertesVisibles()) {
        const z = etat.monde.parId[a.zone];
        const sx = X(z.x + a.x);
        const sy = Y(z.y + a.y);
        if (sx < -20 || sy < -20 || sx > W + 20 || sy > H + 20) continue;
        if (a.niveau !== 'alerte' && k < 0.12) continue;
        forme(c, a.niveau === 'alerte' ? 'controle' : 'controleInfo', sx, sy, a.niveau === 'alerte' ? 6 : 5);
        etat.pastilles.push({ m: { nom: a.niveau === 'alerte' ? 'Contrôle' : 'À vérifier', detail: a.texte, x: a.x, y: a.y, zone: a.zone, forme: 'controle' }, sx, sy, r: 7 });
      }
    }
    // 5. Titres des zones.
    for (const z of zs) titreZone(c, z, k);
    // 6. Portée de saut, notes.
    dessinerSaut(c, k);
    if (etat.filtres.notes) {
      etat.notes.forEach((n, i) => {
        if (!zoneVisible(n.zone)) return;
        const z = etat.monde.parId[n.zone];
        const sx = X(z.x + n.x);
        const sy = Y(z.y + n.y);
        forme(c, 'note', sx, sy, 7, { code: String(i + 1) });
        etat.pastilles.push({ m: { nom: `Note ${i + 1}`, detail: n.texte, x: n.x, y: n.y, zone: n.zone, forme: 'note' }, sx, sy: sy - 10, r: 10 });
        if (k >= 0.2) texte(c, n.texte.length > 46 ? `${n.texte.slice(0, 45)}…` : n.texte, sx + 12, sy - 10, { taille: 11, couleur: COUL.note, fond: 'rgba(13,11,26,.8)' });
      });
    }
    majBarre();
  }

  // ---------------------------------------------------------------------
  // Barre du bas, bulle de survol
  // ---------------------------------------------------------------------
  function mondeSousSouris() {
    if (!etat.souris) return null;
    const wx = etat.souris.sx / etat.vue.k + etat.vue.x;
    const wy = etat.souris.sy / etat.vue.k + etat.vue.y;
    const z = zoneSous(wx, wy);
    return { wx, wy, z, x: z ? wx - z.x : null, y: z ? wy - z.y : null };
  }
  function majBarre() {
    const p = mondeSousSouris();
    const zoom = `zoom ${Math.round(etat.vue.k * 100)} %`;
    if (!p || !p.z) { $('barre').textContent = `${zoom} · survole une zone pour lire ses coordonnées · clic : menu (note, éditeur, jouer) · Maj + clic : portée de saut`; return; }
    $('barre').innerHTML = `<b>${p.z.id}</b> · x ${Math.round(p.x)}, y ${Math.round(p.y)} · case ${caseDe(p.x)}, ${caseDe(p.y)} · ${zoom}`;
  }
  function majBulle() {
    const bulle = $('bulle');
    if (!etat.souris || !$('menu').hidden || !$('saisie-note').hidden) { bulle.hidden = true; return; }
    const { sx, sy } = etat.souris;
    let trouve = null;
    let dMin = Infinity;
    for (const p of etat.pastilles) {
      const d = Math.hypot(p.sx - sx, p.sy - sy);
      if (d <= p.r + 5 && d < dMin) { dMin = d; trouve = p.m; }
    }
    if (!trouve) {
      // Zones d'effet (rectangles) sous la souris.
      const p = mondeSousSouris();
      if (p && p.z) {
        for (const m of p.z.marqueurs) {
          if (!etat.filtres[m.cat]) continue;
          if (m.rect && m.forme !== 'declencheur' && p.x >= m.rect[0] && p.x <= m.rect[0] + m.rect[2] && p.y >= m.rect[1] && p.y <= m.rect[1] + m.rect[3]) { trouve = m; break; }
          if (m.forme === 'liane' && Math.abs(p.x - m.x) < 6 / etat.vue.k + 6 && p.y >= m.y - 10 && p.y <= m.y + m.longueur) { trouve = m; break; }
          if (m.forme === 'cassable' && m.cases.some(([gx, gy]) => caseDe(p.x) === gx && caseDe(p.y) === gy)) { trouve = m; break; }
        }
      }
    }
    if (!trouve) { bulle.hidden = true; return; }
    bulle.innerHTML = '';
    const t = document.createElement('b');
    t.textContent = trouve.nom;
    bulle.appendChild(t);
    const l2 = document.createElement('div');
    l2.textContent = `${trouve.zone} (${coordTexte(trouve.x, trouve.y)})`;
    bulle.appendChild(l2);
    if (trouve.detail) { const l3 = document.createElement('div'); l3.className = 'doux'; l3.textContent = trouve.detail; bulle.appendChild(l3); }
    bulle.hidden = false;
    const W = canvas.clientWidth;
    bulle.style.left = `${Math.min(sx + 14, W - bulle.offsetWidth - 6)}px`;
    bulle.style.top = `${Math.max(4, sy - bulle.offsetHeight - 8)}px`;
  }

  // ---------------------------------------------------------------------
  // Liens vers le jeu
  // ---------------------------------------------------------------------
  // « Jouer ici » : raccourci de développement de BootScene (`?zone=…&flags=…&enter=…`).
  // Il n'existe pas de paramètre pour la position : on arrive par l'entrée de la
  // zone la plus proche du point cliqué. Les drapeaux partent de menuChapterState
  // (MenuKit.js), l'état de quelqu'un qui arrive au chapitre de la zone en jouant ;
  // `tout` y ajoute Xara, les trois formes et le fracas de l'ours (pour essayer un
  // passage sans refaire l'histoire). Limite du raccourci : `flags` se découpe sur
  // les virgules, une liste ne passe donc qu'avec UN élément (`perdus` dit lesquelles
  // ont été raccourcies : sac, compétences).
  function drapeauxPour(z, tout) {
    let v = {};
    if (z.chapitre >= 0 && typeof window.menuChapterState === 'function') {
      try { v = window.menuChapterState(z.chapitre) || {}; } catch (e) { v = {}; }
    }
    if (tout) {
      Object.assign(v, { xaraMet: true, hasWolfForm: true, hasMonkeyForm: true, hasEagleForm: true });
      if (!v.airForm) v.airForm = 'monkey';
      if (!v.unlockedSkills) v.unlockedSkills = ['ours'];
      if (!v.skillSlots) v.skillSlots = ['ours'];
    }
    // Le loup doit être dans un emplacement (Player.formEquipped) ; la forme
    // aérienne, elle, se déduit de `airForm` (Player.applyAirForm).
    if (v.hasWolfForm) v.equippedForms = ['wolf']; else delete v.equippedForms;
    const bouts = [];
    const perdus = [];
    for (const [nom, val] of Object.entries(v)) {
      if (val === true) bouts.push(nom);
      else if (typeof val === 'string' || typeof val === 'number' || val === false) bouts.push(`${nom}=${val}`);
      else if (Array.isArray(val)) {
        const utiles = val.filter((e) => typeof e === 'string');
        if (!utiles.length) continue;
        // Emplacements : le premier ; sac et compétences : le dernier obtenu.
        bouts.push(`${nom}=["${utiles[nom === 'skillSlots' || nom === 'equippedForms' ? 0 : utiles.length - 1]}"]`);
        if (utiles.length > 1 && nom !== 'skillSlots') perdus.push(nom === 'inventory' ? 'sac' : nom === 'unlockedSkills' ? 'compétences' : nom);
      }
    }
    return { flags: bouts.filter((b) => !b.includes(',')).join(','), perdus };
  }
  function entreeProche(z, x, y) {
    let best = null;
    let dMin = Infinity;
    for (const e of z.data.entries || []) {
      if (!e || !e.id) continue;
      const d = Math.hypot(e.x - x, (e.y ?? 400) - y);
      if (d < dMin) { dMin = d; best = e; }
    }
    return best;
  }
  function lienJouer(z, x, y, tout) {
    // Adresse écrite lisiblement (virgules et = gardés tels quels dans `flags`).
    let url = `index.html?zone=${encodeURIComponent(z.region === 'test' ? z.scene : z.id)}`;
    const fl = drapeauxPour(z, tout).flags;
    if (fl) url += `&flags=${fl.split(',').map((b) => b.split('=').map(encodeURIComponent).join('=')).join(',')}`;
    const e = entreeProche(z, x, y);
    if (e) url += `&enter=${encodeURIComponent(e.id)}`;
    return url;
  }

  // « Ouvrir dans l'éditeur » : l'éditeur (`index.html?editor`) démarre sur un
  // niveau vide et n'a pas de paramètre de zone (on la choisit dans sa liste).
  // On ouvre donc l'éditeur dans un onglet, puis on lui demande de charger la
  // zone avec SA fonction (EditorScene.loadZone, celle de sa liste) et de se
  // placer sur le point cliqué. Rien n'est modifié dans le jeu.
  const LIEN_EDITEUR = 'index.html?editor';
  let fenEditeur = null;
  function editeurDe(w) {
    try {
      const jeu = w && !w.closed && w.__game;
      if (!jeu || !/[?&]editor\b/.test(w.location.search)) return null;
      const ed = jeu.scene.getScene('EditorScene');
      return ed && ed.sys.isActive() && ed.cameras && ed.cameras.main && Array.isArray(ed.markers) && typeof ed.loadZone === 'function' ? ed : null;
    } catch (e) {
      return null;
    }
  }
  async function chargerDansEditeur(ed, z, x, y) {
    await ed.loadZone(z.id);
    const cam = ed.cameras.main;
    cam.scrollX = x - cam.width / 2;
    cam.scrollY = y - cam.height / 2;
  }
  function ouvrirEditeur(z, x, y) {
    const deja = editeurDe(fenEditeur);
    if (deja) {
      if (!window.confirm(`L'éditeur est déjà ouvert. Charger « ${z.id} » remplace le niveau en cours : ses modifications non enregistrées seront perdues. Continuer ?`)) return;
      chargerDansEditeur(deja, z, x, y).then(() => { try { fenEditeur.focus(); } catch (e) { /* onglet inaccessible */ } annoncer(`Éditeur : ${z.id} chargée.`); });
      return;
    }
    fenEditeur = window.open(LIEN_EDITEUR, 'agarica-editeur');
    if (!fenEditeur) { annoncer('Le navigateur a bloqué l\'ouverture de l\'onglet. Autorise les fenêtres pour cette page.'); return; }
    annoncer(`Ouverture de l'éditeur sur ${z.id}…`);
    const debut = Date.now();
    const attente = setInterval(() => {
      const ed = editeurDe(fenEditeur);
      if (ed) {
        clearInterval(attente);
        chargerDansEditeur(ed, z, x, y).then(() => annoncer(`Éditeur : ${z.id} chargée.`)).catch(() => annoncer(`Éditeur ouvert : choisis « ${z.id} » dans sa liste « Charger une zone ».`));
      } else if (Date.now() - debut > 90000 || (fenEditeur && fenEditeur.closed)) {
        clearInterval(attente);
        annoncer(`Éditeur : choisis « ${z.id} » dans sa liste « Charger une zone ».`);
      }
    }, 300);
  }

  let minuterieAnnonce = null;
  function annoncer(t) {
    const a = $('annonce');
    a.textContent = t;
    a.hidden = false;
    clearTimeout(minuterieAnnonce);
    minuterieAnnonce = setTimeout(() => { a.hidden = true; }, 4500);
  }

  // ---------------------------------------------------------------------
  // Menu du clic, notes, portée de saut
  // ---------------------------------------------------------------------
  let pointMenu = null;
  function placerFlottant(el, sx, sy) {
    const zone = $('centre');
    el.hidden = false;
    el.style.left = `${Math.max(6, Math.min(sx + 4, zone.clientWidth - el.offsetWidth - 6))}px`;
    el.style.top = `${Math.max(6, Math.min(sy + 4, zone.clientHeight - el.offsetHeight - 6))}px`;
  }
  function fermerFlottants() {
    $('menu').hidden = true;
    $('saisie-note').hidden = true;
  }
  function ouvrirMenu(z, x, y, sx, sy) {
    fermerFlottants();
    pointMenu = { z, x: Math.round(x), y: Math.round(y) };
    $('menu-titre').textContent = `${z.id} (${coordTexte(x, y)})`;
    // « Jouer ici » : toutes les formes (le plus pratique pour essayer un passage) ;
    // la ligne suivante : l'état réel de quelqu'un qui commence le chapitre de la zone.
    $('menu-jouer').href = lienJouer(z, x, y, true);
    const ch = z.chapitre >= 0 ? etat.monde.chapitres[z.chapitre] : null;
    $('menu-jouer-chapitre').hidden = !ch;
    if (ch) {
      $('menu-jouer-chapitre').href = lienJouer(z, x, y, false);
      $('menu-jouer-chapitre').textContent = `Jouer ici, comme au début du chapitre « ${ch.name} »`;
    }
    const e = entreeProche(z, x, y);
    const perdus = drapeauxPour(z, true).perdus;
    $('menu-jouer-info').textContent = `Jouer ici : Xara, loup, singe, aigle et ours donnés ; ${e ? `arrivée par l'entrée la plus proche (${e.id})` : 'arrivée au point de départ de la zone'}${perdus.length ? ` ; ${perdus.join(' et ')} : un seul élément passe par l'adresse` : ''}.`;
    $('menu-editeur').href = LIEN_EDITEUR;
    $('menu-editeur').dataset.zone = z.id;
    placerFlottant($('menu'), sx, sy);
    $('bulle').hidden = true;
    choisirZone(z);
  }
  function ouvrirSaisieNote(sx, sy) {
    const p = pointMenu;
    if (!p) return;
    $('menu').hidden = true;
    $('note-titre').textContent = `Note — ${p.z.id} (${coordTexte(p.x, p.y)})`;
    $('note-texte').value = '';
    placerFlottant($('saisie-note'), sx, sy);
    $('note-texte').focus();
  }
  function enregistrerNote() {
    const t = $('note-texte').value.trim();
    if (!t || !pointMenu) { $('saisie-note').hidden = true; return; }
    etat.notes.push({ id: Date.now().toString(36), zone: pointMenu.z.id, x: pointMenu.x, y: pointMenu.y, texte: t, date: new Date().toISOString() });
    retenirNotes();
    $('saisie-note').hidden = true;
    majNotes();
    redessiner();
  }
  function poserSaut(z, x, y) {
    // Les pieds se posent sur le sol juste sous le point (s'il y en a un à moins de 200 px).
    const s = M.surfaceSous(z, x, y, 200);
    etat.saut = { zone: z.id, x: Math.round(x), y: s != null ? s : Math.round(y) };
    $('saut-etat').textContent = `Depuis ${z.id} (${coordTexte(etat.saut.x, etat.saut.y)})${s != null ? ', pieds posés sur le sol' : ', en l\'air'}.`;
    redessiner();
  }

  function texteNotes() {
    return etat.notes.map((n) => `${n.zone} (${coordTexte(n.x, n.y)}) : ${n.texte.replace(/\s*\n\s*/g, ' / ')}`).join('\n');
  }
  async function copier(t) {
    try {
      await navigator.clipboard.writeText(t);
      return true;
    } catch (e) {
      const ta = $('texte-notes');
      ta.value = t;
      ta.select();
      try { return document.execCommand('copy'); } catch (e2) { return false; }
    }
  }

  function majNotes() {
    $('compte-notes').textContent = etat.notes.length ? `(${etat.notes.length})` : '';
    const liste = $('liste-notes');
    liste.innerHTML = '';
    if (!etat.notes.length) {
      const vide = document.createElement('p');
      vide.className = 'doux';
      vide.textContent = 'Aucune note. Clique un point d\'une zone, puis « Ajouter une note ici ».';
      liste.appendChild(vide);
    }
    etat.notes.forEach((n, i) => {
      const li = document.createElement('div');
      li.className = 'note';
      const tete = document.createElement('div');
      tete.className = 'note-tete';
      const lien = document.createElement('button');
      lien.className = 'lien';
      lien.textContent = `${i + 1}. ${n.zone} (${coordTexte(n.x, n.y)})`;
      lien.title = 'Cadrer cet endroit';
      lien.addEventListener('click', () => { const z = etat.monde.parId[n.zone]; if (z) { if (z.categorie === 'test' && !etat.tests) basculerTests(true); cadrerPoint(z, n.x, n.y); } });
      const suppr = document.createElement('button');
      suppr.className = 'petit';
      suppr.textContent = 'Supprimer';
      suppr.addEventListener('click', () => { etat.notes.splice(i, 1); retenirNotes(); majNotes(); redessiner(); });
      tete.appendChild(lien);
      tete.appendChild(suppr);
      const corps = document.createElement('div');
      corps.textContent = n.texte;
      li.appendChild(tete);
      li.appendChild(corps);
      liste.appendChild(li);
    });
    $('texte-notes').value = texteNotes();
    $('btn-copier').disabled = !etat.notes.length;
    $('btn-vider').disabled = !etat.notes.length;
  }

  // ---------------------------------------------------------------------
  // Panneaux : zones, filtres, fiche, contrôles
  // ---------------------------------------------------------------------
  function pastillesBesoin(z) {
    const span = document.createElement('span');
    span.className = 'besoins';
    for (const bId of (z.acces ? z.acces.besoin : [])) {
      const bs = M.BESOINS[bId];
      if (!bs) continue;
      const p = document.createElement('i');
      p.textContent = bs.code;
      p.style.background = bs.couleur;
      p.title = bs.nom;
      span.appendChild(p);
    }
    return span;
  }
  function compte(z, cats) {
    return z.marqueurs.filter((m) => cats.includes(m.cat)).length;
  }
  function majListeZones() {
    const liste = $('liste-zones');
    liste.innerHTML = '';
    const groupe = (titre) => { const h = document.createElement('h3'); h.textContent = titre; liste.appendChild(h); };
    const ligne = (z, num) => {
      const b = document.createElement('button');
      b.className = `zone ${z.categorie}${z.optionnelle ? ' optionnelle' : ''}${etat.zone === z ? ' choisie' : ''}`;
      b.dataset.zone = z.id;
      const n = document.createElement('span');
      n.className = 'num';
      n.textContent = num;
      const nom = document.createElement('span');
      nom.className = 'nom';
      nom.textContent = z.nom;
      b.appendChild(n);
      b.appendChild(nom);
      b.appendChild(pastillesBesoin(z));
      if (etat.brouillons.includes(z.id)) { const br = document.createElement('span'); br.className = 'brouillon'; br.textContent = 'brouillon'; br.title = 'Un brouillon de l\'éditeur existe : le jeu et l\'éditeur l\'utilisent, la carte montre le fichier.'; b.appendChild(br); }
      const e = compte(z, ['ennemis', 'boss']);
      const s = compte(z, ['tresors', 'papillons', 'cassables']);
      const c = document.createElement('span');
      c.className = 'compte';
      c.textContent = `${e ? `${e} enn.` : ''}${e && s ? ' · ' : ''}${s ? `${s} secr.` : ''}`;
      b.appendChild(c);
      b.title = `${z.id}${z.acces ? ` — pour entrer : ${z.acces.texte}` : ''}${z.notesParcours.length ? ` — ${z.notesParcours.join(' ; ')}` : ''}`;
      b.addEventListener('click', () => cadrerZone(z));
      liste.appendChild(b);
    };
    groupe('Chemin principal');
    const vus = new Set();
    M.PARCOURS.forEach((p) => {
      const z = etat.monde.parId[p.zone];
      if (!z || vus.has(z.id)) return;
      vus.add(z.id);
      ligne(z, numeroZone(z));
    });
    groupe('Zones facultatives (vague 3)');
    for (const z of etat.monde.zones) if (z.categorie === 'facultatif') ligne(z, '+');
    if (etat.tests) {
      groupe('Hors chemin (tests, monde spirituel)');
      for (const z of etat.monde.zones) if (z.categorie === 'test') ligne(z, '·');
    }
  }

  function majFiltres() {
    const boite = $('filtres');
    boite.innerHTML = '';
    for (const f of FILTRES) {
      const lab = document.createElement('label');
      lab.className = 'filtre';
      const chk = document.createElement('input');
      chk.type = 'checkbox';
      chk.checked = !!etat.filtres[f.id];
      chk.dataset.filtre = f.id;
      chk.addEventListener('change', () => { etat.filtres[f.id] = chk.checked; retenirReglages(); redessiner(); });
      const cv = document.createElement('canvas');
      const n = f.formes.length;
      cv.width = 22 * n * 2;
      cv.height = 36;
      cv.style.width = `${22 * n}px`;
      cv.style.height = '18px';
      const cc = cv.getContext('2d');
      cc.scale(2, 2);
      f.formes.forEach((fo, i) => forme(cc, fo, 11 + i * 22, fo === 'note' ? 14 : 9, fo === 'boss' ? 3.6 : fo === 'note' ? 4.4 : 5.2, { force: true }));
      const t = document.createElement('span');
      t.textContent = f.nom;
      lab.appendChild(chk);
      lab.appendChild(cv);
      lab.appendChild(t);
      boite.appendChild(lab);
    }
  }

  function choisirZone(z) {
    if (etat.zone === z) return;
    etat.zone = z;
    majFiche();
    document.querySelectorAll('#liste-zones .zone').forEach((b) => b.classList.toggle('choisie', b.dataset.zone === z.id));
    redessiner();
  }
  function majFiche() {
    const z = etat.zone;
    const f = $('fiche-zone');
    f.innerHTML = '';
    if (!z) { f.textContent = 'Clique une zone (sur la carte ou dans la liste).'; return; }
    const add = (balise, txt, cls) => { const e = document.createElement(balise); if (txt != null) e.textContent = txt; if (cls) e.className = cls; f.appendChild(e); return e; };
    add('div', `${z.etapes.length ? `${numeroZone(z)} · ` : ''}${z.nom}`, 'fiche-titre');
    add('div', `${z.id} · ${z.scene}${z.nomJeu && z.nomJeu !== z.nom ? ` · « ${z.nomJeu} »` : ''}`, 'doux');
    const reg = M.REGIONS[z.region];
    add('div', `${reg ? reg.nom : z.region} · ${z.box.w} × ${z.box.bottom - z.box.top} px (y ${z.box.top} à ${z.box.bottom}) · ${Math.round(z.box.w / CASE)} cases de large`, 'doux');
    add('div', z.categorie === 'principal' ? (z.optionnelle ? 'Chemin principal, étape optionnelle' : 'Chemin principal') : z.categorie === 'facultatif' ? 'Zone facultative' : 'Hors chemin', 'etiquette');
    if (z.notesParcours.length) add('div', z.notesParcours.join(' ; '));
    if (etat.brouillons.includes(z.id)) add('div', 'Brouillon de l\'éditeur présent dans ce navigateur : le jeu et l\'éditeur jouent le brouillon, la carte montre le fichier.', 'avert');
    if (z.acces) add('div', `Pour entrer : ${z.acces.texte}`, 'acces');
    for (const a of z.accesDeduit) add('div', `${a.type === 'script' ? 'Passage fait par un script' : 'Lu dans les données'} (depuis ${a.depuis}) : ${a.texte}`, 'doux');
    const passages = (titre, liste, sens) => {
      if (!liste.length) return;
      add('h4', titre);
      for (const p of liste) {
        const autre = etat.monde.parId[sens === 'vers' ? p.vers : p.de];
        const b = add('button', `${sens === 'vers' ? '→' : '←'} ${autre ? autre.nom : p.sceneCible}${p.edge ? ` (bord ${M.bordNom(p.edge)})` : p.type === 'script' ? ' (script)' : ''}${p.condition ? ` : ${p.condition}` : ''}`, 'lien bloc');
        if (autre) b.addEventListener('click', () => { if (autre.categorie === 'test' && !etat.tests) basculerTests(true); cadrerZone(autre); });
      }
    };
    passages('Sorties', z.sorties, 'vers');
    passages('Arrivées', z.entrants, 'de');
    add('h4', 'Contenu');
    const noms = { ennemis: 'ennemis', boss: 'boss', pnj: 'PNJ et repères', feux: 'feux de camp', totems: 'totems', tresors: 'coffres, cœurs, objets', papillons: 'papillons', cassables: 'cassables', lianes: 'lianes', courants: 'courants d\'air', mousse: 'mousse', loup: 'pistes et plateformes du loup', reprises: 'points de reprise', declencheurs: 'déclencheurs' };
    const bouts = [];
    for (const [cat, nom] of Object.entries(noms)) { const n = compte(z, [cat]); if (n) bouts.push(`${n} ${nom}`); }
    add('div', bouts.length ? bouts.join(' · ') : 'Rien encore : terrain et passages seulement (squelette).', bouts.length ? '' : 'avert');
    const al = etat.monde.alertes.filter((a) => a.zone === z.id && a.niveau === 'alerte').length;
    if (al) add('div', `${al} contrôle${al > 1 ? 's' : ''} à regarder (panneau « Contrôles »).`, 'avert');
  }

  function majControles() {
    const liste = $('liste-controles');
    liste.innerHTML = '';
    const toutes = alertesVisibles();
    // Regroupe les contrôles du même type dans une zone (ex. les coins).
    const groupes = [];
    const parCle = {};
    for (const a of toutes) {
      if (a.type) {
        const kk = `${a.zone}|${a.type}`;
        if (!parCle[kk]) { parCle[kk] = { ...a, n: 0, premier: a }; groupes.push(parCle[kk]); }
        parCle[kk].n += 1;
      } else groupes.push({ ...a, n: 1, premier: a });
    }
    groupes.sort((a, b) => (a.niveau === b.niveau ? 0 : a.niveau === 'alerte' ? -1 : 1));
    const nA = toutes.filter((a) => a.niveau === 'alerte').length;
    $('compte-controles').textContent = `(${nA} à corriger, ${toutes.length - nA} à vérifier)`;
    if (!groupes.length) { const p = document.createElement('p'); p.className = 'doux'; p.textContent = 'Rien à signaler.'; liste.appendChild(p); }
    for (const g of groupes) {
      const b = document.createElement('button');
      b.className = `controle ${g.niveau}`;
      const txt = g.n > 1 ? `${g.n} × ${g.type === 'coin' ? 'deux cases de sol se touchent par un seul coin (règle du 2026-11-09)' : g.type === 'entree' ? 'entrée visée par aucune sortie connue' : g.texte}` : g.texte;
      b.textContent = `${g.zone} (${coordTexte(g.x, g.y)}) : ${txt}`;
      b.addEventListener('click', () => { const z = etat.monde.parId[g.zone]; cadrerPoint(z, g.x, g.y); choisirZone(z); });
      liste.appendChild(b);
    }
  }

  // Le monde en texte (zones visibles, dans l'ordre du jeu) : à coller dans une
  // conversation avec Claude pour lui donner la vue d'ensemble sans capture.
  function resumeMonde() {
    const noms = { ennemis: 'ennemis', boss: 'boss', pnj: 'PNJ', feux: 'feux', totems: 'totems', tresors: 'coffres/cœurs/objets', papillons: 'papillons', cassables: 'cassables', lianes: 'lianes', courants: 'courants', mousse: 'mousse', reprises: 'reprises', declencheurs: 'déclencheurs' };
    const lignes = [`Carte du monde de Legend of Agarica : ${zonesVisibles().length} zones (x, y en px de la zone ; case = 64 px).`];
    for (const z of zonesVisibles()) {
      const contenu = Object.entries(noms).map(([cat, nom]) => { const n = compte(z, [cat]); return n ? `${n} ${nom}` : ''; }).filter(Boolean).join(', ');
      const sorties = z.sorties.filter((p) => p.vers).map((p) => `${p.vers}${p.edge ? ` (bord ${M.bordNom(p.edge)})` : ' (script)'}${p.condition ? ` [${p.condition}]` : ''}`).join(' ; ');
      lignes.push(`- ${z.etapes.length ? `étape ${numeroZone(z)}` : z.categorie === 'facultatif' ? 'facultative' : 'hors chemin'} · ${z.id} « ${z.nom} » · ${z.box.w} × ${z.box.bottom - z.box.top} px (y ${z.box.top} à ${z.box.bottom})${z.acces ? ` · pour entrer : ${z.acces.texte}` : ''} · sorties : ${sorties || 'aucune'} · ${contenu || 'terrain et passages seulement'}`);
    }
    const al = alertesVisibles();
    if (al.length) {
      lignes.push('Contrôles :');
      for (const a of al) lignes.push(`- ${a.niveau === 'alerte' ? 'à corriger' : 'à vérifier'} · ${a.zone} (${coordTexte(a.x, a.y)}) : ${a.texte}`);
    }
    return lignes.join('\n');
  }

  function basculerTests(v) {
    etat.tests = v;
    $('chk-tests').checked = v;
    majListeZones();
    majControles();
    retenirReglages();
    redessiner();
  }

  // Brouillons de l'éditeur (IndexedDB, lecture seule) : le jeu joue le brouillon
  // d'une zone s'il existe (resolveZoneData, LevelKit.js). On n'ouvre la base que
  // si elle existe déjà, pour ne jamais la créer d'ici.
  async function lireBrouillons() {
    try {
      const nom = window.CarteCharge.lireGlobale('ZONE_DRAFTS_IDB_NAME');
      const magasin = window.CarteCharge.lireGlobale('ZONE_DRAFTS_IDB_STORE');
      if (!nom || !magasin || !indexedDB.databases) return [];
      const bases = await indexedDB.databases();
      if (!bases.some((b) => b.name === nom)) return [];
      return await new Promise((resolve) => {
        const req = indexedDB.open(nom);
        req.onerror = () => resolve([]);
        req.onsuccess = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(magasin)) { db.close(); resolve([]); return; }
          const r = db.transaction(magasin, 'readonly').objectStore(magasin).getAllKeys();
          r.onsuccess = () => { db.close(); resolve(r.result.map(String)); };
          r.onerror = () => { db.close(); resolve([]); };
        };
      });
    } catch (e) {
      return [];
    }
  }

  // ---------------------------------------------------------------------
  // Souris et clavier
  // ---------------------------------------------------------------------
  function brancherSouris() {
    let appui = null;
    const pos = (ev) => { const r = canvas.getBoundingClientRect(); return { sx: ev.clientX - r.left, sy: ev.clientY - r.top }; };
    canvas.addEventListener('mousedown', (ev) => {
      if (ev.button !== 0) return;
      const p = pos(ev);
      appui = { ...p, vx: etat.vue.x, vy: etat.vue.y, glisse: false };
      fermerFlottants();
    });
    window.addEventListener('mousemove', (ev) => {
      const p = pos(ev);
      const dedans = ev.target === canvas;
      etat.souris = dedans || appui ? p : null;
      if (appui) {
        if (!appui.glisse && Math.hypot(p.sx - appui.sx, p.sy - appui.sy) > 4) { appui.glisse = true; canvas.classList.add('glisse'); }
        if (appui.glisse) {
          etat.vue.x = appui.vx - (p.sx - appui.sx) / etat.vue.k;
          etat.vue.y = appui.vy - (p.sy - appui.sy) / etat.vue.k;
          redessiner();
        }
      }
      majBarre();
      if (!appui || !appui.glisse) majBulle(); else $('bulle').hidden = true;
    });
    window.addEventListener('mouseup', (ev) => {
      if (!appui) return;
      const a = appui;
      appui = null;
      canvas.classList.remove('glisse');
      if (a.glisse) { retenirReglages(); return; }
      if (ev.target !== canvas) return;
      // Clic sur le nom d'une zone : la cadrer.
      for (const t of etat.titres) {
        if (a.sx >= t.x && a.sx <= t.x + t.w && a.sy >= t.y && a.sy <= t.y + t.h) { cadrerZone(t.z); return; }
      }
      const wx = a.sx / etat.vue.k + etat.vue.x;
      const wy = a.sy / etat.vue.k + etat.vue.y;
      const z = zoneSous(wx, wy);
      if (!z) return;
      if (ev.shiftKey) { poserSaut(z, wx - z.x, wy - z.y); return; }
      ouvrirMenu(z, wx - z.x, wy - z.y, a.sx, a.sy);
    });
    canvas.addEventListener('mouseleave', () => { etat.souris = null; $('bulle').hidden = true; majBarre(); });
    canvas.addEventListener('wheel', (ev) => {
      ev.preventDefault();
      const p = pos(ev);
      const avant = { x: p.sx / etat.vue.k + etat.vue.x, y: p.sy / etat.vue.k + etat.vue.y };
      const k = Math.max(0.008, Math.min(4, etat.vue.k * Math.pow(1.0018, -ev.deltaY)));
      etat.vue.k = k;
      etat.vue.x = avant.x - p.sx / k;
      etat.vue.y = avant.y - p.sy / k;
      fermerFlottants();
      redessiner();
      retenirReglages();
    }, { passive: false });
    canvas.addEventListener('contextmenu', (ev) => ev.preventDefault());
  }

  function brancherInterface() {
    $('btn-tout-voir').addEventListener('click', toutVoir);
    $('sel-disposition').value = etat.disposition;
    $('sel-disposition').addEventListener('change', (ev) => {
      etat.disposition = ev.target.value;
      M.placer(etat.monde, etat.disposition);
      majControles();
      toutVoir();
      retenirReglages();
    });
    $('chk-tests').checked = etat.tests;
    $('chk-tests').addEventListener('change', (ev) => { basculerTests(ev.target.checked); });
    $('btn-filtres-tous').addEventListener('click', () => { for (const f of FILTRES) if (f.id !== 'grille') etat.filtres[f.id] = true; majFiltres(); retenirReglages(); redessiner(); });
    $('btn-filtres-aucun').addEventListener('click', () => { for (const f of FILTRES) if (!['terrain', 'grille'].includes(f.id)) etat.filtres[f.id] = false; majFiltres(); retenirReglages(); redessiner(); });

    // Menu du clic (ordre demandé : note, éditeur, jouer).
    $('menu-note').addEventListener('click', () => { const m = $('menu'); ouvrirSaisieNote(m.offsetLeft, m.offsetTop); });
    $('menu-editeur').addEventListener('click', (ev) => {
      // Clic simple : on pilote l'onglet de l'éditeur. Clic du milieu ou Ctrl + clic : lien ordinaire.
      if (ev.button !== 0 || ev.ctrlKey || ev.metaKey || !pointMenu) return;
      ev.preventDefault();
      ouvrirEditeur(pointMenu.z, pointMenu.x, pointMenu.y);
      $('menu').hidden = true;
    });
    for (const id of ['menu-jouer', 'menu-jouer-chapitre']) $(id).addEventListener('click', () => { setTimeout(() => { $('menu').hidden = true; }, 50); });
    $('menu-saut').addEventListener('click', () => { if (pointMenu) poserSaut(pointMenu.z, pointMenu.x, pointMenu.y); $('menu').hidden = true; });
    $('menu-coord').addEventListener('click', async () => {
      if (!pointMenu) return;
      const t = `${pointMenu.z.id} (${coordTexte(pointMenu.x, pointMenu.y)})`;
      annoncer((await copier(t)) ? `Copié : ${t}` : 'Copie impossible.');
      $('menu').hidden = true;
    });
    $('note-ok').addEventListener('click', enregistrerNote);
    $('note-annuler').addEventListener('click', () => { $('saisie-note').hidden = true; });
    $('note-texte').addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); enregistrerNote(); }
      if (ev.key === 'Escape') $('saisie-note').hidden = true;
      ev.stopPropagation();
    });
    $('btn-copier').addEventListener('click', async () => {
      const ok = await copier(texteNotes());
      annoncer(ok ? `${etat.notes.length} note${etat.notes.length > 1 ? 's' : ''} copiée${etat.notes.length > 1 ? 's' : ''} : colle-les dans la conversation avec Claude.` : 'Copie impossible : sélectionne le texte du cadre et copie-le à la main.');
    });
    $('btn-vider').addEventListener('click', () => {
      if (!etat.notes.length || !window.confirm(`Supprimer les ${etat.notes.length} notes ?`)) return;
      etat.notes = [];
      retenirNotes();
      majNotes();
      redessiner();
    });
    $('btn-resume').addEventListener('click', async () => {
      annoncer((await copier(resumeMonde())) ? 'Résumé du monde copié : colle-le dans la conversation avec Claude.' : 'Copie impossible.');
    });
    $('btn-saut-effacer').addEventListener('click', () => { etat.saut = null; $('saut-etat').textContent = 'Maj + clic sur la carte, ou « Portée de saut depuis ici » dans le menu du clic.'; redessiner(); });

    window.addEventListener('keydown', (ev) => {
      if (ev.target && /INPUT|TEXTAREA|SELECT/.test(ev.target.tagName)) return;
      if (ev.key === 'Escape') fermerFlottants();
      if (ev.key === 'g' || ev.key === 'G') { etat.filtres.grille = !etat.filtres.grille; majFiltres(); retenirReglages(); redessiner(); }
      if (ev.key === 'f' || ev.key === 'F') toutVoir();
    });
  }

  function ajusterCanvas() {
    dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    redessiner();
  }

  // ---------------------------------------------------------------------
  // Démarrage
  // ---------------------------------------------------------------------
  async function demarrer() {
    canvas = $('carte');
    ctx = canvas.getContext('2d');
    const suivi = $('chargement-texte');
    try {
      chargerReglages();
      chargerNotes();
      const infos = await window.CarteCharge.chargerJeu((fait, total) => { suivi.textContent = `Lecture des fichiers du jeu… ${fait} / ${total}`; });
      etat.monde = M.construire(infos);
      M.placer(etat.monde, etat.disposition);
      preparerTraces();
      etat.brouillons = await lireBrouillons();
      brancherInterface();
      brancherSouris();
      majFiltres();
      majListeZones();
      majNotes();
      majControles();
      majFiche();
      new ResizeObserver(ajusterCanvas).observe(canvas);
      ajusterCanvas();
      if (!etat.vueRetenue) toutVoir();
      $('chargement').hidden = true;
      requestAnimationFrame(boucle);
      // Pour les tests et pour Claude : l'état de la carte, lisible depuis la console.
      window.Carte = { etat, toutVoir, cadrerZone, cadrerPoint, texteNotes, resumeMonde, lienJouer, lienEditeur: LIEN_EDITEUR, poserSaut, redessiner, dessiner };
      document.body.dataset.pret = '1';
    } catch (e) {
      suivi.textContent = `La carte n'a pas pu lire le jeu : ${e && e.message ? e.message : e}. Ouvre-la par un serveur (http://localhost:8000/carte.html), pas en double-cliquant le fichier ; Phaser est chargé depuis Internet.`;
      suivi.classList.add('erreur');
      console.error(e);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer);
  else demarrer();
})();
