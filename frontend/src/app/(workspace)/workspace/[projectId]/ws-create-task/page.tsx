'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import WsSidebar from '@/components/workspace/WsSidebar';
import WsTopbar from '@/components/workspace/WsTopbar';
import { useIssueModal } from '@/lib/IssueModalContext';
import { usePermissions } from '@/lib/hooks/usePermissions';
import AccessDenied from '@/components/shared/AccessDenied';

export default function WsCreateTaskPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { openCreateIssue } = useIssueModal();
  const { permissions, role, loading: permLoading } = usePermissions(projectId);

  // Auto-open the Create Issue modal when this page is navigated to
  useEffect(() => {
    if (!permLoading && (permissions.includes('CREATE_ISSUE') || permissions.includes('MANAGE_ISSUES'))) {
      openCreateIssue('TASK');
    }
  }, [permLoading, permissions, openCreateIssue]);

  if (permLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-500 text-sm">
        Checking permissions...
      </div>
    );
  }

  if (!permissions.includes('CREATE_ISSUE') && !permissions.includes('MANAGE_ISSUES')) {
    return <AccessDenied requiredPermission="CREATE_ISSUE" role={role} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <WsSidebar projectId={projectId} projectName={projectId} />
      <div className="flex-1 flex flex-col overflow-hidden ml-[220px]">
        <WsTopbar title="Create Issue" subtitle="Jira-style issue creation" projectId={projectId} />
        <main className="flex-1 overflow-auto flex flex-col items-center justify-center gap-6 px-8">
          {/* Skeleton while modal opens */}
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-3xl animate-pulse">
              ✏️
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Opening Create Issue...</h2>
              <p className="text-sm text-slate-500">
                The issue creation dialog should appear automatically.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => openCreateIssue('TASK')}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Open Modal
              </button>
              <button
                onClick={() => router.push(`/workspace/${projectId}/ws-view?tab=backlog`)}
                className="px-5 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-semibold rounded-xl transition-colors"
              >
                Go to Ladder
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

