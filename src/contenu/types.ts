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
  [autre: string]: unknown; // champs libres tant que le format des étapes n'est pas fixé (phase 2)
}

export interface Contenu {
  referentiel: Referentiel;
  lieux: Lieu[];
  residents: Resident[];
  personnel: MembrePersonnel[];
  missions: Mission[];
}
