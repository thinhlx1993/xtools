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
  MenuItem,
  Grid,
  TablePagination
} from '@mui/material'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import AppConfig from '../config/enums'
import { useSnackbar } from '../context/SnackbarContext'
import { getRequest } from '../helpers/backend'
import EditIcon from '@mui/icons-material/Edit'

const UsersPage = () => {
  const [users, setUsers] = useState([])
  const [groups, setGroups] = useState([])
  const [newUserName, setNewUserName] = useState('') // Initialize newUserName
  const [newUserRole, setNewUserRole] = useState('')
  const [newUserExpiredDate, setNewUserExpiredDate] = useState(90)
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false)
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false)
  const { openSnackbar } = useSnackbar()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userIdToDelete, setUserIdToDelete] = useState(null)
  const [userIdToEdit, setUserIdToEdit] = useState(null)
  const [selectedGroup, setSelectedGroup] = useState('')
  const [resultCount, setResultCount] = useState(0)
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(25)
  // Fetch users
  useEffect(() => {
    fetchUsers()
    fetchGroups()
  }, [page, rowsPerPage, searchQuery])

  const fetchGroups = async () => {
    const response = await getRequest(`/groups`)
    setGroups(response.data)
  }

  const fetchUsers = async () => {
    const response = await getRequest(
      `/user?page=${page}&per_page=${rowsPerPage}&filter=${searchQuery}`
    )
    openSnackbar(`Get users success`, 'success')
    setResultCount(response.data.result_count)
    setUsers(response.data.data)
  }

  const handleChangePage = (event, newPage) => {
    setPage(newPage + 1)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value)
    setPage(1) // Reset to the first page when changing rows per page
  }

  const handleOpenAddUserDialog = () => {
    setAddUserDialogOpen(true)
  }

  const handleCloseAddUserDialog = () => {
    setAddUserDialogOpen(false)
  }

  const handleCreateNewUser = async () => {
    const roleIds = {
      admin: AppConfig.ADMIN_ROLE_ID, // Replace with actual admin role ID
      user: AppConfig.CLIENT_ROLE_ID // Replace with actual user role ID
    }

    if (selectedGroup === '' || newUserRole === '') {
      openSnackbar(`Group and Role is required`, 'error')
      return
    }

    // Prepare the request body
    const requestBody = {
      username: newUserName,
      role_id: roleIds[newUserRole],
      group_id: selectedGroup
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
        // API call to create a new user with newUserName and newUserRole
        // After successful creation, close the dialog and refresh the user list
        // handleCloseAddUserDialog()
        await fetchUsers()
      } else {
        const jsonResponse = await response.json()
        openSnackbar(jsonResponse.message, 'error')
      }
    } catch (error) {
      openSnackbar('Add new user failed', 'error')
      console.error('Error creating user:', error.message)
      // Handle errors, such as showing an error message to the user
    }
  }
  const handleEditProfile = (profileId) => {
    setUserIdToEdit(profileId)
    setEditUserDialogOpen(true)
  }
  const handleOpenDeleteDialog = (userId) => {
    setUserIdToDelete(userId)
    setDeleteDialogOpen(true)
  }

  const handleCloseEditDialog = () => {
    setEditUserDialogOpen(false)
  }

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false)
  }

  const handleEditUserConfirm = async () => {
    try {
      const requestBody = {
        group_id: selectedGroup
      }
      const response = await fetch(`${AppConfig.BASE_URL}/teams/user?username=${userIdToEdit}`, {
        method: 'PUT',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        openSnackbar('User updated successfully', 'success')
        fetchUsers() // Reload the user list
        handleCloseEditDialog()
      } else {
        const jsonResponse = await response.json()
        openSnackbar(jsonResponse.message, 'error')
      }
    } catch (error) {
      openSnackbar('Error deleting user', 'error')
      console.error('Error deleting user:', error)
    }
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
        openSnackbar('User updated successfully', 'success')
        fetchUsers() // Reload the user list
        handleCloseEditDialog()
      } else {
        const jsonResponse = await response.json()
        openSnackbar(jsonResponse.message, 'error')
      }
    } catch (error) {
      openSnackbar('Error deleting user', 'error')
      console.error('Error deleting user:', error)
    }
  }

  // Debounce function
  const debounce = (func, delay) => {
    let timer
    return function (...args) {
      const context = this
      clearTimeout(timer)
      timer = setTimeout(() => func.apply(context, args), delay)
    }
  }

  // Function to handle input change with debounce
  const handleInputChange = debounce((value) => {
    setSearchQuery(value)
  }, 50) // Adjust the delay as needed (300ms in this example)

  return (
    <Container>
      <Grid container alignItems="center" style={{ marginTop: '20px' }}>
        {/* Event Logs Title */}
        <Grid item xs>
          <Typography variant="h4" gutterBottom>
            Users Management
          </Typography>
        </Grid>

        {/* Search Field */}

        <Grid item style={{ marginLeft: '20px' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenAddUserDialog}
            style={{ marginBottom: '20px' }}
          >
            Add New User
          </Button>
        </Grid>
        <TextField
          label="Search Users"
          variant="outlined"
          fullWidth
          style={{ margin: '20px 0' }}
          value={searchQuery}
          onChange={(e) => handleInputChange(e.target.value)}
        />
      </Grid>
      <Paper style={{ marginBottom: '20px' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>User Name</TableCell>
              <TableCell>Roles</TableCell>
              <TableCell>Group</TableCell>
              <TableCell>Last active at</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.user_id}>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.roles}</TableCell>
                <TableCell>
                  {user?.groups.length > 0 ? user?.groups[0].group_name : <></>}
                </TableCell>
                <TableCell>{user.last_active_at}</TableCell>
                <TableCell>
                  <IconButton color="primary" onClick={() => handleEditProfile(user.username)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => handleOpenDeleteDialog(user.username)}>
                    <DeleteForeverIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={resultCount} // Total number of items
          page={page - 1} // Current page (0-based index)
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
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
            autoFocus
            number
            margin="normal"
            required
            fullWidth
            id="new-user-expired"
            label="number of days user will expire. Setting the value to 0 is never expire."
            name="expired_date"
            value={newUserExpiredDate}
            onChange={(e) => setNewUserExpiredDate(e.target.value)}
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
          <TextField
            select
            label="Group"
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            fullWidth
            margin="normal"
          >
            {groups.map((group) => (
              <MenuItem key={group.group_id} value={group.group_id}>
                {group.group_name}
              </MenuItem>
            ))}
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
      <Dialog open={editUserDialogOpen} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <TextField
            select
            label="Group"
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            fullWidth
            margin="normal"
          >
            {groups.map((group) => (
              <MenuItem key={group.group_id} value={group.group_id}>
                {group.group_name}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button onClick={handleEditUserConfirm} color="error">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default UsersPage
