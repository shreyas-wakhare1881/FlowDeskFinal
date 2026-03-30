# RBAC Schema — Role-Based Access Control Design
### Project Management Tool (Jira-Level, Project-Context Architecture)

---

## Version Changelog

| # | Area | Version 1.0 | Version 2.0 (Current) |
|---|---|---|---|
| 1 | **Role Scope** | Roles were global — one role applied everywhere | Roles are project-scoped — same user can have different roles in different projects |
| 2 | **`user_roles` table** | `(user_id, role_id)` — no project context | `(user_id, role_id, project_id)` — scoped to a specific project |
| 3 | **`projects` table** | Not present | New table added — provides context for all RBAC evaluations |
| 4 | **Permission resolution** | Static — role had fixed permissions globally | Dynamic — system resolves permissions based on `(user_id, project_id)` at runtime |
| 5 | **Core architecture flow** | `User → Role → Permission → Module` | `User → Role (within a Project) → Permission → Module` |
| 6 | **`role_permissions` audit** | Only `granted_at` timestamp | Added `granted_by FK → users.id` for full audit trail |
| 7 | **Timestamps** | Inconsistent — some tables missing `updated_at` | All tables have `created_at` and `updated_at` where applicable |
| 8 | **Role examples** | Generic role names (Manager, Developer) | Named users (Shreyas, Priya, Rahul) with real project context (Alpha, Beta, Gamma) |
| 9 | **Cross-project example** | Not present | Added — shows same user holding different roles across 3 projects |
| 10 | **Project-Based RBAC section** | Not present | New section added — explains permission resolution flow step-by-step |
| 11 | **Scalability section** | Mentioned project-scoping as a "future enhancement" | Project-based RBAC presented as current, live implementation |
| 12 | **Conclusion** | 4-layer architecture | Upgraded to 5-layer: User → Role (per Project) → Permission → Module |
| 13 | **Document version** | v1.0 | v2.0 |

---

## 1. Introduction

### What is RBAC?

Role-Based Access Control (RBAC) is a security model where access to system resources is granted based on a user's **role** within an organization, not directly to the user. Instead of assigning permissions one-by-one to every user, you assign **roles** to users and **permissions** to roles.

### Why This Design is Similar to Jira

Jira uses a structured permission scheme where:
- Workspace admins, project managers, developers, and clients all have **different levels of access**
- Permissions are tied to **specific actions on specific modules** (e.g., "Create Issue in Project X")
- Roles are assigned **per project** — the same user can be a Manager in one project and a Developer in another
- The system determines what a user can do **dynamically based on which project they are accessing**

This document implements that exact philosophy — project-scoped roles, granular permissions per module, and zero hardcoding.

### Why `Permission = Action + Module` is Important

A permission is **not just a label** like `"can_do_stuff"`. It must answer two questions:
1. **What action?** (CREATE, READ, UPDATE, DELETE)
2. **On which module?** (Task, Project, Team, Report)

This makes permissions **granular, traceable, and auditable** — critical for production systems.

---

## 2. Core Architecture Explanation

### The Flow

```
User → Role (within a Project) → Permission → Module
```

| Layer | What it means |
|---|---|
| **User** | A person using the system (Developer, Manager, Client) |
| **Project** | The context in which a user's role is evaluated |
| **Role** | A named job function assigned to a user **within a specific project** |
| **Permission** | A specific allowed action (e.g., CREATE_TASK, VIEW_PROJECT) |
| **Module** | A functional area of the system (e.g., Tasks, Projects, Teams) |

### Why Project Context Is Critical

- **Roles are NOT global** — A role only applies within the project it was assigned in
- **Same user, different behavior** — Shreyas can be a Manager in Project Alpha and a Developer in Project Beta simultaneously
- **System-determined permissions** — The system evaluates what a user can do based on their role in the current project context. The user never selects a role manually
- **Permissions are dynamic** — When a user switches between projects, their permission set changes automatically

### Why This Separation Matters

