# FlowDesk - Clean ER Diagram

Derived from the schema documented in scrum-schema1.md.

## 1. Clean Layout Description

- Left: Auth & RBAC is grouped together so identity, permission, and assignment flows are easy to trace from users to roles, permissions, and project-scoped role bindings.
- Center: Project Core is the anchor of the system. projects sits in the middle because it is the main ownership boundary for tags, metrics, teams, issues, boards, sprints, and legacy tasks.
- Lower center: Teams is separated as its own domain directly under Project Core so team-specific tables stay readable without mixing into RBAC or Issues.
- Right: Issues and Scrum are placed together because boards, sprints, and issues form the primary work-management flow.
- Bottom: related_issues and issue_sprint_history are placed below the active work area because they are supporting relationship and audit tables, not primary entry points.
- Bottom right: Legacy tables are isolated and visually de-emphasized so they remain documented without competing with the active architecture.

## 2. Improved ER Diagram

This diagram uses Mermaid flowchart styling instead of Mermaid erDiagram syntax so domain grouping, color coding, and layout control stay presentation-ready while preserving the same entities and relationships.

```mermaid
flowchart TB

  %% =========================
  %% TOP ROW
  %% =========================

  subgraph TOP["System Layout"]
    direction LR

    subgraph AUTH["Auth & RBAC"]
      direction TB
      U["users<br/>PK id<br/>UK email"]
      UR["user_roles<br/>PK userId + roleId + projectId<br/>FK assignedById"]
      R["roles<br/>PK id<br/>UK name"]
      M["modules<br/>PK id<br/>UK name"]
      P["permissions<br/>PK id<br/>FK moduleId"]
      RP["role_permissions<br/>PK roleId + permissionId<br/>FK grantedById"]
    end

    subgraph CORE["Project Core"]
      direction TB
      PT["project_tags<br/>PK id<br/>FK projectId"]
      PR["projects<br/>PK id<br/>UK projectID<br/>FK createdById<br/>status, priority"]
      MX["metrics<br/>PK id<br/>FK projectId"]
    end

    subgraph RIGHT["Issues + Scrum"]
      direction TB
      PB["project_boards<br/>PK id<br/>FK projectId<br/>boardType"]
      PS["project_sprints<br/>PK id<br/>FK boardId, projectId<br/>status"]
      IS["issues<br/>PK id<br/>UK issueKey<br/>FK projectId, boardId, currentSprintId<br/>FK assigneeId, reporterId<br/>type, status, priority"]
    end
  end

  %% =========================
  %% MIDDLE ROW
  %% =========================

  subgraph TEAMS["Teams"]
    direction LR
    TL["team_leads<br/>PK id<br/>FK projectId"]
    TM["team_members<br/>PK id<br/>FK projectId<br/>role"]
    TE["teams<br/>PK id<br/>FK projectId"]
    TP["team_participants<br/>PK id<br/>FK teamId"]
  end

  %% =========================
  %% BOTTOM ROW
  %% =========================

  subgraph BOTTOM["Relations, History, Legacy"]
    direction LR

    RI["related_issues<br/>PK id<br/>FK sourceIssueId, targetIssueId<br/>relationType"]
    SH["issue_sprint_history<br/>PK id<br/>FK issueId, sprintId<br/>action"]

    subgraph LEGACY["Legacy"]
      direction TB
      TK["tasks<br/>PK id<br/>FK projectId<br/>status, priority"]
      TA["task_assignees<br/>PK id<br/>FK taskId"]
    end
  end

  %% =========================
  %% AUTH & RBAC
  %% =========================

  M -->|defines| P
  R -->|grants| RP
  P -->|mapped in| RP
  U -->|holds| UR
  U -.->|assigns| UR
  U -.->|grants| RP

  %% =========================
  %% PROJECT CORE
  %% =========================

  U -->|creates| PR
  PR -->|has| PT
  PR -->|has| MX
  PR -->|scopes| UR

  %% =========================
  %% TEAMS
  %% =========================

  PR -->|has| TL
  PR -->|has| TM
  PR -->|has| TE
  TE -->|has| TP

  %% =========================
  %% ISSUES & SCRUM
  %% =========================

  PR -->|owns| IS
  PR -->|has boards| PB
  PR -->|has sprints| PS
  PB -->|has sprints| PS
  PB -->|contains| IS
  PS -->|contains| IS

  U -.->|assignee| IS
  U -.->|reporter| IS

  %% =========================
  %% HISTORY & RELATED ISSUES
  %% =========================

  IS -->|parent / child| IS
  IS -->|related issues| RI
  PS -->|tracks| SH
  IS -->|history| SH

  %% =========================
  %% LEGACY
  %% =========================

  PR -.->|legacy ownership| TK
  TK -->|assigned to| TA

  %% =========================
  %% VISUAL STYLES
  %% =========================

  classDef core fill:#dbeafe,stroke:#2563eb,stroke-width:2px,color:#0f172a;
  classDef coreAnchor fill:#bfdbfe,stroke:#1d4ed8,stroke-width:4px,color:#0f172a;
  classDef scrum fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#052e16;
  classDef scrumAnchor fill:#bbf7d0,stroke:#15803d,stroke-width:3px,color:#052e16;
  classDef rbac fill:#f3e8ff,stroke:#7e22ce,stroke-width:2px,color:#3b0764;
  classDef team fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#451a03;
  classDef history fill:#eef2ff,stroke:#6366f1,stroke-width:1.5px,color:#1e1b4b;
  classDef legacy fill:#f3f4f6,stroke:#9ca3af,stroke-width:1.5px,stroke-dasharray: 6 4,color:#4b5563;

  class PR,PT,MX core;
  class IS coreAnchor;
  class PB scrum;
  class PS scrumAnchor;
  class U,R,M,P,RP,UR rbac;
  class TL,TM,TE,TP team;
  class RI,SH history;
  class TK,TA legacy;
```

## 3. Visual Design Rules Applied

- Domain grouping: Each table is placed in one business domain only, which reduces context switching and makes ownership boundaries obvious.
- Core emphasis: projects and issues use stronger blue styling because they are the two main anchors of the system.
- Scrum emphasis: project_boards and project_sprints use green styling and stay adjacent to issues so the delivery flow reads left-to-right and top-to-bottom.
- RBAC clarity: users, roles, permissions, modules, and the join tables stay on the left so access-control logic is separated from delivery logic.
- Team separation: team_leads, team_members, teams, and team_participants are grouped below the project core to show they are project-owned but domain-specific.
- Supporting tables reduced in weight: related_issues and issue_sprint_history are moved to the bottom because they support the main workflow rather than define it.
- Legacy isolation: tasks and task_assignees remain in the diagram but use muted grey and dashed styling to indicate deprecated status.
- Relationship labels normalized: Labels such as has, owns, contains, scopes, assignee, reporter, related issues, and assigned to replace vague wording.
- Column simplification: Only PKs, FKs, unique identifiers, and key state columns are shown so the diagram stays readable in under 30 seconds.
- Line optimization: The layout uses projects as the center anchor and issues as the right-side anchor, which shortens the highest-volume relationship paths and reduces crossings.

## Notes

- No entities were removed.
- No relationships were removed.
- No schema logic was changed.
- This is a presentation-oriented ER view of the same architecture already described in scrum-schema1.md.