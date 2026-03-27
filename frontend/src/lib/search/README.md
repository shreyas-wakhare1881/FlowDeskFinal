# 🔍 Global Search System

Professional fuzzy search with keyboard shortcuts and real-time results.

---

## ✨ Features

### 🎯 Core Features
- **Fuzzy Search**: Typo-tolerant search (e.g., "projct" finds "project")
- **Multi-Category**: Search across Projects, Teams, Tasks, People
- **Keyboard Shortcuts**: 
  - `Cmd+K` (Mac) or `Ctrl+K` (Windows) - Open search
  - `Esc` - Close search
  - `↑` / `↓` - Navigate results
  - `Enter` - Select result
- **Recent Searches**: Automatically saved in localStorage
- **Instant Results**: Real-time search as you type
- **Weighted Scoring**: Project names ranked higher than tags

### 🎨 UI Features
- Modal overlay with backdrop blur
- Categorized results (Projects, Teams, People)
- Match highlighting
- Empty states
- Loading states
- Mobile-responsive

---

## 📂 Architecture

```
frontend/src/
├── lib/search/
│   ├── SearchContext.tsx      ← Global state & keyboard shortcuts
│   ├── searchEngine.ts        ← Fuse.js wrapper & search logic
│   ├── searchIndex.ts         ← Build search index from data
│   └── types.ts              ← TypeScript types
│
└── components/search/
    ├── GlobalSearch.tsx       ← Main modal component
    └── SearchResultItem.tsx   ← Individual result item
```

---

## 🚀 How It Works

### 1. **Search Index Building**
```typescript
// searchIndex.ts builds search index from projects
buildSearchIndex(projects) → SearchResult[]
```

### 2. **Search Engine**
```typescript
// searchEngine.ts uses Fuse.js for fuzzy matching
searchEngine.search(query) → SearchResult[]
```

### 3. **Context Provider**
```typescript
// SearchContext manages global state
<SearchProvider>
  - Keyboard shortcuts (Cmd+K)
  - Recent searches (localStorage)
  - Open/close modal state
</SearchProvider>
```

### 4. **UI Component**
```typescript
// GlobalSearch modal renders results
<GlobalSearch />
  - Input field
  - Categorized results
  - Keyboard navigation
```

---

## 🔧 Configuration

### Fuse.js Options
```typescript
// searchEngine.ts
const FUSE_OPTIONS = {
  threshold: 0.4,           // 0 = exact, 1 = match anything
  distance: 100,            // Max distance for fuzzy match
  minMatchCharLength: 2,    // Minimum chars to match
  keys: [
    { name: 'title', weight: 3 },      // Highest priority
    { name: 'subtitle', weight: 2 },
    { name: 'description', weight: 1 },
  ],
};
```

### Search Categories
```typescript
// types.ts
type SearchCategory = 'project' | 'team' | 'task' | 'person';
```

---

## 📝 Usage

### Opening Search
1. **Keyboard**: Press `Cmd+K` / `Ctrl+K`
2. **Mouse**: Click search bar in Topbar
3. **Mobile**: Click search icon in Topbar

### Searching
1. Type your query (min 2 characters)
2. Results appear instantly, grouped by category
3. Use arrow keys to navigate
4. Press `Enter` or click to select

### Recent Searches
- Last 5 searches automatically saved
- Click on recent search to repeat
- Clear button to delete history

---

## 🎯 Search Ranking

Results are ranked by relevance:

1. **Project Name Match** (weight: 3)  
   → "API Integration"
2. **Team/Person Name Match** (weight: 2)  
   → "Team Alpha", "John Doe"
3. **Description/Tags Match** (weight: 1)  
   → "Backend development project"

---

## 🔄 Data Flow

```
User Input
  ↓
SearchContext.performSearch(query)
  ↓
searchEngine.search(query)
  ↓
Fuse.js fuzzy matching
  ↓
Filtered & Sorted Results
  ↓
GlobalSearch.render()
```

---

## 🎨 Customization

### Add New Search Category
```typescript
// 1. Update types.ts
type SearchCategory = 'project' | 'team' | 'task' | 'person' | 'document';

// 2. Update searchIndex.ts
function buildSearchIndex(projects, documents) {
  // Add document indexing
}

// 3. Update searchEngine.ts keys
const FUSE_OPTIONS = {
  keys: [
    ...existing,
    { name: 'documentTitle', weight: 2 },
  ],
};
```

### Adjust Search Sensitivity
```typescript
// searchEngine.ts
threshold: 0.3  // More strict (exact matches)
threshold: 0.5  // More lenient (fuzzy matches)
```

---

## 🐛 Debugging

### Search Not Working?
1. Check if `SearchProvider` is in app layout (`Providers.tsx`)
2. Verify `Fuse.js` is installed (`npm list fuse.js`)
3. Check browser console for errors
4. Verify projects are loaded in `ProjectsContext`

### Keyboard Shortcut Not Working?
1. Check if another app is using `Cmd+K`
2. Try `Ctrl+K` on Windows
3. Check browser extensions blocking shortcuts

---

## 📦 Dependencies

- **fuse.js** - Fuzzy search library
- **react** - UI framework
- **next** - Routing & navigation

---

## 🔮 Future Enhancements

- [ ] Backend API integration for larger datasets
- [ ] Search filters (status, priority, date range)
- [ ] Search analytics (track popular queries)
- [ ] Voice search
- [ ] Search operators (`project:api team:alpha`)
- [ ] Saved searches
- [ ] Search suggestions/autocomplete

---

**Last Updated**: March 24, 2026  
**Author**: FlowDesk Development Team
