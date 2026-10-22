import { useId } from 'react';

const base =
  'w-full rounded-lg border bg-surface px-3 text-sm text-ink placeholder:text-muted/70 transition-colors disabled:opacity-60';

export const controlClass = (error) =>
  `${base} ${error ? 'border-red-500' : 'border-line hover:border-muted/50'}`;

/** Label + control + error text. `children` is a render function receiving the control props. */
export function Field({ label, error, hint, children, className = '' }) {
  const id = useId();
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      {children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy, className: controlClass(error) })}
      {error ? (
        <p id={`${id}-err`} className="mt-1.5 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function TextField({ label, error, hint, className, ...props }) {
  return (
    <Field label={label} error={error} hint={hint} className={className}>
      {(p) => <input {...p} {...props} className={`${p.className} h-10`} />}
    </Field>
  );
}

export function TextArea({ label, error, hint, className, rows = 4, ...props }) {
  return (
    <Field label={label} error={error} hint={hint} className={className}>
      {(p) => <textarea rows={rows} {...p} {...props} className={`${p.className} py-2`} />}
    </Field>
  );
}

export function SelectField({ label, error, hint, className, children, ...props }) {
  return (
    <Field label={label} error={error} hint={hint} className={className}>
      {(p) => (
        <select {...p} {...props} className={`${p.className} h-10`}>
          {children}
        </select>
      )}
    </Field>
  );
}

/** Compact select for filter bars (visually labelled via aria-label). */
export function FilterSelect({ label, className = '', children, ...props }) {
  return (
    <select
      aria-label={label}
      className={`h-10 rounded-lg border border-line bg-surface px-3 text-sm text-ink hover:border-muted/50 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
