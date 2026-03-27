'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import WsSidebar from '@/components/workspace/WsSidebar';
import WsTopbar from '@/components/workspace/WsTopbar';

type ViewMode = 'kanban' | 'table' | 'progress';

interface WsTask {
  taskID: string;
  taskName: string;
  status: 'todo' | 'in-progress' | 'completed';
  priority: 'critical' | 'medium' | 'low';
  assigneeName: string;
  assigneeAvatar: string;
  assigneeColor: string;
  dueDate: string;
  progress: number;
  tags: string[];
}

const mockWsTasks: WsTask[] = [
  { taskID: 'TASK-101', taskName: 'Design authentication flow diagrams', status: 'in-progress', priority: 'critical', assigneeName: 'Rahul Kumar', assigneeAvatar: 'RK', assigneeColor: '#4361ee', dueDate: 'Mar 18', progress: 60, tags: ['Design', 'Auth'] },
  { taskID: 'TASK-102', taskName: 'Write unit tests for payment module', status: 'todo', priority: 'medium', assigneeName: 'Sneha Patel', assigneeAvatar: 'SP', assigneeColor: '#06d6a0', dueDate: 'Mar 20', progress: 0, tags: ['Testing'] },
  { taskID: 'TASK-103', taskName: 'Update API documentation', status: 'completed', priority: 'low', assigneeName: 'Vishal Tiwari', assigneeAvatar: 'VT', assigneeColor: '#3a86ff', dueDate: 'Mar 15', progress: 100, tags: ['Docs'] },
  { taskID: 'TASK-104', taskName: 'Fix login timeout bug', status: 'in-progress', priority: 'critical', assigneeName: 'Arjun Mehta', assigneeAvatar: 'AM', assigneeColor: '#7209b7', dueDate: 'Mar 17', progress: 90, tags: ['Bug'] },
  { taskID: 'TASK-105', taskName: 'Mobile responsive layout', status: 'todo', priority: 'medium', assigneeName: 'Priya Das', assigneeAvatar: 'PD', assigneeColor: '#f9a825', dueDate: 'Mar 22', progress: 10, tags: ['UI', 'Mobile'] },
  { taskID: 'TASK-106', taskName: 'Set up CI/CD pipeline', status: 'in-progress', priority: 'medium', assigneeName: 'Rahul Kumar', assigneeAvatar: 'RK', assigneeColor: '#4361ee', dueDate: 'Mar 19', progress: 45, tags: ['DevOps'] },
  { taskID: 'TASK-107', taskName: 'Database index optimization', status: 'in-progress', priority: 'low', assigneeName: 'Vishal Tiwari', assigneeAvatar: 'VT', assigneeColor: '#3a86ff', dueDate: 'Mar 21', progress: 80, tags: ['DB'] },
  { taskID: 'TASK-108', taskName: 'Implement push notifications', status: 'completed', priority: 'medium', assigneeName: 'Sneha Patel', assigneeAvatar: 'SP', assigneeColor: '#06d6a0', dueDate: 'Mar 14', progress: 100, tags: ['Feature'] },
];

const PRIORITY_BADGE: Record<string, string> = {
  critical: '🔴 Critical',
  medium: '🟡 Steady',
  low: '🔵 Low',
};

const STATUS_COLOR: Record<string, string> = {
  todo: 'bg-slate-100 text-slate-600',
  'in-progress': 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
};

// ─── Kanban Board ─────────────────────────────────────────────────────────────

