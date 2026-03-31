'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/shared/Sidebar';
import Topbar from '@/components/shared/Topbar';
import AccessDenied from '@/components/shared/AccessDenied';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { useRbac } from '@/lib/RbacContext';
import { usersService } from '@/lib/users.service';
import type { SystemUser } from '@/lib/users.service';
import { projectsService } from '@/lib/projects.service';
import { useProjects } from '@/lib/ProjectsContext';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProjectAssignment {
  projectId: string;
  projectName: string;
  projectCode: string;
  roleId: string;
  roleName: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const ROLE_BADGE: Record<string, string> = {
  SuperAdmin: 'bg-red-50 text-red-700 border-red-200',
  Manager:    'bg-blue-50 text-blue-700 border-blue-200',
  Developer:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  Client:     'bg-amber-50 text-amber-700 border-amber-200',
};

const AVATAR_COLORS = ['#4361ee', '#06d6a0', '#f9a825', '#7209b7', '#3a86ff', '#ef233c'];

function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MembersPage() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const currentUser = useCurrentUser();
  const { canManage, loading: rbacLoading } = useRbac();
  const { projects } = useProjects();

  // Data state
  const [users,         setUsers]         = useState<SystemUser[]>([]);
  const [roles,         setRoles]         = useState<{ id: string; name: string }[]>([]);
  const [assignmentMap, setAssignmentMap] = useState<Record<string, ProjectAssignment[]>>({});
  const [loading,       setLoading]       = useState(true);
  const [loadError,     setLoadError]     = useState<string | null>(null);

  // Assign modal state
  const [assignTarget,  setAssignTarget]  = useState<SystemUser | null>(null);
  const [pickedProject, setPickedProject] = useState('');
  const [pickedRole,    setPickedRole]    = useState('');
  const [saving,        setSaving]        = useState(false);
  const [assignError,   setAssignError]   = useState('');

  // ── Load all users + build assignment map ────────────────────────────────

  const loadData = useCallback(async () => {
    if (projects.length === 0) return;
    setLoading(true);
    setLoadError(null);
    try {
      const [allUsers, allRoles] = await Promise.all([
        usersService.getAll(),
        projectsService.getRoles(),
      ]);
      setUsers(allUsers);
      setRoles(allRoles);

      // For each accessible project fetch its member list and build userId → assignments map
      const map: Record<string, ProjectAssignment[]> = {};
      await Promise.all(
        projects.map(async (proj) => {
          try {
            const members = await projectsService.getMembers(proj.id);
            members.forEach((m) => {
              if (!map[m.userId]) map[m.userId] = [];
              map[m.userId].push({
                projectId:   proj.id,
                projectName: proj.projectName,
                projectCode: proj.projectID,
                roleId:      m.roleId,
                roleName:    m.roleName,
              });
            });
          } catch {
            // skip projects we can't access
          }
        }),
      );
      setAssignmentMap(map);
    } catch {
      setLoadError('Failed to load users. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  }, [projects]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  function openAssignModal(user: SystemUser) {
    setAssignTarget(user);
    setPickedProject('');
    setPickedRole('');
    setAssignError('');
  }

  async function handleAssign() {
    if (!assignTarget || !pickedProject || !pickedRole) return;
    setSaving(true);
    setAssignError('');
    try {
      await projectsService.addMember(pickedProject, assignTarget.id, pickedRole);
      const proj = projects.find((p) => p.id === pickedProject);
      const role = roles.find((r) => r.id === pickedRole);
      if (proj && role) {
        setAssignmentMap((prev) => ({
          ...prev,
          [assignTarget.id]: [
            ...(prev[assignTarget.id] ?? []),
            {
              projectId:   pickedProject,
              projectName: proj.projectName,
              projectCode: proj.projectID,
              roleId:      pickedRole,
              roleName:    role.name,
            },
          ],
        }));
      }
      setAssignTarget(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to assign. User may already be in this project.';
      setAssignError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(userId: string, projectId: string) {
    if (!confirm('Remove this user from the project?')) return;
    try {
      await projectsService.removeMember(projectId, userId);
      setAssignmentMap((prev) => ({
        ...prev,
        [userId]: (prev[userId] ?? []).filter((a) => a.projectId !== projectId),
      }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to remove member';
      alert(msg);
    }
  }

  async function handleRoleChange(userId: string, projectId: string, newRoleId: string) {
    const role = roles.find((r) => r.id === newRoleId);
    if (!role) return;
    try {
      await projectsService.updateMemberRole(projectId, userId, newRoleId);
      setAssignmentMap((prev) => ({
        ...prev,
        [userId]: (prev[userId] ?? []).map((a) =>
          a.projectId === projectId ? { ...a, roleId: newRoleId, roleName: role.name } : a,
        ),
      }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to update role';
      alert(msg);
    }
  }

  // Projects this user is NOT yet assigned to (filters out already-assigned ones)
  const unassignedProjects = assignTarget
    ? projects.filter(
        (p) => !(assignmentMap[assignTarget.id] ?? []).some((a) => a.projectId === p.id),
      )
    : [];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen" style={{ background: '#f4f6fb' }}>
      <Topbar
        title="Members"
        subtitle="Manage user project access"
        onMenuToggle={() => setMobileNavOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

        <main className="flex-1 overflow-auto p-4 md:p-6">

          {/* ── RBAC gate ─────────────────────────────────────────────────── */}
          {rbacLoading ? (
            <div className="flex h-[60vh] items-center justify-center text-slate-400 text-sm">
              Checking permissions…
            </div>
          ) : !canManage ? (
            <AccessDenied
              requiredPermission="MANAGE_USERS (Manager / SuperAdmin only)"
              role={undefined}
            />
          ) : (
            <>
              {/* Page header */}
              <div className="mb-5">
                <h1 className="text-xl font-semibold text-slate-800">User Management</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Assign users to projects and manage their roles
                </p>
              </div>

              {loadError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {loadError}
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="flex flex-col items-center gap-3 text-slate-400">
                    <div className="w-6 h-6 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
                    <span className="text-sm">Loading users…</span>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">

                  {/* Table column headers */}
                  <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 grid grid-cols-[1fr_auto] gap-4">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      User &amp; Assignments
                    </span>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Action
                    </span>
                  </div>

                  {users.length === 0 && (
                    <div className="px-5 py-12 text-center text-slate-400 text-sm">
                      No registered users found
                    </div>
                  )}

                  {users.map((user, idx) => {
                    const assignments  = assignmentMap[user.id] ?? [];
                    const isCurrentUser = user.id === currentUser?.id;

                    return (
                      <div
                        key={user.id}
                        className={`px-5 py-4 ${idx !== users.length - 1 ? 'border-b border-slate-100' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Avatar */}
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5"
                            style={{ backgroundColor: avatarColor(user.name) }}
                          >
                            {initials(user.name)}
                          </div>

                          {/* Name + email + assignments */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-slate-800">
                                {user.name}
                              </span>
                              {isCurrentUser && (
                                <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                                  you
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">{user.email}</div>

                            {/* Project assignment pills */}
                            {assignments.length === 0 ? (
                              <p className="text-xs text-slate-400 italic mt-2">
                                No project assignments
                              </p>
                            ) : (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {assignments.map((a) => (
                                  <div
                                    key={a.projectId}
                                    className="flex items-center gap-1 border border-slate-200 rounded-full pl-2.5 pr-1 py-0.5 bg-white text-xs"
                                  >
                                    <span className="text-slate-600 font-medium">
                                      {a.projectCode}
                                    </span>

                                    {/* Role selector (disabled for current user) */}
                                    {isCurrentUser ? (
                                      <span
                                        className={`text-xs font-medium px-1.5 py-0.5 rounded-full border mx-0.5 ${ROLE_BADGE[a.roleName] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}
                                      >
                                        {a.roleName}
                                      </span>
                                    ) : (
                                      <select
                                        value={a.roleId}
                                        onChange={(e) =>
                                          handleRoleChange(user.id, a.projectId, e.target.value)
                                        }
                                        className={`text-xs font-medium px-1.5 py-0.5 rounded-full border mx-0.5 cursor-pointer outline-none ${ROLE_BADGE[a.roleName] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}
                                      >
                                        {roles.map((r) => (
                                          <option key={r.id} value={r.id}>
                                            {r.name}
                                          </option>
                                        ))}
                                      </select>
                                    )}

                                    {/* Remove from project */}
                                    {!isCurrentUser && (
                                      <button
                                        onClick={() => handleRemove(user.id, a.projectId)}
                                        className="text-slate-300 hover:text-red-500 transition-colors ml-0.5"
                                        title={`Remove from ${a.projectCode}`}
                                      >
                                        <svg
                                          width="11"
                                          height="11"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2.5"
                                          strokeLinecap="round"
                                        >
                                          <line x1="18" y1="6" x2="6" y2="18" />
                                          <line x1="6" y1="6" x2="18" y2="18" />
                                        </svg>
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Assign to project button */}
                          {!isCurrentUser && (
                            <button
                              onClick={() => openAssignModal(user)}
                              className="flex-shrink-0 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium px-2.5 py-1.5 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                            >
                              <svg
                                width="11"
                                height="11"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              >
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                              </svg>
                              Assign
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* ── Assign to Project modal ──────────────────────────────────────── */}
      {assignTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setAssignTarget(null);
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-1">
              Assign to Project
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Assigning{' '}
              <span className="font-semibold text-slate-700">{assignTarget.name}</span>
            </p>

            <div className="space-y-3">
              {/* Project picker */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Project
                </label>
                <select
                  value={pickedProject}
                  onChange={(e) => setPickedProject(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                >
                  <option value="">Select a project…</option>
                  {unassignedProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.projectID} — {p.projectName}
                    </option>
                  ))}
                </select>
                {unassignedProjects.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    This user is already assigned to all accessible projects
                  </p>
                )}
              </div>

              {/* Role picker */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Role
                </label>
                <select
                  value={pickedRole}
                  onChange={(e) => setPickedRole(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                >
                  <option value="">Select a role…</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              {assignError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {assignError}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setAssignTarget(null)}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={!pickedProject || !pickedRole || saving || unassignedProjects.length === 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Assigning…' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
