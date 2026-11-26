# Journal des décisions

Chaque décision importante est notée ici avec sa raison, pour ne pas la rouvrir sans motif.
Format : contexte → décision → pourquoi → ce qu'on abandonne.

## D-001 · Web (Three.js) plutôt que Godot · 12/10/2026

- **Contexte** : jeu 3D isométrique jouable sur PC **et téléphones** (Android et iPhone), par des élèves, sans installation.
- **Décision** : application web en TypeScript avec Three.js.
- **Pourquoi** : léger (quelques centaines de Ko), s'ouvre d'un lien ou d'un QR code, installable en PWA sur iPhone comme sur Android ; les IA de code maîtrisent bien Three.js ; compétences réutilisables pour la plateforme pédagogique et BlobSurf.
- **Ce qu'on abandonne** : l'éditeur visuel de Godot. Compensation : le plan et les meubles sont décrits en données éditables à la main.
- **À reconsidérer si** : jeu réservé au PC, ou projet en réalité virtuelle.

## D-002 · Vite + TypeScript · 12/10/2026

TypeScript signale les erreurs avant l'exécution, ce qui sécurise le code écrit par une IA. Vite donne le rechargement instantané et une construction simple.

## D-003 · Contenu pédagogique séparé du moteur, en JSON · 12/10/2026

Le moteur ne connaît pas le CAP AAGA. Toute la pédagogie est dans `content/`. Ajouter la PSE ou le Bloc 1 = ajouter des fichiers.

## D-004 · Référentiel copié et validé automatiquement · 12/10/2026

`content/referentiel/bloc2.json` est extrait de la matrice des cours (version du 16/08/2026). Le validateur exige que chaque mission cite un critère officiel **mot pour mot**. Attention : le libellé de CT3.4 a été reconstitué lors de l'extraction (voir le champ `avertissement`) ; à vérifier sur le texte de l'arrêté.

## D-005 · Pas de compte élève · 12/10/2026

Sauvegarde dans le navigateur et code de reprise. Aucune donnée personnelle, aucun traceur, aucun service tiers (privacy by design).

## D-006 · Interface en HTML par-dessus la 3D · 12/10/2026

Texte net, accessible, compatible avec la lecture à voix haute et les lecteurs d'écran ; plus simple à faire évoluer que des boutons dessinés en 3D.

## D-007 · Dépôt dans WSL, hors Nextcloud · 12/10/2026

