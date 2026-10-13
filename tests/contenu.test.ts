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

describe('le validateur refuse dans les étapes', () => {
  const base = lireContenuDepuisDisque();
  const mission = base.missions[0];
  const avec = (changement: object) => validerContenu({ ...base, missions: [{ ...mission, ...changement }] as typeof base.missions })
    .map((p) => p.message).join();

  it('des points pour une compétence non visée', () => {
    const etapes = structuredClone(mission.etapes);
    (etapes[2] as { choix: { points?: object }[] }).choix[0].points = { 'C2.1.1': 1 };
    expect(avec({ etapes })).toMatch(/non visée/);
  });
  it('une suite qui ne mène nulle part', () => {
    const etapes = structuredClone(mission.etapes);
    (etapes[2] as { choix: { suite?: string }[] }).choix[0].suite = 'nulle-part';
    expect(avec({ etapes })).toMatch(/n'existe pas/);
  });
  it('un repère hors du lieu de la mission', () => {
    const etapes = structuredClone(mission.etapes);
    (etapes[1] as { elements: { colonne: number }[] }).elements[0].colonne = 20;
    expect(avec({ etapes })).toMatch(/pas dans le lieu/);
  });
  it('un relais vers une personne inconnue', () => {
    const etapes = structuredClone(mission.etapes);
    (etapes[4] as { destinataire: string }).destinataire = 'medecin';
    expect(avec({ etapes })).toMatch(/introuvable dans le personnel/);
  });
  it('une compétence visée jamais évaluée', () => {
    const competences = [...mission.competences, { code: 'CT4.2', critere: 'Respect du projet de vie.' }];
    expect(avec({ competences })).toMatch(/CT4.2 est visée/);
  });
  it('un débriefing trop court', () => expect(avec({ debriefing: ['Une seule ?'] })).toMatch(/2 ou 3 questions/));
});
