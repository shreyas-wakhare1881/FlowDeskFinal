# FlowDesk — Complete Database Documentation

**Database:** PostgreSQL  
**ORM:** Prisma  
**Last Updated:** March 30, 2026  
**Version:** Phase 2 (RBAC fully integrated)

---

## 1. System Overview

FlowDesk is a Jira-like Project Management Tool. The database is the single source of truth for:

- **User accounts** and authentication
- **Projects** and their metadata
- **Tasks** inside each project (Kanban board)
- **Teams** and member assignments per project
- **Project metrics** (progress, completion counters)
- **RBAC** — Role-Based Access Control, scoped per project

### High-Level Architecture

```
users
  └── user_roles  ──────────────────────────── (which project, which role)
        ├── roles  ───────────────────────────── role_permissions ── permissions ── modules
        └── projects
              ├── tasks ── task_assignees
              ├── teams ── team_participants
              ├── team_members  (denormalized display data)
              ├── team_leads    (denormalized display data)
              ├── metrics
              └── project_tags
```

### Module Boundaries

| Area | Tables |
|------|--------|
| Authentication | `users` |
| Project Management | `projects`, `project_tags`, `metrics`, `team_leads`, `team_members` |
| Task Management | `tasks`, `task_assignees` |
| Team Management | `teams`, `team_participants` |
| RBAC | `roles`, `modules`, `permissions`, `role_permissions`, `user_roles` |

---

## 2. Table List

### Core Tables
| # | Table | Purpose |
|---|-------|---------|
| 1 | `users` | All registered user accounts |
| 2 | `projects` | All projects in the system |
| 3 | `tasks` | All tasks, linked to a project |

### Project Support Tables
| # | Table | Purpose |
|---|-------|---------|
| 4 | `project_tags` | Tags/labels on a project |
| 5 | `team_leads` | Lead person for a project (1:1) |
| 6 | `team_members` | Display-level members listed on a project card |
| 7 | `metrics` | Aggregated task stats per project |
| 8 | `task_assignees` | Assignees for each task |

### Team Tables
| # | Table | Purpose |
|---|-------|---------|
| 9 | `teams` | Named teams created inside a project |
| 10 | `team_participants` | Members of a named team |

### RBAC Tables
| # | Table | Purpose |
|---|-------|---------|
| 11 | `roles` | Role definitions (SuperAdmin, Manager, Developer, Client) |
| 12 | `modules` | Functional areas of the app (TASKS, PROJECTS, TEAMS…) |
| 13 | `permissions` | Individual actions (CREATE_TASK, READ_TASK…) |
| 14 | `role_permissions` | Which permissions a role grants |
| 15 | `user_roles` | Which role a user holds in which project |

---

## 3. Each Table — Detailed

---

### `users`

**Purpose:** Stores every registered user account. Used for authentication and as a foreign key in nearly every other table.

#### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `uuid()` | Primary key |
| `email` | String | No | — | Unique login identifier |
| `name` | String | No | — | Display name |
| `passwordHash` | String | No | — | bcrypt hash of password |
| `role` | String | No | `'member'` | Legacy field (`'admin'`/`'member'`). **Deprecated** — RBAC uses `user_roles` |
| `createdAt` | DateTime | No | `now()` | Account creation timestamp |
| `updatedAt` | DateTime | No | auto | Last update timestamp |

#### Keys
- **PK:** `id`
- **Unique:** `email`
- **Index:** `email` (fast login lookup)

#### Relationships
- One user → many `user_roles` (one per project they belong to)
- One user → many `projects` (as creator via `createdById`)

#### Example Row
```
id:           "a1b2c3d4-..."
email:        "admin@flowdesk.com"
name:         "Shreyas Wakhare"
passwordHash: "$2b$10$..."
role:         "admin"
createdAt:    2026-03-17T10:00:00Z
```

---

### `projects`

**Purpose:** The central entity of the system. Every task, team, metric, and RBAC assignment ties back to a project.

#### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `uuid()` | Internal primary key (used for FK references) |
| `projectID` | String | No | — | Human-readable ID e.g. `PRJ-001` (unique, used in URLs) |
| `projectName` | String | No | — | Display name |
| `projectDescription` | String | Yes | — | Optional description |
| `status` | String | No | — | `'todo'` \| `'in-progress'` \| `'completed'` \| `'overdue'` |
| `statusLabel` | String | No | — | Human label e.g. `'In Progress'` |
| `priority` | String | No | — | `'critical'` \| `'medium'` \| `'low'` |
| `category` | String | No | — | `'Backend'`, `'Design'`, `'QA'`, etc. |
| `createdDate` | DateTime | No | `now()` | When the row was inserted |
| `assignedDate` | DateTime | No | — | When the project was officially assigned |
| `dueDate` | DateTime | Yes | — | Target completion date |
| `completedDate` | DateTime | Yes | — | Actual completion date (null if not done) |
| `teamID` | String | No | — | Denormalized team identifier string |
| `teamName` | String | No | — | Denormalized team name |
| `assigneeID` | String | No | — | Denormalized lead assignee ID |
| `assigneeName` | String | No | — | Denormalized lead assignee display name |
| `assigneeAvatar` | String | No | — | Initials avatar e.g. `'RK'` |
| `assigneeAvatarColor` | String | No | — | Hex color e.g. `'#4361ee'` |
| `isRecurring` | Boolean | No | `false` | Whether project recurs on a schedule |
| `recurringFrequency` | String | Yes | — | `'Daily'`, `'Weekly'` etc. if recurring |
| `createdById` | UUID | Yes | — | FK → `users.id` (who created the project) |
| `createdAt` | DateTime | No | `now()` | Record creation time |
| `updatedAt` | DateTime | No | auto | Last update time |

#### Keys
- **PK:** `id`
- **Unique:** `projectID`
- **FK:** `createdById` → `users.id` (SetNull on delete)
- **Indexes:** `status`, `priority`, `teamID`

#### Relationships
- One project → many `tasks`
- One project → many `team_members` (denormalized)
- One project → one `team_lead` (denormalized)
- One project → one `metrics`
- One project → many `project_tags`
- One project → many `teams`
- One project → many `user_roles` (RBAC memberships)

