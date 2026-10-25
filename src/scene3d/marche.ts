// Marche de l'agent (« Vous ») : il va à pied jusqu'à une case du sol, sans traverser les murs.
// Le chemin est calculé par les règles (src/regles/chemin.ts) ; ici on ne fait que l'animer.
// C'est main.ts qui décide quand marcher (un toucher du sol, mais pas un toucher de personnage).

import * as THREE from 'three';
import { caseEn, centreDe, trouverChemin } from '../regles/chemin';
import type { PlanCalcule } from '../regles/plan';
import type { Theatre } from './creerScene';
import { poserMarche } from './personnages';

const VITESSE = 2.5; // mètres par seconde
const FOULEE = 7; // radians de balancement par mètre parcouru : environ un pas tous les 45 cm
const VIRAGE = 12; // vitesse à laquelle l'agent se tourne vers où il va

/** Prépare la marche de l'agent et renvoie la fonction qui le fait aller jusqu'au point (x, z) du sol. */
export function brancherMarche(theatre: Theatre, plan: PlanCalcule, agent: THREE.Object3D): (x: number, z: number) => void {
  // Repère posé sur la case visée, pour montrer que le toucher a été compris.
  const repere = new THREE.Mesh(new THREE.RingGeometry(0.22, 0.36, 32), new THREE.MeshBasicMaterial({ color: '#7b5ea7' }));
  repere.rotation.x = -Math.PI / 2; // à plat sur le sol
  repere.visible = false;
  theatre.scene.add(repere);

  let etapes: { x: number; z: number }[] = []; // centres des cases qui restent à parcourir
  let enMarche = false;
  let phase = 0; // avancée du balancement des bras et des jambes

  // L'agent se tourne en douceur vers sa direction de marche (par le plus court côté).
  const tourner = (angleVise: number, secondes: number) => {
    let ecart = angleVise - agent.rotation.y;
    ecart = Math.atan2(Math.sin(ecart), Math.cos(ecart)); // ramène l'écart entre -π et π
    agent.rotation.y += ecart * Math.min(1, VIRAGE * secondes);
  };

  // Appelée à chaque image par la boucle d'animation : l'agent avance de VITESSE × temps écoulé.
  const avancer = (secondes: number): boolean => {
    let reste = VITESSE * secondes;
    while (reste > 0 && etapes.length > 0) {
      const cible = etapes[0];
      const dx = cible.x - agent.position.x;
      const dz = cible.z - agent.position.z;
      const distance = Math.hypot(dx, dz);
      if (distance > 1e-6) tourner(Math.atan2(dx, dz), secondes);
      phase += Math.min(distance, reste) * FOULEE;
      if (distance <= reste) {
        agent.position.set(cible.x, 0, cible.z); // case atteinte, on passe à la suivante
        etapes.shift();
        reste -= distance;
      } else {
        agent.position.x += (dx / distance) * reste;
        agent.position.z += (dz / distance) * reste;
        reste = 0;
      }
    }
    if (etapes.length > 0) {
      poserMarche(agent, phase, 1);
      return true;
    }
    poserMarche(agent, 0, 0); // arrivé : jambes et bras au repos
    phase = 0;
    enMarche = false;
    agent.userData.enMarche = false; // la respiration (personnages.ts) peut reprendre
    repere.visible = false;
    return false; // arrivé : la boucle d'animation peut s'arrêter
  };

  return (x, z) => {
    const chemin = trouverChemin(plan, caseEn(agent.position.x, agent.position.z), caseEn(x, z));
    if (!chemin) return; // mur, vide ou pièce fermée : l'agent ne bouge pas

    // La première case du chemin est celle où se trouve déjà l'agent : on file directement vers la suivante.
    etapes = chemin.map(centreDe);
    if (etapes.length > 1) etapes.shift();

    const arrivee = etapes[etapes.length - 1];
    repere.position.set(arrivee.x, 0.01, arrivee.z);
    repere.visible = true;

    // La caméra accompagne l'agent (même si l'élève avait fait glisser la vue ailleurs).
    theatre.suivre(agent);

    // Si l'agent marchait déjà, l'animation en cours reprend simplement le nouveau chemin.
    if (!enMarche) {
      enMarche = true;
      agent.userData.enMarche = true; // suspend la respiration (personnages.ts) pendant la marche
      theatre.animer(avancer);
    }
  };
}
