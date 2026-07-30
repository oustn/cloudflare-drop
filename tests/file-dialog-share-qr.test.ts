import { existsSync, readFileSync } from 'node:fs'
import { expect, test } from 'vitest'

const fileDialogSource = readFileSync(
  new URL('../web/views/Home/components/FileDialog.tsx', import.meta.url),
  'utf8',
)
const shareDialogSource = readFileSync(
  new URL('../web/views/Home/components/ShareDialog.tsx', import.meta.url),
  'utf8',
)
const shareQrCopyPanelUrl = new URL(
  '../web/views/Home/components/ShareQrCopyPanel.tsx',
  import.meta.url,
)
const shareQrCopyPanelSource = existsSync(shareQrCopyPanelUrl)
  ? readFileSync(shareQrCopyPanelUrl, 'utf8')
  : ''
const zhCNSource = readFileSync(
  new URL('../web/i18n/locales/zh-CN.ts', import.meta.url),
  'utf8',
)

test('share QR copy panel owns QR rendering and clickable share link copying', () => {
  expect(shareQrCopyPanelSource).toContain(
    "import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined'",
  )
  expect(shareQrCopyPanelSource).toContain("import QrCode from 'qrcode-svg'")
  expect(shareQrCopyPanelSource).toContain('content: shareUrl')
  expect(shareQrCopyPanelSource).toContain('padding: 1')
  expect(shareQrCopyPanelSource).not.toContain('padding: 4')
  expect(shareQrCopyPanelSource).toContain('dangerouslySetInnerHTML')
  expect(shareQrCopyPanelSource).toContain('<ContentCopyOutlinedIcon')
  expect(shareQrCopyPanelSource).toContain('fontSize: 18')
  expect(shareQrCopyPanelSource).not.toContain(
    '<ContentCopyOutlinedIcon fontSize="small" />',
  )
  expect(shareQrCopyPanelSource).toContain('{shareUrl}')
  expect(shareQrCopyPanelSource.indexOf('{shareUrl}')).toBeLessThan(
    shareQrCopyPanelSource.indexOf('<ContentCopyOutlinedIcon'),
  )
  expect(shareQrCopyPanelSource).toContain('flexShrink: 0')
  expect(shareQrCopyPanelSource).not.toContain('description')
  expect(shareQrCopyPanelSource).toContain('role="button"')
  expect(shareQrCopyPanelSource).toContain('tabIndex={0}')
  expect(shareQrCopyPanelSource).toContain('onClick={handleCopy}')
  expect(shareQrCopyPanelSource).toContain('onKeyDown={handleKeyDown}')
  expect(shareQrCopyPanelSource).toContain("event.key === 'Enter'")
  expect(shareQrCopyPanelSource).toContain("event.key === ' '")
  expect(shareQrCopyPanelSource).not.toContain("i18n.t('shareDialog.copyHint')")
  expect(shareQrCopyPanelSource).not.toContain('<TextField')
  expect(shareQrCopyPanelSource).not.toContain('<Button')
  expect(shareQrCopyPanelSource).toContain('copyToClipboard(shareUrl)')
  expect(shareQrCopyPanelSource).toContain("i18n.t('common.copySuccess')")
  expect(shareQrCopyPanelSource).toContain("i18n.t('common.copyFailed')")
})

test('share QR copy panel keeps the copy link as a plain one-line row', () => {
  expect(shareQrCopyPanelSource).toContain("display: 'flex'")
  expect(shareQrCopyPanelSource).toContain("alignItems: 'center'")
  expect(shareQrCopyPanelSource).toContain("justifyContent: 'center'")
  expect(shareQrCopyPanelSource).toContain("maxWidth: '100%'")
  expect(shareQrCopyPanelSource).toContain("color: '-webkit-link'")
  expect(shareQrCopyPanelSource).not.toContain(
    'color: theme.palette.primary.main',
  )
  expect(shareQrCopyPanelSource).not.toContain(
    'color: theme.palette.text.secondary',
  )
  expect(shareQrCopyPanelSource).toContain("overflow: 'hidden'")
  expect(shareQrCopyPanelSource).toContain("textOverflow: 'ellipsis'")
  expect(shareQrCopyPanelSource).toContain("whiteSpace: 'nowrap'")
  expect(shareQrCopyPanelSource).toContain('mb: 2')
  expect(shareQrCopyPanelSource).toContain('mt: 1')
  expect(shareQrCopyPanelSource).not.toContain('mb: 1')
  expect(shareQrCopyPanelSource).not.toContain('WebkitLineClamp')
  expect(shareQrCopyPanelSource).not.toContain('border:')
  expect(shareQrCopyPanelSource).not.toContain('backgroundColor:')
  expect(shareQrCopyPanelSource).not.toContain('borderRadius')
})

test('share dialog reuses the share QR copy panel', () => {
  expect(shareDialogSource).toContain('ShareQrCopyPanel')
  expect(shareDialogSource).toContain('shareUrl={url}')
  expect(shareDialogSource).not.toContain('description={')
  expect(shareDialogSource).not.toContain('const desc =')
  expect(shareDialogSource).not.toContain("i18n.t('shareDialog.description'")
  expect(shareDialogSource).not.toContain("i18n.t('shareDialog.hashPart'")
  expect(shareDialogSource).not.toContain("import QrCode from 'qrcode-svg'")
  expect(shareDialogSource).not.toContain('<TextField')
  expect(shareDialogSource).not.toContain('dangerouslySetInnerHTML')
})

test('file dialog reuses the share QR copy panel and hides it for burn-after-reading shares', () => {
  expect(fileDialogSource).toContain('ShareQrCopyPanel')
  expect(fileDialogSource).toContain('const shareUrl =')
  expect(fileDialogSource).toContain('?code=${payload.code}')
  expect(fileDialogSource).toContain('shareUrl={shareUrl}')
  expect(fileDialogSource).not.toContain('const shareDescription =')
  expect(fileDialogSource).not.toContain('description={')
  expect(fileDialogSource).not.toContain("i18n.t('shareDialog.description'")
  expect(fileDialogSource).not.toContain("i18n.t('shareDialog.hashPart'")
  expect(fileDialogSource).toContain(
    'const shouldShowShareQr = !payload.is_ephemeral',
  )
  expect(fileDialogSource).toContain('shouldShowShareQr &&')
  expect(fileDialogSource).not.toContain("import QrCode from 'qrcode-svg'")
  expect(fileDialogSource).not.toContain('dangerouslySetInnerHTML')
})

test('encrypted file dialog does not add an extra password notice around the share QR code', () => {
  expect(fileDialogSource).not.toContain('encryptedQrNotice')
  expect(zhCNSource).not.toContain('二维码不包含密码')
})
