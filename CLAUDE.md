# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cloudflare Drop 是一款以 Cloudflare Workers 的輕量檔案分享工具，使用 D1 Database（SQLite）與 KV 儲存打造檔案上傳、分享與管理功能。

**技術架構**：

- **後端**: Cloudflare Workers + Hono (Web framework) + Chanfana (OpenAPI)
- **資料庫**: Drizzle ORM + D1 Database (SQLite)
- **儲存**: Cloudflare KV (檔案二進位儲存)
- **前端**: Preact + Vite + MobX + Material-UI
- **套件管理器**: pnpm (必須使用，請勿使用 npm 或 yarn)

## Development Commands

### 本地開發

```bash
# 首次啟動前的準備工作（產生 wrangler.toml、套用遷移）
pnpm prestart

# 同時啟動前後端開發伺服器（建議）
pnpm start

# 僅啟動前端（Vite dev server，連接埠由 SHARE_PORT 環境變數決定）
pnpm dev:web

# 僅啟動 Worker（Wrangler dev server，監聽 0.0.0.0）
pnpm dev:app
```

### 建置和部署

```bash
# 建置前端靜態資源
pnpm build:web

# 產生資料庫遷移檔案（修改 schema 後執行）
pnpm generate

# 部署到正式環境（包含前置任務：建置前端 + 產生遷移 + 套用遷移）
pnpm deploy
```

### 資料庫遷移

```bash
# 套用本地 D1 遷移
wrangler d1 migrations apply airdrop --local

# 套用正式環境遷移
wrangler d1 migrations apply airdrop --remote --env production
```

### 程式碼品質

```bash
# 自動格式化並修正 lint 錯誤
pnpm lint
```

## Architecture

### 後端架構（Cloudflare Worker）

**入口**: `src/index.ts`
使用 Hono 框架建置 API，透過 Chanfana 提供 OpenAPI 支援。

**核心元件**:

- **Endpoint 基底類別** (`src/endpoint.ts`): 所有 API 端點的基底類別

  - `getDB(c)`: 取得 Drizzle D1 Database 執行個體
  - `getKV(c)`: 取得 KV Namespace 執行個體
  - `success(data)`: 統一成功回應格式
  - `error(message)`: 統一錯誤回應格式

- **中介軟體系統** (`src/middlewares/`):

  - `db.middleware.ts`: 注入 Drizzle DB 執行個體到 context
  - `auth.middleware.ts`: 管理後台驗證（驗證 ADMIN_TOKEN）
  - `limit.middleware.ts`: 上傳頻率限制（使用 Cloudflare Rate Limit API）
  - `terminal.middleware.ts`: 終端處理中介軟體

- **檔案處理** (`src/files/`):

  - `fileCreate.ts`: 建立檔案分享紀錄
  - `fileChunkCreate.ts`: 上傳檔案分片（支援大檔案分片上傳）
  - `mergeFileChunk.ts`: 合併檔案分片
  - `fileFetch.ts`: 下載檔案
  - `fileShareCodeFetch.ts`: 根據分享碼取得檔案資訊

- **管理後台** (`src/admin/`):

  - `listShares.ts`: 列出所有分享
  - `deleteShare.ts`: 刪除分享
  - `getInfo.ts`: 取得統計資訊

- **排程任務** (`src/scheduled.ts`):
  每 10 分鐘執行一次，清理過期的 KV 儲存與 D1 紀錄（見 `wrangler.example.toml` 的 `triggers.crons`）

### 前端架構（Preact）

**入口**: `web/index.tsx`
使用 Preact + MobX 狀態管理 + Material-UI 元件庫。

**目錄架構**:

- `web/views/`: 頁面元件
  - `Home/`: 首頁（檔案上傳與分享）
  - `Admin/`: 管理後台
- `web/components/`: 可重複使用元件
- `web/api/`: API 用戶端（Axios）
- `web/theme/`: Material-UI 自訂主題
- `web/helpers/`: 工具函式

### 資料庫架構（D1 + Drizzle）

**Schema 定義**: `data/schemas/files.schema.ts`
**遷移目錄**: `data/migrations/`
**設定檔**: `data/drizzle.config.ts`

主要表架構：

- `files`: 檔案分享紀錄
  - `id`: 主鍵（CUID2）
  - `objectId`: KV 中的檔案 ID
  - `filename`: 檔案名稱
  - `hash`: 檔案 hash 值
  - `code`: 分享碼（唯一）
  - `size`: 檔案大小
  - `is_ephemeral`: 是否閱後即焚
  - `expires_at`: 過期時間
  - `created_at`: 建立時間

## Environment Configuration

### 本地開發

建立 `.dev.vars` 檔案（參考 `.dev.vars.example`）：

```bash
ADMIN_TOKEN=your-admin-token
SHARE_DURATION=1hour
SHARE_MAX_SIZE_IN_MB=10
```

### Cloudflare 設定

需要在 Cloudflare Dashboard 建立：

1. **D1 Database** (名稱: `airdrop`)
2. **KV Namespace** (binding: `file_drops`)

接著設定 `wrangler.toml`（可透過 `prepare.sh` 自動產生）：

- `D1_ID` 和 `D1_NAME`: D1 Database 設定
- `KV_ID`: KV Namespace ID
- `CUSTOM_DOMAIN`: 自訂網域名稱（選填）
- `RATE_LIMIT`: 上傳頻率限制（每 10 秒的請求數）

## Key Patterns

### API 回應格式

所有 API 端點使用統一的回應格式（源自 `Endpoint` 基底類別）：

```typescript
// 成功
{ message: 'ok', result: true, data: <payload> }

// 錯誤
{ message: <error message>, result: false, data: null }
```

### 檔案上傳流程

1. 前端將大檔案分片（透過 `fileChunkCreate` 端點）
2. 所有分塊上傳完成後呼叫 `mergeFileChunk` 合併
3. 合併後回傳分享碼與下載連結

### 分享碼產生

使用 CUID2 產生唯一的分享碼（見 `@paralleldrive/cuid2`）

### 驗證機制

管理後台透過 URL 路徑中的 token 驗證：
`/admin/{ADMIN_TOKEN}` - 存取管理後台
後端透過 `auth.middleware.ts` 驗證

## Important Notes

- **採用 pnpm**: 專案設定了 `packageManager: "pnpm@9.15.3"`，必須採用 pnpm
- **TypeScript 設定**: 專案有多個 tsconfig 檔案：
  - `tsconfig.web.json`: 前端設定
  - `tsconfig.worker.json`: Worker 設定
  - `tsconfig.node.json`: Node.js 工具設定
- **Drizzle Schema 修改**: 修改 `data/schemas/*.schema.ts` 後必須執行 `pnpm generate` 產生遷移
- **Worker 限制**:
  - Cloudflare Workers 有 CPU 時間限制（免費版 10ms，付費版 50ms）
  - 檔案透過 KV 儲存，單一值最大 25MB
- **排程任務**: Cron 觸發器僅在正式環境執行，本地開發不會執行
- **Husky Git Hooks**: 提交前會自動執行 `prettier` 和 `eslint`（見 `lint-staged` 設定）
