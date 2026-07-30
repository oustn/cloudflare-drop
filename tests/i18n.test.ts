import { readFileSync } from 'node:fs'
import dayjs from 'dayjs'
import { afterEach, describe, expect, test, vi } from 'vitest'

import {
  DEFAULT_LOCALE,
  i18nStore,
  detectLocale,
  isLocale,
  t,
} from '../web/i18n'
import { mapError } from '../web/helpers/errorMapper'
import { LOCALES } from '../web/i18n/locales'
import { LOCALE_CONFIG, SUPPORTED_LOCALES } from '../web/i18n/config'

const layoutSource = readFileSync(
  new URL('../web/components/Layout.tsx', import.meta.url),
  'utf8',
)
const languageSwitchSource = readFileSync(
  new URL('../web/i18n/LanguageSwitch.tsx', import.meta.url),
  'utf8',
)
const storeSource = readFileSync(
  new URL('../web/i18n/store.ts', import.meta.url),
  'utf8',
)
const adminSource = readFileSync(
  new URL('../web/views/Admin/index.tsx', import.meta.url),
  'utf8',
)

function flattenTranslationKeys(
  tree: Record<string, unknown>,
  prefix = '',
): string[] {
  return Object.entries(tree).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object') {
      return flattenTranslationKeys(value as Record<string, unknown>, path)
    }
    return path
  })
}

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

  test('keeps locale metadata in one shared config', () => {
    expect(SUPPORTED_LOCALES).toEqual(['zh-CN', 'zh-TW', 'en'])
    expect(LOCALE_CONFIG).toEqual({
      'zh-CN': {
        label: '简体中文',
        shortLabel: '简',
        dayjsLocale: 'zh-cn',
      },
      'zh-TW': {
        label: '繁體中文',
        shortLabel: '繁',
        dayjsLocale: 'zh-tw',
      },
      en: {
        label: 'English',
        shortLabel: 'EN',
        dayjsLocale: 'en',
      },
    })
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

  test('translates admin UI copy and status labels', () => {
    i18nStore.setLocale('zh-CN')
    expect(i18nStore.t('admin.shareList')).toBe('分享列表')
    expect(i18nStore.t('admin.storageProvider')).toBe('存储')
    expect(i18nStore.t('admin.burnAfterRead')).toBe('阅后即焚')

    i18nStore.setLocale('zh-TW')
    expect(i18nStore.t('admin.shareList')).toBe('分享列表')
    expect(i18nStore.t('admin.storageProvider')).toBe('儲存')
    expect(i18nStore.t('admin.burnAfterRead')).toBe('閱後即焚')

    i18nStore.setLocale('en')
    expect(i18nStore.t('admin.shareList')).toBe('Shares')
    expect(i18nStore.t('admin.storageProvider')).toBe('Storage')
    expect(i18nStore.t('admin.burnAfterRead')).toBe('Burn after reading')
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

  test('keeps all locale packs aligned with the same translation keys', () => {
    const zhCNKeys = flattenTranslationKeys(LOCALES['zh-CN']).sort()

    for (const locale of SUPPORTED_LOCALES) {
      expect(flattenTranslationKeys(LOCALES[locale]).sort()).toEqual(zhCNKeys)
    }
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
  expect(languageSwitchSource).toContain('LOCALE_CONFIG')
  expect(languageSwitchSource).toContain('width: 40')
  expect(languageSwitchSource).toContain('height: 40')
  expect(languageSwitchSource).not.toContain('const LOCALE_LABELS')
  expect(languageSwitchSource).not.toContain('const LOCALE_SHORT_LABELS')
  expect(languageSwitchSource).not.toContain('FormControl')
  expect(languageSwitchSource).not.toContain('@mui/material/Select')
  expect(languageSwitchSource).not.toContain('<Select')
  expect(languageSwitchSource).not.toContain('minWidth: 118')
})

test('store uses shared locale metadata for dayjs configuration', () => {
  expect(storeSource).toContain('LOCALE_CONFIG[locale].dayjsLocale')
  expect(storeSource).not.toContain('const DAYJS_LOCALE')
})

test('i18n bootstrap initializes dayjs relative time before dialogs are loaded', () => {
  const value = dayjs(new Date(Date.now() - 60_000)) as dayjs.Dayjs & {
    fromNow?: () => string
  }

  expect(value.fromNow).toBeTypeOf('function')
})

test('admin view uses i18n keys for labels and includes storage/ephemeral columns', () => {
  expect(adminSource).toContain('observer(function AdminMain')
  expect(adminSource).toContain("'admin.storageProvider'")
  expect(adminSource).toContain("'admin.burnAfterRead'")
  expect(adminSource).toContain("'admin.shareList'")
  expect(adminSource).not.toContain("label: '文件名'")
  expect(adminSource).not.toContain("'删除后无法恢复，请确认是否删除？'")
})
