# Best Home Project — Vision & orientation éditoriale

> Document de référence : il oriente **tous les contenus et toutes les fonctionnalités** du site.
> À relire avant de rédiger un article, créer une rubrique ou ajouter un outil.

## 1. L'esprit du site

Best Home Project est un **safe place pour toute personne qui a un projet de construire une habitation** : en couple, pour sa famille, ou pour ses parents.

Le site n'est pas un simple blog bricolage/déco. C'est un **accompagnement de A à Z** : de la première idée jusqu'à la remise des clés, avec les bonnes informations, les bons outils et les bons **kits** à chaque étape.

**Promesse :** « Tu n'as pas à tout comprendre seul. On t'accompagne à chaque étape de ton projet de maison. »

## 2. À qui on s'adresse

- Les couples qui se lancent dans la construction de leur première maison.
- Les personnes qui construisent pour leurs proches : enfants, parents, famille.
- Plus largement, toute personne qui a **l'envie ou le projet** de créer son habitation, même sans savoir par où commencer.

## 3. Le cœur de l'offre : des kits pour tout le projet

Tous les contenus doivent mener, à terme, vers des **kits** dont les porteurs de projet auront besoin tout au long de leur parcours (modèles, checklists, trames de budget, grilles de comparaison de devis, cahiers des charges, etc.).

Règle éditoriale : **chaque article répond à une question réelle d'une étape du projet et débouche, quand c'est pertinent, sur le kit correspondant.**

## 4. Le parcours de A à Z

### Phase 0 — En amont du projet (avant même le plan)

Le site doit permettre de **renseigner des informations dès l'amont** :

- **Plan financier et budget alloué** : combien je peux investir, apport, financement, marge de sécurité.
- **Étude du projet** : comment cadrer son besoin, son terrain, ses contraintes.
- **Trouver un dessinateur / un professionnel pour le plan** : où chercher, quoi demander, comment comparer.
- **Obtenir et comparer les devis de construction.**

### Phase 1 — Lancer le projet

- Parcours **étape par étape** pour démarrer concrètement.
- **Trouver et choisir les entreprises / entrepreneurs** pour la construction : critères, questions à poser, pièges à éviter.

### Phase 2 — Le chantier

Suivi des étapes **de la fondation jusqu'à la livraison** : chaque grande étape du chantier a son guide, sa checklist et ses points de contrôle.

### Phase 3 — Livraison

Réception du chantier : la maison est terminée, tout est en place. Vérifications, réserves, remise des clés.

### Et ensuite — Rénovation, décoration, aménagement

Le site couvre **tous les projets de rénovation, de décoration et d'aménagement**, pour ceux qui ne construisent pas à partir de zéro ou qui prolongent leur projet après la livraison.

## 5. Ce que ça change pour le site

### Contenus
- Réorienter la ligne éditoriale : on passe de « bricolage/déco » à **« projet de maison, de A à Z »**.
- Structurer les contenus **par étape du projet** (budget → plan → devis → entreprises → chantier → livraison → aménagement/déco).
- Ton : rassurant, concret, accessible (cf. charte de ton existante, tutoiement).

### Arborescence
- Les rubriques actuelles (`lib/categories.ts`) sont centrées sur le bricolage et la déco : elles devront être **repensées autour du parcours** ci-dessus.
- Rappel : les pages de rubriques/sous-catégories sont en `noindex` ; ce sont les articles, auteurs et pages qui sont indexés.

### Fonctionnalités à prévoir
- **Saisie d'informations en amont du projet** : budget, financement, caractéristiques du projet.
- **Parcours étape par étape** de lancement et de suivi de chantier.
- **Kits téléchargeables ou interactifs** par étape.
- Aide pour **trouver dessinateurs et entreprises** et pour **comparer les devis**.

> Contrainte technique à garder en tête : le site est aujourd'hui un **export statique** (voir `README.md`). Les outils de saisie et de suivi nécessiteront soit du JavaScript côté navigateur, soit un backend le jour où des comptes ou des sauvegardes seront nécessaires.

## 6. Points à préciser

- Format exact des kits (PDF, tableurs, outils en ligne ?) et éventuel modèle économique.
- Niveau de personnalisation des outils : simple saisie locale, ou comptes utilisateurs avec sauvegarde ?
- Zone géographique visée (France, Madagascar, autre) : elle conditionne les aides, normes et noms de professionnels.
- Ordre de priorité : quelle phase du parcours construire en premier ?
