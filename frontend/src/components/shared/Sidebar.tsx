'use client';

import React from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { FEATURES } from '@/config/features';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard', path: '/dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    label: 'Settings', path: '/settings',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <nav
        className={[
          'w-[200px] min-h-screen flex flex-col fixed left-0 top-0 z-50',
          'bg-[#0d1117]',
          'transition-transform duration-250 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        ].join(' ')}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-white/5">
          <div className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center bg-white/5 ring-1 ring-white/10">
            <Image src="/logo.png" alt="FlowDesk logo" width={36} height={36} className="w-full h-full object-cover" />
          </div>
          <span className="text-white text-base font-bold tracking-tight">FlowDesk</span>
        </div>

        {/* Navigation */}
        <div className="flex-1 py-3 px-2.5 flex flex-col gap-0.5">
          {navItems
            .filter(item => {
              if (item.path === '/create-team' && !FEATURES.CREATE_TEAM_PAGE) return false;
              if (item.path === '/settings') return false;
              return true;
            })
            .map((item) => {
              const isActive = pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => { router.push(item.path); onClose?.(); }}
                  className={`group relative w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 overflow-hidden
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

        {/* Bottom: Settings + User Profile */}
        <div className="px-2.5 pb-2 border-t border-white/5 pt-2">
          {(() => {
            const settings = navItems.find(i => i.path === '/settings')!;
            const isActive = pathname === settings.path;
            return (
              <button
                onClick={() => { router.push(settings.path); onClose?.(); }}
                className={`group relative w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 overflow-hidden
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
                <span className={isActive ? 'text-blue-400' : ''}>{settings.icon}</span>
                <span>{settings.label}</span>
              </button>
            );
          })()}
        </div>

        {/* User Profile */}
        <div className="px-3 py-3 border-t border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              SW
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-semibold truncate">Shreyas W.</div>
              <div className="text-white/40 text-[10px]">Team Lead</div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
