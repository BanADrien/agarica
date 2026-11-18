// Forêt de lumière : `index.html?zone=foret_lumiere&lumiere`. Copie de la première partie de la forêt sombre,
// plus sombre, avec des rayons de soleil qui passent entre les feuilles. UNE seule source pour tout : le masque de
// canopée (une ligne de cellules, trouées et hauteur où chaque rayon touche le décor), projeté selon la direction
// fixe du soleil. Il sert au shader des personnages et du décor (LightKit, par pixel), aux faisceaux visibles et aux
// poussières. Touches : U / J réglage, H / L valeur, C copier, W panneau, G éclairage coupé.

const FORET_CELLULE = 2;          // largeur d'une cellule du masque (px du monde)
const FORET_U0 = -400;            // début du masque sur l'axe de projection
const FORET_BANDE = 12;           // épaisseur éclairée sous le point où le rayon touche le sol
const FORET_SOLEIL = { x: -0.4, y: 0.8, z: 0.7 };
const FORET_REGLAGES = [
  { id: 'ambiance', pas: 0.02, min: 0.1, max: 1, val: 0.46 },
  { id: 'teinte', pas: 0.02, min: 0, max: 0.5, val: 0.14 },
  { id: 'rayons', pas: 0.05, min: 0, max: 2, val: 0.95 },
  { id: 'densite', pas: 0.02, min: 0.04, max: 0.7, val: 0.18, masque: true },
  { id: 'largeur', pas: 2, min: 6, max: 90, val: 24, masque: true },
  { id: 'faisceaux', pas: 0.02, min: 0, max: 0.6, val: 0.1 },
  { id: 'balancement', pas: 0.5, min: 0, max: 10, val: 3 },
];

// Faisceaux visibles : lumière douce aux bords fondus, découpée par le même masque
class ForetRayonsPipeline extends Phaser.Renderer.WebGL.Pipelines.SinglePipeline {
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

class ForetLumiereScene extends Phaser.Scene {
  constructor() {
    super('ForetLumiereScene');
  }

  create(sceneData) {
    this.__laboLumiere = true;   // LightKit.modeTest laisse la main à cette scène
    this.__foret = null;
    LaboLumiereScene.prototype.laboProtegerPartie.call(this);   // rien n'est gardé dans la sauvegarde
    resolveZoneData('foret_lumiere', FORET_LUMIERE_DATA).then((data) => {
      buildLevelFromData(this, data, sceneData);
      this.foretConstruire(data);
    });
  }

  update(time, delta) {
    updateLevelFromData(this, time, delta);
    if (this.__foret) this.foretImage(delta);
  }

  foretConstruire(data) {
    const ok = LightKit.activer(this, { ambiance: 0x303a30 });
    const st = {
      ok, data, eclairage: true, visible: true, ligne: 0, image: 0, note: '', teintes: [], poussieres: [],
      v: Object.fromEntries(FORET_REGLAGES.map((r) => [r.id, r.val])),
    };
    this.__foret = st;
    LaboLumiereScene.prototype.laboFormes.call(this);
    if (ok) {
      const sol = LightKit.ajouterSoleil(this, { direction: FORET_SOLEIL, couleur: 0xfff0c8, intensite: st.v.rayons });
      sol.attenuation = (o) => (o.scrollFactorX === 1 ? 1 : 0);   // fonds lointains : ambiance seule
      st.soleil = sol;
      this.foretMasque(st);
      this.foretFaisceaux(st);
      this.foretPoussieres(st);
      st.sources = LightKit.sourcesLumineuses(this, { max: 6 });
      this.foretRendu(st);
    }
    st.texte = document.createElement('pre');
    st.texte.id = 'foret-panneau';
    st.texte.style.cssText = 'position:fixed;z-index:10;box-sizing:border-box;width:58ch;margin:0;padding:.5em .8em;color:#e8e2f2;background:#0d0b1acc;'
      + 'font-family:monospace;line-height:1.15;white-space:pre;overflow:hidden;pointer-events:none';
    document.body.appendChild(st.texte);
    this.foretTouches(st);
    this.events.once('shutdown', () => {
      st.texte.remove();
      if (this.textures.exists('foret-masque')) this.textures.remove('foret-masque');
      const pl = this.game.renderer.pipelines.get('ForetRayons');
      if (pl) pl.masque = null;
    });
    this.foretPanneau(st);
  }

