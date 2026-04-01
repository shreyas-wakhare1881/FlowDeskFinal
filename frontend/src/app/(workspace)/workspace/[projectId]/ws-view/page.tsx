'use client';

import { useState, useEffect } from 'react';
import type { ReactElement } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import WsSidebar from '@/components/workspace/WsSidebar';
import WsTopbar from '@/components/workspace/WsTopbar';
import BacklogView from '@/components/view/BacklogView';
import { useIssues } from '@/lib/IssuesContext';
import { useIssueModal } from '@/lib/IssueModalContext';
import type { Issue, IssueType, IssueStatus, IssuePriority } from '@/types/issue';

type ViewMode = 'kanban' | 'table' | 'progress' | 'backlog';

// ── SVG type icons (no emojis) ────────────────────────────────────────────────
const TypeIcon = ({ type }: { type: IssueType }) => {
  if (type === 'EPIC') return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  );
  if (type === 'STORY') return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  );
  if (type === 'BUG') return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2l1.88 1.88M14.12 3.88 16 2M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/>
      <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6z"/>
      <path d="M12 20v-9M6.53 9C4.6 8.8 3 5 3 5M6 13H2M3 21c0-2.1 1.7-3.9 3.8-4M20.97 5c0 2.1-1.6 3.8-3.5 4M22 13h-4M17.2 17c2.1.1 3.8 1.9 3.8 4"/>
    </svg>
  );
  // TASK
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  );
};

// ── Issue type display config ─────────────────────────────────────────────────
const TYPE_BADGE: Record<string, { pill: string }> = {
  EPIC:  { pill: 'bg-purple-100 text-purple-700' },
  STORY: { pill: 'bg-blue-100 text-blue-700'    },
  TASK:  { pill: 'bg-emerald-100 text-emerald-700' },
  BUG:   { pill: 'bg-rose-100 text-rose-700'    },
};

const STATUS_MAP: Record<IssueStatus, { label: string; col: string }> = {
  TODO:        { label: 'To Do',       col: 'todo'        },
  IN_PROGRESS: { label: 'In Progress', col: 'in-progress' },
  DONE:        { label: 'Done',        col: 'done'        },
};

const PRIORITY_DOT: Record<IssuePriority, string> = {
  HIGH:   'bg-red-500',
  MEDIUM: 'bg-yellow-400',
  LOW:    'bg-blue-400',
};

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

// ─── Issue Kanban ─────────────────────────────────────────────────────────────

// Column SVG icons
const KanbanColumnIcon = ({ id }: { id: IssueStatus }) => {
  if (id === 'TODO') return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="12" x2="15" y2="12"/>
    </svg>
  );
  if (id === 'IN_PROGRESS') return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  );
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  );
};

