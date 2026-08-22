param(
    [string]$OutputFile = ""
)

$ErrorActionPreference = "Stop"

$BackupDir = Join-Path $PSScriptRoot "..\backups"
if (!(Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

if ([string]::IsNullOrEmpty($OutputFile)) {
    $Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $OutputFile = Join-Path $BackupDir "wolverine_intel_backup_$Timestamp.sql"
}

Write-Host "[Backup] Exporting wolverine_intel database to $OutputFile ..." -ForegroundColor Cyan

docker exec wolverine-postgres pg_dump -U postgres -d wolverine_intel --clean --if-exists > $OutputFile

if (Test-Path $OutputFile) {
    $Size = (Get-Item $OutputFile).Length
    Write-Host "[Backup] Successfully created database backup ($Size bytes) at $OutputFile" -ForegroundColor Green
} else {
    Write-Error "[Backup] Failed to generate backup file."
}
