import { useState, useEffect } from 'preact/hooks'
import Button from '@mui/material/Button'
import InstallMobileIcon from '@mui/icons-material/InstallMobile'
import { useLanguage } from '../helpers'

interface InstallPromptProps {
  className?: string
}

export function InstallPrompt({ className }: InstallPromptProps) {
  const { t } = useLanguage()
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstall, setShowInstall] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault()
      // Stash the event so it can be triggered later
      setDeferredPrompt(e)
      setShowInstall(true)
    }

    const handleAppInstalled = () => {
      console.log('PWA was installed')
      setShowInstall(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    // Show the install prompt
    deferredPrompt.prompt()
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    } else {
      console.log('User dismissed the install prompt')
    }
    
    // Clear the deferredPrompt
    setDeferredPrompt(null)
    setShowInstall(false)
  }

  if (!showInstall) {
    return null
  }

  return (
    <Button
      variant="outlined"
      startIcon={<InstallMobileIcon />}
      onClick={handleInstallClick}
      className={className}
      sx={{
        position: 'fixed',
        bottom: 80,
        right: 24,
        zIndex: 1000,
        '@media (max-width: 480px)': {
          bottom: 120,
          right: 16,
        },
      }}
    >
      {t('pwa.install')}
    </Button>
  )
}
