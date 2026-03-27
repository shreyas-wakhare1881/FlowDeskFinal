'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import WsSidebar from '@/components/workspace/WsSidebar';
import WsTopbar from '@/components/workspace/WsTopbar';

type InsightRange = '7d' | '30d' | 'custom';

// ─── Velocity Chart ───────────────────────────────────────────────────────────

function WsVelocityChart() {
  const [showTable, setShowTable] = useState(false);

  const weeks = [
    { week: 'Week 1', committed: 8, achieved: 7 },
    { week: 'Week 2', committed: 10, achieved: 10 },
    { week: 'Week 3', committed: 12, achieved: 9 },
    { week: 'Week 4', committed: 9, achieved: 11 },
    { week: 'Week 5', committed: 11, achieved: 10 },
    { week: 'Week 6', committed: 13, achieved: 12 },
  ];
  const maxVal = 15;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-bold text-slate-900">Velocity Chart</h3>
          <p className="text-xs text-slate-500">Commitment vs Achievement per sprint</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTable(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${!showTable ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Chart
          </button>
          <button
            onClick={() => setShowTable(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${showTable ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Table
          </button>
        </div>
      </div>

      {!showTable ? (
        <div>
          {/* Legend */}
          <div className="flex gap-4 mb-4">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-blue-500" /><span className="text-xs text-slate-600">Committed</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-green-500" /><span className="text-xs text-slate-600">Achieved</span></div>
          </div>
          {/* Bar Chart */}
          <div className="flex items-end gap-4 h-40">
            {weeks.map((w) => (
              <div key={w.week} className="flex-1 flex flex-col items-center gap-1">
                <div className="flex items-end gap-1 w-full h-32">
                  <div
                    className="flex-1 bg-blue-200 rounded-t-md transition-all duration-700"
                    style={{ height: `${(w.committed / maxVal) * 100}%` }}
                    title={`Committed: ${w.committed}`}
                  />
                  <div
                    className="flex-1 bg-green-400 rounded-t-md transition-all duration-700"
                    style={{ height: `${(w.achieved / maxVal) * 100}%` }}
                    title={`Achieved: ${w.achieved}`}
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-medium">{w.week}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              {['Sprint', 'Committed', 'Achieved', 'Velocity'].map((h) => (
                <th key={h} className="py-2 text-left text-xs text-slate-500 font-bold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((w) => (
              <tr key={w.week} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="py-2 text-xs font-semibold text-slate-900">{w.week}</td>
                <td className="py-2 text-xs text-blue-600 font-bold">{w.committed}</td>
                <td className="py-2 text-xs text-green-600 font-bold">{w.achieved}</td>
                <td className="py-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${w.achieved >= w.committed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {Math.round((w.achieved / w.committed) * 100)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* AI Summary */}
      <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-start gap-2">
        <span className="text-blue-500">🤖</span>
        <p className="text-xs text-blue-700 font-medium">
          Team achieved 91% of committed tasks across 6 sprints. Week 4 exceeded commitment by 2 tasks — excellent performance.
        </p>
      </div>
    </div>
  );
}

// ─── Member Performance ───────────────────────────────────────────────────────

function WsMemberPerformance() {
  const [showTable, setShowTable] = useState(false);

  const members = [
    { name: 'Rahul Kumar', avatar: 'RK', color: '#4361ee', completed: 12, reopened: 1, rate: 92 },
    { name: 'Sneha Patel', avatar: 'SP', color: '#06d6a0', completed: 9, reopened: 0, rate: 100 },
    { name: 'Vishal Tiwari', avatar: 'VT', color: '#3a86ff', completed: 15, reopened: 2, rate: 87 },
    { name: 'Arjun Mehta', avatar: 'AM', color: '#7209b7', completed: 7, reopened: 0, rate: 100 },
    { name: 'Priya Das', avatar: 'PD', color: '#f9a825', completed: 11, reopened: 1, rate: 91 },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-bold text-slate-900">Member Performance & Quality</h3>
          <p className="text-xs text-slate-500">Tasks completed vs reopened rate</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowTable(false)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${!showTable ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Chart</button>
          <button onClick={() => setShowTable(true)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${showTable ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Table</button>
        </div>
      </div>

      {!showTable ? (
        <div className="space-y-3">
          {members.map((m) => (
            <div key={m.name} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: m.color }}>
                {m.avatar}
              </div>
              <span className="text-xs font-semibold text-slate-800 w-28 flex-shrink-0">{m.name.split(' ')[0]}</span>
              <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${m.rate}%`, backgroundColor: m.color }} />
              </div>
              <span className="text-xs font-bold text-slate-600 w-10 text-right">{m.rate}%</span>
            </div>
          ))}
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              {['Member', 'Completed', 'Reopened', 'Quality Rate'].map((h) => (
                <th key={h} className="py-2 text-left text-xs text-slate-500 font-bold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.name} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: m.color }}>{m.avatar}</div>
                    <span className="text-xs font-semibold text-slate-900">{m.name}</span>
                  </div>
                </td>
                <td className="py-2 text-xs text-green-600 font-bold">{m.completed}</td>
                <td className="py-2 text-xs text-red-500 font-bold">{m.reopened}</td>
                <td className="py-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.rate >= 95 ? 'bg-green-100 text-green-700' : m.rate >= 85 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{m.rate}%</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─── Cycle Time Speedometer ───────────────────────────────────────────────────

function WsCycleTime() {
  const leadTime = 4.2; // days
  const cycleTime = 2.8; // days

  const speedometerAngle = (val: number, max: number) => {
    const pct = Math.min(val / max, 1);
    return -90 + pct * 180;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6">
      <h3 className="text-base font-bold text-slate-900 mb-1">Cycle Time Analysis</h3>
      <p className="text-xs text-slate-500 mb-5">Lead Time vs Cycle Time (days)</p>

      <div className="grid grid-cols-2 gap-6">
        {[
          { label: 'Lead Time', value: leadTime, max: 10, color: '#3b82f6', desc: 'Avg time from task created to done' },
          { label: 'Cycle Time', value: cycleTime, max: 10, color: '#10b981', desc: 'Avg time from in-progress to done' },
        ].map((item) => {
          const rotate = speedometerAngle(item.value, item.max);
          return (
            <div key={item.label} className="flex flex-col items-center">
              {/* Semi-circle speedometer using CSS */}
              <div className="relative w-32 h-20 overflow-hidden mb-2">
                <svg viewBox="0 0 200 120" className="w-full h-full">
                  {/* Background arc */}
                  <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#f1f5f9" strokeWidth="20" strokeLinecap="round" />
                  {/* Value arc */}
                  <path
                    d="M 20 100 A 80 80 0 0 1 180 100" fill="none"
                    stroke={item.color} strokeWidth="20" strokeLinecap="round"
                    strokeDasharray={`${(item.value / item.max) * 251} 251`}
                    style={{ transition: 'stroke-dasharray 1s ease' }}
                  />
                  {/* Needle */}
                  <line
                    x1="100" y1="100" x2="100" y2="30"
                    stroke="#1e293b" strokeWidth="3" strokeLinecap="round"
                    style={{ transformOrigin: '100px 100px', transform: `rotate(${rotate}deg)` }}
                  />
                  <circle cx="100" cy="100" r="5" fill="#1e293b" />
                </svg>
              </div>
              <div className="text-2xl font-bold" style={{ color: item.color }}>{item.value}d</div>
              <div className="text-sm font-bold text-slate-800 mt-0.5">{item.label}</div>
              <div className="text-[10px] text-slate-400 text-center mt-1">{item.desc}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 bg-green-50 border border-green-100 rounded-xl px-4 py-3 flex items-start gap-2">
        <span className="text-green-500">✅</span>
        <p className="text-xs text-green-700 font-medium">
          Cycle time of 2.8 days is within target range (≤3 days). Lead time trending down — team efficiency is improving.
        </p>
      </div>
    </div>
  );
}

// ─── Burn Chart ───────────────────────────────────────────────────────────────

function WsBurnChart() {
  const [chartType, setChartType] = useState<'burndown' | 'burnup'>('burndown');

  const days = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10'];
  const ideal = [20, 18, 16, 14, 12, 10, 8, 6, 4, 2];
  const actual = [20, 19, 17, 15, 14, 11, 7, 5, null, null]; // null = future
  const completed = [0, 1, 3, 5, 6, 9, 13, 15, null, null];
  const scope = [20, 20, 20, 21, 21, 21, 21, 21, 21, 21];

  const series = chartType === 'burndown'
    ? [
        { label: 'Ideal', data: ideal, color: '#94a3b8', dashed: true },
        { label: 'Actual', data: actual, color: '#3b82f6', dashed: false },
      ]
    : [
        { label: 'Scope', data: scope, color: '#94a3b8', dashed: true },
        { label: 'Completed', data: completed, color: '#10b981', dashed: false },
      ];

  const maxY = 25;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Sprint Burn Chart</h3>
          <p className="text-xs text-slate-500">Deadline prediction & sprint progress</p>
        </div>
        <div className="flex bg-slate-50 rounded-xl p-1 gap-1 border border-slate-200">
          <button onClick={() => setChartType('burndown')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${chartType === 'burndown' ? 'bg-blue-600 text-white' : 'text-slate-600'}`}>Burn-Down</button>
          <button onClick={() => setChartType('burnup')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${chartType === 'burnup' ? 'bg-blue-600 text-white' : 'text-slate-600'}`}>Burn-Up</button>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-44 mt-2">
        <svg viewBox="0 0 500 180" className="w-full h-full">
          {/* Y-axis gridlines */}
          {[0, 5, 10, 15, 20, 25].map((y) => (
            <g key={y}>
              <line x1="40" y1={160 - (y / maxY) * 140} x2="490" y2={160 - (y / maxY) * 140} stroke="#f1f5f9" strokeWidth="1" />
              <text x="32" y={163 - (y / maxY) * 140} fontSize="10" fill="#94a3b8" textAnchor="end">{y}</text>
            </g>
          ))}

          {/* X labels */}
          {days.map((d, i) => (
            <text key={d} x={50 + i * 49} y="175" fontSize="9" fill="#94a3b8" textAnchor="middle">{d}</text>
          ))}

          {/* Series lines */}
          {series.map((s) => {
            const validPoints = s.data.filter((v): v is number => v !== null);
            const points = validPoints.map((v, i) => `${50 + i * 49},${160 - (v / maxY) * 140}`).join(' ');
            return (
              <polyline
                key={s.label}
                points={points}
                fill="none"
                stroke={s.color}
                strokeWidth="2.5"
                strokeDasharray={s.dashed ? '6 3' : undefined}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}

          {/* Actual data points */}
          {series[1].data.map((v, i) => v !== null ? (
            <circle key={i} cx={50 + i * 49} cy={160 - (v / maxY) * 140} r="4" fill={series[1].color} />
          ) : null)}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-2">
        {series.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              {s.dashed ? (
                <><div className="w-3 h-0.5" style={{ backgroundColor: s.color }} /><div className="w-1 h-0.5" /><div className="w-3 h-0.5" style={{ backgroundColor: s.color }} /></>
              ) : (
                <div className="w-6 h-0.5" style={{ backgroundColor: s.color }} />
              )}
            </div>
            <span className="text-xs text-slate-500">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 bg-yellow-50 border border-yellow-100 rounded-xl px-4 py-3 flex items-start gap-2">
        <span>⚠️</span>
        <p className="text-xs text-yellow-700 font-medium">
          At current pace, sprint will complete by Day 9 (1 day late). Recommend reducing scope or increasing daily throughput.
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WsInsightsPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [range, setRange] = useState<InsightRange>('30d');

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <WsSidebar projectId={projectId} projectName={projectId} />

      <div className="flex-1 flex flex-col overflow-hidden ml-[220px]">
        <WsTopbar title="Insights & Analytics" subtitle="Performance metrics" projectId={projectId} />

        <main className="flex-1 overflow-auto pt-6 px-8 pb-8">
          {/* Filter Bar */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <span>📈</span> Project Analytics
            </h2>
            <div className="flex items-center gap-3">
              <div className="flex bg-white rounded-xl border border-slate-200 p-1 gap-1">
                {([['7d', 'Last 7 Days'], ['30d', 'Last 30 Days'], ['custom', 'Custom']] as [InsightRange, string][]).map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => setRange(id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${range === id ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:border-blue-300 transition-colors">
                <span>📥</span> Export PDF
              </button>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-2 gap-6">
            <WsVelocityChart />
            <WsMemberPerformance />
            <WsCycleTime />
            <WsBurnChart />
          </div>
        </main>
      </div>
    </div>
  );
}