#### Example Row
```
id:           "f7e8d9c0-..."
projectID:    "PRJ-001"
projectName:  "Payment Gateway Integration"
status:       "in-progress"
priority:     "critical"
category:     "Backend"
teamName:     "Backend-Core-Team"
assigneeName: "Rahul Kumar"
dueDate:      2026-03-14T00:00:00Z
isRecurring:  false
createdById:  "a1b2c3d4-..."
```

---

### `project_tags`

**Purpose:** Stores labels/tags attached to a project. Separated from `projects` to allow multiple tags without array columns.

#### Columns

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `tag` | String | No | Tag text e.g. `'Backend'`, `'Phase-2'` |
| `projectId` | UUID | No | FK → `projects.id` |

#### Keys
- **PK:** `id`
- **FK:** `projectId` → `projects.id` (Cascade delete)

#### Relationships
- Many tags → one project

#### Example Row
```
id:        "t1t2t3-..."
tag:       "API"
projectId: "f7e8d9c0-..."
```

---

### `team_leads`

**Purpose:** Stores the designated lead person for a project. Separate table for clean 1:1 relation and rich display data (avatar, color).

#### Columns

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `leadId` | String | No | Logical user identifier e.g. `'USER-001'` |
| `name` | String | No | Display name |
| `avatar` | String | No | Initials e.g. `'RK'` |
| `avatarColor` | String | No | Hex color |
| `projectId` | UUID | No | FK → `projects.id` (Unique — one lead per project) |

#### Keys
- **PK:** `id`
- **Unique:** `projectId` (one lead per project)
- **FK:** `projectId` → `projects.id` (Cascade delete)

#### Example Row
```
leadId:    "USER-001"
name:      "Rahul Kumar"
avatar:    "RK"
avatarColor: "#4361ee"
projectId: "f7e8d9c0-..."
```

---

### `team_members`

**Purpose:** Denormalized list of people shown on a project card. This is display-layer data (not RBAC). Stores role labels like `'Owner'`, `'Team Member'`.

> **Note:** This is separate from `user_roles`. `team_members` is for the visual team roster; `user_roles` is for permission checks.

#### Columns

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `memberId` | String | No | Logical user ID e.g. `'USER-002'` |
| `name` | String | No | Display name |
| `avatar` | String | No | Initials |
| `avatarColor` | String | No | Hex color |
| `role` | String | No | Display role: `'Owner'` or `'Team Member'` |
| `status` | String | No | `'online'` \| `'offline'` |
| `projectId` | UUID | No | FK → `projects.id` |

#### Keys
- **PK:** `id`
- **FK:** `projectId` → `projects.id` (Cascade delete)

#### Example Row
```
memberId:   "USER-002"
name:       "Sneha Patel"
avatar:     "SP"
avatarColor: "#06d6a0"
role:       "Team Member"
status:     "online"
projectId:  "f7e8d9c0-..."
```

---

### `metrics`

**Purpose:** Aggregated task statistics for a project. Kept in a separate table to allow fast project card rendering without counting tasks each time.

#### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `uuid()` | Primary key |
| `completionPercentage` | Int | No | `0` | Overall completion % |
| `tasksTotal` | Int | No | `0` | Total number of tasks |
| `tasksCompleted` | Int | No | `0` | Tasks in `completed` status |
| `tasksInProgress` | Int | No | `0` | Tasks in `in-progress` status |
| `tasksOverdue` | Int | No | `0` | Tasks past due date |
| `projectId` | UUID | No | — | FK → `projects.id` (Unique) |

#### Keys
- **PK:** `id`
- **Unique:** `projectId` (one metrics row per project)
- **FK:** `projectId` → `projects.id` (Cascade delete)

#### Example Row
```
completionPercentage: 85
tasksTotal:           12
tasksCompleted:       10
tasksInProgress:      1
tasksOverdue:         1
projectId:            "f7e8d9c0-..."
```

---

### `tasks`

**Purpose:** Core unit of work inside a project. Represents one card on the Kanban board.

#### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `uuid()` | Internal primary key |
| `taskID` | String | No | — | Human ID e.g. `'TASK-101'` |
| `taskName` | String | No | — | Short title of the task |
| `taskDescription` | String | Yes | — | Detailed description |
| `status` | String | No | `'todo'` | `'todo'` \| `'in-progress'` \| `'completed'` \| `'overdue'` |
| `priority` | String | No | — | `'critical'` \| `'medium'` \| `'low'` |
| `isRecurring` | Boolean | No | `false` | Whether this task repeats |
| `recurringFrequency` | String | Yes | — | `'Daily'`, `'Weekly'` etc. |
| `createdAt` | DateTime | No | `now()` | When task was created |
| `dueDate` | DateTime | No | — | Required deadline |
| `completedDate` | DateTime | Yes | — | Set when status → `'completed'` |
| `projectId` | UUID | No | — | FK → `projects.id` |

#### Keys
- **PK:** `id`
- **Unique:** `taskID`
- **FK:** `projectId` → `projects.id` (Cascade delete)
- **Indexes:** `projectId`, `status`, `dueDate`

#### Relationships
- Many tasks → one project
- One task → many `task_assignees`

#### Example Row
```
taskID:      "TASK-101"
taskName:    "Design authentication flow diagrams"
status:      "in-progress"
priority:    "critical"
dueDate:     2026-03-18T00:00:00Z
projectId:   "f7e8d9c0-..."
```

---

### `task_assignees`

**Purpose:** People assigned to a specific task. One task can have multiple assignees. Stores display info (avatar, color) so the UI doesn't need a join to `users`.

#### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `uuid()` | Primary key |
| `name` | String | No | — | Assignee display name |
| `avatar` | String | No | `""` | Initials e.g. `'RK'` |
| `avatarColor` | String | No | `'#4361ee'` | Hex color |
| `taskId` | UUID | No | — | FK → `tasks.id` |

#### Keys
- **PK:** `id`
- **FK:** `taskId` → `tasks.id` (Cascade delete)

