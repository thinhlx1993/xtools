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
  DialogContentText
} from '@mui/material'
import AppConfig from '../config/enums'
import { useSnackbar } from '../context/SnackbarContext'

const TeamsPage = () => {
  const { openSnackbar } = useSnackbar()
  const [teams, setTeams] = useState([])
  const [newTeamName, setNewTeamName] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [teamToDelete, setTeamToDelete] = useState(null)

  // Fetch teams
  useEffect(() => {
    fetchTeams()
  }, [])

  const fetchTeams = async () => {
    try {
      const response = await fetch(`${AppConfig.BASE_URL}/teams/`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setTeams(data.data) // Adjust based on actual response structure
      } else {
        console.error('Failed to fetch teams')
      }
    } catch (error) {
      console.error('Error fetching teams:', error)
    }
  }

  // Handler to create a new team
  const handleCreateTeam = () => {
    openSnackbar('It might be take times, please waiting for the success message', 'info')
    fetch(`${AppConfig.BASE_URL}/teams/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify({ teams_name: newTeamName })
    })
      .then((response) => response.json())
      .then(() => {
        setDialogOpen(false)
        setNewTeamName('')
        openSnackbar(`Create new team successfully`, 'success')
        // Re-fetch teams or update state with new team
        // setTeams([...teams, data]); // if the API returns the new team
        fetch(`${AppConfig.BASE_URL}/teams/`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`
          }
        })
          .then((res) => res.json())
          .then((data) => setTeams(data.data)) // Re-fetch teams
      })
      .catch((error) => {
        openSnackbar(`Error creating team`, 'success')
        console.error('Error creating team:', error)
        // Handle error appropriately
      })
  }

  const handleEditTeam = (team) => {
    setSelectedTeam(team)
    setNewTeamName(team.teams_name)
    setEditDialogOpen(true)
  }

  const handleUpdateTeam = () => {
    // API call to update the team
    // After successful update, close dialog and refresh team list
    fetch(`${AppConfig.BASE_URL}/teams/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify({ teams_name: newTeamName, teams_id: selectedTeam.teams_id })
    })
      .then((response) => response.json())
      .then(() => {
        openSnackbar(`Edit team successfully`, 'success')
        setEditDialogOpen(false)
        setNewTeamName('')
        // Re-fetch teams or update state with new team
        // setTeams([...teams, data]); // if the API returns the new team
        fetch(`${AppConfig.BASE_URL}/teams/`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`
          }
        })
          .then((res) => res.json())
          .then((data) => setTeams(data.data)) // Re-fetch teams
      })
      .catch((error) => {
        openSnackbar(`Edit team failed`, 'error')
        console.error('Error creating team:', error)
        // Handle error appropriately
      })
  }

  const handleDeleteTeam = (teamId) => {
    setTeamToDelete(teamId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteTeamConfirm = () => {
    // Call API to delete team
    // Example: deleteTeamApiCall(teamToDelete.teams_id).then(() => { ... })
    openSnackbar('It might be take times, please waiting for the success message', 'info')
    fetch(`${AppConfig.BASE_URL}/teams/${teamToDelete}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('access_token')}`
      }
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message === 'Deleted successfully') {
          openSnackbar(data.message, 'success')
        } else {
          openSnackbar(data.message, 'error')
        }

        setDeleteDialogOpen(false)
        setNewTeamName('')
        // Re-fetch teams or update state with new team
        // setTeams([...teams, data]); // if the API returns the new team
        fetch(`${AppConfig.BASE_URL}/teams/`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`
          }
        })
          .then((res) => res.json())
          .then((data) => setTeams(data.data)) // Re-fetch teams
      })
      .catch((error) => {
        openSnackbar(`Error deleting team`, 'error')
        console.error('Error creating team:', error)
        // Handle error appropriately
      })

    // Refresh teams list or remove the team from state
  }

  return (
    <Container>
      <Typography variant="h4" gutterBottom style={{ marginTop: '20px' }}>
        Teams Management
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={() => setDialogOpen(true)}
        style={{ marginBottom: '20px' }}
      >
        Add New Team
      </Button>
      <Paper style={{ padding: '20px', marginBottom: '20px' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Team Name</TableCell>
              <TableCell>Created Date</TableCell>
              <TableCell></TableCell>
              {/* Additional columns as needed */}
            </TableRow>
          </TableHead>
          <TableBody>
            {teams.map((team) => (
              <TableRow key={team.teams_id}>
                <TableCell>{team.teams_name}</TableCell>
                <TableCell>{team.created_at}</TableCell>
                <TableCell>
                  <Button color="primary" onClick={() => handleEditTeam(team)}>
                    Edit
                  </Button>
                  <Button color="error" onClick={() => handleDeleteTeam(team.teams_id)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
          <DialogTitle>Add a New Team</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              id="team-name"
              label="Team Name"
              fullWidth
              variant="outlined"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)} color="primary">
              Cancel
            </Button>
            <Button onClick={handleCreateTeam} color="primary">
              Add
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
          <DialogTitle>Edit Team</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              id="edit-team-name"
              label="Team Name"
              fullWidth
              variant="outlined"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)} color="primary">
              Cancel
            </Button>
            <Button onClick={handleUpdateTeam} color="primary">
              Update
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Team</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this team? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
              Cancel
            </Button>
            <Button onClick={() => handleDeleteTeamConfirm()} color="error" autoFocus>
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  )
}

export default TeamsPage
