// Compagnon Xara : sprites réels (voir tools/split_spritesheet.py, généré
// depuis assets/sprites/Xara.png), trois états selon la forme d'Agarica :
// - "sol" (marche/immobile en forme humaine) : Xara marche derrière elle
//   au niveau du sol, cycle de marche réel (pas juste un flottement).
// - "balancier" (Loup/Aigle, donc dès qu'Agarica court ou plane) : suspendue
//   à un fil de soie envoyé vers le haut de l'écran, mouvement de balancier
//   fait par code (une seule pose affichée — pas de cycle d'anim pendant
//   qu'elle se balance).
// - "bulle" (Pieuvre, dans l'eau) : pas d'art dédié pour nager, donc flotte
//   dans une bulle (dessinée, pas un sprite) juste à côté du joueur, reliée
//   à lui par un fil — bien plus simple qu'essayer de la faire nager.
// Une courte transition (3 poses `switch-1..3`) joue à chaque bascule
// sol <-> balancier. Sol <-> bulle réutilise les poses de saut (elle
// "saute" dans/hors de l'eau avant que la bulle apparaisse/disparaisse,
// cf. XARA_BUBBLE_JUMP_FRACTION) ; balancier <-> bulle (rare) n'a pas d'art
// dédié, juste un glissement de position/alpha (cf. update).
const XARA_WALK_FRAME_INDICES = [0, 1, 2, 6, 7, 8];
const ANIM_XARA_WALK_KEY = 'xara-walk';
// Toutes les frames partagent un seul canvas (cf. l'outil de split) : une
// seule échelle suffit, pas de saut de taille entre sol et balancier.
const XARA_SCALE = 0.15;

// Décalages (au repos, avant lissage) par rapport à Agarica. `target.y` est
// la position des pieds (origine ancrée en bas) : au sol, Xara reste au
// même niveau (ancrée pieds elle aussi) ; en balancier, elle plane nettement
// plus haut, suspendue à son fil.
const XARA_GROUND_OFFSET_X = -46;
const XARA_GROUND_OFFSET_Y = 4;
// En dessous de cette distance à sa cible suivie, elle est considérée
// arrivée (cf. update, décide de l'anim de marche) — le lerp de suivi
// (`followLerp`) ne l'amène jamais exactement à 0px, juste assez proche
// pour que continuer à animer la marche paraîtrait un pas sur place inutile.
const XARA_GROUND_ARRIVED_GAP = 6;
// Retour utilisateur : "il faudrait que xara ait une hitbox aussi pour
// simplifier son comportement pour les distances ou les hitbox des
// plateformes" -- état 'ground' entièrement réécrit sur un VRAI corps
// Arcade Physics (cf. constructeur : gravité + collider contre scene.ground,
// même autorité que le joueur) au lieu de suivre un `groundBaselineY` calculé
// à la main frame par frame (cf. git history -- l'ancienne approche : sonder
// `groundYAt` partout, poser un arc sinusoïdal cosmétique, figer une "cible
// de hauteur" au lancer d'un saut...). Conséquence directe : "elle se
// téléporte pendant ses sauts" (retour utilisateur) disparaît, un vrai saut physique
// (gravité + vitesse) se déroule sur sa vraie durée au lieu d'un
// `groundBaselineY` qui rejoignait sa cible d'un coup sous un arc cosmétique
// fixe.
//
// Vitesse maximale (px/s) à laquelle elle rattrape le joueur au sol —
// plafonne l'approche proportionnelle ci-dessous plutôt que de la
// remplacer : un petit écart continue de se refermer en douceur, un grand
// écart (ex: elle vient de retomber loin en avant après une bascule
// balancier -> sol) ne se referme plus en un bond énorme instantané.
const XARA_GROUND_CATCHUP_SPEED = 260;
// Gain de l'approche proportionnelle ci-dessus (vitesse visée = écart × ce
// gain, plafonnée à XARA_GROUND_CATCHUP_SPEED) : assez grand pour atteindre
// le plafond dès un écart modeste (~65px), assez petit pour ralentir
// visiblement en approchant plutôt que de s'arrêter net.
const XARA_GROUND_VEL_GAIN = 4;
// Poses de saut (sol, forme Agarica uniquement — cf. update) : mêmes deux
// rôles que le saut humain (JUMP_RISE_TEXTURE/JUMP_FALL_TEXTURE dans
// Player.js), piochées dans assets/sprites/xara_frames/xara_jump_frames.png
// (frames 1 et 2 : pattes tendues vers l'avant en montée, pattes avant
// tendues vers le bas en retombée — 0 et 3, plus ramassées, ne sont pas
// utilisées ici). Choisies maintenant sur le signe de la vraie vitesse
// verticale (cf. update), plus besoin de suivre une phase d'arc à la main.
const XARA_JUMP_RISE_TEXTURE = 'xara-jump-1';
const XARA_JUMP_FALL_TEXTURE = 'xara-jump-2';
// Vitesse verticale du VRAI saut (même gravité globale que le joueur, cf.
// main.js) -- courte et vive plutôt que calquée sur celui d'Agarica (bien
// plus fort, -680), une puce qui bondit, pas un humain. Avec la gravité du
// jeu (1300), ~96px d'apogée et ~0.77s de vol -- largement de quoi franchir
// les petits vides connus (64-128px) à sa vitesse de rattrapage normale
// ci-dessus, sans awoir besoin d'une ligne droite dédiée comme l'ancienne
// version. Les VRAIS grands vides (le "vide large" de Zone2/Zone4, qui
// demande le double-saut Aigle à Agarica) n'ont jamais besoin d'être
// franchis par ce saut : Agarica y est forcément en forme Aigle à ce
// moment-là, donc Xara y est déjà en balancier (cf. wantState), pas en
// 'ground'.
const XARA_JUMP_VELOCITY = -500;
// Vitesse horizontale figée au décollage SPÉCIFIQUEMENT pour un saut de
// vide (cf. gapAhead plus bas) -- plus rapide que sa vitesse de marche
// normale (XARA_GROUND_CATCHUP_SPEED). Diagnostiqué au frame près (cf.
// historique de ce fichier) : à XARA_GROUND_CATCHUP_SPEED (260px/s), sa
// portée théorique sur la durée totale du saut (~0.769s, cf.
// XARA_JUMP_VELOCITY/gravité) est d'environ 200px -- à peine plus que les
// ~168px à couvrir pour le plus grand vide connu (128px + marge de
// déclenchement anticipée), une marge d'à peine 15% que la moindre
// variation de cadencement (une frame perdue à une collision de coin, cf.
// plus bas) suffisait à manger : elle retombait alors ENCORE trop bas
// avant d'atteindre le sol de l'autre côté, tapant le FLANC de la tuile qui
// reprend plutôt que d'atterrir dessus (un vrai mur, cette fois, puisqu'elle
// est encore sous son sommet) -- bloquée là, retombant, avant de
// (généralement) retenter. Une poussée nettement plus généreuse laisse une
// vraie marge de sécurité, fiable même avec un peu de gigue.
const XARA_JUMP_GAP_BOOST_SPEED = 340;
// Retour utilisateur : "enlève le saut systématique de xara quand le
// joueur saute" -- l'ancien mimétisme (elle sautait chaque fois qu'Agarica
// sautait, même sans aucun vide sur son propre chemin, cf. git history)
// est retiré. Son SEUL déclencheur de saut restant est autonome, plus bas
// dans update() : elle saute uniquement quand ELLE se retrouve bloquée --
// par un mur/une marche (cf. `body.blocked.left/right`, une vraie collision
// désormais) ou par un vrai vide sur son propre chemin (cf. hasGroundNear)
// -- jamais parce qu'Agarica a sauté, et jamais gaté par une distance
// minimale à `followed` (essayé -- retour utilisateur : "elle préfère
// parfois tomber... plutôt que sauter par-dessus un trou" -- un vrai vide
// juste devant elle doit toujours déclencher le saut tant qu'elle essaie
// d'avancer dans ce sens, `followed` proche ou non).
// Portée de la sonde "y a-t-il un sol devant moi" (cf. hasGroundNear) --
// juste assez loin pour détecter un vide avant d'y marcher, pas un vrai
// sondage multi-points comme l'ancienne version (plus nécessaire : la vraie
// physique gère elle-même la suite une fois le saut lancé).
// Retour utilisateur : "elle préfère parfois tomber... plutôt que sauter
// par-dessus un trou" -- diagnostiqué au frame près (cf. historique de ce
// fichier) : à 24px, la sonde ne détectait le vide que 2-3px après son
// vrai bord, une marge bien trop fine à sa vitesse d'approche -- une
// variation d'un seul frame entre deux parties suffisait à la faire
// basculer entre "saute" et "marche tout droit dans le vide" (observé : le
// même scénario réussissait à un cadencement de test et échouait à un
// autre, un vrai signe de marge insuffisante plutôt qu'un vrai bug de
// logique). Relevée pour détecter le vide largement avant d'y être, plus de
// course fixe/marge de sécurité qu'un calcul au pixel près.
const XARA_GROUND_PROBE_AHEAD = 40;
// Portée de la sonde "y a-t-il un mur/une marche devant moi" (cf.
// hasStepAhead) -- délibérément plus longue que XARA_GROUND_PROBE_AHEAD
// ci-dessus (utilisée pour les vides). Retour utilisateur : "elle saute
// trop près des murs quand elle doit en passer un, ça la fait bugger" --
// avec seulement 24px de marge (son propre corps ne fait qu'environ 24px de
// large), le saut se déclenchait alors qu'elle était déjà quasi collée au
// mur : elle continue d'avancer à pleine vitesse pendant les 1-2 frames où
// la gravité annule encore sa vitesse montante (avant de vraiment décoller),
// et pouvait toucher le mur AVANT d'avoir assez d'élan vertical pour le
// dépasser. Une sonde plus longue la fait sauter plus tôt, avec assez de
// distance pour prendre de la hauteur avant d'atteindre le mur.
const XARA_WALL_PROBE_AHEAD = 48;
// Dénivelé (px) au-delà duquel une tuile détectée par `hasStepAhead` compte
// comme une marche/un mur à sauter plutôt que la suite normale du sol plat
// sous ses pieds (un sol plat a un dénivelé ~0, une vraie marche du niveau
// fait un multiple de GROUND_TILE_SIZE=64 -- 20 laisse une marge sans
// déclencher sur du bruit).
const XARA_GROUND_STEP_TRIGGER = 20;
// Dénivelé max : au-delà, ce n'est plus une marche à sauter mais une
// plateforme flottante sans rapport avec son chemin au sol (ex : celle de
// Zone1Scene à x=832-1088, 128px au-dessus du sol qu'elle emprunte EN
// DESSOUS) -- sans ce plafond, `hasStepAhead` la détectait quand même
// (n'importe quelle tuile solide plus haute compte, même hors de portée) et
// déclenchait un saut voué à l'échec (apogée ~96px, cf. XARA_JUMP_VELOCITY
// -- jamais assez haut pour l'atteindre), la faisant échouer puis retomber
// sans jamais se rattraper. Plafonné un peu SOUS cette apogée : inutile de
// tenter un saut vers quelque chose qu'il ne pourra de toute façon jamais
// atteindre -- un vrai mur trop haut pour son saut reste alors simplement
// bloquant (elle s'arrête dessus), jusqu'à ce que l'écart avec le joueur
// finisse par déclencher le balancier "franchissement en hauteur" (cf.
// XARA_CLIMB_HEIGHT_THRESHOLD), déjà prévu pour ce cas.
const XARA_GROUND_STEP_MAX_TRIGGER = 90;
const XARA_SWING_OFFSET_X = -38;
const XARA_SWING_OFFSET_Y = -95;
// Bulle : flotte juste à côté du joueur (un peu plus haut que ses pieds,
// façon "flotte dans l'eau" plutôt que posée dessus).
const XARA_BUBBLE_OFFSET_X = -42;
const XARA_BUBBLE_OFFSET_Y = -30;
const XARA_BUBBLE_RADIUS = 30;
const XARA_BUBBLE_COLOR = 0x9fe6e0;

