import { describe, expect, it } from 'vitest';
import { extractLabReport, isIsoDate, LabExtractError, markerKeyFor } from './labExtract';
import type { SampleFn } from '../../platform';

const sample = {
  lab: 'Testlabor', date: '2026-10-20', notes: null,
  values: [
    { name: 'Ferritin', marker_key: 'ferritin', value: 12, unit: 'ng/mL', ref_low: 15, ref_high: 150 },
    { name: 'Natrium', marker_key: 'andere', value: 140, unit: 'mmol/L', ref_low: 135, ref_high: 145 },
  ],
};

/** Nachgestellte KI der Claude-Seite: merkt sich die Anfrage und liefert die vorgegebene Antwort. */
function fakeSample(reply: unknown, seen: { prompt?: string; options?: Record<string, unknown> } = {}): SampleFn {
  const fn = (async () => ({ text: '', truncated: false })) as unknown as SampleFn;
  fn.json = (async (prompt: string, options?: Record<string, unknown>) => {
    seen.prompt = prompt;
    seen.options = options;
    if (reply instanceof Error || (typeof reply === 'object' && reply !== null && 'code' in reply)) throw reply;
    return reply;
  }) as SampleFn['json'];
  fn.limits = async () => ({});
  return fn;
}

describe('KI-Auslesung Befund', () => {
  it('schickt das Foto mit Anweisung und Schema und liest die Antwort', async () => {
    const seen: { prompt?: string; options?: Record<string, unknown> } = {};
    const jpg = new File([new Uint8Array([1, 2, 3])], 'foto.jpg', { type: 'image/jpeg' });
    const r = await extractLabReport(jpg, fakeSample(sample, seen));
    expect(r.values).toHaveLength(2);
    expect(r.values[0]).toMatchObject({ marker_key: 'ferritin', value: 12, ref_low: 15 });
    expect(seen.prompt).toContain('JSON-Schema');
    expect(seen.prompt).toContain('Referenzbereich');
    expect((seen.options?.images as File[])[0]).toBe(jpg);
  });
  it('PDF: Seiten werden als Bilder geschickt, mit Text zur Kontrolle', async () => {
    const seen: { prompt?: string; options?: Record<string, unknown> } = {};
    const pdf = new File([new Uint8Array([37, 80, 68, 70])], 'b.pdf', { type: 'application/pdf' });
    const pages = [new Blob(['a']), new Blob(['b'])];
    const fs = fakeSample(sample, seen);
    fs.limits = async () => ({ images: { maxCount: 2, maxInputBytes: 1e7, mediaTypes: ['image/jpeg'] } });
    const r = await extractLabReport(pdf, fs, async (_f, max) => ({ images: pages.slice(0, max), text: 'Ferritin 12 ng/mL', pageCount: 3 }));
    expect(seen.options?.images).toEqual(pages);
    expect(seen.prompt).toContain('Ferritin 12 ng/mL');
    expect(r.notes).toContain('Nur die ersten 2 Seiten');
  });
  it('andere Formate werden abgelehnt, ohne etwas zu senden', async () => {
    const seen: { prompt?: string } = {};
    const doc = new File(['x'], 'befund.docx', { type: 'application/msword' });
    await expect(extractLabReport(doc, fakeSample(sample, seen))).rejects.toBeInstanceOf(LabExtractError);
    expect(seen.prompt).toBeUndefined();
  });
  it('ohne Claude-Seite: verständlicher Hinweis', async () => {
    const jpg = new File([new Uint8Array([1])], 'foto.jpg', { type: 'image/jpeg' });
    await expect(extractLabReport(jpg, null)).rejects.toMatchObject({ kind: 'nicht_verfuegbar' });
  });
  it('meldet eine Ablehnung verständlich', async () => {
    const jpg = new File([new Uint8Array([1])], 'foto.jpg', { type: 'image/jpeg' });
    await expect(extractLabReport(jpg, fakeSample({ code: 'refused', message: 'x' }))).rejects.toMatchObject({ kind: 'abgelehnt' });
  });
  it('falsches Antwortformat wird erkannt', async () => {
    const jpg = new File([new Uint8Array([1])], 'foto.jpg', { type: 'image/jpeg' });
    await expect(extractLabReport(jpg, fakeSample({ foo: 1 }))).rejects.toMatchObject({ kind: 'antwort' });
  });
  it('unbekannte Werte behalten ihren Namen', () => {
    expect(markerKeyFor({ name: 'Natrium', marker_key: 'andere' })).toBe('Natrium');
    expect(markerKeyFor({ name: 'Ferritin', marker_key: 'ferritin' })).toBe('ferritin');
    expect(isIsoDate('2026-10-20')).toBe(true);
    expect(isIsoDate('20.10.2026')).toBe(false);
  });
});
