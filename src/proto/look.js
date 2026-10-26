// PROTOTYPE « cohésion visuelle » (2026-10-26) -- chargé UNIQUEMENT par
// prototype/coherence.html. Retour utilisateur : « le rendu visuel est OK mais
// les éléments s'intègrent mal ». Ce fichier essaie, SANS toucher au code du
// jeu (un autre chantier le modifie en parallèle), les leviers qui font
// « coller » des images d'origines différentes : étalonnage commun, séparation
// des plans, liseré lumineux, ombres de contact, lumières, densité de pixels.
//
// Branchement (rien n'est modifié dans les fichiers du jeu) :
// - `buildLevelFromData` (LevelKit.js) est ENVELOPPÉE : la zone se construit
//   normalement, puis lookAttach() pose le rendu sur la scène ;
// - 3 caméras : FONDS (passe LookBackPipeline) → PRINCIPALE (plan de jeu,
//   passe LookWorldPipeline) → INTERFACE (aucun effet). Chaque objet est
//   rangé dans une seule caméra par son `cameraFilter`, recalculé à chaque
//   image d'après sa profondeur et sa parallaxe (cf. lookRoleOf). La caméra
//   principale reste `cameras.main` : suivi, secousses, zoom, cinématiques
//   inchangés ; les deux autres la recopient.
// - aucun corps physique, aucune hitbox, aucun minutage n'est touché : seuls
//   des objets d'affichage sont ajoutés (ombres, liserés) ou teintés.
//
// Paramètres d'URL (prototype/coherence.html?...) :
//   look=off|A|B|C      rendu actuel | cohésion + pixel unifié | cohésion + lisse
//                       | cohésion seule (densité de pixels inchangée)
//                       (défaut C, la variante recommandée après la critique des
//                       deux directeurs artistiques ; F8 : off → C → A → B)
//   zones=all           toutes les zones (défaut : ForetSombre1Scene seule) ;
//                       ou une liste de clés de scène séparées par des virgules
//   seed=1              décor procédural identique d'un essai à l'autre (0 = aléatoire)
//   pxchars=0           (A) décor sur la grille des tuiles, personnages gardés nets
//   Leviers (0 = coupé) : grade, planes, tiles, tilegrade, rim, shadow, lights,
//     vig, grain
//   Réglages fins : px (taille du bloc, A ; défaut 2.667 = grille des tuiles),
//     tilesat, tilehue, tilecon (ré-étalonnage de la terre des tuiles),
//     pxmode=avg|near, soft (B), tilefilter=nearest|linear, exp, con, sat,
//     map (carte de dégradé), amb (ambiance), blur, fog,
//     mist, bgbright, bgcon, tilebody, tilegrass (teintes hex), rimalpha, rimpx, rimtint (0 = liseré non teinté
//     par la lumière proche), shadowalpha, glow, overlay, raia (alpha du rai
//     de lune, multiplicateur), haloa (halo peint du feu, idem), fgtint (hex
//     sans 0x, ou none), proptint (hex : teinte de tous les décors posés)
(function () {
  'use strict';

  const params = new URLSearchParams(window.location.search);
  const num = (k, d) => {
    const v = params.get(k);
    if (v == null || v === '') return d;
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : d;
  };
  const on = (k) => params.get(k) !== '0' && params.get(k) !== 'off';

  // Grille des tuiles : 24 px de dessin affichés sur 64 px d'écran.
  const TILE_PIXEL = 64 / 24;
  const SHADOW_FALLBACK_KEY = 'look-shadow-ellipse';
  const RIM_DEPTH_OFFSET = 0.001;
  const LIGHT_RESCAN_FRAMES = 30;
  const LIGHT_DEBUG = params.has('lightdebug');

  const rgb = (hex) => [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255];

  // ---------------------------------------------------------------------------
  // Profils d'ambiance par zone (le « grade » de la zone). Seule la forêt
  // sombre est réglée finement ; les autres zones reçoivent un profil nuit
  // générique plus doux (zones=all).
  // ---------------------------------------------------------------------------
  // Réglages AFFINÉS après la critique de deux directeurs artistiques
  // (2026-10-26) ; les valeurs du premier prototype sont rappelées « (v1 : x) ».
  // Fil conducteur : une hiérarchie de VALEURS façon Hollow Knight (plan de
  // jeu aux noirs profonds, fonds calmes mais pas laiteux, sol = masse sombre
  // bordée d'herbe claire), des lumières qui éclairent sans voler la vedette
  // à Agarica, et des effets assez discrets pour ne pas faire « filtre ».
  const PROFILES = {
    foret_sombre: {
      grade: {
        // Noirs non relevés (v1 : ombres poussées à 0,12 vers le violet =
        // voile laiteux sur tout le plan de jeu) ; un cran de contraste.
        exposure: 1.04, contrast: 1.22, pivot: 0.3, sat: 1.0,
        // Carte de dégradé (ombres -> tons moyens -> lumières) : violet nuit,
        // bleu-violet, vert lunaire ; mélangée à 14 % (v1 : 20 %).
        mapLo: rgb(0x120a24), mapMid: rgb(0x4a4478), mapHi: rgb(0xd2f7e2), mapAmt: 0.14,
        shadowTint: rgb(0x3a2266), shadowAmt: 0.03,
        highTint: [0.9, 1.05, 1.0], highAmt: 0.3,
      },
      world: { ambient: [0.97, 0.95, 1.02], lightMul: 1, glow: 0.2 },
      back: {
        // Perspective atmosphérique plus franche mais sans « bouillie » : flou
        // 1,2 px (v1 : 1,8, les gros contours noirs de la peinture viraient au
        // gris), brume plus violette et plus légère (v1 : 0x262250 à 0,16,
        // trop bleue), un peu de contraste rendu au fond.
        blur: 1.2, bright: 0.78, sat: 0.64, contrast: 0.92,
        fog: rgb(0x1e1438), fogAmt: 0.1, mist: 0.15, mistBand: [0.42, 0.86],
        // Les lumières n'éclairent presque plus le fond (v1 : 0,45 = voile
        // saumon laiteux sur le tronc derrière le feu).
        ambient: [1, 1, 1], lightMul: 0.2,
      },
      // Pas de grain (v1 : 0,04) : un bruit par pixel d'écran se bat avec le
      // pixel art net (et Hollow Knight n'en a pas). Pas de vignette calculée
      // non plus : la vignette PEINTE de la zone est gardée (v1 la remplaçait
      // par une vignette violette plus douce aux bords : la clôture du départ
      // et le bord gauche remontaient de 25 à 44 L* en hautes lumières).
      // vig=0.32 rétablit la vignette calculée (et masque la peinte).
      vignette: 0, vigColor: rgb(0x4a3a68), grain: 0,
      // Liseré : UNE copie décalée vers le haut (v1 : deux copies à 0,24 qui
      // se cumulaient en calotte blanche = effet autocollant), vert lunaire,
      // teinté par la lumière la plus proche (chaud près du feu).
      rim: { color: 0x8ff0c0, alpha: 0.15, offsets: [[0, -1]], lightTint: 0.9 },
      shadow: { alpha: 0.78 },
      // Premier plan (touffes en parallaxe 1,08) : silhouette sombre qui
      // GARDE son liseré rose peint (v1 : 0x1a1226 l'éteignait : c'était la
      // « touche de rose » de la DA).
      fgTint: 0x6a4a8a,
      // Sous-bois derrière le sol (parallaxe 1, profondeur 0) : un cran plus
      // sombre que le plan de jeu.
      midTint: 0x8c84ac,
      // Tuiles de terrain : teinte multipliée SÉPARÉE pour le corps (masse
      // sombre, nettement sous la valeur du fond) et pour l'herbe (bord de
      // marche clair et lisible). v1 : une seule teinte violette qui éteignait
      // l'herbe et laissait la terre à la valeur du fond.
      tileTint: { body: 0xc0b4d8, grass: 0xd2dcc8 },
      // Ré-étalonnage des tuiles À LA SOURCE (pixels de leurs textures) : la
      // terre ORANGE était la seule couleur chaude et saturée de l'écran
      // (d'où l'effet « collé »). Terre gris-violet (v1 : magenta-mauve, le
      // rose devenait tout le sol), contraste interne ramené à 80 % autour de
      // sa moyenne (la grille de 2,67 px des tuiles se voit moins) ; herbe
      // vert lunaire plus claire (v1 : vert sombre terne).
      tileGrade: {
        warm: { hue: 285, hueAmt: 0.4, sat: 0.3, light: 1.0, contrast: 0.8 },
        green: { hue: 140, hueAmt: 0.3, sat: 0.85, light: 1.12 },
      },
      // Voile `ambient` existant (rectangle teinté) : alpha multiplié.
      overlay: 0.5,
      // Rai de lune : alpha du sprite ×0,6 (0,30 -> 0,18) ; avec le voile
      // réduit il devenait l'élément le plus clair de l'écran.
      raiAlpha: 0.6,
      // Halo peint du feu (fx_halo_doux) : ×0,6, la carte de lumière éclaire
      // déjà autour du feu (v1 : les deux halos se cumulaient en voile rose
      // laiteux sur le tronc du fond).
      haloAlpha: 0.6,
      // Lumières, par règle (cf. LIGHT_RULES) : feu plus serré, rai et
      // champignons moins forts (v1 : les points les plus clairs de l'écran).
      lights: {
        feu: { radius: 200, intensity: 0.62, glow: 0.22 },
        champignons: { intensity: 0.45, glow: 0.15 },
        rai: { intensity: 0.28, glow: 0.04 },
      },
      // Lucioles (v1 : 0,32 / 70 px, la clôture du départ doublait de valeur)
      // et lueur d'Agarica (v1 : 0,14 / 190 px ; le liseré suffit à la lire).
      fly: { intensity: 0.12, radius: 50, glow: 0.03 },
      self: { intensity: 0.08, radius: 140 },
    },
    nuit: {
      grade: {
        exposure: 1.03, contrast: 1.15, pivot: 0.3, sat: 0.95,
        mapLo: rgb(0x150d28), mapMid: rgb(0x55507f), mapHi: rgb(0xe0f7ea), mapAmt: 0.14,
        shadowTint: rgb(0x3a2266), shadowAmt: 0.04,
        highTint: [0.9, 1.04, 0.98], highAmt: 0.3,
      },
      world: { ambient: [0.94, 0.92, 1.0], lightMul: 1, glow: 0.2 },
      back: {
        blur: 1.2, bright: 0.8, sat: 0.62, contrast: 0.92,
        fog: rgb(0x221a40), fogAmt: 0.12, mist: 0.18, mistBand: [0.42, 0.86],
        ambient: [1, 1, 1], lightMul: 0.2,
      },
      vignette: 0, vigColor: rgb(0x4a3a68), grain: 0,
      rim: { color: 0x8ff0c0, alpha: 0.15, offsets: [[0, -1]], lightTint: 0.9 },
      shadow: { alpha: 0.6 },
      fgTint: 0x6a4a8a,
      midTint: 0x9a94b8,
      tileTint: { body: 0xb0a6c4, grass: 0xdce2d4 },
      tileGrade: {
        warm: { hue: 285, hueAmt: 0.3, sat: 0.4, light: 1.0, contrast: 0.8 },
        green: { hue: 140, hueAmt: 0.25, sat: 0.9, light: 1.08 },
      },
      overlay: 0.7,
      raiAlpha: 0.75,
      haloAlpha: 0.7,
      lights: {
        feu: { radius: 210, intensity: 0.62, glow: 0.22 },
        champignons: { intensity: 0.45, glow: 0.15 },
        rai: { intensity: 0.3, glow: 0.04 },
      },
      fly: { intensity: 0.12, radius: 50, glow: 0.03 },
      self: { intensity: 0.08, radius: 140 },
    },
  };

  const VARIANTS = {
    A: { label: 'A : cohésion + pixel unifié', pixel: TILE_PIXEL, pixelMode: 'avg', soft: 0, tileFilter: 'nearest' },
    B: { label: 'B : cohésion + rendu lisse', pixel: 0, pixelMode: 'avg', soft: 0.3, tileFilter: 'linear' },
    // Recommandée : l'étalonnage et la lumière font l'unité ; la finesse des
    // pixels n'est pas touchée (A abîme visages et décors, le lissage de B
    // floute le bord d'herbe = la ligne de marche).
    C: { label: 'C : cohésion seule (recommandée)', pixel: 0, pixelMode: 'avg', soft: 0, tileFilter: 'nearest' },
  };

  function profileFor(scene, data) {
    const bg = data && (typeof data.background === 'object' ? data.background && data.background.id : data.background);
    if (bg === 'fond_foret_sombre' || /ForetSombre/.test(scene.scene.key)) return PROFILES.foret_sombre;
    return PROFILES.nuit;
  }

  // Configuration complète d'un rendu (null = rendu actuel, rien n'est posé).
  function buildConfig(look, scene, data) {
    const v = VARIANTS[look];
    if (!v) return null;
    const P = profileFor(scene, data);
    const neutralGrade = {
      exposure: 1, contrast: 1, pivot: 0.3, sat: 1, mapLo: [0, 0, 0], mapMid: [0, 0, 0], mapHi: [1, 1, 1], mapAmt: 0,
      shadowTint: [0, 0, 0], shadowAmt: 0, highTint: [1, 1, 1], highAmt: 0,
    };
    const grade = on('grade') ? { ...P.grade } : neutralGrade;
    grade.exposure = num('exp', grade.exposure);
    grade.contrast = num('con', grade.contrast);
    grade.sat = num('sat', grade.sat);
    grade.mapAmt = num('map', grade.mapAmt);
    const amb = num('amb', null);
    const world = on('grade') ? { ...P.world } : { ambient: [1, 1, 1], lightMul: 1, glow: P.world.glow };
    if (amb != null) world.ambient = world.ambient.map((c) => c * amb / P.world.ambient[0]);
    world.glow = num('glow', world.glow);
    if (!on('lights')) world.glow = 0;
    const back = { ...P.back };
    back.blur = num('blur', back.blur);
    back.fogAmt = num('fog', back.fogAmt);
    back.mist = num('mist', back.mist);
    back.bright = num('bgbright', back.bright);
    back.contrast = num('bgcon', back.contrast);
    // fgtint=none : premier plan non teinté ; fgtint=6a4a8a : autre teinte.
    const fgParam = params.get('fgtint');
    const fgTint = fgParam === 'none' ? null : (fgParam ? parseInt(fgParam, 16) : P.fgTint);
    return {
      look,
      label: v.label,
      flipY: true,
      grade,
      world,
      back,
      planes: on('planes'),
      lights: on('lights'),
      lightRules: LIGHT_RULES.map((r) => ({ ...r, ...((P.lights && P.lights[r.id]) || {}) })),
      fly: P.fly,
      self: P.self,
      rim: on('rim') ? {
        ...P.rim,
        alpha: num('rimalpha', P.rim.alpha),
        px: num('rimpx', v.pixel ? 1.8 : 1.4),
        lightTint: num('rimtint', P.rim.lightTint || 0),
      } : null,
      shadow: on('shadow') ? { ...P.shadow, alpha: num('shadowalpha', P.shadow.alpha) } : null,
      vignette: on('vig') ? num('vig', P.vignette) : 0,
      vigColor: P.vigColor,
      grain: on('grain') ? num('grain', P.grain) : 0,
      pixel: num('px', v.pixel),
      pixelMode: params.get('pxmode') || v.pixelMode,
      // pxchars=0 : décor sur la grille, personnages (et tout ce qui est
      // au-dessus d'eux) gardés nets, par une 4e caméra.
      pixelChars: params.get('pxchars') !== '0',
      soft: num('soft', v.soft),
      tileFilter: params.get('tilefilter') || v.tileFilter,
      fgTint,
      midTint: P.midTint,
      // Teinte des tuiles : rattachée à l'étalonnage (grade=0 la coupe aussi) ;
      // tilebody / tilegrass (hex sans 0x) pour la régler.
      tileTint: on('grade') && on('tiles') ? {
        body: params.get('tilebody') ? parseInt(params.get('tilebody'), 16) : P.tileTint.body,
        grass: params.get('tilegrass') ? parseInt(params.get('tilegrass'), 16) : P.tileTint.grass,
      } : null,
      // tilegrade=0 : sans ré-étalonnage des textures de tuiles ;
      // tilesat / tilehue / tilecon : saturation, rotation et contraste
      // interne de la terre.
      tileGrade: on('grade') && on('tiles') && on('tilegrade') ? {
        warm: {
          ...P.tileGrade.warm,
          sat: num('tilesat', P.tileGrade.warm.sat),
          hueAmt: num('tilehue', P.tileGrade.warm.hueAmt),
          contrast: num('tilecon', P.tileGrade.warm.contrast || 1),
        },
        green: { ...P.tileGrade.green },
      } : null,
      overlay: num('overlay', P.overlay),
      raiAlpha: on('lights') ? num('raia', P.raiAlpha || 1) : 1,
      haloAlpha: on('lights') ? num('haloa', P.haloAlpha || 1) : 1,
      // propTint (hex) : teinte de tous les décors posés (essai, cf. compte rendu).
      propTint: params.get('proptint') ? parseInt(params.get('proptint'), 16) : (P.propTint || null),
    };
  }

  // Look courant (F8 le fait défiler) et zones concernées.
  const LOOK_ORDER = ['off', 'C', 'A', 'B'];
  let currentLook = (params.get('look') || 'C');
  currentLook = currentLook.toLowerCase() === 'off' ? 'off' : currentLook.toUpperCase();
  if (!LOOK_ORDER.includes(currentLook)) currentLook = 'C';
  const zonesParam = params.get('zones');
  function lookWantedFor(scene) {
    if (zonesParam === 'all') return true;
    const list = zonesParam ? zonesParam.split(',') : ['ForetSombre1Scene'];
    return list.includes(scene.scene.key);
  }

  // ---------------------------------------------------------------------------
  // Rangement des objets par caméra
  // ---------------------------------------------------------------------------
  // 'ui'    : HUD (parallaxe 0, profondeur >= 1000), bulles et invites
  //           (conteneurs/textes >= 1030), popups, débogage, voile de fondu ;
  // 'back'  : tout ce qui défile à moins de 0,5 sous la profondeur 100 (ciel,
  //           peinture lointaine, arbres du fond, lianes du plafond) ;
  // 'world' : le reste (sol, décors, personnages, effets, premier plan).
  function lookRoleOf(o) {
    const d = o.depth;
    const sf = o.scrollFactorX;
    if (d >= 1000 && sf === 0) return 'ui';
    if (d >= 1045) return 'ui';
    if (d >= 1030 && (o.type === 'Container' || o.type === 'Text')) return 'ui';
    if (d < 100 && sf < 0.5) return 'back';
    return 'world';
  }

  const texKey = (o) => (o && o.texture && o.texture.key) || '';

  // ---------------------------------------------------------------------------
  // Sol sous un point : colonnes de 64 px -> hauts des corps de tuiles.
  // ---------------------------------------------------------------------------
  function buildGroundColumns(scene) {
    const cols = new Map();
    const add = (left, right, top) => {
      for (let c = Math.floor(left / 64); c <= Math.floor((right - 1) / 64); c++) {
        if (!cols.has(c)) cols.set(c, []);
        cols.get(c).push({ left, right, top });
      }
    };
    if (scene.ground) {
      scene.ground.children.iterate((t) => {
        if (t && t.active && t.body) add(t.body.left, t.body.right, t.body.top);
      });
    }
    return cols;
  }

  function groundBelow(st, x, feetY, tol = 6) {
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
  // Lumières : règles par type d'objet (couleur, rayon px, intensité de la
  // carte de lumière, halo additif, position relative au centre visible).
  // ---------------------------------------------------------------------------
  const LIGHT_RULES = [
    { id: 'feu', test: (o) => texKey(o).startsWith('decor-campfire'), color: 0xffa06a, radius: 250, intensity: 0.72, glow: 0.35, dy: -0.15, flicker: 0.1 },
    { id: 'champignons', test: (o) => (o.propType || '').includes('champignons_lumineux'), color: 0x66e6ff, radius: 160, intensity: 0.6, glow: 0.22, dy: -0.1, pulse: 0.08 },
    { id: 'souche', test: (o) => (o.propType || '').includes('souche_champignons'), color: 0x7fd8ff, radius: 120, intensity: 0.4, glow: 0.12, dy: -0.15, pulse: 0.06 },
    { id: 'mousse', test: (o) => texKey(o).startsWith('item-decor_mousse_lumineuse'), color: 0x9dffb4, radius: 110, intensity: 0.38, glow: 0.1, dy: 0 },
    { id: 'rai', test: (o) => texKey(o) === 'item-fx_rai_lumiere', color: 0xbfe6ff, radius: 210, intensity: 0.5, glow: 0.1, dy: 0.3 },
    { id: 'lanterne', test: (o) => texKey(o) === 'item-decor_lanterne_allumee', color: 0x9fffc8, radius: 170, intensity: 0.6, glow: 0.2, dy: -0.1 },
  ];
  const FIREFLY_MAX = 6;

  function scanStaticLights(scene, st) {
    st.staticLights = [];
    const rules = st.cfg.lightRules || LIGHT_RULES;
    for (const o of scene.children.list) {
      if (!o.active || o.scrollFactorX !== 1) continue;
      const rule = rules.find((r) => r.test(o));
      if (rule) st.staticLights.push({ obj: o, rule, seed: st.staticLights.length * 1.7 });
    }
  }

  // ---------------------------------------------------------------------------
  // Attache / détache
  // ---------------------------------------------------------------------------
  function lookAttach(scene, data) {
    // Donnée de zone gardée pour un retour F8 depuis « off ».
    if (data) scene.__lookLastData = data;
    else data = scene.__lookLastData;
    lookDetach(scene);
    if (!lookWantedFor(scene) || currentLook === 'off') return;
    const cfg = buildConfig(currentLook, scene, data);
    if (!cfg || !lookEnsurePipelines(scene.game)) return;
    const main = scene.cameras.main;
    const { width, height } = scene.scale;
    const st = {
      cfg, data, main,
      tinted: [], rims: new Map(), shadows: new Map(), propShadows: [], blendSwapped: new Set(),
      dimmed: [], plateaus: new Map(), lightWorld: [],
      staticLights: [], lightScanAt: 0, frameNo: -1,
      frame: {
        time: 0, scrollX: 0, scrollY: 0, lightCount: 0,
        lights: new Float32Array(4 * LOOK_MAX_LIGHTS), lightCols: new Float32Array(4 * LOOK_MAX_LIGHTS),
      },
      handlers: [],
      restore: [],
    };
    scene.__look = st;
    const look = { cfg, frame: st.frame };

    // --- Caméras : FONDS -> PRINCIPALE -> [PERSONNAGES] -> INTERFACE --------
    // (PERSONNAGES : seulement avec pxchars=0 en variante A, cf. lookRoleOf.)
    st.back = cfg.planes ? scene.cameras.add(0, 0, width, height, false, 'look-back') : null;
    st.front = cfg.pixel > 1 && !cfg.pixelChars ? scene.cameras.add(0, 0, width, height, false, 'look-front') : null;
    st.ui = scene.cameras.add(0, 0, width, height, false, 'look-ui');
    const cams = scene.cameras.cameras;
    if (st.back) {
      cams.splice(cams.indexOf(st.back), 1);
      cams.unshift(st.back);
      st.back.inputEnabled = false;
    }
    if (st.front) st.front.inputEnabled = false;
    st.ui.inputEnabled = false;
    st.ids = { back: st.back ? st.back.id : 0, world: main.id, front: st.front ? st.front.id : 0, ui: st.ui.id };
    st.allIds = st.ids.back | st.ids.world | st.ids.front | st.ids.ui;

    main.setPostPipeline('LookWorldPipeline');
    lookPipelineOf(main, 'LookWorldPipeline').look = look;
    if (st.back) {
      st.back.setPostPipeline('LookBackPipeline');
      lookPipelineOf(st.back, 'LookBackPipeline').look = look;
    }
    if (st.front) {
      // Même étalonnage et mêmes lumières, sans la grille ni le halo (déjà
      // ajouté par la passe principale, en dessous).
      st.front.setPostPipeline('LookWorldPipeline');
      const fp = lookPipelineOf(st.front, 'LookWorldPipeline');
      fp.look = look;
      fp.lookPart = 'front';
    }

    const basePre = Phaser.Cameras.Scene2D.Camera.prototype.preRender;
    // Caméra principale : calcule les uniformes de l'image une fois son
    // défilement final connu (suivi appliqué dans son preRender).
    main.preRender = function () {
      basePre.call(this);
      lookComputeFrame(scene, st);
    };
    const mirror = (cam) => {
      cam.setScroll(main.scrollX, main.scrollY);
      cam.setZoom(main.zoomX, main.zoomY);
      cam.setRotation(main.rotation);
    };
    // Secousse de la caméra principale recopiée telle quelle (décalage tiré
    // dans son update, appliqué à sa matrice dans preRender).
    const mirrorShake = (cam) => {
      const sh = main.shakeEffect;
      if (sh && sh.isRunning) cam.matrix.translate(sh._offsetX, sh._offsetY);
    };
    // Fondu de la caméra principale (cinématiques) : les caméras rendues
    // APRÈS elle (personnages, interface) suivent par leur alpha.
    const mirrorFade = (cam) => {
      const fe = main.fadeEffect;
      cam.alpha = fe && (fe.isRunning || fe.isComplete) ? 1 - fe.alpha : 1;
    };
    if (st.back) {
      // Rendue AVANT la principale : on lui fait d'abord calculer sa position
      // de l'image (suivi à lerp 1 : rappeler preRender ne change rien).
      st.back.preRender = function () {
        main.preRender();
        mirror(this);
        basePre.call(this);
        mirrorShake(this);
      };
    }
    for (const cam of [st.front, st.ui]) {
      if (!cam) continue;
      cam.preRender = function () {
        mirror(this);
        mirrorFade(this);
        basePre.call(this);
        mirrorShake(this);
      };
    }

    // --- Plans : premier plan en silhouettes, sous-bois un cran plus sombre ;
    // tuiles ramenées vers la nuit (étalonnage) ------------------------------
    for (const o of scene.children.list) {
      const k = texKey(o);
      if (!o.setTint) continue;
      if (cfg.planes && (k.startsWith('decor-plante-b') || (o.scrollFactorX > 1.01 && o.depth >= 990 && o.depth < 1000.1))) {
        if (cfg.fgTint != null) lookTint(st, o, cfg.fgTint);
      } else if (cfg.planes && k.startsWith('decor-sous-bois')) lookTint(st, o, cfg.midTint);
      // (Tuiles du second plan déjà teintées par LevelKit : laissées telles
      // quelles.) Corps et herbe teintés séparément : masse sombre + bord clair.
      else if (cfg.tileTint != null && k.startsWith('autotile-') && !o.isTinted) {
        lookTint(st, o, /grass/.test(k) ? cfg.tileTint.grass : cfg.tileTint.body);
      }
      // Rai de lune : alpha atténué (suivi à chaque image, cf. lookSyncDimmed).
      if (cfg.raiAlpha !== 1 && k === 'item-fx_rai_lumiere') st.dimmed.push({ o, k: cfg.raiAlpha, base: o.alpha, set: null });
      if (cfg.haloAlpha !== 1 && k === 'item-fx_halo_doux' && o.scrollFactorX === 1) st.dimmed.push({ o, k: cfg.haloAlpha, base: o.alpha, set: null });
    }
    lookSyncDimmed(st);
    if (cfg.propTint != null) {
      for (const pr of scene.props || []) if (pr.active && pr.setTint && !pr.isTinted) lookTint(st, pr, cfg.propTint);
    }
    // Vignette peinte d'origine (MULTIPLY) : gardée par défaut ; remplacée
    // par celle des passes seulement si vig > 0.
    if (cfg.vignette > 0 && scene.ambientVignette && scene.ambientVignette.active) {
      const v = scene.ambientVignette;
      const was = v.visible;
      v.setVisible(false);
      st.restore.push(() => { if (v.active) v.setVisible(was); });
    }
    if (scene.ambientOverlay && scene.ambientOverlay.active && cfg.overlay !== 1) {
      const o = scene.ambientOverlay;
      const a = o.fillAlpha;
      o.fillAlpha = a * cfg.overlay;
      st.restore.push(() => { if (o.active) o.fillAlpha = a; });
    }
    // Page ouverte en fichier (file://) : le canevas est « souillé » et
    // getImageData lève une SecurityError ; on garde alors les tuiles
    // d'origine plutôt que de casser tout le rendu.
    if (cfg.tileGrade) {
      try {
        lookGradeTileTextures(scene, st, cfg.tileGrade);
      } catch (err) {
        console.warn('[look] ré-étalonnage des tuiles impossible (page en file:// ?)', err && err.name);
      }
    }
    // Densité de pixels B : tuiles en LINEAR (rendues NEAREST par BootScene).
    if (cfg.tileFilter === 'linear') lookSetTileFilter(scene, Phaser.Textures.FilterMode.LINEAR, st);

    st.columns = buildGroundColumns(scene);
    if (cfg.shadow) lookAddPropShadows(scene, st);
    scanStaticLights(scene, st);

    const onPostUpdate = () => lookPostUpdate(scene, st);
    const onPreRender = () => lookClassify(scene, st);
    scene.events.on('postupdate', onPostUpdate);
    scene.events.on('prerender', onPreRender);
    st.handlers.push(['postupdate', onPostUpdate], ['prerender', onPreRender]);
    const onShutdown = () => lookDetach(scene);
    scene.events.once('shutdown', onShutdown);
    st.handlers.push(['shutdown', onShutdown]);
    lookClassify(scene, st);
  }

  function lookPipelineOf(cam, name) {
    const p = cam.getPostPipeline(name);
    return Array.isArray(p) ? p[0] : p;
  }

  function lookTint(st, o, tint) {
    st.tinted.push({ o, isTinted: o.isTinted, tl: o.tintTopLeft, tr: o.tintTopRight, bl: o.tintBottomLeft, br: o.tintBottomRight });
    o.setTint(tint);
  }

  function lookSetTileFilter(scene, mode, st) {
    if (typeof BootScene === 'undefined' || !BootScene.activeTilesetFiles) return;
    if (!AUTOTILE_TILESETS[AUTOTILE_TILESET].pixelArt) return;
    const keys = BootScene.activeTilesetFiles().map(([key]) => key);
    for (const key of keys) {
      const t = scene.textures.get(key);
      if (t) t.setFilter(mode);
    }
    if (st) st.restore.push(() => lookSetTileFilter(scene, Phaser.Textures.FilterMode.NEAREST, null));
  }

  // Ré-étalonnage des textures de tuiles : chaque image du jeu de tuiles actif
  // est redessinée sur un canevas, ses pixels passés en TSL (teinte,
  // saturation, luminosité) puis renvoyés DANS LA MÊME texture WebGL (même
  // clé, mêmes cadres, mêmes filtres) : rien ne change pour le jeu (les
  // cartes d'alpha des tuiles, lues sur l'image d'origine, restent les mêmes)
  // et l'image d'origine est renvoyée au détachement (F8, sortie de zone).
  // Coût : une fois à l'entrée dans la zone (quelques dizaines de cases de
  // 24 px), rien à l'image.
  function lookGradeTileTextures(scene, st, tg) {
    if (typeof BootScene === 'undefined' || !BootScene.activeTilesetFiles) return;
    // 1re passe : lecture de toutes les cases, et luminosité moyenne de la
    // terre sur TOUT le jeu (même pivot de contraste pour chaque case : les
    // cases voisines restent raccord).
    const items = [];
    let lSum = 0;
    let lCount = 0;
    for (const [key] of BootScene.activeTilesetFiles()) {
      if (!scene.textures.exists(key)) continue;
      const src = scene.textures.get(key).source[0];
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
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] === 0) continue;
        const mx = Math.max(d[i], d[i + 1], d[i + 2]);
        const mn = Math.min(d[i], d[i + 1], d[i + 2]);
        if (mx === mn || tileBand(d[i], d[i + 1], d[i + 2]) !== 'warm') continue;
        lSum += (mx + mn) / 510;
        lCount++;
      }
      items.push({ src, gt, w, h, cv, ctx, img });
    }
    const pivot = lCount ? lSum / lCount : 0.3;
    for (const { src, gt, w, h, cv, ctx, img } of items) {
      gradeTilePixels(img.data, tg, pivot);
      ctx.putImageData(img, 0, 0);
      const saved = {
        pixels: gt.pixels || src.image, flipY: gt.flipY, wrapS: gt.wrapS, wrapT: gt.wrapT,
        minFilter: gt.minFilter, magFilter: gt.magFilter, format: gt.format,
      };
      gt.update(cv, w, h, saved.flipY, saved.wrapS, saved.wrapT, saved.minFilter, saved.magFilter, saved.format);
      st.restore.push(() => {
        gt.update(saved.pixels, w, h, saved.flipY, saved.wrapS, saved.wrapT, saved.minFilter, saved.magFilter, saved.format);
      });
    }
  }

  // Bande de teinte d'un pixel : verts (herbe) ou le reste (terre chaude).
  function tileBand(r, g, b) {
    const mx = Math.max(r, g, b);
    const mn = Math.min(r, g, b);
    const dd = mx - mn;
    let hh;
    if (mx === r) hh = ((g - b) / dd + 6) % 6;
    else if (mx === g) hh = (b - r) / dd + 2;
    else hh = (r - g) / dd + 4;
    const h = hh * 60;
    return h > 60 && h < 200 ? 'green' : 'warm';
  }

  // Pixels RGBA (non prémultipliés, ceux du canevas 2D) : la terre (teintes
  // chaudes) et l'herbe (verts) ont chacune leur réglage ; les gris purs
  // (contours noirs) ne bougent pas. `pivot` : luminosité moyenne de la terre,
  // autour de laquelle son contraste interne est réduit (`contrast` < 1).
  function gradeTilePixels(d, tg, pivot) {
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] === 0) continue;
      const r = d[i] / 255;
      const g = d[i + 1] / 255;
      const b = d[i + 2] / 255;
      const mx = Math.max(r, g, b);
      const mn = Math.min(r, g, b);
      const dd = mx - mn;
      if (dd < 1e-4) continue;
      const l = (mx + mn) / 2;
      const s = dd / (1 - Math.abs(2 * l - 1));
      let hh;
      if (mx === r) hh = ((g - b) / dd + 6) % 6;
      else if (mx === g) hh = (b - r) / dd + 2;
      else hh = (r - g) / dd + 4;
      const h = hh * 60;
      const band = h > 60 && h < 200 ? tg.green : tg.warm;
      const dh = ((band.hue - h + 540) % 360) - 180;
      const h2 = (h + dh * band.hueAmt + 360) % 360;
      const s2 = Math.min(1, s * band.sat);
      // Contraste réduit, sauf sur les contours très sombres (silhouette des
      // tuiles gardée nette).
      const kc = Phaser.Math.Clamp((l - 0.05) / 0.07, 0, 1);
      const lc = band.contrast != null && pivot != null ? l + (pivot + (l - pivot) * band.contrast - l) * kc : l;
      const l2 = Phaser.Math.Clamp(lc * band.light, 0, 1);
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

  function lookDetach(scene) {
    const st = scene.__look;
    if (!st) return;
    scene.__look = null;
    for (const [ev, fn] of st.handlers) scene.events.off(ev, fn);
    for (const fn of st.restore) fn();
    for (const d of st.dimmed) {
      if (d.o.active) d.o.alpha = d.base;
      delete d.o.__lookBaseAlpha;
    }
    for (const t of st.tinted) {
      const o = t.o;
      if (!o.active) continue;
      if (t.isTinted) o.setTint(t.tl, t.tr, t.bl, t.br); else o.clearTint();
    }
    for (const r of st.rims.values()) for (const c of r) c.destroy();
    for (const s of st.shadows.values()) s.destroy();
    for (const s of st.propShadows) s.destroy();
    for (const o of st.blendSwapped) {
      if (o.active && o.blendMode === window.LOOK_ADD_BLEND) o.blendMode = Phaser.BlendModes.ADD;
    }
    const main = st.main;
    if (main && main.scene) {
      delete main.preRender;
      main.resetPostPipeline(true);
    }
    for (const cam of [st.back, st.front, st.ui]) {
      if (cam && cam.scene) scene.cameras.remove(cam, true);
    }
    if (scene.children) for (const o of scene.children.list) o.cameraFilter = 0;
  }

  // ---------------------------------------------------------------------------
  // À chaque image
  // ---------------------------------------------------------------------------
  function lookClassify(scene, st) {
    const ids = st.ids;
    const ADD = Phaser.BlendModes.ADD;
    for (const o of scene.children.list) {
      let role = lookRoleOf(o);
      if (role === 'back' && !ids.back) role = 'world';
      // Variante A « personnages nets » : tout ce qui est à la profondeur des
      // personnages ou au-dessus (liserés compris, ombres non) passe sans grille.
      if (role === 'world' && ids.front && o.depth >= CHARACTER_DEPTH - 0.01) role = 'front';
      o.cameraFilter = st.allIds & ~ids[role];
      // ADD dans un tampon de caméra : « ADD sans alpha » (cf. look_shaders.js).
      if (role !== 'ui' && o.blendMode === ADD && window.LOOK_ADD_BLEND != null) {
        o.blendMode = window.LOOK_ADD_BLEND;
        st.blendSwapped.add(o);
      }
    }
  }

  // Personnages : sprites à la profondeur des personnages, dans le monde.
  function isCharacter(o) {
    return o.type === 'Sprite' && o.depth === CHARACTER_DEPTH && o.scrollFactorX === 1
      && o.blendMode === Phaser.BlendModes.NORMAL && !o.__lookCopy;
  }

  // Objets à alpha atténué (rai de lune) : si le jeu a changé leur alpha
  // depuis (fondu de cinématique, tween), c'est la nouvelle base ; sinon on
  // garde la base connue. L'alpha d'origine est rendu au détachement.
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
    if (!scene.sys.isActive() && !scene.sys.isPaused()) return;
    const cfg = st.cfg;
    lookSyncDimmed(st);
    const seen = new Set();
    for (const o of scene.children.list) {
      if (!o.active || !isCharacter(o)) continue;
      seen.add(o);
      if (cfg.rim) lookSyncRim(scene, st, o);
      if (cfg.shadow) lookSyncShadow(scene, st, o);
    }
    // Personnages détruits : leurs copies partent avec eux.
    for (const [o, copies] of st.rims) {
      if (!seen.has(o)) { for (const c of copies) c.destroy(); st.rims.delete(o); }
    }
    for (const [o, s] of st.shadows) {
      if (!seen.has(o)) { s.destroy(); st.shadows.delete(o); }
    }
  }

  // Liseré lumineux : copie de la silhouette, teintée pleine (vert lunaire),
  // en ADD, décalée vers le haut et glissée JUSTE SOUS tous les personnages :
  // seule la frange qui dépasse du contour se voit (lumière de lune venue de
  // derrière, sur la tête et les épaules). Une seule copie (v1 : deux copies
  // décalées en x qui se cumulaient sur le haut = détourage « autocollant »).
  // Sa couleur glisse vers celle de la lumière la plus forte à portée (chaude
  // près du feu, cyan près des champignons) : le liseré « vient » de la scène.
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
    const b = rgb(r.color);
    const mix = (i) => Math.round(255 * (b[i] + (col[i] - b[i]) * w));
    return (mix(0) << 16) | (mix(1) << 8) | mix(2);
  }

  function lookSyncRim(scene, st, src) {
    const r = st.cfg.rim;
    let copies = st.rims.get(src);
    if (!copies) {
      const offs = r.offsets || [[-0.35, -1], [0.35, -1]];
      copies = offs.map(([ox, oy]) => {
        const c = scene.add.image(src.x, src.y, src.texture.key, src.frame.name)
          .setBlendMode(Phaser.BlendModes.ADD).setTintFill(r.color);
        c.__lookCopy = true;
        c.__lookOff = [ox * r.px, oy * r.px];
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
      c.setAlpha(src.alpha * r.alpha);
      c.setDepth(src.depth - RIM_DEPTH_OFFSET);
    }
  }

  function shadowKey(scene) {
    if (scene.textures.exists('item-fx_ombre_sol')) return 'item-fx_ombre_sol';
    if (!scene.textures.exists(SHADOW_FALLBACK_KEY)) {
      const t = scene.textures.createCanvas(SHADOW_FALLBACK_KEY, 128, 44);
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
    return SHADOW_FALLBACK_KEY;
  }

  // Ombre de contact d'un personnage : sur le sol SOUS ses pieds (pas sous le
  // bas du sprite), largeur de l'appui visible, s'efface et rétrécit en l'air.
  function lookSyncShadow(scene, st, src) {
    let sh = st.shadows.get(src);
    if (!sh) {
      sh = scene.add.image(src.x, src.y, shadowKey(scene)).setDepth(CHARACTER_DEPTH - 0.6);
      sh.__lookCopy = true;
      st.shadows.set(src, sh);
    }
    const box = typeof objectVisibleBox === 'function' ? objectVisibleBox(src) : null;
    const feet = src.body ? src.body.bottom : (box ? box.bottom : src.y);
    let ground = groundBelow(st, src.x, feet);
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
    // Petits personnages (Xara) : ombre plus serrée (v1 : même marge que
    // pour Agarica, trop large pour une araignée).
    let w = (base < 26 ? base * 1.3 + 6 : base * 1.6 + 18) * (0.55 + 0.45 * k);
    let cx = box ? (box.baseLeft + box.baseRight) / 2 : src.x;
    let y = ground + 2;
    let alphaMul = 1;
    if (onProp) {
      // Perché sur un décor (Xara sur sa souche) : l'ombre ne déborde pas
      // du dessus du décor (v1 : une tache sombre flottait dans le vide de
      // part et d'autre) ; posée sous les pieds (le haut visible du décor
      // est souvent son bord arrière, plus haut que le plateau).
      const span = lookPlateauAt(scene, st, src.x, ground);
      if (span) {
        w = Math.min(w, (span[1] - span[0]) * 0.9);
        cx = Phaser.Math.Clamp(cx, span[0] + w / 2, span[1] - w / 2);
      }
      y = Math.max(ground, feet - 1) + 1;
      alphaMul = 0.75;
    }
    sh.setVisible(k > 0.02);
    sh.setDisplaySize(w, Math.max(5, w * 0.26));
    // Un peu sous la ligne de marche : l'ellipse mord sur le dessus du sol.
    sh.setPosition(cx, y);
    sh.setAlpha(st.cfg.shadow.alpha * k * src.alpha * alphaMul);
  }

  // Étendue horizontale [gauche, droite] du dessus d'un décor autour de `x`
  // (colonnes dont le haut visible reste à moins de 8 px de `top`). Mise en
  // cache : un personnage perché ne bouge presque pas.
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

  // Décors posés au sol : une ombre fixe glissée juste sous chacun.
  function lookAddPropShadows(scene, st) {
    const key = shadowKey(scene);
    const targets = [];
    for (const p of scene.props || []) {
      if (!p.active || p.__noPropSurface || /toile/.test(p.propType || '')) continue;
      targets.push({ o: p, k: 1 });
    }
    for (const o of scene.children.list) {
      const k = texKey(o);
      if (k.startsWith('decor-campfire') || k === 'item-mousse_amas_intact' || k === 'item-decor_lanterne_eteinte' || k === 'item-decor_lanterne_allumee') targets.push({ o, k: 0.8 });
    }
    for (const { o, k } of targets) {
      const box = typeof objectVisibleBox === 'function' ? objectVisibleBox(o) : null;
      if (!box) continue;
      const base = Math.max(box.baseRight - box.baseLeft, (box.right - box.left) * 0.5);
      const w = base * 1.15 + 10;
      const s = scene.add.image((box.baseLeft + box.baseRight) / 2, box.bottom, key)
        .setDisplaySize(w, Phaser.Math.Clamp(w * 0.2, 7, 18)).setAlpha(st.cfg.shadow.alpha * 0.9 * k);
      s.__lookCopy = true;
      scene.children.moveBelow(s, o);
      st.propShadows.push(s);
    }
  }

  // Uniformes de l'image (une fois par image) : défilement, lumières.
  function lookComputeFrame(scene, st) {
    const loopFrame = scene.game.loop.frame;
    if (st.frameNo === loopFrame) return;
    st.frameNo = loopFrame;
    const f = st.frame;
    const cam = st.main;
    const t = scene.game.loop.time / 1000;
    f.time = t;
    f.scrollX = cam.scrollX;
    f.scrollY = cam.scrollY;
    if (!st.cfg.lights) { f.lightCount = 0; return; }
    if (loopFrame >= st.lightScanAt) {
      st.lightScanAt = loopFrame + LIGHT_RESCAN_FRAMES;
      scanStaticLights(scene, st);
    }
    const W = cam.width;
    const H = cam.height;
    const z = cam.zoom;
    const toScreen = (wx, wy) => [(wx - cam.scrollX - W / 2) * z + W / 2, (wy - cam.scrollY - H / 2) * z + H / 2];
    const cand = [];
    const push = (wx, wy, color, radius, intensity, glow, prio) => {
      const [sx, sy] = toScreen(wx, wy);
      const r = radius * z;
      if (sx < -r || sx > W + r || sy < -r || sy > H + r || intensity <= 0.001) return;
      // ?lightdebug : halos forcés, pour vérifier où tombe chaque lumière.
      cand.push({ sx, sy, r, intensity, glow: LIGHT_DEBUG ? 1.5 : glow, c: rgb(color), prio });
    };
    // Lumières fixes en coordonnées MONDE (teinte du liseré, cf. lookRimColor).
    st.lightWorld.length = 0;
    for (const L of st.staticLights) {
      const o = L.obj;
      // Alpha « vrai » des objets atténués par le rendu (rai) : la lumière
      // suit le fondu du jeu, pas notre atténuation.
      const oa = o.__lookBaseAlpha != null ? o.__lookBaseAlpha : o.alpha;
      if (!o.active || !o.visible || oa <= 0.01) continue;
      const R = L.rule;
      const cy = o.y + (0.5 - o.originY) * o.displayHeight + R.dy * o.displayHeight;
      let k = 1;
      if (R.flicker) k *= 1 + R.flicker * (0.6 * Math.sin(t * 11.3 + L.seed) + 0.4 * Math.sin(t * 23.7 + L.seed * 2));
      if (R.pulse) k *= 1 + R.pulse * Math.sin(t * 1.7 + L.seed);
      // Lumières à alpha propre (rai, halos) : intensité qui suit leur fondu.
      if (o.blendMode === Phaser.BlendModes.ADD || o.blendMode === window.LOOK_ADD_BLEND) k *= Math.min(1, oa / 0.3);
      const radius = R.radius * (R.flicker ? 1 + 0.03 * Math.sin(t * 9.1 + L.seed) : 1);
      st.lightWorld.push({ x: o.x, y: cy, r: radius, i: R.intensity * k, c: rgb(R.color) });
      push(o.x, cy, R.color, radius, R.intensity * k, R.glow * k, 2);
    }
    // Lucioles (images ADD de vie ambiante) : les plus proches du centre.
    const fly = st.cfg.fly || { intensity: 0.32, radius: 70, glow: 0.05 };
    const flies = [];
    for (const o of scene.children.list) {
      const k = texKey(o);
      if ((k === 'item-fx_luciole' || k === 'juice-dot') && o.active && o.alpha > 0.15) flies.push(o);
    }
    flies.sort((a, b) => Math.abs(a.x - cam.midPoint.x) - Math.abs(b.x - cam.midPoint.x));
    for (const o of flies.slice(0, FIREFLY_MAX)) {
      const c = o.isTinted && o.tintTopLeft !== 0xffffff ? o.tintTopLeft : 0xc8ffb0;
      push(o.x, o.y, c, fly.radius, fly.intensity * o.alpha, fly.glow * o.alpha, 1);
    }
    // Agarica : une lueur froide discrète, pour qu'elle reste lisible dans le
    // noir ; Xara : une touche de rose.
    const self = st.cfg.self || { intensity: 0.14, radius: 190 };
    const p = scene.player;
    if (p && p.active && p.visible) push(p.x, (p.body ? p.body.center.y : p.y) - 10, 0xe6dcff, self.radius, self.intensity, 0, 3);
    const x = scene.xara;
    if (x && x.active && x.visible) push(x.x, x.y - 10, 0xff9ad6, 70, 0.22, 0.04, 1);
    cand.sort((a, b) => b.prio - a.prio);
    const n = Math.min(cand.length, LOOK_MAX_LIGHTS);
    for (let i = 0; i < n; i++) {
      const L = cand[i];
      f.lights.set([L.sx, L.sy, L.r, L.intensity], i * 4);
      f.lightCols.set([L.c[0], L.c[1], L.c[2], L.glow], i * 4);
    }
    f.lightCount = n;
  }

  // ---------------------------------------------------------------------------
  // Branchement : enveloppe de buildLevelFromData (+ graine du décor)
  // ---------------------------------------------------------------------------
  const SEED = num('seed', 1);
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashString(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return h >>> 0;
  }

  const originalBuild = window.buildLevelFromData;
  window.buildLevelFromData = function (scene, data, sceneData) {
    // Décor procédural (arbres, sous-bois...) tiré avec une graine fixe : les
    // captures off / A / B montrent exactement le même décor.
    const realRandom = Math.random;
    if (SEED) Math.random = mulberry32(hashString(scene.scene.key) ^ SEED);
    let out;
    try {
      out = originalBuild.apply(this, arguments);
    } finally {
      Math.random = realRandom;
    }
    lookAttach(scene, data);
    return out;
  };

  // F8 : off → A → B, sur la zone en cours (comparaison sur place).
  function showLookLabel(scene, text) {
    const t = scene.add.text(scene.scale.width - 12, 12, text, {
      fontFamily: 'sans-serif', fontSize: '14px', color: '#ffe9f5', backgroundColor: '#2a1f45', padding: { x: 8, y: 4 },
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(3100);
    scene.tweens.add({ targets: t, alpha: 0, delay: 1400, duration: 400, onComplete: () => t.destroy() });
  }
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'F8') return;
    const scene = typeof currentLevelScene !== 'undefined' ? currentLevelScene : null;
    if (!scene || !scene.sys || !scene.sys.isActive()) return;
    e.preventDefault();
    currentLook = LOOK_ORDER[(LOOK_ORDER.indexOf(currentLook) + 1) % LOOK_ORDER.length];
    lookAttach(scene, null);
    const cfg = scene.__look && scene.__look.cfg;
    showLookLabel(scene, cfg ? `Look ${cfg.label}` : 'Look off : rendu actuel');
  });

  // Accès pour les tests / captures.
  window.lookProto = {
    get look() { return currentLook; },
    setLook(look, scene = (typeof currentLevelScene !== 'undefined' ? currentLevelScene : null)) {
      currentLook = look;
      if (scene) lookAttach(scene, null);
    },
    state(scene) { return scene && scene.__look; },
    // Réglages d'URL changés à chaud (mesures de coût levier par levier) :
    // { blur: 0, rim: null } -> blur=0, rim retiré ; pris en compte au
    // prochain setLook.
    setParams(obj) {
      for (const [k, v] of Object.entries(obj)) {
        if (v == null) params.delete(k); else params.set(k, String(v));
      }
    },
    roleOf: lookRoleOf,
  };
}());
