// Moteur de mission (couche « règles » : aucune 3D, aucun HTML, testable sans navigateur).
//
// Une mission est une suite d'étapes (voir src/contenu/types.ts et docs/ARCHITECTURE.md).
// Le moteur garde l'état de la partie : étape en cours, points par compétence, confiance du résident.
// L'interface lui donne la réponse de l'élève ; il renvoie le nouvel état et les retours à afficher.
// L'état n'est jamais modifié : chaque réponse fabrique un nouvel état (plus simple à tester et à sauvegarder).

import type { Decision, Etape, Mission, NaturePhrase, Points } from '../contenu/types';

export const NOMS_NATURE: Record<NaturePhrase, string> = { fait: 'fait observé', jugement: 'jugement', interpretation: 'interprétation' };

export type Niveau = 'N1' | 'N2' | 'N3' | 'N4';

export interface EtatMission {
  mission: string; // id de la mission
  etape: string | null; // id de l'étape en cours, null quand la mission est finie
  points: Points; // points gagnés par compétence
  confiance: number; // de 0 à 10
  essais: number; // nombre d'erreurs sur l'étape en cours (étape « relais »)
  decisions: Decision[]; // décisions prises, dans l'ordre (pour la relève)
  parcours: Trace[]; // ce que l'élève a répondu, étape par étape (pour la fiche de fin de mission)
}

/** Trace d'une étape terminée : ce que l'élève a choisi, en clair. */
export interface Trace {
  etape: string; // id de l'étape
  reponses: string[]; // textes choisis (pour un relais : l'id de la personne rejointe)
  reussi: boolean; // tous les points de l'étape du premier coup
}

/** Réponse de l'élève, selon le type de l'étape en cours. */
export type Reponse =
  | { type: 'dialogue'; verbal: number; paraverbal: number; non_verbal: number } // numéros des options choisies
  | { type: 'observation'; classements: Record<string, 'facilite' | 'gene'> } // id de l'élément → avis de l'élève
  | { type: 'decision'; choix: number }
  | { type: 'relais'; destinataire: string } // id du membre du personnel rejoint
  | { type: 'transmission'; classements: Record<string, NaturePhrase> } // id de la phrase → nature choisie
  | { type: 'ordre'; ordre: string[] } // ids des éléments, dans l'ordre choisi par l'élève
  | { type: 'selection'; choisis: string[] } // ids des éléments cochés
  | { type: 'qcm'; choix: number } // indice de l'option choisie
  | { type: 'association'; liens: Record<string, string> } // id de la paire du mot → id de la paire de la définition choisie
  | { type: 'tri'; rangements: Record<string, string> }; // id de l'élément → id de la catégorie choisie

