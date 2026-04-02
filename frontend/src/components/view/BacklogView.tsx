'use client';

import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useIssues } from '@/lib/IssuesContext';
import { useIssueModal } from '@/lib/IssueModalContext';
import { issuesService } from '@/lib/issues.service';
import type { IssueEpic, IssueStory, IssueTask, IssueStatus, IssuePriority, IssueType, Issue } from '@/types/issue';

// ── SVG type icons ────────────────────────────────────────────────────────────
const TypeIcon = ({ type, size = 11 }: { type: IssueType; size?: number }) => {
  if (type === 'EPIC') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  );
  if (type === 'STORY') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  );
  if (type === 'BUG') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2l1.88 1.88M14.12 3.88 16 2M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/>
      <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6z"/>
      <path d="M12 20v-9"/>
    </svg>
  );
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  );
};

// ── Badge helpers ─────────────────────────────────────────────────────────────

const TYPE_BADGE: Record<string, { label: string; pill: string }> = {
  EPIC:  { label: 'Epic',  pill: 'bg-purple-100 text-purple-700 border border-purple-200' },
  STORY: { label: 'Story', pill: 'bg-blue-100 text-blue-700 border border-blue-200'       },
  TASK:  { label: 'Task',  pill: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
  BUG:   { label: 'Bug',   pill: 'bg-rose-100 text-rose-700 border border-rose-200'       },
};

const STATUS_PILL: Record<IssueStatus, string> = {
  TODO:        'bg-slate-100 text-slate-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  DONE:        'bg-green-100 text-green-700',
};

const STATUS_LABEL: Record<IssueStatus, string> = {
  TODO:        'To Do',
  IN_PROGRESS: 'In Progress',
  DONE:        'Done',
};

const PRIORITY_DOT: Record<IssuePriority, string> = {
  HIGH:   'bg-red-500',
  MEDIUM: 'bg-yellow-400',
  LOW:    'bg-blue-400',
};

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

// ── Row components ────────────────────────────────────────────────────────────

interface TaskRowProps {
  task: IssueTask;
  onOpen: (id: string) => void;
}

function TaskRow({ task, onOpen }: TaskRowProps) {
  const badge = TYPE_BADGE[task.type] ?? TYPE_BADGE.TASK;
  return (
    <div onClick={() => onOpen(task.id)} className="flex items-center gap-3 px-4 py-2.5 ml-16 hover:bg-slate-50 rounded-xl transition-colors group cursor-pointer">
      {/* Type badge */}
      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 ${badge.pill}`}>
        <TypeIcon type={task.type} /> {badge.label}
      </span>

      {/* Key */}
      <span className="text-[10px] font-mono text-slate-400 w-24 flex-shrink-0">{task.issueKey}</span>

      {/* Title */}
      <span className="flex-1 text-sm text-slate-700 truncate">{task.title}</span>

      {/* Priority dot */}
      <span
        className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[task.priority]}`}
        title={task.priority}
      />

      {/* Status */}
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_PILL[task.status]}`}>
        {STATUS_LABEL[task.status]}
      </span>

      {/* Assignee */}
      {task.assignee ? (
        <div
          className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
          title={task.assignee.name}
        >
          {getInitials(task.assignee.name)}
        </div>
      ) : (
        <div className="w-6 h-6 rounded-md border-2 border-dashed border-slate-200 flex-shrink-0" title="Unassigned" />
      )}
    </div>
  );
}

interface StoryRowProps {
  story: IssueStory;
  isOpen: boolean;
  onToggle: () => void;
  onCreateTask: () => void;
  onOpen: (id: string) => void;
}

function StoryRow({ story, isOpen, onToggle, onCreateTask, onOpen }: StoryRowProps) {
  const badge = TYPE_BADGE['STORY'];
  return (
    <>
      <div className="flex items-center gap-3 px-4 py-2.5 ml-8 hover:bg-blue-50/50 rounded-xl transition-colors group cursor-pointer" onClick={onToggle}>
        {/* Expand toggle */}
        <button
          className="w-5 h-5 flex items-center justify-center text-slate-400 flex-shrink-0"
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          aria-label={isOpen ? 'Collapse story' : 'Expand story'}
        >
          <svg
            width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"
            className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
          >
            <polyline points="3 2 9 6 3 10"/>
          </svg>
        </button>

        {/* Type badge — click opens detail */}
        <span
          onClick={(e) => { e.stopPropagation(); onOpen(story.id); }}
          className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 cursor-pointer ${badge.pill}`}
        >
          <TypeIcon type="STORY" /> {badge.label}
        </span>

        {/* Key */}
        <span className="text-[10px] font-mono text-slate-400 w-24 flex-shrink-0">{story.issueKey}</span>

        {/* Title — click opens detail */}
        <span
          onClick={(e) => { e.stopPropagation(); onOpen(story.id); }}
          className="flex-1 text-sm font-semibold text-slate-800 truncate hover:text-blue-600 transition-colors"
        >{story.title}</span>

        {/* Task count */}
        <span className="text-[10px] text-slate-400 flex-shrink-0">
          {story.children.length} task{story.children.length !== 1 ? 's' : ''}
        </span>

        {/* Priority dot */}
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[story.priority]}`} title={story.priority} />

        {/* Status */}
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_PILL[story.status]}`}>
          {STATUS_LABEL[story.status]}
        </span>

        {/* Assignee */}
        {story.assignee ? (
          <div
            className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
            title={story.assignee.name}
          >
            {getInitials(story.assignee.name)}
          </div>
        ) : (
          <div className="w-6 h-6 rounded-md border-2 border-dashed border-slate-200 flex-shrink-0" title="Unassigned" />
        )}

        {/* Quick-add Task */}
        <button
          onClick={(e) => { e.stopPropagation(); onCreateTask(); }}
          className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center text-sm hover:bg-blue-200 transition-all flex-shrink-0"
          title="Add task to this story"
        >
          +
        </button>
      </div>

      {/* Task children */}
      {isOpen && (
        <div className="overflow-hidden" style={{ animation: 'backlogSlideIn 0.15s ease-out' }}>
          {story.children.length === 0 ? (
            <div className="ml-16 px-4 py-2 text-xs text-slate-400 italic">No tasks yet</div>
          ) : (
            story.children.map((task) => <TaskRow key={task.id} task={task} onOpen={onOpen} />)
          )}
        </div>
      )}
    </>
  );
}

