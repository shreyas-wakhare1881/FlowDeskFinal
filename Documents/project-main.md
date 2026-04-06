# 🧠 PROJECT CONTEXT – FLOWDESK (MASTER MEMORY FILE)

> **Repo:** https://github.com/shreyas-wakhare1881/pm-tool-.git
> **Branch:** main
> **Last Verified:** 2026-04-06
> **Maintained by AI for consistent multi-session context**

---

## 1. 📌 PROJECT OVERVIEW

A Jira-like Project Management System designed for scalable team collaboration with:

* Hierarchical task model (Epics → Stories → Tasks → Bugs)
* RBAC system with project-scoped roles
* Kanban board with accordion structure
* Clean, minimal UI inspired by Jira/Linear
* Issue linking (Blocks, Depends On, Relates To, Duplicates)

---

## 2. 🏗️ SYSTEM ARCHITECTURE

### Frontend
* **Framework:** Next.js 16 (App Router), React 19
* **Styling:** Tailwind CSS
* **State:** React Context providers (no Redux — replaced with Context)
* **Port:** `http://localhost:3000`

### Backend
* **Framework:** NestJS 11, TypeScript
* **Architecture:** Module-based (one module per domain)
* **Auth:** JWT-based with JWT Strategy + Guards
* **RBAC:** Permission-based guards with decorator-driven enforcement
* **Port:** `http://localhost:3001/api`

### Database
* **Provider:** PostgreSQL
* **ORM:** Prisma (with `prisma.config.ts`)
* **Dev fallback:** SQLite via `prisma generate --config prisma.config.ts`

### Integrations
* None yet (future: Trading APIs / analytics if extended)

---

## 3. 🎨 FRONTEND DETAILS

### Tech Stack
* Next.js 16 + App Router + Route Groups
* React 19 + TypeScript
* Tailwind CSS
* React Context for state (no external state library)

