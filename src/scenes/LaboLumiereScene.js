// Labo d'éclairage : `index.html?zone=labo_lumiere&lumiere`. Une vraie zone (buildLevelFromData : sol,
// caméra, Agarica jouable) en TROIS PARTIES traversées à pied, ambiance et lampes en fondu de l'une à
// l'autre : NUIT (champignons, lucioles, feu de camp), SOLEIL (plein jour, auvent d'ombre), BANC D'ESSAI
// (torche au pointeur, lune, tests en boucle). Mannequins immobiles à leur échelle du jeu dans chaque
// partie. Seule cette scène active ce code : le jeu normal n'y passe jamais.
// Touches : U / J réglage, H / L valeur, N groupe de lampes, Y partie suivante, Z zoom (x1, x1,5, x2),
// G éclairage, O sprites d'origine, V décor éclairé, T écran net, C copier, W panneau.
// Zoom : le labo rend en 1920 x 1080 avec une caméra à zoom ENTIER (2, 3, 4), donc x1,5 garde des pixels
// réguliers ; l'interface passe par une 2e caméra. Taille d'origine rendue en quittant la zone.
// Panneau : élément HTML posé sur le canvas, donc indépendant des caméras et du zoom.
// Formes à l'essai : grizzly (Maj), aigle (double saut), ours polaire (A). Rien n'est gardé : la sauvegarde
// et le registre trouvés à l'entrée sont remis en sortant (cf. laboProtegerPartie).

// Mannequins : images du manifeste SECTIONS_LUMIERE, échelle = celle du code de chaque personnage.
const LABO_MANNEQUINS = [
  { id: 'loup', dx: 360, nuit: 420, choix: (e) => e.anim === 'loup_run', echelle: () => WOLF_SCALE },
  { id: 'grizzly', dx: 640, nuit: 720, choix: (e) => e.anim === 'grizzly_run', echelle: () => (getAssetManifest().grizzly || {}).scale || 0.4214 },
  { id: 'crapaud', dx: 880, nuit: 1130, choix: (e) => e.anim === 'crapaud', echelle: () => CRAPAUD_SCALE, origineX: () => CRAPAUD_ORIGIN_X },
  { id: 'kainati', dx: 1560, choix: (e) => e.anim === 'kainati_idle', echelle: () => (getAssetManifest().kainati || {}).scale || 0.6 },
];
const LABO_ZOOMS = [{ nom: 'x1', camera: 2 }, { nom: 'x1,5', camera: 3 }, { nom: 'x2', camera: 4 }];
const LABO_LARGEUR = 1920;   // largeur d'une partie (px du monde)
const LABO_FONDU = 360;      // largeur du fondu entre deux parties
const LABO_BAS_MONDE = 540;  // bas du monde : la caméra ne montre jamais en dessous
const LABO_OMBRE_AUVENT = 0.82;   // ambiance sous l'auvent, uniforme (1 = sprite d'origine)
const LABO_PARTIES = [
  // Ambiance : ciel (plans tournés vers le haut) et sol (vers le bas), niveau x teinte ; detail = dessin d'origine dans l'ambiance
  { id: 'nuit', nom: 'NUIT', ciel: 0.36, cielT: [0.72, 0.82, 1.25], sol: 0.32, solT: [0.72, 0.82, 1.25], detail: 0.7, epaule: 0.8, fond: [8, 10, 24], contre: 1.5, paliers: 4 },
  // Soleil : ciel = sol = 1 et détail 1 redonnent le sprite d'origine ; le soleil n'ajoute qu'une très faible lumière dessus
  { id: 'soleil', nom: 'SOLEIL', ciel: 1, cielT: [1, 1, 1], sol: 1, solT: [1, 1, 1], detail: 1, epaule: 0.95, fond: [143, 184, 216], contre: 1.5, paliers: 4 },
  { id: 'banc', nom: 'BANC D\'ESSAI', ciel: 0.44, cielT: [1, 1, 1], sol: 0.4, solT: [1, 1, 1], detail: 0.7, epaule: 0.8, fond: [13, 11, 26], contre: 1.5, paliers: 4 },
];
const LABO_COULEURS = [0xffb35c, 0x9fb8ff, 0xffffff, 0xfff1d6, 0x5cf0d0, 0xd8ff6a, 0x7dff8a, 0xff5c5c, 0x5c8cff];
const LABO_PALIERS = [2, 3, 4, 5, 0];   // 0 = lisse
// Réglages du panneau : du groupe de lampes choisi, puis de la partie
const LABO_REGLAGES = [
  { id: 'profondeur', groupe: true, pas: 2, min: -160, max: 2400 },
  { id: 'portee', groupe: true, pas: 20, min: 20, max: 12000 },
  { id: 'intensite', groupe: true, pas: 0.05, min: 0, max: 3 },
  { id: 'couleur', groupe: true },
  { id: 'ciel', pas: 0.02, min: 0, max: 1.2 },
  { id: 'sol', pas: 0.02, min: 0, max: 1.2 },
  { id: 'detail', pas: 0.05, min: 0, max: 1 },
  { id: 'contre', pas: 0.1, min: 0, max: 3 },
  { id: 'paliers' },
];
const laboDoux = (t) => { const v = Math.max(0, Math.min(1, t)); return v * v * (3 - 2 * v); };

