import { describe, expect, it } from 'vitest';
import {
  balanceReference, bestBalance, bmi, median, restingPulseBaseline, sideDifference, sitToStandValue, ukkIndex, ukkRating,
} from './calc';

describe('BMI', () => {
  it('rechnet kg ÷ m²', () => {
    expect(bmi(80, 200)).toBeCloseTo(20, 5);
    expect(bmi(70, 175)).toBeCloseTo(22.857, 2);
  });
  it('liefert nichts bei fehlenden Angaben', () => {
    expect(bmi(0, 170)).toBeNull();
    expect(bmi(70, 0)).toBeNull();
  });
});

describe('UKK-Fitness-Index', () => {
  it('Testfall aus der Übergabe: Mann, 50 J., BMI 25, 15:30 min, Puls 135 → 109,4 (mittel)', () => {
    const r = ukkIndex({ sex: 'maennlich', age: 50, minutes: 15, seconds: 30, pulse: 135, bmi: 25 });
    expect(r.kind).toBe('index');
    if (r.kind === 'index') {
      expect(r.value).toBeCloseTo(109.4, 5);
      expect(r.rating).toBe('mittel');
    }
  });
  it('rechnet für Frauen nicht (Formel offen)', () => {
    expect(ukkIndex({ sex: 'weiblich', age: 48, minutes: 17, seconds: 0, pulse: 130, bmi: 23 }).kind).toBe('nichtBerechnet');
  });
  it('rechnet außerhalb von 20–65 Jahren nicht', () => {
    expect(ukkIndex({ sex: 'maennlich', age: 66, minutes: 15, seconds: 0, pulse: 130, bmi: 25 }).kind).toBe('nichtBerechnet');
    expect(ukkIndex({ sex: 'maennlich', age: 19, minutes: 15, seconds: 0, pulse: 130, bmi: 25 }).kind).toBe('nichtBerechnet');
    expect(ukkIndex({ sex: 'maennlich', age: 65, minutes: 15, seconds: 0, pulse: 130, bmi: 25 }).kind).toBe('index');
  });
  it('Bewertungsgrenzen', () => {
    expect(ukkRating(131)).toBe('sehr gut');
    expect(ukkRating(130)).toBe('gut');
    expect(ukkRating(111)).toBe('gut');
    expect(ukkRating(110)).toBe('mittel');
    expect(ukkRating(90)).toBe('mittel');
    expect(ukkRating(89)).toBe('schwach');
    expect(ukkRating(70)).toBe('schwach');
    expect(ukkRating(69)).toBe('sehr schwach');
  });
});

describe('Ruhepuls', () => {
  it('Median', () => {
    expect(median([60, 58, 62, 70, 59])).toBe(60);
    expect(median([60, 62])).toBe(61);
  });
  it('Baseline erst ab 5 Morgen, höchstens 7 zählen', () => {
    expect(restingPulseBaseline([60, 61, 62, 63])).toBeNull();
    expect(restingPulseBaseline([60, 61, 62, 63, 64])).toBe(62);
    expect(restingPulseBaseline([60, 60, 60, 60, 60, 60, 60, 99, 99])).toBe(60);
  });
});

describe('Einbeinstand', () => {
  it('beste Zeit zählt, höchstens 45 s', () => {
    expect(bestBalance([12, 30.5, null])).toBe(30.5);
    expect(bestBalance([50, 20, 10])).toBe(45);
    expect(bestBalance([null, null, null])).toBeNull();
  });
  it('Vergleichswerte nur 40–59 Jahre', () => {
    expect(balanceReference(48)).toEqual({ mean: 41.9, group: '40–49 Jahren' });
    expect(balanceReference(55)?.mean).toBe(41.2);
    expect(balanceReference(39)).toBeNull();
    expect(balanceReference(60)).toBeNull();
  });
});

describe('Sonstiges', () => {
  it('Sit-to-Stand mit Armeinsatz = 0', () => {
    expect(sitToStandValue(14, false)).toBe(14);
    expect(sitToStandValue(14, true)).toBe(0);
  });
  it('Seitendifferenz', () => {
    expect(sideDifference(10, 8)).toBe(2);
    expect(sideDifference(-2, 1)).toBe(3);
    expect(sideDifference(null, 8)).toBeNull();
  });
});
