import { ROLES, priorityLabel, statusLabel } from '../../utils/constants';

const pill = 'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium';

const statusTone = {
  todo: ['bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200', 'bg-slate-400'],
  in_progress: ['bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-200', 'bg-blue-500'],
  in_review: ['bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200', 'bg-amber-500'],
  done: ['bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200', 'bg-emerald-500'],
};

export function StatusBadge({ status }) {
  const [tone, dot] = statusTone[status] ?? statusTone.todo;
  return (
    <span className={`${pill} ${tone}`}>
      <span className={`size-1.5 rounded-full ${dot}`} aria-hidden />
      {statusLabel(status)}
    </span>
  );
}

const priorityTone = {
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  medium: 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-200',
  high: 'bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-200',
  urgent: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-200',
};

// Bars (not just colour) show the level, so it is readable without colour vision.
const levels = { low: 1, medium: 2, high: 3, urgent: 4 };

export function PriorityBadge({ priority }) {
  return (
    <span className={`${pill} ${priorityTone[priority] ?? priorityTone.medium}`}>
      <span className="flex items-end gap-px" aria-hidden>
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={`w-[3px] rounded-sm bg-current ${i <= levels[priority] ? '' : 'opacity-25'}`} style={{ height: 3 + i * 2 }} />
        ))}
      </span>
      {priorityLabel(priority)}
    </span>
  );
}

const roleTone = {
  owner: 'bg-accent-soft text-accent',
  manager: 'bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-200',
  member: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

export function RoleBadge({ role }) {
  if (!role) return null;
  return <span className={`${pill} ${roleTone[role]}`}>{ROLES[role]}</span>;
}
