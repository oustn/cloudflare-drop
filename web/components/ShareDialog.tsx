import { useEffect, useState } from 'preact/hooks'
import { forwardRef, ReactElement, Ref } from 'preact/compat'
import { DialogProps } from '@toolpad/core/useDialogs'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import Box from '@mui/material/Box'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
// import DialogActions from '@mui/material/DialogActions'
import Typography from '@mui/material/Typography'
import Slide from '@mui/material/Slide'
import { TransitionProps } from '@mui/material/transitions'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'
import TextField from '@mui/material/TextField'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import zh from 'dayjs/locale/zh-cn'

import { fetchPlainText } from '../api'
import { copyToClipboard } from '../common'

dayjs.extend(relativeTime)
dayjs.locale(zh)

const Transition = forwardRef(function Transition(
  props: TransitionProps & {
    children: ReactElement<unknown>
  },
  ref: Ref<unknown>,
) {
  // @ts-expect-error preact type
  return <Slide direction="up" ref={ref} {...props} />
})

export function ShareDialog({
  open,
  onClose,
  payload,
}: DialogProps<
  FileType & {
    message: {
      error(message: string): void
      success(message: string): void
    }
  }
>) {
  const isText = payload.type === 'plain/string'
  const [text, updateText] = useState('')

  const handleClose = async (_e: unknown, reason?: string) => {
    if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
      return
    }
    await onClose()
  }

  const handleCopy = () => {
    copyToClipboard(text)
      .then(() => {
        payload.message.success('复制成功')
      })
      .catch(() => {
        payload.message.success('复制失败')
      })
  }

  useEffect(() => {
    if (isText) {
      ;(async () => {
        const data = await fetchPlainText(payload.objectId)
        updateText(data)
      })()
    }
  }, [])

  return (
    <Dialog
      fullScreen
      fullWidth
      open={open}
      onClose={handleClose}
      TransitionComponent={Transition}
    >
      <DialogTitle>{isText ? '文本' : '文件'}分享</DialogTitle>
      <IconButton
        aria-label="close"
        onClick={handleClose}
        sx={(theme) => ({
          position: 'absolute',
          right: 8,
          top: 8,
          color: theme.palette.grey[500],
        })}
      >
        <CloseIcon />
      </IconButton>
      <DialogContent
        className="w-full"
        sx={{
          margin: 'auto',
          maxWidth: 600,
        }}
      >
        {isText && (
          <Box>
            <TextField
              multiline
              fullWidth
              rows={10}
              value={text}
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
              onClick={handleCopy}
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
            className="flex items-center justify-center w-full"
            sx={{ p: 2 }}
          >
            <Button
              variant="contained"
              href={`/files/${payload.objectId}`}
              sx={(theme) => ({
                mt: 2,
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
          </Box>
        )}
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="textDisabled">
            SHA1 Hash 值{' '}
            <a target="_blank" href="https://www.lzltool.com/data-hash">
              (校验工具)
            </a>
            {'：'}
          </Typography>
          <Typography className="mt-1" variant="body2">
            {payload.hash}
          </Typography>
          <Typography className="mt-1" variant="body2" color="textDisabled">
            预计过期于：
          </Typography>
          <Typography className="mt-1" variant="body2">
            {dayjs(payload.due_date).fromNow()}
          </Typography>
        </Box>
      </DialogContent>
      {/*<DialogActions>*/}
      {/*  <Button onClick={handleClose}>关闭</Button>*/}
      {/*</DialogActions>*/}
    </Dialog>
  )
}
