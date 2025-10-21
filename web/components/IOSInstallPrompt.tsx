import { useState, useEffect } from 'preact/hooks'
import { useLanguage } from '../helpers'

export function IOSInstallPrompt() {
  const { t } = useLanguage()
  const [showBanner, setShowBanner] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Detect iOS device
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isStandalone =
      'standalone' in navigator &&
      (navigator as Navigator & { standalone?: boolean }).standalone
    const isInWebAppiOS = iOS && isStandalone

    setIsIOS(iOS)

    // Show banner only on iOS Safari (not in PWA mode)
    if (iOS && !isInWebAppiOS) {
      const bannerShown = localStorage.getItem('iosInstallBannerShown')
      if (!bannerShown) {
        // Show banner after 3 seconds
        setTimeout(() => {
          setShowBanner(true)
        }, 3000)
      }
    }
  }, [])

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem('iosInstallBannerShown', 'true')
  }

  const handleInstallGuide = () => {
    // Open a simple alert with install instructions for now
    alert(t('pwa.iosInstallInstructions'))
  }

  if (!isIOS || !showBanner) {
    return null
  }

  return (
    <div
      className="ios-install-banner"
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        right: '20px',
        background: 'linear-gradient(135deg, rgb(24, 33, 57), rgb(18, 25, 43))',
        color: 'white',
        padding: '16px',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(24, 33, 57, 0.3)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        zIndex: 1000,
        maxWidth: '400px',
        margin: '0 auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '12px',
          fontSize: '14px',
          fontWeight: '500',
        }}
      >
        <span
          className="emoji"
          style={{ fontSize: '20px', marginRight: '8px' }}
        >
          📱
        </span>
        {t('pwa.installPrompt')}
      </div>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button
          onClick={handleInstallGuide}
          style={{
            background: 'rgba(255, 255, 255, 0.9)',
            color: '#1976d2',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}
        >
          {t('pwa.howToInstall')}
        </button>
        <button
          onClick={handleDismiss}
          style={{
            background: 'transparent',
            color: 'white',
            border: '1.5px solid rgba(255, 255, 255, 0.6)',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          {t('common.close')}
        </button>
      </div>
    </div>
  )
}
