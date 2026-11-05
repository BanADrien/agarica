// LookKit — rendu de « cohésion visuelle » des zones (2026-10-28).
//
// Pourquoi : retour utilisateur « le rendu visuel est OK mais les éléments
// s'intègrent mal » (images d'origines différentes : terre orange saturée,
// fonds peints qui rivalisent avec le plan de jeu, personnages qui flottent).
// Le prototype (prototype/coherence.html, src/proto/, variante « C, cohésion
// seule ») a été validé, puis l'utilisateur a tranché (2026-10-28) : « retire
// les [ombres des décors], ça rend mal, et garde le gamma d'avant sur ces
// mêmes éléments, les autres modifs sont bien, applique-les partout ».
//
// Ce que fait le rendu, zone par zone (clé de zone `look`, cf. PLAN_DEV.md) :
// - tuiles ré-étalonnées À LA SOURCE (pixels de leurs textures, une fois à
//   l'entrée de zone) par jeu de tuiles, puis teintées corps / herbe ;
// - étalonnage du PLAN DE JEU (tuiles, personnages, effets) : exposition,
//   contraste, saturation, carte de dégradé vers la palette de la zone ;
// - FONDS (couches lointaines) : flou, désaturation, assombrissement et brume
//   PRÉCALCULÉS en textures à l'entrée de zone, brume du bas d'écran et
//   lumière très atténuée dans le shader ;
// - lumières douces aux sources (feu, champignons, rai de lune, lanternes,
//   lucioles), halo additif ;
// - ombre de contact et liseré discret sous / sur les PERSONNAGES ;
// - DÉCORS (rôle 'prop') : AUCUN étalonnage, aucune ombre (décision du
//   2026-10-28) ; seules les lumières peuvent les éclairer (jamais les
//   assombrir) ;
// - interface (rôle 'ui') : intacte.
//
// Méthode : pas d'effet plein écran (le prototype rendait toute la scène dans
// 3 caméras et 2 passes : les décors ne pouvaient pas y échapper sans casser
// l'ordre d'affichage). Ici l'étalonnage est fait PAR OBJET, dans le shader de
// lot de Phaser (MultiPipeline dérivé) : chaque objet garde sa place dans la
// liste d'affichage, un décor derrière Agarica reste derrière elle. Sept
// variantes du même shader (monde, sol de second plan, décor, fond,
// au-dessus/au-dessous du voile d'ambiance) ; changer de variante entre deux
// objets coûte un appel de dessin.
//
// Voile d'ambiance (`ambient`, rectangle à la profondeur 900) : le profil le
// réduit (`overlay`, ×0,5 en forêt sombre) comme le prototype ; les objets
// dessinés SOUS lui compensent dans leur shader. Le plan de jeu reproduit
// l'ordre du prototype (voile puis étalonnage) ; un décor retrouve
// EXACTEMENT sa couleur d'avant sous le voile complet.
//
// Rôles : `obj.lookRole = 'back' | 'world' | 'prop' | 'ui'`, posé là où les
// objets sont créés (LevelKit, StoryKit) ; sinon classement automatique
// (lookAutoRole : profondeur, parallaxe, préfixe de texture).
// Option « Effets visuels » (OptionsScene, `visualFx`, localStorage) :
// désactivée = rien n'est posé, rendu et coût d'avant.

const LOOK_MAX_LIGHTS = 8;
// Halo additif des lumières : au-dessus de la vignette peinte (999,5), sous
// le HUD (1000) -- comme le prototype, qui l'ajoutait après tout le monde.
const LOOK_GLOW_DEPTH = 999.9;
const LOOK_RIM_DEPTH_OFFSET = 0.001;
const LOOK_LIGHT_RESCAN_FRAMES = 30;
const LOOK_CHAR_RESCAN_FRAMES = 15;
const LOOK_SCAN_FRAMES = 10;
const LOOK_FIREFLY_MAX = 4;
const LOOK_SHADOW_FALLBACK_KEY = 'look-shadow-ellipse';
const LOOK_GLOW_KEY = 'look-glow';
// Suffixe des textures de fond précalculées : la clé garde son préfixe
// d'origine (`item-…`), que certains scripts lisent (cf. a2SkyWash, acte2.js).
const LOOK_BAKE_SUFFIX = '#look';
const LOOK_BAKE_MAX_SIDE = 4096;
const LOOK_ROLES = ['back', 'world', 'prop', 'ui'];

const lookRgb = (hex) => [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255];
// Un TileSprite garde sa vraie clé dans displayTexture (o.texture = canevas
// de travail à clé aléatoire).
const lookTexKey = (o) => (o && ((o.type === 'TileSprite' && o.displayTexture && o.displayTexture.key) || (o.texture && o.texture.key))) || '';

// ---------------------------------------------------------------------------
// Profils (réglages d'une zone). Clé de zone `look` : nom de profil, ou
// { profile, ...réglages } fusionnés par-dessus (objets imbriqués fusionnés,
// tableaux et valeurs remplacés ; `false` coupe un levier).
// ---------------------------------------------------------------------------
const LOOK_PROFILES = {
  // Réglages finaux du prototype (variante C, après la critique des deux
  // directeurs artistiques), moins tout ce qui touchait aux décors (ombres,
  // silhouettes du premier plan, sous-bois assombri).
  foret_sombre: {
    // Étalonnage du plan de jeu (tuiles, personnages, effets). Noirs non
    // relevés, un cran de contraste, carte de dégradé violet nuit -> bleu-
    // violet -> vert lunaire mélangée à 14 %.
    grade: {
      exposure: 1.04, contrast: 1.22, pivot: 0.3, sat: 1.0,
      map: [0x120a24, 0x4a4478, 0xd2f7e2], mapAmt: 0.14,
      shadowTint: 0x3a2266, shadowAmt: 0.03,
      highTint: [0.9, 1.05, 1.0], highAmt: 0.3,
      // Ambiance multipliée (légèrement froide), avant les lumières.
      ambient: [0.97, 0.95, 1.02],
    },
    // Voile `ambient` de la zone : alpha multiplié (l'étalonnage assombrit
    // déjà le plan de jeu ; les décors gardent leur valeur d'avant).
    overlay: 0.5,
    // Fonds : perspective atmosphérique (flou 1,2 px d'écran, brume violette
    // plus dense vers le bas de l'écran). Lumières à 0 (prototype : ×0,2) : à
    // peine visible, mais ce sont les plus grandes surfaces de l'écran, c'était
    // le poste le plus cher sur puce intégrée (environ 1,5 ms) ; les halos
    // additifs et peints éclairent toujours le fond derrière le feu.
    back: {
      blur: 1.2, bright: 0.78, sat: 0.64, contrast: 0.92,
      fog: 0x1e1438, fogAmt: 0.1, mist: 0.15, mistBand: [0.42, 0.86],
      lightMul: 0,
    },
    // Tuiles : réglages du jeu de tuiles (LOOK_TILESETS), surchargeables ici
    // (`tint`, `grade`) ; `backBright` : valeur du sol de second plan (× après
    // l'étalonnage du sol de jeu, 0,55 par défaut).
    tiles: {},
    lights: {
      // Halo additif d'ensemble ; part des lumières reçue par les décors (0,5 :
      // ils sont éclairés légèrement, sans perdre leur gamma d'origine, même
      // la source elle-même : champignons, flammes). Jamais d'assombrissement.
      glow: 0.2, propMul: 0.5,
      // Rai de lune (alpha du sprite, ×) et halo peint du feu (×) : la carte
      // de lumière éclaire déjà, les deux halos se cumulaient.
      raiAlpha: 0.6, haloAlpha: 0.6,
      rules: {
        feu: { radius: 200, intensity: 0.62, glow: 0.22 },
        champignons: { intensity: 0.45, glow: 0.15 },
        rai: { intensity: 0.28, glow: 0.04 },
      },
      fly: { intensity: 0.12, radius: 50, glow: 0.03 },
      self: { intensity: 0.08, radius: 140, color: 0xe6dcff },
      xara: { intensity: 0.22, radius: 70, glow: 0.04, color: 0xff9ad6 },
    },
    // Liseré : UNE copie décalée vers le haut, vert lunaire, teintée par la
    // lumière la plus proche (chaud près du feu).
    rim: { color: 0x8ff0c0, alpha: 0.15, offsets: [[0, -1]], px: 1.4, lightTint: 0.9 },
    // Ombre de contact sous les personnages (jamais sous les décors).
    shadow: { alpha: 0.78 },
  },
  // Nuit générique plus douce (base pour les autres zones nocturnes).
  nuit: {
    grade: {
      exposure: 1.03, contrast: 1.15, pivot: 0.3, sat: 0.95,
      map: [0x150d28, 0x55507f, 0xe0f7ea], mapAmt: 0.14,
      shadowTint: 0x3a2266, shadowAmt: 0.04,
      highTint: [0.9, 1.04, 0.98], highAmt: 0.3,
      ambient: [0.94, 0.92, 1.0],
    },
    overlay: 0.7,
    back: {
      blur: 1.2, bright: 0.8, sat: 0.62, contrast: 0.92,
      fog: 0x221a40, fogAmt: 0.12, mist: 0.18, mistBand: [0.42, 0.86],
      lightMul: 0,
    },
    tiles: {},
    lights: {
      glow: 0.2, propMul: 0.5, raiAlpha: 0.75, haloAlpha: 0.7,
      rules: {
        feu: { radius: 210, intensity: 0.62, glow: 0.22 },
        champignons: { intensity: 0.45, glow: 0.15 },
        rai: { intensity: 0.3, glow: 0.04 },
      },
      fly: { intensity: 0.12, radius: 50, glow: 0.03 },
      self: { intensity: 0.08, radius: 140, color: 0xe6dcff },
      xara: { intensity: 0.22, radius: 70, glow: 0.04, color: 0xff9ad6 },
    },
    rim: { color: 0x8ff0c0, alpha: 0.15, offsets: [[0, -1]], px: 1.4, lightTint: 0.9 },
    shadow: { alpha: 0.6 },
  },
  // Zones claires (forêt flottante de jour, clairière) : point de départ
  // prudent, à régler à l'image (moins de contraste et de palette, voile
  // presque intact, fonds juste un peu reculés).
  jour: {
    grade: {
      exposure: 1.0, contrast: 1.08, pivot: 0.35, sat: 0.95,
      map: [0x1a1430, 0x6a6890, 0xf0fff4], mapAmt: 0.08,
      shadowTint: 0x3a2266, shadowAmt: 0.02,
      highTint: [0.96, 1.02, 1.0], highAmt: 0.2,
      ambient: [1, 1, 1],
    },
    overlay: 0.85,
    back: {
      blur: 1.0, bright: 0.92, sat: 0.75, contrast: 0.92,
      fog: 0x8aa6c8, fogAmt: 0.08, mist: 0.12, mistBand: [0.45, 0.9],
      lightMul: 0,
    },
    tiles: {},
    lights: {
      glow: 0.12, propMul: 0.4, raiAlpha: 0.85, haloAlpha: 0.85,
      rules: {},
      fly: { intensity: 0.08, radius: 50, glow: 0.02 },
      self: { intensity: 0, radius: 140, color: 0xe6dcff },
      xara: { intensity: 0.12, radius: 60, glow: 0.02, color: 0xff9ad6 },
    },
    rim: { color: 0xfff4d8, alpha: 0.1, offsets: [[0, -1]], px: 1.2, lightTint: 0.6 },
    shadow: { alpha: 0.55 },
  },
};