export interface Resultat {
  etat: EtatMission;
  retours: string[]; // explications à montrer à l'élève
  reussi: boolean; // vrai si la réponse rapporte tous les points possibles de l'étape
  aRevoir: string[]; // codes des compétences de l'étape qui n'ont pas reçu tous leurs points (pour rappeler leur critère)
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

/** Compétences pour lesquelles l'élève a gagné moins que le maximum de l'étape. */
const manquantes = (gagnes: Points, max: Points): string[] =>
  Object.keys(max).filter((c) => max[c] > 0 && (gagnes[c] ?? 0) < max[c]);

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
    parcours: [],
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
    case 'transmission':
      return etape.phrases.reduce((total, ph) => ajouter(total, ph.points), {} as Points);
    case 'qcm':
      return { ...(etape.points ?? {}) };
    case 'association':
      return etape.paires.reduce((total, p) => ajouter(total, p.points), {} as Points);
    case 'ordre':
    case 'selection':
    case 'tri':
      return (etape.elements as { points?: Points }[]).reduce((total, el) => ajouter(total, el.points), {} as Points);
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

/** Ce que l'élève a choisi, en clair, pour la trace de l'étape. */
function textesChoisis(etape: Etape, reponse: Reponse): string[] {
  switch (etape.type) {
    case 'dialogue': {
      const r = reponse as Extract<Reponse, { type: 'dialogue' }>;
      return [etape.verbal[r.verbal].texte, etape.paraverbal[r.paraverbal].texte, etape.non_verbal[r.non_verbal].texte];
    }
    case 'observation': {
      const r = reponse as Extract<Reponse, { type: 'observation' }>;
      return etape.elements.map((e) => `${e.libelle} : ${r.classements[e.id] === 'gene' ? 'gêne' : r.classements[e.id] === 'facilite' ? 'facilite' : 'non classé'}`);
    }
    case 'decision':
      return [etape.choix[(reponse as Extract<Reponse, { type: 'decision' }>).choix].texte];
    case 'relais':
      return [(reponse as Extract<Reponse, { type: 'relais' }>).destinataire];
    case 'transmission': {
      const r = reponse as Extract<Reponse, { type: 'transmission' }>;
      return etape.phrases.map((ph) => `« ${ph.texte} » : ${r.classements[ph.id] ? NOMS_NATURE[r.classements[ph.id]] : 'non classée'}`);
    }
    case 'ordre': {
      const r = reponse as Extract<Reponse, { type: 'ordre' }>;
      return r.ordre.map((id, i) => `${i + 1}. ${etape.elements.find((el) => el.id === id)?.texte ?? id}`);
    }
    case 'selection': {
      const r = reponse as Extract<Reponse, { type: 'selection' }>;
      const pris = etape.elements.filter((el) => r.choisis.includes(el.id)).map((el) => `Coché : ${el.texte}`);
      return pris.length ? pris : ['Rien coché'];
    }
    case 'qcm': {
      const r = reponse as Extract<Reponse, { type: 'qcm' }>;
      return [etape.options[r.choix]?.texte ?? ''];
    }
    case 'association': {
      const r = reponse as Extract<Reponse, { type: 'association' }>;
      return etape.paires.map((p) => `${p.terme} → ${etape.paires.find((x) => x.id === r.liens[p.id])?.definition ?? 'non relié'}`);
    }
    case 'tri': {
      const r = reponse as Extract<Reponse, { type: 'tri' }>;
      const nom = (id: string) => etape.categories.find((c) => c.id === id)?.libelle ?? 'non rangé';
      return etape.elements.map((el) => `${el.texte} → ${nom(r.rangements[el.id])}`);
    }
  }
}

export function repondre(mission: Mission, etat: EtatMission, reponse: Reponse): Resultat {
  const resultat = repondreEtape(mission, etat, reponse);
  const etape = etapeEnCours(mission, etat)!;
  // L'étape est terminée quand on a changé d'étape (un relais manqué reste sur place).
  if (resultat.etat.etape === etat.etape && resultat.etat.essais > etat.essais) return resultat;
  const trace: Trace = { etape: etape.id, reponses: textesChoisis(etape, reponse), reussi: resultat.reussi };
  return { ...resultat, etat: { ...resultat.etat, parcours: [...etat.parcours, trace] } };
}

function repondreEtape(mission: Mission, etat: EtatMission, reponse: Reponse): Resultat {
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
        aRevoir: manquantes(gagnes, max),
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
        aRevoir: manquantes(gagnes, max),
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
        aRevoir: manquantes(choix.points ?? {}, max),
      };
    }
    case 'relais': {
      const r = reponse as Extract<Reponse, { type: 'relais' }>;
      if (r.destinataire !== etape.destinataire) {
        // On reste sur l'étape : l'élève peut chercher la bonne personne.
        return { etat: { ...etat, essais: etat.essais + 1 }, retours: [etape.retour_erreur], reussi: false, aRevoir: manquantes({}, max) };
      }
      const gagnes = etat.essais === 0 ? etape.points : {}; // les points ne comptent qu'au premier essai
      return {
        etat: { ...etat, etape: suivante(mission, etape), points: ajouter(etat.points, gagnes), essais: 0 },
        retours: [etape.retour],
        reussi: etat.essais === 0,
        aRevoir: manquantes(gagnes ?? {}, max),
      };
    }
    case 'transmission': {
      const r = reponse as Extract<Reponse, { type: 'transmission' }>;
      let gagnes: Points = {};
      const retours = etape.phrases.map((ph) => {
        const bien = r.classements[ph.id] === ph.nature;
        if (bien) gagnes = ajouter(gagnes, ph.points);
        return `${bien ? '✔' : '✘'} « ${ph.texte} » est ${ph.nature === 'interpretation' ? 'une' : 'un'} ${NOMS_NATURE[ph.nature]}. ${ph.retour}`;
      });
      // La transmission de l'élève : les phrases qu'il a gardées comme faits observés.
      const gardees = etape.phrases.filter((ph) => r.classements[ph.id] === 'fait').map((ph) => `« ${ph.texte} »`);
      retours.push(gardees.length ? `Votre transmission : ${gardees.join(' ')}` : 'Vous n\'avez gardé aucun fait observé : il n\'y a rien à transmettre.');
      return {
        etat: { ...etat, etape: suivante(mission, etape), points: ajouter(etat.points, gagnes), essais: 0 },
        retours,
        reussi: identiques(gagnes, max),
        aRevoir: manquantes(gagnes, max),
      };
    }
    case 'ordre': {
      const r = reponse as Extract<Reponse, { type: 'ordre' }>;
      let gagnes: Points = {};
      etape.elements.forEach((el, rang) => {
        if (r.ordre[rang] === el.id) gagnes = ajouter(gagnes, el.points);
      });
      const bienPlaces = etape.elements.filter((el, rang) => r.ordre[rang] === el.id).length;
      const retours = [
        `${bienPlaces} étape${bienPlaces > 1 ? 's' : ''} sur ${etape.elements.length} à la bonne place.`,
        ...(bienPlaces < etape.elements.length ? ['L\'ordre attendu :', ...etape.elements.map((el, i) => `${i + 1}. ${el.texte}`)] : []),
        etape.retour,
      ];
      return {
        etat: { ...etat, etape: suivante(mission, etape), points: ajouter(etat.points, gagnes), essais: 0 },
        retours,
        reussi: identiques(gagnes, max),
        aRevoir: manquantes(gagnes, max),
      };
    }
    case 'selection': {
      const r = reponse as Extract<Reponse, { type: 'selection' }>;
      let gagnes: Points = {};
      const retours = etape.elements.map((el) => {
        const pris = r.choisis.includes(el.id);
        const bien = pris === el.attendu;
        if (bien) gagnes = ajouter(gagnes, el.points);
        return `${bien ? '✔' : '✘'} ${el.texte} : ${el.attendu ? 'à cocher' : 'à ne pas cocher'}. ${el.retour}`;
      });
      return {
        etat: { ...etat, etape: suivante(mission, etape), points: ajouter(etat.points, gagnes), essais: 0 },
        retours,
        reussi: identiques(gagnes, max),
        aRevoir: manquantes(gagnes, max),
      };
    }
    case 'qcm': {
      const r = reponse as Extract<Reponse, { type: 'qcm' }>;
      const juste = etape.options.find((o) => o.juste);
      const bien = etape.options[r.choix]?.juste === true;
      const gagnes: Points = bien ? { ...(etape.points ?? {}) } : {};
      return {
        etat: { ...etat, etape: suivante(mission, etape), points: ajouter(etat.points, gagnes), essais: 0 },
        retours: [bien ? `✔ ${juste?.texte ?? ''}` : `✘ La bonne réponse : ${juste?.texte ?? ''}`, etape.retour],
        reussi: identiques(gagnes, max),
        aRevoir: manquantes(gagnes, max),
      };
    }
    case 'association': {
      const r = reponse as Extract<Reponse, { type: 'association' }>;
      let gagnes: Points = {};
      const retours = etape.paires.map((p) => {
        const bien = r.liens[p.id] === p.id;
        if (bien) gagnes = ajouter(gagnes, p.points);
        return `${bien ? '✔' : '✘'} ${p.terme} : ${p.definition}`;
      });
      return {
        etat: { ...etat, etape: suivante(mission, etape), points: ajouter(etat.points, gagnes), essais: 0 },
        retours: etape.retour ? [...retours, etape.retour] : retours,
        reussi: identiques(gagnes, max),
        aRevoir: manquantes(gagnes, max),
      };
    }
    case 'tri': {
      const r = reponse as Extract<Reponse, { type: 'tri' }>;
      let gagnes: Points = {};
      const nom = (id: string) => etape.categories.find((c) => c.id === id)?.libelle ?? '';
      const retours = etape.elements.map((el) => {
        const bien = r.rangements[el.id] === el.categorie;
        if (bien) gagnes = ajouter(gagnes, el.points);
        return `${bien ? '✔' : '✘'} ${el.texte} → ${nom(el.categorie)}. ${el.retour}`;
      });
      return {
        etat: { ...etat, etape: suivante(mission, etape), points: ajouter(etat.points, gagnes), essais: 0 },
        retours,
        reussi: identiques(gagnes, max),
        aRevoir: manquantes(gagnes, max),
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
  parcours: Trace[];
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
    parcours: etat.parcours,
  };
}
