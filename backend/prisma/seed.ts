import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) as any,
});

const SEED_PROJECTS = [
  {
    projectID: 'PRJ-001',
    projectName: 'Payment Gateway Integration',
    projectDescription: 'Integrating third-party payment gateway APIs with authentication layer',
    status: 'in-progress',
    statusLabel: 'In Progress',
    priority: 'critical',
    category: 'Backend',
    teamID: 'TEAM-BCT',
    teamName: 'Backend-Core-Team',
    assigneeID: 'USER-001',
    assigneeName: 'Rahul Kumar',
    assigneeAvatar: 'RK',
    assigneeAvatarColor: '#4361ee',
    assignedDate: new Date('2026-03-10'),
    dueDate: new Date('2026-03-14'),
    isRecurring: false,
    tags: ['Backend', 'API', 'Phase-2'],
    teamMembers: [
      { memberId: 'USER-001', name: 'Rahul Kumar',  avatar: 'RK', avatarColor: '#4361ee', role: 'Owner' },
      { memberId: 'USER-002', name: 'Sneha Patel',  avatar: 'SP', avatarColor: '#06d6a0', role: 'Team Member' },
      { memberId: 'USER-003', name: 'Vishal Tiwari', avatar: 'VT', avatarColor: '#3a86ff', role: 'Team Member' },
    ],
    metrics: { completionPercentage: 85, tasksTotal: 12, tasksCompleted: 10, tasksInProgress: 1, tasksOverdue: 1 },
  },
  {
    projectID: 'PRJ-002',
    projectName: 'Mobile UI Redesign',
    projectDescription: 'Complete overhaul of mobile app interface with new design system',
    status: 'overdue',
    statusLabel: 'Overdue',
    priority: 'medium',
    category: 'Design',
    teamID: 'TEAM-FE1',
    teamName: 'Frontend-Unit-01',
    assigneeID: 'USER-002',
    assigneeName: 'Sneha Patel',
    assigneeAvatar: 'SP',
    assigneeAvatarColor: '#06d6a0',
    assignedDate: new Date('2026-03-05'),
    dueDate: new Date('2026-03-11'),
    isRecurring: false,
    tags: ['Frontend', 'Mobile', 'UI/UX'],
    teamMembers: [
      { memberId: 'USER-002', name: 'Sneha Patel',  avatar: 'SP', avatarColor: '#06d6a0', role: 'Owner' },
      { memberId: 'USER-004', name: 'Arjun Mehta',  avatar: 'AM', avatarColor: '#7209b7', role: 'Team Member' },
      { memberId: 'USER-005', name: 'Priya Das',    avatar: 'PD', avatarColor: '#f9a825', role: 'Team Member' },
      { memberId: 'USER-001', name: 'Rahul Kumar',  avatar: 'RK', avatarColor: '#ef233c', role: 'Team Member' },
    ],
    metrics: { completionPercentage: 52, tasksTotal: 18, tasksCompleted: 9, tasksInProgress: 3, tasksOverdue: 6 },
  },
  {
    projectID: 'PRJ-003',
    projectName: 'DB Schema Design v2',
    projectDescription: 'Optimizing database schema for better performance and scalability',
    status: 'in-progress',
    statusLabel: 'In Progress',
    priority: 'low',
    category: 'Database',
    teamID: 'TEAM-DBS',
    teamName: 'Database-Squad',
    assigneeID: 'USER-003',
    assigneeName: 'Vishal Tiwari',
    assigneeAvatar: 'VT',
    assigneeAvatarColor: '#3a86ff',
    assignedDate: new Date('2026-03-12'),
    dueDate: new Date('2026-03-20'),
    isRecurring: false,
    tags: ['Database', 'Schema', 'Performance'],
    teamMembers: [
      { memberId: 'USER-003', name: 'Vishal Tiwari', avatar: 'VT', avatarColor: '#3a86ff', role: 'Owner' },
      { memberId: 'USER-001', name: 'Rahul Kumar',   avatar: 'RK', avatarColor: '#4361ee', role: 'Team Member' },
    ],
    metrics: { completionPercentage: 31, tasksTotal: 8, tasksCompleted: 2, tasksInProgress: 2, tasksOverdue: 1 },
  },
  {
    projectID: 'PRJ-004',
    projectName: 'Weekly Status Report',
    projectDescription: 'Comprehensive weekly progress report for stakeholders',
    status: 'completed',
    statusLabel: 'Completed',
    priority: 'medium',
    category: 'General',
    teamID: 'TEAM-MGT',
    teamName: 'Management-Team',
    assigneeID: 'USER-004',
    assigneeName: 'Arjun Mehta',
    assigneeAvatar: 'AM',
    assigneeAvatarColor: '#7209b7',
    assignedDate: new Date('2026-03-06'),
    dueDate: new Date('2026-03-13'),
    isRecurring: false,
    tags: ['Reporting', 'Management'],
    teamMembers: [
      { memberId: 'USER-004', name: 'Arjun Mehta', avatar: 'AM', avatarColor: '#7209b7', role: 'Owner' },
    ],
    metrics: { completionPercentage: 100, tasksTotal: 5, tasksCompleted: 5, tasksInProgress: 0, tasksOverdue: 0 },
  },
  {
    projectID: 'PRJ-005',
    projectName: 'QA Testing – Sprint 4',
    projectDescription: 'End-to-end testing for sprint 4 features and bug fixes',
    status: 'in-progress',
    statusLabel: 'In Progress',
    priority: 'critical',
    category: 'QA',
    teamID: 'TEAM-QA',
    teamName: 'Quality-Assurance',
    assigneeID: 'USER-005',
    assigneeName: 'Priya Das',
    assigneeAvatar: 'PD',
    assigneeAvatarColor: '#f9a825',
    assignedDate: new Date('2026-03-08'),
    dueDate: new Date('2026-03-15'),
    isRecurring: false,
    tags: ['QA', 'Testing', 'Sprint-4'],
    teamMembers: [
      { memberId: 'USER-005', name: 'Priya Das',    avatar: 'PD', avatarColor: '#f9a825', role: 'Owner' },
      { memberId: 'USER-002', name: 'Sneha Patel',  avatar: 'SP', avatarColor: '#06d6a0', role: 'Team Member' },
      { memberId: 'USER-003', name: 'Vishal Tiwari', avatar: 'VT', avatarColor: '#3a86ff', role: 'Team Member' },
    ],
    metrics: { completionPercentage: 68, tasksTotal: 22, tasksCompleted: 15, tasksInProgress: 4, tasksOverdue: 3 },
  },
  {
    projectID: 'PRJ-006',
    projectName: 'Client Demo Preparation',
    projectDescription: 'Preparing comprehensive demo for Q2 client presentation',
    status: 'in-progress',
    statusLabel: 'In Progress',
    priority: 'critical',
    category: 'General',
    teamID: 'TEAM-DSA',
    teamName: 'Design-Squad-Alpha',
    assigneeID: 'USER-001',
    assigneeName: 'Rahul Kumar',
    assigneeAvatar: 'RK',
    assigneeAvatarColor: '#ef233c',
    assignedDate: new Date('2026-03-09'),
    dueDate: new Date('2026-03-16'),
    isRecurring: false,
    tags: ['Demo', 'Client', 'Presentation'],
    teamMembers: [
      { memberId: 'USER-001', name: 'Rahul Kumar',  avatar: 'RK', avatarColor: '#ef233c', role: 'Owner' },
      { memberId: 'USER-004', name: 'Arjun Mehta',  avatar: 'AM', avatarColor: '#7209b7', role: 'Team Member' },
      { memberId: 'USER-002', name: 'Sneha Patel',  avatar: 'SP', avatarColor: '#06d6a0', role: 'Team Member' },
      { memberId: 'USER-005', name: 'Priya Das',    avatar: 'PD', avatarColor: '#f9a825', role: 'Team Member' },
      { memberId: 'USER-003', name: 'Vishal Tiwari', avatar: 'VT', avatarColor: '#3a86ff', role: 'Team Member' },
    ],
    metrics: { completionPercentage: 42, tasksTotal: 10, tasksCompleted: 4, tasksInProgress: 3, tasksOverdue: 2 },
  },
  {
    projectID: 'PRJ-007',
    projectName: 'Security Audit – Q1',
    projectDescription: 'Full vulnerability assessment and penetration testing for Q1 release',
    status: 'in-progress',
    statusLabel: 'In Progress',
    priority: 'critical',
    category: 'Security',
    teamID: 'TEAM-SEC',
    teamName: 'Security-Ops',
    assigneeID: 'USER-004',
    assigneeName: 'Arjun Mehta',
    assigneeAvatar: 'AM',
    assigneeAvatarColor: '#7209b7',
    assignedDate: new Date('2026-03-14'),
    dueDate: new Date('2026-03-22'),
    isRecurring: false,
    tags: ['Security', 'Audit'],
    teamMembers: [
      { memberId: 'USER-004', name: 'Arjun Mehta',  avatar: 'AM', avatarColor: '#7209b7', role: 'Owner' },
      { memberId: 'USER-003', name: 'Vishal Tiwari', avatar: 'VT', avatarColor: '#3a86ff', role: 'Team Member' },
    ],
    metrics: { completionPercentage: 55, tasksTotal: 14, tasksCompleted: 7, tasksInProgress: 3, tasksOverdue: 2 },
  },
  {
    projectID: 'PRJ-008',
    projectName: 'Performance Optimization',
    projectDescription: 'Reducing API response times and improving frontend bundle size',
    status: 'in-progress',
    statusLabel: 'In Progress',
    priority: 'medium',
    category: 'Backend',
    teamID: 'TEAM-PLT',
    teamName: 'Platform-Team',
    assigneeID: 'USER-005',
    assigneeName: 'Priya Das',
    assigneeAvatar: 'PD',
    assigneeAvatarColor: '#f9a825',
    assignedDate: new Date('2026-03-11'),
    dueDate: new Date('2026-03-18'),
    isRecurring: false,
    tags: ['Performance', 'Backend'],
    teamMembers: [
      { memberId: 'USER-005', name: 'Priya Das',   avatar: 'PD', avatarColor: '#f9a825', role: 'Owner' },
      { memberId: 'USER-001', name: 'Rahul Kumar', avatar: 'RK', avatarColor: '#4361ee', role: 'Team Member' },
      { memberId: 'USER-002', name: 'Sneha Patel', avatar: 'SP', avatarColor: '#06d6a0', role: 'Team Member' },
    ],
    metrics: { completionPercentage: 78, tasksTotal: 9, tasksCompleted: 7, tasksInProgress: 1, tasksOverdue: 0 },
  },
  {
    projectID: 'PRJ-009',
    projectName: 'Onboarding Flow Redesign',
    projectDescription: 'Revamping new user onboarding with interactive tutorials and tooltips',
    status: 'in-progress',
    statusLabel: 'In Progress',
    priority: 'low',
    category: 'Design',
    teamID: 'TEAM-PRD',
    teamName: 'Product-Squad',
    assigneeID: 'USER-002',
    assigneeName: 'Sneha Patel',
    assigneeAvatar: 'SP',
    assigneeAvatarColor: '#06d6a0',
    assignedDate: new Date('2026-03-15'),
    dueDate: new Date('2026-03-25'),
    isRecurring: false,
    tags: ['Frontend', 'Design', 'UI/UX'],
    teamMembers: [
      { memberId: 'USER-002', name: 'Sneha Patel', avatar: 'SP', avatarColor: '#06d6a0', role: 'Owner' },
      { memberId: 'USER-004', name: 'Arjun Mehta', avatar: 'AM', avatarColor: '#7209b7', role: 'Team Member' },
    ],
    metrics: { completionPercentage: 15, tasksTotal: 20, tasksCompleted: 3, tasksInProgress: 5, tasksOverdue: 2 },
  },
];