- **User ↔ Role (per project)** — One user can hold different responsibilities across different projects
- **Role ↔ Permission** — Roles bundle relevant permissions together without hardcoding them
- **Permission ↔ Module** — Permissions always belong to a module, keeping access scoped and auditable

### Real-World Analogy

> Think of a **consulting firm**. An engineer (user) can be a **Team Lead** (role) on the Banking project and a **Junior Developer** (role) on the E-commerce project. The firm (system) knows what they can do in each project — the engineer doesn't choose their own role.

---

## 3. Database Schema Design

### Table: `projects`

**Purpose:** Represents a project in the system. Every role assignment is scoped to a project — this is the central context for all RBAC evaluations.

| Column | Type | Constraint | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `name` | VARCHAR(150) | NOT NULL | Project name |
| `description` | TEXT | NULLABLE | What this project is about |
| `created_by` | UUID | FK → users.id, NOT NULL | User who created the project |
| `is_active` | BOOLEAN | DEFAULT true | Soft delete / archive |
| `created_at` | TIMESTAMP | DEFAULT NOW() | When project was created |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last modification time |

**FK:** `created_by` references `users(id)` with `ON DELETE SET NULL`

---

### Table: `users`

**Purpose:** Stores all registered users of the system.

| Column | Type | Constraint | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `name` | VARCHAR(100) | NOT NULL | Full name |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Login email |
| `password_hash` | TEXT | NOT NULL | Bcrypt hashed password |
| `is_active` | BOOLEAN | DEFAULT true | Soft enable/disable |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Account creation time |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last updated time |

---

### Table: `roles`

**Purpose:** Defines named roles that can be assigned to users within a project. Roles are templates — they get their power from the permissions attached to them.

| Column | Type | Constraint | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `name` | VARCHAR(50) | UNIQUE, NOT NULL | e.g., SuperAdmin, Manager |
| `description` | TEXT | NULLABLE | Human-readable explanation |
| `created_at` | TIMESTAMP | DEFAULT NOW() | When this role was defined |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last updated time |

**Predefined Roles:**

| Role Name | Description |
|---|---|
| `SuperAdmin` | Full system access |
| `Manager` | Project + task management |
| `Developer` | Task execution and updates |
| `Client` | Read-only project visibility |

---

### Table: `modules`

**Purpose:** Represents functional areas of the application that can be access-controlled. Modules are stable reference data — they rarely change.

| Column | Type | Constraint | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `name` | VARCHAR(50) | UNIQUE, NOT NULL | e.g., TASKS, PROJECTS |
| `description` | TEXT | NULLABLE | Module explanation |
| `created_at` | TIMESTAMP | DEFAULT NOW() | When module was registered |

**Predefined Modules:**

| Module Name | Description |
|---|---|
| `TASKS` | Task creation, assignment, status |
| `PROJECTS` | Project CRUD and settings |
| `TEAMS` | Team member management |
| `REPORTS` | Analytics and reporting |
| `USERS` | User management (admin only) |
| `COMMENTS` | Task/project comments |

---

### Table: `permissions`

**Purpose:** Defines granular actions that can be performed on a specific module. A permission always answers: **What action? On which module?** This is the atomic unit of access control.

| Column | Type | Constraint | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `name` | VARCHAR(100) | UNIQUE, NOT NULL | e.g., CREATE_TASK |
| `action` | ENUM | NOT NULL | CREATE, READ, UPDATE, DELETE, MANAGE |
| `module_id` | UUID | FK → modules.id, NOT NULL | Which module this belongs to |
| `description` | TEXT | NULLABLE | What this permission allows |
| `created_at` | TIMESTAMP | DEFAULT NOW() | When permission was defined |

**FK:** `module_id` references `modules(id)` with `ON DELETE CASCADE`

---

### Table: `user_roles` (Mapping)

**Purpose:** Assigns a role to a user **within the context of a specific project**. This is the core table that makes RBAC project-scoped. The same user can appear in this table multiple times with different roles for different projects.

