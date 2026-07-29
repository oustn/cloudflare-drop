import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, test, vi } from 'vitest'

import {
  DEFAULT_LOCALE,
  i18nStore,
  detectLocale,
  isLocale,
  t,
} from '../web/i18n'
import { mapError } from '../web/helpers/errorMapper'

const layoutSource = readFileSync(
  new URL('../web/components/Layout.tsx', import.meta.url),
  'utf8',
)
const languageSwitchSource = readFileSync(
  new URL('../web/i18n/LanguageSwitch.tsx', import.meta.url),
  'utf8',
)

afterEach(() => {
  i18nStore.setLocale(DEFAULT_LOCALE)
  vi.unstubAllGlobals()
})

describe('i18n locale selection', () => {
  test('keeps Simplified Chinese as the default locale', () => {
    expect(DEFAULT_LOCALE).toBe('zh-CN')
    expect(detectLocale()).toBe('zh-CN')
    expect(t('common.share')).toBe('分享')
  })

  test('detects supported browser locales and prefers saved settings', () => {
    expect(detectLocale('zh-TW')).toBe('zh-TW')
    expect(detectLocale('zh-HK')).toBe('zh-TW')
    expect(detectLocale('en-US')).toBe('en')
    expect(detectLocale('fr-FR')).toBe('en')
    expect(detectLocale('en-US', 'zh-CN')).toBe('zh-CN')
    expect(detectLocale('zh-CN', 'zh-TW')).toBe('zh-TW')
  })

  test('validates the three supported locales', () => {
    expect(isLocale('zh-CN')).toBe(true)
    expect(isLocale('zh-TW')).toBe(true)
    expect(isLocale('en')).toBe(true)
    expect(isLocale('zh')).toBe(false)
  })
})

describe('i18n translations', () => {
  test('translates common UI copy across Simplified Chinese, Traditional Chinese, and English', () => {
    i18nStore.setLocale('zh-CN')
    expect(i18nStore.t('home.textShare')).toBe('文本分享')
    expect(i18nStore.t('duration.expiryConfig')).toBe('过期配置')

    i18nStore.setLocale('zh-TW')
    expect(i18nStore.t('home.textShare')).toBe('文字分享')
    expect(i18nStore.t('duration.expiryConfig')).toBe('過期設定')

    i18nStore.setLocale('en')
    expect(i18nStore.t('home.textShare')).toBe('Text share')
    expect(i18nStore.t('duration.expiryConfig')).toBe('Expiration')
  })

  test('supports interpolation for repeated UI messages', () => {
    i18nStore.setLocale('en')
    expect(i18nStore.t('home.fileTooLarge', { size: 50 })).toBe(
      'File is larger than 50M',
    )
    expect(i18nStore.t('history.shareCodeClick', { code: '123456' })).toBe(
      'Share code 123456, click to view',
    )
  })
})

describe('error mapping', () => {
  test('maps stable error codes to the active locale', () => {
    i18nStore.setLocale('en')
    expect(mapError('INVALID_CODE')).toBe('Invalid share code')
    expect(mapError('UPLOAD_SESSION_MISSING')).toBe('Upload session not found')

    i18nStore.setLocale('zh-TW')
    expect(mapError('INVALID_CODE')).toBe('分享碼無效')
  })

  test('maps existing Simplified Chinese server and client messages without changing the server protocol', () => {
    i18nStore.setLocale('en')
    expect(mapError('分享码无效')).toBe('Invalid share code')
    expect(mapError('上传会话不存在')).toBe('Upload session not found')
    expect(mapError('文件大于 50M')).toBe('File is larger than 50M')
    expect(mapError('KV 加密分享暂不支持大于 50M 的文件')).toBe(
      'Encrypted KV shares do not support files larger than 50M yet',
    )
  })

  test('preserves unknown human-readable errors', () => {
    i18nStore.setLocale('en')
    expect(mapError('Cloudflare 1102')).toBe('Cloudflare 1102')
    expect(mapError('')).toBe('Unknown error')
  })
})

test('layout exposes the language switch in the header', () => {
  expect(layoutSource).toContain('LanguageSwitch')
})

test('language switch stays compact for mobile headers', () => {
  expect(languageSwitchSource).toContain('IconButton')
  expect(languageSwitchSource).toContain('Menu')
  expect(languageSwitchSource).toContain('width: 40')
  expect(languageSwitchSource).toContain('height: 40')
  expect(languageSwitchSource).not.toContain('FormControl')
  expect(languageSwitchSource).not.toContain('@mui/material/Select')
  expect(languageSwitchSource).not.toContain('<Select')
  expect(languageSwitchSource).not.toContain('minWidth: 118')
})