interface EpicRowProps {
  epic: IssueEpic;
  projectId: string;
  isOpen: boolean;
  storyOpenMap: Record<string, boolean>;
  onToggleEpic: () => void;
  onToggleStory: (storyId: string) => void;
  onCreateStory: () => void;
  onCreateTask: (storyId: string) => void;
  onOpen: (id: string) => void;
}

function EpicRow({ epic, projectId, isOpen, storyOpenMap, onToggleEpic, onToggleStory, onCreateStory, onCreateTask, onOpen }: EpicRowProps) {
  const badge = TYPE_BADGE['EPIC'];
  const { refresh } = useIssues();
  // Initialize from server state so refreshes persist the done state
  const [isDone, setIsDone] = useState(epic.isCompleted ?? false);
  const [isPersisting, setIsPersisting] = useState(false);

  const handleToggleDone = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !isDone;
    setIsDone(next); // optimistic update
    setIsPersisting(true);
    try {
      await issuesService.completeEpic(epic.id, projectId, next);
      refresh(); // keep context in sync
    } catch {
      setIsDone(!next); // revert on failure
    } finally {
      setIsPersisting(false);
    }
  };

  return (
    <div className={`mb-3 transition-opacity duration-300 ${isDone ? 'opacity-60' : ''}`}>
      {/* Epic header row — container only */}
      <div
        className={`flex items-center gap-3 px-4 py-3 border rounded-xl transition-colors group cursor-pointer ${
          isDone
            ? 'bg-emerald-50 border-emerald-200'
            : 'bg-purple-50 hover:bg-purple-100/70 border-purple-100'
        }`}
        onClick={onToggleEpic}
      >
        {/* Expand toggle */}
        <button
          className={`w-5 h-5 flex items-center justify-center flex-shrink-0 ${isDone ? 'text-emerald-400' : 'text-purple-400'}`}
          onClick={(e) => { e.stopPropagation(); onToggleEpic(); }}
        >
          <svg
            width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"
            className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
          >
            <polyline points="3 2 9 6 3 10"/>
          </svg>
        </button>

        {/* Type badge */}
        <span
          onClick={(e) => { e.stopPropagation(); onOpen(epic.id); }}
          className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 cursor-pointer ${badge.pill}`}
        >
          <TypeIcon type="EPIC" /> {badge.label}
        </span>

        {/* Key */}
        <span className="text-[10px] font-mono text-purple-400 w-24 flex-shrink-0">{epic.issueKey}</span>

        {/* Title */}
        <span
          onClick={(e) => { e.stopPropagation(); onOpen(epic.id); }}
          className={`flex-1 text-sm font-bold truncate hover:text-purple-700 transition-colors cursor-pointer ${
            isDone ? 'line-through text-slate-500' : 'text-slate-900'
          }`}
        >{epic.title}</span>

        {/* ✔ Mark Epic as Done */}
        <button
          onClick={handleToggleDone}
          title={isDone ? 'Mark as not done' : 'Mark Epic as done'}
          disabled={isPersisting}
          className={`flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all flex-shrink-0 disabled:opacity-50 ${
            isDone
              ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
              : 'border-slate-300 text-transparent hover:border-emerald-400 hover:text-emerald-400'
          }`}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </button>

        {/* Quick-add Story */}
        <button
          onClick={(e) => { e.stopPropagation(); onCreateStory(); }}
          className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md bg-purple-100 text-purple-600 flex items-center justify-center text-sm hover:bg-purple-200 transition-all flex-shrink-0"
          title="Add story to this epic"
        >
          +
        </button>
      </div>

      {/* Stories */}
      {isOpen && (
        <div className="mt-1 space-y-0.5 overflow-hidden" style={{ animation: 'backlogSlideIn 0.15s ease-out' }}>
          {epic.children.length === 0 ? (
            <div className="ml-8 px-4 py-2 text-xs text-slate-400 italic">No stories yet — add one with the + button</div>
          ) : (
            epic.children.map((story) => (
              <StoryRow
                key={story.id}
                story={story}
                isOpen={!!storyOpenMap[story.id]}
                onToggle={() => onToggleStory(story.id)}
                onCreateTask={() => onCreateTask(story.id)}
                onOpen={onOpen}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── OrphanIssueRow ────────────────────────────────────────────────────────────
// An unparented (parentId=null, non-EPIC) issue row with a ✔ mark-done button.

function OrphanIssueRow({
  issue,
  projectId,
  onOpen,
}: {
  issue: Issue;
  projectId: string;
  onOpen: (id: string) => void;
}) {
  const { refresh } = useIssues();
  const badge = TYPE_BADGE[issue.type] ?? TYPE_BADGE.TASK;
  const [isDone, setIsDone] = useState(issue.status === 'DONE');
  const [isPersisting, setIsPersisting] = useState(false);

  const handleToggleDone = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !isDone;
    setIsDone(next);
    setIsPersisting(true);
    try {
      await issuesService.update(issue.id, {
        projectId,
        status: next ? 'DONE' : 'TODO',
      });
      refresh();
    } catch {
      setIsDone(!next); // revert on failure
    } finally {
      setIsPersisting(false);
    }
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 rounded-xl transition-all group cursor-pointer ${isDone ? 'opacity-60' : ''}`}
      onClick={() => onOpen(issue.id)}
    >
      {/* Mark Done radio button */}
      <button
        onClick={handleToggleDone}
        disabled={isPersisting}
        title={isDone ? 'Mark as not done' : 'Mark as done'}
        className={`flex items-center justify-center w-5 h-5 rounded-full border-2 transition-all flex-shrink-0 disabled:opacity-50 ${
          isDone
            ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
            : 'border-slate-300 text-transparent hover:border-emerald-400 hover:text-emerald-400'
        }`}
      >
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </button>

      {/* Type badge */}
      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 ${badge.pill}`}>
        <TypeIcon type={issue.type} /> {badge.label}
      </span>

      {/* Key */}
      <span className="text-[10px] font-mono text-slate-400 w-24 flex-shrink-0">{issue.issueKey}</span>

      {/* Title */}
      <span className={`flex-1 text-sm truncate ${isDone ? 'line-through text-slate-400' : 'text-slate-700'}`}>
        {issue.title}
      </span>

      {/* Status pill */}
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_PILL[issue.status]}`}>
        {STATUS_LABEL[issue.status]}
      </span>

      {/* Assignee avatar */}
      {issue.assignee ? (
        <div
          className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
          title={issue.assignee.name}
        >
          {getInitials(issue.assignee.name)}
        </div>
      ) : (
        <div className="w-6 h-6 rounded-md border-2 border-dashed border-slate-200 flex-shrink-0" title="Unassigned" />
      )}
    </div>
  );
}

