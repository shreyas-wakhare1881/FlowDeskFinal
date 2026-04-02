'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import WsSidebar from '@/components/workspace/WsSidebar';
import WsTopbar from '@/components/workspace/WsTopbar';
import StatsCard from '@/components/dashboard/StatsCard';
import { tasksService } from '@/lib/tasks.service';
import { projectsService } from '@/lib/projects.service';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { useIssues } from '@/lib/IssuesContext';
import type { Task } from '@/types/task';
import type { Issue } from '@/types/issue';

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtDate(iso: string | undefined | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

// ── SVG Icons (no emojis) ─────────────────────────────────────────────────────
const IconClipboard = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
  </svg>
);

const IconZap = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

const IconCheck = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const IconAlertCircle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const IconFilter = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);

const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const IconX = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const IconEmpty = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="3"/>
    <path d="M9 13h6M9 9h6M9 17h3"/>
  </svg>
);

const IconRecurring = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

// ── Issue type icons ──────────────────────────────────────────────────────────
const IconEpic = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);
const IconStory = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);
const IconTask = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconBug = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 2l1.88 1.88M16 2l-1.88 1.88M20 13c0 4.42-3.58 8-8 8s-8-3.58-8-8V9a6 6 0 0 1 12 0"/>
    <line x1="2" y1="9" x2="22" y2="9"/><line x1="12" y1="1" x2="12" y2="3"/>
  </svg>
);

// ── Priority dot (SVG-based, no emoji) ───────────────────────────────────────
const PRIORITY_COLOR: Record<string, string> = {
  critical: '#ef4444',
  HIGH:     '#ef4444',
  medium:   '#f59e0b',
  MEDIUM:   '#f59e0b',
  low:      '#3b82f6',
  LOW:      '#3b82f6',
};

function PriorityDot({ priority }: { priority: string }) {
  const color = PRIORITY_COLOR[priority] ?? '#94a3b8';
  return <span className="w-2 h-2 rounded-full flex-shrink-0 inline-block" style={{ background: color }} />;
}

// ── Status / Priority badge style maps ───────────────────────────────────────
const statusColors: Record<string, string> = {
  todo:          'bg-slate-100 text-slate-600',
  'in-progress': 'bg-blue-100 text-blue-700',
  completed:     'bg-emerald-100 text-emerald-700',
  overdue:       'bg-red-100 text-red-700',
};

const statusLabels: Record<string, string> = {
  todo:          'To Do',
  'in-progress': 'In Progress',
  completed:     'Completed',
  overdue:       'Overdue',
};

const priorityBadge: Record<string, string> = {
  critical: 'bg-red-50 text-red-600 border border-red-200',
  medium:   'bg-amber-50 text-amber-600 border border-amber-200',
  low:      'bg-blue-50 text-blue-600 border border-blue-200',
};

// ── Issue type config ─────────────────────────────────────────────────────────
const ISSUE_TYPE_CONFIG = {
  EPIC:  { label: 'Epic',  bg: '#f3f0ff', text: '#6d28d9', icon: <IconEpic />  },
  STORY: { label: 'Story', bg: '#eff6ff', text: '#1d4ed8', icon: <IconStory /> },
  TASK:  { label: 'Task',  bg: '#f0fdf4', text: '#15803d', icon: <IconTask />  },
  BUG:   { label: 'Bug',   bg: '#fff1f2', text: '#be123c', icon: <IconBug />   },
} as const;

const ISSUE_STATUS_CONFIG = {
  TODO:        { label: 'To Do',       dot: '#64748b' },
  IN_PROGRESS: { label: 'In Progress', dot: '#2563eb' },
  DONE:        { label: 'Done',        dot: '#16a34a' },
} as const;

