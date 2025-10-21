# Cloudflare Drop Setup Script for Windows (PowerShell)
# Run this script to create the required Cloudflare resources

Write-Host "Creating Cloudflare Drop Resources..." -ForegroundColor Green

# Check if wrangler is installed
try {
    $wranglerVersion = npx wrangler --version
    Write-Host "Using Wrangler: $wranglerVersion" -ForegroundColor Blue
} catch {
    Write-Host "Error: Wrangler not found. Please install it first:" -ForegroundColor Red
    Write-Host "npm install -g wrangler" -ForegroundColor Yellow
    exit 1
}

# Create D1 Database
Write-Host "`nCreating D1 Database..." -ForegroundColor Yellow
$d1Output = npx wrangler d1 create airdrop 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host $d1Output -ForegroundColor Green
    
    # Extract Database ID from output
    $d1Id = ($d1Output | Select-String "Database ID: (.+)" | ForEach-Object { $_.Matches.Groups[1].Value })
    if ($d1Id) {
        Write-Host "`nD1 Database ID: $d1Id" -ForegroundColor Cyan
        Write-Host "Save this ID for GitHub secrets as D1_ID" -ForegroundColor Yellow
    }
} else {
    Write-Host "Failed to create D1 database: $d1Output" -ForegroundColor Red
}

# Create KV Namespace
Write-Host "`nCreating KV Namespace..." -ForegroundColor Yellow
$kvOutput = npx wrangler kv:namespace create "file_drops" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host $kvOutput -ForegroundColor Green
    
    # Extract Namespace ID from output
    $kvId = ($kvOutput | Select-String "with id: (.+)" | ForEach-Object { $_.Matches.Groups[1].Value })
    if ($kvId) {
        Write-Host "`nKV Namespace ID: $kvId" -ForegroundColor Cyan
        Write-Host "Save this ID for GitHub secrets as KV_ID" -ForegroundColor Yellow
    }
} else {
    Write-Host "Failed to create KV namespace: $kvOutput" -ForegroundColor Red
}

Write-Host "`n" + "="*60 -ForegroundColor Green
Write-Host "SETUP COMPLETE - Next Steps:" -ForegroundColor Green
Write-Host "="*60 -ForegroundColor Green
Write-Host "1. Go to your GitHub repository settings" -ForegroundColor White
Write-Host "2. Navigate to: Settings > Secrets and variables > Actions" -ForegroundColor White
Write-Host "3. Add these repository secrets:" -ForegroundColor White

if ($d1Id) {
    Write-Host "   - D1_ID: $d1Id" -ForegroundColor Cyan
}
Write-Host "   - D1_NAME: airdrop" -ForegroundColor Cyan
if ($kvId) {
    Write-Host "   - KV_ID: $kvId" -ForegroundColor Cyan
}

Write-Host "`n4. Optional secrets:" -ForegroundColor White
Write-Host "   - CUSTOM_DOMAIN: your-domain.com (if you have one)" -ForegroundColor Gray
Write-Host "   - ADMIN_TOKEN: your-secure-admin-token" -ForegroundColor Gray

Write-Host "`n5. Optional variables (Settings > Secrets and variables > Actions > Variables):" -ForegroundColor White
Write-Host "   - SHARE_MAX_SIZE_IN_MB: 10 (or your preferred limit)" -ForegroundColor Gray
Write-Host "   - SHARE_DURATION: 1 (hours)" -ForegroundColor Gray

Write-Host "`n6. Re-run your GitHub Actions deployment" -ForegroundColor White
Write-Host "="*60 -ForegroundColor Green
