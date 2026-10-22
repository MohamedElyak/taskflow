import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/layout/AuthLayout';
import Button from '../components/ui/Button';
import { TextField } from '../components/ui/Field';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { errorMessage, fieldErrors } from '../api/client';

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      await register(form);
      toast.success('Welcome to TaskFlow!');
      navigate(location.state?.from || '/', { replace: true });
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
      title="Create your account"
      subtitle="Free to run on your own machine. No credit card required."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" state={location.state} className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <TextField label="Full name" autoComplete="name" value={form.name} onChange={set('name')} error={errors.name} required />
        <TextField label="Email" type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} required />
        <TextField
          label="Password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={set('password')}
          error={errors.password}
          hint="At least 8 characters, with letters and numbers."
          required
        />
        <TextField label="Confirm password" type="password" autoComplete="new-password" value={form.password_confirmation} onChange={set('password_confirmation')} required />
        <Button type="submit" loading={loading} className="w-full">
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
