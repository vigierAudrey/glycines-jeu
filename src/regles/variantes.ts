// Variantes d'une mission (couche « règles » : pure, testable, aucun import de three).
// Une variante change seulement le contexte raconté : situation et consignes d'étapes.
// Les réponses, les points et les niveaux restent ceux de la mission de base.

import type { Mission, VarianteMission } from '../contenu/types';

/** Renvoie la mission racontée dans le contexte de la variante. */
export function appliquerVariante(mission: Mission, variante: VarianteMission): Mission {
  return {
    ...mission,
    situation: variante.situation,
    etapes: mission.etapes.map((e) => {
      const consigne = variante.consignes?.[e.id];
      return consigne ? { ...e, consigne } : e;
    }),
  };
}

/** Tire au hasard la version de base ou l'une des variantes (chacune a la même chance). */
export function tirerVariante(mission: Mission, hasard: () => number = Math.random): Mission {
  const variantes = mission.variantes ?? [];
  const n = Math.floor(hasard() * (variantes.length + 1));
  return n === 0 ? mission : appliquerVariante(mission, variantes[n - 1]);
}
