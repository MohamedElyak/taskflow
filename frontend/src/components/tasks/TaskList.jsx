import { CalendarDays } from 'lucide-react';
import { AvatarStack } from '../ui/Avatar';
import { PriorityBadge, StatusBadge } from '../ui/Badges';
import { dueLabel } from '../../utils/format';

/** Table-like list that collapses into stacked rows on small screens. */
export default function TaskList({ tasks, onOpen, showProject = false }) {
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
      {tasks.map((task) => {
        const due = dueLabel(task);
        return (
          <li key={task.id}>
            <button onClick={() => onOpen(task)} className="flex w-full flex-col gap-2 px-4 py-3 text-left hover:bg-sunken sm:flex-row sm:items-center sm:gap-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{task.title}</p>
                {showProject && task.project && <p className="mt-0.5 truncate text-xs text-muted">{task.project.name}</p>}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <StatusBadge status={task.status} />
                <PriorityBadge priority={task.priority} />
                <span className={`flex min-w-24 items-center gap-1 text-xs ${task.is_overdue ? 'font-semibold text-red-600 dark:text-red-400' : 'text-muted'}`}>
                  {due && <CalendarDays className="size-3.5" aria-hidden />}
                  {due}
                </span>
                <div className="min-w-14"><AvatarStack people={task.assignees} /></div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
