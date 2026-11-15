// Éditeur de niveaux (v2) -- L'INTERFACE : barre du haut, bande d'images,
// réglages à droite, barre d'état, clavier. Tout est du HTML posé autour du
// canvas du jeu ; rien ici ne connaît le format des zones : l'interface lit le
// catalogue (catalogue.js) et appelle le noyau (noyau.js).
const EditeurInterface = (() => {
  'use strict';

  const E = Editeur;
  const el = {};          // nœuds importants de la page
  const vignettes = new Map();   // id d'entrée -> <canvas> déjà dessiné
  let recherche = '';
  let etiquettes = [];

  // Petit fabricant de nœuds : h('button.ed-btn', { title: '…', onclick: fn }, [enfants | texte])
  function h(sel, props = {}, enfants = []) {
    const [tag, ...classes] = sel.split('.');
    const n = document.createElement(tag || 'div');
    if (classes.length) n.className = classes.join(' ');
    for (const [k, v] of Object.entries(props)) {
      if (v === undefined || v === null) continue;
      if (k === 'html') n.innerHTML = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else if (k === 'dataset') Object.assign(n.dataset, v);
      else if (k in n && k !== 'list') n[k] = v;
      else n.setAttribute(k, v);
    }
    for (const c of [].concat(enfants)) {
      if (c === null || c === undefined || c === false) continue;
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return n;
  }
  const ico = (nom, taille) => h('span.ed-i', { html: editeurIcone(nom, taille) });
  const sansAccent = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  // --- Mise en page -------------------------------------------------------------
  function construire() {
    document.body.classList.add('editeur-v2');
    const jeu = document.getElementById('game-container');
    el.racine = h('div', { id: 'ed' });
    el.barre = h('header', { id: 'ed-barre' });
    el.bande = h('div', { id: 'ed-bande' });
    el.niveau = h('main', { id: 'ed-niveau' });
    el.reglages = h('aside', { id: 'ed-reglages' });
    el.etat = h('footer', { id: 'ed-etat' });
    el.racine.append(el.barre, el.bande, el.niveau, el.reglages, el.etat);
    document.body.appendChild(el.racine);
    // Le canvas du jeu vit au milieu de l'éditeur.
    el.niveau.appendChild(jeu);
    el.etiquettes = h('div', { id: 'ed-etiquettes' });
    el.astuce = h('div', { id: 'ed-astuce' });
    el.zoom = h('div', { id: 'ed-zoom' });
    el.attente = h('div', { id: 'ed-attente' }, [h('div.ed-attente-tour'), h('div', {}, 'Chargement du jeu…')]);
    el.bandeau = h('div', { id: 'ed-bandeau' });
    el.retour = h('div', { id: 'ed-retour' }, [
      h('button.ed-btn.ed-btn-rose', { onclick: () => E.revenir(), title: 'Revenir à l\'éditeur (Échap)' }, [ico('retour', 16), 'Retour à l\'éditeur']),
      h('span', {}, 'Échap'),
    ]);
    el.niveau.append(el.etiquettes, el.astuce, el.zoom, el.bandeau, el.attente, el.retour);
    construireBarre();
    construireEtat();
    construireZoom();
    rendreBande();
    rendreReglages();
    brancherClavier();
  }

  function construireBarre() {
    el.zone = h('select', { id: 'ed-zone', title: 'Zone ouverte', onchange: (e) => { E.ouvrirZone(e.target.value); e.target.blur(); } });
    const groupes = {};
    for (const z of E.etat.zones) (groupes[z.groupe] = groupes[z.groupe] || []).push(z);
    for (const [nom, zs] of Object.entries(groupes)) {
      el.zone.appendChild(h('optgroup', { label: nom }, zs.map((z) => h('option', { value: z.id }, z.nom))));
    }
    el.onglets = h('nav', { id: 'ed-onglets' }, EDITEUR_ONGLETS.map((o) => h('button.ed-onglet', {
      dataset: { onglet: o.id }, disabled: !!o.bientot, title: o.bientot ? `${o.nom} : bientôt` : o.nom,
      onclick: () => E.choisirOnglet(o.id),
    }, [ico(o.icone, 17), h('span', {}, o.nom), o.bientot ? h('em', {}, 'bientôt') : null])));
    el.jouer = h('button.ed-btn.ed-btn-rose', { id: 'ed-jouer', title: 'Jouer la zone telle qu\'elle est ici (Ctrl + Entrée)', onclick: () => E.jouer() }, [ico('jouer', 16), 'Jouer']);
    el.jouerPlus = h('button.ed-btn.ed-btn-rose.ed-btn-fleche', { title: 'Autres façons de jouer', onclick: (e) => { e.stopPropagation(); basculerMenuJouer(); } }, [h('span', { html: '&#9662;' })]);
    el.menuJouer = h('div', { id: 'ed-menu-jouer', hidden: true });
    el.aide = h('button.ed-btn.ed-btn-rond', { title: 'Aide et raccourcis', onclick: (e) => { e.stopPropagation(); basculerAide(); } }, [ico('aide', 18)]);
    el.panneauAide = h('div', { id: 'ed-aide', hidden: true });
    el.barre.append(
      h('div.ed-marque', {}, [h('span.ed-marque-lune'), h('span', {}, 'Éditeur')]),
      h('label.ed-zone-boite', { title: 'Zone ouverte' }, [h('span', {}, 'Zone'), el.zone]),
      el.onglets,
      h('div.ed-barre-fin', {}, [el.aide, h('div.ed-jouer-groupe', {}, [el.jouer, el.jouerPlus]), el.menuJouer, el.panneauAide]),
    );
    document.addEventListener('click', () => { el.menuJouer.hidden = true; el.panneauAide.hidden = true; });
    el.menuJouer.addEventListener('click', (e) => e.stopPropagation());
    el.panneauAide.addEventListener('click', (e) => e.stopPropagation());
  }

  function basculerMenuJouer() {
    el.panneauAide.hidden = true;
    const r = E.etat.reglages;
    el.menuJouer.replaceChildren(
      h('button.ed-menu-ligne', { onclick: () => { el.menuJouer.hidden = true; E.jouer(); } }, [ico('jouer', 15), 'Depuis le départ de la zone']),
      h('button.ed-menu-ligne', { onclick: () => { el.menuJouer.hidden = true; E.jouer({ ici: true }); } }, [ico('cadre', 15), 'Depuis le milieu de l\'écran']),
      h('div.ed-menu-trait'),
      interrupteur('Avec ma partie (formes, objets, histoire déjà vue)', !!r.jouerAvecPartie, (v) => E.reglage('jouerAvecPartie', v)),
      interrupteur('Toutes les formes débloquées', !!r.toutDebloquer, (v) => E.reglage('toutDebloquer', v)),
      interrupteur('Sans les scènes d\'histoire (le niveau seul)', !!r.sansHistoire, (v) => E.reglage('sansHistoire', v)),
      h('p.ed-menu-note', {}, 'Ta vraie partie n\'est jamais modifiée par ces essais.'),
    );
    el.menuJouer.hidden = !el.menuJouer.hidden;
  }

  function basculerAide() {
    el.menuJouer.hidden = true;
    const ligne = (touche, quoi) => h('div.ed-aide-ligne', {}, [h('kbd', {}, touche), h('span', {}, quoi)]);
    el.panneauAide.replaceChildren(
      h('h4', {}, 'Comment ça marche'),
      h('p', {}, 'Clique une image dans la bande, puis clique dans le niveau : l\'élément est posé. Clique un élément posé pour le choisir, fais-le glisser pour le déplacer, règle-le à droite.'),
      ligne('Molette', 'zoomer'),
      ligne('Espace + glisser', 'déplacer la vue (ou clic du milieu, ou glisser dans le vide)'),
      ligne('Flèches', 'déplacer la vue, ou pousser l\'élément choisi'),
      ligne('Suppr', 'enlever l\'élément choisi'),
      ligne('Ctrl + Z / Ctrl + Y', 'annuler / refaire'),
      ligne('Ctrl + D', 'copier l\'élément choisi'),
      ligne('Ctrl + S', 'enregistrer dans le jeu'),
      ligne('Ctrl + Entrée', 'jouer la zone'),
      ligne('Échap', 'ranger l\'outil, puis désélectionner'),
      ligne('Clic droit', 'effacer le sol (outil de peinture), sinon ranger l\'outil'),
      h('p.ed-menu-note', {}, 'Le sol : deux cases ne doivent jamais se toucher seulement par un coin. L\'éditeur le signale en rouge.'),
    );
    el.panneauAide.hidden = !el.panneauAide.hidden;
  }

  function construireEtat() {
    el.coord = h('span.ed-etat-coord', {}, 'x — · y —');
    el.caseXY = h('span.ed-etat-coord', {}, 'case —');
    el.annuler = h('button.ed-btn.ed-btn-plat', { title: 'Annuler (Ctrl + Z)', onclick: () => E.annuler() }, [ico('annuler', 15), 'Annuler']);
    el.refaire = h('button.ed-btn.ed-btn-plat', { title: 'Refaire (Ctrl + Y)', onclick: () => E.refaire() }, [ico('refaire', 15), 'Refaire']);
    el.controles = h('button.ed-btn.ed-btn-plat.ed-controles', { onclick: problemeSuivant });
    el.message = h('span.ed-etat-message');
    el.pastille = h('span.ed-pastille');
    el.enregistrer = h('button.ed-btn.ed-btn-lune', { title: 'Enregistrer la zone dans le jeu (Ctrl + S)', onclick: () => E.enregistrer() }, [ico('enregistrer', 15), 'Enregistrer']);
    el.etat.append(el.coord, el.caseXY, h('span.ed-etat-sep'), el.annuler, el.refaire, h('span.ed-etat-sep'), el.controles, el.message, el.pastille, el.enregistrer);
  }

  function construireZoom() {
    el.zoomTexte = h('button.ed-zoom-texte', { title: 'Revenir à 100 % (la vue exacte du jeu)', onclick: () => { const sc = E.scene; if (sc) { const v = sc.vueActuelle(); sc.poserVue(v.x, v.y, 1); } } }, '100 %');
    el.zoom.append(
      h('button', { title: 'Dézoomer', onclick: () => E.scene && E.scene.zoomer(1 / 1.25) }, [ico('moins', 15)]),
      el.zoomTexte,
      h('button', { title: 'Zoomer', onclick: () => E.scene && E.scene.zoomer(1.25) }, [ico('plus', 15)]),
      h('button', { title: 'Voir toute la zone', onclick: () => E.scene && E.scene.cadrerZone() }, [ico('cadre', 15)]),
    );
  }

  // --- Bande d'images -----------------------------------------------------------
  function vignette(entree, { actif = false, surClic, titre } = {}) {
    let image;
    const sc = E.scene || E.etat.sceneImages;
    if (entree.image && sc) {
      const cle = `${entree.id}`;
      let cv = vignettes.get(cle);
      if (!cv) {
        const cote = Math.round(56 * Math.min(2, window.devicePixelRatio || 1));
        cv = h('canvas', { width: cote, height: cote });
        cv.dataset.ok = EditeurImages.dessiner(sc, cv, entree.image) ? '1' : '';
        // Petite image d'origine (tuile de 24 px…) : agrandie en pixels nets.
        vignettes.set(cle, cv);
      }
      if (cv.dataset.ok) image = cv.cloneNode(false);
      if (image) image.getContext('2d').drawImage(cv, 0, 0);
    }
    if (!image) image = h('span.ed-vig-ico', { html: editeurIcone(entree.icone || (entree.image && entree.image.icone) || 'aide', 30) });
    return h('button.ed-vig', {
      title: titre || entree.nom, dataset: { id: entree.id }, className: `ed-vig${actif ? ' actif' : ''}`,
      onclick: (e) => { e.currentTarget.blur(); (surClic || (() => E.choisirOutil(entree)))(); },
    }, [h('span.ed-vig-img', {}, [image]), h('span.ed-vig-nom', {}, entree.nom)]);
  }

  function groupesDeLOnglet() {
    const onglet = E.etat.onglet;
    const d = E.etat.donnees || {};
    const groupes = [];
    const ajouter = (nom, items) => { if (items.length) groupes.push({ nom, items }); };
    const parGroupe = (liste) => {
      const m = new Map();
      for (const e of liste) { if (!m.has(e.groupe)) m.set(e.groupe, []); m.get(e.groupe).push(e); }
      return m;
    };
    const outil = E.etat.outil;
    const enMain = (e) => !!outil && outil.id === e.id;
    if (onglet === 'terrain') {
      for (const [nom, liste] of parGroupe(EDITEUR_OUTILS.filter((o) => o.onglet === 'terrain'))) ajouter(nom, liste.map((o) => ({ entree: o, actif: enMain(o) })));
    }
    const elements = E.etat.elements.filter((e) => e.onglet === onglet && !e.cache);
    const ordre = parGroupe(elements);
    let noms = Array.from(ordre.keys());
    if (onglet === 'decors') {
      // Le biome de la zone d'abord.
      const fond = typeof zoneBackgroundId === 'function' ? zoneBackgroundId(d) : d.background;
      const biome = EDITEUR_BIOMES[EDITEUR_BIOME_DU_FOND[fond]];
      if (biome && noms.includes(biome)) noms = [biome, ...noms.filter((n) => n !== biome)];
    }
    for (const nom of noms) ajouter(nom, ordre.get(nom).map((e) => ({ entree: e, actif: enMain(e) })));
    if (onglet === 'terrain' || onglet === 'zone') {
      ajouter('Jeu de tuiles', EDITEUR_TUILES.map((t) => ({
        entree: { id: `tuiles:${t.v}`, nom: t.nom, image: t.image, icone: 'terrain' }, actif: (d.tileset || '') === t.v,
        surClic: () => E.choisirTuiles(t.v), titre: `Sol dessiné avec les tuiles « ${t.nom} »`,
      })));
    }
    if (onglet === 'zone') {
      const fond = typeof zoneBackgroundId === 'function' ? zoneBackgroundId(d) : d.background;
      groupes.unshift({
        nom: 'Fond',
        items: [
          { entree: { id: 'fond:', nom: 'Ciel de nuit', icone: 'nuage' }, actif: !fond, surClic: () => E.choisirFond(null), titre: 'Le ciel de nuit d\'origine, sans fond peint' },
          ...EditeurListes.fonds().map((id) => ({
            entree: { id: `fond:${id}`, nom: EDITEUR_NOMS_FONDS[id] || editeurNomLisible(id.replace(/^fond_/, '')), image: { fond: id }, icone: 'nuage' },
            actif: fond === id, surClic: () => E.choisirFond(id), titre: 'Choisir ce fond',
          })),
        ],
      });
    }
    return groupes;
  }

  function rendreBande() {
    const q = sansAccent(recherche.trim());
    const groupes = groupesDeLOnglet().map((g) => ({ ...g, items: q ? g.items.filter((i) => sansAccent(i.entree.nom).includes(q) || sansAccent(g.nom).includes(q)) : g.items }))
      .filter((g) => g.items.length);
    const puces = h('div.ed-puces', {}, groupes.map((g) => h('button.ed-puce', {
      title: `Aller à « ${g.nom} »`,
      onclick: (e) => { e.currentTarget.blur(); const cible = el.bande.querySelector(`[data-groupe="${CSS.escape(g.nom)}"]`); if (cible) el.defile.scrollTo({ left: cible.offsetLeft - 8, behavior: 'smooth' }); },
    }, `${g.nom}`)));
    el.cherche = h('input', {
      type: 'search', placeholder: 'Chercher une image…', value: recherche, spellcheck: false,
      oninput: (e) => { recherche = e.target.value; rendreBande(); const c = el.bande.querySelector('input[type=search]'); if (c) { c.focus(); c.setSelectionRange(recherche.length, recherche.length); } },
    });
    el.defile = h('div.ed-defile', {}, groupes.length ? groupes.map((g) => h('section.ed-groupe', { dataset: { groupe: g.nom } }, [
      h('h5', {}, g.nom),
      h('div.ed-groupe-images', {}, g.items.map((i) => vignette(i.entree, i))),
    ])) : [h('p.ed-vide', {}, q ? `Aucune image ne s'appelle « ${recherche} » dans cet onglet.` : 'Rien à poser dans cet onglet.')]);
    // La molette fait défiler la bande de gauche à droite.
    el.defile.addEventListener('wheel', (e) => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { el.defile.scrollLeft += e.deltaY; e.preventDefault(); } }, { passive: false });
    el.bande.replaceChildren(
      h('div.ed-bande-haut', {}, [puces, h('label.ed-cherche', {}, [ico('loupe', 15), el.cherche])]),
      el.defile,
    );
  }

  function marquerOutil() {
    const outil = E.etat.outil;
    for (const b of el.bande.querySelectorAll('.ed-vig')) {
      const id = b.dataset.id || '';
      if (id.startsWith('tuiles:') || id.startsWith('fond:')) continue;
      b.classList.toggle('actif', !!outil && outil.id === id);
    }
    rendreAstuce();
  }

  function rendreAstuce() {
    const outil = E.etat.outil;
    if (!outil || E.etat.jeu) { el.astuce.hidden = true; return; }
    const peint = outil.outil === 'peindre' || outil.outil === 'effacer';
    el.astuce.hidden = false;
    el.astuce.replaceChildren(
      h('strong', {}, outil.nom),
      h('span', {}, peint ? (outil.aide || '') : 'Clique dans le niveau pour poser.'),
      h('span.ed-astuce-touche', {}, 'Échap : ranger'),
    );
  }

  // --- Réglages (panneau de droite) -----------------------------------------------
  function interrupteur(texte, valeur, surChange, aide) {
    const input = h('input', { type: 'checkbox', checked: !!valeur, onchange: (e) => { surChange(e.target.checked); e.target.blur(); } });
    return h('label.ed-case', { title: aide || null }, [input, h('span.ed-case-piste'), h('span.ed-case-texte', {}, texte)]);
  }

  function nombreEnTexte(v) {
    if (typeof v !== 'number') return '';
    return String(Math.round(v * 1000) / 1000);
  }

  function couleurVersHex(n) { return `#${(Number(n) >>> 0).toString(16).padStart(6, '0').slice(-6)}`; }

  // Un champ de réglage : `lire()` rend la valeur écrite (ou undefined), `ecrire(v)` l'enregistre.
  function champ(def, cible, lire, ecrire) {
    const defaut = typeof def.defaut === 'function' ? def.defaut(cible) : def.defaut;
    const ecrite = lire();
    const valeur = ecrite === undefined ? defaut : ecrite;
    const ligne = (corps, cls = '') => h(`div.ed-champ${cls}`, { title: def.aide || null }, [h('span.ed-champ-nom', {}, def.nom), corps]);
    switch (def.type) {
      case 'case':
        return interrupteur(def.nom, !!valeur, (v) => ecrire(v === !!defaut && def.retire === undefined ? undefined : (v === def.retire ? undefined : v)), def.aide);
      case 'sens': {
        const btn = (v, nom, icone) => h(`button.ed-sens${valeur === v ? '.actif' : ''}`, { title: `Regarde à ${nom.toLowerCase()}`, onclick: () => ecrire(v) }, [ico(icone, 16), nom]);
        return ligne(h('div.ed-sens-groupe', {}, [btn('left', 'Gauche', 'gauche'), btn('right', 'Droite', 'droite')]));
      }
      case 'liste': {
        const options = typeof def.options === 'function' ? def.options() : def.options;
        let i = options.findIndex((o) => o.v === valeur || (valeur === undefined && o.v === ''));
        const sel = h('select', { onchange: (e) => { const o = options[Number(e.target.value)]; e.target.blur(); if (o) ecrire(o.v === '' ? undefined : o.v); } },
          options.map((o, k) => h('option', { value: String(k) }, o.nom)));
        if (i < 0 && valeur !== undefined) {
          // Valeur écrite à la main, hors de la liste : montrée et gardée.
          sel.appendChild(h('option', { value: '-1' }, typeof valeur === 'string' ? editeurNomLisible(valeur) : 'Réglé à la main (gardé)'));
          i = options.length;
          sel.selectedIndex = i;
        } else sel.selectedIndex = Math.max(0, i);
        return ligne(sel, def.large ? '.ed-champ-large' : '');
      }
      case 'curseur': {
        const sortie = h('output', {}, nombreEnTexte(valeur));
        const range = h('input', {
          type: 'range', min: def.min, max: def.max, step: def.pas, value: valeur ?? def.min,
          oninput: (e) => { sortie.textContent = nombreEnTexte(Number(e.target.value)); },
          onchange: (e) => { ecrire(Number(e.target.value)); },
        });
        return ligne(h('div.ed-curseur', {}, [range, sortie]));
      }
      case 'nombre': {
        const input = h('input', {
          type: 'number', min: def.min, max: def.max, step: def.pas || 1, value: valeur === undefined || valeur === null ? '' : nombreEnTexte(valeur),
          placeholder: defaut === undefined ? '' : nombreEnTexte(defaut),
          onchange: (e) => {
            if (e.target.value === '') { ecrire(undefined); return; }
            let v = Number(e.target.value);
            if (!Number.isFinite(v)) return;
            if (def.min !== undefined) v = Math.max(def.min, v);
            if (def.max !== undefined) v = Math.min(def.max, v);
            ecrire(v);
          },
        });
        return ligne(h('div.ed-nombre', {}, [input, def.unite ? h('span', {}, def.unite) : null]));
      }
      case 'couleur': {
        const a = typeof valeur === 'number';
        const input = h('input', { type: 'color', value: a ? couleurVersHex(valeur) : '#0d0b1a', title: a ? 'Changer la couleur' : 'Choisir une couleur', onchange: (e) => ecrire(parseInt(e.target.value.slice(1), 16)) });
        return ligne(h(`div.ed-couleur${a ? '' : '.vide'}`, {}, [input, a ? h('button.ed-btn.ed-btn-mini', { onclick: () => ecrire(undefined) }, 'Enlever') : h('span.ed-discret', {}, 'aucune (clique pour choisir)')]));
      }
      case 'contenu':
        return champContenu(def, ecrite, ecrire);
      default: {
        const input = h('input', { type: 'text', value: typeof valeur === 'string' ? valeur : '', spellcheck: false, placeholder: typeof defaut === 'string' ? defaut : '', onchange: (e) => ecrire(e.target.value.trim() === '' ? undefined : e.target.value.trim()) });
        return ligne(input, '.ed-champ-large');
      }
    }
  }

  // Contenu d'un coffre, d'un trésor, récompense d'un bloc.
  function champContenu(def, valeur, ecrire) {
    const ligne = (corps) => h('div.ed-champ.ed-champ-large', {}, [h('span.ed-champ-nom', {}, def.nom), corps]);
    if (Array.isArray(valeur) || (valeur && typeof valeur !== 'object')) return ligne(h('span.ed-discret', {}, 'Plusieurs choses, réglées à la main (gardées).'));
    const c = valeur || {};
    const sorte = c.coeur ? 'coeur' : c.item ? 'item' : c.consommable ? 'conso' : c.eclats !== undefined ? 'eclats' : (def.facultatif ? 'rien' : 'eclats');
    const conso = typeof CONSUMABLE_INFO !== 'undefined' ? CONSUMABLE_INFO : {};
    const sortes = [
      ...(def.facultatif ? [['rien', 'Rien']] : []),
      ['eclats', 'Des éclats de lune'], ['coeur', 'Un cœur entier'], ['conso', 'Des provisions'], ['item', 'Un objet de l\'histoire'],
    ];
    const choix = h('select', {
      onchange: (e) => {
        e.target.blur();
        const s = e.target.value;
        if (s === 'rien') ecrire(undefined);
        else if (s === 'coeur') ecrire({ coeur: true });
        else if (s === 'eclats') ecrire({ eclats: 20 });
        else if (s === 'conso') ecrire({ consommable: Object.keys(conso)[0] || 'baie_soin', n: 1 });
        else ecrire({ item: (EditeurListes.objets()[0] || {}).v });
      },
    }, sortes.map(([v, nom]) => h('option', { value: v, selected: v === sorte }, nom)));
    const suite = [];
    if (sorte === 'eclats') {
      suite.push(h('input', { type: 'number', min: 1, max: 999, step: 1, value: c.eclats ?? 20, title: 'Combien d\'éclats', onchange: (e) => ecrire({ ...c, eclats: Math.max(1, Math.round(Number(e.target.value) || 1)) }) }));
    } else if (sorte === 'conso') {
      suite.push(h('select', { onchange: (e) => { e.target.blur(); ecrire({ ...c, consommable: e.target.value }); } },
        Object.keys(conso).map((k) => h('option', { value: k, selected: k === c.consommable }, conso[k].name || k))));
      suite.push(h('input', { type: 'number', min: 1, max: 20, step: 1, value: c.n ?? 1, title: 'Combien', onchange: (e) => ecrire({ ...c, n: Math.max(1, Math.round(Number(e.target.value) || 1)) }) }));
    } else if (sorte === 'item') {
      suite.push(h('select', { onchange: (e) => { e.target.blur(); ecrire({ ...c, item: e.target.value }); } },
        EditeurListes.objets().map((o) => h('option', { value: o.v, selected: o.v === c.item }, o.nom))));
    }
    return ligne(h('div.ed-contenu', {}, [choix, ...suite]));
  }

  const CLES_CONNUES = { requires: 'une condition d\'apparition', forbids: 'une condition de disparition', key: 'un nom dans l\'histoire',
    cells: 'des cases de collision', via: 'une courbe', bend: 'une courbure', forks: 'des fourches', taper: 'un effilement', scaleX: 'une largeur étirée',
    name: 'un nom affiché', sprite: 'une apparence', flatY: 'un écrasement', flipX: 'un retournement' };

  function rendreReglages() {
    const d = E.etat.donnees;
    const s = E.etat.selection;
    const elt = E.elementSelectionne();
    if (!d) { el.reglages.replaceChildren(h('div.ed-panneau-vide', {}, 'Chargement…')); return; }
    if (s && elt) { rendreElement(s, elt); return; }
    if (E.etat.onglet === 'zone') { rendreZone(); return; }
    const outil = E.etat.outil;
    const corps = [];
    if (outil) {
      corps.push(h('div.ed-entete', {}, [h('div.ed-entete-img', {}, [vignetteImage(outil)]), h('div', {}, [h('h3', {}, outil.nom), h('p', {}, 'Outil en main')])]));
      corps.push(h('p.ed-texte', {}, outil.aide || 'Clique dans le niveau pour le poser. Il se cale tout seul sur le sol quand il en a besoin.'));
      corps.push(h('p.ed-texte.ed-discret', {}, 'Échap ou clic droit pour ranger l\'outil.'));
    } else {
      corps.push(h('div.ed-entete', {}, [h('div.ed-entete-img', {}, [ico('fleche', 26)]), h('div', {}, [h('h3', {}, 'Rien de choisi'), h('p', {}, (E.infosZone() || {}).nom || '')])]));
      corps.push(h('p.ed-texte', {}, 'Clique une image en haut puis clique dans le niveau pour la poser.'));
      corps.push(h('p.ed-texte', {}, 'Clique un élément du niveau pour le régler ici, le déplacer à la souris ou l\'enlever.'));
    }
    corps.push(resumeZone());
    el.reglages.replaceChildren(...corps);
  }

  function vignetteImage(entree) {
    const b = vignette(entree, {});
    const img = b.querySelector('.ed-vig-img').firstChild;
    return img;
  }

  // Ce que la zone contient, par genre (un clic choisit le premier élément du genre).
  function resumeZone() {
    const d = E.etat.donnees;
    const lignes = [];
    for (const [genre, g] of Object.entries(EDITEUR_GENRES)) {
      const n = Array.isArray(d[genre]) ? d[genre].length : 0;
      if (!n) continue;
      lignes.push(h('button.ed-resume-ligne', { title: 'Montrer le suivant dans le niveau', onclick: () => montrerSuivant(genre) }, [h('span', {}, g.nom), h('b', {}, String(n))]));
    }
    const sol = Array.isArray(d.groundCells) ? d.groundCells.length : 0;
    return h('div.ed-resume', {}, [h('h4', {}, 'Dans cette zone'), h('div.ed-resume-ligne.ed-resume-fixe', {}, [h('span', {}, 'Cases de sol'), h('b', {}, String(sol))]), ...lignes]);
  }

  function montrerSuivant(genre) {
    const d = E.etat.donnees;
    const n = Array.isArray(d[genre]) ? d[genre].length : 0;
    if (!n) return;
    const s = E.etat.selection;
    const i = s && s.genre === genre ? (s.index + 1) % n : 0;
    E.selectionner(genre, i);
    const sc = E.scene;
    const b = sc && sc.boiteDe(genre, i);
    if (b) sc.centrerSur(b.x + b.w / 2, b.y + b.h / 2);
  }

  function rendreElement(s, elt) {
    const g = EDITEUR_GENRES[s.genre];
    const entree = editeurElementPour(E.etat.elements, s.genre, elt);
    const nom = E.nomElement(s.genre, elt);
    const corps = [];
    corps.push(h('div.ed-entete', {}, [
      h('div.ed-entete-img', {}, [entree ? vignetteImage(entree) : ico('aide', 26)]),
      h('div', {}, [h('h3', {}, nom), h('p', {}, nom === g.nom ? 'Élément choisi' : g.nom)]),
    ]));
    const pb = E.etat.problemes.find((p) => p.type === 'element' && p.genre === s.genre && p.index === s.index);
    if (pb) corps.push(h('p.ed-alerte', {}, [ico('alerte', 15), pb.texte]));
    const formulaire = h('div.ed-champs');
    // Position.
    if (typeof elt.x === 'number') {
      const pos = (cle, titre) => h('label.ed-pos', { title: titre }, [h('span', {}, cle), h('input', {
        type: 'number', step: 1, value: typeof elt[cle] === 'number' ? nombreEnTexte(elt[cle]) : '', placeholder: cle === 'y' ? 'au sol' : '',
        onchange: (e) => E.regler(cle, e.target.value === '' ? undefined : Math.round(Number(e.target.value)), { fusion: false }),
      })]);
      formulaire.appendChild(h('div.ed-champ', {}, [h('span.ed-champ-nom', {}, 'Position'), h('div.ed-pos-groupe', {}, [pos('x', 'De gauche à droite'), pos('y', 'De haut en bas')])]));
    }
    const montres = new Set(['x', 'y', 'type', ...(g.distingue || [])]);
    for (const def of g.champs || []) {
      montres.add(def.cle);
      if (def.pour && !def.pour.includes(elt[def.pourCle || 'type'])) continue;
      formulaire.appendChild(champ(def, elt, () => elt[def.cle], (v) => E.regler(def.cle, v, { fusion: def.type === 'curseur' || def.type === 'nombre' })));
    }
    corps.push(formulaire);
    // Ce que l'élément porte en plus et que l'éditeur garde sans le modifier.
    const autres = Object.keys(elt).filter((k) => !montres.has(k) && !['from', 'to', 'gx', 'gy', 'top', 'bottom'].includes(k));
    if (autres.length) {
      corps.push(h('p.ed-texte.ed-discret', {}, `Cet élément a aussi ${autres.map((k) => CLES_CONNUES[k] || `« ${editeurNomLisible(k).toLowerCase()} »`).join(', ')} : gardé tel quel.`));
    }
    corps.push(h('div.ed-actions', {}, [
      h('button.ed-btn', { title: 'Copier cet élément (Ctrl + D)', onclick: () => E.dupliquerSelection() }, [ico('dupliquer', 15), 'Copier']),
      h('button.ed-btn.ed-btn-danger', { title: 'Enlever cet élément (Suppr)', onclick: () => E.supprimerSelection() }, [ico('corbeille', 15), 'Supprimer']),
    ]));
    el.reglages.replaceChildren(...corps);
  }

  function rendreZone() {
    const d = E.etat.donnees;
    const info = E.infosZone() || {};
    const corps = [];
    corps.push(h('div.ed-entete', {}, [h('div.ed-entete-img', {}, [ico('reglages', 26)]), h('div', {}, [h('h3', {}, info.nom || 'Zone'), h('p', {}, 'Réglages de la zone')])]));
    if (E.etat.lectureSeule) corps.push(h('p.ed-alerte', {}, [ico('cadenas', 15), E.etat.lectureSeule]));
    if (E.etat.brouillonRepris || E.etat.modifie) {
      corps.push(h('div.ed-note', {}, [
        h('span', {}, E.etat.brouillonRepris ? 'Tu reprends un brouillon gardé dans ce navigateur.' : 'Des modifications ne sont pas encore enregistrées.'),
        h('button.ed-btn.ed-btn-mini', { onclick: () => { if (window.confirm('Abandonner toutes les modifications non enregistrées de cette zone ?')) E.abandonnerBrouillon(); } }, 'Revenir au fichier'),
      ]));
    }
    if (E.etat.ancienBrouillon) {
      corps.push(h('div.ed-note', {}, [
        h('span', {}, 'Un brouillon de l\'ancien éditeur existe pour cette zone : en jeu, c\'est lui qui s\'affiche à la place du fichier.'),
        h('button.ed-btn.ed-btn-mini', { onclick: () => { if (window.confirm('Oublier le brouillon de l\'ancien éditeur pour cette zone ?')) E.oublierAncienBrouillon(); } }, 'L\'oublier'),
      ]));
    }
    const formulaire = h('div.ed-champs');
    for (const def of EDITEUR_ZONE) {
      if (def.titre) { formulaire.appendChild(h('h4', {}, def.titre)); continue; }
      formulaire.appendChild(champ(def, d, () => E.lireZone(def.cle), (v) => {
        E.reglerZone(def.cle, v === def.retire ? undefined : v);
      }));
    }
    corps.push(formulaire);
    if (d.script) corps.push(h('p.ed-texte.ed-discret', {}, 'Cette zone a un script d\'histoire : ce qu\'il fait apparaître (boss, scènes) ne se voit qu\'en jouant.'));
    // Clés que l'éditeur garde sans les modifier.
    const editees = new Set([...EDITEUR_ZONE.filter((x) => x.cle).map((x) => x.cle.split('.')[0]), ...Object.keys(EDITEUR_GENRES),
      'groundCells', 'groundBackCells', 'background', 'tileset']);
    const gardees = Object.keys(d).filter((k) => !editees.has(k));
    if (gardees.length) {
      corps.push(h('div.ed-resume', {}, [
        h('h4', {}, 'Aussi dans cette zone'),
        h('p.ed-texte.ed-discret', {}, 'Gardé tel quel à l\'enregistrement (les onglets Histoire et Passages arrivent) :'),
        h('div.ed-etiquettes-cles', {}, gardees.map((k) => h('span', {}, EDITEUR_CLES_GARDEES[k] || editeurNomLisible(k)))),
      ]));
    }
    el.reglages.replaceChildren(...corps);
  }

  // --- Barre d'état ---------------------------------------------------------------
  function rendreEtat() {
    const st = E.etat;
    el.annuler.disabled = !st.annuler.length;
    el.refaire.disabled = !st.refaire.length;
    el.annuler.title = st.annuler.length ? `Annuler : ${st.annuler[st.annuler.length - 1].etiquette} (Ctrl + Z)` : 'Rien à annuler';
    el.refaire.title = st.refaire.length ? `Refaire : ${st.refaire[st.refaire.length - 1].etiquette} (Ctrl + Y)` : 'Rien à refaire';
    const n = st.problemes.length;
    el.controles.className = `ed-btn ed-btn-plat ed-controles ${n ? 'pb' : 'ok'}`;
    el.controles.replaceChildren(ico(n ? 'alerte' : 'ok', 15), n ? `${n} problème${n > 1 ? 's' : ''} à voir` : 'Aucun problème');
    el.controles.title = n ? st.problemes.slice(0, 6).map((p) => `• ${p.texte}`).join('\n') + (n > 6 ? '\n…' : '') + '\n\nClique pour aller au suivant.' : 'Sol et éléments : tout va bien.';
    let pastille;
    let classe;
    if (st.lectureSeule) { pastille = 'Lecture seule'; classe = 'erreur'; }
    else if (st.enregistrement === 'encours') { pastille = 'Enregistrement…'; classe = 'encours'; }
    else if (st.enregistrement === 'erreur') { pastille = 'Non enregistré'; classe = 'erreur'; }
    else if (st.serveur === false) { pastille = st.modifie ? 'Brouillon gardé (serveur absent)' : 'Serveur du projet absent'; classe = 'absent'; }
    else if (st.modifie) { pastille = 'Modifications non enregistrées'; classe = 'modifie'; }
    else { pastille = 'Enregistré'; classe = 'propre'; }
    el.pastille.className = `ed-pastille ${classe}`;
    el.pastille.textContent = pastille;
    el.pastille.title = st.serveur === false
      ? 'Pour enregistrer dans le jeu, lance le serveur du projet :\npython tools/dev_server.py 8000\npuis ouvre http://localhost:8000/index.html?editor\nTon brouillon reste gardé dans ce navigateur en attendant.'
      : (st.essai ? 'Serveur d\'essai : les zones sont écrites dans un dossier à part.' : 'État de l\'enregistrement dans le jeu.');
    el.message.textContent = st.message || '';
    el.message.title = st.message || '';
    el.enregistrer.disabled = !!st.lectureSeule || st.enregistrement === 'encours' || !st.modifie || st.serveur === false;
    // Bandeau au-dessus du niveau : ce qu'il faut savoir avant de travailler.
    const lignes = [];
    if (st.lectureSeule) lignes.push(h('span', {}, [ico('cadenas', 14), st.lectureSeule]));
    if (st.serveur === false) lignes.push(h('span', { title: el.pastille.title }, [ico('alerte', 14), 'Serveur du projet absent : tes modifications restent en brouillon dans ce navigateur (lance « python tools/dev_server.py 8000 » pour enregistrer).']));
    el.bandeau.replaceChildren(...lignes);
    el.bandeau.hidden = !lignes.length || !!st.jeu;
  }

  let iProbleme = -1;
  function problemeSuivant() {
    const pbs = E.etat.problemes;
    if (!pbs.length || !E.scene) return;
    iProbleme = (iProbleme + 1) % pbs.length;
    const p = pbs[iProbleme];
    E.scene.centrerSur(p.x, p.y);
    if (p.type === 'element') E.selectionner(p.genre, p.index);
    E.etat.message = p.texte;
    rendreEtat();
  }

  // --- Étiquettes posées sur le niveau ---------------------------------------------
  function poserEtiquettes(liste, versPage) {
    const boite = el.etiquettes;
    if (!boite) return;
    const cv = document.querySelector('#game-container canvas');
    if (cv) {
      // La couche d'étiquettes suit exactement le canvas (centré dans la zone du niveau).
      boite.style.left = `${cv.offsetLeft + cv.parentElement.offsetLeft}px`;
      boite.style.top = `${cv.offsetTop + cv.parentElement.offsetTop}px`;
      boite.style.width = `${cv.clientWidth}px`;
      boite.style.height = `${cv.clientHeight}px`;
    }
    while (etiquettes.length < liste.length) { const n = h('div.ed-etiquette'); boite.appendChild(n); etiquettes.push(n); }
    etiquettes.forEach((n, i) => {
      const it = liste[i];
      if (!it) { if (!n.hidden) n.hidden = true; return; }
      const p = versPage(it.x, it.y);
      n.hidden = false;
      if (n.textContent !== it.texte) n.textContent = it.texte;
      n.className = `ed-etiquette${it.discret ? ' discret' : ''}`;
      n.style.transform = `translate(${Math.round(p.x)}px, ${Math.round(p.y) - 5}px) translate(-50%, -100%)`;
      n.style.borderColor = `#${it.couleur.toString(16).padStart(6, '0')}`;
    });
  }

  // --- Clavier ---------------------------------------------------------------------
  function dansUnChamp(e) {
    const t = e.target;
    return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
  }

  function brancherClavier() {
    const fleches = { ArrowLeft: 'gauche', ArrowRight: 'droite', ArrowUp: 'haut', ArrowDown: 'bas' };
    window.addEventListener('keydown', (e) => {
      const st = E.etat;
      if (st.jeu) {
        if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); E.revenir(); }
        return;
      }
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key.toLowerCase() === 's') { e.preventDefault(); if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); E.enregistrer(); return; }
      if (dansUnChamp(e)) {
        if (e.key === 'Escape' || e.key === 'Enter') e.target.blur();
        return;
      }
      if (ctrl && e.key === 'Enter') { e.preventDefault(); E.jouer(); return; }
      if (ctrl && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) E.refaire(); else E.annuler(); return; }
      if (ctrl && e.key.toLowerCase() === 'y') { e.preventDefault(); E.refaire(); return; }
      if (ctrl && e.key.toLowerCase() === 'd') { e.preventDefault(); E.dupliquerSelection(); return; }
      if (ctrl || e.altKey) return;
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); E.supprimerSelection(); return; }
      if (e.key === 'Escape') {
        const sc = E.scene;
        if (sc && (sc.glisse || sc.trait)) sc.annulerGeste();
        else if (st.outil) E.choisirOutil(null);
        else E.selectionner(null);
        return;
      }
      if (e.key === ' ') { e.preventDefault(); st.espace = true; return; }
      if (fleches[e.key]) {
        e.preventDefault();
        if (st.selection) {
          const pas = e.shiftKey ? 8 : 1;
          E.pousserSelection((e.key === 'ArrowRight' ? pas : e.key === 'ArrowLeft' ? -pas : 0), (e.key === 'ArrowDown' ? pas : e.key === 'ArrowUp' ? -pas : 0));
        } else st.touches[fleches[e.key]] = true;
        return;
      }
      if (e.key === '+' || e.key === '=') { if (E.scene) E.scene.zoomer(1.25); return; }
      if (e.key === '-') { if (E.scene) E.scene.zoomer(1 / 1.25); return; }
      if (e.key === '0') { const sc = E.scene; if (sc) { const v = sc.vueActuelle(); sc.poserVue(v.x, v.y, 1); } }
    }, true);
    window.addEventListener('keyup', (e) => {
      if (e.key === ' ') E.etat.espace = false;
      if (fleches[e.key]) E.etat.touches[fleches[e.key]] = false;
    }, true);
    window.addEventListener('blur', () => { E.etat.espace = false; Object.keys(E.etat.touches).forEach((k) => { E.etat.touches[k] = false; }); });
  }

  // --- Abonnements -------------------------------------------------------------------
  function brancher() {
    E.poserEtiquettes = poserEtiquettes;
    E.sur('pret', (scene) => { E.etat.sceneImages = scene; el.attente.hidden = true; vignettes.clear(); rendreBande(); });
    E.sur('zone', () => { el.zone.value = E.etat.zone; recherche = ''; rendreBande(); rendreReglages(); rendreEtat(); marquerOnglet(); iProbleme = -1; });
    E.sur('donnees', () => { rendreReglages(); rendreEtat(); if (E.etat.onglet === 'zone' || E.etat.onglet === 'terrain') rendreBande(); });
    E.sur('selection', () => { rendreReglages(); });
    E.sur('outil', () => { marquerOutil(); if (!E.etat.selection) rendreReglages(); });
    E.sur('onglet', () => { recherche = ''; marquerOnglet(); rendreBande(); rendreReglages(); });
    E.sur('etat', () => { rendreEtat(); if (E.etat.onglet === 'zone' && !E.etat.selection) rendreReglages(); });
    E.sur('jeu', () => { rendreEtat(); rendreAstuce(); el.retour.hidden = !E.etat.jeu; });
    E.sur('curseur', (c) => {
      el.coord.textContent = c ? `x ${Math.round(c.x)} · y ${Math.round(c.y)}` : 'x — · y —';
      el.caseXY.textContent = c ? `case ${c.gx}, ${c.gy}` : 'case —';
    });
    E.sur('vue', (v) => { el.zoomTexte.textContent = `${Math.round(v.zoom * 100)} %`; });
    E.sur('rendu', (r) => {
      if (r && r.erreur) { E.etat.message = 'Cette zone ne peut pas être affichée entièrement (voir la console).'; rendreEtat(); }
    });
    el.retour.hidden = true;
  }

  function marquerOnglet() {
    for (const b of el.onglets.querySelectorAll('.ed-onglet')) b.classList.toggle('actif', b.dataset.onglet === E.etat.onglet);
  }

  function demarrer() {
    construire();
    brancher();
    marquerOnglet();
    rendreEtat();
  }

  return { demarrer, rendreBande, rendreReglages, rendreEtat };
})();
