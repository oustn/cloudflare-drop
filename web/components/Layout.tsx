import { ComponentChildren, cloneElement, isValidElement } from 'preact'
import { useState } from 'preact/hooks'
import Container from '@mui/material/Container'
import Link from '@mui/material/Link'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Backdrop from '@mui/material/Backdrop'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'

import { Message, useMessage, Github } from './'
import { LanguageSwitch } from '../i18n'

export interface LayoutProps {
  children?: ComponentChildren
  setBackdropOpen?: (open: boolean) => void
  message?: { error(message: string): void; success(message: string): void }
}

export function Layout({ children }: LayoutProps) {
  const [messageProps, message] = useMessage()

  const [backdropOpen, setBackdropOpen] = useState(false)

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
        p: 2,
      }}
    >
      <div
        class="flex flex-col mr-auto ml-auto"
        style="max-height: calc(100vh - 32px)"
      >
        <Box className="flex justify-between items-center gap-3" sx={{ p: 0 }}>
          <Link
            href="/"
            className="flex flex-row items-center gap-2 no-underline"
          >
            <Box
              component="img"
              className="block"
              src="/logo.png"
              alt="brand"
              sx={{
                height: '80px',
                position: 'relative',
                top: '10px',
                width: 'auto',
              }}
            />
            <Typography
              variant="h4"
              color="primary"
              sx={{
                fontFamily: 'DingDing',
                lineHeight: 1,
              }}
            >
              Cloudflare Drop
            </Typography>
          </Link>
          <Box className="flex items-center gap-2">
            <LanguageSwitch />
            <IconButton
              href="https://github.com/oustn/cloudflare-drop"
              target="_blank"
            >
              <Github />
            </IconButton>
          </Box>
        </Box>
        {injectedChildren}
      </div>
      <Message {...messageProps} />
      <Backdrop
        sx={(theme) => ({ color: '#fff', zIndex: theme.zIndex.drawer + 1 })}
        open={backdropOpen}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </Container>
  )
}
