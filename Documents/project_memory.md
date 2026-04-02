# 🧠 FlowDesk — PROJECT_MEMORY

> **Last Updated:** April 2, 2026  
> **Source of Truth** — Update after every change, decision, or feature addition.

---

## 📌 PROJECT OVERVIEW

| Field | Value |
|---|---|
| **Project Name** | FlowDesk |
| **Type** | Production-Grade Project Management Tool |
| **Root Path** | `c:\Users\ShreyasWakhare\Desktop\FlowDesk\pm-tool-` |
| **Backend** | NestJS (not FastAPI — actual stack differs from original spec) |
| **Frontend** | Next.js 16 + React 19 + TailwindCSS v4 |
| **Database** | PostgreSQL via Prisma ORM |
| **Auth** | JWT (via `@nestjs/jwt` + `passport-jwt`) |
| **API Base** | `http://localhost:3001/api/v1` |
| **Frontend URL** | `http://localhost:3000` |

> [!IMPORTANT]
> The original prompt says FastAPI + Redux, but **actual implementation is NestJS + Next.js App Router (no Redux — uses React Context API)**.

---

## 🧱 TECH STACK (ACTUAL)

### Backend (`/backend`)
- **Framework:** NestJS v11
- **ORM:** Prisma v7 (PostgreSQL adapter: `@prisma/adapter-pg`)
- **Auth:** JWT + bcryptjs + passport-jwt
- **Validation:** class-validator + class-transformer
- **API Versioning:** URI (`/api/v1/...`)
- **CORS:** Restricted to `FRONTEND_URL` env var (default: `http://localhost:3000`)

### Frontend (`/frontend`)
- **Framework:** Next.js 16 (App Router)
- **UI:** React 19 + TailwindCSS v4 + lucide-react icons
- **Fuzzy Search:** fuse.js
- **State:** React Context API (NOT Redux)
- **API Client:** Custom fetch wrapper in `/lib/api.ts`

---

## 🗄️ DATABASE SCHEMA (Prisma — PostgreSQL)

### Core Tables
| Table | Description |
|---|---|
| `users` | Auth — id (UUID), email (unique), name, passwordHash |
| `projects` | Project entity — projectID (PRJ-001), status, priority, category, teamID, assignee info, visibility, projectKey |
| `project_tags` | Many tags per project |
| `team_leads` | One team lead per project |
| `team_members` | Multiple members per project (legacy denormalized) |
| `metrics` | Completion %, tasks count — one per project |
| `tasks` | Task-level tracking per project |
| `task_assignees` | Many assignees per task |
| `teams` | First-class team entities per project |
| `team_participants` | Members of a team |

### RBAC Tables (Phase 1 — March 30, 2026)
| Table | Description |
|---|---|
| `roles` | SuperAdmin, Manager, Developer, Client |
| `modules` | TASKS, PROJECTS, TEAMS, REPORTS, COMMENTS, USERS |
| `permissions` | e.g. CREATE_TASK, VIEW_PROJECT — one action per module |
| `role_permissions` | Global mapping: Role ↔ Permission (composite PK: roleId+permissionId) |
| `user_roles` | **Core RBAC table** — User ↔ Role ↔ Project (composite PK: userId+roleId+projectId, unique: userId+projectId = one role per user per project) |

### Issues Tables (Phase 2 — April 2026)
| Table | Description |
|---|---|
| `issues` | Jira-style hierarchy: EPIC → STORY → TASK → BUG. issueKey scoped per project (PRJ-001-1). Self-relation via parentId. |
| `issue_links` | BLOCKS, DEPENDS_ON, RELATES_TO, DUPLICATES — source+target issue relations |

### Enums
```
IssueType:     EPIC | STORY | TASK | BUG
IssueLinkType: BLOCKS | DEPENDS_ON | RELATES_TO | DUPLICATES
IssueStatus:   TODO | IN_PROGRESS | DONE
IssuePriority: LOW | MEDIUM | HIGH
Visibility:    PRIVATE | PUBLIC
```

### Key Schema Design Decisions
- `user_roles` unique constraint `[userId, projectId]` → **one role per user per project**
- `project.projectID` auto-generated as `PRJ-001`, `PRJ-002`, etc.
- `issue.issueKey` scoped as `{projectID}-{n+1}` (e.g., `PRJ-001-3`)
- Strings used for `status`/`priority` in Project/Task (not enums) for backward compat
- `project.createdById` nullable for backward compat with seeded pre-RBAC data

---

