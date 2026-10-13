// Point d'entrée du jeu : on charge le contenu, on calcule le plan, on monte le décor et l'interface.
// L'ordre suit les couches de l'architecture (voir docs/ARCHITECTURE.md) : contenu → règles → 3D → interface.

import * as THREE from 'three';
import './style.css';
import { chargerContenu } from './contenu/charger';
import { lirePlan, positionDansZone, trouverZone } from './regles/plan';
import { creerTheatre } from './scene3d/creerScene';
import { construireAile } from './scene3d/construireAile';
import { construireMeubles } from './scene3d/meubles';
import { placerPersonnages } from './scene3d/personnages';
import { ecarterEtiquettesDesPersonnes } from './scene3d/ecartEtiquettes';
import { brancherMarche } from './scene3d/marche';
import { ecouterTouchers } from './scene3d/toucher';
import { ficheDe } from './regles/fiche';
import { creerBulle } from './ui/bulle';
import { monterInterface } from './ui/interface';
import { monterMissions } from './ui/mission';
import { suivreProgression } from './ui/progression';
import { brancherVoix } from './ui/voix';

const contenu = chargerContenu();
const lieu = contenu.lieux[0];
const plan = lirePlan(lieu);

const centre = new THREE.Vector3(plan.largeur / 2, 0, plan.profondeur / 2);
const theatre = creerTheatre(document.querySelector<HTMLElement>('#scene')!, centre, Math.max(plan.largeur, plan.profondeur));
theatre.scene.add(construireAile(plan));
theatre.scene.add(construireMeubles(plan));
const personnages = placerPersonnages(plan, contenu.residents, contenu.personnel);
theatre.scene.add(personnages);
theatre.demanderRendu();

const racineInterface = document.querySelector<HTMLElement>('#interface')!;
monterInterface(racineInterface, lieu.nom, theatre, contenu.personnel);
const bulle = creerBulle(racineInterface, theatre);
// Les noms des personnes ne se chevauchent pas et ne passent pas sous la barre du haut.
const barre = racineInterface.querySelector<HTMLElement>('.barre')!;
ecarterEtiquettesDesPersonnes(theatre, personnages, () => barre.offsetTop + barre.offsetHeight + 4);
theatre.demanderRendu();

// Toucher ou cliquer :
// - un personnage ouvre sa bulle (nom et rôle) ;
// - le sol ferme la bulle et fait marcher l'agent joué par l'élève.
const joueur = contenu.personnel.find((p) => p.joueur);
const agent = joueur && personnages.getObjectByName(`personnage-${joueur.id}`);
const allerVers = agent ? brancherMarche(theatre, plan, agent) : undefined;

// Missions : panneau d'étape, loupe, relais et relève. Elles font marcher l'agent vers une pièce ou une personne.
// Lecture à voix haute des panneaux de mission (bouton 🔊).
brancherVoix(racineInterface);

// La progression (derniers niveaux) est gardée dans le navigateur ; le code de reprise la transporte.
const progression = suivreProgression(contenu.missions);
const missions = monterMissions(racineInterface, theatre, contenu, {
  surFin: progression.enregistrer,
  niveauxObtenus: progression.niveauxObtenus,
  basDeListe: () => progression.blocCode(() => missions.ouvrirListe()),
  allerVersZone: (idZone) => {
    const zone = trouverZone(plan, idZone);
    if (zone && allerVers) {
      const { x, z } = positionDansZone(zone, 1); // la case 0 est souvent celle du résident
      allerVers(x, z);
    }
  },
  cadrerZone: (idZone) => {
    const zone = trouverZone(plan, idZone);
    // La pièce apparaît dans le haut de l'écran, au-dessus du panneau de la mission.
    if (!zone) return;
    const cote = Math.max(...zone.cases.map((c) => Math.max(Math.abs(c.colonne + 0.5 - zone.centre.x), Math.abs(c.rangee + 0.5 - zone.centre.z)))) * 2 + 1;
    theatre.cadrer(zone.centre.x, zone.centre.z, cote, 0.1);
  },
  allerVersPersonne: (id) => {
    const personne = personnages.getObjectByName(`personnage-${id}`);
    if (personne && allerVers) allerVers(personne.position.x, personne.position.z);
  },
});

ecouterTouchers(theatre, personnages.children, ({ personnage, sol }) => {
  const id = personnage?.name.replace('personnage-', '');
  // Pendant une étape « relais », toucher un professionnel lui transmet l'information.
  if (id && missions.personneTouchee(id)) {
    bulle.fermer();
    return;
  }
  const fiche = id && ficheDe(id, contenu.residents, contenu.personnel);
  if (personnage && fiche) {
    bulle.ouvrir(personnage, fiche);
    theatre.demanderRendu();
    return;
  }
  bulle.fermer();
  if (sol && allerVers) allerVers(sol.x, sol.z);
});
