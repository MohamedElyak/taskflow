import { CalendarDays, MessageSquare } from 'lucide-react';
import { AvatarStack } from '../ui/Avatar';
import { PriorityBadge } from '../ui/Badges';
import { dueLabel } from '../../utils/format';

/** Compact task summary used on the Kanban board. Keyboard: Enter opens the task. */
export default function TaskCard({ task, onOpen, dragProps = {}, innerRef, dragging = false }) {
  const due = dueLabel(task);

  return (
    <article
      ref={innerRef}
      {...dragProps}
      onClick={() => onOpen(task)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpen(task);
        dragProps.onKeyDown?.(e);
      }}
      className={`cursor-pointer rounded-lg border bg-surface p-3 text-left shadow-sm transition-shadow hover:border-muted/40 ${
        dragging ? 'border-accent shadow-lg ring-2 ring-accent/30' : 'border-line'
      }`}
    >
      <h4 className="text-sm font-medium leading-snug">{task.title}</h4>
      <div className="mt-2.5">
        <PriorityBadge priority={task.priority} />
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3 text-xs text-muted">
          {due && (
            <span className={`flex items-center gap-1 ${task.is_overdue ? 'font-semibold text-red-600 dark:text-red-400' : ''}`}>
              <CalendarDays className="size-3.5" aria-hidden />
              {due}
            </span>
          )}
          {task.comments_count > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare className="size-3.5" aria-hidden />
              {task.comments_count}
              <span className="sr-only">comments</span>
            </span>
          )}
        </div>
        <AvatarStack people={task.assignees} />
      </div>
    </article>
  );
}