// Balancier : vrai pendule (code, pas anim) — pivot FIXE tant qu'un swing
// est en cours (jamais suivi/lissé en continu, retour utilisateur), fil et
// sprite dérivés de la même géométrie donc toujours alignés. Façon
// Spider-Man : chaque toile est envoyée EN AVANT (sens `facingDir`) DEPUIS
// SA POSITION ACTUELLE — jamais depuis le joueur, jamais un saut — relancée
// pile au sommet de l'amplitude (vitesse angulaire nulle, le moment naturel
// pour lâcher et relancer), jamais selon une distance parcourue.
// Distance du nouveau pivot par rapport à sa position actuelle. Assez
// grande (avec XARA_SWING_SPEED plus bas) pour que sa vitesse d'avance
// moyenne dépasse celle du Loup en sprint (wolfMaxSpeed = 396 dans
// Player.js) — sinon elle prenait du retard sans jamais le rattraper tant
// qu'il sprintait.
const XARA_SWING_REACH = 280;
// Sous cette distance (en x) du joueur réellement visé (`followed`, avec
// délai), une relance ne repart PAS plus loin en avant : elle reste sur le
// pivot déjà en cours, à se balancer sur place, jusqu'à ce que le joueur
// s'éloigne de nouveau. Sans ce garde-fou, une fois lancée dans un sens
// elle continuait de relancer des toiles plus loin dans ce même sens à
// chaque sommet d'amplitude indéfiniment, même rattrapée ou le joueur
// reparti dans l'autre sens ("avance en boucle" au lieu de s'adapter).
const XARA_SWING_CATCHUP_GAP = 70;
// Distance minimale d'une relance malgré tout (évite un micro-bond ridicule
// quand elle est déjà presque à portée mais pas encore sous le seuil ci-dessus).
const XARA_SWING_MIN_REACH = 60;
// Retour utilisateur : "la logique qui lâche son fil pour marcher quand
// j'arrête de courir est bien mais pas optimal, il faudrait qu'elle
// continue en fil jusqu'à être assez proche puis lâcher et marcher". Sans ce
// seuil, `wantState` (cf. update) repassait à 'ground' dès que la forme
// redevenait 'agarica' (fin de sprint Loup/plané Aigle), quelle que soit sa
// distance réelle au joueur À CET INSTANT PRÉCIS -- elle pouvait se
// retrouver à marcher depuis très loin derrière au lieu de finir de le
// rejoindre en se balançant, déjà en mouvement, pendant qu'elle y est. Même
// ordre de grandeur que XARA_SWING_CATCHUP_GAP (déjà "assez proche" pour que
// le balancier lui-même arrête d'avancer plus loin), donc un point d'arrêt
// cohérent pour se poser au sol juste après.
const XARA_SWING_EXIT_RANGE = 70;
const XARA_SWING_PIVOT_MARGIN_TOP = 20; // hauteur du pivot depuis le haut de l'écran
const XARA_SWING_MAX_ANGLE = Phaser.Math.DegToRad(24);
// Cf. XARA_SWING_REACH ci-dessus : relancée plus souvent (période plus
// courte entre deux sommets d'amplitude) pour que la vitesse moyenne
// d'avance suive le sprint du Loup.
const XARA_SWING_SPEED = 0.0055;
// Marge angulaire pour détecter "au sommet de l'amplitude" (sin proche de
// ±1) sans dépendre d'une égalité flottante exacte.
const XARA_SWING_PEAK_EPSILON = Phaser.Math.DegToRad(1.5);
// À chaque relance, position ET inclinaison glissent depuis leur valeur
// réelle juste avant le lancer vers celles du nouveau pendule sur cette
// durée (cf. swingBlendFrom* plus bas), au lieu d'un cut net.
const XARA_SWING_RELAUNCH_BLEND_MS = 200;