| Column | Type | Constraint | Description |
|---|---|---|---|
| `user_id` | UUID | FK → users.id, NOT NULL | The user |
| `role_id` | UUID | FK → roles.id, NOT NULL | The role assigned |
| `project_id` | UUID | FK → projects.id, NOT NULL | The project this role applies to |
| `assigned_at` | TIMESTAMP | DEFAULT NOW() | When role was assigned |
| `assigned_by` | UUID | FK → users.id, NULLABLE | Who assigned it (Manager/Admin) |

**PK:** Composite `(user_id, role_id, project_id)`

**FKs:**
- `user_id` → `users(id)` ON DELETE CASCADE
- `role_id` → `roles(id)` ON DELETE CASCADE
- `project_id` → `projects(id)` ON DELETE CASCADE

> **Key Point:** The combination of `(user_id, project_id)` tells the system what role a user holds in a given project. Permissions are then resolved from that role via `role_permissions`.

---

### Table: `role_permissions` (Mapping)

**Purpose:** Defines which permissions a role grants. This is a global mapping — if a role has a permission, it applies in every project where that role is assigned.

| Column | Type | Constraint | Description |
|---|---|---|---|
| `role_id` | UUID | FK → roles.id, NOT NULL | The role |
| `permission_id` | UUID | FK → permissions.id, NOT NULL | The granted permission |
| `granted_at` | TIMESTAMP | DEFAULT NOW() | When this permission was linked to the role |
| `granted_by` | UUID | FK → users.id, NULLABLE | Admin who configured this mapping |

**PK:** Composite `(role_id, permission_id)`

**FKs:**
- `role_id` → `roles(id)` ON DELETE CASCADE
- `permission_id` → `permissions(id)` ON DELETE CASCADE

---

## 4. ER Diagram (Without Columns)

```
┌──────────┐      ┌────────────┐      ┌─────────────┐
│  users   │──────│ user_roles │──────│    roles    │
└──────────┘ M:M  └─────┬──────┘ M:M  └──────┬──────┘
                        │                     │
                        │ M:1                 │ M:M
                        │                     │
                  ┌─────────┐       ┌──────────────────┐
                  │projects │       │ role_permissions  │
                  └─────────┘       └──────────────────┘
                                               │
                                               │ M:1
                                               │
                                    ┌──────────────────┐
                                    │   permissions    │
                                    └──────────────────┘
                                               │
                                               │ M:1
                                               │
                                         ┌─────────┐
                                         │ modules │
                                         └─────────┘
```

**Relationships:**
- `users` ↔ `roles` → Many-to-Many via `user_roles` (scoped by project)
- `user_roles` → `projects` → Many-to-One (each assignment belongs to one project)
- `roles` ↔ `permissions` → Many-to-Many via `role_permissions`
- `permissions` → `modules` → Many-to-One

---

## 5. ER Diagram (With Columns)

```
┌──────────────────────────┐          ┌─────────────────────────┐
│          users           │          │          roles          │
├──────────────────────────┤          ├─────────────────────────┤
│ PK  id           UUID    │          │ PK  id         UUID     │
│     name         VARCHAR │          │     name       VARCHAR  │
│     email        VARCHAR │          │     description TEXT    │
│     password_hash TEXT   │          │     created_at TIMESTAMP│
│     is_active    BOOLEAN │          │     updated_at TIMESTAMP│
│     created_at TIMESTAMP │          └──────────────┬──────────┘
│     updated_at TIMESTAMP │                         │
└────────────┬─────────────┘                         │
             │                                       │
             │          ┌──────────────────────────┐  │
             │          │         projects         │  │
             │          ├──────────────────────────┤  │
             │          │ PK  id         UUID      │  │
             │          │     name       VARCHAR   │  │
             │          │     description TEXT     │  │
             │          │ FK  created_by UUID──────│──┘ users.id
             │          │     is_active   BOOLEAN  │
             │          │     created_at TIMESTAMP │
             │          │     updated_at TIMESTAMP │
             │          └──────────┬───────────────┘
             │                     │
             └──────────┐          │
                        ▼          ▼
              ┌────────────────────────────┐
              │         user_roles         │
              ├────────────────────────────┤
              │ FK  user_id    UUID        │──→ users.id
              │ FK  role_id    UUID        │──→ roles.id
              │ FK  project_id UUID        │──→ projects.id
              │     assigned_at TIMESTAMP  │
              │ FK  assigned_by UUID       │──→ users.id
              └────────────────────────────┘

┌─────────────────────────┐          ┌──────────────────────────┐
│          roles          │          │       permissions        │
├─────────────────────────┤          ├──────────────────────────┤
│ PK  id         UUID     │          │ PK  id         UUID      │
│     name       VARCHAR  │          │     name       VARCHAR   │
│     description TEXT    │          │     action     ENUM      │
└────────────┬────────────┘          │ FK  module_id  UUID      │──→ modules.id
             │                       │     description TEXT     │
             │                       │     created_at TIMESTAMP │
             └────────┐   ┌──────────┘
                      ▼   ▼
          ┌────────────────────────────┐
          │      role_permissions      │
          ├────────────────────────────┤
          │ FK  role_id       UUID     │──→ roles.id
          │ FK  permission_id UUID     │──→ permissions.id
          │     granted_at  TIMESTAMP  │
          │ FK  granted_by  UUID       │──→ users.id
          └────────────────────────────┘

┌──────────────────────────┐
│         modules          │
├──────────────────────────┤
│ PK  id          UUID     │
│     name        VARCHAR  │
│     description TEXT     │
│     created_at TIMESTAMP │
└──────────────────────────┘
```

