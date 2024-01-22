/* eslint-disable react/prop-types */
import React from 'react'
import {
  Box,
  TextField,
  Typography,
  Modal,
  FormControl,
  Stack,
  Button,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import { Settings as IconSetting, Tag as IconTag, Sync } from '@mui/icons-material'
import { ipcMainConsumer } from './helpers/api'
import ModalTextTrending from './components/ModalTextTrending'
import { BROWSER_OPTIONS, hideMyAccAPIRoot } from './helpers/constants'
import { BROWSER_TYPE } from './helpers/constants'
import { boxModalCommon } from './helpers/style-common'
import AppConfig from './config/enums'

const ModalSetting = ({ open, onSubmit, values }) => {
  const [browserOption, setBrowserOption] = React.useState(values.browser.browserOption)

  React.useEffect(() => {
    setBrowserOption(values.browser.browserOption)
  }, [values.browser.browserOption])

  const handleSubmit = (event) => {
    event.preventDefault()
    if (browserOption === BROWSER_TYPE.hideMyAcc) {
      const hideMyAcc = {
        browserExecutablePath: event.target.hideMyAccBrowserExecutablePath.value,
        browserVersion: event.target.hideMyAccBrowserVersion.value,
        apiRoot: hideMyAccAPIRoot,
        username: event.target.hideMyAccUsername.value,
        password: event.target.hideMyAccPassword.value
      }
      if (Object.values(hideMyAcc).some((value) => !value)) return
      onSubmit({
        browserExecutablePath: values.browserExecutablePath,
        browser: {
          browserOption,
          hideMyAcc
        }
      })
      return
    }

    onSubmit({
      browserExecutablePath: event.target.browserExecutablePath.value,
      browser: {
        browserOption,
        hideMyAcc: values.browser.hideMyAcc
      }
    })
  }

  return (
    <Modal
      open={open}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={boxModalCommon} noValidate>
        <Typography id="modal-modal-title" variant="h6" component="h2" sx={{ pb: 1 }}>
          Cài đặt ứng dụng
        </Typography>
        <Typography id="sub-modal-title" variant="h7" component="h6" sx={{ pb: 1 }}>
          <span>Hiện tại không khả dụng, vui lòng sử dụng menu Settings</span>
        </Typography>

        <form onSubmit={handleSubmit}>
          <FormControl fullWidth size="small" variant="filled">
            <InputLabel id="browserOption-label">Loại trình duyệt</InputLabel>
            <Select
              labelId="browserOption-label"
              label="Loại trình duyệt"
              id="browserOption"
              name="browserOption"
              value={browserOption}
              onChange={(event) => setBrowserOption(event.target.value)}
            >
              {BROWSER_OPTIONS.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </Select>
            {browserOption === BROWSER_TYPE.hideMyAcc ? (
              <>
                <TextField
                  name="hideMyAccBrowserExecutablePath"
                  variant="filled"
                  label="Đường dẫn trình duyệt"
                  placeholder="Example: C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
                  defaultValue={values.browser.hideMyAcc.browserExecutablePath || ''}
                  sx={{ mt: 1.5 }}
                />
                <TextField
                  name="hideMyAccBrowserVersion"
                  variant="filled"
                  label="Phiên bản trình duyệt rình duyệt"
                  placeholder="Example: 117 | 118 | 119"
                  defaultValue={values.browser.hideMyAcc.browserVersion || ''}
                  sx={{ mt: 1.5 }}
                />
                <TextField
                  name="hideMyAccUsername"
                  variant="filled"
                  label="Tên đăng nhập"
                  placeholder="Example: user@email.com"
                  defaultValue={values.browser.hideMyAcc.username || ''}
                  sx={{ mt: 1.5 }}
                />
                <TextField
                  name="hideMyAccPassword"
                  variant="filled"
                  label="Mật khẩu"
                  type="password"
                  placeholder="******"
                  defaultValue={values.browser.hideMyAcc.password || ''}
                  sx={{ mt: 1.5 }}
                />
              </>
            ) : (
              <TextField
                name="browserExecutablePath"
                variant="filled"
                label="Đường dẫn trình duyệt"
                placeholder="Example: C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
                defaultValue={values.browserExecutablePath}
                sx={{ mt: 1.5 }}
              />
            )}
          </FormControl>
          <FormControl>
            <Stack sx={{ pt: 1.5 }} spacing={2} direction="row">
              <Button size="small" type="submit" variant="contained" color="primary">
                Đóng
              </Button>
            </Stack>
          </FormControl>
        </form>
      </Box>
    </Modal>
  )
}

const Header = () => {
  const [appSettings, setAppSettings] = React.useState({
    browserExecutablePath: '',
    browser: {
      browserOption: BROWSER_TYPE.chrome,
      hideMyAcc: {}
    }
  })
  const [trendingList, setTrendingList] = React.useState([])
  const [openModalSetting, setOpenModalSetting] = React.useState(false)
  const [openModalTrending, setOpenModalTrending] = React.useState(false)
  const [disableSyncButton, setdisableSyncButton] = React.useState(false)

  React.useEffect(() => {
    ipcMainConsumer.emit('getAppSettings')
    ipcMainConsumer.emit('getHashTagList')
    ipcMainConsumer.on('replyGetAppSettings', (event, stringValues) => {
      setAppSettings(JSON.parse(stringValues))
    })
    ipcMainConsumer.on('replyGetHashTagList', (event, values) => {
      setTrendingList(values)
    })
  }, [])

  // Sync data with backend
  const handleSyncAccount = async () => {
    setdisableSyncButton(true)
    try {
      const response = await fetch(`${AppConfig.BASE_URL}/profiles/user`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()

        console.log(`Found ${data.profiles.length}`)
        for (const profile of data.profiles) {
          const currentDate = new Date()
          const newAccount = {
            profileId: profile.profile_id,
            screenName: profile.username,
            displayName: profile.username,
            chatOpenAIKey: profile.gpt_key,
            cookie: profile.cookies,
            proxy: profile.proxy,
            note: profile.notes ? profile.notes : `Profile Sync at: ${currentDate}`,
            browserProfileName: profile.username,
            features: []
          }
          console.log(`Check account ${profile.username}`)
          ipcMainConsumer.emit('addAccount', newAccount)
        }
        setdisableSyncButton(false)
      }
    } catch (error) {
      setdisableSyncButton(false)
    }
  }

  const onSubmitModalSetting = (values) => {
    setAppSettings(values)
    setOpenModalSetting(false)
    console.log(values)
    ipcMainConsumer.emit('updateAppSettings', JSON.stringify(values))
  }

  const onSubmitModalTrending = (values) => {
    setTrendingList(values)
    setOpenModalTrending(false)
    ipcMainConsumer.emit('updateHashTagList', values)
  }

  return (
    <Box sx={{ pt: 2, pb: 1 }}>
      <Stack spacing={2} direction="row">
        {/* <Button
          size="small"
          startIcon={<IconSetting />}
          variant="outlined"
          onClick={() => setOpenModalSetting(true)}
        >
          Cài đặt ứng dụng
        </Button> */}
        <Button
          disabled={disableSyncButton}
          startIcon={<Sync />}
          size="small"
          variant="outlined"
          onClick={() => handleSyncAccount()}
        >
          Đồng bộ dữ liệu
        </Button>
        <Button
          size="small"
          startIcon={<IconTag />}
          variant="outlined"
          onClick={() => setOpenModalTrending(true)}
        >
          Trending
        </Button>
      </Stack>
      <ModalSetting open={openModalSetting} onSubmit={onSubmitModalSetting} values={appSettings} />
      <ModalTextTrending
        open={openModalTrending}
        onClose={() => setOpenModalTrending(false)}
        onSubmit={onSubmitModalTrending}
        values={trendingList}
      />
    </Box>
  )
}

export default Header
