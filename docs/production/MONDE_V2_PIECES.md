# Monde V2, étape 2 : les nouvelles pièces de jeu

Décidé le 2026-11-16. L'utilisateur a validé la carte (`PLAN_MONDE_V2.md`) et dit : « construis, mais
garde l'ancienne version au cas où ».
- L'ancienne version est gardée dans Git : tag `demo-v1-avant-monde-v2`, branche
  `feature/demo-histoire`. Le travail se fait sur la branche `monde-v2`.
- Dans le jeu, les anciennes zones restent intactes et jouables.

Ces pièces servent à construire les 48 zones. Elles s'essaient d'abord dans une zone de test, puis on
les pose avec l'éditeur.

## Règles

- **Rétro-compatible.** L'ancienne valeur `by: 'bear'` des cassables garde son sens actuel (tout ours
  la casse), pour que les anciennes zones marchent comme avant. Les nouvelles valeurs ne servent
  qu'au monde V2.
- Chaque pièce est une **clé de zone en données**, présente dans le **catalogue de l'éditeur**
  (`src/editeur/catalogue.js`) pour pouvoir être posée à la souris, et décrite dans `PLAN_DEV.md`.
- Les images sont **provisoires** (dessin par code ou image existante recolorée), toujours avec un
  repli.

## Les pièces

| Pièce | Donnée | Ce qui la déclenche | Rendu provisoire |
|---|---|---|---|
| **Sol fissuré** | `breakables` avec `by: 'sol'` | le fracas de l'ours brun (compétence `ours`) et l'atterrissage de l'ours-hibou. Rien d'autre : ni le grizzly, ni la dague | fissures horizontales sur les cases du sol (le dessin actuel `secretDrawFractures`) |
| **Mur fissuré** | `breakables` avec `by: 'mur'` | la charge du grizzly, à vitesse de charge seulement. Rien d'autre | fissures verticales, nettement différentes du sol |
| **Dalle épaisse** | `breakables` avec `by: 'dalle'` | l'atterrissage de l'ours-hibou après une chute d'au moins 3 rangées (192 px). L'ours brun ne la casse pas | dalle de pierre plus épaisse, une seule grande fissure |
| **Bloc SECRET** | `secretBlocks: [{ id, x, y, w, h, forme: 'insecte' \| 'canide' \| 'poisson' \| 'felin' }]` | rien pour l'instant : solide, incassable | un rectangle sombre où est écrit « SECRET » en gros, avec le nom de la famille en petit dessous. Une bulle de Xara quand on le touche ou qu'on appuie sur E : « Il faudrait une autre forme pour passer. » |
| **Glace sur l'eau** | aucune clé : c'est l'ours polaire | les pics de l'ours polaire qui atteignent une surface d'eau (`water`) forment des **plaques de glace** posées sur l'eau, sur toute la longueur des pics. On peut marcher dessus, puis elles fondent en environ 4 s | plaques bleu pâle, petit clignotement avant la fonte |
| **Cible suspendue** | `targets: [{ id, x, y, flag }]` | une pierre (compétence `pierre`) qui la touche : elle tombe, et le drapeau `flag` passe à vrai | une noix ou un fruit suspendu à un fil, dessiné par code |
| **Élément conditionnel** | toute pièce peut porter `showIf: '<drapeau>'` | elle n'apparaît que si le drapeau est vrai. C'est ce qui permet à la cible de faire tomber un coffre ou un pont. À voir dans le code : ce mécanisme existe peut-être déjà sous un autre nom (`requires`, `flag`…) ; dans ce cas, le réutiliser | — |
| **Barrière corrompue** | `corruptBarriers: [{ id, x, y, w, h }]` | les papillons de la compétence `papillon` la soignent : elle se dissout, et c'est retenu dans la sauvegarde. Si une barrière de ce genre existe déjà, la réutiliser | ronces violettes qui pulsent |
| **Totems du grizzly et de l'ours-hibou** | le totem habituel (`addAbilityShrine`, `TOTEM_TYPE_BY_FLAG`) avec `hasGrizzlyForm` et `hasOwlbearForm` | comme les autres totems : allumé tant que la forme n'est pas obtenue, éteint ensuite | le totem d'une autre forme recoloré, ou un provisoire par code |
| **Talismans du panda et de l'ours polaire** | un objet à ramasser qui donne la compétence (`panda`, `ours_polaire`), comme le talisman de l'ours | ramassage | le talisman de l'ours recoloré, ou un provisoire par code. Fenêtre de déblocage : icônes déjà présentes (`skill_icone/panda.png`, `ours_polaire.png`) |

## Zone de test

Tout s'essaie dans une seule zone de test : la zone des ours (`ZoneOursScene`, `src/data/zone_ours_data.js`)
complétée, ou une nouvelle zone de test si c'est plus propre. Elle contient :
- un sol, un mur et une dalle fissurés ;
- un bloc SECRET ;
- une mare pour la glace ;
- une cible qui fait apparaître un coffre ;
- une barrière corrompue ;
- les deux totems et les deux talismans.