---

## 6. Permission Design

### Structure

Every permission follows this naming convention:

```
{ACTION}_{MODULE}
```

### Action Types (ENUM)

| Action | Description |
|---|---|
| `CREATE` | Add new records |
| `READ` | View/list records |
| `UPDATE` | Modify existing records |
| `DELETE` | Remove records |
| `MANAGE` | Full control (all of above) |

### Permission Examples

| Permission Name | Action | Module |
|---|---|---|
| `CREATE_TASK` | CREATE | TASKS |
| `READ_TASK` | READ | TASKS |
| `UPDATE_TASK` | UPDATE | TASKS |
| `DELETE_TASK` | DELETE | TASKS |
| `MANAGE_TASKS` | MANAGE | TASKS |
| `CREATE_PROJECT` | CREATE | PROJECTS |
| `VIEW_PROJECT` | READ | PROJECTS |
| `UPDATE_PROJECT` | UPDATE | PROJECTS |
| `DELETE_PROJECT` | DELETE | PROJECTS |
| `MANAGE_USERS` | MANAGE | USERS |
| `VIEW_REPORTS` | READ | REPORTS |
| `MANAGE_TEAM` | MANAGE | TEAMS |
| `ADD_COMMENT` | CREATE | COMMENTS |
| `VIEW_COMMENT` | READ | COMMENTS |

### How They Map to Modules

```
modules.TASKS
  ├── CREATE_TASK
  ├── READ_TASK
  ├── UPDATE_TASK
  └── DELETE_TASK

modules.PROJECTS
  ├── CREATE_PROJECT
  ├── VIEW_PROJECT
  ├── UPDATE_PROJECT
  └── DELETE_PROJECT

modules.USERS
  └── MANAGE_USERS

modules.REPORTS
  └── VIEW_REPORTS
```

---

## 7. Role-Based Access Examples

> All examples are **project-scoped**. Permissions are evaluated dynamically based on which project the user is currently accessing.

---

### SuperAdmin

SuperAdmin operates globally — not scoped to a single project. This is the only role that has system-wide access.

**Flow:** `Shreyas (SuperAdmin)` → All Permissions → All Modules → All Projects

| Permission | Module |
|---|---|
| MANAGE_TASKS | TASKS |
| MANAGE_PROJECTS | PROJECTS |
| MANAGE_USERS | USERS |
| MANAGE_TEAMS | TEAMS |
| VIEW_REPORTS | REPORTS |
| MANAGE_COMMENTS | COMMENTS |

---

### Manager — in Project Alpha

**Flow:** `Priya (Manager in Project Alpha)` → Project + Task control → PROJECTS, TASKS, TEAMS, COMMENTS

