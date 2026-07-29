import * as React from 'preact/compat'
import { ComponentChildren } from 'preact'
import { useState, useEffect, useRef } from 'preact/hooks'
import IconButton from '@mui/material/IconButton'
import LockClose from '@mui/icons-material/Lock'
import LockOpen from '@mui/icons-material/LockOpen'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import { useDialogs, DialogProps } from '@toolpad/core/useDialogs'
import Button from '@mui/material/Button'
import InputAdornment from '@mui/material/InputAdornment'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import OutlinedInput from '@mui/material/OutlinedInput'
import FormHelperText from '@mui/material/FormHelperText'
import LinearProgress from '@mui/material/LinearProgress'
import { passwordStrength } from '../../../helpers'

interface PasswordSwitchProps {
  value?: string
  onChange?: (password: string) => void
  actionable?: boolean
  children?: (open: { (): Promise<void> }) => ComponentChildren
}

function PasswordDialog({
  open,
  onClose,
  payload,
}: DialogProps<
  { password: string; showClear: boolean; showStrength: boolean },
  string | null
>) {
  const { password, showClear = true, showStrength = false } = payload
  const [result, setResult] = useState(password)
  const [show, setShow] = useState(false)
  const el = useRef<HTMLDivElement>(null)
  const strength = showStrength ? passwordStrength(result) : null

  const handleClickShowPassword = () => setShow((show) => !show)

  const handleMouseDownPassword = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault()
  }

  const handleMouseUpPassword = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault()
  }

  useEffect(() => {
    if (!el.current) return
    const input = el.current.querySelector('input')
    if (input) {
      input.focus()
    }
  }, [])

  return (
    <Dialog open={open} onClose={() => onClose(null)}>
      <DialogTitle>分享密码</DialogTitle>
      <DialogContent>
        <div className="px-0.5 pt-1.5">
          <OutlinedInput
            ref={el}
            placeholder="请输入分享密码"
            type={show ? 'text' : 'password'}
            name="share-password"
            autoComplete="new-password"
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  onClick={handleClickShowPassword}
                  onMouseDown={handleMouseDownPassword}
                  onMouseUp={handleMouseUpPassword}
                  edge="end"
                >
                  {show ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            }
            slotProps={{
              input: {
                name: 'share-password',
                autoComplete: 'new-password',
                // @ts-expect-error data-attr
                'data-bwignore': true,
                'data-1p-ignore': true,
                'data-lpignore': true,
                'data-op-ignore': true,
                'data-protonpass-ignore': true,
              },
            }}
            fullWidth
            value={result}
            onChange={(event) => setResult(event.currentTarget.value)}
          />
        </div>
        {strength && (
          <FormHelperText component="div" sx={{ mt: 1.5 }}>
            <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
              <span>密码强度：{strength.label}</span>
              <span>{strength.suggestion}</span>
            </div>
            <LinearProgress
              aria-label={`密码强度：${strength.label}`}
              color={strength.color}
              sx={{ mt: 0.5 }}
              value={strength.value}
              variant="determinate"
            />
          </FormHelperText>
        )}
        <FormHelperText sx={{ mt: 2 }}>
          采用 AES-GCM 端对端加密，服务器不保存密码，密码丢失数据将无法恢复
        </FormHelperText>
      </DialogContent>
      <DialogActions
        sx={{
          p: 4,
          pt: 0,
        }}
      >
        {showClear && (
          <Button
            className="flex-1"
            variant="outlined"
            color="error"
            onClick={() => onClose('')}
          >
            清空密码
          </Button>
        )}
        <Button
          className="flex-1"
          variant="contained"
          onClick={() => onClose(result)}
        >
          确认
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export function PasswordSwitch(props: PasswordSwitchProps) {
  const dialogs = useDialogs()

  const { value, onChange, actionable } = props
  const [password, updatePassword] = useState(value ?? '')

  const handleClick = async () => {
    const result = await dialogs.open(PasswordDialog, {
      password,
      showClear: !actionable,
      showStrength: !actionable,
    })
    updatePassword(result || '')
    if (onChange) {
      onChange(result || '')
    }
  }

  if (props.children) {
    return props.children(handleClick)
  }

  return (
    <IconButton onClick={handleClick}>
      {password || actionable ? (
        <LockClose color="primary" />
      ) : (
        <LockOpen color="disabled" />
      )}
    </IconButton>
  )
}
