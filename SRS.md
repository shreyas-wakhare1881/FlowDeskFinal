# Software Requirements Specification (SRS)
## FlowDesk — Project Management Tool

| Field | Details |
|-------|---------|
| **Document Version** | 1.0 (In Progress) |
| **Date** | March 23, 2026 |
| **Status** | Draft — Based on current implementation |
| **Author** | Shreyas Wakhare |
| **Tech Stack** | Next.js 15 · NestJS · Prisma · SQLite · TypeScript · Tailwind CSS |

---

## Table of Contents

1. Introduction
2. Overall Description
3. Functional Requirements
4. Non-Functional Requirements
5. Use Cases
6. User Stories
7. System Architecture
8. Database Design
9. API Specification
10. Constraints & Assumptions

---

## 1. Introduction

### 1.1 Purpose
This document specifies the software requirements for **FlowDesk**, a web-based project management tool that enables teams to create, manage, and track projects and tasks through an intuitive dashboard interface.

### 1.2 Scope
FlowDesk provides:
- Project creation and management
- Team formation and assignment to projects
- Task creation within project workspaces
- Multi-view project visualization (Kanban, Table, Workload, Progress)
- Real-time stats and activity monitoring on a central dashboard

### 1.3 Definitions

| Term | Definition |
|------|-----------|
| Project | A unit of work with name, priority, deadline, and assigned team |
| Task | A sub-unit of work within a project workspace |
| Team | A group of members assigned to a specific project |
| PRJ-XXX | Human-readable Project ID (e.g., PRJ-001) |
| TASK-XXX | Human-readable Task ID (e.g., TASK-101) |
| TEAM-XXX | Human-readable Team ID (e.g., TEAM-001) |

### 1.4 References
- GitHub Repository: `https://github.com/shreyas-wakhare1881/FlowDesk`
- Backend API Base URL: `http://localhost:3001/api`
- Frontend URL: `http://localhost:3000`

---

## 2. Overall Description

### 2.1 Product Perspective
FlowDesk is a full-stack SPA (Single Page Application) built with a decoupled frontend (Next.js) and backend (NestJS REST API) communicating over HTTP. Data is persisted in a SQLite database via Prisma ORM.

### 2.2 Product Features (Current Implementation)

| # | Feature | Status |
|---|---------|--------|
| F1 | Dashboard with live project stats | ✅ Implemented |
| F2 | Create Project (with tags, priority, deadline, recurring) | ✅ Implemented |
| F3 | Create Team and assign to project | ✅ Implemented |
| F4 | View Projects — Kanban / Table / Workload / Progress | ✅ Implemented |
| F5 | Project Detail Modal | ✅ Implemented |
| F6 | Workspace Create Task | ✅ Implemented |
| F7 | Workspace Task Dashboard | ✅ Implemented |
| F8 | All Teams Page | 🔄 Planned |
| F9 | Insights / Analytics Page | 🔄 Planned |
| F10 | Discussions Page | 🔄 Planned |
| F11 | Authentication / Login | 🔄 Planned |

### 2.3 User Classes
- **Project Manager** — Creates projects, assigns teams, monitors progress
- **Team Member** — Views assigned tasks, updates task status (planned)
- **Admin** — Full system access (planned)

### 2.4 Operating Environment
- **Frontend:** Modern browser (Chrome, Firefox, Edge)
- **Backend:** Node.js 18+ environment
- **Database:** SQLite (local file `backend/dev.db`)

---

## 3. Functional Requirements

### 3.1 Dashboard (FR-01)

| ID | Requirement |
|----|------------|
| FR-01.1 | System shall display total projects count, in-progress, completed, and overdue counts as stat cards |
| FR-01.2 | System shall display a grid of project cards fetched live from the database |
| FR-01.3 | Each project card shall show: name, description, team name, assigned date, due date, priority chip, and a smart emoji based on project tags/name |
| FR-01.4 | User shall be able to search and filter projects by status (All / In Progress / Completed / Overdue) |
| FR-01.5 | Clicking a project card shall open a Project Detail Modal |
| FR-01.6 | Project Detail Modal shall show full project info and a "Create a team →" button that navigates to `/create-team?projectID=PRJ-xxx` |
| FR-01.7 | Dashboard shall show overdue badge on overdue projects |

### 3.2 Create Project (FR-02)

