# PM TOOL - Next.js + NestJS Migration Roadmap

## 🎯 Project Overview

**Current Stack:** HTML/CSS/JavaScript (Pure Frontend)
**Target Stack:** Next.js (Frontend) + NestJS (Backend) + Prisma (Database)

**Migration Date:** March 17, 2026
**Status:** Setup Complete ✅

---

## 📐 Architecture Principles (MUST FOLLOW)

### 1. **Dual-View System Isolation** 🔒
```
GLOBAL VIEW (Project-Focused)
├── Dashboard, Create, View, Teams, Insights, Discussions
├── Focus: Projects, Teams, High-level overview
└── Data: Projects, Team Members, Workload

WORKSPACE VIEW (Task-Focused)  
├── Dashboard, Create, View (Task-level)
├── Focus: Individual tasks within a project
└── Data: Tasks, Subtasks, Dependencies
```

**CRITICAL RULES:**
- ✅ Keep complete isolation between Global and Workspace
- ✅ No data mixing or cross-contamination
- ✅ Separate routes, components, and state management
- ✅ Independent API endpoints for each view

---

### 2. **Coding Principles** 📋

**From coding-guidelines.md:**

#### A. **DRY (Don't Repeat Yourself)**
```typescript
// ❌ Bad:
// dashboard.tsx - duplicate code
// create.tsx - same code repeated

// ✅ Good:
// components/shared/ProjectCard.tsx - reusable
// lib/utils/formatDate.ts - centralized
```

#### B. **SRP (Single Responsibility Principle)**
```typescript
// ❌ Bad:
function handleProjectCreation() {
  validate();
  saveToDb();
  updateUI();
  sendNotification();
}

// ✅ Good:
function validateProject() { ... }
function saveProject() { ... }
function updateDashboard() { ... }
function notifyUsers() { ... }
```

#### C. **Semantic & Unique Naming**
```typescript
// ❌ Bad:
const handler = () => {};
const data = [];
const x = 5;

// ✅ Good:
const handleProjectCreation = () => {};
const projectsList = [];
const maxTeamMemberCount = 5;
```

#### D. **Centralized Constants**
```typescript
// lib/constants.ts
export const PROJECT_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed'
} as const;

export const ROUTES = {
  DASHBOARD: '/dashboard',
  CREATE: '/create'
} as const;
```

#### E. **State-Driven UI**
```typescript
// ✅ Single source of truth
const useProjectStore = create((set) => ({
  projects: [],
  fetchProjects: async () => {
    const data = await apiClient.get('/projects');
    set({ projects: data });
  }
}));
```

#### F. **Error Boundaries & Logging**
```typescript
// ✅ Proper error handling
try {
  const projects = await fetchProjects();
  return projects;
} catch (error) {
  console.error('Failed to fetch projects:', error);
  throw new Error('Unable to load projects');
}
```

---

## 🗂️ Next.js Folder Structure

```
frontend/src/
│
├── app/                              # App Router (Next.js 15)
│   ├── (auth)/                       # Auth Route Group
│   │   └── login/
│   │       └── page.tsx
│   │
│   ├── (global-view)/                # Global View Route Group
│   │   ├── layout.tsx                # Shared layout (sidebar, topbar)
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── create/
│   │   │   └── page.tsx
│   │   ├── view/                     # Kanban, Table, Workload, Progress
│   │   │   └── page.tsx
│   │   ├── teams/
│   │   │   └── page.tsx
│   │   ├── insights/
│   │   │   └── page.tsx
│   │   └── discussions/
│   │       └── page.tsx
│   │
│   ├── (workspace-view)/             # Workspace View Route Group
│   │   ├── layout.tsx                # Different layout
│   │   ├── workspace/[projectId]/
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── create-task/
│   │   │   │   └── page.tsx
│   │   │   └── tasks/
│   │   │       └── page.tsx
│   │
│   └── api/                          # Next.js API routes (proxy to NestJS)
│       └── [...slug]/route.ts
│
├── components/                       # React Components
│   ├── global-view/                  # Global View Components
│   │   ├── dashboard/
│   │   │   ├── ProjectCard.tsx
│   │   │   ├── StatsCard.tsx
│   │   │   └── ProjectsGrid.tsx
│   │   ├── kanban/
│   │   │   ├── KanbanBoard.tsx
│   │   │   ├── KanbanColumn.tsx
│   │   │   └── KanbanCard.tsx
│   │   ├── workload/
│   │   │   ├── WorkloadCard.tsx
│   │   │   └── DonutChart.tsx
│   │   └── shared/
│   │       ├── Sidebar.tsx           # Global View Sidebar
│   │       └── Topbar.tsx
│   │
│   ├── workspace-view/               # Workspace View Components
│   │   ├── tasks/
│   │   │   ├── TaskCard.tsx
│   │   │   └── TaskList.tsx
│   │   └── shared/
│   │       ├── Sidebar.tsx           # Workspace Sidebar
│   │       └── Topbar.tsx
│   │
│   └── ui/                           # Generic UI Components
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       └── Toast.tsx
│
├── lib/                              # Utilities & Helpers
│   ├── constants/
│   │   ├── global-view.ts            # Global View constants
│   │   └── workspace-view.ts         # Workspace constants
│   ├── utils/
│   │   ├── formatDate.ts
│   │   ├── formatters.ts
│   │   └── validators.ts
│   └── api-client.ts                 # Axios/Fetch wrapper
│
├── store/                            # State Management (Zustand)
│   ├── global-view/
│   │   ├── projectStore.ts
│   │   └── workloadStore.ts
│   └── workspace-view/
│       └── taskStore.ts
│
├── hooks/                            # Custom React Hooks
│   ├── useProjects.ts
│   ├── useWorkload.ts
│   └── useTasks.ts
│
└── styles/
    └── globals.css
```

