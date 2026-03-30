# RBAC Migration Plan
### FlowDesk PM Tool — From Global Roles to Jira-Level Project-Based RBAC

---

## 0. Executive Summary

| Item | Detail |
|---|---|
| **Current State** | Single `role` string on `users` table (`admin` / `member`). No per-project access control. |
| **Target State** | `User → Role (per Project) → Permission → Module` — fully dynamic, project-scoped |
| **Risk Level** | Medium — existing login + CRUD APIs stay intact; changes are additive |
| **Strategy** | Incremental — add new tables alongside existing ones, migrate in phases |

---

## 1. Current System Analysis

### How Authentication Works Today

```
User logs in → auth.service.ts validates email+password
  → JWT signed with { sub, email, name, role }
  → Frontend stores token in localStorage
  → All API calls send Bearer token
  → JwtAuthGuard validates token on every protected route
```

### Current Problems

| Problem | Where | Impact |
|---|---|---|
| `role` is a plain string on `users` table (`admin`/`member`) | `schema.prisma` → `User` model | Global role — no project context at all |
| JWT payload includes `role` from users table | `jwt.strategy.ts` | Role resolved at login, never rechecked per-project |
| `JwtAuthGuard` only checks "is user logged in?" | `jwt-auth.guard.ts` | No permission check — any logged-in user can call any API |
| No `user_roles`, `permissions`, or `modules` tables | `schema.prisma` | RBAC infrastructure doesn't exist yet |
| `TeamMember.role` is a plain string (`'Owner'`, `'Team Member'`) | `schema.prisma` → `TeamMember` | Not linked to any role/permission system |
| Projects controller has no `@Request()` injection | `projects.controller.ts` | No way to know WHO is calling — can't filter by user |
| All project/task APIs return ALL records to ANY user | `projects.service.ts`, `tasks.service.ts` | No ownership or permission filtering |
| Frontend stores `user.role` in localStorage | `auth.service.ts` | UI makes assumptions based on a single global role string |

### Current Flow Diagram

```
[Login Page]
    │
    ▼
POST /auth/login
    │
    ▼
JWT Token { sub, email, name, role: 'admin'/'member' }
    │
    ▼
Stored in localStorage
    │
    ├──► GET /projects  (returns ALL projects - no filter)
    ├──► GET /tasks     (returns ALL tasks - no filter)
    └──► DELETE /projects/:id  (ANY logged-in user can delete)
```

---

## 2. Gap Analysis

| Area | Current | Required | Gap |
|---|---|---|---|
| **DB: User roles** | `role` string on `users` table | `user_roles` table with `project_id` | No project-scoped role assignment table |
| **DB: Permissions** | None | `permissions` table (action + module) | Missing entirely |
| **DB: Modules** | None | `modules` reference table | Missing entirely |
| **DB: Role definitions** | Hardcoded strings (`admin`, `member`) | `roles` table | No structured role definitions |
| **DB: Projects** | Exists — good foundation | Add `created_by FK → users.id` | Missing ownership column |
| **DB: TeamMember.role** | Plain string (`'Owner'`) | Should reference `roles` table | Disconnected from RBAC |
| **Backend: Auth guard** | Only checks JWT validity | Must also check project-level permission | Guard is too basic |
| **Backend: Permission guard** | Doesn't exist | `@Permission('CREATE_TASK')` decorator + guard | Needs to be built |
| **Backend: Request context** | `userId` not injected into services | Services need `userId` + `projectId` to resolve permissions | Controllers don't pass user context |
| **Backend: APIs** | No `/my-projects`, no `/projects/:id/permissions` | Both needed for project-scoped UX | New endpoints required |
| **Backend: JWT payload** | Includes `role` (global string) | Should NOT include role — resolve dynamically at request time | JWT payload needs cleanup |
| **Frontend: Auth user** | Stores `role` string in localStorage | Should store no role — use permissions API | Frontend assumes global role |
| **Frontend: UI rendering** | Likely uses `user.role === 'admin'` checks | Must use `permissions.includes('CREATE_TASK')` | Permission-based rendering not in place |
| **Frontend: Project context** | `ProjectsContext` loads ALL projects | Should load only projects user is a member of | No ownership filter |

---

## 3. Database Changes

### New Tables to Add

#### 3.1 `roles` table
Defines the role templates.

```
id          UUID PK
name        VARCHAR UNIQUE   -- 'SuperAdmin', 'Manager', 'Developer', 'Client'
description TEXT
created_at  TIMESTAMP
updated_at  TIMESTAMP
```

**Seed data at migration time:** SuperAdmin, Manager, Developer, Client

