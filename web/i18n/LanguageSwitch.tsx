import { useState } from 'preact/hooks'
import { observer } from 'mobx-react-lite'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ListItemText from '@mui/material/ListItemText'
import ListItemIcon from '@mui/material/ListItemIcon'
import CheckIcon from '@mui/icons-material/Check'
import LanguageIcon from '@mui/icons-material/Language'
import { useTranslation, Locale } from '.'

const LANGUAGE_OPTIONS: Array<{
  locale: Locale
  label: string
  emoji: string
}> = [
  { locale: 'zh-TW', label: '繁體中文（臺灣）', emoji: '🇹🇼' },
  { locale: 'en', label: 'English', emoji: '🇺🇸' },
]

export const LanguageSwitch = observer(() => {
  const { locale, setLocale } = useTranslation()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleClick = (event: MouseEvent) => {
    setAnchorEl(event.currentTarget as HTMLElement)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleSelectLocale = (newLocale: Locale) => {
    setLocale(newLocale)
    handleClose()
  }

  return (
    <>
      <IconButton
        onClick={handleClick}
        size="small"
        sx={{ ml: 1 }}
        aria-controls={open ? 'language-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        <LanguageIcon />
      </IconButton>
      <Menu
        id="language-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'language-button',
        }}
      >
        {LANGUAGE_OPTIONS.map((option) => (
          <MenuItem
            key={option.locale}
            selected={locale === option.locale}
            onClick={() => handleSelectLocale(option.locale)}
          >
            {locale === option.locale && (
              <ListItemIcon>
                <CheckIcon fontSize="small" />
              </ListItemIcon>
            )}
            <ListItemText inset={locale !== option.locale}>
              {option.emoji} {option.label}
            </ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  )
})
