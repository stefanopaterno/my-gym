import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { Exercise, LoggedSet, Plan, Session, SessionEntry, Settings } from '../db/schema';
import { DEFAULT_SETTINGS, MUSCLE_GROUPS, type MuscleGroup } from '../db/schema';
import { deleteSession, getActiveSession, getSession, getSettings, listExercises, listPlans, listSessions, saveSession } from '../db/repo';
import { ExerciseImage } from '../components/ImageThumb';
import { ExercisePicker } from '../components/ExercisePicker';
import { SetEditor } from '../components/SetEditor';
import { IconBack, IconPlus } from '../components/Icons';
import { BackButton } from '../components/BackButton';
import { confirmAsk } from '../components/Confirm';
import { fmtClock, fmtDuration, fmtKg, fmtNum, summarizeSets } from '../lib/format';
import { exerciseHistory, lastTime, sessionSetsDone, sessionVolume } from '../lib/stats';
import { beep, unlockAudio } from '../lib/beep';
import { keepAwake } from '../lib/wakelock';
import { uid } from '../lib/id';
import { go } from '../lib/router';

// ---------------------------------------------------------------- creazione

/** Gerarchia dei valori proposti: override di sessione > override di scheda > default esercizio. */
function entryFromExercise(ex: Exercise, o: { sets?: number; reps?: number; weight?: number; superset?: boolean } = {}): SessionEntry {
  const n = o.sets ?? ex.defaultSets;
  return {
    exerciseId: ex.id, exerciseName: ex.name, skipped: false, superset: o.superset,
    sets: Array.from({ length: n }, () => ({ reps: o.reps ?? ex.defaultReps, weight: o.weight ?? ex.defaultWeight, done: false })),
  };
}

function createSession(plan: Plan, exs: Map<string, Exercise>, startedAt: number): Session {
  const entries: SessionEntry[] = [];
  for (const it of plan.items) {
    const ex = exs.get(it.exerciseId);
    if (ex) entries.push(entryFromExercise(ex, it));
  }
  if (entries.length) entries[entries.length - 1].superset = false;
  return { id: uid(), startedAt, beganAt: Date.now(), durationSec: 0, planId: plan.id, planName: plan.name, notes: '', entries };
}

/** Raggruppa le voci: una superserie è una coppia (voce + successiva). */
function groupEntries(entries: SessionEntry[]): number[][] {
  const out: number[][] = [];
  for (let i = 0; i < entries.length; i++) {
    if (entries[i].superset && i + 1 < entries.length) out.push([i, ++i]);
    else out.push([i]);
  }
  return out;
}

const entryDone = (e: SessionEntry) => e.skipped || e.sets.every((s) => s.done);

// ---------------------------------------------------------------- scelta esercizi

