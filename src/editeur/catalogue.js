// Éditeur de niveaux (v2) -- LE CATALOGUE : tout ce que l'éditeur sait montrer et régler.
//
// Ce fichier est une TABLE de données. Pour qu'un nouvel élément du jeu
// apparaisse dans l'éditeur, on ajoute une ligne ici, sans toucher au reste :
//   EDITEUR_ONGLETS   les onglets de la barre du haut ;
//   EDITEUR_GENRES    un « genre » par clé de zone (`props`, `enemies`…) : son nom
//                     en clair, sa géométrie (`geo`, cf. scene.js) et ses réglages ;
//   EDITEUR_ELEMENTS  les vignettes de la bande d'images : un élément posable =
//                     { genre, nom, image, modele (valeurs posées à la création) } ;
//   EDITEUR_OUTILS    les outils sans image (peindre le sol…), avec leur icône ;
//   EDITEUR_ZONE      les réglages de l'onglet Zone ;
//   EDITEUR_ICONES    les icônes dessinées (SVG en ligne).
//
// Réglages (`champs`) -- { cle, nom, type, … } :
//   type 'nombre' (min, max, pas) · 'curseur' (min, max, pas) · 'liste' (options
//   [{ v, nom }] ou fonction) · 'case' · 'sens' (gauche / droite) · 'texte' ·
//   'couleur' · 'contenu' (récompense d'un coffre).
//   `defaut` : valeur du jeu quand la clé est absente (affichée, jamais écrite
//   tant qu'on n'y touche pas) ; `pour: [types]` : réservé à ces `type`.
// Aucun nom de code n'est montré à l'écran : `nom` est toujours en français.

const EDITEUR_ONGLETS = [
  { id: 'terrain', nom: 'Terrain', icone: 'terrain' },
  { id: 'decors', nom: 'Décors', icone: 'arbre' },
  { id: 'creatures', nom: 'Créatures', icone: 'patte' },
  { id: 'objets', nom: 'Objets', icone: 'coffre' },
  { id: 'histoire', nom: 'Histoire', icone: 'bulle', bientot: true },
  { id: 'passages', nom: 'Passages', icone: 'porte', bientot: true },
  { id: 'zone', nom: 'Zone', icone: 'reglages' },
  { id: 'monde', nom: 'Monde', icone: 'monde', bientot: true },
];

// Images des tuiles dessinées à la main et des jeux des biomes (vignettes).
const EDITEUR_TUILES = [
  { v: '', nom: 'Terre et herbe', image: { textures: ['autotile-atlas-A2', 'autotile-dirt-t'] } },
  { v: 'tuiles_ecorce', nom: 'Écorce', image: { textures: ['tuiles_ecorce:autotile-dirt-t'] } },
  { v: 'tuiles_flottantes', nom: 'Îles flottantes', image: { textures: ['tuiles_flottantes:autotile-dirt-t'] } },
  { v: 'tuiles_corrompues', nom: 'Forêt corrompue', image: { textures: ['tuiles_corrompues:autotile-dirt-t'] } },
];

const EDITEUR_OUTILS = [
  { id: 'sol', onglet: 'terrain', groupe: 'Sol', nom: 'Peindre le sol', icone: 'pinceau', outil: 'peindre', couche: 'groundCells',
    aide: 'Clic glissé : peint le sol. Clic droit glissé : efface.' },
  { id: 'sol-gomme', onglet: 'terrain', groupe: 'Sol', nom: 'Effacer le sol', icone: 'gomme', outil: 'effacer', couche: 'groundCells',
    aide: 'Clic glissé : efface le sol.' },
  { id: 'fond', onglet: 'terrain', groupe: 'Sol', nom: 'Sol de second plan', icone: 'calques', outil: 'peindre', couche: 'groundBackCells',
    aide: 'Un sol sombre derrière le vrai sol : pur décor, on passe devant. Clic droit : efface.' },
  { id: 'fond-gomme', onglet: 'terrain', groupe: 'Sol', nom: 'Effacer le second plan', icone: 'gomme-calques', outil: 'effacer', couche: 'groundBackCells',
    aide: 'Clic glissé : efface le sol de second plan.' },
];

const EDITEUR_SENS = [{ v: 'left', nom: 'Gauche' }, { v: 'right', nom: 'Droite' }];
const EDITEUR_TYPES_PATROUILLE = ['loup', 'loupAlpha', 'corbeau', 'mousse_creature', 'singe_corrompu', 'crapaud_sauteur', 'crapaud_corrompu'];
const EDITEUR_TYPES_CRAPAUD = ['crapaud_sauteur', 'crapaud_piege', 'crapaud_corrompu'];

// Listes lues dans les tables du jeu au moment de l'affichage (toujours à jour).
const EditeurListes = {
  dialogues() {
    const ids = new Set([
      ...Object.keys(typeof DIALOGUES !== 'undefined' ? DIALOGUES : {}),
      ...Object.keys(typeof CUTSCENES !== 'undefined' ? CUTSCENES : {}),
    ]);
    return [{ v: '', nom: '(ne dit rien)' }, ...Array.from(ids).sort().map((v) => ({ v, nom: v.replace(/_/g, ' ') }))];
  },
  cinematiques() {
    const ids = Object.keys(typeof CUTSCENES !== 'undefined' ? CUTSCENES : {}).sort();
    return [{ v: '', nom: '(aucune)' }, ...ids.map((v) => ({ v, nom: v.replace(/_/g, ' ') }))];
  },
  boutiques() {
    const shops = typeof SHOPS !== 'undefined' ? SHOPS : {};
    return [{ v: '', nom: '(pas de boutique)' }, ...Object.keys(shops).map((v) => ({ v, nom: shops[v].name || v }))];
  },
  objets() {
    const info = typeof ITEM_INFO !== 'undefined' ? ITEM_INFO : {};
    return Object.keys(info).map((v) => ({ v, nom: info[v].name || v }));
  },
  scripts() {
    const ids = Object.keys(typeof ZONE_SCRIPTS !== 'undefined' ? ZONE_SCRIPTS : {}).sort();
    return [{ v: '', nom: '(aucun)' }, ...ids.map((v) => ({ v, nom: v.replace(/_/g, ' ') }))];
  },
  musiques() {
    const sons = typeof AUDIO_SFX !== 'undefined' ? AUDIO_SFX : {};
    return [{ v: '', nom: 'Celle du fond (automatique)' }, { v: false, nom: 'Silence' },
      ...Object.keys(sons).filter((k) => k.startsWith('mus_')).map((v) => ({ v, nom: v.replace(/^mus_/, '').replace(/_/g, ' ') }))];
  },
  fonds() {
    const items = typeof ITEM_MANIFEST !== 'undefined' ? ITEM_MANIFEST : {};
    return Object.keys(items).filter((k) => k.startsWith('fond_'));
  },
};

