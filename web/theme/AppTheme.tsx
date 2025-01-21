import { ThemeProvider, createTheme } from '@mui/material/styles'
import type { ThemeOptions } from '@mui/material/styles'
import { colorSchemes, typography, shadows, shape } from './themePrimitives.ts'

import { inputsCustomizations } from './customizations'

interface AppThemeProps {
  children: React.ReactNode
  /**
   * This is for the docs site. You can ignore it or remove it.
   */
  mode?: 'light' | 'dark' | 'system'
  themeComponents?: ThemeOptions['components']
}

export default function AppTheme({ children, mode }: AppThemeProps) {
  const theme = createTheme({
    // For more details about CSS variables configuration, see https://mui.com/material-ui/customization/css-theme-variables/configuration/
    cssVariables: true,
    colorSchemes, // Recently added in v6 for building light & dark mode app, see https://mui.com/material-ui/customization/palette/#color-schemes
    typography,
    shadows,
    shape,
    components: {
      ...inputsCustomizations,
    },
  })
  return (
    <ThemeProvider theme={theme} disableTransitionOnChange noSsr defaultMode={mode}>
      {children}
    </ThemeProvider>
  )
}
