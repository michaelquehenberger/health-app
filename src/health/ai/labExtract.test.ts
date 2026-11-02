import { describe, expect, it } from 'vitest';
import Anthropic from '@anthropic-ai/sdk';
import { extractLabReport, isIsoDate, LabExtractError, markerKeyFor } from './labExtract';

const sample = {
  lab: 'Testlabor', date: '2026-10-20', notes: null,
  values: [
    { name: 'Ferritin', marker_key: 'ferritin', value: 12, unit: 'ng/mL', ref_low: 15, ref_high: 150 },
    { name: 'Natrium', marker_key: 'andere', value: 140, unit: 'mmol/L', ref_low: 135, ref_high: 145 },
  ],
};

function fakeClient(reply: object, seen: { body?: Record<string, unknown> }) {
  const fetchFn = (async (_url: string, init?: RequestInit) => {
    seen.body = JSON.parse(String(init?.body));
    return new Response(JSON.stringify(reply), { status: 200, headers: { 'content-type': 'application/json' } });
  }) as unknown as typeof fetch;
  return new Anthropic({ apiKey: 'test', dangerouslyAllowBrowser: true, fetch: fetchFn, maxRetries: 0 });
}
const message = (text: string, stop = 'end_turn') => ({
  id: 'msg_1', type: 'message', role: 'assistant', model: 'claude-opus-5-5', stop_reason: stop, stop_sequence: null,
  content: [{ type: 'text', text }], usage: { input_tokens: 1, output_tokens: 1 },
});

describe('KI-Auslesung Befund', () => {
  it('schickt das PDF als Dokument und liest die strukturierte Antwort', async () => {
    const seen: { body?: Record<string, unknown> } = {};
    const pdf = new File([new Uint8Array([37, 80, 68, 70])], 'befund.pdf', { type: 'application/pdf' });
    const r = await extractLabReport(pdf, 'test', fakeClient(message(JSON.stringify(sample)), seen));
    expect(r.values).toHaveLength(2);
    expect(r.values[0]).toMatchObject({ marker_key: 'ferritin', value: 12, ref_low: 15 });
    expect(seen.body?.model).toBe('claude-opus-5-5');
    expect(seen.body?.fallbacks).toBe('default');
    const content = (seen.body?.messages as { content: { type: string; source?: { media_type: string } }[] }[])[0].content;
    expect(content[0]).toMatchObject({ type: 'document', source: { media_type: 'application/pdf' } });
    expect((seen.body?.output_config as { format: { type: string } }).format.type).toBe('json_schema');
  });
  it('schickt Fotos als Bild', async () => {
    const seen: { body?: Record<string, unknown> } = {};
    const jpg = new File([new Uint8Array([1, 2, 3])], 'foto.jpg', { type: 'image/jpeg' });
    await extractLabReport(jpg, 'test', fakeClient(message(JSON.stringify(sample)), seen));
    const content = (seen.body?.messages as { content: { type: string }[] }[])[0].content;
    expect(content[0].type).toBe('image');
  });
  it('lehnt andere Dateiformate ab, ohne etwas zu senden', async () => {
    const seen: { body?: Record<string, unknown> } = {};
    const doc = new File(['x'], 'befund.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    await expect(extractLabReport(doc, 'test', fakeClient(message('{}'), seen))).rejects.toBeInstanceOf(LabExtractError);
    expect(seen.body).toBeUndefined();
  });
  it('meldet eine Ablehnung verständlich', async () => {
    const pdf = new File([new Uint8Array([1])], 'b.pdf', { type: 'application/pdf' });
    await expect(extractLabReport(pdf, 'test', fakeClient(message('', 'refusal'), {}))).rejects.toMatchObject({ kind: 'abgelehnt' });
  });
  it('unbekannte Werte behalten ihren Namen', () => {
    expect(markerKeyFor({ name: 'Natrium', marker_key: 'andere' })).toBe('Natrium');
    expect(markerKeyFor({ name: 'Ferritin', marker_key: 'ferritin' })).toBe('ferritin');
    expect(isIsoDate('2026-10-20')).toBe(true);
    expect(isIsoDate('20.10.2026')).toBe(false);
  });
});
