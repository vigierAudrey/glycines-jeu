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

## 24/10/2026 · Correction des séquences et nouvelle mission S1 (retour d'Audrey sur la tâche 3.1)

- **Fait** : Audrey a remarqué que la séquence S1 n'avait aucune mission, et a donné accès à ses séquences et sa progression réelles (`C:\Users\audre\Documents\cours\CAP\CAP AAGA - Bloc 2`). Lecture des fiches de séance correspondantes : `m03-denise-projet-chambre` reprend en réalité la séance S6-03 (« Projet chambre de Mme Denise »), passée de `S2` à `S6` ; `m04-louis-leve-personne` reprend les séances S4-02 et S4-03 (lève-personne, deux professionnels formés), passée de `S2` à `S4`, et sa compétence CT3.1 remplacée par CT3.3 (compétence en appui réellement indiquée dans ces séances). Nouvelle mission `m05-rose-qui-fait-quoi` écrite à partir de la situation professionnelle de la séance S1-02 (« qui fait quoi, obligations, limites et prévention ») : Mme Rose demande un soin hors du rôle de l'agent, carton dans le couloir, stock de gants bas ; séquence `S1`, compétences CT3.1 et CT3.3 comme indiqué dans cette séance. `pnpm verifier` OK (73 tests, 6 missions dont 6 en brouillon).
- **À surveiller** : `m00` (Karim) et `m01`, `m02` restent en `S2` : vérifié que leur contenu correspond bien à des séances S1 et S2 (communication, écoute des besoins), sans contredire vos cours.
- **Prochaine tâche** : 🧑‍🏫 Audrey relit les 5 missions et passe leur statut à `valide`, puis 3.2.

## 24/10/2026 · Trois missions de plus, d'après S3, S1 et S6 (suite de la relecture des séquences)

