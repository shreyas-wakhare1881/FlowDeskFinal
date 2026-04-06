'use client';

import { useState, useRef } from 'react';
import ProjectActionsMenu from './ProjectActionsMenu';

// ── Tag → Project emoji map ──────────────────────────────────────────────
const TAG_EMOJI: Record<string, string> = {
  backend: '🔌', api: '🔌', frontend: '🎨', mobile: '📱',
  database: '🗄️', schema: '🗄️', db: '🗄️', qa: '🧪', testing: '🧪',
  reporting: '📊', management: '📋', demo: '🖥️', client: '🤝',
  design: '🎨', security: '🔒', 'ui/ux': '🎨', performance: '⚡', sprint: '🏃',
  // common project keywords
  auth: '🔐', payment: '💳', dashboard: '📊', infra: '🏗️',
  devops: '⚙️', deploy: '🚀', release: '🚀', phase: '📌',
  chat: '💬', notification: '🔔', analytics: '📈', report: '📋',
};

// ── Name keyword → emoji fallback ────────────────────────────────────────
const NAME_KEYWORD_EMOJI: [string, string][] = [
  ['auth', '🔐'], ['login', '🔐'], ['payment', '💳'], ['dashboard', '📊'],
  ['mobile', '📱'], ['app', '📱'], ['api', '🔌'], ['backend', '🔌'],
  ['frontend', '🎨'], ['ui', '🎨'], ['design', '🎨'], ['database', '🗄️'],
  ['db', '🗄️'], ['schema', '🗄️'], ['test', '🧪'], ['qa', '🧪'],
  ['security', '🔒'], ['deploy', '🚀'], ['release', '🚀'], ['infra', '🏗️'],
  ['report', '📋'], ['analytics', '📈'], ['chat', '💬'], ['notification', '🔔'],
  ['demo', '🖥️'], ['client', '🤝'], ['sprint', '🏃'], ['fix', '🔧'],
  ['bug', '🐛'], ['feature', '✨'], ['setup', '⚙️'], ['config', '⚙️'],
];

function getProjectEmoji(tags?: string[], projectName?: string): string {
  // 1. Try tag-based match
  if (tags && tags.length > 0) {
    for (const tag of tags) {
      const key = tag.toLowerCase();
      if (TAG_EMOJI[key]) return TAG_EMOJI[key];
    }
  }
  // 2. Fallback: match project name keywords
  if (projectName) {
    const lower = projectName.toLowerCase();
    for (const [keyword, emoji] of NAME_KEYWORD_EMOJI) {
      if (lower.includes(keyword)) return emoji;
    }
  }
  return '📁';
}

// ── Priority config ──────────────────────────────────────────────────────
const PRIORITY_CONFIG: Record<string, {
  emoji: string; label: string;
  accent: string; chipBg: string; chipText: string;
}> = {
  Critical: {
    emoji: '🔴', label: 'Critical',
    accent:   'var(--pc-critical)',
    chipBg:   'transparent',
    chipText: 'var(--pc-critical)',
  },
  Medium: {
    emoji: '🟠', label: 'Medium',
    accent:   'var(--pc-medium)',
    chipBg:   'var(--pc-medium-light)',
    chipText: 'var(--pc-medium)',
  },
  Low: {
    emoji: '🔵', label: 'Low',
    accent:   'var(--pc-low)',
    chipBg:   'var(--pc-low-light)',
    chipText: 'var(--pc-low)',
  },
};

// ── SVG Icons ────────────────────────────────────────────────────────────
const CalendarIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8"  y1="2" x2="8"  y2="6" />
    <line x1="3"  y1="10" x2="21" y2="10" />
  </svg>
);
const ClockIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

// ── Interfaces ───────────────────────────────────────────────────────────
interface TeamMember { avatar: string; color: string; name: string; }
interface RbacMember { userId: string; name: string; email: string; roleName: string; }

// Deterministic avatar color from a string (name / userId)
const AVATAR_COLORS = ['#4361ee','#06d6a0','#f97316','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#3b82f6','#10b981','#ef4444'];
function avatarColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
function getInitials(name: string): string {
  return name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
}
interface ProjectCardProps {
  project: {
    projectID: string;
    projectName: string;
    projectDescription?: string;
    status: string;
    statusLabel: string;
    teamName: string;
    assigneeName: string;
    assigneeAvatar: string;
    assigneeColor: string;
    assignedDate: string;
    dueDate: string;
    priority: string;
    progress?: number;
    tasksTotal?: number;
    tasksCompleted?: number;
    teamMembers?: TeamMember[];
    tags?: string[];
    /** Live RBAC members — drives avatar row + member count badge */
    rbacMembers?: RbacMember[];
    /** Live issue count from the issues table */
    issueCount?: number;
    /** Current user's role in this project */
    userRole?: string;
  };
  onClick?: () => void;
  onInfoAction?: () => void;
  onAddPeople?: () => void;
  onSettings?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  canManage?: boolean;
  isSuperAdmin?: boolean;
}

