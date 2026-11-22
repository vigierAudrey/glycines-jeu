# Feuille de route · Une journée aux Glycines

**Règle :** l'IA enchaîne les tâches et fait un bilan global à la fin. On coche une tâche quand `pnpm verifier` passe et que le résultat a été vu dans le navigateur (ordinateur et téléphone si l'affichage change). Audrey ne fait pas d'exercices de programmation : l'IA code, puis explique simplement ce qui a été ajouté.

**Reprendre après une coupure (forfait épuisé) :** dire simplement « continue la feuille de route ». L'IA reprend la première tâche `[~]` (commencée), sinon la première `[ ]` qui n'est pas 🧑‍🏫. Une tâche commencée mais pas finie est marquée `[~]` avec une ligne « Reste à faire : … » juste en dessous.

Légende : `[x]` fait · `[~]` commencé · `[ ]` à faire · 🧑‍🏫 ce qu'Audrey seule peut faire (valider un contenu pédagogique, tester avec des élèves) · 🎓 notion expliquée

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
- [x] **1.5** Test sur un vrai téléphone (accès au serveur de WSL depuis le wifi, voir docs/ARCHITECTURE.md).
  Fait par la version publiée sur GitHub Pages (la procédure wifi reste dans `docs/ARCHITECTURE.md`).
