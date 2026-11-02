// Gesamtablauf der App: 1 Profil → 2 Anamnese → 3 Testmappe → 4 Gesundheitsmodul → 5 Auswertung und Übungsplan.
// Das Gesundheitsmodul ist das Herzstück: Aus Anamnese, Testwerten, Blutwerten, Beschwerden und Wearable-Daten
// entsteht der Übungsplan.
import { anamnesisValid, latestAnamnesis } from './parq';
import { nextStep } from './results';
import { testDef } from './tests';
import type { AppData } from './types';
import { EMPTY_HEALTH } from './health/types';

export type StepId = 'profil' | 'anamnese' | 'testmappe' | 'gesundheit' | 'auswertung';
export type StepStatus = 'erledigt' | 'offen' | 'wartet' | 'gesperrt';

export interface HealthItem {
  id: 'einwilligung' | 'befunde' | 'wearable' | 'beschwerden';
  label: string;
  done: boolean;
  required: boolean;
}

export interface JourneyStep {
  id: StepId;
  title: string;
  status: StepStatus;
  detail: string;
}

export interface Journey {
  steps: JourneyStep[];
  /** Erster Schritt, bei dem jetzt etwas zu tun ist (null = alles erledigt) */
  current: JourneyStep | null;
  healthItems: HealthItem[];
}

export function healthItems(data: AppData): HealthItem[] {
  const h = data.health ?? EMPTY_HEALTH;
  return [
    { id: 'einwilligung', label: 'Einwilligung für Gesundheitsdaten', done: !!h.consent, required: true },
    { id: 'befunde', label: 'Blutwerte aus dem Befund', done: h.values.length > 0, required: true },
    { id: 'wearable', label: 'Oura verbinden oder Daten einlesen (Schlaf, HRV, Ruhepuls, VO2max)', done: !!h.oura || h.wearables.length > 0, required: false },
    { id: 'beschwerden', label: 'Beschwerden, falls vorhanden', done: h.complaints.length > 0, required: false },
  ];
}

export function computeJourney(data: AppData, today: string): Journey {
  const steps: JourneyStep[] = [];
  steps.push({ id: 'profil', title: 'Profil', status: data.profile ? 'erledigt' : 'offen', detail: data.profile ? `Teilnehmer-ID ${data.profile.participantId}` : 'Alter, Geschlecht, Größe, Gewicht' });

  const anamnesisOk = anamnesisValid(latestAnamnesis(data.anamneses), today);
  steps.push({ id: 'anamnese', title: 'Anamnese', status: anamnesisOk ? 'erledigt' : 'offen', detail: anamnesisOk ? 'freigegeben' : 'Fragebogen PAR-Q+, ca. 5 Minuten' });

  const n = nextStep(data.records, 'baseline', today);
  let testStatus: StepStatus;
  let testDetail: string;
  if (!anamnesisOk) {
    testStatus = 'gesperrt'; testDetail = 'nach der Anamnese';
  } else if (n.kind === 'fertig') {
    testStatus = 'erledigt'; testDetail = 'Baseline abgeschlossen';
  } else if (n.kind === 'test') {
    testStatus = 'offen'; testDetail = `nächster Test: ${testDef(n.testId).name}`;
  } else if (n.doneToday) {
    testStatus = 'wartet'; testDetail = `Ruhepuls morgen früh, ${n.measured} von ${n.needed} Morgen`;
  } else {
    testStatus = 'offen'; testDetail = `Ruhepuls messen, ${n.measured} von ${n.needed} Morgen`;
  }
  steps.push({ id: 'testmappe', title: 'Testmappe', status: testStatus, detail: testDetail });

  const items = healthItems(data);
  const required = items.filter((i) => i.required);
  const healthDone = required.every((i) => i.done);
  const openItems = items.filter((i) => !i.done && i.required).map((i) => i.label);
  const healthStatus: StepStatus = !anamnesisOk ? 'gesperrt' : healthDone ? 'erledigt' : 'offen';
  steps.push({
    id: 'gesundheit', title: 'Gesundheitsdaten', status: healthStatus,
    detail: healthStatus === 'gesperrt' ? 'nach der Anamnese' : healthDone ? 'Blutwerte erfasst' : `offen: ${openItems.join(', ')}`,
  });

  const ready = anamnesisOk && healthDone && (testStatus === 'erledigt' || testStatus === 'wartet');
  steps.push({ id: 'auswertung', title: 'Auswertung und Übungsplan', status: ready ? 'offen' : 'gesperrt', detail: ready ? 'dein Plan aus allen Daten' : 'wenn Tests und Gesundheitsdaten vorliegen' });

  const current = steps.find((s) => s.status === 'offen' && s.id !== 'auswertung') ?? steps.find((s) => s.status === 'offen') ?? null;
  return { steps, current, healthItems: items };
}
