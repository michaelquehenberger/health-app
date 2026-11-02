// Datei-Import für Wearables ohne direkten Zugang (z. B. Garmin: Export aus dem Garmin-Konto, dann hier einlesen).
// Das Format ist unser eigenes einfaches Tabellenformat; der Garmin-Export selbst wurde nicht geprüft.
import type { WearableDay } from '../types';

export const CSV_TEMPLATE = 'Datum;Schlaf_Stunden;Schlaf_Score;Bereitschaft;Ruhepuls;HRV\n2026-11-01;7,2;82;76;56;48\n';

function toNumber(s: string | undefined): number | null {
  if (s === undefined) return null;
  const t = s.trim().replace(',', '.');
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

const ALIASES: Record<string, keyof Omit<WearableDay, 'date' | 'source'>> = {
  schlaf_stunden: 'sleepHours', sleep_hours: 'sleepHours',
  schlaf_score: 'sleepScore', sleep_score: 'sleepScore',
  bereitschaft: 'readiness', readiness: 'readiness',
  ruhepuls: 'restingHr', resting_hr: 'restingHr',
  hrv: 'hrv',
};

export interface CsvResult {
  days: WearableDay[];
  errors: string[];
}

export function parseWearableCsv(text: string): CsvResult {
  const clean = text.replace(/^﻿/, '').trim();
  const lines = clean.split(/\r?\n/).filter((l) => l.trim() !== '');
  const errors: string[] = [];
  if (lines.length < 2) return { days: [], errors: ['Die Datei enthält keine Datenzeilen.'] };
  const delim = lines[0].includes(';') ? ';' : ',';
  const head = lines[0].split(delim).map((h) => h.trim().toLowerCase());
  const dateIdx = head.findIndex((h) => h === 'datum' || h === 'date');
  if (dateIdx < 0) return { days: [], errors: ['Die Spalte „Datum“ fehlt.'] };
  const cols = head.map((h) => ALIASES[h] ?? null);
  const days: WearableDay[] = [];
  lines.slice(1).forEach((line, i) => {
    const cells = line.split(delim);
    const date = (cells[dateIdx] ?? '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      errors.push(`Zeile ${i + 2}: Datum „${date}“ ist nicht im Format JJJJ-MM-TT.`);
      return;
    }
    const day: WearableDay = { date, source: 'datei', sleepHours: null, sleepScore: null, readiness: null, restingHr: null, hrv: null };
    cols.forEach((c, idx) => {
      if (c) day[c] = toNumber(cells[idx]);
    });
    days.push(day);
  });
  return { days, errors };
}
