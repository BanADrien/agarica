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
  vec3 position;   // x, y : repère natif affiché du sprite (y vers le bas) ; z : profondeur native
  vec3 couleur;    // couleur x intensité
  float portee;    // portée native
  vec3 masque;     // x0, x1 (x du MONDE), actif : la lampe ne compte que d'un côté (soleil dehors)
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
uniform float uCarte;             // 1 = sprite avec cartes, 0 = à plat
uniform float uDerriere;          // 1 = au moins une lampe derrière (normale lissée utile)
uniform float uFlip;              // 1 = flipX : miroir ET normal.x inversé
uniform float uPasLisse;          // écart des échantillons de la normale lissée (round(s), 1 = démo)
uniform vec2 uTaille;             // taille native (ou de la frame sans carte)
uniform vec2 uTailleTex;          // taille de l'image source
uniform vec2 uCoin;               // coin de la frame dans l'image source
uniform vec2 uGrille, uPas;       // grille native dans la frame : coin et taille d'un pixel natif
uniform vec3 uMondeX;             // x du monde d'un pixel natif = dot(vec3(t + 0.5, 1), uMondeX)
uniform vec3 uAmbiance2;          // ambiance au bout du dégradé (uAmbZone)
uniform vec3 uAmbZone;            // x0, x1 (monde), actif : ambiance uAmbiance -> uAmbiance2 en x
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

// Poids d'une lampe masquée selon le x du monde : 0 avant x0, 1 après x1 (ou l'inverse si x0 > x1),
// passage doux entre les deux. Sans masque : 1 (comme avant).
float masqueX(vec3 m, float wx) {
  if (m.z < 0.5) return 1.0;
  if (m.x < m.y) return smoothstep(m.x, m.y, wx);
  return 1.0 - smoothstep(m.y, m.x, wx);
}