#### Example Row
```
name:        "Rahul Kumar"
avatar:      "RK"
avatarColor: "#4361ee"
taskId:      "aa11bb22-..."
```

---

### `teams`

**Purpose:** Named team entities that exist within a project (e.g. "Backend-Core-Team"). A project can have multiple named teams. Each team has its own member list via `team_participants`.

#### Columns

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `teamID` | String | No | Human ID e.g. `'BCT-001'` (unique) |
| `teamName` | String | No | Display name |
| `createdAt` | DateTime | No | Creation timestamp |
| `projectId` | UUID | No | FK → `projects.id` |

#### Keys
- **PK:** `id`
- **Unique:** `teamID`
- **FK:** `projectId` → `projects.id` (Cascade delete)

#### Relationships
- Many teams → one project
- One team → many `team_participants`

#### Example Row
```
teamID:    "BCT-001"
teamName:  "Backend-Core-Team"
projectId: "f7e8d9c0-..."
```

---

### `team_participants`

**Purpose:** Members of a named team. Like `task_assignees`, stores display data locally so the UI renders without extra joins.

#### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | — | Primary key |
| `name` | String | No | — | Display name |
| `avatar` | String | No | — | Initials |
| `color` | String | No | `'#4361ee'` | Hex color |
| `teamId` | UUID | No | — | FK → `teams.id` |

#### Keys
- **PK:** `id`
- **FK:** `teamId` → `teams.id` (Cascade delete)

#### Example Row
```
name:   "Vishal Tiwari"
avatar: "VT"
color:  "#3a86ff"
teamId: "cc33dd44-..."
```

---

### `roles`

**Purpose:** Defines the available roles in the system. Roles are templates — they have no authority on their own until assigned permissions via `role_permissions` and assigned to users via `user_roles`.

#### Columns

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `name` | String | No | Unique role name: `'SuperAdmin'`, `'Manager'`, `'Developer'`, `'Client'` |
| `description` | String | Yes | Human-readable purpose |
| `createdAt` | DateTime | No | Creation time |
| `updatedAt` | DateTime | No | Last update time |

#### Keys
- **PK:** `id`
- **Unique:** `name`

#### Seeded Roles

| Role | Purpose |
|------|---------|
| `SuperAdmin` | Full system access, bypasses all permission checks |
| `Manager` | Create/manage tasks and team within a project |
| `Developer` | Read and update tasks; view team |
| `Client` | Read-only access to tasks and project overview |

#### Example Row
```
name:        "Manager"
description: "Project and task management within a project"
```

---

### `modules`

**Purpose:** Defines the functional areas of the application that can be access-controlled. Every permission belongs to exactly one module.

#### Columns

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `name` | String | No | Unique module name |
| `description` | String | Yes | What this module controls |
| `createdAt` | DateTime | No | Creation time |

#### Keys
- **PK:** `id`
- **Unique:** `name`

#### Seeded Modules

| Module | Controls |
|--------|---------|
| `TASKS` | Task CRUD and status management |
| `PROJECTS` | Project settings and lifecycle |
| `TEAMS` | Team membership management |
| `REPORTS` | Analytics and reporting views |
| `COMMENTS` | Comments on tasks/projects |
| `USERS` | User account management (SuperAdmin only) |

---

### `permissions`

**Purpose:** Individual granular actions a user can perform. Each permission maps to one action on one module. Named with the convention `{ACTION}_{SUBJECT}`.

#### Columns

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `name` | String | No | e.g. `'CREATE_TASK'`, `'DELETE_PROJECT'` |
| `action` | String | No | `'CREATE'` \| `'READ'` \| `'UPDATE'` \| `'DELETE'` \| `'MANAGE'` |
| `description` | String | Yes | What this permission allows |
| `createdAt` | DateTime | No | Creation time |
| `moduleId` | UUID | No | FK → `modules.id` |

#### Keys
- **PK:** `id`
- **Unique:** `name`
- **FK:** `moduleId` → `modules.id` (Cascade delete)
- **Index:** `moduleId`

#### Full Permission List

| Permission | Action | Module |
|-----------|--------|--------|
| `CREATE_TASK` | CREATE | TASKS |
| `READ_TASK` | READ | TASKS |
| `UPDATE_TASK` | UPDATE | TASKS |
| `DELETE_TASK` | DELETE | TASKS |
| `MANAGE_TASKS` | MANAGE | TASKS |
| `CREATE_PROJECT` | CREATE | PROJECTS |
| `VIEW_PROJECT` | READ | PROJECTS |
| `UPDATE_PROJECT` | UPDATE | PROJECTS |
| `DELETE_PROJECT` | DELETE | PROJECTS |
| `MANAGE_PROJECTS` | MANAGE | PROJECTS |
| `VIEW_TEAM` | READ | TEAMS |
| `MANAGE_TEAM` | MANAGE | TEAMS |
| `VIEW_REPORTS` | READ | REPORTS |
| `ADD_COMMENT` | CREATE | COMMENTS |
| `VIEW_COMMENT` | READ | COMMENTS |
| `DELETE_COMMENT` | DELETE | COMMENTS |
| `MANAGE_USERS` | MANAGE | USERS |

---

### `role_permissions`

**Purpose:** Mapping table that defines which permissions each role grants. This is the global definition layer — it says "a Manager CAN do these things". The actual enforcement is per-project via `user_roles`.

#### Columns

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `roleId` | UUID | No | FK → `roles.id` (part of composite PK) |
| `permissionId` | UUID | No | FK → `permissions.id` (part of composite PK) |
| `grantedAt` | DateTime | No | When this mapping was created |
| `grantedById` | UUID | Yes | FK → `users.id` — who configured this |

#### Keys
- **PK:** `(roleId, permissionId)` — composite
- **FK:** `roleId` → `roles.id` (Cascade)
- **FK:** `permissionId` → `permissions.id` (Cascade)
- **FK:** `grantedById` → `users.id` (SetNull)

#### Role → Permission Matrix

