import { Search } from 'lucide-react';
import { FilterSelect } from '../ui/Field';
import { PRIORITIES, STATUSES } from '../../utils/constants';

export const defaultFilters = { q: '', status: '', priority: '', assignee: '', due: '', sort: 'updated_at:desc' };

export const SORTS = [
  ['updated_at:desc', 'Recently updated'],
  ['created_at:desc', 'Newest first'],
  ['due_date:asc', 'Due date'],
  ['priority:desc', 'Priority'],
  ['title:asc', 'Title (A–Z)'],
];

/** Turn the UI filter state into API params. */
export function toParams(filters) {
  const { sort, ...rest } = filters;
  const [sortKey, direction] = sort.split(':');
  return { ...rest, sort: sortKey, direction };
}

export default function TaskFilters({ filters, onChange, members = [], showStatus = true, showAssignee = true }) {
  const set = (k) => (e) => onChange({ ...filters, [k]: e.target.value });
  const active = Object.entries(filters).some(([k, v]) => v && v !== defaultFilters[k]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-52 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          type="search"
          aria-label="Search tasks"
          placeholder="Search tasks…"
          value={filters.q}
          onChange={set('q')}
          className="h-10 w-full rounded-lg border border-line bg-surface pl-9 pr-3 text-sm placeholder:text-muted/70 hover:border-muted/50"
        />
      </div>
      {showStatus && (
        <FilterSelect label="Filter by status" value={filters.status} onChange={set('status')}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </FilterSelect>
      )}
      <FilterSelect label="Filter by priority" value={filters.priority} onChange={set('priority')}>
        <option value="">All priorities</option>
        {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
      </FilterSelect>
      {showAssignee && (
        <FilterSelect label="Filter by assignee" value={filters.assignee} onChange={set('assignee')}>
          <option value="">Anyone</option>
          <option value="me">Assigned to me</option>
          <option value="unassigned">Unassigned</option>
          {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </FilterSelect>
      )}
      <FilterSelect label="Filter by due date" value={filters.due} onChange={set('due')}>
        <option value="">Any due date</option>
        <option value="overdue">Overdue</option>
        <option value="today">Due today</option>
        <option value="week">Next 7 days</option>
        <option value="none">No due date</option>
      </FilterSelect>
      <FilterSelect label="Sort tasks" value={filters.sort} onChange={set('sort')}>
        {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </FilterSelect>
      {active && (
        <button onClick={() => onChange(defaultFilters)} className="h-10 rounded-lg px-3 text-sm font-medium text-accent hover:bg-accent-soft">
          Clear
        </button>
      )}
    </div>
  );
}
