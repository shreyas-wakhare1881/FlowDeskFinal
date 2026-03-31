'use client';

import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { usePermissions } from '@/lib/hooks/usePermissions';

interface WsSidebarProps {
  projectId: string;
  projectName?: string;
}

const wsNavItems = [
  {
    label: 'Dashboard', slug: 'ws-dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    label: 'Create Task', slug: 'ws-create-task',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
      </svg>
    ),
  },
  {
    label: 'View', slug: 'ws-view',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
      </svg>
    ),
  },
];

export default function WsSidebar({ projectId, projectName }: WsSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const currentUser = useCurrentUser();
  // Fetch project-scoped permissions to gate workspace nav items
  const { permissions, loading: permLoading } = usePermissions(projectId);

  const basePath = `/workspace/${projectId}`;

  return (
    <nav className="w-[220px] min-h-screen bg-[#0d1117] flex flex-col fixed left-0 top-0 z-50">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
        <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center bg-white/5 ring-1 ring-white/10">
          <Image src="/logo.png" alt="FlowDesk logo" width={40} height={40} className="w-full h-full object-cover" />
        </div>
        <span className="text-white text-base font-bold tracking-tight">FlowDesk</span>
      </div>

      {/* Workspace Badge */}
      <div className="px-4 py-3 border-b border-white/5">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
          <div className="text-blue-400 text-[10px] font-semibold uppercase tracking-widest">
            Workspace
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-3 px-3 flex flex-col gap-0.5">
        {wsNavItems
          .filter((item) => {
            // Hide 'Create Task' nav entry for roles that lack CREATE_TASK permission.
            // While loading we keep it visible to avoid layout flicker.
            if (
              item.slug === 'ws-create-task' &&
              !permLoading &&
              !permissions.includes('CREATE_TASK')
            ) return false;
            return true;
          })
          .map((item) => {
          const path = `${basePath}/${item.slug}`;
          const isActive = pathname === path;
          return (
            <button
              key={item.slug}
              onClick={() => router.push(path)}
              className={`group relative w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 overflow-hidden
                ${isActive
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-blue-400 rounded-full" />
              )}
              {!isActive && (
                <span className="absolute bottom-0 left-0 h-[2px] w-full bg-blue-400 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-250" />
              )}
              <span className={isActive ? 'text-blue-400' : ''}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}


      </div>

      {/* Bottom */}
      <div className="p-4 border-t border-white/5 flex flex-col gap-3">
        {/* Back to Global View */}
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-white/50 border border-white/8 hover:bg-white/5 hover:text-white/80 transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          <span>Global View</span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 px-1">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {currentUser.initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-semibold truncate">{currentUser.shortName}</div>
            <div className="text-white/40 text-[10px]">{currentUser.email || 'Team Lead'}</div>
          </div>
        </div>
      </div>
    </nav>
  );
}