// Franchissement en hauteur (ex: Agarica monté sur une plateforme
// surélevée, cf. Zone1Scene à x=950, 144px au-dessus du sol — bien au-delà
// de la portée de son propre saut, cf. XARA_JUMP_VELOCITY) : au lieu
// d'essayer de sauter aussi haut, elle bascule TEMPORAIREMENT en balancier
// (même mécanique que Loup/Aigle, cf. update) pour grimper, même si la
// forme d'Agarica reste 'agarica' — un fil envoyé vers le haut de l'écran,
// dont la longueur suit déjà l'altitude du joueur (cf. `length` dans
// update), la fait naturellement remonter en se balançant.
const XARA_CLIMB_HEIGHT_THRESHOLD = 70;
// Retour utilisateur : "elle essaie de me rejoindre en hauteur... même
// quand je monte que d'une tuile de haut" -- repro trouvée en pilotant
// réellement le joueur par-dessus la petite marche surélevée d'une tuile de
// Zone1Scene (groundRow(27,29,[6,7,8]), 64px, sous XARA_CLIMB_HEIGHT_THRESHOLD
// donc censée ne PAS déclencher) : `target.onGround` (cf. Player.js,
// `body.blocked.down || body.touching.down`) peut être vrai UNE SEULE frame
// en "éraflant" le coin de la marche en pleine trajectoire de saut, alors
// que la vitesse verticale reste grande (pas un vrai atterrissage) -- cet
// aléa de collision suffisait, l'espace d'une frame, à faire lire un écart
// bien plus grand que les 64px réels de la marche (le joueur, pas encore
// posé, est momentanément bien plus haut que ne l'indique un atterrissage
// stable), au-delà du seuil. Exigée en continu sur cette durée avant de
// croire l'écart : une vraie plateforme surélevée le garde trivialement
// vrai bien plus longtemps que ça, un effleurement de coin ne dure qu'une
// frame (~16ms) et ne passe jamais ce filtre.
const XARA_CLIMB_CONFIRM_MS = 120;
// Ne déclenche PAS tant qu'elle n'est pas déjà raisonnablement proche
// horizontalement : la transition sol -> balancier interpole sa position
// sur une durée FIXE
// (~270ms, cf. XARA_TRANSITION_FRAME_MS/COUNT), quelle que soit la distance
// à parcourir — sans ce garde-fou, un grand écart de hauteur détecté alors
// qu'elle est encore loin derrière (ex: juste après un changement de zone)
// la faisait "warper" en ligne droite sur tout l'écran en une fraction de
// seconde pour rejoindre l'ancrage du balancier, traversant visuellement
// tout le décor entre les deux — signalé par l'utilisateur ("elle passe
// dans le sol... au lieu de monter ou descendre en prenant en compte les
// hitbox", après avoir écarté la vitesse de rattrapage comme cause). En
// dessous de cette portée, elle continue de marcher normalement au sol
// (donc au bon niveau) jusqu'à être assez proche pour que la transition ne
// couvre plus qu'une petite distance, cohérente avec sa durée fixe.
const XARA_CLIMB_TRIGGER_RANGE = 250;
// Durée de balancement APRÈS être arrivée en balancier, avant de redescendre
// se poser (cf. climbUntil dans update) — PAS une comparaison de hauteur en
// direct : le point d'ancrage du balancier plane volontairement bien
// au-dessus du joueur (XARA_SWING_OFFSET_Y, -95, le même look que le
// sprint Loup/Aigle), donc "est-elle assez haute par rapport à lui ?" est
// PRESQUE TOUJOURS vrai dès la toute première frame en balancier, quelle
// que soit la hauteur réelle grimpée — comparer en direct la faisait
// redescendre aussitôt arrivée (aucun balancement visible). Une minuterie
// fixe, non proportionnelle à la hauteur, suffit : le fil (cf. transition
// sol -> balancier, ~270ms) l'a déjà amenée à la bonne altitude AVANT même
// que ce délai démarre.
const XARA_CLIMB_DWELL_MS = 450;

// Bascule sol <-> balancier : 3 poses de transition, jouées dans un sens ou
// l'autre selon la direction, pendant que la position glisse de l'ancrage
// de départ vers celui d'arrivée.
const XARA_TRANSITION_FRAME_MS = 90;
const XARA_TRANSITION_FRAME_COUNT = 3;
// Bascule sol <-> bulle (entrée/sortie d'eau) : portion de cette même fenêtre
// passée à "sauter" (poses de saut réutilisées) avant que la bulle
// apparaisse (ou, en sortant, portion passée à faire disparaître la bulle
// avant de "sauter" pour retomber) — jamais un fondu qui démarre en même
// temps que le saut.
const XARA_BUBBLE_JUMP_FRACTION = 0.5;

// Sens affiché : suit directement le signe de (followed.x - this.x), càd
// "de quel côté ai-je besoin d'avancer pour continuer à suivre" — jamais un
// délai/seuil de distance séparé (essayé, deux fois : ça pouvait rester
// bloqué indéfiniment si le joueur ne finissait pas de franchir le seuil, et
// donnait un mouvement qui "attend une distance" plutôt que "se tourne
// quand elle en a besoin", décrit comme pas naturel). `followed` étant déjà
// délayé (cf. this.history), un simple appui bref qui ne déplace quasiment
// pas le joueur ne fait quasiment pas bouger `followed.x` non plus — la
// petite zone morte ci-dessous absorbe le reste (jitter pile à l'équilibre).
// Reste PETITE (à peine au-dessus de XARA_GROUND_ARRIVED_GAP, le seuil
// "arrivée" qui coupe l'anim de marche) : son déplacement réel au sol, lui,
// n'est PAS filtré par cette zone morte (il suit `followed.x` dès le premier
// pixel d'écart) — une zone morte large (essayé à 20) faisait alors qu'elle
// se mettait à marcher dans le nouveau sens plusieurs frames AVANT que le
// sprite se retourne, un décalage visible entre mouvement réel et sens
// affiché ("elle marche avant de se retourner").
const XARA_FACING_DEADZONE = 8;

function ensureXaraAnimations(scene) {
  if (scene.anims.exists(ANIM_XARA_WALK_KEY)) return;

  scene.anims.create({
    key: ANIM_XARA_WALK_KEY,
    frames: XARA_WALK_FRAME_INDICES.map((i) => ({ key: `xara-walk-${i}` })),
    frameRate: 10,
    repeat: -1,
  });
}

