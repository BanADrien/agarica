// Forêt d'ambiance : `index.html?zone=foret_ambiance` (ou Options > Zones de test). Même copie de la forêt sombre que
// la forêt de lumière, avec l'ambiance « forêt » d'AmbianceKit et TOUS les effets d'AmbianceEffets, chacun coupable.
// Touches : U / J choisir, H / L couper / activer (vitesse du soir : moins / plus ; ligne « tout » : tout couper /
// tout activer), W panneau, G éclairage coupé.

class ForetAmbianceScene extends Phaser.Scene {
  constructor() {
    super('ForetAmbianceScene');
  }

  create(sceneData) {
    this.__laboLumiere = true;   // LightKit.modeTest laisse la main à cette scène
    this.__foretAmb = null;
    LaboLumiereScene.prototype.laboProtegerPartie.call(this);   // rien n'est gardé dans la sauvegarde
    resolveZoneData('foret_ambiance', FORET_AMBIANCE_DATA).then((data) => {
      buildLevelFromData(this, data, sceneData);
      this.ambConstruire(data);
    });
  }

  update(time, delta) {
    updateLevelFromData(this, time, delta);
    const p = this.__foretAmb;
    if (!p || !p.st.ok) return;
    if (p.visible && p.st.image % 12 === 0) this.ambPanneau();
    if (this.player && this.player.energy < ENERGY_MAX) { this.player.energy = ENERGY_MAX; this.registry.set('energy', ENERGY_MAX); }
  }

  ambConstruire(data) {
    const st = AmbianceKit.installer(this, data, AMBIANCES_LUMIERE.foret);
    // fin de journée en boucle et accélérée pour pouvoir la juger (x20 : une boucle en 30 s)
    const ctrl = AmbianceEffets.installer(st, AMBIANCE_EFFETS.foret, { boucleSoir: true, vitesseSoir: 20 });
    const p = { st, ctrl, visible: true, ligne: 0 };
    this.__foretAmb = p;
    LaboLumiereScene.prototype.laboFormes.call(this);
    p.texte = document.createElement('pre');
    p.texte.id = 'foret-ambiance-panneau';
    p.texte.style.cssText = 'position:fixed;z-index:10;box-sizing:border-box;width:58ch;margin:0;padding:.5em .8em;color:#e8e2f2;background:#0d0b1acc;'
      + 'font-family:monospace;line-height:1.15;white-space:pre;overflow:hidden;pointer-events:none';
    document.body.appendChild(p.texte);
    this.events.once('shutdown', () => p.texte.remove());
    this.ambTouches();
    this.ambPanneau();
  }

  // Lignes du panneau : un effet par ligne, puis la vitesse du soir et « tout »
  ambLignes() {
    const ctrl = this.__foretAmb.ctrl;
    const effets = ctrl ? AMBIANCE_EFFETS_LISTE.filter((e) => ctrl.effets[e.id]) : [];
    return [...effets.map((e) => ({ ...e, type: 'effet' })), { id: 'vitesse', type: 'vitesse' }, { id: 'tout', type: 'tout' }];
  }

  ambTouches() {
    const k = this.input.keyboard, p = this.__foretAmb;
    const sur = (touche, f) => k.on(`keydown-${touche}`, () => { f(); this.ambPanneau(); });
    const changer = (sens) => {
      const l = this.ambLignes()[p.ligne], ctrl = p.ctrl;
      if (!l || !ctrl) return;
      if (l.type === 'effet') AmbianceEffets.basculer(ctrl, l.id, sens > 0);
      else if (l.type === 'vitesse') ctrl.vitesseSoir = Phaser.Math.Clamp(ctrl.vitesseSoir * (sens > 0 ? 2 : 0.5), 1, 160);
      else for (const id of Object.keys(ctrl.effets)) AmbianceEffets.basculer(ctrl, id, sens > 0);
    };
    sur('U', () => { p.ligne = Phaser.Math.Wrap(p.ligne - 1, 0, this.ambLignes().length); });
    sur('J', () => { p.ligne = Phaser.Math.Wrap(p.ligne + 1, 0, this.ambLignes().length); });
    sur('H', () => changer(-1));
    sur('L', () => changer(1));
    sur('G', () => AmbianceKit.basculer(p.st, !p.st.eclairage));
    sur('W', () => { p.visible = !p.visible; p.texte.style.display = p.visible ? '' : 'none'; });
  }

  ambPanneau() {
    const p = this.__foretAmb;
    if (!p || !p.texte) return;
    const ctrl = p.ctrl;
    const lignes = ['FORET D\'AMBIANCE'];
    this.ambLignes().forEach((l, i) => {
      const c = i === p.ligne ? '>' : ' ';
      if (l.type === 'effet') lignes.push(`${c} ${ctrl.actif[l.id] ? 'oui' : 'non'}  ${l.nom}`);
      else if (l.type === 'vitesse') lignes.push(`${c} soir x${ctrl.vitesseSoir}  (heure ${ctrl.heure.toFixed(2)})`);
      else lignes.push(`${c} TOUT   H : tout couper   L : tout activer`);
    });
    if (ctrl) lignes.push(`vent ${ctrl.vent.toFixed(2)}  nuage ${ctrl.nuage.toFixed(2)}  rayons ${ctrl.rayons.toFixed(2)}`);
    lignes.push('U/J choisir  H non  L oui  W panneau');
    lignes.push(`G eclairage ${p.st.eclairage ? 'oui' : 'non'}`);
    if (this.player) lignes.push(`forme : ${LaboLumiereScene.prototype.laboFormeActive.call(this)}`);
    p.texte.textContent = lignes.join('\n');
    LaboLumiereScene.prototype.laboPlacerPanneau.call(this, p);
  }
}
