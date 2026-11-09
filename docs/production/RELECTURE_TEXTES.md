# Relecture des textes — avant / après

Réécriture selon `docs/production/STYLE_DIALOGUES.md` (retours des joueurs : trop de texte au début,
textes ampoulés, « ça fait IA »). Chaque bloc montre le texte affiché avant (git HEAD) et après,
dans l'ordre du jeu. Les blocs inchangés ne sont pas listés. « Aide » = message d'aide (toast),
« Xara (bulle) » = bulle non bloquante. Le nombre entre parenthèses = lignes avant → après.

## Chiffres

Comptage par `compte.py` (même filtre avant et après ; les répliques de repli jamais affichées,
écrasées par un fichier chargé ensuite, ne sont comptées ni avant ni après).

```
### Répliques de dialogue (personnages, narration, bulles)

| Fichier | Lignes avant | après | écart | Mots avant | après | écart |
|---|---:|---:|---:|---:|---:|---:|
| story/acte1.js | 116 | 51 | -56 % | 1369 | 499 | -64 % |
| story/acte1_arbre.js | 69 | 27 | -61 % | 946 | 325 | -66 % |
| story/acte2.js | 223 | 109 | -51 % | 2526 | 1046 | -59 % |
| story/boss_kainati.js | 5 | 5 | +0 % | 70 | 54 | -23 % |
| scenes/PrologueScene.js | 5 | 3 | -40 % | 72 | 30 | -58 % |
| scenes/EndScreenScene.js | 3 | 2 | -33 % | 32 | 16 | -50 % |
| **Total** | **447** | **223** | **-50 %** | **5275** | **2230** | **-58 %** |

### Tout le texte affiché (dialogues + aides + menus + noms), fichiers modifiés

| Fichier | Lignes avant | après | écart | Mots avant | après | écart |
|---|---:|---:|---:|---:|---:|---:|
| story/acte1.js | 147 | 78 | -47 % | 1631 | 641 | -61 % |
| story/acte1_arbre.js | 83 | 39 | -53 % | 1133 | 412 | -64 % |
| story/acte2.js | 255 | 138 | -46 % | 2765 | 1208 | -56 % |
| story/boss_kainati.js | 12 | 12 | +0 % | 133 | 95 | -29 % |
| story/boss_ghilt.js | 12 | 12 | +0 % | 42 | 40 | -5 % |
| scenes/PrologueScene.js | 7 | 5 | -29 % | 79 | 37 | -53 % |
| scenes/EndScreenScene.js | 8 | 7 | -12 % | 66 | 43 | -35 % |
| scenes/MenuKit.js | 42 | 42 | +0 % | 274 | 263 | -4 % |
| scenes/CampfireMenuScene.js | 42 | 42 | +0 % | 293 | 281 | -4 % |
| scenes/InventoryScene.js | 16 | 16 | +0 % | 67 | 66 | -1 % |
| utils/StoryKit.js | 59 | 59 | +0 % | 409 | 357 | -13 % |
| utils/LevelKit.js | 15 | 15 | +0 % | 68 | 67 | -1 % |
| data/foret_flottante_2_data.js | 3 | 3 | +0 % | 15 | 8 | -47 % |
| data/shops_data.js | 4 | 4 | +0 % | 34 | 28 | -18 % |
| **Total** | **911** | **678** | **-26 %** | **8068** | **4605** | **-43 %** |
```

Lecture : l'objectif « moitié moins » est atteint sur les répliques (−50 % de lignes, −58 % de mots).
Sur tout le texte affiché, −43 % de mots seulement, parce que les menus, boutons, noms de lieux et
crédits ne sont pas du « blabla » et ont été gardés presque tels quels.

Tests : les 47 scènes de `src/main.js` et `?editor` sortent en code 0 (`scenes.py`, 48/48) ; le chemin
critique complet au clavier simulé (`chemin.py tout`, titre → écran de fin, 15 segments) passe en entier,
sans erreur JS. Le pilote n'a pas eu besoin d'être modifié.

Captures (dossier `captures/` à côté de ce fichier) : `1_prologue.png`, `2_bosquet_orme.png`,
`2b_bannissement.png`, `3_kainati_intro.png`, `3b_kainati_victoire.png`, `4_ghilt_amanite.png`.

## Ce qui a changé, en bref

**Supprimé entièrement** (le déclencheur ou l'étape reste, sans texte ; aucun drapeau ni identifiant touché) :
- les narrations qui décrivaient l'image : « une silhouette rouge se penche sur l'autel », « une minuscule araignée s'incline devant Xara », « le talisman bat comme un cœur », « Amanite abat sa lance… », « Amanite arrache un éclat de l'idole » (étape `br_amanite_colere_fin` retirée avec son appel), « un murmure parcourt le bosquet », « les trois cochons trottinent… » ;
- les bulles d'ambiance : `fs1_mousse_partout`, `fs2_empreintes`, `racines_tunnel`, `ff1_intro`, `ff2_intro`, `hutte_arrivee`, `epreuve_s2` ;
- les bulles qui doublaient une aide ou une bannière : feu de camp, amas brisé, grand arbre, totem du singe, mur de la forêt corrompue, amas de la forêt corrompue ;
- les répliques en double (la même info dite deux fois) : les consignes de Ghil't au retour (déjà dites au trou sombre), « Ghil't n'était pas la source » sur l'écran de fin (Geralt vient de le dire), la blague « Clak dit que… » répétée après le bond raté de Geralt ;
- le rugissement de Ghil't en boîte de dialogue (il rugit déjà à l'écran) ;
- 4 bulles du duel de Geralt (`player-trapped`, `parry`, `column-hit`, `clak-stunned`) et 2 phrases de reprise sur 3.

