'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { projectsService } from '@/lib/projects.service';

// ── SVG Icons ─────────────────────────────────────────────────────────────────

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const AddPersonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
  </svg>
);

const RemoveChipIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
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

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// ── Types ──────────────────────────────────────────────────────────────────

interface UserResult {
  id: string;
  name: string;
  email: string;
}

interface SelectedUser extends UserResult {
  roleId: string;
}

interface ExistingMember {
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

interface AddPeopleModalProps {
  projectId: string;   // UUID for API calls
  projectName: string;
  onClose: () => void;
  onMembersChanged?: () => void;
}

// ── Helper: initials avatar ────────────────────────────────────────────────

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

const AVATAR_COLORS = ['#4361ee', '#06d6a0', '#3a86ff', '#7209b7', '#f9a825', '#ef233c', '#0096c7', '#e76f51'];
function avatarColor(name: string): string {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

// ── Component ─────────────────────────────────────────────────────────────

export default function AddPeopleModal({
  projectId, projectName, onClose, onMembersChanged,
}: AddPeopleModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const [selected, setSelected] = useState<SelectedUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [existingMembers, setExistingMembers] = useState<ExistingMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [mounted, setMounted] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ensure portal is only created on client
  useEffect(() => { setMounted(true); }, []);

  // ── Load roles + existing members on mount ──────────────────────────────
  useEffect(() => {
    Promise.all([
      projectsService.getRoles(),
      projectsService.getMembers(projectId),
    ]).then(([r, m]) => {
      setRoles(r);
      setExistingMembers(m);
      setLoadingMembers(false);
    }).catch(() => setLoadingMembers(false));
  }, [projectId]);

  // Default role = first non-SuperAdmin role (Developer)
  const defaultRoleId = roles.find(r => r.name.toLowerCase() === 'developer')?.id ?? roles[0]?.id ?? '';

  // ── Debounced search ───────────────────────────────────────────────────
  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setSearchResults([]); setShowDropdown(false); return; }
    setSearching(true);
    try {
      const results = await projectsService.searchUsers(q.trim());
      setSearchResults(results);
      setShowDropdown(true);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(searchQuery), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery, doSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Selection management ───────────────────────────────────────────────
  const existingIds = new Set(existingMembers.map(m => m.userId));

  const selectUser = (user: UserResult) => {
    if (existingIds.has(user.id)) return; // already a member
    if (selected.some(s => s.id === user.id)) return; // already in chip list
    setSelected(prev => [...prev, { ...user, roleId: defaultRoleId }]);
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
  };

  const removeChip = (id: string) => setSelected(prev => prev.filter(s => s.id !== id));

  const updateChipRole = (id: string, roleId: string) => {
    setSelected(prev => prev.map(s => s.id === id ? { ...s, roleId } : s));
  };

  // ── Add all selected members ───────────────────────────────────────────
  const handleAdd = async () => {
    if (selected.length === 0) return;
    setAdding(true);
    let succeeded = 0;
    for (const user of selected) {
      try {
        await projectsService.addMember(projectId, user.id, user.roleId);
        succeeded++;
      } catch (e: unknown) {
        const msg = (e as { message?: string })?.message ?? 'Failed';
        showToast(`Failed to add ${user.name}: ${msg}`, 'error');
      }
    }
    setAdding(false);
    if (succeeded > 0) {
      showToast(`${succeeded} member${succeeded > 1 ? 's' : ''} added successfully`, 'success');
      setSelected([]);
      // Refresh member list
      const updated = await projectsService.getMembers(projectId);
      setExistingMembers(updated);
      onMembersChanged?.();
    }
  };

  // ── Remove existing member ─────────────────────────────────────────────
  const handleRemoveMember = async (userId: string, name: string) => {
    if (!window.confirm(`Remove ${name} from this project?`)) return;
    try {
      await projectsService.removeMember(projectId, userId);
      setExistingMembers(prev => prev.filter(m => m.userId !== userId));
      showToast(`${name} removed`, 'success');
      onMembersChanged?.();
    } catch {
      showToast(`Failed to remove ${name}`, 'error');
    }
  };

  // ── Update existing member role ────────────────────────────────────────
  const handleRoleChange = async (userId: string, roleId: string, name: string) => {
    try {
      await projectsService.updateMemberRole(projectId, userId, roleId);
      setExistingMembers(prev => prev.map(m =>
        m.userId === userId ? { ...m, roleId, roleName: roles.find(r => r.id === roleId)?.name ?? m.roleName } : m
      ));
      showToast(`${name}'s role updated`, 'success');
    } catch {
      showToast(`Failed to update role`, 'error');
    }
  };

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Render ─────────────────────────────────────────────────────────────
  if (!mounted) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9100,
          background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)',
          animation: 'apm-fade-in 0.2s ease both',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9101,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
        pointerEvents: 'none',
      }}>
        <div style={{
          background: '#fff', borderRadius: '16px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
          width: '100%', maxWidth: '560px', maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
          animation: 'apm-scale-in 0.22s cubic-bezier(0.16,1,0.3,1) both',
          pointerEvents: 'all',
          overflow: 'hidden',
        }}>
          <style>{`
            @keyframes apm-fade-in  { from{opacity:0} to{opacity:1} }
            @keyframes apm-scale-in { from{opacity:0;transform:scale(0.94) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
            .apm-search-item:hover  { background:#f0f4ff !important; }
            .apm-chip-role:focus    { outline:none; box-shadow:0 0 0 2px #4361ee40; }
            .apm-member-row:hover   { background:#f8fafc !important; }
          `}</style>

          {/* Header */}
          <div style={{
            padding: '20px 22px 16px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                Add People to Project
              </h2>
              <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                {projectName}
              </p>
            </div>
            <button onClick={onClose} style={{
              border: 'none', background: '#f1f5f9', borderRadius: '8px',
              width: '32px', height: '32px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', color: '#64748b',
              transition: 'background 0.15s',
            }}>
              <CloseIcon />
            </button>
          </div>

          {/* Body — scrollable */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px' }}>

            {/* ── Search + Dropdown ───────────────────────────── */}
            <div ref={searchRef} style={{ position: 'relative', marginBottom: '14px' }}>
              <label style={{ fontSize: '0.76rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
                Search Users
              </label>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                border: '1.5px solid #e2e8f0', borderRadius: '10px',
                padding: '8px 12px', background: '#f8fafc',
                transition: 'border-color 0.15s',
              }}>
                <span style={{ color: '#94a3b8', flexShrink: 0 }}><SearchIcon /></span>
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                  placeholder="Search by name or email…"
                  style={{
                    flex: 1, border: 'none', background: 'transparent',
                    fontSize: '0.85rem', color: '#0f172a', outline: 'none',
                  }}
                />
                {searching && (
                  <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>searching…</span>
                )}
              </div>

              {/* Dropdown results */}
              {showDropdown && searchResults.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                  background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.10)', marginTop: '4px',
                  maxHeight: '220px', overflowY: 'auto',
                }}>
                  {searchResults.map(user => {
                    const alreadyMember = existingIds.has(user.id);
                    const alreadySelected = selected.some(s => s.id === user.id);
                    return (
                      <div
                        key={user.id}
                        className="apm-search-item"
                        onClick={() => !alreadyMember && !alreadySelected && selectUser(user)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '10px 14px',
                          cursor: alreadyMember || alreadySelected ? 'default' : 'pointer',
                          opacity: alreadyMember || alreadySelected ? 0.5 : 1,
                          borderBottom: '1px solid #f8fafc',
                        }}
                      >
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                          background: avatarColor(user.name), color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.72rem', fontWeight: 700,
                        }}>
                          {getInitials(user.name)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {user.name}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {user.email}
                          </div>
                        </div>
                        {alreadyMember && <span style={{ fontSize: '0.7rem', color: '#06d6a0', fontWeight: 600 }}>Member</span>}
                        {alreadySelected && <CheckIcon />}
                        {!alreadyMember && !alreadySelected && (
                          <span style={{ color: '#4361ee' }}><AddPersonIcon /></span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {showDropdown && searchResults.length === 0 && !searching && searchQuery.trim().length >= 2 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                  background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.10)', marginTop: '4px',
                  padding: '16px', textAlign: 'center', fontSize: '0.82rem', color: '#94a3b8',
                }}>
                  No users found for &quot;{searchQuery}&quot;
                </div>
              )}
            </div>

            {/* ── Selected chips ──────────────────────────────── */}
            {selected.length > 0 && (
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                  Selected ({selected.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selected.map(user => (
                    <div key={user.id} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      background: '#f0f4ff', border: '1px solid #c7d2fe',
                      borderRadius: '10px', padding: '8px 12px',
                    }}>
                      <div style={{
                        width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                        background: avatarColor(user.name), color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.68rem', fontWeight: 700,
                      }}>
                        {getInitials(user.name)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.83rem', fontWeight: 600, color: '#1e3a8a' }}>{user.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>{user.email}</div>
                      </div>
                      {/* Role dropdown per chip */}
                      <select
                        className="apm-chip-role"
                        value={user.roleId}
                        onChange={e => updateChipRole(user.id, e.target.value)}
                        style={{
                          border: '1px solid #c7d2fe', borderRadius: '7px',
                          padding: '4px 8px', fontSize: '0.76rem', color: '#1e40af',
                          background: '#eff6ff', cursor: 'pointer', fontWeight: 600,
                        }}
                      >
                        {roles.map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                      <button onClick={() => removeChip(user.id)} style={{
                        border: 'none', background: 'transparent', cursor: 'pointer',
                        color: '#94a3b8', padding: '2px', display: 'flex', alignItems: 'center',
                      }}>
                        <RemoveChipIcon />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add button */}
                <button
                  onClick={handleAdd}
                  disabled={adding}
                  style={{
                    marginTop: '12px', width: '100%',
                    background: adding ? '#94a3b8' : '#4361ee',
                    color: '#fff', border: 'none', borderRadius: '10px',
                    padding: '10px', fontSize: '0.86rem', fontWeight: 700,
                    cursor: adding ? 'not-allowed' : 'pointer',
                    transition: 'background 0.15s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  }}
                >
                  <AddPersonIcon />
                  {adding ? 'Adding…' : `Add ${selected.length} Member${selected.length > 1 ? 's' : ''}`}
                </button>
              </div>
            )}

            {/* ── Current Members ─────────────────────────────── */}
            <div>
              <div style={{
                fontSize: '0.76rem', fontWeight: 600, color: '#374151',
                marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span>Current Members</span>
                {!loadingMembers && (
                  <span style={{
                    background: '#f1f5f9', color: '#64748b',
                    borderRadius: '20px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: 700,
                  }}>
                    {existingMembers.length}
                  </span>
                )}
              </div>

              {loadingMembers ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem' }}>
                  Loading members…
                </div>
              ) : existingMembers.length === 0 ? (
                <div style={{
                  padding: '24px', textAlign: 'center', color: '#94a3b8',
                  fontSize: '0.82rem', background: '#f8fafc', borderRadius: '10px',
                }}>
                  No members yet. Search above to add people.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {existingMembers.map(member => (
                    <div
                      key={member.userId}
                      className="apm-member-row"
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '8px 10px', borderRadius: '9px',
                        transition: 'background 0.13s',
                      }}
                    >
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                        background: avatarColor(member.name), color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.72rem', fontWeight: 700,
                      }}>
                        {getInitials(member.name)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.83rem', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {member.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {member.email}
                        </div>
                      </div>
                      {/* Role change dropdown */}
                      <select
                        value={member.roleId}
                        onChange={e => handleRoleChange(member.userId, e.target.value, member.name)}
                        style={{
                          border: '1px solid #e2e8f0', borderRadius: '7px',
                          padding: '4px 8px', fontSize: '0.75rem', color: '#374151',
                          background: '#f8fafc', cursor: 'pointer',
                        }}
                      >
                        {roles.map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                      {/* Remove */}
                      <button
                        onClick={() => handleRemoveMember(member.userId, member.name)}
                        title="Remove member"
                        style={{
                          border: 'none', background: 'transparent', cursor: 'pointer',
                          color: '#94a3b8', padding: '4px', borderRadius: '6px',
                          display: 'flex', alignItems: 'center',
                          transition: 'color 0.15s, background 0.15s',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#dc2626'; (e.currentTarget as HTMLButtonElement).style.background = '#fef2f2'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, background: toast.type === 'success' ? '#0f172a' : '#dc2626',
          color: '#fff', padding: '10px 20px', borderRadius: '10px',
          fontSize: '0.84rem', fontWeight: 600,
          boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
          animation: 'apm-fade-in 0.2s ease both',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          {toast.type === 'success' ? <CheckIcon /> : null}
          {toast.msg}
        </div>
      )}
    </>,
    document.body
  );
}