/* ─────────────────────────────────────────────────────────────────────────
   renderPremiumProjectCard
   Clean & professional — no status badge, emoji-rich, breathing room.
   Left accent bar color = priority color (inline borderLeft override).
   ───────────────────────────────────────────────────────────────────────── */
function renderPremiumProjectCard({
  project, onClick, onInfoAction,
  onAddPeople, onSettings, onArchive, onDelete,
  canManage = false, isSuperAdmin = false,
}: ProjectCardProps) {
  const pCfg  = PRIORITY_CONFIG[project.priority] ?? PRIORITY_CONFIG['Low'];
  const emoji = getProjectEmoji(project.tags, project.projectName);
  // Menu state lives in the rendered JSX — we'll use a wrapper component
  return (
    <ProjectCardInner
      project={project} pCfg={pCfg} emoji={emoji}
      onClick={onClick} onInfoAction={onInfoAction}
      onAddPeople={onAddPeople} onSettings={onSettings}
      onArchive={onArchive} onDelete={onDelete}
      canManage={canManage} isSuperAdmin={isSuperAdmin}
    />
  );
}

/* Inner stateful component — holds menu open/close state */
function ProjectCardInner({
  project, pCfg, emoji,
  onClick, onInfoAction,
  onAddPeople, onSettings, onArchive, onDelete,
  canManage, isSuperAdmin,
}: ProjectCardProps & {
  pCfg: typeof PRIORITY_CONFIG[string];
  emoji: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const menuBtnRef = useRef<HTMLDivElement>(null);
  
  // RBAC: Show actions ONLY for Manager/SuperAdmin (global or per-project)
  const role = project.userRole?.toLowerCase();
  const isProjectManager = role === 'manager' || role === 'superadmin';
  const showActions = isProjectManager || isSuperAdmin;

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!menuOpen) {
      // Capture button position BEFORE opening
      const rect = menuBtnRef.current?.getBoundingClientRect() ?? null;
      setAnchorRect(rect);
    }
    setMenuOpen(o => !o);
  };

  return (
    <div
      className="pc-card"
      onClick={onClick}
      style={{ borderLeft: `4px solid ${pCfg.accent}`, position: 'relative' }}
    >
      {/* ── Actions ⋮ button — top-right, BEFORE info icon ─────────── */}
      <div
        ref={menuBtnRef}
        style={{ 
          position: 'absolute', 
          top: '12px', 
          right: onInfoAction ? '48px' : '12px', 
          zIndex: 20,
          visibility: showActions ? 'visible' : 'hidden', // UI Safety: Prevent layout shift
          pointerEvents: showActions ? 'auto' : 'none',
        }}
      >
        <div
          onClick={handleMenuToggle}
          title="More actions"
          style={{
            width: '28px', height: '28px', borderRadius: '50%',
            background: menuOpen ? 'var(--pc-hover-bg, #f3f4f6)' : 'transparent',
            border: '1.5px solid transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.18s ease',
          }}
          className="pc-actions-btn"
        >
          {/* Three-dot SVG */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"
            style={{ color: 'var(--pc-label-color, #6b7280)' }}>
            <circle cx="12" cy="5"  r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="12" cy="19" r="1.5" />
          </svg>
        </div>

        {/* Portal-rendered dropdown — lives outside pc-card, never clipped */}
        <ProjectActionsMenu
          isOpen={menuOpen}
          anchorRect={anchorRect}
          onClose={() => setMenuOpen(false)}
          onAddPeople={onAddPeople ?? (() => {})}
          onSettings={onSettings ?? (() => {})}
          onArchive={onArchive ?? (() => {})}
          onDelete={onDelete ?? (() => {})}
          canManage={!!(isProjectManager || canManage)}
          isSuperAdmin={!!isSuperAdmin}
        />
      </div>

      {/* Info Icon - top-right corner */}
      {onInfoAction && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onInfoAction();
          }}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'var(--pc-hover-bg)',
            border: '1.5px solid var(--pc-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            zIndex: 10,
          }}
          className="info-icon-hover"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: 'var(--pc-label-color)' }}
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </div>
      )}

      {/* ── Body: grows to fill card height ─────────────────────── */}
      <div style={{ flex: 1 }}>

        {/* ── Header: project emoji + title + description ── */}
        <div style={{ marginBottom: '4px' }}>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
            <span style={{
              fontSize: '20px',
              lineHeight: '1',
              marginTop: '1px',
              flexShrink: 0,
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.10))',
            }}>
              {emoji}
            </span>
            <h3 className="pc-title">{project.projectName}</h3>
          </div>

          {project.projectDescription && (
            <p style={{
              fontSize: '0.73rem',
              color: 'var(--pc-label-color)',
              lineHeight: '1.5',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical' as const,
              overflow: 'hidden',
              paddingLeft: '28px',
            }}>
              {project.projectDescription}
            </p>
          )}
        </div>

        {/* ── Divider ─────────────────────────────────────────────── */}
        <div className="pc-divider" />
        {/* ── Live Members Row + Issue Count ──────────────────────────────── */}
        {(() => {
          const members = project.rbacMembers ?? [];
          const MAX_SHOWN = 5;
          const shown     = members.slice(0, MAX_SHOWN);
          const overflow  = members.length - MAX_SHOWN;
          const issueCount = project.issueCount ?? 0;
          return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              {/* Avatar cluster */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0px' }}>
                {members.length === 0 ? (
                  <span style={{ fontSize: '0.72rem', color: 'var(--pc-label-color)' }}>No members yet</span>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {shown.map((m, i) => (
                        <div
                          key={m.userId}
                          title={`${m.name} • ${m.roleName}`}
                          style={{
                            width: '26px', height: '26px', borderRadius: '50%',
                            background: avatarColor(m.userId || m.name),
                            color: '#fff', fontSize: '0.65rem', fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '2px solid var(--pc-bg, #fff)',
                            marginLeft: i === 0 ? '0' : '-7px',
                            zIndex: MAX_SHOWN - i,
                            position: 'relative',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                            flexShrink: 0,
                          }}
                        >
                          {getInitials(m.name)}
                        </div>
                      ))}
                      {overflow > 0 && (
                        <div style={{
                          width: '26px', height: '26px', borderRadius: '50%',
                          background: 'var(--pc-hover-bg, #f3f4f6)',
                          color: 'var(--pc-label-color)', fontSize: '0.62rem', fontWeight: 700,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: '2px solid var(--pc-bg, #fff)',
                          marginLeft: '-7px',
                          position: 'relative',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                        }}>
                          +{overflow}
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: '0.70rem', color: 'var(--pc-label-color)', marginLeft: '7px', whiteSpace: 'nowrap' }}>
                      {members.length} member{members.length !== 1 ? 's' : ''}
                    </span>
                  </>
                )}
              </div>
              {/* Issue count badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--pc-label-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                </svg>
                <span style={{ fontSize: '0.70rem', color: 'var(--pc-label-color)', fontWeight: 500 }}>
                  {issueCount} issue{issueCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          );
        })()
        }
        {/* ── Team Row ──────────────────────────────────────────────── */}
        <div className="pc-info-row" style={{ marginBottom: 0 }}>
          <span className="pc-label"><span>👥</span> Team</span>
          <span className="pc-value">{project.teamName}</span>
        </div>

      </div>{/* /body */}

      {/* ── Footer: 3-column grid — always anchored at bottom ─────── */}
      <div className="pc-meta-grid">

        {/* Col 1 — Assigned Date */}
        <div className="pc-meta-col">
          <div className="pc-meta-icon-label">
            <CalendarIcon />
            <span className="pc-meta-label">Assigned</span>
          </div>
          <span className="pc-meta-value">{project.assignedDate}</span>
        </div>

        {/* Col 2 — Due Date */}
        <div className="pc-meta-col pc-meta-center">
          <div className="pc-meta-icon-label" style={{ justifyContent: 'center' }}>
            <ClockIcon />
            <span className="pc-meta-label">Due Date</span>
          </div>
          <span className="pc-meta-value">{project.dueDate}</span>
        </div>

        {/* Col 3 — Priority chip */}
        <div className="pc-meta-col pc-meta-right">
          <span className="pc-meta-label">🎯 Priority</span>
          <span style={{
            display:       'inline-flex',
            alignItems:    'center',
            gap:           '4px',
            padding:       '3px 9px',
            borderRadius:  '20px',
            background:    pCfg.chipBg,
            color:         pCfg.chipText,
            fontSize:      '0.74rem',
            fontWeight:    700,
            letterSpacing: '0.2px',
            whiteSpace:    'nowrap',
          }}>
            {pCfg.emoji} {pCfg.label}
          </span>
        </div>

      </div>
    </div>
  );
}

export default renderPremiumProjectCard;
