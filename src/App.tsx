import { useEffect, useState, type ReactNode } from 'react';
import { daysBetween, todayIso, useAppData } from './store';
import { anamnesisValid, latestAnamnesis } from './parq';
import { Icon, Wordmark } from './components/ui';
import { Welcome } from './screens/Welcome';
import { ProfileForm } from './screens/ProfileForm';
import { AnamnesisScreen } from './screens/AnamnesisScreen';
import { FolderScreen } from './screens/FolderScreen';
import { TestScreen } from './screens/TestScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { baselineDate, nextStep, suggestTimepoint } from './results';
import type { TestId, Timepoint } from './types';

type Tab = 'tests' | 'anamnese' | 'verlauf' | 'einstellungen';

const TABS: { id: Tab; label: string; icon: () => ReactNode }[] = [
  { id: 'tests', label: 'Tests', icon: Icon.today },
  { id: 'anamnese', label: 'Anamnese', icon: Icon.leaf },
  { id: 'verlauf', label: 'Verlauf', icon: Icon.pulse },
  { id: 'einstellungen', label: 'Einstellungen', icon: Icon.gear },
];

export function App() {
  const { data, update, replace, reset } = useAppData();
  const [tab, setTab] = useState<Tab>('tests');
  const [test, setTest] = useState<TestId | null>(null);
  const base = baselineDate(data.records);
  const suggested = suggestTimepoint(data.records, base ? daysBetween(base, todayIso()) : null);
  const [chosen, setChosen] = useState<Timepoint | null>(null);
  const timepoint = chosen ?? suggested;
  const unlocked = anamnesisValid(latestAnamnesis(data.anamneses), todayIso());

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tab, test]);

  if (!data.consent) {
    return <Welcome onAccept={(consent) => update((d) => ({ ...d, consent }))} />;
  }
  if (!data.profile) {
    return (
      <div className="app" style={{ paddingBottom: 32 }}>
        <div className="topbar"><Wordmark /><span className="badge-test">Testphase</span></div>
        <h1>Dein Profil</h1>
        <ProfileForm initial={null} submitLabel="Weiter zur Anamnese" onSave={(profile) => { update((d) => ({ ...d, profile })); setTab('anamnese'); }} />
      </div>
    );
  }
  const profile = data.profile;

  return (
    <>
      <main className="app">
        <div className="topbar"><Wordmark /><span className="badge-test">{profile.participantId} · Testphase</span></div>
        {tab === 'tests' && test && unlocked ? (
          <TestScreen
            key={test + timepoint}
            testId={test}
            timepoint={timepoint}
            timepointSource={timepoint === suggested ? 'vorschlag' : 'manuell'}
            profile={profile}
            mobilityLimited={latestAnamnesis(data.anamneses)?.answersB['9b'] === 'ja'}
            nextTestId={(() => { const n = nextStep(data.records, timepoint, todayIso()); return n.kind === 'test' ? n.testId : null; })()}
            onNext={(id) => setTest(id)}
            onSave={(r) => update((d) => ({ ...d, records: [...d.records, r] }))}
            onBack={() => setTest(null)}
          />
        ) : tab === 'tests' ? (
          <FolderScreen data={data} update={update} goHistory={() => setTab('verlauf')} goSettings={() => setTab('einstellungen')} unlocked={unlocked} timepoint={timepoint} suggested={suggested} setTimepoint={setChosen} openTest={setTest} openGate={() => setTab('anamnese')} />
        ) : null}
        {tab === 'anamnese' && <AnamnesisScreen data={data} update={update} onDone={() => window.scrollTo(0, 0)} goTests={() => setTab('tests')} />}
        {tab === 'verlauf' && <HistoryScreen data={data} profile={profile} />}
        {tab === 'einstellungen' && <SettingsScreen data={data} update={update} replace={replace} reset={reset} openGate={() => setTab('anamnese')} />}
      </main>
      <nav className="nav" aria-label="Hauptnavigation">
        <div className="nav-inner">
          {TABS.map((t) => (
            <button key={t.id} aria-current={tab === t.id ? 'page' : undefined} onClick={() => { setTab(t.id); setTest(null); }}>
              <t.icon />
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
