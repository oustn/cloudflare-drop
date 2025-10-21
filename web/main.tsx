import { render } from 'preact'
import { LocationProvider, ErrorBoundary, Router, Route } from 'preact-iso'
import { StyledEngineProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { DialogsProvider } from '@toolpad/core/useDialogs'

import AppTheme from './theme/AppTheme'
import { Home, Admin } from './views'
import { LanguageProvider } from './helpers/i18n'

import './index.css'

function NotFound() {
  return <div>Not Found</div>
}

function Main() {
  return (
    <LocationProvider>
      <ErrorBoundary>
        <LanguageProvider>
          <StyledEngineProvider injectFirst>
            <AppTheme>
              <CssBaseline enableColorScheme />
              <DialogsProvider>
                <Router>
                  <Route component={Home} path="/" />
                  <Route component={Admin} path="/admin" />
                  <Route component={NotFound} default />
                </Router>
              </DialogsProvider>
            </AppTheme>
          </StyledEngineProvider>
        </LanguageProvider>
      </ErrorBoundary>
    </LocationProvider>
  )
}

render(<Main />, document.getElementById('app')!)

// Enhanced Service Worker registration with iOS support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', {
        scope: '/',
      })
      .then((registration) => {
        console.log(
          'Service Worker registered successfully:',
          registration.scope,
        )

        // iOS-specific: Force update check
        registration.update()

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                // New content is available, show update notification
                if (confirm('New version available. Refresh to update?')) {
                  // Send message to skip waiting
                  newWorker.postMessage({ type: 'SKIP_WAITING' })
                  window.location.reload()
                }
              }
            })
          }
        })

        // Handle service worker messages
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'SW_UPDATED') {
            window.location.reload()
          }
        })
      })
      .catch((error) => {
        console.log('Service Worker registration failed:', error)
      })
  })
}

// iOS-specific PWA detection and handling
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
const isStandalone =
  'standalone' in navigator &&
  (navigator as Navigator & { standalone?: boolean }).standalone
const isInWebAppiOS = isIOS && isStandalone

// Enhanced app install prompt handling
let deferredPrompt: BeforeInstallPromptEvent | null = null
let installPromptShown = false

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault()
  // Stash the event so it can be triggered later
  deferredPrompt = e as BeforeInstallPromptEvent
  installPromptShown = false
  console.log('App can be installed (Android/Chrome)')
})

// iOS-specific install guidance
if (isIOS && !isInWebAppiOS && !installPromptShown) {
  // Show iOS install instructions after a delay
  setTimeout(() => {
    const showIOSInstallTip =
      localStorage.getItem('iosInstallTipShown') !== 'true'
    if (showIOSInstallTip) {
      console.log('iOS detected - PWA can be installed via Safari Share menu')
      // You can show a custom iOS install banner here
      localStorage.setItem('iosInstallTipShown', 'true')
    }
  }, 3000)
}

// Handle app installed event
window.addEventListener('appinstalled', () => {
  console.log('PWA was installed successfully')
  deferredPrompt = null
  installPromptShown = true
})

// iOS-specific viewport handling for PWA
if (isInWebAppiOS) {
  // Handle iOS PWA viewport issues
  const viewport = document.querySelector('meta[name=viewport]')
  if (viewport) {
    viewport.setAttribute(
      'content',
      'width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, viewport-fit=cover, user-scalable=no',
    )
  }

  // Add iOS PWA class for specific styling
  document.body.classList.add('ios-pwa')
}

// Optional: Add install button functionality
export function showInstallPrompt() {
  if (deferredPrompt) {
    deferredPrompt.prompt()
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt')
      } else {
        console.log('User dismissed the install prompt')
      }
      deferredPrompt = null
    })
  }
}
