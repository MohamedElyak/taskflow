import { initials } from '../../utils/format';

// Deterministic, readable colour per person (white text on a mid-dark tone).
function hue(name = '') {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

const sizes = { sm: 'size-6 text-[10px]', md: 'size-8 text-xs', lg: 'size-10 text-sm' };

export default function Avatar({ name, size = 'md', className = '' }) {
  return (
    <span
      title={name}
      aria-label={name}
      role="img"
      style={{ backgroundColor: `hsl(${hue(name)} 45% 38%)` }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${sizes[size]} ${className}`}
    >
      {initials(name)}
    </span>
  );
}

export function AvatarStack({ people = [], max = 3, size = 'sm' }) {
  if (!people.length) return null;
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;

  return (
    <div className="flex items-center -space-x-1.5">
      {shown.map((p) => (
        <Avatar key={p.id} name={p.name} size={size} className="ring-2 ring-surface" />
      ))}
      {extra > 0 && (
        <span className="z-0 inline-flex size-6 items-center justify-center rounded-full bg-sunken text-[10px] font-semibold text-muted ring-2 ring-surface">
          +{extra}
        </span>
      )}
    </div>
  );
}
