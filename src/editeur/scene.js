// Éditeur de niveaux (v2) -- LA SCÈNE : le niveau affiché comme en jeu, et la souris.
//
// Le niveau n'est pas imité : `buildLevelFromData` (LevelKit) construit la zone
// exactement comme une scène du jeu (fonds, tuiles, branches, décors, ennemis,
// PNJ, Agarica à son départ, rendu de cohésion). L'éditeur fige ensuite le
// monde (aucune mise à jour de jeu, pas de son, pas de cinématique) et dessine
// PAR-DESSUS ses propres repères : cadre de sélection, poignées, grille,
// contrôles. Après chaque modification, la zone est simplement reconstruite.
//
// Ce que l'éditeur retire de la donnée POUR L'AFFICHAGE seulement (la donnée
// enregistrée, elle, garde tout) : script d'histoire, déclencheurs, carte-titre,
// musique, et les conditions d'histoire (`requires` / `forbids` / `showIf`) pour que
// chaque élément posé soit visible.

// --- Images du jeu pour les vignettes et les aperçus ------------------------
const EditeurImages = {
  // { key, frame } de la texture Phaser d'une image du catalogue, ou null.
  texture(scene, spec) {
    if (!spec || !scene) return null;
    const tx = scene.textures;
    const existe = (k) => k && tx.exists(k);
    try {
      if (spec.decor) {
        const k = propTextureKey(scene, spec.decor);
        return k ? { key: k } : null;
      }
      if (spec.totem) return { key: totemTextureKey(scene, spec.totem, 'lit') };
      if (spec.mannequin && typeof mannequinTexture === 'function') return { key: mannequinTexture(scene) };
      if (spec.fond) return existe(`item-${spec.fond}`) ? { key: `item-${spec.fond}` } : null;
      // Crapauds corrompus : l'image que le jeu leur donne (art dédié, sinon planche du crapaud).
      if (spec.crapaud && typeof crapaudBuildLook === 'function') {
        const pose = crapaudBuildLook(scene, spec.crapaud).idle[0];
        if (pose && existe(pose.key)) return { key: pose.key, frame: pose.frame };
      }
      if (spec.manifeste) {
        const k = manifestFrameKey(spec.manifeste, spec.anim || 'idle', 0);
        if (existe(k)) return { key: k };
      }
      for (const k of spec.textures || []) if (existe(k)) return { key: k };
      if (spec.objet) {
        if (existe(`item-${spec.objet}`)) return { key: `item-${spec.objet}` };
        const dessine = typeof storyDrawnItemKey === 'function' ? storyDrawnItemKey(scene, spec.objet) : null;
        if (dessine) return { key: dessine };
        if (spec.icone) return null;
        return { key: manifestPlaceholderKey(scene, spec.objet) };
      }
      if (spec.manifeste) return { key: manifestInitialTexture(scene, spec.manifeste, spec.anim || 'idle') };
    } catch (e) { /* image absente : l'icône prend le relais */ }
    return null;
  },

  // Dessine l'image dans un <canvas> de vignette, rognée à ses pixels visibles.
  // Vrai si une image a été dessinée.
  dessiner(scene, canvas, spec) {
    const t = EditeurImages.texture(scene, spec);
    if (!t) return false;
    const frame = scene.textures.getFrame(t.key, t.frame);
    if (!frame || !frame.source || !frame.source.image) return false;
    let sx = frame.cutX;
    let sy = frame.cutY;
    let sw = frame.cutWidth;
    let sh = frame.cutHeight;
    // Marges transparentes retirées (bornes déjà calculées par LevelKit pour les décors).
    try {
      const b = typeof frameVisibleBounds === 'function' ? frameVisibleBounds(frame) : null;
      if (b && b.x1 > b.x0 && b.y1 > b.y0) { sx += b.x0; sy += b.y0; sw = b.x1 - b.x0; sh = b.y1 - b.y0; }
    } catch (e) { /* image illisible (source externe) : cadre entier */ }
    const cote = canvas.width;
    // Un fond de zone (image très large) : son carré du milieu remplit la vignette.
    if (spec.fond && sw > sh) { sx += Math.round((sw - sh) / 2); sw = sh; }
    const marge = spec.fond ? 0 : Math.round(cote * 0.06);
    const k = Math.min((cote - 2 * marge) / sw, (cote - 2 * marge) / sh);
    const dw = Math.max(1, Math.round(sw * k));
    const dh = Math.max(1, Math.round(sh * k));
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, cote, cote);
    // Pixel art : jamais de flou. Agrandi : pixels nets ; réduit : réduction
    // de qualité (un simple « plus proche voisin » mange des lignes entières).
    ctx.imageSmoothingEnabled = k < 1;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(frame.source.image, sx, sy, sw, sh, Math.round((cote - dw) / 2), Math.round((cote - dh) / 2), dw, dh);
    return true;
  },
};

// --- Aides de géométrie ------------------------------------------------------
const ED_CASE = 64;
function edArrondi(v) { return Math.round(v); }
// Surface où l'on marche la plus proche de (x, y), sinon y tel quel.
function edSol(sc, x, y) {
  const s = typeof groundStandYAt === 'function' ? groundStandYAt(sc, x, y) : null;
  return s == null ? Math.round(y) : Math.round(s);
}
function edBoiteCentre(x, y, w, h) { return { x: x - w / 2, y: y - h / 2, w, h }; }
function edBoitePieds(x, y, w, h) { return { x: x - w / 2, y: y - h, w, h }; }
function edCasesCassable(el) {
  return typeof secretBreakableCells === 'function' ? secretBreakableCells(el) : (el.cells || []);
}
function edBoiteCases(cells) {
  if (!cells.length) return null;
  const xs = cells.map((c) => c[0]);
  const ys = cells.map((c) => c[1]);
  const x0 = Math.min(...xs) * ED_CASE;
  const y0 = Math.min(...ys) * ED_CASE;
  return { x: x0, y: y0, w: (Math.max(...xs) + 1) * ED_CASE - x0, h: (Math.max(...ys) + 1) * ED_CASE - y0 };
}
const ED_HAUTEUR_CREATURE = { loupAlpha: 100, ghilt: 120, araignee: 44 };
const ED_CREATURES_VOLANTES = ['corbeau'];

