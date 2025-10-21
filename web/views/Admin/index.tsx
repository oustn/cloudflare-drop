import * as React from 'react'
import { useEffect, useState } from 'preact/hooks'
import { useLanguage } from '../../helpers/i18n'
import { alpha, Theme } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import TableSortLabel from '@mui/material/TableSortLabel'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Checkbox from '@mui/material/Checkbox'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import DeleteIcon from '@mui/icons-material/Delete'
import DownloadIcon from '@mui/icons-material/FileDownload'
import VisibilityIcon from '@mui/icons-material/Visibility'
import EditIcon from '@mui/icons-material/Edit'
import LogoutIcon from '@mui/icons-material/Logout'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import TextField from '@mui/material/TextField'
import Switch from '@mui/material/Switch'
import Info from '@mui/icons-material/InfoOutlined'
import LockClose from '@mui/icons-material/Lock'

import { Layout, LayoutProps } from '../../components'
import { createAdminApi } from '../../api'
import { humanFileSize } from '../../helpers'
import dayjs from 'dayjs'
import { ComponentChildren } from 'preact'
import { useDialogs } from '@toolpad/core/useDialogs'
import { AdminLogin } from './AdminLogin'

function Div(props: { children?: ComponentChildren }) {
  return <div>{props.children}</div>
}

type Order = 'asc' | 'desc'

interface HeadCell {
  disablePadding: boolean
  id?: keyof FileType
  label: string
  width?: number
  tooltip?: string
}

interface EnhancedTableProps {
  numSelected: number
  onRequestSort: (property: keyof FileType) => void
  onSelectAllClick: (event: React.ChangeEvent<HTMLInputElement>) => void
  order: Order
  orderBy: string
  rowCount: number
  t: (key: string, params?: Record<string, string | number>) => string
}

function EnhancedTableHead(props: EnhancedTableProps) {
  const {
    onSelectAllClick,
    order,
    orderBy,
    numSelected,
    rowCount,
    onRequestSort,
    t,
  } = props
  const createSortHandler = (property?: keyof FileType) => () => {
    if (property) {
      onRequestSort(property)
    }
  }

  const headCells: readonly HeadCell[] = [
    {
      disablePadding: true,
      label: t('admin.table.filename'),
    },
    {
      disablePadding: false,
      label: t('admin.table.shareCode'),
      width: 150,
    },
    {
      id: 'size',
      disablePadding: false,
      label: t('admin.table.size'),
      tooltip: t('admin.table.sizeTooltip'),
      width: 150,
    },
    {
      id: 'due_date',
      disablePadding: false,
      label: t('admin.table.dueDate'),
      width: 150,
    },
    {
      disablePadding: true,
      label: t('admin.table.encrypted'),
      width: 100,
    },
    {
      disablePadding: true,
      label: t('admin.table.burnAfterReading'),
      width: 120,
    },
    {
      id: 'created_at',
      disablePadding: false,
      label: t('admin.table.createdAt'),
      width: 150,
    },
    {
      disablePadding: true,
      label: t('admin.table.actions'),
      width: 150,
    },
  ]

  return (
    <TableHead>
      <TableRow>
        <TableCell padding="checkbox">
          <Checkbox
            color="primary"
            indeterminate={numSelected > 0 && numSelected < rowCount}
            checked={rowCount > 0 && numSelected === rowCount}
            onChange={onSelectAllClick}
          />
        </TableCell>
        {headCells.map((headCell) => {
          const Comp = headCell.id ? TableSortLabel : Div
          return (
            <TableCell
              width={headCell.width}
              key={headCell.id}
              padding={headCell.disablePadding ? 'none' : 'normal'}
              sortDirection={orderBy === headCell.id ? order : false}
            >
              <Comp
                active={orderBy === headCell.id}
                direction={orderBy === headCell.id ? order : 'asc'}
                onClick={createSortHandler(headCell.id)}
              >
                {headCell.label}
                {headCell.tooltip && (
                  <Tooltip title={headCell.tooltip} arrow>
                    <Info color="disabled" sx={{ fontSize: '18px', ml: 1 }} />
                  </Tooltip>
                )}
                {orderBy === headCell.id ? (
                  <Box
                    component="span"
                    sx={{
                      position: 'absolute',
                      width: 1,
                      height: 1,
                      padding: 0,
                      margin: -1,
                      overflow: 'hidden',
                      clip: 'rect(0, 0, 0, 0)',
                      whiteSpace: 'nowrap',
                      border: 0,
                    }}
                  >
                    {order === 'desc'
                      ? 'sorted descending'
                      : 'sorted ascending'}
                  </Box>
                ) : null}
              </Comp>
            </TableCell>
          )
        })}
      </TableRow>
    </TableHead>
  )
}

