'use client';

import { ReactNode, useState, useEffect } from 'react';
import { useSearch } from '@/lib/search/SearchContext';

interface TopbarProps {
  title: string;
  subtitle?: string;
  onMenuToggle?: () => void;
  breadcrumb?: ReactNode;
}

export default function Topbar({ title, subtitle, onMenuToggle, breadcrumb }: TopbarProps) {
  const { openSearch } = useSearch();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering search after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleNotification = () => {
    alert('🔔 You have 5 new notifications!');
  };

  const handleUndo = () => {
    alert('↩️ Last action undone!');
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-5 py-2.5">
      <div className="flex items-center justify-between gap-4">

        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuToggle}
          className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0"
          aria-label="Open navigation"
        >
          <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Title or Breadcrumb */}
        <div className="flex-shrink-0">
          {breadcrumb ? (
            breadcrumb
          ) : (
            <h1 className="text-lg font-bold text-slate-900 leading-tight">
              {title}
              {subtitle && <span className="text-slate-400 font-normal text-sm"> / {subtitle}</span>}
            </h1>
          )}
        </div>

        {/* Search Bar — centered and wider */}
        <div className="hidden md:flex flex-1 justify-center">
          <div 
            onClick={mounted ? openSearch : undefined}
            role={mounted ? "button" : undefined}
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

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Mobile Search Button */}
          {mounted && (
            <button
              onClick={openSearch}
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors group"
              title="Search (⌘K)"
            >
              <svg className="w-4 h-4 text-slate-600 group-hover:text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          )}

          {/* Notifications */}
          <button
            onClick={handleNotification}
            className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors group"
            title="Notifications"
          >
            <svg className="w-4 h-4 text-slate-600 group-hover:text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
          </button>

          {/* Undo */}
          <button
            onClick={handleUndo}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors group"
            title="Undo last action"
          >
            <svg className="w-4 h-4 text-slate-600 group-hover:text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
