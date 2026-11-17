// Zone de TEST « grotte lumineuse » (2026-11-17) : l'éclairage par sections en jeu, de la grotte
// noire au plein jour. Données et RÉGLAGES DE LUMIÈRE : src/data/grotte_lumiere_data.js
// (GROTTE_LUMIERE_REGLAGES, en tête). Conception : docs/production/GROTTE_LUMIERE.md.
//
// Toute la scène passe par LightKit (LightKit.eclairerTout) : sol, paroi, décors et personnages
// sont éclairés, en volume s'ils ont des cartes (npm run sections), à plat sinon. Seules les
// sources (champignons, mousses, lanterne, feu, lucioles, ciel) gardent leurs couleurs : ce sont
// elles qui éclairent. L'ambiance suit le x du monde (LightKit.ambianceZone) : noire dans la
// grotte, de jour dehors, avec un passage doux à l'entrée ; le soleil n'éclaire que dehors
// (lampe masquée en x).
class GrotteLumiereScene extends Phaser.Scene {
  constructor() {
    super('GrotteLumiereScene');
  }

  create(sceneData) {
    resolveZoneData('grotte_lumiere', GROTTE_LUMIERE_DATA).then((data) => buildLevelFromData(this, data, sceneData));
  }

  update(time, delta) {
    updateLevelFromData(this, time, delta);
  }
}

// Formes prêtées le temps de la visite (loup, singe, aigle : on les essaie sous la lumière),
// rendues à la sortie : la zone de test ne laisse rien dans l'état du joueur.
const GROTTE_LUMIERE_FORMES = ['hasWolfForm', 'hasMonkeyForm', 'hasEagleForm'];

