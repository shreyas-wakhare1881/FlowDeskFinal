'use client';

import { useState, useEffect } from 'react';
import { useProjects, type MockProject } from '@/lib/ProjectsContext';
import ProjectDetailModal from '@/components/dashboard/ProjectDetailModal';

interface Task {
  id: string;
  title: string;
  priority: 'critical' | 'medium' | 'low';
  assignee: { name: string; avatar: string; color: string };
  teamName: string;
  teamID: string;
  allTeams: { teamID: string; teamName: string }[];
  dueDate: string;
  rawDueDate: string;
  progress: number;
  status: 'todo' | 'progress' | 'done';
}

// ── Overdue helper ────────────────────────────────────────────────────────────
const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

function isOverdue(rawDueDate: string, status: Task['status']): boolean {
  if (status === 'done') return false;
  const d = new Date(rawDueDate);
  return !isNaN(d.getTime()) && d < TODAY;
}

const priorityLabels = {
  critical: { emoji: '🔴', label: 'Critical', class: 'danger' },
  medium: { emoji: '🟡', label: 'Steady', class: 'warning' },
  low: { emoji: '🔵', label: 'Low', class: 'info' },
};

const columns = [
  { id: 'todo', title: 'To Do', color: '#7a828c' },
  { id: 'progress', title: 'In Progress', color: '#3a86ff' },
  { id: 'done', title: 'Done', color: '#06d6a0' },
];

const STATUS_FROM_LABEL: Record<string, Task['status']> = {
  'Pending': 'todo', 'To Do': 'todo',
  'In Progress': 'progress', 'Overdue': 'progress',
  'Completed': 'done',
};

function projectToTask(p: MockProject): Task {
  return {
    id: p.projectID,
    title: p.projectName,
    priority: p.priority.toLowerCase() as Task['priority'],
    assignee: {
      name: p.assigneeName.split(' ')[0],
      avatar: p.assigneeAvatar,
      color: p.assigneeColor,
    },
    teamName: p.teams?.[0]?.teamName ?? p.teamName,
    teamID: p.teams?.[0]?.teamID ?? p.teamID ?? '',
    allTeams: (p.teams ?? []).map(t => ({ teamID: t.teamID, teamName: t.teamName })),
    dueDate: p.dueDate.split(',')[0],
    rawDueDate: p.dueDate,
    progress: p.progress ?? 0,
    status: STATUS_FROM_LABEL[p.statusLabel] ?? 'todo',
  };
}

const INITIAL_VISIBLE = 5;

