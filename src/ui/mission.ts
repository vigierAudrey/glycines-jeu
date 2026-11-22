// Interface d'une mission : liste des missions, panneau d'étape en bas de l'écran, repères de la loupe,
// jauge de confiance et relève de fin de mission.
//
// Ce fichier ne décide rien : c'est le moteur (src/regles/mission.ts) qui calcule l'état, les points et les niveaux.
// Ici on affiche l'étape en cours, on recueille la réponse de l'élève et on la transmet au moteur.
// Sécurité : tout texte venu de content/ passe par echapper() avant d'être inséré dans le HTML.

import * as THREE from 'three';
import type { Contenu, ElementObserve, Etape, Mission, NaturePhrase } from '../contenu/types';
import { bilan, demarrerMission, etapeEnCours, repondre, type Bilan, type EtatMission, type Reponse } from '../regles/mission';
import { estDebloquee, missionsAMontrer, SEQUENCES } from '../regles/deblocage';
import type { Theatre } from '../scene3d/creerScene';
import { melangerSansOrdreDeDepart } from '../regles/hasard';
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
}

export interface InterfaceMission {
  /** Une personne a été touchée. Renvoie true si la mission s'en sert (étape « relais »). */
  personneTouchee: (id: string) => boolean;
  /** Ouvre la liste des missions (`accueil` : avec le mot de bienvenue). */
  ouvrirListe: (accueil?: boolean) => void;
}

const CANAUX = [
  { cle: 'verbal', titre: 'Ce que je dis', sous: 'verbal' },
  { cle: 'paraverbal', titre: 'Comment je le dis', sous: 'paraverbal : ton, débit' },
  { cle: 'non_verbal', titre: 'Ce que fait mon corps', sous: 'non-verbal : posture, regard' },
] as const;

const NOMS_DECISION = { agir: 'Agir', adapter: 'Adapter', alerter: 'Alerter' };