class LaboLumiereScene extends Phaser.Scene {
  constructor() {
    // Clé = nom de la classe, comme toutes les scènes (tools/verif.py) ; `?zone=labo_lumiere` y mène
    // (cf. BootScene.create)
    super('LaboLumiereScene');
  }

  create(sceneData) {
    this.__laboLumiere = true;   // LightKit.modeTest laisse la main à cette scène
    this.__labo = null;
    this.laboProtegerPartie();   // AVANT la création du joueur : son constructeur écrit déjà l'état
    resolveZoneData('labo_lumiere', LABO_LUMIERE_DATA).then((data) => {
      buildLevelFromData(this, data, sceneData);
      this.laboConstruire();
    });
  }

  update(time, delta) {
    updateLevelFromData(this, time, delta);
    if (this.__labo) this.laboImage(this.time.now);
  }

  // Rien de ce qu'on essaie ici ne reste : sauvegarde du navigateur (comme la zone des ours) et registre
  // remis tels quels à la sortie, sans événement (l'interface de la zone est déjà en cours de fermeture)
  laboProtegerPartie() {
    zoneOursProtectSave(this);
    const reg = this.registry;
    const avant = JSON.parse(JSON.stringify(Object.fromEntries(saveableRegistryEntries(reg))));
    this.events.once('shutdown', () => {
      for (const [k] of saveableRegistryEntries(reg)) {
        if (k in avant) continue;
        delete reg.list[k];
        delete reg.values[k];
      }
      for (const [k, v] of Object.entries(avant)) {
        if (k in reg.list) reg.list[k] = v; else reg.set(k, v);
      }
    });
  }

  // Formes du labo, sur ce joueur seulement : grizzly au sol, aigle en l'air, ours polaire en compétence 1
  laboFormes() {
    const p = this.player;
    if (!p) return;
    p.hasGrizzlyForm = true;
    p.hasEagleForm = true;
    p.airFormsSeen.eagle = true;
    p.equipForm('grizzly');
    p.applyAirForm('eagle');
    p.unlockedSkills.add('ours_polaire');
    p.skillSlots = ['ours_polaire', null, null];
    if (typeof ursideEnsureSkillArt === 'function') ursideEnsureSkillArt(this, SKILL_DEFS.ours_polaire);
  }

  laboFormeActive() {
    const p = this.player;
    if (p.skillTransformActive && p.activeSkillId === 'ours_polaire') return 'ours polaire';
    return { agarica: 'Agarica', grizzly: 'grizzly', eagle: 'aigle' }[p.form] || p.form;
  }

