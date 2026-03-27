const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthResponse {
  access_token: string;
  user: AuthUser;
}

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message ?? 'Invalid credentials');
    }

    const data: AuthResponse = await res.json();
    // Store token
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('auth_user', JSON.stringify(data.user));
    return data;
  },

  async register(
    email: string,
    password: string,
    name: string,
  ): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message ?? 'Registration failed');
    }

    const data: AuthResponse = await res.json();
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('auth_user', JSON.stringify(data.user));
    return data;
  },

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('auth_user');
  },

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  },

  getUser(): AuthUser | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('auth_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },

  isLoggedIn(): boolean {
    return !!this.getToken();
  },
};
