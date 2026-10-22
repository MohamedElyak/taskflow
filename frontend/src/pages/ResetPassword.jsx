import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from '../components/layout/AuthLayout';
import Button from '../components/ui/Button';
import { TextField } from '../components/ui/Field';
import { resetPassword } from '../api/auth';
import { errorMessage, fieldErrors } from '../api/client';
import { useToast } from '../context/ToastContext';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const token = params.get('token') ?? '';
  const [form, setForm] = useState({ email: params.get('email') ?? '', password: '', password_confirmation: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      await resetPassword({ ...form, token });
      toast.success('Password updated. You can sign in now.');
      navigate('/login', { replace: true });
    } catch (err) {
      const fe = fieldErrors(err);
      setErrors(fe);
      if (!Object.keys(fe).length) toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Choose a new password"
      footer={
        <Link to="/login" className="font-medium text-accent hover:underline">
          Back to sign in
        </Link>
      }
    >
      {!token ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          This reset link is missing its token. Request a new one from the forgot-password page.
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <TextField label="Email" type="email" value={form.email} onChange={set('email')} error={errors.email} required />
          <TextField label="New password" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} error={errors.password} hint="At least 8 characters, with letters and numbers." required />
          <TextField label="Confirm new password" type="password" autoComplete="new-password" value={form.password_confirmation} onChange={set('password_confirmation')} required />
          <Button type="submit" loading={loading} className="w-full">
            Update password
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
