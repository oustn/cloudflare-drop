import { useEffect, useState } from 'preact/hooks'
import { AxiosProgressEvent } from 'axios'
import { DialogProps } from '@toolpad/core/useDialogs'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
// import DialogActions from '@mui/material/DialogActions'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import zh from 'dayjs/locale/zh-cn'
import { useDialogs } from '@toolpad/core/useDialogs'
import Backdrop from '@mui/material/Backdrop'

import {
  decryptPlainText,
  fetchFile,
  fetchPlainText,
  fetchSharedBlob,
} from '../../../api'
import { copyToClipboard } from '../../../common.ts'
import { BasicDialog } from './BasicDialog.tsx'
import { PasswordSwitch } from './PasswordSwitch.tsx'
import LockClose from '@mui/icons-material/Lock'
import LockOpen from '@mui/icons-material/LockOpen'

dayjs.extend(relativeTime)
dayjs.locale(zh)

export function FileDialog({
  open,
  onClose,
  payload,
}: DialogProps<
  FileType & {
    message: {
      error(message: string): void
      success(message: string): void
    }
    token?: string
  }
>) {
  const dialogs = useDialogs()
  const isText = payload.type === 'plain/string'
  const [text, updateText] = useState(
    payload.is_encrypted ? '分享已加密，请使用密码解密' : '',
  )
  const [password, updatePassword] = useState('')
  const [backdrop] = useState(payload.is_encrypted ?? false)

  const [downloading, updateDownloading] = useState(false)
  const [progress, updateProgress] = useState(0)
  const [file, setFile] = useState<Blob | null>(null)
  const [encryptedText, setEncryptedText] = useState<Blob | null>(null)

  const showPassword = !password && payload.is_encrypted

  const handleCopy = (str: string) => {
    copyToClipboard(str)
      .then(() => {
        payload.message.success('复制成功')
      })
      .catch(() => {
        payload.message.success('复制失败')
      })
  }

  useEffect(() => {
    if (isText) {
      if (showPassword) return
      ;(async () => {
        const data = await fetchPlainText(payload.id, password, payload.token)
        updateText(data)
      })()
    }
  }, [])

  const handleClose = async () => {
    if (!payload.is_ephemeral) {
      return onClose()
    }
    const confirmed = await dialogs.confirm('关闭后无法再次查看，确认关闭？', {
      okText: '确认',
      cancelText: '取消',
      title: '阅后即焚',
    })
    if (confirmed) {
      return onClose()
    }
  }

  const handlePasswordChange = async (password: string) => {
    if (!password) {
      updatePassword('')
      return
    }
    try {
      const blob =
        encryptedText ?? (await fetchSharedBlob(payload.id, payload.token))
      setEncryptedText(blob)
      const data = await decryptPlainText(password, blob)
      updateText(data)
      updatePassword(password)
    } catch (_e) {
      payload.message.error('解密失败')
    }
  }

  const handlePasswordDownload = async (password: string) => {
    if (!password) {
      updatePassword('')
      return
    }

    try {
      if (!file) {
        updateDownloading(true)
        updateProgress(0)
      }
      const [originFile, e] = await fetchFile(
        file,
        payload.id,
        password,
        payload.filename,
        payload.token,
        (e: AxiosProgressEvent) => {
          updateProgress(e.loaded)
        },
      )
      if (!e) {
        updatePassword(password)
      } else {
        payload.message.error('解密失败')
      }
      setFile(originFile)
    } catch (_e) {
      payload.message.error('解密失败')
    }
    updateDownloading(false)
    updateProgress(0)
  }

  return (
    <BasicDialog
      open={open}
      onClose={handleClose}
      title={isText ? '文本分享' : '文件分享'}
    >
      <Box>
        {isText && (
          <Box>
            <Box className="relative">
              <TextField
                multiline
                fullWidth
                rows={10}
                value={text}
                disabled
                sx={(theme) => ({
                  '& .MuiInputBase-root': {
                    color: theme.palette.text.primary,
                    filter: showPassword ? 'blur(1px)' : 'none',
                  },
                  textarea: {
                    WebkitTextFillColor: 'currentColor !important',
                  },
                })}
              />
              {showPassword && (
                <Backdrop
                  className="absolute"
                  sx={(theme) => ({
                    color: '#fff',
                    zIndex: theme.zIndex.drawer + 1,
                  })}
                  open={backdrop}
                >
                  <PasswordSwitch
                    actionable
                    value={password}
                    onChange={handlePasswordChange}
                  ></PasswordSwitch>
                </Backdrop>
              )}
            </Box>
            <Button
              variant="contained"
              onClick={() => handleCopy(text)}
              sx={(theme) => ({
                mt: 2,
                pl: 4,
                pr: 4,
                [theme.breakpoints.down('sm')]: {
                  width: '100%',
                },
              })}
            >
              复制
            </Button>
          </Box>
        )}
        {!isText && (
          <Box
            className="flex items-center justify-center w-full flex-col"
            sx={{ p: 2 }}
          >
            <Typography variant="caption">
              {payload.filename}
              {payload.size >= 0
                ? ` (${(payload.size / (1000 * 1000)).toFixed(1)}M)`
                : ''}
            </Typography>
            {!payload.is_encrypted && (
              <Button
                target="_blank"
                variant="contained"
                href={`/files/${payload.id}?token=${payload.token}`}
                sx={(theme) => ({
                  mt: 1,
                  pl: 4,
                  pr: 4,
                  width: 200,
                  [theme.breakpoints.down('sm')]: {
                    width: '100%',
                  },
                })}
              >
                下载
              </Button>
            )}
            {payload.is_encrypted && (
              <PasswordSwitch
                actionable
                value={password}
                onChange={handlePasswordDownload}
              >
                {(openPassword) => (
                  <Button
                    loading={downloading}
                    loadingIndicator={`下载中(${((progress / payload.size) * 100).toFixed(1)}%)...`}
                    startIcon={!password ? <LockClose /> : <LockOpen />}
                    variant="contained"
                    color={!password ? 'warning' : 'primary'}
                    sx={(theme) => ({
                      mt: 1,
                      pl: 4,
                      pr: 4,
                      width: 200,
                      [theme.breakpoints.down('sm')]: {
                        width: '100%',
                      },
                    })}
                    onClick={async () => {
                      if (!password) {
                        await openPassword()
                        return
                      }
                      handlePasswordDownload(password)
                    }}
                  >
                    下载
                  </Button>
                )}
              </PasswordSwitch>
            )}
          </Box>
        )}
        <Box sx={{ mt: 2 }}>
          {!payload.is_encrypted && (
            <>
              <Typography variant="body2" color="textDisabled">
                原始分享 SHA256 Hash 值{' '}
                <a target="_blank" href="https://www.lzltool.com/data-hash">
                  (校验工具)
                </a>
                {'：'}
              </Typography>
              <Typography
                className="mt-1"
                variant="body2"
                onClick={() => handleCopy(payload.hash)}
                sx={{
                  wordBreak: 'break-all',
                }}
              >
                {payload.hash}
              </Typography>
            </>
          )}
          <Typography className="mt-1" variant="body2" color="textDisabled">
            {payload.due_date ? '预计过期于：' : '永久有效'}
          </Typography>
          {payload.due_date && (
            <Typography className="mt-1" variant="body2">
              {dayjs(payload.due_date).fromNow()}
            </Typography>
          )}
        </Box>
      </Box>
    </BasicDialog>
  )
}