class Xara extends Phaser.GameObjects.Sprite {
  constructor(scene, target) {
    ensureXaraAnimations(scene);

    // Fil de soie : tracé sous la sprite (créé avant), visible seulement en
    // balancier (et pendant la bascule vers/depuis cet état).
    const thread = scene.add.graphics().setDepth(CHARACTER_DEPTH);

    super(scene, target.x + XARA_GROUND_OFFSET_X, target.y + XARA_GROUND_OFFSET_Y, `xara-walk-${XARA_WALK_FRAME_INDICES[0]}`);
    scene.add.existing(this);
    this.setOrigin(0.5, 1);
    this.setScale(XARA_SCALE);
    // Compagnon : devant les décors comme Agarica (cf. CHARACTER_DEPTH dans
    // LevelKit.js) ; son fil, créé juste avant, reste dessiné sous elle.
    this.setDepth(CHARACTER_DEPTH);

    // Retour utilisateur : "il faudrait que xara ait une hitbox aussi pour
    // simplifier son comportement pour les distances ou les hitbox des
    // plateformes" -- un vrai corps Arcade Physics, comme le joueur (même
    // gravité globale, cf. main.js ; même groupe `scene.ground`, cf. le
    // collider ci-dessous). Petit, centré sur son corps visible (canvas
    // 292x320, contenu mesuré à (11,122)-(280,316) -- PIL bbox), pas la
    // pleine planche : "un peu plus petit que l'image", même logique que
    // FORMS.body pour le joueur, ici à la louche vu sa taille modeste.
    scene.physics.add.existing(this);
    this.body.setSize(160, 130);
    this.body.setOffset((292 - 160) / 2, 320 - 130);
    // Seul l'état 'ground' bouge via la vraie physique (cf. update) -- en
    // 'swinging'/'bulle', sa position reste pilotée à la main (pendule/
    // flottaison, cf. update), donc la gravité doit rester coupée pour ne
    // pas lutter contre ce pilotage manuel. Réactivée/coupée à chaque
    // bascule d'état (cf. plus bas).
    this.body.setAllowGravity(true);
    scene.physics.add.collider(this, scene.ground);

    this.thread = thread;
    this.target = target;

    // Sens affiché, indépendant de `target.facingDir` (qui peut changer
    // instantanément sur un simple appui, avant même que le joueur ait
    // vraiment bougé) — cf. XARA_FACING_DEADZONE dans update().
    this.facingDir = target.facingDir < 0 ? -1 : 1;
    // Vitesse horizontale figée au décollage, réaffirmée en l'air -- cf.
    // update, état 'ground'.
    this.airVelX = 0;

    // 'ground' | 'swinging' | 'bubble' : au sol par défaut (immobile en
    // forme humaine au départ de chaque zone).
    this.state = 'ground';
    this.transitionActive = false;
    this.transitionTarget = null; // 'ground' | 'swinging' | 'bubble'
    this.transitionStartTime = 0;
    this.transitionFromX = this.x;
    this.transitionFromY = this.y;
    this.transitionFromRotation = 0;

    // Historique des positions-cibles : Xara vise la position vieille de
    // `delayMs` (temps réel, pas un nombre de frames — cf. update) d'où le
    // léger délai de suivi (GDD : "suit à distance avec délai"). Un compte
    // de frames fixe (l'ancienne implémentation, 18 frames) correspond à un
    // délai réel bien plus long dès que le jeu tourne sous 60fps — observé
    // en jeu : sur du matériel/un contexte plus lent, le retard accumulé
    // (delay × vitesse du joueur) grossissait d'autant plus. Basé sur le
    // temps, le délai réel reste ~300ms quel que soit le framerate.
    this.delayMs = 300;
    this.history = [];
    this.followLerp = 0.15;
    this.swingPhase = Math.random() * Math.PI * 2;
    // Ancrage courant du pendule : FIXE tant qu'un swing est en cours (null
    // = pas encore établi, cf. update). `swingPeakConsumed` évite de
    // relancer plusieurs fois de suite tant qu'on reste proche du sommet
    // (plusieurs frames consécutives peuvent tomber dans la marge d'angle).
    this.swingPivotX = null;
    this.swingPeakConsumed = false;
    // Lissage POSITION + INCLINAISON après une relance (cf. update) : elle
    // jette le nouveau fil sans bouger, la tension du fil la ramène ensuite
    // en douceur sur l'arc du nouveau pendule sur XARA_SWING_RELAUNCH_BLEND_MS
    // plutôt qu'un cut net (position) ou un pivot sec (inclinaison).
    this.swingBlendFromX = null;
    this.swingBlendFromY = null;
    this.swingBlendFromRotation = 0;
    this.swingBlendStart = 0;
    // Cf. XARA_CLIMB_DWELL_MS : instant où elle arrête de grimper (balancier
    // déclenché par un grand écart de hauteur, pas par une forme Loup/Aigle)
    // et redescend se poser.
    this.climbUntil = 0;
    // Cf. XARA_CLIMB_CONFIRM_MS dans update() : depuis quand l'écart de
    // hauteur est vu en continu, avant de le croire.
    this.bigHeightGapSince = null;
  }

  // Position d'ancrage (avant lissage/balancement) pour un état donné.
  anchorFor(state) {
    if (state === 'ground') return { x: this.target.x + XARA_GROUND_OFFSET_X, y: this.target.y + XARA_GROUND_OFFSET_Y };
    if (state === 'bubble') return { x: this.target.x + XARA_BUBBLE_OFFSET_X, y: this.target.y + XARA_BUBBLE_OFFSET_Y };
    return { x: this.target.x + XARA_SWING_OFFSET_X, y: this.target.y + XARA_SWING_OFFSET_Y };
  }

  // Y a-t-il un sol RÉEL (une tuile de `scene.ground`, même groupe que celui
  // du joueur) à peu près à SA hauteur actuelle sous ce x ? Utilisée
  // UNIQUEMENT pour décider si elle doit sauter MAINTENANT pour ne pas
  // marcher dans un vide (état 'ground', cf. update) -- la hauteur/
  // l'atterrissage eux-mêmes n'ont plus besoin d'être suivis à la main
  // depuis qu'elle a un vrai corps Arcade Physics (cf. constructeur) : la
  // gravité + le collider contre `scene.ground` s'en chargent tout seuls,
  // comme pour le joueur. Beaucoup plus simple que l'ancien `groundYAt`
  // (retiré) : plus besoin de choisir entre plusieurs tuiles superposées
  // par "la plus proche d'une hauteur de référence mémorisée" ni d'exclure
  // un plafond de grotte à la main -- comparer à SA PROPRE position réelle
  // suffit, elle est désormais fiable.
  hasGroundNear(x) {
    const groundGroup = this.scene.ground;
    if (!groundGroup) return true;
    let found = false;
    groundGroup.children.iterate((tile) => {
      if (found || !tile || !tile.active) return;
      const half = tile.displayWidth / 2;
      if (x < tile.x - half || x > tile.x + half) return;
      const surfaceY = tile.body ? tile.body.top : tile.y - tile.displayHeight / 2;
      if (Math.abs(surfaceY - this.y) < XARA_GROUND_PROBE_AHEAD * 2) found = true;
    });
    return found;
  }

  // Y a-t-il une marche/un mur devant elle (une tuile dont la surface est
  // nettement plus HAUTE que sa position actuelle) ? Détection par hauteur,
  // à distance, plutôt que par contact physique (`body.blocked.right`) --
  // observé : attendre le contact réel produit un "coin piège" (elle se
  // retrouve pile collée à l'angle sol/mur, `body.blocked` oscille entre
  // haut/bas sans jamais avancer, cf. diagnostic ayant motivé cette
  // fonction) puisque le sol sous elle et le mur devant partagent un coin
  // exact. En sautant un peu AVANT le contact (cf. XARA_GROUND_PROBE_AHEAD),
  // elle a toujours un peu de marge horizontale pour monter sans jamais
  // rester collée au mur.
  hasStepAhead(x) {
    const groundGroup = this.scene.ground;
    if (!groundGroup) return false;
    let found = false;
    groundGroup.children.iterate((tile) => {
      if (found || !tile || !tile.active) return;
      const half = tile.displayWidth / 2;
      if (x < tile.x - half || x > tile.x + half) return;
      const surfaceY = tile.body ? tile.body.top : tile.y - tile.displayHeight / 2;
      const diff = this.y - surfaceY;
      // Cf. XARA_GROUND_STEP_MAX_TRIGGER : au-delà, hors de portée de son
      // saut -- pas une marche à sauter, ignorée (ex : une plateforme
      // flottante bien au-dessus du chemin qu'elle emprunte en dessous).
      if (diff > XARA_GROUND_STEP_TRIGGER && diff <= XARA_GROUND_STEP_MAX_TRIGGER) found = true;
    });
    return found;
  }