## 🔐 RBAC SYSTEM

### Roles & Hierarchy
```
SuperAdmin  (priority 4) — Global scope, bypasses ALL permission checks
Manager     (priority 3) — Full control within their assigned project(s)
Developer   (priority 2) — Task-level access, can create/update issues
Client      (priority 1) — View only — read tasks, view projects, read issues
```

### Permission Matrix
| Permission | SuperAdmin | Manager | Developer | Client |
|---|---|---|---|---|
| CREATE_TASK | ✅ | ✅ | ❌ | ❌ |
| READ_TASK | ✅ | ✅ | ✅ | ✅ |
| UPDATE_TASK | ✅ | ✅ | ✅ | ❌ |
| DELETE_TASK | ✅ | ✅ | ❌ | ❌ |
| MANAGE_TASKS | ✅ | ✅ | ❌ | ❌ |
| VIEW_PROJECT | ✅ | ✅ | ✅ | ✅ |
| UPDATE_PROJECT | ✅ | ✅ | ❌ | ❌ |
| MANAGE_PROJECTS | ✅ | ✅ | ❌ | ❌ |
| VIEW_TEAM | ✅ | ✅ | ✅ | ❌ |
| MANAGE_TEAM | ✅ | ✅ | ❌ | ❌ |
| VIEW_REPORTS | ✅ | ✅ | ❌ | ❌ |
| ADD_COMMENT | ✅ | ✅ | ✅ | ❌ |
| VIEW_COMMENT | ✅ | ✅ | ✅ | ✅ |
| DELETE_COMMENT | ✅ | ✅ | ❌ | ❌ |
| MANAGE_USERS | ✅ | ❌ | ❌ | ❌ |
| CREATE_ISSUE | ✅ | ✅ | ✅ | ❌ |
| READ_ISSUE | ✅ | ✅ | ✅ | ✅ |
| UPDATE_ISSUE | ✅ | ✅ | ✅ | ❌ |
| DELETE_ISSUE | ✅ | ✅ | ❌ | ❌ |
| MANAGE_ISSUES | ✅ | ✅ | ❌ | ❌ |

### RBAC Architecture
- **Backend Guard:** `PermissionGuard` — reads `@RequirePermission()` decorator, resolves projectId from `params.projectId` → `body.projectId` → `query.projectId` → `params.id`
- **SuperAdmin bypass:** if `userRole.role.name === 'SuperAdmin'` → always `true`
- **MANAGE_* override:** having `MANAGE_ISSUES` automatically satisfies `CREATE_ISSUE`, `READ_ISSUE`, etc.
- **Frontend:** `RbacContext` fetches permissions for all user projects, picks `getHighestRole()` for global UI gates. Project-scoped checks use `usePermissions(projectId)` hook.

### Key RBAC Rules
1. Manager = same permissions as SuperAdmin but **project-scoped**
2. SuperAdmin can assign the SuperAdmin role (no one else can)
3. One role per user per project (enforced at DB level)
4. On project creation, creator is auto-assigned `Manager` role (SuperAdmin stays SuperAdmin)
5. `GET /projects` (all projects) is SuperAdmin-only — regular users use `GET /projects/my`

---

## 🔌 API STRUCTURE

### Base URL: `http://localhost:3001/api/v1`

### Auth (`/auth`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register user → returns JWT + user |
| POST | `/auth/login` | Login → returns JWT + user |
| GET | `/auth/me` | Get current user (no role in response — use /projects/:id/permissions) |

### Projects (`/projects`)
| Method | Endpoint | Permission | Description |
|---|---|---|---|
| GET | `/projects/my` | JWT only | User's projects (RBAC-filtered) |
| POST | `/projects` | JWT only | Create project (auto-assigns creator as Manager) |
| GET | `/projects` | MANAGE_USERS | All projects (SuperAdmin only) |
| GET | `/projects/stats` | JWT | Project count stats |
| GET | `/projects/roles` | JWT | Assignable roles for member management |
| GET | `/projects/:id` | VIEW_PROJECT | Single project |
| GET | `/projects/project-id/:projectID` | JWT | Lookup by PRJ-001 code |
| PUT | `/projects/:id` | UPDATE_PROJECT | Update project |
| DELETE | `/projects/:id` | MANAGE_PROJECTS | Delete (SuperAdmin=any; Manager=own) |
| GET | `/projects/:id/permissions` | JWT | Current user's role+perms for project |
| GET | `/projects/:id/members` | VIEW_TEAM | List members |
| POST | `/projects/:id/members` | MANAGE_TEAM | Add member |
| PUT | `/projects/:id/members/:userId` | MANAGE_TEAM | Change member role |
| DELETE | `/projects/:id/members/:userId` | MANAGE_TEAM | Remove member |
| POST | `/projects/:id/assign-manager` | MANAGE_USERS | SuperAdmin assigns Manager |