| Permission | SuperAdmin | Manager | Developer | Client |
|-----------|:---:|:---:|:---:|:---:|
| MANAGE_TASKS | ✅ | — | — | — |
| CREATE_TASK | — | ✅ | — | — |
| READ_TASK | — | ✅ | ✅ | ✅ |
| UPDATE_TASK | — | ✅ | ✅ | — |
| DELETE_TASK | — | ✅ | — | — |
| MANAGE_PROJECTS | ✅ | — | — | — |
| VIEW_PROJECT | — | ✅ | ✅ | ✅ |
| UPDATE_PROJECT | — | ✅ | — | — |
| DELETE_PROJECT | — | — | — | — |
| MANAGE_TEAM | ✅ | ✅ | — | — |
| VIEW_TEAM | — | ✅ | ✅ | — |
| VIEW_REPORTS | — | ✅ | — | — |
| ADD_COMMENT | ✅ | ✅ | ✅ | — |
| VIEW_COMMENT | ✅ | ✅ | ✅ | ✅ |
| DELETE_COMMENT | ✅ | — | — | — |
| MANAGE_USERS | ✅ | — | — | — |

> **SuperAdmin note:** SuperAdmin has `MANAGE_*` entries only in DB, but the backend guard bypasses the check entirely for SuperAdmin — they automatically have all 17 permissions.

---

### `user_roles`

**Purpose:** The core RBAC table. Assigns a specific user a specific role within a specific project. This is what gets checked on every protected API request.

#### Columns

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `userId` | UUID | No | FK → `users.id` (part of composite PK) |
| `roleId` | UUID | No | FK → `roles.id` (part of composite PK) |
| `projectId` | UUID | No | FK → `projects.id` (part of composite PK) |
| `assignedAt` | DateTime | No | When the role was assigned |
| `assignedById` | UUID | Yes | FK → `users.id` — who made the assignment |

#### Keys
- **PK:** `(userId, roleId, projectId)` — composite
- **Unique:** `(userId, projectId)` — enforces ONE role per user per project at DB level
- **FK:** `userId` → `users.id` (Cascade delete)
- **FK:** `roleId` → `roles.id` (Cascade delete)
- **FK:** `projectId` → `projects.id` (Cascade delete)
- **Index:** `(userId, projectId)` — the most frequent lookup query

#### Example Row
```
userId:      "a1b2c3d4-..."   ← admin@flowdesk.com
roleId:      "r9r8r7r6-..."   ← SuperAdmin role UUID
projectId:   "f7e8d9c0-..."   ← PRJ-001 UUID
assignedAt:  2026-03-30T10:00:00Z
assignedById: null            ← seeded programmatically
```

---

## 4. Relationships Explained

### Primary Chain

```
users
  └── user_roles (userId FK)
        ├── projects (projectId FK)  — "User is a member of this project"
        └── roles (roleId FK)        — "With this role"
              └── role_permissions (roleId FK)
                    └── permissions (permissionId FK)
                          └── modules (moduleId FK)
```

### Task Chain

```
projects
  └── tasks (projectId FK)
        └── task_assignees (taskId FK)
```

### Team Chain

```
projects
  ├── team_leads  (1:1, projectId FK)
  ├── team_members (1:N, projectId FK)  ← display-only
  └── teams (1:N, projectId FK)
        └── team_participants (teamId FK)
```

### Project Metadata Chain

```
projects
  ├── project_tags (1:N)
  └── metrics (1:1)
```

---

## 5. Data Flow

### 🔹 User Registration

```
POST /auth/register
  → hash password (bcrypt)
  → INSERT INTO users (email, name, passwordHash, role='member')
  → return JWT (no role in token)
  
Note: New user has NO rows in user_roles.
      Dashboard shows 0 projects until SuperAdmin assigns a role.
```

### 🔹 Login

```
POST /auth/login
  → SELECT * FROM users WHERE email = ?
  → bcrypt.compare(password, passwordHash)
  → sign JWT { sub: userId, email, name }
  → return { access_token, user }

Note: role is NOT in the JWT — resolved dynamically per project.
```

### 🔹 Project Creation

```
POST /projects
  → Generate projectID = 'PRJ-' + padded count
  → INSERT INTO projects (projectID, projectName, ...)
  → INSERT INTO project_tags (tag, projectId)   [if tags provided]
  → INSERT INTO metrics (all zeros, projectId)  [if metrics provided]
  → INSERT INTO user_roles (userId=creator, roleId=Manager, projectId)
  
Creator automatically becomes Manager of the project.
```

### 🔹 Task Creation

```
POST /tasks
  PermissionGuard checks:
    SELECT user_roles WHERE userId=? AND projectId=?
    → get roleId
    → SELECT role_permissions WHERE roleId=?
    → check 'CREATE_TASK' in permission list
  
  If allowed:
    → Generate taskID = 'TASK-' + padded count
    → INSERT INTO tasks (taskID, taskName, status, priority, dueDate, projectId)
    → INSERT INTO task_assignees (name, avatar, color, taskId) for each assignee
```

### 🔹 Checking User Permissions (Frontend)

```
GET /projects/:id/permissions
  → SELECT user_roles WHERE userId=? AND projectId=?
  → JOIN roles
  → JOIN role_permissions
  → JOIN permissions
  → return { role: 'Manager', permissions: ['CREATE_TASK', 'READ_TASK', ...] }

Frontend then uses: permissions.includes('CREATE_TASK') to show/hide UI elements.
```

### 🔹 Member Assignment (RBAC)

```
POST /projects/:id/members { userId, roleId }
  PermissionGuard: caller must have MANAGE_TEAM

  → Check user exists
  → Check role exists
  → Check no existing row in user_roles for this (userId, projectId)
  → INSERT INTO user_roles (userId, roleId, projectId, assignedById)
```

### 🔹 Project Deletion

```
DELETE /projects/:id
  → Cascade deletes trigger automatically:
      tasks → task_assignees (cascade)
      teams → team_participants (cascade)
      team_members (cascade)
      team_leads (cascade)
      metrics (cascade)
      project_tags (cascade)
      user_roles (cascade)  ← all RBAC memberships removed
```

---

## 6. RBAC — Detailed Explanation

### Why Project-Based RBAC?

