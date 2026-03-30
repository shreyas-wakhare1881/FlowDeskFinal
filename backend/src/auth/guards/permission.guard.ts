import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // ── 1. Read required permission from @RequirePermission() decorator ──────
    const requiredPermission = this.reflector.getAllAndOverride<string>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no permission is required on this route, allow through
    if (!requiredPermission) return true;

    const request = context.switchToHttp().getRequest();

    // ── 2. Get userId from JWT (set by JwtAuthGuard) ──────────────────────────
    const userId: string | undefined = request.user?.userId;
    if (!userId) {
      throw new ForbiddenException('Authentication required');
    }

    // ── 3. Extract projectId from request ────────────────────────────────────
    // Priority order matters:
    //  1. params.projectId  — e.g. /projects/:projectId/members
    //  2. body.projectId    — e.g. POST/PUT /tasks { projectId: "..." }
    //  3. query.projectId   — e.g. GET /tasks?projectId=..., DELETE /tasks/:id?projectId=...
    //  4. params.id         — LAST: only correct for project routes (/projects/:id)
    //                         MUST be last so task routes (where :id = task UUID) don't
    //                         accidentally match before body/query provide the real projectId.
    const projectId: string | undefined =
      request.params?.projectId ||
      request.body?.projectId ||
      request.query?.projectId ||
      request.params?.id;

    if (!projectId) {
      // No project context in the request — this happens for admin-level routes
      // like GET /projects (no :id, no body). Allow only if user is SuperAdmin
      // in at least one project.
      const isSuperAdminAnywhere = await this.prisma.userRole.findFirst({
        where: { userId, role: { name: 'SuperAdmin' } },
        include: { role: true },
      });
      if (isSuperAdminAnywhere) return true;
      throw new ForbiddenException('Project context is required for this action');
    }

    // ── 4. Resolve projectId — workspace URLs use short code (PRJ-001), but
    //        user_roles stores UUID. Accept both formats.
    const resolvedProject = await this.prisma.project.findFirst({
      where: { OR: [{ id: projectId }, { projectID: projectId }] },
      select: { id: true },
    });
    const resolvedProjectId = resolvedProject?.id ?? projectId;

    // ── 5. Look up the user's role in this specific project ───────────────────
    const userRole = await this.prisma.userRole.findFirst({
      where: { userId, projectId: resolvedProjectId },
      include: {
        role: true,
      },
    });

    if (!userRole) {
      throw new ForbiddenException('You are not a member of this project');
    }

    // ── 5. SuperAdmin bypass — always allow ───────────────────────────────────
    if (userRole.role.name === 'SuperAdmin') {
      return true;
    }

    // ── 6. Fetch all permissions assigned to this role ────────────────────────
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { roleId: userRole.roleId },
      include: {
        permission: true,
      },
    });

    const permissionNames = rolePermissions.map((rp) => rp.permission.name);

    // ── 7. Check if required permission is present ────────────────────────────
    if (!permissionNames.includes(requiredPermission)) {
      throw new ForbiddenException(
        `You do not have the '${requiredPermission}' permission in this project`,
      );
    }

    return true;
  }
}