### Issues (`/issues`)
| Method | Endpoint | Permission | Description |
|---|---|---|---|
| POST | `/issues` | CREATE_ISSUE | Create issue (type: EPIC/STORY/TASK/BUG) |
| GET | `/issues?projectId=&type=&assigneeId=&q=` | READ_ISSUE | List issues (filterable) |
| GET | `/issues/tree?projectId=` | READ_ISSUE | Nested tree (EPIC→STORY→TASK) |
| GET | `/issues/:id?projectId=` | READ_ISSUE | Issue details with links, parent, children |
| PATCH | `/issues/:id` | UPDATE_ISSUE | Update issue (projectId in body for guard) |
| DELETE | `/issues/:id?projectId=` | DELETE_ISSUE | Delete (no children allowed) |

### Issue Links (`/issue-links`)
- Jira-style linking between issues (BLOCKS, DEPENDS_ON, RELATES_TO, DUPLICATES)

### Tasks (`/tasks`), Teams (`/teams`), Users (`/users`)
- Standard CRUD with JWT protection

---

## 🖥️ FRONTEND STRUCTURE

### App Router Pages (`/src/app`)
```
(auth)/
  login/
  register/
(dashboard)/
  dashboard/       — Main dashboard
  create/          — Create project
  create-team/     — Create team
  members/         — Member management
  view/            — Project view
(workspace)/       — Workspace (issue board, tasks)
```

### State Management (React Context)
| Context | File | Purpose |
|---|---|---|
| ProjectsContext | `lib/ProjectsContext.tsx` | All projects state, CRUD operations |
| RbacContext | `lib/RbacContext.tsx` | Global effective role (highest across projects) |
| IssuesContext | `lib/IssuesContext.tsx` | Issues list state |
| IssueModalContext | `lib/IssueModalContext.tsx` | Issue detail modal open/close |
| SidebarContext | `lib/SidebarContext.tsx` | Sidebar collapse state |

### Service Layer (`/src/lib`)
| Service | Description |
|---|---|
| `api.ts` | Base fetch wrapper + `APIError`, `PermissionError` classes |
| `auth.service.ts` | Login, register, getMe — reads/writes `localStorage.access_token` |
| `projects.service.ts` | All project API calls including member management |
| `issues.service.ts` | Issue CRUD + tree + links |
| `tasks.service.ts` | Task CRUD |
| `teams.service.ts` | Team CRUD |
| `users.service.ts` | User listing |
| `permissions.ts` | ROLE_PERMISSIONS map, `hasPermission()`, `hasRole()`, `getHighestRole()` |

### UI Components (`/src/components`)
```
create/     — Create project/task forms
dashboard/  — Dashboard widgets
search/     — Search UI
shared/     — Shared components (buttons, modals, badges)
view/       — Project/issue view components
workspace/  — Kanban/sprint board components
```

### Features (`/src/features`)
```
catch-up-feed/   — Activity feed
create-team/     — Team creation
team-pulse/      — Team overview
```

---

## ⚙️ CONFIGURATION

