// Figurines des personnages : un corps (capsule) et une tête (sphère).
// Résidents : tenue claire et nom affiché. Personnel : couleur de tenue du métier et sigle affiché.
// Chaque figurine porte le nom « personnage-<id> » : on la retrouve avec getObjectByName (par exemple pour faire marcher l'agent).

import * as THREE from 'three';
import type { MembrePersonnel, Resident } from '../contenu/types';
import { positionDansZone, trouverZone, type PlanCalcule } from '../regles/plan';
import { etiquette } from './construireAile';

const corps = new THREE.CapsuleGeometry(0.22, 0.6, 4, 12);
const tete = new THREE.SphereGeometry(0.17, 16, 12);
const peau = new THREE.MeshLambertMaterial({ color: '#e9c9a8' });

function figurine(couleur: string, texte: string, classe: string): THREE.Group {
  const groupe = new THREE.Group();
  const c = new THREE.Mesh(corps, new THREE.MeshLambertMaterial({ color: couleur }));
  c.position.y = 0.52;
  const t = new THREE.Mesh(tete, peau);
  t.position.y = 1.08;
  groupe.add(c, t, etiquette(texte, classe, new THREE.Vector3(0, 1.45, 0)));
  return groupe;
}

export function placerPersonnages(plan: PlanCalcule, residents: Resident[], personnel: MembrePersonnel[]): THREE.Group {
  const groupe = new THREE.Group();
  groupe.name = 'personnages';
  const occupation = new Map<string, number>(); // nombre de personnes déjà posées dans chaque zone

  const poser = (objet: THREE.Object3D, id: string, idZone: string) => {
    objet.name = `personnage-${id}`;
    const zone = trouverZone(plan, idZone);
    if (!zone) return;
    const n = occupation.get(idZone) ?? 0;
    occupation.set(idZone, n + 1);
    const { x, z } = positionDansZone(zone, n * 2); // une case d'écart entre deux personnes
    objet.position.set(x, 0, z);
    groupe.add(objet);
  };

  for (const r of residents) poser(figurine('#f1efe9', `${r.civilite} ${r.nom}`, 'etiquette-resident'), r.id, r.chambre);
  for (const p of personnel) {
    const classe = p.joueur ? 'etiquette-joueur' : 'etiquette-personnel';
    poser(figurine(p.tenue, p.joueur ? 'Vous' : p.sigle, classe), p.id, p.zone_habituelle);
  }
  return groupe;
}
