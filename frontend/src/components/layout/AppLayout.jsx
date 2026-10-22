import { useCallback, useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Bell, FolderKanban, LayoutDashboard, ListChecks, LogOut, Moon, Sun, UserRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { getUnreadCount } from '../../api/misc';
import Avatar from '../ui/Avatar';

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/tasks', label: 'My tasks', icon: ListChecks },
  { to: '/notifications', label: 'Notifications', icon: Bell, badge: true },
];

export function Logo({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 font-bold tracking-tight ${className}`}>
      <span className="grid size-7 place-items-center rounded-lg bg-accent text-white dark:text-[#0e1016]">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </span>
      TaskFlow
    </span>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  const refreshUnread = useCallback(() => {
    getUnreadCount().then(setUnread).catch(() => {});
  }, []);

  useEffect(() => {
    refreshUnread();
    const id = setInterval(refreshUnread, 60000);
    window.addEventListener('notifications:changed', refreshUnread);
    return () => {
      clearInterval(id);
      window.removeEventListener('notifications:changed', refreshUnread);
    };
  }, [refreshUnread]);

  async function handleLogout() {
    await logout();
    toast.success('Signed out.');
    navigate('/login');
  }

  const ThemeIcon = theme === 'dark' ? Sun : Moon;
  const link = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isActive ? 'bg-white/10 text-white' : 'text-sidebar-ink hover:bg-white/5 hover:text-white'
    }`;

  return (
    <div className="min-h-dvh lg:pl-64">
      <a href="#main" className="sr-only z-[200] rounded bg-accent px-3 py-2 text-white focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-sidebar p-4 lg:flex">
        <Logo className="mb-8 mt-1 px-2 text-lg text-white" />
        <nav aria-label="Main" className="flex flex-1 flex-col gap-1">
          {nav.map(({ to, label, icon: Icon, end, badge }) => (
            <NavLink key={to} to={to} end={end} className={link}>
              <Icon className="size-[18px]" aria-hidden />
              {label}
              {badge && unread > 0 && (
                <span className="ml-auto rounded-full bg-accent px-1.5 py-0.5 text-[11px] font-semibold leading-none text-white dark:text-[#0e1016]" aria-label={`${unread} unread`}>
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 pt-4">
          <NavLink to="/profile" className={link}>
            <Avatar name={user.name} size="sm" />
            <span className="min-w-0 flex-1 truncate">{user.name}</span>
          </NavLink>
          <div className="mt-1 flex gap-1">
            <button onClick={toggle} className="flex flex-1 items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-ink hover:bg-white/5 hover:text-white">
              <ThemeIcon className="size-[18px]" aria-hidden />
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
            <button onClick={handleLogout} className="rounded-lg px-3 py-2 text-sidebar-ink hover:bg-white/5 hover:text-white" aria-label="Sign out" title="Sign out">
              <LogOut className="size-[18px]" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-surface px-4 lg:hidden">
        <Logo />
        <div className="flex items-center gap-1">
          <button onClick={toggle} className="rounded-lg p-2 text-muted hover:bg-sunken" aria-label="Toggle dark mode">
            <ThemeIcon className="size-5" />
          </button>
          <button onClick={handleLogout} className="rounded-lg p-2 text-muted hover:bg-sunken" aria-label="Sign out">
            <LogOut className="size-5" />
          </button>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">
        <Outlet context={{ refreshUnread }} />
      </main>

      {/* Mobile bottom navigation */}
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
        {[...nav, { to: '/profile', label: 'Profile', icon: UserRound }].map(({ to, label, icon: Icon, end, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${isActive ? 'text-accent' : 'text-muted'}`}
          >
            <Icon className="size-5" aria-hidden />
            {label === 'Notifications' ? 'Alerts' : label === 'My tasks' ? 'Tasks' : label}
            {badge && unread > 0 && <span className="absolute right-[28%] top-1.5 size-2 rounded-full bg-red-500" aria-label={`${unread} unread`} />}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
