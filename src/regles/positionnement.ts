// Auto-positionnement (P.13) : couche « règles », pure et testable.
// Avant la mission, l'élève estime son niveau par compétence ; la relève compare avec le niveau obtenu.
// Rien n'est enregistré : l'estimation vit seulement pendant la mission (et sur la fiche imprimée).

import type { Niveau } from './mission';

const ORDRE: Niveau[] = ['N1', 'N2', 'N3', 'N4'];

export type Ecart = 'juste' | 'mieux' | 'moins';

export function comparerEstimation(estime: Niveau, obtenu: Niveau): Ecart {
  const d = ORDRE.indexOf(obtenu) - ORDRE.indexOf(estime);
  return d === 0 ? 'juste' : d > 0 ? 'mieux' : 'moins';
}

export const PHRASES_ECART: Record<Ecart, string> = {
  juste: 'Votre estimation était juste.',
  mieux: 'Mieux que votre estimation : vous pouvez vous faire confiance.',
  moins: 'Moins que votre estimation : relisez les retours « À retenir ».',
};
