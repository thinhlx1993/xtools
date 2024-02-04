import { useEffect, useState } from 'react'
import { Container } from '@mui/material'
import Header from './Header'
import Body from './Body'
import Footer from './Footer'
import { ipcMainConsumer, initIpcMainConsumer } from './helpers/api'
import LoginForm from './pages/Login'
import AppConfig from './config/enums'
import { HashRouter, Routes, Route } from 'react-router-dom'
import Navbar from './layouts/nav'
import AdminComponent from './pages/DefaultAdminPage'
import TeamsPage from './pages/TeamsPage'
import GroupsPage from './pages/GroupsPage'
import ProfilesPage from './pages/ProfilesPage'
import UsersPage from './pages/UsersPage'
import RegistrationPage from './pages/Register'
import SettingsPage from './pages/SettingsPage'
import { SnackbarProvider } from './context/SnackbarContext'
import MissionPage from './pages/missionPage'
import EventPage from './pages/EventsPage'
import HMAUsersPage from './pages/HMAUsersPage'

const ClientDashboard = () => {
  return (
    <Container>
      <Header />
      <Body />
      <Footer />
    </Container>
  )
}

const App = () => {
  const [keyActivation, setKeyActivation] = useState({ key: '', status: 'Đang kiểm tra' })
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole'))
  const [userSuperAdmin, setUserSuperAdmin] = useState(false)

  useEffect(() => {
    initIpcMainConsumer()
    // ipcMainConsumer.emit('getKeyActivation')
    // ipcMainConsumer.on('replyGetKeyActivation', (event, result) => {
    //   setKeyActivation(result.key)
    // })
    console.log('init app')
    // worker for mission schedule
    fetchUserRole()
    ipcMainConsumer.emit('performScheduledTasks')
  }, [])

  const handleCopyKey = () => {
    navigator.clipboard.writeText(keyActivation.key)
  }

  const handleLogout = () => {
    // Add any additional logout logic if needed
    setUserRole(null)
    setUserSuperAdmin(false)
    localStorage.clear()
    ipcMainConsumer.emit('setAccessToken', '')
  }

  const updateUserRole = async () => {
    // Add any additional logout logic if needed
    const userRole = await fetchUserRole()
    localStorage.setItem('userRole', userRole)
    setUserRole(userRole)
  }

  const handleLogin = async (username, password, deviceId) => {
    localStorage.clear()
    const response = await fetch(`${AppConfig.BASE_URL}/user/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username: username, password: password, device_id: deviceId })
    })
    if (response.ok) {
      const data = await response.json()
      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token)
        localStorage.setItem('refresh_token', data.refresh_token)
        ipcMainConsumer.emit('setAccessToken', data.access_token)
        // Then fetch the user role
        const userRole = await fetchUserRole()
        localStorage.setItem('userRole', userRole)
        return { userRole, data }
      }
    } else {
      const data = await response.json()
      const userRole = ''
      return { userRole, data }
    }
  }

  const fetchUserRole = async () => {
    if (localStorage.getItem('access_token')) {
      // Fetch the user role using the access_token
      const response = await fetch(`${AppConfig.BASE_URL}/user/info`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      const data = await response.json()
      if (data.is_super_admin) {
        setUserSuperAdmin(true)
      }

      if (data.is_admin === true) {
        setUserRole('admin')
        return 'admin'
      } else {
        setUserRole('user')
        return 'user'
      }
    } else {
      return ''
    }
  }

  return (
    <SnackbarProvider>
      <HashRouter>
        <Navbar
          onLogout={handleLogout}
          userRole={userRole}
          userSuperAdmin={userSuperAdmin}
          updateUserRole={updateUserRole}
        />
        <Routes>
          <Route path="/login" element={<LoginForm onLogin={handleLogin} />} />
          <Route path="/registration" element={<RegistrationPage />} />
          <Route path="/client" element={<ClientDashboard />} />
          <Route path="/admin" element={<AdminComponent />} />
          <Route path="/admin/profiles" element={<ProfilesPage />} />
          <Route path="/admin/events" element={<EventPage />} />
          <Route path="/admin/teams" element={<TeamsPage />} />
          <Route path="/admin/groups" element={<GroupsPage />} />
          <Route path="/admin/users" element={<UsersPage />} />
          <Route path="/admin/hma" element={<HMAUsersPage />} />
          <Route path="/admin/missions" element={<MissionPage />} />
          <Route path="/admin/settings" element={<SettingsPage />} />
        </Routes>
      </HashRouter>
    </SnackbarProvider>
  )
}

export default App
