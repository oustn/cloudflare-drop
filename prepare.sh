#!/usr/bin/env bash

set +e

# Create wrangler.toml file
cat ./wrangler.example.toml > ./wrangler.toml

if [ -n "$CUSTOM_DOMAIN" ]; then
  echo "route = { pattern = \"${CUSTOM_DOMAIN}\", custom_domain = true }" >> ./wrangler.toml
else
  echo  "workers_dev = true" >> ./wrangler.toml
fi

if [ -n "$D1_ID" ] && [ -n "$D1_NAME" ]; then
  echo -e "d1_databases = [{ binding = \"DB\", database_name = \"$D1_NAME\", database_id = \"$D1_ID\", migrations_dir = \"data/migrations\" }]" >> ./wrangler.toml
fi

if [ -n "$KV_ID" ]; then
  echo -e  "kv_namespaces = [{ binding = \"file_drops\", id = \"$KV_ID\" }]" >> ./wrangler.toml
fi

if [ -n "$R2_BUCKET" ]; then
  echo -e "r2_buckets = [{ binding = \"FILES\", bucket_name = \"$R2_BUCKET\" }]" >> ./wrangler.toml
fi

rate_limit_bindings=""
if [ -n "$RATE_LIMIT" ]; then
  rate_limit_bindings+="{ name = \"UPLOAD_LIMIT\", type = \"ratelimit\", namespace_id = \"1001\", simple = { limit = $RATE_LIMIT, period = 10 } },"
fi
lookup_rate_limit="${LOOKUP_RATE_LIMIT:-30}"
rate_limit_bindings+="{ name = \"LOOKUP_LIMIT\", type = \"ratelimit\", namespace_id = \"1002\", simple = { limit = $lookup_rate_limit, period = 60 } },"
if [ -n "$rate_limit_bindings" ]; then
  rate_limit_bindings="${rate_limit_bindings%,}"
  echo -e "unsafe = { bindings = [$rate_limit_bindings] }" >> ./wrangler.toml
fi

vars=""

[ -n "$SHARE_DURATION" ] && vars+="SHARE_DURATION = \"$SHARE_DURATION\", "
[ -n "$SHARE_MAX_SIZE_IN_MB" ] && vars+="SHARE_MAX_SIZE_IN_MB = \"$SHARE_MAX_SIZE_IN_MB\", "
[ -n "$ADMIN_TOKEN" ] && vars+="ADMIN_TOKEN = \"$ADMIN_TOKEN\", "
[ -n "$STORAGE_DRIVER" ] && vars+="STORAGE_DRIVER = \"$STORAGE_DRIVER\", "

# 移除最后多余的逗号和空格
vars="${vars%, }"

if [ -n "$vars" ]; then
  echo "vars = { $vars }" >> ./wrangler.toml
fi

# Generate migration
npm run generate

# Run tests
npm run test

# Build web
npm run build:web

if [ -n "$D1_ID" ] && [ -n "$D1_NAME" ]; then
  yes | npx wrangler d1 migrations apply "$D1_NAME" --remote --env production
fi
