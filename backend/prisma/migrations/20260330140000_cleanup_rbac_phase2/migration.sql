-- =============================================================
-- Migration: cleanup_rbac_phase2
-- Date: March 30, 2026
-- Purpose: Remove orphan permissions, add Manager moderation,
--          and drop deprecated users.role column.
-- =============================================================

-- STEP 1: Remove orphan permissions
-- CREATE_PROJECT and DELETE_PROJECT are never assigned to any role.
-- SuperAdmin uses MANAGE_PROJECTS which covers all project operations.
-- These redundant rows add confusion and no security value.

DELETE FROM "role_permissions"
WHERE "permissionId" IN (
  SELECT id FROM "permissions" WHERE name IN ('CREATE_PROJECT', 'DELETE_PROJECT')
);

DELETE FROM "permissions"
WHERE name IN ('CREATE_PROJECT', 'DELETE_PROJECT');

-- STEP 2: Add DELETE_COMMENT to Manager role
-- Manager needs comment moderation authority within their project
-- (aligned with Jira project moderator behaviour).
-- ON CONFLICT DO NOTHING = safe to re-run.

INSERT INTO "role_permissions" ("roleId", "permissionId")
SELECT r.id, p.id
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r.name = 'Manager' AND p.name = 'DELETE_COMMENT'
ON CONFLICT DO NOTHING;

-- STEP 3: Drop deprecated users.role column
-- This column ('admin' / 'member') was a legacy auth field.
-- RBAC is now fully project-scoped via user_roles table.
-- No backend code reads this column after auth.service.ts + seed.ts cleanup.

ALTER TABLE "users" DROP COLUMN IF EXISTS "role";