// Ré-étalonnage et teinte des tuiles, PAR JEU DE TUILES (`tileset` de la zone,
// sinon le jeu par défaut AUTOTILE_TILESET). `grade` : pixels des textures
// passés en TSL par bande de teinte -- `green` (herbe / mousse, teintes dans
// `greenRange`), `keep` (bande laissée telle quelle : champignons cyan,
// fissures lumineuses), `warm` (tout le reste : terre, écorce, roche) ; les
// gris purs (contours) ne bougent jamais. `tint` : teinte multipliée posée sur
// les images -- `body` / `grass` pour le jeu en atlas (herbe en image
// séparée), `blob` pour les jeux de biome (herbe dessinée dans la case).
const LOOK_TILESETS = {
  // Jeu par défaut (pixel art) : terre gris-violet au contraste interne
  // réduit (la grille de 2,67 px se voit moins), herbe vert lunaire claire ;
  // corps sombre / bord d'herbe clair (valeurs du prototype C).
  tuiles: {
    tint: { body: 0xc0b4d8, grass: 0xd2dcc8, blob: null },
    grade: {
      warm: { hue: 285, hueAmt: 0.4, sat: 0.3, light: 1.0, contrast: 0.8 },
      green: { hue: 140, hueAmt: 0.3, sat: 0.85, light: 1.12 },
      greenRange: [60, 200], keep: null,
    },
  },
  floor: {
    tint: { body: null, grass: null, blob: 0xc8bcdc },
    grade: {
      warm: { hue: 285, hueAmt: 0.35, sat: 0.4, light: 1.0, contrast: 0.85 },
      green: { hue: 140, hueAmt: 0.3, sat: 0.85, light: 1.08 },
      greenRange: [60, 200], keep: null,
    },
  },
  // Écorce (racines, arène de Kainati, épreuve du singe) : écorce brune un
  // peu éteinte, mousse vers le vert lunaire ; champignons cyan gardés.
  tuiles_ecorce: {
    tint: { body: null, grass: null, blob: null },
    grade: {
      warm: { hue: 300, hueAmt: 0.2, sat: 0.6, light: 0.95, contrast: 0.9 },
      green: { hue: 140, hueAmt: 0.2, sat: 0.9, light: 1.0 },
      greenRange: [60, 165], keep: [165, 215],
    },
  },
  // Flottantes (forêt flottante 2, clairière, hutte) : terre chaude adoucie,
  // herbe jaune-vert un peu moins acide.
  tuiles_flottantes: {
    tint: { body: null, grass: null, blob: null },
    grade: {
      warm: { hue: 300, hueAmt: 0.15, sat: 0.65, light: 0.97, contrast: 0.9 },
      green: { hue: 120, hueAmt: 0.15, sat: 0.88, light: 1.0 },
      greenRange: [55, 165], keep: [165, 215],
    },
  },
  // Corrompues : roche déjà violette, mousse vert acide = signal d'histoire
  // (la corruption) : quasi intactes.
  tuiles_corrompues: {
    tint: { body: null, grass: null, blob: null },
    grade: {
      warm: { hue: 270, hueAmt: 0.1, sat: 0.9, light: 1.0, contrast: 1.0 },
      green: { hue: 100, hueAmt: 0, sat: 1.0, light: 1.0 },
      greenRange: [60, 165], keep: [165, 215],
    },
  },
};

// Lumières reconnues dans la scène (objets à parallaxe 1) : couleur, rayon
// (px du monde), intensité de la carte de lumière, halo additif, position
// relative au centre visible ; `flicker` / `pulse` : vacillement / respiration.
const LOOK_LIGHT_RULES = [
  { id: 'feu', test: (o) => lookTexKey(o).startsWith('decor-campfire'), color: 0xffa06a, radius: 250, intensity: 0.72, glow: 0.35, dy: -0.15, flicker: 0.1 },
  { id: 'champignons', test: (o) => (o.propType || '').includes('champignons_lumineux'), color: 0x66e6ff, radius: 160, intensity: 0.6, glow: 0.22, dy: -0.1, pulse: 0.08 },
  { id: 'souche', test: (o) => (o.propType || '').includes('souche_champignons'), color: 0x7fd8ff, radius: 120, intensity: 0.4, glow: 0.12, dy: -0.15, pulse: 0.06 },
  { id: 'mousse', test: (o) => lookTexKey(o).startsWith('item-decor_mousse_lumineuse') || (o.propType || '').startsWith('decor_mousse_lumineuse'), color: 0x9dffb4, radius: 110, intensity: 0.38, glow: 0.1, dy: 0 },
  { id: 'rai', test: (o) => lookTexKey(o) === 'item-fx_rai_lumiere', color: 0xbfe6ff, radius: 210, intensity: 0.5, glow: 0.1, dy: 0.3 },
  { id: 'lanterne', test: (o) => lookTexKey(o) === 'item-decor_lanterne_allumee', color: 0x9fffc8, radius: 170, intensity: 0.6, glow: 0.2, dy: -0.1 },
];

// Squelette complet d'un réglage (une clé absente du profil = neutre).
const LOOK_DEFAULTS = {
  grade: {
    exposure: 1, contrast: 1, pivot: 0.3, sat: 1, map: [0x000000, 0x808080, 0xffffff], mapAmt: 0,
    shadowTint: 0x000000, shadowAmt: 0, highTint: [1, 1, 1], highAmt: 0, ambient: [1, 1, 1],
  },
  overlay: 1,
  back: { blur: 0, bright: 1, sat: 1, contrast: 1, fog: 0x000000, fogAmt: 0, mist: 0, mistBand: [0.42, 0.86], lightMul: 0 },
  tiles: {},
  lights: {
    max: LOOK_MAX_LIGHTS, glow: 0, propMul: 0.5, raiAlpha: 1, haloAlpha: 1, rules: {},
    fly: { intensity: 0, radius: 50, glow: 0 },
    self: { intensity: 0, radius: 140, color: 0xe6dcff },
    xara: { intensity: 0, radius: 70, glow: 0, color: 0xff9ad6 },
  },
  rim: false,
  shadow: false,
};

