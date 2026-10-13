// Figurines des personnages, en « low-poly » : des formes simples à facettes (peu de triangles, léger sur téléphone).
// Chaque figurine a des jambes, un buste, des bras, une tête avec des yeux, une coiffure, parfois des lunettes.
// - Résidents : gilet de couleur, pantalon gris, silhouette un peu voûtée, nom affiché.
// - Personnel : tunique de la couleur du métier, pantalon clair, sigle affiché.
// L'apparence (peau, cheveux, coiffure, lunettes) vient de content/personnages/ : rien n'est écrit en dur ici.
// Chaque figurine porte le nom « personnage-<id> » : on la retrouve avec getObjectByName (par exemple pour faire marcher l'agent).
// La figurine regarde vers +z ; on la tourne avec rotation.y.

import * as THREE from 'three';
import type { Apparence, MembrePersonnel, Resident } from '../contenu/types';
import { positionDansZone, trouverZone, type PlanCalcule } from '../regles/plan';
import { etiquette } from './construireAile';

const APPARENCE_PAR_DEFAUT: Apparence = { peau: '#e9c9a8', cheveux: '#8a7a6a', coiffure: 'court' };
const PANTALON_RESIDENT = '#7d8494';
const PANTALON_PERSONNEL = '#f1f0ec';
const YEUX = '#2b2522';

// Un matériau par couleur, partagé : moins de travail pour la carte graphique.
// flatShading : chaque facette a une seule teinte, c'est ce qui donne l'aspect « low-poly ».
const materiaux = new Map<string, THREE.MeshLambertMaterial>();
const matiere = (couleur: string) => {
  let m = materiaux.get(couleur);
  if (!m) {
    m = new THREE.MeshLambertMaterial({ color: couleur, flatShading: true });
    materiaux.set(couleur, m);
  }
  return m;
};

// Formes partagées entre toutes les figurines.
const FORMES = {
  jambe: new THREE.BoxGeometry(0.11, 0.5, 0.12).translate(0, -0.25, 0), // accrochée à la hanche
  buste: new THREE.CylinderGeometry(0.15, 0.19, 0.48, 6),
  bras: new THREE.BoxGeometry(0.075, 0.38, 0.085).translate(0, -0.19, 0), // accroché à l'épaule
  main: new THREE.IcosahedronGeometry(0.045, 0),
  tete: new THREE.IcosahedronGeometry(0.15, 1),
  oeil: new THREE.BoxGeometry(0.03, 0.035, 0.02),
  calotte: new THREE.SphereGeometry(0.162, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.5), // dessus de la tête
  // Cheveux de l'arrière de la tête, plus ou moins longs (phi de π à 2π : la moitié arrière).
  arriereCourt: new THREE.SphereGeometry(0.162, 8, 4, Math.PI, Math.PI, Math.PI * 0.45, Math.PI * 0.2),
  arriereCarre: new THREE.SphereGeometry(0.168, 8, 4, Math.PI, Math.PI, Math.PI * 0.4, Math.PI * 0.33),
  arriereLong: new THREE.CylinderGeometry(0.15, 0.13, 0.32, 6, 1, true, Math.PI * 0.5, Math.PI),
  chignon: new THREE.IcosahedronGeometry(0.07, 0),
  queue: new THREE.ConeGeometry(0.05, 0.22, 5),
  verre: new THREE.TorusGeometry(0.038, 0.009, 4, 8),
  pont: new THREE.BoxGeometry(0.035, 0.008, 0.008),
};

function maillage(forme: THREE.BufferGeometry, couleur: string, x = 0, y = 0, z = 0): THREE.Mesh {
  const m = new THREE.Mesh(forme, matiere(couleur));
  m.position.set(x, y, z);
  return m;
}

/** Cheveux selon la coiffure. Ils sont posés sur la tête (centre de la tête = origine). */
function coiffure(a: Apparence): THREE.Group {
  const g = new THREE.Group();
  const c = a.cheveux;
  if (a.coiffure === 'degarni') {
    g.add(maillage(FORMES.arriereCourt, c)); // couronne de cheveux à l'arrière, dessus dégarni
    return g;
  }
  const calotte = maillage(FORMES.calotte, c, 0, 0.005, -0.012);
  calotte.rotation.x = -0.25; // la frange dégage le front
  g.add(calotte);
  switch (a.coiffure) {
    case 'court':
      g.add(maillage(FORMES.arriereCourt, c));
      break;
    case 'carre':
      g.add(maillage(FORMES.arriereCarre, c));
      break;
    case 'long':
      g.add(maillage(FORMES.arriereCarre, c), maillage(FORMES.arriereLong, c, 0, -0.17, -0.02));
      break;
    case 'queue': {
      g.add(maillage(FORMES.arriereCourt, c));
      const q = maillage(FORMES.queue, c, 0, -0.04, -0.2);
      q.rotation.x = -2.5; // pointe vers le bas, derrière la tête
      g.add(q);
      break;
    }
    case 'chignon':
      g.add(maillage(FORMES.arriereCourt, c), maillage(FORMES.chignon, c, 0, 0.08, -0.15));
      break;
  }
  return g;
}

