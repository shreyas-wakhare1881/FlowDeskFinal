import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) as any,
});

async function main() {
  const email      = process.env.USER_EMAIL   || 'dev@flowdesk.com';
  const projectID  = process.env.PROJECT_ID   || 'PRJ-001';
  const roleName   = process.env.ROLE_NAME    || 'Developer';

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) { console.log(`❌ User not found: ${email}`); return; }

  const project = await prisma.project.findUnique({ where: { projectID }, select: { id: true } });
  if (!project) { console.log(`❌ Project not found: ${projectID}`); return; }

  const role = await prisma.role.findUnique({ where: { name: roleName }, select: { id: true } });
  if (!role) { console.log(`❌ Role not found: ${roleName}`); return; }

  const result = await prisma.userRole.createMany({
    data: [{ userId: user.id, roleId: role.id, projectId: project.id }],
    skipDuplicates: true,
  });

  if (result.count === 0) {
    console.log(`⚠️  Already assigned: ${email} is already ${roleName} in ${projectID}`);
  } else {
    console.log(`✅ Done! ${email} → ${roleName} in ${projectID}`);
  }
}

main()
  .catch(e => { console.error('❌ Error:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
