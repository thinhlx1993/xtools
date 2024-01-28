import { useState, useEffect } from 'react'
import {
  Button,
  TextField,
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
  Input,
  DialogContentText,
  Checkbox,
  Grid,
  Select,
  MenuItem,
  TablePagination,
  Tooltip,
  IconButton
} from '@mui/material'
import Papa from 'papaparse'
import VerifiedIcon from '@mui/icons-material/Verified'
import EditIcon from '@mui/icons-material/Edit'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import { useSnackbar } from '../context/SnackbarContext'
import AppConfig from '../config/enums'
import { useMediaQuery } from '@mui/material'
import { ipcMainConsumer } from '../helpers/api'

const ProfilesPage = () => {
  const { openSnackbar } = useSnackbar()
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('md'))
  const [profiles, setProfiles] = useState([]) // State for storing the list of profiles
  const [newProfileData, setNewProfileData] = useState({
    username: '',
    password: '',
    fa: '',
    proxy: '',
    gpt_key: '',
    cookies: '',
    notes: '',
    status: '',
    main_profile: false
  }) // State for storing new profile data
  const [dialogOpen, setDialogOpen] = useState(false) // State for add/edit dialog visibility
  const [editDialogOpen, setEditDialogOpen] = useState(false) // State for edit dialog visibility
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false) // State for delete confirmation dialog visibility
  const [selectedProfile, setSelectedProfile] = useState(null) // State for the currently selected profile (for edit/delete)
  const [profileToDelete, setProfileToDelete] = useState(null) // State for the profile ID to delete
  const [newProfile, setNewProfile] = useState('') // State for storing profile data from text area
  const [fileInput, setFileInput] = useState(null) // State for storing the file input for profile data
  const [selectedRows, setSelectedRows] = useState([])
  const [page, setPage] = useState(1)
  const [resultCount, setresultCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('All')
  const [groups, setGroups] = useState([])
  const [users, setUsers] = useState([])
  const [rowsPerPage, setRowsPerPage] = useState(25) // Rows per page
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [moveDialogOpen, setMoveDialogOpen] = useState(false)
  const [targetGroup, setTargetGroup] = useState('')
  const [targetUser, setTargetUser] = useState('')

  useEffect(() => {
    fetchProfiles()
    fetchGroups()
    fetchUsers()
  }, [page, rowsPerPage, searchQuery, selectedGroup])

  const [data, setData] = useState([])

  const parseCsv = (file) => {
    Papa.parse(file, {
      complete: (result) => {
        console.log('Parsed CSV:', result.data)
        setData(result.data)
      },
      header: true, // Set to true if your CSV has headers
      skipEmptyLines: true
    })
  }

  const fetchProfiles = async () => {
    try {
      const apiUrl = `${AppConfig.BASE_URL}/profiles/?page=${page}&per_page=${rowsPerPage}&search=${searchQuery}&sort_by=created_at&sort_order=desc`
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}` // Replace with actual token
        }
      })

      if (response.ok) {
        const data = await response.json()
        setProfiles(data.profiles) // Assuming the API response contains an array of profiles in 'profiles' key
        setresultCount(data.result_count)
      } else {
        openSnackbar('Failed to fetch profiles', 'error')
        console.error('Failed to fetch profiles:', await response.text())
      }
    } catch (error) {
      openSnackbar('Error fetching profiles', 'error')
      console.error('Error fetching profiles:', error)
    }
  }

  const handleCheckProfile = async () => {
    if (fileInput) {
      await parseCsv(fileInput)
      openSnackbar(`Found ${data.length} profile`, 'info')
    } else {
      const input = newProfile
      const profileEntries = input.split('\n')
      let profileCreated = 0

      for (const entry of profileEntries) {
        const splitter = entry.split('|')
        if (splitter.length >= 3) {
          profileCreated = profileCreated + 1
        }
      }
      openSnackbar(`Found ${profileCreated} profile`, 'info')
    }
  }

  const handleCreateProfile = async () => {
    // If a file is uploaded, use its content; otherwise, use text area input
    let profiles = []
    if (fileInput) {
      await parseCsv(fileInput)
      profiles = data.map((item) => ({
        username: item?.username,
        password: item?.password,
        fa: item?.fa,
        proxy: item?.proxy,
        cookies: item?.cookies,
        gpt_key: item?.gpt_key,
        notes: item?.notes
      }))
    } else {
      const input = newProfile
      const profileEntries = input.split('\n')
      for (const entry of profileEntries) {
        const [username, password, fa, proxy, cookies, gpt_key, notes] = entry.split('|')
        profiles.push({ username, password, fa, proxy, cookies, gpt_key, notes })
      }
    }

    // const input = fileInput ? parseCsv(fileInput) : newProfile
    openSnackbar(
      `Creating ${profiles.length} account. It might be take times, please waiting until the dialog closed`,
      'info'
    )

    try {
      const response = await fetch(`${AppConfig.BASE_URL}/profiles/`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}` // Replace with actual token
        },
        body: JSON.stringify({ profiles: profiles })
      })

      if (!response.ok) {
        // Handle non-successful response
        const errorData = await response.json()
        console.log(errorData)
        openSnackbar(`Failed to create profile: ${errorData.message}`, 'error')
      } else {
        const data = await response.json()
        openSnackbar(data.message, 'success')
      }
    } catch (error) {
      openSnackbar(`Error creating profiles`, 'error')
      console.error(`Error creating profiles:`, error)
    }

    //
    // Refresh the profiles list and reset input fields
    fetchProfiles()
    setNewProfile('')
    setFileInput(null)
    setDialogOpen(false)
  }

  const handleEditProfile = (profile) => {
    setSelectedProfile(profile)
    setEditDialogOpen(true)
    // Populate the edit form fields with the selected profile's data
    // For example:
    setNewProfileData({
      username: profile.username,
      password: profile.password,
      fa: profile.fa,
      cookies: profile.cookies,
      proxy: profile.proxy,
      gpt_key: profile.gpt_key,
      notes: profile.notes,
      main_profile: profile.main_profile
    })
  }

  const handleUpdateProfile = async () => {
    try {
      const response = await fetch(`${AppConfig.BASE_URL}/profiles/${selectedProfile.profile_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(newProfileData) // Assuming newProfileData holds the updated profile info
      })

      if (response.ok) {
        openSnackbar('Profile updated successfully', 'success')
        fetchProfiles() // Refresh the list of profiles
      } else {
        openSnackbar('Failed to update profile', 'error')
      }
    } catch (error) {
      openSnackbar('Error updating profile', 'error')
      console.error('Error updating profile:', error)
    }
    setEditDialogOpen(false)
  }

  const handleDeleteProfile = (profileId) => {
    setProfileToDelete(profileId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteProfileConfirm = async () => {
    try {
      const response = await fetch(`${AppConfig.BASE_URL}/profiles/${profileToDelete}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      })

      if (response.ok) {
        openSnackbar('Profile deleted successfully', 'success')
        setProfiles(profiles.filter((profile) => profile.profile_id !== profileToDelete)) // Update the state to remove the deleted profile
      } else {
        openSnackbar('Failed to delete profile', 'error')
      }
    } catch (error) {
      openSnackbar('Error deleting profile', 'error')
      console.error('Error deleting profile:', error)
    }

    setDeleteDialogOpen(false)
  }

  const handleFileChange = (event) => {
    setFileInput(event.target.files[0])
  }

  const handleRowSelection = (profileId) => {
    const isSelected = selectedRows.includes(profileId)
    if (isSelected) {
      setSelectedRows(selectedRows.filter((id) => id !== profileId))
    } else {
      setSelectedRows([...selectedRows, profileId])
    }
  }

  const isRowSelected = (profileId) => selectedRows.includes(profileId)

  const fetchGroups = async () => {
    try {
      const response = await fetch(`${AppConfig.BASE_URL}/groups`, {
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setGroups(data) // Store the group data in state
      } else {
        console.error('Failed to fetch groups')
      }
    } catch (error) {
      console.error('Error fetching groups:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${AppConfig.BASE_URL}/user`, {
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(data.user_list) // Store the group data in state
      } else {
        console.error('Failed to fetch users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleChangePage = (event, newPage) => {
    setPage(newPage + 1)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value)
    setPage(1) // Reset to the first page when changing rows per page
  }

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelecteds = profiles.map((n) => n.profile_id)
      setSelectedRows(newSelecteds)
      return
    }
    setSelectedRows([])
  }

  const handleBatchDelete = async () => {
    // Create an array of delete promises
    const deletePromises = selectedRows.map((profileId) =>
      fetch(`${AppConfig.BASE_URL}/profiles/${profileId}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      })
    )

    openSnackbar('It might be take times, please waiting for the success message', 'info')

    try {
      // Execute all delete requests concurrently
      await Promise.all(deletePromises)

      // If all requests are successful
      openSnackbar('Profiles deleted successfully', 'success')
    } catch (error) {
      // If any request fails
      openSnackbar('Error deleting profiles', 'error')
      console.error('Error deleting profiles:', error)
    }

    // Refresh the profiles list and clear selected rows
    fetchProfiles()
    setSelectedRows([])
  }

  // Modify your handlers to open the dialog
  const handleBatchDeleteClick = () => {
    setConfirmAction('delete')
    setConfirmDialogOpen(true)
  }

  // Open Profile
  const handleOpenProfile = (profile) => {
    ipcMainConsumer.emit('startOpenProfile', profile.profile_id)
  }

  const ConfirmationDialog = ({ open, onClose, onConfirm, actionType }) => (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Confirm Action</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to {actionType} the selected profiles? This action cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button onClick={onConfirm} color="secondary">
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  )

  const MoveToGroupDialog = ({ open, onClose, onMove, groups, users }) => (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Give access to an user</DialogTitle>
      <DialogContent>
        {/* <DialogContentText>Select a group to move the selected profiles.</DialogContentText>
        <Select fullWidth value={targetGroup} onChange={(e) => setTargetGroup(e.target.value)}>
          {groups.map((group) => (
            <MenuItem key={group.group_id} value={group.group_id}>
              {group.group_name}
            </MenuItem>
          ))}
        </Select> */}
        <DialogContentText>Select a user</DialogContentText>
        <Select fullWidth value={targetUser} onChange={(e) => setTargetUser(e.target.value)}>
          {users.map((user) => (
            <MenuItem key={user.user_id} value={user.username}>
              {user.username}
            </MenuItem>
          ))}
        </Select>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button onClick={() => onMove(targetGroup, targetUser)} color="primary">
          Move
        </Button>
      </DialogActions>
    </Dialog>
  )

  const handleMoveToGroup = async (groupId, userId) => {
    // Create an array of PUT request promises
    const movePromises = selectedRows.map((profileId) =>
      fetch(`${AppConfig.BASE_URL}/profiles/${profileId}`, {
        method: 'PUT',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_access: userId })
      })
    )
    openSnackbar('It might be take times, please waiting for the success message', 'info')

    try {
      // Execute all PUT requests concurrently
      const responses = await Promise.all(movePromises)

      // Process the responses
      responses.forEach(async (response, index) => {
        if (!response.ok) {
          // Handle non-successful response
          const errorData = await response.json()
          openSnackbar(
            `Failed to move profile ID ${selectedRows[index]}: ${errorData.message}`,
            'error'
          )
        }
      })

      openSnackbar('Profiles moved successfully', 'success')
    } catch (error) {
      // If any request fails
      openSnackbar('Error moving profiles', 'error')
      console.error('Error moving profiles:', error)
    }

    // Refresh the profiles list and clear selected rows
    fetchProfiles()
    setSelectedRows([])
    setMoveDialogOpen(false) // Close the move dialog
  }

  return (
    <Grid item xs={12} md={6} lg={4} style={{ padding: '20px' }}>
      <Grid container alignItems="center" style={{ marginTop: '20px' }}>
        {/* Event Logs Title */}
        <Grid item xs>
          <Typography variant="h4" gutterBottom>
            Profiles
          </Typography>
        </Grid>

        {/* Search Field */}
        <Grid item>
          <TextField
            label="Search by Username, User"
            variant="outlined"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </Grid>
        <Grid item style={{ marginLeft: '20px' }}>
          <Button variant="contained" color="primary" onClick={() => setDialogOpen(true)}>
            Import
          </Button>
        </Grid>
        {/* <Grid item style={{ marginLeft: '20px' }}>
          <Button
            variant="contained"
            color="primary"
            disabled={selectedRows.length === 0}
            onClick={() => setMoveDialogOpen(true)}
          >
            Share
          </Button>
        </Grid> */}
        <Grid item style={{ marginLeft: '20px' }}>
          <Button
            variant="contained"
            color="error"
            disabled={selectedRows.length === 0}
            onClick={handleBatchDeleteClick}
          >
            Delete
          </Button>
        </Grid>
      </Grid>
      {/* <Typography variant="h4" gutterBottom style={{ marginTop: '20px' }}>
        Profiles Management
      </Typography> */}

      <Paper style={{ padding: '20px', marginBottom: '20px', overflowX: 'auto' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selectedRows.length > 0 && selectedRows.length < profiles.length}
                  checked={profiles.length > 0 && selectedRows.length === profiles.length}
                  onChange={handleSelectAllClick}
                />
              </TableCell>
              <TableCell>Username</TableCell>
              {!isMobile && <TableCell>Followers</TableCell>}
              {!isMobile && <TableCell>Following</TableCell>}
              {!isMobile && <TableCell>Created At</TableCell>}
              {!isMobile && <TableCell>Notes</TableCell>}
              <TableCell>Status</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {profiles.map((profile) => (
              <TableRow key={profile.profile_id}>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={isRowSelected(profile.profile_id)}
                    onChange={() => handleRowSelection(profile.profile_id)}
                  />
                </TableCell>
                <TableCell
                  style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                >
                  <Tooltip title={profile.username}>
                    <span>
                      {profile.username}
                      <VerifiedIcon
                        style={{
                          marginLeft: '5px',
                          verticalAlign: 'middle',
                          color: profile?.profile_data?.verify ? 'blue' : 'gray'
                        }}
                      />
                      <AttachMoneyIcon
                        style={{
                          marginLeft: '5px',
                          verticalAlign: 'middle',
                          color: profile?.profile_data?.monetizable ? 'green' : 'gray'
                        }}
                      />
                    </span>
                  </Tooltip>
                </TableCell>
                {!isMobile && (
                  <TableCell
                    style={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    <Tooltip title={profile?.profile_data?.followers}>
                      <span>{profile?.profile_data?.followers}</span>
                    </Tooltip>
                  </TableCell>
                )}
                {!isMobile && (
                  <TableCell
                    style={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    <Tooltip title={profile?.profile_data?.following}>
                      <span>{profile?.profile_data?.following}</span>
                    </Tooltip>
                  </TableCell>
                )}
                {!isMobile && (
                  <TableCell
                    style={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    <Tooltip title={profile.created_at}>
                      <span>{profile.created_at}</span>
                    </Tooltip>
                  </TableCell>
                )}
                {!isMobile && (
                  <TableCell
                    style={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      width: '200px'
                    }}
                  >
                    <Tooltip title={profile.notes}>
                      <span>{profile.notes}</span>
                    </Tooltip>
                  </TableCell>
                )}
                <TableCell>{profile.status}</TableCell>
                <TableCell style={{ textAlign: 'right' }}>
                  <IconButton color="primary" onClick={() => handleEditProfile(profile)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDeleteProfile(profile.profile_id)} // Replace 'profile.id' with actual identifier
                    style={{ marginLeft: '10px' }}
                  >
                    <DeleteForeverIcon />
                  </IconButton>
                  <Button color="info" onClick={() => handleOpenProfile(profile)}>
                    Open Profile
                  </Button>
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

      {/* Add New Profile Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add New Profile</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" color="textSecondary">
            Hãy chú ý nhập đúng định dạng
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Các trường bắt buộc phải có username|password|2fa|proxy
          </Typography>

          <TextField
            autoFocus
            margin="normal"
            label="Profile Data"
            fullWidth
            variant="outlined"
            placeholder="username|password|fa|proxy|cookies|gpt_key|notes"
            multiline
            rows={4}
            value={newProfile}
            onChange={(e) => setNewProfile(e.target.value)}
          />
          <Typography variant="body1" style={{ margin: '20px 0 10px' }}>
            Or upload a file:
          </Typography>
          <Button variant="outlined" component="label" fullWidth style={{ textTransform: 'none' }}>
            Upload File
            <Input type="file" hidden onChange={handleFileChange} />
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} color="info">
            Cancel
          </Button>
          <Button onClick={handleCheckProfile} color="info">
            Check
          </Button>
          <Button disabled={!data && !newProfile} onClick={handleCreateProfile} color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            disabled
            label="Username"
            fullWidth
            variant="outlined"
            value={newProfileData.username}
            onChange={(e) => setNewProfileData({ ...newProfileData, username: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Password"
            fullWidth
            variant="outlined"
            value={newProfileData.password}
            onChange={(e) => setNewProfileData({ ...newProfileData, password: e.target.value })}
          />
          <TextField
            margin="dense"
            label="2FA"
            fullWidth
            variant="outlined"
            value={newProfileData.fa}
            onChange={(e) => setNewProfileData({ ...newProfileData, fa: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Proxy"
            fullWidth
            variant="outlined"
            value={newProfileData.proxy}
            onChange={(e) => setNewProfileData({ ...newProfileData, proxy: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Cookies"
            fullWidth
            variant="outlined"
            value={newProfileData.cookies}
            onChange={(e) => setNewProfileData({ ...newProfileData, cookies: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Notes"
            fullWidth
            variant="outlined"
            value={newProfileData.notes}
            onChange={(e) => setNewProfileData({ ...newProfileData, notes: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Chat GPT Key"
            fullWidth
            variant="outlined"
            value={newProfileData.gpt_key}
            onChange={(e) => setNewProfileData({ ...newProfileData, gpt_key: e.target.value })}
          />
          <div>
            <Checkbox
              checked={newProfileData.main_profile}
              onChange={(e) =>
                setNewProfileData({
                  ...newProfileData,
                  main_profile: e.target.checked // Use 'checked', not 'value'
                })
              }
              inputProps={{ 'aria-label': 'primary checkbox' }}
            />
            Don&apos;t allow comment, like
          </div>
          {/* Add TextFields for other profile attributes like password, FA, proxy, etc. */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleUpdateProfile} color="primary">
            Update
          </Button>
        </DialogActions>
      </Dialog>
      {/* Delete */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Profile</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this profile? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteProfileConfirm} color="secondary">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      {/* Update */}
      <ConfirmationDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={() => {
          if (confirmAction === 'delete') {
            handleBatchDelete()
          }
          setConfirmDialogOpen(false)
        }}
        actionType={confirmAction === 'delete' ? 'delete' : 'move to group'}
      />
      <MoveToGroupDialog
        open={moveDialogOpen}
        onClose={() => setMoveDialogOpen(false)}
        onMove={(groupId, userId) => {
          handleMoveToGroup(groupId, userId)
          setMoveDialogOpen(false)
        }}
        groups={groups} // Pass the groups array
        users={users}
      />
    </Grid>
  )
}

export default ProfilesPage
