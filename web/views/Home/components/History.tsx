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
import { useTranslation } from '../../../i18n'

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
  const i18n = useTranslation()
  if (!list.length)
    return (
      <Box className="flex items-center justify-center" sx={{ p: 4 }}>
        <Typography variant="caption" color="textDisabled">
          {i18n.t('history.empty')}
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
              sx={{ p: 0.5 }}
              onClick={(e) => onDelete(e, item.id)}
            >
              <DeleteIcon />
            </IconButton>
          }
          sx={{
            cursor: 'pointer',
            pr: '32px',
          }}
        >
          <ListItemIcon sx={{ minWidth: 24, mr: 2 }}>
            {item.file && <FileCopyIcon fontSize="small" />}
            {!item.file && <TextFieldsIcon fontSize="medium" />}
          </ListItemIcon>
          <ListItemText
            primary={
              <Typography>
                {i18n.t('history.shareCodeClick', { code: item.code })}
              </Typography>
            }
            secondary={
              <Typography color="textDisabled" variant="caption">
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
  const i18n = useTranslation()

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
    <Box className="flex flex-col h-full" sx={{ width: 320 }}>
      <Typography variant="h4" color="textDisabled" sx={{ p: 2 }}>
        {i18n.t('history.title')}
      </Typography>
      <TabContext value={tab}>
        <Box
          className="shrink-0"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <TabList onChange={(_e, tab) => updateTab(tab)}>
            <Tab label={i18n.t('history.shared')} value="shared" />
            <Tab label={i18n.t('history.received')} value="received" />
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
