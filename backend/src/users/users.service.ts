import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns all registered users — safe fields only (no password hash).
   * Used by: GET /users
   * Purpose: Populate "Select User" dropdown in Create Team / Assign Member UI.
   */
  async findAll() {
    return this.prisma.user.findMany({
      select: { id: true, name: true, email: true, createdAt: true },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Search registered users by name or email (case-insensitive, partial match).
   * Used by: GET /users?q=keyword  (Add People Modal autocomplete)
   * Returns max 20 results ordered by name.
   */
  async search(q: string) {
    return this.prisma.user.findMany({
      where: {
        OR: [
          { name:  { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
      take: 20,
    });
  }
}