const EDITEUR_GENRES = {
  // ------------------------------------------------------------ Terrain
  water: {
    nom: 'Eau', geo: 'rectCoin', cles: { w: 'width', h: 'height' }, repere: 0x4aa8e0,
    champs: [
      { cle: 'width', nom: 'Largeur', type: 'nombre', min: 16, max: 6000, pas: 16 },
      { cle: 'height', nom: 'Hauteur', type: 'nombre', min: 16, max: 3000, pas: 16 },
    ],
  },
  branches: {
    nom: 'Branche', geo: 'branche',
    champs: [
      { cle: 'thickness', nom: 'Épaisseur', type: 'curseur', min: 24, max: 160, pas: 4, defaut: 56 },
      { cle: 'rows', nom: 'Rangées pleines', type: 'nombre', min: 1, max: 6, pas: 1, defaut: 1 },
      { cle: 'solid', nom: 'On marche dessus', type: 'case', defaut: true },
      { cle: 'attach', nom: 'Raccord au tronc', type: 'liste', defaut: 'none',
        options: [{ v: 'none', nom: 'Aucun' }, { v: 'left', nom: 'À gauche' }, { v: 'right', nom: 'À droite' }, { v: 'both', nom: 'Des deux côtés' }] },
      { cle: 'tip', nom: 'Bout effilé', type: 'liste',
        options: [{ v: 'none', nom: 'Aucun' }, { v: 'left', nom: 'À gauche' }, { v: 'right', nom: 'À droite' }, { v: 'both', nom: 'Des deux côtés' }] },
      { cle: 'tint', nom: 'Teinte (branche du fond)', type: 'couleur' },
    ],
  },
  trunks: {
    nom: 'Tronc', geo: 'tronc',
    champs: [
      { cle: 'scale', nom: 'Taille', type: 'curseur', min: 0.1, max: 1, pas: 0.05, defaut: 0.25 },
      { cle: 'top', nom: 'Haut', type: 'nombre', pas: 16 },
      { cle: 'bottom', nom: 'Bas', type: 'nombre', pas: 16 },
      { cle: 'base', nom: 'Avec son pied', type: 'case' },
      { cle: 'tint', nom: 'Teinte', type: 'couleur' },
    ],
  },
  hiddenPlatforms: {
    nom: 'Plateforme cachée', geo: 'cases', repere: 0xd9b27a,
    champs: [{ cle: 'w', nom: 'Largeur (cases)', type: 'nombre', min: 1, max: 40, pas: 1, defaut: 1 }],
  },
  // ------------------------------------------------------------ Décors
  props: {
    nom: 'Décor', geo: 'decor', distingue: ['type'],
    champs: [
      { cle: 'scale', nom: 'Taille', type: 'curseur', min: 0.02, max: 1.5, pas: 0.01, defaut: (el) => propDefaultScale(el.type) },
      { cle: 'flipX', nom: 'Retourné', type: 'case' },
      { cle: 'front', nom: 'Devant Agarica', type: 'case' },
      { cle: 'angle', nom: 'Penché (degrés)', type: 'nombre', min: -180, max: 180, pas: 1, defaut: 0 },
      { cle: 'hang', nom: 'Accroché sous un plafond', type: 'case' },
      { cle: 'free', nom: 'Libre (ne colle pas au sol)', type: 'case' },
    ],
  },
  // ------------------------------------------------------------ Créatures
  enemies: {
    nom: 'Créature', geo: 'creature', distingue: ['type'],
    champs: [
      { cle: 'hp', nom: 'Vie', type: 'nombre', min: 1, max: 30, pas: 1,
        pour: ['mousse_creature', 'singe_corrompu', 'crapaud_sauteur', 'crapaud_piege', 'crapaud_corrompu', 'mannequin'],
        defaut: (el) => ({ mousse_creature: 1, mannequin: 6 }[el.type] || 2) },
      { cle: 'facing', nom: 'Regarde', type: 'sens', pour: EDITEUR_TYPES_CRAPAUD, defaut: 'left' },
      { cle: 'patrolMinX', nom: 'Patrouille : de', type: 'nombre', pas: 8, pour: EDITEUR_TYPES_PATROUILLE, defaut: (el) => el.x - 150 },
      { cle: 'patrolMaxX', nom: 'Patrouille : à', type: 'nombre', pas: 8, pour: EDITEUR_TYPES_PATROUILLE, defaut: (el) => el.x + 150 },
      { cle: 'reach', nom: 'Portée de la langue', type: 'nombre', min: 40, max: 600, pas: 10, pour: EDITEUR_TYPES_CRAPAUD, defaut: 220 },
      { cle: 'diveDepth', nom: 'Profondeur du piqué', type: 'nombre', min: 40, max: 800, pas: 10, pour: ['corbeau'], defaut: 220 },
      { cle: 'diveSpeed', nom: 'Vitesse du piqué', type: 'nombre', min: 50, max: 1200, pas: 10, pour: ['corbeau'] },
      { cle: 'diveCooldown', nom: 'Pause entre deux piqués (ms)', type: 'nombre', min: 0, max: 20000, pas: 100, pour: ['corbeau'] },
      { cle: 'diveGroundedOnly', nom: 'Pique seulement Agarica au sol', type: 'case', pour: ['corbeau'] },
      { cle: 'eclats', nom: 'Éclats de lune lâchés', type: 'nombre', min: 0, max: 200, pas: 1 },
      { cle: 'heavy', nom: 'Gros (arrête la charge de l\'ours)', type: 'case' },
    ],
  },
  animals: {
    nom: 'Animaux', geo: 'animaux', distingue: ['type'],
    champs: [
      { cle: 'w', nom: 'Largeur du territoire', type: 'nombre', min: 40, max: 2000, pas: 10,
        defaut: (el) => ({ poissons: 200, papillons: 80 }[el.type] || 180) },
      { cle: 'h', nom: 'Hauteur', type: 'nombre', min: 20, max: 1000, pas: 10, pour: ['poissons'], defaut: 60 },
      { cle: 'count', nom: 'Nombre', type: 'nombre', min: 1, max: 30, pas: 1, pour: ['papillons'], defaut: 6 },
    ],
  },
  npcs: {
    nom: 'Personnage', geo: 'personnage', distingue: ['sprite', 'id'],
    champs: [
      { cle: 'facing', nom: 'Regarde', type: 'sens', defaut: 'right' },
      { cle: 'talk', nom: 'Ce qu\'il dit', type: 'liste', options: () => EditeurListes.dialogues() },
      { cle: 'shop', nom: 'Boutique', type: 'liste', options: () => EditeurListes.boutiques() },
      { cle: 'lookAtPlayer', nom: 'Se tourne vers Agarica', type: 'case', defaut: true },
      { cle: 'onProp', nom: 'Posé sur le décor sous ses pieds', type: 'case' },
      { cle: 'anim', nom: 'Pose', type: 'texte', defaut: 'idle' },
    ],
  },
  // ------------------------------------------------------------ Objets
  campfires: {
    nom: 'Feu de camp', geo: 'pieds', taille: [70, 64],
    champs: [{ cle: 'scale', nom: 'Taille', type: 'curseur', min: 0.05, max: 0.6, pas: 0.01, defaut: () => CAMPFIRE_SCALE }],
  },
  totems: {
    nom: 'Totem', geo: 'pieds', taille: [70, 120], distingue: ['flag'],
    champs: [
      { cle: 'message', nom: 'Message à l\'éveil', type: 'texte' },
      { cle: 'scale', nom: 'Taille', type: 'curseur', min: 0.1, max: 1, pas: 0.01, defaut: () => TOTEM_SCALE },
    ],
  },
  chests: {
    nom: 'Coffre', geo: 'pieds', taille: [56, 46],
    champs: [
      { cle: 'id', nom: 'Nom du coffre', type: 'texte' },
      { cle: 'contents', nom: 'Contenu', type: 'contenu' },
    ],
  },
  treasures: {
    nom: 'Trésor', geo: 'centre', taille: [40, 40],
    champs: [
      { cle: 'id', nom: 'Nom du trésor', type: 'texte' },
      { cle: 'contents', nom: 'Contenu', type: 'contenu' },
    ],
  },
  butterflies: {
    nom: 'Papillon prisonnier', geo: 'centre', taille: [56, 56], distingue: ['prison'], repere: 0xff9fc9,
    champs: [
      { cle: 'id', nom: 'Nom du papillon', type: 'texte' },
      { cle: 'prison', nom: 'Prison', type: 'liste', options: [{ v: 'toile', nom: 'Une toile' }, { v: 'cocon', nom: 'Un cocon suspendu' }] },
      { cle: 'fil', nom: 'Longueur du fil', type: 'nombre', min: 0, max: 600, pas: 4, pour: ['cocon'], pourCle: 'prison', defaut: 40 },
    ],
  },
  pickups: {
    nom: 'Objet à ramasser', geo: 'ramassable', taille: [40, 40], distingue: ['item'],
    champs: [
      { cle: 'item', nom: 'Objet', type: 'liste', options: () => EditeurListes.objets() },
      { cle: 'cutscene', nom: 'Scène jouée en le ramassant', type: 'liste', options: () => EditeurListes.cinematiques() },
    ],
  },
  breakables: {
    nom: 'Bloc cassable', geo: 'cassable', distingue: ['by'], repere: 0xd8ccf5,
    champs: [
      { cle: 'id', nom: 'Nom du bloc', type: 'texte' },
      { cle: 'by', nom: 'Cassé par', type: 'liste', options: [{ v: 'sword', nom: 'La dague (et l\'ours)' }, { v: 'bear', nom: 'L\'ours seulement' }] },
      { cle: 'hint', nom: 'Indice visible', type: 'liste', defaut: 'fissure',
        options: [{ v: 'fissure', nom: 'Une fissure' }, { v: 'mousse', nom: 'De la mousse' }, { v: 'poussiere', nom: 'De la poussière' }, { v: false, nom: 'Aucun' }] },
      { cle: 'hits', nom: 'Coups de dague', type: 'nombre', min: 1, max: 12, pas: 1, defaut: 3 },
      { cle: 'reward', nom: 'Récompense', type: 'contenu', facultatif: true },
    ],
  },
  mossBlocks: {
    nom: 'Amas de mousse', geo: 'mousse', hauteur: 96, repere: 0x5fae3a,
    champs: [
      { cle: 'w', nom: 'Largeur', type: 'nombre', min: 16, max: 1200, pas: 8, defaut: 96 },
      { cle: 'h', nom: 'Hauteur', type: 'nombre', min: 16, max: 1200, pas: 8, defaut: 96 },
    ],
  },
  mossWalls: {
    nom: 'Mur de mousse', geo: 'mousse', hauteur: 192, repere: 0x3e8a34,
    champs: [
      { cle: 'id', nom: 'Nom du mur', type: 'texte' },
      { cle: 'w', nom: 'Largeur', type: 'nombre', min: 16, max: 1200, pas: 8, defaut: 96 },
      { cle: 'h', nom: 'Hauteur', type: 'nombre', min: 16, max: 1200, pas: 8, defaut: 192 },
    ],
  },
  vines: {
    nom: 'Liane', geo: 'liane', repere: 0x8fdc6a,
    champs: [{ cle: 'length', nom: 'Longueur', type: 'curseur', min: 32, max: 640, pas: 8, defaut: 200 }],
  },
  windCurrents: {
    nom: 'Courant d\'air', geo: 'rectCoin', cles: { w: 'w', h: 'h' }, repere: 0x9fe6ff,
    champs: [
      { cle: 'w', nom: 'Largeur', type: 'nombre', min: 32, max: 2000, pas: 16 },
      { cle: 'h', nom: 'Hauteur', type: 'nombre', min: 32, max: 3000, pas: 16 },
      { cle: 'force', nom: 'Force', type: 'curseur', min: 100, max: 800, pas: 10, defaut: 320 },
    ],
  },
  tracks: {
    nom: 'Piste du loup', geo: 'ligneSol', repere: 0xffc890,
    champs: [{ cle: 'w', nom: 'Longueur', type: 'nombre', min: 32, max: 3000, pas: 16, defaut: 200 }],
  },
  webs: { nom: 'Toile d\'araignée', geo: 'toile', taille: [70, 22], champs: [] },
};

