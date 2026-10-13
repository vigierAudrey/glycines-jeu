# Feuille de route · Une journée aux Glycines

**Règle : une session de travail = une tâche.** On coche la tâche quand `pnpm verifier` passe et que le résultat a été vu dans le navigateur (ordinateur et téléphone si l'affichage change).

Légende : `[x]` fait · `[ ]` à faire · 🧑‍🏫 tâche pour Audrey (sans IA ou presque) · 🎓 ce que tu apprends

---

## Phase 0 · Fondations

- [x] **0.1** Créer le projet Vite + TypeScript + Three.js, les scripts `pnpm …` et la configuration.
  🎓 Ce qu'est un gestionnaire de paquets (pnpm), `package.json`, Vite.
- [x] **0.2** Écrire les documents : cahier des charges, feuille de route, architecture, décisions, glossaire, consignes pour les IA.
- [x] **0.3** Importer le référentiel du Bloc 2 (14 sous-compétences) et écrire le validateur de contenu avec ses tests.
  🎓 Pourquoi un test automatique protège la règle « le référentiel est la source de vérité ».
- [x] **0.4** Afficher l'aile B en 3D isométrique à partir du plan en données, avec les personnages immobiles, la rotation et la légende « Qui est qui ? ».
- [x] **0.5** 🧑‍🏫 Installer le projet dans `~/dev/glycine/glycines-jeu/glycines-jeu`, installer pnpm, lancer `pnpm install` puis `pnpm dev`, ouvrir le jeu.
- [x] **0.6** 🧑‍🏫 Créer le dépôt git, faire le premier commit, le pousser sur un dépôt GitHub public.
  🎓 git init, add, commit, push.
- [x] **0.7** Premier exercice : modifier la grille de `content/lieux/aile-b.json` (agrandir le patio, ajouter une porte) et observer le résultat.

## Phase 1 · Se déplacer dans l'aile B

- [x] **1.1** Toucher ou cliquer une case du sol : l'agent s'y rend en marchant (recherche de chemin sur la grille, sans traverser les murs).
  🎓 Le « raycasting » (trouver ce qu'on touche à l'écran) et l'algorithme A*.
- [x] **1.2** La caméra suit l'agent en douceur ; le zoom reste libre.
- [x] **1.3** Toucher un personnage : une bulle s'ouvre avec son nom et son métier.
- [x] **1.4** Meubles simples dans les chambres (lit, fauteuil, lavabo, sonnette) décrits en données dans le plan.
  🎓 Faits en formes simples (boîtes). L'import d'un modèle glTF (Kenney.nl en CC0, ou Blender) est reporté à G.2 et G.4, avec l'accord d'Audrey.
- [ ] **1.5** Test sur un vrai téléphone (accès au serveur de WSL depuis le wifi, voir docs/ARCHITECTURE.md).
  Procédure écrite dans `docs/ARCHITECTURE.md` ; reste le test sur le téléphone d'Audrey.
- [ ] **1.6** 🧑‍🏫 Ajouter toi-même un meuble dans la chambre de Mme Denise.
- [x] **1.7** Lisibilité des étiquettes dans une petite fenêtre : éviter que deux noms proches se chevauchent (IDE et Cadre, Vous et AS) et qu'une étiquette passe sous la barre du haut (Mme Rose).

## Phase 2 · Le moteur de mission

- [x] **2.1** Fixer le format d'une mission (étapes, choix, conséquences, compétences par étape) et l'écrire dans `docs/ARCHITECTURE.md`. Mettre à jour le validateur.
- [x] **2.2** Moteur de règles pur (sans 3D) : état de la mission, choix, points par compétence, niveaux N1 à N4. Tests unitaires.
- [x] **2.3** Panneau de dialogue en bas d'écran (verbal, paraverbal, non-verbal) et jauge de confiance.
- [x] **2.4** Mode observation (loupe) : repérer des éléments dans une pièce.
- [x] **2.5** Décision agir / adapter / alerter, et relais : aller jusqu'au bon professionnel.
- [x] **2.6** Écran de relève de fin de mission : niveau par compétence et questions de débriefing.
- [x] **2.7** Sauvegarde locale et code de reprise (sans compte).
- [x] **2.8** Lecture à voix haute des textes (synthèse vocale du navigateur).

## Phase 2 bis · Habillage graphique

- [ ] **G.1** Choisir la charte visuelle (palette, style des personnages) sur 2 ou 3 maquettes.
- [ ] **G.2** Personnages low-poly animés (marche, attente) avec tenues par métier et aides techniques des résidents.
- [ ] **G.3** Sols texturés, fenêtres, portes, éclairage chaud ; contrôle de la fluidité sur téléphone.
- [ ] **G.4** 🧑‍🏫 Modéliser dans Blender un objet métier (lève-personne ou chariot de soins) et l'importer.

## Phase 3 · Tranche verticale : « Le matin de M. Karim »

- [ ] **3.1** 🧑‍🏫 Rédiger les 3 ou 4 missions (avec le référentiel sous les yeux), passer leur statut à `valide`.
- [ ] **3.2** Intégrer les missions et jouer la séquence complète.
- [ ] **3.3** 🧑‍🏫 Test avec 2 ou 3 élèves : noter le temps, les blocages, ce qu'ils disent au débriefing.
- [ ] **3.4** Corriger d'après le test.

## Phase 4 · La journée complète du Bloc 2

- [ ] **4.1** Au moins une mission par sous-compétence (14), dans l'ordre de la progression (S1 et S2 d'abord).
- [x] **4.2** Écran d'accueil : choix de la mission, missions débloquées par séquence.
- [x] **4.3** Page enseignante : liste des missions, compétences, questions de débriefing à imprimer.
- [ ] **4.4** Mode hors ligne (PWA) et publication sur un hébergement statique.

## Phase 5 · Extensions

- [ ] **5.1** PSE du CAP.
- [ ] **5.2** Bloc 1 : cuisine, lingerie, entretien des espaces collectifs.
- [ ] **5.3** Aide en arabe (option).