Priya is assigned the `Manager` role **only for Project Alpha**. In Project Beta, she may be a Developer.

| Permission | Module |
|---|---|
| CREATE_PROJECT | PROJECTS |
| UPDATE_PROJECT | PROJECTS |
| VIEW_PROJECT | PROJECTS |
| CREATE_TASK | TASKS |
| UPDATE_TASK | TASKS |
| DELETE_TASK | TASKS |
| READ_TASK | TASKS |
| MANAGE_TEAM | TEAMS |
| VIEW_REPORTS | REPORTS |
| ADD_COMMENT | COMMENTS |

---

### Developer — in Project Beta

**Flow:** `Rahul (Developer in Project Beta)` → Task execution → TASKS, COMMENTS

Rahul can only update tasks and comment. He cannot create projects or manage teams in this project.

| Permission | Module |
|---|---|
| READ_TASK | TASKS |
| UPDATE_TASK | TASKS |
| VIEW_PROJECT | PROJECTS |
| ADD_COMMENT | COMMENTS |
| VIEW_COMMENT | COMMENTS |

---

### Client — in Project Gamma

**Flow:** `Acme Corp Client (Client in Project Gamma)` → Read-only → PROJECTS, TASKS

The client can only view progress — no write access at all.

| Permission | Module |
|---|---|
| VIEW_PROJECT | PROJECTS |
| READ_TASK | TASKS |
| VIEW_COMMENT | COMMENTS |

---

### Cross-Project Example: Same User, Different Roles

**User: Shreyas**

| Project | Role Assigned | Permissions Active |
|---|---|---|
| Project Alpha | Manager | CREATE_TASK, DELETE_TASK, MANAGE_TEAM, VIEW_REPORTS... |
| Project Beta | Developer | READ_TASK, UPDATE_TASK, VIEW_PROJECT, ADD_COMMENT |
| Project Gamma | Client | VIEW_PROJECT, READ_TASK, VIEW_COMMENT |

> The system determines Shreyas's permissions automatically based on which project he is working in. He never picks a role — the system resolves it from `user_roles` using `(user_id, project_id)`.

---

### Summary Table

| Role | Scope | Modules Accessible | Access Level |
|---|---|---|---|
| SuperAdmin | Global | All | Full CRUD + Manage |
| Manager | Per Project | Projects, Tasks, Teams, Reports | Create, Update, Delete, Read |
| Developer | Per Project | Tasks, Projects (view), Comments | Read + Update Tasks |
| Client | Per Project | Projects, Tasks, Comments | Read Only |

---

## 8. Important Mistake to Avoid ⚠️

### ❌ WRONG: Role → Module (Direct Link)

```
roles ─────────────────────────► modules
         direct FK/mapping
```

This is a **common beginner mistake**. In this pattern:
- You create a table like `role_modules(role_id, module_id)`
- A role gets "access to a module" as a whole
- There is **no concept of what action** is allowed

**Why this is bad:**
- Tight coupling — you can't say "Developer can READ tasks but not DELETE them"
- No granularity — it's all-or-nothing per module
- Inflexible — adding a new module means manually updating roles
- Not auditable — you can't trace "what exactly can this role do?"

---

### ✅ CORRECT: Role → Permission → Module

```
roles ──► role_permissions ──► permissions ──► modules
```

**Why this is right:**
- A role gets **specific permissions**, not entire modules
- Permissions are scoped: `action` + `module` = full clarity
- New permissions can be added without changing role structure
- Roles can be customized granularly (e.g., Manager can UPDATE but not DELETE projects)
- Fully auditable: "User X has Role Y which grants Permission Z on Module W"

---

## 9. Project-Based RBAC

### How It Works

Project-based RBAC means that **a user's permissions are always evaluated relative to the project they are operating in**. There is no global role (except SuperAdmin). Every other role only has meaning within a project.

**Example:**

| User | Project | Role | Result |
|---|---|---|---|
| Shreyas | Project Alpha | Manager | Can create/delete tasks, manage team |
| Shreyas | Project Beta | Developer | Can only update tasks and comment |
| Priya | Project Beta | Manager | Full task and team control in Beta |
| External Client | Project Gamma | Client | View-only access |

