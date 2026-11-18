// Ambiances d'éclairage du jeu : une seule source pour les réglages validés dans les zones de test.
// foret : sous la canopée, plus sombre et légèrement verte, avec des rayons entre les feuilles.
const AMBIANCES_LUMIERE = {
  foret: {
    ambiance: 0.46,       // lumière générale sous les arbres
    teinte: 0.14,         // part de vert
    rayons: 0.95,         // force des rayons sur les personnages et le décor
    densite: 0.12,        // part de la canopée ouverte (nombre de rayons)
    largeur: 24,          // largeur moyenne d'un rayon (px du monde)
    faisceaux: 0.1,       // visibilité des faisceaux dans l'air
    balancement: 3,       // mouvement des feuilles (px)
    soleil: { x: -0.28, y: 0.8, z: 0.7 },   // direction fixe : plus x est petit, plus les rayons tombent droit
  },
};