/** "Cosa alleni oggi?": tocchi gli esercizi (quelli che fai più spesso in alto) e premi Inizia. */
export function StartWorkout() {
  const [exs, setExs] = useState<Exercise[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [active, setActive] = useState<Session>();
  const [picked, setPicked] = useState<string[]>([]); // ordine di tap = ordine di allenamento
  const [base, setBase] = useState<Plan>(); // scheda scelta come scorciatoia (porta con sé override e superserie)
  const [q, setQ] = useState('');
  const [group, setGroup] = useState<MuscleGroup | ''>('');

  const load = () => {
    listExercises().then(setExs);
    listPlans().then(setPlans);
    listSessions().then(setSessions);
    getActiveSession().then(setActive);
  };
  useEffect(load, []);

  const suggested = useMemo(() => suggestPlan(plans, sessions)?.id, [plans, sessions]);
  const byId = useMemo(() => new Map(exs.map((e) => [e.id, e])), [exs]);

  // Più usato prima; a parità, nell'ordine delle schede; poi alfabetico.
  const sorted = useMemo(() => {
    const used = new Map<string, number>();
    for (const s of sessions) {
      if (s.endedAt === undefined) continue;
      for (const e of s.entries) if (!e.skipped && e.sets.some((x) => x.done)) used.set(e.exerciseId, (used.get(e.exerciseId) ?? 0) + 1);
    }
    const rank = new Map<string, number>();
    plans.forEach((p, pi) => p.items.forEach((it, ii) => { if (!rank.has(it.exerciseId)) rank.set(it.exerciseId, pi * 100 + ii); }));
    return [...exs].sort((a, b) =>
      (used.get(b.id) ?? 0) - (used.get(a.id) ?? 0) ||
      (rank.get(a.id) ?? 9999) - (rank.get(b.id) ?? 9999) || a.name.localeCompare(b.name, 'it'));
  }, [exs, sessions, plans]);
  const shown = sorted.filter((e) => (!group || e.muscleGroup === group) && (e.name + e.equipment).toLowerCase().includes(q.trim().toLowerCase()));

  const choosePlan = (p: Plan) => {
    setBase(p);
    setPicked(p.items.map((i) => i.exerciseId).filter((id) => byId.has(id)));
  };
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const start = async () => {
    const items = picked.map((exerciseId, i) => {
      const bi = base?.items.findIndex((x) => x.exerciseId === exerciseId) ?? -1;
      if (!base || bi < 0) return { exerciseId };
      const it = base.items[bi];
      // La superserie resta solo se il compagno è ancora subito dopo.
      return { ...it, superset: it.superset && picked[i + 1] === base.items[bi + 1]?.exerciseId };
    });
    const groups = [...new Set(picked.map((id) => byId.get(id)?.muscleGroup).filter(Boolean))].slice(0, 3);
    const plan: Plan = { id: base?.id ?? 'libero', order: 0, name: base?.name ?? (groups.join(' · ') || 'Allenamento'), items };
    await saveSession(createSession(plan, byId, Date.now()));
    go('allena/corsa');
  };
  const discard = async () => {
    if (active && (await confirmAsk('Scartare l\'allenamento in corso?', 'I dati non completati andranno persi.', 'Scarta'))) {
      await deleteSession(active.id);
      load();
    }
  };

  return (
    <div class="page" style={{ paddingBottom: 110 }}>
      <div class="page-head"><BackButton to="" /><h1>Cosa alleni oggi?</h1></div>

      {active && (
        <div class="card" style={{ borderLeft: '4px solid var(--accent)' }}>
          <div class="title">In corso: {active.planName}</div>
          <div class="muted" style={{ marginBottom: 10 }}>{sessionSetsDone(active)} serie completate</div>
          <div class="row">
            <button class="btn primary grow" onClick={() => go('allena/corsa')}>Riprendi</button>
            <button class="btn danger" onClick={discard}>Scarta</button>
          </div>
        </div>
      )}

      {plans.length > 0 && (
        <>
          <div class="muted" style={{ marginBottom: 6 }}>Scorciatoia: tutti gli esercizi di una scheda</div>
          <div class="chips">
            {plans.map((p) => (
              <button key={p.id} class={'chip' + (base?.id === p.id ? ' on' : '')} onClick={() => choosePlan(p)}>
                {p.id === suggested ? '★ ' : ''}{p.name}
              </button>
            ))}
          </div>
        </>
      )}

      <div class="muted" style={{ margin: '6px 0 6px' }}>Oppure tocca gli esercizi nell'ordine in cui li farai</div>
      <input class="input" type="search" placeholder="Cerca esercizio…" value={q} onInput={(e) => setQ(e.currentTarget.value)} style={{ marginBottom: 10 }} />
      <div class="chips">
        <button class={'chip' + (group === '' ? ' on' : '')} onClick={() => setGroup('')}>Tutti</button>
        {MUSCLE_GROUPS.map((g) => <button key={g} class={'chip' + (group === g ? ' on' : '')} onClick={() => setGroup(g)}>{g}</button>)}
      </div>

      {exs.length === 0 && <div class="empty">Nessun esercizio. Aggiungine dalla scheda “Esercizi”.</div>}
      {shown.map((e) => {
        const n = picked.indexOf(e.id) + 1;
        return (
          <div key={e.id} class="list-item" style={n ? { outline: '2px solid var(--accent)' } : undefined} onClick={() => toggle(e.id)}>
            <ExerciseImage ex={e} />
            <div class="grow">
              <div class="title">{e.name}</div>
              <div class="muted">{e.muscleGroup} · {e.defaultSets}×{e.defaultReps} · {fmtKg(e.defaultWeight)} kg</div>
            </div>
            <div class={'pick-n' + (n ? ' on' : '')}>{n || ''}</div>
          </div>
        );
      })}

      <div class="quick-bar">
        <button class="btn primary" style={{ minHeight: 60, fontSize: 20 }} disabled={!picked.length} onClick={start}>
          {picked.length ? `Inizia (${picked.length} esercizi)` : 'Scegli almeno un esercizio'}
        </button>
      </div>
    </div>
  );
}

/** Prossima scheda in rotazione: quella successiva all'ultima svolta (per `order`). */
export function suggestPlan(plans: Plan[], sessions: Session[]): Plan | undefined {
  if (!plans.length) return undefined;
  const last = sessions.find((s) => s.endedAt !== undefined && plans.some((p) => p.id === s.planId));
  const i = last ? plans.findIndex((p) => p.id === last.planId) : -1;
  return plans[(i + 1) % plans.length];
}

// ---------------------------------------------------------------- allenamento

export function RunWorkout() {
  const [s, setS] = useState<Session>();
  const [exs, setExs] = useState<Map<string, Exercise>>(new Map());
  const [history, setHistory] = useState<Session[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [cur, setCur] = useState(0);
  const [sel, setSel] = useState<Record<number, number>>({});
  const [now, setNow] = useState(Date.now());
  const [restEnd, setRestEnd] = useState<number>();
  const [picking, setPicking] = useState(false);
  const inited = useRef(false);

  useEffect(() => {
    getActiveSession().then((a) => (a ? setS(a) : go('allena')));
    listExercises().then((l) => setExs(new Map(l.map((e) => [e.id, e]))));
    listSessions().then(setHistory);
    getSettings().then(setSettings);
    keepAwake(true);
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => { clearInterval(t); keepAwake(false); };
  }, []);

  const groups = s ? groupEntries(s.entries) : [];

  // All'apertura salta al primo gruppo non completato.
  useEffect(() => {
    if (!s || inited.current) return;
    inited.current = true;
    const g = groups.findIndex((idx) => !idx.every((i) => entryDone(s.entries[i])));
    setCur(g === -1 ? Math.max(0, groups.length - 1) : g);
  }, [s]);

  // Fine recupero: segnale sonoro.
  useEffect(() => {
    if (restEnd !== undefined && now >= restEnd) { setRestEnd(undefined); beep(); }
  }, [now, restEnd]);

  if (!s) return null;

  /** Applica una modifica e salva subito (la sessione sopravvive a una chiusura dell'app). */
  const mutate = (fn: (draft: Session) => void) => {
    const next = structuredClone(s);
    fn(next);
    setS(next);
    void saveSession(next);
  };

  const group = groups[cur] ?? [];
  const selectedFor = (ei: number) => {
    const e = s.entries[ei];
    const first = e.sets.findIndex((x) => !x.done);
    return sel[ei] ?? first;
  };

  const toggleDone = (ei: number, si: number) => {
    unlockAudio();
    const becomesDone = !s.entries[ei].sets[si].done;
    mutate((d) => { d.entries[ei].sets[si].done = becomesDone; });
    setSel((m) => { const n = { ...m }; delete n[ei]; return n; });
    if (becomesDone && settings.restEnabled) {
      // In superserie il recupero parte quando il giro (stessa serie di entrambi gli esercizi) è completo.
      const roundDone = group.every((i) => i === ei || s.entries[i].skipped || s.entries[i].sets[si]?.done !== false);
      if (roundDone) setRestEnd(Date.now() + settings.restSeconds * 1000);
    }
    if (!becomesDone) setRestEnd(undefined);
  };
  // Cambiare ripetizioni/kg di una serie aggiorna anche le serie successive ancora da fare
  // (solo quelle che avevano ancora il valore proposto), così non devi ripeterlo ogni volta.
  const changeSet = (ei: number, si: number, v: LoggedSet) => mutate((d) => {
    const sets = d.entries[ei].sets;
    const old = sets[si];
    sets[si] = v;
    for (let k = si + 1; k < sets.length; k++) {
      if (sets[k].done) continue;
      if (v.reps !== old.reps && sets[k].reps === old.reps) sets[k].reps = v.reps;
      if (v.weight !== old.weight && sets[k].weight === old.weight) sets[k].weight = v.weight;
    }
  });
  const addSet = (ei: number) => mutate((d) => {
    const sets = d.entries[ei].sets;
    const last = sets.at(-1);
    sets.push({ reps: last?.reps ?? 10, weight: last?.weight ?? 0, done: false });
  });
  const removeSet = (ei: number) => mutate((d) => { if (d.entries[ei].sets.length > 1) d.entries[ei].sets.pop(); });
  const toggleSkip = (ei: number) => mutate((d) => { d.entries[ei].skipped = !d.entries[ei].skipped; });
  const addExercise = (ex: Exercise) => {
    mutate((d) => {
      const last = d.entries.at(-1);
      if (last) last.superset = false;
      d.entries.push(entryFromExercise(ex));
    });
    setCur(groups.length);
    setPicking(false);
  };

  const finish = async () => {
    const pending = s.entries.reduce((a, e) => a + (e.skipped ? 0 : e.sets.filter((x) => !x.done).length), 0);
    const msg = pending ? `${pending} serie non completate non verranno conteggiate.` : undefined;
    if (!(await confirmAsk('Terminare l\'allenamento?', msg, 'Termina', false))) return;
    const end = Date.now();
    const done: Session = { ...structuredClone(s), endedAt: end, durationSec: Math.round((end - s.beganAt) / 1000) };
    await saveSession(done);
    go(`allena/fine/${s.id}`);
  };
  const leave = () => go('');

  const restLeft = restEnd !== undefined ? Math.max(0, Math.ceil((restEnd - now) / 1000)) : undefined;
  const elapsed = Math.floor((now - s.beganAt) / 1000);
  const groupDone = group.length > 0 && group.every((i) => entryDone(s.entries[i]));
  const isSuperset = group.length > 1;

  return (
    <div class="page" style={{ paddingBottom: restLeft !== undefined ? 150 : 24 }}>
      <div class="row" style={{ marginBottom: 10 }}>
        <button class="btn icon" aria-label="Esci (l'allenamento resta salvato)" onClick={leave}><IconBack /></button>
        <div class="grow">
          <div class="title">{s.planName}</div>
          <div class="muted">{fmtClock(elapsed)} · {sessionSetsDone(s)} serie fatte</div>
        </div>
        <button class="btn primary" onClick={finish}>Termina</button>
      </div>

      <div class="dots">
        {groups.map((g, gi) => (
          <button key={gi} aria-label={`Esercizio ${gi + 1}`} onClick={() => setCur(gi)}
            class={'dot' + (gi === cur ? ' cur' : '') + (g.every((i) => entryDone(s.entries[i])) ? ' done' : '')} />
        ))}
      </div>

      {isSuperset && <div class="superset-tag" style={{ marginBottom: 8 }}>Superserie</div>}

      {group.map((ei) => {
        const e = s.entries[ei];
        const ex = exs.get(e.exerciseId);
        const prev = lastTime(history, e.exerciseId, s.id);
        const selSet = selectedFor(ei);
        return (
          <div key={ei} class="card" style={e.skipped ? { opacity: 0.55 } : undefined}>
            {ex && <div style={{ marginBottom: 10 }}>
              {isSuperset ? <div class="row"><ExerciseImage ex={ex} size={64} /><ExTitle e={e} ex={ex} prev={prev} /></div>
                : <><ExerciseImage ex={ex} large /><div style={{ marginTop: 10 }}><ExTitle e={e} ex={ex} prev={prev} /></div></>}
            </div>}
            {!ex && <ExTitle e={e} prev={prev} />}

            {e.skipped ? (
              <button class="btn" style={{ width: '100%' }} onClick={() => toggleSkip(ei)}>Saltato · Ripristina</button>
            ) : (
              <>
                {e.sets.map((set, si) => (
                  <div key={si}>
                    <div class={'set-row' + (set.done ? ' done' : '') + (si === selSet ? ' sel' : '')}
                      onClick={() => setSel((m) => ({ ...m, [ei]: si }))}>
                      <div class="set-n">{si + 1}</div>
                      <div class="grow set-val">{set.reps} × {fmtKg(set.weight)} kg</div>
                      <button class={'check' + (set.done ? ' on' : '')} aria-label={set.done ? 'Annulla serie' : 'Conferma serie'}
                        onClick={(ev) => { ev.stopPropagation(); toggleDone(ei, si); }}>✓</button>
                    </div>
                    {si === selSet && <SetEditor set={set} onChange={(v) => changeSet(ei, si, v)} />}
                  </div>
                ))}
                <div class="row" style={{ marginTop: 10 }}>
                  <button class="btn grow" onClick={() => addSet(ei)}>＋ Serie</button>
                  <button class="btn grow" disabled={e.sets.length <= 1} onClick={() => removeSet(ei)}>− Serie</button>
                  <button class="btn grow" onClick={() => toggleSkip(ei)}>Salta</button>
                </div>
              </>
            )}
          </div>
        );
      })}

      <div class="row" style={{ marginBottom: 12 }}>
        <button class="btn grow" onClick={() => setPicking(true)}><IconPlus /> Aggiungi esercizio</button>
      </div>

      <div class="row">
        <button class="btn grow" disabled={cur === 0} onClick={() => setCur(cur - 1)}>← Precedente</button>
        {cur < groups.length - 1
          ? <button class={'btn grow' + (groupDone ? ' primary' : '')} onClick={() => setCur(cur + 1)}>Successivo →</button>
          : <button class="btn primary grow" onClick={finish}>Termina</button>}
      </div>

      {restLeft !== undefined && (
        <div class="rest">
          <div class="muted">Recupero</div>
          <div class="rest-time">{fmtClock(restLeft)}</div>
          <div class="rest-bar"><div style={{ width: `${(restLeft / settings.restSeconds) * 100}%` }} /></div>
          <div class="row" style={{ marginTop: 10 }}>
            <button class="btn grow" onClick={() => setRestEnd((restEnd ?? Date.now()) - 15000)}>−15 s</button>
            <button class="btn grow" onClick={() => setRestEnd((restEnd ?? Date.now()) + 15000)}>+15 s</button>
            <button class="btn primary grow" onClick={() => setRestEnd(undefined)}>Salta</button>
          </div>
        </div>
      )}

      {picking && <ExercisePicker onClose={() => setPicking(false)} onPick={addExercise} />}
    </div>
  );
}

function ExTitle({ e, ex, prev }: { e: SessionEntry; ex?: Exercise; prev?: ReturnType<typeof lastTime> }) {
  return (
    <div class="grow">
      <div class="title" style={{ fontSize: 20 }}>{e.exerciseName}</div>
      {ex?.equipment && <div class="muted">{ex.equipment}</div>}
      <div class="muted" style={{ marginTop: 2 }}>Ultima volta: <b>{prev ? summarizeSets(prev.sets) : 'mai fatto'}</b></div>
    </div>
  );
}

// ---------------------------------------------------------------- riepilogo

export function WorkoutSummary({ id }: { id: string }) {
  const [s, setS] = useState<Session>();
  const [all, setAll] = useState<Session[]>([]);
  useEffect(() => { getSession(id).then(setS); listSessions().then(setAll); }, [id]);
  if (!s) return null;

  const records = s.entries.flatMap((e) => {
    const log = exerciseHistory(all, e.exerciseId);
    const mine = log.find((l) => l.sessionId === s.id);
    const before = log.filter((l) => l.date < (mine?.date ?? 0));
    if (!mine || !before.length) return [];
    const prevMax = Math.max(...before.map((l) => l.maxWeight));
    return mine.maxWeight > prevMax ? [{ name: e.exerciseName, kg: mine.maxWeight, delta: mine.maxWeight - prevMax }] : [];
  });

  return (
    <div class="page">
      <div class="page-head"><BackButton to="" /><h1>Ottimo lavoro! 💪</h1></div>
      <div class="muted" style={{ marginBottom: 12 }}>{s.planName}</div>
      <div class="stats">
        <div class="stat"><b>{fmtNum(sessionVolume(s))}</b><span>volume (rip × kg)</span></div>
        <div class="stat"><b>{fmtDuration(s.durationSec)}</b><span>durata</span></div>
        <div class="stat"><b>{sessionSetsDone(s)}</b><span>serie completate</span></div>
      </div>

      <div class="muted" style={{ margin: '-6px 4px 14px', fontSize: 13 }}>
        Il volume è la somma di ripetizioni × kg di tutte le serie completate (es. 3×10 con 7,5 kg = 225 kg).
      </div>

      {records.length > 0 && (
        <div class="card">
          <div class="title" style={{ marginBottom: 6 }}>🏆 Nuovi record di peso</div>
          {records.map((r) => <div key={r.name} class="row" style={{ justifyContent: 'space-between' }}>
            <span>{r.name}</span><b>{fmtKg(r.kg)} kg <span style={{ color: 'var(--accent)' }}>(+{fmtKg(r.delta)})</span></b></div>)}
        </div>
      )}

      <div class="card">
        {s.entries.map((e, i) => (
          <div key={i} class="row" style={{ justifyContent: 'space-between', padding: '6px 0' }}>
            <span>{e.exerciseName}</span>
            <span class="muted">{e.skipped ? 'saltato' : summarizeSets(e.sets)}</span>
          </div>
        ))}
      </div>
      <button class="btn primary big" style={{ minHeight: 60 }} onClick={() => go('')}>Fatto</button>
    </div>
  );
}