**Prologue** : 5 lignes → 3 lignes courtes (72 → 30 mots). **Début** : bosquet et forêt sombre 1 passent de 93 à 43 répliques et de 1 081 à 403 mots (une réplique par habitant, une phrase d'objectif au réveil, bannissement en 5 répliques au lieu de 13).

**Aides de jeu** : une ligne, la touche entre crochets (`[Espace]`, `[K] ou clic`, `[Maj]`, `[E]`…). Lianes partout : « [Espace] deux fois près d'une liane : t'accrocher · [←] [→] : balancer · [Espace] : lâcher » (règle des deux appuis). Aigle : « [Espace] deux fois : tu deviens aigle et tu planes · [S] : piqué ». « Shift » devient « Maj » partout (écran Contrôles, aide en jeu, bannière des formes) ; le double appui ← / → pour le loup est vérifié dans Player.js.

**Orme** (retour d'un joueur : son sprite est jeune) : « Orme, le vieux druide » devient « Orme, le druide » partout, et il n'appelle plus Agarica « petite ».

**Corrigé au passage** : la description du totem de poche cassé disait « trouvé dans la hutte de Morgat » ; il est trouvé sur une île de la forêt flottante 2.

**Non touché** : `vague3_commun.js` (déjà au bon style, vérifié), `banc_essai.js`, les noms de lieux et de personnages, les crédits et la dédicace, les menus fonctionnels (titre, options, pause, carte), `asset_manifest.js`, `vague3_sous_bois/hauteurs/marais.js`.

**À relire en priorité** (choix de ton) : le bannissement (`bosquet_bannissement`), la rencontre de Xara (`fs1_rencontre`), Kainati (`kainati_intro`, `kainati_victoire`), Ghil't et Amanite (`ghilt_amanite`), le retour au bosquet (`br_*`).

## Petits textes hors scripts (objets, formes, menus)

| Où | Avant | Après |
|---|---|---|
| Objet : talisman de l'ours | Confié par ton père avant ton départ. Il semble endormi… mais il pulse parfois d'une chaleur sourde. | Le talisman des chefs du bosquet. Ton père te l'a confié. |
| Objet : carte de Geralt | Incomplète, couverte de flèches contradictoires et de traces de pinces. Touche M pour la consulter. | Pleine de flèches qui se contredisent et de traces de pinces. [M] pour l'ouvrir. |
| Objet : totem de poche cassé | Trouvé dans la hutte de Morgat. Fendu, éteint… À quoi peut-il bien servir ? | Un petit totem fendu, trouvé dans les ruines des îles flottantes. Il est froid. |
| Objet : baie de soin | Une baie rouge, sucrée et tiède. La croquer rend un cœur. | Rouge et sucrée. Rend un cœur. |
| Forme du loup (bannière) | Sprint (Shift ou double appui) : cours, franchis les ravins, suis les pistes. K : coup de croc. | [Maj] ou double appui [←] [→] : courir, franchir les ravins, voir les pistes. [K] : croc. |
| Forme du singe (bannière) | Donne le double saut ; devenue singe, accroche aux lianes et balancement. | [Espace] deux fois près d'une liane : tu deviens singe et tu t'y accroches. |
| Popup des totems | Forme Loup / Sprint (Shift) · croc (K) | Forme Loup / Courir (Maj) · croc (K) |
| Totem de l'aigle (message) | L'aigle t'a choisie. / Espace en l'air : tu planes. S : piqué. | Forme de l'aigle ! (l'aide suit, comme pour le loup et le singe) |
| Feu de camp : singe | Singe (aérien) : donne le double saut (court) ; après lui, s'accroche aux lianes (gauche/droite pour se balancer, Espace pour lâcher, S pour tomber). | Singe (aérien) : 2e appui sur Espace en l'air. S'accroche aux lianes (← → : se balancer, Espace : lâcher). |
| Mur de mousse sans répulsif | Un mur de mousse épaisse et visqueuse. Impossible de passer… / Il faudrait quelque chose pour la dissoudre. | Un mur de mousse. Il faudrait de quoi le dissoudre. |
| Vol interdit (forêt corrompue) | Les vents de la corruption plaquent tes ailes au sol. | Trop de vent ici : impossible de t'envoler. |
| Marchand de lune | Des baies, de la sève… tout se paie en éclats de lune, petite druidesse. | Baies et sève, contre des éclats de lune. |
| Ghil't affaibli | Utilise la compétence du papillon ! | Il vacille : la compétence du papillon, vite ! |


## Prologue et écran de fin

`src/scenes/PrologueScene.js`


### `PROLOGUE_LINES` (7 → 5)

| Avant | Après |
|---|---|
| **Narration** : Au cœur de la forêt d'Émeraude, un bosquet de druides veille sur les arbres depuis des générations.<br>**Narration** : Agarica, jeune druidesse du Cercle de la Lune, y a grandi auprès de son père, le chef du bosquet.<br>**Narration** : Mais depuis quelques lunes, une mousse toxique ronge la forêt. On la gratte, on la brûle… elle revient toujours.<br>**Narration** : Et les bêtes, autrefois paisibles, deviennent agressives.<br>**Narration** : Cette nuit encore, tout le bosquet lutte contre la mousse…<br>**Texte** : Le bosquet d'Émeraude<br>**Texte** : Appuie sur une touche | **Narration** : Agarica est druidesse au bosquet d'Émeraude. Son père en est le chef.<br>**Narration** : Une mousse ronge la forêt et rend les bêtes folles.<br>**Narration** : Cette nuit encore, tout le bosquet la gratte.<br>**Texte** : Le bosquet d'Émeraude<br>**Texte** : Appuie sur une touche |


`src/scenes/EndScreenScene.js`


### `END_BODY_LINES` (3 → 2)

| Avant | Après |
|---|---|
| **Narration** : Ghil't n'était pas la source de la mousse : seulement une victime.<br>**Narration** : Amanite s'en est allée, et quelque part, la corruption grandit encore.<br>**Narration** : Xara, elle, se tait… mais ce symbole, elle le connaissait. | **Narration** : La source de la mousse est toujours là, quelque part.<br>**Narration** : Et Xara n'a pas tout dit. |

### `END_CREDITS` (1 → 1)

| Avant | Après |
|---|---|
| **Texte** : Legend of Agarica — un jeu créé avec amour pour Agarica, druidesse du Cercle de la Lune | **Texte** : Legend of Agarica — fait main pour Agarica, druidesse du Cercle de la Lune |

### `END_SIGNOFF` (2 → 2)

| Avant | Après |
|---|---|
| **Texte** : Joyeux anniversaire, Agarica.<br>**Texte** : Appuie sur une touche pour revenir à l'écran-titre | **Texte** : Joyeux anniversaire, Agarica.<br>**Texte** : Une touche : retour au titre |

## Acte 1 — bosquet, forêt sombre 1 et 2

`src/story/acte1.js`


### `bosquet_porteur` (2 → 1)

| Avant | Après |
|---|---|
| **Bran** : Encore un seau, Agarica. L'eau de la source se trouble un peu plus chaque nuit.<br>**Bran** : On rince les troncs, on rince les chemins… Et le lendemain, tout est à refaire. | **Bran** : L'eau de la source noircit un peu plus chaque nuit. |

### `bosquet_garde_cochons` (3 → 1)

| Avant | Après |
|---|---|
| **Tilda** : Les trois petits se sont encore sauvés de l'enclos !<br>**Tilda** : … Ah non. Un, deux, trois. Ils sont là. Ouf.<br>**Tilda** : Depuis que la mousse rend les bêtes folles, je les compte toutes les heures. On ne sait jamais. | **Tilda** : Un, deux, trois… Ouf. Les petits sont tous là. |

### `bosquet_druide_feu` (2 → 1)

| Avant | Après |
|---|---|
| **Sauge** : On brûle tout ce qu'on gratte. Sinon, la mousse repousse jusque dans les cendres.<br>**Sauge** : Kof… kof… Ce n'est rien, petite. Juste la fumée. Et la mousse dans l'air. | **Sauge** : On brûle tout ce qu'on gratte, sinon ça repousse. Kof, kof. |

### `bosquet_orme_aide` (1 → 1)

| Avant | Après |
|---|---|
| **Orme** : Les plaques, Agarica ! Frappe-les pour les gratter (touche K). | **Orme** : Les plaques, Agarica ! Frappe-les : [K] ou clic. |

### `bosquet_orme_apres` (1 → 1)

| Avant | Après |
|---|---|
| **Orme** : Merci pour ton aide. Ton père te cherchait, il est devant sa hutte. | **Orme** : Ton père te cherche. Il est devant sa hutte. |

### `bosquet_pere_avant` (1 → 1)

| Avant | Après |
|---|---|
| **Père** : Agarica ! Orme a besoin de bras sur le chemin de la source. Va l'aider, puis reviens me voir. | **Père** : Orme a besoin d'aide à la source. Va, puis reviens me voir. |

### `bosquet_pere_apres` (1 → 1)

| Avant | Après |
|---|---|
| **Père** : Va te reposer, ma fille. Et garde ce talisman tout près de toi. | **Père** : Va dormir, ma fille. Et garde ce talisman sur toi. |

### `bosquet_garde_porte` (1 → 1)

| Avant | Après |
|---|---|
| **Garde** : Les portes de l'est restent closes la nuit, Agarica. Ordre du chef. | **Garde** : Les portes restent fermées la nuit. Ordre du chef. |

### `bosquet_tuto_saut` (1 → 1)

| Avant | Après |
|---|---|
| **Aide** : Espace : sauter | **Aide** : [Espace] : sauter |

### `bosquet_tuto_parler` (1 → 1)

| Avant | Après |
|---|---|
| **Aide** : E : parler aux habitants. | **Aide** : [E] : parler |

### `bosquet_intro` (3 → 2)

| Avant | Après |
|---|---|
| **Agarica** : Encore une nuit à se battre contre la mousse…<br>**Agarica** : Orme et les druides sont sur le chemin de la source. Ils auront besoin d'aide.<br>**Aide** : ← → (ou Q / D) : se déplacer | **Agarica** : Orme gratte la mousse près de la source. Il aura besoin d'aide.<br>**Aide** : [←] [→] ou [Q] [D] : marcher |

### `bosquet_aide_debut` (4 → 2)

| Avant | Après |
|---|---|
| **Orme** : Agarica ! Tu tombes bien.<br>**Orme** : La mousse a encore gagné le chemin cette nuit. Aide-moi à gratter ces plaques avant qu'elles ne prennent racine.<br>**Agarica** : Compte sur moi !<br>**Aide** : K (ou clic) : attaquer. Frappe les plaques de mousse pour les gratter. / Z/↑ : frapper en haut — S/↓ en l'air : frapper en bas (rebond) | **Orme** : Agarica ! Aide-moi à gratter ces plaques avant qu'elles prennent racine.<br>**Aide** : [K] ou clic : frapper |

### `bosquet_barriere_aide` (1 → 1)

| Avant | Après |
|---|---|
| **Orme** : Hé ! Il reste de la mousse à gratter derrière toi ! | **Orme** : Hé ! Il reste de la mousse derrière toi ! |

### `bosquet_mousse_revient` (6 → 3)

| Avant | Après |
|---|---|
| **Orme** : Bien gratté ! Le chemin respire à nouveau…<br>**Agarica** : … Non. Regarde, Orme : elle repousse déjà. Et l'amas sur la source ? Je vais essayer.<br>**Agarica** : Aïe ! Elle est dure comme de la pierre…<br>**Orme** : Ni nos grattoirs ni le feu n'en viennent à bout. Il faudrait une force bien plus grande que nos bras.<br>**Orme** : Par les racines ! Quelque chose sort de l'amas… Attention, Agarica !<br>**Aide** : K : attaquer. Repousse la créature de mousse ! / Z/↑ : frapper en haut — S/↓ en l'air : frapper en bas (rebond) | **Agarica** : Elle repousse déjà ! J'essaie l'amas de la source.<br>**Orme** : Laisse tomber. Ni le feu ni nos grattoirs n'en viennent à bout.<br>**Aide** : [Z] : frapper en haut · [S] en l'air : frapper en bas (rebond) |

### `bosquet_aide_fin` (4 → 2)

| Avant | Après |
|---|---|
| **Orme** : Même les bêtes… La mousse les rend folles, puis elle les dévore.<br>**Agarica** : Il faut trouver d'où elle vient, Orme. Gratter ne suffira jamais.<br>**Orme** : Tu parles comme ton père. Il te cherchait, d'ailleurs. Va le voir, devant sa hutte.<br>**Aide** : La hutte du chef est plus à l'est → | **Orme** : Même les bêtes, maintenant… Va voir ton père, il te cherche.<br>**Aide** : La hutte du chef est à l'est → |

### `bosquet_talisman` (8 → 4)

| Avant | Après |
|---|---|
| **Père** : Agarica. Orme m'a dit que tu l'avais aidé. Et qu'une bête est sortie de l'amas.<br>**Agarica** : Elle repousse partout, Père. On gratte, on brûle… et la nuit suivante, tout recommence.<br>**Père** : Je sais. Approche : je veux te confier quelque chose.<br>**Agarica** : Le talisman de l'ours ? Mais… il veille sur les chefs du bosquet depuis toujours !<br>**Père** : Les temps ne permettent plus d'attendre les cérémonies. Garde-le toujours sur toi.<br>**Agarica** : Il est tiède… On dirait qu'il dort. À quoi sert-il ?<br>**Père** : Il te le dira lui-même, le jour venu. Va te reposer, ma fille. Demain sera long.<br>**Aide** : I : ouvrir l'inventaire | **Père** : Orme m'a parlé de la bête. Tiens, garde ça toujours sur toi.<br>**Agarica** : Le talisman de l'ours ? Mais c'est celui des chefs !<br>**Père** : Ça ne peut plus attendre. Va dormir, ma fille.<br>**Aide** : [I] : ton sac |

### `bosquet_barriere_pere` (1 → 1)

| Avant | Après |
|---|---|
| **Habitant** : Agarica ! Ton père te cherche. Il est devant sa hutte, juste là. | **Habitant** : Ton père te cherche ! Il est juste là, devant sa hutte. |

### `bosquet_vol_couvrir` (1 → 1)

| Avant | Après |
|---|---|
| **Amanite** : Merci… Je la rapporterai, je te le jure. Quand la forêt sera sauvée. | **Amanite** : Merci. Je la rapporterai, promis. |

### `bosquet_vol_supplier` (1 → 1)

| Avant | Après |
|---|---|
| **Amanite** : Pas cette fois. Pardon, Agarica… Ne dis rien. Pour moi. | **Amanite** : Pardon, Agarica. Je ne peux pas. |

### `bosquet_vol` (16 → 7)

| Avant | Après |
|---|---|
| **Narration** : Au sanctuaire, une silhouette rouge se penche sur l'autel.<br>**Agarica** : Amanite ?! Qu'est-ce que tu fais là ?<br>**Amanite** : Agarica… Chut ! Ne crie pas, je t'en prie.<br>**Agarica** : L'idole ! Repose-la tout de suite !<br>**Amanite** : Elle dort sur cette pierre depuis cent ans, pendant que la forêt meurt autour d'elle.<br>**Amanite** : Elle a un pouvoir, j'en suis sûre. Je vais m'en servir contre la mousse, puisque personne ici n'ose le faire !<br>**Agarica** : C'est le cœur du bosquet, Amanite…<br>**Amanite** : Alors le bosquet n'a déjà plus de cœur. Il ne lui reste que des grattoirs.<br>**Amanite** : Des pas… les gardes ! Agarica, s'il te plaît. Ne dis rien.<br>**Choix** : « Va-t'en. Je ne dirai rien. »<br>**Choix** : « Amanite… repose-la. »<br>**Garde** : Agarica ? J'ai entendu du bruit au sanctuaire. Tu as vu quelqu'un ?<br>**Garde** : … L'autel ! L'idole a disparu !<br>**Agarica** : Je… Non. Personne. Je viens d'arriver, moi aussi.<br>**Garde** : Ne bouge pas d'ici. Je préviens le chef !<br>**Agarica** : Qu'est-ce que j'ai fait… | **Agarica** : Amanite ? Qu'est-ce que tu fais là ?<br>**Amanite** : Cette idole dort sur sa pierre pendant que la forêt meurt. Moi, je vais m'en servir.<br>**Amanite** : Les gardes ! Agarica, s'il te plaît… ne dis rien.<br>**Choix** : « Va-t'en. Je ne dirai rien. »<br>**Choix** : « Repose-la, Amanite. »<br>**Garde** : L'idole a disparu ! Agarica, tu as vu quelqu'un ?<br>**Agarica** : Je… non. Personne. |

### `bosquet_bannissement` (14 → 7)

| Avant | Après |
|---|---|
| **Titre** : Plus tard dans la nuit<br>**Garde** : Le vieux Orme t'a vue entrer au sanctuaire. Et Amanite a fui par les portes de l'est… l'idole dans les bras.<br>**Orme** : Pardonne-moi, petite. Je l'ai vue de mes yeux.<br>**Père** : Regarde-moi, Agarica. Tu étais là. Tu l'as laissée partir.<br>**Agarica** : … Oui. Elle voulait sauver la forêt, Père. Elle croit que l'idole peut arrêter la mousse.<br>**Père** : Et pour elle, tu as menti à ton peuple. Tu m'as menti, à moi.<br>**Agarica** : Je voulais seulement la protéger… C'est mon amie.<br>**Père** : La loi du bosquet est la même pour tous. Qui couvre le vol de l'idole partage la faute du voleur.<br>**Père** : Ce soir, je ne peux pas être ton père. Seulement le chef.<br>**Père** : Agarica, fille du bosquet d'Émeraude… tu es bannie. Tu partiras avant l'aube.<br>**Agarica** : Père… Où veux-tu que j'aille ? Je n'ai jamais dépassé la lisière.<br>**Père** : Garde le talisman. Il veillera sur toi, là où je ne le peux plus.<br>**Garde** : Les portes de l'est sont ouvertes. Va.<br>**Aide** : Les portes de l'est sont ouvertes → | **Titre** : Plus tard dans la nuit<br>**Père** : Orme t'a vue au sanctuaire. Tu as laissé Amanite partir avec l'idole, et tu as menti.<br>**Agarica** : Elle veut sauver la forêt, Père. C'est mon amie.<br>**Père** : Ce soir, je suis le chef, pas ton père. Tu es bannie. Pars avant l'aube.<br>**Agarica** : Père… je n'ai jamais dépassé la lisière.<br>**Père** : Garde le talisman. Il veillera sur toi à ma place.<br>**Aide** : Les portes de l'est sont ouvertes → |

### `bosquet_pere_adieu` (1 → 1)

| Avant | Après |
|---|---|
| **Père** : Va, maintenant. Avant que je ne change d'avis… ou que je ne te retienne. | **Père** : Va. Avant que je change d'avis. |

### `bosquet_orme_adieu` (1 → 1)

| Avant | Après |
|---|---|
| **Orme** : Prends soin de toi, petite. La forêt est grande… mais elle n'est pas toujours cruelle. | **Orme** : Fais attention à toi, Agarica. Et reviens-nous. |

### `bosquet_porte` (2 → 1)

| Avant | Après |
|---|---|
| **Narration** : Agarica franchit les portes du seul foyer qu'elle ait jamais connu.<br>**Titre** : Le bosquet d'Émeraude se referme derrière elle | **Titre** : Les portes se ferment derrière elle |

### `fs1_desespoir` (6 → 4)

| Avant | Après |
|---|---|
| **Narration** : Les portes de l'est se sont refermées. Derrière elles, plus un bruit.<br>**Agarica** : Bannie… Père ne m'a même pas regardée partir.<br>**Agarica** : Et toi, Amanite… Je t'ai suppliée de la reposer. Où es-tu, maintenant ?<br>**Agarica** : Et toi, Amanite… Tu m'avais promis de rapporter l'idole. Où es-tu, maintenant ?<br>**Agarica** : … Allez, Agarica. Pleurer ne fera pas reculer la mousse. Un pas, puis un autre.<br>**Aide** : Avance dans la forêt → | **Agarica** : Bannie. Père ne m'a même pas regardée.<br>**Agarica** : Et toi, Amanite… je t'avais suppliée de la reposer.<br>**Agarica** : Et toi, Amanite… tu avais promis de la rapporter.<br>**Aide** : Avance dans la forêt → |

### `fs1_rencontre` (9 → 5)

| Avant | Après |
|---|---|
| **Xara (???)** : Tu pleures bien fort, pour quelqu'un qui se promène seule la nuit.<br>**Agarica** : Qui… qui parle ? … Une araignée ?!<br>**Xara** : Xara. Et toi, tu es la petite druidesse qu'on vient de mettre à la porte.<br>**Narration** : Une minuscule araignée, sortie des feuilles, recule vivement devant Xara… comme on s'incline devant quelqu'un.<br>**Agarica** : Je n'ai nulle part où aller… mais je veux aider le bosquet, malgré tout.<br>**Xara** : Alors trouve un moyen d'agir contre la mousse. Je connais chaque sentier d'ici au grand arbre.<br>**Agarica** : Tu… tu viendrais avec moi ?<br>**Xara** : Il faut bien que quelqu'un t'empêche de tomber dans le premier ravin venu. Et puis… cela fait longtemps qu'on ne m'a pas demandé de rester.<br>**Aide** : Objectif : trouver un moyen d'agir contre la mousse. | **Xara (???)** : Tu pleures fort, pour quelqu'un qui se balade seule la nuit.<br>**Agarica** : Qui parle ? … Une araignée ?!<br>**Xara** : Xara. Et toi, la druidesse qu'on vient de mettre dehors.<br>**Agarica** : Je veux quand même sauver le bosquet. Trouver d'où vient la mousse.<br>**Xara** : Je viens avec toi. Il faut bien quelqu'un pour t'empêcher de tomber dans un ravin. |

### `fs1_feu` (4 → 1)

| Avant | Après |
|---|---|
| **Xara (bulle)** : Un feu de voyageurs. Repose-toi près des feux : tes blessures s'y referment.<br>**Agarica** : De la chaleur ! Je commençais à grelotter.<br>**Xara (bulle)** : C'est aussi là que tu prépareras tes formes… quand tu en auras.<br>**Aide** : E près d'un feu de camp : se reposer (soin, énergie, sauvegarde, préparation). | **Aide** : [E] près d'un feu : soin et sauvegarde |

### `fs1_creature` (3 → 2)

| Avant | Après |
|---|---|
| **Xara (bulle)** : Chut. Quelque chose rampe, devant nous… C'était un blaireau, avant la mousse.<br>**Agarica** : Pauvre petite chose… Pardon. Je dois passer.<br>**Aide** : K (ou clic) : attaquer. / Z/↑ : frapper en haut — S/↓ en l'air : frapper en bas (rebond) | **Xara (bulle)** : Chut. Ça, c'était un blaireau, avant la mousse.<br>**Aide** : [K] ou clic : frapper |

### `fs1_talisman` (6 → 3)

| Avant | Après |
|---|---|
| **Agarica** : Encore un amas… et les racines, au-dessus, montent jusqu'au ciel. C'est le seul passage.<br>**Narration** : Contre sa poitrine, le talisman de l'ours se met à battre comme un cœur.<br>**Xara** : Un talisman des anciens chefs qui s'éveille… Écoute-le.<br>**Agarica** : Une force immense… comme un ours dressé derrière moi. Père… tu savais.<br>**Xara (bulle)** : Alors laisse-le frapper.<br>**Aide** : A : Fracas de l'ours (consomme l'énergie, la barre sous tes cœurs). Colle-toi à l'amas et frappe ! | **Xara** : Ton talisman ! Il se réveille.<br>**Agarica** : La force d'un ours… Père, tu savais.<br>**Aide** : [A] collée à l'amas : fracas de l'ours. Il use l'énergie (barre sous les cœurs). |

