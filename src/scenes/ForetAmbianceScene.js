// Forêt d'ambiance : `index.html?zone=foret_ambiance` (ou Options > Zones de test). Même copie de la forêt sombre que
// la forêt de lumière, avec l'ambiance « forêt » d'AmbianceKit et TOUS les effets d'AmbianceEffets, chacun coupable.
// Touches : U / J choisir, H / L couper / activer (vitesse du soir : moins / plus ; ligne « tout » : tout couper /
// tout activer), Ctrl + Gauche / Droite sol précédent / suivant, W panneau, G éclairage coupé.

// Propositions de sol, essayées ICI seulement (les vraies zones gardent assets/decors/tuiles.png) : un atlas par
// proposition, même disposition que tuiles.png (cases de 24 px, cf. tools/cut_tuiles.py) ; `frange` : hauteur (px) des
// herbes de surface de cet atlas. Numéros de la planche de propositions (la 3, « feuilles mortes », écartée par
// l'utilisateur, n'est plus proposée) ; 0 = sol actuel. Ctrl + Gauche / Droite passe au sol précédent / suivant.
const SOLS_ESSAI = {
  1: { nom: 'terre et racines', fichier: 'assets/decors/sols_essai/terre-racines.png', frange: 9 },
  2: { nom: 'mousse epaisse', fichier: 'assets/decors/sols_essai/mousse-epaisse.png', frange: 12 },
  4: { nom: 'schiste froid', fichier: 'assets/decors/sols_essai/schiste-froid.png', frange: 12 },
  5: { nom: 'tourbe et champignons', fichier: 'assets/decors/sols_essai/tourbe-champignons.png', frange: 11 },
  6: { nom: 'argile et galets', fichier: 'assets/decors/sols_essai/argile-galets.png', frange: 8 },
};
const SOLS_ORDRE = [0, ...Object.keys(SOLS_ESSAI).map(Number)];
const SOL_ESSAI_CASES = {
  A1: [0, 0], A2: [1, 0], A3: [2, 0], A4: [0, 1], A5: [1, 1], A6: [2, 1], A7: [0, 2], A8: [1, 2], A9: [2, 2], B: [0, 3],
  C1: [3, 0], C2: [4, 0], C3: [5, 0], C4: [5, 1], C5: [5, 2], C6: [5, 3], C7: [5, 4],
  D1: [3, 1], D2: [4, 1], D3: [3, 2], D4: [4, 2], D5: [3, 3], D6: [4, 3],
};
// herbes de surface dans ces atlas : x, y, largeur (hauteur = frange)
const SOL_ESSAI_HERBES = { grass_mid: [24, 72, 24], grass_left: [22, 120, 26], grass_right: [72, 120, 26], grass_single: [0, 100, 28] };

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
    const p = { st, ctrl, visible: true, ligne: 0, sol: 0 };
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
    return [...effets.map((e) => ({ ...e, type: 'effet' })), { id: 'sol', type: 'sol' }, { id: 'vitesse', type: 'vitesse' },
      { id: 'tout', type: 'tout' }];
  }

  ambTouches() {
    const k = this.input.keyboard, p = this.__foretAmb;
    const sur = (touche, f) => k.on(`keydown-${touche}`, () => { f(); this.ambPanneau(); });
    const changer = (sens) => {
      const l = this.ambLignes()[p.ligne], ctrl = p.ctrl;
      if (!l || !ctrl) return;
      if (l.type === 'effet') AmbianceEffets.basculer(ctrl, l.id, sens > 0);
      else if (l.type === 'sol') this.ambSolSuivant(sens);
      else if (l.type === 'vitesse') ctrl.vitesseSoir = Phaser.Math.Clamp(ctrl.vitesseSoir * (sens > 0 ? 2 : 0.5), 1, 160);
      else for (const id of Object.keys(ctrl.effets)) AmbianceEffets.basculer(ctrl, id, sens > 0);
    };
    sur('U', () => { p.ligne = Phaser.Math.Wrap(p.ligne - 1, 0, this.ambLignes().length); });
    sur('J', () => { p.ligne = Phaser.Math.Wrap(p.ligne + 1, 0, this.ambLignes().length); });
    sur('H', () => changer(-1));
    sur('L', () => changer(1));
    sur('G', () => AmbianceKit.basculer(p.st, !p.st.eclairage));
    sur('W', () => { p.visible = !p.visible; p.texte.style.display = p.visible ? '' : 'none'; });
    // Ctrl + Gauche / Droite : sol précédent / suivant. Haut et Bas ne sont pas libres ici (viser en l'air, piqué de
    // l'aigle, lianes de la zone) ; la touche est interceptée avant le jeu (écouteur en capture sur window, qui passe
    // avant celui de Phaser), donc Agarica ne marche pas pendant le changement.
    const ctrlFleche = (ev) => {
      if (!ev.ctrlKey || (ev.code !== 'ArrowLeft' && ev.code !== 'ArrowRight')) return;
      ev.preventDefault();
      ev.stopImmediatePropagation();
      if (!ev.repeat) this.ambSolSuivant(ev.code === 'ArrowRight' ? 1 : -1);
    };
    window.addEventListener('keydown', ctrlFleche, true);
    this.events.once('shutdown', () => window.removeEventListener('keydown', ctrlFleche, true));
  }

  // Sol n (0 = actuel) : chaque case et chaque herbe du sol reprend la même case dans l'atlas de la proposition ;
  // positions, tailles, teintes et collisions ne changent pas
  ambSolSuivant(sens) {
    const i = SOLS_ORDRE.indexOf(this.__foretAmb.sol);
    this.ambSol(SOLS_ORDRE[Phaser.Math.Wrap(i + sens, 0, SOLS_ORDRE.length)]);
  }

  ambSol(n) {
    const p = this.__foretAmb;
    p.sol = n;
    const cle = n ? `sol-essai-${n}` : null;
    if (cle && !this.textures.exists(cle)) {
      this.load.image(cle, SOLS_ESSAI[n].fichier);
      this.load.once(`filecomplete-image-${cle}`, () => { if (p.sol === n) this.ambSol(n); });
      this.load.start();
      return;
    }
    if (cle) {
      const tex = this.textures.get(cle), fr = SOLS_ESSAI[n].frange;
      for (const [nom, [cx, cy]] of Object.entries(SOL_ESSAI_CASES)) if (!tex.has(nom)) tex.add(nom, 0, cx * 24, cy * 24, 24, 24);
      for (const [nom, [x, y, l]] of Object.entries(SOL_ESSAI_HERBES)) if (!tex.has(nom)) tex.add(nom, 0, x, y, l, fr);
    }
    const prefixe = 'autotile-atlas-';
    for (const o of this.children.list) {
      if (!o.texture) continue;
      if (!o.__solCase) {
        if (!o.texture.key.startsWith(prefixe)) continue;
        o.__solCase = o.texture.key.slice(prefixe.length);
      }
      const herbe = o.__solCase.startsWith('grass');
      if (!herbe && !SOL_ESSAI_CASES[o.__solCase]) continue;
      if (cle) o.setTexture(cle, o.__solCase); else o.setTexture(prefixe + o.__solCase);
      if (!herbe) o.setDisplaySize(GROUND_TILE_SIZE, GROUND_TILE_SIZE);
    }
    this.ambPanneau();
  }

  ambPanneau() {
    const p = this.__foretAmb;
    if (!p || !p.texte) return;
    const ctrl = p.ctrl;
    const lignes = ['FORET D\'AMBIANCE'];
    this.ambLignes().forEach((l, i) => {
      const c = i === p.ligne ? '>' : ' ';
      if (l.type === 'effet') lignes.push(`${c} ${ctrl.actif[l.id] ? 'oui' : 'non'}  ${l.nom}`);
      else if (l.type === 'sol') lignes.push(`${c} sol ${p.sol} : ${p.sol ? SOLS_ESSAI[p.sol].nom : 'actuel'}  (Ctrl + fleches)`);
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
