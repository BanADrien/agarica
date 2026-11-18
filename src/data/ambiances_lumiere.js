// Ambiances d'éclairage du jeu : une seule source pour les réglages validés dans les zones de test.

// Interrupteur général : false coupe toutes les ambiances, le jeu retrouve son rendu d'origine.
// Pour comparer sans toucher au code : ajouter `?sanslumiere` à l'adresse.
const AMBIANCE_ACTIVE = true;

// foret : sous la canopée, plus sombre et légèrement verte, avec des rayons entre les feuilles.
const AMBIANCES_LUMIERE = {
  foret: {
    ambiance: 0.46,       // lumière générale sous les arbres
    teinte: 0.14,         // part de vert
    rayons: 0.95,         // force des rayons sur les personnages et le décor
    lueurCorps: 0.12,     // lueur uniforme du corps dans un rayon (part de sa force) ; le dessus reçoit le rayon franc
    densite: 0.12,        // part de la canopée ouverte (nombre de rayons)
    largeur: 24,          // largeur moyenne d'un rayon (px du monde)
    faisceaux: 0.1,       // visibilité des faisceaux dans l'air
    balancement: 3,       // mouvement des feuilles (px)
    soleil: { x: -0.28, y: 0.8, z: 0.2 },   // direction fixe : plus x est petit, plus les rayons tombent droit ; z faible : ils viennent d'en haut, pas de devant
  },
};

// Ambiance de chaque zone (clé de scène -> nom dans AMBIANCES_LUMIERE). Une zone absente de cette liste garde son rendu.
const AMBIANCE_PAR_ZONE = {};
