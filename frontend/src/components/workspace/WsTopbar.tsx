'use client';

import { useState, useEffect } from 'react';
import { useSearch } from '@/lib/search/SearchContext';

interface WsTopbarProps {
  title: string;
  subtitle?: string;
  projectId: string;
  projectName?: string;
  extraAction?: React.ReactNode;
}

export default function WsTopbar({ title, subtitle, projectName, extraAction }: WsTopbarProps) {
  const { openSearch } = useSearch();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-8 py-4">
      <div className="flex items-center justify-between gap-6">
        {/* Title */}
        <div className="flex-shrink-0">
          <h1 className="text-2xl font-bold text-slate-900">
            {title}
            {subtitle && <span className="text-slate-400 font-normal"> / {subtitle}</span>}
          </h1>
          {projectName && (
            <p className="text-xs text-slate-500 mt-0.5">
              Workspace: <span className="font-semibold text-blue-600">{projectName}</span>
            </p>
          )}
        </div>

        {/* Global Search — centered */}
        <div className="hidden md:flex flex-1 justify-center">
          <div
            onClick={mounted ? openSearch : undefined}
            role={mounted ? 'button' : undefined}
            tabIndex={mounted ? 0 : undefined}
            className={`relative w-full max-w-2xl text-left ${mounted ? 'cursor-pointer group' : ''}`}
            suppressHydrationWarning
          >
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div
              className="w-full pl-12 pr-20 py-2.5 bg-gradient-to-r from-slate-50 to-slate-50/80 border-2 border-slate-200 rounded-xl text-sm text-slate-400
                         shadow-sm hover:shadow-md hover:border-slate-300 hover:bg-white
                         group-hover:border-blue-400 group-hover:text-slate-600
                         transition-all duration-200 ease-in-out"
              suppressHydrationWarning
            >
              Search projects, teams, people…
            </div>
            {mounted && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded shadow-sm">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </div>
            )}
          </div>
        </div>

        {/* Extra Action slot */}
        {extraAction && <div className="flex-shrink-0">{extraAction}</div>}

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            className="relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors group"
            title="Notifications"
            onClick={() => alert('🔔 You have 3 new notifications!')}
          >
            <svg className="w-5 h-5 text-slate-600 group-hover:text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </div>
    </header>
  );
}
