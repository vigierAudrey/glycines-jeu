import { describe, expect, it } from 'vitest';
import { bilanGlobal } from '../src/regles/bilanGlobal';
import { ajouterBilan, classeEnCsv, lireFichierBilan, lireLigneCode, tableauxClasse } from '../src/regles/bilanClasse';
import { bilanEnJson } from '../src/regles/exportBilan';
import { encoderCode } from '../src/regles/sauvegarde';
import { lireContenuDepuisDisque } from '../tools/valider-contenu';

const contenu = lireContenuDepuisDisque();
const parties = [
  { titre: 'Bloc 2', referentiel: contenu.referentiel },
  { titre: 'PSE', referentiel: contenu.referentielPse! },
];
const m00 = contenu.missions.find((m) => m.id === 'm00-exemple-chambre-karim')!;
const progression = { [m00.id]: Object.fromEntries(m00.competences.map((c) => [c.code, 'N3' as const])) };
const fichier = (prenom: string, date: string) =>
  bilanEnJson(bilanGlobal(progression, contenu.missions, parties), { prenom, nom: 'Dupont', classe: 'TCAP' }, date, progression, contenu.missions);

describe('bilans de la classe', () => {
  it("relit le fichier .json d'un élève", () => {
    const lu = lireFichierBilan(fichier('Léa', '2026-11-24'), contenu.missions);
    expect('bilan' in lu && lu.bilan.eleve.prenom).toBe('Léa');
    expect('bilan' in lu && lu.bilan.progression).toEqual(progression);
  });

  it('refuse un fichier qui ne vient pas du jeu ou un code modifié à la main', () => {
    expect(lireFichierBilan('pas du json', contenu.missions)).toHaveProperty('erreur');
    expect(lireFichierBilan('{"format":"autre"}', contenu.missions)).toHaveProperty('erreur');
    const triche = JSON.parse(fichier('Léa', '2026-11-24'));
    triche.code_reprise = triche.code_reprise.replace('3', '4');
    expect(lireFichierBilan(JSON.stringify(triche), contenu.missions)).toHaveProperty('erreur');
  });

  it('lit une ligne « Nom ; code »', () => {
    const lu = lireLigneCode(`Martin Sam ; ${encoderCode(progression, contenu.missions)}`, contenu.missions);
    expect('bilan' in lu && lu.bilan.eleve.nom).toBe('Martin Sam');
    expect(lireLigneCode('Martin Sam', contenu.missions)).toHaveProperty('erreur');
  });

  it('garde le bilan le plus récent quand un élève en remet deux', () => {
    const lire = (date: string) => (lireFichierBilan(fichier('Léa', date), contenu.missions) as { bilan: never }).bilan;
    let liste = ajouterBilan([], lire('2026-11-20'));
    liste = ajouterBilan(liste, lire('2026-11-24'));
    liste = ajouterBilan(liste, lire('2026-11-22'));
    expect(liste.map((b) => b.date)).toEqual(['2026-11-24']);
  });

  it('fait un tableau élèves × compétences, et son CSV', () => {
    const b = (lireFichierBilan(fichier('Léa', '2026-11-24'), contenu.missions) as { bilan: never }).bilan;
    const tableaux = tableauxClasse([b], contenu.missions, parties);
    expect(tableaux[0].competences).toHaveLength(contenu.referentiel.competences.length);
    expect(tableaux[0].lignes[0].missionsFaites).toBe(1);
    expect(tableaux[0].lignes[0].niveaux.filter(Boolean).length).toBeGreaterThan(0);
    expect(classeEnCsv(tableaux)).toContain('"Dupont";"Léa";"TCAP";"2026-11-24";"1"');
  });
});
