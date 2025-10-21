import { IconButton, Tooltip } from '@mui/material'
import { useThemeMode } from '../theme/AppTheme'

export const ThemeModeToggle = () => {
  try {
    const { mode, toggleMode } = useThemeMode()

    const handleToggle = () => {
      console.log('Theme toggle clicked, current mode:', mode)
      toggleMode()
    }

    const getIcon = () => {
      switch (mode) {
        case 'light':
          return '☀️'
        case 'dark':
          return '🌙'
        default:
          return '💻'
      }
    }

    const getTooltip = () => {
      switch (mode) {
        case 'light':
          return 'Switch to Dark Mode'
        case 'dark':
          return 'Switch to System Mode'
        default:
          return 'Switch to Light Mode'
      }
    }

    return (
      <Tooltip title={getTooltip()}>
        <IconButton 
          onClick={handleToggle} 
          size="small"
          sx={{
            fontSize: '1.2rem',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          {getIcon()}
        </IconButton>
      </Tooltip>
    )
  } catch (error) {
    console.error('ThemeModeToggle error:', error)
    return (
      <IconButton size="small">
        🌙
      </IconButton>
    )
  }
}

export default ThemeModeToggle