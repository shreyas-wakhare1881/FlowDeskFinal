'use client';

import { useState, useEffect, useRef } from 'react';
import type { ReactElement } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import WsSidebar from '@/components/workspace/WsSidebar';
import WsTopbar from '@/components/workspace/WsTopbar';
import BacklogView from '@/components/view/BacklogView';
import AddPeopleModal from '@/components/dashboard/AddPeopleModal';
import { useIssues } from '@/lib/IssuesContext';
import { useIssueModal } from '@/lib/IssueModalContext';
import { issuesService } from '@/lib/issues.service';
import { boardColumnsService, type BoardColumn } from '@/lib/board-columns.service';
import { projectsService } from '@/lib/projects.service';
import { useAccordion } from '@/hooks/useAccordion';
import type { Issue, IssueType, IssueStatus, IssuePriority } from '@/types/issue';
import type { Project } from '@/types/project';

interface Member {
  userId: string;
  name: string;
  email: string;
  roleName: string;
}

type ViewMode = 'kanban' | 'table' | 'backlog' | 'progress';

// ── SVG type icons (no emojis) ────────────────────────────────────────────────
const TypeIcon = ({ type, size = 11, isIndependent = false }: { type: IssueType; size?: number; isIndependent?: boolean }) => {
  if (isIndependent) {
    return <img src="https://tse4.mm.bing.net/th/id/OIP.1_Qu4qrWeumZ0c9DPu0CIgHaHa?rs=1&pid=ImgDetMain&o=7&rm=3" alt="Independent" width={size} height={size} className="rounded-sm object-contain flex-shrink-0" />;
  }

  if (type === 'EPIC') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" />
    </svg>
  );
  if (type === 'STORY') return (
    <img src="https://tse4.mm.bing.net/th/id/OIP.ehz30q2xADBuD2WNATzh-QHaH_?rs=1&pid=ImgDetMain&o=7&rm=3" alt="Story" width={size} height={size} className="rounded-sm object-contain flex-shrink-0" />
  );
  if (type === 'BUG') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <circle cx="12" cy="12" r="11" />
      <circle cx="12" cy="12" r="4" fill="white" />
    </svg>
  );
  // TASK
  return (
    <img src="https://tse4.mm.bing.net/th/id/OIP.DlQQs_sZ0T6aSfq4E_HhZQHaHa?rs=1&pid=ImgDetMain&o=7&rm=3" alt="Task" width={size} height={size} className="rounded-sm object-contain flex-shrink-0" />
  );
};

// ── Issue type display config ─────────────────────────────────────────────────
const TYPE_BADGE: Record<string, { pill: string }> = {
  EPIC: { pill: 'bg-purple-100 text-purple-700' },
  STORY: { pill: 'bg-blue-100 text-blue-700' },
  TASK: { pill: 'bg-emerald-100 text-emerald-700' },
  BUG: { pill: 'bg-rose-100 text-rose-700' },
};

const STATUS_MAP: Record<IssueStatus, { label: string; col: string }> = {
  TODO: { label: 'To Do', col: 'todo' },
  IN_PROGRESS: { label: 'In Progress', col: 'in-progress' },
  DONE: { label: 'Done', col: 'done' },
};

const PRIORITY_DOT: Record<IssuePriority, string> = {
  HIGH: 'bg-red-500',
  MEDIUM: 'bg-yellow-400',
  LOW: 'bg-blue-400',
};

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

// ─── Issue Kanban ─────────────────────────────────────────────────────────────

// Column SVG icons — kept for reference in other parts of the app
const KanbanColumnIcon = ({ id }: { id: IssueStatus }) => {
  if (id === 'TODO') return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="9" y1="9" x2="15" y2="9" /><line x1="9" y1="12" x2="15" y2="12" />
    </svg>
  );
  if (id === 'IN_PROGRESS') return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _KanbanColumnIcon = KanbanColumnIcon; // suppress unused warning — kept for TS type compat