function lookIsPlainObject(v) {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

// Fusion profonde : objets fusionnés, le reste (tableaux, nombres, false,
// null) remplacé. Ne modifie jamais `src` (profils partagés).
function lookMerge(dst, src) {
  if (!lookIsPlainObject(src)) return dst;
  for (const [k, v] of Object.entries(src)) {
    if (lookIsPlainObject(v)) {
      dst[k] = lookMerge(lookIsPlainObject(dst[k]) ? dst[k] : {}, v);
    } else {
      dst[k] = Array.isArray(v) ? v.slice() : v;
    }
  }
  return dst;
}

// Réglage complet d'une zone depuis sa clé `look` (null = pas de rendu).
function lookResolveConfig(data) {
  const spec = data && data.look;
  if (!spec) return null;
  const name = typeof spec === 'string' ? spec : (spec.profile || 'nuit');
  const prof = LOOK_PROFILES[name];
  if (!prof) {
    console.warn(`LookKit : profil de rendu inconnu "${name}"`);
    return null;
  }
  const cfg = lookMerge(lookMerge({}, LOOK_DEFAULTS), prof);
  if (lookIsPlainObject(spec)) {
    const { profile, ...rest } = spec;
    lookMerge(cfg, rest);
  }
  cfg.profile = name;
  // Lumières : jamais plus que la borne du shader.
  if (cfg.lights) cfg.lights.max = Phaser.Math.Clamp(cfg.lights.max ?? LOOK_MAX_LIGHTS, 0, LOOK_MAX_LIGHTS);
  return cfg;
}

// ---------------------------------------------------------------------------
// Option « Effets visuels » (menuOptions().visualFx, MenuKit.js) : lue au plus
// toutes les 500 ms (même cache que les secousses d'écran).
// ---------------------------------------------------------------------------
let lookEnabledCache = { at: -Infinity, on: true };

function lookEnabled() {
  const now = Date.now();
  if (now - lookEnabledCache.at > 500) {
    let on = true;
    try { if (typeof menuOptions === 'function') on = menuOptions().visualFx !== false; } catch (e) { on = true; }
    lookEnabledCache = { at: now, on };
  }
  return lookEnabledCache.on;
}

// Appliquée TOUT DE SUITE à la zone en cours (posée ou retirée), sans
// redémarrer la scène ; les zones suivantes la lisent à leur construction.
function lookSetEnabled(on) {
  on = !!on;
  if (typeof menuSetOption === 'function') menuSetOption('visualFx', on);
  lookEnabledCache = { at: Date.now(), on };
  const scene = typeof currentLevelScene !== 'undefined' ? currentLevelScene : null;
  // Zone en cours, éventuellement en pause (le menu Options s'ouvre depuis la
  // pause) ; depuis l'écran-titre il n'y en a pas : prochaine zone seulement.
  if (!scene || !scene.sys || !(scene.sys.isActive() || scene.sys.isPaused())) return;
  if (on) lookAttach(scene, null);
  else lookDetach(scene);
}

// ---------------------------------------------------------------------------
// Shaders : le shader de lot de Phaser (MultiPipeline), complété. Les sources
// sont reprises de l'instance en cours (même nombre d'unités de texture) et
// seule la couleur finale passe par lookShade ; la position d'écran du
// sommet (inPosition, en px de la caméra) est transmise au fragment.
// ---------------------------------------------------------------------------
const LOOK_FRAG_HEAD = `
uniform vec4 uLookGrade;
uniform vec4 uLookGrade2;
uniform vec3 uLookMapLo;
uniform vec3 uLookMapMid;
uniform vec3 uLookMapHi;
uniform vec3 uLookShadowTint;
uniform vec4 uLookHigh;
uniform vec4 uLookPreOv;
uniform vec4 uLookPostOv;
uniform vec4 uLookFog;
uniform vec4 uLookMist;
uniform vec4 uLookAmbient;
uniform vec4 uLookLights[${LOOK_MAX_LIGHTS}];
uniform vec4 uLookLightCol[${LOOK_MAX_LIGHTS}];
uniform float uLookLightCount;
varying vec2 outScreen;
const vec3 LOOK_LUMA = vec3(0.2126, 0.7152, 0.0722);

float lookLuma(vec3 rgb, float a) { return clamp(dot(rgb, LOOK_LUMA) / max(a, 0.004), 0.0, 4.0); }

vec3 lookMap(float l) {
  return l < 0.5 ? mix(uLookMapLo, uLookMapMid, l * 2.0) : mix(uLookMapMid, uLookMapHi, min(1.0, (l - 0.5) * 2.0));
}

// Carte de lumière : somme des lumières douces (multiplicative).
vec3 lookLights(vec2 p) {
  vec3 L = vec3(0.0);
  for (int i = 0; i < ${LOOK_MAX_LIGHTS}; i++) {
    if (float(i) >= uLookLightCount) break;
    vec4 li = uLookLights[i];
    vec2 d = p - li.xy;
    float f = clamp(1.0 - dot(d, d) / (li.z * li.z), 0.0, 1.0);
    L += uLookLightCol[i].rgb * (li.w * f * f);
  }
  return L;
}

// Couleur PRÉMULTIPLIÉE (celle du lot) -> couleur rendue. Ordre : voile
// d'ambiance simulé (uLookPreOv), étalonnage, brume, lumières, puis voile réel
// retranché (uLookPostOv : le rectangle d'ambiance, dessiné après, le
// réappliquera). Tous les leviers à zéro = couleur inchangée, au bit près.
vec4 lookShade(vec4 c) {
  float a = c.a;
  vec3 rgb = c.rgb;
  rgb = mix(rgb, uLookPreOv.rgb * a, uLookPreOv.a);
  if (uLookGrade.x > 0.5) {
    rgb *= uLookGrade.y;
    rgb = mix(vec3(dot(rgb, LOOK_LUMA)), rgb, uLookGrade.z);
    rgb = max((rgb - uLookGrade2.x * a) * uLookGrade.w + uLookGrade2.x * a, 0.0);
    rgb *= uLookGrade2.y;
    float l = lookLuma(rgb, a);
    rgb = mix(rgb, lookMap(min(l, 1.0)) * a, uLookGrade2.z * min(1.0, a * 4.0));
    l = lookLuma(rgb, a);
    rgb += uLookShadowTint * (uLookGrade2.w * (1.0 - smoothstep(0.0, 0.45, l)) * a);
    rgb = mix(rgb, rgb * uLookHigh.rgb, uLookHigh.a * smoothstep(0.3, 1.0, l));
  }
  if (uLookFog.a > 0.0 || uLookMist.x > 0.0) {
    float fogK = clamp(uLookFog.a + uLookMist.x * smoothstep(uLookMist.y, uLookMist.z, outScreen.y / uLookMist.w), 0.0, 1.0);
    rgb = mix(rgb, uLookFog.rgb * a, fogK);
  }
  if (uLookLightCount > 0.5) rgb *= uLookAmbient.rgb + lookLights(outScreen) * uLookAmbient.a;
  else rgb *= uLookAmbient.rgb;
  if (uLookPostOv.a > 0.0) rgb = max(rgb - uLookPostOv.rgb * (uLookPostOv.a * a), 0.0) / (1.0 - uLookPostOv.a);
  return vec4(rgb, a);
}
`;

function lookShaderSources(renderer) {
  const multi = renderer.pipelines.get('MultiPipeline');
  const frag0 = multi && multi.config && multi.config.fragShader;
  const vert0 = multi && multi.config && multi.config.vertShader;
  if (!frag0 || !vert0 || frag0.indexOf('gl_FragColor = color;') < 0 || vert0.indexOf('outTintEffect = inTintEffect;') < 0) return null;
  const frag = frag0
    .replace('#define SHADER_NAME PHASER_MULTI_FS', '#define SHADER_NAME AGARICA_LOOK_FS')
    .replace('void main ()', `${LOOK_FRAG_HEAD}\nvoid main ()`)
    .replace('gl_FragColor = color;', 'gl_FragColor = lookShade(color);');
  const vert = vert0
    .replace('#define SHADER_NAME PHASER_MULTI_VS', '#define SHADER_NAME AGARICA_LOOK_VS')
    .replace('varying vec4 outTint;', 'varying vec4 outTint;\nvarying vec2 outScreen;')
    .replace('outTintEffect = inTintEffect;', 'outTintEffect = inTintEffect;\n    outScreen = inPosition;');
  return { frag, vert };
}

// État actif (une seule zone construite à la fois, cf. currentLevelScene) :
// lu par les pipelines au premier objet de chaque image.
let LOOK_CURRENT = null;
// Numéro d'image croissant sur toute la partie : un pipeline resté inutilisé
// ne peut pas croire ses uniformes à jour à cause d'un numéro d'une autre zone.
let lookStampCounter = 0;
const LOOK_PARTS = ['world', 'worldTop', 'worldBack', 'prop', 'propTop', 'back', 'backBaked'];
const LOOK_PIPE_NAME = {
  world: 'LookWorld', worldTop: 'LookWorldTop', worldBack: 'LookWorldBack', prop: 'LookProp', propTop: 'LookPropTop', back: 'LookBack', backBaked: 'LookBackBaked',
};

class LookPipeline extends Phaser.Renderer.WebGL.Pipelines.MultiPipeline {
  constructor(game, part, src) {
    super({ game, fragShader: src.frag, vertShader: src.vert });
    this.lookPart = part;
    this.lookStamp = -1;
  }

  // Appelée pour CHAQUE objet dessiné avec ce pipeline (programme déjà lié) :
  // les uniformes ne sont renvoyés qu'une fois par image.
  onBind() {
    const st = LOOK_CURRENT;
    const stamp = st ? st.stamp : -2;
    if (stamp === this.lookStamp) return;
    this.lookStamp = stamp;
    lookUploadUniforms(this, st);
  }
}

function lookUploadUniforms(pl, st) {
  const u = st && st.parts ? st.parts[pl.lookPart] : null;
  if (!u) {
    // Aucun rendu actif : shader neutre (rien ne devrait l'utiliser).
    pl.set4f('uLookGrade', 0, 1, 1, 1);
    pl.set4f('uLookPreOv', 0, 0, 0, 0);
    pl.set4f('uLookPostOv', 0, 0, 0, 0);
    pl.set4f('uLookFog', 0, 0, 0, 0);
    pl.set4f('uLookMist', 0, 0, 1, 540);
    pl.set4f('uLookAmbient', 1, 1, 1, 0);
    pl.set1f('uLookLightCount', 0);
    return;
  }
  pl.set4f('uLookGrade', u.gradeOn, u.exposure, u.sat, u.contrast);
  pl.set4f('uLookGrade2', u.pivot, u.bright, u.mapAmt, u.shadowAmt);
  pl.set3f('uLookMapLo', u.map[0][0], u.map[0][1], u.map[0][2]);
  pl.set3f('uLookMapMid', u.map[1][0], u.map[1][1], u.map[1][2]);
  pl.set3f('uLookMapHi', u.map[2][0], u.map[2][1], u.map[2][2]);
  pl.set3f('uLookShadowTint', u.shadowTint[0], u.shadowTint[1], u.shadowTint[2]);
  pl.set4f('uLookHigh', u.highTint[0], u.highTint[1], u.highTint[2], u.highAmt);
  pl.set4f('uLookPreOv', u.preOv[0], u.preOv[1], u.preOv[2], u.preOv[3]);
  pl.set4f('uLookPostOv', u.postOv[0], u.postOv[1], u.postOv[2], u.postOv[3]);
  pl.set4f('uLookFog', u.fog[0], u.fog[1], u.fog[2], u.fogAmt);
  pl.set4f('uLookMist', u.mist, u.mistBand[0], u.mistBand[1], pl.renderer.height || 540);
  pl.set4f('uLookAmbient', u.ambient[0], u.ambient[1], u.ambient[2], u.lightMul);
  const f = st.frame;
  const n = u.lightMul > 0 ? f.lightCount : 0;
  pl.set1f('uLookLightCount', n);
  if (n > 0) {
    pl.set4fv('uLookLights', f.lights);
    pl.set4fv('uLookLightCol', f.lightCols);
  }
}

// Un seul tampon de sommets pour toutes les variantes (même shader, mêmes
// attributs) : passer de l'une à l'autre ne redéclare plus les attributs, le
// poste qui coûtait le plus cher dans ces changements (0,8 ms par image mesuré
// sur puce intégrée). Le lot est vidé avant chaque changement de variante.
function lookShareVertexBuffer(renderer, pipes) {
  const gl = renderer.gl;
  const first = pipes[0];
  const locs = (pl) => pl.currentShader.attributes.map((a) => gl.getAttribLocation(pl.currentShader.program.webGLProgram, a.name)).join();
  const ref = locs(first);
  for (const pl of pipes) {
    if (pl === first || locs(pl) !== ref) continue;
    renderer.deleteBuffer(pl.vertexBuffer);
    pl.vertexBuffer = first.vertexBuffer;
    pl.activeBuffer = null;
  }
}

// Pipelines enregistrés une fois par moteur de rendu (au premier rendu
// posé : le renderer n'existe pas encore au chargement de ce fichier).
function lookEnsurePipelines(game) {
  const r = game && game.renderer;
  if (!r || !r.pipelines || !r.gl) return null;
  const pm = r.pipelines;
  if (!pm.has(LOOK_PIPE_NAME.world)) {
    const src = lookShaderSources(r);
    if (!src) {
      console.warn('LookKit : shader de lot de Phaser non reconnu, rendu de cohésion désactivé');
      return null;
    }
    for (const part of LOOK_PARTS) pm.add(LOOK_PIPE_NAME[part], new LookPipeline(game, part, src));
    lookShareVertexBuffer(r, LOOK_PARTS.map((part) => pm.get(LOOK_PIPE_NAME[part])));
  }
  const pipes = {};
  for (const part of LOOK_PARTS) pipes[part] = pm.get(LOOK_PIPE_NAME[part]);
  return pipes;
}

// ---------------------------------------------------------------------------
// Rôles
// ---------------------------------------------------------------------------
// Repli quand l'objet n'a pas de `lookRole` (posé à la création) :
// 'ui'    : HUD (parallaxe 0, profondeur >= 1000), bulles / invites / textes,
//           textures `item-ui_…` et `item-hud_…` ;
// 'back'  : ce qui défile à moins de 0,5 sous la profondeur 100 ;
// 'prop'  : textures de décor (`decor-…`, `prop-…`, `item-decor_…`, lianes), props ;
// 'world' : le reste (sol, personnages, effets).
function lookAutoRole(o) {
  const d = o.depth;
  const sf = o.scrollFactorX;
  if (d >= 1000 && sf === 0) return 'ui';
  if (d >= 1045) return 'ui';
  if (o.type === 'Text' || o.type === 'BitmapText') return 'ui';
  if (d >= 1030 && o.type === 'Container') return 'ui';
  if (d < 100 && sf < 0.5) return 'back';
  if (o.propType) return 'prop';
  const k = lookTexKey(o);
  // Signes d'interface posés dans le monde (« ! » de Kainati, étoiles) : nets.
  if (k.startsWith('item-ui_') || k.startsWith('item-hud_')) return 'ui';
  if (k.startsWith('decor-') || k.startsWith('prop-') || k.startsWith('item-decor_')) return 'prop';
  // Lianes : des plantes, gardées au gamma d'origine comme les autres décors
  // (posées par entities/Liane.js, sans rôle explicite).
  if (k === 'item-liane') return 'prop';
  return 'world';
}

function lookRoleOf(o) {
  return (o && LOOK_ROLES.includes(o.lookRole) && o.lookRole) || lookAutoRole(o);
}

// ---------------------------------------------------------------------------
// Uniformes par variante (calculés à l'attache)
// ---------------------------------------------------------------------------
function lookBuildParts(st) {
  const cfg = st.cfg;
  const g = cfg.grade || LOOK_DEFAULTS.grade;
  const b = cfg.back || null;
  const L = cfg.lights || null;
  const ov = st.overlay;
  const zero4 = [0, 0, 0, 0];
  const neutral = {
    gradeOn: 0, exposure: 1, sat: 1, contrast: 1, pivot: 0.3, bright: 1, mapAmt: 0, shadowAmt: 0,
    map: [[0, 0, 0], [0.5, 0.5, 0.5], [1, 1, 1]], shadowTint: [0, 0, 0], highTint: [1, 1, 1], highAmt: 0,
    preOv: zero4, postOv: zero4, fog: [0, 0, 0], fogAmt: 0, mist: 0, mistBand: [0.42, 0.86],
    ambient: [1, 1, 1], lightMul: 0,
  };
  const graded = cfg.grade ? {
    gradeOn: 1, exposure: g.exposure ?? 1, sat: g.sat ?? 1, contrast: g.contrast ?? 1, pivot: g.pivot ?? 0.3, bright: 1,
    mapAmt: g.mapAmt ?? 0, shadowAmt: g.shadowAmt ?? 0,
    map: (g.map || LOOK_DEFAULTS.grade.map).map(lookRgb), shadowTint: lookRgb(g.shadowTint ?? 0),
    highTint: g.highTint || [1, 1, 1], highAmt: g.highAmt ?? 0,
  } : {};
  const ambient = cfg.grade && g.ambient ? g.ambient : [1, 1, 1];
  const lightsOn = !!L;
  // Voile : couleur et alphas (d'origine / posé par le rendu).
  const ovPre = (alpha) => (ov ? [ov.rgb[0], ov.rgb[1], ov.rgb[2], alpha] : zero4);
  const parts = {
    // Plan de jeu sous le voile : voile simulé à l'alpha posé, étalonnage,
    // lumières, voile retranché (le rectangle le réapplique) = ordre du
    // prototype (étalonnage APRÈS le voile).
    world: { ...neutral, ...graded, ambient, lightMul: lightsOn ? 1 : 0, preOv: ovPre(ov ? ov.alpha : 0), postOv: ovPre(ov ? ov.alpha : 0) },
    worldTop: { ...neutral, ...graded, ambient, lightMul: lightsOn ? 1 : 0 },
    // Sol de second plan (groundBackCells) : étalonné comme le sol de jeu, puis
    // assombri APRÈS le contraste. Sa teinte d'origine (0x404040) passerait
    // sous le seuil du contraste : un aplat noir sans texture, pas un plan.
    worldBack: {
      ...neutral, ...graded, ambient, lightMul: lightsOn ? 1 : 0,
      // Actif même sans `grade` : sa teinte sombre est retirée, seul ceci l'assombrit.
      gradeOn: 1, bright: cfg.tiles === false ? 1 : (cfg.tiles.backBright ?? 0.55),
      preOv: ovPre(ov ? ov.alpha : 0), postOv: ovPre(ov ? ov.alpha : 0),
    },
    // Décors sous le voile : voile D'ORIGINE simulé, lumières (ambiance 1 :
    // jamais d'assombrissement), voile posé retranché => sous le rectangle,
    // la couleur d'avant au bit près (loin des lumières).
    prop: { ...neutral, lightMul: lightsOn ? (L.propMul ?? 1) : 0, preOv: ovPre(ov ? ov.alpha0 : 0), postOv: ovPre(ov ? ov.alpha : 0) },
    propTop: { ...neutral, lightMul: lightsOn ? (L.propMul ?? 1) : 0 },
    back: { ...neutral },
    backBaked: { ...neutral },
  };
  if (b) {
    const backCommon = {
      mist: b.mist ?? 0, mistBand: b.mistBand || [0.42, 0.86], fog: lookRgb(b.fog ?? 0),
      lightMul: lightsOn ? (b.lightMul ?? 0) : 0,
    };
    // Fonds non précalculables (dessins, formes, animations) : tout dans le shader.
    Object.assign(parts.back, backCommon, {
      gradeOn: 1, exposure: 1, sat: b.sat ?? 1, contrast: b.contrast ?? 1, pivot: 0.5, bright: b.bright ?? 1,
      fogAmt: b.fogAmt ?? 0,
    });
    // Fonds précalculés : flou, couleur et brume uniforme déjà dans la
    // texture ; il reste la brume du bas d'écran et la lumière.
    Object.assign(parts.backBaked, backCommon, { fogAmt: 0 });
  }
  st.parts = parts;
}

// ---------------------------------------------------------------------------
// Fonds précalculés (flou + désaturation + valeur + brume uniforme)
// ---------------------------------------------------------------------------
let lookCanvasFilterOk = null;
function lookCanvasFilterSupported() {
  if (lookCanvasFilterOk != null) return lookCanvasFilterOk;
  try {
    const c = document.createElement('canvas');
    c.width = 3;
    c.height = 1;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    const s = document.createElement('canvas');
    s.width = 3;
    s.height = 1;
    const sctx = s.getContext('2d');
    sctx.fillStyle = '#fff';
    sctx.fillRect(1, 0, 1, 1);
    ctx.filter = 'blur(1px)';
    ctx.drawImage(s, 0, 0);
    // Flou réellement appliqué : le blanc a bavé sur le pixel voisin.
    lookCanvasFilterOk = ctx.getImageData(0, 0, 1, 1).data[3] > 0;
  } catch (e) {
    lookCanvasFilterOk = false;
  }
  return lookCanvasFilterOk;
}

function lookBakeable(o) {
  if (o.type !== 'Image' && o.type !== 'TileSprite') return false;
  const k = lookTexKey(o);
  if (!k || k.indexOf('autotile') >= 0 || k.endsWith(LOOK_BAKE_SUFFIX) || k === '__DEFAULT' || k === '__MISSING') return false;
  const fr = o.type === 'TileSprite' ? o.displayFrame : o.frame;
  if (!fr || fr.trimmed || !fr.source || !fr.source.image) return false;
  const src = fr.source;
  if (src.isCanvas || src.isRenderTexture || src.isGLTexture || src.isVideo) return false;
  return fr.cutWidth > 0 && fr.cutHeight > 0 && fr.cutWidth <= LOOK_BAKE_MAX_SIDE && fr.cutHeight <= LOOK_BAKE_MAX_SIDE;
}

// Échelle d'affichage (px d'écran par px de texture) : le flou est donné en
// px d'ÉCRAN, comme dans le prototype.
function lookDisplayScale(o) {
  if (o.type === 'TileSprite') return Math.abs((o.tileScaleX || 1) * (o.scaleX || 1));
  return Math.abs(o.scaleX || 1);
}

function lookBakeObject(st, o) {
  const b = st.cfg.back;
  const isTile = o.type === 'TileSprite';
  const fr = isTile ? o.displayFrame : o.frame;
  const scale = Math.max(0.05, lookDisplayScale(o));
  // Flou en px de texture, arrondi au demi-pixel (précalculs partagés entre
  // objets d'échelles voisines : arbres et lianes du fond).
  const blur = st.canBlur ? Math.round(((b.blur || 0) / scale) * 2) / 2 : 0;
  const origKey = fr.texture.key;
  const key = `${origKey}${isTile ? '~t' : ''}~${fr.name}~${blur}${LOOK_BAKE_SUFFIX}`;
  if (!st.bakes.has(key)) {
    const t0 = performance.now();
    st.bakes.set(key, lookBakeTexture(st, key, fr, blur, isTile));
    const ms = performance.now() - t0;
    st.bakeMs += ms;
    if (ms > st.bakeMaxMs) st.bakeMaxMs = ms;
  }
  const baked = st.bakes.get(key);
  if (!baked) return false;
  const frameName = fr.name;
  if (isTile) {
    // TileSprite : Phaser recopie l'image dans un motif (canevas puissance
    // de 2, rééchantillonné par le navigateur) puis l'envoie à la carte
    // graphique. Refaire ce motif au détachement ne redonne pas exactement
    // les mêmes pixels : on garde donc le motif d'origine de côté et on le
    // remet tel quel (option désactivée = pixels identiques à avant).
    const renderer = st.scene.game.renderer;
    const saved = { tex: o.displayTexture, frame: o.displayFrame, pattern: o.fillPattern, potW: o.potWidth, potH: o.potHeight };
    o.fillPattern = null;
    o.setTexture(baked);
    const bakedPattern = o.fillPattern;
    st.restore.push(() => {
      if (o.scene) {
        o.displayTexture = saved.tex;
        o.displayFrame = saved.frame;
        o.potWidth = saved.potW;
        o.potHeight = saved.potH;
        o.fillPattern = saved.pattern;
        o.dirty = false;
        if (bakedPattern && bakedPattern !== saved.pattern) renderer.deleteTexture(bakedPattern);
      } else if (saved.pattern && saved.pattern !== bakedPattern) {
        // Objet détruit avec la scène : Phaser a libéré le motif précalculé,
        // le motif d'origine gardé de côté doit l'être aussi.
        renderer.deleteTexture(saved.pattern);
      }
    });
    return true;
  }
  st.restore.push(() => {
    if (o.scene) o.setTexture(origKey, frameName);
  });
  o.setTexture(baked);
  return true;
}

function lookAddBakedTexture(st, key, canvas, fr) {
  const textures = st.scene.textures;
  if (textures.exists(key)) textures.remove(key);
  const tex = textures.addCanvas(key, canvas);
  if (!tex) return null;
  // Même filtrage que l'image d'origine.
  const fm = fr.source.scaleMode;
  if (fm != null) tex.setFilter(fm);
  st.bakedKeys.push(key);
  return key;
}

function lookBakeTexture(st, key, fr, blur, wrap) {
  const b = st.cfg.back;
  try {
    const img = fr.source.image;
    const w = fr.cutWidth;
    const h = fr.cutHeight;
    const pad = blur > 0 ? Math.ceil(blur * 3) + 1 : 0;
    // 1) Image + marges : bords répétés (image en boucle d'un TileSprite) ou
    // prolongés (image seule), pour que le flou ne fonde pas les bords en
    // transparence (couture visible d'une tuile de fond à l'autre).
    const padded = document.createElement('canvas');
    padded.width = w + pad * 2;
    padded.height = h + pad * 2;
    const pc = padded.getContext('2d');
    const sx = fr.cutX;
    const sy = fr.cutY;
    pc.imageSmoothingEnabled = false;
    pc.drawImage(img, sx, sy, w, h, pad, pad, w, h);
    if (pad > 0) {
      if (wrap) {
        // Bandes du côté opposé (image en boucle) : seulement `pad` px de
        // large, pas l'image entière 8 fois (fond lointain de 2079 px).
        const p = Math.min(pad, w, h);
        const x1 = sx + w - p;
        const y1 = sy + h - p;
        pc.drawImage(img, sx, y1, w, p, pad, pad - p, w, p);
        pc.drawImage(img, sx, sy, w, p, pad, pad + h, w, p);
        pc.drawImage(img, x1, sy, p, h, pad - p, pad, p, h);
        pc.drawImage(img, sx, sy, p, h, pad + w, pad, p, h);
        pc.drawImage(img, x1, y1, p, p, pad - p, pad - p, p, p);
        pc.drawImage(img, sx, y1, p, p, pad + w, pad - p, p, p);
        pc.drawImage(img, x1, sy, p, p, pad - p, pad + h, p, p);
        pc.drawImage(img, sx, sy, p, p, pad + w, pad + h, p, p);
      } else {
        // Rangées / colonnes du bord étirées, coins compris.
        const x1 = sx + w - 1;
        const y1 = sy + h - 1;
        pc.drawImage(img, sx, sy, w, 1, pad, 0, w, pad);
        pc.drawImage(img, sx, y1, w, 1, pad, pad + h, w, pad);
        pc.drawImage(img, sx, sy, 1, h, 0, pad, pad, h);
        pc.drawImage(img, x1, sy, 1, h, pad + w, pad, pad, h);
        pc.drawImage(img, sx, sy, 1, 1, 0, 0, pad, pad);
        pc.drawImage(img, x1, sy, 1, 1, pad + w, 0, pad, pad);
        pc.drawImage(img, sx, y1, 1, 1, 0, pad + h, pad, pad);
        pc.drawImage(img, x1, y1, 1, 1, pad + w, pad + h, pad, pad);
      }
    }
    // 2) Flou (filtre du canevas, une seule opération), recadré.
    const sat = b.sat ?? 1;
    const con = b.contrast ?? 1;
    const bright = b.bright ?? 1;
    const fogAmt = b.fogAmt ?? 0;
    const out = document.createElement('canvas');
    out.width = w;
    out.height = h;
    const fast = st.canBlur;
    const oc = out.getContext('2d', fast ? undefined : { willReadFrequently: true });
    let src = padded;
    if (pad > 0) {
      src = document.createElement('canvas');
      src.width = padded.width;
      src.height = padded.height;
      const bc = src.getContext('2d');
      bc.filter = `blur(${blur}px)`;
      bc.drawImage(padded, 0, 0);
    }
    if (fast) {
      // 3) Couleur par les filtres du canevas (même ordre et mêmes formules
      // que le shader des fonds : saturation -> contraste autour de 0,5 ->
      // valeur), puis brume uniforme posée « par-dessus » (source-atop =
      // seulement là où l'image est opaque, comme mix(rgb, fog * a, k)).
      // Rien n'est relu sur le processeur : rapide, et le canevas reste
      // sur la carte graphique.
      oc.filter = `saturate(${sat}) contrast(${con}) brightness(${bright})`;
      oc.drawImage(src, pad, pad, w, h, 0, 0, w, h);
      oc.filter = 'none';
      if (fogAmt > 0) {
        const f = lookRgb(b.fog ?? 0).map((c) => Math.round(c * 255));
        oc.globalCompositeOperation = 'source-atop';
        oc.fillStyle = `rgba(${f[0]},${f[1]},${f[2]},${fogAmt})`;
        oc.fillRect(0, 0, w, h);
        oc.globalCompositeOperation = 'source-over';
      }
      return lookAddBakedTexture(st, key, out, fr);
    }
    oc.drawImage(src, pad, pad, w, h, 0, 0, w, h);
    // 3) (repli sans filtres de canevas) Couleur pixel par pixel.
    const id = oc.getImageData(0, 0, w, h);
    const d = id.data;
    const fog = lookRgb(b.fog ?? 0).map((c) => c * 255);
    const LR = 0.2126;
    const LG = 0.7152;
    const LB = 0.0722;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] === 0) continue;
      let r = d[i];
      let g = d[i + 1];
      let bl = d[i + 2];
      const l = LR * r + LG * g + LB * bl;
      r = l + (r - l) * sat;
      g = l + (g - l) * sat;
      bl = l + (bl - l) * sat;
      r = ((r - 127.5) * con + 127.5) * bright;
      g = ((g - 127.5) * con + 127.5) * bright;
      bl = ((bl - 127.5) * con + 127.5) * bright;
      r += (fog[0] - r) * fogAmt;
      g += (fog[1] - g) * fogAmt;
      bl += (fog[2] - bl) * fogAmt;
      d[i] = r < 0 ? 0 : r > 255 ? 255 : r;
      d[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
      d[i + 2] = bl < 0 ? 0 : bl > 255 ? 255 : bl;
    }
    oc.putImageData(id, 0, 0);
    return lookAddBakedTexture(st, key, out, fr);
  } catch (e) {
    // Page ouverte en fichier (file://) : pixels illisibles, le fond passe
    // par le shader (sans flou) plutôt que de casser le rendu.
    if (!st.bakeWarned) {
      st.bakeWarned = true;
      console.warn('[look] fonds non précalculés (page en file:// ?)', e && e.name);
    }
    return null;
  }
}

