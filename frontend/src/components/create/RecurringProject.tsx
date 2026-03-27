'use client';

type RecurringFrequency = 'daily' | 'monday' | 'weekly' | 'biweekly' | 'monthly' | '';

interface RecurringProjectProps {
  isRecurring: boolean;
  frequency: RecurringFrequency;
  onRecurringChange: (isRecurring: boolean) => void;
  onFrequencyChange: (frequency: RecurringFrequency) => void;
}

const frequencies = [
  { id: 'daily', label: 'Daily' },
  { id: 'monday', label: 'Every Monday' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'biweekly', label: 'Bi-weekly' },
  { id: 'monthly', label: 'Monthly' },
];

export default function RecurringProject({
  isRecurring,
  frequency,
  onRecurringChange,
  onFrequencyChange,
}: RecurringProjectProps) {
  return (
    <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center text-2xl shadow-md">
          🔄
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-900">Project Recurring</h3>
          <p className="text-sm text-slate-500">Automation</p>
        </div>
        {isRecurring && (
          <div className="px-3 py-1 bg-purple-50 text-purple-600 text-xs font-bold rounded-lg border border-purple-200 flex items-center gap-1">
            <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Active
          </div>
        )}
      </div>

      {/* Toggle */}
      <div className="flex items-center justify-between p-5 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl mb-4 border-2 border-slate-200 hover:border-slate-300 transition-all group">
        <div className="flex-1">
          <p className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Set as Recurring Project
          </p>
          <p className="text-xs text-slate-600 leading-relaxed">
            System will auto-create this project on schedule
          </p>
        </div>
        <button
          onClick={() => {
            onRecurringChange(!isRecurring);
            if (isRecurring) onFrequencyChange('');
          }}
          className={`
            relative w-16 h-9 rounded-full transition-all shadow-inner
            ${isRecurring ? 'bg-gradient-to-r from-blue-600 to-blue-500' : 'bg-slate-300'}
          `}
        >
          <span
            className={`
              absolute top-1 w-7 h-7 bg-white rounded-full shadow-lg transition-transform flex items-center justify-center
              ${isRecurring ? 'translate-x-8' : 'translate-x-1'}
            `}
          >
            {isRecurring && (
              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </span>
        </button>
      </div>

      {/* Frequency Selection */}
      {isRecurring && (
        <div className="space-y-2 animate-slideIn">
          {frequencies.map((freq) => (
            <button
              key={freq.id}
              onClick={() => onFrequencyChange(freq.id as RecurringFrequency)}
              className={`
                relative w-full px-4 py-3.5 rounded-xl font-bold text-sm transition-all group overflow-hidden
                ${
                  frequency === freq.id
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg scale-105'
                    : 'bg-slate-50 text-slate-700 border-2 border-slate-200 hover:border-blue-300 hover:shadow-md hover:scale-102'
                }
              `}
            >
              {frequency === freq.id && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-20 animate-pulse"></div>
              )}
              <div className="relative z-10 flex items-center justify-center gap-2">
                {frequency === freq.id && (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                <span>{freq.label}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
