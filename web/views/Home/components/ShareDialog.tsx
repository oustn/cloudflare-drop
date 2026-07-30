import { DialogProps } from '@toolpad/core/useDialogs'
import Box from '@mui/material/Box'
// import DialogActions from '@mui/material/DialogActions'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { observer } from 'mobx-react-lite'

import { copyToClipboard } from '../../../common.ts'
import { BasicDialog } from './BasicDialog.tsx'
import Typography from '@mui/material/Typography'

import { Code } from './index.tsx'
import { useTranslation } from '../../../i18n'
import { ShareQrCopyPanel } from './ShareQrCopyPanel.tsx'

dayjs.extend(relativeTime)

export const ShareDialog = observer(function ShareDialog({
  open,
  onClose,
  payload,
}: DialogProps<
  FileUploadedType & {
    message: {
      error(message: string): void
      success(message: string): void
    }
  }
>) {
  const i18n = useTranslation()
  const url = `${window.location.protocol}//${window.location.host}?code=${payload.code}`
  const handleCopy = (str: string) => {
    copyToClipboard(str)
      .then(() => {
        payload.message.success(i18n.t('common.copySuccess'))
      })
      .catch(() => {
        payload.message.error(i18n.t('common.copyFailed'))
      })
  }

  return (
    <BasicDialog open={open} onClose={onClose} title={i18n.t('common.share')}>
      <Box>
        <Box
          className="relative"
          sx={{
            '&::after': {
              display: 'block',
              position: 'absolute',
              content: '" "',
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
            },
          }}
          onClick={() => handleCopy(payload.code)}
        >
          <Code disabled length={6} value={payload.code} />
        </Box>
        <ShareQrCopyPanel shareUrl={url} message={payload.message} />

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="textDisabled">
            {i18n.t('common.originalHashLabel')}{' '}
            <a target="_blank" href="https://www.lzltool.com/data-hash">
              ({i18n.t('common.verifyTool')})
            </a>
            {'：'}
          </Typography>
          <Typography
            className="mt-1"
            variant="body2"
            onClick={() => handleCopy(payload.hash)}
            sx={{
              wordBreak: 'break-all',
            }}
          >
            {payload.hash}
          </Typography>
          {}
          <Typography className="mt-1" variant="body2" color="textDisabled">
            {payload.due_date
              ? i18n.t('common.expiryEstimate')
              : i18n.t('common.permanent')}
          </Typography>
          {payload.due_date && (
            <Typography className="mt-1" variant="body2">
              {dayjs(payload.due_date).fromNow()}
            </Typography>
          )}
        </Box>
      </Box>
    </BasicDialog>
  )
})
