export const STATUSES = [
  { value: 'todo', label: 'To Do', bar: 'bg-slate-400' },
  { value: 'in_progress', label: 'In Progress', bar: 'bg-blue-500' },
  { value: 'in_review', label: 'In Review', bar: 'bg-amber-500' },
  { value: 'done', label: 'Done', bar: 'bg-emerald-500' },
];

export const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export const ROLES = {
  owner: 'Owner',
  manager: 'Manager',
  member: 'Member',
};

export const statusLabel = (v) => STATUSES.find((s) => s.value === v)?.label ?? v;
export const priorityLabel = (v) => PRIORITIES.find((p) => p.value === v)?.label ?? v;
