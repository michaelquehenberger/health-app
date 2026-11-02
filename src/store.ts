// Daten nur lokal im Browser auf diesem Gerät. Kein Server, keine Cloud.
import { useCallback, useEffect, useState } from 'react';
import type { AppData, TestRecord } from './types';
import { EMPTY_HEALTH, type HealthState } from './health/types';

const KEY = 'livion-mvp-v2';

export const EMPTY: AppData = { version: 2, consent: null, profile: null, anamneses: [], records: [] };

export function load(): AppData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    return parseData(raw) ?? EMPTY;
  } catch {
    return EMPTY;
  }
}

/** Prüft eine Datei (Import oder Speicher) grob auf das erwartete Format. */
export function parseData(raw: string): AppData | null {
  try {
    const d = JSON.parse(raw) as Partial<AppData> & { gate?: unknown };
    if (d.version !== 2 || !Array.isArray(d.records)) return null;
    // Ältere Stände hatten statt der Anamnese nur eine Freigabe („gate“); sie wird nicht übernommen.
    const { gate: _old, settings: _settings, ...rest } = d as typeof d & { settings?: unknown };
    void _old;
    void _settings;
    return { ...EMPTY, ...rest, anamneses: Array.isArray(d.anamneses) ? d.anamneses : [], health: normalizeHealth(d.health) } as AppData;
  } catch {
    return null;
  }
}

/** Ergänzt fehlende Teile des Gesundheitsmoduls (ältere Sicherungen kennen es nicht). */
export function normalizeHealth(h: Partial<HealthState> | undefined): HealthState {
  const arr = <T,>(v: T[] | undefined): T[] => (Array.isArray(v) ? v : []);
  return {
    consent: h?.consent ?? null,
    profile: { ...EMPTY_HEALTH.profile, ...(h?.profile ?? {}) },
    complaints: arr(h?.complaints),
    reports: arr(h?.reports),
    values: arr(h?.values),
    feedback: arr(h?.feedback),
    dayCards: arr(h?.dayCards),
    wearables: arr(h?.wearables),
    oura: h?.oura ?? null,
  };
}

function save(data: AppData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Speicher voll oder gesperrt (z. B. privates Fenster): App läuft weiter, Daten nur in dieser Sitzung.
  }
}

export function useAppData() {
  const [data, setData] = useState<AppData>(load);
  useEffect(() => {
    save(data);
  }, [data]);
  const update = useCallback((fn: (d: AppData) => AppData) => setData((d) => fn(d)), []);
  const replace = useCallback((d: AppData) => setData(d), []);
  const reset = useCallback(() => {
    try {
      localStorage.removeItem(KEY);
      localStorage.removeItem('livion-oura-client');
      sessionStorage.removeItem('livion-oura-state');
    } catch {
      /* ignorieren */
    }
    setData(EMPTY);
  }, []);
  return { data, update, replace, reset };
}

function download(name: string, content: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/** Der Oura-Zugang gehört nicht in die Sicherungsdatei: Wer die Datei hat, hätte sonst Zugriff auf die Oura-Daten. */
export function dataForExport(data: AppData): AppData {
  return data.health ? { ...data, health: { ...data.health, oura: null } } : data;
}

/** Kalenderdatei (.ics) mit ganztägigen Terminen, z. B. für Tag 30 und Tag 90. */
export function calendarIcs(events: { date: string; title: string; description: string }[], now = new Date()): string {
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const d = (iso: string) => iso.replace(/-/g, '');
  const next = (iso: string) => {
    const [y, m, day] = iso.split('-').map(Number);
    return todayIso(new Date(y, m - 1, day + 1)).replace(/-/g, '');
  };
  const esc = (t: string) => t.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//LIVION//MVP//DE', 'CALSCALE:GREGORIAN'];
  for (const e of events) {
    lines.push('BEGIN:VEVENT', `UID:livion-${d(e.date)}-${Math.random().toString(36).slice(2, 8)}@livion`, `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${d(e.date)}`, `DTEND;VALUE=DATE:${next(e.date)}`, `SUMMARY:${esc(e.title)}`, `DESCRIPTION:${esc(e.description)}`, 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadCalendar(events: { date: string; title: string; description: string }[]): void {
  download('livion-termine.ics', calendarIcs(events), 'text/calendar');
}

export function exportJson(data: AppData): void {
  download(`livion-${data.profile?.participantId ?? 'daten'}-${todayIso()}.json`, JSON.stringify(dataForExport(data), null, 2), 'application/json');
}

/** Eine Zeile je Messwert mit den Pflichtfeldern aus der Übergabe (Abschnitt 4). */
export function measurementsCsv(data: AppData): string {
  const head = ['Teilnehmer-ID', 'Test', 'Messzeitpunkt', 'Zeitpunkt gewählt', 'Protokoll', 'Metrik', 'Einheit', 'Wert', 'Datum', 'Uhrzeit', 'Methode', 'Datenqualität', 'Kommentar', 'Abgebrochen', 'Abbruch-Zeitpunkt'];
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = data.records.flatMap((r: TestRecord) =>
    r.measurements.map((m) => [
      data.profile?.participantId ?? '', r.testId, r.timepoint, r.timepointSource ?? '', r.protocolVersion ?? '', m.metric, m.unit,
      m.value === null ? '' : String(m.value).replace('.', ','), r.date, r.time, r.method, r.quality, r.comment, r.aborted ?? '', r.abortedAt ?? '',
    ]),
  );
  return [head, ...rows].map((row) => row.map(esc).join(';')).join('\n');
}

export function exportCsv(data: AppData): void {
  // BOM, damit Excel die Umlaute richtig liest
  download(`livion-messwerte-${data.profile?.participantId ?? ''}-${todayIso()}.csv`, '﻿' + measurementsCsv(data), 'text/csv');
}

export function todayIso(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function addDaysIso(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return todayIso(new Date(y, m - 1, d + n));
}

export function nowTime(d = new Date()): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return todayIso(new Date(y, m - 1, d + n));
}

export function addMonths(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return todayIso(new Date(y, m - 1 + n, d));
}

export function daysBetween(a: string, b: string): number {
  const t = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((t(b) - t(a)) / 86_400_000);
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}
