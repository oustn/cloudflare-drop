import { useEffect } from 'preact/hooks'
import FormControlLabel from '@mui/material/FormControlLabel'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import { useState } from 'preact/hooks'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import { ManipulateType } from 'dayjs'
import { useLanguage } from '../../../helpers'
import { alpha } from '@mui/material/styles'

interface DurationProps {
  value?: string
  onChange?: (duration: string) => void
}

const DEFAULT_VALUE = 'default'
const MAX_VALUE = '999year'

const duration = ['day', 'week', 'month', 'year', 'hour', 'minute']
function resolveDuration(str: string): [number, ManipulateType] {
  const match = new RegExp(`^(\\d+)(${duration.join('|')})$`).exec(str)
  if (!match) {
    return [1, 'hour']
  }
  return [Number.parseInt(match[1], 10), match[2] as ManipulateType]
}

export function Duration(props: DurationProps) {
  const { value = '', onChange } = props
  const { t } = useLanguage()

  // Generate CONFIG with translations
  const CONFIG = [
    {
      label: t('home.timeUnits.default'),
      value: DEFAULT_VALUE,
    },
    {
      label: t('home.timeUnits.minute'),
      value: 'minute',
    },
    {
      label: t('home.timeUnits.hour'),
      value: 'hour',
    },
    {
      label: t('home.timeUnits.day'),
      value: 'day',
    },
    {
      label: t('home.timeUnits.week'),
      value: 'week',
    },
    {
      label: t('home.timeUnits.month'),
      value: 'month',
    },
    {
      label: t('home.timeUnits.year'),
      value: 'year',
    },
    {
      label: t('home.timeUnits.permanent'),
      value: '999year',
    },
  ]

  const [count, updateCount] = useState(0)
  const [type, updateType] = useState(DEFAULT_VALUE)

  useEffect(() => {
    if (!value) {
      updateCount(0)
      updateType(DEFAULT_VALUE)
      return
    }
    if (value === MAX_VALUE) {
      updateCount(0)
      updateType(MAX_VALUE)
      return
    }
    const [count, type] = resolveDuration(value)
    updateType(type)
    updateCount(count)
  }, [value])

  useEffect(() => {
    if (!onChange) return
    if (type === DEFAULT_VALUE) {
      return onChange('')
    }
    if (type === MAX_VALUE) {
      return onChange(MAX_VALUE)
    }
    return onChange(`${count}${type}`)
  }, [count, type])

  const handleChange = (e: SelectChangeEvent<string>) => {
    const value = (e?.target as { value?: string; label?: string })?.value ?? ''
    updateType(value)
    if (value === DEFAULT_VALUE || value === MAX_VALUE) {
      updateCount(0)
    } else if (value === 'minute') {
      updateCount(10)
    } else {
      updateCount(1)
    }
  }

  const handleBeforeInput = (e: InputEvent) => {
    const { target } = e as unknown as {
      target: {
        value: string
        selectionStart: number
        selectionEnd: number
      }
    }
    const nextVal =
      target.value.substring(0, target.selectionStart) +
      (e.data ?? '') +
      target.value.substring(target.selectionEnd)
    if (!/^\d+$/.test(nextVal) || nextVal.startsWith('0')) {
      e.preventDefault()
    }
    return
  }

  const handleInput = (e: InputEvent) => {
    const { target } = e as unknown as {
      target: {
        value: string
      }
    }

    updateCount(target.value ? Number.parseInt(target.value, 10) : 1)
  }

  return (
    <FormControlLabel
      className="w-full flex"
      sx={{
        ml: 0,
        '& .MuiTypography-root': {
          flexShrink: 0,
          mr: 1,
          color: alpha('#ffffff', 0.8),
        },
      }}
      control={
        <Box className="w-full flex">
          {type !== DEFAULT_VALUE && type !== MAX_VALUE && (
            <TextField
              value={count}
              sx={{
                mr: 1,
                '& .MuiOutlinedInput-root': {
                  background: alpha('#183951', 0.2),
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha('#ffffff', 0.2)}`,
                  '& fieldset': {
                    border: 'none',
                  },
                  '&.Mui-focused': {
                    background: alpha('#183951', 0.4),
                  },
                },
                '& .MuiInputBase-input': {
                  color: alpha('#ffffff', 0.9),
                },
              }}
              onInput={handleInput}
              onBeforeInput={handleBeforeInput}
            />
          )}
          <Select
            fullWidth
            size="small"
            defaultValue={DEFAULT_VALUE}
            value={type}
            onChange={handleChange}
            sx={{
              '& .MuiOutlinedInput-root': {
                background: alpha('#183951', 0.2),
                backdropFilter: 'blur(10px)',
                border: `1px solid ${alpha('#ffffff', 0.2)}`,
                '& fieldset': {
                  border: 'none',
                },
                '&.Mui-focused': {
                  background: alpha('#183951', 0.4),
                },
              },
              '& .MuiSelect-select': {
                color: alpha('#ffffff', 0.9),
              },
              '& .MuiSelect-icon': {
                color: alpha('#ffffff', 0.7),
              },
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  background: alpha('#183951', 0.9),
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${alpha('#ffffff', 0.2)}`,
                  borderRadius: 2,
                  '& .MuiMenuItem-root': {
                    color: alpha('#ffffff', 0.9),
                    '&.Mui-selected': {
                      background: alpha('#183951', 0.5),
                    },
                  },
                },
              },
            }}
          >
            {CONFIG.map((d) => (
              <MenuItem key={d.label} value={d.value}>
                {d.label}
              </MenuItem>
            ))}
          </Select>
        </Box>
      }
      label={t('home.settings.duration')}
      labelPlacement="start"
    />
  )
}
