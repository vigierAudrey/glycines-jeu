// Moteur de mission (couche « règles » : aucune 3D, aucun HTML, testable sans navigateur).
//
// Une mission est une suite d'étapes (voir src/contenu/types.ts et docs/ARCHITECTURE.md).
// Le moteur garde l'état de la partie : étape en cours, points par compétence, confiance du résident.
// L'interface lui donne la réponse de l'élève ; il renvoie le nouvel état et les retours à afficher.
// L'état n'est jamais modifié : chaque réponse fabrique un nouvel état (plus simple à tester et à sauvegarder).

import type { Decision, Etape, Mission, Points } from '../contenu/types';

export type Niveau = 'N1' | 'N2' | 'N3' | 'N4';

export interface EtatMission {
  mission: string; // id de la mission
  etape: string | null; // id de l'étape en cours, null quand la mission est finie
  points: Points; // points gagnés par compétence
  confiance: number; // de 0 à 10
  essais: number; // nombre d'erreurs sur l'étape en cours (étape « relais »)
  decisions: Decision[]; // décisions prises, dans l'ordre (pour la relève)
}

/** Réponse de l'élève, selon le type de l'étape en cours. */
export type Reponse =
  | { type: 'dialogue'; verbal: number; paraverbal: number; non_verbal: number } // numéros des options choisies
  | { type: 'observation'; classements: Record<string, 'facilite' | 'gene'> } // id de l'élément → avis de l'élève
  | { type: 'decision'; choix: number }
  | { type: 'relais'; destinataire: string }; // id du membre du personnel rejoint

export interface Resultat {
  etat: EtatMission;
  retours: string[]; // explications à montrer à l'élève
  reussi: boolean; // vrai si la réponse rapporte tous les points possibles de l'étape
}

const CONFIANCE_MAX = 10;

const ajouter = (a: Points, b: Points = {}): Points => {
  const somme = { ...a };
  for (const [code, n] of Object.entries(b)) somme[code] = (somme[code] ?? 0) + n;
  return somme;
};

const maximum = (a: Points, b: Points = {}): Points => {
  const max = { ...a };
  for (const [code, n] of Object.entries(b)) max[code] = Math.max(max[code] ?? 0, n);
  return max;
};

const identiques = (a: Points, b: Points) => {
  const codes = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...codes].every((c) => (a[c] ?? 0) === (b[c] ?? 0));
};

export function etapeEnCours(mission: Mission, etat: EtatMission): Etape | undefined {
  return mission.etapes.find((e) => e.id === etat.etape);
}

export function demarrerMission(mission: Mission): EtatMission {
  return {
    mission: mission.id,
    etape: mission.etapes[0]?.id ?? null,
    points: {},
    confiance: mission.confiance_depart ?? 5,
    essais: 0,
    decisions: [],
  };
}

/** Points maximum d'une étape : le meilleur choix possible, compétence par compétence. */
export function pointsMaxEtape(etape: Etape): Points {
  switch (etape.type) {
    case 'dialogue':
      return [etape.verbal, etape.paraverbal, etape.non_verbal]
        .map((options) => options.reduce((max, o) => maximum(max, o.points), {} as Points))
        .reduce((total, p) => ajouter(total, p), {} as Points);
    case 'observation':
      return etape.elements.reduce((total, e) => ajouter(total, e.points), {} as Points);
    case 'decision':
      return etape.choix.reduce((max, o) => maximum(max, o.points), {} as Points);
    case 'relais':
      return { ...etape.points };
  }
}

/**
 * Points maximum de la mission. Si des choix mènent à des étapes différentes, on compte
 * toutes les étapes : le niveau mesure alors ce qui a été fait sur l'ensemble du parcours prévu.
 */
export function pointsMaxMission(mission: Mission): Points {
  return mission.etapes.reduce((total, e) => ajouter(total, pointsMaxEtape(e)), {} as Points);
}

/** Étape suivante : la suite indiquée par le choix, sinon l'étape d'après dans la liste. */
function suivante(mission: Mission, etape: Etape, suite?: string): string | null {
  if (suite === 'fin') return null;
  if (suite) return suite;
  const i = mission.etapes.indexOf(etape);
  return mission.etapes[i + 1]?.id ?? null;
}