In a PM tool, the same person can be a **Manager on Project A** and a **Developer on Project B**. A global role system (one role per user) cannot model this. Project-based RBAC solves it by scoping every role assignment to `(user, project)`.

### How It Works — Step by Step

```
1. User opens workspace for PRJ-001
2. Frontend calls GET /projects/PRJ-001/permissions
3. Backend queries:
      user_roles WHERE userId = X AND projectId = (resolved UUID of PRJ-001)
      → found: roleId = Manager-UUID
4. Backend queries role_permissions WHERE roleId = Manager-UUID
      → returns: [CREATE_TASK, READ_TASK, UPDATE_TASK, DELETE_TASK, ...]
5. Backend returns: { role: 'Manager', permissions: [...] }
6. Frontend stores permissions in state
7. UI shows Create Task button (permissions.includes('CREATE_TASK') = true)

8. User clicks Create Task → POST /tasks { projectId: 'uuid', ...}
9. PermissionGuard runs same lookup again on every request
10. If permission present → task created
    If not → 403 Forbidden
```

### Why Not Store Role in JWT?

If the role were stored in the JWT:
- It would be stale immediately after a role change
- The user would have to re-login to pick up new permissions
- A multi-project user would need multiple tokens

With DB lookup on every request, role changes take effect **instantly** on the next API call.

### The Four Roles

| Role | Who is this | Can Create Tasks | Can Delete Tasks | Can Manage Team |
|------|------------|:---:|:---:|:---:|
| SuperAdmin | System administrator | ✅ (bypass) | ✅ (bypass) | ✅ (bypass) |
| Manager | Project lead | ✅ | ✅ | ✅ |
| Developer | Engineer contributing to tasks | ❌ | ❌ | ❌ |
| Client | External stakeholder | ❌ | ❌ | ❌ |

---

## 7. ER Diagrams

---

### 7.1 — Legend

```
Symbol    Meaning
──────    ───────────────────────────────────────────────
PK        Primary Key  (uniquely identifies a row)
FK        Foreign Key  (references another table's PK)
CPK       Composite Primary Key  (two or more columns together)
─────►    One-to-Many relationship  (left has one, right has many)
◄────►    Many-to-Many (via a junction/mapping table)
─ ─ ─►   Optional / nullable reference
(1:1)     Exactly one row on each side
(1:N)     One row on left, many rows on right
(N:M)     Many rows on both sides (needs a junction table)
```

---

### 7.2 — ER Diagram: Without Columns (High-Level Architecture)

> Read this to understand **what talks to what** and **why**.

```
╔══════════════════╗
║      AUTH        ║
║                  ║
║    users         ║
╚═══════╤══════════╝
        │
        │  A user can belong to many projects
        │  with a specific role in each
        │
        ▼
╔═══════════════════════════════════════════════════════════╗
║                        RBAC                               ║
║                                                           ║
║   users ──(assigned via)──► user_roles ◄──(defines)── roles
║                                                      │    ║
║                                                      │    ║
║                                          (grants)    │    ║
║                                                      ▼    ║
║                                           role_permissions ║
║                                                      │    ║
║                                          (maps to)   │    ║
║                                                      ▼    ║
║                                              permissions   ║
║                                                      │    ║
║                                          (belongs to)│    ║
║                                                      ▼    ║
║                                                  modules   ║
╚═══════════════════════════════════════════════════════════╝
        │
        │  A user who is SuperAdmin in any project
        │  can create and manage all projects
        │
        ▼
╔═══════════════════════════════════════════════════════════╗
║                    PROJECT MANAGEMENT                      ║
║                                                           ║
║   projects ──(has many)──► tasks ──(has many)──► task_assignees
║       │                                                   ║
║       ├──(has many)──► project_tags                       ║
║       │                                                   ║
║       ├──(has one) ──► metrics          (1:1)             ║
║       │                                                   ║
║       ├──(has one) ──► team_leads       (1:1)             ║
║       │                                                   ║
║       ├──(has many)──► team_members     (display only)    ║
║       │                                                   ║
║       └──(has many)──► teams ──(has many)──► team_participants
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

        user_roles is the BRIDGE between all three zones:
        ┌─────────┐     ┌────────────┐     ┌──────────┐
        │  users  │────►│ user_roles │◄────│ projects │
        └─────────┘     └─────┬──────┘     └──────────┘
                               │
                               ▼
                           ┌───────┐
                           │ roles │
                           └───────┘
```

---

### 7.3 — ER Diagram: With Key Columns (Detailed Structure)

> Read this to understand **exact foreign key wiring** between tables.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  AUTH                                                                    │
│                                                                          │
│  ┌─────────────────────────┐                                             │
│  │         users           │                                             │
│  ├─────────────────────────┤                                             │
│  │ id          PK  (uuid)  │                                             │
│  │ email       UNIQUE      │                                             │
│  │ name                    │                                             │
│  │ passwordHash            │                                             │
│  │ createdAt               │                                             │
│  └────────────┬────────────┘                                             │
└───────────────┼──────────────────────────────────────────────────────────┘
                │
                │ users.id referenced by:
                │   user_roles.userId (FK)
                │   projects.createdById (FK, nullable)
                │
                ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  RBAC                                                                    │
