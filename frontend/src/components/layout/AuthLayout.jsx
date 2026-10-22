import { Logo } from './AppLayout';
import useDocumentTitle from '../../hooks/useDocumentTitle';

export default function AuthLayout({ title, subtitle, children, footer }) {
  useDocumentTitle(title);

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="flex flex-col justify-center px-6 py-10 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <Logo className="mb-10 text-xl" />
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-sm text-muted">{footer}</div>}
        </div>
      </div>

      <aside className="relative hidden overflow-hidden bg-sidebar p-14 text-white lg:flex lg:flex-col lg:justify-end" aria-hidden>
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
        <div className="relative flex gap-3">
          {['To Do', 'In Progress', 'In Review', 'Done'].map((c, i) => (
            <div key={c} className="flex-1 space-y-2 rounded-xl bg-white/5 p-3">
              <div className="mb-3 text-xs font-semibold text-white/60">{c}</div>
              {Array.from({ length: 3 - (i % 2) }).map((_, j) => (
                <div key={j} className="space-y-2 rounded-lg bg-white/10 p-3">
                  <div className="h-2 w-4/5 rounded bg-white/40" />
                  <div className="h-2 w-2/5 rounded bg-white/20" />
                </div>
              ))}
            </div>
          ))}
        </div>
        <p className="relative mt-12 max-w-md text-3xl font-bold leading-tight tracking-tight">
          Plan the work. Move it across the board. Ship it.
        </p>
        <p className="relative mt-3 max-w-md text-white/60">Projects, tasks and teammates in one calm workspace.</p>
      </aside>
    </div>
  );
}
