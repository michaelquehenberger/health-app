// Übungsdatenbank, übernommen aus „Übungsdatenbank mit Ausführungshinweisen (Entwurf v0.1)“.
// Entwurf, noch nicht klinisch freigegeben. Dosis immer laut Quelle, nie von der App erfunden.

export type Region = 'knie' | 'huefte' | 'schulter' | 'nacken' | 'ruecken' | 'hand';
export type ExerciseKind = 'beweglichkeit' | 'kraeftigung';

export interface Exercise {
  id: string;
  region: Region;
  kind: ExerciseKind;
  name: string;
  instruction: string;
  dose: string;
  watch: string;
}

export interface RegionInfo {
  id: Region;
  label: string;
  sourceLabel: string;
  sourceUrl: string;
  /** Videos und Anleitungen, deutsche zuerst. Keine freie YouTube-Suche: nur diese gepflegte Liste. */
  videos: VideoLink[];
  notes: string[];
}

export interface VideoLink {
  title: string;
  url: string;
  language: 'de' | 'en';
  provider: string;
  /** video = Film, anleitung = Text mit Bildern */
  kind: 'video' | 'anleitung';
  /** Nur gesetzt, wenn die YouTube-ID geprüft ist; dann bettet die App das Video datensparsam ein. */
  youtubeId?: string;
  /** Fachlich gesichtet? Bis dahin false und mit Hinweis angezeigt. */
  reviewed: boolean;
}

const AU = 'https://www.apotheken-umschau.de';
const RL = 'https://www.rheuma-liga.de/fileadmin/user_upload/Dokumente/Mediencenter/Publikationen/Broschueren';

const apothekenGymnastik: VideoLink = { title: 'Gymnastik gegen Arthrose (neun Übungen mit Physiotherapeutin)', url: `${AU}/krankheiten-symptome/gelenks-und-knochenerkrankungen/video-gymnastik-gegen-arthrose-709743.html`, language: 'de', provider: 'Apotheken Umschau', kind: 'video', reviewed: false };
const apothekenGelenke: VideoLink = { title: 'Gymnastik für die Gelenke (neun Übungen, Wirbelsäule und Gelenke)', url: `${AU}/mein-koerper/gelenke/video-gymnastik-fuer-die-gelenke-709187.html`, language: 'de', provider: 'Apotheken Umschau', kind: 'video', reviewed: false };
const rheumaArthrose: VideoLink = { title: 'Bewegungsübungen bei Arthrose (Faltblatt)', url: `${RL}/A7_Bewegungsuebungen_Arthrose.pdf`, language: 'de', provider: 'Deutsche Rheuma-Liga', kind: 'anleitung', reviewed: false };
const rheumaRuecken: VideoLink = { title: 'Bewegungsübungen bei Rückenbeschwerden (Faltblatt)', url: `${RL}/A9_Bewegungsuebungen_Ruecken.pdf`, language: 'de', provider: 'Deutsche Rheuma-Liga', kind: 'anleitung', reviewed: false };
const apothekenHand: VideoLink = { title: 'Übungen bei Hand-Arthrose (Bilder mit Anleitung)', url: `${AU}/krankheiten-symptome/gelenks-und-knochenerkrankungen/arthrose-uebungen-fuer-die-finger-828931.html`, language: 'de', provider: 'Apotheken Umschau', kind: 'anleitung', reviewed: false };

const auk = (title: string, path: string): VideoLink => ({ title, url: `${AUK}/${path}/`, language: 'en', provider: 'Arthritis UK', kind: 'video', reviewed: false });

const AUK = 'https://www.arthritis-uk.org/information-and-support/living-with-arthritis/health-and-wellbeing/exercising-with-arthritis/exercises-for-healthy-joints';

