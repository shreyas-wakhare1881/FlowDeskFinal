'use client';

import { use } from 'react';
import { IssueModalProvider } from '@/lib/IssueModalContext';
import { IssuesProvider } from '@/lib/IssuesContext';
import CreateIssueModal from '@/components/workspace/CreateIssueModal';
import IssueDetailModal from '@/components/workspace/IssueDetailModal';

interface Props {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}

export default function ProjectWorkspaceLayout({ children, params }: Props) {
  const { projectId } = use(params);

  return (
    <IssueModalProvider>
      <IssuesProvider projectId={projectId}>
        {children}
        {/* Modals rendered once here — above all workspace sub-pages */}
        <CreateIssueModal projectId={projectId} />
        <IssueDetailModal projectId={projectId} />
      </IssuesProvider>
    </IssueModalProvider>
  );
}
