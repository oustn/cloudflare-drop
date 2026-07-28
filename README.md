# Cloudflare Drop

基于 Cloudflare Worker、D1Database、KV 和可选 R2 实现的轻量级文件分享工具。

<img src="assets/IMG_5898.png" width="200">
<img src="assets/IMG_5899.png" width="200">
<img src="assets/IMG_5900.png" width="200">
<img src="assets/IMG_5901.png" width="200">

## 自动部署

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/oustn/cloudflare-drop)

1. 点击按钮，跳转到自动部署页面
2. 根据页面指引，关联 GitHub & Cloudflare，配置 Cloudflare Account ID & API Key
3. Fork 仓库
4. 开启 Action
5. 部署

> 创建 Cloudflare API Token 时，如果使用 Worker 模板创建，请记得添加 D1、KV 的编辑权限；如果启用 R2，还需要添加 R2 的编辑权限。

## 更新

同步 Fork 的仓库即可自动更新 & 构建。

<img src="assets/IMG_01.png" width="200">

## 本地开发

执行 `pnpm start` 后，Vite 页面运行在 `http://127.0.0.1:3333`，Worker API 运行在 `http://127.0.0.1:8787`。请通过 Vite 地址打开页面；`/api` 和 `/files` 请求会自动代理到 Worker。直接访问 Worker 的页面路径会重定向到 Vite，避免开发代理携带浏览器 Host 时触发 Vite 500。

## 配置 GitHub Actions

默认会自动确保 D1、KV，并尝试启用 R2：部署脚本会按默认名称查找资源，存在就复用，不存在就创建，然后生成正确的 Worker binding。KV 始终用于分享元数据、短期下载令牌和 KV 回退存储；R2 可用时会绑定到 `FILES`，不可用时默认回退 KV。

必要 Secret：

- CLOUDFLARE_API_TOKEN
- CLOUDFLARE_ACCOUNT_ID

常用 Variable：

- CUSTOM_DOMAIN（可选，域名，如 drop.example.cn）
- ADMIN_TOKEN（可选，后台管理 token）

高级 Variable：

- D1_NAME，默认 `cloudflare-drop`
- KV_NAMESPACE_NAME，默认 `cloudflare-drop-file-drops`
- R2_BUCKET，默认 `cloudflare-drop-files`
- R2_BUCKET_JURISDICTION（可选，R2 jurisdiction）

高级 Secret：

- D1_ID（可选，指定已有 D1 Database ID）
- KV_ID（可选，指定已有 KV Namespace ID）

配置路径：forked 的仓库 -> **Settings** -> **Secrets and variables** -> **Actions**。配置完成后重新运行 Github Actions。

## 其他配置

### 文件大小限制

默认文件限制为 10M，可以通过添加 Action 变量来修改。

新增 `SHARE_MAX_SIZE_IN_MB` Action 变量，值为最大允许的 MB 数字，例如 20，配置路径：在 forked 的仓库 -> **Settings** -> **Secrets and variables** -> **Actions** -> **New repository variable**

### 存储后端

新增 `STORAGE_DRIVER` Action 变量，可选值为 `auto`、`kv`、`r2`。默认 `auto`：存在 R2 Binding 时使用 R2，否则使用 KV。显式设置为 `r2` 但未配置 Bucket 时上传会失败；显式 `kv` 会强制使用 KV 存储。KV 加密分享最大 50MB，未加密分享仍遵循 `SHARE_MAX_SIZE_IN_MB`。分享记录会保存创建时实际使用的存储后端，下载和清理时按记录读取对应对象。

启用 R2 时可以额外配置 `R2_BUCKET_JURISDICTION` Action 变量，用于创建和绑定指定 jurisdiction 的 Bucket；不配置时使用 Cloudflare 默认值。

### 上传存储策略

- 文本分享始终存 KV，包括加密文本，避免把短文本对象写入 R2。
- 小文件直接提交到 `/files`；超过 5MiB 的未加密文件会使用统一上传会话，前端不需要区分 KV 或 R2。
- KV 模式会按 5MiB 写入最终分片对象，并在完成时写入 manifest；Worker 不再把分片读回内存合并。
- R2 模式会通过 Worker Binding 创建 multipart upload，浏览器逐片上传到 Worker，由 Worker 直接转发到 R2 multipart part；浏览器不会拿到 R2 Access Key、Secret 或预签名信息。

### 分享过期时间配置

分享默认有效期是一个小时，可以通过添加 Action 变量来修改。

新增 `SHARE_DURATION` Action 变量，配置格式为 `数值+单位`，比如 (5minute)，支持的单位有 `minute`, `hour`, `day`, `week`, `month`, `year`

### 新增 IP 上传频率限制

默认无限制，可以通过添加 Action 变量来修改。

新增 `RATE_LIMIT` Action 变量，值为每 10s 可请求数，比如 10

### 分享码查询限流

分享码查询默认限制为每个 IP 每分钟 30 次。可以通过 `LOOKUP_RATE_LIMIT` Action 变量调整。生产环境还应在 Cloudflare Dashboard 的 **Security > WAF > Rate limiting rules** 中创建一条规则：匹配 `http.request.uri.path starts_with "/files/share/"`，按 IP 每分钟 30 次，超额后 Managed Challenge 或 Block 10 分钟。Worker 内限流用于应用层兜底，WAF 用于在请求到达 Worker 前拦截枚举流量。

## 安全建议

- 生产环境必须使用 HTTPS。Worker 会发送 CSP、HSTS、`Referrer-Policy: no-referrer`、禁止嗅探和禁止嵌入等安全响应头；分享查询、下载 token 和后台 API 响应设置为 `Cache-Control: no-store`。
- 加密分享密码由创建者自行决定；界面会实时提示密码强度，建议使用至少 12 个字符并混合多种字符。新创建的加密分享使用分片认证加密；R2 存储为单个加密对象，KV 存储会拆成 manifest 和 chunks。KV 加密分享最大 50MB，未加密文件仍遵循 `SHARE_MAX_SIZE_IN_MB`。
- 新创建的加密分享使用 V2 格式：Argon2 参数、独立 IV、原始文件名和 MIME 类型都被纳入认证的加密封装。服务端仅保存 `encrypted-file` 与 `application/octet-stream`；下载后由浏览器恢复真实名称和类型。历史 V1 加密分享仍可读取。
- Web 加密防护的是存储泄露和数据库泄露。网站部署方仍可通过篡改下发的 JavaScript 窃取密码，因此应保护 Cloudflare、GitHub Actions 和依赖供应链权限。

## 过期清理

Worker 添加了一个 10 分钟的定时任务，按批自动清理过期的 KV 或 R2 对象和 D1 中的记录。

## 后台管理

通过配置 ADMIN_TOKEN Secret，可以访问管理后台：`https://your.drop.com/admin/{ADMIN_TOKEN}`， 在管理后台可以删除分享。

<img src="assets/IMG_6000.png" width="400">
