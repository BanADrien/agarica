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
  const DEFAUTS = { paliers: 4, contre: 1.5, ambiance: 0x5c5c5c, profondeur: 8, hemi: 0.05, detail: 0.7, ciel: null, sol: null, epaule: 0.8, ombre: null, lueurCorps: 0 };
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
  // G = hauteur où le rayon touche le décor (/ 1020), B = irrégularité des bords. Même calcul en JS : masqueSoleilJs.
  const FRAG_MASQUE = `
uniform sampler2D uMasque;
uniform vec4 uMasqueGeo;    // pente, debut, taille d'une cellule, nombre de cellules
uniform vec4 uMasqueAnim;   // balancement (px), temps, bande eclairee sous l'arrivee, actif
uniform vec4 uMondeEcran;   // px du monde par px du canvas, decalage x, decalage y, hauteur du canvas
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
  if (m.y > c.g * 1020.0 + uMasqueAnim.z) return 0.0;
  return c.r;
}
// Moyenne du masque autour du point : bords fondus pour les faisceaux et les taches du decor (r : rayon en px du monde)
float masqueDoux(vec2 m, float r) {
  float s = masqueSoleil(m) * 2.0;
  s += masqueSoleil(m + vec2(-1.0, -0.35) * r) + masqueSoleil(m + vec2(1.0, 0.35) * r);
  s += masqueSoleil(m + vec2(-0.66, 0.25) * r) + masqueSoleil(m + vec2(0.66, -0.25) * r);
  s += masqueSoleil(m + vec2(-0.33, -0.2) * r) + masqueSoleil(m + vec2(0.33, 0.2) * r);
  return s / 8.0;
}`;

  // masqueSoleil() du shader, ligne à ligne. M : { lire(v) -> { r, g, b }, pente, u0, cel, n, amp, t, bande }
  function masqueSoleilJs(m, M) {
    const { floor, sin } = Math, fract = (v) => v - Math.floor(v);
    const rangee = floor(m.y / 6.0);
    const j = (M.lire(fract(rangee * 0.0731)).b - 0.5) * 2.0 * M.cel;
    const u = m.x - M.pente * m.y + j;
    const bal = M.amp * sin(M.t * 0.7 + u * 0.011);
    const c = M.lire((floor((u + bal - M.u0) / M.cel) + 0.5) / M.n);
    if (m.y > c.g * 1020.0 + M.bande) return 0.0;
    return c.r;
  }

  const FRAG = `
#define SHADER_NAME LUMIERE_SECTIONS_FS
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
struct Lumiere {
  vec3 position;   // x, y : repere natif affiche du sprite (y vers le bas) ; z : profondeur native
                   // soleil : direction normalisee vers le soleil (x droite, y haut, z vers le spectateur)
  float soleil;    // 1 = directionnelle : ni position, ni portee, ni attenuation
  float decor;     // 1 = source de decor derriere le personnage : jamais sur ses plans de face
  vec3 couleur;    // couleur x intensite
  float portee;    // portee native
};
const int kMaxLights = %LIGHT_COUNT%;
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
uniform float uOmbreSoleil;       // rayon de canopee : distance remontee vers le soleil dans la silhouette (cases)
uniform float uPerso;             // 1 = personnage sans cartes : le rayon se pose sur le haut de sa silhouette
${FRAG_MASQUE}
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

vec3 ambianceHemi(vec3 n) {
  return mix(uSol, uCiel, 0.5 + 0.5 * n.y);
}

float epaule(float v) {
  if (v <= uEpaule || uEpaule >= 1.0) return v;
  float e = 1.0 - uEpaule;
  return uEpaule + e * (1.0 - exp((uEpaule - v) / e));
}

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

// Source de decor derriere un personnage : la carte contre-jour ne compte pas sur les plans tournes vers le spectateur
float expositionDecor(vec3 n, float ex) {
  return ex * (1.0 - smoothstep(0.9, 0.97, n.z));
}

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
  return max(palier(v), uLueurCorps * ms);
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
        float e = eclairage(n, uCarte > 0.5 ? nl : n, tc, L.position.xy, L.position.z, L.portee, lb, cjL);
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
      scene.load.image(cleCarte(url, 'natif'), `${e.d}/${e.n}_natif.png`);
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
      for (const q of ['neutre', 'n', 'cj', 'natif']) {
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
        cj: game.textures.get(cj).source[0].glTexture,
        natif: game.textures.get(game.textures.exists(cleCarte(url, 'natif')) ? cleCarte(url, 'natif') : cleCarte(url, 'neutre')).source[0].glTexture };
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
        this.set1i('uNatif', 5);
        const ombre = this._reglages.ombre ? this._reglages.ombre(go) : 1;
        this.set3f('uCiel', this._ciel[0] * ombre, this._ciel[1] * ombre, this._ciel[2] * ombre);
        this.set3f('uSol', this._sol[0] * ombre, this._sol[1] * ombre, this._sol[2] * ombre);
        this.set1f('uDetail', this._detail);
        this.set1f('uEmissif', go.__lumiereEmissif || 0);
        const mq = this._reglages.masque;
        this.set4f('uMasqueAnim', mq ? mq.amp : 0, mq ? mq.t : 0, mq ? mq.bande : 0, mq ? 1 : 0);
        if (mq) {
          const Mc = this._camera.matrix;
          this.set1i('uMasque', 6);
          this.set4f('uMasqueGeo', mq.pente, mq.u0, mq.cel, mq.n);
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
        this.set1f('uPerso', !e && go.type === 'Sprite' ? 1 : 0);
        const lampes = this._lampes, maxi = this.renderer.config.maxLights;
        // Seules les lampes qui peuvent atteindre l'objet (au-delà de la portée, leur lumière vaut 0) :
        // même image, beaucoup moins de calcul quand de nombreux objets sont éclairés
        const rayonObjet = Math.hypot(W * sx, H * sy);
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
          const i = nb++;
          m.applyInverse(L.x, L.y, this._pt);
          const D = this._pt.x + go.displayOriginX, Dy = this._pt.y + go.displayOriginY;
          const tx = flip ? w - (W - D - cx) / px : (D - cx) / px;
          const ty = (Dy - cy) / py;
          const z = zLampe(L, go, !!e || go.type === 'Sprite', k);
          if (z < 15) derriere = 1;
          const nom = `uLumieres[${i}].`;
          this.set3f(nom + 'position', tx, ty, z);
          this.set1f(nom + 'soleil', 0);
          this.set1f(nom + 'decor', z < 0 && L.sourceObjet ? 1 : 0);
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

  // Profondeur d'une lampe pour un objet, en pixels natifs (k : px du monde par pixel natif). Une source de décor affichée
  // derrière un personnage l'éclaire par l'arrière, donc par sa carte contre-jour seule : -15 natif au moins, le seuil où
  // la lumière de face s'éteint complètement. Le décor, sur le même plan que la source, garde sa profondeur positive.
  function zLampe(L, go, perso, k) {
    if (perso && L.sourceObjet && L.sourceObjet.depth < go.depth) return Math.min(L.arriere / k, -15);
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
    return c ? Math.abs(o.scaleX) * c.e.fx * (o.scene.cameras.main.matrix.a || 1) : null;
  }

  // ---------------------------------------------------------------- objets qui émettent de la lumière
  // Une source de lumière n'est jamais assombrie par l'ambiance. Reconnue au nom de son image (ou à son mélange
  // additif). Le feu de camp est à part : ses flammes restent vives, ses bûches reçoivent la lumière du feu.
  const EMISSIFS = /champignons_lumineux|mousse_lumineuse|lanterne_allumee|luciole|cristal|portail|^item-fx_|juice-glow|halo|lueur|glow/;
  const FEU_DE_CAMP = /^decor-campfire-/;
  const SEUIL_FLAMMES = 0.62;
  const SOURCES = {
    // profondeur : pour le décor du même plan ; arriere : pour un personnage affiché devant la source (contre-jour seul)
    feu: { couleur: 0xffc46e, intensite: 1.05, portee: 310, profondeur: 60, arriere: -18, vacille: 0.1, halo: 240 },
    champignon: { couleur: 0x5cf0d0, intensite: 0.85, portee: 150, profondeur: 30, arriere: -14, vacille: 0.05, halo: 0 },
  };

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
      const proches = liste.filter((s) => s.o.active && Math.abs(s.o.x - v.x) < 900)
        .sort((a, b) => Math.abs(a.o.x - v.x) - Math.abs(b.o.x - v.x)).slice(0, max);
      let libres = max - liste.filter((s) => s.allumee && !proches.includes(s)).length;
      for (const s of proches) { if (s.allumee) libres--; }
      for (const s of liste) {
        let cible = proches.includes(s) ? 1 : 0;
        if (cible && !s.allumee) { if (libres > 0) { s.allumee = true; libres--; } else cible = 0; }
        s.force += (cible - s.force) * (1 - Math.exp(-dt * 5));
        if (!cible && s.force < 0.01) { s.force = 0; s.allumee = false; }
        const b = s.o.getBounds(), y = b.y + b.height * 0.6;
        const flamme = 1 + s.def.vacille * (0.5 * Math.sin(t * 7.3 + s.ph) + 0.3 * Math.sin(t * 13.1 + s.ph * 2) + 0.2 * Math.sin(t * 3.1 + s.ph));
        s.L.setPosition(s.o.x, y).setVisible(s.allumee).setIntensity(s.def.intensite * s.force * flamme);
        if (s.halo) s.halo.setPosition(Math.round(s.o.x), Math.round(y)).setVisible(actives).setAlpha(0.18 * s.force * flamme);
      }
    };
    scanner();
    return { liste, scanner, maj, actif: (oui) => { actives = oui; } };
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
    zLampe, chargerCartes, filtrerCartes, activer, desactiver, eclairer, nePlusEclairer, aDesCartes, cleDe, pixelEcran,
    ajouterLumiere, ajouterSoleil, emissif, sourcesLumineuses, deplacer, regler, suivre, retirerLumiere, ambiance, reglerRendu, modeTest, porteeConseillee,
  };
})();

// Node (npm run lumiere:tests) lit le shader pour le comparer au gabarit et à la version CPU.
if (typeof module !== 'undefined' && module.exports) { module.exports = LightKit; LightKit.grilleSurEcran = grilleSurEcran; }