function WsKanbanBoard({ tasks }: { tasks: WsTask[] }) {
  const columns = [
    { id: 'todo', label: 'To Do', icon: '📋', color: 'border-slate-300 bg-slate-50' },
    { id: 'in-progress', label: 'In Progress', icon: '⚡', color: 'border-blue-300 bg-blue-50' },
    { id: 'completed', label: 'Done', icon: '✅', color: 'border-green-300 bg-green-50' },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id);
        return (
          <div key={col.id} className={`rounded-2xl border-2 ${col.color} p-4 min-h-[400px]`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-800">
                <span>{col.icon}</span>
                <span>{col.label}</span>
              </div>
              <span className="bg-white text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full border border-slate-200">
                {colTasks.length}
              </span>
            </div>
            <div className="space-y-3">
              {colTasks.map((task) => (
                <div
                  key={task.taskID}
                  className="bg-white rounded-xl p-3.5 border border-slate-100 hover:border-blue-200 hover:shadow-md cursor-pointer transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-[10px] font-mono text-slate-400">{task.taskID}</span>
                    <span className="text-[10px] text-slate-500">{task.dueDate}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 mb-2 line-clamp-2">{task.taskName}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {task.tags.map((t) => (
                      <span key={t} className="text-[9px] font-semibold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ backgroundColor: task.assigneeColor }}
                    >
                      {task.assigneeAvatar}
                    </div>
                    <div className="flex-1 mx-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${task.progress}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold">{task.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Table View ───────────────────────────────────────────────────────────────

function WsTableView({ tasks }: { tasks: WsTask[] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            {['Task ID', 'Task Name', 'Assignee', 'Priority', 'Status', 'Due Date', 'Progress'].map((h) => (
              <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {tasks.map((task) => (
            <tr key={task.taskID} className="hover:bg-slate-50 transition-colors cursor-pointer">
              <td className="px-5 py-3.5 text-xs font-mono text-slate-400">{task.taskID}</td>
              <td className="px-5 py-3.5">
                <div className="text-sm font-semibold text-slate-900">{task.taskName}</div>
                <div className="flex gap-1 mt-1">
                  {task.tags.map((t) => (
                    <span key={t} className="text-[9px] font-semibold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                      {t}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: task.assigneeColor }}
                  >
                    {task.assigneeAvatar}
                  </div>
                  <span className="text-xs text-slate-700 font-medium">{task.assigneeName}</span>
                </div>
              </td>
              <td className="px-5 py-3.5">
                <span className="text-xs font-semibold">{PRIORITY_BADGE[task.priority]}</span>
              </td>
              <td className="px-5 py-3.5">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[task.status]}`}>
                  {task.status.replace('-', ' ')}
                </span>
              </td>
              <td className="px-5 py-3.5 text-xs text-slate-500">{task.dueDate}</td>
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${task.progress}%` }} />
                  </div>
                  <span className="text-xs text-slate-500 font-semibold">{task.progress}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Progress View ────────────────────────────────────────────────────────────

function WsProgressView({ tasks }: { tasks: WsTask[] }) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const inProgress = tasks.filter((t) => t.status === 'in-progress').length;
  const todo = tasks.filter((t) => t.status === 'todo').length;
  const overallPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const statusBreakdown = [
    { label: 'Completed', count: completed, color: '#10b981', pct: total > 0 ? Math.round((completed / total) * 100) : 0 },
    { label: 'In Progress', count: inProgress, color: '#3b82f6', pct: total > 0 ? Math.round((inProgress / total) * 100) : 0 },
    { label: 'To Do', count: todo, color: '#94a3b8', pct: total > 0 ? Math.round((todo / total) * 100) : 0 },
  ];

  return (
    <div className="grid grid-cols-2 gap-5">
      {/* Overall Progress Circle */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col items-center justify-center">
        <h3 className="text-base font-bold text-slate-900 mb-6 self-start">Project Progress</h3>
        <div className="relative w-36 h-36 mb-4">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="12" />
            <circle
              cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="12"
              strokeDasharray={`${overallPct * 2.51} 251`}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-slate-900">{overallPct}%</span>
            <span className="text-xs text-slate-400">Done</span>
          </div>
        </div>
        <p className="text-sm text-slate-500">{completed} of {total} tasks completed</p>
      </div>

      {/* Status Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="text-base font-bold text-slate-900 mb-5">Status Breakdown</h3>
        <div className="space-y-4">
          {statusBreakdown.map((s) => (
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

      {/* Task-level Progress */}
      <div className="col-span-2 bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="text-base font-bold text-slate-900 mb-5">Individual Task Progress</h3>
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.taskID} className="flex items-center gap-4">
              <span className="text-xs font-mono text-slate-400 w-20 flex-shrink-0">{task.taskID}</span>
              <span className="text-sm text-slate-700 font-medium flex-1 truncate">{task.taskName}</span>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                style={{ backgroundColor: task.assigneeColor }}
              >
                {task.assigneeAvatar}
              </div>
              <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden flex-shrink-0">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${task.progress}%` }} />
              </div>
              <span className="text-xs font-bold text-slate-600 w-10 text-right">{task.progress}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WsViewPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [activeView, setActiveView] = useState<ViewMode>('kanban');

  const views: { id: ViewMode; label: string; icon: string }[] = [
    { id: 'kanban', label: 'Kanban', icon: '📌' },
    { id: 'table', label: 'Table', icon: '📊' },
    { id: 'progress', label: 'Progress', icon: '📈' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <WsSidebar projectId={projectId} projectName={projectId} />

      <div className="flex-1 flex flex-col overflow-hidden ml-[220px]">
        <WsTopbar
          title="Task View"
          subtitle="Track & manage"
          projectId={projectId}
          extraAction={
            <button
              onClick={() => router.push(`/workspace/${projectId}/ws-create-task`)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-blue-500/25"
            >
              <span>+</span> New Task
            </button>
          }
        />

        <main className="flex-1 overflow-auto pt-6 px-8 pb-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <span>👁️</span> Task View
              </h2>
              <p className="text-sm text-slate-500 mt-1">Kanban, Table, Progress</p>
            </div>
            {/* View Switcher */}
            <div className="flex bg-white rounded-xl border border-slate-200 p-1 gap-1">
              {views.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setActiveView(v.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeView === v.id
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{v.icon}</span> {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Views */}
          {activeView === 'kanban' && <WsKanbanBoard tasks={mockWsTasks} />}
          {activeView === 'table' && <WsTableView tasks={mockWsTasks} />}
          {activeView === 'progress' && <WsProgressView tasks={mockWsTasks} />}
        </main>
      </div>
    </div>
  );
}