// ---------------------------------------------------------------------------
// Tuiles : ré-étalonnage des textures (une fois par entrée de zone) et teintes
// ---------------------------------------------------------------------------
function lookTilesetOf(key) {
  const i = key.indexOf(':');
  if (i > 0) {
    const id = key.slice(0, i);
    if (typeof TILESET_MANIFEST !== 'undefined' && TILESET_MANIFEST[id]) return id;
  }
  return typeof AUTOTILE_TILESET !== 'undefined' ? AUTOTILE_TILESET : 'tuiles';
}

function lookTileSettings(st, tileset) {
  const base = LOOK_TILESETS[tileset] || LOOK_TILESETS.tuiles;
  return lookMerge(lookMerge({}, base), st.cfg.tiles || {});
}

// Bande de teinte d'un pixel : 'green', 'keep' ou 'warm'.
function lookTileBand(h, tg) {
  const keep = tg.keep;
  if (keep && h >= keep[0] && h < keep[1]) return 'keep';
  const gr = tg.greenRange || [60, 200];
  return h > gr[0] && h < gr[1] ? 'green' : 'warm';
}

function lookPixelHue(r, g, b) {
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const dd = mx - mn;
  let hh;
  if (mx === r) hh = ((g - b) / dd + 6) % 6;
  else if (mx === g) hh = (b - r) / dd + 2;
  else hh = (r - g) / dd + 4;
  return hh * 60;
}