// Outils de l'onglet Terrain qui posent un élément (sans image du jeu : icône).
const EDITEUR_ELEMENTS_FIXES = [
  { id: 'eau', onglet: 'terrain', groupe: 'Eau et bois', nom: 'Eau', genre: 'water', icone: 'eau',
    modele: { width: 256, height: 128 }, aide: 'Agarica y nage, et devient pieuvre si elle a cette forme.' },
  { id: 'branche', onglet: 'terrain', groupe: 'Eau et bois', nom: 'Branche', genre: 'branches', icone: 'branche',
    modele: { attach: 'none', tip: 'both', thickness: 56 }, aide: 'Une branche du grand arbre, sur laquelle on marche. Tire ses deux bouts pour la régler.' },
  { id: 'tronc', onglet: 'terrain', groupe: 'Eau et bois', nom: 'Tronc', genre: 'trunks', icone: 'tronc',
    modele: { scale: 0.25, base: true }, aide: 'Un tronc du fond, sans collision.' },
  { id: 'plateforme-cachee', onglet: 'terrain', groupe: 'Eau et bois', nom: 'Plateforme cachée', genre: 'hiddenPlatforms', icone: 'cachee',
    modele: { w: 3 }, aide: 'Invisible, elle apparaît quand le loup s\'approche.' },

  { id: 'feu', onglet: 'objets', groupe: 'Repos et pouvoirs', nom: 'Feu de camp', genre: 'campfires', image: { textures: ['decor-campfire-0'] }, modele: {} },
  { id: 'totem-loup', onglet: 'objets', groupe: 'Repos et pouvoirs', nom: 'Totem du loup', genre: 'totems', image: { totem: 'wolf' },
    modele: { flag: 'hasWolfForm', message: 'Une nouvelle capacité s\'éveille en toi.' } },
  { id: 'totem-singe', onglet: 'objets', groupe: 'Repos et pouvoirs', nom: 'Totem du singe', genre: 'totems', image: { totem: 'monkey' },
    modele: { flag: 'hasMonkeyForm', message: 'Une nouvelle capacité s\'éveille en toi.' } },
  { id: 'totem-aigle', onglet: 'objets', groupe: 'Repos et pouvoirs', nom: 'Totem de l\'aigle', genre: 'totems', image: { totem: 'eagle' },
    modele: { flag: 'hasEagleForm', message: 'Une nouvelle capacité s\'éveille en toi.' } },
  { id: 'totem-pieuvre', onglet: 'objets', groupe: 'Repos et pouvoirs', nom: 'Totem de la pieuvre', genre: 'totems', image: { totem: 'octopus' },
    modele: { flag: 'hasOctopusForm', message: 'Une nouvelle capacité s\'éveille en toi.' } },

  { id: 'coffre', onglet: 'objets', groupe: 'Trésors', nom: 'Coffre', genre: 'chests', image: { objet: 'coffre_ferme' },
    modele: { id: 'coffre', contents: { eclats: 20 } }, numerote: 'id' },
  { id: 'coeur', onglet: 'objets', groupe: 'Trésors', nom: 'Cœur', genre: 'treasures', image: { objet: 'coeur_entier' },
    modele: { id: 'coeur', contents: { coeur: true } }, numerote: 'id', correspond: (el) => !!(el.contents && el.contents.coeur) },
  { id: 'eclats', onglet: 'objets', groupe: 'Trésors', nom: 'Éclats de lune', genre: 'treasures', image: { objet: 'eclat_lune' },
    modele: { id: 'eclats', contents: { eclats: 10 } }, numerote: 'id', correspond: (el) => !(el.contents && el.contents.coeur) },
  { id: 'papillon-toile', onglet: 'objets', groupe: 'Trésors', nom: 'Papillon dans une toile', genre: 'butterflies', icone: 'papillon',
    modele: { id: 'papillon', prison: 'toile' }, numerote: 'id' },
  { id: 'papillon-cocon', onglet: 'objets', groupe: 'Trésors', nom: 'Papillon dans un cocon', genre: 'butterflies', icone: 'cocon',
    modele: { id: 'papillon', prison: 'cocon' }, numerote: 'id' },

  { id: 'cassable-dague', onglet: 'objets', groupe: 'Obstacles', nom: 'Bloc cassable (dague)', genre: 'breakables', icone: 'cassable',
    modele: { id: 'bloc', by: 'sword', hint: 'fissure' }, numerote: 'id', aide: 'Un morceau de sol qui se casse : peins d\'abord le sol, puis pose le bloc dessus.' },
  { id: 'cassable-ours', onglet: 'objets', groupe: 'Obstacles', nom: 'Bloc cassable (ours)', genre: 'breakables', icone: 'cassable-ours',
    modele: { id: 'bloc', by: 'bear', hint: 'fissure' }, numerote: 'id', aide: 'Un morceau de sol que seul l\'ours casse : peins d\'abord le sol, puis pose le bloc dessus.' },
  { id: 'amas-mousse', onglet: 'objets', groupe: 'Obstacles', nom: 'Amas de mousse', genre: 'mossBlocks', image: { objet: 'mousse_amas_intact' },
    modele: { w: 96, h: 96 }, aide: 'Bouche le passage ; le fracas de l\'ours le détruit.' },
  { id: 'mur-mousse', onglet: 'objets', groupe: 'Obstacles', nom: 'Mur de mousse', genre: 'mossWalls', image: { objet: 'mousse_mur' },
    modele: { id: 'mur', w: 96, h: 192 }, numerote: 'id', aide: 'S\'ouvre avec le répulsif de Morgat.' },
  { id: 'toile', onglet: 'objets', groupe: 'Obstacles', nom: 'Toile d\'araignée', genre: 'webs', image: { textures: ['web-placeholder'], icone: 'toile' }, modele: {},
    aide: 'Ralentit Agarica, sauf en loup.' },

  { id: 'liane', onglet: 'objets', groupe: 'Parcours', nom: 'Liane', genre: 'vines', image: { objet: 'liane' }, modele: { length: 200 },
    aide: 'Le singe s\'y accroche. Tire le bas de la liane pour l\'allonger.' },
  { id: 'courant', onglet: 'objets', groupe: 'Parcours', nom: 'Courant d\'air', genre: 'windCurrents', image: { objet: 'courant_air', icone: 'vent' },
    modele: { w: 160, h: 320, force: 320 }, aide: 'Porte l\'aigle qui plane vers le haut.' },
  { id: 'piste', onglet: 'objets', groupe: 'Parcours', nom: 'Piste du loup', genre: 'tracks', icone: 'empreintes', modele: { w: 192 },
    aide: 'Des empreintes que seul le loup voit.' },
];

