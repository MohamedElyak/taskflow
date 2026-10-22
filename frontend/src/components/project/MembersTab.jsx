import { useState } from 'react';
import { Check, Copy, LogOut, MailPlus, Trash2, X } from 'lucide-react';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import { RoleBadge } from '../ui/Badges';
import { FilterSelect, SelectField, TextField } from '../ui/Field';
import { Spinner } from '../ui/Feedback';
import { changeMemberRole, createInvitation, listInvitations, removeMember, revokeInvitation } from '../../api/projects';
import { errorMessage, fieldErrors } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import useAsync from '../../hooks/useAsync';
import { formatDay } from '../../utils/format';

export default function MembersTab({ project, onChanged, onLeft }) {
  const { user } = useAuth();
  const toast = useToast();
  const isOwner = project.my_role === 'owner';
  const [target, setTarget] = useState(null); // member pending removal
  const [busy, setBusy] = useState(false);
  const [invite, setInvite] = useState({ email: '', role: 'member' });
  const [inviteErrors, setInviteErrors] = useState({});
  const [inviting, setInviting] = useState(false);
  const [link, setLink] = useState('');
  const [copied, setCopied] = useState(false);

  const invitations = useAsync(() => (isOwner ? listInvitations(project.id) : Promise.resolve([])), [project.id, isOwner]);

  async function setRole(member, role) {
    try {
      await changeMemberRole(project.id, member.id, role);
      toast.success(`${member.name} is now ${role === 'manager' ? 'a manager' : 'a member'}.`);
      onChanged();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function confirmRemove() {
    setBusy(true);
    try {
      await removeMember(project.id, target.id);
      if (target.id === user.id) {
        toast.success('You left the project.');
        onLeft();
        return;
      }
      toast.success(`${target.name} was removed.`);
      setTarget(null);
      onChanged();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function sendInvite(e) {
    e.preventDefault();
    setInviting(true);
    setInviteErrors({});
    setLink('');
    try {
      const inv = await createInvitation(project.id, invite);
      setLink(inv.accept_url);
      setInvite({ email: '', role: 'member' });
      toast.success('Invitation created.');
      invitations.reload();
    } catch (err) {
      const fe = fieldErrors(err);
      setInviteErrors(fe);
      if (!Object.keys(fe).length) toast.error(errorMessage(err));
    } finally {
      setInviting(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy. Select the link and copy it manually.');
    }
  }

  async function revoke(inv) {
    try {
      await revokeInvitation(inv.id);
      toast.success('Invitation revoked.');
      invitations.reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <section aria-labelledby="members-title">
        <h2 id="members-title" className="mb-3 text-sm font-semibold">Members ({project.members.length})</h2>
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
          {project.members.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <Avatar name={m.name} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{m.name}{m.id === user.id && <span className="ml-1.5 text-xs font-normal text-muted">(you)</span>}</p>
                <p className="truncate text-xs text-muted">{m.email}</p>
              </div>
              {isOwner && m.role !== 'owner' ? (
                <FilterSelect label={`Role for ${m.name}`} value={m.role} onChange={(e) => setRole(m, e.target.value)} className="h-9">
                  <option value="manager">Manager</option>
                  <option value="member">Member</option>
                </FilterSelect>
              ) : (
                <RoleBadge role={m.role} />
              )}
              {isOwner && m.role !== 'owner' && (
                <button onClick={() => setTarget(m)} className="rounded-md p-2 text-muted hover:bg-sunken hover:text-red-600" aria-label={`Remove ${m.name}`}>
                  <Trash2 className="size-4" />
                </button>
              )}
              {m.id === user.id && m.role !== 'owner' && (
                <Button variant="dangerGhost" size="sm" onClick={() => setTarget(m)}><LogOut className="size-4" aria-hidden />Leave</Button>
              )}
            </li>
          ))}
        </ul>
      </section>

      {isOwner && (
        <section aria-labelledby="invite-title" className="space-y-4">
          <div className="rounded-xl border border-line bg-surface p-4">
            <h2 id="invite-title" className="mb-3 flex items-center gap-2 text-sm font-semibold"><MailPlus className="size-4 text-muted" aria-hidden />Invite by email</h2>
            <form onSubmit={sendInvite} className="space-y-3" noValidate>
              <TextField label="Email address" type="email" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} error={inviteErrors.email} required />
              <SelectField label="Role" value={invite.role} onChange={(e) => setInvite({ ...invite, role: e.target.value })} error={inviteErrors.role}>
                <option value="member">Member: create and update own tasks, comment</option>
                <option value="manager">Manager: manage and assign all tasks</option>
              </SelectField>
              <Button type="submit" loading={inviting} className="w-full">Create invitation</Button>
            </form>

            {link && (
              <div role="status" className="mt-4 rounded-lg bg-accent-soft p-3 text-sm">
                <p className="font-medium">Invitation ready. Share this link (valid for 7 days):</p>
                <div className="mt-2 flex items-center gap-2">
                  <input readOnly value={link} aria-label="Invitation link" onFocus={(e) => e.target.select()} className="h-9 min-w-0 flex-1 rounded-md border border-line bg-surface px-2 text-xs" />
                  <Button size="sm" variant="secondary" onClick={copyLink}>{copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}{copied ? 'Copied' : 'Copy'}</Button>
                </div>
                <p className="mt-2 text-xs text-muted">The email is also written to the Laravel log (no mail provider is needed locally).</p>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-line bg-surface p-4">
            <h2 className="mb-3 text-sm font-semibold">Pending invitations</h2>
            {invitations.loading && !invitations.data ? (
              <Spinner />
            ) : invitations.data?.length ? (
              <ul className="space-y-2">
                {invitations.data.map((inv) => (
                  <li key={inv.id} className="flex items-center gap-2 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="truncate">{inv.email}</p>
                      <p className="text-xs text-muted">{inv.role} · expires {formatDay(inv.expires_at)}</p>
                    </div>
                    <button onClick={() => revoke(inv)} className="rounded-md p-1.5 text-muted hover:bg-sunken hover:text-red-600" aria-label={`Revoke invitation for ${inv.email}`}><X className="size-4" /></button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No pending invitations.</p>
            )}
          </div>
        </section>
      )}

      <ConfirmDialog
        open={!!target}
        danger
        loading={busy}
        title={target?.id === user.id ? 'Leave this project?' : 'Remove member?'}
        message={target?.id === user.id ? 'You will lose access to this project and be unassigned from its tasks.' : `${target?.name} will lose access to this project and be unassigned from its tasks.`}
        confirmLabel={target?.id === user.id ? 'Leave project' : 'Remove'}
        onConfirm={confirmRemove}
        onCancel={() => setTarget(null)}
      />
    </div>
  );
}
