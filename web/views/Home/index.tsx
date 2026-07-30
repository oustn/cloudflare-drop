import { useState, useRef } from 'preact/hooks'
import { observer } from 'mobx-react-lite'
import { useDialogs } from '@toolpad/core/useDialogs'
import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Box from '@mui/material/Box'
import InputLabel from '@mui/material/InputLabel'
import Typography from '@mui/material/Typography'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import Tab from '@mui/material/Tab'
import TextField from '@mui/material/TextField'
import { styled } from '@mui/material/styles'
import Button from '@mui/material/Button'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import SendIcon from '@mui/icons-material/Send'
import FileIcon from '@mui/icons-material/Description'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import Drawer from '@mui/material/Drawer'

import {
  Code,
  FileDialog,
  ShareDialog,
  historyApi,
  History,
  Progress,
  Duration,
  PasswordSwitch,
} from './components'
import { resolveFileByCode, uploadFile } from '../../api'
import { Layout, LayoutProps } from '../../components'
import { mapError } from '../../helpers'
import { useTranslation } from '../../i18n'
import { hasDroppedFolder } from './fileDrop'

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
})

const envMax = Number.parseInt(import.meta.env.SHARE_MAX_SIZE_IN_MB, 10)
const MAX_SIZE = Number.isNaN(envMax) || envMax <= 0 ? 10 : envMax

function blurActiveElement() {
  const activeElement = document.activeElement
  if (activeElement instanceof HTMLElement) activeElement.blur()
}

