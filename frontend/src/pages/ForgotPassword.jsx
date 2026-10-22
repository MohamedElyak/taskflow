import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/layout/AuthLayout';
import Button from '../components/ui/Button';
import { TextField } from '../components/ui/Field';
import { forgotPassword } from '../api/auth';
import { errorMessage, fieldErrors } from '../api/client';
import { useToast } from '../context/ToastContext';

export default function ForgotPassword() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      const fe = fieldErrors(err);
      if (fe.email) setError(fe.email);
      else toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we will send you a reset link."
      footer={
        <Link to="/login" className="font-medium text-accent hover:underline">
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <div role="status" className="rounded-lg border border-line bg-surface p-4 text-sm">
          <p className="font-medium">Check your inbox</p>
          <p className="mt-1 text-muted">
            If that email has an account, a reset link is on its way. While developing locally, emails are written to{' '}
            <code className="rounded bg-sunken px-1">backend/storage/logs/laravel.log</code>.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <TextField label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} required />
          <Button type="submit" loading={loading} className="w-full">
            Send reset link
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
