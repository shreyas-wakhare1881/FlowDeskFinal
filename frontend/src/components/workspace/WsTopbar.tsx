'use client';

import { useState, useEffect } from 'react';
import { useSearch } from '@/lib/search/SearchContext';
import NavActions from '@/components/shared/NavActions';

interface WsTopbarProps {
  title: string;
  subtitle?: string;
  projectId: string;
  projectName?: string;
  extraAction?: React.ReactNode;
  breadcrumb?: React.ReactNode;
}

export default function WsTopbar({ title, subtitle, projectName, extraAction, breadcrumb }: WsTopbarProps) {
  const { openSearch } = useSearch();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-6 py-3">
      <div className="flex items-center gap-4">

        {/* Left slot: breadcrumb OR title */}
        <div className="flex-shrink-0 min-w-0">
          {breadcrumb ? (
            <div className="flex items-center">{breadcrumb}</div>
          ) : (
            <>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                {title}
                {subtitle && <span className="text-slate-400 font-normal"> / {subtitle}</span>}
              </h1>
              {projectName && (
                <p className="text-xs text-slate-500 mt-0.5">
                  Workspace: <span className="font-semibold text-blue-600">{projectName}</span>
                </p>
              )}
            </>
          )}
        </div>

        {/* Global Search — centered, takes remaining space */}
        <div className="hidden md:flex flex-1 justify-center">
          <div
            onClick={mounted ? openSearch : undefined}
            role={mounted ? 'button' : undefined}
            tabIndex={mounted ? 0 : undefined}
            className={`relative w-full max-w-xl text-left ${mounted ? 'cursor-pointer group' : ''}`}
            suppressHydrationWarning
          >
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div
              className="w-full pl-10 pr-16 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-400
                         hover:border-blue-400 hover:bg-white group-hover:text-slate-600
                         transition-all duration-200 ease-in-out"
              suppressHydrationWarning
            >
              Search projects, teams, people…
            </div>
            {mounted && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded shadow-sm">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </div>
            )}
          </div>
        </div>

        {/* Extra Action slot */}
        {extraAction && <div className="flex-shrink-0">{extraAction}</div>}

        {/* Right-side actions */}
        <NavActions />
      </div>
    </header>
  );
}
