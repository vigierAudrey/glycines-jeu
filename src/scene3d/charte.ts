// Charte visuelle « Repères nets » (choisie par Audrey, voir docs/DECISIONS.md D-020) :
// fond gris bleuté, murs blancs, contours foncés comme un dessin, objets importants en couleurs franches.
// Toutes les couleurs du décor 3D sont ici : changer de charte = changer ce fichier (et src/style.css pour l'interface).

import * as THREE from 'three';

export const CHARTE = {
  fond: '#eef1f5',
  contour: '#2a2f3a', // traits des murs, des meubles et des personnages
  joint: '#b4bccb', // traits entre les cases du sol, plus discrets
  mur: '#ffffff',
  // Meubles
  blanc: '#ffffff',
  drap: '#dfe6f1',
  metal: '#8e97a6',
  cadreLit: '#3d4656',
  fauteuil: '#e07a2e', // orange : un objet qu'on doit remarquer (freins, transferts)
  chrome: '#6d7684',
  sonnette: '#d64545',
  // Personnages
  peau: '#e2b48c',
  tenueResident: '#ffffff',
} as const;

const materiauContour = new THREE.LineBasicMaterial({ color: CHARTE.contour });
const materiauJoint = new THREE.LineBasicMaterial({ color: CHARTE.joint });

/**
 * Dessine les arêtes d'une même forme posée à plusieurs endroits (murs, cases du sol) en UN seul objet :
 * la carte graphique trace tous les traits d'un coup, ce qui reste léger sur téléphone.
 * `seulementLeDessus` ne garde que les arêtes du haut (pour les cases du sol).
 */
export function aretesGroupees(forme: THREE.BufferGeometry, matrices: THREE.Matrix4[], discret = false, seulementLeDessus = false): THREE.LineSegments {
  const aretes = new THREE.EdgesGeometry(forme);
  const source = aretes.getAttribute('position');
  const haut = forme.boundingBox ?? (forme.computeBoundingBox(), forme.boundingBox!);
  const points: number[] = [];
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  for (const matrice of matrices) {
    for (let i = 0; i < source.count; i += 2) {
      a.fromBufferAttribute(source, i);
      b.fromBufferAttribute(source, i + 1);
      if (seulementLeDessus && (a.y < haut.max.y - 1e-4 || b.y < haut.max.y - 1e-4)) continue;
      a.applyMatrix4(matrice);
      b.applyMatrix4(matrice);
      points.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
  }
  const geometrie = new THREE.BufferGeometry();
  geometrie.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  return new THREE.LineSegments(geometrie, discret ? materiauJoint : materiauContour);
}

/** Ajoute un contour foncé aux arêtes de chaque boîte d'un objet (meubles). */
export function contourner(objet: THREE.Object3D): void {
  const maillages: THREE.Mesh[] = [];
  objet.traverse((o) => {
    if (o instanceof THREE.Mesh && o.geometry instanceof THREE.BoxGeometry) maillages.push(o);
  });
  for (const m of maillages) m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), materiauContour));
}

/**
 * Contour d'une forme arrondie (personnage) : on dessine derrière elle une copie un peu plus grosse,
 * foncée et vue « de l'intérieur ». Il n'en dépasse qu'un liseré, comme un trait de crayon.
 */
const materiauLisere = new THREE.MeshBasicMaterial({ color: CHARTE.contour, side: THREE.BackSide });
export function lisere(maillage: THREE.Mesh, epaisseur = 0.035): THREE.Mesh {
  const copie = new THREE.Mesh(maillage.geometry, materiauLisere);
  copie.position.copy(maillage.position);
  maillage.geometry.computeBoundingSphere();
  const rayon = maillage.geometry.boundingSphere!.radius;
  copie.scale.setScalar(1 + epaisseur / rayon);
  return copie;
}
