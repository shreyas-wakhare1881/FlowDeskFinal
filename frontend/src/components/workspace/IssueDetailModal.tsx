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
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  ),
  TASK: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
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
        className="w-full text-xl font-bold text-slate-900 border-b-2 border-blue-400 outline-none bg-blue-50/50 rounded px-1 py-0.5"
        maxLength={200}
      />
    );
  }

  return (
    <h2
      className="text-xl font-bold text-slate-900 cursor-pointer hover:bg-slate-100 rounded-lg px-1 py-0.5 transition-colors"
      onClick={() => setEditing(true)}
      title="Click to edit"
    >
      {value}
    </h2>
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
      <textarea
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        rows={4}
        maxLength={2000}
        className="w-full text-sm text-slate-700 border border-blue-300 rounded-xl p-3 resize-none outline-none focus:ring-2 focus:ring-blue-400/20"
        placeholder="Add a description..."
      />
    );
  }

  return (
    <div
      className="text-sm text-slate-600 min-h-[60px] cursor-pointer hover:bg-slate-50 rounded-xl p-3 border border-transparent hover:border-slate-200 transition-all"
      onClick={() => setEditing(true)}
      title="Click to edit description"
    >
      {value ? (
        <p className="whitespace-pre-wrap">{value}</p>
      ) : (
        <p className="text-slate-400 italic">Add a description...</p>
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
        const results = await issuesService.getAll(projectId, undefined, undefined, linkQuery);
        // Exclude current issue and already-linked issues
        const linkedIds = new Set([
          ...(issue?.sourceLinks ?? []).map((l) => l.target.id),
          ...(issue?.targetLinks ?? []).map((l) => l.source.id),
          issue?.id,
        ]);
        setLinkResults(results.filter((r) => !linkedIds.has(r.id)));
      } catch {
        setLinkResults([]);
      } finally {
        setLinkLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [linkQuery, projectId, issue]);

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
      className="fixed inset-0 z-[150] flex items-center justify-center p-4"
      style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => { if (e.target === e.currentTarget) clearSelectedIssue(); }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
        style={{ animation: 'detailSlideIn 0.2s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Top Bar ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 bg-slate-50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded-md ${typeStyle.pill}`}>
              <TypeIcon /> {issue.type}
            </span>
            <span className="text-xs font-mono font-semibold text-slate-500">{issue.issueKey}</span>
          </div>
          <div className="flex items-center gap-2">
            {saving && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Saving...
              </span>
            )}
            <button
              onClick={clearSelectedIssue}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── Body: 2-column layout ────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">

          {/* LEFT — Main content */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 min-w-0">

            {/* Title */}
            <InlineEditTitle value={issue.title} onSave={(title) => save({ title })} />

            {/* Error banner */}
            {saveError && (
              <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{saveError}</p>
            )}

            {/* Description */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Description</p>
              <InlineEditDescription
                value={issue.description}
                onSave={(description) => save({ description })}
              />
            </div>

            {/* Children */}
            {issue.children.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                  Child Issues ({issue.children.length})
                </p>
                <div className="space-y-1.5">
                  {issue.children.map((child) => {
                    const cs = TYPE_STYLES[child.type];
                    const CIcon = TYPE_ICONS[child.type];
                    const sc = STATUS_CONFIG[child.status];
                    return (
                      <div
                        key={child.id}
                        onClick={() => handleChildClick(child.id)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 cursor-pointer transition-all"
                      >
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 ${cs.pill}`}>
                          <CIcon /> {child.type}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 flex-shrink-0">{child.issueKey}</span>
                        <span className="text-sm text-slate-800 flex-1 truncate">{child.title}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${sc.pill}`}>{sc.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Linked Issues */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Linked Issues</p>

              {/* Source links (this issue → target) */}
              {issue.sourceLinks.length > 0 && (
                <div className="space-y-1.5 mb-3">
                  {issue.sourceLinks.map((link) => {
                    const ls = TYPE_STYLES[link.target.type];
                    const LIcon = TYPE_ICONS[link.target.type];
                    return (
                      <div key={link.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-100 bg-slate-50">
                        <span className="text-[10px] text-slate-500 font-semibold w-20 flex-shrink-0">{LINK_LABELS[link.linkType]}:</span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 ${ls.pill}`}>
                          <LIcon /> {link.target.type}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 flex-shrink-0">{link.target.issueKey}</span>
                        <span className="flex-1 text-sm text-slate-700 truncate">{link.target.title}</span>
                        <button
                          onClick={() => handleRemoveLink(link.id)}
                          className="w-5 h-5 flex items-center justify-center rounded text-slate-300 hover:text-red-500 transition-colors flex-shrink-0"
                          title="Remove link"
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Target links (other issue → this issue) */}
              {issue.targetLinks.length > 0 && (
                <div className="space-y-1.5 mb-3">
                  {issue.targetLinks.map((link) => {
                    const ls = TYPE_STYLES[link.source.type];
                    const LIcon = TYPE_ICONS[link.source.type];
                    return (
                      <div key={link.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-100 bg-amber-50/50">
                        <span className="text-[10px] text-amber-600 font-semibold w-24 flex-shrink-0">Is {LINK_LABELS[link.linkType].toLowerCase()} by:</span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 ${ls.pill}`}>
                          <LIcon /> {link.source.type}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 flex-shrink-0">{link.source.issueKey}</span>
                        <span className="flex-1 text-sm text-slate-700 truncate">{link.source.title}</span>
                        <button
                          onClick={() => handleRemoveLink(link.id)}
                          className="w-5 h-5 flex items-center justify-center rounded text-slate-300 hover:text-red-500 transition-colors flex-shrink-0"
                          title="Remove link"
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {issue.sourceLinks.length === 0 && issue.targetLinks.length === 0 && (
                <p className="text-xs text-slate-400 italic px-1">No linked issues yet</p>
              )}

              {/* Add link form */}
              <div className="mt-3 p-3 rounded-xl border border-dashed border-slate-200 bg-slate-50">
                <p className="text-[11px] font-semibold text-slate-500 mb-2">Link an issue</p>
                <div className="flex gap-2">
                  <select
                    value={linkType}
                    onChange={(e) => setLinkType(e.target.value as IssueLinkType)}
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:border-blue-400"
                  >
                    {(Object.keys(LINK_LABELS) as IssueLinkType[]).map((lt) => (
                      <option key={lt} value={lt}>{LINK_LABELS[lt]}</option>
                    ))}
                  </select>
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={linkTarget ? `${linkTarget.issueKey} · ${linkTarget.title}` : linkQuery}
                      onChange={(e) => {
                        if (linkTarget) setLinkTarget(null);
                        setLinkQuery(e.target.value);
                      }}
                      placeholder="Search by issue title..."
                      className="w-full text-xs border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-400 bg-white"
                    />
                    {linkResults.length > 0 && !linkTarget && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-40 overflow-y-auto">
                        {linkLoading && <div className="px-3 py-2 text-xs text-slate-400">Searching...</div>}
                        {linkResults.map((r) => {
                          const rs = TYPE_STYLES[r.type];
                          const RIcon = TYPE_ICONS[r.type];
                          return (
                            <button
                              key={r.id}
                              onClick={() => { setLinkTarget(r); setLinkQuery(''); setLinkResults([]); }}
                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-blue-50 text-left transition-colors"
                            >
                              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${rs.pill}`}>
                                <RIcon /> {r.type}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">{r.issueKey}</span>
                              <span className="text-xs text-slate-700 truncate">{r.title}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleAddLink}
                    disabled={!linkTarget || linkLoading}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg disabled:opacity-40 hover:bg-blue-700 transition-colors flex-shrink-0"
                  >
                    Link
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Sidebar details */}
          <div className="w-64 flex-shrink-0 border-l border-slate-100 bg-slate-50/50 overflow-y-auto px-5 py-5 space-y-4">

            {/* Status */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Status</p>
              <div className="flex flex-col gap-1">
                {(Object.keys(STATUS_CONFIG) as IssueStatus[]).map((s) => {
                  const sc = STATUS_CONFIG[s];
                  return (
                    <button
                      key={s}
                      onClick={() => save({ status: s })}
                      className={`text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                        issue.status === s
                          ? `${sc.pill} border-transparent ring-2 ring-blue-300`
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {sc.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Priority */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Priority</p>
              <div className="flex flex-col gap-1">
                {(Object.keys(PRIORITY_CONFIG) as IssuePriority[]).map((p) => {
                  const pc = PRIORITY_CONFIG[p];
                  return (
                    <button
                      key={p}
                      onClick={() => save({ priority: p })}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                        issue.priority === p
                          ? `${pc.active} ring-2 ring-blue-300`
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${pc.dot} flex-shrink-0`} />
                      {pc.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Assignee */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Assignee</p>
              {issue.assignee && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
                    {getInitials(issue.assignee.name)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{issue.assignee.name}</p>
                    <p className="text-[10px] text-slate-400">{issue.assignee.email}</p>
                  </div>
                </div>
              )}
              <select
                value={issue.assigneeId ?? ''}
                onChange={(e) => save({ assigneeId: e.target.value || null })}
                className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-blue-400"
              >
                <option value="">— Unassigned —</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>{m.name}</option>
                ))}
              </select>
            </div>

            {/* Parent */}
            {issue.type !== 'EPIC' && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Parent</p>
                {issue.parent && (
                  <div className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-lg mb-2 ${TYPE_STYLES[issue.parent.type].pill}`}>
                    {(() => { const PI = TYPE_ICONS[issue.parent.type]; return <PI />; })()}
                    {issue.parent.issueKey} · {issue.parent.title.slice(0, 20)}{issue.parent.title.length > 20 ? '...' : ''}
                  </div>
                )}
                <select
                  value={issue.parentId ?? ''}
                  onChange={(e) => save({ parentId: e.target.value || null })}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-blue-400"
                >
                  <option value="">— No parent —</option>
                  {parentCandidates.map((p) => (
                    <option key={p.id} value={p.id}>{p.issueKey} · {p.title}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Reporter */}
            {issue.reporter && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Reporter</p>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-[9px] font-bold">
                    {getInitials(issue.reporter.name)}
                  </div>
                  <span className="text-xs text-slate-700">{issue.reporter.name}</span>
                </div>
              </div>
            )}

            {/* Dates */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Dates</p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Created</span>
                  <span className="text-slate-700 font-medium">{formatDate(issue.createdAt)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Updated</span>
                  <span className="text-slate-700 font-medium">{formatDate(issue.updatedAt)}</span>
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
