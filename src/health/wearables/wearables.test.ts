import { describe, expect, it } from 'vitest';
import { parseWearableCsv } from './csv';
import { mergeWearableDays, summarizeWearables } from './days';
import { buildAuthUrl, connectionExpired, connectionFromToken, fetchOuraDays, mapOura, parseTokenHash } from './oura';
import { normalizeHealth } from '../../store';
import type { WearableDay } from '../types';

const day = (date: string, over: Partial<WearableDay> = {}): WearableDay => ({ date, source: 'datei', sleepHours: null, sleepScore: null, readiness: null, restingHr: null, hrv: null, ...over });

describe('Datei-Import', () => {
  it('liest Strichpunkt-Tabellen mit Dezimalkomma', () => {
    const r = parseWearableCsv('Datum;Schlaf_Stunden;Ruhepuls;HRV\n2026-11-01;7,5;56;48\n2026-11-02;6,0;;\n');
    expect(r.errors).toEqual([]);
    expect(r.days).toHaveLength(2);
    expect(r.days[0]).toMatchObject({ date: '2026-11-01', sleepHours: 7.5, restingHr: 56, hrv: 48, source: 'datei' });
    expect(r.days[1].restingHr).toBeNull();
  });
  it('meldet fehlende Spalte und falsche Daten, ohne zu raten', () => {
    expect(parseWearableCsv('Tag;Ruhepuls\n1;2').errors[0]).toContain('Datum');
    const r = parseWearableCsv('Datum;Ruhepuls\n01.11.2026;56\n2026-11-02;57');
    expect(r.days).toHaveLength(1);
    expect(r.errors[0]).toContain('Zeile 2');
  });
  it('liest auch englische Spaltennamen und Komma-Trennung', () => {
    const r = parseWearableCsv('date,sleep_hours,resting_hr\n2026-11-01,7.2,55');
    expect(r.days[0]).toMatchObject({ sleepHours: 7.2, restingHr: 55 });
  });
});

describe('Zusammenführen und Zusammenfassen', () => {
  it('ersetzt gleiche Tage derselben Quelle und sortiert', () => {
    const m = mergeWearableDays([day('2026-11-02', { restingHr: 60 })], [day('2026-11-01'), day('2026-11-02', { restingHr: 55 })]);
    expect(m.map((d) => d.date)).toEqual(['2026-11-01', '2026-11-02']);
    expect(m[1].restingHr).toBe(55);
  });
  it('mittelt nur vorhandene Werte der letzten 7 Tage', () => {
    const days = [day('2026-10-20', { restingHr: 99 }), day('2026-10-30', { restingHr: 60, sleepHours: 7 }), day('2026-11-01', { restingHr: 56, sleepHours: 8 })];
    const s = summarizeWearables(days, '2026-11-02');
    expect(s.nights).toBe(2);
    expect(s.avgRestingHr).toBe(58);
    expect(s.avgSleepHours).toBe(7.5);
    expect(s.avgHrv).toBeNull();
  });
});

