'use client';

type Priority = 'critical' | 'medium' | 'low' | '';

interface PrioritySelectorProps {
  priority: Priority;
  onPriorityChange: (priority: Priority) => void;
}

const priorities = [
  {
    id: 'critical',
    label: 'Critical',
    hint: '🔴 Critical — Urgent! A blinking red indicator will appear on the board. Notify team immediately.',
    dotColor: 'bg-red-500',
    selectedColor: 'bg-red-50 border-red-300 text-red-700',
  },
  {
    id: 'medium',
    label: 'Steady',
    hint: '🟡 Steady — Normal workflow. Task should be completed within its deadline.',
    dotColor: 'bg-amber-500',
    selectedColor: 'bg-amber-50 border-amber-300 text-amber-700',
  },
  {
    id: 'low',
    label: 'Low',
    hint: '🔵 Low — Minor task. Complete when time permits. No alerts triggered.',
    dotColor: 'bg-blue-500',
    selectedColor: 'bg-blue-50 border-blue-300 text-blue-700',
  },
];

export default function PrioritySelector({ priority, onPriorityChange }: PrioritySelectorProps) {
  const getHintText = () => {
    if (!priority) return 'Select a priority level to see what it means for your team.';
    const selectedPriority = priorities.find((p) => p.id === priority);
    return selectedPriority?.hint || '';
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 shadow-sm hover:shadow-xl hover:border-red-200 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
        <div className="w-12 h-12 bg-gradient-to-br from-red-50 to-red-100 rounded-xl flex items-center justify-center text-2xl shadow-md">
          🎯
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-900">Priority Level</h3>
          <p className="text-sm text-slate-500">Choose one</p>
        </div>
        {priority && (
          <div className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-lg border border-emerald-200 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Selected
          </div>
        )}
      </div>

      {/* Priority Pills */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {priorities.map((p) => (
          <button
            key={p.id}
            onClick={() => onPriorityChange(p.id as Priority)}
            className={`
              relative px-4 py-4 rounded-xl border-2 font-semibold text-sm transition-all overflow-hidden group
              ${
                priority === p.id
                  ? p.selectedColor + ' shadow-lg scale-105'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 hover:shadow-md hover:scale-102'
              }
            `}
          >
            <div className="flex flex-col items-center gap-2 relative z-10">
              <span className={`w-3 h-3 rounded-full ${p.dotColor} ${priority === p.id ? 'ring-4 ring-offset-2' : ''}`}></span>
              <span>{p.label}</span>
            </div>
            {priority === p.id && (
              <div className="absolute top-1 right-1">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Hint Box */}
      <div className="relative p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border-2 border-slate-200 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16"></div>
        <div className="relative z-10 flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <p className="text-xs text-slate-700 leading-relaxed font-medium">{getHintText()}</p>
        </div>
      </div>
    </div>
  );
}
