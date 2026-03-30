'use client';

import { useRouter } from 'next/navigation';

interface AccessDeniedProps {
  /** The permission that was missing (e.g. 'CREATE_TASK'). Shown in subtitle. */
  requiredPermission?: string;
  /** The user's current role in this project (e.g. 'Viewer'). */
  role?: string | null;
}

/**
 * AccessDenied — full-page blocker shown when a user lacks the required
 * permission for a route/action.
 */
export default function AccessDenied({ requiredPermission, role }: AccessDeniedProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4 text-center">
      {/* Icon */}
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          />
        </svg>
      </div>

      {/* Text */}
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-gray-800">Access Denied</h2>
        <p className="text-sm text-gray-500">
          You don&apos;t have permission to perform this action.
        </p>
        {requiredPermission && (
          <p className="text-xs text-gray-400">
            Required permission: <span className="font-medium text-gray-600">{requiredPermission}</span>
          </p>
        )}
        {role && (
          <p className="text-xs text-gray-400">
            Your current role: <span className="font-medium text-gray-600">{role}</span>
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => router.back()}
          className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Go Back
        </button>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
