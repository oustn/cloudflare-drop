# Auto-Push Setup

This repository now includes automated scripts to commit and push changes quickly during development.

## Usage

### Windows (PowerShell)
```bash
npm run auto-push
```
or
```powershell
.\auto-push.ps1
```

### Unix/Mac/Linux (Bash)
```bash
npm run auto-push:bash
```
or
```bash
./auto-push.sh
```

### With Custom Message
```powershell
.\auto-push.ps1 "feat: your custom commit message"
```
```bash
./auto-push.sh "feat: your custom commit message"
```

## What it does

1. 🔄 Checks for uncommitted changes
2. 📝 Stages all changes (`git add .`)
3. 💬 Commits with timestamp and message
4. 🚀 Pushes to `origin main`
5. ✅ Confirms success

## Default Commit Message

If no message is provided, it uses: `"feat: automatic development changes - [timestamp]"`

## Security Note

These scripts are for development convenience. In production workflows, always review changes before committing.
