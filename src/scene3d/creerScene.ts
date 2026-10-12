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

// Hauteur de la caméra : 35,26° au-dessus du sol donne une vraie vue isométrique.
const ELEVATION = THREE.MathUtils.degToRad(35.264);
const DISTANCE = 40;

export interface Theatre {
  scene: THREE.Scene;
  /** Demande un nouveau dessin (le jeu ne redessine que lorsque quelque chose change, pour économiser la batterie). */
  demanderRendu: () => void;
  /** Tourne la vue d'un quart de tour : +1 sens horaire, -1 sens inverse. */
  tourner: (sens: 1 | -1) => void;
  /** Recentre la vue sur un point du plan et règle le zoom initial. */
  recentrer: () => void;
}

export function creerTheatre(conteneur: HTMLElement, centre: THREE.Vector3, tailleDuPlan: number): Theatre {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#f6f3ee');

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
  const dessiner = () => {
    renduPrevu = false;
    majDensite();
    rendu.render(scene, camera);
    renduEtiquettes.render(scene, camera);
  };
  const demanderRendu = () => {
    if (!renduPrevu) {
      renduPrevu = true;
      requestAnimationFrame(dessiner);
    }
  };
  controles.addEventListener('change', demanderRendu);

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

  recentrer();
  ajusterTaille();
  return { scene, demanderRendu, tourner, recentrer };
}
