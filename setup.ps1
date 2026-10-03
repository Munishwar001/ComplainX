# ComplanX Windows Setup Script
Write-Host "`n=== ComplanX Setup ===" -ForegroundColor Cyan

# Install dependencies
Write-Host "`n[1/4] Installing dependencies..." -ForegroundColor Yellow
npm install
npm install --prefix client
npm install --prefix server

# Check for Docker
$dockerAvailable = Get-Command docker -ErrorAction SilentlyContinue
if ($dockerAvailable) {
    Write-Host "`n[2/4] Starting PostgreSQL via Docker..." -ForegroundColor Yellow
    docker-compose up -d
    Start-Sleep -Seconds 5
} else {
    Write-Host "`n[2/4] Docker not found. Please ensure PostgreSQL is running at localhost:5432" -ForegroundColor Red
    Write-Host "      You can install PostgreSQL from: https://www.postgresql.org/download/windows/" -ForegroundColor Gray
    Write-Host "      Or install Docker Desktop from: https://www.docker.com/products/docker-desktop/" -ForegroundColor Gray
    Write-Host "      Then run: docker-compose up -d" -ForegroundColor Gray
    Read-Host "Press Enter once PostgreSQL is running to continue"
}

# Run migrations
Write-Host "`n[3/4] Running database migrations..." -ForegroundColor Yellow
Set-Location server
npx prisma migrate dev --name init
Set-Location ..

# Seed database
Write-Host "`n[4/4] Seeding database..." -ForegroundColor Yellow
npm run db:seed

Write-Host "`n=== Setup Complete! ===" -ForegroundColor Green
Write-Host "Run 'npm run dev' to start the application." -ForegroundColor Cyan
Write-Host "`nDemo credentials:" -ForegroundColor White
Write-Host "  User:  demo@complanx.app / Demo@1234" -ForegroundColor Gray
Write-Host "  Admin: admin@complanx.app / Demo@1234" -ForegroundColor Gray
