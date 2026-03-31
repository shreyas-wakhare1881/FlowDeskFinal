import { Controller, Get, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

/**
 * GET /users
 * Returns all registered users (id, name, email, createdAt).
 * Requires JWT — any logged-in user can see the list (needed for team building).
 * Passwords are NEVER returned.
 */
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }
}
