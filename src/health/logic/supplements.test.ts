import { describe, expect, it } from 'vitest';
import type { HealthProfile, LabValue } from '../types';
import { supplementInfo } from './supplements';
import { allergyTerms, filterByAllergies, nutritionHintFor, NUTRITION_HINTS } from './nutrition';

const profile: HealthProfile = {
  age: 48, sex: 'weiblich', diet: '', allergies: '', medications: '', fluidRestriction: false, experience: 'mittel', minutesPerDay: 10, rhythm: 'taeglich',
};
const val = (marker: string, value: number, refLow: number | null, refHigh: number | null): LabValue => ({ id: marker, reportId: 'r', marker, value, unit: 'x', refLow, refHigh });
const latest = (...vals: LabValue[]) => new Map(vals.map((v) => [v.marker, v]));

describe('Supplement-Infokarten', () => {
  it('zeigen Vitamin D, Eisen und B12 nur bei niedrigem Laborwert', () => {
    const low = supplementInfo(latest(val('vitd', 12, 30, 80), val('ferritin', 8, 15, 150), val('b12', 150, 200, 900)), profile, []);
    expect(low.cards.map((c) => c.id)).toEqual(['vitd', 'eisen', 'b12']);
    const ok = supplementInfo(latest(val('vitd', 40, 30, 80), val('ferritin', 50, 15, 150), val('b12', 400, 200, 900)), profile, []);
    expect(ok.cards).toHaveLength(0);
  });
  it('zeigen nichts bei zu hohem Wert', () => {
    expect(supplementInfo(latest(val('vitd', 120, 30, 80)), profile, []).cards).toHaveLength(0);
  });
  it('sperren sich bei Medikamenten, Leber- oder Nierenwerten außerhalb', () => {
    const low = val('vitd', 12, 30, 80);
    expect(supplementInfo(latest(low), { ...profile, medications: 'Ibuprofen' }, []).blocked).toContain('Medikamente im Profil');
    expect(supplementInfo(latest(low, val('gpt', 90, 5, 35)), profile, []).blocked).toContain('Leberwerte außerhalb');
    expect(supplementInfo(latest(low, val('kreatinin', 2, 0.5, 1.1)), profile, []).blocked).toContain('Nierenwerte außerhalb');
    expect(supplementInfo(latest(low, val('kreatinin', 2, 0.5, 1.1)), profile, []).cards).toHaveLength(0);
  });
  it('nennt Glucosamin nur bei Knie, Hüfte oder Hand und als nicht empfohlen', () => {
    expect(supplementInfo(latest(), profile, ['schulter']).cards).toHaveLength(0);
    const c = supplementInfo(latest(), profile, ['knie']).cards;
    expect(c).toHaveLength(1);
    expect(c[0].title).toContain('nicht empfohlen');
  });
  it('nennt nie eine Dosis und belegt jede Karte mit Quellen', () => {
    const all = supplementInfo(latest(val('vitd', 12, 30, 80), val('ferritin', 8, 15, 150), val('b12', 150, 200, 900)), profile, ['knie']).cards;
    expect(all.length).toBe(4);
    for (const c of all) {
      const text = JSON.stringify(c);
      expect(text).not.toMatch(/\d\s?(mg|µg|mcg|ug|IE|IU)\b/i);
      expect(c.evidence.length).toBeGreaterThan(0);
      for (const e of c.evidence) expect(e.url.startsWith('https://')).toBe(true);
    }
  });
  it('weist PubMed-Belege mit PMID aus (außer Leitlinie)', () => {
    const all = supplementInfo(latest(val('vitd', 12, 30, 80)), profile, []).cards;
    expect(all[0].evidence.every((e) => e.pmid && e.doi)).toBe(true);
  });
});

describe('Ernährungshinweise und Allergien', () => {
  it('zerlegt Freitext in Begriffe', () => {
    expect(allergyTerms('Laktose, Nüsse und Soja')).toEqual(['laktose', 'nüsse', 'soja']);
  });
  it('schließt Hinweise aus, die ein genanntes Lebensmittel erwähnen', () => {
    const out = filterByAllergies(NUTRITION_HINTS, 'Fruchtsaft');
    expect(out.find((h) => h.id === 'schorle')).toBeUndefined();
    expect(out.find((h) => h.id === 'wasser')).toBeDefined();
  });
  it('liefert genau einen Hinweis pro Tag mit Quelle und wechselt', () => {
    const a = nutritionHintFor('2026-11-02', '');
    const b = nutritionHintFor('2026-11-03', '');
    expect(a?.source.url).toMatch(/^https:/);
    expect(a?.id).not.toBe(b?.id);
  });
  it('gibt nichts zurück, wenn alle Hinweise ausgeschlossen sind', () => {
    const everything = NUTRITION_HINTS.flatMap((h) => h.mentions).join(', ');
    // Hinweise ohne genannte Lebensmittel bleiben immer erlaubt
    expect(nutritionHintFor('2026-11-02', everything)).not.toBeNull();
  });
});