void main() {
  vec4 texel = vec4(outTint.bgr * outTint.a, outTint.a);
  vec2 px = outTexCoord * uTailleTex - uCoin;          // pixel de la frame (image du jeu)
  vec4 base;
  vec3 n = vec3(0.0, 0.0, 1.0);
  vec3 nl = n;
  vec4 cjm = vec4(0.5, 0.5, 0.0, 1.0);                // sans carte : aucune exposition arrière
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
    base = texture2D(uMainSampler, outTexCoord);      // alpha prémultiplié (Phaser)
    if (base.a <= 0.0) discard;
    ts = floor(px);
  }
  vec2 t = ts;
  if (uFlip > 0.5) t.x = uTaille.x - 1.0 - ts.x;
  vec2 tc = t + 0.5;
  float lb = dot(base.rgb, vec3(0.3, 0.59, 0.11));
  // x du monde de ce pixel natif (constant sur tout le pixel : le dégradé reste en pixels)
  float wx = dot(vec3(tc, 1.0), uMondeX);
  vec3 l = uAmbiance;
  if (uAmbZone.z > 0.5) l = mix(uAmbiance, uAmbiance2, smoothstep(uAmbZone.x, uAmbZone.y, wx));
  for (int i = 0; i < kMaxLights; ++i) {
    if (i < uNbLumieres) {
      Lumiere L = uLumieres[i];
      l += L.couleur * masqueX(L.masque, wx) * palier(eclairage(n, uCarte > 0.5 ? nl : n, tc, L.position.xy, L.position.z, L.portee, lb, cjm));
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

  // preload de BootScene : charge neutre, normales et carte contre-jour de chaque sprite du
  // manifeste (la carte contre-jour seulement si le manifeste l'annonce : `cj`) et note
  // quelle clé de texture correspond à quelle image (le manifeste parle en fichiers).
  function chargerCartes(scene) {
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

  const cacheCartes = {};
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
      }

      onRender(scene, camera) {
        const lm = scene.sys.lights;
        const actif = !!(lm && lm.active);
        // jamais d'objet invisible : sans lumières actives, plein jour (ambiance 1, aucune lampe)
        this.lightsActive = true;
        this._lampes = actif ? lm.getLights(camera).map((o) => o.light) : [];
        const reg = (scene.__lumiere && scene.__lumiere.reglages) || DEFAUTS;
        this.set1i('uMainSampler', 0);
        this.set1i('uNeutre', 2);
        this.set1i('uNormales', 3);
        this.set1i('uCj', 4);
        if (actif) this.set3f('uAmbiance', lm.ambientColor.r, lm.ambientColor.g, lm.ambientColor.b);
        else this.set3f('uAmbiance', 1, 1, 1);
        // Dégradé d'ambiance en x du monde (LightKit.ambianceZone) : sans lui, inactif (comme avant).
        const z = actif && scene.__lumiere && scene.__lumiere.zone;
        if (z) {
          this.set3f('uAmbiance2', z.r, z.g, z.b);
          this.set3f('uAmbZone', z.x0, z.x1, 1);
        } else this.set3f('uAmbZone', 0, 1, 0);
        this.set1f('uPaliers', reg.paliers);
        this.set1f('uContre', reg.contre);
        this._reg = reg;
      }

      // un appel de dessin par objet éclairé : ses lampes sont exprimées dans SON repère natif
      batchSprite(go, camera, parent) {
        // Hors de la vue : rien à dessiner. Phaser dessinerait quand même chaque image (sans
        // coût notable dans un lot) ; ici chaque objet coûte un appel de dessin, et une zone
        // entièrement éclairée (sol, décors) en compte des centaines hors de l'écran.
        if (!this.borner(go, camera)) return;
        // d'abord se lier (vide le pipeline précédent) : les uniforms ci-dessous changent le
        // programme GL, il ne faut pas que le lot en attente d'un autre pipeline le subisse
        this.manager.set(this, go);
        if (this.vertexCount > 0) this.flush();
        this.preparer(go, camera);
        super.batchSprite(go, camera, parent);
      }

      // Rectangle de l'objet dans le monde, décalé de la parallaxe (un fond à scrollFactor 0,3
      // se voit ailleurs que sa position) ; false s'il ne touche pas la vue de la caméra.
      borner(go, camera) {
        const r = go.getBounds(this._rect || (this._rect = new Phaser.Geom.Rectangle()));
        this._dx = camera ? camera.scrollX * (1 - go.scrollFactorX) : 0;
        this._dy = camera ? camera.scrollY * (1 - go.scrollFactorY) : 0;
        r.x += this._dx;
        r.y += this._dy;
        if (!camera) return true;
        const v = camera.worldView;
        return r.right >= v.x - 2 && r.x <= v.right + 2 && r.bottom >= v.y - 2 && r.y <= v.bottom + 2;
      }

      preparer(go) {
        const frame = go.frame;
        const c = cartesDe(this.game, frame.texture.key);
        const e = c && c.e;
        const W = frame.realWidth, H = frame.realHeight;
        const fx = e ? e.fx : 1, fy = e ? e.fy : 1, gx = e ? e.gx : 0, gy = e ? e.gy : 0;
        const w = e ? e.w : W, h = e ? e.h : H;
        const m = go.getWorldTransformMatrix(this._m1, this._m2);
        const sx = Math.hypot(m.a, m.b) || 1, sy = Math.hypot(m.c, m.d) || 1;
        const flip = !!go.flipX;
        const kx = sx * fx, ky = sy * fy;                  // px du monde par pixel natif
        const k = (kx + ky) / 2;
        const dx = this._dx || 0, dy = this._dy || 0, r = this._rect;
        // Cartes : faites sur l'image ENTIÈRE (un fichier = une carte). Un cadre découpé dans
        // l'image (le corps ou la langue du crapaud, cadres `corps` / `langue`) garde donc les
        // pixels de l'image source : son coin (cx, cy) est ajouté partout. Image entière : 0.
        const cx = e ? frame.cutX : 0, cy = e ? frame.cutY : 0;
        // x du monde d'un pixel natif (tc = t + 0.5, repère affiché, miroir compris) :
        // D = dx0 + tc.x * fx dans la boîte non retournée, puis la matrice de l'objet.
        const dx0 = flip ? cx + W - gx - w * fx : gx - cx;
        this.set3f('uMondeX', m.a * fx, m.c * fy,
          m.a * (dx0 - go.displayOriginX) + m.c * (gy - cy - go.displayOriginY) + m.tx + dx);
        const lampes = this._lampes, max = Math.min(lampes.length, this.renderer.config.maxLights);
        let derriere = 0, nb = 0;
        for (let j = 0; j < max; j++) {
          const L = lampes[j];
          // lampe trop loin pour toucher l'objet (distance au rectangle > portée) : ignorée
          if (r && L.radius < Math.hypot(Math.max(r.x - L.x, 0, L.x - r.right), Math.max(r.y - L.y, 0, L.y - r.bottom))) continue;
          // repère de l'objet : la lampe décalée de la parallaxe (même décalage que l'objet)
          m.applyInverse(L.x - dx, L.y - dy, this._pt);
          const D = this._pt.x + go.displayOriginX, Dy = this._pt.y + go.displayOriginY;
          const tx = flip ? w - (cx + W - D - gx) / fx : (cx + D - gx) / fx;
          const ty = (cy + Dy - gy) / fy;
          // `__lumierePlan` : l'objet est À CETTE DISTANCE derrière le plan des sprites (paroi
          // du fond, sol) ; la lampe est d'autant plus devant lui. Sans ça, une lampe à 8-14 px
          // devant (le bon réglage pour un sprite) ne ferait sur un mur plat qu'une tache
          // minuscule (N.L = z / distance).
          const z = ((L.profondeur ?? DEFAUTS.profondeur) + (go.__lumierePlan || 0)) / k;
          if (z < 15) derriere = 1;
          const nom = `uLumieres[${nb}].`;
          this.set3f(nom + 'position', tx, ty, z);
          this.set3f(nom + 'couleur', L.color.r * L.intensity, L.color.g * L.intensity, L.color.b * L.intensity);
          this.set1f(nom + 'portee', L.radius / k);
          const mq = L.masque;
          this.set3f(nom + 'masque', mq ? mq[0] : 0, mq ? mq[1] : 1, mq ? 1 : 0);
          nb++;
        }
        this.set1i('uNbLumieres', nb);
        // Objet à plat (sol, paroi, décor) : `paliersPlat` s'il est réglé. Sur une grande
        // surface plate, 4 paliers dessinent des disques à bord dur autour de chaque lampe ;
        // quelques paliers de plus adoucissent la flaque sans quitter le pixel art.
        const reg = this._reg || DEFAUTS;
        this.set1f('uPaliers', e ? reg.paliers : (reg.paliersPlat ?? reg.paliers));
        this.set1f('uCarte', e ? 1 : 0);
        this.set1f('uDerriere', derriere);
        this.set1f('uFlip', flip ? 1 : 0);
        this.set1f('uPasLisse', e && e.s > 1 ? Math.round(e.s) : 1);
        this.set2f('uTaille', w, h);
        this.set2f('uTailleTex', frame.source.width, frame.source.height);
        // carte : pixel de l'image source entière (cf. cx, cy) ; à plat : pixel du cadre
        this.set2f('uCoin', e ? 0 : frame.cutX, e ? 0 : frame.cutY);
        this.set2f('uGrille', gx, gy);
        this.set2f('uPas', fx, fy);
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
    if (o.masque) regler(L, { masque: o.masque });
    return L;
  }

  function deplacer(lumiere, x, y, profondeur) {
    lumiere.setPosition(x, y);
    if (profondeur !== undefined) lumiere.profondeur = profondeur;
    return lumiere;
  }

  // `masque: [x0, x1]` (x du monde) : la lampe n'éclaire que d'un côté, avec un passage doux
  // entre x0 et x1 (0 avant x0, pleine après x1 ; x0 > x1 : l'inverse). Ex. le soleil, qui
  // n'entre pas dans une grotte. `masque: null` : partout (défaut).
  function regler(lumiere, { couleur, intensite, portee, profondeur, masque } = {}) {
    if (couleur !== undefined) lumiere.setColor(couleurDe(couleur));
    if (intensite !== undefined) lumiere.setIntensity(intensite);
    if (portee !== undefined) lumiere.setRadius(portee);
    if (profondeur !== undefined) lumiere.profondeur = profondeur;
    if (masque !== undefined) {
      // x0 = x1 : passage d'un pixel (smoothstep n'est pas défini sur un intervalle nul)
      lumiere.masque = masque ? [masque[0], masque[1] === masque[0] ? masque[0] + 1 : masque[1]] : null;
    }
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

  // ---------------------------------------------------------------- ambiance par endroit
  // Dégradé d'ambiance en x du MONDE, calculé par pixel dans le shader : l'ambiance de la scène
  // (LightKit.ambiance) jusqu'à x0, `couleur` après x1, un passage doux entre les deux. Une grotte
  // qui s'ouvre au jour : chaque objet prend l'ambiance de l'endroit où il est (le fond de la
  // grotte reste noir quand Agarica est dehors), et Agarica passe de l'une à l'autre en marchant,
  // sans saut. `null` : plus de dégradé.
  //   LightKit.ambianceZone(scene, { x0: 1600, x1: 2200, couleur: 0x8c8c96 });
  function ambianceZone(scene, z) {
    const st = scene.__lumiere;
    if (!st) return;
    if (!z) { st.zone = null; return; }
    const c = Phaser.Display.Color.IntegerToColor(couleurDe(z.couleur));
    // sens gauche -> droite ; x0 > x1 : on échange les bouts (et les couleurs)
    if (z.x0 > z.x1) {
      const gauche = Phaser.Display.Color.IntegerToColor(couleurDe(z.couleur));
      const droite = scene.lights.ambientColor;
      st.zone = { x0: z.x1, x1: z.x0, r: droite.r, g: droite.g, b: droite.b };
      ambiance(scene, gauche.color);
      return;
    }
    st.zone = { x0: z.x0, x1: Math.max(z.x1, z.x0 + 1), r: c.redGL, g: c.greenGL, b: c.blueGL };
  }

  // Ambiance (r, g, b de 0 à 1) reçue à l'abscisse x du monde : même calcul que le shader.
  // Sert aux mesures (tests) et aux scripts qui règlent un effet sur la lumière du lieu.
  function ambianceEn(scene, x) {
    const lm = scene.lights, z = scene.__lumiere && scene.__lumiere.zone;
    const a = [lm.ambientColor.r, lm.ambientColor.g, lm.ambientColor.b];
    if (!z) return a;
    const t = Phaser.Math.Clamp((x - z.x0) / (z.x1 - z.x0), 0, 1);
    const s = t * t * (3 - 2 * t);
    return [a[0] + (z.r - a[0]) * s, a[1] + (z.g - a[1]) * s, a[2] + (z.b - a[2]) * s];
  }

  // ---------------------------------------------------------------- toute la scène
  // Classement d'un objet pour l'éclairage de toute une scène :
  //  'ui'      interface (HUD, textes, invites) : jamais éclairée ;
  //  'emissif' source de lumière (mélange ADD / SCREEN, ou `o.__lumiereEmissif`, ou le filtre de
  //            la scène) : garde ses couleurs, c'est elle qui éclaire ;
  //  'eclaire' image ou sprite : sur le pipeline (en sections s'il a des cartes, sinon à plat) ;
  //  'autre'   type que le pipeline ne sait pas dessiner (Graphics, formes, particules, TileSprite) :
  //            LightKit.bilan() les liste, la scène les traite à part (teinte, alpha) ou les évite.
  function classer(o, emissif) {
    if (o.__lumiereUi || o.type === 'Text' || o.type === 'BitmapText' || o.type === 'DynamicBitmapText') return 'ui';
    const role = o.lookRole || (typeof lookAutoRole === 'function' ? lookAutoRole(o) : null);
    if (role === 'ui') return 'ui';
    // HUD (écran, 1000 et plus) ; bulles et invites posées dans le monde (1040 et plus)
    if ((o.scrollFactorX === 0 && o.depth >= 1000) || o.depth >= 1040) return 'ui';
    const B = Phaser.BlendModes;
    if (o.__lumiereEmissif || o.blendMode === B.ADD || o.blendMode === B.SCREEN || (emissif && emissif(o))) return 'emissif';
    if ((o.type === 'Image' || o.type === 'Sprite') && o.setPipeline) return 'eclaire';
    return 'autre';
  }

  // Éclaire TOUTE la scène : chaque image et sprite du monde passe sur le pipeline (balayage
  // maintenant puis toutes les `intervalle` images, pour ce qui naît plus tard : ennemis,
  // effets, objets ramassés). Interface et sources de lumière exclues (cf. classer). C'est ce
  // qui fait la vraie obscurité : rien ne reste en pleine lumière, seules les lampes éclairent.
  //   LightKit.eclairerTout(scene, { emissif: (o) => o.texture.key.startsWith('item-fx_') });
  // `plan(o)` (facultatif) : distance en px du monde entre l'objet et le plan des sprites (paroi
  // du fond : grande ; sol : moyenne ; personnages : 0), cf. `__lumierePlan` dans le pipeline.
  function eclairerTout(scene, { emissif = null, plan = null, intervalle = 30 } = {}) {
    const st = scene.__lumiere;
    if (!st) return;
    st.emissif = emissif;
    const particules = new Set();
    const ranger = (o) => {
      if (!o || !o.active) return;
      // Enfant d'un conteneur (né seul puis rangé dedans, comme la barre d'énergie peinte) :
      // classé avec son conteneur racine (l'interface reste intacte).
      let racine = o;
      while (racine.parentContainer) racine = racine.parentContainer;
      if (racine !== o && classer(racine, emissif) === 'ui') return;
      if (o.type === 'Container') { if (classer(o, emissif) !== 'ui') visiter(o.list); return; }
      const cl = classer(o, emissif);
      if (cl === 'eclaire' && (!o.pipeline || o.pipeline.name !== NOM_PIPELINE)) {
        if (plan) o.__lumierePlan = plan(o) || 0;
        eclairer(o);
      } else if (cl === 'autre' && (o.type === 'ParticleEmitter' || o.type === 'TileSprite')) {
        o.__lumiereAttenue = true;
        particules.add(o);
      }
    };
    const visiter = (liste) => { for (const o of liste) ranger(o); };
    // Objets nés pendant la partie (effets, ennemis, gouttes) : rangés dès la fin de la mise à
    // jour où ils naissent, AVANT leur premier affichage (pas une image en pleine lumière).
    // Rangés après coup et non à l'ajout : la teinte, le mélange (ADD) sont posés juste après.
    const nouveaux = [];
    const ajoute = (o) => { nouveaux.push(o); };
    let n = 0;
    const balayer = () => {
      if (nouveaux.length) visiter(nouveaux.splice(0));
      if (n++ % intervalle === 0) visiter(scene.children.list);
      // Particules ordinaires (poussière, feuilles, copeaux) et TileSprite (fil de soie de
      // Xara) : Phaser ne les dessine pas avec un pipeline de sprite. Ils prennent la lumière
      // ESTIMÉE là où ils sont (ambiance + lampes proches) : en opacité pour les particules
      // (dans le noir, la poussière ne se voit pas), en teinte pour un TileSprite.
      for (const e of particules) {
        if (!e.active) { particules.delete(e); continue; }
        if (e.type === 'TileSprite') {
          if (!e.visible) continue;
          const c = e.getCenter ? e.getCenter() : e;
          const g = Math.round(255 * Phaser.Math.Clamp(lumiereEstimee(scene, c.x, c.y), 0, 1));
          e.setTint((g << 16) | (g << 8) | g);
          continue;
        }
        const p = e.alive && e.alive[0];
        if (p) e.setAlpha(Math.min(1, lumiereEstimee(scene, p.x, p.y)));
      }
    };
    visiter(scene.children.list);
    scene.sys.events.on(Phaser.Scenes.Events.ADDED_TO_SCENE, ajoute);
    scene.events.on('postupdate', balayer);
    scene.events.once('shutdown', () => {
      scene.events.off('postupdate', balayer);
      scene.sys.events.off(Phaser.Scenes.Events.ADDED_TO_SCENE, ajoute);
    });
  }

  // Lumière reçue en (x, y) du monde, à peu près (luminance 0-1+) : ambiance du lieu + chaque
  // lampe atténuée par la distance, sur une surface plate tournée vers le spectateur un peu
  // derrière le plan des sprites (N.L = z / distance, sans palier). Pour ce que le pipeline ne
  // dessine pas (particules, TileSprite) et pour les mesures.
  function lumiereEstimee(scene, x, y, plan = 40) {
    const a = ambianceEn(scene, x);
    let l = 0.3 * a[0] + 0.59 * a[1] + 0.11 * a[2];
    for (const L of scene.lights.lights) {
      const d = Math.hypot(L.x - x, L.y - y);
      const z = (L.profondeur ?? DEFAUTS.profondeur) + plan;
      if (d >= L.radius || !L.intensity || z <= 0) continue;
      let w = 1;
      if (L.masque) {
        const [x0, x1] = L.masque, t = Phaser.Math.Clamp((x - Math.min(x0, x1)) / Math.abs(x1 - x0), 0, 1);
        w = x0 < x1 ? t : 1 - t;
      }
      const c = L.color;
      l += w * L.intensity * (1 - (d * d) / (L.radius * L.radius)) * (z / Math.hypot(d, z)) * (0.3 * c.r + 0.59 * c.g + 0.11 * c.b);
    }
    return l;
  }

  // Ce qui est VISIBLE à l'écran sans passer par l'éclairage, hors interface et sources de
  // lumière : doit être vide (ou expliqué) dans une scène éclairée par eclairerTout. Renvoie
  // [{ type, cle, profondeur, x, y }] ; sert aux tests (« aucun sprite en pleine lumière »).
  // Ne compte pas : un Graphics vide, un émetteur sans particule (rien à l'écran), un émetteur
  // ordinaire déjà atténué par eclairerTout.
  function bilan(scene) {
    const st = scene.__lumiere, cam = scene.cameras.main, v = cam.worldView, out = [];
    const visiter = (liste, parentVisible) => {
      for (const o of liste) {
        if (!o || !o.active || !o.visible || !parentVisible || o.alpha === 0) continue;
        const cl = classer(o, st && st.emissif);
        if (o.type === 'Container') { if (cl !== 'ui') visiter(o.list, true); continue; }
        if (cl === 'ui' || cl === 'emissif') continue;
        if (o.pipeline && o.pipeline.name === NOM_PIPELINE) continue;
        if (o.type === 'Graphics' && o.commandBuffer && !o.commandBuffer.length) continue;
        if (o.__lumiereAttenue) continue;
        if (o.type === 'ParticleEmitter' && !(o.getAliveParticleCount && o.getAliveParticleCount())) continue;
        let b = null;
        try { b = o.getBounds ? o.getBounds() : null; } catch (e) { b = null; }
        if (b) {
          const dx = cam.scrollX * (1 - (o.scrollFactorX ?? 1)), dy = cam.scrollY * (1 - (o.scrollFactorY ?? 1));
          if (b.right + dx < v.x || b.x + dx > v.right || b.bottom + dy < v.y || b.y + dy > v.bottom) continue;
        }
        out.push({ type: o.type, cle: (o.texture && o.texture.key) || '', profondeur: o.depth, x: Math.round(o.x), y: Math.round(o.y) });
      }
    };
    visiter(scene.children.list, true);
    return out;
  }

  // ---------------------------------------------------------------- mode test (?lumiere)
  // `index.html?zone=foret_sombre_1&lumiere` : nuit, Agarica et tout sprite préparé éclairés,
  // torche au pointeur (molette : profondeur, négatif = derrière), lune en haut à gauche.
  // `?lumiere=-20` : profondeur de départ de la torche. Appelé par buildLevelFromData.
  function modeTest(scene) {
    if (typeof window === 'undefined') return;
    const q = new URLSearchParams(window.location.search);
    if (!q.has('lumiere') || !activer(scene, { ambiance: 'nuit' })) return;
    const z0 = Number(q.get('lumiere'));
    const torche = ajouterLumiere(scene, 'torche', { profondeur: Number.isFinite(z0) && q.get('lumiere') !== '' ? z0 : 8 });
    const lune = ajouterLumiere(scene, 'lune');
    const texte = scene.add.text(8, 520, '', { fontFamily: 'monospace', fontSize: '12px', color: '#d9d4e3' })
      .setScrollFactor(0).setDepth(100000);
    const afficher = () => texte.setText(`lumiere : profondeur ${torche.profondeur > 0 ? '+' : ''}${torche.profondeur} (molette)`);
    afficher();
    scene.input.on('pointermove', (p) => deplacer(torche, p.worldX, p.worldY));
    scene.input.on('wheel', (p, objs, dx, dy) => {
      torche.profondeur = Phaser.Math.Clamp(torche.profondeur + (dy > 0 ? -2 : 2), -60, 60);
      afficher();
    });
    let n = 0;
    const balayer = () => {
      const cam = scene.cameras.main;
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
    chargerCartes, filtrerCartes, activer, desactiver, eclairer, nePlusEclairer, aDesCartes,
    ajouterLumiere, deplacer, regler, suivre, retirerLumiere, ambiance, reglerRendu, modeTest, porteeConseillee,
    ambianceZone, ambianceEn, lumiereEstimee, classer, eclairerTout, bilan,
  };
})();

// Node (npm run lumiere:tests) lit le shader pour le comparer au gabarit et à la version CPU.
if (typeof module !== 'undefined' && module.exports) module.exports = LightKit;
