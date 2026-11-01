import { useState } from 'react';
import { bmi, formatNum, type Sex } from '../calc';
import type { Profile } from '../types';

const EMPTY_PROFILE: Profile = { participantId: 'T01', age: null, sex: '', heightCm: null, weightKg: null, goal: '' };

const num = (s: string) => {
  const t = s.trim().replace(',', '.');
  return t === '' ? null : Number.isFinite(Number(t)) ? Number(t) : null;
};

export function ProfileForm({ initial, onSave, submitLabel }: { initial: Profile | null; onSave: (p: Profile) => void; submitLabel: string }) {
  const [p, setP] = useState<Profile>({ ...EMPTY_PROFILE, ...initial });
  const [h, setH] = useState(p.heightCm?.toString().replace('.', ',') ?? '');
  const [w, setW] = useState(p.weightKg?.toString().replace('.', ',') ?? '');
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setP((x) => ({ ...x, [k]: v }));

  const heightCm = num(h);
  const weightKg = num(w);
  const b = heightCm && weightKg ? bmi(weightKg, heightCm) : null;
  const valid = p.participantId.trim() && p.age !== null && p.age >= 18 && p.age <= 110 && p.sex && heightCm && heightCm > 100 && heightCm < 230 && weightKg && weightKg > 30 && weightKg < 300;

  return (
    <form className="card" onSubmit={(e) => { e.preventDefault(); if (valid) onSave({ ...p, heightCm, weightKg }); }}>
      <span className="label">Profil</span>
      <label className="field">Teilnehmer-ID
        <input type="text" value={p.participantId} onChange={(e) => set('participantId', e.target.value)} />
      </label>
      <p className="muted">Kein Name: Die App speichert nur diese Kennung.</p>
      <div className="grid2">
        <label className="field">Alter (Jahre)
          <input type="number" inputMode="numeric" min={18} max={110} value={p.age ?? ''} onChange={(e) => set('age', e.target.value ? Number(e.target.value) : null)} />
        </label>
        <label className="field">Geschlecht
          <select value={p.sex} onChange={(e) => set('sex', e.target.value as Sex)}>
            <option value="">bitte wählen</option>
            <option value="weiblich">weiblich</option>
            <option value="maennlich">männlich</option>
            <option value="divers">divers</option>
          </select>
        </label>
        <label className="field">Größe (cm)
          <input type="text" inputMode="decimal" value={h} onChange={(e) => setH(e.target.value)} />
        </label>
        <label className="field">Gewicht (kg)
          <input type="text" inputMode="decimal" value={w} onChange={(e) => setW(e.target.value)} />
        </label>
      </div>
      <p className="small">BMI: <strong className="num">{formatNum(b)}</strong> <span className="muted">(wird berechnet)</span></p>
      <label className="field">Dein Ziel
        <textarea placeholder="z. B. beweglicher werden, Treppen leichter steigen" value={p.goal} onChange={(e) => set('goal', e.target.value)} />
      </label>
      <button type="submit" className="btn primary block" disabled={!valid}>{submitLabel}</button>
      {!valid && <p className="muted">Bitte Teilnehmer-ID, Alter, Geschlecht, Größe und Gewicht angeben.</p>}
    </form>
  );
}