// Créatures hostiles : `type` du jeu, nom en clair, image.
const EDITEUR_CREATURES = [
  { type: 'crapaud', nom: 'Crapaud', image: { textures: ['crapaud-0'] }, groupe: 'Ennemis' },
  { type: 'loup', nom: 'Loup sanguinaire', image: { manifeste: 'loup_sanguinaire', anim: 'patrol' }, groupe: 'Ennemis' },
  { type: 'araignee', nom: 'Araignée', image: { manifeste: 'araignee', anim: 'idle' }, groupe: 'Ennemis' },
  { type: 'corbeau', nom: 'Corbeau', image: { textures: ['piaf-fly-0'] }, groupe: 'Ennemis' },
  { type: 'mousse_creature', nom: 'Créature de mousse', image: { manifeste: 'mousse_creature', anim: 'idle' }, groupe: 'Ennemis' },
  { type: 'singe_corrompu', nom: 'Singe corrompu', image: { manifeste: 'singe_corrompu', anim: 'idle' }, groupe: 'Ennemis' },
  { type: 'crapaud_sauteur', nom: 'Crapaud sauteur', image: { crapaud: 'crapaud_sauteur' }, groupe: 'Ennemis' },
  { type: 'crapaud_piege', nom: 'Crapaud-piège', image: { crapaud: 'crapaud_piege' }, groupe: 'Ennemis' },
  { type: 'crapaud_corrompu', nom: 'Crapaud corrompu', image: { crapaud: 'crapaud_corrompu' }, groupe: 'Ennemis', cache: true },
  { type: 'mannequin', nom: 'Mannequin d\'entraînement', image: { mannequin: true }, groupe: 'Ennemis' },
  { type: 'loupAlpha', nom: 'Loup alpha', image: { textures: ['loup-run-0'] }, groupe: 'Boss' },
  { type: 'ghilt', nom: 'Ghil\'t', image: { manifeste: 'ghilt', anim: 'idle' }, groupe: 'Boss' },
];

