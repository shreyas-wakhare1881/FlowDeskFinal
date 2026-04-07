'use client';

import {
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import type { ReactElement } from 'react';
import { createPortal } from 'react-dom';
import { useIssues } from '@/lib/IssuesContext';
import { issuesService } from '@/lib/issues.service';
import { projectsService } from '@/lib/projects.service';
import type {
  IssueDetail,
  IssueType,
  IssueStatus,
  IssuePriority,
  IssueLinkType,
  Issue,
  UpdateIssuePayload,
} from '@/types/issue';

// ── SVG Icons ─────────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<IssueType, () => ReactElement> = {
  EPIC: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  STORY: () => (
    <img src="https://tse4.mm.bing.net/th/id/OIP.ehz30q2xADBuD2WNATzh-QHaH_?rs=1&pid=ImgDetMain&o=7&rm=3" alt="Story" width="14" height="14" className="rounded-[2px] object-contain flex-shrink-0" />
  ),
  TASK: () => (
    <img src="https://tse4.mm.bing.net/th/id/OIP.DlQQs_sZ0T6aSfq4E_HhZQHaHa?rs=1&pid=ImgDetMain&o=7&rm=3" alt="Task" width="14" height="14" className="rounded-[2px] object-contain flex-shrink-0" />
  ),
  BUG: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2l1.88 1.88M14.12 3.88 16 2M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/>
      <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6z"/>
      <path d="M12 20v-9M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/>
      <path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/>
    </svg>
  ),
};

const TYPE_STYLES: Record<IssueType, { pill: string; dot: string }> = {
  EPIC:  { pill: 'bg-purple-100 text-purple-700 border border-purple-200', dot: 'bg-purple-500' },
  STORY: { pill: 'bg-blue-100 text-blue-700 border border-blue-200',       dot: 'bg-blue-500'   },
  TASK:  { pill: 'bg-emerald-100 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-500' },
  BUG:   { pill: 'bg-rose-100 text-rose-700 border border-rose-200',       dot: 'bg-rose-500'   },
};

const STATUS_CONFIG: Record<IssueStatus, { label: string; pill: string }> = {
  TODO:        { label: 'To Do',       pill: 'bg-slate-100 text-slate-600' },
  IN_PROGRESS: { label: 'In Progress', pill: 'bg-blue-100 text-blue-700'  },
  DONE:        { label: 'Done',        pill: 'bg-green-100 text-green-700' },
};

const PRIORITY_CONFIG: Record<IssuePriority, { label: string; dot: string; active: string }> = {
  HIGH:   { label: 'High',   dot: 'bg-red-500',    active: 'border-red-400 bg-red-50 text-red-700'       },
  MEDIUM: { label: 'Medium', dot: 'bg-yellow-400',  active: 'border-yellow-400 bg-yellow-50 text-yellow-700' },
  LOW:    { label: 'Low',    dot: 'bg-blue-400',    active: 'border-blue-400 bg-blue-50 text-blue-700'    },
};

const LINK_LABELS: Record<IssueLinkType, string> = {
  BLOCKS:     'Blocks',
  DEPENDS_ON: 'Depends on',
  RELATES_TO: 'Relates to',
  DUPLICATES: 'Duplicates',
};

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface Member { userId: string; name: string; email: string; roleName: string; }

// ── Status Dropdown ───────────────────────────────────────────────────────────