│                                                                          │
│  ┌──────────────────────────────┐                                        │
│  │          user_roles          │  ◄── THE CORE RBAC TABLE               │
│  ├──────────────────────────────┤                                        │
│  │ userId      CPK + FK→users   │                                        │
│  │ roleId      CPK + FK→roles   │                                        │
│  │ projectId   CPK + FK→projects│                                        │
│  │ assignedAt                   │  UNIQUE(userId, projectId)             │
│  │ assignedById     FK→users    │  → one role per user per project       │
│  └──────┬─────────────┬─────────┘                                        │
│         │             │                                                  │
│    FK   │             │  FK                                              │
│         ▼             ▼                                                  │
│  ┌──────────┐   ┌──────────────────────────────────────┐                 │
│  │  roles   │   │  (FK to projects — see Project zone) │                 │
│  ├──────────┤   └──────────────────────────────────────┘                 │
│  │ id   PK  │                                                            │
│  │ name     │  SuperAdmin, Manager, Developer, Client                    │
│  └────┬─────┘                                                            │
│       │                                                                  │
│       │ roles.id ──► role_permissions.roleId                             │
│       ▼                                                                  │
│  ┌────────────────────────────┐                                          │
│  │      role_permissions      │  ← mapping table (M:M)                  │
│  ├────────────────────────────┤                                          │
│  │ roleId       CPK + FK→roles│                                          │
│  │ permissionId CPK + FK→perms│                                          │
│  │ grantedAt                  │                                          │
│  └──────────────┬─────────────┘                                          │
│                 │                                                        │
│                 ▼                                                        │
│  ┌──────────────────────────────┐                                        │
│  │         permissions          │                                        │
│  ├──────────────────────────────┤                                        │
│  │ id       PK                  │                                        │
│  │ name     UNIQUE  (CREATE_TASK…)                                       │
│  │ action   (CREATE/READ/UPDATE/DELETE/MANAGE)                           │
│  │ moduleId FK → modules        │                                        │
│  └──────────────┬───────────────┘                                        │
│                 │                                                        │
│                 ▼                                                        │
│  ┌──────────────────────────────┐                                        │
│  │           modules            │                                        │
│  ├──────────────────────────────┤                                        │
│  │ id   PK                      │                                        │
│  │ name UNIQUE  (TASKS, PROJECTS…)                                       │
│  └──────────────────────────────┘                                        │
└──────────────────────────────────────────────────────────────────────────┘
                │
                │ user_roles.projectId ──────────────────┐
                │                                        │
                ▼                                        ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  PROJECT MANAGEMENT                                                      │
│                                                                          │
│  ┌────────────────────────────────────────────┐                          │
│  │                 projects                   │                          │
│  ├────────────────────────────────────────────┤                          │
│  │ id           PK  (uuid)                    │                          │
│  │ projectID    UNIQUE  (PRJ-001…)            │                          │
│  │ projectName                                │                          │
│  │ status       (todo/in-progress/completed…) │                          │
│  │ priority     (critical/medium/low)         │                          │
│  │ dueDate                                    │                          │
│  │ createdById  FK → users  (nullable)        │                          │
│  └──────┬──────────────────────────┬──────────┘                          │
│         │                          │                                     │
│  FK: projects.id referenced by:    │                                     │
│    tasks.projectId                 │                                     │
│    metrics.projectId               │                                     │
│    team_leads.projectId            │                                     │
│    team_members.projectId          │                                     │
│    project_tags.projectId          │                                     │
│    teams.projectId                 │                                     │
│    user_roles.projectId            │                                     │
│         │                          │                                     │
│         ▼                          ▼                                     │
│  ┌─────────────────┐    ┌─────────────────────────┐                      │
│  │     tasks        │    │  Support tables (1:1)   │                      │
│  ├─────────────────┤    ├─────────────────────────┤                      │
│  │ id       PK     │    │ metrics                 │                      │
│  │ taskID   UNIQUE │    │   completionPercentage  │                      │
│  │ taskName        │    │   tasksTotal            │                      │
│  │ status          │    │   tasksCompleted        │                      │
│  │ priority        │    │   projectId  FK (UNIQUE)│                      │
│  │ dueDate         │    ├─────────────────────────┤                      │
│  │ projectId FK    │    │ team_leads              │                      │
│  └──────┬──────────┘    │   leadId, name, avatar  │                      │
│         │               │   projectId  FK (UNIQUE)│                      │
│         ▼               ├─────────────────────────┤                      │
│  ┌──────────────────┐   │ project_tags            │                      │
│  │  task_assignees  │   │   tag                   │                      │
│  ├──────────────────┤   │   projectId  FK         │                      │
│  │ id   PK          │   ├─────────────────────────┤                      │
│  │ name             │   │ team_members            │                      │
│  │ avatar           │   │   name, role, status    │                      │
│  │ taskId  FK       │   │   projectId  FK         │                      │
│  └──────────────────┘   └─────────────────────────┘                      │
│                                                                          │
│  ┌──────────────────────────────────────────────────┐                    │
│  │  Support tables (1:N)                            │                    │
│  │                                                  │                    │
│  │  ┌───────────────────┐    ┌────────────────────┐ │                    │
│  │  │      teams        │    │  team_participants  │ │                    │
│  │  ├───────────────────┤    ├────────────────────┤ │                    │
│  │  │ id       PK       │───►│ id     PK          │ │                    │
│  │  │ teamID   UNIQUE   │    │ name               │ │                    │
│  │  │ teamName          │    │ avatar             │ │                    │
│  │  │ projectId  FK     │    │ teamId   FK        │ │                    │
│  │  └───────────────────┘    └────────────────────┘ │                    │
│  └──────────────────────────────────────────────────┘                    │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### 7.4 — FK Reference Map (Quick Lookup)

> One-line summary of every foreign key in the system.

```
FK                             References               On Delete
─────────────────────────────  ───────────────────────  ──────────
projects.createdById        →  users.id                 SET NULL
user_roles.userId           →  users.id                 CASCADE
user_roles.roleId           →  roles.id                 CASCADE
user_roles.projectId        →  projects.id              CASCADE
user_roles.assignedById     →  users.id                 SET NULL
role_permissions.roleId     →  roles.id                 CASCADE
role_permissions.permId     →  permissions.id           CASCADE
role_permissions.grantedById→  users.id                 SET NULL
permissions.moduleId        →  modules.id               CASCADE
tasks.projectId             →  projects.id              CASCADE
task_assignees.taskId       →  tasks.id                 CASCADE
teams.projectId             →  projects.id              CASCADE
team_participants.teamId    →  teams.id                 CASCADE
team_members.projectId      →  projects.id              CASCADE
team_leads.projectId        →  projects.id              CASCADE
metrics.projectId           →  projects.id              CASCADE
project_tags.projectId      →  projects.id              CASCADE
```

---

### 7.5 — Flow Diagrams

#### 🔹 Business Flow (Project → Task → Assignee)

