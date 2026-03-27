# PM Tool — Project Management Tool

A full-stack project management tool built with **Next.js** (frontend) + **NestJS** (backend) + **SQLite** (database via Prisma).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS |
| Backend | NestJS 11, TypeScript |
| Database | SQLite (via Prisma ORM) |
| Port (Frontend) | `http://localhost:3000` |
| Port (Backend) | `http://localhost:3001/api` |

---

## First Time Setup (Sirf Ek Baar)

### Option A — Automatic (Recommended) ✅

Clone ke baad ek hi command chalao:

```powershell
git clone https://github.com/shreyas-wakhare1881/pm-tool-.git
cd pm-tool-
.\setup.ps1
```

Script automatically ye sab kar degi:
1. Backend `npm install`
2. Backend `.env` file create
3. Prisma Client generate
4. Database create + migrations run
5. Frontend `npm install`
6. Frontend `.env.local` file create

---

### Option B — Manual Steps

#### Step 1 — Repository Clone karo
```bash
git clone https://github.com/shreyas-wakhare1881/pm-tool-.git
cd pm-tool-
```

#### Step 2 — Backend Setup

```bash
cd backend
npm install
```

Backend mein `.env` file banao:
```
DATABASE_URL="file:./dev.db"
PORT=3001
```

Prisma Client generate karo:
```bash
npx prisma generate --config prisma.config.ts
```

Database create karo (migrations run karo):
```bash
npx prisma migrate deploy --config prisma.config.ts
```

#### Step 3 — Frontend Setup

Naya terminal kholo:
```bash
cd frontend
npm install
```

Frontend mein `.env.local` file banao:
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

---

## Project Run Karna (Roz Ka Kaam)

Setup ke baad sirf ye 2 commands roz chalani hain:

**Terminal 1 — Backend:**
```bash
cd backend
npm run start:dev
```
> Backend `http://localhost:3001/api` pe start ho jayega

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```
> Frontend `http://localhost:3000` pe start ho jayega

Browser mein open karo: **http://localhost:3000**

---

## Project Structure

```
pm-tool-/
├── setup.ps1              ← Auto setup script (run once after clone)
├── frontend/              ← Next.js App
│   ├── src/
│   │   ├── app/           ← Pages (login, dashboard, create, view, workspace)
│   │   ├── components/    ← Reusable UI components
│   │   ├── lib/           ← API service functions
│   │   └── types/         ← TypeScript types
│   └── package.json
└── backend/               ← NestJS API
    ├── src/
    │   ├── projects/      ← Projects module (CRUD)
    │   ├── tasks/         ← Tasks module (CRUD)
    │   └── prisma/        ← Database service
    ├── prisma/
    │   ├── schema.prisma  ← Database schema
    │   └── migrations/    ← Database migrations
    └── package.json
```

---

## API Endpoints

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | Saare projects |
| POST | `/api/projects` | Naya project banao |
| GET | `/api/projects/:id` | Project by ID |
| GET | `/api/projects/project-id/:projectID` | Project by PRJ-XXX |
| GET | `/api/projects/stats` | Project statistics |
| PUT | `/api/projects/:id` | Project update karo |
| DELETE | `/api/projects/:id` | Project delete karo |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | Saare tasks |
| POST | `/api/tasks` | Naya task banao |
| GET | `/api/tasks/:id` | Task by ID |
| GET | `/api/tasks/stats/:projectId` | Task statistics |
| PUT | `/api/tasks/:id` | Task update karo |
| DELETE | `/api/tasks/:id` | Task delete karo |

---

## Important Notes

- `.env` aur `.env.local` files **gitignore** mein hain — security ke liye push nahi hoti, manually banana padta hai
- `node_modules/` push nahi hoti — `npm install` se automatically aa jaati hai
- `dev.db` (SQLite database) push nahi hoti — `prisma migrate deploy` se automatically create hoti hai
