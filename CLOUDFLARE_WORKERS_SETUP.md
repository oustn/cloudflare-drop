# Cloudflare Workers Deployment Guide

## Current Setup
Your project uses GitHub Actions with Cloudflare Workers and dynamically configures database bindings through GitHub secrets. The `prepare.sh` script generates the final `wrangler.toml` configuration during deployment.

## Required GitHub Secrets

### Essential Secrets (Required for deployment to work)
Add these in your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **Repository secrets**:

1. **CLOUDFLARE_API_TOKEN** - Your Cloudflare API token with permissions:
   - Workers Scripts:Edit
   - Workers KV Storage:Edit  
   - D1:Edit

2. **CLOUDFLARE_ACCOUNT_ID** - Your Cloudflare account ID

3. **D1_ID** - Your D1 database ID (create with: `npx wrangler d1 create airdrop`)

4. **D1_NAME** - Database name: `airdrop`

5. **KV_ID** - Your KV namespace ID (create with: `npx wrangler kv:namespace create "file_drops"`)

### Optional Secrets
- **CUSTOM_DOMAIN** - Your custom domain (if you have one)
- **ADMIN_TOKEN** - Admin authentication token

### Optional Variables  
Add these in **Settings** → **Secrets and variables** → **Actions** → **Variables**:
- **SHARE_MAX_SIZE_IN_MB** - Maximum file size (default: 10)
- **SHARE_DURATION** - Share duration in hours (default: 1)
- **RATE_LIMIT** - Enable rate limiting (true/false)

## How to Create Cloudflare Resources

### 1. Create D1 Database
```bash
npx wrangler d1 create airdrop
```
Save the Database ID for `D1_ID` secret.

### 2. Create KV Namespace
```bash
npx wrangler kv:namespace create "file_drops"
```
Save the Namespace ID for `KV_ID` secret.

## Deployment Flow

1. **GitHub Actions triggers** (on push to main)
2. **prepare.sh script runs** and:
   - Takes `wrangler.example.toml` as template
   - Adds D1 database configuration using `D1_ID` and `D1_NAME`
   - Adds KV namespace configuration using `KV_ID`
   - Adds custom domain or workers.dev route
   - Builds the web frontend
   - Applies database migrations
3. **Wrangler deploys** to Cloudflare Workers

## Troubleshooting

### "Couldn't find a D1 DB" Error
- Ensure `D1_ID` and `D1_NAME` secrets are set correctly
- Verify the database exists in your Cloudflare dashboard
- Check that your API token has D1 edit permissions

### "No environment found" Warning
- This is expected - the production environment is configured dynamically
- The warning doesn't affect deployment

### Build Errors
- Check that all required secrets are set
- Verify your API token permissions
- Ensure database and KV namespace exist in Cloudflare

## Manual Deployment (if needed)

If GitHub Actions fails, you can deploy manually:

```bash
# Set environment variables
export D1_ID="your-d1-database-id"
export D1_NAME="airdrop" 
export KV_ID="your-kv-namespace-id"

# Run prepare script
./prepare.sh

# Deploy
npx wrangler deploy --env production
```

## Verification

After successful deployment:
1. Check Cloudflare Workers dashboard for your worker
2. Verify D1 database contains tables (after migration)
3. Test file upload/sharing functionality
4. Check KV namespace for stored data