  update(time, delta) {
    // Bascule en balancier même en forme 'agarica' si Agarica est monté
    // bien plus haut qu'elle (cf. XARA_CLIMB_HEIGHT_THRESHOLD) : son simple
    // saut au sol (cf. XARA_JUMP_VELOCITY) ne peut pas grimper une vraie
    // plateforme surélevée. `climbingNow` (état RÉEL 'swinging' en forme
    // 'agarica' : jamais le cas pour un vrai sprint Loup/Aigle) grimpe pour
    // XARA_CLIMB_DWELL_MS PUIS redescend — PAS tant qu'elle est "assez
    // haute" en comparant en direct (cf. commentaire sur la constante :
    // l'ancrage du balancier plane déjà bien au-dessus du joueur par
    // conception, donc cette comparaison était systématiquement vraie dès
    // la 1re frame, la faisant redescendre aussitôt montée).
    // N'évalue l'écart QUE si Agarica est POSÉ (`target.onGround`), jamais
    // en plein saut : son arc de saut normal culmine déjà à ~178px
    // (jumpVelocity=-680, gravity=1300, cf. Player.js/main.js) — bien
    // au-delà du seuil ci-dessous — donc comparer en direct pendant qu'il
    // est en l'air déclenchait le balancier à CHAQUE saut, même retombant
    // pile sur le même sol, avant même de savoir où il allait atterrir.
    const climbingNow = this.target.form === 'agarica' && this.state === 'swinging';
    // Retour utilisateur : "elle préfère parfois tomber et se mettre en
    // balancier pour remonter plutôt que sauter par-dessus un trou quand je
    // suis de l'autre côté" -- en pleine traversée d'un vide (son propre
    // saut, cf. état 'ground'), elle se retrouve MOMENTANÉMENT bien plus
    // bas que le joueur (normal, elle est encore en l'air au-dessus du
    // trou) : sans ce garde-fou, ça suffisait à dépasser
    // XARA_CLIMB_HEIGHT_THRESHOLD pendant plus de XARA_CLIMB_CONFIRM_MS et
    // annulait le saut en cours pour basculer en balancier, alors qu'elle
    // avait déjà assez d'élan horizontal pour atterrir normalement de
    // l'autre côté. Exigée POSÉE (comme `target.onGround` protège déjà côté
    // joueur juste au-dessus) : ne se déclenche qu'une fois stable au sol,
    // jamais en plein vol sur son propre saut.
    const xaraGrounded = this.state === 'ground' && (this.body.blocked.down || this.body.touching.down);
    const rawBigHeightGap = this.target.form === 'agarica' && !climbingNow && this.target.onGround && xaraGrounded
      && Math.abs(this.x - this.target.x) <= XARA_CLIMB_TRIGGER_RANGE
      && (this.y - this.target.y) > XARA_CLIMB_HEIGHT_THRESHOLD;
    // Cf. XARA_CLIMB_CONFIRM_MS : exige l'écart en continu sur cette durée
    // avant de le croire, pas juste une frame isolée (effleurement de coin).
    if (rawBigHeightGap) {
      if (this.bigHeightGapSince === null) this.bigHeightGapSince = time;
    } else {
      this.bigHeightGapSince = null;
    }
    const bigHeightGap = rawBigHeightGap && (time - this.bigHeightGapSince) >= XARA_CLIMB_CONFIRM_MS;
    if (bigHeightGap) {
      this.climbUntil = time + XARA_CLIMB_DWELL_MS;
    }
    const needsClimb = bigHeightGap || (climbingNow && time < this.climbUntil);
    // Cf. XARA_SWING_EXIT_RANGE : ne lâche pas le fil dès que la forme
    // redevient 'agarica' (fin de sprint Loup/plané Aigle) si elle est
    // encore loin derrière -- continue de se balancer (donc d'avancer) tant
    // qu'elle n'est pas raisonnablement proche, PUIS se pose et marche.
    const stillFarWhileSwinging = this.state === 'swinging' && !needsClimb
      && this.target.form === 'agarica'
      && Math.abs(this.x - this.target.x) > XARA_SWING_EXIT_RANGE;
    const wantState = this.target.form === 'octopus' ? 'bubble'
      : (this.target.form !== 'agarica' || needsClimb || stillFarWhileSwinging) ? 'swinging'
      : 'ground';
    if (!this.transitionActive && wantState !== this.state) {
      this.transitionActive = true;
      this.transitionTarget = wantState;
      this.transitionStartTime = time;
      // Position/inclinaison RÉELLES au moment de basculer (pas la formule
      // `anchorFor()`, qui ne représente plus du tout où elle est une fois
      // en balancier — pendule sur pivot, souvent loin devant le joueur) :
      // sans cette capture, arrêter de courir la faisait réapparaître d'un
      // coup près des pieds du joueur au lieu de revenir en douceur depuis
      // là où elle se balançait vraiment.
      this.transitionFromX = this.x;
      this.transitionFromY = this.y;
      this.transitionFromRotation = this.rotation;
      // Cf. constructeur : seul l'état 'ground' avance via la vraie
      // physique -- coupée en quittant 'ground' (position pilotée à la main
      // pendant la bascule ET tant qu'elle est en balancier/bulle, sinon la
      // gravité "lutterait" contre ce pilotage), vitesse résiduelle purgée
      // pour ne pas resurgir au prochain retour en 'ground'.
      if (this.state === 'ground') {
        this.body.setAllowGravity(false);
        this.body.setVelocity(0, 0);
      }
    }

    // Ligne à retard basée sur le TEMPS (pas un compte de frames fixe, cf.
    // constructeur) : garde le plus vieil enregistrement tant que le
    // suivant est encore trop récent pour représenter `time - delayMs`.
    this.history.push({ ...this.anchorFor(wantState), time });
    while (this.history.length > 1 && this.history[1].time <= time - this.delayMs) {
      this.history.shift();
    }
    const followed = this.history[0];

    // Sens affiché : le signe de "où j'ai besoin d'aller pour la suivre",
    // recalculé à neuf chaque frame — jamais un état figé qui pourrait
    // rester bloqué (cf. XARA_FACING_DEADZONE). `followed` étant déjà
    // délayé, un simple appui bref qui ne déplace quasiment pas le joueur
    // ne fait quasiment pas bouger `followed.x` non plus : la zone morte
    // absorbe le reste (jitter pile à l'équilibre), sans avoir besoin d'un
    // seuil de distance séparé.
    const facingDx = followed.x - this.x;
    if (Math.abs(facingDx) > XARA_FACING_DEADZONE) {
      this.facingDir = Math.sign(facingDx);
    }

    if (this.transitionActive) {
      const elapsed = time - this.transitionStartTime;
      const totalDuration = XARA_TRANSITION_FRAME_COUNT * XARA_TRANSITION_FRAME_MS;
      if (elapsed >= totalDuration) {
        this.transitionActive = false;
        this.state = this.transitionTarget;
        // Pivot ré-établi à zéro à chaque nouvelle entrée en balancier,
        // jamais une valeur périmée d'une session de balancier précédente.
        if (this.state !== 'swinging') { this.swingPivotX = null; this.swingBlendFromX = null; }
        // Réactive la vraie physique en entrant en 'ground' (cf. coupée à la
        // sortie plus haut) : elle attérit exactement où la transition vient
        // de la poser, la gravité prend le relais dès la frame suivante.
        if (this.state === 'ground') this.body.setAllowGravity(true);
      } else {
        const progress = elapsed / totalDuration;
        const toAnchor = this.anchorFor(this.transitionTarget);
        // Sortie du balancier vers le sol (arrêt du sprint) : elle ne glisse
        // PAS d'un coup jusqu'au joueur pendant cette fenêtre de 270ms — elle
        // peut être loin en avant après un enchaînement de relances, et un
        // lerp sur une durée fixe la ferait alors traverser cette distance
        // à toute vitesse (perçu comme une téléportation). Elle tombe droit
        // à la verticale depuis où le balancier l'a laissée (x figé) ; une
        // fois au sol, le rattrapage habituel (lerp + délai, cf. plus bas)
        // la ramène ensuite en marchant, sur autant de temps qu'il faut.
        const fallingInPlace = this.state === 'swinging' && this.transitionTarget === 'ground';
        this.x = fallingInPlace ? this.transitionFromX : Phaser.Math.Linear(this.transitionFromX, toAnchor.x, progress);
        this.y = Phaser.Math.Linear(this.transitionFromY, toAnchor.y, progress);
        // Inclinaison ramenée à plat en douceur (elle pouvait être penchée
        // jusqu'à ±24° en sortant du balancier), jamais un cut net non plus.
        this.setRotation(Phaser.Math.Linear(this.transitionFromRotation, 0, progress));
        this.setFlipX(this.facingDir < 0);

        const groundSwingSwap = (this.state === 'ground' && this.transitionTarget === 'swinging')
          || (this.state === 'swinging' && this.transitionTarget === 'ground');
        const groundBubbleSwap = (this.state === 'ground' && this.transitionTarget === 'bubble')
          || (this.state === 'bubble' && this.transitionTarget === 'ground');
        if (groundSwingSwap) {
          const goingToSwing = this.transitionTarget === 'swinging';
          const frameIdx = Math.min(
            XARA_TRANSITION_FRAME_COUNT - 1,
            Math.floor(elapsed / XARA_TRANSITION_FRAME_MS),
          );
          const orderedFrame = goingToSwing ? frameIdx + 1 : XARA_TRANSITION_FRAME_COUNT - frameIdx;
          this.anims.stop();
          this.setTexture(`xara-switch-${orderedFrame}`);
          // Le fil grandit en allant vers le balancier, rétrécit en
          // revenant au sol : la progression pilote directement sa longueur.
          this.drawThread(goingToSwing ? progress : 1 - progress);
          this.drawBubble(0);
        } else if (groundBubbleSwap) {
          // Entrée dans l'eau : elle "saute" (poses de saut réutilisées)
          // pendant la 1re moitié de la fenêtre, la bulle n'apparaît qu'une
          // fois cette moitié terminée — jamais un fondu qui démarre en même
          // temps que le saut. Sortie d'eau : séquence inversée, la bulle
          // disparaît d'abord, puis elle "saute" pour retomber au sol.
          const enteringWater = this.transitionTarget === 'bubble';
          let hopLocalT = null; // 0..1, toujours croissant dans le temps réel pendant le saut
          let bubbleAlpha = 0;
          if (enteringWater) {
            if (progress < XARA_BUBBLE_JUMP_FRACTION) {
              hopLocalT = progress / XARA_BUBBLE_JUMP_FRACTION;
            } else {
              bubbleAlpha = (progress - XARA_BUBBLE_JUMP_FRACTION) / (1 - XARA_BUBBLE_JUMP_FRACTION);
            }
          } else if (progress < 1 - XARA_BUBBLE_JUMP_FRACTION) {
            bubbleAlpha = 1 - progress / (1 - XARA_BUBBLE_JUMP_FRACTION);
          } else {
            hopLocalT = (progress - (1 - XARA_BUBBLE_JUMP_FRACTION)) / XARA_BUBBLE_JUMP_FRACTION;
          }
          this.anims.stop();
          this.setTexture(hopLocalT === null ? 'xara-swing-0' : (hopLocalT < 0.5 ? XARA_JUMP_RISE_TEXTURE : XARA_JUMP_FALL_TEXTURE));
          this.drawThread(0);
          this.drawBubble(bubbleAlpha);
        } else {
          // Balancier <-> bulle (cas rare, ex: plané Aigle retombant droit
          // dans l'eau) : pas de poses dédiées, simple fondu.
          const goingToBubble = this.transitionTarget === 'bubble';
          this.anims.stop();
          this.setTexture('xara-swing-0');
          this.drawThread(0);
          this.drawBubble(goingToBubble ? progress : 1 - progress);
        }
        return;
      }
    }

    if (this.state === 'ground') {
      // Retour utilisateur : "xara se téléporte pendant ses sauts au lieu
      // de les faire en entier ou de se déplacer à la bonne distance d'un
      // mur ou d'un vide pour le faire" + "il faudrait que xara ait une
      // hitbox aussi pour simplifier son comportement pour les distances ou
      // les hitbox des plateformes" -- cet état entier tourne maintenant sur
      // le VRAI corps Arcade Physics posé au constructeur (gravité +
      // collider contre scene.ground) au lieu de suivre un `groundBaselineY`
      // calculé à la main frame par frame avec un arc sinusoïdal cosmétique
      // par-dessus. Beaucoup plus court que l'ancienne version (cf. git
      // history) : la hauteur, l'atterrissage, le blocage par un mur/une
      // marche sont tous gérés par la physique elle-même, plus besoin de
      // sonder/mémoriser quoi que ce soit à la main pour ça.
      const distanceToFollowed = Math.abs(this.x - followed.x);
      const grounded = this.body.blocked.down || this.body.touching.down;

      // Retour utilisateur : "elle préfère parfois tomber et se mettre en
      // balancier pour remonter plutôt que sauter par-dessus un trou quand
      // je suis de l'autre côté" -- la vitesse horizontale était recalculée
      // à CHAQUE frame (y compris en plein saut) d'après l'écart courant à
      // `followed`. Si ce dernier (délayé, cf. this.history) se rapprochait
      // ou repassait derrière elle PENDANT le vol (le joueur ralentit/
      // s'arrête juste après le vide), ça freinait ou inversait sa poussée
      // horizontale EN PLEIN SAUT, la faisant retomber court dans le trou
      // au lieu de le franchir -- une fois tombée assez bas, l'écart de
      // hauteur avec le joueur dépassait XARA_CLIMB_HEIGHT_THRESHOLD et
      // déclenchait à tort le balancier "franchissement en hauteur" pour en
      // ressortir, au lieu d'un simple saut raté.
      //
      // En l'air, elle garde donc la vitesse horizontale qu'elle avait au
      // décollage (`this.airVelX`, mémorisée juste avant, PAS recalculée
      // depuis `followed` pendant le vol) -- mais RÉAFFIRMÉE chaque frame
      // (pas juste laissée telle quelle) : un saut contre un mur/une marche
      // la fait taper le CÔTÉ du mur en montant (avant d'avoir dépassé sa
      // hauteur), ce qui met `body.velocity.x` à 0 (séparation Arcade) --
      // sans la réaffirmer, elle restait ensuite bloquée là, incapable de
      // se replaquer contre le mur pour finir de passer par-dessus une fois
      // assez montée (régression observée en corrigeant le cas du trou :
      // elle restait figée pile contre la marche de Zone1Scene).
      let moveDir = this.facingDir;
      if (grounded) {
        // Horizontale : approche proportionnelle vers `followed.x`
        // (plafonnée à XARA_GROUND_CATCHUP_SPEED), exprimée en vraie
        // vitesse maintenant qu'un corps physique existe -- remplace
        // l'ancien lerp position par position. Nulle une fois assez proche
        // (XARA_GROUND_ARRIVED_GAP) pour ne pas trembler sur place.
        const dx = followed.x - this.x;
        const desiredVelX = Phaser.Math.Clamp(dx * XARA_GROUND_VEL_GAIN, -XARA_GROUND_CATCHUP_SPEED, XARA_GROUND_CATCHUP_SPEED);
        this.airVelX = distanceToFollowed > XARA_GROUND_ARRIVED_GAP ? desiredVelX : 0;
        this.body.setVelocityX(this.airVelX);

        // Sens du prochain pas (pas `facingDir`, qui a sa propre zone morte
        // et peut donc être en retard d'une frame ou deux sur `desiredVelX`)
        // pour sonder/bloquer dans le BON sens.
        moveDir = Math.sign(desiredVelX) || this.facingDir;
      } else {
        this.body.setVelocityX(this.airVelX);
      }
      // Bloquée par un mur/une marche devant elle, détecté par hauteur (cf.
      // hasStepAhead) plutôt que par contact physique (`body.blocked.right`
      // seul) : attendre le contact réel produisait un coin piège exact
      // sol/mur où elle restait bloquée indéfiniment (cf. historique de ce
      // fichier) -- sauter un peu avant le contact laisse toujours de la
      // marge horizontale pour vraiment monter. `body.blocked` gardé en
      // second recours pour un mur qui échapperait à la sonde (ex : bord du
      // monde). Seulement pendant qu'elle essaie vraiment d'avancer dans ce
      // sens (sinon elle sauterait sur place devant une marche sans même
      // chercher à s'en approcher).
      const wantsToMove = distanceToFollowed > XARA_GROUND_ARRIVED_GAP;
      const blockedAhead = grounded && wantsToMove
        && (this.hasStepAhead(this.x + moveDir * XARA_WALL_PROBE_AHEAD)
          || (moveDir > 0 ? this.body.blocked.right : this.body.blocked.left));
      // Un vrai vide s'ouvre devant elle (cf. hasGroundNear), tant qu'elle
      // essaie vraiment d'avancer dans ce sens (`wantsToMove`, même garde
      // que `blockedAhead` ci-dessus -- pas juste XARA_JUMP_STALL_TRIGGER_GAP
      // seul). Retour utilisateur : "elle préfère parfois tomber... plutôt
      // que sauter par-dessus un trou" -- ancien seuil basé UNIQUEMENT sur
      // la distance à `followed` (delayed, cf. this.history) : si le joueur
      // venait tout juste de franchir le vide, `followed` pouvait encore
      // traîner tout près d'elle (< XARA_JUMP_STALL_TRIGGER_GAP) alors
      // qu'elle avait encore un vrai vide devant elle -- aucun saut ne se
      // déclenchait, elle marchait alors tout droit hors du bord (locomotion
      // normale, rien ne l'arrêtait) et tombait, parfois indéfiniment si le
      // vide n'a pas de fond. `wantsToMove` seul suffit : elle ne s'approche
      // jamais du bord d'un vide sans essayer d'avancer vers `followed`.
      const gapAhead = grounded && wantsToMove
        && !this.hasGroundNear(this.x + moveDir * XARA_GROUND_PROBE_AHEAD);
      // `body.velocity.y >= 0` (jamais en train de déjà monter) : contre un
      // mur, `grounded` (blocked.down) peut rester vrai un coin de frame
      // même juste après avoir sauté (contact simultané mur+sol au moment
      // du décollage) -- sans ce garde-fou, ça REMETTAIT la vitesse
      // verticale à XARA_JUMP_VELOCITY à CHAQUE frame tant qu'elle restait
      // pressée contre le mur, l'empêchant de jamais vraiment monter
      // (observé : bloquée indéfiniment contre la marche de Zone1Scene).
      if (grounded && this.body.velocity.y >= 0 && (blockedAhead || gapAhead)) {
        this.body.setVelocityY(XARA_JUMP_VELOCITY);
        // Vitesse horizontale figée à PLEINE vitesse au décollage (pas la
        // valeur proportionnelle du contrôleur de suivi à cet instant précis,
        // cf. `this.airVelX` plus haut) -- retour utilisateur : "elle
        // préfère parfois tomber... plutôt que sauter par-dessus un trou".
        // Diagnostiqué : si `followed` (délayé) n'était pas encore assez
        // loin devant au moment PRÉCIS du saut (le joueur lui-même en train
        // de franchir le même vide, par exemple), la vitesse proportionnelle
        // pouvait être bien EN DESSOUS du plafond -- pas assez pour
        // franchir un vide large (128px) dans le temps de vol disponible,
        // la faisant retomber dedans avant d'avoir traversé. Un saut
        // au-dessus d'un vide vise à le franchir, point : vitesse fixée
        // systématiquement, jamais une fraction proportionnelle à un écart
        // qui peut être n'importe quoi à cet instant précis -- et,
        // spécifiquement pour un vide (cf. XARA_JUMP_GAP_BOOST_SPEED), plus
        // rapide que sa marche normale pour garder une vraie marge de
        // sécurité. Appliquée tout de suite (pas seulement mémorisée pour la
        // prochaine frame) : le pas de physique qui suit CETTE frame utilise
        // déjà cette vitesse.
        this.airVelX = moveDir * (gapAhead ? XARA_JUMP_GAP_BOOST_SPEED : XARA_GROUND_CATCHUP_SPEED);
        this.body.setVelocityX(this.airVelX);
      }
      this.setRotation(0);

      const walking = distanceToFollowed > XARA_GROUND_ARRIVED_GAP;
      if (!grounded) {
        this.anims.stop();
        this.setTexture(this.body.velocity.y < 0 ? XARA_JUMP_RISE_TEXTURE : XARA_JUMP_FALL_TEXTURE);
      } else if (walking) {
        this.anims.play(ANIM_XARA_WALK_KEY, true);
      } else {
        this.anims.stop();
        this.setTexture(`xara-walk-${XARA_WALK_FRAME_INDICES[0]}`);
      }
      this.drawThread(0);
      this.drawBubble(0);
    } else if (this.state === 'bubble') {
      // Bulle : pas d'art dédié pour nager, donc suivi simple comme au sol
      // (même léger délai), sans balancier — elle flotte juste à côté du
      // joueur, reliée à lui par un fil.
      this.x = Phaser.Math.Linear(this.x, followed.x, this.followLerp);
      this.y = Phaser.Math.Linear(this.y, followed.y, this.followLerp);
      this.setRotation(0);
      this.anims.stop();
      this.setTexture('xara-swing-0');
      this.drawThread(0);
      this.drawBubble(1);
    } else {
      // Balancier : vrai pendule, pivot FIXE tant qu'un swing est en cours
      // (jamais suivi/lissé en continu, retour utilisateur). Une nouvelle
      // toile n'est relancée, plus loin en avant, que pile au sommet de
      // l'amplitude (vitesse angulaire nulle).
      const pivotY = this.scene.cameras.main.scrollY + XARA_SWING_PIVOT_MARGIN_TOP;
      // Longueur recalculée en continu (pas figée à l'ancrage) : suit
      // doucement l'altitude du joueur (utile en plané Aigle) sans casser
      // le balancement, qui reste piloté par l'angle seul.
      const length = Math.max(40, followed.y - pivotY);

      this.swingPhase += delta * XARA_SWING_SPEED;
      let angle = Math.sin(this.swingPhase) * XARA_SWING_MAX_ANGLE;
      const atPeak = Math.abs(angle) > XARA_SWING_MAX_ANGLE - XARA_SWING_PEAK_EPSILON;
      if (this.swingPivotX === null || (atPeak && !this.swingPeakConsumed)) {
        const isInitialPivot = this.swingPivotX === null;
        const distanceToFollowedX = followed.x - this.x;
        // Cf. XARA_SWING_CATCHUP_GAP : une fois assez proche du joueur réel,
        // ne relance plus en avant — reste sur le pivot courant (elle
        // continue de se balancer dessus via le sin() normal plus bas).
        const closeEnough = !isInitialPivot && Math.abs(distanceToFollowedX) < XARA_SWING_CATCHUP_GAP;
        if (!closeEnough) {
          // Sens ET distance dérivés de la position RÉELLE du joueur suivi
          // (pas juste `target.facingDir`, périmé dès qu'il s'arrête ou
          // change de sens) — c'est ça qui la fait "s'adapter" plutôt que
          // de continuer sur son dernier élan.
          const dir = isInitialPivot
            ? this.target.facingDir
            : (Math.sign(distanceToFollowedX) || this.target.facingDir);
          const reach = Math.min(XARA_SWING_REACH, Math.max(XARA_SWING_MIN_REACH, Math.abs(distanceToFollowedX)));
          // Capture la position ET l'inclinaison RÉELLES juste avant ce
          // nouveau départ : elle jette le nouveau fil SANS bouger (le
          // lissage plus bas glisse ensuite depuis ces valeurs vers celles
          // du nouveau pendule — jamais un cut net).
          this.swingBlendFromX = this.x;
          this.swingBlendFromY = this.y;
          this.swingBlendFromRotation = this.rotation;
          this.swingBlendStart = time;
          this.swingPivotX = this.x + dir * reach;
          // Point de départ TOUJOURS valide (pile ±XARA_SWING_MAX_ANGLE,
          // jamais au-delà) : elle repart de l'extrémité derrière le nouveau
          // pivot, le point de départ naturel d'un swing lancé vers l'avant
          // dans le sens `dir`. L'ANCIENNE approche résolvait un angle qui
          // aurait dû reproduire sa position exacte sur le nouveau pivot —
          // cet angle pouvait dépasser XARA_SWING_MAX_ANGLE (`length` petit
          // + `reach` grand, typiquement à haute vitesse de sprint), et la
          // frame suivante retombait alors brutalement dans la plage valide :
          // le téléportement signalé en jeu. Ici, jamais hors plage, donc
          // jamais de correction brutale ensuite — juste le lissage normal.
          this.swingPhase = dir > 0 ? -Math.PI / 2 : Math.PI / 2;
          angle = Math.sin(this.swingPhase) * XARA_SWING_MAX_ANGLE;
        }
      }
      this.swingPeakConsumed = atPeak;
      const pivotX = this.swingPivotX;

      const idealX = pivotX + Math.sin(angle) * length;
      const idealY = pivotY + Math.cos(angle) * length;

      let displayX = idealX;
      let displayY = idealY;
      let displayAngle = angle;
      if (this.swingBlendFromX !== null) {
        const blendT = (time - this.swingBlendStart) / XARA_SWING_RELAUNCH_BLEND_MS;
        if (blendT >= 1) {
          this.swingBlendFromX = null;
        } else {
          displayX = Phaser.Math.Linear(this.swingBlendFromX, idealX, blendT);
          displayY = Phaser.Math.Linear(this.swingBlendFromY, idealY, blendT);
          displayAngle = Phaser.Math.Linear(this.swingBlendFromRotation, angle, blendT);
        }
      }
      this.x = displayX;
      this.y = displayY;
      this.setRotation(displayAngle);

      this.anims.stop();
      this.setTexture('xara-swing-0');
      this.drawThread(1, pivotX, pivotY);
      this.drawBubble(0);
    }

    // `facingDir` seul suffit maintenant, y compris pendant un saut : plus
    // de sens figé à verrouiller (cf. état 'ground' plus haut) puisque la
    // vitesse horizontale pendant le saut suit en continu `followed.x`
    // comme au sol, jamais une ligne droite scriptée dans un sens fixé au
    // lancer.
    this.setFlipX(this.facingDir < 0);
  }

