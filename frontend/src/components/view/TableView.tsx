'use client';

import { useState } from 'react';
import { useProjects } from '@/lib/ProjectsContext';
import ProjectDetailModal from '@/components/dashboard/ProjectDetailModal';

interface TableProject {
  id: string;
  taskName: string;
  assignedTo: { name: string; avatar: string; color: string };
  priority: 'critical' | 'medium' | 'low';
  startDate: string;
  dueDate: string;
  status: string;
  statusClass: 'info' | 'warning' | 'success' | 'danger';
  progress: number;
}

const STATUS_CLASS_MAP: Record<string, TableProject['statusClass']> = {
  'In Progress': 'info', 'Completed': 'success',
  'Overdue': 'danger',   'Pending': 'warning',   'To Do': 'info',
};

export default function TableView() {
  const { projects: ctxProjects } = useProjects();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedProject = ctxProjects.find(p => p.projectID === selectedId) ?? null;
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'todo' | 'in-progress' | 'completed'>('all');

  const allProjects: TableProject[] = ctxProjects.map(p => ({
    id: p.projectID,
    taskName: p.projectName,
    assignedTo: { name: p.assigneeName, avatar: p.assigneeAvatar, color: p.assigneeColor },
    priority: p.priority.toLowerCase() as TableProject['priority'],
    startDate: p.assignedDate,
    dueDate: p.dueDate,
    status: p.statusLabel,
    statusClass: STATUS_CLASS_MAP[p.statusLabel] ?? 'info',
    progress: p.progress,
  }));

  // Apply filters
  const projects = allProjects.filter(p => {
    // Status filter
    if (filter !== 'all') {
      if (filter === 'todo' && p.status !== 'To Do') return false;
      if (filter === 'in-progress' && p.status !== 'In Progress') return false;
      if (filter === 'completed' && p.status !== 'Completed') return false;
    }
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.taskName.toLowerCase().includes(q) || 
             p.assignedTo.name.toLowerCase().includes(q);
    }
    return true;
  });
  return (
    <>
      {/* Search + Filters */}
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

      <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
            <tr>
              <th className="px-6 py-4 text-left font-bold text-slate-700 text-sm">
                Project Name
              </th>
              <th className="px-6 py-4 text-left font-bold text-slate-700 text-sm">
                Assigned To
              </th>
              <th className="px-6 py-4 text-left font-bold text-slate-700 text-sm">
                Priority
              </th>
              <th className="px-6 py-4 text-left font-bold text-slate-700 text-sm">
                Start Date
              </th>
              <th className="px-6 py-4 text-left font-bold text-slate-700 text-sm">
                Due Date
              </th>
              <th className="px-6 py-4 text-left font-bold text-slate-700 text-sm">
                Status
              </th>
              <th className="px-6 py-4 text-left font-bold text-slate-700 text-sm">
                Progress
              </th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project, index) => (
              <tr
                key={project.id}
                onClick={() => setSelectedId(project.id)}
                className={`
                  cursor-pointer hover:bg-blue-50 transition-all border-b border-slate-100
                  ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}
                `}
              >
                <td className="px-6 py-4">
                  <span className="font-bold text-slate-900">{project.taskName}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                      style={{ backgroundColor: project.assignedTo.color }}
                    >
                      {project.assignedTo.avatar}
                    </div>
                    <span className="font-medium text-slate-700">
                      {project.assignedTo.name}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div
                      className={`
                        w-2.5 h-2.5 rounded-full
                        ${
                          project.priority === 'critical'
                            ? 'bg-red-500'
                            : project.priority === 'medium'
                            ? 'bg-amber-500'
                            : 'bg-blue-500'
                        }
                      `}
                    ></div>
                    <span className="font-medium text-slate-700 capitalize">
                      {project.priority}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-slate-600 font-medium">{project.startDate}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-slate-600 font-medium">{project.dueDate}</span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`
                      px-3 py-1.5 rounded-lg font-semibold text-xs
                      ${
                        project.statusClass === 'success'
                          ? 'bg-emerald-50 text-emerald-600'
                          : project.statusClass === 'warning'
                          ? 'bg-amber-50 text-amber-600'
                          : project.statusClass === 'danger'
                          ? 'bg-red-50 text-red-600'
                          : 'bg-blue-50 text-blue-600'
                      }
                    `}
                  >
                    {project.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all"
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                    <span className="font-bold text-slate-700 text-sm min-w-[45px]">
                      {project.progress}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

      {selectedProject && (
        <ProjectDetailModal
          project={{
            ...selectedProject,
            progress: selectedProject.progress ?? 0,
            tasksTotal: selectedProject.tasksTotal ?? 0,
            tasksCompleted: selectedProject.tasksCompleted ?? 0,
          }}
          onClose={() => setSelectedId(null)}
        />
      )}
    </>
  );
}
