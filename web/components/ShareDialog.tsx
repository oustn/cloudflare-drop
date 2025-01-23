import { useRef } from 'preact/hooks'
import { DialogProps } from '@toolpad/core/useDialogs'
import Box from '@mui/material/Box'
// import DialogActions from '@mui/material/DialogActions'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import zh from 'dayjs/locale/zh-cn'
import QrCode from 'qrcode-svg'

import { copyToClipboard } from '../common'
import { BasicDialog } from './BasicDialog'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'

import { Code } from '../components'

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
  const url = `${window.location.protocol}//${window.location.host}?code=${payload.code}`
  const desc = `链接: ${url} 提取码: ${payload.code} SHA1 Hash 值: ${payload.hash}`
  const qr = useRef(
    new QrCode({
      content: url,
    }).svg(),
  )

  const handleCopy = (str: string) => {
    copyToClipboard(str)
      .then(() => {
        payload.message.success('复制成功')
      })
      .catch(() => {
        payload.message.success('复制失败')
      })
  }

  return (
    <BasicDialog open={open} onClose={onClose} title="分享">
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
                '-webkit-text-fill-color': 'currentColor !important',
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
            复制
          </Button>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="textDisabled">
            原始分享 SHA1 Hash 值{' '}
            <a target="_blank" href="https://www.lzltool.com/data-hash">
              (校验工具)
            </a>
            {'：'}
          </Typography>
          <Typography
            className="mt-1"
            variant="body2"
            onClick={() => handleCopy(payload.hash)}
          >
            {payload.hash}
          </Typography>
          <Typography className="mt-1" variant="body2" color="textDisabled">
            预计过期于：
          </Typography>
          <Typography className="mt-1" variant="body2">
            {dayjs(payload.due_date).fromNow()}
          </Typography>
        </Box>
      </Box>
    </BasicDialog>
  )
}
