// Toucher (doigt) ou cliquer (souris) un point du sol.
//
// Deux gestes partagent le même écran :
// - glisser = déplacer la vue (géré par les contrôles de caméra, voir creerScene.ts) ;
// - toucher bref = désigner une case du sol.
// Un geste compte comme un « toucher » s'il est court, bouge à peine et n'utilise qu'un seul doigt.
// Sinon c'est un glisser ou un pincement, et on ne fait rien ici.
//
// Raycasting : pour savoir quel point du sol est sous le doigt, on lance un rayon depuis la caméra,
// à travers le pixel touché, et on calcule où ce rayon rencontre le plan du sol (hauteur 0).

import * as THREE from 'three';
import type { Theatre } from './creerScene';

const DEPLACEMENT_MAX_PX = 10; // au-delà, le doigt a glissé
const DUREE_MAX_MS = 500; // au-delà, c'est un appui long, pas un toucher

export function ecouterTouchersDuSol(theatre: Theatre, quandToucher: (x: number, z: number) => void): void {
  const surface = theatre.surfaceTactile;
  const sol = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // le plan horizontal y = 0
  const rayon = new THREE.Raycaster();
  const pointEcran = new THREE.Vector2();
  const pointSol = new THREE.Vector3();

  const doigtsPoses = new Set<number>();
  let debut: { id: number; x: number; y: number; instant: number } | null = null;

  surface.addEventListener('pointerdown', (e) => {
    if (e.isPrimary) doigtsPoses.clear(); // premier doigt d'un nouveau geste : on oublie un éventuel doigt « perdu »
    doigtsPoses.add(e.pointerId);
    // Un deuxième doigt posé = pincement : ce n'est plus un toucher. Avec la souris, seul le bouton gauche compte.
    debut = doigtsPoses.size === 1 && e.button === 0 ? { id: e.pointerId, x: e.clientX, y: e.clientY, instant: e.timeStamp } : null;
  });

  surface.addEventListener('pointermove', (e) => {
    if (debut?.id === e.pointerId && Math.hypot(e.clientX - debut.x, e.clientY - debut.y) > DEPLACEMENT_MAX_PX) debut = null;
  });

  const lever = (e: PointerEvent) => {
    doigtsPoses.delete(e.pointerId);
    const geste = debut;
    if (geste?.id !== e.pointerId) return;
    debut = null;
    if (e.type === 'pointercancel' || e.timeStamp - geste.instant > DUREE_MAX_MS) return;

    // Position du doigt convertie en coordonnées de -1 à +1 (le format attendu par le raycaster).
    const cadre = surface.getBoundingClientRect();
    pointEcran.set(((e.clientX - cadre.left) / cadre.width) * 2 - 1, -((e.clientY - cadre.top) / cadre.height) * 2 + 1);
    rayon.setFromCamera(pointEcran, theatre.camera);
    if (rayon.ray.intersectPlane(sol, pointSol)) quandToucher(pointSol.x, pointSol.z);
  };
  surface.addEventListener('pointerup', lever);
  surface.addEventListener('pointercancel', lever);
}
