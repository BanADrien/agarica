// Éditeur de niveaux (v2) -- écriture d'une zone en JavaScript lisible.
//
// Une zone ouverte dans l'éditeur est l'objet DÉJÀ ÉVALUÉ du fichier
// `src/data/<zone>_data.js` (les `groundRow(...)` et les constantes y sont
// devenus des valeurs). À l'enregistrement, tout repart en littéral :
//   const NOM_DATA = {
//     // Titre de la zone …            <- un commentaire automatique par clé
//     zoneName: 'La forêt sombre',
//     groundCells: [
//       ...groundRow(0, 50, [7, 8]),   <- le sol reste écrit en rangées
//     ],
//   };
// Règle « rien de perdu » : TOUTES les clés ressortent, dans leur ordre
// d'origine, y compris celles que l'éditeur ne sait pas modifier. Avant tout
// envoi, le texte produit est réévalué et comparé à l'objet (cf.
// `EditeurEcriture.verifier`) : s'il diffère d'une virgule, rien n'est écrit.
const EditeurEcriture = (() => {
  'use strict';

  // Commentaire automatique écrit au-dessus de chaque clé (les commentaires
  // faits main sont remplacés : accepté par l'utilisateur, EDITEUR_V2_DESIGN.md).
  const COMMENTAIRES = {
    levelWidth: 'Taille de la zone (largeur, hauteur, haut du monde), en pixels.',
    zoneName: 'Titre affiché à l\'arrivée dans la zone, et son sous-titre.',
    background: 'Fond peint derrière la zone.',
    backgroundBaseline: 'Hauteur de la ligne de base du fond.',
    tileset: 'Jeu de tuiles du sol.',
    ambient: 'Ambiance : voile de couleur et obscurité.',
    look: 'Rendu de cohésion (réglages de couleur de la zone).',
    music: 'Musique de la zone.',
    ambience: 'Ambiance sonore de la zone.',
    xara: 'Compagnon : Xara absente de cette zone.',
    script: 'Script d\'histoire de la zone (src/story/).',
    helpText: 'Texte d\'aide de la zone.',
    decor: 'Décor automatique (arbres, plantes).',
    largeTrees: 'Grands arbres du fond.',
    foregroundPlants: 'Plantes de premier plan.',
    treesAtScreenBottom: 'Arbres du fond posés en bas de l\'écran.',
    avoidRanges: 'Bandes sans arbres ni plantes de premier plan.',
    undergrowthAvoid: 'Bandes sans sous-bois.',
    tallLevel: 'Zone en hauteur : la caméra suit vers le haut et le bas.',
    camera: 'Caméra de la zone.',
    skyReveal: 'Ciel qui se découvre en montant.',
    farLayers: 'Lointains peints (îles, nuages).',
    liquidFloor: 'Liquide ou brume au fond de la zone.',
    ambientLife: 'Petite vie d\'ambiance (lucioles, papillons).',
    fall: 'Chute dans le vide : ce qui arrive en tombant.',
    playerSpawn: 'Départ du joueur.',
    groundCells: 'Sol, par rangées : groundRow(première colonne, colonne de fin exclue, [rangées]).',
    groundBackCells: 'Sol de second plan (décor, sans collision).',
    water: 'Eau.',
    branches: 'Branches du grand arbre.',
    trunks: 'Troncs.',
    hiddenPlatforms: 'Plateformes cachées (révélées par le loup).',
    props: 'Décors posés.',
    enemies: 'Créatures hostiles.',
    animals: 'Animaux (décor vivant).',
    npcs: 'Personnages.',
    campfires: 'Feux de camp.',
    totems: 'Totems.',
    chests: 'Coffres.',
    treasures: 'Trésors à ramasser (cœurs, éclats).',
    butterflies: 'Papillons prisonniers.',
    pickups: 'Objets à ramasser.',
    breakables: 'Murs et sols cassables.',
    mossBlocks: 'Amas de mousse.',
    mossWalls: 'Murs de mousse.',
    vines: 'Lianes.',
    windCurrents: 'Courants d\'air.',
    tracks: 'Pistes du loup.',
    webs: 'Toiles d\'araignée.',
    lights: 'Lumières.',
    triggers: 'Déclencheurs d\'histoire.',
    checkpoints: 'Points de reprise.',
    exits: 'Sorties de la zone.',
    exit: 'Sortie de la zone (ancien format).',
    entries: 'Arrivées dans la zone.',
  };
  const COMMENTAIRE_INCONNU = 'Clé gardée telle quelle (l\'éditeur ne la modifie pas).';
  // Clés écrites à la suite de la précédente sans nouveau commentaire.
  const SANS_COMMENTAIRE = new Set(['levelHeight', 'levelTop', 'zoneSub']);
  const CLES_DE_SOL = new Set(['groundCells', 'groundBackCells']);
  const LARGEUR_LIGNE = 118;

  function estSimple(v) {
    return v === null || typeof v !== 'object';
  }

  function texteChaine(s) {
    // Guillemets simples (style du projet) à partir de la forme JSON.
    const json = JSON.stringify(s);
    return `'${json.slice(1, -1).replace(/\\"/g, '"').replace(/'/g, "\\'")}'`;
  }

  function texteNombre(n, cle) {
    if (!Number.isFinite(n) || Object.is(n, -0)) throw new Error(`nombre non enregistrable (${n})`);
    // Les couleurs restent lisibles : 0xRRGGBB.
    if (cle && /tint|color|couleur/i.test(cle) && Number.isInteger(n) && n >= 0 && n <= 0xffffff) {
      return `0x${n.toString(16).padStart(6, '0')}`;
    }
    return String(n);
  }

  function texteCle(k) {
    return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k) ? k : texteChaine(k);
  }

  // Valeur sur une seule ligne.
  function enLigne(v, cle) {
    if (v === null) return 'null';
    switch (typeof v) {
      case 'string': return texteChaine(v);
      case 'number': return texteNombre(v, cle);
      case 'boolean': return String(v);
      case 'object': break;
      default: throw new Error(`valeur non enregistrable (${typeof v})`);
    }
    if (Array.isArray(v)) return `[${v.map((x) => enLigne(x, cle)).join(', ')}]`;
    const parts = Object.keys(v).map((k) => `${texteCle(k)}: ${enLigne(v[k], k)}`);
    return parts.length ? `{ ${parts.join(', ')} }` : '{}';
  }

  // Valeur écrite à l'indentation `ind` : sur une ligne si elle tient, sinon
  // un élément (ou une clé) par ligne.
  function ecrireValeur(v, ind, cle) {
    if (estSimple(v)) return enLigne(v, cle);
    const court = enLigne(v, cle);
    if (court.length + ind.length <= LARGEUR_LIGNE) return court;
    const ind2 = `${ind}  `;
    if (Array.isArray(v)) {
      // Liste de valeurs simples (nombres…) : plusieurs par ligne.
      if (v.every(estSimple)) return `[\n${remplir(v.map((x) => enLigne(x, cle)), ind2)}\n${ind}]`;
      return `[\n${v.map((x) => `${ind2}${ecrireValeur(x, ind2, cle)},`).join('\n')}\n${ind}]`;
    }
    const lignes = Object.keys(v).map((k) => `${ind2}${texteCle(k)}: ${ecrireValeur(v[k], ind2, k)},`);
    return `{\n${lignes.join('\n')}\n${ind}}`;
  }

  function remplir(morceaux, ind) {
    const lignes = [];
    let cur = ind;
    for (const m of morceaux) {
      if (cur.length > ind.length && cur.length + m.length + 2 > LARGEUR_LIGNE) {
        lignes.push(cur.trimEnd());
        cur = ind;
      }
      cur += `${m}, `;
    }
    if (cur.trim()) lignes.push(cur.trimEnd());
    return lignes.join('\n');
  }

  function estCaseDeSol(c) {
    return Array.isArray(c) && c.length === 3 && Number.isInteger(c[0]) && Number.isInteger(c[1]) && typeof c[2] === 'string';
  }

  // Découpe la liste de cases, DANS SON ORDRE, en appels `groundRow` : chaque
  // appel redonne exactement les mêmes cases dans le même ordre (colonne par
  // colonne, puis rangée par rangée, comme groundRow dans LevelKit.js). Une
  // case qui n'a pas la forme [colonne, rangée, 'matière'] est écrite telle quelle.
  function morceauxDeSol(cells) {
    const out = [];
    let i = 0;
    while (i < cells.length) {
      const c = cells[i];
      if (!estCaseDeSol(c)) {
        out.push({ brut: c });
        i += 1;
        continue;
      }
      const [gx0, , mat] = c;
      const gys = [];
      let j = i;
      while (j < cells.length && estCaseDeSol(cells[j]) && cells[j][0] === gx0 && cells[j][2] === mat && !gys.includes(cells[j][1])) {
        gys.push(cells[j][1]);
        j += 1;
      }
      let cols = 1;
      for (;;) {
        const base = i + cols * gys.length;
        let ok = base + gys.length <= cells.length;
        for (let k = 0; ok && k < gys.length; k++) {
          const d = cells[base + k];
          ok = estCaseDeSol(d) && d[0] === gx0 + cols && d[1] === gys[k] && d[2] === mat;
        }
        if (!ok) break;
        cols += 1;
      }
      out.push({ gx0, gx1: gx0 + cols, gys, mat });
      i += cols * gys.length;
    }
    return out;
  }

  function ecrireSol(cells, ind) {
    if (!Array.isArray(cells)) return ecrireValeur(cells, ind);
    if (!cells.length) return '[]';
    const ind2 = `${ind}  `;
    const lignes = [];
    let bruts = [];
    const vider = () => {
      if (bruts.length) lignes.push(remplir(bruts.map((b) => enLigne(b)), ind2));
      bruts = [];
    };
    for (const m of morceauxDeSol(cells)) {
      if (m.brut !== undefined) { bruts.push(m.brut); continue; }
      vider();
      const mat = m.mat === 'dirt' ? '' : `, ${texteChaine(m.mat)}`;
      lignes.push(`${ind2}...groundRow(${m.gx0}, ${m.gx1}, [${m.gys.join(', ')}]${mat}),`);
    }
    vider();
    return `[\n${lignes.join('\n')}\n${ind}]`;
  }

  // Range des cases de sol en rangées propres (après une peinture) : par
  // matière, les mêmes plages de colonnes sur plusieurs rangées deviennent UN
  // appel groundRow. Sans doublon. L'ordre des cases change (le rendu du jeu
  // n'en dépend pas) ; un sol jamais retouché garde, lui, son ordre d'origine.
  function rangerSol(cells) {
    const parMatiere = new Map();
    const vues = new Set();
    for (const c of cells) {
      if (!Array.isArray(c) || !Number.isInteger(c[0]) || !Number.isInteger(c[1])) continue;
      const cle = `${c[0]},${c[1]}`;
      if (vues.has(cle)) continue;
      vues.add(cle);
      const mat = typeof c[2] === 'string' ? c[2] : 'dirt';
      if (!parMatiere.has(mat)) parMatiere.set(mat, new Map());
      const rangs = parMatiere.get(mat);
      if (!rangs.has(c[1])) rangs.set(c[1], []);
      rangs.get(c[1]).push(c[0]);
    }
    const out = [];
    for (const [mat, rangs] of parMatiere) {
      // plage "a,b" -> rangées qui ont exactement cette plage
      const plages = new Map();
      for (const gy of Array.from(rangs.keys()).sort((a, b) => a - b)) {
        const xs = rangs.get(gy).sort((a, b) => a - b);
        let a = xs[0];
        for (let i = 1; i <= xs.length; i++) {
          if (i < xs.length && xs[i] === xs[i - 1] + 1) continue;
          const k = `${a},${xs[i - 1] + 1}`;
          if (!plages.has(k)) plages.set(k, []);
          plages.get(k).push(gy);
          a = xs[i];
        }
      }
      const tri = Array.from(plages.entries()).map(([k, gys]) => {
        const [a, b] = k.split(',').map(Number);
        return { a, b, gys };
      }).sort((p, q) => p.gys[0] - q.gys[0] || p.a - q.a);
      for (const p of tri) {
        for (let gx = p.a; gx < p.b; gx++) for (const gy of p.gys) out.push([gx, gy, mat]);
      }
    }
    return out;
  }

  // Corps `{ … }` de la zone, clé par clé, dans l'ordre de l'objet.
  function ecrireObjetZone(data) {
    const lignes = ['{'];
    for (const k of Object.keys(data)) {
      const v = data[k];
      if (v === undefined) throw new Error(`clé « ${k} » sans valeur`);
      if (!SANS_COMMENTAIRE.has(k)) {
        const n = Array.isArray(v) && !CLES_DE_SOL.has(k) ? ` (${v.length})` : '';
        const c = COMMENTAIRES[k] || COMMENTAIRE_INCONNU;
        lignes.push(`  // ${c.replace(/\.$/, '')}${n}${c.endsWith('.') ? '.' : ''}`);
      }
      // Une liste d'éléments : toujours un élément par ligne (plus simple à relire).
      const elements = Array.isArray(v) && v.length > 0 && v.every((x) => x && typeof x === 'object' && !Array.isArray(x));
      let texte;
      if (CLES_DE_SOL.has(k)) texte = ecrireSol(v, '  ');
      else if (elements) texte = `[\n${v.map((x) => `    ${ecrireValeur(x, '    ', k)},`).join('\n')}\n  ]`;
      else texte = ecrireValeur(v, '  ', k);
      lignes.push(`  ${texteCle(k)}: ${texte},`);
    }
    lignes.push('}');
    return lignes.join('\n');
  }

  // Instruction complète, celle qui remplace `const NOM_DATA = {...};` dans le fichier.
  function ecrireInstruction(constante, data) {
    return `const ${constante} = ${ecrireObjetZone(data)};`;
  }

  // Égalité stricte, clé par clé et dans le même ordre ; renvoie null si égal,
  // sinon le chemin de la première différence.
  function difference(a, b, chemin = '') {
    if (a === b) return (a === 0 && !Object.is(a, b)) ? `${chemin} (zéro négatif)` : null;
    if (typeof a !== typeof b) return `${chemin} (type ${typeof a} / ${typeof b})`;
    if (typeof a === 'number') return Number.isNaN(a) && Number.isNaN(b) ? null : `${chemin} (${a} / ${b})`;
    if (a === null || b === null || typeof a !== 'object') return `${chemin} (${String(a)} / ${String(b)})`;
    if (Array.isArray(a) !== Array.isArray(b)) return `${chemin} (liste / objet)`;
    if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return `${chemin} (nature différente)`;
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    if (ka.length !== kb.length) return `${chemin} (${ka.length} / ${kb.length} éléments)`;
    for (let i = 0; i < ka.length; i++) {
      if (ka[i] !== kb[i]) return `${chemin}.${ka[i]} (clé ${ka[i]} / ${kb[i]})`;
      const d = difference(a[ka[i]], b[ka[i]], Array.isArray(a) ? `${chemin}[${ka[i]}]` : `${chemin}.${ka[i]}`);
      if (d) return d;
    }
    return null;
  }

  // Une valeur que l'éditeur sait garder sans perte : nombres finis, textes,
  // vrai/faux, null, listes et objets simples. Renvoie le chemin fautif, ou null.
  function nonEnregistrable(v, chemin = '') {
    if (v === null) return null;
    const t = typeof v;
    if (t === 'string' || t === 'boolean') return null;
    if (t === 'number') return Number.isFinite(v) && !Object.is(v, -0) ? null : `${chemin} (nombre ${v})`;
    if (t !== 'object') return `${chemin} (${t === 'function' ? 'fonction' : t})`;
    const proto = Object.getPrototypeOf(v);
    if (proto !== Object.prototype && proto !== Array.prototype) return `${chemin} (objet particulier)`;
    if (Array.isArray(v)) {
      for (let i = 0; i < v.length; i++) {
        if (!(i in v)) return `${chemin}[${i}] (trou dans la liste)`;
        const d = nonEnregistrable(v[i], `${chemin}[${i}]`);
        if (d) return d;
      }
      return null;
    }
    for (const k of Object.keys(v)) {
      const d = nonEnregistrable(v[k], chemin ? `${chemin}.${k}` : k);
      if (d) return d;
    }
    return null;
  }

  // Évalue un fichier de zone complet (ou une instruction seule) et rend la
  // valeur de `constante`. Les fonctions du jeu (groundRow…) sont celles de la page.
  function evaluer(texte, constante) {
    // eslint-disable-next-line no-new-func
    return (new Function(`${texte}\n;return ${constante};`))();
  }

  // Écrit puis relit : { texte } si l'aller-retour est exact, sinon { erreur }.
  function verifier(constante, data) {
    try {
      const fautif = nonEnregistrable(data);
      if (fautif) return { erreur: `valeur impossible à enregistrer : ${fautif}` };
      const texte = ecrireInstruction(constante, data);
      const d = difference(data, evaluer(texte, constante));
      if (d) return { erreur: `le texte écrit ne redonne pas la même zone : ${d}` };
      return { texte };
    } catch (e) {
      return { erreur: String(e && e.message ? e.message : e) };
    }
  }

  return { ecrireInstruction, ecrireObjetZone, difference, nonEnregistrable, evaluer, verifier, rangerSol, COMMENTAIRES };
})();