ZONE_SCRIPTS.grotte_lumiere = {
  create(scene) {
    const R = GROTTE_LUMIERE_REGLAGES;
    const p = scene.player;
    grotteLumierePreterFormes(scene, p);
    // WebGL absent (rendu Canvas) : LightKit ne fait rien, la zone reste jouable en plein jour.
    if (typeof LightKit === 'undefined' || !LightKit.activer(scene, { ambiance: R.ambiance.grotte, paliers: R.paliers, paliersPlat: R.paliersPlat, contre: R.contre })) return;
    LightKit.ambianceZone(scene, { x0: R.ambiance.x0, x1: R.ambiance.x1, couleur: R.ambiance.dehors });
    const st = { sources: [], lucioles: [], soleil: null, xara: null, feu: null, t0: scene.time.now };
    scene.__grotteLumiere = st;

    // Ciel du dehors : derrière tout, en parallaxe, gardé tel quel (source : on le voit clair
    // depuis le fond de la grotte, comme une vraie ouverture au jour).
    if (scene.textures.exists('item-fond_foret_flottante')) {
      const ciel = scene.add.image(300, 540, 'item-fond_foret_flottante').setOrigin(0, 1)
        .setScale(0.714).setScrollFactor(0.2, 1).setDepth(-50);
      ciel.__lumiereEmissif = true;
    }
    // Paroi du fond un peu moins sombre que le second plan par défaut : les lampes y font des
    // flaques visibles.
    for (const o of scene.children.list) if (o.lookTile === 'back') o.setTint(R.teinteParoi);

    // Sources fixes : une lampe par champignon / mousse / lanterne ; le décor qui la porte reste
    // à ses couleurs (il brille), avec un halo doux. Décor cassé (Cassables.js : il repousse) :
    // la lampe s'éteint avec lui.
    for (const s of R.sources) {
      const prop = (scene.props || []).find((o) => o.propType === s.prop && Math.abs(o.x - s.x) < 48) || null;
      if (prop) prop.__lumiereEmissif = true;
      const halo = grotteLumiereHalo(scene, s.x, s.y, s.couleur, s.portee * 0.9, 0.22);
      const lampe = LightKit.ajouterLumiere(scene, { x: s.x, y: s.y, couleur: s.couleur, intensite: s.intensite, portee: s.portee, profondeur: s.profondeur });
      st.sources.push({ s, prop, halo, lampe, phase: Math.random() * Math.PI * 2, eteinte: 0 });
    }

    // Feu de camp : flammes à leurs couleurs, lampe chaude qui vacille.
    const feu = (scene.__campfires || [])[0];
    if (feu && feu.fire) {
      feu.fire.__lumiereEmissif = true;
      const F = R.feu;
      st.feu = { info: feu, lampe: LightKit.ajouterLumiere(scene, { x: feu.x, y: feu.flameY + F.dy, couleur: F.couleur, intensite: F.intensite, portee: F.portee, profondeur: F.profondeur }), bruit: 0 };
    }

    // Les yeux de Xara.
    if (scene.xara) {
      const X = R.xara;
      st.xara = LightKit.ajouterLumiere(scene, { x: scene.xara.x, y: scene.xara.y + X.dy, couleur: X.couleur, intensite: X.intensite, portee: X.portee, profondeur: X.profondeur });
    }

    // Lucioles : points qui dérivent ; les premières portent une vraie lampe.
    const L = R.lucioles;
    for (let i = 0; i < L.nombre; i++) {
      const bx = Phaser.Math.Between(L.x0, L.x1), by = Phaser.Math.Between(L.y0, L.y1);
      const point = scene.textures.exists('item-fx_luciole')
        ? scene.add.image(bx, by, 'item-fx_luciole').setScale(0.13).setTint(L.couleur)
        : scene.add.circle(bx, by, 2.5, L.couleur);
      point.setBlendMode(Phaser.BlendModes.ADD).setDepth(CHARACTER_DEPTH + 2);
      point.__lumiereEmissif = true;
      const lampe = i < L.lampes ? LightKit.ajouterLumiere(scene, { x: bx, y: by, couleur: L.couleur, intensite: L.intensite, portee: L.portee, profondeur: L.profondeur }) : null;
      st.lucioles.push({
        point, lampe, bx, by,
        ax: Phaser.Math.Between(30, 70), ay: Phaser.Math.Between(18, 40),
        w1: 0.00031 + Math.random() * 0.0003, w2: 0.00053 + Math.random() * 0.0004,
        p1: Math.random() * 6.28, p2: Math.random() * 6.28, p3: Math.random() * 6.28,
      });
    }

    // Soleil : très loin, il suit la caméra (même angle partout), masqué dans la grotte.
    const S = R.soleil;
    st.soleil = LightKit.ajouterLumiere(scene, { x: 0, y: S.y, couleur: S.couleur, intensite: S.intensite, portee: S.portee, profondeur: S.profondeur, masque: S.masque });

    // Tout le reste de la scène sous la lumière, à la bonne distance du plan des personnages.
    const P = R.plans;
    LightKit.eclairerTout(scene, {
      // effets lumineux (arcs de la dague `vfx_*`, images `item-fx_*`) : des lumières, pas des objets
      emissif: (o) => !!o.__lumiereEmissif || /^(vfx|item-fx_)/.test((o.texture && o.texture.key) || ''),
      plan: (o) => (o.lookTile === 'back' ? P.paroi : o.lookTile ? P.sol : o.propType ? P.decors : 0),
    });
    this.update(scene, scene.time.now, 0);
  },

  update(scene, time) {
    const st = scene.__grotteLumiere;
    if (!st || !scene.__lumiere) return;
    const R = GROTTE_LUMIERE_REGLAGES;
    const t = time - st.t0;
    for (const src of st.sources) {
      const { s, prop, halo, lampe } = src;
      // décor cassé : la lumière s'éteint en 150 ms, revient avec lui
      const allume = !prop || (prop.active && prop.visible && prop.alpha > 0.05);
      src.eteinte = Phaser.Math.Clamp(src.eteinte + (allume ? -0.1 : 0.1), 0, 1);
      const k = (1 + s.pulse * Math.sin((t / s.periode) * Math.PI * 2 + src.phase)) * (1 - src.eteinte);
      lampe.setIntensity(s.intensite * k);
      if (halo) halo.setAlpha(0.22 * k);
    }
    if (st.feu) {
      const F = R.feu;
      // vacillement : bruit lissé (pas un clignotement)
      st.feu.bruit += (Math.random() - 0.5) * 0.35;
      st.feu.bruit *= 0.85;
      st.feu.lampe.setIntensity(F.intensite * (1 + F.vacille * st.feu.bruit + 0.05 * Math.sin(t * 0.011)));
    }
    if (st.xara && scene.xara && scene.xara.active) {
      const X = R.xara;
      const sens = scene.xara.flipX ? -1 : 1;
      LightKit.deplacer(st.xara, scene.xara.x + sens * X.dx, scene.xara.y + X.dy);
      st.xara.setIntensity(scene.xara.visible ? X.intensite : 0);
    }
    for (const f of st.lucioles) {
      const x = f.bx + f.ax * Math.sin(t * f.w1 + f.p1) + 0.4 * f.ax * Math.sin(t * f.w2 * 1.7 + f.p2);
      const y = f.by + f.ay * Math.sin(t * f.w2 + f.p2) + 0.5 * f.ay * Math.sin(t * f.w1 * 2.3 + f.p3);
      const a = 0.55 + 0.45 * Math.sin(t * 0.004 + f.p3);
      f.point.setPosition(x, y).setAlpha(a);
      if (f.lampe) {
        LightKit.deplacer(f.lampe, x, y);
        f.lampe.setIntensity(R.lucioles.intensite * (0.5 + 0.5 * a));
      }
    }
    const cam = scene.cameras.main;
    if (st.soleil) LightKit.deplacer(st.soleil, cam.midPoint.x + R.soleil.dx, R.soleil.y);
  },
};

