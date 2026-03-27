/**
 * Hidden Features Index
 * 
 * Centralized exports for all features in this folder.
 * Import from here for consistency: import { ActivityFeed } from '@/features'
 */

// Catch-Up Feed Feature
export { default as ActivityFeed } from './catch-up-feed/ActivityFeed';

// Team Pulse Feature
export { default as TeamPulse } from './team-pulse/TeamPulse';

// Note: Create Team page is not exported here as it's a Next.js page route,
// not a reusable component. See /features/create-team/README.md for details.
