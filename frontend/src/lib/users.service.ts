import { api } from './api';

/** Shape returned by GET /users */
export interface SystemUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export const usersService = {
  /**
   * Fetch all registered users (id, name, email, createdAt).
   * Requires JWT. Used to populate the "Select User" dropdown when assigning
   * a member to a project.
   * Calls: GET /users
   */
  getAll: async (): Promise<SystemUser[]> => {
    return api.get<SystemUser[]>('/users');
  },
};
