// Testkatalog laut MVP-Übergabe v0.1, Abschnitt 4.
// Die Anleitungen sind knapp gehalten und vor dem Einsatz mit dem Konzept-Dokument abzugleichen.
import type { TestId, Timepoint } from './types';

export interface TestDef {
  id: TestId;
  name: string;
  group: string;
  short: string;
  steps: string[];
  /** Was die App als Vergleich zeigt */
  comparison: string;
  needsStopwatch: boolean;
}

/** Reihenfolge am Testtag: Ruhepuls → Beweglichkeit → Balance → Kraft → Gehtest zuletzt. */
export const TESTS: TestDef[] = [
  {
    id: 'T1', name: 'Ruhepuls', group: 'Ruhepuls',
    short: 'Morgens, an 5–7 Tagen',
    steps: [
      'Morgens messen, in Ruhe und immer in derselben Position.',
      'Puls zählen oder vom Gerät ablesen und in Schlägen pro Minute eintragen.',
      'Wiederhole das an 5–7 Morgen. Die Baseline ist der mittlere Wert (Median).',
    ],
    comparison: 'Kein Vergleichswert, nur dein Verlauf.',
    needsStopwatch: false,
  },
  {
    id: 'T5', name: 'Knie-zur-Wand', group: 'Beweglichkeit',
    short: 'Abstand Zehen zur Wand, je Seite',
    steps: [
      'Barfuß vor eine Wand stellen, ein Fuß vorn.',
      'Knie zur Wand bringen, die Ferse bleibt am Boden.',
      'Den größten Abstand Zehen zur Wand messen, bei dem das Knie die Wand noch berührt.',
      'Beide Seiten messen.',
    ],
    comparison: 'Ab ca. 1,5 cm Seitenunterschied zeigt die App einen Hinweis, keine Bewertung.',
    needsStopwatch: false,
  },
  {
    id: 'T7', name: 'Chair Sit-and-Reach', group: 'Beweglichkeit',
    short: 'Abstand Finger zu Zehen im Sitzen, je Seite',
    steps: [
      'Vorn auf einen stabilen Stuhl setzen, ein Bein gestreckt, Ferse am Boden.',
      'Mit den Händen langsam Richtung Zehen reichen, ohne zu wippen.',
      'Abstand Fingerspitzen zu Zehen messen: Lücke = negativ, darüber hinaus = positiv.',
      'Beide Seiten messen.',
    ],
    comparison: 'Kein Vergleichswert, nur dein Verlauf.',
    needsStopwatch: false,
  },
  {
    id: 'T4', name: 'Einbeinstand', group: 'Balance',
    short: '3 Versuche je Bein, Augen offen',
    steps: [
      'Neben eine Wand oder einen Stuhl stellen, um dich bei Bedarf abzustützen.',
      'Augen offen, auf ein Bein stellen und die Stoppuhr starten.',
      'Stoppen, wenn der Fuß den Boden berührt oder du dich abstützt. Höchstens 45 Sekunden.',
      'Je Bein 3 Versuche. Die beste Zeit zählt.',
    ],
    comparison: 'Für 40–59 Jahre: Mittelwert des besten Versuchs laut Springer 2007, ohne Streuung.',
    needsStopwatch: true,
  },
  {
    id: 'T3', name: '30-s-Sit-to-Stand', group: 'Kraft',
    short: 'Aufstehen in 30 Sekunden',
    steps: [
      'Auf einen stabilen Stuhl ohne Rollen setzen, Arme vor der Brust verschränkt.',
      'Stoppuhr starten und 30 Sekunden lang so oft wie möglich ganz aufstehen und wieder hinsetzen.',
      'Anzahl eintragen. Wer die Arme zu Hilfe nimmt, bekommt den Wert 0.',
    ],
    comparison: 'Kein Vergleichswert (Normen gibt es erst ab 60 Jahren).',
    needsStopwatch: true,
  },
  {
    id: 'T8', name: 'Liegestütz', group: 'Kraft',
    short: 'Wiederholungen, Zehen oder Knie',
    steps: [
      'Variante wählen: auf den Zehen oder auf den Knien.',
      'Sauber ausgeführte Wiederholungen zählen, bis du aufhörst.',
      'Anzahl und Abbruchgrund eintragen.',
    ],
    comparison: 'Vergleichswert noch offen; bei Frauen wird keiner angezeigt.',
    needsStopwatch: false,
  },
  {
    id: 'T2', name: 'UKK-2-km-Gehtest', group: 'Gehtest',
    short: '2 km zügig gehen, zuletzt',
    steps: [
      'Auf einer flachen, abgemessenen Strecke von 2 km gehen, so zügig wie gleichmäßig möglich. Nicht laufen.',
      'Zeit stoppen.',
      'Direkt am Ende den Puls messen.',
      'Minuten, Sekunden und Puls eintragen.',
    ],
    comparison: 'Fitness-Index für Männer von 20–65 Jahren. Bei Frauen vorerst nur die Gehzeit.',
    needsStopwatch: true,
  },
];

export function testDef(id: TestId): TestDef {
  const t = TESTS.find((x) => x.id === id);
  if (!t) throw new Error(`Unbekannter Test ${id}`);
  return t;
}

export const TIMEPOINTS: { id: Timepoint; label: string }[] = [
  { id: 'baseline', label: 'Baseline' },
  { id: 'tag30', label: 'Tag 30' },
  { id: 'tag90', label: 'Tag 90' },
];

export function timepointLabel(t: Timepoint): string {
  return TIMEPOINTS.find((x) => x.id === t)!.label;
}

/** Abbruchregeln für jeden Test. [OFFEN] sportmedizinische Freigabe. */
export const STOP_RULES = [
  'Brustschmerz',
  'Schwindel oder Gefühl, ohnmächtig zu werden',
  'neu auftretende starke Atemnot',
  'ungeklärte Herzbeschwerden (z. B. Herzstolpern, Herzrasen)',
];

export const PARQ_URL = 'https://eparmedx.com/';
export const PARQ_ATTRIBUTION =
  'PAR-Q+ © PAR-Q+ Collaboration, lizenziert unter CC BY-NC-ND 4.0. Verwendung nur im privaten, nicht-kommerziellen Test.';
export const GATE_VALID_MONTHS = 12;
