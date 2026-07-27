# Dual Storage and Secure Sharing Design

## Goal

Keep the six-digit numeric share code as the human-friendly lookup code while
making storage, downloads, ephemeral shares, and quota enforcement safe and
consistent. New deployments must work with KV alone and must automatically use
R2 when it is configured. Existing KV-backed shares must remain downloadable.

## Configuration

`STORAGE_DRIVER` accepts `auto`, `kv`, or `r2` and defaults to `auto`.

- `auto` selects R2 when the `files` R2 binding exists; otherwise it selects KV.
- `r2` rejects uploads with a clear configuration error when the R2 binding is
  absent.
- `kv` always uses KV and enforces its 100 MB application limit.
- R2 has an application upload limit configured by `SHARE_MAX_SIZE_IN_MB`.
  The default remains 10 MB.

The deployment preparation script adds the R2 binding only when `R2_BUCKET` is
provided. A deployment without R2 therefore needs no billing-enabled resource.

## Data Model

The `files` table gains `storage_provider` (`kv` or `r2`) and stores a stable
object key in `object_id`. Existing rows get `kv` as their provider. It also
gains `claimed_at` for atomic ephemeral-share claiming.

The schema adds indexes for `due_date` and `created_at`. Expiry cleanup uses
bounded batches rather than deleting every expired row in one invocation.

Short-lived download grants are stored in KV under a separate, namespaced key.
Each grant contains its file ID, expiry, and a random opaque token. A grant is
valid only for its associated file and is deleted only after the storage object
has been resolved successfully.

## Storage Adapters

A storage module owns provider selection and exposes one operation set:

- create a temporary upload
- accept and validate chunks
- finalize an object
- stream an object for download
- delete an object

KV retains the existing chunk representation for compatibility. The adapter
reads chunk metadata and streams each chunk in order for both browser and
terminal downloads.

R2 uses a multipart upload for chunked files and a direct object write for
small files. It records only final object keys in D1; temporary multipart state
is scoped to the upload ID and expires if not finalized.

Every chunk upload is checked against the server-issued upload manifest:
chunk ID must be expected, its observed size must match the manifest, and the
chunk must not exceed the configured chunk limit. Finalization verifies the
total observed size and SHA-256 before a share row is created. The server never
trusts `fileInfo.size`, a client object ID, or a client-provided expiry as the
source of truth.

## Authorization and Sharing Flow

The six-digit numeric code remains the only value people need to exchange. It
is intentionally not a download bearer token.

1. A code lookup is rate-limited by requester IP and code, then finds a
   non-expired file.
2. For a normal share it creates an opaque, five-minute, file-bound download
   grant.
3. For an ephemeral share it atomically changes `claimed_at` and `due_date`
   only when the row has not been claimed and is still valid. Exactly one
   request receives a grant.
4. A download validates the grant-file association, resolves the storage
   object, then consumes the grant and begins the response stream.

The `curl` and `wget` path performs the same code lookup and claim operation
as the browser path, then streams through the selected storage adapter. It does
not bypass ephemeral semantics and supports KV chunked files.

Upload, chunk, lookup, and download routes have separate rate-limit keys and
budgets. This prevents upload quota abuse without making downloads unusable.

## Duration and Cleanup Rules

The server accepts only positive, bounded durations. `999year` is the sole
permanent-share sentinel. All other durations have a server-defined maximum;
the front-end control is advisory and cannot extend retention.

The scheduled worker selects and deletes a bounded batch of expired rows,
deletes each corresponding KV or R2 object, and repeats on later cron runs.
Storage deletion is idempotent. A failed storage deletion is logged for retry
rather than preventing other expired records from being processed.

## Tests and Delivery

The project adds a test runner and Worker-focused integration tests covering:

- provider selection and legacy KV records
- chunk size, total size, hash, and expiry validation
- file-bound, one-time download grants
- concurrent ephemeral lookup granting access exactly once
- terminal downloads of normal and KV-chunked files
- provider-specific cleanup and bounded cleanup batches

CI runs type checking and the test suite before deployment. The web bundle is
split so the admin route and password-encryption dependency are loaded only
when needed.

## Non-Goals

This change does not migrate existing KV objects to R2 automatically, change
the public six-digit code format, or introduce user accounts.
