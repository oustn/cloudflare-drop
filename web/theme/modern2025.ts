import { createTheme, alpha } from '@mui/material/styles'

declare module '@mui/material/styles' {
  interface Theme {
    status: {
      danger: string
    }
  }

  interface ThemeOptions {
    status?: {
      danger?: string
    }
  }

  interface Palette {
    surface: {
      main: string
    }
  }

  interface PaletteOptions {
    surface?: {
      main?: string
    }
  }
}

// Modern 2025 color palette
const modernColors = {
  primary: {
    50: '#f8f9fb', // very light version of your color
    100: '#f1f3f7', // light
    200: '#e4e7ef', // lighter
    300: '#cdd2df', // medium-light
    400: '#a8b1c7', // medium
    500: '#6b7591', // medium-dark
    600: '#4a5573', // darker
    700: '#36435e', // very dark
    800: '#182139', // your main color rgb(24, 33, 57)
    900: '#0f1724', // darkest
  },
  secondary: {
    50: '#fdf2f8',
    100: '#fce7f3',
    200: '#fbcfe8',
    300: '#f9a8d4',
    400: '#f472b6',
    500: '#ec4899',
    600: '#db2777',
    700: '#be185d',
    800: '#9d174d',
    900: '#831843',
  },
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
}

export const getModern2025Theme = (mode: 'light' | 'dark') => {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: modernColors.primary[600],
        light: modernColors.primary[400],
        dark: modernColors.primary[800],
        contrastText: '#ffffff',
      },
      secondary: {
        main: modernColors.secondary[600],
        light: modernColors.secondary[400],
        dark: modernColors.secondary[800],
        contrastText: '#ffffff',
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
        default: mode === 'light' ? '#f8fafc' : '#0f172a',
        paper: mode === 'light' ? alpha('#ffffff', 0.9) : alpha('#1e293b', 0.9),
      },
      surface: {
        main: mode === 'light' ? alpha('#ffffff', 0.7) : alpha('#374151', 0.7),
      },
      text: {
        primary:
          mode === 'light'
            ? modernColors.neutral[900]
            : modernColors.neutral[50],
        secondary:
          mode === 'light'
            ? modernColors.neutral[600]
            : modernColors.neutral[300],
      },
      divider:
        mode === 'light'
          ? alpha(modernColors.neutral[200], 0.5)
          : alpha(modernColors.neutral[700], 0.5),
    },
    typography: {
      fontFamily:
        '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      h1: {
        fontSize: '3.5rem',
        fontWeight: 800,
        lineHeight: 1.1,
        letterSpacing: '-0.025em',
        background:
          mode === 'light'
            ? 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)'
            : 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
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
      borderRadius: 20,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: {
            scrollBehavior: 'smooth',
          },
          body: {
            background:
              mode === 'light'
                ? 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)'
                : 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f1729 100%)',
            minHeight: '100vh',
            backgroundAttachment: 'fixed',
            fontSmooth: 'always',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
          },
          '*': {
            '&::-webkit-scrollbar': {
              width: 8,
              height: 8,
            },
            '&::-webkit-scrollbar-track': {
              background: alpha(modernColors.neutral[200], 0.1),
              borderRadius: 8,
            },
            '&::-webkit-scrollbar-thumb': {
              background: alpha(modernColors.neutral[400], 0.3),
              borderRadius: 8,
              '&:hover': {
                background: alpha(modernColors.neutral[400], 0.5),
              },
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: alpha('#ffffff', mode === 'light' ? 0.85 : 0.1),
            backdropFilter: 'blur(20px) saturate(180%)',
            border: `1px solid ${alpha('#ffffff', mode === 'light' ? 0.2 : 0.1)}`,
            borderRadius: 20,
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              backgroundColor: alpha('#ffffff', mode === 'light' ? 0.9 : 0.15),
              transform: 'translateY(-4px) scale(1.02)',
              boxShadow:
                mode === 'light'
                  ? '0 25px 50px rgba(24, 33, 57, 0.15), 0 15px 35px rgba(24, 33, 57, 0.1)'
                  : '0 25px 50px rgba(0, 0, 0, 0.4), 0 15px 35px rgba(0, 0, 0, 0.3)',
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.95rem',
            padding: '14px 28px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background:
                'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
              transition: 'left 0.5s',
            },
            '&:hover': {
              transform: 'translateY(-2px)',
              '&::before': {
                left: '100%',
              },
            },
          },
          contained: {
            background:
              'linear-gradient(135deg, rgb(24, 33, 57) 0%, rgb(18, 25, 43) 100%)',
            boxShadow: '0 8px 32px rgba(24, 33, 57, 0.25)',
            border: 'none',
            '&:hover': {
              background:
                'linear-gradient(135deg, rgb(36, 50, 86) 0%, rgb(18, 25, 43) 100%)',
              boxShadow: '0 12px 40px rgba(24, 33, 57, 0.35)',
            },
            '&:active': {
              transform: 'translateY(0px)',
            },
          },
          outlined: {
            borderWidth: 2,
            backgroundColor: alpha('#ffffff', 0.1),
            backdropFilter: 'blur(10px)',
            borderColor: alpha('#ffffff', 0.2),
            '&:hover': {
              borderWidth: 2,
              backgroundColor: alpha('#ffffff', 0.2),
              borderColor: alpha('#ffffff', 0.3),
            },
          },
          text: {
            '&:hover': {
              backgroundColor: alpha('#ffffff', 0.1),
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 24,
            backgroundColor: alpha('#ffffff', mode === 'light' ? 0.9 : 0.1),
            backdropFilter: 'blur(20px) saturate(180%)',
            border: `1px solid ${alpha('#ffffff', mode === 'light' ? 0.3 : 0.1)}`,
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '1px',
              background:
                'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
            },
            '&:hover': {
              transform: 'translateY(-6px) rotate(1deg)',
              boxShadow:
                mode === 'light'
                  ? '0 30px 60px rgba(24, 33, 57, 0.15)'
                  : '0 30px 60px rgba(0, 0, 0, 0.4)',
            },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 28,
            backgroundColor: alpha('#ffffff', mode === 'light' ? 0.95 : 0.15),
            backdropFilter: 'blur(40px) saturate(200%)',
            border: `1px solid ${alpha('#ffffff', mode === 'light' ? 0.3 : 0.1)}`,
            boxShadow:
              mode === 'light'
                ? '0 25px 50px rgba(0, 0, 0, 0.1)'
                : '0 25px 50px rgba(0, 0, 0, 0.5)',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 16,
              backgroundColor: alpha('#ffffff', mode === 'light' ? 0.8 : 0.1),
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: alpha(
                  '#ffffff',
                  mode === 'light' ? 0.9 : 0.15,
                ),
                transform: 'translateY(-1px)',
              },
              '&.Mui-focused': {
                backgroundColor: alpha(
                  '#ffffff',
                  mode === 'light' ? 0.95 : 0.2,
                ),
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(24, 33, 57, 0.15)',
              },
            },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          root: {
            backgroundColor: alpha('#ffffff', 0.1),
            borderRadius: 20,
            padding: 6,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha('#ffffff', 0.1)}`,
          },
          indicator: {
            height: '100%',
            borderRadius: 16,
            backgroundColor: alpha('#ffffff', 0.2),
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 20px rgba(24, 33, 57, 0.2)',
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            margin: '0 4px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            fontWeight: 500,
            textTransform: 'none',
            fontSize: '0.95rem',
            '&.Mui-selected': {
              color: '#ffffff',
              fontWeight: 600,
            },
            '&:hover': {
              backgroundColor: alpha('#ffffff', 0.1),
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${alpha(modernColors.neutral[200], 0.1)}`,
            padding: '16px',
          },
          head: {
            fontWeight: 600,
            backgroundColor: alpha('#ffffff', 0.05),
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: alpha('#ffffff', mode === 'light' ? 0.05 : 0.02),
              transform: 'scale(1.01)',
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              backgroundColor: alpha('#ffffff', 0.1),
              transform: 'scale(1.1)',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            backdropFilter: 'blur(10px)',
            backgroundColor: alpha('#ffffff', 0.15),
            border: `1px solid ${alpha('#ffffff', 0.2)}`,
            fontWeight: 500,
          },
        },
      },
    },
  })
}

export default getModern2025Theme