// Géométries (`geo` d'un genre du catalogue). Chaque géométrie sait :
//   boite(sc, el, i, g)        rectangle monde de l'élément (sélection, clic) ;
//   creer(sc, modele, x, y, g) nouvel élément posé au point (x, y) ;
//   ancre(sc, el, g)           point tenu par la souris pendant un déplacement ;
//   deplacer(sc, el, x, y, g)  pose l'ancre en (x, y) ;
//   poignees?(sc, el, g)       poignées de réglage [{ id, x, y }] ;
//   tirer?(sc, el, id, x, y, g) déplace une poignée.
const EDITEUR_GEOS = {
  decor: {
    libre: (el) => !!(el.hang || el.free || el.angle),
    boite(sc, el, i) {
      const o = sc.objetDe('props', i);
      const b = o && typeof objectVisibleBox === 'function' ? objectVisibleBox(o) : null;
      if (b && !o.angle) return { x: b.left, y: b.top, w: b.right - b.left, h: b.bottom - b.top };
      if (o) { const r = o.getBounds(); return { x: r.x, y: r.y, w: r.width, h: r.height }; }
      return edBoitePieds(el.x, el.y, 60, 60);
    },
    creer(sc, modele, x, y) {
      const scale = +(propDefaultScale(modele.type)).toFixed(3);
      const defauts = (typeof DECOR_PROP_PLACEMENT !== 'undefined' && DECOR_PROP_PLACEMENT[modele.type]) || {};
      const libre = defauts.hang || defauts.free;
      return { ...modele, x: edArrondi(x), y: libre ? edArrondi(y) : edSol(sc, x, y), scale };
    },
    ancre: (sc, el) => ({ x: el.x, y: el.y }),
    deplacer(sc, el, x, y) {
      const defauts = (typeof DECOR_PROP_PLACEMENT !== 'undefined' && DECOR_PROP_PLACEMENT[el.type]) || {};
      const libre = el.hang || el.free || el.angle || defauts.hang || defauts.free;
      el.x = edArrondi(x);
      el.y = libre ? edArrondi(y) : edSol(sc, x, y);
    },
  },
  creature: {
    boite(sc, el, i) {
      const o = sc.objetDe('enemies', i);
      if (o && o.body) {
        // Ce qu'on voit de la créature (pixels visibles de son image), au moins son corps.
        const b = o.body;
        let x0 = b.left;
        let y0 = b.top;
        let x1 = b.right;
        let y1 = b.bottom;
        const v = typeof objectVisibleBox === 'function' ? objectVisibleBox(o) : null;
        if (v && v.right - v.left < 420 && v.bottom - v.top < 420) {
          x0 = Math.min(x0, v.left); y0 = Math.min(y0, v.top); x1 = Math.max(x1, v.right); y1 = Math.max(y1, v.bottom);
        }
        return { x: x0, y: y0, w: Math.max(x1 - x0, 28), h: Math.max(y1 - y0, 28) };
      }
      return edBoiteCentre(el.x, el.y, 48, 48);
    },
    creer(sc, modele, x, y) {
      const vol = ED_CREATURES_VOLANTES.includes(modele.type);
      const el = { ...modele, x: edArrondi(x), y: vol ? edArrondi(y) : edSol(sc, x, y) - (ED_HAUTEUR_CREATURE[modele.type] || 48) };
      if (EDITEUR_TYPES_PATROUILLE.includes(modele.type)) { el.patrolMinX = el.x - 150; el.patrolMaxX = el.x + 150; }
      return el;
    },
    ancre: (sc, el) => ({ x: el.x, y: el.y }),
    deplacer(sc, el, x, y) {
      const dx = edArrondi(x) - el.x;
      const vol = ED_CREATURES_VOLANTES.includes(el.type);
      el.x += dx;
      el.y = vol ? edArrondi(y) : edSol(sc, x, y + (ED_HAUTEUR_CREATURE[el.type] || 48)) - (ED_HAUTEUR_CREATURE[el.type] || 48);
      // La patrouille suit la créature.
      if (el.patrolMinX != null) el.patrolMinX += dx;
      if (el.patrolMaxX != null) el.patrolMaxX += dx;
    },
    poignees(sc, el, g, boite) {
      if (!EDITEUR_TYPES_PATROUILLE.includes(el.type)) return [];
      const y = boite ? boite.y + boite.h - 8 : el.y;
      return [
        { id: 'pmin', x: el.patrolMinX ?? el.x - 150, y, lien: true },
        { id: 'pmax', x: el.patrolMaxX ?? el.x + 150, y, lien: true },
      ];
    },
    tirer(sc, el, id, x) {
      if (id === 'pmin') el.patrolMinX = Math.min(edArrondi(x), el.x);
      if (id === 'pmax') el.patrolMaxX = Math.max(edArrondi(x), el.x);
    },
  },
  personnage: {
    pieds(sc, el) { return el.y != null ? el.y : (typeof storyStandY === 'function' ? storyStandY(sc, el.x) : 448); },
    boite(sc, el, i) {
      const o = sc.objetDe('npcs', i);
      const b = o && o.active && typeof objectVisibleBox === 'function' ? objectVisibleBox(o) : null;
      if (b) return { x: b.left, y: b.top, w: b.right - b.left, h: b.bottom - b.top };
      return edBoitePieds(el.x, EDITEUR_GEOS.personnage.pieds(sc, el), 44, 86);
    },
    creer(sc, modele, x, y) {
      const el = { ...modele, x: edArrondi(x), y: edSol(sc, x, y) };
      // Deux personnages de la même feuille : un nom à part pour le second.
      const memes = (Editeur.etat.donnees.npcs || []).filter((n) => n.id === el.id).length;
      if (memes) el.key = `${el.id}_${memes + 1}`;
      return el;
    },
    ancre: (sc, el) => ({ x: el.x, y: EDITEUR_GEOS.personnage.pieds(sc, el) }),
    deplacer(sc, el, x, y) { el.x = edArrondi(x); el.y = edSol(sc, x, y); },
  },
  animaux: {
    boite(sc, el) {
      if (el.type === 'poissons') return { x: el.x, y: el.y, w: el.w || 200, h: el.h || 60 };
      if (el.type === 'papillons') return edBoiteCentre(el.x, el.y, el.w || 80, el.w || 80);
      return edBoitePieds(el.x, el.y != null ? el.y : edSol(sc, el.x, 448), el.w || 180, 30);
    },
    creer(sc, modele, x, y) {
      if (modele.type === 'poissons') return { ...modele, x: edArrondi(x - (modele.w || 200) / 2), y: edArrondi(y - (modele.h || 60) / 2) };
      if (modele.type === 'papillons') return { ...modele, x: edArrondi(x), y: edArrondi(y) };
      return { ...modele, x: edArrondi(x), y: edSol(sc, x, y) };
    },
    ancre(sc, el) {
      if (el.type === 'poissons') return { x: el.x + (el.w || 200) / 2, y: el.y + (el.h || 60) / 2 };
      return { x: el.x, y: el.y != null ? el.y : edSol(sc, el.x, 448) };
    },
    deplacer(sc, el, x, y) {
      if (el.type === 'poissons') { el.x = edArrondi(x - (el.w || 200) / 2); el.y = edArrondi(y - (el.h || 60) / 2); return; }
      el.x = edArrondi(x);
      el.y = el.type === 'papillons' ? edArrondi(y) : edSol(sc, x, y);
    },
    poignees(sc, el) {
      if (el.type === 'poissons') return [{ id: 'coin', x: el.x + (el.w || 200), y: el.y + (el.h || 60) }];
      return [];
    },
    tirer(sc, el, id, x, y) {
      el.w = Math.max(40, edArrondi((x - el.x) / 10) * 10);
      el.h = Math.max(20, edArrondi((y - el.y) / 10) * 10);
    },
  },
  // Posé au sol : (x, y) = pied, y recalé sur le sol par le jeu.
  pieds: {
    boite(sc, el, i, g) {
      const y = el.y != null ? el.y : 448;
      const s = typeof groundSurfaceYAt === 'function' ? groundSurfaceYAt(sc, el.x, y) : null;
      return edBoitePieds(el.x, s == null ? y : s, g.taille[0], g.taille[1]);
    },
    creer: (sc, modele, x, y) => ({ ...modele, x: edArrondi(x), y: edSol(sc, x, y) }),
    ancre: (sc, el) => ({ x: el.x, y: el.y != null ? el.y : 448 }),
    deplacer(sc, el, x, y) { el.x = edArrondi(x); el.y = edSol(sc, x, y); },
  },
  // Flotte : (x, y) = centre.
  centre: {
    boite: (sc, el, i, g) => edBoiteCentre(el.x, el.y != null ? el.y : edSol(sc, el.x, 448) - 34, g.taille[0], g.taille[1]),
    creer: (sc, modele, x, y) => ({ ...modele, x: edArrondi(x), y: edArrondi(y) }),
    ancre: (sc, el) => ({ x: el.x, y: el.y != null ? el.y : edSol(sc, el.x, 448) - 34 }),
    deplacer(sc, el, x, y) { el.x = edArrondi(x); el.y = edArrondi(y); },
  },
  // Objet à ramasser : flotte 30 px au-dessus du sol tant qu'on ne lui donne pas de hauteur.
  ramassable: {
    y: (sc, el) => (el.y != null ? el.y : edSol(sc, el.x, 448) - 30),
    boite: (sc, el, i, g) => edBoiteCentre(el.x, EDITEUR_GEOS.ramassable.y(sc, el), g.taille[0], g.taille[1]),
    creer: (sc, modele, x, y) => ({ ...modele, x: edArrondi(x), y: edSol(sc, x, y) - 30 }),
    ancre: (sc, el) => ({ x: el.x, y: EDITEUR_GEOS.ramassable.y(sc, el) }),
    deplacer(sc, el, x, y) { el.x = edArrondi(x); el.y = edArrondi(y); },
  },
  toile: {
    boite: (sc, el, i, g) => edBoiteCentre(el.x, el.y, g.taille[0], g.taille[1]),
    creer: (sc, modele, x, y) => ({ ...modele, x: edArrondi(x), y: edSol(sc, x, y) - 11 }),
    ancre: (sc, el) => ({ x: el.x, y: el.y }),
    deplacer(sc, el, x, y) { el.x = edArrondi(x); el.y = edSol(sc, x, y + 11) - 11; },
  },
  // Rectangle dont (x, y) est le coin haut-gauche.
  rectCoin: {
    boite: (sc, el, i, g) => ({ x: el.x, y: el.y, w: el[g.cles.w] || 64, h: el[g.cles.h] || 64 }),
    creer(sc, modele, x, y, g) {
      const w = modele[g.cles.w];
      const h = modele[g.cles.h];
      return { x: edArrondi((x - w / 2) / 16) * 16, y: edArrondi((y - h / 2) / 16) * 16, ...modele };
    },
    ancre: (sc, el, g) => ({ x: el.x + (el[g.cles.w] || 64) / 2, y: el.y + (el[g.cles.h] || 64) / 2 }),
    deplacer(sc, el, x, y, g) {
      el.x = edArrondi((x - (el[g.cles.w] || 64) / 2) / 8) * 8;
      el.y = edArrondi((y - (el[g.cles.h] || 64) / 2) / 8) * 8;
    },
    poignees: (sc, el, g) => [{ id: 'coin', x: el.x + (el[g.cles.w] || 64), y: el.y + (el[g.cles.h] || 64) }],
    tirer(sc, el, id, x, y, g) {
      el[g.cles.w] = Math.max(32, edArrondi((x - el.x) / 16) * 16);
      el[g.cles.h] = Math.max(32, edArrondi((y - el.y) / 16) * 16);
    },
  },
  // Mousse : (x, y) = centre ; sans y, posée sur le sol.
  mousse: {
    rect(sc, el, g) {
      // (`largeur` du genre : largeur par défaut du jeu, 64 pour un bloc SECRET ou une barrière.)
      const w = el.w || g.largeur || 96;
      const h = el.h || g.hauteur;
      const y = el.y != null ? el.y : (typeof storyGroundY === 'function' ? storyGroundY(sc, el.x) : 448) - h / 2;
      return { x: el.x - w / 2, y: y - h / 2, w, h };
    },
    boite: (sc, el, i, g) => EDITEUR_GEOS.mousse.rect(sc, el, g),
    creer(sc, modele, x, y, g) {
      const h = modele.h || g.hauteur;
      return { ...modele, x: edArrondi(x), y: edSol(sc, x, y) - h / 2 };
    },
    ancre(sc, el, g) { const r = EDITEUR_GEOS.mousse.rect(sc, el, g); return { x: el.x, y: r.y + r.h }; },
    deplacer(sc, el, x, y, g) { el.x = edArrondi(x); el.y = edSol(sc, x, y) - (el.h || g.hauteur) / 2; },
    poignees(sc, el, g) { const r = EDITEUR_GEOS.mousse.rect(sc, el, g); return [{ id: 'coin', x: r.x + r.w, y: r.y }]; },
    tirer(sc, el, id, x, y, g) {
      const r = EDITEUR_GEOS.mousse.rect(sc, el, g);
      const bas = r.y + r.h;
      el.w = Math.max(16, edArrondi((x - el.x) * 2 / 8) * 8);
      el.h = Math.max(16, edArrondi((bas - y) / 8) * 8);
      el.y = bas - el.h / 2;
    },
  },
  liane: {
    boite: (sc, el) => ({ x: el.x - 12, y: el.y, w: 24, h: el.length || 200 }),
    creer: (sc, modele, x, y) => ({ x: edArrondi(x), y: edArrondi(y), ...modele }),
    ancre: (sc, el) => ({ x: el.x, y: el.y }),
    deplacer(sc, el, x, y) { el.x = edArrondi(x); el.y = edArrondi(y); },
    poignees: (sc, el) => [{ id: 'bas', x: el.x, y: el.y + (el.length || 200) }],
    tirer(sc, el, id, x, y) { el.length = Math.max(32, edArrondi((y - el.y) / 8) * 8); },
  },
  // Piste : de x à x + w, y = ligne du sol.
  ligneSol: {
    boite: (sc, el) => ({ x: el.x, y: el.y - 16, w: el.w || 200, h: 20 }),
    creer: (sc, modele, x, y) => ({ x: edArrondi(x - (modele.w || 200) / 2), y: edSol(sc, x, y), ...modele }),
    ancre: (sc, el) => ({ x: el.x + (el.w || 200) / 2, y: el.y }),
    deplacer(sc, el, x, y) { el.x = edArrondi(x - (el.w || 200) / 2); el.y = edSol(sc, x, y); },
    poignees: (sc, el) => [{ id: 'fin', x: el.x + (el.w || 200), y: el.y - 6 }],
    tirer(sc, el, id, x) { el.w = Math.max(32, edArrondi((x - el.x) / 16) * 16); },
  },
  // Plateforme cachée : w cases à partir de (gx, gy).
  cases: {
    boite: (sc, el) => ({ x: el.gx * ED_CASE, y: el.gy * ED_CASE, w: (el.w || 1) * ED_CASE, h: ED_CASE }),
    creer(sc, modele, x, y) {
      const w = modele.w || 1;
      return { gx: Math.floor(x / ED_CASE - (w - 1) / 2), gy: Math.floor(y / ED_CASE), ...modele };
    },
    ancre: (sc, el) => ({ x: (el.gx + (el.w || 1) / 2) * ED_CASE, y: (el.gy + 0.5) * ED_CASE }),
    deplacer(sc, el, x, y) { el.gx = Math.round(x / ED_CASE - (el.w || 1) / 2); el.gy = Math.floor(y / ED_CASE); },
    poignees: (sc, el) => [{ id: 'fin', x: (el.gx + (el.w || 1)) * ED_CASE, y: (el.gy + 0.5) * ED_CASE }],
    tirer(sc, el, id, x) { el.w = Math.max(1, Math.round(x / ED_CASE) - el.gx); },
  },
  branche: {
    points: (el) => [el.from, ...(el.via || []), el.to],
    plate: (el) => el.from[1] === el.to[1] && !(el.via && el.via.length) && !el.bend,
    boite(sc, el) {
      const pts = EDITEUR_GEOS.branche.points(el);
      const xs = pts.map((p) => p[0]);
      const ys = pts.map((p) => p[1]);
      const ep = el.thickness || 56;
      const y0 = Math.min(...ys);
      return { x: Math.min(...xs), y: y0 - 6, w: Math.max(32, Math.max(...xs) - Math.min(...xs)), h: Math.max(...ys) - y0 + ep + 6 };
    },
    creer(sc, modele, x, y) {
      const x1 = Math.round((x - 128) / ED_CASE) * ED_CASE;
      const yy = Math.round(y / ED_CASE) * ED_CASE;
      return { from: [x1, yy], to: [x1 + 4 * ED_CASE, yy], ...modele };
    },
    ancre: (sc, el) => ({ x: (el.from[0] + el.to[0]) / 2, y: (el.from[1] + el.to[1]) / 2 }),
    deplacer(sc, el, x, y) {
      const a = EDITEUR_GEOS.branche.ancre(sc, el);
      // À la case près : les cases de collision écrites à la main restent sous le dessin.
      const dx = Math.round((x - a.x) / ED_CASE) * ED_CASE;
      const dy = Math.round((y - a.y) / ED_CASE) * ED_CASE;
      for (const p of EDITEUR_GEOS.branche.points(el)) { p[0] += dx; p[1] += dy; }
      if (el.cells) el.cells = el.cells.map(([gx, gy, m]) => (m === undefined ? [gx + dx / ED_CASE, gy + dy / ED_CASE] : [gx + dx / ED_CASE, gy + dy / ED_CASE, m]));
    },
    poignees: (sc, el) => [{ id: 'de', x: el.from[0], y: el.from[1] }, { id: 'a', x: el.to[0], y: el.to[1] }],
    tirer(sc, el, id, x, y) {
      const pas = EDITEUR_GEOS.branche.plate(el) ? ED_CASE : 8;
      const p = id === 'de' ? el.from : el.to;
      const plate = EDITEUR_GEOS.branche.plate(el);
      p[0] = Math.round(x / pas) * pas;
      // Une branche plate reste plate (c'est elle qui porte) : seul son bout glisse.
      if (!plate) p[1] = Math.round(y / pas) * pas;
      if (plate && el.from[0] === el.to[0]) p[0] += id === 'de' ? -ED_CASE : ED_CASE;
    },
  },
  tronc: {
    bornes(sc, el) {
      const d = Editeur.etat.donnees;
      return { haut: el.top ?? Math.min(-400, d.levelTop ?? -400), bas: el.bottom ?? (d.levelHeight || 540) };
    },
    boite(sc, el) {
      const { haut, bas } = EDITEUR_GEOS.tronc.bornes(sc, el);
      const w = (typeof TRONC_SEGMENT_COLS !== 'undefined' ? TRONC_SEGMENT_COLS : 793) * (el.scale || 0.25);
      return { x: el.x - w / 2, y: haut, w, h: bas - haut };
    },
    creer: (sc, modele, x, y) => ({ x: edArrondi(x / 16) * 16, bottom: edSol(sc, x, y), ...modele }),
    ancre(sc, el) { const { bas } = EDITEUR_GEOS.tronc.bornes(sc, el); return { x: el.x, y: bas - 100 }; },
    deplacer(sc, el, x) { el.x = edArrondi(x / 8) * 8; },
    poignees(sc, el) {
      const { haut, bas } = EDITEUR_GEOS.tronc.bornes(sc, el);
      return [{ id: 'haut', x: el.x, y: haut }, { id: 'bas', x: el.x, y: bas }];
    },
    tirer(sc, el, id, x, y) {
      if (id === 'haut') el.top = edArrondi(y / 16) * 16;
      else el.bottom = edArrondi(y / 16) * 16;
    },
  },
  cassable: {
    boite: (sc, el) => edBoiteCases(edCasesCassable(el)) || edBoiteCentre(el.x || 0, el.y || 0, ED_CASE, ED_CASE),
    creer(sc, modele, x, y) {
      const gx = Math.floor(x / ED_CASE);
      const gy = Math.floor(y / ED_CASE);
      // Sol et dalle (Monde V2) : deux cases côte à côte ; sinon l'une sur l'autre (un mur).
      const plat = modele.by === 'sol' || modele.by === 'dalle';
      return { ...modele, cells: plat ? [[gx, gy], [gx + 1, gy]] : [[gx, gy], [gx, gy + 1]] };
    },
    ancre(sc, el) { const b = EDITEUR_GEOS.cassable.boite(sc, el); return { x: b.x + b.w / 2, y: b.y + b.h / 2 }; },
    deplacer(sc, el, x, y) {
      const a = EDITEUR_GEOS.cassable.ancre(sc, el);
      const dgx = Math.round((x - a.x) / ED_CASE);
      const dgy = Math.round((y - a.y) / ED_CASE);
      if (Array.isArray(el.cells)) el.cells = el.cells.map(([gx, gy]) => [gx + dgx, gy + dgy]);
      else if (el.x != null) { el.x += dgx * ED_CASE; el.y += dgy * ED_CASE; }
    },
    poignees(sc, el) { const b = EDITEUR_GEOS.cassable.boite(sc, el); return [{ id: 'coin', x: b.x + b.w, y: b.y + b.h }]; },
    tirer(sc, el, id, x, y) {
      // Le bloc redevient un rectangle plein, du coin haut-gauche jusqu'à la souris.
      const b = EDITEUR_GEOS.cassable.boite(sc, el);
      const gx0 = Math.round(b.x / ED_CASE);
      const gy0 = Math.round(b.y / ED_CASE);
      const gx1 = Math.max(gx0, Math.ceil(x / ED_CASE) - 1);
      const gy1 = Math.max(gy0, Math.ceil(y / ED_CASE) - 1);
      const cells = [];
      for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) cells.push([gx, gy]);
      el.cells = cells;
      delete el.x; delete el.y; delete el.w; delete el.h;
    },
  },
};

