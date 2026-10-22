import { Link } from 'react-router-dom';
import { Archive } from 'lucide-react';
import { RoleBadge } from './ui/Badges';

export default function ProjectCard({ project }) {
  return (
    <Link to={`/projects/${project.id}`} className="group flex flex-col rounded-xl border border-line bg-surface p-4 transition-colors hover:border-accent/60">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold leading-snug group-hover:text-accent">{project.name}</h3>
        <RoleBadge role={project.my_role} />
      </div>
      <p className="mt-1 line-clamp-2 min-h-10 text-sm text-muted">{project.description || 'No description yet.'}</p>

      <div className="mt-4">
        <div className="mb-1.5 flex justify-between text-xs text-muted">
          <span>{project.done_tasks_count ?? 0} of {project.tasks_count ?? 0} tasks done</span>
          <span className="font-medium text-ink">{project.progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-sunken" role="progressbar" aria-label="Project progress" aria-valuenow={project.progress} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-accent" style={{ width: `${project.progress}%` }} />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-muted">
        <span>{project.members_count} {project.members_count === 1 ? 'member' : 'members'}</span>
        {project.archived && <span className="flex items-center gap-1"><Archive className="size-3.5" aria-hidden />Archived</span>}
      </div>
    </Link>
  );
}
