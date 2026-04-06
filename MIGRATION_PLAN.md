# FlowDesk Database Migration Plan: Tasks to Issues

## Objective
Currently, the FlowDesk system includes redundant models representing similar units of work: `tasks` (a legacy unstructured record) and `issues` (a Jira-like hierarchical model allowing parent-child relationships: EPIC -> STORY -> TASK -> BUG). Consolidating `tasks` into `issues` establishes a Single Source of Truth (SSOT).

## Phase 1: Preparation & Frontend Migration (Completed)
- Transitioned `ws-dashboard` and core UI logic from `TasksService` APIs to `IssuesContext`.
- Abstracted the issue modal to decouple component-level Task dependencies.

## Phase 2: Data Migration Strategy
We must run a one-time data migration script to move existing `Task` entities into `Issue` entities BEFORE modifying the schema. Because Prisma handles UUID and IDs automatically, this is best done through a Node.js/TypeScript script.

### Mapping Strategy:
- `Task.taskName` -> `Issue.title`
- `Task.taskDescription` -> `Issue.description`
- `Task.taskID` -> `Issue.issueKey` (We must ensure unique keys within the project. E.g., convert `TASK-102` to `{projectKey}-102`)
- `Task.status` -> `Issue.status` (`todo` -> `TODO`, `in-progress` -> `IN_PROGRESS`, `completed` -> `DONE`)
- `Task.priority` -> `Issue.priority` (Mapped via ENUM)
- `Task.assignees` -> Select the primary user from `TaskAssignee` and map to `Issue.assigneeId`.

### Data Migration Draft Script:
```ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateTasksToIssues() {
  const allTasks = await prisma.task.findMany({
    include: { assignees: true, project: true }
  });

  for (const task of allTasks) {
    // Determine target priority
    let priority: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
    if (task.priority === 'low') priority = 'LOW';
    if (task.priority === 'critical' || task.priority === 'HIGH') priority = 'HIGH';

    // Determine target status
    let status: 'TODO' | 'IN_PROGRESS' | 'DONE' = 'TODO';
    if (task.status === 'in-progress') status = 'IN_PROGRESS';
    if (task.status === 'completed') status = 'DONE';

    // Best-effort mapping for Assignee
    // Look up the actual User ID via email/name since TaskAssignee doesn't strictly reference a User ID
    let assigneeId = null;
    if (task.assignees.length > 0) {
       const user = await prisma.user.findFirst({
           where: { name: task.assignees[0].name }
       });
       if (user) assigneeId = user.id;
    }

    try {
      await prisma.issue.create({
        data: {
          issueKey: task.taskID,
          title: task.taskName,
          description: task.taskDescription,
          type: 'TASK',
          priority,
          status,
          projectId: task.projectId,
          assigneeId: assigneeId,
          createdAt: task.createdAt,
        }
      });
      console.log(`Successfully migrated ${task.taskID}`);
    } catch (e) {
      console.error(`Failed to migrate ${task.taskID}`, e);
    }
  }
}

migrateTasksToIssues()
  .then(() => process.exit(0))
  .catch(e => { console.error(e); process.exit(1); });
```

## Phase 3: Schema Cleanup and Deploy
1. Run the script above on the production database.
2. In `backend/prisma/schema.prisma`, delete `model Task` and `model TaskAssignee`.
3. Generate the latest Prisma types:
   ```bash
   npx prisma generate
   ```
4. Create the SQL migration file indicating the drop of the tasks table:
   ```bash
   npx prisma migrate dev --name "drop_redundant_tasks_table"
   ```
5. Deploy changes to the backend. Remove `tasks.module.ts`, `tasks.controller.ts`, and `tasks.service.ts`. Restart NestJS server.