### Backend `.env` Variables
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — Secret for JWT signing
- `PORT` — Backend port (default: 3001)
- `FRONTEND_URL` — CORS origin (default: http://localhost:3000)

### Frontend `.env.local`
- `NEXT_PUBLIC_API_URL` — API base URL (default: http://localhost:3001/api/v1)

---

## 🏗️ ARCHITECTURE DECISIONS (Log)

| Date | Decision | Rationale |
|---|---|---|
| March 17, 2026 | Schema v1 — matched localStorage structure | Migration from frontend-only state |
| March 30, 2026 | Phase 1 RBAC — additive tables (roles, modules, permissions, role_permissions, user_roles) | Non-breaking migration |
| March 30, 2026 | `user_roles` unique constraint `[userId, projectId]` | Enforce one role per user per project at DB level |
| April 2026 | Issues module (Phase 2) — EPIC→STORY→TASK→BUG hierarchy | Jira-style issue tracking |
| April 2026 | `IssueLink` model — BLOCKS/DEPENDS_ON/RELATES_TO/DUPLICATES | Relational issue linking |
| April 2026 | `PermissionGuard` projectId resolution order: params.projectId → body → query → params.id | MUST be last for params.id to avoid task routes misidentifying task UUID as projectId |
| April 2026 | SuperAdmin gets `MANAGE_USERS` permission only in seed; but `getMyPermissions()` returns ALL permissions when role=SuperAdmin | Frontend can check `CREATE_TASK` etc. without DB storing every perm for SuperAdmin |
| April 2026 | `RbacContext` uses highest-privilege role across all user projects | User is effectively Manager everywhere if Manager in one project |
| April 2026 | Frontend is Next.js (not React+Redux) | Actual implementation diverges from original spec |

---

## 🔄 PENDING TASKS / GAPS

| # | Item | Status |
|---|---|---|
| 1 | Comments system — table not yet in schema | 🔴 Missing |
| 2 | Sprint model — sprints + sprint-task assignment | 🔴 Missing |
| 3 | Kanban board state (column positions, order) | 🔴 Missing |
| 4 | Dashboard per-user widgets/metrics | 🟡 Partial |
| 5 | Redis caching layer | 🔴 Not implemented |
| 6 | User profile + avatar management | 🟡 Partial (seed data only) |
| 7 | Notification system | 🔴 Missing |
| 8 | Activity/audit log | 🔴 Missing |
| 9 | File attachments on issues/tasks | 🔴 Missing |
| 10 | Issue comments | 🔴 Missing |

---

## 📦 PROJECT_MEMORY OBJECT (Structured)

```json
{
  "features": [
    "JWT Auth (register/login/me)",
    "Project CRUD with auto-ID (PRJ-001)",
    "RBAC: 4 roles, project-scoped, permission-based guards",
    "Member management per project",
    "Task CRUD",
    "Team management",
    "Issue tracking: EPIC→STORY→TASK→BUG hierarchy",
    "Issue links: BLOCKS, DEPENDS_ON, RELATES_TO, DUPLICATES",
    "Hierarchical issue tree API",
    "Permission-gated frontend via RbacContext"
  ],
  "database_schema": {
    "users": "id, email, name, passwordHash",
    "projects": "id, projectID, projectName, status, priority, createdById, projectKey, visibility",
    "user_roles": "userId+roleId+projectId (composite PK), unique[userId,projectId]",
    "roles": "id, name (SuperAdmin|Manager|Developer|Client)",
    "permissions": "id, name, action, moduleId",
    "role_permissions": "roleId+permissionId (composite PK)",
    "issues": "id, issueKey, type, title, status, priority, parentId, projectId, assigneeId",
    "issue_links": "id, linkType, sourceIssueId, targetIssueId",
    "tasks": "id, taskID, taskName, status, priority, projectId",
    "teams": "id, teamID, teamName, projectId"
  },
  "api_structure": {
    "auth": ["/auth/register", "/auth/login", "/auth/me"],
    "projects": "/projects + /projects/my + /projects/:id/members + /projects/:id/permissions",
    "issues": "/issues + /issues/tree + /issues/:id",
    "tasks": "/tasks",
    "teams": "/teams",
    "users": "/users"
  },
  "rbac_rules": {
    "SuperAdmin": "bypasses all checks, global scope, can assign SuperAdmin role",
    "Manager": "all permissions but project-scoped, auto-assigned on project creation",
    "Developer": "READ_TASK, UPDATE_TASK, VIEW_PROJECT, VIEW_TEAM, ADD_COMMENT, VIEW_COMMENT, CREATE_ISSUE, READ_ISSUE, UPDATE_ISSUE",
    "Client": "READ_TASK, VIEW_PROJECT, VIEW_COMMENT, READ_ISSUE"
  },
  "ui_components": {
    "framework": "Next.js 16 App Router",
    "state": "React Context (ProjectsContext, RbacContext, IssuesContext, SidebarContext)",
    "styling": "TailwindCSS v4",
    "icons": "lucide-react",
    "search": "fuse.js"
  },
  "decisions": [
    "NestJS not FastAPI — existing code uses NestJS v11",
    "No Redux — uses React Context API",
    "One role per user per project enforced at DB level",
    "SuperAdmin bypasses all permission checks server-side",
    "PermissionGuard reads projectId in fixed priority order"
  ],
  "pending_tasks": [
    "Comments system",
    "Sprint model",
    "Kanban board column state",
    "Redis caching",
    "Issue comments",
    "Notifications",
    "Activity log"
  ]
}
```