export default function KanbanBoard() {
  const { projects, updateProjectStatus } = useProjects();
  const [tasks, setTasks] = useState<Task[]>(() => projects.map(projectToTask));
  const [selectedProject, setSelectedProject] = useState<MockProject | null>(null);

  // ── Per-column visible count ───────────────────────────────────────────────
  const [visibleCount, setVisibleCount] = useState<Record<string, number>>(
    () => Object.fromEntries(columns.map(c => [c.id, INITIAL_VISIBLE]))
  );

  const showMore  = (colId: string, total: number) =>
    setVisibleCount(prev => ({ ...prev, [colId]: total }));
  const showLess  = (colId: string) =>
    setVisibleCount(prev => ({ ...prev, [colId]: INITIAL_VISIBLE }));

  // ── Filters ────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'todo' | 'in-progress' | 'completed'>('all');

  const handleCardClick = (taskId: string) => {
    const found = projects.find(p => p.projectID === taskId) ?? null;
    setSelectedProject(found);
  };

  // Sync new projects added to context after initial render
  useEffect(() => {
    setTasks(current => {
      const existingIds = new Set(current.map(t => t.id));
      const newTasks = projects
        .filter(p => !existingIds.has(p.projectID))
        .map(projectToTask);
      return newTasks.length ? [...newTasks, ...current] : current;
    });
  }, [projects]);

  const [draggedTask, setDraggedTask] = useState<string | null>(null);

  const getTasksByColumn = (columnId: string) => {
    return tasks.filter((task) => {
      // Column filter
      if (task.status !== columnId) return false;
      
      // Status filter (all/todo/in-progress/completed)
      if (filter !== 'all') {
        if (filter === 'todo' && task.status !== 'todo') return false;
        if (filter === 'in-progress' && task.status !== 'progress') return false;
        if (filter === 'completed' && task.status !== 'done') return false;
      }
      
      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const overdue = isOverdue(task.rawDueDate, task.status);
        const matches =
          task.title.toLowerCase().includes(q) ||
          task.allTeams.some(t =>
            t.teamName.toLowerCase().includes(q) ||
            t.teamID.toLowerCase().includes(q)
          ) ||
          task.priority.toLowerCase().includes(q) ||
          (q === 'steady' && task.priority === 'medium') ||
          (q === 'overdue' && overdue);
        if (!matches) return false;
      }
      return true;
    });
  };

  const handleDragStart = (taskId: string) => { setDraggedTask(taskId); };
  const handleDragOver  = (e: React.DragEvent) => { e.preventDefault(); };
  const handleDrop = (columnId: string) => {
    if (!draggedTask) return;
    // Update local kanban UI
    setTasks(prev => prev.map(t => t.id === draggedTask ? { ...t, status: columnId as Task['status'] } : t));
    // Update shared context (dashboard stats, progress view, project cards all reflect this)
    updateProjectStatus(draggedTask, columnId);
    setDraggedTask(null);
  };

  const renderColumnHeader = (column: typeof columns[number], taskCount: number) => (
    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-300">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: column.color }} />
        <span className="font-bold text-slate-900">{column.title}</span>
      </div>
      <span className="bg-slate-200 text-slate-700 text-xs font-bold px-2 py-1 rounded-full">
        {taskCount}
      </span>
      {column.id === 'todo' ? (
        <button
          onClick={() => alert('➕ Task creation will be added!')}
          className="w-6 h-6 bg-slate-300 hover:bg-slate-400 text-slate-700 rounded-md font-bold transition-all"
        >+</button>
      ) : (
        <span className="w-6 h-6" aria-hidden="true" />
      )}
    </div>
  );

  return (
    <>
      {/* ── Search + Filters ─────────────────────────────────────────────────── */}
      <div className="mb-5 flex items-center gap-3">
        {/* Search bar */}
        <div className="relative w-64">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search projects…"
            className="w-full pl-9 pr-8 py-2 bg-white border-2 border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-lg leading-none">
              ×
            </button>
          )}
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-2">
          {[
            { value: 'all',         label: 'All'         },
            { value: 'todo',        label: 'To Do'       },
            { value: 'in-progress', label: 'In Progress' },
            { value: 'completed',   label: 'Completed'   },
          ].map((chip) => (
            <button
              key={chip.value}
              onClick={() => setFilter(chip.value as typeof filter)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                filter === chip.value
                  ? 'bg-[#4361ee] text-white shadow-[0_2px_8px_rgba(67,97,238,0.25)]'
                  : 'bg-white text-[#7a828c] border border-[#e8ecf0] hover:border-[#4361ee] hover:text-[#4361ee]'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Kanban Columns ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {columns.map((column) => {
          const columnTasks = getTasksByColumn(column.id);
          const limit = visibleCount[column.id] ?? INITIAL_VISIBLE;
          const visibleTasks = columnTasks.slice(0, limit);
          const hasMore = columnTasks.length > limit;
          const isExpanded = limit >= columnTasks.length && columnTasks.length > INITIAL_VISIBLE;
          return (
            <div
              key={column.id}
              className="bg-slate-50 rounded-2xl p-4 min-h-[500px] border-2 border-slate-200"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(column.id)}
            >
              {renderColumnHeader(column, columnTasks.length)}

              <div className="space-y-3">
                {visibleTasks.map((task) => {
                  const overdue = isOverdue(task.rawDueDate, task.status);
                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => handleDragStart(task.id)}
                      onClick={() => handleCardClick(task.id)}
                      className={`
                        bg-white rounded-xl border-2 shadow-sm cursor-pointer hover:shadow-lg transition-all overflow-hidden
                        ${task.priority === 'critical'
                          ? 'border-red-200 hover:border-red-400'
                          : task.priority === 'medium'
                          ? 'border-amber-200 hover:border-amber-400'
                          : 'border-blue-200 hover:border-blue-400'
                        }
                      `}
                    >
                      {/* Card Body */}
                      <div className="p-4">
                        {/* Overdue badge */}
                        {overdue && (
                          <div className="flex items-center gap-1 mb-2">
                            <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-md border border-red-200 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse inline-block" />
                              Overdue
                            </span>
                          </div>
                        )}

                        <div className="font-bold text-slate-900 text-sm mb-3">
                          {task.title}
                        </div>

                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className={`px-2 py-1 rounded-md font-semibold ${
                            task.priority === 'critical' ? 'bg-red-50 text-red-600'
                            : task.priority === 'medium'  ? 'bg-amber-50 text-amber-600'
                            : 'bg-blue-50 text-blue-600'
                          }`}>
                            {priorityLabels[task.priority].emoji} {priorityLabels[task.priority].label}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                              style={{ backgroundColor: task.assignee.color }}
                            >
                              {task.assignee.avatar}
                            </div>
                            <span className="text-slate-600 font-medium">{task.assignee.name}</span>
                          </div>

                          <span className="font-medium text-slate-500">
                            {task.dueDate}
                          </span>
                        </div>
                      </div>

                      {/* Progress bar — hidden for done column */}
                      {task.status !== 'done' && (
                        <div className="px-4 pb-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  task.progress === 100 ? 'bg-emerald-500'
                                  : task.progress >= 60   ? 'bg-blue-500'
                                  : task.progress >= 30   ? 'bg-amber-500'
                                  : 'bg-red-400'
                                }`}
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 shrink-0">
                              {task.progress}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {columnTasks.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-300">
                    <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span className="text-xs font-medium">No cards</span>
                  </div>
                )}

                {/* ── View More / Less ─────────────────────────────── */}
                {hasMore && (
                  <button
                    onClick={() => showMore(column.id, columnTasks.length)}
                    className="w-full py-2 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-all"
                  >
                    View {columnTasks.length - limit} more ↓
                  </button>
                )}
                {isExpanded && (
                  <button
                    onClick={() => showLess(column.id)}
                    className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition-all"
                  >
                    Show less ↑
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedProject && (
        <ProjectDetailModal
          project={{
            ...selectedProject,
            progress: selectedProject.progress ?? 0,
            tasksTotal: selectedProject.tasksTotal ?? 0,
            tasksCompleted: selectedProject.tasksCompleted ?? 0,
          }}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </>
  );
}
