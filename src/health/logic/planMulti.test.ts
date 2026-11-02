import { describe, expect, it } from 'vitest';
import { activeComplaints, buildDayCard } from './plan';
import { EMPTY_HEALTH, type Complaint } from '../types';

const NO = { acuteHotJoint: false, fever: false, injury: false, systemic: false, neuro: false, suddenOnset: false, caudaEquina: false, chestPain: false, multipleSwollenJoints: false, longMorningStiffness: false };
const c = (id: string, region: Complaint['region'], side: Complaint['side'], type: Complaint['type'], intensity: number): Complaint =>
  ({ id, date: '2026-11-01', region, side, type, since: '', intensity, swellingOrWarmth: false, redFlags: NO, active: true });
const base = { profile: EMPTY_HEALTH.profile, feedback: [], values: [], reports: [] };

describe('Mehrere Beschwerden', () => {
  it('stärkste Beschwerde zuerst', () => {
    expect(activeComplaints([c('a', 'knie', 'links', 'steifigkeit', 3), c('b', 'huefte', 'rechts', 'steifigkeit', 6)])[0].id).toBe('b');
  });
  it('Tagesplan enthält Übungen für beide Regionen', () => {
    const card = buildDayCard({ ...base, date: '2026-11-04', complaints: [c('a', 'huefte', 'links', 'steifigkeit', 4), c('b', 'knie', 'rechts', 'steifigkeit', 4)] });
    expect(card.regions).toEqual(['huefte', 'knie']);
    expect(new Set(card.exercises.map((e) => e.region))).toEqual(new Set(['huefte', 'knie']));
  });
  it('Hüfte links und rechts zählen als eine Region', () => {
    const card = buildDayCard({ ...base, date: '2026-11-04', complaints: [c('a', 'huefte', 'links', 'steifigkeit', 4), c('b', 'huefte', 'rechts', 'steifigkeit', 4)] });
    expect(card.regions).toEqual(['huefte']);
  });
  it('die vorsichtigste Beschwerde bestimmt die Stufe', () => {
    const card = buildDayCard({ ...base, date: '2026-11-02', complaints: [c('a', 'huefte', 'links', 'schwaeche', 6), c('b', 'knie', 'rechts', 'stechen', 2)] });
    expect(card.level).toBe(0);
    expect(card.exercises.every((e) => e.kind === 'beweglichkeit')).toBe(true);
  });
});
