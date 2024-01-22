import React, { useState } from 'react'
import { Grid } from '@mui/material'
import { Container, Typography, TextField, Button, Paper } from '@mui/material'
import AppConfig from '../config/enums'
import { useNavigate } from 'react-router-dom'
import { useSnackbar } from '../context/SnackbarContext'

const RegistrationPage = () => {
  const navigate = useNavigate()
  const { openSnackbar } = useSnackbar()
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    teamsName: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prevState) => ({
      ...prevState,
      [name]: value
    }))
  }

  const backToLogin = async () => {
    navigate('/login')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { username, password, firstName, lastName, teamsName } = formData

    try {
      const response = await fetch(`${AppConfig.BASE_URL}/user/registration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          first_name: firstName,
          last_name: lastName,
          password,
          teams_name: teamsName
        })
      })

      if (response.ok) {
        // Handle success
        const data = await response.json()
        openSnackbar(data.message, 'success')
        navigate('/login')
      } else {
        const data = await response.json()
        openSnackbar(data.message, 'error')
      }
    } catch (error) {
      console.error(error.message)
      openSnackbar(error.message, 'error')
      // Handle errors in registration
    }
  }

  return (
    <Container component="main" maxWidth="xs">
      <Paper style={{ padding: 20, marginTop: 20 }}>
        <Typography component="h1" variant="h5">
          Sign Up
        </Typography>
        <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="username"
            label="Username"
            name="username"
            autoComplete="username"
            autoFocus
            value={formData.username}
            onChange={handleChange}
          />
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
          />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                id="firstName"
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                id="lastName"
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
          {/* <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="teamsName"
            label="Default Teams Name"
            name="teamsName"
            value={formData.teamsName}
            onChange={handleChange}
          /> */}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            style={{ marginTop: 20 }}
          >
            Sign Up
          </Button>
          <Button
            onClick={backToLogin}
            fullWidth
            variant="contained"
            color="info"
            style={{ marginTop: 20 }}
          >
            Black to login
          </Button>
        </form>
      </Paper>
    </Container>
  )
}

export default RegistrationPage
