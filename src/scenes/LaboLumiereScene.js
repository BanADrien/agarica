// Labo d'éclairage : `index.html?zone=labo_lumiere&lumiere`. Une vraie zone (buildLevelFromData :
// sol, caméra, Agarica jouable) avec des mannequins immobiles à leur échelle du jeu, trois lampes et
// un panneau de réglage au clavier. Seule cette scène active ce code : le jeu normal n'y passe jamais.
// Touches libres dans le jeu : U / J choisir un réglage, H / L le changer, N lampe suivante,
// G éclairage, O sprites d'origine, V décor éclairé, T écran net, C copier, W panneau.

// Mannequins : images du manifeste SECTIONS_LUMIERE, échelle = celle du code de chaque personnage.
const LABO_MANNEQUINS = [
  { id: 'loup', x: 560, choix: (e) => e.anim === 'loup_run', echelle: () => WOLF_SCALE },
  { id: 'grizzly', x: 840, choix: (e) => /^grizzly_row0_/.test(e.n), echelle: () => (getAssetManifest().grizzly || {}).scale || 0.4214 },
  { id: 'crapaud', x: 1080, choix: (e) => e.anim === 'crapaud', echelle: () => CRAPAUD_SCALE, origineX: () => CRAPAUD_ORIGIN_X },
  { id: 'kainati', x: 1760, choix: (e) => e.anim === 'kainati_idle', echelle: () => (getAssetManifest().kainati || {}).scale || 0.6 },
];
const LABO_COULEURS = [['torche', 0xffb35c], ['lune', 0x9fb8ff], ['blanc', 0xffffff], ['vert', 0x7dff8a], ['rouge', 0xff5c5c]];
const LABO_PALIERS = [2, 3, 4, 5, 0];   // 0 = lisse

// Réglages du panneau : par lampe, puis communs à la scène
const LABO_REGLAGES = [
  { id: 'profondeur', lampe: true, pas: 2, min: -120, max: 120 },
  { id: 'portee', lampe: true, pas: 20, min: 20, max: 2400 },
  { id: 'intensite', lampe: true, pas: 0.05, min: 0, max: 3 },
  { id: 'couleur', lampe: true },
  { id: 'ambiance', pas: 0.02, min: 0, max: 1 },
  { id: 'contre', pas: 0.1, min: 0, max: 3 },
  { id: 'paliers' },
];

class LaboLumiereScene extends Phaser.Scene {
  constructor() {
    // Clé = nom de la classe, comme toutes les scènes (tools/verif.py) ; `?zone=labo_lumiere` y mène
    // (cf. BootScene.create)
    super('LaboLumiereScene');
  }

  create(sceneData) {
    this.__laboLumiere = true;   // LightKit.modeTest laisse la main à cette scène
    this.__labo = null;
    resolveZoneData('labo_lumiere', LABO_LUMIERE_DATA).then((data) => {
      buildLevelFromData(this, data, sceneData);
      this.cameras.main.setBackgroundColor(0x0d0b1a);
      this.laboConstruire();
    });
  }

  update(time, delta) {
    updateLevelFromData(this, time, delta);
    if (this.__labo) this.laboImage();
  }

  laboConstruire() {
    const ok = LightKit.activer(this, { ambiance: 0x5c5c5c });
    const st = {
      ok, lampes: [], ligne: 0, lampe: 0, eclairage: true, origine: false, decor: true, net: false,
      visible: true, ambiance: 0.36, sprites: [], decors: [], messages: [], note: '', image: 0,
    };
    this.__labo = st;
    this.laboMannequins(st);
    if (!ok) st.messages.push('WebGL indisponible : pas d\'éclairage');
    if (ok) this.laboLampes(st);
    // Décor : les images du sol (pas l'interface, fixée à l'écran)
    st.decors = this.children.list.filter((o) => o.type === 'Image' && o.scrollFactorX === 1 && o.depth < CHARACTER_DEPTH);
    this.laboAppliquer(st);
    st.texte = this.add.text(10, 64, '', {
      fontFamily: 'monospace', fontSize: '12px', color: '#e8e2f2', backgroundColor: '#0d0b1acc', padding: { x: 8, y: 6 },
    }).setScrollFactor(0).setDepth(100000);
    st.texte.lookRole = 'ui';
    this.laboTouches(st);
    this.events.once('shutdown', () => { if (this.game.canvas) this.game.canvas.style.imageRendering = ''; });
    this.laboPanneau(st);
  }