// L'élément de la donnée derrière une boîte (null si la donnée a changé entre-temps).
function edElement(d, b) { return Array.isArray(d[b.genre]) ? d[b.genre][b.index] || null : null; }

const ED_COULEURS = { selection: 0x9bffd0, survol: 0xffffff, probleme: 0xff5577, pose: 0xff9fc9, grille: 0xcbb6ff, cadre: 0x9bffd0 };
const ED_ZOOM_MIN = 0.2;
const ED_ZOOM_MAX = 3;
const ED_TEMPS_DE_POSE = 600; // ms laissées aux créatures pour se poser au sol avant de figer la physique

class EditeurScene extends Phaser.Scene {
  constructor() { super('EditeurScene'); }

  create() {
    const E = Editeur;
    E.scene = this;
    this.pret = false;
    this.fantome = null;
    this.glisse = null;
    this.trait = null;
    this.survol = null;
    this.boites = [];
    this.pointeur = { x: 0, y: 0, dedans: false };
    this.erreurRendu = null;
    if (!E.etat.jeuPret) E.jeuPret(this);
    const d = E.etat.donnees;
    if (!d) return;

    try {
      this.rendu = E.donneesDeRendu();
      buildLevelFromData(this, this.rendu);
    } catch (e) {
      // Zone impossible à afficher : l'éditeur reste ouvert et le dit.
      console.warn('Éditeur : la zone ne peut pas être affichée', e);
      this.erreurRendu = e;
    }
    this.figer();
    this.indexerObjets();
    this.calque = this.add.graphics().setDepth(200000);
    this.calque.lookRole = 'ui';
    this.brancherSouris();
    const vue = E.vue() || this.vueDeDepart();
    this.poserVue(vue.x, vue.y, vue.zoom);
    this.tempsDePose = ED_TEMPS_DE_POSE;
    this.pret = true;
    // (La vue est mémorisée à chaque déplacement : à l'arrêt de la scène, la caméra n'existe déjà plus.)
    this.events.once('shutdown', () => { this.pret = false; this.fantome = null; });
    E.emettre('rendu', { erreur: this.erreurRendu });
  }

