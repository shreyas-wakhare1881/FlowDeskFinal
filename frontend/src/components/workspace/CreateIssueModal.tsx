'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ReactElement } from 'react';
import { useIssueModal } from '@/lib/IssueModalContext';
import { useIssues } from '@/lib/IssuesContext';
import { useProjects } from '@/lib/ProjectsContext';
import { issuesService } from '@/lib/issues.service';
import { projectsService } from '@/lib/projects.service';
import type { IssueType, IssuePriority } from '@/types/issue';

// ── SVG Icons ─────────────────────────────────────────────────────────────────

const EpicIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);
const StoryIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);
const TaskIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 11 12 14 22 4"/>
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
  </svg>
);
const BugIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 2l1.88 1.88M14.12 3.88 16 2M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/>
    <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6z"/>
    <path d="M12 20v-9M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/>
    <path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/>
  </svg>
);

const CLOSE_ICON = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

// ── Type config ───────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<IssueType, {
  label: string;
  Icon: () => ReactElement;
  color: string;
  bg: string;
  border: string;
  btnBg: string;
}> = {
  EPIC:  { label: 'Epic',  Icon: EpicIcon,  color: 'text-purple-700', bg: 'bg-purple-100', border: 'border-purple-400', btnBg: '#7c3aed' },
  STORY: { label: 'Story', Icon: StoryIcon, color: 'text-blue-700',   bg: 'bg-blue-100',   border: 'border-blue-400',   btnBg: '#2563eb' },
  TASK:  { label: 'Task',  Icon: TaskIcon,  color: 'text-emerald-700',bg: 'bg-emerald-100',border: 'border-emerald-400', btnBg: '#059669' },
  BUG:   { label: 'Bug',   Icon: BugIcon,   color: 'text-rose-700',   bg: 'bg-rose-100',   border: 'border-rose-400',   btnBg: '#e11d48' },
};

const PRIORITY_OPTIONS: { value: IssuePriority; label: string; dot: string }[] = [
  { value: 'HIGH',   label: 'High',   dot: 'bg-red-500' },
  { value: 'MEDIUM', label: 'Medium', dot: 'bg-yellow-400' },
  { value: 'LOW',    label: 'Low',    dot: 'bg-blue-400' },
];

interface Member {
  userId: string;
  name: string;
  email: string;
  roleName: string;
}

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

// ── Modal component ───────────────────────────────────────────────────────────

