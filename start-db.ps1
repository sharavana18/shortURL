# Create database directory if it does not exist
$dbPath = Join-Path $PSScriptRoot "mongodb-data"
if (!(Test-Path $dbPath)) {
    New-Item -ItemType Directory -Path $dbPath | Out-Null
    Write-Host "Created local database directory: $dbPath"
}

# Locate mongod.exe
$mongodExe = Join-Path $PSScriptRoot "mongodb-win32-x86_64-windows-7.0.6\bin\mongod.exe"
if (!(Test-Path $mongodExe)) {
    Write-Error "Could not find mongod.exe at: $mongodExe"
    exit 1
}

# Clean stale lock files
$lockFile = Join-Path $dbPath "mongod.lock"
if (Test-Path $lockFile) {
    Remove-Item $lockFile -Force -ErrorAction SilentlyContinue
    Write-Host "Removed stale mongod.lock file."
}

# Check if port 27017 is already in use
$portInUse = Get-NetTCPConnection -LocalPort 27017 -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "A service is already listening on port 27017. Skipping database launch."
    exit 0
}

Write-Host "Launching local MongoDB database on 127.0.0.1:27017..."
$logPath = Join-Path $PSScriptRoot "mongodb.log"

# Start the mongod process in the background with diagnostic collections disabled
$proc = Start-Process -FilePath $mongodExe -ArgumentList "--dbpath `"$dbPath`" --port 27017 --bind_ip 127.0.0.1 --logpath `"$logPath`" --setParameter diagnosticDataCollectionEnabled=false" -PassThru -NoNewWindow

if ($proc) {
    Write-Host "MongoDB started in background (PID: $($proc.Id)). Logs: $logPath"
} else {
    Write-Error "Failed to start MongoDB."
}
