import { useMemo } from 'preact/hooks'
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import QrCode from 'qrcode-svg'

import { copyToClipboard } from '../../../common.ts'
import { useTranslation } from '../../../i18n'

interface ShareQrCopyPanelProps {
  shareUrl: string
  message: {
    error(message: string): void
    success(message: string): void
  }
}

export function ShareQrCopyPanel(props: ShareQrCopyPanelProps) {
  const { shareUrl, message } = props
  const i18n = useTranslation()
  const qr = useMemo(
    () =>
      new QrCode({
        content: shareUrl,
        padding: 1,
        width: 200,
        height: 200,
      }).svg(),
    [shareUrl],
  )

  const handleCopy = () => {
    copyToClipboard(shareUrl)
      .then(() => {
        message.success(i18n.t('common.copySuccess'))
      })
      .catch(() => {
        message.error(i18n.t('common.copyFailed'))
      })
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleCopy()
    }
  }

  return (
    <>
      <Box
        sx={{ mt: 2 }}
        className="flex justify-center"
        dangerouslySetInnerHTML={{ __html: qr }}
      />
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          mb: 2,
          mt: 1,
        }}
      >
        <Box
          aria-label={i18n.t('common.copy')}
          role="button"
          tabIndex={0}
          title={i18n.t('common.copy')}
          onClick={handleCopy}
          onKeyDown={handleKeyDown}
          sx={{
            alignItems: 'center',
            color: '-webkit-link',
            cursor: 'pointer',
            display: 'flex',
            gap: 0.75,
            maxWidth: '100%',
            minWidth: 0,
            outline: 'none',
            '&:focus-visible': {
              textDecoration: 'underline',
            },
          }}
        >
          <Typography
            component="p"
            variant="body2"
            sx={{
              color: 'inherit',
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {shareUrl}
          </Typography>
          <ContentCopyOutlinedIcon sx={{ flexShrink: 0, fontSize: 18 }} />
        </Box>
      </Box>
    </>
  )
}
