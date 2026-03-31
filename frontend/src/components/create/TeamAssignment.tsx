'use client';

import { useState, useEffect } from 'react';
import { Users, User, Zap, Briefcase, Code2, Eye, Crown, X, CheckCircle2 } from 'lucide-react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';

// â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/** Raw user as returned by GET /users */
export interface SystemUser {
  id: string;
  name: string;
  email: string;
}

/** Role option from GET /projects/roles */
export interface AssignableRole {
  id: string;
  name: string;   // 'Manager' | 'Developer' | 'Client'
}

/** A selected member paired with their chosen role UUID */
export interface MemberWithRole {
  userId: string;
  name: string;
  email: string;
  roleId: string;
  roleName: string;
}

export interface TeamTemplate {
  id: string;
  name: string;
  icon: string;
  members: string[];
  metaText: string;
}

interface TeamAssignmentProps {
  // Legacy props (used by "Create Team" flow â€” team name / template)
  selectedMembers: string[];        // kept for backward compat (team member names)
  teamName: string;
  teamID: string;
  onMembersChange: (members: string[]) => void;
  onTeamNameChange: (name: string) => void;
  teamTemplates: TeamTemplate[];
  selectedTemplate: string;
  onTemplateSelect: (template: TeamTemplate) => void;

  // â”€â”€ RBAC props â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  /** All registered users from GET /users */
  systemUsers?: SystemUser[];
  /** Roles from GET /projects/roles */
  assignableRoles?: AssignableRole[];
  /** UUIDs of users already assigned to the project (shown as disabled) */
  existingMemberIds?: string[];
  /** The members + roles the parent wants to assign */
  membersWithRoles?: MemberWithRole[];
  onMembersWithRolesChange?: (members: MemberWithRole[]) => void;
}