const EDITEUR_ANIMAUX = [
  { type: 'cochons', nom: 'Bébés cochons', image: { manifeste: 'cochon_bebe_rose', anim: 'idle' }, modele: { w: 180 } },
  { type: 'poissons', nom: 'Poissons', image: { manifeste: 'poisson', anim: 'idle' }, modele: { w: 200, h: 60 } },
  { type: 'papillons', nom: 'Papillons', image: { manifeste: 'papillon', anim: 'idle' }, modele: { count: 6, w: 80 } },
];

// Personnages : identifiant de la feuille du jeu, nom en clair.
const EDITEUR_PERSONNAGES = [
  { id: 'xara_extra', nom: 'Xara', modele: { id: 'xara', sprite: 'xara_extra' } },
  { id: 'pere_chef', nom: 'Le père d\'Agarica' },
  { id: 'amanite', nom: 'Amanite' },
  { id: 'habitant_druide', nom: 'Druide du bosquet' },
  { id: 'habitant_porteur', nom: 'Porteur du bosquet' },
  { id: 'habitant_garde', nom: 'Garde du bosquet' },
  { id: 'geralt', nom: 'Geralt' },
  { id: 'clak', nom: 'Clak' },
  { id: 'morgat', nom: 'Morgat' },
  { id: 'kainati', nom: 'Kainati' },
  { id: 'kainati_esprit', nom: 'Kainati (esprit)' },
  { id: 'ghilt', nom: 'Ghil\'t' },
  { id: 'ghilt_gueri', nom: 'Ghil\'t guéri' },
  { id: 'marchand', nom: 'Marchand de lune', modele: { id: 'marchand', shop: 'marchand_lune' } },
  { id: 'tamarin', nom: 'Tamarin' },
  { id: 'tika', nom: 'Tika' },
  { id: 'pepin', nom: 'Pépin' },
  { id: 'ecaille', nom: 'Écaille' },
];

