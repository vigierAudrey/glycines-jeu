// Le « théâtre » 3D : la scène, la caméra isométrique, l'éclairage et les contrôles (souris et doigts).
//
// Vocabulaire :
// - scène : la boîte qui contient tous les objets 3D ;
// - caméra orthographique : une caméra sans perspective (les objets lointains ne rapetissent pas),
//   c'est ce qui donne l'aspect « plan isométrique » ;
// - rendu : le dessin d'une image de la scène vue par la caméra.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { CHARTE } from './charte';

// Hauteur de la caméra : 35,26° au-dessus du sol donne une vraie vue isométrique.
const ELEVATION = THREE.MathUtils.degToRad(35.264);
const DISTANCE = 40;
// Souplesse du suivi de l'agent : plus le nombre est grand, plus la caméra le rattrape vite.
const SOUPLESSE_SUIVI = 3;

/**
 * Une animation est appelée à chaque image avec le temps écoulé depuis l'image précédente (en secondes).
 * Elle renvoie true pour continuer, false quand elle a fini.
 */
export type Animation = (secondes: number) => boolean;

export interface Theatre {
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  /** Élément HTML qui reçoit les gestes (souris, doigts) au-dessus de la 3D. */
  surfaceTactile: HTMLElement;
  /** Demande un nouveau dessin (le jeu ne redessine que lorsque quelque chose change, pour économiser la batterie). */
  demanderRendu: () => void;
  /** Tourne la vue d'un quart de tour : +1 sens horaire, -1 sens inverse. */
  tourner: (sens: 1 | -1) => void;
  /** Recentre la vue sur un point du plan et règle le zoom initial. */
  recentrer: () => void;
  /** Lance une animation : le jeu redessine en continu tant qu'au moins une animation tourne. */
  animer: (animation: Animation) => void;
  /** La vue glisse en douceur pour garder cet objet (l'agent) au centre, jusqu'à ce qu'il s'arrête ou que l'élève fasse glisser la vue. */
  suivre: (objet: THREE.Object3D) => void;
  /**
   * Amène la vue en douceur sur le point (x, z) du sol, avec un zoom qui montre bien une pièce de `largeur` mètres de côté.
   * `remonter` (de 0 à 0,5) fait apparaître le point plus haut à l'écran, pour laisser la place au panneau du bas.
   */
  cadrer: (x: number, z: number, largeur: number, remonter?: number) => void;
  /** Position à l'écran, en pixels depuis le coin haut gauche de la vue, d'un point du monde 3D. */
  versEcran: (point: THREE.Vector3) => { x: number; y: number };
  /** Appelle cette fonction après chaque dessin (pour qu'un élément HTML suive un objet de la 3D). */
  apresChaqueRendu: (fonction: () => void) => void;
}

