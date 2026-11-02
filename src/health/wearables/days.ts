// Zusammenführen und Zusammenfassen von Wearable-Tagen. Die App bewertet nichts und schätzt nichts.
import type { WearableDay } from '../types';

export function mergeWearableDays(existing: WearableDay[], incoming: WearableDay[]): WearableDay[] {
  const key = (d: WearableDay) => `${d.date}|${d.source}`;
  const map = new Map(existing.map((d) => [key(d), d]));
  for (const d of incoming) map.set(key(d), d);
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export interface WearableSummary {
  nights: number;
  avgSleepHours: number | null;
  avgRestingHr: number | null;
  avgHrv: number | null;
  /** Letzter vorhandener VO2max-Wert im Zeitraum */
  latestVo2max: number | null;
}

function avg(values: (number | null)[]): number | null {
  const v = values.filter((x): x is number => x !== null);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

/** Mittelwerte über die letzten `days` Tage bis einschließlich `today` (ISO-Datum). */
export function summarizeWearables(all: WearableDay[], today: string, days = 7): WearableSummary {
  const [y, m, d] = today.split('-').map(Number);
  const from = new Date(Date.UTC(y, m - 1, d - (days - 1))).toISOString().slice(0, 10);
  const inRange = all.filter((x) => x.date >= from && x.date <= today);
  return {
    nights: new Set(inRange.map((x) => x.date)).size,
    avgSleepHours: avg(inRange.map((x) => x.sleepHours)),
    avgRestingHr: avg(inRange.map((x) => x.restingHr)),
    avgHrv: avg(inRange.map((x) => x.hrv)),
    latestVo2max: [...inRange].reverse().find((x) => typeof x.vo2max === 'number')?.vo2max ?? null,
  };
}
