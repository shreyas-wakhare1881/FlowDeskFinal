'use client';

/**
 * PermissionGate — Conditionally renders children based on RBAC permissions/roles.
 *
 * Usage (hide completely):
 *   <PermissionGate permission="CREATE_TASK">
 *     <button>Create Task</button>
 *   </PermissionGate>
 *
 * Usage (disable with tooltip):
 *   <PermissionGate permission="MANAGE_TEAM" tooltip="Only Managers can assign members">
 *     <button>Assign Member</button>
 *   </PermissionGate>
 *
 * Usage (custom fallback):
 *   <PermissionGate roles={['Manager', 'SuperAdmin']} fallback={<p>No access</p>}>
 *     <AdminPanel />
 *   </PermissionGate>
 *
 * Usage (show while loading):
 *   <PermissionGate permission="CREATE_TASK" showWhileLoading>
 *     ...
 *   </PermissionGate>
 */

import React from 'react';
import { useRbac } from '@/lib/RbacContext';
import type { AppRole, Permission } from '@/lib/permissions';

interface PermissionGateProps {
  /** Required permission. If omitted, only role check is applied. */
  permission?: Permission;
  /** Required roles (OR logic — any one of them grants access). */
  roles?: AppRole[];
  /** What to render when access is denied. Defaults to null (hidden). */
  fallback?: React.ReactNode;
  /**
   * If true, wraps denied children in a disabled+tooltip container
   * instead of hiding them completely.
   */
  tooltip?: string;
  /**
   * If true, renders children while RBAC is still loading.
   * Use for elements that should be visible during initial load.
   * Default: false (hidden while loading).
   */
  showWhileLoading?: boolean;
  children: React.ReactNode;
}

export default function PermissionGate({
  permission,
  roles,
  fallback = null,
  tooltip,
  showWhileLoading = false,
  children,
}: PermissionGateProps) {
  const { hasPermission, hasRole, loading, noProjects } = useRbac();

  if (loading) {
    return showWhileLoading ? <>{children}</> : (
      <div className="flex justify-center items-center p-4">
        <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  // New user with no projects — allow bootstrap actions (create project)
  // Everything else is hidden until they have a role
  const isNewUser = noProjects;

  // Evaluate permission
  const permOk = !permission || (isNewUser ? false : hasPermission(permission));

  // Evaluate role
  const roleOk = !roles || (isNewUser ? false : hasRole(...roles));

  // If a permission is specified but no role, check only permission (and vice versa)
  const allowed = (() => {
    // Both specified → must satisfy both
    if (permission && roles) return permOk && roleOk;
    // Only permission specified
    if (permission) return permOk;
    // Only roles specified
    if (roles) return roleOk;
    // Neither — always allow
    return true;
  })();

  if (!allowed) {
    if (tooltip) {
      // Disable + tooltip instead of hiding
      return (
        <span
          className="inline-flex cursor-not-allowed opacity-40"
          title={tooltip}
          aria-disabled="true"
        >
          {children}
        </span>
      );
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
