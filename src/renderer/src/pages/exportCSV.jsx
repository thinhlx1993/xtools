import React from 'react'
import { Button, Grid } from '@mui/material'
import { ipcMainConsumer } from '../helpers/api'
import { useSnackbar } from '../context/SnackbarContext'

const ExportCSV = ({ data }) => {
  const { openSnackbar } = useSnackbar()

  const convertToCSV = (objArray) => {
    const headers = [
      { label: 'username', key: 'username' },
      { label: 'password', key: 'password' },
      { label: 'fa', key: 'fa' },
      { label: 'proxy', key: 'proxy' },
      { label: 'gpt_key', key: 'gpt_key' },
      { label: 'cookies', key: 'cookies' },
      { label: 'status', key: 'status' },
      { label: 'main_profile', key: 'main_profile' },
      { label: 'followers', key: 'profile_data.followers' },
      { label: 'verify', key: 'profile_data.verify' },
      { label: 'monetizable', key: 'profile_data.monetizable' },
      { label: 'account status', key: 'profile_data.account_status' },
      { label: 'stripe', key: 'profile_data.stripe_connect_account' },
      { label: 'suspended', key: 'profile_data.suspended' },
      { label: 'phone required', key: 'profile_data.phone_require' },
      { label: 'view', key: 'profile_data.view' }
    ]
    const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray
    let str = `${headers.map((header) => header.label).join(',')}\n`

    for (const obj of array) {
      let line = ''
      for (const header of headers) {
        if (line !== '') line += ','

        // Use reduce to navigate through the nested properties, with a check for existence of `acc`
        const resolvedKey = header.key.split('.').reduce((acc, currentKey) => {
          // Check if `acc` exists and has the property `currentKey`
          if (acc && typeof acc === 'object' && currentKey in acc) {
            return acc[currentKey]
          } else {
            // Handle the case where `acc` does not exist or does not have `currentKey`
            // You can return `acc` itself, a default value, or any other appropriate fallback
            return '' // Assuming an empty string as fallback if `acc` or `acc[currentKey]` does not exist
          }
        }, obj)

        line += `"${resolvedKey}"`
      }
      str += line + '\r\n'
    }

    return str
  }

  const downloadCSV = () => {
    const csvData = convertToCSV(data)
    ipcMainConsumer.emit('downloadCSV', csvData)
    openSnackbar('Exported into the clipboard', 'success')
    // const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
    // const link = document.createElement('a')
    // const url = URL.createObjectURL(blob)
    // link.setAttribute('href', url)
    // link.setAttribute('download', 'exportedData.csv')
    // link.style.visibility = 'hidden'
    // document.body.appendChild(link)
    // link.click()
    // document.body.removeChild(link)
  }
  return (
    <Grid item>
      <Button variant="contained" color="primary" onClick={() => downloadCSV()}>
        Export
      </Button>
    </Grid>
  )
  //   return <button onClick={() => downloadCSV()}>Save CSV</button>
}

export default ExportCSV
