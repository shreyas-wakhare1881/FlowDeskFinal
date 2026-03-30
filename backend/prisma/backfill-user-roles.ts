/**
 * RBAC Phase 1 — Backfill Script
 * --------------------------------
 * Populates the `user_roles` table for ALL existing users and projects.
 *
 * Mapping logic (users.role column was removed in Phase 2 cleanup):
 *   email in SUPERADMIN_EMAILS → SuperAdmin in ALL projects
 *   all other users            → Developer in ALL projects
 *
 * Safe to re-run: uses skipDuplicates — will not create duplicate rows.
 *
 * Run with:
 *   npx ts-node --project tsconfig.json -e "require('tsconfig-paths/register')" prisma/backfill-user-roles.ts
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) as any,
});

async function main() {
  console.log('🔄 Starting RBAC backfill for existing users and projects...\n');

  // SuperAdmin emails — users.role column was dropped in Phase 2 cleanup migration.
  // Identify SuperAdmins by email instead.
  const SUPERADMIN_EMAILS = new Set([
    'admin@flowdesk.com',
    'superadmin@datafortune.com',
  ]);

  // ── 1. Load all existing users ───────────────────────────────────────────
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true },
  });
  console.log(`  Found ${users.length} user(s) in the system`);

  // ── 2. Load all existing projects ───────────────────────────────────────
  const projects = await prisma.project.findMany({
    select: { id: true, projectID: true, projectName: true },
  });
  console.log(`  Found ${projects.length} project(s) in the system`);

  // ── 3. Load role IDs we need ─────────────────────────────────────────────
  const superAdminRole = await prisma.role.findUnique({ where: { name: 'SuperAdmin' } });
  const developerRole  = await prisma.role.findUnique({ where: { name: 'Developer' } });

  if (!superAdminRole) {
    throw new Error('SuperAdmin role not found. Run seed.ts first (npm run db:seed).');
  }
  if (!developerRole) {
    throw new Error('Developer role not found. Run seed.ts first (npm run db:seed).');
  }

  console.log(`  SuperAdmin role ID: ${superAdminRole.id}`);
  console.log(`  Developer  role ID: ${developerRole.id}\n`);

  // ── 4. Build user_roles rows ─────────────────────────────────────────────
  let totalInserted = 0;
  let totalSkipped  = 0;

  for (const user of users) {
    // Map to RBAC Role — SuperAdmins identified by email
    const isSuperAdmin = SUPERADMIN_EMAILS.has(user.email);
    const roleId   = isSuperAdmin ? superAdminRole.id : developerRole.id;
    const roleName = isSuperAdmin ? 'SuperAdmin' : 'Developer';

    const rows = projects.map((project) => ({
      userId:    user.id,
      roleId:    roleId,
      projectId: project.id,
      // assignedById is null for backfilled rows (no human assigned these)
    }));

    const result = await prisma.userRole.createMany({
      data: rows,
      skipDuplicates: true,  // idempotent — safe to re-run
    });

    totalInserted += result.count;
    totalSkipped  += rows.length - result.count;

    console.log(
      `  ✅ ${user.name} (${user.email}) → ${roleName} in ${result.count} project(s)` +
      (rows.length - result.count > 0 ? ` [${rows.length - result.count} already existed]` : '')
    );
  }

  console.log('\n─────────────────────────────────────────');
  console.log(`  Total rows inserted : ${totalInserted}`);
  console.log(`  Total rows skipped  : ${totalSkipped} (already existed)`);
  console.log('─────────────────────────────────────────');
  console.log('\n✅ Backfill complete! user_roles table is populated.');
  console.log('   All existing users now have project-scoped roles.');
  console.log('   The app continues to work exactly as before.\n');
}

main()
  .catch((e) => {
    console.error('❌ Backfill failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