  // --- Le monde est figé : aucune logique de jeu ne tourne dans l'éditeur ---
  figer() {
    const cam = this.cameras.main;
    // Les crochets du jeu (caméra, invites « E : … », cadrage des bords) ne
    // travaillent que pour la zone « en cours » : il n'y en a pas ici.
    currentLevelScene = null;
    this.__storyFreeze = 1;
    cam.stopFollow();
    cam.removeBounds();
    this.tweens.killTweensOf(cam);
    cam.setZoom(1);
    // Voile du fondu d'arrivée (juiceFadeIn) : l'éditeur s'affiche tout de suite.
    for (const o of this.children.list.slice()) {
      if (o.type === 'Rectangle' && o.depth === JUICE_VEIL_DEPTH && o.scrollFactorX === 0) { this.tweens.killTweensOf(o); o.destroy(); }
    }
    // Les touches du jeu ne doivent pas bloquer la saisie dans les champs de l'éditeur.
    if (this.input.keyboard) this.input.keyboard.disableGlobalCapture();
    if (this.input.mouse) this.input.mouse.disableContextMenu();
  }

  // Objets du jeu derrière les éléments de la donnée (boîtes exactes, déplacement à vue).
  indexerObjets() {
    const d = this.rendu || {};
    this.objets = { props: [], enemies: [], npcs: [] };
    let k = 0;
    (d.props || []).forEach((p, i) => {
      if (!p || !p.type || !propTextureKey(this, p.type)) return;
      const o = (this.props || [])[k++];
      if (o && o.propType === p.type) this.objets.props[i] = o;
    });
    const ennemis = this.enemies ? this.enemies.getChildren() : [];
    k = 0;
    (d.enemies || []).forEach((e, i) => {
      if (!ENEMY_REGISTRY[e.type]) return;
      const o = ennemis[k];
      // Créé au point de la donnée : sinon la liste est décalée (ennemi refusé par sa fabrique).
      if (o && Math.abs(o.x - e.x) < 2) { this.objets.enemies[i] = o; k += 1; }
    });
    (d.npcs || []).forEach((n, i) => {
      const o = this.npcs && this.npcs[n.key || n.id];
      if (o && Math.abs(o.x - n.x) < 2) this.objets.npcs[i] = o;
    });
  }

