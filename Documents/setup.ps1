# ============================================================
#  PM Tool - Auto Setup Script
#  Run this ONCE after cloning the repository
#  Usage: .\setup.ps1
# ============================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   PM Tool - Project Setup Starting     " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $root "backend"
$frontendPath = Join-Path $root "frontend"

# ─────────────────────────────────────────
# STEP 1: Backend - npm install
# ─────────────────────────────────────────
Write-Host "[1/6] Backend dependencies install kar raha hoon..." -ForegroundColor Yellow
Set-Location $backendPath
npm install
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: Backend npm install failed!" -ForegroundColor Red; exit 1 }
Write-Host "      Done!" -ForegroundColor Green

# ─────────────────────────────────────────
# STEP 2: Backend - .env file banana
# ─────────────────────────────────────────
Write-Host ""
Write-Host "[2/6] Backend .env file check kar raha hoon..." -ForegroundColor Yellow
$envPath = Join-Path $backendPath ".env"
if (-Not (Test-Path $envPath)) {
    @"
DATABASE_URL="file:./dev.db"
PORT=3001
"@ | Set-Content $envPath
    Write-Host "      .env file create ki!" -ForegroundColor Green
} else {
    Write-Host "      .env already exist karti hai, skip!" -ForegroundColor Gray
}

# ─────────────────────────────────────────
# STEP 3: Prisma Generate
# ─────────────────────────────────────────
Write-Host ""
Write-Host "[3/6] Prisma Client generate kar raha hoon..." -ForegroundColor Yellow
Set-Location $backendPath
npx prisma generate --config prisma.config.ts
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: Prisma generate failed!" -ForegroundColor Red; exit 1 }
Write-Host "      Done!" -ForegroundColor Green

# ─────────────────────────────────────────
# STEP 4: Prisma Migrate (DB create)
# ─────────────────────────────────────────
Write-Host ""
Write-Host "[4/6] Database create + migrations run kar raha hoon..." -ForegroundColor Yellow
Set-Location $backendPath
npx prisma migrate deploy --config prisma.config.ts
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: Prisma migrate failed!" -ForegroundColor Red; exit 1 }
Write-Host "      Done! (dev.db created)" -ForegroundColor Green

# ─────────────────────────────────────────
# STEP 5: Frontend - npm install
# ─────────────────────────────────────────
Write-Host ""
Write-Host "[5/6] Frontend dependencies install kar raha hoon..." -ForegroundColor Yellow
Set-Location $frontendPath
npm install
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: Frontend npm install failed!" -ForegroundColor Red; exit 1 }
Write-Host "      Done!" -ForegroundColor Green

# ─────────────────────────────────────────
# STEP 6: Frontend - .env.local banana
# ─────────────────────────────────────────
Write-Host ""
Write-Host "[6/6] Frontend .env.local file check kar raha hoon..." -ForegroundColor Yellow
$envLocalPath = Join-Path $frontendPath ".env.local"
if (-Not (Test-Path $envLocalPath)) {
    @"
NEXT_PUBLIC_API_URL=http://localhost:3001/api
"@ | Set-Content $envLocalPath
    Write-Host "      .env.local create ki!" -ForegroundColor Green
} else {
    Write-Host "      .env.local already exist karti hai, skip!" -ForegroundColor Gray
}

# ─────────────────────────────────────────
# DONE!
# ─────────────────────────────────────────
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   Setup Complete!                      " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Ab project run karne ke liye:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Terminal 1 (Backend):" -ForegroundColor White
Write-Host "    cd backend" -ForegroundColor Gray
Write-Host "    npm run start:dev" -ForegroundColor Gray
Write-Host ""
Write-Host "  Terminal 2 (Frontend):" -ForegroundColor White
Write-Host "    cd frontend" -ForegroundColor Gray
Write-Host "    npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "  Browser mein open karo: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""

Set-Location $root
