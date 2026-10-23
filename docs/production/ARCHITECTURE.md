# Architecture existante (brief, état au checkpoint ff69a1b)

## Global
- Phaser 3.80.1 (CDN), pas de build. `index.html` charge dans l'ordre : LevelKit, data/*, entities, scenes, main.js. Nouveaux fichiers = `<script>` + scène dans `scene:[...]` de `src/main.js`.
- 960x540 Scale.FIT, arcade gravité 1300, `overlapBias: 20`. `?editor` → EditorScene.
- Tout est global ; constantes `UPPER_SNAKE` ; clés de texture `nom-anim-N` ; anims créées paresseusement par `ensureXxxAnimations(scene)` gardées par `scene.anims.exists`. Placeholders via `Graphics.generateTexture`. Clavier AZERTY (ZQSD).

## LevelKit.js — buildLevelFromData(scene, data, sceneData) (~l.1717)
Clés : `levelWidth/levelHeight`, `tallLevel` (caméra verticale), `decor:false`, `avoidRanges`, `groundBackCells`, `groundCells` ([gx,gy,'dirt'], grille 64, surface habituelle gy=7 → y=448, helper `groundRow(gx0,gx1,[gy..])`), `water`, `webs`, `enemies` [{type,x,y,patrolMinX,patrolMaxX,diveDepth}], `totems` [{x,y,flag,message}], `props` [{type,x,y,scale}], `campfires`, `exits` [{x,y?,height?,targetScene,data:{enterId},portalId}], `entries` [{id,x,y,height,portalId}], `playerSpawn`.
Crée : `scene.player`, `scene.xara`, `scene.ground`, `scene.water`, `scene.webs`, `scene.enemies`, `scene.levelWidth`, `scene.__exits`, HUD.
Ennemis : chaîne if/else sur le type (araignee harmless, loup, loupAlpha, corbeau, crapaud) ; `group.add()` remet la gravité → `setAllowGravity(false)` après ajout pour volants/fixes.
Combat (~1907) : overlap joueur/ennemis : si `player.getAttackHitbox()` touche → `enemy.defeat()` + `gainEnergy(12)`, sinon si pas harmless → `player.hitByEnemy()`. Compétences dans `updateLevelFromData` via `player.getSkillHitbox()` → `defeat()`. **Bug : LoupAlpha (hp 3, takeHit) meurt en 1 coup de mêlée/compétence.**
`updateLevelFromData` (~2067) : sort si `scene !== currentLevelScene` ; monde gelé si CampfireMenuScene actif ; player.update, xara.update, enemy.update(player), sorties (rect 64 px de large), drawHud.
Transitions : `goToScene(scene,key,data)` (fondu 250 ms). Chaque scène de zone = gabarit `resolveZoneData('nom', NOM_DATA).then(d => buildLevelFromData(this,d,sceneData))` + `update → updateLevelFromData`.
Chutes : pas dans le schéma, gérées par scène. HUD : un Graphics redessiné (cœurs, énergie, 3 slots A/F/R).
**Brouillons IndexedDB** (`resolveZoneData`) : un brouillon éditeur écrase le fichier data au runtime.
Helpers : `addAbilityShrine` (totem, E, flag registre, `TOTEM_TYPE_BY_FLAG` wolf/eagle/octopus, `showFormUnlockPopup`), `addCampfire` (E → `refillAtCampfire` + launch `CampfireMenuScene`), `groundSurfaceYAt`, `sendBehindFrontGround`. Debug : Ctrl+I physique, Shift+A hitbox attaque, Shift+J corps, Ctrl+Shift+H sol, **Ctrl+Shift+D triche (tout débloquer)**. `DECOR_SECTIONS` → props `prop-<section>_<item>`. Listeners `scene.events.on('update')` persistent : vérifier `scene !== currentLevelScene`.