// Single Kanban card — clicking opens Issue Detail Modal
function KanbanCard({ issue, onOpen }: { issue: Issue; onOpen: (id: string) => void }) {
  const tb = TYPE_BADGE[issue.type] ?? TYPE_BADGE.TASK;
  return (
    <div
      onClick={() => onOpen(issue.id)}
      className="bg-white rounded-xl p-3.5 border border-slate-100 hover:border-blue-200 hover:shadow-md cursor-pointer transition-all active:scale-[0.99]"
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${tb.pill}`}>
          <TypeIcon type={issue.type} />{issue.type}
        </span>
        <span className="text-[10px] font-mono text-slate-400">{issue.issueKey}</span>
      </div>
      <p className="text-sm font-semibold text-slate-900 mb-3 line-clamp-2">{issue.title}</p>
      <div className="flex items-center justify-between">
        {issue.assignee ? (
          <div
            className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-[9px] font-bold"
            title={issue.assignee.name}
          >
            {getInitials(issue.assignee.name)}
          </div>
        ) : (
          <div className="w-6 h-6 rounded-md border-2 border-dashed border-slate-200" title="Unassigned" />
        )}
        <span className={`w-2 h-2 rounded-full ${PRIORITY_DOT[issue.priority]}`} title={issue.priority} />
      </div>
    </div>
  );
}

// Grouped parent card with expandable children (all in same column)
function KanbanGroupCard({
  parent,
  children,
  onOpen,
}: {
  parent: Issue;
  children: Issue[];
  onOpen: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
      {/* Parent card */}
      <div
        onClick={() => onOpen(parent.id)}
        className="p-3.5 hover:bg-slate-50 cursor-pointer transition-colors"
      >
        <div className="flex items-center justify-between mb-2">
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${(TYPE_BADGE[parent.type] ?? TYPE_BADGE.TASK).pill}`}>
            <TypeIcon type={parent.type} />{parent.type}
          </span>
          <span className="text-[10px] font-mono text-slate-400">{parent.issueKey}</span>
        </div>
        <p className="text-sm font-semibold text-slate-900 mb-2 line-clamp-2">{parent.title}</p>
        <div className="flex items-center justify-between">
          {parent.assignee ? (
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-[9px] font-bold" title={parent.assignee.name}>
              {getInitials(parent.assignee.name)}
            </div>
          ) : (
            <div className="w-6 h-6 rounded-md border-2 border-dashed border-slate-200" title="Unassigned" />
          )}
          <span className={`w-2 h-2 rounded-full ${PRIORITY_DOT[parent.priority]}`} title={parent.priority} />
        </div>
      </div>

      {/* Children toggle */}
      <div
        className="flex items-center gap-1.5 px-3.5 py-2 border-t border-slate-100 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
        onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
      >
        <svg
          width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"
          className={`text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
        >
          <polyline points="3 2 9 6 3 10"/>
        </svg>
        <span className="text-[10px] text-slate-500 font-semibold">
          {children.length} child issue{children.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Children list */}
      {expanded && (
        <div className="border-t border-slate-100 divide-y divide-slate-50">
          {children.map((child) => (
            <div
              key={child.id}
              onClick={() => onOpen(child.id)}
              className="flex items-center gap-2 px-3.5 py-2.5 hover:bg-blue-50/50 cursor-pointer transition-colors"
            >
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 ${(TYPE_BADGE[child.type] ?? TYPE_BADGE.TASK).pill}`}>
                <TypeIcon type={child.type} />
              </span>
              <span className="text-[10px] font-mono text-slate-400 flex-shrink-0 w-20 truncate">{child.issueKey}</span>
              <span className="text-xs text-slate-700 flex-1 truncate">{child.title}</span>
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[child.priority]}`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function IssueKanbanBoard({ issues, onOpenIssue }: { issues: Issue[]; onOpenIssue: (id: string) => void }) {
  const columns: { id: IssueStatus; label: string; color: string }[] = [
    { id: 'TODO',        label: 'To Do',       color: 'border-slate-300 bg-slate-50'  },
    { id: 'IN_PROGRESS', label: 'In Progress',  color: 'border-blue-300 bg-blue-50'   },
    { id: 'DONE',        label: 'Done',         color: 'border-green-300 bg-green-50' },
  ];

  // Build a map of issueId → issue for quick parent lookup
  const issueMap = new Map(issues.map((i) => [i.id, i]));

  return (
    <div className="grid grid-cols-3 gap-4">
      {columns.map((col) => {
        const colIssues = issues.filter((i) => i.status === col.id);
        const colIds = new Set(colIssues.map((i) => i.id));

        // Determine root issues in this column:
        // - parentId is null, OR
        // - parent is NOT in this column (different status → treat as standalone root)
        const rootIssues = colIssues.filter(
          (i) => !i.parentId || !colIds.has(i.parentId),
        );

        // Children that ARE in this same column
        const childrenInCol = (parentId: string) =>
          colIssues.filter((i) => i.parentId === parentId);

        return (
          <div key={col.id} className={`rounded-2xl border-2 ${col.color} p-4 min-h-[400px]`}>
            {/* Column header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-800">
                <KanbanColumnIcon id={col.id} />
                <span>{col.label}</span>
              </div>
              <span className="bg-white text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full border border-slate-200">
                {colIssues.length}
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-3">
              {colIssues.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-8">No issues</p>
              )}
              {rootIssues.map((issue) => {
                const kids = childrenInCol(issue.id);
                if (kids.length > 0) {
                  return (
                    <KanbanGroupCard
                      key={issue.id}
                      parent={issue}
                      children={kids}
                      onOpen={onOpenIssue}
                    />
                  );
                }
                return (
                  <KanbanCard
                    key={issue.id}
                    issue={issue}
                    onOpen={onOpenIssue}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Issue Table ──────────────────────────────────────────────────────────────

function IssueTableView({ issues, onOpenIssue }: { issues: Issue[]; onOpenIssue: (id: string) => void }) {
  if (issues.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400 text-sm">
        No issues yet — create one from the sidebar.
      </div>
    );
  }
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            {['Type', 'Key', 'Title', 'Assignee', 'Priority', 'Status'].map((h) => (
              <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {issues.map((issue) => {
            const tb = TYPE_BADGE[issue.type] ?? TYPE_BADGE.TASK;
            return (
              <tr key={issue.id} onClick={() => onOpenIssue(issue.id)} className="hover:bg-slate-50 transition-colors cursor-pointer">
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${tb.pill}`}>
                    <TypeIcon type={issue.type} /> {issue.type}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-xs font-mono text-slate-400">{issue.issueKey}</td>
                <td className="px-5 py-3.5">
                  <span className="text-sm font-semibold text-slate-900 line-clamp-1">{issue.title}</span>
                  {issue.description && (
                    <span className="text-xs text-slate-400 line-clamp-1">{issue.description}</span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  {issue.assignee ? (
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                        {getInitials(issue.assignee.name)}
                      </div>
                      <span className="text-xs text-slate-700 font-medium">{issue.assignee.name}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">Unassigned</span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${PRIORITY_DOT[issue.priority]}`} />
                    <span className="text-xs font-semibold text-slate-600">{issue.priority}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    issue.status === 'TODO' ? 'bg-slate-100 text-slate-600' :
                    issue.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {STATUS_MAP[issue.status].label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Progress View ────────────────────────────────────────────────────────────

function IssueProgressView({ issues, onOpenIssue }: { issues: Issue[]; onOpenIssue: (id: string) => void }) {
  const total = issues.length;
  const done = issues.filter((i) => i.status === 'DONE').length;
  const inProg = issues.filter((i) => i.status === 'IN_PROGRESS').length;
  const todo = issues.filter((i) => i.status === 'TODO').length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const breakdown = [
    { label: 'Done',        count: done,   color: '#10b981', pct: total > 0 ? Math.round((done / total) * 100) : 0 },
    { label: 'In Progress', count: inProg, color: '#3b82f6', pct: total > 0 ? Math.round((inProg / total) * 100) : 0 },
    { label: 'To Do',       count: todo,   color: '#94a3b8', pct: total > 0 ? Math.round((todo / total) * 100) : 0 },
  ];

  if (total === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400 text-sm">
        No issues to show progress for.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-5">
      <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col items-center justify-center">
        <h3 className="text-base font-bold text-slate-900 mb-6 self-start">Issue Progress</h3>
        <div className="relative w-36 h-36 mb-4">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="12" />
            <circle
              cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="12"
              strokeDasharray={`${pct * 2.51} 251`} strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-slate-900">{pct}%</span>
            <span className="text-xs text-slate-400">Done</span>
          </div>
        </div>
        <p className="text-sm text-slate-500">{done} of {total} issues done</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="text-base font-bold text-slate-900 mb-5">Status Breakdown</h3>
        <div className="space-y-4">
          {breakdown.map((s) => (
            <div key={s.label}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-medium text-slate-700">{s.label}</span>
                <span className="font-bold text-slate-900">{s.count} <span className="text-slate-400 font-normal">({s.pct}%)</span></span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${s.pct}%`, backgroundColor: s.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="col-span-2 bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="text-base font-bold text-slate-900 mb-5">All Issues</h3>
        <div className="space-y-2">
          {issues.map((issue) => {
            const tb = TYPE_BADGE[issue.type] ?? TYPE_BADGE.TASK;
            return (
              <div key={issue.id} onClick={() => onOpenIssue(issue.id)} className="flex items-center gap-4 cursor-pointer hover:bg-slate-50 rounded-lg px-2 py-1 transition-colors">
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 ${tb.pill}`}>
                  <TypeIcon type={issue.type} />
                </span>
                <span className="text-xs font-mono text-slate-400 w-20 flex-shrink-0">{issue.issueKey}</span>
                <span className="text-sm text-slate-700 font-medium flex-1 truncate">{issue.title}</span>
                {issue.assignee && (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                    {getInitials(issue.assignee.name)}
                  </div>
                )}
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                  issue.status === 'TODO' ? 'bg-slate-100 text-slate-600' :
                  issue.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {STATUS_MAP[issue.status].label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WsViewPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = params.projectId as string;

  const { allIssues, flatIssues, loading, fetchIssueDetail } = useIssues();
  const { openCreateIssue } = useIssueModal();

  // Read ?tab= from URL, default to 'kanban'
  const tabParam = searchParams.get('tab') as ViewMode | null;
  const [activeView, setActiveView] = useState<ViewMode>(tabParam ?? 'kanban');

  // Sync tab state if URL changes (e.g. sidebar Backlog link)
  useEffect(() => {
    if (tabParam && tabParam !== activeView) setActiveView(tabParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabParam]);

  const switchView = (v: ViewMode) => {
    setActiveView(v);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', v);
    router.replace(url.pathname + url.search, { scroll: false });
  };

  // Open the issue detail modal for any issue card click
  const handleOpenIssue = (issueId: string) => {
    fetchIssueDetail(issueId, projectId);
  };

  // Use allIssues for Kanban/Table/Progress (includes orphans fully)
  // flatIssues = tree-derived; allIssues = flat from /api/issues endpoint
  const displayIssues = allIssues.length > 0 ? allIssues : flatIssues;

  const views: { id: ViewMode; label: string; icon: ReactElement }[] = [
    {
      id: 'backlog', label: 'Backlog', icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
          <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
        </svg>
      ),
    },
    {
      id: 'kanban', label: 'Board', icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="12" rx="1"/>
        </svg>
      ),
    },
    {
      id: 'table', label: 'List', icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      ),
    },
    {
      id: 'progress', label: 'Progress', icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 20V10M12 20V4M6 20v-6"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <WsSidebar projectId={projectId} projectName={projectId} />

      <div className="flex-1 flex flex-col overflow-hidden ml-[220px]">
        <WsTopbar
          title="Issue View"
          subtitle="Backlog · Board · List · Progress"
          projectId={projectId}
          extraAction={
            <button
              onClick={() => openCreateIssue('TASK')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-blue-500/25"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Create Issue
            </button>
          }
        />

        <main className="flex-1 overflow-auto pt-6 px-8 pb-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                  <rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="12" rx="1"/>
                </svg>
                Issue View
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {loading ? 'Loading…' : `${displayIssues.length} issue${displayIssues.length !== 1 ? 's' : ''} · Backlog, Board, List, Progress`}
              </p>
            </div>
            {/* View Switcher */}
            <div className="flex bg-white rounded-xl border border-slate-200 p-1 gap-1">
              {views.map((v) => (
                <button
                  key={v.id}
                  onClick={() => switchView(v.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeView === v.id
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {v.icon} {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Views */}
          {activeView === 'backlog'  && <BacklogView />}
          {activeView === 'kanban'   && <IssueKanbanBoard issues={displayIssues} onOpenIssue={handleOpenIssue} />}
          {activeView === 'table'    && <IssueTableView issues={displayIssues} onOpenIssue={handleOpenIssue} />}
          {activeView === 'progress' && <IssueProgressView issues={displayIssues} onOpenIssue={handleOpenIssue} />}
        </main>
      </div>
    </div>
  );
}
