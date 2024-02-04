import { useState, useEffect } from 'react'
import {
  Button,
  TextField,
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  DialogContentText,
  IconButton,
  Grid
} from '@mui/material'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import EditIcon from '@mui/icons-material/Edit'
import AppConfig from '../config/enums'
import { BROWSER_TYPE } from '../helpers/constants'
import { useSnackbar } from '../context/SnackbarContext' // Update this path as needed

const HMAUsersPage = () => {
  const [users, setUsers] = useState([])
  const [hmaToken, setHMAToken] = useState('')
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false)
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState({})
  const [searchQuery, setSearchQuery] = useState('')
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
    fetchUsers()
  }, [hmaToken])

  const loginHMA = async (username, password) => {
    const authHeader = `HMA credentials ${username} ${password}`
    console.log(authHeader)
    try {
      const response = await fetch(`${AppConfig.HMA_BASE_URL}/auth/`, {
        headers: {
          Authorization: `Basic ${btoa(`${username}:${password}`)}`
        },
        method: 'POST',
        body: JSON.stringify({ version: '3049' })
      })
      if (response.ok) {
        const data = await response.json()
        if (data.code === 1) {
          setHMAToken(data.result.token) // Assuming the response has a 'groups' field
          await fetchUsers()
        }
      } else {
        openSnackbar('Failed to fetch HMA Tokens', 'error')
      }
    } catch (error) {
      console.log('Error fetching settings')
    }
  }

  const handleGetSettings = async () => {
    try {
      if (!hmaToken) {
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
            await loginHMA(
              data.settings.settings.hideMyAccAccount,
              data.settings.settings.hideMyAccPassword
            )
          }
        } else {
          openSnackbar('Failed to fetch settings', 'error')
        }
      }
    } catch (error) {
      console.log('Error fetching settings')
    }
  }

  const fetchUsers = async () => {
    try {
      if (hmaToken) {
        const response = await fetch(`${AppConfig.HMA_BASE_URL}/members/team/tuan`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${hmaToken}`
          }
        })
        const data = await response.json()
        if (data.code === 1) {
          const filteredResult = data.result.filter((item) => !item.isDeleted)
          setUsers(filteredResult)
        }
      }
    } catch (error) {
      openSnackbar('Error fetching users', 'error')
    }
  }

  const handleOpenEditUserDialog = (user) => {
    setCurrentUser(user)
    setEditUserDialogOpen(true)
  }

  const handleOpenAddUserDialog = (user) => {
    setCurrentUser(user)
    setAddUserDialogOpen(true)
  }

  const handleCloseEditUserDialog = () => {
    setEditUserDialogOpen(false)
  }

  const handleCloseAddUserDialog = () => {
    setAddUserDialogOpen(false)
  }

  const handleAddUserSubmit = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    console.log(formData)
    const updatedUser = {
      email: formData.get('email'),
      password: formData.get('password'),
      name: formData.get('name'),
      notes: formData.get('notes'),
      profiles: Number(formData.get('profiles'))
      // Add other fields as needed
    }
    try {
      const response = await fetch(`${AppConfig.HMA_BASE_URL}/members/team/tuan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${hmaToken}`
        },
        body: JSON.stringify(updatedUser)
      })
      if (response.ok) {
        openSnackbar('Create a new user successfully', 'success')
        await fetchUsers()
        handleCloseAddUserDialog()
      } else {
        openSnackbar('Failed to add new user', 'error')
      }
    } catch (error) {
      openSnackbar('Error creating new user', 'error')
    }
  }

  const handleEditUserSubmit = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    console.log(formData)
    const updatedUser = {
      profiles: Number(formData.get('maxProfiles'))
      // Add other fields as needed
    }
    try {
      const response = await fetch(
        `${AppConfig.HMA_BASE_URL}/members/team/tuan/${currentUser.email}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${hmaToken}`
          },
          body: JSON.stringify(updatedUser)
        }
      )
      if (response.ok) {
        openSnackbar('User updated successfully', 'success')
        await fetchUsers()
        handleCloseEditUserDialog()
      } else {
        openSnackbar('Failed to update user', 'error')
      }
    } catch (error) {
      openSnackbar('Error updating user', 'error')
    }
  }

  const handleOpenDeleteDialog = (user) => {
    setCurrentUser(user)
    setDeleteDialogOpen(true)
  }

  const handleDeleteUserConfirm = async () => {
    try {
      const response = await fetch(
        `${AppConfig.API_ENDPOINT}/members/team/tuan/${currentUser.email}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${hmaToken}`
          }
        }
      )
      if (response.ok) {
        openSnackbar('User deleted successfully', 'success')
        await fetchUsers()
        handleCloseDeleteDialog()
      } else {
        openSnackbar('Failed to delete user', 'error')
      }
    } catch (error) {
      openSnackbar('Error deleting user', 'error')
    }
  }

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false)
  }

  return (
    <Container>
      <Grid container alignItems="center">
        <Grid item xs>
          <Typography variant="h4" style={{ margin: '20px 0' }}>
            HMA User Management
          </Typography>
        </Grid>

        <Grid item>
          <Button variant="contained" color="primary" onClick={() => handleOpenAddUserDialog({})}>
            Add a new User
          </Button>
        </Grid>
        <TextField
          label="Search Users"
          variant="outlined"
          fullWidth
          style={{ margin: '20px 0' }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </Grid>

      <Paper style={{ marginTop: 20 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Profiles</TableCell>
              <TableCell>Notes</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users
              .filter(
                (user) =>
                  user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  user.email.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.profiles}/{user.maxProfiles}
                  </TableCell>
                  <TableCell>{user.notes}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpenEditUserDialog(user)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleOpenDeleteDialog(user)} color="error">
                      <DeleteForeverIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Paper>
      <Dialog open={addUserDialogOpen} onClose={handleCloseAddUserDialog}>
        <form onSubmit={handleAddUserSubmit}>
          <DialogTitle>Add New User</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              id="email"
              name="email"
              label="Emails"
              fullWidth
              defaultValue={currentUser.email}
            />
            <TextField
              margin="dense"
              id="password"
              name="password"
              label="Password"
              fullWidth
              defaultValue={currentUser.password}
            />
            <TextField
              margin="dense"
              id="profiles"
              name="profiles"
              label="Profiles"
              fullWidth
              type="number"
              defaultValue={currentUser.profiles}
            />
            <TextField
              margin="dense"
              id="name"
              name="name"
              label="Name"
              fullWidth
              defaultValue={currentUser.name}
            />
            <TextField
              margin="dense"
              id="notes"
              name="notes"
              label="Notes"
              fullWidth
              defaultValue={currentUser.notes}
            />
            {/* Include other fields as necessary */}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAddUserDialog}>Cancel</Button>
            <Button type="submit">Submit</Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={editUserDialogOpen} onClose={handleCloseEditUserDialog}>
        <form onSubmit={handleEditUserSubmit}>
          <DialogTitle>{currentUser.id ? 'Edit User' : 'Add New User'}</DialogTitle>
          <DialogContent>
            <TextField
              disabled
              margin="dense"
              id="email"
              name="email"
              label="Emails"
              fullWidth
              defaultValue={currentUser.email}
            />
            <TextField
              autoFocus
              margin="dense"
              id="maxProfiles"
              name="maxProfiles"
              label="maxProfiles"
              fullWidth
              type="number"
              defaultValue={currentUser.maxProfiles}
            />
            {/* Include other fields as necessary */}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseEditUserDialog}>Cancel</Button>
            <Button type="submit">Submit</Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to delete this user?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteUserConfirm} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default HMAUsersPage