  laboConstruire() {
    const ok = LightKit.activer(this, { ambiance: 0x292a40 });
    const st = {
      ok, zoom: 0, vus: new WeakSet(), groupes: [], lampes: [], ligne: 0, choix: [0, 0, 0], partie: 0, eclairage: true, origine: false, decor: true, net: false,
      visible: true, sprites: [], extras: [], decors: [], messages: [], note: '', image: 0, actives: 0,
      parties: LABO_PARTIES.map((p) => ({ ...p })), max: ok ? this.game.renderer.config.maxLights : 0,
    };
    this.__labo = st;
    this.laboFormes();
    this.laboEcran(st);
    this.laboMannequins(st);
    this.laboDecors(st);
    if (ok) this.laboLampes(st); else st.messages.push('WebGL indisponible : pas d\'eclairage');
    // Décor éclairé : images du sol et décors posés (ni l'interface, ni les champignons qui brillent)
    st.decors = this.children.list.filter((o) => o.type === 'Image' && o.scrollFactorX === 1 && o.depth < CHARACTER_DEPTH
      && !o.__laboBrille && !(o.texture && /champignons_lumineux/.test(o.texture.key)));
    this.laboAppliquer(st);
    st.texte = document.createElement('pre');
    st.texte.id = 'labo-panneau';
    st.texte.style.cssText = 'position:fixed;z-index:10;box-sizing:border-box;width:70ch;margin:0;padding:.5em .8em;color:#e8e2f2;background:#0d0b1acc;'
      + 'font-family:monospace;line-height:1.15;white-space:pre;overflow:hidden;pointer-events:none';
    document.body.appendChild(st.texte);
    this.laboTouches(st);
    this.events.once('shutdown', () => {
      st.texte.remove();
      if (this.game.canvas) this.game.canvas.style.imageRendering = '';
      this.game.scale.setGameSize(st.tailleJeu[0], st.tailleJeu[1]);
    });
    this.laboImage(this.time.now);
    this.laboPanneau(st);
  }

  // Rendu interne 1920 x 1080 : caméra du monde à zoom entier, 2e caméra pour l'interface (repère 960 x 540)
  laboEcran(st) {
    const sc = this.game.scale;
    st.tailleJeu = [sc.gameSize.width, sc.gameSize.height];
    sc.setGameSize(st.tailleJeu[0] * 2, st.tailleJeu[1] * 2);
    this.cameras.main.setLerp(1, 0);
    st.camUi = this.cameras.add(0, 0, st.tailleJeu[0] * 2, st.tailleJeu[1] * 2).setOrigin(0, 0).setZoom(2);
    this.laboRepartir(st);
  }

  // Chaque objet est vu par une seule caméra : fixé à l'écran = interface, sinon monde
  laboRepartir(st) {
    for (const o of this.children.list) {
      if (st.vus.has(o)) continue;
      st.vus.add(o);
      (o.scrollFactorX === 0 ? this.cameras.main : st.camUi).ignore(o);
    }
  }

  // Sol du labo : haut des tuiles, comme la marche d'Agarica
  laboSol() { return 7 * GROUND_TILE_SIZE + GROUND_STAND_SINK; }

  // Sprite animé posé sur le sol depuis les images du manifeste choisies ; null si elles manquent
  laboPoser(st, id, x, choix, echelle, fixe) {
    const man = typeof SECTIONS_LUMIERE !== 'undefined' ? SECTIONS_LUMIERE : {};
    const images = Object.entries(man).filter(([, e]) => choix(e)).sort((a, b) => (a[1].i || 0) - (b[1].i || 0));
    const cles = images.map(([url]) => LightKit.cleDe(url)).filter((k) => k && this.textures.exists(k));
    if (!cles.length) {
      if (!st.messages.includes(`${id} : images ou cartes absentes`)) st.messages.push(`${id} : images ou cartes absentes`);
      return null;
    }
    const e = images[0][1], animKey = `labo-${id}`;
    if (!this.anims.exists(animKey)) this.anims.create({ key: animKey, frames: cles.map((key) => ({ key })), frameRate: e.fps || 12, repeat: -1 });
    // bas du dessin dans l'image (marge transparente sous les pieds) : pieds posés sur le sol
    const marge = e.H - (e.gy + e.h * e.fy);
    const sp = this.add.sprite(x, this.laboSol() + marge * echelle, cles[0]).setScale(echelle)
      .setOrigin(fixe !== undefined ? fixe : 0.5, 1).setDepth(CHARACTER_DEPTH - 1);
    sp.play(animKey);
    return { id, sp, e };
  }

  laboMannequins(st) {
    LABO_PARTIES.forEach((p, i) => {
      for (const def of LABO_MANNEQUINS) {
        const m = this.laboPoser(st, def.id, i * LABO_LARGEUR + (i === 0 && def.nuit ? def.nuit : def.dx), def.choix, def.echelle(), def.origineX ? def.origineX() : undefined);
        if (m) st.sprites.push({ ...m, partie: i });
      }
    });
    // Banc : Agarica retournée gauche / droite sous une lampe fixe
    st.retournee = this.laboPoser(st, 'agarica', 2 * LABO_LARGEUR + 190, (e) => e.anim === 'agarica_idle', HUMAN_SCALE);
    if (st.retournee) {
      st.extras.push(st.retournee.sp);
      // Étiquette : ce mannequin n'est pas la joueuse
      this.add.text(st.retournee.sp.x, this.laboSol() - 96, 'test : retournement', { fontFamily: 'monospace', fontSize: '10px', color: '#d9d4e3', backgroundColor: '#0d0b1acc', padding: { x: 3, y: 1 } })
        .setOrigin(0.5, 1).setResolution(4).setDepth(CHARACTER_DEPTH + 1);
    }
  }

