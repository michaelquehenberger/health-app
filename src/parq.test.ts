import { describe, expect, it } from 'vitest';
import { PARQ, anamnesisValid, computeResult, newAnamnesis, stage, type Anamnesis } from './parq';

function allA(answer: 'ja' | 'nein'): Record<string, 'ja' | 'nein'> {
  return Object.fromEntries(PARQ.partA.questions.map((q) => [q.id, answer]));
}
function allBMainNo(): Record<string, 'ja' | 'nein'> {
  return Object.fromEntries(PARQ.partB.questions.map((q) => [q.id, 'nein']));
}
const fresh = (): Anamnesis => newAnamnesis('a1', 'T01', '2026-11-02');

describe('PAR-Q+ Texte', () => {
  it('Teil A hat 7 Fragen, Teil B 10 Hauptfragen mit Unterfragen', () => {
    expect(PARQ.partA.questions).toHaveLength(7);
    expect(PARQ.partB.questions).toHaveLength(10);
    expect(PARQ.partB.questions.map((q) => q.sub.length)).toEqual([3, 2, 4, 2, 5, 2, 4, 3, 3, 3]);
  });
  it('Fassung DE 01.07.2024', () => expect(PARQ.version).toBe('DE 01.07.2024'));
});

describe('Ablauf', () => {
  it('Teil A unvollständig → Teil A', () => {
    const a = fresh();
    a.answersA = { '1': 'nein' };
    expect(stage(a).step).toBe('teilA');
  });
  it('alle NEIN → Einverständnis, danach freigegeben', () => {
    const a = fresh();
    a.answersA = allA('nein');
    expect(stage(a)).toEqual({ step: 'einverstaendnis', path: 'A' });
    expect(computeResult(a)).toBeNull();
    a.consent = { given: true, date: '2026-11-02' };
    expect(computeResult(a)).toBe('freigegeben');
    expect(anamnesisValid(a, '2026-11-02')).toBe(true);
  });
  it('ein JA in Teil A → Teil B erscheint', () => {
    const a = fresh();
    a.answersA = { ...allA('nein'), '6': 'ja' };
    expect(stage(a).step).toBe('teilB');
  });
  it('Teil B: Hauptfrage JA verlangt alle Unterfragen', () => {
    const a = fresh();
    a.answersA = { ...allA('nein'), '6': 'ja' };
    a.answersB = { ...allBMainNo(), '1': 'ja', '1a': 'nein' };
    expect(stage(a).step).toBe('teilB');
    a.answersB = { ...a.answersB, '1b': 'nein', '1c': 'nein' };
    expect(stage(a)).toEqual({ step: 'einverstaendnis', path: 'B' });
  });
  it('Unterfrage JA → nicht freigegeben, Tests gesperrt', () => {
    const a = fresh();
    a.answersA = { ...allA('nein'), '6': 'ja' };
    a.answersB = { ...allBMainNo(), '1': 'ja', '1a': 'nein', '1b': 'ja', '1c': 'nein' };
    a.consent = { given: true, date: '2026-11-02' };
    expect(computeResult(a)).toBe('nicht_freigegeben');
    expect(anamnesisValid(a, '2026-11-02')).toBe(false);
  });
  it('Unterfragen unter einer Hauptfrage mit NEIN zählen nicht', () => {
    const a = fresh();
    a.answersA = { ...allA('nein'), '1': 'ja' };
    a.answersB = { ...allBMainNo(), '1b': 'ja' };
    a.consent = { given: true, date: '2026-11-02' };
    expect(computeResult(a)).toBe('freigegeben');
  });
  it('nach Abklärung → freigegeben_nach_abklaerung', () => {
    const a = fresh();
    a.answersA = { ...allA('nein'), '6': 'ja' };
    a.answersB = { ...allBMainNo(), '1': 'ja', '1a': 'nein', '1b': 'ja', '1c': 'nein' };
    a.clearance = { date: '2026-11-05', source: 'fachperson' };
    expect(stage(a)).toEqual({ step: 'einverstaendnis', path: 'B' });
    a.consent = { given: true, date: '2026-11-05' };
    expect(computeResult(a)).toBe('freigegeben_nach_abklaerung');
  });
  it('gültig 12 Monate, beendet = ungültig', () => {
    const a = fresh();
    a.answersA = allA('nein');
    a.consent = { given: true, date: '2026-11-02' };
    expect(a.validUntil).toBe('2027-11-02');
    expect(anamnesisValid(a, '2027-11-01')).toBe(true);
    expect(anamnesisValid(a, '2027-11-02')).toBe(false);
    expect(anamnesisValid({ ...a, endedAt: '2026-12-01' }, '2026-12-02')).toBe(false);
  });
});

describe('PAR-Q+ Wortlaut', () => {
  it('jede Textzeile steht wörtlich in der Übergabe v0.4 (docs/)', async () => {
    const { readFileSync } = await import('node:fs');
    const doc = readFileSync(new URL('../docs/health-app-mvp-uebergabe-v0.4.md', import.meta.url), 'utf8')
      .replace(/\[(www\.[^\]]+)\]\([^)]+\)/g, '$1');
    const lines: string[] = [];
    const walk = (x: unknown, key = ''): void => {
      if (typeof x === 'string') { if (key !== 'id' && key !== 'version') lines.push(...x.split('\n').filter(Boolean)); }
      else if (Array.isArray(x)) x.forEach((v) => walk(v));
      else if (x && typeof x === 'object') Object.entries(x).forEach(([k, v]) => k !== 'source' && walk(v, k));
    };
    walk(PARQ);
    const missing = lines.filter((l) => !doc.includes(l));
    expect(missing).toEqual([]);
    expect(lines.length).toBeGreaterThan(100);
  });
});