// Noms en clair des biomes de décors (clés de DECOR_SECTIONS) et des décors
// dont le nom de fichier est en anglais ou trop court.
const EDITEUR_BIOMES = {
  bosquet: 'Bosquet', foret_sombre: 'Forêt sombre', grand_arbre: 'Grand arbre', grand_arbre_tronc: 'Tronc du grand arbre',
  foret_flottante: 'Forêt flottante', foret_corrompue: 'Forêt corrompue', hutte_morgat: 'Hutte de Morgat',
  decor: 'Mousses et sols', objet: 'Petits objets', rocher: 'Rochers',
};
// Fond de zone -> biome de décors proposé en premier.
const EDITEUR_BIOME_DU_FOND = {
  fond_bosquet: 'bosquet', fond_foret_sombre: 'foret_sombre', fond_grand_arbre: 'grand_arbre',
  fond_foret_flottante: 'foret_flottante', fond_foret_corrompue: 'foret_corrompue', fond_arene_ghilt: 'foret_corrompue',
  fond_trou_sombre: 'foret_corrompue',
};
const EDITEUR_NOMS_DECORS = {
  bosquet_grand_arbre: 'Grand arbre', bosquet_arbre: 'Arbre', bosquet_arbre_2: 'Arbre (2)', bosquet_grove: 'Trois arbres (ancien)',
  bosquet_statue_hooded: 'Statue à capuche', bosquet_standing_stone: 'Pierre dressée', bosquet_lamp_post: 'Lampadaire',
  bosquet_banner_tree: 'Arbre à bannière', bosquet_bush_round: 'Buisson rond', bosquet_bush_flowering: 'Buisson fleuri',
  bosquet_mossy_rock: 'Rocher moussu', bosquet_signpost: 'Panneau', bosquet_fence: 'Clôture', bosquet_cart: 'Charrette',
  bosquet_crates: 'Caisses', bosquet_well: 'Puits', bosquet_antler_totem: 'Totem à bois', bosquet_tree_stump: 'Souche',
  bosquet_log_pile: 'Tas de bûches', bosquet_bench: 'Banc', bosquet_barrels: 'Tonneaux', bosquet_cabane_arbre: 'Cabane dans l\'arbre',
  bosquet_hutte_mousse: 'Hutte de mousse', bosquet_hutte_paille: 'Hutte de paille', bosquet_cottage: 'Chaumière', bosquet_tour: 'Tour',
  bosquet_tente: 'Tente', bosquet_muraille_tour: 'Muraille : tour', bosquet_muraille_pan: 'Muraille : pan',
  bosquet_muraille_pan_2: 'Muraille : pan (2)', bosquet_muraille_tour_2: 'Muraille : tour (2)', bosquet_muraille_porte: 'Muraille : porte',
  foret_sombre_souche_champignons: 'Souche aux champignons', foret_sombre_rocher_mousse: 'Rocher moussu',
  foret_sombre_champignons_lumineux: 'Champignons lumineux', foret_sombre_racine_arche: 'Arche de racines',
  foret_sombre_buisson_epineux: 'Buisson épineux', foret_sombre_tronc_couche: 'Tronc couché', foret_sombre_fougere_sombre: 'Fougère sombre',
  foret_sombre_toile_araignee: 'Toile d\'araignée', foret_sombre_mare_bord: 'Bord de mare', foret_sombre_pierre_runique: 'Pierre runique',
  foret_sombre_fleur_corniche: 'Fleur de corniche',
  grand_arbre_racine_tunnel: 'Tunnel de racines', grand_arbre_champignon_etagere: 'Champignon étagère', grand_arbre_nid_singe: 'Nid de singe',
  grand_arbre_tas_pierres: 'Tas de pierres', grand_arbre_morceaux_ecorce: 'Morceaux d\'écorce', grand_arbre_lanterne_lucioles: 'Lanterne à lucioles',
  grand_arbre_statue_simien: 'Statue du singe', grand_arbre_rideau_lianes: 'Rideau de lianes', grand_arbre_trou_tronc: 'Trou dans le tronc',
  grand_arbre_autel_singe: 'Autel du singe',
  grand_arbre_tronc_paroi_ecorce: 'Paroi d\'écorce', grand_arbre_tronc_paroi_noeud: 'Paroi à nœud', grand_arbre_tronc_branche_courte: 'Branche courte',
  grand_arbre_tronc_branche_longue: 'Branche longue', grand_arbre_tronc_escalier_racines: 'Escalier de racines',
  grand_arbre_tronc_fenetre_lune: 'Fenêtre de lune', grand_arbre_tronc_lianes_hautes: 'Hautes lianes',
  grand_arbre_tronc_champignons_lumineux: 'Champignons lumineux', grand_arbre_tronc_seve_corrompue: 'Sève corrompue',
  grand_arbre_tronc_corniche_mousse: 'Corniche de mousse',
  foret_flottante_ile_petite: 'Petite île', foret_flottante_ile_moyenne: 'Île moyenne', foret_flottante_rocher_flottant: 'Rocher flottant',
  foret_flottante_nuage: 'Nuage', foret_flottante_arbre_jeune: 'Jeune arbre', foret_flottante_pont_corde: 'Pont de corde',
  foret_flottante_tente_geralt: 'Tente de Geralt', foret_flottante_panneau_geralt: 'Panneau de Geralt',
  foret_flottante_pissenlit_geant: 'Pissenlit géant', foret_flottante_fleurs_hautes: 'Hautes fleurs',
  foret_corrompue_arbre_malade: 'Arbre malade', foret_corrompue_souche_corrompue: 'Souche corrompue', foret_corrompue_pustule_mousse: 'Pustule de mousse',
  foret_corrompue_racine_tordue: 'Racine tordue', foret_corrompue_os_creature: 'Os de créature', foret_corrompue_cocon_mousse: 'Cocon de mousse',
  foret_corrompue_champignon_toxique: 'Champignon toxique', foret_corrompue_rocher_fissure: 'Rocher fissuré',
  foret_corrompue_pilier_arene: 'Pilier de l\'arène', foret_corrompue_arche_arene: 'Arche de l\'arène', foret_corrompue_pierre_symbole: 'Pierre au symbole',
  hutte_morgat_hutte_morgat: 'Hutte de Morgat', hutte_morgat_chaudron: 'Chaudron', hutte_morgat_etagere_bocaux: 'Étagère à bocaux',
  hutte_morgat_table_herbes: 'Table aux herbes', hutte_morgat_sechoir_plantes: 'Séchoir à plantes', hutte_morgat_lanterne_papillons: 'Lanterne aux papillons',
  hutte_morgat_panier_plantes: 'Panier de plantes', hutte_morgat_tapis_rond: 'Tapis rond', hutte_morgat_pot_fleurs: 'Pot de fleurs',
  hutte_morgat_bocal_papillons: 'Bocal à papillons',
  decor_mare_berge: 'Berge de mare', decor_mare_roseaux: 'Roseaux de mare', decor_fleur_perchee: 'Fleur perchée', decor_cercle_sain: 'Cercle sain',
  decor_tapis_mousse: 'Tapis de mousse', decor_mousse_sechee: 'Mousse séchée', decor_mousse_plaque_intacte: 'Plaque de mousse intacte',
  decor_mousse_plaque_grattee: 'Plaque de mousse grattée', decor_mousse_plaque_repoussee: 'Plaque de mousse repoussée',
  decor_mousse_lumineuse_sol: 'Mousse lumineuse (sol)', decor_mousse_lumineuse_petite: 'Mousse lumineuse (petite)',
  decor_mousse_lumineuse_tronc: 'Mousse lumineuse (tronc)', decor_mousse_lumineuse_plafond: 'Mousse lumineuse (plafond)',
  decor_touffe_mousse_petite: 'Petite touffe de mousse', decor_touffe_mousse_moyenne: 'Touffe de mousse', decor_touffe_mousse_grande: 'Grande touffe de mousse',
  decor_touffe_mousse_penchee: 'Touffe de mousse penchée', decor_empreinte_boue: 'Empreinte dans la boue', decor_marches_racines: 'Marches de racines',
  decor_autel_sommet: 'Autel du sommet',
  objet_fleche: 'Flèche plantée', objet_collet: 'Collet', objet_grappin: 'Grappin', rocher_roulant: 'Rocher roulant',
};
const EDITEUR_NOMS_FONDS = {
  fond_bosquet: 'Bosquet', fond_foret_sombre: 'Forêt sombre', fond_grand_arbre: 'Grand arbre', fond_foret_flottante: 'Forêt flottante',
  fond_foret_corrompue: 'Forêt corrompue', fond_monde_spirituel: 'Monde spirituel', fond_trou_sombre: 'Trou sombre', fond_arene_ghilt: 'Antre de Ghil\'t',
};

