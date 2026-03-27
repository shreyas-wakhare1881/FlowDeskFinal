'use client';

import { useState } from 'react';

interface LiveSummaryProps {
  projectName: string;
  priority: string;
  selectedMembers: string[];
  deadline: string;
  fileCount: number;
  clientName: string;
  clientEmail: string;
  clientTimezone: string;
  isInternalProject: boolean;
}

const priorityLabels: Record<string, string> = {
  critical: '🔴 Critical',
  medium: '🟡 Steady',
  low: '🔵 Low',
};

export default function LiveSummary({
  projectName,
  priority,
  selectedMembers,
  deadline,
  fileCount,
  clientName,
  clientEmail,
  clientTimezone,
  isInternalProject,
}: LiveSummaryProps) {
  const [expanded, setExpanded] = useState(false);

  const formatDeadline = (date: string) => {
    if (!date) return '—';
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border-2 border-blue-200 p-6 shadow-xl">
      <h4 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <span>📋</span> Project Summary
      </h4>

      {/* Collapsible content with blur hint */}
      <div className="relative">
        <div
          className={`space-y-4 overflow-hidden transition-all duration-500 ${
            expanded ? 'max-h-[1000px]' : 'max-h-[220px]'
          }`}
        >
          <div>
            <div className="text-xs font-semibold text-slate-500 mb-1.5">Project Name</div>
            <div className="text-sm font-bold text-slate-900 break-words">
              {projectName || '—'}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-500 mb-1.5">Priority</div>
            <div className="text-sm font-bold text-slate-900">
              {priority ? priorityLabels[priority] : '—'}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-500 mb-1.5">Assignees</div>
            <div className="text-sm font-bold text-slate-900 break-words">
              {selectedMembers.length > 0 ? selectedMembers.join(', ') : '—'}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-500 mb-1.5">Deadline</div>
            <div className="text-sm font-bold text-slate-900">{formatDeadline(deadline)}</div>
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-500 mb-1.5">Attachments</div>
            <div className="text-sm font-bold text-slate-900">
              {fileCount > 0 ? `${fileCount} file(s)` : 'None'}
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <div className="text-xs font-semibold text-purple-600 mb-3 uppercase tracking-wide">Client Info</div>
            <div className="space-y-3">
              <div>
                <div className="text-xs font-semibold text-slate-500 mb-1.5">Client Name</div>
                <div className="text-sm font-bold text-slate-900 break-words">
                  {clientName || '—'}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-500 mb-1.5">Email</div>
                <div className="text-sm font-bold text-slate-900 break-words">
                  {clientEmail || '—'}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-500 mb-1.5">Timezone</div>
                <div className="text-sm font-bold text-slate-900">
                  {clientTimezone ? clientTimezone.split('/')[1].replace('_', ' ') : '—'}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-500 mb-1.5">Project Type</div>
                <div className="text-sm font-bold text-slate-900">
                  {isInternalProject ? '🏢 Internal' : '🌐 External'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Blur fade hint — only when collapsed */}
        {!expanded && (
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-blue-50 via-blue-50/80 to-transparent pointer-events-none rounded-b-xl" />
        )}
      </div>

      {/* Show More / Show Less button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors py-1.5"
      >
        {expanded ? (
          <>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
            </svg>
            Show Less
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
            Show More
          </>
        )}
      </button>
    </div>
  );
}