export const REGIONS: RegionInfo[] = [
  {
    id: 'knie',
    label: 'Knie',
    sourceLabel: 'Royal Orthopaedic Hospital',
    sourceUrl: 'https://roh.nhs.uk/services-information/therapy/exercises-for-osteoarthritis-of-the-knee',
    videos: [apothekenGymnastik, auk('Exercises for the knees', 'exercises-for-the-knees')],
    notes: [
      'Schwillt das Knie an: ruhen, hochlagern und 20 Minuten kühlen. Bei heißem, gerötetem Knie gilt die rote Flagge.',
      'Radfahren und Schwimmen sind eine gute Ergänzung; anfangs 5–10 Minuten.',
    ],
  },
  {
    id: 'huefte',
    label: 'Hüfte',
    sourceLabel: 'Royal Orthopaedic Hospital, Arthritis UK',
    sourceUrl: 'https://roh.nhs.uk/services-information/therapy/exercises-for-osteoarthritis-of-the-hip',
    videos: [apothekenGymnastik, auk('Exercises for the hips', 'exercises-for-the-hips')],
    notes: [
      'Alle Übungen sanft und langsam.',
      'Nach einer Hüft-Operation nur nach Absprache mit der Klinik.',
    ],
  },
  {
    id: 'schulter',
    label: 'Schulter',
    sourceLabel: 'Arthritis UK',
    sourceUrl: `${AUK}/exercises-for-the-shoulders/`,
    videos: [rheumaArthrose, auk('Exercises for the shoulders', 'exercises-for-the-shoulders')],
    notes: [
      'Bewegungen, die stark schmerzen, vermeiden. Arm über Schulterhöhe kann sehr schmerzhaft sein.',
      'Steigt der Schmerz beim Üben, aufhören und ärztlichen Rat holen.',
    ],
  },
  {
    id: 'nacken',
    label: 'Nacken',
    sourceLabel: 'Arthritis UK',
    sourceUrl: `${AUK}/exercises-for-the-neck/`,
    videos: [apothekenGelenke, auk('Exercises for the neck', 'exercises-for-the-neck')],
    notes: ['Im Sitzen üben, wegen des Gleichgewichts. Aufrecht sitzen, unteren Rücken mit Kissen stützen.'],
  },
  {
    id: 'ruecken',
    label: 'Rücken',
    sourceLabel: 'Arthritis UK',
    sourceUrl: `${AUK}/exercises-for-the-back/`,
    videos: [rheumaRuecken, apothekenGelenke, auk('Exercises for the back', 'exercises-for-the-back')],
    notes: [
      'Im Alltag in Bewegung bleiben; Schonen verstärkt die Beschwerden meist.',
      'Ist die Bauchlage unangenehm, die Übung weglassen.',
    ],
  },
  {
    id: 'hand',
    label: 'Hand und Handgelenk',
    sourceLabel: 'Arthritis UK, Apotheken Umschau',
    sourceUrl: `${AUK}/exercises-for-the-fingers-hands-and-wrists/`,
    videos: [apothekenHand, auk('Exercises for the fingers, hands and wrists', 'exercises-for-the-fingers-hands-and-wrists')],
    notes: [
      'Bei heißem, geschwollenem Gelenk keine Übungen, sondern ärztliche Abklärung.',
      'Warmes Wasser und ein weicher Schwamm zum Kneten können die Bewegung erleichtern.',
    ],
  },
];

