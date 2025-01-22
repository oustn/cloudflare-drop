import { useState, useRef } from 'preact/hooks'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'

export interface MessageProps {
  open: boolean
  duration?: number
  type?: 'success' | 'error'
  message: string
}

export function Message({
  open,
  duration = 4000,
  type = 'success',
  message,
}: MessageProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={duration}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
    >
      <Alert severity={type} variant="filled" sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  )
}

export function useMessage(): [
  MessageProps,
  { error(message: string): void; success(message: string): void },
] {
  const [props, updateProps] = useState<MessageProps>({
    open: false,
    type: 'success',
    message: '',
  })

  const timer = useRef(0)

  const error = useRef((message: string) => {
    clearTimeout(timer.current)
    updateProps({
      type: 'error',
      message,
      open: true,
    })
    timer.current = setTimeout(() => {
      updateProps((props) => ({
        ...props,
        open: false,
      }))
    }, 4000) as unknown as number
  })

  const success = useRef((message: string) => {
    clearTimeout(timer.current)
    updateProps({
      type: 'success',
      message,
      open: true,
    })
    timer.current = setTimeout(() => {
      updateProps((props) => ({
        ...props,
        open: false,
      }))
    }, 4000) as unknown as number
  })

  return [
    props,
    {
      error: error.current,
      success: success.current,
    },
  ]
}