  objetDe(genre, i) { return this.objets && this.objets[genre] ? this.objets[genre][i] : null; }

  // --- Vue (déplacement, zoom) ----------------------------------------------
  vueDeDepart() {
    const d = Editeur.etat.donnees;
    const s = d.playerSpawn || { x: 480, y: 270 };
    const w = this.scale.width;
    const larg = d.levelWidth || w;
    return { x: Phaser.Math.Clamp(s.x, w / 2, Math.max(w / 2, larg - w / 2)), y: d.tallLevel || (d.camera && d.camera.vertical) ? s.y - 100 : 270, zoom: 1 };
  }

  vueActuelle() {
    const cam = this.cameras.main;
    return { x: cam.scrollX + cam.width / 2, y: cam.scrollY + cam.height / 2, zoom: cam.zoom };
  }

  // (x, y) = point du monde au centre de l'écran.
  poserVue(x, y, zoom) {
    const cam = this.cameras.main;
    const z = Phaser.Math.Clamp(zoom || cam.zoom, ED_ZOOM_MIN, ED_ZOOM_MAX);
    cam.setZoom(z);
    cam.setScroll(x - cam.width / 2, y - cam.height / 2);
    this.suivreZoom();
    this.vueChangee();
  }

  vueChangee() {
    const v = this.vueActuelle();
    Editeur.memoriserVue(v);
    Editeur.emettre('vue', v);
  }

  // Point du monde sous un point de l'écran du jeu (960 x 540).
  versMonde(sx, sy) {
    const cam = this.cameras.main;
    return { x: cam.scrollX + cam.width / 2 + (sx - cam.width / 2) / cam.zoom, y: cam.scrollY + cam.height / 2 + (sy - cam.height / 2) / cam.zoom };
  }

  // Point de la page (px CSS, relatif au canvas) pour un point du monde.
  versPage(wx, wy) {
    const cam = this.cameras.main;
    const sx = (wx - cam.scrollX - cam.width / 2) * cam.zoom + cam.width / 2;
    const sy = (wy - cam.scrollY - cam.height / 2) * cam.zoom + cam.height / 2;
    const r = this.game.canvas.getBoundingClientRect();
    return { x: sx * r.width / cam.width, y: sy * r.height / cam.height, k: cam.zoom * r.width / cam.width };
  }

  zoomer(facteur, sx, sy) {
    const cam = this.cameras.main;
    const px = sx == null ? cam.width / 2 : sx;
    const py = sy == null ? cam.height / 2 : sy;
    const avant = this.versMonde(px, py);
    let z = Phaser.Math.Clamp(cam.zoom * facteur, ED_ZOOM_MIN, ED_ZOOM_MAX);
    if (Math.abs(z - 1) < 0.04) z = 1; // cran à 100 % : la vue exacte du jeu
    cam.setZoom(z);
    cam.setScroll(avant.x - cam.width / 2 - (px - cam.width / 2) / z, avant.y - cam.height / 2 - (py - cam.height / 2) / z);
    this.suivreZoom();
    this.vueChangee();
  }

  // Toute la zone dans l'écran.
  cadrerZone() {
    const d = Editeur.etat.donnees;
    const cam = this.cameras.main;
    const haut = d.tallLevel || (d.camera && d.camera.vertical) ? Math.min(-400, d.levelTop ?? -400) : 0;
    const w = d.levelWidth || cam.width;
    const h = (d.levelHeight || cam.height) - haut;
    const z = Math.min(cam.width / (w + 120), cam.height / (h + 120), 1);
    this.poserVue(w / 2, haut + h / 2, z);
  }

  centrerSur(x, y) {
    const v = this.vueActuelle();
    this.poserVue(x, y, v.zoom);
  }

  // Les objets fixés à l'écran (voile, vignette, ciel) sont faits pour un zoom
  // de 1 : ils sont agrandis d'autant quand on dézoome, pour couvrir toute la vue.
  suivreZoom() {
    const cam = this.cameras.main;
    const z = cam.zoom;
    const cx = cam.width / 2;
    const cy = cam.height / 2;
    for (const o of this.children.list) {
      if (o === this.calque || o.scrollFactorX !== 0 || o.scrollFactorY !== 0 || o.setScale === undefined) continue;
      if (!o.__edBase) {
        if (z === 1) continue;
        o.__edBase = { x: o.x, y: o.y, sx: o.scaleX, sy: o.scaleY };
      }
      const b = o.__edBase;
      o.x = cx + (b.x - cx) / z;
      o.y = cy + (b.y - cy) / z;
      o.setScale(b.sx / z, b.sy / z);
    }
  }

  // --- Souris -----------------------------------------------------------------
  brancherSouris() {
    const inp = this.input;
    inp.on('pointerdown', (p) => this.appui(p));
    inp.on('pointermove', (p) => this.mouvement(p));
    inp.on('pointerup', (p) => this.relache(p));
    inp.on('pointerupoutside', (p) => this.relache(p));
    inp.on('wheel', (p, objs, dx, dy) => this.zoomer(dy > 0 ? 1 / 1.15 : 1.15, p.x, p.y));
    inp.on('gameout', () => { this.pointeur.dedans = false; Editeur.emettre('curseur', null); });
    inp.on('gameover', () => { this.pointeur.dedans = true; });
  }

  appui(p) {
    if (!this.pret) return;
    const E = Editeur;
    const m = this.versMonde(p.x, p.y);
    this.pointeur = { x: m.x, y: m.y, dedans: true };
    // Un champ de l'éditeur avait la main : il la rend (ses raccourcis clavier reviennent).
    if (document.activeElement && document.activeElement !== document.body && document.activeElement.blur) document.activeElement.blur();
    const milieu = p.middleButtonDown();
    const droit = p.rightButtonDown();
    if (milieu || E.etat.espace) {
      this.glisse = { type: 'vue', sx: p.x, sy: p.y, vue: this.vueActuelle() };
      return;
    }
    const outil = E.etat.outil;
    // Clic droit = la gomme, TOUJOURS le même geste (retour de l'utilisateur du
    // 2026-11-15 : « c'est pas les mêmes touches pour suppr un sol et un
    // élément genre eau, c'est pas pratique »). Il enlève ce qui est sous le
    // curseur : l'élément s'il y en a un (eau, créature, décor…), sinon le
    // sol, et on peut alors glisser pour effacer d'autres cases. Dans le vide :
    // il range l'outil en main, sinon désélectionne (comme avant).
    if (droit) {
      const cible = this.elementSous(m.x, m.y);
      if (cible) {
        if (E.modifiable()) { E.selectionner(cible.genre, cible.index); E.supprimerSelection(); }
        return;
      }
      const peint = outil && (outil.outil === 'peindre' || outil.outil === 'effacer');
      const couche = this.coucheDeSol(m.x, m.y, peint ? outil.couche : null);
      if (couche || peint) {
        if (!E.modifiable()) return;
        this.trait = { couche: couche || outil.couche, efface: true, cases: new Map(), dernier: null };
        this.peindreVers(m.x, m.y);
        return;
      }
      if (outil) E.choisirOutil(null); else E.selectionner(null);
      return;
    }
    if (outil && (outil.outil === 'peindre' || outil.outil === 'effacer')) {
      if (!E.modifiable()) return;
      this.trait = { couche: outil.couche, efface: outil.outil === 'effacer', cases: new Map(), dernier: null };
      this.peindreVers(m.x, m.y);
      return;
    }
    // Poignée de l'élément sélectionné.
    const poignee = this.poigneeSous(m.x, m.y);
    if (poignee && E.modifiable()) {
      const sel = E.etat.selection;
      this.glisse = { type: 'poignee', id: poignee.id, genre: sel.genre, index: sel.index, el: E.copie(E.elementSelectionne()), bouge: false };
      return;
    }
    const touche = this.elementSous(m.x, m.y);
    const sel = E.etat.selection;
    const surSelection = touche && sel && touche.genre === sel.genre && touche.index === sel.index;
    if (outil && outil.genre && !surSelection) {
      // Une image est en main : on pose.
      if (E.modifiable()) E.poser(outil, m.x, m.y);
      return;
    }
    if (touche) {
      E.selectionner(touche.genre, touche.index);
      if (!E.modifiable()) return;
      const g = EDITEUR_GENRES[touche.genre];
      const el = E.copie(E.element(touche.genre, touche.index));
      const a = EDITEUR_GEOS[g.geo].ancre(this, el, g);
      this.glisse = { type: 'element', genre: touche.genre, index: touche.index, el, dx: m.x - a.x, dy: m.y - a.y, depart: { ...a }, boite: { ...touche }, sx: p.x, sy: p.y, bouge: false };
      return;
    }
    E.selectionner(null);
    // Dans le vide : on fait glisser la vue.
    this.glisse = { type: 'vue', sx: p.x, sy: p.y, vue: this.vueActuelle() };
  }

