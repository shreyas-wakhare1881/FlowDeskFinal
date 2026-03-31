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
}
