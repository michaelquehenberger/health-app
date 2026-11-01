import type { Sex } from './calc';

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
}

/** Sicherheits-Gate nach PAR-Q+ (Bestätigung, das Formular selbst wird offiziell ausgefüllt). */
export interface Gate {
  status: 'freigegeben' | 'gesperrt';
  /** Wie die Freigabe zustande kam */
  via: 'parq-alle-nein' | 'folgefragen-alle-nein' | 'eparmedx-oder-fachperson' | null;
  date: string; // ISO-Datum
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
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  method: string;
  quality: Quality;
  comment: string;
  /** Abbruchgrund, wenn der Test abgebrochen wurde */
  aborted: string | null;
  inputs: Record<string, InputValue>;
  measurements: Measurement[];
}

export interface AppData {
  version: 2;
  consent: Consent | null;
  profile: Profile | null;
  gate: Gate | null;
  records: TestRecord[];
}
