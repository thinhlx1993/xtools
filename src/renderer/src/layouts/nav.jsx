import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Select,
  MenuItem
} from '@mui/material'
import React, { useState, useEffect } from 'react'
import MenuIcon from '@mui/icons-material/Menu'
import { Link, useNavigate } from 'react-router-dom'
import AppConfig from '../config/enums'
import { useSnackbar } from '../context/SnackbarContext'

const Navbar = ({ onLogout, userRole, userSuperAdmin, updateUserRole }) => {
  const navigate = useNavigate()
  const [selectedTeam, setSelectedTeam] = useState({ id: '', name: 'Select a team' })
  const { openSnackbar } = useSnackbar()
  const [teams, setTeams] = useState([])
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    fetchTeams()
    fetchCurrentTeams()
  }, [onLogout])

  const fetchCurrentTeams = async () => {
    try {
      if (localStorage.getItem('access_token')) {
        const response = await fetch(`${AppConfig.BASE_URL}/user/team_info`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('access_token')}`
          }
        })
        if (response.ok) {
          const data = await response.json()
          openSnackbar(`Switched into teams: ${data.teams_name}`, 'success')
          setSelectedTeam(data) // Update based on your actual API response structure
        } else {
          console.error('Failed to fetch team name')
          // Handle non-OK response
        }
      } else {
        navigate('/login')
      }
    } catch (error) {
      navigate('/login')
      console.error('Error fetching team name:', error)
    }
  }

  const fetchTeams = async () => {
    try {
      if (localStorage.getItem('access_token')) {
        const response = await fetch(`${AppConfig.BASE_URL}/teams`, {
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
      } else {
        navigate('/login')
      }
    } catch (error) {
      await _clearUserData()
      console.error('Error fetching teams:', error)
    }
  }

  const handleTeamSwitch = async (team) => {
    try {
      const response = await fetch(`${AppConfig.BASE_URL}/user/switch_team`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ teams_id: team.teams_id })
      })

      if (response.ok) {
        const dataWitched = await response.json()
        localStorage.setItem('access_token', dataWitched.access_token) // Save new token
        await fetchCurrentTeams()
        await updateUserRole()
        if (localStorage.getItem('access_token')) {
          const userRole = localStorage.getItem('userRole')
          if (userRole) {
            navigate('/admin/profiles') // or '/admin' based on the role
          } else {
            navigate('/login')
          }
        }
      } else {
        fetchTeams()
        fetchCurrentTeams()
        openSnackbar('Switch to new team failed', 'error')
        console.error('Failed to switch team')
      }
    } catch (error) {
      fetchTeams()
      fetchCurrentTeams()
      openSnackbar('Switch to new team failed', 'error')
      console.error('Error switching team:', error)
    }
  }

  const _clearUserData = async () => {
    // Clear local storage (or specific items as needed)
    localStorage.clear()
    setTeams([])
    setSelectedTeam('')
    onLogout()
    // Navigate to login or another appropriate page
    navigate('/login')
  }

  const handleLogout = async () => {
    try {
      // Send a logout request to your API
      await fetch(`${AppConfig.BASE_URL}/user/logout`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
          // Add other necessary headers
        }
      })
    } catch (error) {
      console.error('Logout failed', error)
    } finally {
      await _clearUserData()
    }
  }

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return
    }
    setDrawerOpen(open)
  }

  const DrawerMenu = () => (
    <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
      <div role="presentation" onClick={toggleDrawer(false)} onKeyDown={toggleDrawer(false)}>
        <List>
          {userRole === 'admin' && (
            <ListItem button component={Link} to="/admin">
              <ListItemText primary="Admin Dashboard" />
            </ListItem>
          )}
          {userSuperAdmin && (
            <ListItem button component={Link} to="/admin/teams">
              <ListItemText primary="Teams" />
            </ListItem>
          )}
          {userRole && (
            <ListItem button component={Link} to="/admin/missions">
              <ListItemText primary="Missions" />
            </ListItem>
          )}
          {/* {userRole === 'admin' && (
            <ListItem button component={Link} to="/admin/groups">
              <ListItemText primary="Groups" />
            </ListItem>
          )} */}
          {userRole && (
            <ListItem button component={Link} to="/admin/profiles">
              <ListItemText primary="Profiles" />
            </ListItem>
          )}
          {userRole === 'admin' && (
            <ListItem button component={Link} to="/admin/events">
              <ListItemText primary="Events" />
            </ListItem>
          )}
          {userRole === 'admin' && (
            <ListItem button component={Link} to="/admin/users">
              <ListItemText primary="Users" />
            </ListItem>
          )}
          {userRole === 'admin' && (
            <ListItem button component={Link} to="/admin/hma">
              <ListItemText primary="HMA Users" />
            </ListItem>
          )}
          {/* <ListItem button component={Link} to="/client">
            <ListItemText primary="XGPT Client" />
          </ListItem> */}
          {userRole && (
            <ListItem button component={Link} to="/admin/settings">
              <ListItemText primary="Settings" />
            </ListItem>
          )}
          {userRole && (
            <ListItem button onClick={handleLogout}>
              <ListItemText primary="Logout" />
            </ListItem>
          )}
          {!userRole && (
            <ListItem button component={Link} to="/login">
              <ListItemText primary="Login" />
            </ListItem>
          )}
          {/* Add more items as needed */}
        </List>
      </div>
    </Drawer>
  )

  return (
    <AppBar position="static">
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={toggleDrawer(true)}
        >
          <MenuIcon />
        </IconButton>
        <Select
          value={selectedTeam.teams_id}
          onChange={(e) => handleTeamSwitch(teams.find((team) => team.teams_id === e.target.value))}
          displayEmpty
          renderValue={() => selectedTeam.teams_name}
        >
          {teams.map((team) => (
            <MenuItem key={team.teams_id} value={team.teams_id}>
              {team.teams_name}
            </MenuItem>
          ))}
        </Select>
      </Toolbar>
      <DrawerMenu />
    </AppBar>
  )
}

export default Navbar
