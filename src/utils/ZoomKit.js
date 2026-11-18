// Zoom du jeu : UN SEUL réglage, ZOOM_JEU (1 = rendu d'origine, sans aucun changement).
//
// Tout le code du jeu continue de raisonner en écran 960 x 540 : caméras, scrollX / scrollY, worldView,
// scale.width, pointeur et apparition des ennemis gardent leur sens, le gameplay ne dépend donc pas du zoom.
// Seule l'image finale change, au dernier moment (Camera.preRender) :
//  - le canvas fait vue x caméra pixels (x1,3 : 740 x 416 x 3 = 2220 x 1248) ;
//  - le monde des niveaux est dessiné à l'échelle ENTIÈRE `camera`, ce qui garde des pixels réguliers, et montre
//    un cadre de 740 x 416 pris dans l'ancien écran de 960 x 540 (centré en largeur, plus bas que le milieu en
//    hauteur pour garder le sol à l'image) ;
//  - l'interface (objets fixés à l'écran, profondeur >= ZOOM_PROFONDEUR_UI) passe par une 2e caméra et les scènes
//    de menu par leur propre caméra : mêmes tailles et mêmes places qu'avant.
const ZOOM_JEU = 1.3;
// Zones conçues pour tenir dans 960 x 540 (clé de scène -> zoom) : l'arène entière doit rester à l'image
const ZOOM_PAR_ZONE = { AreneGhiltScene: 1, GrandArbreAreneScene: 1 };
const ZOOM_PROFONDEUR_UI = 500;
const ZOOM_LARGEUR = 960;
const ZOOM_HAUTEUR = 540;

