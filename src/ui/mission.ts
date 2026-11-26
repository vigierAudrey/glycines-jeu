// Interface d'une mission : liste des missions, panneau d'étape en bas de l'écran, repères de la loupe,
// jauge de confiance et relève de fin de mission.
//
// Ce fichier ne décide rien : c'est le moteur (src/regles/mission.ts) qui calcule l'état, les points et les niveaux.
// Ici on affiche l'étape en cours, on recueille la réponse de l'élève et on la transmet au moteur.
// Sécurité : tout texte venu de content/ passe par echapper() avant d'être inséré dans le HTML.

import * as THREE from 'three';
import type { Contenu, ElementObserve, Etape, Mission, NaturePhrase } from '../contenu/types';
import { bilan, demarrerMission, etapeEnCours, repondre, type Bilan, type EtatMission, type Niveau, type Reponse } from '../regles/mission';
import { dansFamille, estDebloquee, missionsAMontrer, SEQUENCES } from '../regles/deblocage';
import type { Theatre } from '../scene3d/creerScene';
import { melanger, melangerSansOrdreDeDepart } from '../regles/hasard';
import { tirerVariante } from '../regles/variantes';
import type { Rappel } from '../regles/consequences';
import { comparerEstimation, PHRASES_ECART } from '../regles/positionnement';
import { decouperAvecLexique } from '../regles/lexique';
import { bilanGlobal } from '../regles/bilanGlobal';
import { bilanEnCsv, bilanEnJson, nomDeFichier, type Eleve } from '../regles/exportBilan';
import type { Progression } from '../regles/sauvegarde';
import { echapper } from './echapper';

/** Ce que l'interface des missions demande au reste du jeu (main.ts fait le lien avec la 3D). */
export interface LiensMission {
  /** Fait marcher l'agent jusqu'à une zone ou jusqu'à une personne. */
  allerVersZone: (idZone: string) => void;
  allerVersPersonne: (id: string) => void;
  /** Cadre la vue sur une zone (pour la loupe). */
  cadrerZone: (idZone: string) => void;
  /** Appelée à la fin d'une mission, avec son bilan (pour la sauvegarde). */
  surFin?: (bilan: Bilan) => void;
  /** Contenu ajouté sous la liste des missions (code de reprise…). */
  basDeListe?: () => HTMLElement | null;
  /** Séquence de cours déjà vue par la classe (S1 à S7) et moyen de la changer. */
  sequenceVue: () => string;
  changerSequence: (sequence: string) => void;
  /** Montrer aussi les missions en brouillon (pendant le développement). */
  avecBrouillons: boolean;
  /** Niveaux déjà obtenus pour une mission, pour les afficher dans la liste. */
  niveauxObtenus?: (idMission: string) => string | undefined;
  /** Rappels d'oublis d'autres missions, montrés au début de celle-ci (P.12). */
  prendreRappels?: (idMission: string) => Rappel[];
  /** Derniers niveaux obtenus, pour « Mon bilan » (toutes les compétences). */
  progression?: () => Progression;
  /** Mode classe (?classe) : la correction attend le bouton « Révéler », pour laisser la classe débattre (P.14). */
  modeClasse?: boolean;
}

export interface InterfaceMission {
  /** Une personne a été touchée. Renvoie true si la mission s'en sert (étape « relais »). */
  personneTouchee: (id: string) => boolean;
  /** Ouvre la liste des missions (`accueil` : avec le mot de bienvenue). */
  ouvrirListe: (accueil?: boolean) => void;
  /** Lance directement une mission (lien de la page enseignante : index.html?mission=m12). Renvoie false si elle n'existe pas. */
  ouvrirMission: (id: string) => boolean;
}

const CANAUX = [
  { cle: 'verbal', titre: 'Ce que je dis', sous: 'verbal' },
  { cle: 'paraverbal', titre: 'Comment je le dis', sous: 'paraverbal : ton, débit' },
  { cle: 'non_verbal', titre: 'Ce que fait mon corps', sous: 'non-verbal : posture, regard' },
] as const;

const NOMS_DECISION = { agir: 'Agir', adapter: 'Adapter', alerter: 'Alerter' };
// Pictogrammes (P.15) : repérer le type de décision sans tout lire.
const PICTOS_DECISION = { agir: '✋', adapter: '🔄', alerter: '📣' };

