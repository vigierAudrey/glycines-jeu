import { describe, expect, it } from 'vitest';
import { validerContenu } from '../src/contenu/valider';
import { lireContenuDepuisDisque } from '../tools/valider-contenu';

describe('contenu du dossier content/', () => {
  const contenu = lireContenuDepuisDisque();

  it('est cohérent avec le référentiel', () => {
    expect(validerContenu(contenu)).toEqual([]);
  });

  it('contient les 14 sous-compétences du Bloc 2', () => {
    expect(contenu.referentiel.competences.map((c) => c.code)).toEqual([
      'CT3.1', 'CT3.2', 'CT3.3', 'CT3.4', 'CT4.1', 'CT4.2',
      'C2.1.1', 'C2.1.2', 'C2.1.3', 'C2.1.4', 'C2.1.5', 'C2.1.6', 'C2.2.1', 'C2.2.2',
    ]);
  });
});

describe('le validateur refuse', () => {
  const base = lireContenuDepuisDisque();
  const mission = base.missions[0];

  it('une compétence inventée', () => {
    const contenu = { ...base, missions: [{ ...mission, competences: [{ code: 'CT9.9', critere: 'x' }] }] };
    expect(validerContenu(contenu).map((p) => p.message).join()).toMatch(/absente du référentiel/);
  });

  it('un critère reformulé', () => {
    const critere = mission.competences[0].critere.replace('Prise en compte', 'Prendre en compte');
    const contenu = { ...base, missions: [{ ...mission, competences: [{ code: mission.competences[0].code, critere }] }] };
    expect(validerContenu(contenu).map((p) => p.message).join()).toMatch(/mot pour mot/);
  });

  describe('un meuble mal posé', () => {
    const lieu = base.lieux[0];
    const avec = (meuble: object) => validerContenu({ ...base, lieux: [{ ...lieu, meubles: [...(lieu.meubles ?? []), meuble] }] as typeof base.lieux })
      .map((p) => p.message).join();

    it('sur une porte', () => expect(avec({ type: 'fauteuil', colonne: 2, rangee: 3, vers: 'sud' })).toMatch(/sur une porte/));
    it('qui dépasse de sa pièce', () => expect(avec({ type: 'lit', colonne: 3, rangee: 1, vers: 'est' })).toMatch(/dépasse/));
    it('sur un autre meuble', () => expect(avec({ type: 'fauteuil', colonne: 0, rangee: 1, vers: 'sud' })).toMatch(/chevauche/));
    it('une sonnette loin du lit', () => expect(avec({ type: 'sonnette', colonne: 2, rangee: 1, vers: 'sud' })).toMatch(/portée de main/));
    it('un type inconnu', () => expect(avec({ type: 'piano', colonne: 2, rangee: 1, vers: 'sud' })).toMatch(/type inconnu/));
  });

  it('un tiret cadratin dans un texte élève', () => {
    const contenu = { ...base, missions: [{ ...mission, titre: 'Avant \u2014 après' }] };
    expect(validerContenu(contenu).map((p) => p.message).join()).toMatch(/cadratin/);
  });
});
