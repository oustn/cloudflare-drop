import { ComponentChildren } from 'preact'
import { forwardRef, ReactElement, Ref } from 'preact/compat'
import { DialogProps } from '@toolpad/core/useDialogs'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import Slide from '@mui/material/Slide'
import { TransitionProps } from '@mui/material/transitions'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'

const Transition = forwardRef(function Transition(
  props: TransitionProps & {
    children: ReactElement<unknown>
  },
  ref: Ref<unknown>,
) {
  // @ts-expect-error preact type
  return <Slide direction="up" ref={ref} {...props} />
})

export type BasicDialogProps = Omit<DialogProps, 'payload'> & {
  title?: string
  children: ComponentChildren
}

export function BasicDialog({
  open,
  onClose,
  title,
  children,
}: BasicDialogProps) {
  const handleClose = async (_e: unknown, reason?: string) => {
    if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
      return
    }
    await onClose()
  }

  return (
    <Dialog
      fullScreen
      fullWidth
      open={open}
      onClose={handleClose}
      TransitionComponent={Transition}
    >
      <DialogTitle>{title}</DialogTitle>
      <IconButton
        aria-label="close"
        onClick={handleClose}
        sx={(theme) => ({
          position: 'absolute',
          right: 8,
          top: 8,
          color: theme.palette.grey[500],
        })}
      >
        <CloseIcon />
      </IconButton>
      <DialogContent
        className="w-full"
        sx={{
          margin: 'auto',
          maxWidth: 600,
        }}
      >
        {children}
      </DialogContent>
    </Dialog>
  )
}
