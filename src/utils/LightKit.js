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
  // Ambiance hémisphérique : ciel = ambiance x (1 + hemi), sol = ambiance x (1 - hemi), sauf couleurs
  // imposées (reglerRendu : ciel, sol en [r, g, b] de 0 à 1). detail : part du dessin d'origine dans l'ambiance.
  // epaule : valeur à partir de laquelle les hautes lumières sont tassées vers le blanc sans l'atteindre (1 = aucune).
  // ombre(objet) : facteur d'ambiance propre à un objet, 0 à 1 (sous un auvent), uniforme sur tout le sprite.
  const DEFAUTS = { paliers: 4, contre: 1.5, ambiance: 0x5c5c5c, profondeur: 8, hemi: 0.05, detail: 0.7, ciel: null, sol: null, epaule: 0.8, ombre: null, lueurCorps: 0, rayonAvant: 0 };
  // Soleil : direction VERS le soleil (x droite, y haut, z vers le spectateur). Avec une ambiance uniforme vers 0,71 :
  // dessus éclairé, flancs intermédiaires, dessous dans une ombre douce
  const SOLEIL = { direction: { x: -0.25, y: 0.75, z: 0.6 }, couleur: 0xfff1d6, intensite: 0.57 };

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

  // Masque de soleil (canopée) : une ligne de cellules projetée le long de la direction du soleil. R = trouée,
  // G = hauteur où le rayon touche le décor (de haut à haut + plage), B = irrégularité des bords. Même calcul en JS : masqueSoleilJs.
  const FRAG_MASQUE = `
uniform sampler2D uMasque;
uniform vec4 uMasqueGeo;    // pente, debut, taille d'une cellule, nombre de cellules
uniform vec4 uMasqueAnim;   // balancement (px), temps, bande eclairee sous l'arrivee, actif
uniform vec2 uMasqueHaut;   // hauteur du debut du masque, plage de hauteurs couverte (px du monde)
uniform vec4 uMondeEcran;   // px du monde par px du canvas, decalage x, decalage y, hauteur du canvas
uniform vec4 uTaches;       // ombres de feuilles dans les rayons : force (0 = coupe), taille (px du monde), decalage x, y
vec2 pointMonde() {
  return vec2(gl_FragCoord.x, uMondeEcran.w - gl_FragCoord.y) * uMondeEcran.x + uMondeEcran.yz;
}
vec4 texMasque(float v) {
  return texture2D(uMasque, vec2(v, 0.5));
}
float masqueSoleil(vec2 m) {
  float rangee = floor(m.y / 6.0);
  float j = (texMasque(fract(rangee * 0.0731)).b - 0.5) * 2.0 * uMasqueGeo.z;
  float u = m.x - uMasqueGeo.x * m.y + j;
  float bal = uMasqueAnim.x * sin(uMasqueAnim.y * 0.7 + u * 0.011);
  vec4 c = texMasque((floor((u + bal - uMasqueGeo.y) / uMasqueGeo.z) + 0.5) / uMasqueGeo.w);
  if (m.y > uMasqueHaut.x + c.g * uMasqueHaut.y + uMasqueAnim.z) return 0.0;
  return c.r;
}
// Ombres des feuilles qui glissent dans les rayons : bruit de valeur sur une grille de 2 px du monde (pixel art)
float bruitTaches(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = fract(sin(dot(i, vec2(127.1, 311.7))) * 43758.5453);
  float b = fract(sin(dot(i + vec2(1.0, 0.0), vec2(127.1, 311.7))) * 43758.5453);
  float c = fract(sin(dot(i + vec2(0.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
  float d = fract(sin(dot(i + vec2(1.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float taches(vec2 m) {
  if (uTaches.x <= 0.0) return 1.0;
  vec2 p = floor(m / 2.0) * 2.0 / uTaches.y + uTaches.zw;
  float n = bruitTaches(p) * 0.65 + bruitTaches(p * 2.13 + 7.31) * 0.35;
  return 1.0 - uTaches.x * smoothstep(0.5, 0.58, n);
}
// Moyenne du masque autour du point : bords fondus pour les faisceaux et les taches du decor (r : rayon en px du monde)
float masqueDoux(vec2 m, float r) {
  float s = masqueSoleil(m) * 2.0;
  s += masqueSoleil(m + vec2(-1.0, -0.35) * r) + masqueSoleil(m + vec2(1.0, 0.35) * r);
  s += masqueSoleil(m + vec2(-0.66, 0.25) * r) + masqueSoleil(m + vec2(0.66, -0.25) * r);
  s += masqueSoleil(m + vec2(-0.33, -0.2) * r) + masqueSoleil(m + vec2(0.33, 0.2) * r);
  return s / 8.0 * taches(m);
}`;

  // uTaches par défaut : ombres de feuilles coupées (force 0). masque.taches = [force, taille, dx, dy] les allume.
  const TACHES_COUPEES = [0, 1, 0, 0];

  // masqueSoleil() du shader, ligne à ligne. M : { lire(v) -> { r, g, b }, pente, u0, cel, n, amp, t, bande, haut, plage }
  function masqueSoleilJs(m, M) {
    const { floor, sin } = Math, fract = (v) => v - Math.floor(v);
    const rangee = floor(m.y / 6.0);
    const j = (M.lire(fract(rangee * 0.0731)).b - 0.5) * 2.0 * M.cel;
    const u = m.x - M.pente * m.y + j;
    const bal = M.amp * sin(M.t * 0.7 + u * 0.011);
    const c = M.lire((floor((u + bal - M.u0) / M.cel) + 0.5) / M.n);
    if (m.y > M.haut + c.g * M.plage + M.bande) return 0.0;
    return c.r;
  }

  // Morceaux communs au shader complet et au shader du décor (mêmes formules, écrites une seule fois)
  const FRAG_STRUCT_LUMIERE = `struct Lumiere {
  vec3 position;   // x, y : repere natif affiche du sprite (y vers le bas) ; z : profondeur native
                   // soleil : direction normalisee vers le soleil (x droite, y haut, z vers le spectateur)
  float soleil;    // 1 = directionnelle : ni position, ni portee, ni attenuation
  float decor;     // 1 = source de decor derriere le personnage : jamais sur ses plans de face
  vec3 couleur;    // couleur x intensite
  float portee;    // portee native
  float forme;     // 0 = point (position), 1 = triangle, 2 = rectangle arrondi (cercle : demi-cotes = rayon)
  vec4 formeA;     // triangle : sommets 1 et 2 ; rectangle : centre, demi-largeur, demi-hauteur
  vec4 formeB;     // triangle : sommet 3 dans x, y ; rectangle : rayon des coins dans x
};
`;

  const FRAG_AMBIANCE = `vec3 ambianceHemi(vec3 n) {
  return mix(uSol, uCiel, 0.5 + 0.5 * n.y);
}

float epaule(float v) {
  if (v <= uEpaule || uEpaule >= 1.0) return v;
  float e = 1.0 - uEpaule;
  return uEpaule + e * (1.0 - exp((uEpaule - v) / e));
}
`;

  const FRAG_SOURCES = `// Source de decor derriere un personnage : la carte contre-jour ne compte pas sur les plans tournes vers le spectateur
float expositionDecor(vec3 n, float ex) {
  return min(ex * 1.5, 1.0) * (1.0 - smoothstep(0.9, 0.97, n.z));
}

// Source de decor derriere ou a cote d'un personnage : le dessous du corps (plans et bords tournes vers le sol) reste dans l'ombre
float horsDessous(vec3 n, vec4 cjm) {
  float bas = max(-n.y, 1.0 - cjm.g * 2.0);
  return 1.0 - smoothstep(0.35, 0.7, bas);
}

// Point du segment a-b le plus proche de p
vec2 procheSegment(vec2 p, vec2 a, vec2 b) {
  vec2 ab = b - a;
  return a + ab * clamp(dot(p - a, ab) / max(dot(ab, ab), 0.0001), 0.0, 1.0);
}

// Source visible : la lumiere part du point de sa forme le plus proche du pixel p, ou de p lui-meme s'il est dans la forme
vec2 pointForme(vec2 p, vec2 lp, float forme, vec4 fa, vec4 fb) {
  if (forme < 0.5) return lp;
  if (forme < 1.5) {
    vec2 s1 = vec2(fa.x, fa.y);
    vec2 s2 = vec2(fa.z, fa.w);
    vec2 s3 = vec2(fb.x, fb.y);
    float c1 = (s2.x - s1.x) * (p.y - s1.y) - (s2.y - s1.y) * (p.x - s1.x);
    float c2 = (s3.x - s2.x) * (p.y - s2.y) - (s3.y - s2.y) * (p.x - s2.x);
    float c3 = (s1.x - s3.x) * (p.y - s3.y) - (s1.y - s3.y) * (p.x - s3.x);
    if (min(c1, min(c2, c3)) >= 0.0 || max(c1, max(c2, c3)) <= 0.0) return p;
    vec2 q1 = procheSegment(p, s1, s2);
    vec2 q2 = procheSegment(p, s2, s3);
    vec2 q3 = procheSegment(p, s3, s1);
    float d1 = dot(p - q1, p - q1);
    float d2 = dot(p - q2, p - q2);
    float d3 = dot(p - q3, p - q3);
    if (d1 <= d2 && d1 <= d3) return q1;
    return d2 <= d3 ? q2 : q3;
  }
  vec2 q = vec2(clamp(p.x, fa.x - fa.z + fb.x, fa.x + fa.z - fb.x), clamp(p.y, fa.y - fa.w + fb.x, fa.y + fa.w - fb.x));
  vec2 v = p - q;
  float l = length(v);
  if (l <= fb.x) return p;
  return q + v * fb.x / l;
}
`;

  const FRAG = `
#define SHADER_NAME LUMIERE_SECTIONS_FS
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
${FRAG_STRUCT_LUMIERE}const int kMaxLights = %LIGHT_COUNT%;
uniform sampler2D uMainSampler;   // image du jeu (objet sans carte)
uniform sampler2D uNeutre;        // _lumiere/<n>_neutre.png
uniform sampler2D uNormales;      // _lumiere/<n>_n.png
uniform sampler2D uCj;            // _lumiere/<n>_cj.png (carte contre-jour)
uniform sampler2D uNatif;         // _lumiere/<n>_natif.png (dessin d'origine, meme grille)
uniform vec3 uCiel, uSol;         // ambiance : plans tournes vers le haut / vers le bas
uniform float uDetail;            // part du dessin d'origine dans l'ambiance
uniform float uEpaule;            // debut de l'epaule des hautes lumieres (1 = aucune)
uniform float uEmissif;           // > 0 : les pixels au moins aussi vifs gardent leur couleur (flammes du feu)
uniform float uLueurCorps;        // rayon de canopee : lueur uniforme du corps, part de la force du rayon
uniform float uRayonAvant;        // rayon de canopee : force sur les plans tournes vers l'avant, par sections
uniform float uOmbreSoleil;       // rayon de canopee : distance remontee vers le soleil dans la silhouette (cases)
uniform float uPerso;             // 1 = personnage sans cartes : le rayon se pose sur le haut de sa silhouette
${FRAG_MASQUE}
uniform Lumiere uLumieres[kMaxLights];
uniform int uNbLumieres;
uniform float uPaliers, uContre;
uniform float uAuSol;             // 1 = personnage pose au sol (rien sous lui), 0 = en l'air (le dessous recoit la lumiere)
uniform float uCarte;            // 1 = sprite avec cartes, 0 = a plat
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

${FRAG_AMBIANCE}
float directionnel(vec3 n, vec3 d, float lumBase) {
  float diff = max(dot(n, d), 0.0);
  if (lumBase < 0.16) return min(diff, uPaliers < 1.5 ? 0.34 : 1.0 / (uPaliers - 1.0));
  return diff;
}

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

${FRAG_SOURCES}
// Rayon de canopee sur un personnage : il vient d'en haut, touche le dessus du corps et s'arrete la.
float opaqueEn(vec2 q) {
  if (q.x < 0.0 || q.y < 0.0 || q.x >= uTaille.x || q.y >= uTaille.y) return 0.0;
  if (uCarte > 0.5) return step(0.5, texture2D(uNormales, (q + 0.5) / uTaille).a);
  return step(0.5, texture2D(uMainSampler, (uCoin + uGrille + (q + 0.5) * uPas) / uTailleTex).a);
}

// Part du corps traversee en remontant vers le soleil (0 = rien au-dessus, 1 = corps sur tout le trajet)
float corpsAuDessus(vec2 ts, vec3 d) {
  vec2 dir = normalize(vec2(uFlip > 0.5 ? -d.x : d.x, -d.y));
  float plein = 0.0;
  for (int i = 1; i <= 8; i++) {
    plein += opaqueEn(floor(ts + 0.5 + dir * uOmbreSoleil * float(i) / 8.0));
  }
  return plein / 8.0;
}

// Sprite a cartes : plans du dessus exposes en haut de la silhouette (carte contre-jour), un seul palier a la fin ;
// le reste du corps garde une lueur uniforme
float rayonCorps(vec3 n, vec3 d, float lb, float e, float ms, vec4 cjm) {
  float libre = 1.0 - smoothstep(0.3, 0.95, e);
  vec2 bord = cjm.rg * 2.0 - 1.0;
  float expose = smoothstep(0.05, 0.45, cjm.b) * smoothstep(0.1, 0.6, bord.y);
  float v = directionnel(n, d, lb) * smoothstep(0.1, 0.65, n.y) * expose * libre * ms;
  float devant = max(n.x * d.x * 0.45 + n.y * d.y * 0.45 + n.z * 0.9, 0.0);
  return max(max(palier(v), palier(devant * uRayonAvant) * ms), uLueurCorps * ms);
}

// Personnage sans cartes (aucune orientation connue) : haut de la silhouette seulement
float rayonSilhouette(float e, float ms) {
  float libre = 1.0 - smoothstep(0.3, 0.95, e);
  return max(0.55 * libre * ms, uLueurCorps * ms);
}

void main() {
  vec4 texel = vec4(outTint.bgr * outTint.a, outTint.a);
  vec2 px = outTexCoord * uTailleTex - uCoin;          // pixel de la frame (image du jeu)
  vec4 base;
  vec3 dessin;
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
    dessin = mix(base.rgb, texture2D(uNatif, uv).rgb, uDetail);
    n = texture2D(uNormales, uv).rgb * 2.0 - 1.0;
    if (uFlip > 0.5) n.x = -n.x;
    n = normalize(n);
    if (uDerriere > 0.5) nl = normaleLisse(ts);
    cjm = texture2D(uCj, uv);
  } else {
    base = texture2D(uMainSampler, outTexCoord);      // alpha premultiplie (Phaser)
    if (base.a <= 0.0) discard;
    dessin = base.rgb;
    ts = floor((px - uGrille) / uPas);
  }
  vec2 t = ts;
  if (uFlip > 0.5) t.x = uTaille.x - 1.0 - ts.x;
  vec2 tc = t + 0.5;
  float lb = dot(base.rgb, vec3(0.3, 0.59, 0.11));
  vec3 l = vec3(0.0);
  vec3 ls = vec3(0.0);   // soleils : eclairent le dessin, meme gain relatif pour toutes les matieres
  // canopee : hors des rayons, pas de soleil ; bords fondus, plus serres sur les personnages que sur le decor
  bool perso = uCarte > 0.5 || uPerso > 0.5;
  float ms = uMasqueAnim.w > 0.5 ? masqueDoux(pointMonde(), perso ? 5.0 : 14.0) : 1.0;
  for (int i = 0; i < kMaxLights; ++i) {
    if (i < uNbLumieres) {
      Lumiere L = uLumieres[i];
      if (L.soleil > 0.5) {
        if (uMasqueAnim.w < 0.5) ls += L.couleur * palier(directionnel(n, L.position, lb));   // plein soleil, sans canopee
        else if (!perso) ls += L.couleur * ms * 0.55;                                          // taches de lumiere du decor
        else if (ms > 0.0) {
          float e = corpsAuDessus(ts, L.position);
          ls += L.couleur * (uCarte > 0.5 ? rayonCorps(n, L.position, lb, e, ms, cjm) : rayonSilhouette(e, ms));
        }
      } else {
        // personnages (cartes) : paliers ; decor sans carte : fondu continu, sinon les paliers y dessinent des cercles
        vec4 cjL = L.decor > 0.5 ? vec4(cjm.rg, expositionDecor(n, cjm.b), cjm.a) : cjm;
        vec2 lp = pointForme(tc, L.position.xy, L.forme, L.formeA, L.formeB);
        float e = eclairage(n, uCarte > 0.5 ? nl : n, tc, lp, L.position.z, L.portee, lb, cjL);
        // lampe passee devant un personnage tourne vers elle : le menton et le bas du visage gardent sa lumiere
        if (L.decor > 0.5) e *= mix(1.0, horsDessous(n, cjm), uAuSol * (1.0 - smoothstep(8.0, 30.0, L.position.z)));
        l += L.couleur * (uCarte > 0.5 ? palier(e) : smoothstep(0.0, 1.0, e));
      }
    }
  }
  // ambiance sur le dessin d'origine (detail dans l'ombre), lampes sur le neutre (pas d'ombrage double)
  vec3 c = dessin * (ambianceHemi(n) + ls) + base.rgb * l;
  // epaule sur la composante la plus forte : teinte gardee, chaque palier reste distinct jusque dans les blancs
  float m = max(c.r, max(c.g, c.b));
  if (m > 0.0) c *= epaule(m) / m;
  if (uEmissif > 0.0 && max(dessin.r, max(dessin.g, dessin.b)) >= uEmissif * base.a) c = dessin;
  vec4 color = vec4(c, base.a) * texel;
  if (outTintEffect == 1.0) color.rgb = outTint.bgr * outTint.a * base.a;   // setTintFill
  else if (outTintEffect == 2.0) color = texel;
  gl_FragColor = color;
}`;

  // Décor sans carte (Image) : le shader complet ci-dessus, réduit à ce qui compte pour lui. Le compilateur D3D aplatit
  // les branches du shader complet : chaque pixel y payait aussi les cartes, le contre-jour et les dix lampes, même
  // inutilisés (un arbre du fond coûtait 20 ms sur Intel UHD). Mêmes formules, donc même image.
  // masque : rayons de canopée (décor au plan du jeu) ; lampes : au moins une lampe atteint l'objet.
  const fragDecor = (masque, lampes, maxLampes) => `
#define SHADER_NAME LUMIERE_DECOR_FS
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D uMainSampler;
uniform vec3 uCiel, uSol;
uniform float uEpaule;
varying vec2 outTexCoord;
varying float outTintEffect;
varying vec4 outTint;
${FRAG_AMBIANCE}
${masque ? `${FRAG_MASQUE}
uniform vec3 uSoleilDecor;        // somme des soleils qui atteignent l'objet` : ''}
${lampes ? `${FRAG_STRUCT_LUMIERE.replace('};', '  float atteinte;  // carre de la distance (px natifs) au-dela de laquelle cette lampe n\'apporte rien\n};')}
uniform Lumiere uLumieres[${maxLampes}];
uniform int uNbLumieres;
uniform float uPaliers, uContre, uAuSol, uFlip;
uniform vec2 uTaille, uTailleTex, uCoin, uGrille, uPas;
${FRAG_ECLAIRAGE}
${FRAG_SOURCES}` : ''}
void main() {
  vec4 texel = vec4(outTint.bgr * outTint.a, outTint.a);
  vec4 base = texture2D(uMainSampler, outTexCoord);   // alpha premultiplie (Phaser)
  if (base.a <= 0.0) discard;
  vec3 n = vec3(0.0, 0.0, 1.0);
  vec3 ls = vec3(0.0);
  vec3 l = vec3(0.0);
${masque ? '  ls = uSoleilDecor * masqueDoux(pointMonde(), 14.0) * 0.55;' : ''}
${lampes ? `  vec4 cjm = vec4(0.5, 0.5, 0.0, 1.0);
  vec2 ts = floor((outTexCoord * uTailleTex - uCoin - uGrille) / uPas);
  vec2 t = ts;
  if (uFlip > 0.5) t.x = uTaille.x - 1.0 - ts.x;
  vec2 tc = t + 0.5;
  float lb = dot(base.rgb, vec3(0.3, 0.59, 0.11));
  for (int i = 0; i < ${maxLampes}; ++i) {
    if (i < uNbLumieres) {
      Lumiere L = uLumieres[i];
      vec2 ecart = tc - L.position.xy;
      if (dot(ecart, ecart) < L.atteinte) {
        vec4 cjL = L.decor > 0.5 ? vec4(cjm.rg, expositionDecor(n, cjm.b), cjm.a) : cjm;
        vec2 lp = pointForme(tc, L.position.xy, L.forme, L.formeA, L.formeB);
        float e = eclairage(n, n, tc, lp, L.position.z, L.portee, lb, cjL);
        if (L.decor > 0.5) e *= mix(1.0, horsDessous(n, cjm), uAuSol * (1.0 - smoothstep(8.0, 30.0, L.position.z)));
        l += L.couleur * smoothstep(0.0, 1.0, e);
      }
    }
  }` : ''}
  vec3 c = base.rgb * (ambianceHemi(n) + ls) + base.rgb * l;
  float m = max(c.r, max(c.g, c.b));
  if (m > 0.0) c *= epaule(m) / m;
  vec4 color = vec4(c, base.a) * texel;
  if (outTintEffect == 1.0) color.rgb = outTint.bgr * outTint.a * base.a;   // setTintFill
  else if (outTintEffect == 2.0) color = texel;
  gl_FragColor = color;
}`;

  // ---------------------------------------------------------------- cartes (BootScene)
  // clé de texture du jeu -> adresse de l'image (clé de SECTIONS_LUMIERE)
  const cleVersUrl = {};
  const manifeste = () => (typeof SECTIONS_LUMIERE !== 'undefined' ? SECTIONS_LUMIERE : {});
  const cleCarte = (url, quoi) => `lumiere:${quoi}:${url}`;

  // Chargées d'un bloc au démarrage seulement avec `?lumiere` ou dans le labo. Dans le jeu normal, rien ne s'ajoute
  // au démarrage : les zones à ambiance les demandent en fond, au fil des besoins (demanderCartes).
  function cartesVoulues() {
    if (typeof window === 'undefined') return false;
    const q = new URLSearchParams(window.location.search);
    return q.has('lumiere') || q.get('zone') === 'labo_lumiere' || q.get('zone') === 'LaboLumiereScene';
  }

  // preload de BootScene : charge neutre, normales et carte contre-jour de chaque sprite du
  // manifeste (la carte contre-jour seulement si le manifeste l'annonce : `cj`) et note
  // quelle clé de texture correspond à quelle image (le manifeste parle en fichiers).
  function chargerCartes(scene) {
    const man = manifeste();
    if (cartesVoulues()) {
      for (const [url, e] of Object.entries(man)) {
        scene.load.image(cleCarte(url, 'neutre'), `${e.d}/${e.n}_neutre.png`);
        scene.load.image(cleCarte(url, 'n'), `${e.d}/${e.n}_n.png`);
        scene.load.image(cleCarte(url, 'natif'), `${e.d}/${e.n}_natif.png`);
        if (e.cj) scene.load.image(cleCarte(url, 'cj'), `${e.d}/${e.n}_cj.png`);
      }
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
      for (const q of ['neutre', 'n', 'cj', 'natif']) {
        const k = cleCarte(url, q);
        if (scene.textures.exists(k)) scene.textures.get(k).setFilter(Phaser.Textures.FilterMode.NEAREST);
      }
    }
  }

  // Chargement en fond, hors du chargeur des scènes (il survit aux changements de zone). Les cartes d'un sprite
  // entrent ensemble dans le jeu : un sprite n'est jamais éclairé avec une partie de ses cartes.
  const MAX_CARTES_EN_COURS = 6;
  const cartesDemandees = new Set();
  const fileCartes = [];
  let cartesEnCours = 0;

  function imageCarte(adresse) {
    return new Promise((ok, ko) => {
      const im = new Image();
      im.onload = () => ok(im);
      im.onerror = ko;
      im.src = adresse;
    });
  }

  function pomperCartes(game) {
    const v = typeof ASSET_VERSION !== 'undefined' ? `?v=${ASSET_VERSION}` : '';
    while (cartesEnCours < MAX_CARTES_EN_COURS && fileCartes.length) {
      const url = fileCartes.shift(), e = manifeste()[url];
      const quoi = ['neutre', 'n', 'natif'].concat(e.cj ? ['cj'] : []);
      cartesEnCours++;
      Promise.all(quoi.map((q) => imageCarte(`${e.d}/${e.n}_${q}.png${v}`))).then((images) => {
        quoi.forEach((q, i) => {
          const k = cleCarte(url, q);
          if (!game.textures.exists(k)) game.textures.addImage(k, images[i]).setFilter(Phaser.Textures.FilterMode.NEAREST);
        });
      }).catch(() => { /* carte absente : le sprite reste éclairé à plat */ }).then(() => {
        cartesEnCours--;
        pomperCartes(game);
      });
    }
  }

  // Demande les cartes des images du manifeste dont le nom de carte correspond (RegExp), ou d'une seule image (adresse)
  function demanderCartes(game, quoi) {
    const man = manifeste();
    const urls = typeof quoi === 'string' ? [quoi] : Object.keys(man).filter((u) => quoi.test(man[u].n));
    for (const url of urls) {
      if (cartesDemandees.has(url) || !man[url] || game.textures.exists(cleCarte(url, 'neutre'))) continue;
      cartesDemandees.add(url);
      fileCartes.push(url);
    }
    pomperCartes(game);
  }

  // Toute l'animation d'une image affichée sans ses cartes : agarica_walk_3 -> agarica_walk_0 à 7
  function demanderAnimation(game, url) {
    const n = manifeste()[url].n.replace(/_\d+$/, '');
    demanderCartes(game, new RegExp(`^${n}_\\d+$`));
    demanderCartes(game, url);
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
        cj: game.textures.get(cj).source[0].glTexture,
        natif: game.textures.get(game.textures.exists(cleCarte(url, 'natif')) ? cleCarte(url, 'natif') : cleCarte(url, 'neutre')).source[0].glTexture };
    }
    // pas de cache tant que les cartes ne sont pas prêtes (chargement en cours)
    if (r || !e) cacheCartes[cleTexture] = r;
    else if (!cartesDemandees.has(url)) demanderAnimation(game, url);
    return r;
  }

  // ---------------------------------------------------------------- pipeline (créé à la demande)
  let PipelineClasse = null;
  const nomDecor = (masque, lampes) => `LumiereDecor${masque ? 'M' : ''}${lampes ? 'L' : ''}`;

  // Quatre variantes compilées à l'activation (pas d'à-coup en jeu). Sans lampe, tout est commun à la caméra : les objets
  // voisins de même image partent dans le même appel de dessin.
  function creerPipelinesDecor(r, game) {
    const SP = Phaser.Renderer.WebGL.Pipelines.SinglePipeline;
    class LumiereDecorPipeline extends SP {
      constructor(masque, lampes) {
        super({ game, fragShader: fragDecor(masque, lampes, r.config.maxLights) });
        this.avecMasque = masque;
        this.avecLampes = lampes;
        this.masqueTex = null;
        this.imageVue = -1;
        this.cameraVue = null;
      }

      onBeforeFlush() {
        if (!this.avecMasque || !this.masqueTex) return;
        const gl = this.gl;
        gl.activeTexture(gl.TEXTURE6);
        gl.bindTexture(gl.TEXTURE_2D, this.masqueTex.webGLTexture);
        gl.activeTexture(gl.TEXTURE0);
      }
    }
    for (const masque of [false, true]) {
      for (const lampes of [false, true]) {
        if (!r.pipelines.has(nomDecor(masque, lampes))) r.pipelines.add(nomDecor(masque, lampes), new LumiereDecorPipeline(masque, lampes));
      }
    }
  }

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
        this._atteintes = [];
        this._textures = null;
        this._reglages = DEFAUTS;
        this._ciel = [1, 1, 1];
        this._sol = [1, 1, 1];
        this._detail = 1;
        this._epaule = 1;
      }

      onRender(scene, camera) {
        const lm = scene.sys.lights;
        const actif = !!(lm && lm.active);
        // jamais d'objet invisible : sans lumières actives, plein jour (ambiance 1, aucune lampe)
        this.lightsActive = true;
        // les soleils d'abord : ils éclairent partout, quelle que soit la distance à la caméra
        const proches = actif ? lm.getLights(camera).map((o) => o.light).filter((L) => !L.soleil) : [];
        this._lampes = actif ? lm.lights.filter((L) => L.soleil && L.visible).concat(proches) : [];
        this._reglages = (scene.__lumiere && scene.__lumiere.reglages) || DEFAUTS;
        const r = this._reglages, a = actif ? lm.ambientColor : { r: 1, g: 1, b: 1 }, h = actif ? r.hemi ?? DEFAUTS.hemi : 0;
        this._ciel = (actif && r.ciel) || [a.r * (1 + h), a.g * (1 + h), a.b * (1 + h)];
        this._sol = (actif && r.sol) || [a.r * (1 - h), a.g * (1 - h), a.b * (1 - h)];
        this._detail = actif ? r.detail ?? DEFAUTS.detail : 1;
        this._epaule = actif ? r.epaule ?? DEFAUTS.epaule : 1;
        this._vue = ZoomKit.vueVisible(camera);
      }

      // Hors du cadre visible (marge large : secousses, fondu avec zoom) : rien à dessiner. Phaser ne trie pas ces
      // objets et chaque objet éclairé coûte un appel de dessin : sans ça, toute la zone serait dessinée à chaque image.
      horsCadre(go, camera) {
        const r = Math.hypot(go.displayWidth, go.displayHeight) + 64, v = this._vue;
        const x = go.x - camera.scrollX * go.scrollFactorX, y = go.y - camera.scrollY * go.scrollFactorY;
        return x + r < v.left - camera.scrollX || x - r > v.right - camera.scrollX
          || y + r < v.top - camera.scrollY || y - r > v.bottom - camera.scrollY;
      }

      // un appel de dessin par objet éclairé : ses lampes sont exprimées dans SON repère natif
      batchSprite(go, camera, parent) {
        if (!parent && this.horsCadre(go, camera)) return;
        this._camera = camera;
        if (this.dessinerDecor(go, camera, parent)) return;
        // d'abord se lier (vide le pipeline précédent) : les uniforms ci-dessous changent le
        // programme GL, il ne faut pas que le lot en attente d'un autre pipeline le subisse
        this.manager.set(this, go);
        if (this.vertexCount > 0) this.flush();
        this.preparer(go);
        super.batchSprite(go, camera, parent);
      }

      // Décor sans carte : shader réduit. false = cas particulier, laissé au shader complet (carte, sprite animé, partie
      // émissive, soleil sans canopée, ombre propre à l'objet, plus de lampes que le shader n'en reçoit).
      dessinerDecor(go, camera, parent) {
        const mq = this._reglages.masque;
        if (go.type !== 'Image' || !mq || go.__lumiereEmissif || this._reglages.ombre || cartesDe(this.game, go.frame.texture.key)) return false;
        const lampes = this._lampes, maxi = this.renderer.config.maxLights, atteintes = this._atteintes;
        const W = go.frame.realWidth, H = go.frame.realHeight, m = go.getWorldTransformMatrix(this._m1, this._m2);
        const sx = Math.hypot(m.a, m.b) || 1, sy = Math.hypot(m.c, m.d) || 1, rayonObjet = Math.hypot(W * sx, H * sy);
        let sr = 0, sg = 0, sb = 0, soleils = 0;
        atteintes.length = 0;
        for (let j = 0; j < lampes.length; j++) {
          const L = lampes[j], atteinte = L.radius + rayonObjet;
          if (L.soleil) {
            const f = L.intensity * (L.attenuation ? L.attenuation(go) : 1);
            soleils++;
            sr += L.color.r * f; sg += L.color.g * f; sb += L.color.b * f;
          } else if (Math.abs(L.x - go.x) <= atteinte && Math.abs(L.y - go.y) <= atteinte) atteintes.push(L);
        }
        if (soleils + atteintes.length > maxi) return false;
        const avecMasque = sr > 0 || sg > 0 || sb > 0, avecLampes = atteintes.length > 0;
        const pl = this.renderer.pipelines.get(nomDecor(avecMasque, avecLampes));
        this.manager.set(pl, go);
        // Un changement d'uniforme ne doit pas toucher le lot en attente
        const image = this.game.loop.frame;
        if (pl.imageVue !== image || pl.cameraVue !== camera) {
          if (pl.vertexCount > 0) pl.flush();
          pl.imageVue = image;
          pl.cameraVue = camera;
          pl.soleilR = -1;   // renvoyé à chaque image : les uniforms sont perdus avec le contexte WebGL
          pl.set1i('uMainSampler', 0);
          pl.set3f('uCiel', this._ciel[0], this._ciel[1], this._ciel[2]);
          pl.set3f('uSol', this._sol[0], this._sol[1], this._sol[2]);
          pl.set1f('uEpaule', this._epaule);
          if (avecMasque) {
            const Mc = camera.matrix;
            pl.masqueTex = mq.tex;
            pl.set1i('uMasque', 6);
            pl.set4f('uMasqueAnim', mq.amp, mq.t, mq.bande, 1);
            pl.set4f('uTaches', ...(mq.taches || TACHES_COUPEES));
            pl.set4f('uMasqueGeo', mq.pente, mq.u0, mq.cel, mq.n);
            pl.set2f('uMasqueHaut', mq.haut, mq.plage);
            pl.set4f('uMondeEcran', 1 / Mc.a, camera.scrollX - Mc.e / Mc.a, camera.scrollY - Mc.f / Mc.d, this.renderer.height);
          }
          if (avecLampes) { pl.set1f('uPaliers', this._reglages.paliers); pl.set1f('uContre', this._reglages.contre); }
        }
        if (avecMasque && (pl.soleilR !== sr || pl.soleilV !== sg || pl.soleilB !== sb)) {
          if (pl.vertexCount > 0) pl.flush();
          pl.soleilR = sr; pl.soleilV = sg; pl.soleilB = sb;
          pl.set3f('uSoleilDecor', sr, sg, sb);
        }
        if (avecLampes) {
          if (pl.vertexCount > 0) pl.flush();
          const frame = go.frame, flip = !!go.flipX, px = 1 / sx, py = 1 / sy;
          const G = { m, e: null, W, w: W * sx, cx: 0, cy: 0, px, py, sx, sy, k: 1, flip };
          for (let i = 0; i < atteintes.length; i++) {
            this.envoyerLampe(pl, i, atteintes[i], go, G);
            // Au-delà de sa portée, comptée depuis le point de sa forme le plus éloigné de son centre, la lampe vaut exactement 0
            const L = atteintes[i], R = L.radius - (L.forme ? L.forme.demi : 0) + etendueForme(L);
            pl.set1f(`uLumieres[${i}].atteinte`, R * R);
          }
          pl.set1i('uNbLumieres', atteintes.length);
          const boucle = go.scene.game.loop;
          pl.set1f('uAuSol', partAuSol(go, boucle.delta, boucle.frame));
          pl.set1f('uFlip', flip ? 1 : 0);
          pl.set2f('uTaille', W * sx, H * sy);
          pl.set2f('uTailleTex', frame.source.width, frame.source.height);
          pl.set2f('uCoin', frame.cutX, frame.cutY);
          pl.set2f('uGrille', 0, 0);
          pl.set2f('uPas', px, py);
        }
        pl.batchSprite(go, camera, parent);
        return true;
      }

      // Une lampe (hors soleil) dans le repère natif de l'objet. cible : le pipeline qui la reçoit. Renvoie sa profondeur native.
      envoyerLampe(cible, i, L, go, G) {
        const { m, e, W, w, cx, cy, px, py, sx, sy, k, flip } = G;
        // Point du monde -> repère natif affiché du sprite (lampe et sommets de sa forme)
        const natif = (X, Y) => {
          m.applyInverse(X, Y, this._pt);
          const D = this._pt.x + go.displayOriginX, Dy = this._pt.y + go.displayOriginY;
          return [flip ? w - (W - D - cx) / px : (D - cx) / px, (Dy - cy) / py];
        };
        const [tx, ty] = natif(L.x, L.y);
        const z = zLampe(L, go, !!e || go.type === 'Sprite', k);
        const nom = `uLumieres[${i}].`;
        cible.set3f(nom + 'position', tx, ty, z);
        cible.set1f(nom + 'soleil', 0);
        // Personnage affiché devant la source : mêmes règles qu'il soit dans son axe ou à côté, sans saut entre les deux
        const dos = z < 0 || (!!L.sourceObjet && (!!e || go.type === 'Sprite') && L.sourceObjet.depth < go.depth);
        cible.set1f(nom + 'decor', dos && L.sourceObjet ? 1 : 0);
        // L.attenuation(objet), facultatif : lampe masquée pour cet objet (ombre d'un auvent), 0 à 1
        // Source de décor : gain propre au décor autour d'elle, et au contre-jour d'un personnage passé devant
        let gain = L.sourceObjet ? (dos ? L.gainContre : L.gainDecor) || 1 : 1;
        // À côté de la source, le flanc reçoit une lumière franche ; derrière, seul le contour reste discret
        if (dos && L.cote && L.gainCote) {
          const zDos = Math.min(L.arriere / k, -15), t = Math.min(Math.max((z - zDos) / (L.cote.z - zDos), 0), 1);
          gain += (L.gainCote - gain) * t;
        }
        const force = gain * L.intensity * (L.attenuation ? L.attenuation(go) : 1);
        cible.set3f(nom + 'couleur', L.color.r * force, L.color.g * force, L.color.b * force);
        // La lumière part du bord de la forme : portée réduite d'autant, le bout de la lumière reste au même endroit
        const F = L.forme;
        cible.set1f(nom + 'portee', (L.radius - (F ? F.demi : 0)) / k);
        cible.set1f(nom + 'forme', F ? F.type : 0);
        if (F && F.type === 1) {
          const [a, b] = natif(F.points[0], F.points[1]), [c2, d] = natif(F.points[2], F.points[3]), [e3, f3] = natif(F.points[4], F.points[5]);
          cible.set4f(nom + 'formeA', a, b, c2, d);
          cible.set4f(nom + 'formeB', e3, f3, 0, 0);
        } else if (F) {
          const [a, b] = natif(F.cx, F.cy);
          cible.set4f(nom + 'formeA', a, b, F.hx / (sx * px), F.hy / (sy * py));
          cible.set4f(nom + 'formeB', F.r / ((sx * px + sy * py) / 2), 0, 0, 0);
        }
        return z;
      }

      preparer(go) {
        this.set1i('uMainSampler', 0);
        this.set1i('uNeutre', 2);
        this.set1i('uNormales', 3);
        this.set1i('uCj', 4);
        this.set1i('uNatif', 5);
        const ombre = this._reglages.ombre ? this._reglages.ombre(go) : 1;
        this.set3f('uCiel', this._ciel[0] * ombre, this._ciel[1] * ombre, this._ciel[2] * ombre);
        this.set3f('uSol', this._sol[0] * ombre, this._sol[1] * ombre, this._sol[2] * ombre);
        this.set1f('uDetail', this._detail);
        this.set1f('uEmissif', go.__lumiereEmissif || 0);
        const mq = this._reglages.masque;
        this.set4f('uMasqueAnim', mq ? mq.amp : 0, mq ? mq.t : 0, mq ? mq.bande : 0, mq ? 1 : 0);
        this.set4f('uTaches', ...((mq && mq.taches) || TACHES_COUPEES));
        if (mq) {
          const Mc = this._camera.matrix;
          this.set1i('uMasque', 6);
          this.set4f('uMasqueGeo', mq.pente, mq.u0, mq.cel, mq.n);
          this.set2f('uMasqueHaut', mq.haut, mq.plage);
          this.set4f('uMondeEcran', 1 / Mc.a, this._camera.scrollX - Mc.e / Mc.a, this._camera.scrollY - Mc.f / Mc.d, this.renderer.height);
        }
        this.set1f('uEpaule', this._epaule);
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
        // carte à la taille écran, affichée à son échelle, sans rotation, échelle entière : cases sur les pixels
        // (matrice réellement dessinée : elle contient le zoom du jeu, cf. ZoomKit)
        const M = cam && cam.matrix;
        if (e && e.np && cam && cam.roundPixels && Number.isInteger(M.a) && M.a === M.d && !go.rotation && !go.parentContainer
          && Math.abs(sx - e.ech) < 0.002 && Math.abs(sy - e.ech) < 0.002) {
          const z = M.a;
          const gauche = M.e + z * (go.x - (flipC ? W - go.displayOriginX : go.displayOriginX) * sx - cam.scrollX * go.scrollFactorX);
          const haut = M.f + z * (go.y - go.displayOriginY * sy - cam.scrollY * go.scrollFactorY);
          const ax = grilleSurEcran(gauche, W, sx * z, gx, e.np * z, false), ay = grilleSurEcran(haut, H, sy * z, gy, e.np * z, true);
          if (ax && ay) { px = ax.pas; cx = ax.coin; py = ay.pas; cy = ay.coin; }
        }
        const flip = !!go.flipX;
        const kx = sx * fx, ky = sy * fy;                  // px du monde par pixel natif
        const k = (kx + ky) / 2;
        // Rayon de canopée : il se pose sur 6 à 12 px du monde sous le haut du corps, selon la taille du sprite
        this.set1f('uOmbreSoleil', Math.max(6, Math.min(12, 0.14 * Math.min(w * kx, h * ky))) / k);
        this.set1f('uLueurCorps', this._reglages.lueurCorps ?? 0);
        this.set1f('uRayonAvant', this._reglages.rayonAvant ?? 0);
        this.set1f('uPerso', !e && go.type === 'Sprite' ? 1 : 0);
        const lampes = this._lampes, maxi = this.renderer.config.maxLights;
        // Seules les lampes qui peuvent atteindre l'objet (au-delà de la portée, leur lumière vaut 0) :
        // même image, beaucoup moins de calcul quand de nombreux objets sont éclairés
        const rayonObjet = Math.hypot(W * sx, H * sy);
        const G = { m, e, W, w, cx, cy, px, py, sx, sy, k, flip };
        let derriere = 0, nb = 0;
        for (let j = 0; j < lampes.length && nb < maxi; j++) {
          const L = lampes[j], atteinte = L.radius + rayonObjet;
          if (L.soleil) {
            const nomS = `uLumieres[${nb++}].`, f = L.intensity * (L.attenuation ? L.attenuation(go) : 1);
            this.set3f(nomS + 'position', L.soleil.x, L.soleil.y, L.soleil.z);
            this.set1f(nomS + 'soleil', 1);
            this.set3f(nomS + 'couleur', L.color.r * f, L.color.g * f, L.color.b * f);
            continue;
          }
          if (Math.abs(L.x - go.x) > atteinte || Math.abs(L.y - go.y) > atteinte) continue;
          if (this.envoyerLampe(this, nb++, L, go, G) < 15) derriere = 1;
        }
        this.set1i('uNbLumieres', nb);
        this.set1f('uCarte', e ? 1 : 0);
        const boucle = go.scene.game.loop;
        this.set1f('uAuSol', partAuSol(go, boucle.delta, boucle.frame));
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
        const gl = this.gl;
        const mq = this._reglages.masque;
        if (mq) { gl.activeTexture(gl.TEXTURE6); gl.bindTexture(gl.TEXTURE_2D, mq.tex.webGLTexture); gl.activeTexture(gl.TEXTURE0); }
        const c = this._textures;
        if (!c) return;
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, c.neutre.webGLTexture);
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, c.n.webGLTexture);
        gl.activeTexture(gl.TEXTURE4);
        gl.bindTexture(gl.TEXTURE_2D, c.cj.webGLTexture);
        gl.activeTexture(gl.TEXTURE5);
        gl.bindTexture(gl.TEXTURE_2D, c.natif.webGLTexture);
        gl.activeTexture(gl.TEXTURE0);
      }
    };
    return PipelineClasse;
  }

  // Distance du centre d'une lampe au point de sa forme le plus éloigné (px du monde)
  function etendueForme(L) {
    const F = L.forme;
    if (!F) return 0;
    if (F.type === 1) {
      const p = F.points;
      return Math.max(Math.hypot(p[0] - L.x, p[1] - L.y), Math.hypot(p[2] - L.x, p[3] - L.y), Math.hypot(p[4] - L.x, p[5] - L.y));
    }
    return Math.hypot(Math.abs(F.cx - L.x) + F.hx, Math.abs(F.cy - L.y) + F.hy);
  }

  // Profondeur d'une lampe pour un objet, en pixels natifs (k : px du monde par pixel natif). Une source de décor affichée
  // derrière un personnage l'éclaire par l'arrière, donc par sa carte contre-jour seule : -15 natif au moins, le seuil où
  // la lumière de face s'éteint complètement. Le décor, sur le même plan que la source, garde sa profondeur positive.
  // L.cote, facultatif : en s'écartant de la source (de `de` à `a` px du monde, depuis le bord de sa forme), la lampe glisse de derrière le personnage
  // à son côté, jusqu'à `z` natif : le flanc tourné vers elle s'allume, les plans de face restent sous le premier palier.
  function zLampe(L, go, perso, k) {
    return zLampeCalcul(L, go, perso, k);
  }

  // Règle « rien sous le sprite » : 1 pour un objet posé au sol ou sans corps mobile, 0 en l'air, en fondu de 120 ms.
  // image : numéro de l'image du jeu, pour n'avancer le fondu qu'une fois par image même avec plusieurs caméras.
  function partAuSol(go, ms, image) {
    const b = go.body;
    const pose = !b || b.physicsType === 1 || !!(b.blocked && b.blocked.down) || !!(b.touching && b.touching.down);
    const cible = pose ? 1 : 0;
    if (go.__lumiereAuSol === undefined) go.__lumiereAuSol = cible;
    else if (go.__lumiereImage !== image) {
      const pas = Math.min(ms / 120, 1);
      go.__lumiereAuSol += Math.max(-pas, Math.min(pas, cible - go.__lumiereAuSol));
    }
    go.__lumiereImage = image;
    return go.__lumiereAuSol;
  }

  // Centre et demi-largeur du corps visible d'un objet dans le monde (limites opaques de sa frame courante, en cache).
  // Sans frame lisible : son x, largeur nulle.
  function corpsMonde(go) {
    if (!go.frame || !go.frame.texture) return { cx: go.x, demi: 0 };
    const lim = limitesFrame(go.frame), W = go.frame.realWidth ?? go.frame.cutWidth;
    const mx = (x) => go.x + ((go.flipX ? W - x : x) - (go.displayOriginX ?? 0)) * (go.scaleX ?? 1);
    const a = mx(lim.x0), b = mx(lim.x1);
    return { cx: (a + b) / 2, demi: Math.abs(b - a) / 2 };
  }

  function zLampeCalcul(L, go, perso, k) {
    if (perso && L.sourceObjet && L.sourceObjet.depth < go.depth) {
      const dos = Math.min(L.arriere / k, -15);
      if (!L.cote) return dos;
      // Écart entre le bord de la forme et le bord du CORPS (et non son centre) : un grand personnage (grizzly) dont le
      // corps couvre la source reste derrière elle, contour seul, même si son centre en est loin
      const corps = corpsMonde(go);
      const ecart = (L.forme ? Math.abs(L.forme.cx - corps.cx) - L.forme.demi : Math.abs(L.x - corps.cx)) - corps.demi;
      const t = Math.min(Math.max((ecart - L.cote.de) / (L.cote.a - L.cote.de), 0), 1);
      // Personnage tourné vers la source : la lampe passe devant lui, son visage et sa poitrine reçoivent la lumière.
      // Le sens vient de facingDir / facing, car flipX dépend du sens dans lequel chaque animation est dessinée.
      const sens = go.facingDir ?? go.facing, cx = L.forme ? L.forme.cx : L.x;
      const tourne = L.cote.zFace !== undefined && !!sens && sens * (cx - corps.cx) > 0;
      return dos + ((tourne ? L.cote.zFace : L.cote.z) - dos) * t * t * (3 - 2 * t);
    }
    return (L.profondeur ?? DEFAUTS.profondeur) / k;
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
    if (!r.pipelines.has(NOM_PIPELINE)) {
      r.pipelines.add(NOM_PIPELINE, new (classePipeline())(scene.game));
      creerPipelinesDecor(r, scene.game);
    }
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
    return c ? Math.abs(o.scaleX) * c.e.fx * (o.scene.cameras.main.matrix.a || 1) : null;
  }

  // ---------------------------------------------------------------- objets qui émettent de la lumière
  // Une source de lumière n'est jamais assombrie par l'ambiance. Reconnue au nom de son image (ou à son mélange
  // additif). Le feu de camp est à part : ses flammes restent vives, ses bûches reçoivent la lumière du feu.
  const EMISSIFS = /champignons_lumineux|mousse_lumineuse|lanterne_allumee|luciole|cristal|portail|^item-fx_|juice-glow|halo|lueur|glow/;
  const FEU_DE_CAMP = /^decor-campfire-/;
  // Décor à petits champignons lumineux : sous-bois 6, 8 et 11 (mottes, voir Cassables.js), souches et étagères à
  // champignons. Seuls les pixels vifs (chapeaux) restent émissifs : sans ça ils ne brillaient que sous un rayon de la canopée
  const MOTTES_LUMINEUSES = /^decor-sous-bois-(6|8|11)$|souche_champignons|champignon_etagere/;
  const SEUIL_MOTTES = 0.6;
  // Plan d'arbres du fond : des champignons bleus sont peints au pied des troncs (arbres 3, 4, 6, 7, luminosité >= 0,74 ;
  // feuillage bleuté <= 0,61). Seuls ces pixels restent émissifs : sinon ils ne s'allumaient qu'au passage d'une tache
  // de lumière de la canopée, qui glisse sur ce plan lointain quand la caméra avance
  const ARBRES_FOND = /^decor-arbre-\d+/;
  const SEUIL_ARBRES_FOND = 0.72;
  const SEUIL_FLAMMES = 0.62;
  // RÈGLE : toute source visible déclare sa `forme` (clé de FORMES), calée sur les limites opaques de son image :
  // flamme = triangle, groupe large = rectangle, élément rond isolé = cercle. Jamais un point (test 20 de lumiere:tests).
  const FORMES = { triangle: 1, rectangle: 2, cercle: 2 };
  const SOURCES = {
    // profondeur : pour le décor du même plan ; arriere : pour un personnage affiché devant la source (contre-jour seul)
    feu: { forme: 'triangle', base: 0.45, couleur: 0xffc46e, intensite: 0.85, gainDecor: 1.4, gainContre: 1.2, gainCote: 1.3, portee: 317, profondeur: 60, arriere: -18, cote: { de: 0, a: 24, z: 8, zFace: 30 }, vacille: 0.1, halo: 280 },
    champignon: { forme: 'rectangle', couleur: 0x1caada, intensite: 1.3, portee: 112, profondeur: 30, arriere: -14, vacille: 0.05, halo: 0 },
    // Luciole qui éclaire vraiment : petite, sa lumière suit son clignotement (suitAlpha) et s'éteint avec elle
    luciole: { forme: 'cercle', couleur: 0xd8ffb0, intensite: 0.55, portee: 64, profondeur: 14, arriere: -10, vacille: 0.12, halo: 0, suitAlpha: true },
  };

  // Limites opaques d'une image RGBA : colonnes et lignes extrêmes ; haut : première ligne assez pleine (15 % de la plus
  // large), pour ne pas compter une étincelle isolée au-dessus des flammes
  function limitesAlpha(data, w, h) {
    const lignes = new Array(h).fill(0);
    let x0 = w, x1 = 0, y1 = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (data[(y * w + x) * 4 + 3] < 128) continue;
        lignes[y]++;
        if (x < x0) x0 = x;
        if (x + 1 > x1) x1 = x + 1;
        y1 = y + 1;
      }
    }
    const large = lignes.reduce((a, b) => Math.max(a, b), 0);
    return large ? { x0, x1, haut: lignes.findIndex((v) => v >= large * 0.15), bas: y1 } : { x0: 0, x1: w, haut: 0, bas: h };
  }

  // Limites opaques d'une frame, en px de la frame (mesurées une fois sur une copie réduite)
  const LIMITES = new Map();
  function limitesFrame(frame) {
    const cle = `${frame.texture.key}:${frame.name}`;
    if (LIMITES.has(cle)) return LIMITES.get(cle);
    const W = frame.cutWidth, H = frame.cutHeight, r = Math.min(1, 160 / Math.max(W, H));
    let lim = { x0: 0, x1: W, haut: 0, bas: H };
    try {
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(W * r));
      c.height = Math.max(1, Math.round(H * r));
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(frame.source.image, frame.cutX, frame.cutY, W, H, 0, 0, c.width, c.height);
      const m = limitesAlpha(ctx.getImageData(0, 0, c.width, c.height).data, c.width, c.height);
      const kx = W / c.width, ky = H / c.height;
      lim = { x0: m.x0 * kx, x1: m.x1 * kx, haut: m.haut * ky, bas: m.bas * ky };
    } catch (err) { /* image illisible : la frame entière */ }
    LIMITES.set(cle, lim);
    return lim;
  }

  // Limites d'un objet dans le monde. Animé : moyenne de toutes ses frames (forme fixe, sans suivi image par image)
  function limitesMonde(o) {
    const anim = o.anims && o.anims.currentAnim;
    const liste = (anim ? anim.frames.map((f) => f.frame) : [o.frame]).map(limitesFrame);
    const moy = (k) => liste.reduce((a, l) => a + l[k], 0) / liste.length;
    const W = o.frame.realWidth;
    const mx = (x) => o.x + ((o.flipX ? W - x : x) - o.displayOriginX) * o.scaleX;
    const my = (y) => o.y + (y - o.displayOriginY) * o.scaleY;
    const a = mx(moy('x0')), b = mx(moy('x1'));
    return { gauche: Math.min(a, b), droite: Math.max(a, b), haut: my(moy('haut')), bas: my(Math.max(...liste.map((l) => l.bas))) };
  }

  // Forme d'une source à partir de ses limites dans le monde. demi : demi-largeur, depuis laquelle se mesurent portée et écart
  // base : part de la largeur opaque occupée par le triangle (un feu : ses flammes, pas ses bûches)
  function formeMonde(nom, { gauche, droite, haut, bas }, base = 1) {
    const cx = (gauche + droite) / 2, cy = (haut + bas) / 2, hx = (droite - gauche) / 2, hy = (bas - haut) / 2;
    if (nom === 'triangle') { const b = hx * base; return { type: FORMES.triangle, points: [cx - b, bas, cx + b, bas, cx, haut], cx, cy, demi: b }; }
    if (nom === 'cercle') { const r = (hx + hy) / 2; return { type: FORMES.cercle, cx, cy, hx: r, hy: r, r, demi: r }; }
    return { type: FORMES.rectangle, cx, cy, hx, hy, r: Math.min(hx, hy) / 2, demi: hx };
  }

  // Affiche un objet avec ses couleurs d'origine. seuil : seuls les pixels au moins aussi vifs (0 à 1) restent émissifs
  function emissif(objets, seuil) {
    for (const o of [].concat(objets || [])) {
      if (!o) continue;
      o.__lumiereEmissif = seuil || 0;
      if (seuil) eclairer(o); else nePlusEclairer(o);
    }
    return objets;
  }

  // Halo autour d'un feu : fondu continu jusqu'à zéro, aucun bord visible
  function textureHalo(scene) {
    const cle = 'lumiere-halo-doux';
    if (scene.textures.exists(cle)) return cle;
    const T = 128, tex = scene.textures.createCanvas(cle, T, T), ctx = tex.getContext();
    const img = ctx.createImageData(T, T);
    for (let y = 0; y < T; y++) {
      for (let x = 0; x < T; x++) {
        const d = Math.min(1, Math.hypot(x + 0.5 - T / 2, y + 0.5 - T / 2) / (T / 2));
        const v = (1 - d * d) * (1 - d * d) * (1 - d);
        const i = (x + y * T) * 4;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
        img.data[i + 3] = Math.round(255 * v);
      }
    }
    ctx.putImageData(img, 0, 0);
    tex.refresh();
    tex.setFilter(Phaser.Textures.FilterMode.LINEAR);
    return cle;
  }

  // Un élément lumineux n'éclaire que tant qu'il est à l'écran : ni détruit, ni désactivé, ni caché, ni transparent
  function sourcePresente(o) {
    return !!(o && o.scene && o.active && o.visible && o.alpha > 0);
  }

  // Sources de la scène : feux de camp et champignons lumineux créent chacun leur lumière. Au plus `max` allumées,
  // les plus proches de la caméra, avec un fondu pour qu'aucune n'apparaisse d'un coup.
  function sourcesLumineuses(scene, { max = 4 } = {}) {
    const liste = [];
    let actives = true;
    const ajouter = (o, type) => {
      const def = SOURCES[type];
      const L = ajouterLumiere(scene, { x: o.x, y: o.y, portee: def.portee, couleur: def.couleur, intensite: 0, profondeur: def.profondeur });
      L.setVisible(false);
      L.sourceObjet = o;
      L.arriere = def.arriere;
      L.gainDecor = def.gainDecor;
      L.gainContre = def.gainContre;
      L.cote = def.cote;
      L.gainCote = def.gainCote;
      const s = { o, type, def, L, force: 0, allumee: false, ph: liste.length * 2.4, halo: null };
      if (def.halo) {
        s.halo = scene.add.image(o.x, o.y, textureHalo(scene)).setDisplaySize(def.halo, def.halo).setTint(def.couleur)
          .setBlendMode(Phaser.BlendModes.ADD).setDepth(o.depth - 0.5).setAlpha(0);
        s.halo.__lumiereEmissif = 0;
      }
      liste.push(s);
    };
    // Classe les objets apparus depuis le dernier passage
    const scanner = () => {
      for (const o of scene.children.list) {
        if (o.__lumiereVu || !o.texture) continue;
        o.__lumiereVu = true;
        const cle = o.texture.key;
        if (FEU_DE_CAMP.test(cle)) { emissif(o, SEUIL_FLAMMES); ajouter(o, 'feu'); }
        else if (/champignons_lumineux/.test(cle)) { emissif(o); ajouter(o, 'champignon'); }
        // mottes à champignons lumineux du sous-bois : leurs chapeaux brillent toujours (sinon ils ne s'allument que sous un
        // rayon ou une tache de lumière qui passe), le reste de la motte reste éclairé comme le décor
        else if (MOTTES_LUMINEUSES.test(cle)) emissif(o, SEUIL_MOTTES);
        else if (ARBRES_FOND.test(cle)) emissif(o, SEUIL_ARBRES_FOND);
        else if (o.blendMode === Phaser.BlendModes.ADD || EMISSIFS.test(cle)) emissif(o);
      }
      // Le halo en paliers remplace le halo doux et la flaque de lumière dessinés par le feu du jeu
      for (const f of scene.__campfires || []) if (f.halo) f.halo.setVisible(false);
      for (const o of scene.children.list) {
        if (o.texture && o.texture.key === 'item-fx_lueur_sol' && liste.some((s) => s.type === 'feu' && Math.abs(s.o.x - o.x) < 40)) o.setVisible(false);
      }
    };
    const maj = (dt) => {
      const v = scene.cameras.main.midPoint, t = scene.time.now / 1000;
      const proches = liste.filter((s) => sourcePresente(s.o) && Math.abs(s.o.x - v.x) < 900)
        .sort((a, b) => Math.abs(a.o.x - v.x) - Math.abs(b.o.x - v.x)).slice(0, max);
      let libres = max - liste.filter((s) => s.allumee && !proches.includes(s)).length;
      for (const s of proches) { if (s.allumee) libres--; }
      for (const s of liste) {
        // Élément cassé, caché ou détruit : sa lumière s'éteint avec lui, sans fondu
        if (!sourcePresente(s.o)) {
          s.force = 0;
          s.allumee = false;
          s.L.setVisible(false).setIntensity(0);
          if (s.halo) s.halo.setVisible(false).setAlpha(0);
          continue;
        }
        let cible = proches.includes(s) ? 1 : 0;
        if (cible && !s.allumee) { if (libres > 0) { s.allumee = true; libres--; } else cible = 0; }
        s.force += (cible - s.force) * (1 - Math.exp(-dt * 5));
        if (!cible && s.force < 0.01) { s.force = 0; s.allumee = false; }
        if (s.placeX !== s.o.x || s.placeY !== s.o.y) {
          s.placeX = s.o.x;
          s.placeY = s.o.y;
          s.L.forme = formeMonde(s.def.forme, limitesMonde(s.o), s.def.base);
        }
        const b = s.o.getBounds(), y = b.y + b.height * 0.6;
        const flamme = 1 + s.def.vacille * (0.5 * Math.sin(t * 7.3 + s.ph) + 0.3 * Math.sin(t * 13.1 + s.ph * 2) + 0.2 * Math.sin(t * 3.1 + s.ph));
        const clignote = s.def.suitAlpha ? s.o.alpha : 1;
        s.L.setPosition(s.o.x, y).setVisible(s.allumee).setIntensity(s.def.intensite * s.force * flamme * clignote);
        if (s.halo) s.halo.setPosition(Math.round(s.o.x), Math.round(y)).setVisible(actives).setAlpha(0.24 * s.force * flamme);
      }
    };
    // Source ajoutée ou retirée à la main (lucioles d'AmbianceEffets) : mêmes règles que celles trouvées par scanner()
    const retirer = (o) => {
      const i = liste.findIndex((s) => s.o === o);
      if (i < 0) return;
      const s = liste[i];
      scene.lights.removeLight(s.L);
      if (s.halo) s.halo.destroy();
      liste.splice(i, 1);
    };
    scanner();
    return {
      liste, scanner, maj, ajouter, retirer, actif: (oui) => { actives = oui; },
      get max() { return max; }, set max(v) { max = v; },
    };
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

  // Soleil : lumière DIRECTIONNELLE fixe. Même direction pour tous les pixels, indépendante de la caméra, du
  // joueur et de la position du sprite, sans portée ni atténuation. direction = vers le soleil (x droite,
  // y haut, z vers le spectateur). Ex. : LightKit.ajouterSoleil(this, { direction: { x: -0.25, y: 0.75, z: 0.6 } });
  // L.attenuation(objet), facultatif, le masque pour un objet (auvent). Ne pas le déplacer : il n'a pas de position.
  function ajouterSoleil(scene, options = {}) {
    const o = Object.assign({}, SOLEIL, options);
    const L = scene.lights.addLight(0, 0, 1, couleurDe(o.couleur), o.intensite);
    return regler(L, { direction: o.direction });
  }

  function deplacer(lumiere, x, y, profondeur) {
    lumiere.setPosition(x, y);
    if (profondeur !== undefined) lumiere.profondeur = profondeur;
    return lumiere;
  }

  function regler(lumiere, { couleur, intensite, portee, profondeur, direction } = {}) {
    if (direction !== undefined) {
      const k = Math.hypot(direction.x, direction.y, direction.z) || 1;
      lumiere.soleil = { x: direction.x / k, y: direction.y / k, z: direction.z / k };
    }
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

  // Réglages de rendu : { paliers: 2-5 ou 0 (lisse), contre: force du contre-jour, hemi, detail, ciel, sol, epaule, ombre, masque }.
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
    NOM_PIPELINE, DEFAUTS, SOLEIL, FRAG_MASQUE, masqueSoleil: masqueSoleilJs, PRESETS, AMBIANCES, FRAG, FRAG_ECLAIRAGE,
    zLampe, partAuSol, sourcePresente, FORMES, SOURCES, formeMonde, limitesAlpha, chargerCartes, filtrerCartes, demanderCartes, activer, desactiver, eclairer, nePlusEclairer, aDesCartes, cleDe, pixelEcran,
    ajouterLumiere, ajouterSoleil, emissif, sourcesLumineuses, deplacer, regler, suivre, retirerLumiere, ambiance, reglerRendu, modeTest, porteeConseillee,
  };
})();

// Node (npm run lumiere:tests) lit le shader pour le comparer au gabarit et à la version CPU.
if (typeof module !== 'undefined' && module.exports) { module.exports = LightKit; LightKit.grilleSurEcran = grilleSurEcran; }
