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
  MenuItem
} from '@mui/material'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import AppConfig from '../config/enums'
import { useSnackbar } from '../context/SnackbarContext'

const UsersPage = () => {
  const [users, setUsers] = useState([])
  const [newUserName, setNewUserName] = useState('') // Initialize newUserName
  const [newUserRole, setNewUserRole] = useState('')
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false)
  const { openSnackbar } = useSnackbar()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userIdToDelete, setUserIdToDelete] = useState(null)

  // Fetch users
  useEffect(() => {
    fetch(`${AppConfig.BASE_URL}/user`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('access_token')}`
      }
    })
      .then((res) => res.json())
      .then((data) => setUsers(data.user_list))
      .catch((error) => console.error('Error fetching users:', error))
  }, [])

  const handleOpenAddUserDialog = () => {
    setAddUserDialogOpen(true)
  }

  const handleCloseAddUserDialog = () => {
    setAddUserDialogOpen(false)
  }

  const reloadUserList = async () => {
    const response = await fetch(`${AppConfig.BASE_URL}/user`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('access_token')}`
      }
    })
    if (response.ok) {
      const data = await response.json()
      setUsers(data.user_list)
    }
  }

  const handleCreateNewUser = async () => {
    const roleIds = {
      admin: AppConfig.ADMIN_ROLE_ID, // Replace with actual admin role ID
      user: AppConfig.CLIENT_ROLE_ID // Replace with actual user role ID
    }

    // Prepare the request body
    const requestBody = {
      username: newUserName,
      role_id: roleIds[newUserRole]
    }

    try {
      const response = await fetch(`${AppConfig.BASE_URL}/teams/user`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        openSnackbar(`${newUserName} added successfully`, 'success')
        await reloadUserList()
      } else {
        const jsonResponse = await response.json()
        openSnackbar(jsonResponse.message, 'error')
      }

      // Handle the successful response here
      // Example: Update the user list and show a success message
      console.log('User created successfully')
      // You might want to fetch the updated list of users here
    } catch (error) {
      openSnackbar('Add new user failed', 'error')
      console.error('Error creating user:', error.message)
      // Handle errors, such as showing an error message to the user
    }
    // API call to create a new user with newUserName and newUserRole
    // After successful creation, close the dialog and refresh the user list
    handleCloseAddUserDialog()
  }

  const handleOpenDeleteDialog = (userId) => {
    setUserIdToDelete(userId)
    setDeleteDialogOpen(true)
  }

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false)
  }

  const handleDeleteUserConfirm = async () => {
    try {
      const response = await fetch(`${AppConfig.BASE_URL}/teams/user?username=${userIdToDelete}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      })

      if (response.ok) {
        openSnackbar('User deleted successfully', 'success')
        await reloadUserList() // Reload the user list
      } else {
        const jsonResponse = await response.json()
        openSnackbar(jsonResponse.message, 'error')
      }
    } catch (error) {
      openSnackbar('Error deleting user', 'error')
      console.error('Error deleting user:', error)
    }

    handleCloseDeleteDialog()
  }

  return (
    <Container>
      <Typography variant="h4" gutterBottom style={{ marginTop: '20px' }}>
        Users Management
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={handleOpenAddUserDialog}
        style={{ marginBottom: '20px' }}
      >
        Add New User
      </Button>
      <Paper style={{ padding: '20px', marginBottom: '20px' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User Name</TableCell>
              <TableCell>Created at</TableCell>
              <TableCell>Last active at</TableCell>
              <TableCell>Roles</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.user_id}>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.created_at}</TableCell>
                <TableCell>{user.last_active_at}</TableCell>
                <TableCell>{user.roles}</TableCell>
                <TableCell>
                  <IconButton color="error" onClick={() => handleOpenDeleteDialog(user.username)}>
                    <DeleteForeverIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <Dialog open={addUserDialogOpen} onClose={handleCloseAddUserDialog}>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="normal"
            required
            fullWidth
            id="new-username"
            label="Username"
            name="username"
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
          />
          <TextField
            select
            label="Role"
            value={newUserRole}
            onChange={(e) => setNewUserRole(e.target.value)}
            fullWidth
            margin="normal"
          >
            <MenuItem value="user">User</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddUserDialog}>Cancel</Button>
          <Button onClick={handleCreateNewUser}>Add</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Remove User</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to remove this user?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteUserConfirm} color="error">
            Remove
          </Button>
        </DialogActions>
      </Dialog>
      {/* Add Dialog for Creating and Editing Users */}
      {/* Add Dialog for Confirming User Deletion */}
    </Container>
  )
}

export default UsersPage
