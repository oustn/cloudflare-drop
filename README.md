# 🚀 Cloudflare Drop

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/oustn/cloudflare-drop)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9%2B-blue)](https://www.typescriptlang.org/)

**Secure, Fast, Simple File Sharing Platform** built on Cloudflare's edge infrastructure.

A lightweight, modern file sharing solution powered by **Cloudflare Workers**, **D1 Database**, and **KV Storage**. Share files and text securely with end-to-end encryption, automatic expiration, and a beautiful responsive interface.

## ✨ Features

### 🔐 **Security First**
- **End-to-end AES-GCM encryption** with user-defined passwords
- **Client-side encryption** - server never sees your passwords
- **Automatic expiration** with configurable timeouts
- **"Burn after reading"** for ephemeral content
- **SHA256 hash verification** for file integrity

### 📱 **Modern Experience**
- **Progressive Web App (PWA)** - install on any device
- **Responsive design** optimized for mobile and desktop
- **Dark/Light mode** with system preference detection
- **Square UI design** with iOS-optimized input fields
- **Multilingual support** (English, Chinese Simplified, Chinese Traditional)

### ⚡ **Performance & Scale**
- **Global edge deployment** via Cloudflare Workers
- **Instant file uploads** with chunked transfer
- **Real-time progress tracking**
- **Automatic cleanup** of expired content
- **Rate limiting** protection

### 📤 **Flexible Sharing**
- **File sharing** (up to configurable size limit)
- **Text sharing** with syntax highlighting
- **QR code generation** for easy mobile access
- **6-character share codes** for simple sharing
- **Download history** tracking

## 🖼️ Screenshots

<div align="center">
  <img src="assets/IMG_5898.png" width="200" alt="Home Screen">
  <img src="assets/IMG_5899.png" width="200" alt="Upload Interface">
  <img src="assets/IMG_5900.png" width="200" alt="Share Dialog">
  <img src="assets/IMG_5901.png" width="200" alt="Download View">
</div>

## 🚀 Quick Start

### One-Click Deployment

1. **Click the deploy button** above to start automatic deployment
2. **Connect GitHub & Cloudflare** following the guided setup
3. **Configure Cloudflare Account ID & API Key**
4. **Fork the repository** to your GitHub account
5. **Enable GitHub Actions** in your forked repository

> 💡 **Tip**: When creating your Cloudflare API Key, use the worker template and ensure you add **D1 Database edit permissions**.

### Manual Setup

```bash
# Clone the repository
git clone https://github.com/oustn/cloudflare-drop.git
cd cloudflare-drop

# Install dependencies
pnpm install

# Set up environment
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your configuration

# Create Cloudflare resources
npx wrangler d1 create airdrop
npx wrangler kv:namespace create "file_drops"

# Start development server
pnpm start
```

## ⚙️ Configuration

### Required Cloudflare Resources

#### 1. Create D1 Database
```bash
npx wrangler d1 create airdrop
```
Save the **Database ID** for GitHub secrets configuration.

#### 2. Create KV Namespace
```bash
npx wrangler kv:namespace create "file_drops"
```
Save the **Namespace ID** for GitHub secrets configuration.

### GitHub Secrets Configuration

Navigate to your forked repository: **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret Name | Description | Required |
|-------------|-------------|----------|
| `D1_ID` | D1 Database ID | ✅ Yes |
| `D1_NAME` | D1 Database Name | ✅ Yes |
| `KV_ID` | KV Namespace ID | ✅ Yes |
| `CUSTOM_DOMAIN` | Custom domain (e.g., drop.example.com) | ❌ Optional |
| `ADMIN_TOKEN` | Admin panel access token | ❌ Optional |

### Environment Variables

Configure these in **Actions** → **Variables**:

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `SHARE_MAX_SIZE_IN_MB` | Maximum file size in MB | `10` | `50` |
| `SHARE_DURATION` | Default expiration time | `1hour` | `24hour`, `7day` |
| `RATE_LIMIT` | Requests per 10 seconds | `unlimited` | `10` |

#### Duration Format
Use format: `{number}{unit}` where unit can be:
- `minute`, `hour`, `day`, `week`, `month`, `year`
- Examples: `5minute`, `24hour`, `7day`, `1month`

## 🔧 Development

### Tech Stack

- **Frontend**: Preact + TypeScript + Material-UI
- **Backend**: Hono.js on Cloudflare Workers
- **Database**: Drizzle ORM + Cloudflare D1
- **Storage**: Cloudflare KV
- **Build**: Vite + TypeScript
- **Deployment**: Wrangler CLI

### Project Structure

```
cloudflare-drop/
├── src/                    # Backend Workers code
│   ├── admin/             # Admin panel APIs
│   ├── files/             # File handling APIs
│   └── middlewares/       # Auth, DB, Rate limiting
├── web/                   # Frontend application
│   ├── api/               # Client-side API calls
│   ├── components/        # Reusable UI components
│   ├── helpers/           # Utilities and encryption
│   ├── theme/             # Material-UI theming
│   └── views/             # Page components
├── data/                  # Database schemas and migrations
└── public/                # Static assets and PWA files
```

### Local Development

```bash
# Start development environment
pnpm start

# Build for production
pnpm run build:web

# Deploy to production
pnpm run deploy

# Generate database migrations
pnpm run generate

# Run linting and formatting
pnpm run lint
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm start` | Start development servers (web + worker) |
| `pnpm dev:web` | Start web development server only |
| `pnpm dev:app` | Start worker development server only |
| `pnpm build:web` | Build web application for production |
| `pnpm deploy` | Deploy to Cloudflare Workers |
| `pnpm generate` | Generate database migrations |
| `pnpm lint` | Run ESLint and Prettier |

## 🛡️ Admin Panel

Access the admin panel to manage shared files and monitor usage.

**URL**: `https://your-domain.com/admin/{ADMIN_TOKEN}`

### Admin Features
- **View all shared files** with metadata
- **Delete shares** manually
- **Monitor file usage** and expiration
- **Download files** with admin privileges
- **Preview text content** inline

<div align="center">
  <img src="assets/IMG_6000.png" width="400" alt="Admin Panel">
</div>

## 🔄 Updates & Maintenance

### Automatic Updates
- **Sync your fork** to automatically trigger deployment
- **GitHub Actions** will build and deploy changes
- **Database migrations** run automatically during deployment

### Scheduled Cleanup
- **10-minute cron job** automatically cleans expired content
- **KV storage cleanup** removes expired file chunks
- **D1 database cleanup** removes expired metadata

## 🌐 Internationalization

Supported languages:
- 🇺🇸 **English** (`en`)
- 🇨🇳 **简体中文** (`zh-CN`)
- 🇹🇼 **繁體中文** (`zh-TW`)

### Adding New Languages

1. Create translation file in `public/locales/{lang}.json`
2. Follow existing translation structure
3. Add language option to language selector component

## 📱 PWA Features

### Installation
- **Add to Home Screen** on mobile devices
- **Desktop installation** via browser
- **Offline functionality** for cached content
- **App shortcuts** for quick actions

### iOS Installation
1. Open in Safari
2. Tap the **Share** button
3. Scroll down and tap **"Add to Home Screen"**
4. Tap **"Add"** to install

## 🔒 Security & Privacy

### Encryption Details
- **AES-GCM 256-bit** encryption for password-protected shares
- **Client-side key derivation** using PBKDF2
- **Random IV generation** for each encrypted file
- **Server never stores** plaintext passwords

### Privacy Features
- **No user accounts** required
- **Automatic expiration** prevents indefinite storage
- **Optional burn-after-reading** for sensitive content
- **No tracking** or analytics

## 🚨 Troubleshooting

### Common Issues

#### Deployment Fails
- Verify **D1 Database** and **KV Namespace** are created
- Check **GitHub Secrets** are properly configured
- Ensure **Cloudflare API Key** has sufficient permissions

#### File Upload Errors
- Check file size against `SHARE_MAX_SIZE_IN_MB` limit
- Verify **KV Namespace** is accessible
- Check browser console for detailed errors

#### Admin Panel Access
- Verify `ADMIN_TOKEN` secret is configured
- Use correct URL format: `/admin/{token}`
- Check worker logs for authentication errors

### Getting Help

1. **Check the logs** in Cloudflare Workers dashboard
2. **Review GitHub Actions** for deployment issues
3. **Open an issue** on GitHub with detailed error information

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and add tests
4. **Run linting**: `pnpm run lint`
5. **Commit changes**: `git commit -m 'Add amazing feature'`
6. **Push to branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Cloudflare** for the amazing Workers platform
- **Material-UI** for the beautiful component library
- **Preact** for the lightweight React alternative
- **Drizzle ORM** for the excellent database toolkit

---

<div align="center">
  <p>Made with ❤️ using Cloudflare's edge infrastructure</p>
  <p>
    <a href="https://github.com/oustn/cloudflare-drop/stargazers">⭐ Star us on GitHub</a> |
    <a href="https://github.com/oustn/cloudflare-drop/issues">🐛 Report Bug</a> |
    <a href="https://github.com/oustn/cloudflare-drop/issues">💡 Request Feature</a>
  </p>
</div>
