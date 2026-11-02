import type { Sex } from './calc';
import type { Anamnesis } from './parq';
import type { HealthState } from './health/types';

export interface Profile {
  /** Pseudonym, keine Namen speichern. */
  participantId: string;
  age: number | null;
  sex: Sex;
  heightCm: number | null;
  weightKg: number | null;
  goal: string;
}

export interface Consent {
  acceptedAt: string;
  textVersion: string;
  appVersion?: string;
  language?: string;
}

export type Timepoint = 'baseline' | 'tag30' | 'tag90';
export type Quality = 'A' | 'B' | 'C';
export type TestId = 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T7' | 'T8';

export interface Measurement {
  metric: string;
  unit: string;
  value: number | null;
}

export type InputValue = number | string | boolean | null;

export interface TestRecord {
  id: string;
  testId: TestId;
  timepoint: Timepoint;
  /** Ob der Messzeitpunkt dem Vorschlag der App folgte oder manuell gewählt wurde */
  timepointSource?: 'vorschlag' | 'manuell';
  /** Version des Testprotokolls (PROTOCOL_VERSION) */
  protocolVersion?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  method: string;
  quality: Quality;
  comment: string;
  /** Abbruchgrund, wenn der Test abgebrochen wurde */
  aborted: string | null;
  /** Zeitstempel des Abbruchs (ISO) */
  abortedAt?: string;
  inputs: Record<string, InputValue>;
  measurements: Measurement[];
}

export interface AppData {
  version: 2;
  consent: Consent | null;
  profile: Profile | null;
  /** Alle Anamnesen (PAR-Q+), die jüngste gilt. Gesundheitsdaten nach Art. 9 DSGVO. */
  anamneses: Anamnesis[];
  records: TestRecord[];
  settings?: Settings;
  /** Gesundheitsmodul (Beschwerden, Befunde, Tageskarte, Wearables). Fehlt in älteren Sicherungen. */
  health?: HealthState;
}

export interface Settings {
  /** Schalter „Frauenindex“: Kandidatenformel für Frauen anzeigen (vorläufig). Standard: aus. */
  womenIndex: boolean;
}
