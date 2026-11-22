# Vérification des référentiels du jeu (22/11/2026)

Comparaison des critères d'évaluation du jeu avec les textes officiels présents sur le PC d'Audrey.

## PSE : conforme

`content/referentiel/pse.json` : les objectifs ciblés des modules A2, A7, C1 à C7 et D1 à D3 (ceux que travaillent les séquences de PSE d'Audrey) sont retrouvés **mot pour mot** dans le programme officiel (`REFERENTIEL_CAP_PSE/spe641annexe1105406pdf-85401`). La PSE ne fait pas partie du référentiel CAP AAGA : c'est le programme commun à tous les CAP.

## Bloc 2 : corrigé le 22/11/2026, les 68 critères sont maintenant mot pour mot

**État actuel** : après correction (accord d'Audrey, D-034), une vérification automatique retrouve les 68 critères de `bloc2.json` mot pour mot dans le JO (seule tolérance : l'accent sur les majuscules, « Écoute » pour « Ecoute »). Les missions citent les nouveaux libellés. Le tableau ci-dessous garde la trace des écarts corrigés.

### Écarts corrigés

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
| CT3.1 | … du cadre de l’intervention, dont celles relatives aux risques professionnels. | … du cadre de l’intervention dont celles relatives aux risques professionnels (sans virgule) |
| CT3.2 | … de la personne âgée et prise en compte de ces éléments … | … de la personne âgée, prise en compte de ces éléments … |
| CT4.1 | Intervention et attitude adaptées … | Intervention et attitude adaptée … |
| CT4.1 | Utilisation d’un ton, d’un vocabulaire ou d’un outil … | Utilisation d’un ton et d’un vocabulaire ou d’un outil … |

Les accents sur les majuscules (« Écoute » au lieu de « Ecoute ») ne sont pas comptés comme des écarts. Les « performances attendues » de `bloc2.json` présentent le même type de petites reformulations (non détaillées ici).

Dans le JO, C2.1.2 à C2.1.5 partagent une même case de critères (7 critères) : C2.1.3, C2.1.4 et C2.1.5 ont donc maintenant les mêmes 7 critères que C2.1.2, dont « Relation privilégiée et sécurisante » et « Relation favorisant l’autonomie » séparés.

Missions mises à jour : m00, m01, m02, m04, m05, m06, m08, m09, m16, m17, m18, m19 (« Relation privilégiée et sécurisante »), m21, m22.

Reste : les « performances attendues » de `bloc2.json` (non citées par les missions) gardent quelques reformulations de la matrice.

## Couverture du Bloc 2 par les missions (22/11/2026, 26 missions)

- **Compétences** : 14 sur 14 ont au moins une mission. Peu couvertes : C2.1.1, C2.1.2, C2.1.4, C2.1.5 (une mission chacune).
- **Critères** : 31 sur 71 sont évalués (une mission évalue un seul critère par compétence). Couverts en entier : CT3.3, CT3.4, CT4.1, CT4.2. Très peu : C2.1.2 (1/7), C2.1.4 (1/7), C2.1.5 (1/7), C2.2.1 (2/9), C2.1.1 (1/4).
- **Notions jamais travaillées** : structures d'accueil, outils d'évaluation de l'autonomie (AGGIR), charte des droits et libertés, laïcité et éthique, fin de vie et directives anticipées, conditions de l'endormissement et du réveil, pathologies digestives, urinaires, cardio-vasculaires et diabète (signes à observer).
- **Notions peu travaillées** : protection des majeurs (1 mission), bientraitance (1), socio-esthétique (1), dénutrition (1), prise des repas, continence, habillage (2 à 3).

Plan pour tout couvrir : Phase 4 ter de la feuille de route (T.1 à T.11), d'après les séances correspondantes des cours.
