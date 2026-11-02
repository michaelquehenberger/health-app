// KI-Auslesung von Laborbefunden (PDF oder Foto) mit Claude.
// Testphase: direkter Aufruf aus dem Browser mit einem eigenen API-Schlüssel auf diesem Gerät.
// Für den Betrieb gehört der Schlüssel auf einen Server (Proxy); dann ändert sich nur createClient().
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import { MARKERS } from '../logic/labs';

export const LAB_MODEL = 'claude-opus-5-5';

/** Gespeicherter Schlüssel nur in diesem Browser, nie in der Sicherungsdatei. */
export const AI_KEY_STORAGE = 'livion-ai-key';

const ExtractedValue = z.object({
  /** Name wie im Befund, z. B. „Ferritin“ */
  name: z.string(),
  /** passender Schlüssel aus der App-Liste oder "andere" */
  marker_key: z.string(),
  value: z.number(),
  unit: z.string(),
  ref_low: z.number().nullable(),
  ref_high: z.number().nullable(),
});

export const LabExtraction = z.object({
  lab: z.string().nullable(),
  /** Datum der Probe bzw. des Befunds im Format JJJJ-MM-TT */
  date: z.string().nullable(),
  values: z.array(ExtractedValue),
  /** Hinweise, z. B. unleserliche Stellen */
  notes: z.string().nullable(),
});
export type LabExtractionResult = z.infer<typeof LabExtraction>;

const SYSTEM = `Du liest deutschsprachige Laborbefunde aus (Blutwerte).
Regeln:
- Übernimm nur Werte, die im Befund tatsächlich stehen. Nichts schätzen, nichts ergänzen, nichts bewerten oder deuten.
- Wert und Einheit genau wie im Befund; Dezimalkomma als Zahl ausgeben (5,2 → 5.2).
- Referenzbereich genau aus dem Befund: „3,5–5,0“ → ref_low 3.5, ref_high 5.0; „< 5“ → ref_low null, ref_high 5; „> 40“ → ref_low 40, ref_high null; fehlt er, beide null.
- Ist ein Wert als „<0,5“ angegeben, nimm 0.5 als Wert und schreibe das in notes.
- marker_key: wähle den passenden Schlüssel aus dieser Liste, sonst "andere": ${MARKERS.map((m) => `${m.key} (${m.label})`).join(', ')}.
- date: Datum der Probenentnahme, sonst des Befunds, als JJJJ-MM-TT; lab: Name des Labors.
- Unleserliche oder abgeschnittene Stellen in notes nennen, nicht raten.`;

export class LabExtractError extends Error {
  constructor(public kind: 'schluessel' | 'format' | 'abgelehnt' | 'netz' | 'antwort', message: string) {
    super(message);
  }
}

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
type ImageType = (typeof IMAGE_TYPES)[number];

export function createClient(apiKey: string): Anthropic {
  // Nur für den privaten Test: Der Schlüssel liegt auf diesem Gerät. Für den Betrieb über einen Server-Proxy.
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

async function toBase64(file: Blob): Promise<string> {
  const buf = new Uint8Array(await file.arrayBuffer());
  let bin = '';
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return btoa(bin);
}

/** Liest einen Befund (PDF oder Foto) aus. Die Werte werden danach von der Nutzerin geprüft, nie direkt gespeichert. */
export async function extractLabReport(file: File, apiKey: string, client: Anthropic = createClient(apiKey)): Promise<LabExtractionResult> {
  if (!apiKey.trim()) throw new LabExtractError('schluessel', 'Kein API-Schlüssel hinterlegt.');
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  const isImage = (IMAGE_TYPES as readonly string[]).includes(file.type);
  if (!isPdf && !isImage) throw new LabExtractError('format', 'Bitte ein PDF oder ein Foto (JPG, PNG, WEBP) wählen.');
  if (file.size > 20 * 1024 * 1024) throw new LabExtractError('format', 'Die Datei ist größer als 20 MB.');

  const data = await toBase64(file);
  const fileBlock: Anthropic.Beta.BetaContentBlockParam = isPdf
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data } }
    : { type: 'image', source: { type: 'base64', media_type: file.type as ImageType, data } };

  let response;
  try {
    response = await client.beta.messages.create({
      model: LAB_MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: SYSTEM,
      messages: [{ role: 'user', content: [fileBlock, { type: 'text', text: 'Lies alle Blutwerte aus diesem Befund aus.' }] }],
      output_config: { format: betaZodOutputFormat(LabExtraction) },
    });
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) throw new LabExtractError('schluessel', 'Der API-Schlüssel wurde abgelehnt.');
    if (e instanceof Anthropic.RateLimitError) throw new LabExtractError('netz', 'Zu viele Anfragen. Bitte in einer Minute erneut versuchen.');
    if (e instanceof Anthropic.BadRequestError) throw new LabExtractError('format', `Die Datei konnte nicht gelesen werden (${e.message}).`);
    if (e instanceof Anthropic.APIError) throw new LabExtractError('netz', `Fehler bei der Auslesung (${e.status ?? 'Netz'}).`);
    throw new LabExtractError('netz', 'Keine Verbindung zur Auslesung.');
  }
  // Erst den Stopp-Grund prüfen, dann lesen: Eine Ablehnung hat keinen auswertbaren Inhalt.
  if (response.stop_reason === 'refusal') throw new LabExtractError('abgelehnt', 'Die Auslesung wurde abgelehnt. Bitte die Werte von Hand eintragen.');
  if (response.stop_reason === 'max_tokens') throw new LabExtractError('antwort', 'Der Befund ist zu lang für eine Auslesung. Bitte in Teilen hochladen.');
  const text = response.content.map((b) => (b.type === 'text' ? b.text : '')).join('');
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new LabExtractError('antwort', 'Die Antwort konnte nicht gelesen werden. Bitte erneut versuchen oder von Hand eintragen.');
  }
  const parsed = LabExtraction.safeParse(json);
  if (!parsed.success) throw new LabExtractError('antwort', 'Die Antwort hatte nicht das erwartete Format. Bitte erneut versuchen.');
  return parsed.data;
}

/** Schlüssel aus der Liste, sonst der Name aus dem Befund (dann zeigt die App ihn unter diesem Namen). */
export function markerKeyFor(v: { name: string; marker_key: string }): string {
  return MARKERS.some((m) => m.key === v.marker_key) ? v.marker_key : v.name.trim();
}

export function isIsoDate(s: string | null): s is string {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
}
