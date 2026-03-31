'use client';

import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Settings, LogOut, User, ShieldCheck } from 'lucide-react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { useRbac } from '@/lib/RbacContext';
import { authService } from '@/lib/auth.service';

// ── Notification items (placeholder — wire real data when notification system is built) ──
const MOCK_NOTIFICATIONS = [
  { id: '1', title: 'API Integration marked complete', time: '5m ago', unread: true },
  { id: '2', title: 'New comment on DB Schema Design', time: '22m ago', unread: true },
  { id: '3', title: 'Mobile UI Redesign is overdue', time: '1h ago', unread: false },
];

const ROLE_COLORS: Record<string, string> = {
  SuperAdmin: 'bg-purple-50 text-purple-700',
  Manager:    'bg-blue-50 text-blue-700',
  Developer:  'bg-emerald-50 text-emerald-700',
  Client:     'bg-amber-50 text-amber-700',
};

/**
 * NavActions — top-right actions bar shared between Topbar and WsTopbar.
 * Renders: [ Notifications ] [ Settings ] [ Profile ▾ ]
 */
export default function NavActions() {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const { role } = useRbac();

  // Which panel is open: 'profile' | 'notif' | null
  const [openPanel, setOpenPanel] = useState<'profile' | 'notif' | null>(null);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close panels on outside click
  useEffect(() => {
    if (!openPanel) return;
    function onOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        profileRef.current?.contains(target) ||
        notifRef.current?.contains(target)
      ) return;
      setOpenPanel(null);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [openPanel]);

  function togglePanel(panel: 'profile' | 'notif') {
    setOpenPanel(prev => (prev === panel ? null : panel));
  }

  function handleLogout() {
    authService.logout();
    router.push('/login');
  }

  const unreadCount = MOCK_NOTIFICATIONS.filter(n => n.unread).length;
  const roleColor = role ? (ROLE_COLORS[role] ?? 'bg-slate-100 text-slate-600') : '';

  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">

      {/* ── Notifications ──────────────────────────────────────────── */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={() => togglePanel('notif')}
          className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell className="w-[18px] h-[18px] text-slate-600" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex items-center justify-center min-w-[14px] h-[14px] text-[9px] font-bold leading-none bg-red-500 text-white rounded-full px-0.5">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Notification panel */}
        <div
          className={`absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 z-50 transition-all duration-150 origin-top-right
            ${openPanel === 'notif' ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}
        >
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="text-sm font-semibold text-slate-900">Notifications</span>
            {unreadCount > 0 && (
              <span className="text-xs font-medium text-blue-600">{unreadCount} unread</span>
            )}
          </div>

          {/* Items */}
          <ul className="divide-y divide-slate-50">
            {MOCK_NOTIFICATIONS.map(n => (
              <li key={n.id} className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer ${n.unread ? 'bg-blue-50/40' : ''}`}>
                <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${n.unread ? 'bg-blue-500' : 'bg-slate-200'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 leading-snug">{n.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{n.time}</p>
                </div>
              </li>
            ))}
          </ul>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-slate-100">
            <button className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
              View all notifications
            </button>
          </div>
        </div>
      </div>

      {/* ── Settings icon ──────────────────────────────────────────── */}
      <button
        onClick={() => router.push('/settings')}
        className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
        title="Settings"
        aria-label="Settings"
      >
        <Settings className="w-[18px] h-[18px] text-slate-600" />
      </button>

      {/* ── Profile avatar + dropdown ──────────────────────────────── */}
      <div className="relative" ref={profileRef}>
        <button
          onClick={() => togglePanel('profile')}
          className="flex items-center pl-1 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Open profile menu"
          aria-expanded={openPanel === 'profile'}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white ring-offset-1 ring-offset-slate-50 select-none">
            {currentUser.initials}
          </div>
        </button>

        {/* Profile dropdown */}
        <div
          className={`absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 z-50 transition-all duration-150 origin-top-right
            ${openPanel === 'profile' ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}
        >
          {/* User info block */}
          <div className="px-4 py-3.5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 select-none">
                {currentUser.initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 truncate leading-tight">{currentUser.name}</p>
                <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                {role && (
                  <span className={`inline-block mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${roleColor}`}>
                    <ShieldCheck className="inline w-2.5 h-2.5 mr-0.5 -mt-px" />
                    {role}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <button
              onClick={() => { router.push('/profile'); setOpenPanel(null); }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
            >
              <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
              View Profile
            </button>
            <button
              onClick={() => { router.push('/settings'); setOpenPanel(null); }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
            >
              <Settings className="w-4 h-4 text-slate-400 flex-shrink-0" />
              Account Settings
            </button>
          </div>

          <div className="border-t border-slate-100" />

          <div className="py-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              Log out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
