'use client';

import { useState, useEffect } from 'react';

interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  color: string;
  status: 'free' | 'busy';
  projectCount?: number;
}

export interface TeamTemplate {
  id: string;
  name: string;
  icon: string;
  members: string[];
  metaText: string;
}

interface TeamAssignmentProps {
  selectedMembers: string[];
  teamName: string;
  teamID: string;
  onMembersChange: (members: string[]) => void;
  onTeamNameChange: (name: string) => void;
  teamTemplates: TeamTemplate[];
  selectedTemplate: string;
  onTemplateSelect: (template: TeamTemplate) => void;
}

const CURRENT_USER = {
  id: 'USER-001',
  name: 'Shreyas Wakhare',
  avatar: 'SW',
  color: '#4361ee',
};

const availableMembers: TeamMember[] = [
  { id: '1', name: 'Rahul Kumar',   avatar: 'RK', color: '#4361ee', status: 'busy', projectCount: 5 },
  { id: '2', name: 'Sneha Patel',   avatar: 'SP', color: '#06d6a0', status: 'free' },
  { id: '3', name: 'Arjun Mehta',   avatar: 'AM', color: '#f9a825', status: 'free' },
  { id: '4', name: 'Priya Das',     avatar: 'PD', color: '#7209b7', status: 'busy', projectCount: 3 },
  { id: '5', name: 'Vishal Tiwari', avatar: 'VT', color: '#3a86ff', status: 'free' },
];

