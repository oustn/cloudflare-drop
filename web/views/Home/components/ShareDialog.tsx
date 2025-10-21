import { useRef } from 'preact/hooks'
import { DialogProps } from '@toolpad/core/useDialogs'
import Box from '@mui/material/Box'
// import DialogActions from '@mui/material/DialogActions'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import zh from 'dayjs/locale/zh-cn'
import QrCode from 'qrcode-svg'

import { copyToClipboard } from '../../../common.ts'
import { BasicDialog } from './BasicDialog.tsx'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import { useLanguage } from '../../../helpers'

import { Code } from './index.tsx'

dayjs.extend(relativeTime)
dayjs.locale(zh)

export function ShareDialog({
  open,
  onClose,
  payload,
}: DialogProps<
  FileUploadedType & {
    message: {
      error(message: string): void
      success(message: string): void
    }
  }
>) {
  const { t } = useLanguage()
  const url = `${window.location.protocol}//${window.location.host}?code=${payload.code}`
  const desc = `${t('dialogs.fileShare.linkLabel')}: ${url} ${t('dialogs.fileShare.extractCode')}: ${payload.code} ${payload.is_encrypted ? '' : ` ${t('dialogs.fileShare.sha256Hash')}: ${payload.hash}`} `
  const qr = useRef(
    new QrCode({
      content: url,
    }).svg(),
  )

  const handleCopy = (str: string) => {
    copyToClipboard(str)
      .then(() => {
        payload.message.success(t('messages.copySuccess'))
      })
      .catch(() => {
        payload.message.success(t('messages.copyFailed'))
      })
  }

  return (
    <BasicDialog open={open} onClose={onClose} title={t('dialogs.shareSuccess.title')}>
      <Box>
        <Box
          className="relative"
          sx={{
            '&::after': {
              display: 'block',
              position: 'absolute',
              content: '" "',
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
            },
          }}
          onClick={() => handleCopy(payload.code)}
        >
          <Code disabled length={6} value={payload.code} />
        </Box>
        <Box
          sx={{ mt: 2 }}
          className="flex justify-center"
          dangerouslySetInnerHTML={{ __html: qr.current }}
        />

        <Box sx={{ mt: 2 }}>
          <TextField
            multiline
            fullWidth
            rows={4}
            value={desc}
            disabled
            sx={(theme) => ({
              '& .MuiInputBase-root': {
                color: theme.palette.text.primary,
              },
              textarea: {
                WebkitTextFillColor: 'currentColor !important',
              },
            })}
          />
          <Button
            variant="contained"
            onClick={() => handleCopy(desc)}
            sx={(theme) => ({
              mt: 2,
              pl: 4,
              pr: 4,
              [theme.breakpoints.down('sm')]: {
                width: '100%',
              },
            })}
          >
            {t('dialogs.shareSuccess.copyLink')}
          </Button>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="textDisabled">
            {t('dialogs.fileShare.originalShare')}{' '}
            <a target="_blank" href="https://emn178.github.io/online-tools/sha256.html">
              ({t('dialogs.fileShare.verificationTool')})
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
          {}
          <Typography className="mt-1" variant="body2" color="textDisabled">
            {payload.due_date ? `${t('dialogs.fileShare.expectedExpiry')}：` : t('dialogs.fileShare.permanent')}
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
