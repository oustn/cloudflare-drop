import { useEffect, useRef, useState } from 'preact/hooks'
import { observer } from 'mobx-react-lite'
import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box'

import { applyDigits, extractShareCodeDigits } from './codeInput'
import { useTranslation } from '../../../i18n'

interface CodeProps {
  length: number
  value?: string
  disabled?: boolean
  onChange?: (value: string) => void
}

function toValues(value: string | undefined, length: number, disabled = false) {
  const code = (
    disabled ? (value ?? '') : extractShareCodeDigits(value ?? '')
  ).slice(0, length)
  return [...code, ...new Array(Math.max(length - code.length, 0)).fill('')]
}

export const Code = observer(function Code({
  length,
  value,
  onChange,
  disabled = false,
}: CodeProps) {
  const i18n = useTranslation()
  const [codes, updateCodes] = useState(() => toValues(value, length, disabled))
  const inputs = useRef<Array<HTMLInputElement | null>>([])
  const composing = useRef(false)

  useEffect(() => {
    updateCodes(toValues(value, length, disabled))
  }, [value, length, disabled])

  useEffect(() => {
    if (value) return
    const code = new URL(window.location.href).searchParams.get('code') ?? ''
    const values = toValues(code, length)
    if (values.every(Boolean)) updateCodes(values)
  }, [length, value])

  useEffect(() => {
    if (codes.every(Boolean)) onChange?.(codes.join(''))
  }, [codes, onChange])

  const focus = (index: number) => {
    const target = inputs.current[Math.max(0, Math.min(index, length - 1))]
    requestAnimationFrame(() => target?.focus())
  }

  const setCodes = (next: string[]) => updateCodes(next.slice(0, length))

  const handleInput = (event: InputEvent, index: number) => {
    if (disabled || composing.current) return
    const target = event.target
    if (!(target instanceof HTMLInputElement)) return
    const entered = extractShareCodeDigits(target.value)
    const result = applyDigits(codes, index, entered)
    target.value = result.values[index]
    setCodes(result.values)
    if (entered) {
      focus(result.focusIndex)
    }
  }

  const handleKeyDown = (event: KeyboardEvent, index: number) => {
    if (disabled) return
    if (event.key === 'Backspace') {
      event.preventDefault()
      const next = [...codes]
      if (next[index]) {
        next[index] = ''
      } else if (index > 0) {
        next[index - 1] = ''
        focus(index - 1)
      }
      setCodes(next)
      return
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault()
      focus(index - 1)
    }
    if (event.key === 'ArrowRight' && index < length - 1) {
      event.preventDefault()
      focus(index + 1)
    }
    if (event.key === 'Enter' && codes.every(Boolean))
      onChange?.(codes.join(''))
  }

  const handlePaste = (event: ClipboardEvent, index: number) => {
    if (disabled) return
    event.preventDefault()
    const result = applyDigits(
      codes,
      index,
      event.clipboardData?.getData('text') ?? '',
    )
    if (result.values.join('') === codes.join('')) return
    setCodes(result.values)
    focus(result.focusIndex)
  }

  return (
    <Box className="flex gap-2">
      {codes.map((code, index) => (
        <Box className="relative" key={index}>
          <TextField
            disabled={disabled}
            inputRef={(element) => {
              inputs.current[index] = element
            }}
            value={code}
            sx={{
              '.MuiInputBase-root': { fontSize: 20 },
              '.MuiInputBase-root input': {
                paddingBlock: '0.4em',
                textAlign: 'center',
              },
            }}
            slotProps={{
              htmlInput: {
                'aria-label': i18n.t('common.codeDigit', {
                  index: index + 1,
                }),
                'data-bwignore': 'off',
                autoComplete: index === 0 ? 'one-time-code' : 'off',
                inputMode: 'numeric',
                maxLength: 1,
                pattern: '[0-9]*',
              },
            }}
            onCompositionStart={() => {
              composing.current = true
            }}
            onCompositionEnd={() => {
              composing.current = false
            }}
            onInput={(event) => handleInput(event, index)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            onPaste={(event) => handlePaste(event, index)}
          />
        </Box>
      ))}
    </Box>
  )
})
