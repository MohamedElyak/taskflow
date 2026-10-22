import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * Accessible modal built on the native <dialog> element: focus is trapped,
 * Esc closes it and focus returns to the trigger automatically.
 */
export default function Modal({ open, onClose, title, children, variant = 'center', size = 'md', footer }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  if (!open) return <dialog ref={ref} />;

  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };
  const isDrawer = variant === 'drawer';

  return (
    <dialog
      ref={ref}
      aria-labelledby="modal-title"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className={
        isDrawer
          ? 'dialog-drawer ml-auto h-dvh w-full max-w-xl'
          : 'dialog-center m-auto w-[calc(100%-2rem)] ' + widths[size]
      }
    >
      <div
        className={`flex flex-col border-line bg-surface shadow-2xl ${
          isDrawer ? 'h-dvh border-l' : 'max-h-[calc(100dvh-2rem)] rounded-xl border'
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <h2 id="modal-title" className="text-lg font-semibold leading-tight">
            {title}
          </h2>
          <button onClick={onClose} className="-m-1 rounded-md p-1 text-muted hover:bg-sunken" aria-label="Close dialog">
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </dialog>
  );
}