  // Cases pleines du décor, pour savoir où chaque rayon s'arrête
  foretSolide(data) {
    const pleines = new Set((data.groundCells || []).map(([gx, gy]) => `${gx},${gy}`));
    const branches = (data.branches || []).map((b) => ({ x0: b.from[0], x1: b.to[0], y0: b.from[1], y1: b.from[1] + (b.thickness || 56) }));
    return (x, y) => pleines.has(`${Math.floor(x / 64)},${Math.floor(y / 64)}`)
      || branches.some((b) => x >= b.x0 && x < b.x1 && y >= b.y0 && y < b.y1);
  }

  // Masque de canopée : R = trouée (0, bord 0,5, coeur 1), G = hauteur d'arrivée du rayon, B = irrégularité des bords
  foretMasque(st) {
    const pente = -FORET_SOLEIL.x / FORET_SOLEIL.y, n = Math.ceil((st.data.levelWidth - FORET_U0 + 400) / FORET_CELLULE);
    const tex = this.textures.exists('foret-masque') ? this.textures.get('foret-masque') : this.textures.createCanvas('foret-masque', n, 1);
    const ctx = tex.getContext(), im = ctx.createImageData(n, 1), d = im.data, solide = this.foretSolide(st.data);
    // Suite pseudo-aléatoire fixe : les trouées ne changent pas d'une visite à l'autre
    let graine = 73211;
    const hasard = () => { graine = (graine * 16807) % 2147483647; return graine / 2147483647; };
    for (let i = 0; i < n; i++) {
      const u = FORET_U0 + (i + 0.5) * FORET_CELLULE;
      let y = 0;
      while (y < 1016 && !solide(u + pente * y, y)) y += 4;
      d[i * 4 + 1] = Math.round(y / 1020 * 255);
      d[i * 4 + 2] = Math.floor(hasard() * 256);
      d[i * 4 + 3] = 255;
    }
    const vide = st.v.largeur * (1 - st.v.densite) / st.v.densite;
    for (let u = 40 * hasard(); u < n * FORET_CELLULE;) {
      const l = st.v.largeur * (0.35 + 1.3 * hasard()), a = Math.round(u / FORET_CELLULE), b = Math.round((u + l) / FORET_CELLULE);
      for (let i = a; i < b && i < n; i++) d[i * 4] = i - a < 2 || b - 1 - i < 2 ? 128 : 255;
      u += l + vide * (0.3 + 1.4 * hasard());
    }
    ctx.putImageData(im, 0, 0);
    tex.refresh();
    tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
    st.masque = {
      tex: tex.source[0].glTexture, pente, u0: FORET_U0, cel: FORET_CELLULE, n, amp: st.v.balancement, t: 0, bande: FORET_BANDE,
      lire: (v) => { const i = Math.min(n - 1, Math.max(0, Math.floor(v * n))) * 4; return { r: d[i] / 255, g: d[i + 1] / 255, b: d[i + 2] / 255 }; },
    };
    LightKit.reglerRendu(this, { masque: st.masque });
    const pl = this.game.renderer.pipelines.get('ForetRayons');
    if (pl) pl.masque = st.masque;
  }

  foretFaisceaux(st) {
    const pipes = this.game.renderer.pipelines;
    if (!pipes.has('ForetRayons')) pipes.add('ForetRayons', new ForetRayonsPipeline(this.game));
    const pl = pipes.get('ForetRayons');
    pl.masque = st.masque;
    st.faisceaux = this.add.image(0, 0, '__WHITE').setOrigin(0, 0).setScrollFactor(0).setDisplaySize(ZOOM_LARGEUR, ZOOM_HAUTEUR)
      .setDepth(CHARACTER_DEPTH + 3).setBlendMode(Phaser.BlendModes.ADD).setPipeline('ForetRayons');
    st.faisceaux.__foret = true;
  }

  foretPoussieres(st) {
    for (let i = 0; i < 48; i++) {
      const p = this.add.image(0, 0, '__WHITE').setDisplaySize(2, 2).setTint(0xffd98a).setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(CHARACTER_DEPTH + 4).setAlpha(0);
      p.__foret = true;
      st.poussieres.push({ p, x: Math.random() * 1000, y: Math.random() * 540, vx: 3 + Math.random() * 5, vy: 5 + Math.random() * 9, ph: Math.random() * 6.28 });
    }
  }

