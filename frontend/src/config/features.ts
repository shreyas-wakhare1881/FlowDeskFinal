/**
 * Feature Flags Configuration
 * 
 * Use this file to enable/disable features across the application.
 * Set to `true` to enable, `false` to hide (but keep code intact).
 * 
 * Benefits:
 * - Quick toggle during demos/presentations
 * - Code remains in codebase for future use
 * - Centralized feature management
 * - No performance impact (conditional rendering)
 * 
 * 📍 FEATURE LOCATIONS (for easy reference):
 * ────────────────────────────────────────────────────────────────────
 * All hidden features are organized in: frontend/src/features/
 * 
 * CATCH_UP_FEED     → frontend/src/features/catch-up-feed/ActivityFeed.tsx
 *                      Used in: dashboard/page.tsx (line ~463)
 * 
 * TEAM_PULSE        → frontend/src/features/team-pulse/TeamPulse.tsx
 *                      Used in: dashboard/page.tsx (line ~512)
 * 
 * CREATE_TEAM_PAGE  → frontend/src/components/shared/Sidebar.tsx (line ~14)
 *                      Page: frontend/src/app/(dashboard)/create-team/page.tsx
 *                      Note: Page not moved (Next.js routing), only sidebar tab hidden
 * 
 * 📖 Detailed docs: frontend/src/features/README.md
 */

export const FEATURES = {
  // ── Dashboard Features ────────────────────────────────────────────
  CATCH_UP_FEED: false,        // Activity Feed on dashboard (hidden for now)
  TEAM_PULSE: false,           // Team Pulse widget on dashboard
  
  // ── Navigation Features ───────────────────────────────────────────
  CREATE_TEAM_PAGE: false,     // Create Team tab in sidebar & page access
  
  // ── Future Feature Flags ──────────────────────────────────────────
  // Add more feature flags here as needed:
  // WORKLOAD_VIEW: false,
  // RECURRING_PROJECTS: false,
  // IN_REVIEW_STATUS: false,
} as const;

export type FeatureFlag = keyof typeof FEATURES;

/**
 * Check if a feature is enabled
 * @param feature - The feature flag to check
 * @returns boolean indicating if feature is enabled
 */
export function isFeatureEnabled(feature: FeatureFlag): boolean {
  return FEATURES[feature];
}
