import { useState, useRef } from 'preact/hooks'
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

import { Code, Message, useMessage, ShareDialog } from './components'
import './app.css'
import { resolveFileByCode, uploadFile } from './api'

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

export function App() {
  const [tab, setTab] = useState('text')
  const [messageProps, message] = useMessage()
  const dialogs = useDialogs()

  const handleChangeTab = (_event: unknown, newValue: string) => {
    setTab(newValue)
    setText('')
  }

  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const handleResolveFile = useRef(async (code: string) => {
    if (!code || code.length !== 6) return

    try {
      const data = await resolveFileByCode(code)
      if (!data.result || !data.data) {
        message.error(data.message)
        return
      }
      // 打开弹窗
      await dialogs.open(ShareDialog, { ...data.data, message })
    } catch (e) {
      const data = (e as { message: string }).message || JSON.stringify(e)
      message.error(data)
    }
  })

  const handleTextInput = (e: InputEvent) => {
    const target: HTMLInputElement = e.target as HTMLInputElement
    setText(target.value)
    setFile(null)
  }

  const handleFileChange = (e: InputEvent) => {
    const target: HTMLInputElement = e.target as HTMLInputElement
    const file = target?.files?.[0] ?? null
    setFile(file)
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
    try {
      const uploaded = await uploadFile(data)
      if (!uploaded.result) {
        message.error(uploaded.message)
        return
      }
      // todo
    } catch (e) {
      const data = (e as { message: string }).message || JSON.stringify(e)
      message.error(data)
    }
  }

  return (
    <Container
      className="ml-auto mr-auto"
      sx={{
        maxWidth: 600,
        p: 2,
      }}
    >
      <Paper elevation={6}>
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
                分享码：
              </Typography>
            </InputLabel>
            <Code length={6} onChange={handleResolveFile.current} />
          </Box>

          <Divider
            sx={{
              mt: 2,
              mb: 2,
            }}
          />

          <Box sx={{ width: '100%', typography: 'body1' }}>
            <TabContext value={tab}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <TabList
                  onChange={handleChangeTab}
                  aria-label="lab API tabs example"
                >
                  <Tab label="文本分享" value="text" />
                  <Tab label="文件分享" value="file" />
                </TabList>
              </Box>
              <TabPanel value="text" sx={{ height: 270, pl: 0, pr: 0 }}>
                <TextField
                  multiline
                  fullWidth
                  rows={10}
                  value={text}
                  onInput={handleTextInput}
                />
              </TabPanel>
              <TabPanel value="file" sx={{ height: 270, pl: 0, pr: 0 }}>
                <Box className="flex">
                  <Button
                    className="shrink-0"
                    component="label"
                    role={undefined}
                    variant="contained"
                    tabIndex={-1}
                    startIcon={<CloudUploadIcon />}
                  >
                    选择文件
                    <VisuallyHiddenInput
                      type="file"
                      onChange={handleFileChange}
                    />
                  </Button>
                  {file && (
                    <div class="flex flex-col ml-2 min-w-0">
                      <FileIcon fontSize="small" color="disabled" />
                      <Typography color="textDisabled" noWrap lineHeight="16px">
                        {file.name}
                      </Typography>
                    </div>
                  )}
                </Box>
              </TabPanel>
            </TabContext>
          </Box>
          <Box className="flex flex-row-reverse">
            <Button
              variant="contained"
              disabled={(tab === 'text' && !text) || (tab === 'file' && !file)}
              endIcon={<SendIcon />}
              sx={{
                pl: 3,
                pr: 3,
              }}
              onClick={handleShare}
            >
              分享
            </Button>
          </Box>
        </Container>
      </Paper>
      <Message {...messageProps} />
    </Container>
  )
}
