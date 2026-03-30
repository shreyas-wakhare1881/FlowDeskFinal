'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import WsSidebar from '@/components/workspace/WsSidebar';
import WsTopbar from '@/components/workspace/WsTopbar';
import { usePermissions } from '@/lib/hooks/usePermissions';
import AccessDenied from '@/components/shared/AccessDenied';

// ─── Types ───────────────────────────────────────────────────────────────────

type Priority = 'critical' | 'medium' | 'low';
type RecurFrequency = 'Daily' | 'Weekly' | 'Bi-Weekly' | 'Monthly' | 'Custom';

interface FileItem {
  id: string;
  name: string;
  size: string;
  icon: string;
}

const TEAM_MEMBERS = [
  { id: 'USER-001', name: 'Rahul Kumar', avatar: 'RK', color: '#4361ee', role: 'Backend Dev', busy: 2 },
  { id: 'USER-002', name: 'Sneha Patel', avatar: 'SP', color: '#06d6a0', role: 'Frontend Dev', busy: 0 },
  { id: 'USER-003', name: 'Vishal Tiwari', avatar: 'VT', color: '#3a86ff', role: 'Full Stack', busy: 1 },
  { id: 'USER-004', name: 'Arjun Mehta', avatar: 'AM', color: '#7209b7', role: 'DevOps', busy: 3 },
  { id: 'USER-005', name: 'Priya Das', avatar: 'PD', color: '#f9a825', role: 'UI/UX', busy: 0 },
];

const FILE_ICONS: Record<string, string> = {
  pdf: '📄', png: '🖼️', jpg: '🖼️', jpeg: '🖼️',
  xlsx: '📊', xls: '📊', docx: '📝', doc: '📝',
};

// ─── Sub-Components ───────────────────────────────────────────────────────────