### Folder Structure
```
frontend/src/
├── app/
│   ├── layout.tsx                          # Root layout + Providers wrapper
│   ├── page.tsx                            # Redirects to /dashboard
│   ├── favicon.ico
│   ├── globals.css
│   ├── Providers.tsx                       # Aggregates all context providers
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx                    # Login page
│   │   └── register/
│   │       └── page.tsx                    # Register page
│   ├── (dashboard)/
│   │   ├── create/
│   │   │   └── page.tsx                    # Create project page
│   │   ├── create-team/
│   │   │   └── page.tsx                    # Create team page
│   │   ├── dashboard/
│   │   │   └── page.tsx                    # Main dashboard (project list)
│   │   ├── members/
│   │   │   └── page.tsx                    # Project members management
│   │   └── view/
│   │       └── page.tsx                    # Project detail view (task-based)
│   └── (workspace)/
│       ├── layout.tsx                      # Workspace root layout
│       └── workspace/[projectId]/
│           ├── layout.tsx                  # Project workspace layout
│           ├── ws-dashboard/
│           │   └── page.tsx                # Kanban board view
│           ├── ws-view/
│           │   └── page.tsx                # List/table view
│           ├── ws-create-task/
│           │   └── page.tsx                # Create tasks in workspace
│           └── settings/
│               └── page.tsx                # Project settings
├── components/
│   ├── create/
│   │   ├── ClientInfo.tsx                  # Client info form
│   │   ├── FileUpload.tsx                  # File upload component
│   │   ├── LiveSummary.tsx                 # Live project summary preview
│   │   ├── PrioritySelector.tsx            # Priority selector
│   │   ├── ProjectIdentity.tsx             # Project identity form
│   │   ├── RecurringProject.tsx            # Recurring settings
│   │   └── TeamAssignment.tsx              # Team assignment form
│   ├── dashboard/
│   │   ├── ActivityFeed.tsx                # Activity feed widget
│   │   ├── AddPeopleModal.tsx              # Add members modal
│   │   ├── ProjectActionsMenu.tsx          # Project action dropdown
│   │   ├── ProjectCard.tsx                 # Project card in list
│   │   ├── ProjectDetailModal.tsx          # Project detail popup
│   │   ├── StatsCard.tsx                   # Stats display card
│   │   └── TeamPulse.tsx                   # Team activity pulse
│   ├── search/
│   │   ├── GlobalSearch.tsx                # Global search bar
│   │   └── SearchResultItem.tsx            # Search result item card
│   ├── shared/
│   │   ├── AccessDenied.tsx                # 403 access denied page
│   │   ├── NavActions.tsx                  # Navigation action buttons
│   │   ├── PermissionGate.tsx              # RBAC permission gate HOC
│   │   ├── Sidebar.tsx                     # Main sidebar nav
│   │   └── Topbar.tsx                      # Main topbar
│   ├── view/
│   │   ├── BacklogView.tsx                 # Backlog task view
│   │   ├── KanbanBoard.tsx                 # Kanban board (accordion-based)
│   │   ├── ProgressView.tsx                # Progress tracking view
│   │   ├── TableView.tsx                   # Table/list view
│   │   └── ViewSwitcher.tsx                # Switch between view types
│   └── workspace/
│       ├── CreateIssueModal.tsx            # Create hierarchical issues
│       ├── IssueDetailModal.tsx            # View/edit issue details
│       ├── WsSidebar.tsx                   # Workspace sidebar nav
│       └── WsTopbar.tsx                    # Workspace topbar
├── config/
│   └── features.ts                         # Feature flag configuration
├── features/
│   ├── catch-up-feed/
│   │   └── ActivityFeed.tsx                # Activity feed feature
│   ├── team-pulse/
│   │   └── TeamPulse.tsx                   # Team pulse feature
│   ├── create-team/
│   │   └── README.md                       # Feature documentation
│   ├── index.ts                            # Feature barrel export
│   ├── QUICK-START.md
│   └── README.md
├── hooks/
│   └── useAccordion.ts                     # Accordion state hook (Kanban)
├── lib/
│   ├── api.ts                              # Base axios instance + interceptors
│   ├── auth.service.ts                     # Auth API calls
│   ├── issues.service.ts                   # Issue CRUD + hierarchy API
│   ├── projects.service.ts                 # Project API calls
│   ├── tasks.service.ts                    # Task API calls
│   ├── teams.service.ts                    # Team API calls
│   ├── users.service.ts                    # User API calls
│   ├── permissions.ts                      # Permission constants + utils
│   ├── RbacContext.tsx                     # RBAC React context provider
│   ├── IssuesContext.tsx                   # Issues state context
│   ├── IssueModalContext.tsx               # Issue modal context
│   ├── ProjectsContext.tsx                 # Projects state context
│   ├── SidebarContext.tsx                  # Sidebar state context
│   ├── hooks/
│   │   ├── useCurrentUser.ts               # Get current logged-in user hook
│   │   └── usePermissions.ts               # Check permissions hook
│   └── search/
│       ├── SearchContext.tsx               # Search state context
│       ├── searchEngine.ts                 # Client-side search engine
│       ├── searchIndex.ts                  # Search indexing logic
│       ├── types.ts                        # Search types
│       └── README.md
├── types/
│   ├── issue.ts                            # Issue TypeScript types
│   ├── project.ts                          # Project TypeScript types
│   └── task.ts                             # Task TypeScript types
└── (workspace routing uses route groups)
```

### Key Pages
1. **Login / Register** — Auth flow
2. **Dashboard** — Project list with stats cards
3. **Create** — Project creation wizard
4. **View** — Project detail (task-based legacy view)
5. **Workspace** — Per-project workspace (Kanban, table, backlog)
   - `ws-dashboard` — Kanban board with issues
   - `ws-view` — Table/list view
   - `ws-create-task` — Create issues
   - `settings` — Project settings

