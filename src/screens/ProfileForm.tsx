import { useState } from 'react';
import { Check, Seg } from '../components/ui';
import type { Profile } from '../types';

const EMPTY_PROFILE: Profile = {
  name: '', age: null, sex: '', diet: '', allergies: '', medications: '', fluidRestriction: false,
  experience: 'wenig', minutesPerDay: 10, rhythm: 'taeglich',
};

export function ProfileForm({ initial, onSave, submitLabel }: { initial: Profile | null; onSave: (p: Profile) => void; submitLabel: string }) {
  const [p, setP] = useState<Profile>({ ...EMPTY_PROFILE, ...initial });
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setP((x) => ({ ...x, [k]: v }));
  const valid = p.name.trim() && p.age !== null && p.age >= 18 && p.age <= 110;

  return (
    <form className="card" onSubmit={(e) => { e.preventDefault(); if (valid) onSave(p); }}>
      <span className="label">Profil · ca. 5 Minuten</span>
      <label className="field">Vorname
        <input type="text" value={p.name} onChange={(e) => set('name', e.target.value)} autoComplete="given-name" />
      </label>
      <div className="grid2">
        <label className="field">Alter
          <input type="number" inputMode="numeric" min={18} max={110} value={p.age ?? ''} onChange={(e) => set('age', e.target.value ? Number(e.target.value) : null)} />
        </label>
        <label className="field">Geschlecht
          <select value={p.sex} onChange={(e) => set('sex', e.target.value as Profile['sex'])}>
            <option value="">keine Angabe</option>
            <option value="weiblich">weiblich</option>
            <option value="maennlich">männlich</option>
            <option value="divers">divers</option>
          </select>
        </label>
      </div>
      <label className="field">Ernährungsform
        <input type="text" placeholder="z. B. Mischkost, vegetarisch, vegan" value={p.diet} onChange={(e) => set('diet', e.target.value)} />
      </label>
      <label className="field">Allergien und Unverträglichkeiten
        <textarea placeholder="z. B. Laktose, Nüsse; leer lassen, wenn keine" value={p.allergies} onChange={(e) => set('allergies', e.target.value)} />
      </label>
      <label className="field">Medikamente, die du regelmäßig nimmst
        <textarea placeholder="leer lassen, wenn keine" value={p.medications} onChange={(e) => set('medications', e.target.value)} />
      </label>
      <Check checked={p.fluidRestriction} onChange={(v) => set('fluidRestriction', v)}>
        Ich habe eine Herz- oder Nierenerkrankung oder eine ärztliche Vorgabe zur Trinkmenge.
      </Check>
      <Seg label="Bewegungserfahrung" value={p.experience} onChange={(v) => set('experience', v)}
        options={[{ value: 'wenig', label: 'wenig' }, { value: 'mittel', label: 'mittel' }, { value: 'viel', label: 'viel' }]} />
      <Seg label="Zeit für Übungen pro Tag" value={String(p.minutesPerDay) as '5' | '10' | '15'} onChange={(v) => set('minutesPerDay', Number(v))}
        options={[{ value: '5', label: '5 Min.' }, { value: '10', label: '10 Min.' }, { value: '15', label: '15 Min.' }]} />
      <Seg label="Rhythmus" value={p.rhythm} onChange={(v) => set('rhythm', v)}
        options={[{ value: 'taeglich', label: 'täglich' }, { value: 'woechentlich', label: 'wöchentlich' }]} />
      <button type="submit" className="btn primary block" disabled={!valid}>{submitLabel}</button>
      {!valid && <p className="muted">Vorname und Alter (ab 18) sind Pflicht.</p>}
    </form>
  );
}