| ID | Requirement |
|----|------------|
| FR-02.1 | User shall be able to create a project by providing: Project Name (required), Description (optional), Priority (required: Critical / Medium / Low), Deadline (required), Tags derived from priority |
| FR-02.2 | User shall be able to mark a project as recurring and select frequency (Daily / Weekly / Bi-Weekly / Monthly / Custom) |
| FR-02.3 | User shall be able to upload file attachments (UI only, metadata stored) |
| FR-02.4 | On submit, system shall call `POST /api/projects` first and then update the frontend context with the DB response |
| FR-02.5 | System shall auto-assign a sequential Project ID (PRJ-001 format) |
| FR-02.6 | After successful creation, user shall be redirected to the dashboard |

### 3.3 Create Team (FR-03)

| ID | Requirement |
|----|------------|
| FR-03.1 | User shall be able to create a team by providing: Team Name (required), Project Assignment (required), Team Members (at least one) |
| FR-03.2 | If navigated from Project Detail Modal, the project shall be pre-selected in the dropdown via `?projectID=` query parameter |
| FR-03.3 | System shall call `POST /api/teams` with teamName, projectID (PRJ-xxx), and members array |
| FR-03.4 | System shall auto-assign a sequential Team ID (TEAM-001 format) |
| FR-03.5 | After creation, the team shall be linked to the project in the database |
| FR-03.6 | The member list shall include a fixed set of available team members to choose from |

### 3.4 View Projects (FR-04)

| ID | Requirement |
|----|------------|
| FR-04.1 | System shall provide 4 view modes: Kanban Board, Table View, Workload View, Progress View |
| FR-04.2 | Kanban Board shall organize projects into 4 columns: To Do, In Progress, In Review, Done |
| FR-04.3 | Each Kanban column shall display maximum 5 cards by default with "View More" option |
| FR-04.4 | Cards shall be draggable between columns |
| FR-04.5 | Kanban Board shall support search by project name, team, priority |
| FR-04.6 | Table View shall display projects in sortable rows |
| FR-04.7 | Overdue projects shall display a blinking "Overdue" badge |

### 3.5 Workspace — Create Task (FR-05)

| ID | Requirement |
|----|------------|
| FR-05.1 | User shall be able to create a task within a project workspace |
| FR-05.2 | Required fields: Task Name, Priority, Deadline |
| FR-05.3 | Optional fields: Description, Assignees, File Attachments, Recurring toggle + frequency |
| FR-05.4 | System shall call `POST /api/tasks` with task data and project UUID |
| FR-05.5 | On success, system shall display task ID and option to create another or view tasks |
| FR-05.6 | If backend is unavailable, system shall simulate success with a generated task ID |

### 3.6 Workspace — Task Dashboard (FR-06)

| ID | Requirement |
|----|------------|
| FR-06.1 | System shall display task stats: Total, In Progress, Completed, Overdue |
| FR-06.2 | System shall fetch tasks from `GET /api/tasks?projectId=<uuid>` |
| FR-06.3 | If no tasks exist in DB, system shall show fallback mock tasks |
| FR-06.4 | User shall be able to filter tasks by status and search by name |

---

## 4. Non-Functional Requirements

| ID | Category | Requirement |
|----|----------|------------|
| NFR-01 | Performance | Dashboard shall load project list within 2 seconds under normal network conditions |
| NFR-02 | Usability | All navigation shall use SPA routing (no full page reloads) via `router.push()` |
| NFR-03 | Usability | UI shall be responsive and work on screens ≥ 1280px width |
| NFR-04 | Reliability | Frontend context shall not lose data on navigation — ProjectsContext persists across pages |
| NFR-05 | Maintainability | Backend follows NestJS modular architecture: separate modules for Projects, Tasks, Teams |
| NFR-06 | Data Integrity | All project/team creates must go through the API first; frontend updates from DB response |
| NFR-07 | Security | `.env` and `dev.db` files are gitignored and not pushed to version control |
| NFR-08 | Type Safety | All frontend-backend interfaces typed via TypeScript; 0 TS errors policy |
| NFR-09 | Scalability | Prisma ORM allows easy DB migration to PostgreSQL/MySQL in production |

---

## 5. Use Cases

### UC-01: Create a New Project

