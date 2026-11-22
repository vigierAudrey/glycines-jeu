// Bilan de toutes les compétences (« Mon bilan ») : couche « règles », pure et testable.
// À partir de la progression gardée dans le navigateur (dernier niveau par mission et par compétence),
// on range, pour chaque compétence du référentiel, les missions qui l'ont travaillée et leur niveau.

import type { Mission, Referentiel } from '../contenu/types';
import type { Niveau } from './mission';
import type { Progression } from './sauvegarde';

const ORDRE: Niveau[] = ['N1', 'N2', 'N3', 'N4'];

export interface ResultatMission {
  mission: string;
  titre: string;
  critere: string; // critère officiel cité par la mission
  niveau: Niveau;
}

export interface LigneBilan {
  code: string;
  intitule: string;
  resultats: ResultatMission[];
  meilleur?: Niveau; // meilleur niveau obtenu, toutes missions confondues
}

export interface PartieBilan {
  titre: string;
  lignes: LigneBilan[];
}

export function bilanGlobal(
  progression: Progression,
  missions: readonly Mission[],
  parties: readonly { titre: string; referentiel: Referentiel }[],
): PartieBilan[] {
  return parties.map(({ titre, referentiel }) => ({
    titre,
    lignes: referentiel.competences.map((c) => {
      const resultats: ResultatMission[] = [];
      for (const m of missions) {
        const niveau = progression[m.id]?.[c.code];
        const vise = m.competences.find((cv) => cv.code === c.code);
        if (niveau && vise) resultats.push({ mission: m.id, titre: m.titre, critere: vise.critere, niveau });
      }
      const meilleur = resultats.reduce<Niveau | undefined>(
        (max, r) => (!max || ORDRE.indexOf(r.niveau) > ORDRE.indexOf(max) ? r.niveau : max),
        undefined,
      );
      return { code: c.code, intitule: c.intitule, resultats, meilleur };
    }),
  }));
}
