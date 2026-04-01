import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

/**
 * GET /users          — returns all registered users
 * GET /users?q=text   — searches users by name or email (Add People autocomplete)
 * Requires JWT — any logged-in user. Passwords are NEVER returned.
 */
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@Query('q') q?: string) {
    if (q && q.trim().length > 0) {
      return this.usersService.search(q.trim());
    }
    return this.usersService.findAll();
  }
}
