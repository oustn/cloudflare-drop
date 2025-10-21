import { observer } from 'mobx-react-lite'
import { action, computed, observable, reaction } from 'mobx'
import { createId } from '@paralleldrive/cuid2'

import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import IconButton from '@mui/material/IconButton'
import TextFieldsIcon from '@mui/icons-material/TextFields'
import FileCopyIcon from '@mui/icons-material/FileCopy'
import DeleteIcon from '@mui/icons-material/Delete'
import Typography from '@mui/material/Typography'
import dayjs from 'dayjs'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import Tab from '@mui/material/Tab'
import { useState } from 'preact/hooks'
import { useLanguage } from '../../../helpers'
import { alpha } from '@mui/material/styles'

export interface ShareType {
  type: 'received' | 'shared'
  code: string
  date: number
  id: string
  file: boolean
}

class HistoryState {
  static key = 'history'

  @observable.shallow accessor list: Array<ShareType>

  @computed
  get isEmpty() {
    return !this.list.length
  }

  @computed
  get sharedList() {
    return this.list.filter((d) => d.type === 'shared')
  }

  @computed
  get receivedList() {
    return this.list.filter((d) => d.type === 'received')
  }

  constructor() {
    this.list = this.load()
    reaction(() => this.list, this.save)
  }

  private load(): Array<ShareType> {
    const data = localStorage.getItem(HistoryState.key)
    if (!data) return []
    try {
      return JSON.parse(data)
    } catch (_e) {
      return []
    }
  }

  private save = (data: Array<ShareType>) => {
    localStorage.setItem(HistoryState.key, JSON.stringify(data))
  }

  @action
  private insert(share: Omit<ShareType, 'id' | 'date'>) {
    const list = [...this.list]
    const index = list.findIndex(
      (d) =>
        d.code === share.code &&
        (d.type === share.type || share.type === 'received'),
    )
    if (index >= 0) {
      if (share.type === 'received' && list[index].type === 'shared') return
      list.splice(index, 1)
    }
    this.list = [
      { ...share, id: createId(), date: new Date().getTime() },
      ...list,
    ]
  }

  insertReceived(code: string, file: boolean) {
    this.insert({
      type: 'received',
      code,
      file,
    })
  }

  insertShared(code: string, file: boolean) {
    this.insert({
      type: 'shared',
      code,
      file,
    })
  }

  @action
  remove(id: string) {
    if (!id) return
    this.list = this.list.filter((d) => d.id !== id)
  }
}

const state = new HistoryState()

export const historyApi = {
  insertReceived(code: string, file = false) {
    return state.insertReceived(code, file)
  },
  insertShared(code: string, file = false) {
    return state.insertShared(code, file)
  },
  remove(id: string) {
    return state.remove(id)
  },
}

interface HistoryProps {
  onItemClick?: (share: ShareType) => void
}

interface RecordListProps {
  list: Array<ShareType>
  onView: (item: ShareType) => void
  onDelete: (e: MouseEvent, id: string) => void
}

function RecordList(props: RecordListProps) {
  const { list, onView, onDelete } = props
  const { t } = useLanguage()
  if (!list.length)
    return (
      <Box className="flex items-center justify-center" sx={{ p: 4 }}>
        <Typography
          variant="caption"
          sx={{
            opacity: 0.8,
            color: alpha('#ffffff', 0.6),
            fontSize: '0.9rem',
          }}
        >
          {t('home.history.empty')}
        </Typography>
      </Box>
    )
  return (
    <List className="min-h-0 overflow-auto">
      {list.map((item) => (
        <ListItem
          className="items-start"
          key={item.id}
          onClick={() => onView(item)}
          secondaryAction={
            <IconButton
              edge="end"
              aria-label="delete"
              sx={{
                p: 0.5,
                color: alpha('#ffffff', 0.6),
              }}
              onClick={(e) => onDelete(e, item.id)}
            >
              <DeleteIcon />
            </IconButton>
          }
          sx={{
            cursor: 'pointer',
            pr: '32px',
            color: alpha('#ffffff', 0.9),
            borderRadius: 2,
            margin: '4px 8px',
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 24,
              mr: 2,
              color: alpha('#ffffff', 0.7),
            }}
          >
            {item.file && <FileCopyIcon fontSize="small" />}
            {!item.file && <TextFieldsIcon fontSize="medium" />}
          </ListItemIcon>
          <ListItemText
            primary={
              <Typography
                sx={{
                  color: alpha('#ffffff', 0.9),
                  fontWeight: 500,
                }}
              >
                {t('home.history.shareCodeLabel', { code: item.code })}
              </Typography>
            }
            secondary={
              <Typography
                variant="caption"
                sx={{
                  opacity: 0.9,
                  color: alpha('#ffffff', 0.6),
                }}
              >
                {dayjs(item.date).fromNow()}
              </Typography>
            }
            sx={{
              m: 0,
            }}
          />
        </ListItem>
      ))}
    </List>
  )
}

export const History = observer(({ onItemClick }: HistoryProps) => {
  const [tab, updateTab] = useState<'shared' | 'received'>('shared')
  const { t } = useLanguage()

  const handleDelete = (e: MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    historyApi.remove(id)
  }

  const handleView = (item: ShareType) => {
    if (onItemClick) {
      onItemClick(item)
    }
  }

  return (
    <Box
      className="flex flex-col h-full"
      sx={{
        width: 320,
        background: 'transparent',
        color: alpha('#ffffff', 0.9),
      }}
    >
      <Typography
        variant="h4"
        sx={{
          p: 2,
          fontWeight: 600,
          color: alpha('#ffffff', 0.9),
          fontSize: '1.5rem',
        }}
      >
        {t('home.history.title')}
      </Typography>
      <TabContext value={tab}>
        <Box
          className="shrink-0"
          sx={{
            borderBottom: 1,
            borderColor: alpha('#ffffff', 0.2),
            background: alpha('#ffffff', 0.05),
            borderRadius: '16px 16px 0 0',
          }}
        >
          <TabList
            onChange={(_e, tab) => updateTab(tab)}
            sx={{
              '& .MuiTab-root': {
                color: alpha('#ffffff', 0.7),
                '&.Mui-selected': {
                  color: alpha('#ffffff', 0.95),
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: alpha('#ffffff', 0.6),
              },
            }}
          >
            <Tab label={t('home.history.sharedTab')} value="shared" />
            <Tab label={t('home.history.receivedTab')} value="received" />
          </TabList>
        </Box>
        <Box className="min-h-0 overflow-auto">
          <TabPanel value="shared" sx={{ p: 0 }}>
            <RecordList
              list={state.sharedList}
              onView={handleView}
              onDelete={handleDelete}
            />
          </TabPanel>
          <TabPanel value="received" sx={{ p: 0 }}>
            <RecordList
              list={state.receivedList}
              onView={handleView}
              onDelete={handleDelete}
            />
          </TabPanel>
        </Box>
      </TabContext>
    </Box>
  )
})
