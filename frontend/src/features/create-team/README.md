# Create Team Feature

## 📍 Location
This feature is spread across multiple files:

- **Sidebar Entry**: `frontend/src/components/shared/Sidebar.tsx` (line ~14)
- **Full Page**: `frontend/src/app/(dashboard)/create-team/page.tsx`
- **Route**: `/create-team`

## 🎯 Purpose
Allows users to create new teams, add members, and assign teams to projects.

## 🔒 Current Status
**Hidden** via `FEATURES.CREATE_TEAM_PAGE` flag in `/config/features.ts`

## 🔄 How It's Hidden
The sidebar filters out the "Create Team" navigation item when the feature flag is `false`:

```typescript
{navItems
  .filter(item => {
    if (item.path === '/create-team' && !FEATURES.CREATE_TEAM_PAGE) {
      return false;
    }
    return true;
  })
  .map((item) => { ... })
}
```

## ⚠️ Note
The actual page file (`/app/(dashboard)/create-team/page.tsx`) is **not moved** to this folder because:
- It's part of Next.js App Router structure
- Moving it would break the routing system
- Only the sidebar navigation is hidden (page remains accessible via direct URL)

## 🔓 Re-Enable
Set `CREATE_TEAM_PAGE: true` in `/config/features.ts` to show the sidebar tab again.

---

**Component Location**: Original location (not moved)  
**Control**: Feature flag only  
**Last Updated**: March 24, 2026
