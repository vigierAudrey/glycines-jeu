// Construit le décor 3D à partir du plan calculé (src/regles/plan.ts).
// Ce fichier ne contient aucune donnée : changer la grille dans content/lieux/aile-b.json suffit à changer le décor.

import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import type { Mur, PlanCalcule, Porte } from '../regles/plan';
import type { TypeZone } from '../contenu/types';

const EPAISSEUR_SOL = 0.1;
const HAUTEUR_MUR = 0.9; // murs bas, « coupés » : on voit l'intérieur des pièces comme sur une maquette
const EPAISSEUR_MUR = 0.1;

export function construireAile(plan: PlanCalcule): THREE.Group {
  const aile = new THREE.Group();
  aile.name = 'aile';

  // ---------- Sols ----------
  // Une « instance » par case : la carte graphique dessine toutes les cases d'une zone en une seule fois.
  const geometrieCase = new THREE.BoxGeometry(0.98, EPAISSEUR_SOL, 0.98);
  const matrice = new THREE.Matrix4();
  for (const zone of plan.zones) {
    const materiau = new THREE.MeshLambertMaterial({ color: zone.couleur, map: textureDeSol(zone.type) });
    const sols = new THREE.InstancedMesh(geometrieCase, materiau, zone.cases.length);
    sols.name = `sol-${zone.id}`;
    zone.cases.forEach((c, i) => {
      matrice.makeTranslation(c.colonne + 0.5, -EPAISSEUR_SOL / 2, c.rangee + 0.5);
      sols.setMatrixAt(i, matrice);
    });
    aile.add(sols);

    if (['chambre', 'collectif', 'service', 'exterieur'].includes(zone.type)) {
      aile.add(etiquette(zone.nom, `etiquette-piece etiquette-piece--${zone.type}`, new THREE.Vector3(zone.centre.x, 0.05, zone.centre.z)));
    }
  }

  // ---------- Murs ----------
  const geometrieMur = new THREE.BoxGeometry(1 + EPAISSEUR_MUR, HAUTEUR_MUR, EPAISSEUR_MUR);
  const murs = new THREE.InstancedMesh(geometrieMur, new THREE.MeshLambertMaterial({ color: '#fbfaf7' }), plan.murs.length);
  murs.name = 'murs';
  const quartDeTour = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
  const sansRotation = new THREE.Quaternion();
  const unite = new THREE.Vector3(1, 1, 1);
  plan.murs.forEach((m, i) => {
    const rotation = m.orientation === 'le-long-de-z' ? quartDeTour : sansRotation;
    matrice.compose(new THREE.Vector3(m.x, HAUTEUR_MUR / 2, m.z), rotation, unite);
    murs.setMatrixAt(i, matrice);
  });
  aile.add(murs);

  // ---------- Fenêtres ----------
  // Une fenêtre sur un mur extérieur sur deux, pour varier le rythme de la façade sans surcharger la vue.
  plan.murs
    .filter((m, i) => m.exterieur && i % 2 === 0)
    .forEach((m) => aile.add(fenetre(m)));

  // ---------- Portes ----------
  for (const porte of plan.portes) aile.add(porteEntrouverte(porte));

  return aile;
}

// ---------- Sols texturés ----------
// Une texture par type de pièce, dessinée une seule fois sur un canevas puis répétée sur chaque case.
// Elle reste proche du blanc : la couleur de la zone (son pastel propre) vient se multiplier par-dessus.
const texturesParType = new Map<TypeZone, THREE.Texture | undefined>();

function textureDeSol(type: TypeZone): THREE.Texture | undefined {
  if (!texturesParType.has(type)) texturesParType.set(type, dessinerTexture(type));
  return texturesParType.get(type);
}