// ── Team View Modal ────────────────────────────────────────────────────────────
function TeamViewModal({
  teamName,
  teamID,
  isDefault,
  selectedMemberNames,
  onClose,
}: {
  teamName: string;
  teamID: string;
  isDefault: boolean;
  selectedMemberNames: string[];
  onClose: () => void;
}) {
  const members = selectedMemberNames
    .map((name) => availableMembers.find((m) => m.name === name))
    .filter(Boolean) as TeamMember[];

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
        {/* Header gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white text-xl font-bold transition-all"
          >
            ×
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">
              {isDefault ? '⚡' : '👥'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white leading-tight">
                {teamName || 'New Team'}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-mono bg-white/15 text-white px-2 py-0.5 rounded-lg">
                  {teamID}
                </span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${
                    isDefault
                      ? 'bg-purple-300/30 text-purple-100'
                      : 'bg-emerald-300/30 text-emerald-100'
                  }`}
                >
                  {isDefault ? 'Default' : 'Custom'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Team Lead */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Team Lead
            </p>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow"
                style={{ backgroundColor: CURRENT_USER.color }}
              >
                {CURRENT_USER.avatar}
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-900 text-sm">{CURRENT_USER.name}</p>
                <p className="text-xs text-blue-500 font-medium">Team Lead</p>
              </div>
              <span className="text-xl">👑</span>
            </div>
          </div>

          {/* Members */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Members ({members.length})
            </p>
            {members.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-xl text-center text-sm text-slate-400 border border-slate-100">
                No additional members assigned
              </div>
            ) : (
              <div className="space-y-2">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow"
                      style={{ backgroundColor: m.color }}
                    >
                      {m.avatar}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 text-sm">{m.name}</p>
                    </div>
                    {m.status === 'free' ? (
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        Free
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-lg">
                        Busy · {m.projectCount}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
            <span className="text-sm text-slate-500">Total size</span>
            <span className="font-bold text-slate-900 text-sm">
              {members.length + 1} member{members.length + 1 !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
export default function TeamAssignment({
  selectedMembers,
  teamName,
  teamID,
  onMembersChange,
  onTeamNameChange,
  teamTemplates,
  selectedTemplate,
  onTemplateSelect,
}: TeamAssignmentProps) {
  const [activeTab, setActiveTab] = useState<'members' | 'teams'>('members');
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Build the ordered avatar list: SW first, then selected members
  const selectedMemberData = selectedMembers
    .map((name) => availableMembers.find((m) => m.name === name))
    .filter(Boolean) as TeamMember[];
  const allAvatars = [
    { avatar: CURRENT_USER.avatar, color: CURRENT_USER.color, name: CURRENT_USER.name },
    ...selectedMemberData.map((m) => ({ avatar: m.avatar, color: m.color, name: m.name })),
  ];
  const isDefault = !!selectedTemplate;

  const toggleMember = (memberName: string) => {
    if (selectedMembers.includes(memberName)) {
      onMembersChange(selectedMembers.filter((m) => m !== memberName));
    } else {
      onMembersChange([...selectedMembers, memberName]);
    }
  };

  // total selected = current user (always) + additional selected members
  const totalSelected = selectedMembers.length + 1;

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
        <div className="w-12 h-12 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl flex items-center justify-center text-2xl shadow-md">
          👥
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-900">Assign To</h3>
          <p className="text-sm text-slate-500">Multi-select supported</p>
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
            activeTab === 'members'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          👤 Members
        </button>
        <button
          onClick={() => setActiveTab('teams')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'teams'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          ⚡ Quick Teams
        </button>
      </div>

      {/* ── TAB 1: Members ─────────────────────────────────────── */}
      {activeTab === 'members' && (
        <div className="mb-6">
          {/* Current User — pinned Team Lead */}
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            You (Team Lead)
          </p>
          <div className="flex items-center gap-3 px-4 py-3.5 mb-5 rounded-xl border-2 border-blue-300 bg-blue-50 shadow-sm">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-md"
              style={{ backgroundColor: CURRENT_USER.color }}
            >
              {CURRENT_USER.avatar}
            </div>
            <div className="flex-1">
              <p className="font-bold text-slate-900 text-sm">{CURRENT_USER.name}</p>
              <p className="text-xs text-blue-500 font-medium">Team Lead · Always assigned</p>
            </div>
            <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          {/* Add Members — search + dropdown */}
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Add Members
          </p>
          <div className="relative">
            {/* Input row: search box with avatars inside right */}
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => { setMemberSearch(e.target.value); setDropdownOpen(true); }}
                onFocus={() => setDropdownOpen(true)}
                placeholder="Search team members"
                className="w-full pl-9 pr-36 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
              />
              {/* Static avatar stack — first 3 + remainder count, always visible, inside box right */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex pointer-events-none">
                {availableMembers.slice(0, 3).map((m, i) => (
                  <div
                    key={m.id}
                    title={m.name}
                    className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-bold shadow-sm"
                    style={{
                      backgroundColor: m.color,
                      marginLeft: i === 0 ? 0 : '-8px',
                      zIndex: 10 - i,
                      position: 'relative',
                    }}
                  >
                    {m.avatar}
                  </div>
                ))}
                {availableMembers.length > 3 && (
                  <div
                    className="w-7 h-7 rounded-full border-2 border-white bg-slate-300 flex items-center justify-center text-slate-700 text-[10px] font-bold shadow-sm"
                    style={{ marginLeft: '-8px', zIndex: 5, position: 'relative' }}
                  >
                    +{availableMembers.length - 3}
                  </div>
                )}
              </div>
            </div>

            {/* Dropdown */}
            {dropdownOpen && (
              <>
                {/* backdrop to close */}
                <div className="fixed inset-0 z-10" onClick={() => { setDropdownOpen(false); setMemberSearch(''); }} />
                <div className="absolute left-0 right-0 top-[calc(100%+6px)] bg-white border-2 border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden">
                  {availableMembers
                    .filter((m) =>
                      m.name.toLowerCase().includes(memberSearch.toLowerCase())
                    )
                    .map((member) => {
                      const isSelected = selectedMembers.includes(member.name);
                      return (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => { toggleMember(member.name); }}
                          className={`w-full flex items-center gap-3 px-4 py-3 transition-all text-left border-b border-slate-100 last:border-0 ${
                            isSelected
                              ? 'bg-blue-50'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm shrink-0"
                            style={{ backgroundColor: member.color }}
                          >
                            {member.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 text-sm">{member.name}</p>
                          </div>
                          {member.status === 'free' ? (
                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200 flex items-center gap-1 shrink-0">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                              Free
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-lg border border-amber-200 shrink-0">
                              Busy · {member.projectCount}
                            </span>
                          )}
                          {isSelected && (
                            <div className="w-5 h-5 bg-blue-600 rounded-md flex items-center justify-center shadow shrink-0">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  {availableMembers.filter((m) =>
                    m.name.toLowerCase().includes(memberSearch.toLowerCase())
                  ).length === 0 && (
                    <div className="px-4 py-5 text-center text-sm text-slate-400">
                      No members found
                    </div>
                  )}
                  {/* Add button — shows when at least 1 member is selected */}
                  {selectedMembers.length > 0 && (
                    <div className="p-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => { setDropdownOpen(false); setMemberSearch(''); }}
                        className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-bold rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Add {selectedMembers.length} Member{selectedMembers.length > 1 ? 's' : ''}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: Quick Teams ──────────────────────────────────── */}
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
              ✅ Template applied — members auto-filled in the Members tab
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
        <div className="relative group">
          <input
            type="text"
            value={teamName}
            onChange={(e) => onTeamNameChange(e.target.value)}
            placeholder="Enter team name (e.g., Design Team, Dev Team)"
            className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all group-hover:border-slate-300"
          />
        </div>
      </div>

      {/* Team ID — readonly display with overlapping avatars */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Team ID
        </label>
        <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl">
          <span className="text-sm font-mono font-bold text-slate-600 flex-1 truncate">{teamID}</span>
          {isDefault
            ? <span className="shrink-0 text-xs px-2 py-0.5 bg-purple-100 text-purple-600 font-semibold rounded-lg">Default</span>
            : <span className="shrink-0 text-xs px-2 py-0.5 bg-emerald-100 text-emerald-600 font-semibold rounded-lg">Custom</span>
          }
          {/* Overlapping avatar stack — click to open Team View */}
          <button
            type="button"
            onClick={() => setShowTeamModal(true)}
            title="View team"
            className="flex items-center hover:scale-105 transition-transform ml-1 cursor-pointer"
          >
            <div className="flex" style={{ direction: 'ltr' }}>
              {allAvatars.slice(0, 4).map((m, i) => (
                <div
                  key={i}
                  title={m.name}
                  className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-bold shadow-sm"
                  style={{
                    backgroundColor: m.color,
                    marginLeft: i === 0 ? 0 : '-8px',
                    zIndex: 10 - i,
                    position: 'relative',
                  }}
                >
                  {m.avatar}
                </div>
              ))}
              {allAvatars.length > 4 && (
                <div
                  className="w-7 h-7 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-slate-600 text-[10px] font-bold shadow-sm"
                  style={{ marginLeft: '-8px', zIndex: 5, position: 'relative' }}
                >
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
          selectedMemberNames={selectedMembers}
          onClose={() => setShowTeamModal(false)}
        />
      )}
    </div>
  );
}
