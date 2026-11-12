import { describe, expect, it } from 'vitest';
import { EMPTY, fromParts, isBlank, parseData, pickNewer, toParts, dataForExport } from './store';
import { EMPTY_HEALTH } from './health/types';
import type { AppData } from './types';

const full: AppData = {
  ...EMPTY,
  consent: { acceptedAt: '2026-11-01T08:00:00Z', textVersion: 'x' } as AppData['consent'],
  profile: { participantId: 'T01', age: 48, sex: 'weiblich', heightCm: 168, weightKg: 64, goal: '' },
  updatedAt: '2026-11-10T10:00:00.000Z',
  health: {
    ...EMPTY_HEALTH,
    consent: { acceptedAt: '2026-11-02', textVersion: 'y' } as never,
    wearables: [{ date: '2026-11-01', source: 'datei', sleepHours: 7, sleepScore: null, readiness: null, restingHr: 60, hrv: 40, vo2max: 32 }],
    coachChat: [{ role: 'user', content: 'Hallo', at: '2026-11-03' }],
    todoDone: { '2026-11-03': ['trinken'] },
    dayStats: { '2026-11-03': { planned: 5, done: 3 } },
    oura: { clientId: 'c', accessToken: 'geheim', expiresAt: '2026-12-01', lastSync: null } as never,
  },
};

describe('Speicher: Claude-Speicher und Sicherung', () => {
  it('Aufteilen und Zusammensetzen ergibt denselben Stand (ohne Oura-Zugang)', () => {
    const back = fromParts(JSON.parse(JSON.stringify(toParts(full))));
    expect(back).toEqual({ ...full, health: { ...parseData(JSON.stringify(full))!.health!, oura: null } });
    expect(JSON.stringify(toParts(full))).not.toContain('geheim');
  });
  it('Sicherungsdatei lässt sich wieder einlesen und enthält keinen Oura-Zugang', () => {
    const file = JSON.stringify(dataForExport(full));
    expect(file).not.toContain('geheim');
    const back = parseData(file)!;
    expect(back.health?.coachChat).toHaveLength(1);
    expect(back.health?.dayStats?.['2026-11-03']).toEqual({ planned: 5, done: 3 });
    expect(back.updatedAt).toBe(full.updatedAt);
  });
  it('ältere Sicherungen ohne neue Felder werden ergänzt', () => {
    const old = parseData(JSON.stringify({ version: 2, consent: null, profile: null, records: [], health: { complaints: [] } }))!;
    expect(old.health?.coachChat).toEqual([]);
    expect(old.health?.dayStats).toEqual({});
    expect(old.anamneses).toEqual([]);
  });
  it('fremde Dateien werden abgelehnt', () => {
    expect(parseData('{"foo":1}')).toBeNull();
    expect(parseData('kein json')).toBeNull();
  });
  it('der jüngere Stand gilt', () => {
    const older = { ...full, updatedAt: '2026-11-09T10:00:00.000Z' };
    expect(pickNewer(full, older)).toBe('local');
    expect(pickNewer(older, full)).toBe('remote');
    expect(pickNewer(full, null)).toBe('local');
    // ohne Zeitstempel (ältere Stände) gewinnt der Claude-Speicher
    expect(pickNewer({ ...full, updatedAt: undefined }, { ...full, updatedAt: undefined })).toBe('remote');
    // neues Gerät: leer und ohne Zeitstempel
    expect(pickNewer(EMPTY, full)).toBe('remote');
  });
  it('nach „Alles löschen“ gewinnt der leere Stand und gilt als leer', () => {
    const wiped = { ...EMPTY, updatedAt: '2026-11-11T10:00:00.000Z' };
    expect(pickNewer(wiped, full)).toBe('local');
    expect(isBlank(wiped)).toBe(true);
    expect(isBlank(full)).toBe(false);
  });
});
