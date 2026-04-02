'use client';

import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';

interface WsSidebarProps {
  projectId: string;
  projectName?: string; // kept for backward-compat but no longer displayed
}

// ── SVG icon helpers ──────────────────────────────────────────────────────────
const IconDashboard = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
);

const IconView = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

const IconChevronLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

// ── Nav item builder ──────────────────────────────────────────────────────────
const wsNavItems = [
  { label: 'Summary',  slug: 'ws-dashboard', icon: <IconDashboard /> },
  { label: 'Insights', slug: 'ws-view',      icon: <IconView />      },
];

// ── Nav button shared styles ──────────────────────────────────────────────────
function NavButton({
  isActive,
  onClick,
  icon,
  label,
}: {
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'group relative w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 overflow-hidden',
        isActive
          ? 'bg-blue-50 text-blue-700'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
      ].join(' ')}
    >
      {/* Active left accent bar */}
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-blue-500 rounded-full" />
      )}
      {/* Hover underline when inactive */}
      {!isActive && (
        <span className="absolute bottom-0 left-0 h-[2px] w-full bg-blue-400 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-200" />
      )}
      <span className={isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}>
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}

export default function WsSidebar({ projectId }: WsSidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();

  const basePath = `/workspace/${projectId}`;

  return (
    /*
      Design: matches the dashboard's light sidebar (#f4f5f7 bg, slate text)
      instead of the dark navy used previously.
    */
    <nav className="w-[220px] min-h-screen bg-[#f4f5f7] border-r border-slate-200 flex flex-col fixed left-0 top-0 z-50">

      {/* ── Brand ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-slate-200 flex-shrink-0">
        <div className="w-7 h-7 rounded-md overflow-hidden ring-1 ring-slate-200 flex-shrink-0">
          <Image
            src="/logo.png"
            alt="FlowDesk logo"
            width={28}
            height={28}
            className="w-full h-full object-cover"
          />
        </div>
        <span className="text-slate-800 text-sm font-bold tracking-tight">FlowDesk</span>
      </div>

      {/* ── Back to Projects (replaces "Global View" + "Workspace" badge) ── */}
      <div className="px-3 pt-3 pb-2">
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-all group border border-slate-200 bg-white"
        >
          <span className="text-slate-400 group-hover:text-slate-700 transition-colors">
            <IconChevronLeft />
          </span>
          <span>Dashboard</span>
        </button>

      </div>

      {/* ── Navigation ────────────────────────────────────────────────────── */}
      <div className="flex-1 py-1 px-3 flex flex-col gap-0.5 overflow-y-auto overflow-x-hidden">

        {/* Standard nav items */}
        {wsNavItems.map((item) => {
          const path     = `${basePath}/${item.slug}`;
          const isActive = pathname === path || pathname.startsWith(path + '?');
          return (
            <NavButton
              key={item.slug}
              isActive={isActive}
              onClick={() => router.push(path)}
              icon={item.icon}
              label={item.label}
            />
          );
        })}</div>
    </nav>
  );
}