---

#### 3.2 `modules` table
Defines the functional areas that can be permission-controlled.

```
id          UUID PK
name        VARCHAR UNIQUE   -- 'TASKS', 'PROJECTS', 'TEAMS', 'REPORTS', 'COMMENTS'
description TEXT
created_at  TIMESTAMP
```

**Seed data at migration time:** TASKS, PROJECTS, TEAMS, REPORTS, COMMENTS, USERS

---

#### 3.3 `permissions` table
Each row = one allowed action on one module.

```
id          UUID PK
name        VARCHAR UNIQUE   -- 'CREATE_TASK', 'VIEW_PROJECT', etc.
action      ENUM             -- CREATE, READ, UPDATE, DELETE, MANAGE
module_id   UUID FK → modules.id
description TEXT
created_at  TIMESTAMP
```

**Seed data:** 20–25 standard permissions (see Section 6 of RBAC schema doc)

---

#### 3.4 `role_permissions` table
Links role → permission (global mapping, not project-scoped).

```
role_id        UUID FK → roles.id       (composite PK)
permission_id  UUID FK → permissions.id (composite PK)
granted_at     TIMESTAMP
granted_by     UUID FK → users.id NULLABLE
```

**Seed data:** Map each predefined role to its permissions

---

#### 3.5 `user_roles` table (THE CORE TABLE)
Links user → role → project.

```
user_id      UUID FK → users.id     (composite PK with role_id + project_id)
role_id      UUID FK → roles.id
project_id   UUID FK → projects.id
assigned_at  TIMESTAMP
assigned_by  UUID FK → users.id NULLABLE
```

> This is the table that makes RBAC project-scoped. One user, one project, one role.

---

### Existing Table Changes

#### 3.6 `users` table — Add `created_by` awareness
- `role` column on `users` table can stay for now (backward compat) but should be deprecated
- Plan to remove `role` from `users` in a later phase after full migration

#### 3.7 `projects` table — Add ownership
```sql
-- Add column:
created_by   UUID FK → users.id
```
This is needed so the system knows who created a project and can auto-assign them as Manager.

---

### Migration Safety Rules

- All new tables are **additive** — existing tables are NOT dropped or modified structurally (except adding `created_by` to `projects`)
- Existing `users.role` column is kept during migration → removed only after RBAC guard is live
- Existing data can be migrated: all current users get `admin` → SuperAdmin role mapping in `user_roles` for all existing projects

---

## 4. Backend Changes

### 4.1 What Stays the Same
- All existing CRUD routes (`/projects`, `/tasks`, `/teams`) — structure unchanged
- `JwtAuthGuard` — stays, still used as first layer
- `AuthService.login()` / `register()` — core logic unchanged

---

### 4.2 JWT Payload Change

**Current:**
```ts
{ sub, email, name, role: 'admin' }   // role baked into token
```

**Target:**
```ts
{ sub, email, name }   // NO role in JWT — role resolved dynamically per request
```

> Role is now a DB lookup, not a token claim. This is the correct approach.

---

### 4.3 New API Endpoints Needed

| Endpoint | Method | Purpose |
|---|---|---|
| `/projects/my` | GET | Return only projects where the user has a role in `user_roles` |
| `/projects/:id/permissions` | GET | Return permission list for current user in this project |
| `/projects/:id/members` | GET | Return members + their roles for a project |
| `/projects/:id/members` | POST | Add a user to project with a role (Manager only) |
| `/projects/:id/members/:userId` | DELETE | Remove user from project |
| `/auth/me` | GET | Return current user profile (no role — role is project-specific) |

---

### 4.4 New Permission Guard

A new `PermissionGuard` needs to be built alongside `JwtAuthGuard`:

```
Request comes in
  → JwtAuthGuard validates token, sets req.user
  → PermissionGuard reads @RequirePermission('CREATE_TASK') decorator
  → Extracts projectId from route params or request body
  → Queries: user_roles WHERE user_id = req.user.userId AND project_id = projectId
  → Gets role → queries role_permissions → checks if permission is in list
  → Allow or throw 403 Forbidden
```

**Guard logic (pseudocode):**
```
function canActivate(context):
  user = request.user              // from JwtAuthGuard
  projectId = params.id or body.projectId
  requiredPermission = reflector.get('permission', handler)

  role = db.user_roles.findOne({ user_id: user.userId, project_id: projectId })
  if (!role) → throw 403

  permissions = db.role_permissions.findMany({ role_id: role.role_id })
  if (!permissions.includes(requiredPermission)) → throw 403

  return true
```

---

