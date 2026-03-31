'use client';

import { ReactNode, useState, useEffect } from 'react';
import Image from 'next/image';
import { useSearch } from '@/lib/search/SearchContext';
import NavActions from '@/components/shared/NavActions';
import { useSidebar } from '@/lib/SidebarContext';

interface TopbarProps {
  title: string;
  subtitle?: string;
  onMenuToggle?: () => void;
  breadcrumb?: ReactNode;
}

export default function Topbar({ title, subtitle, onMenuToggle, breadcrumb }: TopbarProps) {
  const { openSearch } = useSearch();
  const { isCollapsed, toggle, immediateToggle, isHoverOpen, handleMouseEnter, handleMouseLeave } = useSidebar();
  // Sidebar visible = explicitly open (click) OR hover-opened
  const isSidebarVisible = !isCollapsed || isHoverOpen;
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering search after mount
  useEffect(() => {
    setMounted(true);
  }, []);


  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-4 h-14 flex items-center">
      <div className="flex items-center justify-between gap-4 w-full">

        {/* ── LEFT: Logo + Hamburger — always in navbar, swap-effect when sidebar open ── */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Desktop: logo left, hamburger right — container widens to w-64 when sidebar open */}
          <div
            className={[
              'hidden md:flex items-center transition-all duration-300 ease-in-out overflow-hidden',
              isSidebarVisible ? 'w-64 justify-between pr-1' : 'flex-row-reverse gap-2',
            ].join(' ')}
          >
            {/* Logo — always extreme left */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-7 h-7 rounded-md overflow-hidden ring-1 ring-slate-200 flex-shrink-0">
                <Image src="/logo.png" alt="FlowDesk" width={28} height={28} className="w-full h-full object-cover" />
              </div>
              <span className="text-slate-800 text-sm font-bold tracking-tight whitespace-nowrap">FlowDesk</span>
            </div>
            {/* Hamburger — right of logo (shifts to sidebar-right-edge when open) */}
            <button
              onClick={immediateToggle}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              title={isSidebarVisible ? 'Collapse sidebar' : 'Expand sidebar'}
              className="w-8 h-8 flex-shrink-0 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all duration-150"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Mobile: hamburger always visible */}
          <button
            onClick={onMenuToggle}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-md hover:bg-slate-100 transition-colors flex-shrink-0"
            aria-label="Open navigation"
          >
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* ── CENTRE-LEFT: Title or Breadcrumb ── */}
        <div className="flex-shrink-0">
          {breadcrumb ? (
            breadcrumb
          ) : title ? (
            <h1 className="text-base font-bold text-slate-900 leading-tight">
              {title}
              {subtitle && <span className="text-slate-400 font-normal text-sm"> / {subtitle}</span>}
            </h1>
          ) : null}
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

        {/* Right-side actions: mobile search + NavActions */}
        <div className="flex items-center gap-1 flex-shrink-0">
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
          <NavActions />
        </div>
      </div>
    </header>
  );
}