### `fs1_amas_brise` (5 → 1)

| Avant | Après |
|---|---|
| **Agarica** : Il a volé en éclats !<br>**Xara (bulle)** : La mousse a donc un ennemi. Voilà un début.<br>**Agarica** : Alors on trouvera d'où elle vient. Ensemble !<br>**Xara (bulle)** : … Ensemble. Oui.<br>**Aide** : Frapper un ennemi recharge un peu d'énergie. Un feu de camp la remplit. | **Aide** : Frapper un ennemi recharge l'énergie. Un feu la remplit. |

### `fs1_mousse_partout` — *supprimé (déclencheur gardé, sans texte)* (2 → 0)

| Avant | Après |
|---|---|
| **Agarica** : Même ici, si loin du bosquet… la mousse est partout.<br>**Xara (bulle)** : Elle vient de l'est. Des profondeurs, là où les arbres sont malades depuis longtemps. | — |

### `fs2_empreintes` — *supprimé (déclencheur gardé, sans texte)* (2 → 0)

| Avant | Après |
|---|---|
| **Agarica** : Des empreintes… énormes. Une bête est passée par là, vers l'est.<br>**Xara (bulle)** : Un loup. Un très vieux loup. | — |

### `fs2_ravin` (4 → 2)

| Avant | Après |
|---|---|
| **Agarica** : Le sentier s'arrête net… C'est bien trop large pour sauter.<br>**Xara (bulle)** : Pour tes deux jambes, oui. Pas pour quatre pattes lancées au galop.<br>**Xara (bulle)** : Là, sur la butte : un totem du loup. Va. Pose la main dessus.<br>**Aide** : Grimpe sur la butte et appuie sur E devant le totem. | **Xara (bulle)** : Trop large pour deux jambes. Le totem du loup, sur la butte : touche-le.<br>**Aide** : [E] devant le totem |

### `fs2_loup` (4 → 2)

| Avant | Après |
|---|---|
| **Agarica** : Mes jambes fourmillent… comme si elles voulaient galoper toutes seules !<br>**Xara (bulle)** : La course du loup coule en toi. Prends de l'élan avant le ravin, et saute au dernier moment.<br>**Xara (bulle)** : Et ouvre l'œil : un loup voit des pistes que les autres ne voient pas.<br>**Aide** : Shift (ou double appui ← / →) : courir en loup. Saute en pleine course pour franchir le ravin. | **Xara (bulle)** : Cours, et saute au tout dernier moment.<br>**Aide** : [Maj] ou double appui [←] [→] : courir en loup |

### `fs2_ravin_large` (3 → 1)

| Avant | Après |
|---|---|
| **Agarica** : Encore un ravin… Celui-là est immense.<br>**Xara (bulle)** : Regarde les pistes. Un loup ne court jamais dans le vide : approche-toi en courant.<br>**Aide** : En forme de loup, les pistes et les passages cachés se révèlent. | **Xara (bulle)** : Trop grand ? Approche en loup : tu verras des pistes que personne ne voit. |

### `fs2_plante` (4 → 2)

| Avant | Après |
|---|---|
| **Agarica** : Xara, regarde ! Là-haut, sur la branche : une fleur… et pas un brin de mousse autour d'elle !<br>**Xara** : La mousse s'écarte de cette plante. Intéressant.<br>**Agarica** : Si j'arrivais à en cueillir une, on pourrait s'en servir contre la mousse !<br>**Xara** : Bien trop haut. Il en pousse peut-être d'autres, plus haut dans la forêt… là où il faudrait des ailes. | **Agarica** : Une fleur, là-haut… et pas un brin de mousse autour !<br>**Xara** : La mousse l'évite. Il en pousse sûrement plus haut, là où il faut des ailes. |

### `fs2_mur` (4 → 2)

| Avant | Après |
|---|---|
| **Aide** : E devant le mur : verser le répulsif.<br>**Texte** : Le vieux passage. Avec le répulsif de Morgat, cette mousse ne tiendra pas longtemps.<br>**Agarica** : Un mur de mousse, sous le surplomb… Il bouge ! On dirait qu'il respire.<br>**Xara (bulle)** : Celle-ci est vivante : la frapper ne ferait que l'épaissir. Derrière, il y a un vieux passage… | **Aide** : [E] devant le mur : verser le répulsif<br>**Xara (bulle)** : Ce mur de mousse est vivant. Les coups n'y feront rien, il faudra autre chose. |

### `fs2_arrivee_poche` (2 → 1)

| Avant | Après |
|---|---|
| **Xara (bulle)** : Le vieux sentier débouche ici… et la mousse a scellé la sortie de ce côté-ci.<br>**Xara (bulle)** : Verse le répulsif sur le mur, Agarica. | **Xara (bulle)** : La mousse a muré la sortie. Verse le répulsif dessus. |

### `fs2_coeur` (2 → 1)

| Avant | Après |
|---|---|
| **Agarica** : Une graine de chêne-cœur ! Orme disait qu'il n'en restait plus une seule dans toute la forêt…<br>**Xara** : La mousse ne l'a pas trouvée, derrière son propre mur. Garde-la : elle battra avec toi. | **Agarica** : Une graine de chêne-cœur ! Orme disait qu'il n'en restait plus. |

### `fs2_grand_arbre` (4 → 1)

| Avant | Après |
|---|---|
| **Agarica** : Xara… cet arbre, là-bas. Il touche les nuages !<br>**Xara (bulle)** : Le grand arbre. Les pistes du loup mènent à ses racines.<br>**Xara (bulle)** : Prudence, là-haut : quelque chose veille sur son sommet.<br>**Aide** : Les racines du grand arbre → | **Texte** : Les racines du grand arbre → |

## Acte 1 — grand arbre, Kainati, monde spirituel, épreuve du singe

`src/story/acte1_arbre.js`


### `racines_intro` (3 → 1)

| Avant | Après |
|---|---|
| **Agarica** : Oh… Je n'avais jamais vu un arbre pareil. La piste du loup grimpe tout droit dans ses racines.<br>**Xara** : Alors grimpons. Doucement : cet arbre a un roi, et il n'aime pas qu'on monte sans y être invitée.<br>**Aide** : Le grand arbre se gravit : de racine en branche, jusqu'à la cime. | **Xara** : On grimpe. Doucement : cet arbre a un roi, et il n'aime pas les visiteurs. |

### `racines_tunnel` — *supprimé (déclencheur gardé, sans texte)* (3 → 0)

| Avant | Après |
|---|---|
| **Xara (bulle)** : Tu sens ? La mousse remonte les racines, vers le cœur de l'arbre.<br>**Agarica** : Et ces griffures dans l'écorce… De petites mains.<br>**Xara (bulle)** : Des singes. D'habitude, ils sont plus… accueillants. | — |

### `racines_lianes` (3 → 1)

