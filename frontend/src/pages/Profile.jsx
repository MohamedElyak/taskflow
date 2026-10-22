import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import { TextField } from '../components/ui/Field';
import { updatePassword, updateProfile } from '../api/auth';
import { errorMessage, fieldErrors } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { formatDay } from '../utils/format';

export default function Profile() {
  useDocumentTitle('Profile');
  const { user, setUser } = useAuth();
  const { theme, toggle } = useTheme();
  const toast = useToast();

  const [form, setForm] = useState({ name: user.name, email: user.email });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [pw, setPw] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwSaving, setPwSaving] = useState(false);

  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      setUser(await updateProfile(form));
      toast.success('Profile updated.');
    } catch (err) {
      const fe = fieldErrors(err);
      setErrors(fe);
      if (!Object.keys(fe).length) toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    setPwSaving(true);
    setPwErrors({});
    try {
      await updatePassword(pw);
      setPw({ current_password: '', password: '', password_confirmation: '' });
      toast.success('Password changed.');
    } catch (err) {
      const fe = fieldErrors(err);
      setPwErrors(fe);
      if (!Object.keys(fe).length) toast.error(errorMessage(err));
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <>
      <PageHeader title="Profile" description="Manage your account and preferences." />

      <div className="max-w-2xl space-y-6">
        <section className="rounded-xl border border-line bg-surface p-5">
          <div className="mb-5 flex items-center gap-4">
            <Avatar name={user.name} size="lg" className="!size-14 !text-lg" />
            <div>
              <p className="font-semibold">{user.name}</p>
              <p className="text-sm text-muted">Member since {formatDay(user.created_at)}</p>
            </div>
          </div>
          <form onSubmit={saveProfile} className="space-y-4" noValidate>
            <TextField label="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} required />
            <TextField label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} required />
            <Button type="submit" loading={saving}>Save profile</Button>
          </form>
        </section>

        <section className="rounded-xl border border-line bg-surface p-5">
          <h2 className="mb-4 text-sm font-semibold">Change password</h2>
          <form onSubmit={savePassword} className="space-y-4" noValidate>
            <TextField label="Current password" type="password" autoComplete="current-password" value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} error={pwErrors.current_password} required />
            <TextField label="New password" type="password" autoComplete="new-password" value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} error={pwErrors.password} hint="At least 8 characters, with letters and numbers." required />
            <TextField label="Confirm new password" type="password" autoComplete="new-password" value={pw.password_confirmation} onChange={(e) => setPw({ ...pw, password_confirmation: e.target.value })} required />
            <Button type="submit" loading={pwSaving}>Update password</Button>
          </form>
        </section>

        <section className="flex items-center justify-between gap-4 rounded-xl border border-line bg-surface p-5">
          <div>
            <h2 className="text-sm font-semibold">Appearance</h2>
            <p className="text-sm text-muted">Currently using {theme} mode.</p>
          </div>
          <Button variant="secondary" onClick={toggle}>
            {theme === 'dark' ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
            Switch to {theme === 'dark' ? 'light' : 'dark'}
          </Button>
        </section>
      </div>
    </>
  );
}
