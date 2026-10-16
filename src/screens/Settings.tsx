import { useEffect, useRef, useState } from 'preact/hooks';
import { getSettings, saveSettings } from '../db/repo';
import type { Settings as S } from '../db/schema';
import { Stepper } from '../components/Stepper';
import { IconBack } from '../components/Icons';
import { confirmAsk } from '../components/Confirm';
import { loadSeed } from '../lib/seed';
import { fixedHeight } from '../lib/viewport';
import { exportBackup, importBackup, parseBackup } from '../lib/backup';
import { back } from '../lib/router';

export function Settings() {
  const [s, setS] = useState<S>();
  const [msg, setMsg] = useState('');
  const [backupMsg, setBackupMsg] = useState('');
  const [pending, setPending] = useState<Awaited<ReturnType<typeof parseBackup>>>();
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => { getSettings().then(setS); }, []);
  if (!s) return null;

  const update = (p: Partial<S>) => { setS({ ...s, ...p }); void saveSettings(p); };
  const doExport = async () => {
    try {
      const r = await exportBackup();
      setS(await getSettings());
      setBackupMsg(r === 'shared' ? 'Backup condiviso.' : 'Backup scaricato.');
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setBackupMsg('Backup non riuscito: ' + (e as Error).message);
    }
  };
  const onFile = async (e: Event) => {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try { setPending(await parseBackup(file)); } catch (err) { setBackupMsg((err as Error).message); }
  };
  const runImport = async (mode: 'merge' | 'replace') => {
    if (!pending) return;
    if (mode === 'replace' && !(await confirmAsk('Sostituire tutto?', 'I dati attuali su questo telefono verranno cancellati.', 'Sostituisci'))) return;
    await importBackup(pending, mode);
    setPending(undefined);
    setS(await getSettings());
    setBackupMsg('Backup importato.');
  };
  const seed = async () => {
    if (!(await confirmAsk('Caricare i dati iniziali?', 'Aggiunge gli esercizi e le schede mancanti, senza toccare quelli esistenti.', 'Carica'))) return;
    const n = await loadSeed();
    setS(await getSettings());
    setMsg(n ? `Aggiunti ${n} elementi.` : 'Era già tutto presente.');
  };

  return (
    <div class="page">
      <div class="page-head">
        <button class="btn icon" aria-label="Indietro" onClick={back}><IconBack /></button>
        <h1>Impostazioni</h1>
      </div>

      <div class="card">
        <div class="title" style={{ marginBottom: 8 }}>Timer di recupero</div>
        <label class="row" style={{ justifyContent: 'space-between', marginBottom: 10, minHeight: 48 }}>
          <span>Attivo dopo ogni serie</span>
          <input type="checkbox" checked={s.restEnabled} style={{ width: 28, height: 28 }}
            onChange={(e) => update({ restEnabled: e.currentTarget.checked })} />
        </label>
        <div class="row" style={{ justifyContent: 'space-between' }}>
          <span>Durata</span>
          <Stepper value={s.restSeconds} step={15} min={15} max={600} unit="s" onChange={(v) => update({ restSeconds: v })} />
        </div>
      </div>

      <div class="card">
        <div class="title" style={{ marginBottom: 8 }}>Obiettivo settimanale</div>
        <div class="row" style={{ justifyContent: 'space-between' }}>
          <span>Allenamenti a settimana</span>
          <Stepper value={s.weeklyGoal} min={1} max={7} onChange={(v) => update({ weeklyGoal: v })} />
        </div>
      </div>

      <div class="card">
        <div class="title" style={{ marginBottom: 8 }}>Dati iniziali</div>
        <div class="muted" style={{ marginBottom: 10 }}>Esercizi, foto e schede definiti in src/seed.ts. Aggiunge solo ciò che manca.</div>
        <button class="btn" style={{ width: '100%' }} onClick={seed}>Carica dati iniziali</button>
        {msg && <div class="muted" style={{ marginTop: 8 }}>{msg}</div>}
      </div>

      <div class="card">
        <div class="title" style={{ marginBottom: 4 }}>Backup dei progressi</div>
        <div class="muted" style={{ marginBottom: 10 }}>
          I dati sono solo su questo telefono. Salva ogni tanto il file (anche su iCloud o in Messaggi a te stesso).
          {s.lastBackupAt ? ` Ultimo backup: ${new Date(s.lastBackupAt).toLocaleDateString('it-IT')}.` : ' Non hai ancora fatto nessun backup.'}
        </div>
        <button class="btn primary" style={{ width: '100%', marginBottom: 8 }} onClick={doExport}>Esporta backup</button>
        <button class="btn" style={{ width: '100%' }} onClick={() => fileRef.current?.click()}>Importa backup…</button>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onFile} />
        {backupMsg && <div class="muted" style={{ marginTop: 8 }}>{backupMsg}</div>}
      </div>

      {pending && (
        <div class="modal-bg" onClick={() => setPending(undefined)}>
          <div class="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Importare il backup?</h2>
            <div class="muted">
              Contiene {pending.exercises.length} esercizi, {pending.plans.length} schede e {pending.sessions.length} sessioni
              (del {new Date(pending.exportedAt).toLocaleDateString('it-IT')}).
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
              <button class="btn primary" onClick={() => runImport('merge')}>Unisci ai dati attuali</button>
              <button class="btn danger" onClick={() => runImport('replace')}>Sostituisci tutto</button>
              <button class="btn" onClick={() => setPending(undefined)}>Annulla</button>
            </div>
          </div>
        </div>
      )}
      <div class="muted" style={{ textAlign: 'center', fontSize: 12, margin: '8px 0' }}>
        Schermo {innerWidth}×{innerHeight} · area fissa {fixedHeight()} · fisico {screen.width}×{screen.height}
      </div>
    </div>
  );
}
