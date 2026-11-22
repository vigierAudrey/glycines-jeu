// Tâche 3.2 : vérifie que chaque mission se joue jusqu'au bout avec le moteur de règles
// (sans navigateur : c'est le rôle de src/regles/mission.ts, voir docs/ARCHITECTURE.md).
// Un bon choix est fait à chaque étape (destinataire exact, classement exact des éléments observés)
// pour s'assurer que le parcours « parfait » existe bien et se termine, pour les 18 missions.

import { describe, expect, it } from 'vitest';
import type { Etape, Mission } from '../src/contenu/types';
import { bilan, demarrerMission, etapeEnCours, repondre, type EtatMission, type Reponse } from '../src/regles/mission';
import { lireContenuDepuisDisque } from '../tools/valider-contenu';

const contenu = lireContenuDepuisDisque();

function reponseParfaite(etape: Etape): Reponse {
  switch (etape.type) {
    case 'dialogue':
      return { type: 'dialogue', verbal: 0, paraverbal: 0, non_verbal: 0 };
    case 'observation': {
      const classements: Record<string, 'facilite' | 'gene'> = {};
      for (const e of etape.elements) classements[e.id] = e.effet;
      return { type: 'observation', classements };
    }
    case 'decision':
      return { type: 'decision', choix: 0 };
    case 'relais':
      return { type: 'relais', destinataire: etape.destinataire };
    case 'transmission':
      return { type: 'transmission', classements: Object.fromEntries(etape.phrases.map((ph) => [ph.id, ph.nature])) };
    case 'ordre':
      return { type: 'ordre', ordre: etape.elements.map((el) => el.id) };
    case 'selection':
      return { type: 'selection', choisis: etape.elements.filter((el) => el.attendu).map((el) => el.id) };
    case 'tri':
      return { type: 'tri', rangements: Object.fromEntries(etape.elements.map((el) => [el.id, el.categorie])) };
  }
}

/** Joue une mission jusqu'à sa dernière étape (garde-fou : 50 étapes au plus, pour ne pas boucler sans fin en cas de bug). */
function jouerJusquAuBout(mission: Mission): EtatMission {
  let etat = demarrerMission(mission);
  for (let i = 0; i < 50 && etat.etape !== null; i++) {
    const etape = etapeEnCours(mission, etat)!;
    etat = repondre(mission, etat, reponseParfaite(etape)).etat;
  }
  return etat;
}

describe('les 18 missions se jouent jusqu\'à la relève', () => {
  for (const mission of contenu.missions) {
    it(`${mission.id} (${mission.statut})`, () => {
      const etat = jouerJusquAuBout(mission);
      expect(etat.etape).toBeNull();

      const relève = bilan(mission, etat);
      expect(relève.competences).toHaveLength(mission.competences.length);
      for (const c of relève.competences) {
        expect(c.points).toBeGreaterThan(0);
        expect(['N1', 'N2', 'N3', 'N4']).toContain(c.niveau);
      }
    });
  }
});
