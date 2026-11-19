// Effets d'ambiance qui s'ajoutent à une ambiance d'éclairage (src/utils/AmbianceEffets.js). Une ambiance de
// AMBIANCES_LUMIERE les active avec `effets: AMBIANCE_EFFETS.foret` (ou une copie réduite) ; la zone de test
// foret_ambiance les active tous et permet de couper chacun.
//
// Ordre et noms affichés dans le panneau de la zone de test
const AMBIANCE_EFFETS_LISTE = [
  { id: 'poussiere', nom: 'Poussiere dans les rayons' },
  { id: 'taches', nom: 'Ombres de feuilles mouvantes' },
  { id: 'rafales', nom: 'Rafales de vent' },
  { id: 'nuages', nom: 'Nuages qui passent' },
  { id: 'lucioles', nom: 'Lucioles qui eclairent' },
  { id: 'brume', nom: 'Brume eclairee par les rayons' },
  { id: 'profondeur', nom: 'Fonds bleutes et voiles' },
  { id: 'gouttes', nom: 'Gouttes qui brillent' },
  { id: 'feuilles', nom: 'Feuilles qui tombent' },
  { id: 'fougeres', nom: 'Fougeres qui s\'ecartent' },
  { id: 'herbes', nom: 'Herbes devant Agarica (bande + touffes)' },
  { id: 'animaux', nom: 'Animaux furtifs' },
  { id: 'soir', nom: 'Lumiere de fin de journee' },
  { id: 'clairiere', nom: 'Clairiere' },
];

// Espèces d'oiseaux de la forêt (assets/sprites/oiseaux_foret/) ; un groupe n'en mélange jamais deux
const OISEAUX_FORET_ESPECES = [
  { nom: 'anguleux-graphique', fichier: 'assets/sprites/oiseaux_foret/anguleux-graphique.png', largeur: 18, hauteur: 15 },
  { nom: 'merle-elance', fichier: 'assets/sprites/oiseaux_foret/merle-elance.png', largeur: 21, hauteur: 17 },
  { nom: 'mesange-sobre', fichier: 'assets/sprites/oiseaux_foret/mesange-sobre.png', largeur: 19, hauteur: 19 },
  { nom: 'nocturne-violet', fichier: 'assets/sprites/oiseaux_foret/nocturne-violet.png', largeur: 19, hauteur: 16 },
  { nom: 'rouge-gorge-tamise', fichier: 'assets/sprites/oiseaux_foret/rouge-gorge-tamise.png', largeur: 18, hauteur: 19 },
  { nom: 'troglodyte-rond', fichier: 'assets/sprites/oiseaux_foret/troglodyte-rond.png', largeur: 18, hauteur: 18 },
];

const AMBIANCE_EFFETS = {
  foret: {
    // grains dans les faisceaux (déjà créés par AmbianceKit) : l'effet les montre ou les cache
    poussiere: {},
    // ombres des feuilles dans les rayons, au sol et sur les personnages : force (0-1), taille d'une tache (px du
    // monde), dérive par le vent (px/s)
    taches: { force: 0.55, taille: 15, derive: 5 },
    // rafale toutes les `entre` secondes (min, max), montée et descente sur `duree` s ; balancement des rayons
    // multiplié par `balancement` au plus fort
    rafales: { entre: [8, 16], duree: 3.5, balancement: 3.5 },
    // nuage toutes les `entre` s, passage sur `duree` s ; les rayons tombent à (1 - profondeur) au plus sombre
    nuages: { entre: [12, 24], duree: 8, profondeur: 0.6 },
    // lucioles déjà semées par la zone (LevelKit) qui deviennent des sources (forme cercle) ; au plus `max` allumées
    lucioles: { max: 3 },
    // nappe de brume au sol : sombre hors des rayons, claire dedans
    brume: { alpha: 0.3, alphaRayon: 0.34, hauteur: 70, sol: 448, sombre: 0x1c2436, claire: 0xb9b69c, vitesse: 4 },
    // fonds (parallaxe < 1) : teinte bleutée plus forte au loin, voile au-dessus des plans lointains
    profondeur: { bleu: 0x8ea4d8, voile: 0x2c3a5c, voileAlpha: 0.22 },
    // gouttes qui tombent de la canopée, visibles dans les rayons
    gouttes: { nombre: 16 },
    // feuilles qui tombent, rafale : `rafale` de plus
    feuilles: { nombre: 10, rafale: 8 },
    // sous-bois qui s'écarte d'Agarica et plie au vent (angle max en degrés)
    fougeres: { angle: 9, portee: 46, vent: 4 },
    // herbes au premier plan (devant les personnages) : bande continue le long du sol (variantes `cases` : [x, largeur]
    // dans la planche, enchaînées au hasard) et touffes hautes posées sans régularité (`cases` : [x, largeur, poids du
    // tirage], une touffe tous les `entre` px, par deux avec la probabilité `paire`) ; angle max (degrés) au vent
    // (`vent`, en plus d'une ondulation `ondule`, multiplié par `souple`) et quand Agarica passe (`angle`, à moins
    // de `portee` px de leur bord)
    herbes: {
      bande: { fichier: 'assets/decors/ambiance/herbe_bande.png', cases: [[0, 48], [48, 48], [96, 48]], souple: 0.4, angle: 5 },
      touffes: {
        fichier: 'assets/decors/ambiance/herbes_hautes.png',
        cases: [[0, 14, 4], [21, 18, 5], [45, 25, 4], [76, 29, 2], [109, 32, 1], [146, 23, 4]],
        entre: [70, 260], paire: 0.35, angle: 10,
      },
      // margeFeu : px laissés sans herbe de chaque côté d'un feu de camp (en plus de sa largeur)
      sol: 448, enfonce: 2, ondule: 1.2, vent: 5, portee: 18, margeFeu: 4,
    },
    // groupes d'oiseaux posés (x du monde du centre de chaque groupe) : 1 à 4 oiseaux côte à côte, qui s'envolent
    // ensemble quand Agarica approche à moins de `approche` px, chacun avec un décalage de 0 à `ecart` s ; un groupe
    // parti revient après `retour` s, quand Agarica est loin. Silhouette qui traverse au loin toutes les `entre` s
    animaux: {
      groupes: [1750],
      groupe: { taille: [1, 4], ecart: 0.7, espace: [9, 15] },
      approche: 120,
      retour: 42,
      // 6 espèces, une planche de 4 cases chacune : posé, ailes hautes, ailes basses, posé (largeur x hauteur d'une case)
      especes: OISEAUX_FORET_ESPECES,
      silhouette: { entre: [18, 30], parallaxe: 0.45 },
    },
    // heure de 0 (après-midi) à 1 (fin de journée) en `duree` s ; la zone de test l'accélère
    soir: { duree: 600, soleil: 0xff9a4e, rayons: 0.7, ambiance: 0.72, faisceaux: [1, 0.66, 0.38] },
    // canopée ouverte au-dessus du sol de x0 à x1
    clairiere: { x0: 1900, x1: 2330, sol: 448 },
  },
};
