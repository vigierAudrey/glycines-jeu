// Déblocage des missions selon la progression du cours (couche « règles », testable).
// Une mission indique la séquence qu'elle suppose (`sequence_requise`, de S1 à S7).
// Elle est ouverte quand la classe a vu cette séquence ou une séquence suivante.

import type { Mission } from '../contenu/types';

export const SEQUENCES = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7'] as const;

const rang = (sequence: string) => SEQUENCES.indexOf(sequence as (typeof SEQUENCES)[number]);

/** Les missions de PSE ne dépendent pas de la progression du Bloc 2 : elles sont toujours ouvertes. */
export function estDebloquee(mission: Mission, sequenceVue: string): boolean {
  if (mission.discipline === 'PSE') return true;
  return rang(mission.sequence_requise) <= rang(sequenceVue);
}

/** Missions à montrer, rangées par séquence puis par identifiant. Les brouillons ne sont montrés que si on le demande. */
export function missionsAMontrer(missions: Mission[], avecBrouillons: boolean): Mission[] {
  return missions
    .filter((m) => avecBrouillons || m.statut === 'valide')
    .sort((a, b) => Number(a.discipline === 'PSE') - Number(b.discipline === 'PSE') || rang(a.sequence_requise) - rang(b.sequence_requise) || a.id.localeCompare(b.id));
}

/** Une mission appartient à une famille si l'une de ses compétences commence par le préfixe de la famille. */
export function dansFamille(mission: Mission, prefixe: string | null): boolean {
  return !prefixe || mission.competences.some((c) => c.code.startsWith(prefixe));
}

/** Lit une séquence écrite par un humain (« s3 », « S3 ») ; undefined si elle n'existe pas. */
export function lireSequence(texte: string | null | undefined): string | undefined {
  const s = texte?.trim().toUpperCase();
  return s && rang(s) >= 0 ? s : undefined;
}
