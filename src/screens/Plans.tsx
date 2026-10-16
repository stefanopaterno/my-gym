import { useEffect, useState } from 'preact/hooks';
import type { Exercise, Plan, PlanItem } from '../db/schema';
import { deletePlan, listExercises, listPlans, getPlan, savePlan } from '../db/repo';
import { ExerciseImage } from '../components/ImageThumb';
import { ExercisePicker } from '../components/ExercisePicker';
import { IconBack, IconPlus } from '../components/Icons';
import { BackButton } from '../components/BackButton';
import { Stepper } from '../components/Stepper';
import { confirmAsk } from '../components/Confirm';
import { fmtKg } from '../lib/format';
import { uid } from '../lib/id';
import { back, go } from '../lib/router';

export function PlanList() {
  const [plans, setPlans] = useState<Plan[]>();
  const [exs, setExs] = useState<Map<string, Exercise>>(new Map());
  const load = () => { listPlans().then(setPlans); listExercises().then((l) => setExs(new Map(l.map((e) => [e.id, e])))); };
  useEffect(load, []);

  const duplicate = async (p: Plan) => {
    await savePlan({ ...p, id: uid(), name: `${p.name} (copia)`, order: (plans?.length ?? 0) + 1, items: p.items.map((i) => ({ ...i })) });
    load();
  };

  return (
    <div class="page">
      <div class="page-head">
        <BackButton to="" />
        <h1>Schede</h1>
        <button class="btn primary icon" aria-label="Nuova scheda" onClick={() => go('schede/nuova')}><IconPlus /></button>
      </div>
      {plans && plans.length === 0 && <div class="empty">Nessuna scheda. Creane una con + o carica i dati iniziali da Impostazioni.</div>}
      {plans?.map((p) => {
        const items = p.items.map((i) => exs.get(i.exerciseId)).filter(Boolean) as Exercise[];
        return (
          <div key={p.id} class="card">
            <a class="row" href={`#/schede/${p.id}`} style={{ textDecoration: 'none', color: 'inherit', marginBottom: 10 }}>
              <div class="grow">
                <div class="title" style={{ fontSize: 20 }}>{p.name}</div>
                <div class="muted">{p.items.length} esercizi</div>
              </div>
              <div class="row" style={{ gap: 4 }}>{items.slice(0, 3).map((e) => <ExerciseImage key={e.id} ex={e} size={40} />)}</div>
            </a>
            <div class="muted" style={{ marginBottom: 10 }}>{items.map((e) => e.name).join(' · ')}</div>
            <div class="row">
              <a class="btn grow" href={`#/schede/${p.id}`}>Modifica</a>
              <button class="btn grow" onClick={() => duplicate(p)}>Duplica</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function PlanEdit({ id }: { id: string }) {
  const isNew = id === 'nuova';
  const [plan, setPlan] = useState<Plan>();
  const [exs, setExs] = useState<Map<string, Exercise>>(new Map());
  const [open, setOpen] = useState<number>();
  const [picking, setPicking] = useState(false);

  useEffect(() => {
    listExercises().then((l) => setExs(new Map(l.map((e) => [e.id, e]))));
    if (isNew) listPlans().then((l) => setPlan({ id: uid(), name: '', order: l.length + 1, items: [] }));
    else getPlan(id).then((p) => (p ? setPlan(p) : go('schede')));
  }, [id]);
  if (!plan) return null;

  const setItems = (items: PlanItem[]) => setPlan({ ...plan, items });
  const patchItem = (i: number, p: Partial<PlanItem>) => setItems(plan.items.map((it, k) => (k === i ? { ...it, ...p } : it)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= plan.items.length) return;
    const items = plan.items.map((it) => ({ ...it }));
    [items[i], items[j]] = [items[j], items[i]];
    const lo = Math.min(i, j);
    for (const k of [lo - 1, lo, lo + 1]) if (items[k]) items[k].superset = false; // spostare rompe le coppie coinvolte
    setItems(items);
    setOpen(j);
  };
  const remove = (i: number) => {
    const items = plan.items.filter((_, k) => k !== i).map((it) => ({ ...it }));
    if (items[i - 1]) items[i - 1].superset = false;
    setItems(items);
    setOpen(undefined);
  };
  const save = async () => {
    if (!plan.name.trim()) return;
    await savePlan({ ...plan, name: plan.name.trim() });
    back();
  };
  const del = async () => {
    if (await confirmAsk(`Eliminare la scheda "${plan.name}"?`, 'Le sessioni già svolte restano nello storico.')) {
      await deletePlan(plan.id);
      back();
    }
  };

  return (
    <div class="page">
      <div class="page-head">
        <button class="btn icon" aria-label="Indietro" onClick={back}><IconBack /></button>
        <h1>{isNew ? 'Nuova scheda' : 'Scheda'}</h1>
      </div>
      <label class="field"><span>Nome</span>
        <input class="input" value={plan.name} placeholder="Es. Petto" onInput={(e) => setPlan({ ...plan, name: e.currentTarget.value })} /></label>

      <div class="muted" style={{ margin: '4px 0 8px' }}>Esercizi in ordine. Tocca un esercizio per cambiare serie, ripetizioni e kg solo in questa scheda.</div>

      {plan.items.map((it, i) => {
        const ex = exs.get(it.exerciseId);
        if (!ex) return null;
        const sets = it.sets ?? ex.defaultSets, reps = it.reps ?? ex.defaultReps, weight = it.weight ?? ex.defaultWeight;
        const overridden = it.sets !== undefined || it.reps !== undefined || it.weight !== undefined;
        const isOpen = open === i;
        return (
          <div key={i}>
            <div class="card" style={{ marginBottom: it.superset ? 4 : 8, borderLeft: it.superset || plan.items[i - 1]?.superset ? '4px solid var(--accent)' : undefined }}>
              <div class="row" onClick={() => setOpen(isOpen ? undefined : i)}>
                <div class="muted" style={{ width: 18 }}>{i + 1}</div>
                <ExerciseImage ex={ex} size={44} />
                <div class="grow">
                  <div class="title">{ex.name}</div>
                  <div class="muted">{sets}×{reps} · {fmtKg(weight)} kg{overridden && ' · personalizzato'}</div>
                </div>
              </div>
              {isOpen && (
                <div style={{ marginTop: 12 }}>
                  <div class="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                    <span>Serie</span><Stepper value={sets} min={1} onChange={(v) => patchItem(i, { sets: v })} /></div>
                  <div class="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                    <span>Ripetizioni</span><Stepper value={reps} min={1} onChange={(v) => patchItem(i, { reps: v })} /></div>
                  <div class="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
                    <span>Peso</span><Stepper value={weight} step={0.5} unit="kg" onChange={(v) => patchItem(i, { weight: v })} /></div>
                  <div class="row">
                    <button class="btn icon" aria-label="Su" disabled={i === 0} onClick={() => move(i, -1)}>▲</button>
                    <button class="btn icon" aria-label="Giù" disabled={i === plan.items.length - 1} onClick={() => move(i, 1)}>▼</button>
                    {overridden && <button class="btn grow" onClick={() => patchItem(i, { sets: undefined, reps: undefined, weight: undefined })}>Ripristina</button>}
                    <button class="btn danger grow" onClick={() => remove(i)}>Rimuovi</button>
                  </div>
                </div>
              )}
            </div>
            {i < plan.items.length - 1 && (
              <button class={'link-btn' + (it.superset ? ' on' : '')} onClick={() => patchItem(i, { superset: !it.superset })}>
                {it.superset ? '🔗 Superserie con il successivo (tocca per sciogliere)' : '＋ Accoppia in superserie con il successivo'}
              </button>
            )}
          </div>
        );
      })}

      <button class="btn" style={{ width: '100%', marginBottom: 16 }} onClick={() => setPicking(true)}><IconPlus /> Aggiungi esercizio</button>
      <button class="btn primary big" style={{ minHeight: 56, fontSize: 18 }} disabled={!plan.name.trim()} onClick={save}>Salva scheda</button>
      {!isNew && <button class="btn danger" style={{ width: '100%', marginTop: 10 }} onClick={del}>Elimina scheda</button>}

      {picking && (
        <ExercisePicker onClose={() => setPicking(false)} onPick={(e) => {
          setItems([...plan.items, { exerciseId: e.id }]);
          setOpen(plan.items.length);
          setPicking(false);
        }} />
      )}
    </div>
  );
}