  // Sol du labo : haut des tuiles, comme la marche d'Agarica
  laboSol() { return 7 * GROUND_TILE_SIZE + GROUND_STAND_SINK; }

  laboMannequins(st) {
    const man = typeof SECTIONS_LUMIERE !== 'undefined' ? SECTIONS_LUMIERE : {};
    for (const def of LABO_MANNEQUINS) {
      const images = Object.entries(man).filter(([, e]) => def.choix(e)).sort((a, b) => (a[1].i || 0) - (b[1].i || 0) || (a[1].n < b[1].n ? -1 : 1));
      const cles = images.map(([url]) => LightKit.cleDe(url)).filter((k) => k && this.textures.exists(k));
      if (!cles.length) { st.messages.push(`${def.id} : images ou cartes absentes`); continue; }
      const e = images[0][1];
      const animKey = `labo-${def.id}`;
      if (!this.anims.exists(animKey)) this.anims.create({ key: animKey, frames: cles.map((key) => ({ key })), frameRate: e.fps || 12, repeat: -1 });
      const echelle = def.echelle();
      // bas du dessin dans l'image (marge transparente sous les pieds) : pieds posés sur le sol
      const marge = e.H - (e.gy + e.h * e.fy);
      const sp = this.add.sprite(def.x, this.laboSol() + marge * echelle, cles[0]).setScale(echelle)
        .setOrigin(def.origineX ? def.origineX() : 0.5, 1).setDepth(CHARACTER_DEPTH - 1);
      sp.play(animKey);
      st.sprites.push({ id: def.id, sp, e, echelle, marge });
    }
  }

  laboLampes(st) {
    const kai = st.sprites.find((m) => m.id === 'kainati') || st.sprites[st.sprites.length - 1];
    const ajout = (nom, preset, options) => {
      const L = LightKit.ajouterLumiere(this, preset, options);
      st.lampes.push({ nom, L, couleur: LABO_COULEURS.findIndex((c) => c[1] === LightKit.PRESETS[preset].couleur) });
    };
    ajout('torche (pointeur)', 'torche', { x: 400, y: 300 });
    ajout('lune (fixe)', 'lune', { x: 1100, y: -260 });
    const hauteur = kai ? kai.sp.displayHeight / 2 : 120;
    ajout('derriere (mannequin)', 'contrejour', { x: kai ? kai.sp.x : 1760, y: this.laboSol() - hauteur, portee: 420 });
  }

  // Applique les bascules : qui passe par le pipeline d'éclairage, à quelle échelle, quel rendu d'écran
  laboAppliquer(st) {
    const persos = st.sprites.map((m) => m.sp).concat(this.player ? [this.player] : []);
    if (this.game.canvas) this.game.canvas.style.imageRendering = st.net ? 'pixelated' : '';
    if (!st.ok) return;
    const persosLumiere = st.eclairage && !st.origine;
    (persosLumiere ? LightKit.eclairer : LightKit.nePlusEclairer)(persos);
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
    sur('N', () => { st.lampe = Phaser.Math.Wrap(st.lampe + 1, 0, Math.max(1, st.lampes.length)); });
    sur('G', bascule('eclairage'));
    sur('O', bascule('origine'));
    sur('V', bascule('decor'));
    sur('T', bascule('net'));
    sur('W', () => { st.visible = !st.visible; st.texte.setVisible(st.visible); });
    sur('C', () => this.laboCopier(st));
  }

  laboValeur(st, r) {
    const L = st.lampes[st.lampe];
    const reg = this.__lumiere ? this.__lumiere.reglages : LightKit.DEFAUTS;
    switch (r.id) {
      case 'profondeur': return L ? L.L.profondeur : 0;
      case 'portee': return L ? L.L.radius : 0;
      case 'intensite': return L ? L.L.intensity : 0;
      case 'ambiance': return st.ambiance;
      case 'contre': return reg.contre;
      default: return 0;
    }
  }

