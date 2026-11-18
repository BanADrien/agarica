// LightKit — éclairage dynamique des sprites « en sections » (2026-11-17).
//
// Pourquoi : un sprite préparé par tools/sections.js (couleurs de base en aplats + carte de
// normales par zones, dans `_lumiere/` à côté de l'image) réagit à des lampes posées dans la
// scène (torche, lune...) au lieu d'avoir son ombrage peint une fois pour toutes. La lumière
// tombe par PALIERS (4 par défaut) : ça reste du pixel art. Mode d'emploi complet :
// .claude/skills/eclairage-sections/SKILL.md.
//
// OPT-IN strict : tant qu'une scène n'appelle pas LightKit.activer(), rien ne change (aucun
// pipeline enregistré, aucun objet touché). Les cartes sont seulement préchargées (BootScene).
//
//   LightKit.activer(scene, { ambiance: 'nuit', paliers: 4, contre: 1.5 });
//   LightKit.eclairer(scene.player);                      // un sprite (ou une liste)
//   const torche = LightKit.ajouterLumiere(scene, 'torche', { x: 300, y: 380 });
//   LightKit.deplacer(torche, x, y);                      // ou LightKit.suivre(torche, cible, dx, dy)
//   const lune = LightKit.ajouterLumiere(scene, 'lune', { x: 200, y: -300 });
//   LightKit.ambiance(scene, 0x55506a);
//
// Lumière = { x, y (monde), profondeur (px du monde, NÉGATIF = derrière le plan du sprite :
// contre-jour), couleur, intensite, portee (px du monde) }. Une lumière LightKit est une
// lumière Phaser (scene.lights) avec en plus `profondeur`.
//
// Shader : PORT du gabarit validé tools/lumiere/apercu.html (copie de
// viewer/lumiere-template.html du skill pixel-art-forge, v16). Fonctions palier(),
// normaleLisse() et eclairage() recopiées telles quelles ; seules différences, pour plusieurs
// lumières de profondeurs différentes : uHauteur -> z, uPortee -> portee (paramètres) et
// normaleLisse(ts) -> nLisse (calculée une fois par pixel). `npm run lumiere:tests` compare
// eclairage() d'ici à celle de la page (mot à mot après ces substitutions) et à la version CPU
// (tools/lumiere/cpu.js). Pour resynchroniser : recopier le gabarit dans apercu.html, reporter
// le corps d'eclairage() ci-dessous (FRAG_ECLAIRAGE) et dans cpu.js, relancer les tests.
//
// Repères : le calcul se fait dans la grille NATIVE du sprite (1 pixel dessiné = 1 unité), là
// où la page de test a été réglée. Chaque lampe est ramenée dans ce repère côté JS (inverse de
// la transformation de l'objet : position, échelle, rotation, conteneurs) ; profondeur et
// portée sont divisées par la taille à l'écran d'un pixel natif. flipX : comme la case
// « sens » de la page, l'image est lue en miroir ET normal.x inversé (uFlip), sinon la
// lumière éclairerait le mauvais côté. flipY n'est pas pris en charge.
// Deux cartes par sprite : les NORMALES (sections) pour la lumière de face, la carte
// CONTRE-JOUR (_cj.png : direction du bord exposé, exposition arrière) pour une lampe derrière.
// Sans carte contre-jour, l'exposition vaut 0 : une lampe derrière n'allume rien.
// Objet éclairé sans carte (frame non préparée) : même lumière de face, normale de face (à
// plat), pas de contre-jour.

// Cases d'une carte « taille écran » calées sur les pixels d'écran. Phaser arrondit les coins du sprite
// au pixel (camera.roundPixels) : la largeur affichée Q est entière mais pas exactement W x échelle,
// ce qui décalerait les cases d'une colonne çà et là. On recalcule leur pas et leur coin dans l'image
// pour que chaque case couvre exactement np pixels d'écran. bas : axe y (arrondi inverse du vertex shader).
function grilleSurEcran(debut, W, echelle, g, np, bas) {
  const rond = bas ? (v) => Math.ceil(v - 0.5) : (v) => Math.floor(v + 0.5);
  const Q = rond(debut + W * echelle) - rond(debut);
  if (Q <= 0) return null;
  const tau = W / Q;
  return { pas: np * tau, coin: Math.round(g * echelle) * tau };
}

