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
  Grid
} from '@mui/material'
import { useSnackbar } from '../context/SnackbarContext'
import AppConfig from '../config/enums'

const GroupsPage = () => {
  const { openSnackbar } = useSnackbar()
  const [groups, setGroups] = useState([])
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupNotes, setNewGroupNotes] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [groupToDelete, setGroupToDelete] = useState(null)

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    try {
      const response = await fetch(`${AppConfig.BASE_URL}/groups`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setGroups(data) // Assuming the response has a 'groups' field
      } else {
        openSnackbar('Failed to fetch groups', 'error')
      }
    } catch (error) {
      openSnackbar('Error fetching groups', 'error')
    }
  }

  const handleOpenCreateDialog = () => {
    setNewGroupName('')
    setNewGroupNotes('')
    setDialogOpen(true)
  }

  const handleCreateGroup = async () => {
    try {
      const response = await fetch(`${AppConfig.BASE_URL}/groups`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ group_name: newGroupName, notes: newGroupNotes })
      })

      if (response.ok) {
        openSnackbar('Group created successfully', 'success')
        fetchGroups()
      } else {
        openSnackbar('Failed to create group', 'error')
      }
    } catch (error) {
      openSnackbar('Error creating group', 'error')
    }
    setDialogOpen(false)
  }

  const handleDeleteGroupConfirm = async () => {
    try {
      const response = await fetch(`${AppConfig.BASE_URL}/groups/${groupToDelete}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      })

      if (response.ok) {
        openSnackbar('Group deleted successfully', 'success')
        setGroups(groups.filter((group) => group.group_id !== groupToDelete)) // Update the state to remove the deleted group
      } else {
        const errorData = await response.json()
        openSnackbar(errorData.message || 'Failed to delete group', 'error')
      }
    } catch (error) {
      openSnackbar('Error deleting group', 'error')
      console.error('Error deleting group:', error)
    }

    setDeleteDialogOpen(false)
  }

  const handleEditGroup = (group) => {
    setSelectedGroup(group)
    setNewGroupName(group.group_name)
    setNewGroupNotes(group.notes)
    setEditDialogOpen(true)
  }

  const handleUpdateGroup = async () => {
    try {
      const response = await fetch(`${AppConfig.BASE_URL}/groups/${selectedGroup.group_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ group_name: newGroupName, notes: newGroupNotes })
      })

      if (response.ok) {
        openSnackbar('Group updated successfully', 'success')
        fetchGroups() // Refresh the list of groups
      } else {
        openSnackbar('Failed to update group', 'error')
      }
    } catch (error) {
      openSnackbar('Error updating group', 'error')
      console.error('Error updating group:', error)
    }
    setEditDialogOpen(false)
  }
  const handleDeleteGroup = (groupId) => {
    setGroupToDelete(groupId)
    setDeleteDialogOpen(true)
  }

  // This assumes each group object has a 'group_name' and 'group_id' property.

  // ... Continue with handleEditGroup, handleUpdateGroup, handleDeleteGroup, handleDeleteGroupConfirm ...

  return (
    <Container>
      <Grid container alignItems="center" style={{ marginTop: '20px' }}>
        <Grid item xs>
          <Typography variant="h4" gutterBottom>
            Groups Management
          </Typography>
        </Grid>
        <Grid item>
          <Button variant="contained" color="primary" onClick={handleOpenCreateDialog}>
            Add New Group
          </Button>
        </Grid>
      </Grid>

      <Paper style={{ marginBottom: '20px' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Group Name</TableCell>
              <TableCell>Notes</TableCell>
              <TableCell>Created Date</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {groups.map((group) => (
              <TableRow key={group.group_id}>
                <TableCell>{group.group_name}</TableCell>
                <TableCell>{group.notes}</TableCell>
                <TableCell>{group.created_at}</TableCell>
                <TableCell>
                  <Button color="primary" onClick={() => handleEditGroup(group)}>
                    Edit
                  </Button>
                  <Button
                    color="error"
                    onClick={() => handleDeleteGroup(group.group_id)}
                    style={{ marginLeft: '10px' }}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {/* Add, Edit, and Delete Dialogs */}
      </Paper>
      {/* Add New Group Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Add New Group</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="normal"
            required
            fullWidth
            label="Group Name"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
          />
          <TextField
            autoFocus
            margin="normal"
            required
            fullWidth
            label="Group Notes"
            value={newGroupNotes}
            onChange={(e) => setNewGroupNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleCreateGroup} color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>
      {/* Edit Groups dialogs */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Edit Group</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="normal"
            required
            fullWidth
            label="Group Name"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
          />
          <TextField
            autoFocus
            margin="normal"
            required
            fullWidth
            label="Group Notes"
            value={newGroupNotes}
            onChange={(e) => setNewGroupNotes(e.target.value)}
          />
          {/* Include other fields if necessary */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleUpdateGroup} color="primary">
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Group Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Group</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this group? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteGroupConfirm} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default GroupsPage