  mouvement(p) {
    if (!this.pret) return;
    const E = Editeur;
    const m = this.versMonde(p.x, p.y);
    this.pointeur = { x: m.x, y: m.y, dedans: true };
    E.emettre('curseur', { x: m.x, y: m.y, gx: Math.floor(m.x / ED_CASE), gy: Math.floor(m.y / ED_CASE) });
    if (this.trait) { this.peindreVers(m.x, m.y); return; }
    const gl = this.glisse;
    if (!gl) { this.survol = this.elementSous(m.x, m.y); return; }
    if (gl.type === 'vue') {
      const cam = this.cameras.main;
      this.poserVue(gl.vue.x - (p.x - gl.sx) / cam.zoom, gl.vue.y - (p.y - gl.sy) / cam.zoom, cam.zoom);
      return;
    }
    const g = EDITEUR_GENRES[gl.genre];
    const geo = EDITEUR_GEOS[g.geo];
    if (gl.type === 'poignee') {
      geo.tirer(this, gl.el, gl.id, m.x, m.y, g);
      gl.bouge = true;
      return;
    }
    if (gl.type === 'element') {
      // Un petit tremblement de la main n'est pas un déplacement.
      if (!gl.bouge && Math.hypot(p.x - gl.sx, p.y - gl.sy) < 4) return;
      gl.bouge = true;
      geo.deplacer(this, gl.el, m.x - gl.dx, m.y - gl.dy, g);
      const a = geo.ancre(this, gl.el, g);
      // L'objet du jeu suit la souris tout de suite ; la zone est reconstruite au lâcher.
      const o = this.objetDe(gl.genre, gl.index);
      if (o) {
        if (!gl.objet) gl.objet = { x: o.x, y: o.y };
        o.x = gl.objet.x + (a.x - gl.depart.x);
        o.y = gl.objet.y + (a.y - gl.depart.y);
        if (o.body && o.body.reset && gl.genre === 'enemies') o.body.reset(o.x, o.y);
      }
      gl.decalage = { x: a.x - gl.depart.x, y: a.y - gl.depart.y };
    }
  }

  relache() {
    const E = Editeur;
    if (this.trait) {
      const t = this.trait;
      this.trait = null;
      E.peindre(t.couche, t.efface, Array.from(t.cases.values()));
      return;
    }
    const gl = this.glisse;
    this.glisse = null;
    if (!gl || gl.type === 'vue' || !gl.bouge) return;
    E.remplacerElement(gl.genre, gl.index, gl.el, gl.type === 'poignee' ? 'Réglage à la souris' : 'Déplacement');
  }

  annulerGeste() {
    const gl = this.glisse;
    this.glisse = null;
    this.trait = null;
    if (gl && gl.objet) {
      const o = this.objetDe(gl.genre, gl.index);
      if (o) { o.x = gl.objet.x; o.y = gl.objet.y; }
    }
  }

  // Couche de sol qui a une case sous le point : celle de l'outil de peinture
  // en main si elle en a une, sinon le sol, sinon le sol de second plan.
  coucheDeSol(x, y, preferee = null) {
    const d = Editeur.etat.donnees;
    if (!d) return null;
    const gx = Math.floor(x / ED_CASE);
    const gy = Math.floor(y / ED_CASE);
    const a = (couche) => Array.isArray(d[couche]) && d[couche].some((c) => Array.isArray(c) && c[0] === gx && c[1] === gy);
    const ordre = [preferee, 'groundCells', 'groundBackCells'].filter(Boolean);
    return ordre.find(a) || null;
  }

  // Touche Suppr sans rien de sélectionné : même gomme que le clic droit, sur
  // ce qui est sous le curseur (un élément, sinon la case de sol). Renvoie
  // vrai si quelque chose a été enlevé.
  effacerSousCurseur() {
    const E = Editeur;
    const p = this.pointeur;
    if (!this.pret || !p || !p.dedans || !E.modifiable()) return false;
    const cible = this.elementSous(p.x, p.y);
    if (cible) {
      E.selectionner(cible.genre, cible.index);
      return E.supprimerSelection();
    }
    const couche = this.coucheDeSol(p.x, p.y);
    if (!couche) return false;
    return E.peindre(couche, true, [[Math.floor(p.x / ED_CASE), Math.floor(p.y / ED_CASE)]]);
  }

