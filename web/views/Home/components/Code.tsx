import { useState, useEffect, useRef } from 'preact/hooks'
import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box'
import { alpha } from '@mui/material/styles'

interface CodeProps {
  length: number
  value?: string
  disabled?: boolean
  onChange?: (value: string) => void
}

function isValidateCode(str: string | string[], length = 6) {
  if (!str) return false
  if (str.length !== length) return false
  return (Array.isArray(str) ? str : str.split('')).every((d) =>
    /^[a-zA-Z\d]$/.test(d),
  )
}

let isComposition = false

export function Code({ length, value, onChange, disabled }: CodeProps) {
  const [codes, updateCodes] = useState<Array<string>>(
    value ? value.split('') : new Array(length).fill(''),
  )

  useEffect(() => {
    if (codes.join('') === value) return
    updateCodes((value ?? '').split(''))
  }, [value])

  useEffect(() => {
    if (value) return
    const code =
      new URL(window.location.href).searchParams.get('code')?.toUpperCase() ??
      ''
    if (code.length === length && isValidateCode(code, length)) {
      updateCodes(code.split(''))
    }
  }, [])

  useEffect(() => {
    if (
      codes.length === length &&
      codes.every((d) => /^[a-zA-Z\d]$/.test(d)) &&
      onChange
    ) {
      onChange(codes.join(''))
    }
  }, [codes, onChange])

  const update = (key: string, index: number) => {
    if (index < 0 || index >= length) return
    const values = [...codes]
    values[index] = key
    updateCodes(values)
  }

  const el = useRef<HTMLDivElement>(null)

  const handleAutoFocus = (index: number) => {
    if (!el.current) return
    const i = Math.max(0, Math.min(index, length - 1))
    const inputs = el.current.querySelectorAll('input')
    if (inputs[i]) {
      setTimeout(() => {
        inputs[i].focus()
      })
    }
  }

  const handleInput = (e: InputEvent, index: number) => {
    if (disabled || isComposition) return
    e.preventDefault()
    e.stopPropagation()
    const target: HTMLInputElement = e.target as HTMLInputElement
    const value = target.value.slice(0, 1).toUpperCase()
    if (!/^[a-zA-Z\d]$/.test(value)) {
      target.value = ''
      return
    }
    target.value = value

    update(value, index)

    if (index < length - 1) {
      handleAutoFocus(index + 1)
    }
  }

  const handleKeyUp = (e: KeyboardEvent, index: number) => {
    if (disabled) return
    if (e.key === 'Backspace') {
      update('', index)
      if (index > 0) {
        handleAutoFocus(index - 1)
      }
    }

    if (
      e.key === 'Enter' &&
      codes.length === length &&
      codes.every((d) => /^[a-zA-Z\d]$/.test(d)) &&
      onChange
    ) {
      onChange(codes.join(''))
    }
  }

  const handlePaste = (e: ClipboardEvent, index: number) => {
    if (disabled) return
    e.preventDefault()
    const string = e?.clipboardData?.getData('text') ?? ''
    const pasted = /(?:提取码:\s*|^)([a-zA-Z0-9]{6})(?=\s|\b|$)/.exec(string)
    const paste = pasted?.[1].toUpperCase()
    if (!paste) return
    const values = [...codes]
    for (let i = 0; i < length; i++) {
      values[index + i] = paste[i] ?? ''
    }
    updateCodes(values)
    handleAutoFocus(index + paste.length)
  }

  const handleCompositionStart = () => {
    isComposition = true
  }

  const handleCompositionEnd = () => {
    isComposition = false
  }

  return (
    <Box ref={el} className="flex gap-2">
      {new Array(length).fill(1).map((_, index) => (
        <Box className="relative">
          <TextField
            value={codes[index] ?? ''}
            sx={{
              '.MuiInputBase-root': {
                fontSize: 20,
                background: alpha('#183951', 0.2),
                backdropFilter: 'blur(10px)',
                border: `1px solid ${alpha('#ffffff', 0.2)}`,
                borderRadius: 1, // More square for better iOS number display
                '@media (max-width: 768px)': {
                  borderRadius: 0.5, // Even more square on mobile
                },
                '@media (max-width: 480px)': {
                  borderRadius: 0, // Completely square on iOS for better compatibility
                  fontSize: 18,
                },
                '& fieldset': {
                  border: 'none',
                },
                '&.Mui-focused': {
                  background: alpha('#183951', 0.4),
                  border: `1px solid ${alpha('#ffffff', 0.5)}`,
                  boxShadow: `0 0 0 2px ${alpha('#ffffff', 0.1)}`,
                },
              },

              '.MuiInputBase-root input': {
                paddingBlock: '0.4em',
                textAlign: 'center',
                color: alpha('#ffffff', 0.9),
                fontWeight: 600,
                letterSpacing: '0.1em',
              },
            }}
            slotProps={{
              htmlInput: {
                'data-bwignore': 'off',
                inputmode: 'email',
              },
            }}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            onInput={(e) => handleInput(e, index)}
            onKeyUp={(e) => handleKeyUp(e, index)}
            onPaste={(e) => handlePaste(e, index)}
          />
        </Box>
      ))}
    </Box>
  )
}
