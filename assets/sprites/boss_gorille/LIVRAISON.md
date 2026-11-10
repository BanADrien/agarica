# Animations du gorille

Huit animations, 38 frames PNG RGBA. La référence originale est conservée.

- `sheets/` : planches originales produites avec l'outil intégré image_gen.
- `sheets_ready/` : planches à cellules régulières, une ligne par animation.
- `gorille_*_frames/` : images individuelles de 384 × 512 pixels.
- `animations.json` : chemins, durées par frame, boucles et origine commune.
- `apercu.html` : aperçu local animé, pause et vitesse réglable, sans serveur.
- `generation-prompts.json` : consignes de génération.

Le sol est à y = 472, l'origine à (0.5, 472/512). Les images utilisent une
mise à l'échelle proportionnelle constante par animation, sans étirement.
La trajectoire verticale du saut et de la charge est conservée. Les effets
disjoints sont regroupés avec leur pose. Deux silhouettes jointives de la
planche de mort sont séparées à leur jonction.

Pour reproduire le découpage depuis les planches originales :

```sh
python tools/prepare_gorille.py
```

Ce script dédié remplace le découpage générique décrit dans le README pour
ces planches. Dépendances : Pillow, numpy, scipy.

Les poses sont générées : de petites variations de dessin des ornements
subsistent. Aucun morphing ni interpolation déformante n'est appliqué entre
les frames. Les durées proposées sont visibles dans l'aperçu et ajustables
dans le manifeste pour l'intégration au jeu. Le chargement en jeu reste à
faire, comme prévu dans le README initial.
