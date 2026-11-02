import { useState } from 'react';
import { REGIONS, regionInfo, type Region } from '../data/exercises';
import { Check, PainScale, Seg } from '../../components/ui';
import type { HealthState, Complaint, ComplaintType, RedFlagAnswers } from '../types';
import { formatDate, todayIso, uid } from '../../store';

const TYPES: { value: ComplaintType; label: string }[] = [
  { value: 'steifigkeit', label: 'Steifigkeit' },
  { value: 'schwaeche', label: 'Schwäche, Unsicherheit' },
  { value: 'belastungsschmerz', label: 'Schmerz bei Belastung' },
  { value: 'druck', label: 'Druck' },
  { value: 'stechen', label: 'Stechen' },
  { value: 'misch', label: 'gemischt, unklar' },
];

const NO_FLAGS: RedFlagAnswers = {
  acuteHotJoint: false, fever: false, injury: false, systemic: false, neuro: false,
  suddenOnset: false, caudaEquina: false, chestPain: false, multipleSwollenJoints: false, longMorningStiffness: false,
};

// Punkte auf der Körperkarte (Vorderansicht); mehrere Punkte können dieselbe Region meinen.
const SPOTS: { region: Region; x: number; y: number }[] = [
  { region: 'nacken', x: 100, y: 62 },
  { region: 'schulter', x: 64, y: 84 }, { region: 'schulter', x: 136, y: 84 },
  { region: 'ruecken', x: 100, y: 140 },
  { region: 'hand', x: 36, y: 204 }, { region: 'hand', x: 164, y: 204 },
  { region: 'huefte', x: 78, y: 188 }, { region: 'huefte', x: 122, y: 188 },
  { region: 'knie', x: 84, y: 266 }, { region: 'knie', x: 116, y: 266 },
];

function BodyMap({ value, onChange }: { value: Region | null; onChange: (r: Region) => void }) {
  return (
    <div className="body-map">
      <svg viewBox="0 0 200 350" role="group" aria-label="Körperkarte: Region antippen">
        <g fill="none" stroke="#B8C6D1" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="100" cy="32" r="18" strokeWidth="6" />
          <path d="M100 56 V190" />
          <path d="M64 84 H136" />
          <path d="M64 84 L46 140 L38 196" />
          <path d="M136 84 L154 140 L162 196" />
          <path d="M78 188 H122" />
          <path d="M84 190 L84 266 L86 336" />
          <path d="M116 190 L116 266 L114 336" />
        </g>
        {SPOTS.map((s, i) => (
          <g
            key={i}
            className="spot"
            role="button"
            tabIndex={0}
            aria-pressed={value === s.region}
            aria-label={regionInfo(s.region).label}
            onClick={() => onChange(s.region)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange(s.region); } }}
          >
            <circle cx={s.x} cy={s.y} r="9" />
            <circle cx={s.x} cy={s.y} r="16" fill="transparent" stroke="none" />
          </g>
        ))}
      </svg>
    </div>
  );
}