| Field | Details |
|-------|---------|
| **Actor** | Project Manager |
| **Precondition** | User is on the Dashboard |
| **Main Flow** | 1. Click "Create Project" in sidebar → 2. Fill project name, priority, deadline → 3. Toggle recurring if needed → 4. Click "Launch Project" → 5. System saves to DB → 6. Redirected to Dashboard with new project visible |
| **Alternate Flow** | If project name is empty → validation error shown, form not submitted |
| **Postcondition** | New project appears on Dashboard with correct PRJ-xxx ID |

---

### UC-02: Create a Team for a Project

| Field | Details |
|-------|---------|
| **Actor** | Project Manager |
| **Precondition** | At least one project exists |
| **Main Flow** | 1. Open Project Detail Modal → 2. Click "Create a team →" → 3. Navigated to `/create-team?projectID=PRJ-xxx` → 4. Project is pre-selected → 5. Enter team name, select members → 6. Click "Create Team" → 7. Team saved to DB and linked to project |
| **Alternate Flow** | Navigate to `/create-team` directly → manually select project from dropdown |
| **Postcondition** | Team appears linked to project with TEAM-xxx ID |

---

### UC-03: View Projects in Kanban Board

| Field | Details |
|-------|---------|
| **Actor** | Project Manager |
| **Precondition** | At least one project exists |
| **Main Flow** | 1. Click "View" in sidebar → 2. Select "Kanban" tab → 3. Projects shown in status columns → 4. Drag card to change status → 5. Click card to open detail modal |
| **Alternate Flow** | If column has > 5 projects → "View X more" button appears → click to expand |
| **Postcondition** | Project status updated in UI (drag-and-drop is UI-only, not persisted to DB yet) |

---

### UC-04: Create a Task in Workspace

| Field | Details |
|-------|---------|
| **Actor** | Project Manager / Team Member |
| **Precondition** | User has navigated to a project workspace |
| **Main Flow** | 1. Click "+ New Task" on Workspace Dashboard → 2. Fill task name, priority, deadline → 3. Optionally add assignees, description, files → 4. Click "Launch Task" → 5. Task saved to DB via API → 6. Success overlay with task ID shown |
| **Postcondition** | Task appears in Workspace Task Dashboard |

---

## 6. User Stories

| ID | As a... | I want to... | So that... |
|----|---------|-------------|-----------|
| US-01 | Project Manager | Create a new project with priority and deadline | I can track it on the dashboard |
| US-02 | Project Manager | Create a team and link it to a project | I know who is responsible for each project |
| US-03 | Project Manager | View all projects in Kanban view | I can see the status of all work at a glance |
| US-04 | Project Manager | See overdue projects highlighted | I can take immediate action on delayed work |
| US-05 | Project Manager | Create tasks inside a project workspace | I can break down projects into actionable items |
| US-06 | Project Manager | Search and filter projects on dashboard | I can quickly find the project I need |
| US-07 | Project Manager | Click "Create a team" from project modal | The correct project is pre-selected without manual selection |
| US-08 | Team Member | View tasks assigned to me in workspace | I know what I need to work on |

---

## 7. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 15)                  │
│  Port: 3000                                               │
│                                                           │
│  Pages: /dashboard, /create, /create-team, /view         │
│  Workspace: /workspace/[projectId]/ws-*                   │
│                                                           │
│  State: ProjectsContext (global, API-backed)              │
│  Services: projectsService, tasksService, teamsService    │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP REST (fetch)
                       │ Base: http://localhost:3001/api
