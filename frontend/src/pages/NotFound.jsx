import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function NotFound() {
  useDocumentTitle('Page not found');
  return (
    <div className="grid min-h-[60dvh] place-items-center text-center">
      <div>
        <p className="text-6xl font-bold tracking-tight text-accent">404</p>
        <h1 className="mt-3 text-xl font-semibold">This page does not exist</h1>
        <p className="mt-1 text-sm text-muted">The link may be broken or the page may have moved.</p>
        <Link to="/" className="mt-6 inline-block"><Button>Back to dashboard</Button></Link>
      </div>
    </div>
  );
}
