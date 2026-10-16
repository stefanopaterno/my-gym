import { useEffect, useMemo, useState } from 'preact/hooks';
import type { Exercise, Session } from '../db/schema';
import { deleteSession, getExercise, getSession, listExercises, listSessions, saveSession } from '../db/repo';
import { ExerciseImage } from '../components/ImageThumb';
import { LineChart } from '../components/Chart';
import { SetEditor } from '../components/SetEditor';
import { IconBack } from '../components/Icons';
import { BackButton } from '../components/BackButton';
import { confirmAsk } from '../components/Confirm';
import { fmtDay, fmtDayLong, fmtDuration, fmtKg, fmtNum, fmtTime, fromLocalInput, summarizeSets, toLocalInput } from '../lib/format';
import { exerciseHistory, personalRecords, sessionSetsDone, sessionVolume } from '../lib/stats';
import { back, go } from '../lib/router';

function Segmented({ on }: { on: 'sessioni' | 'progressi' }) {
  return (
    <div class="segmented">
      <a class={on === 'sessioni' ? 'on' : ''} href="#/storico">Sessioni</a>
      <a class={on === 'progressi' ? 'on' : ''} href="#/progressi">Progressi</a>
    </div>
  );
}

// ---------------------------------------------------------------- sessioni

export function HistoryList() {
  const [list, setList] = useState<Session[]>();
  useEffect(() => { listSessions().then((l) => setList(l.filter((s) => s.endedAt !== undefined))); }, []);
  return (
    <div class="page">
      <div class="page-head"><BackButton to="" /><h1>Storico</h1></div>
      <Segmented on="sessioni" />
      {list && list.length === 0 && <div class="empty">Nessun allenamento completato. Il primo comparirà qui.</div>}
      {list?.map((s) => (
        <a key={s.id} class="list-item" href={`#/storico/${s.id}`}>
          <div class="grow">
            <div class="title">{s.planName}</div>
            <div class="muted">{fmtDay(s.startedAt)} · {fmtTime(s.startedAt)} · {fmtDuration(s.durationSec)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div class="title">{fmtNum(sessionVolume(s))} kg</div>
            <div class="muted">{sessionSetsDone(s)} serie</div>
          </div>
        </a>
      ))}
    </div>
  );
}

export function SessionDetail({ id }: { id: string }) {
  const [s, setS] = useState<Session>();
  const [edit, setEdit] = useState<string>(); // "entry:set"
  useEffect(() => { getSession(id).then((x) => (x ? setS(x) : go('storico'))); }, [id]);
  if (!s) return null;

  const mutate = (fn: (d: Session) => void) => {
    const n = structuredClone(s);
    fn(n);
    setS(n);
    void saveSession(n);
  };
  const del = async () => {
    if (await confirmAsk('Eliminare questa sessione?', `${s.planName} · ${fmtDayLong(s.startedAt)}`)) {
      await deleteSession(s.id);
      back();
    }
  };

  return (
    <div class="page">
      <div class="page-head">
        <button class="btn icon" aria-label="Indietro" onClick={back}><IconBack /></button>
        <h1>{s.planName}</h1>
      </div>
      <div class="stats">
        <div class="stat"><b>{fmtNum(sessionVolume(s))}</b><span>volume (kg)</span></div>
        <div class="stat"><b>{fmtDuration(s.durationSec)}</b><span>durata</span></div>
        <div class="stat"><b>{sessionSetsDone(s)}</b><span>serie</span></div>
      </div>

      <label class="field"><span>Data e ora</span>
        <input class="input" type="datetime-local" value={toLocalInput(s.startedAt)}
          onChange={(e) => { const t = fromLocalInput(e.currentTarget.value); if (!Number.isNaN(t)) mutate((d) => { d.startedAt = t; }); }} /></label>

      {s.entries.map((e, ei) => (
        <div key={ei} class="card">
          <div class="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
            <a class="title" href={`#/progressi/${e.exerciseId}`} style={{ color: 'inherit' }}>{e.exerciseName}</a>
            <span class="muted">{e.skipped ? 'saltato' : summarizeSets(e.sets)}</span>
          </div>
          {!e.skipped && e.sets.map((set, si) => {
            const key = `${ei}:${si}`;
            return (
              <div key={si}>
                <div class={'set-row' + (set.done ? ' done' : '') + (edit === key ? ' sel' : '')} onClick={() => setEdit(edit === key ? undefined : key)}>
                  <div class="set-n">{si + 1}</div>
                  <div class="grow set-val">{set.reps} × {fmtKg(set.weight)} kg</div>
                  <button class={'check' + (set.done ? ' on' : '')} aria-label="Completata"
                    onClick={(ev) => { ev.stopPropagation(); mutate((d) => { d.entries[ei].sets[si].done = !set.done; }); }}>✓</button>
                </div>
                {edit === key && <SetEditor set={set} onChange={(v) => mutate((d) => { d.entries[ei].sets[si] = v; })} />}
              </div>
            );
          })}
        </div>
      ))}

      <label class="field"><span>Note</span>
        <textarea class="input" value={s.notes} onInput={(e) => mutate((d) => { d.notes = e.currentTarget.value; })} /></label>
      <button class="btn danger" style={{ width: '100%' }} onClick={del}>Elimina sessione</button>
    </div>
  );
}

// ---------------------------------------------------------------- progressi

export function ProgressList() {
  const [exs, setExs] = useState<Exercise[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  useEffect(() => { listExercises().then(setExs); listSessions().then(setSessions); }, []);

  const rows = useMemo(() => exs.map((e) => {
    const log = exerciseHistory(sessions, e.id);
    return { e, log, pr: personalRecords(log) };
  }).filter((r) => r.log.length).sort((a, b) => b.log.at(-1)!.date - a.log.at(-1)!.date), [exs, sessions]);

  return (
    <div class="page">
      <div class="page-head"><BackButton to="" /><h1>Storico</h1></div>
      <Segmented on="progressi" />
      {rows.length === 0 && <div class="empty">I progressi appariranno dopo il primo allenamento completato.</div>}
      {rows.map(({ e, log, pr }) => {
        const first = log[0].maxWeight, last = log.at(-1)!.maxWeight, d = last - first;
        return (
          <a key={e.id} class="list-item" href={`#/progressi/${e.id}`}>
            <ExerciseImage ex={e} />
            <div class="grow">
              <div class="title">{e.name}</div>
              <div class="muted">{log.length} sessioni · record {fmtKg(pr!.bestWeight.maxWeight)} kg</div>
            </div>
            {log.length > 1 && <div style={{ color: d >= 0 ? 'var(--accent)' : 'var(--danger)', fontWeight: 700 }}>{d >= 0 ? '+' : ''}{fmtKg(d)} kg</div>}
          </a>
        );
      })}
    </div>
  );
}

export function ProgressDetail({ id }: { id: string }) {
  const [ex, setEx] = useState<Exercise>();
  const [sessions, setSessions] = useState<Session[]>([]);
  useEffect(() => { getExercise(id).then(setEx); listSessions().then(setSessions); }, [id]);

  const log = useMemo(() => exerciseHistory(sessions, id), [sessions, id]);
  const pr = personalRecords(log);
  const name = ex?.name ?? sessions.flatMap((s) => s.entries).find((e) => e.exerciseId === id)?.exerciseName ?? 'Esercizio';

  return (
    <div class="page">
      <div class="page-head">
        <button class="btn icon" aria-label="Indietro" onClick={back}><IconBack /></button>
        <h1 style={{ fontSize: 22 }}>{name}</h1>
      </div>

      {!pr ? <div class="empty">Nessuna serie completata per questo esercizio.</div> : (
        <>
          <div class="stats">
            <div class="stat"><b>{fmtKg(pr.bestWeight.maxWeight)} kg</b><span>record peso ({pr.topSet.reps} rip)</span></div>
            <div class="stat"><b>{fmtNum(pr.bestVolume.volume)}</b><span>record volume (kg)</span></div>
            <div class="stat"><b>{log.length}</b><span>sessioni</span></div>
          </div>

          <div class="card">
            <div class="title" style={{ marginBottom: 6 }}>Peso massimo (kg)</div>
            <LineChart unit="kg" points={log.map((l) => ({ x: l.date, y: l.maxWeight }))} />
          </div>
          <div class="card">
            <div class="title" style={{ marginBottom: 6 }}>Volume (kg totali)</div>
            <LineChart unit="kg" color="#3a86ff" points={log.map((l) => ({ x: l.date, y: l.volume }))} />
          </div>

          <div class="title" style={{ margin: '16px 0 8px' }}>Cronologia</div>
          {[...log].reverse().map((l, i, arr) => {
            const prev = arr[i + 1];
            const d = prev ? l.maxWeight - prev.maxWeight : 0;
            return (
              <a key={l.sessionId} class="list-item" href={`#/storico/${l.sessionId}`}>
                <div class="grow">
                  <div class="title">{fmtDay(l.date)}</div>
                  <div class="muted">{summarizeSets(l.sets)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div class="title">{fmtNum(l.volume)} kg</div>
                  {prev && d !== 0 && <div style={{ color: d > 0 ? 'var(--accent)' : 'var(--danger)', fontSize: 14, fontWeight: 600 }}>{d > 0 ? '+' : ''}{fmtKg(d)} kg</div>}
                </div>
              </a>
            );
          })}
        </>
      )}
    </div>
  );
}
