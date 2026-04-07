# FlowDesk — Complete Database ER Diagram

> **Source of truth:** `backend/prisma/schema.prisma`
> **Database:** PostgreSQL
> **ORM:** Prisma
> **Last updated:** April 7, 2026
> **Total tables:** 17 | **Enums:** 5

---

## Table of Contents

1. [Domain Groups](#domain-groups)
2. [Enums Reference](#enums-reference)
3. [Full ER Diagram](#full-er-diagram)
4. [Table Definitions](#table-definitions)
5. [Relationships Summary](#relationships-summary)

---

## Domain Groups

| Domain | Tables |
|--------|--------|
| **Auth** | `users` |
| **Project Management** | `projects`, `project_tags`, `team_leads`, `team_members`, `metrics` |
| **Task Management** | `tasks`, `task_assignees` |
| **Teams** | `teams`, `team_participants` |
| **RBAC** | `roles`, `modules`, `permissions`, `role_permissions`, `user_roles` |
| **Issues** | `issues`, `issue_links` |

---

## Enums Reference

| Enum | Values |
|------|--------|
| `IssueType` | `EPIC` · `STORY` · `TASK` · `BUG` |
| `IssueLinkType` | `BLOCKS` · `DEPENDS_ON` · `RELATES_TO` · `DUPLICATES` |
| `IssueStatus` | `TODO` · `IN_PROGRESS` · `DONE` |
| `IssuePriority` | `LOW` · `MEDIUM` · `HIGH` |
| `Visibility` | `PRIVATE` · `PUBLIC` |

---

## Full ER Diagram

```mermaid
erDiagram

  %% ─────────────────────────────────────────────
  %% AUTH
  %% ─────────────────────────────────────────────

  users {
    uuid   id           PK
    string email        UK
    string name
    string passwordHash
    ts     createdAt
    ts     updatedAt
  }

  %% ─────────────────────────────────────────────
  %% PROJECT MANAGEMENT
  %% ─────────────────────────────────────────────

  projects {
    uuid       id                  PK
    string     projectID           UK
    string     projectName
    string     projectDescription
    string     status
    string     statusLabel
    string     priority
    string     category
    ts         createdDate
    ts         assignedDate
    ts         dueDate
    ts         completedDate
    string     teamID
    string     teamName
    string     assigneeID
    string     assigneeName
    string     assigneeAvatar
    string     assigneeAvatarColor
    bool       isRecurring
    string     recurringFrequency
    string     projectKey          UK
    Visibility visibility
    uuid       createdById         FK
    ts         createdAt
    ts         updatedAt
  }

  project_tags {
    uuid   id        PK
    string tag
    uuid   projectId FK
  }

  team_leads {
    uuid   id          PK
    string leadId
    string name
    string avatar
    string avatarColor
    uuid   projectId   FK_UK
  }

  team_members {
    uuid   id          PK
    string memberId
    string name
    string avatar
    string avatarColor
    string role
    string status
    uuid   projectId   FK
  }

  metrics {
    uuid id                   PK
    int  completionPercentage
    int  tasksTotal
    int  tasksCompleted
    int  tasksInProgress
    int  tasksOverdue
    uuid projectId            FK_UK
  }

  %% ─────────────────────────────────────────────
  %% TASK MANAGEMENT
  %% ─────────────────────────────────────────────

  tasks {
    uuid   id                 PK
    string taskID             UK
    string taskName
    string taskDescription
    string status
    string priority
    bool   isRecurring
    string recurringFrequency
    ts     createdAt
    ts     dueDate
    ts     completedDate
    uuid   projectId          FK
  }

  task_assignees {
    uuid   id          PK
    string name
    string avatar
    string avatarColor
    uuid   taskId      FK
  }

  %% ─────────────────────────────────────────────
  %% TEAMS
  %% ─────────────────────────────────────────────

  teams {
    uuid   id        PK
    string teamID    UK
    string teamName
    ts     createdAt
    uuid   projectId FK
  }

  team_participants {
    uuid   id     PK
    string name
    string avatar
    string color
    uuid   teamId FK
  }

  %% ─────────────────────────────────────────────
  %% RBAC
  %% ─────────────────────────────────────────────

  roles {
    uuid   id          PK
    string name        UK
    string description
    ts     createdAt
    ts     updatedAt
  }

  modules {
    uuid   id          PK
    string name        UK
    string description
    ts     createdAt
  }

  permissions {
    uuid   id          PK
    string name        UK
    string action
    string description
    ts     createdAt
    uuid   moduleId    FK
  }

  role_permissions {
    uuid   roleId       CPK_FK
    uuid   permissionId CPK_FK
    ts     grantedAt
    uuid   grantedById  FK
  }

  user_roles {
    uuid   userId      CPK_FK
    uuid   roleId      CPK_FK
    uuid   projectId   CPK_FK
    ts     assignedAt
    uuid   assignedById FK
  }

  %% ─────────────────────────────────────────────
  %% ISSUES
  %% ─────────────────────────────────────────────

  issues {
    uuid          id          PK
    string        issueKey    UK
    IssueType     type
    string        title
    string        description
    IssueStatus   status
    IssuePriority priority
    bool          isCompleted
    uuid          parentId    FK
    uuid          projectId   FK
    uuid          assigneeId  FK
    uuid          reporterId  FK
    ts            createdAt
    ts            updatedAt
    string        estimate
    ts            dueDate
  }

  issue_links {
    cuid          id            PK
    IssueLinkType linkType
    uuid          sourceIssueId FK
    uuid          targetIssueId FK
    ts            createdAt
  }

  %% ─────────────────────────────────────────────
  %% RELATIONSHIPS
  %% ─────────────────────────────────────────────

  %% AUTH → PROJECT MANAGEMENT
  users           ||--o{ projects          : "creates (createdBy)"
  users           ||--o{ user_roles        : "assigned to roles"
  users           ||--o{ user_roles        : "assigns roles (assignedBy)"
  users           ||--o{ role_permissions  : "grants permissions"

  %% AUTH → ISSUES
  users           ||--o{ issues            : "assigned to (assignee)"
  users           ||--o{ issues            : "reports (reporter)"

  %% PROJECT → sub-tables
  projects        ||--o{ project_tags      : "has tags"
  projects        ||--|| team_leads        : "has lead"
  projects        ||--o{ team_members      : "has members"
  projects        ||--|| metrics           : "has metrics"
  projects        ||--o{ tasks             : "has tasks"
  projects        ||--o{ teams             : "has teams"
  projects        ||--o{ user_roles        : "scoped roles"
  projects        ||--o{ issues            : "has issues"

  %% TASK → sub-tables
  tasks           ||--o{ task_assignees    : "assigned to"

  %% TEAM → sub-tables
  teams           ||--o{ team_participants : "has participants"

  %% RBAC relationships
  roles           ||--o{ role_permissions  : "has permissions"
  roles           ||--o{ user_roles        : "used in"
  modules         ||--o{ permissions       : "defines"
  permissions     ||--o{ role_permissions  : "granted via"

  %% ISSUE self-relation & links
  issues          ||--o{ issues            : "parent → children"
  issues          ||--o{ issue_links       : "source of link"
  issues          ||--o{ issue_links       : "target of link"
```

---

## Table Definitions

### `users`
Primary auth table. Holds login credentials and acts as the central FK target for RBAC, project ownership, and issue assignments.

| Column | Type | Constraint | Notes |
|--------|------|-----------|-------|
| `id` | UUID | PK | Auto-generated |
| `email` | String | UNIQUE | Login identifier |
| `name` | String | — | Display name |
| `passwordHash` | String | — | Bcrypt hash |
| `createdAt` | DateTime | DEFAULT now() | — |
| `updatedAt` | DateTime | @updatedAt | — |

---

### `projects`
Core entity. Represents a project in the Global View dashboard.

| Column | Type | Constraint | Notes |
|--------|------|-----------|-------|
| `id` | UUID | PK | — |
| `projectID` | String | UNIQUE | E.g. `PRJ-001` |
| `projectName` | String | — | — |
| `projectDescription` | String? | nullable | — |
| `status` | String | — | `todo` / `in-progress` / `completed` / `overdue` |
| `statusLabel` | String | — | Human-readable label |
| `priority` | String | — | `critical` / `medium` / `low` |
| `category` | String | — | `General`, `Design`, etc. |
| `createdDate` | DateTime | DEFAULT now() | — |
| `assignedDate` | DateTime | — | — |
| `dueDate` | DateTime? | nullable | — |
| `completedDate` | DateTime? | nullable | — |
| `teamID` | String | — | Legacy team ref |
| `teamName` | String | — | Legacy team name |
| `assigneeID` | String | — | Legacy assignee ref |
| `assigneeName` | String | — | — |
| `assigneeAvatar` | String | — | — |
| `assigneeAvatarColor` | String | — | — |
| `isRecurring` | Boolean | DEFAULT false | — |
| `recurringFrequency` | String? | nullable | — |
| `projectKey` | String? | UNIQUE, nullable | E.g. `SCRUM` |
| `visibility` | Visibility | DEFAULT PRIVATE | Enum |
| `createdById` | UUID? | FK → users, nullable | RBAC project ownership |
| `createdAt` | DateTime | DEFAULT now() | — |
| `updatedAt` | DateTime | @updatedAt | — |

**Indexes:** `status`, `priority`, `teamID`

---

### `project_tags`
Many tags per project.

| Column | Type | Constraint |
|--------|------|-----------|
| `id` | UUID | PK |
| `tag` | String | — |
| `projectId` | UUID | FK → projects (CASCADE) |

---

### `team_leads`
One lead record per project (1-to-1).

| Column | Type | Constraint |
|--------|------|-----------|
| `id` | UUID | PK |
| `leadId` | String | — |
| `name` | String | — |
| `avatar` | String | — |
| `avatarColor` | String | — |
| `projectId` | UUID | FK → projects (UNIQUE, CASCADE) |

---

### `team_members`
Many members per project.

| Column | Type | Constraint |
|--------|------|-----------|
| `id` | UUID | PK |
| `memberId` | String | — |
| `name` | String | — |
| `avatar` | String | — |
| `avatarColor` | String | — |
| `role` | String | — |
| `status` | String | DEFAULT `online` |
| `projectId` | UUID | FK → projects (CASCADE) |

---

### `metrics`
Aggregated stats for a project (1-to-1).

| Column | Type | Constraint |
|--------|------|-----------|
| `id` | UUID | PK |
| `completionPercentage` | Int | DEFAULT 0 |
| `tasksTotal` | Int | DEFAULT 0 |
| `tasksCompleted` | Int | DEFAULT 0 |
| `tasksInProgress` | Int | DEFAULT 0 |
| `tasksOverdue` | Int | DEFAULT 0 |
| `projectId` | UUID | FK → projects (UNIQUE, CASCADE) |

---

### `tasks`
Workspace-level tasks belonging to a project.

| Column | Type | Constraint |
|--------|------|-----------|
| `id` | UUID | PK |
| `taskID` | String | UNIQUE — e.g. `TASK-101` |
| `taskName` | String | — |
| `taskDescription` | String? | nullable |
| `status` | String | DEFAULT `todo` |
| `priority` | String | — |
| `isRecurring` | Boolean | DEFAULT false |
| `recurringFrequency` | String? | nullable |
| `createdAt` | DateTime | DEFAULT now() |
| `dueDate` | DateTime | — |
| `completedDate` | DateTime? | nullable |
| `projectId` | UUID | FK → projects (CASCADE) |

**Indexes:** `projectId`, `status`, `dueDate`

---

### `task_assignees`
Many assignees per task.

| Column | Type | Constraint |
|--------|------|-----------|
| `id` | UUID | PK |
| `name` | String | — |
| `avatar` | String | DEFAULT `""` |
| `avatarColor` | String | DEFAULT `#4361ee` |
| `taskId` | UUID | FK → tasks (CASCADE) |

---

### `teams`
First-class team entities scoped per project.

| Column | Type | Constraint |
|--------|------|-----------|
| `id` | UUID | PK |
| `teamID` | String | UNIQUE — e.g. `BCT-001` |
| `teamName` | String | — |
| `createdAt` | DateTime | DEFAULT now() |
| `projectId` | UUID | FK → projects (CASCADE) |

---

### `team_participants`
Members of a team.

| Column | Type | Constraint |
|--------|------|-----------|
| `id` | UUID | PK |
| `name` | String | — |
| `avatar` | String | — |
| `color` | String | DEFAULT `#4361ee` |
| `teamId` | UUID | FK → teams (CASCADE) |

---

### `roles`
Predefined role templates (SuperAdmin, Manager, Developer, Client).

| Column | Type | Constraint |
|--------|------|-----------|
| `id` | UUID | PK |
| `name` | String | UNIQUE |
| `description` | String? | nullable |
| `createdAt` | DateTime | DEFAULT now() |
| `updatedAt` | DateTime | @updatedAt |

---

### `modules`
Functional areas of the app (TASKS, PROJECTS, TEAMS, REPORTS, COMMENTS, USERS).

| Column | Type | Constraint |
|--------|------|-----------|
| `id` | UUID | PK |
| `name` | String | UNIQUE |
| `description` | String? | nullable |
| `createdAt` | DateTime | DEFAULT now() |

---

### `permissions`
One action on one module (e.g. `CREATE_TASK` = `CREATE` on `TASKS`).

| Column | Type | Constraint |
|--------|------|-----------|
| `id` | UUID | PK |
| `name` | String | UNIQUE — convention: `{ACTION}_{SUBJECT}` |
| `action` | String | `CREATE` / `READ` / `UPDATE` / `DELETE` / `MANAGE` |
| `description` | String? | nullable |
| `createdAt` | DateTime | DEFAULT now() |
| `moduleId` | UUID | FK → modules (CASCADE) |

**Index:** `moduleId`

---

### `role_permissions`
Maps roles to permissions (global — not project-scoped).

| Column | Type | Constraint |
|--------|------|-----------|
| `roleId` | UUID | CPK + FK → roles (CASCADE) |
| `permissionId` | UUID | CPK + FK → permissions (CASCADE) |
| `grantedAt` | DateTime | DEFAULT now() |
| `grantedById` | UUID? | FK → users (SetNull), nullable |

**Composite PK:** `(roleId, permissionId)`

---

### `user_roles`
Core RBAC table — assigns a user a role within a specific project.

| Column | Type | Constraint |
|--------|------|-----------|
| `userId` | UUID | CPK + FK → users (CASCADE) |
| `roleId` | UUID | CPK + FK → roles (CASCADE) |
| `projectId` | UUID | CPK + FK → projects (CASCADE) |
| `assignedAt` | DateTime | DEFAULT now() |
| `assignedById` | UUID? | FK → users (SetNull), nullable |

**Composite PK:** `(userId, roleId, projectId)`
**Unique constraint:** `(userId, projectId)` — enforces one role per user per project
**Index:** `(userId, projectId)`

---

### `issues`
Jira-style issues with EPIC → STORY → TASK/BUG hierarchy via self-relation.

| Column | Type | Constraint |
|--------|------|-----------|
| `id` | UUID | PK |
| `issueKey` | String | UNIQUE — e.g. `PRJ-1` |
| `type` | IssueType | Enum |
| `title` | String | — |
| `description` | String? | nullable |
| `status` | IssueStatus | DEFAULT `TODO` |
| `priority` | IssuePriority | DEFAULT `MEDIUM` |
| `isCompleted` | Boolean | DEFAULT false — EPIC-specific |
| `parentId` | UUID? | FK → issues self-relation (SetNull), nullable |
| `projectId` | UUID | FK → projects (CASCADE) |
| `assigneeId` | UUID? | FK → users (SetNull), nullable |
| `reporterId` | UUID? | FK → users (SetNull), nullable |
| `createdAt` | DateTime | DEFAULT now() |
| `updatedAt` | DateTime | @updatedAt |
| `estimate` | String? | nullable — e.g. `4h`, `2d` |
| `dueDate` | DateTime? | nullable |

**Indexes:** `projectId`, `parentId`, `assigneeId`, `status`, `type`

---

### `issue_links`
Jira-style relationships between issues (BLOCKS, DEPENDS_ON, RELATES_TO, DUPLICATES).

| Column | Type | Constraint |
|--------|------|-----------|
| `id` | CUID | PK |
| `linkType` | IssueLinkType | Enum |
| `sourceIssueId` | UUID | FK → issues (CASCADE) |
| `targetIssueId` | UUID | FK → issues (CASCADE) |
| `createdAt` | DateTime | DEFAULT now() |

**Unique:** `(sourceIssueId, targetIssueId, linkType)`
**Indexes:** `sourceIssueId`, `targetIssueId`

---

## Relationships Summary

| From | To | Type | Via / Notes |
|------|----|------|-------------|
| `users` | `projects` | 1 → many | `projects.createdById` |
| `users` | `user_roles` | 1 → many | as member |
| `users` | `user_roles` | 1 → many | as assigner (`assignedById`) |
| `users` | `role_permissions` | 1 → many | as granter (`grantedById`) |
| `users` | `issues` | 1 → many | as assignee |
| `users` | `issues` | 1 → many | as reporter |
| `projects` | `project_tags` | 1 → many | CASCADE delete |
| `projects` | `team_leads` | 1 → 1 | CASCADE delete |
| `projects` | `team_members` | 1 → many | CASCADE delete |
| `projects` | `metrics` | 1 → 1 | CASCADE delete |
| `projects` | `tasks` | 1 → many | CASCADE delete |
| `projects` | `teams` | 1 → many | CASCADE delete |
| `projects` | `user_roles` | 1 → many | CASCADE delete |
| `projects` | `issues` | 1 → many | CASCADE delete |
| `tasks` | `task_assignees` | 1 → many | CASCADE delete |
| `teams` | `team_participants` | 1 → many | CASCADE delete |
| `roles` | `role_permissions` | 1 → many | CASCADE delete |
| `roles` | `user_roles` | 1 → many | CASCADE delete |
| `modules` | `permissions` | 1 → many | CASCADE delete |
| `permissions` | `role_permissions` | 1 → many | CASCADE delete |
| `issues` | `issues` | 1 → many | self-relation: parent → children, SetNull on delete |
| `issues` | `issue_links` | 1 → many | as source, CASCADE delete |
| `issues` | `issue_links` | 1 → many | as target, CASCADE delete |

---

> **Legend:**
> - `PK` = Primary Key
> - `UK` = Unique Key
> - `FK` = Foreign Key
> - `FK_UK` = Foreign Key + Unique (1-to-1 relation)
> - `CPK_FK` = Part of Composite Primary Key + Foreign Key
> - `CASCADE` = Child deleted when parent deleted
> - `SetNull` = FK set to NULL when parent deleted
> - `nullable` = Optional field (can be NULL)
