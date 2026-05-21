$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

Write-Host "Running supabase db reset..."

$outFile = "$env:TEMP\supabase-reset.log"
Remove-Item $outFile -ErrorAction SilentlyContinue

# Use cmd.exe for clean stdout/stderr capture
$cmd = "npx supabase db reset > `"$outFile`" 2>&1"
cmd.exe /c $cmd
$exitCode = $LASTEXITCODE

$combined = ""
if (Test-Path $outFile) { $combined = Get-Content $outFile -Raw }

# Check if the only failure is the storage container health check
$hasStorageError = $combined -match "supabase_storage_app container is not ready"
$migrationsApplied = $combined -match "Applying migration \d+_.*\.sql"

if ($exitCode -eq 0) {
    Write-Host "supabase db reset completed successfully." -ForegroundColor Green
    exit 0
}

if ($hasStorageError -and $migrationsApplied) {
    Write-Host "db reset applied all migrations but storage container health check failed (known Docker Desktop bug)." -ForegroundColor Yellow
    Write-Host "Recovering storage container..." -ForegroundColor Cyan

    docker restart supabase_storage_app | Out-Null
    Start-Sleep -Seconds 5

    $healthy = $false
    for ($i = 0; $i -lt 30; $i++) {
        $health = docker inspect --format='{{.State.Health.Status}}' supabase_storage_app 2>$null
        if ($health -eq "healthy") {
            $healthy = $true
            break
        }
        Start-Sleep -Seconds 2
    }

    if ($healthy) {
        Write-Host "Storage container recovered. db reset was successful." -ForegroundColor Green
        exit 0
    } else {
        Write-Host "Storage container still unhealthy. Running full supabase start..." -ForegroundColor Red
        cmd.exe /c "npx supabase start" | Out-Null
        $health = docker inspect --format='{{.State.Health.Status}}' supabase_storage_app 2>$null
        if ($health -eq "healthy") {
            Write-Host "All services are up. db reset was successful." -ForegroundColor Green
            exit 0
        } else {
            Write-Host "Storage container remains unhealthy. Check Docker Desktop." -ForegroundColor Red
            exit 1
        }
    }
}

Write-Host "supabase db reset failed with an unexpected error." -ForegroundColor Red
if (Test-Path $outFile) { Write-Host (Get-Content $outFile -Raw) }
exit $exitCode
