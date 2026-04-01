'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/shared/Sidebar';
import Topbar from '@/components/shared/Topbar';
import StatsCard from '@/components/dashboard/StatsCard';
import ProjectCard from '@/components/dashboard/ProjectCard';
import ActivityFeed from '@/features/catch-up-feed/ActivityFeed';
import TeamPulse from '@/features/team-pulse/TeamPulse';
import ProjectDetailModal from '@/components/dashboard/ProjectDetailModal';
import AddPeopleModal from '@/components/dashboard/AddPeopleModal';
import { useProjects } from '@/lib/ProjectsContext';
import { FEATURES } from '@/config/features';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { useRbac } from '@/lib/RbacContext';
import { projectsService } from '@/lib/projects.service';


// ── Dynamic greeting helpers ─────────────────────────────────────
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getTodayLabel(): string {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// ── Shared type for the detail modal ──────────────────────────────
interface ProjectCardData {
  projectID: string;
  projectName: string;
  projectDescription?: string;
  status: string;
  statusLabel: string;
  teamName: string;
  assigneeName: string;
  assigneeAvatar: string;
  assigneeColor: string;
  assignedDate: string;
  dueDate: string;
  priority: string;
  progress: number;
  tasksTotal: number;
  tasksCompleted: number;
  teamMembers?: { avatar: string; color: string; name: string }[];
  tags?: string[];
}

export default function DashboardPage() {
  const router = useRouter();
  // ── All project data lives in the shared context ──────────────────────────
  const { projects, loading, refreshProjects } = useProjects();
  const currentUser = useCurrentUser();
  const { canManage, loading: rbacLoading, role: globalRole } = useRbac();
  // PLACEHOLDER — remove the line below (needed for TS until mockProjects ref is gone)
  const _PLACEHOLDER = 'PRJ-001';
  void _PLACEHOLDER;

function _REMOVE_ME() { return [
  {
    projectID: 'PRJ-001',
    projectName: 'PLACEHOLDER',
    projectDescription: 'Integrating third-party payment gateway APIs with authentication layer',
    status: 'assigned',
    statusLabel: 'In Progress',
    teamName: 'Backend-Core-Team',
    assigneeName: 'Rahul Kumar',
    assigneeAvatar: 'RK',
    assigneeColor: '#4361ee',
    assignedDate: 'Mar 10, 2026',
    dueDate: 'Mar 14, 2026',
    priority: 'Critical',
    progress: 85,
    tasksTotal: 12,
    tasksCompleted: 10,
    tags: ['Backend', 'API', 'Phase-2'],
    teamMembers: [
      { avatar: 'RK', color: '#4361ee', name: 'Rahul Kumar' },
      { avatar: 'SP', color: '#06d6a0', name: 'Sneha Patel' },
      { avatar: 'VT', color: '#3a86ff', name: 'Vishal Tiwari' },
    ],
  },
  {
    projectID: 'PRJ-002',
    projectName: 'Mobile UI Redesign',
    projectDescription: 'Complete overhaul of mobile app interface with new design system',
    status: 'overdue',
    statusLabel: 'Overdue',
    teamName: 'Frontend-Unit-01',
    assigneeName: 'Sneha Patel',
    assigneeAvatar: 'SP',
    assigneeColor: '#06d6a0',
    assignedDate: 'Mar 05, 2026',
    dueDate: 'Mar 11, 2026',
    priority: 'Medium',
    progress: 52,
    tasksTotal: 18,
    tasksCompleted: 9,
    tags: ['Frontend', 'Mobile', 'UI/UX'],
    teamMembers: [
      { avatar: 'SP', color: '#06d6a0', name: 'Sneha Patel' },
      { avatar: 'AM', color: '#7209b7', name: 'Arjun Mehta' },
      { avatar: 'PD', color: '#f9a825', name: 'Priya Das' },
      { avatar: 'RK', color: '#ef233c', name: 'Rahul Kumar' },
    ],
  },
  {
    projectID: 'PRJ-003',
    projectName: 'DB Schema Design v2',
    projectDescription: 'Optimizing database schema for better performance and scalability',
    status: 'assigned',
    statusLabel: 'In Progress',
    teamName: 'Database-Squad',
    assigneeName: 'Vishal Tiwari',
    assigneeAvatar: 'VT',
    assigneeColor: '#3a86ff',
    assignedDate: 'Mar 12, 2026',
    dueDate: 'Mar 20, 2026',
    priority: 'Low',
    progress: 31,
    tasksTotal: 8,
    tasksCompleted: 2,
    tags: ['Database', 'Schema', 'Performance'],
    teamMembers: [
      { avatar: 'VT', color: '#3a86ff', name: 'Vishal Tiwari' },
      { avatar: 'RK', color: '#4361ee', name: 'Rahul Kumar' },
    ],
  },
  {
    projectID: 'PRJ-004',
    projectName: 'Weekly Status Report',
    projectDescription: 'Comprehensive weekly progress report for stakeholders',
    status: 'completed',
    statusLabel: 'Completed',
    teamName: 'Management-Team',
    assigneeName: 'Arjun Mehta',
    assigneeAvatar: 'AM',
    assigneeColor: '#7209b7',
    assignedDate: 'Mar 06, 2026',
    dueDate: 'Mar 13, 2026',
    priority: 'Medium',
    progress: 100,
    tasksTotal: 5,
    tasksCompleted: 5,
    tags: ['Reporting', 'Management'],
    teamMembers: [
      { avatar: 'AM', color: '#7209b7', name: 'Arjun Mehta' },
    ],
  },
  {
    projectID: 'PRJ-005',
    projectName: 'QA Testing – Sprint 4',
    projectDescription: 'End-to-end testing for sprint 4 features and bug fixes',
    status: 'assigned',
    statusLabel: 'In Progress',
    teamName: 'Quality-Assurance',
    assigneeName: 'Priya Das',
    assigneeAvatar: 'PD',
    assigneeColor: '#f9a825',
    assignedDate: 'Mar 08, 2026',
    dueDate: 'Mar 15, 2026',
    priority: 'Critical',
    progress: 68,
    tasksTotal: 22,
    tasksCompleted: 15,
    tags: ['QA', 'Testing', 'Sprint-4'],
    teamMembers: [
      { avatar: 'PD', color: '#f9a825', name: 'Priya Das' },
      { avatar: 'SP', color: '#06d6a0', name: 'Sneha Patel' },
      { avatar: 'VT', color: '#3a86ff', name: 'Vishal Tiwari' },
    ],
  },
  {
    projectID: 'PRJ-006',
    projectName: 'Client Demo Preparation',
    projectDescription: 'Preparing comprehensive demo for Q2 client presentation',
    status: 'assigned',
    statusLabel: 'Pending',
    teamName: 'Design-Squad-Alpha',
    assigneeName: 'Rahul Kumar',
    assigneeAvatar: 'RK',
    assigneeColor: '#ef233c',
    assignedDate: 'Mar 09, 2026',
    dueDate: 'Mar 16, 2026',
    priority: 'Critical',
    progress: 42,
    tasksTotal: 10,
    tasksCompleted: 4,
    tags: ['Demo', 'Client', 'Presentation'],
    teamMembers: [
      { avatar: 'RK', color: '#ef233c', name: 'Rahul Kumar' },
      { avatar: 'AM', color: '#7209b7', name: 'Arjun Mehta' },
      { avatar: 'SP', color: '#06d6a0', name: 'Sneha Patel' },
      { avatar: 'PD', color: '#f9a825', name: 'Priya Das' },
      { avatar: 'VT', color: '#3a86ff', name: 'Vishal Tiwari' },
    ],
  },
  {
    projectID: 'PRJ-007',
    projectName: 'Security Audit – Q1',
    projectDescription: 'Full vulnerability assessment and penetration testing for Q1 release',
    status: 'assigned',
    statusLabel: 'In Progress',
    teamName: 'Security-Ops',
    assigneeName: 'Arjun Mehta',
    assigneeAvatar: 'AM',
    assigneeColor: '#7209b7',
    assignedDate: 'Mar 14, 2026',
    dueDate: 'Mar 22, 2026',
    priority: 'Critical',
    progress: 55,
    tasksTotal: 14,
    tasksCompleted: 7,
    tags: ['Security', 'Audit'],
    teamMembers: [
      { avatar: 'AM', color: '#7209b7', name: 'Arjun Mehta' },
      { avatar: 'VT', color: '#3a86ff', name: 'Vishal Tiwari' },
    ],
  },
  {
    projectID: 'PRJ-008',
    projectName: 'Performance Optimization',
    projectDescription: 'Reducing API response times and improving frontend bundle size',
    status: 'assigned',
    statusLabel: 'In Progress',
    teamName: 'Platform-Team',
    assigneeName: 'Priya Das',
    assigneeAvatar: 'PD',
    assigneeColor: '#f9a825',
    assignedDate: 'Mar 11, 2026',
    dueDate: 'Mar 18, 2026',
    priority: 'Medium',
    progress: 78,
    tasksTotal: 9,
    tasksCompleted: 7,
    tags: ['Performance', 'Backend'],
    teamMembers: [
      { avatar: 'PD', color: '#f9a825', name: 'Priya Das' },
      { avatar: 'RK', color: '#4361ee', name: 'Rahul Kumar' },
      { avatar: 'SP', color: '#06d6a0', name: 'Sneha Patel' },
    ],
  },
  {
    projectID: 'PRJ-009',
    projectName: 'Onboarding Flow Redesign',
    projectDescription: 'Revamping new user onboarding with interactive tutorials and tooltips',
    status: 'assigned',
    statusLabel: 'Pending',
    teamName: 'Product-Squad',
    assigneeName: 'Sneha Patel',
    assigneeAvatar: 'SP',
    assigneeColor: '#06d6a0',
    assignedDate: 'Mar 15, 2026',
    dueDate: 'Mar 25, 2026',
    priority: 'Low',
    progress: 15,
    tasksTotal: 20,
    tasksCompleted: 3,
    tags: ['Frontend', 'Design', 'UI/UX'],
    teamMembers: [
      { avatar: 'SP', color: '#06d6a0', name: 'Sneha Patel' },
      { avatar: 'AM', color: '#7209b7', name: 'Arjun Mehta' },
    ],
  },
];
}
// ── end placeholder ──────────────────────────────────────────────────────────

  const [filter, setFilter] = useState<'all' | 'todo' | 'in-progress' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectCardData | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [enteringProject, setEnteringProject] = useState<{ name: string; id: string } | null>(null);
  const [overlayVisible, setOverlayVisible] = useState(false);

  // ── Project Actions state ──────────────────────────────────────────────
  const [actionsProject, setActionsProject] = useState<{ id: string; projectID: string; projectName: string } | null>(null);
  const [showAddPeople, setShowAddPeople] = useState(false);
  const [archiveToast, setArchiveToast] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  // Stats computed live from shared context projects
  const stats = useMemo(() => ({
    total: projects.length,
    assigned: projects.filter(p =>
      p.statusLabel === 'In Progress'
    ).length,
    completed: projects.filter(p => p.statusLabel === 'Completed').length,
    overdue: projects.filter(p => p.statusLabel === 'Overdue').length,
  }), [projects]);

  // Filter and search projects
  const filteredProjects = useMemo(() => {
    let filtered = projects;

    if (filter === 'todo') {
      filtered = filtered.filter(p => p.statusLabel === 'To Do');
    } else if (filter === 'in-progress') {
      filtered = filtered.filter(p =>
        p.statusLabel === 'In Progress'
      );
    } else if (filter === 'completed') {
      filtered = filtered.filter(p => p.statusLabel === 'Completed');
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.projectName.toLowerCase().includes(query) ||
        p.teamName.toLowerCase().includes(query) ||
        p.assigneeName.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [projects, filter, searchQuery]);

  // Show limited projects initially (4 out of 6)
  const visibleProjects = showAll ? filteredProjects : filteredProjects.slice(0, 3);
  const hasMore = filteredProjects.length > 3;

  const handleProjectClick = (project: ProjectCardData) => {
    setEnteringProject({ name: project.projectName, id: project.projectID });
    // Trigger fade-in on next tick
    setTimeout(() => setOverlayVisible(true), 10);
    // Navigate after animation completes
    setTimeout(() => {
      router.push(`/workspace/${project.projectID}/ws-dashboard`);
    }, 2550);
  };

  const handleInfoAction = (project: ProjectCardData) => {
    // Open modal (for both hover and click on info icon)
    setSelectedProject(project);
  };

  // ── Quick-filter chip handler (zero extra clicks) ────────────
  const handleQuickFilter = (newFilter: typeof filter) => {
    setFilter(newFilter);
    setSearchQuery('');
  };

  // ── Project Actions handlers ────────────────────────────────
  const handleDeleteProject = async () => {
    if (!deleteConfirm) return;
    try {
      await projectsService.delete(deleteConfirm.id);
      refreshProjects?.();
      setDeleteConfirm(null);
    } catch {
      // silently — project might already be gone
    }
  };

  // ── Card grid renderer (reads live from ProjectsContext) ──────
  const renderPremiumProjectCard = () => {
    // Loading skeleton
    if (loading) {
      return (
        <div
          className="grid gap-5 mb-5"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}
        >
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
              <div className="h-5 bg-slate-100 rounded-lg w-2/3 mb-3" />
              <div className="h-3 bg-slate-100 rounded w-full mb-2" />
              <div className="h-3 bg-slate-100 rounded w-4/5 mb-5" />
              <div className="h-2 bg-slate-100 rounded-full w-full mb-2" />
              <div className="flex justify-between items-center mt-4">
                <div className="h-5 bg-slate-100 rounded-lg w-16" />
                <div className="flex gap-1">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="w-7 h-7 bg-slate-100 rounded-full" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Empty state — no projects assigned
    if (visibleProjects.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 mb-5">
          <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center text-4xl mb-5">
            📋
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">
            {searchQuery || filter !== 'all' ? 'No projects match your filter' : 'No projects assigned yet'}
          </h3>
          <p className="text-slate-500 text-sm text-center max-w-sm">
            {searchQuery || filter !== 'all'
              ? 'Try changing your search or filter.'
              : 'You are not assigned to any project. Contact your SuperAdmin to be assigned to a project.'}
          </p>
          {!searchQuery && filter === 'all' && canManage && (
            <button
              onClick={() => router.push('/create')}
              className="mt-5 px-5 py-2.5 bg-[#4361ee] text-white rounded-xl font-semibold text-sm hover:bg-[#3651ce] transition-all"
            >
              + Create a New Project
            </button>
          )}
        </div>
      );
    }

    return (
      <div
        className="grid gap-5 mb-5"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}
      >
        {visibleProjects.map((project) => (
          <ProjectCard
            key={project.projectID}
            project={project}
            onClick={() => handleProjectClick(project as ProjectCardData)}
            onInfoAction={() => handleInfoAction(project as ProjectCardData)}
            canManage={canManage}
            isSuperAdmin={globalRole === 'SuperAdmin'}
            onAddPeople={() => {
              setActionsProject({ id: project.id ?? project.projectID, projectID: project.projectID, projectName: project.projectName });
              setShowAddPeople(true);
            }}
            onSettings={() => router.push(`/workspace/${project.projectID}/settings`)}
            onArchive={() => setArchiveToast(true)}
            onDelete={() => setDeleteConfirm({ id: project.id ?? project.projectID, name: project.projectName })}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen" style={{ background: '#f4f6fb' }}>
      <Topbar title="" subtitle="" onMenuToggle={() => setMobileNavOpen(o => !o)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
        <main className="flex-1 overflow-auto p-4 md:p-5">
          <div className="max-w-7xl mx-auto">
          {/* Greeting */}
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-900 mb-1">
              {getGreeting()}, {currentUser.name.split(' ')[0]} 👋
            </h2>
            <p className="text-slate-500 text-sm">
              Here&#39;s what&#39;s happening with your projects today — {getTodayLabel()}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            <StatsCard
              label="Total Projects"
              value={stats.total}
              trend="↑ 5 since yesterday"
              icon="📋"
              variant="info"
            />
            <StatsCard
              label="Assigned Projects"
              value={stats.assigned}
              trend="↑ 3 from last week"
              icon="⚙️"
              variant="info"
            />
            <StatsCard
              label="Completed Projects"
              value={stats.completed}
              trend="↑ 8 this week"
              icon="✅"
              variant="success"
            />
            <StatsCard
              label="Overdue Projects"
              value={stats.overdue}
              trend="⚠️ needs attention"
              icon="🔴"
              variant="warning"
            />
          </div>

          {/* ── My Dashboard Header: title + search + filter chips (single row) ── */}
          <div
            className="flex flex-wrap items-center justify-between gap-3 mb-4"
            style={{ fontFamily: 'var(--fd-font, Inter, Poppins, sans-serif)' }}
          >
            {/* Left: title + count badge */}
            <div className="flex items-center gap-3">
              <h2 className="text-[1.25rem] font-semibold text-[#1a1a2e] tracking-tight">
                My Projects
              </h2>
              <span className="px-2.5 py-1 bg-[#eff3ff] text-[#4361ee] rounded-full text-[0.75rem] font-bold leading-none">
                {filteredProjects.length}
              </span>
            </div>

            {/* Right: permanent search bar + filter chips */}
            <div className="flex items-center gap-3">
              {/* Search bar */}
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
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search projects, teams…"
                  className="pl-9 pr-4 py-1.5 w-[190px] bg-white border border-[#e8ecf0] rounded-xl text-[0.82rem] text-[#1a1a2e] placeholder:text-[#7a828c] focus:outline-none focus:border-[#4361ee] focus:ring-2 focus:ring-[#4361ee]/10 transition-all"
                />
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
                    onClick={() => handleQuickFilter(chip.value as typeof filter)}
                    className={`px-3 py-1 rounded-full text-[0.78rem] font-medium transition-all duration-200 ${
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
          </div>

          {/* Projects Grid — rendered via renderPremiumProjectCard */}
          {renderPremiumProjectCard()}

          {/* Show More/Less Button */}
          {hasMore && !searchQuery && (
            <div className="flex justify-center mb-5">
              <button
                onClick={() => setShowAll(!showAll)}
                className="px-5 py-2 bg-[#4361ee] text-white rounded-xl font-semibold text-sm hover:bg-[#3651ce] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(67,97,238,0.3)] transition-all flex items-center gap-2"
              >
                <span>{showAll ? 'Show Less Projects' : 'Show More Projects'}</span>
                <span className={`text-xs transition-transform ${showAll ? 'rotate-180' : ''}`}>▼</span>
              </button>
            </div>
          )}

          {/* Catch-Up Feed & Team Pulse Grid - Matches original: 1fr 300px */}
          <div className={`grid gap-4 mt-5 mb-4 ${
            FEATURES.CATCH_UP_FEED 
              ? 'grid-cols-1 lg:grid-cols-[1fr_280px]' 
              : 'grid-cols-1 lg:grid-cols-1 lg:max-w-md lg:mx-auto'
          }`}>
            {FEATURES.CATCH_UP_FEED && (
              <ActivityFeed items={[
                {
                  id: '1',
                  icon: '✅',
                  iconBg: 'green',
                  title: 'Rahul completed "API Integration – Phase 2"',
                  subtitle: 'Project moved to Done. Pending your review.',
                  time: '5m ago',
                },
                {
                  id: '2',
                  icon: '💬',
                  iconBg: 'blue',
                  title: 'Hardware thread has 8 new replies',
                  subtitle: 'Discussions → Hardware Board',
                  time: '22m ago',
                },
                {
                  id: '3',
                  icon: '📌',
                  iconBg: 'orange',
                  title: '3 new projects submitted for review',
                  subtitle: 'Design-Squad-Alpha pushed updates',
                  time: '1h ago',
                },
                {
                  id: '4',
                  icon: '⚠️',
                  iconBg: 'red',
                  title: '"Mobile UI Redesign" is 2 days overdue',
                  subtitle: 'Frontend-Unit-01 · Assigned to Sneha',
                  time: '3h ago',
                },
                {
                  id: '5',
                  icon: '👤',
                  iconBg: 'blue',
                  title: 'Arjun Kumar joined Team Alpha',
                  subtitle: 'Now available for project assignment',
                  time: 'Yesterday',
                },
              ]} />
            )}
            {FEATURES.TEAM_PULSE && (
              <TeamPulse items={[
                {
                  id: '1',
                  avatar: 'RK',
                  avatarGradient: 'linear-gradient(135deg, #4361ee, #7209b7)',
                  status: 'online',
                  name: 'Rahul Kumar',
                  task: 'API Integration Project',
                },
              {
                id: '2',
                avatar: 'SP',
                avatarGradient: 'linear-gradient(135deg, #06d6a0, #0077b6)',
                status: 'online',
                name: 'Sneha Patel',
                task: 'Mobile UI Redesign',
              },
              {
                id: '3',
                avatar: 'AM',
                avatarGradient: 'linear-gradient(135deg, #f9a825, #ef233c)',
                status: 'idle',
                name: 'Arjun Mehta',
                task: 'Idle – No active project',
              },
              {
                id: '4',
                avatar: 'PD',
                avatarGradient: 'linear-gradient(135deg, #7209b7, #3a0ca3)',
                status: 'offline',
                name: 'Priya Das',
                task: 'Offline',
              },
              {
                id: '5',
                avatar: 'VT',
                avatarGradient: 'linear-gradient(135deg, #3a86ff, #06d6a0)',
                status: 'online',
                name: 'Vishal Tiwari',
                task: 'DB Schema Design',
              },
            ]} />
            )}
          </div>

          {/* No Results */}
          {filteredProjects.length === 0 && (
            <div className="text-center py-8">
              <div className="text-5xl mb-3">🔍</div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">No projects found</h3>
              <p className="text-sm text-slate-500">Try adjusting your filters or search query</p>
            </div>
          )}
          </div>{/* /max-w-7xl */}
        </main>
      </div>

      {/* Project Detail Modal */}
      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}

      {/* Add People Modal */}
      {showAddPeople && actionsProject && (
        <AddPeopleModal
          projectId={actionsProject.id}
          projectName={actionsProject.projectName}
          onClose={() => { setShowAddPeople(false); setActionsProject(null); }}
          onMembersChanged={() => refreshProjects?.()}
        />
      )}

      {/* Archive Toast */}
      {archiveToast && (
        <div style={{
          position: 'fixed', bottom: '28px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, background: '#1e293b', color: '#fff',
          padding: '12px 22px', borderRadius: '12px',
          fontSize: '0.85rem', fontWeight: 500,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          animation: 'apm-fade-in 0.2s ease',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="#facc15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="21 8 21 21 3 21 3 8" />
            <rect x="1" y="3" width="22" height="5" />
            <line x1="10" y1="12" x2="14" y2="12" />
          </svg>
          Archiving coming soon
          <button onClick={() => setArchiveToast(false)} style={{
            background: 'none', border: 'none', color: '#94a3b8',
            cursor: 'pointer', marginLeft: '4px', fontSize: '1rem', lineHeight: 1,
          }}>×</button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <>
          <div onClick={() => setDeleteConfirm(null)} style={{
            position: 'fixed', inset: 0, zIndex: 9000,
            background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)',
          }} />
          <div style={{
            position: 'fixed', inset: 0, zIndex: 9001,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
          }}>
            <div style={{
              background: '#fff', borderRadius: '16px', maxWidth: '420px', width: '100%',
              padding: '28px 28px 22px', boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
              animation: 'apm-scale-in 0.2s cubic-bezier(0.16,1,0.3,1) both',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                    Delete Project
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                    This action cannot be undone
                  </p>
                </div>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#374151', marginBottom: '20px', lineHeight: 1.6 }}>
                Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? All issues, members, and data will be permanently removed.
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={() => setDeleteConfirm(null)} style={{
                  padding: '8px 18px', borderRadius: '8px', border: '1.5px solid #e2e8f0',
                  background: '#fff', color: '#374151', fontSize: '0.84rem', fontWeight: 600,
                  cursor: 'pointer', transition: 'background 0.15s',
                }}>
                  Cancel
                </button>
                <button onClick={handleDeleteProject} style={{
                  padding: '8px 18px', borderRadius: '8px', border: 'none',
                  background: '#dc2626', color: '#fff', fontSize: '0.84rem', fontWeight: 600,
                  cursor: 'pointer', transition: 'background 0.15s',
                }}>
                  Delete Project
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Workspace Entry Transition Overlay */}
      {enteringProject && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
          style={{
            background: 'radial-gradient(ellipse at center, #1a1a3e 0%, #0f0c29 50%, #060610 100%)',
            opacity: overlayVisible ? 1 : 0,
            transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: overlayVisible ? 'all' : 'none',
          }}
        >
          {/* Floating particles */}
          {[...Array(18)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${2 + (i % 3)}px`,
                height: `${2 + (i % 3)}px`,
                background: i % 3 === 0 ? '#4361ee' : i % 3 === 1 ? '#7c3aed' : '#06d6a0',
                left: `${5 + (i * 5.5) % 90}%`,
                top: `${10 + (i * 7.3) % 80}%`,
                opacity: overlayVisible ? 0.6 : 0,
                transform: overlayVisible ? 'translateY(0)' : 'translateY(20px)',
                transition: `opacity 1s ease ${0.1 + i * 0.05}s, transform 1.2s ease ${0.1 + i * 0.05}s`,
                animation: overlayVisible ? `floatParticle ${3 + (i % 4)}s ease-in-out ${i * 0.2}s infinite alternate` : 'none',
              }}
            />
          ))}

          {/* Glow rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {[900, 620, 380, 200].map((size, i) => (
              <div
                key={size}
                className="absolute rounded-full"
                style={{
                  width: overlayVisible ? `${size}px` : '0px',
                  height: overlayVisible ? `${size}px` : '0px',
                  border: `1px solid rgba(67,97,238,${0.06 + i * 0.06})`,
                  boxShadow: i === 3 ? '0 0 40px rgba(67,97,238,0.15), inset 0 0 40px rgba(67,97,238,0.05)' : 'none',
                  transition: `all ${1.4 - i * 0.15}s cubic-bezier(0.4, 0, 0.2, 1) ${i * 0.08}s`,
                }}
              />
            ))}
          </div>

          {/* Main content card */}
          <div
            className="relative flex flex-col items-center text-center px-10"
            style={{
              opacity: overlayVisible ? 1 : 0,
              transform: overlayVisible ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.96)',
              transition: 'opacity 0.7s ease 0.35s, transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0.35s',
            }}
          >
            {/* Avatar */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-extrabold mb-5 shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, #4361ee, #7c3aed)',
                boxShadow: '0 0 40px rgba(67,97,238,0.5), 0 8px 32px rgba(0,0,0,0.4)',
              }}
            >
              {enteringProject.name.charAt(0).toUpperCase()}
            </div>

            {/* Label */}
            <p
              className="text-[0.68rem] font-semibold tracking-[0.35em] uppercase mb-3"
              style={{ color: '#4361ee' }}
            >
              Entering Workspace
            </p>

            {/* Project name with shimmer */}
            <h2
              className="text-white font-extrabold tracking-tight mb-1"
              style={{
                fontSize: 'clamp(1.5rem, 4vw, 2.4rem)',
                textShadow: '0 0 40px rgba(67,97,238,0.6)',
                background: 'linear-gradient(90deg, #fff 0%, #c7d2fe 40%, #fff 80%)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: overlayVisible ? 'shimmer 2s linear infinite' : 'none',
              }}
            >
              {enteringProject.name}
            </h2>

            {/* Project ID badge */}
            <span
              className="inline-block px-3 py-1 rounded-lg text-[0.72rem] font-mono font-semibold mb-6"
              style={{
                background: 'rgba(67,97,238,0.15)',
                border: '1px solid rgba(67,97,238,0.3)',
                color: '#818cf8',
              }}
            >
              {enteringProject.id}
            </span>

            {/* Progress bar */}
            <div
              className="w-48 h-0.5 rounded-full overflow-hidden mb-4"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #4361ee, #7c3aed)',
                  width: overlayVisible ? '100%' : '0%',
                  transition: 'width 1.3s cubic-bezier(0.4, 0, 0.2, 1) 0.5s',
                  boxShadow: '0 0 10px rgba(67,97,238,0.8)',
                }}
              />
            </div>

            {/* Dots */}
            <div className="flex items-center gap-2">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="rounded-full"
                  style={{
                    width: '6px',
                    height: '6px',
                    background: i === 1 ? '#4361ee' : 'rgba(67,97,238,0.4)',
                    animation: overlayVisible ? `dotPulse 1.2s ease-in-out ${i * 0.2}s infinite` : 'none',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
