# Journal de bord

Trois lignes par session : ce qui a été fait, ce qui reste à surveiller, la prochaine tâche.

## 12/10/2026 · Phase 0 (tâches 0.1 à 0.4)

- **Fait** : projet Vite + TypeScript + Three.js ; documents ; référentiel du Bloc 2 importé (14 sous-compétences) ; validateur et 11 tests ; aile B en 3D à partir du plan en grille, 6 résidents des cours et 6 professionnels identifiables par couleur de tenue, rotation par quarts de tour, légende « Qui est qui ? ». Vérifié : `npm run verifier` OK, affichage contrôlé à 1280 px, 390 px portrait et 844 px paysage, aucune erreur console.
- **À surveiller** : le libellé de CT3.4 est reconstitué dans la matrice (à vérifier sur l'arrêté) ; la mission `m00` est un exemple en brouillon ; les prénoms du personnel sont provisoires.
- **Prochaine tâche** : 0.5 (installer et lancer chez Audrey), puis 0.6 (git et GitHub).

## 12/10/2026 · Passage à pnpm

- **Fait** : pnpm 12.11.2 (fixé dans package.json), `pnpm-workspace.yaml` (esbuild autorisé), lockfile pnpm, documentation mise à jour ; phase 2 bis « Habillage graphique » ajoutée à la feuille de route. `pnpm verifier` OK.
- **À surveiller** : ne pas mélanger `npm install` et `pnpm install` dans ce projet.
- **Prochaine tâche** : 0.5 puis 0.6.

## 12/10/2026 · Installation chez Audrey (tâche 0.5)

- **Fait** : projet installé dans `~/dev/glycine/glycines-jeu/glycines-jeu`, pnpm 12.11.2 installé globalement, `pnpm dev` OK, jeu affiché dans VS Code (WSL: Ubuntu-24.04). Obstacles rencontrés et résolus : terminal PowerShell au lieu d'Ubuntu, dossier décompressé deux fois l'un dans l'autre, fichiers parasites `Zone.Identifier` de Windows, corepack incompatible (remplacé par `npm install -g pnpm`).
- **À surveiller** : dans un panneau étroit, des étiquettes se chevauchent (IDE et Cadre, Vous et AS) et « Mme Rose » passe sous la barre du haut : tâche 1.7 ajoutée.
- **Prochaine tâche** : 0.6 (git et GitHub privé).

## 12/10/2026 · Exercice de la grille et marche de l'agent (tâches 0.7 et 1.1)

- **Fait** : patio agrandi de 2 rangées, deuxième porte couloir/salle à manger (colonne 22, rangée 3) avec son test ; recherche de chemin A* dans `src/regles/chemin.ts` (9 tests), toucher bref ou clic = l'agent marche, glisser = la vue bouge ; boucle d'animation qui redessine pendant la marche puis s'arrête. `pnpm verifier` OK (22 tests), vérifié dans Chromium à 1280 px et 390 px (toucher, glisser, retour à 0 image par seconde à l'arrêt).
- **À surveiller** : l'agent peut s'arrêter sur la case d'un autre personnage (figurines superposées) ; un clic sur le haut d'un mur vise la case située derrière ; pas encore testé sur un vrai téléphone (tâche 1.5).
- **Prochaine tâche** : 1.2 (la caméra suit l'agent en douceur).

## 13/10/2026 · La caméra suit l'agent (tâche 1.2)

- **Fait** : `theatre.suivre(agent)` dans `creerScene.ts`, appelé par `marche.ts` à chaque toucher du sol ; la vue glisse en douceur (amorti exponentiel, même allure à 60 ou 120 images par seconde), le zoom reste libre, un glisser de l'élève rend la main. `pnpm verifier` OK (22 tests), vérifié dans Chromium à 1280 px (avec zoom molette pendant la marche) et 390 px (toucher, puis glisser pendant la marche), retour à 0 image par seconde à l'arrêt.
- **À surveiller** : sur ordinateur, le plan entier ne reste plus forcément à l'écran après une marche (bouton Recentrer) ; un pincement qui déplace aussi la vue arrête le suivi ; `favicon.ico` absent (erreur 404 sans gravité).
- **Prochaine tâche** : 1.3 (toucher un personnage : bulle avec son nom et son métier).

## 13/10/2026 · Commits et bulle des personnages (tâche 1.3)

- **Fait** : commits des tâches 0.7 et 1.1 puis 1.2 (sans push). Toucher une personne ouvre une bulle HTML avec son nom et son rôle (`src/regles/fiche.ts`, 5 tests ; `src/ui/bulle.ts`) ; détection à l'écran avec 24 px de tolérance ; toucher le sol ferme la bulle, Échap et le bouton × aussi ; le calque 3D est isolé pour que les étiquettes ne passent plus devant l'interface. `pnpm verifier` OK (27 tests), vérifié dans Chromium à 1280 px et 390 px.
- **À surveiller** : sur deux personnes très proches (IDE et Cadre), il faut viser le bon corps ; la bulle d'un résident ne montre que son nom (rien de `repris_du_cours`) ; « Mme Rose » passe désormais sous la barre du haut (mieux, mais 1.7 reste à faire).
- **Prochaine tâche** : 1.4 (meubles simples dans les chambres, décrits en données).

## 13/10/2026 · Meubles des chambres (tâche 1.4)

- **Fait** : commit de la tâche 1.3. Champ `meubles` dans `aile-b.json` (lit, sonnette, lavabo, fauteuil dans chaque chambre, sauf le fauteuil de Mme Denise, gardé pour l'exercice 1.6) ; cases occupées calculées par `plan.ts`, évitées par A* et par le placement des personnages ; 5 règles de validation ; `src/scene3d/meubles.ts` dessine les meubles en boîtes. `pnpm verifier` OK (40 tests), vérifié dans Chromium à 1280 px et 390 px, marche, suivi et bulle toujours bons.
- **À surveiller** : toucher un lit ne fait rien (l'agent ne va pas à côté) ; chaque meuble ajoute quelques dessins pour la carte graphique (environ 80 au total, à surveiller sur téléphone en 1.5) ; pas encore de modèle glTF.
- **Prochaine tâche** : 1.5 (test sur un vrai téléphone).

## 13/10/2026 · Téléphone (procédure) et étiquettes lisibles (tâches 1.5 en partie et 1.7)

- **Fait** : commit de la tâche 1.4. Procédure d'accès depuis le téléphone écrite (réseau « mirrored » de WSL ou redirection de port). Les noms des personnes ne se chevauchent plus (IDE et Cadre, Vous et AS) et ne passent plus sous la barre du haut (`src/regles/etiquettes.ts`, 5 tests). Vérifié dans Chromium à 1280 px et 390 px.
- **À surveiller** : un nom de personne peut encore couvrir un nom de pièce ; le bandeau « tournez votre téléphone » n'est pas pris en compte comme la barre.
- **Prochaine tâche** : 1.5 (test réel par Audrey), puis 2.1.

## 13/10/2026 · Format des missions et moteur de règles (tâches 2.1 et 2.2)

- **Fait** : 4 types d'étapes décrits dans `types.ts` et `docs/ARCHITECTURE.md` ; 9 nouvelles règles du validateur (6 tests) ; mission d'exemple de M. Karim complétée (toujours en brouillon) ; moteur pur `src/regles/mission.ts` (état, réponses, confiance, niveaux N1 à N4, bilan ; 9 tests). `pnpm verifier` OK (60 tests).
- **À surveiller** : les textes de la mission d'exemple sont à relire par Audrey ; seuils des niveaux à valider (D-014).
- **Prochaine tâche** : 2.3 (panneau de dialogue et jauge de confiance).

## 13/10/2026 · Jouer une mission (tâches 2.3 à 2.6)

- **Fait** : bouton Missions et liste ; panneau d'étape (dialogue verbal, paraverbal, non-verbal ; jauge de confiance) ; loupe avec repères de 44 px et cadrage animé de la pièce ; décisions Agir/Adapter/Alerter ; relais en touchant le bon professionnel ; relève avec niveaux et débriefing. Mission de M. Karim jouée de bout en bout dans Chromium à 390 px et 1280 px.
- **À surveiller** : sur téléphone, deux repères voisins sont proches (cases adjacentes) ; le panneau du dialogue prend 60 % de la hauteur en portrait ; l'agent se pose sur la case de la personne rejointe.
- **Prochaine tâche** : 2.7 (sauvegarde locale et code de reprise).

## 13/10/2026 · Sauvegarde et code de reprise (tâche 2.7)

- **Fait** : `src/regles/sauvegarde.ts` (code avec clé de contrôle, 5 tests), `src/ui/progression.ts` (localStorage protégé par try/catch, bloc du code sous la liste des missions), dernière relève affichée sur chaque mission ; règle de validation du préfixe `m00`. Vérifié dans Chromium : fin de mission → code `M00-333.GC`, reprise dans un navigateur vierge, faute de frappe refusée.
- **À surveiller** : le code s'allonge d'environ 6 caractères par mission (14 missions : environ 90 caractères, à reconsidérer en phase 4).
- **Prochaine tâche** : 2.8 (lecture à voix haute).

## 13/10/2026 · Lecture à voix haute (tâche 2.8)

- **Fait** : `src/ui/voix.ts` ; bouton 🔊 dans le panneau de mission et la relève (lit consigne, réplique, canaux et choix ; second appui = stop ; arrêt au changement de panneau ou quand la page est masquée). Vérifié dans Chromium avec une synthèse simulée (le texte envoyé est le bon).
- **À surveiller** : la voix réelle dépend de l'appareil (Windows, Android, iOS n'ont pas les mêmes voix françaises) : à écouter sur le téléphone en 1.5 ; la liste des voix peut être vide au tout premier appui sur certains navigateurs (voix par défaut utilisée).
- **Prochaine tâche** : 1.5 (test sur téléphone par Audrey), 1.6 (exercice d'Audrey), puis G.1 (charte visuelle) ou 3.1 (rédaction des missions).

## 13/10/2026 · Écran d'accueil et déblocage (tâche 4.2, faite en avance)

- **Fait** : `src/regles/deblocage.ts` (3 tests) ; accueil au lancement avec mot de bienvenue, choix de la séquence, missions verrouillées 🔒, code de reprise ; `?sequence=S2` et `?brouillons` dans l'adresse. Vérifié dans Chromium à 390 px.
- **À surveiller** : avec S1 par défaut, la mission d'exemple (S2) est verrouillée : ouvrir `http://localhost:5173/?sequence=S2` pour la jouer.
- **Prochaine tâche** : 4.3 (page enseignante).

## 13/10/2026 · Page enseignante (tâche 4.3, faite en avance)

- **Fait** : `enseignante.html` + `src/enseignante.ts` (sans 3D, 4 ko) : missions rangées par séquence, critères, points maximum, réponses attendues, débriefing, lien de classe `?sequence=` ; feuille d'impression. Construction en deux pages (`vite.config.ts`). `echapper()` déplacé dans `src/ui/echapper.ts`. Vérifié dans Chromium à 390 px et 1280 px.
- **À surveiller** : la page n'est pas protégée (les réponses attendues sont lisibles par qui connaît l'adresse) ; à ne pas donner aux élèves.
- **Prochaine tâche** : 4.4 (hors ligne et publication).

## 13/10/2026 · Hors ligne et publication (tâche 4.4, faite en avance)

- **Fait** : manifeste, icônes provisoires, `public/sw.js`, enregistrement dans `main.ts` (version construite seulement), workflow GitHub Pages manuel. Vérifié avec `pnpm preview` dans Chromium : copie de 11 fichiers, puis jeu et page enseignante rechargés hors ligne, sans erreur.
- **À surveiller** : jamais publié pour l'instant (aucune mission `valide` : la version publiée n'en montrerait aucune) ; `pnpm/action-setup` lit la version de pnpm dans `package.json`.
- **Prochaine tâche** : celles d'Audrey (1.5, 1.6, G.1, 3.1).

## 13/10/2026 · Première publication et test sur téléphone (tâche 1.5)

- **Fait** : droit `workflow` ajouté à `gh`, commits poussés, GitHub Pages activé (source : GitHub Actions), workflow lancé à la main : le jeu est en ligne sur https://vigieraudrey.github.io/glycines-jeu/. Audrey a joué la mission de M. Karim en entier sur son téléphone (`?brouillons&sequence=S2`).
- **À surveiller** : avertissements de GitHub (actions en Node.js 20, passage à Ubuntu 26 le 19/10/2026) à traiter en mettant à jour les versions du workflow ; retours détaillés d'Audrey sur le confort au téléphone à noter.
- **Prochaine tâche** : 1.6 (exercice d'Audrey), puis G.1 (charte visuelle) et 3.1 (rédaction des missions).

## 13/10/2026 · Fin des exercices (tâche 1.6)

- **Fait** : fauteuil de Mme Denise ajouté (colonne 15, rangée 2, tourné vers l'ouest, comme dans les autres chambres) ; consignes mises à jour dans CLAUDE.md, AGENTS.md, PROMPTS.md et la feuille de route (D-019).
- **Prochaine tâche** : G.1 (maquettes de la charte visuelle).

## 13/10/2026 · Retour au style d'origine (tâche G.1)

- **Fait** : charte C essayée en ligne puis annulée à la demande d'Audrey (`git revert`) ; le jeu retrouve le style « Glycine douce ». G.1 cochée avec ce choix (D-020).
- **Prochaine tâche** : G.2 (personnages personnalisés) ou 3.1 (missions), au choix d'Audrey.

## 13/10/2026 · Personnages personnalisés (tâche G.2)

- **Fait** : champ `apparence` (peau, cheveux, coiffure, gilet, lunettes) pour les 12 personnages, validé par `pnpm valider` ; figurines low-poly avec visage, 6 coiffures et lunettes ; résidents voûtés ; l'agent se tourne et balance bras et jambes en marchant. Vérifié dans Chromium (vue zoomée, agent en pleine marche).
- **À surveiller** : fluidité sur téléphone ; les apparences ont été choisies par l'IA, Audrey peut les changer dans le JSON (ou le demander).
- **Prochaine tâche** : 3.1 (rédaction des missions par l'IA, relecture par Audrey).

## 24/10/2026 · Sols, fenêtres, portes, lumière chaude (tâche G.3)

- **Fait** : sols texturés par type de pièce (parquet dans les chambres et les pièces collectives, carrelage au poste de soins et dans les services, mouchetis sur le patio), fenêtres bleutées sur les murs qui donnent sur l'extérieur, portes en bois entrouvertes à chaque seuil (orientation calculée dans `src/regles/plan.ts`, 5 tests ajoutés), éclairage teinté chaud. `pnpm verifier` OK (75 tests), vérifié dans Chromium à 1280 px (zoomé sur les détails) et 390 px, aucune erreur console.
- **À surveiller** : aucune fenêtre sur les murs autour du patio (seulement sur le vrai pourtour du bâtiment) ; reste G.4 (objet métier en 3D) avant de clore la phase 2 bis.
- **Prochaine tâche** : G.4 (objet métier en 3D) ou 3.1 (rédaction des missions), au choix d'Audrey.

## 24/10/2026 · Correction des portes et fenêtres (retour d'Audrey sur la tâche G.3)

- **Fait** : Audrey a trouvé les portes incohérentes (vantail entrouvert de travers, couleur du bois trop proche des lits) et les fenêtres pas réalistes (un bug les cachait : le cadre, plus grand dans les 3 dimensions et centré au même endroit que la vitre, la recouvrait entièrement). Portes refaites ouvertes à angle droit (comme sur un plan), couleur vert-gris distincte du bois des lits, montants et linteau autour du passage. Fenêtres refaites avec un cadre en 4 montants autour de la vitre (qui ne la cachent plus), une croisée et un rebord. `pnpm verifier` OK (70 tests), revérifié dans Chromium, plusieurs zooms et une rotation de la vue.
- **À surveiller** : une fenêtre se lit bien sur les murs qui font face à la caméra, moins sur ceux vus presque de profil (la vue isométrique) ; c'est inhérent à ce style de décor, pas un bug.
- **Prochaine tâche** : relecture par Audrey ; sinon G.4 ou 3.1.

## 24/10/2026 · Portes alignées sur le vrai mur (deuxième retour d'Audrey sur G.3)

- **Fait** : Audrey a repéré un espace entre le montant de la porte et le mur voisin. Cause : la porte était placée au centre de sa case (par exemple z = 3,5) au lieu du bord réel du mur manquant (z = 4), un écart de 0,5 m. `calculerPortes` (`src/regles/plan.ts`) regarde maintenant de quel côté la case de porte prolonge sa pièce (son voisin est ou ouest, nord ou sud selon le sens) pour placer la porte sur le bon bord ; 2 tests mis à jour ou ajoutés. `pnpm verifier` OK (71 tests), revérifié dans Chromium au même endroit que la capture d'Audrey : les montants touchent maintenant les murs.
- **Prochaine tâche** : relecture par Audrey ; sinon G.4 ou 3.1.

## 24/10/2026 · Lève-personne en 3D (tâche G.4)

- **Fait** : nouveau type de meuble `leve_personne` (socle en U sur 4 roulettes, mât, vérin, flèche et barre d'accroche pour le harnais, en formes simples comme les autres meubles ; bouton d'arrêt d'urgence rouge, comme la sonnette). Posé dans la chambre de M. Louis, le seul résident dont le cours dit « Nécessite un lève-personne et deux professionnels formés » (`repris_du_cours`). `pnpm verifier` OK (73 tests, dont un qui relie ce meuble au cours de M. Louis), vérifié dans Chromium à 1280 px (zoomé sur la chambre) et 390 px, aucune erreur console. La phase 2 bis « Habillage graphique » est maintenant complète (G.1 à G.4).
- **À surveiller** : aucune autre chambre n'a de lève-personne (seul M. Louis en a besoin d'après son cours) ; le modèle est en formes simples, pas un fichier 3D téléchargé (cohérent avec D-021).
- **Prochaine tâche** : 3.1 (rédaction des missions par l'IA, relecture par Audrey) : toutes les phases 0, 1, 2 et 2 bis sont maintenant cochées.

## 24/10/2026 · Rédaction des 4 missions (tâche 3.1)

- **Fait** : `m01-rose-patio-matin`, `m02-yvette-consigne-courte`, `m03-denise-projet-chambre`, `m04-louis-leve-personne`, toutes en `statut: "brouillon"`. Chaque mission reprend mot pour mot des critères du référentiel et ne s'appuie que sur le `repris_du_cours` déjà présent (habitudes de Mme Rose, communication adaptée à Mme Yvette, lever actif de Mme Denise, lève-personne à deux pour M. Louis). `pnpm verifier` OK (73 tests, 5 missions dont 5 en brouillon), contenu validé par `pnpm valider`, build réussi ; navigateur Chromium indisponible dans cet environnement pour une vérification visuelle (format identique à `m00`, déjà testé).
- **À surveiller** : M. André n'a pas de mission (son `repris_du_cours` est vide) ; aucune séquence précise n'étant indiquée dans les cours, les 4 missions utilisent `S2` comme l'exemple, à ajuster par Audrey si elle le souhaite.
- **Prochaine tâche** : 🧑‍🏫 Audrey relit les 4 missions et passe leur statut à `valide`, puis 3.2 (les intégrer et jouer la séquence complète).
