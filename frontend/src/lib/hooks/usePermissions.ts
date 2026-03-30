'use client';

import { useState, useEffect } from 'react';
import { projectsService, ProjectPermissions } from '../projects.service';

/**
 * usePermissions — fetches the current user's role + permission list for a project.
 *
 * Usage:
 *   const { permissions, role, loading } = usePermissions(projectId);
 *   if (!permissions.includes('CREATE_TASK')) return <AccessDenied />;
 */
export function usePermissions(projectId: string | null | undefined) {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    projectsService
      .getPermissions(projectId)
      .then((data: ProjectPermissions) => {
        console.log('[usePermissions] response:', data);
        setPermissions(data.permissions);
        setRole(data.role);
      })
      .catch((err) => {
        console.error('[usePermissions] FAILED for projectId:', projectId, err);
        setPermissions([]);
        setRole(null);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  return { permissions, role, loading };
}
