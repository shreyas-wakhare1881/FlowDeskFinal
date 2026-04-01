'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { issuesService } from './issues.service';
import type { IssueTree, Issue, IssueDetail } from '@/types/issue';

interface IssuesContextValue {
  /** Nested tree — root items can be any type (EPIC or orphan STORY/TASK/BUG) */
  issuesTree: IssueTree[];
  /** Only EPIC root issues (for parent dropdowns in CreateIssueModal) */
  epics: IssueTree[];
  /** Flat list of ALL issues for Kanban, Table, My Issues etc. */
  flatIssues: Issue[];
  /** All issues fetched flat (via /issues endpoint) — includes orphans fully */
  allIssues: Issue[];
  loading: boolean;
  error: string | null;
  /** Currently selected issue for the detail modal (null = modal closed) */
  selectedIssue: IssueDetail | null;
  /** Open detail modal for a specific issue */
  fetchIssueDetail: (id: string, projectId: string) => Promise<void>;
  /** Close detail modal */
  clearSelectedIssue: () => void;
  /** Re-fetch from API (call after create/update/delete) */
  refresh: () => void;
}

const IssuesContext = createContext<IssuesContextValue | null>(null);

/**
 * Recursively flatten a tree into a simple flat array.
 * Works for any root type (not just EPIC) since tree nodes now carry generic children.
 */
function flattenTree(tree: IssueTree[]): Issue[] {
  const result: Issue[] = [];

  function walk(node: IssueTree) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { children, ...flat } = node as IssueTree & { children: IssueTree[] };
    result.push(flat as Issue);
    if (Array.isArray(children)) {
      children.forEach(walk);
    }
  }

  tree.forEach(walk);
  return result;
}

export function IssuesProvider({
  projectId,
  children,
}: {
  projectId: string;
  children: ReactNode;
}) {
  const [issuesTree, setIssuesTree] = useState<IssueTree[]>([]);
  const [allIssues, setAllIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<IssueDetail | null>(null);

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      // Fetch both tree (for Backlog hierarchy) and flat list (for Kanban/Table) in parallel
      const [tree, flat] = await Promise.all([
        issuesService.getTree(projectId),
        issuesService.getAll(projectId),
      ]);
      setIssuesTree(tree);
      setAllIssues(flat);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load issues');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchIssueDetail = useCallback(async (id: string, pid: string) => {
    try {
      const detail = await issuesService.getOne(id, pid);
      setSelectedIssue(detail);
    } catch (err) {
      console.error('Failed to load issue detail', err);
    }
  }, []);

  const clearSelectedIssue = useCallback(() => setSelectedIssue(null), []);

  // Derived values
  const flatIssues = flattenTree(issuesTree);
  const epics = issuesTree.filter((i) => i.type === 'EPIC');

  return (
    <IssuesContext.Provider
      value={{
        issuesTree,
        epics,
        flatIssues,
        allIssues,
        loading,
        error,
        selectedIssue,
        fetchIssueDetail,
        clearSelectedIssue,
        refresh: fetchData,
      }}
    >
      {children}
    </IssuesContext.Provider>
  );
}

export function useIssues(): IssuesContextValue {
  const ctx = useContext(IssuesContext);
  if (!ctx) {
    throw new Error('useIssues must be used inside <IssuesProvider>');
  }
  return ctx;
}