```
 ┌───────┐  creates   ┌──────────┐  contains  ┌───────┐  has  ┌────────────────┐
 │ users │ ─────────► │ projects │ ──────────► │ tasks │ ────► │ task_assignees │
 └───────┘            └────┬─────┘            └───────┘       └────────────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
        project_tags    metrics     teams
                                      │
                                      ▼
                               team_participants
```

#### 🔹 RBAC Flow (User → Role → Permission → Module)

```
 ┌───────┐              ┌────────────┐              ┌───────┐
 │ users │ ──────────► │ user_roles │ ────────────► │ roles │
 └───────┘  assigned   └─────┬──────┘  resolves to  └───┬───┘
                             │                           │ grants
                             │ scoped to                 ▼
                         ┌───────────┐          ┌──────────────────┐
                         │ projects  │          │ role_permissions │
                         └───────────┘          └────────┬─────────┘
                                                         │ maps to
                                                         ▼
                                                  ┌─────────────┐
                                                  │ permissions │
                                                  └──────┬──────┘
                                                         │ belongs to
                                                         ▼
                                                    ┌─────────┐
                                                    │ modules │
                                                    └─────────┘

Real example:
  admin@flowdesk.com
    └── user_roles: { userId, roleId=SuperAdmin, projectId=PRJ-001 }
          └── roles: SuperAdmin
                └── role_permissions: [MANAGE_TASKS, MANAGE_PROJECTS, ...]
                      └── permissions: CREATE_TASK, READ_TASK, DELETE_TASK...
                            └── modules: TASKS, PROJECTS, TEAMS...
```

#### 🔹 Permission Check Flow (Every API Request)

```
  Incoming request: PUT /tasks/:id  { body.projectId = "uuid" }
          │
          ▼
  JwtAuthGuard          → extract userId from Bearer token
          │
          ▼
  PermissionGuard       → read @RequirePermission('UPDATE_TASK')
          │
          ▼                   ┌─────────────────────────────────────┐
  Resolve projectId      →    │ SELECT id FROM projects             │
  (short code or UUID)        │ WHERE id=? OR projectID=?           │
          │                   └─────────────────────────────────────┘
          ▼                   ┌─────────────────────────────────────┐
  Lookup user role       →    │ SELECT * FROM user_roles            │
  in this project             │ WHERE userId=? AND projectId=?      │
          │                   └─────────────────────────────────────┘
          ▼
  Is role = SuperAdmin?  → YES → ✅ Allow immediately
          │ NO
          ▼                   ┌─────────────────────────────────────┐
  Fetch role permissions →    │ SELECT permissions.name             │
                              │ FROM role_permissions               │
                              │ JOIN permissions ON ...             │
                              │ WHERE roleId = ?                    │
                              └─────────────────────────────────────┘
          │
          ▼
  'UPDATE_TASK' in list? → YES → ✅ 200 OK
                         → NO  → ❌ 403 Forbidden
```

---

## 8. Normalization & Design Decisions

### Why separate `metrics` from `projects`?

Project cards in the dashboard need completion percentage, task counts etc. without fetching all tasks. `metrics` acts as a pre-aggregated cache — a single row upserted when tasks are created/updated. This avoids `COUNT(*)` queries on every dashboard load.

### Why `project_tags` is separate?

Tags are a one-to-many relation (one project, many tags). Storing them as a comma string in `projects` would make filtering impossible. A separate table allows `WHERE tag = 'Backend'` queries.

### Why `team_members` AND `teams`/`team_participants` both exist?

- `team_members` — **denormalized** display data seeded at project creation. Shows the roster on project cards and modals. Not updated by the RBAC system.
- `teams` + `team_participants` — **first-class** team entities created via the Create Team feature. These are real teams managed through the UI.

Both serve different purposes; neither replaces the other.

### Why no `role` field in the users table for RBAC?

The `role` column on `users` is a **legacy field** from the pre-RBAC version. It is kept only for backward compatibility with existing admin tooling. All actual access control is driven by `user_roles`. The legacy field is explicitly marked as deprecated in the schema and will be removed in a future migration.

### Why composite PK on `user_roles`?

`(userId, roleId, projectId)` as a composite PK plus `@@unique([userId, projectId])` together enforce:
1. No duplicate assignments of the same role in the same project
2. A user can only hold **one role** per project (enforced at DB level, not just application level)

This means even if application code has a bug, the DB will reject a second role assignment for the same user+project pair.

### Why composite PK on `role_permissions`?

`(roleId, permissionId)` prevents the same permission from being assigned to the same role twice. Without this, duplicate rows would cause phantom permission inflation.

---

## 9. Performance Considerations

### Indexes

| Table | Index | Reason |
|-------|-------|--------|
| `users` | `email` | Login lookup — runs on every authentication attempt |
| `projects` | `status` | Dashboard filter by status (`'in-progress'`, `'completed'`) |
| `projects` | `priority` | Filter by priority level |
| `projects` | `teamID` | Team-based project lookup |
| `tasks` | `projectId` | Fetch all tasks for a project (Kanban board) |
| `tasks` | `status` | Filter tasks by column |
| `tasks` | `dueDate` | Overdue task detection |
| `permissions` | `moduleId` | Group permissions by module |
| `user_roles` | `(userId, projectId)` | **Critical** — runs on every guarded API request |

### Guard Query Pattern

Every RBAC-protected request runs this sequence:

```sql
-- Step 1: Resolve short code to UUID (if needed)
SELECT id FROM projects WHERE id = ? OR "projectID" = ?;

-- Step 2: Find user's role in this project
SELECT user_roles.*, roles.name FROM user_roles
JOIN roles ON roles.id = user_roles."roleId"
WHERE user_roles."userId" = ? AND user_roles."projectId" = ?;

-- Step 3: Check permissions (skipped for SuperAdmin)
SELECT permissions.name FROM role_permissions
JOIN permissions ON permissions.id = role_permissions."permissionId"
WHERE role_permissions."roleId" = ?;
```

This is 3 queries per guarded request. The `@@index([userId, projectId])` on `user_roles` makes Step 2 a near-instant index scan. For high scale, Step 3 can be cached (Redis, 5-min TTL) per `(userId, projectId)` key.