### State Management (Context-based)
* `Providers` — Aggregates all context providers
* `RbacContext` — Current user's roles/permissions per project
* `ProjectsContext` — Project list and selection
* `IssuesContext` — Issues state within workspace
* `IssueModalContext` — Create/edit issue modal state
* `SidebarContext` — Sidebar open/close state
* `SearchContext` — Global search state

### UI Patterns
* Accordion-based Kanban (Epic → collapsible children)
* Clean, minimal Jira-like aesthetics
* Issue type badges (Epic, Story, Task, Bug)
* Avatar with initials + color
* View switcher (Kanban / Table / Backlog / Progress)

### Key Concepts
* **Epics** = container only (hold child issues)
* **Issues** = hierarchical (Epic → Story → Task → Bug via `parentId`)
* Tasks still exist as legacy table; Issues are the new primary entity
* UI reflects hierarchy with accordion

### Recent Frontend Changes (2026-04-06)
* **IssueDetailModal.tsx** cleaned + bugs fixed:
  - Removed: Activity section, Labels, Team, Deployment,
    Automation, Configure footer, Improve Task button, Epic button, Lock/Eye/Share/More/Expand icons
  - Removed: Title action buttons (+, •••)
  - Top bar issue key clickable → opens workspace (`/workspace/{projectId}/ws-dashboard`) in new tab
  - "Assignee" → "Assign To", Reporter moved below it
  - "Story point estimate" → "Estimate"
  - Status dropdown (To Do / In Progress / Done):
    - Uses confirmed update (API call first, then UI update)
    - If API fails → state reverts, error shown
    - EPIC type → disabled state with tooltip "Status cannot be changed for Epics"
  - Linked work item search enhanced (accordion for stories/epics)
  - Details section is static (no accordion toggle) — arrow button removed
  - Dates (Created, Due Date, Updated) moved into Details section, order: Created → Due Date → Updated
  - Search input text visibility: `placeholder-gray-600 text-gray-800`
  - Modal layout: max-w-6xl, no backdrop blur (simple dim `rgba(0,0,0,0.4)`), left py-6 right 320px
* **issues.service.ts** — added `search(projectId, q)` method
* **backend/issues** — added `GET /issues/search` endpoint

---

## 4. ⚙️ BACKEND DETAILS

### Framework
* NestJS 11 + TypeScript
* Modular architecture (controller → service → repository)
* Prisma for ORM
* JWT authentication with Guards

### Folder Structure
```
backend/
├── prisma/
│   ├── schema.prisma                       # Full DB schema (see Section 5)
│   ├── migrations/                         # DB migrations
│   ├── assign-role.ts                      # Assign role to user script
│   ├── backfill-user-roles.ts              # Backfill roles for existing data
│   └── seed.ts                             # Seed default roles/permissions/modules
├── src/
│   ├── main.ts                             # App bootstrap, CORS, global filters
│   ├── app.module.ts                       # Root module (imports all feature modules)
│   ├── auth/
│   │   ├── auth.controller.ts              # Login, register, me endpoints
│   │   ├── auth.service.ts                 # Auth logic (JWT, bcrypt)
│   │   ├── auth.module.ts
│   │   ├── jwt.strategy.ts                 # JWT passport strategy
│   │   ├── jwt-auth.guard.ts
│   │   ├── dto/
│   │   │   └── auth.dto.ts                 # Login/Register DTOs
│   │   ├── decorators/
│   │   │   └── require-permission.decorator.ts  # @RequirePermission decorator
│   │   └── guards/
│   │       └── permission.guard.ts         # Permission check guard
│   ├── filters/
│   │   └── http-exception.filter.ts        # Global exception filter
│   ├── prisma/
│   │   ├── prisma.service.ts               # PrismaService extends PrismaClient
│   │   └── prisma.module.ts
│   ├── users/
│   │   ├── users.controller.ts             # User CRUD
│   │   ├── users.service.ts
│   │   └── users.module.ts
│   ├── projects/
│   │   ├── projects.controller.ts          # Project CRUD + stats endpoints
│   │   ├── projects.service.ts
│   │   ├── projects.module.ts
│   │   └── dto/
│   │       └── project.dto.ts              # Create/Update project DTOs
│   ├── tasks/
│   │   ├── tasks.controller.ts             # Task CRUD + stats endpoint
│   │   ├── tasks.service.ts
│   │   ├── tasks.module.ts
│   │   └── dto/
│   │       └── tasks.dto.ts                # Create/Update task DTOs
│   ├── issues/
│   │   ├── issues.controller.ts            # Issue CRUD + hierarchy endpoints
│   │   ├── issues.service.ts
│   │   ├── issues.module.ts
│   │   └── dto/
│   │       └── issues.dto.ts               # Create/Update issue DTOs
│   ├── issue-links/
│   │   ├── issue-links.controller.ts       # Issue link CRUD
│   │   ├── issue-links.service.ts
│   │   ├── issue-links.module.ts
│   │   └── issue-links.dto.ts
│   └── teams/
│       ├── teams.controller.ts             # Team CRUD
│       ├── teams.service.ts
│       ├── teams.module.ts
│       └── teams.dto.ts
├── dist/                                   # Built output (auto-generated)
├── .env                                    # Env vars (gitignored)
├── .env.example
├── prisma.config.ts                        # Prisma config for TS
├── package.json
├── .prettierrc
└── .gitignore
```

