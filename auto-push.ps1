# Auto-push script for development changes
# Run this script to automatically commit and push changes

# Script parameters - allows customizing the commit message
# Usage: .\auto-push.ps1 -Message "your custom commit message"
param(
    [string]$Message = $null  # Will auto-generate if not provided
)

Write-Host "🔄 Checking for changes..." -ForegroundColor Yellow

# Check if there are any changes
$status = git status --porcelain
if ($status) {
    Write-Host "📝 Changes detected, committing..." -ForegroundColor Green
    
    # Auto-generate commit message if not provided
    if (-not $Message) {
        # Get list of changed files
        $changedFiles = git diff --name-only HEAD
        $stagedFiles = git diff --cached --name-only
        $allChangedFiles = ($changedFiles + $stagedFiles) | Sort-Object | Get-Unique
        
        # Determine commit type based on file changes
        $commitType = "feat"
        $description = @()
        
        foreach ($file in $allChangedFiles) {
            if ($file -match "\.tsx?$|\.jsx?$") {
                if ($file -match "components|views") {
                    $description += "update UI components"
                } elseif ($file -match "api|server") {
                    $description += "update API logic"
                } else {
                    $description += "update code"
                }
            } elseif ($file -match "\.css$|\.scss$|\.less$") {
                $description += "update styles"
            } elseif ($file -match "\.json$") {
                if ($file -match "package") {
                    $description += "update dependencies"
                } else {
                    $description += "update config"
                }
            } elseif ($file -match "\.md$") {
                $description += "update documentation"
            } elseif ($file -match "\.ps1$|\.sh$") {
                $description += "update scripts"
            } else {
                $description += "update files"
            }
        }
        
        # Create unique description
        $uniqueDescriptions = $description | Sort-Object | Get-Unique
        $descriptionText = $uniqueDescriptions -join ", "
        
        # Generate final message
        $Message = "$commitType`: $descriptionText"
    }
    
    # Add all changes
    git add .
    
    # Commit with timestamp
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $commitMessage = "$Message - $timestamp"
    git commit -m $commitMessage
    
    # Push to remote
    Write-Host "🚀 Pushing to remote..." -ForegroundColor Blue
    git push origin main
    
    Write-Host "✅ Changes pushed successfully!" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No changes to commit" -ForegroundColor Cyan
}
