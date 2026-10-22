import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FolderKanban, Plus, Search } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import ProjectCard from '../components/ProjectCard';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Pagination from '../components/ui/Pagination';
import { FilterSelect, TextArea, TextField } from '../components/ui/Field';
import { EmptyState, ErrorState, PageLoader } from '../components/ui/Feedback';
import { createProject, listProjects } from '../api/projects';
import { errorMessage, fieldErrors } from '../api/client';
import { useToast } from '../context/ToastContext';
import useAsync from '../hooks/useAsync';
import useDebounce from '../hooks/useDebounce';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function Projects() {
  useDocumentTitle('Projects');
  const navigate = useNavigate();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('active');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(params.get('new') === '1');
  const [form, setForm] = useState({ name: '', description: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const search = useDebounce(q);

  useEffect(() => setPage(1), [search, status, role]);

  const { data, loading, error, reload } = useAsync(
    () => listProjects({ q: search || undefined, status, role: role || undefined, page, per_page: 12 }),
    [search, status, role, page]
  );

  function closeCreate() {
    setCreating(false);
    if (params.get('new')) setParams({}, { replace: true });
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const project = await createProject(form);
      toast.success('Project created.');
      navigate(`/projects/${project.id}`);
    } catch (err) {
      const fe = fieldErrors(err);
      setErrors(fe);
      if (!Object.keys(fe).length) toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const newButton = <Button onClick={() => { setForm({ name: '', description: '' }); setErrors({}); setCreating(true); }}><Plus className="size-4" aria-hidden />New project</Button>;

  return (
    <>
      <PageHeader title="Projects" description="Everything you own or collaborate on." actions={newButton} />

      <div className="mb-6 flex flex-wrap gap-2">
        <div className="relative min-w-52 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input type="search" aria-label="Search projects" placeholder="Search projects…" value={q} onChange={(e) => setQ(e.target.value)} className="h-10 w-full rounded-lg border border-line bg-surface pl-9 pr-3 text-sm placeholder:text-muted/70 hover:border-muted/50" />
        </div>
        <FilterSelect label="Project status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
          <option value="all">All</option>
        </FilterSelect>
        <FilterSelect label="Your role" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">Any role</option>
          <option value="owner">Owner</option>
          <option value="manager">Manager</option>
          <option value="member">Member</option>
        </FilterSelect>
      </div>

      {loading && !data ? (
        <PageLoader />
      ) : error && !data ? (
        <ErrorState message={error} onRetry={reload} />
      ) : data.data.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={search || role || status !== 'active' ? 'No projects match your filters' : 'No projects yet'}
          description={search || role || status !== 'active' ? 'Try a different search or filter.' : 'Create your first project to start organising tasks.'}
          action={!search && !role && status === 'active' ? newButton : null}
        />
      ) : (
        <>
          <div className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-3 ${loading ? 'opacity-60' : ''}`}>
            {data.data.map((p) => <ProjectCard key={p.id} project={p} />)}
          </div>
          <Pagination meta={data.meta} onPage={setPage} />
        </>
      )}

      <Modal
        open={creating}
        onClose={closeCreate}
        title="New project"
        footer={
          <>
            <Button variant="secondary" onClick={closeCreate}>Cancel</Button>
            <Button type="submit" form="project-form" loading={saving}>Create project</Button>
          </>
        }
      >
        <form id="project-form" onSubmit={submit} className="space-y-4" noValidate>
          <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} maxLength={120} required autoFocus />
          <TextArea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} error={errors.description} hint="Optional. What is this project about?" />
        </form>
      </Modal>
    </>
  );
}