| Avant | Après |
|---|---|
| **Xara (bulle)** : Regarde, à gauche : des lianes au-dessus du vide. Elles mènent à une fente dans l'écorce.<br>**Agarica** : Elles pendent bien trop loin du bord… Je ne pourrais jamais m'y accrocher.<br>**Xara (bulle)** : Pas avec des mains de druidesse. Il faudrait celles d'un singe. Garde cet endroit en tête. | **Xara (bulle)** : Ces lianes mènent à une fente dans l'écorce. Il te faudrait des mains de singe. |

### `racines_lianes_singe` (2 → 1)

| Avant | Après |
|---|---|
| **Xara (bulle)** : Les lianes de tout à l'heure… Cette fois, elles te porteront.<br>**Xara (bulle)** : Par là, à gauche. L'épreuve de son peuple t'attend, si tu le veux. | **Xara (bulle)** : Les lianes de tout à l'heure ! L'épreuve du peuple singe est par là. |

### `racines_pierres` (2 → 1)

| Avant | Après |
|---|---|
| **Xara (bulle)** : Attention ! Ça tombe de là-haut. Regarde l'ombre grandir : ne reste pas dessous.<br>**Agarica** : Quelqu'un nous les lance… Les singes ? | **Xara (bulle)** : Attention, ça tombe ! Ne reste pas sous l'ombre. |

### `racines_cime` (4 → 2)

| Avant | Après |
|---|---|
| **Xara (bulle)** : La cime est de l'autre côté de ce vide. Il n'y a que ces lianes pour y aller.<br>**Agarica** : Bien trop loin pour mes mains. Et ce totem… un singe sculpté.<br>**Xara (bulle)** : Il dort. Pose ta main dessus : ce bois-là a une âme.<br>**Aide** : Le totem du singe : approche-toi et appuie sur E. | **Xara (bulle)** : Seules les lianes mènent à la cime. Et ce totem du singe… touche-le.<br>**Aide** : [E] devant le totem |

### `racines_cime_singe` (4 → 2)

| Avant | Après |
|---|---|
| **Xara (bulle)** : Tes mains de singe, maintenant. Saute, puis saute encore : une fois singe, tu saisis les lianes jusqu'à la cime.<br>**Agarica** : Et là-haut, le roi des singes. Je ne veux pas me battre contre lui.<br>**Xara (bulle)** : Prends de l'élan, lâche quand la liane remonte.<br>**Aide** : Lianes : double saut pour devenir singe et s'y accrocher / ← → pour se balancer · Espace pour lâcher · Z/S pour monter/descendre | **Xara (bulle)** : Prends de l'élan, et lâche quand la liane remonte.<br>**Aide** : [Espace] deux fois près d'une liane : t'accrocher · [←] [→] : balancer · [Espace] : lâcher |

### `racines_singe_eveil` (2 → 1)

| Avant | Après |
|---|---|
| **Xara (bulle)** : Les mains du peuple singe ! Saute, puis saute encore près d'une liane : une fois singe, tu la saisis.<br>**Aide** : Lianes : double saut pour devenir singe et s'y accrocher / ← → se balancer · Espace : lâcher · Z/S : monter/descendre | **Aide** : [Espace] deux fois près d'une liane : t'accrocher · [←] [→] : balancer · [Espace] : lâcher |

### `kainati_intro` (5 → 3)

| Avant | Après |
|---|---|
| **Kainati** : Halte, enfant d'en bas ! Qui t'a appris à courir sur mes lianes ?<br>**Agarica** : Le totem de ton peuple, au bout de la grande branche. Il s'est allumé sous ma main.<br>**Kainati** : Mensonge ! Tu portes l'odeur de la mousse… Elle grimpe le long de mon arbre depuis des lunes, et voilà qu'elle t'envoie.<br>**Xara** : Agarica, regarde ses yeux. Ce n'est pas lui qui parle : c'est la mousse.<br>**Kainati** : Assez ! Ma colère va secouer cet arbre jusqu'aux racines. Reste au sol, si tu l'oses ! | **Kainati** : Halte ! Tu grimpes sur mes lianes et tu sens la mousse. C'est elle qui t'envoie !<br>**Xara** : Regarde ses yeux. C'est la mousse qui parle, pas lui.<br>**Kainati** : Assez ! Hors de mon arbre ! |

### `kainati_victoire` (7 → 3)

| Avant | Après |
|---|---|
| **Kainati** : Le bourdonnement… s'est tu. La brume quitte mes yeux.<br>**Kainati** : Tu aurais pu me jeter au bas de mon arbre. Tu ne l'as pas fait.<br>**Agarica** : Ce n'était pas toi, c'était la mousse. Je la combats : elle ronge toute la forêt.<br>**Kainati** : Alors nous avons le même ennemi. Elle s'était glissée en moi comme la sève dans le bois… et j'ai pris une enfant des bois pour une ennemie.<br>**Kainati** : Tu portes bien les mains de mon peuple. Pardonne au vieux roi.<br>**Kainati** : La route des hauteurs continue vers l'est, au-delà de ma cime. Elle est à toi.<br>**Xara** : Il est à bout de forces. Laissons-le se reposer. | **Kainati** : Le bourdonnement s'est tu… Tu aurais pu me jeter en bas. Pourquoi ?<br>**Agarica** : Ce n'était pas toi, c'était la mousse. Je la combats.<br>**Kainati** : Alors pardonne au vieux roi. La route des hauteurs, à l'est, est à toi. |

### `arene_sans_singe` (3 → 1)

| Avant | Après |
|---|---|
| **Xara (bulle)** : Attends. Là-haut, les branches s'écartent de trois bonnes longueurs… Tes jambes n'y suffiront pas.<br>**Xara (bulle)** : Le totem du singe, au bout de la grande branche des racines : pose ta main dessus.<br>**Aide** : Le totem du singe : dans les racines, au bout de la grande branche. | **Xara (bulle)** : Sans les mains du singe, tu n'iras pas plus haut. Va voir le totem de la grande branche. |

### `kainati_calme` (7 → 3)

| Avant | Après |
|---|---|
| **Kainati** : Mes jambes ne me portent plus… La mousse m'a pris toutes mes forces en partant.<br>**Kainati** : Les lianes de mes racines mènent à l'épreuve de mon peuple. Termine-la, et notre talisman sera tien.<br>**Kainati** : Ou continue vers l'est, par la route des hauteurs. L'épreuve t'attendra : les arbres sont patients.<br>**Kainati** : Le talisman de mon peuple te va bien, petite druidesse.<br>**Kainati** : Que les lianes te portent. À l'est, la route des hauteurs t'attend.<br>**Kainati** : Plus haut, à l'est, la route mène vers les hauteurs.<br>**Kainati** : Que les lianes te portent, petite druidesse. | **Kainati** : L'épreuve de mon peuple est au bout des lianes des racines. Le talisman t'attend en haut.<br>**Kainati** : Notre talisman te va bien. La route des hauteurs est à l'est.<br>**Kainati** : La route des hauteurs est à l'est, petite druidesse. |

### `esprit_arrivee` (11 → 6)

| Avant | Après |
|---|---|
| **Esprit** : Bienvenue dans l'arbre d'avant, enfant des bois. Ici, rien ne pourrit.<br>**Agarica** : Tu… tu brilles. Qui es-tu ?<br>**Esprit** : Le premier de mon peuple. Mon descendant, Kainati, règne sur la cime de ton arbre… et la mousse lui ronge l'esprit.<br>**Esprit** : Dis-moi. Pourquoi veux-tu atteindre sa cime ?<br>**Aide** : Pour arrêter la mousse qui ronge la forêt.<br>**Aide** : Pour parler à votre roi, pas pour le combattre.<br>**Esprit** : Ta réponse a le goût de la sève, pas de la mousse. Ton cœur est droit.<br>**Esprit** : Reçois nos mains. Et si Kainati se dresse contre toi… ne le tue pas. Rends-lui ses yeux.<br>**Esprit** : Mais des mains ne suffisent pas. Montre-moi qu'elles ont compris.<br>**Esprit** : Saute, puis saute encore : devenue singe, tes mains saisiront la liane. Balance-toi, puis lâche avec l'élan. Suis mes mouvements.<br>**Aide** : Forme du singe : double saut pour devenir singe et s'accrocher aux lianes. / ← → : se balancer · Espace : lâcher · Z/S : monter/descendre | **Esprit** : Je suis le premier du peuple de Kainati. Pourquoi veux-tu atteindre sa cime ?<br>**Aide** : Pour arrêter la mousse.<br>**Aide** : Pour parler à votre roi.<br>**Esprit** : Bonne réponse. Reçois nos mains. Et épargne Kainati : la mousse le rend fou.<br>**Esprit** : Suis-moi, de liane en liane.<br>**Aide** : [Espace] deux fois près d'une liane : t'accrocher · [←] [→] : balancer · [Espace] : lâcher |

### `esprit_fin` (5 → 2)

| Avant | Après |
|---|---|
| **Esprit** : Tu as gardé l'élan jusqu'au bout. L'épreuve est réussie : les branches te reconnaissent.<br>**Esprit** : Un jour, d'autres esprits t'offriront peut-être des ailes. Près d'un feu, tu choisiras : nos mains ou leurs ailes, une seule à la fois.<br>**Agarica** : Merci. Je ferai honneur à ton peuple.<br>**Esprit** : Retourne au totem. Au-delà, les lianes de la cime te mèneront jusqu'à Kainati. Et les lianes de la branche d'élan, à l'épreuve de mon peuple.<br>**Aide** : Le passage derrière l'arbre spirituel ramène au totem des racines. | **Esprit** : Bien. Retourne au totem : les lianes de la cime mènent à Kainati.<br>**Aide** : Le passage derrière l'arbre ramène aux racines → |

### `esprit_guide` (1 → 1)

| Avant | Après |
|---|---|
| **Esprit** : Ne regarde pas le vide. Regarde la liane suivante. | **Esprit** : Regarde la liane suivante, pas le vide. |

### `esprit_revisite` (2 → 1)

| Avant | Après |
|---|---|
| **Esprit** : Tu reviens t'exercer ? L'arbre d'avant est patient.<br>**Esprit** : Souviens-toi : on lâche la liane quand elle monte, jamais quand elle retombe. | **Esprit** : Lâche la liane quand elle monte, jamais quand elle retombe. |

### `epreuve_intro` (3 → 2)

| Avant | Après |
|---|---|
| **Voix ancestrale** : Tu es venue. Bien. Ici, mon peuple ne touche jamais le sol.<br>**Voix ancestrale** : Cinq passages, chacun plus rude. En bas, la mousse attend ceux qui tombent. Au sommet, notre talisman.<br>**Aide** : Double saut : devenue singe, tu saisis la 1re liane. / ← → : prendre de l'élan · Espace : lâcher quand la liane monte · Z/S : monter/descendre / Une chute ramène à la dernière lanterne allumée. | **Voix ancestrale** : Ici, on ne touche jamais le sol. Si tu tombes, tu repars de la dernière lanterne.<br>**Aide** : [Espace] deux fois près d'une liane : t'accrocher · [←] [→] : balancer · [Espace] : lâcher |

### `epreuve_s2` — *supprimé (déclencheur gardé, sans texte)* (2 → 0)

| Avant | Après |
|---|---|
| **Xara (bulle)** : Des pierres, encore… Elles tombent en rythme. Regarde l'ombre.<br>**Agarica** : J'attends qu'elle tombe, je saute, et je grimpe vite. | — |

### `epreuve_s3` (2 → 1)

| Avant | Après |
|---|---|
| **Xara (bulle)** : Les lianes s'écartent. Prends tout ton élan avant de lâcher.<br>**Xara (bulle)** : Et méfie-toi d'en bas : un singe nous guette. | **Xara (bulle)** : Prends tout ton élan. Et méfie-toi du singe, en bas. |

### `epreuve_s4` (2 → 1)

| Avant | Après |
|---|---|
| **Xara (bulle)** : La mousse monte et descend, là, en bas… comme une respiration.<br>**Agarica** : Quand elle reflue, je fonce et je grimpe. | **Xara (bulle)** : La mousse monte et descend. Passe quand elle reflue. |

### `epreuve_s5` (2 → 1)

