// Daten nur lokal im Browser auf diesem Gerät. Kein Server, keine Cloud.
import { useCallback, useEffect, useState } from 'react';
import type { AppData, TestRecord } from './types';

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
    return { ...EMPTY, ...rest, anamneses: Array.isArray(d.anamneses) ? d.anamneses : [] } as AppData;
  } catch {
    return null;
  }
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

export function exportJson(data: AppData): void {
  download(`livion-${data.profile?.participantId ?? 'daten'}-${todayIso()}.json`, JSON.stringify(data, null, 2), 'application/json');
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

export function nowTime(d = new Date()): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
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