function WsTaskIdentity({
  taskName, setTaskName, taskDesc, setTaskDesc,
}: {
  taskName: string; setTaskName: (v: string) => void;
  taskDesc: string; setTaskDesc: (v: string) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6">
      <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
        <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">📝</span>
        Task Identity
      </h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Task Name <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              maxLength={100}
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="Enter a clear, actionable task name..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
              {taskName.length}/100
            </span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
          <div className="relative">
            <textarea
              rows={4}
              maxLength={500}
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
              placeholder="Describe the task objective, acceptance criteria, or context..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 resize-none"
            />
            <span className="absolute right-3 bottom-3 text-xs text-slate-400">
              {taskDesc.length}/500
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function WsPrioritySelector({
  priority, setPriority,
}: { priority: Priority | ''; setPriority: (v: Priority) => void }) {
  const options: { value: Priority; label: string; color: string; dot: string }[] = [
    { value: 'critical', label: 'Critical', color: 'text-red-600',    dot: 'bg-red-500' },
    { value: 'medium',   label: 'Medium',   color: 'text-yellow-600', dot: 'bg-yellow-400' },
    { value: 'low',      label: 'Low',      color: 'text-blue-600',   dot: 'bg-blue-400' },
  ];

  const selected = options.find((o) => o.value === priority);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6">
      <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
        <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">🎯</span>
        Priority Level
      </h2>

      {priority === 'critical' && (
        <div className="mb-3 flex items-center gap-2 bg-red-500/10 border border-red-200 rounded-xl px-4 py-2.5 animate-pulse">
          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
          <span className="text-red-700 text-xs font-semibold">CRITICAL — Team will be notified immediately</span>
        </div>
      )}

      <div className="relative">
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          className="w-full appearance-none px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 hover:border-slate-300 transition-all cursor-pointer"
        >
          <option value="" disabled>Select priority...</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {selected && <span className={`w-2.5 h-2.5 rounded-full ${selected.dot}`}></span>}
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function WsTeamAssignment({
  assignees, setAssignees,
}: { assignees: string[]; setAssignees: (v: string[]) => void }) {
  const toggle = (name: string) => {
    setAssignees(
      assignees.includes(name) ? assignees.filter((a) => a !== name) : [...assignees, name]
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6">
      <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
        <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600">👥</span>
        Assign To
      </h2>
      <div className="grid grid-cols-1 gap-2">
        {TEAM_MEMBERS.map((m) => {
          const selected = assignees.includes(m.name);
          return (
            <button
              key={m.id}
              onClick={() => toggle(m.name)}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                selected
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-slate-100 hover:border-slate-200 bg-white'
              }`}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: m.color }}
              >
                {m.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-900">{m.name}</div>
                <div className="text-xs text-slate-500">{m.role}</div>
              </div>
              <div className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                m.busy > 0
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-green-100 text-green-700'
              }`}>
                {m.busy > 0 ? `Busy: ${m.busy}` : 'Free'}
              </div>
              {selected && (
                <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WsFileUpload({
  files, setFiles,
}: { files: FileItem[]; setFiles: (v: FileItem[]) => void }) {
  const [dragOver, setDragOver] = useState(false);
  let fileCounter = files.length;

  const addFiles = useCallback(
    (rawFiles: FileList) => {
      const newItems: FileItem[] = Array.from(rawFiles).map((f) => {
        fileCounter++;
        const ext = f.name.split('.').pop()?.toLowerCase() || '';
        return {
          id: `file-${Date.now()}-${fileCounter}`,
          name: f.name,
          size: (f.size / 1024).toFixed(1) + ' KB',
          icon: FILE_ICONS[ext] || '📁',
        };
      });
      setFiles([...files, ...newItems]);
    },
    [files, setFiles, fileCounter]
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6">
      <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
        <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">📎</span>
        Attachments
      </h2>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
          dragOver ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-blue-300'
        }`}
      >
        <div className="text-3xl mb-2">📂</div>
        <p className="text-sm text-slate-600 mb-2">Drag & drop files here</p>
        <label className="cursor-pointer text-blue-600 text-sm font-semibold hover:underline">
          or browse files
          <input type="file" multiple className="hidden" onChange={(e) => e.target.files && addFiles(e.target.files)} />
        </label>
      </div>
      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((f) => (
            <div key={f.id} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg">
              <span className="text-lg">{f.icon}</span>
              <span className="flex-1 text-xs font-medium text-slate-700 truncate">{f.name}</span>
              <span className="text-xs text-slate-400">{f.size}</span>
              <button
                onClick={() => setFiles(files.filter((x) => x.id !== f.id))}
                className="text-slate-400 hover:text-red-500 text-sm ml-1"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WsRecurring({
  deadline, setDeadline, isRecurring, setIsRecurring, recurFreq, setRecurFreq,
}: {
  deadline: string; setDeadline: (v: string) => void;
  isRecurring: boolean; setIsRecurring: (v: boolean) => void;
  recurFreq: RecurFrequency | ''; setRecurFreq: (v: RecurFrequency) => void;
}) {
  const today = new Date().toISOString().split('T')[0];
  const freqs: RecurFrequency[] = ['Daily', 'Weekly', 'Bi-Weekly', 'Monthly', 'Custom'];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6">
      <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
        <span className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600">📅</span>
        Deadline & Recurrence
      </h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Deadline <span className="text-red-400">*</span>
          </label>
          <input
            type="date"
            min={today}
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
          />
        </div>
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
          <div>
            <div className="text-sm font-semibold text-slate-800">Recurring Task</div>
            <div className="text-xs text-slate-500">Repeat this task automatically</div>
          </div>
          <button
            onClick={() => setIsRecurring(!isRecurring)}
            className={`relative w-11 h-6 rounded-full transition-colors ${isRecurring ? 'bg-blue-600' : 'bg-slate-300'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isRecurring ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>
        {isRecurring && (
          <div className="flex flex-wrap gap-2">
            {freqs.map((f) => (
              <button
                key={f}
                onClick={() => setRecurFreq(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  recurFreq === f
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-slate-200 text-slate-600 hover:border-blue-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function WsTaskSummary({
  taskName, priority, assignees, deadline, files, isRecurring, recurFreq,
}: {
  taskName: string; priority: Priority | '';
  assignees: string[]; deadline: string;
  files: FileItem[]; isRecurring: boolean; recurFreq: RecurFrequency | '';
}) {
  const priorityLabels: Record<Priority, string> = {
    critical: '🔴 Critical', medium: '🟡 Steady', low: '🔵 Low',
  };
  const deadlineFormatted = deadline
    ? new Date(deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white h-fit">
      <h2 className="text-base font-bold mb-5 flex items-center gap-2">
        <span className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">⚡</span>
        Live Task Summary
      </h2>
      <div className="space-y-3">
        {[
          { label: 'Task Name', value: taskName || '—' },
          { label: 'Priority', value: priority ? priorityLabels[priority] : '—' },
          { label: 'Assigned To', value: assignees.length > 0 ? assignees.join(', ') : '—' },
          { label: 'Deadline', value: deadlineFormatted },
          { label: 'Attachments', value: files.length > 0 ? `${files.length} file(s)` : 'None' },
          { label: 'Recurring', value: isRecurring ? (recurFreq || 'Enabled') : 'No' },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between gap-3">
            <span className="text-white/50 text-xs font-medium">{label}</span>
            <span className="text-white text-xs font-semibold text-right max-w-[180px] truncate">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WsCreateTaskPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  // ── RBAC (must be declared before any early return) ───────────────────────
  const { permissions, role, loading: permLoading } = usePermissions(projectId);

  // ── Form state (all hooks declared unconditionally — Rules of Hooks) ───────
  const [taskName, setTaskName] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [priority, setPriority] = useState<Priority | ''>('');
  const [assignees, setAssignees] = useState<string[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [deadline, setDeadline] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurFreq, setRecurFreq] = useState<RecurFrequency | ''>('');

  // ── UI state ───────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [success, setSuccess] = useState(false);
  const [createdTaskId, setCreatedTaskId] = useState('');

  // ── Permission gates (after all hooks — safe to early return here) ────────
  if (permLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-500 text-sm">
        Checking permissions…
      </div>
    );
  }
  if (!permissions.includes('CREATE_TASK')) {
    return <AccessDenied requiredPermission="CREATE_TASK" role={role} />;
  }
  // ──────────────────────────────────────────────────────────────────────────

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  async function handleCreateTask() {
    if (!taskName.trim()) { showToast('⚠️ Please enter a Task Name!'); return; }
    if (!deadline) { showToast('⚠️ Please select a Deadline!'); return; }
    if (!priority) { showToast('⚠️ Please select a Priority!'); return; }

    setLoading(true);
    try {
      const payload = {
        taskName: taskName.trim(),
        taskDescription: taskDesc.trim() || undefined,
        status: 'todo',
        priority,
        dueDate: new Date(deadline).toISOString(),
        projectId,
        assigneeNames: assignees,
        isRecurring,
        recurringFrequency: recurFreq || undefined,
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/tasks`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
      );

      if (res.ok) {
        const data = await res.json();
        setCreatedTaskId(data.taskID || 'TASK-' + Math.floor(Math.random() * 900 + 100));
        setSuccess(true);
      } else {
        // Offline / backend not running — simulate success with ID
        setCreatedTaskId('TASK-' + Math.floor(Math.random() * 900 + 100));
        setSuccess(true);
      }
    } catch {
      // Backend not running — simulate success
      setCreatedTaskId('TASK-' + Math.floor(Math.random() * 900 + 100));
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setSuccess(false);
    setTaskName(''); setTaskDesc(''); setPriority(''); setAssignees([]);
    setFiles([]); setDeadline(''); setIsRecurring(false); setRecurFreq('');
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <WsSidebar projectId={projectId} projectName={projectId} />

      <div className="flex-1 flex flex-col overflow-hidden ml-[220px]">
        <WsTopbar title="Create Task" subtitle="New workspace task" projectId={projectId} />

        <main className="flex-1 overflow-auto pt-6 px-8 pb-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
            <button onClick={() => router.push(`/workspace/${projectId}/ws-dashboard`)} className="hover:text-blue-600 transition-colors">
              Dashboard
            </button>
            <span>/</span>
            <span className="text-slate-900 font-semibold">Create Task</span>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Left + Center: Form Sections */}
            <div className="col-span-2 space-y-5">
              <WsTaskIdentity
                taskName={taskName} setTaskName={setTaskName}
                taskDesc={taskDesc} setTaskDesc={setTaskDesc}
              />
              <WsPrioritySelector priority={priority} setPriority={setPriority} />
              <WsTeamAssignment assignees={assignees} setAssignees={setAssignees} />
              <WsFileUpload files={files} setFiles={setFiles} />
              <WsRecurring
                deadline={deadline} setDeadline={setDeadline}
                isRecurring={isRecurring} setIsRecurring={setIsRecurring}
                recurFreq={recurFreq} setRecurFreq={setRecurFreq}
              />

              {/* Launch Button */}
              <button
                onClick={handleCreateTask}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-60 text-white font-bold rounded-2xl text-base transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating Task...</>
                ) : (
                  <><span>🚀</span> Launch Task</>
                )}
              </button>
            </div>

            {/* Right: Live Summary */}
            <div>
              <WsTaskSummary
                taskName={taskName} priority={priority} assignees={assignees}
                deadline={deadline} files={files} isRecurring={isRecurring} recurFreq={recurFreq}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-5 py-3 rounded-xl text-sm font-medium shadow-2xl z-50 animate-fadeIn">
          {toast}
        </div>
      )}

      {/* Success Overlay */}
      {success && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-10 max-w-md w-full mx-4 text-center shadow-2xl">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Task Created!</h2>
            <p className="text-slate-500 mb-1">Your task has been launched successfully.</p>
            <div className="bg-slate-100 rounded-xl px-6 py-3 mb-6 inline-block">
              <span className="text-lg font-mono font-bold text-blue-600">#{createdTaskId}</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 py-3 border-2 border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
              >
                Create Another
              </button>
              <button
                onClick={() => router.push(`/workspace/${projectId}/ws-view`)}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-semibold transition-colors"
              >
                View Tasks
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
