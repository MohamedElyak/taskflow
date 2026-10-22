import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, Pencil, Send, Trash2, UserRound } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import ConfirmDialog from '../ui/ConfirmDialog';
import { ErrorState, PageLoader } from '../ui/Feedback';
import { FilterSelect } from '../ui/Field';
import { PriorityBadge, StatusBadge } from '../ui/Badges';
import TaskFormModal from './TaskFormModal';
import { addComment, deleteComment, deleteTask, getTask, listComments, updateTaskStatus } from '../../api/tasks';
import { errorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { STATUSES } from '../../utils/constants';
import { canDeleteTask, canEditTask, dueLabel, formatDateTime, isManager, timeAgo } from '../../utils/format';

/** Slide-over with the full task: details, status, assignees and the comment thread. */
export default function TaskPanel({ taskId, project, onClose, onChanged, onDeleted }) {
  const { user } = useAuth();
  const toast = useToast();
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [error, setError] = useState('');
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const role = project.my_role;
  const archived = project.archived;

  const load = useCallback(async () => {
    setError('');
    try {
      const [t, c] = await Promise.all([getTask(taskId), listComments(taskId)]);
      setTask(t);
      setComments(c);
    } catch (err) {
      setError(errorMessage(err, 'Could not load this task.'));
    }
  }, [taskId]);

  useEffect(() => {
    setTask(null);
    load();
  }, [load]);

  const editable = task && !archived && canEditTask(role, task, user);
  const deletable = task && !archived && canDeleteTask(role, task, user);

  async function changeStatus(e) {
    const previous = task;
    const status = e.target.value;
    setTask({ ...task, status });
    try {
      const saved = await updateTaskStatus(task.id, status);
      setTask(saved);
      onChanged(saved);
    } catch (err) {
      setTask(previous);
      toast.error(errorMessage(err));
    }
  }

  async function postComment(e) {
    e.preventDefault();
    if (!body.trim()) return;
    setPosting(true);
    try {
      const c = await addComment(task.id, body.trim());
      setComments((list) => [...list, c]);
      setTask((t) => ({ ...t, comments_count: (t.comments_count ?? 0) + 1 }));
      onChanged({ ...task, comments_count: (task.comments_count ?? 0) + 1 });
      setBody('');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setPosting(false);
    }
  }

  async function removeComment(id) {
    try {
      await deleteComment(id);
      setComments((list) => list.filter((c) => c.id !== id));
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function removeTask() {
    setDeleting(true);
    try {
      await deleteTask(task.id);
      toast.success('Task deleted.');
      onDeleted(task.id);
    } catch (err) {
      toast.error(errorMessage(err));
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <>
      <Modal open onClose={onClose} variant="drawer" title={task?.title ?? 'Task'}>
        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : !task ? (
          <PageLoader />
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
              {task.is_overdue && <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950/50 dark:text-red-200">Overdue</span>}
            </div>

            <dl className="grid grid-cols-[7rem_1fr] items-center gap-x-3 gap-y-3 text-sm">
              <dt className="text-muted">Status</dt>
              <dd>
                {editable ? (
                  <FilterSelect label="Change status" value={task.status} onChange={changeStatus} className="h-9">
                    {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </FilterSelect>
                ) : (
                  <StatusBadge status={task.status} />
                )}
              </dd>
              <dt className="text-muted">Due date</dt>
              <dd className="flex items-center gap-1.5">
                <CalendarDays className="size-4 text-muted" aria-hidden />
                {dueLabel(task) ?? <span className="text-muted">No due date</span>}
              </dd>
              <dt className="text-muted">Assignees</dt>
              <dd className="flex flex-wrap gap-2">
                {task.assignees.length ? (
                  task.assignees.map((a) => (
                    <span key={a.id} className="flex items-center gap-1.5 rounded-full bg-sunken py-0.5 pl-0.5 pr-2.5 text-xs">
                      <Avatar name={a.name} size="sm" /> {a.name}
                    </span>
                  ))
                ) : (
                  <span className="flex items-center gap-1.5 text-muted"><UserRound className="size-4" aria-hidden />Unassigned</span>
                )}
              </dd>
              <dt className="text-muted">Created by</dt>
              <dd>{task.creator?.name ?? <span className="text-muted">Former member</span>} · <span className="text-muted">{formatDateTime(task.created_at)}</span></dd>
            </dl>

            <section>
              <h3 className="mb-1.5 text-sm font-semibold">Description</h3>
              {task.description ? <p className="whitespace-pre-wrap text-sm leading-relaxed">{task.description}</p> : <p className="text-sm text-muted">No description.</p>}
            </section>

            {(editable || deletable) && (
              <div className="flex gap-2">
                {editable && <Button variant="secondary" size="sm" onClick={() => setEditing(true)}><Pencil className="size-4" aria-hidden />Edit</Button>}
                {deletable && <Button variant="dangerGhost" size="sm" onClick={() => setConfirmDelete(true)}><Trash2 className="size-4" aria-hidden />Delete</Button>}
              </div>
            )}

            <section aria-labelledby="comments-title" className="border-t border-line pt-5">
              <h3 id="comments-title" className="mb-3 text-sm font-semibold">Comments ({comments.length})</h3>
              <ul className="space-y-4">
                {comments.map((c) => (
                  <li key={c.id} className="flex gap-3">
                    <Avatar name={c.user?.name ?? '?'} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{c.user?.name ?? 'Former member'}</span>{' '}
                        <span className="text-xs text-muted">{timeAgo(c.created_at)}</span>
                      </p>
                      <p className="mt-0.5 whitespace-pre-wrap text-sm">{c.body}</p>
                      {(c.user?.id === user.id || isManager(role)) && (
                        <button onClick={() => removeComment(c.id)} className="mt-1 text-xs text-muted hover:text-red-600">Delete</button>
                      )}
                    </div>
                  </li>
                ))}
                {!comments.length && <li className="text-sm text-muted">No comments yet.</li>}
              </ul>

              <form onSubmit={postComment} className="mt-4 flex items-end gap-2">
                <label className="flex-1">
                  <span className="sr-only">Add a comment</span>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={2}
                    maxLength={2000}
                    placeholder="Write a comment…"
                    className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm placeholder:text-muted/70"
                  />
                </label>
                <Button type="submit" loading={posting} disabled={!body.trim()} aria-label="Post comment"><Send className="size-4" aria-hidden /></Button>
              </form>
            </section>
          </div>
        )}
      </Modal>

      {task && (
        <TaskFormModal
          open={editing}
          onClose={() => setEditing(false)}
          projectId={project.id}
          members={project.members}
          role={role}
          task={task}
          onSaved={(saved) => {
            setTask(saved);
            onChanged(saved);
          }}
        />
      )}
      <ConfirmDialog
        open={confirmDelete}
        danger
        loading={deleting}
        title="Delete this task?"
        message="The task and all of its comments will be permanently removed."
        confirmLabel="Delete task"
        onConfirm={removeTask}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
