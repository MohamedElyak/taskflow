import { useEffect, useState } from 'react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { SelectField, TextArea, TextField } from '../ui/Field';
import { createTask, updateTask } from '../../api/tasks';
import { errorMessage, fieldErrors } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { PRIORITIES, STATUSES } from '../../utils/constants';
import { isManager } from '../../utils/format';

const empty = { title: '', description: '', status: 'todo', priority: 'medium', due_date: '', assignee_ids: [] };

export default function TaskFormModal({ open, onClose, projectId, members, role, task, defaultStatus = 'todo', onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const canAssign = isManager(role);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      task
        ? { title: task.title, description: task.description ?? '', status: task.status, priority: task.priority, due_date: task.due_date ?? '', assignee_ids: task.assignees.map((a) => a.id) }
        : { ...empty, status: defaultStatus }
    );
  }, [open, task, defaultStatus]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const toggleAssignee = (id) =>
    setForm((f) => ({ ...f, assignee_ids: f.assignee_ids.includes(id) ? f.assignee_ids.filter((x) => x !== id) : [...f.assignee_ids, id] }));

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setErrors({});

    const payload = { title: form.title, description: form.description || null, status: form.status, priority: form.priority, due_date: form.due_date || null };
    if (canAssign) payload.assignee_ids = form.assignee_ids;

    try {
      const saved = task ? await updateTask(task.id, payload) : await createTask(projectId, payload);
      toast.success(task ? 'Task updated.' : 'Task created.');
      onSaved(saved);
      onClose();
    } catch (err) {
      const fe = fieldErrors(err);
      setErrors(fe);
      if (!Object.keys(fe).length) toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={task ? 'Edit task' : 'New task'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="task-form" loading={saving}>{task ? 'Save changes' : 'Create task'}</Button>
        </>
      }
    >
      <form id="task-form" onSubmit={submit} className="space-y-4" noValidate>
        <TextField label="Title" value={form.title} onChange={set('title')} error={errors.title} maxLength={255} required autoFocus />
        <TextArea label="Description" value={form.description} onChange={set('description')} error={errors.description} />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Status" value={form.status} onChange={set('status')} error={errors.status}>
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </SelectField>
          <SelectField label="Priority" value={form.priority} onChange={set('priority')} error={errors.priority}>
            {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </SelectField>
        </div>
        <TextField label="Due date" type="date" value={form.due_date} onChange={set('due_date')} error={errors.due_date} />

        {canAssign && (
          <fieldset>
            <legend className="mb-1.5 text-sm font-medium">Assignees</legend>
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-line p-2">
              {members.map((m) => (
                <label key={m.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-sunken">
                  <input type="checkbox" checked={form.assignee_ids.includes(m.id)} onChange={() => toggleAssignee(m.id)} className="size-4 accent-[var(--accent)]" />
                  {m.name}
                  <span className="ml-auto text-xs text-muted">{m.email}</span>
                </label>
              ))}
            </div>
            {errors['assignee_ids.0'] && <p className="mt-1.5 text-sm text-red-600">{errors['assignee_ids.0']}</p>}
          </fieldset>
        )}
      </form>
    </Modal>
  );
}