- [x] **1.6** Fauteuil de Mme Denise ajouté dans le plan (l'exercice prévu pour Audrey est supprimé).
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

- [x] **G.1** Choisir la charte visuelle (palette, style des personnages) sur 2 ou 3 maquettes.
  Après essai de la charte C « Repères nets » en ligne, Audrey garde le style actuel (A « Glycine douce »). Personnages plus personnalisés à faire en G.2.
- [x] **G.2** Personnages low-poly animés (marche, attente), plus personnalisés (visage, cheveux, silhouette selon l'âge), avec tenues par métier.
  Fait : visage, 6 coiffures, lunettes, gilets des résidents, silhouette voûtée, marche animée de l'agent. Pas d'animation d'attente (batterie) ; aides techniques des résidents (canne, déambulateur…) à ajouter seulement si les cours les mentionnent.
- [x] **G.3** Sols texturés, fenêtres, portes, éclairage chaud ; contrôle de la fluidité sur téléphone.
- [x] **G.4** Un objet métier en 3D (lève-personne ou chariot de soins), fait par l'IA en formes simples ou repris d'un modèle libre de droits (avec l'accord d'Audrey).

## Phase 3 · Tranche verticale : « Le matin de M. Karim »

- [x] **3.1** L'IA rédige les 3 ou 4 missions à partir du référentiel et des cours ; 🧑‍🏫 Audrey les relit, les corrige et passe leur statut à `valide`.
  18 missions rédigées en brouillon (m01 à m17), couvrant les 6 résidents dont, enfin, M. André (m10 : deux faits trouvés dans les fichiers interactifs de la séquence 5). Toutes les `sequence_requise` ont été vérifiées contre vos séances réelles (dossier `CAP AAGA - Bloc 2`) : S1 (m05, m06, m13, m14, m15, m16, m17), S2 (m00, m01, m02), S3 (m07), S4 (m04), S5 (m09, m10, m11, m12), S6 (m03, m08). `m12` (Mme Yvette, bientraitance) porte sur un sujet sensible, écrit avec l'accord explicite d'Audrey, fidèle à sa séance. Cinq missions de plus ajoutées à la demande d'Audrey pour que la séquence 1 couvre ses 7 séances (elle n'en avait que 2, m05 et m06) : `m13` (séance 1, fiabilité d'une source avant de répondre à une famille), `m14` (séance 3, projet de vie de Mme Rose après un souhait changé), `m15` (séance 4, choix du quotidien de Mme Yvette malgré sa tutelle), `m16` (séance 5, confusion soudaine de Mme Rose à distinguer de ses changements progressifs) et `m17` (séance 6, aide ajustée et environnement sécurisé pour M. Karim). Trois faits ajoutés à leur `repris_du_cours` pour ces missions, directement repris des situations professionnelles des séances concernées (marche plus lente et tristesse de Mme Rose, canne de M. Karim, tutelle de Mme Yvette). 🧑‍🏫 À faire par Audrey : relire les 18 missions (dans le jeu avec `?brouillons`, en changeant de séquence dans la liste, ou sur la page enseignante) et passer leur statut à `valide` dans chaque fichier une fois corrigées.
- [x] **3.2** Intégrer les missions et jouer la séquence complète.
- [ ] **3.3** 🧑‍🏫 Test avec 2 ou 3 élèves : noter le temps, les blocages, ce qu'ils disent au débriefing.
- [ ] **3.4** Corriger d'après le test.

## Phase 4 · La journée complète du Bloc 2

- [x] **4.1** Au moins une mission par sous-compétence (14), dans l'ordre de la progression (S1 et S2 d'abord).
- [x] **4.2** Écran d'accueil : choix de la mission, missions débloquées par séquence.
- [x] **4.3** Page enseignante : liste des missions, compétences, questions de débriefing à imprimer.
- [x] **4.4** Mode hors ligne (PWA) et publication sur un hébergement statique.
  Prêt ; la première publication (lancer le workflow) est à faire par Audrey quand elle le souhaite.

## Phase 4 bis · Apprendre mieux (idées du 22/11/2026)

Ordre de travail : de haut en bas. Chaque tâche = un commit. Les tâches 🧑‍🏫 de la phase 3 (valider m13 à m20, test avec des élèves) restent prioritaires pour Audrey ; l'IA avance ici pendant ce temps.
Règle commune : toute nouvelle activité s'appuie sur une situation réelle des cours (`Documents\cours\CAP\CAP AAGA - Bloc 2\Sequences`), jamais inventée. Une mission `valide` modifiée repasse en `brouillon` (noté dans le journal) pour qu'Audrey la relise.

### Mieux expliquer après chaque choix

- [x] **P.1** Le « pourquoi » : après une réponse incomplète, le retour rappelle le critère officiel du référentiel concerné (pris automatiquement dans la mission, rien d'inventé).
- [x] **P.2** Fiche de fin de mission à imprimer ou enregistrer en PDF : niveaux par compétence, critères, ce que l'élève a choisi, questions de débriefing avec des lignes pour répondre. À ranger dans un carnet de bord (stage, oral).

### Nouvelles activités (types d'étapes : moteur, validateur, écran, page enseignante, tests)

- [x] **P.3** **Transmission** : l'élève trie des phrases en « fait observé », « jugement » ou « interprétation », puis garde seulement ce qui doit être transmis (C2.1.6, CT3.4). Ajoutée dans une ou deux missions qui s'y prêtent (rougeur de Mme Rose, confusion soudaine…).
- [x] **P.4** **Protocole** : remettre les étapes dans l'ordre (C2.1.1, C2.2.1). Le jeu prépare le TP, il ne le remplace pas.
- [x] **P.5** **Matériel et produits** : choisir ce qu'il faut (et écarter ce qui ne convient pas) avant un soin ou un entretien.
- [x] **P.6** **Réserve et stocks** : comparer stock et seuil, cocher ce qu'il faut signaler sur la fiche d'alerte (CT3.3).
  Fait : `m22`. 🧑‍🏫 Audrey dit qui est « chargé des stocks » aux Glycines si elle veut une étape relais.
- [x] **P.7** **Relève et imprévus** : un document (planning, transmissions) peut s'afficher dans n'importe quelle étape ; l'élève le lit puis choisit par quoi commencer (CT3.1).
  Fait : `m23` (16 h, deux imprévus) d'après S7-05. Vos cours n'ont pas de « relève du matin » avec des transmissions de nuit : à écrire plus tard si vous en faites une séance.
- [x] **P.8** **Personnaliser une chambre** : placer les objets du résident selon ses souhaits (C2.2.2, C2.1.2).
  Fait : activité générale `tri` et mission `m24` (Mme Denise, rangement par fréquence d'usage) d'après S6-03.
- [x] **P.9** **Secret professionnel** : une mission où un proche ou un autre résident pose une question ; l'élève choisit de taire, transmettre ou alerter (CT3.4), d'après une séance réelle.
  Fait : `m25` d'après S2-06.

### Rejouer et relier les missions

- [x] **P.10** Ordre des réponses mélangé à chaque partie, pour qu'on ne retienne pas « c'est toujours la deuxième ».
- [x] **P.11** Variantes d'une même mission (moment de la journée, humeur du résident) tirées au hasard, écrites d'après les cours.
  Fait : champ `variantes` (contexte seulement, mêmes réponses) ; première variante sur `m09` (chambre peu éclairée, d'après S5-03). Les cours ne donnent pas d'autres contextes : on en ajoutera au fil des nouvelles séances.
- [ ] **P.12** Conséquences plus tard : un oubli dans une mission (tapis non signalé…) réapparaît au début d'une mission suivante, gardé dans le navigateur seulement.

### Garder une trace, sans collecter de données

- [ ] **P.13** Auto-positionnement : avant la mission, l'élève estime son niveau (N1 à N4) par compétence ; la relève compare avec le niveau obtenu.
- [ ] **P.14** Mode classe (`?classe`) : grands caractères pour le vidéoprojecteur, réponses cachées jusqu'au bouton « Révéler » pour laisser la classe débattre ; la page enseignante donne le lien.

### Aider les élèves qui lisent difficilement

- [ ] **P.15** Pictogrammes sur les choix (agir, adapter, alerter) et sur les métiers à rejoindre pour un relais.
- [ ] **P.16** Lexique du métier : les mots clés des textes (« transmission », « projet de vie »…) se touchent et ouvrent une définition courte, tirée des cours. 🧑‍🏫 Audrey valide les définitions.
- [ ] **P.17** Aide en arabe : voir 5.3 (consignes et lexique d'abord).

## Phase 5 · Extensions

- [ ] **5.1** PSE du CAP.
- [ ] **5.2** Bloc 1 : cuisine, lingerie, entretien des espaces collectifs.
- [ ] **5.3** Aide en arabe (option).
