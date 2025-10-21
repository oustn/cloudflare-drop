# Cloudflare Drop Deployment Setup Guide

This guide will help you fix the deployment errors and properly configure your Cloudflare Drop application.

## Issues Found

1. **Missing D1 Database Configuration**: The application requires a D1 database but it's not properly configured.
2. **Missing KV Namespace Configuration**: The application requires a KV namespace for file storage.
3. **Missing GitHub Secrets**: The deployment process expects certain environment variables to be set as GitHub secrets.

## Step-by-Step Fix

### 1. Create Cloudflare Resources

#### Create D1 Database
```bash
npx wrangler d1 create airdrop
```
This will output something like:
```
✅ Successfully created DB 'airdrop' in region EEUR
Database ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```
**Save the Database ID** - you'll need it for GitHub secrets.

#### Create KV Namespace
```bash
npx wrangler kv:namespace create "file_drops"
```
This will output something like:
```
✅ Successfully created namespace "file_drops" with id: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
**Save the Namespace ID** - you'll need it for GitHub secrets.

### 2. Configure GitHub Secrets

In your GitHub repository, go to **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these secrets:
- `D1_ID`: The Database ID from step 1
- `D1_NAME`: `airdrop` (the database name)
- `KV_ID`: The Namespace ID from step 1

Optional secrets:
- `CUSTOM_DOMAIN`: Your custom domain (if you have one)
- `SHARE_MAX_SIZE_IN_MB`: Maximum file size in MB (default: 10)
- `SHARE_DURATION`: Share duration in hours (default: 1)
- `ADMIN_TOKEN`: Admin authentication token (optional)

### 3. Update Wrangler Version

The deployment logs show Wrangler is out of date. Update your package.json:

```json
{
  "devDependencies": {
    "wrangler": "^4.0.0"
  }
}
```

### 4. Re-run GitHub Actions

After configuring the secrets:
1. Go to **Actions** tab in your GitHub repository
2. Find the failed deployment
3. Click **Re-run all jobs**

## Local Development Setup

For local development, create a `.dev.vars` file with:
```
ENVIRONMENT=development
SHARE_PORT=3000
SHARE_MAX_SIZE_IN_MB=10
SHARE_DURATION=1
ADMIN_TOKEN=your-admin-token-here
```

Then run:
```bash
npm run start
```

## Verification

After successful deployment, your application should be available at:
- Your custom domain (if configured)
- Or your `*.workers.dev` subdomain

## Troubleshooting

If you continue to have issues:

1. **Check GitHub Actions logs** for specific error messages
2. **Verify secrets are set correctly** in repository settings
3. **Ensure D1 database and KV namespace exist** in your Cloudflare dashboard
4. **Make sure your Cloudflare API token has the required permissions**:
   - Workers Scripts:Edit
   - Workers KV Storage:Edit
   - D1:Edit

## Manual Deployment (Alternative)

If GitHub Actions continue to fail, you can deploy manually:

1. Set environment variables locally:
   ```bash
   export D1_ID="your-d1-database-id"
   export D1_NAME="airdrop"
   export KV_ID="your-kv-namespace-id"
   ```

2. Run the prepare script:
   ```bash
   bash prepare.sh
   ```

3. Deploy:
   ```bash
   npx wrangler deploy --env production
   ```
