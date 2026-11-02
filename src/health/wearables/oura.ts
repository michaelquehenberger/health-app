// Oura-Anbindung ohne eigenen Server (Client-Login). Nach Oura-Angaben gilt dieser Zugang 30 Tage
// und lässt sich nicht verlängern; danach ist ein neuer Login nötig. Apps ohne Freigabe sind auf
// 10 Nutzer begrenzt. NICHT gegen echte Oura-Daten getestet: Das muss mit Gabis Ring geprüft werden.
import type { OuraConnection, WearableDay } from '../types';

export const OURA_AUTH_URL = 'https://cloud.ouraring.com/oauth/authorize';
export const OURA_API = 'https://api.ouraring.com/v2/usercollection';
export const OURA_SCOPE = 'daily';
export const OURA_TOKEN_DAYS = 30;

export function buildAuthUrl(clientId: string, redirectUri: string, state: string): string {
  const q = new URLSearchParams({ response_type: 'token', client_id: clientId, redirect_uri: redirectUri, scope: OURA_SCOPE, state });
  return `${OURA_AUTH_URL}?${q.toString()}`;
}

export function parseTokenHash(hash: string): { accessToken: string; state: string | null; expiresInSec: number | null } | null {
  const h = hash.startsWith('#') ? hash.slice(1) : hash;
  const p = new URLSearchParams(h);
  const accessToken = p.get('access_token');
  if (!accessToken) return null;
  const exp = Number(p.get('expires_in'));
  return { accessToken, state: p.get('state'), expiresInSec: Number.isFinite(exp) && exp > 0 ? exp : null };
}

export function connectionFromToken(clientId: string, accessToken: string, expiresInSec: number | null, now = new Date()): OuraConnection {
  const seconds = expiresInSec ?? OURA_TOKEN_DAYS * 86_400;
  return { clientId, accessToken, expiresAt: new Date(now.getTime() + seconds * 1000).toISOString(), lastSync: null };
}

export function connectionExpired(c: OuraConnection, now = new Date()): boolean {
  return new Date(c.expiresAt).getTime() <= now.getTime();
}

type Json = Record<string, unknown>;
const num = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) ? x : null);
const str = (x: unknown): string | null => (typeof x === 'string' ? x : null);

/** Fügt die drei Oura-Antworten (Schlaf-Details, Schlaf-Score, Bereitschaft) zu Tagen zusammen. */
export function mapOura(sleep: Json[], dailySleep: Json[], readiness: Json[], vo2: Json[] = []): WearableDay[] {
  const days = new Map<string, WearableDay>();
  const get = (date: string): WearableDay => {
    let d = days.get(date);
    if (!d) {
      d = { date, source: 'oura', sleepHours: null, sleepScore: null, readiness: null, restingHr: null, hrv: null };
      days.set(date, d);
    }
    return d;
  };
  // Mehrere Schlafphasen pro Tag: die längste zählt (lange Nachtschlaf-Phase).
  const longest = new Map<string, Json>();
  for (const s of sleep) {
    const date = str(s.day);
    if (!date) continue;
    const prev = longest.get(date);
    if (!prev || (num(s.total_sleep_duration) ?? 0) > (num(prev.total_sleep_duration) ?? 0)) longest.set(date, s);
  }
  for (const [date, s] of longest) {
    const d = get(date);
    const secs = num(s.total_sleep_duration);
    d.sleepHours = secs === null ? null : Math.round((secs / 3600) * 10) / 10;
    d.restingHr = num(s.lowest_heart_rate);
    d.hrv = num(s.average_hrv);
  }
  for (const s of dailySleep) {
    const date = str(s.day);
    if (date) get(date).sleepScore = num(s.score);
  }
  for (const r of readiness) {
    const date = str(r.day);
    if (date) get(date).readiness = num(r.score);
  }
  // VO2max: Endpunkt vO2_max, Feld vo2_max je Tag (laut Oura-API-Schema)
  for (const v of vo2) {
    const date = str(v.day);
    const value = num(v.vo2_max);
    if (date && value !== null) get(date).vo2max = value;
  }
  return [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export class OuraError extends Error {
  constructor(public kind: 'abgelaufen' | 'netzwerk' | 'antwort', message: string) {
    super(message);
  }
}

async function fetchAll(endpoint: string, token: string, start: string, end: string, fetchFn: typeof fetch): Promise<Json[]> {
  const out: Json[] = [];
  let next: string | null = null;
  for (let page = 0; page < 10; page++) {
    const q = new URLSearchParams({ start_date: start, end_date: end });
    if (next) q.set('next_token', next);
    let res: Response;
    try {
      res = await fetchFn(`${OURA_API}/${endpoint}?${q.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
    } catch {
      throw new OuraError('netzwerk', 'Keine Verbindung zu Oura (Netz oder Browser-Sperre). Bitte später erneut versuchen.');
    }
    if (res.status === 401) throw new OuraError('abgelaufen', 'Der Oura-Zugang ist abgelaufen. Bitte neu verbinden.');
    if (!res.ok) throw new OuraError('antwort', `Oura meldet Fehler ${res.status}.`);
    const body = (await res.json()) as { data?: Json[]; next_token?: string | null };
    out.push(...(Array.isArray(body.data) ? body.data : []));
    next = body.next_token ?? null;
    if (!next) break;
  }
  return out;
}

export async function fetchOuraDays(token: string, start: string, end: string, fetchFn: typeof fetch = fetch): Promise<WearableDay[]> {
  const [sleep, dailySleep, readiness, vo2] = await Promise.all([
    fetchAll('sleep', token, start, end, fetchFn),
    fetchAll('daily_sleep', token, start, end, fetchFn),
    fetchAll('daily_readiness', token, start, end, fetchFn),
    // VO2max ist nicht für jeden Ring und jede Freigabe verfügbar; fehlt er, laufen die übrigen Daten trotzdem.
    fetchAll('vO2_max', token, start, end, fetchFn).catch((e: unknown) => {
      if (e instanceof OuraError && e.kind === 'abgelaufen') throw e;
      return [] as Json[];
    }),
  ]);
  return mapOura(sleep, dailySleep, readiness, vo2);
}
