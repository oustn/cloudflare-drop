import * as React from 'react'
import { useEffect, useState } from 'preact/hooks'
import { observer } from 'mobx-react-lite'
import { alpha } from '@mui/material/styles'
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
import { visuallyHidden } from '@mui/utils'
import { useRoute } from 'preact-iso'
import Info from '@mui/icons-material/InfoOutlined'
import LockClose from '@mui/icons-material/Lock'

import { Layout, LayoutProps } from '../../components'
import { createAdminApi } from '../../api'
import { humanFileSize, mapError } from '../../helpers'
import dayjs from 'dayjs'
import { ComponentChildren } from 'preact'
import { useDialogs } from '@toolpad/core/useDialogs'
import { useTranslation } from '../../i18n'

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

// 動態產生表頭（需要使用 t() 函式）
function createHeadCells(
  t: ReturnType<typeof useTranslation>['t'],
): readonly HeadCell[] {
  return [
    {
      disablePadding: true,
      label: t('admin', 'filename'),
    },
    {
      disablePadding: false,
      label: t('admin', 'shareCode'),
      width: 150,
    },
    {
      id: 'size',
      disablePadding: false,
      label: t('admin', 'size'),
      tooltip: t('admin', 'sizeTooltip'),
      width: 150,
    },
    {
      id: 'due_date',
      disablePadding: false,
      label: t('admin', 'expiryDate'),
      width: 150,
    },
    {
      disablePadding: true,
      label: t('admin', 'isEncrypted'),
      width: 100,
    },
    {
      id: 'created_at',
      disablePadding: false,
      label: t('admin', 'createdAt'),
      width: 150,
    },
    {
      disablePadding: true,
      label: t('admin', 'actions'),
      width: 100,
    },
  ]
}

interface EnhancedTableProps {
  numSelected: number
  onRequestSort: (property: keyof FileType) => void
  onSelectAllClick: (event: React.ChangeEvent<HTMLInputElement>) => void
  order: Order
  orderBy: string
  rowCount: number
  headCells: readonly HeadCell[]
}

const EnhancedTableHead = observer((props: EnhancedTableProps) => {
  const { t } = useTranslation()
  const {
    onSelectAllClick,
    order,
    orderBy,
    numSelected,
    rowCount,
    onRequestSort,
    headCells,
  } = props
  const createSortHandler = (property?: keyof FileType) => () => {
    if (property) {
      onRequestSort(property)
    }
  }

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
                  // @ts-expect-error unknown
                  <Box component="span" sx={visuallyHidden}>
                    {order === 'desc'
                      ? t('admin', 'sortedDescending')
                      : t('admin', 'sortedAscending')}
                  </Box>
                ) : null}
              </Comp>
            </TableCell>
          )
        })}
      </TableRow>
    </TableHead>
  )
})

interface EnhancedTableToolbarProps {
  numSelected: number
  onDelete: (event: Event) => void
}

const EnhancedTableToolbar = observer((props: EnhancedTableToolbarProps) => {
  const { t } = useTranslation()
  const { numSelected } = props

  return (
    <Toolbar
      className="flex-0 flex-shrink-0"
      sx={[
        {
          pl: { sm: 2 },
          pr: { xs: 1, sm: 1 },
        },
        numSelected > 0 && {
          bgcolor: (theme) =>
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
          {t('admin', 'selected', { count: numSelected })}
        </Typography>
      ) : (
        <Typography
          sx={{ flex: '1 1 100%' }}
          variant="h6"
          id="tableTitle"
          component="div"
        >
          {t('admin', 'shareList')}
        </Typography>
      )}
      {numSelected > 0 && (
        <Tooltip title={t('admin', 'deleteSelected')}>
          <IconButton onClick={props.onDelete}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      )}
    </Toolbar>
  )
})

interface AdminProps extends LayoutProps {
  token: string
}

const DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss'

const AdminMain = observer((props: AdminProps) => {
  const { t } = useTranslation()
  const headCells = createHeadCells(t)
  const setBackdropOpen = props.setBackdropOpen!
  const message = props.message!
  const token = props.token
  const adminApi = createAdminApi(token)
  const dialogs = useDialogs()

  const [order, setOrder] = React.useState<Order>('desc')
  const [orderBy, setOrderBy] = React.useState<keyof FileType>('created_at')
  const [selected, setSelected] = React.useState<readonly string[]>([])
  const [page, setPage] = React.useState(0)
  const [rowsPerPage, setRowsPerPage] = React.useState(10)
  const [total, setTotal] = useState(0)
  const [rows, setRows] = useState<Array<FileType>>([])

  const fetchList = async (pageSize = page) => {
    setBackdropOpen(true)

    const response = await adminApi.list<{
      items: FileType[]
      total: number
    }>(pageSize, rowsPerPage, orderBy, order)
    if (response.result) {
      const { items, total } = response.data!
      setTotal(total)
      setRows(items)
      setSelected([])
    } else {
      message.error(mapError(response.message))
    }
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
      const newSelected = rows.map((n) => n.id)
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
    const confirmed = await dialogs.confirm(t('history', 'deleteConfirm'), {
      okText: t('common', 'confirm'),
      cancelText: t('common', 'cancel'),
      title: !id ? t('admin', 'deleteSelected') : t('admin', 'shareCode'),
    })
    if (confirmed) {
      setBackdropOpen(true)
      const data = await adminApi.delete(id ?? selected)
      if (data.result) {
        setPage(0)
        await fetchList(0)
      } else {
        message.error(mapError(data.message))
        setBackdropOpen(false)
      }
    }
  }

  // Avoid a layout jump when reaching the last page with empty rows.
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
        />
        <TableContainer>
          <Table
            sx={{ minWidth: 750 }}
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
              headCells={headCells}
            />
            <TableBody>
              {rows.map((row, index) => {
                const isItemSelected = selected.includes(row.id)
                const labelId = `enhanced-table-checkbox-${index}`

                return (
                  <TableRow
                    hover
                    onClick={(event) => handleClick(event, row.id)}
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
                          ? `[${t('admin', 'text')}]`
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
                            : t('admin', 'permanent')
                        }
                      >
                        <span>
                          {row.due_date
                            ? dayjs(row.due_date).fromNow()
                            : t('admin', 'permanent')}
                        </span>
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ fontSize: 0 }} padding="none">
                      {row.is_encrypted && (
                        <LockClose sx={{ fontSize: 18 }} color="action" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip
                        title={dayjs(row.created_at).format(DATE_FORMAT)}
                      >
                        <span>
                          {row.created_at
                            ? dayjs(row.created_at).fromNow()
                            : ''}
                        </span>
                      </Tooltip>
                    </TableCell>
                    <TableCell padding="none">
                      <IconButton
                        aria-label={t('admin', 'delete')}
                        onClick={createRemoveHandler(row.id)}
                      >
                        <DeleteIcon color="action" />
                      </IconButton>
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
                  <TableCell colSpan={6} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          className="flex-shrink-0"
          labelDisplayedRows={({ from, to, count }) =>
            `${from} - ${to} / ${count}`
          }
          rowsPerPageOptions={[10]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  )
})

export function Admin() {
  const { params } = useRoute()
  return (
    <Layout>
      <AdminMain token={params.token} />
    </Layout>
  )
}
