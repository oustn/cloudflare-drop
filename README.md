# Cloudflare Drop

[繁體中文](#繁體中文) · [English](#english)

## 繁體中文

以 Cloudflare Workers、D1 Database 與 KV 打造的輕量級檔案分享工具。

<img src="assets/IMG_5898.png" width="200">
<img src="assets/IMG_5899.png" width="200">
<img src="assets/IMG_5900.png" width="200">
<img src="assets/IMG_5901.png" width="200">

### 自動部署

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/oustn/cloudflare-drop)

1. 點選按鈕前往自動部署頁面。
2. 依頁面指示連結 GitHub 與 Cloudflare，並設定 Cloudflare Account ID 和 API Key。
3. Fork 儲存庫。
4. 啟用 GitHub Actions。
5. 部署。

> 如果以 Worker 範本建立 Cloudflare API Token，請記得加入 D1 的編輯權限。

### 更新

同步 Fork 儲存庫即可自動更新與建置。

<img src="assets/IMG_01.png" width="200">

### 設定 GitHub Actions Secret

1. 首次部署後，建立 [D1 Database](https://developers.cloudflare.com/d1/get-started/#2-create-a-database) 與 [KV Namespace](https://developers.cloudflare.com/kv/get-started/#2-create-a-kv-namespace)。
2. 前往 fork 儲存庫的 **Settings** → **Secrets and variables** → **Actions** → **New repository secret**。
3. 加入下列 Secret：
   - `CUSTOM_DOMAIN`（選填，例如 `drop.example.com`）
   - `D1_ID`（D1 Database ID）
   - `D1_NAME`（D1 Database 名稱）
   - `KV_ID`（KV Namespace ID）
4. 重新執行 GitHub Actions。

### 其他設定

#### 檔案大小限制

預設限制為 10 MB。若要調整，請新增 `SHARE_MAX_SIZE_IN_MB` Actions 變數，並將值設為允許的最大 MB 數，例如 `20`。設定路徑為 **Settings** → **Secrets and variables** → **Actions** → **New repository variable**。

#### 分享到期時間

分享預設一小時後到期。若要調整，請新增 `SHARE_DURATION` Actions 變數，格式為 `數值+單位`（例如 `5minute`）。支援的單位為 `minute`、`hour`、`day`、`week`、`month` 與 `year`。

#### IP 上傳頻率限制

預設不限制。若要調整，請新增 `RATE_LIMIT` Actions 變數，值為每 10 秒允許的請求數，例如 `10`。

### 到期清理

Worker 每 10 分鐘執行一次排程，自動清除已到期的 KV 物件與 D1 記錄。

### 管理後台

設定 `ADMIN_TOKEN` Secret 後，可透過 `https://your.drop.com/admin/{ADMIN_TOKEN}` 開啟管理後台並刪除分享。

<img src="assets/IMG_6000.png" width="400">

## English

A lightweight file-sharing tool built with Cloudflare Workers, D1 Database, and KV.

### Automatic deployment

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/oustn/cloudflare-drop)

1. Click the button to open the automatic deployment page.
2. Follow the instructions to connect GitHub and Cloudflare, then configure your Cloudflare Account ID and API Key.
3. Fork the repository.
4. Enable GitHub Actions.
5. Deploy.

> If you create a Cloudflare API Token from the Worker template, remember to grant D1 edit access.

### Updates

Sync the fork to update and build automatically.

### Configure GitHub Actions secrets

1. After the first deployment, create a [D1 Database](https://developers.cloudflare.com/d1/get-started/#2-create-a-database) and a [KV Namespace](https://developers.cloudflare.com/kv/get-started/#2-create-a-kv-namespace).
2. Open **Settings** → **Secrets and variables** → **Actions** → **New repository secret** in the forked repository.
3. Add these secrets:
   - `CUSTOM_DOMAIN` (optional, for example `drop.example.com`)
   - `D1_ID` (D1 Database ID)
   - `D1_NAME` (D1 Database name)
   - `KV_ID` (KV Namespace ID)
4. Run GitHub Actions again.

### Additional configuration

#### File size limit

The default limit is 10 MB. To change it, add a `SHARE_MAX_SIZE_IN_MB` Actions variable containing the maximum allowed size in MB, such as `20`.

#### Share expiration

Shares expire after one hour by default. To change this, add a `SHARE_DURATION` Actions variable in `value+unit` format, such as `5minute`. Supported units are `minute`, `hour`, `day`, `week`, `month`, and `year`.

#### IP upload rate limit

Uploads are unlimited by default. To add a limit, set the `RATE_LIMIT` Actions variable to the number of requests allowed every 10 seconds, such as `10`.

### Expired-share cleanup

The Worker runs a scheduled task every 10 minutes to remove expired KV objects and D1 records.

### Admin console

After setting the `ADMIN_TOKEN` secret, open `https://your.drop.com/admin/{ADMIN_TOKEN}` to access the admin console and delete shares.