  // Décors du dépôt : feu de camp (animation du jeu, sans son menu), lucioles (fx_luciole) ; l'auvent
  // du soleil est un simple marqueur dessiné (aucun décor du dépôt n'en fait office)
  laboDecors(st) {
    const sol = this.laboSol();
    st.feuX = 960;
    if (typeof ensureCampfireAnimation === 'function') {
      ensureCampfireAnimation(this);
      const feu = this.add.sprite(st.feuX, sol + GROUND_CONTACT_SINK, `${CAMPFIRE_TEXTURE_PREFIX}0`).setOrigin(0.5, 1).setScale(CAMPFIRE_SCALE).setDepth(CHARACTER_DEPTH - 2);
      feu.play(ANIM_CAMPFIRE_BURN_KEY);
      feu.lookRole = 'prop';
    }
    // Auvent : poteaux et toit, zone d'ombre de x0 à x1 (grizzly dessous)
    st.ombre = { x0: LABO_LARGEUR + 520, x1: LABO_LARGEUR + 770 };
    const g = this.add.graphics().setDepth(CHARACTER_DEPTH + 1);
    const { x0, x1 } = st.ombre;
    g.fillStyle(0x2a1d14, 1);
    g.fillRect(x0 - 16, sol - 196, x1 - x0 + 32, 14);
    g.fillRect(x0, sol - 182, 8, 182);
    g.fillRect(x1 - 8, sol - 182, 8, 182);
    g.fillStyle(0x4a3322, 1);
    for (let x = x0 - 16; x < x1 + 16; x += 24) g.fillRect(x, sol - 196, 12, 4);
  }

  // Ajoute un groupe de lampes (réglé d'un bloc dans le panneau). maj(t, i) : position et force du moment
  laboGroupe(st, partie, nom, base, positions, maj, prioritaire) {
    const g = { partie, nom, ...base, lampes: [] };
    positions.forEach((pos, i) => {
      const L = base.direction ? LightKit.ajouterSoleil(this, { direction: base.direction, couleur: base.couleur, intensite: base.intensite })
        : LightKit.ajouterLumiere(this, { x: pos.x, y: pos.y, portee: base.portee, couleur: pos.couleur ?? base.couleur, intensite: base.intensite, profondeur: base.profondeur });
      const lampe = { L, g, i, pos, prioritaire: !!prioritaire, maj };
      g.lampes.push(lampe);
      st.lampes.push(lampe);
    });
    st.groupes.push(g);
    return g;
  }

