# Cahier des charges · Une journée aux Glycines

Version 0.1 · 12 octobre 2026 · Auteure : Audrey (enseignante PLP Biotechnologies SE)

## 1. Vision

Un jeu sérieux en 3D isométrique. L'élève de terminale CAP AAGA y joue un agent accompagnant au grand âge, titulaire du CAP, dans l'aile B de l'EHPAD fictif **Les Glycines**. Il y croise les résidents et les autres professionnels (infirmière, aide-soignante, cadre de santé, ASH, animatrice…).

Le jeu entraîne les **compétences du référentiel** par des mises en situation. Il ne note pas un réflexe ou une vitesse : il fait travailler la décision professionnelle (**agir, adapter ou alerter**) et le recours à **la bonne personne**.

## 2. Public et contexte d'usage

- Élèves de terminale CAP AAGA (lycée professionnel), dont des élèves en difficulté de lecture et une élève allophone arabophone.
- En classe (salle informatique) **et sur téléphone** (Android et iPhone), en autonomie ou en devoir.
- **Missions de 15 minutes** qu'on peut enchaîner.

## 3. Périmètre, par ordre de priorité

1. **Bloc 2** : Promotion de l'autonomie de la personne dans son espace privé (14 sous-compétences, arrêté du 6 février 2023).
2. **PSE** du CAP (thématiques A à D).
3. **Bloc 1** (cuisine, lingerie, entretien des espaces collectifs).

## 4. Règles pédagogiques (non négociables)

1. **Le référentiel est la source de vérité.** Le fichier `content/referentiel/bloc2.json` est une copie fidèle de la matrice des cours. Chaque mission cite ses compétences **et un critère officiel mot pour mot**. Le validateur refuse toute compétence ou tout critère inventé.
2. **Aucun diagnostic.** L'élève observe, adapte dans les limites de son rôle et transmet. Le jeu ne lui fait jamais nommer une pathologie à partir d'un signe.
3. **Le jeu ne remplace pas le geste réel.** Pour les compétences techniques (C2.1.1, C2.1.3…), il entraîne les décisions, l'ordre des étapes et le choix du matériel. La preuve reste le TP.
4. **Un niveau par compétence** (N1 à N4, conventions de la matrice), jamais une note globale qui mélange les compétences.
5. **Les résidents restent ceux des cours.** Leurs caractéristiques viennent des séquences du Bloc 2 (champ `repris_du_cours`). On n'ajoute pas d'élément médical qui n'y figure pas.
6. **Déblocage selon la progression.** Une mission indique la séquence de cours qu'elle suppose (`sequence_requise`).
7. **Style** : verbes de consigne de la liste officielle, phrases courtes, aucun tiret cadratin.

## 5. Mécaniques de jeu prévues

| Mécanique | Ce que fait l'élève | Compétences |
|---|---|---|
| Relève du matin | Lit les transmissions, organise ses missions | CT3.1 |
| Mode observation (loupe) | Repère ce qui facilite ou gêne dans une pièce | CT3.3, C2.1.2, C2.1.3, C2.1.6 |
| Dialogue en 3 canaux | Choisit le verbal, le paraverbal (ton, débit) et le non-verbal (posture, regard) ; une jauge de confiance du résident réagit | CT4.1, CT4.2 |
| Mon rôle / pas mon rôle | Agir, adapter ou alerter, puis **se déplacer jusqu'au bon professionnel** | CT3.1, C2.1.6 |
| Transmission | Trie fait observé / jugement / interprétation et construit une transmission fidèle | C2.1.6, CT3.4 |
| Secret professionnel | Répond à un proche ou à un autre résident : taire, transmettre, alerter | CT3.4 |
| Réserve et stocks | Compare stock et seuil, remplit une fiche d'alerte | CT3.3 |
| Personnaliser une chambre | Range et personnalise avec les souhaits de la personne | C2.2.2, C2.1.2 |
| Protocoles | Ordonne les étapes, choisit matériel et produit | C2.1.1, C2.2.1 |
| Relève de fin de mission | Niveau par compétence + 2 ou 3 questions de débriefing | toutes |

## 6. Contraintes techniques

| Contrainte | Exigence |
|---|---|
| Appareils | Navigateur récent sur PC, Android et iPhone. Aucune installation obligatoire. |
| Téléphone | Commandes tactiles (glisser, pincer, toucher), boutons de 44 px minimum, paysage conseillé. Test systématique à 390 px de large et sur ordinateur. |
| Performance | Formes simples (low-poly), pas d'ombres en temps réel, rendu à la demande. Fluide sur un téléphone d'entrée de gamme. |
| Hors ligne | Le jeu fonctionne sans réseau une fois chargé (PWA prévue en phase 4). |
| Sauvegarde | Automatique à la fin de chaque mission, dans le navigateur. Reprise sur un autre appareil par un **code de reprise** à recopier. |
| RGPD | Aucun compte, aucun nom d'élève, aucun traceur, aucun service tiers. |
| Accessibilité | Texte HTML (pas de texte dessiné dans la 3D), lecture à voix haute des dialogues (synthèse vocale du navigateur), icônes, phrases courtes. Aide en arabe envisagée plus tard. |
| Coût | 0 €. Outils libres et gratuits. Hébergement statique (aucun serveur applicatif) quand on publiera. |

## 7. Ce que le jeu ne fait pas

- Pas de classement entre élèves, pas de chronomètre punitif, pas de « game over ».
- Pas de collecte de données personnelles, pas de compte élève.
- Pas de contenu médical inventé, pas de diagnostic.

## 8. Critères de réussite

- **Technique** : `pnpm verifier` passe ; le jeu tourne sur un PC de la salle info et sur un téléphone Android et un iPhone.
- **Pédagogique** : sur la tranche verticale (phase 3), les élèves terminent une mission en 15 minutes environ, comprennent la relève sans aide, et le débriefing en classe montre qu'ils savent dire **à qui** ils transmettent et **pourquoi**.
