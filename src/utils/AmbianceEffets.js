// AmbianceEffets : effets qui s'ajoutent à une ambiance d'éclairage d'AmbianceKit (forêt). Chaque effet se règle dans
// src/data/ambiance_effets.js et se coupe à part : basculer(ctrl, id, oui). Rien ici ne dépend d'une zone : une
// ambiance qui déclare `effets` les reçoit (AmbianceKit.installer), la zone de test foret_ambiance les essaie tous.
//
// Les effets lisent le même masque de canopée que les rayons (LightKit.masqueSoleil) : poussière, gouttes, feuilles et
// brume ne s'allument que dans un rayon. Vent (rafales), nuages et heure (fin de journée) sont partagés : les autres
// effets les lisent dans le contrôleur (ctrl.vent, ctrl.nuage, ctrl.heure).
const AmbianceEffets = (() => {
  // ---------------------------------------------------------------- outils sans Phaser (testés par lumiere:tests)
  // Montée et descente douces sur [debut, debut + duree] : 0 aux bords, 1 au milieu, sans saut
  function enveloppe(t, debut, duree) {
    const x = (t - debut) / duree;
    return x <= 0 || x >= 1 ? 0 : Math.sin(Math.PI * x) ** 2;
  }

  // Événements espacés au hasard (rafales, nuages) : valeur(t) de 0 à 1. premier : délai du premier (s)
  function evenements({ entre, duree }, hasard = Math.random, premier = 3) {
    let prochain = null, debut = -1;
    return (t) => {
      if (prochain === null) prochain = t + premier;
      if (debut < 0 && t >= prochain) debut = t;
      if (debut < 0) return 0;
      const v = enveloppe(t, debut, duree);
      if (t >= debut + duree) { debut = -1; prochain = t + entre[0] + (entre[1] - entre[0]) * hasard(); }
      return v;
    };
  }

  // Groupe d'oiseaux posés : taille de taille[0] à taille[1], écart entre voisins (px) et décalage de départ de chacun
  // (s) quand le groupe s'envole ; le premier part tout de suite, le dernier au plus `ecart` s après
  function groupeOiseaux({ taille = [1, 4], ecart = 0.7, espace = [9, 15] } = {}, hasard = Math.random) {
    const n = taille[0] + Math.min(taille[1] - taille[0], Math.floor(hasard() * (taille[1] - taille[0] + 1)));
    const decalages = [0];
    for (let i = 1; i < n; i++) decalages.push(hasard() * ecart);
    // ordre de départ mélangé : le premier oiseau posé n'est pas forcément le premier à partir
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(hasard() * (i + 1)); [decalages[i], decalages[j]] = [decalages[j], decalages[i]]; }
    const places = [0];
    for (let i = 1; i < n; i++) places.push(places[i - 1] + espace[0] + hasard() * (espace[1] - espace[0]));
    const milieu = places[n - 1] / 2;
    return { n, decalages, places: places.map((p) => Math.round(p - milieu)) };
  }

  // Heure de la fin de journée : 0 à 1 en `duree` s ; en boucle (zone de test), elle revient doucement à 0
  function heureSoir(p, boucle) {
    return boucle ? (1 - Math.cos(Math.PI * 2 * (p % 1))) / 2 : Math.min(Math.max(p, 0), 1);
  }

  const canal = (c, k) => (c >> k) & 255;
  function melange(a, b, k) {
    const m = (s) => Math.round(canal(a, s) + (canal(b, s) - canal(a, s)) * k);
    return (m(16) << 16) | (m(8) << 8) | m(0);
  }
  const multiplie = (a, b) => (Math.round(canal(a, 16) * canal(b, 16) / 255) << 16) | (Math.round(canal(a, 8) * canal(b, 8) / 255) << 8)
    | Math.round(canal(a, 0) * canal(b, 0) / 255);

  // ---------------------------------------------------------------- brume : pipeline lié au masque de canopée
  const NOM_BRUME = 'ForetBrume';
  let BrumePipeline = null;
  function pipelineBrume(game) {
    const pipes = game.renderer.pipelines;
    if (pipes.has(NOM_BRUME)) return pipes.get(NOM_BRUME);
    if (!BrumePipeline) {
      BrumePipeline = class extends Phaser.Renderer.WebGL.Pipelines.SinglePipeline {
        constructor(g) {
          super({
            game: g,
            fragShader: `
#define SHADER_NAME FORET_BRUME_FS
precision highp float;
uniform sampler2D uMainSampler;
uniform vec3 uSombre, uClaire;
uniform vec3 uAlphas;       // hors rayon, dans un rayon, force des rayons (nuages, soir)
varying vec2 outTexCoord;
${LightKit.FRAG_MASQUE}
void main() {
  float a0 = texture2D(uMainSampler, outTexCoord).a;
  if (a0 <= 0.0) discard;
  float k = min(masqueDoux(pointMonde(), 20.0) * 1.4, 1.0) * uAlphas.z;
  float a = a0 * mix(uAlphas.x, uAlphas.y, k);
  gl_FragColor = vec4(mix(uSombre, uClaire, k) * a, a);
}`,
          });
          this.masque = null;
          this.reglages = { sombre: [0.1, 0.14, 0.2], claire: [0.9, 0.88, 0.76], alphas: [0.3, 0.5, 1] };
        }

        onRender(scene, camera) {
          const mq = this.masque;
          if (!mq || !camera.__zoomMonde && ZoomKit.actif()) return;
          const M = camera.matrix, r = this.reglages;
          this.set1i('uMasque', 1);
          this.set3f('uSombre', ...r.sombre);
          this.set3f('uClaire', ...r.claire);
          this.set3f('uAlphas', ...r.alphas);
          this.set4f('uMasqueGeo', mq.pente, mq.u0, mq.cel, mq.n);
          this.set4f('uMasqueAnim', mq.amp, mq.t, mq.bande, 1);
          this.set4f('uTaches', ...(mq.taches || [0, 1, 0, 0]));
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
      };
    }
    pipes.add(NOM_BRUME, new BrumePipeline(game));
    return pipes.get(NOM_BRUME);
  }

  const rgb = (c) => [canal(c, 16) / 255, canal(c, 8) / 255, canal(c, 0) / 255];

  // ---------------------------------------------------------------- effets
  // Chaque fabrique renvoie { activer(oui), image(dt, t) } ; `marquer` : objet que l'ambiance ne doit pas réassombrir
  const marquer = (o) => { o.__ambianceVu = true; return o; };
  const lum = (ctrl, x, y) => (ctrl.st.eclairage ? LightKit.masqueSoleil({ x, y }, ctrl.st.masque) * ctrl.rayons : 0);
  const vue = (ctrl) => ZoomKit.vueVisible(ctrl.scene.cameras.main);
  const sol = (scene, x) => (typeof groundStandYAt === 'function' ? groundStandYAt(scene, x, 448) : null) ?? 448;
  // Image d'un effet chargée à la demande (rien au démarrage du jeu) ; cadre : { largeur, hauteur } pour une planche
  function charger(scene, cle, fichier, cadre) {
    if (!fichier || scene.textures.exists(cle) || scene.__ambianceCharge?.[cle]) return;
    (scene.__ambianceCharge = scene.__ambianceCharge || {})[cle] = true;
    if (cadre) scene.load.spritesheet(cle, fichier, { frameWidth: cadre.largeur, frameHeight: cadre.hauteur });
    else scene.load.image(cle, fichier);
    scene.load.start();
  }

  const FABRIQUES = {
    poussiere(ctrl) {
      return { activer: (oui) => { ctrl.st.poussiereActive = oui; }, image() {} };
    },

    taches(ctrl, r) {
      const st = ctrl.st;
      st.taches = [0, r.taille, 0, 0];
      st.masque.taches = st.taches;
      return {
        activer: (oui) => { st.taches[0] = oui ? r.force : 0; },
        image(dt) {
          // dérive lente, plus vive pendant une rafale ; les taches suivent le balancement des rayons
          st.taches[2] += (r.derive + 40 * ctrl.vent) * dt / r.taille;
          st.taches[3] += 0.3 * Math.sin(ctrl.t * 0.4) * dt / r.taille;
        },
      };
    },

    rafales(ctrl, r) {
      const valeur = evenements({ entre: r.entre, duree: r.duree });
      return {
        activer: (oui) => { if (!oui) ctrl.vent = 0; },
        image(dt, t) {
          ctrl.vent = valeur(t);
          ctrl.st.masque.amp = ctrl.st.v.balancement * (1 + (r.balancement - 1) * ctrl.vent);
        },
      };
    },

    nuages(ctrl, r) {
      const valeur = evenements({ entre: r.entre, duree: r.duree }, Math.random, 6);
      return {
        activer: (oui) => { if (!oui) ctrl.nuage = 1; },
        image(dt, t) { ctrl.nuage = 1 - r.profondeur * valeur(t); },
      };
    },

    // Lucioles semées par la zone (LevelKit, plan du fond) : les plus proches d'Agarica deviennent des sources
    // visibles (forme cercle, lumière qui suit leur clignotement et disparaît avec elles)
    lucioles(ctrl, r) {
      const { scene, st } = ctrl;
      const toutes = () => scene.children.list.filter((o) => o.active && o.texture && /fx_luciole|juice-dot/.test(o.texture.key)
        && o.depth < CHARACTER_DEPTH && o.blendMode === Phaser.BlendModes.ADD);
      const allumees = new Set();
      let actif = false, attente = 0;
      const maxBase = st.sources.max;
      const eteindre = () => { for (const o of allumees) st.sources.retirer(o); allumees.clear(); };
      return {
        activer: (oui) => {
          actif = oui;
          st.sources.max = oui ? maxBase + r.max : maxBase;
          if (!oui) eteindre();
          attente = 0;
        },
        image(dt) {
          if (!actif || (attente -= dt) > 0) return;
          attente = 0.4;
          const p = scene.player;
          if (!p) return;
          const proches = toutes().sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x)).slice(0, r.max);
          for (const o of [...allumees]) if (!proches.includes(o)) { st.sources.retirer(o); allumees.delete(o); }
          for (const o of proches) if (!allumees.has(o)) { st.sources.ajouter(o, 'luciole'); allumees.add(o); }
        },
      };
    },

    // Nappe de brume au sol : images de couche_nappe_brume côte à côte, ancrées au monde, qui dérivent
    brume(ctrl, r) {
      const { scene, st } = ctrl;
      const pl = pipelineBrume(scene.game);
      pl.masque = st.masque;
      const cle = scene.textures.exists('item-couche_nappe_brume') ? 'item-couche_nappe_brume' : null;
      const morceaux = [];
      let largeur = 0, decalage = 0;
      if (cle) {
        for (let i = 0; i < 3; i++) {
          const im = marquer(scene.add.image(0, 0, cle).setOrigin(0, 0.5).setDepth(CHARACTER_DEPTH - 1).setPipeline(NOM_BRUME));
          im.setDisplaySize(im.width * 0.7, r.hauteur);
          largeur = im.displayWidth;
          morceaux.push(im);
        }
      }
      return {
        activer: (oui) => { for (const m of morceaux) m.setVisible(oui); },
        image(dt) {
          if (!morceaux.length) return;
          pl.masque = st.masque;
          pl.reglages.sombre = rgb(r.sombre);
          pl.reglages.claire = rgb(melange(r.claire, 0xffb070, ctrl.heure * 0.6));
          pl.reglages.alphas = [r.alpha, r.alphaRayon, st.eclairage ? ctrl.rayons : 0];
          decalage = (decalage + r.vitesse * (1 + 3 * ctrl.vent) * dt) % largeur;
          const v = vue(ctrl), x0 = Math.floor((v.left - decalage) / largeur) * largeur + decalage;
          const y = (r.sol ?? 448) - r.hauteur * 0.3;
          morceaux.forEach((m, i) => m.setPosition(Math.round(x0 + i * largeur), Math.round(y)));
        },
      };
    },

    // Plans lointains (parallaxe < 1) : bleutés selon leur distance, puis un voile au-dessus des plus lointains
    profondeur(ctrl, r) {
      const { scene, st } = ctrl;
      const fonds = scene.children.list.filter((o) => o.scrollFactorX > 0 && o.scrollFactorX < 1 && o.depth < ZOOM_PROFONDEUR_UI && o.setTint);
      for (const o of fonds) if (o.__profBase === undefined) o.__profBase = st.teintes.includes(o) ? null : o.tintTopLeft;
      const base = (o) => (o.__profBase === null ? multiplie(st.teinteFond, o.__ambianceTeinte0 ?? 0xffffff) : o.__profBase);
      const voile = marquer(scene.add.image(0, 0, '__WHITE').setOrigin(0, 0).setScrollFactor(0).setDisplaySize(ZOOM_LARGEUR, ZOOM_HAUTEUR)
        .setTint(r.voile).setAlpha(r.voileAlpha).setDepth(0));
      // Fonds séparés du premier plan par la profondeur, et non par l'ordre d'ajout (qui mélangeait les deux) : le voile
      // passe entre eux, sous les halos des feux (-0,5). Rien du premier plan (feu, sous-bois) ne passe sous le voile.
      const ranger = () => {
        for (const o of scene.children.list) if (o.scrollFactorX > 0 && o.scrollFactorX < 1 && o.depth === 0) o.setDepth(-1);
      };
      ranger();
      voile.setDepth(-0.75);
      let actif = false, attente = 0;
      const teindre = () => {
        for (const o of fonds) {
          if (!o.active) continue;
          o.setTint(actif ? multiplie(base(o), melange(0xffffff, r.bleu, Math.min(1, (1 - o.scrollFactorX) * 1.2))) : base(o));
        }
      };
      return {
        voile,
        activer: (oui) => { actif = oui; voile.setVisible(oui); teindre(); },
        image(dt) { if ((attente -= dt) <= 0) { attente = 0.25; ranger(); teindre(); } },
      };
    },

    // Gouttes qui tombent de la canopée, visibles surtout en traversant un rayon
    gouttes(ctrl, r) {
      const { scene } = ctrl;
      const gouttes = [];
      let actif = false;
      for (let i = 0; i < r.nombre; i++) {
        const g = marquer(scene.add.image(0, 0, '__WHITE').setDisplaySize(1, 3).setTint(0xd6ecff)
          .setBlendMode(Phaser.BlendModes.ADD).setDepth(CHARACTER_DEPTH + 2).setAlpha(0));
        gouttes.push({ g, x: Math.random(), y: Math.random(), v: 160 + Math.random() * 90 });
      }
      return {
        activer: (oui) => {
          actif = oui;
          for (const d of gouttes) d.g.setVisible(oui);
        },
        image(dt) {
          if (!actif) return;
          const v = vue(ctrl), w = v.right - v.left, h = v.bottom - v.top;
          for (const d of gouttes) {
            d.y += d.v * dt / h;
            if (d.y > 1) { d.y = 0; d.x = Math.random(); }
            const x = v.left + d.x * w, y = v.top + d.y * h;
            if (y > sol(scene, x)) { d.y = 0; d.x = Math.random(); continue; }
            d.g.setPosition(Math.round(x), Math.round(y)).setAlpha(0.05 + 0.85 * lum(ctrl, x, y));
          }
        },
      };
    },

    // Feuilles qui tombent en tournant, sombres à l'ombre, claires en traversant un rayon ; une rafale en ajoute
    feuilles(ctrl, r) {
      const { scene } = ctrl;
      const tex = scene.textures.exists('item-fx_feuille') ? 'item-fx_feuille' : null;
      const liste = [];
      const ombre = 0x4d5c3f, soleil = 0xfff0c2;
      const creer = (enHaut) => {
        if (!tex) return;
        const im = marquer(scene.add.image(0, 0, tex).setDepth(CHARACTER_DEPTH + 2));
        im.setScale(7 / Math.max(im.width, 1));
        liste.push({ im, x: Math.random(), y: enHaut ? -0.05 * Math.random() : Math.random(), v: 14 + Math.random() * 14,
          ph: Math.random() * 6.28, rot: (Math.random() - 0.5) * 3, vie: enHaut ? 1 : 0 });
      };
      for (let i = 0; i < r.nombre; i++) creer(false);
      let actif = false, ventAvant = 0, extra = 0;
      return {
        activer: (oui) => { actif = oui; for (const f of liste) f.im.setVisible(oui); },
        image(dt, t) {
          if (!actif) return;
          if (ctrl.vent > 0.1 && ventAvant <= 0.1 && extra === 0) { for (let i = 0; i < r.rafale; i++) creer(true); extra = r.rafale; }
          ventAvant = ctrl.vent;
          const v = vue(ctrl), w = v.right - v.left, h = v.bottom - v.top;
          for (let i = liste.length - 1; i >= 0; i--) {
            const f = liste[i];
            f.y += f.v * dt / h;
            f.x += (8 * Math.sin(t * 1.1 + f.ph) + 70 * ctrl.vent) * dt / w;
            const x = v.left + (((f.x % 1) + 1) % 1) * w, y = v.top + f.y * h;
            if (f.y > 1 || y > sol(scene, x) + 4) {
              if (f.vie && extra > 0) { f.im.destroy(); liste.splice(i, 1); extra--; continue; }
              f.y = -0.03; f.x = Math.random();
              continue;
            }
            f.im.setPosition(Math.round(x), Math.round(y)).setRotation(Math.sin(t * 1.7 + f.ph) * 0.9 + f.rot)
              .setTint(melange(ombre, soleil, Math.min(1, lum(ctrl, x, y) * 1.2)));
          }
        },
      };
    },

    // Sous-bois posé au sol (pied en bas de l'image) : plie au vent et s'écarte d'Agarica quand elle passe
    fougeres(ctrl, r) {
      const { scene } = ctrl;
      const plantes = scene.children.list.filter((o) => o.texture && o.scrollFactorX === 1 && o.originY === 1
        && /^decor-sous-bois-|fougere|buisson/.test(o.texture.key));
      let actif = false;
      return {
        nombre: plantes.length,
        activer: (oui) => { actif = oui; if (!oui) for (const o of plantes) o.setAngle(0); },
        image(dt, t) {
          if (!actif) return;
          const p = scene.player, v = vue(ctrl);
          for (const o of plantes) {
            if (!o.visible || o.x < v.left - 120 || o.x > v.right + 120) continue;
            let cible = ctrl.vent * r.vent * (0.6 + 0.4 * Math.sin(t * 3 + o.x * 0.05));
            if (p) {
              const dx = o.x - p.x, zone = r.portee + o.displayWidth / 2;
              if (Math.abs(dx) < zone && Math.abs(p.y - o.y) < 60) cible += Math.sign(dx || 1) * r.angle * (1 - Math.abs(dx) / zone);
            }
            o.setAngle(o.angle + (cible - o.angle) * Math.min(1, dt * 9));
          }
        },
      };
    },

    // Herbes au premier plan, DEVANT les personnages : une bande d'herbe continue le long du sol (variantes de tuile
    // enchaînées au hasard, bords compatibles) qui cache le bas des pieds partout, et par endroits, sans régularité,
    // des touffes plus hautes. Tout ondule au vent, plie pendant une rafale et s'écarte d'Agarica ; éclairé comme le
    // décor (rayons, feu). Planches : une case par variante ou par touffe, pied en bas.
    herbes(ctrl, r) {
      const { scene } = ctrl;
      const elements = [];
      let actif = false;
      const B = r.bande, T = r.touffes;
      charger(scene, 'ambiance-herbe-bande', B.fichier);
      charger(scene, 'ambiance-herbes', T.fichier);
      const entre = (a) => a[0] + Math.random() * (a[1] - a[0]);
      const solA = (x) => (typeof groundStandYAt === 'function' ? groundStandYAt(scene, x, r.sol) : null);
      // sol plat de x0 à x1 (ni fosse ni marche) : hauteur du sol, sinon null
      const plat = (x0, x1) => {
        const y = solA(x0);
        if (y === null) return null;
        for (const x of [x0 + (x1 - x0) / 2, x1]) if (solA(x) !== y) return null;
        return y;
      };
      const cadres = (cle, cases, nom) => {
        const tex = scene.textures.get(cle), h = tex.source[0].height;
        cases.forEach(([x, l], i) => { if (!tex.has(nom + i)) tex.add(nom + i, 0, x, 0, l, h); });
      };
      const ajouter = (x, y, cle, cadre, souple, angleMax) => {
        const o = scene.add.image(Math.round(x), y + r.enfonce, cle, cadre).setOrigin(0.5, 1)
          .setDepth(CHARACTER_DEPTH + 1).setFlipX(Math.random() < 0.5).setVisible(actif);
        elements.push({ o, ph: Math.random() * 6.28, souple, angleMax });
      };
      // Aucune herbe devant un feu de camp (bûches et flammes) : trou sur sa largeur + `margeFeu`
      const trous = () => scene.children.list.filter((o) => o.active && o.texture && /campfire/.test(o.texture.key))
        .map((o) => { const b = o.getBounds(); return [b.left - (r.margeFeu || 0), b.right + (r.margeFeu || 0)]; });
      const libre = (x0, x1, T0) => !T0.some(([a, b]) => x1 > a && x0 < b);
      const poser = () => {
        if (elements.length || !scene.textures.exists('ambiance-herbe-bande') || !scene.textures.exists('ambiance-herbes')) return;
        cadres('ambiance-herbe-bande', B.cases, 'b');
        cadres('ambiance-herbes', T.cases, 'h');
        const largeur = scene.physics && scene.physics.world ? scene.physics.world.bounds.width : 4000;
        const feux = trous();
        // bande : tuiles bout à bout, variante au hasard (jamais deux fois la même de suite). Au bord d'un trou de feu,
        // une touffe basse (première case des touffes) couvre la fin de la tuile : pas de coupure nette
        let x = 0, avant = -1, fin = null;
        const bord = (xb, y) => ajouter(xb, y, 'ambiance-herbes', 'h0', 0.6, T.angle);
        while (B.cases.length && x < largeur) {
          let v = Math.floor(Math.random() * B.cases.length);
          if (v === avant && B.cases.length > 1) v = (v + 1) % B.cases.length;
          const l = B.cases[v][1], y = plat(x + 1, x + l - 1);
          if (!libre(x, x + l, feux)) {
            if (fin) bord(fin[0] - 3, fin[1]);
            fin = null; avant = -1;
          } else if (y !== null) {
            if (avant === -1 && x > 0 && !libre(x - l, x, feux)) bord(x + 3, y);
            ajouter(x + l / 2, y, 'ambiance-herbe-bande', 'b' + v, B.souple, B.angle); avant = v; fin = [x + l, y];
          } else { avant = -1; fin = null; }
          x += l;
        }
        // touffes hautes : 1 ou 2 côte à côte, espacées au hasard ; les plus hautes plus rares
        const poids = T.cases.map((c) => c[2]), total = poids.reduce((p, q) => p + q, 0);
        const tirer = () => { let v = Math.random() * total; for (let i = 0; i < poids.length; i++) if ((v -= poids[i]) < 0) return i; return 0; };
        x = entre(T.entre);
        while (x < largeur) {
          const n = Math.random() < T.paire ? 2 : 1;
          for (let k = 0; k < n; k++) {
            const xi = x + k * entre([8, 14]), y = plat(xi - 8, xi + 8);
            if (y !== null && libre(xi - 10, xi + 10, feux)) ajouter(xi, y, 'ambiance-herbes', 'h' + tirer(), 0.6 + 0.8 * Math.random(), T.angle);
          }
          x += entre(T.entre);
        }
      };
      poser();
      return {
        nombre: () => elements.length,
        activer: (oui) => { actif = oui; poser(); for (const e of elements) e.o.setVisible(oui).setAngle(0); },
        image(dt, t) {
          if (!actif) return;
          poser();
          const p = scene.player, v = vue(ctrl);
          for (const e of elements) {
            const o = e.o;
            if (o.x < v.left - 40 || o.x > v.right + 40) continue;
            // ondulation légère en continu, pliée par la rafale, écartée par Agarica
            let cible = (r.ondule + ctrl.vent * r.vent) * e.souple * Math.sin(t * (1.6 + ctrl.vent) + e.ph + o.x * 0.04)
              + ctrl.vent * r.vent * 0.6 * e.souple;
            if (p) {
              const dx = o.x - p.x, zone = r.portee + o.displayWidth / 2;
              if (Math.abs(dx) < zone && Math.abs(p.y - o.y) < 40) cible += Math.sign(dx || 1) * e.angleMax * (1 - Math.abs(dx) / zone);
            }
            o.setAngle(o.angle + (cible - o.angle) * Math.min(1, dt * 10));
          }
        },
      };
    },

    // Oiseaux posés qui s'envolent quand Agarica approche ; silhouette d'animal qui traverse au loin
    animaux(ctrl, r) {
      const { scene, st } = ctrl;
      let actif = false;
      // espèces : une planche de 4 cases chacune (posé, ailes hautes, ailes basses, posé) ; un groupe = une seule espèce
      const especes = (r.especes || []).map((e, i) => ({ ...e, cle: `ambiance-oiseau-${i}`, vol: `ambiance-oiseau-vol-${i}` }));
      for (const e of especes) charger(scene, e.cle, e.fichier, { largeur: e.largeur, hauteur: e.hauteur });
      const pretes = () => especes.filter((e) => {
        if (!scene.textures.exists(e.cle) || scene.textures.get(e.cle).frameTotal < 4) return false;
        if (!scene.anims.exists(e.vol)) {
          scene.anims.create({ key: e.vol, frames: [{ key: e.cle, frame: 1 }, { key: e.cle, frame: 2 }], frameRate: 12, repeat: -1 });
        }
        return true;
      });
      const animsOiseau = () => especes.length > 0 && pretes().length === especes.length;
      // groupes de 1 à 4 oiseaux posés côte à côte ; tout le groupe s'envole quand Agarica approche
      const groupes = (r.groupes || []).map((x) => ({ x, etat: 'pose', t: 0, oiseaux: [] }));
      const poserGroupe = (G) => {
        for (const b of G.oiseaux) b.o.destroy();
        const g = groupeOiseaux(r.groupe);
        const choix = pretes(), e = choix[Math.floor(Math.random() * choix.length)];
        G.espece = e;
        G.oiseaux = g.places.map((dx, i) => {
          const x = G.x + dx;
          const o = scene.add.sprite(x, sol(scene, x), e.cle, 0).setOrigin(0.5, 1).setDepth(CHARACTER_DEPTH - 1)
            .setFlipX(Math.random() < 0.5).setVisible(actif);
          return { o, x, depart: g.decalages[i], parti: false };
        });
        G.etat = 'pose'; G.t = 0;
      };
      const poserOiseaux = () => {
        if (!animsOiseau()) return;
        for (const G of groupes) if (!G.oiseaux.length) poserGroupe(G);
      };
      poserOiseaux();
      // silhouette : forme du loup du joueur (course), toute sombre, sur le plan des arbres lointains
      const cleSil = scene.anims.exists('loup-run') ? 'loup-run' : null;
      const voile = ctrl.effets.profondeur && ctrl.effets.profondeur.voile;
      const sil = cleSil ? marquer(scene.add.sprite(0, 0, 'loup-run-0').setOrigin(0.5, 1).setScrollFactor(r.silhouette.parallaxe, 1)
        .setTint(0x080b14).setAlpha(0).setScale(0.5).setDepth(0)) : null;
      const arbre = scene.children.list.filter((o) => o.scrollFactorX > 0.3 && o.scrollFactorX < 0.5 && o.depth === 0 && o.originY === 1).pop();
      if (sil) {
        if (voile) scene.children.moveBelow(sil, voile); else if (arbre) scene.children.moveAbove(sil, arbre);
        if (arbre) sil.setScrollFactor(r.silhouette.parallaxe, arbre.scrollFactorY);
        sil.play(cleSil);
      }
      const course = evenements({ entre: r.silhouette.entre, duree: 5 }, Math.random, 4);
      let sens = 1, enCourse = false, prog = 0;
      return {
        activer: (oui) => {
          actif = oui;
          for (const G of groupes) for (const b of G.oiseaux) b.o.setVisible(oui && !b.parti);
          if (sil) sil.setVisible(oui);
        },
        image(dt, t) {
          if (!actif) return;
          poserOiseaux();
          const p = scene.player;
          const px = p ? p.x : -9999;
          for (const G of groupes) {
            if (G.etat === 'pose' && G.oiseaux.some((o) => Math.abs(o.x - px) < r.approche)) { G.etat = 'vol'; G.t = 0; }
            if (G.etat === 'vol') {
              G.t += dt;
              for (const o of G.oiseaux) {
                const t = G.t - o.depart;
                if (t < 0 || o.parti) continue;
                if (!o.sens) { o.sens = Math.sign(o.x - px || 1); o.o.setFlipX(o.sens < 0).play(G.espece.vol); }
                o.o.x += o.sens * (60 + 90 * t) * dt;
                o.o.y -= (50 + 60 * t) * dt;
                o.o.setAlpha(Math.max(0, 1 - (t - 1.6) / 0.8));
                if (t > 2.4) { o.parti = true; o.o.setVisible(false); }
              }
              if (G.oiseaux.every((o) => o.parti)) { G.etat = 'parti'; G.t = 0; }
            } else if (G.etat === 'parti') {
              G.t += dt;
              if (G.t > r.retour && Math.abs(G.x - px) > 420) poserGroupe(G);
            }
          }
          if (!sil) return;
          const v = course(t);
          if (v > 0 && !enCourse) { enCourse = true; prog = 0; sens = Math.random() < 0.5 ? 1 : -1; sil.setFlipX(sens < 0); }
          if (v <= 0) { enCourse = false; sil.setAlpha(0); return; }
          // traverse le cadre en 5 s : un objet de parallaxe p à l'abscisse x paraît au bord gauche quand
          // x = scrollX * p + (gauche de la vue - scrollX)
          prog = Math.min(1, prog + dt / 5);
          const cam = scene.cameras.main, vv = vue(ctrl), w = vv.right - vv.left, k = sens > 0 ? -0.1 + 1.2 * prog : 1.1 - 1.2 * prog;
          sil.setPosition(cam.scrollX * r.silhouette.parallaxe + (vv.left - cam.scrollX) + k * w, arbre ? arbre.y : 471);
          sil.setAlpha(Math.min(1, v * 3) * 0.85);
        },
      };
    },

    soir(ctrl, r) {
      return {
        activer: (oui) => { if (!oui) { ctrl.heure = 0; ctrl.progresSoir = 0; } },
        image(dt) {
          ctrl.progresSoir = (ctrl.progresSoir || 0) + dt * ctrl.vitesseSoir / r.duree;
          ctrl.heure = heureSoir(ctrl.progresSoir, ctrl.soirEnBoucle);
        },
      };
    },

    clairiere(ctrl, r) {
      const st = ctrl.st;
      return {
        activer: (oui) => { st.clairieres = oui ? [r] : []; AmbianceKit.refaireMasque(st); },
        image() {},
      };
    },
  };

  // ---------------------------------------------------------------- rendu commun : nuages et soir sur les rayons
  function rendu(ctrl) {
    const { st, r } = ctrl, v = st.v, s = r.soir || {}, k = ctrl.actif.soir ? ctrl.heure : 0;
    const nuage = ctrl.actif.nuages ? ctrl.nuage : 1;
    ctrl.rayons = nuage * (1 + ((s.rayons ?? 1) - 1) * k);
    st.facteurRayons = ctrl.rayons;
    LightKit.regler(st.soleil, { intensite: v.rayons * ctrl.rayons, couleur: melange(0xfff0c8, s.soleil ?? 0xfff0c8, k) });
    const pl = st.scene.game.renderer.pipelines.get('ForetRayons');
    if (pl) {
      pl.faisceau = v.faisceaux * ctrl.rayons;
      const f = s.faisceaux || [1, 0.92, 0.66];
      pl.couleur = [1 + (f[0] - 1) * k, 0.92 + (f[1] - 0.92) * k, 0.66 + (f[2] - 0.66) * k];
    }
    // ambiance : plus sombre et plus chaude en fin de journée (recalculée seulement quand l'heure bouge assez)
    if (Math.abs(k - (ctrl.heureRendue ?? -1)) > 0.01) {
      ctrl.heureRendue = k;
      const a = v.ambiance * (1 + ((s.ambiance ?? 1) - 1) * k), t = v.teinte;
      const ciel = [a * (1 - t) * (1 + 0.08 * k), a * (1 + t * 0.25) * (1 - 0.12 * k), a * (1 - t * 0.7) * (1 - 0.02 * k)];
      LightKit.reglerRendu(st.scene, { ciel, sol: ciel.map((c) => c * 0.94) });
    }
  }

  // ---------------------------------------------------------------- installation
  function installer(st, reglages, { actifs = null, boucleSoir = false, vitesseSoir = 1 } = {}) {
    if (!st || !st.ok) return null;
    const scene = st.scene;
    const ctrl = { st, scene, r: reglages, actif: {}, effets: {}, vent: 0, nuage: 1, heure: 0, rayons: 1, t: 0,
      soirEnBoucle: boucleSoir, vitesseSoir };
    for (const { id } of AMBIANCE_EFFETS_LISTE) {
      if (!reglages[id] || !FABRIQUES[id]) continue;
      ctrl.effets[id] = FABRIQUES[id](ctrl, reglages[id]);
    }
    for (const id of Object.keys(ctrl.effets)) basculer(ctrl, id, actifs ? actifs.includes(id) : true);
    const surImage = (t, delta) => image(ctrl, delta);
    scene.events.on('postupdate', surImage);
    scene.events.once('shutdown', () => {
      scene.events.off('postupdate', surImage);
      const pl = scene.game.renderer.pipelines.get(NOM_BRUME);
      if (pl) pl.masque = null;
    });
    st.effets = ctrl;
    return ctrl;
  }

  function basculer(ctrl, id, oui) {
    const e = ctrl && ctrl.effets[id];
    if (!e) return;
    ctrl.actif[id] = oui;
    e.activer(oui);
  }

  function image(ctrl, delta) {
    if (!ctrl.st.ok) return;
    const dt = Math.min(delta, 100) / 1000;
    ctrl.t = ctrl.scene.time.now / 1000;
    for (const [id, e] of Object.entries(ctrl.effets)) if (ctrl.actif[id]) e.image(dt, ctrl.t);
    rendu(ctrl);
  }

  return { installer, basculer, enveloppe, evenements, heureSoir, melange, groupeOiseaux };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = AmbianceEffets;