  laboLampes(st) {
    const sol = this.laboSol();
    const X = (p, dx) => p * LABO_LARGEUR + dx;
    const fixe = () => ({});
    // ---- NUIT
    const champis = [170, 590, 850, 1380, 1760].map((dx) => ({ x: X(0, dx), y: sol - 60 }));
    this.laboGroupe(st, 0, 'champignons', { profondeur: 32, portee: 280, intensite: 0.7, couleur: 0x5cf0d0 }, champis,
      (t, i) => ({ force: 0.75 + 0.25 * Math.sin(t / 1100 + i * 1.7) }));
    const lucioles = [260, 560, 830, 1040, 1390, 1700].map((dx, i) => ({ x: X(0, dx), y: sol - 70 - (i * 37) % 100 }));
    st.lucioles = [];
    this.laboGroupe(st, 0, 'lucioles', { profondeur: 30, portee: 150, intensite: 0.7, couleur: 0xd8ff6a }, lucioles, (t, i, pos) => {
      const x = pos.x + 28 * Math.sin(t / 1700 + i * 2.1) + 14 * Math.sin(t / 730 + i), y = pos.y + 18 * Math.sin(t / 1300 + i * 1.3);
      const f = Math.max(0, Math.sin(t / 2300 + i * 2.6)); const force = f * f;
      const sp = st.lucioles[i];
      if (sp) sp.setPosition(x, y).setAlpha(force);
      return { x, y, force };
    });
    if (this.textures.exists('item-fx_luciole')) {
      st.lucioles = lucioles.map((p) => {
        const sp = this.add.image(p.x, p.y, 'item-fx_luciole').setScale(0.11).setTint(0xd8ff6a).setBlendMode(Phaser.BlendModes.ADD).setDepth(CHARACTER_DEPTH + 1);
        sp.__laboBrille = true;
        return sp;
      });
    }
    this.laboGroupe(st, 0, 'feu de camp', { profondeur: 55, portee: 520, intensite: 1.05, couleur: 0xffb35c }, [{ x: st.feuX, y: sol - 40 }], (t, i, pos) => {
      const v = Math.sin(t / 90) * 0.4 + Math.sin(t / 37 + 1) * 0.35 + Math.sin(t / 211) * 0.25;
      return { x: pos.x + v * 3, y: pos.y + v * 2, force: 0.86 + 0.14 * v };
    }, true);
    const kai = (p) => ({ x: X(p, 1560), y: sol - 130 });
    this.laboGroupe(st, 0, 'derriere Kainati', { profondeur: -24, portee: 300, intensite: 0.9, couleur: 0xffb35c }, [kai(0)],
      (t, i, pos) => ({ x: pos.x + 160 * Math.sin(t / 2600) }), true);
    // ---- SOLEIL : lumière directionnelle fixe, même direction partout, indépendante de la caméra et du joueur
    const soleil = this.laboGroupe(st, 1, 'soleil', { direction: LightKit.SOLEIL.direction, intensite: LightKit.SOLEIL.intensite, couleur: LightKit.SOLEIL.couleur }, [{ x: 0, y: 0 }], fixe, true);
    // Auvent : plus de soleil dessous, ambiance un peu plus basse et uniforme (bords adoucis sur 48 px)
    const { x0, x1 } = st.ombre;
    const dessous = (o) => laboDoux((o.x - (x0 - 24)) / 48) * laboDoux(((x1 + 24) - o.x) / 48);
    soleil.lampes[0].L.attenuation = (o) => 1 - dessous(o);
    LightKit.reglerRendu(this, { ombre: (o) => 1 - (1 - LABO_OMBRE_AUVENT) * dessous(o) });
    // ---- BANC D'ESSAI
    this.laboGroupe(st, 2, 'torche (pointeur)', { profondeur: 8, portee: 220, intensite: 1, couleur: 0xffb35c }, [{ x: X(2, 300), y: 300 }], () => {
      const pt = this.input.activePointer.positionToCamera(this.cameras.main);
      return { x: pt.x, y: pt.y };
    }, true);
    this.laboGroupe(st, 2, 'lune', { profondeur: 30, portee: 900, intensite: 0.8, couleur: 0x9fb8ff }, [{ x: X(2, 900), y: -260 }], fixe);
    this.laboGroupe(st, 2, 'derriere Kainati', { profondeur: -20, portee: 420, intensite: 1, couleur: 0xffb35c }, [kai(2)], fixe);
    this.laboGroupe(st, 2, 'devant / derriere (loup)', { profondeur: 0, portee: 240, intensite: 1, couleur: 0xffffff }, [{ x: X(2, 320), y: sol - 90 }],
      (t) => ({ z: 48 * Math.sin(t / 2400) }));
    this.laboGroupe(st, 2, 'tournante (grizzly)', { profondeur: 16, portee: 240, intensite: 1, couleur: 0xff5c5c }, [{ x: X(2, 640), y: sol - 70 }],
      (t, i, pos) => ({ x: pos.x + 130 * Math.cos(t / 1500), y: pos.y + 80 * Math.sin(t / 1500) }));
    this.laboGroupe(st, 2, 'trois couleurs (crapaud)', { profondeur: 16, portee: 200, intensite: 0.8, couleur: null }, [
      { x: X(2, 800), y: sol - 70, couleur: 0xff5c5c }, { x: X(2, 880), y: sol - 120, couleur: 0x7dff8a }, { x: X(2, 960), y: sol - 70, couleur: 0x5c8cff },
    ], fixe);
    this.laboGroupe(st, 2, 'fixe (Agarica retournee)', { profondeur: 14, portee: 240, intensite: 1, couleur: 0xffb35c }, [{ x: X(2, 110), y: sol - 130 }], fixe);
  }

