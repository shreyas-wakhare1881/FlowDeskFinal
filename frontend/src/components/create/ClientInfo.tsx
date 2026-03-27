'use client';

import { useState, useRef, useEffect } from 'react';

interface ClientInfoProps {
  clientName: string;
  clientEmail: string;
  clientContact: string;
  clientTimezone: string;
  isInternalProject: boolean;
  onClientNameChange: (name: string) => void;
  onClientEmailChange: (email: string) => void;
  onClientContactChange: (contact: string) => void;
  onClientTimezoneChange: (timezone: string) => void;
  onIsInternalProjectChange: (isInternal: boolean) => void;
}

const timezones = [
  { value: 'Asia/Kolkata', label: 'IST (GMT+5:30) - India' },
  { value: 'America/New_York', label: 'EST (GMT-5) - New York' },
  { value: 'America/Los_Angeles', label: 'PST (GMT-8) - Los Angeles' },
  { value: 'Europe/London', label: 'GMT (GMT+0) - London' },
  { value: 'Europe/Paris', label: 'CET (GMT+1) - Paris' },
  { value: 'Asia/Dubai', label: 'GST (GMT+4) - Dubai' },
  { value: 'Asia/Singapore', label: 'SGT (GMT+8) - Singapore' },
  { value: 'Australia/Sydney', label: 'AEDT (GMT+11) - Sydney' },
  { value: 'Asia/Tokyo', label: 'JST (GMT+9) - Tokyo' },
  { value: 'Asia/Shanghai', label: 'CST (GMT+8) - Shanghai' },
];

export default function ClientInfo({
  clientName,
  clientEmail,
  clientContact,
  clientTimezone,
  isInternalProject,
  onClientNameChange,
  onClientEmailChange,
  onClientContactChange,
  onClientTimezoneChange,
  onIsInternalProjectChange,
}: ClientInfoProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter timezones based on search
  const filteredTimezones = timezones.filter(
    (tz) => tz.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
        setSearchTerm('');
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleTimezoneSelect = (value: string) => {
    onClientTimezoneChange(value);
    setDropdownOpen(false);
    setSearchTerm('');
  };

  const getTimezoneLabel = () => {
    if (!clientTimezone) return 'Select Timezone';
    const tz = timezones.find((t) => t.value === clientTimezone);
    return tz ? tz.label : clientTimezone;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-200">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center text-xl">
          👤
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-slate-900">Client Information</h3>
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        {/* Client Name */}
        <div>
          <label htmlFor="clientName" className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Client Name
          </label>
          <input
            id="clientName"
            type="text"
            value={clientName}
            onChange={(e) => onClientNameChange(e.target.value)}
            placeholder="e.g., John Doe, Acme Corp"
            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm hover:border-slate-300"
          />
        </div>

        {/* Client Email */}
        <div>
          <label htmlFor="clientEmail" className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Email Address
          </label>
          <input
            id="clientEmail"
            type="email"
            value={clientEmail}
            onChange={(e) => onClientEmailChange(e.target.value)}
            placeholder="client@company.com"
            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm hover:border-slate-300"
          />
        </div>

        {/* Client Contact */}
        <div>
          <label htmlFor="clientContact" className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Contact Number
          </label>
          <input
            id="clientContact"
            type="tel"
            value={clientContact}
            onChange={(e) => onClientContactChange(e.target.value)}
            placeholder="+1 (555) 123-4567"
            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm hover:border-slate-300"
          />
        </div>

        {/* Timezone Dropdown */}
        <div>
          <label htmlFor="clientTimezone" className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Timezone
          </label>
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm text-left flex items-center justify-between hover:border-slate-300 group"
            >
              <span className={clientTimezone ? 'text-slate-900' : 'text-slate-400'}>
                {getTimezoneLabel()}
              </span>
              <svg
                className={`w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-all duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute z-50 w-full mt-2 bg-white border-2 border-slate-200 rounded-xl shadow-xl max-h-64 overflow-hidden">
                {/* Search Input */}
                <div className="p-3 border-b border-slate-200 sticky top-0 bg-white">
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search timezone..."
                      className="w-full pl-10 pr-3 py-2 text-sm border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Timezone List */}
                <div className="overflow-y-auto max-h-52">
                  {filteredTimezones.length > 0 ? (
                    filteredTimezones.map((tz) => (
                      <button
                        key={tz.value}
                        type="button"
                        onClick={() => handleTimezoneSelect(tz.value)}
                        className={`w-full px-4 py-2.5 text-left text-sm hover:bg-blue-50 transition-colors ${
                          clientTimezone === tz.value ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-slate-700'
                        }`}
                      >
                        {tz.label}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-sm text-slate-500 text-center">
                      <svg className="w-12 h-12 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      No timezones found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Internal/External Project Radio */}
        <div className="pt-3 mt-2 border-t border-slate-200">
          <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Project Type
          </p>
          <div className="grid grid-cols-2 gap-3">
            {/* Internal */}
            <label className={`relative flex flex-col items-center gap-2 px-4 py-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 group overflow-hidden
              ${isInternalProject
                ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-md shadow-blue-100'
                : 'border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/40 hover:shadow-sm'}`}>
              <input
                type="radio"
                name="projectType"
                checked={isInternalProject}
                onChange={() => onIsInternalProjectChange(true)}
                className="sr-only"
              />
              {/* Selected checkmark */}
              {isInternalProject && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow-sm">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              <span className="text-2xl">🏢</span>
              <div className="text-center">
                <span className={`text-sm font-bold block ${isInternalProject ? 'text-blue-700' : 'text-slate-700'}`}>Internal</span>
                <span className="text-xs text-slate-500 leading-tight">In-house team only</span>
              </div>
            </label>

            {/* External */}
            <label className={`relative flex flex-col items-center gap-2 px-4 py-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 group overflow-hidden
              ${!isInternalProject
                ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-md shadow-emerald-100'
                : 'border-slate-200 bg-slate-50 hover:border-emerald-300 hover:bg-emerald-50/40 hover:shadow-sm'}`}>
              <input
                type="radio"
                name="projectType"
                checked={!isInternalProject}
                onChange={() => onIsInternalProjectChange(false)}
                className="sr-only"
              />
              {/* Selected checkmark */}
              {!isInternalProject && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              <span className="text-2xl">🌐</span>
              <div className="text-center">
                <span className={`text-sm font-bold block ${!isInternalProject ? 'text-emerald-700' : 'text-slate-700'}`}>External</span>
                <span className="text-xs text-slate-500 leading-tight">Client-facing project</span>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
