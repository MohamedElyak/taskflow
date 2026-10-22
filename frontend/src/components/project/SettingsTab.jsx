import { useState } from 'react';
import { Archive, ArchiveRestore, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import { TextArea, TextField } from '../ui/Field';
import { archiveProject, deleteProject, unarchiveProject, updateProject } from '../../api/projects';
import { errorMessage, fieldErrors } from '../../api/client';
import { useToast } from '../../context/ToastContext';

export default function SettingsTab({ project, onChanged, onDeleted }) {
  const toast = useToast();
  const isOwner = project.my_role === 'owner';
  const [form, setForm] = useState({ name: project.name, description: project.description ?? '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null); // 'archive' | 'delete'
  const [busy, setBusy] = useState(false);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      await updateProject(project.id, form);
      toast.success('Project updated.');
      onChanged();
    } catch (err) {
      const fe = fieldErrors(err);
      setErrors(fe);
      if (!Object.keys(fe).length) toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function runConfirmed() {
    setBusy(true);
    try {
      if (confirm === 'delete') {
        await deleteProject(project.id);
        toast.success('Project deleted.');
        onDeleted();
        return;
      }
      if (project.archived) await unarchiveProject(project.id);
      else await archiveProject(project.id);
      toast.success(project.archived ? 'Project restored.' : 'Project archived.');
      setConfirm(null);
      onChanged();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      <form onSubmit={save} className="space-y-4 rounded-xl border border-line bg-surface p-5" noValidate>
        <h2 className="text-sm font-semibold">Project details</h2>
        <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} maxLength={120} required />
        <TextArea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} error={errors.description} />
        <Button type="submit" loading={saving}>Save changes</Button>
      </form>

      {isOwner && (
        <section className="rounded-xl border border-red-200 p-5 dark:border-red-900/60" aria-labelledby="danger-title">
          <h2 id="danger-title" className="text-sm font-semibold text-red-700 dark:text-red-400">Danger zone</h2>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{project.archived ? 'Restore this project' : 'Archive this project'}</p>
              <p className="text-sm text-muted">{project.archived ? 'Make it editable again.' : 'It becomes read-only and is hidden from the active list.'}</p>
            </div>
            <Button variant="secondary" onClick={() => setConfirm('archive')}>
              {project.archived ? <ArchiveRestore className="size-4" aria-hidden /> : <Archive className="size-4" aria-hidden />}
              {project.archived ? 'Restore' : 'Archive'}
            </Button>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
            <div>
              <p className="text-sm font-medium">Delete this project</p>
              <p className="text-sm text-muted">Permanently removes all tasks and comments.</p>
            </div>
            <Button variant="danger" onClick={() => setConfirm('delete')}><Trash2 className="size-4" aria-hidden />Delete</Button>
          </div>
        </section>
      )}

      <ConfirmDialog
        open={!!confirm}
        danger={confirm === 'delete'}
        loading={busy}
        title={confirm === 'delete' ? 'Delete project?' : project.archived ? 'Restore project?' : 'Archive project?'}
        message={confirm === 'delete' ? `"${project.name}" and everything in it will be permanently deleted. This cannot be undone.` : project.archived ? 'The project becomes editable again.' : 'The project becomes read-only for everyone.'}
        confirmLabel={confirm === 'delete' ? 'Delete project' : project.archived ? 'Restore' : 'Archive'}
        onConfirm={runConfirmed}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
