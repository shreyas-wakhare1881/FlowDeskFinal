# 🚀 Quick Reference: Hidden Features System

## 📍 Where to Look

### Want to hide/show a feature?
👉 **Go to**: `frontend/src/config/features.ts`

### Want to find hidden feature code?
👉 **Go to**: `frontend/src/features/` folder

### Want to see what's hidden?
👉 **Read**: `frontend/src/features/README.md`

---

## ⚡ Quick Actions

### Hide a Feature
```typescript
// frontend/src/config/features.ts
export const FEATURES = {
  CATCH_UP_FEED: false,     // ❌ Hidden
} as const;
```

### Show a Feature
```typescript
// frontend/src/config/features.ts
export const FEATURES = {
  CATCH_UP_FEED: true,      // ✅ Visible
} as const;
```

---

## 📂 Folder Structure

```
frontend/src/
├── config/
│   └── features.ts          ← Toggle features here (1 line change)
│
└── features/                ← All hidden features here
    ├── README.md            ← Full documentation
    ├── catch-up-feed/
    │   └── ActivityFeed.tsx
    ├── team-pulse/
    │   └── TeamPulse.tsx
    └── create-team/
        └── README.md
```

---

## 🎯 Currently Hidden Features

| Feature | Status | Location |
|---------|--------|----------|
| Catch-Up Feed | 🔴 Hidden | `features/catch-up-feed/` |
| Team Pulse | 🔴 Hidden | `features/team-pulse/` |
| Create Team Page | 🔴 Hidden | Sidebar navigation only |

---

## 💡 Benefits

✅ **Easy to Find**: All hidden features in one folder  
✅ **Easy to Toggle**: One-line change in config  
✅ **Safe**: Code preserved, not deleted  
✅ **Fast**: Show/hide in seconds  
✅ **Organized**: Clear documentation

---

**For Manager**: Just tell developer which feature to enable!  
**For Developer**: Change `false` to `true` in `features.ts`

---

**Created**: March 24, 2026
