import { createTheme, alpha, Shadows } from '@mui/material/styles'

declare module '@mui/material/Paper' {
  interface PaperPropsVariantOverrides {
    highlighted: true
  }
}
declare module '@mui/material/styles/createPalette' {
  interface ColorRange {
    50: string
    100: string
    200: string
    300: string
    400: string
    500: string
    600: string
    700: string
    800: string
    900: string
  }

  // interface PaletteColor extends ColorRange {}

  interface Palette {
    baseShadow: string
  }
}

const defaultTheme = createTheme()

export const brand = {
  50: 'hsl(220, 41%, 95%)', // very light
  100: 'hsl(220, 41%, 90%)', // light
  200: 'hsl(220, 41%, 80%)', // lighter
  300: 'hsl(220, 41%, 65%)', // medium-light
  400: 'hsl(220, 41%, 48%)', // medium
  500: 'hsl(220, 41%, 35%)', // medium-dark
  600: 'hsl(220, 41%, 25%)', // darker
  700: 'hsl(220, 41%, 20%)', // very dark
  800: 'hsl(220, 41%, 16%)', // your main color rgb(24, 33, 57)
  900: 'hsl(220, 41%, 12%)', // darkest
}

export const gray = {
  50: 'hsl(220, 35%, 97%)',
  100: 'hsl(220, 30%, 94%)',
  200: 'hsl(220, 20%, 88%)',
  300: 'hsl(220, 20%, 80%)',
  400: 'hsl(220, 20%, 65%)',
  500: 'hsl(220, 20%, 42%)',
  600: 'hsl(220, 20%, 35%)',
  700: 'hsl(220, 20%, 25%)',
  800: 'hsl(220, 30%, 6%)',
  900: 'hsl(220, 35%, 3%)',
}

// export const green = {
//   50: 'hsl(120, 80%, 98%)',
//   100: 'hsl(120, 75%, 94%)',
//   200: 'hsl(120, 75%, 87%)',
//   300: 'hsl(120, 61%, 77%)',
//   400: 'hsl(120, 44%, 53%)',
//   500: 'hsl(120, 59%, 30%)',
//   600: 'hsl(120, 70%, 25%)',
//   700: 'hsl(120, 75%, 16%)',
//   800: 'hsl(120, 84%, 10%)',
//   900: 'hsl(120, 87%, 6%)',
// }
//
// export const orange = {
//   50: 'hsl(45, 100%, 97%)',
//   100: 'hsl(45, 92%, 90%)',
//   200: 'hsl(45, 94%, 80%)',
//   300: 'hsl(45, 90%, 65%)',
//   400: 'hsl(45, 90%, 40%)',
//   500: 'hsl(45, 90%, 35%)',
//   600: 'hsl(45, 91%, 25%)',
//   700: 'hsl(45, 94%, 20%)',
//   800: 'hsl(45, 95%, 16%)',
//   900: 'hsl(45, 93%, 12%)',
// }
//
// export const red = {
//   50: 'hsl(0, 100%, 97%)',
//   100: 'hsl(0, 92%, 90%)',
//   200: 'hsl(0, 94%, 80%)',
//   300: 'hsl(0, 90%, 65%)',
//   400: 'hsl(0, 90%, 40%)',
//   500: 'hsl(0, 90%, 30%)',
//   600: 'hsl(0, 91%, 25%)',
//   700: 'hsl(0, 94%, 18%)',
//   800: 'hsl(0, 95%, 12%)',
//   900: 'hsl(0, 93%, 6%)',
// }

// core design
const primary = {
  darker: 'rgb(18, 25, 43)', // darker version of rgb(24, 33, 57)
  main: 'rgb(24, 33, 57)', // your requested color
  lighter: 'rgb(36, 50, 86)', // lighter version
  subtle: 'rgb(224, 229, 242)', // very light version for subtle elements
}

const dark = {
  100: '#C7C9D9',
  200: '#8F90A6',
  300: '#555770',
  400: '#28293D',
  500: '#1C1C28',
}

const light = {
  100: '#FFFFFF',
  200: '#FAFAFC',
  300: '#F2F2F5',
  400: '#EBEBF0',
  500: '#E4E4EB',
}

const red = {
  100: '#FFE5E5',
  200: '#FF8080',
  300: '#FF5C5C',
  400: '#FF3B3B',
  500: '#E53535',
}

const green = {
  100: '#E3FFF1',
  200: '#57EBA1',
  300: '#39D98A',
  400: '#06C270',
  500: '#05A660',
}

const blue = {
  100: '#E5F0FF',
  200: '#9DBFF9',
  300: '#5B8DEF',
  400: '#0063F7',
  500: '#004FC4',
}