function StatusDropdown({
  status,
  onChange,
  disabled,
  saving,
}: {
  status: IssueStatus;
  onChange: (status: IssueStatus) => void;
  disabled?: boolean;
  saving?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<IssueStatus | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSelect = async (s: IssueStatus) => {
    if (saving || disabled) return;
    setPendingStatus(s);
    try {
      await onChange(s);            // onChange returns promise from parent
      setPendingStatus(null);
      setOpen(false);
    } catch {
      setPendingStatus(null);
    }
  };

  const options: { value: IssueStatus; label: string; text: string; dot: string }[] = [
    { value: 'TODO',        label: 'To Do',       text: 'text-slate-700',  dot: 'bg-slate-400' },
    { value: 'IN_PROGRESS', label: 'In Progress', text: 'text-blue-700',   dot: 'bg-blue-500' },
    { value: 'DONE',        label: 'Done',        text: 'text-green-700',  dot: 'bg-green-500' },
  ];

  const current = STATUS_CONFIG[status];
  const effectiveStatus = pendingStatus ?? status;
  const effectiveCurrent = STATUS_CONFIG[effectiveStatus];

  /* ── Disabled (EPIC) ── */
  if (disabled) {
    return (
      <div className="relative mb-4" title="Status cannot be changed for Epics">
        <div
          className="w-full flex items-center justify-between px-3 py-[7px] rounded-[3px] bg-slate-100 text-slate-400 text-[13.5px] font-bold cursor-not-allowed select-none"
        >
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            {current.label}
          </span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative mb-4">
      <button
        onClick={() => setOpen(!open)}
        disabled={saving}
        className={`w-full flex items-center justify-between px-3 py-[7px] rounded-[3px] ${
          saving ? 'opacity-50 cursor-wait' : 'cursor-pointer'
        } ${effectiveCurrent.pill} text-[13.5px] font-bold transition-colors`}
      >
        <span className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${
            effectiveStatus === 'TODO' ? 'bg-slate-400'
              : effectiveStatus === 'IN_PROGRESS' ? 'bg-blue-500'
              : 'bg-green-500'
          }`} />
          {effectiveCurrent.label}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#DFE1E6] rounded-[3px] shadow-lg z-50 py-1">
          {saving && <div className="px-3 py-2 text-[13px] text-slate-400">Updating...</div>}
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              disabled={saving}
              className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-left transition-colors ${
                opt.value === status ? 'font-semibold bg-slate-50' : 'font-medium'
              } text-[#42526E] disabled:opacity-50`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${opt.dot}`} />
              <span className={`text-[13.5px] ${opt.text}`}>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Inline editable field ─────────────────────────────────────────────────────

function InlineEditTitle({
  value,
  onSave,
}: {
  value: string;
  onSave: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft.trim() && draft.trim() !== value) onSave(draft.trim());
    else setDraft(value);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setEditing(false); setDraft(value); } }}
        className="w-full text-[24px] font-semibold text-[#172B4D] border-2 border-[#0052CC] outline-none rounded p-1 -ml-1"
        maxLength={200}
      />
    );
  }

  return (
    <h1
      className="text-[24px] font-semibold text-[#172B4D] cursor-pointer hover:bg-slate-100 rounded p-1 -ml-1 transition-colors break-words"
      onClick={() => setEditing(true)}
      title="Click to edit title"
    >
      {value}
    </h1>
  );
}

function InlineEditDescription({
  value,
  onSave,
}: {
  value: string | null;
  onSave: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setDraft(value ?? ''); }, [value]);
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft !== (value ?? '')) onSave(draft);
  };

  if (editing) {
    return (
      <div className="relative z-10 w-full mb-12">
        <div className="flex flex-col border border-[#DFE1E6] rounded-[3px] shadow-[0_1px_1px_rgba(9,30,66,0.25),0_0_1px_1px_rgba(9,30,66,0.13)] bg-white overflow-hidden focus-within:border-[#4C9AFF] transition-colors -ml-[1px]">
           <div className="flex items-center gap-1 px-3 py-1.5 border-b border-[#DFE1E6] bg-white overflow-x-auto min-h-[40px]">
              <button className="flex items-center gap-0.5 text-[#42526E] hover:bg-slate-100 px-1 py-1 rounded font-serif text-[15px] font-medium">Tt <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg></button>
              <div className="w-[1px] h-[18px] bg-[#DFE1E6] mx-1"></div>
              <button className="text-[#42526E] hover:bg-slate-100 p-1.5 rounded font-bold text-[14px]">B</button>
              <button className="text-[#42526E] hover:bg-slate-100 p-1.5 rounded italic font-serif text-[15px]">I</button>
              <button className="text-[#42526E] hover:bg-slate-100 pb-1.5 pt-0.5 px-1.5 rounded font-bold tracking-widest text-[13px]">•••</button>
              <div className="w-[1px] h-[18px] bg-[#DFE1E6] mx-1"></div>
              <button className="flex items-center gap-0.5 text-[#42526E] hover:bg-slate-100 px-1 py-1 rounded font-bold text-[14px]">A <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg></button>
              <div className="w-[1px] h-[18px] bg-[#DFE1E6] mx-1"></div>
              <button className="text-[#42526E] hover:bg-slate-100 p-1.5 rounded"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg></button>
              <button className="text-[#42526E] hover:bg-slate-100 p-1.5 rounded"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg></button>
              <div className="w-[1px] h-[18px] bg-[#DFE1E6] mx-1"></div>
              <button className="text-[#42526E] hover:bg-slate-100 p-1.5 rounded"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></button>
              <button className="text-[#42526E] hover:bg-slate-100 p-1.5 rounded"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></button>
              <button className="text-[#42526E] hover:bg-slate-100 p-1.5 rounded"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></button>
              <button className="text-[#42526E] hover:bg-slate-100 p-1.5 rounded text-[15px] font-bold">@</button>
              <button className="text-[#42526E] hover:bg-slate-100 p-1.5 rounded"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg></button>
              <button className="text-[#42526E] hover:bg-slate-100 p-1.5 rounded"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg></button>
              <button className="text-[#42526E] hover:bg-slate-100 p-1.5 rounded font-bold text-[14px]">&lt;/&gt;</button>
              <button className="flex items-center gap-0.5 text-[#42526E] hover:bg-slate-100 px-1 py-1 rounded font-medium text-[16px]">+ <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg></button>
              <div className="w-[1px] h-[18px] bg-[#DFE1E6] mx-1"></div>
              <button className="p-1 rounded hover:bg-slate-100 ml-1 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                   <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#0052CC"/>
                   <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="#0052CC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
           </div>
           <div className="bg-white">
             <textarea
               ref={ref}
               value={draft}
               onChange={(e) => setDraft(e.target.value)}
               rows={4}
               maxLength={2000}
               className="w-full min-h-[140px] px-5 py-4 text-[14px] text-[#172B4D] resize-y outline-none placeholder:text-[#6B778C]/80"
               placeholder="Type /ai for Atlassian Intelligence or @ to mention and notify someone."
             />
           </div>
        </div>
        <div className="flex items-center gap-4 bg-transparent pt-3 mt-0 absolute -bottom-[42px] -left-[1px]">
           <button onMouseDown={(e)=>{e.preventDefault(); commit();}} className="bg-[#0b57d0] hover:bg-[#0047b3] text-white px-3 py-[5px] rounded-[3px] text-[14px] font-bold transition-colors shadow-sm">Save</button>
           <button onMouseDown={(e)=>{e.preventDefault(); setEditing(false);}} className="text-[#42526E] hover:bg-slate-100 px-3 py-[5px] rounded-[3px] text-[14px] font-medium transition-colors">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="text-[14px] text-[#172B4D] min-h-[40px] cursor-pointer hover:bg-slate-100 rounded p-2 -ml-2 transition-colors break-words"
      onClick={() => setEditing(true)}
      title="Click to edit description"
    >
      {value ? (
        <p className="whitespace-pre-wrap">{value}</p>
      ) : (
        <p className="text-[#6B778C]">Add a description...</p>
      )}
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

export default function IssueDetailModal({ projectId }: { projectId: string }) {
  const { selectedIssue, clearSelectedIssue, refresh, fetchIssueDetail, allIssues } = useIssues();

  const [issue, setIssue] = useState<IssueDetail | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Link form state
  const [linkType, setLinkType] = useState<IssueLinkType>('RELATES_TO');
  const [linkQuery, setLinkQuery] = useState('');
  const [linkTarget, setLinkTarget] = useState<Issue | null>(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkResults, setLinkResults] = useState<Issue[]>([]);

  // Accordion expanded state for link search results (story children)
  const [expandedLinkResults, setExpandedLinkResults] = useState<Set<string>>(new Set());

  const toggleLinkAccordion = useCallback((id: string) => {
    setExpandedLinkResults((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Mounted guard for portal
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);

  // Sync selectedIssue from context → local state
  useEffect(() => {
    setIssue(selectedIssue);
    setSaveError(null);
  }, [selectedIssue]);

  // Fetch members for assignee dropdown
  useEffect(() => {
    if (!selectedIssue || !projectId) return;
    projectsService.getMembers(projectId).then((d) => setMembers(d as Member[]))
      .catch(() => setMembers([]));
  }, [selectedIssue, projectId]);

  // Escape key to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') clearSelectedIssue(); };
    if (selectedIssue) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selectedIssue, clearSelectedIssue]);

  // Debounced issue search for linking
  useEffect(() => {
    if (!linkQuery.trim()) { setLinkResults([]); return; }
    setLinkLoading(true);
    const timer = setTimeout(async () => {
      try {
        const results = await issuesService.search(projectId, linkQuery);
        // Exclude current issue and already-linked issues
        const linkedIds = new Set([
          ...(issue?.sourceLinks ?? []).map((l) => l.target.id),
          ...(issue?.targetLinks ?? []).map((l) => l.source.id),
          issue?.id,
        ]);
        // Show root-level issues (no parent) — children are nested via accordion
        const roots = results.filter((r) => !linkedIds.has(r.id) && !r.parentId);
        // Also include orphan children whose parents aren't in search results
        // (handled by accordion in dropdown)
        setLinkResults(roots);
      } catch {
        setLinkResults([]);
      } finally {
        setLinkLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [linkQuery, projectId, issue]);

  const handleOpenWorkspace = useCallback(() => {
    window.open(`/workspace/${projectId}/ws-dashboard`, '_blank');
  }, [projectId]);

  const save = useCallback(async (updates: Omit<UpdateIssuePayload, 'projectId'>) => {
    if (!issue) return;
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await issuesService.update(issue.id, { projectId, ...updates });
      setIssue(updated);
      refresh();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Save failed');
      throw e;  // propagate for confirmed handlers
    } finally {
      setSaving(false);
    }
  }, [issue, projectId, refresh]);

  const handleStatusChange = useCallback(async (status: IssueStatus) => {
    if (!issue) return;
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await issuesService.update(issue.id, { projectId, status });
      setIssue(updated);
      refresh();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to update status');
      throw e;
    } finally {
      setSaving(false);
    }
  }, [issue, projectId, refresh]);

  const handleAddLink = useCallback(async () => {
    if (!issue || !linkTarget) return;
    setLinkLoading(true);
    try {
      await issuesService.addLink({
        projectId,
        sourceIssueId: issue.id,
        targetIssueId: linkTarget.id,
        linkType,
      });
      // Re-fetch to get updated links
      await fetchIssueDetail(issue.id, projectId);
      setLinkQuery('');
      setLinkTarget(null);
      setLinkResults([]);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to add link');
    } finally {
      setLinkLoading(false);
    }
  }, [issue, linkTarget, linkType, projectId, fetchIssueDetail]);

  const handleRemoveLink = useCallback(async (linkId: string) => {
    if (!issue) return;
    try {
      await issuesService.deleteLink(linkId, projectId);
      await fetchIssueDetail(issue.id, projectId);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to remove link');
    }
  }, [issue, projectId, fetchIssueDetail]);

  const handleChildClick = useCallback(async (childId: string) => {
    await fetchIssueDetail(childId, projectId);
  }, [fetchIssueDetail, projectId]);

  if (!mounted || !issue) return null;

  const typeStyle = TYPE_STYLES[issue.type];
  const TypeIcon = TYPE_ICONS[issue.type];

  // Get valid parent candidates based on issue type
  const parentCandidates = allIssues.filter((i) => {
    if (i.id === issue.id) return false;
    if (issue.type === 'STORY') return i.type === 'EPIC';
    if (issue.type === 'TASK' || issue.type === 'BUG') return i.type === 'STORY' || i.type === 'EPIC';
    return false; // EPIC can't have parent
  });

  const modal = (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-8"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => { if (e.target === e.currentTarget) clearSelectedIssue(); }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden"
        style={{ animation: 'detailSlideIn 0.2s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Top Bar ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0 bg-white border-b border-transparent">
          <div className="flex items-center gap-2 text-[13.5px] text-[#5E6C84]">
            <span className="text-slate-300">/</span>
            <button
              onClick={handleOpenWorkspace}
              className="flex items-center gap-2 hover:bg-slate-100 px-2 py-1.5 rounded cursor-pointer transition-colors text-[#172B4D] font-medium"
            >
              <span className={`inline-flex items-center w-3.5 h-3.5 flex-shrink-0 ${issue.type === 'EPIC' ? 'text-[#904EE2]' : issue.type === 'STORY' ? 'text-[#65BA43]' : issue.type === 'BUG' ? 'text-[#E34935]' : 'text-[#4C9AFF]'}`}>
                 <TypeIcon />
              </span>
              <span>{issue.issueKey}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-[#42526E]">
            {saving && <span className="text-xs text-slate-400 mr-2">Saving...</span>}
            <button onClick={clearSelectedIssue} className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100 text-[#42526E] hover:text-[#172B4D] transition-colors" title="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        {/* ── Body: 2-column layout ────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">

          {/* LEFT — Main content */}
          <div className="flex-1 overflow-y-auto px-8 py-6 min-w-0 pr-10">

            {/* Error banner */}
            {saveError && (
              <p className="text-[13px] text-red-700 bg-red-50 border border-red-200 rounded p-3 mb-4">{saveError}</p>
            )}

            {/* Title */}
            <div className="mb-8">
              <InlineEditTitle value={issue.title} onSave={(title) => save({ title })} />
            </div>

            {/* Description */}
            <div className="mb-8">
              <h3 className="text-[15px] font-semibold text-[#172B4D] mb-3">Description</h3>
              <InlineEditDescription
                value={issue.description}
                onSave={(description) => save({ description })}
              />
            </div>

            {/* Subtasks */}
            <div className="mb-8">
              <h3 className="text-[15px] font-semibold text-[#172B4D] mb-3">Subtasks</h3>
              <div className="bg-white border border-[#DFE1E6] rounded flex items-center p-2 px-3 text-[14px] text-[#6B778C] font-medium hover:bg-slate-50 cursor-pointer">
                Add subtask
              </div>
              
              {issue.children.length > 0 && (
                <div className="mt-2 flex flex-col border border-[#DFE1E6] rounded divide-y divide-[#DFE1E6]">
                  {issue.children.map((child) => {
                    const cs = TYPE_STYLES[child.type];
                    const CIcon = TYPE_ICONS[child.type];
                    return (
                      <div
                        key={child.id}
                        onClick={() => handleChildClick(child.id)}
                        className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-50 cursor-pointer"
                      >
                        <span className={`inline-flex items-center justify-center w-4 h-4 rounded-sm flex-shrink-0 ${child.type === 'STORY' ? 'text-green-500 bg-transparent' : cs.pill}`}>
                          <CIcon />
                        </span>
                        <span className="text-[13.5px] font-medium text-[#0052CC] hover:underline flex-shrink-0 cursor-pointer">{child.issueKey}</span>
                        <span className="text-[13.5px] text-[#172B4D] flex-1 truncate">{child.title}</span>
                        {/* Status Mock pill */}
                        <div className="bg-[#DFE1E6] text-[#42526E] font-bold text-[11px] px-2 py-0.5 rounded uppercase flex-shrink-0">
                           {child.status.replace('_', ' ')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Linked Issues */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3 text-[#172B4D] font-semibold">
                 <h3 className="text-[15px]">Linked work items</h3>
                 <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100 text-[#42526E] font-bold text-[18px]">
                   +
                 </button>
              </div>

              {/* Source links (this issue → target) */}
              {issue.sourceLinks.length > 0 && (
                <div className="mb-3">
                  {issue.sourceLinks.map((link) => {
                    const ls = TYPE_STYLES[link.target.type];
                    const LIcon = TYPE_ICONS[link.target.type];
                    return (
                      <div key={link.id} className="mb-2">
                        <div className="text-[13px] font-semibold text-[#172B4D] mb-1.5">
                           {LINK_LABELS[link.linkType]}
                        </div>
                        <div className="flex items-center gap-3 px-3 py-2 border border-[#DFE1E6] rounded hover:border-[#A5ADBA] hover:shadow-sm bg-white cursor-pointer group">
                          <span className={`inline-flex items-center gap-1 text-[13px] font-bold py-0.5 flex-shrink-0 ${ls.pill}`}>
                            <LIcon />
                          </span>
                          <span className="text-[13.5px] font-medium text-[#0052CC] group-hover:underline flex-shrink-0">{link.target.issueKey}</span>
                          <span className="flex-1 text-[13.5px] text-[#172B4D] truncate">{link.target.title}</span>
                          <div className="bg-[#DFE1E6] text-[#42526E] font-bold text-[11px] px-2 py-0.5 rounded uppercase flex-shrink-0">
                             {link.target.status.replace('_', ' ')}
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRemoveLink(link.id); }}
                            className="w-6 h-6 flex items-center justify-center rounded text-[#6B778C] hover:text-[#DE350B] hover:bg-red-50 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                            title="Remove link"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Target links (other issue → this issue) */}
              {issue.targetLinks.length > 0 && (
                <div className="mb-3">
                  {issue.targetLinks.map((link) => {
                    const ls = TYPE_STYLES[link.source.type];
                    const LIcon = TYPE_ICONS[link.source.type];
                    return (
                      <div key={link.id} className="mb-2">
                        <div className="text-[13px] font-semibold text-[#172B4D] mb-1.5">
                           Is {LINK_LABELS[link.linkType].toLowerCase()} by
                        </div>
                        <div className="flex items-center gap-3 px-3 py-2 border border-[#DFE1E6] rounded hover:border-[#A5ADBA] hover:shadow-sm bg-white cursor-pointer group">
                          <span className={`inline-flex items-center gap-1 text-[13px] font-bold py-0.5 flex-shrink-0 ${ls.pill}`}>
                            <LIcon />
                          </span>
                          <span className="text-[13.5px] font-medium text-[#0052CC] group-hover:underline flex-shrink-0">{link.source.issueKey}</span>
                          <span className="flex-1 text-[13.5px] text-[#172B4D] truncate">{link.source.title}</span>
                          <div className="bg-[#DFE1E6] text-[#42526E] font-bold text-[11px] px-2 py-0.5 rounded uppercase flex-shrink-0">
                             {link.source.status.replace('_', ' ')}
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRemoveLink(link.id); }}
                            className="w-6 h-6 flex items-center justify-center rounded text-[#6B778C] hover:text-[#DE350B] hover:bg-red-50 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                            title="Remove link"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add link form */}
              <div className="mt-3">
                <div className="flex gap-2">
                  <select
                    value={linkType}
                    onChange={(e) => setLinkType(e.target.value as IssueLinkType)}
                    className="text-[13px] border border-[#DFE1E6] rounded px-3 py-1.5 bg-[#FAFBFC] hover:bg-slate-100 text-[#172B4D] font-medium focus:outline-none focus:border-[#4C9AFF]"
                  >
                    {(Object.keys(LINK_LABELS) as IssueLinkType[]).map((lt) => (
                      <option key={lt} value={lt}>{LINK_LABELS[lt]}</option>
                    ))}
                  </select>
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={linkTarget ? `${linkTarget.issueKey} \u00B7 ${linkTarget.title}` : linkQuery}
                      onChange={(e) => {
                        if (linkTarget) setLinkTarget(null);
                        setLinkQuery(e.target.value);
                      }}
                      placeholder="Search by project, issue key, title..."
                      className="w-full text-[13px] text-gray-800 placeholder-gray-600 border border-[#DFE1E6] rounded px-3 py-1.5 focus:outline-none focus:border-[#4C9AFF] bg-white"
                    />
                    {linkResults.length > 0 && !linkTarget && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#DFE1E6] rounded shadow-lg z-50 max-h-60 overflow-y-auto">
                        {linkLoading && <div className="px-3 py-2 text-[13px] text-slate-400">Searching...</div>}
                        {linkResults.map((r) => {
                          const rs = TYPE_STYLES[r.type];
                          const RIcon = TYPE_ICONS[r.type];
                          const isExpanded = expandedLinkResults.has(r.id);
                          const _linkedIds = new Set<string>([
                            ...(issue?.sourceLinks ?? []).map((l) => l.target.id),
                            ...(issue?.targetLinks ?? []).map((l) => l.source.id),
                            issue?.id,
                          ]);
                          const childrenIssues = (r.type === 'STORY' || r.type === 'EPIC')
                            ? allIssues.filter((c) => c.parentId === r.id && !_linkedIds.has(c.id))
                            : [];

                          return (
                            <div key={r.id}>
                              <button
                                onClick={() => {
                                  // If story/epic has children, toggle accordion; otherwise select
                                  if (childrenIssues.length > 0) {
                                    toggleLinkAccordion(r.id);
                                  } else {
                                    setLinkTarget(r);
                                    setLinkQuery('');
                                    setLinkResults([]);
                                  }
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F4F5F7] text-left transition-colors"
                              >
                                {childrenIssues.length > 0 && (
                                  <span className="flex-shrink-0 text-[#6B778C]">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}><polyline points="6 9 12 15 18 9"/></svg>
                                  </span>
                                )}
                                <span className={`inline-flex items-center flex-shrink-0 ${rs.pill}`}>
                                  <RIcon />
                                </span>
                                <span className="text-[13px] font-medium text-[#0052CC]">{r.issueKey}</span>
                                <span className="text-[13px] text-[#172B4D] truncate">{r.title}</span>
                              </button>
                              {isExpanded && childrenIssues.length > 0 && (
                                <div className="ml-4 border-l-2 border-[#DFE1E6]">
                                  {childrenIssues.map((child) => {
                                    const cs = TYPE_STYLES[child.type];
                                    const CIcon = TYPE_ICONS[child.type];
                                    return (
                                      <button
                                        key={child.id}
                                        onClick={() => { setLinkTarget(child); setLinkQuery(''); setLinkResults([]); }}
                                        className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#F4F5F7] text-left transition-colors"
                                      >
                                        <span className={`inline-flex items-center flex-shrink-0 ${cs.pill}`}>
                                          <CIcon />
                                        </span>
                                        <span className="text-[12px] font-medium text-[#0052CC]">{child.issueKey}</span>
                                        <span className="text-[12px] text-[#172B4D] truncate">{child.title}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleAddLink}
                    disabled={!linkTarget || linkLoading}
                    className="px-3 py-1.5 text-[13px] font-semibold text-white bg-[#0052CC] rounded disabled:opacity-40 hover:bg-[#0047b3] transition-colors flex-shrink-0"
                  >
                    Link
                  </button>
                </div>
              </div>
            </div>


          </div>

          {/* RIGHT — Sidebar details */}
          <div className="w-[320px] flex-shrink-0 pl-6 pr-4 py-5 overflow-y-auto space-y-4 relative border-l border-[#DFE1E6] bg-white">

            {/* Status dropdown */}
            <StatusDropdown
              status={issue.status}
              onChange={handleStatusChange}
              disabled={issue.type === 'EPIC'}
              saving={saving}
            />

            {/* Details panel — static (no accordion) */}
            <div className="border border-[#DFE1E6] rounded-[3px] bg-white overflow-hidden">
               <div className="px-4 py-3">
                 <span className="font-semibold text-[14.5px] text-[#172B4D]">Details</span>
               </div>

               <div className="px-5 pb-5 pt-1 space-y-4 text-[13px]">
                 {/* ── Assign To ── */}
                 <div className="grid grid-cols-[110px_1fr] items-center gap-3">
                   <div className="text-[#6B778C] font-semibold hover:text-[#172B4D] cursor-pointer">Assign To</div>
                   <div className="flex flex-col items-start gap-1">
                     <button className="flex items-center gap-2 text-[#42526E] font-medium hover:bg-slate-100 rounded px-1 -ml-1 transition-colors group h-8">
                       {issue.assignee ? (
                          <>
                           <div className="w-6 h-6 rounded-full bg-[#FF5630] flex items-center justify-center text-white text-[9px] font-bold">{getInitials(issue.assignee.name)}</div>
                           <span>{issue.assignee.name}</span>
                          </>
                       ) : (
                          <>
                           <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-[#A5ADBA]"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg></div>
                           <span>Unassigned</span>
                          </>
                       )}
                     </button>
                     {!issue.assignee && <span className="text-[#0052CC] font-medium cursor-pointer hover:underline text-[13px]">Assign to me</span>}
                   </div>
                 </div>

                 {/* ── Reporter ── */}
                 <div className="grid grid-cols-[110px_1fr] items-center gap-3">
                   <div className="text-[#6B778C] font-semibold hover:text-[#172B4D] cursor-pointer">Reporter</div>
                   <div className="flex items-center gap-2 font-medium text-[#42526E]">
                     {issue.reporter ? (
                        <>
                          <div className="w-6 h-6 rounded-full bg-[#FF5630] flex items-center justify-center text-white text-[9px] font-bold">{getInitials(issue.reporter.name)}</div>
                          <span>{issue.reporter.name}</span>
                        </>
                     ) : (
                        <>
           <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-[#A5ADBA]">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
               <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
             </svg>
           </div>
                        </>
                     )}
                   </div>
                 </div>

                 {/* ── Priority ── */}
                 <div className="grid grid-cols-[110px_1fr] items-center gap-3 min-h-[32px]">
                   <div className="text-[#6B778C] font-semibold hover:text-[#172B4D] cursor-pointer">Priority</div>
                   <button className="text-[#42526E] hover:bg-slate-100 rounded px-2 py-1 -ml-2 transition-colors text-left flex items-center gap-2">
                     <span className={`w-2 h-2 rounded-[2px] ${PRIORITY_CONFIG[issue.priority]?.dot}`} /> {issue.priority === 'MEDIUM' ? 'None' : PRIORITY_CONFIG[issue.priority]?.label}
                   </button>
                 </div>

                 {/* ── Parent ── */}
                 <div className="grid grid-cols-[110px_1fr] items-center gap-3 min-h-[32px]">
                   <div className="text-[#6B778C] font-semibold hover:text-[#172B4D] cursor-pointer">Parent</div>
                   {issue.parent ? (
                     <button
                       onClick={() => fetchIssueDetail(issue.parent!.id, projectId)}
                       className="text-[#0052CC] font-medium cursor-pointer hover:underline text-left"
                     >
                       {issue.parent.issueKey}
                     </button>
                   ) : (
                     <span className="text-[#172B4D] px-1">None</span>
                   )}
                 </div>

                 {/* ── Estimate ── */}
                 <div className="grid grid-cols-[110px_1fr] gap-3 min-h-[32px]">
                   <div className="text-[#6B778C] font-semibold hover:text-[#172B4D] cursor-pointer pt-1 line-clamp-2">Estimate</div>
                   <span className="text-[#172B4D] px-1 pt-1">None</span>
                 </div>

                 {/* ── Due date ── */}
                 <div className="grid grid-cols-[110px_1fr] items-center gap-3 min-h-[32px]">
                   <div className="text-[#6B778C] font-semibold hover:text-[#172B4D] cursor-pointer">Due date</div>
                   <button className="border border-[#DFE1E6] rounded-[3px] bg-white hover:bg-[#F4F5F7] flex items-center gap-2 px-2 py-1 text-[13px] text-[#172B4D] transition-colors">
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                     Apr 4, 2026
                   </button>
                 </div>

                 {/* ── Created ── */}
                 <div className="grid grid-cols-[110px_1fr] items-center gap-3 min-h-[32px]">
                   <div className="text-[#6B778C] font-semibold hover:text-[#172B4D] cursor-pointer">Created</div>
                   <span className="text-[#172B4D]">{formatDate(issue.createdAt)}</span>
                 </div>

                 {/* ── Updated ── */}
                 <div className="grid grid-cols-[110px_1fr] items-center gap-3 min-h-[32px]">
                   <div className="text-[#6B778C] font-semibold hover:text-[#172B4D] cursor-pointer">Updated</div>
                   <span className="text-[#172B4D]">{formatDate(issue.updatedAt)}</span>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes detailSlideIn {
          from { opacity: 0; transform: scale(0.97) translateY(-12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );

  return createPortal(modal, document.body);
}
