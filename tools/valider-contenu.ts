// Commande : npm run valider
// Lit tous les fichiers de content/, vérifie leur cohérence avec le référentiel et affiche les problèmes.
// Code de sortie 1 s'il y a au moins un problème : la commande « npm run verifier » s'arrête alors.

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Contenu } from '../src/contenu/types';
import { validerContenu } from '../src/contenu/valider';

export function lireContenuDepuisDisque(racine = 'content'): Contenu {
  const lire = (chemin: string) => JSON.parse(readFileSync(join(racine, chemin), 'utf8'));
  const lireDossier = (dossier: string) =>
    readdirSync(join(racine, dossier))
      .filter((f) => f.endsWith('.json'))
      .sort()
      .map((f) => lire(join(dossier, f)));

  return {
    referentiel: lire('referentiel/bloc2.json'),
    lieux: lireDossier('lieux'),
    residents: lire('personnages/residents.json').residents,
    personnel: lire('personnages/personnel.json').personnel,
    missions: lireDossier('scenarios'),
  };
}

// N'exécuter la vérification que si le fichier est lancé directement (pas quand un test l'importe).
if (process.argv[1]?.endsWith('valider-contenu.ts')) {
  const contenu = lireContenuDepuisDisque();
  const problemes = validerContenu(contenu);
  const brouillons = contenu.missions.filter((m) => m.statut === 'brouillon').length;

  console.log(`Référentiel : ${contenu.referentiel.competences.length} compétences`);
  console.log(`Lieux : ${contenu.lieux.length} · Résidents : ${contenu.residents.length} · Personnel : ${contenu.personnel.length}`);
  console.log(`Missions : ${contenu.missions.length} (dont ${brouillons} en brouillon)`);

  if (problemes.length === 0) {
    console.log('\n✅ Contenu valide.');
  } else {
    console.log(`\n❌ ${problemes.length} problème(s) :`);
    for (const p of problemes) console.log(`  · [${p.fichier}] ${p.message}`);
    process.exit(1);
  }
}
