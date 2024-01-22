/* eslint-disable react/prop-types */
import React from 'react'
import {
  alpha,
  Box,
  TableHead,
  TableRow,
  Toolbar,
  TableCell,
  Typography,
  Checkbox,
  Tooltip,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableContainer
} from '@mui/material'
import {
  Add as IconAdd,
  StopCircle as IconStopCircle,
  PlayCircle as IconPlayCircle,
  Edit as IconEdit
} from '@mui/icons-material'
import { ipcMainConsumer } from '../helpers/api'
import ModalAddAccount from './ModalAddAccount'
import ModalAddMultiAccount from './ModalAddMultiAccount'
import ModalEditMultiAccount from './ModalEditMultiAccount'
import DialogDeleteAccount from './DialogDeleteAccount'

const FIELDS = {
  profileId: 'profileId',
  username: 'screenName',
  displayName: 'displayName',
  cookie: 'cookie',
  proxy: 'proxy',
  note: 'note',
  status: 'status',
  chatOpenAIKey: 'chatOpenAIKey'
}

const HEAD_CELLS = [
  {
    id: FIELDS.profileId,
    numeric: false,
    disablePadding: true,
    label: 'ProfileId'
  },
  {
    id: FIELDS.username,
    numeric: false,
    disablePadding: false,
    label: 'Username'
  },
  {
    id: FIELDS.displayName,
    numeric: false,
    disablePadding: false,
    label: 'Tên hiển thị'
  },
  {
    id: FIELDS.cookie,
    numeric: false,
    disablePadding: false,
    label: 'cookie'
  },
  {
    id: FIELDS.proxy,
    numeric: false,
    disablePadding: false,
    label: 'Proxy'
  },
  {
    id: FIELDS.chatOpenAIKey,
    numeric: false,
    disablePadding: false,
    label: 'ChatGPTKey'
  },
  {
    id: FIELDS.note,
    numeric: false,
    disablePadding: false,
    label: 'Ghi chú'
  },
  {
    id: FIELDS.status,
    numeric: false,
    disablePadding: false,
    label: 'Trạng thái'
  }
]

const ROW_BODY_COLUMNS = HEAD_CELLS.reduce((result, headCell) => {
  result.push(headCell.id)
  return result
}, [])

const EnhancedTableHead = ({ onSelectAllClick, numSelected, rowCount }) => (
  <TableHead>
    <TableRow>
      <TableCell padding="checkbox">
        <Checkbox
          color="primary"
          indeterminate={numSelected > 0 && numSelected < rowCount}
          checked={rowCount > 0 && numSelected === rowCount}
          onChange={onSelectAllClick}
          inputProps={{
            'aria-label': 'select all desserts'
          }}
        />
      </TableCell>
      {HEAD_CELLS.map((headCell) => (
        <TableCell
          key={headCell.id}
          align={headCell.numeric ? 'right' : 'left'}
          padding={headCell.disablePadding ? 'none' : 'normal'}
        >
          {headCell.label}
        </TableCell>
      ))}
    </TableRow>
  </TableHead>
)

const EnhancedTableToolbar = ({ selected, onOpenAddAccountModal, onEdit, onPlay, onStop }) => {
  const totalSelected = selected.length
  return (
    <Toolbar
      sx={{
        pl: { sm: 2 },
        pr: { xs: 1, sm: 1 },
        ...(totalSelected > 0 && {
          bgcolor: (theme) =>
            alpha(theme.palette.primary.main, theme.palette.action.activatedOpacity)
        })
      }}
    >
      {totalSelected > 0 ? (
        <Typography sx={{ flex: '1 1 100%' }} color="inherit" variant="subtitle1" component="div">
          {totalSelected} đã chọn
        </Typography>
      ) : (
        <Typography sx={{ flex: '1 1 100%' }} variant="h6" id="tableTitle" component="div">
          Danh sách tài khoản
        </Typography>
      )}
      <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
        {totalSelected > 0 && (
          <>
            <Tooltip title="Chạy" onClick={onPlay}>
              <IconButton>
                <IconPlayCircle />
              </IconButton>
            </Tooltip>
            <Tooltip title="Dừng" onClick={onStop}>
              <IconButton>
                <IconStopCircle />
              </IconButton>
            </Tooltip>
            {totalSelected === 1 ? (
              <>
                <Tooltip title="Chỉnh sửa">
                  <IconButton onClick={onEdit}>
                    <IconEdit />
                  </IconButton>
                </Tooltip>
              </>
            ) : (
              <ModalEditMultiAccount title="Chỉnh sửa" accountIds={selected} />
            )}
            <DialogDeleteAccount title="Xoá" accountIds={selected} />
          </>
        )}
        {/* {totalSelected < 1 && (
          <>
            <Tooltip title="Thêm tài khoản">
              <IconButton onClick={onOpenAddAccountModal}>
                <IconAdd />
              </IconButton>
            </Tooltip>
            <ModalAddMultiAccount title="Thêm nhiều tài khoản" />
          </>
        )} */}
      </Box>
    </Toolbar>
  )
}