  // Ambiance fraîche et verte, teinte commune aux personnages et au décor
  foretRendu(st) {
    const a = st.v.ambiance, t = st.v.teinte;
    const ciel = [a * (1 - t), a * (1 + t * 0.25), a * (1 - t * 0.7)];
    LightKit.reglerRendu(this, { ciel, sol: ciel.map((c) => c * 0.94), detail: 1, epaule: 0.85, paliers: 4 });
    LightKit.regler(st.soleil, { intensite: st.v.rayons });
    st.teinteFond = Phaser.Display.Color.GetColor(...ciel.map((c) => Math.round(Math.min(1, c) * 255)));
    for (const o of st.teintes) if (o.active) o.setTint(st.teinteFond);
    this.game.renderer.pipelines.get('ForetRayons').faisceau = st.v.faisceaux;
    st.masque.amp = st.v.balancement;
  }

  // Tout ce qui apparaît dans le monde passe par le même éclairage (ennemis compris) ; interface et lueurs exclues
  foretEclairer(st) {
    st.sources.scanner();
    for (const o of this.children.list) {
      if (o.__foret) continue;
      o.__foret = true;
      if (o.__lumiereEmissif !== undefined) continue;   // sources de lumière : jamais assombries
      if (o.scrollFactorX === 0 && o.depth >= ZOOM_PROFONDEUR_UI) continue;
      if (o.blendMode === Phaser.BlendModes.ADD) continue;
      if (o.type === 'Sprite' || o.type === 'Image') LightKit.eclairer(o);
      else if (o.type === 'TileSprite') { o.setTint(st.teinteFond); st.teintes.push(o); }
    }
  }

  foretImage(delta) {
    const st = this.__foret;
    if (!st.ok) return;
    if (++st.image % 12 === 1) this.foretEclairer(st);
    st.sources.maj(delta / 1000);
    if (st.visible && st.image % 12 === 0) this.foretPanneau(st);
    if (this.player && this.player.energy < ENERGY_MAX) { this.player.energy = ENERGY_MAX; this.registry.set('energy', ENERGY_MAX); }
    const t = this.time.now / 1000, mq = st.masque, v = ZoomKit.vueVisible(this.cameras.main);
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

  foretTouches(st) {
    const k = this.input.keyboard;
    const sur = (touche, f) => k.on(`keydown-${touche}`, () => { f(); this.foretPanneau(st); });
    const changer = (sens) => {
      const r = FORET_REGLAGES[st.ligne];
      st.v[r.id] = Phaser.Math.Clamp(Math.round((st.v[r.id] + sens * r.pas) * 100) / 100, r.min, r.max);
      if (r.masque) this.foretMasque(st);
      this.foretRendu(st);
    };
    sur('U', () => { st.ligne = Phaser.Math.Wrap(st.ligne - 1, 0, FORET_REGLAGES.length); });
    sur('J', () => { st.ligne = Phaser.Math.Wrap(st.ligne + 1, 0, FORET_REGLAGES.length); });
    sur('H', () => changer(-1));
    sur('L', () => changer(1));
    sur('G', () => {
      st.eclairage = !st.eclairage;
      if (st.eclairage) this.lights.enable(); else this.lights.disable();
      st.faisceaux.setVisible(st.eclairage);
      st.sources.actif(st.eclairage);
      for (const o of st.teintes) if (o.active) { if (st.eclairage) o.setTint(st.teinteFond); else o.clearTint(); }
    });
    sur('W', () => { st.visible = !st.visible; st.texte.style.display = st.visible ? '' : 'none'; });
    sur('C', () => {
      const txt = JSON.stringify({ ...st.v, soleil: FORET_SOLEIL }, null, 2);
      console.log(`[foret_lumiere] réglages :\n${txt}`);
      st.note = 'reglages ecrits dans la console (F12)';
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(() => { st.note = 'reglages copies dans le presse-papiers'; this.foretPanneau(st); }).catch(() => {});
      }
    });
  }

  foretPanneau(st) {
    if (!st.texte) return;
    const lignes = ['FORET DE LUMIERE'];
    FORET_REGLAGES.forEach((r, i) => lignes.push(`${i === st.ligne ? '>' : ' '} ${r.id.padEnd(12)} ${st.v[r.id]}`));
    lignes.push('U/J reglage  H/L valeur  C copier  W panneau');
    lignes.push(`G eclairage ${st.eclairage ? 'oui' : 'non'}`);
    if (this.player) lignes.push(`forme : ${LaboLumiereScene.prototype.laboFormeActive.call(this)}`);
    lignes.push('  Maj + direction grizzly   A ours polaire');
    lignes.push('  Espace x2 aigle (tenir : plane, S : pique)');
    if (st.note) lignes.push(st.note);
    st.texte.textContent = lignes.join('\n');
    LaboLumiereScene.prototype.laboPlacerPanneau.call(this, st);
  }
}
