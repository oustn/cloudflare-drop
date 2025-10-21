import * as React from 'react'
import { ThemeProvider, createTheme, alpha } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

interface AppThemeProps {
  children: React.ReactNode
  mode?: 'light' | 'dark' | 'system'
}

// Theme Context
interface ThemeContextType {
  mode: 'light' | 'dark' | 'system'
  setMode: (mode: 'light' | 'dark' | 'system') => void
  toggleMode: () => void
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined)

// Square UI Design System - Modern & Clean
const squareColors = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
}

const getSquareTheme = (mode: 'light' | 'dark') => {
  const isDark = mode === 'dark'
  
  return createTheme({
    palette: {
      mode,
      primary: {
        main: squareColors.primary[600],
        light: squareColors.primary[400],
        dark: squareColors.primary[800],
        contrastText: '#ffffff',
      },
      secondary: {
        main: squareColors.gray[isDark ? 400 : 600],
        light: squareColors.gray[isDark ? 300 : 500],
        dark: squareColors.gray[isDark ? 500 : 700],
        contrastText: isDark ? '#000000' : '#ffffff',
      },
      error: {
        main: '#ef4444',
        light: '#f87171',
        dark: '#dc2626',
      },
      warning: {
        main: '#f59e0b',
        light: '#fbbf24',
        dark: '#d97706',
      },
      success: {
        main: '#10b981',
        light: '#34d399',
        dark: '#059669',
      },
      background: {
        default: isDark ? '#0f172a' : '#ffffff',
        paper: isDark ? '#1e293b' : '#f8fafc',
      },
      text: {
        primary: isDark ? '#f1f5f9' : '#0f172a',
        secondary: isDark ? '#94a3b8' : '#64748b',
      },
      divider: isDark ? alpha('#334155', 0.5) : alpha('#e2e8f0', 0.8),
    },
    typography: {
      fontFamily:
        '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      h1: {
        fontSize: '3.5rem',
        fontWeight: 800,
        lineHeight: 1.1,
        letterSpacing: '-0.025em',
        color: '#71717a',
      },
      h2: {
        fontSize: '2.5rem',
        fontWeight: 700,
        lineHeight: 1.2,
        letterSpacing: '-0.02em',
      },
      h3: {
        fontSize: '2rem',
        fontWeight: 600,
        lineHeight: 1.3,
        letterSpacing: '-0.01em',
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 500,
        lineHeight: 1.5,
      },
      h6: {
        fontSize: '1.125rem',
        fontWeight: 500,
        lineHeight: 1.5,
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.7,
        fontWeight: 400,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.6,
        fontWeight: 400,
      },
      button: {
        fontWeight: 500,
        textTransform: 'none' as const,
        letterSpacing: '0.02em',
        fontSize: '0.95rem',
      },
    },
    shape: {
      borderRadius: 8, // Square design - minimal rounded corners
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: {
            scrollBehavior: 'smooth',
          },
          body: {
            background: isDark ? '#0f172a' : '#ffffff',
            minHeight: '100vh',
            backgroundAttachment: 'fixed',
            fontSmoth: 'always',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
          },
          '*': {
            '&::-webkit-scrollbar': {
              width: 8,
              height: 8,
            },
            '&::-webkit-scrollbar-track': {
              background: isDark ? alpha(squareColors.gray[800], 0.3) : alpha(squareColors.gray[200], 0.5),
              borderRadius: 4,
            },
            '&::-webkit-scrollbar-thumb': {
              background: isDark ? alpha(squareColors.gray[600], 0.5) : alpha(squareColors.gray[400], 0.7),
              borderRadius: 4,
              '&:hover': {
                background: isDark ? alpha(squareColors.gray[500], 0.7) : alpha(squareColors.gray[500], 0.8),
              },
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: isDark 
              ? alpha(squareColors.gray[800], 0.8)
              : alpha('#ffffff', 0.9),
            backdropFilter: 'blur(20px)',
            border: `1px solid ${isDark ? squareColors.gray[700] : squareColors.gray[200]}`,
            borderRadius: 12, // Square design
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8, // Square buttons
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '0.95rem',
            padding: '12px 24px',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: isDark 
                ? `0 4px 12px ${alpha(squareColors.primary[500], 0.3)}`
                : `0 4px 12px ${alpha(squareColors.primary[600], 0.15)}`,
              transform: 'translateY(-1px)',
            },
            '&:active': {
              transform: 'translateY(0px)',
            },
            '@media (max-width: 768px)': {
              padding: '10px 20px',
              fontSize: '0.9rem',
            },
            '@media (max-width: 480px)': {
              padding: '8px 16px',
              fontSize: '0.85rem',
            },
          },
          contained: {
            background: isDark 
              ? `linear-gradient(135deg, ${squareColors.primary[600]}, ${squareColors.primary[700]})`
              : `linear-gradient(135deg, ${squareColors.primary[500]}, ${squareColors.primary[600]})`,
            color: '#ffffff',
            border: 'none',
            '&:hover': {
              background: isDark 
                ? `linear-gradient(135deg, ${squareColors.primary[500]}, ${squareColors.primary[600]})`
                : `linear-gradient(135deg, ${squareColors.primary[600]}, ${squareColors.primary[700]})`,
            },
          },
          outlined: {
            borderWidth: 2,
            borderColor: isDark ? squareColors.gray[600] : squareColors.gray[300],
            backgroundColor: isDark ? alpha(squareColors.gray[800], 0.5) : alpha(squareColors.gray[50], 0.8),
            color: isDark ? squareColors.gray[200] : squareColors.gray[700],
            '&:hover': {
              borderWidth: 2,
              borderColor: isDark ? squareColors.gray[400] : squareColors.gray[400],
              backgroundColor: isDark ? alpha(squareColors.gray[700], 0.8) : alpha(squareColors.gray[100], 0.9),
            },
          },
          text: {
            color: isDark ? squareColors.gray[300] : squareColors.gray[600],
            '&:hover': {
              backgroundColor: isDark ? alpha(squareColors.gray[700], 0.3) : alpha(squareColors.gray[100], 0.8),
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12, // Square design
            backgroundColor: isDark 
              ? alpha(squareColors.gray[800], 0.8)
              : alpha('#ffffff', 0.9),
            border: `1px solid ${isDark ? squareColors.gray[700] : squareColors.gray[200]}`,
            boxShadow: isDark 
              ? `0 8px 32px ${alpha('#000000', 0.3)}`
              : `0 8px 32px ${alpha(squareColors.gray[500], 0.1)}`,
            backdropFilter: 'blur(20px)',
            overflow: 'hidden',
            position: 'relative',
            '@media (max-width: 768px)': {
              borderRadius: 10,
            },
            '@media (max-width: 480px)': {
              borderRadius: 8,
              margin: '0 4px',
            },
          },
        },
      },
      MuiModal: {
        styleOverrides: {
          root: {
            zIndex: 1400, // Higher than navigation header (1000) and drawer (1200)
            // Extra z-index boost for mobile PWA
            '@media (max-width: 768px)': {
              zIndex: 1500,
            },
          },
        },
      },
      MuiBackdrop: {
        styleOverrides: {
          root: {
            zIndex: -1, // Behind the dialog content
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          root: {
            zIndex: 1400, // Higher than navigation header (1000) and drawer (1200)
            // Extra z-index boost for mobile PWA
            '@media (max-width: 768px)': {
              zIndex: 1500,
            },
          },
          paper: {
            position: 'relative',
            zIndex: 1, // Above the backdrop
            borderRadius: 28,
            backgroundColor: alpha('#0f1419', 0.9),
            backdropFilter: 'blur(40px) saturate(200%)',
            border: `1px solid ${alpha('#27272a', 0.3)}`,
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.8)',
            marginTop: '80px', // Move dialog below navigation header
            '@media (max-width: 768px)': {
              borderRadius: 20,
              margin: '80px 16px 16px 16px', // Top margin to clear nav header
              maxHeight: 'calc(100vh - 96px)', // Adjust height for top margin
              width: 'calc(100vw - 32px)',
            },
            '@media (max-width: 480px)': {
              borderRadius: 16,
              margin: '80px 8px 8px 8px', // Top margin to clear nav header
              maxHeight: 'calc(100vh - 88px)', // Adjust height for top margin
              width: 'calc(100vw - 16px)',
            },
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            position: 'relative',
            // No need for high z-index since dialog paper handles layering
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8, // More square for better iOS compatibility
              backgroundColor: isDark 
                ? alpha(squareColors.gray[800], 0.6)
                : alpha('#ffffff', 0.8),
              backdropFilter: 'blur(10px)',
              border: `1px solid ${isDark ? squareColors.gray[600] : squareColors.gray[300]}`,
              '@media (max-width: 768px)': {
                borderRadius: 6, // Even more square on mobile
                fontSize: '16px', // Prevents zoom on iOS
              },
              '@media (max-width: 480px)': {
                borderRadius: 4, // Very square for iOS input compatibility
                padding: '4px 8px',
              },
              '&.Mui-focused': {
                backgroundColor: isDark 
                  ? alpha(squareColors.gray[700], 0.8)
                  : alpha('#ffffff', 0.95),
                transform: 'translateY(-1px)',
                boxShadow: isDark 
                  ? `0 6px 20px ${alpha(squareColors.primary[500], 0.2)}`
                  : `0 6px 20px ${alpha(squareColors.primary[400], 0.15)}`,
                '@media (max-width: 768px)': {
                  transform: 'translateY(0px)',
                  boxShadow: isDark 
                    ? `0 3px 12px ${alpha(squareColors.primary[500], 0.25)}`
                    : `0 3px 12px ${alpha(squareColors.primary[400], 0.2)}`,
                },
              },
            },
            '& .MuiInputLabel-root': {
              '@media (max-width: 480px)': {
                fontSize: '0.9rem',
              },
            },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          root: {
            backgroundColor: alpha('#0f1419', 0.8),
            borderRadius: 20,
            padding: 6,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha('#27272a', 0.3)}`,
          },
          indicator: {
            height: '100%',
            borderRadius: 16,
            backgroundColor: alpha('#27272a', 0.5),
            backdropFilter: 'blur(10px)',
            boxShadow: 'none',
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            margin: '0 4px',
            transition: 'none',
            fontWeight: 500,
            textTransform: 'none',
            fontSize: '0.95rem',
            color: '#71717a',
            '&.Mui-selected': {
              color: '#a1a1aa',
              fontWeight: 600,
            },
            '&:hover': {
              color: '#71717a',
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${alpha('#27272a', 0.3)}`,
            padding: '16px',
            color: '#71717a',
          },
          head: {
            fontWeight: 600,
            backgroundColor: alpha('#0f1419', 0.5),
            color: '#a1a1aa',
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {},
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            transition: 'none',
            color: '#71717a',
            zIndex: 999, // Ensure close button (X) is below navigation header (1000)
            '&:hover': {
              backgroundColor: 'transparent',
              transform: 'none',
              color: '#71717a',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            backdropFilter: 'blur(10px)',
            backgroundColor: alpha('#0f1419', 0.8),
            border: `1px solid ${alpha('#27272a', 0.5)}`,
            fontWeight: 500,
            color: '#71717a',
          },
        },
      },
      MuiTypography: {
        styleOverrides: {
          root: {
            color: isDark ? squareColors.gray[200] : squareColors.gray[800],
          },
          h1: {
            color: isDark ? squareColors.gray[100] : squareColors.gray[900],
            fontWeight: 800,
          },
          h2: {
            color: isDark ? squareColors.gray[100] : squareColors.gray[900],
            fontWeight: 700,
          },
          h3: {
            color: isDark ? squareColors.gray[200] : squareColors.gray[800],
            fontWeight: 600,
          },
          h4: {
            color: isDark ? squareColors.gray[200] : squareColors.gray[800],
            fontWeight: 600,
          },
          h5: {
            color: isDark ? squareColors.gray[200] : squareColors.gray[800],
            fontWeight: 500,
          },
          h6: {
            color: isDark ? squareColors.gray[300] : squareColors.gray[700],
            fontWeight: 500,
          },
          body1: {
            color: isDark ? squareColors.gray[200] : squareColors.gray[800],
            fontWeight: 400,
          },
          body2: {
            color: isDark ? squareColors.gray[300] : squareColors.gray[600],
            fontWeight: 400,
          },
          caption: {
            color: isDark ? squareColors.gray[400] : squareColors.gray[500],
            fontWeight: 400,
          },
        },
      },
    },
  })
}

export const AppTheme: React.FC<AppThemeProps> = ({ children, mode: initialMode = 'system' }) => {
  const [mode, setMode] = React.useState<'light' | 'dark' | 'system'>(initialMode)
  const [currentMode, setCurrentMode] = React.useState<'light' | 'dark'>('dark')

  const toggleMode = React.useCallback(() => {
    setMode(prev => {
      if (prev === 'light') return 'dark'
      if (prev === 'dark') return 'system'
      return 'light'
    })
  }, [])

  React.useEffect(() => {
    if (mode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      setCurrentMode(mediaQuery.matches ? 'dark' : 'light')
      
      const handleChange = (e: MediaQueryListEvent) => {
        setCurrentMode(e.matches ? 'dark' : 'light')
      }
      
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    } else {
      setCurrentMode(mode)
    }
  }, [mode])

  const theme = React.useMemo(() => getSquareTheme(currentMode), [currentMode])

  const contextValue = React.useMemo(() => ({
    mode,
    setMode,
    toggleMode
  }), [mode, toggleMode])

  return (
    <ThemeContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  )
}

// Hook to use theme mode
export const useThemeMode = () => {
  const context = React.useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useThemeMode must be used within an AppTheme provider')
  }
  return context
}

export default AppTheme
