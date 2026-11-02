import { useEffect, useState, type ReactNode } from 'react';
import { daysBetween, gateValid, todayIso, useAppData } from './store';
import { Icon, Wordmark } from './components/ui';
import { Welcome } from './screens/Welcome';
import { ProfileForm } from './screens/ProfileForm';
import { GateScreen } from './screens/GateScreen';
import { FolderScreen } from './screens/FolderScreen';
import { TestScreen } from './screens/TestScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { baselineDate, suggestTimepoint } from './results';
import type { TestId, Timepoint } from './types';

type Tab = 'tests' | 'gate' | 'verlauf' | 'einstellungen';

const TABS: { id: Tab; label: string; icon: () => ReactNode }[] = [
  { id: 'tests', label: 'Tests', icon: Icon.today },
  { id: 'gate', label: 'Sicherheit', icon: Icon.leaf },
  { id: 'verlauf', label: 'Verlauf', icon: Icon.pulse },
  { id: 'einstellungen', label: 'Einstellungen', icon: Icon.gear },
];

export function App() {
  const { data, update, replace, reset } = useAppData();
  const [tab, setTab] = useState<Tab>('tests');
  const [test, setTest] = useState<TestId | null>(null);
  const base = baselineDate(data.records);
  const [timepoint, setTimepoint] = useState<Timepoint>(() => suggestTimepoint(data.records, base ? daysBetween(base, todayIso()) : null));

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
        <ProfileForm initial={null} submitLabel="Weiter zum Sicherheitscheck" onSave={(profile) => { update((d) => ({ ...d, profile })); setTab('gate'); }} />
      </div>
    );
  }
  const profile = data.profile;

  return (
    <>
      <main className="app">
        <div className="topbar"><Wordmark /><span className="badge-test">{profile.participantId} · Testphase</span></div>
        {tab === 'tests' && test && gateValid(data.gate) ? (
          <TestScreen
            key={test + timepoint}
            testId={test}
            timepoint={timepoint}
            profile={profile}
            onSave={(r) => update((d) => ({ ...d, records: [...d.records, r] }))}
            onBack={() => setTest(null)}
          />
        ) : tab === 'tests' ? (
          <FolderScreen data={data} timepoint={timepoint} setTimepoint={setTimepoint} openTest={setTest} openGate={() => setTab('gate')} />
        ) : null}
        {tab === 'gate' && <GateScreen gate={data.gate} onChange={(gate) => update((d) => ({ ...d, gate }))} onDone={() => setTab('tests')} />}
        {tab === 'verlauf' && <HistoryScreen data={data} profile={profile} />}
        {tab === 'einstellungen' && <SettingsScreen data={data} update={update} replace={replace} reset={reset} openGate={() => setTab('gate')} />}
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
