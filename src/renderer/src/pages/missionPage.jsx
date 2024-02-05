import { useState, useEffect } from 'react'
import {
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Divider,
  CardActions,
  Checkbox,
  Tooltip,
  ListItemText,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material'
import AppConfig from '../config/enums'
import { useSnackbar } from '../context/SnackbarContext'
import cronstrue from 'cronstrue'

const MissionPage = () => {
  const { openSnackbar } = useSnackbar()
  const [missions, setMissions] = useState([])
  const [groups, setGroups] = useState([])
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [profiles, setProfiles] = useState([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [startDialogOpen, setStartDialogOpen] = useState(false)
  const [selectedMission, setSelectedMission] = useState(null)
  const [addMissionDialogOpen, setAddMissionDialogOpen] = useState(false)

  const defaultForms = {
    missionName: '',
    groupName: '',
    groupId: '',
    profileIds: [],
    startDate: '',
    missionTasks: [],
    userId: '',
    repeatSchedule: []
  }
  const [configProfiles, setConfigProfiles] = useState('')

  const [newMission, setNewMission] = useState(defaultForms)
  const missionDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const reUpPostSelected = newMission.missionTasks.some(
    (task) => tasks.find((t) => t.tasks_id === task).tasks_name === 'reUpPost'
  )

  useEffect(() => {
    fetchTasks()
    fetchGroups()
    // fetchUsers()
    fetchProfiles('')
    fetchMissions()
  }, [])

  const openDeleteDialog = (mission) => {
    setSelectedMission(mission)
    setDeleteDialogOpen(true)
  }

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false)
    setSelectedMission(null)
  }

  const openStartDialog = (mission) => {
    setSelectedMission(mission)
    setStartDialogOpen(true)
  }

  const closeStartDialog = () => {
    setStartDialogOpen(false)
    setSelectedMission(null)
  }

  const confirmDeleteMission = async () => {
    if (selectedMission) {
      const url = `${AppConfig.BASE_URL}/missions/${selectedMission.mission_id}`
      const headers = {
        accept: 'application/json',
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json'
      }

      try {
        const response = await fetch(url, {
          method: 'DELETE',
          headers: headers
        })

        if (response.ok) {
          setNewMission(defaultForms)
          fetchMissions()
          openSnackbar('The mission deleted successfully', 'success')
        } else {
          openSnackbar('Delete mission failed', 'error')
        }
      } catch (error) {
        console.error('Error creating mission:', error)
        openSnackbar('Error creating mission', 'error')
      }
      closeDeleteDialog()
    }
  }

  const confirmStartMission = async () => {
    if (selectedMission) {
      const url = `${AppConfig.BASE_URL}/missions/${selectedMission.mission_id}`
      const headers = {
        accept: 'application/json',
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json'
      }

      try {
        const response = await fetch(url, {
          method: 'PUT',
          headers: headers,
          body: JSON.stringify({
            force_start: true
          })
        })

        if (response.ok) {
          openSnackbar('The mission will start shortly', 'success')
        } else {
          openSnackbar('Failed to start', 'error')
        }
      } catch (error) {
        console.error('Error creating mission:', error)
        openSnackbar('Failed to start', 'error')
      }
      closeStartDialog()
    }
  }

  const handleChangeRepeat = (event) => {
    const { value } = event.target

    // Special handling when "Không" is selected or deselected
    if (value[value.length - 1] === '') {
      setNewMission({ ...newMission, repeatSchedule: [''] })
    } else {
      setNewMission({ ...newMission, repeatSchedule: value.filter((item) => item !== '') })
    }
  }

  const handleChangeTaks = (event) => {
    const { value } = event.target
    setNewMission({ ...newMission, missionTasks: value })
  }

  const handleChangeProfiles = (event) => {
    const { value } = event.target
    setNewMission({ ...newMission, profileIds: value })
  }

  const handleChangeUser = (event) => {
    const { value } = event.target
    setNewMission({ ...newMission, userId: value })
    fetchProfiles(value)
  }

  const fetchTasks = async () => {
    const response = await fetch(`${AppConfig.BASE_URL}/tasks/`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${localStorage.getItem('access_token')}` // Replace <access token> with actual token
      }
    })
    if (response.ok) {
      const data = await response.json()
      setTasks(data.tasks)
    } else {
      // Handle errors
      console.error('Failed to fetch tasks')
    }
  }

  const fetchMissions = async () => {
    const response = await fetch(`${AppConfig.BASE_URL}/missions/`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${localStorage.getItem('access_token')}` // Replace <access token> with actual token
      }
    })
    if (response.ok) {
      const data = await response.json()
      setMissions(data.missions)
    } else {
      // Handle errors
      console.error('Failed to fetch missions')
    }
  }

  const fetchUsers = async () => {
    const response = await fetch(`${AppConfig.BASE_URL}/user`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${localStorage.getItem('access_token')}` // Replace <access token> with actual token
      }
    })
    if (response.ok) {
      const data = await response.json()
      setUsers(data.user_list)
    } else {
      // Handle errors
      console.error('Failed to fetch tasks')
    }
  }

  const fetchProfiles = async (userId) => {
    const response = await fetch(`${AppConfig.BASE_URL}/profiles/`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${localStorage.getItem('access_token')}` // Replace <access token> with actual token
      }
    })

    if (response.ok) {
      const data = await response.json()
      setProfiles(data.profiles)
    } else {
      // Handle errors
      console.error('Failed to fetch tasks')
    }
  }

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
        // openSnackbar('Failed to fetch groups', 'error')
      }
    } catch (error) {
      //   openSnackbar('Error fetching groups', 'error')
    }
  }

  const handleStartMission = (missionId) => {
    // Logic to start the mission
  }

  const handleStopMission = (missionId) => {
    // Logic to stop the mission
  }

  const handleCreateMission = async () => {
    const url = `${AppConfig.BASE_URL}/missions/`
    const headers = {
      accept: 'application/json',
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json'
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          mission_name: newMission.missionName,
          profile_ids: newMission.profileIds,
          tasks: newMission.missionTasks,
          config: { profiles: configProfiles.split('\n') },
          user_id: newMission.userId,
          mission_schedule: newMission.repeatSchedule,
          start_date: newMission.startDate
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      setNewMission(defaultForms)
      await response.json()
      fetchMissions()
      setAddMissionDialogOpen(false)
      openSnackbar('Create a new mission successfully', 'success')
    } catch (error) {
      console.error('Error creating mission:', error)
      openSnackbar('Error creating mission', 'error')
    }
  }

  return (
    <Container>
      <Grid container alignItems="center" style={{ marginTop: '20px' }}>
        <Grid item xs>
          <Typography variant="h4" gutterBottom style={{ marginTop: 20 }}>
            Mission Management
          </Typography>
        </Grid>
        <Grid item>
          <Button variant="contained" color="primary" onClick={() => setAddMissionDialogOpen(true)}>
            Add Mission
          </Button>
        </Grid>
      </Grid>
      {/* Mission List */}
      <Grid container spacing={2} style={{ marginTop: 20, marginBottom: 20 }}>
        {missions.map((mission) => (
          <Grid item xs={12} md={6} lg={4} key={mission.mission_id}>
            <Card>
              <CardContent>
                <Tooltip title={mission.mission_name}>
                  <Typography
                    variant="h5"
                    className="overflowHidden"
                    style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                  >
                    {mission.mission_name}
                  </Typography>
                </Tooltip>

                <Typography color="textSecondary">Mission Status: {mission.status}</Typography>
                <Tooltip
                  title={
                    mission.mission_json.cron
                      ? cronstrue.toString(mission.mission_json.cron)
                      : 'Not defined'
                  }
                >
                  <Typography
                    className="overflowHidden"
                    color="textSecondary"
                    style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                  >
                    Schedule Config:{' '}
                    {mission.mission_json && mission.mission_json.cron
                      ? cronstrue.toString(mission.mission_json.cron)
                      : 'Not defined'}
                  </Typography>
                </Tooltip>

                <Typography color="textSecondary">User: {mission.username}</Typography>
                <Typography color="textSecondary">
                  Profiles: {mission.mission_schedule.length}{' '}
                </Typography>
                <Tooltip
                  title={mission.mission_tasks.map((task) => task.tasks.tasks_name).join(', ')}
                >
                  <Typography color="textSecondary">
                    Tasks: {mission.mission_tasks.map((task) => task.tasks.tasks_name).join(', ')}
                  </Typography>
                </Tooltip>
              </CardContent>
              <CardActions>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => openStartDialog(mission)}
                >
                  Start Now
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => handleStopMission(mission.mission_id)}
                >
                  Stop
                </Button>
                <Button color="error" variant="contained" onClick={() => openDeleteDialog(mission)}>
                  Delete
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Dialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this mission?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancel</Button>
          <Button color="error" onClick={confirmDeleteMission} autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={startDialogOpen}
        onClose={closeStartDialog}
        aria-labelledby="start-dialog-title"
        aria-describedby="start-dialog-description"
      >
        <DialogContent>
          <DialogContentText id="start-dialog-description">
            Are you sure you want to start this mission?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeStartDialog}>Cancel</Button>
          <Button color="warning" onClick={confirmStartMission} autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={addMissionDialogOpen}
        onClose={() => setAddMissionDialogOpen(false)}
        aria-labelledby="form-dialog-title"
      >
        <DialogTitle id="form-dialog-title">Add New Mission</DialogTitle>
        <DialogContent>
          {/* <DialogContentText>Fill in the details for the new mission.</DialogContentText> */}
          {/* Place form elements here */}
          <Grid item xs={6} sm={3}>
            <TextField
              autoFocus
              margin="dense"
              id="description"
              label="Description"
              type="text"
              fullWidth
              value={newMission.missionName}
              onChange={(e) => setNewMission({ ...newMission, missionName: e.target.value })}
            />
            <TextField
              fullWidth
              label="Start Time"
              type="time"
              value={newMission.startDate}
              onChange={(e) => setNewMission({ ...newMission, startDate: e.target.value })}
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Mission Schedule</InputLabel>
              <Select
                multiple
                value={newMission.repeatSchedule}
                onChange={handleChangeRepeat}
                renderValue={(selected) => selected.join(', ')}
              >
                {missionDays.map((day) => (
                  <MenuItem key={day} value={day}>
                    <Checkbox checked={newMission?.repeatSchedule?.includes(day)} />
                    <ListItemText primary={day} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Tasks</InputLabel>
              <Select
                multiple
                value={newMission.missionTasks}
                onChange={handleChangeTaks}
                renderValue={(selected) => `${selected.length} Tasks`}
              >
                {tasks.map((task) => (
                  <MenuItem key={task.tasks_id} value={task.tasks_id}>
                    <Checkbox checked={newMission?.missionTasks?.includes(task.tasks_id)} />
                    <ListItemText primary={task.tasks_name} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {reUpPostSelected && (
              <TextField
                autoFocus
                margin="dense"
                id="reUpPostText"
                label="ReUp Username"
                type="text"
                fullWidth
                multiline
                rows={4}
                variant="outlined"
                value={configProfiles}
                onChange={(e) => setConfigProfiles(e.target.value)}
              />
            )}
            <FormControl fullWidth margin="normal">
              <InputLabel>Profiles, default all items are selected</InputLabel>
              <Select
                multiple
                value={newMission.profileIds}
                onChange={handleChangeProfiles}
                renderValue={(selected) => `${selected.length} Profiles`}
              >
                {profiles.map((item) => (
                  <MenuItem key={item.profile_id} value={item.profile_id}>
                    <Checkbox checked={newMission?.profileIds?.includes(item.profile_id)} />
                    <ListItemText primary={item.username} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          {/* Repeat for Start Time, Mission Schedule, Tasks, Profiles */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddMissionDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleCreateMission} color="primary">
            Create Mission
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default MissionPage
