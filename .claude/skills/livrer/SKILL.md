---
name: livrer
description: Terminer une modification de Legend of Agarica (vérifier, commiter, mettre à jour les priorités, résumer à l'utilisateur). À utiliser dès qu'un changement est prêt, qu'il soit fait dans la conversation ou rendu par un agent, avant de dire que c'est fini.
---

# Livrer une modification

1. **Vérifier** avec le skill `verif` (la plus petite vérification qui couvre le changement).
   Pour le travail d'un agent : regarder aussi 2 ou 3 de ses captures et relire le cœur du diff.
2. **Commiter en local**, un commit par sujet :
   - `git add` des fichiers concernés seulement ; jamais `assets.zip`, jamais `dist/` ;
   - message en français sans accents, qui dit ce qui change pour le joueur ;
   - dernière ligne : l'attribution donnée par la session (`Co-Authored-By: …`).
3. **Ne jamais pousser** sans un « pousse » explicite de l'utilisateur dans son dernier
   message. Un accord donné plus tôt ne vaut pas pour les commits suivants. Rappeler en une
   ligne combien de commits attendent.
4. **Priorités** : retirer le point de `docs/production/PRIORITES.md` s'il y était, y ajouter
   ce qui reste (classé P1 à P4) et les questions ouvertes.
5. **Mémoire** : noter toute décision ou règle nouvelle de l'utilisateur (pas ce que le
   dépôt dit déjà).
6. **Images refaites** : changer le numéro de `src/data/asset_version.js`, sinon le
   navigateur garde les anciennes.
7. **Résumé à l'utilisateur**, en français, court :
   - ce qui change, avec les touches ou l'adresse pour l'essayer ;
   - ce qui a été vérifié et comment, et ce qui ne l'a pas été ;
   - les écarts, les limites et ce qui reste à décider ;
   - les chemins de fichiers en liens cliquables.
