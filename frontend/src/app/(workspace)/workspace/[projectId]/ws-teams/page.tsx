'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import WsSidebar from '@/components/workspace/WsSidebar';
import WsTopbar from '@/components/workspace/WsTopbar';

type TeamViewMode = 'tree' | 'table' | 'cards';

interface WsMember {
  id: string;
  name: string;
  avatar: string;
  color: string;
  role: string;
  skills: string[];
  activeTasks: number;
  completedTasks: number;
  health: number;
  status: 'online' | 'offline' | 'away';
}

const mockMembers: WsMember[] = [
  { id: 'USER-001', name: 'Rahul Kumar', avatar: 'RK', color: '#4361ee', role: 'Backend Lead', skills: ['Node.js', 'API', 'DB'], activeTasks: 3, completedTasks: 12, health: 87, status: 'online' },
  { id: 'USER-002', name: 'Sneha Patel', avatar: 'SP', color: '#06d6a0', role: 'Frontend Dev', skills: ['React', 'CSS', 'UI'], activeTasks: 2, completedTasks: 9, health: 92, status: 'online' },
  { id: 'USER-003', name: 'Vishal Tiwari', avatar: 'VT', color: '#3a86ff', role: 'Full Stack', skills: ['React', 'Node', 'DB'], activeTasks: 4, completedTasks: 15, health: 78, status: 'away' },
  { id: 'USER-004', name: 'Arjun Mehta', avatar: 'AM', color: '#7209b7', role: 'DevOps Engineer', skills: ['Docker', 'K8s', 'CI/CD'], activeTasks: 1, completedTasks: 7, health: 95, status: 'online' },
  { id: 'USER-005', name: 'Priya Das', avatar: 'PD', color: '#f9a825', role: 'UI/UX Designer', skills: ['Figma', 'CSS', 'Motion'], activeTasks: 2, completedTasks: 11, health: 83, status: 'offline' },
  { id: 'USER-006', name: 'Karan Shah', avatar: 'KS', color: '#ef233c', role: 'QA Engineer', skills: ['Testing', 'Selenium', 'Jest'], activeTasks: 3, completedTasks: 8, health: 70, status: 'online' },
  { id: 'USER-007', name: 'Meera Joshi', avatar: 'MJ', color: '#2ec4b6', role: 'Backend Dev', skills: ['Python', 'FastAPI', 'ML'], activeTasks: 1, completedTasks: 5, health: 88, status: 'away' },
  { id: 'USER-008', name: 'Rohan Gupta', avatar: 'RG', color: '#ff6b35', role: 'Mobile Dev', skills: ['React Native', 'iOS'], activeTasks: 2, completedTasks: 6, health: 80, status: 'online' },
];

const STATUS_DOT: Record<string, string> = {
  online: 'bg-green-500',
  away: 'bg-yellow-400',
  offline: 'bg-slate-300',
};

function healthColor(h: number) {
  if (h >= 85) return 'text-green-600 bg-green-50';
  if (h >= 70) return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
}

// ─── Tree View ────────────────────────────────────────────────────────────────