export function repondre(mission: Mission, etat: EtatMission, reponse: Reponse): Resultat {
  const etape = etapeEnCours(mission, etat);
  if (!etape || etape.type !== reponse.type) {
    throw new Error(`Réponse « ${reponse.type} » inattendue à l'étape « ${etat.etape} ».`);
  }
  const max = pointsMaxEtape(etape);

  switch (etape.type) {
    case 'dialogue': {
      const r = reponse as Extract<Reponse, { type: 'dialogue' }>;
      const options = [etape.verbal[r.verbal], etape.paraverbal[r.paraverbal], etape.non_verbal[r.non_verbal]];
      if (options.some((o) => !o)) throw new Error(`Option de dialogue inconnue à l'étape « ${etape.id} ».`);
      const gagnes = options.reduce((total, o) => ajouter(total, o.points), {} as Points);
      const confiance = options.reduce((c, o) => c + o.confiance, etat.confiance);
      return {
        etat: {
          ...etat,
          etape: suivante(mission, etape),
          points: ajouter(etat.points, gagnes),
          confiance: Math.min(CONFIANCE_MAX, Math.max(0, confiance)),
          essais: 0,
        },
        retours: options.map((o) => o.retour),
        reussi: identiques(gagnes, max),
      };
    }
    case 'observation': {
      const r = reponse as Extract<Reponse, { type: 'observation' }>;
      let gagnes: Points = {};
      const retours = etape.elements.map((e) => {
        const bien = r.classements[e.id] === e.effet;
        if (bien) gagnes = ajouter(gagnes, e.points);
        return `${bien ? '✔' : '✘'} ${e.libelle} ${e.retour}`;
      });
      return {
        etat: { ...etat, etape: suivante(mission, etape), points: ajouter(etat.points, gagnes), essais: 0 },
        retours,
        reussi: identiques(gagnes, max),
      };
    }
    case 'decision': {
      const r = reponse as Extract<Reponse, { type: 'decision' }>;
      const choix = etape.choix[r.choix];
      if (!choix) throw new Error(`Choix inconnu à l'étape « ${etape.id} ».`);
      return {
        etat: {
          ...etat,
          etape: suivante(mission, etape, choix.suite),
          points: ajouter(etat.points, choix.points),
          essais: 0,
          decisions: [...etat.decisions, choix.decision],
        },
        retours: [choix.retour],
        reussi: identiques(choix.points ?? {}, max),
      };
    }
    case 'relais': {
      const r = reponse as Extract<Reponse, { type: 'relais' }>;
      if (r.destinataire !== etape.destinataire) {
        // On reste sur l'étape : l'élève peut chercher la bonne personne.
        return { etat: { ...etat, essais: etat.essais + 1 }, retours: [etape.retour_erreur], reussi: false };
      }
      const gagnes = etat.essais === 0 ? etape.points : {}; // les points ne comptent qu'au premier essai
      return {
        etat: { ...etat, etape: suivante(mission, etape), points: ajouter(etat.points, gagnes), essais: 0 },
        retours: [etape.retour],
        reussi: etat.essais === 0,
      };
    }
  }
}

/**
 * Niveau d'une compétence d'après la part des points obtenus (conventions de la matrice) :
 * moins de 40 % → N1, moins de 70 % → N2, sinon N3.
 * N4 (« transfère à une situation nouvelle ») n'est possible que dans une mission marquée `transfert`, avec 90 % au moins.
 */
export function niveau(obtenus: number, max: number, transfert = false): Niveau {
  const part = max > 0 ? obtenus / max : 0;
  if (transfert && part >= 0.9) return 'N4';
  if (part >= 0.7) return 'N3';
  if (part >= 0.4) return 'N2';
  return 'N1';
}

export interface BilanCompetence {
  code: string;
  critere: string;
  points: number;
  max: number;
  niveau: Niveau;
}

export interface Bilan {
  mission: string;
  competences: BilanCompetence[];
  confiance: number;
  debriefing: string[];
}

export function bilan(mission: Mission, etat: EtatMission): Bilan {
  const max = pointsMaxMission(mission);
  return {
    mission: mission.id,
    competences: mission.competences.map(({ code, critere }) => {
      const points = etat.points[code] ?? 0;
      return { code, critere, points, max: max[code] ?? 0, niveau: niveau(points, max[code] ?? 0, mission.transfert) };
    }),
    confiance: etat.confiance,
    debriefing: mission.debriefing,
  };
}
