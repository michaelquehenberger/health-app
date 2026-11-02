import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  UKK_MAX_AGE, UKK_MIN_AGE, ukkAgeOk,
  BALANCE_MAX_SECONDS, BALANCE_PAUSE_SECONDS, KNEE_WALL_SIDE_DIFF_CM, balanceReference, bestBalance, bmi, formatNum, sideDifference, sitToStandValue, ukkIndex,
} from '../calc';
import { Check, Seg } from '../components/ui';
import { Stopwatch } from '../components/Stopwatch';
import { PROTOCOL_VERSION, STOP_RULES, testDef, timepointLabel } from '../tests';
import type { InputValue, Measurement, Profile, TestId, TestRecord, Timepoint } from '../types';
import { formatDate, nowTime, todayIso, uid } from '../store';

const num = (s: string): number | null => {
  const t = s.trim().replace(',', '.');
  if (t === '' || t === '-') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

function NumField({ label, value, onChange, placeholder, allowNegative }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; allowNegative?: boolean }) {
  return (
    <label className="field">{label}
      <input type="text" inputMode={allowNegative ? 'text' : 'decimal'} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

/** Ergebnis eines Formulars: null = noch nicht vollständig */
interface FormOutput {
  inputs: Record<string, InputValue>;
  measurements: Measurement[];
  method: string;
}

type FormProps = { profile: Profile; mobilityLimited?: boolean; onOutput: (o: FormOutput | null) => void };

// ---------- T1 Ruhepuls ----------
function T1Form({ onOutput }: FormProps) {
  const [bpm, setBpm] = useState('');
  const [position, setPosition] = useState<'liegend' | 'sitzend'>('liegend');
  const [method, setMethod] = useState<'manuell' | 'pulsuhr' | 'messgeraet'>('manuell');
  const [irregular, setIrregular] = useState(false);
  const b = num(bpm);
  const methodLabel = { manuell: 'manuell gezählt', pulsuhr: 'Pulsuhr oder Ring', messgeraet: 'Blutdruckmessgerät' }[method];
  onOutputIf(onOutput, b !== null && b >= 25 && b <= 220, () => ({
    inputs: { bpm: b, position, irregular },
    measurements: [{ metric: 'ruhepuls', unit: 'bpm', value: b }],
    method: `${methodLabel}, ${position}`,
  }), [b, position, method, irregular]);
  return (
    <>
      <NumField label="Ruhepuls (Schläge pro Minute)" value={bpm} onChange={setBpm} />
      <Seg label="Position" value={position} onChange={setPosition} options={[{ value: 'liegend', label: 'liegend' }, { value: 'sitzend', label: 'sitzend' }]} />
      <Seg label="Methode" value={method} onChange={setMethod} options={[{ value: 'manuell', label: 'manuell gezählt' }, { value: 'pulsuhr', label: 'Pulsuhr/Ring' }, { value: 'messgeraet', label: 'Blutdruckmessgerät' }]} />
      <Check checked={irregular} onChange={setIrregular}>Der Rhythmus fühlte sich unregelmäßig an.</Check>
      {irregular && <p className="small muted">Wird vermerkt. Sprich das bei deinem nächsten Arzttermin an.</p>}
    </>
  );
}

// ---------- T2 UKK-Gehtest ----------
function T2Form({ profile, mobilityLimited = false, onOutput }: FormProps) {
  const [limited, setLimited] = useState(mobilityLimited);
  const [min, setMin] = useState('');
  const [sec, setSec] = useState('');
  const [pulse, setPulse] = useState('');
  const [track, setTrack] = useState<'laufbahn' | 'weg' | 'sonstiges'>('weg');
  const [h, setH] = useState(String(profile.heightCm ?? '').replace('.', ','));
  const [w, setW] = useState(String(profile.weightKg ?? '').replace('.', ','));
  const onStop = useCallback((s: number) => { setMin(String(Math.floor(s / 60))); setSec(String(Math.round(s % 60))); }, []);

  const mi = num(min), se = num(sec), pu = num(pulse), hc = num(h), wk = num(w);
  const b = hc && wk ? bmi(wk, hc) : null;
  const ok = mi !== null && mi >= 5 && mi <= 60 && se !== null && se >= 0 && se < 60 && pu !== null && pu >= 40 && pu <= 220 && b !== null;
  onOutputIf(onOutput, ok, () => {
    const r = ukkIndex({ sex: profile.sex, age: profile.age ?? 0, minutes: mi!, seconds: se!, pulse: pu!, bmi: b! }, { mobilityLimited: limited });
    const ms: Measurement[] = [
      { metric: 'gehzeit', unit: 's', value: mi! * 60 + se! },
      { metric: 'puls_ende', unit: 'bpm', value: pu },
      { metric: 'bmi', unit: 'kg/m²', value: Math.round(b! * 10) / 10 },
      { metric: 'alter', unit: 'Jahre', value: profile.age },
    ];
    if (r.kind === 'index') ms.push({ metric: 'fitness_index', unit: 'Index', value: Math.round(r.value * 10) / 10 });
    const trackLabel = { laufbahn: 'Laufbahn', weg: 'flacher Weg', sonstiges: 'sonstige Strecke' }[track];
    return { inputs: { minuten: mi, sekunden: se, puls: pu, groesse: hc, gewicht: wk, strecke: track, gehen_eingeschraenkt: limited }, measurements: ms, method: `UKK 2 km, ${trackLabel}` };
  }, [mi, se, pu, hc, wk, track, limited]);

  return (
    <>
      <Stopwatch mode="up" label="Gehzeit" onStop={onStop} />
      <div className="grid2">
        <NumField label="Minuten" value={min} onChange={setMin} />
        <NumField label="Sekunden" value={sec} onChange={setSec} />
      </div>
      <NumField label="Puls direkt am Ende (bpm)" value={pulse} onChange={setPulse} />
      <Seg label="Streckenart" value={track} onChange={setTrack} options={[{ value: 'laufbahn', label: 'Laufbahn' }, { value: 'weg', label: 'flacher Weg' }, { value: 'sonstiges', label: 'sonstige' }]} />
      <div className="grid2">
        <NumField label="Größe (cm)" value={h} onChange={setH} />
        <NumField label="Gewicht (kg)" value={w} onChange={setW} />
      </div>
      <p className="small">BMI: <strong>{formatNum(b)}</strong></p>
      <Check checked={limited} onChange={setLimited}>Mein zügiges Gehen ist durch eine Erkrankung oder Behinderung eingeschränkt.</Check>
      {limited && <p className="small muted">Dann gibt es keine Bewertung, nur Gehzeit und Puls als Verlauf.</p>}
    </>
  );
}

// ---------- T3 Sit-to-Stand ----------
function T3Form({ onOutput }: FormProps) {
  const [count, setCount] = useState('');
  const [arms, setArms] = useState(false);
  const c = num(count);
  onOutputIf(onOutput, c !== null && c >= 0 && c <= 80 && Number.isInteger(c), () => ({
    inputs: { anzahl: c, armeinsatz: arms },
    measurements: [{ metric: 'wiederholungen_30s', unit: 'Wdh.', value: sitToStandValue(c!, arms) }],
    method: '30-s-Chair-Stand',
  }), [c, arms]);
  return (
    <>
      <Stopwatch mode="down" countdown={30} label="30 Sekunden" />
      <NumField label="Anzahl vollständiger Aufsteh-Bewegungen" value={count} onChange={setCount} />
      <Check checked={arms} onChange={setArms}>Ich habe die Arme zu Hilfe genommen (Wert wird 0).</Check>
    </>
  );
}

// ---------- T4 Einbeinstand ----------
function T4Form({ onOutput }: FormProps) {
  const [trials, setTrials] = useState<{ links: string[]; rechts: string[] }>({ links: ['', '', ''], rechts: ['', '', ''] });
  const [leg, setLeg] = useState<'links' | 'rechts'>('links');
  const setTrial = (side: 'links' | 'rechts', i: number, v: string) =>
    setTrials((t) => ({ ...t, [side]: t[side].map((x, j) => (j === i ? v : x)) }));

  const [pauseKey, setPauseKey] = useState(0);
  const [pausing, setPausing] = useState(false);

  const onStop = useCallback((s: number) => {
    setTrials((t) => {
      const i = t[leg].findIndex((x) => x === '');
      if (i === -1) return t;
      const next = { ...t, [leg]: t[leg].map((x, j) => (j === i ? String(s).replace('.', ',') : x)) };
      // Pause nur, wenn noch ein Versuch folgt
      if ([...next.links, ...next.rechts].some((x) => x === '')) {
        setPausing(true);
        setPauseKey((k) => k + 1);
      }
      return next;
    });
  }, [leg]);

  const l = trials.links.map(num);
  const r = trials.rechts.map(num);
  const bl = bestBalance(l);
  const br = bestBalance(r);
  const ok = bl !== null && br !== null && [...l, ...r].every((x) => x === null || (x >= 0 && x <= BALANCE_MAX_SECONDS));
  onOutputIf(onOutput, ok, () => ({
    inputs: { links_1: l[0], links_2: l[1], links_3: l[2], rechts_1: r[0], rechts_2: r[1], rechts_3: r[2] },
    measurements: [
      { metric: 'bester_versuch_links', unit: 's', value: bl },
      { metric: 'bester_versuch_rechts', unit: 's', value: br },
    ],
    method: `Einbeinstand, Augen offen, 3 Versuche, max. ${BALANCE_MAX_SECONDS} s, ${BALANCE_PAUSE_SECONDS} s Pause`,
  }), [trials]);

  return (
    <>
      <Seg label="Stoppuhr für" value={leg} onChange={setLeg} options={[{ value: 'links', label: 'linkes Bein' }, { value: 'rechts', label: 'rechtes Bein' }]} />
      {pausing ? (
        <PauseTimer key={pauseKey} seconds={BALANCE_PAUSE_SECONDS} onDone={() => setPausing(false)} />
      ) : (
        <Stopwatch mode="up" maxSeconds={BALANCE_MAX_SECONDS} label={`Stand auf dem ${leg === 'links' ? 'linken' : 'rechten'} Bein`} onStop={onStop} />
      )}
      <p className="muted small">Die gestoppte Zeit wird in das nächste freie Feld eingetragen. Danach folgen {BALANCE_PAUSE_SECONDS} Sekunden Pause.</p>
      <div className="trials">
        <span />
        <span className="muted small">1</span><span className="muted small">2</span><span className="muted small">3</span>
        {(['links', 'rechts'] as const).map((side) => (
          <FragmentRow key={side}>
            <span className="small" style={{ fontWeight: 600 }}>{side === 'links' ? 'Links' : 'Rechts'}</span>
            {trials[side].map((v, i) => (
              <input key={i} type="text" inputMode="decimal" aria-label={`${side} Versuch ${i + 1} in Sekunden`} value={v} onChange={(e) => setTrial(side, i, e.target.value)} />
            ))}
          </FragmentRow>
        ))}
      </div>
      <p className="small">Beste Zeit: links <strong>{formatNum(bl)} s</strong>, rechts <strong>{formatNum(br)} s</strong></p>
    </>
  );
}
const FragmentRow = ({ children }: { children: ReactNode }) => <>{children}</>;

/** Pause zwischen zwei Versuchen; startet sofort und zählt herunter. */
function PauseTimer({ seconds, onDone }: { seconds: number; onDone: () => void }) {
  const [left, setLeft] = useState(seconds);
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    const start = performance.now();
    const id = setInterval(() => {
      const rest = Math.max(0, seconds - Math.floor((performance.now() - start) / 1000));
      setLeft(rest);
      if (rest === 0) {
        clearInterval(id);
        try {
          navigator.vibrate?.(300);
        } catch {
          /* nicht verfügbar */
        }
        done.current();
      }
    }, 250);
    return () => clearInterval(id);
  }, [seconds]);
  return (
    <div className="card mint" style={{ alignItems: 'center', textAlign: 'center' }} role="timer" aria-live="polite">
      <span className="label" style={{ color: 'var(--navy)' }}>Pause</span>
      <div className="stopwatch">{left}<span className="small"> s</span></div>
      <p className="small">Erholen. Danach startet die Stoppuhr für den nächsten Versuch.</p>
    </div>
  );
}

