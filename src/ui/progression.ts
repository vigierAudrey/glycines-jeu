// Sauvegarde de la progression dans le navigateur (localStorage) et bloc « code de reprise » de la liste des missions.
// Rien ne quitte l'appareil : pas de compte, pas de réseau. Pour changer d'appareil, l'élève recopie son code.
// Le calcul du code est dans src/regles/sauvegarde.ts.

import type { Mission } from '../contenu/types';
import type { Bilan } from '../regles/mission';
import { lireSequence } from '../regles/deblocage';
import { decoderCode, encoderCode, enregistrerBilan, phraseIgnorees, type Progression } from '../regles/sauvegarde';
import { lireFichierBilan } from '../regles/bilanClasse';
import { rappelsAMontrer, rappelsApresMission, type Rappel } from '../regles/consequences';

const CLE = 'glycines-progression-v1';
const CLE_SEQUENCE = 'glycines-sequence';
const CLE_RAPPELS = 'glycines-rappels-v1'; // oublis à rappeler au début d'une prochaine mission (P.12)

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
  /** Derniers niveaux obtenus par mission (pour « Mon bilan »). */
  progression: () => Progression;
  /** Rappels d'oublis venus d'autres missions : rendus une seule fois, puis effacés. */
  prendreRappels: (idMission: string) => Rappel[];
}

export function suivreProgression(missions: Mission[]): SuiviProgression {
  let progression = lire();
  let rappels: Rappel[] = [];
  try {
    const lus: unknown = JSON.parse(lireTexte(CLE_RAPPELS) ?? '[]');
    if (Array.isArray(lus)) rappels = lus as Rappel[];
  } catch {
    // valeur abîmée : on repart sans rappel
  }
  // Priorité : la séquence donnée dans l'adresse, puis celle mémorisée, sinon S1.
  let sequence = lireSequence(new URLSearchParams(location.search).get('sequence')) ?? lireSequence(lireTexte(CLE_SEQUENCE)) ?? 'S1';
  ecrireTexte(CLE_SEQUENCE, sequence);

  // Message après une reprise : la liste est redessinée, il est donc gardé ici pour le bloc suivant.
  let messageReprise = '';
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
    // Reprise : on ajoute la progression lue à celle de cet appareil, puis on redessine la liste.
    const reprendre = (lue: Progression, ignorees?: string[]) => {
      progression = { ...progression, ...lue };
      ecrire(progression);
      messageReprise = `Progression reprise. ${phraseIgnorees(ignorees)}`.trim();
      rafraichir();
    };
    formulaire.addEventListener('submit', (evenement) => {
      evenement.preventDefault();
      const resultat = decoderCode(champ.value, missions);
      if ('erreur' in resultat) {
        message.textContent = resultat.erreur;
        return;
      }
      reprendre(resultat.progression, resultat.ignorees);
    });

    // Ou avec le fichier téléchargé depuis « Mon bilan » (pratique quand l'ordinateur du lycée a tout effacé).
    const etiquetteFichier = document.createElement('label');
    etiquetteFichier.className = 'bouton bouton--texte code-reprise__fichier';
    etiquetteFichier.textContent = '📂 Reprendre avec mon fichier de bilan (.json)';
    const champFichier = document.createElement('input');
    champFichier.type = 'file';
    champFichier.accept = '.json,application/json';
    etiquetteFichier.append(champFichier);
    champFichier.addEventListener('change', async () => {
      const fichier = champFichier.files?.[0];
      champFichier.value = '';
      if (!fichier) return;
      const lu = fichier.size > 1_000_000 ? { erreur: 'Fichier trop gros.' } : lireFichierBilan(await fichier.text(), missions);
      if ('erreur' in lu) {
        message.textContent = lu.erreur;
        return;
      }
      progression = { ...progression, ...lu.bilan.progression };
      ecrire(progression);
      messageReprise = `Progression reprise. ${lu.avertissement ?? ''}`.trim();
      rafraichir();
    });

    const confirmation = document.createElement('p');
    confirmation.className = 'code-reprise__confirmation';
    confirmation.setAttribute('role', 'status');
    confirmation.textContent = messageReprise;
    confirmation.hidden = !messageReprise;
    messageReprise = '';

    const conseil = document.createElement('p');
    conseil.className = 'indice';
    conseil.textContent = "Ordinateur du lycée qui efface tout ? Reprenez avec le fichier téléchargé depuis « 📄 Mon bilan ». Pensez à le télécharger à la fin de chaque séance.";

    bloc.append(titre, confirmation, actuel, formulaire, etiquetteFichier, conseil);
    return bloc;
  };

  return {
    enregistrer: (bilan) => {
      progression = enregistrerBilan(progression, bilan);
      ecrire(progression);
      const mission = missions.find((m) => m.id === bilan.mission);
      if (mission) {
        rappels = rappelsApresMission(rappels, mission, bilan.parcours);
        ecrireTexte(CLE_RAPPELS, JSON.stringify(rappels));
      }
    },
    prendreRappels: (idMission) => {
      const montres = rappelsAMontrer(rappels, idMission);
      rappels = rappels.filter((r) => !montres.includes(r));
      ecrireTexte(CLE_RAPPELS, JSON.stringify(rappels));
      return montres;
    },
    niveauxObtenus: (id) => {
      const niveaux = progression[id];
      return niveaux && Object.entries(niveaux).map(([code, n]) => `${code} ${n}`).join(' · ');
    },
    blocCode,
    progression: () => progression,
    sequenceVue: () => sequence,
    changerSequence: (s) => {
      sequence = lireSequence(s) ?? sequence;
      ecrireTexte(CLE_SEQUENCE, sequence);
    },
  };
}