  laboChanger(st, sens) {
    const r = LABO_REGLAGES[st.ligne], L = st.lampes[st.lampe];
    if (!st.ok || (r.lampe && !L)) return;
    if (r.id === 'couleur') {
      L.couleur = Phaser.Math.Wrap(L.couleur + sens, 0, LABO_COULEURS.length);
      LightKit.regler(L.L, { couleur: LABO_COULEURS[L.couleur][1] });
      return;
    }
    if (r.id === 'paliers') {
      const i = LABO_PALIERS.indexOf(this.__lumiere.reglages.paliers);
      LightKit.reglerRendu(this, { paliers: LABO_PALIERS[Phaser.Math.Wrap(i + sens, 0, LABO_PALIERS.length)] });
      return;
    }
    const v = Phaser.Math.Clamp(Math.round((this.laboValeur(st, r) + sens * r.pas) * 100) / 100, r.min, r.max);
    if (r.id === 'profondeur') LightKit.regler(L.L, { profondeur: v });
    else if (r.id === 'portee') LightKit.regler(L.L, { portee: v });
    else if (r.id === 'intensite') LightKit.regler(L.L, { intensite: v });
    else if (r.id === 'contre') LightKit.reglerRendu(this, { contre: v });
    else if (r.id === 'ambiance') {
      st.ambiance = v;
      const g = Math.round(v * 255);
      LightKit.ambiance(this, (g << 16) | (g << 8) | g);
    }
  }

  laboReglagesCourants(st) {
    const reg = this.__lumiere ? this.__lumiere.reglages : LightKit.DEFAUTS;
    return {
      lampes: st.lampes.map((l) => ({
        nom: l.nom, x: Math.round(l.L.x), y: Math.round(l.L.y), profondeur: l.L.profondeur, portee: l.L.radius,
        intensite: l.L.intensity, couleur: `#${LABO_COULEURS[Math.max(0, l.couleur)][1].toString(16).padStart(6, '0')}`,
      })),
      ambiance: st.ambiance, contre: reg.contre, paliers: reg.paliers,
      eclairage: st.eclairage, origine: st.origine, decor: st.decor, ecranNet: st.net,
    };
  }

  // Dans le presse-papiers si le navigateur l'autorise, toujours dans la console
  laboCopier(st) {
    const txt = JSON.stringify(this.laboReglagesCourants(st), null, 2);
    console.log(`[labo_lumiere] réglages :\n${txt}`);
    st.note = 'réglages écrits dans la console (F12)';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(() => { st.note = 'réglages copiés dans le presse-papiers'; this.laboPanneau(st); }).catch(() => {});
    }
  }

  laboPanneau(st) {
    if (!st.texte) return;
    const L = st.lampes[st.lampe];
    const reg = this.__lumiere ? this.__lumiere.reglages : LightKit.DEFAUTS;
    const aff = (r) => {
      if (r.id === 'couleur') return L ? LABO_COULEURS[Math.max(0, L.couleur)][0] : '-';
      if (r.id === 'paliers') return reg.paliers || 'lisse';
      return this.laboValeur(st, r);
    };
    const oui = (b) => (b ? 'oui' : 'non');
    const lignes = [`LABO LUMIERE   lampe [N] : ${L ? L.nom : 'aucune'}`];
    LABO_REGLAGES.forEach((r, i) => lignes.push(`${i === st.ligne ? '>' : ' '} ${r.id.padEnd(11)} ${aff(r)}`));
    lignes.push('U/J reglage   H/L valeur   C copier   W panneau');
    lignes.push(`G eclairage ${oui(st.eclairage)}  O origine ${oui(st.origine)}  V decor ${oui(st.decor)}`);
    lignes.push(`T ecran net ${oui(st.net)}`);
    lignes.push('taille ecran, px ecran par case de carte :');
    for (const m of st.sprites) lignes.push(`  ${m.id.padEnd(8)} ${Math.round(m.e.w * (m.e.np || 1))} x ${Math.round(m.e.h * (m.e.np || 1))}  ${(LightKit.pixelEcran(m.sp) || 0).toFixed(2)}`);
    const p = this.player;
    if (p && p.frame) {
      const k = LightKit.pixelEcran(p);
      lignes.push(`agarica : ${p.frame.texture.key} ${k ? k.toFixed(2) : 'SANS CARTE (eclairee a plat)'}`);
    }
    for (const m of st.messages) lignes.push(`! ${m}`);
    if (st.note) lignes.push(st.note);
    st.texte.setText(lignes.join('\n'));
  }

  // À chaque image : la torche reste sous le pointeur même quand la caméra défile
  laboImage() {
    const st = this.__labo;
    const torche = st.lampes[0];
    if (torche) {
      const pt = this.input.activePointer.positionToCamera(this.cameras.main);
      LightKit.deplacer(torche.L, pt.x, pt.y);
    }
    if (st.visible && ++st.image % 12 === 0) this.laboPanneau(st);
  }
}