- **Fait** : vérification de S3 à S7 dans vos séquences réelles : les 6 missions existantes étaient déjà bien placées (aucune autre correction nécessaire). Trois situations professionnelles riches et non utilisées ont été repérées, puis écrites en missions brouillon : `m06-denise-arrivee` (S1-07, « accueillir un nouveau résident » : CT3.1, CT3.2, CT3.3), `m07-karim-chambre-liens` (S3-02, « chambre de M. Karim » : lit médicalisé, radio, carnet de recettes, appel du dimanche avec sa sœur, proposition de cadres de sa fille ; C2.2.2, C2.1.1, C2.1.2) et `m08-denise-petit-fils` (S6-04, lien avec son petit-fils, décalage d'horaires ; C2.2.2, CT4.2). `pnpm verifier` OK (73 tests, 9 missions dont 9 en brouillon).
- **À surveiller** : la séquence S5 (dépression/troubles neurocognitifs, escarres/dénutrition/surdité/cécité, fin de vie) cite Rose, Yvette et André comme sujets d'exercices, mais sans fait précis attribué à chacun dans les fiches de synthèse (probablement dans les annexes .docx non lues) : aucune mission n'en a été tirée pour ne rien inventer. M. André n'a toujours pas de mission.
- **Prochaine tâche** : 🧑‍🏫 Audrey relit les 9 missions et passe leur statut à `valide`, puis 3.2 (les intégrer et jouer la séquence complète).

## 24/10/2026 · S5 ouverte aux annexes .docx et aux fichiers interactifs, 4 missions de plus dont M. André

- **Fait** : les .docx « Version prof » et « Annexes » de S5 ne contenaient que des gabarits vides (pas de fait attribué à un résident précis). Les fichiers `*_activite_interactive.html` des mêmes séances contenaient en revanche les situations réellement écrites pour la classe. Quatre faits exploitables trouvés, aucun inventé : Mme Rose est malentendante (séance 3) ; Mme Yvette peut se sentir désorientée et chercher sa chambre (séance 2) ; M. André peut mettre du temps à se lever, avoir une rougeur au talon et manger moins certains jours (séances 2 et 3) ; Mme Yvette peut confier une marque inexpliquée et une parole inquiétante (séance 6, bientraitance). Ces trois premiers faits ont été ajoutés au `repris_du_cours` de Rose, Yvette et André (reformulés sans poser de diagnostic, comme le veut la règle du jeu). Quatre missions brouillon écrites : `m09-rose-malentendante`, `m10-andre-talon-appetit` (première mission de M. André), `m11-yvette-cherche-chambre`, `m12-yvette-ecchymose`. Pour ce dernier sujet, sensible (bientraitance), Audrey a été consultée avant rédaction et a demandé de suivre fidèlement la situation de la séance, sans identifier qui est « il ». `pnpm verifier` OK (73 tests, 13 missions dont 13 en brouillon).
- **À surveiller** : `m12` porte sur un sujet sensible ; à relire avec attention avant de la faire jouer à des élèves.
- **Prochaine tâche** : 🧑‍🏫 Audrey relit les 13 missions et passe leur statut à `valide`, puis 3.2.

## 25/10/2026 · Cinq missions de plus pour que la séquence 1 soit complète

- **Fait** : à la demande d'Audrey, la séquence 1 (7 séances) n'avait que 2 missions (m05, m06 : séances 2 et 7). Lecture des fiches `*_complete.md` des séances 1, 3, 4, 5 et 6 (dossier `CAP AAGA - Bloc 2`) et écriture de 5 missions brouillon, une par séance manquante : `m13-information-fiable-famille` (séance 1, vérifier une source avant de répondre à une famille, CT3.1), `m14-rose-projet-de-vie` (séance 3, souhait changé de Mme Rose et mise à jour de son projet de vie, CT3.1 et CT4.2), `m15-yvette-tutelle-choix` (séance 4, choix de tenue de Mme Yvette malgré sa tutelle, CT3.1 et CT3.4), `m16-rose-confusion-soudaine` (séance 5, confusion inhabituelle à distinguer de ses changements progressifs, CT3.2 et C2.1.6) et `m17-karim-environnement-securise` (séance 6, aide ajustée et obstacle sur le trajet de M. Karim qui se déplace avec une canne, CT3.2 et CT3.3, avec une étape loupe). Pour rester fidèle aux cours, les éléments nouveaux (marche plus lente et tristesse de Mme Rose, canne et choix des vêtements de M. Karim, tutelle de Mme Yvette) ont été ajoutés au `repris_du_cours` de chaque résident avant d'écrire les missions, comme pour M. André précédemment. `pnpm verifier` OK (73 tests, 18 missions dont 5 nouvelles en brouillon) ; navigateur indisponible dans cet environnement, format identique aux missions déjà testées visuellement.
- **À surveiller** : les 5 nouvelles missions sont en brouillon, comme les 13 précédentes.
- **Prochaine tâche** : 🧑‍🏫 Audrey relit les 18 missions et passe leur statut à `valide`, puis 3.2.

## 25/10/2026 · Intégration et parcours complet (tâche 3.2)

- **Fait** : l'intégration des missions était déjà automatique (`src/contenu/charger.ts` prend tous les fichiers de `content/scenarios/`, l'écran d'accueil et le déblocage par séquence existaient depuis 4.2) ; 13 missions sur 18 sont déjà `valide` (seules m13 à m17, de la séance précédente, restent `brouillon`). Nouveau test `tests/sequence.test.ts` qui fait jouer les 18 missions en entier par le moteur de règles (bon choix à chaque étape, jusqu'à la relève) : aucune ne bloque, chaque compétence visée reçoit des points. `pnpm verifier` OK (91 tests).
- **À surveiller** : le navigateur Chromium n'a pas pu être installé dans cet environnement (l'installation demande un mot de passe administrateur) : la vérification visuelle du parcours complet (temps de jeu, confort de lecture) reste à faire par Audrey, comme pour les tâches 3.1 précédentes.
- **Prochaine tâche** : 🧑‍🏫 Audrey relit m13 à m17 et passe leur statut à `valide`, puis joue la séquence 1 en entier sur téléphone ou ordinateur (3.3 : test avec 2 ou 3 élèves).

## 25/10/2026 · Les 14 sous-compétences ont maintenant chacune une mission (tâche 4.1)

