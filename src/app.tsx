import { useEffect, useState } from 'preact/hooks';
import { getSettings, saveSettings } from './db/repo';
import { useRoute } from './lib/router';
import { TabBar } from './components/TabBar';
import { ConfirmHost } from './components/Confirm';
import { Home } from './screens/Home';
import { Settings } from './screens/Settings';
import { ExerciseEdit, ExerciseList } from './screens/Exercises';
import { PlanEdit, PlanList } from './screens/Plans';
import { RunWorkout, StartWorkout, WorkoutSummary } from './screens/Workout';
import { HistoryList, ProgressDetail, ProgressList, SessionDetail } from './screens/History';
import { loadSeed, migrateSeed } from './lib/seed';

export function App() {
  const [route0, route1, route2] = useRoute();
  const [onboarded, setOnboarded] = useState<boolean>();

  useEffect(() => {
    // Prima applica eventuali revisioni del seed (foto, superserie), poi mostra l'app.
    // Primo avvio: carica da solo i tuoi esercizi e schede, nessuna procedura.
    (async () => {
      let st = await getSettings();
      if (!st.onboardingDone) {
        await loadSeed().catch(() => {});
        await saveSettings({ onboardingDone: true });
      } else {
        await migrateSeed().catch(() => {});
      }
      st = await getSettings();
      setOnboarded(st.onboardingDone);
    })();
    void navigator.storage?.persist?.();
  }, []);

  if (onboarded === undefined) return null;

  let screen;
  switch (route0) {
    case 'allena':
      screen = route1 === 'corsa' ? <RunWorkout />
        : route1 === 'fine' && route2 ? <WorkoutSummary id={route2} />
        : <StartWorkout />;
      break;
    case 'schede': screen = route1 ? <PlanEdit id={route1} key={route1} /> : <PlanList />; break;
    case 'esercizi': screen = route1 ? <ExerciseEdit id={route1} key={route1} /> : <ExerciseList />; break;
    case 'storico': screen = route1 ? <SessionDetail id={route1} key={route1} /> : <HistoryList />; break;
    case 'progressi': screen = route1 ? <ProgressDetail id={route1} key={route1} /> : <ProgressList />; break;
    case 'impostazioni': screen = <Settings />; break;
    default: screen = <Home />;
  }
  return (
    <div class="shell">
      {screen}
      {!(route0 === 'allena' && route1 === 'corsa') && <TabBar current={route0 === 'progressi' ? 'storico' : route0 ?? ''} />}
      <ConfirmHost />
    </div>
  );
}