### Core Modules
1. **Auth** — Login, register, JWT, `@RequirePermission` decorator + PermissionGuard
2. **Users** — User CRUD
3. **Projects** — Project CRUD + stats + `project-id/:projectID` lookup
4. **Tasks** — Task CRUD + stats (legacy table)
5. **Issues** — Issue CRUD + hierarchy (primary entity, supersedes tasks)
6. **IssueLinks** — Issue-to-issue linking (Blocks, Depends On, Relates To, Duplicates)
7. **Teams** — Team CRUD
8. **Prisma** — Database service module

### RBAC Implementation
* **Permission Guard** — Checks user's role permissions at route level
* **@RequirePermission decorator** — Marks required permission on endpoint
* **User → Role → Permission mapping** — Scrolled per project (UserRole composite key: userId + projectId)
* **Global RolePermission** — Role → Permission mapping shared across projects

### Missing / Needs Update ⚠️
* Tasks module still uses old flat structure (not aligned with Issues hierarchy)
* Issue endpoints may not have full RBAC enforcement on all routes
* Project creation does not auto-create role assignments for creator
* Some DTOs do not include `issueType` or hierarchy fields properly
* Backward compatibility between Tasks (legacy) and Issues (new) is unclear

---

## 5. 🗄️ DATABASE SCHEMA

### Tables (18 tables total)

#### Core
| Table | Purpose |
|---|---|
| `users` | Auth — email, name, passwordHash |
| `projects` | Projects with status, priority, team info, visibility |
| `project_tags` | Many-to-many project tags |

#### Teams
| Table | Purpose |
|---|---|
| `teams` | Teams per project with teamID |
| `team_participants` | Team members |
| `team_leads` | Team lead per project |
| `team_members` | Team members list per project (legacy) |

#### Tasks (Legacy)
| Table | Purpose |
|---|---|
| `tasks` | Flat tasks table |
| `task_assignees` | Task-to-assignee mapping |

#### Issues (Primary — Phase 2)
| Table | Purpose |
|---|---|
| `issues` | Hierarchical issues (Epic, Story, Task, Bug) |
| `issue_links` | Cross-issue relationships |

#### RBAC (Phase 1)
| Table | Purpose |
|---|---|
| `roles` | Role definitions (SuperAdmin, Manager, Developer, Client) |
| `modules` | Access-control modules (TASKS, PROJECTS, TEAMS, etc.) |
| `permissions` | Action-on-module (CREATE_TASK, VIEW_PROJECT, etc.) |
| `role_permissions` | Role → Permission mapping (global) |
| `user_roles` | User → Role → Project assignment (composite PK) |