const AccountsTable = () => {
  const [rows, setRows] = React.useState([])
  const [scriptsStatusList, setScriptsStatusList] = React.useState([])
  const [selected, setSelected] = React.useState([])
  const [openAddAccountModal, setOpenAddAccountModal] = React.useState(false)
  const timeoutCloseModalRef = React.useRef()

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = rows.map((n) => n.id)
      setSelected(newSelected)
      return
    }
    setSelected([])
  }

  const handleSelect = (event, recordId) => {
    const selectedIndex = selected.indexOf(recordId)
    let newSelected = []

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, recordId)
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1))
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1))
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      )
    }

    setSelected(newSelected)
  }

  const getAccountList = () => ipcMainConsumer.emit('getAccounts')

  React.useEffect(() => {
    getAccountList()
    ipcMainConsumer.on('replyGetAccounts', (event, values) => {
      setRows(values)
    })
    ipcMainConsumer.on('replyAccountsScriptsStatus', (event, values) =>
      setScriptsStatusList(values)
    )
    ipcMainConsumer.on('replyAddAccountResult', () => {
      getAccountList()
      handleCloseAddAccountModal()
      clearTimeout(timeoutCloseModalRef.current)
    })
    ipcMainConsumer.on('replyUpdateAccountResult', () => {
      getAccountList()
      handleCloseAddAccountModal()
      clearTimeout(timeoutCloseModalRef.current)
    })
    ipcMainConsumer.on('replyUpdateAccountsResult', () => {
      getAccountList()
    })
    ipcMainConsumer.on('replyDeleteAccountsResult', () => {
      setSelected([])
      getAccountList()
    })
    ipcMainConsumer.on('replyAddAccounts', () => {
      getAccountList()
    })
  }, [])

  const handleCloseAddAccountModal = () => setOpenAddAccountModal(false)

  const handleAddAccount = async (values) => {
    const newAccount = {
      profileId: values.account.profileId ? values.account.profileId.trim() : '',
      screenName: values.account.screenName ? values.account.screenName.trim() : '',
      displayName: values.account.displayName ? values.account.displayName.trim() : '',
      chatOpenAIKey: values.account.chatOpenAIKey.trim(),
      cookie: values.account.cookie.trim(),
      proxy: values.account.proxy.trim(),
      note: values.account.note.trim(),
      browserProfileName: values.account.browserProfileName.trim(),
      // hideMyAccProfileDir: values.account.hideMyAccProfileDir.trim(),
      features: values.features
    }
    if (values.id) {
      ipcMainConsumer.emit('updateAccount', { id: values.id, ...newAccount })
    } else {
      ipcMainConsumer.emit('addAccount', newAccount)
    }
    timeoutCloseModalRef.current = setTimeout(() => {
      handleCloseAddAccountModal()
    }, 30000)
  }

  const handlePlay = () => {
    if (selected.length) {
      setSelected([])
      ipcMainConsumer.emit('playScripts', selected)
    }
  }

  const handleStop = () => {
    if (selected.length) {
      setSelected([])
      ipcMainConsumer.emit('stopScripts', selected)
    }
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <EnhancedTableToolbar
          selected={selected}
          onOpenAddAccountModal={() => setOpenAddAccountModal(true)}
          onEdit={() => setOpenAddAccountModal(true)}
          onPlay={handlePlay}
          onStop={handleStop}
        />
        <TableContainer
          sx={{
            minHeight: 'calc(100vh - 170px)',
            maxHeight: 'calc(100vh - 170px)'
          }}
        >
          <Table stickyHeader sx={{ minWidth: 750 }} aria-labelledby="tableTitle" size="small">
            <EnhancedTableHead
              numSelected={selected.length}
              onSelectAllClick={handleSelectAllClick}
              rowCount={rows.length}
            />
            <TableBody>
              {rows.map((row) => {
                const recordId = row.id
                const isItemSelected = selected.indexOf(recordId) > -1
                const labelId = `enhanced-table-checkbox-${recordId}`
                const status = scriptsStatusList[recordId]
                return (
                  <TableRow
                    hover
                    onClick={(event) => handleSelect(event, recordId)}
                    role="checkbox"
                    aria-checked={isItemSelected}
                    tabIndex={-1}
                    key={row.id}
                    selected={isItemSelected}
                    classes={{ root: status ? 'row-playing' : '' }}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        checked={isItemSelected}
                        inputProps={{
                          'aria-labelledby': labelId
                        }}
                      />
                    </TableCell>
                    {ROW_BODY_COLUMNS.map((field) => {
                      let tableCellProps = {
                        sx: {
                          minWidth: 120,
                          maxWidth: 300,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          borderStyle: 'border-box',
                          whiteSpace: 'nowrap'
                        }
                      }
                      if (field === FIELDS.profileId) {
                        tableCellProps = {
                          ...tableCellProps,
                          component: 'th',
                          id: labelId,
                          scop: 'row',
                          padding: 'none'
                        }
                      }
                      return (
                        <TableCell {...tableCellProps} key={field}>
                          {row[field]}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      <ModalAddAccount
        open={openAddAccountModal}
        accountId={selected[0]}
        onClose={handleCloseAddAccountModal}
        onSave={handleAddAccount}
      />
    </Box>
  )
}

export default AccountsTable
