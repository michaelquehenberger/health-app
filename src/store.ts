// Lokale Speicherung im Browser (Testphase). Kein Server, keine Weitergabe.
// Später ersetzt durch eine verschlüsselte Datenbank in der EU (siehe Konzept).
import { useCallback, useEffect, useState } from 'react';
import type { AppData } from './types';

const KEY = 'livion-testphase-v1';

export const EMPTY: AppData = {
  version: 1,
  consent: null,
  profile: null,
  complaints: [],
  reports: [],
  values: [],
  feedback: [],
  dayCards: [],
};

export function load(): AppData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as AppData;
    return { ...EMPTY, ...parsed };
  } catch {
    return EMPTY;
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
  const reset = useCallback(() => {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignorieren */
    }
    setData(EMPTY);
  }, []);
  return { data, update, reset };
}

export function exportJson(data: AppData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `livion-daten-${todayIso()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function todayIso(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return todayIso(new Date(y, m - 1, d + n));
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}
