# AlphaTerminal Pro - Automated Public Internet Tunnel Engine
# Generates encrypted HTTPS URL, copies to clipboard, and opens browser automatically

$ErrorActionPreference = "Continue"
$BaseDir = $PSScriptRoot
if (-not $BaseDir) { $BaseDir = (Get-Location).Path }

$CloudflaredExe = "$BaseDir\cloudflared.exe"

if (-not (Test-Path $CloudflaredExe)) {
    Write-Host "[ERROR] cloudflared.exe not found in $BaseDir." -ForegroundColor Red
    exit 1
}

Write-Host "`n===============================================================================" -ForegroundColor Cyan
Write-Host "    CONNECTING DASHBOARD TO CLOUDFLARE GLOBAL EDGE NETWORK...                 " -ForegroundColor Green
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "Requesting encrypted HTTPS address on trycloudflare.com...`n" -ForegroundColor Yellow

$procInfo = New-Object System.Diagnostics.ProcessStartInfo
$procInfo.FileName = $CloudflaredExe
$procInfo.Arguments = "tunnel --url http://localhost:3000 --http-host-header localhost"
$procInfo.RedirectStandardError = $true
$procInfo.RedirectStandardOutput = $true
$procInfo.UseShellExecute = $false
$procInfo.CreateNoWindow = $true

$process = New-Object System.Diagnostics.Process
$process.StartInfo = $procInfo
$process.Start() | Out-Null

$tunnelUrl = $null
$startTime = [DateTime]::UtcNow

# Read output line by line until trycloudflare.com URL is generated
while (-not $process.HasExited -and -not $tunnelUrl) {
    if (([DateTime]::UtcNow - $startTime).TotalSeconds -gt 25) { break }
    
    $line = $process.StandardError.ReadLine()
    if ($line) {
        if ($line -match 'https://[a-zA-Z0-9-]+\.trycloudflare\.com') {
            $tunnelUrl = $matches[0]
            break
        }
    }
}

if ($tunnelUrl) {
    Write-Host "`n===============================================================================" -ForegroundColor Green
    Write-Host " [SUCCESS] YOUR LIVE DASHBOARD IS NOW ACCESSIBLE WORLDWIDE!" -ForegroundColor Green
    Write-Host "===============================================================================" -ForegroundColor Green
    Write-Host "`n  PUBLIC HTTPS LINK : " -NoNewline -ForegroundColor White
    Write-Host $tunnelUrl -ForegroundColor Yellow
    Write-Host "`n  -> Link copied to your clipboard!" -ForegroundColor Cyan
    Write-Host "  -> Opening link in your browser now..." -ForegroundColor Cyan
    Write-Host "===============================================================================" -ForegroundColor Green
    Write-Host "Keep this window OPEN while you want online access enabled." -ForegroundColor DarkGray
    Write-Host "Press Ctrl+C or close this window to stop sharing online.`n" -ForegroundColor DarkGray

    # Copy to clipboard
    try { Set-Clipboard -Value $tunnelUrl } catch {}

    # Open in browser automatically
    Start-Process $tunnelUrl

    # Keep process running
    $process.WaitForExit()
} else {
    Write-Host "[!] Waiting for tunnel connection, streaming logs directly:" -ForegroundColor Yellow
    & $CloudflaredExe tunnel --url http://localhost:3000 --http-host-header localhost
}
