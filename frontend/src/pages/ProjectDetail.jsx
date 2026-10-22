import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Archive, ChevronLeft, ListChecks, Plus } from 'lucide-react';
import KanbanBoard from '../components/kanban/KanbanBoard';
import TaskFilters, { defaultFilters, toParams } from '../components/tasks/TaskFilters';
import TaskFormModal from '../components/tasks/TaskFormModal';
import TaskList from '../components/tasks/TaskList';
import TaskPanel from '../components/tasks/TaskPanel';
import MembersTab from '../components/project/MembersTab';
import SettingsTab from '../components/project/SettingsTab';
import Button from '../components/ui/Button';
import Pagination from '../components/ui/Pagination';
import { RoleBadge } from '../components/ui/Badges';
import { EmptyState, ErrorState, PageLoader } from '../components/ui/Feedback';
import { getProject } from '../api/projects';
import { listProjectTasks, updateTaskStatus } from '../api/tasks';
import { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useAsync from '../hooks/useAsync';
import useDebounce from '../hooks/useDebounce';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { isManager } from '../utils/format';

const TABS = [
  ['board', 'Board'],
  ['list', 'List'],
  ['members', 'Members'],
  ['settings', 'Settings'],
];

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'board';
  const openTaskId = params.get('task');

  const [filters, setFilters] = useState(defaultFilters);
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const debounced = useDebounce(filters);
  const isTaskTab = tab === 'board' || tab === 'list';

  const project = useAsync(() => getProject(id), [id]);
  useDocumentTitle(project.data?.name);

  useEffect(() => setPage(1), [debounced, tab]);

  // The board loads every task (up to 200); the list view is paginated.
  const tasks = useAsync(
    () => (isTaskTab ? listProjectTasks(id, { ...toParams(debounced), page: tab === 'list' ? page : 1, per_page: tab === 'board' ? 200 : 15 }) : Promise.resolve(null)),
    [id, tab, debounced, page]
  );

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: key === 'task' });
  };

  if (project.loading && !project.data) return <PageLoader />;
  if (project.error && !project.data) {
    return (
      <div className="space-y-4">
        <ErrorState message={project.error} onRetry={project.reload} />
        <Link to="/projects" className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"><ChevronLeft className="size-4" />Back to projects</Link>
      </div>
    );
  }

  const p = project.data;
  const manager = isManager(p.my_role);
  const readOnly = p.archived;
  const visibleTabs = TABS.filter(([key]) => key !== 'settings' || manager);
  const taskList = tasks.data?.data ?? [];

  // Optimistic drag and drop: move the card now, undo it if the API rejects.
  async function moveTask(task, status) {
    const previous = task.status;
    const patch = (s) => tasks.setData((d) => ({ ...d, data: d.data.map((t) => (t.id === task.id ? { ...t, status: s } : t)) }));
    patch(status);
    try {
      const saved = await updateTaskStatus(task.id, status);
      tasks.setData((d) => ({ ...d, data: d.data.map((t) => (t.id === saved.id ? { ...t, ...saved } : t)) }));
      project.reload();
    } catch (err) {
      patch(previous);
      toast.error(`Could not move "${task.title}": ${errorMessage(err)}`);
    }
  }

  function taskChanged(updated) {
    tasks.setData((d) => (d ? { ...d, data: d.data.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)) } : d));
    project.reload();
  }

  function taskDeleted() {
    setParam('task', null);
    tasks.reload();
    project.reload();
  }

  const openTask = (t) => setParam('task', String(t.id));

  return (
    <>
      <Link to="/projects" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ChevronLeft className="size-4" aria-hidden />Projects</Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{p.name}</h1>
            <RoleBadge role={p.my_role} />
            {readOnly && <span className="inline-flex items-center gap-1 rounded-full bg-sunken px-2 py-0.5 text-xs font-medium text-muted"><Archive className="size-3" aria-hidden />Archived</span>}
          </div>
          {p.description && <p className="mt-1 max-w-2xl text-sm text-muted">{p.description}</p>}
          <div className="mt-3 flex max-w-sm items-center gap-3 text-xs text-muted">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sunken" role="progressbar" aria-label="Project progress" aria-valuenow={p.progress} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${p.progress}%` }} />
            </div>
            <span>{p.progress}% · {p.done_tasks_count}/{p.tasks_count} done</span>
          </div>
        </div>
        {!readOnly && <Button onClick={() => setCreating(true)}><Plus className="size-4" aria-hidden />New task</Button>}
      </div>

      <div role="tablist" aria-label="Project sections" className="mt-6 flex gap-1 overflow-x-auto border-b border-line">
        {visibleTabs.map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setParam('tab', key === 'board' ? null : key)}
            className={`-mb-px shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium ${tab === key ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-ink'}`}
          >
            {label}{key === 'members' && <span className="ml-1.5 text-xs opacity-70">{p.members.length}</span>}
          </button>
        ))}
      </div>

      <div className="mt-6" role="tabpanel">
        {isTaskTab && (
          <>
            <div className="mb-5"><TaskFilters filters={filters} onChange={setFilters} members={p.members} showStatus={tab === 'list'} /></div>

            {tasks.loading && !tasks.data ? (
              <PageLoader />
            ) : tasks.error && !tasks.data ? (
              <ErrorState message={tasks.error} onRetry={tasks.reload} />
            ) : taskList.length === 0 && tab === 'list' ? (
              <EmptyState icon={ListChecks} title="No tasks found" description="Create a task or adjust your filters." action={!readOnly && <Button onClick={() => setCreating(true)}><Plus className="size-4" aria-hidden />New task</Button>} />
            ) : tab === 'board' ? (
              <div className={tasks.loading ? 'opacity-70' : ''}>
                <KanbanBoard tasks={taskList} role={p.my_role} user={user} readOnly={readOnly} onMove={moveTask} onOpen={openTask} />
                {taskList.length === 0 && <p className="mt-2 text-center text-sm text-muted">No tasks yet. Create one to get started.</p>}
              </div>
            ) : (
              <div className={tasks.loading ? 'opacity-70' : ''}>
                <TaskList tasks={taskList} onOpen={openTask} />
                <Pagination meta={tasks.data.meta} onPage={setPage} />
              </div>
            )}
          </>
        )}

        {tab === 'members' && <MembersTab project={p} onChanged={project.reload} onLeft={() => navigate('/projects')} />}
        {tab === 'settings' && manager && <SettingsTab key={p.updated_at} project={p} onChanged={project.reload} onDeleted={() => navigate('/projects')} />}
      </div>

      {openTaskId && <TaskPanel taskId={openTaskId} project={p} onClose={() => setParam('task', null)} onChanged={taskChanged} onDeleted={taskDeleted} />}

      <TaskFormModal open={creating} onClose={() => setCreating(false)} projectId={p.id} members={p.members} role={p.my_role} onSaved={() => { tasks.reload(); project.reload(); }} />
    </>
  );
}
