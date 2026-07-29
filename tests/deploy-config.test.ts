import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'

function read(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
}

test('deployment script ensures default D1 and KV resources', () => {
  const prepare = read('prepare.sh')

  expect(prepare).toContain('DEFAULT_D1_NAME="cloudflare-drop"')
  expect(prepare).toContain(
    'DEFAULT_KV_NAMESPACE_NAME="cloudflare-drop-file-drops"',
  )
  expect(prepare).toContain('wrangler d1 list --json')
  expect(prepare).toContain('wrangler d1 create "$D1_DATABASE_NAME"')
  expect(prepare).toContain('wrangler kv namespace list')
  expect(prepare).toContain('wrangler kv namespace create "$KV_NAMESPACE_NAME"')
  expect(prepare).toContain('binding = \\"DB\\"')
  expect(prepare).toContain('binding = \\"file_drops\\"')
})

test('deployment script creates and binds the default optional R2 bucket', () => {
  const prepare = read('prepare.sh')

  expect(prepare).toContain('DEFAULT_R2_BUCKET="cloudflare-drop-files"')
  expect(prepare).toContain('r2 bucket create')
  expect(prepare).toContain('STORAGE_DRIVER_VALUE')
  expect(prepare).toContain('binding = \\"FILES\\"')
  expect(prepare).toContain('bucket_name = \\"$R2_BUCKET_NAME\\"')
  expect(prepare).toContain(
    'R2 bucket is unavailable; continuing with KV storage.',
  )
})

test('deploy workflow verifies Worker bindings before deployment', () => {
  const workflow = read('.github/workflows/deploy.yml')

  expect(workflow).toContain('node-version: 22')
  expect(workflow).toContain('pnpm exec tsc -p tsconfig.worker.json --noEmit')
  expect(workflow).toContain('D1_NAME: ${{ vars.D1_NAME || secrets.D1_NAME }}')
  expect(workflow).toContain('KV_NAMESPACE_NAME: ${{ vars.KV_NAMESPACE_NAME }}')
  expect(workflow).toContain(
    'R2_BUCKET: ${{ vars.R2_BUCKET || secrets.R2_BUCKET }}',
  )
})

test('local start uses a finite D1 migration confirmation', () => {
  const pkg = JSON.parse(read('package.json')) as {
    scripts: Record<string, string>
  }

  expect(pkg.scripts.prestart).toContain("printf 'y\\n'")
  expect(pkg.scripts.prestart).not.toContain('yes |')
})

test('R2 deployment docs use the app binding and current storage limits', () => {
  const wranglerExample = read('wrangler.example.toml')
  const readme = read('README.md')

  expect(wranglerExample).toContain('# binding = "DB"')
  expect(wranglerExample).toContain('# binding = "file_drops"')
  expect(wranglerExample).toContain('# binding = "FILES"')
  expect(wranglerExample).toContain('# bucket_name = "cloudflare-drop-files"')
  expect(wranglerExample).toContain(
    'Production bindings must be configured under [env.production]',
  )
  expect(readme).toContain('R2_BUCKET')
  expect(readme).toContain('R2 的编辑权限')
  expect(readme).toContain('默认会自动确保 D1、KV，并尝试启用 R2')
  expect(readme).toContain('D1_NAME')
  expect(readme).toContain('KV_NAMESPACE_NAME')
  expect(readme).toContain('KV 加密分享最大 50MB')
  expect(readme).not.toContain('加密文件当前最大 25MB')
  expect(readme).not.toContain('需要创建 [D1Database]')
})