┌──────────────────────▼──────────────────────────────────┐
│                   BACKEND (NestJS)                        │
│  Port: 3001                                               │
│                                                           │
│  Modules:                                                 │
│  ├── ProjectsModule  → /api/projects                      │
│  ├── TasksModule     → /api/tasks                         │
│  └── TeamsModule     → /api/teams                         │
│                                                           │
│  ORM: Prisma (PrismaLibSql adapter)                       │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                 DATABASE (SQLite)                          │
│  File: backend/dev.db                                     │
│  Models: Project, Task, Team, TeamParticipant,            │
│          ProjectTag, TeamLead, TeamMember, Metrics        │
└─────────────────────────────────────────────────────────┘
```

---

## 8. Database Design (Key Models)

### Project
| Field | Type | Notes |
|-------|------|-------|
| id | String (UUID) | Primary key |
| projectID | String | Unique, human-readable (PRJ-001) |
| projectName | String | Required |
| projectDescription | String? | Optional |
| status | String | todo / assigned / completed / overdue |
| priority | String | critical / medium / low |
| dueDate | DateTime | Required |
| isRecurring | Boolean | Default: false |
| recurringFrequency | String? | Daily/Weekly etc. |
| tags | ProjectTag[] | Relation |
| teams | Team[] | Relation |

### Team
| Field | Type | Notes |
|-------|------|-------|
| id | String (UUID) | Primary key |
| teamID | String | Unique (TEAM-001) |
| teamName | String | Required |
| projectId | String | FK → Project |
| members | TeamParticipant[] | Relation |
| createdAt | DateTime | Auto |

### Task
| Field | Type | Notes |
|-------|------|-------|
| id | String (UUID) | Primary key |
| taskID | String | Unique (TASK-101) |
| taskName | String | Required |
| status | String | todo / in-progress / in-review / completed |
| priority | String | critical / medium / low |
| dueDate | DateTime | Required |
| projectId | String | FK → Project (UUID) |
| isRecurring | Boolean | Default: false |

---

## 9. API Specification

### Projects

| Method | Endpoint | Request Body | Response |
|--------|----------|-------------|----------|
| GET | `/api/projects` | — | Project[] (with tags, teams, metrics) |
| POST | `/api/projects` | `{ projectName, priority, dueDate, tags?, isRecurring?, recurringFrequency? }` | Created Project |
| GET | `/api/projects/stats` | — | `{ total, completed, inProgress, overdue }` |
| GET | `/api/projects/:id` | — | Single Project |
| PUT | `/api/projects/:id` | Partial Project fields | Updated Project |
| DELETE | `/api/projects/:id` | — | `{ message }` |

### Teams

| Method | Endpoint | Request Body | Response |
|--------|----------|-------------|----------|
| GET | `/api/teams` | `?projectID=PRJ-xxx` (optional) | Team[] |
| POST | `/api/teams` | `{ teamName, projectID, members[] }` | Created Team |
| GET | `/api/teams/:id` | — | Single Team |
| PUT | `/api/teams/:id` | Partial Team fields | Updated Team |
| DELETE | `/api/teams/:id` | — | `{ message }` |

### Tasks

| Method | Endpoint | Request Body | Response |
|--------|----------|-------------|----------|
| GET | `/api/tasks` | `?projectId=<uuid>` (optional) | Task[] |
| POST | `/api/tasks` | `{ taskName, priority, dueDate, projectId, status?, assigneeNames?, isRecurring? }` | Created Task |
| GET | `/api/tasks/stats/:projectId` | — | `{ total, completed, inProgress, overdue }` |
| GET | `/api/tasks/:id` | — | Single Task |
| PUT | `/api/tasks/:id` | Partial Task fields | Updated Task |
| DELETE | `/api/tasks/:id` | — | `{ message }` |

---

## 10. Constraints & Assumptions

| # | Type | Description |
|---|------|-------------|
| C-01 | Constraint | Currently uses SQLite — suitable for development only; production requires PostgreSQL/MySQL |
| C-02 | Constraint | No authentication system implemented yet — all users share the same data |
| C-03 | Constraint | File uploads are UI-only — actual file storage not implemented |
| C-04 | Constraint | Kanban drag-and-drop updates UI state only, not persisted to DB |
| C-05 | Assumption | System is used by a single organization / small team |
| C-06 | Assumption | Frontend and backend run on the same machine during development |
| C-07 | Assumption | Team members list is currently hardcoded in the UI |

---

## Appendix — Frontend Routes Map

| Route | Page | Data Source |
|-------|------|-------------|
| `/dashboard` | Dashboard | `GET /api/projects` (live) |
| `/create` | Create Project | `POST /api/projects` |
| `/create-team` | Create Team | `POST /api/teams` |
| `/view` | View Projects | ProjectsContext (from API) |
| `/workspace/[id]/ws-dashboard` | WS Task Dashboard | `GET /api/tasks?projectId=` |
| `/workspace/[id]/ws-create-task` | WS Create Task | `POST /api/tasks` |
| `/workspace/[id]/ws-view` | WS Task View | Mock data (planned: API) |
| `/workspace/[id]/ws-teams` | WS Teams | Mock data (planned: API) |
| `/teams` | All Teams | Planned |
| `/insights` | Insights | Planned |
| `/discussions` | Discussions | Planned |

---

*Document will be updated as new features are implemented.*
*Version 1.0 — March 23, 2026*