export default function CreateIssueModal({ projectId }: { projectId: string }) {
  const { isOpen, defaultType, closeModal } = useIssueModal();
  const { epics, allIssues, refresh } = useIssues();
  const { refreshProjects } = useProjects();

  // Form state
  const [type, setType] = useState<IssueType>(defaultType);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<IssuePriority>('MEDIUM');
  const [parentId, setParentId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [estimate, setEstimate] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Data for dropdowns
  const [members, setMembers] = useState<Member[]>([]);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Sync defaultType from context whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setType(defaultType);
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setParentId('');
      setAssigneeId('');
      setEstimate('');
      setDueDate('');
      setError(null);
    }
  }, [isOpen, defaultType]);

  // Fetch project members for assignee dropdown
  useEffect(() => {
    if (!isOpen || !projectId) return;
    projectsService.getMembers(projectId).then((data) => {
      setMembers(data as Member[]);
    }).catch(() => {
      setMembers([]);
    });
  }, [isOpen, projectId]);

  // Get stories from allIssues (includes orphan stories not under an epic)
  const allStories = allIssues.filter((i) => i.type === 'STORY');

  // Reset parentId when type changes
  useEffect(() => {
    setParentId('');
  }, [type]);

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    // Validate parent type compatibility only when a parent is selected
    if (parentId) {
      const parentIssue = allIssues.find((i) => i.id === parentId);
      if (type === 'STORY' && parentIssue && parentIssue.type !== 'EPIC') {
        setError('Story parent must be an Epic');
        return;
      }
      if ((type === 'TASK' || type === 'BUG') && parentIssue && parentIssue.type !== 'STORY' && parentIssue.type !== 'EPIC') {
        setError('Task/Bug parent must be a Story or Epic');
        return;
      }
    }

    setSubmitting(true);
    setError(null);
    try {
      await issuesService.create({
        projectId,
        type,
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        parentId: parentId || undefined,
        assigneeId: assigneeId || undefined,
        estimate: estimate.trim() || undefined,
        dueDate: dueDate || undefined,
      });
      refresh();
      await refreshProjects();
      setToast(`${TYPE_CONFIG[type].label} created successfully!`);
      setTimeout(() => setToast(null), 3000);
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create issue');
    } finally {
      setSubmitting(false);
    }
  }, [title, type, parentId, description, priority, assigneeId, estimate, dueDate, projectId, allIssues, refresh, closeModal, refreshProjects]);

  // Dismiss on backdrop click or Escape
  const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) closeModal();
  }, [closeModal]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal(); };
    if (isOpen) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, closeModal]);

  return (
    <>
      {/* Toast notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-[200] bg-emerald-600 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-in slide-in-from-top-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          {toast}
        </div>
      )}

      {/* Backdrop + Modal */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Create Issue"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.55)' }}
          onClick={handleBackdropClick}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden"
            style={{ animation: 'modalScaleIn 0.18s ease-out' }}
          >
            {/* ── Header ───────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Issue</h2>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                aria-label="Close"
              >
                <CLOSE_ICON />
              </button>
            </div>

            {/* ── Type selector ─────────────────────────────────────────────── */}
            <div className="px-6 pt-5 pb-1">
              <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl">
                {(Object.keys(TYPE_CONFIG) as IssueType[]).map((t) => {
                  const cfg = TYPE_CONFIG[t];
                  const active = type === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                        active
                          ? `${cfg.bg} ${cfg.color} shadow-sm`
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <cfg.Icon />
                      <span>{cfg.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Form body ─────────────────────────────────────────────────── */}
            <div className="px-6 py-4 flex flex-col gap-4 overflow-y-auto max-h-[60vh]">

              {/* Parent selector — optional for STORY and TASK/BUG, hidden for EPIC */}
              {type === 'STORY' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Parent Epic <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <select
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium bg-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                  >
                    <option value="">— No parent (create independently) —</option>
                    {epics.map((epic) => (
                      <option key={epic.id} value={epic.id}>
                        {epic.issueKey} · {epic.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(type === 'TASK' || type === 'BUG') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Parent Story <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <select
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium bg-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                  >
                    <option value="">— No parent (create independently) —</option>
                    {allStories.map((story) => (
                      <option key={story.id} value={story.id}>
                        {story.issueKey} · {story.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={`Enter ${TYPE_CONFIG[type].label.toLowerCase()} title...`}
                  maxLength={200}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add more details, acceptance criteria, or context..."
                  rows={3}
                  maxLength={2000}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 font-medium resize-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                />
              </div>

              {/* Priority — hidden for EPIC */}
              {type !== 'EPIC' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Priority</label>
                  <div className="flex gap-2">
                    {PRIORITY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setPriority(opt.value)}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                          priority === opt.value
                            ? 'border-blue-400 bg-blue-50 text-blue-700'
                            : 'border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${opt.dot}`} />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Assignee — hidden for EPIC */}
              {type !== 'EPIC' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Assignee</label>
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium bg-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                  >
                    <option value="">— Unassigned —</option>
                    {members.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {getInitials(m.name)} · {m.name} ({m.roleName})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Estimate & Due Date (Grid) — hidden for EPIC */}
              {type !== 'EPIC' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Estimate <span className="text-slate-400 font-normal">(e.g. 4h, 2d, 4)</span>
                    </label>
                    <input
                      type="text"
                      value={estimate}
                      onChange={(e) => setEstimate(e.target.value)}
                      placeholder="4h or 2d"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium bg-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Due Date</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={dueDate}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, '').slice(0, 8);
                          if (val.length > 2) val = val.slice(0, 2) + '/' + val.slice(2);
                          if (val.length > 5) val = val.slice(0, 5) + '/' + val.slice(5);
                          setDueDate(val);
                        }}
                        placeholder="dd/mm/yyyy"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium bg-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 placeholder:text-slate-300 pr-10"
                        maxLength={10}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer hover:text-blue-500 transition-colors">
                        <svg 
                          onClick={(e) => {
                            const input = (e.currentTarget.parentElement?.previousElementSibling as HTMLInputElement);
                            const picker = (e.currentTarget.parentElement?.querySelector('input[type="date"]') as HTMLInputElement);
                            picker?.showPicker();
                          }}
                          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        >
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        <input 
                          type="date" 
                          className="absolute inset-0 opacity-0 w-0 h-0 pointer-events-none" 
                          onChange={(e) => {
                            if (!e.target.value) return;
                            const [y, m, d] = e.target.value.split('-');
                            setDueDate(`${d}/${m}/${y}`);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}
            </div>

            {/* ── Footer ───────────────────────────────────────────────────── */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
              <button
                onClick={closeModal}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !title.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                style={{ backgroundColor: submitting || !title.trim() ? '#94a3b8' : TYPE_CONFIG[type].btnBg }}
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Creating...
                  </>
                ) : (
                  (() => { const Icon = TYPE_CONFIG[type].Icon; return <><Icon /> Create {TYPE_CONFIG[type].label}</>; })()
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modalScaleIn {
          from { opacity: 0; transform: scale(0.95) translateY(-8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>
    </>
  );
}