/** Les parties qui bougent pendant la marche, gardées pour les animer. */
interface Membres {
  jambes: [THREE.Object3D, THREE.Object3D];
  bras: [THREE.Object3D, THREE.Object3D];
  corps: THREE.Object3D;
}

function figurine(a: Apparence, haut: string, pantalon: string, agee: boolean, texte: string, classe: string): THREE.Group {
  const groupe = new THREE.Group();
  const corps = new THREE.Group(); // tout sauf l'étiquette : c'est lui qui « rebondit » pendant la marche
  groupe.add(corps);

  // Jambes, accrochées aux hanches (y = 0,5) pour pouvoir pivoter.
  const jambes = [-0.07, 0.07].map((x) => {
    const j = maillage(FORMES.jambe, pantalon, x, 0.5, 0);
    corps.add(j);
    return j;
  }) as [THREE.Mesh, THREE.Mesh];

  // Buste : il porte les bras et la tête. Chez une personne âgée, il est un peu penché vers l'avant.
  const buste = new THREE.Group();
  buste.position.y = 0.5;
  if (agee) buste.rotation.x = 0.14;
  corps.add(buste);
  buste.add(maillage(FORMES.buste, haut, 0, 0.24, 0));

  const bras = [-1, 1].map((cote) => {
    const epaule = new THREE.Group();
    epaule.position.set(cote * 0.2, 0.45, 0);
    epaule.rotation.z = cote * 0.08; // bras légèrement écartés
    if (agee) epaule.rotation.x = -0.2; // bras un peu en avant
    epaule.add(maillage(FORMES.bras, haut), maillage(FORMES.main, a.peau, 0, -0.41, 0));
    buste.add(epaule);
    return epaule;
  }) as [THREE.Group, THREE.Group];

  // Tête, yeux, cheveux, lunettes.
  const tete = new THREE.Group();
  tete.position.y = 0.62;
  buste.add(tete);
  tete.add(maillage(FORMES.tete, a.peau));
  for (const x of [-0.05, 0.05]) tete.add(maillage(FORMES.oeil, YEUX, x, 0.01, 0.138));
  tete.add(coiffure(a));
  if (a.lunettes) {
    for (const x of [-0.052, 0.052]) tete.add(maillage(FORMES.verre, YEUX, x, 0.01, 0.15));
    tete.add(maillage(FORMES.pont, YEUX, 0, 0.012, 0.15));
  }

  if (agee) corps.scale.setScalar(0.95);
  groupe.userData.membres = { jambes, bras, corps } satisfies Membres;
  groupe.add(etiquette(texte, classe, new THREE.Vector3(0, 1.45, 0)));
  return groupe;
}

/**
 * Pose de marche : `phase` avance avec la distance parcourue (un pas = une demi-période),
 * `intensite` va de 0 (immobile) à 1 (marche franche). Bras et jambes se balancent en sens opposé.
 */
export function poserMarche(figurine: THREE.Object3D, phase: number, intensite: number): void {
  const m = figurine.userData.membres as Membres | undefined;
  if (!m) return;
  const balancement = Math.sin(phase) * 0.55 * intensite;
  m.jambes[0].rotation.x = balancement;
  m.jambes[1].rotation.x = -balancement;
  m.bras[0].rotation.x = -balancement * 0.8;
  m.bras[1].rotation.x = balancement * 0.8;
  m.corps.position.y = Math.abs(Math.sin(phase)) * 0.03 * intensite; // petit rebond à chaque pas
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
    objet.rotation.y = Math.PI / 4; // tourné vers la caméra de départ
    groupe.add(objet);
  };

  for (const r of residents) {
    const a = r.apparence ?? APPARENCE_PAR_DEFAUT;
    poser(figurine(a, a.haut ?? '#f1efe9', PANTALON_RESIDENT, true, `${r.civilite} ${r.nom}`, 'etiquette-resident'), r.id, r.chambre);
  }
  for (const p of personnel) {
    const classe = p.joueur ? 'etiquette-joueur' : 'etiquette-personnel';
    poser(figurine(p.apparence ?? APPARENCE_PAR_DEFAUT, p.tenue, PANTALON_PERSONNEL, false, p.joueur ? 'Vous' : p.sigle, classe), p.id, p.zone_habituelle);
  }
  return groupe;
}
