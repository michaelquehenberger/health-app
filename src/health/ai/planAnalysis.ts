// KI-Auswertung (Schritt 5): fasst alle Daten zusammen und wählt Übungen aus der gepflegten Übungsdatenbank.
// Sicherheitsrahmen bleibt regelbasiert: rote Flaggen sperren den Aufruf, die KI kann nur IDs aus EXERCISES
// wählen (feste Liste im Antwortschema), und die Stufe aus der Schmerzregel begrenzt die Auswahl.
import { z } from 'zod';
import { EXERCISES, regionInfo, type Exercise } from '../data/exercises';
import { evaluateValue, marker } from '../logic/labs';
import { latestByMarker } from '../logic/redFlags';
import { describe as describeComplaint, TIMINGS, TRIGGERS } from '../logic/complaints';
import { summarizeWearables } from '../wearables/days';
import { activeComplaints, computeProgression, RULES_VERSION } from '../logic/plan';
import { summarize } from '../../results';
import { TESTS } from '../../tests';
import { bmi } from '../../calc';
import type { AppData } from '../../types';
import { EMPTY_HEALTH } from '../types';
import { LabExtractError, promptWithSchema, toAppError } from './labExtract';
import { sampleCap, type SampleFn } from '../../platform';

const EXERCISE_IDS = EXERCISES.map((e) => e.id) as [string, ...string[]];

export const PlanAnalysis = z.object({
  /** 2–4 Sätze: was die Daten zusammen zeigen, ohne Diagnose */
  zusammenfassung: z.string(),
  schwerpunkte: z.array(z.object({
    titel: z.string(),
    begruendung: z.string(),
    /** auf welche Angaben sich das stützt, z. B. „Ferritin 12 ng/mL (Bereich 15–150)“ */
    bezug: z.array(z.string()),
  })),
  uebungen: z.array(z.object({ id: z.enum(EXERCISE_IDS), grund: z.string() })),
  /** Werte oder Angaben, die mit Ärztin oder Arzt besprochen werden sollten */
  aerztlich_besprechen: z.array(z.string()),
  /** Angaben, die für eine genauere Auswertung fehlen */
  fehlende_angaben: z.array(z.string()),
});
export type PlanAnalysisResult = z.infer<typeof PlanAnalysis>;

export interface AnalysisContext {
  /** Text, der an die KI geht (ohne Name, ohne Teilnehmer-ID) */
  input: string;
  /** Übungen, die nach den Regeln heute erlaubt wären */
  allowed: Exercise[];
  level: number;
}

const fmt = (n: number | null, d = 1) => (n === null ? '–' : String(Math.round(n * 10 ** d) / 10 ** d).replace('.', ','));

