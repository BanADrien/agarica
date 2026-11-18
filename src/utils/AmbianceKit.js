// AmbianceKit : ambiance d'éclairage d'une zone (forêt : lumière verte sous la canopée, rayons de soleil entre les
// feuilles). Toutes les valeurs sont dans src/data/ambiances_lumiere.js, qui dit aussi quelles zones l'utilisent.
//
// UNE seule source pour les rayons : le masque de canopée (une ligne de cellules, trouées et hauteur où chaque rayon
// touche le décor), projeté selon la direction fixe du soleil. Il sert au shader des personnages et du décor
// (LightKit, par pixel), aux faisceaux visibles et aux poussières.
//
// Une zone déclarée dans AMBIANCE_PAR_ZONE passe par preparerDonnees() au début de buildLevelFromData (le voile, le
// rendu LookKit et les faux rayons de la zone sont retirés : pas de double effet), puis par attacher() à la fin.
// La zone de test foret_lumiere appelle installer() directement et garde son panneau de réglage.
const AmbianceKit = (() => {
  const CELLULE = 2;          // largeur d'une cellule du masque (px du monde)
  const U0 = -400;            // début du masque sur l'axe de projection
  const BANDE = 12;           // épaisseur éclairée sous le point où le rayon touche le sol
  const PLAGE_MINI = 1020;    // hauteurs couvertes par le masque (px du monde), plus si la zone monte très haut
  const NOM_PIPELINE = 'ForetRayons';

  // Faisceaux visibles : lumière douce aux bords fondus, découpée par le même masque
  class RayonsPipeline extends Phaser.Renderer.WebGL.Pipelines.SinglePipeline {
    constructor(game) {
      super({
        game,
        fragShader: `
#define SHADER_NAME FORET_RAYONS_FS
precision highp float;
uniform sampler2D uMainSampler;
uniform float uFaisceau;
varying vec2 outTexCoord;
${LightKit.FRAG_MASQUE}
void main() {
  vec2 m = pointMonde();
  float k = min(masqueDoux(m, 18.0) * 1.5, 1.0) * step(0.0, texture2D(uMainSampler, outTexCoord).a);
  if (k <= 0.0) discard;
  float h = clamp(1.0 - m.y / 640.0, 0.3, 1.0);
  float a = k * h * uFaisceau;
  gl_FragColor = vec4(vec3(1.0, 0.92, 0.66) * a, a);
}`,
      });
      this.masque = null;
      this.faisceau = 0;
    }

    onRender(scene, camera) {
      const mq = this.masque;
      if (!mq || !camera.__zoomMonde && ZoomKit.actif()) return;
      const M = camera.matrix;
      this.set1i('uMasque', 1);
      this.set1f('uFaisceau', this.faisceau);
      this.set4f('uMasqueGeo', mq.pente, mq.u0, mq.cel, mq.n);
      this.set4f('uMasqueAnim', mq.amp, mq.t, mq.bande, 1);
      this.set2f('uMasqueHaut', mq.haut, mq.plage);
      this.set4f('uMondeEcran', 1 / M.a, camera.scrollX - M.e / M.a, camera.scrollY - M.f / M.d, this.renderer.height);
    }

    onBeforeFlush() {
      if (!this.masque) return;
      const gl = this.gl;
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.masque.tex.webGLTexture);
      gl.activeTexture(gl.TEXTURE0);
    }
  }

  // ---------------------------------------------------------------- quelle zone, quelle ambiance
  const adresse = () => (typeof window === 'undefined' ? new URLSearchParams('') : new URLSearchParams(window.location.search));

  // Nom de l'ambiance de cette scène, null si elle garde son rendu habituel. `?lumiere` reste le mode de test de
  // LightKit ; l'option « Effets visuels » désactivée coupe aussi l'ambiance (machines modestes).
  function nomPour(scene) {
    if (typeof AMBIANCE_ACTIVE === 'undefined' || !AMBIANCE_ACTIVE) return null;
    const nom = AMBIANCE_PAR_ZONE[scene.scene.key];
    if (!nom || !AMBIANCES_LUMIERE[nom]) return null;
    const q = adresse();
    if (q.has('sanslumiere') || q.has('lumiere')) return null;
    if (typeof lookEnabled === 'function' && !lookEnabled()) return null;
    const r = scene.game.renderer;
    return r && r.type === Phaser.WEBGL ? nom : null;
  }

  // Début de buildLevelFromData : ce que l'ambiance remplace disparaît de la zone, comme dans la zone de test.
  function preparerDonnees(scene, data) {
    if (!nomPour(scene)) return data;
    const { ambient, look, ...reste } = data;
    return { ...reste, lights: [] };
  }

  // Fin de buildLevelFromData
  function attacher(scene, data) {
    const nom = nomPour(scene);
    return nom ? installer(scene, data, AMBIANCES_LUMIERE[nom]) : null;
  }

  // ---------------------------------------------------------------- construction
  function installer(scene, data, valeurs) {
    const ok = LightKit.activer(scene, { ambiance: 0x303a30 });
    const { soleil, ...v } = valeurs;
    const st = { ok, scene, data, soleilDir: soleil, v, eclairage: true, image: 0, teintes: [], poussieres: [], fraiches: scene.children.list.slice() };
    scene.__ambiance = st;
    if (!ok) return st;
    // Agarica est toujours à l'écran : ses cartes d'abord. Les autres sprites demandent les leurs à leur premier affichage.
    LightKit.demanderCartes(scene.game, /^agarica_/);
    st.soleil = LightKit.ajouterSoleil(scene, { direction: soleil, couleur: 0xfff0c8, intensite: v.rayons });
    st.soleil.attenuation = (o) => (o.scrollFactorX === 1 ? 1 : 0);   // fonds lointains : ambiance seule
    refaireMasque(st);
    creerFaisceaux(st);
    creerPoussieres(st);
    st.sources = LightKit.sourcesLumineuses(scene, { max: 6 });
    appliquerRendu(st);
    ranger(st);
    const surAjout = (o) => st.fraiches.push(o);
    const surRendu = () => ranger(st);
    const surImage = (t, delta) => image(st, delta);
    scene.events.on('addedtoscene', surAjout);
    scene.events.on('prerender', surRendu);
    scene.events.on('postupdate', surImage);
    scene.events.once('shutdown', () => {
      scene.events.off('addedtoscene', surAjout);
      scene.events.off('prerender', surRendu);
      scene.events.off('postupdate', surImage);
      if (scene.textures.exists('foret-masque')) scene.textures.remove('foret-masque');
      const pl = scene.game.renderer.pipelines.get(NOM_PIPELINE);
      if (pl) pl.masque = null;
      st.fraiches.length = 0;
      scene.__ambiance = null;
    });
    return st;
  }

  // Cases pleines du décor, pour savoir où chaque rayon s'arrête
  function testSolide(data) {
    const cle = (gx, gy) => (gx + 4096) * 8192 + gy + 4096;
    const pleines = new Set((data.groundCells || []).map(([gx, gy]) => cle(gx, gy)));
    const branches = (data.branches || []).map((b) => ({ x0: b.from[0], x1: b.to[0], y0: b.from[1], y1: b.from[1] + (b.thickness || 56) }));
    return (x, y) => pleines.has(cle(Math.floor(x / 64), Math.floor(y / 64)))
      || branches.some((b) => x >= b.x0 && x < b.x1 && y >= b.y0 && y < b.y1);
  }

  // Masque de canopée : R = trouée (0, bord 0,5, coeur 1), G = hauteur d'arrivée du rayon, B = irrégularité des bords
  function refaireMasque(st) {
    const { scene, data, v } = st;
    const pente = -st.soleilDir.x / st.soleilDir.y;
    // Zone qu'on gravit (levelTop négatif) : le masque commence plus haut et s'étend d'autant vers la droite
    const haut = Math.min(0, data.levelTop ?? 0), plage = Math.max(PLAGE_MINI, (data.levelHeight || 540) + 300 - haut);
    const marge = Math.max(400, Math.ceil(Math.abs(pente * haut)) + 40);
    const n = Math.ceil((data.levelWidth - U0 + marge) / CELLULE);
    const tex = scene.textures.exists('foret-masque') ? scene.textures.get('foret-masque') : scene.textures.createCanvas('foret-masque', n, 1);
    const ctx = tex.getContext(), im = ctx.createImageData(n, 1), d = im.data, solide = testSolide(data);
    // Suite pseudo-aléatoire fixe : les trouées ne changent pas d'une visite à l'autre
    let graine = 73211;
    const hasard = () => { graine = (graine * 16807) % 2147483647; return graine / 2147483647; };
    for (let i = 0; i < n; i++) {
      const u = U0 + (i + 0.5) * CELLULE;
      let y = haut;
      while (y < haut + plage - 4 && !solide(u + pente * y, y)) y += 4;
      d[i * 4 + 1] = Math.round((y - haut) / plage * 255);
      d[i * 4 + 2] = Math.floor(hasard() * 256);
      d[i * 4 + 3] = 255;
    }
    const vide = v.largeur * (1 - v.densite) / v.densite;
    for (let u = 40 * hasard(); u < n * CELLULE;) {
      const l = v.largeur * (0.35 + 1.3 * hasard()), a = Math.round(u / CELLULE), b = Math.round((u + l) / CELLULE);
      for (let i = a; i < b && i < n; i++) d[i * 4] = i - a < 2 || b - 1 - i < 2 ? 128 : 255;
      u += l + vide * (0.3 + 1.4 * hasard());
    }
    ctx.putImageData(im, 0, 0);
    tex.refresh();
    tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
    st.masque = {
      tex: tex.source[0].glTexture, pente, u0: U0, cel: CELLULE, n, amp: v.balancement, t: 0, bande: BANDE, haut, plage,
      lire: (w) => { const i = Math.min(n - 1, Math.max(0, Math.floor(w * n))) * 4; return { r: d[i] / 255, g: d[i + 1] / 255, b: d[i + 2] / 255 }; },
    };
    LightKit.reglerRendu(scene, { masque: st.masque });
    const pl = scene.game.renderer.pipelines.get(NOM_PIPELINE);
    if (pl) pl.masque = st.masque;
  }

  function creerFaisceaux(st) {
    const { scene } = st, pipes = scene.game.renderer.pipelines;
    if (!pipes.has(NOM_PIPELINE)) pipes.add(NOM_PIPELINE, new RayonsPipeline(scene.game));
    pipes.get(NOM_PIPELINE).masque = st.masque;
    st.faisceaux = scene.add.image(0, 0, '__WHITE').setOrigin(0, 0).setScrollFactor(0).setDisplaySize(ZOOM_LARGEUR, ZOOM_HAUTEUR)
      .setDepth(CHARACTER_DEPTH + 3).setBlendMode(Phaser.BlendModes.ADD).setPipeline(NOM_PIPELINE);
    st.faisceaux.__ambianceVu = true;
  }

  function creerPoussieres(st) {
    for (let i = 0; i < 48; i++) {
      const p = st.scene.add.image(0, 0, '__WHITE').setDisplaySize(2, 2).setTint(0xffd98a).setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(CHARACTER_DEPTH + 4).setAlpha(0);
      p.__ambianceVu = true;
      st.poussieres.push({ p, x: Math.random() * 1000, y: Math.random() * 540, vx: 3 + Math.random() * 5, vy: 5 + Math.random() * 9, ph: Math.random() * 6.28 });
    }
  }

  // Teinte d'un fond répété : celle de l'ambiance, multipliée par celle que la zone lui avait déjà donnée
  function teinter(st, o) {
    const m = (a, b) => Math.round(((a & 255) * (b & 255)) / 255);
    const t0 = o.__ambianceTeinte0, t = st.teinteFond;
    o.setTint(t0 === undefined ? t : (m(t0 >> 16, t >> 16) << 16) | (m(t0 >> 8, t >> 8) << 8) | m(t0, t));
  }

  // Ambiance fraîche et verte, teinte commune aux personnages et au décor
  function appliquerRendu(st) {
    const { scene, v } = st, a = v.ambiance, t = v.teinte;
    const ciel = [a * (1 - t), a * (1 + t * 0.25), a * (1 - t * 0.7)];
    LightKit.reglerRendu(scene, { ciel, sol: ciel.map((c) => c * 0.94), detail: 1, epaule: 0.85, paliers: 4, lueurCorps: v.lueurCorps, rayonAvant: v.rayonAvant });
    LightKit.regler(st.soleil, { intensite: v.rayons });
    st.teinteFond = Phaser.Display.Color.GetColor(...ciel.map((c) => Math.round(Math.min(1, c) * 255)));
    for (const o of st.teintes) if (o.active) teinter(st, o);
    scene.game.renderer.pipelines.get(NOM_PIPELINE).faisceau = v.faisceaux;
    st.masque.amp = v.balancement;
  }

  // ---------------------------------------------------------------- objets du monde
  // Interface posée dans le monde (bulles, invites, icônes) : mêmes règles que LookKit, jamais assombrie
  const estInterface = (o) => (o.scrollFactorX === 0 && o.depth >= ZOOM_PROFONDEUR_UI)
    || (typeof lookRoleOf === 'function' && lookRoleOf(o) === 'ui');

  // Fond répété ou lueur de sortie : suit la teinte de l'ambiance, y compris quand on la règle ou la coupe
  function suivreTeinte(st, o) {
    if (o.isTinted) o.__ambianceTeinte0 = o.tintTopLeft;
    teinter(st, o);
    st.teintes.push(o);
  }

  function rangerObjet(st, o) {
    if (o.__ambianceVu || !o.scene) return;
    o.__ambianceVu = true;
    // Lueur d'une sortie : le repère reste visible, sans brûler un décor devenu plus sombre
    if (o.texture && o.texture.key.startsWith('edge-glow-')) { suivreTeinte(st, o); return; }
    if (o.__lumiereEmissif !== undefined) return;   // sources de lumière : jamais assombries
    if (estInterface(o)) return;
    if (o.type === 'Container') { for (const c of o.list) rangerObjet(st, c); return; }
    if (o.blendMode === Phaser.BlendModes.ADD) return;
    if (o.type === 'Sprite' || o.type === 'Image') LightKit.eclairer(o);
    else if (o.type === 'TileSprite') suivreTeinte(st, o);
  }

  // Tout ce qui apparaît dans le monde passe par le même éclairage dès sa première image (ennemis, projectiles...)
  function ranger(st) {
    if (!st.fraiches.length) return;
    st.sources.scanner();
    for (const o of st.fraiches.splice(0)) rangerObjet(st, o);
  }

  // ---------------------------------------------------------------- à chaque image
  function image(st, delta) {
    if (!st.ok) return;
    const { scene, masque: mq } = st;
    if (++st.image % 12 === 1) st.sources.scanner();
    st.sources.maj(delta / 1000);
    const t = scene.time.now / 1000, v = ZoomKit.vueVisible(scene.cameras.main);
    mq.t = t;
    const dt = delta / 1000, l = v.right - v.left, h = v.bottom - v.top;
    for (const d of st.poussieres) {
      d.x += d.vx * dt; d.y += d.vy * dt;
      const wx = v.left + (((d.x + 8 * Math.sin(t * 0.7 + d.ph)) % l) + l) % l, wy = v.top + ((d.y % h) + h) % h;
      d.p.setPosition(Math.round(wx), Math.round(wy));
      const k = st.eclairage ? LightKit.masqueSoleil({ x: wx, y: wy }, mq) : 0;
      d.p.setAlpha(k * (0.45 + 0.45 * Math.sin(t * 1.3 + d.ph) ** 2));
    }
  }

  // Coupe ou rallume l'ambiance sans quitter la zone (touche G du test, option « Effets visuels »)
  function basculer(st, oui) {
    if (!st.ok) return;
    st.eclairage = oui;
    if (oui) st.scene.lights.enable(); else st.scene.lights.disable();
    st.faisceaux.setVisible(oui);
    st.sources.actif(oui);
    for (const o of st.teintes) {
      if (!o.active) continue;
      if (oui) teinter(st, o);
      else if (o.__ambianceTeinte0 !== undefined) o.setTint(o.__ambianceTeinte0);
      else o.clearTint();
    }
  }

  // Option « Effets visuels » changée pendant la partie (lookSetEnabled)
  function optionEffets(scene, oui) {
    if (scene.__ambiance) basculer(scene.__ambiance, oui);
  }

  return { nomPour, preparerDonnees, attacher, installer, refaireMasque, appliquerRendu, basculer, optionEffets };
})();
