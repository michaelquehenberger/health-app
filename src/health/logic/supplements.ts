// Supplement-Infokarten für den privaten Test. Regeln (Auswertungslogik, Abschnitt Ernährung/Supplements):
// nur Wirkstoff und Studienlage, nie eine Dosis, immer mit Hinweis auf Arzt oder Apotheke,
// nur nach niedrigem Laborwert, nie bei Medikamenten im Profil oder auffälligen Leber- oder Nierenwerten.
// Die Belege stammen aus PubMed (PMID und DOI angegeben). Entwurf, nicht rechtlich geprüft.
import type { HealthProfile, LabValue } from '../types';
import type { Region } from '../data/exercises';
import { evaluateValue, kidneyValuesOutside } from './labs';

export interface EvidenceRef {
  label: string;
  pmid?: string;
  doi?: string;
  url: string;
  studyType: string;
  year: number;
  finding: string;
}

export interface SupplementCard {
  id: string;
  title: string;
  /** Warum die Karte erscheint */
  trigger: string;
  summary: string;
  evidence: EvidenceRef[];
  note: string;
}

export interface SupplementInfo {
  /** Gründe, warum keine Karten gezeigt werden (leer = Karten erlaubt) */
  blocked: string[];
  cards: SupplementCard[];
}

const pubmed = (pmid: string) => `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;

const CARDS: Record<string, SupplementCard> = {
  vitd: {
    id: 'vitd',
    title: 'Vitamin D',
    trigger: 'Dein Vitamin-D-Wert liegt unter dem Laborbereich.',
    summary: 'Ob eine Ergänzung sinnvoll ist, entscheidet die Arztpraxis anhand deines Werts und deiner Situation. Eine Dosis nennt die App nicht.',
    evidence: [
      { label: 'Int J Surg 2017', pmid: '28797917', doi: '10.1016/j.ijsu.2017.08.010', url: pubmed('28797917'), studyType: 'Metaanalyse von 4 Studien (1136 Personen)', year: 2017, finding: 'Bei Knie-Arthrose weniger Schmerz und bessere Funktion, aber kein Effekt auf das Knorpelvolumen.' },
      { label: 'Clin Biochem 2017', pmid: '28888878', doi: '10.1016/j.clinbiochem.2017.09.001', url: pubmed('28888878'), studyType: 'Systematische Übersicht mit Metaanalyse', year: 2017, finding: 'Kleiner bis mittlerer Effekt auf den Schmerz bei Knie-Arthrose, kein Effekt auf Knorpel oder Gelenkspalt; ein klinisch bedeutsamer Effekt ist unsicher.' },
    ],
    note: 'Die Studien betreffen Knie-Arthrose. Die Ursache deiner Beschwerden ist offen.',
  },
  eisen: {
    id: 'eisen',
    title: 'Eisen',
    trigger: 'Dein Ferritin liegt unter dem Laborbereich.',
    summary: 'Ein niedriger Eisenspeicher braucht zuerst eine ärztliche Ursachenklärung. Ob und wie Eisen ergänzt wird, entscheidet die Arztpraxis. Eine Dosis nennt die App nicht.',
    evidence: [
      { label: 'BMJ Open 2018', pmid: '29626044', doi: '10.1136/bmjopen-2017-019240', url: pubmed('29626044'), studyType: 'Systematische Übersicht von Studien', year: 2018, finding: 'Bei Erwachsenen mit Eisenmangel ohne Blutarmut weniger empfundene Müdigkeit, aber keine messbare Verbesserung der körperlichen Leistungsfähigkeit.' },
      { label: 'Cochrane 2016', pmid: '27087396', doi: '10.1002/14651858.CD009747.pub2', url: pubmed('27087396'), studyType: 'Cochrane-Übersicht (Frauen mit Monatsblutung)', year: 2016, finding: 'Tägliches Eisen hebt Eisenspeicher und verringert Müdigkeit, geht aber mit mehr Magen-Darm-Beschwerden einher.' },
    ],
    note: 'Eisen nie auf eigene Faust einnehmen.',
  },
  b12: {
    id: 'b12',
    title: 'Vitamin B12',
    trigger: 'Dein Vitamin-B12-Wert liegt unter dem Laborbereich.',
    summary: 'Die Ursache eines niedrigen Werts klärt die Arztpraxis; sie entscheidet auch, ob Tabletten oder eine Spritze infrage kommen. Eine Dosis nennt die App nicht.',
    evidence: [
      { label: 'Cochrane 2018', pmid: '29543316', doi: '10.1002/14651858.CD004655.pub3', url: pubmed('29543316'), studyType: 'Cochrane-Übersicht', year: 2018, finding: 'Tabletten und Spritzen normalisieren den B12-Spiegel ähnlich gut (Studienqualität niedrig); Tabletten sind günstiger.' },
    ],
    note: 'Die Übersicht misst den Blutspiegel, nicht deine Beschwerden.',
  },
  glucosamin: {
    id: 'glucosamin',
    title: 'Glucosamin (nicht empfohlen)',
    trigger: 'Häufig gefragt bei Gelenkbeschwerden.',
    summary: 'Die NICE-Leitlinie empfiehlt Glucosamin bei Arthrose nicht, weil es keinen starken Nutzenbeleg gibt.',
    evidence: [
      { label: 'NICE NG226, 2022', url: 'https://www.nice.org.uk/guidance/ng226/chapter/Recommendations', studyType: 'Leitlinie', year: 2022, finding: 'Glucosamin soll nicht angeboten werden; es gibt keinen starken Nutzenbeleg.' },
      { label: 'Br J Sports Med 2017', pmid: '29018060', doi: '10.1136/bjsports-2016-097333', url: pubmed('29018060'), studyType: 'Metaanalyse (20 Mittel, 69 Studien)', year: 2017, finding: 'Glucosamin und Chondroitin waren unwirksam oder zeigten kleine, kaum bedeutsame Effekte; die Belegqualität der Mittel insgesamt war sehr niedrig.' },
    ],
    note: 'Sprich vor jedem Kauf mit Arzt oder Apotheke.',
  },
};

const GLUCOSAMINE_REGIONS: Region[] = ['knie', 'huefte', 'hand'];

function lowValue(latest: Map<string, LabValue>, key: string): boolean {
  const v = latest.get(key);
  if (!v) return false;
  const e = evaluateValue(v);
  return e.status === 'ausserhalb' && e.direction === 'niedrig';
}

export function supplementInfo(latest: Map<string, LabValue>, profile: HealthProfile, activeRegions: Region[]): SupplementInfo {
  const blocked: string[] = [];
  if (profile.medications.trim()) blocked.push('Medikamente im Profil');
  const liverOut = ['got', 'gpt', 'ggt'].some((k) => {
    const v = latest.get(k);
    return v ? evaluateValue(v).status === 'ausserhalb' : false;
  });
  if (liverOut) blocked.push('Leberwerte außerhalb');
  if (kidneyValuesOutside(latest)) blocked.push('Nierenwerte außerhalb');
  if (blocked.length) return { blocked, cards: [] };

  const cards: SupplementCard[] = [];
  if (lowValue(latest, 'vitd')) cards.push(CARDS.vitd);
  if (lowValue(latest, 'ferritin')) cards.push(CARDS.eisen);
  if (lowValue(latest, 'b12')) cards.push(CARDS.b12);
  if (activeRegions.some((r) => GLUCOSAMINE_REGIONS.includes(r))) cards.push(CARDS.glucosamin);
  return { blocked, cards };
}
