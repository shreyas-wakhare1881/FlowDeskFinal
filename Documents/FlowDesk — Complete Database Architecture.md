# FlowDesk - Current Database Architecture (Dynamic Kanban + Comments)

> Product: FlowDesk - Jira-like Project Management System
> Database: PostgreSQL
> ORM: Prisma 5.x
> Last Verified: 2026-04-08
> Scope: Actual implemented repository state, not a future Scrum proposal
> Total tables: 19 | Enums: 5

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Frontend State Driven by the Database](#2-current-frontend-state-driven-by-the-database)
3. [Current Backend State Driven by the Database](#3-current-backend-state-driven-by-the-database)
4. [Enums Reference](#4-enums-reference)
5. [Current Table Groups](#5-current-table-groups)
6. [Key Current Models](#6-key-current-models)
7. [Relationships Summary](#7-relationships-summary)
8. [Business Rules and Constraints](#8-business-rules-and-constraints)
9. [Migration and Sync Status](#9-migration-and-sync-status)
10. [Known Gaps](#10-known-gaps)
11. [CHANGES DONE AT 2026-04-08](#11-changes-done-at-2026-04-08)

---

## 1. Executive Summary

FlowDesk currently implements a dynamic Kanban data model based on `issues`, `board_columns`, and `comments`.

This is the actual state of the repository today:

* `issues` is the primary work-item table.
* `tasks` remains as a legacy table and is still present in the schema.
* Dynamic Kanban columns are stored in `board_columns`.
* Issue comments are stored in `comments`.
* `status` still exists on the issue and is used for workflow/progress logic.
* `columnId` is used for current board placement.

Important correction:

* The current implemented schema does not include `project_boards`, `project_sprints`, or `issue_sprint_history`.
* The current implemented schema does include `board_columns` and `comments`.

In short, the current architecture is a dynamic Kanban system with issue hierarchy and comments, not a Scrum board/sprint schema.

---

## 2. Current Frontend State Driven by the Database

### 2.1 Current Board Rendering Model

The current workspace board uses `board_columns` plus `issues.columnId`.

Frontend behavior tied to the DB model:

* Columns are fetched from `GET /board-columns?projectId=<id>`.
* Issue cards are placed in a column by `issue.columnId`.
* If an issue has `columnId = null`, it exists in the system but will not render inside any board column until it is assigned again.
* The board no longer depends on hardcoded `TODO`, `IN_PROGRESS`, and `DONE` columns for layout.

### 2.2 Current Issue Detail Model

The issue detail modal works directly against persisted issue fields.

Editable frontend fields backed by the database:

* `assigneeId`
* `reporterId`
* `priority`
* `parentId`
* `estimate`
* `dueDate`
* `title`
* `description`
* `status` (except EPIC standard status mutation)

Displayed backend-driven fields:

* `createdAt`
* `updatedAt`
* `issueKey`
* linked issues
* issue comments

### 2.3 Current Comments Flow

Frontend comments are not local-only notes.

They are loaded from and saved to the database through:

* `GET /issues/:id/comments?projectId=<id>`
* `POST /issues/:id/comments`

Each comment shown in the modal is backed by a `comments` row plus the related comment author from `users`.

### 2.4 Current Workspace Data Loading

`IssuesContext` currently loads:

* a tree view for hierarchy (`getTree`)
* a flat list for board/list/progress (`getAll`)
* individual detail payloads (`getOne`)

This means the frontend is already aligned with the current schema fields on `issues`, `board_columns`, `issue_links`, and `comments`.

---

## 3. Current Backend State Driven by the Database

### 3.1 Current Issue Module Behavior

The current issues module reads and writes directly to `issues`, `issue_links`, and `comments`.

Implemented issue-related backend capabilities:

* create issue
* list issues
* get issue tree
* get Kanban issues
* search issues
* get issue detail
* update issue
* delete issue
* mark EPIC complete
* list comments
* create comment

### 3.2 Current Dynamic Kanban Behavior

The `BoardColumnsModule` is now part of the backend application.

Current backend column rules:

* Columns are project-scoped.
* First board load auto-seeds default columns when none exist:
  * To Do
  * In Progress
  * Done
* Existing issues are backfilled into those columns using current `status`.
* Creating an issue auto-assigns the first board column if the request does not provide `columnId`.
* Deleting the last remaining column is blocked.
* Deleting a column can either:
  * move issues to another column
  * set affected `columnId` values to `null`

### 3.3 Current Validation Rules in Services

The current services enforce:

* EPIC cannot have a parent
* STORY parent must be EPIC
* TASK and BUG parent must be STORY or EPIC
* parent issue must belong to the same project
* circular hierarchy is rejected
* assignee must belong to the project
* reporter must belong to the project
* empty comments are rejected
* comments are limited to 5000 characters

### 3.4 Current RBAC-Relevant Routes

Current issue and board routes are protected by JWT plus permission guard usage.

Relevant current permission names include:

* `READ_ISSUE`
* `CREATE_ISSUE`
* `UPDATE_ISSUE`
* `DELETE_ISSUE`
* `VIEW_COMMENT`
* `ADD_COMMENT`

### 3.5 Current API Contract Notes

Important current contracts:

* `GET /issues/:id` can take `projectId` and is project-aware.
* `DELETE /board-columns/:id` expects body payload: `{ projectId, moveToColumnId? }`.
* The frontend shared DELETE helper was extended to support query params plus JSON body because of this endpoint requirement.

---

## 4. Enums Reference

These are the actual enums currently present in `schema.prisma`.

| Enum | Values |
|---|---|
| `IssueType` | `EPIC`, `STORY`, `TASK`, `BUG` |
| `IssueLinkType` | `BLOCKS`, `DEPENDS_ON`, `RELATES_TO`, `DUPLICATES` |
| `IssueStatus` | `TODO`, `IN_PROGRESS`, `DONE` |
| `IssuePriority` | `LOW`, `MEDIUM`, `HIGH` |
| `Visibility` | `PRIVATE`, `PUBLIC` |

---

## 5. Current Table Groups

### 5.1 Full Current Inventory

| Domain | Tables | Status |
|---|---|---|
| Auth | `users` | Implemented |
| Project Core | `projects`, `project_tags`, `team_leads`, `team_members`, `metrics` | Implemented |
| Teams | `teams`, `team_participants` | Implemented |
| Tasks | `tasks`, `task_assignees` | Legacy but still present |
| RBAC | `roles`, `modules`, `permissions`, `role_permissions`, `user_roles` | Implemented |
| Issues and Collaboration | `issues`, `board_columns`, `issue_links`, `comments` | Implemented |

### 5.2 Table Count Check

Current table count = 19

1. `users`
2. `projects`
3. `project_tags`
4. `team_leads`
5. `team_members`
6. `metrics`
7. `tasks`
8. `task_assignees`
9. `teams`
10. `team_participants`
11. `roles`
12. `modules`
13. `permissions`
14. `role_permissions`
15. `user_roles`
16. `issues`
17. `board_columns`
18. `issue_links`
19. `comments`

---

## 6. Key Current Models

### 6.1 Project

Current project model additions relevant to the present board system:

```prisma
model Project {
  id           String        @id @default(uuid())
  projectID    String        @unique
  projectKey   String?       @unique
  visibility   Visibility    @default(PRIVATE)
  createdById  String?

  issues       Issue[]
  userRoles    UserRole[]
  boardColumns BoardColumn[]
}
```

Meaning:

* Projects own issues.
* Projects own board columns.
* Project identity can be resolved by either `id` or `projectID` in service logic.

### 6.2 Issue

Current issue model fields that matter most to the running app:

```prisma
model Issue {
  id          String        @id @default(uuid())
  issueKey    String        @unique
  type        IssueType
  title       String
  description String?
  status      IssueStatus   @default(TODO)
  priority    IssuePriority @default(MEDIUM)
  isCompleted Boolean       @default(false)

  parentId    String?
  parent      Issue?        @relation("IssueChildren", fields: [parentId], references: [id], onDelete: SetNull)
  children    Issue[]       @relation("IssueChildren")

  sourceLinks IssueLink[]   @relation("SourceIssue")
  targetLinks IssueLink[]   @relation("TargetIssue")
  comments    Comment[]

  projectId   String
  assigneeId  String?
  reporterId  String?
  estimate    String?
  dueDate     DateTime?

  columnId    String?
  column      BoardColumn?  @relation(fields: [columnId], references: [id], onDelete: SetNull)
}
```

Current design interpretation:

* `status` is still the workflow field.
* `columnId` is the board placement field.
* `isCompleted` is mainly used for EPIC completion.
* `parentId` provides the hierarchy.
* comments are directly attached to issues.

### 6.3 BoardColumn

```prisma
model BoardColumn {
  id        String   @id @default(uuid())
  name      String
  position  Int
  color     String   @default("#5B8FEF")
  projectId String

  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  issues    Issue[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([projectId])
  @@index([projectId, position])
  @@map("board_columns")
}
```

Meaning:

* Columns are fully dynamic.
* Order is controlled by `position`.
* Column display styling can use `color`.

### 6.4 Comment

```prisma
model Comment {
  id        String   @id @default(cuid())
  issueId   String
  userId    String
  content   String
  createdAt DateTime @default(now())

  issue Issue @relation(fields: [issueId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([issueId, createdAt])
  @@index([userId])
  @@map("comments")
}
```

Meaning:

* Comments are first-class persisted entities.
* Comment history is append-only in the current implementation.
* Comment edit/delete is not implemented yet.

### 6.5 IssueLink

```prisma
model IssueLink {
  id            String        @id @default(cuid())
  linkType      IssueLinkType
  sourceIssueId String
  targetIssueId String

  @@unique([sourceIssueId, targetIssueId, linkType])
  @@index([sourceIssueId])
  @@index([targetIssueId])
  @@map("issue_links")
}
```

Meaning:

* Links are directional and typed.
* Duplicate links with the same type are prevented.

---

## 7. Relationships Summary

### 7.1 Core Relationship Table

| From | To | Type | Current Use |
|---|---|---|---|
| `users` | `projects` | 1 -> N | creator via `createdById` |
| `users` | `issues` | 1 -> N | assignee |
| `users` | `issues` | 1 -> N | reporter |
| `users` | `comments` | 1 -> N | author |
| `projects` | `issues` | 1 -> N | work items |
| `projects` | `board_columns` | 1 -> N | Kanban configuration |
| `projects` | `user_roles` | 1 -> N | project-scoped RBAC |
| `issues` | `issues` | 1 -> N | hierarchy via `parentId` |
| `issues` | `comments` | 1 -> N | comment thread |
| `issues` | `issue_links` | 1 -> N | source links |
| `issues` | `issue_links` | 1 -> N | target links |
| `board_columns` | `issues` | 1 -> N | current board placement |
| `roles` | `role_permissions` | 1 -> N | global permission mapping |
| `roles` | `user_roles` | 1 -> N | project role assignment |
| `modules` | `permissions` | 1 -> N | permission catalog |

### 7.2 Current Conceptual Flow

```text
Project
  -> BoardColumns
  -> Issues
       -> parent/children hierarchy
       -> source/target issue links
       -> comments
       -> assignee user
       -> reporter user

Project
  -> UserRoles
       -> Role
            -> RolePermissions
                 -> Permission
                      -> Module
```

### 7.3 Current Board Interpretation

Board placement is currently:

* `issues.columnId = <board_column_id>`

Not currently implemented:

* Scrum board tables
* sprint tables
* backlog table
* sprint history table

---

## 8. Business Rules and Constraints

### 8.1 Current Database-Level Rules

| Area | Current Rule |
|---|---|
| Issue key | `issueKey` is unique |
| User email | `email` is unique |
| Project ID | `projectID` is unique |
| Project key | `projectKey` is unique when present |
| Issue link duplication | unique on `sourceIssueId + targetIssueId + linkType` |
| User project role | `@@unique([userId, projectId])` |

### 8.2 Current Service-Level Rules

| Area | Current Rule |
|---|---|
| Hierarchy | EPIC cannot have parent |
| Hierarchy | STORY parent must be EPIC |
| Hierarchy | TASK/BUG parent must be STORY or EPIC |
| Hierarchy | parent must belong to the same project |
| Hierarchy | circular parent chain is rejected |
| Assignee | assignee must exist in `user_roles` for the project |
| Reporter | reporter must exist in `user_roles` for the project |
| Comments | empty content rejected after trim |
| Comments | length capped at 5000 |
| Board Columns | last remaining column cannot be deleted |
| Board Columns | deleted column can move issues or nullify `columnId` |
| EPIC Status | standard update cannot change EPIC status |

### 8.3 Current Dynamic Column Rule

The current model is hybrid:

* `status` represents workflow state.
* `columnId` represents board location.

This is important because the current Kanban board is column-driven while other surfaces like progress/status summaries still rely on `status`.

---

## 9. Migration and Sync Status

### 9.1 Committed Migration History

These migration folders are currently committed:

1. `20260326100451_init`
2. `20260326101935_add_indexes_and_task_fk`
3. `20260326102836_add_users_table`
4. `20260330101617_phase1_rbac_foundation`
5. `20260330105501_add_unique_user_role_per_project`
6. `20260330140000_cleanup_rbac_phase2`
7. `20260401083210_add_issues_hierarchy`

### 9.2 Current Gap Between Schema and Migration Folders

Current reality:

* `schema.prisma` includes `board_columns` and `comments`.
* The local database was synced to that schema.
* No dedicated committed migration folder for these two additions exists yet.

### 9.3 Current Operational Status

Verified in the latest work session:

* Prisma client generation succeeded.
* Local database sync succeeded.
* Backend build succeeded.
* Frontend TypeScript check succeeded.

### 9.4 Deployment Recommendation

Before production deployment, add a proper Prisma migration for:

* `board_columns`
* `comments`
* `issues.columnId`
* project/user/issue relation additions tied to those models

---

## 10. Known Gaps

* No committed Prisma migration folder yet for `board_columns` and `comments`
* No dedicated index on `issues.columnId` yet
* Comment edit/delete is not implemented
* Legacy `tasks` and `task_assignees` still coexist with issue-first architecture
* The current repo does not yet implement Scrum board/sprint tables despite earlier architecture planning documents

---

## 11. CHANGES DONE AT 2026-04-08

### Frontend

* Updated the workspace board to render database-driven board columns.
* Added board filter support for Recently Updated and Assigned to Me.
* Improved responsive column sizing so horizontal scroll begins only after more than 5 columns.
* Added hidden-scrollbar behavior while preserving scroll.
* Fixed issue-card and column action menu clipping with fixed-position menus.
* Fixed list-view scroll behavior and sticky header layout.
* Expanded the issue detail modal to support editing assignee, reporter, priority, parent, estimate, and due date through API-backed saves.
* Added frontend comment loading and creation in the issue detail modal.
* Extended the shared DELETE helper to support JSON request bodies.

### Backend

* Added the `BoardColumnsModule` and all board-column CRUD/reorder/delete endpoints.
* Implemented default-column seeding and status-to-column backfill.
* Added `columnId` support to issue create/update/read paths.
* Added `reporterId` support to issue updates with membership validation.
* Added comment DTO, comment routes, and comment service logic.
* Made issue detail lookups project-aware.
* Tightened hierarchy validation to enforce same-project parents.
* Fixed backend TypeScript compatibility by changing `ignoreDeprecations` to `5.0`.

### Database

* Added `board_columns` to the current Prisma schema.
* Added `comments` to the current Prisma schema.
* Added optional `columnId` relation on `issues`.
* Added comment relations on `users` and `issues`.
* Synced the local database and regenerated Prisma client.

### Verification

* Prisma generation succeeded.
* Local database sync succeeded.
* Backend build succeeded.
* Frontend type check succeeded.