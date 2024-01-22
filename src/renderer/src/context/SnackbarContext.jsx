import React, { createContext, useContext, useState } from 'react'
import { Snackbar, Alert } from '@mui/material'

const SnackbarContext = createContext()

export const useSnackbar = () => useContext(SnackbarContext)

export const SnackbarProvider = ({ children }) => {
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' })

  const openSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity })
  }

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  return (
    <SnackbarContext.Provider value={{ openSnackbar, closeSnackbar }}>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={closeSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      {children}
    </SnackbarContext.Provider>
  )
}
