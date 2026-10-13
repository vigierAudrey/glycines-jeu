// Types du contenu pédagogique (dossier content/).
// Ils décrivent la forme des fichiers JSON : si un fichier ne respecte pas cette forme,
// TypeScript ou le validateur (tools/valider-contenu.ts) le signale avant que le jeu ne tourne.

// ---------- Référentiel ----------

export interface SavoirAssocie {
  intitule: string;
  limites_connaissances: string[];
}

export interface Competence {
  code: string; // ex. "CT3.3"
  intitule: string;
  performances_attendues: string[];
  criteres_officiels: string[];
  savoirs_associes: SavoirAssocie[];
}

export interface Referentiel {
  diplome: string;
  bloc: string;
  texte_officiel: string;
  origine: string;
  avertissement: string;
  niveaux: Record<'N1' | 'N2' | 'N3' | 'N4', string>;
  competences: Competence[];
}

// ---------- Lieux ----------

export type TypeZone = 'chambre' | 'collectif' | 'service' | 'circulation' | 'exterieur' | 'porte';

export interface Zone {
  id: string;
  nom: string;
  type: TypeZone;
  couleur: string; // couleur du sol, format #rrggbb
  resident?: string; // id du résident pour une chambre
}

export type TypeMeuble = 'lit' | 'fauteuil' | 'lavabo' | 'sonnette';
export type Direction = 'nord' | 'sud' | 'est' | 'ouest'; // nord = rangée 0, en haut de la grille ; est = vers la droite

export interface Meuble {
  type: TypeMeuble;
  colonne: number; // case où est posé le meuble (pour le lit : la case de la tête de lit)
  rangee: number;
  vers: Direction; // côté vers lequel le meuble est tourné (pour le lit : le côté des pieds)
}

export interface Lieu {
  id: string;
  nom: string;
  note?: string;
  grille: string[]; // une chaîne par rangée, un caractère par case de 1 m
  zones: Record<string, Zone>; // clé = caractère de la grille
  vide: string; // caractère des cases vides
  meubles?: Meuble[];
}

// ---------- Personnages ----------

export interface Resident {
  id: string;
  civilite: 'Mme' | 'M.';
  nom: string;
  chambre: string; // id de zone
  repris_du_cours: string[];
}

export interface MembrePersonnel {
  id: string;
  prenom: string;
  metier: string;
  sigle: string;
  tenue: string; // couleur de tenue, format #rrggbb
  zone_habituelle: string; // id de zone
  joueur?: boolean;
}

// ---------- Missions ----------

export interface CompetenceVisee {
  code: string;
  critere: string; // doit reprendre mot pour mot un critère officiel de la compétence
}

/** Points gagnés, par code de compétence. Ex. { "CT4.1": 2 }. */
export type Points = Record<string, number>;

/** Une réponse possible : ce qu'elle rapporte et ce qu'on dit à l'élève après l'avoir choisie. */
export interface Option {
  texte: string;
  points?: Points;
  retour: string; // explication montrée après le choix
}

/** Une option de dialogue fait aussi bouger la confiance du résident (de -2 à +2). */
export interface OptionDialogue extends Option {
  confiance: number;
}

export type Decision = 'agir' | 'adapter' | 'alerter';

export interface OptionDecision extends Option {
  decision: Decision;
  suite?: string; // id de l'étape suivante si ce choix mène ailleurs (sinon : l'étape suivante dans la liste)
}

/** Un élément à repérer à la loupe, posé sur une case du plan. */
export interface ElementObserve {
  id: string;
  libelle: string; // ce que l'élève voit en touchant le repère
  colonne: number;
  rangee: number;
  effet: 'facilite' | 'gene'; // bonne réponse : cet élément facilite ou gêne l'activité
  points?: Points; // gagnés si l'élève classe bien l'élément
  retour: string;
}

interface EtapeCommune {
  id: string;
  consigne: string; // phrase courte affichée en haut du panneau
}

/** L'élève choisit sa phrase (verbal), son ton (paraverbal) et son attitude (non-verbal). */
export interface EtapeDialogue extends EtapeCommune {
  type: 'dialogue';
  interlocuteur: string; // id du personnage
  replique?: string; // ce que dit l'interlocuteur avant le choix
  verbal: OptionDialogue[];
  paraverbal: OptionDialogue[];
  non_verbal: OptionDialogue[];
}

/** Mode loupe : l'élève touche chaque repère et dit s'il facilite ou gêne l'activité. */
export interface EtapeObservation extends EtapeCommune {
  type: 'observation';
  elements: ElementObserve[];
}

/** Agir, adapter ou alerter. */
export interface EtapeDecision extends EtapeCommune {
  type: 'decision';
  question: string;
  choix: OptionDecision[];
}

/** L'élève va trouver le bon professionnel dans l'aile. */
export interface EtapeRelais extends EtapeCommune {
  type: 'relais';
  destinataire: string; // id du membre du personnel attendu
  points?: Points; // gagnés seulement au premier essai
  retour: string; // dit quand l'élève trouve la bonne personne
  retour_erreur: string; // dit quand il se trompe (il peut réessayer)
}

export type Etape = EtapeDialogue | EtapeObservation | EtapeDecision | EtapeRelais;

export interface Mission {
  id: string;
  statut: 'brouillon' | 'valide';
  titre: string;
  duree_min: number;
  sequence_requise: string; // ex. "S2" : la mission se débloque quand la séquence a été vue en cours
  lieu: string; // id de zone
  personnages: string[]; // ids de résidents ou de membres du personnel
  competences: CompetenceVisee[];
  situation: string;
  objectif_eleve: string;
  transfert?: boolean; // vrai si la mission est une situation nouvelle : seul cas où le niveau N4 est possible
  confiance_depart?: number; // de 0 à 10, 5 par défaut
  etapes: Etape[];
  debriefing: string[]; // 2 ou 3 questions pour la relève de fin de mission
  [autre: string]: unknown; // champs libres (notes pour l'enseignante…)
}

export interface Contenu {
  referentiel: Referentiel;
  lieux: Lieu[];
  residents: Resident[];
  personnel: MembrePersonnel[];
  missions: Mission[];
}