/** Baut die Eingabe für die KI. Nur, was die Auswertung braucht; keine Namen, keine Kennung, Medikamente nur als ja/nein. */
export function buildAnalysisContext(data: AppData, today: string): AnalysisContext {
  const h = data.health ?? EMPTY_HEALTH;
  const p = data.profile;
  const lines: string[] = [];

  lines.push('## Profil');
  if (p) {
    const b = p.heightCm && p.weightKg ? bmi(p.weightKg, p.heightCm) : null;
    lines.push(`Alter ${p.age ?? '–'}, Geschlecht ${p.sex || '–'}, BMI ${fmt(b)}`);
    if (p.goal.trim()) lines.push(`Ziel: ${p.goal.trim()}`);
  }
  lines.push(`Bewegungserfahrung ${h.profile.experience}, Zeit pro Tag ${h.profile.minutesPerDay} Minuten, Ernährungsform ${h.profile.diet || 'nicht angegeben'}`);
  lines.push(`Allergien/Unverträglichkeiten: ${h.profile.allergies.trim() ? 'angegeben' : 'keine angegeben'}; Medikamente: ${h.profile.medications.trim() ? 'angegeben' : 'keine angegeben'}`);

  lines.push('', '## Fitnesstests (Baseline)');
  for (const t of TESTS) {
    const s = summarize(data.records, t.id, 'baseline');
    lines.push(`${t.name}: ${s.text}`);
  }

  lines.push('', '## Blutwerte (jeweils letzter Wert, bewertet nur gegen den Bereich des Labors)');
  const latest = [...latestByMarker(h.values, h.reports).values()];
  if (latest.length === 0) lines.push('keine');
  for (const v of latest) {
    const m = marker(v.marker);
    const ev = evaluateValue(v);
    const range = v.refLow === null && v.refHigh === null ? 'kein Bereich'
      : v.refLow === null ? `Bereich bis ${fmt(v.refHigh, 2)}`
      : v.refHigh === null ? `Bereich ab ${fmt(v.refLow, 2)}`
      : `Bereich ${fmt(v.refLow, 2)}–${fmt(v.refHigh, 2)}`;
    const status = ev.status === 'imBereich' ? 'im Bereich' : ev.status === 'ausserhalb' ? `außerhalb (${ev.direction ?? ''})` : ev.status === 'nurAnzeige' ? 'nur Anzeige, nicht deuten' : 'nicht bewertbar';
    lines.push(`${m.label}: ${fmt(v.value, 2)} ${v.unit} (${range}) → ${status}`);
  }

  lines.push('', '## Beschwerden (aktiv)');
  const active = h.complaints.filter((c) => c.active);
  if (active.length === 0) lines.push('keine');
  const label = (list: readonly { value: string; label: string }[], v: string[] | undefined) => (v ?? []).map((x) => list.find((o) => o.value === x)?.label ?? x).join(', ');
  for (const c of active) {
    const parts = [`${regionInfo(c.region).label}: ${describeComplaint(c) || c.type}`, `Stärke ${c.intensity}/10`];
    if (c.timing?.length) parts.push(`wann: ${label(TIMINGS, c.timing)}`);
    if (c.triggers?.length) parts.push(`verstärkt durch: ${label(TRIGGERS, c.triggers)}`);
    if (c.swellingOrWarmth) parts.push('Schwellung oder Wärme');
    lines.push(parts.join('; '));
  }

  const w = summarizeWearables(h.wearables, today);
  lines.push('', '## Wearable (Mittel der letzten 7 Tage)');
  lines.push(w.nights === 0 ? 'keine Daten' : `Schlaf ${fmt(w.avgSleepHours)} h, Ruhepuls ${fmt(w.avgRestingHr, 0)} bpm, HRV ${fmt(w.avgHrv, 0)} ms, VO2max ${fmt(w.latestVo2max)} (${w.nights} Tage)`);

  const prog = computeProgression(h.feedback, today);
  // gleiche Regel wie im Tagesplan: die vorsichtigste Beschwerde bestimmt die Stufe
  const act = activeComplaints(h.complaints);
  const mild = act.some((c) => ['druck', 'stechen', 'misch'].includes(c.type));
  const level = mild ? 0 : act.some((c) => c.type === 'belastungsschmerz') ? Math.max(0, prog.level - 1) : prog.level;
  lines.push('', '## Schmerzregel', `aktuelle Stufe ${level} (0 = leicht, nur Beweglichkeit; 1 = Start; 2 = gesteigert)`);

  const regions = new Set(active.map((c) => c.region));
  const allowed = EXERCISES.filter((e) => (regions.size === 0 || regions.has(e.region)) && (level > 0 || e.kind === 'beweglichkeit'));
  lines.push('', '## Erlaubte Übungen (nur aus dieser Liste wählen)');
  for (const e of allowed) lines.push(`${e.id}: ${e.name} (${regionInfo(e.region).label}, ${e.kind})`);

  return { input: lines.join('\n'), allowed, level };
}