interface EnhancedTableToolbarProps {
  numSelected: number
  onDelete: (event: Event) => void
  onLogout?: () => void
  t: (key: string, params?: Record<string, string | number>) => string
}

function EnhancedTableToolbar(props: EnhancedTableToolbarProps) {
  const { numSelected, t } = props

  return (
    <Toolbar
      className="flex-0 flex-shrink-0"
      sx={[
        {
          pl: { sm: 2 },
          pr: { xs: 1, sm: 1 },
        },
        numSelected > 0 && {
          bgcolor: (theme: Theme) =>
            alpha(
              theme.palette.primary.main,
              theme.palette.action.activatedOpacity,
            ),
        },
      ]}
    >
      {numSelected > 0 ? (
        <Typography
          sx={{ flex: '1 1 100%' }}
          color="inherit"
          variant="subtitle1"
          component="div"
        >
          {t('admin.actions.selected', { count: numSelected })}
        </Typography>
      ) : (
        <Typography
          sx={{ flex: '1 1 100%' }}
          variant="h6"
          id="tableTitle"
          component="div"
        >
          {t('admin.title')}
        </Typography>
      )}
      {numSelected > 0 ? (
        <Tooltip title={t('admin.actions.deleteSelected')}>
          <IconButton onClick={props.onDelete}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip title={t('admin.logout.title')}>
          <IconButton onClick={props.onLogout}>
            <LogoutIcon />
          </IconButton>
        </Tooltip>
      )}
    </Toolbar>
  )
}

interface AdminProps extends LayoutProps {
  token: string
  onLogout?: () => void
}

const DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss'

