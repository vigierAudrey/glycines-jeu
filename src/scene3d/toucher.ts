// Toucher (doigt) ou cliquer (souris) un point du sol ou un personnage.
//
// Deux gestes partagent le même écran :
// - glisser = déplacer la vue (géré par les contrôles de caméra, voir creerScene.ts) ;
// - toucher bref = désigner un personnage ou une case du sol.
// Un geste compte comme un « toucher » s'il est court, bouge à peine et n'utilise qu'un seul doigt.
// Sinon c'est un glisser ou un pincement, et on ne fait rien ici.
//
// Raycasting : pour savoir quel point du sol est sous le doigt, on lance un rayon depuis la caméra,
// à travers le pixel touché, et on calcule où ce rayon rencontre le plan du sol (hauteur 0).
//
// Personnages : une figurine fait à peine 10 px de large sur un téléphone, trop petit pour un doigt.
// On travaille donc à l'écran : on projette chaque personnage (des pieds au haut de son étiquette)
// et on regarde si le doigt est à moins de RAYON_PERSONNAGE_PX de ce trait. Cela fait une cible d'au moins 44 px.

import * as THREE from 'three';
import type { Theatre } from './creerScene';

const DEPLACEMENT_MAX_PX = 10; // au-delà, le doigt a glissé
const DUREE_MAX_MS = 500; // au-delà, c'est un appui long, pas un toucher
const RAYON_PERSONNAGE_PX = 24; // tolérance autour d'un personnage
const HAUT_PERSONNAGE = 1.6; // en mètres : le haut de l'étiquette au-dessus de la tête

/** Ce que l'élève a touché : un personnage (prioritaire) et/ou un point du sol. */
export interface Toucher {
  personnage: THREE.Object3D | null;
  sol: { x: number; z: number } | null;
}

/** Distance en pixels entre le point p et le segment [a, b] à l'écran. */
function distanceAuSegment(p: THREE.Vector2, a: THREE.Vector2, b: THREE.Vector2): number {
  const ab = b.clone().sub(a);
  const longueur2 = ab.lengthSq();
  const t = longueur2 === 0 ? 0 : THREE.MathUtils.clamp(p.clone().sub(a).dot(ab) / longueur2, 0, 1);
  return p.distanceTo(a.clone().addScaledVector(ab, t));
}

export function ecouterTouchers(theatre: Theatre, personnages: THREE.Object3D[], quandToucher: (toucher: Toucher) => void): void {
  const surface = theatre.surfaceTactile;
  const sol = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // le plan horizontal y = 0
  const rayon = new THREE.Raycaster();
  const pointEcran = new THREE.Vector2();
  const pointSol = new THREE.Vector3();

  // Position à l'écran (en pixels, dans le cadre de la surface) d'un point du monde 3D.
  const versPixels = (point: THREE.Vector3, cadre: DOMRect) => {
    point.project(theatre.camera); // coordonnées de -1 à +1
    return new THREE.Vector2(((point.x + 1) / 2) * cadre.width, ((1 - point.y) / 2) * cadre.height);
  };

  // Personnage le plus proche du doigt, s'il est assez proche.
  const personnageSous = (doigt: THREE.Vector2, cadre: DOMRect): THREE.Object3D | null => {
    let meilleur: THREE.Object3D | null = null;
    let distanceMin = RAYON_PERSONNAGE_PX;
    for (const personnage of personnages) {
      const pieds = versPixels(personnage.position.clone(), cadre);
      const haut = versPixels(personnage.position.clone().setY(HAUT_PERSONNAGE), cadre);
      const distance = distanceAuSegment(doigt, pieds, haut);
      if (distance < distanceMin) {
        distanceMin = distance;
        meilleur = personnage;
      }
    }
    return meilleur;
  };

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

    const cadre = surface.getBoundingClientRect();
    const personnage = personnageSous(new THREE.Vector2(e.clientX - cadre.left, e.clientY - cadre.top), cadre);

    // Position du doigt convertie en coordonnées de -1 à +1 (le format attendu par le raycaster).
    pointEcran.set(((e.clientX - cadre.left) / cadre.width) * 2 - 1, -((e.clientY - cadre.top) / cadre.height) * 2 + 1);
    rayon.setFromCamera(pointEcran, theatre.camera);
    const toucheSol = rayon.ray.intersectPlane(sol, pointSol) !== null;
    quandToucher({ personnage, sol: toucheSol ? { x: pointSol.x, z: pointSol.z } : null });
  };
  surface.addEventListener('pointerup', lever);
  surface.addEventListener('pointercancel', lever);
}
