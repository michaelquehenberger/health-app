import { Seg } from '../../components/ui';
import type { Profile } from '../../types';
import type { HealthProfile, HealthState } from '../types';
import { ComplaintScreen } from './ComplaintScreen';
import { LabsScreen } from './LabsScreen';
import { WearablesPanel } from './WearablesPanel';
import { HealthProfileForm } from './HealthProfileForm';

export type HealthView = 'beschwerden' | 'befunde' | 'wearables' | 'profil';

export function HealthHome({ data, update, fitnessProfile, view, setView, onComplaintDone }: {
  data: HealthState;
  update: (fn: (d: HealthState) => HealthState) => void;
  fitnessProfile: Profile;
  view: HealthView;
  setView: (v: HealthView) => void;
  onComplaintDone: () => void;
}) {
  return (
    <>
      <h1>Gesundheit</h1>
      <Seg<HealthView>
        label="Bereich"
        value={view}
        onChange={setView}
        options={[
          { value: 'beschwerden', label: 'Beschwerden' },
          { value: 'befunde', label: 'Befunde' },
          { value: 'wearables', label: 'Wearable' },
          { value: 'profil', label: 'Profil' },
        ]}
      />
      {view === 'beschwerden' && <ComplaintScreen data={data} update={update} onDone={onComplaintDone} />}
      {view === 'befunde' && <LabsScreen data={data} update={update} />}
      {view === 'wearables' && <WearablesPanel data={data} update={update} />}
      {view === 'profil' && (
        <HealthProfileForm
          initial={data.profile}
          onSave={(p: HealthProfile) => update((d) => ({ ...d, profile: { ...p, age: fitnessProfile.age, sex: fitnessProfile.sex } }))}
        />
      )}
    </>
  );
}
