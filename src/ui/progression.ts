// Sauvegarde de la progression dans le navigateur (localStorage) et bloc « code de reprise » de la liste des missions.
// Rien ne quitte l'appareil : pas de compte, pas de réseau. Pour changer d'appareil, l'élève recopie son code.
// Le calcul du code est dans src/regles/sauvegarde.ts.

import type { Mission } from '../contenu/types';
import type { Bilan } from '../regles/mission';
import { lireSequence } from '../regles/deblocage';
import { decoderCode, encoderCode, enregistrerBilan, type Progression } from '../regles/sauvegarde';

const CLE = 'glycines-progression-v1';
const CLE_SEQUENCE = 'glycines-sequence';

// Le stockage peut être interdit (navigation privée, réglages du navigateur) : le jeu marche quand même, sans mémoire.
function lire(): Progression {
  try {
    return JSON.parse(localStorage.getItem(CLE) ?? '{}') as Progression;
  } catch {
    return {};
  }
}
function ecrire(progression: Progression): void {
  ecrireTexte(CLE, JSON.stringify(progression));
}
function ecrireTexte(cle: string, valeur: string): void {
  try {
    localStorage.setItem(cle, valeur);
  } catch {
    // stockage indisponible : la valeur ne vit que pendant la partie
  }
}
function lireTexte(cle: string): string | null {
  try {
    return localStorage.getItem(cle);
  } catch {
    return null;
  }
}

export interface SuiviProgression {
  enregistrer: (bilan: Bilan) => void;
  /** « CT3.3 N3 · CT3.1 N2 » pour une mission déjà terminée, sinon undefined. */
  niveauxObtenus: (idMission: string) => string | undefined;
  /** Bloc HTML du code de reprise. `rafraichir` est appelée après une reprise réussie. */
  blocCode: (rafraichir: () => void) => HTMLElement;
  /** Séquence vue en cours. Un lien de l'enseignante peut la fixer : …/index.html?sequence=S3 */
  sequenceVue: () => string;
  changerSequence: (sequence: string) => void;
}

export function suivreProgression(missions: Mission[]): SuiviProgression {
  let progression = lire();
  // Priorité : la séquence donnée dans l'adresse, puis celle mémorisée, sinon S1.
  let sequence = lireSequence(new URLSearchParams(location.search).get('sequence')) ?? lireSequence(lireTexte(CLE_SEQUENCE)) ?? 'S1';
  ecrireTexte(CLE_SEQUENCE, sequence);

  const blocCode = (rafraichir: () => void) => {
    const bloc = document.createElement('section');
    bloc.className = 'code-reprise';
    const code = encoderCode(progression, missions);

    const titre = document.createElement('h3');
    titre.textContent = 'Code de reprise';
    const actuel = document.createElement('p');
    if (code) {
      actuel.append('Pour continuer sur un autre appareil, notez ce code : ');
      const fort = document.createElement('strong');
      fort.className = 'code-reprise__code';
      fort.textContent = code;
      actuel.append(fort);
    } else {
      actuel.textContent = 'Terminez une mission pour obtenir un code.';
    }

    const formulaire = document.createElement('form');
    formulaire.className = 'code-reprise__formulaire';
    const etiquette = document.createElement('label');
    etiquette.textContent = 'Vous avez déjà un code ?';
    const champ = document.createElement('input');
    champ.name = 'code';
    champ.autocomplete = 'off';
    champ.autocapitalize = 'characters';
    champ.spellcheck = false;
    champ.placeholder = 'M00-332.K7';
    etiquette.append(champ);
    const bouton = document.createElement('button');
    bouton.type = 'submit';
    bouton.className = 'bouton bouton--texte';
    bouton.textContent = 'Reprendre';
    const message = document.createElement('p');
    message.className = 'code-reprise__message';
    message.setAttribute('role', 'status');
    formulaire.append(etiquette, bouton, message);
    formulaire.addEventListener('submit', (evenement) => {
      evenement.preventDefault();
      const resultat = decoderCode(champ.value, missions);
      if ('erreur' in resultat) {
        message.textContent = resultat.erreur;
        return;
      }
      progression = { ...progression, ...resultat.progression };
      ecrire(progression);
      rafraichir();
    });

    bloc.append(titre, actuel, formulaire);
    return bloc;
  };

  return {
    enregistrer: (bilan) => {
      progression = enregistrerBilan(progression, bilan);
      ecrire(progression);
    },
    niveauxObtenus: (id) => {
      const niveaux = progression[id];
      return niveaux && Object.entries(niveaux).map(([code, n]) => `${code} ${n}`).join(' · ');
    },
    blocCode,
    sequenceVue: () => sequence,
    changerSequence: (s) => {
      sequence = lireSequence(s) ?? sequence;
      ecrireTexte(CLE_SEQUENCE, sequence);
    },
  };
}