  // Trace le fil de soie de la tête de Xara jusqu'à son point d'ancrage.
  // `progress` (0-1) fait grandir/rétrécir le fil (bascule sol <-> balancier).
  // En balancier stabilisé, `pivotX`/`pivotY` sont le pivot EXACT utilisé
  // pour calculer sa position (cf. update) : le fil est donc toujours
  // parfaitement aligné avec elle, jamais juste vertical au-dessus. Pendant
  // la bascule (pivot pas encore établi), on retombe sur un fil vertical
  // simple qui grandit/rétrécit vers le haut de l'écran.
  drawThread(progress, pivotX, pivotY) {
    this.thread.clear();
    if (progress <= 0.01) return;

    // Position de la tête en tenant compte de la rotation courante (le
    // pendule tourne le sprite, cf. update) : sans ça, le fil resterait à
    // la verticale au-dessus d'elle même quand elle est bien inclinée dans
    // le balancement, au lieu de continuer droit dans le prolongement du
    // corps jusqu'au pivot.
    const headOffset = this.displayHeight * 0.92;
    const headX = this.x + Math.sin(this.rotation) * headOffset;
    const headY = this.y - Math.cos(this.rotation) * headOffset;

    let topX;
    let topY;
    if (pivotY !== undefined) {
      topX = pivotX;
      topY = pivotY;
    } else {
      topX = pivotX !== undefined ? pivotX : headX;
      topY = Phaser.Math.Linear(headY, this.scene.cameras.main.scrollY, progress);
    }
    this.thread.lineStyle(1.5, 0xe8d9ff, 0.7);
    this.thread.beginPath();
    this.thread.moveTo(headX, headY);
    this.thread.lineTo(topX, topY);
    this.thread.strokePath();
  }