function AdminMain(props: AdminProps) {
  const setBackdropOpen = props.setBackdropOpen!
  const message = props.message!
  const token = props.token
  const { t } = useLanguage()
  const adminApi = createAdminApi(token)
  const dialogs = useDialogs()

  const [order, setOrder] = React.useState<Order>('desc')
  const [orderBy, setOrderBy] = React.useState<keyof FileType>('created_at')
  const [selected, setSelected] = React.useState<readonly string[]>([])
  const [page, setPage] = React.useState(0)
  const [rowsPerPage, setRowsPerPage] = React.useState(10)
  const [total, setTotal] = useState(0)
  const [rows, setRows] = useState<Array<FileType>>([])

  // Text preview state
  const [textPreview, setTextPreview] = useState<{
    open: boolean
    content: string
    filename: string
  }>({
    open: false,
    content: '',
    filename: '',
  })

  // Edit dialog state
  const [editDialog, setEditDialog] = useState<{
    open: boolean
    file: FileType | null
    expiryType: 'permanent' | 'custom'
    customDate: string
    burnAfterReading: boolean
    isLoading: boolean
  }>({
    open: false,
    file: null,
    expiryType: 'permanent',
    customDate: '',
    burnAfterReading: false,
    isLoading: false,
  })

  const fetchList = async (pageNumber = page) => {
    console.log(
      'fetchList called with pageNumber:',
      pageNumber,
      'current page:',
      page,
    )
    setBackdropOpen(true)

    const response = await adminApi.list<{
      items: FileType[]
      total: number
    }>(pageNumber, rowsPerPage, orderBy, order)

    if (response.result) {
      const { items, total } = response.data!
      console.log(
        'fetchList success - updating table with',
        items.length,
        'items',
      )
      setTotal(total)
      setRows(items)
      setSelected([])
    } else {
      console.error('fetchList failed:', response.message)
      message.error(response.message)
    }
    console.log('fetchList completed - setting backdrop to false')
    setBackdropOpen(false)
  }

  useEffect(() => {
    ;(async () => {
      setSelected([])
      await fetchList()
    })()
  }, [page, rowsPerPage, order, orderBy])

  const handleRequestSort = (property: keyof FileType) => {
    const isAsc = orderBy === property && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
    setPage(0)
  }

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if ((event?.target as HTMLInputElement)?.checked) {
      const newSelected = rows.map((n: FileType) => n.id)
      setSelected(newSelected)
      return
    }
    setSelected([])
  }

  const handleClick = (_event: unknown, id: string) => {
    const selectedIndex = selected.indexOf(id)
    let newSelected: readonly string[] = []

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id)
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1))
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1))
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      )
    }
    setSelected(newSelected)
  }

  const handleChangePage = async (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt((event?.target as HTMLInputElement)?.value, 10))
    setPage(0)
  }

  const createRemoveHandler = (id?: string) => async (event: Event) => {
    event.stopPropagation()
    const confirmed = await dialogs.confirm(t('admin.confirmDelete'), {
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      title: !id
        ? t('admin.actions.deleteSelected')
        : t('admin.actions.delete'),
    })
    if (confirmed) {
      setBackdropOpen(true)
      const data = await adminApi.delete(id ?? selected)
      if (data.result) {
        setPage(0)
        await fetchList(0)
      } else {
        message.error(data.message)
        setBackdropOpen(false)
      }
    }
  }

  const createDownloadHandler = (file: FileType) => async (event: Event) => {
    event.stopPropagation()
    event.preventDefault()

    setBackdropOpen(true)

    try {
      // Check if this is a text file by type
      if (file.type === 'plain/string') {
        const content = await adminApi.getTextContent(file.id)
        setTextPreview({
          open: true,
          content,
          filename: file.filename,
        })
        setBackdropOpen(false)
        return
      }

      // For non-text files, proceed with download
      await adminApi.downloadFile(file.id, file.filename)
      message.success(t('messages.uploadSuccess'))
    } catch (error) {
      console.error('Download failed:', error)
      message.error(t('messages.downloadFailed'))
    } finally {
      setBackdropOpen(false)
    }
  }

  const handleEditFile = (file: FileType) => {
    setEditDialog({
      open: true,
      file,
      expiryType: file.due_date ? 'custom' : 'permanent',
      customDate: file.due_date
        ? dayjs(file.due_date).format('YYYY-MM-DDTHH:mm')
        : dayjs().add(1, 'day').format('YYYY-MM-DDTHH:mm'),
      burnAfterReading: file.is_ephemeral || false,
      isLoading: false,
    })
  }

  const handleEditDialogClose = () => {
    setEditDialog((prev) => ({ ...prev, open: false }))
  }

  const handleExpiryTypeChange = (type: 'permanent' | 'custom') => {
    setEditDialog((prev) => ({ ...prev, expiryType: type }))
  }

  const handleCustomDateChange = (date: string) => {
    setEditDialog((prev) => ({ ...prev, customDate: date }))
  }

  const handleBurnAfterReadingChange = (checked: boolean) => {
    setEditDialog((prev) => ({ ...prev, burnAfterReading: checked }))
  }

  const handleSaveEdit = async () => {
    if (!editDialog.file) return

    console.log('Starting handleSaveEdit...')
    setEditDialog((prev) => ({ ...prev, isLoading: true }))

    try {
      const due_date =
        editDialog.expiryType === 'permanent'
          ? null
          : new Date(editDialog.customDate).getTime()

      console.log('Calling updateFile API with:', {
        id: editDialog.file.id,
        due_date,
        is_ephemeral: editDialog.burnAfterReading,
      })

      const response = await adminApi.updateFile(editDialog.file.id, {
        due_date,
        is_ephemeral: editDialog.burnAfterReading,
      })

      console.log('API Response:', response)

      // Handle both response formats: {result: true} and {success: true}
      const isSuccess =
        'result' in response
          ? response.result
          : (response as { success: boolean }).success

      if (isSuccess) {
        console.log('API success - closing dialog and refreshing table...')

        // Close dialog immediately
        setEditDialog((prev) => ({ ...prev, open: false, isLoading: false }))

        // Show success message
        message.success(t('admin.edit.success'))

        // Match the delete pattern exactly: set backdrop, then fetch list
        console.log('Setting backdrop and fetching list...')
        setBackdropOpen(true)
        await fetchList(page)
        console.log('Table refresh completed')
        // Note: fetchList will call setBackdropOpen(false) when done
      } else {
        console.error('API failed with message:', response.message)
        message.error(response.message || t('admin.edit.error'))
        setEditDialog((prev) => ({ ...prev, isLoading: false }))
      }
    } catch (error) {
      console.error('Edit failed:', error)
      message.error(t('admin.edit.error'))
      setEditDialog((prev) => ({ ...prev, isLoading: false }))
    }
  } // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows = rowsPerPage - rows.length

  return (
    <Box
      sx={{ width: '100%' }}
      className="min-h-0 flex-1 overflow-hidden flex flex-col"
    >
      <Paper
        sx={{ width: '100%', mb: 2 }}
        className="min-h-0 flex-1 flex flex-col"
      >
        <EnhancedTableToolbar
          numSelected={selected.length}
          onDelete={createRemoveHandler()}
          onLogout={props.onLogout}
          t={t}
        />
        <TableContainer>
          <Table
            sx={{ minWidth: 1100 }}
            aria-labelledby="tableTitle"
            size={'medium'}
          >
            <EnhancedTableHead
              numSelected={selected.length}
              order={order || 'asc'}
              orderBy={orderBy}
              onSelectAllClick={handleSelectAllClick}
              onRequestSort={handleRequestSort}
              rowCount={rows.length}
              t={t}
            />
            <TableBody>
              {rows.map((row: FileType, index: number) => {
                const isItemSelected = selected.includes(row.id)
                const labelId = `enhanced-table-checkbox-${index}`

                return (
                  <TableRow
                    hover
                    onClick={(event: unknown) => handleClick(event, row.id)}
                    role="checkbox"
                    aria-checked={isItemSelected}
                    tabIndex={-1}
                    key={row.id}
                    selected={isItemSelected}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        checked={isItemSelected}
                        slotProps={{
                          input: {
                            'aria-labelledby': labelId,
                          },
                        }}
                      />
                    </TableCell>
                    <TableCell
                      component="th"
                      id={labelId}
                      scope="row"
                      padding="none"
                    >
                      <Typography
                        title={row.filename}
                        className="text-ellipsis text-nowrap overflow-hidden"
                      >
                        {row.type === 'plain/string'
                          ? t('admin.status.text')
                          : row.filename}
                      </Typography>
                    </TableCell>
                    <TableCell>{row.code}</TableCell>
                    <TableCell>{humanFileSize(row.size)}</TableCell>
                    <TableCell>
                      <Tooltip
                        title={
                          row.due_date
                            ? dayjs(row.due_date).format(DATE_FORMAT)
                            : t('admin.status.permanent')
                        }
                      >
                        <Box component="span">
                          {row.due_date
                            ? dayjs(row.due_date).fromNow()
                            : t('admin.status.permanent')}
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ fontSize: 0 }} padding="none">
                      {row.is_encrypted && (
                        <LockClose sx={{ fontSize: 18 }} color="action" />
                      )}
                    </TableCell>
                    <TableCell sx={{ fontSize: 0 }} padding="none">
                      {row.is_ephemeral && (
                        <Typography
                          variant="caption"
                          color="warning.main"
                          sx={{ fontSize: 12 }}
                        >
                          ✓
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip
                        title={dayjs(row.created_at).format(DATE_FORMAT)}
                      >
                        <Box component="span">
                          {row.created_at
                            ? dayjs(row.created_at).fromNow()
                            : ''}
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell padding="none">
                      <Tooltip title={t('admin.actions.download')}>
                        <IconButton
                          aria-label="download"
                          onClick={createDownloadHandler(row)}
                        >
                          <DownloadIcon color="action" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('admin.actions.edit')}>
                        <IconButton
                          aria-label="edit"
                          onClick={() => handleEditFile(row)}
                        >
                          <EditIcon color="action" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('admin.actions.delete')}>
                        <IconButton
                          aria-label="delete"
                          onClick={createRemoveHandler(row.id)}
                        >
                          <DeleteIcon color="action" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                )
              })}
              {emptyRows > 0 && (
                <TableRow
                  style={{
                    height: 53 * emptyRows,
                  }}
                >
                  <TableCell colSpan={9} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          className="flex-shrink-0"
          labelDisplayedRows={({
            from,
            to,
            count,
          }: {
            from: number
            to: number
            count: number
          }) => t('admin.pagination.displayedRows', { from, to, count })}
          labelRowsPerPage={t('admin.pagination.rowsPerPage')}
          rowsPerPageOptions={[10]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Text Preview Dialog */}
      <Dialog
        open={textPreview.open}
        onClose={() => setTextPreview((prev) => ({ ...prev, open: false }))}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VisibilityIcon />
            {textPreview.filename}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box
            component="pre"
            sx={{
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              fontSize: '14px',
              fontFamily: 'monospace',
              maxHeight: '60vh',
              overflow: 'auto',
            }}
          >
            {textPreview.content}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setTextPreview((prev) => ({ ...prev, open: false }))}
          >
            {t('common.close')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editDialog.open}
        onClose={handleEditDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EditIcon />
            {t('admin.edit.title')}: {editDialog.file?.filename}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl component="fieldset">
              <RadioGroup
                value={editDialog.expiryType}
                onChange={(e) =>
                  handleExpiryTypeChange(
                    (e.target as HTMLInputElement).value as
                      | 'permanent'
                      | 'custom',
                  )
                }
              >
                <FormControlLabel
                  value="permanent"
                  control={<Radio />}
                  label={t('admin.edit.permanent')}
                />
                <FormControlLabel
                  value="custom"
                  control={<Radio />}
                  label={t('admin.edit.customDate')}
                />
              </RadioGroup>
            </FormControl>

            {editDialog.expiryType === 'custom' && (
              <TextField
                fullWidth
                type="datetime-local"
                label={t('admin.edit.selectDate')}
                value={editDialog.customDate}
                onChange={(e) =>
                  handleCustomDateChange((e.target as HTMLInputElement).value)
                }
                sx={{ mt: 2 }}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            )}

            <FormControlLabel
              control={
                <Switch
                  checked={editDialog.burnAfterReading}
                  onChange={(e) =>
                    handleBurnAfterReadingChange(
                      (e.target as HTMLInputElement).checked,
                    )
                  }
                />
              }
              label={t('admin.edit.burnAfterReading')}
              sx={{ mt: 2 }}
            />
            <Typography
              variant="caption"
              color="textSecondary"
              sx={{ display: 'block', mt: 0.5 }}
            >
              {t('admin.edit.burnAfterReadingHelp')}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditDialogClose}>
            {t('admin.edit.cancel')}
          </Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            disabled={editDialog.isLoading}
          >
            {editDialog.isLoading
              ? t('admin.edit.saving')
              : t('admin.edit.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export function Admin() {
  const [token, setToken] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check if there's a saved token in session storage
  useEffect(() => {
    const savedToken = sessionStorage.getItem('admin_token')
    if (savedToken) {
      setToken(savedToken)
      setIsAuthenticated(true)
    }
  }, [])

  const handleLogin = (adminToken: string) => {
    setToken(adminToken)
    setIsAuthenticated(true)
    sessionStorage.setItem('admin_token', adminToken)
  }

  const handleLogout = () => {
    setToken(null)
    setIsAuthenticated(false)
    sessionStorage.removeItem('admin_token')
  }

  if (!isAuthenticated || !token) {
    return <AdminLogin onLogin={handleLogin} />
  }

  return (
    <Layout>
      <AdminMain token={token} onLogout={handleLogout} />
    </Layout>
  )
}