- **Fait** : 3 sous-compétences n'avaient encore aucune mission (C2.1.4 bien-être socio-esthétique, C2.1.5 préserver la continence, C2.2.1 entretien des espaces), toutes liées à des sujets qui touchent à l'intimité. Lecture des fiches `*_complete.md` des séances S4-04, S4-07 et S3-07 (dossier `CAP AAGA - Bloc 2`) et écriture de 3 missions brouillon, fidèles à ces séances : `m18-rose-coiffure-et-rougeur` (Mme Rose veut se coiffer avec sa crème habituelle, refuse un parfum, petite rougeur près d'un ongle à transmettre sans y toucher ; C2.1.4, CT4.1, C2.1.6), `m19-yvette-toilettes-urgentes` (Mme Yvette demande les toilettes en dehors de ses horaires habituels, tapis relevé à sécuriser soi-même, porte qui ferme mal à signaler ; C2.1.5, CT3.3) et `m20-karim-entretien-chambre` (M. Karim accepte l'entretien de sa chambre à condition de garder son carnet de recettes accessible, salle d'eau attendue dans 30 minutes ; C2.2.1, C2.2.2). Comme pour les missions précédentes, les faits nouveaux ont été ajoutés au `repris_du_cours` de Rose, Yvette et Karim avant d'écrire les missions. Nouveau test : chaque mission est maintenant jouée par le moteur de règles (pas seulement validée), donc les 3 nouvelles ont été vérifiées de la même façon que les 18 précédentes. `pnpm verifier` OK (94 tests, 21 missions dont 8 en brouillon) ; les 14 sous-compétences du référentiel ont désormais chacune au moins une mission.
- **À surveiller** : ces 3 missions touchent à des sujets sensibles (soin du corps, continence) : à relire avec la même attention que `m12` (bientraitance) avant de les passer en `valide`.
- **Prochaine tâche** : 🧑‍🏫 Audrey relit m13 à m20 et passe leur statut à `valide`, puis 3.3 (test avec 2 ou 3 élèves).

## 25/10/2026 · Respiration douce des personnages à l'arrêt

- **Fait** : à la demande d'Audrey (les personnages avaient l'air statiques), résidents, personnel et agent respirent légèrement à l'arrêt (léger soulèvement du buste et balancement, décalage de phase aléatoire par personnage). Nouvelle fonction `theatre.animerLentement` (cadence choisie, 10 images par seconde, séparée de la boucle à 60 im/s de la marche) pour rester léger en batterie, après qu'Audrey a choisi ce compromis parmi 3 niveaux proposés. `pnpm verifier` OK (94 tests, rien de cassé) ; navigateur indisponible dans cet environnement (voir tâche 3.2) pour une vérification visuelle directe.
- **À surveiller** : à vérifier par Audrey dans le navigateur, sur ordinateur et sur téléphone, que le mouvement reste discret et que l'autonomie de la batterie n'est pas visiblement affectée.
- **Prochaine tâche** : celles d'Audrey (valider m13 à m20, tester la respiration), puis 3.3.

## 25/10/2026 · Clignement des yeux et regard de côté

- **Fait** : à la demande d'Audrey d'aller plus loin dans le même sens, chaque personnage à l'arrêt cligne maintenant des yeux de temps en temps et tourne parfois la tête un instant vers un angle au hasard avant de revenir, chacun avec son propre minuteur aléatoire (pas de synchronisation entre personnages). Ajouté dans la même boucle à cadence réduite que la respiration (10 images par seconde) : aucun coût supplémentaire en batterie. `pnpm verifier` OK (94 tests).
- **À surveiller** : à vérifier par Audrey dans le navigateur que les deux mouvements (yeux, tête) restent discrets et ne gênent pas la lecture des étiquettes de noms ; navigateur indisponible dans cet environnement pour une vérification visuelle directe.
- **Prochaine tâche** : celles d'Audrey (valider m13 à m20, tester la respiration et ces nouveaux mouvements), puis 3.3.

## 22/11/2026 · Le « pourquoi » après une réponse incomplète (tâche P.1)

