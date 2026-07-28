import { render } from 'preact'
import {
  LocationProvider,
  lazy,
  ErrorBoundary,
  Router,
  Route,
} from 'preact-iso'
import { StyledEngineProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { DialogsProvider } from '@toolpad/core/useDialogs'

import AppTheme from './theme/AppTheme'

import './index.css'

const Home = lazy(() => import('./views/Home').then((module) => module.Home))
const Admin = lazy(() => import('./views/Admin').then((module) => module.Admin))

function NotFound() {
  return <div>Not Found</div>
}

function Main() {
  return (
    <LocationProvider>
      <ErrorBoundary>
        <StyledEngineProvider injectFirst>
          <AppTheme>
            <CssBaseline enableColorScheme />
            <DialogsProvider>
              <Router>
                <Route component={Home} path="/" />
                <Route component={Admin} path="/admin/:token" />
                <Route component={NotFound} default />
              </Router>
            </DialogsProvider>
          </AppTheme>
        </StyledEngineProvider>
      </ErrorBoundary>
    </LocationProvider>
  )
}

render(<Main />, document.getElementById('app')!)
