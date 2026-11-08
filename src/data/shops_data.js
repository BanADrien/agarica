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
const SHOPS = {
  marchand_lune: {
    name: 'Marchand de lune',
    greet: 'Des baies, de la sève… tout se paie en éclats de lune, petite druidesse.',
    articles: [
      { id: 'baie_soin', price: 8, give: { consommable: 'baie_soin', n: 1 } },
      { id: 'seve_energie', price: 12, give: { consommable: 'seve_energie', n: 1 } },
    ],
  },
};