// Pixels RGBA (non prémultipliés) en TSL : chaque bande a son réglage
// (teinte visée et part du chemin, saturation ×, luminosité ×, contraste
// interne autour de `pivot` = luminosité moyenne de la terre du jeu) ; les
// gris purs (contours noirs) et la bande `keep` ne bougent pas.
function lookGradeTilePixels(d, tg, pivot) {
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    const r = d[i] / 255;
    const g = d[i + 1] / 255;
    const b = d[i + 2] / 255;
    const mx = Math.max(r, g, b);
    const mn = Math.min(r, g, b);
    const dd = mx - mn;
    if (dd < 1e-4) continue;
    const h = lookPixelHue(r, g, b);
    const bandName = lookTileBand(h, tg);
    if (bandName === 'keep') continue;
    const band = tg[bandName];
    if (!band) continue;
    const l = (mx + mn) / 2;
    const s = dd / (1 - Math.abs(2 * l - 1));
    const dh = ((band.hue - h + 540) % 360) - 180;
    const h2 = (h + dh * (band.hueAmt ?? 0) + 360) % 360;
    const s2 = Math.min(1, s * (band.sat ?? 1));
    // Contraste réduit, sauf sur les contours très sombres (silhouette des
    // tuiles gardée nette).
    const kc = Phaser.Math.Clamp((l - 0.05) / 0.07, 0, 1);
    const lc = band.contrast != null && pivot != null ? l + (pivot + (l - pivot) * band.contrast - l) * kc : l;
    const l2 = Phaser.Math.Clamp(lc * (band.light ?? 1), 0, 1);
    const c = (1 - Math.abs(2 * l2 - 1)) * s2;
    const x = c * (1 - Math.abs(((h2 / 60) % 2) - 1));
    const m = l2 - c / 2;
    const k = Math.floor(h2 / 60) % 6;
    const rgb6 = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][k];
    d[i] = Math.round((rgb6[0] + m) * 255);
    d[i + 1] = Math.round((rgb6[1] + m) * 255);
    d[i + 2] = Math.round((rgb6[2] + m) * 255);
  }
}

// Textures du jeu de tuiles redessinées dans la MÊME texture WebGL (même clé,
// mêmes cadres, mêmes filtres) : rien ne change pour le jeu (cartes d'alpha
// lues sur l'image d'origine) ; l'image d'origine est renvoyée au détachement.
function lookGradeTileTextures(st, keys) {
  const groups = new Map();
  for (const key of keys) {
    const ts = lookTilesetOf(key);
    if (!groups.has(ts)) groups.set(ts, []);
    groups.get(ts).push(key);
  }
  for (const [ts, list] of groups) {
    const set = lookTileSettings(st, ts);
    const tg = set.grade;
    if (!tg) continue;
    const items = [];
    let lSum = 0;
    let lCount = 0;
    for (const key of list) {
      if (!st.scene.textures.exists(key) || st.gradedTiles.has(key)) continue;
      const src = st.scene.textures.get(key).source[0];
      const gt = src && src.glTexture;
      if (!gt || typeof gt.update !== 'function' || !src.image || src.isCanvas || src.isRenderTexture) continue;
      const w = src.width;
      const h = src.height;
      const cv = document.createElement('canvas');
      cv.width = w;
      cv.height = h;
      const ctx = cv.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(src.image, 0, 0);
      const img = ctx.getImageData(0, 0, w, h);
      const d = img.data;
      // Luminosité moyenne de la terre sur TOUT le jeu : même pivot de
      // contraste pour chaque case (les cases voisines restent raccord).
      for (let i = 0; i < d.length; i += 16) {
        if (d[i + 3] === 0) continue;
        const r = d[i] / 255;
        const g = d[i + 1] / 255;
        const b = d[i + 2] / 255;
        const mx = Math.max(r, g, b);
        const mn = Math.min(r, g, b);
        if (mx === mn || lookTileBand(lookPixelHue(r, g, b), tg) !== 'warm') continue;
        lSum += (mx + mn) / 2;
        lCount++;
      }
      items.push({ key, src, gt, w, h, cv, ctx, img });
    }
    // Pivot gardé par jeu : une case posée plus tard (script, sol qui revient)
    // doit rester raccord avec celles de l'entrée de zone.
    if (st.tilePivots[ts] == null) st.tilePivots[ts] = lCount ? lSum / lCount : 0.3;
    const pivot = st.tilePivots[ts];
    for (const { key, src, gt, w, h, cv, ctx, img } of items) {
      lookGradeTilePixels(img.data, tg, pivot);
      ctx.putImageData(img, 0, 0);
      const saved = {
        pixels: gt.pixels || src.image, flipY: gt.flipY, wrapS: gt.wrapS, wrapT: gt.wrapT,
        minFilter: gt.minFilter, magFilter: gt.magFilter, format: gt.format,
      };
      gt.update(cv, w, h, saved.flipY, saved.wrapS, saved.wrapT, saved.minFilter, saved.magFilter, saved.format);
      st.gradedTiles.add(key);
      st.textureRestore.push(() => {
        gt.update(saved.pixels, w, h, saved.flipY, saved.wrapS, saved.wrapT, saved.minFilter, saved.magFilter, saved.format);
      });
    }
  }
}