// Onglet Zone : réglages de la zone entière. `cle` = clé de la zone ;
// `retire` : valeur pour laquelle la clé est enlevée du fichier (réglage du jeu par défaut).
const EDITEUR_ZONE = [
  { titre: 'Nom' },
  { cle: 'zoneName', nom: 'Titre de la zone', type: 'texte', retire: '' },
  { cle: 'zoneSub', nom: 'Sous-titre', type: 'texte', retire: '' },
  { titre: 'Taille' },
  { cle: 'levelWidth', nom: 'Largeur', type: 'nombre', min: 960, max: 30000, pas: 64, unite: 'px' },
  { cle: 'levelHeight', nom: 'Hauteur', type: 'nombre', min: 540, max: 6000, pas: 4, unite: 'px' },
  { cle: 'levelTop', nom: 'Haut du monde', type: 'nombre', min: -8000, max: -400, pas: 64, defaut: -400, unite: 'px',
    aide: 'Jusqu\'où la zone monte au-dessus de l\'écran de départ (nombre négatif).' },
  { cle: 'tallLevel', nom: 'Zone en hauteur (la caméra monte et descend)', type: 'case', retire: false },
  { titre: 'Décor' },
  { cle: 'ambient.tint', nom: 'Voile de couleur', type: 'couleur' },
  { cle: 'ambient.darkness', nom: 'Obscurité', type: 'curseur', min: 0, max: 0.9, pas: 0.01, defaut: 0.35 },
  { cle: 'largeTrees', nom: 'Grands arbres du fond', type: 'case', defaut: true, retire: true },
  { cle: 'foregroundPlants', nom: 'Plantes de premier plan', type: 'case', defaut: true, retire: true },
  { titre: 'Son' },
  { cle: 'music', nom: 'Musique', type: 'liste', large: true, options: () => EditeurListes.musiques(), retire: '' },
  { titre: 'Histoire' },
  { cle: 'xara', nom: 'Compagnon', type: 'liste', large: true, retire: '',
    options: [{ v: '', nom: 'Xara suit Agarica (dès qu\'elles se connaissent)' }, { v: false, nom: 'Sans Xara dans cette zone' }] },
  { cle: 'script', nom: 'Script d\'histoire', type: 'liste', large: true, options: () => EditeurListes.scripts(), retire: '',
    aide: 'Les événements de la zone (boss, scènes). Ils ne se voient qu\'en jouant.' },
];

// Noms en clair des clés de zone que l'éditeur garde sans les modifier (onglet Zone, « Aussi dans cette zone »).
const EDITEUR_CLES_GARDEES = {
  playerSpawn: 'Départ du joueur', exits: 'Sorties', exit: 'Sortie', entries: 'Arrivées', triggers: 'Déclencheurs d\'histoire',
  checkpoints: 'Points de reprise', lights: 'Lumières', look: 'Rendu de cohésion', camera: 'Caméra', skyReveal: 'Ciel qui se découvre',
  farLayers: 'Lointains peints', liquidFloor: 'Liquide au fond', fall: 'Chute dans le vide', avoidRanges: 'Bandes sans arbres',
  undergrowthAvoid: 'Bandes sans sous-bois', helpText: 'Texte d\'aide', ambientLife: 'Vie d\'ambiance', backgroundBaseline: 'Ligne de base du fond',
  decor: 'Décor automatique', treesAtScreenBottom: 'Arbres en bas de l\'écran', ambience: 'Ambiance sonore',
};

// Icônes : tracés SVG (boîte 24 x 24, trait `currentColor`).
const EDITEUR_ICONES = {
  terrain: '<path d="M2 19h20M4 19l5-9 3 5 3-7 5 11"/>',
  arbre: '<path d="M12 21v-6M12 3l5 6h-3l4 5H6l4-5H7z"/>',
  patte: '<circle cx="7" cy="9" r="1.7"/><circle cx="12" cy="6.5" r="1.7"/><circle cx="17" cy="9" r="1.7"/><path d="M12 12c-3 0-5 2.6-5 4.6 0 1.5 1.3 2.4 2.7 2 1.5-.5 3.1-.5 4.6 0 1.4.4 2.7-.5 2.7-2 0-2-2-4.6-5-4.6z"/>',
  coffre: '<path d="M4 11V8a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v3M3 11h18v8H3zM12 11v3"/>',
  bulle: '<path d="M4 5h16v11H10l-4 4v-4H4z"/>',
  porte: '<path d="M6 21V4h12v17M3 21h18M14.5 12.5h.01"/>',
  reglages: '<path d="M4 7h10M18 7h2M4 12h3M11 12h9M4 17h12M20 17h0"/><circle cx="16" cy="7" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="18" cy="17" r="2"/>',
  monde: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  pinceau: '<path d="M4 20c2.5 0 4-1.2 4-3.2 0-1.3 1-2.3 2.300-2.300L18.500 6.300a1.800 1.800 0 0 0-2.600-2.600L7.700 11.900"/><path d="M4 20c0-1.500.500-3 1.600-3.800"/>',
  gomme: '<path d="M8 20h12M5.500 13.500l8-8a2 2 0 0 1 2.800 0l3.200 3.200a2 2 0 0 1 0 2.800L12 19H8l-2.500-2.500a2 2 0 0 1 0-3z"/><path d="M10 9l6 6"/>',
  calques: '<path d="M12 3l9 5-9 5-9-5zM3 13l9 5 9-5"/>',
  'gomme-calques': '<path d="M12 3l9 5-9 5-9-5zM3 13l9 5 3-1.700M16 21l5-5M21 21l-5-5"/>',
  eau: '<path d="M3 9c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 14c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 19c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>',
  branche: '<path d="M2 14c6-3 12-3 20-1M9 12.500c1-2.500 2.500-4 5-5M15 12c.500-1.500 1.500-2.500 3-3"/><path d="M14 7.500c.800-1.800 2.500-2.200 4-1.500-.500 1.700-2.200 2.400-4 1.500z"/>',
  tronc: '<path d="M8 3c.500 6 .500 12-1 18M16 3c-.500 6-.500 12 1 18M5 21h14M11 8v3M13 14v3"/>',
  cachee: '<path d="M3 13h3M9 13h3M15 13h3M21 13h0M5 17h2M11 17h2M17 17h2"/><path d="M12 4l1 2 2 .300-1.500 1.400.400 2.100L12 8.800l-1.900 1 .400-2.100L9 6.300l2-.300z"/>',
  papillon: '<path d="M12 8v10M12 9C10 5 5 4 4 7c-1 3 2 6 8 5M12 9c2-4 7-5 8-2 1 3-2 6-8 5M12 13c-3 0-6 2-5 5 1 2 4 1 5-2M12 13c3 0 6 2 5 5-1 2-4 1-5-2"/>',
  cocon: '<path d="M12 2v5"/><ellipse cx="12" cy="14" rx="4.500" ry="7"/><path d="M8.500 11c2 1 5 1 7 0M8 15c2.500 1 5.500 1 8 0"/>',
  cassable: '<path d="M4 4h16v16H4zM12 4l-2 5 3 3-2 4 1 4"/>',
  'cassable-ours': '<path d="M4 4h16v16H4z"/><circle cx="9" cy="10" r="1.200"/><circle cx="15" cy="10" r="1.200"/><path d="M9 15c2 1.500 4 1.500 6 0"/>',
  toile: '<path d="M12 3v18M3 12h18M5.500 5.500l13 13M18.500 5.500l-13 13M12 7l3.500 1.500L17 12l-1.500 3.500L12 17l-3.500-1.500L7 12l1.500-3.500z"/>',
  vent: '<path d="M3 9h10a3 3 0 1 0-3-3M3 14h15a3 3 0 1 1-3 3M3 19h6"/>',
  empreintes: '<circle cx="7" cy="16" r="2"/><circle cx="4.500" cy="12" r="1"/><circle cx="7.500" cy="11" r="1"/><circle cx="10" cy="12.500" r="1"/><circle cx="16" cy="9" r="2"/><circle cx="13.500" cy="5" r="1"/><circle cx="16.500" cy="4" r="1"/><circle cx="19" cy="5.500" r="1"/>',
  jouer: '<path d="M7 4.500v15l12-7.500z" fill="currentColor"/>',
  retour: '<path d="M10 6l-6 6 6 6M4 12h16"/>',
  annuler: '<path d="M8 5L3 10l5 5M3 10h11a6 6 0 0 1 0 12h-3"/>',
  refaire: '<path d="M16 5l5 5-5 5M21 10H10a6 6 0 0 0 0 12h3"/>',
  enregistrer: '<path d="M5 4h11l4 4v12H5zM8 4v5h7V4M8 20v-6h8v6"/>',
  ok: '<path d="M4 12.500l5 5L20 6.500"/>',
  alerte: '<path d="M12 3l10 18H2zM12 10v5M12 18h.01"/>',
  loupe: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.500-4.500"/>',
  corbeille: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
  dupliquer: '<path d="M9 9h11v11H9zM5 15H4V4h11v1"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  moins: '<path d="M5 12h14"/>',
  cadre: '<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/>',
  gauche: '<path d="M14 6l-6 6 6 6"/>',
  droite: '<path d="M10 6l6 6-6 6"/>',
  fleche: '<path d="M5 3l14 9-6 1.500 3 6-2.500 1.200-3-6L5 19z"/>',
  main: '<path d="M8 12V6a1.500 1.500 0 0 1 3 0v5V4.500a1.500 1.500 0 0 1 3 0V11V6a1.500 1.500 0 0 1 3 0v6V9a1.500 1.500 0 0 1 3 0v6a6 6 0 0 1-6 6h-2a6 6 0 0 1-5-3l-3-5a1.500 1.500 0 0 1 2.500-1.500z"/>',
  cadenas: '<path d="M6 11h12v9H6zM9 11V8a3 3 0 0 1 6 0v3"/>',
  nuage: '<path d="M7 18a4 4 0 0 1 0-8 5 5 0 0 1 9.700-1.500A4.500 4.500 0 0 1 17 18z"/>',
  croix: '<path d="M6 6l12 12M18 6L6 18"/>',
  aide: '<circle cx="12" cy="12" r="9"/><path d="M9.500 9.500a2.500 2.500 0 1 1 3.500 2.300c-.700.300-1 .900-1 1.700M12 17h.01"/>',
  manette: '<path d="M7 8h10a4 4 0 0 1 4 4v3a2.500 2.500 0 0 1-4.500 1.500L15 15H9l-1.500 1.500A2.500 2.500 0 0 1 3 15v-3a4 4 0 0 1 4-4zM8 10.500v3M6.500 12h3M16 11h.01M18 13h.01"/>',
};