const LightKit = (() => {
  const NOM_PIPELINE = 'LumiereSections';

  // Réglages par défaut = ceux de la page de test validée.
  const DEFAUTS = { paliers: 4, contre: 1.5, ambiance: 0x5c5c5c, profondeur: 8 };

  // Préréglages de lampes (couleurs de la page de test : Torche, Lune, Blanc).
  // Torche : près du plan (8 px devant, comme la page ; plus loin devant, le sommet des formes
  // s'assombrit quand elle est proche). Lune : loin et haut, grande portée.
  const PRESETS = {
    torche: { couleur: 0xffb35c, intensite: 1, portee: 220, profondeur: 8 },
    lune: { couleur: 0x9fb8ff, intensite: 0.8, portee: 900, profondeur: 30 },
    blanc: { couleur: 0xffffff, intensite: 1, portee: 220, profondeur: 8 },
    contrejour: { couleur: 0xffb35c, intensite: 1, portee: 220, profondeur: -20 },
  };
  const AMBIANCES = { neutre: 0x5c5c5c, nuit: 0x55506a, jour: 0xb4b4b4 };

  // ---------------------------------------------------------------- shader
  // Corps d'eclairage() : MOT À MOT celui de tools/lumiere/apercu.html (v16) après
  // substitutions uHauteur -> z, uPortee -> portee, normaleLisse(ts) -> nLisse.
  // cjm = carte contre-jour : rg = direction du bord exposé (x droite, y haut), b = exposition.
  // La lampe derrière (wb) ne passe QUE par elle : la part « derrière » de la diffuse et le
  // contre-jour sont multipliés par l'exposition ; le milieu (exposition 0) ne s'allume jamais.
  const FRAG_ECLAIRAGE = `
float eclairage(vec3 n, vec3 nLisse, vec2 t, vec2 lp, float z, float portee, float lumBase, vec4 cjm) {
  float wb = smoothstep(15.0, -15.0, z);
  vec3 ne = n;
  if (wb > 0.0) ne = normalize(mix(n, nLisse, wb));
  vec3 d = vec3(lp.x - t.x, t.y - lp.y, z);
  float dist = max(length(d), 0.001);
  float att = clamp(1.0 - (dist * dist) / (portee * portee), 0.0, 1.0);
  float w = 0.5 * wb;
  float ex = cjm.b;
  float diff = max((dot(ne, d / dist) + w) / (1.0 + w), 0.0) * att * mix(1.0, ex, wb);
  if (lumBase < 0.16) return min(diff, uPaliers < 1.5 ? 0.34 : 1.0 / (uPaliers - 1.0));
  vec2 dir = cjm.rg * 2.0 - 1.0;
  if (uFlip > 0.5) dir.x = -dir.x;
  float cb = (0.37 * dot(dir, d.xy) + 0.93 * abs(z)) / dist;
  float cj = 0.6 * uContre * wb * ex * max(cb, 0.0) * att;
  return min(diff + cj, 1.0);
}`;

  const FRAG = `
#define SHADER_NAME LUMIERE_SECTIONS_FS
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
struct Lumiere {
  vec3 position;   // x, y : repere natif affiche du sprite (y vers le bas) ; z : profondeur native
  vec3 couleur;    // couleur x intensite
  float portee;    // portee native
};
const int kMaxLights = %LIGHT_COUNT%;
uniform sampler2D uMainSampler;   // image du jeu (objet sans carte)
uniform sampler2D uNeutre;        // _lumiere/<n>_neutre.png
uniform sampler2D uNormales;      // _lumiere/<n>_n.png
uniform sampler2D uCj;            // _lumiere/<n>_cj.png (carte contre-jour)
uniform vec3 uAmbiance;
uniform Lumiere uLumieres[kMaxLights];
uniform int uNbLumieres;
uniform float uPaliers, uContre;
uniform float uCarte;             // 1 = sprite avec cartes, 0 = a plat
uniform float uDerriere;          // 1 = au moins une lampe derriere (normale lissee utile)
uniform float uFlip;              // 1 = flipX : miroir ET normal.x inverse
uniform float uPasLisse;          // ecart des echantillons de la normale lissee (round(s), 1 = demo)
uniform vec2 uTaille;             // taille native (sans carte : taille de la frame en px du monde)
uniform vec2 uTailleTex;          // taille de l'image source
uniform vec2 uCoin;               // coin de la frame dans l'image source
uniform vec2 uGrille, uPas;       // grille dans la frame : coin et taille d'une case
varying vec2 outTexCoord;
varying float outTexId;
varying float outTintEffect;
varying vec4 outTint;

float palier(float v) {
  if (uPaliers < 1.5) return v;
  return min(floor(v * uPaliers), uPaliers - 1.0) / (uPaliers - 1.0);
}

vec3 normaleLisse(vec2 ts) {
  vec3 acc = vec3(0.0);
  for (int dy = -2; dy <= 2; dy++) {
    for (int dx = -2; dx <= 2; dx++) {
      vec2 q = ts + vec2(float(dx), float(dy)) * uPasLisse;
      if (q.x < 0.0 || q.y < 0.0 || q.x >= uTaille.x || q.y >= uTaille.y) continue;
      vec4 nn = texture2D(uNormales, (q + 0.5) / uTaille);
      if (nn.a < 0.5) continue;
      acc += nn.rgb * 2.0 - 1.0;
    }
  }
  if (uFlip > 0.5) acc.x = -acc.x;
  return length(acc) > 0.001 ? normalize(acc) : vec3(0.0, 0.0, 1.0);
}
${FRAG_ECLAIRAGE}

void main() {
  vec4 texel = vec4(outTint.bgr * outTint.a, outTint.a);
  vec2 px = outTexCoord * uTailleTex - uCoin;          // pixel de la frame (image du jeu)
  vec4 base;
  vec3 n = vec3(0.0, 0.0, 1.0);
  vec3 nl = n;
  vec4 cjm = vec4(0.5, 0.5, 0.0, 1.0);                // sans carte : aucune exposition arriere
  vec2 ts;
  if (uCarte > 0.5) {
    ts = floor((px - uGrille) / uPas);
    if (ts.x < 0.0 || ts.y < 0.0 || ts.x >= uTaille.x || ts.y >= uTaille.y) discard;
    vec2 uv = (ts + 0.5) / uTaille;
    base = texture2D(uNeutre, uv);
    if (base.a < 0.5) discard;
    base = vec4(base.rgb, 1.0);
    n = texture2D(uNormales, uv).rgb * 2.0 - 1.0;
    if (uFlip > 0.5) n.x = -n.x;
    n = normalize(n);
    if (uDerriere > 0.5) nl = normaleLisse(ts);
    cjm = texture2D(uCj, uv);
  } else {
    base = texture2D(uMainSampler, outTexCoord);      // alpha premultiplie (Phaser)
    if (base.a <= 0.0) discard;
    ts = floor((px - uGrille) / uPas);
  }
  vec2 t = ts;
  if (uFlip > 0.5) t.x = uTaille.x - 1.0 - ts.x;
  vec2 tc = t + 0.5;
  float lb = dot(base.rgb, vec3(0.3, 0.59, 0.11));
  vec3 l = uAmbiance;
  for (int i = 0; i < kMaxLights; ++i) {
    if (i < uNbLumieres) {
      Lumiere L = uLumieres[i];
      l += L.couleur * palier(eclairage(n, uCarte > 0.5 ? nl : n, tc, L.position.xy, L.position.z, L.portee, lb, cjm));
    }
  }
  vec4 color = vec4(base.rgb * l, base.a) * texel;
  if (outTintEffect == 1.0) color.rgb = outTint.bgr * outTint.a * base.a;   // setTintFill
  else if (outTintEffect == 2.0) color = texel;
  gl_FragColor = color;
}`;

  // ---------------------------------------------------------------- cartes (BootScene)
  // clé de texture du jeu -> adresse de l'image (clé de SECTIONS_LUMIERE)
  const cleVersUrl = {};
  const manifeste = () => (typeof SECTIONS_LUMIERE !== 'undefined' ? SECTIONS_LUMIERE : {});
  const cleCarte = (url, quoi) => `lumiere:${quoi}:${url}`;

  // Aucune scène du jeu normal n'éclaire encore : les cartes ne sont chargées qu'avec `?lumiere`
  // ou dans le labo (`?zone=labo_lumiere`). Le jour où une vraie zone s'en sert : TOUJOURS = true.
  const TOUJOURS = false;
  function cartesVoulues() {
    if (TOUJOURS) return true;
    if (typeof window === 'undefined') return false;
    const q = new URLSearchParams(window.location.search);
    return q.has('lumiere') || q.get('zone') === 'labo_lumiere' || q.get('zone') === 'LaboLumiereScene';
  }

  // preload de BootScene : charge neutre, normales et carte contre-jour de chaque sprite du
  // manifeste (la carte contre-jour seulement si le manifeste l'annonce : `cj`) et note
  // quelle clé de texture correspond à quelle image (le manifeste parle en fichiers).
  function chargerCartes(scene) {
    if (!cartesVoulues()) return;
    const man = manifeste();
    for (const [url, e] of Object.entries(man)) {
      scene.load.image(cleCarte(url, 'neutre'), `${e.d}/${e.n}_neutre.png`);
      scene.load.image(cleCarte(url, 'n'), `${e.d}/${e.n}_n.png`);
      if (e.cj) scene.load.image(cleCarte(url, 'cj'), `${e.d}/${e.n}_cj.png`);
    }
    scene.load.on(Phaser.Loader.Events.FILE_LOAD, (file) => {
      if (!file || file.type !== 'image' || typeof file.url !== 'string') return;
      const url = file.url.split('?')[0];
      if (man[url] && !String(file.key).startsWith('lumiere:')) cleVersUrl[file.key] = url;
    });
  }

  // create de BootScene : pixels nets sur les cartes
  function filtrerCartes(scene) {
    for (const url of Object.keys(manifeste())) {
      for (const q of ['neutre', 'n', 'cj']) {
        const k = cleCarte(url, q);
        if (scene.textures.exists(k)) scene.textures.get(k).setFilter(Phaser.Textures.FilterMode.NEAREST);
      }
    }
  }

  const cacheCartes = Object.create(null);
  function cartesDe(game, cleTexture) {
    if (cleTexture in cacheCartes) return cacheCartes[cleTexture];
    const url = cleVersUrl[cleTexture];
    const e = url && manifeste()[url];
    let r = null;
    if (e && game.textures.exists(cleCarte(url, 'neutre')) && game.textures.exists(cleCarte(url, 'n'))) {
      // carte contre-jour absente (ancien manifeste, fichier manquant) : texture vide de Phaser
      // (__DEFAULT, transparente) -> exposition 0, la lampe derrière n'allume rien
      const cj = game.textures.exists(cleCarte(url, 'cj')) ? cleCarte(url, 'cj') : '__DEFAULT';
      r = { e, neutre: game.textures.get(cleCarte(url, 'neutre')).source[0].glTexture,
        n: game.textures.get(cleCarte(url, 'n')).source[0].glTexture,
        cj: game.textures.get(cj).source[0].glTexture };
    }
    // pas de cache tant que les cartes ne sont pas prêtes (chargement en cours)
    if (r || !e) cacheCartes[cleTexture] = r;
    return r;
  }

  // ---------------------------------------------------------------- pipeline (créé à la demande)
  let PipelineClasse = null;
  function classePipeline() {
    if (PipelineClasse) return PipelineClasse;
    const LP = Phaser.Renderer.WebGL.Pipelines.LightPipeline;
    const TM = Phaser.GameObjects.Components.TransformMatrix;
    PipelineClasse = class LumiereSectionsPipeline extends LP {
      constructor(game) {
        super({ game, fragShader: FRAG });
        this._m1 = new TM();
        this._m2 = new TM();
        this._pt = new Phaser.Math.Vector2();
        this._lampes = [];
        this._textures = null;
        this._reglages = DEFAUTS;
        this._ambiance = { r: 1, g: 1, b: 1 };
      }

      onRender(scene, camera) {
        const lm = scene.sys.lights;
        const actif = !!(lm && lm.active);
        // jamais d'objet invisible : sans lumières actives, plein jour (ambiance 1, aucune lampe)
        this.lightsActive = true;
        this._lampes = actif ? lm.getLights(camera).map((o) => o.light) : [];
        this._reglages = (scene.__lumiere && scene.__lumiere.reglages) || DEFAUTS;
        this._ambiance = actif ? lm.ambientColor : { r: 1, g: 1, b: 1 };
      }

      // un appel de dessin par objet éclairé : ses lampes sont exprimées dans SON repère natif
      batchSprite(go, camera, parent) {
        this._camera = camera;
        // d'abord se lier (vide le pipeline précédent) : les uniforms ci-dessous changent le
        // programme GL, il ne faut pas que le lot en attente d'un autre pipeline le subisse
        this.manager.set(this, go);
        if (this.vertexCount > 0) this.flush();
        this.preparer(go);
        super.batchSprite(go, camera, parent);
      }

      preparer(go) {
        this.set1i('uMainSampler', 0);
        this.set1i('uNeutre', 2);
        this.set1i('uNormales', 3);
        this.set1i('uCj', 4);
        this.set3f('uAmbiance', this._ambiance.r, this._ambiance.g, this._ambiance.b);
        this.set1f('uPaliers', this._reglages.paliers);
        this.set1f('uContre', this._reglages.contre);
        const frame = go.frame;
        const c = cartesDe(this.game, frame.texture.key);
        const e = c && c.e;
        const W = frame.realWidth, H = frame.realHeight;
        const m = go.getWorldTransformMatrix(this._m1, this._m2);
        const sx = Math.hypot(m.a, m.b) || 1, sy = Math.hypot(m.c, m.d) || 1;
        // frame sans carte : une case = 1 px du monde. En px de l'image, une même lampe passait de
        // « devant » à « derrière » (seuils en px de la grille) au changement de frame
        const fx = e ? e.fx : 1 / sx, fy = e ? e.fy : 1 / sy, gx = e ? e.gx : 0, gy = e ? e.gy : 0;
        const w = e ? e.w : W * sx, h = e ? e.h : H * sy;
        let cx = gx, cy = gy, px = fx, py = fy;
        const cam = this._camera, flipC = !!go.flipX;
        // carte à la taille écran, affichée à son échelle, sans rotation, zoom entier : cases sur les pixels
        if (e && e.np && cam && cam.roundPixels && Number.isInteger(cam.zoom) && !go.rotation && !go.parentContainer
          && Math.abs(sx - e.ech) < 0.002 && Math.abs(sy - e.ech) < 0.002) {
          const z = cam.zoom, ox = cam.width * cam.originX, oy = cam.height * cam.originY;
          const gauche = cam.x + ox + z * (go.x - (flipC ? W - go.displayOriginX : go.displayOriginX) * sx - cam.scrollX * go.scrollFactorX - ox);
          const haut = cam.y + oy + z * (go.y - go.displayOriginY * sy - cam.scrollY * go.scrollFactorY - oy);
          const ax = grilleSurEcran(gauche, W, sx * z, gx, e.np * z, false), ay = grilleSurEcran(haut, H, sy * z, gy, e.np * z, true);
          if (ax && ay) { px = ax.pas; cx = ax.coin; py = ay.pas; cy = ay.coin; }
        }
        const flip = !!go.flipX;
        const kx = sx * fx, ky = sy * fy;                  // px du monde par pixel natif
        const k = (kx + ky) / 2;
        const lampes = this._lampes, maxi = this.renderer.config.maxLights;
        // Seules les lampes qui peuvent atteindre l'objet (au-delà de la portée, leur lumière vaut 0) :
        // même image, beaucoup moins de calcul quand de nombreux objets sont éclairés
        const rayonObjet = Math.hypot(W * sx, H * sy);
        let derriere = 0, nb = 0;
        for (let j = 0; j < lampes.length && nb < maxi; j++) {
          const L = lampes[j], atteinte = L.radius + rayonObjet;
          if (Math.abs(L.x - go.x) > atteinte || Math.abs(L.y - go.y) > atteinte) continue;
          const i = nb++;
          m.applyInverse(L.x, L.y, this._pt);
          const D = this._pt.x + go.displayOriginX, Dy = this._pt.y + go.displayOriginY;
          const tx = flip ? w - (W - D - cx) / px : (D - cx) / px;
          const ty = (Dy - cy) / py;
          const z = (L.profondeur ?? DEFAUTS.profondeur) / k;
          if (z < 15) derriere = 1;
          const nom = `uLumieres[${i}].`;
          this.set3f(nom + 'position', tx, ty, z);
          // L.attenuation(objet), facultatif : lampe masquée pour cet objet (ombre d'un auvent), 0 à 1
          const force = L.intensity * (L.attenuation ? L.attenuation(go) : 1);
          this.set3f(nom + 'couleur', L.color.r * force, L.color.g * force, L.color.b * force);
          this.set1f(nom + 'portee', L.radius / k);
        }
        this.set1i('uNbLumieres', nb);
        this.set1f('uCarte', e ? 1 : 0);
        this.set1f('uDerriere', derriere);
        this.set1f('uFlip', flip ? 1 : 0);
        this.set1f('uPasLisse', e && e.s > 1 ? Math.round(e.s) : 1);
        this.set2f('uTaille', w, h);
        this.set2f('uTailleTex', frame.source.width, frame.source.height);
        this.set2f('uCoin', frame.cutX, frame.cutY);
        this.set2f('uGrille', cx, cy);
        this.set2f('uPas', px, py);
        this._textures = c;
      }

      // juste avant le dessin : cartes natives sur les unités 2, 3 et 4 (Phaser n'utilise que 0
      // et 1 dans ce pipeline ; les autres pipelines revalident leurs unités en se liant)
      onBeforeFlush() {
        const c = this._textures;
        if (!c) return;
        const gl = this.gl;
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, c.neutre.webGLTexture);
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, c.n.webGLTexture);
        gl.activeTexture(gl.TEXTURE4);
        gl.bindTexture(gl.TEXTURE_2D, c.cj.webGLTexture);
        gl.activeTexture(gl.TEXTURE0);
      }
    };
    return PipelineClasse;
  }

  function webgl(scene) {
    const r = scene.game.renderer;
    return r && r.type === Phaser.WEBGL && r.pipelines ? r : null;
  }

  function couleurDe(v) {
    if (typeof v === 'string') return AMBIANCES[v] ?? parseInt(v.replace('#', ''), 16);
    return v;
  }

  // ---------------------------------------------------------------- API
  // Active l'éclairage d'une scène (à appeler dans create). false sans WebGL (rien ne change).
  function activer(scene, options = {}) {
    const r = webgl(scene);
    if (!r) return false;
    if (!r.pipelines.has(NOM_PIPELINE)) r.pipelines.add(NOM_PIPELINE, new (classePipeline())(scene.game));
    const reglages = Object.assign({}, DEFAUTS, options);
    scene.__lumiere = { reglages, objets: new Set(), suivis: [] };
    scene.lights.enable();
    ambiance(scene, reglages.ambiance);
    const maj = () => {
      for (const s of scene.__lumiere ? scene.__lumiere.suivis : []) {
        if (!s.cible || !s.cible.active) continue;
        s.lumiere.setPosition(s.cible.x + s.dx, s.cible.y + s.dy);
      }
    };
    scene.events.on('postupdate', maj);
    scene.__lumiere.maj = maj;
    scene.events.once('shutdown', () => desactiver(scene));
    return true;
  }

  // Remet la scène comme avant : objets sur leur pipeline d'origine, lumières retirées.
  function desactiver(scene) {
    const st = scene.__lumiere;
    if (!st) return;
    for (const o of st.objets) if (o.scene && o.pipeline && o.pipeline.name === NOM_PIPELINE) o.pipeline = o.__lumierePipe0 || o.defaultPipeline;
    scene.events.off('postupdate', st.maj);
    if (scene.lights) {
      for (const L of scene.lights.lights.slice()) scene.lights.removeLight(L);
      scene.lights.disable();
    }
    scene.__lumiere = null;
  }

  // Fait éclairer un ou plusieurs objets (Sprite, Image) par les lampes de leur scène.
  function eclairer(objets) {
    for (const o of [].concat(objets || [])) {
      const st = o && o.scene && o.scene.__lumiere;
      if (!st || !o.setPipeline) continue;
      if (!o.pipeline || o.pipeline.name !== NOM_PIPELINE) o.__lumierePipe0 = o.pipeline;
      o.setPipeline(NOM_PIPELINE);
      st.objets.add(o);
    }
    return objets;
  }

  function nePlusEclairer(objets) {
    for (const o of [].concat(objets || [])) {
      if (!o || !o.pipeline || o.pipeline.name !== NOM_PIPELINE) continue;
      o.pipeline = o.__lumierePipe0 || o.defaultPipeline;
      if (o.scene && o.scene.__lumiere) o.scene.__lumiere.objets.delete(o);
    }
  }

  // Clé de texture du jeu d'une image du manifeste (null si elle n'est pas chargée)
  function cleDe(url) {
    for (const k of Object.keys(cleVersUrl)) if (cleVersUrl[k] === url) return k;
    return null;
  }

  // Pixels d'écran couverts par un pixel dessiné, à l'échelle actuelle (null sans carte)
  function pixelEcran(o) {
    const c = o && o.frame ? cartesDe(o.scene.game, o.frame.texture.key) : null;
    return c ? Math.abs(o.scaleX) * c.e.fx * (o.scene.cameras.main.zoom || 1) : null;
  }

  // A une carte (sprite préparé par tools/sections.js) ? Utile pour n'éclairer que ceux-là.
  function aDesCartes(o) {
    return !!(o && o.frame && cartesDe(o.scene.game, o.frame.texture.key));
  }

  // Ajoute une lampe : ajouterLumiere(scene, 'torche', { x, y }) ou ajouterLumiere(scene, { ... }).
  function ajouterLumiere(scene, preset, options) {
    if (typeof preset !== 'string') { options = preset; preset = null; }
    const o = Object.assign({ x: 0, y: 0 }, PRESETS.blanc, preset ? PRESETS[preset] : {}, options || {});
    const L = scene.lights.addLight(o.x, o.y, o.portee, couleurDe(o.couleur), o.intensite);
    L.profondeur = o.profondeur;
    return L;
  }

  function deplacer(lumiere, x, y, profondeur) {
    lumiere.setPosition(x, y);
    if (profondeur !== undefined) lumiere.profondeur = profondeur;
    return lumiere;
  }

  function regler(lumiere, { couleur, intensite, portee, profondeur } = {}) {
    if (couleur !== undefined) lumiere.setColor(couleurDe(couleur));
    if (intensite !== undefined) lumiere.setIntensity(intensite);
    if (portee !== undefined) lumiere.setRadius(portee);
    if (profondeur !== undefined) lumiere.profondeur = profondeur;
    return lumiere;
  }

  // Portée conseillée pour éclairer tout un objet (grand ennemi, boss) : k fois sa diagonale
  // affichée, en px du monde (3 par défaut, comme la page de test). Ex. :
  //   LightKit.regler(torche, { portee: LightKit.porteeConseillee(boss) });
  function porteeConseillee(objet, k = 3) {
    return Math.round(k * Math.hypot(objet.displayWidth || 0, objet.displayHeight || 0)) || PRESETS.torche.portee;
  }

  // La lampe suit un objet (décalage dx, dy) après chaque mise à jour de la scène.
  function suivre(lumiere, cible, dx = 0, dy = 0) {
    const st = cible && cible.scene && cible.scene.__lumiere;
    if (st) st.suivis.push({ lumiere, cible, dx, dy });
    return lumiere;
  }

  function retirerLumiere(scene, lumiere) {
    if (scene.__lumiere) scene.__lumiere.suivis = scene.__lumiere.suivis.filter((s) => s.lumiere !== lumiere);
    scene.lights.removeLight(lumiere);
  }

  // Couleur ambiante des objets éclairés (nombre 0xRRGGBB ou 'neutre' / 'nuit' / 'jour').
  function ambiance(scene, couleur) {
    scene.lights.setAmbientColor(couleurDe(couleur));
  }

  // Réglages de rendu : { paliers: 2-5 ou 0 (lisse), contre: force du contre-jour }.
  function reglerRendu(scene, reglages) {
    if (scene.__lumiere) Object.assign(scene.__lumiere.reglages, reglages);
  }

  // ---------------------------------------------------------------- mode test (?lumiere)
  // `index.html?zone=foret_sombre_1&lumiere` : nuit, Agarica et tout sprite préparé éclairés,
  // torche au pointeur (molette : profondeur, négatif = derrière), lune en haut à gauche.
  // `?lumiere=-20` : profondeur de départ de la torche. Appelé par buildLevelFromData.
  function modeTest(scene) {
    if (typeof window === 'undefined') return;
    const q = new URLSearchParams(window.location.search);
    if (scene.__laboLumiere || !q.has('lumiere') || !activer(scene, { ambiance: 'nuit' })) return;
    const z0 = Number(q.get('lumiere'));
    const torche = ajouterLumiere(scene, 'torche', { profondeur: Number.isFinite(z0) && q.get('lumiere') !== '' ? z0 : 8 });
    const lune = ajouterLumiere(scene, 'lune');
    const texte = scene.add.text(8, 520, '', { fontFamily: 'monospace', fontSize: '12px', color: '#d9d4e3' })
      .setScrollFactor(0).setDepth(100000);
    const afficher = () => texte.setText(`lumiere : profondeur ${torche.profondeur > 0 ? '+' : ''}${torche.profondeur} (molette)`);
    afficher();
    scene.input.on('wheel', (p, objs, dx, dy) => {
      torche.profondeur = Phaser.Math.Clamp(torche.profondeur + (dy > 0 ? -2 : 2), -60, 60);
      afficher();
    });
    let n = 0;
    const balayer = () => {
      const cam = scene.cameras.main;
      // recalculé à chaque image : p.worldX n'est à jour que quand la souris bouge, pas quand la caméra défile
      const pt = scene.input.activePointer.positionToCamera(cam);
      deplacer(torche, pt.x, pt.y);
      deplacer(lune, cam.worldView.x + 120, cam.worldView.y - 250);
      if (n++ % 30) return;
      for (const o of scene.children.list) if (o.type === 'Sprite' && (o === scene.player || aDesCartes(o))) eclairer(o);
    };
    balayer();
    scene.events.on('postupdate', balayer);
    scene.events.once('shutdown', () => scene.events.off('postupdate', balayer));
  }

  return {
    NOM_PIPELINE, DEFAUTS, PRESETS, AMBIANCES, FRAG, FRAG_ECLAIRAGE,
    chargerCartes, filtrerCartes, activer, desactiver, eclairer, nePlusEclairer, aDesCartes, cleDe, pixelEcran,
    ajouterLumiere, deplacer, regler, suivre, retirerLumiere, ambiance, reglerRendu, modeTest, porteeConseillee,
  };
})();

// Node (npm run lumiere:tests) lit le shader pour le comparer au gabarit et à la version CPU.
if (typeof module !== 'undefined' && module.exports) { module.exports = LightKit; LightKit.grilleSurEcran = grilleSurEcran; }
