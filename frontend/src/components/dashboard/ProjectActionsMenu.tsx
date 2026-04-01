'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// ── SVG Icons (no emojis) ────────────────────────────────────────────────────

const AddPeopleIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <line x1="19" y1="8" x2="19" y2="14" />
    <line x1="22" y1="11" x2="16" y2="11" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const ArchiveIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="21 8 21 21 3 21 3 8" />
    <rect x="1" y="3" width="22" height="5" />
    <line x1="10" y1="12" x2="14" y2="12" />
  </svg>
);

const DeleteIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

// ── Props ────────────────────────────────────────────────────────────────────

interface ProjectActionsMenuProps {
  isOpen: boolean;
  /** DOMRect of the ⋮ button — used to position the portal menu. */
  anchorRect: DOMRect | null;
  onClose: () => void;
  onAddPeople: () => void;
  onSettings: () => void;
  onArchive: () => void;
  onDelete: () => void;
  canManage: boolean;    // Manager or SuperAdmin
  isSuperAdmin: boolean; // Only SuperAdmin can delete
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ProjectActionsMenu({
  isOpen,
  anchorRect,
  onClose,
  onAddPeople,
  onSettings,
  onArchive,
  onDelete,
  canManage,
  isSuperAdmin,
}: ProjectActionsMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  // Ensure we're client-side before calling createPortal
  useEffect(() => { setMounted(true); }, []);

  // Close on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    // Close on scroll so menu doesn't drift from button
    const handleScroll = () => onClose();

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !anchorRect || !mounted) return null;

  // Position: directly below + right-aligned with the ⋮ button
  const MENU_WIDTH = 192;
  const top  = anchorRect.bottom + 6;
  const left = Math.max(8, anchorRect.right - MENU_WIDTH);

  const itemBase: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '9px 14px',
    fontSize: '0.82rem',
    fontWeight: 500,
    color: '#374151',
    cursor: 'pointer',
    borderRadius: '7px',
    transition: 'background 0.13s ease, color 0.13s ease',
    border: 'none',
    background: 'transparent',
    width: '100%',
    textAlign: 'left' as const,
  };

  const menu = (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        zIndex: 9999,
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '10px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)',
        minWidth: `${MENU_WIDTH}px`,
        padding: '5px',
        transformOrigin: 'top right',
        animation: 'pam-scale-in 0.15s cubic-bezier(0.16,1,0.3,1) both',
      }}
    >
      <style>{`
        @keyframes pam-scale-in {
          from { opacity: 0; transform: scale(0.92) translateY(-4px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);     }
        }
        .pam-item:hover        { background: #f3f4f6 !important; }
        .pam-item-danger:hover { background: #fef2f2 !important; color: #dc2626 !important; }
        .pam-item-danger:hover svg { stroke: #dc2626 !important; }
      `}</style>

      {/* Add People — Manager + SuperAdmin */}
      {canManage && (
        <button
          className="pam-item"
          style={{ ...itemBase, color: '#1d4ed8' }}
          onClick={(e) => { e.stopPropagation(); onClose(); onAddPeople(); }}
        >
          <AddPeopleIcon />
          Add People
        </button>
      )}

      {/* Project Settings — Manager + SuperAdmin */}
      {canManage && (
        <button
          className="pam-item"
          style={itemBase}
          onClick={(e) => { e.stopPropagation(); onClose(); onSettings(); }}
        >
          <SettingsIcon />
          Project Settings
        </button>
      )}

      {/* Archive — Manager + SuperAdmin */}
      {canManage && (
        <button
          className="pam-item"
          style={itemBase}
          onClick={(e) => { e.stopPropagation(); onClose(); onArchive(); }}
        >
          <ArchiveIcon />
          Archive Project
        </button>
      )}

      {/* Separator before Delete */}
      {isSuperAdmin && (
        <div style={{ height: '1px', background: '#f3f4f6', margin: '4px 0' }} />
      )}

      {/* Delete — SuperAdmin only */}
      {isSuperAdmin && (
        <button
          className="pam-item pam-item-danger"
          style={{ ...itemBase, color: '#dc2626' }}
          onClick={(e) => { e.stopPropagation(); onClose(); onDelete(); }}
        >
          <DeleteIcon />
          Delete Project
        </button>
      )}
    </div>
  );

  // Render into document.body — bypasses ALL overflow:hidden / stacking context issues
  return createPortal(menu, document.body);
}
