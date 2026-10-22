import { CircleAlert, Loader2 } from 'lucide-react';
import Button from './Button';

export function Spinner({ className = 'size-5' }) {
  return <Loader2 className={`spin text-muted ${className}`} aria-hidden />;
}

export function PageLoader({ label = 'Loading…' }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-24 text-muted">
      <Spinner />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-line px-6 py-14 text-center">
      {Icon && (
        <div className="mb-4 rounded-full bg-sunken p-3 text-muted">
          <Icon className="size-6" aria-hidden />
        </div>
      )}
      <h3 className="font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div role="alert" className="flex flex-col items-center rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center dark:border-red-900/60 dark:bg-red-950/30">
      <CircleAlert className="mb-3 size-6 text-red-500" aria-hidden />
      <p className="max-w-md text-sm">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
