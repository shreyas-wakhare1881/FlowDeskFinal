'use client';

interface ViewSwitcherProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const views = [
  { id: 'table', label: '📋 Table', icon: '📋' },
  { id: 'progress', label: '⭕ Progress', icon: '⭕' },
];

export default function ViewSwitcher({ activeView, onViewChange }: ViewSwitcherProps) {
  return (
    <div className="flex gap-3">
      {views.map((view) => (
        <button
          key={view.id}
          onClick={() => onViewChange(view.id)}
          className={`
            px-5 py-2.5 rounded-xl font-bold text-sm transition-all
            ${
              activeView === view.id
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105'
                : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-blue-300 hover:shadow-md'
            }
          `}
        >
          {view.label}
        </button>
      ))}
    </div>
  );
}