// ---------- T5 Knie-zur-Wand und T7 Sit-and-Reach ----------
function SidesForm({ onOutput, kind }: FormProps & { kind: 'T5' | 'T7' }) {
  const [left, setLeft] = useState('');
  const [right, setRight] = useState('');
  const [heelL, setHeelL] = useState(false);
  const [heelR, setHeelR] = useState(false);
  const [pain, setPain] = useState(false);
  const l = num(left), r = num(right);
  const range = kind === 'T5' ? [0, 30] : [-50, 50];
  const ok = l !== null && r !== null && l >= range[0] && l <= range[1] && r >= range[0] && r <= range[1];
  onOutputIf(onOutput, ok, () => {
    const ms: Measurement[] = [
      { metric: 'abstand_links', unit: 'cm', value: l },
      { metric: 'abstand_rechts', unit: 'cm', value: r },
    ];
    if (kind === 'T5') ms.push({ metric: 'seitendifferenz', unit: 'cm', value: sideDifference(l, r) });
    const inputs: Record<string, InputValue> = { links: l, rechts: r, schmerz: pain };
    if (kind === 'T5') Object.assign(inputs, { ferse_abgehoben_links: heelL, ferse_abgehoben_rechts: heelR });
    return {
      inputs,
      measurements: ms,
      method: kind === 'T5' ? 'Knie-zur-Wand' : 'Chair Sit-and-Reach',
    };
  }, [l, r, heelL, heelR, pain]);
  return (
    <>
      <div className="grid2">
        <NumField label="Links (cm)" value={left} onChange={setLeft} placeholder={kind === 'T7' ? 'Lücke = minus' : undefined} allowNegative={kind === 'T7'} />
        <NumField label="Rechts (cm)" value={right} onChange={setRight} placeholder={kind === 'T7' ? 'Lücke = minus' : undefined} allowNegative={kind === 'T7'} />
      </div>
      {kind === 'T7' && <p className="muted">Erreichst du die Zehen nicht, trag den Abstand mit Minus ein, z. B. -5.</p>}
      {kind === 'T5' && (
        <>
          <Check checked={heelL} onChange={setHeelL}>Links ist die Ferse abgehoben.</Check>
          <Check checked={heelR} onChange={setHeelR}>Rechts ist die Ferse abgehoben.</Check>
        </>
      )}
      <Check checked={pain} onChange={setPain}>Ich hatte dabei Schmerzen.</Check>
    </>
  );
}

