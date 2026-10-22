import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';

export default function Pagination({ meta, onPage }) {
  if (!meta || meta.last_page <= 1) return null;

  return (
    <nav aria-label="Pagination" className="mt-6 flex items-center justify-between text-sm">
      <p className="text-muted">Page {meta.current_page} of {meta.last_page} · {meta.total} total</p>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={meta.current_page <= 1} onClick={() => onPage(meta.current_page - 1)}>
          <ChevronLeft className="size-4" aria-hidden />Previous
        </Button>
        <Button variant="secondary" size="sm" disabled={meta.current_page >= meta.last_page} onClick={() => onPage(meta.current_page + 1)}>
          Next<ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>
    </nav>
  );
}
