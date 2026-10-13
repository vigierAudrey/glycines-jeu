// Marche de l'agent (« Vous ») : toucher une case du sol l'y fait aller à pied, sans traverser les murs.
// Le chemin est calculé par les règles (src/regles/chemin.ts) ; ici on ne fait que l'animer.

import * as THREE from 'three';
import { caseEn, centreDe, trouverChemin } from '../regles/chemin';
import type { PlanCalcule } from '../regles/plan';
import type { Theatre } from './creerScene';
import { ecouterTouchersDuSol } from './toucher';

const VITESSE = 2.5; // mètres par seconde

export function brancherMarche(theatre: Theatre, plan: PlanCalcule, agent: THREE.Object3D): void {
  // Repère posé sur la case visée, pour montrer que le toucher a été compris.
  const repere = new THREE.Mesh(new THREE.RingGeometry(0.22, 0.36, 32), new THREE.MeshBasicMaterial({ color: '#7b5ea7' }));
  repere.rotation.x = -Math.PI / 2; // à plat sur le sol
  repere.visible = false;
  theatre.scene.add(repere);

  let etapes: { x: number; z: number }[] = []; // centres des cases qui restent à parcourir
  let enMarche = false;

  // Appelée à chaque image par la boucle d'animation : l'agent avance de VITESSE × temps écoulé.
  const avancer = (secondes: number): boolean => {
    let reste = VITESSE * secondes;
    while (reste > 0 && etapes.length > 0) {
      const cible = etapes[0];
      const dx = cible.x - agent.position.x;
      const dz = cible.z - agent.position.z;
      const distance = Math.hypot(dx, dz);
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
    if (etapes.length > 0) return true;
    enMarche = false;
    repere.visible = false;
    return false; // arrivé : la boucle d'animation peut s'arrêter
  };

  ecouterTouchersDuSol(theatre, (x, z) => {
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
      theatre.animer(avancer);
    }
  });
}
