import { ComponentChildren, cloneElement, isValidElement } from 'preact'
import { useState } from 'preact/hooks'
import Container from '@mui/material/Container'
import Link from '@mui/material/Link'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Backdrop from '@mui/material/Backdrop'
import CircularProgress from '@mui/material/CircularProgress'
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import { alpha } from '@mui/material/styles'

import { Message, useMessage, LanguageSelector, InstallPrompt, ThemeModeToggle } from './'
import { useLanguage } from '../helpers'
import { History } from '../views/Home/components'

export interface LayoutProps {
  children?: ComponentChildren
  setBackdropOpen?: (open: boolean) => void
  message?: { error(message: string): void; success(message: string): void }
}

export function Layout({ children }: LayoutProps) {
  const [messageProps, message] = useMessage()
  const { t } = useLanguage()

  const [backdropOpen, setBackdropOpen] = useState(false)
  const [drawerOpened, updateDrawerOpened] = useState(false)

  const toggleDrawer = (newOpen: boolean) => () => {
    updateDrawerOpened(newOpen)
  }

  const injectedChildren = Array.isArray(children)
    ? children.map((child) =>
        isValidElement(child)
          ? cloneElement(child, { setBackdropOpen, message })
          : child,
      )
    : isValidElement(children)
      ? cloneElement(children, { setBackdropOpen, message })
      : children

  return (
    <Container
      className="ml-auto mr-auto"
      sx={{
        maxWidth: `1200px !important`,
        p: 1,
        '@media (max-width: 768px)': {
          p: 0.5,
        },
        '@media (max-width: 480px)': {
          p: 0.25,
        },
      }}
    >
      <Box
        className="flex flex-col mr-auto ml-auto"
        sx={{
          paddingTop: { xs: '100px', sm: '80px' }, // Add space for fixed header
        }}
      >
        <Box 
          className="flex justify-between items-center" 
          sx={(theme) => ({ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(0, 0, 0, 0.3)' 
              : 'rgba(255, 255, 255, 0.9)',
            borderBottom: theme.palette.mode === 'dark'
              ? '1px solid rgba(255, 255, 255, 0.1)'
              : '1px solid rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(20px)',
            p: 1,
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 1, sm: 0 },
          })}
        >
          <Link 
            href="/" 
            className="flex flex-row no-underline"
            sx={{
              alignItems: 'center',
              '@media (max-width: 480px)': {
                flexDirection: 'column',
                textAlign: 'center',
              },
            }}
          >
            <img 
              src="/logo.png" 
              alt="brand" 
              height="48"
              style={{
                height: '48px',
              }}
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <Typography
                variant="h5"
                color="primary"
                sx={{
                  fontFamily: 'DingDing',
                  '@media (max-width: 768px)': {
                    fontSize: '1.5rem',
                  },
                  '@media (max-width: 480px)': {
                    fontSize: '1.25rem',
                    marginTop: 0.5,
                  },
                }}
              >
                <span 
                  class="relative" 
                  style={{
                    top: '8px',
                  }}
                >
                  Cloudflare Drop
                </span>
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: 400,
                  '@media (max-width: 768px)': {
                    fontSize: '0.7rem',
                  },
                  '@media (max-width: 480px)': {
                    fontSize: '0.65rem',
                    display: 'none', // Hide on very small screens
                  },
                }}
              >
                {t('header.subtitle')}
              </Typography>
            </Box>
          </Link>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              '@media (max-width: 480px)': {
                marginTop: 1,
              },
            }}
          >
            <Button
              variant="text"
              onClick={toggleDrawer(true)}
              startIcon={<ReceiptLongIcon />}
              size="small"
              sx={{
                fontSize: '0.85rem',
                minWidth: 'auto',
                padding: '6px 12px',
                '@media (max-width: 480px)': {
                  fontSize: '0.8rem',
                  padding: '4px 8px',
                },
              }}
            >
              {t('home.settings.history')}
            </Button>
            <ThemeModeToggle />
            <LanguageSelector />
          </Box>
        </Box>
        {injectedChildren}
      </Box>
      <Message {...messageProps} />
      <InstallPrompt />
      <Drawer
        open={drawerOpened}
        onClose={toggleDrawer(false)}
        anchor="right"
        PaperProps={{
          sx: {
            background: alpha('#183951', 0.2),
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha('#ffffff', 0.1)}`,
            '@media (max-width: 768px)': {
              width: '85vw',
              maxWidth: '400px',
            },
            '@media (max-width: 480px)': {
              width: '90vw',
              maxWidth: 'none',
            },
          },
        }}
      >
        <History
          onItemClick={(share) => {
            updateDrawerOpened(false)
            // Dispatch a custom event to notify the home component
            if (share && share.code) {
              const event = new CustomEvent('historyCodeSelected', { 
                detail: { code: share.code } 
              })
              window.dispatchEvent(event)
            }
          }}
        />
      </Drawer>
      <Backdrop
        sx={(theme) => ({ color: '#fff', zIndex: theme.zIndex.drawer + 1 })}
        open={backdropOpen}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </Container>
  )
}
