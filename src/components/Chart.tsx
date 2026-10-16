import { fmtKg, fmtShort } from '../lib/format';

interface Point { x: number; y: number }

/** Grafico a linea in SVG, senza dipendenze. x = timestamp, y = valore. */
export function LineChart({ points, unit, color = 'var(--accent)' }: { points: Point[]; unit: string; color?: string }) {
  const W = 340, H = 150, L = 8, R = 8, T = 16, B = 24;
  if (!points.length) return null;
  const ys = points.map((p) => p.y);
  let lo = Math.min(...ys), hi = Math.max(...ys);
  if (lo === hi) { lo -= 1; hi += 1; }
  const pad = (hi - lo) * 0.15;
  lo = Math.max(0, lo - pad); hi += pad;
  const xs = points.map((p) => p.x);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const px = (x: number) => (x1 === x0 ? W / 2 : L + ((x - x0) / (x1 - x0)) * (W - L - R));
  const py = (y: number) => T + (1 - (y - lo) / (hi - lo)) * (H - T - B);
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${px(p.x).toFixed(1)},${py(p.y).toFixed(1)}`).join(' ');
  const maxIdx = ys.indexOf(Math.max(...ys));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }} role="img">
      {[0, 0.5, 1].map((f) => (
        <line key={f} x1={L} x2={W - R} y1={T + f * (H - T - B)} y2={T + f * (H - T - B)} stroke="var(--line)" stroke-width="1" />
      ))}
      <path d={path} fill="none" stroke={color} stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
      {points.map((p, i) => <circle key={i} cx={px(p.x)} cy={py(p.y)} r={i === maxIdx ? 5 : 3.5} fill={color} />)}
      <text x={Math.min(Math.max(px(points[maxIdx].x), 24), W - 40)} y={py(points[maxIdx].y) - 9} text-anchor="middle"
        font-size="11" font-weight="700" fill="var(--text)">{fmtKg(points[maxIdx].y)} {unit}</text>
      <text x={L} y={H - 6} font-size="10" fill="var(--muted)">{fmtShort(x0)}</text>
      {x1 !== x0 && <text x={W - R} y={H - 6} font-size="10" fill="var(--muted)" text-anchor="end">{fmtShort(x1)}</text>}
    </svg>
  );
}