// ---------- T8 Liegestütz ----------
function T8Form({ onOutput }: FormProps) {
  const [reps, setReps] = useState('');
  const [variant, setVariant] = useState<'zehen' | 'knie'>('knie');
  const [reason, setReason] = useState<'erschoepfung' | 'technik' | 'schmerz' | 'anderer'>('erschoepfung');
  const n = num(reps);
  const reasonLabel = { erschoepfung: 'Erschöpfung', technik: 'Technik nicht mehr sauber', schmerz: 'Schmerz', anderer: 'anderer Grund' }[reason];
  onOutputIf(onOutput, n !== null && n >= 0 && n <= 150 && Number.isInteger(n), () => ({
    inputs: { wiederholungen: n, variante: variant, abbruchgrund: reasonLabel },
    measurements: [{ metric: 'wiederholungen', unit: 'Wdh.', value: n }],
    method: `Liegestütz auf ${variant === 'zehen' ? 'Zehen' : 'Knien'}`,
  }), [n, variant, reason]);
  return (
    <>
      <Seg label="Variante" value={variant} onChange={setVariant} options={[{ value: 'knie', label: 'auf den Knien' }, { value: 'zehen', label: 'auf den Zehen' }]} />
      <NumField label="Wiederholungen" value={reps} onChange={setReps} />
      <Seg label="Warum hast du aufgehört?" value={reason} onChange={setReason}
        options={[{ value: 'erschoepfung', label: 'Erschöpfung' }, { value: 'technik', label: 'Technik nicht mehr sauber' }, { value: 'schmerz', label: 'Schmerz' }, { value: 'anderer', label: 'anderer Grund' }]} />
    </>
  );
}

