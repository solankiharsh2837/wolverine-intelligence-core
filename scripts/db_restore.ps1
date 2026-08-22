param(
    [string]$InputFile = ""
)

$ErrorActionPreference = "Stop"

$BackupDir = Join-Path $PSScriptRoot "..\backups"

if ([string]::IsNullOrEmpty($InputFile)) {
    $Latest = Get-ChildItem -Path $BackupDir -Filter "*.sql" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($null -eq $Latest) {
        Write-Error "[Restore] No SQL backup files found in $BackupDir."
        exit 1
    }
    $InputFile = $Latest.FullName
}

if (!(Test-Path $InputFile)) {
    Write-Error "[Restore] Specified backup file does not exist: $InputFile"
    exit 1
}

Write-Host "[Restore] Restoring wolverine_intel database from $InputFile ..." -ForegroundColor Cyan

Get-Content $InputFile | docker exec -i wolverine-postgres psql -U postgres -d wolverine_intel

Write-Host "[Restore] Successfully restored database from $InputFile" -ForegroundColor Green