function editeurIcone(nom, taille = 18) {
  const corps = EDITEUR_ICONES[nom] || EDITEUR_ICONES.aide;
  return `<svg class="ed-ico" width="${taille}" height="${taille}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${corps}</svg>`;
}

// « souche_champignons » -> « Souche champignons ».
function editeurNomLisible(id) {
  const s = String(id).replace(/_/g, ' ').trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// La liste complète des vignettes, construite une fois le jeu chargé (les
// tables du jeu : DECOR_SECTIONS, ITEM_INFO… sont alors connues).
function editeurConstruireElements() {
  const out = EDITEUR_ELEMENTS_FIXES.slice();
  // Décors : un groupe par biome.
  const sections = typeof DECOR_SECTIONS !== 'undefined' ? DECOR_SECTIONS : {};
  for (const [section, items] of Object.entries(sections)) {
    for (const item of items) {
      const type = `${section}_${item}`;
      out.push({
        id: `decor:${type}`, onglet: 'decors', groupe: EDITEUR_BIOMES[section] || editeurNomLisible(section), biome: section,
        nom: EDITEUR_NOMS_DECORS[type] || editeurNomLisible(item), genre: 'props', image: { decor: type }, modele: { type },
      });
    }
  }
  for (const c of EDITEUR_CREATURES) {
    out.push({ id: `creature:${c.type}`, onglet: 'creatures', groupe: c.groupe, nom: c.nom, genre: 'enemies', image: c.image,
      modele: { type: c.type }, cache: c.cache });
  }
  for (const a of EDITEUR_ANIMAUX) {
    out.push({ id: `animal:${a.type}`, onglet: 'creatures', groupe: 'Animaux', nom: a.nom, genre: 'animals', image: a.image,
      modele: { type: a.type, ...a.modele } });
  }
  for (const p of EDITEUR_PERSONNAGES) {
    out.push({ id: `perso:${p.id}`, onglet: 'creatures', groupe: 'Personnages', nom: p.nom, genre: 'npcs', image: { manifeste: p.id, anim: 'idle' },
      modele: p.modele || { id: p.id }, feuille: p.id });
  }
  for (const o of EditeurListes.objets()) {
    out.push({ id: `objet:${o.v}`, onglet: 'objets', groupe: 'À ramasser', nom: o.nom, genre: 'pickups', image: { objet: o.v }, modele: { item: o.v } });
  }
  return out;
}

// La vignette (élément du catalogue) qui correspond à un élément posé : sert à
// l'appeler par son nom et à montrer son image dans les réglages.
function editeurElementPour(elements, genre, el) {
  const g = EDITEUR_GENRES[genre];
  if (!g || !el) return null;
  const candidats = elements.filter((e) => e.genre === genre);
  for (const e of candidats) if (e.correspond && e.correspond(el)) return e;
  for (const cle of g.distingue || []) {
    if (el[cle] === undefined) continue;
    const trouve = candidats.find((e) => !e.correspond && ((e.modele && e.modele[cle] === el[cle]) || (cle === 'sprite' && e.feuille === el[cle])
      || (cle === 'id' && genre === 'npcs' && e.feuille === el[cle])));
    if (trouve) return trouve;
  }
  return candidats.length === 1 ? candidats[0] : null;
}
