import { describe, expect, it } from 'vitest';
import { bilanGlobal } from '../src/regles/bilanGlobal';
import { lireContenuDepuisDisque } from '../tools/valider-contenu';

const contenu = lireContenuDepuisDisque();
const parties = [
  { titre: 'Bloc 2', referentiel: contenu.referentiel },
  { titre: 'PSE', referentiel: contenu.referentielPse! },
];

describe('bilan de toutes les compétences', () => {
  it('liste toutes les compétences, même celles pas encore travaillées', () => {
    const b = bilanGlobal({}, contenu.missions, parties);
    expect(b[0].lignes).toHaveLength(contenu.referentiel.competences.length);
    expect(b[1].lignes.every((l) => l.resultats.length === 0 && !l.meilleur)).toBe(true);
  });

  it('range les niveaux par compétence et garde le meilleur', () => {
    const m00 = contenu.missions.find((m) => m.id === 'm00-exemple-chambre-karim')!;
    const code = m00.competences[0].code;
    const autre = contenu.missions.find((m) => m.id !== m00.id && m.competences.some((c) => c.code === code))!;
    const b = bilanGlobal({ [m00.id]: { [code]: 'N2' }, [autre.id]: { [code]: 'N3' } }, contenu.missions, parties);
    const ligne = b[0].lignes.find((l) => l.code === code)!;
    expect(ligne.resultats.map((r) => r.niveau).sort()).toEqual(['N2', 'N3']);
    expect(ligne.meilleur).toBe('N3');
    expect(ligne.resultats[0].critere).toBeTruthy();
  });
});