#### Project Metadata
| Table | Purpose |
|---|---|
| `metrics` | Project-level metrics (completion, task counts) |

### Key Relationships
* **User** → Issues (reporter, assignee), Projects (creator), Roles (holder)
* **Project** → Issues, Tasks, Teams, Tags, Members, Metrics, UserRoles
* **Issue** → self-relation via `parentId` for hierarchy
* **Issue** → IssueLink (source, target)
* **Role** → Permissions (via RolePermission), Users (via UserRole)

### Indexes
* `issues`: projectId, parentId, assigneeId, status, type
* `projects`: status, priority, teamID
* `tasks`: projectId, status, dueDate
* `user_roles`: [userId, projectId] composite
* `users`: email
* `permissions`: moduleId

### Enums
* `IssueType`: EPIC, STORY, TASK, BUG
* `IssueLinkType`: BLOCKS, DEPENDS_ON, RELATES_TO, DUPLICATES
* `IssueStatus`: TODO, IN_PROGRESS, DONE
* `IssuePriority`: LOW, MEDIUM, HIGH
* `Visibility`: PRIVATE, PUBLIC

### Migration History
| Migration | What it does |
|---|---|
| `20260326100451_init` | Initial tables (projects, tasks, tags, teams, members, metrics) |
| `20260326101935_add_indexes_and_task_fk` | Added indexes + FK constraints |
| `20260326102836_add_users_table` | Users table added |
| `20260330101617_phase1_rbac_foundation` | RBAC tables (roles, modules, permissions, role_permissions, user_roles) |
| `20260330105501_add_unique_user_role_per_project` | Composite unique on user_roles |
| `20260330140000_cleanup_rbac_phase2` | RBAC cleanup |
| `20260401083210_add_issues_hierarchy` | Issues table + issue_links + enums + self-relation |

---

## 6. 🔐 RBAC SYSTEM

### Roles
| Role | Description |
|---|---|
| `SuperAdmin` | Full system access |
| `Manager` | Same as Super Admin (per updated rule) |
| `Developer` | Standard contributor |
| `Client` | Read-only viewer |

### Permission Model
* Format: `{ACTION}_{MODULE_SUBJECT}` (e.g., `CREATE_TASK`, `VIEW_PROJECT`)
* Actions: CREATE, READ, UPDATE, DELETE, MANAGE
* Modules: TASKS, PROJECTS, TEAMS, REPORTS, COMMENTS, USERS
* `RolePermission` is **global** — if Manager has CREATE_TASK, it applies to all projects
* `UserRole` is **project-scoped** — determines which role a user has in a specific project

### Access Flow
1. User logs in → gets JWT
2. Guard checks `@RequirePermission("CREATE_TASK")` on route
3. Guard resolves user's roleId from UserRole(projectId)
4. Guard checks RolePermission for that roleId
5. Grant or deny (403)

### Special Rules
* Manager = same perms as Super Admin
* One role per user per project (enforced by DB unique constraint)
* `createdById` on projects tracks who created it

---

## 7. ✅ FEATURES IMPLEMENTED

### Frontend
* ✅ Clean Jira-like UI
* ✅ Accordion-based Kanban board (parent-child visibility)
* ✅ Issue types as Epics container
* ✅ Navigation reorganized with route groups
* ✅ Global search (searchEngine + SearchContext)
* ✅ PermissionGate component for RBAC rendering
* ✅ Login/Register pages
* ✅ Dashboard with project cards + stats
* ✅ Workspace per project with Kanban/Table/Backlog views
* ✅ Issue create/edit modals
* ✅ Feature flags system (features/)

### Backend
* ✅ JWT authentication
* ✅ Permission-based RBAC guards
* ✅ Project CRUD + stats
* ✅ Task CRUD (legacy)
* ✅ Issue CRUD + hierarchy (parent/children)
* ✅ Issue linking (Blocks, Depends On, etc.)
* ✅ Team CRUD
* ✅ RBAC seed scripts
* ✅ Exception filter

