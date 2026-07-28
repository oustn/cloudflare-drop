#!/usr/bin/env bash

set -euo pipefail

DEFAULT_D1_NAME="cloudflare-drop"
DEFAULT_KV_NAMESPACE_NAME="cloudflare-drop-file-drops"
DEFAULT_R2_BUCKET="cloudflare-drop-files"

D1_DATABASE_NAME="${D1_NAME:-$DEFAULT_D1_NAME}"
D1_DATABASE_ID="${D1_ID:-}"
KV_NAMESPACE_NAME="${KV_NAMESPACE_NAME:-$DEFAULT_KV_NAMESPACE_NAME}"
KV_NAMESPACE_ID="${KV_ID:-}"
R2_BUCKET_NAME="${R2_BUCKET:-$DEFAULT_R2_BUCKET}"
STORAGE_DRIVER_VALUE="${STORAGE_DRIVER:-auto}"

find_d1_id() {
  local database_name="$1"
  node -e '
const fs = require("node:fs");
const databaseName = process.argv[1];
const input = fs.readFileSync(0, "utf8");
const start = input.indexOf("[");
const end = input.lastIndexOf("]");
if (start < 0 || end < start) process.exit(0);
let databases;
try {
  databases = JSON.parse(input.slice(start, end + 1));
} catch (_error) {
  process.exit(0);
}
const database = databases.find((item) =>
  item.name === databaseName || item.database_name === databaseName
);
const id = database?.uuid || database?.id || database?.database_id;
if (id) console.log(id);
' "$database_name"
}

find_kv_id() {
  local namespace_name="$1"
  node -e '
const fs = require("node:fs");
const namespaceName = process.argv[1];
const input = fs.readFileSync(0, "utf8");
const start = input.indexOf("[");
const end = input.lastIndexOf("]");
if (start < 0 || end < start) process.exit(0);
let namespaces;
try {
  namespaces = JSON.parse(input.slice(start, end + 1));
} catch (_error) {
  process.exit(0);
}
const namespace = namespaces.find((item) =>
  item.title === namespaceName || item.name === namespaceName
);
const id = namespace?.id || namespace?.namespace_id;
if (id) console.log(id);
' "$namespace_name"
}

extract_resource_id() {
  node -e '
const fs = require("node:fs");
const input = fs.readFileSync(0, "utf8");
const match =
  input.match(/database_id\s*=\s*"([^"]+)"/i) ||
  input.match(/\bid\s*=\s*"([^"]+)"/i) ||
  input.match(/"database_id"\s*:\s*"([^"]+)"/i) ||
  input.match(/"uuid"\s*:\s*"([^"]+)"/i) ||
  input.match(/"id"\s*:\s*"([^"]+)"/i);
if (match) console.log(match[1]);
'
}

ensure_d1_database() {
  if [ -n "$D1_DATABASE_ID" ]; then
    echo "Using configured D1 database: $D1_DATABASE_NAME"
    return
  fi

  local list_output
  if list_output=$(npx wrangler d1 list --json); then
    D1_DATABASE_ID="$(find_d1_id "$D1_DATABASE_NAME" <<< "$list_output")"
  fi

  if [ -z "$D1_DATABASE_ID" ]; then
    echo "Creating D1 database: $D1_DATABASE_NAME"
    local create_output
    create_output=$(npx wrangler d1 create "$D1_DATABASE_NAME")
    D1_DATABASE_ID="$(extract_resource_id <<< "$create_output")"
  fi

  if [ -z "$D1_DATABASE_ID" ]; then
    echo "Failed to resolve D1 database id for $D1_DATABASE_NAME" >&2
    exit 1
  fi
}

ensure_kv_namespace() {
  if [ -n "$KV_NAMESPACE_ID" ]; then
    echo "Using configured KV namespace: $KV_NAMESPACE_NAME"
    return
  fi

  local list_output
  if list_output=$(npx wrangler kv namespace list); then
    KV_NAMESPACE_ID="$(find_kv_id "$KV_NAMESPACE_NAME" <<< "$list_output")"
  fi

  if [ -z "$KV_NAMESPACE_ID" ]; then
    echo "Creating KV namespace: $KV_NAMESPACE_NAME"
    local create_output
    create_output=$(npx wrangler kv namespace create "$KV_NAMESPACE_NAME")
    KV_NAMESPACE_ID="$(extract_resource_id <<< "$create_output")"
  fi

  if [ -z "$KV_NAMESPACE_ID" ]; then
    echo "Failed to resolve KV namespace id for $KV_NAMESPACE_NAME" >&2
    exit 1
  fi
}

