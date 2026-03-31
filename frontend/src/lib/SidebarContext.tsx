'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

interface SidebarCtx {
  isCollapsed: boolean;
  toggle: () => void;
  immediateToggle: () => void;
  isHoverOpen: boolean;
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
  forceCollapse: () => void;
}

const SidebarContext = createContext<SidebarCtx | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHoverOpen, setIsHoverOpen] = useState(false);
  const openTimeoutRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggle = useCallback(() => setIsCollapsed(v => !v), []);

  /** Click handler — clears all timers, closes hover state, toggles collapsed instantly */
  const immediateToggle = useCallback(() => {
    if (openTimeoutRef.current)  { clearTimeout(openTimeoutRef.current);  openTimeoutRef.current  = null; }
    if (closeTimeoutRef.current) { clearTimeout(closeTimeoutRef.current); closeTimeoutRef.current = null; }
    setIsHoverOpen(false);
    setIsCollapsed(v => !v);
  }, []);

  const handleMouseEnter = useCallback(() => {
    // Cancel any pending close
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    // Start delayed open — 0.5s
    if (!openTimeoutRef.current) {
      openTimeoutRef.current = setTimeout(() => {
        setIsHoverOpen(true);
        openTimeoutRef.current = null;
      }, 200);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    // Cancel any pending open
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }
    // Start delayed close — 0.5s
    closeTimeoutRef.current = setTimeout(() => {
      setIsHoverOpen(false);
      closeTimeoutRef.current = null;
    }, 1000);
  }, []);

  const forceCollapse = useCallback(() => {
    if (openTimeoutRef.current)  { clearTimeout(openTimeoutRef.current);  openTimeoutRef.current  = null; }
    if (closeTimeoutRef.current) { clearTimeout(closeTimeoutRef.current); closeTimeoutRef.current = null; }
    setIsHoverOpen(false);
    setIsCollapsed(true);
  }, []);

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggle, immediateToggle, isHoverOpen, handleMouseEnter, handleMouseLeave, forceCollapse }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar(): SidebarCtx {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used inside <SidebarProvider>');
  return ctx;
}
