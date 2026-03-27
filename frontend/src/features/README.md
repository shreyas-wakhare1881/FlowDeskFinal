# 🔒 Hidden Features Folder

This folder contains features that are **temporarily disabled** but kept in the codebase for future use.

## 📍 Why This Folder?

- **Code Preservation**: Features are hidden, not deleted
- **Easy Discovery**: All hidden features in one place
- **Quick Toggle**: Change feature flags to re-enable
- **Future-Ready**: Code stays for when features are needed

---

## 🗂️ Current Hidden Features

### 1. **Catch-Up Feed** (`/catch-up-feed/`)
- **Component**: `ActivityFeed.tsx`
- **Location**: Dashboard page
- **Feature Flag**: `FEATURES.CATCH_UP_FEED` (in `/config/features.ts`)
- **Description**: Activity feed showing recent project updates, team actions, and notifications
- **Status**: Hidden (can be re-enabled by manager)

### 2. **Team Pulse** (`/team-pulse/`)
- **Component**: `TeamPulse.tsx`
- **Location**: Dashboard page (right sidebar)
- **Feature Flag**: `FEATURES.TEAM_PULSE` (in `/config/features.ts`)
- **Description**: Real-time team availability widget with "Nudge" functionality
- **Status**: Hidden (can be re-enabled by manager)

### 3. **Create Team Page** (`/create-team/`)
- **Page**: Full page in `/app/(dashboard)/create-team/`
- **Navigation**: Sidebar "Create Team" tab
- **Feature Flag**: `FEATURES.CREATE_TEAM_PAGE` (in `/config/features.ts`)
- **Description**: Team creation page with member assignment
- **Status**: Hidden from sidebar navigation

---

## 🔄 How to Re-Enable Features

1. Open: `frontend/src/config/features.ts`
2. Change flag from `false` to `true`:
   ```typescript
   export const FEATURES = {
     CATCH_UP_FEED: true,     // ✅ Now visible
     TEAM_PULSE: true,        // ✅ Now visible
     CREATE_TEAM_PAGE: true,  // ✅ Now visible
   } as const;
   ```
3. Save file and refresh browser

---

## 📦 Adding New Hidden Features

1. Move component/page to appropriate subfolder here
2. Add feature flag in `/config/features.ts`
3. Wrap component with conditional: `{FEATURES.YOUR_FLAG && <Component />}`
4. Update this README with details

---

## ⚠️ Important Notes

- **Do NOT delete** files from this folder unless feature is permanently removed
- Components here are **fully functional** - just hidden from UI
- Import paths use `@/features/...` for consistency
- Feature flags control visibility, not functionality

---

**Last Updated**: March 24, 2026  
**Maintained By**: Development Team