// Teinte d'une image de tuile (lookTile : 'body' | 'grass' | 'blob' | 'back').
// Sol de second plan : même teinte que la case équivalente du sol de jeu (son
// assombrissement passe par la variante 'worldBack', pas par sa teinte).
function lookTintTile(st, o) {
  if (!o.setTint || !o.lookTile) return;
  const key = lookTexKey(o);
  const tints = lookTileSettings(st, lookTilesetOf(key)).tint || {};
  const isBack = o.lookTile === 'back';
  let tint = tints[o.lookTile];
  if (isBack) {
    if (key.startsWith('autotile-atlas-')) tint = key.includes('grass') ? tints.grass : tints.body;
    else tint = tints.blob;
  } else if (tint == null) return;
  const prev = { isTinted: o.isTinted, tl: o.tintTopLeft, tr: o.tintTopRight, bl: o.tintBottomLeft, br: o.tintBottomRight };
  if (isBack && tint == null) o.clearTint();
  else o.setTint(tint);
  st.restore.push(() => {
    if (!o.scene) return;
    if (prev.isTinted) o.setTint(prev.tl, prev.tr, prev.bl, prev.br); else o.clearTint();
  });
}

// ---------------------------------------------------------------------------
// Sol sous un point (ombres de contact) : colonnes de 64 px -> hauts des corps.
// ---------------------------------------------------------------------------
function lookBuildGroundColumns(scene) {
  const cols = new Map();
  const add = (left, right, top) => {
    for (let c = Math.floor(left / 64); c <= Math.floor((right - 1) / 64); c++) {
      if (!cols.has(c)) cols.set(c, []);
      cols.get(c).push({ left, right, top });
    }
  };
  if (scene.ground && scene.ground.children) {
    scene.ground.children.iterate((t) => {
      if (t && t.active && t.body) add(t.body.left, t.body.right, t.body.top);
    });
  }
  return cols;
}