- **Fait** : le moteur (`src/regles/mission.ts`) renvoie maintenant `aRevoir`, la liste des compétences de l'étape qui n'ont pas eu tous leurs points. Sous « À retenir », un encadré « 📘 Ce qu'on attend d'un professionnel » rappelle leur critère officiel, pris dans la mission (donc mot pour mot du référentiel, rien d'inventé). Lu à voix haute comme le reste. `pnpm verifier` OK (un test de plus).
- **À surveiller** : navigateur indisponible dans cet environnement ; à regarder par Audrey en se trompant volontairement dans une mission.
- **Prochaine tâche** : P.2 (fiche de fin de mission à imprimer).

## 22/11/2026 · Fiche de fin de mission à imprimer (tâche P.2)

- **Fait** : le moteur garde le `parcours` de l'élève (pour chaque étape terminée : ce qu'il a choisi, réussi ou non). Sur la relève, le bouton « 🖨 Imprimer ma fiche » ouvre l'impression du navigateur (papier ou « Enregistrer en PDF ») avec une page propre : nom et date à écrire à la main, situation, niveaux et critères, choix étape par étape, questions de débriefing avec des lignes, « Ce que je retiens pour mon stage ». Rien n'est envoyé ni gardé en plus. `pnpm verifier` OK (96 tests).
- **À surveiller** : navigateur indisponible ici ; à essayer par Audrey sur ordinateur et téléphone (l'aperçu avant impression suffit).
- **Prochaine tâche** : P.3 (activité Transmission).

## 22/11/2026 · Nouvelle activité « Transmission » (tâche P.3)

- **Fait** : nouveau type d'étape `transmission` (moteur, validateur, panneau, page enseignante, tests). L'élève trie des phrases en Fait, Jugement ou Interprétation (définitions rappelées en haut) ; le retour affiche sa transmission, faite des phrases qu'il a gardées comme faits (un jugement gardé par erreur s'y voit). Première utilisation dans `m16` (Mme Rose, confusion soudaine), d'après votre séance S1-05, activité 3 « Habituel ou alerte ? » (« rédige une transmission factuelle ») et S1-02 (« une transmission décrit des faits observés ») : l'ancienne décision « Que transmettez-vous ? » est remplacée par un tri de 6 phrases tirées de la mission. `pnpm verifier` OK (98 tests).
- **À surveiller** : m16 est en brouillon, à relire (les 6 phrases). Navigateur indisponible ici pour une vérification visuelle.
- **Prochaine tâche** : P.4 (Protocole : remettre les étapes dans l'ordre).

## 22/11/2026 · Activités « Protocole » et « Matériel et produits » (tâches P.4 et P.5)

- **Fait** : deux nouveaux types d'étapes, `ordre` (toucher les étapes dans l'ordre, chacune numérotée ; « Recommencer » ; l'ordre attendu est montré en cas d'erreur) et `selection` (cocher ce qu'on prend, laisser le reste ; prévu aussi pour les stocks avec `stock` et `seuil`). Nouvelle mission brouillon `m21-karim-entretien-methode` (S3, C2.2.1 « Choix du matériel et des produits adaptés et utilisation correcte. ») d'après votre fiche protocole S3-07 : 9 objets pour le chariot (dont 3 pièges tirés des vigilances : flacon transvasé sans étiquette, mélange de produits, parfum pour masquer) et les 14 étapes regroupées en 8. `pnpm verifier` OK (103 tests).
- **À surveiller** : m21 à relire (surtout le regroupement des 14 étapes en 8). Navigateur indisponible ici.
- **Prochaine tâche** : P.6 (Réserve et stocks).

## 22/11/2026 · Réserve et seuil d'alerte (tâche P.6)

- **Fait** : nouvelle mission brouillon `m22-reserve-seuil-alerte` (S2, CT3.3 et CT3.1), fidèle à votre séance S2-10 : l'élève lit l'état de la réserve (quantité et seuil affichés à côté de chaque article), coche les gants M et les protections de nuit, trace dans le cahier de suivi, remplit la fiche d'alerte avant le week-end et fait avec ce qui reste sans remplacer un produit. Utilise l'activité `selection` de P.5 (aucun code nouveau). `pnpm verifier` OK (104 tests).
- **À surveiller** : pas d'étape relais, car aucun personnage n'est « chargé des stocks » dans le jeu (à décider par Audrey).
- **Prochaine tâche** : P.7 (Relève du matin).

## 22/11/2026 · Documents dans les étapes et mission « 16 h : deux imprévus » (tâche P.7)

- **Fait** : toute étape peut afficher un `document` (📋 titre et lignes, lu à voix haute, repris sur la page enseignante). Nouvelle mission brouillon `m23-seize-heures-deux-imprevus` (S7, CT3.1 et C2.1.6, marquée transfert donc N4 possible), d'après S7-05 « 24 heures aux Glycines » et son activité interactive : planning de l'après-midi, imprévus de 16 h (refus de Mme Denise, rougeur nouvelle de M. André), les 3 organisations et les 5 étapes « traiter un imprévu » reprises telles quelles, puis transmission, relais à l'infirmière et réponse au refus. `pnpm verifier` OK (105 tests).
- **À surveiller** : la tâche prévoyait une « relève du matin », absente de vos cours ; remplacée par ce planning de S7-05. Deux phrases à écarter dans la transmission (« Ce n'est sûrement pas grave », « Il a dû se cogner quelque part ») sont écrites par l'IA comme exemples de jugement et d'interprétation : à relire.
- **Prochaine tâche** : P.8 (Personnaliser une chambre).

## 22/11/2026 · Activité « Tri » et rangement de la chambre de Mme Denise (tâche P.8)

- **Fait** : nouveau type d'étape général `tri` (catégories au choix ; servira aussi ailleurs). Nouvelle mission brouillon `m24-denise-ranger-par-usage` (S6, C2.2.2 et CT4.2) d'après S6-03 et son activité interactive : 8 objets à ranger « chaque jour / chaque semaine / rarement », désaccord avec la fille sur les photos, démarche en 5 étapes, tout repris tel quel. Ajout au `repris_du_cours` de Mme Denise : déambulateur, lève difficilement les bras, veut garder photos, couture et tisane. `pnpm verifier` OK.
- **À surveiller** : le placement « sur le plan 3D » (glisser les objets dans la chambre) n'est pas fait : le tri en boutons est plus sûr sur téléphone. À reprendre si Audrey le souhaite après le test élèves.
- **Prochaine tâche** : P.9 (Secret professionnel).

## 22/11/2026 · Secret professionnel : la fille de Mme Rose (tâche P.9)

- **Fait** : nouvelle mission brouillon `m25-rose-fille-secret` (S2, CT3.4) d'après S2-06 : répondre à la fille de Mme Rose sans communiquer de diagnostic, aller prévenir l'infirmière, puis trier 4 demandes en « taire et orienter / transmettre à l'équipe / alerter » (corrections de l'activité 2 reprises). Utilise les activités existantes (aucun code nouveau). `pnpm verifier` OK.
- **À surveiller** : la fille de Mme Rose n'est qu'un texte (pas de personnage 3D).
- **Prochaine tâche** : P.10 (ordre des réponses mélangé).

## 22/11/2026 · Réponses mélangées (tâche P.10)

- **Fait** : les choix des décisions, les répliques des dialogues, les phrases de transmission et les éléments à cocher ou à trier sont montrés dans un ordre tiré au hasard, le même pendant toute la partie, nouveau à chaque partie. Le moteur et les points ne changent pas (indices d'origine). Les catégories du tri gardent leur ordre logique. `pnpm verifier` OK.
- **À surveiller** : aucun texte de mission ne doit dire « la réponse ci-dessus » (vérifié : aucun).
- **Prochaine tâche** : P.11 (variantes d'une mission).

## 22/11/2026 · Variantes d'une mission (tâche P.11)

- **Fait** : une mission peut avoir des variantes de contexte tirées au hasard (D-031). Première variante sur `m09` : la chambre de Mme Rose est peu éclairée (d'après S5-03 : « bruit, éclairage », « visage visible »). Page enseignante : variantes listées. 4 tests ajoutés, `pnpm verifier` OK (111 tests).
- **À surveiller** : les cours donnent rarement plusieurs contextes pour une même situation ; pas d'humeur de résident inventée.
- **Prochaine tâche** : P.12 (conséquences plus tard).

## 22/11/2026 · Conséquences plus tard (tâche P.12)

- **Fait** : une étape peut porter un rappel `si_oubli`. Manquée, elle laisse un rappel montré une fois au début d'une autre mission (« 📌 Depuis vos dernières missions »), gardé dans le navigateur seulement. Rappels écrits pour m00, m10 et m19. 3 tests, `pnpm verifier` OK (114 tests).
- **À surveiller** : les rappels disent ce qui n'a pas été fait et la bonne pratique, sans inventer de suite (pas de chute).
- **Prochaine tâche** : P.13 (auto-positionnement).

## 22/11/2026 · Auto-positionnement (tâche P.13)

- **Fait** : à l'intro d'une mission, volet facultatif pour estimer son niveau par compétence (N1 à N3, N4 si mission de transfert). La relève dit « Vous pensiez N2. Mieux que votre estimation… » ; la fiche imprimée a une colonne « Mon estimation ». Rien n'est enregistré. `pnpm verifier` OK (115 tests).
- **À surveiller** : affichage non vérifié au navigateur (Chromium absent) : à regarder sur téléphone.
- **Prochaine tâche** : P.14 (mode classe).

## 22/11/2026 · Mode classe (tâche P.14)

- **Fait** : avec `?classe` dans l'adresse, le jeu passe en grands caractères et, après chaque réponse, affiche « Débattez en classe » puis un bouton « Révéler la correction ». La page enseignante donne ce lien à côté du lien élèves. `pnpm verifier` OK.
- **À surveiller** : tailles choisies sans vidéoprojecteur sous la main : à ajuster après un premier essai en classe.
- **Prochaine tâche** : P.15 (pictogrammes).

## 22/11/2026 · Pictogrammes (tâche P.15)

- **Fait** : ✋ Agir, 🔄 Adapter, 📣 Alerter sur les choix ; un pictogramme par métier (🩺 infirmière, 🤝 aide-soignante, 📋 cadre, 🧹 ASH, 🎨 animatrice) dans « Qui est qui ? », la bulle et pendant un relais (liste des métiers). Emojis du système : aucune dépendance. `pnpm verifier` OK.
- **À surveiller** : le rendu des emojis varie selon le téléphone.
- **Prochaine tâche** : P.16 (lexique du métier).

## 22/11/2026 · Lexique du métier (tâche P.16)

- **Fait** : 26 mots du métier (projet de vie, tutelle, protocole, seuil d'alerte, intimité…) se touchent dans les textes des missions et ouvrent leur définition, reprise mot pour mot de la rubrique « Lexique » de la séance (source affichée). Liste complète sur la page enseignante. 3 tests, `pnpm verifier` OK (118 tests).
- **À surveiller** : termes médicaux volontairement exclus ; Audrey relit la liste.
- **Prochaine tâche** : P.17 (aide en arabe, voir 5.3).

## 22/11/2026 · Aide en arabe (tâche P.17) : mise en attente

- **Fait** : rien de codé. La tâche attend une personne arabophone pour relire les traductions, la marche à suivre est écrite dans la feuille de route.
- **À surveiller** : des traductions faites par l'IA et jamais relues ne doivent pas arriver devant les élèves.
- **Prochaine tâche** : Phase 4 bis terminée sauf P.17 ; suite : tâches 🧑‍🏫 (validation des brouillons, test élèves), puis Phase 5.

## 22/11/2026 · Cadre de santé chargé des stocks, pas d'arabe (D-032)

- **Fait** : `m22` a une étape relais vers M. Lemoine, cadre de santé, chargé des stocks. P.17 et 5.3 (arabe) abandonnées. CLAUDE.md : le contenu peut compléter les cours dans le sens du référentiel, et chaque complément est signalé.
- **À surveiller** : rien.
- **Prochaine tâche** : relecture avant de pousser sur GitHub.

## 22/11/2026 · Relecture visuelle avant de pousser

- **Fait** : premières captures réelles (téléphone 390 px, ordinateur, mode classe, page enseignante), aucune erreur dans la console. Trois corrections : flèche ▸ sur le volet « où vous situez-vous ? », réponse choisie affichée pendant le débat en mode classe, « à cocher / à ne pas cocher » dans les retours de sélection. La fiche imprimée montre la variante jouée.
- **À surveiller** : sur téléphone en portrait, le panneau couvre la moitié de l'aile (le conseil « tournez votre téléphone » s'affiche déjà).
- **Prochaine tâche** : pousser sur GitHub quand Audrey le dit.

## 22/11/2026 · Une question à la fois

- **Fait** : à la demande d'Audrey, le dialogue montre « Ce que je dis », puis « Comment je le dis », puis « Ce que fait mon corps », avec les réponses déjà données en résumé (bouton « Modifier »). Transmission et tri : un élément à la fois, avec des pastilles numérotées pour revenir en arrière. Vérifié à 390 px : plus de défilement. `pnpm verifier` OK.
- **À surveiller** : avec 8 éléments, les pastilles passent sur deux lignes sur téléphone.
- **Prochaine tâche** : publier quand Audrey le dit.