  // Bulle (forme Pieuvre, dans l'eau) : cercle translucide autour de
  // Xara + fil vers le JOUEUR (pas vers le ciel comme le fil du
  // balancier) — pas d'art de nage dédié, donc elle flotte à côté de lui,
  // reliée par un fil plutôt que d'essayer de la faire nager elle-même.
  // `alpha` (0-1) pilote un fondu pendant les bascules vers/depuis la bulle
  // ; dessiné APRÈS `drawThread` (jamais de `.clear()` ici, même Graphics).
  drawBubble(alpha) {
    if (alpha <= 0.01) return;

    const cx = this.x;
    const cy = this.y - this.displayHeight * 0.5;
    const targetX = this.target.x;
    const targetY = this.target.y - 30;

    this.thread.lineStyle(1.5, XARA_BUBBLE_COLOR, 0.6 * alpha);
    this.thread.beginPath();
    this.thread.moveTo(cx, cy);
    this.thread.lineTo(targetX, targetY);
    this.thread.strokePath();

    this.thread.fillStyle(XARA_BUBBLE_COLOR, 0.15 * alpha);
    this.thread.fillCircle(cx, cy, XARA_BUBBLE_RADIUS);
    this.thread.lineStyle(1.5, XARA_BUBBLE_COLOR, 0.55 * alpha);
    this.thread.strokeCircle(cx, cy, XARA_BUBBLE_RADIUS);
  }
}
