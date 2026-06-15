# Set Execution Policy and refresh PATH for local session
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
$env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "User") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "Machine")

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "        ZapLink - URL Shortener Platform         " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# 1. Start Database
Write-Host "`n[1/3] Starting local MongoDB instance..." -ForegroundColor Yellow
& "$PSScriptRoot\start-db.ps1"

# Short delay to let DB initialize
Start-Sleep -Seconds 2

# Verify Port 27017 is listening
$dbRunning = Get-NetTCPConnection -LocalPort 27017 -ErrorAction SilentlyContinue
if (!$dbRunning) {
    Write-Warning "Could not confirm MongoDB is listening on port 27017. Attempting to proceed anyway..."
}

# 2. Start Backend
Write-Host "`n[2/3] Starting Express Backend (Port 5000)..." -ForegroundColor Yellow
$backendDir = Join-Path $PSScriptRoot "backend"
$backendProc = Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory $backendDir -PassThru -NoNewWindow

# 3. Start Frontend
Write-Host "`n[3/3] Starting React Frontend (Port 5173)..." -ForegroundColor Yellow
$frontendDir = Join-Path $PSScriptRoot "frontend"
# Run Vite using powershell with bypass to avoid execution restrictions on npm.ps1
$frontendProc = Start-Process -FilePath "powershell" -ArgumentList "-ExecutionPolicy Bypass -Command `"& npm run dev`"" -WorkingDirectory $frontendDir -PassThru -NoNewWindow

Write-Host "`n==================================================" -ForegroundColor Green
Write-Host " ZAPLINK SERVICES RUNNING IN BACKGROUND!" -ForegroundColor Green
Write-Host "  - React Dashboard:   http://localhost:5173" -ForegroundColor Green
Write-Host "  - Backend REST API:  http://localhost:5000" -ForegroundColor Green
Write-Host "  - Redirects Router:  http://localhost:5000/r/:code" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host "Keep this window open to keep services active." -ForegroundColor Green
Write-Host "To shut down all services, press Ctrl+C or close this window." -ForegroundColor Green

# Wait loop and graceful cleanup on termination
try {
    while ($true) {
        if ($backendProc.HasExited) {
            Write-Error "Backend process stopped unexpectedly."
            break
        }
        if ($frontendProc.HasExited) {
            Write-Error "Frontend process stopped unexpectedly."
            break
        }
        Start-Sleep -Seconds 1
    }
}
finally {
    Write-Host "`nShutting down ZapLink background services..." -ForegroundColor Yellow
    
    # Terminate backend process
    if ($backendProc -and !$backendProc.HasExited) {
        Write-Host "Stopping backend (PID: $($backendProc.Id))..."
        Stop-Process -Id $backendProc.Id -Force -ErrorAction SilentlyContinue
    }
    
    # Terminate frontend process
    if ($frontendProc -and !$frontendProc.HasExited) {
        Write-Host "Stopping frontend (PID: $($frontendProc.Id))..."
        Stop-Process -Id $frontendProc.Id -Force -ErrorAction SilentlyContinue
    }

    # Terminate local mongod processes running in workspace data directory
    $mongodProcs = Get-Process -Name mongod -ErrorAction SilentlyContinue
    foreach ($p in $mongodProcs) {
        $cmdLine = (Get-CimInstance Win32_Process -Filter "ProcessId = $($p.Id)").CommandLine
        if ($cmdLine -and $cmdLine.Contains("mongodb-data")) {
            Write-Host "Stopping local database daemon (PID: $($p.Id))..."
            Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
        }
    }
    
    Write-Host "ZapLink services terminated successfully." -ForegroundColor Green
}
