'use client';

import { useState } from 'react';
import { useProjects } from '@/lib/ProjectsContext';

interface Project {
  id: string;
  name: string;
  progress: number;
  health: 'green' | 'yellow' | 'red';
  healthLabel: string;
  tasksCompleted: number;
  tasksTotal: number;
  dueDate: string;
  strokeColor: string;
}

const STROKE_PALETTE = ['#4361ee','#ef233c','#3a86ff','#06d6a0','#f9a825','#7209b7','#06b47e','#f97316','#0077b6','#e63946'];

export default function ProgressView() {
  const { projects: ctxProjects } = useProjects();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'todo' | 'in-progress' | 'completed'>('all');

  const allProjects: Project[] = ctxProjects.map((p, i) => {
    const pct = p.progress;
    const isOverdue = p.statusLabel === 'Overdue';
    const health: Project['health'] =
      pct >= 100 ? 'green' :
      pct >= 70 && !isOverdue ? 'green' :
      pct >= 40 ? 'yellow' : 'red';
    const healthLabel =
      pct >= 100 ? 'Completed' :
      health === 'green' ? 'On Track' :
      health === 'yellow' ? 'Caution' : 'At Risk';
    return {
      id: p.projectID,
      name: p.projectName,
      progress: pct,
      health,
      healthLabel,
      tasksCompleted: p.tasksCompleted,
      tasksTotal: p.tasksTotal,
      dueDate: isOverdue ? `Overdue – ${p.dueDate.split(',')[0]}` : p.dueDate,
      strokeColor: p.assigneeColor || STROKE_PALETTE[i % STROKE_PALETTE.length],
    };
  });

  // Apply filters
  const projects = allProjects.filter(p => {
    const statusLabel = ctxProjects.find(cp => cp.projectID === p.id)?.statusLabel;
    // Status filter
    if (filter !== 'all') {
      if (filter === 'todo' && statusLabel !== 'To Do') return false;
      if (filter === 'in-progress' && statusLabel !== 'In Progress') return false;
      if (filter === 'completed' && statusLabel !== 'Completed') return false;
    }
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q);
    }
    return true;
  });
  const getStrokeDashoffset = (progress: number) => {
    const circumference = 251; // 2 * PI * r (r=40 for the circle)
    return circumference - (circumference * progress) / 100;
  };

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <div
          key={project.id}
          onClick={() => alert(`📂 Opening project: ${project.name}`)}
          className="bg-white rounded-2xl border-2 border-slate-200 p-6 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer"
        >
          {/* Circular Progress */}
          <div className="relative flex justify-center mb-4">
            <svg
              width="100"
              height="100"
              viewBox="0 0 100 100"
            >
              {/* Track */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="6"
              />
              {/* Fill */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke={project.strokeColor}
                strokeWidth="6"
                strokeDasharray="251"
                strokeDashoffset={getStrokeDashoffset(project.progress)}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            {/* Percentage in center */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="text-2xl font-bold text-slate-900">
                {project.progress}%
              </div>
            </div>
          </div>

          {/* Project Name */}
          <div className="text-center mb-3">
            <h4 className="font-bold text-slate-900 text-base">
              {project.name}
            </h4>
          </div>

          {/* Health Status */}
          <div className="flex justify-center mb-3">
            <span
              className={`
                px-3 py-1.5 rounded-lg font-semibold text-xs
                ${
                  project.health === 'green'
                    ? 'bg-emerald-50 text-emerald-600'
                    : project.health === 'yellow'
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-red-50 text-red-600'
                }
              `}
            >
              {project.health === 'green' && '🟢'}
              {project.health === 'yellow' && '🟡'}
              {project.health === 'red' && '🔴'} {project.healthLabel}
            </span>
          </div>

          {/* Task Details */}
          <div className="text-center text-sm text-slate-600">
            <span className="font-semibold text-slate-900">
              {project.tasksCompleted}/{project.tasksTotal}
            </span>{' '}
            tasks done · Due {project.dueDate}
          </div>
        </div>
      ))}
      </div>
    </>
  );
}
