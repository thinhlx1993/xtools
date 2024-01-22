/* eslint-disable react/prop-types */
import React from 'react'
import {
  Alert,
  Box,
  FormControl,
  Button,
  Modal,
  CircularProgress,
  Tooltip,
  IconButton
} from '@mui/material'
import { Edit as IconEdit } from '@mui/icons-material'
import { ipcMainConsumer } from '../helpers/api'
import { FEATURE_OPTION_DEFAULT } from '../helpers/constants'
import { boxModalCommon } from '../helpers/style-common'
import FormSetupFeaturesV2 from './FormSetupFeaturesV2'

const ModalEditMultiAccountModalBody = ({ loading, onCancel, onSave }) => {
  const [data, setData] = React.useState(FEATURE_OPTION_DEFAULT)
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
        <Box sx={{ display: 'flex' }}>
          <CircularProgress />
        </Box>
      </Box>
    )
  }
  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ pb: 1 }}>
        <Alert severity="warning">
          Lưu ý:
          <br />
          - Bạn đang chỉnh sửa kịch bản cho nhiều tài khoản.
          <br />- Đây sẽ là kịch bản mới áp dụng cho các tài khoản đang chỉnh sửa.
        </Alert>
      </Box>

      <React.Fragment>
        <Box sx={{ pt: 2 }}>
          <Box>
            <FormControl fullWidth size="small">
              <FormSetupFeaturesV2
                values={data}
                onChange={({ type, value }) => {
                  setData((prevData) => ({
                    ...prevData,
                    [type]: {
                      ...prevData[type],
                      ...value
                    }
                  }))
                }}
              />
            </FormControl>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
          <Box sx={{ flex: '1 1 auto' }} />
          <Button size="small" color="inherit" onClick={onCancel} sx={{ mr: 1 }}>
            Huỷ bỏ
          </Button>
          <Button size="small" onClick={() => onSave(data)}>
            Cập nhật
          </Button>
        </Box>
      </React.Fragment>
    </Box>
  )
}

const ModalEditMultiAccount = ({ title, accountIds }) => {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    ipcMainConsumer.on('replyUpdateAccountsResult', () => {
      setOpen(false)
      setLoading(false)
    })
  }, [])

  const handleSave = (values) => {
    console.log('values', values)
    setLoading(true)
    ipcMainConsumer.emit('updateAccounts', {
      accountIds,
      features: values
    })
  }

  const modalEditMultiAccount = React.useMemo(() => {
    return (
      <Modal open={open}>
        <Box sx={{ ...boxModalCommon, width: 700 }} noValidate>
          <ModalEditMultiAccountModalBody
            loading={loading}
            onSave={handleSave}
            onCancel={() => setOpen(false)}
          />
        </Box>
      </Modal>
    )
  }, [open, loading, accountIds])

  return (
    <>
      <Tooltip title={title}>
        <IconButton onClick={() => setOpen(true)}>
          <IconEdit />
        </IconButton>
      </Tooltip>
      {modalEditMultiAccount}
    </>
  )
}

export default ModalEditMultiAccount
