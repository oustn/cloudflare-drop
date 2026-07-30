import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'

const homeSource = readFileSync(
  new URL('../web/views/Home/index.tsx', import.meta.url),
  'utf8',
)
const zhCNSource = readFileSync(
  new URL('../web/i18n/locales/zh-CN.ts', import.meta.url),
  'utf8',
)
const zhTWSource = readFileSync(
  new URL('../web/i18n/locales/zh-TW.ts', import.meta.url),
  'utf8',
)
const enSource = readFileSync(
  new URL('../web/i18n/locales/en.ts', import.meta.url),
  'utf8',
)

test('file share area supports both click selection and drag-and-drop upload', () => {
  expect(homeSource).toContain('const selectFile =')
  expect(homeSource).toContain('const handleFileDrop =')
  expect(homeSource).toContain('const handleFileDragOver =')
  expect(homeSource).toContain('const handleFileDragLeave =')
  expect(homeSource).toContain('const handleFileKeyDown =')
  expect(homeSource).toContain('hasDroppedFolder')
  expect(homeSource).toContain('onDrop={handleFileDrop}')
  expect(homeSource).toContain('onDragOver={handleFileDragOver}')
  expect(homeSource).toContain('onDragLeave={handleFileDragLeave}')
  expect(homeSource).toContain('onKeyDown={handleFileKeyDown}')
  expect(homeSource).toContain('component="label"')
  expect(homeSource).toContain('<VisuallyHiddenInput')
  expect(homeSource).toContain('fileInputRef.current?.click()')
  expect(homeSource).toContain('selectFile(file)')
  expect(homeSource).toContain("i18n.t('home.dropFileHint')")
  expect(homeSource).toContain("i18n.t('home.dropFileSubHint')")
  expect(homeSource).toContain("i18n.t('home.folderUploadNotSupported')")
})

test('file share dropzone height matches the text share input box', () => {
  expect(homeSource).toContain(
    '<TabPanel value="file" sx={{ height: 230, pl: 0, pr: 0 }}>',
  )
  expect(homeSource).not.toContain(
    '<TabPanel value="file" sx={{ height: 230, pl: 0, pr: 0, pb: 0 }}>',
  )
})

test('file share dropzone copy is translated', () => {
  expect(zhCNSource).toContain("dropFileHint: '拖拽文件到这里，或点击选择文件'")
  expect(zhCNSource).toContain("dropFileSubHint: '支持拖入上传和点击上传'")
  expect(zhCNSource).toContain(
    "folderUploadNotSupported: '暂不支持上传文件夹，请选择单个文件'",
  )
  expect(zhTWSource).toContain("dropFileHint: '拖拽檔案到這裡，或點擊選擇檔案'")
  expect(zhTWSource).toContain("dropFileSubHint: '支援拖入上傳和點擊上傳'")
  expect(zhTWSource).toContain(
    "folderUploadNotSupported: '暫不支援上傳資料夾，請選擇單個檔案'",
  )
  expect(enSource).toContain(
    "dropFileHint: 'Drop a file here, or click to choose'",
  )
  expect(enSource).toContain(
    "dropFileSubHint: 'Supports drag-and-drop and click upload'",
  )
  expect(enSource).toContain('folderUploadNotSupported:')
  expect(enSource).toContain(
    "'Folder upload is not supported. Please choose a single file.'",
  )
})
