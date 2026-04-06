'use client';

import { useState, useEffect } from 'react';
import type { ReactElement } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import WsSidebar from '@/components/workspace/WsSidebar';
import WsTopbar from '@/components/workspace/WsTopbar';
import BacklogView from '@/components/view/BacklogView';
import AddPeopleModal from '@/components/dashboard/AddPeopleModal';
import { useIssues } from '@/lib/IssuesContext';
import { useIssueModal } from '@/lib/IssueModalContext';
import { issuesService } from '@/lib/issues.service';
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

// Column SVG icons
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
function KanbanCard({ issue, allIssues, onOpen }: { issue: Issue; allIssues: Issue[]; onOpen: (id: string) => void }) {
  const { isExpanded, toggleItem } = useAccordion();
  const tb = TYPE_BADGE[issue.type] ?? TYPE_BADGE.TASK;
  const expanded = isExpanded(issue.id);
  const children = allIssues.filter(i => i.parentId === issue.id);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
              onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
            >
              •••
            </button>
            {isMenuOpen && (
              <>
                <div className="fixed inset-0 z-40 cursor-default" onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); }} />
                <div className="absolute right-0 top-6 w-48 bg-white border border-[#DFE1E6] rounded-[3px] shadow-[0_4px_8px_rgba(9,30,66,0.15)] z-50 flex flex-col py-1.5 text-[14px] text-[#172B4D] font-normal" onClick={(e) => e.stopPropagation()}>
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
                  <button className="px-4 py-1.5 hover:bg-[#EBECF0] w-full text-left transition-colors cursor-pointer">Delete</button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Date line (Mocked visually based on createdAt to match reference image) */}
        <div className="flex items-center gap-1.5 px-1.5 py-[3px] border border-[#DFE1E6] rounded-[3px] text-[#42526E] text-[12px] font-medium w-max shadow-sm mt-0.5 bg-white">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>{new Date(issue.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>

        {/* ROW 3: Type icon, Key, priority, assignee */}
        <div className="flex items-center justify-between mt-0.5 pt-0.5">
          <div className="flex items-center gap-[7px] text-[12px] text-[#5E6C84] font-medium">
            <span className={issue.type === 'EPIC' ? 'text-[#904EE2]' : issue.type === 'STORY' ? 'text-[#65BA43]' : issue.type === 'BUG' ? 'text-[#E34935]' : 'text-[#4C9AFF]'}>
              <TypeIcon type={issue.type} size={15} isIndependent={!issue.parentId && issue.type !== 'EPIC'} />
            </span>
            <span className="hover:underline">{issue.issueKey}</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-[#DFE1E6] text-[#172B4D] text-[11px] font-bold px-1.5 rounded-[3px] min-w-[20px] h-[20px] flex items-center justify-center">
              4
            </div>

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


function IssueKanbanBoard({ issues, onOpenIssue, onAddIssue, onDropIssue }: { issues: Issue[]; onOpenIssue: (id: string) => void; onAddIssue: () => void; onDropIssue: (id: string, status: IssueStatus) => void }) {
  // Filter out EPICs from Kanban board — Kanban shows only Task, Bug, Story
  const kanbanColumns: { id: IssueStatus; label: string; color: string }[] = [
    { id: 'TODO', label: 'To Do', color: 'border-slate-300 bg-slate-50' },
    { id: 'IN_PROGRESS', label: 'In Progress', color: 'border-blue-300 bg-blue-50' },
    { id: 'DONE', label: 'Done', color: 'border-green-300 bg-green-50' },
  ];
  const kanbanIssues = issues.filter(i => i.type !== 'EPIC');

  if (kanbanIssues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-slate-200 w-full h-[400px]">
        <svg className="w-16 h-16 text-slate-200 mb-4" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <h3 className="text-lg font-bold text-slate-800 mb-2">No tasks yet</h3>
        <p className="text-slate-500 text-sm mb-6">Your board is empty. Get started by creating a new task.</p>
        <button
          onClick={onAddIssue}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          Create Task
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-6 overflow-x-auto h-full pb-4 items-start w-full min-w-0">
      {kanbanColumns.map((col) => {
        const colIssues = kanbanIssues.filter((i) => i.status === col.id);
        const issueMap = new Map(kanbanIssues.map((i) => [i.id, i]));
        const rootIssues = colIssues.filter(
          (i) => !i.parentId || !issueMap.has(i.parentId),
        );

        return (
          <div
            key={col.id}
            className={`rounded-lg bg-slate-50/50 px-4 pt-4 pb-2 w-[340px] flex-shrink-0 h-max max-h-full flex flex-col border ${col.color}`}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              e.currentTarget.classList.add('ring-2', 'ring-blue-400', 'ring-offset-1');
            }}
            onDragLeave={(e) => {
              e.currentTarget.classList.remove('ring-2', 'ring-blue-400', 'ring-offset-1');
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('ring-2', 'ring-blue-400', 'ring-offset-1');
              const issueId = e.dataTransfer.getData('text/plain');
              if (issueId) {
                onDropIssue(issueId, col.id);
              }
            }}
          >
            {/* Column header */}
            <div className="flex items-center justify-between mx-1 mb-4 flex-shrink-0 sticky top-0 z-10 py-1">
              <div className="flex items-center gap-2 font-bold text-[14px] text-slate-700 uppercase tracking-wide">
                <KanbanColumnIcon id={col.id} />
                <span>{col.label}</span>
              </div>
              <span className="bg-slate-200 text-slate-700 text-[12px] font-bold px-2 py-0.5 rounded-full">
                {colIssues.length}
              </span>
            </div>

            {/* Cards container inside column (scrollable) */}
            <div className="flex flex-col gap-3 flex-1 overflow-y-auto px-1 pb-4 min-h-[50px] scrollbar-thin scrollbar-thumb-slate-300">
              {colIssues.length === 0 && (
                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50/50 mt-2">
                  <span className="text-[13px] text-slate-400 font-medium">No tasks yet</span>
                </div>
              )}
              {rootIssues.map((issue) => {
                return (
                  <KanbanCard
                    key={issue.id}
                    issue={issue}
                    allIssues={issues}
                    onOpen={onOpenIssue}
                  />
                );
              })}

              {/* Inline Add Issue logic — only visible in To Do column */}
              {col.id === 'TODO' && (
                <button
                  onClick={onAddIssue}
                  className="group flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-lg p-3 hover:border-blue-400 hover:bg-blue-50 transition-all mt-1 bg-white cursor-pointer"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 group-hover:bg-blue-100 transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 group-hover:text-blue-600">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </div>
                  <span className="text-[12px] font-bold text-slate-500 mt-2 group-hover:text-blue-700 transition-colors">Create issue</span>
                </button>
              )}
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
  const projectId = params.projectId as string;

  const { allIssues, flatIssues, loading, fetchIssueDetail, refresh } = useIssues();
  const { openCreateIssue } = useIssueModal();
  const [members, setMembers] = useState<Member[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);

  const [isTeamVisibilityOpen, setIsTeamVisibilityOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [showAddPeople, setShowAddPeople] = useState(false);
  const [projectRole, setProjectRole] = useState<string | null>(null);

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

  const handleDropIssue = async (issueId: string, newStatus: IssueStatus) => {
    try {
      await issuesService.update(issueId, { status: newStatus, projectId });
      refresh();
    } catch (err) {
      console.error('Failed to update issue status on drop:', err);
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
        <main className="flex-1 overflow-auto pt-6 px-8 pb-8 flex flex-col">

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

            {/* Filter Button */}
            <button
              className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-md text-sm font-semibold shadow-sm transition-colors ${selectedAssignees.length > 0
                ? 'border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100'
                : 'border-slate-300 text-slate-700 bg-slate-50 hover:bg-slate-100'
                }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={selectedAssignees.length > 0 ? "text-blue-600" : "text-slate-500"}>
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="6" y1="12" x2="18" y2="12" />
                <line x1="10" y1="18" x2="14" y2="18" />
              </svg>
              Filter
              {selectedAssignees.length > 0 && (
                <span className="ml-0.5 bg-blue-200 text-blue-800 text-[10px] px-1.5 py-0.5 rounded-sm">
                  {selectedAssignees.length}
                </span>
              )}
            </button>

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
          {activeView === 'kanban' && <IssueKanbanBoard issues={displayIssues} onOpenIssue={handleOpenIssue} onAddIssue={() => openCreateIssue('TASK')} onDropIssue={handleDropIssue} />}
          {activeView === 'table' && <IssueTableView issues={displayIssues} onOpenIssue={handleOpenIssue} />}
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


