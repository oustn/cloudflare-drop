import { useState, useRef } from 'preact/hooks'
import { useDialogs } from '@toolpad/core/useDialogs'
import { useLanguage } from '../../helpers/i18n.tsx'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import Tab from '@mui/material/Tab'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'

import {
  Code,
  ShareDialog,
  historyApi,
  History,
  Duration,
  PasswordSwitch,
} from './components'
import { resolveFileByCode, uploadFile } from '../../api'
import { LayoutProps } from '../../components'

interface HomeProps extends LayoutProps {}

export default function Home({ setBackdropOpen, message }: HomeProps) {
  const { t } = useLanguage()
  const dialogs = useDialogs()
  
  const [tabValue, setTabValue] = useState('1')
  const [code, setCode] = useState('')
  const [text, setText] = useState('')
  const [password, setPassword] = useState('')
  const [duration, setDuration] = useState('7d')
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDownload = async () => {
    if (!code || loading) return
    
    setLoading(true)
    setBackdropOpen?.(true)
    
    try {
      const result = await resolveFileByCode(code)
      if (result) {
        message?.success(t('home.downloadSection.success'))
      }
    } catch (error) {
      message?.error(t('home.downloadSection.error'))
    } finally {
      setLoading(false)
      setBackdropOpen?.(false)
    }
  }

  const handleUpload = async () => {
    if ((!file && !text) || loading) return
    
    setLoading(true)
    setBackdropOpen?.(true)
    
    try {
      const result = await uploadFile({
        data: file ? file : new Blob([text], { type: 'text/plain' }),
        isEphemeral: false,
        duration,
        password: password || undefined,
      })
      
      if (result.result && result.data && message) {
        const payload = { 
          ...result.data, 
          message 
        }
        const dialogResult = await dialogs.open(ShareDialog, payload)
        if (dialogResult !== undefined) {
          historyApi.insertShared(result.data.code, !!file)
        }
      }
    } catch (error) {
      message?.error(t('home.uploadSection.error'))
    } finally {
      setLoading(false)
      setBackdropOpen?.(false)
    }
  }

  return (
    <Box sx={{ width: '100%', typography: 'body1' }}>
      <TabContext value={tabValue}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList 
            onChange={(_, newValue: string) => setTabValue(newValue)}
            aria-label="file operations"
          >
            <Tab label={t('home.downloadSection.title')} value="1" />
            <Tab label={t('home.uploadSection.title')} value="2" />
          </TabList>
        </Box>
        
        <TabPanel value="1">
          <Typography variant="h6" gutterBottom>
            {t('home.downloadSection.description')}
          </Typography>
          
          <Code value={code} onChange={setCode} length={6} />
          
          <Button
            variant="contained"
            onClick={handleDownload}
            disabled={code.length !== 6 || loading}
            sx={{ mt: 2 }}
          >
            {t('home.downloadSection.button')}
          </Button>
        </TabPanel>
        
        <TabPanel value="2">
          <Typography variant="h6" gutterBottom>
            {t('home.uploadSection.description')}
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <input
              ref={fileInputRef}
              type="file"
              hidden
              onChange={(e: any) => {
                const selectedFile = e.target.files?.[0]
                if (selectedFile) {
                  setFile(selectedFile)
                  setFileName(selectedFile.name)
                  setText('')
                }
              }}
            />
            <Button 
              variant="outlined" 
              onClick={() => fileInputRef.current?.click()}
              sx={{ mr: 1 }}
            >
              {fileName || t('home.uploadSection.selectFile')}
            </Button>
          </Box>
          
          <TextField
            multiline
            rows={4}
            fullWidth
            placeholder={t('home.uploadSection.textPlaceholder')}
            value={text}
            onChange={(e: any) => {
              setText(e.target.value)
              if (e.target.value) {
                setFile(null)
                setFileName('')
              }
            }}
            sx={{ mb: 2 }}
          />
          
          <Box sx={{ mb: 2 }}>
            <Duration value={duration} onChange={setDuration} />
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <PasswordSwitch value={password} onChange={setPassword} />
          </Box>
          
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={(!file && !text) || loading}
          >
            {t('home.uploadSection.button')}
          </Button>
        </TabPanel>
      </TabContext>

      <Button
        variant="outlined"
        startIcon={<ReceiptLongIcon />}
        onClick={() => setDrawerOpen(true)}
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
      >
        {t('home.history.button')}
      </Button>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 400, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            {t('home.history.title')}
          </Typography>
          <History />
        </Box>
      </Drawer>
    </Box>
  )
}
