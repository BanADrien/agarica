// PROTOTYPE « cohésion visuelle » (2026-10-26) -- chargé UNIQUEMENT par
// prototype/coherence.html, jamais par index.html. Aucun fichier du jeu n'est
// modifié : tout est branché de l'extérieur (cf. src/proto/look.js).
//
// Deux passes plein écran (PostFXPipeline de Phaser 3.80, WebGL) :
// - LookBackPipeline : sur la caméra des FONDS (ciel, peinture lointaine,
//   arbres et lianes en parallaxe). Perspective atmosphérique : flou léger,
//   désaturation, assombrissement, brume de la couleur d'ambiance (plus dense
//   près de la ligne de sol, pour décoller le plan de jeu du fond).
// - LookWorldPipeline : sur la caméra principale (plan de jeu + premier plan).
//   Étalonnage commun (exposition, contraste, saturation, carte de dégradé
//   vers la palette de la zone, ombres poussées vers le violet nuit, hautes
//   lumières vers le vert lunaire), lumières douces aux sources, et la
//   DENSITÉ DE PIXELS : variante A = tout le plan de jeu ré-échantillonné sur
//   la grille des tuiles (24 px de dessin pour 64 px d'écran, soit un bloc de
//   8/3 px, grille ANCRÉE AU MONDE pour que le décor ne « nage » pas quand la
//   caméra bouge) ; variante B = rendu lisse (tuiles en LINEAR + léger
//   adoucissement).
// Tout l'étalonnage se fait en alpha PRÉMULTIPLIÉ (le format des tampons de
// Phaser) : les objets en ADD posés sur une zone transparente du plan de jeu
// (halos, lucioles) y laissent de la lumière « sans alpha », qu'il ne faut
// pas perdre en divisant par l'alpha.
// Vignette et grain sont multiplicatifs et calculés à l'identique dans les
// deux passes : multiplier chaque couche avant de les superposer revient à
// multiplier l'image finale (la superposition « over » est linéaire).
// L'interface est rendue par une 3e caméra sans effet (cf. look.js).
(function () {
  'use strict';

  // Lumières : 16 au plus (boucle à borne constante en GLSL ES 1.0).
  const LOOK_MAX_LIGHTS = 16;

  const COMMON = `
precision highp float;
uniform sampler2D uMainSampler;
uniform vec2 uRes;
uniform float uFlipY;
uniform vec4 uLights[${LOOK_MAX_LIGHTS}];
uniform vec4 uLightCol[${LOOK_MAX_LIGHTS}];
uniform float uLightCount;
uniform vec3 uAmbient;
uniform float uLightMul;
uniform float uVignette;
uniform vec3 uVigColor;
uniform float uGrain;
uniform float uTime;
varying vec2 outTexCoord;
const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);

// Coordonnées en px d'écran, origine en HAUT à gauche (comme le monde).
vec2 toTop(vec2 uv) { vec2 p = uv * uRes; if (uFlipY > 0.5) p.y = uRes.y - p.y; return p; }
vec2 toUv(vec2 p) { if (uFlipY > 0.5) p.y = uRes.y - p.y; return p / uRes; }
// Lecture du centre d'un pixel (jamais d'interpolation entre deux pixels).
vec4 tapPx(vec2 p) { return texture2D(uMainSampler, toUv(floor(p) + 0.5)); }

// Somme des lumières (multiplicative, « carte de lumière ») et halo additif.
vec3 lighting(vec2 p, out vec3 glow) {
  vec3 L = vec3(0.0);
  glow = vec3(0.0);
  for (int i = 0; i < ${LOOK_MAX_LIGHTS}; i++) {
    if (float(i) >= uLightCount) break;
    vec4 li = uLights[i];
    vec4 lc = uLightCol[i];
    vec2 d = p - li.xy;
    float f = clamp(1.0 - dot(d, d) / (li.z * li.z), 0.0, 1.0);
    f *= f;
    L += lc.rgb * (li.w * f);
    glow += lc.rgb * (lc.a * f * f);
  }
  return L;
}

// Facteur multiplicatif commun aux deux passes (vignette teintée + grain).
// gp : position du grain (bloc de la grille en variante A).
vec3 finishMul(vec2 p, vec2 gp) {
  vec2 q = (p / uRes - 0.5) * vec2(uRes.x / uRes.y, 1.0);
  float k = uVignette * smoothstep(0.42, 1.08, length(q));
  vec3 m = mix(vec3(1.0), uVigColor, k);
  if (uGrain > 0.0) {
    vec2 g = floor(gp) + floor(uTime * 24.0) * vec2(17.0, 59.0);
    float n = fract(sin(dot(g, vec2(12.9898, 78.233))) * 43758.5453);
    m *= 1.0 + (n - 0.5) * uGrain;
  }
  return m;
}

// Luminance de la vraie couleur (estimée : rgb prémultiplié / alpha).
float lumaOf(vec3 rgb, float a) { return clamp(dot(rgb, LUMA) / max(a, 0.004), 0.0, 4.0); }
`;

  const WORLD_FRAG = `
#define SHADER_NAME AGARICA_LOOK_WORLD_FS
${COMMON}
uniform vec2 uScroll;
uniform float uPx;
uniform float uPxMode;
uniform float uSoft;
uniform float uExposure;
uniform float uContrast;
uniform float uPivot;
uniform float uSat;
uniform vec3 uMapLo;
uniform vec3 uMapMid;
uniform vec3 uMapHi;
uniform float uMapAmt;
uniform vec3 uShadowTint;
uniform float uShadowAmt;
uniform vec3 uHighTint;
uniform float uHighAmt;
uniform float uGlow;

vec4 sampleWorld(vec2 p, out vec2 cell) {
  cell = p;
  if (uPx > 1.0) {
    // Bloc de la grille ancrée au monde (cf. uScroll).
    vec2 c0 = floor((p + uScroll) / uPx) * uPx - uScroll;
    cell = c0 + 0.5 * uPx;
    if (uPxMode > 0.5) return tapPx(cell);
    vec2 q = vec2(0.25, 0.75) * uPx;
    return 0.25 * (tapPx(c0 + q.xx) + tapPx(c0 + q.yx) + tapPx(c0 + q.xy) + tapPx(c0 + q.yy));
  }
  vec4 c = texture2D(uMainSampler, toUv(p));
  if (uSoft > 0.0) {
    vec4 s = 0.25 * (texture2D(uMainSampler, toUv(p + vec2(1.0, 0.0)))
      + texture2D(uMainSampler, toUv(p - vec2(1.0, 0.0)))
      + texture2D(uMainSampler, toUv(p + vec2(0.0, 1.0)))
      + texture2D(uMainSampler, toUv(p - vec2(0.0, 1.0))));
    c = mix(c, s, uSoft);
  }
  return c;
}

vec3 gradientMap(float l) {
  return l < 0.5 ? mix(uMapLo, uMapMid, l * 2.0) : mix(uMapMid, uMapHi, min(1.0, (l - 0.5) * 2.0));
}

void main() {
  vec2 p = toTop(outTexCoord);
  vec2 cell;
  vec4 col = sampleWorld(p, cell);
  float a = col.a;
  vec3 rgb = col.rgb * uExposure;
  rgb = mix(vec3(dot(rgb, LUMA)), rgb, uSat);
  rgb = max((rgb - uPivot * a) * uContrast + uPivot * a, 0.0);
  float l = lumaOf(rgb, a);
  // Carte de dégradé : chaque couleur tirée vers la palette de la zone selon
  // sa luminance (c'est ce qui fait « parler la même langue » aux images).
  rgb = mix(rgb, gradientMap(min(l, 1.0)) * a, uMapAmt * min(1.0, a * 4.0));
  l = lumaOf(rgb, a);
  rgb += uShadowTint * (uShadowAmt * (1.0 - smoothstep(0.0, 0.45, l)) * a);
  rgb = mix(rgb, rgb * uHighTint, uHighAmt * smoothstep(0.3, 1.0, l));
  vec3 glow;
  vec3 L = lighting(cell, glow);
  rgb *= uAmbient + L * uLightMul;
  // Halo des lumières AJOUTÉ sans toucher à l'alpha : il éclaire aussi le
  // fond vu à travers les zones transparentes du plan de jeu.
  rgb += glow * uGlow;
  rgb *= finishMul(p, cell);
  gl_FragColor = vec4(rgb, a);
}
`;

  const BACK_FRAG = `
#define SHADER_NAME AGARICA_LOOK_BACK_FS
${COMMON}
uniform float uBlur;
uniform float uBright;
uniform float uSat;
uniform float uContrast;
uniform vec3 uFog;
uniform float uFogAmt;
uniform float uMist;
uniform float uMistTop;
uniform float uMistBottom;

#define TAP(ox, oy, w) acc += texture2D(uMainSampler, toUv(p + vec2(ox, oy) * uBlur)) * w; wsum += w;
vec4 blurred(vec2 p) {
  vec4 acc = vec4(0.0);
  float wsum = 0.0;
  TAP(0.0, 0.0, 0.16)
  TAP(-0.326, -0.406, 0.09) TAP(-0.840, -0.074, 0.07) TAP(-0.696, 0.457, 0.07)
  TAP(-0.203, 0.621, 0.09) TAP(0.962, -0.195, 0.06) TAP(0.473, -0.480, 0.08)
  TAP(0.519, 0.767, 0.06) TAP(0.185, -0.893, 0.06) TAP(0.507, 0.064, 0.09)
  TAP(0.896, 0.412, 0.06) TAP(-0.322, -0.933, 0.06) TAP(-0.792, -0.598, 0.06)
  return acc / wsum;
}

void main() {
  vec2 p = toTop(outTexCoord);
  vec4 col = uBlur > 0.01 ? blurred(p) : texture2D(uMainSampler, outTexCoord);
  float a = col.a;
  vec3 rgb = col.rgb;
  rgb = mix(vec3(dot(rgb, LUMA)), rgb, uSat);
  rgb = max((rgb - 0.5 * a) * uContrast + 0.5 * a, 0.0) * uBright;
  // Brume : uniforme + plus dense vers la ligne de sol (bas de l'écran).
  float fogK = clamp(uFogAmt + uMist * smoothstep(uMistTop, uMistBottom, p.y / uRes.y), 0.0, 1.0);
  rgb = mix(rgb, uFog * a, fogK);
  vec3 glow;
  vec3 L = lighting(p, glow);
  rgb *= uAmbient + L * uLightMul;
  rgb *= finishMul(p, p);
  gl_FragColor = vec4(rgb, a);
}
`;

  // Uniformes communs, posés depuis l'état calculé à chaque image par look.js
  // (`pipeline.look` = { cfg, frame }).
  function setCommon(pl, f, cfg, part) {
    pl.set2f('uRes', pl.renderer.width, pl.renderer.height);
    pl.set1f('uFlipY', cfg.flipY ? 1 : 0);
    pl.set1f('uLightCount', f.lightCount);
    pl.set4fv('uLights', f.lights);
    pl.set4fv('uLightCol', f.lightCols);
    pl.set3f('uAmbient', part.ambient[0], part.ambient[1], part.ambient[2]);
    pl.set1f('uLightMul', part.lightMul);
    pl.set1f('uVignette', cfg.vignette);
    pl.set3f('uVigColor', cfg.vigColor[0], cfg.vigColor[1], cfg.vigColor[2]);
    pl.set1f('uGrain', cfg.grain);
    pl.set1f('uTime', f.time);
  }

  // Composition sur l'écran : toujours en NORMAL prémultiplié (sinon le mode
  // de fusion du dernier objet dessiné, ADD par exemple, serait réutilisé).
  function drawLook(pl, target) {
    pl.applyLook();
    pl.renderer.setBlendMode(Phaser.BlendModes.NORMAL);
    pl.bindAndDraw(target);
  }

  class LookWorldPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
    constructor(game) {
      super({ game, name: 'LookWorldPipeline', fragShader: WORLD_FRAG });
      this.look = null;
      this.lookPart = 'world';
    }

    onDraw(target) { drawLook(this, target); }

    applyLook() {
      const L = this.look;
      if (!L || !L.frame) return;
      const { cfg, frame: f } = L;
      const g = cfg.grade;
      // Passe « personnages » (A, pxchars=0) : sans grille, sans halo.
      const front = this.lookPart === 'front';
      setCommon(this, f, cfg, cfg.world);
      this.set2f('uScroll', f.scrollX, f.scrollY);
      this.set1f('uPx', front ? 0 : cfg.pixel);
      this.set1f('uPxMode', cfg.pixelMode === 'near' ? 1 : 0);
      this.set1f('uSoft', front ? 0 : cfg.soft);
      this.set1f('uExposure', g.exposure);
      this.set1f('uContrast', g.contrast);
      this.set1f('uPivot', g.pivot);
      this.set1f('uSat', g.sat);
      this.set3f('uMapLo', g.mapLo[0], g.mapLo[1], g.mapLo[2]);
      this.set3f('uMapMid', g.mapMid[0], g.mapMid[1], g.mapMid[2]);
      this.set3f('uMapHi', g.mapHi[0], g.mapHi[1], g.mapHi[2]);
      this.set1f('uMapAmt', g.mapAmt);
      this.set3f('uShadowTint', g.shadowTint[0], g.shadowTint[1], g.shadowTint[2]);
      this.set1f('uShadowAmt', g.shadowAmt);
      this.set3f('uHighTint', g.highTint[0], g.highTint[1], g.highTint[2]);
      this.set1f('uHighAmt', g.highAmt);
      this.set1f('uGlow', front ? 0 : cfg.world.glow);
    }
  }

  class LookBackPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
    constructor(game) {
      super({ game, name: 'LookBackPipeline', fragShader: BACK_FRAG });
      this.look = null;
    }

    onDraw(target) { drawLook(this, target); }

    applyLook() {
      const L = this.look;
      if (!L || !L.frame) return;
      const { cfg, frame: f } = L;
      const b = cfg.back;
      setCommon(this, f, cfg, b);
      this.set1f('uBlur', b.blur);
      this.set1f('uBright', b.bright);
      this.set1f('uSat', b.sat);
      this.set1f('uContrast', b.contrast);
      this.set3f('uFog', b.fog[0], b.fog[1], b.fog[2]);
      this.set1f('uFogAmt', b.fogAmt);
      this.set1f('uMist', b.mist);
      this.set1f('uMistTop', b.mistBand[0]);
      this.set1f('uMistBottom', b.mistBand[1]);
    }
  }

  // Enregistrées à la première zone construite (le renderer n'existe pas
  // encore quand ce fichier est chargé). Mode de fusion « ADD sans alpha »
  // (rgb += src, alpha inchangé) : l'ADD de Phaser (ONE, DST_ALPHA) écrit
  // aussi l'alpha et assombrit son rectangle entier quand il est dessiné dans
  // un tampon de caméra à moitié transparent (constaté : halo carré autour
  // des liserés). Les objets ADD des caméras à effet passent par celui-ci.
  function lookEnsurePipelines(game) {
    const r = game.renderer;
    if (!r || !r.pipelines || !r.gl) return false;
    const pm = r.pipelines;
    if (!pm.postPipelineClasses.has('LookWorldPipeline')) pm.addPostPipeline('LookWorldPipeline', LookWorldPipeline);
    if (!pm.postPipelineClasses.has('LookBackPipeline')) pm.addPostPipeline('LookBackPipeline', LookBackPipeline);
    if (window.LOOK_ADD_BLEND == null) {
      const gl = r.gl;
      window.LOOK_ADD_BLEND = r.addBlendMode([gl.ONE, gl.ONE, gl.ZERO, gl.ONE], gl.FUNC_ADD);
    }
    return true;
  }

  window.LOOK_MAX_LIGHTS = LOOK_MAX_LIGHTS;
  window.LOOK_ADD_BLEND = null;
  window.LookWorldPipeline = LookWorldPipeline;
  window.LookBackPipeline = LookBackPipeline;
  window.lookEnsurePipelines = lookEnsurePipelines;
}());
