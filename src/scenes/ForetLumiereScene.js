// Forêt de lumière : `index.html?zone=foret_lumiere&lumiere`. Copie de la première partie de la forêt sombre pour
// régler l'ambiance « forêt » : le rendu vient d'AmbianceKit, comme dans les vraies zones ; ici s'ajoutent le panneau
// et les formes prêtées. Touches : U / J réglage, H / L valeur, C copier, W panneau, G éclairage coupé.

const FORET_AMBIANCE = AMBIANCES_LUMIERE.foret;   // valeurs de départ : src/data/ambiances_lumiere.js
const FORET_SOLEIL = FORET_AMBIANCE.soleil;
const FORET_REGLAGES = [
  { id: 'ambiance', pas: 0.02, min: 0.1, max: 1, val: FORET_AMBIANCE.ambiance },
  { id: 'teinte', pas: 0.02, min: 0, max: 0.5, val: FORET_AMBIANCE.teinte },
  { id: 'rayons', pas: 0.05, min: 0, max: 2, val: FORET_AMBIANCE.rayons },
  { id: 'lueurCorps', pas: 0.01, min: 0, max: 0.4, val: FORET_AMBIANCE.lueurCorps },
  { id: 'densite', pas: 0.02, min: 0.04, max: 0.7, val: FORET_AMBIANCE.densite, masque: true },
  { id: 'largeur', pas: 2, min: 6, max: 90, val: FORET_AMBIANCE.largeur, masque: true },
  { id: 'faisceaux', pas: 0.02, min: 0, max: 0.6, val: FORET_AMBIANCE.faisceaux },
  { id: 'balancement', pas: 0.5, min: 0, max: 10, val: FORET_AMBIANCE.balancement },
];

class ForetLumiereScene extends Phaser.Scene {
  constructor() {
    super('ForetLumiereScene');
  }

  create(sceneData) {
    this.__laboLumiere = true;   // LightKit.modeTest laisse la main à cette scène
    this.__foret = null;
    LaboLumiereScene.prototype.laboProtegerPartie.call(this);   // rien n'est gardé dans la sauvegarde
    resolveZoneData('foret_lumiere', FORET_LUMIERE_DATA).then((data) => {
      buildLevelFromData(this, data, sceneData);
      this.foretConstruire(data);
    });
  }

  update(time, delta) {
    updateLevelFromData(this, time, delta);
    if (this.__foret) this.foretImage();
  }

  foretConstruire(data) {
    const st = AmbianceKit.installer(this, data, FORET_AMBIANCE);
    Object.assign(st, { visible: true, ligne: 0, note: '' });
    this.__foret = st;
    LaboLumiereScene.prototype.laboFormes.call(this);
    st.texte = document.createElement('pre');
    st.texte.id = 'foret-panneau';
    st.texte.style.cssText = 'position:fixed;z-index:10;box-sizing:border-box;width:58ch;margin:0;padding:.5em .8em;color:#e8e2f2;background:#0d0b1acc;'
      + 'font-family:monospace;line-height:1.15;white-space:pre;overflow:hidden;pointer-events:none';
    document.body.appendChild(st.texte);
    this.foretTouches(st);
    this.events.once('shutdown', () => st.texte.remove());
    this.foretPanneau(st);
  }

  // Propre au test : panneau tenu à jour et énergie toujours pleine pour essayer les formes
  foretImage() {
    const st = this.__foret;
    if (!st.ok) return;
    if (st.visible && st.image % 12 === 0) this.foretPanneau(st);
    if (this.player && this.player.energy < ENERGY_MAX) { this.player.energy = ENERGY_MAX; this.registry.set('energy', ENERGY_MAX); }
  }

  foretTouches(st) {
    const k = this.input.keyboard;
    const sur = (touche, f) => k.on(`keydown-${touche}`, () => { f(); this.foretPanneau(st); });
    const changer = (sens) => {
      const r = FORET_REGLAGES[st.ligne];
      st.v[r.id] = Phaser.Math.Clamp(Math.round((st.v[r.id] + sens * r.pas) * 100) / 100, r.min, r.max);
      if (r.masque) AmbianceKit.refaireMasque(st);
      AmbianceKit.appliquerRendu(st);
    };
    sur('U', () => { st.ligne = Phaser.Math.Wrap(st.ligne - 1, 0, FORET_REGLAGES.length); });
    sur('J', () => { st.ligne = Phaser.Math.Wrap(st.ligne + 1, 0, FORET_REGLAGES.length); });
    sur('H', () => changer(-1));
    sur('L', () => changer(1));
    sur('G', () => {
      AmbianceKit.basculer(st, !st.eclairage);
    });
    sur('W', () => { st.visible = !st.visible; st.texte.style.display = st.visible ? '' : 'none'; });
    sur('C', () => {
      const txt = JSON.stringify({ ...st.v, soleil: FORET_SOLEIL }, null, 2);
      console.log(`[foret_lumiere] réglages :\n${txt}`);
      st.note = 'reglages ecrits dans la console (F12)';
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(() => { st.note = 'reglages copies dans le presse-papiers'; this.foretPanneau(st); }).catch(() => {});
      }
    });
  }

  foretPanneau(st) {
    if (!st.texte) return;
    const lignes = ['FORET DE LUMIERE'];
    FORET_REGLAGES.forEach((r, i) => lignes.push(`${i === st.ligne ? '>' : ' '} ${r.id.padEnd(12)} ${st.v[r.id]}`));
    lignes.push('U/J reglage  H/L valeur  C copier  W panneau');
    lignes.push(`G eclairage ${st.eclairage ? 'oui' : 'non'}`);
    if (this.player) lignes.push(`forme : ${LaboLumiereScene.prototype.laboFormeActive.call(this)}`);
    lignes.push('  Maj + direction grizzly   A ours polaire');
    lignes.push('  Espace x2 aigle (tenir : plane, S : pique)');
    if (st.note) lignes.push(st.note);
    st.texte.textContent = lignes.join('\n');
    LaboLumiereScene.prototype.laboPlacerPanneau.call(this, st);
  }
}
