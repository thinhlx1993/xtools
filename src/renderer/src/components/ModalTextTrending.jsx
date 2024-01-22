/* eslint-disable react/prop-types */
import React from 'react'
import {
  Box,
  CircularProgress,
  Typography,
  Modal,
  Stack,
  Button,
  TextField,
  FormControl,
  Divider,
  List,
  ListItem,
  ListItemText
} from '@mui/material'
import { ipcMainConsumer } from '../helpers/api'

const modalStyleCommon = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4
}

const ModalTextTrendingThirdIIntegration = ({ open, onClose, onSubmit }) => {
  const [isLoading, setIsLoading] = React.useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()
    setIsLoading(true)
    ipcMainConsumer.emit('crawlHashTagTrending', {
      region: event.target.region.value,
      total: event.target.total.value
    })
  }

  React.useEffect(() => {
    ipcMainConsumer.on('replyCrawlHashTagTrending', (event, values) => {
      onSubmit(values)
      onClose()
      setIsLoading(false)
    })
  }, [])

  return (
    <Modal open={open}>
      <Box sx={modalStyleCommon} pointerEvents="none">
        <Box sx={{ m: 1, position: 'relative' }}>
          {isLoading && (
            <CircularProgress
              size={50}
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                marginTop: '-12px',
                marginLeft: '-12px'
              }}
            />
          )}
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Trends24
          </Typography>
          <form onSubmit={handleSubmit}>
            <FormControl fullWidth size="small">
              <TextField
                name="region"
                label="Khu vực"
                variant="filled"
                placeholder="Ví dụ: united-states"
                defaultValue="united-states"
                sx={{ pb: 1.5 }}
              />
              <TextField
                name="total"
                label="Số lượng"
                variant="filled"
                type="number"
                defaultValue={5}
                sx={{ pb: 1.5 }}
                inputProps={{
                  min: 1
                }}
              />
            </FormControl>
            <Stack sx={{ pt: 2 }} spacing={2} direction="row">
              <Button onClick={onClose} size="small">
                Huỷ
              </Button>
              <Button size="small" type="submit" variant="contained" color="primary">
                Xác nhận
              </Button>
            </Stack>
          </form>
        </Box>
      </Box>
    </Modal>
  )
}

const ModalTextTrending = ({ open, onClose, onSubmit, values }) => {
  const [openSubModal, setOpenSubModal] = React.useState(false)
  const [hashTagList, setHashTagList] = React.useState(values)

  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit(hashTagList)
  }

  React.useEffect(() => {
    setHashTagList(values)
  }, [values])

  return (
    <Modal
      open={open}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={modalStyleCommon} noValidate>
        <Typography id="modal-modal-title" variant="h6" component="h2">
          Danh sách HashTag Trending
        </Typography>
        <form onSubmit={handleSubmit}>
          <Box>
            <Divider />
            <List sx={{ maxHeight: 300, overflow: 'auto' }}>
              {hashTagList.map((hashTag) => (
                <ListItem disablePadding key={hashTag}>
                  <ListItemText primary={hashTag} />
                </ListItem>
              ))}
              {!hashTagList.length && <Box sx={{ p: 2 }}></Box>}
            </List>
            <Divider />
          </Box>
          <FormControl>
            <Stack sx={{ pt: 2 }} spacing={2} direction="row">
              <Button onClick={onClose} size="small">
                Huỷ
              </Button>
              <Button size="small" type="submit" variant="contained" color="primary">
                Xác nhận
              </Button>
              <Button onClick={() => setOpenSubModal(true)}>Trends24</Button>
            </Stack>
          </FormControl>
        </form>
        <ModalTextTrendingThirdIIntegration
          open={openSubModal}
          onClose={() => setOpenSubModal(false)}
          onSubmit={(values) => setHashTagList(values)}
        />
      </Box>
    </Modal>
  )
}

export default ModalTextTrending