function HierarchicalChildItem({ issueId, allIssues, depth = 0, onOpen }: { issueId: string, allIssues: Issue[], depth?: number, onOpen: (id: string) => void }) {
  const issue = allIssues.find(i => i.id === issueId);
  const [expanded, setExpanded] = useState(false);

  if (!issue) return null;
  const children = allIssues.filter(i => i.parentId === issue.id);
  const hasChildren = children.length > 0;
  const cBadge = TYPE_BADGE[issue.type] ?? TYPE_BADGE.TASK;

  return (
    <div className="flex flex-col mb-1.5 flex-shrink-0">
      <div
        className="flex items-center gap-1.5 p-1 rounded hover:bg-slate-50 border border-transparent cursor-pointer transition-colors"
        style={{ paddingLeft: `${depth * 20}px` }}
        onClick={(e) => { e.stopPropagation(); onOpen(issue.id); }}
      >
        {hasChildren ? (
          <button
            className="flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded p-0.5 transition-colors flex-shrink-0"
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${expanded ? 'rotate-0' : '-rotate-90'}`}>
              <polyline points="2 4 6 8 10 4" />
            </svg>
          </button>
        ) : (
          <div className="w-[16px] flex-shrink-0" />
        )}

        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded flex-shrink-0 border ${cBadge.pill} border-current/10`}>
          <TypeIcon type={issue.type} size={10} />
          <span className="text-[10px] font-bold capitalize tracking-wide">{issue.type.toLowerCase()}</span>
        </span>
        <span className="text-[11px] font-mono text-slate-400 flex-shrink-0">{issue.issueKey}</span>
        <span className="text-[12px] font-bold text-slate-800 flex-1 truncate">{issue.title}</span>
      </div>

      {expanded && hasChildren && (
        <div className="flex flex-col mt-0.5">
          {children.map(child => (
            <HierarchicalChildItem key={child.id} issueId={child.id} allIssues={allIssues} depth={depth + 1} onOpen={onOpen} />
          ))}
        </div>
      )}
    </div>
  );
}

// Single Kanban card — clicking opens Issue Detail Modal
function KanbanCard({ issue, allIssues, onOpen, onDelete }: { issue: Issue; allIssues: Issue[]; onOpen: (id: string) => void; onDelete: (id: string) => void }) {
  const { isExpanded, toggleItem } = useAccordion();
  const tb = TYPE_BADGE[issue.type] ?? TYPE_BADGE.TASK;
  const expanded = isExpanded(issue.id);
  const children = allIssues.filter(i => i.parentId === issue.id);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);

  return (
    <div className="border border-slate-200 rounded-[3px] bg-white shadow-[0_1px_2px_rgba(9,30,66,0.15)] flex flex-col flex-shrink-0 group/card hover:bg-[#FAFBFC] hover:shadow-[0_2px_4px_rgba(9,30,66,0.2)] transition-colors">
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', issue.id);
          e.dataTransfer.effectAllowed = 'move';
        }}
        onClick={() => onOpen(issue.id)}
        className="p-3 cursor-pointer cursor-grab active:cursor-grabbing flex flex-col gap-[9px] relative"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-1.5 flex-1 min-w-0 pr-2">
            <div className={`mt-[2px] flex-shrink-0 ${issue.type === 'EPIC' ? 'text-[#904EE2]' : issue.type === 'STORY' ? 'text-[#65BA43]' : issue.type === 'BUG' ? 'text-[#E34935]' : 'text-[#4C9AFF]'}`}>
              <TypeIcon type={issue.type} size={14} isIndependent={!issue.parentId && issue.type !== 'EPIC'} />
            </div>
            <p className="text-[14px] text-[#172B4D] leading-snug break-words group-hover/card:underline decoration-[#172B4D]/60 hover:!decoration-[#172B4D]">
              {issue.title}
            </p>
            <div className="text-slate-400 opacity-0 group-hover/card:opacity-100 hover:text-slate-700 transition-opacity mt-[3px] flex-shrink-0" title="Edit">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </div>
          </div>
          <div className="relative">
            <button
              className="text-[#6B778C] hover:bg-[#EBECF0] rounded translate-y-[-2px] tracking-widest px-0.5 opacity-0 group-hover/card:opacity-100 transition-opacity flex-shrink-0 font-bold"
              onClick={(e) => {
                e.stopPropagation();
                if (isMenuOpen) {
                  setIsMenuOpen(false);
                  setMenuPos(null);
                  return;
                }
                const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                setIsMenuOpen(true);
              }}
            >
              •••
            </button>
            {isMenuOpen && menuPos && (
              <>
                <div
                  className="fixed inset-0 z-[9998] cursor-default"
                  onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); setMenuPos(null); }}
                />
                <div
                  className="fixed w-48 bg-white border border-[#DFE1E6] rounded-[3px] shadow-[0_4px_8px_rgba(9,30,66,0.15)] z-[9999] flex flex-col py-1.5 text-[14px] text-[#172B4D] font-normal"
                  style={{ top: menuPos.top, right: menuPos.right }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button className="flex items-center justify-between px-4 py-1.5 hover:bg-[#EBECF0] w-full text-left transition-colors cursor-pointer">
                    Move work item <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#6B778C]"><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
                  <button className="flex items-center justify-between px-4 py-1.5 hover:bg-[#EBECF0] w-full text-left transition-colors cursor-pointer">
                    Change status <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#6B778C]"><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
                  <div className="h-px bg-[#DFE1E6] my-1" />
                  <button className="px-4 py-1.5 hover:bg-[#EBECF0] w-full text-left transition-colors cursor-pointer">Copy link</button>
                  <button className="px-4 py-1.5 hover:bg-[#EBECF0] w-full text-left transition-colors cursor-pointer">Copy key</button>
                  <div className="h-px bg-[#DFE1E6] my-1" />
                  <button className="px-4 py-1.5 hover:bg-[#EBECF0] w-full text-left transition-colors cursor-pointer">Add flag</button>
                  <button className="px-4 py-1.5 hover:bg-[#EBECF0] w-full text-left transition-colors cursor-pointer">Add label</button>
                  <button className="px-4 py-1.5 hover:bg-[#EBECF0] w-full text-left transition-colors cursor-pointer">Link work item</button>
                  <button className="flex items-center justify-between px-4 py-1.5 hover:bg-[#EBECF0] w-full text-left transition-colors cursor-pointer">
                    Select cover <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#6B778C]"><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
                  <div className="h-px bg-[#DFE1E6] my-1" />
                  <button className="px-4 py-1.5 hover:bg-[#EBECF0] w-full text-left transition-colors cursor-pointer">Archive</button>
                  <button
                    className="px-4 py-1.5 hover:bg-red-50 text-red-600 w-full text-left transition-colors cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); setMenuPos(null); onDelete(issue.id); }}
                  >Delete</button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Due date (falls back to createdAt) — red text when overdue */}
        {(() => {
          const dateStr = issue.dueDate ?? issue.createdAt;
          const isOverdueDue = issue.dueDate && issue.status !== 'DONE' && new Date(issue.dueDate) < new Date();
          return (
            <div className={`flex items-center gap-1.5 px-1.5 py-[3px] border rounded-[3px] text-[12px] font-medium w-max shadow-sm mt-0.5 bg-white ${
              isOverdueDue ? 'border-red-300 text-red-600' : 'border-[#DFE1E6] text-[#42526E]'
            }`}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span title={issue.dueDate ? 'Due date' : 'Created'}>{new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          );
        })()}

        {/* ROW 3: Type icon, Key, priority, assignee */}
        <div className="flex items-center justify-between mt-0.5 pt-0.5">
          <div className="flex items-center gap-[7px] text-[12px] text-[#5E6C84] font-medium">
            <span className={issue.type === 'EPIC' ? 'text-[#904EE2]' : issue.type === 'STORY' ? 'text-[#65BA43]' : issue.type === 'BUG' ? 'text-[#E34935]' : 'text-[#4C9AFF]'}>
              <TypeIcon type={issue.type} size={15} isIndependent={!issue.parentId && issue.type !== 'EPIC'} />
            </span>
            <span className="hover:underline">{issue.issueKey}</span>
          </div>

          <div className="flex items-center gap-2">
            {issue.estimate && (
              <div className="bg-[#DFE1E6] text-[#172B4D] text-[11px] font-bold px-1.5 rounded-[3px] min-w-[20px] h-[20px] flex items-center justify-center" title="Estimate">
                {issue.estimate}
              </div>
            )}

            <div className="flex items-center justify-center -mx-0.5">
              {issue.priority === 'HIGH' && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF5630" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>
              )}
              {issue.priority === 'MEDIUM' && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFAB00" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="9" x2="18" y2="9" /><line x1="6" y1="15" x2="18" y2="15" /></svg>
              )}
              {issue.priority === 'LOW' && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0065FF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
              )}
            </div>

            {issue.assignee ? (
              <div
                className="w-[20px] h-[20px] rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-[0_1px_2px_rgba(0,0,0,0.15)] ml-0.5"
                style={{ backgroundColor: '#FF5630' }}
                title={issue.assignee.name}
              >
                {getInitials(issue.assignee.name)}
              </div>
            ) : (
              <div className="w-[20px] h-[20px] rounded-full border border-dashed border-[#DFE1E6] flex items-center justify-center bg-[#FAFBFC] ml-0.5" title="Unassigned">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#A5ADBA]">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>

      {children.length > 0 && (
        <>
          {/* Subtle bottom accordion toggle */}
          <div
            className={`flex items-center gap-1.5 px-3.5 py-1.5 border-t border-slate-100 bg-slate-50/50 cursor-pointer hover:bg-slate-100 transition-colors ${!expanded ? 'rounded-b-[3px]' : ''}`}
            onClick={(e) => { e.stopPropagation(); toggleItem(issue.id); }}
            title="Toggle child issues"
          >
            <svg
              width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"
              className={`text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            >
              <polyline points="2 4 6 8 10 4" />
            </svg>
            <span className="text-[10px] text-slate-500 font-semibold tracking-wide">
              {children.length} child issue{children.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Recursive Hierarchy view matching Ladder logic */}
          {expanded && (
            <div className="border-t border-slate-100 bg-white p-2.5 flex flex-col pt-3 rounded-b-[3px]" style={{ animation: 'kanbanAccordionSlide 0.15s ease-out' }}>
              {children.map((child) => (
                <HierarchicalChildItem key={child.id} issueId={child.id} allIssues={allIssues} onOpen={onOpen} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}


// ─── Dynamic Kanban Board ─────────────────────────────────────────────────────
// Fully dynamic: columns fetched from DB, no hardcoding.
// Features: create/rename/delete columns, drag-drop cards & columns, filter.

type KanbanFilter = 'all' | 'recently_updated' | 'assigned_to_me';

interface DeleteConfirm {
  column: BoardColumn;
  moveToColumnId: string | null; // null = leave unassigned (backlog)
}

function IssueKanbanBoard({
  issues,
  projectId,
  onOpenIssue,
  onAddIssue,
  onDropIssue,       // (issueId: string, columnId: string) => void
  onDeleteIssue,
  kanbanFilter,
}: {
  issues: Issue[];
  projectId: string;
  onOpenIssue: (id: string) => void;
  onAddIssue: () => void;
  onDropIssue: (issueId: string, columnId: string) => Promise<void>;
  onDeleteIssue: (id: string) => void;
  kanbanFilter: KanbanFilter;
}) {
  // ── Column state ────────────────────────────────────────────────────────────
  const [columns, setColumns]           = useState<BoardColumn[]>([]);
  const [colLoading, setColLoading]     = useState(true);
  const [colError, setColError]         = useState<string | null>(null);

  // ── Filtered issues state (backend-driven filter) ───────────────────────────
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>(issues);
  const [filterLoading, setFilterLoading]   = useState(false);

  // ── Optimistic column overrides on drag-drop ─────────────────────────────────
  const [localColOverrides, setLocalColOverrides] = useState<Record<string, string | null>>({});
  const [dropError, setDropError]                 = useState<string | null>(null);

  // ── Inline column name edit ──────────────────────────────────────────────────
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [editingName, setEditingName]   = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  // ── Column action menu ───────────────────────────────────────────────────────
  const [menuColId, setMenuColId] = useState<string | null>(null);
  const [menuPos, setMenuPos]     = useState<{ top: number; right: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // ── Create new column ────────────────────────────────────────────────────────
  const [creating, setCreating]         = useState(false);
  const [newColName, setNewColName]     = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const newColInputRef = useRef<HTMLInputElement>(null);

  // ── Delete confirmation ──────────────────────────────────────────────────────
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirm | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Column drag-to-reorder state ─────────────────────────────────────────────
  const [dragColId, setDragColId]         = useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);
  // distinguishes card-drags from column-drags
  const dragTypeRef = useRef<'card' | 'column'>('card');

  // ── Load columns ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!projectId) {
      setColumns([]);
      setColError('Missing projectId');
      setColLoading(false);
      return;
    }

    setColLoading(true);
    setColError(null);
    boardColumnsService.getAll(projectId)
      .then(setColumns)
      .catch(() => setColError('Failed to load board columns'))
      .finally(() => setColLoading(false));
  }, [projectId]);

  // ── Sync filtered issues with filter state ────────────────────────────────────
  useEffect(() => {
    if (kanbanFilter === 'all') {
      setFilteredIssues(issues);
      return;
    }
    setFilterLoading(true);
    issuesService.getKanban(projectId, kanbanFilter)
      .then(setFilteredIssues)
      .catch(() => setFilteredIssues(issues))
      .finally(() => setFilterLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kanbanFilter, projectId]);

  // Keep 'all' issues in sync with context updates (no stale closure)
  useEffect(() => {
    if (kanbanFilter === 'all') setFilteredIssues(issues);
  }, [issues, kanbanFilter]);

  // ── Close menus on outside click ──────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuColId(null);
        setMenuPos(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  // menuRef doesn't change so this is stable
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Focus new column input after create mode activates
  useEffect(() => {
    if (creating) setTimeout(() => newColInputRef.current?.focus(), 50);
  }, [creating]);

  // Focus inline edit input when editing starts
  useEffect(() => {
    if (editingColId) setTimeout(() => editInputRef.current?.focus(), 50);
  }, [editingColId]);

  // ── Issue grouping by columnId ────────────────────────────────────────────────
  const boardIssues = filteredIssues.filter(i => i.type !== 'EPIC');

  // Apply local optimistic overrides
  const issuesWithOverrides = boardIssues.map(i =>
    localColOverrides[i.id] !== undefined
      ? { ...i, columnId: localColOverrides[i.id] }
      : i,
  );

  function issuesForColumn(colId: string): Issue[] {
    return issuesWithOverrides.filter(i => i.columnId === colId);
  }

  // ── Card drag-drop (existing behavior — now uses columnId) ────────────────────
  const handleCardDrop = async (issueId: string, targetColumnId: string) => {
    const prevColumnId = issuesWithOverrides.find(i => i.id === issueId)?.columnId ?? null;
    if (prevColumnId === targetColumnId) return;

    setLocalColOverrides(prev => ({ ...prev, [issueId]: targetColumnId }));
    try {
      await onDropIssue(issueId, targetColumnId);
      setLocalColOverrides(prev => { const n = { ...prev }; delete n[issueId]; return n; });
    } catch {
      setLocalColOverrides(prev => ({ ...prev, [issueId]: prevColumnId }));
      setDropError('Failed to move issue. Please try again.');
      setTimeout(() => setDropError(null), 4000);
    }
  };

  // ── Column CRUD handlers ──────────────────────────────────────────────────────
  const handleCreateColumn = async () => {
    const name = newColName.trim();
    if (!name) { setCreating(false); setNewColName(''); return; }
    setCreateLoading(true);
    try {
      if (!projectId) return;
      const created = await boardColumnsService.create(projectId, name);
      setColumns(prev => [...prev, created].sort((a, b) => a.position - b.position));
      setCreating(false);
      setNewColName('');
    } catch {
      setDropError('Failed to create column.');
      setTimeout(() => setDropError(null), 4000);
    } finally {
      setCreateLoading(false);
    }
  };

  const startEdit = (col: BoardColumn) => {
    setMenuColId(null);
    setMenuPos(null);
    setEditingColId(col.id);
    setEditingName(col.name);
  };

  const handleRenameColumn = async (colId: string) => {
    const name = editingName.trim();
    setEditingColId(null);
    if (!name) return;
    const original = columns.find(c => c.id === colId);
    if (!original || original.name === name) return;

    setColumns(prev => prev.map(c => c.id === colId ? { ...c, name } : c));
    try {
      if (!projectId) return;
      await boardColumnsService.update(colId, projectId, { name });
    } catch {
      setColumns(prev => prev.map(c => c.id === colId ? { ...c, name: original.name } : c));
      setDropError('Failed to rename column.');
      setTimeout(() => setDropError(null), 4000);
    }
  };

  const initiateDelete = (col: BoardColumn) => {
    setMenuColId(null);
    setMenuPos(null);
    setDeleteConfirm({ column: col, moveToColumnId: null });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    try {
      if (!projectId) return;
      await boardColumnsService.delete(
        deleteConfirm.column.id,
        projectId,
        deleteConfirm.moveToColumnId ?? undefined,
      );
      setColumns(prev => prev.filter(c => c.id !== deleteConfirm.column.id));
      setDeleteConfirm(null);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Failed to delete column.';
      setDropError(msg);
      setTimeout(() => setDropError(null), 5000);
      setDeleteConfirm(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Column drag-to-reorder ────────────────────────────────────────────────────
  const handleColumnDragStart = (colId: string, e: React.DragEvent) => {
    e.stopPropagation();
    dragTypeRef.current = 'column';
    setDragColId(colId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('column-drag', colId);
  };

  const handleColumnDrop = async (targetColId: string, e: React.DragEvent) => {
    e.preventDefault();
    if (dragTypeRef.current !== 'column' || !dragColId || dragColId === targetColId) {
      setDragColId(null); setDragOverColId(null);
      return;
    }
    const reordered = [...columns];
    const fromIdx = reordered.findIndex(c => c.id === dragColId);
    const toIdx   = reordered.findIndex(c => c.id === targetColId);
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    const withPositions = reordered.map((c, idx) => ({ ...c, position: idx }));
    setColumns(withPositions);
    setDragColId(null); setDragOverColId(null);
    try {
      if (!projectId) return;
      await boardColumnsService.reorder(projectId, withPositions.map(c => ({ id: c.id, position: c.position })));
    } catch {
      // Reload columns from server on failure
      boardColumnsService.getAll(projectId).then(setColumns).catch(() => {});
      setDropError('Failed to reorder columns.');
      setTimeout(() => setDropError(null), 4000);
    }
  };

  // ── Loading / error states ────────────────────────────────────────────────────
  if (colLoading) {
    return (
      <div className="flex gap-3 overflow-x-hidden pb-4 items-start w-full">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex-1 min-w-0 max-w-[300px] bg-white rounded-[6px] shadow-sm p-4 animate-pulse">
            <div className="h-5 bg-slate-200 rounded w-1/2 mb-4" />
            {[1, 2].map(j => <div key={j} className="h-24 bg-white rounded-lg border border-slate-100 mb-3" />)}
          </div>
        ))}
      </div>
    );
  }

  if (colError) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-red-500 text-sm font-semibold">{colError}</p>
      </div>
    );
  }

  // Dynamic sizing + scroll threshold
  // - Up to 5 columns: compress to fit (no horizontal scroll)
  // - >5 columns: allow horizontal scroll
  const enableHorizontalScroll = columns.length > 5;
  const columnSizing = enableHorizontalScroll
    ? 'flex-1 min-w-[220px] max-w-[300px]'
    : 'flex-1 min-w-0 max-w-[300px]';

  return (
    <div className="flex flex-col h-full">

      {/* ── Columns row ────────────────────────────────────────────────────────── */}
      <div
        className={[
          'flex gap-3 pb-4 items-start flex-1 min-h-0 w-full',
          enableHorizontalScroll ? 'overflow-x-auto' : 'overflow-x-hidden',
        ].join(' ')}
      >

        {columns.map(col => {
          const colIssues = issuesForColumn(col.id);

          // For column-drag visual: only show root issues (no duplicates from parent-child)
          const issueMap = new Map(issuesWithOverrides.map(i => [i.id, i]));
          const rootColIssues = colIssues.filter(i => !i.parentId || !issueMap.has(i.parentId));

          const normalizedColName = col.name.trim().toLowerCase().replace(/[\s-]+/g, '');
          const isToDoColumn = col.position === 0 || normalizedColName === 'todo';

          return (
            <div
              key={col.id}
              className={[
                `rounded-[6px] flex flex-col transition-all shadow-sm ${columnSizing}`,
                dragOverColId === col.id && dragColId !== col.id
                  ? 'ring-2 ring-blue-400 ring-offset-1'
                  : '',
              ].join(' ')}
              style={{ background: '#fff' }}
              // Card drop
              onDragOver={e => {
                e.preventDefault();
                if (dragTypeRef.current === 'card') {
                  e.dataTransfer.dropEffect = 'move';
                }
                setDragOverColId(col.id);
              }}
              onDragLeave={e => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDragOverColId(null);
                }
              }}
              onDrop={e => {
                e.preventDefault();
                if (dragTypeRef.current === 'column') {
                  handleColumnDrop(col.id, e);
                } else {
                  const issueId = e.dataTransfer.getData('text/plain');
                  if (issueId) handleCardDrop(issueId, col.id);
                }
                setDragOverColId(null);
              }}
            >
              {/* Column Header */}
              <div
                className="flex items-center justify-between px-2.5 pt-2.5 pb-1.5 cursor-grab active:cursor-grabbing select-none"
                draggable
                onDragStart={e => handleColumnDragStart(col.id, e)}
                onDragEnd={() => { setDragColId(null); setDragOverColId(null); }}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {/* Color accent dot */}
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: col.color }} />

                  {/* Inline editable name */}
                  {editingColId === col.id ? (
                    <input
                      ref={editInputRef}
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      onBlur={() => handleRenameColumn(col.id)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleRenameColumn(col.id);
                        if (e.key === 'Escape') setEditingColId(null);
                      }}
                      onMouseDown={e => e.stopPropagation()}
                      onDragStart={e => e.preventDefault()}
                      className="flex-1 min-w-0 text-[13.5px] font-bold text-[#172B4D] bg-white border border-[#4C9AFF] rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-[#4C9AFF]/30"
                    />
                  ) : (
                    <span
                      className="text-[13.5px] font-bold text-[#172B4D] uppercase tracking-wide truncate cursor-text"
                      onDoubleClick={() => startEdit(col)}
                      title="Double-click to rename"
                    >
                      {col.name}
                    </span>
                  )}

                  {/* Count badge */}
                  <span className="ml-1 flex-shrink-0 text-[11px] font-bold text-[#5E6C84] bg-[#DFE1E6] rounded-full px-1.5 py-0.5 leading-none">
                    {colIssues.length}
                  </span>
                </div>

                {/* Column action menu trigger */}
                <div className="relative ml-1">
                  <button
                    className="flex items-center justify-center w-7 h-7 rounded text-[#6B778C] hover:bg-[#DFE1E6] transition-colors flex-shrink-0"
                    onMouseDown={e => e.stopPropagation()}
                    onClick={e => {
                      e.stopPropagation();
                      if (menuColId === col.id) {
                        setMenuColId(null);
                        setMenuPos(null);
                      } else {
                        const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                        setMenuColId(col.id);
                        setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                      }
                    }}
                    title="Column options"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                      <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Cards area */}
              <div className="flex flex-col gap-2 px-2 pb-2 min-h-[60px] overflow-y-auto max-h-[calc(100vh-320px)] fd-hide-scrollbar">
                {rootColIssues.length === 0 && (
                  <div className="flex items-center justify-center h-16 border-2 border-dashed border-[#DFE1E6] rounded-[3px] mt-1 bg-[#F8F9FA]">
                    <span className="text-[12px] text-[#5E6C84]">Drop issues here</span>
                  </div>
                )}
                {rootColIssues.map(issue => (
                  <KanbanCard
                    key={issue.id}
                    issue={issue}
                    allIssues={issuesWithOverrides}
                    onOpen={onOpenIssue}
                    onDelete={onDeleteIssue}
                  />
                ))}
              </div>

              {/* Add issue inside column */}
              {isToDoColumn && (
                <button
                  onClick={onAddIssue}
                  className="flex items-center gap-1.5 mx-2 mb-2 mt-1 px-2 py-1.5 text-[13px] text-[#5E6C84] hover:text-[#172B4D] hover:bg-[#EBECF0] rounded-[3px] transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Create issue
                </button>
              )}
            </div>
          );
        })}

        {/* ── Create Column button / inline input ────────────────────────────── */}
        {creating ? (
          <div className={`rounded-[6px] p-3 flex flex-col gap-2 bg-white shadow-sm ${columnSizing}`}>
            <input
              ref={newColInputRef}
              value={newColName}
              onChange={e => setNewColName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleCreateColumn();
                if (e.key === 'Escape') { setCreating(false); setNewColName(''); }
              }}
              placeholder="Column name..."
              maxLength={60}
              className="w-full text-[13.5px] font-bold text-[#172B4D] bg-white border border-[#4C9AFF] rounded px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#4C9AFF]/30 placeholder-[#A5ADBA]"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleCreateColumn}
                disabled={createLoading || !newColName.trim()}
                className="px-3 py-1.5 bg-[#0052CC] hover:bg-[#0047B3] disabled:opacity-50 text-white text-[12px] font-bold rounded-[3px] transition-colors"
              >
                {createLoading ? 'Creating…' : 'Create'}
              </button>
              <button
                onClick={() => { setCreating(false); setNewColName(''); }}
                className="p-1.5 text-[#5E6C84] hover:bg-[#DFE1E6] rounded-[3px] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setCreating(true)}
            title="Create column"
            className="flex-shrink-0 w-8 h-8 rounded-[4px] flex items-center justify-center text-[#5E6C84] hover:text-[#172B4D] hover:bg-[#DFE1E6] border-2 border-dashed border-[#C1C7D0] hover:border-[#4C9AFF] transition-all self-start mt-1"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Column action menu (fixed-position, never clipped by overflow) ─────── */}
      {menuColId && menuPos && (() => {
        const col = columns.find(c => c.id === menuColId);
        if (!col) return null;
        return (
          <>
            <div className="fixed inset-0 z-[9998]" onClick={() => { setMenuColId(null); setMenuPos(null); }} />
            <div
              ref={menuRef}
              className="fixed w-44 bg-white border border-[#DFE1E6] rounded-[3px] shadow-[0_4px_12px_rgba(9,30,66,0.15)] z-[9999] py-1"
              style={{ top: menuPos.top, right: menuPos.right }}
              onClick={e => e.stopPropagation()}
            >
              <button
                className="w-full text-left px-4 py-2 text-[13px] text-[#172B4D] hover:bg-[#EBECF0] flex items-center gap-2.5 transition-colors"
                onClick={() => { setMenuColId(null); setMenuPos(null); startEdit(col); }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
                Rename
              </button>
              <div className="h-px bg-[#DFE1E6] my-1" />
              <button
                className="w-full text-left px-4 py-2 text-[13px] text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors"
                onClick={() => { setMenuColId(null); setMenuPos(null); initiateDelete(col); }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                Delete
              </button>
            </div>
          </>
        );
      })()}

      {/* ── Error toast ─────────────────────────────────────────────────────────── */}
      {dropError && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 bg-red-600 text-white text-sm font-semibold px-5 py-3 rounded-lg shadow-xl">
          {dropError}
          <button onClick={() => setDropError(null)} className="ml-2 opacity-70 hover:opacity-100">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* ── Delete Confirmation Modal ────────────────────────────────────────── */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-[#091E427D] flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-[3px] w-full max-w-[420px] shadow-xl p-6">
            <h3 className="text-[18px] font-semibold text-[#172B4D] mb-2">
              Delete &ldquo;{deleteConfirm.column.name}&rdquo;?
            </h3>
            <p className="text-[14px] text-[#5E6C84] mb-4">
              This column has{' '}
              <strong>{issuesForColumn(deleteConfirm.column.id).length}</strong> issue
              {issuesForColumn(deleteConfirm.column.id).length !== 1 ? 's' : ''}.
              Choose what to do with them:
            </p>

            {/* Move to options */}
            <div className="flex flex-col gap-2 mb-5">
              <label className="flex items-start gap-3 p-3 border rounded-[3px] cursor-pointer hover:bg-[#FAFBFC] transition-colors">
                <input
                  type="radio"
                  name="del-option"
                  checked={deleteConfirm.moveToColumnId === null}
                  onChange={() => setDeleteConfirm(prev => prev && { ...prev, moveToColumnId: null })}
                  className="mt-0.5"
                />
                <div>
                  <p className="text-[13px] font-semibold text-[#172B4D]">Leave unassigned</p>
                  <p className="text-[11px] text-[#5E6C84]">Issues remain but won&apos;t appear on any column</p>
                </div>
              </label>
              {columns.filter(c => c.id !== deleteConfirm.column.id).map(c => (
                <label key={c.id} className="flex items-start gap-3 p-3 border rounded-[3px] cursor-pointer hover:bg-[#FAFBFC] transition-colors">
                  <input
                    type="radio"
                    name="del-option"
                    checked={deleteConfirm.moveToColumnId === c.id}
                    onChange={() => setDeleteConfirm(prev => prev && { ...prev, moveToColumnId: c.id })}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="text-[13px] font-semibold text-[#172B4D]">Move to &ldquo;{c.name}&rdquo;</p>
                    <p className="text-[11px] text-[#5E6C84]">All issues will be moved to this column</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleteLoading}
                className="px-4 py-2 text-[13px] font-medium text-[#42526E] hover:bg-[#EBECF0] rounded-[3px] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="px-4 py-2 text-[13px] font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 rounded-[3px] transition-colors"
              >
                {deleteLoading ? 'Deleting…' : 'Delete Column'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Issue Table ──────────────────────────────────────────────────────────────

function IssueTableView({ issues, onOpenIssue }: { issues: Issue[]; onOpenIssue: (id: string) => void }) {
  if (issues.length === 0) {
    return (
      <div className="h-full min-h-0 bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400 text-sm">
        No issues yet — create one from the sidebar.
      </div>
    );
  }
  return (
    <div className="h-full min-h-0 bg-white rounded-2xl border border-slate-100 overflow-hidden flex flex-col">
      <div className="h-full min-h-0 overflow-y-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50 sticky top-0 z-10">
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
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${issue.status === 'TODO' ? 'bg-slate-100 text-slate-600' :
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
    </div>
  );
}

// ─── Progress View ────────────────────────────────────────────────────────────

function IssueProgressView({ issues, members, onOpenIssue }: { issues: Issue[]; members: { userId: string; name: string; email: string; roleName: string }[]; onOpenIssue: (id: string) => void }) {
  const total = issues.length;
  const done = issues.filter((i) => i.status === 'DONE').length;
  const inProg = issues.filter((i) => i.status === 'IN_PROGRESS').length;
  const todo = issues.filter((i) => i.status === 'TODO').length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const breakdown = [
    { label: 'Done', count: done, color: '#10b981', pct: total > 0 ? Math.round((done / total) * 100) : 0 },
    { label: 'In Progress', count: inProg, color: '#3b82f6', pct: total > 0 ? Math.round((inProg / total) * 100) : 0 },
    { label: 'To Do', count: todo, color: '#94a3b8', pct: total > 0 ? Math.round((todo / total) * 100) : 0 },
  ];

  // Team Progress: group issues by assignee
  const teamProgress = members.map(member => {
    const assigned = issues.filter(i => i.assigneeId === member.userId);
    const memberDone = assigned.filter(i => i.status === 'DONE').length;
    const memberInProg = assigned.filter(i => i.status === 'IN_PROGRESS').length;
    const memberPct = assigned.length > 0 ? Math.round((memberDone / assigned.length) * 100) : 0;
    return { ...member, total: assigned.length, done: memberDone, inProg: memberInProg, pct: memberPct };
  }).filter(m => m.total > 0);

  // Unassigned issues
  const unassignedIssues = issues.filter(i => !i.assigneeId);
  const unassignedDone = unassignedIssues.filter(i => i.status === 'DONE').length;
  const unassignedPct = unassignedIssues.length > 0 ? Math.round((unassignedDone / unassignedIssues.length) * 100) : 0;

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

      {/* Team Progress Section */}
      <div className="col-span-2 bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="text-base font-bold text-slate-900 mb-5">Team Progress</h3>
        {(teamProgress.length === 0 && unassignedIssues.length === 0) ? (
          <p className="text-sm text-slate-400">No team members with assigned tasks.</p>
        ) : (
          <div className="space-y-4">
            {teamProgress.map((member, i) => (
              <div key={member.userId} className="flex items-center gap-4">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: ['#0052CC', '#00875A', '#FF5630', '#FFAB00', '#6554C0'][i % 5] }}
                  title={member.name}
                >
                  {member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-semibold text-slate-800 truncate">{member.name}</span>
                    <span className="text-xs text-slate-500 flex-shrink-0 ml-2">
                      {member.done}/{member.total} done
                      {member.inProg > 0 && <span className="ml-1.5 text-blue-500">· {member.inProg} in progress</span>}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${member.pct}%`,
                        backgroundColor: member.pct === 100 ? '#10b981' : member.pct > 50 ? '#3b82f6' : member.pct > 0 ? '#FFAB00' : '#94a3b8'
                      }}
                    />
                  </div>
                </div>
                <span className={`text-xs font-bold w-10 text-right flex-shrink-0 ${member.pct === 100 ? 'text-emerald-600' : member.pct > 50 ? 'text-blue-600' : 'text-slate-500'
                  }`}>{member.pct}%</span>
              </div>
            ))}
            {unassignedIssues.length > 0 && (
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 flex-shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-semibold text-slate-500">Unassigned</span>
                    <span className="text-xs text-slate-400">{unassignedDone}/{unassignedIssues.length} done</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-slate-300 transition-all duration-700" style={{ width: `${unassignedPct}%` }} />
                  </div>
                </div>
                <span className="text-xs font-bold w-10 text-right flex-shrink-0 text-slate-400">{unassignedPct}%</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WsViewPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  // Always ensure projectId is a string and not undefined/null
  const projectIdRaw = params.projectId;
  const projectId = typeof projectIdRaw === 'string' ? projectIdRaw : (projectIdRaw ? String(projectIdRaw) : '');
  if (!projectId) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('projectId is missing or invalid in ws-view/page.tsx');
    }
  }

  const { allIssues, flatIssues, loading, fetchIssueDetail, refresh } = useIssues();
  const { openCreateIssue } = useIssueModal();
  const [members, setMembers] = useState<Member[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);

  // Optimistic status overrides for drag-drop — reverted on API failure
  // NOTE: Column-level optimistic updates are now managed inside IssueKanbanBoard.
  //       This placeholder preserved for other views that may use status overrides.
  const [dropError, setDropError] = useState<string | null>(null);

  const [isTeamVisibilityOpen, setIsTeamVisibilityOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [showAddPeople, setShowAddPeople] = useState(false);
  const [projectRole, setProjectRole] = useState<string | null>(null);

  // Kanban board filter — lifted from IssueKanbanBoard so it lives in the page filter bar
  const [kanbanFilter, setKanbanFilter] = useState<KanbanFilter>('all');
  const [showKanbanFilterMenu, setShowKanbanFilterMenu] = useState(false);
  const kanbanFilterMenuRef = useRef<HTMLDivElement>(null);

  // Read ?tab= from URL, default to 'kanban'
  const tabParam = searchParams.get('tab') as ViewMode | null;
  const [activeView, setActiveView] = useState<ViewMode>(tabParam ?? 'kanban');

  // Fetch project members for the avatar list
  useEffect(() => {
    if (!projectId) return;
    projectsService.getByProjectID(projectId).then(setProject).catch(console.error);
    projectsService.getPermissions(projectId).then(p => setProjectRole(p.role)).catch(console.error);
    projectsService.getMembers(projectId).then((data) => {
      setMembers(data as Member[]);
    }).catch(console.error);
  }, [projectId]);

  // Sync tab state if URL changes (e.g. sidebar Backlog link)
  useEffect(() => {
    if (tabParam && tabParam !== activeView) setActiveView(tabParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabParam]);

  // Close kanban filter menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (kanbanFilterMenuRef.current && !kanbanFilterMenuRef.current.contains(e.target as Node)) {
        setShowKanbanFilterMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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

  const handleDropIssue = async (issueId: string, columnId: string) => {
    try {
      await issuesService.update(issueId, { columnId, projectId });
      refresh();
    } catch (err) {
      // Optimistic state is already managed inside IssueKanbanBoard
      console.error('Failed to move issue to column:', err);
      throw err; // Re-throw so IssueKanbanBoard can rollback its own optimistic state
    }
  };

  const handleDeleteIssue = async (issueId: string) => {
    const issue = allIssues.find(i => i.id === issueId);
    if (!issue) return;
    const confirmed = window.confirm(`Delete "${issue.title}"? This cannot be undone. Children must be removed first.`);
    if (!confirmed) return;
    try {
      await issuesService.delete(issueId, projectId);
      refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete issue';
      setDropError(msg.includes('child') ? 'Delete or reassign children before deleting this issue.' : msg);
      setTimeout(() => setDropError(null), 5000);
    }
  };

  const toggleAssignee = (id: string) => {
    setSelectedAssignees(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Use allIssues for Kanban/Table/Progress (includes orphans fully)
  // flatIssues = tree-derived; allIssues = flat from /api/issues endpoint
  let displayIssues = allIssues.length > 0 ? allIssues : flatIssues;

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    displayIssues = displayIssues.filter(i =>
      i.title.toLowerCase().includes(q) ||
      i.issueKey.toLowerCase().includes(q)
    );
  }

  if (selectedAssignees.length > 0) {
    displayIssues = displayIssues.filter(i => {
      if (selectedAssignees.includes('UNASSIGNED') && !i.assigneeId) return true;
      return i.assigneeId && selectedAssignees.includes(i.assigneeId);
    });
  }

  const views: { id: ViewMode; label: string; icon: ReactElement }[] = [
    {
      id: 'kanban', label: 'Board', icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="18" rx="1" /><rect x="14" y="3" width="7" height="12" rx="1" />
        </svg>
      ),
    },
    {
      id: 'table', label: 'List', icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      ),
    },
    {
      id: 'backlog', label: 'Epics', icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      ),
    },
    {
      id: 'progress', label: 'Progress', icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 20V10M12 20V4M6 20v-6" />
        </svg>
      ),
    },
  ];

  // Compact breadcrumb node for WsTopbar
  const breadcrumb = (
    <nav className="flex items-center gap-1 text-sm" aria-label="Breadcrumb">
      {/* PRJ-011 */}
      <button
        onClick={() => router.push(`/workspace/${projectId}/ws-dashboard`)}
        className="text-slate-500 hover:text-blue-600 font-medium transition-colors truncate max-w-[100px]"
      >
        {projectId}
      </button>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 flex-shrink-0">
        <polyline points="9 18 15 12 9 6" />
      </svg>
      {/* Board */}
      <span className="text-slate-500 font-medium">Board View</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 flex-shrink-0">
        <polyline points="9 18 15 12 9 6" />
      </svg>
      {/* Active view */}
      <span className="text-slate-800 font-semibold">
        {views.find(v => v.id === activeView)?.label ?? activeView}
      </span>
      {/* Count badge */}
      {!loading && (
        <span className="ml-1 px-1.5 py-0.5 bg-[#eff3ff] text-[#4361ee] rounded-full text-[10px] font-bold leading-none">
          {displayIssues.length}
        </span>
      )}
    </nav>
  );

  return (
    <div className="flex h-screen bg-[#f4f6fb] overflow-hidden">
      <WsSidebar projectId={projectId} projectName={projectId} />

      <div className="flex-1 flex flex-col overflow-hidden ml-[220px]">
        {/* Topbar with inline breadcrumb */}
        <WsTopbar
          title=""
          subtitle=""
          projectId={projectId}
          breadcrumb={breadcrumb}
        />

        {/* ── PROJECT HERO HEADER ───────────────────────────────────────── */}
        <div className="bg-white px-6 pt-2 pb-1">
          {/* Remove Spaces label - show only project name */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-[#0052CC] flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2l.5-.5M12 2l3 3m1 6l3 3M17.5 7.5L22 3M22 3l-4 4" />
                  <path d="M15 15L9 9m3 9l-3 3-5-5 3-3" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">{project?.projectName || projectId}</h2>
              <div className="flex items-center gap-1.5 ml-1">
                <button
                  onClick={() => setIsTeamVisibilityOpen(true)}
                  className="flex items-center justify-center p-1 rounded hover:bg-slate-100 border border-slate-200 transition-colors shadow-sm ml-2"
                  title="Team visibility"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </button>
                {(projectRole?.toLowerCase() === 'manager' || projectRole?.toLowerCase() === 'superadmin') && (
                  <div className="relative">
                    <button
                      onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                      className="flex items-center justify-center p-1 rounded hover:bg-slate-100 transition-colors text-slate-500 font-bold tracking-widest px-2"
                      title="More options"
                    >
                      ...
                    </button>
                    {isMoreMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsMoreMenuOpen(false)}></div>
                        <div className="absolute top-10 left-0 w-52 bg-white border border-slate-200 rounded-lg shadow-xl py-1.5 z-50 text-sm" style={{ animation: 'modalScaleIn 0.15s ease-out' }}>
                          <button
                            className="flex items-center gap-2.5 w-full text-left px-4 py-2 text-blue-700 hover:bg-blue-50 font-medium"
                            onClick={() => { setIsMoreMenuOpen(false); setShowAddPeople(true); }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                              <line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
                            </svg>
                            Add People
                          </button>
                          <button className="flex items-center gap-2.5 w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                            </svg>
                            Project Settings
                          </button>
                          <hr className="my-1 border-slate-100" />
                          <button className="flex items-center gap-2.5 w-full text-left px-4 py-2 text-red-600 hover:bg-red-50">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </svg>
                            Move to Trash
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Create Issue Button — restricted role */}
            {(projectRole?.toLowerCase() === 'manager' || projectRole?.toLowerCase() === 'superadmin') && (
              <div className="flex items-center gap-2 translate-y-[15px]">
                <button
                  onClick={() => openCreateIssue('TASK')}
                  className="flex items-center gap-2 px-4 py-[7px] bg-[#0052CC] hover:bg-[#0047B3] text-white text-[13.5px] font-bold rounded-[3px] transition-colors shadow-sm"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Create Issue
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Underline tab switcher ─────────────────────────────────────── */}
        <div className="bg-white border-b border-slate-200 px-6 flex-shrink-0">
          <div className="flex items-center -mb-px overflow-x-auto">
            {views.map((v) => (
              <button
                key={v.id}
                onClick={() => switchView(v.id)}
                className={[
                  'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-all duration-150',
                  activeView === v.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300',
                ].join(' ')}
              >
                <span className={activeView === v.id ? 'text-blue-600' : 'text-slate-400'}>
                  {v.icon}
                </span>
                {v.label}
                {activeView === v.id && !loading && v.id !== 'backlog' && (
                  <span className="ml-0.5 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold leading-none">
                    {displayIssues.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Main content ──────────────────────────────────────────────── */}
        <main className="flex-1 overflow-auto pt-4 px-5 pb-5 flex flex-col">

          {/* ── Error Toast (drag-drop / delete failures) ─────────────────── */}
          {dropError && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 bg-red-600 text-white text-sm font-semibold px-5 py-3 rounded-lg shadow-xl animate-in slide-in-from-bottom-4 duration-300">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {dropError}
              <button onClick={() => setDropError(null)} className="ml-2 opacity-70 hover:opacity-100 transition-opacity">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          )}

          {/* ── Filter Bar ────────────────────────────────────────────────── */}
          <div className="flex items-center gap-4 mb-6">
            {/* Search Box — visually dominant, fills horizontal space */}
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search issues by title or key..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-[13.5px] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 w-full shadow-sm bg-white font-medium"
              />
            </div>

            {/* Member Avatars */}
            <div className="flex items-center -space-x-1.5 pt-0.5 ml-2 mr-2">
              <div
                onClick={() => toggleAssignee('UNASSIGNED')}
                className={`w-8 h-8 rounded-full border-2 bg-slate-100 flex items-center justify-center cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all shadow-sm ${selectedAssignees.includes('UNASSIGNED') ? 'border-white text-blue-600 ring-2 ring-blue-500 z-30' : 'border-white text-slate-500 z-10'
                  }`}
                title="Unassigned"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              {members.map((member, i) => {
                const isSelected = selectedAssignees.includes(member.userId);
                return (
                  <div
                    key={member.userId}
                    onClick={() => toggleAssignee(member.userId)}
                    className={`w-8 h-8 rounded-full border-2 text-white flex items-center justify-center text-xs font-bold cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all relative shadow-sm ${isSelected ? 'border-white ring-2 ring-blue-500 z-30' : 'border-white z-20'
                      }`}
                    style={{ backgroundColor: ['#0052CC', '#00875A', '#FF5630', '#FFAB00', '#6554C0'][i % 5] }}
                    title={member.name}
                  >
                    {getInitials(member.name)}
                  </div>
                );
              })}
            </div>

            {/* Board filter — only visible on kanban view */}
            {activeView === 'kanban' && (
              <div ref={kanbanFilterMenuRef} className="relative">
                <button
                  onClick={() => setShowKanbanFilterMenu(v => !v)}
                  title={
                    kanbanFilter === 'recently_updated'
                      ? 'Recently Updated'
                      : kanbanFilter === 'assigned_to_me'
                        ? 'Assigned to Me'
                        : 'Board filter'
                  }
                  className={[
                    'flex items-center justify-center w-9 h-9 border rounded-md shadow-sm transition-colors',
                    kanbanFilter !== 'all'
                      ? 'border-[#4C9AFF] bg-blue-50 text-[#0052CC] hover:bg-blue-100'
                      : 'border-slate-300 text-slate-700 bg-slate-50 hover:bg-slate-100',
                  ].join(' ')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={kanbanFilter !== 'all' ? 'text-[#0052CC]' : 'text-slate-500'}>
                    <line x1="4" y1="6" x2="20" y2="6" />
                    <line x1="6" y1="12" x2="18" y2="12" />
                    <line x1="10" y1="18" x2="14" y2="18" />
                  </svg>
                </button>

                {showKanbanFilterMenu && (
                  <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-[#DFE1E6] rounded-[3px] shadow-[0_4px_12px_rgba(9,30,66,0.15)] z-[100] py-1">
                    <p className="px-3 pt-2 pb-1 text-[10px] font-bold text-[#5E6C84] uppercase tracking-wider">Board filter</p>
                    {(['all', 'recently_updated', 'assigned_to_me'] as KanbanFilter[]).map(f => (
                      <button
                        key={f}
                        onClick={() => { setKanbanFilter(f); setShowKanbanFilterMenu(false); }}
                        className={[
                          'w-full text-left px-3 py-2 text-[13px] transition-colors',
                          kanbanFilter === f ? 'bg-[#DEEBFF] text-[#0052CC] font-semibold' : 'text-[#172B4D] hover:bg-[#FAFBFC]',
                        ].join(' ')}
                      >
                        {f === 'all' ? 'All Issues' : f === 'recently_updated' ? 'Recently Updated' : 'Assigned to Me'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {(searchQuery.trim() !== '' || selectedAssignees.length > 0) && (
              <>
                <div className="w-px h-5 bg-slate-300 mx-1"></div>
                <button
                  onClick={() => { setSearchQuery(''); setSelectedAssignees([]); }}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Clear filters
                </button>
              </>
            )}
          </div>

          {activeView === 'backlog' && <BacklogView />}
          {activeView === 'kanban' && (
            <IssueKanbanBoard
              issues={displayIssues}
              projectId={projectId}
              onOpenIssue={handleOpenIssue}
              onAddIssue={() => openCreateIssue('TASK')}
              onDropIssue={handleDropIssue}
              onDeleteIssue={handleDeleteIssue}
              kanbanFilter={kanbanFilter}
            />
          )}
          {activeView === 'table' && (
            <div className="flex-1 min-h-0">
              <IssueTableView issues={displayIssues} onOpenIssue={handleOpenIssue} />
            </div>
          )}
          {activeView === 'progress' && <IssueProgressView issues={displayIssues} members={members} onOpenIssue={handleOpenIssue} />}
        </main>
      </div>

      {/* ── Team Visibility Modal ─────────────────────────────────────── */}
      {isTeamVisibilityOpen && (
        <div className="fixed inset-0 bg-[#091E427D] flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded w-full max-w-[400px] shadow-xl overflow-hidden flex flex-col">
            <div className="p-6 pb-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-medium text-[#172B4D]">Link contributing teams</h2>
                <button onClick={() => setIsTeamVisibilityOpen(false)} className="text-[#6B778C] hover:bg-slate-100 p-1.5 rounded transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <p className="text-[14px] leading-relaxed text-[#5E6C84] mb-4">
                Add the teams that work in this space, so everyone knows who to go to for help.
              </p>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5E6C84]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search and add teams"
                  className="w-full pl-10 pr-3 py-2 border border-[#DFE1E6] hover:bg-[#FAFBFC] rounded-[3px] text-[14px] text-[#172B4D] placeholder:text-[#5E6C84] focus:outline-none focus:border-[#4C9AFF] focus:bg-white"
                />
              </div>
            </div>

            <div className="p-4 pt-4 flex items-center justify-end gap-2 mt-4">
              <button onClick={() => setIsTeamVisibilityOpen(false)} className="px-3 py-2 text-[14px] font-medium text-[#42526E] hover:bg-[#EBECF0] rounded-[3px] transition-colors">
                Cancel
              </button>
              <button onClick={() => setIsTeamVisibilityOpen(false)} className="px-3 py-2 text-[14px] font-medium text-white bg-[#0052CC] hover:bg-[#0047B3] rounded-[3px] transition-colors">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add People Modal — triggered from More Actions menu */}
      {showAddPeople && (
        <AddPeopleModal
          projectId={projectId}
          projectName={project?.projectName || projectId}
          onClose={() => setShowAddPeople(false)}
          onMembersChanged={() => {
            projectsService.getMembers(projectId).then((data) => setMembers(data as Member[])).catch(console.error);
          }}
        />
      )}

    </div>
  );
}


