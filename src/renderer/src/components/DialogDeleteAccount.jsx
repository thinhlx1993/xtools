/* eslint-disable react/prop-types */
import React from 'react'
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  IconButton,
  CircularProgress,
  Button
} from '@mui/material'
import { Delete as IconDelete } from '@mui/icons-material'
import { ipcMainConsumer } from '../helpers/api'

const DialogDeleteAccount = ({ title, accountIds }) => {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    ipcMainConsumer.on('replyDeleteAccountsResult', () => {
      setLoading(false)
      setOpen(false)
    })
  }, [])

  const handleDelete = () => {
    if (accountIds.length) {
      ipcMainConsumer.emit('deleteAccounts', accountIds)
    }
  }

  const confirmDeleteDialog = React.useMemo(() => {
    if (!open) {
      return null
    }
    return (
      <Dialog maxWidth="xs" open={open}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
            <Box sx={{ display: 'flex' }}>
              <CircularProgress />
            </Box>
          </Box>
        ) : (
          <>
            <DialogTitle>Bạn có chắc?</DialogTitle>
            <DialogContent dividers>
              Bạn muốn xoá {accountIds.length} tài khoản đã chọn phải không?
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpen(false)}>Huỷ</Button>
              <Button color="error" onClick={handleDelete}>
                Xác nhận
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    )
  }, [open, loading, accountIds])

  return (
    <>
      <Tooltip title={title}>
        <IconButton onClick={() => setOpen(true)}>
          <IconDelete />
        </IconButton>
      </Tooltip>
      {confirmDeleteDialog}
    </>
  )
}

export default DialogDeleteAccount