// ── Task Card ──────────────────────────────────────────────────────────────────
function TaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const firstAssignee = task.assignees?.[0];

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl p-5 border border-slate-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all cursor-pointer group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-mono text-slate-400">{task.taskID}</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${priorityBadge[task.priority]}`}>
          <PriorityDot priority={task.priority} />
          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
        </span>
      </div>

      {/* Task name */}
      <h3 className="text-sm font-semibold text-slate-900 mb-3 line-clamp-2 group-hover:text-blue-700 transition-colors">
        {task.taskName}
      </h3>

      {/* Description */}
      {task.taskDescription && (
        <p className="text-xs text-slate-500 mb-3 line-clamp-2">{task.taskDescription}</p>
      )}

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>Progress</span>
          <span className="font-semibold">{task.progress ?? 0}%</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              task.status === 'completed' ? 'bg-emerald-500' :
              task.status === 'overdue'   ? 'bg-red-500'     : 'bg-blue-500'
            }`}
            style={{ width: `${task.progress ?? 0}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {firstAssignee ? (
            <>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: firstAssignee.avatarColor || '#4361ee' }}
              >
                {firstAssignee.avatar || firstAssignee.name?.slice(0, 2).toUpperCase()}
              </div>
              <span className="text-xs text-slate-600 font-medium">{firstAssignee.name}</span>
              {task.assignees.length > 1 && (
                <span className="text-xs text-slate-400">+{task.assignees.length - 1}</span>
              )}
            </>
          ) : (
            <span className="text-xs text-slate-400">Unassigned</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[task.status]}`}>
            {statusLabels[task.status]}
          </span>
          <span className="text-[10px] text-slate-400">{fmtDate(task.dueDate)}</span>
        </div>
      </div>

      {/* Recurring badge — SVG, no emoji */}
      {task.isRecurring && (
        <div className="mt-2 flex items-center gap-1 text-[10px] text-purple-600 font-semibold">
          <IconRecurring />
          {task.recurringFrequency || 'Recurring'}
        </div>
      )}
    </div>
  );
}

// ── Issue Card (Image-2 style) ────────────────────────────────────────────────
function IssueCard({ issue }: { issue: Issue }) {
  const tCfg = ISSUE_TYPE_CONFIG[issue.type as keyof typeof ISSUE_TYPE_CONFIG] ?? ISSUE_TYPE_CONFIG.TASK;
  const sCfg = ISSUE_STATUS_CONFIG[issue.status as keyof typeof ISSUE_STATUS_CONFIG] ?? ISSUE_STATUS_CONFIG.TODO;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-md hover:shadow-blue-500/5 transition-all cursor-pointer group p-4">
      {/* Top row: type badge + key + priority dot */}
      <div className="flex items-center gap-2 mb-2.5">
        <span
          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold flex-shrink-0"
          style={{ background: tCfg.bg, color: tCfg.text }}
        >
          {tCfg.icon}
          {tCfg.label}
        </span>
        <span className="text-[10px] font-mono text-slate-400">{issue.issueKey}</span>
        <span className="ml-auto">
          <PriorityDot priority={issue.priority} />
        </span>
      </div>

      {/* Title */}
      <h4 className="text-sm font-semibold text-slate-800 line-clamp-2 group-hover:text-blue-700 transition-colors leading-snug mb-3">
        {issue.title}
      </h4>

      {/* Footer row: status + assignee + due date */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Status pill */}
        <span
          className="flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{
            background: sCfg.dot + '18',
            color: sCfg.dot,
            border: `1px solid ${sCfg.dot}33`,
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: sCfg.dot }} />
          {sCfg.label}
        </span>

        <div className="flex items-center gap-2">
          {/* Assignee avatar */}
          {issue.assignee && (
            <div
              title={issue.assignee.name}
              className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 bg-[#4361ee]"
            >
              {issue.assignee.name.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Filter Dropdown ───────────────────────────────────────────────────────────
interface FilterDropdownProps {
  filter: string;
  setFilter: (f: 'all' | 'todo' | 'in-progress' | 'completed' | 'overdue') => void;
  counts: { all: number; todo: number; 'in-progress': number; completed: number; overdue: number };
  onClose: () => void;
}

function FilterDropdown({ filter, setFilter, counts, onClose }: FilterDropdownProps) {
  const opts = [
    { key: 'all',         label: 'All Tasks',   count: counts.all },
    { key: 'todo',        label: 'To Do',        count: counts.todo },
    { key: 'in-progress', label: 'In Progress',  count: counts['in-progress'] },
    { key: 'completed',   label: 'Completed',    count: counts.completed },
    { key: 'overdue',     label: 'Overdue',      count: counts.overdue },
  ] as const;

  return (
    <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-300/20 z-50 overflow-hidden">
      <div className="px-3 py-2 border-b border-slate-100">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Filter by Status</p>
      </div>
      <div className="p-1.5">
        {opts.map(opt => (
          <button
            key={opt.key}
            onClick={() => { setFilter(opt.key); onClose(); }}
            className={[
              'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all',
              filter === opt.key
                ? 'bg-blue-50 text-blue-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
            ].join(' ')}
          >
            <span>{opt.label}</span>
            <span className={[
              'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
              filter === opt.key ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500',
            ].join(' ')}>
              {opt.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function WsDashboardPage() {
  const params      = useParams();
  const router      = useRouter();
  const projectId   = params.projectId as string;
  const currentUser = useCurrentUser();

  // Tasks — local state (not in global context)
  const [tasks,       setTasks]       = useState<Task[]>([]);
  const [projectName, setProjectName] = useState<string>('');
  const [loading,     setLoading]     = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll,     setShowAll]     = useState(false);
  const [filter,      setFilter]      = useState<'all' | 'todo' | 'in-progress' | 'completed' | 'overdue'>('all');
  const [showFilter,  setShowFilter]  = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Issues — from IssuesContext (live, reactive to CRUD actions)
  const { allIssues, loading: issuesLoading } = useIssues();

  // My issues = issues assigned to current user
  const myIssues = useMemo(() => {
    if (!currentUser.id) return allIssues; // fallback: show all when user unknown
    return allIssues.filter(i => i.assigneeId === currentUser.id);
  }, [allIssues, currentUser.id]);

  // ── Fetch project name + tasks ────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const [proj, taskList] = await Promise.all([
          projectsService.getByProjectID(projectId).catch(() => null),
          tasksService.getAll(projectId).catch(() => []),
        ]);
        if (proj) setProjectName(proj.projectName);
        setTasks(taskList);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId]);

  // ── Close filter dropdown on outside click ────────────────────────────────
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilter(false);
      }
    }
    if (showFilter) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showFilter]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:      tasks.length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    completed:  tasks.filter(t => t.status === 'completed').length,
    overdue:    tasks.filter(t => t.status === 'overdue').length,
  }), [tasks]);

  // ── Filter + Search ───────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return tasks.filter(t => {
      const matchFilter =
        filter === 'all'         ? true :
        filter === 'todo'        ? t.status === 'todo' :
        filter === 'in-progress' ? t.status === 'in-progress' :
        filter === 'completed'   ? t.status === 'completed' :
                                   t.status === 'overdue';
      const q = searchQuery.toLowerCase();
      const matchSearch = !q ||
        t.taskName.toLowerCase().includes(q) ||
        t.assignees?.some(a => a.name.toLowerCase().includes(q));
      return matchFilter && matchSearch;
    });
  }, [tasks, filter, searchQuery]);

  const SHOW_COUNT    = 6;
  const visibleTasks  = showAll ? filtered : filtered.slice(0, SHOW_COUNT);

  // Filter counts
  const filterCounts = {
    all:           tasks.length,
    todo:          tasks.filter(t => t.status === 'todo').length,
    'in-progress': stats.inProgress,
    completed:     stats.completed,
    overdue:       stats.overdue,
  };

  // Active filter label
  const activeFilterLabel = filter === 'all' ? 'All' :
    filter === 'todo' ? 'To Do' :
    filter === 'in-progress' ? 'In Progress' :
    filter === 'completed' ? 'Completed' : 'Overdue';

  return (
    <div className="flex min-h-screen" style={{ background: '#f4f6fb' }}>
      <WsSidebar projectId={projectId} projectName={projectName || projectId} />

      <div className="flex-1 md:ml-[220px]">
        <WsTopbar title="" subtitle="" projectId={projectId} />

        <main className="p-4 md:p-5">
          <div className="max-w-7xl mx-auto">

            {/* ── Project Identity ────────────────────────────────────────── */}
            <div className="flex items-center gap-4 mb-3 pb-3 border-b border-slate-100">
              <div className="w-11 h-11 rounded-2xl bg-[#4361ee] flex items-center justify-center flex-shrink-0 ring-4 ring-[#4361ee]/10">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                  <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                </svg>
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-extrabold text-[#1a1a2e] leading-tight tracking-tight">
                  {projectName || projectId}
                </h2>
                <span className="text-[0.72rem] font-mono font-semibold text-[#4361ee] bg-[#eff3ff] px-2 py-0.5 rounded-md w-fit">
                  {projectId}
                </span>
              </div>
            </div>

            {/* ── Stats Grid — SVG icons, no emojis ──────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
              <StatsCard label="Total Tasks"  value={stats.total}      trend="" icon={<IconClipboard />}    variant="info"    />
              <StatsCard label="In Progress"  value={stats.inProgress} trend="" icon={<IconZap />}          variant="info"    />
              <StatsCard label="Completed"    value={stats.completed}  trend="" icon={<IconCheck />}        variant="success" />
              <StatsCard label="Overdue"      value={stats.overdue}    trend="" icon={<IconAlertCircle />}  variant="warning" />
            </div>

            {/* ── My Tasks Header + Search + Single Filter Button ─────────── */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              {/* Left: title + count (tasks + issues combined) */}
              <div className="flex items-center gap-3">
                <h3 className="text-[1.25rem] font-semibold text-[#1a1a2e] tracking-tight">My Tasks</h3>
                <span className="px-2.5 py-0.5 bg-[#eff3ff] text-[#4361ee] rounded-full text-[0.75rem] font-bold leading-none">
                  {filtered.length + myIssues.length}
                </span>
              </div>

              {/* Right: search + single filter icon button */}
              <div className="flex items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a828c] pointer-events-none">
                    <IconSearch />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search tasks, assignee…"
                    className="pl-9 pr-4 py-1.5 w-[190px] bg-white border border-[#e8ecf0] rounded-xl text-[0.82rem] text-[#1a1a2e] placeholder:text-[#7a828c] focus:outline-none focus:border-[#4361ee] focus:ring-2 focus:ring-[#4361ee]/10 transition-all"
                  />
                </div>

                {/* Single filter icon button */}
                <div ref={filterRef} className="relative">
                  <button
                    onClick={() => setShowFilter(v => !v)}
                    className={[
                      'flex items-center gap-2 px-3 py-[7px] rounded-xl border text-sm font-medium transition-all',
                      showFilter || filter !== 'all'
                        ? 'bg-[#4361ee] text-white border-[#4361ee] shadow-[0_2px_8px_rgba(67,97,238,0.25)]'
                        : 'bg-white text-slate-600 border-[#e8ecf0] hover:border-[#4361ee] hover:text-[#4361ee]',
                    ].join(' ')}
                  >
                    <IconFilter />
                    <span>{filter !== 'all' ? activeFilterLabel : 'Filter'}</span>
                    {filter !== 'all' && (
                      <span
                        onClick={e => { e.stopPropagation(); setFilter('all'); setShowAll(false); }}
                        className="ml-0.5 hover:opacity-70 transition-opacity"
                      >
                        <IconX />
                      </span>
                    )}
                  </button>

                  {showFilter && (
                    <FilterDropdown
                      filter={filter}
                      setFilter={(f) => { setFilter(f); setShowAll(false); }}
                      counts={filterCounts}
                      onClose={() => setShowFilter(false)}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* ── Task Cards + Issue Cards — unified ─────────────────────── */}
            {(loading || issuesLoading) ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 animate-pulse">
                    <div className="h-3 bg-slate-200 rounded w-1/4 mb-3" />
                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-slate-100 rounded w-1/2 mb-4" />
                    <div className="h-1.5 bg-slate-100 rounded w-full mb-4" />
                    <div className="flex justify-between">
                      <div className="flex gap-2 items-center">
                        <div className="w-7 h-7 bg-slate-200 rounded-lg" />
                        <div className="h-3 bg-slate-100 rounded w-20" />
                      </div>
                      <div className="h-3 bg-slate-100 rounded w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 && myIssues.length === 0 ? (
              /* ── Nothing at all ── */
              <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-slate-100">
                <div className="mb-4 text-slate-300">
                  <IconEmpty />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">
                  {searchQuery ? 'No tasks match your search' : 'No tasks here yet'}
                </h3>
                <p className="text-slate-500 text-sm mb-5">
                  {searchQuery ? 'Try a different search term.' : 'Create the first task for this project.'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => router.push(`/workspace/${projectId}/ws-create-task`)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  >
                    + Create Task
                  </button>
                )}
              </div>
            ) : (
              /* ── Has tasks OR issues (or both) ── */
              <>
                {/* Task cards — only render when there are tasks */}
                {filtered.length > 0 && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {visibleTasks.map(task => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onClick={() => router.push(`/workspace/${projectId}/ws-view`)}
                        />
                      ))}
                    </div>
                    {filtered.length > SHOW_COUNT && (
                      <div className="mt-5 text-center">
                        <button
                          onClick={() => setShowAll(v => !v)}
                          className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-all"
                        >
                          {showAll ? 'Show Less' : `Show All ${filtered.length} Tasks`}
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* Issue cards — rendered directly in My Tasks, no separate section */}
                {myIssues.length > 0 && (
                  <>
                    {/* Divider only when BOTH tasks and issues are present */}
                    {filtered.length > 0 && (
                      <div className="flex items-center gap-3 mt-6 mb-4">
                        <div className="h-px flex-1 bg-slate-200" />
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-widest select-none">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                            <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                          </svg>
                          Issues
                          <span className="ml-0.5 px-1.5 py-0.5 bg-[#eff3ff] text-[#4361ee] rounded-full text-[10px] font-bold normal-case tracking-normal">
                            {myIssues.length}
                          </span>
                        </span>
                        <div className="h-px flex-1 bg-slate-200" />
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {myIssues.map(issue => (
                        <IssueCard key={issue.id} issue={issue} />
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
