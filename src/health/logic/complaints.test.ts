import { describe as d, expect, it } from 'vitest';
import { describe as describeComplaint, primaryType } from './complaints';

d('Hauptart aus Mehrfachauswahl', () => {
  it('nur Steifigkeit', () => expect(primaryType(['steifigkeit'])).toBe('steifigkeit'));
  it('Schwäche vor Steifigkeit', () => expect(primaryType(['steifigkeit', 'schwaeche'])).toBe('schwaeche'));
  it('Belastungsschmerz vor Schwäche', () => expect(primaryType(['schwaeche', 'belastungsschmerz'])).toBe('belastungsschmerz'));
  it('Stechen allein bleibt Stechen', () => expect(primaryType(['steifigkeit', 'stechen'])).toBe('stechen'));
  it('mehrere unspezifische → gemischt (mildester Block)', () => expect(primaryType(['druck', 'ziehen'])).toBe('misch'));
  it('Ruheschmerz → mildester Block', () => expect(primaryType(['ruheschmerz'])).toBe('misch'));
  it('leer → Steifigkeit', () => expect(primaryType([])).toBe('steifigkeit'));
  it('Kurzbeschreibung', () => expect(describeComplaint({ side: 'links', qualities: ['steifigkeit', 'ziehen'], duration: 'ueber3m' })).toBe('links · Steifigkeit, Ziehen · über 3 Monate'));
});