/** Meldet das Formularergebnis nach oben, sobald sich die Eingaben ändern (null = unvollständig). */
function onOutputIf(onOutput: (o: FormOutput | null) => void, ok: boolean, build: () => FormOutput, deps: unknown[]) {
  useEffect(() => {
    onOutput(ok ? build() : null);
    // build hängt nur von deps ab
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ok, onOutput, ...deps]);
}

// ---------- Ergebnis ----------
export function ResultView({ record, profile }: { record: TestRecord; profile: Profile }) {
  const m = (k: string) => record.measurements.find((x) => x.metric === k)?.value ?? null;
  const age = profile.age ?? 0;
  let main: ReactNode = null;
  let comparison: ReactNode = null;

  switch (record.testId) {
    case 'T1':
      main = <><span className="result-big">{formatNum(m('ruhepuls'), 0)}</span> <span className="muted">bpm</span></>;
      comparison = <p className="small">Kein Vergleichswert. Aus 5–7 Morgen bildet die App deinen Median.</p>;
      break;
    case 'T2': {
      const s = m('gehzeit') ?? 0;
      main = <><span className="result-big">{Math.floor(s / 60)}:{String(Math.round(s % 60)).padStart(2, '0')}</span> <span className="muted">min für 2 km</span></>;
      const r = ukkIndex(
        { sex: profile.sex, age: m('alter') ?? age, minutes: Math.floor(s / 60), seconds: s % 60, pulse: m('puls_ende') ?? 0, bmi: m('bmi') ?? 0 },
        { mobilityLimited: record.inputs.gehen_eingeschraenkt === true },
      );
      comparison = r.kind === 'index'
        ? <><p className="small">Fitness-Index: <strong className="big-num">{formatNum(r.value, 1)}</strong> · Bewertung: <strong>{r.rating}</strong></p>
          <p className="muted">Der Index ist eine Schätzung und eignet sich besser, um Veränderungen zu sehen, als für einen absoluten Wert.</p></>
        : <p className="small">{r.reason}</p>;
      break;
    }
    case 'T3':
      main = <><span className="result-big">{formatNum(m('wiederholungen_30s'), 0)}</span> <span className="muted">Wiederholungen</span></>;
      comparison = <p className="small">Kein Vergleichswert. Normen gibt es erst ab 60 Jahren; entscheidend ist dein Verlauf.</p>;
      break;
    case 'T4': {
      const ref = balanceReference(age);
      const tr = (side: 'links' | 'rechts') => [1, 2, 3].map((i) => record.inputs[`${side}_${i}`]).map((v) => (typeof v === 'number' ? formatNum(v) : '–')).join(' · ');
      main = <>
        <span className="result-big">{formatNum(m('bester_versuch_links'))} / {formatNum(m('bester_versuch_rechts'))}</span> <span className="muted">s, bester Versuch links / rechts</span>
        <p className="small muted">Versuche links: {tr('links')} s · rechts: {tr('rechts')} s</p>
      </>;
      comparison = ref
        ? <p className="small">Zum Vergleich: Mittelwert des besten Versuchs bei Menschen von {ref.group}: <strong>{formatNum(ref.mean)} s</strong> (Springer 2007, Augen offen).</p>
        : <p className="small">Für dein Alter zeigt die App keinen Vergleichswert.</p>;
      break;
    }
    case 'T5': {
      const d = m('seitendifferenz');
      main = <><span className="result-big">{formatNum(m('abstand_links'))} / {formatNum(m('abstand_rechts'))}</span> <span className="muted">cm links / rechts</span></>;
      comparison = d !== null && d >= KNEE_WALL_SIDE_DIFF_CM
        ? <p className="small"><span className="chip watch">Hinweis</span> Die Seiten unterscheiden sich um {formatNum(d)} cm. Achte bei der nächsten Messung darauf, ob der Unterschied bleibt.</p>
        : <p className="small">Kein auffälliger Seitenunterschied.</p>;
      break;
    }
    case 'T7':
      main = <><span className="result-big">{formatNum(m('abstand_links'))} / {formatNum(m('abstand_rechts'))}</span> <span className="muted">cm links / rechts</span></>;
      comparison = <p className="small">Kein Vergleichswert, nur dein Verlauf.</p>;
      break;
    case 'T8':
      main = <><span className="result-big">{formatNum(m('wiederholungen'), 0)}</span> <span className="muted">Wiederholungen ({record.inputs.variante === 'zehen' ? 'Zehen' : 'Knie'})</span></>;
      comparison = <p className="small">Vergleichswert derzeit nicht verfügbar. Die Anzahl der korrekt ausgeführten Liegestütze wird gespeichert.</p>;
      break;
  }

  return (
    <div className="card">
      <span className="label">Ergebnis · {timepointLabel(record.timepoint)} · {formatDate(record.date)}</span>
      <div>{main}</div>
      {comparison}
      <p className="muted">
        Datenqualität {record.quality} · {record.method} · Protokoll {record.protocolVersion ?? 'v0.1'}
        {record.timepointSource === 'manuell' ? ' · Messzeitpunkt manuell gewählt' : ''}
        {record.comment ? ` · ${record.comment}` : ''}
      </p>
    </div>
  );
}