export function monterMissions(racine: HTMLElement, theatre: Theatre, contenu: Contenu, liens: LiensMission): InterfaceMission {
  const noms = new Map<string, string>([
    ...contenu.residents.map((r): [string, string] => [r.id, `${r.civilite} ${r.nom}`]),
    ...contenu.personnel.map((p): [string, string] => [p.id, p.joueur ? 'Vous' : `${p.prenom} (${p.sigle})`]),
  ]);
  const residents = new Set(contenu.residents.map((r) => r.id));

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

  // ---------- État de la partie ----------
  let mission: Mission | null = null;
  let etat: EtatMission | null = null;
  // Phase d'affichage : l'intro, l'étape (l'élève répond) ou le retour (on lui explique sa réponse).
  let phase: 'intro' | 'etape' | 'retour' = 'intro';
  let retours: string[] = [];
  let reussi = false;
  let aRevoir: string[] = [];
  let messageRelais = '';
  // Réponses en cours de saisie.
  let dialogue: Record<string, number> = {};
  let classements: Record<string, 'facilite' | 'gene'> = {};
  let elementOuvert: ElementObserve | null = null;
  let natures: Record<string, NaturePhrase> = {};
  let ordreAffiche: string[] = []; // protocole : éléments mélangés, dans l'ordre où ils sont montrés
  let ordreChoisi: string[] = []; // protocole : éléments touchés par l'élève, dans l'ordre
  let choisis = new Set<string>(); // sélection : éléments cochés
  let rangements: Record<string, string> = {}; // tri : élément → catégorie

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

  // ---------- Contenu du panneau selon l'étape ----------
  const contenuEtape = (e: Etape): string => {
    switch (e.type) {
      case 'dialogue': {
        const choisis = CANAUX.every((c) => dialogue[c.cle] !== undefined);
        return `
          ${e.replique ? `<p class="replique a-lire"><strong>${echapper(noms.get(e.interlocuteur) ?? '')} :</strong> « ${echapper(e.replique)} »</p>` : ''}
          ${CANAUX.map((c) => `
            <fieldset class="canal">
              <legend>${c.titre} <span class="canal__sous">(${c.sous})</span></legend>
              ${e[c.cle].map((o, i) => `
                <button type="button" class="choix" aria-pressed="${dialogue[c.cle] === i}"
                        data-canal="${c.cle}" data-i="${i}">${echapper(o.texte)}</button>`).join('')}
            </fieldset>`).join('')}
          <button type="button" class="bouton bouton--principal" data-action="valider-dialogue" ${choisis ? '' : 'disabled'}>Je parle</button>`;
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
          <p class="question a-lire">${echapper(e.question)}</p>
          ${e.choix.map((o, i) => `
            <button type="button" class="choix choix--decision" data-decision="${i}">
              <span class="badge badge--${o.decision}">${NOMS_DECISION[o.decision]}</span> ${echapper(o.texte)}
            </button>`).join('')}`;
      case 'transmission': {
        const faites = e.phrases.filter((ph) => natures[ph.id]).length;
        return `
          <p class="indice a-lire"><strong>Fait observé</strong> : ce que j'ai vu ou entendu. <strong>Jugement</strong> : un avis sur la personne. <strong>Interprétation</strong> : une cause ou une explication que je suppose.</p>
          ${e.phrases.map((ph) => `
            <fieldset class="canal">
              <legend class="a-lire">« ${echapper(ph.texte)} »</legend>
              <div class="rangee-boutons rangee-boutons--trois">
                ${(['fait', 'jugement', 'interpretation'] as const).map((n) => `
                  <button type="button" class="choix" aria-pressed="${natures[ph.id] === n}" data-phrase="${echapper(ph.id)}" data-nature="${n}">${n === 'fait' ? 'Fait' : n === 'jugement' ? 'Jugement' : 'Interprétation'}</button>`).join('')}
              </div>
            </fieldset>`).join('')}
          <p class="compteur">Phrases triées : ${faites} / ${e.phrases.length}</p>
          <button type="button" class="bouton bouton--principal" data-action="valider-transmission" ${faites === e.phrases.length ? '' : 'disabled'}>Je transmets les faits</button>`;
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
          <p class="question a-lire">${echapper(e.question)}</p>
          ${e.elements.map((el) => `
            <button type="button" class="choix choix--coche" aria-pressed="${choisis.has(el.id)}" data-selection="${echapper(el.id)}">
              <span class="coche" aria-hidden="true">${choisis.has(el.id) ? '☑' : '☐'}</span>
              <span class="a-lire">${echapper(el.texte)}${el.stock !== undefined ? ` <span class="stock">· en réserve : <strong>${el.stock}</strong> · seuil d'alerte : <strong>${el.seuil}</strong></span>` : ''}</span>
            </button>`).join('')}
          <button type="button" class="bouton bouton--principal" data-action="valider-selection">Valider</button>`;
      case 'tri': {
        const ranges = e.elements.filter((el) => rangements[el.id]).length;
        return `
          <ul class="categories">${e.categories.map((c) => `<li class="a-lire"><strong>${echapper(c.libelle)}</strong>${c.aide ? ` : ${echapper(c.aide)}` : ''}</li>`).join('')}</ul>
          ${e.elements.map((el) => `
            <fieldset class="canal">
              <legend class="a-lire">${echapper(el.texte)}</legend>
              <div class="rangee-boutons rangee-boutons--trois">
                ${e.categories.map((c) => `
                  <button type="button" class="choix" aria-pressed="${rangements[el.id] === c.id}" data-tri="${echapper(el.id)}" data-categorie="${echapper(c.id)}">${echapper(c.libelle)}</button>`).join('')}
              </div>
            </fieldset>`).join('')}
          <p class="compteur">Rangés : ${ranges} / ${e.elements.length}</p>
          <button type="button" class="bouton bouton--principal" data-action="valider-tri" ${ranges === e.elements.length ? '' : 'disabled'}>Valider mon rangement</button>`;
      }
      case 'relais':
        return `
          <p class="indice">Touchez dans l'aile la personne à prévenir. Le bouton « Qui est qui ? » peut vous aider.</p>
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
        <p class="a-lire">${echapper(mission.situation)}</p>
        <p class="objectif a-lire"><strong>Votre objectif :</strong> ${echapper(mission.objectif_eleve)}</p>
        <button type="button" class="bouton bouton--principal" data-action="commencer">C'est parti</button>`;
    } else if (phase === 'retour') {
      corps = `
        <p class="retour ${reussi ? 'retour--bien' : 'retour--erreur'} a-lire">${reussi ? 'Bien joué.' : 'À retenir :'}</p>
        <ul class="retours">${retours.map((r) => `<li class="a-lire">${echapper(r)}</li>`).join('')}</ul>
        ${criteresARevoir()}
        <button type="button" class="bouton bouton--principal" data-action="continuer">${etat.etape ? 'Continuer' : 'Voir la relève'}</button>`;
    } else if (e) {
      const doc = e.document
        ? `<div class="document"><p class="document__titre a-lire">📋 ${echapper(e.document.titre)}</p>
             <ul>${e.document.lignes.map((l) => `<li class="a-lire">${echapper(l)}</li>`).join('')}</ul></div>`
        : '';
      corps = `${doc}<p class="consigne a-lire">${echapper(e.consigne)}</p>${contenuEtape(e)}`;
    }
    panneau.innerHTML = `
      <div class="panneau__haut">
        ${jauge()}
        <button type="button" class="bouton bouton--petit" data-action="lire" aria-label="Lire à voix haute" hidden>🔊</button>
        <button type="button" class="bouton bouton--petit" data-action="quitter" aria-label="Quitter la mission">×</button>
      </div>
      <div class="panneau__corps">${corps}</div>`;
    panneau.dataset.etape = phase === 'etape' ? e?.type ?? '' : phase;
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
    classements = {};
    natures = {};
    ordreAffiche = [];
    ordreChoisi = [];
    choisis = new Set();
    rangements = {};
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
    mission = m;
    etat = demarrerMission(m);
    phase = 'intro';
    dialogue = {};
    classements = {};
    natures = {};
    ordreAffiche = [];
    ordreChoisi = [];
    choisis = new Set();
    rangements = {};
    elementOuvert = null;
    messageRelais = '';
    fenetre.hidden = true;
    liens.allerVersZone(m.lieu);
    afficher();
  };

  panneau.addEventListener('click', (evenement) => {
    const cible = (evenement.target as HTMLElement).closest<HTMLElement>('button');
    if (!cible || !mission || !etat) return;
    const e = etape();
    const d = cible.dataset;
    if (d.action === 'commencer') {
      phase = 'etape';
      afficher();
      if (etape()?.type === 'observation') liens.cadrerZone(mission.lieu);
    } else if (d.action === 'continuer') {
      continuer();
      if (mission && etape()?.type === 'observation') liens.cadrerZone(mission.lieu);
    }
    else if (d.action === 'quitter') quitter();
    else if (d.canal) {
      dialogue[d.canal] = Number(d.i);
      afficher();
    } else if (d.action === 'valider-dialogue') {
      envoyer({ type: 'dialogue', verbal: dialogue.verbal, paraverbal: dialogue.paraverbal, non_verbal: dialogue.non_verbal });
    } else if (d.classer && elementOuvert) {
      classements[elementOuvert.id] = d.classer as 'facilite' | 'gene';
      elementOuvert = null;
      afficher();
    } else if (d.action === 'valider-observation') envoyer({ type: 'observation', classements });
    else if (d.phrase && d.nature) {
      natures[d.phrase] = d.nature as NaturePhrase;
      afficher();
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
      afficher();
    } else if (d.action === 'valider-tri') envoyer({ type: 'tri', rangements });
    else if (d.decision !== undefined && e?.type === 'decision') envoyer({ type: 'decision', choix: Number(d.decision) });
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

  // Écran d'accueil et liste des missions : rangées par séquence, verrouillées tant que la séquence n'a pas été vue.
  const ouvrirListe = (accueil = false) => {
    const sequenceVue = liens.sequenceVue();
    const liste = missionsAMontrer(contenu.missions, liens.avecBrouillons);
    ouvrirFenetre(`
      <div class="fenetre__haut">
        <h2>${accueil ? 'Une journée aux Glycines' : 'Missions'}</h2>
        <button type="button" class="bouton bouton--petit" data-action="fermer" aria-label="Fermer">×</button>
      </div>
      ${accueil ? `<p class="a-lire">Vous êtes agent accompagnant au grand âge dans l'aile B de l'EHPAD Les Glycines. Choisissez une mission. Vous pouvez aussi fermer cette fenêtre pour explorer l'aile.</p>` : ''}
      <label class="choix-sequence">Séquence vue en cours
        <select name="sequence">
          ${SEQUENCES.map((s) => `<option ${s === sequenceVue ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </label>
      ${liste.length === 0 ? '<p class="indice">Aucune mission validée pour l\'instant.</p>' : ''}
      <ul class="liste-missions">
        ${liste.map((m) => {
          const niveaux = liens.niveauxObtenus?.(m.id);
          const ouverte = estDebloquee(m, sequenceVue);
          return `
          <li>
            <button type="button" class="carte-mission" data-mission="${echapper(m.id)}" ${ouverte ? '' : 'disabled'}>
              <strong>${ouverte ? '' : '🔒 '}${echapper(m.titre)}</strong>
              <span>${m.duree_min} min · ${ouverte ? `séquence ${echapper(m.sequence_requise)}` : `après la séquence ${echapper(m.sequence_requise)}`}${m.statut === 'brouillon' ? ' · <em>brouillon</em>' : ''}</span>
              ${niveaux ? `<span class="niveaux">Dernière relève : ${echapper(niveaux)}</span>` : ''}
            </button>
          </li>`;
        }).join('')}
      </ul>`);
    fenetre.querySelector<HTMLSelectElement>('select[name="sequence"]')!.addEventListener('change', (e) => {
      liens.changerSequence((e.target as HTMLSelectElement).value);
      ouvrirListe(accueil);
    });
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
            <span class="releve__sens">${echapper(contenu.referentiel.niveaux[c.niveau])}</span></span>
          </li>`).join('')}
      </ul>
      <h3>Pour le débriefing</h3>
      <ol class="debriefing">${b.debriefing.map((q) => `<li class="a-lire">${echapper(q)}</li>`).join('')}</ol>
      <div class="rangee-boutons">
        <button type="button" class="bouton bouton--texte" data-action="imprimer-fiche">🖨 Imprimer ma fiche</button>
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
    const m = contenu.missions.find((x) => x.id === b.mission)!;
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
        <thead><tr><th>Compétence</th><th>Critère officiel</th><th>Niveau</th></tr></thead>
        <tbody>${b.competences.map((c) => `
          <tr><td>${echapper(c.code)}</td><td>${echapper(c.critere)}</td>
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

  fenetre.addEventListener('click', (evenement) => {
    const cible = (evenement.target as HTMLElement).closest<HTMLElement>('button');
    if (!cible) return;
    if (cible.dataset.action === 'fermer') fenetre.hidden = true;
    if (cible.dataset.action === 'imprimer-fiche' && dernierBilan) imprimerFiche(dernierBilan);
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
  };
}