// â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const ROLE_META: Record<string, { color: string; bg: string; border: string }> = {
  Manager:   { color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-300' },
  Developer: { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-300' },
  Client:    { color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-300' },
};

function RoleIcon({ role, size = 12 }: { role: string; size?: number }) {
  if (role === 'Manager')   return <Briefcase size={size} />;
  if (role === 'Developer') return <Code2 size={size} />;
  if (role === 'Client')    return <Eye size={size} />;
  return <User size={size} />;
}

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function getColor(name: string): string {
  const COLORS = ['#4361ee', '#06d6a0', '#f9a825', '#7209b7', '#3a86ff', '#ef233c', '#38b000'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

// â”€â”€ Team View Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function TeamViewModal({
  teamName,
  teamID,
  isDefault,
  membersWithRoles,
  onClose,
  currentUser,
}: {
  teamName: string;
  teamID: string;
  isDefault: boolean;
  membersWithRoles: MemberWithRole[];
  onClose: () => void;
  currentUser: { name: string; initials: string };
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 99999 }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white text-xl font-bold transition-all"
          ><X size={16} /></button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">
              {isDefault ? <Zap size={20} className="text-white" /> : <Users size={20} className="text-white" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white leading-tight">{teamName || 'New Team'}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-mono bg-white/15 text-white px-2 py-0.5 rounded-lg">{teamID}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${
                  isDefault ? 'bg-purple-300/30 text-purple-100' : 'bg-emerald-300/30 text-emerald-100'
                }`}>{isDefault ? 'Default' : 'Custom'}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Team Lead</p>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow"
                style={{ backgroundColor: '#4361ee' }}>
                {currentUser.initials}
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-900 text-sm">{currentUser.name}</p>
                <p className="text-xs text-blue-500 font-medium">Team Lead</p>
              </div>
              <span className="text-xl"><Crown size={18} className="text-yellow-400" /></span>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Members ({membersWithRoles.length})
            </p>
            {membersWithRoles.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-xl text-center text-sm text-slate-400 border border-slate-100">
                No additional members assigned
              </div>
            ) : (
              <div className="space-y-2">
                {membersWithRoles.map((m) => {
                  const meta = ROLE_META[m.roleName];
                  return (
                    <div key={m.userId} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow"
                        style={{ backgroundColor: getColor(m.name) }}>
                        {getInitials(m.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate">{m.name}</p>
                        <p className="text-xs text-slate-400 truncate">{m.email}</p>
                      </div>
                      {meta && (
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border shrink-0 ${meta.bg} ${meta.color} ${meta.border}`}>
                          <RoleIcon role={m.roleName} size={12} />{' '}{m.roleName}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
            <span className="text-sm text-slate-500">Total size</span>
            <span className="font-bold text-slate-900 text-sm">
              {membersWithRoles.length + 1} member{membersWithRoles.length + 1 !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// â”€â”€ RolePicker â€” inline dropdown â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function RolePicker({
  roles,
  selectedRoleId,
  onChange,
}: {
  roles: AssignableRole[];
  selectedRoleId: string;
  onChange: (roleId: string, roleName: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = roles.find((r) => r.id === selectedRoleId);
  const meta = selected ? ROLE_META[selected.name] : null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all shrink-0 ${
          meta
            ? `${meta.bg} ${meta.color} ${meta.border}`
            : 'bg-slate-100 border-slate-300 text-slate-500'
        } hover:shadow-sm`}
      >
        {meta ? (<><RoleIcon role={selected!.name} size={11} /><span className="ml-1">{selected!.name}</span></>) : 'Select role'}
        <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={(e) => { e.stopPropagation(); setOpen(false); }} />
          <div className="absolute right-0 top-full mt-1 bg-white border-2 border-slate-200 rounded-xl shadow-xl z-30 overflow-hidden min-w-[140px]">
            {roles.map((r) => {
              const m = ROLE_META[r.name];
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onChange(r.id, r.name); setOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold text-left transition-all border-b border-slate-50 last:border-0 hover:bg-slate-50 ${
                    selectedRoleId === r.id ? (m?.bg ?? 'bg-slate-50') : ''
                  }`}
                >
                  <RoleIcon role={r.name} size={11} />
                  <span className={m?.color ?? 'text-slate-700'}>{r.name}</span>
                  {selectedRoleId === r.id && (
                    <svg className="w-3 h-3 ml-auto text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function TeamAssignment({
  selectedMembers,
  teamName,
  teamID,
  onMembersChange,
  onTeamNameChange,
  teamTemplates,
  selectedTemplate,
  onTemplateSelect,
  systemUsers = [],
  assignableRoles = [],
  existingMemberIds = [],
  membersWithRoles = [],
  onMembersWithRolesChange,
}: TeamAssignmentProps) {
  const [activeTab, setActiveTab] = useState<'members' | 'teams'>('members');
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const currentUser = useCurrentUser();
  const isDefault = !!selectedTemplate;

  // Default role = first assignable role (e.g. Developer)
  const defaultRoleId = assignableRoles[1]?.id ?? assignableRoles[0]?.id ?? '';
  const defaultRoleName = assignableRoles[1]?.name ?? assignableRoles[0]?.name ?? '';

  const toggleMember = (user: SystemUser) => {
    if (!onMembersWithRolesChange) return;
    const exists = membersWithRoles.find((m) => m.userId === user.id);
    if (exists) {
      onMembersWithRolesChange(membersWithRoles.filter((m) => m.userId !== user.id));
      // also sync legacy string array
      onMembersChange(selectedMembers.filter((n) => n !== user.name));
    } else {
      onMembersWithRolesChange([
        ...membersWithRoles,
        { userId: user.id, name: user.name, email: user.email, roleId: defaultRoleId, roleName: defaultRoleName },
      ]);
      onMembersChange([...selectedMembers, user.name]);
    }
  };

  const updateMemberRole = (userId: string, roleId: string, roleName: string) => {
    if (!onMembersWithRolesChange) return;
    onMembersWithRolesChange(
      membersWithRoles.map((m) => m.userId === userId ? { ...m, roleId, roleName } : m),
    );
  };

  // Avatar list for team ID display
  const allAvatars = [
    { avatar: currentUser.initials, color: '#4361ee', name: currentUser.name },
    ...membersWithRoles.map((m) => ({ avatar: getInitials(m.name), color: getColor(m.name), name: m.name })),
  ];

  const totalSelected = membersWithRoles.length + 1;

  // Filter users for dropdown
  const filteredUsers = systemUsers.filter((u) =>
    u.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(memberSearch.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
        <div className="w-12 h-12 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl flex items-center justify-center shadow-md">
          <Users size={24} className="text-emerald-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-900">Assign To</h3>
          <p className="text-sm text-slate-500">Multi-select supported · Role per member</p>
        </div>
        <div className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg border border-blue-200">
          {totalSelected} selected
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 p-1 bg-slate-100 rounded-xl">
        <button
          onClick={() => setActiveTab('members')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'members' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <span className="flex items-center gap-1.5"><User size={14} />Members</span>
        </button>
        <button
          onClick={() => setActiveTab('teams')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'teams' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <span className="flex items-center gap-1.5"><Zap size={14} />Quick Teams</span>
        </button>
      </div>

      {/* â”€â”€ TAB 1: Members â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {activeTab === 'members' && (
        <div className="mb-6">
          {/* Current User â€” pinned Team Lead */}
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            You (Team Lead)
          </p>
          <div className="flex items-center gap-3 px-4 py-3.5 mb-5 rounded-xl border-2 border-blue-300 bg-blue-50 shadow-sm">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-md"
              style={{ backgroundColor: '#4361ee' }}>
              {currentUser.initials}
            </div>
            <div className="flex-1">
              <p className="font-bold text-slate-900 text-sm">{currentUser.name}</p>
              <p className="text-xs text-blue-500 font-medium">Team Lead · Always assigned</p>
            </div>
            <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          {/* â”€â”€ Selected members with role chips â”€â”€ */}
          {membersWithRoles.length > 0 && (
            <div className="mb-4 space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Selected ({membersWithRoles.length})
              </p>
              {membersWithRoles.map((m) => (
                <div key={m.userId}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: getColor(m.name) }}>
                    {getInitials(m.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">{m.name}</p>
                    <p className="text-xs text-slate-400 truncate">{m.email}</p>
                  </div>
                  {/* Inline role picker */}
                  {assignableRoles.length > 0 && (
                    <RolePicker
                      roles={assignableRoles}
                      selectedRoleId={m.roleId}
                      onChange={(roleId, roleName) => updateMemberRole(m.userId, roleId, roleName)}
                    />
                  )}
                  {/* Remove */}
                  <button
                    type="button"
                    title="Remove"
                    onClick={() => toggleMember({ id: m.userId, name: m.name, email: m.email })}
                    className="w-6 h-6 rounded-lg bg-slate-200 hover:bg-red-100 hover:text-red-500 flex items-center justify-center text-slate-500 transition-all shrink-0"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add Members â€” search + dropdown */}
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Add Members
          </p>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              value={memberSearch}
              onChange={(e) => { setMemberSearch(e.target.value); setDropdownOpen(true); }}
              onFocus={() => setDropdownOpen(true)}
              placeholder={systemUsers.length > 0 ? `Search ${systemUsers.length} registered users...` : 'Search team members'}
              className="w-full pl-9 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
            />

            {/* Dropdown */}
            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => { setDropdownOpen(false); setMemberSearch(''); }} />
                <div className="absolute left-0 right-0 top-[calc(100%+6px)] bg-white border-2 border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden">
                  {/* Header */}
                  <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
                    <p className="text-xs text-slate-400 font-medium">
                      {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} — select to assign
                    </p>
                  </div>

                  <div className="max-h-56 overflow-y-auto">
                    {filteredUsers.map((user) => {
                      const isSelected = membersWithRoles.some((m) => m.userId === user.id);
                      const isExisting = existingMemberIds.includes(user.id);
                      return (
                        <button
                          key={user.id}
                          type="button"
                          disabled={isExisting}
                          onClick={() => { if (!isExisting) toggleMember(user); }}
                          className={`w-full flex items-center gap-3 px-4 py-3 transition-all text-left border-b border-slate-100 last:border-0 ${
                            isExisting
                              ? 'opacity-50 cursor-not-allowed bg-slate-50'
                              : isSelected
                              ? 'bg-blue-50'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0"
                            style={{ backgroundColor: getColor(user.name) }}>
                            {getInitials(user.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 text-sm truncate">{user.name}</p>
                            <p className="text-xs text-slate-400 truncate">{user.email}</p>
                          </div>
                          {isExisting ? (
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-lg shrink-0">
                              Assigned
                            </span>
                          ) : isSelected ? (
                            <div className="w-5 h-5 bg-blue-600 rounded-md flex items-center justify-center shadow shrink-0">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          ) : null}
                        </button>
                      );
                    })}
                    {filteredUsers.length === 0 && (
                      <div className="px-4 py-5 text-center text-sm text-slate-400">No users found</div>
                    )}
                  </div>

                  {/* Confirm button */}
                  {membersWithRoles.length > 0 && (
                    <div className="p-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => { setDropdownOpen(false); setMemberSearch(''); }}
                        className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-bold rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Add {membersWithRoles.length} Member{membersWithRoles.length > 1 ? 's' : ''}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* â”€â”€ TAB 2: Quick Teams â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {activeTab === 'teams' && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Select a Pre-built Team
          </p>
          <div className="space-y-2.5">
            {teamTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => onTemplateSelect(template)}
                className={`
                  w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left
                  ${
                    selectedTemplate === template.id
                      ? 'bg-purple-50 border-purple-300 shadow-lg ring-2 ring-purple-100'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:shadow-md'
                  }
                `}
              >
                <span className="text-2xl">{template.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-sm">{template.name}</p>
                  <p className="text-xs text-slate-500 truncate">{template.metaText}</p>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">{template.id}</p>
                </div>
                {selectedTemplate === template.id ? (
                  <div className="shrink-0 w-6 h-6 bg-purple-600 rounded-lg flex items-center justify-center shadow-md">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                ) : (
                  <svg className="shrink-0 w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
          {selectedTemplate && (
            <div className="mt-3 p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-700 font-medium">
              <span className="flex items-center gap-1.5"><CheckCircle2 size={13} />Template applied — members auto-filled in the Members tab</span>
            </div>
          )}
        </div>
      )}

      {/* Team Name */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Team Name
        </label>
        <input
          type="text"
          value={teamName}
          onChange={(e) => onTeamNameChange(e.target.value)}
          placeholder="Enter team name (e.g., Design Team, Dev Team)"
          className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
        />
      </div>

      {/* Team ID */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Team ID</label>
        <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl">
          <span className="text-sm font-mono font-bold text-slate-600 flex-1 truncate">{teamID}</span>
          {isDefault
            ? <span className="shrink-0 text-xs px-2 py-0.5 bg-purple-100 text-purple-600 font-semibold rounded-lg">Default</span>
            : <span className="shrink-0 text-xs px-2 py-0.5 bg-emerald-100 text-emerald-600 font-semibold rounded-lg">Custom</span>
          }
          <button
            type="button"
            onClick={() => setShowTeamModal(true)}
            title="View team"
            className="flex items-center hover:scale-105 transition-transform ml-1 cursor-pointer"
          >
            <div className="flex" style={{ direction: 'ltr' }}>
              {allAvatars.slice(0, 4).map((m, i) => (
                <div key={i} title={m.name}
                  className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-bold shadow-sm"
                  style={{ backgroundColor: m.color, marginLeft: i === 0 ? 0 : '-8px', zIndex: 10 - i, position: 'relative' }}>
                  {m.avatar}
                </div>
              ))}
              {allAvatars.length > 4 && (
                <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-slate-600 text-[10px] font-bold shadow-sm"
                  style={{ marginLeft: '-8px', zIndex: 5, position: 'relative' }}>
                  +{allAvatars.length - 4}
                </div>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Team View Modal */}
      {showTeamModal && (
        <TeamViewModal
          teamName={teamName}
          teamID={teamID}
          isDefault={isDefault}
          membersWithRoles={membersWithRoles}
          onClose={() => setShowTeamModal(false)}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}

