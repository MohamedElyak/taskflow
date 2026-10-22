import { Link } from 'react-router-dom';
import { Bell, CalendarClock, FolderPlus, ListChecks } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import ProjectCard from '../components/ProjectCard';
import CompletionChart from '../components/charts/CompletionChart';
import Button from '../components/ui/Button';
import { PriorityBadge, StatusBadge } from '../components/ui/Badges';
import { AvatarStack } from '../components/ui/Avatar';
import { EmptyState, ErrorState, PageLoader } from '../components/ui/Feedback';
import { useAuth } from '../context/AuthContext';
import useAsync from '../hooks/useAsync';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { getDashboard } from '../api/misc';
import { dueLabel, timeAgo } from '../utils/format';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

function Card({ title, icon: Icon, action, children }) {
  return (
    <section className="rounded-xl border border-line bg-surface">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          {Icon && <Icon className="size-4 text-muted" aria-hidden />}
          {title}
        </h2>
        {action}
      </header>
      {children}
    </section>
  );
}

const taskLink = (t) => `/projects/${t.project?.id ?? t.project_id}?task=${t.id}`;

function TaskLines({ tasks, empty, showStatus }) {
  if (!tasks.length) return <p className="px-4 py-8 text-center text-sm text-muted">{empty}</p>;
  return (
    <ul className="divide-y divide-line">
      {tasks.map((t) => (
        <li key={t.id}>
          <Link to={taskLink(t)} className="flex items-center gap-3 px-4 py-3 hover:bg-sunken">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{t.title}</p>
              <p className="truncate text-xs text-muted">{t.project?.name}</p>
            </div>
            <div className="hidden sm:block">{showStatus ? <StatusBadge status={t.status} /> : <PriorityBadge priority={t.priority} />}</div>
            <span className={`w-28 shrink-0 text-right text-xs ${t.is_overdue ? 'font-semibold text-red-600 dark:text-red-400' : 'text-muted'}`}>
              {showStatus ? timeAgo(t.updated_at) : dueLabel(t)}
            </span>
            <AvatarStack people={t.assignees} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function Dashboard() {
  useDocumentTitle('Dashboard');
  const { user } = useAuth();
  const { data, loading, error, reload } = useAsync(getDashboard, []);

  if (loading && !data) return <PageLoader />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;

  const { stats } = data;
  const tiles = [
    ['Projects', stats.total_projects],
    ['Total tasks', stats.total_tasks],
    ['In progress', stats.in_progress_tasks],
    ['Completed', stats.completed_tasks],
    ['Overdue', stats.overdue_tasks, stats.overdue_tasks > 0],
  ];

  if (stats.total_projects === 0) {
    return (
      <>
        <PageHeader title={`${greeting()}, ${user.name.split(' ')[0]}`} description="Let's get your first project started." />
        <EmptyState
          icon={FolderPlus}
          title="No projects yet"
          description="Create a project, add tasks and invite teammates. Your statistics will appear here."
          action={<Link to="/projects?new=1"><Button>Create a project</Button></Link>}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${user.name.split(' ')[0]}`}
        description={new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
      />

      <dl className="grid grid-cols-2 divide-line overflow-hidden rounded-xl border border-line bg-surface sm:grid-cols-5 sm:divide-x">
        {tiles.map(([label, value, alert], i) => (
          <div key={label} className={`px-5 py-4 ${i > 0 ? 'border-t border-line sm:border-t-0' : ''} ${i % 2 === 1 ? 'border-l border-line sm:border-l-0' : ''}`}>
            <dt className="text-sm text-muted">{label}</dt>
            <dd className={`mt-1 text-3xl font-bold tabular-nums ${alert ? 'text-red-600 dark:text-red-400' : ''}`}>{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card title="Upcoming deadlines" icon={CalendarClock}>
            <TaskLines tasks={data.upcoming_deadlines} empty="Nothing due in the next 7 days." />
          </Card>
          <Card title="Recently updated tasks" icon={ListChecks} action={<Link to="/tasks" className="text-sm font-medium text-accent hover:underline">All my tasks</Link>}>
            <TaskLines tasks={data.recent_tasks} empty="No tasks yet." showStatus />
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Task completion">
            <div className="p-4"><CompletionChart days={data.completed_last_7_days} byStatus={data.by_status} /></div>
          </Card>
          <Card
            title={`Notifications${data.unread_notifications ? ` (${data.unread_notifications} new)` : ''}`}
            icon={Bell}
            action={<Link to="/notifications" className="text-sm font-medium text-accent hover:underline">View all</Link>}
          >
            {data.recent_notifications.length ? (
              <ul className="divide-y divide-line">
                {data.recent_notifications.map((n) => (
                  <li key={n.id} className="flex gap-3 px-4 py-3">
                    <span className={`mt-1.5 size-2 shrink-0 rounded-full ${n.read_at ? 'bg-transparent' : 'bg-accent'}`} aria-hidden />
                    <div className="min-w-0">
                      <p className="text-sm">{n.message}</p>
                      <p className="text-xs text-muted">{timeAgo(n.created_at)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-8 text-center text-sm text-muted">You're all caught up.</p>
            )}
          </Card>
        </div>
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent projects</h2>
          <Link to="/projects" className="text-sm font-medium text-accent hover:underline">All projects</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {data.recent_projects.map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>
      </section>
    </>
  );
}
