'use client';

import { useState, useEffect, useRef } from 'react';

interface ProjectIdentityProps {
  projectName: string;
  projectDescription: string;
  deadline: string;
  onProjectNameChange: (value: string) => void;
  onProjectDescriptionChange: (value: string) => void;
  onDeadlineChange: (value: string) => void;
}

export default function ProjectIdentity({
  projectName,
  projectDescription,
  deadline,
  onProjectNameChange,
  onProjectDescriptionChange,
  onDeadlineChange,
}: ProjectIdentityProps) {
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [nameCount, setNameCount] = useState(0);
  const [descCount, setDescCount] = useState(0);

  useEffect(() => {
    setNameCount(projectName.length);
  }, [projectName]);

  useEffect(() => {
    setDescCount(projectDescription.length);
  }, [projectDescription]);

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300">
      {/* Project Name */}
      <div className="mb-2">
        <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          Project Name <span className="text-red-500">*</span>
        </label>
        <div className="relative group">
          <input
            type="text"
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value.slice(0, 100))}
            placeholder="e.g., Design landing page wireframes"
            maxLength={100}
            className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all group-hover:border-slate-300"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-white border border-slate-200 rounded-md text-xs text-slate-500 font-semibold">
            {nameCount}/100
          </span>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
          Description
        </label>
        <div className="relative group">
          <textarea
            value={projectDescription}
            onChange={(e) => onProjectDescriptionChange(e.target.value.slice(0, 500))}
            placeholder="What exactly needs to be done? Any context or references..."
            maxLength={500}
            rows={5}
            className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none group-hover:border-slate-300"
          />
          <span className="absolute right-3 bottom-3 px-2 py-1 bg-white border border-slate-200 rounded-md text-xs text-slate-500 font-semibold">
            {descCount}/500
          </span>
        </div>
        {projectDescription && (
          <div className="mt-2 flex items-center gap-2 text-xs text-emerald-600">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Great! Adding details helps your team understand the project better.</span>
          </div>
        )}
      </div>

      {/* Deadline */}
      <div className="mt-2">
        <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Deadline
        </label>
        <div
          className="relative w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 hover:border-slate-300 transition-all flex items-center justify-between cursor-pointer select-none"
          onClick={() => dateInputRef.current?.showPicker()}
        >
          <span className={deadline ? 'text-slate-900' : 'text-slate-400'}>
            {deadline
              ? new Date(deadline + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
              : 'dd/mm/yyyy'}
          </span>
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="3" ry="3" strokeWidth={1.8} />
            <line x1="3" y1="9" x2="21" y2="9" strokeWidth={1.8} />
            <line x1="8" y1="2" x2="8" y2="6" strokeWidth={2} strokeLinecap="round" />
            <line x1="16" y1="2" x2="16" y2="6" strokeWidth={2} strokeLinecap="round" />
            <circle cx="8" cy="14" r="1" fill="currentColor" />
            <circle cx="12" cy="14" r="1" fill="currentColor" />
            <circle cx="16" cy="14" r="1" fill="currentColor" />
            <circle cx="8" cy="18" r="1" fill="currentColor" />
            <circle cx="12" cy="18" r="1" fill="currentColor" />
          </svg>
          <input
            ref={dateInputRef}
            type="date"
            value={deadline}
            onChange={(e) => onDeadlineChange(e.target.value)}
            style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0, bottom: 0, left: 0 }}
          />
        </div>
      </div>
    </div>
  );
}