### 4.5 Controller Changes (Summary)

All controllers need:
1. `@Request() req` injected to get `req.user.userId`
2. `projectId` passed to service methods
3. `@UseGuards(JwtAuthGuard, PermissionGuard)` on sensitive operations

Example pattern:
```
@Delete(':id')
@UseGuards(JwtAuthGuard, PermissionGuard)
@RequirePermission('DELETE_PROJECT')
async remove(@Param('id') id: string, @Request() req) {
  return this.projectsService.remove(id, req.user.userId);
}
```

---

### 4.6 Service Changes (Summary)

Services that need `userId`:
- `ProjectsService.findAll()` → filter by `user_roles.user_id = userId`
- `ProjectsService.create()` → set `created_by = userId`, auto-insert into `user_roles` as Manager
- `TasksService` → tasks are already scoped by `projectId`, so less change here

---

## 5. Frontend Changes

### 5.1 What Stays the Same
- Login page — no change
- Routing structure — no change
- All UI components — structure unchanged (only permission checks added)

---

### 5.2 Auth User Shape Change

**Current `AuthUser`:**
```ts
{ id, email, name, role: string }  // role is global
```

**Target `AuthUser`:**
```ts
{ id, email, name }  // role removed — no longer in token
```

Remove `role` from `localStorage` auth_user. The UI should never know the global role.

---

### 5.3 New: `usePermissions(projectId)` Hook

A hook that:
1. Calls `GET /projects/:id/permissions`
2. Returns an array like `['CREATE_TASK', 'UPDATE_TASK', 'VIEW_PROJECT']`
3. Caches it per project (re-fetches on project switch)

Usage pattern across the UI:
```ts
const { permissions } = usePermissions(projectId);

if (permissions.includes('CREATE_TASK')) {
  // show Create Task button
}

if (permissions.includes('DELETE_PROJECT')) {
  // show Delete Project button
}
```

---

### 5.4 Dashboard Change

**Current:** `GET /projects` fetches ALL projects regardless of user

**Target:** `GET /projects/my` fetches only projects where user has a role

Change in `ProjectsContext`:
- Replace `projectsService.findAll()` call with `projectsService.findMyProjects()`

---

### 5.5 Sidebar / Navigation Change

**Current:** Sidebar tabs may check `user.role === 'admin'` to show/hide items

**Target:** Sidebar tabs use permissions, not role strings

Example:
```ts
// OLD (remove this)
{user.role === 'admin' && <AdminLink />}

// NEW
{permissions.includes('MANAGE_USERS') && <AdminLink />}
```

---

### 5.6 No Project Selection Screen Needed

The user does NOT need to pick a role or project manually. The flow is:

```
User logs in → Dashboard loads user's projects (GET /projects/my)
  → User clicks into a project
  → App calls GET /projects/:id/permissions
  → Permission context is set for that project
  → UI renders buttons/actions based on permission list
```

---

## 6. Migration Plan (Phased)

### Phase 1 — Database (No Breaking Changes)

| Step | Action | Risk |
|---|---|---|
| 1.1 | Create `roles` table + seed 4 roles | Zero — new table |
| 1.2 | Create `modules` table + seed 6 modules | Zero — new table |
| 1.3 | Create `permissions` table + seed ~25 permissions | Zero — new table |
| 1.4 | Create `role_permissions` table + seed mappings | Zero — new table |
| 1.5 | Create `user_roles` table | Zero — new table |
| 1.6 | Add `created_by` to `projects` table (nullable for now) | Low — nullable column |
| 1.7 | Backfill existing data: assign all existing users as SuperAdmin for all existing projects in `user_roles` | Low — data insert only |

> **Checkpoint:** All existing APIs still work. Nothing is broken. New tables are empty except seed data.

---

### Phase 2 — Backend (Additive Changes First)

| Step | Action | Risk |
|---|---|---|
| 2.1 | Build `PermissionGuard` and `@RequirePermission()` decorator | Zero — not applied yet |
| 2.2 | Add `GET /projects/my` endpoint | Zero — new route |
| 2.3 | Add `GET /projects/:id/permissions` endpoint | Zero — new route |
| 2.4 | Add `POST /projects/:id/members` endpoint | Zero — new route |
| 2.5 | Update `ProjectsService.create()` to set `created_by` and insert into `user_roles` | Low — additive logic |
| 2.6 | Apply `PermissionGuard` to DELETE and sensitive routes only (not GET yet) | Medium — test thoroughly |
| 2.7 | Update JWT payload: remove `role` from token | Medium — requires frontend update in Phase 3 simultaneously |
| 2.8 | Apply `PermissionGuard` to all remaining routes | Medium — full enforcement |

