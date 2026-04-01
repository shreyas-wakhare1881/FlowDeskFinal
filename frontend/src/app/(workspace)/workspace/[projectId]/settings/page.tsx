'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { projectsService } from '@/lib/projects.service';
import { useRbac } from '@/lib/RbacContext';
import AddPeopleModal from '@/components/dashboard/AddPeopleModal';
import type { Project } from '@/types/project';

// ── SVG Icons ─────────────────────────────────────────────────────────────────

const SaveIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

const BackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const AddPeopleIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <line x1="19" y1="8" x2="19" y2="14" />
    <line x1="22" y1="11" x2="16" y2="11" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const TeamIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const GlobeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

// ── Types ──────────────────────────────────────────────────────────────────────

interface Member {
  userId: string;
  name: string;
  email: string;
  roleId: string;
  roleName: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
}

const CATEGORIES = [
  'General', 'Backend', 'Frontend', 'Design', 'QA', 'Security',
  'DevOps', 'Mobile', 'Analytics', 'Infrastructure', 'Other',
];

const AVATAR_COLORS = ['#4361ee', '#06d6a0', '#3a86ff', '#7209b7', '#f9a825', '#ef233c', '#0096c7', '#e76f51'];
function avatarColor(name: string): string {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

type Tab = 'details' | 'access';

// ── Component ──────────────────────────────────────────────────────────────────

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string; // PRJ-001 short code
  const { canManage, role: globalRole } = useRbac();
  const isSuperAdmin = globalRole === 'SuperAdmin';
  const canEdit = canManage;

  const [tab, setTab] = useState<Tab>('details');
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddPeople, setShowAddPeople] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Form state
  const [form, setForm] = useState({
    projectName: '',
    projectDescription: '',
    projectKey: '',
    category: 'General',
    visibility: 'PRIVATE' as 'PRIVATE' | 'PUBLIC',
  });
  const [formDirty, setFormDirty] = useState(false);

  const showToast = useCallback((msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Fetch project + members + roles
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [proj, rolesList] = await Promise.all([
        projectsService.getByProjectID(projectId),
        projectsService.getRoles(),
      ]);
      setProject(proj);
      setRoles(rolesList);
      setForm({
        projectName: proj.projectName ?? '',
        projectDescription: proj.projectDescription ?? '',
        projectKey: proj.projectKey ?? '',
        category: proj.category ?? 'General',
        visibility: (proj.visibility as 'PRIVATE' | 'PUBLIC') ?? 'PRIVATE',
      });
      // Load members using the UUID
      const membersList = await projectsService.getMembers(proj.id);
      setMembers(membersList);
    } catch {
      showToast('Failed to load project', 'error');
    } finally {
      setLoading(false);
    }
  }, [projectId, showToast]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleFormChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setFormDirty(true);
  };

  const handleSave = async () => {
    if (!project) return;
    setSaving(true);
    try {
      await projectsService.update(project.id, {
        projectName: form.projectName,
        projectDescription: form.projectDescription,
        projectKey: form.projectKey || undefined,
        category: form.category,
        visibility: form.visibility,
      });
      showToast('Project settings saved', 'success');
      setFormDirty(false);
      setProject(prev => prev ? { ...prev, ...form } : prev);
    } catch {
      showToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async (userId: string, name: string) => {
    if (!project) return;
    if (!window.confirm(`Remove ${name} from this project?`)) return;
    try {
      await projectsService.removeMember(project.id, userId);
      setMembers(prev => prev.filter(m => m.userId !== userId));
      showToast(`${name} removed`, 'success');
    } catch {
      showToast(`Failed to remove ${name}`, 'error');
    }
  };

  const handleRoleChange = async (userId: string, roleId: string, name: string) => {
    if (!project) return;
    try {
      await projectsService.updateMemberRole(project.id, userId, roleId);
      setMembers(prev => prev.map(m =>
        m.userId === userId
          ? { ...m, roleId, roleName: roles.find(r => r.id === roleId)?.name ?? m.roleName }
          : m
      ));
      showToast(`${name}'s role updated`, 'success');
    } catch {
      showToast('Failed to update role', 'error');
    }
  };

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            background: '#fff', borderRadius: '14px', padding: '24px',
            marginBottom: '16px', border: '1px solid #f1f5f9',
          }}>
            <div style={{ height: '16px', background: '#f1f5f9', borderRadius: '8px', width: '30%', marginBottom: '16px' }} />
            <div style={{ height: '12px', background: '#f8fafc', borderRadius: '6px', width: '70%', marginBottom: '10px' }} />
            <div style={{ height: '12px', background: '#f8fafc', borderRadius: '6px', width: '50%' }} />
          </div>
        ))}
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <style>{`
        .ps-input { width:100%; padding:9px 13px; border:1.5px solid #e2e8f0; border-radius:9px; font-size:0.87rem; color:#0f172a; background:#fff; outline:none; transition:border-color 0.15s; box-sizing:border-box; }
        .ps-input:focus { border-color:#4361ee; box-shadow:0 0 0 3px rgba(67,97,238,0.08); }
        .ps-input:disabled { background:#f8fafc; color:#94a3b8; cursor:not-allowed; }
        .ps-tab { padding:10px 18px; border:none; background:transparent; font-size:0.85rem; font-weight:500; color:#64748b; cursor:pointer; border-bottom:2px solid transparent; transition:all 0.15s; display:flex; align-items:center; gap:7px; }
        .ps-tab.active { color:#4361ee; border-bottom-color:#4361ee; }
        .ps-tab:hover:not(.active) { color:#374151; background:#f8fafc; }
        .ps-member-row:hover { background:#f8fafc !important; }
        .ps-role-select { padding:4px 8px; border:1.5px solid #e2e8f0; border-radius:7px; font-size:0.78rem; color:#374151; background:#fff; outline:none; cursor:pointer; }
        .ps-role-select:focus { border-color:#4361ee; }
        .ps-role-select:disabled { background:#f8fafc; cursor:not-allowed; }
        .ps-btn-save { display:flex; align-items:center; gap:7px; padding:9px 20px; background:#4361ee; color:#fff; border:none; border-radius:9px; font-size:0.86rem; font-weight:600; cursor:pointer; transition:background 0.15s; }
        .ps-btn-save:hover { background:#3651ce; }
        .ps-btn-save:disabled { background:#94a3b8; cursor:not-allowed; }
        .ps-vis-pill { display:flex; align-items:center; gap:6px; padding:7px 14px; border-radius:8px; font-size:0.82rem; font-weight:500; cursor:pointer; border:1.5px solid #e2e8f0; transition:all 0.15s; }
        .ps-vis-pill.active-private { background:#fff7ed; border-color:#fb923c; color:#c2410c; }
        .ps-vis-pill.active-public  { background:#f0fdf4; border-color:#4ade80; color:#15803d; }
        .ps-vis-pill:not(.active-private):not(.active-public) { background:#fff; color:#64748b; }
        @keyframes ps-toast-in { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #e2e8f0',
        padding: '0 32px',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Back + title row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '20px 0 0' }}>
            <button onClick={() => router.back()} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '32px', height: '32px', border: '1.5px solid #e2e8f0',
              borderRadius: '8px', background: '#fff', cursor: 'pointer', color: '#64748b',
              transition: 'all 0.15s', flexShrink: 0,
            }}>
              <BackIcon />
            </button>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                Project Settings
              </h1>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                {project?.projectName} &bull; {projectId}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '4px', marginTop: '12px' }}>
            <button
              className={`ps-tab ${tab === 'details' ? 'active' : ''}`}
              onClick={() => setTab('details')}
            >
              <SettingsIcon />
              Details
            </button>
            <button
              className={`ps-tab ${tab === 'access' ? 'active' : ''}`}
              onClick={() => setTab('access')}
            >
              <TeamIcon />
              Members &amp; Access
            </button>
          </div>
        </div>
      </div>

      {/* ── Page body ───────────────────────────────────────────────────── */}
      <div style={{ padding: '28px 32px', maxWidth: '800px', margin: '0 auto' }}>

        {/* ── TAB: DETAILS ─────────────────────────────────────────────── */}
        {tab === 'details' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Basic Info card */}
            <div style={{
              background: '#fff', borderRadius: '14px', padding: '24px',
              border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}>
              <h2 style={{ margin: '0 0 18px', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                Basic Information
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Project Name */}
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ fontSize: '0.76rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
                    Project Name
                  </label>
                  <input
                    className="ps-input"
                    value={form.projectName}
                    onChange={e => handleFormChange('projectName', e.target.value)}
                    disabled={!canEdit}
                    placeholder="Enter project name"
                  />
                </div>

                {/* Project Key */}
                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
                    Project Key
                    <span style={{ fontSize: '0.7rem', fontWeight: 400, color: '#94a3b8', marginLeft: '6px' }}>
                      (e.g. SCRUM)
                    </span>
                  </label>
                  <input
                    className="ps-input"
                    value={form.projectKey}
                    onChange={e => handleFormChange('projectKey', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                    disabled={!canEdit}
                    placeholder="AUTO"
                    maxLength={10}
                  />
                </div>

                {/* Category */}
                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
                    Category
                  </label>
                  <select
                    className="ps-input"
                    value={form.category}
                    onChange={e => handleFormChange('category', e.target.value)}
                    disabled={!canEdit}
                    style={{ cursor: canEdit ? 'pointer' : 'not-allowed' }}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Description */}
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ fontSize: '0.76rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
                    Description
                  </label>
                  <textarea
                    className="ps-input"
                    value={form.projectDescription}
                    onChange={e => handleFormChange('projectDescription', e.target.value)}
                    disabled={!canEdit}
                    placeholder="Describe what this project is about…"
                    rows={3}
                    style={{ resize: 'vertical', minHeight: '80px' }}
                  />
                </div>
              </div>
            </div>

            {/* Visibility card */}
            <div style={{
              background: '#fff', borderRadius: '14px', padding: '24px',
              border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}>
              <h2 style={{ margin: '0 0 6px', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                Visibility
              </h2>
              <p style={{ margin: '0 0 16px', fontSize: '0.8rem', color: '#64748b' }}>
                Control who can see this project
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className={`ps-vis-pill ${form.visibility === 'PRIVATE' ? 'active-private' : ''}`}
                  onClick={() => canEdit && handleFormChange('visibility', 'PRIVATE')}
                  disabled={!canEdit}
                >
                  <LockIcon />
                  Private
                </button>
                <button
                  className={`ps-vis-pill ${form.visibility === 'PUBLIC' ? 'active-public' : ''}`}
                  onClick={() => canEdit && handleFormChange('visibility', 'PUBLIC')}
                  disabled={!canEdit}
                >
                  <GlobeIcon />
                  Public
                </button>
              </div>
              <p style={{ margin: '10px 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                {form.visibility === 'PRIVATE'
                  ? 'Only project members can view this project.'
                  : 'All FlowDesk users can view this project.'}
              </p>
            </div>

            {/* Save button */}
            {canEdit && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="ps-btn-save"
                  onClick={handleSave}
                  disabled={saving || !formDirty}
                >
                  <SaveIcon />
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            )}

            {!canEdit && (
              <div style={{
                padding: '12px 16px', background: '#fff7ed', border: '1px solid #fed7aa',
                borderRadius: '10px', fontSize: '0.8rem', color: '#9a3412',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <LockIcon />
                You have view-only access. Contact a Manager or SuperAdmin to make changes.
              </div>
            )}
          </div>
        )}

        {/* ── TAB: ACCESS ──────────────────────────────────────────────── */}
        {tab === 'access' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{
              background: '#fff', borderRadius: '14px', padding: '24px',
              border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}>
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                    Project Members
                  </h2>
                  <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                    {members.length} member{members.length !== 1 ? 's' : ''}
                  </p>
                </div>
                {(canManage || isSuperAdmin) && (
                  <button
                    onClick={() => setShowAddPeople(true)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '7px',
                      padding: '8px 16px', background: '#4361ee', color: '#fff',
                      border: 'none', borderRadius: '9px', fontSize: '0.83rem',
                      fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s',
                    }}
                  >
                    <AddPeopleIcon />
                    Add People
                  </button>
                )}
              </div>

              {/* Members table */}
              {members.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
                      stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <p style={{ fontSize: '0.85rem', margin: 0 }}>No members yet — add people to get started</p>
                </div>
              ) : (
                <div>
                  {/* Table header */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr auto auto',
                    padding: '8px 12px', borderBottom: '1px solid #f1f5f9',
                    fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    gap: '12px',
                  }}>
                    <span>Member</span>
                    <span>Email</span>
                    <span>Role</span>
                    <span></span>
                  </div>

                  {members.map(member => (
                    <div
                      key={member.userId}
                      className="ps-member-row"
                      style={{
                        display: 'grid', gridTemplateColumns: '1fr 1fr auto auto',
                        padding: '11px 12px', borderBottom: '1px solid #f8fafc',
                        alignItems: 'center', gap: '12px', transition: 'background 0.12s',
                      }}
                    >
                      {/* Avatar + Name */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '34px', height: '34px', borderRadius: '50%',
                          background: avatarColor(member.name),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
                        }}>
                          {getInitials(member.name)}
                        </div>
                        <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#0f172a' }}>
                          {member.name}
                        </span>
                      </div>

                      {/* Email */}
                      <span style={{ fontSize: '0.8rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {member.email}
                      </span>

                      {/* Role dropdown */}
                      <select
                        className="ps-role-select"
                        value={member.roleId}
                        onChange={e => handleRoleChange(member.userId, e.target.value, member.name)}
                        disabled={!canManage && !isSuperAdmin}
                      >
                        {roles.map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>

                      {/* Remove button */}
                      {(canManage || isSuperAdmin) && (
                        <button
                          onClick={() => handleRemoveMember(member.userId, member.name)}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: '30px', height: '30px', border: '1.5px solid #fee2e2',
                            borderRadius: '7px', background: '#fff', color: '#ef4444',
                            cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
                          }}
                          title={`Remove ${member.name}`}
                        >
                          <TrashIcon />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Add People Modal ───────────────────────────────────────────── */}
      {showAddPeople && project && (
        <AddPeopleModal
          projectId={project.id}
          projectName={project.projectName}
          onClose={() => setShowAddPeople(false)}
          onMembersChanged={async () => {
            const updated = await projectsService.getMembers(project.id);
            setMembers(updated);
          }}
        />
      )}

      {/* ── Toast ─────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '28px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, background: toast.type === 'success' ? '#0f172a' : '#dc2626',
          color: '#fff', padding: '12px 22px', borderRadius: '12px',
          fontSize: '0.85rem', fontWeight: 500,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          animation: 'ps-toast-in 0.2s ease',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          {toast.type === 'success' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="#fca5a5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