---

## 10. Important Constraints

### Unique Constraints

| Table | Constraint | Effect |
|-------|-----------|--------|
| `users` | `email` unique | No duplicate accounts |
| `projects` | `projectID` unique | No duplicate PRJ-XXX codes |
| `tasks` | `taskID` unique | No duplicate TASK-XXX codes |
| `teams` | `teamID` unique | No duplicate team identifiers |
| `team_leads` | `projectId` unique | One lead per project |
| `metrics` | `projectId` unique | One metrics row per project |
| `roles` | `name` unique | No duplicate role names |
| `modules` | `name` unique | No duplicate module names |
| `permissions` | `name` unique | No duplicate permission names |
| `user_roles` | `(userId, projectId)` unique | **One role per user per project** |

### Cascade Delete Rules

| Parent deleted | Children affected |
|---------------|------------------|
| `projects` | All `tasks`, `team_leads`, `team_members`, `teams`, `metrics`, `project_tags`, `user_roles` |
| `tasks` | All `task_assignees` |
| `teams` | All `team_participants` |
| `roles` | All `role_permissions`, `user_roles` |
| `permissions` | All `role_permissions` |
| `modules` | All `permissions` |
| `users` | All `user_roles` (Cascade), `projects.createdById → SetNull` |

### SetNull Rules

| FK | Behavior | Reason |
|----|----------|--------|
| `projects.createdById` | SetNull | Project survives if creator account is deleted |
| `user_roles.assignedById` | SetNull | Audit trail preserved; assignment record stays |
| `role_permissions.grantedById` | SetNull | Permission mapping stays even if configurator is deleted |

---

## 11. Edge Case Handling

### User with No Project

- `user_roles` has zero rows for this user
- `GET /projects/my` returns `{ data: [], meta: { total: 0 } }`
- Dashboard renders empty state
- User cannot access any workspace URL (guard returns 403)

### User Removed from Project

```sql
DELETE FROM user_roles WHERE userId = ? AND projectId = ?;
```

- Immediate effect on next API request (no caching)
- Guard returns `403: You are not a member of this project`
- Active browser session will see 403 on the very next fetch

### Role Changed

- `user_roles` has `@@unique([userId, projectId])` — only one row per user per project
- To change role: delete old row + insert new row (handled by `removeMember` + `addMember`)
- New role takes effect immediately — next guarded request fetches fresh from DB

### Project Deleted

- All cascade deletes fire automatically in DB
- `tasks`, `user_roles`, `teams`, `metrics`, `project_tags` all removed in a single transaction
- Team assignments (memberships) are gone — no orphaned `user_roles` rows

### Invalid projectId Passed to Guard

```
resolvedProject = await prisma.project.findFirst({
  where: { OR: [{ id: projectId }, { projectID: projectId }] }
});
```

If the projectId doesn't match any project:
- `resolvedProject` is null
- `userRole` lookup uses the unmatched string → returns null
- Guard throws `403: You are not a member of this project`

### Token Used After Role Change

JWT does not carry role information — the role is fetched live from the DB on every request. So if a user's role is downgraded from Manager to Developer mid-session, the very next API call will enforce Developer permissions. No re-login required.

---

## 12. Scalability

### Adding a New Module

```sql
INSERT INTO modules (id, name, description) VALUES (uuid(), 'FILES', 'File attachments');
INSERT INTO permissions (id, name, action, moduleId) VALUES
  (uuid(), 'UPLOAD_FILE', 'CREATE', <FILES module id>),
  (uuid(), 'VIEW_FILE',   'READ',   <FILES module id>),
  (uuid(), 'DELETE_FILE', 'DELETE', <FILES module id>);
```

Then assign to roles via `role_permissions`. **No schema change required.**

### Adding a New Role

```sql
INSERT INTO roles (id, name, description) VALUES (uuid(), 'Viewer', 'Read-only access');
-- Then map permissions:
INSERT INTO role_permissions (roleId, permissionId) ...
```

Assign to users via `user_roles`. **No schema change required.**

### Multi-Tenant Capability

The current architecture is **single-tenant** but ready for multi-tenancy:

1. Add `organisationId` to `projects`, `users`, `roles`
2. Scope all queries by `organisationId`
3. `user_roles` already scopes everything per project — tenant isolation is additive

### Scale Projections

| Load | Recommendation |
|------|---------------|
| < 1,000 users | Current setup sufficient |
| 1,000–50,000 users | Add Redis cache for `user_roles` lookups (5-min TTL) |
| 50,000+ users | Shard by organisation, read replicas for permission queries |
| Enterprise | Materialize permission sets, event-sourced role changes |

---

## 13. Final Summary

### Why This DB Design is Strong

| Aspect | How it's handled |
|--------|-----------------|
| **Correctness** | Unique constraints + composite PKs enforce data integrity at the DB level, not just application level |
| **Flexibility** | Adding new roles/permissions/modules requires zero schema changes |
| **Performance** | 6 targeted indexes cover all common query patterns |
| **Security** | Role not stored in JWT — fresh DB lookup on every request prevents stale permission exploitation |
| **Isolation** | `user_roles` is project-scoped — same user can have different roles across projects |
| **Observability** | Every role assignment has `assignedById` + `assignedAt` for audit |
| **Resilience** | Cascade/SetNull rules ensure no orphaned data on user or project deletion |

### How This Compares to Jira

| Feature | Jira | FlowDesk |
|---------|------|---------|
| Project-scoped roles | ✅ | ✅ |
| Granular permissions | ✅ | ✅ |
| Task assignees (multiple) | ✅ | ✅ |
| Task status workflow | ✅ | ✅ |
| Tagged projects | ✅ | ✅ |
| Team management | ✅ | ✅ |
| Role hierarchy | ✅ | ⚠️ No level field yet |
| Audit log | ✅ | ⚠️ Partial (assignedBy only) |
| Comments table | Defined | ⚠️ In modules, not yet a DB table |
| Time tracking | ✅ | ❌ Not implemented |

---

*Generated: March 30, 2026 — FlowDesk Phase 2 (RBAC complete)*
