'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/shared/Sidebar';
import Topbar from '@/components/shared/Topbar';
import TeamAssignment, { type TeamTemplate } from '@/components/create/TeamAssignment';
import { useProjects } from '@/lib/ProjectsContext';
import { teamsService } from '@/lib/teams.service';

const teamTemplates: TeamTemplate[] = [
  {
    id: 'DF-001',
    name: 'Frontend-Unit-01',
    icon: '🎨',
    members: ['Sneha Patel', 'Arjun Mehta'],
    metaText: 'Sneha Patel, Arjun Mehta + 2 more',
  },
  {
    id: 'DF-002',
    name: 'Backend-Dev-Team',
    icon: '🔧',
    members: ['Rahul Kumar', 'Vishal Tiwari'],
    metaText: 'Rahul Kumar, Vishal Tiwari + 3 more',
  },
  {
    id: 'DF-003',
    name: 'Design-Squad-Alpha',
    icon: '✏️',
    members: ['Priya Das'],
    metaText: 'Priya Das + 2 more',
  },
];

const slugifyTeamName = (name: string): string =>
  name.replace(/\s+/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12) || 'NEWTEAM';

const peekNextTeamSeq = (slug: string): number => {
  if (typeof window === 'undefined') return 1;
  return parseInt(localStorage.getItem(`fd_team_seq_${slug}`) || '0', 10) + 1;
};

const commitTeamSeq = (slug: string) => {
  if (typeof window === 'undefined') return;
  const cur = parseInt(localStorage.getItem(`fd_team_seq_${slug}`) || '0', 10);
  localStorage.setItem(`fd_team_seq_${slug}`, String(cur + 1));
};

const MEMBER_COLORS: Record<string, string> = {
  'Rahul Kumar': '#4361ee', 'Sneha Patel': '#06d6a0',
  'Arjun Mehta': '#7209b7', 'Priya Das': '#f9a825',
  'Vishal Tiwari': '#3a86ff',
};

function CreateTeamPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { projects, refreshProjects } = useProjects();

  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [teamName, setTeamName]               = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [teamID, setTeamID]                   = useState<string>('NEWTEAM-001');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    () => searchParams.get('projectID') ?? ''
  );
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const projectWrapperRef = useRef<HTMLDivElement>(null);
  const projectBtnRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!projectDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (projectWrapperRef.current && !projectWrapperRef.current.contains(e.target as Node)) {
        setProjectDropdownOpen(false);
        setProjectSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [projectDropdownOpen]);

  // Smart positioning - detect space and open upward if needed
  const handleDropdownToggle = () => {
    if (!projectDropdownOpen && projectBtnRef.current) {
      const rect = projectBtnRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const DROPDOWN_HEIGHT = 400; // estimated max dropdown height
      setOpenUpward(spaceBelow < DROPDOWN_HEIGHT);
    }
    setProjectDropdownOpen(o => !o);
    setProjectSearch('');
  };

  // On mount: refresh projects from DB so dropdown always has latest data
  // Also re-apply query param once projects are loaded (handles race condition)
  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  useEffect(() => {
    const qp = searchParams.get('projectID');
    if (qp && projects.some(p => p.projectID === qp)) {
      setSelectedProjectId(qp);
    }
  }, [searchParams, projects]);

  const handleTemplateSelect = (template: TeamTemplate) => {
    setSelectedTemplate(template.id);
    setTeamID(template.id);
    setSelectedMembers(template.members);
    setTeamName(template.name);
  };

  const handleTeamNameChange = (name: string) => {
    setTeamName(name);
    if (selectedTemplate) setSelectedTemplate('');
    const slug = slugifyTeamName(name);
    const seq  = peekNextTeamSeq(slug);
    setTeamID(`${slug}-${String(seq).padStart(3, '0')}`);
  };

  const validateForm = () => {
    if (!teamName.trim()) {
      alert('⚠️ Please enter a Team Name!');
      return false;
    }
    return true;
  };

  const handleCreateTeam = async () => {
    if (!validateForm()) return;

    const membersList = [
      { name: 'Shreyas Wakhare', avatar: 'SW', color: '#4361ee' },
      ...selectedMembers.map(m => ({
        name: m,
        avatar: m.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
        color: MEMBER_COLORS[m] ?? '#7a828c',
      })),
    ];

    setSaving(true);
    try {
      let finalTeamID = teamID;

      if (selectedProjectId) {
        // Save to DB via API — one single call, gets server-assigned teamID back
        const created = await teamsService.create({
          teamName,
          projectID: selectedProjectId,
          members: membersList,
        });
        finalTeamID = created.teamID;

        // Refresh context so dashboard shows the updated project+team
        await refreshProjects();
      } else {
        // No project selected — team not persisted (must select a project)
        if (!selectedTemplate) commitTeamSeq(slugifyTeamName(teamName));
      }

      setTeamID(finalTeamID);
      setShowSuccessModal(true);
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err) {
      console.error('Failed to create team:', err);
      alert('Failed to create team. Please check that a project is selected and try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setShowSuccessModal(false);
    setSelectedMembers([]);
    setTeamName('');
    setSelectedTemplate('');
    setTeamID('NEWTEAM-001');
    setSelectedProjectId('');
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex-1 ml-[220px]">
        <Topbar 
          title="" 
          subtitle="" 
          breadcrumb={
            <div className="text-sm text-slate-500">
              <button onClick={() => router.push('/dashboard')} className="hover:text-blue-600 transition-colors bg-transparent border-0 p-0 cursor-pointer text-sm text-slate-500">
                Dashboard
              </button>
              <span className="mx-2">/</span>
              <span>Create Team</span>
            </div>
          }
        />

        <main className="p-8">
          {/* Page Header */}
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-slate-900 mb-3 flex items-center gap-3">
              <span>👥</span> Build a New Team
            </h2>
            <p className="text-lg text-slate-600 ml-[52px]">
              Create your team, add members, and assign it to a project.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left — TeamAssignment card */}
            <div className="lg:col-span-2 space-y-6 relative z-10">
              <TeamAssignment
                selectedMembers={selectedMembers}
                teamName={teamName}
                onMembersChange={setSelectedMembers}
                onTeamNameChange={handleTeamNameChange}
                teamID={teamID}
                teamTemplates={teamTemplates}
                selectedTemplate={selectedTemplate}
                onTemplateSelect={handleTemplateSelect}
              />

              {/* Assign to Project */}
              <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 shadow-sm overflow-visible">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center text-lg">
                    📁
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Assign to Project</h3>
                    <p className="text-xs text-slate-500">Optional — link this team to an existing project</p>
                  </div>
                </div>

                {/* Searchable Project Dropdown */}
                <div ref={projectWrapperRef} className="relative">
                  {/* Trigger button */}
                  <button
                    ref={projectBtnRef}
                    type="button"
                    onClick={handleDropdownToggle}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all text-left ${
                      selectedProjectId
                        ? 'bg-violet-50 border-violet-300 text-slate-900'
                        : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'
                    } focus:outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10`}
                  >
                    {selectedProjectId ? (
                      <>
                        <span className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center text-sm shrink-0">📁</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 truncate text-sm">
                            {projects.find(p => p.projectID === selectedProjectId)?.projectName}
                          </p>
                          <p className="text-xs text-violet-500 font-mono">{selectedProjectId}</p>
                        </div>
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={e => { e.stopPropagation(); setSelectedProjectId(''); setProjectDropdownOpen(false); }}
                          onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); setSelectedProjectId(''); setProjectDropdownOpen(false); } }}
                          className="w-6 h-6 rounded-lg bg-slate-200 hover:bg-red-100 hover:text-red-500 flex items-center justify-center text-slate-500 transition-all shrink-0 cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-sm shrink-0">🔍</span>
                        <span className="flex-1">Search or select a project…</span>
                        <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </>
                    )}
                  </button>

                  {/* Dropdown panel — smart positioning (up/down) */}
                  {projectDropdownOpen && (
                    <div
                      id="project-dropdown-panel"
                      className={`absolute left-0 right-0 bg-white border-2 border-violet-200 rounded-2xl shadow-xl overflow-hidden ${
                        openUpward ? 'bottom-full mb-1' : 'top-full mt-1'
                      }`}
                      style={{ zIndex: 9999 }}
                    >
                        {/* Search input inside dropdown */}
                        <div className="p-3 border-b border-slate-100">
                          <div className="relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                            </svg>
                            <input
                              autoFocus
                              type="text"
                              value={projectSearch}
                              onChange={e => setProjectSearch(e.target.value)}
                              placeholder="Type project name or ID…"
                              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 transition-all"
                            />
                          </div>
                        </div>

                        {/* Project list */}
                        <div className="max-h-56 overflow-y-auto">
                          {projects
                            .filter(p =>
                              p.projectName.toLowerCase().includes(projectSearch.toLowerCase()) ||
                              p.projectID.toLowerCase().includes(projectSearch.toLowerCase())
                            )
                            .map(p => {
                              const isSelected = p.projectID === selectedProjectId;
                              const statusColor: Record<string, string> = {
                                'To Do': 'bg-slate-100 text-slate-500',
                                'In Progress': 'bg-blue-100 text-blue-600',
                                'Completed': 'bg-emerald-100 text-emerald-600',
                                'Overdue': 'bg-red-100 text-red-600',
                                'Pending': 'bg-slate-100 text-slate-500',
                              };
                              return (
                                <button
                                  key={p.projectID}
                                  type="button"
                                  onClick={() => { setSelectedProjectId(p.projectID); setProjectDropdownOpen(false); setProjectSearch(''); }}
                                  className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-slate-50 last:border-0 transition-all ${
                                    isSelected ? 'bg-violet-50' : 'hover:bg-slate-50'
                                  }`}
                                >
                                  <span className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center text-sm shrink-0">📁</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-slate-900 text-sm truncate">{p.projectName}</p>
                                    <p className="text-xs font-mono text-slate-400">{p.projectID}</p>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded-lg text-xs font-bold shrink-0 ${statusColor[p.statusLabel] ?? 'bg-slate-100 text-slate-500'}`}>
                                    {p.statusLabel}
                                  </span>
                                  {isSelected && (
                                    <div className="w-5 h-5 bg-violet-600 rounded-md flex items-center justify-center shrink-0">
                                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          {projects.filter(p =>
                            p.projectName.toLowerCase().includes(projectSearch.toLowerCase()) ||
                            p.projectID.toLowerCase().includes(projectSearch.toLowerCase())
                          ).length === 0 && (
                            <div className="px-4 py-6 text-center">
                              <p className="text-sm text-slate-400">No projects found for &quot;{projectSearch}&quot;</p>
                            </div>
                          )}
                        </div>

                        {/* Footer count */}
                        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100">
                          <p className="text-xs text-slate-400">
                            {projects.filter(p =>
                              p.projectName.toLowerCase().includes(projectSearch.toLowerCase()) ||
                              p.projectID.toLowerCase().includes(projectSearch.toLowerCase())
                            ).length} project{projects.length !== 1 ? 's' : ''} available
                          </p>
                        </div>
                    </div>
                  )}
                </div>

                {selectedProjectId && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-emerald-600 font-semibold">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    Team will be linked to{' '}
                    <span className="text-slate-800">
                      {projects.find(p => p.projectID === selectedProjectId)?.projectName}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right — Summary + Actions */}
            <div className="space-y-6">
              {/* Team Summary card */}
              <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span>📋</span> Team Summary
                </h3>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Team Name</span>
                    <span className="font-bold text-slate-900 text-right max-w-[140px] truncate">
                      {teamName || <span className="text-slate-300 font-normal italic">Not set</span>}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Team ID</span>
                    <span className="font-mono font-bold text-blue-600 text-xs bg-blue-50 px-2 py-0.5 rounded-md">
                      {teamID}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Members</span>
                    <span className="font-bold text-slate-900">
                      {selectedMembers.length > 0
                        ? `${selectedMembers.length + 1} (incl. you)`
                        : <span className="text-slate-300 font-normal italic">None added</span>}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-500 font-medium">Project</span>
                    <span className="font-bold text-slate-900 text-right max-w-[140px] truncate">
                      {selectedProjectId
                        ? projects.find(p => p.projectID === selectedProjectId)?.projectName
                        : <span className="text-slate-300 font-normal italic">Unassigned</span>}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleCreateTeam}
                  disabled={saving}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-60 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all text-sm flex items-center justify-center gap-2"
                >
                  {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : '🚀 Create Team'}
                </button>
                <button
                  onClick={handleReset}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all text-sm"
                >
                  🔄 Reset Form
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Team Created!</h3>
            <p className="text-slate-600 mb-2">
              <span className="font-bold text-blue-600">{teamName}</span> has been created
              {selectedProjectId && (
                <> and linked to <span className="font-bold text-purple-600">
                  {projects.find(p => p.projectID === selectedProjectId)?.projectName}
                </span></>
              )}.
            </p>
            <div className="mt-3 inline-flex items-center gap-2 bg-slate-100 rounded-lg px-4 py-2">
              <span className="text-xs text-slate-500 font-medium">Team ID</span>
              <span className="font-mono font-bold text-blue-600 text-sm">{teamID}</span>
            </div>
            <p className="text-slate-400 text-sm mt-4">Redirecting to dashboard…</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CreateTeamPageWrapper() {
  return (
    <Suspense fallback={null}>
      <CreateTeamPage />
    </Suspense>
  );
}
