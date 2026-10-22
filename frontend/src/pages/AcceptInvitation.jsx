import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AuthLayout from '../components/layout/AuthLayout';
import Button from '../components/ui/Button';
import { PageLoader } from '../components/ui/Feedback';
import { RoleBadge } from '../components/ui/Badges';
import { acceptInvitation, getInvitation } from '../api/projects';
import { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useAsync from '../hooks/useAsync';

export default function AcceptInvitation() {
  const { token } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [accepting, setAccepting] = useState(false);
  const [failure, setFailure] = useState('');
  const invitation = useAsync(() => getInvitation(token), [token]);

  async function accept() {
    setAccepting(true);
    setFailure('');
    try {
      const project = await acceptInvitation(token);
      toast.success(`You joined ${project.name}.`);
      navigate(`/projects/${project.id}`, { replace: true });
    } catch (err) {
      setFailure(errorMessage(err));
      setAccepting(false);
    }
  }

  if (authLoading || (invitation.loading && !invitation.data)) return <PageLoader />;

  const inv = invitation.data;
  const here = { from: `/invitations/${token}` };
  const unusable = !inv || inv.expired || inv.accepted;

  return (
    <AuthLayout title="Project invitation" subtitle={inv ? `${inv.invited_by ?? 'Someone'} invited you to collaborate.` : undefined}>
      {!inv ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">{invitation.error || 'This invitation link is not valid.'}</p>
      ) : (
        <div className="space-y-5">
          <div className="rounded-xl border border-line bg-surface p-4">
            <p className="text-lg font-semibold">{inv.project.name}</p>
            <div className="mt-2 flex items-center gap-2 text-sm text-muted">Role: <RoleBadge role={inv.role} /></div>
            <p className="mt-2 text-sm text-muted">Sent to {inv.email}</p>
          </div>

          {inv.expired && <p role="alert" className="text-sm text-red-600 dark:text-red-400">This invitation has expired. Ask the project owner for a new one.</p>}
          {inv.accepted && <p role="alert" className="text-sm text-red-600 dark:text-red-400">This invitation was already used.</p>}
          {failure && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{failure}</p>}

          {!unusable && (user ? (
            <Button onClick={accept} loading={accepting} className="w-full">Accept invitation</Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted">Sign in or create an account with <strong>{inv.email}</strong> to accept.</p>
              <div className="flex gap-2">
                <Link to="/login" state={here} className="flex-1"><Button className="w-full">Sign in</Button></Link>
                <Link to="/register" state={here} className="flex-1"><Button variant="secondary" className="w-full">Create account</Button></Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </AuthLayout>
  );
}