export function ComplaintScreen({ data, update, onDone }: { data: HealthState; update: (fn: (d: HealthState) => HealthState) => void; onDone: () => void }) {
  const [region, setRegion] = useState<Region | null>(null);
  const [type, setType] = useState<ComplaintType>('steifigkeit');
  const [since, setSince] = useState('');
  const [intensity, setIntensity] = useState<number | null>(null);
  const [swelling, setSwelling] = useState(false);
  const [flags, setFlags] = useState<RedFlagAnswers>(NO_FLAGS);
  const setFlag = (k: keyof RedFlagAnswers, v: boolean) => setFlags((f) => ({ ...f, [k]: v }));

  const active = data.complaints.filter((c) => c.active);
  const valid = region !== null && intensity !== null;

  function save() {
    if (!valid || region === null || intensity === null) return;
    const c: Complaint = {
      id: uid(), date: todayIso(), region, type, since: since.trim(), intensity, swellingOrWarmth: swelling,
      redFlags: { ...flags, caudaEquina: region === 'ruecken' ? flags.caudaEquina : false }, active: true,
    };
    // Eine neue Angabe zur selben Region ersetzt die alte (die alte bleibt im Verlauf).
    update((d) => ({ ...d, complaints: [...d.complaints.map((x) => (x.region === region ? { ...x, active: false } : x)), c] }));
    onDone();
  }

  return (
    <>
      {active.length > 0 && (
        <div className="card">
          <span className="label">Aktuelle Beschwerden</span>
          {active.map((c) => (
            <div key={c.id} className="row between">
              <div>
                <strong>{regionInfo(c.region).label}</strong>
                <div className="muted">{TYPES.find((t) => t.value === c.type)?.label} · Intensität {c.intensity}/10 · seit {formatDate(c.date)}</div>
              </div>
              <button className="btn ghost" style={{ minHeight: 40 }}
                onClick={() => update((d) => ({ ...d, complaints: d.complaints.map((x) => (x.id === c.id ? { ...x, active: false } : x)) }))}>
                Abgeklungen
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <span className="label">Beschwerde eintragen · ca. 30 Sekunden</span>
        <h2>Wo spürst du es?</h2>
        <BodyMap value={region} onChange={setRegion} />
        <div className="seg" aria-label="Region als Liste">
          {REGIONS.map((r) => (
            <button key={r.id} type="button" aria-pressed={region === r.id} onClick={() => setRegion(r.id)}>{r.label}</button>
          ))}
        </div>
        <Seg label="Wie fühlt es sich an?" value={type} onChange={setType} options={TYPES} />
        <label className="field">Seit wann?
          <input type="text" placeholder="z. B. 3 Wochen, seit dem Frühjahr" value={since} onChange={(e) => setSince(e.target.value)} />
        </label>
        <PainScale label="Wie stark im Moment?" value={intensity} onChange={setIntensity} />
        <Check checked={swelling} onChange={setSwelling}>Das Gelenk ist geschwollen oder fühlt sich warm an.</Check>
      </div>

      <div className="card">
        <span className="label">Sicherheitsfragen</span>
        <p className="small">Trifft etwas davon zu? Diese Fragen entscheiden, ob die App einen Übungsplan zeigt.</p>
        <Check checked={flags.acuteHotJoint} onChange={(v) => setFlag('acuteHotJoint', v)}>Das Gelenk ist plötzlich stark schmerzhaft, heiß, gerötet oder kaum belastbar.</Check>
        <Check checked={flags.fever} onChange={(v) => setFlag('fever', v)}>Ich habe Fieber.</Check>
        <Check checked={flags.injury} onChange={(v) => setFlag('injury', v)}>Vor den Beschwerden gab es einen Sturz oder eine Verletzung.</Check>
        <Check checked={flags.systemic} onChange={(v) => setFlag('systemic', v)}>Schüttelfrost, ungewollter Gewichtsverlust oder Nachtschweiß.</Check>
        <Check checked={flags.neuro} onChange={(v) => setFlag('neuro', v)}>Taubheit, Kribbeln oder Kraftverlust in Arm oder Bein.</Check>
        <Check checked={flags.suddenOnset} onChange={(v) => setFlag('suddenOnset', v)}>Die Beschwerden kamen plötzlich und ohne erkennbaren Grund.</Check>
        {region === 'ruecken' && (
          <Check checked={flags.caudaEquina} onChange={(v) => setFlag('caudaEquina', v)}>Lähmung, Probleme beim Wasserlassen oder Stuhlgang.</Check>
        )}
        <Check checked={flags.chestPain} onChange={(v) => setFlag('chestPain', v)}>Brustschmerz oder Atemnot bei Belastung.</Check>
        <Check checked={flags.multipleSwollenJoints} onChange={(v) => setFlag('multipleSwollenJoints', v)}>Mehrere Gelenke sind geschwollen.</Check>
        <Check checked={flags.longMorningStiffness} onChange={(v) => setFlag('longMorningStiffness', v)}>Die Steifigkeit am Morgen hält länger als 30 Minuten an.</Check>
        <button className="btn primary block" disabled={!valid} onClick={save}>Speichern und Plan ansehen</button>
        {!valid && <p className="muted">Bitte Region und Stärke angeben.</p>}
      </div>
    </>
  );
}
