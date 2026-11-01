import { useEffect, useState, type ReactNode } from 'react';
import { useAppData } from './store';
import { Icon, Wordmark } from './components/ui';
import { Welcome } from './screens/Welcome';
import { ProfileForm } from './screens/ProfileForm';
import { TodayScreen } from './screens/TodayScreen';
import { ComplaintScreen } from './screens/ComplaintScreen';
import { LabsScreen } from './screens/LabsScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { SettingsScreen } from './screens/SettingsScreen';

type Tab = 'heute' | 'beschwerde' | 'werte' | 'verlauf' | 'einstellungen';

const TABS: { id: Tab; label: string; icon: () => ReactNode }[] = [
  { id: 'heute', label: 'Heute', icon: Icon.today },
  { id: 'beschwerde', label: 'Beschwerde', icon: Icon.body },
  { id: 'werte', label: 'Werte', icon: Icon.drop },
  { id: 'verlauf', label: 'Verlauf', icon: Icon.pulse },
  { id: 'einstellungen', label: 'Einstellungen', icon: Icon.gear },
];

export function App() {
  const { data, update, reset } = useAppData();
  const [tab, setTab] = useState<Tab>('heute');
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tab]);

  if (!data.consent) {
    return <Welcome onAccept={(consent) => update((d) => ({ ...d, consent }))} />;
  }
  if (!data.profile) {
    return (
      <div className="app" style={{ paddingBottom: 32 }}>
        <div className="topbar"><Wordmark /><span className="badge-test">Testphase</span></div>
        <h1>Erzähl uns kurz von dir.</h1>
        <ProfileForm initial={null} submitLabel="Profil speichern" onSave={(profile) => { update((d) => ({ ...d, profile })); setTab('beschwerde'); }} />
      </div>
    );
  }

  return (
    <>
      <main className="app">
        <div className="topbar"><Wordmark /><span className="badge-test">Testphase</span></div>
        {tab === 'heute' && <TodayScreen data={data} update={update} goComplaint={() => setTab('beschwerde')} />}
        {tab === 'beschwerde' && <ComplaintScreen data={data} update={update} onDone={() => setTab('heute')} />}
        {tab === 'werte' && <LabsScreen data={data} update={update} />}
        {tab === 'verlauf' && <HistoryScreen data={data} />}
        {tab === 'einstellungen' && <SettingsScreen data={data} update={update} reset={reset} />}
      </main>
      <nav className="nav" aria-label="Hauptnavigation">
        <div className="nav-inner">
          {TABS.map((t) => (
            <button key={t.id} aria-current={tab === t.id ? 'page' : undefined} onClick={() => setTab(t.id)}>
              <t.icon />
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