> **Checkpoint:** RBAC is enforced on backend. Existing GET routes still work. New APIs available.

---

### Phase 3 — Frontend (After Phase 2 is stable)

| Step | Action | Risk |
|---|---|---|
| 3.1 | Remove `role` from `AuthUser` interface + localStorage | Low — if Phase 2.7 is done |
| 3.2 | Build `usePermissions(projectId)` hook | Zero — new hook |
| 3.3 | Replace `projectsService.findAll()` with `findMyProjects()` in `ProjectsContext` | Low |
| 3.4 | Add permission checks to Kanban/task creation UI | Low — additive `if` blocks |
| 3.5 | Add permission checks to project delete/edit buttons | Low — hide, not remove |
| 3.6 | Remove any remaining `user.role === 'admin'` checks | Low — cleanup |

> **Checkpoint:** Full end-to-end RBAC working. UI renders based on permissions. No hardcoded role checks.

---

## 7. Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Existing users lose access after Phase 2.8 (guard on all routes) | High | High | Backfill `user_roles` before enabling guard (Step 1.7) |
| JWT token change breaks frontend mid-migration | Medium | Medium | Deploy Phase 2.7 + Phase 3.1 together in same release |
| `created_by` on projects is null for old data | Medium | Low | Make column nullable; backfill with a known admin user ID |
| `GET /projects` still returns all projects after Phase 2 | Low | Medium | Deploy Phase 3.3 (findMyProjects) before Phase 2.8 |
| Permission seed data mismatch with guards | Medium | High | Test permission names match exactly between DB seeds and guard decorators |
| Performance: permission check on every request | Low | Low | Cache `(userId, projectId) → permissions[]` in memory or Redis |

---

### Edge Cases to Handle

- **SuperAdmin** — should bypass `project_id` check and have global access
- **Project creator** — must be auto-assigned Manager role at project creation time (Step 2.5)
- **User removed from project** — `user_roles` row deleted, immediately loses access (no JWT invalidation needed since permission is checked live from DB)
- **User with no role in a project** — calls `GET /projects/:id` should return 403, not 404

---

## 8. Final Implementation Checklist

### Phase 1 — Database
- [ ] `roles` table created + seeded (SuperAdmin, Manager, Developer, Client)
- [ ] `modules` table created + seeded (TASKS, PROJECTS, TEAMS, REPORTS, COMMENTS, USERS)
- [ ] `permissions` table created + seeded (~25 permissions)
- [ ] `role_permissions` mapping table created + seeded
- [ ] `user_roles` table created (with `project_id`)
- [ ] `projects.created_by` column added (nullable FK)
- [ ] Existing users backfilled into `user_roles` as SuperAdmin for existing projects

### Phase 2 — Backend
- [ ] `PermissionGuard` built
- [ ] `@RequirePermission()` decorator built
- [ ] `GET /projects/my` endpoint live
- [ ] `GET /projects/:id/permissions` endpoint live
- [ ] `POST /projects/:id/members` endpoint live
- [ ] `ProjectsService.create()` sets `created_by` + inserts into `user_roles`
- [ ] Guard applied to DELETE / sensitive mutation routes
- [ ] JWT `role` field removed from payload
- [ ] Guard applied to all routes
- [ ] SuperAdmin bypass logic implemented

### Phase 3 — Frontend
- [ ] `AuthUser.role` removed from interface + localStorage
- [ ] `usePermissions(projectId)` hook built
- [ ] `ProjectsContext` calls `GET /projects/my` instead of `GET /projects`
- [ ] Kanban task creation guarded by `CREATE_TASK` permission
- [ ] Project delete/edit buttons guarded by `DELETE_PROJECT` / `UPDATE_PROJECT`
- [ ] All `user.role === 'admin'` checks replaced with permission checks
- [ ] End-to-end RBAC tested across all 4 roles

---

## 9. Dependencies Between Phases

```
Phase 1 (DB)
    │
    ▼
Phase 2.1–2.6 (New APIs + Guard built, not fully enforced)
    │
    ▼
Phase 3.1–3.3 (Frontend updated to not rely on role string)
    │
    ▼
Phase 2.7 (JWT role removed — safe now since frontend is ready)
    │
    ▼
Phase 2.8 (Guard enforced on all routes)
    │
    ▼
Phase 3.4–3.6 (UI permission checks + cleanup)
    │
    ▼
✅ Full RBAC Live
```

---

*Document Version: 1.0 | FlowDesk PM Tool RBAC Migration | March 2026*