export const EXERCISES: Exercise[] = [
  // Knie
  { id: 'knie-beugen', region: 'knie', kind: 'beweglichkeit', name: 'Knie beugen und strecken (liegend)', instruction: 'Auf dem Rücken, Bein gestreckt; Knie langsam so weit beugen wie angenehm, 10 Sekunden halten, langsam strecken.', dose: '10 Wiederholungen', watch: 'Langsam, nur im schmerzarmen Bereich.' },
  { id: 'knie-oberschenkel', region: 'knie', kind: 'kraeftigung', name: 'Oberschenkel anspannen', instruction: 'Handtuchrolle unter das Knie; Oberschenkel anspannen, Knie strecken, Fuß hebt ab, 5–10 Sekunden halten.', dose: '10 Wiederholungen', watch: 'Knie bleibt auf dem Handtuch.' },
  { id: 'knie-aufstehen', region: 'knie', kind: 'kraeftigung', name: 'Aufstehen vom Stuhl', instruction: 'Arme verschränkt, ohne Hände aufstehen, langsam wieder setzen.', dose: '10 Wiederholungen', watch: 'Knie nicht nach innen oder außen kippen.' },
  { id: 'knie-minibeuge', region: 'knie', kind: 'kraeftigung', name: 'Mini-Kniebeuge am Stuhl', instruction: 'Am Stuhl festhalten, beide Knie beugen, Rücken gerade.', dose: '10 Wiederholungen', watch: 'Nicht tiefer als etwa 45 Grad.' },
  { id: 'knie-zehenstand', region: 'knie', kind: 'kraeftigung', name: 'Zehenstand', instruction: 'Am Stuhl festhalten, auf die Zehenspitzen und zurück.', dose: '10 Wiederholungen', watch: 'Einbeinig erst, wenn das Gleichgewicht passt.' },
  { id: 'knie-stufe', region: 'knie', kind: 'kraeftigung', name: 'Aufstieg auf eine Stufe', instruction: '10-mal mit einem Bein beginnend aufsteigen, dann mit dem anderen.', dose: '10 Wiederholungen je Seite', watch: 'Geländer nutzen.' },
  { id: 'knie-dehnen', region: 'knie', kind: 'beweglichkeit', name: 'Dehnungen (Oberschenkel hinten und vorn, Wade)', instruction: 'Fuß auf Stufe und mit geradem Rücken nach vorn; Handtuch um den Knöchel, Ferse zum Gesäß; Ausfallschritt mit Halt.', dose: '20–30 Sekunden halten, 5 Wiederholungen', watch: 'Kein stechender Schmerz.' },

  // Hüfte
  { id: 'huefte-gesaess', region: 'huefte', kind: 'kraeftigung', name: 'Gesäß anspannen (liegend)', instruction: 'Auf dem Rücken, Beine gestreckt; Gesäß zusammenkneifen, 10 Sekunden halten.', dose: '10 Wiederholungen', watch: 'Beine bleiben gestreckt.' },
  { id: 'huefte-bruecke', region: 'huefte', kind: 'kraeftigung', name: 'Brücke', instruction: 'Rückenlage, Knie gebeugt; Gesäß anspannen, Becken heben, ohne Hohlkreuz.', dose: '10 Wiederholungen, oder 5 Sekunden halten', watch: 'Nicht ins Hohlkreuz gehen.' },
  { id: 'huefte-seite', region: 'huefte', kind: 'kraeftigung', name: 'Hüfte zur Seite (stehend)', instruction: 'Am Stuhl festhalten, Bein seitlich anheben, ohne den Oberkörper zu neigen.', dose: '10 Wiederholungen, oder 5 Sekunden halten, 5-mal je Seite', watch: 'Bein nicht nach außen drehen.' },
  { id: 'huefte-hinten', region: 'huefte', kind: 'kraeftigung', name: 'Hüfte nach hinten (stehend)', instruction: 'Am Stuhl festhalten, Bein bei gestrecktem Knie nach hinten, Gesäß anspannen, 5 Sekunden halten.', dose: 'je Seite wiederholen', watch: 'Nicht nach vorn lehnen.' },
  { id: 'huefte-knieheben', region: 'huefte', kind: 'kraeftigung', name: 'Knie anheben (stehend)', instruction: 'Festhalten, Bein vor dem Körper anheben, langsam senken.', dose: '10 Wiederholungen', watch: 'Knie nicht über Hüfthöhe heben, wenn die Physiotherapie das rät.' },
  { id: 'huefte-kniebrust', region: 'huefte', kind: 'beweglichkeit', name: 'Knie zur Brust (Dehnung)', instruction: 'Auf dem Rücken, Knie nacheinander zur Brust, das andere Bein bleibt gestreckt, ca. 10 Sekunden halten.', dose: '5–10 Wiederholungen', watch: 'Zu schwer: Ferse zum Gesäß gleiten lassen.' },
  { id: 'huefte-sinken', region: 'huefte', kind: 'beweglichkeit', name: 'Knie zur Seite sinken lassen', instruction: 'Auf dem Rücken, Knie gebeugt, Füße hüftbreit; ein Knie zur Seite sinken lassen, zurück.', dose: 'wiederholen', watch: 'Rücken bleibt flach; nicht nach kürzlicher Hüft-OP.' },
  { id: 'huefte-aufstehen', region: 'huefte', kind: 'kraeftigung', name: 'Aufstehen vom Stuhl', instruction: 'Arme verschränkt aufstehen und setzen, langsam und kontrolliert.', dose: '5 Wiederholungen', watch: 'Stuhlhöhe mit Kissen anpassen.' },

  // Schulter
  { id: 'schulter-haltung', region: 'schulter', kind: 'beweglichkeit', name: 'Haltung prüfen', instruction: 'Seitlich vor den Spiegel, Schultern sanft nach oben und hinten gleiten lassen, Kopf und Hals entspannt.', dose: 'vor jeder Übung', watch: 'Startpunkt jeder Schulterübung.' },
  { id: 'schulter-pendel', region: 'schulter', kind: 'beweglichkeit', name: 'Pendelübung', instruction: 'Eine Hand am Stuhl, den anderen Arm locker hängen lassen und sanft vor und zurück sowie im Kreis schwingen.', dose: 'ca. 5-mal, 2–3-mal täglich', watch: 'Als Aufwärmübung geeignet.' },
  { id: 'schulter-blaetter', region: 'schulter', kind: 'kraeftigung', name: 'Schulterblätter zusammenziehen und senken', instruction: 'Schulterblätter 5 Sekunden zusammen, dann 5 Sekunden nach unten ziehen.', dose: '10 Wiederholungen', watch: 'Langsam, ohne die Schultern hochzuziehen.' },
  { id: 'schulter-heben', region: 'schulter', kind: 'beweglichkeit', name: 'Arme heben (Dehnung)', instruction: 'Stehend oder liegend Arme so weit wie angenehm heben, Handflächen zueinander, 5–10 Sekunden halten.', dose: '5 Wiederholungen', watch: 'Nur bis zum angenehmen Bereich.' },
  { id: 'schulter-tisch', region: 'schulter', kind: 'beweglichkeit', name: 'Tischrutsche', instruction: 'Sitzend Hände auf ein Tuch auf dem Tisch, Tuch nach vorn schieben, Kopf sinken lassen, 5 Sekunden halten.', dose: 'wiederholen', watch: 'Gerader Rücken, Neigung aus der Taille.' },
  { id: 'schulter-tuer', region: 'schulter', kind: 'kraeftigung', name: 'Türdruck', instruction: 'Ellenbogen im rechten Winkel, Handrücken am Türrahmen nach außen drücken, 5 Sekunden halten.', dose: '3 Sätze zu 10, je Seite', watch: 'Druck, keine Bewegung.' },

  // Nacken
  { id: 'nacken-neigen', region: 'nacken', kind: 'beweglichkeit', name: 'Kopf neigen', instruction: 'Sitzend Kopf mit dem Ohr zur Schulter neigen, Nackenmuskeln leicht anspannen, 5 Sekunden halten.', dose: '5-mal je Seite', watch: 'Im Sitzen wegen des Gleichgewichts.' },
  { id: 'nacken-drehen', region: 'nacken', kind: 'beweglichkeit', name: 'Kopf drehen', instruction: 'Sitzend Kopf zur Seite drehen, Kinn auf gleicher Höhe, 5 Sekunden halten.', dose: '5-mal je Seite', watch: 'Bei Unbehagen im Liegen mit gestütztem Kopf.' },
  { id: 'nacken-kinn', region: 'nacken', kind: 'beweglichkeit', name: 'Kinn zur Brust', instruction: 'Sitzend oder stehend Kinn langsam zur Brust, 5 Sekunden halten.', dose: '5-mal', watch: 'Aufrechte Haltung.' },
  { id: 'nacken-blaetter', region: 'nacken', kind: 'kraeftigung', name: 'Schulterblätter zusammenziehen und senken', instruction: 'Schulterblätter 5 Sekunden zusammen, dann 5 Sekunden nach unten ziehen.', dose: '10 Wiederholungen', watch: 'Langsam, ohne die Schultern hochzuziehen.' },

  // Rücken
  { id: 'ruecken-rollen', region: 'ruecken', kind: 'beweglichkeit', name: 'Knie rollen', instruction: 'Auf dem Rücken, Knie gebeugt, Füße zusammen; Knie zu einer Seite rollen, Schultern bleiben am Boden, 10 Sekunden halten.', dose: '3-mal je Seite', watch: 'Schultern flach.' },
  { id: 'ruecken-stabil', region: 'ruecken', kind: 'kraeftigung', name: 'Rückenstabilisierung', instruction: 'Auf allen Vieren, Rücken gerade, Bauch anspannen, einen Arm nach vorn heben, 10 Sekunden halten.', dose: '10-mal je Seite', watch: 'Becken waagrecht, Oberkörper dreht nicht; später statt Arm ein Bein heben.' },
  { id: 'ruecken-bauchlage', region: 'ruecken', kind: 'kraeftigung', name: 'Beinheben in Bauchlage', instruction: 'Kopf zur Seite, Bauch und Gesäß anspannen, ein Bein leicht vom Boden heben.', dose: '5–10 Sekunden halten, 3-mal, dann Seite wechseln', watch: 'Hüften bleiben am Boden.' },
  { id: 'ruecken-dehnen', region: 'ruecken', kind: 'beweglichkeit', name: 'Oberschenkel hinten dehnen', instruction: 'Ein Bein gestreckt auf einen Stuhl, das tragende Knie nach vorn beugen.', dose: '3-mal je Seite', watch: 'Bein bleibt gestreckt.' },
  { id: 'ruecken-ausfall', region: 'ruecken', kind: 'beweglichkeit', name: 'Tiefer Ausfallschritt', instruction: 'Ein Knie am Boden, das andere Bein vorn; Hüfte nach vorn schieben, 5 Sekunden halten.', dose: '3-mal je Seite', watch: 'Oberkörper aufrecht, nicht nach vorn lehnen.' },

  // Hand
  { id: 'hand-kraft', region: 'hand', kind: 'kraeftigung', name: 'Fingerkraft', instruction: 'Handfläche auf ein Handtuch auf dem Tisch, Finger gespreizt; Finger zusammenziehen und die Hand in den Tisch drücken, sodass sich das Handtuch bündelt.', dose: '10-mal je Hand, 3-mal täglich', watch: 'Ohne Schmerz.' },
  { id: 'hand-beugen', region: 'hand', kind: 'beweglichkeit', name: 'Finger beugen', instruction: 'Hand ausstrecken, Finger an den ersten beiden Gelenken beugen und wieder strecken.', dose: '10-mal je Hand, 3-mal täglich', watch: 'Langsam.' },
  { id: 'hand-heben', region: 'hand', kind: 'beweglichkeit', name: 'Hand heben', instruction: 'Unterarm auf den Tisch, Hand über der Kante, Handfläche nach unten; Hand nach oben bis zu einer sanften Dehnung, zurück.', dose: 'wiederholen', watch: 'Handtuchrolle unter dem Handgelenk ist angenehm.' },
  { id: 'hand-welle', region: 'hand', kind: 'beweglichkeit', name: 'Handwelle', instruction: 'Unterarm abstützen, Daumen oben; Handgelenk wie beim Winken auf und ab bewegen.', dose: 'wiederholen', watch: 'Gesamten Bewegungsumfang, ohne Schmerz.' },
  { id: 'hand-faecher', region: 'hand', kind: 'beweglichkeit', name: 'Fingerfächer und Handzeichen', instruction: 'Finger spreizen und wieder zusammenführen; alle Finger nacheinander zum Daumen führen.', dose: 'ohne Angabe in der Quelle', watch: 'Hält die Gelenke beweglich.' },
];

export const GENERAL_RULES: string[] = [
  'Schmerz höchstens 5 von 10 während der Übung; bis zum nächsten Morgen zurück auf das Ausgangsniveau.',
  'Anfangs kann der Gelenkschmerz zunehmen; regelmäßiges Üben lohnt sich trotzdem (NICE).',
  'Langsam und kontrolliert, pro Einheit 3–4 Übungen.',
  'Wenn eine Übung schmerzt: Pause, bis der Schmerz abklingt, dann erneut versuchen.',
  'Bei stechendem oder tiefem Gelenkschmerz stoppen und mit Arzt oder Physio sprechen.',
  'Rücken gerade, Knie nicht nach innen oder außen kippen lassen.',
  'Genug Platz, ein stabiler Stuhl, Wasser in der Nähe.',
  'Nach Operation oder Gelenkersatz: vorher mit der Klinik absprechen.',
];

export function regionInfo(id: Region): RegionInfo {
  const r = REGIONS.find((x) => x.id === id);
  if (!r) throw new Error(`Unbekannte Region: ${id}`);
  return r;
}
