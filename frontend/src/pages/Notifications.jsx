import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Bell, CalendarClock, CheckCheck, MessageSquare, UserPlus } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/ui/Button';
import Pagination from '../components/ui/Pagination';
import { EmptyState, ErrorState, PageLoader } from '../components/ui/Feedback';
import { listNotifications, markAllNotificationsRead, markNotificationRead } from '../api/misc';
import { errorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import useAsync from '../hooks/useAsync';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { timeAgo } from '../utils/format';

const icons = { task_assigned: UserPlus, task_commented: MessageSquare, deadline_approaching: CalendarClock };

export default function Notifications() {
  useDocumentTitle('Notifications');
  const navigate = useNavigate();
  const toast = useToast();
  const { refreshUnread } = useOutletContext();
  const [page, setPage] = useState(1);
  const { data, loading, error, reload, setData } = useAsync(() => listNotifications(page), [page]);

  async function open(n) {
    if (!n.read_at) {
      markNotificationRead(n.id).then(refreshUnread).catch(() => {});
      setData((d) => ({ ...d, data: d.data.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)), unread_count: Math.max(0, d.unread_count - 1) }));
    }
    if (n.project_id && n.task_id) navigate(`/projects/${n.project_id}?task=${n.task_id}`);
  }

  async function readAll() {
    try {
      await markAllNotificationsRead();
      toast.success('All notifications marked as read.');
      reload();
      refreshUnread();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <>
      <PageHeader
        title="Notifications"
        description={data ? `${data.unread_count} unread` : undefined}
        actions={<Button variant="secondary" size="sm" onClick={readAll} disabled={!data?.unread_count}><CheckCheck className="size-4" aria-hidden />Mark all as read</Button>}
      />

      {loading && !data ? (
        <PageLoader />
      ) : error && !data ? (
        <ErrorState message={error} onRetry={reload} />
      ) : data.data.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="You will be notified when you are assigned a task, someone comments, or a deadline is near." />
      ) : (
        <>
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
            {data.data.map((n) => {
              const Icon = icons[n.type] ?? Bell;
              return (
                <li key={n.id}>
                  <button onClick={() => open(n)} className={`flex w-full items-start gap-3 px-4 py-3.5 text-left hover:bg-sunken ${n.read_at ? '' : 'bg-accent-soft/50'}`}>
                    <span className="mt-0.5 rounded-full bg-sunken p-2 text-muted"><Icon className="size-4" aria-hidden /></span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-sm ${n.read_at ? '' : 'font-semibold'}`}>{n.message}</span>
                      <span className="text-xs text-muted">{timeAgo(n.created_at)}</span>
                    </span>
                    {!n.read_at && <span className="mt-2 size-2 shrink-0 rounded-full bg-accent"><span className="sr-only">Unread</span></span>}
                  </button>
                </li>
              );
            })}
          </ul>
          <Pagination meta={data.meta} onPage={setPage} />
        </>
      )}
    </>
  );
}