// Halo additif doux (même image que le halo du feu de camp), teinté ; null sans l'image.
function grotteLumiereHalo(scene, x, y, couleur, diametre, alpha) {
  if (!scene.textures.exists('item-fx_halo_doux')) return null;
  const img = scene.add.image(x, y, 'item-fx_halo_doux').setBlendMode(Phaser.BlendModes.ADD)
    .setTint(couleur).setAlpha(alpha).setDepth(CHARACTER_DEPTH - 1);
  img.setScale(diametre / Math.max(img.width, 1));
  img.__lumiereEmissif = true;
  return img;
}

// Loup, singe et aigle prêtés pour la visite ; à l'arrêt de la scène, le registre reprend
// exactement ses valeurs d'avant (une sauvegarde chargée ensuite n'en garde aucune trace).
function grotteLumierePreterFormes(scene, p) {
  if (!p) return;
  const reg = scene.registry;
  // + les emplacements (equipForm les écrit au registre) : rendus eux aussi
  const avant = [...GROTTE_LUMIERE_FORMES, 'equippedForms', 'airForm'].map((k) => [k, reg.has(k), reg.get(k)]);
  for (const k of GROTTE_LUMIERE_FORMES) {
    reg.set(k, true);
    p[k] = true;
  }
  // Loup au sol (Maj) ; en l'air, la forme déjà choisie, sinon l'aigle (le singe : au feu).
  if (p.airFormsSeen) for (const id of Object.keys(p.airFormsSeen)) p.airFormsSeen[id] = true;
  if (!p.getActiveGroundForm()) p.equipForm('wolf');
  if (!p.getActiveAirForm()) p.equipForm('eagle');
  scene.events.once('shutdown', () => {
    for (const [k, existait, v] of avant) {
      if (existait) reg.set(k, v);
      else reg.remove(k);
    }
  });
}

// Liste « Zones de test » de l'écran-titre (LEGACY_TEST_ZONES, StoryKit.js) : ajoutée d'ici pour
// ne pas toucher StoryKit.
if (typeof LEGACY_TEST_ZONES !== 'undefined' && !LEGACY_TEST_ZONES.some((z) => z.scene === 'GrotteLumiereScene')) {
  LEGACY_TEST_ZONES.push({ scene: 'GrotteLumiereScene', name: 'Grotte lumineuse (lumière)' });
}
