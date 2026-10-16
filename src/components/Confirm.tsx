import { useEffect, useState } from 'preact/hooks';

interface Ask { title: string; message?: string; okLabel: string; danger: boolean; resolve: (v: boolean) => void }
let show: ((a: Ask) => void) | undefined;

/** Dialogo di conferma: `if (await confirmAsk('Eliminare?')) ...` */
export function confirmAsk(title: string, message?: string, okLabel = 'Elimina', danger = true): Promise<boolean> {
  return new Promise((resolve) => show?.({ title, message, okLabel, danger, resolve }));
}

/** Da montare una sola volta nell'app. */
export function ConfirmHost() {
  const [ask, setAsk] = useState<Ask>();
  useEffect(() => { show = setAsk; return () => { show = undefined; }; }, []);
  if (!ask) return null;
  const done = (v: boolean) => { ask.resolve(v); setAsk(undefined); };
  return (
    <div class="modal-bg" onClick={() => done(false)}>
      <div class="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{ask.title}</h2>
        {ask.message && <div class="muted">{ask.message}</div>}
        <div class="actions">
          <button class="btn" onClick={() => done(false)}>Annulla</button>
          <button class="btn primary" style={ask.danger ? { background: 'var(--danger)', color: '#fff' } : undefined} onClick={() => done(true)}>{ask.okLabel}</button>
        </div>
      </div>
    </div>
  );
}