export const yellow = {
  100: '#FFFEE5',
  200: '#FDED72',
  300: '#FDDD48',
  400: '#FFCC00',
  500: '#E5B800',
}

const orange = {
  100: '#FFF8E5',
  200: '#FCCC75',
  300: '#FDAC42',
  400: '#FF8800',
  500: '#E57A00',
}

export const teal = {
  100: '#E5FFFF',
  200: '#A9EFF2',
  300: '#73DFE7',
  400: '#00CFDE',
  500: '#00B7C4',
}

export const purple = {
  100: '#FFE5FF',
  200: '#DDA5E9',
  300: '#AC5DD9',
  400: '#6600CC',
  500: '#4D0099',
}

export const colorSchemes = {
  light: {
    palette: {
      primary: {
        light: primary.lighter,
        main: primary.main,
        dark: primary.darker,
        contrastText: primary.subtle,
      },
      info: {
        light: brand[100],
        main: blue[300],
        dark: brand[500],
        contrastText: gray[50],
      },
      warning: {
        light: orange[200],
        main: orange[300],
        dark: orange[500],
      },
      error: {
        light: red[200],
        main: red[300],
        dark: red[500],
      },
      success: {
        light: green[200],
        main: green[300],
        dark: green[500],
      },
      grey: {
        ...gray,
      },
      divider: alpha(gray[300], 0.4),
      background: {
        default: '#f7f7fa',
        paper: light[100],
      },
      text: {
        primary: dark[400],
        secondary: dark[300],
        warning: orange[300],
      },
      action: {
        hover: alpha(gray[200], 0.2),
        selected: `${alpha(gray[200], 0.3)}`,
      },
      baseShadow:
        'hsla(220, 30%, 5%, 0.07) 0px 4px 16px 0px, hsla(220, 25%, 10%, 0.07) 0px 8px 16px -5px',
    },
  },
  dark: {
    palette: {
      primary: {
        light: primary.lighter,
        main: primary.main,
        dark: primary.darker,
        contrastText: primary.subtle,
      },
      info: {
        light: brand[100],
        main: blue[300],
        dark: brand[500],
        contrastText: gray[50],
      },
      warning: {
        light: orange[200],
        main: orange[300],
        dark: orange[500],
      },
      error: {
        light: red[200],
        main: red[300],
        dark: red[500],
      },
      success: {
        light: green[200],
        main: green[300],
        dark: green[500],
      },
      grey: {
        ...gray,
      },
      divider: alpha(gray[700], 0.6),
      background: {
        default: dark[500],
        paper: dark[400],
      },
      text: {
        primary: light[200],
        secondary: dark[200],
      },
      action: {
        hover: alpha(gray[600], 0.2),
        selected: alpha(gray[600], 0.3),
      },
      baseShadow:
        'hsla(220, 30%, 5%, 0.7) 0px 4px 16px 0px, hsla(220, 25%, 10%, 0.8) 0px 8px 16px -5px',
    },
  },
}

export const typography = {
  fontFamily: 'Inter, sans-serif',
  h1: {
    fontSize: defaultTheme.typography.pxToRem(40),
    fontWeight: 600,
    lineHeight: defaultTheme.typography.pxToRem(54),
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: defaultTheme.typography.pxToRem(32),
    fontWeight: 600,
    lineHeight: defaultTheme.typography.pxToRem(44),
  },
  h3: {
    fontSize: defaultTheme.typography.pxToRem(28),
    lineHeight: defaultTheme.typography.pxToRem(38),
  },
  h4: {
    fontSize: defaultTheme.typography.pxToRem(24),
    fontWeight: 600,
    lineHeight: defaultTheme.typography.pxToRem(32),
  },
  h5: {
    fontSize: defaultTheme.typography.pxToRem(20),
    fontWeight: 600,
    lineHeight: defaultTheme.typography.pxToRem(28),
  },
  h6: {
    fontSize: defaultTheme.typography.pxToRem(16),
    fontWeight: 600,
    lineHeight: defaultTheme.typography.pxToRem(22),
  },
  subtitle1: {
    fontSize: defaultTheme.typography.pxToRem(18),
  },
  subtitle2: {
    fontSize: defaultTheme.typography.pxToRem(14),
    fontWeight: 500,
  },
  body1: {
    fontSize: defaultTheme.typography.pxToRem(14),
  },
  body2: {
    fontSize: defaultTheme.typography.pxToRem(14),
    fontWeight: 400,
  },
  caption: {
    fontSize: defaultTheme.typography.pxToRem(12),
    fontWeight: 400,
  },
}

export const shape = {
  borderRadius: 4,
}

// @ts-expect-error: force
const defaultShadows: Shadows = [
  'none',
  'var(--template-palette-baseShadow)',
  ...defaultTheme.shadows.slice(2),
]
export const shadows = defaultShadows
