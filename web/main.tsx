import { render } from 'preact'
import { StyledEngineProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { DialogsProvider } from '@toolpad/core/useDialogs'

import AppTheme from './theme/AppTheme'
import { App } from './App'

import './index.css'

function Main() {
  return (
    <StyledEngineProvider injectFirst>
      <AppTheme>
        <CssBaseline enableColorScheme />
        <DialogsProvider>
          <App />
        </DialogsProvider>
      </AppTheme>
    </StyledEngineProvider>
  )
}

render(<Main />, document.getElementById('app')!)
