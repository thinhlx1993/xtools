import { useState, useEffect } from 'react'
import {
  Container,
  TextField,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Grid,
  Typography
} from '@mui/material'
import { useSnackbar } from '../context/SnackbarContext'
import AppConfig from '../config/enums'
import { ipcMainConsumer } from '../helpers/api'
import { BROWSER_TYPE, hideMyAccAPIRoot } from '../helpers/constants'

const SettingsPage = () => {
  const { openSnackbar } = useSnackbar()
  const [settings, setSettings] = useState({
    browserPath: '',
    browserType: BROWSER_TYPE.hideMyAcc,
    browserVersion: '',
    folderPath: '',
    hideMyAccAccount: '',
    hideMyAccPassword: '',
    chatGptKey: '',
    defaultCaptchaResolve: 'capguru',
    capguruKey: '',
    smsPoolKey: ''
  })

  useEffect(() => {
    handleGetSettings()
  }, [])

  const handleChange = (event) => {
    setSettings({ ...settings, [event.target.name]: event.target.value })
  }

  const handleGetSettings = async (result) => {
    try {
      const response = await fetch(`${AppConfig.BASE_URL}/settings/`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        if (data.settings) {
          setSettings(data.settings.settings) // Assuming the response has a 'groups' field
        }
      } else {
        openSnackbar('Failed to fetch settings', 'error')
      }
    } catch (error) {
      console.log('Error fetching settings')
    }
  }

  const handleSubmit = async () => {
    // Save settings to localStorage
    const response = await fetch(`${AppConfig.BASE_URL}/settings/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify({
        settings: settings
      })
    })

    if (response.ok) {
      // Handle success
      const data = await response.json()

      // Sync with old app settings
      ipcMainConsumer.emit(
        'updateAppSettings',
        JSON.stringify({
          browserExecutablePath: settings.browserPath,
          browser: {
            browserOption: settings.browserType,
            hideMyAcc: {
              apiRoot: hideMyAccAPIRoot,
              browserExecutablePath: settings.browserPath,
              browserVersion: settings.browserVersion,
              password: settings.hideMyAccPassword,
              username: settings.hideMyAccAccount
            }
          }
        })
      )
      openSnackbar(data.message, 'success')
    } else {
      openSnackbar('Save error', 'error')
    }
  }

  return (
    <Container maxWidth="md">
      <Typography variant="h4" gutterBottom style={{ marginTop: 20 }}>
        Settings
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Browser Type</InputLabel>
            <Select
              name="browserType"
              value={settings.browserType}
              onChange={handleChange}
              label="Browser Type"
            >
              <MenuItem value={BROWSER_TYPE.hideMyAcc}>HideMyAcc</MenuItem>
              <MenuItem value={BROWSER_TYPE.chrome}>Chrome</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TextField
              required
              label="Path to chrome.exe"
              value={settings.browserPath}
              InputProps={{
                readOnly: true
              }}
              fullWidth
              style={{ flexGrow: 1 }}
            />
            <Button variant="contained" component="label">
              Browser
              <input
                type="file"
                hidden
                onChange={(e) => {
                  if (e.target.files[0]) {
                    // Extracting directory path from file path
                    const filePath = e.target.files[0].path // or e.target.files[0].webkitRelativePath
                    setSettings({
                      ...settings,
                      browserPath: filePath
                    })
                  }
                }}
              />
            </Button>
          </div>
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Profiles Folder"
            name="folderPath"
            value={settings.folderPath}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Browser Version</InputLabel>
            <Select
              name="browserVersion"
              value={settings.browserVersion}
              onChange={handleChange}
              label="browserVersion"
            >
              <MenuItem value="117">117</MenuItem>
              <MenuItem value="118">118</MenuItem>
              <MenuItem value="119">119</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="HideMyAcc Account"
            name="hideMyAccAccount"
            value={settings.hideMyAccAccount}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="HideMyAcc Password"
            name="hideMyAccPassword"
            value={settings.hideMyAccPassword}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="ChatGPT Key"
            name="chatGptKey"
            value={settings.chatGptKey}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Default Captcha Resolve</InputLabel>
            <Select
              name="defaultCaptchaResolve"
              value={settings.defaultCaptchaResolve}
              onChange={handleChange}
              label="Default Captcha Resolve"
            >
              <MenuItem value="capguru">cap.guru</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="capguruKey"
            name="capguruKey"
            value={settings.capguruKey}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="smsPoolKey"
            name="smsPoolKey"
            value={settings.smsPoolKey}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} style={{ marginBottom: 20 }}>
          <Button variant="contained" color="primary" onClick={handleSubmit}>
            Save Settings
          </Button>
        </Grid>
      </Grid>
    </Container>
  )
}

export default SettingsPage