function WsTreeView({ members }: { members: WsMember[] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6">
      <div className="flex flex-col items-center">
        {/* Team Lead Node */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl px-8 py-4 shadow-lg shadow-blue-500/25 mb-2 text-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center font-bold">RK</div>
            <div>
              <div className="font-bold">Rahul Kumar</div>
              <div className="text-blue-200 text-xs">Team Lead</div>
            </div>
          </div>
        </div>

        {/* Connector */}
        <div className="w-0.5 h-8 bg-slate-200" />

        {/* Horizontal line */}
        <div className="w-full flex items-start justify-center relative">
          <div className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-slate-200" />
          <div className="grid grid-cols-4 gap-4 w-full pt-0">
            {members.slice(1, 5).map((m, i) => (
              <div key={m.id} className="flex flex-col items-center">
                <div className="w-0.5 h-8 bg-slate-200 mb-2" />
                <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-center w-full hover:border-blue-300 transition-colors">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold mx-auto mb-2"
                    style={{ backgroundColor: m.color }}
                  >
                    {m.avatar}
                  </div>
                  <div className="text-xs font-bold text-slate-900">{m.name.split(' ')[0]}</div>
                  <div className="text-[10px] text-slate-500">{m.role}</div>
                  <div className={`text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 ${healthColor(m.health)}`}>
                    {m.health}% health
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-4 gap-4 w-full mt-4 pl-4">
          {members.slice(4).map((m) => (
            <div key={m.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center hover:border-blue-200 transition-colors">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold mx-auto mb-1.5"
                style={{ backgroundColor: m.color }}
              >
                {m.avatar}
              </div>
              <div className="text-[11px] font-bold text-slate-900">{m.name.split(' ')[0]}</div>
              <div className="text-[9px] text-slate-400">{m.role}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Table View ───────────────────────────────────────────────────────────────

function WsTeamTable({ members }: { members: WsMember[] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            {['Member', 'Role', 'Skills', 'Active', 'Completed', 'Health', 'Status'].map((h) => (
              <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {members.map((m) => (
            <tr key={m.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: m.color }}
                    >
                      {m.avatar}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${STATUS_DOT[m.status]}`} />
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{m.name}</span>
                </div>
              </td>
              <td className="px-5 py-3.5 text-xs text-slate-600 font-medium">{m.role}</td>
              <td className="px-5 py-3.5">
                <div className="flex flex-wrap gap-1">
                  {m.skills.map((s) => (
                    <span key={s} className="text-[10px] font-semibold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                      {s}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-5 py-3.5 text-sm text-blue-600 font-bold">{m.activeTasks}</td>
              <td className="px-5 py-3.5 text-sm text-green-600 font-bold">{m.completedTasks}</td>
              <td className="px-5 py-3.5">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${healthColor(m.health)}`}>
                  {m.health}%
                </span>
              </td>
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${STATUS_DOT[m.status]}`} />
                  <span className="text-xs text-slate-500 capitalize">{m.status}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Cards View ───────────────────────────────────────────────────────────────

function WsTeamCards({ members }: { members: WsMember[] }) {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {members.map((m) => (
        <div
          key={m.id}
          className="bg-white rounded-2xl border border-slate-100 p-5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all"
        >
          {/* Avatar + Online status */}
          <div className="flex items-start justify-between mb-4">
            <div className="relative">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-bold"
                style={{ backgroundColor: m.color }}
              >
                {m.avatar}
              </div>
              <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${STATUS_DOT[m.status]}`} />
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${healthColor(m.health)}`}>
              {m.health}%
            </span>
          </div>

          <h4 className="text-sm font-bold text-slate-900 mb-0.5">{m.name}</h4>
          <p className="text-xs text-slate-500 mb-3">{m.role}</p>

          {/* Skills */}
          <div className="flex flex-wrap gap-1 mb-4">
            {m.skills.map((s) => (
              <span key={s} className="text-[9px] font-semibold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                {s}
              </span>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-blue-50 rounded-xl p-2">
              <div className="text-lg font-bold text-blue-600">{m.activeTasks}</div>
              <div className="text-[9px] text-slate-500 font-medium">Active</div>
            </div>
            <div className="bg-green-50 rounded-xl p-2">
              <div className="text-lg font-bold text-green-600">{m.completedTasks}</div>
              <div className="text-[9px] text-slate-500 font-medium">Done</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WsTeamsPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [viewMode, setViewMode] = useState<TeamViewMode>('cards');

  const totalMembers = mockMembers.length;
  const activeMembers = mockMembers.filter((m) => m.status === 'online').length;
  const totalTasks = mockMembers.reduce((sum, m) => sum + m.activeTasks + m.completedTasks, 0);
  const avgHealth = Math.round(mockMembers.reduce((sum, m) => sum + m.health, 0) / mockMembers.length);

  const views: { id: TeamViewMode; icon: string; label: string }[] = [
    { id: 'tree', icon: '🌳', label: 'Tree' },
    { id: 'table', icon: '📊', label: 'Table' },
    { id: 'cards', icon: '👤', label: 'Cards' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <WsSidebar projectId={projectId} projectName={projectId} />

      <div className="flex-1 flex flex-col overflow-hidden ml-[220px]">
        <WsTopbar
          title="All Teams"
          subtitle="Member management"
          projectId={projectId}
          extraAction={
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-blue-500/25">
              <span>+</span> Add Member
            </button>
          }
        />

        <main className="flex-1 overflow-auto pt-6 px-8 pb-8">
          {/* Stats Panel */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Members', value: totalMembers, icon: '👥', color: 'bg-blue-50 text-blue-600' },
              { label: 'Active Now', value: activeMembers, icon: '🟢', color: 'bg-green-50 text-green-600' },
              { label: 'Total Tasks', value: totalTasks, icon: '📋', color: 'bg-purple-50 text-purple-600' },
              { label: 'Avg Health', value: `${avgHealth}%`, icon: '❤️', color: 'bg-pink-50 text-pink-600' },
            ].map((s) => (
              <div key={s.label} className={`${s.color} rounded-2xl p-5 border border-white/60`}>
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-3xl font-bold text-slate-900 mb-0.5">{s.value}</div>
                <div className="text-sm font-medium text-slate-600">{s.label}</div>
              </div>
            ))}
          </div>

          {/* View Switcher */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-slate-900">Team Members</h2>
            <div className="flex bg-white rounded-xl border border-slate-200 p-1 gap-1">
              {views.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setViewMode(v.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    viewMode === v.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {v.icon} {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* View Output */}
          {viewMode === 'tree' && <WsTreeView members={mockMembers} />}
          {viewMode === 'table' && <WsTeamTable members={mockMembers} />}
          {viewMode === 'cards' && <WsTeamCards members={mockMembers} />}
        </main>
      </div>
    </div>
  );
}