r2_bucket_exists() {
  local list_output="$1"
  grep -Fq "$R2_BUCKET_NAME" <<< "$list_output"
}

ensure_r2_bucket() {
  if [ "$STORAGE_DRIVER_VALUE" = "kv" ]; then
    echo "Skipping R2 because STORAGE_DRIVER=kv"
    return 1
  fi

  local list_args=(r2 bucket list)
  local create_args=(r2 bucket create "$R2_BUCKET_NAME")
  if [ -n "${R2_BUCKET_JURISDICTION:-}" ]; then
    list_args+=("--jurisdiction" "$R2_BUCKET_JURISDICTION")
    create_args+=("--jurisdiction" "$R2_BUCKET_JURISDICTION")
  fi

  local list_output
  if list_output=$(npx wrangler "${list_args[@]}"); then
    if r2_bucket_exists "$list_output"; then
      echo "Using existing R2 bucket: $R2_BUCKET_NAME"
      return 0
    fi
  fi

  echo "Creating R2 bucket: $R2_BUCKET_NAME"
  if npx wrangler "${create_args[@]}"; then
    return 0
  fi

  if list_output=$(npx wrangler "${list_args[@]}"); then
    if r2_bucket_exists "$list_output"; then
      echo "Using existing R2 bucket after create failed: $R2_BUCKET_NAME"
      return 0
    fi
  fi

  return 1
}

ensure_d1_database
ensure_kv_namespace

# Create wrangler.toml file
cat ./wrangler.example.toml > ./wrangler.toml

if [ -n "${CUSTOM_DOMAIN:-}" ]; then
  echo "route = { pattern = \"${CUSTOM_DOMAIN}\", custom_domain = true }" >> ./wrangler.toml
else
  echo  "workers_dev = true" >> ./wrangler.toml
fi

echo -e "d1_databases = [{ binding = \"DB\", database_name = \"$D1_DATABASE_NAME\", database_id = \"$D1_DATABASE_ID\", migrations_dir = \"data/migrations\" }]" >> ./wrangler.toml

echo -e "kv_namespaces = [{ binding = \"file_drops\", id = \"$KV_NAMESPACE_ID\" }]" >> ./wrangler.toml

if ensure_r2_bucket; then
  r2_binding="r2_buckets = [{ binding = \"FILES\", bucket_name = \"$R2_BUCKET_NAME\""
  if [ -n "${R2_BUCKET_JURISDICTION:-}" ]; then
    r2_binding+=", jurisdiction = \"$R2_BUCKET_JURISDICTION\""
  fi
  r2_binding+=" }]"
  echo -e "$r2_binding" >> ./wrangler.toml
elif [ "$STORAGE_DRIVER_VALUE" = "r2" ]; then
  echo "R2 bucket is required because STORAGE_DRIVER=r2, but it could not be created or found." >&2
  exit 1
else
  echo "R2 bucket is unavailable; continuing with KV storage."
fi

rate_limit_bindings=""
if [ -n "${RATE_LIMIT:-}" ]; then
  rate_limit_bindings+="{ name = \"UPLOAD_LIMIT\", type = \"ratelimit\", namespace_id = \"1001\", simple = { limit = $RATE_LIMIT, period = 10 } },"
fi
lookup_rate_limit="${LOOKUP_RATE_LIMIT:-30}"
rate_limit_bindings+="{ name = \"LOOKUP_LIMIT\", type = \"ratelimit\", namespace_id = \"1002\", simple = { limit = $lookup_rate_limit, period = 60 } },"
if [ -n "$rate_limit_bindings" ]; then
  rate_limit_bindings="${rate_limit_bindings%,}"
  echo -e "unsafe = { bindings = [$rate_limit_bindings] }" >> ./wrangler.toml
fi

vars=""

[ -n "${SHARE_DURATION:-}" ] && vars+="SHARE_DURATION = \"$SHARE_DURATION\", "
[ -n "${SHARE_MAX_SIZE_IN_MB:-}" ] && vars+="SHARE_MAX_SIZE_IN_MB = \"$SHARE_MAX_SIZE_IN_MB\", "
[ -n "${ADMIN_TOKEN:-}" ] && vars+="ADMIN_TOKEN = \"$ADMIN_TOKEN\", "
vars+="STORAGE_DRIVER = \"$STORAGE_DRIVER_VALUE\", "

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

set +o pipefail
yes | npx wrangler d1 migrations apply "$D1_DATABASE_NAME" --remote --env production
set -o pipefail
