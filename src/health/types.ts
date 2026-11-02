import type { Region } from './data/exercises';
import type { Course, DurationKey, Quality, Side } from './logic/complaints';
import type { Consent } from '../types';

/** Profil für das Gesundheitsmodul. Kein Name: Die App arbeitet mit der Teilnehmer-ID aus dem Fitness-Profil. */
export interface HealthProfile {
  age: number | null;
  sex: 'weiblich' | 'maennlich' | 'divers' | '';
  diet: string;
  allergies: string;
  medications: string;
  /** Herz- oder Nierenerkrankung bzw. ärztliche Trinkvorgabe: dann keine Trinkmenge. */
  fluidRestriction: boolean;
  experience: 'wenig' | 'mittel' | 'viel';
  minutesPerDay: number;
  rhythm: 'taeglich' | 'woechentlich';
}

export type ComplaintType = 'steifigkeit' | 'schwaeche' | 'belastungsschmerz' | 'druck' | 'stechen' | 'misch';

export interface RedFlagAnswers {
  /** Gelenk plötzlich stark schmerzhaft, heiß, geschwollen oder gerötet, nicht belastbar */
  acuteHotJoint: boolean;
  fever: boolean;
  injury: boolean;
  /** Schüttelfrost, Gewichtsverlust, Nachtschweiß */
  systemic: boolean;
  /** Taubheit, Kribbeln, Kraftverlust */
  neuro: boolean;
  suddenOnset: boolean;
  /** Rücken: Lähmung, Blasen- oder Darmstörung */
  caudaEquina: boolean;
  chestPain: boolean;
  multipleSwollenJoints: boolean;
  longMorningStiffness: boolean;
}

export interface Complaint {
  id: string;
  date: string; // ISO-Datum YYYY-MM-DD
  region: Region;
  type: ComplaintType;
  since: string;
  intensity: number; // 0–10
  swellingOrWarmth: boolean;
  redFlags: RedFlagAnswers;
  active: boolean;
  /** Genauere Angaben (seit Version 0.6, bei älteren Einträgen leer) */
  side?: Side;
  qualities?: Quality[];
  timing?: string[];
  triggers?: string[];
  duration?: DurationKey;
  course?: Course;
}

export interface LabReport {
  id: string;
  date: string;
  lab: string;
}

export interface LabValue {
  id: string;
  reportId: string;
  marker: string; // Schlüssel aus MARKERS
  value: number;
  unit: string;
  refLow: number | null;
  refHigh: number | null;
}

export interface Feedback {
  date: string;
  painBefore: number | null;
  painAfter: number | null;
  painMorning: number | null; // am nächsten Morgen
  swelling: boolean;
  done: string[]; // abgehakte Übungs-IDs
  drinkMl?: number;
}

export interface DayCardRecord {
  date: string;
  exerciseIds: string[];
  level: number;
  rulesVersion: string;
}

/** Ein Tag mit Wearable-Daten. Fehlende Werte bleiben null; die App schätzt nichts. */
export interface WearableDay {
  date: string; // YYYY-MM-DD
  source: 'oura' | 'datei';
  sleepHours: number | null;
  sleepScore: number | null;
  readiness: number | null;
  restingHr: number | null;
  hrv: number | null;
  /** VO2max laut Oura (ml/kg/min); fehlt bei älteren Einträgen */
  vo2max?: number | null;
}

export interface OuraConnection {
  clientId: string;
  accessToken: string;
  /** ISO-Zeitpunkt, ab dem der Zugang erneuert werden muss (Oura ohne Server: 30 Tage) */
  expiresAt: string;
  lastSync: string | null;
}

export interface HealthState {
  /** Eigene Einwilligung für Befunde, Beschwerden und Wearable-Daten (getrennt von der Grund-Einwilligung). */
  consent: Consent | null;
  profile: HealthProfile;
  complaints: Complaint[];
  reports: LabReport[];
  values: LabValue[];
  feedback: Feedback[];
  dayCards: DayCardRecord[];
  wearables: WearableDay[];
  oura: OuraConnection | null;
  /** Einwilligung, dass Befund-Dateien zur Auslesung an den KI-Anbieter gehen (getrennt von der Gesundheits-Einwilligung) */
  aiConsent?: Consent | null;
}

export const EMPTY_HEALTH_PROFILE: HealthProfile = {
  age: null, sex: '', diet: '', allergies: '', medications: '', fluidRestriction: false,
  experience: 'wenig', minutesPerDay: 10, rhythm: 'taeglich',
};

export const EMPTY_HEALTH: HealthState = {
  consent: null,
  profile: EMPTY_HEALTH_PROFILE,
  complaints: [], reports: [], values: [], feedback: [], dayCards: [], wearables: [], oura: null,
};
