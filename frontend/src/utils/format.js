const dateFmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
const dateYearFmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

// "2026-03-05" -> local date without timezone shifting
export function parseDay(value) {
  if (!value) return null;
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatDay(value) {
  const d = parseDay(value);
  if (!d) return '';
  return d.getFullYear() === new Date().getFullYear() ? dateFmt.format(d) : dateYearFmt.format(d);
}

export function formatDateTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function timeAgo(value) {
  if (!value) return '';
  const seconds = Math.round((Date.now() - new Date(value).getTime()) / 1000);
  const units = [['d', 86400], ['h', 3600], ['m', 60]];
  for (const [label, size] of units) {
    if (seconds >= size) return `${Math.floor(seconds / size)}${label} ago`;
  }
  return 'just now';
}

export function dueLabel(task) {
  if (!task.due_date) return null;
  const d = parseDay(task.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d - today) / 86400000);
  if (task.status !== 'done') {
    if (diff < 0) return `Overdue · ${formatDay(task.due_date)}`;
    if (diff === 0) return 'Due today';
    if (diff === 1) return 'Due tomorrow';
  }
  return formatDay(task.due_date);
}

export function initials(name = '') {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('') || '?';
}

// Role-based UI gating. The Laravel policies are the real enforcement.
export const isManager = (role) => role === 'owner' || role === 'manager';

export function canEditTask(role, task, user) {
  if (!role || !user) return false;
  if (isManager(role)) return true;
  return task.creator?.id === user.id || !!task.assignees?.some((a) => a.id === user.id);
}

export function canDeleteTask(role, task, user) {
  if (!role || !user) return false;
  return isManager(role) || task.creator?.id === user.id;
}
