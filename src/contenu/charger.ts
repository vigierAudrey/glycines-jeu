// Chargement du contenu dans le navigateur.
// Vite intègre les fichiers JSON au moment de la construction du jeu : aucun réseau n'est nécessaire
// pendant la partie, donc le jeu marche hors ligne.

import type { Contenu, Lieu, MembrePersonnel, Mission, Referentiel, Resident } from './types';
import referentiel from '../../content/referentiel/bloc2.json';
import aileB from '../../content/lieux/aile-b.json';
import residents from '../../content/personnages/residents.json';
import personnel from '../../content/personnages/personnel.json';

// Toutes les missions du dossier content/scenarios sont prises automatiquement.
const fichiersMissions = import.meta.glob<Mission>('../../content/scenarios/*.json', { eager: true, import: 'default' });

export function chargerContenu(): Contenu {
  return {
    referentiel: referentiel as Referentiel,
    lieux: [aileB as Lieu],
    residents: residents.residents as Resident[],
    personnel: personnel.personnel as MembrePersonnel[],
    missions: Object.values(fichiersMissions),
  };
}