| Avant | Après |
|---|---|
| **Xara (bulle)** : Plus de repos, maintenant. Et cette branche, en bas, ne tiendra pas.<br>**Agarica** : Je vois la lumière, tout en haut. J'y suis presque. | **Xara (bulle)** : Plus de repos. Et la branche du bas ne tiendra pas. |

### `epreuve_sans_singe` (2 → 1)

| Avant | Après |
|---|---|
| **Xara (bulle)** : Ces lianes filent jusqu'au bout des branches… mais sans la forme du singe, elles ne te porteront pas.<br>**Xara (bulle)** : Le totem du singe, au bout de la grande branche des racines : pose ta main dessus, il te donnera les mains de son peuple. | **Xara (bulle)** : Sans les mains du singe, ces lianes ne te porteront pas. Va voir le totem des racines. |

### `epreuve_forme_aigle` (1 → 1)

| Avant | Après |
|---|---|
| **Aide** : Ici, ce sont les mains du singe qu'il te faut : choisis-le au feu de camp. | **Aide** : Ici, il te faut le singe : change de forme à un feu de camp. |

### `epreuve_talisman` (5 → 2)

| Avant | Après |
|---|---|
| **Voix ancestrale** : Tu n'as pas touché le sol. Mon peuple te salue, Agarica.<br>**Voix ancestrale** : Ce talisman garde notre plus vieux savoir : la pierre lancée juste, de loin, sans se mettre en danger.<br>**Xara** : Une pierre bien lancée vaut mieux qu'une lame trop près des crocs. Ces vieux singes sont sages.<br>**Agarica** : Merci, esprits du peuple singe.<br>**Aide** : Lancer de pierre : il coûte un peu d'énergie. La fente, au bout du sommet, redescend vers les racines. | **Voix ancestrale** : Tu n'as pas touché le sol. Prends notre talisman : la pierre, lancée de loin.<br>**Aide** : La fente au bout du sommet redescend aux racines → |

## Combat de Kainati