const SYSTEM = `Du bist die Auswertung einer Bewegungs-App für Erwachsene. Du gibst allgemeine Information und Lebensstil-Anregungen, keine Medizin.
Regeln:
- Keine Diagnosen, keine Verdachtsdiagnosen, keine Krankheitsnamen als Erklärung der Beschwerden. Nichts den Wechseljahren zuordnen.
- Keine Therapie-, Medikamenten- oder Supplement-Empfehlungen, keine Dosisangaben, keine Kalorienvorgaben.
- Blutwerte nur gegen den angegebenen Bereich des Labors einordnen („im Bereich“, „außerhalb“). Werte außerhalb des Bereichs oder ohne Bereich gehören in aerztlich_besprechen. Hormone nur anzeigen, nicht deuten.
- Übungen: 3 bis 5, ausschließlich IDs aus der Liste „Erlaubte Übungen“. Begründe jede Wahl mit den Angaben (Beschwerde, Testwert, Stufe), nicht mit Krankheiten.
- Testwerte und Wearable-Daten nur beschreiben und für die Übungswahl nutzen (z. B. niedrige Wiederholungen beim Aufstehtest → Kräftigung Beine), nicht bewerten im Sinne von gesund oder krank.
- Schreibe auf Deutsch (Österreich), kurz, in Du-Form, ohne Fachjargon. Was in den Daten fehlt, nenne in fehlende_angaben, statt zu raten.`;

const DOSE_PATTERN = /\b\d+([.,]\d+)?\s?(mg|µg|mcg|ug|IE|I\.E\.|kcal)\b/i;

/** Entfernt Sätze mit Dosisangaben (Medikamente, Supplements, Kalorien). */
export function stripDoses(s: string): string {
  return s.split(/(?<=[.!?])\s+/).filter((x) => !DOSE_PATTERN.test(x)).join(' ');
}

/** Entfernt Sätze mit Dosisangaben und nicht erlaubte oder doppelte Übungen. */
export function applySafety(r: PlanAnalysisResult, allowed: Exercise[]): PlanAnalysisResult {
  const ok = new Set(allowed.map((e) => e.id));
  const clean = stripDoses;
  const seen = new Set<string>();
  return {
    zusammenfassung: clean(r.zusammenfassung),
    schwerpunkte: r.schwerpunkte.map((s) => ({ ...s, titel: clean(s.titel), begruendung: clean(s.begruendung) })).filter((s) => s.titel && s.begruendung),
    uebungen: r.uebungen.filter((u) => ok.has(u.id) && !seen.has(u.id) && seen.add(u.id)).slice(0, 5).map((u) => ({ ...u, grund: clean(u.grund) })),
    aerztlich_besprechen: r.aerztlich_besprechen.map(clean).filter(Boolean),
    fehlende_angaben: r.fehlende_angaben,
  };
}

/** Für das Prüfen der Antwort: Übungs-IDs zunächst als Text, damit eine falsche ID nicht die ganze Antwort verwirft;
 * applySafety lässt danach nur erlaubte IDs durch. */
const LenientAnalysis = PlanAnalysis.extend({ uebungen: z.array(z.object({ id: z.string(), grund: z.string() })) });

export async function analyzePlan(ctx: AnalysisContext, sample?: SampleFn | null): Promise<PlanAnalysisResult> {
  const fn = sample === undefined ? await sampleCap() : sample;
  if (!fn) throw new LabExtractError('nicht_verfuegbar', 'Die KI-Auswertung gibt es nur in der LIVION-Version auf claude.ai.');
  let json: unknown;
  try {
    json = await fn.json(promptWithSchema(SYSTEM, PlanAnalysis, `Werte die folgenden Angaben aus.\n\n${ctx.input}`), { cache: false });
  } catch (e) {
    throw toAppError(e, 'Keine Verbindung zur Auswertung.');
  }
  const parsed = LenientAnalysis.safeParse(json);
  if (!parsed.success) throw new LabExtractError('antwort', 'Die Antwort hatte nicht das erwartete Format. Bitte erneut versuchen.');
  return applySafety(parsed.data as PlanAnalysisResult, ctx.allowed);
}

export { RULES_VERSION };
