import { useState } from 'react';
import { Check, Seg } from '../../components/ui';
import type { HealthProfile } from '../types';

export function HealthProfileForm({ initial, onSave }: { initial: HealthProfile; onSave: (p: HealthProfile) => void }) {
  const [p, setP] = useState<HealthProfile>(initial);
  const [saved, setSaved] = useState(false);
  const set = <K extends keyof HealthProfile>(k: K, v: HealthProfile[K]) => { setP((x) => ({ ...x, [k]: v })); setSaved(false); };

  return (
    <form className="card" onSubmit={(e) => { e.preventDefault(); onSave(p); setSaved(true); }}>
      <span className="label">Gesundheitsprofil</span>
      <p className="small muted">Alter und Geschlecht übernimmt die App aus deinem Profil. Hier stehen nur Angaben, die Ernährung, Trinkmenge und Supplement-Hinweise steuern.</p>
      <label className="field">Ernährungsform
        <input type="text" placeholder="z. B. Mischkost, vegetarisch, vegan" value={p.diet} onChange={(e) => set('diet', e.target.value)} />
      </label>
      <label className="field">Allergien und Unverträglichkeiten
        <textarea placeholder="z. B. Laktose, Nüsse; leer lassen, wenn keine" value={p.allergies} onChange={(e) => set('allergies', e.target.value)} />
      </label>
      <label className="field">Medikamente, die du regelmäßig nimmst
        <textarea placeholder="leer lassen, wenn keine" value={p.medications} onChange={(e) => set('medications', e.target.value)} />
      </label>
      <p className="small muted">Mit Medikamenten im Profil zeigt die App keine Supplement-Hinweise.</p>
      <Check checked={p.fluidRestriction} onChange={(v) => set('fluidRestriction', v)}>
        Ich habe eine Herz- oder Nierenerkrankung oder eine ärztliche Vorgabe zur Trinkmenge.
      </Check>
      <Seg label="Bewegungserfahrung" value={p.experience} onChange={(v) => set('experience', v)}
        options={[{ value: 'wenig', label: 'wenig' }, { value: 'mittel', label: 'mittel' }, { value: 'viel', label: 'viel' }]} />
      <Seg label="Zeit für Übungen pro Tag" value={String(p.minutesPerDay) as '5' | '10' | '15'} onChange={(v) => set('minutesPerDay', Number(v))}
        options={[{ value: '5', label: '5 Min.' }, { value: '10', label: '10 Min.' }, { value: '15', label: '15 Min.' }]} />
      <Seg label="Rhythmus" value={p.rhythm} onChange={(v) => set('rhythm', v)}
        options={[{ value: 'taeglich', label: 'täglich' }, { value: 'woechentlich', label: 'wöchentlich' }]} />
      <button type="submit" className="btn primary block">{saved ? 'Gespeichert' : 'Gesundheitsprofil speichern'}</button>
    </form>
  );
}