describe('Oura', () => {
  it('baut die Login-Adresse mit Client-ID, Weiterleitung und Zustand', () => {
    const u = new URL(buildAuthUrl('abc', 'https://x.test/app/', 's1'));
    expect(u.searchParams.get('client_id')).toBe('abc');
    expect(u.searchParams.get('redirect_uri')).toBe('https://x.test/app/');
    expect(u.searchParams.get('state')).toBe('s1');
    expect(u.searchParams.get('response_type')).toBe('token');
  });
  it('liest den Zugang aus dem Adressteil', () => {
    expect(parseTokenHash('#access_token=tok&state=s1&expires_in=100')).toEqual({ accessToken: 'tok', state: 's1', expiresInSec: 100 });
    expect(parseTokenHash('#nichts=1')).toBeNull();
  });
  it('rechnet die Gültigkeit aus und erkennt Ablauf', () => {
    const now = new Date('2026-11-02T10:00:00Z');
    const c = connectionFromToken('id', 'tok', null, now);
    expect(c.expiresAt.slice(0, 10)).toBe('2026-12-02');
    expect(connectionExpired(c, new Date('2026-12-03T00:00:00Z'))).toBe(true);
    expect(connectionExpired(c, now)).toBe(false);
  });
  it('führt Schlafphasen, Schlaf-Score und Bereitschaft zu Tagen zusammen', () => {
    const out = mapOura(
      [
        { day: '2026-11-01', total_sleep_duration: 1800, lowest_heart_rate: 70, average_hrv: 20 },
        { day: '2026-11-01', total_sleep_duration: 27000, lowest_heart_rate: 54, average_hrv: 47 },
      ],
      [{ day: '2026-11-01', score: 81 }],
      [{ day: '2026-11-01', score: 77 }, { day: '2026-11-02', score: 70 }],
    );
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ date: '2026-11-01', sleepHours: 7.5, restingHr: 54, hrv: 47, sleepScore: 81, readiness: 77, source: 'oura' });
    expect(out[1]).toMatchObject({ date: '2026-11-02', sleepHours: null, readiness: 70 });
  });
  it('ruft die Oura-Schnittstelle mit Bearer-Zugang ab und meldet abgelaufenen Zugang', async () => {
    const calls: string[] = [];
    const ok = (async (url: string, init?: RequestInit) => {
      calls.push(`${url}|${(init?.headers as Record<string, string>)?.Authorization}`);
      return new Response(JSON.stringify({ data: [], next_token: null }), { status: 200 });
    }) as unknown as typeof fetch;
    await fetchOuraDays('tok', '2026-10-01', '2026-10-30', ok);
    expect(calls).toHaveLength(4);
    expect(calls.every((c) => c.endsWith('|Bearer tok'))).toBe(true);
    expect(calls.some((c) => c.includes('/daily_readiness?'))).toBe(true);
    expect(calls.some((c) => c.includes('/vO2_max?'))).toBe(true);
    // Fehlt VO2max (z. B. 403), kommen die übrigen Daten trotzdem
    const noVo2 = (async (url: string) => new Response(JSON.stringify({ data: [], next_token: null }), { status: String(url).includes('vO2_max') ? 403 : 200 })) as unknown as typeof fetch;
    await expect(fetchOuraDays('tok', '2026-10-01', '2026-10-30', noVo2)).resolves.toEqual([]);
    const expired = (async () => new Response('', { status: 401 })) as unknown as typeof fetch;
    await expect(fetchOuraDays('tok', '2026-10-01', '2026-10-30', expired)).rejects.toMatchObject({ kind: 'abgelaufen' });
  });
});

describe('Gesundheitsdaten im Speicher', () => {
  it('ergänzt fehlende Teile älterer Sicherungen', () => {
    const h = normalizeHealth(undefined);
    expect(h.consent).toBeNull();
    expect(h.wearables).toEqual([]);
    expect(h.oura).toBeNull();
    expect(normalizeHealth({ profile: { allergies: 'Nüsse' } as never }).profile.allergies).toBe('Nüsse');
  });
});

import { dataForExport, EMPTY } from '../../store';
import { EMPTY_HEALTH } from '../types';

describe('Sicherungsdatei', () => {
  it('enthält nie den Oura-Zugang', () => {
    const withOura = { ...EMPTY, health: { ...EMPTY_HEALTH, oura: connectionFromToken('id', 'geheim', 100) } };
    expect(JSON.stringify(dataForExport(withOura))).not.toContain('geheim');
    expect(withOura.health.oura?.accessToken).toBe('geheim');
  });
});

import { mapOura as mapOura2 } from './oura';
import { parseWearableCsv as parseCsv2 } from './csv';
import { summarizeWearables as summarize2 } from './days';
import { describe as d2, expect as e2, it as i2 } from 'vitest';

d2('VO2max', () => {
  i2('übernimmt vo2_max aus Oura je Tag', () => {
    const days = mapOura2([], [], [], [{ day: '2026-11-01', vo2_max: 34.5 }, { day: '2026-11-02', vo2_max: null }]);
    e2(days.find((x) => x.date === '2026-11-01')?.vo2max).toBe(34.5);
    e2(days.find((x) => x.date === '2026-11-02')).toBeUndefined();
  });
  i2('liest VO2max aus der Datei', () => {
    const r = parseCsv2('Datum;VO2max\n2026-11-01;33,5\n');
    e2(r.days[0].vo2max).toBe(33.5);
  });
  i2('Zusammenfassung zeigt den letzten VO2max', () => {
    const s = summarize2([
      { date: '2026-10-30', source: 'oura', sleepHours: null, sleepScore: null, readiness: null, restingHr: null, hrv: null, vo2max: 33 },
      { date: '2026-11-01', source: 'oura', sleepHours: null, sleepScore: null, readiness: null, restingHr: null, hrv: null, vo2max: 34 },
    ], '2026-11-02');
    e2(s.latestVo2max).toBe(34);
  });
});
