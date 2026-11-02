// Testkatalog laut MVP-Übergabe v0.1, Abschnitt 4.
// Jede Anleitung nennt Ausgangsposition, Versuche, Start und Abbruch, Ergebnisformat und Vergleichswert.
// Vor dem Einsatz mit dem Konzept-Dokument (health-app-livion-konzept.md) abgleichen.
import type { TestId, Timepoint } from './types';

/** Version der Testprotokolle; wird mit jeder Messung gespeichert. Bei Änderungen an Ablauf oder Grenzen erhöhen. */
export const PROTOCOL_VERSION = 'v0.4';

export interface TestDef {
  id: TestId;
  name: string;
  group: string;
  short: string;
  /** Ausgangsposition und erlaubte Hilfe */
  setup: string;
  /** Versuche bzw. Seiten */
  attempts: string;
  /** Ablauf in Schritten */
  steps: string[];
  /** Wann der Versuch endet */
  stop: string;
  /** Einheit und Format des Ergebnisses */
  result: string;
  /** Was die App als Vergleich zeigt */
  comparison: string;
  needsStopwatch: boolean;
}

/** Reihenfolge am Testtag: Ruhepuls → Beweglichkeit → Balance → Kraft → Gehtest zuletzt. */
export const TESTS: TestDef[] = [
  {
    id: 'T1', name: 'Ruhepuls', group: 'Ruhepuls',
    short: 'Morgens, an 5–7 Tagen',
    setup: 'Morgens in Ruhe, immer in derselben Position (liegend oder sitzend) und mit derselben Methode.',
    attempts: 'Eine Messung pro Morgen, an 5–7 Morgen.',
    steps: [
      'Ruhig liegen oder sitzen bleiben.',
      'Puls zählen oder vom Gerät ablesen.',
      'Wert, Position und Methode eintragen.',
    ],
    stop: 'Bei unregelmäßigem Rhythmus trotzdem eintragen und das Häkchen setzen.',
    result: 'Schläge pro Minute (bpm), ganze Zahl. Die Baseline ist der Median aus 5–7 Morgen.',
    comparison: 'Kein Vergleichswert, nur dein Verlauf.',
    needsStopwatch: false,
  },
  {
    id: 'T5', name: 'Knie-zur-Wand', group: 'Beweglichkeit',
    short: 'Abstand Zehen zur Wand, je Seite',
    setup: 'Barfuß vor einer Wand, ein Fuß vorn. Mit den Händen an der Wand abstützen ist erlaubt.',
    attempts: 'Je Seite einmal den größten Abstand bestimmen; links und rechts getrennt.',
    steps: [
      'Knie Richtung Wand bringen, die Ferse bleibt am Boden.',
      'Fuß schrittweise weiter von der Wand wegsetzen.',
      'Den größten Abstand Zehen zur Wand messen, bei dem das Knie die Wand noch berührt.',
    ],
    stop: 'Ende, wenn die Ferse abhebt oder das Knie die Wand nicht mehr erreicht. Hebt die Ferse ab, Häkchen setzen.',
    result: 'Zentimeter je Seite, eine Nachkommastelle.',
    comparison: 'Kein Vergleichswert. Ab ca. 1,5 cm Seitenunterschied zeigt die App einen Hinweis, keine Bewertung.',
    needsStopwatch: false,
  },
  {
    id: 'T7', name: 'Chair Sit-and-Reach', group: 'Beweglichkeit',
    short: 'Abstand Finger zu Zehen im Sitzen, je Seite',
    setup: 'Vorn auf einem stabilen Stuhl sitzen, ein Bein gestreckt, Ferse am Boden, das andere Bein angewinkelt.',
    attempts: 'Je Seite einmal; links und rechts getrennt.',
    steps: [
      'Hände übereinander legen.',
      'Langsam Richtung Zehen reichen, ohne zu wippen, und kurz halten.',
      'Abstand Fingerspitzen zu Zehen messen.',
    ],
    stop: 'Ende bei Schmerz oder wenn das gestreckte Knie sich beugt. Schmerz bitte ankreuzen.',
    result: 'Zentimeter je Seite: Lücke = negativ (z. B. −5), über die Zehen hinaus = positiv.',
    comparison: 'Kein Vergleichswert, nur dein Verlauf.',
    needsStopwatch: false,
  },
  {
    id: 'T4', name: 'Einbeinstand', group: 'Balance',
    short: '3 Versuche je Bein, Augen offen',
    setup: 'Neben einer Wand oder einem Stuhl, um dich bei Bedarf abzustützen. Augen offen.',
    // Entschieden 02.11.2026: 3 Versuche (Springer-Vergleich beruht auf „beste von 3“), siehe docs/entscheidungen.md
    attempts: '3 Versuche je Bein, links und rechts getrennt, mit 60 Sekunden Pause zwischen den Versuchen. Die beste Zeit je Bein zählt.',
    steps: [
      'Auf ein Bein stellen und die Stoppuhr starten.',
      'Möglichst ruhig stehen bleiben.',
      'Stoppen und die gehaltene Zeit eintragen.',
    ],
    stop: 'Ende, wenn der Fuß absetzt, du dich abstützt oder deutlich das Gleichgewicht verlierst. Spätestens nach 45 Sekunden.',
    result: 'Sekunden je Versuch, eine Nachkommastelle; höchstens 45 s.',
    comparison: 'Deine eigene Haltezeit und ihr Verlauf. Für 40–59 Jahre zusätzlich der Mittelwert des besten Versuchs laut Springer 2007, ohne Streuung und ohne Bewertung.',
    needsStopwatch: true,
  },
  {
    id: 'T3', name: '30-s-Sit-to-Stand', group: 'Kraft',
    short: 'Aufstehen in 30 Sekunden',
    setup: 'Stabiler Stuhl ohne Rollen, an eine Wand gestellt. Arme vor der Brust verschränkt.',
    attempts: 'Ein Versuch.',
    steps: [
      'Stoppuhr starten.',
      '30 Sekunden lang so oft wie möglich ganz aufstehen und wieder hinsetzen.',
      'Vollständige Wiederholungen zählen.',
    ],
    stop: 'Ende nach 30 Sekunden oder früher bei einem Abbruchgrund. Wer die Arme zu Hilfe nimmt, bekommt den Wert 0.',
    result: 'Anzahl vollständiger Wiederholungen, ganze Zahl.',
    comparison: 'Kein Vergleichswert (Normen gibt es erst ab 60 Jahren).',
    needsStopwatch: true,
  },
  {
    id: 'T8', name: 'Liegestütz', group: 'Kraft',
    short: 'Wiederholungen, Zehen oder Knie',
    setup: 'Variante wählen: auf den Zehen oder auf den Knien. Körper bildet eine gerade Linie.',
    attempts: 'Ein Versuch, ohne Pause.',
    steps: [
      'Hände etwa schulterbreit aufsetzen.',
      'Brust kontrolliert Richtung Boden senken und wieder hochdrücken.',
      'Korrekt ausgeführte Wiederholungen zählen.',
    ],
    stop: 'Ende bei Erschöpfung, wenn die Technik nicht mehr sauber ist oder bei Schmerz. Grund bitte auswählen.',
    result: 'Anzahl korrekt ausgeführter Wiederholungen, ganze Zahl, mit Variante.',
    comparison: 'Vergleichswert derzeit nicht verfügbar. Die Anzahl der korrekt ausgeführten Liegestütze wird gespeichert.',
    needsStopwatch: false,
  },
  {
    id: 'T2', name: 'UKK-2-km-Gehtest', group: 'Gehtest',
    short: '2 km zügig gehen, zuletzt',
    setup: 'Flache, abgemessene Strecke von 2 km. Gehen, nicht laufen.',
    attempts: 'Ein Versuch, als letzter Test des Tages.',
    steps: [
      'Stoppuhr starten und so zügig wie gleichmäßig möglich gehen.',
      'Am Ende die Zeit stoppen.',
      'Direkt danach den Puls messen.',
    ],
    stop: 'Ende nach 2 km oder früher bei einem Abbruchgrund.',
    result: 'Gehzeit in Minuten und Sekunden, Puls am Ende in bpm, dazu Größe und Gewicht.',
    comparison: 'Fitness-Index mit Bewertung für Erwachsene von 20–65 Jahren. Außerhalb dieses Alters oder bei eingeschränktem Gehen nur Gehzeit und Puls als Verlauf.',
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

/**
 * Abbruchregeln für jeden Test (Übergabe v0.4, Abschnitt 5.6). Zentrale Konstante, nur hier pflegen.
 * Quellen: LIVION-Handbuch, ACSM-Warnzeichen, konsolidierte Punktliste. [OFFEN] sportmedizinische Freigabe.
 */
export const STOP_RULES = [
  'Brustschmerz, Brustdruck oder Engegefühl',
  'Atemnot, die außer Verhältnis zur Belastung steht',
  'Schwindel, Benommenheit, Gefühl kurz vor der Ohnmacht oder Ohnmacht',
  'Ungewöhnliches Herzrasen, Herzklopfen oder unregelmäßiger Puls',
  'Neue oder sich verändernde Schmerzen in Brust, Nacken, Kiefer, Rücken oder Armen',
  'Starke unerwartete Erschöpfung, Übelkeit oder kalter, klebriger Schweiß',
  'Ungeklärte Herzsymptome',
] as const;

