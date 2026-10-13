// Fiche d'une personne de l'aile B, affichée dans la bulle quand on la touche (couche « règles » : aucune 3D ici).
// Seulement le nom et le rôle : rien de médical, rien qui ne soit déjà dans content/personnages/.

import type { MembrePersonnel, Resident } from '../contenu/types';

export interface Fiche {
  nom: string;
  role: string;
}

/** Fiche d'une personne à partir de son id, ou undefined si l'id n'existe pas. */
export function ficheDe(id: string, residents: Resident[], personnel: MembrePersonnel[]): Fiche | undefined {
  const resident = residents.find((r) => r.id === id);
  if (resident) return { nom: `${resident.civilite} ${resident.nom}`, role: resident.civilite === 'Mme' ? 'Résidente' : 'Résident' };

  const membre = personnel.find((p) => p.id === id);
  if (membre) return { nom: membre.joueur ? 'Vous' : membre.prenom, role: `${membre.metier} (${membre.sigle})` };

  return undefined;
}