`src/story/boss_kainati.js` (bulles et aides du combat, dans l'ordre du fichier)

| Avant | Après |
|---|---|
| Ses lianes ne portent que la forme du singe ! Choisis-la au feu de camp, juste derrière nous. | Ici, il te faut le singe. Change de forme au feu, juste derrière. |
| Sans la forme du singe, ses coups balaieront tout le sol… Redescendons aux racines : le totem du singe nous attend. | Sans le singe, ses coups vont balayer tout le sol. Le totem est en bas, dans les racines. |
| Tout le sol va y passer ! Accroche-toi à une liane, vite ! | Tout le sol va y passer ! Une liane, vite ! |
| Il va charger ! Accroche-toi à une liane ! | Il charge ! Sur une liane ! |
| Ses grandes attaques couvrent tout le sol : double saut sous une liane, devenue singe tu t'y accroches (Z/S : monter, descendre). / Frappe-le quand tu peux ; après une charge, il est sonné : coups doublés ! | Ses grosses attaques balaient le sol : [Espace] deux fois sous une liane, et accroche-toi |
| La route des hauteurs s'est ouverte, à l'est → | La route des hauteurs est ouverte → |
| Kainati est sonné : fonce (Maj) et frappe, chaque coup compte double ! | Kainati est sonné : fonce [Maj] et frappe [K], coups doublés ! |
| Il enrage ! Des pierres tombent de là-haut : bouge sur ta liane ! | Il enrage ! Des pierres tombent : bouge sur ta liane ! |

## Acte 2 — forêt flottante, clairière, hutte, forêt corrompue, Ghil't, retour

`src/story/acte2.js`


### Totem de poche cassé (description) (1 → 1)

| Avant | Après |
|---|---|
| **Texte** : Trouvé dans les ruines des îles flottantes. Fendu, éteint… Les papillons de Morgat tournent autour de lui. | **Texte** : Un petit totem fendu, trouvé dans les ruines des îles flottantes. Il est froid. |

### `geralt_rencontre` (8 → 5)

| Avant | Après |
|---|---|
| **Geralt** : HALTE ! Pas un pas de plus, porteuse de mousse !<br>**Agarica** : Porteuse de… quoi ? Je ne porte rien du tout !<br>**Geralt** : C'est exactement ce que dirait quelqu'un qui porte de la mousse. Ou qui vient voler mes notes.<br>**Geralt** : Geralt, ranger des marches boisées. Et gardien du Crabe Ancestral, mon totem. Tremble.<br>**Agarica** : Je ne vois aucun crabe.<br>**Geralt** : Il n'est pas là. Il viendra quand je l'appellerai. Prie pour que je n'aie pas à l'appeler.<br>**Geralt** : En garde ! Un duel, et la vérité éclatera !<br>**Aide** : Duel ! Esquive ses flèches et ses collets, et frappe Geralt (K ou clic). | **Geralt** : HALTE ! Pas un pas de plus, porteuse de mousse !<br>**Agarica** : Porteuse de quoi ? Je ne porte rien !<br>**Geralt** : Exactement ce que dirait une porteuse de mousse.<br>**Geralt** : Geralt, ranger. Et gardien du Crabe Ancestral. En garde !<br>**Aide** : Duel ! Esquive flèches et collets, frappe Geralt : [K] ou clic |

### `geralt_rendu_victoire` (4 → 3)

| Avant | Après |
|---|---|
| **Geralt** : Ouille… D'accord, d'accord ! Je me rends. Stratégiquement.<br>**Clak** : Clac clac.<br>**Geralt** : Il dit que tu te bats bien. Il dit beaucoup de bêtises.<br>**Geralt** : Rien de cassé. Juste ma réputation : Clak la recollera. | **Geralt** : Ouille ! D'accord, je me rends. Stratégiquement.<br>**Clak** : Clac clac.<br>**Geralt** : Il dit que tu te bats bien. Il dit beaucoup de bêtises. |

### `geralt_paix` (3 → 1)

| Avant | Après |
|---|---|
| **Xara** : Ranger, vous cherchez l'origine de la mousse. Elle aussi. Vous auriez pu commencer par là.<br>**Agarica** : Je veux sauver la forêt. Et… pouvoir rentrer chez moi, un jour.<br>**Geralt** : Alors on est dans la même galère, petite. Tiens. Ma carte. | **Geralt** : Hm. Tu chasses la mousse, toi aussi ? Même combat, alors. Tiens, ma carte. |

### `geralt_carte` (3 → 1)

| Avant | Après |
|---|---|
| **Geralt** : Les traces de pinces, c'est Clak. Mais regarde : la mousse ne s'étale pas au hasard. Elle monte, vers les hauteurs.<br>**Geralt** : Et elle pousse plus vite là où les bêtes sont malades. Comme si elle suivait la fièvre… ou l'inverse.<br>**Agarica** : Alors il faut monter. On y va ensemble ? | **Geralt** : Regarde : la mousse ne pousse pas au hasard. Elle monte vers les hauteurs. |

### `geralt_essai` (2 → 1)

| Avant | Après |
|---|---|
| **Geralt** : Bon. Va, Agarica. Je garde le camp, et je mettrai la carte à jour avec ce que tu rapporteras.<br>**Agarica** : Merci, Geralt ! Je reviendrai tout te raconter. | **Geralt** : Bon. Toi, tu grimpes. Moi, je garde le camp et je tiens la carte à jour. |

### `geralt_camp` (2 → 1)

| Avant | Après |
|---|---|
| **Geralt** : Toujours en un seul morceau ? Bien. Ça me fait une alliée de plus et un point d'interrogation de moins.<br>**Geralt** : La mousse monte, petite. Toujours. Moi, je reste en bas à prendre des notes. | **Geralt** : Toujours en un seul morceau ? Bien. Moi, je prends des notes. |

### `clak_camp` (2 → 2)

| Avant | Après |
|---|---|
| **Clak** : Clac.<br>**Agarica** : … Moi aussi, je t'aime bien, Clak. | **Clak** : Clac.<br>**Agarica** : Moi aussi, je t'aime bien, Clak. |

### `ff1_vue` (4 → 1)

| Avant | Après |
|---|---|
| **Agarica** : Oh… Xara, regarde ! Au-dessus des arbres… le ciel, en plein jour !<br>**Xara** : Plus loin, des îles flottent : les anciens gardiens y vivaient.<br>**Agarica** : Et là-bas, tout au loin… cette forêt presque noire.<br>**Xara** : Le cœur de la mousse. Retiens bien la direction. | **Xara** : Regarde, tout au fond : cette forêt noire. Le cœur de la mousse. |

### `ff1_intro` — *supprimé (déclencheur gardé, sans texte)* (3 → 0)

| Avant | Après |
|---|---|
| **Agarica** : Les branches montent si haut… On ne voit même plus le sol.<br>**Xara (bulle)** : La forêt est trop grande pour la nettoyer coin par coin. Il faut remonter jusqu'à sa source.<br>**Xara (bulle)** : Je connais un chemin, par les hauteurs. Grimpe, et garde les yeux ouverts. | — |

### `geralt_fin_duel` (4 → 2)

| Avant | Après |
|---|---|
| **Aide** : Touche M : consulter la carte de Geralt<br>**Clak** : Clac. Clac clac.<br>**Geralt** : Il dit que j'aurais pu demander de l'aide. Je ne lui ai pas demandé son avis.<br>**Aide** : Espace, puis encore Espace en l'air : le bond du singe atteint la corniche | **Aide** : [M] : la carte de Geralt<br>**Aide** : [Espace] puis [Espace] en l'air : le bond du singe atteint la corniche |

### Duel de Geralt : bulle `lob` (1 → 1)

| Avant | Après |
|---|---|
| **Xara** : Regarde le sol : sa flèche tombe là où ça rougeoie ! | **Xara** : Sa flèche tombe là où le sol rougeoie ! |

### Duel de Geralt : bulle `shot` (1 → 1)

| Avant | Après |
|---|---|
| **Xara** : Une flèche droite : saute, ou coupe-la en vol ! | **Xara** : Flèche droite : saute, ou coupe-la ! |

### Duel de Geralt : bulle `trap` (1 → 1)

| Avant | Après |
|---|---|
| **Xara** : Un collet. Saute par-dessus… et attire-le dessus ! | **Xara** : Un collet ! Saute par-dessus… et attire-le dedans. |

### Duel de Geralt : bulles `crash`, `player-trapped`, `geralt-trapped` (3 → 2)

| Avant | Après |
|---|---|
| **Xara** : Il s'est étalé ! Frappe, vite !<br>**Xara** : Ses collets ne pardonnent pas : regarde où tu marches.<br>**Xara** : Pris à son propre piège. Classique. | **Xara** : Il s'est étalé ! Frappe !<br>**Xara** : Pris à son propre piège. Classique. |

### `GERALT_DUEL_REPRISE` (3 → 1)

| Avant | Après |
|---|---|
| **Narration** : Debout, porteuse de mousse ! On reprend. Et je ne retiens plus mes flèches.<br>**Narration** : Encore ? Bien. Cette fois, je suis échauffé.<br>**Narration** : Tu es têtue. Moi aussi. En garde ! | **Narration** : Tu es têtue. Moi aussi. En garde ! |

### `ff2_totem_poche` (2 → 1)

| Avant | Après |
|---|---|
| **Agarica** : Qu'est-ce que c'est ? Un petit totem… fendu en deux, et tout froid.<br>**Xara** : Ancien. Les gardiens en portaient sur eux. Garde-le : les vieilles choses ont la mémoire longue. | **Xara** : Un vieux totem de poche, fendu. Garde-le, on ne sait jamais. |

### `ff2_envol` (3 → 2)

| Avant | Après |
|---|---|
| **Agarica** : Xara, là, en contrebas ! Ce cercle vert, au milieu de la mousse… La plante !<br>**Xara** : D'ici, tu planes. Prends de l'élan, saute, ouvre les ailes, et ne regarde pas le vide.<br>**Aide** : Saute du bord, puis Espace en l'air : plane jusqu'à la clairière → | **Agarica** : En bas, ce cercle vert… La plante !<br>**Aide** : Saute du bord, puis [Espace] en l'air : tu planes → |

### `amanite_rencontre` (14 → 8)

| Avant | Après |
|---|---|
| **Agarica** : Amanite ?!<br>**Amanite** : Agarica… Tu as survécu, dehors. Je ne pensais pas te revoir si haut.<br>**Agarica** : J'ai menti pour toi. Ils m'ont bannie, Amanite. Bannie !<br>**Amanite** : Je sais. Je ne te l'avais pas demandé… mais je ne l'oublierai pas.<br>**Agarica** : Je t'avais suppliée de la reposer. Ils m'ont bannie quand même.<br>**Amanite** : Tu ne m'as pas dénoncée aux gardes. Pour eux, c'était pareil. Je suis désolée.<br>**Agarica** : Et cette bête… tu l'as tuée. Elle était malade ! Kainati aussi l'était : je l'ai épargné, et la mousse l'a quitté.<br>**Amanite** : On arrache la mauvaise herbe, Agarica. On ne la console pas.<br>**Agarica** : Ce ne sont pas des mauvaises herbes. Ce sont les animaux de notre forêt !<br>**Amanite** : Tu as toujours eu le cœur trop grand. C'est pour ça que je t'aime bien… et pour ça que la forêt te dévorera.<br>**Amanite** : Je vais jusqu'à la source de la mousse. Seule. Ne te mets pas en travers de mon chemin.<br>**Agarica** : … Elle n'était pas comme ça, avant. Elle voulait aider, elle aussi.<br>**Xara (bulle)** : Elle veut toujours sauver la forêt. C'est bien ce qui m'inquiète.<br>**Xara (bulle)** : Plus haut, sur l'île au-dessus de nous : un totem t'attend. Le bond du singe devrait suffire. | **Agarica** : Amanite ! J'ai menti pour toi, et ils m'ont bannie !<br>**Amanite** : Je ne te l'avais pas demandé. Mais je ne l'oublierai pas.<br>**Agarica** : Amanite ! Je t'avais suppliée de la reposer. Ils m'ont bannie quand même.<br>**Amanite** : Pour eux, te taire, c'était pareil. Pardon.<br>**Agarica** : Et cette bête, tu l'as tuée ! Elle était malade. Kainati aussi, et je l'ai sauvé.<br>**Amanite** : On arrache la mauvaise herbe, Agarica. On ne la console pas.<br>**Amanite** : Je vais à la source de la mousse. Seule. Ne te mets pas en travers.<br>**Xara (bulle)** : Un totem t'attend sur l'île du dessus. Le bond du singe suffira. |

### `ff2_intro` — *supprimé (déclencheur gardé, sans texte)* (2 → 0)

| Avant | Après |
|---|---|
| **Agarica** : Des îles… qui flottent ! Et entre elles, on voit le vent monter !<br>**Xara (bulle)** : Les anciens gardiens savaient lier la pierre au vent. Ce vent-là ne te sert à rien… pour l'instant. | — |

### `aigle_revele` (4 → 2)

| Avant | Après |
|---|---|
| **Agarica** : Ce vent sous mes bras… Je me sens légère, comme une plume !<br>**Xara (bulle)** : L'aigle t'a choisie. Saute, puis saute encore en l'air : tu planeras. S pour piquer.<br>**Xara (bulle)** : Rejoins l'île d'en face. Si tu tombes, l'îlot du dessous te rattrapera… et le courant d'air te remontera.<br>**Aide** : Espace en l'air : tu planes — S : piqué — les courants d'air portent l'aigle | **Agarica** : Je me sens légère comme une plume !<br>**Aide** : [Espace] deux fois : tu deviens aigle et tu planes · [S] : piqué |

### `plante_examen` (6 → 3)

| Avant | Après |
|---|---|
| **Agarica** : La voilà… Elle est encore plus belle de près.<br>**Xara** : Regarde le sol. La mousse s'arrête net, en cercle, comme devant un mur invisible.<br>**Agarica** : Si je la rapporte, on pourra peut-être en faire un remède !<br>**Agarica** : Comment est-ce que je la prends ?<br>**Choix** : L'arracher avec ses racines<br>**Choix** : Ne prélever qu'une fleur | **Agarica** : Avec ça, on pourrait faire un remède. Je la prends comment ?<br>**Choix** : L'arracher avec ses racines<br>**Choix** : Ne prendre qu'une fleur |

### `plante_arracher` (3 → 1)

| Avant | Après |
|---|---|
| **Xara** : Attends ! Si tu l'arraches, il n'en restera rien. C'est peut-être la dernière.<br>**Agarica** : Oh… Tu as raison. Je ne prendrai qu'une fleur. Le reste doit vivre.<br>**Xara** : Les racines restent. La fleur repoussera. | **Xara** : Attends ! C'est peut-être la dernière. Une fleur suffit. |

### `plante_prelever` (2 → 1)

| Avant | Après |
|---|---|
| **Agarica** : Je ne prendrai qu'une fleur. Le reste doit vivre.<br>**Xara** : Sage. Les racines restent, la fleur repoussera. | **Agarica** : Une seule fleur. Le reste doit vivre. |

### `plante_apres` (2 → 1)

| Avant | Après |
|---|---|
| **Xara** : Une guérisseuse saurait quoi en faire. Il y en a une, pas loin d'ici… je sens ses papillons.<br>**Xara** : Les voilà. Suis-les. | **Xara** : Une guérisseuse saurait quoi en faire. Elle vit tout près : regarde ses papillons. |

### `plante_revue` (1 → 1)

| Avant | Après |
|---|---|
| **Agarica** : Un nouveau bouton pointe déjà, là où j'ai pris la fleur. | **Agarica** : Un nouveau bouton pousse déjà. |

### `clairiere_arrivee` (3 → 2)

| Avant | Après |
|---|---|
| **Agarica** : J'ai… j'ai réussi ! Je me suis posée !<br>**Xara (bulle)** : Avec une certaine élégance, même. Presque.<br>**Agarica** : La plante est juste là. Et autour d'elle, l'herbe est verte. Vraiment verte. | **Agarica** : J'ai réussi ! Je me suis posée !<br>**Xara (bulle)** : Avec une certaine élégance, même. Presque. |

### `plante_prelevement` (1 → 1)

| Avant | Après |
|---|---|
| **Aide** : Suis les papillons vers l'est → | **Aide** : Suis les papillons → |

### `morgat_accueil` (2 → 1)

| Avant | Après |
|---|---|
| **Morgat** : Doucement, mes petites, doucement… Elles t'ont trouvée bien avant que tu me trouves.<br>**Morgat** : Je suis Morgat. Et toi, tu sens la clairière : tu portes quelque chose que la mousse ne touche pas. | **Morgat** : Mes papillons t'ont repérée de loin, petite. Je suis Morgat. |

### `morgat_sans_fleur` (1 → 1)

| Avant | Après |
|---|---|
| **Morgat** : Mais tu reviens les mains vides. La plante, ma petite : il me faut une de ses fleurs, une seule. | **Morgat** : Rapporte-moi une fleur de la plante, dans la clairière. Une seule. |

### `morgat_fleur` (2 → 1)

| Avant | Après |
|---|---|
| **Agarica** : Une fleur de la plante. Je n'en ai pris qu'une, promis. Elle est pour vous.<br>**Morgat** : Une seule, et cueillie avec respect. Tu as de bonnes mains. Laisse-moi faire. | **Morgat** : Une seule fleur, cueillie avec soin. Tu as de bonnes mains. Laisse-moi faire. |

### `morgat_repulsif` (2 → 1)

| Avant | Après |
|---|---|
| **Morgat** : Voilà. Quelques gouttes de ceci, et la mousse recule en sifflant.<br>**Morgat** : En bas, dans la forêt sombre, un mur de mousse étouffe un vieux passage depuis des lunes. Le sentier, là-bas, y descend. | **Morgat** : Quelques gouttes, et la mousse recule. Le sentier, à gauche, mène à un mur de mousse. |

### `morgat_antidote` (2 → 1)

| Avant | Après |
|---|---|
| **Morgat** : Le reste de la fleur, je le garde : il me faut du temps pour un vrai antidote. Pour les bêtes qu'on peut encore sauver.<br>**Agarica** : On peut les sauver… Je le savais ! | **Morgat** : Le reste, je le garde : il me faut du temps pour un antidote. De quoi soigner les bêtes. |

### `morgat_totem` (2 → 1)

| Avant | Après |
|---|---|
| **Morgat** : Qu'est-ce qui dépasse de ta besace ? Un totem de poche, fendu… Regarde mes petites : elles tournent autour.<br>**Morgat** : Je ne sais pas le réparer. C'est plus vieux que moi. | **Morgat** : Un totem de poche, fendu. Mes papillons l'aiment bien. Moi, je ne sais pas le réparer. |

### `morgat_promesse` (1 → 1)

| Avant | Après |
|---|---|
| **Morgat** : Quand l'antidote sera prêt, mes papillons te le porteront. Où que tu sois. Même au cœur de la mousse. | **Morgat** : Quand l'antidote sera prêt, mes papillons te l'apporteront. Où que tu sois. |

### `morgat_xara_vol` (3 → 2)

| Avant | Après |
|---|---|
| **Xara** : À pied, il nous faudrait des jours. Mais depuis la falaise, à l'est, tu pourrais planer droit vers le cœur de la mousse.<br>**Agarica** : Planer aussi loin ? Je viens à peine d'apprendre !<br>**Morgat** : Les apprentis tombent toujours, la première fois. Tâche de tomber sur quelque chose de mou. | **Xara** : Depuis la falaise, à l'est, tu peux planer droit vers le cœur de la mousse.<br>**Morgat** : Les apprentis tombent toujours, la première fois. Vise quelque chose de mou. |

### `morgat_apres` (2 → 1)

| Avant | Après |
|---|---|
| **Morgat** : L'antidote mijote. Lui, il ne se presse pas.<br>**Morgat** : Mes papillons te trouveront, ma petite. Va, maintenant. La falaise est à l'est. | **Morgat** : L'antidote mijote. Va, la falaise est à l'est. |

### `hutte_panneau` (2 → 1)

| Avant | Après |
|---|---|
| **Narration** : « Forêt sombre — en contrebas. » Le sentier dévale la pente entre les racines.<br>**Xara** : Rien à faire là-bas pour l'instant. | **Xara** : « Forêt sombre, en contrebas. » Rien à faire là-bas pour l'instant. |

### `hutte_sentier` (3 → 3)

| Avant | Après |
|---|---|
| **Xara** : Le vieux passage étouffé par la mousse… Avec le répulsif, tu pourrais l'ouvrir. On descend ?<br>**Choix** : Descendre vers la forêt sombre<br>**Choix** : Pas maintenant | **Xara** : Avec le répulsif, tu peux ouvrir le vieux passage. On descend ?<br>**Choix** : Descendre vers la forêt sombre<br>**Choix** : Pas maintenant |

### `crash_depart` (2 → 2)

| Avant | Après |
|---|---|
| **Agarica** : Bon. La falaise. Le vide. Et la forêt malade, tout au bout. Xara… et si je n'y arrive pas ?<br>**Xara** : Alors tu tomberas plus près qu'en marchant. C'est déjà ça. Saute, et vise le cœur sombre. | **Agarica** : La falaise, le vide… Et si je n'y arrive pas ?<br>**Xara** : Tu tomberas plus près qu'à pied. Saute ! |

### `hutte_arrivee` — *supprimé (déclencheur gardé, sans texte)* (2 → 0)

| Avant | Après |
|---|---|
| **Agarica** : Tous ces papillons… on dirait des étincelles qui dansent.<br>**Xara (bulle)** : Les papillons de la guérisseuse. Ils l'ont déjà prévenue de notre arrivée. | — |

### `hutte_pas_encore` (1 → 1)

| Avant | Après |
|---|---|
| **Texte** : Pas si vite. Morgat nous attend, et ta fleur ne servira à rien au fond de ta besace. | **Texte** : Pas si vite : donne d'abord la fleur à Morgat. |

### `morgat_rencontre` (1 → 1)

| Avant | Après |
|---|---|
| **Aide** : La rampe d'envol est en haut de la falaise, à l'est → | **Aide** : La rampe d'envol : en haut de la falaise → |

### `fc1_reveil_1` (3 → 2)

| Avant | Après |
|---|---|
| **Xara** : Agarica ? … Agarica !<br>**Agarica** : Mmh… Xara ? J'ai… atterri ?<br>**Xara** : On peut appeler ça comme ça. Tu as surtout labouré la mousse avec ton nez. | **Agarica** : Mmh… J'ai atterri ?<br>**Xara** : Si on veut. Tu as surtout labouré la mousse avec ton nez. |

### `fc1_reveil_2` (2 → 1)

| Avant | Après |
|---|---|
| **Agarica** : Où sommes-nous ? Les arbres sont tout tordus… et la mousse respire.<br>**Xara** : Le cœur de la corruption. Tu n'as pas atterri où tu voulais… mais tu en es plus près que quiconque. | **Xara** : Bienvenue au cœur de la corruption. Pas où tu visais, mais tout près. |

### `fc1_note_geralt` (5 → 2)

| Avant | Après |
|---|---|
| **Narration** : Un campement abandonné. Sous une pierre, une page arrachée, couverte d'une écriture pressée.<br>**Narration** : « Jour 23. La mousse est plus épaisse ici que partout ailleurs. Elle pousse en spirale, autour de quelque chose. »<br>**Narration** : « Les bêtes malades tournent en rond près de l'antre. Elles ne mangent plus. Elles gardent. »<br>**Narration** : « Je n'irai pas plus loin seul. Clak refuse aussi. »<br>**Xara** : Geralt est venu jusqu'ici, à pied… et il a vu juste. Les bêtes « gardent ». Reste à savoir quoi. | **Narration** : « Ici, la mousse pousse en spirale. Les bêtes malades ne mangent plus. Elles gardent. » — Geralt<br>**Xara** : « Elles gardent »… mais quoi ? |

### `fc1_avant_arene` (3 → 1)

| Avant | Après |
|---|---|
| **Agarica** : Ce grondement… On dirait une respiration.<br>**Xara** : Énorme. Malade. Tout ce que nous avons traversé mène ici.<br>**Agarica** : Alors j'y vais. Mais si c'est une bête malade, je ne veux pas la tuer. | **Agarica** : Ce grondement… Si c'est une bête malade, je ne la tuerai pas. |

### `fc1_ferme` (2 → 1)

| Avant | Après |
|---|---|
| **Agarica** : La mousse… elle se referme derrière moi !<br>**Xara (bulle)** : Elle nous sent. Ne reste pas immobile. Avance. | **Xara (bulle)** : La mousse se referme derrière nous ! Avance. |

### `fc1_amas` (3 → 1)

| Avant | Après |
|---|---|
| **Xara (bulle)** : Un amas de mousse, dur comme de l'écorce. Il bouche toute la galerie.<br>**Agarica** : La force de l'ours devrait suffire.<br>**Aide** : Compétence de l'ours (touche A, F ou R) : brise l'amas. Le feu de camp recharge ton énergie. | **Aide** : [A], [F] ou [R] : l'ours brise l'amas. Un feu recharge l'énergie. |

### `fc1_papillons` (3 → 1)

| Avant | Après |
|---|---|
| **Agarica** : Des papillons ! Ceux de Morgat… Ils m'ont suivie jusqu'ici ?<br>**Agarica** : Et le totem de poche… il est tiède, dans ma besace.<br>**Texte** : Ils le reconnaissent. Ou lui les reconnaît. Garde-le près de toi. | **Agarica** : Les papillons de Morgat ! Ils m'ont suivie ? |

### `fc1_spirale` (3 → 2)

| Avant | Après |
|---|---|
| **Agarica** : Xara, regarde ce tronc. Une spirale gravée… On dirait une toile.<br>**Xara (bulle)** : … Ne la touche pas.<br>**Xara (bulle)** : Ce n'est pas le moment. Avance, Agarica. | **Agarica** : Une spirale gravée dans ce tronc… On dirait une toile.<br>**Xara (bulle)** : … Ne la touche pas. Avance. |

### `fc1_mur` (3 → 1)

| Avant | Après |
|---|---|
| **Xara (bulle)** : Un mur vivant. Il ne cédera ni à tes coups, ni à l'ours.<br>**Agarica** : Le répulsif de Morgat ! Quelques gouttes, elle a dit…<br>**Aide** : E devant le mur : verser le répulsif | **Texte** : [E] devant le mur : verser le répulsif |

### `ghilt_intro` (4 → 2)

| Avant | Après |
|---|---|
| **Ghil't** : GRRRROOOOAAAAH !<br>**Agarica** : Un tapir… gigantesque. La mousse lui coule du museau comme de la bave.<br>**Xara** : Ghil't, le Fléau de la Forêt. Méfie-toi de ses charges, de son souffle… et de ce qu'il crache !<br>**Agarica** : Il souffre, Xara. Je ne fuirai pas… mais je ne veux pas le tuer. | **Xara** : Ghil't, le Fléau de la Forêt. Gare à ses charges, à son souffle et à ce qu'il crache !<br>**Agarica** : Il souffre, Xara. Je ne veux pas le tuer. |

### `ghilt_chute` (3 → 2)

| Avant | Après |
|---|---|
| **Xara** : Il aspire toute la mousse de l'arène… Agarica, recule !<br>**Agarica** : Le sol… il tremble, je n'arrive plus à —<br>**Ghil't** : HHHHHHHHHH… | **Xara** : Il aspire toute la mousse… Recule !<br>**Ghil't** : HHHHHHHHHH… |

### `ghilt_retour` (3 → 1)

| Avant | Après |
|---|---|
| **Agarica** : Ghil't ! Je suis revenue.<br>**Xara** : Affaiblis-le, sans l'achever. Quand il vacillera, laisse les papillons faire le reste.<br>**Agarica** : Cette fois, je ne viens pas te combattre. Je viens te soigner. | **Agarica** : Ghil't ! Cette fois, je viens te soigner. |

### `trou_reveil` (2 → 1)

| Avant | Après |
|---|---|
| **Agarica** : … Où suis-je ? Il fait si noir… Ghil't était trop fort.<br>**Xara** : Chut. Respire. Regarde, là-haut… tu vois ces petites lumières ? | **Xara** : Ça va ? Tu es tombée de haut. Regarde, là-haut : ces petites lumières. |

### `trou_papillons` (3 → 1)

| Avant | Après |
|---|---|
| **Agarica** : Des papillons… ce sont ceux de Morgat !<br>**Xara** : « Où que tu sois », avait-elle dit. Ils ont tenu parole.<br>**Agarica** : Ils portent quelque chose, tout doucement… Un bocal ! L'antidote est prêt ! | **Agarica** : Les papillons de Morgat ! Ils portent un bocal… L'antidote ! |

### `trou_totem` (4 → 2)

| Avant | Après |
|---|---|
| **Agarica** : Il y en a si peu… Je devrais le boire ? Ou le lancer sur Ghil't ?<br>**Xara** : Ni l'un ni l'autre. Ton totem de poche brille depuis que les papillons sont là : verse l'antidote dedans.<br>**Agarica** : Comment tu sais ça, toi ?<br>**Xara** : Disons que j'ai déjà vu de vieilles choses se réveiller. Doucement, maintenant. | **Agarica** : Si peu d'antidote… Je le bois ? Je le jette sur Ghil't ?<br>**Xara** : Verse-le dans ton totem de poche. Il brille depuis que les papillons sont là. |

### `trou_sortie` (3 → 1)

| Avant | Après |
|---|---|
| **Agarica** : Le totem est tout chaud… Je sens les papillons, comme s'ils faisaient partie de moi.<br>**Xara** : Ils te prêtent leur force : soigner au lieu de détruire. Affaiblis Ghil't, puis laisse-les faire.<br>**Agarica** : Ils montent vers la lumière… Ils nous montrent le chemin. | **Xara** : Ils soignent au lieu de blesser. Affaiblis Ghil't, puis laisse-les faire. |

### `ghilt_soin` (3 → 2)

| Avant | Après |
|---|---|
| **Agarica** : Regarde, Xara… la mousse se retire ! Il respire, doucement.<br>**Agarica** : Tu n'étais pas un monstre. Tu étais malade, comme la forêt.<br>**Xara** : Cette marque, sur son flanc… Rien. Plus tard. | **Agarica** : La mousse s'en va… Tu n'étais pas un monstre. Juste malade.<br>**Xara** : Cette spirale, sur son flanc… Rien. Plus tard. |

### `ghilt_amanite` (7 → 4)

| Avant | Après |
|---|---|
| **Agarica** : Amanite ?! NON !<br>**Amanite** : Recule, Agarica. C'est fini. Le Fléau ne fera plus de mal à personne.<br>**Agarica** : Il était guéri ! La mousse était partie… il respirait, tu l'as vu !<br>**Amanite** : J'ai vu une bête qui reprenait des forces. La mauvaise herbe, ça repousse.<br>**Agarica** : Tu viens de détruire la seule preuve qu'on pouvait les sauver…<br>**Amanite** : J'ai sauvé le bosquet. Toi, tu jouais avec des papillons.<br>**Amanite** : Je rentre leur annoncer la nouvelle. Eux, au moins, sauront qui remercier. | **Agarica** : Amanite ?! NON !<br>**Amanite** : Recule. C'est fini. Le Fléau ne fera plus de mal à personne.<br>**Agarica** : Il était guéri ! On pouvait les sauver…<br>**Amanite** : La mauvaise herbe, ça repousse. J'ai sauvé le bosquet. Toi, tu jouais avec des papillons. |

### `ghilt_geralt` (4 → 3)

| Avant | Après |
|---|---|
| **Geralt** : Par toutes les racines… j'arrive trop tard, hein ?<br>**Agarica** : Geralt… je l'avais soigné. Amanite l'a achevé sous mes yeux.<br>**Geralt** : J'ai vu la mousse reculer. Ça, petite, personne ne l'avait jamais fait. Il était malade, pas la maladie : la source est ailleurs.<br>**Geralt** : Viens. On rentre au bosquet. Ton père doit entendre la vérité… de ma bouche, s'il le faut. | **Geralt** : Par toutes les racines… J'arrive trop tard, hein ?<br>**Agarica** : Je l'avais soigné. Amanite l'a tué.<br>**Geralt** : J'ai vu la mousse reculer, petite. Viens, ton père doit savoir. |

### Nom affiché d'Orme (1 → 1)

| Avant | Après |
|---|---|
| **Texte** : Orme, le vieux druide | **Texte** : Orme, le druide |

### `br_acclamations` (4 → 2)

| Avant | Après |
|---|---|
| **Orme** : Amanite a terrassé le Fléau de la Forêt ! Et elle nous a rapporté l'idole !<br>**Habitant** : Vive Amanite !<br>**Amanite** : Je vous l'avais promis. Il fallait frapper, et j'ai frappé. La forêt respire.<br>**Père** : Tu as rapporté l'idole… Le bosquet t'en doit beaucoup, Amanite. | **Orme** : Amanite a abattu le Fléau ! Et elle a rapporté l'idole !<br>**Père** : Le bosquet te doit beaucoup, Amanite. |

### `br_garde` (4 → 2)

| Avant | Après |
|---|---|
| **Garde** : Halte ! Agarica ? Tu es bannie, tu n'as rien à faire ici !<br>**Geralt** : Elle est avec moi. Range ta lance, mon garçon, avant de te piquer avec.<br>**Garde** : Et vous êtes qui, vous ?<br>**Geralt** : Quelqu'un que ton chef connaît depuis bien avant ta naissance. | **Garde** : Halte ! Agarica ? Tu es bannie !<br>**Geralt** : Elle est avec moi. Range ta lance, mon garçon, avant de te piquer avec. |

### `br_geralt_chef` (4 → 1)

| Avant | Après |
|---|---|
| **Père** : … Geralt ? Vieille racine ! Ça fait dix hivers !<br>**Geralt** : Onze. Et ta barbe a blanchi, ma vieille branche.<br>**Clak** : Clac !<br>**Père** : Et Clak, toujours aussi bavard. Que fais-tu ici… avec ma fille ? | **Père** : … Geralt ? Vieille racine ! Que fais-tu avec ma fille ? |

### `br_verite` (5 → 1)

| Avant | Après |
|---|---|
| **Geralt** : Je viens rétablir la vérité. J'étais à l'antre du Fléau. J'ai tout vu.<br>**Geralt** : Agarica a affaibli Ghil't sans jamais l'achever. Puis, avec les papillons de la guérisseuse, elle l'a guéri.<br>**Geralt** : La mousse a quitté son corps. Il respirait en paix, comme une bête qui sort d'une longue fièvre.<br>**Geralt** : Et c'est là qu'Amanite est arrivée. Elle a achevé une créature guérie.<br>**Narration** : Un murmure parcourt le bosquet. | **Geralt** : J'étais à l'antre du Fléau. Ta fille l'a guéri, avec des papillons. Et Amanite l'a achevé. |

### `br_amanite_confrontation` (5 → 3)

| Avant | Après |
|---|---|
| **Père** : Amanite… Est-ce vrai ?<br>**Amanite** : Guéri ? Pour combien de temps ? Une bête pareille aurait recommencé !<br>**Amanite** : J'ai fait ce que personne ici n'osait faire. Vous grattiez la mousse ; moi, je l'ai frappée au cœur.<br>**Agarica** : Il n'avait plus de mousse, Amanite. Il respirait. J'avais trouvé un moyen de les sauver…<br>**Amanite** : Un moyen ! Des papillons ! Et la prochaine bête, tu la berceras aussi ? | **Amanite** : Guéri ? Pour combien de temps ? Vous grattiez la mousse. Moi, je l'ai frappée au cœur.<br>**Agarica** : Il respirait, Amanite. On pouvait les sauver.<br>**Amanite** : Avec des papillons ? Et la prochaine bête, tu la berceras ? |

### `br_chef_jugement` (3 → 1)

| Avant | Après |
|---|---|
| **Père** : Tu as volé l'idole. Tu as laissé ma fille porter ton mensonge, et partir seule dans la nuit.<br>**Père** : Et aujourd'hui, tu voudrais qu'on t'acclame pour avoir tué une créature qu'elle venait de sauver.<br>**Père** : Le bosquet te remercie d'avoir rapporté l'idole. Mais il ne te doit rien d'autre, Amanite. | **Père** : Tu as laissé ma fille porter ton mensonge. Le bosquet ne te doit rien, Amanite. |

### `br_amanite_colere` (2 → 1)

| Avant | Après |
|---|---|
| **Amanite** : Très bien. Gardez vos papillons et vos prières.<br>**Amanite** : Cette pierre ne vous a jamais protégés. Je l'ai rapportée… je reprends ma part. | **Amanite** : Très bien. Cette pierre ne vous a jamais protégés. Je reprends ma part. |

### `br_amanite_depart` (4 → 1)

| Avant | Après |
|---|---|
| **Orme** : Elle a brisé l'idole !<br>**Amanite** : Quand la mousse reviendra — et elle reviendra — vous saurez où me trouver.<br>**Agarica** : Amanite, attends ! On peut encore…<br>**Amanite** : Non, Agarica. Toi, tu soignes. Moi, je finis le travail. | **Amanite** : Toi, tu soignes, Agarica. Moi, je finis le travail. |

### `br_apres` (4 → 3)

| Avant | Après |
|---|---|
| **Père** : Agarica. Je t'ai bannie pour un mensonge. Je n'avais pas su voir le reste.<br>**Père** : Tu es partie sans rien connaître du monde. Tu reviens avec un remède… et avec la vérité.<br>**Agarica** : Père… je voulais seulement la protéger. Elle, et la forêt.<br>**Père** : Je sais. Ce soir, ma fille, tu dormiras chez toi. | **Père** : Je t'ai bannie pour un mensonge, Agarica. Je n'avais pas vu le reste.<br>**Agarica** : Je voulais la protéger. Elle, et la forêt.<br>**Père** : Je sais. Ce soir, ma fille, tu dors à la maison. |

### `br_geralt_source` (5 → 1)

| Avant | Après |
|---|---|
| **Geralt** : Pas de fête trop longue, mes amis. Ghil't n'était pas la source de la mousse.<br>**Geralt** : C'était une victime. Un relais, peut-être. La mousse vient de plus profond, et elle pousse encore.<br>**Geralt** : J'ai la carte pour le prouver… enfin, une partie de la carte.<br>**Clak** : Clac.<br>**Geralt** : Oui. La partie que tu n'as pas mangée. | **Geralt** : Pas trop de fête : Ghil't n'était qu'une victime. La mousse vient de plus loin. |

### `br_xara_symbole` (4 → 2)

| Avant | Après |
|---|---|
| **Agarica** : Xara ? Tu es bien silencieuse.<br>**Xara** : Sur le flanc de Ghil't, sous la mousse… il y avait une marque. Une spirale, comme dans la forêt.<br>**Agarica** : Tu la connais, n'est-ce pas ?<br>**Xara** : Il est tard, Agarica. Profite de ta maison, ce soir. | **Agarica** : Xara, la spirale sur le flanc de Ghil't… Tu la connais ?<br>**Xara** : … Il est tard. Profite de ta maison, ce soir. |

### `br_cochons` (2 → 1)

| Avant | Après |
|---|---|
| **Agarica** : Oh ! Vous trois ! Vous m'avez attendue ?<br>**Narration** : Les trois bébés cochons trottinent autour d'elle, comme si elle n'était jamais partie. | **Agarica** : Vous trois ! Vous m'avez attendue ? |

### `br_final` (2 → 1)

| Avant | Après |
|---|---|
| **Agarica** : La forêt est encore malade. Amanite est quelque part, là-dehors, avec un morceau de l'idole…<br>**Agarica** : Je la retrouverai. Et je trouverai d'où vient la mousse. Promis. | **Agarica** : Je retrouverai Amanite. Et je trouverai d'où vient la mousse. Promis. |

### `bosquet_retour_garde` (1 → 1)

| Avant | Après |
|---|---|
| **Garde** : Pardon pour tout à l'heure, Agarica. Bon retour chez toi. | **Garde** : Pardon pour tout à l'heure. Bon retour, Agarica. |

### `bosquet_retour_porteur` (1 → 1)

| Avant | Après |
|---|---|
| **Habitant** : Des papillons qui soignent… Si on m'avait dit ça hier, j'aurais ri. | **Habitant** : Des papillons qui soignent… Hier, j'aurais ri. |

### `bosquet_retour_druide` (1 → 1)

| Avant | Après |
|---|---|
| **Orme** : Je te l'avais dit : la forêt n'est pas toujours cruelle. Elle t'a ramenée, petite. | **Orme** : Tu es revenue ! Je le savais. |

### `bosquet_retour_chef` (1 → 1)

| Avant | Après |
|---|---|
| **Père** : Repose-toi, ma fille. Demain, nous parlerons de la suite. | **Père** : Repose-toi. Demain, on parle de la suite. |

### `bosquet_retour_geralt` (1 → 1)

| Avant | Après |
|---|---|
| **Geralt** : La carte est à jour. Enfin, presque : Clak a mangé le coin sud. | **Geralt** : La carte est à jour. Sauf le coin sud : Clak l'a mangé. |

### Duel de Geralt : bulles `parry`, `column-hit`, `clak-stunned` — *supprimé* (3 → 0)

| Avant | Après |
|---|---|
| **Geralt** : Hé ! Elle m'a coûté cher, celle-là !<br>**Geralt** : Ha ! L'ancêtre ne rate jamais. Enfin… rarement.<br>**Geralt** : Clak ! Debout, tu es un totem ! | — |

### `br_amanite_colere_fin` — *supprimé* (1 → 0)

| Avant | Après |
|---|---|
| **Texte** : Amanite arrache un éclat de la couronne de l'idole et le serre dans son poing. | — |

## Combat de Ghil't (ses répliques sont dans acte2.js, ci-dessus)

`src/story/boss_ghilt.js` (bulles et aides du combat, dans l'ordre du fichier)

| Avant | Après |
|---|---|
| La mousse résiste… Affaiblis-le d'abord ! | Affaiblis-le d'abord ! |
| Utilise la compétence du papillon ! | Il vacille : la compétence du papillon, vite ! |
| Utilise la compétence du papillon ! | Il vacille : la compétence du papillon, vite ! |
| Suis les papillons vers la lumière. | Suis les papillons. |

## Menus : contrôles, chapitres, crédits

`src/scenes/MenuKit.js`


### `CONTROLS_GROUPS` (10 → 10)

| Avant | Après |
|---|---|
| **Titre** : Se déplacer<br>**Texte** : Sauter (2e saut : Singe, qui s'accroche aux lianes, ou Aigle)<br>**Texte** : Courir — forme du Loup (ou double appui ← / →)<br>**Texte** : Viser vers le haut<br>**Texte** : Viser en bas (en l'air, rebond) · piqué de l'Aigle · lâcher une liane<br>**Texte** : Attaquer là où l'on vise (sinon devant) · en Loup : coup de croc<br>**Texte** : Parler, examiner, interagir<br>**Texte** : Compétences (coûtent de l'énergie)<br>**Texte** : Sac (inventaire)<br>**Texte** : Carte du monde (une fois celle de Geralt trouvée) | **Titre** : Se déplacer<br>**Texte** : Sauter (2e appui en l'air : Singe ou Aigle)<br>**Texte** : Courir en Loup (ou double appui ← / →)<br>**Texte** : Viser vers le haut<br>**Texte** : Viser en bas (en l'air : rebond) · piqué de l'Aigle · lâcher une liane<br>**Texte** : Attaquer où l'on vise · en Loup : coup de croc<br>**Texte** : Parler, examiner, interagir<br>**Texte** : Compétences (coûtent de l'énergie)<br>**Texte** : Sac (inventaire)<br>**Texte** : Carte du monde (une fois celle de Geralt trouvée) |

### `CONTROLS_FORMS_NOTE` (3 → 3)

| Avant | Après |
|---|---|
| **Texte** : Les formes viennent toutes seules : courir = Loup, 2e saut = Singe ou Aigle <br>**Texte** : (en tombant d'un rebord aussi : 1er appui = saut, 2e = la forme ; sans forme aérienne, un seul saut), <br>**Texte** : eau = Pieuvre. Au feu de camp : E pour t'asseoir (soin, sauvegarde, carte), puis E pour son menu. | **Texte** : Les formes viennent toutes seules : courir = Loup, 2e appui sur Espace en l'air = Singe ou Aigle <br>**Texte** : (même en tombant d'un rebord ; sans forme aérienne, un seul saut), eau = Pieuvre. <br>**Texte** : Feu de camp : E pour t'asseoir (soin, sauvegarde), E encore pour son menu. |

### `CONTROLS_HINT_LINE` (1 → 1)

| Avant | Après |
|---|---|
| **Texte** : ←→/QD bouger · Espace sauter · Z/S viser · K attaquer · Shift courir · E agir · A F R compétences · I sac · Échap pause | **Texte** : ←→/QD bouger · Espace sauter · Z/S viser · K attaquer · Maj courir · E agir · A F R compétences · I sac · Échap pause |

### `MENU_CHAPTERS` (10 → 10)

| Avant | Après |
|---|---|
| **Texte** : Acte I<br>**Texte** : La mousse toxique ronge la forêt, et le bosquet lutte comme il peut…<br>**Texte** : Acte I<br>**Texte** : Bannie, Agarica s'enfonce seule dans les bois… mais quelqu'un l'observe.<br>**Texte** : Acte I<br>**Texte** : Des racines immenses, un totem du singe endormi… et un roi furieux au sommet.<br>**Texte** : Acte II<br>**Texte** : Des îles suspendues, un cartographe douteux et son crabe… et une fleur rare.<br>**Texte** : Acte II<br>**Texte** : Après la chute, la mousse est vivante. Au fond des bois, Ghil't attend. | **Texte** : Acte I<br>**Texte** : Une mousse ronge la forêt. Au bosquet, on la gratte chaque nuit.<br>**Texte** : Acte I<br>**Texte** : Bannie, Agarica part seule dans les bois. Enfin, presque seule.<br>**Texte** : Acte I<br>**Texte** : Un arbre géant, et un roi des singes très en colère au sommet.<br>**Texte** : Acte II<br>**Texte** : Des îles dans le ciel, un ranger douteux, son crabe et une fleur rare.<br>**Texte** : Acte II<br>**Texte** : Après la chute, la mousse est vivante. Au fond des bois, Ghil't attend. |