export const AppMain = observer(function AppMain(props: LayoutProps) {
  const setBackdropOpen = props.setBackdropOpen!
  const message = props.message!
  const i18n = useTranslation()
  const [tab, setTab] = useState('text')
  const dialogs = useDialogs()
  const [duration, updateDuration] = useState('')
  const [isEphemeral, updateEphemeral] = useState(false)

  const [progress, updateProgress] = useState<null | number>(null)

  const [drawerOpened, updateDrawerOpened] = useState(false)

  const [password, updatePassword] = useState('')

  const toggleDrawer = (newOpen: boolean) => () => {
    if (newOpen) blurActiveElement()
    updateDrawerOpened(newOpen)
  }

  const handleBackdropClose = () => {
    setBackdropOpen(false)
  }
  const handleBackdropOpen = () => {
    setBackdropOpen(true)
  }

  const handleProgressOpen = () => {
    updateProgress(0)
  }

  const handleProgressClose = () => {
    setTimeout(() => {
      updateProgress(null)
    }, 1000)
  }

  const handleChangeTab = (_event: unknown, newValue: string) => {
    setTab(newValue)
    setText('')
    updateEphemeral(false)
    updateDuration('')
  }

  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isFileDragging, setFileDragging] = useState(false)
  const [code, setCode] = useState('')
  const resolvingCode = useRef<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const reset = useRef(() => {
    setText('')
    setFile(null)
    setCode('')
    setTab('text')
    updateDuration('')
    updateEphemeral(false)
    updatePassword('')
  })

  const handleResolveFile = useRef(async (code: string) => {
    if (!code || code.length !== 6) return
    if (resolvingCode.current === code) return
    resolvingCode.current = code
    setCode(code)
    handleBackdropOpen()
    try {
      const data = await resolveFileByCode(code)
      handleBackdropClose()
      if (!data.result || !data.data) {
        message.error(mapError(data.message))
        return
      }
      // 打开弹窗
      historyApi.insertReceived(
        data.data.code,
        data.data.type !== 'plain/string',
      )
      blurActiveElement()
      await dialogs
        .open(FileDialog, { ...data.data, message })
        .then(reset.current)
    } catch (e) {
      message.error(mapError(e))
      handleBackdropClose()
    } finally {
      resolvingCode.current = null
    }
  })

  const handleTextInput = (e: InputEvent) => {
    const target: HTMLInputElement = e.target as HTMLInputElement
    setText(target.value)
    setFile(null)
  }

  const selectFile = (file: File | null) => {
    if (file && file.size > MAX_SIZE * 1000 * 1000) {
      message.error(i18n.t('home.fileTooLarge', { size: MAX_SIZE }))
      return false
    }
    setFile(file)
    return true
  }

  const handleFileChange = (e: InputEvent) => {
    const target: HTMLInputElement = e.target as HTMLInputElement
    const file = target?.files?.[0] ?? null
    if (!selectFile(file)) target.value = ''
  }

  const handleFileDragOver = (event: Event) => {
    event.preventDefault()
    const dragEvent = event as DragEvent
    if (hasDroppedFolder(dragEvent.dataTransfer)) {
      if (dragEvent.dataTransfer) dragEvent.dataTransfer.dropEffect = 'none'
      setFileDragging(false)
      return
    }
    if (dragEvent.dataTransfer) dragEvent.dataTransfer.dropEffect = 'copy'
    setFileDragging(true)
  }

  const handleFileDragLeave = (event: Event) => {
    event.preventDefault()
    setFileDragging(false)
  }

  const handleFileDrop = (event: Event) => {
    event.preventDefault()
    setFileDragging(false)
    const dragEvent = event as DragEvent
    if (hasDroppedFolder(dragEvent.dataTransfer)) {
      message.error(i18n.t('home.folderUploadNotSupported'))
      return
    }
    const file = dragEvent.dataTransfer?.files?.[0] ?? null
    if (file) selectFile(file)
  }

  const handleFileKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    fileInputRef.current?.click()
  }

  const handleShare = async () => {
    if ((tab === 'text' && !text) || (tab === 'file' && !file)) return
    let data: Blob | null = file
    if (tab === 'text') {
      data = new Blob([text], {
        type: 'plain/string',
      })
    }
    if (!data) return
    handleProgressOpen()
    try {
      const uploaded = await uploadFile(
        {
          data,
          isEphemeral,
          duration,
          password,
        },
        (event) => {
          updateProgress((event.progress ?? 0) * 100)
        },
      )
      handleProgressClose()
      if (!uploaded.result || !uploaded.data) {
        message.error(mapError(uploaded.message))
        return
      }
      historyApi.insertShared(uploaded.data.code, tab === 'file')
      blurActiveElement()
      await dialogs
        .open(ShareDialog, { ...uploaded.data, message })
        .then(reset.current)
    } catch (e) {
      message.error(mapError(e))
      handleProgressClose()
    }
  }

  const handleChangeEphemeral = (_event: unknown, checked: boolean) => {
    updateEphemeral(checked)
  }

  return (
    <>
      <Paper
        className="ml-auto mr-auto"
        elevation={6}
        style={{ maxWidth: 600 }}
      >
        <Container className="flex flex-col" sx={{ p: 2 }}>
          <Box
            className="flex gap-2"
            sx={(theme) => ({
              alignItems: 'center',
              [theme.breakpoints.down('sm')]: {
                flexDirection: 'column',
                alignItems: 'start',
              },
            })}
          >
            <InputLabel>
              <Typography variant="h4" align="left">
                {i18n.t('home.shareCode')}
              </Typography>
            </InputLabel>
            <Code
              length={6}
              onChange={handleResolveFile.current}
              value={code}
            />
          </Box>

          <Divider
            sx={{
              mt: 2,
            }}
          />

          <Box sx={{ width: '100%', typography: 'body1' }}>
            <TabContext value={tab}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <TabList
                  onChange={handleChangeTab}
                  aria-label="lab API tabs example"
                >
                  <Tab label={i18n.t('home.textShare')} value="text" />
                  <Tab label={i18n.t('home.fileShare')} value="file" />
                </TabList>
              </Box>
              <TabPanel value="text" sx={{ height: 230, pl: 0, pr: 0 }}>
                <TextField
                  multiline
                  fullWidth
                  rows={8}
                  value={text}
                  onInput={handleTextInput}
                />
              </TabPanel>
              <TabPanel value="file" sx={{ height: 230, pl: 0, pr: 0 }}>
                <Box
                  component="label"
                  role="button"
                  tabIndex={0}
                  onDragEnter={handleFileDragOver}
                  onDragOver={handleFileDragOver}
                  onDragLeave={handleFileDragLeave}
                  onDrop={handleFileDrop}
                  onKeyDown={handleFileKeyDown}
                  sx={(theme) => ({
                    alignItems: 'center',
                    border: '1px dashed',
                    borderColor: isFileDragging
                      ? theme.palette.primary.main
                      : theme.palette.divider,
                    borderRadius: 2,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    justifyContent: 'center',
                    p: 2,
                    textAlign: 'center',
                    transition: theme.transitions.create(
                      ['background-color', 'border-color'],
                      {
                        duration: theme.transitions.duration.shortest,
                      },
                    ),
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                      borderColor: theme.palette.primary.main,
                    },
                  })}
                >
                  {file ? (
                    <FileIcon color="disabled" sx={{ mb: 1, fontSize: 36 }} />
                  ) : (
                    <CloudUploadIcon
                      color={isFileDragging ? 'primary' : 'disabled'}
                      sx={{ mb: 1, fontSize: 36 }}
                    />
                  )}
                  <Typography
                    color={file ? 'text.primary' : 'text.secondary'}
                    noWrap
                    variant="body2"
                    sx={{ maxWidth: '100%' }}
                  >
                    {file ? file.name : i18n.t('home.dropFileHint')}
                  </Typography>
                  <Typography color="textDisabled" variant="caption">
                    {file
                      ? `${(file.size / (1000 * 1000)).toFixed(1)}M`
                      : i18n.t('home.dropFileSubHint')}
                  </Typography>
                  <VisuallyHiddenInput
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                  />
                </Box>
              </TabPanel>
            </TabContext>
          </Box>
          <Box>
            <Duration value={duration} onChange={updateDuration} />
          </Box>
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={isEphemeral}
                  onChange={handleChangeEphemeral}
                />
              }
              label={i18n.t('home.burnAfterRead')}
            />
          </Box>
          <Box className="flex flex-row-reverse justify-between">
            <div>
              <PasswordSwitch value={password} onChange={updatePassword} />
              <Button
                variant="contained"
                disabled={
                  (tab === 'text' && !text) || (tab === 'file' && !file)
                }
                endIcon={<SendIcon />}
                sx={{
                  pl: 3,
                  pr: 3,
                }}
                onClick={handleShare}
              >
                {i18n.t('common.share')}
              </Button>
            </div>
            <Button variant="text" color="primary" onClick={toggleDrawer(true)}>
              {i18n.t('home.history')}
              <ReceiptLongIcon fontSize="small" />
            </Button>
          </Box>
        </Container>
      </Paper>

      <Drawer open={drawerOpened} onClose={toggleDrawer(false)} anchor="right">
        <History
          onItemClick={(item) => {
            updateDrawerOpened(false)
            setCode(item.code)
          }}
        />
      </Drawer>
      <Progress open={progress !== null} value={progress ?? 0} />
    </>
  )
})
export function Home() {
  return (
    <Layout>
      <AppMain />
    </Layout>
  )
}