---

## 🚀 NestJS Backend Structure

```
backend/src/
│
├── modules/
│   ├── projects/                     # Global View - Projects
│   │   ├── projects.controller.ts
│   │   ├── projects.service.ts
│   │   ├── projects.module.ts
│   │   ├── dto/
│   │   │   ├── create-project.dto.ts
│   │   │   └── update-project.dto.ts
│   │   └── entities/
│   │       └── project.entity.ts
│   │
│   ├── tasks/                        # Workspace View - Tasks
│   │   ├── tasks.controller.ts
│   │   ├── tasks.service.ts
│   │   ├── tasks.module.ts
│   │   └── dto/
│   │
│   ├── teams/
│   │   ├── teams.controller.ts
│   │   ├── teams.service.ts
│   │   └── teams.module.ts
│   │
│   ├── workload/                     # Workload calculations
│   │   ├── workload.controller.ts
│   │   └── workload.service.ts
│   │
│   └── dashboard/                    # Dashboard stats
│       ├── dashboard.controller.ts
│       └── dashboard.service.ts
│
├── common/
│   ├── constants/
│   │   ├── project-status.constant.ts
│   │   └── priority.constant.ts
│   ├── guards/
│   ├── interceptors/
│   └── decorators/
│
├── prisma/
│   ├── prisma.service.ts
│   └── prisma.module.ts
│
└── main.ts
```

---

## 📊 Database Schema (Prisma)

```prisma
// backend/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

// ============ GLOBAL VIEW MODELS ============

model Project {
  id                  String       @id @default(uuid())
  projectID           String       @unique
  projectName         String
  projectDescription  String?
  status              String       // 'todo', 'in-progress', etc.
  statusLabel         String
  priority            String       // 'critical', 'medium', 'low'
  category            String
  
  createdDate         DateTime     @default(now())
  assignedDate        DateTime
  dueDate             DateTime
  completedDate       DateTime?
  
  // Team info
  teamID              String
  teamName            String
  
  // Relations
  teamMembers         TeamMember[]
  metrics             Metrics?
  tasks               Task[]       // Workspace tasks
  
  @@map("projects")
}

model TeamMember {
  id            String   @id @default(uuid())
  memberId      String
  memberName    String
  role          String
  avatar        String
  avatarColor   String
  status        String   @default("online")
  
  projectId     String
  project       Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  @@map("team_members")
}

model Metrics {
  id                    String   @id @default(uuid())
  completionPercentage  Int      @default(0)
  tasksTotal            Int      @default(0)
  tasksCompleted        Int      @default(0)
  tasksInProgress       Int      @default(0)
  tasksOverdue          Int      @default(0)
  
  projectId             String   @unique
  project               Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  @@map("metrics")
}

// ============ WORKSPACE VIEW MODELS ============

model Task {
  id              String    @id @default(uuid())
  taskID          String    @unique
  taskName        String
  taskDescription String?
  status          String
  priority        String
  
  createdDate     DateTime  @default(now())
  dueDate         DateTime
  completedDate   DateTime?
  
  // Relations to Project (parent)
  projectId       String
  project         Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  // Assignee
  assigneeId      String?
  assigneeName    String?
  
  @@map("tasks")
}
```

---

## 🔄 Migration Phases

### **PHASE 1: Database Setup** (Week 1)
- ✅ Prisma schema design
- ✅ Database migrations
- ✅ Seed data from localStorage

### **PHASE 2: Backend APIs** (Week 2-3)
- ✅ Projects CRUD endpoints
- ✅ Tasks CRUD endpoints
- ✅ Workload calculation API
- ✅ Dashboard stats API

### **PHASE 3: Frontend Components** (Week 4-5)
- ✅ Global View pages
- ✅ Workspace View pages
- ✅ Shared components
- ✅ State management

### **PHASE 4: Integration** (Week 6)
- ✅ API integration
- ✅ Chain reaction testing
- ✅ Error handling

### **PHASE 5: Polish** (Week 7)
- ✅ Styling
- ✅ Performance
- ✅ Testing

---

## 📝 Next Steps

1. **Start with Database Schema** ✅
2. **Create Backend APIs** (Projects first)
3. **Migrate Dashboard Page** (Global View)
4. **Test Chain Reaction**
5. **Continue page-by-page**

---

**Ready to start Phase 1 (Database)?** 🚀
