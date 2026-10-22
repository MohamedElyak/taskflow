import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-accent text-white hover:bg-accent-hover dark:text-[#0e1016]',
  secondary: 'border border-line bg-surface text-ink hover:bg-sunken',
  ghost: 'text-muted hover:bg-sunken hover:text-ink',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  dangerGhost: 'border border-line bg-surface text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40',
};

const sizes = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
};

export default function Button({ variant = 'primary', size = 'md', loading = false, className = '', children, disabled, ...props }) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex shrink-0 items-center justify-center rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="spin size-4" aria-hidden />}
      {children}
    </button>
  );
}
