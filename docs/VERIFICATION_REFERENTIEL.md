# Vérification des référentiels du jeu (22/11/2026)

Comparaison des critères d'évaluation du jeu avec les textes officiels présents sur le PC d'Audrey.

## PSE : conforme

`content/referentiel/pse.json` : les 14 objectifs ciblés des modules C4 à C7 sont retrouvés **mot pour mot** dans le programme officiel (`REFERENTIEL_CAP_PSE/spe641annexe1105406pdf-85401`). Le fichier ne contient que les modules C4 à C7 pour l'instant (thématique C) ; les autres modules seront ajoutés avec les séquences de PSE correspondantes (tâches 5.1f à 5.1h). La PSE ne fait pas partie du référentiel CAP AAGA : c'est le programme commun à tous les CAP.

## Bloc 2 : les 14 compétences sont les bonnes, 13 critères sur 68 ne sont pas mot pour mot

Source officielle : référentiel CAP AAGA, arrêté du 6 février 2023, JO du 14 mars 2023 (`le_nouveau_referentiel_cap_aaga_-_agent_accompagnant_au_grand_age.pdf`). Les 14 codes et intitulés (CT3.1 à C2.2.2) sont conformes. `content/referentiel/bloc2.json` a été extrait de la matrice des cours (`MATRICE_REFERENTIEL_EXHAUSTIVE.json`), qui a légèrement reformulé certains critères :

| Code | Dans le jeu | Texte officiel (JO) |
|---|---|---|
| CT3.1 | Sélection pertinente de données et d’informations récentes et diversifiées. | Sélection pertinente des données, informations récentes et diversifiées |
| CT3.2 | Utilisation d’informations récentes et diversifiées. | Informations récentes et diversifiées |
| C2.1.1 à C2.1.5 | Respect des règles d’hygiène, de sécurité et d’ergonomie. | Respect des règles d’hygiène et de sécurité, d’ergonomie |
| C2.1.1 | Respect des protocoles et des fiches techniques. | Respect des protocoles, des fiches techniques |
| C2.1.3 à C2.1.5 | Relation privilégiée et sécurisante favorisant l’autonomie. | **Deux critères distincts** : « Relation privilégiée et sécurisante » et « Relation favorisant l’autonomie » |
| C2.2.1 | Nettoyage/bionettoyage respectueux du mobilier et des protocoles. | Nettoyage/bionettoyage en respect du mobilier et des protocoles |
| C2.2.1 | Choix du matériel et des produits adaptés et utilisation correcte. | Choix du matériel, des produits adaptés et utilisation correcte |
| C2.2.1 | Dysfonctionnements repérés et geste de première intervention. | Dysfonctionnement repérés, geste de première intervention |
| C2.2.2 | Écoute attentive et active de la personne et de sa famille. | Ecoute attentive, active de la personne et de sa famille |
| C2.2.2 | Mobilisation des échanges épistolaires, d’internet, de l’appel téléphonique ou vidéo selon la situation. | Echanges épistolaires, internet, appel téléphonique ou vidéo |

Les accents sur les majuscules (« Écoute » au lieu de « Ecoute ») ne sont pas comptés comme des écarts. Les « performances attendues » de `bloc2.json` présentent le même type de petites reformulations (non détaillées ici).

Missions qui citent un critère reformulé : m04, m08, m16, m19, m21.

**Correction proposée** : aligner `bloc2.json` sur le texte du JO (en séparant le critère fusionné en deux), puis mettre à jour les 5 missions concernées. Cela touche le fichier « source de vérité » : il faut l'accord d'Audrey (règle de CLAUDE.md).