Le projet vit dans `~/dev/glycine/glycines-jeu/glycines-jeu` (WSL) avec un dépôt GitHub public. Jamais dans `Documents\cours\` : `node_modules` contient des milliers de fichiers que Nextcloud synchroniserait.

## D-008 · Rendu à la demande et étiquettes selon la densité · 12/10/2026

On ne redessine que si la vue change (batterie des téléphones). Les étiquettes se masquent par niveaux quand la vue est petite, pour rester lisible à 390 px.

## D-009 · pnpm comme gestionnaire de paquets · 12/10/2026

- **Décision** : pnpm (version fixée dans `package.json`, champ `packageManager`), à la demande d'Audrey. Installé globalement avec `sudo npm install -g pnpm@12.11.2` : corepack a été écarté (sa version fournie avec Node 22 ne sait pas lancer pnpm 12, et `corepack enable` bute sur le yarn déjà installé).
- **Pourquoi** : plus rapide, économe en disque, et plus sûr : pnpm 12 bloque par défaut les scripts d'installation des bibliothèques et les versions publiées depuis moins d'un jour.
- **Conséquences** : `pnpm-workspace.yaml` autorise uniquement esbuild (outil utilisé par tsx) à exécuter son script d'installation. Vitest est fixé en 5.0.2 plutôt que 5.0.4, publiée le jour même. `package-lock.json` est remplacé par `pnpm-lock.yaml`.

## D-010 · Rendu continu seulement pendant les animations · 12/10/2026

- **Décision** : `theatre.animer(animation)` lance une boucle `requestAnimationFrame` qui redessine à chaque image tant qu'une animation renvoie `true`, puis s'arrête. Hors animation, le rendu à la demande (D-008) reste la règle.
- **Pourquoi** : une marche fluide demande environ 60 images par seconde, mais redessiner en permanence viderait la batterie des téléphones.
- **Conséquences** : toute animation future (caméra qui suit l'agent en 1.2, personnages animés en G.2) passe par `animer`. La recherche de chemin (A*, 8 directions, sans couper les coins) reste dans `src/regles/` et réutilise les murs calculés par `plan.ts` : un seul endroit décide où sont les murs.

## D-011 · La caméra suit l'agent, mais l'élève garde la main · 13/10/2026

- **Décision** : pendant une marche, le centre de la vue rejoint l'agent en douceur. Le suivi s'arrête dès que l'élève fait glisser la vue (ou touche « Recentrer ») et reprend au toucher suivant. Le zoom n'est jamais modifié par le suivi.
- **Pourquoi** : sur téléphone en portrait, la vue est zoomée et l'agent sortirait vite de l'écran ; mais un élève qui veut regarder ailleurs ne doit pas être ramené de force.
- **Comment** : le suivi est une animation de `theatre.animer` (D-010) ; il détecte un glisser en constatant que le centre de la vue n'est plus celui qu'il a posé à l'image précédente.
- **Ce qu'on abandonne** : une « zone morte » (ne suivre que quand l'agent approche du bord), plus confortable sur grand écran mais plus complexe. À reconsidérer après le test sur téléphone (1.5).

## D-012 · Bulle des personnages : cible à l'écran, bulle en HTML · 13/10/2026

- **Décision** : un personnage est « touché » si le doigt est à moins de 24 px de sa silhouette projetée à l'écran (pieds → étiquette), et non par un rayon qui doit frapper la figurine 3D. La bulle est un élément HTML du calque interface, replacé après chaque dessin, plutôt qu'une étiquette 3D (CSS2D).
- **Pourquoi** : une figurine fait environ 10 px sur téléphone, bien en dessous des 44 px exigés par le cahier des charges. En HTML dans l'interface, la bulle reste au-dessus des étiquettes, peut contenir un vrai bouton de fermeture et est lue par les lecteurs d'écran (`role="status"`).
- **Conséquence** : le calque 3D est isolé (`isolation: isolate`) pour que les z-index posés par Three.js sur les étiquettes ne passent jamais devant l'interface. `toucher.ts` ne décide plus rien : il dit ce qui est sous le doigt (personnage et/ou sol), `main.ts` choisit l'action.
- **Ce qu'on abandonne** : rien de ce qui était prévu ; la bulle n'affiche que le nom et le rôle, jamais d'élément médical (règle `repris_du_cours`).

## D-013 · Meubles en formes simples, décrits en données · 13/10/2026

- **Décision** : chaque meuble est une ligne du plan (`type`, `colonne`, `rangee`, `vers`). Les règles calculent les cases occupées (obstacles pour la marche) ; le décor dessine chaque type avec quelques boîtes (`src/scene3d/meubles.ts`).
- **Pourquoi** : aucun fichier à télécharger, aucune nouvelle dépendance, rendu cohérent avec les murs et les personnages actuels, léger sur téléphone. Ajouter un meuble = ajouter une ligne de JSON, que `pnpm valider` contrôle.
- **Ce qu'on abandonne pour l'instant** : les modèles glTF (Kenney.nl, Blender). Ils remplaceront une fonction de `MODELES` en phase 2 bis, après accord d'Audrey sur la source des fichiers.

## D-014 · Format des missions et calcul des niveaux · 13/10/2026

- **Décision** : une mission est une liste d'étapes de 4 types (`dialogue`, `observation`, `decision`, `relais`). Chaque réponse rapporte des points par compétence (0 à 3). Le niveau d'une compétence vient de la part des points obtenus sur le maximum possible : N1 (< 40 %), N2 (< 70 %), N3 ; N4 seulement dans une mission marquée `transfert`, avec 90 % au moins.
- **Pourquoi** : 4 types suffisent pour les mécaniques du cahier des charges (loupe, dialogue en 3 canaux, agir/adapter/alerter, relais vers le bon professionnel). Un seul niveau par compétence, jamais de note globale (règle 4). N4 (« transfère à une situation nouvelle et justifie ») ne peut pas se prouver dans une mission connue.
- **À valider par Audrey** : les seuils 40 % et 70 %, et l'usage de `transfert`. Ils se changent dans `niveau()` (`src/regles/mission.ts`).
- **Ce qu'on abandonne pour l'instant** : les types « transmission » (trier fait, jugement, interprétation), « secret professionnel » et « protocole » du cahier des charges. Ils s'ajouteront comme nouveaux types d'étapes quand les missions de la phase 4 en auront besoin.

## D-015 · Interface des missions en HTML, au-dessus de la 3D · 13/10/2026

- **Décision** : panneau d'étape en bas d'écran, repères de loupe et relève sont du HTML (`src/ui/mission.ts`). Les repères suivent la vue comme la bulle (D-012). Pour la loupe, la vue cadre la pièce (`theatre.cadrer`). Pour le relais, l'élève touche le professionnel dans l'aile : on vérifie ainsi qu'il sait **qui** prévenir, pas seulement cocher un nom.
- **Pourquoi** : texte net et lisible, boutons de 44 px, lecteurs d'écran, aucune donnée pédagogique dans `src/scene3d/`. Le moteur reste seul juge (points, niveaux).
- **Sécurité** : le HTML est construit avec des gabarits ; tout texte venu de `content/` passe par `echapper()`.
- **Ce qu'on abandonne pour l'instant** : un vrai écran d'accueil (tâche 4.2) ; la liste des missions en tient lieu.

## D-016 · Sauvegarde sans compte : localStorage et code de reprise · 13/10/2026

- **Décision** : la progression (dernier niveau par compétence et par mission) est gardée dans le `localStorage` du navigateur. Le code de reprise la résume (`M00-332.K7`) avec une clé de contrôle de 2 caractères.
- **Pourquoi** : aucune donnée personnelle, aucun serveur, marche hors ligne (cahier des charges). Le code reste court : un chiffre par compétence.
- **Limites** : ce n'est pas un secret (un élève peut inventer un code valide en comprenant le principe) ; si une mission change de compétences, les anciens codes de cette mission sont refusés avec un message clair. Le code ne garde que les niveaux, pas la confiance ni le détail des réponses.

## D-017 · Déblocage par séquence choisie sur l'appareil, brouillons cachés en production · 13/10/2026

- **Décision** : la séquence vue en cours (S1 à S7) se règle dans la liste des missions ou par l'adresse (`?sequence=S3`), et reste mémorisée sur l'appareil. Une mission est ouverte si sa `sequence_requise` est atteinte. Les missions `brouillon` ne s'affichent qu'en développement ou avec `?brouillons`.
- **Pourquoi** : sans compte ni serveur, c'est l'enseignante qui donne le bon lien (ou la bonne consigne) à la classe. Un élève peut changer la séquence : ce n'est pas grave, le jeu n'est pas une évaluation certificative.
- **Conséquence** : tant qu'aucune mission n'est `valide`, la version publiée n'affiche aucune mission (message « Aucune mission validée pour l'instant »).

## D-018 · Hors ligne avec un service worker écrit à la main ; publication manuelle · 13/10/2026

- **Décision** : `public/sw.js` (une soixantaine de lignes) plutôt que `vite-plugin-pwa`. Il lit les pages pour trouver leurs fichiers et les met en cache ; réseau d'abord pour les pages, cache d'abord pour `assets/`. Publication par GitHub Pages avec un workflow **lancé à la main uniquement** (`workflow_dispatch`).
- **Pourquoi** : pas de nouvelle dépendance (règle du projet), code lisible et commenté en français. Publier est un acte visible du public : c'est à Audrey de décider quand.
- **Limites** : les anciens fichiers de `assets/` restent dans le cache après une mise à jour (quelques centaines de ko) ; changer `CACHE` dans `sw.js` (`glycines-v2`…) efface tout. Les icônes sont provisoires (grappe de glycine dessinée par un script) en attendant la charte G.1.

## D-019 · Pas d'exercices pour Audrey · 13/10/2026

- **Décision** : Audrey ne fait plus d'exercices de programmation (l'exercice 1.6 est fait par l'IA, G.4 et 3.1 sont confiées à l'IA). L'IA enchaîne les tâches, committe chaque tâche et termine par un bilan global en mots simples, sans questions de compréhension.
- **Pourquoi** : demande d'Audrey : elle veut comprendre ce qui est ajouté, pas le coder elle-même.
- **Ce qui reste à Audrey** : relire et valider les missions (statut `valide`), tester avec des élèves, choisir la charte, décider quand publier.

## D-020 · Charte visuelle : on garde « Glycine douce » · 13/10/2026

- **Décision** : Audrey a d'abord choisi la charte C « Repères nets » (contours foncés, fond gris bleuté, fauteuils orange). Après l'avoir vue appliquée au jeu, elle préfère le style d'origine (A « Glycine douce ») : le commit de la charte C est annulé (`git revert`), il reste dans l'historique.
- **Pourquoi** : rendu jugé moins agréable une fois dans le jeu.
- **Plus tard** : personnages plus personnalisés (G.2), dans le style actuel.

## D-021 · Personnages low-poly faits en formes simples, sans fichier 3D · 13/10/2026

- **Décision** : les personnages sont construits dans le code avec des formes à facettes (boîtes, cylindres à 6 côtés, icosaèdres), d'après le champ `apparence` du contenu. Seul l'agent est animé (marche). Pas d'animation d'attente.
- **Pourquoi** : aucune dépendance ni fichier à télécharger, rendu cohérent avec le style « Glycine douce », apparence modifiable dans le JSON. Une animation d'attente obligerait à redessiner l'écran en permanence (batterie des téléphones, D-008).
- **Limites** : environ 20 petites pièces par personnage (environ 240 en tout) : fluidité à vérifier sur téléphone. Les aides techniques des résidents ne sont pas dessinées : elles relèvent du cours (`repris_du_cours`) et seront ajoutées quand Audrey les indiquera.

## D-022 · Textures dessinées en code, fenêtres et portes décoratives (sans dépendance) · 24/10/2026

- **Décision** : les sols sont texturés avec de petits motifs dessinés sur un `<canvas>` au lancement du jeu (parquet, carrelage, mouchetis), pas des images téléchargées. Les fenêtres sont des rectangles de verre posés sur la face des murs qui donnent sur l'extérieur (pas un vrai trou dans le mur) ; les portes sont un battant en bois entrouvert posé sur un gond, son sens (nord-sud ou est-ouest) étant déduit des deux pièces qu'il relie (nouveau champ `portes` dans `src/regles/plan.ts`, testé sans navigateur).
- **Pourquoi** : aucune dépendance ni fichier à télécharger (règle du projet) ; cohérent avec la maquette « murs bas coupés » déjà choisie ; garde le rendu rapide (une texture par type de pièce, réutilisée partout, pas une par case).
- **Limites** : pas de fenêtre sur les murs du patio (il n'est pas marqué comme un bord du bâtiment) ; la porte reste toujours entrouverte, elle ne s'anime pas quand l'agent passe.

## D-023 · Lève-personne en formes simples, posé chez M. Louis seulement · 24/10/2026

- **Décision** : pour la tâche G.4 (un objet métier en 3D), le lève-personne a été choisi plutôt que le chariot de soins, et fait en formes simples (comme les autres meubles) plutôt que repris d'un modèle téléchargé. Il n'est posé que dans la chambre de M. Louis.
- **Pourquoi** : « lève-personne » est le seul des deux déjà cité dans le contenu pédagogique (`repris_du_cours` de M. Louis : « Nécessite un lève-personne et deux professionnels formés. »), alors que « chariot de soins » n'apparaît nulle part dans les cours repris ; poser l'objet uniquement chez M. Louis colle à ce que dit son cours, sans en inventer ailleurs. Les formes simples suivent la même règle que G.2 (D-021) : aucune dépendance ni fichier à télécharger.
- **Plus tard** : un chariot de soins (ou d'autres aides techniques comme une canne ou un déambulateur) pourra être ajouté de la même façon, si un cours le mentionne pour un résident précis.

## D-024 · Une mission par résident ayant du contenu dans `repris_du_cours` · 24/10/2026

- **Décision** : pour la tâche 3.1, les 4 missions rédigées (m01 à m04) portent chacune sur un résident différent de M. Karim (Rose, Yvette, Denise, Louis). M. André n'a pas de mission.
- **Pourquoi** : la consigne interdit d'inventer un élément de cours absent de `repris_du_cours` ; or celui de M. André est une liste vide. Chaque autre résident a au contraire des phrases de cours assez précises pour construire une situation (habitudes de Mme Rose, communication adaptée à Mme Yvette, lever actif de Mme Denise, lève-personne à deux pour M. Louis), ce qui a aussi permis de répartir les compétences visées entre CT3, CT4 et C2.1/C2.2 plutôt que de répéter toujours la toilette de M. Karim (déjà couverte par `m00`).
- **Plus tard** : une mission pour M. André attendra qu'Audrey ajoute une ligne à son `repris_du_cours`.

## D-025 · `sequence_requise` alignée sur les séances réelles, pas sur une estimation · 24/10/2026

- **Décision** : après que D-024 a fixé `S2` par défaut faute d'indication, Audrey a donné accès à ses séquences de cours (`CAP AAGA - Bloc 2`). Les fiches de séance indiquent, pour chaque séance, une situation professionnelle, une compétence principale et des compétences « en appui ». `m03` (projet de chambre de Mme Denise) est passée en `S6` (séance « Projet chambre de Mme Denise »), `m04` (lève-personne de M. Louis) en `S4` (séances sur les aides à la mobilité et au transfert), et sa compétence CT3.1 a été remplacée par CT3.3, réellement indiquée en appui dans ces séances. Une nouvelle mission `m05` a été écrite pour combler `S1`, à partir de la situation professionnelle de la séance S1-02 (Mme Rose demande un soin hors rôle ; carton dans le couloir ; stock de gants bas), avec les compétences CT3.1 (principale) et CT3.3 (appui) indiquées dans cette séance.
- **Pourquoi** : une mission suppose toutes les connaissances nécessaires pour la réussir ; si elle combine une compétence vue en S4 et une vue en S6, elle ne peut s'ouvrir qu'à partir de S6 (la plus avancée des deux), sinon un élève y accéderait avant d'avoir vu ce qu'elle demande. Les séances réelles d'Audrey donnent une source de vérité pour cette correspondance, plus fiable qu'une estimation.
- **Plus tard** : si d'autres missions sont écrites, vérifier dans les fiches de séance (dossier `Sequences/` de ses cours) la compétence principale et les compétences en appui de chaque situation professionnelle utilisée, plutôt que d'estimer la séquence.

## D-026 · Trois missions de plus, tirées de situations professionnelles non encore utilisées · 24/10/2026

- **Décision** : en relisant S1 à S7, trois situations professionnelles précises et jusque-là inutilisées ont été transformées en missions brouillon : `m06` (Mme Denise arrive aux Glycines, S1-07), `m07` (la chambre de M. Karim : lit médicalisé, radio, carnet de recettes, appel du dimanche, proposition de cadres de sa fille, S3-02) et `m08` (Mme Denise et son petit-fils, décalage d'horaires, S6-04). Les compétences visées reprennent exactement celles indiquées par chaque fiche de séance (principale et en appui).
- **Pourquoi** : ces situations donnent des faits précis, déjà écrits par Audrey pour sa classe, qui ne nécessitent aucune invention ; elles couvrent aussi des compétences encore peu représentées dans le jeu (C2.2.2 sous plusieurs angles, CT3.1 côté accueil plutôt que côté prévention).
- **Limites** : la séquence S5 (dépression/troubles neurocognitifs, escarres/dénutrition/surdité/cécité, fin de vie) cite Rose, Yvette et André comme sujets d'exercices, mais les fiches de synthèse ne donnent pas de fait précis attribué à l'un d'eux (le détail est peut-être dans des annexes .docx non lues) : aucune mission n'en a été tirée, pour ne rien inventer. M. André reste sans mission.

## D-027 · Faits de S5 trouvés dans les fichiers interactifs, pas dans les .docx · 24/10/2026

- **Décision** : les .docx « Version prof » et « Annexes » de S5 se sont révélés être des gabarits vides (consignes et critères génériques, sans fait attribué). Les fichiers `*_activite_interactive.html` des mêmes séances contenaient en revanche la situation réellement écrite pour les élèves, avec les noms des résidents. Quatre faits en ont été tirés, repris dans trois nouvelles lignes de `repris_du_cours` (Rose malentendante, Yvette parfois désorientée, André : lever lent, rougeur au talon à surveiller, baisse d'appétit certains jours) et dans 4 missions brouillon (`m09` à `m12`), dont la première mission de M. André.
- **Pourquoi** : la règle du jeu interdit d'inventer un fait médical ou de cours ; ces quatre faits sont au contraire ceux qu'Audrey a elle-même écrits pour sa classe, simplement non visibles dans les documents imprimables. Les reformulations dans `repris_du_cours` évitent tout nom de maladie (Alzheimer, Parkinson), conformément à la règle « aucun diagnostic dans le jeu ».
- **Cas sensible (`m12`)** : la séance 6 (bientraitance/maltraitance) met en scène Mme Yvette avec une ecchymose inexpliquée et une phrase laissant penser à une maltraitance (« il va encore crier »). Avant d'écrire cette mission, Audrey a été consultée explicitement ; elle a demandé de suivre fidèlement la situation de sa séance plutôt qu'une version adoucie ou pas de mission du tout. La mission ne nomme jamais qui est « il » et porte sur le signalement (transmettre, ne pas enquêter soi-même), comme l'indique la séance.
- **Plus tard** : si Audrey retrouve d'autres faits dans des fichiers interactifs plutôt que dans les .docx d'une séquence, vérifier systématiquement `*_activite_interactive.html` en plus des « Version prof » avant de conclure qu'une séquence ne contient rien d'exploitable.

## D-028 · Les 3 dernières sous-compétences couvertes, via des sujets sensibles (intimité) · 25/10/2026

- **Décision** : C2.1.4 (bien-être socio-esthétique), C2.1.5 (préserver la continence) et C2.2.1 (entretien des espaces) n'avaient encore aucune mission (tâche 4.1). Trois missions brouillon écrites à partir des fiches de séance S4-04, S4-07 et S3-07 : `m18` (Mme Rose, coiffure et petite rougeur près d'un ongle à transmettre sans y toucher), `m19` (Mme Yvette, demande urgente aux toilettes hors de ses horaires habituels, tapis et porte à traiter dans les limites du rôle) et `m20` (M. Karim, entretien journalier de sa chambre en respectant son accord et son carnet de recettes).
- **Pourquoi** : les 14 sous-compétences du référentiel ont désormais chacune au moins une mission, sans rien inventer : chaque fait nouveau vient d'une fiche de séance et a été ajouté au `repris_du_cours` du résident concerné avant l'écriture, comme pour les missions précédentes (D-026, D-027).
- **À surveiller** : `m18` et `m19` touchent à l'intimité (soin du corps, continence) ; à relire avec la même attention que `m12` avant de les passer en `valide`.

## D-029 · Respiration douce des personnages à l'arrêt, à cadence réduite · 25/10/2026

- **Décision** : à la demande d'Audrey (« les personnages ont l'air statiques »), les résidents, le personnel et l'agent respirent désormais légèrement à l'arrêt (léger soulèvement du buste et balancement, `poserRespiration` dans `src/scene3d/personnages.ts`), avec un décalage de phase aléatoire par personnage pour que tous ne respirent pas en même temps. Cette animation tourne en continu, mais à cadence réduite (10 images par seconde, via `theatre.animerLentement`, un nouveau `setInterval` séparé de la boucle `requestAnimationFrame` à 60 im/s) plutôt qu'avec la boucle normale (D-010).
- **Pourquoi** : revient sur la décision prise en G.2 (« pas d'animation d'attente, pour garder le rendu à la demande ») à la demande explicite d'Audrey, qui a choisi ce compromis (parmi 3 niveaux proposés) plutôt qu'une animation complète à 60 im/s : le jeu reste vivant sans redessiner en continu à pleine cadence, donc sans reperdre tout le gain de batterie du rendu à la demande (D-008).
- **Comment** : l'agent porte un indicateur `userData.enMarche`, posé par `marche.ts`, pour que la respiration n'entre pas en conflit avec le balancement de la marche (`poserMarche`) pendant qu'il se déplace ; elle reprend dès qu'il s'arrête.
- **Conséquences** : `docs/ARCHITECTURE.md` mis à jour (la phrase « à l'arrêt, rien ne bouge » n'est plus vraie). Une future animation discrète et continue (regard qui suit quelque chose, clignement) pourra réutiliser `animerLentement` plutôt que la boucle à pleine cadence.

## D-030 · Clignement des yeux et regard de côté, dans la même boucle à cadence réduite · 25/10/2026

- **Décision** : à la demande d'Audrey d'aller plus loin, chaque personnage à l'arrêt cligne maintenant des yeux de temps en temps (yeux aplatis un huitième de seconde) et tourne parfois la tête un instant vers un angle tiré au hasard avant de revenir, chacun avec son propre minuteur aléatoire (`poserRespiration` dans `src/scene3d/personnages.ts`).
- **Pourquoi** : même idée que D-029 (rester vivant sans redessiner en continu à pleine cadence) : ces deux animations tournent dans la même boucle à 10 images par seconde, sans coût supplémentaire de boucle.
- **Comment** : chaque figurine porte ses propres comptes à rebours (`minuteurClignement`, `minuteurRegard`) et son état en cours (`finClignement`, `regardProgres`), mis à jour à chaque passage de la boucle à partir du temps écoulé ; rien n'est planifié par `setTimeout`, tout reste dans la même fonction appelée à cadence réduite.

## D-031 · Une variante change le contexte, jamais les réponses · 22/11/2026

- **Décision** : une mission peut avoir des `variantes` (situation et consignes d'étapes réécrites). Au lancement, la version de base ou une variante est tirée au hasard. Les choix, les retours et les points restent ceux de la mission de base.
- **Pourquoi** : rejouer une mission sans pouvoir réciter le texte, sans multiplier les corrections à valider et sans risque d'inventer un savoir. Le contexte doit venir des cours (pas d'humeur de résident inventée).
- **Comment** : `src/regles/variantes.ts` (`tirerVariante`, `appliquerVariante`), règles dans `src/contenu/valider.ts`, liste sur la page enseignante. Première variante : `m09` (chambre peu éclairée, S5-03).

## D-032 · Pas d'arabe dans l'application ; le cadre de santé gère les stocks ; les cours peuvent être complétés · 22/11/2026

- **Décision** : (1) l'application reste en français seulement : P.17 et 5.3 sont abandonnées. (2) Aux Glycines, M. Lemoine, cadre de santé, est chargé des stocks (relais de `m22`). (3) Le contenu peut compléter les cours, dans le sens du référentiel et du CAP AAGA.
- **Pourquoi** : choix d'Audrey du 22/11/2026.
- **Comment** : règles ajoutées dans CLAUDE.md ; chaque complément est signalé « complément, hors cours » dans `note_pour_audrey`.

## D-033 · La PSE dans le jeu : un second référentiel, des missions toujours ouvertes · 22/11/2026

- **Décision** : la PSE a son propre fichier `content/referentiel/pse.json` (modules C4 à C7, objectifs ciblés recopiés mot pour mot), à côté de `bloc2.json` qui reste intouché. Les missions PSE (`discipline: "PSE"`) sont toujours ouvertes et rangées dans une rubrique à part.
- **Pourquoi** : la progression de PSE n'est pas celle du Bloc 2, et le sélecteur « séquence vue » ne concerne que le Bloc 2. Le programme de PSE n'a pas de niveaux N1 à N4 : on garde ceux du jeu pour que la relève reste la même (signalé dans le fichier).
- **Comment** : validateur (pas de mélange des compétences), `estDebloquee`, liste des missions, page enseignante.

## D-034 · Critères du Bloc 2 alignés mot pour mot sur le Journal officiel · 22/11/2026

- **Décision** : avec l'accord d'Audrey, `content/referentiel/bloc2.json` a été corrigé : 17 libellés de critères repris exactement du JO du 14 mars 2023 (le fichier venait de la matrice des cours, qui avait reformulé certains critères), et le critère fusionné « Relation privilégiée et sécurisante favorisant l’autonomie » séparé en deux, comme dans le JO.
- **Pourquoi** : une mission doit citer le critère officiel mot pour mot ; vérification dans `docs/VERIFICATION_REFERENTIEL.md`.
- **Comment** : comparaison automatique avec le texte du PDF officiel (68 critères sur 68 retrouvés), missions mises à jour, validateur et tests au vert. La règle « ne jamais modifier `bloc2.json` » reste valable : toute autre modification demande à nouveau l'accord d'Audrey.

## D-035 · Mode classe tout ouvert, lien direct vers une mission · 23/11/2026

- **Décision** : en mode classe (`?classe`), toutes les missions du Bloc 2 sont ouvertes, quelle que soit la séquence. Un lien `index.html?mission=m12` lance directement une mission. La page enseignante est rangée comme le jeu (matière, format, séquence), avec des fiches repliables et les boutons « Jouer » et « La projeter ».
- **Pourquoi** : Audrey projetait le jeu et trouvait des missions verrouillées sans savoir comment les ouvrir. Il n'y a pas de code : c'est l'adresse qui ouvre les missions.
- **Limite acceptée** : un élève qui connaît ces adresses peut tout ouvrir. Le déblocage par séquence sert à guider, pas à contrôler.

## D-036 · Export du bilan en tableur (CSV) et en données (JSON) · 24/11/2026

- **Décision** : dans « Mon bilan », l'élève peut taper prénom, nom et classe, puis imprimer (ou PDF), télécharger un tableau CSV (s'ouvre dans LibreOffice Calc ou Excel) ou un fichier JSON (données complètes avec le code de reprise). Le nom remplit aussi la fiche imprimée.
- **Pourquoi** : Audrey veut récupérer les bilans de ses 20 élèves alors que le jeu en ligne est anonyme. C'est l'élève qui met son nom et qui remet le fichier (ENT, Pronote) : rien n'est envoyé, rien n'est gardé.
- **Choix** : CSV plutôt qu'ODS (aucune bibliothèque à ajouter), séparateur « ; » et UTF-8 avec marque d'ordre pour les accents ; pas de TXT (le CSV s'ouvre aussi dans un éditeur de texte). Le nom n'est pas gardé dans le navigateur (ordinateurs partagés au lycée).
- **Limite** : le navigateur range le fichier dans « Téléchargements » (ou demande où l'enregistrer) ; un site ne peut pas écrire tout seul dans « Documents ».

## D-037 · Bilans de la classe sur la page enseignante · 24/11/2026

- **Décision** : bloc « Bilans de la classe » sur la page enseignante. Audrey y dépose les fichiers .json des élèves (plusieurs d'un coup, ou glissés), ou colle des lignes « Nom ; code de reprise ». Elle obtient un tableau par partie (Bloc 2, PSE) : une ligne par élève, le meilleur niveau par compétence, le nombre de missions faites. Elle peut le télécharger en CSV (LibreOffice ou Excel) ou l'imprimer seul.
- **Pourquoi** : rassembler 20 bilans sans compte, sans serveur et sans collecte de données (D-036).
- **Choix** : la progression est relue à partir du code de reprise contrôlé par sa clé, jamais crue sur parole (un fichier retouché est refusé). Le même élève remis deux fois : on garde le fichier le plus récent. Rien n'est gardé dans le navigateur : en fermant la page, le tableau disparaît.

## D-038 · Les mises à jour ne font pas perdre la progression · 24/11/2026

- **Constat** : publier une nouvelle version n'efface pas la progression (elle est gardée dans le navigateur, liée à l'adresse du site). Les vrais risques : une mission publiée modifiée (les anciens codes étaient refusés en entier), et les ordinateurs du lycée qui effacent tout à la déconnexion.
- **Décision** : un code ou un fichier dont une mission a changé est quand même repris ; seule cette mission est mise de côté (« à refaire »), avec un message. L'élève peut reprendre avec son fichier de bilan (.json) au lieu de recopier le code. Règle ajoutée dans CLAUDE.md : ne jamais renommer la clé de stockage, ni changer l'identifiant ou les compétences d'une mission publiée.
- **Conseil pour la classe** : faire télécharger le fichier de bilan en fin de séance (sur l'ENT ou une clé USB), surtout sur les ordinateurs du lycée.

## D-039 · Nom obligatoire et « Tout garder » dans Mon bilan · 26/11/2026

- **Demande d'Audrey** : être sûre que chaque bilan rendu porte le nom de l'élève, et récupérer les trois formats d'un coup.
- **Décision** : dans « Mon bilan », les boutons de téléchargement restent grisés tant que le prénom et le nom ne sont pas écrits (la classe reste facultative). Un bouton principal « Tout garder » télécharge le fichier de données (.json) et le tableau (.csv), puis ouvre l'impression pour le PDF. Les trois boutons séparés restent en dessous, en secours.
- **Limite** : le PDF passe forcément par la fenêtre d'impression (« Enregistrer en PDF »), le jeu ne peut pas le créer seul sans nouvelle bibliothèque. Le navigateur peut demander une fois d'autoriser plusieurs téléchargements.
