// Éditeur de niveaux (v2) -- LE NOYAU : la zone ouverte, l'historique, le
// brouillon, les contrôles, l'enregistrement et « Jouer ».
//
// L'éditeur travaille sur une COPIE de l'objet de zone (`etat.donnees`), jamais
// sur la constante du jeu. Toute modification passe par `Editeur.modifier` :
// elle entre dans l'historique (Ctrl+Z), met à jour le brouillon gardé dans le
// navigateur, relance les contrôles et fait reconstruire l'affichage.
// Les autres fichiers s'abonnent à ce qui change par `Editeur.sur(evenement, fn)` :
//   'zone' (zone ouverte) · 'donnees' · 'selection' · 'outil' · 'onglet' ·
//   'etat' (enregistrement, serveur) · 'curseur' · 'vue' · 'rendu' · 'jeu'.
const Editeur = (() => {
  'use strict';

  const CLE_BROUILLON = 'agarica-editeur-v2:brouillon:';
  const CLE_PREFS = 'agarica-editeur-v2:reglages';
  const HISTORIQUE_MAX = 120;
  // Exception connue et acceptée par l'utilisateur (même liste que tools/verif.py, DIAG_OK).
  const DIAGONALES_ACCEPTEES = { foret_flottante_2: ['50,3-49,2'] };

  const etat = {
    zones: [],            // [{ id, constante, nom, groupe, ordre, scene }]
    fichiers: {},         // id -> contenu du fichier (JSON) au chargement de la page ou au dernier enregistrement
    protegees: {},        // id -> raison : zone que l'éditeur ne saurait pas réécrire à l'identique
    zone: null,           // id de la zone ouverte
    donnees: null,        // copie de travail
    json: '',             // la même, en texte (historique, comparaison)
    annuler: [],
    refaire: [],
    selection: null,      // { genre, index }
    outil: null,          // entrée du catalogue en main
    onglet: 'terrain',
    elements: [],         // vignettes (catalogue construit une fois le jeu chargé)
    problemes: [],
    modifie: false,
    enregistrement: 'propre',   // 'propre' | 'modifie' | 'encours' | 'erreur'
    message: '',
    serveur: null,        // null : pas encore su ; true / false
    lectureSeule: null,   // raison (texte) si la zone ne peut pas être enregistrée
    brouillonRepris: false,
    ancienBrouillon: false,
    jeuPret: false,
    jeu: null,            // { zone, donnees } pendant « Jouer »
    vues: {},             // id -> { x, y, zoom }
    touches: { gauche: false, droite: false, haut: false, bas: false },
    espace: false,
    reglages: { jouerAvecPartie: true, toutDebloquer: false, sansHistoire: false },
  };

  const ecouteurs = {};
  function sur(evt, fn) { (ecouteurs[evt] = ecouteurs[evt] || []).push(fn); }
  function emettre(evt, data) { for (const fn of ecouteurs[evt] || []) { try { fn(data); } catch (e) { console.error(`Éditeur (${evt}) :`, e); } } }

  const copie = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));

  function lireGlobale(nom) {
    if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(nom)) return undefined;
    // eslint-disable-next-line no-new-func
    try { return (new Function(`return typeof ${nom} !== 'undefined' ? ${nom} : undefined;`))(); } catch (e) { return undefined; }
  }

  function casse(id) { return id.split('_').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(''); }

  function empreinte(texte) {
    let h = 5381;
    for (let i = 0; i < texte.length; i++) h = ((h << 5) + h + texte.charCodeAt(i)) | 0;
    return String(h);
  }

  function lireStockage(cle) {
    try { const t = window.localStorage.getItem(cle); return t ? JSON.parse(t) : null; } catch (e) { return null; }
  }
  function ecrireStockage(cle, valeur) {
    try {
      if (valeur === null) window.localStorage.removeItem(cle); else window.localStorage.setItem(cle, JSON.stringify(valeur));
      return true;
    } catch (e) { return false; }
  }

  // --- Démarrage : avant la création du jeu (src/main.js) ---------------------
  function demarrer() {
    // Toutes les zones chargées par index.html, photographiées AVANT que le jeu
    // ne tourne (une scène ou un script d'histoire peut retoucher ces objets).
    const sources = Array.from(document.querySelectorAll('script[src]')).map((s) => (s.getAttribute('src') || '').split('?')[0]);
    const demo = typeof DEMO_ZONES !== 'undefined' ? DEMO_ZONES : [];
    const tests = typeof LEGACY_TEST_ZONES !== 'undefined' ? LEGACY_TEST_ZONES : [];
    for (const src of sources) {
      const m = /^src\/data\/(.+)_data\.js$/.exec(src);
      if (!m) continue;
      const id = m[1];
      const constante = `${id.toUpperCase()}_DATA`;
      const data = lireGlobale(constante);
      if (!data || typeof data !== 'object' || Array.isArray(data)) continue;
      const iDemo = demo.findIndex((z) => z.zone === id);
      const scene = iDemo >= 0 ? demo[iDemo].scene : `${casse(id)}Scene`;
      const test = tests.find((z) => z.scene === scene);
      let fichier;
      try { fichier = JSON.stringify(data); } catch (e) { continue; }
      etat.fichiers[id] = fichier;
      // Contrôle sur l'objet d'ORIGINE : la copie en texte ci-dessus aurait déjà perdu une fonction ou un `undefined`.
      const fautif = EditeurEcriture.nonEnregistrable(data);
      if (fautif) etat.protegees[id] = `elle contient une valeur que l'éditeur ne sait pas réécrire : ${fautif}`;
      etat.zones.push({
        id, constante, scene,
        nom: iDemo >= 0 ? demo[iDemo].name : (test ? test.name : (data.zoneName || editeurNomLisible(id))),
        groupe: iDemo >= 0 ? 'Histoire' : 'Zones de test',
        ordre: iDemo >= 0 ? iDemo : 1000 + etat.zones.length,
      });
    }
    etat.zones.sort((a, b) => a.ordre - b.ordre);
    Object.assign(etat.reglages, lireStockage(CLE_PREFS) || {});
    if (etat.reglages.onglet && EDITEUR_ONGLETS.some((o) => o.id === etat.reglages.onglet && !o.bientot)) etat.onglet = etat.reglages.onglet;

    // « Jouer » depuis l'éditeur : les scènes du jeu reçoivent la zone telle
    // qu'elle est dans l'éditeur (et pour les autres zones, leur brouillon), et
    // la sauvegarde de la vraie partie n'est jamais réécrite par ces essais.
    // (Points d'accroche posés d'ici, sans toucher à LevelKit / StoryKit.)
    window.resolveZoneData = (nom, repli) => {
      const jeu = etat.jeu;
      if (jeu && jeu.zone === nom) return Promise.resolve(copie(jeu.donnees));
      const br = jeu ? lireBrouillon(nom) : null;
      return Promise.resolve(br ? br.donnees : repli);
    };
    window.writeSaveData = () => true;

    sonderServeur();
    window.addEventListener('focus', sonderServeur);
    // En quittant la page : le brouillon est écrit, rien n'est perdu (pas de fenêtre « voulez-vous quitter ? »).
    window.addEventListener('beforeunload', () => ecrireBrouillon());
    window.addEventListener('pagehide', () => ecrireBrouillon());
  }

  // Appelé par la scène la première fois que le jeu est chargé.
  function jeuPret(scene) {
    etat.jeuPret = true;
    etat.elements = editeurConstruireElements();
    const demande = new URLSearchParams(window.location.search).get('zone');
    const choix = [demande, etat.reglages.zone, 'foret_sombre_1'].find((z) => z && etat.fichiers[z]) || (etat.zones[0] && etat.zones[0].id);
    emettre('pret', scene);
    if (choix) ouvrirZone(choix, { sansRebatir: true });
  }

  function infosZone(id = etat.zone) { return etat.zones.find((z) => z.id === id) || null; }

  // --- Brouillons (dans le navigateur) ----------------------------------------
  function lireBrouillon(id) {
    const br = lireStockage(CLE_BROUILLON + id);
    return br && br.donnees && typeof br.donnees === 'object' ? br : null;
  }

  let minuterieBrouillon = null;
  function ecrireBrouillon() {
    if (minuterieBrouillon) { clearTimeout(minuterieBrouillon); minuterieBrouillon = null; }
    if (!etat.zone || !etat.donnees) return;
    if (!etat.modifie) { ecrireStockage(CLE_BROUILLON + etat.zone, null); return; }
    const ok = ecrireStockage(CLE_BROUILLON + etat.zone, { base: empreinte(etat.fichiers[etat.zone]), date: Date.now(), donnees: etat.donnees });
    if (!ok) { etat.message = 'Le navigateur refuse de garder le brouillon (stockage plein).'; emettre('etat'); }
  }
  function programmerBrouillon() {
    if (minuterieBrouillon) clearTimeout(minuterieBrouillon);
    minuterieBrouillon = setTimeout(ecrireBrouillon, 350);
  }

  // --- Ouvrir une zone ---------------------------------------------------------
  function ouvrirZone(id, { sansRebatir = false } = {}) {
    if (!etat.fichiers[id]) return false;
    ecrireBrouillon();
    const info = infosZone(id);
    etat.zone = id;
    const br = lireBrouillon(id);
    etat.brouillonRepris = false;
    etat.brouillonPerime = false;
    if (br && JSON.stringify(br.donnees) !== etat.fichiers[id]) {
      etat.donnees = br.donnees;
      etat.brouillonRepris = true;
      // Le fichier a changé depuis ce brouillon (modifié à la main, ou par une autre session).
      etat.brouillonPerime = br.base !== empreinte(etat.fichiers[id]);
    } else {
      etat.donnees = JSON.parse(etat.fichiers[id]);
    }
    etat.json = JSON.stringify(etat.donnees);
    etat.annuler = [];
    etat.refaire = [];
    etat.selection = null;
    etat.outil = null;
    etat.modifie = etat.json !== etat.fichiers[id];
    etat.enregistrement = etat.modifie ? 'modifie' : 'propre';
    etat.message = etat.brouillonRepris
      ? (etat.brouillonPerime ? 'Brouillon repris, mais le fichier a changé depuis : vérifie avant d\'enregistrer.' : 'Brouillon repris là où tu t\'étais arrêté.')
      : '';
    // Zone protégée : si l'éditeur ne sait pas réécrire le fichier à l'identique, il ne l'écrit pas.
    const v = etat.protegees[id] ? { erreur: etat.protegees[id] } : EditeurEcriture.verifier(info.constante, JSON.parse(etat.fichiers[id]));
    etat.lectureSeule = v.erreur ? `Zone protégée (lecture seule) : ${v.erreur}.` : null;
    etat.ancienBrouillon = false;
    etat.reglages.zone = id;
    ecrireStockage(CLE_PREFS, etat.reglages);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('zone', id);
      window.history.replaceState(null, '', url.pathname + url.search.replace(/editor=(&|$)/, 'editor$1'));
    } catch (e) { /* adresse non modifiable : sans importance */ }
    controler();
    emettre('zone');
    emettre('selection');
    emettre('outil');
    emettre('etat');
    interrogerServeur(id);
    chercherAncienBrouillon(id);
    if (!sansRebatir) rebatir();
    return true;
  }

  // Revenir au fichier : le brouillon est abandonné.
  function abandonnerBrouillon() {
    if (!etat.zone) return;
    ecrireStockage(CLE_BROUILLON + etat.zone, null);
    etat.modifie = false;
    ouvrirZone(etat.zone);
  }

  // Brouillon de l'ANCIEN éditeur (IndexedDB) : le jeu le joue à la place du
  // fichier (resolveZoneData d'origine). On le signale, l'utilisateur décide.
  function chercherAncienBrouillon(id) {
    if (typeof getZoneDraft !== 'function') return;
    getZoneDraft(id).then((d) => {
      if (etat.zone !== id || d === undefined) return;
      etat.ancienBrouillon = true;
      emettre('etat');
    }).catch(() => {});
  }

  function oublierAncienBrouillon() {
    const id = etat.zone;
    try {
      const req = indexedDB.open(ZONE_DRAFTS_IDB_NAME, 2);
      req.onsuccess = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(ZONE_DRAFTS_IDB_STORE)) return;
        const tx = db.transaction(ZONE_DRAFTS_IDB_STORE, 'readwrite');
        tx.objectStore(ZONE_DRAFTS_IDB_STORE).delete(id);
        tx.oncomplete = () => { if (etat.zone === id) { etat.ancienBrouillon = false; etat.message = 'Ancien brouillon oublié : le jeu lit de nouveau le fichier.'; emettre('etat'); } };
      };
    } catch (e) { /* base absente : rien à oublier */ }
  }

  // --- Modifier ----------------------------------------------------------------
  function modifiable() { return !!etat.donnees && !etat.jeu; }

  let derniereFusion = null;
  let dateFusion = 0;
  function modifier(etiquette, fn, { fusion = null, rebatirZone = true } = {}) {
    if (!modifiable()) return false;
    const avant = etat.json;
    const selAvant = etat.selection ? { ...etat.selection } : null;
    fn(etat.donnees);
    const apres = JSON.stringify(etat.donnees);
    if (apres === avant) return false;
    const maintenant = Date.now();
    // Les petits pas d'un même réglage (curseur, flèches) font UNE entrée d'historique.
    if (!(fusion && fusion === derniereFusion && maintenant - dateFusion < 1500)) {
      etat.annuler.push({ json: avant, selection: selAvant, etiquette });
      if (etat.annuler.length > HISTORIQUE_MAX) etat.annuler.shift();
    }
    derniereFusion = fusion;
    dateFusion = maintenant;
    etat.refaire = [];
    etat.json = apres;
    apresChangement(rebatirZone);
    return true;
  }

  function apresChangement(rebatirZone = true) {
    etat.modifie = etat.json !== etat.fichiers[etat.zone];
    if (etat.enregistrement !== 'encours') etat.enregistrement = etat.modifie ? 'modifie' : 'propre';
    etat.message = '';
    programmerBrouillon();
    controler();
    emettre('donnees');
    emettre('etat');
    if (rebatirZone) rebatir();
  }

  function reprendre(pile, autre) {
    if (!pile.length || !modifiable()) return false;
    const pas = pile.pop();
    autre.push({ json: etat.json, selection: etat.selection ? { ...etat.selection } : null, etiquette: pas.etiquette });
    etat.json = pas.json;
    etat.donnees = JSON.parse(pas.json);
    etat.selection = pas.selection && element(pas.selection.genre, pas.selection.index) ? pas.selection : null;
    derniereFusion = null;
    apresChangement();
    emettre('selection');
    return true;
  }
  const annuler = () => reprendre(etat.annuler, etat.refaire);
  const refaire = () => reprendre(etat.refaire, etat.annuler);

  let rebatirDemande = false;
  function rebatir() {
    const sc = etat.scene;
    if (!sc || etat.jeu) return;
    // Les boîtes affichées décrivent l'ancienne donnée : effacées jusqu'à la reconstruction.
    sc.boites = [];
    sc.survol = null;
    if (rebatirDemande) return;
    rebatirDemande = true;
    // À la prochaine image : plusieurs changements du même instant ne font qu'une reconstruction.
    window.requestAnimationFrame(() => {
      rebatirDemande = false;
      if (etat.jeu || !etat.scene) return;
      etat.scene.annulerGeste();
      etat.scene.scene.restart();
    });
  }

  // --- Vue mémorisée par zone ----------------------------------------------------
  function memoriserVue(v) { if (etat.zone && v) etat.vues[etat.zone] = v; }
  function vue() { return etat.vues[etat.zone] || null; }

  // --- Sélection, outil, onglet -----------------------------------------------
  function element(genre, index) {
    const liste = etat.donnees && etat.donnees[genre];
    return Array.isArray(liste) ? liste[index] || null : null;
  }
  function elementSelectionne() { return etat.selection ? element(etat.selection.genre, etat.selection.index) : null; }

  function selectionner(genre, index) {
    const nouveau = genre && element(genre, index) ? { genre, index } : null;
    const s = etat.selection;
    if ((s && nouveau && s.genre === nouveau.genre && s.index === nouveau.index) || (!s && !nouveau)) return;
    etat.selection = nouveau;
    emettre('selection');
  }

  function choisirOutil(entree) {
    etat.outil = entree && etat.outil && etat.outil.id === entree.id ? null : (entree || null);
    // Un outil en main : plus d'élément choisi (le panneau de droite parle de l'outil).
    if (etat.outil && etat.selection) { etat.selection = null; emettre('selection'); }
    emettre('outil');
  }

  function choisirOnglet(id) {
    const o = EDITEUR_ONGLETS.find((x) => x.id === id);
    if (!o || o.bientot || etat.onglet === id) return;
    etat.onglet = id;
    etat.outil = null;
    etat.reglages.onglet = id;
    ecrireStockage(CLE_PREFS, etat.reglages);
    emettre('onglet');
    emettre('outil');
  }

  function nomElement(genre, el) {
    const e = editeurElementPour(etat.elements, genre, el);
    return e ? e.nom : (EDITEUR_GENRES[genre] ? EDITEUR_GENRES[genre].nom : genre);
  }

  // --- Éléments : poser, déplacer, régler, supprimer ---------------------------
  function geoDe(genre) {
    const g = EDITEUR_GENRES[genre];
    return { g, geo: EDITEUR_GEOS[g.geo] };
  }

  function poser(entree, x, y) {
    const { g, geo } = geoDe(entree.genre);
    const el = geo.creer(etat.scene, copie(entree.modele || {}), x, y, g);
    if (!el) return false;
    if (entree.numerote) {
      // Un nom par élément (le jeu s'en sert pour retenir « ouvert », « cassé »…).
      const pris = new Set((etat.donnees[entree.genre] || []).map((e) => e && e[entree.numerote]));
      let n = (etat.donnees[entree.genre] || []).length + 1;
      while (pris.has(`${el[entree.numerote]}${n}`)) n += 1;
      el[entree.numerote] = `${el[entree.numerote]}${n}`;
    }
    let index = -1;
    const ok = modifier(`Ajout : ${entree.nom}`, (d) => {
      if (!Array.isArray(d[entree.genre])) d[entree.genre] = [];
      d[entree.genre].push(el);
      index = d[entree.genre].length - 1;
    });
    if (ok) { etat.selection = { genre: entree.genre, index }; emettre('selection'); }
    return ok;
  }

  function remplacerElement(genre, index, el, etiquette = 'Modification') {
    return modifier(etiquette, (d) => { if (Array.isArray(d[genre]) && d[genre][index]) d[genre][index] = el; });
  }

  function supprimerSelection() {
    const s = etat.selection;
    if (!s || !element(s.genre, s.index)) return false;
    const nom = nomElement(s.genre, element(s.genre, s.index));
    // La liste reste dans la zone, même vide : aucune clé ne disparaît du fichier.
    const ok = modifier(`Suppression : ${nom}`, (d) => { d[s.genre].splice(s.index, 1); });
    if (ok) { etat.selection = null; emettre('selection'); }
    return ok;
  }

  function dupliquerSelection() {
    const s = etat.selection;
    const el = elementSelectionne();
    if (!s || !el) return false;
    const { g, geo } = geoDe(s.genre);
    const double = copie(el);
    const a = geo.ancre(etat.scene, double, g);
    geo.deplacer(etat.scene, double, a.x + 64, a.y, g);
    for (const cle of ['id', 'key']) {
      if (typeof double[cle] !== 'string' || (cle === 'id' && s.genre === 'npcs')) continue;
      const pris = new Set(etat.donnees[s.genre].map((e) => e && e[cle]));
      const base = double[cle].replace(/\d+$/, '');
      let n = 2;
      while (pris.has(`${base}${n}`)) n += 1;
      double[cle] = `${base}${n}`;
    }
    let index = -1;
    const ok = modifier(`Copie : ${nomElement(s.genre, el)}`, (d) => { d[s.genre].push(double); index = d[s.genre].length - 1; });
    if (ok) { etat.selection = { genre: s.genre, index }; emettre('selection'); }
    return ok;
  }

  // Pousse l'élément sélectionné de (dx, dy) pixels (flèches du clavier).
  function pousserSelection(dx, dy) {
    const s = etat.selection;
    const el = elementSelectionne();
    if (!s || !el) return false;
    const { g, geo } = geoDe(s.genre);
    const c = copie(el);
    if (typeof c.x === 'number' && !['pieds', 'decor', 'creature', 'personnage', 'mousse', 'toile', 'ligneSol'].includes(g.geo)) {
      c.x += dx;
      if (typeof c.y === 'number') c.y += dy;
    } else {
      const a = geo.ancre(etat.scene, c, g);
      const pas = ['cases', 'branche', 'cassable'].includes(g.geo) ? 64 : 1;
      geo.deplacer(etat.scene, c, a.x + dx * pas, a.y + dy * pas, g);
    }
    return modifier('Déplacement', (d) => { d[s.genre][s.index] = c; }, { fusion: `pousser:${s.genre}:${s.index}` });
  }

  // Règle une propriété de l'élément sélectionné ; `undefined` retire la clé (retour au réglage du jeu).
  function regler(cle, valeur, { fusion = true } = {}) {
    const s = etat.selection;
    if (!s || !elementSelectionne()) return false;
    return modifier('Réglage', (d) => {
      const el = d[s.genre][s.index];
      if (valeur === undefined) delete el[cle]; else el[cle] = valeur;
    }, { fusion: fusion ? `regler:${s.genre}:${s.index}:${cle}` : null });
  }

  // Règle une clé de la zone (« ambient.tint » : clé dans un objet).
  function reglerZone(chemin, valeur) {
    return modifier('Réglage de la zone', (d) => {
      const [cle, sous] = chemin.split('.');
      if (!sous) {
        if (valeur === undefined) delete d[cle]; else d[cle] = valeur;
        return;
      }
      if (valeur === undefined) {
        if (d[cle] && typeof d[cle] === 'object') delete d[cle][sous];
        return;
      }
      if (!d[cle] || typeof d[cle] !== 'object') d[cle] = {};
      d[cle][sous] = valeur;
    }, { fusion: `zone:${chemin}` });
  }

  function lireZone(chemin) {
    const [cle, sous] = chemin.split('.');
    const v = etat.donnees ? etat.donnees[cle] : undefined;
    return sous ? (v && typeof v === 'object' ? v[sous] : undefined) : v;
  }

  // Fond : `background` peut être un id ou un objet { id, baseline… } ; seul l'id change.
  function choisirFond(id) {
    return modifier('Fond de la zone', (d) => {
      // Sans fond choisi : le ciel de nuit d'origine du jeu.
      if (!id) delete d.background;
      else if (d.background && typeof d.background === 'object') d.background.id = id;
      else d.background = id;
    });
  }

  function choisirTuiles(id) {
    return modifier('Jeu de tuiles', (d) => { if (id) d.tileset = id; else delete d.tileset; });
  }

  // --- Sol -----------------------------------------------------------------------
  function limitesDeCases() {
    const d = etat.donnees;
    return {
      gx0: 0, gx1: Math.ceil((d.levelWidth || 960) / 64) - 1,
      gy0: Math.floor(Math.min(-400, d.levelTop ?? -400) / 64), gy1: Math.ceil((d.levelHeight || 540) / 64) + 3,
    };
  }

  function peindre(couche, efface, cases) {
    const lim = limitesDeCases();
    const dedans = cases.filter(([gx, gy]) => gx >= lim.gx0 && gx <= lim.gx1 && gy >= lim.gy0 && gy <= lim.gy1);
    if (!dedans.length) return false;
    return modifier(efface ? 'Sol effacé' : 'Sol peint', (d) => {
      const liste = Array.isArray(d[couche]) ? d[couche] : [];
      const cle = (c) => `${c[0]},${c[1]}`;
      if (efface) {
        const retire = new Set(dedans.map(cle));
        if (!liste.some((c) => retire.has(cle(c)))) return;
        // L'ordre des cases restantes ne change pas.
        d[couche] = liste.filter((c) => !retire.has(cle(c)));
        return;
      }
      const deja = new Set(liste.map(cle));
      const ajout = dedans.filter((c) => !deja.has(cle(c))).map(([gx, gy]) => [gx, gy, 'dirt']);
      if (!ajout.length) return;
      // Sol retouché : rangé en rangées propres (cf. EditeurEcriture.rangerSol).
      d[couche] = EditeurEcriture.rangerSol(liste.concat(ajout));
    });
  }

  // --- Contrôles en direct -----------------------------------------------------
  // Même test que DIAG_JS de tools/verif.py : deux cases pleines qui ne se
  // touchent que par un coin (règle de l'utilisateur : il faut la case du coin).
  function diagonales(pleines) {
    const out = [];
    const acceptees = DIAGONALES_ACCEPTEES[etat.zone] || [];
    for (const k of pleines) {
      const [x, y] = k.split(',').map(Number);
      for (const dx of [1, -1]) {
        const ux = x + dx;
        const uy = y - 1;
        if (!pleines.has(`${ux},${uy}`)) continue;
        if (pleines.has(`${ux},${y}`) || pleines.has(`${x},${uy}`)) continue;
        if (acceptees.includes(`${x},${y}-${ux},${uy}`)) continue;
        out.push({
          type: 'diagonale', cases: [[x, y], [ux, uy]], x: (dx > 0 ? x + 1 : x) * 64, y: y * 64,
          texte: `Deux cases de sol ne se touchent que par un coin (colonnes ${Math.min(x, ux)} et ${Math.max(x, ux)}, rangées ${uy} et ${y}) : ajoute la case du coin.`,
        });
      }
    }
    return out;
  }

  function casesPleines(d) {
    const cells = typeof zoneGroundCells === 'function' ? zoneGroundCells(d) : (d.groundCells || []);
    return new Set(cells.map((c) => `${c[0]},${c[1]}`));
  }

  function diagonalesAvecTrait(couche, efface, cases) {
    if (couche !== 'groundCells') return null;
    const pleines = casesPleines(etat.donnees);
    for (const k of cases.keys()) { if (efface) pleines.delete(k); else pleines.add(k); }
    return diagonales(pleines);
  }

  // Point d'un élément à contrôler : { x, y, dansSol } (dansSol : à tester contre le sol).
  function pointDeControle(genre, el) {
    if (!el || typeof el.x !== 'number') return null;
    const y = typeof el.y === 'number' ? el.y : null;
    switch (genre) {
      // 6 px au-dessus du point posé : un pied pile sur la ligne du sol n'est pas « dans » le sol.
      case 'enemies': case 'npcs': case 'chests': return { x: el.x, y: y == null ? null : y - 6, dansSol: y != null };
      case 'treasures': case 'pickups': case 'butterflies': case 'webs': return { x: el.x, y, dansSol: y != null };
      case 'props': case 'campfires': case 'totems': case 'vines': return { x: el.x, y, dansSol: false };
      default: return null;
    }
  }

  function controler() {
    const d = etat.donnees;
    const pbs = [];
    if (!d) { etat.problemes = pbs; return pbs; }
    const pleines = casesPleines(d);
    pbs.push(...diagonales(pleines));
    // Un trésor caché DANS un bloc cassable est voulu : ces cases ne comptent pas comme du sol plein.
    const dures = new Set(pleines);
    for (const b of Array.isArray(d.breakables) ? d.breakables : []) {
      const cases = typeof secretBreakableCells === 'function' ? secretBreakableCells(b || {}) : ((b && b.cells) || []);
      for (const c of cases) dures.delete(`${c[0]},${c[1]}`);
    }
    const larg = d.levelWidth || 960;
    const haut = Math.min(-400, d.levelTop ?? -400);
    const bas = Math.max(d.levelHeight || 540, 540) + 200;
    for (const genre of Object.keys(EDITEUR_GENRES)) {
      if (!Array.isArray(d[genre])) continue;
      d[genre].forEach((el, index) => {
        const p = pointDeControle(genre, el);
        if (!p) return;
        const nom = nomElement(genre, el);
        const y = p.y == null ? 270 : p.y;
        if (p.x < 0 || p.x > larg || (p.y != null && (p.y < haut || p.y > bas))) {
          pbs.push({ type: 'element', genre, index, x: p.x, y, texte: `${nom} : posé en dehors de la zone.` });
        } else if (p.dansSol && dures.has(`${Math.floor(p.x / 64)},${Math.floor(p.y / 64)}`)) {
          pbs.push({ type: 'element', genre, index, x: p.x, y, texte: `${nom} : posé dans le sol.` });
        }
      });
    }
    etat.problemes = pbs;
    return pbs;
  }

  // --- Donnée d'affichage -------------------------------------------------------
  function donneesDeRendu() {
    const d = copie(etat.donnees);
    for (const k of ['script', 'zoneName', 'zoneSub', 'helpText', 'triggers']) delete d[k];
    d.music = false;
    d.ambience = false;
    for (const k of Object.keys(d)) {
      if (!Array.isArray(d[k])) continue;
      for (const el of d[k]) if (el && typeof el === 'object' && !Array.isArray(el)) { delete el.requires; delete el.forbids; delete el.showIf; }
    }
    return d;
  }

  // --- Serveur du projet et enregistrement -------------------------------------
  function sonderServeur() {
    return fetch('/__editeur/etat', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).then((j) => {
      const la = !!(j && j.ok && j.serveur === 'agarica');
      if (la !== etat.serveur) { etat.serveur = la; etat.essai = !!(j && j.essai); emettre('etat'); }
      return la;
    }).catch(() => {
      if (etat.serveur !== false) { etat.serveur = false; emettre('etat'); }
      return false;
    });
  }

  function interrogerServeur(id) {
    fetch(`/__editeur/zone?nom=${encodeURIComponent(id)}`, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).then((j) => {
      if (!j || etat.zone !== id) return;
      if (!j.ecrivable && !etat.lectureSeule) { etat.lectureSeule = `Zone protégée (lecture seule) : ${j.raison}.`; emettre('etat'); }
    }).catch(() => {});
  }

  async function envoyer(corps) {
    const r = await fetch('/__editeur/enregistrer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps) });
    if (!r.ok) throw new Error(`le serveur a répondu ${r.status}`);
    return r.json();
  }

  async function enregistrer() {
    if (!etat.zone || !etat.donnees || etat.enregistrement === 'encours' || etat.jeu) return false;
    const id = etat.zone;
    const info = infosZone(id);
    const fin = (statut, message) => {
      etat.enregistrement = statut;
      etat.message = message;
      emettre('etat');
      return statut === 'propre';
    };
    if (etat.lectureSeule) return fin('erreur', etat.lectureSeule);
    if (!etat.modifie) return fin('propre', 'Rien à enregistrer : la zone est déjà à jour.');
    etat.enregistrement = 'encours';
    etat.message = 'Enregistrement…';
    emettre('etat');
    ecrireBrouillon();
    if (!(await sonderServeur())) {
      return fin('modifie', 'Serveur du projet absent : rien n\'est écrit dans le jeu, le brouillon reste dans ce navigateur.');
    }
    const json = etat.json;
    const donnees = JSON.parse(json);
    try {
      // 1. Le texte écrit doit redonner exactement la zone.
      const v = EditeurEcriture.verifier(info.constante, donnees);
      if (v.erreur) return fin('erreur', `Enregistrement annulé : ${v.erreur}.`);
      const avant = JSON.parse(etat.fichiers[id]);
      const clesRetirees = Object.keys(avant).filter((k) => !(k in donnees));
      // 2. Essai à blanc : le serveur renvoie le fichier tel qu'il serait, on le relit en entier.
      const essai = await envoyer({ zone: id, instruction: v.texte, clesRetirees, essai: true });
      if (!essai.ok) return fin('erreur', `Enregistrement refusé : ${essai.erreur}`);
      const diff = EditeurEcriture.difference(donnees, EditeurEcriture.evaluer(essai.texte, info.constante));
      if (diff) return fin('erreur', `Enregistrement annulé : le fichier relu ne redonne pas la zone (${diff}).`);
      // 3. Écriture, après copie de secours côté serveur.
      const res = await envoyer({ zone: id, instruction: v.texte, clesRetirees });
      if (!res.ok) return fin('erreur', `Enregistrement refusé : ${res.erreur}`);
      etat.fichiers[id] = json;
      if (etat.zone === id) {
        etat.modifie = etat.json !== json;
        etat.brouillonRepris = false;
        ecrireBrouillon();
      }
      const quand = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      return fin(etat.modifie ? 'modifie' : 'propre', res.ecrit
        ? `Enregistré à ${quand} dans ${res.fichier} (copie de secours : ${String(res.secours).split(/[\\/]/).pop()}).`
        : `Déjà à jour (${res.fichier}).`);
    } catch (e) {
      return fin('erreur', `Enregistrement impossible : ${e && e.message ? e.message : e}`);
    }
  }

  // --- Jouer -----------------------------------------------------------------------
  function viderRegistre(game) {
    const reg = game.registry;
    for (const [k, v] of Object.entries(reg.getAll())) {
      if (k.startsWith('__')) continue;
      if (typeof isSaveableValue === 'function' ? isSaveableValue(v) : true) reg.remove(k);
    }
  }

  function jouer({ ici = false } = {}) {
    const sc = etat.scene;
    if (!sc || !sc.pret || etat.jeu || !etat.donnees) return false;
    const game = sc.game;
    const d = copie(etat.donnees);
    if (ici) {
      const v = sc.vueActuelle();
      d.playerSpawn = { x: Math.round(v.x), y: edSol(sc, v.x, v.y) - 44 };
    }
    if (etat.reglages.sansHistoire) {
      // Pour essayer le niveau seul : ni script d'histoire ni déclencheurs (boss et scènes absents).
      delete d.script;
      delete d.triggers;
    }
    etat.jeu = { zone: etat.zone, donnees: d };
    etat.outil = null;
    document.body.classList.add('ed-joue');
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    viderRegistre(game);
    // La partie du joueur (formes, objets, histoire déjà vue) est LUE, jamais réécrite.
    if (etat.reglages.jouerAvecPartie && typeof loadGame === 'function') loadGame(game);
    if (etat.reglages.toutDebloquer) {
      for (const f of ['hasWolfForm', 'hasMonkeyForm', 'hasEagleForm', 'hasOctopusForm']) game.registry.set(f, true);
      game.registry.set('xaraMet', true);
    }
    const info = infosZone();
    const cle = info && game.scene.getScene(info.scene) ? info.scene : 'EditeurJeuScene';
    game.scene.stop('EditeurScene');
    etat.scene = null;
    // Le jeu reprend ses touches (flèches, Espace…).
    if (game.input.keyboard) game.input.keyboard.preventDefault = true;
    game.scene.start(cle);
    emettre('jeu');
    ajusterCanvas(game);
    return true;
  }

  // La place du canvas vient de changer (interface cachée ou revenue) : Phaser remesure son parent.
  function ajusterCanvas(game) {
    const mesurer = () => { try { game.scale.getParentBounds(); game.scale.refresh(); } catch (e) { /* jeu arrêté */ } };
    mesurer();
    setTimeout(mesurer, 80);
    setTimeout(mesurer, 400);
  }

  function revenir() {
    if (!etat.jeu) return false;
    const game = window.__game;
    for (const s of game.scene.getScenes(false)) {
      const st = s.sys.settings.status;
      if (s.scene.key !== 'EditeurScene' && st >= Phaser.Scenes.START && st < Phaser.Scenes.SHUTDOWN) game.scene.stop(s.scene.key);
    }
    try { if (typeof stopZoneMusic === 'function') stopZoneMusic(game, 200); } catch (e) { /* pas de musique */ }
    try { game.sound.stopAll(); } catch (e) { /* pas de son */ }
    viderRegistre(game);
    etat.jeu = null;
    document.body.classList.remove('ed-joue');
    game.scene.start('EditeurScene');
    emettre('jeu');
    ajusterCanvas(game);
    return true;
  }

  function reglage(cle, valeur) {
    etat.reglages[cle] = valeur;
    ecrireStockage(CLE_PREFS, etat.reglages);
  }

  return {
    etat, sur, emettre, copie, demarrer, jeuPret, infosZone, ouvrirZone, abandonnerBrouillon, oublierAncienBrouillon,
    modifiable, modifier, annuler, refaire, rebatir, memoriserVue, vue,
    element, elementSelectionne, selectionner, choisirOutil, choisirOnglet, nomElement,
    poser, remplacerElement, supprimerSelection, dupliquerSelection, pousserSelection, regler, reglerZone, lireZone,
    choisirFond, choisirTuiles, peindre, diagonalesAvecTrait, controler, donneesDeRendu,
    sonderServeur, enregistrer, jouer, revenir, reglage,
    poserEtiquettes() {},
    get scene() { return etat.scene; },
    set scene(s) { etat.scene = s; },
  };
})();
