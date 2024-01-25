import React, { useState, useEffect } from 'react'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import { useNavigate } from 'react-router-dom'
import { useSnackbar } from '../context/SnackbarContext'
import { ipcMainConsumer } from '../helpers/api'

const LoginForm = ({ onLogin }) => {
  const navigate = useNavigate()
  const { openSnackbar } = useSnackbar()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const [deviceId, setDeviceId] = useState('')

  useEffect(() => {
    ipcMainConsumer.emit('fetchMachineId')
    ipcMainConsumer.on('replyGetMachineId', (event, result) => {
      if (result) {
        setDeviceId(result)
      }
    })
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    const response = await onLogin(username, password, deviceId)
    if (response) {
      const userRole = response.userRole
      const data = response.data

      if (userRole) {
        openSnackbar(data.message, 'success')
        navigate('/admin/profiles')
      } else {
        navigate('/login')
        openSnackbar(data.message, 'error')
      }
    } else {
      openSnackbar('Failed to login, try again later!', 'error')
    }
  }

  const handleRegistration = async (event) => {
    event.preventDefault()
    navigate('/registration') // or '/admin' based on the role
  }

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <form onSubmit={handleSubmit} noValidate>
          <Typography variant="h4">Sign in to XGPT tools</Typography>
          <Typography>Node ID: {deviceId}</Typography>
          <Typography variant="body2" sx={{ mt: 2, mb: 5 }} onClick={handleRegistration}>
            Don’t have an account? Register here.
          </Typography>

          <Divider sx={{ my: 3 }}></Divider>

          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Username"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" fullWidth variant="contained" color="primary" sx={{ mt: 3, mb: 2 }}>
            Sign In
          </Button>
        </form>
      </Box>
    </Container>
  )
}

export default LoginForm