  // Ligne de cases entre le dernier point peint et (x, y) : un trait rapide ne laisse pas de trous.
  peindreVers(x, y) {
    const t = this.trait;
    const gx = Math.floor(x / ED_CASE);
    const gy = Math.floor(y / ED_CASE);
    let [cx, cy] = t.dernier || [gx, gy];
    const dx = Math.abs(gx - cx);
    const dy = -Math.abs(gy - cy);
    const sx = cx < gx ? 1 : -1;
    const sy = cy < gy ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      t.cases.set(`${cx},${cy}`, [cx, cy]);
      if (cx === gx && cy === gy) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; cx += sx; }
      if (e2 <= dx) { err += dx; cy += sy; }
    }
    t.dernier = [gx, gy];
    t.diagonales = Editeur.diagonalesAvecTrait(t.couche, t.efface, t.cases);
  }

  // --- Boîtes des éléments (sélection, survol) --------------------------------
  calculerBoites() {
    const d = Editeur.etat.donnees;
    const out = [];
    if (!d) return out;
    for (const [genre, g] of Object.entries(EDITEUR_GENRES)) {
      const liste = d[genre];
      if (!Array.isArray(liste)) continue;
      const geo = EDITEUR_GEOS[g.geo];
      liste.forEach((el, index) => {
        if (!el || typeof el !== 'object') return;
        try {
          const b = geo.boite(this, el, index, g);
          if (b && Number.isFinite(b.x + b.y + b.w + b.h)) out.push({ genre, index, x: b.x, y: b.y, w: Math.max(b.w, 14), h: Math.max(b.h, 14) });
        } catch (e) { /* élément incomplet : pas de boîte, il reste dans la donnée */ }
      });
    }
    return out;
  }

  boiteDe(genre, index) {
    return this.boites.find((b) => b.genre === genre && b.index === index) || null;
  }

  // L'élément le plus petit sous le point (un coffre devant un grand arbre se prend en premier).
  elementSous(x, y) {
    let best = null;
    const marge = 4 / this.cameras.main.zoom;
    for (const b of this.boites) {
      if (x < b.x - marge || x > b.x + b.w + marge || y < b.y - marge || y > b.y + b.h + marge) continue;
      if (!best || b.w * b.h < best.w * best.h) best = b;
    }
    return best;
  }

  poigneesSelection() {
    const E = Editeur;
    const sel = E.etat.selection;
    if (!sel) return [];
    const g = EDITEUR_GENRES[sel.genre];
    const geo = g && EDITEUR_GEOS[g.geo];
    const gl = this.glisse;
    const el = gl && gl.type !== 'vue' && gl.genre === sel.genre && gl.index === sel.index ? gl.el : E.elementSelectionne();
    if (!geo || !geo.poignees || !el) return [];
    try { return geo.poignees(this, el, g, this.boiteDe(sel.genre, sel.index)); } catch (e) { return []; }
  }

  poigneeSous(x, y) {
    const r = 9 / this.cameras.main.zoom;
    return this.poigneesSelection().find((h) => Math.abs(h.x - x) <= r && Math.abs(h.y - y) <= r) || null;
  }

  // --- Chaque image -----------------------------------------------------------
  update(time, delta) {
    if (!this.pret) return;
    // Une erreur ici arrêterait la boucle du jeu pour de bon (plus aucune image) : elle est dite une fois, l'éditeur continue.
    try {
      this.avancer(delta);
    } catch (e) {
      if (!this.erreurDite) { this.erreurDite = true; console.error("Éditeur : erreur d'affichage", e); }
    }
  }

  avancer(delta) {
    // Les créatures tombent sur le sol comme en jeu, puis tout s'arrête.
    if (this.tempsDePose > 0) {
      this.tempsDePose -= delta;
      if (this.player && this.player.body) this.player.setVelocityX(0);
      if (this.enemies) this.enemies.children.iterate((e) => { if (e && e.body) e.body.setVelocityX(0); });
      if (this.tempsDePose <= 0) this.physics.world.pause();
      this.boites = this.calculerBoites();
    } else if (!this.boitesAJour) {
      this.boites = this.calculerBoites();
    }
    this.boitesAJour = this.tempsDePose <= 0 && !this.glisse;
    try { if (typeof updateFarLayers === 'function') updateFarLayers(this); } catch (e) { /* lointains absents */ }
    this.deplacerAuClavier(delta);
    if (this.cameras.main.zoom !== 1 || this.fixesVus !== this.children.list.length) {
      this.fixesVus = this.children.list.length;
      this.suivreZoom();
    }
    this.dessiner();
  }

  deplacerAuClavier(delta) {
    const t = Editeur.etat.touches;
    if (!t || (!t.gauche && !t.droite && !t.haut && !t.bas)) return;
    const cam = this.cameras.main;
    const pas = (700 / cam.zoom) * (delta / 1000);
    const v = this.vueActuelle();
    this.poserVue(v.x + ((t.droite ? 1 : 0) - (t.gauche ? 1 : 0)) * pas, v.y + ((t.bas ? 1 : 0) - (t.haut ? 1 : 0)) * pas, v.zoom);
  }

  // --- Dessin des repères -----------------------------------------------------
  dessiner() {
    const E = Editeur;
    const g = this.calque;
    const cam = this.cameras.main;
    const z = cam.zoom;
    const d = E.etat.donnees;
    g.clear();
    if (!d) return;
    const trait = (px) => px / z;
    const vue = { x0: cam.scrollX + cam.width / 2 - cam.width / 2 / z, y0: cam.scrollY + cam.height / 2 - cam.height / 2 / z };
    vue.x1 = vue.x0 + cam.width / z;
    vue.y1 = vue.y0 + cam.height / z;
    const etiquettes = [];

    // Cadre de la zone : ce que la caméra du jeu peut montrer.
    const vertical = !!(d.tallLevel || (d.camera && d.camera.vertical));
    const haut = vertical ? Math.min(-400, d.levelTop ?? -400) : 0;
    const bas = vertical ? (d.levelHeight || 540) : 540;
    const larg = d.levelWidth || 960;
    g.lineStyle(trait(2), ED_COULEURS.cadre, 0.55);
    g.strokeRect(0, haut, larg, bas - haut);
    // Hors de la zone : assombri, pour que la limite se lise d'un coup d'œil.
    g.fillStyle(0x0d0b1a, 0.55);
    if (vue.x0 < 0) g.fillRect(vue.x0, vue.y0, -vue.x0, vue.y1 - vue.y0);
    if (vue.x1 > larg) g.fillRect(larg, vue.y0, vue.x1 - larg, vue.y1 - vue.y0);
    const xa = Math.max(vue.x0, 0);
    const xb = Math.min(vue.x1, larg);
    if (xb > xa) {
      if (vue.y0 < haut) g.fillRect(xa, vue.y0, xb - xa, haut - vue.y0);
      const fond = Math.max(bas, d.levelHeight || 540);
      if (vue.y1 > fond) g.fillRect(xa, fond, xb - xa, vue.y1 - fond);
    }

    // Grille (onglet Terrain, ou outil de peinture en main).
    const outil = E.etat.outil;
    const peinture = outil && (outil.outil === 'peindre' || outil.outil === 'effacer');
    if ((E.etat.onglet === 'terrain' || peinture) && z >= 0.45) {
      g.lineStyle(trait(1), ED_COULEURS.grille, peinture ? 0.22 : 0.12);
      const gx0 = Math.max(0, Math.floor(vue.x0 / ED_CASE));
      const gx1 = Math.min(Math.ceil(larg / ED_CASE), Math.ceil(vue.x1 / ED_CASE));
      const gy0 = Math.floor(Math.max(vue.y0, Math.min(haut, -400)) / ED_CASE);
      const gy1 = Math.ceil(Math.min(vue.y1, (d.levelHeight || 540) + 256) / ED_CASE);
      for (let gx = gx0; gx <= gx1; gx++) g.lineBetween(gx * ED_CASE, gy0 * ED_CASE, gx * ED_CASE, gy1 * ED_CASE);
      for (let gy = gy0; gy <= gy1; gy++) g.lineBetween(gx0 * ED_CASE, gy * ED_CASE, gx1 * ED_CASE, gy * ED_CASE);
    }

    // Repères des éléments qui ne se voient pas (ou mal) en jeu.
    const sel = E.etat.selection;
    for (const b of this.boites) {
      const genre = EDITEUR_GENRES[b.genre];
      if (!genre.repere || !Array.isArray(d[b.genre]) || !d[b.genre][b.index]) continue;
      if (b.x > vue.x1 || b.x + b.w < vue.x0 || b.y > vue.y1 || b.y + b.h < vue.y0) continue;
      const choisi = sel && sel.genre === b.genre && sel.index === b.index;
      const bb = this.boiteAffichee(b);
      g.fillStyle(genre.repere, choisi ? 0.2 : 0.12);
      g.fillRect(bb.x, bb.y, bb.w, bb.h);
      g.lineStyle(trait(1.5), genre.repere, 0.85);
      g.strokeRect(bb.x, bb.y, bb.w, bb.h);
      if (b.genre === 'breakables') {
        const el = this.glisse && this.glisse.genre === b.genre && this.glisse.index === b.index ? this.glisse.el : d[b.genre][b.index];
        g.lineStyle(trait(1), genre.repere, 0.5);
        for (const [gx, gy] of edCasesCassable(el || {})) g.strokeRect(gx * ED_CASE, gy * ED_CASE, ED_CASE, ED_CASE);
      }
    }

    // Contrôles : diagonales vides et éléments mal placés.
    const pbs = this.trait && this.trait.diagonales ? E.etat.problemes.filter((p) => p.type !== 'diagonale').concat(this.trait.diagonales) : E.etat.problemes;
    for (const p of pbs) {
      g.lineStyle(trait(2.5), ED_COULEURS.probleme, 1);
      if (p.type === 'diagonale') {
        // Les deux cases qui ne se touchent que par un coin, et la case du coin à remplir.
        const [a, b2] = p.cases;
        g.fillStyle(ED_COULEURS.probleme, 0.28);
        g.fillRect(a[0] * ED_CASE, a[1] * ED_CASE, ED_CASE, ED_CASE);
        g.fillRect(b2[0] * ED_CASE, b2[1] * ED_CASE, ED_CASE, ED_CASE);
        g.strokeRect(a[0] * ED_CASE, a[1] * ED_CASE, ED_CASE, ED_CASE);
        g.strokeRect(b2[0] * ED_CASE, b2[1] * ED_CASE, ED_CASE, ED_CASE);
        g.fillStyle(ED_COULEURS.probleme, 1);
        g.fillCircle(p.x, p.y, trait(6));
      } else {
        const b = this.boiteDe(p.genre, p.index);
        if (b) {
          const bb = this.boiteAffichee(b);
          g.strokeRect(bb.x - trait(3), bb.y - trait(3), bb.w + trait(6), bb.h + trait(6));
        }
        g.fillStyle(ED_COULEURS.probleme, 1);
        g.fillTriangle(p.x, p.y - trait(16), p.x - trait(8), p.y - trait(2), p.x + trait(8), p.y - trait(2));
      }
    }

    // Survol.
    const h = this.survol;
    if (h && !this.glisse && !this.trait && !peinture && !(sel && sel.genre === h.genre && sel.index === h.index) && edElement(d, h)) {
      g.lineStyle(trait(1.5), ED_COULEURS.survol, 0.75);
      g.strokeRect(h.x, h.y, h.w, h.h);
      // Son nom, pour savoir ce qu'on va prendre.
      etiquettes.push({ x: h.x + h.w / 2, y: h.y, texte: E.nomElement(h.genre, edElement(d, h)), couleur: ED_COULEURS.survol, discret: true });
    }

    // Sélection : cadre, patrouille, poignées.
    if (sel) {
      const b = this.boiteDe(sel.genre, sel.index);
      if (b) {
        const bb = this.boiteAffichee(b);
        g.lineStyle(trait(4), 0x0d0b1a, 0.7);
        g.strokeRect(bb.x, bb.y, bb.w, bb.h);
        g.lineStyle(trait(2), ED_COULEURS.selection, 1);
        g.strokeRect(bb.x, bb.y, bb.w, bb.h);
        etiquettes.push({ x: bb.x + bb.w / 2, y: bb.y, texte: E.nomElement(sel.genre, E.elementSelectionne()), couleur: ED_COULEURS.selection });
        const poignees = this.poigneesSelection();
        const liens = poignees.filter((p) => p.lien);
        if (liens.length === 2) {
          g.lineStyle(trait(2), ED_COULEURS.selection, 0.8);
          g.lineBetween(liens[0].x, liens[0].y, liens[1].x, liens[1].y);
          for (const l of liens) g.lineBetween(l.x, l.y - trait(9), l.x, l.y + trait(9));
        }
        for (const p of poignees) {
          g.fillStyle(0x0d0b1a, 1);
          g.fillCircle(p.x, p.y, trait(7));
          g.fillStyle(ED_COULEURS.selection, 1);
          g.fillCircle(p.x, p.y, trait(5));
        }
      }
    }

    // Trait de peinture en cours.
    if (this.trait) {
      const efface = this.trait.efface;
      for (const [gx, gy] of this.trait.cases.values()) {
        if (efface) {
          g.fillStyle(0xff5577, 0.4);
          g.fillRect(gx * ED_CASE, gy * ED_CASE, ED_CASE, ED_CASE);
        } else {
          g.fillStyle(this.trait.couche === 'groundBackCells' ? 0x3a2f55 : 0x6b4a2f, 0.9);
          g.fillRect(gx * ED_CASE, gy * ED_CASE, ED_CASE, ED_CASE);
          g.fillStyle(0x8fe6c4, 0.9);
          g.fillRect(gx * ED_CASE, gy * ED_CASE, ED_CASE, trait(5));
        }
      }
    } else if (peinture && this.pointeur.dedans && !this.glisse) {
      // Case sous la souris.
      const gx = Math.floor(this.pointeur.x / ED_CASE);
      const gy = Math.floor(this.pointeur.y / ED_CASE);
      g.lineStyle(trait(2), outil.outil === 'effacer' ? 0xff5577 : ED_COULEURS.selection, 0.95);
      g.strokeRect(gx * ED_CASE, gy * ED_CASE, ED_CASE, ED_CASE);
    }

    this.dessinerFantome(g, trait);
    E.poserEtiquettes(etiquettes, (x, y) => this.versPage(x, y));

    // Le curseur dit ce que fera le clic.
    let curseur = 'default';
    if (this.glisse && this.glisse.type === 'vue') curseur = 'grabbing';
    else if (E.etat.espace) curseur = 'grab';
    else if (this.glisse) curseur = this.glisse.type === 'poignee' ? 'crosshair' : 'move';
    else if (peinture) curseur = 'crosshair';
    else if (this.pointeur.dedans && this.poigneeSous(this.pointeur.x, this.pointeur.y)) curseur = 'crosshair';
    else if (outil && outil.genre) curseur = h && sel && sel.genre === h.genre && sel.index === h.index ? 'move' : 'copy';
    else if (h) curseur = 'move';
    if (curseur !== this.curseur) { this.curseur = curseur; this.game.canvas.style.cursor = curseur; }
  }

  // Boîte d'un élément, décalée pendant qu'on le fait glisser.
  boiteAffichee(b) {
    const gl = this.glisse;
    if (!gl || gl.type === 'vue' || gl.genre !== b.genre || gl.index !== b.index) return b;
    const g = EDITEUR_GENRES[b.genre];
    if (gl.type === 'poignee' || !this.objetDe(b.genre, b.index)) {
      try {
        // Sans objet du jeu derrière : la boîte se recalcule sur la copie en cours de réglage.
        const sansObjet = this.objets;
        this.objets = {};
        const nb = EDITEUR_GEOS[g.geo].boite(this, gl.el, b.index, g);
        this.objets = sansObjet;
        if (gl.type === 'poignee' && this.objetDe(b.genre, b.index)) return b;
        return nb || b;
      } catch (e) { return b; }
    }
    const dec = gl.decalage || { x: 0, y: 0 };
    return { ...b, x: b.x + dec.x, y: b.y + dec.y };
  }

  // Aperçu de l'élément en main, sous la souris.
  dessinerFantome(g, trait) {
    const E = Editeur;
    const outil = E.etat.outil;
    const montrer = outil && outil.genre && this.pointeur.dedans && !this.glisse && E.modifiable();
    if (!montrer) {
      if (this.fantome) this.fantome.setVisible(false);
      return;
    }
    const genre = EDITEUR_GENRES[outil.genre];
    const geo = EDITEUR_GEOS[genre.geo];
    let el;
    let b;
    try {
      el = geo.creer(this, E.copie(outil.modele || {}), this.pointeur.x, this.pointeur.y, genre);
      const sauve = this.objets;
      this.objets = {};
      b = geo.boite(this, el, -1, genre);
      this.objets = sauve;
    } catch (e) { return; }
    const t = EditeurImages.texture(this, outil.image);
    if (t && outil.genre !== 'water' && outil.genre !== 'windCurrents') {
      if (!this.fantome || !this.fantome.active) {
        this.fantome = this.add.image(0, 0, t.key).setDepth(199999).setAlpha(0.7);
        this.fantome.lookRole = 'ui';
      }
      const f = this.fantome;
      if (f.texture.key !== t.key) f.setTexture(t.key);
      f.setVisible(true);
      if (outil.genre === 'props') {
        // Le décor à sa vraie taille, pieds sur le sol.
        f.setOrigin(0.5, 1).setScale(el.scale || propDefaultScale(el.type)).setPosition(el.x, el.y);
        const vb = typeof objectVisibleBox === 'function' ? objectVisibleBox(f) : null;
        if (vb && !(el.hang || el.free)) f.y += el.y - vb.bottom;
        const r = typeof objectVisibleBox === 'function' ? objectVisibleBox(f) : null;
        if (r) b = { x: r.left, y: r.top, w: r.right - r.left, h: r.bottom - r.top };
      } else {
        const k = Math.min(b.w / f.width, b.h / f.height);
        f.setOrigin(0.5, 0.5).setScale(k).setPosition(b.x + b.w / 2, b.y + b.h / 2);
      }
    } else if (this.fantome) {
      this.fantome.setVisible(false);
    }
    g.lineStyle(trait(2), ED_COULEURS.pose, 0.95);
    g.strokeRect(b.x, b.y, b.w, b.h);
    if (genre.repere) { g.fillStyle(genre.repere, 0.18); g.fillRect(b.x, b.y, b.w, b.h); }
  }
}

// BootScene lance toujours 'EditorScene' en mode éditeur : ce relais porte ce
// nom quand le nouvel éditeur est demandé (cf. src/main.js) et passe la main.
class EditeurRelaisScene extends Phaser.Scene {
  constructor() { super('EditorScene'); }

  create() { this.scene.start('EditeurScene'); }
}

// « Jouer » pour une zone qui n'a pas (encore) sa propre scène : la zone telle quelle.
class EditeurJeuScene extends Phaser.Scene {
  constructor() { super('EditeurJeuScene'); }

  create(sceneData) {
    const jeu = Editeur.etat.jeu;
    if (!jeu) { this.scene.start('EditeurScene'); return; }
    buildLevelFromData(this, Editeur.copie(jeu.donnees), sceneData);
  }

  update(time, delta) { updateLevelFromData(this, time, delta); }
}

const EDITEUR_SCENES = [EditeurRelaisScene, EditeurScene, EditeurJeuScene];
