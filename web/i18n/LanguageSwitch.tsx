import { observer } from 'mobx-react-lite'
import { useState } from 'preact/hooks'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'

import { LOCALE_CONFIG, SUPPORTED_LOCALES } from './config'
import { Locale } from './types'
import { useTranslation } from './useTranslation'

export const LanguageSwitch = observer(function LanguageSwitch() {
  const i18n = useTranslation()
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const open = Boolean(anchorEl)

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleSelect = (locale: Locale) => {
    i18n.setLocale(locale)
    handleClose()
  }

  return (
    <>
      <IconButton
        aria-label={i18n.t('common.language')}
        aria-controls={open ? 'language-menu' : undefined}
        aria-expanded={open ? 'true' : undefined}
        aria-haspopup="menu"
        title={i18n.t('common.language')}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{
          flexShrink: 0,
          height: 40,
          width: 40,
        }}
      >
        <Box
          component="span"
          sx={{
            fontSize: 13,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          {LOCALE_CONFIG[i18n.locale].shortLabel}
        </Box>
      </IconButton>
      <Menu
        id="language-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        {SUPPORTED_LOCALES.map((locale) => (
          <MenuItem
            dense
            key={locale}
            selected={locale === i18n.locale}
            onClick={() => handleSelect(locale)}
          >
            {LOCALE_CONFIG[locale].label}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
})
