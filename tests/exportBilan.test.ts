import { describe, expect, it } from 'vitest';
import { bilanGlobal } from '../src/regles/bilanGlobal';
import { bilanEnCsv, bilanEnJson, nomDeFichier } from '../src/regles/exportBilan';
import { decoderCode } from '../src/regles/sauvegarde';
import { lireContenuDepuisDisque } from '../tools/valider-contenu';

const contenu = lireContenuDepuisDisque();
const parties = (progression = {}) => bilanGlobal(progression, contenu.missions, [{ titre: 'Bloc 2', referentiel: contenu.referentiel }]);
const m00 = contenu.missions.find((m) => m.id === 'm00-exemple-chambre-karim')!;
const progression = { [m00.id]: Object.fromEntries(m00.competences.map((c) => [c.code, 'N3' as const])) };
const eleve = { prenom: 'Léa', nom: 'Dupont', classe: 'TCAP' };

describe('export du bilan', () => {
  it('fait un tableau CSV lisible par LibreOffice, avec le nom et une ligne par compétence au moins', () => {
    const csv = bilanEnCsv(parties(progression), eleve, '24/11/2026');
    expect(csv.startsWith('﻿"Prénom";"Nom"')).toBe(true);
    const lignes = csv.trim().split('\r\n');
    expect(lignes.length).toBeGreaterThan(contenu.referentiel.competences.length);
    expect(csv).toContain('"Léa";"Dupont";"TCAP";"24/11/2026"');
    expect(csv).toContain(`"${m00.titre.replace(/"/g, '""')}";"N3"`);
    expect(csv).toContain('"pas encore"');
  });

  it("n'écrit jamais une formule de tableur, même si l'élève tape « = »", () => {
    const csv = bilanEnCsv(parties(), { prenom: '=1+1', nom: 'A"B', classe: '' }, 'x');
    expect(csv).toContain(`"'=1+1";"A""B"`);
  });

  it('fait un JSON avec un code de reprise qui redonne la même progression', () => {
    const donnees = JSON.parse(bilanEnJson(parties(progression), eleve, '2026-11-24', progression, contenu.missions));
    expect(donnees.eleve).toEqual(eleve);
    expect(decoderCode(donnees.code_reprise, contenu.missions)).toEqual({ progression });
  });

  it('donne un nom de fichier sans accent ni espace', () => {
    expect(nomDeFichier({ prenom: 'Léa Marie', nom: "D'Été", classe: '' }, '2026-11-24', 'csv')).toBe('bilan-glycines-D-Ete-Lea-Marie-2026-11-24.csv');
    expect(nomDeFichier({ prenom: '', nom: '', classe: '' }, '2026-11-24', 'json')).toBe('bilan-glycines-2026-11-24.json');
  });
});