function dessinerTexture(type: TypeZone): THREE.Texture | undefined {
  const taille = 128;
  const canevas = document.createElement('canvas');
  canevas.width = taille;
  canevas.height = taille;
  const ctx = canevas.getContext('2d');
  if (!ctx) return undefined;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, taille, taille);

  if (type === 'chambre' || type === 'collectif') {
    // Parquet : lames horizontales, joints décalés d'une lame à l'autre.
    const hauteurLame = taille / 5;
    ctx.strokeStyle = 'rgba(80, 60, 30, 0.12)';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 5; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * hauteurLame);
      ctx.lineTo(taille, i * hauteurLame);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(80, 60, 30, 0.08)';
    for (let i = 0; i < 5; i++) {
      const decalage = i % 2 === 0 ? 0 : taille / 2;
      ctx.beginPath();
      ctx.moveTo(decalage, i * hauteurLame);
      ctx.lineTo(decalage, (i + 1) * hauteurLame);
      ctx.stroke();
    }
  } else if (type === 'service' || type === 'circulation') {
    // Carrelage : une grille de carreaux avec un joint clair.
    const cote = taille / 4;
    ctx.strokeStyle = 'rgba(60, 60, 60, 0.12)';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 4; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cote, 0);
      ctx.lineTo(i * cote, taille);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cote);
      ctx.lineTo(taille, i * cote);
      ctx.stroke();
    }
  } else if (type === 'exterieur') {
    // Dallage extérieur : mouchetis irrégulier (bruit déterministe, pas de dépendance ajoutée).
    let graine = 7;
    const hasard = () => {
      graine = (graine * 16807) % 2147483647;
      return graine / 2147483647;
    };
    for (let i = 0; i < 90; i++) {
      ctx.fillStyle = `rgba(40, 60, 30, ${0.05 + hasard() * 0.08})`;
      ctx.beginPath();
      ctx.arc(hasard() * taille, hasard() * taille, 1.5 + hasard() * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    return undefined; // porte : pas de texture, une case trop petite pour que ça se voie
  }

  const texture = new THREE.CanvasTexture(canevas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// ---------- Fenêtres ----------
const LARGEUR_FENETRE = 0.6;
const HAUTEUR_FENETRE = 0.45;
const materiauCadre = new THREE.MeshLambertMaterial({ color: '#fdfcf9' });
const materiauVitre = new THREE.MeshLambertMaterial({ color: '#cdeaf4', transparent: true, opacity: 0.6 });

function fenetre(m: Mur): THREE.Group {
  const groupe = new THREE.Group();
  groupe.name = 'fenetre';

  const cadre = new THREE.Mesh(new THREE.BoxGeometry(LARGEUR_FENETRE + 0.08, HAUTEUR_FENETRE + 0.08, EPAISSEUR_MUR * 1.02), materiauCadre);
  const vitre = new THREE.Mesh(new THREE.BoxGeometry(LARGEUR_FENETRE, HAUTEUR_FENETRE, EPAISSEUR_MUR * 1.1), materiauVitre);
  groupe.add(cadre, vitre);
  groupe.position.set(m.x, HAUTEUR_MUR * 0.55, m.z);
  if (m.orientation === 'le-long-de-z') groupe.rotation.y = Math.PI / 2;
  return groupe;
}

// ---------- Portes ----------
const LARGEUR_PORTE = 0.8;
const HAUTEUR_PORTE = HAUTEUR_MUR * 0.85;
const ANGLE_OUVERTURE = THREE.MathUtils.degToRad(62);
const materiauVantail = new THREE.MeshLambertMaterial({ color: '#b08763' });
const materiauMontant = new THREE.MeshLambertMaterial({ color: '#fbfaf7' });
const geometrieVantail = new THREE.BoxGeometry(LARGEUR_PORTE, HAUTEUR_PORTE, 0.05);
const geometrieMontant = new THREE.BoxGeometry(0.08, HAUTEUR_MUR, 0.08);

/** Un vantail entrouvert, posé sur un gond à l'un des bords de la case de porte, plus deux montants. */
function porteEntrouverte(p: Porte): THREE.Group {
  const groupe = new THREE.Group();
  groupe.name = 'porte';

  const vantail = new THREE.Mesh(geometrieVantail, materiauVantail);
  vantail.position.set(LARGEUR_PORTE / 2, 0, 0); // le gond (origine du pivot) reste à l'un des bouts de la case

  const pivot = new THREE.Group();
  pivot.add(vantail);
  pivot.position.y = HAUTEUR_PORTE / 2;

  if (p.orientation === 'le-long-de-x') {
    pivot.position.x = p.x - LARGEUR_PORTE / 2;
    pivot.position.z = p.z;
    pivot.rotation.y = ANGLE_OUVERTURE;
  } else {
    pivot.position.x = p.x;
    pivot.position.z = p.z - LARGEUR_PORTE / 2;
    pivot.rotation.y = Math.PI / 2 + ANGLE_OUVERTURE;
  }
  groupe.add(pivot);

  const demiLargeur = p.orientation === 'le-long-de-x' ? new THREE.Vector3(0.5, 0, 0) : new THREE.Vector3(0, 0, 0.5);
  for (const sens of [-1, 1]) {
    const montant = new THREE.Mesh(geometrieMontant, materiauMontant);
    montant.position.set(p.x + demiLargeur.x * sens, HAUTEUR_MUR / 2, p.z + demiLargeur.z * sens);
    groupe.add(montant);
  }

  return groupe;
}

/** Crée une étiquette HTML accrochée à un point de la scène 3D. */
export function etiquette(texte: string, classe: string, position: THREE.Vector3): CSS2DObject {
  const element = document.createElement('div');
  element.className = classe;
  element.textContent = texte;
  const objet = new CSS2DObject(element);
  objet.position.copy(position);
  return objet;
}
