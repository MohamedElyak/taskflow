import { STATUSES } from '../../utils/constants';

const weekday = new Intl.DateTimeFormat(undefined, { weekday: 'short' });

/** Tasks completed per day (last 7 days) plus a status distribution bar. Plain SVG/CSS, no chart library. */
export default function CompletionChart({ days, byStatus }) {
  const max = Math.max(1, ...days.map((d) => d.completed));
  const total = byStatus.reduce((sum, s) => sum + s.count, 0);
  const W = 280, H = 110, gap = 10;
  const barW = (W - gap * (days.length - 1)) / days.length;
  const doneThisWeek = days.reduce((sum, d) => sum + d.completed, 0);

  return (
    <div>
      <p className="text-sm text-muted">
        <span className="font-semibold text-ink">{doneThisWeek}</span> completed in the last 7 days
      </p>

      <svg viewBox={`0 0 ${W} ${H + 22}`} className="mt-3 w-full" role="img" aria-label={`Tasks completed per day: ${days.map((d) => `${weekday.format(new Date(d.date + 'T00:00'))} ${d.completed}`).join(', ')}`}>
        <line x1="0" x2={W} y1={H} y2={H} stroke="var(--line)" />
        {days.map((d, i) => {
          const h = d.completed ? Math.max(4, (d.completed / max) * (H - 16)) : 2;
          const x = i * (barW + gap);
          return (
            <g key={d.date}>
              <rect x={x} y={H - h} width={barW} height={h} rx="3" fill={d.completed ? 'var(--accent)' : 'var(--line)'} />
              {d.completed > 0 && <text x={x + barW / 2} y={H - h - 4} textAnchor="middle" fontSize="10" fill="var(--ink)">{d.completed}</text>}
              <text x={x + barW / 2} y={H + 15} textAnchor="middle" fontSize="10" fill="var(--muted)">{weekday.format(new Date(d.date + 'T00:00'))}</text>
            </g>
          );
        })}
      </svg>

      <div className="mt-5">
        <div className="flex h-2.5 overflow-hidden rounded-full bg-sunken" role="img" aria-label="Task distribution by status">
          {total > 0 && byStatus.map((s) => {
            const meta = STATUSES.find((x) => x.value === s.status);
            return s.count ? <div key={s.status} className={meta.bar} style={{ width: `${(s.count / total) * 100}%` }} /> : null;
          })}
        </div>
        <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          {byStatus.map((s) => {
            const meta = STATUSES.find((x) => x.value === s.status);
            return (
              <li key={s.status} className="flex items-center gap-2">
                <span className={`size-2 rounded-full ${meta.bar}`} aria-hidden />
                <span className="text-muted">{meta.label}</span>
                <span className="ml-auto font-semibold">{s.count}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