## Player.js
- `FORMS` (~504) : agarica, eagle (piaf), wolf (loup), octopus (pieuvre). `setForm`. Sélection auto chaque frame dans `update()` (~1414) : eau+pieuvre → octopus ; en l'air avec `jumpsUsed>=2` → eagle (plané, S = piqué, K = plume `Feather`) ; sprint (Shift / double-tap), dash loup → wolf ; sinon agarica. Transitions `beginFormTransition`.
- Une forme marche si flag (`hasWolfForm`/`hasEagleForm`/`hasOctopusForm`) ET dans `equippedForms` (3 slots, `formEquipped`).
- `SKILL_DEFS` (~798) : `ours` (fracas, coût 35), `crapaud` (dans Crapaud.js). `skillSlots` touches A/F/R, `tryActivateSkill` data-driven. `unlockedSkills` Set (seulement via triche aujourd'hui).
- Totems bonus : `TOTEM_HEADS`/`TOTEM_BODIES`, `equippedTotem`, `recomputeTotemBonuses`.
- Entrées : flèches/Q-D, saut Z/↑/Espace, sprint Shift, S piqué/plongée, K ou clic attaque, **E interagir**, A/F/R compétences.
- Santé : `HEART_MAX=3`, `ENERGY_MAX=100`, `hitByEnemy()` (-1 cœur, 300 ms invul ; à 0 → recharge + téléport au spawn, pas de game over).
- État : uniquement `scene.registry` (aucune sauvegarde localStorage). Clés : hasWolfForm, hasEagleForm, hasOctopusForm, equippedForms, hearts, energy, unlockedSkills, skillSlots, equippedTotem. Player recréé dans chaque zone depuis le registre.

## CampfireMenuScene.js
Overlay parallèle `{player}`, monde gelé, E/Échap ferme. `FORM_INFO` (eagle/wolf/octopus), 3 slots formes, 3 slots compétences, 1 tête + 1 corps de totem ; drag-drop ou clic-clic ; rectangles + texte (pas d'art). Nouvelle forme = `FORM_INFO` + `FORMS` + logique `update()` + `TOTEM_TYPE_BY_FLAG` + assets.

## Xara.js
Compagnon : états 'ground' (suit avec ~300 ms de retard), 'swinging' (fil de soie quand joueur loup/aigle), 'bubble' (pieuvre). Pas de combat. **Aucun système de dialogue/cinématique n'existe.** Style UI existant des invites : `scene.add.text` fond `#2a1f45`, couleur `#ffe9f5`.

## Ennemis
Étendent `Phaser.Physics.Arcade.Sprite`, `update(player)`, `defeat()` idempotent (désactive le corps, fondu, destroy), `harmless` optionnel. LoupSanguinaire (placeholder, patrouille/charge), Araignee (fixe, harmless), Corbeau (piaf 0.15, piqué), Crapaud (langue), LoupAlpha (loup x0.6 teinté, hp 3, takeHit). Zone5Scene : boss trouvé par instanceof → EndScreen quand defeated.

## BootScene / flux
Preload : frames individuelles, nombres codés en dur dans des constantes. Pas de handler loaderror (404 → texture manquante, pas de crash). create : filtre tileset, `?editor` → EditorScene, sinon titre (dégradé + texte) → PrologueScene → Zone1. Zone1 → Zone3 / Zonetest ; Zone3 → Zone2 (données de test, pas de sortie) ; Zone2 chute → SousGrotte → Zone4 → ZoneAquatique → Zone5 (LoupAlpha) → EndScreen → Zone1.

## EditorScene (`index.html?editor`)
Outils HTML `#editor-ui` (data-tool) : ground, erase, ground-back, erase-back, spawn, portal, totem, enemy, water, prop, campfire, delete, modify. `EDITOR_ENEMY_TYPES` incomplet (pas crapaud/loupAlpha). Pas d'outil webs. Ajouter un type : bouton index.html, `EDITOR_CLICK_TOOLS`, branche `placeAt`, `emptyLevelData`, `applyLevelData`, éventuellement `EDITOR_RESIZABLE_KINDS`/`GROUND_SNAPPED_KINDS`. Save : IndexedDB + POST `/__save_zone` (dev_server réécrit data ET scène avec gabarit générique !). Nommage : zone `foo_bar` → `FOO_BAR_DATA`, `FooBarScene`, fichiers `src/data/foo_bar_data.js`, `src/scenes/FooBarScene.js`.

## Outils
`split_spritesheet.py <sheet> <out> --prefix N` (fond transparent requis, rangées séparées par bande transparente, composantes connexes), `dechroma.py`, `crop_deco_items.py`, `cut_tuiles.py`, `crop_autotile.py`. Test : `tools/playtest.py` (headless Edge, voir PLAN_DEV.md).
