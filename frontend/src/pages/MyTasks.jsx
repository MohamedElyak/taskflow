import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListChecks } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import TaskFilters, { defaultFilters, toParams } from '../components/tasks/TaskFilters';
import TaskList from '../components/tasks/TaskList';
import Pagination from '../components/ui/Pagination';
import { EmptyState, ErrorState, PageLoader } from '../components/ui/Feedback';
import { listMyTasks } from '../api/tasks';
import useAsync from '../hooks/useAsync';
import useDebounce from '../hooks/useDebounce';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function MyTasks() {
  useDocumentTitle('My tasks');
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ ...defaultFilters, assignee: 'me', sort: 'due_date:asc' });
  const [page, setPage] = useState(1);
  const debounced = useDebounce(filters);

  useEffect(() => setPage(1), [debounced]);

  const { data, loading, error, reload } = useAsync(() => listMyTasks({ ...toParams(debounced), page, per_page: 20 }), [debounced, page]);

  return (
    <>
      <PageHeader title="My tasks" description="Tasks across all of your projects." />
      <div className="mb-5">
        <TaskFilters filters={filters} onChange={setFilters} />
      </div>

      {loading && !data ? (
        <PageLoader />
      ) : error && !data ? (
        <ErrorState message={error} onRetry={reload} />
      ) : data.data.length === 0 ? (
        <EmptyState icon={ListChecks} title="No tasks found" description="Nothing matches these filters. Tasks assigned to you will show up here." />
      ) : (
        <div className={loading ? 'opacity-60' : ''}>
          <TaskList tasks={data.data} showProject onOpen={(t) => navigate(`/projects/${t.project_id}?task=${t.id}`)} />
          <Pagination meta={data.meta} onPage={setPage} />
        </div>
      )}
    </>
  );
}