async function main() {
  console.log('🌱 Seeding database...');

  // Seed SuperAdmin accounts
  // These are the only accounts with global SuperAdmin privileges.
  // All other users are created via /auth/register and start with zero roles.
  const SUPERADMIN_ACCOUNTS = [
    { email: 'admin@flowdesk.com',           name: 'Shreyas Wakhare',  password: 'admin123'       },
    { email: 'superadmin@datafortune.com',   name: 'Rakteem Barooah',  password: 'superadmin123'  },
  ];

  for (const account of SUPERADMIN_ACCOUNTS) {
    const hash = await bcrypt.hash(account.password, 10);
    await prisma.user.upsert({
      where:  { email: account.email },
      update: { name: account.name, passwordHash: hash },   // also reset password on re-seed
      create: { email: account.email, name: account.name, passwordHash: hash },
    });
    console.log(`✅ SuperAdmin seeded: ${account.email}`);
  }

  // ── Seed demo projects ONLY on first run ──────────────────────────────────
  // NEVER delete projects here again. Deleting projects cascades to user_roles
  // via ON DELETE CASCADE, wiping every registered user's role assignment.
  // Guard: if projects already exist, skip this entire block so registered
  // users and their role assignments are always preserved.
  const existingProjectCount = await prisma.project.count();

  if (existingProjectCount > 0) {
    console.log(`  ⏭️  Projects already exist (${existingProjectCount} found) — skipping project seed. Registered user data is preserved.`);
  } else {
    console.log('  📦 No projects found — running first-time project seed...');
  }

  if (existingProjectCount === 0) {
  for (const p of SEED_PROJECTS) {
    await prisma.project.create({
      data: {
        projectID:          p.projectID,
        projectName:        p.projectName,
        projectDescription: p.projectDescription,
        status:             p.status,
        statusLabel:        p.statusLabel,
        priority:           p.priority,
        category:           p.category,
        teamID:             p.teamID,
        teamName:           p.teamName,
        assigneeID:         p.assigneeID,
        assigneeName:       p.assigneeName,
        assigneeAvatar:     p.assigneeAvatar,
        assigneeAvatarColor: p.assigneeAvatarColor,
        assignedDate:       p.assignedDate,
        dueDate:            p.dueDate,
        isRecurring:        p.isRecurring,
        tags: {
          create: p.tags.map((tag) => ({ tag })),
        },
        teamMembers: {
          create: p.teamMembers.map((m) => ({
            memberId:   m.memberId,
            name:       m.name,
            avatar:     m.avatar,
            avatarColor: m.avatarColor,
            role:       m.role,
            status:     'online',
          })),
        },
        metrics: {
          create: {
            completionPercentage: p.metrics.completionPercentage,
            tasksTotal:           p.metrics.tasksTotal,
            tasksCompleted:       p.metrics.tasksCompleted,
            tasksInProgress:      p.metrics.tasksInProgress,
            tasksOverdue:         p.metrics.tasksOverdue,
          },
        },
      },
    });
    console.log(`  ✅ Created ${p.projectID} — ${p.projectName}`);
  }
  console.log(`\n🎉 Seed complete! ${SEED_PROJECTS.length} projects inserted.`);
  } // ── end first-run guard ─────────────────────────────────────────────────

  // ============================================================
  // RBAC SEED — Phase 1 (March 30, 2026)
  // Seeds: roles → modules → permissions → role_permissions
  // Safe to re-run: uses upsert / skipDuplicates throughout
  // ============================================================
  console.log('\n🔐 Seeding RBAC foundation...');

  // ── Step 1: Seed roles ────────────────────────────────────────
  const ROLES = [
    { name: 'SuperAdmin', description: 'Full system access across all projects' },
    { name: 'Manager',    description: 'Project and task management within a project' },
    { name: 'Developer',  description: 'Task execution and updates within a project' },
    { name: 'Client',     description: 'Read-only visibility into a project' },
  ];

  for (const r of ROLES) {
    await prisma.role.upsert({
      where:  { name: r.name },
      update: { description: r.description },
      create: r,
    });
  }
  console.log('  ✅ Roles seeded (SuperAdmin, Manager, Developer, Client)');

  // ── Step 2: Seed modules ──────────────────────────────────────
  const MODULES = [
    { name: 'TASKS',    description: 'Task creation, assignment and status management' },
    { name: 'PROJECTS', description: 'Project CRUD and settings' },
    { name: 'TEAMS',    description: 'Team member management' },
    { name: 'REPORTS',  description: 'Analytics and reporting' },
    { name: 'COMMENTS', description: 'Task and project comments' },
    { name: 'USERS',    description: 'User account management (SuperAdmin only)' },
    { name: 'ISSUES',   description: 'Jira-style hierarchical issue tracking (EPIC/STORY/TASK)' },
  ];

  for (const m of MODULES) {
    await prisma.module.upsert({
      where:  { name: m.name },
      update: { description: m.description },
      create: m,
    });
  }
  console.log('  ✅ Modules seeded (TASKS, PROJECTS, TEAMS, REPORTS, COMMENTS, USERS)');

  // ── Step 3: Seed permissions ──────────────────────────────────
  // Format: { name, action, moduleName, description }
  const PERMISSIONS = [
    // TASKS
    { name: 'CREATE_TASK',    action: 'CREATE', moduleName: 'TASKS',    description: 'Create new tasks in a project' },
    { name: 'READ_TASK',      action: 'READ',   moduleName: 'TASKS',    description: 'View tasks in a project' },
    { name: 'UPDATE_TASK',    action: 'UPDATE', moduleName: 'TASKS',    description: 'Update task details and status' },
    { name: 'DELETE_TASK',    action: 'DELETE', moduleName: 'TASKS',    description: 'Delete tasks from a project' },
    { name: 'MANAGE_TASKS',   action: 'MANAGE', moduleName: 'TASKS',    description: 'Full control over all tasks' },
    // PROJECTS — CREATE_PROJECT and DELETE_PROJECT removed (orphan: no role holds them; SuperAdmin uses MANAGE_PROJECTS)
    { name: 'VIEW_PROJECT',   action: 'READ',   moduleName: 'PROJECTS', description: 'View project details' },
    { name: 'UPDATE_PROJECT', action: 'UPDATE', moduleName: 'PROJECTS', description: 'Edit project name, description, settings' },
    { name: 'MANAGE_PROJECTS',action: 'MANAGE', moduleName: 'PROJECTS', description: 'Full control over projects' },
    // TEAMS
    { name: 'VIEW_TEAM',      action: 'READ',   moduleName: 'TEAMS',    description: 'View team members in a project' },
    { name: 'MANAGE_TEAM',    action: 'MANAGE', moduleName: 'TEAMS',    description: 'Add/remove team members, change roles' },
    // REPORTS
    { name: 'VIEW_REPORTS',   action: 'READ',   moduleName: 'REPORTS',  description: 'View project analytics and reports' },
    // COMMENTS
    { name: 'ADD_COMMENT',    action: 'CREATE', moduleName: 'COMMENTS', description: 'Add comments to tasks or projects' },
    { name: 'VIEW_COMMENT',   action: 'READ',   moduleName: 'COMMENTS', description: 'View comments' },
    { name: 'DELETE_COMMENT', action: 'DELETE', moduleName: 'COMMENTS', description: 'Delete any comment' },
    // USERS
    { name: 'MANAGE_USERS',   action: 'MANAGE', moduleName: 'USERS',    description: 'Create, deactivate and manage user accounts' },
    // ISSUES
    { name: 'CREATE_ISSUE',   action: 'CREATE', moduleName: 'ISSUES',   description: 'Create new issues (EPIC, STORY, TASK) in a project' },
    { name: 'READ_ISSUE',     action: 'READ',   moduleName: 'ISSUES',   description: 'View issues in a project' },
    { name: 'UPDATE_ISSUE',   action: 'UPDATE', moduleName: 'ISSUES',   description: 'Update issue details, status and assignee' },
    { name: 'DELETE_ISSUE',   action: 'DELETE', moduleName: 'ISSUES',   description: 'Delete issues from a project' },
    { name: 'MANAGE_ISSUES',  action: 'MANAGE', moduleName: 'ISSUES',   description: 'Full control over all issues in a project' },
  ];

  // Fetch all modules into a lookup map
  const moduleMap = new Map<string, string>();
  const allModules = await prisma.module.findMany();
  for (const mod of allModules) {
    moduleMap.set(mod.name, mod.id);
  }

  for (const p of PERMISSIONS) {
    const moduleId = moduleMap.get(p.moduleName);
    if (!moduleId) throw new Error(`Module not found: ${p.moduleName}`);
    await prisma.permission.upsert({
      where:  { name: p.name },
      update: { action: p.action, description: p.description, moduleId },
      create: { name: p.name, action: p.action, description: p.description, moduleId },
    });
  }
  console.log(`  ✅ Permissions seeded (${PERMISSIONS.length} permissions)`);

  // ── Step 4: Seed role_permissions ────────────────────────────
  // role → list of permission names it should have
  const ROLE_PERMISSIONS: Record<string, string[]> = {
    // SuperAdmin: MANAGE_* permissions + all explicit CRUD (belt-and-suspenders).
    // PermissionGuard also has a role-name bypass for SuperAdmin, but explicit
    // permissions keep the DB consistent and auditable.
    SuperAdmin: [
      // Tasks
      'CREATE_TASK', 'READ_TASK', 'UPDATE_TASK', 'DELETE_TASK', 'MANAGE_TASKS',
      // Projects
      'VIEW_PROJECT', 'UPDATE_PROJECT', 'MANAGE_PROJECTS',
      // Teams
      'VIEW_TEAM', 'MANAGE_TEAM',
      // Reports
      'VIEW_REPORTS',
      // Comments
      'ADD_COMMENT', 'VIEW_COMMENT', 'DELETE_COMMENT',
      // Users
      'MANAGE_USERS',
      // Issues — explicit CRUD + MANAGE so DB is fully populated
      'CREATE_ISSUE', 'READ_ISSUE', 'UPDATE_ISSUE', 'DELETE_ISSUE', 'MANAGE_ISSUES',
    ],
    // Manager = full control within their project (project-scoped SuperAdmin).
    // Must have ALL explicit CRUD issue permissions so the PermissionGuard
    // literal-match AND the MANAGE_* override both work correctly.
    Manager: [
      // Tasks
      'CREATE_TASK', 'READ_TASK', 'UPDATE_TASK', 'DELETE_TASK', 'MANAGE_TASKS',
      // Projects
      'VIEW_PROJECT', 'UPDATE_PROJECT', 'MANAGE_PROJECTS',
      // Teams
      'VIEW_TEAM', 'MANAGE_TEAM',
      // Reports
      'VIEW_REPORTS',
      // Comments
      'ADD_COMMENT', 'VIEW_COMMENT', 'DELETE_COMMENT',
      // Users
      'MANAGE_USERS',
      // Issues — explicit CRUD + MANAGE
      'CREATE_ISSUE', 'READ_ISSUE', 'UPDATE_ISSUE', 'DELETE_ISSUE', 'MANAGE_ISSUES',
    ],
    Developer: [
      'READ_TASK', 'UPDATE_TASK',
      'VIEW_PROJECT',
      'VIEW_TEAM',
      'ADD_COMMENT', 'VIEW_COMMENT',
      'CREATE_ISSUE', 'READ_ISSUE', 'UPDATE_ISSUE',
    ],
    Client: [
      'READ_TASK',
      'VIEW_PROJECT',
      'VIEW_COMMENT',
      'READ_ISSUE',
    ],
  };

  // Fetch roles and permissions into lookup maps
  const roleMap = new Map<string, string>();
  const allRoles = await prisma.role.findMany();
  for (const r of allRoles) roleMap.set(r.name, r.id);

  const permMap = new Map<string, string>();
  const allPerms = await prisma.permission.findMany();
  for (const p of allPerms) permMap.set(p.name, p.id);

  for (const [roleName, permNames] of Object.entries(ROLE_PERMISSIONS)) {
    const roleId = roleMap.get(roleName);
    if (!roleId) throw new Error(`Role not found: ${roleName}`);

    for (const permName of permNames) {
      const permissionId = permMap.get(permName);
      if (!permissionId) throw new Error(`Permission not found: ${permName}`);

      // createMany with skipDuplicates is safest for mapping tables
      await prisma.rolePermission.createMany({
        data: [{ roleId, permissionId }],
        skipDuplicates: true,
      });
    }
    console.log(`  ✅ role_permissions mapped: ${roleName} (${permNames.length} permissions)`);
  }

  console.log('\n🎉 RBAC seed complete!');

  // ── Step 5: Seed user_roles ───────────────────────────────────────────────
  // Projects were deleted + recreated above (new UUIDs) so user_roles was
  // cascade-deleted too. Re-populate it here.
  // Admin user is seeded as SuperAdmin in every project via user_roles (RBAC).
  console.log('\n👥 Seeding user_roles...');

  // Only seed the hardcoded admin account — NOT all users.
  // Users registered via the UI start with zero roles (empty dashboard).
  // SuperAdmin assigns roles to them manually via POST /projects/:id/members.
  const allProjects = await prisma.project.findMany({ select: { id: true, projectID: true } });

  const superAdminRole = await prisma.role.findUnique({ where: { name: 'SuperAdmin' } });
  if (!superAdminRole) throw new Error('SuperAdmin role not found');

  // Assign SuperAdmin role in every project for every SuperAdmin account
  const superAdminEmails = ['admin@flowdesk.com', 'superadmin@datafortune.com'];
  let userRoleCount = 0;

  for (const email of superAdminEmails) {
    const superAdminUser = await prisma.user.findUnique({ where: { email } });
    if (!superAdminUser) throw new Error(`${email} not found`);

    for (const project of allProjects) {
      await prisma.userRole.createMany({
        data: [{ userId: superAdminUser.id, roleId: superAdminRole.id, projectId: project.id }],
        skipDuplicates: true,
      });
      userRoleCount++;
    }
    console.log(`  ✅ ${email} (SuperAdmin) → ${allProjects.length} projects`);
  }
  console.log(`\n🎉 user_roles seeded: ${userRoleCount} rows`);
  console.log('🚀 Full seed complete!\n');
}
main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
