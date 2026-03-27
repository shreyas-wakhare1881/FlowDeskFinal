'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/shared/Sidebar';
import Topbar from '@/components/shared/Topbar';
import ViewSwitcher from '@/components/view/ViewSwitcher';
import KanbanBoard from '@/components/view/KanbanBoard';
import TableView from '@/components/view/TableView';
import ProgressView from '@/components/view/ProgressView';

export default function ViewPage() {
  const router = useRouter();
  const [activeView, setActiveView] = useState('kanban');

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden md:ml-[200px]">
        <Topbar 
          title="" 
          breadcrumb={
            <div className="text-sm text-slate-500">
              <button onClick={() => router.push('/dashboard')} className="hover:text-blue-600 transition-colors bg-transparent border-0 p-0 cursor-pointer text-sm text-slate-500">
                Dashboard
              </button>
              <span className="mx-2">/</span>
              <span>Projects Views</span>
            </div>
          }
        />
        
        <main className="flex-1 overflow-auto p-8">
          {/* Page Header */}
          <div className="mb-6">
            {/* Title and View Switcher */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-4xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                  <span>👁️</span> Projects Views
                </h2>
                <p className="text-slate-600 ml-[52px] pl-2">
                  Switch between Kanban, Table, and Progress
                </p>
              </div>
              <ViewSwitcher activeView={activeView} onViewChange={setActiveView} />
            </div>
          </div>

          {/* View Panels */}
          <div className="animate-fadeIn">
            {activeView === 'kanban' && <KanbanBoard />}
            {activeView === 'table' && <TableView />}
            {activeView === 'progress' && <ProgressView />}
          </div>
        </main>
      </div>
    </div>
  );
}
