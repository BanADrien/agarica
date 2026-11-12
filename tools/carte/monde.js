// Carte du monde (outil de travail) -- modèle : ce que la carte sait du jeu.
//
// Tout vient des VRAIES données chargées par charge.js (zones, DEMO_ZONES,
// MAP_ZONE_LAYOUT, MENU_CHAPTERS...). Ce fichier ne dessine rien : il range les
// zones, leurs passages, leurs éléments et une liste de contrôles (anomalies).
//
// Ce qui N'EST PAS dans les données (ordre de l'histoire, capacité demandée
// pour entrer, passages faits par un script) est écrit dans les petites tables
// ci-dessous, chacune avec sa source. Ce sont les seules choses à tenir à jour
// à la main ; le contrôle « passage de cinématique absent de la table » prévient
// quand la table des passages a pris du retard.
(function () {
  'use strict';

  const CASE = 64;
  const L = (nom) => window.CarteCharge.lireGlobale(nom);

  // ---------------------------------------------------------------------
  // Tables écrites à la main
  // ---------------------------------------------------------------------

  // Ordre du chemin principal. Source : CLAUDE.md, « Démo complète en 15 zones ».
  // `optionnelle` : étape qu'on peut sauter (l'épreuve du singe).
  const PARCOURS = [
    { zone: 'bosquet', note: 'prologue, puis bannissement' },
    { zone: 'foret_sombre_1', note: 'rencontre de Xara, fracas de l\'ours' },
    { zone: 'foret_sombre_2', note: 'les ravins, totem du loup' },
    { zone: 'grand_arbre_racines', note: 'totem du singe' },
    { zone: 'grand_arbre_arene', note: 'Kainati (épargné), par les lianes' },
    { zone: 'epreuve_singe', note: 'optionnelle, depuis les racines', optionnelle: true },
    { zone: 'foret_flottante_1', note: 'le chemin des hauteurs, Geralt' },
    { zone: 'foret_flottante_2', note: 'les îles, totem de l\'aigle' },
    { zone: 'clairiere_plante', note: 'la plante' },
    { zone: 'hutte_morgat', note: 'Morgat, le répulsif, le crash' },
    { zone: 'foret_corrompue_1', note: 'après le crash' },
    { zone: 'arene_ghilt', note: 'Ghil\'t : défaite imposée' },
    { zone: 'trou_sombre', note: 'le papillon' },
    { zone: 'arene_ghilt', note: 'Ghil\'t phase 2 : le soin' },
    { zone: 'bosquet_retour', note: 'retour, écran de fin' },
  ];

  // Ce qu'il faut pour ENTRER dans une zone. `besoin` : pastilles (loup, singe,
  // aigle, ours, saut2 = second saut singe ou aigle, epee, repulsif, histoire).
  // Sources : docs/production/VAGUE3_DESIGN.md § 1.2 (colonne « Capacité pour
  // entrer ») pour les dix zones facultatives ; CLAUDE.md (« Démo complète en
  // 15 zones ») pour le chemin principal. La carte complète cette table avec ce
  // qu'elle déduit des données (`requires` des sorties, blocs cassables posés
  // sur une sortie, `exitsAfterVictory`).
  const ACCES = {
    foret_sombre_1: { besoin: ['histoire'], texte: 'bannissement (fin du bosquet)' },
    grand_arbre_arene: { besoin: ['singe'], texte: 'par les lianes, après le totem du singe' },
    epreuve_singe: { besoin: ['singe'], texte: 'arche des racines, totem du singe allumé' },
    foret_flottante_1: { besoin: ['histoire'], texte: 'Kainati épargné' },
    foret_corrompue_1: { besoin: ['histoire'], texte: 'le crash depuis la hutte (répulsif obtenu)' },
    trou_sombre: { besoin: ['histoire'], texte: 'défaite imposée contre Ghil\'t' },
    bosquet_retour: { besoin: ['histoire'], texte: 'Ghil\'t soigné (papillon)' },
    // Vague 3 (VAGUE3_DESIGN.md § 1.2).
    grotte_lisiere: { besoin: ['singe', 'ours'], texte: 'singe (lianes du gouffre) ; le bouchon se casse à l\'ours ; l\'aigle peut aussi planer' },
    galeries_racines: { besoin: [], texte: 'aucune depuis les racines ; singe entre ses deux moitiés' },
    cercle_lune: { besoin: ['saut2'], texte: 'second saut (singe ou aigle)' },
    cime_cachee: { besoin: ['loup', 'saut2'], texte: 'loup (plateforme cachée) + second saut, après la victoire sur Kainati' },
    ile_des_vents: { besoin: ['aigle'], texte: 'aigle (courant d\'air)' },
    ile_du_gardien: { besoin: ['aigle'], texte: 'aigle (courant d\'air)' },
    marais_brumes: { besoin: ['ours'], texte: 'ours (bouchon de terre) ; répulsif dedans' },
    racines_suspendues: { besoin: [], texte: 'aucune ; singe ou aigle pour le coffre' },
    nid_cocons: { besoin: ['ours'], texte: 'ours (sol fissuré) ; répulsif puis papillon dedans' },
    canopee_malade: { besoin: ['saut2'], texte: 'second saut' },
  };

  // Passages faits par un SCRIPT (absents de `exits`). `x`, `y` : d'où l'on part
  // dans la zone de départ (px de la zone). Sources en fin de ligne.
  const PASSAGES_SCRIPT = [
    { de: 'bosquet', scene: 'ForetSombre1Scene', enterId: 'from_bosquet', x: 3760, y: 400, texte: 'bannissement (cinématique)' }, // src/story/acte1.js, { goto: { scene: 'foret_sombre_1' … } }
    { de: 'grand_arbre_racines', scene: 'EpreuveSingeScene', enterId: 'from_racines', x: 40, y: -230, texte: 'arche de racines (E), totem du singe allumé' }, // src/story/acte1_arbre.js, arbreGlowPassage(scene, 40, -190, …)
    { de: 'epreuve_singe', scene: 'GrandArbreRacinesScene', enterId: 'from_epreuve', x: 40, y: 400, texte: 'arche du départ (E)' }, // src/story/acte1_arbre.js, arbreGlowPassage(scene, 40, 390, …)
    { de: 'epreuve_singe', scene: 'GrandArbreRacinesScene', enterId: 'from_epreuve', x: 12200, y: -240, texte: 'fente du sommet, talisman pris' }, // src/story/acte1_arbre.js, EPREUVE_SINGE_SORTIE_SOMMET
    { de: 'hutte_morgat', scene: 'ForetCorrompue1Scene', enterId: 'from_crash', x: 2650, y: 400, texte: 'le crash (cinématique)' }, // src/story/acte2.js, CUTSCENES.crash
    { de: 'hutte_morgat', scene: 'ForetSombre2Scene', enterId: 'from_hutte_morgat', x: 420, y: 400, texte: 'sentier (choix, répulsif)' }, // src/story/acte2.js, a2HutteSentier
    { de: 'arene_ghilt', scene: 'TrouSombreScene', enterId: 'from_arene', x: 672, y: 470, texte: 'défaite imposée (cinématique)' }, // src/story/boss_ghilt.js, goToScene(scene, 'TrouSombreScene' …)
    { de: 'monde_spirituel', scene: 'GrandArbreRacinesScene', enterId: 'totem_singe', x: 2840, y: 400, texte: 'retour (script)' }, // src/story/acte1_arbre.js, MONDE_SPIRITUEL_RETOUR
  ];

  // Éléments posés par un script, lus dans ses constantes (toujours à jour).
  // `globale` : nom de la constante, `lire` : ce qu'on en tire.
  const ELEMENTS_SCRIPT = [
    // src/story/acte1.js, FS2_COEUR (graine de chêne-cœur derrière le mur au répulsif).
    { zone: 'foret_sombre_2', globale: 'FS2_COEUR', lire: (c) => ({ cat: 'tresors', forme: 'coeur', x: c.x, y: c.y, nom: 'cœur (graine de chêne-cœur)', detail: 'posé par le script, constante FS2_COEUR' }) },
    // src/story/boss_ghilt.js, GHILT_ARENA.bossX.
    { zone: 'arene_ghilt', globale: 'GHILT_ARENA', lire: (c, z) => ({ cat: 'boss', forme: 'boss', x: c.bossX, y: (surfaceY(z, c.bossX) ?? 448) - 50, nom: 'Ghil\'t (boss)', detail: `arène x ${c.minX}-${c.maxX} (GHILT_ARENA)` }) },
  ];

  // Noms des ennemis (types de ENEMY_REGISTRY, LevelKit.js). Un type inconnu
  // s'affiche avec son identifiant.
  const ENNEMIS = {
    araignee: { nom: 'araignée', code: 'A' },
    loup: { nom: 'loup sanguinaire', code: 'L' },
    loupAlpha: { nom: 'loup alpha', code: 'Lα', boss: true },
    corbeau: { nom: 'corbeau', code: 'C' },
    crapaud: { nom: 'crapaud', code: 'Cr' },
    ghilt: { nom: 'Ghil\'t', code: 'G', boss: true },
    mousse_creature: { nom: 'créature de mousse', code: 'M' },
    singe_corrompu: { nom: 'singe corrompu', code: 'S' },
    crapaud_sauteur: { nom: 'crapaud sauteur', code: 'Cs' },
    crapaud_corrompu: { nom: 'crapaud sauteur', code: 'Cs' },
    crapaud_piege: { nom: 'crapaud-piège', code: 'Cp' },
  };

  // Drapeaux de `requires` / `forbids` en clair.
  const DRAPEAUX = {
    hasWolfForm: 'loup', hasMonkeyForm: 'singe', hasEagleForm: 'aigle', hasOctopusForm: 'pieuvre',
    xaraMet: 'Xara rencontrée', marchandVu: 'Tamarin rencontré', kainatiDefeated: 'Kainati vaincu',
    talismanOurs: 'talisman de l\'ours', geraltMet: 'Geralt rencontré', banished: 'bannie',
  };
  const BESOINS = {
    loup: { nom: 'loup', code: 'L', couleur: '#b9a7ff' },
    singe: { nom: 'singe', code: 'S', couleur: '#e0b062' },
    aigle: { nom: 'aigle', code: 'A', couleur: '#8fd0ff' },
    ours: { nom: 'ours', code: 'O', couleur: '#d08a4a' },
    saut2: { nom: 'second saut (singe ou aigle)', code: '2', couleur: '#8fe6c4' },
    epee: { nom: 'épée', code: 'É', couleur: '#b8c4d6' },
    repulsif: { nom: 'répulsif', code: 'R', couleur: '#9bff5a' },
    histoire: { nom: 'étape de l\'histoire', code: 'H', couleur: '#ff9fc9' },
  };

  const REGIONS = {
    bosquet: { nom: 'Bosquet d\'Émeraude', sol: '#6fae55' },
    foret_sombre: { nom: 'Forêt sombre', sol: '#5f7fc4' },
    grand_arbre: { nom: 'Grand arbre', sol: '#b98a55' },
    foret_flottante: { nom: 'Forêt flottante', sol: '#62b8cf' },
    foret_corrompue: { nom: 'Forêt corrompue', sol: '#b061b8' },
    test: { nom: 'Zones de test', sol: '#8a8698' },
  };

  // ---------------------------------------------------------------------
  // Petites aides
  // ---------------------------------------------------------------------
  const cle = (gx, gy) => `${gx},${gy}`;
  const versPascal = (id) => id.split('_').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('');

  function conditionTexte(o) {
    if (!o) return '';
    const bouts = [];
    const lire = (obj, non) => {
      for (const [k, v] of Object.entries(obj || {})) {
        const nom = k === 'item' ? `objet ${v}` : (DRAPEAUX[k] || k);
        const neg = non ? v !== false : v === false;
        bouts.push(`${neg ? 'sans ' : ''}${nom}`);
      }
    };
    lire(o.requires, false);
    lire(o.forbids, true);
    return bouts.join(', ');
  }

  // Dessus de sol à découvert le plus proche de `ref` sous `x` (même règle que
  // storyStandY, StoryKit.js) ; null s'il n'y a pas de sol dans cette colonne.
  function surfaceY(z, x, ref = 448) {
    const gx = Math.floor(x / CASE);
    let best = null;
    for (const gy of z.colonnes.get(gx) || []) {
      if (z.plein.has(cle(gx, gy - 1))) continue;
      const top = gy * CASE;
      if (best === null || Math.abs(top - ref) < Math.abs(best - ref)) best = top;
    }
    return best;
  }

  // Première surface de sol SOUS le point (pour poser les pieds de l'outil de saut).
  function surfaceSous(z, x, y, maxDrop = 160) {
    const gx = Math.floor(x / CASE);
    let best = null;
    for (const gy of z.colonnes.get(gx) || []) {
      if (z.plein.has(cle(gx, gy - 1))) continue;
      const top = gy * CASE;
      if (top >= y - 8 && top <= y + maxDrop && (best === null || top < best)) best = top;
    }
    return best;
  }

  const estPlein = (z, x, y) => z.plein.has(cle(Math.floor(x / CASE), Math.floor(y / CASE)));

  // Cases d'un bloc cassable (même lecture que SecretKit.js).
  function casesCassable(b) {
    if (Array.isArray(b.cells)) return b.cells.filter((c) => Array.isArray(c) && c.length >= 2).map(([gx, gy]) => [Math.round(gx), Math.round(gy)]);
    const out = [];
    if (b.x != null && b.y != null && b.w && b.h) {
      for (let gy = Math.floor((b.y - b.h / 2) / CASE); gy <= Math.floor((b.y + b.h / 2) / CASE); gy++) {
        for (let gx = Math.floor((b.x - b.w / 2) / CASE); gx <= Math.floor((b.x + b.w / 2) / CASE); gx++) {
          const cx = gx * CASE + CASE / 2;
          const cy = gy * CASE + CASE / 2;
          if (Math.abs(cx - b.x) <= b.w / 2 && Math.abs(cy - b.y) <= b.h / 2) out.push([gx, gy]);
        }
      }
    }
    return out;
  }

  function contenuTexte(contents) {
    const liste = [].concat(contents || []);
    if (!liste.length) return '';
    return liste.map((c) => {
      if (c.coeur) return 'cœur';
      if (c.item) return `objet ${c.item}`;
      if (c.consommable) return `${c.consommable}`;
      if (c.eclats != null) return `${c.eclats} éclats`;
      if (c.shards != null) return `${c.shards} éclats`;
      return JSON.stringify(c);
    }).join(' + ');
  }
  const contientCoeur = (contents) => [].concat(contents || []).some((c) => c && c.coeur);

  // ---------------------------------------------------------------------
  // Une zone
  // ---------------------------------------------------------------------
  function lireZone(id, entree, legacyNoms) {
    const data = L(`${id.toUpperCase()}_DATA`);
    if (!data || typeof data !== 'object' || !data.levelWidth) return null;
    const scene = entree ? entree.scene : `${versPascal(id)}Scene`;
    const cells = typeof window.zoneGroundCells === 'function' ? window.zoneGroundCells(data) : (data.groundCells || []);
    const z = {
      id,
      scene,
      nom: entree ? entree.name : (legacyNoms[scene] || id),
      nomJeu: data.zoneName || '',
      region: entree ? entree.region : 'test',
      data,
      cells,
      backCells: data.groundBackCells || [],
      plein: new Set(),
      colonnes: new Map(),
      marqueurs: [],
      sorties: [],
      entrants: [],
      etapes: [],
      x: 0,
      y: 0,
    };
    for (const c of cells) {
      z.plein.add(cle(c[0], c[1]));
      if (!z.colonnes.has(c[0])) z.colonnes.set(c[0], []);
      z.colonnes.get(c[0]).push(c[1]);
    }
    // Boîte : même calcul que la carte du jeu (mapZoneBox, MapScene.js), pour
    // que MAP_ZONE_LAYOUT tombe juste.
    let top = Math.min(0, data.levelTop || 0);
    let bottom = data.levelHeight || 540;
    for (const c of cells) {
      top = Math.min(top, c[1] * CASE);
      bottom = Math.max(bottom, (c[1] + 1) * CASE);
    }
    z.box = { w: data.levelWidth || 960, top, bottom };
    return z;
  }

  function marqueursDe(z) {
    const d = z.data;
    const m = z.marqueurs;
    const sol = (x, ref) => surfaceY(z, x, ref) ?? 448;

    for (const e of d.enemies || []) {
      if (!e) continue;
      const def = ENNEMIS[e.type] || { nom: e.type, code: '?' };
      m.push({
        cat: def.boss ? 'boss' : 'ennemis', forme: def.boss ? 'boss' : 'ennemi', x: e.x, y: e.y ?? sol(e.x) - 30,
        nom: def.nom, code: def.code,
        patrouille: e.patrolMinX != null && e.patrolMaxX != null ? [e.patrolMinX, e.patrolMaxX] : null,
        detail: [e.hp ? `${e.hp} PV` : '', e.patrolMinX != null ? `patrouille x ${e.patrolMinX}-${e.patrolMaxX}` : '', e.reach ? `portée ${e.reach}` : '', conditionTexte(e)].filter(Boolean).join(' · '),
      });
    }
    // Boss posés par le script de la zone.
    if (d.kainatiArena) {
      const a = d.kainatiArena;
      m.push({ cat: 'boss', forme: 'boss', x: (a.minX + a.maxX) / 2, y: (a.floorY ?? 448) - 50, nom: 'Kainati (boss, épargné)', detail: `arène x ${a.minX}-${a.maxX} (kainatiArena)`, plage: [a.minX, a.maxX, a.floorY ?? 448] });
    }
    for (const e of ELEMENTS_SCRIPT) {
      if (e.zone !== z.id) continue;
      const c = L(e.globale);
      if (c) m.push(e.lire(c, z));
    }

    for (const n of d.npcs || []) {
      if (!n) continue;
      m.push({
        cat: 'pnj', forme: 'pnj', x: n.x, y: (n.y ?? sol(n.x)) - 26, nom: n.key || n.id || 'PNJ',
        detail: [n.shop ? `boutique ${n.shop}` : '', typeof n.talk === 'string' ? `dialogue ${n.talk}` : '', n.onProp ? `sur ${n.onProp}` : '', conditionTexte(n)].filter(Boolean).join(' · '),
      });
    }
    // Repères d'histoire tenus par le script de la zone.
    if (d.plante) m.push({ cat: 'pnj', forme: 'repere', x: d.plante.x, y: sol(d.plante.x) - 30, nom: 'la plante', detail: `rayon ${d.plante.radius || '?'} (clé plante)` });
    if (d.hutte) {
      m.push({ cat: 'pnj', forme: 'repere', x: d.hutte.x, y: sol(d.hutte.x) - 30, nom: 'hutte de Morgat', detail: 'clé hutte' });
      if (d.hutte.rampeX != null) m.push({ cat: 'pnj', forme: 'repere', x: d.hutte.rampeX, y: sol(d.hutte.rampeX) - 30, nom: 'rampe du crash', detail: 'clé hutte.rampeX' });
    }

    for (const c of d.campfires || []) m.push({ cat: 'feux', forme: 'feu', x: c.x, y: (c.y ?? sol(c.x)) - 14, nom: 'feu de camp', detail: 'soin, sauvegarde, menu' });
    for (const t of d.totems || []) {
      m.push({ cat: 'totems', forme: 'totem', x: t.x, y: (t.y ?? sol(t.x)) - 34, nom: `totem : ${DRAPEAUX[t.flag] || t.flag}`, detail: [t.message || '', conditionTexte(t)].filter(Boolean).join(' · ') });
    }
    for (const c of d.chests || []) {
      const coeur = contientCoeur(c.contents);
      m.push({ cat: 'tresors', forme: coeur ? 'coeur' : 'coffre', x: c.x, y: (c.y ?? sol(c.x)) - 18, nom: `coffre ${c.id || ''}`.trim(), detail: [contenuTexte(c.contents) || (c.shards != null ? `${c.shards} éclats` : ''), c.tier || '', conditionTexte(c)].filter(Boolean).join(' · ') });
    }
    for (const t of d.treasures || []) {
      const coeur = contientCoeur(t.contents);
      m.push({ cat: 'tresors', forme: coeur ? 'coeur' : 'objet', x: t.x, y: (t.y ?? sol(t.x)) - 18, nom: coeur ? `cœur ${t.id || ''}`.trim() : `trésor ${t.id || ''}`.trim(), detail: [contenuTexte(t.contents), conditionTexte(t)].filter(Boolean).join(' · ') });
    }
    for (const p of d.pickups || []) {
      const coeur = /coeur/.test(p.item || '');
      m.push({ cat: 'tresors', forme: coeur ? 'coeur' : 'objet', x: p.x, y: p.y ?? sol(p.x) - 30, nom: `objet ${p.item}`, detail: [p.cutscene ? `cinématique ${p.cutscene}` : '', conditionTexte(p)].filter(Boolean).join(' · ') });
    }
    for (const b of d.butterflies || []) m.push({ cat: 'papillons', forme: 'papillon', x: b.x, y: b.y ?? sol(b.x) - 40, nom: `papillon ${b.id || ''}`.trim(), detail: b.prison ? `prison : ${b.prison}` : '' });

    for (const b of d.breakables || []) {
      const cases = casesCassable(b);
      if (!cases.length) continue;
      const gxs = cases.map((c) => c[0]);
      const gys = cases.map((c) => c[1]);
      const par = b.by === 'bear' ? 'ours' : b.by === 'sword' ? 'épée' : (b.by || '?');
      m.push({
        cat: 'cassables', forme: 'cassable', par: b.by, cases,
        x: (Math.min(...gxs) + Math.max(...gxs) + 1) * CASE / 2, y: (Math.min(...gys) + Math.max(...gys) + 1) * CASE / 2,
        nom: `cassable (${par}) ${b.id || ''}`.trim(), code: b.by === 'bear' ? 'O' : b.by === 'sword' ? 'É' : '?',
        detail: [`${cases.length} cases`, b.reward ? `récompense ${contenuTexte(b.reward)}` : '', conditionTexte(b)].filter(Boolean).join(' · '),
        source: b,
      });
    }
    for (const v of d.vines || []) m.push({ cat: 'lianes', forme: 'liane', x: v.x, y: v.y, longueur: v.length || 160, nom: 'liane', detail: `attache y ${v.y}, longueur ${v.length || '?'}` });
    for (const c of d.windCurrents || []) {
      const w = c.w || 120;
      const h = c.h || 300;
      m.push({ cat: 'courants', forme: 'courant', x: c.x + w / 2, y: c.y + h / 2, rect: [c.x, c.y, w, h], nom: 'courant d\'air', detail: `x ${c.x}-${c.x + w}, y ${c.y} à ${c.y + h}${c.force ? `, force ${c.force}` : ''}` });
    }
    const mousse = (list, defH, nom, forme) => {
      for (const b of list || []) {
        const w = b.w || 96;
        const h = b.h || defH;
        const y = b.y != null ? b.y : sol(b.x) - h / 2;
        m.push({ cat: 'mousse', forme, x: b.x, y, rect: [b.x - w / 2, y - h / 2, w, h], nom: `${nom} ${b.id || ''}`.trim(), detail: `${w} × ${h}` });
      }
    };
    mousse(d.mossBlocks, 96, 'amas de mousse (ours)', 'amas');
    mousse(d.mossWalls, 192, 'mur de mousse (répulsif)', 'murMousse');
    for (const c of d.checkpoints || []) m.push({ cat: 'reprises', forme: 'reprise', x: c.x, y: (c.y ?? sol(c.x)) - 16, nom: 'point de reprise', detail: '' });
    for (const t of d.triggers || []) {
      const w = t.w || 64;
      const haut = t.h != null;
      const y = haut ? (t.y ?? 0) : null;
      m.push({
        cat: 'declencheurs', forme: 'declencheur', x: t.x, y: haut ? y : (sol(t.x) - 60),
        rect: haut ? [t.x - w / 2, y - t.h / 2, w, t.h] : [t.x - w / 2, z.box.top, w, z.box.bottom - z.box.top],
        nom: `déclencheur ${t.id || ''}`.trim(), detail: [t.cutscene ? `cinématique ${t.cutscene}` : '', t.once ? 'une fois' : '', conditionTexte(t)].filter(Boolean).join(' · '),
      });
    }
    for (const t of d.tracks || []) m.push({ cat: 'loup', forme: 'piste', x: t.x + (t.w || 200) / 2, y: (t.y ?? sol(t.x)) - 6, ligne: [t.x, t.x + (t.w || 200), (t.y ?? sol(t.x)) - 6], nom: 'piste du loup', detail: `x ${t.x}-${t.x + (t.w || 200)}` });
    for (const h of d.hiddenPlatforms || []) {
      const w = Math.max(1, h.w || 1);
      m.push({ cat: 'loup', forme: 'cachee', x: (h.gx + w / 2) * CASE, y: (h.gy + 0.5) * CASE, rect: [h.gx * CASE, h.gy * CASE, w * CASE, CASE], nom: 'plateforme cachée (loup)', detail: `case ${h.gx}, ${h.gy}, ${w} de large` });
    }

    // Dangers et pièges.
    if (d.fall && d.fall.y != null) m.push({ cat: 'dangers', forme: 'chute', x: z.box.w / 2, y: d.fall.y, niveau: d.fall.y, nom: 'ligne de chute', detail: `y ${d.fall.y}, mode ${d.fall.mode || '?'}`, sansPastille: true });
    if (d.liquidFloor && d.liquidFloor.y != null) {
      const lf = d.liquidFloor;
      m.push({ cat: 'dangers', forme: 'liquide', x: ((lf.x1 ?? 0) + (lf.x2 ?? z.box.w)) / 2, y: lf.y, niveau: lf.y, x1: lf.x1 ?? 0, x2: lf.x2 ?? z.box.w, nom: `nappe (${lf.style || 'liquide'})`, detail: `y ${lf.y}`, sansPastille: true });
    }
    const pieges = [];
    if (d.rockfall) pieges.push(['chute de pierres', d.rockfall]);
    for (const r of d.rockfalls || []) pieges.push(['chute de pierres', r]);
    for (const r of d.rhythmRocks || []) pieges.push(['pierres en rythme', r]);
    for (const t of d.tides || []) pieges.push(['marée', { x1: t.x, x2: t.x + (t.w || 0), surfaceY: t.high }]);
    for (const c of d.crumble || []) pieges.push(['sol friable', { x1: c.x, x2: c.x + (c.w || 64), surfaceY: c.y }]);
    for (const [nom, r] of pieges) {
      if (r.x1 == null || r.x2 == null) continue;
      const y = r.surfaceY ?? sol((r.x1 + r.x2) / 2);
      m.push({ cat: 'dangers', forme: 'piege', x: (r.x1 + r.x2) / 2, y: y - 20, ligne: [r.x1, r.x2, y - 20], nom, detail: `x ${r.x1}-${r.x2}` });
    }
    for (const w of d.webs || []) if (w && w.x != null) m.push({ cat: 'dangers', forme: 'piege', x: w.x, y: w.y ?? sol(w.x) - 30, nom: 'toile', detail: '' });

    // Entrées et point de départ.
    for (const e of d.entries || []) {
      if (!e) continue;
      m.push({ cat: 'passages', forme: 'entree', x: e.x, y: (e.y ?? sol(e.x)), nom: `entrée ${e.id}`, detail: [e.edge ? `bord ${bordNom(e.edge)}` : 'point', e.from != null || e.to != null ? `de ${e.from ?? '…'} à ${e.to ?? '…'}` : ''].filter(Boolean).join(' · '), source: e });
    }
    if (d.playerSpawn && d.playerSpawn.x != null) m.push({ cat: 'passages', forme: 'depart', x: d.playerSpawn.x, y: d.playerSpawn.y ?? sol(d.playerSpawn.x), nom: 'départ par défaut (playerSpawn)', detail: '' });

    for (const k of m) {
      k.zone = z.id;
      if (!k.detail) k.detail = '';
    }
  }

  function bordNom(edge) {
    return { left: 'gauche', right: 'droit', top: 'haut', bottom: 'bas' }[edge] || edge;
  }

  // Géométrie d'une sortie (px de la zone) : segment du passage + point d'ancrage du trait.
  function geometrieSortie(z, exit) {
    const b = z.box;
    if (exit.edge === 'left' || exit.edge === 'right') {
      const x = exit.edge === 'left' ? 0 : b.w;
      if (exit.from == null && exit.to == null) {
        // Tout le bord : on ancre le trait au sol près du bord.
        const s = surfaceY(z, exit.edge === 'left' ? 32 : b.w - 32) ?? Math.min(448, b.bottom);
        return { seg: [x, b.top, x, b.bottom], ax: x, ay: s - 40 };
      }
      // `to` seul = altitude des pieds ; l'ouverture fait ~170 px (cf. edgeExit…, LevelKit.js).
      const to = exit.to ?? b.bottom;
      const from = exit.from ?? to - 170;
      return { seg: [x, from, x, to], ax: x, ay: exit.from == null ? to - 40 : (from + to) / 2 };
    }
    if (exit.edge === 'top' || exit.edge === 'bottom') {
      const y = exit.edge === 'top' ? b.top : b.bottom;
      const from = exit.from ?? 0;
      const to = exit.to ?? b.w;
      return { seg: [from, y, to, y], ax: (from + to) / 2, ay: y };
    }
    // Ancienne sortie « porte » : { x, y, height }.
    const x = exit.x ?? b.w;
    const y = exit.y ?? (surfaceY(z, x) ?? 448) - 60;
    const h = exit.height || 120;
    return { seg: [x, y - h / 2, x, y + h / 2], ax: x, ay: y };
  }

  // ---------------------------------------------------------------------
  // Le monde entier
  // ---------------------------------------------------------------------
  function construire(infos) {
    const demo = L('DEMO_ZONES') || [];
    const legacy = L('LEGACY_TEST_ZONES') || [];
    const legacyNoms = {};
    for (const l of legacy) legacyNoms[l.scene] = l.name;

    const zones = [];
    const parId = {};
    const ajouter = (id, entree) => {
      if (parId[id]) return;
      const z = lireZone(id, entree, legacyNoms);
      if (!z) return;
      zones.push(z);
      parId[id] = z;
    };
    for (const e of demo) ajouter(e.zone, e);
    for (const id of infos.zonesData || []) ajouter(id, null);

    // Catégorie : chemin principal, facultative, hors chemin (tests, monde spirituel).
    const principal = new Set(PARCOURS.map((p) => p.zone));
    const demoIds = new Set(demo.map((e) => e.zone));
    PARCOURS.forEach((p, i) => { if (parId[p.zone]) parId[p.zone].etapes.push(i + 1); });
    const chapitres = L('MENU_CHAPTERS') || [];
    for (const z of zones) {
      const etape = PARCOURS.find((p) => p.zone === z.id);
      z.optionnelle = !!(etape && etape.optionnelle);
      z.notesParcours = PARCOURS.filter((p) => p.zone === z.id).map((p) => p.note);
      if (principal.has(z.id)) z.categorie = 'principal';
      else if (demoIds.has(z.id) && chapitres.some((c) => (c.zones || []).includes(z.id))) z.categorie = 'facultatif';
      else z.categorie = 'test';
      z.chapitre = chapitres.findIndex((c) => (c.zones || []).includes(z.id));
      z.acte = z.chapitre >= 0 ? chapitres[z.chapitre].act : null;
      z.acces = ACCES[z.id] || null;
      z.accesDeduit = [];
      marqueursDe(z);
    }

    const parScene = {};
    for (const z of zones) parScene[z.scene] = z;

    // Passages.
    const passages = [];
    const alertes = [];
    // `type` : les contrôles du même type sont regroupés par zone dans le panneau.
    const alerte = (niveau, zone, x, y, texte, type = null) => alertes.push({ niveau, zone, x, y, texte, type });
    const ajouterPassage = (z, exit, type, condition) => {
      if (!exit || !exit.targetScene) return;
      const g = geometrieSortie(z, exit);
      const cible = parScene[exit.targetScene] || null;
      const enterId = exit.data && exit.data.enterId;
      const p = { de: z.id, vers: cible ? cible.id : null, sceneCible: exit.targetScene, enterId: enterId || null, type, condition: condition || conditionTexte(exit), seg: g.seg, ax: g.ax, ay: g.ay, edge: exit.edge || null, exit, entree: null };
      if (!cible) {
        if (!/EndScreen|Title|Prologue/.test(exit.targetScene)) alerte('alerte', z.id, g.ax, g.ay, `sortie vers une scène inconnue : ${exit.targetScene}`);
      } else {
        const entrees = cible.data.entries || [];
        p.entree = enterId ? entrees.find((e) => e && e.id === enterId) || null : null;
        if (enterId && !p.entree) alerte('alerte', z.id, g.ax, g.ay, `sortie vers ${cible.id} : l'entrée « ${enterId} » n'existe pas dans la zone d'arrivée`);
        if (!enterId) alerte('info', z.id, g.ax, g.ay, `sortie vers ${cible.id} sans enterId (arrivée au point de départ par défaut)`);
        const sp = cible.data.playerSpawn || { x: 100, y: 400 };
        p.bx = p.entree ? p.entree.x : sp.x;
        p.by = p.entree ? (p.entree.y ?? 400) : (sp.y ?? 400);
        cible.entrants.push(p);
      }
      z.sorties.push(p);
      passages.push(p);
    };
    for (const z of zones) {
      const d = z.data;
      for (const e of d.exits || []) ajouterPassage(z, e, 'bord');
      if (d.exit) ajouterPassage(z, d.exit, 'bord');
      // Sorties ouvertes après un boss (lues dans la donnée).
      const apres = d.kainatiArena && d.kainatiArena.exitsAfterVictory;
      for (const e of apres || []) ajouterPassage(z, e, 'bord', 'après la victoire sur Kainati');
    }
    for (const s of PASSAGES_SCRIPT) {
      const z = parId[s.de];
      if (!z) continue;
      // Déjà dans les données (le jeu a changé) : on ne double pas le trait.
      if (z.sorties.some((p) => p.sceneCible === s.scene && p.enterId === s.enterId && p.type === 'bord')) continue;
      ajouterPassage(z, { x: s.x, y: s.y, height: 100, targetScene: s.scene, data: { enterId: s.enterId } }, 'script', s.texte);
    }

    // Accès déduit des données : `requires` des sorties, cassables posés sur une
    // sortie haute ou basse, sorties ouvertes après un boss.
    for (const p of passages) {
      const cible = p.vers && parId[p.vers];
      if (!cible) continue;
      const z = parId[p.de];
      const bouts = [];
      if (p.condition) bouts.push(p.condition);
      if (p.edge === 'top' || p.edge === 'bottom') {
        for (const k of z.marqueurs) {
          if (k.forme !== 'cassable') continue;
          const xs = k.cases.map((c) => c[0] * CASE);
          const x0 = Math.min(...xs);
          const x1 = Math.max(...xs) + CASE;
          if (x1 > p.seg[0] && x0 < p.seg[2]) bouts.push(`${k.nom}${k.source.requires ? ` (${conditionTexte(k.source)})` : ''}`);
        }
      }
      if (bouts.length) cible.accesDeduit.push({ depuis: z.id, texte: bouts.join(' ; '), type: p.type });
    }

    // ------------------------------- Contrôles -------------------------------
    const visibles = zones.filter((z) => z.categorie !== 'test');
    // Zones jamais atteintes depuis le bosquet.
    const atteintes = new Set(['bosquet']);
    for (let change = true; change;) {
      change = false;
      for (const p of passages) {
        if (p.vers && atteintes.has(p.de) && !atteintes.has(p.vers)) { atteintes.add(p.vers); change = true; }
      }
    }
    for (const z of visibles) {
      if (!atteintes.has(z.id)) alerte('alerte', z.id, z.box.w / 2, 300, 'zone injoignable : aucun passage n\'y mène depuis le bosquet');
      // Entrées jamais visées.
      for (const e of z.data.entries || []) {
        if (!e) continue;
        if (!z.entrants.some((p) => p.enterId === e.id)) alerte('info', z.id, e.x, e.y ?? 400, `entrée « ${e.id} » visée par aucune sortie connue (script, sauvegarde ou reste d'un ancien passage ?)`, 'entree');
        if (estPlein(z, e.x, (e.y ?? 400) - 10)) alerte('alerte', z.id, e.x, e.y ?? 400, `entrée « ${e.id} » : le point d'arrivée est dans le sol`);
      }
      // Passage à sens unique (information).
      for (const p of z.sorties) {
        if (!p.vers || p.type !== 'bord') continue;
        const retour = parId[p.vers].sorties.some((q) => q.vers === z.id);
        if (!retour) alerte('info', z.id, p.ax, p.ay, `passage à sens unique vers ${p.vers} (aucun retour)`);
      }
      // Éléments dans le sol ou hors de la zone.
      for (const k of z.marqueurs) {
        if (['ennemi', 'boss', 'pnj', 'feu', 'coffre', 'coeur', 'objet', 'papillon', 'totem', 'reprise'].includes(k.forme)) {
          if (estPlein(z, k.x, k.y)) alerte('alerte', z.id, k.x, k.y, `${k.nom} : placé dans une case de sol`);
          if (k.x < 0 || k.x > z.box.w) alerte('alerte', z.id, k.x, k.y, `${k.nom} : hors de la zone (x ${k.x})`);
        }
        // Liane : doit pendre sous une case solide (VAGUE3_DESIGN § 0).
        if (k.forme === 'liane' && !estPlein(z, k.x, k.y - 1) && !estPlein(z, k.x, k.y - 40) && !estPlein(z, k.x, k.y - 72)) {
          alerte('info', z.id, k.x, k.y, 'liane : aucune case solide juste au-dessus de l\'attache (branche courbe ? à vérifier)');
        }
      }
      // Règle du 2026-11-09 : deux cases de sol ne se touchent jamais par un seul coin.
      const coins = [];
      for (const c of z.cells) {
        const [gx, gy] = c;
        for (const dx of [1, -1]) {
          if (z.plein.has(cle(gx + dx, gy + 1)) && !z.plein.has(cle(gx + dx, gy)) && !z.plein.has(cle(gx, gy + 1))) coins.push([dx > 0 ? gx + 1 : gx, gy + 1]);
        }
      }
      for (const [cx, cy] of coins) alerte('alerte', z.id, cx * CASE, cy * CASE, `deux cases de sol se touchent par un seul coin (case ${cx}, ${cy}) : ajouter la case du coin`, 'coin');
    }
    // Table des passages de script : un `goto` de cinématique que la table ne connaît pas.
    const cutscenes = L('CUTSCENES') || {};
    const vus = new Set();
    const fouiller = (nom, v, prof) => {
      if (!v || prof > 6) return;
      if (Array.isArray(v)) { for (const e of v) fouiller(nom, e, prof + 1); return; }
      if (typeof v !== 'object') return;
      if (v.goto && typeof v.goto === 'object' && v.goto.scene) {
        const cible = parScene[v.goto.scene] || parId[v.goto.scene];
        const enterId = v.goto.data && v.goto.data.enterId;
        const k = `${v.goto.scene}|${enterId}`;
        if (cible && !vus.has(k)) {
          vus.add(k);
          if (!passages.some((p) => p.vers === cible.id && p.enterId === enterId)) alerte('info', cible.id, cible.box.w / 2, 300, `cinématique « ${nom} » : passage vers ${cible.id} (${enterId}) absent de la table PASSAGES_SCRIPT (tools/carte/monde.js)`);
        }
      }
      for (const e of Object.values(v)) if (e && typeof e === 'object') fouiller(nom, e, prof + 1);
    };
    for (const [nom, pas] of Object.entries(cutscenes)) if (Array.isArray(pas)) fouiller(nom, pas, 0);

    // Paires de zones qui se suivent sur le chemin principal (étapes optionnelles
    // sautées) : leurs passages sont dessinés en or, les autres en violet.
    const suite = PARCOURS.filter((p) => !p.optionnelle).map((p) => p.zone);
    const paires = new Set();
    for (let i = 0; i + 1 < suite.length; i++) { paires.add(`${suite[i]}>${suite[i + 1]}`); paires.add(`${suite[i + 1]}>${suite[i]}`); }
    for (const p of passages) p.principal = paires.has(`${p.de}>${p.vers}`);

    return { zones, parId, parScene, passages, alertes, chapitres };
  }

  // ---------------------------------------------------------------------
  // Placement des zones dans le plan
  // ---------------------------------------------------------------------
  // `mode` : 'monde' = disposition de la carte du jeu (MAP_ZONE_LAYOUT,
  // MapScene.js) ; 'actes' = la même, l'acte II glissé sous l'acte I (le monde
  // fait 40 000 px de long pour 5 000 de haut : en deux bandes, tout est deux
  // fois plus gros à l'écran). Les zones hors chemin vont sur une rangée à part.
  function placer(monde, mode) {
    const layout = L('MAP_ZONE_LAYOUT') || {};
    const places = {};
    const histoire = monde.zones.filter((z) => z.region !== 'test');
    for (const z of histoire) if (layout[z.id]) places[z.id] = { x: layout[z.id].x, y: layout[z.id].y };
    // Zone absente de la table : même repli que la carte du jeu (mapAutoPlace).
    if (typeof window.mapAutoPlace === 'function') {
      try {
        window.mapAutoPlace(histoire.map((z) => ({ zone: z.id, data: z.data, box: z.box })), places);
      } catch (e) { /* repli plus bas */ }
    }
    const boite = (liste) => {
      let b = null;
      for (const z of liste) {
        const p = places[z.id];
        if (!p) continue;
        const r = { x0: p.x, x1: p.x + z.box.w, y0: p.y + z.box.top, y1: p.y + z.box.bottom };
        b = b ? { x0: Math.min(b.x0, r.x0), x1: Math.max(b.x1, r.x1), y0: Math.min(b.y0, r.y0), y1: Math.max(b.y1, r.y1) } : r;
      }
      return b;
    };
    const chemin = histoire.filter((z) => z.categorie !== 'test');
    if (mode === 'actes') {
      const a1 = boite(chemin.filter((z) => z.acte !== 'Acte II'));
      const a2 = boite(chemin.filter((z) => z.acte === 'Acte II'));
      if (a1 && a2) {
        const dx = a1.x0 - a2.x0;
        const dy = a1.y1 - a2.y0 + 900;
        for (const z of chemin) if (z.acte === 'Acte II' && places[z.id]) { places[z.id].x += dx; places[z.id].y += dy; }
      }
    }
    // Hors chemin (tests, monde spirituel) et zones sans place : une rangée en bas.
    const tout = boite(chemin) || { x0: 0, x1: 0, y0: 0, y1: 0 };
    let curseur = tout.x0;
    const yRangee = tout.y1 + 1600;
    for (const z of monde.zones) {
      if (z.categorie !== 'test' && places[z.id]) continue;
      places[z.id] = { x: curseur, y: yRangee - z.box.top };
      curseur += z.box.w + 700;
    }
    for (const z of monde.zones) { z.x = places[z.id].x; z.y = places[z.id].y; }

    // Contrôle : aucune boîte du chemin ne chevauche une autre.
    monde.alertes = monde.alertes.filter((a) => !a.placement);
    for (let i = 0; i < chemin.length; i++) {
      for (let j = i + 1; j < chemin.length; j++) {
        const a = chemin[i];
        const b = chemin[j];
        const ox = Math.min(a.x + a.box.w, b.x + b.box.w) - Math.max(a.x, b.x);
        const oy = Math.min(a.y + a.box.bottom, b.y + b.box.bottom) - Math.max(a.y + a.box.top, b.y + b.box.top);
        if (ox > 0 && oy > 0) monde.alertes.push({ placement: true, niveau: 'alerte', zone: a.id, x: a.box.w / 2, y: 300, texte: `la boîte de ${a.id} chevauche celle de ${b.id} sur la carte (${Math.round(ox)} × ${Math.round(oy)} px) : MAP_ZONE_LAYOUT à revoir` });
      }
    }
  }

  window.CarteMonde = { CASE, PARCOURS, ACCES, BESOINS, REGIONS, ENNEMIS, DRAPEAUX, construire, placer, surfaceY, surfaceSous, estPlein, bordNom, conditionTexte };
})();