// ---------- Test-Screen ----------
export function TestScreen({ testId, timepoint, timepointSource, profile, mobilityLimited = false, nextTestId = null, onNext, onSave, onBack }: {
  nextTestId?: TestId | null;
  onNext?: (id: TestId) => void;
  mobilityLimited?: boolean;
  testId: TestId;
  timepoint: Timepoint;
  timepointSource: 'vorschlag' | 'manuell';
  profile: Profile;
  onSave: (r: TestRecord) => void;
  onBack: () => void;
}) {
  const def = testDef(testId);
  const [output, setOutput] = useState<FormOutput | null>(null);
  const [date, setDate] = useState(todayIso());
  const [time, setTime] = useState(nowTime());
  const [deviated, setDeviated] = useState(false);
  const [comment, setComment] = useState('');
  const [saved, setSaved] = useState<TestRecord | null>(null);
  const [aborting, setAborting] = useState(false);
  const [abortReason, setAbortReason] = useState<string | null>(null);

  const base = (): Omit<TestRecord, 'inputs' | 'measurements' | 'method' | 'aborted'> => ({
    id: uid(), testId, timepoint, timepointSource, protocolVersion: PROTOCOL_VERSION, date, time, quality: deviated ? 'C' : 'B', comment: comment.trim(),
  });

  function save() {
    if (!output) return;
    const r: TestRecord = { ...base(), ...output, aborted: null };
    onSave(r);
    setSaved(r);
    window.scrollTo(0, 0);
  }

  function abort(reason: string) {
    const r: TestRecord = { ...base(), inputs: {}, measurements: [], method: def.name, aborted: reason, abortedAt: new Date().toISOString() };
    onSave(r);
    setAbortReason(reason);
    window.scrollTo(0, 0);
  }

  if (abortReason) {
    const medical = (STOP_RULES as readonly string[]).includes(abortReason);
    return (
      <>
        <div className={`card alert ${medical ? 'notfall' : ''}`} role="alert">
          <span className="label" style={{ color: 'inherit' }}>Test abgebrochen</span>
          <h2>{medical ? 'Bitte keine weiteren Tests heute.' : 'Der Abbruch ist gespeichert.'}</h2>
          {medical && (
            <p>Lass die Beschwerden ärztlich abklären, bevor du weitertestest. Bei starken oder anhaltenden Beschwerden wähle den Notruf 144.</p>
          )}
        </div>
        <button className="btn dark block" onClick={onBack}>Zurück zur Testmappe</button>
      </>
    );
  }

  if (saved) {
    return (
      <>
        <ResultView record={saved} profile={profile} />
        {nextTestId && nextTestId !== testId && onNext ? (
          <>
            <button className="btn primary block" onClick={() => onNext(nextTestId)}>Weiter: {testDef(nextTestId).name}</button>
            <button className="btn ghost block" onClick={onBack}>Zur Testmappe</button>
          </>
        ) : (
          <button className="btn primary block" onClick={onBack}>Zurück zur Testmappe</button>
        )}
      </>
    );
  }

  const Form = { T1: T1Form, T2: T2Form, T3: T3Form, T4: T4Form, T8: T8Form }[testId as 'T1'];

  return (
    <>
      <button className="btn ghost" style={{ alignSelf: 'flex-start', minHeight: 40 }} onClick={onBack}>← Testmappe</button>
      <div className="card dark">
        <span className="label">{def.id} · {def.group} · {timepointLabel(timepoint)}</span>
        <h1>{def.name}</h1>
        <p className="small"><strong>Ausgangsposition:</strong> {def.setup}</p>
        <p className="small"><strong>Versuche:</strong> {def.attempts}</p>
        <ol className="steps">{def.steps.map((s) => <li key={s}>{s}</li>)}</ol>
        <p className="small"><strong>Ende des Versuchs:</strong> {def.stop}</p>
        <p className="small"><strong>Ergebnis:</strong> {def.result}</p>
        <p className="small muted"><strong>Vergleich:</strong> {def.comparison}</p>
      </div>

      {testId === 'T2' && !ukkAgeOk(profile.age) && (
        <div className="card alert">
          <span className="label">Altersprüfung</span>
          <p className="small">
            Der UKK-Gehtest ist für Erwachsene von {UKK_MIN_AGE} bis {UKK_MAX_AGE} Jahren gedacht. Für dein Alter zeigt die App keinen Fitness-Index
            und keine Bewertung. Du kannst Gehzeit und Puls trotzdem als Verlauf festhalten.
          </p>
        </div>
      )}

      <div className="card note">
        <strong>Sofort aufhören bei:</strong>
        <ul className="small" style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 4 }}>{STOP_RULES.map((r) => <li key={r}>{r}</li>)}</ul>
        <p className="small">Dann den Test über „Test abbrechen“ beenden und ärztlich abklären lassen.</p>
      </div>

      <div className="card">
        <span className="label">Eingabe</span>
        {testId === 'T5' || testId === 'T7'
          ? <SidesForm kind={testId} profile={profile} onOutput={setOutput} />
          : <Form profile={profile} mobilityLimited={mobilityLimited} onOutput={setOutput} />}
        <div className="grid2">
          <label className="field">Datum<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
          <label className="field">Uhrzeit<input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></label>
        </div>
        <Check checked={deviated} onChange={setDeviated}>Ich bin von der Anleitung abgewichen oder habe Werte geschätzt (Datenqualität C statt B).</Check>
        <label className="field">Kommentar (optional)
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} />
        </label>
        <button className="btn primary block" disabled={!output} onClick={save}>Speichern</button>
        {!output && <p className="muted">Bitte alle Werte eintragen.</p>}
      </div>

      <div className="card">
        {!aborting ? (
          <button className="btn danger" onClick={() => setAborting(true)}>Test abbrechen</button>
        ) : (
          <>
            <span className="label">Warum brichst du ab?</span>
            {STOP_RULES.map((r) => <button key={r} className="btn danger" onClick={() => abort(r)}>{r}</button>)}
            <button className="btn ghost" onClick={() => abort('anderer Grund')}>Anderer Grund</button>
            <button className="btn ghost" style={{ border: 0 }} onClick={() => setAborting(false)}>Doch nicht abbrechen</button>
          </>
        )}
      </div>
    </>
  );
}
