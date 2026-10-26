# Inventaire des assets existants (état au 2026-10-01, mis à jour le 2026-10-25)

Référence interne utilisée pour produire `CODEX_SPRITES_A_GENERER.md`. La liste complète et à jour des entrées est dans `src/data/asset_manifest.js` (ce qui est livré : `src/data/asset_present.js`, régénéré par `python tools/import_codex_assets.py`). Le suivi des générations est dans `RAPPORT_CODEX.md` ; ce qui reste dessiné par code, dans `INVENTAIRE_DESSINS_CODE.md`.

## Guide de style (à respecter pour tout nouvel asset)

- Art IA haute résolution, look « HD pixel-art / cel-shading 2D », contour épais quasi-noir, aplats, couleurs saturées, texture pixel visible.
- Ours, crapaud, Kainati et props du bosquet : clairement pixel-art. Agarica, Xara, transformations : chibi / cel-shading anime plus propre. UI (cadres lianes/bois) : peint, brillant.
- Seul vrai pixel-art fait main : `assets/decors/tuiles.png` (144x144, grille 24 px).
- Palette : forêt de nuit violet/indigo/sarcelle, champignons cyan lumineux, accents magiques vert lumineux (yeux, runes, traînée d'attaque). Corruption = mousse vert toxique lumineuse qui dégouline (voir sprite Kainati). Plantes de premier plan : silhouettes violet-noir avec liseré rose.
- Vue strictement de profil. Agarica humaine (idle/marche/course) regarde à GAUCHE ; tout le reste (loup, aigle, ours, Xara, crapaud, Kainati, attaque dague) regarde à DROITE. **Nouvelles feuilles : regarder à DROITE.**
- Fond : PNG RGBA transparent (sinon noir pur, retiré par `tools/dechroma.py`). Pas d'outil de chroma vert.
- Tailles natives : 2172x724 (3:1, rangée de 4-6 frames), 1448x1086 (4:3, multi-rangées / planche d'objets), 1254x1254, 1536x1024.
- Agarica : chibi menue ~2,5-3 têtes, oreilles pointues, yeux verts, cheveux auburn clair (#B5613A) courts en bataille (pas rouge vif), cape verte à capuche brodée feuilles/lianes avec fermoir argent rond, tunique beige sans manches, ceinture marron boucle dorée, pantalon gris foncé, bottes marron, mitaines noires, tatouage rose/spirale rouge sur le bras nu, dague argentée.
- Loup : gris-violet sombre, yeux verts. Aigle (« piaf ») : violet-noir, motifs feuilles vertes sur les ailes, œil vert, bec jaune. Ours : brun, yeux verts. Xara : araignée duveteuse prune foncé, rayures rose/magenta, losanges, grands yeux verts, crocs roses.
- Échelle en jeu (960x540, tuile 64 px) : Agarica frame 232x357 à 0.24 (~86 px) ; loup 422x267 à 0.40 ; aigle 413x401 à 0.28 ; Xara 292x320 à 0.15 ; totems ~225x750 à 0.35 ; feu de camp 472x617 à 0.15 ; props 0.4. Cible nouveaux persos : 250-400 px de haut par frame source.

## Existant

- `sprites/agarica_frames` (idle 6, ancienne marche 5, course 6), `agarica_walk_frames` (4), `agarica_attack_frames` (5). Pas de saut/blessure/mort/liane/parole dédiés.
- `loup_frames` (course 6, saut 4), `loup_attaque_frames` (8), `piaf_frames` (vol 4, plané 4, piqué 5) + plumes, `pieuvre_frames` (4), `ours_frames` (compétence fracas 6), `crapaud_frames` (5), `xara_frames` (marche, swing, switch, saut).
- `transformation/` : humain→aigle, humain→loup, loup→aigle (flash), humain→ours, pieuvre.
- `sprites/kainati.png` : Kainati corrompu (feuille Codex), référence visuelle du boss (l'ancienne pose statique `bosses_sprites/9a18…png` a été supprimée).
- `items/totem_frames` : totems loup/pieuvre/aigle dim/lit. `feu_de_camp_frames` (4). `firecamp_menu/interface.png` (= `ui_feu_camp`, panneau du menu du feu de camp, utilisé depuis Juice). `form_icone/{loup,aigle,pieuvre}.png`. `unlock_popup_animate/unlock1..5`.
- `decors/` : `plan4_ciel.png` (fond nuit), `arbres_frames` (8), `sous_bois_frames` (14), `plantes_frames` (bplante/hplante), `autotile_frames` (21 tuiles, jeu 'floor') + `tuiles_frames` (atlas `tuiles.png` découpé par `tools/cut_tuiles.py` : A1-A9, B, C1-C7, D1-D6 + 4 herbes, jeu 'tuiles'), `surface_frames`, `deco_item_frames/bosquet` (18 props). Planche `bosquet componant.png` : cabane, huttes, cottage, tour, tente, murailles, cercle de feu NON découpés.
- Depuis le 2026-10-01, les lots Codex n°2 à n°7 ont livré la plupart des personnages, PNJ, portraits, boss (Kainati, Ghil't), ennemis, fonds de zone (dont `fond_foret_sombre`), jeux de tuiles des biomes, totems, objets et VFX : voir `RAPPORT_CODEX.md` et le manifest.

## Lot Codex n°8 (livré le 2026-10-24, intégré le 2026-10-25)

27 images, **120 entrées** (5 feuilles animées dans `ASSET_MANIFEST`, 115 images dans `ITEM_MANIFEST`), toutes importées. Elles remplacent les dessins faits par code (`INVENTAIRE_DESSINS_CODE.md`) ; chaque branchement garde son repli. Plan : `PLAN_INTEGRATION_LOT_8.md`.

| Groupe | Dossier | Entrées |
|---|---|---|
| Feuilles animées | `assets/sprites/`, `assets/vfx/` | `singe_extra` (climb, throw), `forme_papillon_extra` (cast), `singe_gueri`, `vfx_mousse_toxique` (bulle, boule, goutte), `vfx_anneau_choc` (toxique, talisman) |
| Liquides | `assets/decors/liquides/` | `liquide_mare_fond`, `liquide_mare_voile`, `liquide_mare_surface_0..3`, `liquide_mousse_toxique` |
| Ciel et lointains | `assets/decors/fonds/` | `couche_ciel_jour`, `couche_nappe_nuages`, `couche_nappe_brume`, `couche_brume_avant`, `couche_nuage_0..4`, `couche_soleil`, `couche_iles_lointaines`, `couche_horizon_malade`, `couche_vignette` |
| Structures | `assets/decors/elements/` | `decor_lanterne_eteinte` / `_allumee`, `decor_fente_fermee` / `_ouverte`, `decor_spirale_gravee`, `decor_plateforme_fantome`, `decor_plateforme_ecorce_intacte` / `_fissuree` / `_brisee`, `decor_rampe_lancement`, `decor_marches_racines`, `decor_autel_sommet`, `decor_pont_tronc`, `decor_cratere`, `decor_trou_effondre` |
| Plantes, mare, mousses | `assets/decors/elements/` | `decor_mare_berge`, `decor_mare_roseaux`, `decor_fleur_perchee`, `decor_plante_resistante_fleurie` / `_bouton`, `objet_graine_coeur`, `decor_tapis_mousse`, `decor_cercle_sain`, `decor_mousse_sechee`, `decor_mousse_plaque_intacte` / `_grattee` / `_repoussee`, `decor_mousse_lumineuse_sol` / `_tronc` / `_plafond` / `_petite`, `decor_touffe_mousse_petite` / `_moyenne` / `_grande` / `_penchee`, `decor_empreinte_boue` |
| Particules | `assets/vfx/particules/` | `fx_eclat_mousse`, `fx_motte_mousse`, `fx_motte_terre`, `fx_eclat_ecorce`, `fx_eclat_pierre`, `fx_feuille`, `fx_petale_rose`, `fx_petale_blanc`, `fx_goutte_toxique`, `fx_goutte_antidote`, `fx_bulle`, `fx_eclaboussure_toxique`, `fx_luciole`, `fx_grain_lumiere`, `fx_etincelle`, `fx_etincelle_papillon`, `fx_trainee_papillon`, `fx_trait_vent`, `fx_ombre_sol`, `fx_marqueur_danger`, `fx_spore_toxique`, `fx_bouffee_poussiere`, `fx_bouffee_toxique`, `fx_braise` |
| Halos et lumières | `assets/vfx/particules/` | `fx_halo_doux`, `fx_halo_rayons`, `fx_rai_lumiere`, `fx_halo_objet`, `fx_aura_esprit`, `fx_lueur_sol` (retouchés à l'import : dégradé, flaque rognée et désaturée) |
| Petites créatures | `assets/sprites/petites/` | `araignee_petite_0..2`, `bete_mousse_vivante` / `_touchee` / `_morte`, `mousse_creature_guerie_0` / `_1` |
| Objets | `assets/items/objets/`, `assets/vfx/particules/` | `note_geralt`, `objet_grappin` (tous deux réextraits du brut), `objet_fleche`, `objet_collet`, `objet_corde`, `fx_fil_soie` |
| Interface | `assets/ui/` (+ `ui_feu_camp`) | `ui_bulle`, `ui_bulle_pointe`, `ui_invite`, `ui_banniere`, `ui_touche`, `ui_alerte`, `ui_etoiles_etourdi`, `ui_case_competence`, `ui_anneau_objet`, `ui_ornement_titre`, `ui_energie_cadre`, `ui_energie_remplissage`, `ui_boss_cadre`, `ui_boss_remplissage`, `ui_feu_camp` |

Non utilisées en jeu (posables dans l'éditeur pour les décors) : `decor_marches_racines`, `decor_autel_sommet`, `fx_eclaboussure_toxique`, `couche_brume_avant` ; en second choix seulement : `decor_fleur_perchee`, `decor_tapis_mousse`. Retouches facultatives à faire à la main : `PLAN_INTEGRATION_LOT_8.md` §7 (lac de mousse toxique, brume avant, nuages 3 et 4, nappe de nuages, îles lointaines).

## Lot Codex n°9 (À GÉNÉRER)

Entrées déjà dans le manifest (2026-10-25) et déjà branchées dans le code, avec repli sur les poses actuelles : rien à changer à l'arrivée des images, sauf relancer l'import.

| Entrée | Images à générer | Rangées | Usage | Prompt |
|---|---|---|---|---|
| `geralt_combat` | `assets/sprites/geralt_combat.png`, `_p2.png`, `_p3.png` | 8 : shoot, shoot_up, jump_shoot, crash, stunned, set_trap, trapped, hurt | poses du duel (`GeraltDuel.js`, `GERALT_POSES`) | `PROMPT_CODEX_9_GERALT.md` |
| `kainati_calme` | `assets/sprites/kainati_calme.png` | 2 : sit_idle, sit_talk | Kainati épargné, assis (revisites, « E : parler ») | `PROMPT_CODEX_9_KAINATI.md` |
| `kainati_esprit_extra` | `assets/sprites/kainati_esprit_extra.png` | 1 : give | l'esprit donne la forme singe au monde spirituel : **plus d'usage sur le chemin** depuis que le totem des racines donne la forme directement (facultatif) | `PROMPT_CODEX_9_KAINATI.md` |

## Lot Codex n°10 (livré le 2026-10-26)

Forme papillon refaite en **vrai papillon lunaire** (sans visage humain) : `forme_papillon`, `transfo_papillon`, `forme_papillon_extra` remplacés, mêmes ids, anims et nombres de frames (`PROMPT_CODEX_10_PAPILLON.md`). Le papillon n'est qu'une compétence (soin) : incantation de la compétence et sauvetage de Ghil't.

## Placeholders dessinés par code

Voir `INVENTAIRE_DESSINS_CODE.md` (mis à jour le 2026-10-25) : presque tout ce qui était dessiné par code a maintenant une image, le dessin reste en repli. Tout élément du manifest sans image s'affiche en placeholder (rectangle coloré + étiquette).

## Pipeline d'import

1. Feuille PNG fond transparent ; UNE rangée = UNE animation, frames de gauche à droite ; bande transparente entre rangées ; chaque frame = une silhouette connexe qui ne touche pas sa voisine (pas d'étincelles/débris détachés — sinon feuille d'effets séparée).
2. Déposer dans `assets/sprites/<nom>.png`.
3. `python tools/split_spritesheet.py assets/sprites/<nom>.png assets/sprites/<nom>_frames --prefix <nom>` → `<nom>_row<r>_<c>.png`, même canvas, aligné bas-centre.
4. Fond noir : `python tools/dechroma.py in.png out.png` avant.
5. Props de décor : `assets/decors/déco item/<section>/` puis `tools/crop_deco_items.py`, renommer, déclarer dans `DECOR_SECTIONS`.
6. Images Codex déclarées dans le manifest (cas général depuis le lot n°2) : `python tools/import_codex_assets.py` découpe, aligne et range tout, puis régénère `src/data/asset_present.js` (`--force --only <ids>` pour réimporter). Options d'import par entrée (lot n°8) : `trimAlpha`, `cropTop`, `pad`, `falloff`, `desaturate`, `align: "ring"`. Ne jamais passer `--force` sur `ui_feu_camp`.
