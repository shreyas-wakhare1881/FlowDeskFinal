import { SetMetadata } from '@nestjs/common';

/** Metadata key used by PermissionGuard to read the required permission. */
export const PERMISSION_KEY = 'required_permission';

/**
 * Route decorator — marks a handler with the RBAC permission it requires.
 *
 * Usage:
 *   @RequirePermission('DELETE_PROJECT')
 *   async remove(...)
 *
 * The PermissionGuard will read this string and resolve it against
 * the current user's project-scoped role.
 */
export const RequirePermission = (permission: string) =>
  SetMetadata(PERMISSION_KEY, permission);
