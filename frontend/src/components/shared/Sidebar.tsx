'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { FEATURES } from '@/config/features';
import { useRbac } from '@/lib/RbacContext';
import { useSidebar } from '@/lib/SidebarContext';

/* ─────────────────────────────────────────────────────────────────────────────
   Jira-style sidebar
   ─ Expanded  (w-64): logo + labels + collapse-chevron in header
   ─ Collapsed: completely hidden on desktop (md:hidden)
              logo + toggle move into Topbar instead
   ─ No icon rail, no user profile section
   ───────────────────────────────────────────────────────────────────────── */

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard', path: '/dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    label: 'Create Project', path: '/create',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
      </svg>
    ),
  },
  {
    label: 'View', path: '/view',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
      </svg>
    ),
  },
  {
    label: 'Create Team', path: '/create-team',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/>
      </svg>
    ),
  },
  {
    label: 'Members', path: '/members',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    label: 'Settings', path: '/settings',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
  },
];

/* ── Chevron toggle icon (points left when expanded, right when collapsed) ── */
function CollapseIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { canManage, noProjects, loading: rbacLoading } = useRbac();
  const { isCollapsed, isHoverOpen, handleMouseEnter, handleMouseLeave } = useSidebar();
  // Sidebar is visible when explicitly opened (click) OR hovered open
  const isVisible = !isCollapsed || isHoverOpen;

  const filteredItems = navItems.filter(item => {
    if (item.path === '/create-team' && !FEATURES.CREATE_TEAM_PAGE) return false;
    if (item.path === '/settings') return false;
    if (!rbacLoading && !noProjects) {
      if (item.path === '/create' && !canManage) return false;
      if (item.path === '/create-team' && !canManage) return false;
      if (item.path === '/members' && !canManage) return false;
    }
    return true;
  });

  return (
    <>
      {/* ── Mobile overlay backdrop ── */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      {/* ── Sidebar panel ─────────────────────────────────────────────────── */}
      <nav
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={[
          // Base
          'flex flex-col flex-shrink-0 transition-all duration-500 ease-in-out',
          // Light background
          'bg-[#f4f5f7]',
          // Mobile: fixed drawer below navbar (z-40 < navbar z-50)
          'fixed left-0 top-0 z-40 h-screen w-64',
          // Desktop: in-flow when visible, fully hidden when not (clean, no icon rail)
          isVisible
            ? 'md:static md:z-auto md:h-full md:w-64 md:border-r md:border-slate-200'
            : 'md:hidden',
          // Subtle shadow when hover-opened from a collapsed-by-click state
          isHoverOpen && isCollapsed ? 'md:shadow-xl md:shadow-slate-300/40' : '',
          // Mobile slide
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        ].join(' ')}
      >
        {/* ── Navigation items — logo/hamburger are in Topbar ONLY ─────────── */}
        <div className="flex-1 py-3 px-2 flex flex-col gap-0.5 overflow-y-auto overflow-x-hidden">
          {filteredItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => { router.push(item.path); onClose?.(); }}
                title={item.label}
                className={[
                  'group relative w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900',
                ].join(' ')}
              >
                {/* Active left bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-blue-500 rounded-full" />
                )}

                {/* Icon */}
                <span className={`flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-700'}`}>
                  {item.icon}
                </span>

                {/* Label */}
                <span className="whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* User profile removed — lives in Topbar NavActions only */}
      </nav>
    </>
  );
}