### Database
* ✅ 18 tables with relations
* ✅ Hierarchical issue tracking (self-referencing issues)
* ✅ RBAC tables with proper constraints
* ✅ Indexing on frequently queried fields

---

## 8. 🔥 RECENT CHANGES

* **Frontend:**
  - Heavily restructured — moved to workspace route groups, added Issues context, Kanban reworked to use Epics/Issues.
  - Wrapped `LoginPage` in `<Suspense>` boundary to resolve Next.js build error related to `useSearchParams()`.
  - Frontend now compiles with `Exit code: 0`.
* **Backend:** Issues module added with hierarchy support, IssueLinks module added
* **DB:** Added issues + issue_links tables + enums in migration `20260401083210`
* ⚠️ **Backend NOT updated to match frontend fully** — Tasks API still uses old flat DTOs, no issue-based Kanban data fetching
* ⚠️ **DB NOT fully aligned** — Tasks table still exists separately from Issues, potential data model confusion

---

## 9. 🚧 PENDING WORK

### Pending Work
* [ ] Wire Issues as primary entity (deprecate/bridge Tasks API)
* [ ] Add RBAC guards to all Issue endpoints
* [ ] Add project auto-role-assignment on project creation
* [ ] Implement issue stats endpoint for dashboard cards
* [ ] Add validation for hierarchy (cannot make Epic child of Task, etc.)
* [ ] Add bulk operations for issues (status change)

### Database
* [ ] Decide: migrate existing Tasks → Issues or keep both
* [ ] Optimize query patterns for Kanban (fetch issues by status + type)
* [ ] Add missing indexes if queries show N+1 patterns

### Integration
* [ ] Sync frontend IssuesContext to use Issues API (not Tasks)
* [ ] KanbanBoard should fetch Issues grouped by type/status
* [ ] Dashboard cards should pull from Issue stats
* [ ] RBAC: wire usePermissions hook to all protected actions
* [ ] Members page should manage UserRoles

---

## 10. 📏 SYSTEM RULES

* **Consistency is law** — Frontend, Backend, DB schema must always agree
* **Issues are primary** — Tasks are legacy; new features use Issues
* **RBAC must be enforced** — Every mutating endpoint needs `@RequirePermission`
* **Hierarchy rules** — Epics have no parent, Stories child of Epics, Tasks child of Stories, Bugs can attach to any
* **No localStorage** — All state flows through API (backend is source of truth)
* **Clean architecture** — Controller → Service → Prisma; no business logic in controllers
* **Backward compatibility** — Don't break existing UI without migration path

---

## 11. 🧠 HOW AI SHOULD USE THIS

* Treat this as **single source of truth** for FlowDesk/PM-Tool
* Always answer in project context — no generic solutions
* Reference actual file paths when suggesting changes
* Always suggest production-ready, industry-level solutions
* Check schema.prisma before suggesting DB changes
* Check migration history before suggesting schema changes
* Follow the established naming conventions and code style

---

## 12. 🔄 CONTEXT UPDATE RULE

If user says:
👉 **"UPDATE CONTEXT"**

Then:
* Modify this file mentally with the new information
* Use the updated version going forward
* Reflect changes in this file when explicitly asked

---

## 13. 📁 COMPLETE FOLDER STRUCTURE