// ── Main BacklogView ──────────────────────────────────────────────────────────

export default function BacklogView() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { issuesTree, allIssues, loading, error, fetchIssueDetail } = useIssues();
  const { openCreateIssue } = useIssueModal();

  // Track which epics and stories are expanded
  const [epicOpenMap, setEpicOpenMap] = useState<Record<string, boolean>>({});
  const [storyOpenMap, setStoryOpenMap] = useState<Record<string, boolean>>({});

  const toggleEpic = useCallback((epicId: string) => {
    setEpicOpenMap((prev) => ({ ...prev, [epicId]: !prev[epicId] }));
  }, []);

  const toggleStory = useCallback((storyId: string) => {
    setStoryOpenMap((prev) => ({ ...prev, [storyId]: !prev[storyId] }));
  }, []);

  const handleOpen = useCallback((id: string) => {
    fetchIssueDetail(id, projectId);
  }, [fetchIssueDetail, projectId]);

  // Orphan issues: parentId === null but NOT an EPIC (i.e. orphan STORY, TASK, BUG)
  const orphanIssues: Issue[] = allIssues.filter(
    (i) => i.parentId === null && i.type !== 'EPIC',
  );

  // IssueEpic-compatible tree items (EPICs)
  const epicTree = issuesTree.filter((i) => i.type === 'EPIC') as unknown as IssueEpic[];

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-xl px-5 py-4 text-sm text-red-600">
        {error}
      </div>
    );
  }

  // ── Empty ──────────────────────────────────────────────────────────────────
  if (!loading && issuesTree.length === 0 && orphanIssues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 mb-1">No issues yet</h3>
          <p className="text-sm text-slate-500 max-w-sm">
            Create your first Epic to start organizing work into Stories and Tasks.
          </p>
        </div>
        <button
          onClick={() => openCreateIssue('EPIC')}
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-purple-500/25"
        >
          <TypeIcon type="EPIC" /> Create First Epic
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Column headers — no status/who since Epics are container-only */}
      <div className="flex items-center gap-3 px-4 py-2 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
        <span className="w-5 flex-shrink-0" />
        <span className="w-14 flex-shrink-0" />
        <span className="w-24 flex-shrink-0">Key</span>
        <span className="flex-1">Title</span>
        <span className="w-6 flex-shrink-0" />
      </div>

      {/* Epic tree */}
      {epicTree.length > 0 && (
        <div className="space-y-1 mb-4">
          {epicTree.map((epic) => (
            <EpicRow
              key={epic.id}
              epic={epic}
              projectId={params.projectId as string}
              isOpen={!!epicOpenMap[epic.id]}
              storyOpenMap={storyOpenMap}
              onToggleEpic={() => toggleEpic(epic.id)}
              onToggleStory={toggleStory}
              onCreateStory={() => openCreateIssue('STORY')}
              onCreateTask={() => openCreateIssue('TASK')}
              onOpen={handleOpen}
            />
          ))}
        </div>
      )}

      {/* Unparented issues section */}
      {orphanIssues.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-2 px-2 py-2 mb-2">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">
              Unparented Issues ({orphanIssues.length})
            </span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          <div className="space-y-0.5">
            {orphanIssues.map((issue) => (
              <OrphanIssueRow
                key={issue.id}
                issue={issue}
                projectId={projectId}
                onOpen={handleOpen}
              />
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes backlogSlideIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