function lookGroundBelow(st, x, feetY, tol = 6) {
  const list = st.columns.get(Math.floor(x / 64));
  let best = null;
  if (list) {
    for (const s of list) {
      if (x < s.left || x > s.right || s.top < feetY - tol) continue;
      if (best === null || s.top < best) best = s.top;
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Textures générées (une fois par partie, partagées par toutes les zones)
// ---------------------------------------------------------------------------
function lookShadowKey(scene) {
  if (scene.textures.exists('item-fx_ombre_sol')) return 'item-fx_ombre_sol';
  if (!scene.textures.exists(LOOK_SHADOW_FALLBACK_KEY)) {
    const t = scene.textures.createCanvas(LOOK_SHADOW_FALLBACK_KEY, 128, 44);
    const ctx = t.getContext();
    ctx.save();
    ctx.scale(1, 44 / 128);
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(14,6,20,1)');
    g.addColorStop(0.6, 'rgba(14,6,20,0.55)');
    g.addColorStop(1, 'rgba(14,6,20,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    ctx.restore();
    t.refresh();
  }
  return LOOK_SHADOW_FALLBACK_KEY;
}

// Halo additif d'une lumière : profil (1 - d²/r²)^4, celui du prototype.
function lookGlowKey(scene) {
  if (!scene.textures.exists(LOOK_GLOW_KEY)) {
    const S = 128;
    const t = scene.textures.createCanvas(LOOK_GLOW_KEY, S, S);
    const ctx = t.getContext();
    const id = ctx.createImageData(S, S);
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const dx = (x + 0.5) / (S / 2) - 1;
        const dy = (y + 0.5) / (S / 2) - 1;
        const f = Math.max(0, 1 - (dx * dx + dy * dy));
        const i = (y * S + x) * 4;
        id.data[i] = 255;
        id.data[i + 1] = 255;
        id.data[i + 2] = 255;
        id.data[i + 3] = Math.round(255 * f * f * f * f);
      }
    }
    ctx.putImageData(id, 0, 0);
    t.refresh();
  }
  return LOOK_GLOW_KEY;
}

// ---------------------------------------------------------------------------
// Attache / détache
// ---------------------------------------------------------------------------
// `data` : donnée de zone (null : la dernière connue de la scène, cf.
// lookSetEnabled). Sans clé `look`, option désactivée ou rendu Canvas : rien.
function lookAttach(scene, data) {
  if (!scene || !scene.sys) return null;
  if (data) scene.__lookData = data;
  else data = scene.__lookData;
  lookDetach(scene);
  if (!data || !data.look || !lookEnabled()) return null;
  const cfg = lookResolveConfig(data);
  if (!cfg) return null;
  const t0 = performance.now();
  const pipes = lookEnsurePipelines(scene.game);
  if (!pipes) return null;
  const main = scene.cameras.main;
  const st = {
    scene, cfg, main, pipes, stamp: ++lookStampCounter, frameNo: -1,
    pipeSet: new Set(Object.values(pipes)),
    defaults: new Set([scene.game.renderer.pipelines.get('MultiPipeline'), scene.game.renderer.pipelines.get('MobilePipeline')].filter(Boolean)),
    restore: [], textureRestore: [], bakes: new Map(), bakedKeys: [], bakeMs: 0, bakeMaxMs: 0, gradedTiles: new Set(), tilePivots: {},
    canBlur: lookCanvasFilterSupported(),
    dimmed: [], rims: new Map(), shadows: new Map(), plateaus: new Map(), glows: [], chars: [], charsAt: -1, fresh: [], scanIn: 0,
    staticLights: [], flies: [], lightScanAt: 0, lightWorld: [],
    frame: {
      lightCount: 0, lights: new Float32Array(4 * LOOK_MAX_LIGHTS), lightCols: new Float32Array(4 * LOOK_MAX_LIGHTS),
    },
    overlay: null, ovDepth: -Infinity,
    handlers: [],
  };
  scene.__look = st;
  LOOK_CURRENT = st;

  // Voile d'ambiance réduit (cf. en-tête) ; les variantes « sous le voile »
  // compensent. Sans voile : toutes les variantes « au-dessus ».
  const ovObj = scene.ambientOverlay;
  if (ovObj && ovObj.active && ovObj.fillAlpha > 0 && ovObj.fillAlpha < 0.98) {
    const a0 = ovObj.fillAlpha;
    const k = Phaser.Math.Clamp(cfg.overlay ?? 1, 0, 1);
    st.overlay = { obj: ovObj, alpha0: a0, alpha: a0 * k, rgb: lookRgb(ovObj.fillColor) };
    st.ovDepth = ovObj.depth;
    if (k !== 1) {
      ovObj.fillAlpha = a0 * k;
      st.restore.push(() => { if (ovObj.scene) ovObj.fillAlpha = a0; });
    }
  }
  lookBuildParts(st);
  st.times = { pipelines: +(performance.now() - t0).toFixed(1) };
  const t1 = performance.now();

  // Tuiles : textures du jeu de la zone ré-étalonnées (celles réellement
  // posées), puis teintes par image (cf. lookFirstSeen).
  if (cfg.tiles !== false) {
    const keys = new Set();
    const visit = (o) => { if (o.lookTile && o.texture) keys.add(o.texture.key); };
    for (const o of scene.children.list) visit(o);
    try {
      lookGradeTileTextures(st, keys);
    } catch (e) {
      console.warn('[look] ré-étalonnage des tuiles impossible (page en file:// ?)', e && e.name);
    }
  }

  st.times.tiles = +(performance.now() - t1).toFixed(1);
  st.columns = lookBuildGroundColumns(scene);
  lookScanStaticLights(scene, st);
  if (cfg.lights && (cfg.lights.glow || 0) > 0) {
    const key = lookGlowKey(scene);
    for (let i = 0; i < LOOK_MAX_LIGHTS; i++) {
      const g = scene.add.image(0, 0, key).setBlendMode(Phaser.BlendModes.ADD).setDepth(LOOK_GLOW_DEPTH).setVisible(false);
      g.lookRole = 'ui';
      g.__lookCopy = true;
      st.glows.push(g);
    }
  }

  // Caméra principale : lumières calculées une fois sa position de l'image
  // connue (suivi appliqué dans son preRender), pas une image en retard.
  const basePre = Phaser.Cameras.Scene2D.Camera.prototype.preRender;
  main.preRender = function () {
    basePre.call(this);
    lookComputeFrame(scene, st);
  };
  const onPreRender = () => lookScan(scene, st);
  const onPostUpdate = () => lookPostUpdate(scene, st);
  const onShutdown = () => lookDetach(scene);
  const onAdded = (o) => { st.fresh.push(o); };
  scene.events.on('prerender', onPreRender);
  scene.events.on('postupdate', onPostUpdate);
  scene.events.on('addedtoscene', onAdded);
  scene.events.once('shutdown', onShutdown);
  scene.events.once('destroy', onShutdown);
  st.handlers.push(['prerender', onPreRender], ['postupdate', onPostUpdate], ['addedtoscene', onAdded], ['shutdown', onShutdown], ['destroy', onShutdown]);
  // Tout de suite : l'attache peut se faire scène en pause (menu Options), où
  // ni la mise à jour ni donc les ombres et liserés ne tourneraient.
  lookPostUpdate(scene, st);
  lookScan(scene, st);
  st.attachMs = performance.now() - t0;
  return st;
}

function lookDetach(scene) {
  const st = scene && scene.__look;
  if (!st) return;
  scene.__look = null;
  if (LOOK_CURRENT === st) LOOK_CURRENT = null;
  for (const [ev, fn] of st.handlers) scene.events.off(ev, fn);
  const main = st.main;
  if (main && Object.prototype.hasOwnProperty.call(main, 'preRender')) delete main.preRender;
  // Objets (s'ils existent encore : à l'arrêt de la scène, la liste
  // d'affichage est déjà vidée) : textures, teintes, alphas, pipelines.
  for (let i = st.restore.length - 1; i >= 0; i--) {
    try { st.restore[i](); } catch (e) { /* objet détruit entre-temps */ }
  }
  for (const d of st.dimmed) {
    if (d.o.scene) d.o.alpha = d.base;
    d.o.__lookBaseAlpha = null;
  }
  for (const copies of st.rims.values()) for (const c of copies) c.destroy();
  for (const s of st.shadows.values()) s.destroy();
  for (const g of st.glows) g.destroy();
  if (scene.sys && scene.sys.displayList) {
    const reset = (o) => {
      if (st.pipeSet.has(o.pipeline)) o.pipeline = o.__lookPipe0 || o.defaultPipeline;
      // Pas de `delete` : l'objet passerait en mode lent, tous ses accès aussi.
      o.__lookSt = null;
      if (o.type === 'Container' && o.list) for (const c of o.list) reset(c);
    };
    for (const o of scene.sys.displayList.list) reset(o);
  }
  // Textures (toujours, objets détruits ou non).
  for (const fn of st.textureRestore) {
    try { fn(); } catch (e) { /* contexte perdu */ }
  }
  for (const key of st.bakedKeys) if (scene.textures.exists(key)) scene.textures.remove(key);
  st.bakedKeys.length = 0;
}

// ---------------------------------------------------------------------------
// À chaque image
// ---------------------------------------------------------------------------
// Rôle et variante de shader de chaque objet de la liste d'affichage (et des
// enfants des conteneurs). Toute la liste (jusqu'à 2 000 objets, cases de
// collision comprises) tous les LOOK_SCAN_FRAMES seulement : un objet ne change
// presque jamais de rôle ; les objets créés entre-temps sont vus dès leur
// première image (événement 'addedtoscene').
function lookScan(scene, st) {
  if (scene.__look !== st) return;
  st.stamp = ++lookStampCounter;
  const fresh = st.fresh;
  if (--st.scanIn <= 0) {
    st.scanIn = LOOK_SCAN_FRAMES;
    const list = scene.sys.displayList.list;
    for (let i = 0; i < list.length; i++) lookVisit(st, list[i], null, list[i].depth);
    fresh.length = 0;
  } else if (fresh.length) {
    for (let i = 0; i < fresh.length; i++) {
      if (fresh[i].displayList) lookVisit(st, fresh[i], null, fresh[i].depth);
    }
    fresh.length = 0;
  }
}

// Rôle gardé sur l'objet tant que ce dont il dépend ne change pas (rôle posé,
// profondeur, texture) : le classement automatique lit des chaînes, et il
// tournerait sinon à chaque image pour chaque objet.
function lookRoleCached(o, inherited) {
  if (o.__lookRcOwn !== o.lookRole || o.__lookRcInh !== inherited || o.__lookRcDepth !== o.depth || o.__lookRcTex !== o.texture || !o.__lookRc) {
    o.__lookRcOwn = o.lookRole;
    o.__lookRcInh = inherited;
    o.__lookRcDepth = o.depth;
    o.__lookRcTex = o.texture;
    o.__lookRcOwnValid = LOOK_ROLES.includes(o.lookRole) ? o.lookRole : null;
    o.__lookRc = o.__lookRcOwnValid || inherited || lookAutoRole(o);
  }
  return o.__lookRc;
}

function lookVisit(st, o, inherited, depth) {
  const role = lookRoleCached(o, inherited);
  if (o.__lookSt !== st) {
    o.__lookSt = st;
    lookFirstSeen(st, o, role);
  }
  if (o.type === 'Container') {
    if (role === 'ui' || !o.list) return;
    const pass = o.__lookRcOwnValid || inherited;
    for (let i = 0; i < o.list.length; i++) lookVisit(st, o.list[i], pass, depth);
    return;
  }
  const cur = o.pipeline;
  if (!cur) return;
  let target = null;
  if (role === 'world') {
    if (o.lookTile === 'back' && st.cfg.tiles !== false) target = st.pipes.worldBack;
    else target = depth < st.ovDepth ? st.pipes.world : st.pipes.worldTop;
  } else if (role === 'prop') {
    target = depth < st.ovDepth ? st.pipes.prop : st.pipes.propTop;
  } else if (role === 'back') {
    // `back: false` : fonds au gamma d'origine (mêmes variantes que les décors,
    // qui compensent le voile réduit), jamais l'étalonnage du plan de jeu.
    if (st.cfg.back) target = o.__lookBaked === st ? st.pipes.backBaked : st.pipes.back;
    else target = depth < st.ovDepth ? st.pipes.prop : st.pipes.propTop;
  }
  if (target === cur) return;
  if (target === null) {
    // Devenu 'ui' (rôle changé en cours de route) : pipeline d'origine.
    if (st.pipeSet.has(cur)) o.pipeline = o.__lookPipe0 || o.defaultPipeline;
    return;
  }
  // Jamais un pipeline posé par le jeu (effets, Light2D...) : seulement le
  // pipeline par défaut ou les nôtres.
  if (st.defaults.has(cur)) {
    o.__lookPipe0 = cur;
    o.pipeline = target;
  } else if (st.pipeSet.has(cur)) {
    o.pipeline = target;
  }
}

// Préparation unique d'un objet (à l'attache, ou à sa première image s'il
// est créé plus tard) : fond précalculé, teinte de tuile, alpha atténué.
function lookFirstSeen(st, o, role) {
  const cfg = st.cfg;
  if (role === 'back') {
    if (cfg.back && lookBakeable(o) && lookBakeObject(st, o)) o.__lookBaked = st;
    return;
  }
  if (role !== 'world') return;
  if (o.lookTile && cfg.tiles !== false) {
    // Case posée après l'entrée de zone, d'une texture encore d'origine.
    if (o.texture && !st.gradedTiles.has(o.texture.key)) {
      try { lookGradeTileTextures(st, [o.texture.key]); } catch (e) { st.gradedTiles.add(o.texture.key); }
    }
    lookTintTile(st, o);
  }
  const k = lookTexKey(o);
  const L = cfg.lights;
  if (!L) return;
  if ((L.raiAlpha ?? 1) !== 1 && k === 'item-fx_rai_lumiere') st.dimmed.push({ o, k: L.raiAlpha, base: o.alpha, set: null });
  if ((L.haloAlpha ?? 1) !== 1 && k === 'item-fx_halo_doux' && o.scrollFactorX === 1) st.dimmed.push({ o, k: L.haloAlpha, base: o.alpha, set: null });
}

// Personnages : sprites à la profondeur des personnages, dans le monde, plus
// Agarica partout (profondeur 951 dans le trou sombre).
function lookIsCharacter(o, player) {
  return o.type === 'Sprite' && (o.depth === CHARACTER_DEPTH || o === player) && o.scrollFactorX === 1
    && o.blendMode === Phaser.BlendModes.NORMAL && !o.__lookCopy;
}

// Objets à alpha atténué (rai de lune, halo du feu) : si le jeu a changé leur
// alpha depuis (fondu, tween), c'est la nouvelle base ; l'alpha d'origine est
// rendu au détachement.
function lookSyncDimmed(st) {
  for (const d of st.dimmed) {
    const o = d.o;
    if (!o.active) continue;
    if (d.set !== null && o.alpha !== d.set) d.base = o.alpha;
    o.alpha = d.base * d.k;
    d.set = o.alpha;
    o.__lookBaseAlpha = d.base;
  }
}

function lookPostUpdate(scene, st) {
  if (scene.__look !== st) return;
  const cfg = st.cfg;
  lookSyncDimmed(st);
  if (st.dimmed.length > 64) st.dimmed = st.dimmed.filter((d) => d.o.active);
  if (!cfg.rim && !cfg.shadow) return;
  // Liste des personnages relue 4 fois par seconde, pas à chaque image (toute
  // la liste d'affichage à parcourir pour moins de dix personnages).
  const frame = scene.game.loop.frame;
  if (frame >= st.charsAt) {
    st.charsAt = frame + LOOK_CHAR_RESCAN_FRAMES;
    const wanted = new Set();
    const list = scene.sys.displayList.list;
    for (let i = 0; i < list.length; i++) {
      if (lookIsCharacter(list[i], scene.player)) wanted.add(list[i]);
    }
    // Plus un personnage (profondeur ou mode de fusion changé) : copies retirées.
    for (const o of st.rims.keys()) if (!wanted.has(o)) lookDropCopies(st, o);
    for (const o of st.shadows.keys()) if (!wanted.has(o)) lookDropCopies(st, o);
    st.chars = Array.from(wanted);
  }
  for (let i = 0; i < st.chars.length; i++) {
    const o = st.chars[i];
    // Détruit ou désactivé : ses copies partent avec lui, tout de suite.
    if (!o.active) { lookDropCopies(st, o); continue; }
    if (cfg.rim) lookSyncRim(scene, st, o);
    if (cfg.shadow) lookSyncShadow(scene, st, o);
  }
}

function lookDropCopies(st, o) {
  const copies = st.rims.get(o);
  if (copies) { for (const c of copies) c.destroy(); st.rims.delete(o); }
  const s = st.shadows.get(o);
  if (s) { s.destroy(); st.shadows.delete(o); }
}

// Liseré lumineux : copie de la silhouette, teintée pleine, en ADD, décalée
// vers le haut et glissée JUSTE SOUS le personnage : seule la frange qui
// dépasse du contour se voit (lumière de lune venue de derrière). Sa couleur
// glisse vers celle de la lumière la plus forte à portée.
function lookRimColor(st, src) {
  const r = st.cfg.rim;
  if (!r.lightTint || !st.lightWorld.length) return r.color;
  const cy = src.y + (0.5 - src.originY) * src.displayHeight;
  let best = 0;
  let col = null;
  for (const L of st.lightWorld) {
    const dx = src.x - L.x;
    const dy = cy - L.y;
    const f = 1 - (dx * dx + dy * dy) / (L.r * L.r);
    if (f <= 0) continue;
    const k = f * f * Math.min(1, L.i * 1.6);
    if (k > best) { best = k; col = L.c; }
  }
  const w = Math.min(0.85, best * r.lightTint);
  if (!col || w < 0.02) return r.color;
  const b = lookRgb(r.color);
  const mix = (i) => Math.round(255 * (b[i] + (col[i] - b[i]) * w));
  return (mix(0) << 16) | (mix(1) << 8) | mix(2);
}

function lookSyncRim(scene, st, src) {
  const r = st.cfg.rim;
  let copies = st.rims.get(src);
  if (!copies) {
    const offs = r.offsets || [[0, -1]];
    const px = r.px ?? 1.4;
    copies = offs.map(([ox, oy]) => {
      const c = scene.add.image(src.x, src.y, src.texture.key, src.frame.name)
        .setBlendMode(Phaser.BlendModes.ADD).setTintFill(r.color);
      c.__lookCopy = true;
      c.lookRole = 'world';
      c.__lookOff = [ox * px, oy * px];
      c.__lookColor = r.color;
      return c;
    });
    st.rims.set(src, copies);
  }
  const color = lookRimColor(st, src);
  for (const c of copies) {
    if (c.__lookColor !== color) { c.setTintFill(color); c.__lookColor = color; }
    if (c.frame !== src.frame) c.setTexture(src.texture.key, src.frame.name);
    c.setOrigin(src.originX, src.originY);
    c.setScale(src.scaleX, src.scaleY);
    c.setFlip(src.flipX, src.flipY);
    c.setRotation(src.rotation);
    c.setPosition(src.x + c.__lookOff[0], src.y + c.__lookOff[1]);
    c.setVisible(src.visible);
    c.setAlpha(src.alpha * (r.alpha ?? 0.15));
    // Seulement si elle change : setDepth redemande un tri de toute la liste
    // d'affichage (2 000 objets), à chaque image sinon.
    const d = src.depth - LOOK_RIM_DEPTH_OFFSET;
    if (c.depth !== d) c.setDepth(d);
  }
}

// Ombre de contact d'un personnage : sur le sol SOUS ses pieds, largeur de
// l'appui visible, s'efface et rétrécit en l'air ; perché sur un décor (Xara
// sur sa souche), bornée au dessus du décor.
function lookSyncShadow(scene, st, src) {
  let sh = st.shadows.get(src);
  if (!sh) {
    sh = scene.add.image(src.x, src.y, lookShadowKey(scene)).setDepth(src.depth - 0.6);
    sh.__lookCopy = true;
    sh.lookRole = 'world';
    st.shadows.set(src, sh);
  }
  const box = typeof objectVisibleBox === 'function' ? objectVisibleBox(src) : null;
  const feet = src.body ? src.body.bottom : (box ? box.bottom : src.y);
  let ground = lookGroundBelow(st, src.x, feet);
  let onProp = false;
  if (!src.body && typeof propTopYAt === 'function') {
    const top = propTopYAt(scene, src.x);
    if (top != null && top >= feet - 10 && (ground == null || top < ground)) { ground = top; onProp = true; }
  }
  if (ground == null || !src.visible) { sh.setVisible(false); return; }
  const h = Math.max(0, ground - feet);
  const k = Phaser.Math.Clamp(1 - h / 150, 0, 1);
  let base = box ? (box.baseRight - box.baseLeft) : src.displayWidth * 0.4;
  if (src.body) base = Math.max(base, src.body.width * 0.8);
  let w = (base < 26 ? base * 1.3 + 6 : base * 1.6 + 18) * (0.55 + 0.45 * k);
  let cx = box ? (box.baseLeft + box.baseRight) / 2 : src.x;
  let y = ground + 2;
  let alphaMul = 1;
  if (onProp) {
    const span = lookPlateauAt(scene, st, src.x, ground);
    if (span) {
      w = Math.min(w, (span[1] - span[0]) * 0.9);
      cx = Phaser.Math.Clamp(cx, span[0] + w / 2, span[1] - w / 2);
    }
    y = Math.max(ground, feet - 1) + 1;
    alphaMul = 0.75;
  }
  sh.setVisible(k > 0.02);
  if (sh.depth !== src.depth - 0.6) sh.setDepth(src.depth - 0.6);
  sh.setDisplaySize(w, Math.max(5, w * 0.26));
  sh.setPosition(cx, y);
  sh.setAlpha((st.cfg.shadow.alpha ?? 0.7) * k * src.alpha * alphaMul);
}

function lookPlateauAt(scene, st, x, top) {
  const key = `${Math.round(x / 2)}|${Math.round(top)}`;
  if (st.plateaus.has(key)) return st.plateaus.get(key);
  const ok = (xx) => {
    const y = propTopYAt(scene, xx);
    return y != null && Math.abs(y - top) <= 8;
  };
  let span = null;
  if (ok(x)) {
    let l = x;
    let r = x;
    while (l > x - 120 && ok(l - 2)) l -= 2;
    while (r < x + 120 && ok(r + 2)) r += 2;
    span = [l, r];
  }
  st.plateaus.set(key, span);
  return span;
}

// Lumières fixes et lucioles : relues deux fois par seconde (à partir de la
// liste entière, tests de chaînes compris), pas à chaque image.
function lookScanStaticLights(scene, st) {
  st.staticLights = [];
  st.flies = [];
  const L = st.cfg.lights;
  if (!L) return;
  if (!st.lightRules) {
    st.lightRules = LOOK_LIGHT_RULES.map((r) => ({ ...r, ...((L.rules && L.rules[r.id]) || {}) }))
      .filter((r) => r.intensity > 0 || r.glow > 0);
  }
  for (const o of scene.sys.displayList.list) {
    if (!o.active || !o.visible || o.scrollFactorX !== 1) continue;
    const k = lookTexKey(o);
    if (k === 'item-fx_luciole' || k === 'juice-dot') { st.flies.push(o); continue; }
    const rule = st.lightRules.find((r) => r.test(o));
    if (rule) st.staticLights.push({ obj: o, rule, seed: st.staticLights.length * 1.7 });
  }
}

// Lumières de l'image (une fois par image, après le suivi de la caméra) :
// positions à l'écran pour le shader, halos additifs, lumières du monde pour
// la teinte du liseré. Au plus `lights.max` (<= 8), les plus importantes.
function lookComputeFrame(scene, st) {
  const loopFrame = scene.game.loop.frame;
  if (st.frameNo === loopFrame) return;
  st.frameNo = loopFrame;
  const f = st.frame;
  const L = st.cfg.lights;
  st.lightWorld.length = 0;
  if (!L || !L.max) {
    f.lightCount = 0;
    for (const g of st.glows) g.setVisible(false);
    return;
  }
  const cam = st.main;
  const t = scene.game.loop.time / 1000;
  if (loopFrame >= st.lightScanAt) {
    st.lightScanAt = loopFrame + LOOK_LIGHT_RESCAN_FRAMES;
    lookScanStaticLights(scene, st);
  }
  const W = cam.width;
  const H = cam.height;
  const z = cam.zoom;
  const sh = cam.shakeEffect;
  const ox = sh && sh.isRunning ? sh._offsetX : 0;
  const oy = sh && sh.isRunning ? sh._offsetY : 0;
  const toScreen = (wx, wy) => [(wx - cam.scrollX - W / 2) * z + W / 2 + ox, (wy - cam.scrollY - H / 2) * z + H / 2 + oy];
  const cand = [];
  const push = (wx, wy, color, radius, intensity, glow, prio) => {
    const [sx, sy] = toScreen(wx, wy);
    const r = radius * z;
    if (sx < -r || sx > W + r || sy < -r || sy > H + r || (intensity <= 0.001 && glow <= 0.001)) return;
    const dc = Math.abs(sx - W / 2) + Math.abs(sy - H / 2);
    cand.push({ wx, wy, sx, sy, radius, r, intensity, glow, c: lookRgb(color), prio, dc });
  };
  for (const S of st.staticLights) {
    const o = S.obj;
    // Alpha « vrai » des objets atténués par le rendu (rai) : la lumière
    // suit le fondu du jeu, pas notre atténuation.
    const oa = o.__lookBaseAlpha != null ? o.__lookBaseAlpha : o.alpha;
    if (!o.active || !o.visible || oa <= 0.01) continue;
    const R = S.rule;
    const cy = o.y + (0.5 - o.originY) * o.displayHeight + (R.dy || 0) * o.displayHeight;
    let k = 1;
    if (R.flicker) k *= 1 + R.flicker * (0.6 * Math.sin(t * 11.3 + S.seed) + 0.4 * Math.sin(t * 23.7 + S.seed * 2));
    if (R.pulse) k *= 1 + R.pulse * Math.sin(t * 1.7 + S.seed);
    // Lumières à alpha propre (rai, halos) : intensité qui suit leur fondu.
    if (o.blendMode === Phaser.BlendModes.ADD) k *= Math.min(1, oa / 0.3);
    const radius = R.radius * (R.flicker ? 1 + 0.03 * Math.sin(t * 9.1 + S.seed) : 1);
    st.lightWorld.push({ x: o.x, y: cy, r: radius, i: R.intensity * k, c: lookRgb(R.color) });
    push(o.x, cy, R.color, radius, R.intensity * k, (R.glow || 0) * k, 2);
  }
  // Lucioles (images ADD de vie ambiante) : les plus proches du centre.
  const fly = L.fly;
  if (fly && (fly.intensity > 0 || fly.glow > 0)) {
    const flies = st.flies.filter((o) => o.active && o.visible && o.alpha > 0.15);
    flies.sort((a, b) => Math.abs(a.x - cam.midPoint.x) - Math.abs(b.x - cam.midPoint.x));
    for (const o of flies.slice(0, LOOK_FIREFLY_MAX)) {
      const c = o.isTinted && o.tintTopLeft !== 0xffffff ? o.tintTopLeft : 0xc8ffb0;
      push(o.x, o.y, c, fly.radius, fly.intensity * o.alpha, (fly.glow || 0) * o.alpha, 1);
    }
  }
  // Agarica : lueur froide discrète (lisible dans le noir) ; Xara : rose.
  const p = scene.player;
  if (L.self && L.self.intensity > 0 && p && p.active && p.visible) {
    push(p.x, (p.body ? p.body.center.y : p.y) - 10, L.self.color ?? 0xe6dcff, L.self.radius, L.self.intensity, 0, 3);
  }
  const x = scene.xara;
  if (L.xara && L.xara.intensity > 0 && x && x.active && x.visible) {
    push(x.x, x.y - 10, L.xara.color ?? 0xff9ad6, L.xara.radius, L.xara.intensity, L.xara.glow || 0, 1);
  }
  // Plafond de 8 : à priorité égale, les plus proches du centre de l'écran
  // (une lumière écartée l'est au bord, où sa disparition ne se voit pas).
  cand.sort((a, b) => b.prio - a.prio || a.dc - b.dc);
  const n = Math.min(cand.length, L.max);
  for (let i = 0; i < n; i++) {
    const c = cand[i];
    f.lights.set([c.sx, c.sy, c.r, c.intensity], i * 4);
    f.lightCols.set([c.c[0], c.c[1], c.c[2], c.glow], i * 4);
  }
  f.lightCount = n;
  // Halos additifs (sprites du monde, cf. LOOK_GLOW_DEPTH).
  const gk = L.glow || 0;
  for (let i = 0; i < st.glows.length; i++) {
    const g = st.glows[i];
    const c = i < n ? cand[i] : null;
    const a = c ? c.glow * gk : 0;
    if (!c || a < 0.002) { g.setVisible(false); continue; }
    g.setVisible(true).setPosition(c.wx, c.wy).setDisplaySize(c.radius * 2, c.radius * 2).setAlpha(Math.min(1, a))
      .setTint(Phaser.Display.Color.GetColor(Math.round(c.c[0] * 255), Math.round(c.c[1] * 255), Math.round(c.c[2] * 255)));
  }
}

// Accès pour les tests, les captures et la console. `attach` et `info` renvoient
// peu de chose exprès : l'état complet (`state`) contient toute la scène, et le
// harnais de test se bloquerait à vouloir l'afficher (--js).
window.lookKit = {
  attach: (scene, data) => !!lookAttach(scene, data),
  detach: (scene) => { lookDetach(scene); },
  enabled: lookEnabled,
  setEnabled: (on) => { lookSetEnabled(on); },
  config: lookResolveConfig,
  roleOf: lookRoleOf,
  state: (scene) => (scene || (typeof currentLevelScene !== 'undefined' ? currentLevelScene : null) || {}).__look || null,
  info: (scene) => {
    const st = window.lookKit.state(scene);
    if (!st) return null;
    return {
      profile: st.cfg.profile, attachMs: Math.round(st.attachMs), bakeMs: Math.round(st.bakeMs), fonds: st.bakes.size,
      tuiles: st.gradedTiles.size, lumieres: st.frame.lightCount, personnages: st.chars.length, voile: st.overlay ? [st.overlay.alpha0, st.overlay.alpha] : null,
    };
  },
  profiles: LOOK_PROFILES,
  tilesets: LOOK_TILESETS,
};
