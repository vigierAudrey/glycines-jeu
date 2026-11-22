// Conséquences plus tard (P.12) : couche « règles », pure et testable.
//
// Une étape peut porter un rappel `si_oubli`. Si l'élève ne la réussit pas du premier coup, le rappel est mis
// de côté et montré une seule fois au début d'une autre mission. Rejouer la mission et réussir l'étape l'efface.
// Rien ne quitte l'appareil : la liste est gardée dans le navigateur (src/ui/progression.ts).

import type { Mission } from '../contenu/types';
import type { Trace } from './mission';

export interface Rappel {
  id: string; // « id de mission:id d'étape »
  mission: string;
  titre: string; // titre de la mission d'origine
  texte: string;
}

/** Met à jour les rappels en attente après une mission terminée. */
export function rappelsApresMission(enAttente: readonly Rappel[], mission: Mission, parcours: readonly Trace[]): Rappel[] {
  const resultat = enAttente.filter((r) => r.mission !== mission.id);
  for (const trace of parcours) {
    const etape = mission.etapes.find((e) => e.id === trace.etape);
    if (etape?.si_oubli && !trace.reussi) {
      resultat.push({ id: `${mission.id}:${etape.id}`, mission: mission.id, titre: mission.titre, texte: etape.si_oubli });
    }
  }
  return resultat;
}

/** Rappels à montrer au début d'une mission : ceux venus des autres missions. */
export function rappelsAMontrer(enAttente: readonly Rappel[], idMission: string): Rappel[] {
  return enAttente.filter((r) => r.mission !== idMission);
}
