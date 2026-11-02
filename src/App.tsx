import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
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
import { EMPTY_HEALTH, type HealthState } from './health/types';
import { TodayScreen } from './health/screens/TodayScreen';
import { HealthHome, type HealthView } from './health/screens/HealthHome';
import { HealthConsent } from './health/screens/HealthConsent';
import { OURA_CLIENT_KEY, OURA_STATE_KEY } from './health/screens/WearablesPanel';
import { connectionFromToken, parseTokenHash } from './health/wearables/oura';
import { computeJourney, healthItems, type StepId } from './journey';
import { JourneyPanel, HealthChecklist } from './screens/JourneyPanel';
import type { TestId, Timepoint } from './types';

type Tab = 'heute' | 'gesundheit' | 'tests' | 'anamnese' | 'verlauf' | 'einstellungen';

const TABS: { id: Tab; label: string; icon: () => ReactNode }[] = [
  { id: 'heute', label: 'Heute', icon: Icon.today },
  { id: 'gesundheit', label: 'Gesundheit', icon: Icon.drop },
  { id: 'tests', label: 'Tests', icon: Icon.body },
  { id: 'verlauf', label: 'Verlauf', icon: Icon.pulse },
  { id: 'einstellungen', label: 'Mehr', icon: Icon.gear },
];

export function App() {
  const { data, update, replace, reset } = useAppData();
  const [tab, setTab] = useState<Tab>('heute');
  const [healthView, setHealthView] = useState<HealthView>('beschwerden');
  const [test, setTest] = useState<TestId | null>(null);
  const base = baselineDate(data.records);
  const suggested = suggestTimepoint(data.records, base ? daysBetween(base, todayIso()) : null);
  const [chosen, setChosen] = useState<Timepoint | null>(null);
  const timepoint = chosen ?? suggested;
  const unlocked = anamnesisValid(latestAnamnesis(data.anamneses), todayIso());
  const health = data.health ?? EMPTY_HEALTH;
  // Stabil und ohne neue Objekte, wenn sich nichts ändert; sonst würden Effekte in den Bildschirmen endlos laufen.
  const updateHealth = useCallback(
    (fn: (h: HealthState) => HealthState) =>
      update((d) => {
        const cur = d.health ?? EMPTY_HEALTH;
        const next = fn(cur);
        return next === cur && d.health ? d : { ...d, health: next };
      }),
    [update],
  );
  const healthView4Today = useMemo(
    () => (data.profile ? { ...health, profile: { ...health.profile, age: data.profile.age, sex: data.profile.sex } } : health),
    [health, data.profile],
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tab, test, healthView]);

  // Rückkehr vom Oura-Login: Der Zugang steht im Adressteil nach dem „#“.
  useEffect(() => {
    const t = parseTokenHash(window.location.hash);
    if (!t) return;
    let expectedState: string | null = null;
    let clientId = '';
    try {
      expectedState = sessionStorage.getItem(OURA_STATE_KEY);
      clientId = localStorage.getItem(OURA_CLIENT_KEY) ?? '';
      sessionStorage.removeItem(OURA_STATE_KEY);
    } catch {
      /* ignorieren */
    }
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    if (!expectedState || t.state !== expectedState) return;
    update((d) => ({ ...d, health: { ...(d.health ?? EMPTY_HEALTH), oura: connectionFromToken(clientId, t.accessToken, t.expiresInSec) } }));
    setTab('gesundheit');
    setHealthView('wearables');
  }, [update]);

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
  const needsHealthConsent = tab === 'gesundheit' && !health.consent;
  const journey = computeJourney(data, todayIso());
  const healthReady = journey.steps.find((s) => s.id === 'gesundheit')?.status === 'erledigt';
  const goHealth = () => {
    const items = healthItems(data);
    const open = items.find((i) => !i.done && i.id !== 'einwilligung');
    setHealthView(open?.id === 'wearable' ? 'wearables' : open?.id === 'beschwerden' ? 'beschwerden' : 'befunde');
    setTab('gesundheit');
  };
  const go = (id: StepId) => {
    setTest(null);
    if (id === 'profil') setTab('einstellungen');
    else if (id === 'anamnese') setTab('anamnese');
    else if (id === 'testmappe') setTab('tests');
    else if (id === 'gesundheit') goHealth();
    else {
      setTab('heute');
      setTimeout(() => document.getElementById('plan')?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  };

  return (
    <>
      <main className="app">
        <div className="topbar"><Wordmark /><span className="badge-test">{profile.participantId} · Testphase</span></div>
        {tab === 'heute' && <JourneyPanel journey={journey} go={go} />}
        {tab === 'gesundheit' && <HealthChecklist items={journey.healthItems} />}
        {needsHealthConsent && <HealthConsent onAccept={(consent) => updateHealth((h) => ({ ...h, consent }))} />}
        {tab === 'heute' && health.consent && healthReady && (
          <div id="plan" className="stack" style={{ gap: 16 }}>
          <div className="card">
            <span className="label">Auswertung und Übungsplan</span>
            <p className="small">
              Dein Tagesplan unten entsteht aus deiner Anamnese, deinen Beschwerden und deinen Blutwerten.
              Als Nächstes kommt die KI-Auswertung dazu: Sie bezieht auch deine Testwerte und deine Oura-Daten (Schlaf, HRV, Ruhepuls, VO2max) ein.
            </p>
          </div>
          <TodayScreen
            data={healthView4Today}
            update={updateHealth}
            unlocked={unlocked}
            openGate={() => setTab('anamnese')}
            goComplaint={() => { setHealthView('beschwerden'); setTab('gesundheit'); }}
            goWearables={() => { setHealthView('wearables'); setTab('gesundheit'); }}
          />
          </div>
        )}
        {tab === 'gesundheit' && health.consent && (
          <HealthHome
            data={health}
            update={updateHealth}
            fitnessProfile={profile}
            view={healthView}
            setView={setHealthView}
            onComplaintDone={() => setTab('heute')}
          />
        )}
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
          <FolderScreen data={data} update={update} goHealth={goHealth} goHistory={() => setTab('verlauf')} goSettings={() => setTab('einstellungen')} unlocked={unlocked} timepoint={timepoint} suggested={suggested} setTimepoint={setChosen} openTest={setTest} openGate={() => setTab('anamnese')} />
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
