// Boutiques (vague 3, 2026-11-08) : une entrée par marchand, ouverte par un
// PNJ `npcs: [{ id: 'marchand', x, shop: 'marchand_lune' }]` (ou l'étape de
// cinématique `{shop: 'marchand_lune'}`). Prix en Éclats de lune.
//   SHOPS[id] = {
//     name: 'Titre de la boutique', greet?: 'phrase du marchand en haut',
//     articles: [{
//       id,                 // unique dans la boutique (stocks : registre `shopBought`)
//       price,              // en éclats
//       give,               // contenu, même format qu'un coffre :
//                           //   { consommable: 'baie_soin', n } · { item: 'id' } · { coeur: true }
//                           //   { skill: 'id' } · { set: { flag: true } } (amélioration lue par le code)
//       stock?,             // nombre total vendable sur toute la partie (absent : illimité)
//       name?, desc?, icon?,// sinon tirés de l'objet (ITEM_INFO / CONSUMABLE_INFO)
//       requires?, forbids? // article proposé seulement si… (conditions d'histoire)
//     }],
//   }
// Plus tard (idées de l'utilisateur) : armures, armes, compétences -- un objet
// (ITEM_INFO) ou un drapeau d'amélioration (`set`), `stock: 1`.
// Prix (VAGUE3_DESIGN.md § 3.3, décision de l'utilisateur du 2026-11-08) :
// baie 15, sève 20, corde 30. Le chemin principal seul rapporte ≈ 50 éclats.
// Limites de poche (5 baies, 3 sèves) : l'article disparaît de l'étal quand
// les poches sont pleines (condition-fonction, relue à chaque ouverture).
const SHOPS = {
  // Boutique d'essai (banc d'essai de zonetest, PNJ `marchand`).
  marchand_lune: {
    name: 'Marchand de lune',
    greet: 'Des baies, de la sève… tout se paie en éclats de lune, petite druidesse.',
    articles: [
      { id: 'baie_soin', price: 15, give: { consommable: 'baie_soin', n: 1 } },
      { id: 'seve_energie', price: 20, give: { consommable: 'seve_energie', n: 1 } },
    ],
  },
  // Vague 3 : Tamarin, le vieux singe colporteur (src/story/vague3_commun.js),
  // perché au bout des lianes (racines du grand arbre, puis perchoirs des lots).
  tamarin: {
    name: 'Le bric-à-brac de Tamarin',
    greet: 'Tout est garanti. Enfin, presque.',
    articles: [
      {
        id: 'baie_soin', price: 15, give: { consommable: 'baie_soin', n: 1 },
        desc: 'Rend un cœur. 5 dans les poches au plus.',
        requires: () => consumableCount('baie_soin') < 5,
      },
      {
        id: 'seve_energie', price: 20, give: { consommable: 'seve_energie', n: 1 },
        desc: "Remplit l'énergie. 3 dans les poches au plus.",
        requires: () => consumableCount('seve_energie') < 3,
      },
      // Quête de Geralt (lot A) : seulement à l'étape `demande`, une fois.
      {
        id: 'corde_tressee', price: 30, give: { item: 'corde_tressee' }, stock: 1,
        requires: { questStep: 'geralt_corde:demande' }, forbids: { item: 'corde_tressee' },
      },
      // Plus tard (§ 3.3 « bientôt ») : grande baie (40), besace élargie (60),
      // amulettes (100-150), carte des rumeurs (50). ShopScene n'a pas encore
      // d'article grisé : Tamarin en parle (« Les amulettes arrivent bientôt »).
    ],
  },
};
