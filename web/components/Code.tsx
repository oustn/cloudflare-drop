import { useState, useEffect, useRef } from 'preact/hooks'
import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box'

interface CodeProps {
  length: number
  value?: string
  onChange?: (value: string) => void
}

function isValidateCode(str: string | string[], length = 6) {
  if (!str) return false
  if (str.length !== length) return false
  return (Array.isArray(str) ? str : str.split('')).every((d) =>
    /^[a-zA-Z\d]$/.test(d),
  )
}

export function Code({ length, value, onChange }: CodeProps) {
  const [codes, updateCodes] = useState<Array<string>>(
    value ? value.split('') : new Array(length).fill(''),
  )

  useEffect(() => {
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
    const target: HTMLInputElement = e.target as HTMLInputElement
    const value = target.value.slice(0, 1).toUpperCase()
    //
    // if (!value) {
    //   const values = [...codes]
    //   values[index] = ''
    //   updateCodes(values)
    //   if (index > 0) {
    //     handleAutoFocus(index - 1)
    //   }
    //   return
    // }

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
    e.preventDefault()
    let paste = e?.clipboardData?.getData('text')
    paste = paste?.toUpperCase()
    if (!paste) return
    const values = [...codes]
    for (let i = 0; i < length; i++) {
      values[index + i] = paste[i] ?? ''
    }
    updateCodes(values)
    handleAutoFocus(index + paste.length)
  }

  return (
    <Box ref={el} className="flex gap-2">
      {new Array(length).fill(1).map((_, index) => (
        <TextField
          value={codes[index] ?? ''}
          disabled={index > 0 && !codes[index - 1]}
          sx={{
            '.MuiInputBase-root': {
              fontSize: 20,
            },

            '.MuiInputBase-root input': {
              paddingBlock: '0.4em',
              textAlign: 'center',
            },
          }}
          onInput={(e) => handleInput(e, index)}
          onKeyUp={(e) => handleKeyUp(e, index)}
          onPaste={(e) => handlePaste(e, index)}
        />
      ))}
    </Box>
  )
}