export function monterMissions(racine: HTMLElement, theatre: Theatre, contenu: Contenu, liens: LiensMission): InterfaceMission {
  const noms = new Map<string, string>([
    ...contenu.residents.map((r): [string, string] => [r.id, `${r.civilite} ${r.nom}`]),
    ...contenu.personnel.map((p): [string, string] => [p.id, p.joueur ? 'Vous' : `${p.prenom} (${p.sigle})`]),
  ]);
  const residents = new Set(contenu.residents.map((r) => r.id));
  // Lexique (P.16) : les mots du métier deviennent des boutons qui ouvrent leur définition (tirée des cours).
  const lexique = contenu.lexique ?? [];
  const avecLexique = (texte: string) =>
    decouperAvecLexique(texte, lexique)
      .map((m) => (m.entree ? `<button type="button" class="mot" data-mot="${echapper(m.entree.mot)}">${echapper(m.texte)}</button>` : echapper(m.texte)))
      .join('');

  // ---------- Éléments HTML ----------
  const panneau = document.createElement('section');
  panneau.className = 'panneau';
  panneau.hidden = true;
  panneau.setAttribute('aria-live', 'polite');
  const fenetre = document.createElement('div');
  fenetre.className = 'fenetre';
  fenetre.hidden = true;
  fenetre.setAttribute('role', 'dialog');
  fenetre.setAttribute('aria-modal', 'true');
  const reperes = document.createElement('div');
  reperes.className = 'reperes';
  racine.append(reperes, panneau, fenetre);

  const bouton = document.createElement('button');
  bouton.type = 'button';
  bouton.className = 'bouton bouton--texte bouton--mission';
  bouton.textContent = 'Missions';
  bouton.addEventListener('click', () => ouvrirListe());
  racine.querySelector('.barre__actions')?.prepend(bouton);
  // « Mon bilan » toujours visible dans la barre du haut, à côté de « Missions » (exports PDF, tableur, fichier).
  if (liens.progression) {
    const boutonBilan = document.createElement('button');
    boutonBilan.type = 'button';
    boutonBilan.className = 'bouton bouton--texte bouton--mission';
    boutonBilan.textContent = '📄 Mon bilan';
    boutonBilan.addEventListener('click', () => ouvrirBilan());
    bouton.after(boutonBilan);
  }

  // ---------- État de la partie ----------
  let mission: Mission | null = null;
  let etat: EtatMission | null = null;
  // Phase d'affichage : l'intro, l'étape (l'élève répond) ou le retour (on lui explique sa réponse).
  let phase: 'intro' | 'etape' | 'retour' = 'intro';
  let rappels: Rappel[] = []; // oublis d'autres missions, montrés à l'intro
  let estimations: Record<string, Niveau> = {}; // P.13 : niveau estimé par l'élève avant la mission (facultatif)
  // N4 n'est possible que dans une mission de transfert : on ne le propose pas ailleurs.
  const niveauxPossibles = (): Niveau[] => (mission?.transfert ? ['N1', 'N2', 'N3', 'N4'] : ['N1', 'N2', 'N3']);
  let retours: string[] = [];
  let reussi = false;
  // Une question à la fois (dialogue, transmission, tri) : la question rouverte par l'élève, sinon la première sans réponse.
  let ouvert: string | null = null;
  let revele = true; // mode classe : la correction reste cachée jusqu'au bouton « Révéler »
  let aRevoir: string[] = [];
  let messageRelais = '';
  // Réponses en cours de saisie.
  let dialogue: Record<string, number> = {};
  let classements: Record<string, 'facilite' | 'gene'> = {};
  let elementOuvert: ElementObserve | null = null;
  let natures: Record<string, NaturePhrase> = {};
  let ordreAffiche: string[] = []; // protocole : éléments mélangés, dans l'ordre où ils sont montrés
  // Réponses montrées dans un ordre tiré au hasard à chaque partie (P.10), pour qu'on ne retienne pas
  // « c'est toujours la deuxième ». Le moteur reçoit toujours les indices d'origine : seul l'affichage change.
  const ordresTires = new Map<string, number[]>();
  const dansLOrdreTire = <T,>(cle: string, liste: readonly T[]): { el: T; i: number }[] => {
    let ordre = ordresTires.get(cle);
    if (!ordre || ordre.length !== liste.length) {
      ordre = melanger(liste.map((_, i) => i));
      ordresTires.set(cle, ordre);
    }
    return ordre.map((i) => ({ el: liste[i], i }));
  };
  let ordreChoisi: string[] = []; // protocole : éléments touchés par l'élève, dans l'ordre
  let choisis = new Set<string>(); // sélection : éléments cochés
  let rangements: Record<string, string> = {}; // tri : élément → catégorie
  let liensAsso: Record<string, string> = {}; // association : mot → définition choisie (ids de paires)

  const etape = (): Etape | undefined => (mission && etat ? etapeEnCours(mission, etat) : undefined);
  const residentDeLaMission = () => mission?.personnages.find((id) => residents.has(id));

  // ---------- Jauge de confiance ----------
  const jauge = () => {
    if (!mission || !etat || !mission.etapes.some((e) => e.type === 'dialogue')) return '';
    const qui = noms.get(residentDeLaMission() ?? '');
    return `
      <div class="jauge" role="meter" aria-valuemin="0" aria-valuemax="10" aria-valuenow="${etat.confiance}"
           aria-label="Confiance de ${echapper(qui ?? 'la personne')} : ${etat.confiance} sur 10">
        <span class="jauge__nom">Confiance${qui ? ` de ${echapper(qui)}` : ''}</span>
        <span class="jauge__barre"><span class="jauge__niveau" style="width:${etat.confiance * 10}%"></span></span>
      </div>`;
  };

  // ---------- Le « pourquoi » : critère officiel des compétences pas tout à fait réussies ----------
  const criteresARevoir = () => {
    if (!mission || reussi) return '';
    const lignes = mission.competences.filter((c) => aRevoir.includes(c.code));
    if (!lignes.length) return '';
    return `
      <div class="pourquoi">
        <p class="pourquoi__titre a-lire">📘 Ce qu'on attend d'un professionnel :</p>
        <ul>${lignes.map((c) => `<li class="a-lire"><strong>${echapper(c.code)}</strong> ${echapper(c.critere)}</li>`).join('')}</ul>
      </div>`;
  };

  // Pastilles numérotées pour revenir sur une question déjà répondue (transmission, tri).
  const pastilles = (ids: string[], repondu: (id: string) => boolean, courant: string | undefined) => `
    <div class="pastilles" role="group" aria-label="Questions">
      ${ids.map((id, n) => `<button type="button" class="pastille-question" aria-current="${id === courant}" data-rouvrir="${echapper(id)}" ${repondu(id) || id === courant ? '' : 'disabled'} aria-label="Question ${n + 1}${repondu(id) ? ', répondue' : ''}">${repondu(id) && id !== courant ? '✔' : n + 1}</button>`).join('')}
    </div>`;

  // ---------- Contenu du panneau selon l'étape ----------
  const contenuEtape = (e: Etape): string => {
    switch (e.type) {
      case 'dialogue': {
        const choisis = CANAUX.every((c) => dialogue[c.cle] !== undefined);
        return `
          ${e.replique ? `<p class="replique a-lire"><strong>${echapper(noms.get(e.interlocuteur) ?? '')} :</strong> « ${echapper(e.replique)} »</p>` : ''}
          ${CANAUX.map((c, n) => {
            const courant = (ouvert && CANAUX.find((x) => x.cle === ouvert)) || CANAUX.find((x) => dialogue[x.cle] === undefined);
            if (c === courant) {
              return `
            <fieldset class="canal canal--courant">
              <legend>${n + 1} / 3 · ${c.titre} <span class="canal__sous">(${c.sous})</span></legend>
              ${dansLOrdreTire(`${e.id}:${c.cle}`, e[c.cle]).map(({ el: o, i }) => `
                <button type="button" class="choix" aria-pressed="${dialogue[c.cle] === i}"
                        data-canal="${c.cle}" data-i="${i}">${echapper(o.texte)}</button>`).join('')}
            </fieldset>`;
            }
            const choix = dialogue[c.cle];
            if (choix === undefined) return '';
            return `
            <button type="button" class="resume" data-rouvrir="${c.cle}">
              <span class="resume__titre">✔ ${c.titre} :</span> ${echapper(e[c.cle][choix].texte)} <span class="resume__modifier">Modifier</span>
            </button>`;
          }).join('')}
          ${choisis && !ouvert ? `<button type="button" class="bouton bouton--principal" data-action="valider-dialogue">Je parle</button>` : ''}`;
      }
      case 'observation': {
        const total = e.elements.length;
        const faits = e.elements.filter((el) => classements[el.id]).length;
        const ouvert = elementOuvert
          ? `<div class="loupe">
               <p class="a-lire"><strong>🔍 ${echapper(elementOuvert.libelle)}</strong></p>
               <p>Pour l'activité, cela :</p>
               <div class="rangee-boutons">
                 <button type="button" class="choix" aria-pressed="${classements[elementOuvert.id] === 'facilite'}" data-classer="facilite">Facilite</button>
                 <button type="button" class="choix" aria-pressed="${classements[elementOuvert.id] === 'gene'}" data-classer="gene">Gêne</button>
               </div>
             </div>`
          : `<p class="indice">Touchez les repères 🔍 dans la pièce.</p>`;
        return `${ouvert}
          <p class="compteur">Repères classés : ${faits} / ${total}</p>
          <button type="button" class="bouton bouton--principal" data-action="valider-observation" ${faits === total ? '' : 'disabled'}>J'ai fini d'observer</button>`;
      }
      case 'decision':
        return `
          <p class="question a-lire">${avecLexique(e.question)}</p>
          ${dansLOrdreTire(e.id, e.choix).map(({ el: o, i }) => `
            <button type="button" class="choix choix--decision" data-decision="${i}">
              <span class="badge badge--${o.decision}"><span aria-hidden="true">${PICTOS_DECISION[o.decision]}</span> ${NOMS_DECISION[o.decision]}</span> ${echapper(o.texte)}
            </button>`).join('')}`;
      case 'transmission': {
        const faites = e.phrases.filter((ph) => natures[ph.id]).length;
        return `
          <p class="indice a-lire"><strong>Fait observé</strong> : ce que j'ai vu ou entendu. <strong>Jugement</strong> : un avis sur la personne. <strong>Interprétation</strong> : une cause ou une explication que je suppose.</p>
          ${(() => {
            const liste = dansLOrdreTire(e.id, e.phrases).map(({ el }) => el);
            const courant = liste.find((ph) => ph.id === ouvert) ?? liste.find((ph) => !natures[ph.id]);
            return pastilles(liste.map((ph) => ph.id), (id) => Boolean(natures[id]), courant?.id)
              + (courant ? [courant] : []).map((ph) => `
            <fieldset class="canal canal--courant">
              <legend class="a-lire">« ${echapper(ph.texte)} »</legend>
              <div class="rangee-boutons rangee-boutons--trois">
                ${(['fait', 'jugement', 'interpretation'] as const).map((n) => `
                  <button type="button" class="choix" aria-pressed="${natures[ph.id] === n}" data-phrase="${echapper(ph.id)}" data-nature="${n}">${n === 'fait' ? 'Fait' : n === 'jugement' ? 'Jugement' : 'Interprétation'}</button>`).join('')}
              </div>
            </fieldset>`).join('');
          })()}
          <p class="compteur">Phrases triées : ${faites} / ${e.phrases.length}</p>
          ${faites === e.phrases.length ? `<button type="button" class="bouton bouton--principal" data-action="valider-transmission">Je transmets les faits</button>` : ''}`;
      }
      case 'ordre': {
        if (ordreAffiche.length !== e.elements.length) ordreAffiche = melangerSansOrdreDeDepart(e.elements.map((el) => el.id));
        const complet = ordreChoisi.length === e.elements.length;
        return `
          <p class="indice">Touchez les étapes dans l'ordre où vous les faites. Touchez une étape numérotée pour l'enlever.</p>
          ${ordreAffiche.map((id) => {
            const el = e.elements.find((x) => x.id === id)!;
            const rang = ordreChoisi.indexOf(id);
            return `
            <button type="button" class="choix choix--ordre" aria-pressed="${rang >= 0}" data-ordre="${echapper(id)}">
              <span class="rang" aria-hidden="true">${rang >= 0 ? rang + 1 : ''}</span> <span class="a-lire">${echapper(el.texte)}</span>
            </button>`;
          }).join('')}
          <div class="rangee-boutons">
            <button type="button" class="bouton bouton--texte" data-action="recommencer-ordre" ${ordreChoisi.length ? '' : 'disabled'}>Recommencer</button>
            <button type="button" class="bouton bouton--principal" data-action="valider-ordre" ${complet ? '' : 'disabled'}>Valider mon ordre</button>
          </div>`;
      }
      case 'selection':
        return `
          <p class="question a-lire">${avecLexique(e.question)}</p>
          ${dansLOrdreTire(e.id, e.elements).map(({ el }) => `
            <button type="button" class="choix choix--coche" aria-pressed="${choisis.has(el.id)}" data-selection="${echapper(el.id)}">
              <span class="coche" aria-hidden="true">${choisis.has(el.id) ? '☑' : '☐'}</span>
              <span class="a-lire">${echapper(el.texte)}${el.stock !== undefined ? ` <span class="stock">· en réserve : <strong>${el.stock}</strong> · seuil d'alerte : <strong>${el.seuil}</strong></span>` : ''}</span>
            </button>`).join('')}
          <button type="button" class="bouton bouton--principal" data-action="valider-selection">Valider</button>`;
      case 'tri': {
        const ranges = e.elements.filter((el) => rangements[el.id]).length;
        return `
          <ul class="categories">${e.categories.map((c) => `<li class="a-lire"><strong>${echapper(c.libelle)}</strong>${c.aide ? ` : ${echapper(c.aide)}` : ''}</li>`).join('')}</ul>
          ${(() => {
            const liste = dansLOrdreTire(e.id, e.elements).map(({ el }) => el);
            const courant = liste.find((el) => el.id === ouvert) ?? liste.find((el) => !rangements[el.id]);
            return pastilles(liste.map((el) => el.id), (id) => Boolean(rangements[id]), courant?.id)
              + (courant ? [courant] : []).map((el) => `
            <fieldset class="canal canal--courant">
              <legend class="a-lire">${echapper(el.texte)}</legend>
              <div class="rangee-boutons rangee-boutons--trois">
                ${e.categories.map((c) => `
                  <button type="button" class="choix" aria-pressed="${rangements[el.id] === c.id}" data-tri="${echapper(el.id)}" data-categorie="${echapper(c.id)}">${echapper(c.libelle)}</button>`).join('')}
              </div>
            </fieldset>`).join('');
          })()}
          <p class="compteur">Rangés : ${ranges} / ${e.elements.length}</p>
          ${ranges === e.elements.length ? `<button type="button" class="bouton bouton--principal" data-action="valider-tri">Valider mon rangement</button>` : ''}`;
      }
      case 'qcm':
        return `
          <p class="question a-lire">${avecLexique(e.question)}</p>
          ${dansLOrdreTire(e.id, e.options).map(({ el: o, i }) => `
            <button type="button" class="choix" data-qcm="${i}">${echapper(o.texte)}</button>`).join('')}`;
      case 'association': {
        const liste = dansLOrdreTire(e.id, e.paires).map(({ el }) => el);
        const courant = liste.find((p) => p.id === ouvert) ?? liste.find((p) => !liensAsso[p.id]);
        const faites = e.paires.filter((p) => liensAsso[p.id]).length;
        return `
          ${pastilles(liste.map((p) => p.id), (id) => Boolean(liensAsso[id]), courant?.id)}
          ${courant ? `
            <fieldset class="canal canal--courant">
              <legend class="a-lire"><strong>${echapper(courant.terme)}</strong> : quelle définition ?</legend>
              ${dansLOrdreTire(`${e.id}:definitions`, e.paires).map(({ el: d }) => `
                <button type="button" class="choix" aria-pressed="${liensAsso[courant.id] === d.id}" data-asso="${echapper(courant.id)}" data-definition="${echapper(d.id)}">${echapper(d.definition)}</button>`).join('')}
            </fieldset>` : ''}
          <p class="compteur">Mots reliés : ${faites} / ${e.paires.length}</p>
          ${faites === e.paires.length ? `<button type="button" class="bouton bouton--principal" data-action="valider-association">Valider</button>` : ''}`;
      }
      case 'relais':
        return `
          <p class="indice">Touchez dans l'aile la personne à prévenir. Le bouton « Qui est qui ? » peut vous aider.</p>
          <ul class="metiers">${contenu.personnel.filter((p) => !p.joueur).map((p) => `<li class="a-lire"><span aria-hidden="true">${p.picto ?? ''}</span> ${echapper(p.metier)}</li>`).join('')}</ul>
          ${messageRelais ? `<p class="retour retour--erreur a-lire">${echapper(messageRelais)}</p>` : ''}`;
    }
  };

  const afficher = () => {
    if (!mission || !etat) {
      panneau.hidden = true;
      delete racine.dataset.mission;
      theatre.demanderRendu();
      return;
    }
    racine.dataset.mission = 'en-cours';
    panneau.hidden = false;
    const e = etape();
    let corps = '';
    if (phase === 'intro') {
      corps = `
        <h2 class="panneau__titre a-lire">${echapper(mission.titre)}</h2>
        ${rappels.length ? `<div class="pourquoi"><p class="pourquoi__titre a-lire">📌 Depuis vos dernières missions :</p>
          <ul>${rappels.map((r) => `<li class="a-lire"><strong>${echapper(r.titre)}</strong> : ${echapper(r.texte)}</li>`).join('')}</ul></div>` : ''}
        <p class="a-lire">${avecLexique(mission.situation)}</p>
        <p class="objectif a-lire"><strong>Votre objectif :</strong> ${avecLexique(mission.objectif_eleve)}</p>
        <details class="estimation">
          <summary>Avant de commencer : où vous situez-vous ? (facultatif)</summary>
          ${mission.competences.map((c) => `
            <fieldset class="canal">
              <legend class="a-lire"><strong>${echapper(c.code)}</strong> ${echapper(c.critere)}</legend>
              <div class="rangee-boutons rangee-boutons--trois">
                ${niveauxPossibles().map((n) => `
                  <button type="button" class="choix" aria-pressed="${estimations[c.code] === n}" data-estimer="${echapper(c.code)}" data-niveau="${n}" title="${echapper(contenu.referentiel.niveaux[n])}">${n}</button>`).join('')}
              </div>
            </fieldset>`).join('')}
          <p class="indice">${niveauxPossibles().map((n) => `<strong>${n}</strong> ${echapper(contenu.referentiel.niveaux[n])}`).join(' ')}</p>
        </details>
        <button type="button" class="bouton bouton--principal" data-action="commencer">C'est parti</button>`;
    } else if (phase === 'retour' && !revele) {
      corps = `
        <p class="indice">Réponse choisie :</p>
        <ul class="retours">${(etat.parcours.at(-1)?.reponses ?? []).map((r) => `<li class="a-lire">${echapper(noms.get(r) ?? r)}</li>`).join('')}</ul>
        <p class="question a-lire">🗣 Débattez en classe : était-ce le bon choix ? Pourquoi ?</p>
        <button type="button" class="bouton bouton--principal" data-action="reveler">Révéler la correction</button>`;
    } else if (phase === 'retour') {
      corps = `
        <p class="retour ${reussi ? 'retour--bien' : 'retour--erreur'} a-lire">${reussi ? 'Bien joué.' : 'À retenir :'}</p>
        <ul class="retours">${retours.map((r) => `<li class="a-lire">${avecLexique(r)}</li>`).join('')}</ul>
        ${criteresARevoir()}
        <button type="button" class="bouton bouton--principal" data-action="continuer">${etat.etape ? 'Continuer' : 'Voir la relève'}</button>`;
    } else if (e) {
      const doc = e.document
        ? `<div class="document"><p class="document__titre a-lire">📋 ${echapper(e.document.titre)}</p>
             <ul>${e.document.lignes.map((l) => `<li class="a-lire">${echapper(l)}</li>`).join('')}</ul></div>`
        : '';
      corps = `${doc}<p class="consigne a-lire">${avecLexique(e.consigne)}</p>${contenuEtape(e)}`;
    }
    panneau.innerHTML = `
      <div class="panneau__haut">
        ${jauge()}
        <button type="button" class="bouton bouton--petit" data-action="lire" aria-label="Lire à voix haute" hidden>🔊</button>
        <button type="button" class="bouton bouton--petit" data-action="quitter" aria-label="Quitter la mission">×</button>
      </div>
      <div class="panneau__corps">${corps}</div>`;
    panneau.dataset.etape = phase === 'etape' ? e?.type ?? '' : phase;
    // Une question à la fois : la question en cours (ou le bouton pour valider) reste visible sans chercher.
    if (phase === 'etape') panneau.querySelector('.canal--courant, .panneau__corps > .bouton--principal')?.scrollIntoView({ block: 'nearest' });
    racine.dispatchEvent(new CustomEvent('panneau-affiche', { detail: panneau }));
    theatre.demanderRendu(); // les repères de la loupe se replacent après le dessin
  };

  // ---------- Repères de la loupe ----------
  // Des boutons HTML de 44 px posés au-dessus des cases du plan : ils suivent la vue après chaque dessin.
  const point = new THREE.Vector3();
  const placerReperes = () => {
    const e = etape();
    const visibles = phase === 'etape' && e?.type === 'observation' ? e.elements : [];
    const cle = visibles.length ? e!.id : '';
    if (reperes.dataset.etape !== cle) {
      reperes.dataset.etape = cle;
      reperes.replaceChildren(...visibles.map((el) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'repere';
        b.dataset.element = el.id;
        b.textContent = '🔍';
        b.setAttribute('aria-label', `Repère dans la pièce : ${el.libelle}`);
        return b;
      }));
    }
    visibles.forEach((el, i) => {
      const b = reperes.children[i] as HTMLElement;
      const { x, y } = theatre.versEcran(point.set(el.colonne + 0.5, 0.3, el.rangee + 0.5));
      b.style.transform = `translate(${Math.round(x - 22)}px, ${Math.round(y - 22)}px)`;
      b.classList.toggle('repere--classe', Boolean(classements[el.id]));
      b.classList.toggle('repere--ouvert', elementOuvert?.id === el.id);
    });
  };
  theatre.apresChaqueRendu(placerReperes);

  // ---------- Réponses ----------
  const envoyer = (reponse: Reponse) => {
    if (!mission || !etat) return;
    const resultat = repondre(mission, etat, reponse);
    etat = resultat.etat;
    retours = resultat.retours;
    reussi = resultat.reussi;
    aRevoir = resultat.aRevoir;
    revele = !liens.modeClasse;
    phase = 'retour';
    afficher();
  };

  const quitter = () => {
    mission = null;
    etat = null;
    afficher();
  };

  const continuer = () => {
    if (!mission || !etat) return;
    dialogue = {};
    ouvert = null;
    classements = {};
    natures = {};
    ordreAffiche = [];
    ordreChoisi = [];
    choisis = new Set();
    rangements = {};
    liensAsso = {};
    elementOuvert = null;
    messageRelais = '';
    if (etat.etape === null) {
      const b = bilan(mission, etat);
      liens.surFin?.(b);
      quitter();
      ouvrirReleve(b);
      return;
    }
    phase = 'etape';
    afficher();
  };

  const commencer = (m: Mission) => {
    mission = tirerVariante(m); // P.11 : version de base ou variante de contexte, tirée au hasard
    rappels = liens.prendreRappels?.(m.id) ?? [];
    estimations = {};
    etat = demarrerMission(mission);
    phase = 'intro';
    ordresTires.clear();
    dialogue = {};
    ouvert = null;
    classements = {};
    natures = {};
    ordreAffiche = [];
    ordreChoisi = [];
    choisis = new Set();
    rangements = {};
    liensAsso = {};
    elementOuvert = null;
    messageRelais = '';
    fenetre.hidden = true;
    if (m.format !== 'entrainement') liens.allerVersZone(m.lieu); // un entraînement ne fait pas marcher l'agent
    afficher();
  };

  // Après une réponse, le panneau est redessiné : on place le focus sur la question suivante (ou sur le bouton
  // de validation), pour qu'un élève au clavier ou avec un lecteur d'écran ne reparte pas du haut de la page.
  const garderLeFocus = () => {
    panneau.querySelector<HTMLElement>('.canal--courant .choix, .panneau__corps > .bouton--principal')?.focus({ preventScroll: true });
  };

  panneau.addEventListener('click', (evenement) => {
    const cible = (evenement.target as HTMLElement).closest<HTMLElement>('button');
    if (!cible || !mission || !etat) return;
    const e = etape();
    const d = cible.dataset;
    if (d.mot) {
      // La définition s'ouvre sous la phrase, sans redessiner le panneau (on garde ses choix et sa lecture).
      const deja = panneau.querySelector<HTMLElement>('.definition');
      const memeMot = deja?.dataset.mot === d.mot;
      deja?.remove();
      const entree = lexique.find((l) => l.mot === d.mot);
      if (!entree || memeMot) return;
      const def = document.createElement('p');
      def.className = 'definition a-lire';
      def.dataset.mot = entree.mot;
      def.setAttribute('role', 'note');
      def.innerHTML = `📖 <strong>${echapper(entree.mot)}</strong> : ${echapper(entree.definition)} <span class="definition__source">(cours ${echapper(entree.source)})</span>`;
      const hote = cible.closest('p, li');
      if (hote?.tagName === 'LI') hote.append(def);
      else (hote ?? cible).after(def);
      return;
    }
    if (d.estimer && d.niveau) {
      estimations[d.estimer] = d.niveau as Niveau;
      afficher();
      panneau.querySelector<HTMLDetailsElement>('.estimation')?.setAttribute('open', '');
    } else if (d.action === 'reveler') {
      revele = true;
      afficher();
    } else if (d.action === 'commencer') {
      phase = 'etape';
      afficher();
      if (etape()?.type === 'observation') liens.cadrerZone(mission.lieu);
    } else if (d.action === 'continuer') {
      continuer();
      if (mission && etape()?.type === 'observation') liens.cadrerZone(mission.lieu);
    }
    else if (d.action === 'quitter') quitter();
    else if (d.rouvrir) {
      ouvert = d.rouvrir;
      afficher();
      garderLeFocus();
    } else if (d.canal) {
      dialogue[d.canal] = Number(d.i);
      ouvert = null;
      afficher();
      garderLeFocus();
    } else if (d.action === 'valider-dialogue') {
      envoyer({ type: 'dialogue', verbal: dialogue.verbal, paraverbal: dialogue.paraverbal, non_verbal: dialogue.non_verbal });
    } else if (d.classer && elementOuvert) {
      classements[elementOuvert.id] = d.classer as 'facilite' | 'gene';
      elementOuvert = null;
      afficher();
    } else if (d.action === 'valider-observation') envoyer({ type: 'observation', classements });
    else if (d.phrase && d.nature) {
      natures[d.phrase] = d.nature as NaturePhrase;
      ouvert = null;
      afficher();
      garderLeFocus();
    } else if (d.action === 'valider-transmission') envoyer({ type: 'transmission', classements: natures });
    else if (d.ordre) {
      ordreChoisi = ordreChoisi.includes(d.ordre) ? ordreChoisi.filter((id) => id !== d.ordre) : [...ordreChoisi, d.ordre];
      afficher();
    } else if (d.action === 'recommencer-ordre') {
      ordreChoisi = [];
      afficher();
    } else if (d.action === 'valider-ordre') envoyer({ type: 'ordre', ordre: ordreChoisi });
    else if (d.selection) {
      if (choisis.has(d.selection)) choisis.delete(d.selection);
      else choisis.add(d.selection);
      afficher();
    } else if (d.action === 'valider-selection') envoyer({ type: 'selection', choisis: [...choisis] });
    else if (d.tri && d.categorie) {
      rangements[d.tri] = d.categorie;
      ouvert = null;
      afficher();
      garderLeFocus();
    } else if (d.action === 'valider-tri') envoyer({ type: 'tri', rangements });
    else if (d.decision !== undefined && e?.type === 'decision') envoyer({ type: 'decision', choix: Number(d.decision) });
    else if (d.qcm !== undefined && e?.type === 'qcm') envoyer({ type: 'qcm', choix: Number(d.qcm) });
    else if (d.asso && d.definition) {
      liensAsso[d.asso] = d.definition;
      ouvert = null;
      afficher();
      garderLeFocus();
    } else if (d.action === 'valider-association') envoyer({ type: 'association', liens: liensAsso });
  });

  reperes.addEventListener('click', (evenement) => {
    const id = (evenement.target as HTMLElement).closest<HTMLElement>('[data-element]')?.dataset.element;
    const e = etape();
    if (!id || e?.type !== 'observation') return;
    elementOuvert = e.elements.find((el) => el.id === id) ?? null;
    afficher();
  });

  // ---------- Liste des missions et relève ----------
  const ouvrirFenetre = (html: string) => {
    fenetre.innerHTML = `<div class="fenetre__carte">${html}</div>`;
    fenetre.hidden = false;
    fenetre.querySelector<HTMLElement>('button')?.focus();
  };

  // Écran d'accueil et liste des missions. On choisit d'abord la matière (Bloc 2 ou PSE) : les deux listes ne se
  // mélangent pas. Bloc 2 : missions rangées par séquence, verrouillées tant que la séquence n'a pas été vue.
  // PSE : missions toujours ouvertes. Le choix de matière est gardé pendant la partie.
  let matiere: 'bloc2' | 'pse' | null = null;
  let formatListe: 'missions' | 'entrainements' = 'missions'; // Q.3
  let famille: string | null = null; // Q.1 : préfixe de la famille choisie (« CT3. »…), ou toutes
  let accueilEnCours = false;
  const carteMission = (m: Mission, sequenceVue: string) => {
    const niveaux = liens.niveauxObtenus?.(m.id);
    // Mode classe : l'enseignante projette le jeu, toutes les missions sont ouvertes.
    const ouverte = liens.modeClasse || estDebloquee(m, sequenceVue);
    const pse = m.discipline === 'PSE';
    return `
          <li>
            <button type="button" class="carte-mission" data-mission="${echapper(m.id)}" ${ouverte ? '' : 'disabled'}>
              <strong>${ouverte ? '' : '🔒 '}${echapper(m.titre)}</strong>
              <span>${m.duree_min} min · ${pse ? `séquence ${echapper(m.sequence_requise)} de PSE` : ouverte ? `séquence ${echapper(m.sequence_requise)}` : `s'ouvre quand « Séquence vue en cours » est sur ${echapper(m.sequence_requise)}`}${m.statut === 'brouillon' ? ' · <em>brouillon</em>' : ''}</span>
              ${niveaux ? `<span class="niveaux">Dernière relève : ${echapper(niveaux)}</span>` : ''}
            </button>
          </li>`;
  };
  const ouvrirListe = (accueil = false) => {
    accueilEnCours = accueil;
    const sequenceVue = liens.sequenceVue();
    const toutes = missionsAMontrer(contenu.missions, liens.avecBrouillons);
    const duFormat = (m: Mission) => (formatListe === 'entrainements') === (m.format === 'entrainement');
    const bloc2Tout = toutes.filter((m) => m.discipline !== 'PSE');
    const pseTout = toutes.filter((m) => m.discipline === 'PSE');
    const bloc2 = bloc2Tout.filter(duFormat);
    const pse = pseTout.filter(duFormat);
    const haut = `
      <div class="fenetre__haut">
        ${matiere ? `<button type="button" class="bouton bouton--petit" data-action="matieres" aria-label="Revenir au choix de la matière">←</button>` : ''}
        <h2>${matiere === 'bloc2' ? 'Missions · Bloc 2' : matiere === 'pse' ? 'Missions · PSE' : accueil ? 'Une journée aux Glycines' : 'Missions'}</h2>
        <button type="button" class="bouton bouton--petit" data-action="fermer" aria-label="Fermer">×</button>
      </div>`;
    if (!matiere) {
      ouvrirFenetre(`${haut}
      ${accueil ? `<p class="a-lire">Vous êtes agent accompagnant au grand âge dans l'aile B de l'EHPAD Les Glycines. Choisissez une matière, puis une mission. Vous pouvez aussi fermer cette fenêtre pour explorer l'aile.</p>` : ''}
      <div class="matieres">
        <button type="button" class="carte-matiere" data-matiere="bloc2">
          <strong>Bloc 2</strong>
          <span>Accompagner la personne dans son espace privé</span>
          <span class="carte-matiere__nombre">${bloc2Tout.length} activité${bloc2Tout.length > 1 ? 's' : ''}</span>
        </button>
        <button type="button" class="carte-matiere" data-matiere="pse" ${pseTout.length ? '' : 'disabled'}>
          <strong>PSE</strong>
          <span>Prévention santé environnement</span>
          <span class="carte-matiere__nombre">${pseTout.length ? `${pseTout.length} activité${pseTout.length > 1 ? 's' : ''}` : 'bientôt'}</span>
        </button>
      </div>`);
    } else {
      const tousMatiere = matiere === 'pse' ? pseTout : bloc2Tout;
      const nbMissions = tousMatiere.filter((m) => m.format !== 'entrainement').length;
      const nbEntrainements = tousMatiere.length - nbMissions;
      const onglets = `
      <div class="onglets" role="group" aria-label="Format">
        <button type="button" class="onglet" aria-pressed="${formatListe === 'missions'}" data-format="missions">🏠 Missions dans l'aile <span class="famille__nombre">${nbMissions}</span></button>
        <button type="button" class="onglet" aria-pressed="${formatListe === 'entrainements'}" data-format="entrainements" ${nbEntrainements ? '' : 'disabled'}>⚡ Entraînements rapides <span class="famille__nombre">${nbEntrainements || 'bientôt'}</span></button>
      </div>`;
      const familles = contenu.familles ?? [];
      const liste = matiere === 'pse' ? pse : bloc2.filter((m) => dansFamille(m, famille));
      const titreFamille = familles.find((f) => f.prefixe === famille)?.titre;
      ouvrirFenetre(`${haut}
      ${onglets}
      ${matiere === 'bloc2' && liens.modeClasse ? '<p class="indice">Mode classe : toutes les missions sont ouvertes.</p>' : ''}
      ${matiere === 'bloc2' && !liens.modeClasse ? `<label class="choix-sequence">Séquence vue en cours
        <select name="sequence">
          ${SEQUENCES.map((s) => `<option ${s === sequenceVue ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </label>` : ''}
      ${matiere === 'bloc2' ? `<div class="familles" role="group" aria-label="Type d'action">
        <button type="button" class="famille" aria-pressed="${famille === null}" data-famille="">Toutes <span class="famille__nombre">${bloc2.length}</span></button>
        ${familles.map((f) => `<button type="button" class="famille" aria-pressed="${famille === f.prefixe}" data-famille="${echapper(f.prefixe)}">${echapper(f.court)} <span class="famille__nombre">${bloc2.filter((m) => dansFamille(m, f.prefixe)).length}</span></button>`).join('')}
      </div>
      ${titreFamille ? `<p class="indice">${echapper(titreFamille)}</p>` : ''}` : '<p class="indice">Les missions de PSE sont toujours ouvertes.</p>'}
      ${liste.length === 0 ? '<p class="indice">Aucune mission validée pour l\'instant.</p>' : ''}
      <ul class="liste-missions">${liste.map((m) => carteMission(m, sequenceVue)).join('')}</ul>`);
      fenetre.querySelector<HTMLSelectElement>('select[name="sequence"]')?.addEventListener('change', (e) => {
        liens.changerSequence((e.target as HTMLSelectElement).value);
        ouvrirListe(accueil);
      });
    }
    if (liens.progression) {
      const bouton = document.createElement('button');
      bouton.type = 'button';
      bouton.className = 'bouton bouton--texte bouton-bilan';
      bouton.dataset.action = 'mon-bilan';
      bouton.textContent = '📄 Mon bilan : toutes mes compétences';
      fenetre.querySelector('.fenetre__carte')!.append(bouton);
    }
    const bas = liens.basDeListe?.();
    if (bas) fenetre.querySelector('.fenetre__carte')!.append(bas);
    if (accueil) racine.dispatchEvent(new CustomEvent('panneau-affiche', { detail: fenetre }));
  };

  const ouvrirReleve = (b: Bilan) => {
    const m = contenu.missions.find((x) => x.id === b.mission)!;
    ouvrirFenetre(`
      <div class="fenetre__haut">
        <h2 class="a-lire">Relève · ${echapper(m.titre)}</h2>
        <button type="button" class="bouton bouton--petit" data-action="lire" aria-label="Lire à voix haute" hidden>🔊</button>
      </div>
      <p class="indice">Votre niveau pour chaque compétence travaillée :</p>
      <ul class="releve">
        ${b.competences.map((c) => `
          <li class="a-lire">
            <span class="badge badge--niveau badge--${c.niveau}">${c.niveau}</span>
            <span><strong>${echapper(c.code)}</strong> ${echapper(c.critere)}
            <span class="releve__sens">${echapper(contenu.referentiel.niveaux[c.niveau])}</span>
            ${estimations[c.code] ? `<span class="releve__estimation">Vous pensiez ${estimations[c.code]}. ${PHRASES_ECART[comparerEstimation(estimations[c.code], c.niveau)]}</span>` : ''}</span>
          </li>`).join('')}
      </ul>
      <h3>Pour le débriefing</h3>
      <ol class="debriefing">${b.debriefing.map((q) => `<li class="a-lire">${echapper(q)}</li>`).join('')}</ol>
      <div class="rangee-boutons">
        <button type="button" class="bouton bouton--texte" data-action="imprimer-fiche">🖨 Imprimer ma fiche</button>
        ${liens.progression ? '<button type="button" class="bouton bouton--texte" data-action="mon-bilan">📄 Mon bilan</button>' : ''}
        <button type="button" class="bouton bouton--principal" data-action="fermer">Terminer</button>
      </div>`);
    dernierBilan = b;
    racine.dispatchEvent(new CustomEvent('panneau-affiche', { detail: fenetre }));
  };

  // ---------- Fiche de fin de mission (tâche P.2) ----------
  // Une page à imprimer ou à enregistrer en PDF : rien n'est envoyé, l'élève écrit son nom à la main.
  let dernierBilan: Bilan | null = null;
  const lignes = (n: number) => '<span class="fiche__ligne"></span>'.repeat(n);
  const imprimerFiche = (b: Bilan) => {
    // La mission jouée (avec sa variante éventuelle), sinon celle du contenu.
    const m = mission?.id === b.mission ? mission : contenu.missions.find((x) => x.id === b.mission)!;
    const consigne = (id: string) => m.etapes.find((e) => e.id === id)?.consigne ?? '';
    const typeEtape = (id: string) => m.etapes.find((e) => e.id === id)?.type;
    const fiche = document.createElement('div');
    fiche.className = 'fiche-impression';
    fiche.innerHTML = `
      <h1>Fiche de relève · ${echapper(m.titre)}</h1>
      <p>Nom : ______________________ &nbsp; Date : ${new Date().toLocaleDateString('fr-FR')} &nbsp; Séquence ${echapper(m.sequence_requise)}</p>
      <p><strong>Situation :</strong> ${echapper(m.situation)}</p>
      <h2>Mes niveaux</h2>
      <table>
        <thead><tr><th>Compétence</th><th>Critère officiel</th><th>Mon estimation</th><th>Niveau</th></tr></thead>
        <tbody>${b.competences.map((c) => `
          <tr><td>${echapper(c.code)}</td><td>${echapper(c.critere)}</td><td>${estimations[c.code] ?? '…'}</td>
              <td><strong>${c.niveau}</strong><br><small>${echapper(contenu.referentiel.niveaux[c.niveau])}</small></td></tr>`).join('')}
        </tbody>
      </table>
      <h2>Ce que j'ai choisi</h2>
      <ol>${b.parcours.map((t) => `
        <li><strong>${echapper(consigne(t.etape))}</strong> ${t.reussi ? '✔' : '✘ à revoir'}
          <ul>${t.reponses.map((r) => `<li>${echapper(typeEtape(t.etape) === 'relais' ? `J'ai prévenu : ${noms.get(r) ?? r}` : r)}</li>`).join('')}</ul>
        </li>`).join('')}
      </ol>
      <h2>Débriefing</h2>
      <ol class="fiche__questions">${b.debriefing.map((q) => `<li>${echapper(q)}${lignes(3)}</li>`).join('')}</ol>
      <h2>Ce que je retiens pour mon stage</h2>
      ${lignes(4)}`;
    imprimer(fiche);
  };

  // Imprime (ou enregistre en PDF) un bloc HTML seul, puis le retire de la page.
  const imprimer = (fiche: HTMLElement) => {
    document.body.append(fiche);
    document.documentElement.classList.add('impression');
    const nettoyer = () => {
      fiche.remove();
      document.documentElement.classList.remove('impression');
      window.removeEventListener('afterprint', nettoyer);
    };
    window.addEventListener('afterprint', nettoyer);
    window.print();
  };

  // ---------- Mon bilan : toutes les compétences, Bloc 2 et PSE ----------
  // Calculé à partir des derniers niveaux gardés dans le navigateur. Rien n'est envoyé.
  const partiesBilan = () => bilanGlobal(liens.progression?.() ?? {}, contenu.missions, [
    { titre: contenu.referentiel.bloc, referentiel: contenu.referentiel },
    ...(contenu.referentielPse ? [{ titre: 'PSE · Prévention santé environnement', referentiel: contenu.referentielPse }] : []),
  ]);
  // Lecture simple des niveaux pour l'élève (la phrase officielle du référentiel est affichée à côté).
  const SENS_NIVEAU: Record<Niveau, string> = {
    N1: 'Pas encore acquis',
    N2: 'En cours d\'acquisition',
    N3: 'Acquis',
    N4: 'Maîtrisé et transféré',
  };
  const badge = (n?: Niveau) => (n ? `<span class="badge badge--niveau badge--${n}">${n}</span>` : '<span class="bilan__vide">pas encore</span>');
  const ouvrirBilan = () => {
    const parties = partiesBilan();
    ouvrirFenetre(`
      <div class="fenetre__haut">
        <button type="button" class="bouton bouton--petit" data-action="retour-liste" aria-label="Revenir aux missions">←</button>
        <h2>Mon bilan</h2>
        <button type="button" class="bouton bouton--petit" data-action="fermer" aria-label="Fermer">×</button>
      </div>
      <section class="garder-bilan">
        <h3>Mettre mon nom et garder mon bilan</h3>
        <div class="identite-bilan">
          <label>Prénom (obligatoire) <input name="prenom" autocomplete="off" maxlength="40" required></label>
          <label>Nom (obligatoire) <input name="nom" autocomplete="off" maxlength="40" required></label>
          <label>Classe <input name="classe" autocomplete="off" maxlength="20"></label>
        </div>
        <p class="nom-manquant" role="status">✏️ Écrivez votre prénom et votre nom pour pouvoir télécharger votre bilan.</p>
        <div class="rangee-boutons rangee-boutons--export">
          <button type="button" class="bouton bouton--principal" data-action="tout-telecharger" data-export disabled>⬇ Tout garder : PDF + tableau + fichier de données</button>
          <p class="indice">Si le navigateur demande d'autoriser plusieurs téléchargements, répondez « Autoriser ». Pour le PDF, choisissez « Enregistrer en PDF » dans la fenêtre d'impression. Les fichiers vont dans « Téléchargements » (sur iPhone : app Fichiers).</p>
        </div>
        <details class="un-seul">
          <summary>Ou un seul format à la fois</summary>
          <div class="rangee-boutons rangee-boutons--export">
            <button type="button" class="bouton" data-action="imprimer-bilan" data-export disabled>🖨 Imprimer ou enregistrer en PDF</button>
            <button type="button" class="bouton" data-action="telecharger-csv" data-export disabled>📊 Tableau pour LibreOffice ou Excel</button>
            <button type="button" class="bouton" data-action="telecharger-json" data-export disabled>🗂 Fichier de données (à garder)</button>
          </div>
        </details>
        <p class="conseil-fichier">💾 <strong>À la fin de chaque séance, gardez votre « Fichier de données »</strong> (ENT, Pronote ou clé USB). Si l'ordinateur efface tout, ou si vous changez d'appareil, il vous permet de retrouver votre progression : bouton « Reprendre avec mon fichier de bilan », en bas de la liste des missions. Votre nom n'est ni envoyé ni gardé dans le jeu.</p>
      </section>
      <h3>Que veulent dire les niveaux ?</h3>
      <ul class="legende-niveaux">
        ${(['N1', 'N2', 'N3', 'N4'] as const).map((n) => `
          <li><span class="badge badge--niveau badge--${n}">${n}</span>
            <span><strong>${SENS_NIVEAU[n]}</strong> · ${echapper(contenu.referentiel.niveaux[n])}</span></li>`).join('')}
      </ul>
      <p class="indice">N4 ne s'obtient que dans les missions de transfert (situation nouvelle). Ci-dessous : le meilleur niveau obtenu pour chaque compétence, et le détail par mission. Gardé sur cet appareil seulement.</p>
      ${parties.map((p) => `
        <h3>${echapper(p.titre)}</h3>
        <ul class="bilan">
          ${p.lignes.map((l) => `
            <li class="bilan__ligne">
              ${badge(l.meilleur)}
              <span><strong>${echapper(l.code)}</strong> ${echapper(l.intitule)}
                ${l.resultats.length ? `<span class="bilan__detail">${l.resultats.map((r) => `${echapper(r.titre)} : ${r.niveau}`).join(' · ')}</span>` : ''}
              </span>
            </li>`).join('')}
        </ul>`).join('')}`);
    // Prénom et nom obligatoires : les boutons de téléchargement restent grisés tant qu'ils ne sont pas écrits,
    // pour que chaque fiche et chaque fichier rendu à l'enseignante porte bien le nom de l'élève.
    const verifierNom = () => {
      const { prenom, nom } = eleveTape();
      const complet = prenom !== '' && nom !== '';
      fenetre.querySelectorAll<HTMLButtonElement>('[data-export]').forEach((b) => (b.disabled = !complet));
      fenetre.querySelector<HTMLElement>('.nom-manquant')!.hidden = complet;
    };
    fenetre.querySelector('.identite-bilan')?.addEventListener('input', verifierNom);
  };
  // Identité tapée dans « Mon bilan » (vide si rien n'est tapé). Rien n'est gardé après la fermeture.
  const eleveTape = (): Eleve => {
    const valeur = (nom: string) => fenetre.querySelector<HTMLInputElement>(`.identite-bilan input[name="${nom}"]`)?.value.trim() ?? '';
    return { prenom: valeur('prenom'), nom: valeur('nom'), classe: valeur('classe') };
  };
  // Fabrique le fichier sur l'appareil et le propose au téléchargement (aucun envoi).
  const telecharger = (texte: string, nomFichier: string, type: string) => {
    const url = URL.createObjectURL(new Blob([texte], { type }));
    const lien = document.createElement('a');
    lien.href = url;
    lien.download = nomFichier;
    document.body.append(lien);
    lien.click();
    lien.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const exporterBilan = (format: 'csv' | 'json') => {
    const eleve = eleveTape();
    const maintenant = new Date();
    const dateIso = `${maintenant.getFullYear()}-${String(maintenant.getMonth() + 1).padStart(2, '0')}-${String(maintenant.getDate()).padStart(2, '0')}`;
    const parties = partiesBilan();
    if (format === 'csv') telecharger(bilanEnCsv(parties, eleve, maintenant.toLocaleDateString('fr-FR')), nomDeFichier(eleve, dateIso, 'csv'), 'text/csv;charset=utf-8');
    else telecharger(bilanEnJson(parties, eleve, dateIso, liens.progression?.() ?? {}, contenu.missions), nomDeFichier(eleve, dateIso, 'json'), 'application/json');
  };
  // Les trois d'un coup : les deux fichiers tout de suite (même clic), puis la fenêtre d'impression pour le PDF.
  const toutTelecharger = () => {
    exporterBilan('json');
    exporterBilan('csv');
    setTimeout(imprimerBilan, 800);
  };
  const imprimerBilan = () => {
    const parties = partiesBilan();
    const eleve = eleveTape();
    const fiche = document.createElement('div');
    fiche.className = 'fiche-impression';
    fiche.innerHTML = `
      <h1>Mon bilan de compétences · Une journée aux Glycines</h1>
      <p>Nom : ${eleve.nom || eleve.prenom ? `<strong>${echapper(`${eleve.prenom} ${eleve.nom}`.trim())}</strong>` : '______________________'} &nbsp; Classe : ${eleve.classe ? `<strong>${echapper(eleve.classe)}</strong>` : '__________'} &nbsp; Date : ${new Date().toLocaleDateString('fr-FR')}</p>
      <p>${echapper(contenu.referentiel.diplome)}. Niveaux : ${(['N1', 'N2', 'N3', 'N4'] as const).map((n) => `<strong>${n} ${SENS_NIVEAU[n]}</strong> (${echapper(contenu.referentiel.niveaux[n])})`).join(' · ')}</p>
      ${parties.map((p) => `
        <h2>${echapper(p.titre)}</h2>
        <table>
          <thead><tr><th>Compétence</th><th>Missions et critère officiel évalué</th><th>Meilleur niveau</th></tr></thead>
          <tbody>${p.lignes.map((l) => `
            <tr><td><strong>${echapper(l.code)}</strong><br>${echapper(l.intitule)}</td>
                <td>${l.resultats.length ? `<ul>${l.resultats.map((r) => `<li>${echapper(r.titre)} : <strong>${r.niveau}</strong><br><small>${echapper(r.critere)}</small></li>`).join('')}</ul>` : '<em>Pas encore travaillée dans le jeu.</em>'}</td>
                <td><strong>${l.meilleur ?? '…'}</strong></td></tr>`).join('')}
          </tbody>
        </table>`).join('')}
      <h2>Mon commentaire</h2>
      ${lignes(3)}
      <h2>Commentaire de l'enseignant(e)</h2>
      ${lignes(3)}`;
    imprimer(fiche);
  };

  fenetre.addEventListener('click', (evenement) => {
    const cible = (evenement.target as HTMLElement).closest<HTMLElement>('button');
    if (!cible) return;
    if (cible.dataset.action === 'fermer') fenetre.hidden = true;
    if (cible.dataset.matiere === 'bloc2' || cible.dataset.matiere === 'pse') {
      matiere = cible.dataset.matiere;
      ouvrirListe(accueilEnCours);
      return;
    }
    if (cible.dataset.format === 'missions' || cible.dataset.format === 'entrainements') {
      formatListe = cible.dataset.format;
      ouvrirListe(accueilEnCours);
      return;
    }
    if (cible.dataset.famille !== undefined) {
      famille = cible.dataset.famille || null;
      ouvrirListe(accueilEnCours);
      return;
    }
    if (cible.dataset.action === 'matieres') {
      matiere = null;
      ouvrirListe(accueilEnCours);
      return;
    }
    if (cible.dataset.action === 'imprimer-fiche' && dernierBilan) imprimerFiche(dernierBilan);
    if (cible.dataset.action === 'mon-bilan') return ouvrirBilan();
    if (cible.dataset.action === 'tout-telecharger') return toutTelecharger();
    if (cible.dataset.action === 'imprimer-bilan') return imprimerBilan();
    if (cible.dataset.action === 'telecharger-csv') return exporterBilan('csv');
    if (cible.dataset.action === 'telecharger-json') return exporterBilan('json');
    if (cible.dataset.action === 'retour-liste') return ouvrirListe(accueilEnCours);
    const id = cible.dataset.mission;
    const m = id && contenu.missions.find((x) => x.id === id);
    if (m) commencer(m);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') fenetre.hidden = true;
  });

  return {
    personneTouchee: (id) => {
      const e = etape();
      if (phase !== 'etape' || e?.type !== 'relais' || residents.has(id) || id === 'joueur' || !mission || !etat) return false;
      liens.allerVersPersonne(id);
      if (id === e.destinataire) {
        envoyer({ type: 'relais', destinataire: id });
      } else {
        const r = repondre(mission, etat, { type: 'relais', destinataire: id });
        etat = r.etat;
        messageRelais = `${noms.get(id) ?? ''} : ${r.retours[0]}`;
        afficher();
      }
      return true;
    },
    ouvrirListe,
    ouvrirMission: (id) => {
      const m = contenu.missions.find((x) => x.id === id || x.id.startsWith(`${id}-`));
      if (!m) return false;
      matiere = m.discipline === 'PSE' ? 'pse' : 'bloc2';
      formatListe = m.format === 'entrainement' ? 'entrainements' : 'missions';
      commencer(m);
      return true;
    },
  };
}