  // Applique les bascules : qui passe par le pipeline d'éclairage, quel rendu d'écran
  laboAppliquer(st) {
    if (this.game.canvas) this.game.canvas.style.imageRendering = st.net ? 'pixelated' : '';
    if (!st.ok) return;
    const persos = st.sprites.map((m) => m.sp).concat(st.extras, this.player ? [this.player] : []);
    (st.eclairage && !st.origine ? LightKit.eclairer : LightKit.nePlusEclairer)(persos);
    (st.eclairage && st.decor ? LightKit.eclairer : LightKit.nePlusEclairer)(st.decors);
    if (st.eclairage) this.lights.enable(); else this.lights.disable();
  }

  laboTouches(st) {
    const k = this.input.keyboard;
    const sur = (touche, f) => k.on(`keydown-${touche}`, () => { f(); this.laboPanneau(st); });
    const bascule = (nom) => () => { st[nom] = !st[nom]; this.laboAppliquer(st); };
    sur('U', () => { st.ligne = Phaser.Math.Wrap(st.ligne - 1, 0, LABO_REGLAGES.length); });
    sur('J', () => { st.ligne = Phaser.Math.Wrap(st.ligne + 1, 0, LABO_REGLAGES.length); });
    sur('H', () => this.laboChanger(st, -1));
    sur('L', () => this.laboChanger(st, 1));
    sur('N', () => { st.choix[st.partie] = Phaser.Math.Wrap(st.choix[st.partie] + 1, 0, Math.max(1, this.laboGroupes(st).length)); });
    sur('Y', () => { this.laboTeleporter(st); this.laboCadrer(st, true); });
    sur('Z', () => { st.zoom = (st.zoom + 1) % LABO_ZOOMS.length; this.laboCadrer(st, true); });
    sur('G', bascule('eclairage'));
    sur('O', bascule('origine'));
    sur('V', bascule('decor'));
    sur('T', bascule('net'));
    sur('W', () => { st.visible = !st.visible; st.texte.style.display = st.visible ? '' : 'none'; });
    sur('C', () => this.laboCopier(st));
  }

  laboTeleporter(st) {
    const p = this.player;
    if (!p || !p.body) return;
    const suivante = (st.partie + 1) % LABO_PARTIES.length;
    p.body.reset(suivante * LABO_LARGEUR + 240, this.laboSol() - 60);
  }

  laboGroupes(st) { return st.groupes.filter((g) => g.partie === st.partie); }
  laboGroupe_(st) { const l = this.laboGroupes(st); return l[Math.min(st.choix[st.partie], l.length - 1)]; }

  laboChanger(st, sens) {
    const r = LABO_REGLAGES[st.ligne], g = this.laboGroupe_(st), p = st.parties[st.partie];
    if (!st.ok || (r.groupe && !g)) return;
    if (r.id === 'couleur') {
      const i = Phaser.Math.Wrap(LABO_COULEURS.indexOf(g.couleur) + sens, 0, LABO_COULEURS.length);
      g.couleur = LABO_COULEURS[i];
      for (const l of g.lampes) LightKit.regler(l.L, { couleur: g.couleur });
    } else if (r.id === 'paliers') {
      p.paliers = LABO_PALIERS[Phaser.Math.Wrap(LABO_PALIERS.indexOf(p.paliers) + sens, 0, LABO_PALIERS.length)];
    } else {
      const cible = r.groupe ? g : p;
      if (cible[r.id] == null) return;   // le soleil n'a ni profondeur ni portée
      cible[r.id] = Phaser.Math.Clamp(Math.round((cible[r.id] + sens * r.pas) * 100) / 100, r.min, r.max);
    }
  }

  laboReglagesPartie(st) {
    const p = st.parties[st.partie];
    return {
      partie: p.id, ciel: p.ciel, cielTeinte: p.cielT, sol: p.sol, solTeinte: p.solT, detail: p.detail, contre: p.contre, paliers: p.paliers,
      lampes: this.laboGroupes(st).map((g) => ({
        nom: g.nom, nombre: g.lampes.length, direction: g.direction, profondeur: g.profondeur, portee: g.portee, intensite: g.intensite,
        couleur: g.couleur === null ? 'plusieurs' : `#${g.couleur.toString(16).padStart(6, '0')}`,
      })),
      eclairage: st.eclairage, origine: st.origine, decor: st.decor, ecranNet: st.net,
    };
  }