export function creerTheatre(conteneur: HTMLElement, centre: THREE.Vector3, tailleDuPlan: number): Theatre {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(CHARTE.fond);

  // Moteur de rendu WebGL. On limite la densité de pixels à 2 : au-delà, les téléphones chauffent sans gain visible.
  const rendu = new THREE.WebGLRenderer({ antialias: true });
  rendu.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  conteneur.appendChild(rendu.domElement);

  // Second moteur de rendu, en HTML : il place les étiquettes (noms des pièces et des personnes) au-dessus de la 3D.
  // Du vrai texte HTML reste net et lisible sur téléphone, et peut être lu par un lecteur d'écran.
  const renduEtiquettes = new CSS2DRenderer();
  renduEtiquettes.domElement.className = 'calque-etiquettes';
  conteneur.appendChild(renduEtiquettes.domElement);

  const camera = new THREE.OrthographicCamera();
  camera.near = 0.1;
  camera.far = 200;

  // Éclairage simple et peu coûteux : une lumière d'ambiance ciel/sol et un « soleil ». Pas d'ombres en temps réel.
  scene.add(new THREE.HemisphereLight('#ffffff', '#b8b0a0', 2.2));
  const soleil = new THREE.DirectionalLight('#ffffff', 1.4);
  soleil.position.set(-10, 25, 15);
  scene.add(soleil);

  // Contrôles : glisser pour se déplacer, molette ou pincement pour zoomer. La rotation passe par des boutons.
  const controles = new OrbitControls(camera, renduEtiquettes.domElement);
  controles.enableRotate = false;
  controles.screenSpacePanning = false; // le déplacement reste à plat, sur le sol
  controles.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
  controles.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN };
  controles.minZoom = 0.6;
  controles.maxZoom = 4;

  // ---------- Rendu à la demande ----------
  let renduPrevu = false;
  let boucleActive = false; // vrai pendant une animation (voir plus bas)
  const apresRendu: (() => void)[] = [];
  const dessiner = () => {
    renduPrevu = false;
    majDensite();
    rendu.render(scene, camera);
    renduEtiquettes.render(scene, camera);
    for (const fonction of apresRendu) fonction();
  };
  const demanderRendu = () => {
    if (boucleActive) return; // la boucle d'animation redessine déjà à chaque image
    if (!renduPrevu) {
      renduPrevu = true;
      requestAnimationFrame(dessiner);
    }
  };
  controles.addEventListener('change', demanderRendu);

  // ---------- Boucle d'animation ----------
  // Tant qu'une animation tourne (l'agent qui marche…), on redessine à chaque image de l'écran (environ 60 fois par seconde).
  // Quand toutes les animations ont fini, la boucle s'arrête et on revient au rendu à la demande.
  const animations = new Set<Animation>();
  let instantPrecedent = 0;
  const boucle = (instant: number) => {
    // Temps écoulé depuis l'image précédente. Plafonné à 0,1 s : si l'onglet a été mis en pause, l'agent ne « saute » pas.
    const secondes = Math.min(Math.max(instant - instantPrecedent, 0) / 1000, 0.1);
    instantPrecedent = instant;
    for (const animation of [...animations]) {
      if (!animation(secondes)) animations.delete(animation);
    }
    dessiner();
    if (animations.size > 0) requestAnimationFrame(boucle);
    else boucleActive = false;
  };
  const animer = (animation: Animation) => {
    animations.add(animation);
    if (!boucleActive) {
      boucleActive = true;
      instantPrecedent = performance.now();
      requestAnimationFrame(boucle);
    }
  };

  // ---------- Densité d'affichage ----------
  // Nombre de pixels à l'écran pour 1 m du plan. Quand la vue est petite (téléphone, zoom arrière),
  // la feuille de style masque une partie des étiquettes pour qu'elles ne se chevauchent pas.
  const majDensite = () => {
    const pixelsParMetre = (conteneur.clientHeight / (camera.top - camera.bottom)) * camera.zoom;
    conteneur.dataset.densite = pixelsParMetre >= 34 ? 'forte' : pixelsParMetre >= 24 ? 'moyenne' : 'faible';
  };

  // ---------- Taille de la fenêtre ----------
  const ajusterTaille = () => {
    const { clientWidth: l, clientHeight: h } = conteneur;
    const ratio = l / h;
    // Demi-hauteur visible, choisie pour que tout le plan tienne à l'écran, en portrait comme en paysage.
    let demiHauteur = Math.max((tailleDuPlan * 0.55) / ratio, tailleDuPlan * 0.33);
    // En portrait, le plan entier serait minuscule : on zoome et l'élève fait glisser la vue.
    if (ratio < 1) demiHauteur *= 0.5;
    camera.left = -demiHauteur * ratio;
    camera.right = demiHauteur * ratio;
    camera.top = demiHauteur;
    camera.bottom = -demiHauteur;
    camera.updateProjectionMatrix();
    rendu.setSize(l, h);
    renduEtiquettes.setSize(l, h);
    demanderRendu();
  };
  new ResizeObserver(ajusterTaille).observe(conteneur);

  // ---------- Rotation par quarts de tour, animée ----------
  let angle = Math.PI / 4; // angle actuel autour de l'axe vertical
  let angleVise = angle;
  const placerCamera = () => {
    const horizontal = DISTANCE * Math.cos(ELEVATION);
    const decalage = new THREE.Vector3(horizontal * Math.cos(angle), DISTANCE * Math.sin(ELEVATION), horizontal * Math.sin(angle));
    camera.position.copy(controles.target).add(decalage);
    camera.lookAt(controles.target);
    controles.update();
  };
  const animerRotation = () => {
    const ecart = angleVise - angle;
    angle = Math.abs(ecart) < 0.01 ? angleVise : angle + ecart * 0.2;
    placerCamera();
    demanderRendu();
    if (angle !== angleVise) requestAnimationFrame(animerRotation);
  };
  const tourner = (sens: 1 | -1) => {
    angleVise += (sens * Math.PI) / 2;
    requestAnimationFrame(animerRotation);
  };

  const recentrer = () => {
    controles.target.copy(centre);
    camera.zoom = 1;
    camera.updateProjectionMatrix();
    placerCamera();
    demanderRendu();
  };

  // ---------- Suivi de l'agent ----------
  // À chaque image, le centre de la vue parcourt une fraction de l'écart qui le sépare de l'agent :
  // grande quand l'agent est loin, petite quand il est proche. C'est ce qui donne un mouvement doux.
  // Seul le centre de la vue bouge : le zoom et l'angle choisis par l'élève sont conservés.
  let suivi: THREE.Object3D | null = null;
  const centreVise = new THREE.Vector3(); // centre de la vue posé par le suivi à l'image précédente
  const positionPrecedente = new THREE.Vector3(); // position de l'agent à l'image précédente
  const animerSuivi: Animation = (secondes) => {
    // Si le centre de la vue n'est plus celui que le suivi a posé, l'élève a fait glisser la vue
    // (ou touché « Recentrer ») : on lui laisse la main.
    if (!suivi || controles.target.distanceToSquared(centreVise) > 1e-6) {
      suivi = null;
      return false;
    }
    const ecartX = suivi.position.x - controles.target.x;
    const ecartZ = suivi.position.z - controles.target.z;
    const immobile = suivi.position.equals(positionPrecedente);
    positionPrecedente.copy(suivi.position);
    if (immobile && Math.hypot(ecartX, ecartZ) < 0.02) {
      suivi = null; // l'agent est arrêté et la vue l'a rattrapé
      return false;
    }
    // Fraction calculée à partir du temps écoulé : le mouvement a la même allure sur un écran à 60 ou 120 images par seconde.
    const fraction = 1 - Math.exp(-SOUPLESSE_SUIVI * secondes);
    controles.target.x += ecartX * fraction;
    controles.target.z += ecartZ * fraction;
    centreVise.copy(controles.target);
    placerCamera();
    return true;
  };
  const suivre = (objet: THREE.Object3D) => {
    const dejaEnCours = suivi !== null;
    suivi = objet;
    centreVise.copy(controles.target);
    positionPrecedente.copy(objet.position);
    if (!dejaEnCours) animer(animerSuivi);
  };

  // ---------- Cadrage d'une pièce (missions) ----------
  const cadrer = (x: number, z: number, largeur: number, remonter = 0) => {
    suivi = null;
    // Zoom choisi pour que la pièce (vue en biais, sa diagonale fait largeur × 1,41 m) occupe environ
    // 85 % de la largeur de l'écran, ou 60 % de sa hauteur (le panneau du bas en cache une partie).
    const pixelsVoulus = Math.min(conteneur.clientWidth * 0.85, conteneur.clientHeight * 0.6) / (largeur * Math.SQRT2);
    const pixelsAuZoom1 = conteneur.clientHeight / (camera.top - camera.bottom);
    const zoomVise = THREE.MathUtils.clamp(pixelsVoulus / pixelsAuZoom1, controles.minZoom, controles.maxZoom);
    // Direction « vers le haut de l'écran », à plat sur le sol : de la caméra vers le centre de la vue.
    const avant = new THREE.Vector3().subVectors(controles.target, camera.position).setY(0).normalize();
    // Hauteur de l'écran en mètres de sol (le sol est vu en biais, d'où la division par sin(élévation)).
    const hauteurSol = (camera.top - camera.bottom) / zoomVise / Math.sin(ELEVATION);
    const vise = new THREE.Vector3(x, 0, z).addScaledVector(avant, -remonter * hauteurSol);
    const depart = controles.target.clone();
    const zoomDepart = camera.zoom;
    let t = 0;
    animer((secondes) => {
      t = Math.min(1, t + secondes / 0.6);
      const doux = t * t * (3 - 2 * t); // départ et arrivée en douceur
      controles.target.lerpVectors(depart, vise, doux);
      camera.zoom = zoomDepart + (zoomVise - zoomDepart) * doux;
      camera.updateProjectionMatrix();
      placerCamera();
      return t < 1;
    });
  };

  const projete = new THREE.Vector3();
  const versEcran = (point: THREE.Vector3) => {
    projete.copy(point).project(camera); // coordonnées de -1 à +1
    return { x: ((projete.x + 1) / 2) * conteneur.clientWidth, y: ((1 - projete.y) / 2) * conteneur.clientHeight };
  };

  recentrer();
  ajusterTaille();
  return {
    scene, camera, surfaceTactile: renduEtiquettes.domElement, demanderRendu, tourner, recentrer, animer, suivre, cadrer, versEcran,
    apresChaqueRendu: (fonction) => apresRendu.push(fonction),
  };
}
