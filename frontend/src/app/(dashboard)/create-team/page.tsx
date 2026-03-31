'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/shared/Sidebar';
import Topbar from '@/components/shared/Topbar';
import TeamAssignment, { type TeamTemplate, type MemberWithRole } from '@/components/create/TeamAssignment';
import { useProjects } from '@/lib/ProjectsContext';
import { teamsService } from '@/lib/teams.service';
import { usersService, type SystemUser } from '@/lib/users.service';
import { projectsService } from '@/lib/projects.service';
import { Users, Rocket, RotateCcw, FolderOpen, CheckCircle2, ClipboardList, Briefcase, Code2, Eye } from 'lucide-react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { useRbac } from '@/lib/RbacContext';
import AccessDenied from '@/components/shared/AccessDenied';


const teamTemplates: TeamTemplate[] = [
  {
    id: 'DF-001',
    name: 'Frontend-Unit-01',
    icon: '',
    members: ['Sneha Patel', 'Arjun Mehta'],
    metaText: 'Sneha Patel, Arjun Mehta + 2 more',
  },
  {
    id: 'DF-002',
    name: 'Backend-Dev-Team',
    icon: '',
    members: ['Rahul Kumar', 'Vishal Tiwari'],
    metaText: 'Rahul Kumar, Vishal Tiwari + 3 more',
  },
  {
    id: 'DF-003',
    name: 'Design-Squad-Alpha',
    icon: '',
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

function CreateTeamPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { projects, refreshProjects } = useProjects();
  const currentUser = useCurrentUser();
  const { canManage, noProjects, loading: rbacLoading } = useRbac();

  //  Team form state 
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [membersWithRoles, setMembersWithRoles] = useState<MemberWithRole[]>([]);
  const [teamName, setTeamName]               = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [teamID, setTeamID]                   = useState<string>('NEWTEAM-001');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    () => searchParams.get('projectID') ?? ''
  );
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [saving, setSaving] = useState(false);

  //  RBAC data 
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [assignableRoles, setAssignableRoles] = useState<{ id: string; name: string }[]>([]);
  const [existingMemberIds, setExistingMemberIds] = useState<string[]>([]);
  const [rbacResult, setRbacResult] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // On mount: refresh projects + load users & roles
  useEffect(() => { refreshProjects(); }, [refreshProjects]);

  useEffect(() => {
    usersService.getAll().then(setSystemUsers).catch(() => setSystemUsers([]));
    projectsService.getRoles().then(setAssignableRoles).catch(() => setAssignableRoles([]));
  }, []);

  // When project selection changes, fetch existing members so we can disable them
  useEffect(() => {
    if (!selectedProjectId) { setExistingMemberIds([]); return; }
    const project = projects.find(p => p.projectID === selectedProjectId);
    if (!project?.id) return;
    projectsService.getMembers(project.id)
      .then(members => setExistingMemberIds(members.map((m: { userId: string }) => m.userId)))
      .catch(() => setExistingMemberIds([]));
  }, [selectedProjectId, projects]);

  // Re-apply query param when projects load
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
    const seq = peekNextTeamSeq(slug);
    setTeamID(`${slug}-${String(seq).padStart(3, '0')}`);
  };

  const validateForm = () => {
    if (!teamName.trim()) { alert('Please enter a Team Name!'); return false; }
    return true;
  };

  const handleCreateTeam = async () => {
    if (!validateForm()) return;
    setRbacResult(null);

    const membersList = [
      { name: currentUser.name, avatar: currentUser.initials, color: '#4361ee' },
      ...membersWithRoles.map(m => ({
        name: m.name,
        avatar: m.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
        color: '#7a828c',
      })),
    ];

    setSaving(true);
    try {
      let finalTeamID = teamID;

      if (selectedProjectId) {
        const project = projects.find(p => p.projectID === selectedProjectId);

        // 1. Create the team record
        const created = await teamsService.create({
          teamName,
          projectID: selectedProjectId,
          members: membersList,
        });
        finalTeamID = created.teamID;

        // 2. Bulk-assign members with their RBAC roles (fire parallel, collect failures)
        if (project?.id && membersWithRoles.length > 0) {
          const results = await Promise.allSettled(
            membersWithRoles.map(m =>
              projectsService.addMember(project.id, m.userId, m.roleId)
            )
          );
          const failed = results.filter(r => r.status === 'rejected');
          if (failed.length > 0) {
            setRbacResult({
              type: 'error',
              msg: `Team created, but ${failed.length} member(s) could not be assigned (may already have a role in this project).`,
            });
          } else {
            setRbacResult({
              type: 'success',
              msg: `${membersWithRoles.length} member(s) assigned with RBAC roles.`,
            });
          }
        }

        await refreshProjects();
      } else {
        if (!selectedTemplate) commitTeamSeq(slugifyTeamName(teamName));
      }

      setTeamID(finalTeamID);
      setShowSuccessModal(true);
      setTimeout(() => router.push('/dashboard'), 2500);
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
    setMembersWithRoles([]);
    setTeamName('');
    setSelectedTemplate('');
    setTeamID('NEWTEAM-001');
    setSelectedProjectId('');
    setRbacResult(null);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
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

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <div className="flex-1 overflow-auto">
          {/* ── RBAC gate: only Manager / SuperAdmin reach here ───────────────── */}
          {rbacLoading ? (
          <div className="flex h-[60vh] items-center justify-center text-slate-500 text-sm">
            Checking permissions…
          </div>
        ) : !canManage && !noProjects ? (
          <AccessDenied
            requiredPermission="Create Team (Manager / SuperAdmin only)"
            role={undefined}
          />
        ) : (
        <main className="p-8">
          {/* Page Header */}
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-slate-900 mb-3 flex items-center gap-3">
              <Users size={36} className="text-slate-700" /> Build a New Team
            </h2>
            <p className="text-lg text-slate-600 ml-[52px]">
              Create your team, select users and assign them roles inline.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left  -  TeamAssignment + Project selector */}
            <div className="lg:col-span-2 space-y-6 relative z-10">

              {/* TeamAssignment card  -  now accepts real users + roles */}
              <TeamAssignment
                selectedMembers={selectedMembers}
                teamName={teamName}
                onMembersChange={setSelectedMembers}
                onTeamNameChange={handleTeamNameChange}
                teamID={teamID}
                teamTemplates={teamTemplates}
                selectedTemplate={selectedTemplate}
                onTemplateSelect={handleTemplateSelect}
                systemUsers={systemUsers}
                assignableRoles={assignableRoles}
                existingMemberIds={existingMemberIds}
                membersWithRoles={membersWithRoles}
                onMembersWithRolesChange={setMembersWithRoles}
              />

              {/* Project Context Banner — shown when coming from a project */}
              {selectedProjectId && (() => {
                const proj = projects.find(p => p.projectID === selectedProjectId);
                return proj ? (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-violet-50 border border-violet-200">
                    <span className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0"><FolderOpen size={16} className="text-violet-600" /></span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-500 font-medium">Assigning members to project</p>
                      <p className="font-bold text-slate-900 text-sm truncate">{proj.projectName}</p>
                    </div>
                    <span className="font-mono text-xs text-violet-500 bg-violet-100 px-2 py-0.5 rounded-md shrink-0">{selectedProjectId}</span>
                  </div>
                ) : null;
              })()}
              {/* RBAC result feedback (shown after Create Team) */}
              {rbacResult && (
                <div className={`p-4 rounded-xl border text-sm font-medium ${
                  rbacResult.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-amber-50 border-amber-200 text-amber-700'
                }`}>
                  {rbacResult.msg}
                </div>
              )}
            </div>

            {/* Right  -  Summary + Actions */}
            <div className="space-y-6">
              {/* Team Summary card */}
              <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <ClipboardList size={16} className="text-slate-400" /> Team Summary
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
                      {membersWithRoles.length > 0
                        ? `${membersWithRoles.length + 1} (incl. you)`
                        : <span className="text-slate-300 font-normal italic">None added</span>}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Project</span>
                    <span className="font-bold text-slate-900 text-right max-w-[140px] truncate">
                      {selectedProjectId
                        ? projects.find(p => p.projectID === selectedProjectId)?.projectName
                        : <span className="text-slate-300 font-normal italic">Unassigned</span>}
                    </span>
                  </div>
                  {/* RBAC assignment preview */}
                  {membersWithRoles.length > 0 && (
                    <div className="pt-2">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Role Assignments</p>
                      <div className="space-y-1.5">
                        {membersWithRoles.map(m => {
                          const RoleIco = m.roleName === 'Manager' ? Briefcase : m.roleName === 'Developer' ? Code2 : Eye;
                          return (
                            <div key={m.userId} className="flex items-center justify-between gap-2">
                              <span className="text-xs text-slate-700 truncate flex-1">{m.name}</span>
                              <span className="text-xs font-bold text-slate-500 shrink-0 flex items-center gap-1">
                                <RoleIco size={11} /> {m.roleName}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleCreateTeam}
                  disabled={saving}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-60 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all text-sm flex items-center justify-center gap-2"
                >
                  {saving
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                    : <><Rocket size={16} />Create Team</>}
                </button>
                <button
                  onClick={handleReset}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all text-sm"
                >
                  <span className="flex items-center justify-center gap-2"><RotateCcw size={15} />Reset Form</span>
                </button>
              </div>
            </div>
          </div>
        </main>
        )}
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl text-center">
            <div className="flex justify-center mb-4"><CheckCircle2 size={64} className="text-emerald-500" /></div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Team Created!</h3>
            <p className="text-slate-600 mb-2">
              <span className="font-bold text-blue-600">{teamName}</span> has been created
              {selectedProjectId && (
                <> and linked to <span className="font-bold text-purple-600">
                  {projects.find(p => p.projectID === selectedProjectId)?.projectName}
                </span></>
              )}.
            </p>
            {membersWithRoles.length > 0 && (
              <p className="text-sm text-slate-500 mb-2">
                {membersWithRoles.length} member{membersWithRoles.length > 1 ? 's' : ''} assigned with RBAC roles.
              </p>
            )}
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

