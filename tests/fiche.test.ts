import { describe, expect, it } from 'vitest';
import { ficheDe } from '../src/regles/fiche';
import type { MembrePersonnel, Resident } from '../src/contenu/types';
import fichierResidents from '../content/personnages/residents.json';
import fichierPersonnel from '../content/personnages/personnel.json';

const residents = fichierResidents.residents as Resident[];
const personnel = fichierPersonnel.personnel as MembrePersonnel[];

describe('ficheDe', () => {
  it('présente un résident par son nom et accorde « Résident » à la civilité', () => {
    expect(ficheDe('rose', residents, personnel)).toEqual({ nom: 'Mme Rose', role: 'Résidente' });
    expect(ficheDe('karim', residents, personnel)).toEqual({ nom: 'M. Karim', role: 'Résident' });
  });

  it('présente un professionnel par son prénom, son métier et son sigle', () => {
    expect(ficheDe('infirmiere', residents, personnel)).toEqual({ nom: 'Claire', role: 'Infirmière (IDE)' });
  });

  it('présente le personnage joué par « Vous »', () => {
    expect(ficheDe('joueur', residents, personnel)?.nom).toBe('Vous');
  });

  it('a une fiche pour chaque personne de l’aile B', () => {
    for (const p of [...residents, ...personnel]) expect(ficheDe(p.id, residents, personnel)).toBeDefined();
  });

  it('ne connaît pas un id inventé', () => {
    expect(ficheDe('inconnu', residents, personnel)).toBeUndefined();
  });
});
