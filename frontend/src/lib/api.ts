const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Thrown when the server returns 403 Forbidden.
 * Catch this in components to show <AccessDenied /> instead of a generic error.
 */
export class PermissionError extends Error {
  readonly status = 403;
  constructor(message = 'You do not have permission to perform this action') {
    super(message);
    this.name = 'PermissionError';
  }
}

function getAuthHeaders(): Record<string, string> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    // Throw a specific PermissionError for 403 so UI can show <AccessDenied />
    if (response.status === 403) {
      const body = await response.json().catch(() => ({}));
      throw new PermissionError(body?.message ?? 'Access denied');
    }
    const error = await response.text();
    throw new APIError(response.status, error || response.statusText);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

export const api = {
  get: async <T>(endpoint: string): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });
    return handleResponse<T>(response);
  },

  post: async <T>(endpoint: string, data: unknown): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse<T>(response);
  },

  put: async <T>(endpoint: string, data: unknown): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse<T>(response);
  },

  patch: async <T>(endpoint: string, data: unknown): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse<T>(response);
  },

  /**
   * DELETE request.
   * @param endpoint  API path, e.g. '/tasks/uuid'
   * @param options   Optional query params and/or JSON body.
   *                 Backwards compatible:
   *                 - api.delete('/tasks/uuid', { projectId: 'proj-uuid' })  // query params
   *                 - api.delete('/board-columns/uuid', { params: { projectId }, body: { projectId } })
   */
  delete: async <T>(
    endpoint: string,
    options?: Record<string, string> | { params?: Record<string, string>; body?: unknown },
  ): Promise<T> => {
    const isLegacyParams =
      options &&
      typeof options === 'object' &&
      !('params' in options) &&
      !('body' in options);

    const params = isLegacyParams
      ? (options as Record<string, string>)
      : (options as { params?: Record<string, string>; body?: unknown } | undefined)?.params;

    const body = isLegacyParams
      ? undefined
      : (options as { params?: Record<string, string>; body?: unknown } | undefined)?.body;

    const baseUrl = `${API_BASE_URL}${endpoint}`;
    const url = params
      ? `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${new URLSearchParams(params).toString()}`
      : baseUrl;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    return handleResponse<T>(response);
  },
};