### How the System Resolves Permissions

When a user performs an action, the system:

1. Reads `user_roles` → finds the role for this `(user_id, project_id)`
2. Reads `role_permissions` → gets all permissions for that role
3. Checks if the required permission (`action + module`) is in the list
4. Grants or denies access

```
REQUEST: "Can Shreyas CREATE_TASK in Project Alpha?"

  1. user_roles WHERE user_id = Shreyas AND project_id = Alpha
     → role = Manager

  2. role_permissions WHERE role_id = Manager
     → [CREATE_TASK, UPDATE_TASK, DELETE_TASK, MANAGE_TEAM, ...]

  3. Is CREATE_TASK in list?
     → YES → ✅ Access Granted
```

### Benefits

- **Jira-like flexibility** — same user, different responsibilities per project
- **No manual role selection** — system resolves access automatically
- **Safe by default** — users have no permissions outside projects they are assigned to
- **Auditable** — every access decision can be traced to a `user_roles` row

---

## 10. Scalability & Jira-Level Design Thinking

### Adding New Modules

When a new feature is added (e.g., INVOICES module):

1. Insert a row into `modules`: `{ name: 'INVOICES' }`
2. Insert permissions: `CREATE_INVOICE`, `VIEW_INVOICE`, etc.
3. Map permissions to roles via `role_permissions`
4. **Zero schema change. Zero code change.**

---

### Adding New Roles

Want a custom role "Senior Developer" with extra permissions?

1. Insert a row into `roles`
2. Map permissions in `role_permissions`
3. Assign users in `user_roles` with `project_id`
4. **No migration required — pure data operation**

---

### Adding New Projects

New project onboarded? Just:

1. Insert into `projects`
2. Assign team members via `user_roles` with the new `project_id`
3. Each member gets their role — permissions follow automatically

---

### How This Matches Jira's Philosophy

| Jira Feature | Our Design Equivalent |
|---|---|
| Permission Schemes | `role_permissions` mapping |
| Project Roles | `roles` + `user_roles` (scoped by `project_id`) |
| Issue Operations | `permissions.action` |
| Project Components | `modules` table |
| Global Permissions | SuperAdmin role (not project-scoped) |
| Per-project role overrides | Multiple rows in `user_roles` with different `project_id` |
| Role assignment audit | `assigned_at`, `assigned_by` in `user_roles` |

### Why This Design is Scalable

- **Project-native** — project context is baked into the schema, not bolted on
- **Roles and permissions are pure data** — no code changes needed to add or modify
- **Audit ready** — every assignment and permission grant is timestamped and attributed
- **Cache friendly** — permission sets per `(user_id, project_id)` can be cached (Redis/in-memory) and invalidated on role change
- **Extensible** — supports field-level permissions, time-limited roles, and delegation in the future without schema redesign

---

## 11. Conclusion

This RBAC design implements a production-grade, project-scoped access control system that mirrors the architecture of Jira, Confluence, and enterprise SaaS platforms.

### Key Strengths

| Property | Detail |
|---|---|
| **Clean Architecture** | 5-layer separation: User → Role (per Project) → Permission → Module |
| **Project-Scoped Roles** | Same user can hold different roles in different projects |
| **Dynamic Permission Resolution** | System determines access automatically — no user input needed |
| **Flexibility** | Roles and permissions are pure data — fully configurable without code changes |
| **Security** | Principle of Least Privilege enforced at DB level; users have no access outside assigned projects |
| **Auditability** | All assignments and grants are timestamped with `assigned_by` / `granted_by` |
| **Scalability** | New modules, roles, and projects require only data inserts — zero schema changes |
| **No Hardcoding** | Permissions are never embedded in code, enums, or role definitions |
| **Industry Standard** | Mirrors the permission model of Jira, Confluence, GitHub, and Notion |

> This schema is production-ready and serves as the foundation for a scalable, Jira-level project management platform.

---

*Document Version: 2.0 (Project-Based RBAC) | Designed for FlowDesk PM Tool | March 2026*
