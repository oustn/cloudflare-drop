#!/bin/bash
# Auto-push script for development changes (Unix/Mac version)
# Usage: ./auto-push.sh ["commit message"]

MESSAGE=${1:-"feat: automatic development changes"}

echo "🔄 Checking for changes..."

# Check if there are any changes
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 Changes detected, committing..."
    
    # Add all changes
    git add .
    
    # Commit with timestamp
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    COMMIT_MESSAGE="$MESSAGE - $TIMESTAMP"
    git commit -m "$COMMIT_MESSAGE"
    
    # Push to remote
    echo "🚀 Pushing to remote..."
    git push origin main
    
    echo "✅ Changes pushed successfully!"
else
    echo "ℹ️  No changes to commit"
fi
