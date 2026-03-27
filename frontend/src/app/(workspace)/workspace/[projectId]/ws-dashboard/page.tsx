'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import WsSidebar from '@/components/workspace/WsSidebar';
import WsTopbar from '@/components/workspace/WsTopbar';
import StatsCard from '@/components/dashboard/StatsCard';
import { tasksService } from '@/lib/tasks.service';
import { projectsService } from '@/lib/projects.service';
import type { Task } from '@/types/task';

// ── Helpers ────────────────────────────────────────────────────────────────────
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getTodayLabel(): string {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function fmtDate(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

// ── Status / Priority style maps ───────────────────────────────────────────────
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

const priorityDot: Record<string, string> = {
  critical: '🔴',
  medium:   '🟡',
  low:      '🔵',
};

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
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${priorityBadge[task.priority]}`}>
          {priorityDot[task.priority]} {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
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

      {/* Progress */}
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
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
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

      {/* Recurring badge */}
      {task.isRecurring && (
        <div className="mt-2 flex items-center gap-1 text-[10px] text-purple-600 font-semibold">
          <span>🔁</span> {task.recurringFrequency || 'Recurring'}
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function WsDashboardPage() {
  const params  = useParams();
  const router  = useRouter();
  const projectId = params.projectId as string;

  const [tasks,       setTasks]       = useState<Task[]>([]);
  const [projectName, setProjectName] = useState<string>('');
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState<'all' | 'todo' | 'in-progress' | 'completed' | 'overdue'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll,     setShowAll]     = useState(false);

  // ── Fetch project name + tasks in parallel ─────────────────────────────────
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

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:      tasks.length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    completed:  tasks.filter(t => t.status === 'completed').length,
    overdue:    tasks.filter(t => t.status === 'overdue').length,
  }), [tasks]);

  // ── Filter + Search ────────────────────────────────────────────────────────
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

  const SHOW_COUNT = 6;
  const visibleTasks = showAll ? filtered : filtered.slice(0, SHOW_COUNT);

  // ── Filter tabs ────────────────────────────────────────────────────────────
  const filterTabs = [
    { key: 'all',         label: 'All',         count: tasks.length },
    { key: 'todo',        label: 'To Do',       count: tasks.filter(t => t.status === 'todo').length },
    { key: 'in-progress', label: 'In Progress', count: stats.inProgress },
    { key: 'completed',   label: 'Completed',   count: stats.completed },
    { key: 'overdue',     label: 'Overdue',     count: stats.overdue },
  ] as const;

  return (
    <div className="flex min-h-screen" style={{ background: '#f4f6fb' }}>
      <WsSidebar projectId={projectId} projectName={projectName || projectId} />

      <div className="flex-1 md:ml-[220px]">
        <WsTopbar
          title=""
          subtitle=""
          projectId={projectId}
        />

        <main className="p-4 md:p-5">
          <div className="max-w-7xl mx-auto">

            {/* Project Identity */}
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

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
              <StatsCard
                label="Total Tasks"
                value={stats.total}
                trend=""
                icon="📋"
                variant="info"
              />
              <StatsCard
                label="In Progress"
                value={stats.inProgress}
                trend=""
                icon="⚡"
                variant="info"
              />
              <StatsCard
                label="Completed"
                value={stats.completed}
                trend=""
                icon="✅"
                variant="success"
              />
              <StatsCard
                label="Overdue"
                value={stats.overdue}
                trend=""
                icon="🔴"
                variant="warning"
              />
            </div>

            {/* My Tasks Header + Search + Filters */}
            <div
              className="flex flex-wrap items-center justify-between gap-3 mb-4"
              style={{ fontFamily: 'var(--fd-font, Inter, Poppins, sans-serif)' }}
            >
              {/* Left: title + count badge */}
              <div className="flex items-center gap-3">
                <h3 className="text-[1.25rem] font-semibold text-[#1a1a2e] tracking-tight">My Tasks</h3>
                <span className="px-2.5 py-1 bg-[#eff3ff] text-[#4361ee] rounded-full text-[0.75rem] font-bold leading-none">
                  {filtered.length}
                </span>
              </div>

              {/* Right: search + filter chips */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Search */}
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a828c] pointer-events-none"
                    width="15" height="15" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2.2"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search tasks, assignee…"
                    className="pl-9 pr-4 py-1.5 w-[190px] bg-white border border-[#e8ecf0] rounded-xl text-[0.82rem] text-[#1a1a2e] placeholder:text-[#7a828c] focus:outline-none focus:border-[#4361ee] focus:ring-2 focus:ring-[#4361ee]/10 transition-all"
                  />
                </div>

                {/* Filter chips */}
                <div className="flex items-center gap-2 flex-wrap">
                  {filterTabs.map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => { setFilter(tab.key); setShowAll(false); }}
                      className={`px-3 py-1 rounded-full text-[0.78rem] font-medium transition-all duration-200 ${
                        filter === tab.key
                          ? 'bg-[#4361ee] text-white shadow-[0_2px_8px_rgba(67,97,238,0.25)]'
                          : 'bg-white text-[#7a828c] border border-[#e8ecf0] hover:border-[#4361ee] hover:text-[#4361ee]'
                      }`}
                    >
                      {tab.label}
                      <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                        filter === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Task Cards */}
            {loading ? (
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
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-slate-100">
                <div className="text-6xl mb-4">📭</div>
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

                {/* Show More / Less */}
                {filtered.length > SHOW_COUNT && (
                  <div className="mt-5 text-center">
                    <button
                      onClick={() => setShowAll(v => !v)}
                      className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-all"
                    >
                      {showAll
                        ? '↑ Show Less'
                        : `↓ Show All ${filtered.length} Tasks`}
                    </button>
                  </div>
                )}
              </>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}

