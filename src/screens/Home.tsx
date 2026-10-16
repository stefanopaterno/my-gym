import { useEffect, useState } from 'preact/hooks';
import type { Plan, Session, Settings } from '../db/schema';
import { DEFAULT_SETTINGS } from '../db/schema';
import { deleteSession, getSettings, listPlans, listSessions, saveSettings } from '../db/repo';
import { confirmAsk } from '../components/Confirm';
import { IconSettings } from '../components/Icons';
import { fmtDayLong, fmtNum } from '../lib/format';
import { sessionSetsDone, sessionVolume, startOfWeek } from '../lib/stats';
import { go } from '../lib/router';
import { suggestPlan } from './Workout';

const DAY = 86400000;
const BACKUP_EVERY_DAYS = 14;
const ago = (t: number) => {
  const d = Math.floor((Date.now() - t) / DAY);
  return d <= 0 ? 'oggi' : d === 1 ? 'ieri' : `${d} giorni fa`;
};
const standalone = () =>
  (navigator as unknown as { standalone?: boolean }).standalone === true || matchMedia('(display-mode: standalone)').matches;

export function Home() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  useEffect(() => { listPlans().then(setPlans); listSessions().then(setSessions); getSettings().then(setSettings); }, []);

  const done = sessions.filter((s) => s.endedAt !== undefined);
  const active = sessions.find((s) => s.endedAt === undefined);
  const next = suggestPlan(plans, done);
  const last = done[0];
  const week = done.filter((s) => s.startedAt >= startOfWeek(Date.now()));
  const needsBackup = done.length > 0 &&
    (!settings.lastBackupAt || Date.now() - settings.lastBackupAt > BACKUP_EVERY_DAYS * DAY);
  const showInstall = !standalone() && !settings.installHintDismissed;

  const discard = async () => {
    if (active && (await confirmAsk('Scartare questo allenamento?', `${active.planName}: le serie fatte non verranno salvate.`, 'Scarta'))) {
      await deleteSession(active.id);
      setSessions(await listSessions());
    }
  };

  const heroUrl = `${import.meta.env.BASE_URL}hero.jpg`;

  return (
    <div class="hero home-hero" style={{ backgroundImage: `linear-gradient(180deg, rgba(8,10,14,.35) 0%, rgba(8,10,14,.9) 100%), url(${heroUrl})` }}>
      <div class="hero-top">
        <div class="muted-on-hero">{fmtDayLong(Date.now())}</div>
        <button class="btn icon hero-btn" aria-label="Impostazioni" onClick={() => go('impostazioni')}><IconSettings /></button>
      </div>

      <div class="hero-body">
        {showInstall && (
          <div class="hero-note">
            <span>Per usarla come app: tocca <b>Condividi</b> e poi <b>Aggiungi a Home</b>.</span>
            <button aria-label="Nascondi" onClick={() => { setSettings({ ...settings, installHintDismissed: true }); void saveSettings({ installHintDismissed: true }); }}>✕</button>
          </div>
        )}
        {needsBackup && (
          <a class="hero-note" href="#/impostazioni">Salva i tuoi progressi: fai un backup →</a>
        )}

        {active ? (
          <>
            <div class="muted-on-hero">Allenamento non terminato · iniziato {ago(active.beganAt)} · {sessionSetsDone(active)} serie fatte</div>
            <div class="hero-title">{active.planName}</div>
            <button class="btn primary big home-cta" onClick={() => go('allena/corsa')}>Riprendi</button>
            <button class="btn hero-btn" style={{ width: '100%', marginTop: 10 }} onClick={discard}>Scarta e ricomincia da capo</button>
          </>
        ) : (
          <>
            <div class="muted-on-hero">
              {last ? `Ultimo: ${last.planName}, ${ago(last.startedAt)}` : 'Benvenuto'}
              {next && last ? ` · oggi tocca a ${next.name}` : ''}
            </div>
            <div class="hero-title">Vuoi allenarti?</div>
            <button class="btn primary big home-cta" onClick={() => go('allena')}>Sì, andiamo</button>
          </>
        )}

        {done.length > 0 && (
          <a class="hero-stats" href="#/storico">
            <span><b>{week.length}</b> allenamenti questa settimana</span>
            <span><b>{fmtNum(week.reduce((a, s) => a + sessionVolume(s), 0))}</b> kg di volume</span>
          </a>
        )}
      </div>
    </div>
  );
}