const ZoomKit = (() => {
  // Sans WebGL (rendu de secours) : pas de zoom
  const webgl = typeof document === 'undefined' || !!document.createElement('canvas').getContext('webgl');
  const ZOOM_BASE = webgl ? ZOOM_JEU : 1;
  // Dimensions paires : le centre de la caméra tombe sur un pixel entier
  function niveau(zoom) {
    const h = 2 * Math.round(ZOOM_HAUTEUR / zoom / 2), w = 2 * Math.round(h * 16 / 9 / 2);
    const camera = zoom === 1 ? (ZOOM_BASE === 1 ? 1 : 2) : Math.ceil(2 * zoom);
    return { zoom, vue: [w, h], camera, rendu: [w * camera, h * camera], ax: (ZOOM_LARGEUR - w) / 2, ay: Math.round((ZOOM_HAUTEUR - h) * 0.75) };
  }

  const etat = { n: niveau(ZOOM_BASE), px: 1, py: 1, jeu: null };
  const actualiser = () => { etat.px = etat.n.rendu[0] / ZOOM_LARGEUR; etat.py = etat.n.rendu[1] / ZOOM_HAUTEUR; };
  actualiser();
  const actif = () => ZOOM_BASE !== 1;

  // ---------------------------------------------------------------- objets hors du cadre
  // Une image ou un sprite entièrement hors du cadre visible n'est pas envoyé au dessin. Seul le DESSIN est coupé : mises à
  // jour, animations, physique, déclencheurs et minuteries tournent comme avant. Marge large : un objet ne peut pas apparaître
  // au bord. Rien n'est coupé pendant un tremblement, un zoom ou une rotation de caméra, ni dans un conteneur.
  // `?sansmasquage` dans l'adresse : tout est dessiné (comparaisons).
  const MARGE_CADRE = 96;
  const masquage = typeof window === 'undefined' || !new URLSearchParams(window.location.search).has('sansmasquage');
  function horsDuCadre(o, cam, v) {
    if ((o.type !== 'Image' && o.type !== 'Sprite') || o.parentContainer) return false;
    if (o.originX < 0 || o.originX > 1 || o.originY < 0 || o.originY > 1) return false;
    // Rayon qui couvre l'objet quels que soient son origine et sa rotation
    const r = Math.hypot(o.displayWidth, o.displayHeight) + MARGE_CADRE;
    const x = o.x - cam.scrollX * (o.scrollFactorX - 1), y = o.y - cam.scrollY * (o.scrollFactorY - 1);
    return x + r < v.left || x - r > v.right || y + r < v.top || y - r > v.bottom;
  }
  function installerMasquage() {
    if (!masquage) return;
    Phaser.Cameras.Scene2D.CameraManager.prototype.getVisibleChildren = function (enfants, cam) {
      const libre = cam.zoom === 1 && cam.rotation === 0 && !cam.shakeEffect.isRunning;
      const ref = cam.__zoomMondeRef, secousse = ref && ref.shakeEffect.isRunning;
      const v = libre && !secousse ? vueVisible(cam) : null;
      const vus = [];
      for (let i = 0; i < enfants.length; i++) {
        const o = enfants[i];
        if (o.willRender(cam) && !(v && horsDuCadre(o, cam, v))) vus.push(o);
      }
      return vus;
    };
  }

  // ---------------------------------------------------------------- avant la création du jeu
  function installer() {
    if (!actif()) return;
    installerMasquage();
    const C = Phaser.Cameras.Scene2D.Camera.prototype;
    // Les caméras gardent 960 x 540 quand le canvas change de taille
    Phaser.Cameras.Scene2D.CameraManager.prototype.onResize = function () {};
    const preRender = C.preRender, clampX = C.clampX, clampY = C.clampY;
    C.preRender = function () {
      preRender.call(this);
      const monde = this.__zoomMonde, sx = monde ? etat.n.camera : etat.px, sy = monde ? etat.n.camera : etat.py;
      const ax = monde ? etat.n.ax : 0, ay = monde ? etat.n.ay : 0, m = this.matrix;
      // l'interface tremble avec le monde, comme quand elle passait par la même caméra
      const sh = this.__zoomMondeRef && this.__zoomMondeRef.shakeEffect;
      const ox = sh && sh.isRunning ? sh._offsetX : 0, oy = sh && sh.isRunning ? sh._offsetY : 0;
      m.setTransform(m.a * sx, m.b * sx, m.c * sy, m.d * sy, (m.e + ox - ax) * sx, (m.f + oy - ay) * sy);
    };
    // Écran logique -> monde, à travers la matrice réellement dessinée
    C.getWorldPoint = function (x, y, sortie) {
      const out = sortie || new Phaser.Math.Vector2(), m = this.matrix, det = m.a * m.d - m.b * m.c;
      if (!det) { out.x = x; out.y = y; return out; }
      const dx = x * etat.px - m.e, dy = y * etat.py - m.f;
      out.x = (m.d * dx - m.c * dy) / det + this.scrollX;
      out.y = (m.a * dy - m.b * dx) / det + this.scrollY;
      return out;
    };
    // Limites de caméra : c'est le cadre VISIBLE qui reste dans le monde, jamais de vide autour
    const borner = (v, min, max) => (max < min ? (min + max) / 2 : Math.min(max, Math.max(min, v)));
    C.clampX = function (x) {
      if (!this.__zoomMonde || etat.n.ax === 0) return clampX.call(this, x);
      const b = this._bounds;
      return borner(x, b.x - etat.n.ax, b.x + b.width - etat.n.ax - etat.n.vue[0]);
    };
    C.clampY = function (y) {
      if (!this.__zoomMonde || etat.n.ay === 0) return clampY.call(this, y);
      const b = this._bounds;
      return borner(y, b.y - etat.n.ay, b.y + b.height - etat.n.ay - etat.n.vue[1]);
    };
    // Fond, découpe et fondus : sur tout le canvas, pas sur les 960 x 540 logiques
    const R = Phaser.Renderer.WebGL.WebGLRenderer.prototype;
    const pleinCanvas = (cam, f) => {
      const liste = [cam, cam.__zoomMondeRef].filter(Boolean), tailles = liste.map((c) => [c._width, c._height]);
      liste.forEach((c) => { c._width = etat.n.rendu[0]; c._height = etat.n.rendu[1]; });
      const r = f();
      liste.forEach((c, i) => { c._width = tailles[i][0]; c._height = tailles[i][1]; });
      return r;
    };
    const preCam = R.preRenderCamera, postCam = R.postRenderCamera;
    R.preRenderCamera = function (cam) { return pleinCanvas(cam, () => preCam.call(this, cam)); };
    R.postRenderCamera = function (cam) {
      // Fondu et flash du monde : dessinés une seule fois, après l'interface qu'ils recouvraient déjà
      const ui = cam.__zoomUi;
      if (!ui || !ui.visible) return pleinCanvas(cam, () => postCam.call(this, cam));
      const { flashEffect, fadeEffect } = cam;
      cam.flashEffect = EFFET_VIDE; cam.fadeEffect = EFFET_VIDE;
      const r = pleinCanvas(cam, () => postCam.call(this, cam));
      cam.flashEffect = flashEffect; cam.fadeEffect = fadeEffect;
      return r;
    };
  }
  const EFFET_VIDE = { isRunning: false, isComplete: false, postRenderWebGL: () => false };

  // Le jeu voit toujours un écran de 960 x 540, pointeur compris
  function brancher(jeu) {
    etat.jeu = jeu;
    if (!actif()) return jeu;
    const sc = jeu.scale;
    Object.defineProperty(sc, 'width', { get: () => ZOOM_LARGEUR });
    Object.defineProperty(sc, 'height', { get: () => ZOOM_HAUTEUR });
    sc.transformX = (x) => (x - sc.canvasBounds.left) * ZOOM_LARGEUR / (sc.canvasBounds.width || ZOOM_LARGEUR);
    sc.transformY = (y) => (y - sc.canvasBounds.top) * ZOOM_HAUTEUR / (sc.canvasBounds.height || ZOOM_HAUTEUR);
    return jeu;
  }

  // ---------------------------------------------------------------- scènes de niveau
  // Objet fixé à l'écran et au-dessus du monde : interface ; le reste (ciel, voiles lointains) suit le cadre du monde
  function repartir(scene) {
    const cam = scene.cameras.main, ui = cam.__zoomUi, liste = scene.children.list;
    for (let i = 0; i < liste.length; i++) {
      const o = liste[i], estUi = o.scrollFactorX === 0 && o.scrollFactorY === 0 && o.depth >= ZOOM_PROFONDEUR_UI;
      if (o.__zoomUi === estUi) continue;
      o.__zoomUi = estUi;
      o.cameraFilter = (o.cameraFilter & ~(cam.id | ui.id)) | (estUi ? cam.id : ui.id);
    }
  }

  function preparerScene(scene) {
    const cam = scene.cameras.main;
    cam.__zoomMonde = true;
    if (!cam.__zoomUi) {
      const ui = scene.cameras.add(0, 0, ZOOM_LARGEUR, ZOOM_HAUTEUR).setOrigin(0, 0);
      ui.setName('zoom-interface');
      // fondus et flashs du monde, jouant une seule fois (update) et dessinés par-dessus l'interface
      ui.flashEffect = cam.flashEffect;
      ui.fadeEffect = cam.fadeEffect;
      ui.update = () => {};
      ui.__zoomMondeRef = cam;
      cam.__zoomUi = ui;
    }
    if (scene.__zoomRepartir) return;
    scene.__zoomRepartir = () => repartir(scene);
    scene.events.on('prerender', scene.__zoomRepartir);
    scene.events.once('shutdown', () => { scene.events.off('prerender', scene.__zoomRepartir); scene.__zoomRepartir = null; });
  }

  // Niveau de zoom d'une scène de jeu ; change la taille du canvas si besoin
  function appliquer(scene, zoom) {
    if (!actif()) return etat.n;
    if (etat.n.zoom === zoom && scene.cameras.main.__zoomUi && scene.__zoomRepartir) return etat.n;
    etat.n = niveau(zoom);
    actualiser();
    const sc = scene.game.scale, [W, H] = etat.n.rendu;
    if (sc.gameSize.width !== W || sc.gameSize.height !== H) sc.setGameSize(W, H);
    preparerScene(scene);
    return etat.n;
  }

  // Appelée à la construction de chaque niveau
  const entrerNiveau = (scene) => appliquer(scene, ZOOM_PAR_ZONE[scene.scene.key] ?? ZOOM_BASE);
  // Combat qui doit tenir dans tout l'écran (duel de Geralt) : retour immédiat à x1, puis au zoom de la zone
  const zoomCombat = (scene, enCombat) => appliquer(scene, enCombat ? 1 : (ZOOM_PAR_ZONE[scene.scene.key] ?? ZOOM_BASE));

  // ---------------------------------------------------------------- lectures
  // Cadre du monde réellement visible (px du monde)
  function vueVisible(cam) {
    if (!actif() || !cam.__zoomMonde) return { left: cam.scrollX, top: cam.scrollY, right: cam.scrollX + cam.width, bottom: cam.scrollY + cam.height };
    const left = cam.scrollX + etat.n.ax, top = cam.scrollY + etat.n.ay;
    return { left, top, right: left + etat.n.vue[0], bottom: top + etat.n.vue[1] };
  }
  // Position à l'écran logique 960 x 540 d'un point du monde
  function versEcran(cam, x, y) {
    if (!actif() || !cam.__zoomMonde) return { x: x - cam.scrollX, y: y - cam.scrollY };
    return { x: (x - cam.scrollX - etat.n.ax) * etat.n.camera / etat.px, y: (y - cam.scrollY - etat.n.ay) * etat.n.camera / etat.py };
  }

  return { installer, brancher, niveau, appliquer, entrerNiveau, zoomCombat, vueVisible, versEcran, actif, etat, rendu: () => etat.n.rendu };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = ZoomKit;