```
pm-tool-/
├── .gitignore
├── README.md
├── setup.ps1
│
├── backend/
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── .prettierrc
│   ├── package.json
│   ├── prisma.config.ts
│   ├── tsconfig.build.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   │
│   ├── prisma/
│   │   ├── schema.prisma                      # DB schema (18 tables, 5 enums)
│   │   ├── assign-role.ts                     # Script: assign role to user
│   │   ├── backfill-user-roles.ts             # Script: backfill missing roles
│   │   ├── seed.ts                            # Seed roles/permissions/modules
│   │   └── migrations/
│   │       ├── migration_lock.toml
│   │       ├── 20260326100451_init/
│   │       │   └── migration.sql              # Base tables
│   │       ├── 20260326101935_add_indexes_and_task_fk/
│   │       │   └── migration.sql              # Indexes + FKs
│   │       ├── 20260326102836_add_users_table/
│   │       │   └── migration.sql              # Users table
│   │       ├── 20260330101617_phase1_rbac_foundation/
│   │       │   └── migration.sql              # RBAC tables
│   │       ├── 20260330105501_add_unique_user_role_per_project/
│   │       │   └── migration.sql              # UserRole unique constraint
│   │       ├── 20260330140000_cleanup_rbac_phase2/
│   │       │   └── migration.sql              # RBAC cleanup
│   │       └── 20260401083210_add_issues_hierarchy/
│   │           └── migration.sql              # Issues + IssueLinks
│   │
│   ├── src/
│   │   ├── main.ts                            # Bootstrap
│   │   ├── app.module.ts                      # Root module
│   │   │
│   │   ├── auth/
│   │   │   ├── auth.controller.ts             # POST /auth/register, POST /auth/login, GET /auth/me
│   │   │   ├── auth.service.ts                # JWT + bcrypt logic
│   │   │   ├── auth.module.ts
│   │   │   ├── jwt.strategy.ts                # Passport JWT strategy
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── dto/
│   │   │   │   └── auth.dto.ts                # LoginDto, RegisterDto
│   │   │   ├── decorators/
│   │   │   │   └── require-permission.decorator.ts
│   │   │   └── guards/
│   │   │       └── permission.guard.ts        # Checks role permissions
│   │   │
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts       # Global exception handling
│   │   │
│   │   ├── prisma/
│   │   │   ├── prisma.service.ts              # PrismaService
│   │   │   └── prisma.module.ts
│   │   │
│   │   ├── users/
│   │   │   ├── users.controller.ts            # GET /users
│   │   │   ├── users.service.ts
│   │   │   └── users.module.ts
│   │   │
│   │   ├── projects/
│   │   │   ├── projects.controller.ts          # CRUD + GET /projects/stats + GET /projects/project-id/:id
│   │   │   ├── projects.service.ts
│   │   │   ├── projects.module.ts
│   │   │   └── dto/
│   │   │       └── project.dto.ts
│   │   │
│   │   ├── tasks/
│   │   │   ├── tasks.controller.ts             # CRUD + GET /tasks/stats/:projectId
│   │   │   ├── tasks.service.ts
│   │   │   ├── tasks.module.ts
│   │   │   └── dto/
│   │   │       └── tasks.dto.ts
│   │   │
│   │   ├── issues/
│   │   │   ├── issues.controller.ts            # Issue CRUD + hierarchy endpoints
│   │   │   ├── issues.service.ts
│   │   │   ├── issues.module.ts
│   │   │   └── dto/
│   │   │       └── issues.dto.ts
│   │   │
│   │   ├── issue-links/
│   │   │   ├── issue-links.controller.ts       # Link CRUD
│   │   │   ├── issue-links.service.ts
│   │   │   ├── issue-links.module.ts
│   │   │   └── issue-links.dto.ts
│   │   │
│   │   └── teams/
│   │       ├── teams.controller.ts             # Team CRUD
│   │       ├── teams.service.ts
│   │       ├── teams.module.ts
│   │       └── teams.dto.ts
│   │
│   └── dist/                                  # Compiled output (auto-generated)
│       └── src/...
│
├── frontend/
│   ├── .env.local
│   ├── next.config.*                          # Next.js config
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx                       # Redirect
│       │   ├── favicon.ico
│       │   ├── globals.css
│       │   ├── Providers.tsx                  # All context providers
│       │   │
│       │   ├── (auth)/
│       │   │   ├── login/page.tsx
│       │   │   └── register/page.tsx
│       │   │
│       │   ├── (dashboard)/
│       │   │   ├── create/page.tsx
│       │   │   ├── create-team/page.tsx
│       │   │   ├── dashboard/page.tsx
│       │   │   ├── members/page.tsx
│       │   │   └── view/page.tsx
│       │   │
│       │   └── (workspace)/
│       │       ├── layout.tsx
│       │       └── workspace/[projectId]/
│       │           ├── layout.tsx
│       │           ├── ws-dashboard/page.tsx
│       │           ├── ws-view/page.tsx
│       │           ├── ws-create-task/page.tsx
│       │           └── settings/page.tsx
│       │
│       ├── components/
│       │   ├── create/
│       │   │   ├── ClientInfo.tsx
│       │   │   ├── FileUpload.tsx
│       │   │   ├── LiveSummary.tsx
│       │   │   ├── PrioritySelector.tsx
│       │   │   ├── ProjectIdentity.tsx
│       │   │   ├── RecurringProject.tsx
│       │   │   └── TeamAssignment.tsx
│       │   ├── dashboard/
│       │   │   ├── ActivityFeed.tsx
│       │   │   ├── AddPeopleModal.tsx
│       │   │   ├── ProjectActionsMenu.tsx
│       │   │   ├── ProjectCard.tsx
│       │   │   ├── ProjectDetailModal.tsx
│       │   │   ├── StatsCard.tsx
│       │   │   └── TeamPulse.tsx
│       │   ├── search/
│       │   │   ├── GlobalSearch.tsx
│       │   │   └── SearchResultItem.tsx
│       │   ├── shared/
│       │   │   ├── AccessDenied.tsx
│       │   │   ├── NavActions.tsx
│       │   │   ├── PermissionGate.tsx
│       │   │   ├── Sidebar.tsx
│       │   │   └── Topbar.tsx
│       │   ├── view/
│       │   │   ├── BacklogView.tsx
│       │   │   ├── KanbanBoard.tsx
│       │   │   ├── ProgressView.tsx
│       │   │   ├── TableView.tsx
│       │   │   └── ViewSwitcher.tsx
│       │   └── workspace/
│       │       ├── CreateIssueModal.tsx
│       │       ├── IssueDetailModal.tsx
│       │       ├── WsSidebar.tsx
│       │       └── WsTopbar.tsx
│       │
│       ├── config/
│       │   └── features.ts
│       │
│       ├── features/
│       │   ├── catch-up-feed/
│       │   │   └── ActivityFeed.tsx
│       │   ├── team-pulse/
│       │   │   └── TeamPulse.tsx
│       │   ├── create-team/
│       │   │   └── README.md
│       │   ├── index.ts
│       │   ├── QUICK-START.md
│       │   └── README.md
│       │
│       ├── hooks/
│       │   └── useAccordion.ts
│       │
│       ├── lib/
│       │   ├── api.ts
│       │   ├── auth.service.ts
│       │   ├── issues.service.ts
│       │   ├── projects.service.ts
│       │   ├── tasks.service.ts
│       │   ├── teams.service.ts
│       │   ├── users.service.ts
│       │   ├── permissions.ts                  # Permission constants
│       │   ├── RbacContext.tsx
│       │   ├── IssuesContext.tsx
│       │   ├── IssueModalContext.tsx
│       │   ├── ProjectsContext.tsx
│       │   ├── SidebarContext.tsx
│       │   ├── hooks/
│       │   │   ├── useCurrentUser.ts
│       │   │   └── usePermissions.ts
│       │   └── search/
│       │       ├── SearchContext.tsx
│       │       ├── searchEngine.ts
│       │       ├── searchIndex.ts
│       │       ├── types.ts
│       │       └── README.md
│       │
│       └── types/
│           ├── issue.ts
│           ├── project.ts
│           └── task.ts
│
└── Documents/
    └── qween-memory.md                        # This file
```