  // Dans le presse-papiers si le navigateur l'autorise, toujours dans la console
  laboCopier(st) {
    const txt = JSON.stringify(this.laboReglagesPartie(st), null, 2);
    console.log(`[labo_lumiere] réglages :\n${txt}`);
    st.note = 'reglages ecrits dans la console (F12)';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(() => { st.note = 'reglages copies dans le presse-papiers'; this.laboPanneau(st); }).catch(() => {});
    }
  }

  laboPanneau(st) {
    if (!st.texte) return;
    const g = this.laboGroupe_(st), p = st.parties[st.partie];
    const aff = (r) => {
      if (r.id === 'couleur') return !g ? '-' : g.couleur === null ? 'plusieurs' : `#${g.couleur.toString(16).padStart(6, '0')}`;
      if (r.id === 'paliers') return p.paliers || 'lisse';
      return r.groupe ? (g ? g[r.id] ?? '-' : '-') : p[r.id];
    };
    const oui = (b) => (b ? 'oui' : 'non');
    const lignes = [`LABO LUMIERE : ${p.nom}   [Y] partie suivante   [Z] zoom ${LABO_ZOOMS[st.zoom].nom}`, `groupe [N] : ${g ? `${g.nom} (${g.lampes.length})` : 'aucun'}`];
    LABO_REGLAGES.forEach((r, i) => lignes.push(`${i === st.ligne ? '>' : ' '} ${r.id.padEnd(11)} ${aff(r)}`));
    lignes.push('U/J reglage  H/L valeur  C copier  W panneau');
    lignes.push(`G eclairage ${oui(st.eclairage)}  O origine ${oui(st.origine)}  V decor ${oui(st.decor)}  T net ${oui(st.net)}`);
    lignes.push(`lampes actives ${st.actives} / ${st.max}`);
    if (this.player) lignes.push(`forme : ${this.laboFormeActive()}`);
    lignes.push('  Maj + direction grizzly   A ours polaire');
    lignes.push('  Espace x2 aigle (tenir : plane, S : pique)');
    lignes.push('taille ecran, px ecran par case de carte :');
    for (const m of st.sprites.filter((s) => s.partie === st.partie)) {
      lignes.push(`  ${m.id.padEnd(8)} ${Math.round(m.e.w * (m.e.np || 1))} x ${Math.round(m.e.h * (m.e.np || 1))}  ${((LightKit.pixelEcran(m.sp) || 0) / 2).toFixed(2)}`);
    }
    const j = this.player;
    if (j && j.frame) {
      const k = LightKit.pixelEcran(j);
      lignes.push(`agarica : ${j.frame.texture.key} ${k ? (k / 2).toFixed(2) : 'SANS CARTE (eclairee a plat)'}`);
    }
    for (const m of st.messages) lignes.push(`! ${m}`);
    if (st.note) lignes.push(st.note);
    st.texte.textContent = lignes.join('\n');
    this.laboPlacerPanneau(st);
  }

  // Panneau calé sur le canvas : même place et même taille quel que soit le zoom, police selon la fenêtre
  laboPlacerPanneau(st) {
    const c = this.game.canvas;
    if (!c) return;
    let r = c.getBoundingClientRect();
    if (r.width > window.innerWidth + 1 || r.height > window.innerHeight + 1) { this.scale.refresh(); r = c.getBoundingClientRect(); }
    const s = st.texte.style;
    s.left = `${Math.round(r.left + r.width * 0.01)}px`;
    s.top = `${Math.round(r.top + r.height * 0.12)}px`;
    s.fontSize = `${Phaser.Math.Clamp(r.height / 48, 7, 13)}px`;
    s.maxWidth = `${Math.floor(r.width * 0.98)}px`;
    s.maxHeight = `${Math.floor(r.height * 0.87)}px`;
  }

  // Zoom et hauteur de la caméra : jamais sous le bas du monde. immediat : aussi sur Agarica en largeur, sans attendre
  laboCadrer(st, immediat) {
    const cam = this.cameras.main, zc = LABO_ZOOMS[st.zoom].camera, hVue = cam.height / zc, lVue = cam.width / zc;
    if (cam.zoom !== zc) cam.setZoom(zc);
    const bas = st.zoom === 0 ? LABO_BAS_MONDE : Math.min(LABO_BAS_MONDE, this.laboSol() + 60);
    cam.scrollY = Math.max(0, bas - hVue) - (cam.height - hVue) / 2;
    if (!immediat || !this.player) return;
    const marge = (cam.width - lVue) / 2;
    cam.scrollX = Phaser.Math.Clamp(this.player.x - cam.width / 2, -marge, this.levelWidth - lVue - marge);
    this.scale.refresh();
  }

  // Poids de chaque partie selon la position d'Agarica : fondu sur LABO_FONDU autour de chaque limite
  laboPoids(x) {
    const n = LABO_PARTIES.length;
    return LABO_PARTIES.map((_, i) => {
      const entree = i === 0 ? 1 : laboDoux((x - (i * LABO_LARGEUR - LABO_FONDU / 2)) / LABO_FONDU);
      const sortie = i === n - 1 ? 1 : 1 - laboDoux((x - ((i + 1) * LABO_LARGEUR - LABO_FONDU / 2)) / LABO_FONDU);
      return entree * sortie;
    });
  }

  // À chaque image : fondu d'ambiance, lampes animées, et seulement les plus utiles allumées
  laboImage(t) {
    const st = this.__labo, cam = this.cameras.main;
    this.laboRepartir(st);
    // Zoom imposé à chaque image (le fondu d'entrée de zone remet la caméra à 1). Bas de la vue : bas de
    // la zone à x1, 60 px sous le sol en zoomant (les personnages restent au milieu de l'écran)
    this.laboCadrer(st);
    const zc = LABO_ZOOMS[st.zoom].camera;
    // Hors de la vue : rien à dessiner (les corps physiques du sol ne dépendent pas de l'affichage)
    const vueX = cam.scrollX + cam.width / 2, demi = cam.width / zc / 2;
    for (const o of st.decors) o.setVisible(Math.abs(o.x - vueX) < demi + 160);
    for (const m of st.sprites) m.sp.setVisible(Math.abs(m.sp.x - vueX) < demi + 420);
    const x = this.player ? this.player.x : 0;
    // Énergie toujours pleine : l'ours polaire reste disponible pendant les essais
    if (this.player && this.player.energy < ENERGY_MAX) { this.player.energy = ENERGY_MAX; this.registry.set('energy', ENERGY_MAX); }
    const poids = this.laboPoids(x);
    st.partie = poids.indexOf(Math.max(...poids));
    if (st.retournee) st.retournee.sp.setFlipX(Math.floor(t / 1400) % 2 === 1);
    if (st.ok) {
      const melange = (f) => [0, 1, 2].map((k) => st.parties.reduce((s, p, i) => s + poids[i] * f(p, k), 0));
      const courant = st.parties[st.partie];
      const moyenne = (nom) => st.parties.reduce((s, p, i) => s + poids[i] * p[nom], 0);
      LightKit.reglerRendu(this, {
        ciel: melange((p, k) => p.ciel * p.cielT[k]), sol: melange((p, k) => p.sol * p.solT[k]),
        detail: moyenne('detail'), epaule: moyenne('epaule'), contre: courant.contre, paliers: courant.paliers,
      });
      // Lampes candidates : partie présente, cercle dans la vue ; les prioritaires d'abord puis les plus proches
      const vue = cam.worldView, cx = vue.centerX, cy = vue.centerY;
      const candidates = [];
      for (const l of st.lampes) {
        const m = l.maj(t, l.i, l.pos) || {};
        const px = m.x ?? l.pos.x, py = m.y ?? l.pos.y;
        if (!l.g.direction) {
          l.L.setPosition(px, py);
          l.L.profondeur = l.g.profondeur + (m.z || 0);
          l.L.setRadius(l.g.portee);
        }
        const force = poids[l.g.partie] * (m.force ?? 1);
        l.L.setIntensity(l.g.intensite * force);
        const dx = Math.max(Math.abs(px - cx) - vue.width / 2, 0), dy = Math.max(Math.abs(py - cy) - vue.height / 2, 0);
        const utile = force > 0.02 && (!!l.g.direction || dx * dx + dy * dy < l.g.portee * l.g.portee);
        l.L.setVisible(false);
        if (utile) candidates.push({ l, d: Math.hypot(px - cx, py - cy) - (l.prioritaire ? 1e6 : 0) });
      }
      candidates.sort((a, b) => a.d - b.d);
      const gardees = candidates.slice(0, st.max);
      for (const c of gardees) c.l.L.setVisible(true);
      st.actives = gardees.length;
    }
    const fond = [0, 1, 2].map((k) => Math.round(st.parties.reduce((s, p, i) => s + poids[i] * p.fond[k], 0)));
    cam.setBackgroundColor((fond[0] << 16) | (fond[1] << 8) | fond[2]);
    if (st.visible && ++st.image % 12 === 0) this.laboPanneau(st);
  }
}
